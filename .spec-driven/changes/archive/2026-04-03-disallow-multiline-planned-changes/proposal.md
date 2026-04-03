# disallow-multiline-planned-changes

## What

Disallow multiline planned change descriptions in roadmap milestone files.

This change narrows the `## Planned Changes` format to a single canonical line
per entry: `- `<change-name>` - <summary>`. Indented continuation lines below a
planned change entry will no longer be valid roadmap input.

## Why

Multiline planned change descriptions make milestone parsing and format
validation more fragile. The current rules require roadmap tooling to treat some
indented lines as attached detail and other non-bullet lines as invalid, which
adds ambiguity to validation and handoff behavior.

Restricting each planned change to one detailed line keeps milestone authoring
machine-checkable and makes roadmap validation simpler and more predictable.

## Scope

In scope:
- Update roadmap requirements so planned changes allow only a single summary
  line and do not allow attached continuation lines.
- Update `verify-roadmap` and `roadmap-status` requirements so multiline planned
  change detail is rejected instead of tolerated.
- Update roadmap planning skill requirements so roadmap skills no longer rely on
  attached multiline detail blocks when reading or writing planned changes.
- Migrate the repository's existing roadmap milestone files to compliant
  single-line planned change descriptions during implementation.

Out of scope:
- Redesign other roadmap milestone sections or status rules.
- Change the normal change proposal artifact format under
  `.spec-driven/changes/`.
- Introduce a new roadmap file format beyond tightening the existing Markdown
  rules.

## Unchanged Behavior

Behaviors that must not change as a result of this change (leave blank if nothing is at risk):
- Milestones still use `## Planned Changes` as the only work list for approved
  change candidates.
- Planned change entries still use the canonical change-name-plus-summary bullet
  format.
- Roadmap validation still enforces milestone section shape, status rules, and
  planned change count limits.
