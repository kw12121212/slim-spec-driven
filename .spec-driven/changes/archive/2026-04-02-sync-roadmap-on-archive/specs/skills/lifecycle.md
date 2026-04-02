# Delta: Skills Lifecycle

## MODIFIED Requirements

### Requirement: archive-explicitly-splits-script-and-ai-responsibilities
Previously: `spec-driven-archive` MUST explicitly tell the user which parts of the archive flow are
performed by CLI scripts and which are performed by the AI.

- CLI scripts are responsible for mechanical commands only, such as listing/selecting
  active changes, reporting task completion state, and moving the change directory into
  `archive/`.
- The AI is responsible for workflow judgment and content edits, including blocking on
  incomplete tasks, asking for empty-delta confirmation, merging delta specs into main
  specs, updating `.spec-driven/specs/INDEX.md`, reconciling roadmap milestone and
  roadmap index status after archive, and summarizing the archive result.

`spec-driven-archive` MUST explicitly tell the user which parts of the archive flow are
performed by CLI scripts and which are performed by the AI.

- CLI scripts are responsible for deterministic filesystem mechanics, including
  listing or selecting active changes, reporting task completion state, moving
  the change directory into `archive/`, and reconciling roadmap milestone and
  roadmap index status after archive when that status can be derived from the
  repository state.
- The AI is responsible for workflow judgment and content edits, including
  blocking on incomplete tasks, asking for empty-delta confirmation, merging
  delta specs into main specs, updating `.spec-driven/specs/INDEX.md`,
  surfacing any roadmap changes caused by archive, and summarizing the archive
  result.

## ADDED Requirements

### Requirement: auto-reuses-archive-closeout
When `spec-driven-auto` reaches its archive step, it MUST reuse the same
closeout obligations as `spec-driven-archive` rather than treating archive as a
generic final move step.

This closeout MUST include:
- merging accepted delta specs into `.spec-driven/specs/`
- requiring explicit confirmation when `changes/<name>/specs/` is empty
- invoking the archive command
- reporting the archive location and any roadmap milestone or roadmap index
  status changes caused by archive

#### Scenario: auto-archive-reports-roadmap-closeout
- GIVEN `spec-driven-auto` is archiving a roadmap-backed change
- AND the archive command reconciles a milestone to `complete`
- WHEN the auto workflow finishes
- THEN the final archive report mentions the archived change location
- AND it reports the milestone and roadmap index status change
