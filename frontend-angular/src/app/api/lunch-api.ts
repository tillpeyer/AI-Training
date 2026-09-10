import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import {
  API_BASE,
  ApiError,
  CreateMenuItemRequest,
  CreateOrderRequest,
  MenuItem,
  Order,
} from './models';

/**
 * Mutations against the Lunch Order API, plus the one availability-bypassing read.
 *
 * Reads are `httpResource` in the route components. Mutations go through
 * `HttpClient` here and are subscribed explicitly; after a successful mutation a
 * component calls `reload()` on the affected resource rather than patching a
 * local copy of server state.
 */
@Injectable({ providedIn: 'root' })
export class LunchApi {
  private readonly http = inject(HttpClient);

  submitOrder(body: CreateOrderRequest) {
    return this.http.post<Order>(`${API_BASE}/orders`, body);
  }

  cancelOrder(orderId: string) {
    return this.http.patch<void>(`${API_BASE}/orders/${orderId}/cancel`, {});
  }

  addMenuItem(body: CreateMenuItemRequest) {
    return this.http.post<MenuItem>(`${API_BASE}/menu/items`, body);
  }

  /**
   * Resolves one menu item by id, regardless of whether it is still available.
   *
   * This is the only supported way to resolve a `menuItemId` held on an `Order`.
   * The case it exists for is an item turned **unavailable** after the order was
   * placed: `GET /menu` filters to available items, so that order would come back
   * nameless. Note it is not about deletion — `MenuService.deleteById` throws
   * `MenuItemHasOrdersException` while any order references the item, so an
   * ordered dish can never be removed.
   *
   * It is a read on a mutation service by design: the number and identity of
   * lookups is data-dependent, which does not fit `httpResource`'s
   * single-resource-per-declaration model. The cache on top is component-local.
   */
  getMenuItem(menuItemId: string) {
    return this.http.get<MenuItem>(`${API_BASE}/menu/${menuItemId}`);
  }
}

/**
 * The only place an `HttpErrorResponse` becomes display text.
 *
 * Renders `ApiError.message` and never `ApiError.code` — the code is for logs
 * and tests. Domain messages are authored for display; a framework message is
 * not, so anything that is not an `ApiError` falls back to fixed copy.
 */
export function apiErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Could not reach the server. Is the backend running?';
    }

    const body = error.error as ApiError | null;
    if (body && typeof body.message === 'string' && body.message) {
      return body.message;
    }

    return `Request failed with status ${error.status}.`;
  }

  return 'Something went wrong.';
}
