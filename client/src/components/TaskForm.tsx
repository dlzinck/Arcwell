import { useState } from 'react'
import { createTask, updateTask } from '../lib/tasks'
import type {
  Task,
  TaskInput,
  TaskPriority,
  TaskStatus,
} from '../types/tasks'

/**
 * Arcwell Task Form
 * Reusable component for creating and editing tasks.
 * The parent component supplies the project ID and,
 * when editing, the existing task.
 * The backend remains responsible for authentication,
 * validation, and project ownership checks.
 */

interface TaskFormProps {
  projectId: string
  task?: Task
  onTaskSaved: (task: Task) => void
  onCancel: () => void
}

/**
 * Converts an API date into the format required by
 * an HTML datetime-local input.
 * We use local date/time values so customers can
 * enter deadlines in their own time zone.
 */
function formatDateForInput(date: string | null): string {
  if (!date) return ''

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) return ''

  const pad = (value: number) => String(value).padStart(2, '0')

  return [
    parsedDate.getFullYear(),
    '-',
    pad(parsedDate.getMonth() + 1),
    '-',
    pad(parsedDate.getDate()),
    'T',
    pad(parsedDate.getHours()),
    ':',
    pad(parsedDate.getMinutes()),
  ].join('')
}

/**
 * Converts a local date/time into an ISO timestamp
 * accepted by our Express API.
 */
function formatDateForApi(date: string): string | null {
  if (!date) return null

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error('Please enter a valid due date.')
  }

  return parsedDate.toISOString()
}

export function TaskForm({
  projectId,
  task,
  onTaskSaved,
  onCancel,
}: TaskFormProps) {
  // Determines whether the form creates or edits a task.
  const isEditing = Boolean(task)

  // Initialize fields using existing task data when editing.
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(
    task?.description ?? ''
  )
  const [status, setStatus] = useState<TaskStatus>(
    task?.status ?? 'TODO'
  )
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? 'MEDIUM'
  )
  const [dueDate, setDueDate] = useState(
    formatDateForInput(task?.dueDate ?? null)
  )

  // Tracks requests and displays submission errors.
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  /**
   * Validates and saves the task.
   * A successful request updates the parent component
   * without requiring a full page refresh.
   */
  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (isSaving) return

    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      setError('Please enter a task title.')
      return
    }

    if (trimmedTitle.length > 200) {
      setError('Task titles cannot exceed 200 characters.')
      return
    }

    if (description.length > 2000) {
      setError('Descriptions cannot exceed 2000 characters.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const taskData: TaskInput = {
        title: trimmedTitle,
        description: description.trim() || null,
        status,
        priority,
        dueDate: formatDateForApi(dueDate),
      }

      // Use the appropriate API endpoint for the action.
      const response =
        isEditing && task
          ? await updateTask(projectId, task.id, taskData)
          : await createTask(projectId, taskData)

      // Notify the parent so it can update the task list.
      onTaskSaved(response.task)
    } catch (error) {
      console.error('Failed to save task:', error)

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to save this task. Please try again.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-lg"
    >
      {/* Form heading */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white">
          {isEditing ? 'Edit task' : 'Create a new task'}
        </h3>

        <p className="mt-2 text-sm text-slate-400">
          {isEditing
            ? 'Update the details of your task.'
            : 'Add a task to organize your project.'}
        </p>
      </div>

      <div className="space-y-5">
        {/* Task title */}
        <div>
          <label
            htmlFor="task-title"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Task title
          </label>

          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            placeholder="What needs to be done?"
            required
            disabled={isSaving}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 disabled:opacity-50"
          />
        </div>

        {/* Optional description */}
        <div>
          <label
            htmlFor="task-description"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Description
            <span className="ml-2 text-slate-500">(optional)</span>
          </label>

          <textarea
            id="task-description"
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            maxLength={2000}
            rows={4}
            placeholder="Add instructions or additional details..."
            disabled={isSaving}
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 disabled:opacity-50"
          />
        </div>

        {/* Task status and priority */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="task-status"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Status
            </label>

            <select
              id="task-status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as TaskStatus)
              }
              disabled={isSaving}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500 disabled:opacity-50"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="task-priority"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Priority
            </label>

            <select
              id="task-priority"
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as TaskPriority)
              }
              disabled={isSaving}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500 disabled:opacity-50"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>

        {/* Optional due date */}
        <div>
          <label
            htmlFor="task-due-date"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Due date
            <span className="ml-2 text-slate-500">(optional)</span>
          </label>

          <input
            id="task-due-date"
            type="datetime-local"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            disabled={isSaving}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500 disabled:opacity-50"
          />

          <p className="mt-2 text-xs text-slate-500">
            Deadlines use your local date and time.
          </p>
        </div>
      </div>

      {/* Submission errors */}
      {error && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-400"
        >
          {error}
        </p>
      )}

      {/* Form actions */}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-lg border border-slate-700 px-5 py-3 font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving
            ? 'Saving...'
            : isEditing
              ? 'Save changes'
              : 'Create task'}
        </button>
      </div>
    </form>
  )
}