import { useState } from 'react'
import { createProject } from '../lib/projects'
import type { Project } from '../types/projects'

/**
 * Properties passed into our ProjectForm component.
 */
interface ProjectFormProps {
  // Notifies the dashboard when a project is created.
  onProjectCreated: (project: Project) => void

  // Allows the dashboard to close the form.
  onCancel: () => void
}

/**
 * Form for creating new Arcwell projects.
 */
export function ProjectForm({
  onProjectCreated,
  onCancel
}: ProjectFormProps) {
  // Stores the project name entered by the user.
  const [name, setName] = useState('')

  // Stores the optional project description.
  const [description, setDescription] = useState('')

  // Tracks whether the project is being saved.
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Stores any error encountered during creation.
  const [error, setError] = useState('')

  /**
   * Handles submission of the new project.
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

    setIsSubmitting(true)
    setError('')

    try {
      // Send the project information to Express.
      const response = await createProject({
        name: name.trim(),
        description: description.trim()
      })

      // Notify the dashboard about the newly created project.
      onProjectCreated(response.project)
    } catch (error) {
      console.error('Failed to create project:', error)
      setError('Unable to create project. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 rounded-2xl border border-slate-700 bg-slate-950 p-6"
    >
      <h3 className="mb-6 text-xl font-semibold text-white">
        Create a project
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
          {isSubmitting ? 'Creating...' : 'Create project'}
        </button>
      </div>
    </form>
  )
}