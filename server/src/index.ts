import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { prisma } from './lib/prisma.js'
import { authRouter } from './routes/auth.js'
import { sessionMiddleware } from './lib/session.js'

// Initialize the Express application.
const app = express()

// Use the configured environment port or default to 3000.
const PORT = process.env.PORT || 3000

// Parse incoming JSON request bodies.
app.use(express.json())

// Enable PostgreSQL-backed sessions for incoming requests.
// This must run before authentication routes so they can access sessions.
app.use(sessionMiddleware)

// Register authentication routes under the /api/auth prefix.
// For example, POST /api/auth/register creates a new user.
app.use('/api/auth', authRouter)


// Middleware configuration.

// Allow requests from the React development server.
app.use(cors({ origin: 'http://localhost:5173' }))

// Parse incoming JSON request bodies.
app.use(express.json())
// Register authentication routes under the /api/auth prefix.
// For example, POST /api/auth/register creates a new user.
app.use('/api/auth', authRouter)

// Health check endpoint used to verify backend availability.
// Returns a JSON response confirming that the API is running.
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Arcwell API is running'
  })
})

// Database health check endpoint.
// Executes a simple SQL query to verify PostgreSQL connectivity.
app.get('/api/db-health', async (_req, res) => {
  try {
    // Send a simple query to PostgreSQL through Prisma.
    await prisma.$queryRaw`SELECT 1`

    // Return a success response when the database responds.
    res.json({
      status: 'ok',
      message: 'Arcwell database is connected'
    })
  } catch (error) {
    // Log the error on the server for troubleshooting.
    console.error('Database connection failed:', error)

    // Return an error response without exposing database details.
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed'
    })
  }
})

// Start listening for incoming HTTP requests.
app.listen(PORT, () => {
  console.log(`Arcwell API running on http://localhost:${PORT}`)
})
