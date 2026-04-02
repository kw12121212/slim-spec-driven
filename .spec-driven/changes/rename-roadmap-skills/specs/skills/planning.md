# Delta: Skills Planning

## MODIFIED Requirements

### Requirement: roadmap-skills-read-roadmap-context-before-editing
`roadmap-plan`, `roadmap-milestone`, and `roadmap-sync` MUST read
`.spec-driven/config.yaml`, existing `.spec-driven/roadmap/INDEX.md` and
relevant milestone files when present, and the active or archived changes needed
to understand current execution state before they decide what roadmap updates to
make.

Previously: This requirement referred to `spec-driven-roadmap-plan`,
`spec-driven-roadmap-milestone`, and `spec-driven-roadmap-sync`.

### Requirement: roadmap-plan-confirms-milestone-structure-before-writing
Before `roadmap-plan` creates or substantially restructures roadmap artifacts,
it MUST converge with the user on milestone boundaries, stage goals, and
completion criteria, then confirm the intended roadmap shape before writing
files.

Previously: This requirement referred to `spec-driven-roadmap-plan`.
