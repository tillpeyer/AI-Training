# Agentic Engineering — Advanced Workshop Starter

A small Spring Boot service used in the **Advanced Instructor-Led** training for the Agentic Engineering programme. Five v1 backend stories plus an Epic 2 frontend story, ready to lock and implement with BMAD agents.

The Lunch Order API is a fictional service that handles a daily lunch menu and per-employee orders. Small enough to ship in a 60-minute workshop, real enough to exercise the full BMAD Phase 4 cycle.

## What's in this repo

| Path | Purpose |
|---|---|
| `pom.xml` | Spring Boot 3.5 + Java 21 + H2. Compiles and boots out of the box. |
| `src/main/java/.../LunchOrderApplication.java` | Spring Boot app — your starting point. |
| `_bmad-output/planning-artifacts/prd.md` | Phase 2 artefact — pretend the PM agent gave you this. |
| `docs/tech-spec.md` | Phase 3 artefact — pretend the architect gave you this. |
| `docs/stories/STORY-1-list-menu.md` … `STORY-5-admin-add-menu-item.md` | Five v1 backend story drafts (Epic 1). |
| `docs/stories/STORY-6-frontend-v1.md` | Epic 2 frontend story draft — React + Vite + TypeScript, Claude-designed. |

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
# 1. Clone this repo into a fresh folder
git clone <repo-url> lunch-order
cd lunch-order

# 2. Install BMAD (pick "Claude Code" as the IDE)
npx bmad-method@beta install

# 3. Install the ELCAi method on top — adds the Auditor (Amelie) + workshop agent customisations
npm install -g @elca-agenticengineering/elcai-method
elcai-method install

# 4. Verify the app boots (uses the Maven wrapper — no manual Maven install needed)
./mvnw spring-boot:run         # Windows: .\mvnw.cmd spring-boot:run
# → http://localhost:8080/actuator/health = UP

# 5. Open Claude Code
claude

# 6. Pick one story from docs/stories/, then:
/bmad-agent-bmm-sm             # lock the story
/bmad-agent-bmm-dev            # implement it
/bmad-agent-bmm-qa             # verify (or /bmad-agent-bmm-tea for the TEA agent)
```

Each story is **independent** — pick whichever appeals to you. Story 1 is the smallest, recommended as a first cycle. Story 6 is the largest (full Epic 2 frontend) — best as a second-block or full-day exercise.

## Tech stack

- **Backend (Epic 1)**: Java 21 (LTS), Spring Boot 3.5.0, Maven 3.9+, H2 in-memory database (no setup)
- **Frontend (Epic 2)**: React 18 + Vite 5 + TypeScript (added in Story 6)

## License & attribution

Workshop content for internal training. Reuse welcome with attribution.

— Till Flurin Peyer · Agentic Engineering Unit
