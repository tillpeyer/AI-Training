import { apiFetch } from './http'
import { identityHeaders } from '../auth/identity'

export interface MenuItem {
  id: string
  name: string
  priceChf: number
  available: boolean
}

export function fetchMenu(): Promise<MenuItem[]> {
  return apiFetch<MenuItem[]>('/api/v1/menu')
}

export function fetchMenuItem(id: string): Promise<MenuItem> {
  return apiFetch<MenuItem>(`/api/v1/menu/${id}`)
}

export function createMenuItem(input: { name: string; priceChf: number }): Promise<MenuItem> {
  return apiFetch<MenuItem>('/api/v1/menu/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...identityHeaders(true) },
    body: JSON.stringify(input),
  })
}
