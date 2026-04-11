---
mapping:
  implementation:
    - skills/spec-driven-archive/SKILL.md
    - skills/spec-driven-cancel/SKILL.md
    - skills/spec-driven-ship/SKILL.md
    - skills/spec-driven-auto/SKILL.md
    - scripts/spec-driven.ts
  tests:
    - test/run.js
    - test/validate-skills.ts
---

# Skills Lifecycle

## ADDED Requirements

### Requirement: ship-verifies-roadmap-reconciliation-before-push
If `.spec-driven/roadmap/` exists, `spec-driven-ship` MUST run
`node {{SKILL_DIR}}/scripts/spec-driven.js roadmap-status` before creating a
commit or pushing the current branch.

The ship workflow MUST block when roadmap status reports errors or stale
declared-versus-derived mismatches for the selected archived change's milestone.
It MUST present the roadmap issue to the user instead of hiding it behind a
commit or push failure.

#### Scenario: ship-blocks-on-stale-roadmap-status
- GIVEN a roadmap-backed change has been archived
- AND roadmap status reports that the related planned change or milestone has a
  stale declared status
- WHEN `spec-driven-ship` runs
- THEN it refuses to create a commit or push
- AND it reports that roadmap reconciliation must be fixed first

### Requirement: ship-presents-git-state-before-commit
Before committing, `spec-driven-ship` MUST inspect the repository's git status
and present the files that will be included in the ship commit.

If the worktree contains unrelated or ambiguous changes that cannot be safely
attributed to the completed archived change, the ship workflow MUST stop and
ask the user how to proceed instead of silently committing them.

#### Scenario: ship-stops-on-ambiguous-dirty-worktree
- GIVEN a completed archived change is ready to ship
- AND git status includes files that do not appear related to the completed
  change or its archive closeout
- WHEN `spec-driven-ship` prepares the commit
- THEN it stops before committing
- AND it asks the user to resolve, exclude, or explicitly include those changes

### Requirement: auto-does-not-implicitly-ship
`spec-driven-auto` MUST NOT commit or push automatically as part of its existing
end-to-end apply, verify, review, archive, and roadmap closeout path.

After successful archive closeout, `spec-driven-auto` MAY offer
`spec-driven-ship` as the next explicit handoff, but it MUST wait for the user's
explicit choice before entering the ship workflow.

#### Scenario: auto-offers-ship-handoff-without-pushing
- GIVEN `spec-driven-auto` successfully archives a change and reconciles roadmap
  state
- WHEN it reports final closeout
- THEN it may suggest `spec-driven-ship` as the next step
- AND it does not create a commit or push unless the user explicitly chooses
  that ship workflow
