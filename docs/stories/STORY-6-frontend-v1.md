# Story 6 — Full v1 frontend (Angular 21)

**Status:** Draft (ready for SM to lock)
**Estimate:** 5 points
**Priority:** Must (kicks off Epic 2)
**Depends on:** Stories 1–5 (the v1 backend must be running); Story 7 (`GET /api/v1/menu/{id}`) is required by the my-orders view

> **Rewritten 2026-09-03: this story is Angular, not React.**
>
> It originally specified a React + Vite SPA. An instructor spike built the same scope in Angular 21 to evaluate the official Angular Agent Skills, and that spike is now Epic 2's deliverable. If you have an older copy of this file describing `npm create vite@latest`, it is stale.

> **This is the workshop-lite twin of `_bmad-output/implementation-artifacts/2-1-frontend-v1.md`.** Same work, two conventions. **Pick one and stay in it** — do not run both, or you will get two frontends. Use this file if your session is on the flat `docs/stories/` convention; use story 2.1 if you are on the ELCAi-strict convention and want `AC 2.1.N` numbering, CP estimates and the `.context.xml` companion.

## Context

Epic 1 shipped a headless API. Epic 2 brings a browser to it: an Angular 21 SPA letting a user do everything the v1 backend supports — view today's menu, place an order, see and cancel their own orders, and (as admin) add a menu item.

**Most of it already exists.** The work is adopting the spike, closing its gaps, and honouring the design spines. That is why this is 5 points rather than 8.

Read these before you start — they are the acceptance bar, not background:

| Document | What it binds |
|---|---|
| `frontend-angular/DESIGN.md` | Visual identity — tokens, type roles, `radius: 0`, per-component specs, light **and** dark palettes |
| `frontend-angular/EXPERIENCE.md` | Information architecture, the nine states, component behaviour, accessibility floor, three flows |
| `_bmad-output/planning-artifacts/architecture.md` | The as-built API, error contract, CORS, why port 5173 matters |
| `frontend-angular/SPIKE-FINDINGS.md` | What the spike learned, including two defects in Angular's own reference docs |

## The baseline you are adopting

The Angular tree lives on branch `spike/story-2-1-angular` under `frontend-angular/`.

⚠️ **Do not merge that branch.** It branched before Story 1.8 landed, so its diff against `main` *deletes* backend code and tests. **Cherry-pick the `frontend-angular/` directory only**, then confirm `git diff main -- src/` comes back empty before you open a PR.

⚠️ **Check `.gitignore` before your first commit.** A 292 MB `node_modules/`, plus `dist/` and `.angular/`, are sitting untracked in the working tree right now.

## Acceptance Criteria

### Already met by the baseline — verify and tick, don't re-implement

- [ ] `frontend-angular/` exists, Angular 21, standalone components, no NgModules
- [ ] `cd frontend-angular && npm install && npm start` boots the dev server on **5173** with zero errors. `npm start` stays pinned to `ng serve --port 5173` — `WebConfig` allows exactly one CORS origin, so the port is load-bearing
- [ ] **Admin add-item view (`/admin`)** — form takes `name` and `priceChf`, posts to `POST /api/v1/menu/items` with `X-Admin: true`
- [ ] **Identity handling** — `X-User-Id` comes from a "Sign in as" input in the shell, held in a signal, persisted to `localStorage` with `try/catch` on every access. `X-Admin: true` is attached by an interceptor **only** when the router is under `/admin`, derived from the route rather than stored state — no component can opt in. Keep it that way
- [ ] **Error display** — the UI renders `ApiError.message`, never `code`; no non-2xx is silently swallowed. One `apiErrorMessage()` helper is the only place an error becomes display text

### The actual work

- [ ] **Menu view (`/`)** — lists today's menu from `GET /api/v1/menu`; each row shows `name` and `priceChf` as CHF **and nothing else**.
  - *No availability indicator.* That endpoint returns available items only (`findAllByAvailableTrue`), so the flag would always read "available". **The baseline currently has one** — commit `6aadae6`'s restyle added a `.flag` span the AC had forbidden in prose, and its `.flag-out` branch is unreachable. Remove the span and its CSS; keep the dotted `.leader`, which is aesthetic rather than an availability cue. Then assert in a test that the row carries name and price only, so a future restyle can't sneak it back
  - *Add the missing empty state:* `No dishes on the menu today.`
- [ ] **Order form** (on `/`) — pick a menu item and quantity (1–10), submit via `POST /api/v1/orders` with `X-User-Id`. Add **per-field error association**: `aria-invalid` bound to touched-and-invalid, `aria-describedby` pointing at a message element that reserves its height. `/admin` already does this and is the pattern to copy
- [ ] **My orders view (`/orders`)** — lists the caller's orders from `GET /api/v1/orders/me`, showing item name, quantity, status, and a Cancel button beside each `SUBMITTED` order.
  - *An order carries `menuItemId`, not a name.* Resolve it with **`GET /api/v1/menu/{id}`** — the only read that returns an item regardless of availability. One call per **distinct** id, cached per id. The baseline wrongly resolves against `GET /api/v1/menu` and falls back to a truncated id, so an order for a since-unavailable dish shows no name
  - *Don't re-sort.* The server already returns newest-first; the baseline re-sorts with `localeCompare` over the serialized timestamp. Delete it and render the response order as received
  - *Verify with the seeded fixture:* `MenuSeedData` seeds *Soupe du jour* as `available = false` on purpose. An order against it must render its name
- [ ] **Cancel action — two-step, inline on the row, never a modal.** Click **Cancel** to *arm* the row (accent left border, tinted ground, cell swaps to **Cancel order** + **Keep**); focus moves to the confirm; `Escape` or `Keep` disarms; arming another row disarms the first, so exactly one row is armed at a time; nothing is sent until confirmed. Confirming fires `PATCH /api/v1/orders/{id}/cancel`, reloads the list, and shows `Order cancelled.`
  - *No dialog component.* A modal would be the only one in the app and would need a focus trap, escape handling, scroll locking and a backdrop, in a visual language `DESIGN.md` rules out
  - *Two accessibility musts:* the confirm button's accessible name identifies the **row**, not the verb — `aria-label="Cancel order of Risotto aux champignons"`, since "Cancel order" is ambiguous in a table. And announce arming through a **polite** live region, never `role="alert"` — arming isn't an error
- [ ] **Tokens only** — every colour, border and radius resolves through `var(--token)`; no component hard-codes a hex. Currently `my-orders-page.css`, `admin-page.css` and the shared `ErrorBanner` bypass the token system entirely, with four off-palette values between them: `#a4262c` → `var(--accent)`, `#fdf3f4` → `var(--accent-soft)`, `#107c10` → `var(--ok)`, `#e5e5e5` → `var(--rule)`. Also drop `ErrorBanner`'s `border-radius: 4px` (radius is `0` everywhere) and give `.confirmation` one treatment across all routes instead of two
- [ ] **Dark mode** via `prefers-color-scheme`, using the nine dark tokens in `DESIGN.md`. Redefine the same custom properties inside the media query — **components must not branch on theme.** Only possible once the token work above lands: a hard-coded hex looks fine in light and breaks in dark
- [ ] **Tests on all three routes** — `my-orders-page` currently has none at all
- [ ] **A real linter** — `ng add @angular-eslint/schematics` plus a `lint` script. **This story authorises those dev dependencies:** the Angular scaffold ships Prettier but no ESLint and `package.json` has no `lint` script, so the DoD's lint gate was previously impossible to pass. `CLAUDE.md`'s no-new-dependencies rule is about `pom.xml`; this is a separate manifest

## Technical Notes

- **Routing**: Angular Router, exactly three lazily-loaded routes (`/`, `/orders`, `/admin`) plus `**` → `/`.
- **HTTP**: `httpResource` for reads (gives you `isLoading()` / `error()` / `hasValue()` and `reload()`); `HttpClient` on the injectable `LunchApi` for mutations, subscribed explicitly. After a successful mutation call `reload()` — never patch a local copy of server state. No Axios, no `fetch` wrappers.
- **State**: Angular signals, `computed()` for derived values. No NgRx, no third-party store, no RxJS subjects for view state.
- **Components**: standalone, `OnPush`, `inject()` over constructor injection, `input()` over `@Input()`, native `@if` / `@for`, selector prefix `lunch-`.
- **Styling**: component-scoped CSS against `DESIGN.md`'s tokens. **No Tailwind, no Material, no shadcn** — a library would import a competing visual system. No web fonts either: the type stacks are OS-shipped on purpose.
- **CORS**: already configured (`common/WebConfig`) for exactly `http://localhost:5173`. Don't add a dev-server proxy — it was deliberately rejected so the existing CORS config stays exercised.
- **Forms are inconsistent on purpose.** `/` uses reactive forms, `/admin` uses signal forms. That split was the spike's experiment; **unifying it is out of scope.** Mention it in the PR so a reviewer doesn't read it as sloppiness. Signal forms cost 34 kB raw on the `/admin` chunk for a two-field form.
- **Three traps that each cost the spike a red test run** — Angular's own `testing-fundamentals.md` says the opposite of the first two:
  - `httpResource` needs an explicit `detectChanges()` to fire its request. Awaiting `whenStable()` first deadlocks.
  - After `flush()`, an `async` submit callback's continuation runs in a later microtask, so `whenStable()` settles *before* the signals are written. Yield explicitly.
  - `references/http-client.md` shows a service annotated `@Service()`. Angular has no such decorator — it's `@Injectable()`. Copied verbatim, it won't compile.
- **The CLI's generated `CLAUDE.md` contradicts the skill.** `ng new --ai-config=claude` writes *"Prefer Reactive forms instead of Template-driven ones"* and never mentions signal forms, while `angular-developer/SKILL.md` prefers signal forms on v21+. Two official Google artefacts disagree and the CLI installs the stale one. Review it rather than trusting it.
- **Optional polish pass:** the `frontend-design` skill writes styled component code with a strong aesthetic point of view. If you use it, do so *after* reading the spines — and note that it is exactly what introduced the availability-indicator violation above. Keep the ACs, not the aesthetics, as the acceptance bar. Mention it in the PR.

## Definition of Done

- [ ] All ACs ticked
- [ ] `frontend-angular/` cherry-picked onto a branch off current `main`, with `git diff main -- src/` empty
- [ ] `DESIGN.md` and `EXPERIENCE.md` honoured by the shipped code
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes (`@angular-eslint`, no rules disabled)
- [ ] `npx prettier --check src` passes
- [ ] `npm test` passes, and all three routes have a spec file
- [ ] Manual smoke: backend + dev server up together; walk every AC in a browser; include the unavailable-item name resolution, the arm → confirm → cancel path, an `Escape` disarm, and **both themes**; screenshots in the PR
- [ ] No changes to `pom.xml`, backend Java sources, or `application.yml` — the frontend is decoupled
- [ ] `.gitignore` covers `node_modules/`, `dist/`, `.angular/` — verified before the first commit
- [ ] PR opened against `main` with the screenshots attached
