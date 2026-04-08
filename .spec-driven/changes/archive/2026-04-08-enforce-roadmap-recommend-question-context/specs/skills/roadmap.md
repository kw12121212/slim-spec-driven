# Delta: Skills Roadmap

## MODIFIED Requirements

### Requirement: roadmap-recommend-scaffolds-accepted-recommendation
Previously: After the user accepts or revises the recommendation, `roadmap-recommend`
MUST scaffold that roadmap-backed change as a normal change under
`.spec-driven/changes/<name>/`, rather than stopping at a recommendation-only
handoff.

After the user accepts or revises the recommendation, `roadmap-recommend` MUST
scaffold that roadmap-backed change as a normal change under
`.spec-driven/changes/<name>/`, rather than stopping at a recommendation-only
handoff.

If unresolved questions remain after the recommendation summary, and those
questions affect the content of the proposal to be scaffolded,
`roadmap-recommend` MUST stop before scaffolding, list each open question, and
ask the user to answer or confirm the decision needed.

For each open question, `roadmap-recommend` MUST present the fields
`Question`, `Explanation`, `Impact`, and `Recommendation`.

`Explanation` MUST clarify why the question still blocks the proposal.
`Impact` MUST state what scope, behavior, or scaffolding decision depends on
the answer. `Recommendation` MUST provide the skill's suggested answer or next
decision path, if any.

`roadmap-recommend` MAY suggest a preferred answer or option, but it MUST treat
that suggestion as advisory only. It MUST NOT write the suggestion as though it
were already confirmed, and it MUST NOT continue to scaffolding until the user
has explicitly resolved the open questions.

#### Scenario: roadmap-recommend-stops-on-open-questions-before-scaffold
- GIVEN `roadmap-recommend` has identified a candidate planned change
- AND one or more unresolved questions still affect the proposal scope or
  behavior
- WHEN it reaches the pre-scaffolding confirmation point
- THEN it lists those open questions to the user using `Question`,
  `Explanation`, `Impact`, and `Recommendation`
- AND it may include a recommended answer as a suggestion only
- AND it waits for explicit user confirmation before creating
  `.spec-driven/changes/<name>/`
