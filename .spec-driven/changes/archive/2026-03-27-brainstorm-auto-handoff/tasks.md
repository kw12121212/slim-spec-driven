# Tasks: brainstorm-auto-handoff

## Implementation

- [x] Update `skills/spec-driven-auto/SKILL.md` Red tier text to suggest brainstorm instead of step-by-step
- [x] Add hand-off step to `skills/spec-driven-brainstorm/SKILL.md` asking user to enter auto or continue modifying
- [x] Update `auto-applies-complexity-gate` spec in `.spec-driven/specs/skills/lifecycle.md`
- [x] Add `brainstorm-offers-auto-handoff` spec to `.spec-driven/specs/skills/planning.md`

## Testing

- [x] `bash test/run.sh` passes (no script changes, but verify nothing breaks)

## Verification

- [x] Verify Red tier in auto skill text references brainstorm
- [x] Verify brainstorm skill ends with auto hand-off option
- [x] Verify spec changes match the skill prompt changes
