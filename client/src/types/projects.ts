/**
 * Represents a project belonging to an Arcwell user.
 * These properties correspond to the project information
 * returned by our Express API.
 */
export interface Project {
  // Unique identifier assigned by PostgreSQL.
  id: string

  // Name displayed in the project dashboard.
  name: string

  // Optional description of the project.
  description: string | null

  // Date and time when the project was created.
  // JSON responses represent dates as ISO strings.
  createdAt: string

  // Date and time when the project was last updated.
  updatedAt: string
}

/**
 * Represents the API response when retrieving projects.
 */
export interface ProjectsResponse {
  // Indicates whether the request succeeded.
  status: 'success'

  // Projects belonging to the authenticated user.
  projects: Project[]
}

/**
 * Represents the API response when retrieving,
 * creating, or updating an individual project.
 */
export interface ProjectResponse {
  status: 'success'

  // Optional success message from the backend.
  message?: string

  // Project returned by the backend.
  project: Project
}

/**
 * Represents the information submitted when
 * creating or editing a project.
 */
export interface ProjectInput {
  name: string
  description: string
}