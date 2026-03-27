---
skill_id: spec_driven_modify
name: spec-driven-modify
description: Modify an existing spec-driven change artifact (proposal.md, specs/ delta files, design.md, tasks.md, or questions.md). Preserves completed task state.
author: auto-spec-driven
type: agent_skill
version: 1.0.0
---

You are helping the user modify an existing spec-driven change artifact.

## Prerequisites

The `.spec-driven/` directory must exist at the **project root**. Before proceeding, verify:
```
ls .spec-driven/
```
If this fails, the project is not initialized. Run `/spec-driven-init` first.

## Steps

1. **Select the change** — run `node {{SKILL_DIR}}/scripts/spec-driven.js modify` to list active changes. Ask the user which change they want to modify. If they already specified one, use it.

2. **Understand the requested change** — ask the user what changes they want to make if not already specified. Focus on the *content* of the change, not which files to edit.

3. **Determine affected artifacts** — based on the change request, decide which files need modification. A single change may affect multiple artifacts:
   - `proposal.md` — scope, goals, or requirements changes
   - `specs/` — delta specs describing observable behavior changes, mirroring `.spec-driven/specs/` by file path
   - `design.md` — implementation approach or architecture decisions
   - `tasks.md` — task breakdown, additions, or removals
   - `questions.md` — new questions or resolved answers

   Read all relevant artifact files before making changes.
   - If the request affects `specs/`, also read `.spec-driven/config.yaml`, `.spec-driven/specs/INDEX.md`, and each relevant main spec file before editing.

4. **Apply modifications**:
   - For `proposal.md` and `design.md`: edit freely
   - For `specs/`: preserve the delta spec format. Keep the matching file path under `changes/<name>/specs/`, use `## ADDED Requirements`, `## MODIFIED Requirements`, and `## REMOVED Requirements` section markers as needed, and keep `### Requirement:` headings intact. Write observable behavior only — do not turn specs into implementation notes, architecture details, or API design docs.
   - For `tasks.md`: **preserve all `- [x]` completed task state** — only add, remove, or reword `- [ ]` incomplete tasks unless the user explicitly asks to change completed ones
   - For `questions.md`: add new questions under `## Open`, or move questions to `## Resolved` with an `A:` answer line when the human provides answers

5. **Show a summary** — briefly describe what changed across all modified files and confirm with the user.

## Rules
- Never uncheck a completed task (`- [x]`) unless the user explicitly asks
- Don't restructure a file wholesale when a targeted edit is sufficient
- Keep the same heading structure unless changing structure is the explicit goal
- One change request may span multiple files — edit all relevant artifacts together
- When editing `specs/`, follow `.spec-driven/config.yaml` rules and keep each delta file aligned with the corresponding main spec file
