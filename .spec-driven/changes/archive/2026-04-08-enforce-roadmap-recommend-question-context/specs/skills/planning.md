# Delta: Skills Planning

## MODIFIED Requirements

### Requirement: roadmap-recommend-confirms-before-scaffolding
Previously: `roadmap-recommend` MUST recommend a candidate change name and explain the
reasoning, summarize the intended roadmap-backed change, and wait for the user
to accept or modify the recommendation before it scaffolds proposal artifacts.

`roadmap-recommend` MUST recommend a candidate change name and explain the
reasoning, summarize the intended roadmap-backed change, and wait for the user
to accept or modify the recommendation before it scaffolds proposal artifacts.

If the recommendation discussion reveals one or more open questions that affect
scope, behavior, or other proposal-shaping decisions, `roadmap-recommend` MUST
surface those questions and obtain explicit user answers or confirmation before
it scaffolds proposal artifacts.

For each such open question, `roadmap-recommend` MUST present a structured
user-facing block with the fields `Question`, `Explanation`, `Impact`, and
`Recommendation`.

`Explanation` MUST clarify why the issue is unresolved or why the skill cannot
finish shaping the proposal without a user decision. `Impact` MUST describe
what part of the proposal scope, behavior, or next step depends on that answer.
`Recommendation` MUST state the skill's suggested resolution, if any.

`roadmap-recommend` MAY recommend a preferred answer, but it MUST present that
recommendation as a suggestion only. It MUST NOT treat its own recommendation as
the resolved answer or continue to scaffolding until the user has explicitly
confirmed the resolution.
