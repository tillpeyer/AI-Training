---
name: 'elcai-check-env'
description: 'elcai environment check'
---

Check this project's Claude Code environment config for drift. Report only — never write to any file without asking first and confirming the exact change.

<steps CRITICAL="TRUE">

1. **MCP servers.** Read `.mcp.json` (if present) and list the keys under `mcpServers`. Read `.claude/settings.local.json` and `.claude/settings.json` (if present) and extract `enabledMcpjsonServers`. Diff the two sets:
   - Servers defined in `.mcp.json` but not in `enabledMcpjsonServers` (installed but off).
   - Servers in `enabledMcpjsonServers` with no matching entry in `.mcp.json` (dead reference — will silently no-op).

2. **Hooks.** If `.claude/settings.json` has a `hooks` block, for every hook `command` that references a local script path (relative, or via `${CLAUDE_PROJECT_DIR}`), resolve and verify the file exists on disk. Flag any hook pointing at a missing script.

3. **BMAD version.** Read `_bmad/_config/manifest.yaml` for the `core` and `bmm` module versions. Run `npm view bmad-method dist-tags` and compare against the `latest` tag. Report the installed version, the current stable version, and whether they match — do not assume a mismatch is wrong, just state the fact.

4. **ELCAi version.** If `_bmad/elcai/` exists, read the `version:` field from `_bmad/elcai/module.yaml` directly (the BMAD manifest shows `source: unknown, version: null` for elcai — that's expected, not a bug, since `bmad-method` doesn't manage it). Run `npm view @elca-agenticengineering/elcai-method dist-tags` and report installed vs. `latest` vs. `alpha`/`next` (whichever prerelease tag exists) without assuming which one *should* be installed — that's a per-project policy call, not this command's to make.

5. **ELCAi module config resolution.** BMAD's installer cannot parse `_bmad/elcai/module.yaml` on any project (logs `could not locate module.yaml for 'elcai'` on every install/update — a generic ELCAi packaging issue, not project-specific), so `[modules.elcai]` never gets auto-written to `_bmad/config.toml` the way `[modules.bmm]`/`[modules.tea]` do. If `_bmad/elcai/` exists, run `python3 _bmad/scripts/resolve_config.py --project-root {project-root} --key modules.elcai` (or `java`/whatever runner is configured) and check it returns a non-empty object. If empty, any ELCAi skill referencing `{config.<key>}`-style variables (the auditor skill's `{jira_project_key}`/`{confluence_project_space}`, etc.) will resolve to nothing or a literal placeholder — flag it and point at `_bmad/custom/config.toml` as the fix (the team-committed override layer the installer never touches). Don't fabricate values for the fix — only use ones the user confirms are real for this project.

6. **Stale backup artifacts.** Check `_bmad-output/backups/*` (if present) for snapshots of skills/workflows that no longer match anything under `.claude/skills/` (e.g. a backup directory named after a skill that's since been renamed or restructured). These are one-time safety snapshots from a past migration, not living config — flag any that look orphaned, but don't delete without asking; the user may still want the historical record.

7. **Report.** Print a table: component | current | reference (stable/enabled) | status (ok / drift / missing). End with: "No files were changed. Tell me which of these you'd like fixed, and I'll make exactly that change after you confirm."

</steps>
