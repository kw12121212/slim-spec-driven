# add-roadmap-size-validation

## What

Add a dedicated roadmap validation command that inspects milestone files under
`.spec-driven/roadmap/milestones/` and reports when a milestone has grown too
large to remain a single bounded stage. The change also updates roadmap skills
so they run this validation after editing roadmap assets and explicitly tell the
user to split a milestone when size validation fails.

## Why

The roadmap layer now exists, but milestone size is still enforced only by
prompt wording. That is too soft: the AI can still produce an oversized
milestone and continue as if it were valid. A script-level validation gives the
repository an objective gate, and skill-level integration makes the AI surface
the result clearly instead of silently preserving an oversized milestone.

## Scope

In scope:
- Add a new script command to validate roadmap assets
- Define script-checkable milestone sizing rules and standard section headings
- Report milestone oversize as a validation error that tells the AI to split the
  milestone
- Update roadmap skills so they run roadmap validation after editing roadmap
  files and stop on oversize errors
- Add automated tests covering valid and oversized milestones
- Update docs and scripts contract to include the roadmap validation command

Out of scope:
- Automatic milestone splitting
- Generic roadmap priority scoring or dependency graph features
- New non-roadmap validation commands
- Converting roadmap validation into a general `verify` extension for all assets

## Unchanged Behavior

Behaviors that must not change as a result of this change (leave blank if nothing is at risk):
- `verify <change-name>` remains the validator for change artifacts
- Roadmap skills remain planning/documentation-only and do not implement product
  code
- Milestone completion still derives from archive state rather than manual
  toggles
