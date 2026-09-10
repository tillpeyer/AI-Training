# Deferred Work

Items raised by a review and consciously not actioned. Each one names why.

## Deferred from: code review of 2-1-frontend-v1 (2026-09-10)

- **AC 2.1.13 — no ESLint.** `ng add @angular-eslint/schematics` needs a network install that rewrites `package.json` and the lockfile, which is a gated action in this repo. The DoD's `npm run lint` gate stays unsatisfiable until it runs. Prettier is green in its place.
- **No `package-lock.json`.** `package.json` was authored to match the `node_modules` already present, so it builds here, but a participant cloning the repo installs against floating `^` ranges. Same approval gate as above; `npm install` would fix it.
- **Server-side per-field errors land in the page banner.** `INVALID_QUANTITY`, `INVALID_NAME` and `INVALID_PRICE` are per-field by construction and every field already has an `aria-describedby` slot. Signal forms' `setSubmissionErrors` supports routing them there. Deferred as a larger design change than this story carries.
- **No retry on a read failure.** `Could not load the menu.` and `Could not load your orders.` persist until navigation; neither resource is ever reloaded. `EXPERIENCE.md` specifies fixed copy and no retry control, so adding one is a spine change, not a fix.
- **`API_BASE` hardcoded to `http://localhost:8080/api/v1`, with `production` as the default build configuration.** Correct for the workshop; wrong for anything deployed.
- **A non-Latin-1 employee id may fail at the header layer.** `X-User-Id` is set verbatim from free text, and a plausible entry like `müller` is not a valid header byte-string. Raised as speculative — not reproduced against a live backend, so not patched blind.
- **The menu resource is never reloaded.** A dish that goes unavailable after page load yields `Menu item not found or unavailable: <uuid>` on submit, exposing a raw id, and the dead `<option>` stays selectable. Needs a product decision on menu freshness.
- **AC 2.1.5 has no manual proof.** `OrderService.submit` rejects unavailable items with 404 and nothing seeds orders, so an order against the seeded `available = false` *Soupe du jour* cannot be created through the API. The behaviour is covered by unit test only until an availability-toggle endpoint exists.
