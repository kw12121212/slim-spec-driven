# Delta: skills/lifecycle.md

## MODIFIED Requirements

### Requirement: auto-reuses-stepwise-gates
Previously: `spec-driven-auto` MUST preserve the same blockers as the stepwise workflow:
proposal confirmation, open-question resolution before implementation, verification
blockers before review, and empty-delta confirmation before archive.

`spec-driven-auto` MUST preserve the same blockers as the stepwise workflow:
proposal confirmation, open-question resolution before implementation,
verification blockers before review, and empty-delta confirmation before
archive.

When the auto workflow encounters open `- [ ] Q:` entries before or during its
apply stage, it MUST reuse the `spec-driven-apply` question gate exactly:

- list each unresolved question to the user
- ask the user to answer or confirm the decision needed
- stop and wait for explicit user confirmation before implementation continues

`spec-driven-auto` MAY recommend an answer or preferred option, but it MUST
present that recommendation as a suggestion only. It MUST NOT auto-resolve the
question, write the recommendation into `questions.md` as though it were
confirmed, or proceed with implementation until the user has explicitly
confirmed the resolution.

#### Scenario: auto-stops-on-open-questions-even-with-recommendation
- GIVEN `spec-driven-auto` reaches its apply stage with one or more open
  questions in `questions.md`
- WHEN it identifies a likely recommended answer
- THEN it surfaces the open questions and that recommendation to the user
- AND it waits for explicit user confirmation instead of continuing
- AND it does not treat the recommendation itself as question resolution
