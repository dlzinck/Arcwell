import 'dotenv/config'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import pg from 'pg'

// Read the database connection and session secret
// from our server's .env file.
const connectionString = process.env.DATABASE_URL
const sessionSecret = process.env.SESSION_SECRET

// Stop the server if either required value is missing.
if (!connectionString || !sessionSecret) {
  throw new Error('DATABASE_URL or SESSION_SECRET is missing')
}

// Create a PostgreSQL connection pool for storing sessions.
const sessionPool = new pg.Pool({
  connectionString
})

// Connect express-session to PostgreSQL.
const PgSessionStore = connectPgSimple(session)

// Create the session storage configuration.
// The session table will be created automatically if needed.
const store = new PgSessionStore({
  pool: sessionPool,
  tableName: 'user_sessions',
  createTableIfMissing: true
})

// Export the middleware so our Express server can use it.
export const sessionMiddleware = session({
  // Save session information in PostgreSQL.
  store,

  // Sign session cookies using our private secret.
  secret: sessionSecret,

  // Avoid unnecessary session updates.
  resave: false,

  // Don't create sessions for visitors who aren't logged in.
  saveUninitialized: false,

  cookie: {
    // Prevent browser JavaScript from accessing the cookie.
    httpOnly: true,

    // Require HTTPS in production.
    secure: process.env.NODE_ENV === 'production',

    // Provide some protection against cross-site requests.
    sameSite: 'lax',

    // Keep the session cookie valid for seven days.
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
})
