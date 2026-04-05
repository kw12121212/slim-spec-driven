# Design: enforce-question-gates-in-apply-and-auto

## Approach

Update the execution-stage behavior contract in two places:

1. Refine the `spec-driven-apply` requirement in
   `.spec-driven/specs/skills/execution.md` so it does not just "block on open
   questions" in the abstract; it must explicitly surface the unanswered
   questions to the user and wait for a human answer before taking any
   implementation step.
2. Refine the `spec-driven-auto` lifecycle requirements in
   `.spec-driven/specs/skills/lifecycle.md` so the auto workflow inherits the
   same interaction rule during its apply stage. The auto flow may recommend an
   answer, but it cannot convert that recommendation into a resolved question
   without user confirmation.

The implementation work for the change should then align the concrete prompt
instructions in `skills/spec-driven-apply/SKILL.md` and
`skills/spec-driven-auto/SKILL.md` with those updated specs.

## Key Decisions

- **Human confirmation is mandatory for unresolved questions**
  `questions.md` exists to capture decisions that still need a person to make
  them. Execution-stage skills cannot satisfy that requirement by guessing.
- **Recommendations remain allowed**
  The workflows may still suggest the most likely answer or offer a preferred
  option. This preserves momentum while keeping the decision boundary with the
  user.
- **Apply and auto use the same question-gate semantics**
  The end-to-end auto path should not be looser than the stepwise execution
  path. Both must stop, ask, and wait when requirements are unresolved.

## Alternatives Considered

1. **Forbid recommendations entirely**
   Rejected because recommendations are useful and do not create risk if they
   are clearly presented as suggestions awaiting user confirmation.
2. **Allow auto to pick the most likely answer when confidence is high**
   Rejected because "confidence" is not a reliable workflow contract. If the
   question is open enough to remain in `questions.md`, the user must resolve
   it explicitly.
3. **Limit the change to `spec-driven-auto` only**
   Rejected because the same ambiguity exists in the desired interaction model
   for `spec-driven-apply`, and the two execution paths should remain aligned.
