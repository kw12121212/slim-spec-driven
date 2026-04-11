# Design: add-basic-ship-step

## Approach

Create a new `skills/spec-driven-ship/SKILL.md` prompt that acts as the
post-archive ship entry point. The skill should read the selected archived
change, relevant specs, roadmap status, and git status before doing anything
destructive or remote-facing.

The ship flow should be deliberately small:
- confirm the target change exists under `.spec-driven/changes/archive/`
- confirm no active change with the same name remains
- run the roadmap status command when `.spec-driven/roadmap/` exists and block
  on roadmap errors or mismatches
- inspect git status and present the files that will be included
- create a simple commit for the completed work
- push the current branch

No TypeScript CLI command is needed for commit and push. Git operations are not
filesystem scaffolding mechanics, and the existing project split keeps scripts
thin while workflow judgment remains in skills.

## Key Decisions

- Add a separate `spec-driven-ship` skill instead of extending archive. Archive
  is still responsible for merging specs and moving the change to history; ship
  is an optional next step after that closeout succeeds.
- Require archived change evidence before shipping. A change that has not been
  archived has not completed the normal workflow gates.
- Require roadmap validation for roadmap-backed repositories. The milestone
  calls out roadmap reconciliation as a prerequisite, so ship should not push a
  stale roadmap state.
- Keep the ship stage to commit and push only. PR, deployment, release, canary,
  and package publication automation remain out of scope.
- Update installer lists so the new skill is distributed consistently with the
  existing bundled workflow skills.

## Alternatives Considered

- Add commit and push to `spec-driven-archive`. Rejected because archive already
  has content-merge and history-preservation responsibilities, and shipping
  should remain optional after successful archive.
- Add a TypeScript `ship` subcommand. Rejected because the scripts contract is
  deterministic filesystem mechanics only, while git ship decisions require
  repository-state judgment and user-facing safeguards.
- Add pull request or deployment automation. Rejected because the milestone
  explicitly limits this to a lightweight commit-and-push stage.
- Let `spec-driven-auto` push automatically at the end. Rejected for this
  change because ship should be an explicit handoff after the normal quality
  gates are complete.
