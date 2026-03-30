# Skills Lifecycle

### Requirement: archive-requires-complete-tasks
`spec-driven-archive` MUST refuse to archive a change while any tasks remain incomplete.
The user must complete the change or cancel it instead.

### Requirement: archive-merges-delta-specs-before-moving-change
`spec-driven-archive` MUST merge every delta spec file in `changes/<name>/specs/` into
the corresponding main spec file before moving the change directory into `archive/`.
Applying `REMOVED` deltas MAY delete requirement blocks or remove now-empty spec files.

### Requirement: archive-confirms-empty-spec-impact
If `changes/<name>/specs/` is empty, `spec-driven-archive` MUST ask the user to confirm
that the change truly has no observable spec impact before continuing.

### Requirement: archive-updates-spec-index
After merging specs, `spec-driven-archive` MUST update `.spec-driven/specs/INDEX.md`
for any created or deleted main spec files before archiving the change directory.

### Requirement: cancel-requires-explicit-confirmation
`spec-driven-cancel` MUST warn that cancellation permanently deletes the active change
directory and MUST require explicit confirmation before running the delete command.

### Requirement: cancel-only-removes-active-changes
`spec-driven-cancel` MUST only target active changes, not archived ones, and SHOULD
suggest archiving instead when the user wants to preserve completed work.

### Requirement: auto-applies-complexity-gate
`spec-driven-auto` MUST assess scope, touched modules/files, and risk areas before
starting using a two-tier model:

- **Green** (proceed): clear scope and a concrete definition of done within a single
  repository, including changes that touch up to 15 modules, modify up to 50 files,
  involve schema migrations with data transformation, modify existing auth/authz/payment
  logic, or make cross-cutting changes across multiple subsystems — proceed without
  additional confirmation beyond the standard proposal checkpoint.
- **Red** (suggest brainstorm): requires multi-service/multi-repo coordination,
  vague/open-ended scope, no clear definition of done — MUST suggest running
  `/spec-driven-brainstorm` first to converge the idea, then entering auto to
  execute the resulting proposal.

### Requirement: auto-reuses-stepwise-gates
`spec-driven-auto` MUST preserve the same blockers as the stepwise workflow:
proposal confirmation, open-question resolution before implementation, verification
blockers before review, and empty-delta confirmation before archive.

### Requirement: auto-stops-on-unfixable-blockers
If `spec-driven-auto` encounters verification blockers, review MUST FIX issues, or
archive preconditions it cannot safely resolve automatically, it MUST stop and ask the
user rather than silently continuing.
