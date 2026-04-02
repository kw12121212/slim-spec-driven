# Design: rename-roadmap-skills

## Approach

- Rename the three roadmap skill directories under `skills/` and update each
  `SKILL.md` frontmatter so the installed skill name matches the new command.
- Update every mainline reference that treats those names as public API:
  installer skill lists, workflow specs, README files, AGENTS guidance, roadmap
  guide text, and install assertions in the test suite.
- Leave `.spec-driven/changes/archive/` untouched so archived artifacts preserve
  their original historical wording.

## Key Decisions

- Treat the new names as a public interface rename, not an implementation
  behavior change.
- Update the main specs because installer behavior and roadmap skill naming are
  observable workflow behavior.
- Preserve archived changes verbatim to avoid rewriting historical records for a
  cosmetic rename.

## Alternatives Considered

- Keep the existing `spec-driven-roadmap-*` names and only adjust docs. Rejected
  because the requested naming convention would still not be true in the actual
  installed commands.
- Rename archived change history too. Rejected because it changes preserved
  historical artifacts without affecting current repository behavior.
