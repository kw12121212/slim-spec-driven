# Tasks: relax-auto-complexity-gate

## Implementation

- [x] Update `skills/spec-driven-auto/SKILL.md` Step 1 complexity assessment: replace the six binary rejection criteria with the three-tier (green/yellow/red) model, including specific thresholds for each tier
- [x] Update `.spec-driven/specs/skills/lifecycle.md`: modify the `auto-applies-complexity-gate` requirement to reflect the new three-tier model (delta spec already drafted)

## Testing

- [x] Lint passes (`npm run build` succeeds with no errors)
- [x] Run full test suite (`bash test/run.sh`) — all 46 tests pass (no script changes, so tests should be unaffected)

## Verification

- [x] Verify the auto skill SKILL.md reflects the three-tier model with correct thresholds
- [x] Verify the lifecycle spec delta is consistent with the skill prompt changes
- [x] Run `node dist/scripts/spec-driven.js verify relax-auto-complexity-gate` — no errors
