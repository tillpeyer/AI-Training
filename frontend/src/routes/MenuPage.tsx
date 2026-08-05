import { useEffect, useState, type FormEvent } from 'react'
import { fetchMenu, type MenuItem } from '../api/menu'
import { submitOrder } from '../api/orders'
import ErrorBanner from '../components/ErrorBanner'
import { useAutoDismiss } from '../hooks/useAutoDismiss'

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [selectedItemId, setSelectedItemId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  useAutoDismiss(confirmation, () => setConfirmation(null))

  useEffect(() => {
    fetchMenu()
      .then((data) => {
        setItems(data)
        if (data.length > 0) {
          setSelectedItemId(data[0].id)
        }
      })
      .catch((err: Error) => setError(err.message))
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setConfirmation(null)
    try {
      await submitOrder({ menuItemId: selectedItemId, quantity })
      setConfirmation('Order submitted')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div>
      <h1>Today's Menu</h1>
      <ErrorBanner message={error} />
      {confirmation && <div className="banner-success">{confirmation}</div>}

      {items.map((item) => (
        <div className="card" key={item.id}>
          <span>{item.name}</span> — <span>CHF {item.priceChf.toFixed(2)}</span>
        </div>
      ))}

      {items.length > 0 && (
        <form onSubmit={handleSubmit}>
          <h2>Order</h2>
          <div>
            <label htmlFor="menu-item-select">Item</label>
            <select
              id="menu-item-select"
              value={selectedItemId}
              onChange={(event) => setSelectedItemId(event.target.value)}
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="quantity-input">Quantity</label>
            <input
              id="quantity-input"
              type="number"
              min={1}
              max={10}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </div>
          <button type="submit" className="primary">
            Order
          </button>
        </form>
      )}
    </div>
  )
}
