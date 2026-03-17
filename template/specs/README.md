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

## Conventions

- One file per feature or concept within a category
- Use present tense: "The API returns...", "Users can..."
- Specs describe **observable behavior**, not implementation details
- Keep specs stable; changes go through the `changes/` workflow
- Update specs when behavior changes (tracked as a task in tasks.md)
