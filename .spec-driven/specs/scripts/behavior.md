# Scripts Behavior

## propose.js

- Accepts a single kebab-case argument matching `^[a-z0-9]+(-[a-z0-9]+)*$`
- Creates `.spec-driven/changes/<name>/` with proposal.md, design.md, tasks.md
- Exits 1 if the name is invalid or the change already exists
- Seed files contain placeholder text using `[Describe ...]` and `[List ...]` patterns

## modify.js

- With no argument: lists all directories under `.spec-driven/changes/` excluding `archive/`
- With a name argument: prints paths to proposal.md, design.md, tasks.md for that change
- Exits 1 if the named change does not exist

## apply.js

- Parses `tasks.md` for `- [ ]` and `- [x]` checkboxes (case-insensitive, leading whitespace allowed)
- Outputs JSON: `{ total, complete, remaining, tasks[] }`
- Exits 1 if the change or tasks.md does not exist

## verify.js

- Checks each artifact (proposal.md, design.md, tasks.md) exists and is non-empty
- Emits warnings for unfilled placeholders (`[Describe`, `[List`)
- Emits warnings if tasks.md has no checkboxes or has incomplete tasks
- Always exits 0; errors and warnings are in the JSON payload
- Output: `{ valid, warnings[], errors[] }` — `valid` is false only when errors is non-empty

## archive.js

- Moves `.spec-driven/changes/<name>/` to `.spec-driven/changes/archive/YYYY-MM-DD-<name>/`
- Creates the archive directory if it does not exist
- Exits 1 if the change does not exist or the archive target already exists
