# Delta: Skills Workflow

## MODIFIED Requirements

### Requirement: planning-skills-do-not-implement-code
`spec-driven-init`, `spec-driven-propose`, `spec-driven-modify`,
`spec-driven-spec-content`, `spec-driven-sync-specs`, `roadmap-plan`,
`roadmap-milestone`, and `roadmap-sync` MUST stay in the
planning/documentation layer. They MAY create or edit workflow artifacts under
`.spec-driven/`, but they MUST NOT implement product code changes.

Previously: This requirement referred to `spec-driven-roadmap-plan`,
`spec-driven-roadmap-milestone`, and `spec-driven-roadmap-sync`.
