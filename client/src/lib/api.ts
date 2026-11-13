/**
 * Arcwell API Utility
 */

// Describes the structure of an error returned by our API.
type ApiErrorResponse = {
  status?: string
  message?: string
}

// Custom error class that preserves the HTTP status code.
export class ApiError extends Error {
  // Declare the property explicitly for TypeScript.
  public statusCode: number

  constructor(statusCode: number, message: string) {
    // Initialize the standard JavaScript Error class.
    super(message)

    // Identify this error as an API error.
    this.name = 'ApiError'

    // Store the HTTP status code for later use.
    this.statusCode = statusCode
  }
}

/**
 * Sends an HTTP request to the Arcwell backend.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // All API requests must use our backend's /api prefix.
  if (!endpoint.startsWith('/api/')) {
    throw new Error('API endpoints must start with /api/')
  }

  // Send the request through Vite's existing development proxy.
  const response = await fetch(endpoint, {
    ...options,

    // Include the browser's session cookie when available.
    // This allows Express to recognize authenticated users.
    credentials: 'include',

    // Provide default headers while allowing callers to override them.
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  // Read the response as text first so empty responses are supported.
  const responseText = await response.text()

  // Parse JSON only when the response contains data.
  let data: unknown = null

  if (responseText) {
    try {
      data = JSON.parse(responseText)
    } catch {
      throw new Error('The server returned an invalid JSON response')
    }
  }

  // Convert unsuccessful HTTP responses into useful errors.
  if (!response.ok) {
    const errorData = data as ApiErrorResponse | null

    throw new ApiError(
      response.status,
      errorData?.message ?? 'An unexpected API error occurred'
    )
  }

  // Return the successfully parsed response.
  return data as T
}