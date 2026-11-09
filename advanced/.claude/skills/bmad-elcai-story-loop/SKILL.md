---
name: bmad-elcai-story-loop
description: 'Autonomous dev-to-review loop from story-ready to PR-ready. Single preflight approval gate, up to N iterations wrapping bmad-dev-auto, then opens a PR against the configured target branch. Use when the user says "run the story loop", "dev + QA + review this story", or "start a loop for a feature".'
---

# Story Loop

**Goal:** Take a dev-ready story from story-ready to PR-ready with a single preflight approval, then run autonomously — wrapping `bmad-dev-auto` for the actual work — up to N iterations, and open a PR against the configured target branch when the code is clean.

**Your Role:** Orchestrator of one autonomous story-to-PR run. You do NOT implement code yourself. You call `bmad-dev-auto` for each iteration, inspect its terminal status, and decide whether to iterate again, open a PR, or HALT.

## Human gates

Only two:

1. **Story-ready** — user picks input source and approves the preflight batch of actions the loop will take.
2. **Merge-ready** — user reviews the opened PR and decides to merge or request changes.

Everything in between is autonomous.

## HALT protocol

Set a final `{{loop_status}}` and stop:

- `blocked` — `bmad-dev-auto` returned blocked, or an operation outside the preflight batch is required. Report the exact blocking condition and what extra approval is needed to resume.
- `iterations-exhausted` — `{{max_iterations}}` reached without dev-auto returning `done`.
- `preflight-declined` — user did not approve the preflight batch.
- `done` — dev-auto returned `done` + PR opened successfully.

## Conventions

- `{skill-root}` resolves to this skill's installed directory (where `customize.toml` lives).
- `{project-root}` resolves to the project working directory.
- `{skill-name}` resolves to this skill directory's basename.

## On Activation

### Step 1: Resolve the Workflow Block

Run: `python3 {project-root}/_bmad/scripts/resolve_customization.py --skill {skill-root} --key workflow`

If the script fails, resolve `workflow` yourself by reading base → team → user in order:

1. `{skill-root}/customize.toml`
2. `{project-root}/_bmad/custom/{skill-name}.toml`
3. `{project-root}/_bmad/custom/{skill-name}.user.toml`

Merge rules: scalars override, tables deep-merge, arrays of tables keyed by `code`/`id` replace-or-append, other arrays append.

After resolution, the workflow-block keys `max_iterations`, `target_branch`, `on_complete`, and `persistent_facts` are available as bare `{{...}}` names inside the workflow block below.

### Step 2: Preflight — verify dependent skills

Confirm both of these skill directories exist under `{project-root}/.claude/skills/`:

- `bmad-dev-auto`
- `bmad-create-story` (only required if the user picks option 3 in Step 1 of the workflow)

If a required dependency is missing, HALT before entering the workflow with `{{loop_status}} = blocked`, blocking condition `missing-dependency: <skill-name>`. Instruct the user to run:

```
npx bmad-method@6.10.1-next.12 install --directory {project-root} --action update --yes
```

### Step 3: Load Config

Load `{project-root}/_bmad/bmm/config.yaml` and resolve:

- `project_name`, `user_name`
- `communication_language`, `document_output_language`, `user_skill_level`
- `planning_artifacts`, `implementation_artifacts`
- `date` = system-generated current datetime

You MUST speak in `{communication_language}` and tailor style to `{user_skill_level}`. Generate documents in `{document_output_language}`.

### Step 4: Greet the User

Greet `{user_name}` and state the goal in one sentence.

## Workflow Execution

<workflow>
  <critical>Two human gates only: story-ready (preflight batch approval at Step 2) and merge-ready (PR review after Step 7). Everything in between is autonomous.</critical>
  <critical>You do NOT implement code yourself. Each iteration MUST be delegated to bmad-dev-auto — never call bmad-dev-story / bmad-code-review directly from this workflow.</critical>
  <critical>Do NOT merge the PR. Opening it is this loop's terminal action.</critical>
  <critical>If any action would require approval outside the preflight batch, HALT with {{loop_status}} = blocked and state exactly what extra approval is needed to resume.</critical>

  <step n="1" goal="Pick input source">
    <output>How would you like to feed this loop?
      1. Existing story file (provide path)
      2. Next ready-for-dev story from sprint-status.yaml
      3. Create a fresh story via bmad-create-story
    </output>
    <ask>Choose 1, 2, or 3:</ask>

    <check if="user chooses 1">
      <ask>Absolute path to story file:</ask>
      <action>Verify the file exists and is readable; store as {{story_path}}</action>
    </check>

    <check if="user chooses 2">
      <action>Read {implementation_artifacts}/sprint-status.yaml</action>
      <action>Find the first story with status "ready-for-dev"</action>
      <action if="no ready-for-dev story found">Set {{loop_status}} = blocked, blocking condition = "no-ready-story"; HALT</action>
      <action>Set {{story_path}} = the matching story file in {implementation_artifacts}</action>
    </check>

    <check if="user chooses 3">
      <action>Invoke the bmad-create-story skill; wait synchronously for it to complete</action>
      <action>Set {{story_path}} = the created story file path from bmad-create-story's terminal output</action>
    </check>

    <action>Read the story file at {{story_path}}</action>
    <action>Set {{story_key}} = the story key parsed from the filename (basename without .md), e.g. "1-2-user-auth"</action>
    <action>Set {{story_title}} = the H1 heading from the story file, stripped of any "Story {{story_key}}:" prefix</action>
    <action>Set {{story_slug}} = a kebab-case slug of {{story_title}}, max 40 chars</action>
  </step>

  <step n="2" goal="Preflight — present the batch and get one approval" tag="human-gate">
    <critical>This is the only human decision point until the PR opens.</critical>

    <output>**Preflight batch — please review and approve as one:**

      Story: {{story_path}} ({{story_key}})
      Target branch: {{target_branch}}
      Max iterations: {{max_iterations}}

      Actions the loop will take autonomously:

      1. Create a feature branch `feature/{{story_key}}-{{story_slug}}` from {{target_branch}} (only if we're currently on {{target_branch}}; otherwise continue on the current branch).
      2. Up to {{max_iterations}} iterations of:
         - Invoke `bmad-dev-auto` on {{story_path}}
         - If dev-auto returns `blocked`, HALT and report the blocking condition
         - If dev-auto returns `done`, break out and open the PR
         - Otherwise, run dev-auto again with the story's current review findings as input
      3. Push the branch and open a PR against `{{target_branch}}` via `gh pr create`
      4. Report the PR URL

      Actions NOT covered by this batch (would require re-approval):
      - Adding new npm/maven/gem/etc. dependencies
      - Modifying files outside the story's scope
      - Merging the PR (that stays a human decision)
      - Force-pushing or rewriting shared history
    </output>
    <ask>Approve the batch? (yes / no / edit)</ask>

    <check if="user says no">
      <action>Set {{loop_status}} = preflight-declined; HALT</action>
    </check>

    <check if="user says edit">
      <ask>Which parameter to change (target_branch / max_iterations)?</ask>
      <action>Update the in-memory value; re-render the batch and re-ask.</action>
    </check>

    <check if="user approves">
      <action>Log the approved batch as the authoritative constraint for the rest of the run.</action>
    </check>
  </step>

  <step n="3" goal="Ensure feature branch">
    <action>Set {{current_branch}} = output of `git rev-parse --abbrev-ref HEAD`</action>

    <check if="{{current_branch}} == {{target_branch}}">
      <action>Set {{feature_branch}} = "feature/{{story_key}}-{{story_slug}}"</action>
      <action>Run `git checkout -b {{feature_branch}}`</action>
    </check>

    <check if="{{current_branch}} != {{target_branch}}">
      <action>Set {{feature_branch}} = {{current_branch}} — continue on the current branch, treating it as the feature branch for the PR.</action>
    </check>
  </step>

  <step n="4" goal="Initialize the iteration counter">
    <action>Set {{iteration}} = 0</action>
    <action>Set {{last_status}} = "not-run"</action>
    <goto step="5">first iteration</goto>
  </step>

  <step n="5" goal="One iteration — invoke bmad-dev-auto and branch on its result" tag="autonomous">
    <critical>Each visit to this step MUST invoke bmad-dev-auto exactly once. Do NOT call bmad-dev-story / bmad-code-review from here — bmad-dev-auto orchestrates them internally.</critical>

    <action>Increment {{iteration}} by 1</action>

    <output>▶ Iteration {{iteration}} of {{max_iterations}} — invoking bmad-dev-auto on {{story_path}}…</output>

    <action>Invoke the `bmad-dev-auto` skill with the story path {{story_path}}. Wait synchronously for it to return.</action>
    <action>Read the terminal `status` from dev-auto's Auto Run Result section in {{story_path}}</action>
    <action>Set {{last_status}} = that status</action>

    <check if="{{last_status}} == 'blocked'">
      <action>Extract the blocking condition from the Auto Run Result</action>
      <action>Set {{loop_status}} = blocked; HALT and propagate the blocking condition</action>
    </check>

    <check if="{{last_status}} == 'done'">
      <goto step="6">open PR</goto>
    </check>

    <!-- Any non-terminal status: iterate again if we have budget -->
    <check if="{{iteration}} &lt; {{max_iterations}}">
      <output>Iteration {{iteration}} did not reach `done` (status: {{last_status}}). Re-running.</output>
      <goto step="5">next iteration</goto>
    </check>

    <check if="{{iteration}} &gt;= {{max_iterations}}">
      <action>Set {{loop_status}} = iterations-exhausted; HALT and report {{last_status}} plus any pending review items in {{story_path}}</action>
    </check>
  </step>

  <step n="6" goal="Open the PR" tag="autonomous">
    <action>Run `git push --set-upstream origin {{feature_branch}}`</action>

    <action>Set {{remote_url}} = output of `git remote get-url origin`</action>
    <action>Detect {{git_host}} from {{remote_url}}:
      - contains `github.com`                  → {{git_host}} = "github"
      - contains `bitbucket.org`               → {{git_host}} = "bitbucket-cloud"
      - contains `bitbucket` (any other host)  → {{git_host}} = "bitbucket-server"
      - contains `gitlab`                      → {{git_host}} = "gitlab"
      - else                                   → {{git_host}} = "unknown"
    </action>
    <action>Parse {{repo_owner}} and {{repo_name}} from {{remote_url}}, preserving case exactly as it appears in the URL:
      - SSH form `git@host:owner/repo.git`                     → owner / repo
      - HTTPS form `https://host/owner/repo(.git)?`            → owner / repo
      - Bitbucket Server SSH `ssh://git@host:PORT/prj/repo.git` → {{repo_owner}} = prj (case preserved)
      - Bitbucket Server HTTPS `https://host/scm/prj/repo.git`  → {{repo_owner}} = prj (case preserved)
      Strip a trailing `.git` if present.
    </action>
    <action>Set {{host_domain}} = the host portion of {{remote_url}} (e.g. `github.com`, `bitbucket.svc.elca.ch`).</action>

    <action>Compose {{pr_title}} = "{{story_key}}: {{story_title}}"</action>
    <action>Compose {{pr_body}} from the story's Dev Agent Record → Completion Notes + File List</action>
    <action>Write {{pr_body}} to a temp file at `{project-root}/.git/PR_BODY.md`</action>

    <check if="{{git_host}} == 'github'">
      <action>Run `gh pr create --base {{target_branch}} --title "{{pr_title}}" --body-file {project-root}/.git/PR_BODY.md`</action>

      <check if="gh returns a URL on stdout">
        <action>Set {{pr_url}} = the URL from gh's stdout</action>
        <action>Delete the temp file `{project-root}/.git/PR_BODY.md`</action>
      </check>

      <check if="gh fails (401, not found, missing scope, etc.)">
        <action>Set {{pr_url}} = "https://{{host_domain}}/{{repo_owner}}/{{repo_name}}/compare/{{feature_branch}}?expand=1"</action>
        <output>⚠ `gh pr create` failed — open the PR in a browser: {{pr_url}}
          The PR body is prepared at `{project-root}/.git/PR_BODY.md`; paste it manually.
        </output>
      </check>
    </check>

    <check if="{{git_host}} == 'bitbucket-server'">
      <!-- ELCA-style Bitbucket Server / Bitbucket Data Center. No consistent CLI; route to the compare URL. -->
      <action>Set {{pr_url}} = "https://{{host_domain}}/projects/{{repo_owner}}/repos/{{repo_name}}/pull-requests?create&sourceBranch=refs/heads/{{feature_branch}}&targetBranch=refs/heads/{{target_branch}}"</action>
      <output>ℹ Bitbucket Server detected — no CLI PR-open. Open in browser: {{pr_url}}
        The PR body is prepared at `{project-root}/.git/PR_BODY.md`; paste it into the "Description" field.
      </output>
    </check>

    <check if="{{git_host}} == 'bitbucket-cloud'">
      <action>Set {{pr_url}} = "https://bitbucket.org/{{repo_owner}}/{{repo_name}}/pull-requests/new?source={{feature_branch}}&dest={{target_branch}}"</action>
      <output>ℹ Bitbucket Cloud detected — no CLI PR-open. Open in browser: {{pr_url}}
        The PR body is prepared at `{project-root}/.git/PR_BODY.md`; paste it into the "Description" field.
      </output>
    </check>

    <check if="{{git_host}} == 'gitlab'">
      <action>Set {{pr_url}} = "https://{{host_domain}}/{{repo_owner}}/{{repo_name}}/-/merge_requests/new?merge_request[source_branch]={{feature_branch}}&merge_request[target_branch]={{target_branch}}"</action>
      <output>ℹ GitLab detected. Open the MR in browser: {{pr_url}}
        The MR description is prepared at `{project-root}/.git/PR_BODY.md`; paste it manually.
      </output>
    </check>

    <check if="{{git_host}} == 'unknown'">
      <action>Set {{pr_url}} = "(unknown host — open a PR manually in your git server's UI)"</action>
      <output>⚠ Could not detect the git host from remote URL `{{remote_url}}`.
        The feature branch `{{feature_branch}}` has been pushed. Open a PR in your git server's UI against `{{target_branch}}`.
        The PR body is prepared at `{project-root}/.git/PR_BODY.md`.
      </output>
    </check>

    <action>Set {{loop_status}} = done</action>
  </step>

  <step n="7" goal="Terminal report" tag="human-gate">
    <output>✅ **Story Loop complete — PR is ready for your review.**

      Story: {{story_path}}
      Iterations used: {{iteration}} of {{max_iterations}}
      Feature branch: {{feature_branch}}
      Target: {{target_branch}}
      PR: {{pr_url}}

      Next step is yours: review the PR and merge, or request changes.
    </output>

    <action>Run: `python3 {project-root}/_bmad/scripts/resolve_customization.py --skill {skill-root} --key workflow.on_complete` — if the resolved value is non-empty, follow it as the final terminal instruction before exiting.</action>
  </step>

</workflow>

## Non-goals

- This skill does NOT create stories from scratch beyond delegating to `bmad-create-story` when option 3 is chosen at Step 1.
- This skill does NOT run a full sprint — one story per invocation.
- This skill does NOT push to `{{target_branch}}` directly or auto-merge under any circumstance.
- This skill does NOT run a separate code-review pass on top of `bmad-dev-auto`. Dev-auto handles clarify → plan → implement → review internally in each iteration; wrapping it with an extra `bmad-code-review` invocation would duplicate work. If you want a defense-in-depth review, invoke `bmad-code-review` manually after this loop opens the PR.
