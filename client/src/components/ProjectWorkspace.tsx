import { TaskDashboard } from './TaskDashboard'
import type { Project } from '../types/projects'

/**
 * Arcwell Project Workspace
 * Provides a dedicated workspace for an individual project.
 * Customers can:
 *  See which project they are currently managing.
 *  Review the project's description.
 *  Access task management and progress tracking.
 *  Return to their project dashboard.
 * Keeping this component separate from ProjectDashboard
 * makes the application easier to maintain and expand.
 */

interface ProjectWorkspaceProps {
  project: Project
  onBack: () => void
}

/**
 * Formats the project's creation date for display.
 */
function formatProjectDate(date: string): string {
  const parsedDate = new Date(date)

  return parsedDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function ProjectWorkspace({
  project,
  onBack,
}: ProjectWorkspaceProps) {
  return (
    <section className="w-full max-w-5xl">
      {/* Navigation back to the project dashboard */}
      <nav aria-label="Project navigation" className="mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-emerald-600 hover:bg-slate-800 hover:text-white"
        >
          <span aria-hidden="true">←</span>
          Back to projects
        </button>
      </nav>

      {/* Project information */}
      <header className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {/* Workspace label */}
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-400">
              Project workspace
            </p>

            {/* Project name */}
            <h2 className="break-words text-3xl font-bold text-white">
              {project.name}
            </h2>

            {/* Project description */}
            <p className="mt-4 whitespace-pre-wrap break-words text-slate-400">
              {project.description ||
                'No description has been added to this project.'}
            </p>
          </div>

          {/* Project metadata */}
          <div className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Created
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-200">
              {formatProjectDate(project.createdAt)}
            </p>
          </div>
        </div>
      </header>

      {/* Project task management */}
      <TaskDashboard
        key={project.id}
        projectId={project.id}
      />
    </section>
  )
}