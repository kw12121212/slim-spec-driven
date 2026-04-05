# Delta: skills/execution.md

## MODIFIED Requirements

### Requirement: apply-blocks-on-open-questions
Previously: `spec-driven-apply` MUST check `questions.md` for open questions before implementing.
If any open questions exist, it MUST stop and require the user to resolve them first.

`spec-driven-apply` MUST check `questions.md` for open questions before
implementing. If any open `- [ ] Q:` entries exist, it MUST:

- list each unresolved question to the user
- ask the user to resolve those questions before implementation continues
- stop and wait for explicit user answers before making implementation changes

`spec-driven-apply` MAY recommend an answer or preferred option for each open
question, but it MUST present those recommendations as suggestions only. It
MUST NOT treat its own recommendation as a resolved answer, and it MUST NOT
mark the question resolved or continue implementation until the user has
explicitly confirmed the answer.

#### Scenario: apply-recommends-but-does-not-decide-open-question
- GIVEN `questions.md` contains an open implementation question
- WHEN `spec-driven-apply` inspects the change before coding
- THEN it may suggest a recommended answer
- AND it asks the user to confirm or replace that answer
- AND it does not edit implementation files or continue to the next task until
  the user explicitly resolves the question
