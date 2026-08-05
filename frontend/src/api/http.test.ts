import { describe, it, expect, vi, afterEach } from 'vitest'
import { apiFetch, ApiRequestError } from './http'

describe('apiFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns parsed JSON on a 2xx response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ hello: 'world' }),
      }),
    )

    const result = await apiFetch<{ hello: string }>('/api/v1/menu')

    expect(result).toEqual({ hello: 'world' })
  })

  it('returns undefined on a 204 No Content response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 204 }),
    )

    const result = await apiFetch('/api/v1/orders/123/cancel')

    expect(result).toBeUndefined()
  })

  it('throws an ApiRequestError with the backend message on a non-2xx response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ code: 'INVALID_QUANTITY', message: 'Quantity must be between 1 and 10' }),
      }),
    )

    await expect(apiFetch('/api/v1/orders')).rejects.toThrow(
      new ApiRequestError('Quantity must be between 1 and 10'),
    )
  })

  it('throws a friendly ApiRequestError when fetch itself rejects (network down)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(apiFetch('/api/v1/menu')).rejects.toThrow(ApiRequestError)
    await expect(apiFetch('/api/v1/menu')).rejects.toThrow(/could not reach the server/i)
  })

  it('falls back to a generic message when the error body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('not json')),
      }),
    )

    await expect(apiFetch('/api/v1/menu')).rejects.toThrow('Request failed with status 500')
  })
})
