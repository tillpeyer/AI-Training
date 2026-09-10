/** Wire types for the Lunch Order API, and the one place its base URL is written down. */

/**
 * The backend allows exactly one CORS origin (`http://localhost:5173`), so the
 * API is called at its absolute URL rather than through a dev-server proxy.
 * A proxy was deliberately rejected so the CORS configuration stays exercised.
 */
export const API_BASE = 'http://localhost:8080/api/v1';

export interface MenuItem {
  id: string;
  name: string;
  priceChf: number;
  available: boolean;
}

export type OrderStatus = 'SUBMITTED' | 'CANCELLED';

export interface Order {
  id: string;
  userId: string;
  menuItemId: string;
  quantity: number;
  status: OrderStatus;
  createdAt: string;
}

/** Every non-2xx response body has exactly these two fields. */
export interface ApiError {
  code: string;
  message: string;
}

export interface CreateOrderRequest {
  menuItemId: string;
  quantity: number;
}

export interface CreateMenuItemRequest {
  name: string;
  priceChf: number;
}
