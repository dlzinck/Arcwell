import 'express-session'

// Extend the existing Express session type.
// This tells TypeScript that our sessions can store a user ID.
declare module 'express-session' {
  interface SessionData {
    userId?: string
  }
}
