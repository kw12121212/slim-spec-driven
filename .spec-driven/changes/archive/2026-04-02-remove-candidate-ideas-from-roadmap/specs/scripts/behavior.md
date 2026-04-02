# Delta: Scripts Behavior

## MODIFIED Requirements

### Requirement: verify-roadmap-enforces-standard-milestone-sections
Previously: For each roadmap milestone file, `verify-roadmap` MUST require the
standard sections needed for scriptable roadmap validation:
- `## Goal`
- `## Done Criteria`
- `## Candidate Ideas`
- `## Planned Changes`
- `## Dependencies / Risks`
- `## Status`

If a required section is missing, the command MUST report an error for that
milestone.

For each roadmap milestone file, `verify-roadmap` MUST require the standard
sections needed for scriptable roadmap validation:
- `## Goal`
- `## Done Criteria`
- `## Planned Changes`
- `## Dependencies / Risks`
- `## Status`

If a required section is missing, the command MUST report an error for that
milestone.
