---
name: Lunch Order — Internal Tool
description: Utilitarian internal SPA for browsing today's lunch menu, placing/cancelling orders, and (admin) adding menu items. Fast path draft — visual choices below are [ASSUMPTION]s, ready to tweak.
colors:
  background: '#f7f7f8'
  surface: '#ffffff'
  surface-alt: '#eef0f2'
  border: '#d8dbe0'
  text: '#1a1d21'
  text-muted: '#5b6169'
  primary: '#2563eb'
  on-primary: '#ffffff'
  danger: '#dc2626'
  danger-bg: '#fdecec'
  success: '#16a34a'
  success-bg: '#eafaf0'
typography:
  heading:
    fontFamily: system-ui, sans-serif
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.3'
  subheading:
    fontFamily: system-ui, sans-serif
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1.4'
  body:
    fontFamily: system-ui, sans-serif
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label:
    fontFamily: system-ui, sans-serif
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: 0.04em
rounded:
  sm: 4px
  md: 8px
  full: 9999px
spacing:
  unit: 8px
  gutter: 16px
  section-gap: 32px
components:
  button-primary:
    background: '{colors.primary}'
    color: '{colors.on-primary}'
    rounded: '{rounded.sm}'
  button-danger:
    background: 'transparent'
    color: '{colors.danger}'
    border: '1px solid {colors.danger}'
    rounded: '{rounded.sm}'
  input:
    border: '1px solid {colors.border}'
    rounded: '{rounded.sm}'
    background: '{colors.surface}'
  card:
    background: '{colors.surface}'
    border: '1px solid {colors.border}'
    rounded: '{rounded.md}'
  banner-error:
    background: '{colors.danger-bg}'
    color: '{colors.danger}'
    rounded: '{rounded.sm}'
  banner-success:
    background: '{colors.success-bg}'
    color: '{colors.success}'
    rounded: '{rounded.sm}'
---

> Fast-path draft for story 2.1. Visual tokens above marked as assumptions where not dictated by the story — adjust freely, nothing here is load-bearing for the ACs.

## Brand & Style

No brand to express — this is an internal CRUD tool for ordering lunch, used by ELCA employees and one canteen admin. The posture is **plain and fast**: clear text, obvious controls, zero decoration. Optimize for "can I order lunch in 10 seconds," not visual polish. [ASSUMPTION]

## Colors

- **{colors.background}** — page background, keeps content areas visually distinct from the app chrome. [ASSUMPTION]
- **{colors.surface}** / **{colors.surface-alt}** — card and table-row surfaces on top of the background.
- **{colors.primary}** — the one accent color, used only for primary actions (submit order, add item). Standard "actionable blue," nothing brand-specific. [ASSUMPTION]
- **{colors.danger}** — Cancel button outline and error banners. Outline only (not filled) so Cancel doesn't visually compete with the primary submit action.
- **{colors.success}** — brief cancel-confirmation banner (AC 2.1.6).
- **{colors.text}** / **{colors.text-muted}** — body text / secondary text (timestamps, empty states).

## Typography

System font stack only — no webfont loading for an internal tool. Three sizes cover every screen: `{typography.heading}` (page titles), `{typography.subheading}` (section titles, e.g. "Today's Menu"), `{typography.body}` (everything else). `{typography.label}` (uppercase, tracked) is for form field labels only.

## Layout & Spacing

Single-column, max-width ~720px centered layout on all three routes — this is a form-and-list tool, not a dashboard, so no multi-column grid. `{spacing.gutter}` between list items/cards; `{spacing.section-gap}` between major sections (e.g. between the menu list and the order form). Mobile: no separate breakpoint needed for v1 — the single-column layout already degrades gracefully to narrow viewports.

## Shapes

`{rounded.sm}` on inputs, buttons, and banners — a small, utilitarian softening, not a design statement. `{rounded.md}` on cards (menu items, order rows) to visually group them as discrete units. No `full`/pill shapes — this app has no chips or avatars.

## Components

- **App shell / nav** — top bar with three text links (Menu · My Orders · Admin) plus the "Sign in as" identity input (§ Identity below), persistent across all routes.
- **Identity input** — single text field, label "Sign in as", value persisted to `localStorage`; always visible in the top bar, not a separate screen.
- **Menu list (`/`)** — one `{components.card}` per item: name (`{typography.body}`, bold) + price right-aligned as `CHF {priceChf}`. No availability badge (API returns available items only — see story's AC 2.1.3 note).
- **Order form (`/`, below the menu list)** — a menu-item `<select>`, a quantity `<input type="number">` (1–10), one `{components.button-primary}` labeled "Order".
- **My orders list (`/orders`)** — one `{components.card}` per order: resolved item name, quantity, a status pill (`SUBMITTED` in `{colors.text}`, `CANCELLED` in `{colors.text-muted}` with strikethrough), and a `{components.button-danger}` "Cancel" shown only when status is `SUBMITTED`. Newest first.
- **Admin add-item form (`/admin`)** — two inputs (name, priceChf) stacked, one `{components.button-primary}` labeled "Add item".
- **Error banner** — one `{components.banner-error}` per page, shown inline above the relevant form/list when a request fails; renders `ApiError.message` verbatim. Auto-dismiss not required — a transient app, reload/retry is an acceptable dismissal.
- **Cancel confirmation** — one `{components.banner-success}`, auto-dismisses after ~3s (AC 2.1.6 "brief confirmation").

## Do's and Don'ts

- **Do** keep every screen a single column, form-first — this is a utility, not a marketing surface.
- **Do** use `{colors.primary}` for exactly one action per screen (the "do the main thing" button) so it stays meaningful.
- **Don't** add icons, illustrations, or imagery — nothing in the story calls for them and they add zero functional value here.
- **Don't** introduce a second accent color — Cancel stays an outlined `{colors.danger}` button, never a filled one, so there is never a screen with two competing "important" buttons.
- **Don't** build a UI state for "unavailable" menu items — the API cannot return them (AC 2.1.3), so there is nothing to design for.
