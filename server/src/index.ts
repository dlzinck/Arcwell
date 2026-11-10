import express from 'express'
import cors from 'cors'
import 'dotenv/config'

// Initialize the Express application.
const app = express()

// Use the configured environment port or default to 3000.
const PORT = process.env.PORT || 3000

// Middleware configuration

// Allow requests from the React development server.
// Additional origins can be configured as the application grows.
app.use(cors({ origin: 'http://localhost:5173' }))

// Parse incoming JSON request bodies.
app.use(express.json())

// Health check endpoint used to verify backend availability.
// Returns a JSON response confirming that the API is running.
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Arcwell API is running'
  })
})

// Start listening for incoming HTTP requests.
app.listen(PORT, () => {
  console.log(`Arcwell API running on http://localhost:${PORT}`)
})
