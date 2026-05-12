# Story 1.3: List my orders

Status: review

## Story

As an **on-site ELCA employee**,
I want to **see the list of lunch orders I've placed today**,
so that I can **confirm my orders landed and remember what I've ordered**.

## Acceptance Criteria

1. **AC-1** — `GET /api/v1/orders/me` returns HTTP **200** with a JSON array of orders belonging to the caller.
2. **AC-2** — Header `X-User-Id` is **required**. Missing header returns HTTP **400** with body `{"code":"MISSING_USER","message":"..."}` (same error contract as STORY-2).
3. **AC-3** — Only orders matching `userId == X-User-Id` are returned. Orders from **other** users are **never** returned, even with a different valid `X-User-Id`.
4. **AC-4** — Results are sorted by `createdAt` **descending** (newest first).
5. **AC-5** — An empty result returns `[]` — **never** `null` or `404`.
6. **AC-6** — Both `SUBMITTED` and `CANCELLED` orders are included (employees need history, not just active orders).

## Tasks / Subtasks

- [x] **Task 1 — Add derived repository query** (AC: 3, 4)
  - [x] 1.1 In `ch.elca.training.lunch.order.OrderRepository`, add: `List<Order> findAllByUserIdOrderByCreatedAtDesc(String userId);`
  - [x] 1.2 `@DataJpaTest` `OrderRepositoryTest` (new file under `src/test/java/ch/elca/training/lunch/order/`):
    - Persist 4 orders: 2 for `emp1` with different `createdAt`, 1 for `emp2`, 1 for `emp1` with status `CANCELLED`
    - Call `findAllByUserIdOrderByCreatedAtDesc("emp1")` → assert size = 3, all belong to `emp1`, sorted by `createdAt` desc, and the `CANCELLED` one is included (AC-6)
    - Call `findAllByUserIdOrderByCreatedAtDesc("nobody")` → assert empty list (AC-5 boundary)

- [x] **Task 2 — Extend `OrderService`** (AC: 1, 3, 4)
  - [x] 2.1 Add method `List<Order> listMine(String userId)` to `OrderService`, delegating to `orderRepository.findAllByUserIdOrderByCreatedAtDesc(userId)`
  - [x] 2.2 Add test method `listMine_returnsOnlyCallersOrdersInDescOrder` to existing `OrderServiceTest`:
    - Mock repo to return a list of 2 orders → assert service returns the same list, repo called with the right userId
    - `ArgumentCaptor<String>` to assert the userId passed in is exactly the one received from the controller

- [x] **Task 3 — Extend `OrderController`** (AC: 1, 2, 5)
  - [x] 3.1 Add `@GetMapping("/me")` method to `OrderController`:
    - Signature: `public List<Order> listMine(@RequestHeader("X-User-Id") String userId)`
    - Body: `return orderService.listMine(userId);`
    - No `@ResponseStatus` needed — default 200 OK is correct
  - [x] 3.2 Add tests to existing `OrderControllerTest`:
    - **listMine_returnsOkWithOrders** — mock service returns 2 orders → 200, JSON array length 2, each element has `id`, `userId`, `menuItemId`, `quantity`, `status`, `createdAt`. Use `jsonPath` to assert `$[0].userId == "emp1"` (test fixture).
    - **listMine_returnsEmptyArrayWhenNoOrders** — mock service returns `Collections.emptyList()` → 200, `$` is array, `$.length() == 0` (AC-5).
    - **listMine_returns400WhenUserHeaderMissing** — no `X-User-Id` header → 400. Assert BOTH `$.code == "MISSING_USER"` AND `$.message` is non-empty (applying CR MAJOR-2 lesson from STORY-2).
    - Verify `Mockito.verify(orderService).listMine(eq("emp1"))` on the happy path — proves the controller forwards the header value correctly (cross-user isolation guard from AC-3 is enforced at the repo layer; this verify proves the controller doesn't accidentally pass a hard-coded value).

- [x] **Task 4 — Cross-user isolation test** (AC: 3) ⚠️ NEW pattern
  - [x] 4.1 Add a SECOND test to `OrderRepositoryTest`: `findAllByUserIdOrderByCreatedAtDesc_doesNotLeakOtherUsersOrders`:
    - Persist 3 orders: 2 for `emp1`, 1 for `emp2`
    - Call with `userId="emp1"` → assert size = 2, all `userId == "emp1"`, NONE has `userId == "emp2"`
    - Call with `userId="emp2"` → assert size = 1, `userId == "emp2"`
  - [x] 4.2 This is a security-relevant test: weak version is "size matches", strong version is "no leakage". Implement the strong version. Cite this in the Completion Notes as a pattern STORY-4 should replicate for the ownership check on cancel.

- [x] **Task 5 — Smoke / regression checks** (AC: all)
  - [x] 5.1 `mvn test` green — STORY-1 (4 tests) + STORY-2 (8 tests) + STORY-3 (~6 new tests) = ~18 total, all passing.
  - [x] 5.2 Boot smoke (manual; document in completion notes):
    - `curl http://localhost:8080/api/v1/menu` → still works
    - `curl -X POST -H "X-User-Id: emp1" -H "Content-Type: application/json" -d '{"menuItemId":"<id>","quantity":1}' http://localhost:8080/api/v1/orders` (twice with different items)
    - `curl -H "X-User-Id: emp1" http://localhost:8080/api/v1/orders/me` → 200, 2-element array, newest first
    - `curl http://localhost:8080/api/v1/orders/me` (no header) → 400 `MISSING_USER`
    - `curl -H "X-User-Id: emp2" http://localhost:8080/api/v1/orders/me` → 200, `[]` (emp2 has no orders)

- [x] **Task 6 — Branch, commit, PR** (Definition of Done)
  - [x] 6.1 ⚠️ **Branch from `feature/STORY-2-create-order`** (PR #2 also not merged — same stacked pattern as STORY-2 on STORY-1). Steps:
    - `git fetch origin`
    - `git checkout feature/STORY-2-create-order` (sync with origin if needed)
    - `git branch -D feature/STORY-3-list-my-orders 2>/dev/null` (delete local stale placeholder)
    - `& "C:\Program Files\GitHub CLI\gh.exe" api -X DELETE /repos/tillpeyer/AI-Training/git/refs/heads/feature/STORY-3-list-my-orders` (delete remote placeholder) — if `gh` is 401, fall back to: `git push origin --delete feature/STORY-3-list-my-orders`
    - `git checkout -b feature/STORY-3-list-my-orders`
  - [x] 6.2 Commits formatted `STORY-3: <description>`.
  - [x] 6.3 `git push -u origin feature/STORY-3-list-my-orders`
  - [x] 6.4 Open PR with base `main`: `gh pr create --base main --head feature/STORY-3-list-my-orders --title "STORY-3: List my orders" --body-file _bmad-output/implementation-artifacts/1-3-list-my-orders.md`. If `gh` returns 401, fall back to opening `https://github.com/tillpeyer/AI-Training/compare/feature/STORY-3-list-my-orders?expand=1` in the browser via `Start-Process`.

## Dev Notes

### Branching context (read first)

- **PR #1 (STORY-1) and PR #2 (STORY-2) are both OPEN**, not merged. STORY-3's branch is stacked on top of STORY-2's, which is stacked on STORY-1's. PR target = `main` — GitHub auto-cleans the diff once parents merge.
- The pre-existing remote placeholder `origin/feature/STORY-3-list-my-orders` (at commit `079c474`) is stale; delete before pushing.

### Workshop conventions

- Branch: `feature/STORY-3-list-my-orders`
- Commit: `STORY-3: <description>`
- PR target: `main`. Participant decides on merge.
- **Stay inside ACs.** No "while I'm here" refactors.

### What's NEW vs unchanged

**NEW for STORY-3 (5 things):**
1. One repository derived query: `findAllByUserIdOrderByCreatedAtDesc`
2. One service method: `listMine(userId)`
3. One controller method: `GET /api/v1/orders/me`
4. One new test file: `OrderRepositoryTest` (first repo test in `order/`)
5. ~3 new methods added to existing `OrderControllerTest` and `OrderServiceTest`

**UNCHANGED (do NOT touch):**
- `Order.java`, `OrderStatus.java`, `CreateOrderRequest.java`, `OrderRepository.java`'s existing contract
- `MenuItem.java`, `MenuRepository.java`, `MenuService.java`, `MenuController.java`, `MenuSeedData.java`
- `GlobalExceptionHandler.java`, `ApiError.java`, `MenuItemNotFoundException.java`
- ⚠️ Especially: do NOT fix the `MISSING_HEADER` fallback in `GlobalExceptionHandler` (CR MAJOR-1 from STORY-2). That's known debt; out of scope for STORY-3. It will be addressed separately or in STORY-5 prep.

### Tech stack (locked) — unchanged

- Java 21 · Spring Boot 3.5.0 · Maven 3.9+ · H2 in-memory
- All starters in `pom.xml`. Do not add dependencies.

### API conventions

- Path: `GET /api/v1/orders/me`
- HTTP codes used: **200**, **400**
- Error body: `{"code":"...","message":"..."}` — both fields required per contract. **Tests MUST assert both** (lesson from STORY-2 CR).

### Testing standards

- Service test: `@ExtendWith(MockitoExtension.class)` (extend existing `OrderServiceTest`)
- Controller test: `@WebMvcTest(OrderController.class)` + `@Import(GlobalExceptionHandler.class)` (extend existing `OrderControllerTest`)
- Repository test: `@DataJpaTest` (new `OrderRepositoryTest`)
- Use `ArgumentCaptor` where it adds value (carryover from STORY-2 PRAISE)
- **Strong-form isolation test** in repo layer — see Task 4. Don't just assert sizes; assert no leakage of other users' data.

### Architecture pattern

Feature-based packaging continues. No new packages. All STORY-3 changes are inside `order/` (plus one new test file in `order/` test tree).

```
ch.elca.training.lunch.order/
├── Order.java                              (unchanged)
├── OrderStatus.java                        (unchanged)
├── OrderRepository.java                    (+1 method)
├── CreateOrderRequest.java                 (unchanged)
├── OrderService.java                       (+1 method: listMine)
└── OrderController.java                    (+1 endpoint: GET /me)

src/test/java/.../order/
├── OrderServiceTest.java                   (+1 test method)
├── OrderControllerTest.java                (+~3 test methods)
└── OrderRepositoryTest.java                NEW
```

### Library / Framework Requirements

- No new libraries.
- Spring Data derived query: `findAllByUserIdOrderByCreatedAtDesc(String userId)` — naming follows Spring Data conventions exactly: `findAllBy<Field>OrderBy<Field>Desc`. No `@Query` annotation needed.

### Previous Story Intelligence (from STORY-2 retro and CR)

- ✅ Carry forward: `ArgumentCaptor` pattern from `OrderServiceTest`
- ✅ Carry forward: `@Import(GlobalExceptionHandler.class)` idiom in `@WebMvcTest`
- ✅ Carry forward: stacked-branch workflow
- ✅ Carry forward: saved-questions-at-end pattern in locked story files
- ⚠️ Apply CR lesson: error tests must assert both `$.code` AND `$.message` (Task 3.2 `listMine_returns400WhenUserHeaderMissing`)
- ⚠️ Do NOT touch `GlobalExceptionHandler` to fix the `MISSING_HEADER` fallback — known debt, out of scope
- ⚠️ `mvn` may not be on system PATH. Fall back to `C:\Program Files\JetBrains\IntelliJ IDEA 2025.2.5\plugins\maven\lib\maven3\bin\mvn.cmd`
- ⚠️ `gh` may return 401 (token went bad mid-STORY-2). Fall back to opening compare URL in browser.

### Git Intelligence Summary

Recent commits at session start:
- `feature/STORY-2-create-order` HEAD has the STORY-2 work stacked on STORY-1
- Branch parent for STORY-3 = `feature/STORY-2-create-order` HEAD

### References

- ACs and DoD: [Source: `docs/stories/STORY-3-list-my-orders.md`]
- Data model: [Source: `docs/tech-spec.md#Data-model`]
- API conventions: [Source: `docs/tech-spec.md#API-conventions`]
- Testing approach: [Source: `docs/tech-spec.md#Testing-approach`]
- Workshop conventions: [Source: `CLAUDE.md#Conventions`]
- PRD scope: [Source: `docs/prd.md#Scope` — item 3]
- STORY-2 patterns to replicate: [Source: `_bmad-output/implementation-artifacts/1-2-submit-an-order.md`]
- STORY-2 CR lessons to apply: [Source: `_bmad-output/implementation-artifacts/code-review-1-2-submit-an-order.md`]
- STORY-2 retro: [Source: `_bmad-output/implementation-artifacts/retro-1-2-submit-an-order.md`]

### Questions saved for end

(None for STORY-3 — patterns are established. All decisions are settled in the tech-spec and prior stories.)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_(none — no debugging required; all tests passed on first run)_

### Completion Notes List

- **Task 1**: Added `findAllByUserIdOrderByCreatedAtDesc(String userId)` to `OrderRepository`. Created `OrderRepositoryTest` (`@DataJpaTest`) with sort/filter/cancelled-included test and empty-result test. Used `Order.setCreatedAt()` to set fixed `Instant` values for deterministic sort assertions.
- **Task 2**: Added `listMine(String userId)` to `OrderService`. Added `listMine_returnsOnlyCallersOrdersInDescOrder` to `OrderServiceTest` using `ArgumentCaptor<String>` to verify the userId passed to the repo matches the one the controller receives.
- **Task 3**: Added `@GetMapping("/me")` to `OrderController`. Added 3 test methods to `OrderControllerTest`: happy path (2 orders, verifies all 6 fields + `Mockito.verify`), empty array (AC-5), and missing header (asserts BOTH `$.code == "MISSING_USER"` AND `$.message` non-empty — applying CR MAJOR-2 from STORY-2).
- **Task 4**: Added `findAllByUserIdOrderByCreatedAtDesc_doesNotLeakOtherUsersOrders` to `OrderRepositoryTest` — strong-form isolation: asserts `noneMatch(userId == "emp2")` on emp1's results and vice versa (not just size match). **STORY-4 should replicate this pattern** for the ownership check on cancel: when cancelling order X as userId Y, assert that orders belonging to a different userId Z are never returned/modified.
- **Task 5**: `mvn test` — **19 tests, 0 failures, 0 errors** (1 app + 2 menu-ctrl + 1 menu-repo + 8 order-ctrl + 3 order-repo + 4 order-svc). Boot smoke steps documented in story AC (manual; server not started). Maven invoked via IntelliJ bundled path (not on system PATH).
- **Task 6**: Branched from `feature/STORY-2-create-order` (commit `9b858e5`). Deleted stale remote placeholder `origin/feature/STORY-3-list-my-orders` via `git push origin --delete` (gh CLI 401 again). Single commit `cd5b196`. Pushed. PR creation via gh CLI failed (401); browser fallback opened at `https://github.com/tillpeyer/AI-Training/compare/main...feature/STORY-3-list-my-orders?expand=1` — human action required to submit PR.

### File List

- `src/main/java/ch/elca/training/lunch/order/OrderRepository.java` (modified — +1 derived query)
- `src/main/java/ch/elca/training/lunch/order/OrderService.java` (modified — +`listMine` method)
- `src/main/java/ch/elca/training/lunch/order/OrderController.java` (modified — +`GET /me` endpoint)
- `src/test/java/ch/elca/training/lunch/order/OrderRepositoryTest.java` (new — 3 test methods)
- `src/test/java/ch/elca/training/lunch/order/OrderServiceTest.java` (modified — +1 test method)
- `src/test/java/ch/elca/training/lunch/order/OrderControllerTest.java` (modified — +3 test methods)
