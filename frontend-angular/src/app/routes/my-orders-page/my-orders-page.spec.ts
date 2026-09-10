import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Identity } from '../../api/identity';
import { API_BASE, Order } from '../../api/models';
import { MyOrdersPage } from './my-orders-page';

const NEWER: Order = {
  id: 'order-2',
  userId: 'emp1',
  menuItemId: 'item-2',
  quantity: 1,
  status: 'SUBMITTED',
  createdAt: '2026-09-10T11:00:00Z',
};

const OLDER: Order = {
  id: 'order-1',
  userId: 'emp1',
  menuItemId: 'item-1',
  quantity: 2,
  status: 'SUBMITTED',
  createdAt: '2026-09-09T11:00:00Z',
};

function setup(userId = 'emp1') {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
  });

  const identity = TestBed.inject(Identity);
  identity.signInAs(userId);

  const fixture = TestBed.createComponent(MyOrdersPage);
  const http = TestBed.inject(HttpTestingController);
  return { fixture, http, identity };
}

async function settle(fixture: ComponentFixture<MyOrdersPage>) {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await fixture.whenStable();
  fixture.detectChanges();
}

/**
 * Advances a turn WITHOUT awaiting stability.
 *
 * Use this whenever the previous step left a resource request outstanding —
 * `reload()` is the case that bites. `whenStable()` waits for every pending
 * request to settle, so awaiting it before answering that request deadlocks.
 */
async function pump(fixture: ComponentFixture<MyOrdersPage>) {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

/** `httpResource` needs the explicit `detectChanges()` before its request exists. */
async function loadOrders(
  fixture: ComponentFixture<MyOrdersPage>,
  http: HttpTestingController,
  orders: Order[],
) {
  fixture.detectChanges();
  http.expectOne(`${API_BASE}/orders/me`).flush(orders);
  await settle(fixture);
}

function resolveNames(http: HttpTestingController, names: Record<string, string>) {
  for (const [id, name] of Object.entries(names)) {
    http.expectOne(`${API_BASE}/menu/${id}`).flush({ id, name, priceChf: 9.5, available: false });
  }
}

function rowText(fixture: ComponentFixture<MyOrdersPage>): string[] {
  return [...fixture.nativeElement.querySelectorAll('tbody tr')].map((tr) =>
    (tr as HTMLElement).querySelector('.dish')!.textContent!.trim(),
  );
}

describe('MyOrdersPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the response order exactly as received, even when it is not sorted', async () => {
    const { fixture, http } = setup();
    // Deliberately oldest-first. A fixture that is already newest-first cannot
    // detect a client-side re-sort, because a sort would produce the same output.
    await loadOrders(fixture, http, [OLDER, NEWER]);
    resolveNames(http, { 'item-1': 'Risotto aux champignons', 'item-2': 'Soupe du jour' });
    await settle(fixture);

    expect(rowText(fixture)).toEqual(['Risotto aux champignons', 'Soupe du jour']);
    http.verify();
  });

  it('resolves a name by id for an item no longer on the menu', async () => {
    const { fixture, http } = setup();
    await loadOrders(fixture, http, [NEWER]);

    const byId = http.expectOne(`${API_BASE}/menu/item-2`);
    expect(byId.request.method).toBe('GET');
    byId.flush({ id: 'item-2', name: 'Soupe du jour', priceChf: 6.5, available: false });
    await settle(fixture);

    expect(rowText(fixture)).toEqual(['Soupe du jour']);
    http.expectNone(`${API_BASE}/menu`);
    http.verify();
  });

  it('issues one by-id request per distinct menu item, not per order', async () => {
    const { fixture, http } = setup();
    await loadOrders(fixture, http, [NEWER, { ...NEWER, id: 'order-3' }]);

    const requests = http.match(`${API_BASE}/menu/item-2`);
    expect(requests.length).toBe(1);
    requests[0].flush({ id: 'item-2', name: 'Soupe du jour', priceChf: 6.5, available: false });
    await settle(fixture);

    expect(rowText(fixture)).toEqual(['Soupe du jour', 'Soupe du jour']);
    http.verify();
  });

  it('caches a bounded fallback when a name lookup fails', async () => {
    const { fixture, http } = setup();
    await loadOrders(fixture, http, [NEWER]);

    http
      .expectOne(`${API_BASE}/menu/item-2`)
      .flush({ code: 'INVALID_ID', message: 'nope' }, { status: 400, statusText: 'Bad Request' });
    await settle(fixture);

    // Not the loading placeholder for ever, and the confirm button still names
    // something rather than degrading to "Cancel order of …".
    expect(rowText(fixture)).toEqual(['Unknown dish']);
    const cancel = fixture.nativeElement.querySelector('.actions button');
    expect(cancel.getAttribute('aria-label')).not.toContain('…');
    http.verify();
  });

  it('fires no request at all when no employee id is entered', async () => {
    const { fixture, http } = setup('');
    fixture.detectChanges();
    await settle(fixture);

    http.expectNone(`${API_BASE}/orders/me`);
    expect(fixture.nativeElement.textContent).toContain(
      'Enter an employee id in "Sign in as" above to see your orders.',
    );
    http.verify();
  });

  it('shows fixed copy on a read failure rather than the backend message', async () => {
    const { fixture, http } = setup();
    fixture.detectChanges();
    http
      .expectOne(`${API_BASE}/orders/me`)
      .flush(
        { code: 'MISSING_USER', message: 'X-User-Id is required.' },
        { status: 400, statusText: 'Bad Request' },
      );
    await settle(fixture);

    const banner = fixture.nativeElement.querySelector('.error-banner');
    expect(banner.textContent).toContain('Could not load your orders.');
    expect(banner.textContent).not.toContain('X-User-Id is required.');
    http.verify();
  });

  it('arms the row on the first click and sends nothing', async () => {
    const { fixture, http } = setup();
    await loadOrders(fixture, http, [NEWER]);
    resolveNames(http, { 'item-2': 'Soupe du jour' });
    await settle(fixture);

    fixture.nativeElement.querySelector('.actions button').click();
    await settle(fixture);

    http.expectNone(`${API_BASE}/orders/order-2/cancel`);
    expect(fixture.nativeElement.querySelector('tbody tr').classList).toContain('armed');
    expect(fixture.nativeElement.textContent).toContain('Cancel order');
    expect(fixture.nativeElement.textContent).toContain('Keep');
    http.verify();
  });

  it('names the confirm button after the row it acts on', async () => {
    const { fixture, http } = setup();
    await loadOrders(fixture, http, [NEWER]);
    resolveNames(http, { 'item-2': 'Soupe du jour' });
    await settle(fixture);

    fixture.nativeElement.querySelector('.actions button').click();
    await settle(fixture);

    expect(fixture.nativeElement.querySelector('.btn-confirm').getAttribute('aria-label')).toBe(
      'Cancel order of Soupe du jour',
    );
    http.verify();
  });

  it('disarms on Keep, on Escape from outside the table, and when another row arms', async () => {
    const { fixture, http } = setup();
    await loadOrders(fixture, http, [NEWER, OLDER]);
    resolveNames(http, { 'item-2': 'Soupe du jour', 'item-1': 'Risotto aux champignons' });
    await settle(fixture);

    const armRow = async (index: number) => {
      fixture.nativeElement
        .querySelectorAll('tbody tr')
        [index].querySelector('[data-arm-id]')
        .click();
      await settle(fixture);
    };

    await armRow(0);
    fixture.nativeElement.querySelectorAll('.actions .btn-quiet')[0].click();
    await settle(fixture);
    expect(fixture.nativeElement.querySelector('.armed')).toBeNull();

    // Escape is bound on the document, so it works with focus anywhere.
    await armRow(0);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle(fixture);
    expect(fixture.nativeElement.querySelector('.armed')).toBeNull();

    await armRow(0);
    await armRow(1);
    const armedRows = fixture.nativeElement.querySelectorAll('tbody tr.armed');
    expect(armedRows.length).toBe(1);
    expect(armedRows[0].querySelector('.dish').textContent.trim()).toBe('Risotto aux champignons');

    http.expectNone(`${API_BASE}/orders/order-2/cancel`);
    http.expectNone(`${API_BASE}/orders/order-1/cancel`);
    http.verify();
  });

  it('cancels on confirm, reloads from the server, and confirms', async () => {
    const { fixture, http } = setup();
    await loadOrders(fixture, http, [NEWER]);
    resolveNames(http, { 'item-2': 'Soupe du jour' });
    await settle(fixture);

    fixture.nativeElement.querySelector('.actions button').click();
    await settle(fixture);
    fixture.nativeElement.querySelector('.btn-confirm').click();
    await settle(fixture);

    const patch = http.expectOne(`${API_BASE}/orders/order-2/cancel`);
    expect(patch.request.method).toBe('PATCH');
    patch.flush(null, { status: 204, statusText: 'No Content' });
    // reload() leaves a request outstanding, so pump rather than settle here.
    await pump(fixture);

    http.expectOne(`${API_BASE}/orders/me`).flush([{ ...NEWER, status: 'CANCELLED' }]);
    await settle(fixture);

    expect(fixture.nativeElement.textContent).toContain('Order cancelled.');
    expect(fixture.nativeElement.querySelector('.status').textContent).toContain('CANCELLED');
    http.verify();
  });

  it('blocks every row while a cancel is in flight', async () => {
    const { fixture, http } = setup();
    await loadOrders(fixture, http, [NEWER, OLDER]);
    resolveNames(http, { 'item-2': 'Soupe du jour', 'item-1': 'Risotto aux champignons' });
    await settle(fixture);

    fixture.nativeElement.querySelectorAll('tbody tr')[0].querySelector('[data-arm-id]').click();
    await settle(fixture);
    fixture.nativeElement.querySelector('.btn-confirm').click();
    await settle(fixture);

    const patch = http.expectOne(`${API_BASE}/orders/order-2/cancel`);
    // The sibling row's Cancel must be unusable, or two cancels could be open
    // at once against single unkeyed armed/cancelling state.
    const sibling = fixture.nativeElement
      .querySelectorAll('tbody tr')[1]
      .querySelector('[data-arm-id]');
    expect(sibling.disabled).toBe(true);

    patch.flush(null, { status: 204, statusText: 'No Content' });
    await pump(fixture);
    http.expectOne(`${API_BASE}/orders/me`).flush([{ ...NEWER, status: 'CANCELLED' }, OLDER]);
    await settle(fixture);
    http.verify();
  });

  it('renders the backend message, disarms, and refetches when the cancel is rejected', async () => {
    const { fixture, http } = setup();
    await loadOrders(fixture, http, [NEWER]);
    resolveNames(http, { 'item-2': 'Soupe du jour' });
    await settle(fixture);

    fixture.nativeElement.querySelector('.actions button').click();
    await settle(fixture);
    fixture.nativeElement.querySelector('.btn-confirm').click();
    await settle(fixture);

    http
      .expectOne(`${API_BASE}/orders/order-2/cancel`)
      .flush(
        { code: 'ALREADY_CANCELLED', message: 'That order is already cancelled.' },
        { status: 409, statusText: 'Conflict' },
      );
    await pump(fixture);

    // A 409 means our copy is wrong, so the list is refetched rather than left
    // offering an action that can only fail again.
    http.expectOne(`${API_BASE}/orders/me`).flush([{ ...NEWER, status: 'CANCELLED' }]);
    await settle(fixture);

    const banner = fixture.nativeElement.querySelector('.error-banner');
    expect(banner.textContent).toContain('That order is already cancelled.');
    expect(banner.textContent).not.toContain('ALREADY_CANCELLED');
    expect(fixture.nativeElement.querySelector('.armed')).toBeNull();
    http.verify();
  });

  it('clears armed and confirmation state when the employee id changes', async () => {
    const { fixture, http, identity } = setup();
    await loadOrders(fixture, http, [NEWER]);
    resolveNames(http, { 'item-2': 'Soupe du jour' });
    await settle(fixture);

    fixture.nativeElement.querySelector('.actions button').click();
    await settle(fixture);
    expect(fixture.nativeElement.querySelector('.armed')).not.toBeNull();

    identity.signInAs('emp2');
    await pump(fixture);
    http.expectOne(`${API_BASE}/orders/me`).flush([]);
    await settle(fixture);

    // Otherwise the polite live region keeps announcing "Cancel this order?"
    // for a row belonging to the previous employee.
    expect(fixture.nativeElement.querySelector('.armed')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Cancel this order?');
    expect(fixture.nativeElement.textContent).toContain('You have no orders yet.');
    http.verify();
  });
});
