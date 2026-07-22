---
name: 'install-story-loop'
description: 'Copy the bmad-elcai-story-loop skill from THIS AI-Training repo into another BMAD 6.10.x project. Use when the user says "install the story loop in <path>" or "add story-loop to <target>".'
---

IT IS CRITICAL THAT YOU FOLLOW THESE STEPS EXACTLY.

<steps CRITICAL="TRUE">

0. **Confirm you are running inside the AI-Training repo (the source of truth).** Verify that `{project-root}/.claude/skills/bmad-elcai-story-loop/SKILL.md` exists. If it does not, STOP and tell the user:

   > This skill must be run from inside the `AI-Training` repo (the source of the story-loop skill). Open Claude Code in the AI-Training checkout and try again.

1. **Get the target project path.** If not provided as an argument, ask: "Absolute path to the target project?" Store as `{target}`. Verify `{target}` exists and is a directory. If not, STOP and report.

2. **Preflight — BMAD 6.10.x must be installed in the target.** The bmad-elcai-story-loop skill wraps `bmad-dev-auto` (and optionally invokes `bmad-create-story` when the user picks option 3 at runtime). Check ALL of these exist:
   - `{target}/_bmad/bmm/config.yaml`
   - `{target}/.claude/skills/bmad-dev-auto/SKILL.md`
   - `{target}/.claude/skills/bmad-create-story/SKILL.md`

   If ANY are missing, STOP and output verbatim, then HALT:

   > **BMAD 6.10.x is not fully installed in `{target}`.**
   >
   > The story-loop wraps skills shipped by `bmad-method` — they must be present before the loop can run. Install (or update) BMAD, then ask to install the story loop again:
   >
   > ```
   > npx bmad-method@<stable-version> install --directory {target} --action update --yes
   > ```
   >
   > Missing files:
   > - `<list only the missing paths>`

3. **Show the user what will be copied and ask for approval.** Present this batch, then ask "Proceed?":

   Files to copy (overwrites existing in target):
   - `.claude/skills/bmad-elcai-story-loop/SKILL.md` → `{target}/.claude/skills/bmad-elcai-story-loop/SKILL.md`
   - `.claude/skills/bmad-elcai-story-loop/customize.toml` → `{target}/.claude/skills/bmad-elcai-story-loop/customize.toml`
   - `.claude/skills/bmad-elcai-story-loop/checklist.md` → `{target}/.claude/skills/bmad-elcai-story-loop/checklist.md`
   - `.claude/skills/install-story-loop/SKILL.md` → `{target}/.claude/skills/install-story-loop/SKILL.md` (so the target can re-install elsewhere)

   Files to modify (best-effort):
   - `{target}/.gitignore` — add allowlist lines for `.claude/skills/bmad-elcai-story-loop/**` and `.claude/skills/install-story-loop/**` (only if the target's `.gitignore` already blanket-ignores `.claude/*`)

   Nothing under `{target}/_bmad/` is touched — the new BMAD architecture keeps all skills under `.claude/skills/`.

   If the user does not approve, STOP.

4. **Copy the skill directory.** Create `{target}/.claude/skills/bmad-elcai-story-loop/` if missing, then copy all three files from `{project-root}/.claude/skills/bmad-elcai-story-loop/` to the same relative path in `{target}`.

5. **Copy this install skill** (so the target project can install to further projects). Create `{target}/.claude/skills/install-story-loop/` if missing, then copy `{project-root}/.claude/skills/install-story-loop/SKILL.md` to `{target}/.claude/skills/install-story-loop/SKILL.md`.

6. **Update the target `.gitignore` (best effort).** Read `{target}/.gitignore` if it exists. If it contains any `.claude/*` blanket-ignore line but does NOT already contain `!.claude/skills/bmad-elcai-story-loop/`, append this block to the bottom of the file:

   ```
   # Allowlist bmad-elcai-story-loop skill + install-story-loop skill so participants get them via git pull
   !.claude/skills/
   .claude/skills/*
   !.claude/skills/bmad-elcai-story-loop/
   !.claude/skills/bmad-elcai-story-loop/**
   !.claude/skills/install-story-loop/
   !.claude/skills/install-story-loop/**
   ```

   If the target has no `.gitignore` or has no `.claude/*` ignore lines, skip this step — do NOT create a new `.gitignore`.

7. **Verify.** After copying, check that:
   - The 3 `bmad-elcai-story-loop/*` files exist at the target paths.
   - The 3 preflight files listed in Step 2 STILL exist (BMAD wasn't disturbed).
   - `install-story-loop/SKILL.md` exists at `{target}/.claude/skills/install-story-loop/`.

8. **Report the outcome to the user:**
   - List of files copied (with target paths).
   - `.gitignore` state (appended / unchanged / absent).
   - Next step: "Restart Claude Code in `{target}`. The `bmad-elcai-story-loop` skill should appear in the skill list. Invoke it by saying 'run the story loop'."

</steps>
