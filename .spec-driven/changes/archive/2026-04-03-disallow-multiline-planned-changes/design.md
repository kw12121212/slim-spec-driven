# Design: disallow-multiline-planned-changes

## Approach

Update the roadmap-related specs to make single-line planned change entries the
only valid milestone work-list format.

The proposal will modify roadmap skill requirements, script requirements, and
roadmap validation rules so they consistently reject indented continuation lines
under `## Planned Changes`. Implementation can then simplify parsing and
validation around one canonical entry shape and migrate existing milestone files
to match.

## Key Decisions

- Treat attached continuation lines as invalid roadmap content rather than as
  optional detail. This directly removes the ambiguous case causing validation
  complexity.
- Keep the existing canonical first-line format instead of inventing a new
  structure. This is the smallest change that fixes the validation problem.
- Include migration of the repository's current milestone files in the change
  scope so the repo remains self-consistent once the tighter rule lands.

## Alternatives Considered

- Keep multiline detail but tighten parser rules further. Rejected because it
  preserves the same format ambiguity and continues to burden validation.
- Move extra planned change detail into a new nested structure. Rejected because
  it expands roadmap format complexity instead of reducing it.
- Forbid multiline detail only in validation while leaving skill specs tolerant
  of it. Rejected because it would leave roadmap authoring expectations
  inconsistent across the workflow.
