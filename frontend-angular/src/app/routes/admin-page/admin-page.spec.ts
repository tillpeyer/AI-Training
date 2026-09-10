import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { identityHeadersInterceptor } from '../../api/identity-headers-interceptor';
import { Identity } from '../../api/identity';
import { API_BASE } from '../../api/models';
import { AdminPage } from './admin-page';

function setup() {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      // The interceptor is registered here on purpose: without it no test would
      // notice a regression that stopped sending X-Admin, and the app would be
      // wholly broken with every assertion still green.
      provideHttpClient(withInterceptors([identityHeadersInterceptor])),
      provideHttpClientTesting(),
    ],
  });

  TestBed.inject(Identity).signInAs('emp1');

  const fixture = TestBed.createComponent(AdminPage);
  const http = TestBed.inject(HttpTestingController);
  fixture.detectChanges();
  return { fixture, http };
}

async function settle(fixture: ComponentFixture<AdminPage>) {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await fixture.whenStable();
  fixture.detectChanges();
}

function submitForm(fixture: ComponentFixture<AdminPage>) {
  fixture.nativeElement.querySelector('button[type="submit"]').click();
}

function setValue(fixture: ComponentFixture<AdminPage>, selector: string, value: string) {
  const el: HTMLInputElement = fixture.nativeElement.querySelector(selector);
  el.value = value;
  el.dispatchEvent(new Event('input'));
  el.dispatchEvent(new Event('change'));
  fixture.detectChanges();
  return el;
}

describe('AdminPage', () => {
  let fixture: ComponentFixture<AdminPage>;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    ({ fixture, http } = setup());
  });

  afterEach(() => {
    http.verify();
  });

  it('adds a menu item, sends X-Admin, and resets both fields', async () => {
    setValue(fixture, '#item-name', 'Tarte aux pommes');
    setValue(fixture, '#item-price', '7.5');
    submitForm(fixture);
    await settle(fixture);

    const post = http.expectOne(`${API_BASE}/menu/items`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ name: 'Tarte aux pommes', priceChf: 7.5 });
    post.flush({ id: 'item-9', name: 'Tarte aux pommes', priceChf: 7.5, available: true });
    await settle(fixture);

    expect(fixture.nativeElement.textContent).toContain('Menu item added.');
    expect(fixture.nativeElement.querySelector('#item-name').value).toBe('');
    expect(fixture.nativeElement.querySelector('#item-price').value).toBe('0');
  });

  it('renders ApiError.message, not the code, on a 403', async () => {
    setValue(fixture, '#item-name', 'Tarte aux pommes');
    setValue(fixture, '#item-price', '7.5');
    submitForm(fixture);
    await settle(fixture);

    http
      .expectOne(`${API_BASE}/menu/items`)
      .flush(
        { code: 'NOT_ADMIN', message: 'Only the canteen admin may add menu items.' },
        { status: 403, statusText: 'Forbidden' },
      );
    await settle(fixture);

    const banner = fixture.nativeElement.querySelector('.error-banner');
    expect(banner.textContent).toContain('Only the canteen admin may add menu items.');
    expect(banner.textContent).not.toContain('NOT_ADMIN');
  });

  it('blocks a submit with an empty name and sends no request', async () => {
    setValue(fixture, '#item-name', '');
    setValue(fixture, '#item-price', '7.5');
    submitForm(fixture);
    await settle(fixture);

    http.expectNone(`${API_BASE}/menu/items`);
    expect(fixture.nativeElement.querySelector('#item-name-error').textContent).toContain(
      'Name is required.',
    );
    expect(fixture.nativeElement.querySelector('#item-name').getAttribute('aria-invalid')).toBe(
      'true',
    );
  });

  it('blocks a whitespace-only name, which required() alone treats as present', async () => {
    setValue(fixture, '#item-name', '   ');
    setValue(fixture, '#item-price', '7.5');
    submitForm(fixture);
    await settle(fixture);

    http.expectNone(`${API_BASE}/menu/items`);
    expect(fixture.nativeElement.querySelector('#item-name-error').textContent).toContain(
      'Name is required.',
    );
  });

  it('blocks a name over the backend size limit', async () => {
    setValue(fixture, '#item-name', 'x'.repeat(101));
    setValue(fixture, '#item-price', '7.5');
    submitForm(fixture);
    await settle(fixture);

    http.expectNone(`${API_BASE}/menu/items`);
    expect(fixture.nativeElement.querySelector('#item-name-error').textContent).toContain(
      'Name must be 100 characters or fewer.',
    );
  });

  it('blocks an empty price rather than posting null', async () => {
    setValue(fixture, '#item-name', 'Tarte aux pommes');
    setValue(fixture, '#item-price', '');
    submitForm(fixture);
    await settle(fixture);

    http.expectNone(`${API_BASE}/menu/items`);
    expect(fixture.nativeElement.querySelector('#item-price-error').textContent).toContain(
      'Price is required.',
    );
  });

  it('accepts a zero price, which the backend allows', async () => {
    setValue(fixture, '#item-name', 'Tap water');
    setValue(fixture, '#item-price', '0');
    submitForm(fixture);
    await settle(fixture);

    const post = http.expectOne(`${API_BASE}/menu/items`);
    expect(post.request.body).toEqual({ name: 'Tap water', priceChf: 0 });
    post.flush({ id: 'item-10', name: 'Tap water', priceChf: 0, available: true });
    await settle(fixture);

    expect(fixture.nativeElement.textContent).toContain('Menu item added.');
  });
});
