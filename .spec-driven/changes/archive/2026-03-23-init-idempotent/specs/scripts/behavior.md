# Scripts Behavior Delta: init-idempotent

## MODIFIED Requirements

### Requirement: init-bootstraps-project
`spec-driven.js init [path]` MUST create or repair `.spec-driven/` at the given path (or CWD).
If `.spec-driven/` does not exist, it creates all scaffold files from scratch.
If `.spec-driven/` already exists, it creates any missing files/directories without overwriting existing ones.
In both cases, it regenerates `specs/INDEX.md` to list all `.md` files currently present under
`specs/` (excluding `INDEX.md` itself and `README.md`), and exits 0.

#### Scenario: init-on-existing-directory
- GIVEN `.spec-driven/` already exists with some files present
- WHEN `init` is run
- THEN missing scaffold files are created, existing files are not overwritten, `specs/INDEX.md` is regenerated, and the command exits 0

#### Scenario: init-updates-index
- GIVEN `.spec-driven/specs/` contains one or more `.md` files besides `INDEX.md` and `README.md`
- WHEN `init` is run
- THEN `specs/INDEX.md` is updated to list each of those files
