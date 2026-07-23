---
name: 'check-training-env'
description: 'AI-Training environment check'
---

AI-Training-repo-specific environment check. Overlaps `elcai-check-env` (run that first for the generic MCP/hooks/version checks) and adds this repo's own policy on top. Not portable — these checks assume you're in the AI-Training workshop repo specifically. Report only — never write to any file without asking first and confirming the exact change.

<steps CRITICAL="TRUE">

1. **Run the generic checks first.** Invoke `elcai-check-env`'s steps (MCP servers, hooks, BMAD/ELCAi versions, ELCAi module config resolution, stale backup artifacts) before continuing.

2. **Workshop MCP servers.** Verify `atlassian`, `sonarqube`, `jenkins`, and `ELCA-MCP` are all present in both `.mcp.json` and `enabledMcpjsonServers`. These are the servers Block 3's live MCP demo depends on.

3. **BMAD must be stable.** Per this repo's explicit policy, BMAD is pinned to the current stable `latest` dist-tag here — unlike some other ELCAi projects, this repo does NOT run BMAD prereleases. Flag it if `_bmad/_config/manifest.yaml` shows a `-next.` or other prerelease version for `core`/`bmm`.

4. **ELCAi must be unstable/alpha.** Per this repo's explicit policy — the opposite direction from BMAD — ELCAi is pinned to the `alpha`/`next` channel here specifically. Flag it if `_bmad/elcai/module.yaml`'s `version:` is a plain stable release instead of an alpha/prerelease tag.

5. **Story-loop skills present.** Verify both `.claude/skills/bmad-elcai-story-loop/` and `.claude/skills/install-story-loop/` exist with their `SKILL.md` files.

6. **Safety hook wired.** Verify `.claude/hooks/git-safety-guard.ps1` exists, and that `.claude/settings.json` has a `PreToolUse` hook on matcher `Bash` pointing at it.

7. **Gitignore coverage.** Verify `.gitignore` ignores `.agents/`, `.github/`, and blanket-ignores `.claude/*` except for the two story-loop skill allowlists from step 5.

8. **ELCAi module config has this repo's expected values.** `elcai-check-env` (step 1) already checks whether `[modules.elcai]` resolves at all — this repo-specific check verifies the *values* are the right ones: `jira_project_key` = `RHBGAF`, `confluence_project_space`/`confluence_technical_space` = `LOCAL-ONLY` (pinned manually in `_bmad/custom/config.toml`, since the installer can't write this section itself). Flag it if these differ from what's expected here.

9. **Report.** A pass/fail checklist for steps 2-8, plus whatever `elcai-check-env` reported in step 1. End with: "No files were changed. Tell me which of these you'd like fixed, and I'll make exactly that change after you confirm."

</steps>
