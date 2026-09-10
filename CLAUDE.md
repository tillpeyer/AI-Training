# CLAUDE.md

This file is loaded automatically by Claude Code when working in this repository.

## First thing you should do

- At every new output answer write "They’re Taking The Hobbits To Isengard" first.

## What this repo is

**Agentic Engineering — Advanced** workshop starter. A small Spring Boot service ("Lunch Order API") used as the hands-on project in ELCA's Advanced Instructor-Led training (half-day, monthly).

Participants clone this repo, install BMAD + ELCAi, then run **BMAD Phase 4** (Story → Implementation → Test) on one or more of the draft stories in `docs/stories/` (workshop-lite convention) or `_bmad-output/implementation-artifacts/` (ELCAi-strict convention, e.g. `1-8-admin-delete-menu-item.md`).

## Your role as Claude

When invoked here, you are the agent the participant is steering. Adopt whichever BMAD role is activated — most roles are now skills invoked by natural language, not slash commands (BMAD 6.10.x moved agent personas from `.claude/commands/` to self-contained `.claude/skills/`):

| How it's invoked | Role | What you do |
|---|---|---|
| `bmad-create-story` skill ("create the next story") | Story prep (Scrum Master role) | Read the draft story, ask clarifying questions, lock it (acceptance criteria, scope, definition of done) — the dedicated SM agent persona was retired in favor of this skill |
| `bmad-agent-dev` skill ("talk to Amelia") | Developer | Read the locked story + PRD + tech spec, branch, implement, write tests, open PR |
| `/bmad-agent-bmm-qa` slash command (or `bmad-tea` skill for deeper test strategy) | QA / Test Engineering | Verify acceptance criteria against the implementation, report gaps |
| `bmad-agent-elcai-auditor` skill ("talk to Olivia", ELCAi-only) | Auditor | Generate sprint summary or tech doc to Confluence (skip unless explicitly asked) |

If none of those is active, treat any task here as a workshop-flavoured request: small scope, real tests, real PR.

### Optional: a standing reviewer session

**This is an opt-in pattern, not part of the Phase 4 cycle.** The default process is unchanged: one session, SM → Dev → QA, as taught in Block 2.

The problem it solves: when QA runs in the same session that just wrote the code, it reviews its own work with full memory of why it made each choice. It is anchored, and it has motivated reasoning. A reviewer that has seen only the story and the diff is a stronger reviewer.

If you want that, keep a **second Claude Code session open on this repo doing nothing but QA**, across several stories. It accumulates knowledge of where this codebase is actually weak — the `common/` exception mapping, the `ApiError` shape, the existence-before-ownership-before-state check order from STORY-4 — which a reviewer spawned fresh for each story never builds up.

How the two sessions coordinate:

- **The story file is the handoff.** The Dev Agent Record, File List, and status field are the shared state. The reviewer session reads them directly; no messaging is required for the handoff itself.
- **`SendMessage` is the nudge, not the channel.** Run `ListAgents` to get the other session's name (names are generated per session — never hardcode one), then send a one-line "STORY-N ready for review" when the Dev Agent Record is written.
- **Split by write domain.** Both sessions share one working tree, so only the Dev session writes `src/main/**`. The reviewer owns `src/test/**`.
- **Test on signal, not continuously.** Both sessions share `target/`. Running `.\mvnw test` in the reviewer while Dev is mid-edit produces confusing results. Wait for the nudge.

When *not* to reach for this: for blind review inside a single session, `bmad-code-review` already runs parallel review layers with fresh contexts, and the story loop deliberately folds review into `bmad-dev-auto`. This pattern earns its cost only through persistence across stories. It is also not a way to work two stories at once — the one-story-per-branch rule below still holds.

## Context to read before implementing

In order:

0. `_bmad-output/project-context.md` — the short list of rules and traps. Read this first; it is loaded automatically as a persistent fact by the dev and story-loop skills, and it is the fastest route to not breaking something.
1. `_bmad-output/planning-artifacts/prd.md` — Phase 2 artefact, the "why" (§1.2 Business Goals, §1.3 Stakeholders, §1.4 Scope). Note the **amendment log at the top** — Feature 2 moved from out-of-scope to in-scope on 2026-09-03.
2. `_bmad-output/planning-artifacts/architecture.md` — Phase 3 artefact, the "how" (as-built API, error contract, data model, CORS, version support). Its companion `architecture/ARCHITECTURE-SPINE.md` holds the **18 ADs a change must not violate** — read the spine before altering anything cross-cutting.
   > **`docs/tech-spec.md` is superseded** (2026-09-03) and kept only for history: five delivered stories cite it as their source. Its own banner lists the seven things in it that are now wrong. Do not implement from it.
   >
   > For Feature 2 work also read `frontend-angular/DESIGN.md` (visual identity, light + dark tokens) and `frontend-angular/EXPERIENCE.md` (IA, states, behaviour, accessibility). Both are the acceptance bar, not background.
3. The story you're about to work on. Two conventions coexist in this repo:
   - **Workshop-lite** — `docs/stories/STORY-N-*.md` (STORY-1..7). Flat markdown, `AC-N` format, no companion files.
   - **ELCAi-strict** — `_bmad-output/implementation-artifacts/<epic>-<story>-<slug>.md` plus a companion `.context.xml` with the same stem (e.g. `1-8-admin-delete-menu-item.md` + `1-8-admin-delete-menu-item.context.xml`). **No `story-` prefix** — it breaks `bmad-dev-story`'s `{story_key}.md` auto-discovery. Four files were renamed on 2026-09-03 to fix exactly that. Use `AC E.S.N` numbering, CP estimates, and read **both** files before implementing — the `.context.xml` contains the artefacts-to-reuse/create tables, implementation outline, and test scaffolding.

Do **not** invent requirements beyond what's in those files. If a story is ambiguous, ask the participant — don't guess.

## Conventions

- **Branch naming:** `feature/STORY-<n>-<short-slug>` (e.g. `feature/STORY-1-list-menu`)
- **Commit format:** `STORY-<n>: <description>` (e.g. `STORY-1: add MenuItem entity and list endpoint`)
- **PR target:** `main`
- **Package root:** `ch.elca.training.lunch`
- **Feature packaging:** one package per domain (`menu/`, `order/`, `common/`) — entity, repo, service, controller side by side in the same package. Full layout in `architecture/ARCHITECTURE-SPINE.md` §Structural Seed (the tech-spec's version is stale — it omits `WebConfig`, `MenuSeedData` and all six exception classes).
- **Tests:** `@WebMvcTest` for controllers, `@DataJpaTest` for repos. Reserve `@SpringBootTest` for the existing smoke test.

## Tech stack

| Item | Version |
|---|---|
| Java | 21 (LTS) |
| Spring Boot | 3.5.0 |
| Maven | 3.9+ |
| Database | H2 in-memory |

## Scope rules (workshop-specific)

- **One story per branch.** Don't implement multiple stories at once even if they're tempting.
- **Stay inside the story's AC.** No "improving" surrounding code, no preemptive refactors. The lesson is steering, not autonomous engineering.
- **Don't introduce new dependencies** beyond what's already in `pom.xml` unless the story explicitly requires it.
- **Don't add DTOs in v1.** Tech spec says entity = API for the workshop. Refactor toward DTOs only if a story mentions it.

## Workshop flow (for context)

The instructor will typically:

1. **Block 1** — Recap Basics, walk the Phase 4 cycle on a slide
2. **Block 2** — Each participant runs one full SM → Dev → QA cycle here
3. **Block 3** — Live MCP demo (Jira / Confluence / Bitbucket from inside Claude Code) on this same repo
4. **Block 4** — Guided workshop, the whole room ships one story together

If a participant is mid-block and asks you to do something out of scope, push back politely and point at the story they're working on.

**If the Dev agent goes silent after pushing,** run `git log` first — the commit may already exist. Reconstruct the Dev Agent Record from the diff if needed.

## Definition of Done (per story)

Each story has its own DoD list — follow that list. The common shape:

- [ ] All ACs ticked
- [ ] Unit / integration tests covering the ACs pass (`.\mvnw test` — a hook auto-flags failures)
- [ ] `.\mvnw spring-boot:run` boots cleanly, `/actuator/health` returns `UP` (a hook auto-verifies this when run backgrounded)
- [ ] PR opened against `main`

**Opening the PR:** Run `gh pr create --base main --title "STORY-<n>: <description>"`. If `gh` returns 401 or "not found", open `https://github.com/tillpeyer/AI-Training/compare/feature/STORY-<n>-<slug>?expand=1` in your browser and click "Create pull request".

## Things you should NOT do

- Don't commit `.claude/`, `_bmad/`, or `.mcp.json` — they're gitignored on purpose.
  **Exceptions** (allowlisted in `.gitignore` so participants get them via `git pull`):
  - `.claude/skills/bmad-elcai-story-loop/**` + `.claude/skills/install-story-loop/**` — the story-loop skill and its installer
  - `.claude/skills/google-developer-guide-style-rules/**` — the writing-style skill the dev agent loads as a persistent fact
  - `.claude/settings.json` + `.claude/hooks/**` — safety and reminder hooks (`git-safety-guard`, `test-failure-nudge`, `health-check-nudge`, `session-start-nudge`, `notify`); `git-safety-guard` enforces the push-to-main / force-push / `gh pr merge` rules mechanically, so they aren't repeated as prose below. Each script's own header comment documents what it does.
  - `.claude/commands/{elcai-check-env,check-training-env}.md` — read-only diagnostic commands (MCP config, hook wiring, BMAD/ELCAi version drift, gitignore coverage)
  - `_bmad/custom/config.toml` — team config overrides (e.g. `[modules.elcai]` Jira/Confluence keys); everything else under `_bmad/custom/` (notably `*.user.toml`) stays personal/gitignored
  - Also gitignored: `.agents/` and `.github/` (BMAD's and ELCAi's per-IDE output for github-copilot) and the rest of `_bmad/` (installer output, per-user, nothing else under it ships with the repo). If real CI workflows ever land in `.github/workflows/`, allowlist that path explicitly.
- Don't update `pom.xml` dependencies "to be helpful"
- Don't generate documentation outside `docs/` unless the story asks for it

## Useful references

- ELCAi method: <https://www.npmjs.com/package/@elca-agenticengineering/elcai-method> — install/update with `npm install -g @elca-agenticengineering/elcai-method` then `elcai-method update`. Track the newest *published* release; there is no alpha channel (the npm `alpha` dist-tag is dangling at an unpublished version).
- BMAD method: `npx bmad-method install` — this repo runs BMAD **stable** (`latest`), not prereleases; don't pin a `-next.` version here.
- Workshop slide deck: `tillpeyer/AI-Training` partner deck (lives elsewhere, ask the instructor)
- ELCA Agentic Engineering unit: Nissim BUCHS (Head), Till Flurin Peyer (Advanced trainer)
