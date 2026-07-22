# Story 1.8 — Delete a menu item (admin)

| Field | Value |
|---|---|
| **Epic** | 1 (Backend v1 — menu & orders) |
| **Story ID** | 1.8 |
| **Status** | ready-for-dev |
| **Estimate** | 2 CP *(1 CP = 1 developer-day incl. unit tests)* |
| **Priority** | Should |
| **Security** | ELCA (workshop repo — no Jira integration; see Deviations below) |
| **Depends on** | Story 1.1 (`MenuItem` entity), Story 1.2 (`Order` entity), Story 1.5 (admin auth pattern) |
| **Base branch** | `main` |

## Problem Statement

Canteen admins can currently *add* menu items (Story 1.5) and toggle their availability (Story 1.2.2). They cannot outright *remove* an obsolete item — e.g. a discontinued dish that should not clutter the admin view. Since `Order.menuItemId` is a foreign key into `MenuItem`, an unconditional delete would either violate referential integrity or destroy order history. This story adds a controlled delete that preserves history: if any orders reference the item, the delete is rejected and the admin is directed to the existing availability toggle instead.

## Ubiquitous Language

| Term | Definition |
|---|---|
| **MenuItem** | Entity in `ch.elca.training.lunch.menu` representing a canteen dish. Has `id`, `name`, `priceChf`, `available`. |
| **Order** | Entity in `ch.elca.training.lunch.order` referencing a `MenuItem` by `menuItemId` (FK). |
| **Admin request** | Any HTTP request carrying header `X-Admin: true`; requests without this header (or with any other value) are rejected 403. |
| **Referencing order** | An `Order` row whose `menuItemId` equals the target `MenuItem.id`, regardless of `OrderStatus`. |

## Acceptance Criteria

- [ ] **AC 8.1.1** — Given an existing `MenuItem` with **no** referencing orders, when the admin issues `DELETE /api/v1/menu/items/{id}` with header `X-Admin: true`, then the response is **204 No Content** with an empty body and a subsequent `GET /api/v1/menu/{id}` returns **404**.
- [ ] **AC 8.1.2** — Given a `MenuItem.id` that does **not** exist, when the admin issues `DELETE /api/v1/menu/items/{id}` with header `X-Admin: true`, then the response is **404 Not Found** with body `{"code":"MENU_ITEM_NOT_FOUND","message":"<non-empty>"}`. Reuse the existing `MenuItemNotFoundException` and its `GlobalExceptionHandler` mapping (Story 1.7 introduced them).
- [ ] **AC 8.1.3** — Given an existing `MenuItem` with **one or more referencing orders** in **any** status (including `CANCELLED`), when the admin issues the delete, then the response is **409 Conflict** with body `{"code":"MENU_ITEM_HAS_ORDERS","message":"<non-empty>"}` and the item is **not** deleted (subsequent `GET /api/v1/menu/{id}` still returns 200).
- [ ] **AC 8.1.4** — Given a request to the delete endpoint with the `X-Admin` header **absent**, or present with any value other than `true`, then the response is **403 Forbidden** with the same error code/message shape used by `POST /api/v1/menu/items` in Story 1.5.

## Design Constraints

- **Referential-integrity policy:** hard delete only when zero orders reference the item. No cascade, no soft-delete-as-part-of-this-story (the availability toggle from Story 1.2.2 already provides the soft-hide behaviour).
- **Auth pattern:** mirror the inline `X-Admin` header check used by `MenuController.addItem`. Do **not** extract to a filter / interceptor / `@PreAuthorize` — out of scope.
- **No DTOs:** consistent with the v1 tech-spec decision (entity = API).

## Artefacts to Reuse

| File | Reason |
|---|---|
| `src/main/java/ch/elca/training/lunch/menu/MenuController.java` | Pattern for `X-Admin` header check on `addItem` |
| `src/main/java/ch/elca/training/lunch/menu/MenuItemNotFoundException.java` | Reuse for AC 8.1.2 |
| `src/main/java/ch/elca/training/lunch/common/GlobalExceptionHandler.java` | Existing mapping for `MenuItemNotFoundException`; add a new `@ExceptionHandler` for the 409 case |
| `src/main/java/ch/elca/training/lunch/common/ApiError.java` | Error response DTO |
| `src/main/java/ch/elca/training/lunch/order/OrderRepository.java` | Add derived query `existsByMenuItemId(UUID)` |

## Artefacts to Create

| File | Purpose |
|---|---|
| `src/main/java/ch/elca/training/lunch/menu/MenuItemHasOrdersException.java` | Thrown by `MenuService.deleteById` when referencing orders exist |
| `src/test/java/ch/elca/training/lunch/menu/MenuControllerDeleteTest.java` *(or add cases to existing test class)* | `@WebMvcTest` covering all four AC branches |

## Test Scaffolding

| Layer | Test | Cases |
|---|---|---|
| Controller | `@WebMvcTest` on `MenuController` | 204 happy path; 404 unknown id; 409 with referencing order; 403 without `X-Admin: true` |
| Service | Unit test with mocked repositories | Same four branches |
| Repository | `@DataJpaTest` on `OrderRepository` | `existsByMenuItemId(UUID)` returns true when an order exists (any status), false when none |

## Definition of Done

- [ ] All ACs (8.1.1 – 8.1.4) ticked
- [ ] `@WebMvcTest` and service test cover all four branches; `@DataJpaTest` covers the new derived query
- [ ] `.\mvnw test` green (all existing tests still pass)
- [ ] `.\mvnw spring-boot:run` boots and `curl -X DELETE -H "X-Admin: true" http://localhost:8080/api/v1/menu/items/{seeded-id}` returns 204 for a seeded item with no orders
- [ ] PR opened against `main`
- [ ] `story-1-8-admin-delete-menu-item.context.xml` companion file exists and is referenced from this story
- [ ] SonarQube-adjacent checks: no S1192 (duplicate string literals in error messages), no S2699 (assertion-free tests), catch specific exceptions only

## Deviations from ELCAi (accepted for the workshop repo)

- **No Jira ticket / no `Analyzed` transition** — the workshop repo does not use Jira. Sprint state lives implicitly in this file's `Status` field.
- **No `sprint-status.yaml`** — orphan artefact without a Jira board; not bootstrapped for this story.
- **No `tech-spec-epic-1.md`** — the repo has a single flat `docs/tech-spec.md` covering everything. Sections cited above (§Package layout · menu/, §API conventions) map to that document.
- **`main` as base branch** — workshop uses trunk-based flow (feature branch → PR → main), not the `develop` branch ELCAi CI/CD guides assume.
