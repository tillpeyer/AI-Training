# Story 3 — List my orders

**Status:** Draft (ready for SM to lock)
**Estimate:** 2 points
**Priority:** Should
**Depends on:** Story 2 (orders must be creatable)

## Context

After submitting an order, employees want to confirm it landed and see their history for today. This story is about **filtering by the caller's identity** — the same auth pattern as Story 4, so it's a good warm-up for the cancellation flow.

PRD section: *Scope, item 3.*
Tech-spec section: *API conventions · Mock auth*

## Acceptance Criteria

- [ ] `GET /api/v1/orders/me` returns HTTP 200 with a JSON array of orders belonging to the caller
- [ ] Header `X-User-Id` is **required** — missing returns **400** with `code = MISSING_USER`
- [ ] Only orders matching `userId == X-User-Id` are returned
- [ ] Orders from **other** users are never returned, even with a different valid `X-User-Id`
- [ ] Results are sorted by `createdAt` **descending** (newest first)
- [ ] Empty result returns `[]`, not 404
- [ ] Both `SUBMITTED` and `CANCELLED` orders are included (so users can see history)

## Technical Notes

- Add a derived repository query: `List<Order> findAllByUserIdOrderByCreatedAtDesc(String userId)`
- Reuse the same `@RequestHeader("X-User-Id")` pattern from Story 2
- Reuse `GlobalExceptionHandler` for the missing-header case
- No new entity changes needed

## Definition of Done

- [ ] All ACs ticked
- [ ] `@WebMvcTest` covers: happy path with 2+ orders, missing header, isolation between two different users
- [ ] Repository test verifies the sort order
- [ ] `mvn test` passes
- [ ] PR opened against `main`
