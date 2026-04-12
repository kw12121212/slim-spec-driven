---
name: spec-driven-propose
description: Propose a new spec-driven change. Scaffolds proposal.md, specs/ delta files, design.md, tasks.md, and questions.md for a named change, populated with project context.
metadata:
  skill_id: spec_driven_propose
  author: auto-spec-driven
  type: agent_skill
  version: 1.0.0
---

You are helping the user create a new spec-driven change proposal.

Do not ask follow-up questions or require confirmation during the proposal stage.
Derive the strongest proposal you can from the user request, project context, and
existing specs. Record any remaining ambiguity in `questions.md` for
`/spec-driven-apply` to surface before implementation begins.

## This Skill's Commands

If you cannot remember the exact command used by this skill, look it up here
before running anything. Do not guess.

```yaml
propose: node {{SKILL_DIR}}/scripts/spec-driven.js propose <name>
verify: node {{SKILL_DIR}}/scripts/spec-driven.js verify <name>
```

## Prerequisites

The `.spec-driven/` directory must exist at the **project root**. Before proceeding, verify:
```
ls .spec-driven/
```
If this fails, the project is not initialized. Run `/spec-driven-init` first.

## Steps

1. **Determine the change name** — use the user-provided kebab-case name when one is already available. Otherwise, derive a short kebab-case name from the request and the proposal scope yourself instead of stopping to ask for one.

2. **Read project context and existing specs** — read the following before generating anything:
   - `.spec-driven/config.yaml` — use `context` to inform content; treat `rules` as binding constraints; note any `fileMatch` entries that apply to files this change will touch
   - `.spec-driven/specs/INDEX.md` — identifies all existing spec files and their scope
   - Every spec file referenced in INDEX.md that this change is likely to touch — read the full content to understand existing requirements before writing MODIFIED or ADDED entries

3. **Scaffold the change** — run:
   ```
   node {{SKILL_DIR}}/scripts/spec-driven.js propose <name>
   ```
   This creates `.spec-driven/changes/<name>/` with seeded artifact templates.

4. **Fill proposal.md** — write a clear, concise proposal covering:
   - **What**: What the change does (observable behavior, not implementation)
   - **Why**: Motivation and context
   - **Scope**: What is in scope, what is explicitly out of scope
   - **Unchanged Behavior**: List existing behaviors that must not break — things adjacent to or potentially affected by this change. Leave blank if truly nothing is at risk.

5. **Fill design.md** — write the technical approach:
   - **Approach**: How you'll implement it at a high level
   - **Key Decisions**: Significant choices and their rationale
   - **Alternatives Considered**: What was ruled out and why

6. **Populate specs/ delta files** — look at the project's `.spec-driven/specs/` directory structure. For each spec file that this change touches, create a corresponding file under `.spec-driven/changes/<name>/specs/` mirroring the same relative path (e.g. `specs/auth/login.md` → `changes/<name>/specs/auth/login.md`). If the change introduces a new spec area, create the new relative path that should exist under `.spec-driven/specs/` after archive.

   Each delta file uses ADDED/MODIFIED/REMOVED sections with the standard format:
   - YAML frontmatter with `mapping.implementation` and `mapping.tests` when
     related files are knowable from repository context
   - `### Requirement: <name>` headings and RFC 2119 keywords (MUST/SHOULD/MAY)
   - `#### Scenario:` blocks (GIVEN/WHEN/THEN) where helpful
   - **ADDED**: new requirements; **MODIFIED**: changed requirements (include `Previously:` note); **REMOVED**: removed requirements (include reason)
   - Omit sections that don't apply — do not leave empty sections
   - If this change has no observable spec impact, leave `changes/<name>/specs/` empty — do not create a prose-only file that breaks the delta spec format
   - Do not invent mapping paths when the related implementation or test files
     are not clear; leave mapping completion to `/spec-driven-apply`

7. **Fill tasks.md** — write a concrete implementation checklist:
   - Use `- [ ]` checkboxes for every task
   - Tasks should be independently completable
   - Group under three sections: `## Implementation`, `## Testing`, `## Verification`
   - `## Testing` MUST include at least one lint or validation task and one unit test task appropriate to the project's tech stack
   - Each required testing task MUST name an explicit runnable command such as `npm run lint`, `npm run build`, or `npm test`
   - If the relevant command cannot be determined confidently from repository context, add an open question to `questions.md` instead of guessing
   - Do NOT add an "Update specs" task — the specs/ directory contains the spec artifacts

8. **Fill questions.md** — document any open questions or ambiguities:
   - For every unclear point (motivation, scope boundaries, technical approach, etc.), add an entry under `## Open`:
     ```
     - [ ] Q: <specific question>
       Context: <why this matters / what depends on the answer>
     ```
   - If everything is clear, leave `## Open` empty with a note: `<!-- No open questions -->`
   - Do NOT use `[NEEDS CLARIFICATION]` inline markers in any artifact — questions.md is the single place for all open questions

9. **Validate artifact format** — run:
   ```
   node {{SKILL_DIR}}/scripts/spec-driven.js verify <name>
   ```
   Treat this as a final structure and format check before presenting the proposal.
   - If it reports missing artifacts, malformed delta spec sections/headings, or unfilled placeholders you can safely fix, fix them immediately and rerun `verify`
   - If `verify` still reports a format or structure problem you cannot confidently repair, stop and report the issue to the user
   - If the only remaining error is open questions in `questions.md`, treat that as expected at proposal time and surface those questions clearly to the user

10. **Hand off** — show the user the five files and summarize the scope, key decisions, and any open questions. Do not require a confirmation checkpoint after writing the proposal. If `questions.md` has open questions, make clear that `/spec-driven-apply` will surface them as an implementation blocker and require explicit user resolution before coding starts, and mention `/spec-driven-modify` only as an optional revision path.

## Rules
- Do not implement anything — this is planning only
- Keep tasks atomic and verifiable
- Do not ask follow-up questions or require a proposal-stage confirmation checkpoint
- proposal.md describes *what and why*; design.md describes *how*; tasks.md is the checklist; questions.md is for open questions
- Document ambiguities in questions.md — never guess at unclear requirements, and never use `[NEEDS CLARIFICATION]` inline markers
- Do not add a post-proposal confirmation gate once the artifacts are written
- Open questions are allowed at proposal handoff time; leave them in `questions.md` for `/spec-driven-apply` to surface and block on
- Before finishing, rerun `verify` until all repairable format issues are fixed; if any non-question error remains, report it to the user
- Keep spec-code mappings in frontmatter, not in requirement prose
