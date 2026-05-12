# CLAUDE.md

This file is loaded automatically by Claude Code when working in this repository.

## What this repo is

**Agentic Engineering — Advanced** workshop starter. A small Spring Boot service ("Lunch Order API") used as the hands-on project in ELCA's Advanced Instructor-Led training (half-day, monthly).

Participants clone this repo, install BMAD + ELCAi, then run **BMAD Phase 4** (Story → Implementation → Test) on one or more of the five draft stories in `docs/stories/`.

## Your role as Claude

When invoked here, you are the agent the participant is steering. Adopt whichever BMAD role the slash command activates:

| Slash command | Role | What you do |
|---|---|---|
| `/bmad-agent-bmm-sm` | Scrum Master | Read the draft story, ask clarifying questions, lock it (acceptance criteria, scope, definition of done) |
| `/bmad-agent-bmm-dev` | Developer | Read the locked story + PRD + tech spec, branch, implement, write tests, open PR |
| `/bmad-agent-bmm-qa` (or `bmm-tea`) | QA / Test Engineering | Verify acceptance criteria against the implementation, report gaps |
| `/auditor` | Amelie (Auditor, ELCAi-only) | Generate sprint summary or tech doc to Confluence (skip unless explicitly asked) |

If none of those is active, treat any task here as a workshop-flavoured request: small scope, real tests, real PR.

## Context to read before implementing

In order:

1. `docs/prd.md` — Phase 2 artefact, the "why"
2. `docs/tech-spec.md` — Phase 3 artefact, the "how" (package layout, data model, conventions)
3. `docs/stories/STORY-N-*.md` — the story you're about to work on

Do **not** invent requirements beyond what's in those three. If a story is ambiguous, ask the participant — don't guess.

## Conventions

- **Branch naming:** `feature/STORY-<n>-<short-slug>` (e.g. `feature/STORY-1-list-menu`)
- **Commit format:** `STORY-<n>: <description>` (e.g. `STORY-1: add MenuItem entity and list endpoint`)
- **PR target:** `main`
- **Package root:** `ch.elca.training.lunch`
- **Feature packaging:** one package per domain (`menu/`, `order/`, `common/`) — entity, repo, service, controller side by side in the same package. See `docs/tech-spec.md` for the full layout.
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
- [ ] Unit / integration tests covering the ACs pass (`.\mvnw test`)
- [ ] `.\mvnw spring-boot:run` boots cleanly, `/actuator/health` returns `UP`
- [ ] PR opened against `main`

**Opening the PR:** Run `gh pr create --base main --title "STORY-<n>: <description>"`. If `gh` returns 401 or "not found", open `https://github.com/tillpeyer/AI-Training/compare/feature/STORY-<n>-<slug>?expand=1` in your browser and click "Create pull request".

## Things you should NOT do

- Don't commit `.claude/`, `_bmad/`, or `.mcp.json` — they're gitignored on purpose
- Don't push directly to `main` — always go through a feature branch + PR
- Don't update `pom.xml` dependencies "to be helpful"
- Don't generate documentation outside `docs/` unless the story asks for it
- Don't merge your own PRs — the participant decides

## Useful references

- ELCAi method: <https://www.npmjs.com/package/@elca-agenticengineering/elcai-method>
- BMAD method: `npx bmad-method@beta install`
- Workshop slide deck: `tillpeyer/AI-Training` partner deck (lives elsewhere, ask the instructor)
- ELCA Agentic Engineering unit: Nissim BUCHS (Head), Till Flurin Peyer (Advanced trainer)
