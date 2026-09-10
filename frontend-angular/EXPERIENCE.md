---
name: Lunch Order
description: Information architecture, states, interactions, accessibility floor and key flows for the Angular client. Peer to DESIGN.md.
status: final
created: '2026-09-03'
updated: '2026-09-03'
sources:
  - 'ratified from: frontend-angular/src/app/**/*.html and *.ts @ spike/story-2-1-angular'
  - _bmad-output/planning-artifacts/architecture/ARCHITECTURE-SPINE.md
  - _bmad-output/implementation-artifacts/2-1-frontend-v1.md
  - '_bmad-output/planning-artifacts/prd.md §1.3 (stakeholder roles behind the flow protagonists)'
companions:
  - DESIGN.md
---

# EXPERIENCE.md — Lunch Order

Owns how the client **works**. Visual tokens live in **[DESIGN.md](DESIGN.md)** and are referenced here as `{colors.accent}`, `{typography.label}` and so on. Both spines win over any mock, wireframe or later restyle.

Ratified from the adopted spike's templates. Where the code answered a question, that answer is recorded; where it didn't, the answer was decided on 2026-09-03 and is marked **decided** so a reader can tell ratification from choice.

## Foundation

**Form factor: desktop and tablet web, single measure.** Employees order from a work machine at their desk; the canteen admin edits the menu from the same. No mobile-specific surface, no native app, no offline mode. The one breakpoint at `{spacing.breakpoint-narrow}` handles a narrow window, not a phone.

**Theme follows the operating system.** Light and dark are both supported via `prefers-color-scheme` (DESIGN.md *Colors*). There is no in-app toggle — nothing in the UI mentions theme at all.

**No UI system.** Component-scoped CSS against DESIGN.md's tokens. Nothing to inherit from and no system defaults to override.

**Session model: there is no session.** Identity is a string the user types into a header field, held in a signal and mirrored to `localStorage`. There is no login, no logout, no password, no token, and no server-side session — the backend trusts the `X-User-Id` header completely (spine AD-9). The UI must never imply otherwise: no "Log out", no avatar, no "Welcome back".

**Admin is a route, not a role.** `X-Admin: true` is attached by an interceptor if and only if the router is under `/admin` (spine AD-10). There is no admin toggle, no permission check, and nothing to hide from non-admins — anyone can navigate to `/admin`. The UI must not pretend to gate it.

## Information Architecture

Three surfaces, flat. No nesting, no drawers.

```
Lunch Order  (shell: wordmark · nav · "Sign in as" field — persistent)
├── /          Menu        — today's dishes + order form
├── /orders    My orders   — own orders, newest first, cancel
└── /admin     Admin       — add a menu item
     *         → redirect to /
```

**The shell is persistent and holds identity.** The "Sign in as" field lives in the header, above the router outlet, on every route. That placement is deliberate: identity affects two of three surfaces, and burying it inside `/orders` would make `/` silently un-orderable.

**Every surface is reachable in one click from every other.** Three nav links, always visible, no overflow. This is why the IA must stay at three — a fourth surface is the point at which this pattern needs rethinking, not extending.

Surface closure holds: each stated need lands on exactly one surface, and each surface has a journey that reaches it.

| Need | Surface |
| --- | --- |
| See what's for lunch | `/` |
| Order something | `/` |
| Check what I ordered | `/orders` |
| Change my mind | `/orders` |
| Put a dish on the menu | `/admin` |

## Voice and Tone

Flat, lower-case, unadorned. The tool is used for ninety seconds a day and has no personality to project.

| Rule | Yes | No |
| --- | --- | --- |
| Sentence fragments, full stop | `Order submitted.` | `Your order has been submitted successfully!` |
| No exclamation marks, ever | `Order cancelled.` | `Order cancelled!` |
| Name the object, not the user | `You have no orders yet.` | `Looks like you haven't ordered anything!` |
| Present participle for pending | `Cancelling…` · `Adding…` | `Please wait` · `Processing your request` |
| An ellipsis character, not three dots | `Loading orders…` | `Loading orders...` |
| Confirm prompts name the thing | `Cancel this order?` | `Are you sure?` |
| Backend messages pass through verbatim | whatever `ApiError.message` says | a rewritten or prefixed version |

**Never surface an error code.** `ApiError.code` is for logs and tests; `ApiError.message` is the only field a user sees (spine AD-12). The one exception to pass-through is a *read* failure, where the raw message is unhelpful — `/orders` says `Could not load your orders.` instead.

The full copy deck:

| Surface | State | Copy |
| --- | --- | --- |
| `/` | empty | `No dishes on the menu today.` **(decided)** |
| `/` | loading | `Loading the menu…` |
| `/` | confirmed | `Order submitted.` |
| `/orders` | not-signed-in | `Enter an employee id in "Sign in as" above to see your orders.` |
| `/orders` | loading | `Loading orders…` |
| `/orders` | load-error | `Could not load your orders.` |
| `/orders` | empty | `You have no orders yet.` |
| `/orders` | armed | `Cancel this order?` with actions `Cancel order` / `Keep` **(decided)** |
| `/orders` | pending | `Cancelling…` |
| `/orders` | confirmed | `Order cancelled.` |
| `/admin` | pending | `Adding…` |
| `/admin` | confirmed | `Menu item added.` |
| `/` | load-error | `Could not load the menu.` **(added 2026-09-10 by code review)** |
| `/` | mutation-error, signed out | `Enter an employee id in "Sign in as" above to order.` **(added 2026-09-10 by code review)** |
| `/orders` | dish name unresolved | `Unknown dish` **(added 2026-09-10 by code review)** |

Uppercase letterspaced text is chrome only (`{typography.label}`, `{typography.nav}`, `{typography.action}`). A message is never uppercase.

## Component Patterns

Behavioural contracts. Visual specs are DESIGN.md's *Components* table.

| Pattern | Behaviour |
| --- | --- |
| **Identity field** | Uncontrolled text input in the shell. Every keystroke writes the signal; an `effect` mirrors it to `localStorage`. Every storage read and write is wrapped in `try/catch`, so private-browsing degrades to a non-persistent session rather than throwing. Empty value means no `X-User-Id` header is sent at all. |
| **Nav link** | `routerLinkActive`, with `{ exact: true }` on `/` only — otherwise the root link stays active on every route. |
| **Dish row** | Read-only. Not clickable, not selectable, not a link. Ordering happens in the form below, not by clicking a row. |
| **Form field** | Every field carries `aria-invalid` bound to touched-and-invalid, `aria-describedby` pointing at its own message element, and a message element with reserved height. **This applies to both forms** — see *Accessibility Floor*. |
| **Order form** | Reactive form. Submit blocked while `submitting()` or `invalid()`. On success the form resets and a confirmation appears; the menu is **not** reloaded, since ordering does not change it. |
| **Admin form** | Signal form with per-field validation. Submit disabled while `invalid()` or `submitting()`. |
| **Primary button** | Disabled during its own in-flight request, with its label swapped to the pending form (`Adding…`). Never disabled for any other reason — a disabled button with no explanation is a dead end. |
| **Row action (Cancel)** | Two-step. See *Destructive confirmation* below. Rendered only for `SUBMITTED` orders. |
| **Error banner** | One per surface, `role="alert"`, placed directly below the control that failed. Cleared at the start of every new attempt. |
| **Confirmation** | `role="status"`, appears below the control. Cleared at the start of every new attempt. Not auto-dismissed and not a toast — it persists until the next action. |

> **[ASSUMPTION] resolved 2026-09-10 — an invalid form does not disable its submit button.**
>
> This document said both things. *Order form*, *Admin form* and Flow 3 step 2 each state the
> submit button is disabled while the form is invalid; *Primary button* states it is disabled only
> during its own in-flight request and "never disabled for any other reason — a disabled button
> with no explanation is a dead end". Code review of 2026-09-10 resolved this in favour of
> *Primary button*: clicking an invalid form marks every field touched and reveals the per-field
> messages, which tells the employee why nothing happened. The three contrary statements are
> superseded and left in place only so the reasoning stays traceable.
>
> **This requires `novalidate` on the form.** The signal-forms validators are reflected onto the
> inputs as native `min`/`max`/`required` attributes, so native constraint validation would
> otherwise abort submission before the `submit` event fires — `submit()` would never run, no
> field would be marked touched, and the styled per-field message would never render.

> **Field-level validation copy is not in the deck above.** The six field messages (`Choose a dish.`, `Quantity must be between 1 and 10.`, `Name is required.`,
> `Name must be 100 characters or fewer.`, `Price is required.`, `Price cannot be negative.`)
> follow the same sentence-fragment style and each restates a backend constraint rather than
> inventing one. Added 2026-09-10 by code review.

**Mutations refresh by reload, never by local patch.** After a successful cancel, call `reload()` on the orders resource (spine AD-11). Never splice the cancelled row out of a local array — the server is the truth.

**The server owns ordering.** `GET /api/v1/orders/me` returns newest-first already. The client renders that order as received and must not re-sort (spine AD-18).

## State Patterns

Nine states. `/orders` is the reference implementation for all but `armed`, which is new.

| State | Trigger | Presentation |
| --- | --- | --- |
| **not-signed-in** | identity signal empty | A sentence pointing at the shell field. **The request is not made** — a `GET /orders/me` without the header would only be `400 MISSING_USER`. |
| **loading** | `isLoading()` | One line, `{colors.ink-soft}`, italic. No spinner, no skeleton. |
| **load-error** | `error()` on a read | Error banner with written copy, not the raw backend message. |
| **empty** | request succeeded, zero rows | A sentence. Not an illustration, not a call-to-action button. |
| **populated** | rows present | The content. |
| **armed** *(decided)* | destructive action clicked once | The row takes the armed treatment; its action cell swaps to a confirm and an escape. Exactly one row armed at a time. |
| **row-pending** | a mutation in flight on one row | That row's buttons disabled with a pending label; sibling actions blocked. |
| **mutation-error** | non-2xx from a write | Error banner below the control, carrying `ApiError.message` verbatim. Row disarms. |
| **confirmed** | 2xx from a write | Confirmation below the control. |

**Required of every data-backed surface.** Coverage after story 2.1's remaining work:

| Surface | not-signed-in | loading | load-error | empty | armed | mutation-error | confirmed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/orders` | ✅ | ✅ | ✅ | ✅ | **to build** | ✅ | ✅ |
| `/` | n/a (menu is public) | ✅ | ✅ | **to build** | n/a (nothing destructive) | ✅ | ✅ |
| `/admin` | n/a (no read) | n/a | n/a | n/a | n/a | ✅ | ✅ |

## Interaction Primitives

- **Click is the only pointer input.** No drag, no swipe, no long-press, no context menus.
- **No optimistic updates.** Every mutation waits for the server, then reloads. At this scale the latency is invisible and the truth is unambiguous.
- **No auto-refresh, no polling, no websockets.** The menu and the order list are fetched on navigation. Stale data is acceptable for ninety seconds.
- **Transitions are 0.16–0.18s, colour and 1px transform only.** Nothing animates layout. Everything animating is disabled under `prefers-reduced-motion`.
- **Menu rows stagger in once** on load (40–280ms, capped at the sixth row). Decorative; also motion-disabled.

### Destructive confirmation *(decided)*

Cancelling an order requires a confirm step. It is **inline and on the row**, not a modal dialogue:

1. The action cell shows **Cancel**.
2. One click **arms** the row: it takes the armed treatment (`{components.row-armed}`), and the cell swaps to **Cancel order** (confirm) and **Keep** (escape).
3. Focus moves to the confirm button. **Escape** disarms. **Keep** disarms. Arming a different row disarms this one — only one row is ever armed.
4. Confirming fires the `PATCH`; both buttons disable and the confirm label becomes `Cancelling…`.
5. Success reloads the list and shows `Order cancelled.` Failure shows the banner and disarms the row.

**Why inline rather than a modal.** A modal would be the only modal in the application, and it would drag in a focus trap, an escape handler, scroll locking, a backdrop, and a visual language — rounded corners, elevation, a centred overlay — that DESIGN.md rules out. The inline form keeps the decision on the object it affects and is fully keyboard-operable with no new machinery.

**Accessibility requirements specific to this pattern:**

- The confirm button needs an accessible name that identifies the *row*, not just the action — `aria-label="Cancel order of Risotto aux champignons"`. "Cancel order" alone is ambiguous in a table of rows, and a screen-reader user tabbing in has no visual row context.
- Arming is announced through a polite live region. Do not use `role="alert"` — arming is not an error.
- The armed state must be conveyed by more than the ground colour; the left border and the changed button labels both carry it.
- **`Keep` is the safe default.** If focus order or Enter-key handling is ever ambiguous, it must favour the non-destructive option.

## Accessibility Floor

Items marked ✅ are **already implemented** in the adopted code; the rest are decided and owed. This is the floor, not the target — new surfaces inherit all of it.

| Concern | Implementation |
| --- | --- |
| Live regions ✅ | `role="alert"` on error banners and per-field errors; `role="status"` on confirmations. A user who does not see the banner still hears it. |
| Landmarks ✅ | `<header>`, `<main>`, `<nav aria-label="Main">`. |
| Tables ✅ | `<th scope="col">` and a `<caption>` hidden with a proper `.visually-hidden` clip (not `display: none`, which would remove it from the accessibility tree). |
| Labels ✅ | Every input has a `<label for>`. The identity field included. |
| Decoration ✅ | The dotted leader carries `aria-hidden="true"` — a visual device with no content. |
| Focus ✅ | One global `:focus-visible` ring, `2px solid {colors.accent}` at `2px` offset. No component overrides or removes it. |
| Motion ✅ | `prefers-reduced-motion: reduce` honoured in every file that animates. |
| Pending state ✅ | Communicated by both a label change and the `disabled` attribute — never by colour alone. |
| **Field errors — both forms** *(decided)* | `aria-invalid` bound to touched-and-invalid, plus `aria-describedby` pointing at a message element that reserves its height so validation does not shift layout. **Implemented on `/admin`; owed on the order form.** The admin pattern is the standard — the order form currently surfaces errors only through the shared banner, with no field association. |
| **Row-level action naming** *(decided)* | Any per-row action's accessible name identifies its row, not just the verb. See *Destructive confirmation*. |
| **Both themes** *(decided)* | Contrast holds in light and dark. Dark-mode pairs in DESIGN.md are computed and must be verified with a checker before the theme AC is ticked. |

**Contrast notes.** `{colors.accent-soft}` is a background only; it fails contrast as text against `{colors.paper}`. `{colors.ink-soft}` is for labels and secondary text and should not be used below `0.72rem`.

## Key Flows

Protagonists are **named for readability; their roles are the PRD's** (§1.3 Stakeholder Register). The PRD defines roles, not named personas, and flags its own figures as fabricated for the dry-run — so treat the names as illustrative and the roles as binding.

| Protagonist | PRD stakeholder |
| --- | --- |
| Nadia | #3 On-site Employees |
| Marc | #3 On-site Employees |
| Priya | #2 Canteen Admin / Kitchen Lead |

### Flow 1 — Nadia orders lunch between two meetings

*On-site employee (#3).* It is 11:40, she has a call at noon, and she wants the risotto before it goes.

1. She opens the client. The menu sheet is already there — four dishes, names in serif, dotted leaders, prices right-aligned. Her machine is in dark mode, so the sheet is unlit paper rather than white.
2. Her employee id is still in "Sign in as" from yesterday, restored from `localStorage`. She does not have to think about identity at all.
3. She picks *Risotto aux champignons* and leaves quantity at 1.
4. She hits **Add to order**. The button reads `Submitting…` and disables.
5. **Climax.** `Order submitted.` appears beneath the form with its green left rule, and the form resets. Two seconds, no page change, no dialogue, no redirect. She is already back in her call.

What the flow must not do: navigate her away, open a dialogue, or make her confirm. **Ordering is not destructive — only cancelling is.**

### Flow 2 — Marc changes his mind, and is made to mean it

*On-site employee (#3).* He ordered the soup at 09:00 out of habit and now remembers he has a client lunch.

1. He clicks **My orders**. Identity is already set, so the table renders immediately — newest first, server-ordered.
2. Three rows. The top one is *Soupe du jour*, quantity 1, `SUBMITTED`, with a **Cancel** button. The two older `CANCELLED` rows have no button at all — the action simply is not there.
3. He clicks **Cancel**. The row **arms**: a vermillion left border, a tinted ground, and the cell now offers **Cancel order** and **Keep**. Focus lands on the confirm. Nothing has been sent yet.
4. **Climax.** He confirms. The label becomes `Cancelling…`, then the row's status flips to `CANCELLED`, its actions disappear, and `Order cancelled.` appears below the table. The list reloaded from the server rather than being patched locally, so what he sees is what the kitchen sees.
5. He never left the page, and never saw a dialogue.

**The variant that proves the design:** had he mis-clicked, one **Escape** would have disarmed the row with nothing sent. And if he somehow double-confirms, the second request returns `409 ALREADY_CANCELLED` and the banner shows the backend's message verbatim — the confirm step reduces that path, it does not replace the backend's guard.

### Flow 3 — Priya puts tomorrow's special on the menu

*Canteen admin / kitchen lead (#2).* A new dish needs to be orderable.

1. She clicks **Admin**. Navigating there is what grants her admin rights — the interceptor now attaches `X-Admin: true` to anything this surface sends (spine AD-10). Nothing in the UI marks her as privileged, because nothing in the backend knows who she is.
2. She types the dish name and price. Leaving the name blank and tabbing away surfaces a per-field message wired with `aria-invalid` and `aria-describedby`; the submit button is disabled while the form is invalid.
3. She fills both fields. The button enables, she submits, it reads `Adding…`.
4. **Climax.** `Menu item added.` appears below the form. The dish is live — the next employee to load `/` sees it.
5. She navigates back to **Menu** to check. Leaving `/admin` silently drops her admin header, and she is an ordinary user again.

**The failure worth designing for:** if she is somehow not admin, the backend returns `403 NOT_ADMIN` and the banner shows that message — not the code, and not a rewritten version.

## Responsive & Platform

One breakpoint, `{spacing.breakpoint-narrow}` (34rem):

- Sheet padding tightens to `{spacing.sheet-pad-narrow}`.
- The form's `label / field` grid collapses from two columns to one.

Nothing else responds. No hamburger, no drawer, no reflow of the table, no column hiding. Three nav links fit at every width the tool is used at.

**Theme** responds to `prefers-color-scheme`, with no toggle and no persisted preference (DESIGN.md *Colors*).

**Not supported and not planned:** print stylesheet, offline, i18n. The UI is English-only despite the French dish names in the seed data — the dishes are content, not copy.
