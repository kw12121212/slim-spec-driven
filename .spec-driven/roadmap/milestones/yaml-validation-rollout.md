# YAML Validation Rollout

## Goal
Implement script-level validation and workflow integration for the new artifact YAML contracts so malformed generated documents are caught during normal spec-driven operations.

## Done Criteria
- A script entry point or validation path can parse and validate the targeted YAML-backed artifacts.
- The validation flow is wired into the relevant workflow step so malformed artifacts are surfaced before downstream execution.
- Authoring and repair expectations are documented for maintainers updating skills or generated artifacts.

## Planned Changes
- `add-artifact-yaml-validator-command`
- `integrate-artifact-validation-into-verify-workflow`
- `document-artifact-validation-authoring-rules`

## Dependencies / Risks
- This milestone depends on the artifact contract milestone defining the exact validation target and field rules first.
- Validation should report actionable failures without making normal planning flows unusable when only non-critical warnings are present.
- If multiple artifact families need different parsing rules, rollout may need careful scoping to avoid an oversized first implementation.

## Status
- Declared: proposed
