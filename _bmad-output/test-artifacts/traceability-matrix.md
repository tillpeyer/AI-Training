---
stepsCompleted: ['step-01-load-context', 'step-02-discover-tests', 'step-03-build-matrix', 'step-04-gate-decision']
lastStep: 'step-04-gate-decision'
lastSaved: '2026-08-05'
coverageBasis: 'acceptance_criteria'
oracleConfidence: 'high'
oracleResolutionMode: 'formal_requirements'
oracleSources: ['_bmad-output/implementation-artifacts/story-2-1-frontend-v1.md', '_bmad-output/implementation-artifacts/story-2-1-frontend-v1.context.xml']
externalPointerStatus: 'not_used'
---

# Traceability Matrix & Quality Gate — Story 2.1 (Full v1 frontend)

**Oracle:** formal acceptance criteria (AC 2.1.1–2.1.10, story-2-1-frontend-v1.md), confidence **high** — the story's ACs are concrete and independently verifiable against the running app. No external pointer (Jira/Confluence) — workshop repo deviation, `externalPointerStatus: not_used`.

## 1. Coverage Matrix

| AC | Criterion | Priority | Test Evidence | Automated? | Covered (any evidence) |
|---|---|---|---|---|---|
| 2.1.1 | Scaffold `frontend/` via Vite react-ts | P2 | Structural: `frontend/package.json`, `vite.config.ts` present; `npm run build` succeeds | build check only, not a test | ✅ |
| 2.1.2 | `npm run dev` boots on 5173, zero errors | P2 | Manual: dev server booted, console clean (no automated test practical for "boots cleanly") | ❌ manual only | ✅ |
| 2.1.3 | Menu view lists items, CHF format | P1 | `MenuPage.test.tsx` (mocked `fetchMenu`) + manual Playwright smoke against real backend | ✅ | ✅ |
| 2.1.4 | Order form submits `POST /orders` | P1 | Manual Playwright smoke only (real submit, "Order submitted" confirmed) — **no automated test on the submit handler** | ❌ manual only | ✅ |
| 2.1.5 | My-orders list + name resolution + cache | P1 | Manual Playwright smoke only — **`MyOrdersPage` has zero automated tests**, including no regression test for the stale-closure cache bug found and fixed during implementation | ❌ manual only, see Risk R1 | ✅ |
| 2.1.6 | Cancel action + refresh + confirmation | P1 | Manual Playwright smoke only (real cancel, list refresh, confirmation banner confirmed) — no automated test | ❌ manual only | ✅ |
| 2.1.7 | Admin add-item form | P1 | Manual Playwright smoke only (real add, item appeared in menu list afterwards) — no automated test | ❌ manual only | ✅ |
| 2.1.8 | Identity handling (`X-User-Id`/`X-Admin`) | P1 | `identity.test.ts` (5 unit tests: read/write/headers with & without admin, header-injection sanitization) + implicit confirmation via smoke (backend accepted both headers correctly) | ✅ | ✅ |
| 2.1.9 | Error display (`ApiError.message`, never swallowed) | P1 | `http.test.ts` (5 unit tests: 2xx, 204, error-message extraction, non-JSON fallback, network-failure) + manual smoke with a **real** backend 400 rendering the correct message | ✅ | ✅ |
| 2.1.10 | `frontend/DESIGN.md` before code | P2 | Artefact exists, produced via `bmad-ux` fast path, user-approved before scaffold | n/a — design artefact, not a test | ✅ |

**Coverage rate (any evidence, manual or automated): 10/10 (100%).**
**Automated-test coverage: 3/10** (AC 2.1.3, 2.1.8, 2.1.9) — the other 7 ACs are verified only by build/boot checks, the one-time manual Playwright smoke run, or (2.1.10) the design artefact itself, not a committed regression test.

This is **not an unacknowledged gap**: the story's own Test Scaffolding table explicitly designates "Manual smoke, human-in-browser" as the accepted verification method for the full-flow ACs, and the DoD's bar was "≥1 Vitest component test" (met — `MenuPage.test.tsx`), not full-page coverage. Flagged here as a *risk to carry forward*, not a DoD violation.

## 2. Risk Register

| ID | Category | Description | Probability | Impact | Score | Status |
|---|---|---|---|---|---|---|
| R1 | TECH | `MyOrdersPage` name-resolution cache had a stale-closure bug (fixed via `useRef` during this story) with no regression test guarding the fix. If the file is edited again without noticing the `useRef` pattern, the cache could silently break (extra requests, not data loss). | 2 | 2 | 4 | OPEN — recommend follow-up test, not a merge blocker |
| R2 | TECH | `react-router-dom@7.18.2` (latest) carries one open high-severity advisory (GHSA-qwww-vcr4-c8h2, RSC-mode CSRF bypass). Not exploitable here (no RSC/server-actions usage — plain client SPA). Older versions carry strictly worse, broader advisories. | 1 | 1 | 1 | ACCEPTED — no action available; re-check on next dependency bump |
| R3 | TECH | AC 2.1.4–2.1.7 have no automated regression coverage beyond the one manual smoke pass; a future refactor could silently break order submission, cancel, or admin add without a failing test to catch it. | 2 | 2 | 4 | OPEN — accepted per story's own manual-smoke DoD bar; recommend as fast-follow if this app grows beyond the workshop |

No risk scores ≥6 (no HIGH/CRITICAL). No score = 9 (no CRITICAL blocker).

## 3. Gate Decision

**Decision: CONCERNS**

**Rationale:** No critical or high risks (all scores ≤4), and all 10 ACs have at least one form of verification evidence — so this does **not** meet the FAIL bar (critical risk or *unresolved* coverage gap). It is not a clean PASS either: two open, low-score risks (R1, R3) are worth a named follow-up rather than silently accepted with zero paper trail.

**Recommendations:**
- ✅ Ship — no blockers. Merge as-is is reasonable for an internal workshop tool at this stakes level.
- 📋 Fast-follow (non-blocking): add a regression test for `MyOrdersPage`'s name-resolution cache (R1) — e.g. assert `fetchMenuItem` is called exactly once per distinct `menuItemId` across two `loadOrders()` calls.
- 📋 Fast-follow (non-blocking): if this app grows past the workshop, add component tests for `MyOrdersPage`, `AdminPage`, and the order-submit path in `MenuPage` (R3) — currently manual-smoke-only.
- 👀 Watch: re-check `react-router-dom` advisory status (R2) next time dependencies are bumped; no action possible today.

## Integration Points

- Feeds into: `bmad-code-review` (next step) — this gate decision and risk register should inform reviewer focus (cache fix in `MyOrdersPage`, dependency choice for `react-router-dom`).
- Feeds into: PR description — cite this file's Gate Decision (CONCERNS, no blockers) alongside the story's own Dev Agent Record.
