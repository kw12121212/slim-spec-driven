# enforce-question-gates-in-apply-and-auto

## What

Tighten the question-gate behavior for both `spec-driven-apply` and
`spec-driven-auto`.

When either execution path finds unresolved `- [ ] Q:` entries in
`questions.md`, it must stop and ask the user for resolution before any further
implementation work continues. The workflow may recommend an answer, but it may
not silently decide, auto-resolve the question, or continue as though the
recommendation had already been approved.

## Why

The current workflow contract already says that open questions block
implementation, but that rule is not explicit enough about the required user
interaction. In practice, the auto flow can interpret "resolve before
continuing" as permission to choose an answer itself and move on.

That behavior breaks the purpose of `questions.md`: unresolved requirements are
supposed to be settled by a human before code is written. The execution skills
need a stricter contract so they stop, surface the open questions, and wait for
an explicit human answer even when they can suggest a likely resolution.

## Scope

**In scope:**
- Clarify the `spec-driven-apply` execution contract so open questions require
  asking the user and waiting for an explicit answer before implementation
  continues
- Clarify the `spec-driven-auto` lifecycle contract so it reuses the same
  question gate and may only continue after user confirmation
- Allow both workflows to recommend candidate answers while making clear that a
  recommendation is not equivalent to a resolved answer
- Update the `skills/spec-driven-apply/SKILL.md` and
  `skills/spec-driven-auto/SKILL.md` instructions to match the refined contract
- Add or update automated coverage for the stricter question-gate behavior if
  the repository already exercises these workflow prompts or artifacts in tests

**Out of scope:**
- Changing the CLI `spec-driven.js apply` or `verify` artifact mechanics
- Redesigning the `questions.md` file format
- Changing archive or review behavior beyond the existing open-question blockers

## Unchanged Behavior

Behaviors that must not change as a result of this change (leave blank if nothing is at risk):
- Open questions remain a blocker for implementation and verification
- `questions.md` remains the single artifact used to track unresolved workflow
  ambiguity
- `spec-driven-auto` still may recommend answers or next steps when blocked;
  the only change is that it must wait for explicit human confirmation before
  proceeding
