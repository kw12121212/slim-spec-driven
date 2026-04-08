# Tasks: enforce-roadmap-recommend-question-context

## Implementation

- [x] Update `.spec-driven/specs/skills/planning.md` so
  `roadmap-recommend` must present each pre-scaffolding open question using the
  fields `Question`, `Explanation`, `Impact`, and `Recommendation`.
- [x] Update `.spec-driven/specs/skills/roadmap.md` so the roadmap-specific
  `roadmap-recommend` requirement and scenario require the same structured
  open-question output before scaffolding.
- [x] Update `skills/roadmap-recommend/SKILL.md` so its open-question step
  explicitly instructs the AI to provide `Question`, `Explanation`, `Impact`,
  and `Recommendation` for each unresolved item while keeping
  `Recommendation` advisory only.

## Testing

- [x] Run `npm run validate-skills -- skills/roadmap-recommend/SKILL.md` to
  confirm the updated skill file still passes repository validation.
- [x] Run `npm test` to confirm the existing unit tests still pass.

## Verification

- [x] Run `node dist/scripts/spec-driven.js verify enforce-roadmap-recommend-question-context`.
- [x] Verify the final `roadmap-recommend` wording makes the four-field open
  question structure mandatory before scaffolding.
