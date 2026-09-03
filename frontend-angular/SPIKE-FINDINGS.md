# Angular spike — findings (story 2.1)

> **Preserved verbatim from the spike's original `DESIGN.md`** (branch `spike/story-2-1-angular`, commit `6aadae6`),
> moved here on 2026-09-03 when AC 2.1.10's design step produced the real `DESIGN.md` and `EXPERIENCE.md` spines.
>
> This is an **engineering evaluation report**, not a design specification. It records what the spike
> learned about the official Angular Agent Skills — including two defects in their own reference material.
> Kept because that knowledge is worth more than the file name it happened to occupy.

---

# Angular spike — story 2.1 rebuilt

**Not story 2.1's deliverable.** Story 2.1 specifies React + Vite + TypeScript. This is an
instructor spike that rebuilds the same five backend surfaces in Angular 21 to evaluate the
official Angular Agent Skills (`angular-developer`, `angular-new-app`) inside Claude Code. It lives
on `spike/story-2-1-angular` in `frontend-angular/` so the real story's `frontend/` path stays free.

## What was built

The same functional scope as AC 2.1.3 – 2.1.9, on three routes:

| Route     | View                                 | Backend calls                                               |
| --------- | ------------------------------------ | ----------------------------------------------------------- |
| `/`       | Today's menu + order form            | `GET /api/v1/menu`, `POST /api/v1/orders`                   |
| `/orders` | My orders, newest first, with Cancel | `GET /api/v1/orders/me`, `PATCH /api/v1/orders/{id}/cancel` |
| `/admin`  | Add a menu item                      | `POST /api/v1/menu/items`                                   |

## Design decisions

- **Dev server on port 5173.** `WebConfig` allows exactly one origin, `http://localhost:5173`. Rather
  than touch backend code (story constraint), `npm start` is pinned to `ng serve --port 5173` and the
  API is called at its absolute URL. A dev-server proxy would also work and would make the port
  irrelevant; the pinned port was chosen because it exercises the CORS config that already exists.
- **`httpResource` for reads, `HttpClient` for mutations.** The skill states this rule explicitly.
  Reads therefore expose `isLoading()` / `error()` / `hasValue()` signals with no manual subscription
  bookkeeping; `reload()` is what refreshes the list after a cancel.
- **Headers come from an interceptor, not from callers.** `identity-headers-interceptor` adds
  `X-User-Id` when an identity is set, and `X-Admin: true` **only when the router is on `/admin`**.
  Deriving the admin header from the active route rather than from stored state makes AC 2.1.8's
  "admin only on /admin" true by construction — no component can opt in.
- **Identity in a signal, persisted via `effect`.** `localStorage` reads/writes are wrapped in
  try/catch so private-browsing mode degrades to a non-persistent session instead of throwing.
- **Lazy-loaded routes.** Each view is its own bundle chunk (confirmed in the build output), per the
  skill's "implement lazy loading for feature routes".
- **Forms: mixed on purpose.** `/` uses classic reactive forms; `/admin` uses **signal forms**. That
  split is the experiment, not an oversight — see "Two passes" below. The reactive-forms version of
  `/admin` is preserved at commit `1efbf48` for comparison.
- **`OnPush` everywhere**, `input()` over `@Input()`, native `@if`/`@for` control flow, `inject()` over
  constructor injection — all from the skill's best-practice list.

## Known gaps

- **Order item names.** `Order` carries `menuItemId`, not a name, so `/orders` fetches the menu to
  resolve labels. `GET /menu` returns _available_ items only, so an order for a since-unavailable item
  falls back to a truncated id. Resolving it properly means one `GET /menu/{id}` per order — that is
  exactly story 2.7's endpoint, so the fix is available but costs N requests.
- **No linter.** The Angular 21 scaffold ships Prettier, not ESLint. `npx prettier --check` is the
  closest analogue to story 2.1's `npm run lint` DoD item; `ng lint` would need `ng add @angular-eslint/schematics`.
- **Thin test coverage on two of the three routes.** `menu-page.spec.ts` covers the AC 2.1.3 happy path
  (names + CHF formatting); `admin-page.spec.ts` covers success, the 403 message-not-code path, and the
  required-name guard. The order-submit and cancel paths are untested.
- **No manual browser smoke.** Requires a human with both servers up.

## Verification

```
npx ng build              # clean; 3 lazy route chunks
npx ng test --watch=false # 2 files, 4 tests, passing
npx prettier --check src  # clean
```

The API contract was additionally verified end to end against a running backend: all five endpoints,
the 403 `NOT_ADMIN` error shape, and an `OPTIONS` preflight confirming
`access-control-allow-origin: http://localhost:5173`.

## Two passes: reference-file vs skill

The spike was built twice, and the difference is the point.

|                        | Pass 1 (`1efbf48`)                                                              | Pass 2 (`8089095`, `/admin` only)                                                                     |
| ---------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| How the skill was used | one reference file read by hand (`cat http-client.md`); `SKILL.md` never loaded | `angular-developer` invoked, which then pulled `signal-forms.md` and `testing-fundamentals.md` itself |
| Forms                  | reactive forms, `FormBuilder`                                                   | signal forms, `form()` + `submit()`                                                                   |
| Validation             | validators on controls                                                          | declared in the form schema                                                                           |
| Template constraints   | `min` / `step` attributes                                                       | banned on `[formField]`; moved into the schema                                                        |
| Mutation               | `.subscribe({next, error})`                                                     | `async` callback + `firstValueFrom` (async submit is mandatory)                                       |
| Accessibility          | error banner only                                                               | per-field messages + `aria-invalid` + `aria-describedby`                                              |
| Tests                  | 1                                                                               | 4 (success, 403 message-not-code, required-name guard)                                                |

Invoking the skill changed the idiom substantially. Reading one of its files did not.

## Findings on the Angular skills themselves

- They are plain Agent Skills — `SKILL.md` with `name` + `description` frontmatter plus a
  `references/` directory of 40 on-demand files. Claude Code picked them up from `.claude/skills/`
  with no adaptation, despite the docs naming only Gemini CLI and Antigravity.
- The reference material was genuinely load-bearing: `http-client.md` is what produced the
  httpResource-for-reads / HttpClient-for-mutations split and the functional-interceptor shape.
- **Bug in the skill:** `references/http-client.md` shows a service annotated `@Service()`. Angular has
  no `@Service` decorator — it is `@Injectable()`. Copying that example verbatim would not compile.
- `angular-new-app` assumes a globally installed `ng` and offers `npm install -g @angular/cli`. On a
  machine whose Node is too old for the newest CLI, that is the wrong move; pinning via
  `npx @angular/cli@21` was needed instead. The skill has no notion of Node/CLI version negotiation.
- **The CLI's generated config contradicts the skill.** `ng new --ai-config=claude` writes
  `.claude/CLAUDE.md` saying _"Prefer Reactive forms instead of Template-driven ones"_ and never
  mentions signal forms. `angular-developer/SKILL.md` says prefer signal forms on v21+. Two official
  Google artifacts in one project disagree, and the stale one is the one the CLI installs
  automatically — pass 1 followed it and produced the older idiom. If you adopt these skills, the
  generated `CLAUDE.md` needs reviewing rather than trusting.
- **Its testing guidance is wrong in two places.** `testing-fundamentals.md` states "Do NOT use
  `fixture.detectChanges()`" and to rely on `whenStable()`. In practice:
  - `httpResource` needs a `detectChanges()` to fire its request; awaiting `whenStable()` first
    deadlocks against the request nothing has answered yet.
  - After `flush()`, an `async` submit callback's continuation runs in a later microtask, so
    `whenStable()` settles _before_ the signals are written. An explicit yield is required.

  Both cost a red test run. Neither is mentioned in the reference.

- **Bundle cost is not discussed.** Signal forms added 34 kB raw to the `/admin` lazy chunk
  (2.40 kB → 36.51 kB; 1.09 kB → 10.06 kB transfer) for a two-field form. The skill recommends them
  unconditionally on v21+ with no note on weight.

## Verdict for the workshop

Worth showing. The skills are a clean, real-world example of the format generalising beyond
Anthropic's own tooling, and the reference material is mostly high quality and genuinely load-bearing.
But this spike also demonstrates why an agent's output still needs review: two of the skill's
documented examples do not work as written, and its own vendor's generated config contradicts it.
