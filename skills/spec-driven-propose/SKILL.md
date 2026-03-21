---
name: spec-driven-propose
description: Propose a new spec-driven change. Scaffolds proposal.md, design.md, and tasks.md for a named change, populated with project context.
version: 0.1.0
---

You are helping the user create a new spec-driven change proposal.

## Steps

1. **Get the change name** — ask the user for a short kebab-case name describing the change (e.g. `add-auth`, `refactor-db-layer`). If they already provided one, use it.

2. **Read project context** — read `.spec-driven/config.yaml` if it exists. Use the `context` field to inform the content you generate. If it doesn't exist, note that and proceed with what you know from the codebase.

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

6. **Fill tasks.md** — write a concrete implementation checklist:
   - Use `- [ ]` checkboxes for every task
   - Tasks should be independently completable
   - Group tasks logically (e.g. Implementation, Tests, Docs, Verification)
   - Include a final task: `- [ ] Update specs in .spec-driven/specs/ if behavior changed`

7. **Confirm** — show the user the three files and ask if they want to adjust anything.

## Rules
- Do not implement anything — this is planning only
- Keep tasks atomic and verifiable
- proposal.md describes *what and why*; design.md describes *how*; tasks.md is the checklist
