# Design: init-idempotent

## Approach

Replace the early-exit guard in `init()` with a call to `ensureSpecDrivenScaffold()`, which already handles "create if missing" logic for all scaffold files. After scaffold is ensured, call a new helper `regenerateIndexMd()` that walks `specs/` recursively, collects all `.md` files excluding `INDEX.md` and `README.md`, and rewrites `specs/INDEX.md` with a grouped entry per file.

The output format of regenerated `INDEX.md` follows the existing hand-written convention: one line per file with a relative link and a dash-separated description placeholder.

## Key Decisions

- **Reuse `ensureSpecDrivenScaffold()`**: avoids duplicating scaffold logic; `init` and `migrate` converge on the same safety guarantees.
- **Always regenerate `INDEX.md`**: simpler than diffing; file is auto-managed so overwriting is safe. Any user-written descriptions in the old index are replaced — this is acceptable because the index is intended as an auto-generated table of contents.
- **Exclude `README.md` and `INDEX.md` from the index entries**: these are meta-files, not spec files.

## Alternatives Considered

- **Keep the error on existing directory**: rejected — the main request is idempotency.
- **Merge/patch existing INDEX.md**: more complex with little benefit; the index is always regenerable from the filesystem.
