# Skills Roadmap

### Requirement: roadmap-assets-live-under-spec-driven-roadmap
The roadmap layer MUST live under `.spec-driven/roadmap/` and MUST include
`INDEX.md` plus a `milestones/` directory. The roadmap asset is long-lived
planning state and MUST remain distinct from `.spec-driven/changes/`, which
continues to hold change-specific execution artifacts.

### Requirement: milestones-are-the-primary-roadmap-unit
The roadmap MUST organize long-term planning by milestone files rather than one
single monolithic roadmap document. Each milestone file MUST represent a bounded
phase with its own goal and completion target.

### Requirement: milestone-files-separate-candidate-ideas-from-planned-changes
Each milestone file MUST keep `Candidate Ideas` separate from `Planned Changes`.
Candidate ideas MAY describe opportunities not yet approved as changes. Planned
changes MUST identify the concrete change work expected to enter or already
exist under `.spec-driven/changes/`.

### Requirement: milestone-files-capture-stage-goals-and-risks
Each milestone file MUST record the milestone goal, done criteria,
dependencies/risks, and current status in addition to candidate ideas and
planned changes. These fields define the stage boundary for the milestone and
must not be implied only by chat context.

### Requirement: milestone-files-use-standard-sections-for-validation
Roadmap milestone files MUST use the following section headings so roadmap
validation can inspect them predictably:
- `## Goal`
- `## Done Criteria`
- `## Candidate Ideas`
- `## Planned Changes`
- `## Dependencies / Risks`
- `## Status`

### Requirement: milestone-completion-derives-from-archived-planned-changes
A milestone MUST be treated as complete only when all of its listed planned
changes are archived under `.spec-driven/changes/archive/`. The roadmap MUST NOT
support manual completion overrides that can mark a milestone done while one or
more planned changes remain active, blocked, or unstarted.

#### Scenario: active-change-keeps-milestone-open
- GIVEN a milestone lists two planned changes
- AND one of those changes is not archived yet
- WHEN roadmap status is evaluated
- THEN the milestone is not complete

### Requirement: milestones-limit-planned-change-count
A roadmap milestone MUST contain no more than 5 bullet items under
`## Planned Changes`. If the planned change count exceeds that limit, the
milestone is too large and MUST be split into multiple milestones instead of
remaining as a single stage.

#### Scenario: too-many-planned-changes
- GIVEN a milestone has 6 planned changes
- WHEN roadmap validation is run
- THEN the milestone is reported as invalid and the result tells the user to
  split the milestone

### Requirement: roadmap-plan-builds-or-restructures-milestones
`roadmap-plan` MUST help the user create or restructure the roadmap
into milestone files with explicit phase goals, milestone boundaries, candidate
ideas, and planned changes. Before writing or rewriting roadmap assets, it MUST
read `.spec-driven/config.yaml`, any existing roadmap files, relevant specs, and
the currently active or archived changes needed to understand the repository's
present state.

### Requirement: roadmap-milestone-refines-one-milestone-without-collapsing-the-roadmap
`roadmap-milestone` MUST focus on one milestone at a time. It MUST
refine that milestone's goal, done criteria, candidate ideas, planned changes,
dependencies, and risks without collapsing multiple milestones into one oversized
document.

### Requirement: roadmap-sync-reconciles-roadmap-state-with-change-history
`roadmap-sync` MUST read roadmap milestone files together with
`.spec-driven/changes/` and `.spec-driven/changes/archive/` to reconcile status
and listed change state. It MUST update roadmap status based on repository
evidence rather than preserving stale manual labels.

### Requirement: roadmap-skills-run-size-validation-before-finish
After `roadmap-plan`, `roadmap-milestone`, or `roadmap-sync` edit roadmap
files, they MUST run the roadmap
validation command. If roadmap validation reports that a milestone is too large,
the skill MUST stop and tell the user to split the milestone rather than
presenting the roadmap as ready.
