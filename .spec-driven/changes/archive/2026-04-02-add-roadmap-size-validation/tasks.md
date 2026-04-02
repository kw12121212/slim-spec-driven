# Tasks: add-roadmap-size-validation

## Implementation

- [x] Add roadmap delta specs covering standard milestone sections, size limits,
      and skill-level validation requirements
- [x] Add a `verify-roadmap [path]` command to `scripts/spec-driven.ts` and
      update usage text
- [x] Update roadmap skills to run roadmap validation and stop on oversize
      errors
- [x] Update README and scripts contract docs for roadmap validation

## Testing

- [x] `npm run build` passes
- [x] `bash test/run.sh` passes
- [x] Add automated coverage for a valid milestone and an oversized milestone
- [x] Validate the new roadmap skills against the skill schema if edited

## Verification

- [x] Run `node dist/scripts/spec-driven.js verify add-roadmap-size-validation`
- [x] Run `node dist/scripts/spec-driven.js verify-roadmap <temp-dir>` on both a
      valid milestone and an oversized milestone
