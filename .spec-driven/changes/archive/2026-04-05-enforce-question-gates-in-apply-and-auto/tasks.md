# Tasks: enforce-question-gates-in-apply-and-auto

## Implementation

- [x] Update `.spec-driven/specs/skills/execution.md` so the apply workflow
  explicitly lists unresolved questions, asks the user to answer them, and
  waits for explicit human resolution before implementation continues.
- [x] Update `.spec-driven/specs/skills/lifecycle.md` so the auto workflow
  explicitly reuses the same question gate, including the rule that suggested
  answers do not count as resolved answers until the user confirms them.
- [x] Update `skills/spec-driven-apply/SKILL.md` and
  `skills/spec-driven-auto/SKILL.md` so their step-by-step instructions match
  the stricter question-gate contract.

## Testing

- [x] Run the relevant automated test coverage for workflow artifacts and skill
  behavior, or add/update coverage if this repository already tests these
  prompts directly.
- [x] Run `bash test/run.sh`.

## Verification

- [x] Run `node dist/scripts/spec-driven.js verify enforce-question-gates-in-apply-and-auto`
  and confirm the proposal artifacts remain valid.
- [x] Verify the final skill wording makes it impossible for `apply` or `auto`
  to auto-resolve open questions without explicit user confirmation.
