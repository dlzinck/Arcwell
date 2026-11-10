import { useEffect, useState } from 'react'

// Defines the expected structure of the backend health check response.
// TypeScript uses this type to help us work with the API data safely.
type HealthResponse = {
  status: string
  message: string
}

function App() {
  // Stores the current API connection message.
  // React updates the UI whenever this state changes.
  const [apiStatus, setApiStatus] = useState('Checking connection...')

  // Runs when the component mounts to check backend availability.
  // The empty dependency array prevents rerunning on normal updates.
  useEffect(() => {

    // Sends a request to the Express backend's health endpoint.
    async function checkApiHealth() {
      try {
        // The Vite proxy forwards /api requests to localhost:3000.
        const response = await fetch('/api/health')

        // HTTP error responses do not automatically reject fetch().
        // Throw an error so unsuccessful responses are handled below.
        if (!response.ok) {
          throw new Error('API request failed')
        }

        // Parse the JSON response and update the connection message.
        const data: HealthResponse = await response.json()
        setApiStatus(data.message)

      } catch (error) {
        // Log the error for debugging and show a user-friendly message.
        console.error('API connection error:', error)
        setApiStatus('Unable to connect to the API')
      }
    }

    // Execute the health check when the component loads.
    checkApiHealth()

  }, [])

  return (
    // Main application container using Tailwind CSS utilities.
    <main className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="text-center">

        {/* Application name */}
        <h1 className="text-5xl font-bold text-white">
          Arcwell
        </h1>

        {/* Application tagline */}
        <p className="mt-4 text-lg text-slate-400">
          Project management, simplified.
        </p>

        {/* Displays the current backend connection message */}
        <p className="mt-8 text-sm text-emerald-400">
          {apiStatus}
        </p>

      </div>
    </main>
  )
}

// Makes the App component available to the application entry point.
export default App
