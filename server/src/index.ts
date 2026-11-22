import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { prisma } from './lib/prisma.js'
import { sessionMiddleware } from './lib/session.js'
import { authRouter } from './routes/auth.js'
import { projectsRouter } from './routes/projects.js'
import { tasksRouter } from './routes/tasks.js'

/**
 * Arcwell Express Server
 * Handles authentication, project management,
 * task management, and database health checks.
 */

// Initialize the Express application.
const app = express()

// Use the configured environment port or default to 3000.
const PORT = process.env.PORT || 3000

/**
 * Global Middleware
 * Middleware processes incoming requests before
 * they reach our API endpoints.
 */

// Allow requests from our React development server.
// Credentials support allows browsers to send session cookies
// when making cross-origin requests.
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))

// Parse incoming JSON request bodies.
// This allows Express to read req.body.
app.use(express.json())

// Enable PostgreSQL-backed sessions.
// Authentication routes need access to req.session.
app.use(sessionMiddleware)

/**
 * API Routes
 * Group related endpoints under their own prefixes.
 */

// Handles account registration, login, session checks,
// and logout.
app.use('/api/auth', authRouter)

// Register project management routes.
// The projects router protects its endpoints with requireAuth.
//
// Available operations:
// POST   /api/projects
// GET    /api/projects
// GET    /api/projects/:id
// PATCH  /api/projects/:id
// DELETE /api/projects/:id
app.use('/api/projects', projectsRouter)

// Register task management routes.
//
// Tasks belong to individual projects.
// The tasks router verifies authentication and
// project ownership before allowing operations.
//
// Available operations:
// POST   /api/projects/:projectId/tasks
// GET    /api/projects/:projectId/tasks
// GET    /api/projects/:projectId/tasks/:taskId
// PATCH  /api/projects/:projectId/tasks/:taskId
// DELETE /api/projects/:projectId/tasks/:taskId
app.use('/api/projects', tasksRouter)

/**
 * Health Check Routes
 * Used to verify that the API and database are running.
 */

// Check whether the Express server is responding.
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Arcwell API is running'
  })
})

// Check whether PostgreSQL is responding.
app.get('/api/db-health', async (_req, res) => {
  try {
    // Execute a simple query through Prisma.
    await prisma.$queryRaw`SELECT 1`

    // Return a success response.
    res.json({
      status: 'ok',
      message: 'Arcwell database is connected'
    })
  } catch (error) {
    // Log database errors for troubleshooting.
    console.error('Database connection failed:', error)

    // Avoid exposing internal database details.
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed'
    })
  }
})

/**
 * Start the Server
 * Listen for incoming HTTP requests.
 */
app.listen(PORT, () => {
  console.log(`Arcwell API running on http://localhost:${PORT}`)
})