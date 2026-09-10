import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Identity } from './identity';
import { identityHeadersInterceptor } from './identity-headers-interceptor';

/**
 * The interceptor is the single most surprising decision in the frontend:
 * `X-Admin` comes from the router URL, never from stored state. Nothing else
 * keeps that true, so it is fenced here — a regression that swapped it for a
 * stored flag, or that stopped sending `X-User-Id` and broke every order
 * endpoint with `400 MISSING_USER`, would otherwise leave every test green.
 */
describe('identityHeadersInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let identity: Identity;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        // Real route definitions: navigateByUrl must resolve for router.url
        // to change, and router.url is the whole mechanism under test.
        provideRouter([
          { path: 'admin', children: [] },
          { path: 'orders', children: [] },
          { path: '', children: [] },
        ]),
        provideHttpClient(withInterceptors([identityHeadersInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    identity = TestBed.inject(Identity);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    backend.verify();
  });

  function headersFor(url = '/api/thing') {
    http.get(url).subscribe({ next: () => {}, error: () => {} });
    const req = backend.expectOne(url);
    req.flush({});
    return req.request.headers;
  }

  it('sends X-User-Id when an employee id is set', () => {
    identity.signInAs('emp1');
    expect(headersFor().get('X-User-Id')).toBe('emp1');
  });

  it('omits X-User-Id entirely when signed out', () => {
    identity.signInAs('');
    expect(headersFor().has('X-User-Id')).toBe(false);
  });

  it('normalises a padded employee id rather than sending the padding', () => {
    identity.signInAs('  emp1  ');
    expect(headersFor().get('X-User-Id')).toBe('emp1');
  });

  it('omits X-User-Id for a whitespace-only id, which is not an employee', () => {
    identity.type('   ');
    expect(headersFor().has('X-User-Id')).toBe(false);
  });

  it('does not send X-Admin outside /admin', () => {
    identity.signInAs('emp1');
    expect(headersFor().has('X-Admin')).toBe(false);
  });

  it('sends X-Admin: true exactly while the router is under /admin', async () => {
    identity.signInAs('emp1');
    await router.navigateByUrl('/admin');
    // Exact string: the backend fails closed on anything but "true".
    expect(headersFor().get('X-Admin')).toBe('true');
  });

  it('drops X-Admin again as soon as the router leaves /admin', async () => {
    identity.signInAs('emp1');
    await router.navigateByUrl('/admin');
    expect(headersFor().get('X-Admin')).toBe('true');

    await router.navigateByUrl('/orders');
    expect(headersFor().has('X-Admin')).toBe(false);
  });
});
