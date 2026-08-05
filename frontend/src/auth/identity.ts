const STORAGE_KEY = 'lunch-order.userId'

export function getUserId(): string {
  return localStorage.getItem(STORAGE_KEY) ?? ''
}

export function setUserId(userId: string): void {
  // Strip characters invalid in an HTTP header value (e.g. a pasted trailing
  // newline) — otherwise a later fetch() throws synchronously and uncaught.
  localStorage.setItem(STORAGE_KEY, userId.replace(/[\r\n]/g, ''))
}

export function identityHeaders(isAdminRoute: boolean): HeadersInit {
  const headers: Record<string, string> = { 'X-User-Id': getUserId() }
  if (isAdminRoute) {
    headers['X-Admin'] = 'true'
  }
  return headers
}
