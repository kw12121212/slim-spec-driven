# YAML Artifact Contracts

## Goal
Define a strict, machine-checkable YAML contract for skill-generated planning artifacts so scripts can validate structure consistently instead of relying on loosely formatted markdown prose.

## In Scope
- Define which planning artifacts gain YAML-backed contracts first.
- Describe the field structure the scripts will validate for those artifacts.
- Keep the first contract pass narrow enough to ship without redesigning the entire workflow.

## Out of Scope
- Implement runtime validation in the CLI.
- Migrate milestone files away from Markdown-first authoring.
- Redesign unrelated change artifact prose sections.

## Done Criteria
- The repository defines which generated artifacts require YAML validation and which fields are required for each artifact type.
- The contract distinguishes required fields, optional fields, enums, and structural rules clearly enough for scripts to validate without AI interpretation.
- Validation failure behavior is specified at the artifact level so later script work can reject malformed content consistently.

## Planned Changes
- `define-generated-artifact-schemas` - define the YAML-backed field schema for generated planning artifacts, including which artifact families participate first and which fields are required, optional, or enum-constrained.
- `spec-generated-document-validation-rules` - specify how malformed generated documents are reported and rejected so later CLI validation can stay deterministic.

## Dependencies
- The contract should stay aligned with existing skill outputs so rollout does not immediately break all planning flows.

## Risks
- If the YAML contract is too broad or too strict in the first pass, later validation work may create noisy failures and require follow-up refinement.
- Artifact boundaries need to stay explicit so markdown prose and YAML metadata do not get mixed inconsistently across files.

## Status
- Declared: proposed

## Notes
- This milestone defines the contract shape only; parser and workflow rollout happen in a later milestone.
