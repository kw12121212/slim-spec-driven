# Delta: Skills Planning

## MODIFIED Requirements

### Requirement: roadmap-propose-reads-roadmap-and-spec-context-before-writing
Previously: `roadmap-propose` MUST read `.spec-driven/config.yaml`,
`.spec-driven/roadmap/INDEX.md`, the relevant milestone file, and
`.spec-driven/specs/INDEX.md` before it scaffolds a change.

When the selected roadmap item includes indented continuation lines under the
planned change entry, `roadmap-propose` MUST treat those detail lines as part of
the planning context it reads before drafting artifacts.

`roadmap-propose` MUST read `.spec-driven/config.yaml`,
`.spec-driven/roadmap/INDEX.md`, the relevant milestone file, and
`.spec-driven/specs/INDEX.md` before it scaffolds a change.

`roadmap-propose` MUST treat planned change entries as single-line roadmap input
when reading milestone context. It MUST NOT rely on attached continuation lines
under `## Planned Changes` as part of the planning context.

### Requirement: roadmap-recommend-reads-roadmap-context-before-recommending
Previously: `roadmap-recommend` MUST read `.spec-driven/config.yaml`,
`.spec-driven/roadmap/INDEX.md`, the relevant milestone files, and
`.spec-driven/specs/INDEX.md` before it recommends a change.

When a candidate roadmap item includes indented continuation lines under the
planned change entry, `roadmap-recommend` MUST treat those detail lines as part
of the roadmap context it reads before making and summarizing the
recommendation.

`roadmap-recommend` MUST read `.spec-driven/config.yaml`,
`.spec-driven/roadmap/INDEX.md`, the relevant milestone files, and
`.spec-driven/specs/INDEX.md` before it recommends a change.

`roadmap-recommend` MUST treat planned change entries as single-line roadmap
input when reading milestone context. It MUST NOT rely on attached continuation
lines under `## Planned Changes` as part of the recommendation context.
