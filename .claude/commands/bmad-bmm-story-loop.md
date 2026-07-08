---
name: 'story-loop'
description: 'Autonomous dev to QA to code-review loop from story-ready to PR-ready. Single preflight approval batch then up to 3 iterations then opens PR against main. Use when the user says "run the story loop" or "dev + QA + review this story" or "start a loop for a feature".'
---

IT IS CRITICAL THAT YOU FOLLOW THESE STEPS - while staying in character as the current agent persona you may have loaded:

<steps CRITICAL="TRUE">
0. **Preflight — verify BMAD is installed.** The story-loop workflow orchestrates several sub-workflows and depends on the BMAD engine files. Check that ALL of the following exist before proceeding:
   - `{project-root}/_bmad/core/tasks/workflow.xml`
   - `{project-root}/_bmad/bmm/config.yaml`
   - `{project-root}/_bmad/bmm/workflows/4-implementation/dev-story/instructions.xml`
   - `{project-root}/_bmad/bmm/workflows/4-implementation/code-review/instructions.xml`
   - `{project-root}/_bmad/bmm/workflows/4-implementation/create-story/instructions.xml`
   - `{project-root}/_bmad/bmm/workflows/qa-generate-e2e-tests/instructions.md`

   If ANY of these files is missing, STOP and output this message verbatim, then HALT:

   > **Story Loop preflight failed — BMAD is not fully installed in this repo.**
   >
   > This workshop repo only ships the story-loop workflow itself. The engine (`_bmad/core/`) and its sub-workflows (`dev-story`, `qa-generate-e2e-tests`, `code-review`, `create-story`) come from `bmad-method` and are gitignored.
   >
   > Run this in the repo root, then try `/story-loop` again:
   >
   > ```
   > npx bmad-method@beta install
   > ```
   >
   > Missing files detected:
   > - `<list the specific missing paths here>`

1. Always LOAD the FULL {project-root}/_bmad/core/tasks/workflow.xml
2. READ its entire contents - this is the CORE OS for EXECUTING the specific workflow-config {project-root}/_bmad/bmm/workflows/4-implementation/story-loop/workflow.yaml
3. Pass the yaml path {project-root}/_bmad/bmm/workflows/4-implementation/story-loop/workflow.yaml as 'workflow-config' parameter to the workflow.xml instructions
4. Follow workflow.xml instructions EXACTLY as written to process and follow the specific workflow config and its instructions
5. Save outputs after EACH section when generating any documents from templates
</steps>
