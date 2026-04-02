# Scripts Behavior

### Requirement: propose-creates-artifacts
`spec-driven.js propose <name>` MUST create `.spec-driven/changes/<name>/` containing
`proposal.md`, `specs/` directory, `design.md`, `tasks.md`, and `questions.md` with seed content.
The name MUST match `^[a-z0-9]+(-[a-z0-9]+)*$`. Exits 1 if invalid or already exists.

### Requirement: modify-lists-and-shows
`spec-driven.js modify` with no argument MUST list all active change directories,
excluding `archive/`. With a name argument, MUST print paths to all five artifacts
(`proposal.md`, `specs/`, `design.md`, `tasks.md`, `questions.md`).
Exits 1 if the named change does not exist.

### Requirement: apply-tracks-tasks
`spec-driven.js apply <name>` MUST parse `tasks.md` for `- [ ]` and `- [x]` checkboxes
and output JSON `{ total, complete, remaining, tasks[] }`.
Exits 1 if the change or tasks.md does not exist.

### Requirement: verify-checks-artifacts
`spec-driven.js verify <name>` MUST check that `proposal.md`, `design.md`, `tasks.md`,
and `questions.md` exist and are non-empty, and that `specs/` directory exists.
Output is always `{ valid, warnings[], errors[] }` and exits 0.
`valid` is false only when `errors` is non-empty.

#### Scenario: specs-directory-missing
- GIVEN `specs/` directory does not exist
- WHEN verify is run
- THEN errors contains a missing directory message and valid is false

#### Scenario: specs-directory-empty
- GIVEN `specs/` directory exists but contains no `.md` files
- WHEN verify is run
- THEN warnings contains an empty specs message

#### Scenario: spec-file-format-violation
- GIVEN a `.md` file in `specs/` has content but no `### Requirement:` headings
- WHEN verify is run
- THEN errors contains a format violation message and valid is false

#### Scenario: spec-file-missing-section-marker
- GIVEN a `.md` file in `specs/` has `### Requirement:` headings but no `## ADDED Requirements`, `## MODIFIED Requirements`, or `## REMOVED Requirements` section marker
- WHEN verify is run
- THEN errors contains a missing section marker message and valid is false

#### Scenario: open-questions-block-verify
- GIVEN `questions.md` contains one or more open `- [ ] Q:` entries
- WHEN verify is run
- THEN errors contains an open questions message and valid is false

### Requirement: archive-moves-change
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

### Requirement: cancel-removes-change
`spec-driven.js cancel <name>` MUST delete the change directory without archiving.
Exits 1 if the change does not exist.

### Requirement: init-bootstraps-project
`spec-driven.js init [path]` MUST create or repair `.spec-driven/` at the given path (or CWD).
If `.spec-driven/` does not exist, it creates all scaffold files from scratch,
including `.spec-driven/roadmap/INDEX.md` and `.spec-driven/roadmap/milestones/`.
If `.spec-driven/` already exists, it creates any missing files/directories without overwriting existing ones.
In both cases, it MUST regenerate `.spec-driven/specs/INDEX.md` in the standard
machine-validated format:
- The first line MUST be `# Specs Index`
- Each category MUST appear as `## <category>`
- Each listed spec file MUST appear as a bullet in the form
  `- [<file>](<category>/<file>) - <summary>`
- The file MUST list all `.md` files currently present under `specs/`, excluding
  `INDEX.md` itself and `README.md`

If `.spec-driven/roadmap/` exists or is created during initialization, `init`
MUST also create or repair `.spec-driven/roadmap/INDEX.md` in the standard
roadmap index format.

#### Scenario: init-on-existing-directory
- GIVEN `.spec-driven/` already exists with some files present
- WHEN `init` is run
- THEN missing scaffold files are created, existing files are not overwritten, `specs/INDEX.md` is regenerated, and the command exits 0

#### Scenario: init-updates-index
- GIVEN `.spec-driven/specs/` contains one or more `.md` files besides `INDEX.md` and `README.md`
- WHEN `init` is run
- THEN `specs/INDEX.md` is updated to list each of those files

#### Scenario: init-regenerates-standard-specs-index
- GIVEN `.spec-driven/specs/` contains one or more spec files
- WHEN `init` is run
- THEN `.spec-driven/specs/INDEX.md` is rewritten in the canonical index format
- AND every current spec file appears exactly once in the correct category

### Requirement: migrate-openspec-project
`spec-driven.js migrate [path]` MUST migrate an OpenSpec-style project in the given path (or CWD)
to auto-spec-driven conventions.
It MUST rename `openspec/` to `.spec-driven/` when `.spec-driven/` does not already exist,
ensure `.spec-driven/config.yaml`, `.spec-driven/specs/INDEX.md`, `.spec-driven/specs/README.md`,
and `.spec-driven/changes/` exist, remove OpenSpec skills and command files for supported tools,
and install bundled `spec-driven-*` skills for supported tools.

#### Scenario: unsupported-tool-is-skipped
- GIVEN a project contains OpenSpec artifacts for an unsupported AI tool
- WHEN migrate is run
- THEN migrate reports that tool as skipped and continues

#### Scenario: spec-driven-directory-already-exists
- GIVEN `.spec-driven/` already exists alongside `openspec/`
- WHEN migrate is run
- THEN migrate does not rename `openspec/` over the existing directory and reports the rename as skipped

### Requirement: run-maintenance-executes-manual-maintenance-flow
`spec-driven.js run-maintenance [path]` MUST execute the configured manual
maintenance flow for the target repository. It MUST report whether the run was
clean, skipped, unfixable, blocked, or repaired.

### Requirement: run-maintenance-requires-explicit-config
If `.spec-driven/maintenance/config.json` is missing or invalid,
`run-maintenance` MUST exit with an error instead of guessing maintenance checks
or repair commands.

### Requirement: run-maintenance-reads-configured-prefixes-and-checks
`run-maintenance` MUST read `changePrefix`, `branchPrefix`,
`commitMessagePrefix`, and `checks` from `.spec-driven/maintenance/config.json`.
It MAY fall back to default prefixes when those optional fields are omitted, but
it MUST only run checks and fixes that are explicitly configured.

### Requirement: verify-roadmap-validates-milestone-shape-and-size
`spec-driven.js verify-roadmap [path]` MUST validate roadmap assets in the
target repository (or CWD). It MUST inspect `.spec-driven/roadmap/INDEX.md` and
`.spec-driven/roadmap/milestones/`, and output JSON
`{ valid, warnings[], errors[], milestones[] }`.

### Requirement: verify-roadmap-enforces-standard-milestone-sections
For each roadmap milestone file, `verify-roadmap` MUST require the standard
sections needed for scriptable roadmap validation:
- `## Goal`
- `## Done Criteria`
- `## Planned Changes`
- `## Dependencies / Risks`
- `## Status`

If a required section is missing, the command MUST report an error for that
milestone.

`verify-roadmap` MUST also require the `## Status` section to contain exactly
one bullet in the form `- Declared: <status>`, where `<status>` is one of:
- `proposed`
- `active`
- `blocked`
- `complete`

If the status bullet is missing, repeated, malformed, or uses an unsupported
status value, the command MUST report the milestone as invalid.

### Requirement: verify-roadmap-rejects-oversized-milestones
If a roadmap milestone contains more than 5 bullet items under
`## Planned Changes`, `verify-roadmap` MUST report that milestone as invalid and
tell the user to split it into smaller milestones.

### Requirement: verify-roadmap-validates-roadmap-index-format
`verify-roadmap` MUST validate `.spec-driven/roadmap/INDEX.md` against the
canonical roadmap index format:
- The first line is `# Roadmap Index`
- The file contains exactly one `## Milestones` section
- Each milestone bullet matches
  `- [<file>](milestones/<file>) - <title> - <declared-status>`
- Each `<declared-status>` value uses the supported declared-status enum

If the roadmap index format is invalid, `verify-roadmap` MUST report an error.

### Requirement: roadmap-status-reports-milestone-and-change-state
`spec-driven.js roadmap-status [path]` MUST inspect roadmap milestone files in
the target repository (or CWD), compare each listed planned change against
`.spec-driven/changes/` and `.spec-driven/changes/archive/`, and output JSON.

### Requirement: roadmap-status-includes-derived-status-and-mismatches
For each roadmap milestone, `roadmap-status` MUST report the declared roadmap
status, a derived status based on planned change archive state, the listed
planned changes with their resolved state (`archived`, `active`, or `missing`),
and mismatch messages when the declared roadmap status disagrees with the
derived status.

The derived roadmap status MUST use the following rules:
- `complete` when the milestone has one or more planned changes and all are
  archived
- `active` when one or more planned changes are active and the milestone is not
  complete
- `proposed` when the milestone has no planned changes, or when its planned
  changes are not archived and none are active

`roadmap-status` MUST NOT derive `blocked` automatically from change history;
`blocked` remains a declared-only status value used for mismatch reporting and
human workflow communication.

#### Scenario: active-and-missing-planned-changes
- GIVEN a milestone lists one archived planned change, one active planned
  change, and one missing planned change
- WHEN `roadmap-status` is run
- THEN the JSON reports those three planned change states
- AND the milestone derived status is not complete

#### Scenario: no-planned-changes-keeps-milestone-proposed
- GIVEN a milestone has no items under `## Planned Changes`
- WHEN `roadmap-status` is run
- THEN the milestone derived status is `proposed`

#### Scenario: declared-status-mismatch
- GIVEN the roadmap file declares a milestone status that does not match the
  status derived from change history
- WHEN `roadmap-status` is run
- THEN the milestone result includes a mismatch message describing the status disagreement

#### Scenario: blocked-is-declared-only
- GIVEN a milestone declares `blocked`
- AND its planned changes are all still missing
- WHEN `roadmap-status` is run
- THEN the milestone declared status is `blocked`
- AND the derived status is `proposed`
- AND the result reports a mismatch if the two statuses differ
