# Story 7 — Get a menu item by ID (WORKED EXAMPLE)

**Status:** Draft — **worked example, NOT for participant assignment**
**Estimate:** 1 point
**Priority:** Example (not Must / Should)
**Depends on:** STORY-1 (the `MenuItem` entity must exist)

## Context

This is a worked example shipped on `example/STORY-7-get-menu-item-by-id` to demonstrate the
full BMAD Phase-4 cycle (SM lock → Dev implement → Code review). Each phase lives in its own
commit so participants can step through `git log` and see what each agent produces.

**Do not pick this story for your workshop slot — pick one of STORY-1..6.**

The endpoint is minimal and additive: it touches only the `menu/` package (controller + service)
and reuses the `MenuItemNotFoundException` and its `GlobalExceptionHandler` mapping that were
already introduced in STORY-2. No cross-cutting changes are required.

## Acceptance Criteria

- [ ] **AC-1** — `GET /api/v1/menu/{id}` returns **200 OK** with the full `MenuItem` JSON body
      (including `id`, `name`, `priceChf`, `available`). Items are returned regardless of their
      `available` flag — admins may fetch unavailable items by id.
- [ ] **AC-2** — An unknown `id` returns **404 Not Found** with body
      `{"code":"MENU_ITEM_NOT_FOUND","message":"..."}` (message must be non-empty).
- [ ] **AC-3** — No authentication or `X-Admin` header is required.

## Technical Notes

- Reuse `MenuItemNotFoundException(UUID id)` — it already exists and its message is non-empty.
- `GlobalExceptionHandler.handleMenuItemNotFound` already maps that exception to 404
  `MENU_ITEM_NOT_FOUND` — no changes to the handler needed.
- Add one method to `MenuService`: `public MenuItem getById(UUID id)` using
  `menuRepository.findById(id).orElseThrow(...)`.
- Add one method to `MenuController`: `@GetMapping("/{id}")` delegating to `menuService.getById`.
- Import `@PathVariable` — the only new annotation required in the controller.

## Definition of Done

- [ ] All ACs ticked
- [ ] `@WebMvcTest` covers: 200 happy path (any `available` value), 404 unknown id (asserts both
      `$.code` and `$.message`)
- [ ] `mvn test` green (all existing tests still pass, +2 new)
- [ ] PR opened against `main`
