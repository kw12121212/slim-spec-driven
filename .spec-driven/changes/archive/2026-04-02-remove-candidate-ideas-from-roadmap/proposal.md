# remove-candidate-ideas-from-roadmap

## What

Remove the `Candidate Ideas` section from roadmap milestone files and make
`## Planned Changes` the only roadmap work list retained inside a milestone.
The change updates roadmap specs, roadmap-related skill prompts,
`verify-roadmap` / `roadmap-status` expectations, docs, templates, and tests so
the roadmap format no longer distinguishes speculative ideas from planned work
inside the milestone document.

## Why

The current roadmap format forces users to split milestone content into two
lists even when they only want to keep one concise stage-level work list. That
extra distinction adds prompt complexity, documentation overhead, and redundant
editing without helping the deterministic parts of the workflow. The repository
already derives milestone status only from `Planned Changes`, so the simpler and
more coherent model is to keep a single committed milestone work list and remove
the unused idea bucket from the formal milestone shape.

## Scope

In scope:
- Remove `## Candidate Ideas` from the required roadmap milestone section set
- Define `## Planned Changes` as the only milestone work list and preserve its
  meaning as concrete approved change candidates expected to enter or already
  exist under `.spec-driven/changes/`
- Update roadmap skill behavior and prompts so `roadmap-plan`,
  `roadmap-milestone`, `roadmap-propose`, and `roadmap-recommend` no longer
  talk about moving work between candidate ideas and planned changes
- Update `verify-roadmap` and related roadmap expectations so milestone
  validation no longer requires or reports a candidate-ideas section
- Update docs, examples, templates, and tests to use the simplified milestone
  format

Out of scope:
- Replacing `## Planned Changes` with a weaker "maybe someday" backlog list
- Changing milestone completion to anything other than derived archive state of
  planned changes
- Introducing a second speculative section under a different name
- Automatically migrating every existing user roadmap file outside this
  repository's edited examples and templates

## Unchanged Behavior

Behaviors that must not change as a result of this change (leave blank if nothing is at risk):
- `Planned Changes` remains the gate for roadmap-backed execution through
  `roadmap-propose` and `roadmap-recommend`
- Milestone completion remains derived from planned change archive state rather
  than manual status overrides
- The 5-item limit on planned changes per milestone remains in force
- Roadmap artifacts remain separate from `.spec-driven/changes/`
