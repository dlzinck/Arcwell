import { Router } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'

// Create a router for authentication-related endpoints.
export const authRouter = Router()

// Define the information required to register a user.
const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(12).max(72)
})

// Handle POST requests to register a new account.
authRouter.post('/register', async (req, res) => {
  // Validate the information submitted by the user.
  const result = registerSchema.safeParse(req.body)

  // Reject requests with invalid registration data.
  if (!result.success) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid registration information',
      errors: result.error.flatten()
    })
  }

  const { name, email, password } = result.data

  try {
    // Hash the password before storing it in PostgreSQL.
    const passwordHash = await bcrypt.hash(password, 12)

    // Create the user in the database through Prisma.
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    })

    // Return the new account without exposing the password hash.
    return res.status(201).json({
      status: 'success',
      message: 'Account created successfully',
      user
    })
  } catch (error) {
    // Handle duplicate emails using PostgreSQL's unique constraint.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return res.status(409).json({
        status: 'error',
        message: 'An account with this email already exists'
      })
    }

    // Log unexpected errors without exposing internal details.
    console.error('Registration failed:', error)

    return res.status(500).json({
      status: 'error',
      message: 'Unable to create account'
    })
  }
})


 // Define the information required to log in.
const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1)
})

// Handle POST requests to log in to an existing account.
authRouter.post('/login', async (req, res) => {
  // Validate the submitted login information.
  const result = loginSchema.safeParse(req.body)

  // Reject requests with invalid information.
  if (!result.success) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid login information',
      errors: result.error.flatten()
    })
  }

  const { email, password } = result.data

  try {
    // Find the account associated with the submitted email.
    const user = await prisma.user.findUnique({
      where: { email }
    })

    // Reject login attempts for accounts that do not exist.
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      })
    }

    // Compare the submitted password against the stored hash.
    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    )

    // Reject the login if the password does not match.
    if (!passwordMatches) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      })
    }

    // Return basic account information after successful verification.
    // Authentication sessions will be added in the next stage.

 // Regenerate the session ID after successful authentication.
 // This helps protect against session fixation attacks.
req.session.regenerate((error) => {
  // If session creation fails, return a server error.
  if (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Unable to create login session'
    })
  }

  // Store the authenticated user's ID in the session.
  // The session data is saved in PostgreSQL.
  req.session.userId = user.id

  // Explicitly save the session before responding.
  // This ensures the browser receives a usable session cookie.
  req.session.save((saveError) => {
    if (saveError) {
      return res.status(500).json({
        status: 'error',
        message: 'Unable to save login session'
      })
    }

    // Login is complete, and the session is now persistent.
    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
  })
})
  } catch (error) {
    // Log unexpected errors without exposing internal details.
    console.error('Login failed:', error)

    return res.status(500).json({
      status: 'error',
      message: 'Unable to log in'
    })
  }
})


authRouter.get('/me', async (req, res) => {
  try {
    // Check whether the visitor has an authenticated session.
    if (!req.session.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authenticated'
      })
    }

    // Find the user associated with the session.
    const user = await prisma.user.findUnique({
      where: {
        id: req.session.userId
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    // The account might have been deleted after login.
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User no longer exists'
      })
    }

    // Return safe user information.
    // Never return the password hash.
    return res.status(200).json({
      status: 'success',
      user
    })
  } catch (error) {
    console.error('Current user lookup failed:', error)

    return res.status(500).json({
      status: 'error',
      message: 'Unable to retrieve current user'
    })
  }
})


authRouter.post('/logout', (req, res) => {
  // Destroy the current session in PostgreSQL.
  req.session.destroy((error) => {
    // Return an error if the session could not be destroyed.
    if (error) {
      console.error('Logout failed:', error)

      return res.status(500).json({
        status: 'error',
        message: 'Unable to log out'
      })
    }

    // Remove the session cookie from the browser.
    res.clearCookie('connect.sid', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })

    // Confirm successful logout.
    return res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    })
  })
})
