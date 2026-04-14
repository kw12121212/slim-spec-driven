# add-delta-spec-format-samples

## What

Require proposal-authoring planning skills to include a copyable canonical delta
spec sample, update the repository spec authoring README to document the same
sample outside the skill prompts, and remove `install.sh`-specific coverage from
the repository test suite.

## Why

Creating a change currently depends on the agent inferring delta spec structure
from short abstract rules. Because the repository validator is strict about
section markers and requirement formatting, agents often generate an invalid
delta spec first and then have to repair it through repeated `verify` runs.

Providing one canonical, copyable example in the planning skills and the README
should reduce avoidable format churn without weakening validation. Separately,
the current repository test suite fails on `install.sh` behavior that the user
does not want covered, so that install-specific test section should be removed.

## Scope

In scope:
- add a planning-spec requirement that proposal-authoring skills provide a
  copyable canonical delta spec sample
- update `spec-driven-propose`, `spec-driven-brainstorm`,
  `spec-driven-modify`, `roadmap-propose`, and `roadmap-recommend` to embed the
  same delta spec example and related usage guidance
- update `.spec-driven/specs/README.md` to document the canonical delta spec
  format separately from main spec format
- add validation or regression coverage where practical so the sample guidance
  does not silently drift
- remove `install.sh`-specific assertions from `test/run.js` so the required
  unit test command no longer depends on installer behavior

Out of scope:
- changing `spec-driven.js verify` validation rules
- changing `spec-driven.js propose` scaffold output
- changing execution-only skills that do not own proposal or delta-spec authoring
- changing `install.sh` implementation itself

## Unchanged Behavior

Behaviors that must not change as a result of this change (leave blank if nothing is at risk):

- Proposal workflows continue to generate the same five artifacts and use the
  same `verify` command; this change only improves the guidance used to write
  valid delta spec files.
- Delta specs continue to describe observable behavior only and continue to keep
  implementation/test mappings in frontmatter rather than requirement prose.
- Removing `install.sh` coverage from `npm test` does not change installer
  behavior; it only changes which repository checks are run by the unit test
  command.
