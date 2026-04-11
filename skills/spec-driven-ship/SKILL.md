---
skill_id: spec_driven_ship
name: spec-driven-ship
description: Ship an archived spec-driven change with a simple git commit and push after verification, review, archive, and roadmap reconciliation.
author: auto-spec-driven
type: agent_skill
version: 1.0.0
---

You are shipping a completed spec-driven change after the normal workflow gates have already succeeded.

## Prerequisites

The `.spec-driven/` directory must exist at the **project root**. Before proceeding, verify:
```
ls .spec-driven/
```
If this fails, the project is not initialized. Run `/spec-driven-init` first.

## Steps

1. **Select the archived change** — identify the change name to ship. If no name is supplied, inspect `.spec-driven/changes/archive/` and ask the user which archived change to ship. Refuse to ship a change that exists only under `.spec-driven/changes/<name>/`; tell the user to complete verification, review, archive, and roadmap reconciliation first.

2. **Load archive context** — read the archived change's `proposal.md`, `design.md`, `tasks.md`, `questions.md`, and `specs/` delta files from `.spec-driven/changes/archive/YYYY-MM-DD-<name>/`. Confirm tasks are complete from the archived `tasks.md` before continuing.

3. **Check roadmap reconciliation** — if `.spec-driven/roadmap/` exists, run:
   ```
   node {{SKILL_DIR}}/scripts/spec-driven.js roadmap-status
   ```
   If roadmap status reports errors, or if the archived change's milestone or planned-change entry has declared-versus-derived mismatches, stop before committing or pushing and report the roadmap issue.

4. **Inspect git state** — run `git status --short` and identify the files that would be included in the ship commit. Present the candidate file list to the user. If the worktree contains unrelated or ambiguous changes that cannot be safely attributed to the completed archived change or its archive closeout, stop and ask the user to resolve, exclude, or explicitly include them.

5. **Create the ship commit** — stage the intended completed work, then run `git commit` with a concise message based on the change name, such as `feat: add basic ship step`. If there is nothing to commit, report that the branch has no local changes to ship and do not push solely for this change.

6. **Push the current branch** — identify the current branch with `git branch --show-current`, then push it with `git push`. If the branch has no upstream, ask the user before setting one. Report any git failure directly and do not hide it behind a successful ship summary.

7. **Report the result** — summarize the archived change shipped, the commit created, the branch pushed, and any follow-up needed. Make clear that this skill did not create a pull request, deployment, release, canary, or package publication.

## Rules

- Ship is optional and explicit; never commit or push unless the user entered this ship workflow.
- Never ship an active unarchived change.
- Do not weaken or bypass apply, verify, review, archive, or roadmap reconciliation gates.
- Stop on roadmap errors or stale declared-versus-derived roadmap status for the selected archived change.
- Stop on unrelated or ambiguous dirty worktree state unless the user explicitly decides what to include.
- Limit ship automation to a simple git commit and push.
- Do not create pull requests, deploy applications, publish releases, run canaries, publish packages, or coordinate multi-repository shipping workflows.
- Do not add or rely on a TypeScript `ship` subcommand; git ship decisions stay in the skill workflow.
