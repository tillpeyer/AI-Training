# Story 4 — Cancel one of my orders

**Status:** Draft (ready for SM to lock)
**Estimate:** 3 points
**Priority:** Should
**Depends on:** Story 2 (orders must exist), Story 3 (helps QA test the post-state)

## Context

Plans change. Employees need to back out of an order without calling the canteen. This is the **richest** story in the workshop — it exercises **state transitions**, **idempotency**, and **authorization** (you can only cancel your own order). Good fit for someone who's done one easy cycle and wants more bite.

PRD section: *Scope, item 4.*
Tech-spec section: *Data model · OrderStatus*

## Acceptance Criteria

- [ ] `PATCH /api/v1/orders/{id}/cancel` returns **204 No Content** on success
- [ ] Header `X-User-Id` is **required** — missing returns **400** with `code = MISSING_USER`
- [ ] Unknown order id returns **404** with `code = ORDER_NOT_FOUND`
- [ ] Cancelling **someone else's** order returns **403** with `code = NOT_OWNER` (don't leak existence with 404)
- [ ] Order already in `CANCELLED` status returns **409** with `code = ALREADY_CANCELLED` — request is **not** idempotent here, deliberately
- [ ] After success, the order's `status` is `CANCELLED` and a subsequent `GET /orders/me` reflects it

## Technical Notes

- Add `OrderService#cancel(UUID orderId, String userId)` — encapsulate the state machine here, not in the controller
- Custom exceptions: `OrderNotFoundException`, `NotOrderOwnerException`, `AlreadyCancelledException` — map them in `GlobalExceptionHandler`
- Think carefully about the **order of checks**: existence → ownership → state. Wrong order leaks information (e.g. 409 for someone else's order would tell an attacker the id exists)
- No DB-level locking needed for a workshop — single-user H2 — but mention concurrency in a comment if you want to be thorough

## Definition of Done

- [ ] All ACs ticked
- [ ] `@WebMvcTest` covers: success, missing header, unknown id, not-owner, already-cancelled
- [ ] Service-level test asserts the state machine: SUBMITTED → CANCELLED, and CANCELLED → CANCELLED is rejected
- [ ] `mvn test` passes
- [ ] PR opened against `main`
