## MODIFIED Requirements

### Requirement: archive-updates-spec-index
Previously: After merging specs, `spec-driven-archive` MUST update `.spec-driven/specs/INDEX.md`
for any created or deleted main spec files before archiving the change directory.

After merging specs, `spec-driven-archive` MUST update `.spec-driven/specs/INDEX.md`
for any created or deleted main spec files before archiving the change directory.

If the repository contains `.spec-driven/roadmap/`, the archive workflow MUST
also reconcile roadmap state after the change has been moved into
`.spec-driven/changes/archive/` so roadmap files reflect the new archive
evidence.

This reconciliation MUST:
- update any affected milestone declared status when the archived change changes
  the correct declared status
- update `.spec-driven/roadmap/INDEX.md` so milestone entries reflect the
  reconciled declared status
- leave unrelated milestones unchanged

#### Scenario: archive-completes-milestone-and-updates-roadmap
- GIVEN a roadmap milestone lists a planned change that is about to be archived
- AND archiving that change causes all planned changes in the milestone to be
  archived
- WHEN `spec-driven-archive` completes
- THEN the milestone declared status is reconciled to `complete`
- AND `.spec-driven/roadmap/INDEX.md` reflects the milestone's reconciled
  status

### Requirement: archive-explicitly-splits-script-and-ai-responsibilities
Previously: `spec-driven-archive` MUST explicitly tell the user which parts of the archive flow are
performed by CLI scripts and which are performed by the AI.

- CLI scripts are responsible for mechanical commands only, such as listing/selecting
  active changes, reporting task completion state, and moving the change directory into
  `archive/`.
- The AI is responsible for workflow judgment and content edits, including blocking on
  incomplete tasks, asking for empty-delta confirmation, merging delta specs into main
  specs, updating `.spec-driven/specs/INDEX.md`, and summarizing the archive result.

`spec-driven-archive` MUST explicitly tell the user which parts of the archive flow are
performed by CLI scripts and which are performed by the AI.

- CLI scripts are responsible for mechanical commands only, such as listing/selecting
  active changes, reporting task completion state, and moving the change directory into
  `archive/`.
- The AI is responsible for workflow judgment and content edits, including blocking on
  incomplete tasks, asking for empty-delta confirmation, merging delta specs into main
  specs, updating `.spec-driven/specs/INDEX.md`, reconciling roadmap milestone and
  roadmap index status after archive, and summarizing the archive result.
