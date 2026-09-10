import { Injectable, computed, effect, signal } from '@angular/core';

const STORAGE_KEY = 'lunch.userId';

/** How long a keystroke settles before it is allowed to drive a request. */
const SETTLE_MS = 250;

/**
 * The signed-in employee id, mirrored to `localStorage` so it survives a reload.
 *
 * Three signals, because they answer three different questions:
 *
 * - `raw` is what the shell input holds. It is written on every keystroke, per
 *   the experience spine, and is deliberately NOT trimmed there — trimming
 *   mid-typing desynchronises the DOM value from the signal and jumps the caret.
 * - `userId` is `raw` normalised. Everything that identifies the caller uses it.
 * - `settledUserId` lags `userId` by {@link SETTLE_MS}. Reads key on this one, so
 *   typing `emp1` issues one request rather than four — three of them for
 *   prefixes that are not employees.
 *
 * Every storage access is wrapped: private browsing and blocked site data throw
 * on read and on write, and the right behaviour there is a working session that
 * simply does not persist.
 */
@Injectable({ providedIn: 'root' })
export class Identity {
  private readonly initial = readStored();

  readonly raw = signal(this.initial);
  readonly userId = computed(() => this.raw().trim());
  readonly settledUserId = signal(this.initial);

  constructor() {
    effect((onCleanup) => {
      const value = this.userId();
      const handle = setTimeout(() => this.settledUserId.set(value), SETTLE_MS);
      onCleanup(() => clearTimeout(handle));
    });

    effect(() => {
      const value = this.userId();
      try {
        if (value) {
          localStorage.setItem(STORAGE_KEY, value);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        // Storage unavailable — the session stays in memory only.
      }
    });
  }

  /** The shell input's handler. Live for display, debounced for requests. */
  type(value: string): void {
    this.raw.set(value);
  }

  /** Programmatic sign-in. Takes effect immediately, without waiting to settle. */
  signInAs(userId: string): void {
    const value = userId.trim();
    this.raw.set(value);
    this.settledUserId.set(value);
  }

  /** The initial value for the uncontrolled shell input, read once at construction. */
  initialValue(): string {
    return this.initial;
  }
}

/**
 * Normalised on the way in, so a stored whitespace-only value cannot make the
 * app look signed in and send `X-User-Id: "   "` — the backend has no
 * `@NotBlank` on that header and would file the order under a blank user.
 */
function readStored(): string {
  try {
    return (localStorage.getItem(STORAGE_KEY) ?? '').trim();
  } catch {
    return '';
  }
}
