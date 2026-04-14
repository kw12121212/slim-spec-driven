---
mapping:
  implementation:
    - .spec-driven/specs/README.md
    - skills/spec-driven-propose/SKILL.md
    - skills/spec-driven-brainstorm/SKILL.md
    - skills/spec-driven-modify/SKILL.md
    - skills/roadmap-propose/SKILL.md
    - skills/roadmap-recommend/SKILL.md
  tests:
    - test/run.js
    - test/validate-skills.ts
---

# Delta: Skills Planning

## ADDED Requirements

### Requirement: proposal-authoring-skills-embed-canonical-delta-spec-samples
When `spec-driven-propose`, `spec-driven-brainstorm`, `spec-driven-modify`,
`roadmap-propose`, or `roadmap-recommend` instruct the agent to create or edit
delta spec files under `.spec-driven/changes/<name>/specs/`, they MUST include a
copyable canonical delta spec sample directly in the skill instructions.

That sample MUST show:
- YAML frontmatter using `mapping.implementation` and `mapping.tests`
- the mirrored delta-spec path shape relative to `.spec-driven/specs/`
- `## ADDED Requirements`, `## MODIFIED Requirements`, and
  `## REMOVED Requirements` section markers
- `### Requirement:` headings
- a `Previously:` line inside a modified requirement block
- a removal reason inside a removed requirement block
- omission of empty sections rather than leaving blank placeholders

The skill instructions MUST also tell the agent not to create a prose-only delta
spec file and not to invent mapping paths when repository evidence is unclear.

#### Scenario: proposal-skill-includes-copyable-delta-spec-example
- GIVEN a planning skill is about to direct the agent to write a delta spec
- WHEN the skill describes the required delta spec format
- THEN it includes a copyable example showing the canonical section markers and
  requirement block structure
- AND the example includes a `Previously:` line for modified requirements
- AND the example includes a removal reason for removed requirements

### Requirement: spec-authoring-readme-documents-canonical-delta-spec-format
The repository's `.spec-driven/specs/README.md` MUST document the canonical
change delta spec format separately from the main spec format so humans and
agents can reference the same example outside the skill prompts.

That README guidance MUST include:
- when to use delta specs under `.spec-driven/changes/<name>/specs/`
- a copyable sample file showing ADDED, MODIFIED, and REMOVED sections
- a note that empty sections are omitted
- a note that `Previously:` belongs in modified requirement blocks
- a note that removed requirement blocks include a reason

#### Scenario: readme-shows-delta-spec-example
- GIVEN a user or agent opens `.spec-driven/specs/README.md`
- WHEN they look for change-authoring guidance
- THEN they can find a dedicated delta spec example separate from the main spec
  format example
