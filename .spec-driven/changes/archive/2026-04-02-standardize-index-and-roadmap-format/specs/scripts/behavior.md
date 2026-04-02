## MODIFIED Requirements

### Requirement: init-bootstraps-project
Previously: `spec-driven.js init [path]` MUST create or repair `.spec-driven/` at the given path (or CWD).
If `.spec-driven/` does not exist, it creates all scaffold files from scratch,
including `.spec-driven/roadmap/INDEX.md` and `.spec-driven/roadmap/milestones/`.
If `.spec-driven/` already exists, it creates any missing files/directories without overwriting existing ones.
In both cases, it regenerates `specs/INDEX.md` to list all `.md` files currently present under
`specs/` (excluding `INDEX.md` itself and `README.md`), and exits 0.

`spec-driven.js init [path]` MUST create or repair `.spec-driven/` at the given
path (or CWD). If `.spec-driven/` does not exist, it creates all scaffold files
from scratch, including `.spec-driven/roadmap/INDEX.md` and
`.spec-driven/roadmap/milestones/`. If `.spec-driven/` already exists, it
creates any missing files/directories without overwriting existing ones.

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

#### Scenario: init-regenerates-standard-specs-index
- GIVEN `.spec-driven/specs/` contains one or more spec files
- WHEN `init` is run
- THEN `.spec-driven/specs/INDEX.md` is rewritten in the canonical index format
- AND every current spec file appears exactly once in the correct category

### Requirement: verify-roadmap-validates-milestone-shape-and-size
Previously: `spec-driven.js verify-roadmap [path]` MUST validate roadmap milestone files in
the target repository (or CWD). It MUST inspect `.spec-driven/roadmap/milestones/`
and output JSON `{ valid, warnings[], errors[], milestones[] }`.

`spec-driven.js verify-roadmap [path]` MUST validate roadmap assets in the
target repository (or CWD). It MUST inspect `.spec-driven/roadmap/INDEX.md` and
`.spec-driven/roadmap/milestones/`, and output JSON
`{ valid, warnings[], errors[], milestones[] }`.

### Requirement: verify-roadmap-enforces-standard-milestone-sections
Previously: For each roadmap milestone file, `verify-roadmap` MUST require the standard
sections needed for scriptable roadmap validation:
- `## Goal`
- `## Done Criteria`
- `## Planned Changes`
- `## Dependencies / Risks`
- `## Status`

If a required section is missing, the command MUST report an error for that
milestone.

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

### Requirement: verify-roadmap-validates-roadmap-index-format
`verify-roadmap` MUST validate `.spec-driven/roadmap/INDEX.md` against the
canonical roadmap index format:
- The first line is `# Roadmap Index`
- The file contains exactly one `## Milestones` section
- Each milestone bullet matches
  `- [<file>](milestones/<file>) - <title> - <declared-status>`
- Each `<declared-status>` value uses the supported declared-status enum

If the roadmap index format is invalid, `verify-roadmap` MUST report an error.

### Requirement: roadmap-status-includes-derived-status-and-mismatches
Previously: For each roadmap milestone, `roadmap-status` MUST report the declared roadmap
status, a derived status based on planned change archive state, the listed
planned changes with their resolved state (`archived`, `active`, or `missing`),
and mismatch messages when the declared roadmap status disagrees with the
derived status.

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

#### Scenario: blocked-is-declared-only
- GIVEN a milestone declares `blocked`
- AND its planned changes are all still missing
- WHEN `roadmap-status` is run
- THEN the milestone declared status is `blocked`
- AND the derived status is `proposed`
- AND the result reports a mismatch if the two statuses differ
