import { useEffect, useState } from 'react'
import { deleteProject, getProjects } from '../lib/projects'
import { ProjectForm } from './ProjectForm'
import { ProjectWorkspace } from './ProjectWorkspace'
import type { Project } from '../types/projects'

/**
 * Arcwell Project Dashboard
 * Main dashboard for authenticated users.
 * Customers can:
 *  View all projects they own.
 *  Create new projects.
 *  Edit existing projects.
 *  Delete projects after confirmation.
 *  Open a dedicated workspace for each project.
 * Project workspaces contain task management functionality.
 * All project data is retrieved from our protected Express API.
 * The backend verifies authentication and project ownership.
 */

export function ProjectDashboard() {
  // Stores projects returned by the backend.
  const [projects, setProjects] = useState<Project[]>([])

  // Tracks whether projects are being retrieved.
  const [isLoading, setIsLoading] = useState(true)

  // Stores errors encountered while loading projects.
  const [error, setError] = useState('')

  // Controls whether the project creation form is visible.
  const [isCreatingProject, setIsCreatingProject] = useState(false)

  // Stores the project currently being edited.
  const [editingProject, setEditingProject] =
    useState<Project | null>(null)

  // Stores the project awaiting deletion confirmation.
  const [deletingProject, setDeletingProject] =
    useState<Project | null>(null)

  // Tracks whether a deletion request is running.
  const [isDeleting, setIsDeleting] = useState(false)

  // Stores errors encountered while deleting a project.
  const [deleteError, setDeleteError] = useState('')

  /**
   * Stores the ID of the currently opened project workspace.
   * Null means the customer is viewing the main dashboard.
   * We store the ID instead of a separate Project object
   * so the workspace always receives the latest project data.
   */
  const [selectedProjectId, setSelectedProjectId] =
    useState<string | null>(null)

  /**
   * Retrieves projects when the dashboard first appears.
   */
  useEffect(() => {
    // Prevent outdated requests from updating React state.
    let isActive = true

    async function loadProjects() {
      try {
        // Request projects belonging to the authenticated user.
        const response = await getProjects()

        if (isActive) {
          setProjects(response.projects)
        }
      } catch (error) {
        console.error('Failed to load projects:', error)

        if (isActive) {
          setError(
            'Unable to load your projects. Please try again.'
          )
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadProjects()

    // Ignore responses after the component unmounts.
    return () => {
      isActive = false
    }
  }, [])

  /**
   * Handles a successfully created project.
   * Adds the project to React state without refreshing.
   */
  function handleProjectCreated(project: Project) {
    setProjects((currentProjects) => [
      project,
      ...currentProjects,
    ])

    setIsCreatingProject(false)
  }

  /**
   * Handles a successfully updated project.
   * Replaces the previous project data with the
   * updated project returned by the backend.
   */
  function handleProjectUpdated(updatedProject: Project) {
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === updatedProject.id
          ? updatedProject
          : project
      )
    )

    setEditingProject(null)
  }

  /**
   * Opens the project creation form.
   * Closes other project actions to keep the
   * interface organized and predictable.
   */
  function handleCreateProject() {
    if (isDeleting) return

    setEditingProject(null)
    setDeletingProject(null)
    setDeleteError('')
    setIsCreatingProject(true)
  }

  /**
   * Opens the editing form for a selected project.
   */
  function handleEditProject(project: Project) {
    if (isDeleting) return

    setIsCreatingProject(false)
    setDeletingProject(null)
    setDeleteError('')
    setEditingProject(project)
  }

  /**
   * Opens the selected project's dedicated workspace.
   * Task management takes place inside ProjectWorkspace.
   */
  function handleOpenWorkspace(project: Project) {
    if (isDeleting) return

    // Close any unfinished dashboard actions.
    setIsCreatingProject(false)
    setEditingProject(null)
    setDeletingProject(null)
    setDeleteError('')

    // Select the project by its unique database ID.
    setSelectedProjectId(project.id)
  }

  /**
   * Returns to the main project dashboard.
   * Project data remains in React state, so returning
   * does not require another API request.
   */
  function handleBackToProjects() {
    setSelectedProjectId(null)
  }

  /**
   * Opens deletion confirmation for a selected project.
   * No API request is sent until the customer confirms.
   */
  function handleRequestDelete(project: Project) {
    if (isDeleting) return

    // Close other forms to avoid conflicting actions.
    setIsCreatingProject(false)
    setEditingProject(null)

    // Clear errors from previous attempts.
    setDeleteError('')

    // Store the project awaiting confirmation.
    setDeletingProject(project)
  }

  /**
   * Closes the deletion confirmation without deleting.
   */
  function handleCancelDelete() {
    if (isDeleting) return

    setDeletingProject(null)
    setDeleteError('')
  }

  /**
   * Permanently deletes the selected project.
   * The Express backend verifies ownership.
   * PostgreSQL automatically deletes associated tasks
   * through the cascading foreign key relationship.
   */
  async function handleConfirmDelete() {
    if (!deletingProject || isDeleting) return

    // Capture the ID before starting the asynchronous request.
    const projectId = deletingProject.id

    setIsDeleting(true)
    setDeleteError('')

    try {
      // Request deletion from our Express backend.
      await deleteProject(projectId)

      // Remove the deleted project from React state.
      setProjects((currentProjects) =>
        currentProjects.filter(
          (project) => project.id !== projectId
        )
      )

      // Close the confirmation after successful deletion.
      setDeletingProject(null)

      // Return to the dashboard if this project was selected.
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null)
      }
    } catch (error) {
      console.error('Failed to delete project:', error)

      // Keep confirmation open so the customer can retry.
      setDeleteError(
        'Unable to delete this project. Please try again.'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  /**
   * Find the currently selected project using its ID.
   * This ensures the workspace receives updated project
   * information if the project changes in React state.
   */
  const selectedProject = projects.find(
    (project) => project.id === selectedProjectId
  )

  /**
   * Show the dedicated project workspace when a
   * valid project has been selected.
   * Returning early keeps workspace rendering separate
   * from the main dashboard.
   */
  if (selectedProject) {
    return (
      <ProjectWorkspace
        project={selectedProject}
        onBack={handleBackToProjects}
      />
    )
  }

  return (
    <section className="w-full max-w-5xl">
      {/* Dashboard heading and project creation button */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">
            Your projects
          </h2>

          <p className="mt-2 text-slate-400">
            Manage your projects, tasks, and progress
            in one place.
          </p>
        </div>

        {/* Open the new project form. */}
        <button
          type="button"
          onClick={handleCreateProject}
          disabled={isCreatingProject || isDeleting}
          className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + New Project
        </button>
      </div>

      {/* Display the project creation form. */}
      {isCreatingProject && (
        <ProjectForm
          key="create"
          onProjectSaved={handleProjectCreated}
          onCancel={() => setIsCreatingProject(false)}
        />
      )}

      {/* Display the editing form for the selected project. */}
      {editingProject && (
        <ProjectForm
          key={editingProject.id}
          project={editingProject}
          onProjectSaved={handleProjectUpdated}
          onCancel={() => setEditingProject(null)}
        />
      )}

      {/* Display deletion confirmation for the selected project. */}
      {deletingProject && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-project-title"
          aria-describedby="delete-project-description"
          className="mb-8 rounded-2xl border border-red-800 bg-slate-950 p-6"
        >
          <h3
            id="delete-project-title"
            className="text-xl font-semibold text-white"
          >
            Delete project?
          </h3>

          <p
            id="delete-project-description"
            className="mt-3 text-sm text-slate-300"
          >
            Are you sure you want to permanently delete{' '}
            <strong className="text-white">
              {deletingProject.name}
            </strong>
            ? All tasks associated with this project will
            also be deleted. This action cannot be undone.
          </p>

          {/* Display errors if deletion fails. */}
          {deleteError && (
            <p
              role="alert"
              className="mt-4 text-sm text-red-400"
            >
              {deleteError}
            </p>
          )}

          {/* Confirmation actions */}
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
              onClick={() => void handleConfirmDelete()}
              disabled={isDeleting}
              className="rounded-lg bg-red-700 px-5 py-3 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting
                ? 'Deleting...'
                : 'Delete permanently'}
            </button>
          </div>
        </div>
      )}

      {/* Loading, error, and empty states */}
      {isLoading ? (
        <p role="status" className="text-slate-400">
          Loading your projects...
        </p>
      ) : error ? (
        <p role="alert" className="text-red-400">
          {error}
        </p>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
          <h3 className="text-xl font-semibold text-white">
            No projects yet
          </h3>

          <p className="mt-3 text-slate-400">
            Create your first project to start organizing
            your work and tracking tasks.
          </p>
        </div>
      ) : (
        /* Display projects in a responsive grid. */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <article
              key={project.id}
              className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg transition hover:border-slate-700"
            >
              {/* Project name */}
              <h3 className="break-words text-xl font-semibold text-white">
                {project.name}
              </h3>

              {/* Project description */}
              <p className="mt-3 flex-1 whitespace-pre-wrap break-words text-sm text-slate-400">
                {project.description ||
                  'No description provided.'}
              </p>

              {/* Project creation date */}
              <p className="mt-6 text-xs text-slate-500">
                Created{' '}
                {new Date(
                  project.createdAt
                ).toLocaleDateString()}
              </p>

              {/* Primary project action */}
              <button
                type="button"
                onClick={() => handleOpenWorkspace(project)}
                disabled={isDeleting}
                className="mt-5 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Open workspace
              </button>

              {/* Secondary project management actions */}
              <div className="mt-3 flex flex-wrap gap-3">
                {/* Edit the selected project. */}
                <button
                  type="button"
                  onClick={() => handleEditProject(project)}
                  disabled={isDeleting}
                  className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Edit project
                </button>

                {/* Request confirmation before deletion. */}
                <button
                  type="button"
                  onClick={() => handleRequestDelete(project)}
                  disabled={isDeleting}
                  className="flex-1 rounded-lg border border-red-900 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-950 disabled:opacity-50"
                >
                  Delete project
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}