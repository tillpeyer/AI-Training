# STORY-2 Retrospective — 2026-05-11

## TL;DR

The STORY-2 cycle ran more smoothly than STORY-1: the locked story file was structurally tighter (branching strategy explicit, saved-questions pattern used), 12/12 tests passed, and all 6 ACs were satisfied with a clean single-commit delivery (`9b858e5`). None of the STORY-1 retro's recommended fixes (epics.md commit, mvnw, gh prereq) were applied before the cycle started, so the same infrastructure friction recurred. The biggest new insight: **green tests are not enough** — the CR subagent caught a latent contract bug and four missing `$.message` assertions that Dev's local suite passed through undetected.

---

## What improved over STORY-1

- **Stacked-branch pattern was explicit from the start.** Task 9.1 in `_bmad-output/implementation-artifacts/1-2-submit-an-order.md` spelled out the exact four git commands needed to cut from `feature/STORY-1-list-menu` HEAD (`e5555e3`) rather than main — no guesswork, no accidental cut from the wrong parent.
- **Locked story file quality is higher.** STORY-2's file reused STORY-1's section structure and added "Previous Story Intelligence" and "Git Intelligence Summary" subsections. Dev started with an accurate picture of the repo state.
- **Saved-questions-at-end pattern used.** Three architecture ambiguities (`@Table(name="orders")`, single DTO exception, `CANCELLED` enum value) were queued and answered in the Dev Agent Record rather than derailing mid-task. All three answers are now documented for STORY-3..5 reviewers.
- **11 files, 446 net insertions, single clean commit.** `git diff feature/STORY-1-list-menu..feature/STORY-2-create-order --stat` shows zero deletions and no scope creep — the diff is exactly the 9 production + 2 test files listed in the story.
- **`@Import(GlobalExceptionHandler.class)` idiom captured immediately.** `OrderControllerTest.java:24` demonstrates the correct `@WebMvcTest` advice-loading pattern; CR flagged it as PRAISE and it is now a concrete carry-forward for STORY-3..5.

---

## What regressed or stayed broken

- **`gh` CLI token went 401 again.** Task 9.4 in the locked file and the Dev Agent Record both note `HTTP 401, same situation as STORY-1`. The STORY-1 retro recommended adding `gh` to the pre-requisites list; that was not acted on before STORY-2.
- **`mvn` still not on PATH.** Dev Agent Record: `C:\Program Files\JetBrains\IntelliJ IDEA 2025.2.5\plugins\maven\lib\maven3\bin\mvn.cmd` used again. The `mvnw` wrapper recommendation from STORY-1 retro was not applied.
- **`sprint-status.yaml` still stale.** STORY-1 landed at `ready-for-dev` after implementation; STORY-2 lands at `review` (closer, but Dev did not advance it to `done`). The handoff gap flagged in STORY-1 persists.
- **STORY-1 PR still unsubmitted.** The compare URL from STORY-1 retro open follow-up was not browser-clicked before STORY-2 started. Both PRs are now pending manual action simultaneously.

---

## New issues surfaced

- **`GlobalExceptionHandler.java:21-22` — latent `MISSING_HEADER` fallback code.** The else-branch of `handleMissingHeader` returns `code:"MISSING_HEADER"` for any unrecognised missing-header exception. When STORY-5 adds `X-Admin`, this handler will silently return a non-spec code. No test covers the else-branch today. First-time issue because STORY-1 had no error contract to exercise.
- **Four controller tests omit `$.message` assertions.** `OrderControllerTest` checks `$.code` on lines 69, 82, 93, 108 but never asserts `$.message` is non-null/non-empty, despite AC-2 requiring a populated message field. CR finding MAJOR-2 (`code-review-1-2-submit-an-order.md:31`).
- **`Order.setCreatedAt` public mutator contradicts `updatable=false`.** CR MINOR-1 (`code-review-1-2-submit-an-order.md:36`): the controller test itself calls `saved.setCreatedAt(Instant.now())` to fabricate a response, confirming the setter is reachable. No prior story had a server-set timestamp field.

---

## Patterns worth carrying forward

- **`ArgumentCaptor` to verify `save()` arguments** (`OrderServiceTest.java`): captures what was passed _in_ to the repo, not just the mocked return value. CR PRAISE-5. Replicate in STORY-3's `OrderService` cancel test and STORY-5's admin tests.
- **`@Import(GlobalExceptionHandler.class)` on every `@WebMvcTest` class.** STORY-3..5 all exercise the same `GlobalExceptionHandler`; this import must appear on every controller test.
- **Stacked-branch workflow.** STORY-3 should stack on `feature/STORY-2-create-order` HEAD (`9b858e5`) for the same reason: upstream PRs not yet merged.
- **Saved-questions-at-end in SM lock.** Prevents mid-implementation detours and produces a decision trail in the Dev Agent Record. Keep the pattern.

---

## Insights to teach participants

- **"Green tests are not enough — CR catches contract gaps Dev's local suite misses."** STORY-2 had 12/12 green, yet CR found four tests that pass while ignoring half the AC-2 contract (`$.message`). Put this on a slide.
- **Stacked PRs let you keep moving when reviews are slow.** STORY-2 could not wait for PR #1 to merge. The explicit stacking instructions in Task 9.1 made this safe and repeatable. Real teams do this constantly.
- **The `GlobalExceptionHandler` else-branch is a live teaching moment.** Show participants that one unguarded fallback in a cross-cutting class can silently corrupt a future story's error contract — and that a missing test lets it survive for cycles.

---

## Recommended changes (before STORY-3 if possible, or carried forward)

1. Fix CR MAJOR-2 now: add `.andExpect(jsonPath("$.message").isNotEmpty())` to the four error-scenario tests in `OrderControllerTest.java` (lines 69, 82, 93, 108).
2. Add a `// TODO STORY-5: revisit for X-Admin` comment to `GlobalExceptionHandler.java:22` else-branch and add one test covering the fallback path.
3. Submit the STORY-1 and STORY-2 PRs manually at the GitHub compare URLs listed in the respective locked files before STORY-3 begins.
4. (Carried from STORY-1) Run `mvn wrapper:wrapper` and commit `mvnw` / `mvnw.cmd` to eliminate the IntelliJ Maven workaround.
5. (Carried from STORY-1) Add `gh` CLI to the workshop pre-requisites checklist or document the browser-fallback URL in `CLAUDE.md` §Definition of Done.

---

## Statistics

- Dev cycle wall time: not measured (single session, no timestamps in Dev Agent Record)
- Files changed: 11 (9 production, 2 test); 446 net insertions, 0 deletions (`git diff --stat`)
- Test count delta: STORY-1 baseline 4 → STORY-2 total 12 (+8); STORY-3 target estimate ~16–18
- ACs satisfied: 6/6
- CR findings: 0 BLOCKER / 2 MAJOR / 4 MINOR / 6 PRAISE

---

## Open follow-ups

1. STORY-2 PR needs a manual browser click at `https://github.com/tillpeyer/AI-Training/compare/feature/STORY-2-create-order` (base: main, title: "STORY-2: Submit an order"). Same for STORY-1 PR.
2. `gh` 401 needs investigation — token may have expired or been regenerated by Till between turns; re-authenticating with `gh auth login` should restore CLI access.
3. CR MAJOR fixes deferred by Till ("retro and next story" choice) — pick up in a cleanup commit before STORY-3 merge, or track as a follow-up story.
4. `sprint-status.yaml` shows both `1-1` and `1-2` as `review`; advance both to `done` manually or via SM before STORY-3 sprint planning.
