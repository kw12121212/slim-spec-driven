---
mapping:
  implementation:
    - skills/spec-driven-init/SKILL.md
    - skills/spec-driven-propose/SKILL.md
    - skills/spec-driven-brainstorm/SKILL.md
    - skills/spec-driven-modify/SKILL.md
    - skills/spec-driven-spec-edit/SKILL.md
    - skills/spec-driven-sync-specs/SKILL.md
    - skills/spec-driven-resync-code-mapping/SKILL.md
    - skills/spec-driven-apply/SKILL.md
    - skills/spec-driven-verify/SKILL.md
    - skills/spec-driven-review/SKILL.md
    - skills/spec-driven-archive/SKILL.md
    - skills/spec-driven-ship/SKILL.md
    - skills/spec-driven-auto/SKILL.md
    - skills/spec-driven-simple-task/SKILL.md
    - scripts/spec-driven.ts
  tests:
    - test/run.js
    - test/validate-skills.ts
---

# Skills Workflow

## ADDED Requirements

### Requirement: ship-is-explicit-post-archive-workflow-step
`spec-driven-ship` MUST be an optional explicit workflow entry point that runs
after a change has completed implementation, verification, review, archive, and
roadmap reconciliation.

The ship step MUST NOT replace or weaken the existing apply, verify, review, or
archive gates. It MUST NOT run for an active unarchived change.

#### Scenario: ship-requires-archived-change
- GIVEN a change exists only under `.spec-driven/changes/<name>/`
- WHEN `spec-driven-ship` is asked to ship that change
- THEN it refuses to create a commit or push
- AND it tells the user to complete verification, review, archive, and roadmap
  reconciliation first

#### Scenario: ship-remains-optional
- GIVEN a change has been archived successfully
- WHEN the user stops after archive
- THEN no commit or push is performed unless the user explicitly enters the ship
  workflow

### Requirement: ship-limits-automation-to-commit-and-push
`spec-driven-ship` MUST limit ship automation to creating a simple git commit
for the completed work and pushing the current branch.

It MUST NOT create pull requests, deploy applications, publish releases, run
canaries, publish packages, or coordinate multi-repository shipping workflows.

#### Scenario: ship-does-not-create-release-automation
- GIVEN a completed archived change is ready to ship
- WHEN `spec-driven-ship` runs
- THEN it may commit and push the current branch
- AND it does not create a pull request, deployment, release, canary, or package
  publication
