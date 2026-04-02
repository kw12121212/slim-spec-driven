# Tasks: standardize-index-and-roadmap-format

## Implementation

- [x] Update roadmap delta specs to define canonical formats for
  `.spec-driven/roadmap/INDEX.md` and milestone `## Status`
- [x] Update scripts delta specs to define canonical generation and validation
  behavior for `specs/INDEX.md`, `roadmap/INDEX.md`, and roadmap status parsing
- [x] Update lifecycle delta specs to require archive-time roadmap state
  reconciliation after a change moves to archive
- [x] Review the proposal artifacts for consistency between roadmap and script
  requirements

## Testing

- [x] Run `node dist/scripts/spec-driven.js verify standardize-index-and-roadmap-format`
- [x] Confirm no open questions remain in `questions.md`

## Verification

- [x] Verify the proposal keeps existing roadmap workflow semantics while
  tightening only the file-format contracts
