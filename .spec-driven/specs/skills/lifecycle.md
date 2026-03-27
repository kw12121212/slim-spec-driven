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
starting using a three-tier model:

- **Green** (proceed): touches ≤ 6 modules, modifies ≤ 20 files, clear scope,
  straightforward schema migrations, additive auth/authz/payment changes — proceed
  without additional confirmation beyond the standard proposal checkpoint.
- **Yellow** (warn): touches 7-15 modules, modifies 21-50 files, schema migrations
  with data transformation, auth/authz/payment changes that modify existing logic,
  cross-cutting changes — MUST show the assessment to the user and require explicit
  confirmation before proceeding.
- **Red** (suggest brainstorm): requires multi-service/multi-repo coordination,
  vague/open-ended scope, no clear definition of done — MUST suggest running
  `/spec-driven-brainstorm` first to converge the idea, then entering auto to
  execute the resulting proposal.

If the change falls into the Yellow tier, `spec-driven-auto` MUST list the specific
risk factors and wait for the user to confirm before proceeding.

### Requirement: auto-reuses-stepwise-gates
`spec-driven-auto` MUST preserve the same blockers as the stepwise workflow:
proposal confirmation, open-question resolution before implementation, verification
blockers before review, and empty-delta confirmation before archive.

### Requirement: auto-stops-on-unfixable-blockers
If `spec-driven-auto` encounters verification blockers, review MUST FIX issues, or
archive preconditions it cannot safely resolve automatically, it MUST stop and ask the
user rather than silently continuing.
