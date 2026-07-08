---
title: 'Story Loop Definition of Done Checklist'
validation-target: 'End-to-end loop run from story-ready to PR opened against main'
validation-criticality: 'HIGH'
required-inputs:
  - 'Story path resolved (from file, Jira, prompt, or sprint-status)'
  - 'Preflight approval batch confirmed by user'
optional-inputs:
  - 'Prior iteration feedback context'
validation-rules:
  - 'Human gates are exactly two: story-ready (Step 2) and merge-ready (post-Step 5)'
  - 'Loop must halt if it needs an operation outside the approved batch'
  - 'Loop must halt after max_iterations without convergence and report residual findings'
---

# Story Loop Definition of Done

## Preflight

- [ ] Story path is set and readable
- [ ] Approval batch presented in category view with drill-down to exact commands available
- [ ] User confirmed the batch (or a modified subset) before any implementation action
- [ ] Loop did not prompt the user again after preflight (unless an out-of-batch operation was needed)

## Per-iteration

- [ ] Dev-story sub-workflow executed to completion
- [ ] QA sub-workflow executed and generated tests ran
- [ ] Test results captured (pass/fail with counts)
- [ ] Code review sub-workflow executed and findings categorized (blocker / major / minor / nit)
- [ ] On failure or any finding, feedback appended to accumulated context for next iteration

## Convergence

- [ ] Loop converged (test suite green AND review returned zero findings) OR
- [ ] Loop hit max_iterations and halted with a full report of residual findings

## Shipping (only on convergence)

- [ ] Branch pushed to origin
- [ ] PR opened against `main` with body containing story link, change summary, test summary, review outcome, iteration count
- [ ] PR URL surfaced to user
- [ ] Sprint status updated to `ready-for-review` if applicable

## Anti-patterns to avoid

- [ ] Never merged the PR autonomously — merge is the second human gate
- [ ] Never skipped tests on the grounds of "small change"
- [ ] Never suppressed nit-level findings unless `review_threshold` is `blockers-only`
- [ ] Never modified files outside the approved category set without halting to ask
