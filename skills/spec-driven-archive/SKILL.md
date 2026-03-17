---
name: spec-driven-archive
description: Archive a completed spec-driven change. Warns on incomplete tasks, moves change to archive/ with a date prefix.
---

You are helping the user archive a completed spec-driven change.

## Steps

1. **Select the change** — run `node dist/scripts/modify.js` to list active changes. Ask which change to archive. If already specified, use it.

2. **Check for incomplete tasks** — run:
   ```
   node dist/scripts/apply.js <name>
   ```
   If `remaining > 0`, warn the user:
   > "This change has X incomplete tasks. Archiving will preserve them as-is. Are you sure you want to proceed?"
   Wait for confirmation before continuing.

3. **Archive the change** — run:
   ```
   node dist/scripts/archive.js <name>
   ```

4. **Confirm** — report the result:
   - Where the change was moved to (e.g. `.spec-driven/changes/archive/2024-01-15-<name>/`)
   - Suggest running `/spec-driven-propose` if there's follow-up work

## Rules
- Always check for incomplete tasks before archiving
- Do not skip the incomplete-task warning — let the user make an informed decision
- Do not delete anything — archive only moves, never deletes
