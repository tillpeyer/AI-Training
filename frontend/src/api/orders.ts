import { apiFetch } from './http'
import { identityHeaders } from '../auth/identity'

export type OrderStatus = 'SUBMITTED' | 'CANCELLED'

export interface Order {
  id: string
  userId: string
  menuItemId: string
  quantity: number
  status: OrderStatus
  createdAt: string
}

export function fetchMyOrders(): Promise<Order[]> {
  return apiFetch<Order[]>('/api/v1/orders/me', { headers: identityHeaders(false) })
}

export function submitOrder(input: { menuItemId: string; quantity: number }): Promise<Order> {
  return apiFetch<Order>('/api/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...identityHeaders(false) },
    body: JSON.stringify(input),
  })
}

export function cancelOrder(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/orders/${id}/cancel`, {
    method: 'PATCH',
    headers: identityHeaders(false),
  })
}
