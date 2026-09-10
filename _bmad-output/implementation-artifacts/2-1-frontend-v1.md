# Story 2.1 — Full v1 frontend (Angular 21 SPA)

| Field | Value |
|---|---|
| **Feature** | 2 (Frontend v1 — browser client for the Lunch Order API) |
| **Story ID** | 2.1 |
| **Status** | in-progress |
| **Estimate** | **5 CP** *(1 CP = 1 developer-day incl. unit tests)* — 8 CP → 3 CP on adopting the Angular baseline, then **3 → 5** when the design step added dark mode, a two-step cancel confirm, and per-field form errors. Of fifteen ACs, five arrive satisfied, AC 2.1.10 is done, nine remain open (see *Baseline* below) |
| **Priority** | Must (kicks off Feature 2) |
| **Security** | ELCA (workshop repo — no Jira integration; see Deviations below) |
| **Depends on** | Stories 1.1–1.5 (backend v1 must be running); story 2.7 (`GET /api/v1/menu/{id}`, already on `main`) is **required** by AC 2.1.5 |
| **Base branch** | `main` |
| **Architecture** | `_bmad-output/planning-artifacts/architecture.md` · spine `…/architecture/ARCHITECTURE-SPINE.md` (ADs 10–13, 18 bind this story) |

## ⚠ Read this before anything else

**None of this story's code is on `main`.** `frontend-angular/` on `main` holds `DESIGN.md`, `EXPERIENCE.md` and `SPIKE-FINDINGS.md` and nothing else — no `src/`, no `package.json`. The Angular tree exists only on the local branch `spike/story-2-1-angular`.

Every "the page currently does X" statement below describes the **spike tree**, not your working directory. Bring it over first with `git checkout spike/story-2-1-angular -- frontend-angular`; until you do, there is nothing to modify.

## Problem Statement

Feature 1 shipped a headless HTTP API — usable but not shippable to end users. Employees ordering lunch and admins editing the menu need a browser interface that consumes the existing endpoints without any backend changes. This story delivers a single-page application covering the six backend surfaces already on `main` (list menu, get item by id, submit order, list my orders, cancel order, add menu item), with mock-auth identity handled via `X-User-Id` and `X-Admin` headers exactly as the API expects.

## Baseline — what this story adopts

**Decision of 2026-09-03: the framework is Angular 21, not React + Vite.**

This story originally specified a React + Vite + TypeScript SPA. An instructor spike on `spike/story-2-1-angular` instead built the same functional scope in Angular 21 to evaluate the official Angular Agent Skills, and that spike is now adopted as Feature 2's deliverable. The rationale, the version-support position, and the invariants it must obey are recorded in the architecture spine (AD-10 through AD-13, AD-18).

Consequences you must not be surprised by:

| | |
|---|---|
| **Deliverable path** | `frontend-angular/`, **not** `frontend/`. The spike deliberately left `frontend/` free for the React story that no longer exists. |
| **The spike branch is not mergeable as-is** | `git merge-base main spike/story-2-1-angular` is `8c9c253`. The spike **never touched** any backend or planning file — diffing that merge-base against the spike tip on `GlobalExceptionHandler.java`, both controller tests, `architecture.md` and `project-context.md` produces **zero output**. The apparent deletions are branch staleness: `main` advanced past the fork. A whole-branch merge or `git diff main..spike \| git apply` would regress those files *plus* `ARCHITECTURE-SPINE.md`, `.gitattributes`, the style skill, and would undo the `story-2-1-…` → `2-1-…` rename this story records as resolved. **Use `git checkout spike/story-2-1-angular -- frontend-angular` — path-scoped.** Verify `git diff main -- src/` is empty before committing. |
| **Five ACs arrive satisfied** | 2.1.1, 2.1.2, 2.1.7, 2.1.8, 2.1.9 are met by the adopted code. Two that looked satisfied are not: **2.1.3** (the restyle reintroduced the availability indicator the AC forbids) and **2.1.6** (cancel works but now needs a confirm step). See the AC list. |
| **Estimate 8 → 3 → 5 CP** | Remaining: AC 2.1.3 (flag removal + empty state), 2.1.4 (test + per-field errors), 2.1.5, 2.1.6 (confirm step), and 2.1.11–2.1.15. AC 2.1.10 is done. |
| **`docs/stories/STORY-6-frontend-v1.md`** | The workshop-lite twin of this story. It still describes React. Out of scope here; flag it to the instructor. |

## Ubiquitous Language

| Term | Definition |
|---|---|
| **SPA** | Single-Page Application — one bundle served by the Angular CLI dev server (`ng serve`) on port 5173 in dev. |
| **View / Route** | A standalone Angular component lazily mapped to a URL path via `loadComponent` in `app.routes.ts`. This story has three: `/`, `/orders`, `/admin`. |
| **Identity header** | `X-User-Id: <employee-id>` — held in a signal, sourced from a "Sign in as" input, persisted to `localStorage`. |
| **Admin header** | `X-Admin: true` — attached by the HTTP interceptor **only** when the active route is under `/admin`, derived from the router rather than from stored state (spine AD-10). |
| **Design spines** | `frontend-angular/DESIGN.md` (visual identity — tokens, component specs) and `frontend-angular/EXPERIENCE.md` (IA, states, behaviour, accessibility, flows). Peer contracts; both win over any mock or restyle. Produced by `bmad-ux` on 2026-09-03. |
| **Spike findings** | `frontend-angular/SPIKE-FINDINGS.md` — the spike's original engineering evaluation, preserved verbatim. Not a design spec. |
| **ApiError** | Backend error body `{ code, message }`. The UI renders `message`, never `code` (spine AD-12). |

## Acceptance Criteria

Numeric IDs 2.1.1–2.1.10 are unchanged from the React version so existing references stay valid. IDs 2.1.11–2.1.13 cover work the adoption made visible; **2.1.14 and 2.1.15 came out of the design step** — 2.1.14 from its token audit, 2.1.15 from the decision to support dark mode.

**AC 2.1.10 is done** — the design step ran on 2026-09-03 and produced `DESIGN.md` + `EXPERIENCE.md` in `frontend-angular/`, both now `status: final` with every open question resolved. Read both before touching any component: they are the acceptance bar for every visual and behavioural AC below.

The design step **added scope rather than only documenting it** — dark mode (2.1.15), a two-step cancel confirm (2.1.6), per-field form errors (2.1.4), the menu's missing empty state (2.1.3), and the token audit (2.1.14). That is the step doing its job, and it is why the estimate moved 3 → 5 CP.

### Satisfied by the adopted baseline

Verify each against the rebased tree and tick. Do not re-implement.

- [ ] **AC 2.1.1** — `frontend-angular/` exists at repo root, scaffolded with the Angular CLI (Angular 21, standalone components, no NgModules). *Adopted — the original `npm create vite@latest … --template react-ts` no longer applies.*
- [ ] **AC 2.1.2** — `cd frontend-angular && npm install && npm start` boots the dev server on port **5173** with zero errors. `npm start` must remain pinned to `ng serve --port 5173`: `WebConfig` allows exactly one CORS origin, so the port is load-bearing (spine AD-13).
- [ ] **AC 2.1.7** — **Admin add-item view (`/admin`)** provides a form for `name` + `priceChf` and POSTs to `POST /api/v1/menu/items` with `X-Admin: true`. *Covered by `admin-page.spec.ts` (success, 403 path, required-name guard).*
- [ ] **AC 2.1.8** — **Identity handling**: `X-User-Id` is held in a signal sourced from a "Sign in as" input and persisted to `localStorage` with `try/catch` on every access; `X-Admin: true` is attached **only** for requests fired while the router is under `/admin`. *The adopted implementation exceeds the original AC: deriving the admin header from the active route makes this true by construction — no component can opt in (spine AD-10). Keep it that way.*
- [ ] **AC 2.1.9** — **Error display**: when the backend returns `{"code":"…","message":"…"}`, the UI renders `message` (not `code`); no non-2xx response is silently swallowed. A single `apiErrorMessage()` helper is the only place an `HttpErrorResponse` becomes display text (spine AD-12). *Covered by `admin-page.spec.ts`.*

### Open — the work of this story

- [ ] **AC 2.1.3** — **Menu view (`/`)** lists today's menu from `GET /api/v1/menu`; each item displays `name` and `priceChf` formatted as CHF, **and nothing else**.
  > **No availability indicator in v1.** `MenuService.listAvailable()` calls `findAllByAvailableTrue()`, so this endpoint returns *only* available items — an indicator driven off `item.available` would read "available" 100% of the time (spine AD-6). Do not build UI for a state the API cannot return.
  >
  > **Not met by the baseline — and this one is instructive.** Commit `6aadae6` (*"restyle the menu route with the frontend-design skill"*) added exactly the forbidden element:
  > ```html
  > <span class="flag" [class.flag-out]="!item.available">
  >   {{ item.available ? 'available' : 'unavailable' }}
  > </span>
  > ```
  > None of the four preceding spike commits contain it — the polish pass introduced it, disguised as styling. The `.flag-out` branch is unreachable and its CSS is dead.
  >
  > **Required:** remove the `.flag` span from `menu-page.html` and the `.flag` / `.flag-out` rules from `menu-page.css`. Keep the dotted `.leader` — it is load-bearing to the editorial aesthetic, not an availability cue. Then extend `menu-page.spec.ts` to assert the rendered row contains name and price only, so a future restyle cannot reintroduce it silently.
  >
  > **Also add the missing empty state** (EXPERIENCE.md *State Patterns* — `/` is the one surface lacking one): `No dishes on the menu today.`
  >
  > **Worth naming in the PR and at the workshop:** an agent-driven visual polish step reintroduced a requirement violation that the AC had explicitly called out in prose. The AC caught it; the skill did not.

- [ ] **AC 2.1.4** — **Order form** (on `/`) lets the user pick a menu item and quantity (1–10) and submits via `POST /api/v1/orders` with the `X-User-Id` header. *Implemented; the submit path is **untested**. This AC is not ticked until AC 2.1.12 covers it.*
  > **Additionally required — per-field error association.** The order form currently surfaces validation only through the shared banner, with no field-level association. `/admin` already does it properly, and its pattern is now the standard (EXPERIENCE.md *Accessibility Floor*): each field carries `aria-invalid` bound to touched-and-invalid, plus `aria-describedby` pointing at its own message element, which reserves its height (`min-height`) so validation does not shift layout. Apply it to both fields.

- [ ] **AC 2.1.5** — **My orders view (`/orders`)** lists the caller's orders from `GET /api/v1/orders/me`, showing item name, quantity, status, and a "Cancel" button next to each `SUBMITTED` order.
  > **Not met by the baseline.** `my-orders-page` currently resolves names from `GET /api/v1/menu`, which returns available items only, and falls back to a truncated id — so an order for a since-unavailable item shows no name. Its own comment calls this a known gap.
  >
  > **Required:** repoint the name lookup at **`GET /api/v1/menu/{id}`** — story 2.7's endpoint, and per **AD-7** the only supported way to resolve a `menuItemId` held on an `Order`. One request per **distinct** `menuItemId`, cached per id, so N orders over M distinct items cost M requests and not N.
  >
  > **A cache already exists — do not build a second one.** `my-orders-page` has a `namesById` computed signal today; only its *source* is wrong.
  >
  > **`design.md` ADR-2-1 has already decided the shape.** Component-local in-memory state inside `my-orders-page` (a plain `Map` or a small signal), populated lazily on first encounter of an id, fetched with a **direct `HttpClient` call — not `httpResource`**, because the number and identity of lookups is data-dependent and does not fit `httpResource`'s single-resource-per-declaration model. ADR-2-1 **explicitly rejects** extracting a shared injectable lookup service (no second consumer exists) and rejects widening `GET /menu` (a backend change that would blur AD-6).
  >
  > **Verify it with the seeded fixture.** `MenuSeedData` seeds *Soupe du jour* as `available = false` on purpose — it is the only fixture that exercises this path by hand. An order against it must render its name, not an id.

- [x] **AC 2.1.10** — **Design captured**, as two peer spines in `frontend-angular/`:
  - **`DESIGN.md`** — visual identity. Ratified tokens (nine colours, eight type roles, spacing, the `radius: 0` rule), per-component visual specs, and Do's/Don'ts.
  - **`EXPERIENCE.md`** — information architecture, the eight-state vocabulary, component behaviour, interaction primitives, the accessibility floor, and three named-protagonist flows. Cross-references DESIGN.md tokens by name.

  > **Reworded 2026-09-03.** This AC originally asked for "wireframes and design decisions" in a single `DESIGN.md`. `bmad-ux` produces two peer contracts, and in its vocabulary — following the [Google Labs `design.md` spec](https://github.com/google-labs-code/design.md) — `DESIGN.md` means *visual identity* while layout, states and behaviour belong to `EXPERIENCE.md`. The AC now requires both by name rather than describing content that lives in the other file.
  >
  > **Done via `bmad-ux` on 2026-09-03.** Brownfield run: the visual identity already existed in the spike's CSS, so the spines **ratify** rather than invent. The spike's original `DESIGN.md` is preserved verbatim as **`SPIKE-FINDINGS.md`** — it is an engineering evaluation report, not a design spec, and it records two defects in Angular's own reference material worth keeping.
  >
  > **The design step's main finding, now AC 2.1.14:** the token system reaches the shell and one route out of three. `/orders`, `/admin` and the shared `ErrorBanner` bypass it entirely with four off-palette hexes between them.
  >
  > **Five open `[ASSUMPTION]` tags** remain in the spines for the participant or instructor to resolve: `/`'s empty-state copy, the light-only palette declaration, per-field error association on the order form, whether Cancel stays unguarded, and whether the three protagonists are replaced with real ones.
  >
  > **Optional, implementation phase only:** the `frontend-design` skill generates polished component code with a committed aesthetic direction. It is **not** a substitute for `bmad-ux` — it produces code, not a spec. Note that it is what introduced AC 2.1.3's violation: its house style is deliberately bold, and it added UI the AC had forbidden in prose. If you use it, say so in the PR and keep the ACs, not the aesthetics, as the acceptance bar.

- [ ] **AC 2.1.14** — **Every colour, border and radius resolves through a token.** No component hard-codes a hex.
  > **The design step's audit.** `var(--token)` versus hard-coded hex, per file: `app.css` 14/0 ✅ · `menu-page.css` 25/0 ✅ · `my-orders-page.css` **0/2** ❌ · `admin-page.css` **0/2** ❌ · `error-banner` inline styles **0/3** ❌. Only the shell and `/` were ever restyled.
  >
  > **Four off-palette values to delete, not tokenise** — the palette already covers each:
  > - `#a4262c` (error ink, in `ErrorBanner` and `admin-page.css`) → `var(--accent)` `#b1341c`
  > - `#fdf3f4` (error ground, in `ErrorBanner`) → `var(--accent-soft)` `#f0d9c8`
  > - `#107c10` (confirmation, in `my-orders-page.css` and `admin-page.css`) → `var(--ok)` `#2f6b3d`
  > - `#e5e5e5` (table rule, in `my-orders-page.css`) → `var(--rule)` `#ddd6c8`
  >
  > **Also required:** drop `ErrorBanner`'s `border-radius: 4px` (DESIGN.md *Shapes* — radius is `0` everywhere), and unify `.confirmation` on the `menu-page` treatment (`3px solid var(--ok)` left border plus `var(--ok)` text) so the same component stops having two appearances depending on route.

- [ ] **AC 2.1.6** — **Cancel action**, now **two-step**. The existing single-click cancel calls `PATCH /api/v1/orders/{id}/cancel`, refreshes via `reload()`, and confirms on success — that part is implemented and untested. A confirm step is now required, which reopens this AC.
  > **Inline on the row, not a modal** (EXPERIENCE.md *Destructive confirmation*):
  > 1. The cell shows **Cancel**.
  > 2. One click **arms** the row — armed treatment (`3px solid var(--accent)` left border, `var(--accent-soft)` ground), cell swaps to **Cancel order** + **Keep**. Nothing sent yet.
  > 3. Focus moves to the confirm. **Escape** or **Keep** disarms. Arming another row disarms this one — exactly one row armed at a time.
  > 4. Confirming fires the `PATCH`; both buttons disable, confirm label becomes `Cancelling…`.
  > 5. Success reloads and shows `Order cancelled.` Failure shows the banner and disarms.
  >
  > **Why not a modal:** it would be the only modal in the app and would drag in a focus trap, escape handling, scroll locking, a backdrop, and rounded-corner elevation that `DESIGN.md` rules out. Do not add a dialog component.
  >
  > **Two accessibility requirements specific to this pattern:**
  > - The confirm button's accessible name must identify the **row**, not just the verb — `aria-label="Cancel order of Risotto aux champignons"`. "Cancel order" alone is ambiguous in a table, and a screen-reader user tabbing in has no visual row context.
  > - Announce arming through a **polite** live region, not `role="alert"` — arming is not an error. `Keep` is the safe default wherever focus or Enter handling could be ambiguous.

- [ ] **AC 2.1.15** — **Dark mode**, via `prefers-color-scheme`.
  > Nine dark tokens are specified in `DESIGN.md` *Colors*. Redefine the same custom properties inside `@media (prefers-color-scheme: dark)`; **components must not branch on theme.** This is only possible once AC 2.1.14 lands — a hard-coded hex looks fine in light and breaks in dark, which is why the two ACs are paired.
  >
  > **Not a plain inversion.** The dark ground is a warm brown-black (`#1c1714`), not neutral grey or `#000`, so the paper metaphor survives as *unlit paper*. `paper-deep` stays **darker** than the sheet, preserving the same tonal relationship. The accent **lifts** to `#e8674a` because `#b1341c` on `#1c1714` fails AA.
  >
  > **Two things change beyond colour:** the canvas grain lightens instead of darkening (`rgba(240, 235, 225, 0.02)`), and the sheet's drop shadow is **dropped entirely** — against a dark ground it reads as a black smear. Depth comes from the tonal step alone.
  >
  > **No in-app toggle.** System preference is the whole mechanism — no theme control, no persisted preference, no mention of theme anywhere in the UI.
  >
  > ⚠️ **The dark contrast ratios in `DESIGN.md` are computed, not measured.** Verify each pair with a contrast checker before ticking this AC. `accent-dark` on `accent-soft-dark` is the tightest at roughly 4.5:1 — if it measures below, lighten `accent-dark` rather than darkening the ground, which would break the error banner's border.

- [ ] **AC 2.1.11** — **Remove the client-side re-sort.** `my-orders-page` re-sorts with `b.createdAt.localeCompare(a.createdAt)` although `findAllByUserIdOrderByCreatedAtDesc` already returns orders newest-first. The server owns ordering (spine AD-18); a second mechanism agrees today only because Jackson currently emits fixed-width UTC ISO-8601, and drifts silently if that ever changes. **ADR-2-2** decided this: delete the sort and add **no replacement ordering logic** — not even a "defensive" comparator, which would re-introduce the dependency on an implicit serialization guarantee instead of removing it. Render the response order as received. The view must still display newest-first — assert it against a mocked response whose order is already correct.

- [ ] **AC 2.1.12** — **Close the test gaps.** Add `my-orders-page.spec.ts` and extend coverage so all three routes have tests. Minimum cases:
  - order submit succeeds and resets the form (AC 2.1.4)
  - order submit renders `ApiError.message` on a non-2xx (AC 2.1.4 + 2.1.9)
  - my-orders renders newest-first from an already-sorted response (AC 2.1.5 + 2.1.11)
  - a name is resolved via `GET /api/v1/menu/{id}` for an item absent from `GET /api/v1/menu` (AC 2.1.5)
  - clicking Cancel **arms** the row and sends nothing (AC 2.1.6)
  - `Keep`, and separately `Escape`, disarm with nothing sent (AC 2.1.6)
  - arming a second row disarms the first (AC 2.1.6)
  - confirming a cancel succeeds, triggers `reload()`, and shows the confirmation (AC 2.1.6)
  - confirming renders `ApiError.message` on `409 ALREADY_CANCELLED` and disarms (AC 2.1.6 + 2.1.9)
  - the confirm button's accessible name includes the dish name (AC 2.1.6)
  - the menu's empty state renders for a zero-length response (AC 2.1.3)
  - both order-form fields expose `aria-invalid` and `aria-describedby` when touched and invalid (AC 2.1.4)

  > **Two testing traps the spike hit, both costing a red run** — the Angular skill's `testing-fundamentals.md` is wrong on both and says the opposite:
  > - `httpResource` needs an explicit `detectChanges()` to fire its request. Awaiting `whenStable()` first deadlocks against a request nothing has answered yet.
  > - After `flush()`, an `async` submit callback's continuation runs in a later microtask, so `whenStable()` settles *before* the signals are written. Yield explicitly.

- [ ] **AC 2.1.13** — **A real linter.** Run `ng add @angular-eslint/schematics` and add a `lint` script; `npm run lint` must pass on all committed `frontend-angular/` code with no rules disabled.
  > **This story explicitly authorises the new dev dependencies.** The Angular 21 scaffold ships Prettier but no ESLint, and `package.json` has no `lint` script — so the DoD's lint gate was previously unsatisfiable. `CLAUDE.md`'s no-new-dependencies rule targets `pom.xml`; this is a separate manifest, and the addition is scoped to `frontend-angular/`. Keep Prettier: `prettier --check src` stays green alongside ESLint.

## Design Constraints

- **Decoupled from backend:** no changes to `pom.xml`, Java sources, or `application.yml`. The frontend is a pure API consumer.
- **CORS is already handled** by `ch.elca.training.lunch.common.WebConfig`, which allows exactly one origin — `http://localhost:5173`. The API is called at its absolute URL, `http://localhost:8080/api/v1`. A dev-server proxy would make the port irrelevant and was deliberately rejected so the existing CORS config stays exercised (spine AD-13). Do not add one.
- **State:** Angular signals, with `computed()` for derived values. No NgRx, no third-party store. No RxJS subjects for view state — `rxjs` is present only as Angular's own dependency.
- **HTTP:** `httpResource` for reads (it supplies `isLoading()` / `error()` / `hasValue()` and refreshes via `reload()`); `HttpClient` on the injectable `LunchApi` for mutations, subscribed explicitly (spine AD-11). After a successful mutation call `reload()` — never patch a local copy of server state. No Axios, no `fetch` wrappers.
- **Headers:** one functional `HttpInterceptor` attaches both identity headers. No component sets them itself.
- **Routing:** Angular Router, exactly three lazily-loaded routes (`/`, `/orders`, `/admin`) plus a `**` redirect to `/`.
- **Components:** standalone, `ChangeDetectionStrategy.OnPush`, `inject()` over constructor injection, `input()` over `@Input()`, native `@if` / `@for` control flow, selector prefix `lunch-`.
- **Forms — signal forms on both routes.** *(Amended 2026-09-10 by code review.)* The story previously froze a deliberate reactive-forms (`/`) versus signal-forms (`/admin`) split inherited from the spike. The frontend was rebuilt from scratch rather than adopted, so there was no split to preserve, and `angular-developer` prefers signal forms for a new v21 application. Both routes now use `@angular/forms/signals`. Two consequences to know: validators are **reflected as native HTML attributes**, so any form relying on `submit()` to reveal its own errors must carry `novalidate`; and `min`/`max` **short-circuit on an empty value**, so every numeric field needs an explicit `required()` even when a range validator is present.
- **Styling:** component-scoped CSS, already in place. Do not introduce Tailwind or a component library on top of it — do not mix styling systems.
- **Design first:** AC 2.1.10 is executed before any component change.
- **Beware the CLI's generated `CLAUDE.md`.** `ng new --ai-config=claude` writes guidance saying *"Prefer Reactive forms instead of Template-driven ones"* and never mentions signal forms, contradicting `angular-developer/SKILL.md`, which prefers signal forms on v21+. Two official Google artefacts disagree and the CLI installs the stale one automatically. Review it rather than trusting it.
- **A defect in the Angular skill's own reference:** `references/http-client.md` shows a service annotated `@Service()`. Angular has no such decorator — it is `@Injectable()`. Copied verbatim, it will not compile.

## Artefacts to Reuse

| Artefact | Purpose in frontend | AC(s) |
|---|---|---|
| `spike/story-2-1-angular` → `frontend-angular/` tree | The adopted baseline. Cherry-pick this directory only — never merge the branch (see *Baseline*). | 2.1.1–2.1.9 |
| `GET /api/v1/menu` | Menu view. Available items only. | 2.1.3 |
| `GET /api/v1/menu/{id}` | **Resolves an order's item name regardless of availability.** Story 2.7's endpoint; the only availability-bypassing read (spine AD-7). | 2.1.5 |
| `POST /api/v1/orders` (`X-User-Id`) | Order form submission | 2.1.4 |
| `GET /api/v1/orders/me` (`X-User-Id`) | My orders view. **Already sorted newest-first.** | 2.1.5, 2.1.11 |
| `PATCH /api/v1/orders/{id}/cancel` (`X-User-Id`) | Cancel action | 2.1.6 |
| `POST /api/v1/menu/items` (`X-Admin: true`) | Admin add-item form | 2.1.7 |
| `common/WebConfig` | Existing CORS config permits `http://localhost:5173` — no backend change needed | 2.1.2 |
| `MenuSeedData`'s `available = false` item | The only runtime fixture that exercises AC 2.1.5's resolution path | 2.1.5 |

## Artefacts to Create or Change

Everything under `frontend-angular/`. Nothing outside it. **`DESIGN.md` and `EXPERIENCE.md` are not in this table** — AC 2.1.10 is complete and both are `status: final`. Read them; do not rewrite them.

| Path | Change | AC(s) |
|---|---|---|
| `src/app/routes/my-orders-page/my-orders-page.ts` | **Change** — repoint `namesById` at `GET /menu/{id}` per distinct id via a direct `HttpClient` call (ADR-2-1); delete the client-side sort (ADR-2-2) | 2.1.5, 2.1.11 |
| `src/app/routes/my-orders-page/my-orders-page.spec.ts` | **New** — the route has no test at all today | 2.1.12 |
| `src/app/routes/menu-page/menu-page.spec.ts` | **Extend** — add the order-submit success and error cases | 2.1.12 |
| `eslint.config.js` (or as the schematic generates), `package.json` | **New / change** — `@angular-eslint` plus a `lint` script | 2.1.13 |

## Test Scaffolding

| Layer | Framework | Coverage target |
|---|---|---|
| Component | `@angular/build:unit-test` (vitest + jsdom) | All three routes have a spec. Six named cases in AC 2.1.12. |
| Lint | `@angular-eslint` via `npm run lint` | Passes on all committed `frontend-angular/` code, no rules disabled |
| Format | `prettier --check src` | Stays green alongside ESLint |
| Build | `ng build` | Production bundle generates without errors; three lazy route chunks |
| Manual smoke | Human, in-browser | Backend + dev server up simultaneously; walk every AC; screenshots for the PR. **Include an order against the seeded unavailable item** — that is the AC 2.1.5 proof. |

## Definition of Done

- [ ] All ACs (2.1.1 – 2.1.15) ticked
- [ ] `frontend-angular/` tree cherry-picked onto a branch off current `main`, with backend sources and tests **unchanged** — verify with `git diff main -- src/` returning empty
- [ ] PR description references the `bmad-ux` session that produced `DESIGN.md` (name the skill, paste one representative excerpt or screenshot — makes the tool use reviewable, not just the artefact)
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes (`@angular-eslint`, no rules disabled)
- [ ] `npx prettier --check src` passes
- [ ] `npm test` passes; all three routes have a spec file
- [ ] `DESIGN.md` and `EXPERIENCE.md` are honoured by the shipped code — both are `status: final` with no open `[ASSUMPTION]` tags; `SPIKE-FINDINGS.md` retained
- [ ] No changes to `pom.xml`, backend Java sources, or `application.yml`
- [ ] Manual smoke walkthrough with screenshots attached, including the unavailable-item name resolution, the arm → confirm → cancel path, an `Escape` disarm, and **both themes**
- [ ] `.gitignore` covers `node_modules/`, `dist/`, `.angular/` — **verify before the first commit.** A 292 MB `node_modules` and a `dist/` tree are currently sitting untracked in the working directory.
- [ ] PR opened against `main`
- [ ] `2-1-frontend-v1.context.xml` companion updated in step with this file


## Review Findings

Code review of 2026-09-10. Three parallel layers: Blind Hunter (adversarial), Edge Case Hunter
(branch and boundary walk), Acceptance Auditor (AC, AD and spine conformance). All three read the
backend contract and verified framework behaviour against the shipped `@angular/forms` source rather
than assuming it. 13 of 15 ACs met, AC 2.1.5 and 2.1.9 partly met, AC 2.1.13 not met. Nine of the ten
binding ADs honoured, AD-12 partly. Both feature ADRs followed exactly.

### Decisions taken

- [x] [Review][Decision] Signal forms accepted on both routes. The story's frozen reactive/signal split existed to preserve the spike's experiment; building fresh left no split to preserve. Design Constraints amended; the DoD item asking the PR to explain the split is withdrawn.
- [x] [Review][Decision] `EXPERIENCE.md`'s self-contradiction on disabling an invalid submit resolved in favour of line 107 ("never disabled for any other reason") over lines 105, 106 and 226. Recorded as an `[ASSUMPTION]` in that spine. Needs `novalidate` to actually work - see the patch below.

### Patches applied

- [x] [Review][Patch] Empty numeric field posts `null` and Hibernate's "must not be null" reaches the banner; `min`/`max` short-circuit on empty, only `required` reports [menu-page.ts:32, admin-page.ts:32]
- [x] [Review][Patch] Native constraint validation suppresses the `submit` event, so an untouched field never gets its styled error [menu-page.html:69, admin-page.html:43]
- [x] [Review][Patch] Failed `GET /menu/{id}` swallowed forever; the row stays `...` and the confirm button degrades to `aria-label="Cancel order of ..."` [my-orders-page.ts:79]
- [x] [Review][Patch] Ordering while signed out surfaces the raw header error `Required header 'X-User-Id' is missing` [menu-page.ts:40]
- [x] [Review][Patch] Every keystroke in "Sign in as" fires `GET /orders/me`, writes `localStorage`, and blanks the table [app.html:24]
- [x] [Review][Patch] `armedId`/`errorMessage`/`confirmation` survive an identity change, leaving the live region stuck on a row that is gone [my-orders-page.ts:53]
- [x] [Review][Patch] Two concurrent cancels corrupt each other; `armedId` and `cancellingId` are unkeyed scalars [my-orders-page.ts:53]
- [x] [Review][Patch] A rejected cancel never reloads, so the row keeps offering an action that can only fail [my-orders-page.ts:120]
- [x] [Review][Patch] `reload()` unmounts the table, destroying focus and killing the Escape handler [my-orders-page.html:5]
- [x] [Review][Patch] Escape only disarms while focus is inside the non-focusable `<table>` [my-orders-page.html:14]
- [x] [Review][Patch] Focus is never restored on disarm or after a completed cancel [my-orders-page.ts:85]
- [x] [Review][Patch] Cancel does not capture the identity it was issued under [my-orders-page.ts:108]
- [x] [Review][Patch] Three subscriptions lack `takeUntilDestroyed`, so signals are written after destroy [my-orders-page.ts:77,112; menu-page.ts:47; admin-page.ts:46]
- [x] [Review][Patch] `role="status"` region and its content are inserted in one mutation, so nothing is announced [menu-page.html:78, admin-page.html:52, my-orders-page.html:82]
- [x] [Review][Patch] No `aria-current` on the active nav link [app.html:8]
- [x] [Review][Patch] Invented `min(0.05)` contradicts `@PositiveOrZero`, `step="0.05"` rejects a legal `7.99`, and the message is wrong for `0.02` [admin-page.ts:32, admin-page.html:29]
- [x] [Review][Patch] A whitespace-only or over-100-character item name reaches the backend and returns raw Bean Validation text [admin-page.ts:31]
- [x] [Review][Patch] `readStored()` skips the normalisation `signInAs()` applies, so a stored whitespace id sends `X-User-Id: "   "` [identity.ts:36]
- [x] [Review][Patch] The identity input is value-bound and trimmed per keystroke, so the DOM desynchronises from the signal [identity.ts:32, app.html:23]
- [x] [Review][Patch] `/` pending label reads `Adding...` where the spine says `Submitting...` [menu-page.html:70]
- [x] [Review][Patch] The order-status cell is set in chrome typography; DESIGN.md assigns `body` to table cells [my-orders-page.css:43]
- [x] [Review][Patch] Menu-row stagger-in is absent, and with it its reduced-motion escape [menu-page.css]
- [x] [Review][Patch] A comment claims the by-id lookup exists for "since-removed" dishes, but `MenuService.deleteById` makes removal impossible; the real reason is `available = false` [lunch-api.ts:37]
- [x] [Review][Patch] Tests: no `http.verify()` anywhere; the no-re-sort test flushes already-sorted data so it cannot detect a re-sort; two "blocks submit" tests pass vacuously; reset assertions skip the numeric field; the interceptor, `Identity` and `apiErrorMessage` are wholly untested and `X-Admin` is never asserted

### Deferred

- [x] [Review][Defer] AC 2.1.13 ESLint not added - deferred, needs a network install that rewrites the manifest and lockfile
- [x] [Review][Defer] No `package-lock.json` - deferred, same approval gate; a cloning participant's install floats on `^` ranges
- [x] [Review][Defer] Server-side per-field errors land in the page banner rather than the field's `aria-describedby` slot, though signal forms' `setSubmissionErrors` supports it - deferred, a larger design change than this story
- [x] [Review][Defer] Neither read-error state offers a retry, so a transient failure wedges the route until navigation - deferred, `EXPERIENCE.md` specifies fixed copy and no retry control
- [x] [Review][Defer] `API_BASE` hardcoded to localhost with `production` as the default build configuration - deferred, correct for the workshop
- [x] [Review][Defer] A non-Latin-1 employee id may make every request fail at the header layer - deferred, unverified without a live reproduction
- [x] [Review][Defer] The menu resource is never reloaded, so a dish vanishing after load yields a message containing a raw UUID - deferred, needs a product decision on menu freshness

### Dismissed as noise

Double-submit on either form - signal forms' `submit()` guards re-entry at `_validation_errors-chunk.mjs:1606`. The menu `<option>` list mutating under a live selection - unreachable, the resource is never reloaded today.

## Deviations from ELCAi (accepted for the workshop repo)

- **No Jira ticket / no `Analyzed` transition** — the workshop repo does not use Jira. `_bmad/custom/config.toml` sets `jira_project_key = "RHBGAF"` with both Confluence spaces `LOCAL-ONLY`.
- **Sprint state is tracked in two places** — `sprint-status.yaml` and this file's `Status` field. Keep them in step; the yaml is what the SM and Dev skills read.
- **No `tech-spec-epic-2.md`** — Feature 2's technical framing now lives in `_bmad-output/planning-artifacts/architecture.md` and the spine, which supersede the backend-only `docs/tech-spec.md`.
- **No Feature anchor files** — the ELCAi analyst workflow expects `{planning_artifacts}/features/2-*/feature.md` and `design.md`. This repo has a flat `epics.md` instead. This story was written against the architecture spine in their place.
- **`main` as base branch** — trunk-based, not the `develop` branch the ELCAi CI/CD guides assume.
- **SonarQube guardrails not applicable** — no on-prem Sonar for this repo. `@angular-eslint` (AC 2.1.13) is the closest analog and is now a DoD gate.
- ~~**Filename breaks the ELCAi convention**~~ — **resolved 2026-09-03.** This file and its companion were renamed from `story-2-1-…` to `2-1-frontend-v1.{md,context.xml}` with `git mv`, matching the analyst convention `{feature}-{story}-{slug}` and restoring `bmad-dev-story`'s `{story_key}.md` auto-discovery. All ten stories now use one naming scheme.

## No longer applicable

Recorded so a reader of the git history is not confused:

- The **sub-story split** into 2.1.a–2.1.d (scaffold / order form / admin / polish) is dropped. It existed because 8 CP was too large for one dev cycle; at 3 CP the story fits, and six of the thirteen ACs arrive satisfied.
- **React-specific constraints** are void: `useState` + `useEffect`, native `fetch`, `react-router-dom`, `@testing-library/react`, the Vite `react-ts` ESLint config, and the `frontend/` path.
