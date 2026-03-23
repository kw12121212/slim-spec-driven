# init-idempotent

## What

Make `spec-driven.js init` idempotent: instead of exiting with an error when `.spec-driven/` already exists, it fills in any missing files/directories and regenerates `specs/INDEX.md` to reflect all `.md` files currently present under `specs/`.

## Why

Users run `init` on an existing project expecting it to repair a partial setup or update the index. The current hard exit with an error is a poor experience. The underlying scaffold logic already exists in `ensureSpecDrivenScaffold()` (used by `migrate`); `init` should reuse it and extend it with index regeneration.

## Scope

**In scope:**
- Remove the "already exists" guard in `init()`
- Delegate to `ensureSpecDrivenScaffold()` for file/directory creation
- After ensuring scaffold, regenerate `specs/INDEX.md` to list all current `.md` files under `specs/` (excluding `INDEX.md` itself and `README.md`)
- Update `init-bootstraps-project` requirement in `behavior.md`

**Out of scope:**
- Changes to `migrate`, `propose`, or any other subcommand
- Changing the content format of other spec files

## Unchanged Behavior

- `init` with no existing `.spec-driven/` still creates all files as before and exits 0
- All other subcommands are completely unaffected
- `ensureSpecDrivenScaffold()` behavior used by `migrate` is unchanged
