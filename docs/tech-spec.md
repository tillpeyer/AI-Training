# Tech Spec — Lunch Order API

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
