# Delta: Scripts Behavior

## MODIFIED Requirements

### Requirement: archive-moves-change
Previously: `spec-driven.js archive <name>` MUST move `.spec-driven/changes/<name>/` to
`.spec-driven/changes/archive/YYYY-MM-DD-<name>/`, creating the archive directory
if needed. Exits 1 if the source does not exist or the target already exists.

`spec-driven.js archive <name>` MUST move `.spec-driven/changes/<name>/` to
`.spec-driven/changes/archive/YYYY-MM-DD-<name>/`, creating the archive directory
if needed. Exits 1 if the source does not exist or the target already exists.

If `.spec-driven/roadmap/` exists, after the move succeeds the command MUST
reconcile any milestone file that lists the archived change so its declared
status matches the status derived from the current planned change archive state.
It MUST also regenerate `.spec-driven/roadmap/INDEX.md` so milestone entries
reflect the reconciled declared status.

#### Scenario: archive-reconciles-roadmap-when-present
- GIVEN a roadmap milestone lists a change that is about to be archived
- AND archiving that change changes the milestone's derived status
- WHEN `spec-driven.js archive <name>` succeeds
- THEN the milestone file is rewritten with the reconciled `- Declared: <status>` value
- AND `.spec-driven/roadmap/INDEX.md` reflects the reconciled status
