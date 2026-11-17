import type { RequestHandler } from 'express'

/**
 * Arcwell Authentication Middleware
 * Protects API endpoints that require an
 * authenticated user session.
 */

export const requireAuth: RequestHandler = (req, res, next) => {
  // Check whether the session contains a user ID.
  if (!req.session.userId) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    })
  }

  // The session contains a user ID.
  // Allow the request to continue to the next handler.
  next()
}