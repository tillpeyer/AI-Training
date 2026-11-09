# Tech Spec — Lunch Order API

> # ⚠️ SUPERSEDED — 2026-09-03
>
> **This document is no longer the architecture of record.** It describes the system as designed on
> **2026-05-11**, before Feature 2 and before two backend endpoints landed. Read it only for history.
>
> | Instead, use | For |
> |---|---|
> | `_bmad-output/planning-artifacts/architecture.md` | The as-built reference — API inventory, error contract, data model, version support, open items |
> | `_bmad-output/planning-artifacts/architecture/ARCHITECTURE-SPINE.md` | The binding contract — 18 ADs a change must not violate |
> | `_bmad-output/project-context.md` | The agent-facing rules distilled from both |
> | `frontend-angular/DESIGN.md` + `EXPERIENCE.md` | Feature 2's design of record |
>
> ### Why it is kept rather than deleted
>
> Five delivered stories (`1-1` … `1-5`) cite this file as `[Source: docs/tech-spec.md#…]` for their
> data model, API conventions, package layout and testing approach. Deleting or rewriting it would
> destroy the provenance of work already merged. It stays, frozen, as the record of what the dev
> agent was actually told at the time.
>
> ### What is now wrong or missing below
>
> Do not act on any of these:
>
> 1. **No frontend.** *"A single Spring Boot 3.5 module… No external systems."* Feature 2 ships an
>    Angular 21 browser client. The PRD's matching exclusion was lifted on 2026-09-03.
> 2. **Two endpoints are absent.** `GET /api/v1/menu/{id}` (story 2.7 — the only read that returns an
>    item regardless of availability) and `DELETE /api/v1/menu/items/{id}` (story 1.8) both landed after
>    this was written and appear nowhere below.
> 3. **The admin surface is understated.** §API conventions says admin means only `POST /menu/items`.
>    `DELETE /menu/items/{id}` is also admin-gated.
> 4. **403 is missing from the status-code list.** It lists 200/201/204/400/404/409, but `NOT_ADMIN` and
>    `NOT_OWNER` both return **403**, and always have.
> 5. **CORS is absent entirely.** `common/WebConfig` allows exactly one origin,
>    `http://localhost:5173` — an architectural constraint that dictates the frontend's dev-server port.
> 6. **The package layout is stale.** It omits `WebConfig`, `MenuSeedData`, and all six domain exception
>    classes; `common/` is shown holding only `ApiError` and `GlobalExceptionHandler`.
> 7. **Spring Boot 3.5.0 is out of OSS support** as of 2026-06-30. Still deliberately pinned — see the
>    architecture document's Deferred table for why.
>
> ### What below is still true
>
> The 3-layer split, feature-based packaging, the data model, UUID keys, the no-DTO-for-responses rule,
> `jakarta.validation`, `ddl-auto: update` with no migrations, and the testing approach
> (`@WebMvcTest` / `@DataJpaTest`, `@SpringBootTest` for the smoke test only). All were carried
> forward into the spine as adopted decisions.

---

> **Phase 3 artefact.** Produced by the architect agent. SM agent should read this before locking stories so the implementation hints in each story make sense.

## Architecture

A single Spring Boot 3.5 module. Classic 3-layer split:

```
Controller (REST) ──► Service ──► Repository (Spring Data JPA) ──► H2
```

No external systems. No async. No security beyond a mock `X-User-Id` header read by a `@RequestHeader` argument.

## Package layout

```
ch.elca.training.lunch
├── LunchOrderApplication.java   # boot class
├── menu/
│   ├── MenuItem.java            # @Entity
│   ├── MenuRepository.java      # JpaRepository
│   ├── MenuService.java
│   └── MenuController.java
├── order/
│   ├── Order.java               # @Entity
│   ├── OrderStatus.java         # enum: SUBMITTED, CANCELLED
│   ├── OrderRepository.java
│   ├── OrderService.java
│   └── OrderController.java
└── common/
    ├── ApiError.java            # error response DTO
    └── GlobalExceptionHandler.java
```

Feature-based packaging — each domain owns its entity, repo, service, controller. Mirrors the API Gateway convention in CLAUDE.md but simpler (no `dto/` `entity/` split — single-module, single-team workshop project).

## Data model

```
MenuItem
  id         UUID
  name       String  (NOT NULL, 1..100)
  priceChf   BigDecimal (NOT NULL, >= 0)
  available  boolean (default true)

Order
  id         UUID
  userId     String  (NOT NULL — from X-User-Id header)
  menuItemId UUID    (FK -> MenuItem.id)
  quantity   int     (NOT NULL, >= 1, <= 10)
  status     OrderStatus  (default SUBMITTED)
  createdAt  Instant (auto)
```

## API conventions

- All endpoints under `/api/v1`
- JSON request/response bodies
- HTTP status codes: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 404 Not Found, 409 Conflict
- Error body: `{ "code": "STRING_CODE", "message": "human readable" }`
- Mock auth: every `/orders/**` endpoint requires header `X-User-Id: <employee-id>` — read with `@RequestHeader`
- Admin endpoints (`/menu/items` POST) require header `X-Admin: true` — fail with 403 otherwise

## Validation

- Use `jakarta.validation` annotations on request DTOs
- Reject invalid payloads with 400 + structured error
- `@Valid` on controller method args

## Testing approach

- Each feature gets at least one `@WebMvcTest` (controller layer) and one service-level test
- Use `@DataJpaTest` for repository tests
- Avoid `@SpringBootTest` except for the existing `contextLoads()` smoke test — it's slow

## Decisions worth noting

- **No DTOs** for v1. The entity is the API. We're optimising for workshop speed, not production hygiene. Stories can refactor toward DTOs if there's time.
- **H2** is fine for the workshop. Replacing with PostgreSQL would require zero code changes and one dependency swap.
- **UUIDs everywhere** for ids. Avoids sequence guessing and matches CLAUDE.md conventions for the broader migration.

## What this doc deliberately doesn't decide

- Caching, rate limiting, observability beyond `/actuator/health` — defer to v2
- OpenAPI spec generation — leave as a stretch goal
- Database migrations (Flyway/Liquibase) — H2 `ddl-auto: update` is the workshop's lifecycle manager
