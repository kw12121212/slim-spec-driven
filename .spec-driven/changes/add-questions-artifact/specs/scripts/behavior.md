## ADDED Requirements

### Requirement: propose-creates-questions
`spec-driven.js propose <name>` MUST create `questions.md` in the change directory alongside the other artifacts, with seed content containing `## Open` and `## Resolved` sections.

### Requirement: modify-shows-questions
`spec-driven.js modify <name>` MUST include `questions.md` in the listed artifact paths.

### Requirement: verify-checks-questions
`spec-driven.js verify <name>` MUST check `questions.md` for open questions (unchecked `- [ ]` items).
If open questions exist, errors MUST include a message indicating unanswered questions.

## MODIFIED Requirements

### Requirement: propose-creates-artifacts
`spec-driven.js propose <name>` MUST create `.spec-driven/changes/<name>/` containing
`proposal.md`, `specs/` directory, `design.md`, `tasks.md`, and `questions.md` with seed content.
The name MUST match `^[a-z0-9]+(-[a-z0-9]+)*$`. Exits 1 if invalid or already exists.

Previously: Did not create `questions.md`.

### Requirement: modify-lists-and-shows
`spec-driven.js modify` with no argument MUST list all active change directories,
excluding `archive/`. With a name argument, MUST print paths to all five artifacts
(`proposal.md`, `specs/`, `design.md`, `tasks.md`, `questions.md`).
Exits 1 if the named change does not exist.

Previously: Listed four artifacts (no `questions.md`).

### Requirement: verify-checks-artifacts
`spec-driven.js verify <name>` MUST check that `proposal.md`, `design.md`, `tasks.md`, and `questions.md`
exist and are non-empty, and that `specs/` directory exists.
Output is always `{ valid, warnings[], errors[] }` and exits 0.
`valid` is false only when `errors` is non-empty.

Previously: Checked three files (`proposal.md`, `design.md`, `tasks.md`) and `specs/` directory. Also checked for `[NEEDS CLARIFICATION]` markers — this check is removed in favor of questions.md.

## REMOVED Requirements

### Requirement: unresolved-clarification-markers
Removed: The `[NEEDS CLARIFICATION]` marker check in verify is replaced by the questions.md open questions check. Ambiguities are now tracked exclusively in questions.md.
