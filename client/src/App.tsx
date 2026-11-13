import { useEffect, useState } from 'react'
import { LoginForm } from './components/LoginForm'
import { RegisterForm } from './components/RegisterForm'
import { getCurrentUser, logoutUser } from './lib/auth'
import { ApiError } from './lib/api'
import type { User } from './types/auth'

function App() {
  // Stores the currently authenticated user.
  // Null means no authenticated user has been identified.
  const [user, setUser] = useState<User | null>(null)

  // Prevents the login form from appearing while
  // we're checking for an existing session.
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  
  // Tracks whether the user is currently logging out.
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Stores any errors that happen during logout.
  const [logoutError, setLogoutError] = useState('')

  // Determines which authentication form is displayed.
  // 'login' shows the login form.
  // 'register' shows the account creation form.
  const [authPage, setAuthPage] = useState<'login' | 'register'>('login')

  // Displays a confirmation after successful registration.
  const [registrationSuccess, setRegistrationSuccess] = useState(false)

  // Checks whether the browser already has a valid login session.
  // This runs when the application first loads.
  useEffect(() => {
    // Allows us to ignore results after the effect is cleaned up.
    // Useful when React Strict Mode runs effects more than once.
    let isActive = true

    async function restoreSession() {
      try {
        // The browser sends its session cookie automatically.
        const response = await getCurrentUser()

        // Restore the authenticated user into React state.
        if (isActive) {
          setUser(response.user)
        }
      } catch (error) {
        // A 401 means the visitor simply isn't logged in.
        // Other errors are logged for debugging.
        if (!(error instanceof ApiError && error.statusCode === 401)) {
          console.error('Session restoration failed:', error)
        }

        if (isActive) {
          setUser(null)
        }
      } finally {
        // Show the application after the session check finishes.
        if (isActive) {
          setIsCheckingSession(false)
        }
      }
    }

    restoreSession()

    // Ignore responses from an outdated effect.
    return () => {
      isActive = false
    }
  }, [])

  // Called when the login form authenticates a user.
  function handleLoginSuccess(authenticatedUser: User) {
    setUser(authenticatedUser)
  }
  
  // Handles successful account registration.
  function handleRegisterSuccess() {
    // Return the visitor to the login form.
    setAuthPage('login')

    // Display a confirmation that registration succeeded.
    setRegistrationSuccess(true)
  }

/**
 * Logs the authenticated user out of Arcwell.
 */
async function handleLogout() {
  // Disable the logout button while processing.
  setIsLoggingOut(true)

  // Clear any previous logout errors.
  setLogoutError('')

  try {
    // Send a logout request to our Express backend.
    await logoutUser()

    // Remove the authenticated user from React state.
    // React will automatically display the login form.
    setUser(null)
  } catch (error) {
    // Keep the user logged in if the request fails.
    console.error('Logout failed:', error)

    setLogoutError('Unable to log out. Please try again.')
  } finally {
    // Re-enable the logout button.
    setIsLoggingOut(false)
  }
}
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12">

      {/* Application branding */}
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-bold text-white">
          Arcwell
        </h1>

        <p className="mt-4 text-lg text-slate-400">
          Project management, simplified.
        </p>
      </div>

      {/* Wait until the session check has completed. */}
      {isCheckingSession ? (
        <p role="status" className="text-sm text-slate-400">
          Checking your session...
        </p>

) : !user ? (
  // Display login or registration depending on the selected page.
  <div className="flex w-full flex-col items-center">

    {authPage === 'login' ? (
      <>
        {/* Confirm successful registration before login. */}
        {registrationSuccess && (
          <p
            role="status"
            className="mb-5 w-full max-w-md rounded-lg border border-emerald-700 bg-emerald-950 p-4 text-sm text-emerald-300"
          >
            Account created successfully! You can now sign in.
          </p>
        )}

        {/* Existing login form */}
        <LoginForm onLoginSuccess={handleLoginSuccess} />

        {/* Switch to account registration */}
        <p className="mt-6 text-sm text-slate-400">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => {
              setRegistrationSuccess(false)
              setAuthPage('register')
            }}
            className="font-semibold text-emerald-400 hover:text-emerald-300"
          >
            Create an account
          </button>
        </p>
      </>
    ) : (
      <>
        {/* New account registration form */}
        <RegisterForm onRegisterSuccess={handleRegisterSuccess} />

        {/* Switch back to login */}
        <p className="mt-6 text-sm text-slate-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => setAuthPage('login')}
            className="font-semibold text-emerald-400 hover:text-emerald-300"
          >
            Sign in
          </button>
        </p>
      </>
    )}

  </div>
) : (
        // Temporary authenticated screen.
        // We'll replace this with the dashboard later.
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-xl">
          <h2 className="text-2xl font-bold text-white">
            Welcome, {user.name}!
          </h2>

          <p className="mt-3 text-slate-400">
            You have successfully logged into Arcwell.
          </p>
          {/* Display an error if the logout request fails. */}
          {logoutError && (
          <p role="alert" className="mt-4 text-sm text-red-400">
          {logoutError}
          </p>
          )}
          <button
            type="button" 
            onClick={handleLogout}
            disabled={isLoggingOut} 
            className="mt-6 w-full rounded-lg border border-slate-700 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
            {isLoggingOut ? 'Logging out...' : 'Log out'}
          </button>
        </div>
      )}
    </main>
  )
}

export default App