# Agentic Engineering — Advanced Workshop Starter

A small Spring Boot service used in the **Advanced Instructor-Led** training for the Agentic Engineering programme. Five v1 backend stories plus an Epic 2 frontend story, ready to lock and implement with BMAD agents.

The Lunch Order API is a fictional service that handles a daily lunch menu and per-employee orders. Small enough to ship in a 60-minute workshop, real enough to exercise the full BMAD Phase 4 cycle.

## What's in this repo

| Path | Purpose |
|---|---|
| `pom.xml` | Spring Boot 3.5 + Java 21 + H2. Compiles and boots out of the box. |
| `src/main/java/.../LunchOrderApplication.java` | Spring Boot app — your starting point. |
| `_bmad-output/planning-artifacts/prd.md` | Phase 2 artefact — pretend the PM agent gave you this. |
| `_bmad-output/planning-artifacts/architecture.md` | Phase 3 artefact — the architecture of record. Its `architecture/ARCHITECTURE-SPINE.md` companion holds the 18 invariants a change must not violate. |
| `_bmad-output/project-context.md` | The short list of rules and traps, loaded automatically by the dev skills. |
| `docs/tech-spec.md` | **Superseded 2026-09-03.** The original Phase 3 artefact, kept for history because five delivered stories cite it. Don't implement from it. |
| `docs/stories/STORY-1-list-menu.md` … `STORY-5-admin-add-menu-item.md` | Five v1 backend story drafts (Epic 1). |
| `docs/stories/STORY-6-frontend-v1.md` | Epic 2 frontend story draft — **Angular 21** (rewritten 2026-09-03; it previously said React + Vite). The workshop-lite twin of `2-1-frontend-v1.md` — run one or the other, never both. |
| `frontend-angular/DESIGN.md` · `EXPERIENCE.md` | Feature 2's design of record — visual identity, and behaviour/accessibility. |

## Before the session

This is the **Advanced** workshop. It builds on *Agentic Engineering Basics for All Roles* — do that one first if you haven't.

Do the checklist below **at least one working day before** the session. Installation problems eat the hands-on time, and most of them need a browser login or a new terminal that is hard to do live.

| # | Check | Command (Windows PowerShell) | If it fails |
|---|---|---|---|
| 1 | You have a Claude licence and know its login email | — | Your licence email is listed on [manager.svc.elca.ch/my](https://manager.svc.elca.ch/my). It may be `@pul.elcagroup.com` or `@elca.vn`, not your usual address. Log in to claude.ai with **email login**, not SSO — SSO creates a second, unlicensed account. |
| 2 | Scripts may run | `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` | No admin rights needed. |
| 3 | Git is installed | `git --version` | `winget install --id Git.Git -e --source winget`, then open a **new** terminal. |
| 4 | Java 21 is installed | `java -version` | See [Java 21](#java-21). |
| 5 | Node.js 20+ is installed | `node --version` | See [Node.js 20+](#nodejs-20). |
| 6 | Claude Code runs | `claude --version` | `irm https://claude.ai/install.ps1 \| iex`. If `claude` is still not found, add `%USERPROFILE%\.local\bin` to your user PATH and open a **new** terminal. |
| 7 | npm finds the ELCAi package | `npm config set @elca-agenticengineering:registry https://artifactory.svc.elca.ch/artifactory/api/npm/prj_dbl-java-agenticengineering_npm/` | Run it as one line. |
| 8 | npm is logged in to Artifactory | `npm login --auth-type=web --scope=@elca-agenticengineering` | "Token generation for user anonymous is prohibited" → open [artifactory.svc.elca.ch](https://artifactory.svc.elca.ch/) in your **default** browser, log in there, then run the command again. |
| 9 | Your ELCA-MCP key is ready | — | Create it at [mcp.dev.elca.ch/settings](https://mcp.dev.elca.ch/settings) (that is the portal, not Claude Code's `/settings`). |

On macOS and Linux, skip check 2 and use `curl -fsSL https://claude.ai/install.sh | bash` for check 6.

**You do not need a Jira project or Confluence space.** The stories in `docs/stories/` are local files; every exercise works without them.

Common questions (brownfield projects, what to commit, BMAD vs. alternatives) are answered in [`docs/faq.md`](docs/faq.md).

## Prerequisites

You need **Java 21 (LTS)** and **Node.js 20+** on your machine before the workshop starts. Everything else in the project (Maven, Spring Boot, H2) is fetched by the Maven wrapper on first run — no manual install for those.

### Java 21

<details><summary><strong>Windows</strong></summary>

```powershell
winget install Microsoft.OpenJDK.21
# or grab the MSI: https://adoptium.net/temurin/releases/?version=21
```
</details>

<details><summary><strong>macOS</strong></summary>

```bash
brew install --cask temurin@21          # Homebrew
# or:  sdk install java 21.0.10-tem     # SDKMAN
```
</details>

<details><summary><strong>Linux</strong></summary>

```bash
# SDKMAN (any distro, recommended):
curl -s "https://get.sdkman.io" | bash
sdk install java 21.0.10-tem

# Ubuntu/Debian:
sudo apt install openjdk-21-jdk

# Fedora/RHEL:
sudo dnf install java-21-openjdk-devel
```
</details>

**Verify:**
```bash
java -version     # expected: openjdk version "21.x.x"
```

### Node.js 20+

Required only for installing BMAD and ELCAi (steps 2 and 3 below). Any of `nvm`, `fnm`, `volta`, or the Node.js installer works.

## Workshop flow (for participants)

```bash
# 1. Clone this repo into a fresh folder (ELCA Bitbucket; log in with your ELCA account) and enter the advanced/ course folder
git clone https://bitbucket.svc.elca.ch/scm/dbl-java-agenticengineering/agentic-engineering-training.git lunch-order
#    SSH alternative: ssh://git@bitbucket.svc.elca.ch:7999/dbl-java-agenticengineering/agentic-engineering-training.git
#    Backup mirror (GitHub, SSH only for ELCA-managed accounts): git@github.com:tillpeyer/AI-Training.git
cd lunch-order/advanced

# 2. Install BMAD (pick "Claude Code" as the IDE)
#    Stable channel — do NOT use @beta or a -next. version in this repo.
npx bmad-method install

# 3. Install the ELCAi method on top — adds the Auditor (Olivia) + workshop agent customisations
#    Needs checks 7 and 8 from "Before the session" (Artifactory registry + login).
npm install -g @elca-agenticengineering/elcai-method
elcai-method install

# 4. Verify the app boots (uses the Maven wrapper — no manual Maven install needed)
./mvnw spring-boot:run         # Windows: .\mvnw.cmd spring-boot:run
# → http://localhost:8080/actuator/health = UP

# 5. Open Claude Code
claude

# 6. Pick one story from docs/stories/, then run the Phase 4 cycle.
#    Most roles are SKILLS now, invoked in natural language — not slash commands.
#    BMAD 6.10.x moved the agent personas out of .claude/commands/ into .claude/skills/.
```

| Step | Say this | Role |
|---|---|---|
| Lock the story | `create the next story` | Story prep (Scrum Master) — the `bmad-create-story` skill |
| Implement it | `talk to Amelia` | Developer — the `bmad-agent-dev` skill |
| Review the diff | `run code review` | `bmad-code-review` — parallel review layers with fresh contexts. **This is what verifies acceptance criteria** |
| Deeper test strategy | `talk to Murat` | Test Architect — the `bmad-tea` skill |

`/bmad-agent-bmm-qa` still exists as a slash command, but its only substantive menu item is **E2E test generation** — it does *not* verify acceptance criteria. Use `run code review` for that.

> **If you have an older copy of this README** telling you to run `/bmad-agent-bmm-sm`, `/bmad-agent-bmm-dev` or `/bmad-agent-bmm-tea`: those slash commands no longer exist. Corrected 2026-09-03.

Each story is **independent** — pick whichever appeals to you. Story 1 is the smallest, recommended as a first cycle. Story 6 is the largest — it adopts an existing Angular baseline and closes its gaps, so it is best as a second-block or full-day exercise, and it expects you to read `frontend-angular/DESIGN.md` and `EXPERIENCE.md` first.

## Tech stack

- **Backend (Epic 1)**: Java 21 (LTS), Spring Boot 3.5.0, Maven 3.9+, H2 in-memory database (no setup)
- **Frontend (Epic 2)**: Angular 21 + TypeScript 5.9 (Story 6 / story 2.1) — *rewritten 2026-09-03; this previously said React 18 + Vite 5*

## License & attribution

Workshop content for internal training. Reuse welcome with attribution.

— Till Flurin Peyer · Agentic Engineering Unit
