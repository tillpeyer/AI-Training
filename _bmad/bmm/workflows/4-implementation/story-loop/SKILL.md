---
name: bmad-bmm-story-loop
description: 'Autonomous dev to QA to code-review loop, story-ready to PR-ready. Preflight approval batch, then up to 3 iterations, then opens PR against main. Use when the user says "run the story loop" or "dev + QA + review this story".'
---

# Story Loop

**Goal:** Take a dev-ready story from story-ready to PR-ready with a single preflight approval, then run autonomously through dev → QA → code review, iterating up to 3 times on failures/findings, and open a PR against `main` when the code is clean.

**Role:** You are the orchestrator of the BMAD implementation triad (dev-story, qa-generate-e2e-tests, code-review). Your job is to route work between them and enforce the two human gates: story-ready (at start) and merge-ready (at PR review).

## Human gates

Only two:

1. **Story-ready** — user picks input source and approves the preflight batch of actions the loop will take.
2. **Merge-ready** — user reviews the opened PR and decides to merge or request changes.

Everything in between is autonomous.

## On Activation

### Step 1: Load Workflow Config

Read `{project-root}/_bmad/bmm/workflows/4-implementation/story-loop/workflow.yaml` and resolve all variables, including `dev_story_workflow`, `qa_e2e_workflow`, `code_review_workflow`, `max_iterations`, `target_branch`, `review_threshold`.

### Step 2: Load Config

Load `{project-root}/_bmad/bmm/config.yaml` and resolve `user_name`, `communication_language`, `user_skill_level`.

### Step 3: Greet the User

Greet `{user_name}` in `{communication_language}` and state the goal in one sentence.

### Step 4: Execute Workflow Instructions

Load and execute `{project-root}/_bmad/bmm/workflows/4-implementation/story-loop/instructions.xml` end-to-end.

## Key behaviors

- **Preflight is a single decision point.** Present actions as categories, offer drill-down to exact commands, and get one approval covering the whole loop.
- **Iterate on any review finding**, including nits, up to `max_iterations`. On exhaustion, halt and report — do NOT ship.
- **Halt if an out-of-batch operation is needed.** State exactly what extra approval is required so the user can extend the batch and resume.
- **Target branch is `main`** — feature branches PR into `main` per the workshop repo convention.
- **Do not merge the PR.** Opening is the loop's terminal action; merging is the human's call.

## Non-goals

- This skill does NOT create stories from scratch beyond what `bmad-bmm-create-story` provides when option 2 or 3 is chosen at Step 1.
- This skill does NOT run the full sprint. It handles exactly one story per invocation.
- This skill does NOT push to `main` directly or auto-merge under any circumstance — it always goes via a feature branch + PR.
