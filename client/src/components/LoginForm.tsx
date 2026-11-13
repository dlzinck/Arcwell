import { useState } from 'react'
import type { FormEvent } from 'react'
import { loginUser } from '../lib/auth'
import { ApiError } from '../lib/api'
import type { User } from '../types/auth'

// Defines the information our parent component receives
// after a user successfully logs in.
type LoginFormProps = {
  onLoginSuccess: (user: User) => void
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  // Stores the values entered into the login form.
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Tracks loading and error states.
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Handles login when the form is submitted.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Prevent the browser from refreshing the page.
    event.preventDefault()

    // Clear any previous error messages.
    setError('')
    setIsLoading(true)

    try {
      // Send the user's credentials to our Express backend.
      const response = await loginUser({ email, password })

      // Clear the password after successful authentication.
      setPassword('')

      // Notify the parent component that login succeeded.
      onLoginSuccess(response.user)
    } catch (error) {
      // Display useful API errors without exposing technical details.
      if (error instanceof ApiError) {
        setError(error.message)
      } else {
        setError('Unable to log in. Please try again.')
      }
    } finally {
      // Re-enable the form after the request finishes.
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl"
    >
      <div>
        <h2 className="text-2xl font-bold text-white">
          Welcome back
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Sign in to your Arcwell account.
        </p>
      </div>

      {/* Email input */}
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-slate-300">
          Email address
        </label>

        <input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
          placeholder="you@example.com"
        />
      </div>

      {/* Password input */}
      <div>
        <label htmlFor="login-password" className="block text-sm font-medium text-slate-300">
          Password
        </label>

        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
          placeholder="Enter your password"
        />
      </div>

      {/* Display errors when authentication fails */}
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
}