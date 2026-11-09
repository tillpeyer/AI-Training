# Story 2.7: Get a menu item by ID

Status: review

## Story

As a **user or admin**,
I want to **fetch a single menu item by its UUID**,
so that I can **retrieve full item details (including unavailable items) without scanning the entire menu list**.

## Acceptance Criteria

1. **AC-1** — `GET /api/v1/menu/{id}` returns HTTP **200** with the `MenuItem` JSON body (`id`,
   `name`, `priceChf`, `available`) for any item regardless of its `available` flag.
2. **AC-2** — An unknown `id` returns HTTP **404** with body
   `{"code":"MENU_ITEM_NOT_FOUND","message":"..."}`. The `message` field must be non-empty.
3. **AC-3** — No `X-Admin` or `X-User-Id` header is required; the endpoint is public.

## Tasks / Subtasks

- [ ] **Task 1 — Extend `MenuService`** (AC: 1, 2)
  - [ ] 1.1 Add `public MenuItem getById(UUID id)` to `MenuService`:
    ```java
    return menuRepository.findById(id)
        .orElseThrow(() -> new MenuItemNotFoundException(id));
    ```
  - [ ] 1.2 No repository change needed — `CrudRepository.findById(UUID)` is already inherited.

- [ ] **Task 2 — Extend `MenuController`** (AC: 1, 3)
  - [ ] 2.1 Add `@GetMapping("/{id}")` method to `MenuController`:
    ```java
    @GetMapping("/{id}")
    public MenuItem getById(@PathVariable UUID id) {
        return menuService.getById(id);
    }
    ```
  - [ ] 2.2 Import `org.springframework.web.bind.annotation.PathVariable`.

- [ ] **Task 3 — Controller tests** (AC: 1, 2)
  - [ ] 3.1 Add `getById_returnsOkWithMenuItem` to `MenuControllerTest`:
    - Mock `menuService.getById(any())` to return a `MenuItem` with `available = false`
      (proves AC-1: available flag does not gate the endpoint).
    - Assert 200, `$.id`, `$.name`, `$.priceChf`, `$.available` all present.
  - [ ] 3.2 Add `getById_returns404WhenUnknown` to `MenuControllerTest`:
    - Mock `menuService.getById(any())` to throw `new MenuItemNotFoundException(id)`.
    - Assert 404, `$.code == "MENU_ITEM_NOT_FOUND"`, **`$.message` non-empty** (carry-forward
      from STORY-3 CR: error tests must assert both fields).

- [ ] **Task 4 — Smoke check** (AC: all)
  - [ ] 4.1 Run `mvn test` — all existing tests pass, 2 new tests added. Expected total: 39.

## Dev Notes

### What's NEW vs unchanged

**NEW for STORY-7 (minimal):**
1. One service method: `getById(UUID id)` in `MenuService`
2. One controller method: `GET /api/v1/menu/{id}` in `MenuController`
3. Two new test methods in `MenuControllerTest`

**UNCHANGED (do NOT touch):**
- `MenuItem.java`, `MenuRepository.java`, `MenuSeedData.java`
- `MenuItemNotFoundException.java` — reused as-is
- `GlobalExceptionHandler.java` — `handleMenuItemNotFound` already maps the exception to 404;
  **zero handler changes required**
- All `order/` package files and tests

### Key reuse: exception already handled

`MenuItemNotFoundException` was introduced by STORY-2's `OrderService` (it validates that the
menu item referenced by an order actually exists). Its `GlobalExceptionHandler` mapping was also
added in STORY-2. STORY-7 reuses both without modification — the 404 response with
`MENU_ITEM_NOT_FOUND` is free.

### References to earlier stories

- `MenuItem` entity: STORY-1 (`1-1-list-todays-menu.md`)
- `MenuItemNotFoundException` + handler mapping: STORY-2 (`1-2-submit-an-order.md`)
- No new exceptions needed; no new handler entries needed.

### Tech stack (locked)

- Java 21 · Spring Boot 3.5.0 · Maven 3.9+ · H2 in-memory
- No new dependencies.

### API conventions

- Path: `GET /api/v1/menu/{id}` (note: no `/items/` prefix — symmetrical with the entity, not
  the POST which uses `/items`)
- HTTP codes used: **200**, **404**
- Error body: `{"code":"...","message":"..."}` — both fields required per contract.

### Testing standards

- Controller test: `@WebMvcTest(MenuController.class)` + `@Import(GlobalExceptionHandler.class)`
  (already in place in `MenuControllerTest`)
- No repository or service unit test strictly required for this story (the service method is a
  one-liner with no branching logic beyond the orElseThrow); optional if time allows.

### Previous Story Intelligence (carry-forwards)

- Apply `ArgumentCaptor` pattern from STORY-3 if verifying which id was passed to the service.
- Apply `$.message` non-empty assertion pattern from STORY-3 CR: every error-path test must
  assert **both** `$.code` and `$.message`.

### Questions saved for end

_(None — the story is fully constrained by existing infrastructure.)_

## Dev Agent Record

### Agent Model Used

Sonnet 4.6 (worked-example subagent)

### Debug Log References

_(none — all tests passed on first run)_

### Completion Notes List

- Added `getById(UUID id)` to `MenuService` using `findById(...).orElseThrow(...)`; no repository
  change needed since `CrudRepository.findById` is already inherited.
- Added `@GetMapping("/{id}")` to `MenuController` with `@PathVariable UUID id`; delegated to
  `menuService.getById(id)`. Added `PathVariable` and `UUID` imports.
- Added 2 controller tests to `MenuControllerTest`: happy path with `available=false` (proves
  AC-1 — no availability gate), and 404 path asserting both `$.code` and `$.message` (carry-forward
  from STORY-3 CR). Also added 2 optional service unit tests to `MenuServiceTest` covering the
  found and not-found branches.
- `mvnw.cmd test`: **41 tests, 0 failures, 0 errors** (37 existing + 2 controller + 2 service).

### File List

- `src/main/java/ch/elca/training/lunch/menu/MenuService.java` (modified — +`getById` method)
- `src/main/java/ch/elca/training/lunch/menu/MenuController.java` (modified — +`GET /{id}` endpoint)
- `src/test/java/ch/elca/training/lunch/menu/MenuControllerTest.java` (modified — +2 test methods)
- `src/test/java/ch/elca/training/lunch/menu/MenuServiceTest.java` (modified — +2 test methods)
