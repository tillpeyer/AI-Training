# Workshop FAQ

Questions participants asked in the 2026 Advanced and Basics sessions, with short answers. If yours is not here, ask in the session chat.

## Setup

**Do I need a Jira project or a Confluence space?**
No. The stories in `docs/stories/` are local files, and every exercise works without Jira. The live MCP demo uses the trainer's Jira; you watch and steer.

**Do I need admin rights?**
No. Every step in the README's "Before the session" checklist works with user rights, including the PowerShell execution policy (`-Scope CurrentUser`) and the PATH change.

**I get "Token generation for user anonymous is prohibited".**
npm opened Artifactory in a browser where you are not logged in. Log in at [artifactory.svc.elca.ch](https://artifactory.svc.elca.ch/) in your default browser, then run `npm login --auth-type=web --scope=@elca-agenticengineering` again.

**claude.ai says I have no licence.**
You logged in with SSO, which creates a second, unlicensed account. Log out, then use **email login** with the address listed on [manager.svc.elca.ch/my](https://manager.svc.elca.ch/my).

**Does each project need its own ELCAi installation?**
The `elcai-method` CLI is installed once per machine (`npm install -g`). `elcai-method install` then runs once per project, because it writes the agents and skills into that project's `_bmad/` and `.claude/` folders.

**Should I start a new session or use `/clear`?**
Both give the agent a clean context. `/clear` keeps you in the same terminal and project; a new session is the same thing with an extra step. Start fresh between stories either way.

## Using BMAD on a real project

**How do I bring an existing (brownfield) project into BMAD?**

1. Run `elcai-method install` in the project root.
2. Say `document this project`. The `bmad-document-project` skill reads the codebase and writes its findings under `_bmad-output/`.
3. Say `generate project context`. The `bmad-generate-project-context` skill writes `_bmad-output/project-context.md`, the short list of rules and traps the dev skills load automatically. This repo's own file is a worked example.
4. Continue with stories as in the workshop. Write each story against the documented code, not a fresh PRD.

**`_bmad/` has about 1,000 files. What do I commit?**
Commit `_bmad-output/` (your PRD, architecture, stories) and `_bmad/custom/` (team overrides). Do not commit the rest of `_bmad/`: it is installer output, recreated by `elcai-method install`. This repo's `.gitignore` shows the pattern.

**What if a workflow needs an answer only the client can give?**
Stop the workflow. Everything it produced so far is saved under `_bmad-output/`. After the client workshop, start a new session and ask the skill to update the existing document (for example `update the PRD`). Note the open question in the document itself so it is not lost.

**Which model should I use?**
Use the strongest model for planning and review (PRD, architecture, code review), where one wrong decision is expensive. A faster model is fine for implementing a well-specified story. Your machine does not affect how fast the model thinks, because it runs on Anthropic's servers. It does affect builds and tests, which run locally.

## BMAD and the alternatives

**How does BMAD compare with Spec Kit, OpenSpec, Superpowers and GSD?**
All of them make the agent work from written specs instead of loose prompts. BMAD covers the whole lifecycle with named roles (analyst, PM, architect, developer, test architect) and is what ELCAi builds on, so its outputs match ELCA's quality gates. The others are lighter and focus on fewer phases. A comparison of spec-driven tools: [Understanding Spec-Driven Development: Kiro, spec-kit, and Tessl](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html) (Martin Fowler).

**What is ELCA-specific about the ELCAi story loop?**
Plain BMAD stops for you after each step. The story loop runs develop → test → code review on one story by itself, with only two human gates: you approve one batch of actions before it starts, and you review the pull request it opens against the project's configured target branch. Anything outside the approved batch makes it stop and ask.
