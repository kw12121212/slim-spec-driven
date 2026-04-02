## MODIFIED Requirements

### Requirement: roadmap-assets-live-under-spec-driven-roadmap
Previously: The roadmap layer MUST live under `.spec-driven/roadmap/` and MUST include
`INDEX.md` plus a `milestones/` directory. The roadmap asset is long-lived
planning state and MUST remain distinct from `.spec-driven/changes/`, which
continues to hold change-specific execution artifacts.

The roadmap layer MUST live under `.spec-driven/roadmap/` and MUST include
`INDEX.md` plus a `milestones/` directory. The roadmap asset is long-lived
planning state and MUST remain distinct from `.spec-driven/changes/`, which
continues to hold change-specific execution artifacts.

`.spec-driven/roadmap/INDEX.md` MUST use a standard machine-validated Markdown
format:
- The first line MUST be `# Roadmap Index`
- The file MUST contain exactly one `## Milestones` section
- Each milestone entry under `## Milestones` MUST be a bullet in the form
  `- [<file>](milestones/<file>) - <title> - <declared-status>`
- `<declared-status>` MUST use the same declared milestone status enum required
  by roadmap milestone files

The roadmap index MUST act as a structured navigation artifact rather than a
freeform prose document.

#### Scenario: roadmap-index-uses-canonical-entry-format
- GIVEN `.spec-driven/roadmap/INDEX.md` lists milestone files
- WHEN the roadmap index is validated or regenerated
- THEN each milestone appears as one bullet link under `## Milestones`
- AND each bullet includes the milestone title and declared status in the
  canonical format

### Requirement: milestone-files-use-standard-sections-for-validation
Previously: Roadmap milestone files MUST use the following section headings so roadmap
validation can inspect them predictably:
- `## Goal`
- `## Done Criteria`
- `## Planned Changes`
- `## Dependencies / Risks`
- `## Status`

Roadmap milestone files MUST use the following section headings so roadmap
validation can inspect them predictably:
- `## Goal`
- `## Done Criteria`
- `## Planned Changes`
- `## Dependencies / Risks`
- `## Status`

The `## Status` section MUST contain exactly one bullet in the form
`- Declared: <status>`.

`<status>` MUST be one of:
- `proposed`
- `active`
- `blocked`
- `complete`

Roadmap milestone files MUST NOT use freeform prose or additional bullet fields
inside `## Status`.

#### Scenario: milestone-status-uses-declared-bullet
- GIVEN a roadmap milestone file contains a `## Status` section
- WHEN roadmap validation inspects the milestone
- THEN the section contains exactly one bullet
- AND that bullet matches `- Declared: <status>`

### Requirement: milestone-completion-derives-from-archived-planned-changes
Previously: A milestone MUST be treated as complete only when all of its listed planned
changes are archived under `.spec-driven/changes/archive/`. The roadmap MUST NOT
support manual completion overrides that can mark a milestone done while one or
more planned changes remain active, blocked, or unstarted.

A milestone MUST be treated as complete only when all of its listed planned
changes are archived under `.spec-driven/changes/archive/`. The roadmap MUST NOT
support manual completion overrides that can mark a milestone done while one or
more planned changes remain active, blocked, or unstarted.

Declared roadmap status remains part of the milestone file, but repository
evidence remains authoritative for derived completion. If a milestone declares
`complete` while one or more planned changes are still active or missing, that
declared status is stale and MUST be reported as mismatched.

#### Scenario: declared-complete-with-active-change-is-stale
- GIVEN a milestone declares `complete`
- AND one of its planned changes is still active
- WHEN roadmap status is evaluated
- THEN the milestone derived status is not `complete`
- AND the result reports a declared-versus-derived mismatch
