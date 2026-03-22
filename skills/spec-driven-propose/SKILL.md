---
name: spec-driven-propose
description: Propose a new spec-driven change. Scaffolds proposal.md, design.md, and tasks.md for a named change, populated with project context.
version: 0.1.0
---

You are helping the user create a new spec-driven change proposal.

## Steps

1. **Get the change name** — ask the user for a short kebab-case name describing the change (e.g. `add-auth`, `refactor-db-layer`). If they already provided one, use it.

2. **Read project context** — read `.spec-driven/config.yaml` if it exists. Use the `context` field to inform the content you generate. If a `rules` field exists, apply those rules when filling the artifacts: `rules.tasks` constrains how tasks.md is written; `rules.specs` constrains how specs and proposals describe behavior. If config.yaml doesn't exist, note that and proceed with what you know from the codebase.

3. **Scaffold the change** — run:
   ```
   node {{SKILL_DIR}}/scripts/spec-driven.js propose <name>
   ```
   This creates `.spec-driven/changes/<name>/` with empty seed files.

4. **Fill proposal.md** — write a clear, concise proposal covering:
   - **What**: What the change does (observable behavior, not implementation)
   - **Why**: Motivation and context
   - **Scope**: What is in scope, what is explicitly out of scope

5. **Fill design.md** — write the technical approach:
   - **Approach**: How you'll implement it at a high level
   - **Key Decisions**: Significant choices and their rationale
   - **Alternatives Considered**: What was ruled out and why

6. **Fill specs/delta.md** — describe the spec impact of this change using the standard format:
   - Each requirement uses a `### Requirement: <name>` heading and RFC 2119 keywords (MUST/SHOULD/MAY)
   - Add `#### Scenario:` blocks (GIVEN/WHEN/THEN) for behaviors that benefit from examples
   - **ADDED**: new observable behaviors; **MODIFIED**: changed requirements (include `Previously:` note); **REMOVED**: behaviors that no longer apply (include reason)
   - Leave a section empty if it does not apply — do not add placeholder text
   - If this change has no observable spec impact, write a brief note explaining why under `## ADDED Requirements`

7. **Fill tasks.md** — write a concrete implementation checklist:
   - Use `- [ ]` checkboxes for every task
   - Tasks should be independently completable
   - Group tasks logically (e.g. Implementation, Tests, Docs, Verification)
   - Do NOT add an "Update specs" task — specs/delta.md is the spec artifact

8. **Confirm** — show the user the four files and ask if they want to adjust anything.

## Rules
- Do not implement anything — this is planning only
- Keep tasks atomic and verifiable
- proposal.md describes *what and why*; design.md describes *how*; tasks.md is the checklist
