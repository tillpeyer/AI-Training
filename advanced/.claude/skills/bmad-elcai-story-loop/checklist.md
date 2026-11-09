# bmad-elcai-story-loop — preflight & definition of done

Use this checklist before approving the preflight batch (Step 2) and before opening the PR (Step 6).

## Preflight (before Step 2 approval)

- [ ] Target project is a git repo (`git rev-parse --git-dir` succeeds).
- [ ] Git remote `origin` is set (`git remote get-url origin` returns a URL).
- [ ] For GitHub remotes: `gh auth status` reports authenticated. For Bitbucket/GitLab/other: user has access to the web UI to open a PR manually (the loop pushes; the human opens the PR in the browser).
- [ ] Story file is present and readable at the chosen path.
- [ ] Story file's Status is `ready-for-dev` OR the user explicitly chose to (re-)run on an in-progress story.
- [ ] `bmad-dev-auto` skill is installed at `{project-root}/.claude/skills/bmad-dev-auto/`.
- [ ] `bmad-create-story` skill is installed at `{project-root}/.claude/skills/bmad-create-story/` (only strictly required if the user picks option 3 at Step 1; harmless if unused).
- [ ] Current branch is either `{target_branch}` (loop will create a feature branch) OR already a feature branch (loop will continue on it).
- [ ] User has confirmed the story is scoped to a single vertical slice (loop does not enforce this — it's your judgment).

## During the loop

- [ ] Every iteration is delegated to `bmad-dev-auto`. If you find yourself editing code directly from this skill, STOP — that's a design violation.
- [ ] If any action requires approval outside the preflight batch (new dependency, file outside story scope, force-push, etc.), HALT with `{{loop_status}} = blocked` and state the exact extra approval required.
- [ ] No merging of the PR under any circumstance — that stays a human decision.

## Definition of done (before Step 6 PR-open)

- [ ] `bmad-dev-auto`'s terminal status = `done` (from the story's `## Auto Run Result` section).
- [ ] Story file Status = `review`.
- [ ] All Tasks/Subtasks in the story are checked `[x]`.
- [ ] File List in the story reflects every changed file (paths relative to repo root).
- [ ] Dev Agent Record → Completion Notes are populated.
- [ ] Regression suite passed on the feature branch (dev-auto is expected to have run this in its internal review step).
- [ ] `git status` on the feature branch is clean (no uncommitted work).

## After PR is opened

- [ ] `{{loop_status}} = done`.
- [ ] `{{pr_url}}` printed to the user.
- [ ] For non-GitHub hosts, `{project-root}/.git/PR_BODY.md` is present so the user can paste it into the Bitbucket / GitLab / other web UI.
