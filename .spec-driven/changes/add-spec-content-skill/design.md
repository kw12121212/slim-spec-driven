# Design: add-spec-content-skill

## Approach

Add the new skill as a standalone markdown skill under `skills/`. Its workflow
will target spec editing inside an existing change:

1. Identify the active change to edit
2. Read `.spec-driven/config.yaml` and `.spec-driven/specs/INDEX.md`
3. Use the index to choose candidate main spec files
4. Read only the relevant main spec files and any matching delta file already in
   `changes/<name>/specs/`
5. Decide whether the request maps to:
   - an existing spec file
   - a new file in an existing category
   - a new category with a new file
   - a modification/removal within an existing file
6. Create or edit the corresponding delta spec file while preserving format
7. Run `verify` as a final format check and repair any safe issues

Documentation and installer inventory will be updated in the same change so the
new skill is discoverable and distributed with the rest of the bundle.

## Key Decisions

- Make the skill operate on an existing change's `specs/` delta files instead of
  editing main specs directly. This keeps it aligned with the repo's workflow.
- Require `INDEX.md` to be read before any spec routing decision. That is the core
  guardrail against duplicate or misplaced specs.
- Treat removals as explicit requirement-level edits. Broad phrases like "delete
  old spec" are too ambiguous for archive-time merging and review.
- Use existing delta format sections rather than inventing a new spec authoring
  format, so the skill fits current verification rules.

## Alternatives Considered

- Fold this behavior into `spec-driven-modify` only. Rejected because spec routing
  is a specialized task with stricter rules around index-first classification.
- Add a CLI helper that classifies file paths. Rejected because the decision is
  semantic and belongs in a skill, not a filesystem-only script.
- Write directly to `.spec-driven/specs/` main specs. Rejected because active work
  should continue to flow through change delta specs first.
