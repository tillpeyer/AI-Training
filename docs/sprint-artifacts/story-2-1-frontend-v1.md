# Story 2.1 — Full v1 frontend (React + Vite + TypeScript SPA)

| Field | Value |
|---|---|
| **Epic** | 2 (Frontend v1 — browser client for the Lunch Order API) |
| **Story ID** | 2.1 |
| **Status** | ready-for-dev |
| **Estimate** | 8 CP *(1 CP = 1 developer-day incl. unit tests)* — large; SM may split into 3–4 sub-stories per view |
| **Priority** | Must (kicks off Epic 2) |
| **Security** | ELCA (workshop repo — no Jira integration; see Deviations below) |
| **Depends on** | Stories 1.1–1.5 (backend v1 must be running), Story 1.2.2 (admin toggle) optional but useful |
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

- [ ] **AC 2.1.1** — `frontend/` directory scaffolded at repo root via `npm create vite@latest frontend -- --template react-ts` (defaults accepted).
- [ ] **AC 2.1.2** — `cd frontend && npm install && npm run dev` boots the Vite dev server on port **5173** with zero errors.
- [ ] **AC 2.1.3** — **Menu view (`/`)** lists today's menu from `GET /api/v1/menu`; each item displays `name`, `priceChf` formatted as CHF, and an "available" indicator.
- [ ] **AC 2.1.4** — **Order form** (on `/`) lets the user pick a menu item and quantity (1–10) and submits via `POST /api/v1/orders` with the `X-User-Id` header.
- [ ] **AC 2.1.5** — **My orders view (`/orders`)** lists the caller's orders from `GET /api/v1/orders/me`, sorted newest first, showing item name, quantity, status, and a "Cancel" button next to each `SUBMITTED` order.
- [ ] **AC 2.1.6** — **Cancel action** on the my-orders view calls `PATCH /api/v1/orders/{id}/cancel`, refreshes the list, and shows a brief confirmation on success.
- [ ] **AC 2.1.7** — **Admin add-item view (`/admin`)** provides a form for `name` + `priceChf` and POSTs to `POST /api/v1/menu/items` with `X-Admin: true`.
- [ ] **AC 2.1.8** — **Identity handling**: `X-User-Id` is read from a "Sign in as" input persisted to `localStorage`; `X-Admin: true` is sent automatically **only** for requests fired from the `/admin` route.
- [ ] **AC 2.1.9** — **Error display**: when the backend returns `{"code":"...","message":"..."}`, the UI renders `message` (not `code`); no non-2xx response is silently swallowed.
- [ ] **AC 2.1.10** — **Design captured**: `frontend/DESIGN.md` (one page) summarises the agreed wireframes and design decisions before code is written.

## Design Constraints

- **Decoupled from backend:** no changes to `pom.xml`, Java sources, or `application.properties`. The frontend is a pure API consumer.
- **CORS is already handled** by `ch.elca.training.lunch.common.WebConfig` (allows `http://localhost:5173`). A Vite proxy in `vite.config.ts` is optional but not required.
- **State management:** `useState` + `useEffect` for fetches. Do **not** introduce Redux / Zustand / TanStack Query unless a concrete need appears in the design step.
- **HTTP:** the native `fetch` API. Do **not** add Axios.
- **Routing:** `react-router-dom`, exactly three routes (`/`, `/orders`, `/admin`).
- **Styling:** pick one of vanilla CSS, Tailwind, or a small component library (e.g. shadcn/ui via Radix). Whatever falls out of the design step. Do **not** mix multiple styling systems.
- **Design first:** capture the layout and component breakdown in `frontend/DESIGN.md` **before** writing any component code.

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

- **No Jira ticket / no `Analyzed` transition** — the workshop repo does not use Jira. Sprint state lives implicitly in this file's `Status` field.
- **No `sprint-status.yaml`** — orphan artefact without a Jira board; not bootstrapped for this story.
- **No `tech-spec-epic-2.md`** — the repo has a single flat `docs/tech-spec.md` covering the backend; the frontend is API-consuming only, no separate epic spec required.
- **`main` as base branch** — workshop uses trunk-based flow, not the `develop` branch ELCAi CI/CD guides assume.
- **SonarQube guardrails not applicable** — this is a TypeScript/React project; ESLint is the closest analog and is already required in the DoD.

## Sub-story suggestion (if the SM decides to split)

If 8 CP is too much for a single dev cycle, split into four sub-stories:

- **Story 2.1.a — Scaffold + Menu view** (2 CP) — AC 2.1.1, 2.1.2, 2.1.3, plus `DESIGN.md` (AC 2.1.10)
- **Story 2.1.b — Order form + My orders view** (2 CP) — AC 2.1.4, 2.1.5, 2.1.6
- **Story 2.1.c — Admin view + identity** (2 CP) — AC 2.1.7, 2.1.8
- **Story 2.1.d — Error handling + polish + tests** (2 CP) — AC 2.1.9, component test, lint pass, build pass
