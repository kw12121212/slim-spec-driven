# YAML Artifact Contracts

## Goal
Define a strict, machine-checkable YAML contract for skill-generated planning artifacts so scripts can validate structure consistently instead of relying on loosely formatted markdown prose.

## Done Criteria
- The repository defines which generated artifacts require YAML validation and which fields are required for each artifact type.
- The contract distinguishes required fields, optional fields, enums, and structural rules clearly enough for scripts to validate without AI interpretation.
- Validation failure behavior is specified at the artifact level so later script work can reject malformed content consistently.

## Planned Changes
- `define-generated-artifact-schemas`
- `spec-generated-document-validation-rules`

## Dependencies / Risks
- The contract should stay aligned with existing skill outputs so rollout does not immediately break all planning flows.
- If the YAML contract is too broad or too strict in the first pass, later validation work may create noisy failures and require follow-up refinement.
- Artifact boundaries need to stay explicit so markdown prose and YAML metadata do not get mixed inconsistently across files.

## Status
- Declared: proposed
