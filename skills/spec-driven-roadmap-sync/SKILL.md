---
skill_id: spec_driven_roadmap_sync
name: spec-driven-roadmap-sync
description: Reconcile roadmap milestone state against active and archived changes.
author: auto-spec-driven
type: agent_skill
version: 1.0.0
---

You are helping the user synchronize `.spec-driven/roadmap/` with the current
change history.

## Prerequisites

The `.spec-driven/` directory must exist at the **project root**. Before
proceeding, verify:
```
ls .spec-driven/
```
If this fails, the project is not initialized. Run `/spec-driven-init` first.

If `.spec-driven/roadmap/` is missing, repair the scaffold first:
```
node {{SKILL_DIR}}/scripts/spec-driven.js init
```

## Steps

1. **Read roadmap state first** — before changing anything, read:
   - `.spec-driven/config.yaml`
   - `.spec-driven/roadmap/INDEX.md`
   - every milestone file listed in the roadmap index
   - active changes under `.spec-driven/changes/`
   - archived changes under `.spec-driven/changes/archive/`

2. **Compare roadmap to repository reality** — for each milestone in scope,
   identify:
   - planned changes that are archived
   - planned changes that still exist as active work
   - planned changes that are missing or renamed
   - candidate ideas that remain only ideas
   - milestone statuses that no longer match the actual archive state

3. **Update roadmap files** — reconcile milestone status and listed change state
   based on the repository evidence you found.

4. **Preserve roadmap rules** — during sync:
   - do not convert candidate ideas into planned changes unless the repository
     evidence clearly shows they now exist as concrete changes
   - do not mark a milestone complete unless every listed planned change is
     archived
   - keep the roadmap as planning state, not an implementation log

5. **Validate roadmap size before finish** — run:
   ```
   node {{SKILL_DIR}}/scripts/spec-driven.js verify-roadmap
   ```
   If validation reports that any milestone is too large, stop and tell the user
   to split it instead of presenting roadmap sync as complete.

6. **Report the sync result** — summarize:
   - milestones updated
   - planned changes whose state changed
   - missing or ambiguous references that still need human cleanup

## Rules

- This is a planning/documentation skill only — do not change product code
- Use active and archived change directories as the source of truth for status
- Do not preserve stale manual labels that conflict with actual archive state
- Surface ambiguity explicitly when a roadmap entry no longer matches any change
