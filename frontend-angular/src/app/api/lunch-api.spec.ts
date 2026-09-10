import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';

import { apiErrorMessage } from './lunch-api';

/**
 * The one place an `HttpErrorResponse` becomes display text. Its contract is
 * that `ApiError.message` is rendered, `ApiError.code` never is, and no
 * framework-authored string reaches a field the UI shows.
 */
describe('apiErrorMessage', () => {
  it('renders the ApiError message', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: { code: 'ALREADY_CANCELLED', message: 'That order is already cancelled.' },
    });

    expect(apiErrorMessage(error)).toBe('That order is already cancelled.');
  });

  it('never renders the ApiError code', () => {
    const error = new HttpErrorResponse({
      status: 403,
      error: { code: 'NOT_ADMIN', message: 'Only the canteen admin may add menu items.' },
    });

    expect(apiErrorMessage(error)).not.toContain('NOT_ADMIN');
  });

  it('explains an unreachable backend rather than reporting status 0', () => {
    const error = new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') });

    const message = apiErrorMessage(error);
    expect(message).toContain('Could not reach the server');
    expect(message).not.toContain('0');
  });

  it('falls back on a body that is not an ApiError', () => {
    const error = new HttpErrorResponse({ status: 500, error: '<html>Gateway</html>' });

    const message = apiErrorMessage(error);
    expect(message).toBe('Request failed with status 500.');
    expect(message).not.toContain('html');
  });

  it('falls back when the ApiError message is empty', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { code: 'INVALID_ID', message: '' },
    });

    expect(apiErrorMessage(error)).toBe('Request failed with status 400.');
  });

  it('falls back on something that is not an HttpErrorResponse at all', () => {
    expect(apiErrorMessage(new TypeError('boom'))).toBe('Something went wrong.');
    expect(apiErrorMessage(undefined)).toBe('Something went wrong.');
  });
});
