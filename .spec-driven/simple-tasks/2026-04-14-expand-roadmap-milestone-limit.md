## Task
把技能和脚本 roadmap milestone 的 planned change 上限改为 10 条，以容纳更多内容。

## What was done
- Updated `scripts/spec-driven.ts` roadmap validation to allow up to 10 planned changes per milestone via a shared constant.
- Synced the main specs, roadmap skill instructions, `ROADMAP_GUIDE.md`, and the roadmap size test fixture to the 10-item limit.
- Rebuilt `dist/scripts/spec-driven.js` and ran the test suite.

## Spec impact
none

## Follow-up
- `npm test` still has pre-existing `install` test failures unrelated to this roadmap limit change.
