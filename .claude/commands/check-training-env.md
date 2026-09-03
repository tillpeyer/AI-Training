---
name: 'check-training-env'
description: 'AI-Training environment check'
---

AI-Training-repo-specific environment check. Overlaps `elcai-check-env` (run that first for the generic MCP/hooks/version checks) and adds this repo's own policy on top. Not portable — these checks assume you're in the AI-Training workshop repo specifically. Report only — never write to any file without asking first and confirming the exact change.

<steps CRITICAL="TRUE">

1. **Run the generic checks first.** Invoke `elcai-check-env`'s steps (MCP servers, hooks, BMAD/ELCAi versions, ELCAi module config resolution, stale backup artifacts) before continuing.

2. **Workshop MCP servers.** Verify `sonarqube` and `ELCA-MCP` are present in both `.mcp.json` and `enabledMcpjsonServers`. These are the servers Block 3's live MCP demo depends on. Two servers are deliberately **absent** — do not flag either, and flag it instead if someone re-adds one:
   - **No `jenkins`** — driven by the `/elcai-jenkins-cli` slash command.
   - **No `atlassian`** — removed 2026-08-06. `ELCA-MCP` covers the Jira loop this repo actually uses (search, get, create, update, transition, comment, link) plus Confluence, and it is role-gated and audit-logged. `atlassian` was a 63-tool Jira-only surface whose ~45 extras (batch ops, agile-board writes, JSM, worklogs, proforma forms) nothing here called; it also exposed no Confluence tools at all, since `.mcp.json` set only `JIRA_*` env. Accept that ELCA-MCP has no equivalent for `jira_link_to_epic`, `jira_get_project_issues`, or `jira_create_remote_issue_link`.

   Both reflect this repo's CLI-and-narrow-surface preference: a CLI costs one `--help` call, an MCP server advertises its whole tool surface on every request.

3. **BMAD must be stable.** Per this repo's explicit policy, BMAD is pinned to the current stable `latest` dist-tag here — unlike some other ELCAi projects, this repo does NOT run BMAD prereleases. Flag it if `_bmad/_config/manifest.yaml` shows a `-next.` or other prerelease version for `core`/`bmm`.

4. **ELCAi tracks the newest published release.** There is no alpha channel any more — ELCAi's own delivery process (`elcai-deliver`, from 0.11.4 onward) deliberately unpublishes alpha artifacts and deletes alpha tags, which left the npm `alpha` dist-tag dangling at a 404 version. Do **not** treat the `alpha` dist-tag as a target, and do not read `npm view dist-tags` as authoritative on its own: verify a version actually resolves (`npm view @elca-agenticengineering/elcai-method@<v> version`) before calling it available. Compare `_bmad/elcai/module.yaml`'s `version:` against the highest *published* version in `npm view @elca-agenticengineering/elcai-method versions`, and note that this may be higher than the `latest` tag. Flag a lag of more than a release or two; a prerelease-looking version installed here means a stale local build, not policy.

5. **Story-loop skills present.** Verify both `.claude/skills/bmad-elcai-story-loop/` and `.claude/skills/install-story-loop/` exist with their `SKILL.md` files.

6. **Safety hook wired.** Read the `PreToolUse`/`Bash` hook `command` in `.claude/settings.json`, extract the script path it actually references, and verify **that** file exists — don't assert a specific variant. Both `git-safety-guard.sh` (git-bash) and `git-safety-guard.ps1` ship; the wired one is currently the `.sh`. Checking for the `.ps1` while the hook runs the `.sh` passes for the wrong reason and would keep passing if the depended-on script were deleted. Apply the same resolve-then-verify logic to the `PostToolUse` and `SessionStart`/`Notification` hooks.

7. **Gitignore coverage — check the index, not just the rules.** Reading `.gitignore` is not sufficient: **gitignore does not apply to already-tracked files**, so a file committed before a rule existed stays tracked and silently churns on every installer run. Do both halves:
   a. **Rules:** `.gitignore` ignores `.agents/`, `.github/`, and blanket-ignores `.claude/*` except the story-loop allowlists from step 5.
   b. **Index (the half that actually catches drift):** run `git ls-files _bmad/ .claude/ .agents/ .github/` and confirm every result is intentionally allowlisted. Expected tracked set is `_bmad/custom/config.toml`, `.claude/settings.json`, the two story-loop skill dirs, the hook scripts, and the two diagnostic commands — **anything else tracked under these paths is drift.** Cross-check with `git status --short _bmad/`: a modified installer-output file is the symptom.

8. **ELCAi module config has this repo's expected values.** `elcai-check-env` (step 1) already checks whether `[modules.elcai]` resolves at all — this repo-specific check verifies the *values* are the right ones: `jira_project_key` = `RHBGAF`, `confluence_project_space`/`confluence_technical_space` = `LOCAL-ONLY` (pinned manually in `_bmad/custom/config.toml`, since the installer can't write this section itself). Flag it if these differ from what's expected here.

9. **Report.** A pass/fail checklist for steps 2-8, plus whatever `elcai-check-env` reported in step 1. End with: "No files were changed. Tell me which of these you'd like fixed, and I'll make exactly that change after you confirm."

</steps>
