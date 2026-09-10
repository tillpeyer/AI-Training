import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

import { Identity } from './identity';

/**
 * Attaches both identity headers. No component sets them itself.
 *
 * `X-Admin` is derived from the router's current URL rather than from stored
 * state, which is what keeps "admin only on /admin" true by construction: no
 * component can opt itself in, and navigating away drops the header.
 *
 * An empty employee id sends no `X-User-Id` at all. The backend answers a
 * missing header with `400 MISSING_USER` — there is no 401 anywhere in this API.
 */
export const identityHeadersInterceptor: HttpInterceptorFn = (req, next) => {
  const identity = inject(Identity);
  const router = inject(Router);

  const setHeaders: Record<string, string> = {};

  // Normalised, never the raw input: whitespace is not an employee id.
  const userId = identity.userId();
  if (userId) {
    setHeaders['X-User-Id'] = userId;
  }

  if (router.url.startsWith('/admin')) {
    setHeaders['X-Admin'] = 'true';
  }

  return next(Object.keys(setHeaders).length ? req.clone({ setHeaders }) : req);
};
