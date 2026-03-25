## MODIFIED Requirements

### Requirement: planning-skills-do-not-implement-code
`spec-driven-init`, `spec-driven-propose`, `spec-driven-modify`, and
`spec-driven-spec-content` MUST stay in the planning/documentation layer. They MAY
create or edit workflow artifacts under `.spec-driven/`, but they MUST NOT
implement product code changes.

Previously: `spec-driven-init`, `spec-driven-propose`, and `spec-driven-modify`
were the only planning/documentation skills called out explicitly.
