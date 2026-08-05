const API_BASE_URL = 'http://localhost:8080'

export class ApiRequestError extends Error {}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options)
  } catch {
    throw new ApiRequestError('Could not reach the server. Check your connection and try again.')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ApiRequestError(body?.message ?? `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}
