import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

/**
 * Arcwell Task Routes
 * Manages tasks within projects owned by the
 * currently authenticated user.
 * Every endpoint requires authentication.
 * Project ownership is verified before any task
 * information is accessed or modified.
 */

export const tasksRouter = Router()

// Protect every task endpoint.
tasksRouter.use(requireAuth)

/**
 * Validation schemas
 */

// Validate project and task IDs.
const uuidSchema = z.uuid()

// Validate the information required to create a task.
const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z.iso.datetime({ offset: true }).nullable().optional()
}).strict()

// Validate changes to an existing task.
const updateTaskSchema = createTaskSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided' }
  )

/**
 * Fields returned to the frontend.
 * Keeping this selection consistent prevents
 * accidentally exposing unrelated database fields.
 */
const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  projectId: true,
  createdAt: true,
  updatedAt: true
} as const

/**
 * Verify that the authenticated user owns a project.
 * Returns false for projects that do not exist
 * or belong to another account.
 */
async function ownsProject(projectId: string, ownerId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId
    },
    select: {
      id: true
    }
  })

  return project !== null
}

/**
 * POST /api/projects/:projectId/tasks
 * Creates a task inside a project owned by the user.
 */
tasksRouter.post('/:projectId/tasks', async (req, res) => {
  const ownerId = req.session.userId

  if (!ownerId) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    })
  }

  // Validate the project ID.
  const projectIdResult = uuidSchema.safeParse(req.params.projectId)

  if (!projectIdResult.success) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid project ID'
    })
  }

  // Validate the submitted task information.
  const result = createTaskSchema.safeParse(req.body)

  if (!result.success) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid task information',
      errors: result.error.flatten()
    })
  }

  try {
    const projectId = projectIdResult.data

    // Ensure the project belongs to the logged-in user.
    if (!(await ownsProject(projectId, ownerId))) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      })
    }

    // Create the task within the authorized project.
    const task = await prisma.task.create({
      data: {
        title: result.data.title,
        description: result.data.description,
        status: result.data.status ?? 'TODO',
        priority: result.data.priority ?? 'MEDIUM',
        dueDate: result.data.dueDate
          ? new Date(result.data.dueDate)
          : null,
        project: {
          connect: {
            id: projectId
          }
        }
      },
      select: taskSelect
    })

    return res.status(201).json({
      status: 'success',
      message: 'Task created successfully',
      task
    })
  } catch (error) {
    console.error('Task creation failed:', error)

    return res.status(500).json({
      status: 'error',
      message: 'Unable to create task'
    })
  }
})

/**
 * GET /api/projects/:projectId/tasks
 * Retrieves all tasks belonging to a project.
 */
tasksRouter.get('/:projectId/tasks', async (req, res) => {
  const ownerId = req.session.userId

  if (!ownerId) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    })
  }

  const projectIdResult = uuidSchema.safeParse(req.params.projectId)

  if (!projectIdResult.success) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid project ID'
    })
  }

  try {
    const projectId = projectIdResult.data

    // Do not expose tasks from another user's project.
    if (!(await ownsProject(projectId, ownerId))) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      })
    }

    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        project: {
          ownerId
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: taskSelect
    })

    return res.status(200).json({
      status: 'success',
      tasks
    })
  } catch (error) {
    console.error('Task retrieval failed:', error)

    return res.status(500).json({
      status: 'error',
      message: 'Unable to retrieve tasks'
    })
  }
})

/**
 * GET /api/projects/:projectId/tasks/:taskId
 * Retrieves a single task belonging to the user.
 */
tasksRouter.get('/:projectId/tasks/:taskId', async (req, res) => {
  const ownerId = req.session.userId

  if (!ownerId) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    })
  }

  // Validate both URL parameters.
  const projectIdResult = uuidSchema.safeParse(req.params.projectId)
  const taskIdResult = uuidSchema.safeParse(req.params.taskId)

  if (!projectIdResult.success || !taskIdResult.success) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid project or task ID'
    })
  }

  try {
    // Match task ID, project ID, and project owner.
    const task = await prisma.task.findFirst({
      where: {
        id: taskIdResult.data,
        projectId: projectIdResult.data,
        project: {
          ownerId
        }
      },
      select: taskSelect
    })

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      })
    }

    return res.status(200).json({
      status: 'success',
      task
    })
  } catch (error) {
    console.error('Task lookup failed:', error)

    return res.status(500).json({
      status: 'error',
      message: 'Unable to retrieve task'
    })
  }
})

/**
 * PATCH /api/projects/:projectId/tasks/:taskId
 * Updates a task belonging to the authenticated user.
 */
tasksRouter.patch('/:projectId/tasks/:taskId', async (req, res) => {
  const ownerId = req.session.userId

  if (!ownerId) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    })
  }

  const projectIdResult = uuidSchema.safeParse(req.params.projectId)
  const taskIdResult = uuidSchema.safeParse(req.params.taskId)

  if (!projectIdResult.success || !taskIdResult.success) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid project or task ID'
    })
  }

  // Validate the submitted changes.
  const result = updateTaskSchema.safeParse(req.body)

  if (!result.success) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid task information',
      errors: result.error.flatten()
    })
  }

  try {
    // Update only a task belonging to a project owned by the user.
    const updateResult = await prisma.task.updateMany({
      where: {
        id: taskIdResult.data,
        projectId: projectIdResult.data,
        project: {
          ownerId
        }
      },
      data: {
        ...result.data,
        dueDate: result.data.dueDate === undefined
          ? undefined
          : result.data.dueDate === null
            ? null
            : new Date(result.data.dueDate)
      }
    })

    if (updateResult.count === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      })
    }

    // Retrieve the updated task for the frontend.
    const task = await prisma.task.findFirst({
      where: {
        id: taskIdResult.data,
        projectId: projectIdResult.data,
        project: {
          ownerId
        }
      },
      select: taskSelect
    })

    return res.status(200).json({
      status: 'success',
      message: 'Task updated successfully',
      task
    })
  } catch (error) {
    console.error('Task update failed:', error)

    return res.status(500).json({
      status: 'error',
      message: 'Unable to update task'
    })
  }
})

/**
 * DELETE /api/projects/:projectId/tasks/:taskId
 * Permanently deletes an authorized task.
 */
tasksRouter.delete('/:projectId/tasks/:taskId', async (req, res) => {
  const ownerId = req.session.userId

  if (!ownerId) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    })
  }

  const projectIdResult = uuidSchema.safeParse(req.params.projectId)
  const taskIdResult = uuidSchema.safeParse(req.params.taskId)

  if (!projectIdResult.success || !taskIdResult.success) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid project or task ID'
    })
  }

  try {
    // Delete only a task within a project owned by the user.
    const deleteResult = await prisma.task.deleteMany({
      where: {
        id: taskIdResult.data,
        projectId: projectIdResult.data,
        project: {
          ownerId
        }
      }
    })

    if (deleteResult.count === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      })
    }

    return res.status(200).json({
      status: 'success',
      message: 'Task deleted successfully'
    })
  } catch (error) {
    console.error('Task deletion failed:', error)

    return res.status(500).json({
      status: 'error',
      message: 'Unable to delete task'
    })
  }
})