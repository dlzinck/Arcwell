
/**
 * Arcwell Authentication Types
 */

// Represents a user returned by the backend.
// Passwords and password hashes are never included.
export type User = {
  id: string
  name: string
  email: string
}

// Information required to create a new account.
export type RegisterRequest = {
  name: string
  email: string
  password: string
}

// Information required to log into an existing account.
export type LoginRequest = {
  email: string
  password: string
}

// Response returned after successful registration.
export type RegisterResponse = {
  status: string
  message: string
  user: User
}

// Response returned after successful login.
export type LoginResponse = {
  status: string
  message: string
  user: User
}

// Response returned when checking the current session.
export type CurrentUserResponse = {
  status: string
  user: User
}

// Response returned after logging out.
export type LogoutResponse = {
  status: string
  message: string
}