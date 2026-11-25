/**
 * Arcwell Task Types
 * Defines the structure of tasks exchanged between
 * our React frontend and Express backend.
 */

// The three possible stages of a task.
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED'

// The three possible priority levels.
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

/**
 * Represents a task stored in PostgreSQL.
 */
export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  projectId: string
  createdAt: string
  updatedAt: string
}

/**
 * Information submitted when creating a task.
 */
export interface TaskInput {
  title: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  dueDate?: string | null
}

/**
 * Response containing multiple tasks.
 */
export interface TasksResponse {
  status: string
  tasks: Task[]
}

/**
 * Response containing one task.
 */
export interface TaskResponse {
  status: string
  message?: string
  task: Task
}