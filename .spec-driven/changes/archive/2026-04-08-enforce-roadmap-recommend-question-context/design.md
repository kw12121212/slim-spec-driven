# Design: enforce-roadmap-recommend-question-context

## Approach

Refine the planning-layer contract in two places and then align the skill text
with that contract:

1. Update the `roadmap-recommend` requirements in
   `.spec-driven/specs/skills/planning.md` and
   `.spec-driven/specs/skills/roadmap.md` so the pre-scaffolding question gate
   requires a structured user-facing format for every unresolved item.
2. Update `skills/roadmap-recommend/SKILL.md` so its open-question step tells
   the AI to present each issue as `Question`, `Explanation`, `Impact`, and
   `Recommendation`, then wait for explicit user resolution before running
   `propose <name>`.

This change stays entirely in the planning layer. It does not change CLI
behavior or proposal artifact formats; it only tightens how the skill explains
blocking ambiguity before scaffolding.

## Key Decisions

- **Limit the change to open questions before scaffolding**
  The user asked only for the recommendation-stage open-question path, not
  `verify` failures or later blockers.
- **Make the structure explicit and mandatory**
  Requiring the four user-visible fields keeps the behavior enforceable and
  prevents the skill from regressing to a bare question list.
- **Keep recommendation separate from resolution**
  `Recommendation` should help the user decide faster, but it must remain a
  suggestion until the user explicitly confirms it.

## Alternatives Considered

1. **Require only `Explanation` and `Impact`**
   Rejected because the user explicitly wants a suggestion as part of the
   missing context, and that recommendation is useful at the decision point.
2. **Apply the same structure to all blocking outputs**
   Rejected because it broadens scope beyond the requested open-question stage
   inside `roadmap-recommend`.
3. **Leave the structure flexible instead of naming exact fields**
   Rejected because a soft expectation is harder to verify and easier to omit
   in future prompt edits.
