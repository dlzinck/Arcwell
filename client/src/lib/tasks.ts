import type { Task, TaskInput } from '../types/tasks'

/**
 * Arcwell Task API
 * Handles communication between the React frontend
 * and our Express backend.
 * Every request includes the user's session cookie
 * so the backend can verify authentication and
 * project ownership.
 */

// Base URL for our Express API.
const API_BASE_URL = 'http://localhost:3000/api'

/**
 * Represents the task data returned by the backend.
 */
interface TaskResponse {
  task: Task
}

/**
 * Represents a collection of tasks returned by the backend.
 */
interface TasksResponse {
  tasks: Task[]
}

/**
 * Handles API responses consistently.
 * If the server returns an unsuccessful HTTP status,
 * we extract its error message when available.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = 'Something went wrong. Please try again.'

    try {
      const errorData: { error?: string; message?: string } =
        await response.json()

      errorMessage =
        errorData.error || errorData.message || errorMessage
    } catch {
      // Keep the default message if the response is not JSON.
    }

    throw new Error(errorMessage)
  }

  return response.json() as Promise<T>
}

/**
 * Retrieves all tasks belonging to a project.
 * GET /api/projects/:projectId/tasks
 */
export async function getTasks(
  projectId: string
): Promise<TasksResponse> {
  const response = await fetch(
    `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/tasks`,
    {
      method: 'GET',
      credentials: 'include',
    }
  )

  return handleResponse<TasksResponse>(response)
}

/**
 * Retrieves one specific task.
 * GET /api/projects/:projectId/tasks/:taskId
 */
export async function getTask(
  projectId: string,
  taskId: string
): Promise<TaskResponse> {
  const response = await fetch(
    `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`,
    {
      method: 'GET',
      credentials: 'include',
    }
  )

  return handleResponse<TaskResponse>(response)
}

/**
 * Creates a new task inside a project.
 * POST /api/projects/:projectId/tasks
 */
export async function createTask(
  projectId: string,
  taskData: TaskInput
): Promise<TaskResponse> {
  const response = await fetch(
    `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/tasks`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    }
  )

  return handleResponse<TaskResponse>(response)
}

/**
 * Updates an existing task.
 * PATCH /api/projects/:projectId/tasks/:taskId
 * Partial<TaskInput> allows us to update only
 * the fields that have changed.
 */
export async function updateTask(
  projectId: string,
  taskId: string,
  taskData: Partial<TaskInput>
): Promise<TaskResponse> {
  const response = await fetch(
    `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    }
  )

  return handleResponse<TaskResponse>(response)
}

/**
 * Permanently deletes a task.
 * DELETE /api/projects/:projectId/tasks/:taskId
 */
export async function deleteTask(
  projectId: string,
  taskId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  )

  if (!response.ok) {
    await handleResponse<unknown>(response)
  }
}