# Story 1.1: List today's menu

Status: ready-for-dev

## Story

As an **on-site ELCA employee**,
I want to **retrieve today's available lunch menu via an HTTP endpoint**,
so that I can **decide what to order without consulting the paper sheet at reception**.

## Acceptance Criteria

1. **AC-1** — `GET /api/v1/menu` returns HTTP **200** with a JSON array of menu items.
2. **AC-2** — Each array element exposes at minimum: `id`, `name`, `priceChf`, `available`.
3. **AC-3** — Items with `available = false` are **excluded** from the response.
4. **AC-4** — An empty menu returns `[]`, **never** `null` or `404`.
5. **AC-5** — No authentication required for this endpoint (no `X-User-Id` header, no admin gate).

## Tasks / Subtasks

- [x] **Task 1 — Create the `menu` package and `MenuItem` entity** (AC: 1, 2)
  - [x] 1.1 Create package `ch.elca.training.lunch.menu`
  - [x] 1.2 Add `MenuItem.java` as `@Entity` with fields:
    - `id` — `UUID`, `@Id`, generated (e.g. `@GeneratedValue(strategy = GenerationType.UUID)`)
    - `name` — `String`, `@Column(nullable = false)`, `@NotBlank @Size(max = 100)`
    - `priceChf` — `BigDecimal`, `@Column(nullable = false)`, `@PositiveOrZero`
    - `available` — `boolean`, default `true` (field initializer)
  - [x] 1.3 Add getters / setters (or use Lombok if pre-existing in `pom.xml` — it isn't, so plain getters/setters)
  - [x] 1.4 Provide a no-arg constructor (JPA requirement) and a convenience constructor for seed data

- [x] **Task 2 — Repository** (AC: 3)
  - [x] 2.1 `MenuRepository extends JpaRepository<MenuItem, UUID>`
  - [x] 2.2 Add derived query: `List<MenuItem> findAllByAvailableTrue()`
  - [x] 2.3 `@DataJpaTest` `MenuRepositoryTest` — given 2 available + 1 unavailable item, `findAllByAvailableTrue()` returns exactly the 2 available

- [x] **Task 3 — Service** (AC: 3)
  - [x] 3.1 `MenuService` with one method: `List<MenuItem> listAvailable()` delegating to `MenuRepository.findAllByAvailableTrue()`
  - [x] 3.2 Mark as `@Service`; constructor injection (no field injection)

- [x] **Task 4 — Controller** (AC: 1, 2, 4, 5)
  - [x] 4.1 `MenuController` annotated `@RestController` at base path `/api/v1/menu`
  - [x] 4.2 `@GetMapping` method returning `List<MenuItem>` from `menuService.listAvailable()`
  - [x] 4.3 No security annotations / no `@RequestHeader` (public endpoint)
  - [x] 4.4 `@WebMvcTest(MenuController.class)` `MenuControllerTest`:
    - Happy path: 2 seeded items → 200 + JSON array of length 2 with required fields
    - Empty menu: service returns `Collections.emptyList()` → 200 + `[]`
    - Filter check: verify the controller only ever calls `listAvailable()` (not `findAll()`), via `Mockito.verify`

- [x] **Task 5 — Seed data for the workshop demo** (AC: 1)
  - [x] 5.1 Add `MenuSeedData` (or co-located `@Configuration`) with an `ApplicationRunner` bean that inserts 3–4 sample items (e.g. *Risotto aux champignons CHF 14.50*, *Salade César CHF 12.00*, *Plat du jour CHF 16.50*, *Soupe — unavailable CHF 8.00*) so the `available=false` filter is observably correct
  - [x] 5.2 Manual verification: `mvn spring-boot:run` boots; `curl http://localhost:8080/api/v1/menu` returns 3 of 4 seeded items (the unavailable one excluded)
  - [x] 5.3 `curl http://localhost:8080/actuator/health` returns `{"status":"UP"}` (existing functionality, regression check)

- [x] **Task 6 — PR** (Definition of Done)
  - [x] 6.1 Branch: `feature/STORY-1-list-menu`
  - [x] 6.2 Commits formatted `STORY-1: <description>`
  - [x] 6.3 `mvn test` green
  - [ ] 6.4 Open PR against `main` — do **not** self-merge (branch pushed; `gh` CLI not installed — PR must be opened manually at https://github.com/tillpeyer/AI-Training/compare/feature/STORY-1-list-menu)

## Dev Notes

### Workshop conventions (from `CLAUDE.md`)

- **Branch**: `feature/STORY-1-list-menu`
- **Commit format**: `STORY-1: <description>` (no Co-Authored-By unless explicitly requested)
- **PR target**: `main`. Participant decides on merge — Dev agent does **not** merge.
- **Stay inside ACs.** No "while I'm here" refactors. No preemptive DTOs. No new dependencies.

### Tech stack (locked by tech spec)

- Java 21 (LTS) · Spring Boot 3.5.0 · Maven 3.9+ · H2 in-memory · `ddl-auto: update`
- Existing `pom.xml` already includes: `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-validation`, `spring-boot-starter-actuator`, `h2`, `spring-boot-starter-test`
- **Do not add dependencies.** Everything needed is already declared.

### Data model (from `docs/tech-spec.md` §Data model)

```
MenuItem
  id         UUID
  name       String      (NOT NULL, 1..100)
  priceChf   BigDecimal  (NOT NULL, >= 0)
  available  boolean     (default true)
```

Use `BigDecimal` (not `double` / `float`) for money. Use `UUID` (not Long, not String) for ids — matches the broader ELCA convention.

### API conventions (from `docs/tech-spec.md` §API conventions)

- Base path: `/api/v1`
- JSON request/response bodies
- HTTP status codes used in this story: **200** only (no creates, no errors expected)
- This endpoint is **public** — no `X-User-Id`, no `X-Admin`

### Architecture pattern (from `docs/tech-spec.md` §Package layout)

Feature-based, **not** layered. Entity, repo, service, controller live side by side in `ch.elca.training.lunch.menu/`. **Do not** create `dto/`, `entity/`, `service/`, `controller/` sub-packages.

### Testing standards (from `docs/tech-spec.md` §Testing approach)

- **Controllers** → `@WebMvcTest(MenuController.class)` + `MockMvc`. Mock `MenuService`.
- **Repositories** → `@DataJpaTest`. Real H2.
- **Avoid `@SpringBootTest`** — the existing `LunchOrderApplicationTests.contextLoads()` is the only one allowed.
- Use `MockMvc.perform(get("/api/v1/menu")).andExpect(status().isOk()).andExpect(jsonPath("$").isArray())`.
- Assert at least one item's `id`, `name`, `priceChf`, `available` are non-null.

### Project Structure Notes

Current state of the source tree (verified):

```
src/main/java/ch/elca/training/lunch/
└── LunchOrderApplication.java         # empty @SpringBootApplication; this is the first feature
src/main/resources/
└── application.yml                    # exists; do not overwrite, only add if needed
src/test/java/ch/elca/training/lunch/
└── LunchOrderApplicationTests.java    # smoke test, leave untouched
```

**Expected new files after this story:**

```
src/main/java/ch/elca/training/lunch/menu/
├── MenuItem.java
├── MenuRepository.java
├── MenuService.java
├── MenuController.java
└── MenuSeedData.java                  # or merge seed into a @Configuration class
src/test/java/ch/elca/training/lunch/menu/
├── MenuControllerTest.java            # @WebMvcTest
└── MenuRepositoryTest.java            # @DataJpaTest
```

No conflict with the existing structure — strictly additive.

### Library / Framework Requirements

- `jakarta.validation` annotations (`@NotBlank`, `@Size`, `@PositiveOrZero`) — provided by `spring-boot-starter-validation` already in `pom.xml`.
- `jakarta.persistence` annotations (`@Entity`, `@Id`, `@GeneratedValue`, `@Column`) — provided by `spring-boot-starter-data-jpa`.
- **No Lombok.** Not in `pom.xml`. Write plain getters/setters.
- **No MapStruct, no ModelMapper.** Entity = API; no mapping layer.

### Previous Story Intelligence

None — this is the **first** story in the epic and the codebase is greenfield (only `LunchOrderApplication.java` exists). No prior patterns to follow except those locked in `docs/tech-spec.md`.

### Git Intelligence Summary

Repo has 2 commits (`120bf4a` install instructions, `a071694` initial scaffold). No prior implementation patterns to mine. The PR for this story will be the first feature PR on the branch tree.

### Latest Tech Information

Spring Boot 3.5 (released 2025) is current and stable. Jakarta EE 10 namespace (`jakarta.*`, not `javax.*`) is required — common pitfall when migrating from Spring Boot 2.x. UUID generation via `@GeneratedValue(strategy = GenerationType.UUID)` was added in Spring Data JPA 3.0; works out of the box on this project.

### References

- ACs and DoD: [Source: `docs/stories/STORY-1-list-menu.md`]
- Data model: [Source: `docs/tech-spec.md#Data-model`]
- API conventions: [Source: `docs/tech-spec.md#API-conventions`]
- Package layout: [Source: `docs/tech-spec.md#Package-layout`]
- Testing approach: [Source: `docs/tech-spec.md#Testing-approach`]
- Workshop conventions: [Source: `CLAUDE.md#Conventions`]
- PRD scope: [Source: `_bmad-output/planning-artifacts/prd.md` §1.4 Scope]
- Epic context: [Source: `_bmad-output/planning-artifacts/epics.md#Epic-1`]

### Questions saved for end

1. **Seed data location** — `@Component` `ApplicationRunner` (always seeds at boot) vs. `@Profile("!test")`-gated seeder (avoids polluting `@DataJpaTest`). Recommendation: gate with `@Profile("!test")` so tests start from an empty DB.
2. **"Today's menu" semantics** — tech-spec data model has no `validForDate` field. "Today" is implicit ("whatever's currently `available=true` in the DB"). Confirmed acceptable for v1; flagged in §1.4 of the SRD as gray area.

## Dev Agent Record

### Agent Model Used

Sonnet 4.6 (subagent via Claude Code Opus parent)

### Debug Log References

- `mvn` not on PATH; used IntelliJ-bundled Maven at `C:\Program Files\JetBrains\IntelliJ IDEA 2025.2.5\plugins\maven\lib\maven3\bin\mvn`
- `gh` CLI not installed; PR must be opened manually

### Completion Notes List

- **Task 1** — `MenuItem` entity created with UUID id (`@GeneratedValue(strategy = GenerationType.UUID)`), `@NotBlank @Size(max=100)` name, `@PositiveOrZero` BigDecimal priceChf, boolean available defaulting to true. Plain getters/setters + no-arg + convenience constructors.
- **Task 2** — `MenuRepository` extends `JpaRepository<MenuItem, UUID>` with `findAllByAvailableTrue()`. `MenuRepositoryTest` (`@DataJpaTest`) confirmed: 2 available + 1 unavailable → returns 2.
- **Task 3** — `MenuService` annotated `@Service`, constructor-injected repository, single `listAvailable()` method delegating to `findAllByAvailableTrue()`.
- **Task 4** — `MenuController` at `GET /api/v1/menu`, no auth headers. `MenuControllerTest` (`@WebMvcTest`): happy path (2 items → 200 + array), empty menu (→ `[]`), `Mockito.verify(menuService).listAvailable()`.
- **Task 5** — `MenuSeedData` `@Configuration @Profile("!test")` seeds Risotto 14.50, Salade César 12.00, Plat du jour 16.50 (available) + Soupe 8.00 (unavailable). Smoke check: `/api/v1/menu` returned 3 items, `/actuator/health` returned `{"status":"UP"}`.
- **Task 6** — Branch `feature/STORY-1-list-menu` pushed to origin. `mvn test`: 4 tests, 0 failures. PR must be opened manually (see 6.4 note above).

### File List

**Production:**
- `src/main/java/ch/elca/training/lunch/menu/MenuItem.java`
- `src/main/java/ch/elca/training/lunch/menu/MenuRepository.java`
- `src/main/java/ch/elca/training/lunch/menu/MenuService.java`
- `src/main/java/ch/elca/training/lunch/menu/MenuController.java`
- `src/main/java/ch/elca/training/lunch/menu/MenuSeedData.java`

**Tests:**
- `src/test/java/ch/elca/training/lunch/menu/MenuRepositoryTest.java`
- `src/test/java/ch/elca/training/lunch/menu/MenuControllerTest.java`
