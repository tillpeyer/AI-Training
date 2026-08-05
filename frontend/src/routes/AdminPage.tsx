import { useState, type FormEvent } from 'react'
import { createMenuItem } from '../api/menu'
import ErrorBanner from '../components/ErrorBanner'
import { useAutoDismiss } from '../hooks/useAutoDismiss'

export default function AdminPage() {
  const [name, setName] = useState('')
  const [priceChf, setPriceChf] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  useAutoDismiss(confirmation, () => setConfirmation(null))

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setConfirmation(null)
    try {
      await createMenuItem({ name, priceChf: Number(priceChf) })
      setConfirmation('Menu item added')
      setName('')
      setPriceChf('')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div>
      <h1>Add Menu Item</h1>
      <ErrorBanner message={error} />
      {confirmation && <div className="banner-success">{confirmation}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="item-name-input">Name</label>
          <input
            id="item-name-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="item-price-input">Price (CHF)</label>
          <input
            id="item-price-input"
            type="number"
            step="0.01"
            min="0"
            value={priceChf}
            onChange={(event) => setPriceChf(event.target.value)}
            required
          />
        </div>
        <button type="submit" className="primary">
          Add item
        </button>
      </form>
    </div>
  )
}
