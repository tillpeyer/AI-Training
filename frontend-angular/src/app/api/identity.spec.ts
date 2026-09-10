import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Identity } from './identity';

const STORAGE_KEY = 'lunch.userId';

function make() {
  // Reset first: several tests build an Identity more than once, and TestBed
  // refuses to be reconfigured after it has been instantiated.
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  return TestBed.inject(Identity);
}

describe('Identity', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('normalises a stored value on the way in', () => {
    localStorage.setItem(STORAGE_KEY, '  emp1  ');
    const identity = make();

    // Otherwise a stored whitespace value makes the app look signed in and
    // sends X-User-Id: "   " — the backend has no @NotBlank on that header.
    expect(identity.userId()).toBe('emp1');
    expect(identity.settledUserId()).toBe('emp1');
  });

  it('treats a stored whitespace-only value as signed out', () => {
    localStorage.setItem(STORAGE_KEY, '   ');
    const identity = make();

    expect(identity.userId()).toBe('');
  });

  it('keeps the raw keystroke value but exposes it trimmed', () => {
    const identity = make();
    identity.type('emp1 ');

    // raw is what the uncontrolled input holds; trimming it there would move
    // the caret and desynchronise the DOM from the signal.
    expect(identity.raw()).toBe('emp1 ');
    expect(identity.userId()).toBe('emp1');
  });

  it('does not let a keystroke drive a request until it settles', () => {
    const identity = make();
    TestBed.tick();

    identity.type('e');
    TestBed.tick();
    identity.type('em');
    TestBed.tick();
    identity.type('emp1');
    TestBed.tick();

    // Four keystrokes, still no settled value: this is what stops /orders
    // firing a request per character and blanking the table each time.
    expect(identity.settledUserId()).toBe('');

    vi.advanceTimersByTime(300);
    TestBed.tick();
    expect(identity.settledUserId()).toBe('emp1');
  });

  it('applies a programmatic sign-in immediately', () => {
    const identity = make();
    identity.signInAs('emp1');

    expect(identity.settledUserId()).toBe('emp1');
  });

  it('survives storage that throws on read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied');
    });

    let identity!: Identity;
    expect(() => (identity = make())).not.toThrow();
    expect(identity.userId()).toBe('');
  });

  it('survives storage that throws on write', () => {
    const identity = make();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota');
    });

    identity.signInAs('emp1');
    expect(() => TestBed.tick()).not.toThrow();
    // The session still works, it just does not persist.
    expect(identity.userId()).toBe('emp1');
  });
});
