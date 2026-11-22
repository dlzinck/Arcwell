import { useEffect, useState } from 'react'
import { deleteProject, getProjects } from '../lib/projects'
import { ProjectForm } from './ProjectForm'
import type { Project } from '../types/projects'

/**
 * Displays projects belonging to the authenticated user.
 * Projects are retrieved from our Express API.
 * Users can create, edit, and delete their projects.
 */
export function ProjectDashboard() {
  // Stores projects returned by the backend.
  const [projects, setProjects] = useState<Project[]>([])

  // Tracks whether the initial request is running.
  const [isLoading, setIsLoading] = useState(true)

  // Stores errors encountered while loading projects.
  const [error, setError] = useState('')

  // Controls whether the creation form is visible.
  const [isCreatingProject, setIsCreatingProject] = useState(false)

  // Stores the project currently being edited.
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  // Stores the project awaiting deletion confirmation.
  // Null means no deletion confirmation is open.
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)

  // Tracks whether a deletion request is running.
  const [isDeleting, setIsDeleting] = useState(false)

  // Stores errors encountered while deleting a project.
  const [deleteError, setDeleteError] = useState('')

  /**
   * Retrieves projects when the dashboard first appears.
   */
  useEffect(() => {
    // Prevent outdated requests from updating React state.
    let isActive = true

    async function loadProjects() {
      try {
        // Request the authenticated user's projects.
        const response = await getProjects()

        if (isActive) {
          setProjects(response.projects)
        }
      } catch (error) {
        console.error('Failed to load projects:', error)

        if (isActive) {
          setError('Unable to load your projects. Please try again.')
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadProjects()

    // Ignore the request result if the component unmounts.
    return () => {
      isActive = false
    }
  }, [])

  /**
   * Handles a successfully created project.
   * Adds the new project without refreshing the page.
   */
  function handleProjectCreated(project: Project) {
    setProjects((currentProjects) => [project, ...currentProjects])

    // Close the creation form.
    setIsCreatingProject(false)
  }

  /**
   * Handles a successfully updated project.
   * Replaces the existing project with the updated version.
   */
  function handleProjectUpdated(updatedProject: Project) {
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === updatedProject.id ? updatedProject : project
      )
    )

    // Close the editing form.
    setEditingProject(null)
  }

  /**
   * Opens the editing form for a selected project.
   */
  function handleEditProject(project: Project) {
    setIsCreatingProject(false)
    setEditingProject(project)
  }

  /**
   * Opens the creation form.
   */
  function handleCreateProject() {
    setEditingProject(null)
    setIsCreatingProject(true)
  }

  /**
   * Opens deletion confirmation for a selected project.
   * No API request is sent until the user confirms.
   */
  function handleRequestDelete(project: Project) {
    // Avoid opening multiple confirmations during deletion.
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
   * Express verifies ownership before deleting.
   * PostgreSQL also deletes associated tasks through
   * the cascading foreign key we configured earlier.
   */
  async function handleConfirmDelete() {
    // Require a selected project and prevent duplicate requests.
    if (!deletingProject || isDeleting) return

    setIsDeleting(true)
    setDeleteError('')

    try {
      // Request deletion from our Express backend.
      await deleteProject(deletingProject.id)

      // Remove the deleted project from React state.
      setProjects((currentProjects) =>
        currentProjects.filter(
          (project) => project.id !== deletingProject.id
        )
      )

      // Close the confirmation after successful deletion.
      setDeletingProject(null)
    } catch (error) {
      console.error('Failed to delete project:', error)

      // Keep the confirmation open so the user can retry.
      setDeleteError(
        'Unable to delete this project. Please try again.'
      )
    } finally {
      setIsDeleting(false)
    }
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
            Manage your work in one place.
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

      {/* Display the creation form when requested. */}
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
            <p role="alert" className="mt-4 text-sm text-red-400">
              {deleteError}
            </p>
          )}

          {/* Confirmation actions */}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={handleCancelDelete}
              disabled={isDeleting}
              className="rounded-lg border border-slate-700 px-5 py-3 font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="rounded-lg bg-red-700 px-5 py-3 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete permanently'}
            </button>
          </div>
        </div>
      )}

      {/* Display a loading message while retrieving projects. */}
      {isLoading ? (
        <p role="status" className="text-slate-400">
          Loading your projects...
        </p>
      ) : error ? (
        // Display an error if the API request fails.
        <p role="alert" className="text-red-400">
          {error}
        </p>
      ) : projects.length === 0 ? (
        // Display an empty state for new accounts.
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
          <h3 className="text-xl font-semibold text-white">
            No projects yet
          </h3>

          <p className="mt-3 text-slate-400">
            Your projects will appear here once you create one.
          </p>
        </div>
      ) : (
        // Display projects in a responsive grid.
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <article
              key={project.id}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg"
            >
              {/* Project name */}
              <h3 className="text-xl font-semibold text-white">
                {project.name}
              </h3>

              {/* Project description */}
              <p className="mt-3 text-sm text-slate-400">
                {project.description || 'No description provided.'}
              </p>

              {/* Project creation date */}
              <p className="mt-6 text-xs text-slate-500">
                Created{' '}
                {new Date(project.createdAt).toLocaleDateString()}
              </p>

              {/* Project management actions */}
              <div className="mt-5 flex flex-wrap gap-3">

                {/* Edit the selected project. */}
                <button
                  type="button"
                  onClick={() => handleEditProject(project)}
                  disabled={isDeleting}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-emerald-400 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Edit project
                </button>

                {/* Request confirmation before deletion. */}
                <button
                  type="button"
                  onClick={() => handleRequestDelete(project)}
                  disabled={isDeleting}
                  className="rounded-lg border border-red-900 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-950 disabled:opacity-50"
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