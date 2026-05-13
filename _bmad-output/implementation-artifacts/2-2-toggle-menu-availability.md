# Story 2.2: Admin toggles a menu item's availability

Status: review

## Story

As a **canteen admin**,
I want to **flip a menu item's `available` flag on or off via a single endpoint**,
so that I can **mark a dish unavailable mid-day (e.g. when the kitchen runs out) without
needing to delete it or hand-edit the database**.

## Acceptance Criteria

1. **AC-1** — `PATCH /api/v1/menu/{id}/availability` with header `X-Admin: true` and JSON body
   `{"available": false}` (or `true`) returns HTTP **200** with the full updated `MenuItem`
   JSON body (`id`, `name`, `priceChf`, `available`) where `available` reflects the value from
   the request body. The change is persisted via `MenuRepository.save`.
2. **AC-2** — Without `X-Admin: true` (header missing, set to `false`, or any other value),
   the endpoint returns HTTP **403** with body `{"code":"NOT_ADMIN","message":"..."}` —
   `message` must be non-empty. The repository is **not** invoked.
3. **AC-3** — With a valid admin header but an unknown `id`, the endpoint returns HTTP **404**
   with body `{"code":"MENU_ITEM_NOT_FOUND","message":"..."}` — `message` must be non-empty.

## Tasks / Subtasks

- [x] **Task 1 — Add request DTO** (AC: 1)
  - [x] 1.1 Create `UpdateAvailabilityRequest` record in `menu/`:
    ```java
    public record UpdateAvailabilityRequest(@NotNull Boolean available) {}
    ```
  - [x] 1.2 Mirrors the `CreateMenuItemRequest` pattern from Story 1-5 — same package, same
        single-record-per-file convention.

- [x] **Task 2 — Extend `MenuService`** (AC: 1, 3)
  - [x] 2.1 Add `public MenuItem setAvailability(UUID id, boolean available)` to `MenuService`:
    ```java
    MenuItem item = menuRepository.findById(id)
        .orElseThrow(() -> new MenuItemNotFoundException(id));
    item.setAvailable(available);
    return menuRepository.save(item);
    ```
  - [x] 2.2 No repository change needed — `findById` and `save` are inherited from
        `CrudRepository`.

- [x] **Task 3 — Extend `MenuController`** (AC: 1, 2, 3)
  - [x] 3.1 Add `@PatchMapping("/{id}/availability")` method to `MenuController`:
    ```java
    @PatchMapping("/{id}/availability")
    public MenuItem setAvailability(
            @RequestHeader(value = "X-Admin", required = false) String adminHeader,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAvailabilityRequest req) {
        if (!"true".equals(adminHeader)) {
            throw new NotAdminException();
        }
        return menuService.setAvailability(id, req.available());
    }
    ```
  - [x] 3.2 Import `PatchMapping`. `PathVariable`, `RequestHeader`, `RequestBody`, `Valid`,
        `NotAdminException`, and `UUID` are already imported in `MenuController`.
  - [x] 3.3 **Admin-first check pattern (carry-forward from Story 1-5):** identical to the
        existing `POST /api/v1/menu/items` handler. Same known caveat applies — `@Valid` fires
        before the method body, so a malformed body with a missing/wrong admin header surfaces
        as 400 rather than 403. **Do not** try to "fix" this; it is accepted scope per Story 1-5.

- [x] **Task 4 — Controller tests** (AC: 1, 2, 3)
  - [x] 4.1 Add `setAvailability_returnsOkAndUpdatesItem` to `MenuControllerTest`:
    - Mock `menuService.setAvailability(any(), eq(false))` to return a `MenuItem` with
      `available = false`.
    - PATCH with header `X-Admin: true` and body `{"available": false}`.
    - Assert 200, `$.available == false`, and `$.id`, `$.name`, `$.priceChf` all present.
    - Verify `menuService.setAvailability` was invoked with the correct id and `false`
      (use `ArgumentCaptor` — pattern carry-forward from Story 1-3).
  - [x] 4.2 Add `setAvailability_returns403WithoutAdmin` to `MenuControllerTest`:
    - PATCH without the `X-Admin` header (or with `X-Admin: false`).
    - Assert 403, `$.code == "NOT_ADMIN"`, **`$.message` non-empty** (carry-forward from
      Story 1-3 CR: every error-path test must assert both fields).
    - Verify `menuService.setAvailability` was **never** invoked (`verifyNoInteractions`).
  - [x] 4.3 Add `setAvailability_returns404WhenUnknown` to `MenuControllerTest`:
    - Mock `menuService.setAvailability(any(), anyBoolean())` to throw
      `new MenuItemNotFoundException(id)`.
    - PATCH with `X-Admin: true` and a valid body.
    - Assert 404, `$.code == "MENU_ITEM_NOT_FOUND"`, `$.message` non-empty.

- [x] **Task 5 — Smoke check** (AC: all)
  - [x] 5.1 Run `mvn test` — all existing tests pass, 3 new tests added.
        **Result: 44 tests, 0 failures, 0 errors (was 41).**

## Dev Notes

### What's NEW vs unchanged

**NEW for this story (minimal):**
1. One request DTO: `UpdateAvailabilityRequest` record in `menu/`
2. One service method: `setAvailability(UUID id, boolean available)` in `MenuService`
3. One controller method: `PATCH /api/v1/menu/{id}/availability` in `MenuController`
4. Three new test methods in `MenuControllerTest`

**UNCHANGED (do NOT touch):**
- `MenuItem.java` — already has the `setAvailable(boolean)` setter (JPA entity)
- `MenuRepository.java`, `MenuSeedData.java`
- `MenuItemNotFoundException.java`, `NotAdminException.java` — both reused as-is
- `GlobalExceptionHandler.java` — `handleMenuItemNotFound` and `handleNotAdmin` already map
  both exceptions; **zero handler changes required**
- All `order/` package files and tests

### Key reuse: every error path is already wired

- `NotAdminException` + 403 `NOT_ADMIN` mapping → introduced in Story 1-5.
- `MenuItemNotFoundException` + 404 `MENU_ITEM_NOT_FOUND` mapping → introduced in Story 1-2.
- `@Valid` + 400 `INVALID_INPUT` mapping → introduced in Story 1-2 / Story 1-5.

Both exception classes and all three mappings exist in the codebase already. This story is
**purely additive** at the controller + service + DTO layer.

### References to earlier stories

- `MenuItem` entity + `MenuController` skeleton: Story 1-1 (`1-1-list-todays-menu.md`)
- `MenuItemNotFoundException` + handler mapping: Story 1-2 (`1-2-submit-an-order.md`)
- `NotAdminException`, admin-gating pattern, `CreateMenuItemRequest` DTO pattern:
  Story 1-5 (`1-5-admin-adds-a-menu-item.md`)

### Tech stack (locked)

- Java 21 · Spring Boot 3.5.0 · Maven 3.9+ · H2 in-memory
- No new dependencies. [Source: docs/tech-spec.md#Architecture]

### API conventions

- Path: `PATCH /api/v1/menu/{id}/availability` — sub-resource of a menu item, mutating only
  the `available` flag. Chose PATCH over PUT because we are partially updating a single field.
- HTTP codes used: **200**, **403**, **404** (and **400** implicitly for an invalid body via
  the existing `handleValidationErrors` mapping — not asserted in ACs).
- Request body shape: `{"available": true|false}` — single required boolean.
- Error body: `{"code":"...","message":"..."}` — both fields required per contract.
  [Source: docs/tech-spec.md#API-conventions]

### Testing standards

- Controller test: `@WebMvcTest(MenuController.class)` + `@Import(GlobalExceptionHandler.class)`
  (already in place in `MenuControllerTest`)
- Service unit test not strictly required (logic is `findById → mutate → save`, all branches
  already covered indirectly by Story 1-1 and Story 1-2 service tests). Optional if time
  allows. [Source: docs/tech-spec.md#Testing-approach]

### Previous Story Intelligence (carry-forwards)

- **Admin-first check** (Story 1-5): `if (!"true".equals(adminHeader)) throw new NotAdminException();`
  — keep it identical, including the accepted 400-vs-403 ordering caveat documented in the
  existing `POST /api/v1/menu/items` handler.
- **`ArgumentCaptor` pattern** (Story 1-3): verify which id + boolean were passed to the
  service in the happy-path test.
- **`$.message` non-empty assertion** (Story 1-3 CR): every error-path test must assert
  **both** `$.code` and `$.message`.
- **`verifyNoInteractions`** on the service in the 403 test — proves the admin gate short-
  circuits before any business logic.

### Project Structure Notes

- All new files live in `ch.elca.training.lunch.menu` (feature package). No layered
  `dto/entity/service/repo` split. [Source: docs/tech-spec.md#Package-layout]
- The new `UpdateAvailabilityRequest` is a request DTO (one of the few permitted DTOs in v1,
  precedent set by `CreateMenuItemRequest`). The response is still the plain `MenuItem`
  entity — no response DTO. [Source: docs/tech-spec.md#Decisions-worth-noting]

### References

- [Source: docs/prd.md#Scope] — `/api/v1` API surface, HTTP status code conventions
- [Source: docs/tech-spec.md#API-conventions] — error body shape, header policy
- [Source: docs/tech-spec.md#Data-model] — `MenuItem.available` field
- [Source: docs/stories/STORY-8-EXAMPLE-toggle-menu-availability.md] — original draft
- [Source: docs/stories/STORY-5-admin-add-menu-item.md] — admin-gating precedent

### Questions saved for end

_(None — the story is fully constrained by existing infrastructure.)_

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) — Amelia (Dev agent persona)

### Debug Log References

_(none — all tests passed on first run)_

### Completion Notes List

- Added `UpdateAvailabilityRequest` record in `menu/` with `@NotNull Boolean available`,
  mirroring `CreateMenuItemRequest`.
- Added `MenuService.setAvailability(UUID id, boolean available)` using
  `findById(...).orElseThrow(...)` then `setAvailable` + `save`. No repository change needed
  (`findById` / `save` inherited from `CrudRepository`).
- Added `MenuController.setAvailability(...)` with `@PatchMapping("/{id}/availability")`,
  `@PathVariable UUID id`, `@RequestHeader X-Admin`, and `@Valid @RequestBody
  UpdateAvailabilityRequest`. Admin-first check pattern identical to `POST /items` (Story 1-5).
  Imported `PatchMapping`; all other annotations were already imported.
- Added 3 controller tests in `MenuControllerTest`:
  - `setAvailability_returnsOkAndUpdatesItem` (AC-1) — happy path, asserts response body
    reflects `available=false`, captures id + boolean passed to service via `ArgumentCaptor`
    (pattern from Story 1-3).
  - `setAvailability_returns403WhenAdminHeaderMissing` (AC-2) — asserts 403 with
    `$.code == "NOT_ADMIN"` and `$.message` non-empty; `verifyNoInteractions(menuService)`
    confirms the admin gate short-circuits.
  - `setAvailability_returns404WhenUnknown` (AC-3) — mocks service to throw
    `MenuItemNotFoundException`, asserts 404 with both `$.code` and `$.message`.
- Added imports in `MenuControllerTest`: `anyBoolean`, `verifyNoInteractions`, `patch`
  (MockMvc builder).
- `mvnw.cmd test`: **44 tests, 0 failures, 0 errors** (41 prior + 3 new). All ACs satisfied;
  no regressions.

### File List

- `src/main/java/ch/elca/training/lunch/menu/UpdateAvailabilityRequest.java` (new — DTO record)
- `src/main/java/ch/elca/training/lunch/menu/MenuService.java` (modified — added `setAvailability`)
- `src/main/java/ch/elca/training/lunch/menu/MenuController.java` (modified — added
  `PATCH /{id}/availability` endpoint, imported `PatchMapping`)
- `src/test/java/ch/elca/training/lunch/menu/MenuControllerTest.java` (modified — added 3
  controller tests, imported `anyBoolean`, `verifyNoInteractions`, `patch`)
