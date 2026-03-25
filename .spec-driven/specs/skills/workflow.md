# Skills Workflow

### Requirement: planning-skills-do-not-implement-code
`spec-driven-init`, `spec-driven-propose`, and `spec-driven-modify` MUST stay in the
planning/documentation layer. They MAY create or edit workflow artifacts under
`.spec-driven/`, but they MUST NOT implement product code changes.

### Requirement: execution-and-lifecycle-skills-follow-artifacts-as-source-of-truth
`spec-driven-apply`, `spec-driven-verify`, `spec-driven-review`, `spec-driven-archive`,
and `spec-driven-auto` MUST treat the current change artifacts, relevant main specs,
and repository state as the source of truth rather than stale chat context.

### Requirement: questions-control-workflow-transitions
Ambiguities MUST be tracked in `questions.md`, not inline in other artifacts.
Open questions block implementation and verification, and must be surfaced before any
workflow step that depends on resolved requirements.

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
