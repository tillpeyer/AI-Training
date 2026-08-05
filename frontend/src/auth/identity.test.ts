import { describe, it, expect, beforeEach } from 'vitest'
import { getUserId, setUserId, identityHeaders } from './identity'

describe('identity', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns an empty string when no user id is stored', () => {
    expect(getUserId()).toBe('')
  })

  it('persists and reads back the user id', () => {
    setUserId('alice')
    expect(getUserId()).toBe('alice')
  })

  it('strips newlines from a pasted user id so it stays a valid header value', () => {
    setUserId('alice\r\nX-Injected: true')
    expect(getUserId()).toBe('aliceX-Injected: true')
  })

  it('includes X-User-Id but not X-Admin for non-admin routes', () => {
    setUserId('bob')
    const headers = identityHeaders(false) as Record<string, string>
    expect(headers['X-User-Id']).toBe('bob')
    expect(headers['X-Admin']).toBeUndefined()
  })

  it('adds X-Admin: true only for admin routes', () => {
    setUserId('carol')
    const headers = identityHeaders(true) as Record<string, string>
    expect(headers['X-User-Id']).toBe('carol')
    expect(headers['X-Admin']).toBe('true')
  })
})
