import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MyOrdersPage from './MyOrdersPage'
import { fetchMyOrders, cancelOrder } from '../api/orders'
import { fetchMenuItem } from '../api/menu'

vi.mock('../api/orders', () => ({
  fetchMyOrders: vi.fn(),
  cancelOrder: vi.fn(),
}))
vi.mock('../api/menu', () => ({
  fetchMenuItem: vi.fn(),
}))

const baseOrder = {
  id: 'o1',
  userId: 'day',
  menuItemId: 'm1',
  quantity: 1,
  status: 'SUBMITTED' as const,
  createdAt: '2026-01-01T10:00:00Z',
}

describe('MyOrdersPage name-resolution cache', () => {
  it('resolves each distinct menuItemId once, even across two orders and a reload after cancel', async () => {
    vi.mocked(fetchMyOrders).mockResolvedValue([
      baseOrder,
      { ...baseOrder, id: 'o2', createdAt: '2026-01-01T11:00:00Z' }, // same menuItemId — must not trigger a second lookup
    ])
    vi.mocked(fetchMenuItem).mockResolvedValue({ id: 'm1', name: 'Pasta', priceChf: 10, available: true })
    vi.mocked(cancelOrder).mockResolvedValue(undefined)

    render(<MyOrdersPage />)

    expect(await screen.findAllByText('Pasta')).toHaveLength(2)
    expect(fetchMenuItem).toHaveBeenCalledTimes(1)

    // Reload triggered by cancelling one order (sorted newest-first, so the first
    // Cancel button belongs to o2) — the already-resolved name must come from the
    // ref cache, not a new request.
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancel' })[0])

    await waitFor(() => expect(cancelOrder).toHaveBeenCalledWith('o2'))
    await screen.findByText('Order cancelled')

    expect(fetchMenuItem).toHaveBeenCalledTimes(1)
  })
})
