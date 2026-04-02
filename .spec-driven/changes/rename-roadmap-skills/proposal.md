# rename-roadmap-skills

## What

- Rename the three roadmap planning skills to `roadmap-plan`,
  `roadmap-milestone`, and `roadmap-sync`.
- Update installer behavior, specs, docs, tests, and skill metadata so the new
  names are the canonical public interface.

## Why

- The roadmap skills should use a name shape that starts with `roadmap-` so
  they are grouped naturally and read like a cohesive workflow.
- Keeping the old `spec-driven-roadmap-*` names would leave roadmap planning as
  the only workflow area whose public command names are ordered by namespace
  instead of by function.

## Scope

- In scope:
  - rename the shipped roadmap skill directories and frontmatter names
  - update installer references and install expectations
  - update main specs and user-facing docs to reference the new names
  - update tests to validate the renamed skills
- Out of scope:
  - changing non-roadmap skill names
  - rewriting archived historical change records to use the new names

## Unchanged Behavior

Behaviors that must not change as a result of this change (leave blank if nothing is at risk):
- roadmap planning remains documentation-only and does not implement product code
- roadmap-plan, roadmap-milestone, and roadmap-sync keep the same responsibilities
- init still creates or repairs the roadmap scaffold under `.spec-driven/roadmap/`
