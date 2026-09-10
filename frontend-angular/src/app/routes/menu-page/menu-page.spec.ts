import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Identity } from '../../api/identity';
import { API_BASE, MenuItem } from '../../api/models';
import { MenuPage } from './menu-page';

const RISOTTO: MenuItem = {
  id: 'item-1',
  name: 'Risotto aux champignons',
  priceChf: 14.5,
  available: true,
};

function setup(userId = 'emp1') {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
  });

  TestBed.inject(Identity).signInAs(userId);

  const fixture = TestBed.createComponent(MenuPage);
  const http = TestBed.inject(HttpTestingController);
  return { fixture, http };
}

/**
 * `httpResource` is eager but needs an explicit `detectChanges()` to run its
 * request computation. Awaiting `whenStable()` first would deadlock against a
 * request nothing has answered yet.
 */
async function loadMenu(
  fixture: ComponentFixture<MenuPage>,
  http: HttpTestingController,
  items: MenuItem[],
) {
  fixture.detectChanges();
  http.expectOne(`${API_BASE}/menu`).flush(items);
  await fixture.whenStable();
  fixture.detectChanges();
}

/** An async submit continuation resolves in a later microtask than `whenStable()`. */
async function settle(fixture: ComponentFixture<MenuPage>) {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await fixture.whenStable();
  fixture.detectChanges();
}

function submitForm(fixture: ComponentFixture<MenuPage>) {
  fixture.nativeElement.querySelector('button[type="submit"]').click();
}

function setValue(fixture: ComponentFixture<MenuPage>, selector: string, value: string) {
  const el: HTMLInputElement | HTMLSelectElement = fixture.nativeElement.querySelector(selector);
  el.value = value;
  el.dispatchEvent(new Event('input'));
  el.dispatchEvent(new Event('change'));
  fixture.detectChanges();
  return el;
}

describe('MenuPage', () => {
  let fixture: ComponentFixture<MenuPage>;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    ({ fixture, http } = setup());
  });

  // Without this, any stray or duplicated request passes unnoticed — expectOne
  // only asserts about the URLs a test happens to name.
  afterEach(() => {
    http.verify();
  });

  it('renders the dish name and price only, with no availability indicator', async () => {
    await loadMenu(fixture, http, [RISOTTO]);

    const row: HTMLElement = fixture.nativeElement.querySelector('.dish-row');
    // Assert the cells the row is allowed to have, and that it has no others.
    // An assertion that merely lacks the string 'available' would be green by
    // construction, since nothing in the app ever rendered it.
    expect(row.querySelector('.dish-name')!.textContent).toBe('Risotto aux champignons');
    expect(row.querySelector('.dish-price')!.textContent).toBe('CHF 14.50');
    expect([...row.children].map((c) => c.className)).toEqual([
      'dish-name',
      'leader',
      'dish-price',
    ]);
  });

  it('renders the empty state for a zero-length menu', async () => {
    await loadMenu(fixture, http, []);

    expect(fixture.nativeElement.textContent).toContain('No dishes on the menu today.');
    expect(fixture.nativeElement.querySelector('.dish-row')).toBeNull();
  });

  it('renders fixed copy when the menu fails to load', async () => {
    fixture.detectChanges();
    http
      .expectOne(`${API_BASE}/menu`)
      .flush({ code: 'BOOM', message: 'kaboom' }, { status: 500, statusText: 'Server Error' });
    await settle(fixture);

    const banner = fixture.nativeElement.querySelector('.error-banner');
    expect(banner.textContent).toContain('Could not load the menu.');
    expect(banner.textContent).not.toContain('kaboom');
  });

  it('submits an order, then resets both fields and confirms', async () => {
    await loadMenu(fixture, http, [RISOTTO]);

    setValue(fixture, '#order-item', 'item-1');
    setValue(fixture, '#order-quantity', '2');
    submitForm(fixture);
    await settle(fixture);

    const post = http.expectOne(`${API_BASE}/orders`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ menuItemId: 'item-1', quantity: 2 });
    post.flush({ id: 'order-1' });
    await settle(fixture);

    expect(fixture.nativeElement.textContent).toContain('Order submitted.');
    expect(fixture.nativeElement.querySelector('#order-item').value).toBe('');
    // The numeric field is the one a broken reset leaves holding a stale value.
    expect(fixture.nativeElement.querySelector('#order-quantity').value).toBe('1');
  });

  it('renders ApiError.message, not the code, when the submit fails', async () => {
    await loadMenu(fixture, http, [RISOTTO]);

    setValue(fixture, '#order-item', 'item-1');
    setValue(fixture, '#order-quantity', '2');
    submitForm(fixture);
    await settle(fixture);

    http
      .expectOne(`${API_BASE}/orders`)
      .flush(
        { code: 'MENU_ITEM_NOT_FOUND', message: 'That dish is not on the menu.' },
        { status: 404, statusText: 'Not Found' },
      );
    await settle(fixture);

    const banner = fixture.nativeElement.querySelector('.error-banner');
    expect(banner.textContent).toContain('That dish is not on the menu.');
    expect(banner.textContent).not.toContain('MENU_ITEM_NOT_FOUND');
  });

  it('blocks a submit with an out-of-range quantity and sends no request', async () => {
    await loadMenu(fixture, http, [RISOTTO]);

    setValue(fixture, '#order-item', 'item-1');
    setValue(fixture, '#order-quantity', '11');
    submitForm(fixture);
    await settle(fixture);

    http.expectNone(`${API_BASE}/orders`);
    expect(fixture.nativeElement.querySelector('#order-quantity-error').textContent).toContain(
      'Quantity must be between 1 and 10.',
    );
  });

  it('blocks a submit with an empty quantity rather than posting null', async () => {
    await loadMenu(fixture, http, [RISOTTO]);

    setValue(fixture, '#order-item', 'item-1');
    setValue(fixture, '#order-quantity', '');
    submitForm(fixture);
    await settle(fixture);

    // min and max both short-circuit on an empty value; only the explicit
    // required() stops null reaching the backend and returning "must not be null".
    http.expectNone(`${API_BASE}/orders`);
    expect(fixture.nativeElement.querySelector('#order-quantity-error').textContent).toContain(
      'Quantity must be between 1 and 10.',
    );
  });

  it('reveals per-field errors when a pristine form is submitted', async () => {
    await loadMenu(fixture, http, [RISOTTO]);

    // Nothing touched, nothing blurred: this proves submit() marks the fields,
    // which is the whole reason the button is not disabled while invalid.
    submitForm(fixture);
    await settle(fixture);

    http.expectNone(`${API_BASE}/orders`);
    const item: HTMLSelectElement = fixture.nativeElement.querySelector('#order-item');
    expect(item.getAttribute('aria-invalid')).toBe('true');
    expect(item.getAttribute('aria-describedby')).toBe('order-item-error');
    expect(fixture.nativeElement.querySelector('#order-item-error').textContent).toContain(
      'Choose a dish.',
    );
  });

  it('refuses to order while signed out, without leaking the header error', async () => {
    ({ fixture, http } = setup(''));
    await loadMenu(fixture, http, [RISOTTO]);

    setValue(fixture, '#order-item', 'item-1');
    setValue(fixture, '#order-quantity', '2');
    submitForm(fixture);
    await settle(fixture);

    http.expectNone(`${API_BASE}/orders`);
    const banner = fixture.nativeElement.querySelector('.error-banner');
    expect(banner.textContent).toContain('Enter an employee id in "Sign in as" above to order.');
    expect(banner.textContent).not.toContain('X-User-Id');
  });
});
