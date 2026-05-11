# Story 5 — Admin adds a menu item

**Status:** Draft (ready for SM to lock)
**Estimate:** 2 points
**Priority:** Should
**Depends on:** Story 1 (the `MenuItem` entity must exist)

## Context

The canteen admin needs to add today's specials before the lunch rush. This is the only story with a **role check** — perfect for showing the QA agent that an "auth-positive happy path" without testing the negative case is **not** a complete test.

PRD section: *Scope, item 5.*
Tech-spec section: *API conventions · admin header*

## Acceptance Criteria

- [ ] `POST /api/v1/menu/items` with body `{ "name": "...", "priceChf": 12.50 }` returns **201 Created** + the saved item
- [ ] Header `X-Admin: true` is **required** — missing or any other value returns **403** with `code = NOT_ADMIN`
- [ ] `name` must be non-blank and ≤ 100 chars — violations return **400** with `code = INVALID_NAME`
- [ ] `priceChf` must be `>= 0` — violation returns **400** with `code = INVALID_PRICE`
- [ ] New items default to `available = true`
- [ ] Returned body includes the generated `id`
- [ ] After success, `GET /api/v1/menu` includes the new item

## Technical Notes

- Read `X-Admin` via `@RequestHeader(required = false)` — easier to return a clean 403 than to let Spring 400 you
- Or implement a small `HandlerInterceptor` / `@RequestMapping` filter — your call, but for one endpoint it's overkill
- `MenuItem.available` defaults to `true` either via field initializer or `@PrePersist`
- Validation annotations: `@NotBlank @Size(max = 100)` for `name`, `@PositiveOrZero` for `priceChf`
- Use `BigDecimal` for `priceChf` to avoid floating-point arithmetic on money

## Definition of Done

- [ ] All ACs ticked
- [ ] `@WebMvcTest` covers: success, missing admin header, blank name, negative price
- [ ] End-to-end check (manual or with a test): a successfully added item appears in `GET /api/v1/menu`
- [ ] `mvn test` passes
- [ ] PR opened against `main`
