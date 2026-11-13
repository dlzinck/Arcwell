
/**
 * Arcwell Authentication API
 */

import { apiRequest } from './api'

import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  CurrentUserResponse,
  LogoutResponse
} from '../types/auth'

/**
 * Registers a new Arcwell user.
 */
export async function registerUser(
  userData: RegisterRequest
): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  })
}

/**
 * Logs an existing user into Arcwell.
 */
export async function loginUser(
  credentials: LoginRequest
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  })
}

/**
 * Checks whether the visitor is already logged in.
 */
export async function getCurrentUser(): Promise<CurrentUserResponse> {
  return apiRequest<CurrentUserResponse>('/api/auth/me')
}

/**
 * Logs the current user out of Arcwell.
 */
export async function logoutUser(): Promise<LogoutResponse> {
  return apiRequest<LogoutResponse>('/api/auth/logout', {
    method: 'POST'
  })
}
