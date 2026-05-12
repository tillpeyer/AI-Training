# Code Review — STORY-7: Get a menu item by ID (Worked Example)

**Branch:** example/STORY-7-get-menu-item-by-id
**Base branch:** main
**Reviewer:** Sonnet 4.6 (worked-example subagent)
**Date:** 2026-05-12

## TL;DR

Minimal, correct, and self-contained. All three ACs are delivered. The service one-liner reuses
`MenuItemNotFoundException` and its pre-existing handler without touching either. The controller
method is three lines. The controller tests cover the happy path with `available=false` (proving
AC-1's "regardless of availability" clause) and the 404 path with both `$.code` and `$.message`
asserted (carry-forward applied). The bonus service unit tests probe both branches of the
`orElseThrow`. No BLOCKERs. No MAJORs. One MINOR. **Recommend MERGE.**

---

## Findings

### BLOCKER

None.

### MAJOR

None.

### MINOR

1. **`MenuControllerTest.java` — unused import `doThrow` added but never used.**

   The import `import static org.mockito.Mockito.doThrow;` was added alongside `eq` but the test
   uses `when(...).thenThrow(...)` (the `when`/`thenThrow` form) — not `doThrow`. The unused
   import is harmless (javac will compile it without complaint) but is dead code. It should be
   removed before merge; a competent IDE will flag it with a grey underline.

### PRAISE

1. **`MenuControllerTest.getById_returnsOkWithMenuItem` uses `available=false` as the fixture.**
   This is the precise probe for AC-1: if the implementation had accidentally delegated to
   `listAvailable()` (which filters by `available=true`) instead of `getById`, the test would fail
   because the mock would not be invoked. The intent comment "proves AC-1" makes the design
   decision self-documenting — excellent workshop material.

2. **`MenuService.getById` reuses the existing `MenuItemNotFoundException` without modification.**
   The exception's message already includes the `UUID` (`"Menu item not found or unavailable: " +
   menuItemId`), satisfying AC-2's "message must be non-empty" requirement without a single new
   line in the handler. This is the key reuse point the story was designed to demonstrate.

3. **Error-path controller test asserts both `$.code` and `$.message`** (line
   `getById_returns404WhenUnknown`). The carry-forward from the STORY-3 code review is applied
   correctly and consistently.

4. **Service unit tests cover both `Optional.of(...)` and `Optional.empty()` branches**, and the
   not-found test uses `hasMessageContaining(id.toString())` to verify the exception message
   actually embeds the offending UUID. This is a stronger assertion than `isInstanceOf(...)` alone.

5. **Zero cross-cutting changes.** `GlobalExceptionHandler`, `MenuItemNotFoundException`,
   `MenuRepository`, `MenuItem`, and all `order/` package files are untouched. The story scope
   constraint is met exactly.

---

## Facet scores

| Facet | Score (1-5) | Notes |
|---|---|---|
| AC compliance | 5 | AC-1 (200 regardless of availability), AC-2 (404 + MENU_ITEM_NOT_FOUND + non-empty message), AC-3 (no auth) — all three delivered and tested. |
| Architecture compliance | 5 | Only `menu/` package files modified. No new dependencies. No new exceptions. No handler changes. Feature-based packaging preserved. |
| Test quality | 4 | Both controller tests use `eq()` matcher and verify the service call. Both error-path assertions check `$.code` + `$.message`. One unused import is minor sloppiness (MINOR-1). |
| Error handling correctness | 5 | 404 is produced by the pre-existing `GlobalExceptionHandler.handleMenuItemNotFound` mapping — no shadow risk, no new handler entry. |
| Code hygiene | 4 | Production code is clean. The unused `doThrow` import in the test file is the only blemish. |

---

## Recommendation

MERGE

No blocking or major issues. Remove the unused `doThrow` import (MINOR-1) before or as part of
merge. The implementation is the simplest possible expression of the story's requirements and
serves its purpose as a worked example of the full BMAD Phase-4 cycle.
