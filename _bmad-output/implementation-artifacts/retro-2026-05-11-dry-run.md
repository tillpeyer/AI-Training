# Workshop Dry-Run Retrospective — 2026-05-11

## TL;DR

The dry-run completed one full BMAD Phase 4 cycle (SM lock → Dev implement → 4/4 tests green → branch pushed) on Story 1.1 in a single session. The workflow is teachable as-is, but two infrastructure gaps (no `epics.md` in the repo, no `gh` CLI on the trainer's machine) created unplanned workarounds that participants will also hit unless addressed before the first live run.

## What worked

- **SM → locked story file produced correctly.** `_bmad-output/implementation-artifacts/1-1-list-todays-menu.md` is a high-quality context document: all 5 ACs restated, all 6 task groups with subtasks, dev notes cross-referencing `docs/tech-spec.md` sections by name. Participants will see exactly what a well-locked story looks like.
- **Dev subagent (Sonnet 4.6) followed conventions faithfully.** Branch `feature/STORY-1-list-menu`, commit `STORY-1: implement list today's menu`, feature-based packaging in `ch.elca.training.lunch.menu/`, no added dependencies, no DTOs, `@Profile("!test")` on seed data — all per `CLAUDE.md` and the tech spec. Zero scope creep.
- **Test coverage matched the story spec.** `MenuRepositoryTest` (`@DataJpaTest`) and `MenuControllerTest` (`@WebMvcTest`) implemented exactly as described in Task 2.3 and Task 4.4. 4/4 tests green; no `@SpringBootTest` misuse.
- **SRD Phase 1 is a strong teaching artefact.** `_bmad-output/planning-artifacts/prd.md` covers §§1.1–1.5 end-to-end and is internally consistent. The deliberate `⚠️ Workshop-rehearsal flag` annotations in §1.2, §1.3, and §1.5 explicitly mark fabricated data, which makes it safe to use with participants without misleading them about what real BA work looks like.
- **Sprint status YAML was created and reflects real state.** `_bmad-output/implementation-artifacts/sprint-status.yaml` shows `epic-1: in-progress`, `1-1-list-todays-menu: ready-for-dev` (SM stopped short of flipping to `done` — acceptable; Dev would do that). The file format is parsable and unambiguous.
- **Session ran in under 7 hours.** Git timestamps show scaffold commit at 11:08 and implementation commit at 17:34 on the same day.

## What didn't work / friction points

- **`epics.md` had to be fabricated mid-session.** The Sprint Planning workflow requires an `epic*.md` input. The workshop repo ships only flat `docs/stories/STORY-1..5-*.md`. Bob the SM had to synthesise `_bmad-output/planning-artifacts/epics.md` before sprint planning could proceed. This is unplanned cognitive overhead for participants on their first cycle. The header of that file acknowledges it: *"synthesised from the 5 pre-written story drafts … to satisfy the Sprint Planning workflow's `epic*.md` input requirement."*
- **`gh` CLI not installed — PR step is a dead end without it.** Task 6.4 in the locked story file has the only unchecked box in the entire story: `[ ] 6.4 Open PR against main`. The Dev Agent Record records `gh CLI not installed; PR must be opened manually`. Participants will hit the same wall unless `gh` is pre-installed or the fallback URL is surfaced earlier in the workshop instructions.
- **`mvn` not on PATH — had to use IntelliJ-bundled Maven.** Dev Agent Record: `mvn not on PATH; used IntelliJ-bundled Maven at C:\Program Files\JetBrains\IntelliJ IDEA 2025.2.5\plugins\maven\lib\maven3\bin\mvn`. Any participant without IntelliJ (or with a different IDE path) will get a confusing failure at `mvn test`.
- **Sprint status shows `1-1` as `ready-for-dev` after implementation is done.** The YAML was not updated to `done` after Dev finished. This is a BMAD workflow gap: the SM creates the status entry, but the Dev agent is supposed to advance it. In the dry-run that handoff was silent. Participants may not know to advance the status, leaving the board stale.
- **`story_location` in sprint-status.yaml points to `_bmad-output/implementation-artifacts`, but BMAD's default expectation is `docs/stories/`.** The workshop stores story files in a non-default location. This required overriding `story_location` in the YAML header. If a participant uses the default path, the SM and Dev workflows will look in the wrong place.
- **SRD Phase 2 was not attempted.** `_bmad-output/planning-artifacts/prd.md` has §§2.1–2.9 as empty comment placeholders. This is intentional for the dry-run scope, but the file will confuse participants if they open it and see an incomplete document. There is no `stepsCompleted` marker that clearly says "Phase 2 not started."
- **No `mvnw` wrapper in the repo.** The scaffold relies on a system Maven. A Maven wrapper (`mvnw` / `mvnw.cmd`) would make `./mvnw test` work regardless of the participant's local Maven installation.

## Insights to teach participants explicitly

- **The SRD §1.2 tightening exercise is the best live demo moment.** Mary's first-draft goals included ambitious metrics (waste -30%, p95 < 10 s, 99.5% uptime) that don't survive a reality check against stories 1–5. The final §1.2 explains why they were dropped. Put this on a slide: *"If §1.2 goals don't survive a check against the story list, either the goals shrink or the story list grows — you can't promise what the scope can't deliver."*
- **BMAD is epic-centric; the workshop is story-centric.** The gap that forced `epics.md` fabrication is pedagogically useful: it shows participants that the method assumes a full Phase 2 upstream. Worth one slide: here is where epics normally come from, here is the shortcut we take in the workshop, here is why it matters for real projects.
- **`§1.3` is the most under-elicited SRD section in practice.** The stakeholder register (`_bmad-output/planning-artifacts/prd.md` §1.3) contains 9 stakeholders, 4 of which (IT Security, Works Council, IT Operations, HR) are invisible in the source PRD. The `⚠️ Workshop-rehearsal flag` in §1.3 says it directly: *"participants tend to capture only the user-facing personas and miss the people who can quietly kill the project."* Use the Works Council and IT Security rows as discussion prompts.
- **`@Profile("!test")` on seed data is a real Spring Boot gotcha.** Without it, `@DataJpaTest` picks up the `ApplicationRunner` and pollutes the DB. The Dev agent handled it correctly (`MenuSeedData.java` line 11), but it is not obvious to participants coming from a `@SpringBootTest`-everywhere background.

## Recommended changes to the workshop setup

1. **Commit a pre-baked `docs/epics.md` to the repo** (or `_bmad-output/planning-artifacts/epics.md`). Copy the content of the fabricated file verbatim. This eliminates the SM's first unplanned task and keeps the session on the BMAD cycle rather than on workarounds.
2. **Add `gh` CLI installation to the pre-requisites list** (or document the manual PR URL fallback in `CLAUDE.md` §Definition of Done). The current DoD says "PR opened against `main`" with no mention of what to do when `gh` is absent.
3. **Add a `mvnw` / `mvnw.cmd` Maven wrapper.** Run `mvn wrapper:wrapper` once and commit the result. Replaces all `mvn` invocations in the workshop instructions with `./mvnw`, which works regardless of PATH.
4. **Update `sprint-status.yaml` to `done` for Story 1.1 after the Dev commit** — or add an explicit instruction in the SM workflow to advance the status when Dev reports completion. As-is, the board is permanently stale after the dry-run.
5. **Add a one-line comment to `_bmad-output/planning-artifacts/prd.md`** at the top of the Phase 2 block: `# Phase 2 not started in this dry-run — placeholders only`. Prevents participant confusion when they open the file.

## Statistics

- Time elapsed: ~6 h 26 min (scaffold 11:08 → implementation commit 17:34, same day, both +0200)
- Files produced: 10
  - Planning: `_bmad-output/planning-artifacts/prd.md`, `_bmad-output/planning-artifacts/epics.md`
  - Implementation tracking: `_bmad-output/implementation-artifacts/sprint-status.yaml`, `_bmad-output/implementation-artifacts/1-1-list-todays-menu.md`
  - Production code (5): `MenuItem.java`, `MenuRepository.java`, `MenuService.java`, `MenuController.java`, `MenuSeedData.java`
  - Tests (2): `MenuControllerTest.java`, `MenuRepositoryTest.java`
- Tests passing: 4/4
- ACs satisfied: 5/5 (Story 1.1)
- Story tasks checked: 23/24 (Task 6.4 PR open is the one open item, blocked by missing `gh`)

## Open follow-ups

1. **Pre-run checklist for participants' machines**: confirm `gh` CLI installed, Maven on PATH (or `mvnw` committed), Java 21 active. Decide whether to add this to `CLAUDE.md` or a separate `SETUP.md`.
2. **Decide where `epics.md` lives permanently**: in `docs/` (alongside PRD and tech-spec) or in `_bmad-output/planning-artifacts/` (where it landed in the dry-run). The former is cleaner for participants; the latter matches BMAD's output convention.
3. **SRD Phase 2 scope for next dry-run**: worth attempting §2.1 (Glossary) and §2.9 (Data Model) since the data model is already fully specified in `docs/tech-spec.md`. Low effort, high teaching value.
4. **Story 1.1 PR**: needs to be opened manually at `https://github.com/tillpeyer/AI-Training/compare/feature/STORY-1-list-menu` before Story 1.2 sprint planning begins.
5. **`sprint-status.yaml` path override**: document in `CLAUDE.md` that `story_location` must be set to `_bmad-output/implementation-artifacts` when using the workshop layout, so participants don't get path-not-found errors in the SM/Dev handoff.
