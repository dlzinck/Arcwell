import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

/**
 * Arcwell Project Routes
 *
 * Handles project management operations.
 * Every route requires an authenticated user.
 */

// Create the router for project-related endpoints.
export const projectsRouter = Router()

// Protect all routes registered on this router.
projectsRouter.use(requireAuth)

/**
 * Validate information submitted when creating a project.
 *
 * The name is required, while the description is optional.
 */
const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).optional()
})

/**
 * POST /api/projects
 *
 * Creates a project owned by the authenticated user.
 */
projectsRouter.post('/', async (req, res) => {
  // Retrieve the user ID stored in the login session.
  const ownerId = req.session.userId

  // Reject requests without a session user ID.
  // This also helps TypeScript narrow the value to a string.
  if (!ownerId) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    })
  }

  // Validate the submitted project information.
  const result = createProjectSchema.safeParse(req.body)

  // Reject invalid project information.
  if (!result.success) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid project information',
      errors: result.error.flatten()
    })
  }

  try {
    // Create the project in PostgreSQL using Prisma.
    // The owner comes from the session, never the request body.
    const project = await prisma.project.create({
      data: {
        name: result.data.name,
        description: result.data.description,
        owner: {
          connect: {
            id: ownerId
          }
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Return the newly created project.
    return res.status(201).json({
      status: 'success',
      message: 'Project created successfully',
      project
    })
  } catch (error) {
    // Log unexpected errors on the server.
    console.error('Project creation failed:', error)

    // Return a safe error message to the client.
    return res.status(500).json({
      status: 'error',
      message: 'Unable to create project'
    })
  }
})

/**
 * GET /api/projects
 *
 * Retrieves projects belonging to the authenticated user.
 * Projects owned by other users are excluded.
 */
projectsRouter.get('/', async (req, res) => {
  // Retrieve the authenticated user's ID from their session.
  const ownerId = req.session.userId

  // Reject requests without a valid login session.
  if (!ownerId) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    })
  }

  try {
    // Retrieve only projects owned by the logged-in user.
    const projects = await prisma.project.findMany({
      where: {
        ownerId
      },

      // Show the most recently created projects first.
      orderBy: {
        createdAt: 'desc'
      },

      // Return only the fields needed by our frontend.
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Return the user's projects.
    // An empty array is valid if they have no projects.
    return res.status(200).json({
      status: 'success',
      projects
    })
  } catch (error) {
    // Log unexpected database errors for troubleshooting.
    console.error('Project retrieval failed:', error)

    // Avoid exposing internal database information.
    return res.status(500).json({
      status: 'error',
      message: 'Unable to retrieve projects'
    })
  }
})

/**
 * GET /api/projects/:id
 *
 * Retrieves one project belonging to the authenticated user.
 * A project owned by another user is not accessible.
 */
projectsRouter.get('/:id', async (req, res) => {
  // Retrieve the authenticated user's ID.
  const ownerId = req.session.userId

  // Confirm that the request has an authenticated session.
  if (!ownerId) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    })
  }

  // Validate the project ID from the URL.
  const projectIdResult = z.uuid().safeParse(req.params.id)

  if (!projectIdResult.success) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid project ID'
    })
  }

  try {
    // Search using BOTH the project ID and owner ID.
    // This prevents users from retrieving someone else's project.
    const project = await prisma.project.findFirst({
      where: {
        id: projectIdResult.data,
        ownerId
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Return 404 when the project does not exist
    // or belongs to another user.
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      })
    }

    // Return the project to its owner.
    return res.status(200).json({
      status: 'success',
      project
    })
  } catch (error) {
    // Log unexpected errors for debugging.
    console.error('Project lookup failed:', error)

    // Avoid exposing internal database information.
    return res.status(500).json({
      status: 'error',
      message: 'Unable to retrieve project'
    })
  }
})


/**
 * Validate the information submitted when updating a project.
 *
 * Both fields are optional because PATCH requests
 * should only change the fields provided by the user.
 *
 * At least one field must be included.
 */
const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(1000).nullable().optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one field must be provided'
  }
)

/**
 * PATCH /api/projects/:id
 *
 * Updates a project belonging to the authenticated user.
 */
projectsRouter.patch('/:id', async (req, res) => {
  // Retrieve the authenticated user's ID.
  const ownerId = req.session.userId

  // Reject requests without an authenticated session.
  if (!ownerId) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    })
  }

  // Validate the project ID from the URL.
  const projectIdResult = z.uuid().safeParse(req.params.id)

  if (!projectIdResult.success) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid project ID'
    })
  }

  // Validate the submitted changes.
  const result = updateProjectSchema.safeParse(req.body)

  if (!result.success) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid project information',
      errors: result.error.flatten()
    })
  }

  try {
    // Update only the project matching BOTH the ID and owner.
    // Prisma's updateMany prevents modifying another user's project.
    const updateResult = await prisma.project.updateMany({
      where: {
        id: projectIdResult.data,
        ownerId
      },
      data: result.data
    })

    // No matching project means it does not exist
    // or belongs to another account.
    if (updateResult.count === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      })
    }

    // Retrieve the updated project to return its current values.
    const project = await prisma.project.findFirst({
      where: {
        id: projectIdResult.data,
        ownerId
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Return the updated project.
    return res.status(200).json({
      status: 'success',
      message: 'Project updated successfully',
      project
    })
  } catch (error) {
    // Log unexpected database errors for troubleshooting.
    console.error('Project update failed:', error)

    // Return a safe error message.
    return res.status(500).json({
      status: 'error',
      message: 'Unable to update project'
    })
  }
})

/**
 * DELETE /api/projects/:id
 *
 * Deletes a project belonging to the authenticated user.
 *
 * PostgreSQL automatically deletes the project's tasks
 * because the relationship uses ON DELETE CASCADE.
 */
projectsRouter.delete('/:id', async (req, res) => {
  // Retrieve the authenticated user's ID from their session.
  const ownerId = req.session.userId

  // Reject requests from users who are not logged in.
  if (!ownerId) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    })
  }

  // Validate the project ID provided in the URL.
  const projectIdResult = z.uuid().safeParse(req.params.id)

  // Reject invalid project IDs before querying PostgreSQL.
  if (!projectIdResult.success) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid project ID'
    })
  }

  try {
    // Delete only a project owned by the authenticated user.
    // Both the project ID and owner ID must match.
    const deleteResult = await prisma.project.deleteMany({
      where: {
        id: projectIdResult.data,
        ownerId
      }
    })

    // Return the same response whether the project does not
    // exist or belongs to a different user.
    if (deleteResult.count === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      })
    }

    // Confirm that the project was successfully deleted.
    return res.status(200).json({
      status: 'success',
      message: 'Project deleted successfully'
    })
  } catch (error) {
    // Log unexpected errors for backend troubleshooting.
    console.error('Project deletion failed:', error)

    // Avoid exposing database details to the client.
    return res.status(500).json({
      status: 'error',
      message: 'Unable to delete project'
    })
  }
})