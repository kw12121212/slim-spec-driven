# Tasks: init-idempotent

## Implementation

- [x] Remove the `.spec-driven/` already-exists guard in `init()` and replace with `ensureSpecDrivenScaffold()` call
- [x] Add `regenerateIndexMd(specsDir)` helper that walks `specs/` recursively, collects `.md` files (excluding `INDEX.md` and `README.md`), and rewrites `INDEX.md`
- [x] Call `regenerateIndexMd()` at the end of `init()` after scaffold is ensured
- [x] Update console output of `init()` to report created/confirmed files and the index regeneration

## Testing

- [x] Run existing tests: `bash test/run.sh` — all must pass
- [x] Verify: `init` on a fresh dir still creates all files
- [x] Verify: `init` on an existing `.spec-driven/` repairs missing files without overwriting existing ones
- [x] Verify: `init` regenerates `specs/INDEX.md` listing existing spec files

## Verification

- [x] Verify implementation matches proposal
