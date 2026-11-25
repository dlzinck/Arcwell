import { useEffect, useState } from 'react'
import { deleteTask, getTasks, updateTask,} from '../lib/tasks'
import { TaskForm } from './TaskForm'
import type { Task, TaskStatus } from '../types/tasks'

/**
 * Arcwell Task Dashboard
 * Displays and manages tasks belonging to one project.
 * Features:
 *  Load tasks from our protected Express API.
 *  Create, edit, and delete tasks.
 *  Quickly mark tasks as completed or reopen them.
 *  Filter tasks by status.
 *  Display task priority and deadlines.
 *  Calculate project completion progress.
 * The backend verifies ownership for every request.
 */

interface TaskDashboardProps {
  projectId: string
}

/**
 * Human-readable labels for task statuses.
 */
const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
}

/**
 * Returns the appropriate styling for a task's status.
 */
function getStatusStyles(status: TaskStatus): string {
  switch (status) {
    case 'TODO':
      return 'border-slate-600 bg-slate-800 text-slate-300'

    case 'IN_PROGRESS':
      return 'border-blue-800 bg-blue-950/50 text-blue-300'

    case 'COMPLETED':
      return 'border-emerald-800 bg-emerald-950/50 text-emerald-300'
  }
}

/**
 * Returns styling based on task priority.
 */
function getPriorityStyles(priority: Task['priority']): string {
  switch (priority) {
    case 'LOW':
      return 'border-slate-700 bg-slate-800 text-slate-300'

    case 'MEDIUM':
      return 'border-amber-800 bg-amber-950/50 text-amber-300'

    case 'HIGH':
      return 'border-red-800 bg-red-950/50 text-red-300'
  }
}

/**
 * Formats a task deadline for the customer's local time zone.
 */
function formatDueDate(date: string): string {
  return new Date(date).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Checks whether a task has passed its deadline.
 * Completed tasks are never marked overdue.
 */
function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'COMPLETED') {
    return false
  }

  return new Date(task.dueDate).getTime() < Date.now()
}

export function TaskDashboard({ projectId }: TaskDashboardProps) {
  // Stores tasks retrieved from the backend.
  const [tasks, setTasks] = useState<Task[]>([])

  // Tracks initial loading and API errors.
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Controls the task creation form.
  const [isCreatingTask, setIsCreatingTask] = useState(false)

  // Stores the task currently being edited.
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Stores the task awaiting deletion confirmation.
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)

  // Tracks deletion requests and errors.
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Tracks which task is currently updating its status.
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(
    null
  )

  // Filters tasks without requesting them again.
  const [statusFilter, setStatusFilter] = useState<
    TaskStatus | 'ALL'
  >('ALL')

  /**
   * Loads tasks whenever the selected project changes.
   */
  useEffect(() => {
    let isActive = true

    async function loadTasks() {
      setIsLoading(true)
      setError('')
      setTasks([])

      // Reset project-specific UI state.
      setIsCreatingTask(false)
      setEditingTask(null)
      setDeletingTask(null)
      setDeleteError('')
      setStatusFilter('ALL')

      try {
        const response = await getTasks(projectId)

        if (isActive) {
          setTasks(response.tasks)
        }
      } catch (error) {
        console.error('Failed to load tasks:', error)

        if (isActive) {
          setError('Unable to load tasks. Please try again.')
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadTasks()

    // Prevent outdated requests from updating state.
    return () => {
      isActive = false
    }
  }, [projectId])

  /**
   * Adds a newly created task to the dashboard.
   */
  function handleTaskCreated(task: Task) {
    setTasks((currentTasks) => [task, ...currentTasks])
    setIsCreatingTask(false)
  }

  /**
   * Replaces an edited task with its updated version.
   */
  function handleTaskUpdated(updatedTask: Task) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === updatedTask.id ? updatedTask : task
      )
    )

    setEditingTask(null)
  }

  /**
   * Opens the creation form.
   */
  function handleCreateTask() {
    setEditingTask(null)
    setDeletingTask(null)
    setIsCreatingTask(true)
  }

  /**
   * Opens the editing form for the selected task.
   */
  function handleEditTask(task: Task) {
    setIsCreatingTask(false)
    setDeletingTask(null)
    setEditingTask(task)
  }

  /**
   * Updates task status immediately after a successful
   * API request, without refreshing the page.
   */
  async function handleChangeStatus(
    task: Task,
    newStatus: TaskStatus
  ) {
    if (updatingTaskId || isDeleting || task.status === newStatus) {
      return
    }

    setUpdatingTaskId(task.id)
    setError('')

    try {
      const response = await updateTask(projectId, task.id, {
        status: newStatus,
      })

      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === task.id
            ? response.task
            : currentTask
        )
      )
    } catch (error) {
      console.error('Failed to update task status:', error)

      setError(
        'Unable to update the task status. Please try again.'
      )
    } finally {
      setUpdatingTaskId(null)
    }
  }

  /**
   * Opens deletion confirmation without deleting anything.
   */
  function handleRequestDelete(task: Task) {
    if (isDeleting || updatingTaskId) return

    setIsCreatingTask(false)
    setEditingTask(null)
    setDeleteError('')
    setDeletingTask(task)
  }

  /**
   * Cancels task deletion.
   */
  function handleCancelDelete() {
    if (isDeleting) return

    setDeletingTask(null)
    setDeleteError('')
  }

  /**
   * Permanently deletes a task after confirmation.
   */
  async function handleConfirmDelete() {
    if (!deletingTask || isDeleting) return

    setIsDeleting(true)
    setDeleteError('')

    try {
      await deleteTask(projectId, deletingTask.id)

      setTasks((currentTasks) =>
        currentTasks.filter(
          (task) => task.id !== deletingTask.id
        )
      )

      setDeletingTask(null)
    } catch (error) {
      console.error('Failed to delete task:', error)

      setDeleteError(
        'Unable to delete this task. Please try again.'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  // Calculate progress using all project tasks.
  const totalTasks = tasks.length

  const completedTasks = tasks.filter(
    (task) => task.status === 'COMPLETED'
  ).length

  const inProgressTasks = tasks.filter(
    (task) => task.status === 'IN_PROGRESS'
  ).length

  const completionPercentage =
    totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 100)

  // Filter the displayed tasks without changing the original list.
  const visibleTasks = tasks.filter(
    (task) =>
      statusFilter === 'ALL' || task.status === statusFilter
  )

  return (
    <section className="w-full">
      {/* Dashboard heading and task creation action */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white">
            Project tasks
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            Organize your work and track your progress.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateTask}
          disabled={isLoading || isDeleting}
          className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + New task
        </button>
      </div>

      {/* Overall project progress */}
      {!isLoading && !error && (
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-lg font-semibold text-white">
                Project progress
              </h4>

              <p className="mt-1 text-sm text-slate-400">
                {completedTasks} of {totalTasks} tasks completed
              </p>
            </div>

            <span className="text-2xl font-bold text-emerald-400">
              {completionPercentage}%
            </span>
          </div>

          {/* Accessible progress indicator */}
          <div
            role="progressbar"
            aria-label="Project completion"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={completionPercentage}
            className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800"
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-400">
            <span>Total: {totalTasks}</span>
            <span>In progress: {inProgressTasks}</span>
            <span>Completed: {completedTasks}</span>
          </div>
        </div>
      )}

      {/* Task creation form */}
      {isCreatingTask && (
        <TaskForm
          key={`create-${projectId}`}
          projectId={projectId}
          onTaskSaved={handleTaskCreated}
          onCancel={() => setIsCreatingTask(false)}
        />
      )}

      {/* Task editing form */}
      {editingTask && (
        <TaskForm
          key={editingTask.id}
          projectId={projectId}
          task={editingTask}
          onTaskSaved={handleTaskUpdated}
          onCancel={() => setEditingTask(null)}
        />
      )}

      {/* Task deletion confirmation */}
      {deletingTask && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-task-title"
          aria-describedby="delete-task-description"
          className="mb-6 rounded-2xl border border-red-800 bg-slate-950 p-6"
        >
          <h4
            id="delete-task-title"
            className="text-xl font-semibold text-white"
          >
            Delete task?
          </h4>

          <p
            id="delete-task-description"
            className="mt-3 text-sm text-slate-300"
          >
            Are you sure you want to permanently delete{' '}
            <strong className="text-white">
              {deletingTask.title}
            </strong>
            ? This action cannot be undone.
          </p>

          {deleteError && (
            <p role="alert" className="mt-4 text-sm text-red-400">
              {deleteError}
            </p>
          )}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={handleCancelDelete}
              disabled={isDeleting}
              className="rounded-lg border border-slate-700 px-5 py-3 font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="rounded-lg bg-red-700 px-5 py-3 font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete permanently'}
            </button>
          </div>
        </div>
      )}

      {/* Loading and error states */}
      {isLoading ? (
        <p role="status" className="text-slate-400">
          Loading tasks...
        </p>
      ) : error ? (
        <p role="alert" className="mb-5 text-red-400">
          {error}
        </p>
      ) : null}

      {/* Task filters */}
      {!isLoading && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <label
            htmlFor="task-status-filter"
            className="text-sm font-medium text-slate-300"
          >
            Filter by status
          </label>

          <select
            id="task-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as TaskStatus | 'ALL'
              )
            }
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500"
          >
            <option value="ALL">All tasks</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      )}

      {/* Task list */}
      {!isLoading && !error && (
        visibleTasks.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <h4 className="text-xl font-semibold text-white">
              {totalTasks === 0
                ? 'No tasks yet'
                : 'No matching tasks'}
            </h4>

            <p className="mt-3 text-sm text-slate-400">
              {totalTasks === 0
                ? 'Create your first task to start organizing this project.'
                : 'Try selecting a different status filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleTasks.map((task) => (
              <article
                key={task.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {/* Task title */}
                    <h4
                      className={`text-lg font-semibold ${
                        task.status === 'COMPLETED'
                          ? 'text-slate-400 line-through'
                          : 'text-white'
                      }`}
                    >
                      {task.title}
                    </h4>

                    {/* Optional task description */}
                    {task.description && (
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-400">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Status and priority indicators */}
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusStyles(task.status)}`}
                    >
                      {STATUS_LABELS[task.status]}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${getPriorityStyles(task.priority)}`}
                    >
                      {task.priority.charAt(0) +
                        task.priority.slice(1).toLowerCase()}{' '}
                      priority
                    </span>
                  </div>
                </div>

                {/* Due date and overdue warning */}
                {task.dueDate && (
                  <p
                    className={`mt-4 text-sm ${
                      isTaskOverdue(task)
                        ? 'font-medium text-red-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {isTaskOverdue(task) ? 'Overdue: ' : 'Due: '}
                    {formatDueDate(task.dueDate)}
                  </p>
                )}

                {/* Task management actions */}
                <div className="mt-5 flex flex-wrap gap-3">
                  {/* Quick completion toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      void handleChangeStatus(
                        task,
                        task.status === 'COMPLETED'
                          ? 'TODO'
                          : 'COMPLETED'
                      )
                    }
                    disabled={
                      Boolean(updatingTaskId) || isDeleting
                    }
                    className="rounded-lg border border-emerald-800 px-4 py-2 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updatingTaskId === task.id
                      ? 'Updating...'
                      : task.status === 'COMPLETED'
                        ? 'Reopen task'
                        : 'Mark complete'}
                  </button>

                  {/* Open editing form */}
                  <button
                    type="button"
                    onClick={() => handleEditTask(task)}
                    disabled={isDeleting || Boolean(updatingTaskId)}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    Edit
                  </button>

                  {/* Open deletion confirmation */}
                  <button
                    type="button"
                    onClick={() => handleRequestDelete(task)}
                    disabled={isDeleting || Boolean(updatingTaskId)}
                    className="rounded-lg border border-red-900 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-950 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )
      )}
    </section>
  )
}