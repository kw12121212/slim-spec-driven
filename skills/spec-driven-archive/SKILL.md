---
skill_id: spec_driven_archive
name: spec-driven-archive
description: Archive a completed spec-driven change. Requires completed tasks, merges delta specs into main specs, then moves the change to archive/ with a date prefix.
author: auto-spec-driven
type: agent_skill
version: 1.0.0
---

You are helping the user archive a completed spec-driven change.

## Responsibility Split

Explicitly distinguish script work from AI work when you run this skill.

**Handled by CLI scripts**
- `node {{SKILL_DIR}}/scripts/spec-driven.js modify` lists active changes
- `node {{SKILL_DIR}}/scripts/spec-driven.js apply <name>` reports task completion status
- `node {{SKILL_DIR}}/scripts/spec-driven.js archive <name>` moves the change directory into `.spec-driven/changes/archive/YYYY-MM-DD-<name>/` and, when `.spec-driven/roadmap/` exists, reconciles any affected milestone declared status plus `.spec-driven/roadmap/INDEX.md`

**Handled by the AI**
- Ask the user which change to archive when needed
- Interpret the `apply` output and block archive when tasks remain incomplete
- Inspect `.spec-driven/changes/<name>/specs/`, merge delta specs into `.spec-driven/specs/`, and remove emptied main spec files when required by `REMOVED`
- Ask for explicit confirmation if the change has no delta specs
- Update `.spec-driven/specs/INDEX.md` to reflect created or deleted main spec files
- Summarize the merged spec impact, any roadmap status changes caused by archive, and the final archive location

## Prerequisites

The `.spec-driven/` directory must exist at the **project root**. Before proceeding, verify:
```
ls .spec-driven/
```
If this fails, the project is not initialized. Run `/spec-driven-init` first.

## Steps

1. **Select the change** — run `node {{SKILL_DIR}}/scripts/spec-driven.js modify` to list active changes. Ask which change to archive. If already specified, use it.

2. **Check for incomplete tasks** — run:
   ```
   node {{SKILL_DIR}}/scripts/spec-driven.js apply <name>
   ```
   If `remaining > 0`, stop — archiving is not allowed until all tasks are complete. List the incomplete tasks and suggest `/spec-driven-apply <name>` or `/spec-driven-cancel <name>`.

3. **Merge delta specs** — list all files in `.spec-driven/changes/<name>/specs/`:
    - If `specs/` is empty: ask the user to confirm this change has no observable spec impact before continuing.
    - For each delta file (e.g. `specs/install/install-behavior.md`), merge into the corresponding main spec file (e.g. `.spec-driven/specs/install/install-behavior.md`):
     - **ADDED**: append the `### Requirement:` blocks to the target file (create it if it doesn't exist)
     - **MODIFIED**: locate the existing `### Requirement: <name>` block by name and replace it in place
     - **REMOVED**: locate the `### Requirement: <name>` block by name and delete it; remove the file if it becomes empty
   - Briefly summarize what changed in `specs/` after merging.

4. **Update specs/INDEX.md** — after merging, update `.spec-driven/specs/INDEX.md`:
   - Add entries for any newly created spec files (with a one-line description)
   - Remove entries for any deleted spec files
   - Leave existing entries unchanged unless the file's scope changed

5. **Archive the change** — run:
   ```
   node {{SKILL_DIR}}/scripts/spec-driven.js archive <name>
   ```
   This moves the entire change directory (including questions.md) to the archive.
   If `.spec-driven/roadmap/` exists, the command also reconciles milestone declared
   status and regenerates `.spec-driven/roadmap/INDEX.md` for any milestone affected by
   the archived change.

6. **Confirm** — report the result:
   - Where the change was moved to (e.g. `.spec-driven/changes/archive/2024-01-15-<name>/`)
   - Any milestone declared status or roadmap index entry that changed because of archive
   - Suggest running `/spec-driven-propose` if there's follow-up work

## Rules
- Always check for incomplete tasks before archiving
- Never archive a change with incomplete tasks
- Always state which steps are script-executed and which are AI-executed
- Always merge delta specs before archiving — this is a hard gate, not optional
- If `changes/<name>/specs/` is empty, require explicit human confirmation that the change has no observable spec impact
- Deleting requirements or empty spec files in `.spec-driven/specs/` is allowed when applying `REMOVED` delta entries
- Do not delete the change directory manually — archive the change by running the archive command
