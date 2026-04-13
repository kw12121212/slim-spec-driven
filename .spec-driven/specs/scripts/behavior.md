---
mapping:
  implementation:
    - scripts/spec-driven.ts
  tests:
    - test/run.js
---

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

For `tasks.md`, the command MUST validate testing readiness, not only heading
presence. At minimum, it MUST report an error when:
- `## Testing` is missing
- the `## Testing` section has no checkbox tasks
- the `## Testing` section does not contain a lint or validation task
- the `## Testing` section does not contain a unit test task
- a required testing task is phrased without an explicit runnable command

The validator MAY use heuristic matching for command-like task wording, but it
MUST reject obviously vague entries such as `run tests`, `testing passes`,
`verify tests`, or `lint passes` when they do not name a concrete command.

#### Scenario: testing-section-missing-is-invalid
- GIVEN `tasks.md` has no `## Testing` section
- WHEN `verify` is run
- THEN errors contains a missing testing section message
- AND valid is false

#### Scenario: required-testing-task-missing-is-invalid
- GIVEN `tasks.md` has a `## Testing` section with only one of lint or
  validation coverage and unit test coverage
- WHEN `verify` is run
- THEN errors contains a missing required testing task message
- AND valid is false

#### Scenario: vague-testing-wording-is-invalid
- GIVEN `tasks.md` has a `## Testing` section whose lint or unit test entry does
  not include an explicit runnable command
- WHEN `verify` is run
- THEN errors contains a non-runnable testing task message
- AND valid is false

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

### Requirement: verify-spec-mappings-validates-spec-frontmatter
`spec-driven.js verify-spec-mappings [path]` MUST inspect every main spec file
under the target `.spec-driven/specs/` directory, excluding `INDEX.md` and
`README.md`, and validate that each file begins with YAML frontmatter containing
`mapping.implementation` and `mapping.tests` arrays.

Each entry in those arrays MUST be a repo-relative file path string. The command
MUST validate that each mapped path exists in the target repository. It MUST
output JSON `{ valid, warnings[], errors[] }`, where `valid` is false when
`errors` is non-empty.

The command MUST report enough detail for an AI agent to identify the affected
spec file, mapping field, and invalid condition. The command MUST NOT attempt to
judge whether a mapped file semantically implements or tests the spec.

#### Scenario: valid-spec-mappings
- GIVEN every main spec file has mapping frontmatter with existing
  implementation and test file paths
- WHEN `verify-spec-mappings` is run
- THEN the command reports `valid: true`
- AND `errors` is empty

#### Scenario: missing-spec-mapping-frontmatter
- GIVEN a main spec file has no frontmatter mapping
- WHEN `verify-spec-mappings` is run
- THEN the command reports `valid: false`
- AND `errors` identifies the spec file and missing mapping frontmatter

#### Scenario: invalid-spec-mapping-path
- GIVEN a main spec file maps an implementation or test path that does not exist
- WHEN `verify-spec-mappings` is run
- THEN the command reports `valid: false`
- AND `errors` identifies the spec file, field, and missing target path

### Requirement: verify-spec-mappings-is-structural-only
`verify-spec-mappings` MUST limit itself to deterministic filesystem mechanics:
frontmatter presence, mapping field shape, path string validation, and target
existence. Semantic alignment between specs, implementation behavior, and tests
MUST remain the responsibility of AI skills.

#### Scenario: structural-validation-does-not-claim-semantic-coverage
- GIVEN a mapped file path exists but may not actually implement the spec
- WHEN `verify-spec-mappings` is run
- THEN the command does not report semantic coverage claims
- AND it only validates the mapping structure and path existence

### Requirement: audit-spec-mapping-coverage-compares-evidence-to-one-spec
`spec-driven.js audit-spec-mapping-coverage <spec-path>` MUST compare one spec
file's mapping frontmatter against explicit evidence paths passed on the command
line. It MUST accept repeated `--implementation <repo-path>` and `--tests
<repo-path>` flags, treat those values as deterministic evidence only, and
output JSON describing:

- the spec path
- the spec's current `mapping.implementation` and `mapping.tests`
- the provided implementation and test evidence sets
- evidence paths missing from the mapping
- mapping paths not present in the evidence set
- any structural or path validation errors

The command MUST NOT infer semantic evidence on its own. It MUST only compare
the explicit evidence set supplied by the caller against the spec's declared
mapping.

#### Scenario: audit-spec-mapping-coverage-flags-missing-test-evidence
- GIVEN a spec maps its implementation file but omits a directly verifying test
- AND the caller passes that test file with `--tests`
- WHEN `audit-spec-mapping-coverage` is run
- THEN the command reports the test file under `missing.tests`
- AND `valid` is `false`

#### Scenario: audit-spec-mapping-coverage-reports-extra-mapped-file
- GIVEN a spec mapping includes an implementation file not present in the
  caller's evidence set
- WHEN `audit-spec-mapping-coverage` is run
- THEN the command reports that path under `extra.implementation`
- AND it does not claim that the file is semantically wrong on its own

### Requirement: audit-unmapped-spec-evidence-reports-candidates-not-mapped-by-any-spec
`spec-driven.js audit-unmapped-spec-evidence` MUST compare explicit candidate
implementation and test evidence paths against the union of all main-spec
mapping frontmatter under `.spec-driven/specs/`.

It MUST accept repeated `--implementation <repo-path>` and `--tests <repo-path>`
flags, treat those values as deterministic candidate evidence only, and output
JSON describing:

- all mapped implementation and test paths collected from main specs
- the provided candidate implementation and test paths
- candidate paths not mapped by any main spec under `unmapped`
- any structural or path validation errors from the scanned main specs

The command MUST NOT infer whether an unmapped file needs a new spec, a mapping
repair, or no action. It MUST only report which explicit candidate paths are not
currently mapped by any main spec.

#### Scenario: audit-unmapped-spec-evidence-flags-unmapped-implementation
- GIVEN main spec mappings do not reference `src/extra.ts`
- AND the caller passes `src/extra.ts` with `--implementation`
- WHEN `audit-unmapped-spec-evidence` runs
- THEN stdout JSON reports `src/extra.ts` under `unmapped.implementation`
- AND `valid` is `false`

#### Scenario: audit-unmapped-spec-evidence-passes-fully-mapped-candidates
- GIVEN every candidate implementation and test file passed to the command is
  already referenced by at least one main spec mapping
- WHEN `audit-unmapped-spec-evidence` runs
- THEN stdout JSON reports `valid: true`
- AND both `unmapped.implementation` and `unmapped.tests` are empty

### Requirement: archive-moves-change
`spec-driven.js archive <name>` MUST move `.spec-driven/changes/<name>/` to
`.spec-driven/changes/archive/YYYY-MM-DD-<name>/`, creating the archive directory
if needed. Exits 1 if the source does not exist or the target already exists.

If `.spec-driven/roadmap/` exists, after the move succeeds the command MUST
reconcile any milestone file that lists the archived change so that planned
change entry uses `Declared: complete`, and so the milestone declared status
matches the status derived from the current planned change archive state. It
MUST also regenerate `.spec-driven/roadmap/INDEX.md` so milestone entries
reflect the reconciled declared status.

#### Scenario: archive-reconciles-planned-change-and-milestone-status-when-present
- GIVEN a roadmap milestone lists a change with `Declared: planned`
- WHEN `spec-driven.js archive <name>` succeeds for that change
- THEN the matching planned change entry is rewritten to `Declared: complete`
- AND the milestone file is rewritten with the reconciled `- Declared: <status>` value
- AND `.spec-driven/roadmap/INDEX.md` reflects the reconciled milestone status

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
- `## In Scope`
- `## Out of Scope`
- `## Done Criteria`
- `## Planned Changes`
- `## Dependencies`
- `## Risks`
- `## Status`
- `## Notes`

If a required section is missing, the command MUST report an error for that
milestone.

`verify-roadmap` MUST also require the `## Status` section to contain exactly
one bullet in the form `- Declared: <status>`, where `<status>` is one of:
- `proposed`
- `active`
- `blocked`
- `complete`

The command's structured JSON output MUST include the allowed milestone declared
status enum so AI consumers can see the legal values directly from the
validation result.

If the status bullet is missing, repeated, malformed, or uses an unsupported
status value, the command MUST report the milestone as invalid.
When the failure is caused by an unsupported status value, the error MUST list
the allowed milestone declared status values directly.

### Requirement: verify-roadmap-validates-planned-change-entry-format
For each bullet under `## Planned Changes`, `verify-roadmap` MUST require the
canonical entry format
`- \`<change-name>\` - Declared: <status> - <summary>`.

`<change-name>` MUST match the change naming rule
`^[a-z0-9]+(-[a-z0-9]+)*$`. `<status>` MUST be either `planned` or `complete`.
`<summary>` MUST be present, non-empty, and fully contained on the same line as
the planned change bullet.

The command's structured JSON output MUST include the allowed planned change
declared status enum so AI consumers can see the legal values directly from the
validation result.

If a planned change bullet omits the declared status, uses an unsupported status
value, omits the summary, uses a malformed change name, does not follow the
canonical format, or is followed by attached indented continuation lines, the
command MUST report the milestone as invalid.

When the failure is caused by an unsupported planned change status value, the
error MUST list the allowed planned change declared status values directly.

Any non-empty line under `## Planned Changes` that is not itself a valid
top-level planned change bullet MUST be reported as invalid.

#### Scenario: declared-planned-change-is-valid
- GIVEN a milestone lists a planned change entry in the form
  `- \`define-generated-artifact-schemas\` - Declared: planned - define the YAML schema shape for generated planning artifacts`
- WHEN `verify-roadmap` validates the file
- THEN the planned change entry is accepted
- AND `roadmap-status` can still resolve the change by the name
  `define-generated-artifact-schemas`

#### Scenario: unsupported-planned-change-status-is-invalid
- GIVEN a milestone lists a planned change entry with `Declared: done`
- WHEN `verify-roadmap` validates the file
- THEN the milestone is reported as invalid
- AND the result explains that the planned change status is unsupported

#### Scenario: multiline-planned-change-detail-is-invalid
- GIVEN a milestone lists a valid planned change first line
- AND one or more indented continuation lines immediately below it
- WHEN `verify-roadmap` validates the file
- THEN the milestone is reported as invalid
- AND the result explains that planned change descriptions must remain single-line

### Requirement: verify-roadmap-rejects-oversized-milestones
If a roadmap milestone contains more than 10 bullet items under
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

When milestone files use planned change bullets in the canonical format
`- \`<change-name>\` - Declared: <status> - <summary>`, the command MUST resolve
roadmap state from the `<change-name>` portion and MUST ignore the declared
status and trailing summary when matching active or archived changes.

`roadmap-status` and archive reconciliation MUST treat multiline planned change
detail as invalid roadmap input rather than as attached metadata belonging to a
valid planned change entry.

### Requirement: roadmap-status-includes-derived-status-and-mismatches
For each roadmap milestone, `roadmap-status` MUST report the declared roadmap
status, a derived status based on planned change archive state, the listed
planned changes with their declared per-change status, resolved repository state
(`archived`, `active`, or `missing`), derived per-change status, and mismatch
messages when declared values disagree with derived values.

For each planned change, the derived per-change status MUST use the following
rules:
- `complete` when the change is archived
- `planned` when the change is active or missing

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

#### Scenario: archived-planned-change-derives-complete
- GIVEN a milestone lists a planned change with `Declared: planned`
- AND that change is archived
- WHEN `roadmap-status` is run
- THEN the planned change result reports resolved state `archived`
- AND the derived per-change status is `complete`

#### Scenario: stale-complete-planned-change-is-reported
- GIVEN a milestone lists a planned change with `Declared: complete`
- AND that change is still active
- WHEN `roadmap-status` is run
- THEN the planned change result reports derived per-change status `planned`
- AND the result includes a mismatch for that planned change
