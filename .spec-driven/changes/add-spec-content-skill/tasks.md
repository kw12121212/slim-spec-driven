# Tasks: add-spec-content-skill

## Implementation

- [x] Add delta specs describing the new `spec-driven-spec-content` planning behavior
- [x] Create `skills/spec-driven-spec-content/SKILL.md` with index-first routing, explicit removal handling, and final spec verification
- [x] Update `install.sh` to distribute `spec-driven-spec-content`
- [x] Update repository docs/metadata to include the new skill and describe its purpose

## Testing

- [x] Run `node dist/scripts/spec-driven.js verify add-spec-content-skill`
- [x] Run an installer smoke check that confirms `spec-driven-spec-content` is installed into a target skill directory

## Verification

- [x] Verify the new skill instructions match the proposal and delta specs
