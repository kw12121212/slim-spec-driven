# add-spec-content-skill

## What

Add a new `spec-driven-spec-content` skill that routes requested spec content into
the correct delta spec file for an active change. The skill reads
`.spec-driven/specs/INDEX.md` first, then relevant main spec files, and decides
whether the request belongs in an existing category/file, a new file under an
existing category, or a brand new category. It also supports modifying and
removing existing requirements.

## Why

Spec authoring currently assumes the agent already knows where a new requirement
belongs. In practice, that is fragile: agents can invent duplicate files, place
requirements under the wrong category, or modify the wrong spec file when similar
topics already exist. A dedicated routing skill makes spec placement explicit and
forces the agent to use the index and existing specs as the source of truth before
editing change delta files.

## Scope

In scope:
- Add `skills/spec-driven-spec-content/SKILL.md`
- Define that the skill must read `INDEX.md` before choosing category and file name
- Define that the skill may create a new category/file only after checking existing
  categories and files
- Define that the skill may append to an existing spec, create a new spec file,
  modify an existing requirement, or remove an existing requirement
- Require a final spec format check after any edit
- Require removals to name the exact requirement being removed
- Update install and repository documentation to include the new skill

Out of scope:
- New CLI subcommands or script behavior
- Automatic archive/merge logic changes
- Any implementation-code changes outside the skill/docs/install inventory

## Unchanged Behavior

Behaviors that must not change as a result of this change (leave blank if nothing is at risk):
- Existing `spec-driven-propose`, `spec-driven-modify`, and `spec-driven-apply`
  workflows remain the primary planning and implementation flow
- The TypeScript CLI remains filesystem-only and unchanged
- Existing delta spec format (`ADDED` / `MODIFIED` / `REMOVED`) remains unchanged
