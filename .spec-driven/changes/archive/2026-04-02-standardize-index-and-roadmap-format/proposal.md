# standardize-index-and-roadmap-format

## What

Define strict, machine-validated Markdown format contracts for
`.spec-driven/specs/INDEX.md`, `.spec-driven/roadmap/INDEX.md`, and roadmap
milestone `## Status` blocks.

Tighten the CLI behavior so generated indexes, roadmap validation, and roadmap
status reporting all use the same normalized structure instead of relying on
loosely formatted Markdown.

Require the archive workflow to reconcile roadmap state after a change is
archived so milestone files and the roadmap index do not preserve stale
declared statuses after repository evidence changes.

## Why

The repository currently distinguishes `specs/INDEX.md` and
`roadmap/INDEX.md`, but it does not define a strict canonical shape for either
file. That leaves room for drift between human-edited indexes, generated
indexes, and future script validation.

Roadmap milestone status is also underspecified today. The roadmap spec already
requires a `## Status` section and script output already compares declared and
derived status, but the file format does not yet define which status values are
allowed or how they should be represented in Markdown.

Without a normalized format contract, skills and scripts cannot reliably read,
rewrite, or validate these files.

## Scope

In scope:
- Define a canonical Markdown profile for `.spec-driven/specs/INDEX.md`
- Define a canonical Markdown profile for `.spec-driven/roadmap/INDEX.md`
- Define an explicit, machine-validated format for roadmap milestone
  `## Status`
- Define validator and status-command behavior for those formats
- Define how derived roadmap status relates to declared roadmap status
- Define archive-time roadmap reconciliation so roadmap files stay aligned with
  archived change history

Out of scope:
- Implement the script and template changes described by the new specs
- Redesign the overall roadmap workflow or milestone concept
- Add new roadmap planning concepts beyond normalized formatting and status
  rules

## Unchanged Behavior

Behaviors that must not change as a result of this change (leave blank if nothing is at risk):
- Roadmap milestones remain the primary roadmap unit under
  `.spec-driven/roadmap/milestones/`
- `## Planned Changes` remains the only milestone work list
- Milestone completion still derives from archived planned changes rather than
  manual completion overrides
- `spec-driven-propose` and roadmap-backed proposal workflows continue to
  scaffold the same five change artifacts
- Archive continues to preserve change history under `.spec-driven/changes/archive/`
