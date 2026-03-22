---
name: spec-driven-archive
description: Archive a completed spec-driven change. Warns on incomplete tasks, moves change to archive/ with a date prefix.
version: 0.1.0
---

You are helping the user archive a completed spec-driven change.

## Steps

1. **Select the change** — run `node {{SKILL_DIR}}/scripts/spec-driven.js modify` to list active changes. Ask which change to archive. If already specified, use it.

2. **Check for incomplete tasks** — run:
   ```
   node {{SKILL_DIR}}/scripts/spec-driven.js apply <name>
   ```
   If `remaining > 0`, warn the user:
   > "This change has X incomplete tasks. Archiving will preserve them as-is. Are you sure you want to proceed?"
   Wait for confirmation before continuing.

3. **Confirm specs are up to date** — read `.spec-driven/changes/<name>/tasks.md` and check whether a "Update specs" task exists and is marked complete. Then:
   - If the task is present and marked `[x]`: proceed.
   - If the task is present but unchecked `[ ]`: block and tell the user — this should have been caught in step 2, but remind them to update `.spec-driven/specs/` before archiving.
   - If no such task exists: ask the user to confirm — "Has `.spec-driven/specs/` been updated to reflect this change, or does this change not affect observable behavior?"
   Wait for confirmation before continuing.

4. **Archive the change** — run:
   ```
   node {{SKILL_DIR}}/scripts/spec-driven.js archive <name>
   ```

5. **Confirm** — report the result:
   - Where the change was moved to (e.g. `.spec-driven/changes/archive/2024-01-15-<name>/`)
   - Suggest running `/spec-driven-propose` if there's follow-up work

## Rules
- Always check for incomplete tasks before archiving
- Always confirm specs are up to date before archiving — this is a hard gate, not optional
- Do not skip the incomplete-task warning — let the user make an informed decision
- Do not delete anything — archive only moves, never deletes
