---
name: Lunch Order
description: An editorial print-menu identity for an internal canteen ordering client — warm paper, ink, one vermillion accent, square corners, no web fonts. Light and dark.
status: final
created: '2026-09-03'
updated: '2026-09-03'
sources:
  - 'ratified from: frontend-angular/src/styles.css, app.css, routes/menu-page/menu-page.css @ spike/story-2-1-angular'
  - _bmad-output/planning-artifacts/architecture/ARCHITECTURE-SPINE.md
  - _bmad-output/implementation-artifacts/2-1-frontend-v1.md
companions:
  - EXPERIENCE.md
colors:
  paper: '#f5f2eb'
  paper-deep: '#ebe6db'
  ink: '#16120f'
  ink-soft: '#5c5248'
  rule: '#ddd6c8'
  rule-strong: '#bcb2a0'
  accent: '#b1341c'
  accent-soft: '#f0d9c8'
  ok: '#2f6b3d'
  paper-dark: '#1c1714'
  paper-deep-dark: '#13100e'
  ink-dark: '#f0ebe1'
  ink-soft-dark: '#a89c8d'
  rule-dark: '#332b25'
  rule-strong-dark: '#4d4238'
  accent-dark: '#e8674a'
  accent-soft-dark: '#3a1f17'
  ok-dark: '#6bbf7f'
typography:
  display:
    fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, 'Iowan Old Style', Georgia, serif"
    fontWeight: '400'
  body:
    fontFamily: "Candara, Optima, 'Gill Sans', 'Segoe UI', sans-serif"
    fontSize: 1rem
    lineHeight: '1.55'
  wordmark:
    fontFamily: '{typography.display.fontFamily}'
    fontSize: 2.6rem
    lineHeight: '1'
    letterSpacing: '-0.015em'
  section:
    fontFamily: '{typography.display.fontFamily}'
    fontSize: 1.9rem
    letterSpacing: 0.01em
  dish:
    fontFamily: '{typography.display.fontFamily}'
    fontSize: 1.1rem
  label:
    fontSize: 0.72rem
    letterSpacing: 0.12em
  nav:
    fontSize: 0.74rem
    letterSpacing: 0.14em
  action:
    fontSize: 0.78rem
    letterSpacing: 0.16em
  price:
    fontSize: 0.95rem
  field-error:
    fontSize: 0.85rem
rounded:
  DEFAULT: '0'
spacing:
  measure: 40rem
  sheet-pad: 2rem 2.25rem 2.5rem
  sheet-pad-narrow: 1.5rem 1.25rem 1.75rem
  page-pad: 2.5rem 1.5rem 4rem
  row-y: 0.55rem
  breakpoint-narrow: 34rem
components:
  wordmark-rule:
    height: 2px
    ink-run: 3.5rem
    accent-run: 1.1rem
    trailing: '{colors.rule}'
  dish-row:
    name: '{typography.dish}'
    leader: 1px dotted {colors.rule-strong}
    price: '{typography.price}'
  button-primary:
    background: '{colors.ink}'
    color: '{colors.paper}'
    border: 1px solid {colors.ink}
    radius: '{rounded.DEFAULT}'
    hover-background: '{colors.accent-soft}'
    hover-color: '{colors.ink}'
    hover-lift: -1px
  button-quiet:
    background: transparent
    color: '{colors.ink-soft}'
    border: 1px solid {colors.rule-strong}
    radius: '{rounded.DEFAULT}'
    hover-color: '{colors.ink}'
  button-confirm:
    background: transparent
    color: '{colors.accent}'
    border: 1px solid {colors.accent}
    radius: '{rounded.DEFAULT}'
    hover-background: '{colors.accent-soft}'
  row-armed:
    border-left: 3px solid {colors.accent}
    background: '{colors.accent-soft}'
  field:
    background: '{colors.paper}'
    border: 1px solid {colors.rule-strong}
    radius: '{rounded.DEFAULT}'
    hover-border: '{colors.ink-soft}'
    invalid-border: '{colors.accent}'
  field-error:
    color: '{colors.accent}'
    font: '{typography.field-error}'
    min-height: 1.1rem
  error-banner:
    color: '{colors.accent}'
    background: '{colors.accent-soft}'
    border: 1px solid {colors.accent}
    radius: '{rounded.DEFAULT}'
  confirmation:
    color: '{colors.ok}'
    border-left: 3px solid {colors.ok}
  focus-ring:
    outline: 2px solid {colors.accent}
    offset: 2px
---

# DESIGN.md — Lunch Order

**Ratified, not invented.** The light palette and every type role were read out of the adopted spike's CSS. This spine's job is to make the identity explicit and enforceable — because an audit found it applied to only one of three routes.

Companion: **[EXPERIENCE.md](EXPERIENCE.md)** owns how it *works* — information architecture, states, interactions, accessibility, flows. This file owns how it *looks*. Both win over any mock or later restyle.

Spike engineering findings, previously in this file, are preserved in **[SPIKE-FINDINGS.md](SPIKE-FINDINGS.md)**.

## Brand & Style

A printed menu sheet, not a web app.

The client is an internal tool used for ninety seconds a day, so it earns no loading spinners, no cards, no shadows-as-decoration. Instead it borrows the one visual language everybody already associates with choosing lunch: the paper menu. Warm off-white ground with a faint horizontal grain. A serif that ships with the operating system, set at book weight. Dish names on the left, a dotted leader running across, the price on the right. One vermillion accent, used sparingly enough that it still means something when it appears.

The posture is quiet and confident. Nothing pulses, nothing gradients, nothing rounds. Corners are square because printed sheets have square corners.

**Two hard consequences of this posture**, both already true in the code and both non-negotiable:

- **No web fonts.** The display and body families are OS-shipped stacks. The frontend makes no font request and adds no font dependency. A `@font-face` or a Google Fonts link would violate this.
- **No component library.** No Tailwind, no Material, no shadcn. Component-scoped CSS against the tokens above. Introducing a library would import a competing visual system.

## Colors

Nine roles, in two palettes. Every colour in the application resolves to one of them.

### Light — the default

| Role | Value | What it is for | What it is **not** for |
| --- | --- | --- | --- |
| `paper` | `#f5f2eb` | The menu sheet; input and select grounds | The page behind the sheet |
| `paper-deep` | `#ebe6db` | The page canvas behind the sheet, carrying the grain | Any surface text is read off directly |
| `ink` | `#16120f` | Body text, dish names, the wordmark, primary button ground | Anything secondary — too strong |
| `ink-soft` | `#5c5248` | Labels, nav at rest, kickers, italic state text | Body copy |
| `rule` | `#ddd6c8` | Hairlines, table row separators, the sheet border | Dotted leaders — they need more contrast |
| `rule-strong` | `#bcb2a0` | Dotted leaders, field borders, the segmented divider | Text of any size |
| `accent` | `#b1341c` | Active nav, the wordmark's accent run, focus ring, **all error state**, the armed-row confirm | Anything routine. Its scarcity is the point |
| `accent-soft` | `#f0d9c8` | Primary button hover, error-banner ground, armed-row ground | Text — it fails contrast against paper |
| `ok` | `#2f6b3d` | Confirmation text and its left border | A success button, a badge, a chip |

### Dark

Not an inversion — a re-grounding. The paper becomes a dark warm brown-black rather than neutral grey, so the metaphor survives: unlit paper, not a different material. The accent has to **lift** to stay legible, and the near-black ink becomes a warm off-white.

| Role | Light | Dark | Note |
| --- | --- | --- | --- |
| `paper` | `#f5f2eb` | `#1c1714` | Warm, never `#000` or a neutral grey |
| `paper-deep` | `#ebe6db` | `#13100e` | Canvas stays *darker* than the sheet — same relationship, inverted lightness |
| `ink` | `#16120f` | `#f0ebe1` | Warm off-white, not pure white |
| `ink-soft` | `#5c5248` | `#a89c8d` | ~6.4:1 on the dark sheet |
| `rule` | `#ddd6c8` | `#332b25` | |
| `rule-strong` | `#bcb2a0` | `#4d4238` | Leaders stay visible without glowing |
| `accent` | `#b1341c` | `#e8674a` | **Lifted deliberately** — `#b1341c` on `#1c1714` fails AA. ~5.1:1 |
| `accent-soft` | `#f0d9c8` | `#3a1f17` | Error/armed ground. `accent-dark` on it is ~4.5:1 |
| `ok` | `#2f6b3d` | `#6bbf7f` | ~7.7:1 |

**The grain and the shadow both change.** On dark, the canvas grain lightens instead of darkening — `rgba(240, 235, 225, 0.02)` — and the sheet's drop shadow is nearly useless against a dark ground, so depth comes from the `paper` / `paper-deep` tonal step alone. Do not deepen the shadow to compensate; it reads as a black smear.

**Implementation.** One token set, redefined under a media query — components never branch on theme:

```css
:root { --paper: #f5f2eb; /* … light … */ }

@media (prefers-color-scheme: dark) {
  :root { --paper: #1c1714; /* … dark … */ }
}
```

**System preference only.** There is no in-app theme toggle and none is planned: a toggle needs persisted state, a control in the shell, and a decision about what to do on first load, none of which this tool earns. `prefers-color-scheme` is the whole mechanism.

> **Contrast figures above are computed, not measured.** Verify each pair with a contrast checker before ticking the dark-mode AC. The `accent-dark` on `accent-soft-dark` pair is the tightest at roughly 4.5:1 — if it measures below 4.5, lighten `accent-dark` rather than darkening the ground, which would break the error banner's border.

## Typography

Two families, both OS-resident. The serif carries content; the sans carries chrome.

| Role | Family | Where |
| --- | --- | --- |
| `wordmark` | display, 2.6rem, tight | The one `h1`, in the shell header |
| `section` | display, 1.9rem | Route headings (`h2`) |
| `dish` | display, 1.1rem | Menu item names — the content that matters most |
| `body` | body, 1rem / 1.55 | Prose, table cells, state messages |
| `label` | body, 0.72rem, `0.12em`, uppercase | Form labels, the identity field label |
| `nav` | body, 0.74rem, `0.14em`, uppercase | Shell navigation |
| `action` | body, 0.78rem, `0.16em`, uppercase | Buttons |
| `price` | body, 0.95rem, tabular | Prices only |
| `field-error` | body, 0.85rem | Per-field validation messages |

**The rules:**

- **Serif for content, sans for chrome.** A dish name is content. A button label is chrome. Never set a dish name in the body family.
- **Uppercase plus letterspacing is reserved for chrome.** Labels, nav, buttons. Never a message, never body copy, never a heading.
- **Prices are tabular.** `font-variant-numeric: tabular-nums`, so the right-aligned column stays aligned across rows. This is the whole reason the dotted leader reads as a leader.
- **Display weight is always 400.** The serif is never bolded; size and family carry the hierarchy.

## Layout & Spacing

One measure: **40rem**, centred. The shell and the sheet share it.

There is no grid and no multi-column layout at any viewport width. A printed menu is a single column, and widening it would break the leader mechanic — the dotted rule needs a bounded span to read as a leader rather than as filler.

| Token | Value | Where |
| --- | --- | --- |
| `measure` | `40rem` | Shell container and sheet max-width |
| `page-pad` | `2.5rem 1.5rem 4rem` | Body padding around the sheet |
| `sheet-pad` | `2rem 2.25rem 2.5rem` | Inside the sheet, at width |
| `sheet-pad-narrow` | `1.5rem 1.25rem 1.75rem` | Inside the sheet, below the breakpoint |
| `row-y` | `0.55rem` | Vertical rhythm of a dish row |

**One breakpoint: `34rem`.** Below it, sheet padding tightens and the form's two-column `label / field` grid collapses to a single column. Nothing else changes — no hamburger, no drawer, no reflow. Three nav links fit at any width.

## Elevation & Depth

Almost none, and never for emphasis.

In **light**, the sheet gets exactly one shadow — `0 18px 40px -28px rgba(20, 17, 15, 0.55)` — a low, wide, heavily-offset blur that reads as paper resting on a surface rather than as a floating card. Depth is otherwise tonal: `paper` on `paper-deep`, plus a faint 4px repeating gradient giving the canvas its grain.

In **dark**, drop the shadow entirely. The tonal step between `paper-deep-dark` and `paper-dark` does the work.

Two subtleties worth preserving in both themes:

- The sheet's top-left corner carries a barely-visible radial darkening, so the paper does not read as perfectly flat.
- The canvas grain is near-invisible by design. It should be felt, not seen.

**No shadow on any other element, in either theme.** No hover shadow, no focus shadow, no button shadow. Emphasis is the accent's job.

## Shapes

**`border-radius: 0`. Everywhere. No exceptions.**

Buttons, inputs, selects, banners, the sheet. This is the single easiest rule to break by accident — every UI library and most generated CSS defaults to a rounded corner, and one `4px` is enough to make the page look like a web form pretending to be a menu.

`ErrorBanner` currently carries `border-radius: 4px` and must lose it.

## Components

| Component | Anatomy | Visual spec |
| --- | --- | --- |
| **Wordmark** | `h1` + a 2px rule beneath | The rule runs `ink` for `3.5rem`, `accent` for `1.1rem`, then `rule` to the end. One deliberate flourish, echoing the leaders below. Do not centre it, do not add a logo. |
| **Nav link** | Uppercase sans, letterspaced | At rest `ink-soft`; hover `ink`; active `accent` with a 1px accent underline. `0.16s` colour transition, disabled under reduced motion. |
| **Dish row** | name · leader · price | Baseline-aligned flex. The leader is `1px dotted rule-strong`, `flex: 1 1 auto`, nudged `-0.28rem` onto the baseline, and **`aria-hidden`** — it is decoration. |
| **Field** (input, select) | — | `paper` ground, `1px solid rule-strong`, radius 0, `0.5rem 0.6rem`. Hover raises the border to `ink-soft`. Invalid-and-touched raises it to `accent`. Inherits the body font — never a browser default. |
| **Field error** | `role="alert"`, `aria-describedby` target | `accent` text at `0.85rem`, directly beneath its field, with `min-height: 1.1rem` reserved so validation never shifts layout. |
| **Primary button** | — | `ink` ground, `paper` text, uppercase letterspaced. Hover inverts to `accent-soft` ground with `ink` text and a `-1px` lift. Disabled drops to `0.55` opacity with a default cursor. |
| **Quiet button** | — | Transparent ground, `ink-soft` text, `1px solid rule-strong`. The escape half of a two-step confirm ("Keep"). Never the primary action on a surface. |
| **Confirm button** | — | Transparent ground, `accent` text, `1px solid accent`; hover fills with `accent-soft`. Used **only** as the second step of a destructive two-step. It is the one place the accent appears on an interactive control. |
| **Armed row** | a table row mid-confirmation | `3px solid accent` left border and an `accent-soft` ground, so the row being acted on is unmistakable at a glance. Exactly one row may be armed at a time. |
| **Error banner** | `role="alert"` | `accent` text, `accent-soft` ground, `1px solid accent`, **radius 0**. One instance per surface, placed directly below the control that failed. |
| **Confirmation** | `role="status"` | `ok` text with a `3px solid ok` left border and `0.7rem` of left padding. **This treatment applies on every route** — not text-only on some and bordered on others. |
| **Segmented divider** | — | `repeating-linear-gradient(90deg, rule-strong 0 6px, transparent 6px 12px)` — a dashed rule separating the menu from the order form. Echoes the leader at a different rhythm. |
| **Focus ring** | — | `2px solid accent` at `2px` offset, defined **once** globally on `:focus-visible`. No component overrides it. |

## Do's and Don'ts

**Do**

- Resolve every colour, border and radius through a token. `var(--token)`, never a hex literal — this is what makes dark mode free.
- Set dish names and headings in the display serif; everything chrome in the body sans.
- Keep prices tabular and right-aligned.
- Give every animation a `prefers-reduced-motion: reduce` escape, in the same file that declares it.
- Let the accent stay scarce. If it appears three times on one screen, one of them is wrong.
- Check both themes before opening a PR. A hard-coded hex looks fine in light and breaks in dark.

**Don't**

- **Don't hard-code a hex.** Two of three route stylesheets and the shared `ErrorBanner` currently do, with four off-palette values between them. That is the defect this spine exists to close — and it is what would make dark mode impossible.
- **Don't round a corner.** Radius is `0`.
- **Don't branch a component on theme.** Redefine tokens under `prefers-color-scheme`; components stay theme-blind.
- **Don't add an in-app theme toggle.** System preference is the whole mechanism.
- **Don't add a web font**, a `@font-face`, or a font CDN link.
- **Don't add Tailwind, Material, shadcn, or any component library.**
- **Don't add a shadow** to anything but the sheet — and not even there in dark.
- **Don't give the same component two appearances on different routes.** `.confirmation` currently has exactly that problem.
- **Don't build an availability indicator.** `GET /api/v1/menu` returns available items only, so it would read "available" on every row forever. A restyle already made this mistake once — see story 2.1 AC 2.1.3.
- **Don't introduce a second red.** Error state is `accent` on `accent-soft`, in both themes.
