# Project Context — AI-Training (Lunch Order API)

Rules an AI agent must follow when writing code here. These are the **unobvious** ones — the traps, not the tutorial. Full reasoning: `_bmad-output/planning-artifacts/architecture.md`. Binding contract: `_bmad-output/planning-artifacts/architecture/ARCHITECTURE-SPINE.md`.

## Hard boundaries

- **Do not touch `pom.xml`.** No new dependencies, no version bumps. Spring Boot 3.5.0 and Java 21 are frozen even though 3.5's OSS support ended 2026-06-30.
- **Stay inside the story's acceptance criteria.** No improving surrounding code, no preemptive refactors, no fixing something you noticed. Record it instead.
- **One story per branch.** Branch `feature/STORY-<n>-<slug>`, commit `STORY-<n>: <description>`, PR against `main`. Never merge a PR yourself.
- **No response DTOs.** Entities serialize directly. Requests *do* get dedicated validated records — the asymmetry is intentional, do not "fix" either side.
- **The frontend is Angular in `frontend-angular/`**, not React in `frontend/`. Story 2.1's AC 2.1.1–2.1.2 still say Vite + React; they are stale.

## Backend rules

**Admin check is the controller method's first statement, exact-match on the string.**

```java
if (!"true".equals(adminHeader)) { throw new NotAdminException(); }
```

`null`, `"false"` and `"TRUE"` must all fail closed. Never put an admin check in a service — services do not know about admin status. There is no Spring Security.

**Check order in any id-resolving mutation: authorization → existence (404) → ownership (403) → state (409).** Ownership must never precede existence, or a 403 confirms another user's record exists. `OrderService.cancel` is the reference.

**An unavailable `MenuItem` is `404 MENU_ITEM_NOT_FOUND`.** Never invent `MENU_ITEM_UNAVAILABLE`. `GET /menu` filters to available items; `OrderService.submit` throws `MenuItemNotFoundException` when `isAvailable()` is false.

**`GET /api/v1/menu/{id}` is the only read that ignores `available`.** It is how a client resolves the name behind an `Order.menuItemId`. Do not resolve names from `GET /menu` — an order for a since-unavailable item would come back nameless.

**Every new failure mode ships its `@ExceptionHandler` in the same change.** All non-2xx bodies are `ApiError(code, message)`. If Spring's default `timestamp/status/error/path` shape can reach a client, the change is incomplete.

**Never pass a framework exception's `getMessage()` to `ApiError`.** Jackson internals, FQCNs, and caller-supplied values must not reach a field the UI renders. Domain exception messages are authored for display and may pass through.

**Do not attempt to make 403 precede 400.** `@Valid` fires before the method body, so an invalid body plus a bad admin header returns 400. Known, documented in `MenuController`, accepted. Fixing it needs a `HandlerInterceptor` and is out of scope.

**Conventions:** `UUID` ids (`GenerationType.UUID`). `BigDecimal` for money, never `double`; compare with `compareTo`, never `equals`. `Instant` + `@CreationTimestamp`. Enums `EnumType.STRING`. The order table is `orders` — `ORDER` is a SQL reserved word. `menuItemId` is a plain `UUID` column, deliberately **not** a `@ManyToOne`.

**Do not change `MenuSeedData`'s unavailable item.** *Soupe du jour* is seeded `available = false` on purpose — it is the only fixture that makes the availability behaviour observable by hand.

## Frontend rules

- **`X-Admin` comes from the router URL, never from stored state.** The interceptor adds it only when the URL is under `/admin`. No component sets identity headers itself.
- **Reads use `httpResource`; mutations use `HttpClient` on `LunchApi`.** After a successful mutation call `reload()` — never patch a local copy of server state.
- **Render `ApiError.message`, never `ApiError.code`.** `apiErrorMessage()` is the only place an `HttpErrorResponse` becomes text. No non-2xx may be silently swallowed.
- **Do not re-sort `/orders/me`.** The server returns newest-first. A client-side sort is a second mechanism that drifts.
- **Port 5173 is load-bearing.** `WebConfig` allows exactly one CORS origin, `http://localhost:5173`. Change one port and you must change both, or every request fails with an opaque CORS error.
- Standalone components, `OnPush`, `inject()` over constructor injection, `input()` over `@Input()`, native `@if`/`@for`, selector prefix `lunch-`. Signals for state — no RxJS subjects for view state.

## Tests

`@WebMvcTest` for controllers, `@DataJpaTest` for repositories, plain unit tests with mocks for services. **Reserve `@SpringBootTest` for the one existing `contextLoads()` smoke test** — it is slow. Frontend: `vitest` + `jsdom`, one `.spec.ts` beside each route component.

## Environment

- **Windows / PowerShell.** Maven is `.\mvnw`, not `./mvnw` or `mvn`.
- **BMAD scripts need `uv run --python 3.12 <script>`.** The default `python3` is 3.9 and lacks `tomllib`, so `resolve_customization.py` and `memlog.py` fail without that flag.
- **Do not commit `.claude/`, `_bmad/`, or `.mcp.json`** except the paths allowlisted in `.gitignore`. See `CLAUDE.md`.

## Known gaps — record, do not fix

Outside every current story's AC:

- `Order.quantity` is an unconstrained `int`; `@Min(1) @Max(10)` lives only on `CreateOrderRequest`.
- `priceChf` scale is unenforced — no `@Digits`, no `setScale` on write.
- Validation codes are keyed by field *name* in one global switch, so two features sharing a field name share a code, and only the first invalid field of a request is reported.
- `menu` and `order` packages depend on each other (repository-to-repository, both directions). Consistent, but a real cycle.
- No availability-toggle endpoint exists, even though `MenuItemHasOrdersException` tells admins to use one. Story 2.2 owns it.
