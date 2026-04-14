---
name: spec-driven-modify
description: Modify an existing spec-driven change artifact (proposal.md, specs/ delta files, design.md, tasks.md, or questions.md). Preserves completed task state.
metadata:
  skill_id: spec_driven_modify
  author: auto-spec-driven
  type: agent_skill
  version: 1.0.0
---

You are helping the user modify an existing spec-driven change artifact.

## This Skill's Commands

If you cannot remember the exact command used by this skill, look it up here
before running anything. Do not guess.

```yaml
modify: node {{SKILL_DIR}}/scripts/spec-driven.js modify
verify: node {{SKILL_DIR}}/scripts/spec-driven.js verify <name>
```

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
      Mirror the main spec path exactly. For example,
      `.spec-driven/specs/skills/planning.md` maps to
      `.spec-driven/changes/<name>/specs/skills/planning.md`.

      Use this canonical sample as the format target:

      ```markdown
      ---
      mapping:
        implementation:
          - path/to/implementation.ts
        tests:
          - test/path/to/test.ts
      ---

      ## ADDED Requirements

      ### Requirement: new-capability
      The system MUST provide <observable behavior>.

      #### Scenario: success
      - GIVEN <precondition>
      - WHEN <action>
      - THEN <result>

      ## MODIFIED Requirements

      ### Requirement: existing-capability
      Previously: The system MUST <old behavior>.
      The system MUST <new behavior>.

      ## REMOVED Requirements

      ### Requirement: old-capability
      Reason: This behavior is removed because <reason>.
      ```

      Omit sections that do not apply instead of leaving empty placeholders. If
      the change has no observable spec impact, leave `changes/<name>/specs/`
      empty rather than creating a prose-only delta file. Do not invent mapping
      paths when the related implementation or test files are unclear.
    - For `tasks.md`: **preserve all `- [x]` completed task state** — only add, remove, or reword `- [ ]` incomplete tasks unless the user explicitly asks to change completed ones
    - For `questions.md`: add new questions under `## Open`, or move questions to `## Resolved` with an `A:` answer line when the human provides answers

5. **Show a summary** — briefly describe what changed across all modified files and confirm with the user.

6. **Validate after editing** — run:
   ```
   node {{SKILL_DIR}}/scripts/spec-driven.js verify <name>
   ```
   - Fix any safe format issues immediately and rerun `verify`
   - If `verify` reports only non-format workflow blockers such as open questions
     in `questions.md`, surface those separately instead of misreporting them as
     spec-format failures
   - If unresolved format or structure errors remain, report them clearly to the
     user
   - Do not finish without this check

## Rules
- Never uncheck a completed task (`- [x]`) unless the user explicitly asks
- Don't restructure a file wholesale when a targeted edit is sufficient
- Keep the same heading structure unless changing structure is the explicit goal
- One change request may span multiple files — edit all relevant artifacts together
- When editing `specs/`, follow `.spec-driven/config.yaml` rules and keep each delta file aligned with the corresponding main spec file
