# Tasks: sync-roadmap-on-archive

## Implementation

- [x] Update lifecycle delta specs so archive responsibility split matches the
  current CLI archive closeout and `spec-driven-auto` is required to reuse that
  closeout
- [x] Update scripts delta specs to document archive-time roadmap milestone and
  roadmap index reconciliation
- [x] Update `skills/spec-driven-archive/SKILL.md` to include roadmap-aware
  archive closeout and corrected script/AI responsibilities
- [x] Update `skills/spec-driven-auto/SKILL.md` so its archive step reports the
  same roadmap-aware closeout behavior

## Testing

- [x] Run `node dist/scripts/spec-driven.js verify sync-roadmap-on-archive`
- [x] Run `bash test/run.sh`

## Verification

- [x] Verify the updated skill text matches the documented archive behavior and
  existing CLI roadmap reconciliation semantics
