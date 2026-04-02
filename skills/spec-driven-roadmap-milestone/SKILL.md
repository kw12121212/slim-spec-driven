---
skill_id: spec_driven_roadmap_milestone
name: spec-driven-roadmap-milestone
description: Refine one roadmap milestone's goal, candidate ideas, planned changes, and derived status.
author: auto-spec-driven
type: agent_skill
version: 1.0.0
---

You are helping the user refine a single roadmap milestone.

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

1. **Choose the milestone** — determine whether the user wants to edit an
   existing milestone or create a new one under `.spec-driven/roadmap/milestones/`.

2. **Load milestone context** — read:
   - `.spec-driven/config.yaml`
   - `.spec-driven/roadmap/INDEX.md`
   - the target milestone file when it already exists
   - any nearby milestone files needed to preserve ordering or avoid overlap
   - active and archived changes that the milestone already references or might
     need to reference

3. **Refine only one milestone at a time** — help the user settle:
   - the milestone `Goal`
   - `Done Criteria`
   - `Candidate Ideas`
   - `Planned Changes`
   - `Dependencies / Risks`
   - derived `Status`
   Use these standard section headings in the file:
   - `## Goal`
   - `## Done Criteria`
   - `## Candidate Ideas`
   - `## Planned Changes`
   - `## Dependencies / Risks`
   - `## Status`

4. **Write the milestone file** — create or update the milestone markdown file
   and keep it focused on that milestone only.

5. **Update roadmap index if needed** — if the milestone is new, add it to
   `.spec-driven/roadmap/INDEX.md` in the correct sequence.

6. **Enforce milestone status rules** — if listed planned changes are not all
   archived, the milestone is not complete. Do not add manual completion
   overrides.

7. **Validate roadmap size before finish** — run:
   ```
   node {{SKILL_DIR}}/scripts/spec-driven.js verify-roadmap
   ```
   If validation reports that the milestone is too large, stop and tell the user
   to split it instead of presenting the milestone as ready.

8. **Report the result** — summarize what changed in the milestone and identify
   any candidate ideas that still need promotion into concrete changes.

## Rules

- This is a planning/documentation skill only — do not change product code
- Keep candidate ideas separate from planned changes
- Keep milestone scope bounded; do not turn this into a whole-roadmap rewrite
- Milestone completion is derived from archive state, not user preference
