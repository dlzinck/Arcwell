import type {
  ProjectInput,
  ProjectResponse,
  ProjectsResponse
} from '../types/projects'

/**
 * Base URL for Arcwell's project API.
 * During development, Express runs on port 3000.
 */
const PROJECTS_API_URL = 'http://localhost:3000/api/projects'

/**
 * Retrieves all projects belonging to the logged-in user.
 * The browser includes the session cookie so Express
 * can identify which user's projects to return.
 */
export async function getProjects(): Promise<ProjectsResponse> {
  const response = await fetch(PROJECTS_API_URL, {
    method: 'GET',
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('Unable to load projects')
  }

  return response.json()
}

/**
 * Creates a new project for the authenticated user.
 */
export async function createProject(
  project: ProjectInput
): Promise<ProjectResponse> {
  const response = await fetch(PROJECTS_API_URL, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(project)
  })

  if (!response.ok) {
    throw new Error('Unable to create project')
  }

  return response.json()
}

/**
 * Updates an existing project.
 * The backend verifies that the logged-in user
 * owns the project before allowing changes.
 */
export async function updateProject(
  projectId: string,
  project: ProjectInput
): Promise<ProjectResponse> {
  const response = await fetch(
    `${PROJECTS_API_URL}/${encodeURIComponent(projectId)}`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(project)
    }
  )

  if (!response.ok) {
    throw new Error('Unable to update project')
  }

  return response.json()
}

/**
 * Deletes a project owned by the authenticated user.
 * Deleting a project also deletes its associated tasks
 * through our PostgreSQL cascading foreign key.
 */
export async function deleteProject(projectId: string): Promise<void> {
  const response = await fetch(
    `${PROJECTS_API_URL}/${encodeURIComponent(projectId)}`,
    {
      method: 'DELETE',
      credentials: 'include'
    }
  )

  if (!response.ok) {
    throw new Error('Unable to delete project')
  }
}