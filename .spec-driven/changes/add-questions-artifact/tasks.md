# Tasks: add-questions-artifact

## Implementation

- [ ] Update `propose()` in `scripts/spec-driven.ts` to create `questions.md` with seed content
- [ ] Update `modify()` to include `questions.md` in artifact listing
- [ ] Update `verify()` to check for open questions in `questions.md` and add errors; remove `[NEEDS CLARIFICATION]` checking
- [ ] Update `getStatus()` to check `questions.md` for open questions → "blocked" status; remove `[NEEDS CLARIFICATION]` checking
- [ ] Update `spec-driven-propose` SKILL.md: add questions.md step, remove all `[NEEDS CLARIFICATION]` references
- [ ] Update `spec-driven-apply` SKILL.md: check questions.md before implementing, remove `[NEEDS CLARIFICATION]` references
- [ ] Update `spec-driven-verify` SKILL.md: check questions.md for open questions as CRITICAL, remove `[NEEDS CLARIFICATION]` references
- [ ] Update `spec-driven-modify` SKILL.md to include questions.md as modifiable artifact
- [ ] Update `spec-driven-archive` SKILL.md to mention questions.md
- [ ] Update `spec-driven-auto` SKILL.md: integrate questions.md, remove `[NEEDS CLARIFICATION]` references
- [ ] Update CLAUDE.md to reflect questions.md as a fifth artifact

## Testing

- [ ] Rebuild (`npm run build`) and run `bash test/run.sh` — all existing tests pass
- [ ] Add tests for: propose creates questions.md, modify lists it, verify errors on open questions, verify passes when resolved, getStatus blocked on open questions
- [ ] Run full test suite — all tests pass

## Verification

- [ ] Verify implementation matches proposal
