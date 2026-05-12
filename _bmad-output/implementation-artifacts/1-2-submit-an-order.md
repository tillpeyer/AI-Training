# Story 1.2: Submit an order

Status: review

## Story

As an **on-site ELCA employee**,
I want to **submit a lunch order via an HTTP endpoint with my user identity and a chosen menu item**,
so that **my order is recorded in the system and the kitchen can plan portions accordingly**.

## Acceptance Criteria

1. **AC-1** — `POST /api/v1/orders` with body `{"menuItemId":"<uuid>","quantity":2}` returns HTTP **201 Created** and the saved order in the response body.
2. **AC-2** — Header `X-User-Id` is **required**. Missing header returns HTTP **400** with body `{"code":"MISSING_USER","message":"..."}`.
3. **AC-3** — `quantity` must be in range `1..10` (inclusive). Out of range returns HTTP **400** with body `{"code":"INVALID_QUANTITY","message":"..."}`.
4. **AC-4** — `menuItemId` must reference an **existing** menu item that is currently `available = true`. A non-existent OR unavailable menu item returns HTTP **404** with body `{"code":"MENU_ITEM_NOT_FOUND","message":"..."}`.
5. **AC-5** — The created order has `status = SUBMITTED` and `createdAt` populated by the server (client cannot set them).
6. **AC-6** — The response body includes the generated `id` (UUID) of the new order.

## Tasks / Subtasks

- [x] **Task 1 — Create the `common/` package and cross-cutting infrastructure** (AC: 2, 3, 4)
  - [x] 1.1 Create package `ch.elca.training.lunch.common`
  - [x] 1.2 Add `ApiError.java` — record or class with `code` (String) and `message` (String). Used as the structured error response body per tech-spec §API conventions.
  - [x] 1.3 Add `GlobalExceptionHandler.java` annotated `@RestControllerAdvice`. Map:
    - `MissingRequestHeaderException` (Spring) → **400** with `code="MISSING_USER"` **when** the missing header is `X-User-Id`
    - `MethodArgumentNotValidException` (Spring, from `@Valid` on body) → **400** with `code="INVALID_QUANTITY"` when the failing field is `quantity` (use `BindingResult` to inspect)
    - `MenuItemNotFoundException` (custom, see Task 2.3) → **404** with `code="MENU_ITEM_NOT_FOUND"`

- [x] **Task 2 — Create the `order/` package, `OrderStatus` enum, custom exceptions** (AC: 4, 5)
  - [x] 2.1 Create package `ch.elca.training.lunch.order`
  - [x] 2.2 Add `OrderStatus.java` enum with values `SUBMITTED`, `CANCELLED` (scope this story uses only `SUBMITTED`; `CANCELLED` is added now because tech spec §Data model lists both and STORY-4 will consume it)
  - [x] 2.3 Add `MenuItemNotFoundException.java` in `ch.elca.training.lunch.menu` (lives with the entity it references; raised in `OrderService`). Extends `RuntimeException`.

- [x] **Task 3 — `Order` entity** (AC: 1, 5, 6)
  - [x] 3.1 Add `Order.java` as `@Entity`. Per tech-spec §Data model:
    - `id` — `UUID`, `@Id`, `@GeneratedValue(strategy = GenerationType.UUID)`
    - `userId` — `String`, `@Column(nullable = false)`
    - `menuItemId` — `UUID`, `@Column(nullable = false)`. Plain FK reference — **no** `@ManyToOne MenuItem` (per tech-spec §Decisions: no JPA relations in v1, just the id)
    - `quantity` — `int`, `@Column(nullable = false)`
    - `status` — `OrderStatus`, `@Enumerated(EnumType.STRING)`, `@Column(nullable = false)`
    - `createdAt` — `Instant`, `@CreationTimestamp` (Hibernate), `@Column(nullable = false, updatable = false)`
  - [x] 3.2 No-arg constructor + getters/setters. No Lombok.
  - [x] 3.3 ⚠️ Spring Boot 3.5 reserves the table name `order` (SQL keyword). Annotate `@Table(name = "orders")` to avoid H2 syntax errors.

- [x] **Task 4 — Repository** (AC: 1)
  - [x] 4.1 `OrderRepository extends JpaRepository<Order, UUID>`. No derived queries needed for STORY-2 (STORY-3 will add one).
  - [x] 4.2 No repository test required — STORY-2 only exercises `save()`, which is JpaRepository's contract.

- [x] **Task 5 — Request body type** (AC: 1, 3)
  - [x] 5.1 ⚠️ Tech-spec §Decisions says *"no DTOs for v1, entity is the API"* — but `Order` has 4 server-set fields (`id`, `userId`, `status`, `createdAt`). Accepting `Order` as the request body would let clients spoof those.
  - [x] 5.2 Resolution: introduce a **minimal request record** `CreateOrderRequest(UUID menuItemId, Integer quantity)` in `ch.elca.training.lunch.order` (record, two fields). This is the **only** DTO in v1; document the deviation in the Dev Agent Record completion notes.
  - [x] 5.3 Validate with `@NotNull` on `menuItemId`, `@Min(1) @Max(10) @NotNull` on `quantity`.

- [x] **Task 6 — Service** (AC: 4, 5)
  - [x] 6.1 `OrderService` annotated `@Service`; constructor injection of `OrderRepository` and `MenuRepository`.
  - [x] 6.2 Method `Order submit(CreateOrderRequest req, String userId)`:
    - Load `MenuItem` by `req.menuItemId()` via `menuRepository.findById(...)`
    - If absent **or** `available == false` → throw `new MenuItemNotFoundException(req.menuItemId())`
    - Build `Order`: `userId`, `menuItemId`, `quantity` from request; `status = SUBMITTED`; `createdAt` set by `@CreationTimestamp`
    - `orderRepository.save(order)` → return saved entity (now with id + createdAt populated)
  - [x] 6.3 Service-level test `OrderServiceTest` (`@ExtendWith(MockitoExtension.class)`, no Spring context):
    - **submit_persistsOrderWithSubmittedStatus**: mock available `MenuItem` returned by repo → service returns saved order with `status=SUBMITTED`, `userId` set, `menuItemId` set, `quantity` set. Verify `orderRepository.save(...)` called with expected fields.
    - **submit_throwsWhenMenuItemAbsent**: mock `menuRepository.findById` returns empty → assert `MenuItemNotFoundException` thrown; `orderRepository.save` never called.
    - **submit_throwsWhenMenuItemUnavailable**: mock returns `MenuItem` with `available=false` → same exception, same verification.

- [x] **Task 7 — Controller** (AC: 1, 2, 3, 4, 6)
  - [x] 7.1 `OrderController` annotated `@RestController` at `/api/v1/orders`.
  - [x] 7.2 `@PostMapping` method:
    - Signature: `public ResponseEntity<Order> submit(@RequestHeader("X-User-Id") String userId, @Valid @RequestBody CreateOrderRequest req)`
    - `@RequestHeader("X-User-Id")` with `required=true` (default) — Spring throws `MissingRequestHeaderException` which `GlobalExceptionHandler` maps to 400 + `MISSING_USER`.
    - Return `ResponseEntity.status(HttpStatus.CREATED).body(orderService.submit(req, userId))`
  - [x] 7.3 `@WebMvcTest(OrderController.class)` `OrderControllerTest` covers:
    - **submit_returnsCreatedWithOrder** — happy path. Mock service returns a saved Order → 201, JSON body has `id`, `status:"SUBMITTED"`, `userId`, `menuItemId`, `quantity`, `createdAt`.
    - **submit_returns400WhenUserHeaderMissing** — no `X-User-Id` → 400, `code:"MISSING_USER"`.
    - **submit_returns400WhenQuantityZero** — quantity=0 → 400, `code:"INVALID_QUANTITY"`.
    - **submit_returns400WhenQuantityEleven** — quantity=11 → 400, `code:"INVALID_QUANTITY"`.
    - **submit_returns404WhenMenuItemUnknown** — service throws `MenuItemNotFoundException` → 404, `code:"MENU_ITEM_NOT_FOUND"`.
    - Use `@Import(GlobalExceptionHandler.class)` on the test class so the advice is loaded.

- [x] **Task 8 — Smoke / regression checks** (AC: all)
  - [x] 8.1 `mvn test` green — both STORY-1 tests (`MenuRepositoryTest`, `MenuControllerTest`) and the new STORY-2 tests pass.
  - [ ] 8.2 Boot the app (`mvn spring-boot:run`). Smoke: (manual — see completion notes for steps)
    - `curl http://localhost:8080/api/v1/menu` → still works (regression check on STORY-1)
    - Grab a menu item id from the response. Then:
    - `curl -X POST -H "X-User-Id: emp42" -H "Content-Type: application/json" -d '{"menuItemId":"<id>","quantity":2}' http://localhost:8080/api/v1/orders` → 201 + body
    - Same call without `-H "X-User-Id"` → 400 `MISSING_USER`
    - Same call with `"quantity":0` → 400 `INVALID_QUANTITY`
    - Same call with a random UUID → 404 `MENU_ITEM_NOT_FOUND`

- [x] **Task 9 — Branch, commit, PR** (Definition of Done)
  - [x] 9.1 ⚠️ **Branch from `feature/STORY-1-list-menu`, NOT from `main`** — STORY-2 depends on STORY-1's `MenuItem` entity and PR #1 is not yet merged. Steps:
    - `git fetch origin`
    - `git checkout feature/STORY-1-list-menu` (sync local with origin if needed)
    - `git branch -D feature/STORY-2-create-order` (delete the stale placeholder pointing at `079c474`)
    - `git push origin --delete feature/STORY-2-create-order` (delete remote placeholder; this is safe — the placeholder has no work on it)
    - `git checkout -b feature/STORY-2-create-order`
  - [x] 9.2 Commits formatted `STORY-2: <description>`.
  - [x] 9.3 `git push -u origin feature/STORY-2-create-order`
  - [ ] 9.4 Open PR — `gh` CLI token was invalid (HTTP 401, same as STORY-1). PR must be opened manually at: https://github.com/tillpeyer/AI-Training/compare/feature/STORY-2-create-order (base: main, head: feature/STORY-2-create-order, title: "STORY-2: Submit an order")

## Dev Notes

### Branching context (read first)

- **PR #1 (STORY-1) is OPEN, not merged.** STORY-2's branch is **stacked** on top of STORY-1's branch.
- The pre-existing remote placeholder `origin/feature/STORY-2-create-order` (at commit `079c474`) is stale; delete it before pushing the real branch.
- PR target = `main`. Once PR #1 merges, GitHub will recompute the diff and show only STORY-2's commits. Until then, GitHub will show STORY-1's commits too — that's expected.
- If conflicts appear after PR #1 merges, rebase: `git fetch origin && git rebase origin/main`.

### Workshop conventions (from `CLAUDE.md`)

- **Branch**: `feature/STORY-2-create-order`
- **Commit format**: `STORY-2: <description>`
- **PR target**: `main`. Participant decides on merge.
- **Stay inside ACs.** No "while I'm here" refactors. No new dependencies beyond `pom.xml`.

### Tech stack (locked by tech spec) — unchanged from STORY-1

- Java 21 · Spring Boot 3.5.0 · Maven 3.9+ · H2 in-memory · `ddl-auto: update`
- All needed starters already in `pom.xml`. **Do not add dependencies.**

### Data model (from `docs/tech-spec.md` §Data model)

```
Order
  id          UUID
  userId      String       (NOT NULL — from X-User-Id header)
  menuItemId  UUID         (FK -> MenuItem.id; no JPA relation, just the id)
  quantity    int          (NOT NULL, >= 1, <= 10)
  status      OrderStatus  (default SUBMITTED)
  createdAt   Instant      (auto, set by server)
```

### API conventions (from `docs/tech-spec.md` §API conventions)

- Base path: `/api/v1`
- HTTP status codes used in this story: **201**, **400**, **404**
- Error body shape: `{ "code": "STRING_CODE", "message": "human readable" }` — implemented by `ApiError` in `common/`
- Mock auth: `X-User-Id` header is required for `/orders/**`; **no** `X-Admin` here (admin gate is STORY-5)

### Architecture pattern

Feature-based packaging continues from STORY-1:

```
ch.elca.training.lunch
├── LunchOrderApplication.java  # unchanged
├── menu/                        # STORY-1, unchanged except for adding MenuItemNotFoundException
│   ├── MenuItem.java
│   ├── MenuRepository.java
│   ├── MenuService.java
│   ├── MenuController.java
│   ├── MenuSeedData.java
│   └── MenuItemNotFoundException.java   # NEW in this story
├── order/                       # NEW in this story
│   ├── Order.java
│   ├── OrderStatus.java
│   ├── OrderRepository.java
│   ├── OrderService.java
│   ├── OrderController.java
│   └── CreateOrderRequest.java          # the ONLY DTO in v1 (justified)
└── common/                      # NEW in this story
    ├── ApiError.java
    └── GlobalExceptionHandler.java
```

### Testing standards (from `docs/tech-spec.md` §Testing approach)

- Controllers → `@WebMvcTest(OrderController.class)` + `MockMvc` + `@MockBean OrderService` + `@Import(GlobalExceptionHandler.class)`
- Service tests → `@ExtendWith(MockitoExtension.class)` (pure Mockito, no Spring context — faster)
- **Avoid `@SpringBootTest`** (the `contextLoads()` smoke test remains the only one)

### Library / Framework Requirements

- `jakarta.validation` (`@NotNull`, `@Min`, `@Max`, `@Valid`) — already on classpath
- `jakarta.persistence` (`@Entity`, `@Id`, `@GeneratedValue`, `@Enumerated`, `@Table`, `@CreationTimestamp` is from `org.hibernate.annotations`) — already on classpath
- **No Lombok.** Plain getters/setters.
- **No MapStruct / ModelMapper.** The request → entity mapping is a 3-line hand-written copy in `OrderService`.

### Previous Story Intelligence (from STORY-1 Dev Agent Record)

- ✅ `@Profile("!test")` on `MenuSeedData` keeps `@DataJpaTest` clean — apply same discipline to any new `ApplicationRunner` if needed (STORY-2 doesn't need one).
- ✅ `MenuItem` uses `@GeneratedValue(strategy = GenerationType.UUID)` — replicate for `Order.id` to stay consistent.
- ✅ Constructor injection only, no field injection — already a project convention.
- ⚠️ `mvn` was not on system PATH in the dry-run. IntelliJ-bundled Maven at `C:\Program Files\JetBrains\IntelliJ IDEA 2025.2.5\plugins\maven\lib\maven3\bin\mvn.cmd` works. Use that for `mvn test` if the system `mvn` is missing.
- ⚠️ The Dev subagent's branch was cut from `a071694` instead of current `main` last time, leaving the branch behind. This time, **explicitly check out from `feature/STORY-1-list-menu` HEAD** (which is `e5555e3` — the STORY-1 implementation commit), not from `main`.

### Git Intelligence Summary

Recent commits at session start:
- `e5555e3` STORY-1: implement list today's menu (on `feature/STORY-1-list-menu`)
- `079c474` Add CLAUDE.md so any Claude Code instance picks up workshop context (on `main`)
- `120bf4a` Fix install instructions: BMAD + ELCAi via npm

STORY-2 branch parent = `e5555e3`.

### Latest Tech Information

- `@CreationTimestamp` is the Hibernate annotation (`org.hibernate.annotations.CreationTimestamp`), not Spring Data's `@CreatedDate` (which requires `@EnableJpaAuditing` + a listener). Use the Hibernate one for simplicity.
- `MissingRequestHeaderException` is in `org.springframework.web.bind.MissingRequestHeaderException`. Catch it specifically in `GlobalExceptionHandler` to distinguish from other 400-class errors.
- Spring Boot 3.5 maps `@RestControllerAdvice` handlers correctly only if the advice class is component-scanned — it lives under `ch.elca.training.lunch.common`, which is under the base package, so it gets picked up automatically. For `@WebMvcTest`, use `@Import(GlobalExceptionHandler.class)` to load it explicitly.

### References

- ACs and DoD: [Source: `docs/stories/STORY-2-create-order.md`]
- Data model: [Source: `docs/tech-spec.md#Data-model`]
- API conventions: [Source: `docs/tech-spec.md#API-conventions`]
- No-DTO rule + exception to it: [Source: `docs/tech-spec.md#Decisions-worth-noting` — *"No DTOs for v1, entity = API"*; the `CreateOrderRequest` is the documented exception]
- Testing approach: [Source: `docs/tech-spec.md#Testing-approach`]
- Workshop conventions: [Source: `CLAUDE.md#Conventions`]
- PRD scope: [Source: `docs/prd.md#Scope` — item 2]
- STORY-1 implementation patterns to mimic: [Source: `_bmad-output/implementation-artifacts/1-1-list-todays-menu.md`]
- Retro lessons applied: [Source: `_bmad-output/implementation-artifacts/retro-2026-05-11-dry-run.md`]

### Questions saved for end

1. **`@Table(name = "orders")`** — is renaming the table acceptable? The tech-spec doesn't dictate a name; SQL reserves `order` as a keyword (used in `ORDER BY`). Recommendation: yes, use `orders`. Document in completion notes.
2. **Single DTO `CreateOrderRequest` violates the "no DTOs" rule** — confirmed acceptable per the rationale in Task 5.1. Document in completion notes so STORY-3/4/5 reviewers know this is the only exception and not a precedent for indiscriminate DTO use.
3. **`OrderStatus.CANCELLED`** — added to the enum even though STORY-2 only uses `SUBMITTED`. Tech-spec §Data model lists both values; STORY-4 will need `CANCELLED`. Adding both now avoids an enum migration in STORY-4. Document in completion notes.

## Dev Agent Record

### Agent Model Used

Sonnet 4.6 (subagent via Claude Code Opus parent)

### Debug Log References

- `mvn` not on PATH; used IntelliJ-bundled Maven at `C:\Program Files\JetBrains\IntelliJ IDEA 2025.2.5\plugins\maven\lib\maven3\bin\mvn.cmd`
- `gh` CLI token in keyring was invalid (HTTP 401); PR must be opened manually at https://github.com/tillpeyer/AI-Training/compare/feature/STORY-2-create-order (same situation as STORY-1)

### Completion Notes List

- **Task 1** — `common/ApiError.java` record with `code` + `message`. `GlobalExceptionHandler` (`@RestControllerAdvice`) maps: `MissingRequestHeaderException` with header `X-User-Id` → 400 `MISSING_USER`; `MethodArgumentNotValidException` with failing field `quantity` → 400 `INVALID_QUANTITY`; `MenuItemNotFoundException` → 404 `MENU_ITEM_NOT_FOUND`.
- **Task 2** — `OrderStatus.java` enum with `SUBMITTED` + `CANCELLED`. `MenuItemNotFoundException.java` placed in `ch.elca.training.lunch.menu` (extends `RuntimeException`, constructor takes `UUID`).
- **Task 3** — `Order.java` entity with all fields per tech-spec data model. `@Table(name = "orders")` applied (see Q1 below). `@CreationTimestamp` from `org.hibernate.annotations`. Plain getters/setters, no-arg constructor. No Lombok.
- **Task 4** — `OrderRepository extends JpaRepository<Order, UUID>`. No derived queries needed for STORY-2. No repo test required (only exercises `save()`).
- **Task 5** — `CreateOrderRequest` record with `@NotNull UUID menuItemId` and `@NotNull @Min(1) @Max(10) Integer quantity`. Single DTO exception (see Q2 below).
- **Task 6** — `OrderService.submit(req, userId)`: loads MenuItem, rejects absent/unavailable, builds Order, saves and returns. `OrderServiceTest` (pure Mockito, no Spring): 3 tests — happy path with ArgumentCaptor verification, absent item throws, unavailable item throws. All pass.
- **Task 7** — `OrderController` at `POST /api/v1/orders`. `@RequestHeader("X-User-Id") required=true` (default). Returns 201 with saved Order body. `OrderControllerTest` (`@WebMvcTest` + `@Import(GlobalExceptionHandler.class)`): 5 tests — happy path (201 + all fields), missing header (400 MISSING_USER), quantity=0 (400 INVALID_QUANTITY), quantity=11 (400 INVALID_QUANTITY), MenuItemNotFoundException (404 MENU_ITEM_NOT_FOUND). All pass.
- **Task 8** — `mvn test`: **12 tests, 0 failures, 0 errors** (4 STORY-1 tests + 1 contextLoads + 3 OrderServiceTest + 5 OrderControllerTest). BUILD SUCCESS.
- **Manual smoke check steps** (for human to run optionally):
  1. `mvn spring-boot:run` (or start from IntelliJ)
  2. `curl http://localhost:8080/api/v1/menu` → 3 items (STORY-1 regression check)
  3. Copy a `menuItemId` from response, then: `curl -X POST -H "X-User-Id: emp42" -H "Content-Type: application/json" -d '{"menuItemId":"<id>","quantity":2}' http://localhost:8080/api/v1/orders` → 201 + JSON body with `id`, `status:"SUBMITTED"`, `createdAt`
  4. Same without `-H "X-User-Id"` → 400 `MISSING_USER`
  5. Same with `"quantity":0` → 400 `INVALID_QUANTITY`
  6. Same with a random UUID for `menuItemId` → 404 `MENU_ITEM_NOT_FOUND`

**Answers to the 3 saved questions:**

1. **`@Table(name = "orders")`** — Yes, used. `order` is a SQL reserved keyword (`ORDER BY`); H2 and standard SQL would reject a table named `order` without quoting. Renaming to `orders` is the safe, conventional choice and is not constrained by the tech-spec (which specifies the entity class name, not the table name).

2. **Single DTO `CreateOrderRequest` violates the "no DTOs" rule** — Accepted and documented. The `Order` entity has 4 server-set fields (`id`, `userId`, `status`, `createdAt`). Accepting the raw entity as request body would allow clients to spoof those fields. `CreateOrderRequest(UUID menuItemId, Integer quantity)` is the minimal necessary request type. This is the **only** DTO in v1 and does not set a precedent for STORY-3/4/5.

3. **`OrderStatus.CANCELLED`** — Added to enum alongside `SUBMITTED` even though STORY-2 only uses `SUBMITTED`. The tech-spec §Data model lists both values, and STORY-4 (cancel an order) will consume `CANCELLED`. Adding both now avoids an enum schema migration later. Hibernate creates the column as `enum ('CANCELLED','SUBMITTED')` at DDL time, so both values are already present in the schema.

### File List

**Production (new):**
- `src/main/java/ch/elca/training/lunch/common/ApiError.java`
- `src/main/java/ch/elca/training/lunch/common/GlobalExceptionHandler.java`
- `src/main/java/ch/elca/training/lunch/menu/MenuItemNotFoundException.java`
- `src/main/java/ch/elca/training/lunch/order/Order.java`
- `src/main/java/ch/elca/training/lunch/order/OrderController.java`
- `src/main/java/ch/elca/training/lunch/order/OrderRepository.java`
- `src/main/java/ch/elca/training/lunch/order/OrderService.java`
- `src/main/java/ch/elca/training/lunch/order/OrderStatus.java`
- `src/main/java/ch/elca/training/lunch/order/CreateOrderRequest.java`

**Tests (new):**
- `src/test/java/ch/elca/training/lunch/order/OrderServiceTest.java`
- `src/test/java/ch/elca/training/lunch/order/OrderControllerTest.java`
