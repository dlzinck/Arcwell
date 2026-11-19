
import { useEffect, useState } from 'react'
import { getProjects } from '../lib/projects'
import { ProjectForm } from './ProjectForm'
import type { Project } from '../types/projects'

/**
 * Displays projects belonging to the authenticated user.
 * Projects are retrieved from our Express API,
 * which uses the session cookie to identify the user.
 * Users can also create projects directly from the dashboard.
 */
export function ProjectDashboard() {
  // Stores projects returned by the backend.
  const [projects, setProjects] = useState<Project[]>([])

  // Tracks whether the initial request is still running.
  const [isLoading, setIsLoading] = useState(true)

  // Stores an error message if loading fails.
  const [error, setError] = useState('')

  // Controls whether the new project form is visible.
  const [isCreatingProject, setIsCreatingProject] = useState(false)

  /**
   * Retrieves projects when the dashboard first appears.
   */
  useEffect(() => {
    // Prevents outdated requests from updating React state.
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
   * Adds the new project to React state immediately,
   * without requiring another API request or page refresh.
   */
  function handleProjectCreated(project: Project) {
    // Add the new project to the beginning of the list.
    setProjects((currentProjects) => [project, ...currentProjects])

    // Close the creation form.
    setIsCreatingProject(false)
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
          onClick={() => setIsCreatingProject(true)}
          disabled={isCreatingProject}
          className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + New Project
        </button>
      </div>

      {/* Display the creation form when requested. */}
      {isCreatingProject && (
        <ProjectForm
          onProjectCreated={handleProjectCreated}
          onCancel={() => setIsCreatingProject(false)}
        />
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
            </article>
          ))}
        </div>
      )}
    </section>
  )
}