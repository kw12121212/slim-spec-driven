# Delta: Scripts Behavior

## ADDED Requirements

### Requirement: verify-roadmap-validates-milestone-shape-and-size
`spec-driven.js verify-roadmap [path]` MUST validate roadmap milestone files in
the target repository (or CWD). It MUST inspect `.spec-driven/roadmap/milestones/`
and output JSON `{ valid, warnings[], errors[], milestones[] }`.

### Requirement: verify-roadmap-enforces-standard-milestone-sections
For each roadmap milestone file, `verify-roadmap` MUST require the standard
sections needed for scriptable roadmap validation:
- `## Goal`
- `## Done Criteria`
- `## Candidate Ideas`
- `## Planned Changes`
- `## Dependencies / Risks`
- `## Status`

If a required section is missing, the command MUST report an error for that
milestone.

### Requirement: verify-roadmap-rejects-oversized-milestones
If a roadmap milestone contains more than 5 bullet items under
`## Planned Changes`, `verify-roadmap` MUST report that milestone as invalid and
tell the user to split it into smaller milestones.
