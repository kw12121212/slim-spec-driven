# YAML Validation Rollout

## Goal
Implement script-level validation and workflow integration for the new artifact YAML contracts so malformed generated documents are caught during normal spec-driven operations.

## In Scope
- Add the CLI validation entry point or workflow integration for the selected YAML-backed artifacts.
- Define how validation failures surface during normal planning and verification flows.
- Document maintainer expectations for authoring and repairing YAML-backed artifacts.

## Out of Scope
- Expand validation to every possible artifact family in the first rollout.
- Replace roadmap milestone Markdown with YAML metadata.
- Redesign unrelated planning skills beyond the validation handoff they require.

## Done Criteria
- A script entry point or validation path can parse and validate the targeted YAML-backed artifacts.
- The validation flow is wired into the relevant workflow step so malformed artifacts are surfaced before downstream execution.
- Authoring and repair expectations are documented for maintainers updating skills or generated artifacts.

## Planned Changes
- `add-artifact-yaml-validator-command` - add a script entry point that validates the targeted YAML-backed artifacts while keeping the first rollout scoped to the artifact families defined by the contract milestone.
- `integrate-artifact-validation-into-verify-workflow` - surface malformed artifact failures during the normal workflow gate where maintainers already expect artifact quality checks.
- `document-artifact-validation-authoring-rules` - document maintainer expectations for writing and repairing validated artifacts, including examples that show both valid authoring and common repair cases.

## Dependencies
- This milestone depends on the artifact contract milestone defining the exact validation target and field rules first.

## Risks
- Validation should report actionable failures without making normal planning flows unusable when only non-critical warnings are present.
- If multiple artifact families need different parsing rules, rollout may need careful scoping to avoid an oversized first implementation.

## Status
- Declared: proposed

## Notes
- Rollout should stay scoped to the first artifact families that benefit from machine validation immediately.
