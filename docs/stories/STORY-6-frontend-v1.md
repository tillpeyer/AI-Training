# Story 6 — Full v1 frontend

**Status:** Draft (ready for SM to lock)
**Estimate:** 8 points (5 sub-features in one story — your participant may choose to split)
**Priority:** Must (kicks off Epic 2)
**Depends on:** Stories 1–5 (the v1 backend must be running)

## Context

Epic 1 shipped a headless API. Epic 2 brings a browser to it. Build a small React + Vite + TypeScript SPA that lets a user do everything the v1 backend supports — view today's menu, place an order, see and cancel their own orders, and (as admin) add a new menu item. Agree the design before writing code.

PRD section: *Out of scope (v1 explicitly excluded "Frontend") — this story opens Epic 2 to address that exclusion.*
Tech-spec section: *§API conventions and §Mock auth still apply — the frontend just consumes the existing endpoints.*

## Acceptance Criteria

> **Do the design step first** — the first AC below is a prerequisite for all the others. All views, routes, and component structures listed after it are refinements of the design captured in `DESIGN.md`.

- [ ] **Design captured** *(prerequisite for everything below)* — the design step is done with the Claude Code **`frontend-design`** skill; `frontend/DESIGN.md` (one page) summarises the agreed wireframes and decisions coming out of the skill session
- [ ] A new `frontend/` directory at the repo root, scaffolded with React + Vite + TypeScript (`npm create vite@latest frontend -- --template react-ts`)
- [ ] `cd frontend && npm install && npm run dev` boots the Vite dev server on its default port (5173)
- [ ] **Menu view (`/`)** — landing page lists today's menu from `GET /api/v1/menu`; each item shows `name`, `priceChf` formatted as CHF, and an "available" indicator
- [ ] **Order form** — user can pick a menu item and a quantity (1–10) and submit (`POST /api/v1/orders` with `X-User-Id` header)
- [ ] **My orders view (`/orders`)** — page lists the caller's orders (`GET /api/v1/orders/me`), sorted newest first, showing item name, quantity, status, and a "Cancel" button next to each `SUBMITTED` order
- [ ] **Cancel action** — clicking Cancel calls `PATCH /api/v1/orders/{id}/cancel` and refreshes the my-orders view; success shows a brief confirmation
- [ ] **Admin add-item view (`/admin`)** — form takes `name` and `priceChf`, posts to `POST /api/v1/menu/items` with `X-Admin: true`
- [ ] **Identity handling** — `X-User-Id` is read from a small "Sign in as" input that persists to `localStorage`; `X-Admin: true` is sent automatically only for requests fired from the `/admin` route
- [ ] **Error display** — when the backend returns `{"code":"...","message":"..."}`, the UI shows the `message` (not the code); never silently swallow a non-2xx response

## Technical Notes

- **Scaffold**: `npm create vite@latest frontend -- --template react-ts` — accept the defaults.
- **Routing**: `react-router-dom` (small, idiomatic). Three routes: `/` (menu + order form), `/orders` (my orders + cancel), `/admin` (add item).
- **HTTP**: `fetch` is fine — don't pull in Axios unless you actually need it.
- **State**: `useState` + `useEffect` for fetches. No Redux / Zustand / TanStack Query unless it earns its weight here.
- **Styling**: pick one before you start — vanilla CSS, Tailwind, or a small component library (e.g. shadcn/ui via Radix). Whatever the `frontend-design` skill lands on in the design step.
- **CORS**: already configured on the backend (`ch.elca.training.lunch.common.WebConfig`) to allow `http://localhost:5173` (Vite default) for all methods used by the API. **No backend change needed.** If you prefer a Vite proxy instead, you can still add one in `vite.config.ts`, but it isn't required.
- **Design first**: run the Claude Code **`frontend-design`** skill to produce a layout + component breakdown, iterate on its proposals until you're happy, capture the agreed outcome in `frontend/DESIGN.md`, **then** write any component code. Do not hand-draft the design without invoking the skill first.

## Definition of Done

- [ ] All ACs ticked
- [ ] `frontend/DESIGN.md` exists and reflects the agreed wireframes
- [ ] PR description references the `frontend-design` skill session that produced `DESIGN.md` (name the skill, and paste one representative excerpt or screenshot — makes the tool-use reviewable, not just the artefact)
- [ ] `cd frontend && npm run build` succeeds (production bundle generates without errors)
- [ ] `cd frontend && npm run lint` passes (Vite's `react-ts` template installs ESLint by default)
- [ ] At least one component test using Vitest + `@testing-library/react` covers the happy path of one view (menu list rendering is the easiest)
- [ ] Manual smoke check: boot the Spring Boot backend AND the Vite dev server simultaneously, walk through all 5 sub-features in a browser, screenshot the result for the PR description
- [ ] No changes to `pom.xml` or any backend source — the frontend is decoupled
- [ ] No changes to `.gitignore` needed — `node_modules/`, `dist/`, and `*.local` are already covered at the repo root
- [ ] PR opened against `main` with the screenshots attached
