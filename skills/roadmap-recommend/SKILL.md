---
name: roadmap-recommend
description: Recommend the next roadmap-backed change, then after explicit confirmation scaffold it as a normal spec-driven change.
metadata:
  skill_id: roadmap_recommend
  author: auto-spec-driven
  type: agent_skill
  version: 1.0.0
---

You are helping the user choose the next change from the roadmap and turn the
accepted recommendation into a normal spec-driven change.

## This Skill's Commands

If you cannot remember the exact command used by this skill, look it up here
before running anything. Do not guess.

```yaml
init: node {{SKILL_DIR}}/scripts/spec-driven.js init
roadmap-status: node {{SKILL_DIR}}/scripts/spec-driven.js roadmap-status
propose: node {{SKILL_DIR}}/scripts/spec-driven.js propose <name>
verify: node {{SKILL_DIR}}/scripts/spec-driven.js verify <name>
```

## Prerequisites

The `.spec-driven/` directory must exist at the **project root**. Before
proceeding, verify:
```
ls .spec-driven/
```
If this fails, the project is not initialized. Run `/spec-driven-init` first.

If `.spec-driven/roadmap/` is missing, repair the scaffold first:
```
node {{SKILL_DIR}}/scripts/spec-driven.js init
```

## Steps

1. **Read roadmap context first** — before recommending anything, read:
    - `.spec-driven/config.yaml`
    - `.spec-driven/roadmap/INDEX.md`
    - the milestone files relevant to the current phase
    - `.spec-driven/specs/INDEX.md`
    - the relevant main spec files the recommended change is likely to touch
    - `node {{SKILL_DIR}}/scripts/spec-driven.js roadmap-status`
    - the planned change entries for the candidates you are considering as
      single-line roadmap items in the canonical format
      `- \`<change-name>\` - Declared: <status> - <summary>`
    - treat milestone declared statuses as limited to `proposed`, `active`,
      `blocked`, or `complete`
    - treat planned change declared statuses as limited to `planned` or
      `complete`

    You MAY delegate bounded analysis-only work such as candidate comparison,
    roadmap-context summarization, or likely spec-path discovery to a
    sub-agent. The parent agent MUST keep the final recommendation, the user
    confirmation checkpoint, and all proposal artifact writes.

2. **Understand what the user wants optimized** — determine whether the user
   wants the next change chosen for impact, urgency, dependency order, risk
   reduction, or some other planning goal.

3. **Recommend one candidate change** — propose:
    - a kebab-case change name
    - which milestone it comes from
    - why it is the best next candidate
    - what alternatives were not chosen yet
    The recommended candidate MUST already appear under a milestone
    `## Planned Changes` section.

4. **Present a proposal checkpoint** — before creating any files, summarize:
    - the proposed change name
    - which milestone it comes from
    - the goal and scope of the recommended change
    - the main spec areas expected to change
    - why this item is the best next step
    - any unresolved questions that would go into `questions.md`

    Then ask for explicit confirmation. If the user wants revisions, continue the
    recommendation discussion and re-summarize until confirmed.

5. **Resolve open questions before scaffolding** — if any unresolved questions
   remain after the recommendation summary:
    - present each open question as a structured block with:
      - `Question`
      - `Explanation`
      - `Impact`
      - `Recommendation`
    - ask the user to answer or confirm the decision needed
    - `Explanation` must clarify why the issue is unresolved or what decision
      is still blocking the proposal
    - `Impact` must describe what part of the proposal depends on the answer
    - `Recommendation` may suggest a preferred answer, but only as a suggestion
    - do not treat your recommendation as the resolved answer
    - do not continue until the user has given an exact answer or explicit
      confirmation

6. **Scaffold the change after confirmation** — run:
   ```
   node {{SKILL_DIR}}/scripts/spec-driven.js propose <name>
   ```
   This creates `.spec-driven/changes/<name>/` with the seeded templates.

7. **Fill the five proposal artifacts** — after scaffolding, complete the same
   proposal workflow used by `/roadmap-propose`:
    - write `proposal.md` with **What**, **Why**, **Scope**, and
      **Unchanged Behavior**
    - write `design.md` with **Approach**, **Key Decisions**, and
      **Alternatives Considered**
    - populate `changes/<name>/specs/` with delta spec files aligned by path with
      the main `.spec-driven/specs/` structure
    - include mapping frontmatter in delta spec files when implementation and
      test paths are knowable from repository context
    - write `tasks.md` with atomic checklist items under `## Implementation`,
      `## Testing`, and `## Verification`
    - make `## Testing` include at least one explicit lint or validation command
      task and one explicit unit test command task when those commands are
      knowable from repository context
    - write `questions.md`, recording every unresolved point under `## Open`, or
      leave `<!-- No open questions -->` if nothing is unclear

    Use the recommended milestone context as planning input, but treat the
    selected planned change itself as a single-line roadmap item.

8. **Validate before presenting the proposal** — run:
   ```
   node {{SKILL_DIR}}/scripts/spec-driven.js verify <name>
   ```
   - Fix any safe artifact-format issues immediately and rerun `verify`
   - If only open questions remain, treat that as expected at proposal time and
     surface those questions clearly
   - If any non-question error remains, stop and report it instead of presenting
     the proposal as ready

9. **Offer the execution handoff** — show the user the generated artifacts,
   summarize the final proposed scope, list any open questions that must be
   answered before implementation, and ask whether they want to:
   - enter `/spec-driven-apply <name>` for the stepwise execution path
   - enter `/spec-driven-auto` for the end-to-end execution path
   Do not auto-enter either execution path without the user's explicit choice.

## Rules

- Do not implement code — this skill is planning only
- Use roadmap context and roadmap-status output as the basis for recommendation
- Explain why the recommended change should come next
- Recommend only work that already exists under `Planned Changes`
- Do not scaffold proposal artifacts until the user explicitly confirms the
  recommendation summary and change name
- If open questions remain, ask the user to resolve them before scaffolding
- For each open question, provide `Question`, `Explanation`, `Impact`, and
  `Recommendation`
- If testing commands are not knowable from repository context, record that as
  an open question instead of inventing commands
- Recommended answers do not count as question resolution without explicit user
  confirmation
- After confirmation, follow the same artifact-writing and validation standard as
  `/roadmap-propose`
- Do not let a sub-agent scaffold the change or own the recommendation
  checkpoint
- Keep implementation and test mappings in spec frontmatter, not in requirement
  prose
