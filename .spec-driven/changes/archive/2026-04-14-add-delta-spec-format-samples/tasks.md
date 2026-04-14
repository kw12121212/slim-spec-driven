# Tasks: add-delta-spec-format-samples

## Implementation

- [x] Add a planning delta spec requiring proposal-authoring skills to provide a copyable canonical delta spec sample and requiring the repo README to document the same delta format.
- [x] Update `skills/spec-driven-propose/SKILL.md`, `skills/spec-driven-brainstorm/SKILL.md`, `skills/spec-driven-modify/SKILL.md`, `skills/roadmap-propose/SKILL.md`, and `skills/roadmap-recommend/SKILL.md` to embed the canonical delta spec example and related formatting guidance.
- [x] Update `.spec-driven/specs/README.md` with a dedicated delta spec section that shows the canonical ADDED/MODIFIED/REMOVED example and explains `Previously:` and removal reasons.
- [x] Add or update regression coverage that catches missing canonical delta spec guidance where practical.
- [x] Remove `install.sh`-specific coverage from `test/run.js` so the repository unit test command no longer depends on installer behavior.

## Testing

- [x] Run `npm run validate-skills`.
- [x] Run the unit test command `npm test` after removing the `install.sh`-specific test section.

## Verification

- [x] Verify the updated skills and `.spec-driven/specs/README.md` present the same canonical delta spec structure and do not weaken existing proposal workflow behavior.
