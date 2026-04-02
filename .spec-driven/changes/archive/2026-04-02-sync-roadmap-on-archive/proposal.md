# sync-roadmap-on-archive

## What

Align the archive-related workflow so `spec-driven-archive` and
`spec-driven-auto` both explicitly include roadmap status closeout after archive
when `.spec-driven/roadmap/` exists.

Document that the deterministic roadmap reconciliation performed after archive
is part of the CLI archive command's filesystem mechanics, while the AI remains
responsible for archive gating, spec merging, and explaining the resulting
roadmap impact.

## Why

The current `spec-driven-archive` skill text stops after archiving the change
and does not tell the user that milestone declared status and
`.spec-driven/roadmap/INDEX.md` should be updated as part of archive closeout.
`spec-driven-auto` has the same omission in its archive step.

That omission is confusing because the repository specs already require archive
time roadmap reconciliation, and the CLI implementation already performs that
reconciliation automatically after moving the change into
`.spec-driven/changes/archive/`.

Without this cleanup, the skills, lifecycle specs, and script behavior contract
describe different responsibilities for the same archive flow.

## Scope

In scope:
- Update the skill lifecycle/spec contract so archive-time roadmap
  reconciliation matches the current CLI archive behavior
- Require `spec-driven-auto` to reuse the same archive closeout semantics as
  `spec-driven-archive`
- Update `skills/spec-driven-archive/SKILL.md` to describe post-archive roadmap
  status reconciliation and final reporting
- Update `skills/spec-driven-auto/SKILL.md` so its archive step describes the
  same roadmap-aware closeout

Out of scope:
- Changing the derived milestone status rules themselves
- Changing `roadmap-sync` behavior outside the archive flow
- Adding new roadmap status values or changing roadmap file formats
- Reworking the archive CLI implementation unless the documented behavior is
  found to be inconsistent with the current code

## Unchanged Behavior

Behaviors that must not change as a result of this change (leave blank if nothing is at risk):
- `spec-driven-archive` still blocks archiving when tasks remain incomplete
- Empty delta specs still require explicit confirmation before archive
- Archive still preserves the full change directory under
  `.spec-driven/changes/archive/YYYY-MM-DD-<name>/`
- Milestone completion still derives from archived planned changes rather than
  manual overrides
- `roadmap-sync` remains the explicit tool for standalone roadmap
  reconciliation outside the archive workflow
