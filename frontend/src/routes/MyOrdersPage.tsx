import { useEffect, useState, useCallback, useRef } from 'react'
import { fetchMyOrders, cancelOrder, type Order } from '../api/orders'
import { fetchMenuItem } from '../api/menu'
import ErrorBanner from '../components/ErrorBanner'
import { useAutoDismiss } from '../hooks/useAutoDismiss'

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [itemNames, setItemNames] = useState<Record<string, string>>({})
  // Cache lives in a ref (not just the itemNames state) so loadOrders — an empty-deps
  // useCallback — always reads the latest cache instead of a stale closure over state.
  const itemNamesCache = useRef<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  useAutoDismiss(confirmation, () => setConfirmation(null))

  const loadOrders = useCallback(async () => {
    try {
      const data = await fetchMyOrders()
      const sorted = [...data].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      setOrders(sorted)

      const distinctIds = [...new Set(sorted.map((order) => order.menuItemId))]
      const unresolvedIds = distinctIds.filter((id) => !(id in itemNamesCache.current))
      if (unresolvedIds.length > 0) {
        // allSettled, not all: one failed name lookup should not discard names
        // successfully resolved in the same batch.
        const resolved = await Promise.allSettled(
          unresolvedIds.map((id) => fetchMenuItem(id).then((item) => [id, item.name] as const)),
        )
        const fulfilled = resolved
          .filter((result): result is PromiseFulfilledResult<readonly [string, string]> => result.status === 'fulfilled')
          .map((result) => result.value)
        itemNamesCache.current = { ...itemNamesCache.current, ...Object.fromEntries(fulfilled) }
        setItemNames(itemNamesCache.current)
      }
    } catch (err) {
      setError((err as Error).message)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  async function handleCancel(id: string) {
    setError(null)
    setConfirmation(null)
    try {
      await cancelOrder(id)
      setConfirmation('Order cancelled')
      await loadOrders()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div>
      <h1>My Orders</h1>
      <ErrorBanner message={error} />
      {confirmation && <div className="banner-success">{confirmation}</div>}

      {orders.map((order) => (
        <div className="card" key={order.id}>
          <span>{itemNames[order.menuItemId] ?? order.menuItemId}</span> × {order.quantity} —{' '}
          <span className={order.status === 'CANCELLED' ? 'status-cancelled' : 'status-submitted'}>
            {order.status}
          </span>
          {order.status === 'SUBMITTED' && (
            <button className="danger" onClick={() => handleCancel(order.id)}>
              Cancel
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
