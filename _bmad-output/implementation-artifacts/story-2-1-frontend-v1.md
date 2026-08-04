# Story 2.1 — Full v1 frontend (React + Vite + TypeScript SPA)

| Field | Value |
|---|---|
| **Epic** | 2 (Frontend v1 — browser client for the Lunch Order API) |
| **Story ID** | 2.1 |
| **Status** | ready-for-dev |
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

- [ ] **AC 2.1.1** — `frontend/` directory scaffolded at repo root via `npm create vite@latest frontend -- --template react-ts` (defaults accepted).
- [ ] **AC 2.1.2** — `cd frontend && npm install && npm run dev` boots the Vite dev server on port **5173** with zero errors.
- [ ] **AC 2.1.3** — **Menu view (`/`)** lists today's menu from `GET /api/v1/menu`; each item displays `name` and `priceChf` formatted as CHF.
  > **No availability indicator in v1.** `MenuService.listAvailable()` calls `findAllByAvailableTrue()`, so this endpoint returns *only* available items — an indicator driven off `item.available` would read "available" 100% of the time. Do not build UI for a state the API cannot return. Surfacing unavailable items would need a backend change, which this story forbids.
- [ ] **AC 2.1.4** — **Order form** (on `/`) lets the user pick a menu item and quantity (1–10) and submits via `POST /api/v1/orders` with the `X-User-Id` header.
- [ ] **AC 2.1.5** — **My orders view (`/orders`)** lists the caller's orders from `GET /api/v1/orders/me`, sorted newest first, showing item name, quantity, status, and a "Cancel" button next to each `SUBMITTED` order.
  > **The item name needs resolving.** `Order` carries `menuItemId`, not a name, and `GET /api/v1/menu` lists available items only — so joining against that list leaves an order for a since-unavailable item nameless. Resolve each order's name via **`GET /api/v1/menu/{id}`** (story 2.7's endpoint; returns the item regardless of availability), one request per distinct `menuItemId`. Cache per id so a list of N orders over M distinct items costs M requests, not N.
- [ ] **AC 2.1.6** — **Cancel action** on the my-orders view calls `PATCH /api/v1/orders/{id}/cancel`, refreshes the list, and shows a brief confirmation on success.
- [ ] **AC 2.1.7** — **Admin add-item view (`/admin`)** provides a form for `name` + `priceChf` and POSTs to `POST /api/v1/menu/items` with `X-Admin: true`.
- [ ] **AC 2.1.8** — **Identity handling**: `X-User-Id` is read from a "Sign in as" input persisted to `localStorage`; `X-Admin: true` is sent automatically **only** for requests fired from the `/admin` route.
- [ ] **AC 2.1.9** — **Error display**: when the backend returns `{"code":"...","message":"..."}`, the UI renders `message` (not `code`); no non-2xx response is silently swallowed.
- [ ] **AC 2.1.10** — **Design captured**: `frontend/DESIGN.md` (one page) summarises the agreed wireframes and design decisions before code is written. The design step is performed with the **`bmad-ux`** skill ("create UX specifications"); the participant iterates on the skill's proposals until agreement, then commits the outcome to `DESIGN.md`.

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
| `WebConfig.corsConfigurer` (already permits 5173) | Enables browser calls without proxy | 2.1.2 |

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

- [ ] All ACs (2.1.1 – 2.1.10) ticked
- [ ] PR description references the `bmad-ux` skill session that produced `DESIGN.md` (name the skill, and paste one representative excerpt or screenshot — makes the tool-use reviewable, not just the artefact)
- [ ] `cd frontend && npm run build` succeeds (production bundle generates without errors)
- [ ] `cd frontend && npm run lint` passes (Vite `react-ts` template ESLint config, no rules disabled)
- [ ] ≥1 Vitest + `@testing-library/react` component test passes
- [ ] Manual smoke: backend + Vite dev server up simultaneously, all five sub-features walked through, screenshots attached to the PR
- [ ] `frontend/DESIGN.md` exists and reflects the agreed wireframes
- [ ] No changes to `pom.xml`, backend Java sources, or `application.properties`
- [ ] `.gitignore` already covers `node_modules/`, `dist/`, `*.local` (no changes needed)
- [ ] PR opened against `main` with screenshots attached
- [ ] `story-2-1-frontend-v1.context.xml` companion file exists and is referenced from this story

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
