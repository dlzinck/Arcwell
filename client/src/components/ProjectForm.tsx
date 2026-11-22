import { useState } from 'react'
import { createProject, updateProject } from '../lib/projects'
import type { Project } from '../types/projects'

/**
 * Properties accepted by our reusable project form.
 * If a project is provided, the form edits that project.
 * Otherwise, the form creates a new project.
 */
interface ProjectFormProps {
  // Existing project to edit, if applicable.
  project?: Project

  // Notifies the dashboard after a successful save.
  onProjectSaved: (project: Project) => void

  // Closes the form without saving changes.
  onCancel: () => void
}

/**
 * Reusable form for creating and editing Arcwell projects.
 * Both operations share the same fields and validation.
 * This prevents us from maintaining two separate forms.
 */
export function ProjectForm({
  project,
  onProjectSaved,
  onCancel
}: ProjectFormProps) {
  // Determines whether we're editing an existing project.
  const isEditing = project !== undefined

  // Stores the project name.
  // When editing, initialize it with the existing name.
  const [name, setName] = useState(project?.name ?? '')

  // Stores the project description.
  // Null descriptions become empty strings in the form.
  const [description, setDescription] = useState(
    project?.description ?? ''
  )

  // Tracks whether the project is currently being saved.
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Stores any error encountered during submission.
  const [error, setError] = useState('')

  /**
   * Handles creating or updating a project.
   * The operation depends on whether an existing
   * project was provided to the component.
   */
  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    // Prevent duplicate submissions.
    if (isSubmitting) return

    // Require a project name containing visible characters.
    if (!name.trim()) {
      setError('Please enter a project name.')
      return
    }

    // Disable submission while the API request is running.
    setIsSubmitting(true)

    // Clear errors from previous attempts.
    setError('')

    try {
      // Prepare the information submitted to Express.
      const projectData = {
        name: name.trim(),
        description: description.trim()
      }

      // Create or update the project depending on the mode.
      const response = isEditing
        ? await updateProject(project.id, projectData)
        : await createProject(projectData)

      // Notify the dashboard about the saved project.
      // The dashboard will update its local React state.
      onProjectSaved(response.project)
    } catch (error) {
      console.error('Failed to save project:', error)

      // Display an appropriate message for the operation.
      setError(
        isEditing
          ? 'Unable to update project. Please try again.'
          : 'Unable to create project. Please try again.'
      )
    } finally {
      // Re-enable the form after the request finishes.
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 rounded-2xl border border-slate-700 bg-slate-950 p-6"
    >
      {/* Change the heading depending on the form mode. */}
      <h3 className="mb-6 text-xl font-semibold text-white">
        {isEditing ? 'Edit project' : 'Create a project'}
      </h3>

      {/* Project name */}
      <label
        htmlFor="project-name"
        className="mb-2 block text-sm font-medium text-slate-300"
      >
        Project name
      </label>

      <input
        id="project-name"
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Enter a project name"
        maxLength={100}
        required
        disabled={isSubmitting}
        className="mb-5 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-500"
      />

      {/* Optional project description */}
      <label
        htmlFor="project-description"
        className="mb-2 block text-sm font-medium text-slate-300"
      >
        Description (optional)
      </label>

      <textarea
        id="project-description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="What is this project about?"
        rows={4}
        disabled={isSubmitting}
        className="mb-5 w-full resize-y rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-500"
      />

      {/* Display any errors encountered during submission. */}
      {error && (
        <p role="alert" className="mb-4 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* Form actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg border border-slate-700 px-5 py-3 font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? isEditing
              ? 'Saving...'
              : 'Creating...'
            : isEditing
              ? 'Save changes'
              : 'Create project'}
        </button>
      </div>
    </form>
  )
}