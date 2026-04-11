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

### Requirement: planning-skills-do-not-implement-code
`spec-driven-init`, `spec-driven-propose`, `spec-driven-modify`,
`spec-driven-spec-edit`, `spec-driven-sync-specs`, `roadmap-plan`,
`roadmap-milestone`, and `roadmap-sync` MUST stay in the
planning/documentation layer. They
MAY create or edit workflow artifacts under `.spec-driven/`, but they MUST NOT
implement product code changes.

### Requirement: execution-and-lifecycle-skills-follow-artifacts-as-source-of-truth
`spec-driven-apply`, `spec-driven-verify`, `spec-driven-review`, `spec-driven-archive`,
and `spec-driven-auto` MUST treat the current change artifacts, relevant main specs,
and repository state as the source of truth rather than stale chat context.

### Requirement: source-skill-directories-expose-shared-cli-via-symlink
Each source skill directory under `skills/<name>/` that contains `SKILL.md`
MUST also contain a `scripts` symlink in the source tree. That symlink MUST
resolve to the shared compiled CLI scripts directory so source-tree skill runs
can invoke `{{SKILL_DIR}}/scripts/spec-driven.js` without relying on an
installed copy of the skill.

#### Scenario: source-skill-directory-includes-scripts-symlink
- GIVEN a source skill directory under `skills/<name>/` contains `SKILL.md`
- WHEN repository validation checks the source tree
- THEN that skill directory also contains a `scripts` symlink
- AND the symlink target resolves to the shared compiled CLI scripts directory

### Requirement: skills-use-explicit-script-command-references
When a skill instructs the agent to run a repository CLI command, the skill MUST
name the concrete command invocation rather than referring only to a generic
validator, audit command, script, or CLI step.

If the command is expected to run through the shared spec-driven CLI, the skill
MUST reference the concrete script path and subcommand, such as
`node {{SKILL_DIR}}/scripts/spec-driven.js verify-spec-mappings`, instead of a
generic phrase like "rerun the CLI mapping validator".

#### Scenario: skill-names-concrete-mapping-validator-command
- GIVEN a skill instructs the agent to validate spec mappings
- WHEN it describes that step in the skill prompt
- THEN it names the concrete command invocation
- AND it does not rely only on a generic phrase such as "run the validator"

#### Scenario: skill-names-concrete-audit-command
- GIVEN a skill instructs the agent to compare evidence against mappings
- WHEN it describes that step in the skill prompt
- THEN it names the concrete audit command invocation
- AND it does not rely only on a generic phrase such as "use the audit output"

### Requirement: explicitly-opted-in-skills-retain-parent-workflow-ownership-when-delegating
Spec-driven skills MUST NOT delegate work to a sub-agent unless that skill's
own main spec requirements and concrete skill instructions explicitly allow the
delegation pattern.

When delegation is explicitly allowed, the delegated subtask MUST be concrete,
materially useful, and MUST NOT require the sub-agent to own the workflow state
for the overall skill run.

When delegation is used, the parent agent MUST retain ownership of:
- user-facing confirmation or question-resolution checkpoints
- writes that create, resolve, archive, cancel, or otherwise advance
  `.spec-driven/` workflow state
- the final user-facing recommendation, review, or verification verdict
- the decision to accept, reject, or integrate delegated output

Delegated output MAY inform the skill, but it MUST NOT replace the parent
agent's responsibility to interpret current change artifacts, main specs, and
repository state before taking those workflow actions.

#### Scenario: delegated-analysis-does-not-bypass-parent-workflow-gates
- GIVEN a skill delegates bounded analysis work to a sub-agent
- WHEN the overall workflow reaches a user confirmation or workflow-state
  transition
- THEN the parent agent remains responsible for that interaction or state write
- AND the sub-agent does not complete the transition on its own

### Requirement: questions-control-workflow-transitions
Ambiguities MUST be tracked in `questions.md`, not inline in other artifacts.
Open questions MAY remain at proposal handoff time, but each execution skill
MUST follow its own contract for handling them before the workflow advances.
Any open questions that remain unresolved by the time verification or archive
is attempted are blockers.

### Requirement: specialized-review-checklists-stay-within-one-review-skill
Change-type-specific review checklist routing MUST remain inside
`spec-driven-review` rather than creating separate review skills for security,
UI, DX, migration, API, or maintenance changes.

The specialized checklist routing MUST preserve the existing workflow contract:
review happens after implementation and verification readiness, uses current
change artifacts and repository state as source of truth, reports MUST FIX,
SHOULD FIX, and NITS, and treats MUST FIX findings as archive blockers.

#### Scenario: specialized-review-does-not-split-entry-point
- GIVEN a completed change needs security-sensitive or migration review
- WHEN the user enters the review workflow
- THEN the user still uses `spec-driven-review`
- AND the skill routes internally to the relevant checklist guidance

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

### Requirement: task-state-and-spec-state-stay-synchronized
When work is implemented, completed tasks MUST be marked immediately and delta specs
MUST be updated to reflect what was actually built before verification, review, or archive.

### Requirement: archive-preserves-history-after-merge
Archiving MUST merge accepted delta specs into `.spec-driven/specs/` first, then move
the change directory into `changes/archive/` so the full proposal, task history, and
resolved questions remain preserved.

#### Scenario: empty-delta-on-archive
- GIVEN `changes/<name>/specs/` directory is empty
- WHEN archive is run
- THEN the user is asked to confirm no spec impact before proceeding

### Requirement: simple-task-operates-outside-change-lifecycle
`spec-driven-simple-task` operates as an ad-hoc task execution skill outside
the normal change lifecycle. It MAY implement product code changes directly
but MUST NOT create, modify, or archive any entries under
`.spec-driven/changes/`. When its work reveals spec drift or a real change
need, it MUST suggest the appropriate existing skill rather than entering
the change workflow itself.

### Requirement: sync-specs-edits-specs-directly
`spec-driven-sync-specs` MUST directly edit `.spec-driven/specs/` files to
synchronize them with existing repository behavior. It MUST NOT create a
spec-driven change or use the change lifecycle. It MUST report detected drift
in chat, get user confirmation, then edit spec files and refresh
`.spec-driven/specs/INDEX.md`.

#### Scenario: sync-specs-detects-and-fixes-drift
- GIVEN a spec file under `.spec-driven/specs/` is outdated relative to current
  code behavior
- WHEN `spec-driven-sync-specs` is run
- THEN it reports the drift in chat
- AND after user confirmation, directly edits the spec file
- AND runs `init` to refresh INDEX.md

### Requirement: spec-files-declare-code-mappings-in-frontmatter
Every main spec file under `.spec-driven/specs/`, excluding `INDEX.md` and
`README.md`, MUST begin with YAML frontmatter that declares related
implementation files and test files separately.

The mapping frontmatter MUST use:

```yaml
mapping:
  implementation:
    - <repo-relative implementation path>
  tests:
    - <repo-relative test path>
```

The mapping is many-to-many at file granularity: a spec file MAY list multiple
implementation and test files, and the same repository file MAY appear in
multiple spec files.

#### Scenario: spec-file-has-separated-code-and-test-mappings
- GIVEN a main spec file describes behavior implemented by a script and tested
  by the test runner
- WHEN the spec file is read
- THEN its frontmatter lists the script under `mapping.implementation`
- AND it lists the test runner under `mapping.tests`

### Requirement: spec-mapping-state-stays-synchronized
When a workflow creates, modifies, merges, or directly synchronizes main spec
files, it MUST preserve and update mapping frontmatter so the listed
implementation and test files continue to reflect the current repository
evidence for that spec file.

Requirement bodies MUST continue to describe observable behavior rather than
embedding implementation file paths in prose.

#### Scenario: spec-edit-preserves-mapping-frontmatter
- GIVEN a workflow modifies an existing main spec file
- WHEN it writes the updated spec file
- THEN the mapping frontmatter remains present
- AND implementation details are not moved into requirement prose
