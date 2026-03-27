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

### Requirement: cancel-removes-change
`spec-driven.js cancel <name>` MUST delete the change directory without archiving.
Exits 1 if the change does not exist.

### Requirement: init-bootstraps-project
`spec-driven.js init [path]` MUST create or repair `.spec-driven/` at the given path (or CWD).
If `.spec-driven/` does not exist, it creates all scaffold files from scratch.
If `.spec-driven/` already exists, it creates any missing files/directories without overwriting existing ones.
In both cases, it regenerates `specs/INDEX.md` to list all `.md` files currently present under
`specs/` (excluding `INDEX.md` itself and `README.md`), and exits 0.

#### Scenario: init-on-existing-directory
- GIVEN `.spec-driven/` already exists with some files present
- WHEN `init` is run
- THEN missing scaffold files are created, existing files are not overwritten, `specs/INDEX.md` is regenerated, and the command exits 0

#### Scenario: init-updates-index
- GIVEN `.spec-driven/specs/` contains one or more `.md` files besides `INDEX.md` and `README.md`
- WHEN `init` is run
- THEN `specs/INDEX.md` is updated to list each of those files

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
