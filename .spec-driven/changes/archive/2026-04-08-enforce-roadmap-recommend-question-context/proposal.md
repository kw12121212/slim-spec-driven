# enforce-roadmap-recommend-question-context

## What

Require `roadmap-recommend` to provide structured context for every
pre-scaffolding open question.

When the skill reaches the open-question checkpoint before scaffolding, it must
present each unresolved item using the user-facing structure `Question`,
`Explanation`, `Impact`, and `Recommendation` rather than listing only the
question text.

## Why

The current roadmap recommendation flow can stop on open questions, but the
question prompt itself is too thin. When the skill only asks the raw question,
the user has to infer why the issue matters, what decision it blocks, and what
default path the skill thinks is most reasonable.

That makes the recommendation handoff weaker than it needs to be. For roadmap
planning, the skill should explain the ambiguity, describe the consequence of
leaving it unresolved, and offer a suggested answer while still waiting for
explicit user confirmation.

## Scope

**In scope:**
- Update the roadmap recommendation contract so each open question must include
  `Question`, `Explanation`, `Impact`, and `Recommendation`
- Keep this requirement limited to the pre-scaffolding open-question step in
  `roadmap-recommend`
- Update the `roadmap-recommend` skill instructions to match the stricter
  structured question format

**Out of scope:**
- Changing `verify` output or other post-scaffolding blockers
- Changing `roadmap-propose` or other planning skills
- Changing CLI scaffold, validation, or `questions.md` artifact mechanics

## Unchanged Behavior

Behaviors that must not change as a result of this change (leave blank if nothing is at risk):
- `roadmap-recommend` still stops before scaffolding when proposal-shaping
  questions remain unresolved
- Recommended answers remain advisory only and do not count as confirmed user
  decisions
- The skill remains planning-only and still recommends work that already exists
  under a roadmap milestone `## Planned Changes` section
