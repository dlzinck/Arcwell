import { useState } from 'react'
import type { FormEvent } from 'react'
import { registerUser } from '../lib/auth'
import { ApiError } from '../lib/api'

// Defines what the parent component should do
// when registration succeeds.
type RegisterFormProps = {
  onRegisterSuccess: () => void
}

export function RegisterForm({
  onRegisterSuccess
}: RegisterFormProps) {
  // Store the information entered into the form.
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Track the registration request and any errors.
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  /**
   * Handles registration when the form is submitted.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Prevent the browser from refreshing the page.
    event.preventDefault()

    // Clear any previous error message.
    setError('')

    // Make sure both password fields match.
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    // Match the backend's minimum password requirement.
    if (password.length < 12) {
      setError('Password must contain at least 12 characters.')
      return
    }

    // Start the registration request.
    setIsLoading(true)

    try {
      // Send the registration details to Express.
      // The backend validates the data and hashes the password.
      await registerUser({
        name: name.trim(),
        email: email.trim(),
        password
      })

      // Clear sensitive form values after successful registration.
      setPassword('')
      setConfirmPassword('')

      // Notify App.tsx that the account was created.
      // The user can then sign in with their new credentials.
      onRegisterSuccess()
    } catch (error) {
      // Display backend validation or account conflict errors.
      if (error instanceof ApiError) {
        setError(error.message)
      } else {
        setError('Unable to create your account. Please try again.')
      }
    } finally {
      // Allow another submission after the request completes.
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl"
    >
      {/* Registration heading */}
      <div>
        <h2 className="text-2xl font-bold text-white">
          Create your account
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Get started with Arcwell.
        </p>
      </div>

      {/* Full name */}
      <div>
        <label
          htmlFor="register-name"
          className="block text-sm font-medium text-slate-300"
        >
          Full name
        </label>

        <input
          id="register-name"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
        />
      </div>

      {/* Email address */}
      <div>
        <label
          htmlFor="register-email"
          className="block text-sm font-medium text-slate-300"
        >
          Email address
        </label>

        <input
          id="register-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
        />
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="register-password"
          className="block text-sm font-medium text-slate-300"
        >
          Password
        </label>

        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 12 characters"
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
        />
      </div>

      {/* Confirm password */}
      <div>
        <label
          htmlFor="register-confirm-password"
          className="block text-sm font-medium text-slate-300"
        >
          Confirm password
        </label>

        <input
          id="register-confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Enter your password again"
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
        />
      </div>

      {/* Registration error message */}
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      {/* Submit registration */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  )
}