---
mapping:
  implementation:
    - skills/roadmap-plan/SKILL.md
    - skills/roadmap-milestone/SKILL.md
    - skills/roadmap-recommend/SKILL.md
    - skills/roadmap-propose/SKILL.md
    - skills/roadmap-sync/SKILL.md
    - scripts/spec-driven.ts
  tests:
    - test/run.js
    - test/validate-skills.ts
---

# Skills Roadmap

### Requirement: roadmap-assets-live-under-spec-driven-roadmap
The roadmap layer MUST live under `.spec-driven/roadmap/` and MUST include
`INDEX.md` plus a `milestones/` directory. The roadmap asset is long-lived
planning state and MUST remain distinct from `.spec-driven/changes/`, which
continues to hold change-specific execution artifacts.

`.spec-driven/roadmap/INDEX.md` MUST use a standard machine-validated Markdown
format:
- The first line MUST be `# Roadmap Index`
- The file MUST contain exactly one `## Milestones` section
- Each milestone entry under `## Milestones` MUST be a bullet in the form
  `- [<file>](milestones/<file>) - <title> - <declared-status>`
- `<declared-status>` MUST use the same declared milestone status enum required
  by roadmap milestone files

The roadmap index MUST act as a structured navigation artifact rather than a
freeform prose document.

#### Scenario: roadmap-index-uses-canonical-entry-format
- GIVEN `.spec-driven/roadmap/INDEX.md` lists milestone files
- WHEN the roadmap index is validated or regenerated
- THEN each milestone appears as one bullet link under `## Milestones`
- AND each bullet includes the milestone title and declared status in the
  canonical format

### Requirement: milestones-are-the-primary-roadmap-unit
The roadmap MUST organize long-term planning by milestone files rather than one
single monolithic roadmap document. Each milestone file MUST represent a bounded
phase with its own goal and completion target.

### Requirement: planned-changes-are-the-only-milestone-work-list
Each roadmap milestone file MUST use `## Planned Changes` as its only work list.
Items under that section MUST represent concrete approved change candidates
expected to enter or already exist under `.spec-driven/changes/`. Milestone
files MUST NOT use that section as a speculative backlog of unapproved ideas.

Each planned change entry MUST use the canonical bullet format
`- \`<change-name>\` - Declared: <status> - <summary>`.
`<change-name>` MUST be the kebab-case change identifier. `<status>` MUST be one
of `planned` or `complete`. `<summary>` MUST be a single-line human-readable
explanation of why that change belongs in the milestone. Planned change entries
MUST NOT include attached continuation lines or other multiline detail below the
canonical bullet.

### Requirement: milestone-files-capture-stage-goals-and-risks
Each roadmap milestone file MUST record the milestone goal, in-scope boundary,
out-of-scope boundary, done criteria, planned changes, dependencies, risks,
current status, and notes. These fields define the stage boundary for the
milestone and must not be implied only by chat context.

### Requirement: milestone-files-use-standard-sections-for-validation
Roadmap milestone files MUST use the following section headings so roadmap
validation can inspect them predictably:
- `## Goal`
- `## In Scope`
- `## Out of Scope`
- `## Done Criteria`
- `## Planned Changes`
- `## Dependencies`
- `## Risks`
- `## Status`
- `## Notes`

The `## Status` section MUST contain exactly one bullet in the form
`- Declared: <status>`.

`<status>` MUST be one of:
- `proposed`
- `active`
- `blocked`
- `complete`

Roadmap milestone files MUST NOT use freeform prose or additional bullet fields
inside `## Status`. Explanatory context that does not change machine-visible
status belongs in `## Notes`.

#### Scenario: milestone-status-uses-declared-bullet
- GIVEN a roadmap milestone file contains a `## Status` section
- WHEN roadmap validation inspects the milestone
- THEN the section contains exactly one bullet
- AND that bullet matches `- Declared: <status>`

#### Scenario: milestone-status-explanation-lives-in-notes
- GIVEN a milestone author needs to explain why a milestone is blocked or still
  proposed
- WHEN they add human-readable context to the milestone file
- THEN that explanation appears under `## Notes`
- AND the `## Status` section remains limited to the declared status bullet

### Requirement: milestone-completion-derives-from-archived-planned-changes
A milestone MUST be treated as complete only when all of its listed planned
changes are archived under `.spec-driven/changes/archive/`. The roadmap MUST NOT
support manual completion overrides that can mark a milestone done while one or
more planned changes remain active, blocked, or unstarted.

Declared roadmap status remains part of the milestone file, but repository
evidence remains authoritative for derived completion. If a milestone declares
`complete` while one or more planned changes are still active or missing, that
declared status is stale and MUST be reported as mismatched.

#### Scenario: active-change-keeps-milestone-open
- GIVEN a milestone lists two planned changes
- AND one of those changes is not archived yet
- WHEN roadmap status is evaluated
- THEN the milestone is not complete

#### Scenario: declared-complete-with-active-change-is-stale
- GIVEN a milestone declares `complete`
- AND one of its planned changes is still active
- WHEN roadmap status is evaluated
- THEN the milestone derived status is not `complete`
- AND the result reports a declared-versus-derived mismatch

### Requirement: planned-change-declared-status-derives-from-archive-state
The roadmap MUST treat each planned change's declared status as structured
planning metadata while keeping repository evidence authoritative for whether the
change is actually complete.

A planned change's derived status MUST be `complete` only when the referenced
change is archived under `.spec-driven/changes/archive/`. In all other cases,
its derived status MUST be `planned`.

If a milestone file declares a planned change as `complete` while that change is
still active or missing, the declared status is stale and MUST be reported as a
mismatch.

#### Scenario: archived-change-derives-complete
- GIVEN a milestone lists a planned change with `Declared: planned`
- AND that change is archived under `.spec-driven/changes/archive/`
- WHEN roadmap state is evaluated
- THEN the planned change derives as `complete`

#### Scenario: stale-complete-planned-change-is-mismatched
- GIVEN a milestone lists a planned change with `Declared: complete`
- AND that change is not archived
- WHEN roadmap state is evaluated
- THEN the planned change derives as `planned`
- AND the result reports a declared-versus-derived mismatch

### Requirement: milestones-limit-planned-change-count
A roadmap milestone MUST contain no more than 10 bullet items under
`## Planned Changes`. If the planned change count exceeds that limit, the
milestone is too large and MUST be split into multiple milestones instead of
remaining as a single stage.

#### Scenario: too-many-planned-changes
- GIVEN a milestone has 11 planned changes
- WHEN roadmap validation is run
- THEN the milestone is reported as invalid and the result tells the user to
  split the milestone

### Requirement: roadmap-plan-builds-or-restructures-milestones
`roadmap-plan` MUST help the user create or restructure the roadmap
into milestone files with explicit phase goals, milestone boundaries, and
planned changes. Before writing or rewriting roadmap assets, it MUST read
`.spec-driven/config.yaml`, any existing roadmap files, relevant specs, and the
currently active or archived changes needed to understand the repository's
present state.

When `roadmap-plan` instructs the AI how to write or interpret roadmap status
fields, it MUST explicitly state the legal milestone declared status enum:
- `proposed`
- `active`
- `blocked`
- `complete`

It MUST also explicitly state the legal planned change declared status enum:
- `planned`
- `complete`

When milestone-local context is too large for one planned change summary line,
`roadmap-plan` MUST keep the planned change entry itself single-line and place
additional explanation elsewhere in the milestone file, such as `## Notes`,
rather than adding attached continuation lines under `## Planned Changes`.

When existing milestone files use an older structure, such as an extra
`## Candidate Ideas` section, a combined `## Dependencies / Risks` section, or
missing `## In Scope`, `## Out of Scope`, or `## Notes` sections,
`roadmap-plan` MAY migrate them into the canonical milestone format during
restructuring. It MUST preserve clearly recoverable content, rewrite the file
into the current standard section set, and avoid silently inventing ambiguous
content.

When the legacy source supports a confident mapping, `roadmap-plan` MUST map
that content into the canonical sections conservatively. When no canonical
section is an exact fit but the content is still worth preserving,
`roadmap-plan` MAY preserve that context in `## Notes` instead of dropping it.

When the legacy source does not support a confident split into the new milestone
sections, `roadmap-plan` MUST surface that ambiguity in the planning discussion
instead of pretending the migration is exact.

### Requirement: roadmap-milestone-refines-one-milestone-without-collapsing-the-roadmap
`roadmap-milestone` MUST focus on one milestone at a time. It MUST
refine that milestone's goal, done criteria, planned changes, dependencies, and
risks without collapsing multiple milestones into one oversized document.

When `roadmap-milestone` instructs the AI how to write or interpret roadmap
status fields, it MUST explicitly state the legal milestone declared status
enum:
- `proposed`
- `active`
- `blocked`
- `complete`

It MUST also explicitly state the legal planned change declared status enum:
- `planned`
- `complete`

When a milestone author needs more context than one planned change summary line
can carry, `roadmap-milestone` MUST preserve the planned change as a single-line
entry and move additional explanation to another milestone section instead of
adding attached continuation lines.

When the user wants to migrate only one legacy milestone instead of
restructuring the wider roadmap, `roadmap-milestone` MAY be used as a narrower
fallback path. When used that way, it MUST preserve clearly recoverable content
and surface ambiguity instead of pretending the migrated structure is exact.

#### Scenario: roadmap-plan-migrates-legacy-milestone-during-restructure
- GIVEN a roadmap contains a milestone file that uses an older section shape
- WHEN `roadmap-plan` restructures the roadmap
- THEN it may rewrite that milestone into the canonical milestone format
- AND it preserves clearly recoverable intent from the legacy file

#### Scenario: roadmap-plan-surfaces-legacy-migration-ambiguity
- GIVEN a legacy milestone does not clearly distinguish scope, risks, or notes
- WHEN `roadmap-plan` prepares the migrated roadmap shape
- THEN it surfaces that ambiguity in the planning discussion
- AND it does not silently claim an exact migration

#### Scenario: roadmap-plan-preserves-unmapped-legacy-context-in-notes
- GIVEN a legacy milestone contains context that does not cleanly map to another
  canonical section
- WHEN `roadmap-plan` rewrites that milestone into the canonical format
- THEN it preserves that context in `## Notes`
- AND it does not silently drop the information

### Requirement: roadmap-propose-promotes-planned-changes-into-normal-changes
`roadmap-propose` MUST turn a milestone `Planned Changes` item into a normal
change scaffold under `.spec-driven/changes/<name>/`. It MUST require the target
work item to already appear under a milestone `## Planned Changes` section
before scaffolding.

When `roadmap-propose` instructs the AI how to interpret roadmap status values,
it MUST explicitly state the legal milestone declared status enum:
- `proposed`
- `active`
- `blocked`
- `complete`

It MUST also explicitly state the legal planned change declared status enum:
- `planned`
- `complete`

`roadmap-propose` MUST treat each planned change entry as a single-line roadmap
input in the canonical format
`- \`<change-name>\` - Declared: <status> - <summary>`.
It MUST resolve the target work item from the ``<change-name>`` portion only,
and MUST NOT depend on the declared status or trailing summary text when
drafting change proposal artifacts.

#### Scenario: planned-change-becomes-change-scaffold
- GIVEN a roadmap milestone lists `add-auth-audit-log` under `## Planned Changes`
- WHEN `roadmap-propose add-auth-audit-log` is used
- THEN `.spec-driven/changes/add-auth-audit-log/` is scaffolded as a normal change

### Requirement: roadmap-workflow-can-handoff-from-milestone-to-change
The roadmap workflow MUST support an explicit handoff from milestone planning to
change execution through `roadmap-propose`, before the user enters
`spec-driven-apply`, `spec-driven-auto`, or other execution-stage skills.

### Requirement: roadmap-propose-offers-apply-or-auto-choice
After `roadmap-propose` scaffolds and presents a planned change, it MUST offer
an explicit execution handoff choice between the stepwise path
(`spec-driven-apply`) and the end-to-end path (`spec-driven-auto`). It MUST
wait for the user's explicit choice rather than silently assuming which
execution path should follow roadmap planning.

### Requirement: roadmap-recommend-recommends-the-next-change-from-roadmap-context
`roadmap-recommend` MUST analyze roadmap milestone context and recommend a next
change candidate for the user to consider. The recommendation MUST identify the
proposed change name, the milestone it comes from, and why it is a good next
step. The recommended candidate MUST already exist under a milestone
`## Planned Changes` section.

When `roadmap-recommend` instructs the AI how to interpret roadmap status
values, it MUST explicitly state the legal milestone declared status enum:
- `proposed`
- `active`
- `blocked`
- `complete`

It MUST also explicitly state the legal planned change declared status enum:
- `planned`
- `complete`

`roadmap-recommend` MUST treat each planned change entry as a single-line roadmap
input in the canonical format
`- \`<change-name>\` - Declared: <status> - <summary>`.
It MUST resolve the recommended work item from the ``<change-name>`` portion
only, and MUST NOT depend on the declared status or trailing summary text when
explaining or summarizing the recommended change.

#### Scenario: recommend-a-planned-change
- GIVEN a milestone contains multiple `Planned Changes`
- WHEN `roadmap-recommend` is used
- THEN it recommends one candidate change and explains the recommendation before
  any scaffolding occurs

### Requirement: roadmap-recommend-scaffolds-accepted-recommendation
After the user accepts or revises the recommendation, `roadmap-recommend`
MUST scaffold that roadmap-backed change as a normal change under
`.spec-driven/changes/<name>/`, rather than stopping at a recommendation-only
handoff.

If unresolved questions remain after the recommendation summary, and those
questions affect the content of the proposal to be scaffolded,
`roadmap-recommend` MUST stop before scaffolding, list each open question, and
ask the user to answer or confirm the decision needed.

For each open question, `roadmap-recommend` MUST present the fields
`Question`, `Explanation`, `Impact`, and `Recommendation`.

`Explanation` MUST clarify why the question still blocks the proposal.
`Impact` MUST state what scope, behavior, or scaffolding decision depends on
the answer. `Recommendation` MUST provide the skill's suggested answer or next
decision path, if any.

`roadmap-recommend` MAY suggest a preferred answer or option, but it MUST treat
that suggestion as advisory only. It MUST NOT write the suggestion as though it
were already confirmed, and it MUST NOT continue to scaffolding until the user
has explicitly resolved the open questions.

#### Scenario: roadmap-recommend-stops-on-open-questions-before-scaffold
- GIVEN `roadmap-recommend` has identified a candidate planned change
- AND one or more unresolved questions still affect the proposal scope or
  behavior
- WHEN it reaches the pre-scaffolding confirmation point
- THEN it lists those open questions to the user using `Question`,
  `Explanation`, `Impact`, and `Recommendation`
- AND it may include a recommended answer as a suggestion only
- AND it waits for explicit user confirmation before creating
  `.spec-driven/changes/<name>/`

### Requirement: roadmap-propose-remains-an-explicit-direct-entry
`roadmap-propose` MAY remain available as a direct entry point when the user
already knows which planned change should be scaffolded and does not need the
recommendation step. The roadmap workflow MUST support both paths.

### Requirement: roadmap-sync-reconciles-roadmap-state-with-change-history
`roadmap-sync` MUST use script assistance to reconcile roadmap state before it
edits roadmap files. It MUST read roadmap milestone files together with
`.spec-driven/changes/` and `.spec-driven/changes/archive/`, and it MUST run
`node {{SKILL_DIR}}/scripts/spec-driven.js roadmap-status` to obtain structured
milestone and planned change state before it decides what roadmap updates to
make. It MUST update milestone declared status and planned change declared
status based on repository evidence rather than preserving stale manual labels.

When `roadmap-sync` instructs the AI how to interpret roadmap status fields, it
MUST explicitly state the legal milestone declared status enum:
- `proposed`
- `active`
- `blocked`
- `complete`

It MUST also explicitly state the legal planned change declared status enum:
- `planned`
- `complete`

### Requirement: roadmap-skills-run-size-validation-before-finish
After `roadmap-plan`, `roadmap-milestone`, or `roadmap-sync` edit roadmap
files, they MUST run the roadmap
validation command. If roadmap validation reports that a milestone is too large,
the skill MUST stop and tell the user to split the milestone rather than
presenting the roadmap as ready.
