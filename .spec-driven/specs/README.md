# Specs

Specs describe the current state of the system — what it does, not how it was built.

## Format

```markdown
---
mapping:
  implementation:
    - src/example.ts
  tests:
    - test/example.test.ts
---

### Requirement: <name>
The system MUST/SHOULD/MAY <observable behavior>.

#### Scenario: <name>
- GIVEN <precondition>
- WHEN <action>
- THEN <expected outcome>
```

**Keywords**: MUST = required, SHOULD = recommended, MAY = optional (RFC 2119).

## Change Delta Specs

Use delta specs under `.spec-driven/changes/<name>/specs/` when a change adds,
modifies, or removes observable behavior before that behavior is merged into the
main specs. Mirror the main spec path exactly, for example
`.spec-driven/specs/skills/planning.md` becomes
`.spec-driven/changes/<name>/specs/skills/planning.md`.

Use this canonical delta spec format:

```markdown
---
mapping:
  implementation:
    - path/to/implementation.ts
  tests:
    - test/path/to/test.ts
---

## ADDED Requirements

### Requirement: new-capability
The system MUST provide <observable behavior>.

#### Scenario: success
- GIVEN <precondition>
- WHEN <action>
- THEN <result>

## MODIFIED Requirements

### Requirement: existing-capability
Previously: The system MUST <old behavior>.
The system MUST <new behavior>.

## REMOVED Requirements

### Requirement: old-capability
Reason: This behavior is removed because <reason>.
```

Notes:
- Omit empty sections instead of leaving blank placeholders.
- `Previously:` belongs inside modified requirement blocks to capture the prior
  observable behavior being changed.
- Removed requirement blocks include a `Reason:` line explaining why the
  requirement is being removed.
- If the change has no observable spec impact, leave `changes/<name>/specs/`
  empty instead of creating a prose-only file.
- Do not invent `mapping.implementation` or `mapping.tests` paths when the
  related repository evidence is unclear.

## Organization

Group specs by domain area. Use kebab-case directory names (e.g. `core/`, `api/`, `auth/`).

## Conventions

- Write in present tense ("the system does X")
- Describe observable behavior, not implementation details
- Keep each spec focused on one area
- Put related implementation and test file paths in frontmatter mappings, not
  in requirement prose
- Use repo-relative paths under `mapping.implementation` and `mapping.tests`
- Keep mappings at file granularity; do not use line numbers or symbol ranges
