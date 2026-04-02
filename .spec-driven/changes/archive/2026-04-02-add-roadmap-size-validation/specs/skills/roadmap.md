# Delta: Skills Roadmap

## ADDED Requirements

### Requirement: milestone-files-use-standard-sections-for-validation
Roadmap milestone files MUST use the following section headings so roadmap
validation can inspect them predictably:
- `## Goal`
- `## Done Criteria`
- `## Candidate Ideas`
- `## Planned Changes`
- `## Dependencies / Risks`
- `## Status`

### Requirement: milestones-limit-planned-change-count
A roadmap milestone MUST contain no more than 5 bullet items under
`## Planned Changes`. If the planned change count exceeds that limit, the
milestone is too large and MUST be split into multiple milestones instead of
remaining as a single stage.

#### Scenario: too-many-planned-changes
- GIVEN a milestone has 6 planned changes
- WHEN roadmap validation is run
- THEN the milestone is reported as invalid and the result tells the user to
  split the milestone

### Requirement: roadmap-skills-run-size-validation-before-finish
After `spec-driven-roadmap-plan`, `spec-driven-roadmap-milestone`, or
`spec-driven-roadmap-sync` edit roadmap files, they MUST run the roadmap
validation command. If roadmap validation reports that a milestone is too large,
the skill MUST stop and tell the user to split the milestone rather than
presenting the roadmap as ready.
