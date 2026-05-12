# Epics — Lunch Order API

> **Workshop-rehearsal note:** synthesised from the 5 pre-written story drafts in `docs/stories/STORY-1..5-*.md` to satisfy the Sprint Planning workflow's `epic*.md` input requirement. In a real project, this file would be produced by BMAD Phase 3 (`create-epics-and-stories`). The 5 stories were originally written flat (no epic grouping); here we bundle them into a single epic so the SM workflow can consume them.

## Epic 1: Lunch Order API v1

**Status:** backlog
**Goal:** Replace the canteen's paper order sheet with a Spring Boot HTTP service that lets employees view today's menu, submit and cancel their own orders, and lets the canteen admin maintain the menu.
**Source:** `docs/prd.md` §Scope; `docs/tech-spec.md`
**Story drafts location:** `docs/stories/STORY-1..5-*.md`

### Story 1.1: List today's menu

**Source draft:** `docs/stories/STORY-1-list-menu.md`
**Persona:** Employee
**Estimate:** 2 points
**Priority:** Must
**Summary:** Expose `GET /api/v1/menu` returning only items with `available = true`. No auth required.

### Story 1.2: Submit an order

**Source draft:** `docs/stories/STORY-2-create-order.md`
**Persona:** Employee
**Estimate:** 3 points
**Priority:** Must
**Depends on:** Story 1.1 (the `MenuItem` entity must exist)
**Summary:** `POST /api/v1/orders` with validation (`X-User-Id` required; quantity 1–10; menu item must exist and be available).

### Story 1.3: List my orders

**Source draft:** `docs/stories/STORY-3-list-my-orders.md`
**Persona:** Employee
**Estimate:** 2 points
**Priority:** Should
**Depends on:** Story 1.2
**Summary:** `GET /api/v1/orders/me` returns caller's orders only, sorted by `createdAt` desc.

### Story 1.4: Cancel one of my orders

**Source draft:** `docs/stories/STORY-4-cancel-order.md`
**Persona:** Employee
**Estimate:** 3 points
**Priority:** Should
**Depends on:** Story 1.2
**Summary:** `PATCH /api/v1/orders/{id}/cancel` — state machine `SUBMITTED → CANCELLED`, ownership check, 409 on already-cancelled.

### Story 1.5: Admin adds a menu item

**Source draft:** `docs/stories/STORY-5-admin-add-menu-item.md`
**Persona:** Canteen admin
**Estimate:** 2 points
**Priority:** Should
**Depends on:** Story 1.1
**Summary:** `POST /api/v1/menu/items` gated by `X-Admin: true` (403 otherwise) with validation on `name` and `priceChf`.
