# Delta: Skills Roadmap

## MODIFIED Requirements

### Requirement: planned-changes-are-the-only-milestone-work-list
Previously: Each roadmap milestone file MUST use `## Planned Changes` as its only work list.
Items under that section MUST represent concrete approved change candidates
expected to enter or already exist under `.spec-driven/changes/`. Milestone
files MUST NOT use that section as a speculative backlog of unapproved ideas.

Each planned change entry MUST use the canonical bullet format
`- \`<change-name>\` - <summary>`.
`<change-name>` MUST be the kebab-case change identifier. `<summary>` MUST be a
short human-readable explanation of why that change belongs in the milestone.

After that canonical first line, a planned change entry MAY include additional
indented detail lines to capture richer milestone-local context. Those detail
lines belong to the preceding planned change entry and MUST NOT introduce a new
planned change unless they start a new top-level bullet.

Each roadmap milestone file MUST use `## Planned Changes` as its only work list.
Items under that section MUST represent concrete approved change candidates
expected to enter or already exist under `.spec-driven/changes/`. Milestone
files MUST NOT use that section as a speculative backlog of unapproved ideas.

Each planned change entry MUST use the canonical bullet format
`- \`<change-name>\` - <summary>`.
`<change-name>` MUST be the kebab-case change identifier. `<summary>` MUST be a
single-line human-readable explanation of why that change belongs in the
milestone. Planned change entries MUST NOT include attached continuation lines
or other multiline detail below the canonical bullet.

### Requirement: roadmap-plan-builds-or-restructures-milestones
Previously: `roadmap-plan` MUST help the user create or restructure the roadmap
into milestone files with explicit phase goals, milestone boundaries, and
planned changes. Before writing or rewriting roadmap assets, it MUST read
`.spec-driven/config.yaml`, any existing roadmap files, relevant specs, and the
currently active or archived changes needed to understand the repository's
present state.

When a planned change is complex enough that one summary line would leave the
handoff underspecified, `roadmap-plan` SHOULD add indented continuation lines
under that planned change entry to capture milestone-local detail.

`roadmap-plan` MUST help the user create or restructure the roadmap
into milestone files with explicit phase goals, milestone boundaries, and
planned changes. Before writing or rewriting roadmap assets, it MUST read
`.spec-driven/config.yaml`, any existing roadmap files, relevant specs, and the
currently active or archived changes needed to understand the repository's
present state.

When milestone-local context is too large for one planned change summary line,
`roadmap-plan` MUST keep the planned change entry itself single-line and place
additional explanation elsewhere in the milestone file, such as `## Notes`,
rather than adding attached continuation lines under `## Planned Changes`.

### Requirement: roadmap-milestone-refines-one-milestone-without-collapsing-the-roadmap
Previously: `roadmap-milestone` MUST focus on one milestone at a time. It MUST
refine that milestone's goal, done criteria, planned changes, dependencies, and
risks without collapsing multiple milestones into one oversized document.

When a planned change needs more than the canonical first line to capture useful
planning context, `roadmap-milestone` SHOULD add indented continuation lines
that stay attached to that planned change entry.

`roadmap-milestone` MUST focus on one milestone at a time. It MUST
refine that milestone's goal, done criteria, planned changes, dependencies, and
risks without collapsing multiple milestones into one oversized document.

When a milestone author needs more context than one planned change summary line
can carry, `roadmap-milestone` MUST preserve the planned change as a single-line
entry and move additional explanation to another milestone section instead of
adding attached continuation lines.

### Requirement: roadmap-propose-promotes-planned-changes-into-normal-changes
Previously: `roadmap-propose` MUST turn a milestone `Planned Changes` item into a normal
change scaffold under `.spec-driven/changes/<name>/`. It MUST require the target
work item to already appear under a milestone `## Planned Changes` section
before scaffolding.

When the selected planned change entry includes indented continuation lines,
`roadmap-propose` MUST read that attached detail block and use it as planning
input while drafting the change proposal artifacts.

`roadmap-propose` MUST turn a milestone `Planned Changes` item into a normal
change scaffold under `.spec-driven/changes/<name>/`. It MUST require the target
work item to already appear under a milestone `## Planned Changes` section
before scaffolding.

`roadmap-propose` MUST treat each planned change entry as a single-line roadmap
input. It MUST NOT depend on attached continuation lines below the planned
change bullet when drafting change proposal artifacts.

### Requirement: roadmap-recommend-recommends-the-next-change-from-roadmap-context
Previously: `roadmap-recommend` MUST analyze roadmap milestone context and recommend a next
change candidate for the user to consider. The recommendation MUST identify the
proposed change name, the milestone it comes from, and why it is a good next
step. The recommended candidate MUST already exist under a milestone
`## Planned Changes` section.

When the recommended planned change entry includes indented continuation lines,
`roadmap-recommend` MUST use that attached detail block while explaining the
recommendation and while summarizing the proposed roadmap-backed change before
scaffolding.

`roadmap-recommend` MUST analyze roadmap milestone context and recommend a next
change candidate for the user to consider. The recommendation MUST identify the
proposed change name, the milestone it comes from, and why it is a good next
step. The recommended candidate MUST already exist under a milestone
`## Planned Changes` section.

`roadmap-recommend` MUST treat each planned change entry as a single-line roadmap
input. It MUST NOT depend on attached continuation lines below the planned
change bullet when explaining or summarizing the recommended change.
