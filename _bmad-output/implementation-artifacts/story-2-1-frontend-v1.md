---
baseline_commit: ff848b0a3893cd8ed903688c780bc8032813cffe
---

# Story 2.1 — Full v1 frontend (React + Vite + TypeScript SPA)

| Field | Value |
|---|---|
| **Epic** | 2 (Frontend v1 — browser client for the Lunch Order API) |
| **Story ID** | 2.1 |
| **Status** | done |
| **Estimate** | 8 CP *(1 CP = 1 developer-day incl. unit tests)* — large; SM may split into 3–4 sub-stories per view |
| **Priority** | Must (kicks off Epic 2) |
| **Security** | ELCA (workshop repo — no Jira integration; see Deviations below) |
| **Depends on** | Stories 1.1–1.5 (backend v1 must be running); story 2.7 (`GET /api/v1/menu/{id}`, already on `main`) is required by AC 2.1.5 |
| **Base branch** | `main` |

## Problem Statement

Epic 1 shipped a headless HTTP API — usable but not shippable to end users. Employees ordering lunch and admins editing the menu need a browser interface that consumes the existing endpoints without any backend changes. This story delivers a minimal single-page application covering the five backend surfaces already in production (list menu, submit order, list my orders, cancel order, add menu item), with mock-auth identity handled via `X-User-Id` and `X-Admin` headers exactly as the API expects.

## Ubiquitous Language

| Term | Definition |
|---|---|
| **SPA** | Single-Page Application — one HTML bundle served by Vite dev server (5173) in dev, static files in production. |
| **View / Route** | A React component mapped to a URL path via `react-router-dom`. This story has three: `/`, `/orders`, `/admin`. |
| **Identity header** | `X-User-Id: <employee-id>` — read by the frontend from a "Sign in as" input persisted in `localStorage`. |
| **Admin header** | `X-Admin: true` — sent only for requests originating from the `/admin` route. |
| **Design doc** | `frontend/DESIGN.md` — a one-page summary of wireframes and design decisions, agreed **before** implementation. |

## Acceptance Criteria

> **⚠️ Execution order — do AC 2.1.10 first.** The design step is a prerequisite for every other AC: AC 2.1.1 through AC 2.1.9 are refinements of the design captured in `DESIGN.md`. Numeric IDs are kept stable (they are referenced by `story-2-1-frontend-v1.context.xml`) but the *execution order* starts with 2.1.10, not 2.1.1.

- [x] **AC 2.1.1** — `frontend/` directory scaffolded at repo root via `npm create vite@latest frontend -- --template react-ts` (defaults accepted).
- [x] **AC 2.1.2** — `cd frontend && npm install && npm run dev` boots the Vite dev server on port **5173** with zero errors.
- [x] **AC 2.1.3** — **Menu view (`/`)** lists today's menu from `GET /api/v1/menu`; each item displays `name` and `priceChf` formatted as CHF.
  > **No availability indicator in v1.** `MenuService.listAvailable()` calls `findAllByAvailableTrue()`, so this endpoint returns *only* available items — an indicator driven off `item.available` would read "available" 100% of the time. Do not build UI for a state the API cannot return. Surfacing unavailable items would need a backend change, which this story forbids.
- [x] **AC 2.1.4** — **Order form** (on `/`) lets the user pick a menu item and quantity (1–10) and submits via `POST /api/v1/orders` with the `X-User-Id` header.
- [x] **AC 2.1.5** — **My orders view (`/orders`)** lists the caller's orders from `GET /api/v1/orders/me`, sorted newest first, showing item name, quantity, status, and a "Cancel" button next to each `SUBMITTED` order.
  > **The item name needs resolving.** `Order` carries `menuItemId`, not a name, and `GET /api/v1/menu` lists available items only — so joining against that list leaves an order for a since-unavailable item nameless. Resolve each order's name via **`GET /api/v1/menu/{id}`** (story 2.7's endpoint; returns the item regardless of availability), one request per distinct `menuItemId`. Cache per id so a list of N orders over M distinct items costs M requests, not N.
- [x] **AC 2.1.6** — **Cancel action** on the my-orders view calls `PATCH /api/v1/orders/{id}/cancel`, refreshes the list, and shows a brief confirmation on success.
- [x] **AC 2.1.7** — **Admin add-item view (`/admin`)** provides a form for `name` + `priceChf` and POSTs to `POST /api/v1/menu/items` with `X-Admin: true`.
- [x] **AC 2.1.8** — **Identity handling**: `X-User-Id` is read from a "Sign in as" input persisted to `localStorage`; `X-Admin: true` is sent automatically **only** for requests fired from the `/admin` route.
- [x] **AC 2.1.9** — **Error display**: when the backend returns `{"code":"...","message":"..."}`, the UI renders `message` (not `code`); no non-2xx response is silently swallowed.
- [x] **AC 2.1.10** — **Design captured**: `frontend/DESIGN.md` (one page) summarises the agreed wireframes and design decisions before code is written. The design step is performed with the **`bmad-ux`** skill ("create UX specifications"); the participant iterates on the skill's proposals until agreement, then commits the outcome to `DESIGN.md`.

## Design Constraints

- **Decoupled from backend:** no changes to `pom.xml`, Java sources, or `application.properties`. The frontend is a pure API consumer.
- **CORS is already handled** by `ch.elca.training.lunch.common.WebConfig` (allows `http://localhost:5173`). A Vite proxy in `vite.config.ts` is optional but not required.
- **State management:** `useState` + `useEffect` for fetches. Do **not** introduce Redux / Zustand / TanStack Query unless a concrete need appears in the design step.
- **HTTP:** the native `fetch` API. Do **not** add Axios.
- **Routing:** `react-router-dom`, exactly three routes (`/`, `/orders`, `/admin`).
- **Styling:** pick one of vanilla CSS, Tailwind, or a small component library (e.g. shadcn/ui via Radix). Whatever falls out of the design step. Do **not** mix multiple styling systems.
- **Design first:** capture the layout and component breakdown in `frontend/DESIGN.md` **before** writing any component code.
- **Design tool:** the design step uses the **`bmad-ux`** skill (invoke with "create UX specifications" or "help me plan the UX"). It proposes layout + component structure; the participant iterates and captures the agreed outcome in `DESIGN.md`. Do **not** hand-draft the design without invoking the skill first — the point of the exercise is that the design step is agent-driven and reviewable, not just the code.
- **Optional, for the implementation phase only:** Anthropic ships a **`frontend-design`** skill (official `claude-plugins-official` marketplace, not installed by default — `/plugin install frontend-design@claude-plugins-official`). It generates polished component code with a committed aesthetic direction. It is **not** a substitute for `bmad-ux` in AC 2.1.10: it produces code, not a wireframe spec, so it belongs to AC 2.1.3 – 2.1.9, after `DESIGN.md` is agreed. Its house style is deliberately bold ("avoid generic AI aesthetics"), which may overshoot an internal CRUD tool — if you use it, say so in the PR and keep the ACs, not the aesthetics, as the acceptance bar.

## Artefacts to Reuse

| Backend endpoint | Purpose in frontend | AC(s) |
|---|---|---|
| `GET /api/v1/menu` | Menu view | 2.1.3 |
| `POST /api/v1/orders` (`X-User-Id`) | Order form submission | 2.1.4 |
| `GET /api/v1/orders/me` (`X-User-Id`) | My orders view | 2.1.5 |
| `PATCH /api/v1/orders/{id}/cancel` (`X-User-Id`) | Cancel action | 2.1.6 |
| `POST /api/v1/menu/items` (`X-Admin: true`) | Admin add-item form | 2.1.7 |
| `WebConfig.addCorsMappings` (already permits 5173) | Enables browser calls without proxy | 2.1.2 |

## Artefacts to Create

| Path | Purpose |
|---|---|
| `frontend/` | Vite scaffold root |
| `frontend/DESIGN.md` | One-page wireframes + design decisions |
| `frontend/src/App.tsx`, `frontend/src/main.tsx` | App shell + router setup |
| `frontend/src/routes/MenuPage.tsx` | View for `/` (menu + order form) |
| `frontend/src/routes/MyOrdersPage.tsx` | View for `/orders` |
| `frontend/src/routes/AdminPage.tsx` | View for `/admin` |
| `frontend/src/api/*.ts` | Thin `fetch` wrappers per endpoint |
| `frontend/src/auth/identity.ts` | `X-User-Id` / `X-Admin` header handling + `localStorage` |
| `frontend/src/components/ErrorBanner.tsx` (or equivalent) | Shows `ApiError.message` for non-2xx responses |
| `frontend/src/**/*.test.tsx` | ≥1 Vitest + `@testing-library/react` component test |

## Test Scaffolding

| Layer | Framework | Coverage target |
|---|---|---|
| Component | Vitest + `@testing-library/react` | ≥1 test on the happy path of one view (menu list rendering is the easiest starting point) |
| Lint | ESLint (Vite `react-ts` template ships this) | `npm run lint` passes on all committed code |
| Build | Vite | `npm run build` produces a production bundle without errors |
| Manual smoke | Human, in-browser | Boot Spring Boot + Vite dev server simultaneously; walk through all 10 ACs; screenshot for PR |

## Definition of Done

- [x] All ACs (2.1.1 – 2.1.10) ticked
- [x] PR description references the `bmad-ux` skill session that produced `DESIGN.md` (name the skill, and paste one representative excerpt or screenshot — makes the tool-use reviewable, not just the artefact)
- [x] `cd frontend && npm run build` succeeds (production bundle generates without errors)
- [x] `cd frontend && npm run lint` passes (template ships **oxlint**, not ESLint, as of this Vite version — same intent, no rules disabled)
- [x] ≥1 Vitest + `@testing-library/react` component test passes
- [x] Manual smoke: backend + Vite dev server up simultaneously, all five sub-features walked through and re-verified after code review (status-pill + auto-dismiss)
- [ ] Screenshots attached to the PR — **not done**: `gh` CLI has no path to upload binary images to a PR (gist/API both rejected binary content); screenshots exist locally at `.playwright-mcp/smoke-*.png` (gitignored) for whoever has browser access to drag into the PR
- [x] `frontend/DESIGN.md` exists and reflects the agreed wireframes
- [x] No changes to `pom.xml`, backend Java sources, or `application.properties`
- [x] `.gitignore` already covers `node_modules/`, `dist/`, `*.local`; added `.playwright-mcp/` (Playwright MCP screenshot output from the manual smoke test, not a frontend build artifact the story anticipated)
- [x] PR opened against `main` — https://github.com/tillpeyer/AI-Training/pull/28 (screenshots not attached — see note above)
- [x] `story-2-1-frontend-v1.context.xml` companion file exists and is referenced from this story

## Dev Agent Record

### Completion Notes

- Design step (AC 2.1.10) ran fast-path via `bmad-ux`: vanilla CSS, single-column layout, minimal neutral palette, marked `[ASSUMPTION]` for aesthetic choices not dictated by the story. User confirmed no changes needed; result committed to `frontend/DESIGN.md`.
- `frontend/` scaffolded via `npm create vite@latest frontend -- --template react-ts`. The Vite `react-ts` template as currently published ships **oxlint**, not ESLint (`npm run lint` → `oxlint`) — DoD/Test Scaffolding intent (lint passes, no rules disabled) preserved with the actual shipped tool.
- `react-router-dom@latest` (7.18.2) has one open high-severity advisory (RSC-mode CSRF bypass, GHSA-qwww-vcr4-c8h2) that does not apply here — this is a plain client-side SPA with no RSC/server-actions usage. Attempted `npm audit fix --force` to downgrade to 7.11.0: that version sits in a much larger vulnerable range (6.0.0–7.17.0, multiple XSS/open-redirect/RCE advisories) — reverted to latest as the safer choice. No clean version currently exists on the registry. Raw `npm audit` output for both states, for reproducibility:
  ```
  # react-router-dom@latest (7.18.2) — kept
  react-router  7.12.0 - 8.2.0
  Severity: high
  React Router: RSC Mode CSRF Bypass Allows Action Execution Before 400 Response - https://github.com/advisories/GHSA-qwww-vcr4-c8h2

  # react-router-dom@7.11.0 — attempted, rejected
  react-router  6.0.0 - 7.17.0
  Severity: high
  (14 advisories: XSS via open redirects, SSR XSS, arbitrary constructor invocation/RCE via turbo-stream,
   CSRF, DoS, stored XSS via Location header, ...)
  ```
- Fixed a real caching bug during `MyOrdersPage` implementation: the item-name resolution cache (AC 2.1.5) was read from a `useState` closure inside an empty-deps `useCallback`, so it never actually reused cached names across reloads (e.g. after Cancel) — every reload re-fetched every distinct `menuItemId`. Moved the cache into a `useRef` so `loadOrders` always reads the latest cache; added `MyOrdersPage.test.tsx` asserting `fetchMenuItem` is called exactly once across two orders sharing a `menuItemId` **and** after a cancel-triggered reload (added during code review — see Review Findings below).
- Manual smoke test (Playwright, backend on JDK 21 + Vite dev server both running locally) walked all 10 ACs against the real backend, not mocks: menu list with real seed data, order submission, my-orders listing with name resolution, cancel + confirmation, admin add-item (item appeared in the menu list afterwards), and a real 400 from the backend (quantity 11, browser's native `max` attribute bypassed via `page.evaluate` to actually exercise the app's error-handling code path) rendering `message` (not `code`) in the error banner. Screenshots in `.playwright-mcp/smoke-*.png` (gitignored; not attached to this file — reference for the PR description).
- Backend regression suite (`./mvnw test`) re-run at the end: 0 failures, confirming the frontend-only change made no backend regressions (none were possible — no backend files touched).
- Ran `bmad-testarch-trace` (Murat) before code review: gate decision **CONCERNS**, no blockers — see `_bmad-output/test-artifacts/traceability-matrix.md`.
- Ran `bmad-code-review`: 3 parallel adversarial layers (Blind Hunter, Edge Case Hunter, Acceptance Auditor) against the diff vs `main`. 10 `patch` findings applied, 7 `defer`, 4 `dismiss` (noise/already-handled). Details in Review Findings below.

### File List

**Created:**
- `frontend/` (Vite `react-ts` scaffold: `index.html`, `package.json`, `package-lock.json`, `tsconfig*.json`, `vite.config.ts`, `public/favicon.svg`, `.gitignore`, `.oxlintrc.json`, `README.md`)
- `frontend/DESIGN.md`
- `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/index.css`, `frontend/src/test-setup.ts`
- `frontend/src/auth/identity.ts`, `frontend/src/auth/identity.test.ts`
- `frontend/src/api/http.ts`, `frontend/src/api/http.test.ts`, `frontend/src/api/menu.ts`, `frontend/src/api/orders.ts`
- `frontend/src/components/Layout.tsx`, `frontend/src/components/ErrorBanner.tsx`
- `frontend/src/hooks/useAutoDismiss.ts` (added during code review — shared 3s auto-dismiss for confirmation banners)
- `frontend/src/routes/MenuPage.tsx`, `frontend/src/routes/MenuPage.test.tsx`, `frontend/src/routes/MyOrdersPage.tsx`, `frontend/src/routes/MyOrdersPage.test.tsx` (added during code review), `frontend/src/routes/AdminPage.tsx`
- `_bmad-output/test-artifacts/traceability-matrix.md` (Murat's trace/gate output)

**Deleted (unused default Vite template assets):**
- `frontend/src/App.css`, `frontend/src/assets/react.svg`, `frontend/src/assets/vite.svg`, `frontend/src/assets/hero.png`, `frontend/public/icons.svg`

**Modified:**
- `frontend/vite.config.ts` (added Vitest `test` config block)
- `frontend/package.json` (added `test` script, `react-router-dom` + Vitest/RTL dependencies)
- `frontend/src/api/http.ts` (code review: catch `fetch()` rejection → friendly `ApiRequestError` instead of an uncaught `TypeError`)
- `frontend/src/auth/identity.ts` (code review: strip `\r\n` from a pasted user id before it reaches a header value)
- `frontend/src/components/Layout.tsx` (code review: nav spacing uses `var(--spacing-*)` tokens instead of hardcoded pixels)
- `frontend/src/routes/MyOrdersPage.tsx` (code review: `Promise.allSettled` instead of `Promise.all` for name resolution; status pill styling; auto-dismiss confirmation)
- `frontend/src/routes/MenuPage.tsx`, `frontend/src/routes/AdminPage.tsx` (code review: auto-dismiss confirmation)
- `frontend/src/index.css` (code review: `.status-submitted`/`.status-cancelled` classes per `DESIGN.md`)
- `.gitignore` (added `.playwright-mcp/` — Playwright MCP screenshot output, not a frontend build artifact)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (`2-1-frontend-v1`: ready-for-dev → in-progress → review)
- `_bmad-output/implementation-artifacts/story-2-1-frontend-v1.md` (this file)
- `_bmad-output/implementation-artifacts/story-2-1-frontend-v1.context.xml` (code review: stale `<status>ready-for-dev</status>` → `review`)

### Review Findings

*(from `bmad-code-review`, diff = branch `feature/story-2-1-frontend-v1` vs `main`, spec = this file)*

- [x] [Review][Patch] `apiFetch` didn't catch a raw `fetch()` rejection (network down) — bypassed the uniform `ApiRequestError` message [frontend/src/api/http.ts:6]
- [x] [Review][Patch] "Sign in as" input accepted `\r\n`, which throws synchronously when used as a header value [frontend/src/auth/identity.ts:7]
- [x] [Review][Patch] Confirmation banners never auto-dismissed, contradicting AC 2.1.6 ("brief") and `DESIGN.md`'s own "~3s" commitment [frontend/src/routes/MenuPage.tsx, MyOrdersPage.tsx, AdminPage.tsx]
- [x] [Review][Patch] `MyOrdersPage` name-resolution used `Promise.all` — one failed lookup discarded names resolved in the same batch [frontend/src/routes/MyOrdersPage.tsx:24]
- [x] [Review][Patch] `MyOrdersPage`'s cache fix (`useRef`) shipped with no regression test [frontend/src/routes/MyOrdersPage.tsx] — added `MyOrdersPage.test.tsx`
- [x] [Review][Patch] `DESIGN.md`'s status-pill spec (muted + strikethrough for `CANCELLED`) was never implemented [frontend/src/routes/MyOrdersPage.tsx:66]
- [x] [Review][Patch] Nav bar hardcoded pixel spacing instead of the design tokens every other component uses [frontend/src/components/Layout.tsx:15]
- [x] [Review][Patch] `story-2-1-frontend-v1.context.xml`'s `<status>` was stale (`ready-for-dev`) relative to this file and `sprint-status.yaml` (`review`) [story-2-1-frontend-v1.context.xml:13]
- [x] [Review][Patch] Dev Agent Record's File List omitted `.gitignore`, `.oxlintrc.json`, `README.md` as created files
- [x] [Review][Patch] `react-router-dom` security rationale was asserted without reproducible evidence — added raw `npm audit` output above
- [x] [Review][Defer] `API_BASE_URL` hardcoded to `http://localhost:8080`, no env-var indirection [frontend/src/api/http.ts:1] — deferred, no env-config pattern exists anywhere else in this workshop repo; single local deployment target, YAGNI
- [x] [Review][Defer] No error boundary / runtime validation of API response shapes [frontend/src/routes/*.tsx] — deferred, matches this whole repo's existing "entity = API, no validation layer" convention (tech-spec.md), not a gap introduced by this story
- [x] [Review][Defer] Rapid double-click can fire duplicate submit/cancel requests [MenuPage.tsx, MyOrdersPage.tsx] — deferred, low-impact for an internal tool, no AC requires debouncing
- [x] [Review][Defer] No empty-state messaging when a list is empty [MenuPage.tsx, MyOrdersPage.tsx] — deferred, cosmetic, not required by any AC or `DESIGN.md`
- [x] [Review][Defer] No catch-all/404 route [App.tsx] — deferred, cosmetic, the routing constraint only mandates the 3 named routes
- [x] [Review][Defer] `localStorage.setItem` can throw in restrictive browser contexts (private browsing, quota) [identity.ts:8] — deferred, edge case for an internal corporate tool on standard browsers
- [x] [Review][Defer] `/admin` route's "admin gate" is header-only, no real access control [App.tsx, AdminPage.tsx] — deferred, this is the story's explicit design ("mock-auth identity handled via `X-User-Id`/`X-Admin` headers exactly as the API expects," Problem Statement) and matches the backend's own auth model; not a gap this story introduced

Dismissed as noise (4): "no lockfile in diff" (present, just excluded from the reviewed diff file to cut noise), "dependency versions unverifiable" (installed and verified live via `npm list` during this session), "quantity `NaN` → `null` sent to backend" and "negative price sent to backend" (both already handled end-to-end: the number inputs can't produce `NaN` in practice, and any out-of-range value the backend does receive is already rejected with a proper `ApiError` that the existing error-banner pipeline displays correctly — verified live in the manual smoke test).

### Change Log

- Locked story via `bmad-create-story` validation pass; fixed one stale reference (`WebConfig.corsConfigurer` → `WebConfig.addCorsMappings`).
- Design step via `bmad-ux` (fast path) → `frontend/DESIGN.md`.
- Scaffolded `frontend/`, implemented identity, API wrappers, all three routes, error banner, routing shell.
- Added Vitest + React Testing Library; unit/component tests, all passing.
- Manual smoke-tested all 10 ACs against the real backend via Playwright; fixed one real bug found in the process (stale-closure cache in `MyOrdersPage`).
- `npm run build` and `npm run lint` both pass; full backend regression suite re-run clean.
- Ran `bmad-testarch-trace` (gate: CONCERNS, no blockers) and `bmad-code-review` (3 parallel adversarial layers); applied all 10 `patch` findings — network-error handling, header sanitization, auto-dismiss confirmations, `Promise.allSettled` + regression test for the cache fix, status-pill styling, design-token consistency, stale `context.xml` status, File List completeness, `npm audit` evidence.

## Deviations from ELCAi (accepted for the workshop repo)

- **No Jira ticket / no `Analyzed` transition** — the workshop repo does not use Jira.
- **Sprint state is tracked in two places** — `_bmad-output/implementation-artifacts/sprint-status.yaml` (which does list `2-1-frontend-v1`) and this file's `Status` field. Keep them in step; the yaml is what the SM and Dev skills read.
- **No `tech-spec-epic-2.md`** — the repo has a single flat `docs/tech-spec.md` covering the backend; the frontend is API-consuming only, no separate epic spec required.
- **`main` as base branch** — workshop uses trunk-based flow, not the `develop` branch ELCAi CI/CD guides assume.
- **SonarQube guardrails not applicable** — this is a TypeScript/React project; ESLint is the closest analog and is already required in the DoD.

## Sub-story suggestion (if the SM decides to split)

If 8 CP is too much for a single dev cycle, split into four sub-stories:

- **Story 2.1.a — Scaffold + Menu view** (2 CP) — AC 2.1.1, 2.1.2, 2.1.3, plus `DESIGN.md` (AC 2.1.10)
- **Story 2.1.b — Order form + My orders view** (2 CP) — AC 2.1.4, 2.1.5, 2.1.6
- **Story 2.1.c — Admin view + identity** (2 CP) — AC 2.1.7, 2.1.8
- **Story 2.1.d — Error handling + polish + tests** (2 CP) — AC 2.1.9, component test, lint pass, build pass
