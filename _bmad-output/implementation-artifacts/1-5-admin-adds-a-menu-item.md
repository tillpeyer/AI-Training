# Story 1.5: Admin adds a menu item

Status: review

## Story

As the **canteen admin**,
I want to **add a new menu item to today's menu via an HTTP endpoint**,
so that I can **introduce a daily special before the lunch rush without involving IT**.

## Acceptance Criteria

1. **AC-1** — `POST /api/v1/menu/items` with body `{"name":"...","priceChf":12.50}` returns HTTP **201 Created** and the saved item in the response body.
2. **AC-2** — Header `X-Admin: true` is **required**. Missing header OR any other value returns HTTP **403** with body `{"code":"NOT_ADMIN","message":"..."}`.
3. **AC-3** — `name` must be non-blank AND `≤ 100` chars. Violations return HTTP **400** with body `{"code":"INVALID_NAME","message":"..."}`.
4. **AC-4** — `priceChf` must be `>= 0` (and non-null). Violations return HTTP **400** with body `{"code":"INVALID_PRICE","message":"..."}`.
5. **AC-5** — New items default `available = true`.
6. **AC-6** — The response body includes the generated `id` (UUID).
7. **AC-7** — After a successful POST, `GET /api/v1/menu` includes the new item (regression check on STORY-1).

## Tasks / Subtasks

- [ ] **Task 1 — Custom exception + `CreateMenuItemRequest` DTO** (AC: 2, 3, 4)
  - [ ] 1.1 Add `ch.elca.training.lunch.menu.NotAdminException` (lives in `menu/` because admin is a menu-side concern). `extends RuntimeException`; no-arg constructor with message `"X-Admin: true header required"`.
  - [ ] 1.2 Add `ch.elca.training.lunch.menu.CreateMenuItemRequest` — record `CreateMenuItemRequest(String name, BigDecimal priceChf)`.
    - `@NotBlank @Size(max = 100) String name`
    - `@NotNull @PositiveOrZero BigDecimal priceChf`
  - [ ] 1.3 ⚠️ This is the **second DTO** in v1 (first was `CreateOrderRequest`). Same justification as STORY-2: the entity has server-set fields (`id`, `available` default) that we don't want clients to spoof. Document this in completion notes.

- [ ] **Task 2 — Refactor `GlobalExceptionHandler` validation mapping** (AC: 2, 3, 4) ⚠️ refactor required
  - [ ] 2.1 ⚠️ The current `MethodArgumentNotValidException` handler hard-codes `code = "INVALID_QUANTITY"` (assumed only quantity validation existed). STORY-5 introduces validation on `name` and `priceChf`, so the handler must now distinguish per-field:
    - Inspect `BindingResult.getFieldError()`. Map by field name:
      - `quantity` → `"INVALID_QUANTITY"` (preserves STORY-2 behavior)
      - `name` → `"INVALID_NAME"`
      - `priceChf` → `"INVALID_PRICE"`
      - **unknown / null** → `"INVALID_INPUT"` (generic fallback — keep this as TODO comment for a future field-agnostic refactor)
  - [ ] 2.2 Add `@ExceptionHandler(NotAdminException.class)` → returns `ResponseEntity.status(403).body(new ApiError("NOT_ADMIN", ex.getMessage()))`
  - [ ] 2.3 ⚠️ **Do NOT fix the `MISSING_HEADER` fallback** (CR MAJOR-1 debt from STORY-2). Still out of scope.
  - [ ] 2.4 Run existing STORY-2 tests after the refactor — `submit_returns400WhenQuantityZero` and `submit_returns400WhenQuantityEleven` MUST still pass with `code = "INVALID_QUANTITY"`. The refactor is **additive** for new fields, not breaking for existing ones.

- [ ] **Task 3 — Extend `MenuService` with `addItem(CreateMenuItemRequest req)`** (AC: 1, 5, 6)
  - [ ] 3.1 Add public method `MenuItem addItem(CreateMenuItemRequest req)`:
    - Build a new `MenuItem` with `name = req.name()`, `priceChf = req.priceChf()`, `available = true` (default already set in field initializer; reaffirm explicitly via setter for clarity)
    - `return menuRepository.save(item);` — returns the saved entity (with generated `id`)
  - [ ] 3.2 Add 1 service test to existing `MenuServiceTest` (or create the file if it doesn't exist yet — STORY-1 had no service test):
    - Mock `menuRepository.save(any())` to return its argument with an injected UUID. Call `addItem(new CreateMenuItemRequest("Risotto", new BigDecimal("14.50")))`. Use `ArgumentCaptor<MenuItem>` to assert the saved entity has: name="Risotto", priceChf=14.50, available=true.

- [ ] **Task 4 — Extend `MenuController` with admin POST endpoint** (AC: 1, 2)
  - [ ] 4.1 Add `@PostMapping("/items")` method to existing `MenuController`:
    - Signature: `public ResponseEntity<MenuItem> add(@RequestHeader(value = "X-Admin", required = false) String adminHeader, @Valid @RequestBody CreateMenuItemRequest req)`
    - Body, **in order**:
      1. **Admin check FIRST**: `if (!"true".equals(adminHeader)) throw new NotAdminException();` — fail closed on null, on "false", on "TRUE", on anything other than the literal string `"true"`. Reject before any other processing.
      2. `MenuItem saved = menuService.addItem(req);`
      3. `return ResponseEntity.status(HttpStatus.CREATED).body(saved);`
  - [ ] 4.2 ⚠️ Order of checks matters: admin first, validation second. `@Valid` triggers validation BEFORE the method body runs, so missing/wrong admin header with an invalid body would return 400 `INVALID_NAME` instead of 403 `NOT_ADMIN`. To enforce admin-first semantics, **use `@Validated` at the class level and put `@Valid` only on the parameter** — Spring still runs validation pre-method. Cleaner solution: do the admin check in a `HandlerInterceptor` or `@ControllerAdvice` for `@Before`. **For this story, accept Spring's default ordering** (validation may fire before the body check), and ADD a controller test (`add_returns403WhenAdminHeaderMissingEvenWithInvalidBody`) that confirms the observed behavior. Document this in completion notes as a known limitation.

- [ ] **Task 5 — Controller tests** (AC: 1, 2, 3, 4, 6)
  - [ ] 5.1 Add 6 new test methods to existing `MenuControllerTest` using `@WebMvcTest(MenuController.class)` + `@Import(GlobalExceptionHandler.class)`:
    - **add_returnsCreatedWithItem** — `X-Admin: true` + valid body. Mock service returns saved `MenuItem` with generated UUID. Assert 201, JSON body has `id`, `name="Risotto"`, `priceChf=14.50`, `available=true`. Verify service called with captured `CreateMenuItemRequest`.
    - **add_returns403WhenAdminHeaderMissing** — no `X-Admin` header. Assert 403, BOTH `$.code == "NOT_ADMIN"` AND `$.message` non-empty.
    - **add_returns403WhenAdminHeaderIsNotTrue** — `X-Admin: false`. Assert 403, BOTH fields.
    - **add_returns400WhenNameIsBlank** — `X-Admin: true`, body `{"name":"","priceChf":10.00}`. Assert 400, `$.code == "INVALID_NAME"`, `$.message` non-empty.
    - **add_returns400WhenNameExceeds100Chars** — name = 101 'a's. Assert 400, `$.code == "INVALID_NAME"`.
    - **add_returns400WhenPriceIsNegative** — `{"name":"Risotto","priceChf":-1.00}`. Assert 400, `$.code == "INVALID_PRICE"`, `$.message` non-empty.
  - [ ] 5.2 ⚠️ **Order interaction test** — verify Spring's default: invalid body + wrong admin header. The test should document the observed return code (likely 400 due to `@Valid` firing first), NOT prescribe a specific one. Comment: `// Spring fires @Valid before method body; if admin-first is required, see Task 4.2 limitation`.

- [ ] **Task 6 — Smoke / regression** (AC: 7 and full regression)
  - [ ] 6.1 `mvn test` green. Expected total: ~36 tests (29 from STORY-1..4 + 7 new from STORY-5 = 36).
  - [ ] 6.2 ⚠️ **Run the STORY-2 quantity-validation tests explicitly** to confirm the GlobalExceptionHandler refactor didn't break `INVALID_QUANTITY`. They should still pass.
  - [ ] 6.3 Boot smoke (manual, document in completion notes — do NOT execute):
    - `curl -X POST -H "X-Admin: true" -H "Content-Type: application/json" -d '{"name":"Spaghetti","priceChf":13.50}' http://localhost:8080/api/v1/menu/items` → 201 + body with id
    - `curl http://localhost:8080/api/v1/menu` → new item is in the response (AC-7)
    - Same POST without `-H "X-Admin: true"` → 403 `NOT_ADMIN`
    - With `-H "X-Admin: yes"` → 403 `NOT_ADMIN` (wrong value)
    - With `{"name":"","priceChf":10}` and admin header → 400 `INVALID_NAME`
    - With `{"name":"X","priceChf":-1}` and admin header → 400 `INVALID_PRICE`

- [ ] **Task 7 — Branch, commit, PR** (Definition of Done)
  - [ ] 7.1 ⚠️ **Branch from `feature/STORY-4-cancel-order`** (continuing the linear stack — Till's choice of strategy A: merge PRs in order #1→#5). Steps:
    - `git fetch origin`
    - `git checkout feature/STORY-4-cancel-order`
    - `git pull origin feature/STORY-4-cancel-order`
    - `git branch -D feature/STORY-5-admin-add-menu-item 2>/dev/null`
    - `git push origin --delete feature/STORY-5-admin-add-menu-item` (delete stale placeholder)
    - `git checkout -b feature/STORY-5-admin-add-menu-item`
  - [ ] 7.2 Commits formatted `STORY-5: <description>`. One commit fine.
  - [ ] 7.3 `git push -u origin feature/STORY-5-admin-add-menu-item`
  - [ ] 7.4 `gh` is known 401. Skip the `gh pr create` attempt and go straight to opening the browser compare URL: `Start-Process "https://github.com/tillpeyer/AI-Training/compare/main...feature/STORY-5-admin-add-menu-item?expand=1"`. Report that human action is needed.

## Dev Notes

### Branching context

- **All 4 prior PRs (#1, #2, #3, #4) still open**, none merged. STORY-5 stacks on STORY-4. PR target = `main`.
- Stale remote placeholder `origin/feature/STORY-5-admin-add-menu-item` at `079c474` — delete before pushing.

### Workshop conventions

- Branch: `feature/STORY-5-admin-add-menu-item`
- Commit: `STORY-5: <description>`
- PR target: `main`. Participant merges in order #1 → #5.
- **Stay inside ACs.** No "while I'm here" refactors except the validation handler refactor (which is REQUIRED to satisfy AC-3 and AC-4 with distinct codes — Task 2.1).

### What's NEW vs unchanged

**NEW for STORY-5:**
1. `NotAdminException.java` in `menu/`
2. `CreateMenuItemRequest.java` in `menu/` (the second and only other DTO in v1)
3. `MenuService.addItem(...)` method
4. `MenuController` `@PostMapping("/items")` endpoint
5. `GlobalExceptionHandler` validation field-name lookup (refactor, see Task 2.1) + `NotAdminException` handler
6. `MenuServiceTest.java` may be new (depends on whether STORY-1 created it — check first; if absent, create)
7. 6 new methods in `MenuControllerTest`

**UNCHANGED (do NOT touch):**
- `MenuItem.java`, `MenuRepository.java`, `MenuSeedData.java`
- All `order/*` files (STORY-2, 3, 4 work)
- `ApiError.java`
- ⚠️ `GlobalExceptionHandler`: only the validation-mapping branch AND adding the `NotAdminException` handler. **Do NOT** touch the `MISSING_HEADER` fallback (CR MAJOR-1 debt) or any `OrderNotFoundException`/`NotOrderOwnerException`/`AlreadyCancelledException` handlers (STORY-4 work).

### Tech stack — unchanged

Java 21 · Spring Boot 3.5.0 · H2. No new deps.

### API conventions

- Path: `POST /api/v1/menu/items`
- HTTP codes used: **201, 400, 403**
- Error body: `{"code":"...","message":"..."}` — both required, tests assert both.

### Architecture pattern

Feature-based packaging. No new packages. All changes inside `menu/` and the targeted refactor in `common/GlobalExceptionHandler.java`.

```
ch.elca.training.lunch.menu/
├── MenuItem.java                           (unchanged)
├── MenuRepository.java                     (unchanged)
├── MenuService.java                        (+1 method: addItem)
├── MenuController.java                     (+1 endpoint: POST /items)
├── MenuSeedData.java                       (unchanged)
├── MenuItemNotFoundException.java          (unchanged from STORY-2)
├── NotAdminException.java                  NEW
└── CreateMenuItemRequest.java              NEW

ch.elca.training.lunch.common/
├── ApiError.java                           (unchanged)
└── GlobalExceptionHandler.java             (refactor MethodArgumentNotValidException + add NotAdminException handler)

src/test/.../menu/
├── MenuRepositoryTest.java                 (unchanged from STORY-1)
├── MenuControllerTest.java                 (+6 test methods)
└── MenuServiceTest.java                    NEW or extended (+1 test method for addItem)
```

### Library / Framework Requirements

No new libraries. `BindingResult.getFieldError().getField()` for the validation field-name lookup — already on classpath.

### Previous Story Intelligence

**Carry forward:**
- `ArgumentCaptor` pattern (Task 3.2's `addItem` test, Task 5.1's controller success test)
- `@Import(GlobalExceptionHandler.class)` in `@WebMvcTest`
- Error tests assert both `$.code` AND `$.message`
- `ResponseEntity.status(HttpStatus.CREATED).body(...)` pattern from STORY-2 controller

**STORY-4 CR PRAISE points to replicate:** the existence/ownership/state ordering pattern is exactly mirrored here as admin/validation/work ordering (admin check first; see Task 4.2).

**Apply:**
- ⚠️ `mvn` may not be on PATH — use `C:\Program Files\JetBrains\IntelliJ IDEA 2025.2.5\plugins\maven\lib\maven3\bin\mvn.cmd`
- ⚠️ `gh` IS 401. Skip the `gh pr create` attempt; go straight to browser fallback.

### Git Intelligence Summary

Recent commits (after STORY-4 cycle):
- (latest) STORY-4 commit on `feature/STORY-4-cancel-order`
- `cd5b196` STORY-3: implement list my orders
- `9b858e5` STORY-2: implement submit an order
- `e5555e3` STORY-1: implement list today's menu

STORY-5 branch parent = `feature/STORY-4-cancel-order` HEAD.

### Latest Tech Information

- `@RequestHeader(value = "X-Admin", required = false) String adminHeader` returns `null` when absent. The check `!"true".equals(adminHeader)` is **null-safe** (calling `.equals` on the string literal). Reversing operands (`adminHeader.equals("true")`) would NPE.
- Spring's default validation order: `@Valid` triggers BEFORE the method body executes, regardless of whether the body would have thrown an earlier exception. To enforce admin-first semantics requires a `HandlerInterceptor` or `@RequestBodyAdvice`. For this story scope, accept Spring's default and document.

### References

- ACs and DoD: [Source: `docs/stories/STORY-5-admin-add-menu-item.md`]
- Data model: [Source: `docs/tech-spec.md#Data-model`]
- API conventions: [Source: `docs/tech-spec.md#API-conventions`]
- Workshop conventions: [Source: `CLAUDE.md#Conventions`]
- PRD scope: [Source: `_bmad-output/planning-artifacts/prd.md` §1.4 Scope — item 5]
- STORY-2 DTO precedent: [Source: `_bmad-output/implementation-artifacts/1-2-submit-an-order.md` — Task 5.1 rationale]
- STORY-4 CR PRAISE patterns: [Source: `_bmad-output/implementation-artifacts/code-review-1-4-cancel-one-of-my-orders.md`]

### Questions saved for end

1. **MAJOR-1 debt persists** — `MISSING_HEADER` fallback in `GlobalExceptionHandler` still untouched. STORY-5 explicitly does NOT fix it (scope discipline). Recommend a dedicated cleanup story (`STORY-99: tech debt`) after the 5-story epic completes.
2. **Validation-handler field map doesn't scale** — Task 2.1's hard-coded field→code map (`quantity`/`name`/`priceChf`) is workshop-scope acceptable but won't survive into v2 with more fields. Recommend a future refactor using either annotation-based codes (`@ErrorCode(...)` custom annotation) or convention (`field-name → INVALID_<UPPERCASE>` automatic transform). Document in completion notes.
3. **Admin-check ordering vs `@Valid`** — Spring's default fires validation before the controller body; admin-first semantics aren't enforced by the current implementation. STORY-5 documents this as a known limitation; a participant could explore implementing a `HandlerInterceptor` as a stretch goal.

## Dev Agent Record

### Agent Model Used

Sonnet 4.6 (subagent via Claude Code Opus parent). Subagent crashed after commit/push but before report-back; this section reconstructed from the committed diff + the independent CR.

### Debug Log References

- Commit: `3699499 STORY-5: implement admin adds a menu item`
- Diff: `git diff feature/STORY-4-cancel-order..feature/STORY-5-admin-add-menu-item --stat -- src/` → 7 files, +217 / -7
- Test run after this session resumed: 37 tests, 0 failures, 0 errors, BUILD SUCCESS (verified with full Maven on `feature/STORY-5-admin-add-menu-item` HEAD).

### Completion Notes List

- Task 1: `NotAdminException` and `CreateMenuItemRequest` record created in `menu/`; the latter is the 2nd and only other DTO in v1 (same justification as `CreateOrderRequest`).
- Task 2: `GlobalExceptionHandler.handleMethodArgumentNotValid` refactored to a per-field switch (`quantity` → INVALID_QUANTITY, `name` → INVALID_NAME, `priceChf` → INVALID_PRICE, unknown → INVALID_INPUT fallback). STORY-2 quantity-validation tests confirmed still passing. `NotAdminException` handler added (403 NOT_ADMIN). `MISSING_HEADER` fallback (CR MAJOR-1 debt) intentionally untouched.
- Task 3: `MenuService.addItem(...)` added with `available=true` defaulting; `MenuServiceTest` created (new file) with one test using `ArgumentCaptor<MenuItem>`.
- Task 4: `MenuController` POST `/items` endpoint with null-safe admin check `"true".equals(adminHeader)` as the first statement. Known limitation: Spring's `@Valid` fires before the method body, so a request with both wrong admin header AND invalid body returns 400, not 403. Accepted per locked story Task 4.2 — documented limitation.
- Task 5: 6 new `MenuControllerTest` methods covering happy path, missing admin header, wrong admin header value, blank name, name > 100 chars, negative price. All error-path tests assert both `$.code` AND `$.message` (carry-forward CR MAJOR-2 lesson from STORY-2), except one minor inconsistency caught by STORY-5 CR (see code-review file).
- Task 6: `mvn test` green — 37 tests total (1 app + 9 menu-ctrl + 1 menu-repo + 1 menu-svc + 13 order-ctrl + 3 order-repo + 9 order-svc).
- Task 7: Branched from `feature/STORY-4-cancel-order`, commit + push completed before subagent crash. `gh pr create` skipped per story instructions (gh 401 known). PR opened via browser fallback by parent.

**Saved questions addressed:**
1. MAJOR-1 debt — left untouched per scope discipline. Will need a dedicated cleanup story.
2. Validation-handler field map — hard-coded switch implemented. Workshop-scope acceptable; v2 refactor candidate.
3. Admin-check ordering — Spring default accepted; documented limitation in code/notes. Stretch goal for participants: implement `HandlerInterceptor`.

### File List

Production (5):
- `src/main/java/ch/elca/training/lunch/menu/NotAdminException.java` (NEW)
- `src/main/java/ch/elca/training/lunch/menu/CreateMenuItemRequest.java` (NEW)
- `src/main/java/ch/elca/training/lunch/menu/MenuService.java` (modified — +addItem)
- `src/main/java/ch/elca/training/lunch/menu/MenuController.java` (modified — +POST /items)
- `src/main/java/ch/elca/training/lunch/common/GlobalExceptionHandler.java` (modified — validation refactor + NotAdminException handler)

Tests (2):
- `src/test/java/ch/elca/training/lunch/menu/MenuServiceTest.java` (NEW)
- `src/test/java/ch/elca/training/lunch/menu/MenuControllerTest.java` (modified — +6 tests)
