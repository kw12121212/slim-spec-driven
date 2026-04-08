---
skill_id: spec_driven_brainstorm
name: spec-driven-brainstorm
description: Turn a rough idea into a spec-driven change proposal by reading context, deriving scope and a change name, and generating the same five proposal artifacts as spec-driven-propose without a proposal-stage question loop.
author: auto-spec-driven
type: agent_skill
version: 1.0.0
---

You are helping the user turn an early-stage idea into a spec-driven change
proposal.

Do not ask follow-up questions or require explicit confirmation during the
proposal stage. Infer the best available scope from the user request, project
context, and existing specs. Record any unresolved ambiguity in `questions.md`
for `/spec-driven-apply` to surface before implementation begins.

## Prerequisites

The `.spec-driven/` directory must exist at the **project root**. Before
proceeding, verify:
```
ls .spec-driven/
```
If this fails, the project is not initialized. Run `/spec-driven-init` first.

## Steps

1. **Start from the idea, not the artifact list** — infer what the user wants
   to achieve, what problem they are trying to solve, and any likely constraints
   or preferences from the request and repository context. Do not require a
   change name up front, and do not stop to ask follow-up questions.

2. **Read project context and existing specs early** — before narrowing scope,
   read:
   - `.spec-driven/config.yaml` — use `context` as project background and treat
     `rules` as binding constraints
   - `.spec-driven/specs/INDEX.md` — identify existing spec areas that may
     already cover the requested behavior
   - Every relevant main spec file referenced by `INDEX.md` that appears related
     to the idea being discussed

3. **Brainstorm until the change is decision-ready** — use the available
   request and repository context to converge on:
   - the desired outcome and user-visible behavior
   - what is in scope and explicitly out of scope
   - important tradeoffs, constraints, risks, and unchanged behavior
   - which existing spec files will likely be modified, or whether a new spec
     area is needed
   - any questions that still need a human answer before implementation, which
     should be recorded in `questions.md` instead of blocking proposal creation

4. **Derive the change name** — once the idea is coherent enough, choose a short
   kebab-case change name. If the user already provided a valid name, keep it.
   Otherwise, decide one yourself based on the proposal scope.

5. **Proceed directly once coherent** — once the scope is coherent enough from
   available context, continue straight to scaffolding. Do not add a
   pre-scaffolding confirmation gate; unresolved items belong in
   `questions.md` for `/spec-driven-apply`.

6. **Scaffold the change** — run:
   ```
   node {{SKILL_DIR}}/scripts/spec-driven.js propose <name>
   ```
   This creates `.spec-driven/changes/<name>/` with the seeded templates.

7. **Fill the five proposal artifacts** — after scaffolding, complete the same
   proposal workflow used by `/spec-driven-propose`:
   - write `proposal.md` with **What**, **Why**, **Scope**, and
     **Unchanged Behavior**
   - write `design.md` with **Approach**, **Key Decisions**, and
     **Alternatives Considered**
   - populate `changes/<name>/specs/` with delta spec files aligned by path with
     the main `.spec-driven/specs/` structure
   - write `tasks.md` with atomic checklist items under `## Implementation`,
     `## Testing`, and `## Verification`
   - make `## Testing` include at least one explicit lint or validation command
     task and one explicit unit test command task when those commands are
     knowable from repository context
   - write `questions.md`, recording every unresolved point under `## Open`, or
     leave `<!-- No open questions -->` if nothing is unclear

8. **Validate before presenting the proposal** — run:
   ```
   node {{SKILL_DIR}}/scripts/spec-driven.js verify <name>
   ```
   - Fix any safe artifact-format issues immediately and rerun `verify`
   - If only open questions remain, treat that as expected at proposal time and
     surface those questions clearly
   - If any non-question error remains, stop and report it instead of presenting
     the proposal as ready

9. **Hand off like propose** — show the user the generated artifacts, summarize
   the final proposed scope, and list any open questions that must be answered
   before `/spec-driven-apply`. Do not ask for proposal-stage confirmation.

10. **Mention next steps** — after the hand-off, mention that the user can enter
    `/spec-driven-auto` to execute the proposal end-to-end or use
    `/spec-driven-modify` to revise the artifacts. Do not auto-enter either path.

## Rules

- Do not implement code — this skill is planning only
- Do not ask follow-up questions or require pre-scaffolding confirmation during
  the proposal stage
- Read `.spec-driven/config.yaml`, `INDEX.md`, and relevant main specs before
  locking scope or writing delta specs
- Derive a kebab-case change name when the user starts with only a rough idea
- Record unresolved ambiguity in `questions.md`; do not guess silently
- If testing commands are not knowable from repository context, record that in
  `questions.md` instead of inventing them
- Follow the same artifact-writing and validation standard as
  `/spec-driven-propose`
