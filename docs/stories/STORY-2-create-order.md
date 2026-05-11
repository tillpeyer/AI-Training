# Story 2 — Submit an order

**Status:** Draft (ready for SM to lock)
**Estimate:** 3 points
**Priority:** Must
**Depends on:** Story 1 (the `MenuItem` entity must exist)

## Context

Once the menu is visible, employees need to actually place an order. This story exercises **validation** and **cross-entity lookups** — the agent will need to read both the order and menu packages.

PRD section: *Scope, item 2.*
Tech-spec section: *Data model · Order, API conventions · Mock auth*

## Acceptance Criteria

- [ ] `POST /api/v1/orders` with body `{ "menuItemId": "<uuid>", "quantity": 2 }` returns **201 Created** + the saved order
- [ ] Header `X-User-Id` is **required** — missing returns **400** with `code = MISSING_USER`
- [ ] `quantity` must be `1..10` — out of range returns **400** with `code = INVALID_QUANTITY`
- [ ] `menuItemId` must reference an **available** menu item — non-existent or unavailable returns **404** with `code = MENU_ITEM_NOT_FOUND`
- [ ] Created order has `status = SUBMITTED` and `createdAt` populated by the server
- [ ] Response body includes the generated order `id`

## Technical Notes

- Create the package `ch.elca.training.lunch.order`
- `Order` entity matches the tech-spec data model
- `OrderStatus` enum: `SUBMITTED`, `CANCELLED` (we'll add more in later stories if needed — out of scope here)
- Use `jakarta.validation` annotations (`@NotNull`, `@Min`, `@Max`) on the request body class
- `GlobalExceptionHandler` should map `MethodArgumentNotValidException` → 400, and a custom `MenuItemNotFoundException` → 404
- Use `@RequestHeader("X-User-Id")` — make the parameter required so missing header fails validation cleanly
- Persist `createdAt` via `@CreationTimestamp` (Hibernate) or set it manually in the service

## Definition of Done

- [ ] All ACs ticked
- [ ] `@WebMvcTest` covers: success, missing header, invalid quantity, unknown menu item
- [ ] Service-level test verifies that an order is persisted with the correct status and timestamps
- [ ] `mvn test` passes
- [ ] PR opened against `main`
