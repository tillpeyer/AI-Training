import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MenuPage from './MenuPage'
import { fetchMenu } from '../api/menu'

vi.mock('../api/menu', () => ({
  fetchMenu: vi.fn(),
}))

describe('MenuPage', () => {
  it('renders items from a mocked GET /api/v1/menu response', async () => {
    vi.mocked(fetchMenu).mockResolvedValue([
      { id: '1', name: 'Pasta Bolognese', priceChf: 12.5, available: true },
      { id: '2', name: 'Veggie Curry', priceChf: 10, available: true },
    ])

    render(<MenuPage />)

    // Name appears twice by design: once in the menu list, once as an <option> in the order form.
    expect(await screen.findAllByText('Pasta Bolognese')).toHaveLength(2)
    expect(screen.getAllByText('Veggie Curry')).toHaveLength(2)
    expect(screen.getByText(/CHF 12\.50/)).toBeInTheDocument()
  })
})
