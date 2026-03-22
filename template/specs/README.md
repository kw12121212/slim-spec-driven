# Specs

Current-state specifications for the project, organized by category.

Each subdirectory represents a domain or subsystem. Directory names must be English, no spaces (use hyphens for multi-word names).

```
specs/
├── core/        # Core domain logic and business rules
├── api/         # External interfaces and contracts
├── data/        # Data models and persistence
└── ...          # Add categories as needed
```

## Format

```markdown
### Requirement: <name>
The system MUST/SHOULD/MAY <observable behavior>.

#### Scenario: <name>
- GIVEN <precondition>
- WHEN <action>
- THEN <expected outcome>
```

**Keywords**: MUST = required, SHOULD = recommended, MAY = optional (RFC 2119).

## Conventions

- One file per feature or concept within a category
- Use present tense: "The system does X"
- Specs describe **observable behavior**, not implementation details
- Keep specs stable; changes go through the `changes/` workflow
- Changes to specs are tracked in `changes/<name>/specs/delta.md`
