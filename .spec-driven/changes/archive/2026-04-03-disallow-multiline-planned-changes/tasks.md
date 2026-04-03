# Tasks: disallow-multiline-planned-changes

## Implementation

- [x] Update roadmap specs to require single-line planned change entries and remove multiline continuation behavior.
- [x] Update script specs so `verify-roadmap` rejects multiline planned change detail and `roadmap-status` no longer treats continuation lines as valid input.
- [x] Update roadmap planning skill specs so roadmap skills no longer read or emit multiline planned change detail blocks.
- [x] Migrate existing roadmap milestone files in this repository to single-line planned change descriptions.

## Testing

- [x] Add or update automated coverage for roadmap validation failures caused by multiline planned change entries.
- [x] Run the roadmap validation path against migrated milestone files and confirm they pass.

## Verification

- [x] Verify the delta specs describe only observable roadmap behavior changes.
- [x] Verify proposal artifacts pass `spec-driven.js verify disallow-multiline-planned-changes`.
