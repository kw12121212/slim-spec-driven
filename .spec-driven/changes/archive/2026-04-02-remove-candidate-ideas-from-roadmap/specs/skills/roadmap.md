# Delta: Skills Roadmap

## ADDED Requirements

### Requirement: planned-changes-are-the-only-milestone-work-list
Each roadmap milestone file MUST use `## Planned Changes` as its only work list.
Items under that section MUST represent concrete approved change candidates
expected to enter or already exist under `.spec-driven/changes/`. Milestone
files MUST NOT use that section as a speculative backlog of unapproved ideas.

## MODIFIED Requirements

### Requirement: milestone-files-capture-stage-goals-and-risks
Previously: Each milestone file MUST record the milestone goal, done criteria,
dependencies/risks, and current status in addition to candidate ideas and
planned changes. These fields define the stage boundary for the milestone and
must not be implied only by chat context.

Each milestone file MUST record the milestone goal, done criteria, planned
changes, dependencies/risks, and current status. These fields define the stage
boundary for the milestone and must not be implied only by chat context.

### Requirement: milestone-files-use-standard-sections-for-validation
Previously: Roadmap milestone files MUST use the following section headings so
roadmap validation can inspect them predictably:
- `## Goal`
- `## Done Criteria`
- `## Candidate Ideas`
- `## Planned Changes`
- `## Dependencies / Risks`
- `## Status`

Roadmap milestone files MUST use the following section headings so roadmap
validation can inspect them predictably:
- `## Goal`
- `## Done Criteria`
- `## Planned Changes`
- `## Dependencies / Risks`
- `## Status`

### Requirement: roadmap-plan-builds-or-restructures-milestones
Previously: `roadmap-plan` MUST help the user create or restructure the roadmap
into milestone files with explicit phase goals, milestone boundaries, candidate
ideas, and planned changes. Before writing or rewriting roadmap assets, it MUST
read `.spec-driven/config.yaml`, any existing roadmap files, relevant specs, and
the currently active or archived changes needed to understand the repository's
present state.

`roadmap-plan` MUST help the user create or restructure the roadmap into
milestone files with explicit phase goals, milestone boundaries, and planned
changes. Before writing or rewriting roadmap assets, it MUST read
`.spec-driven/config.yaml`, any existing roadmap files, relevant specs, and the
currently active or archived changes needed to understand the repository's
present state.

### Requirement: roadmap-milestone-refines-one-milestone-without-collapsing-the-roadmap
Previously: `roadmap-milestone` MUST focus on one milestone at a time. It MUST
refine that milestone's goal, done criteria, candidate ideas, planned changes,
dependencies, and risks without collapsing multiple milestones into one oversized
document.

`roadmap-milestone` MUST focus on one milestone at a time. It MUST refine that
milestone's goal, done criteria, planned changes, dependencies, and risks
without collapsing multiple milestones into one oversized document.

### Requirement: roadmap-propose-promotes-planned-changes-into-normal-changes
Previously: `roadmap-propose` MUST turn a milestone `Planned Changes` item into
a normal change scaffold under `.spec-driven/changes/<name>/`. It MUST require
the target work item to already appear under a milestone `## Planned Changes`
section rather than promoting a `Candidate Idea` implicitly.

`roadmap-propose` MUST turn a milestone `Planned Changes` item into a normal
change scaffold under `.spec-driven/changes/<name>/`. It MUST require the
target work item to already appear under a milestone `## Planned Changes`
section before scaffolding.

### Requirement: roadmap-recommend-recommends-the-next-change-from-roadmap-context
Previously: `roadmap-recommend` MUST analyze roadmap milestone context and
recommend a next change candidate for the user to consider. The recommendation
MUST identify the proposed change name, the milestone it comes from, and why it
is a good next step. The recommended candidate MUST already exist under a
milestone `## Planned Changes` section rather than being promoted implicitly
from `Candidate Ideas`.

`roadmap-recommend` MUST analyze roadmap milestone context and recommend a next
change candidate for the user to consider. The recommendation MUST identify the
proposed change name, the milestone it comes from, and why it is a good next
step. The recommended candidate MUST already exist under a milestone
`## Planned Changes` section.

## REMOVED Requirements

### Requirement: milestone-files-separate-candidate-ideas-from-planned-changes
Reason: roadmap milestone files now keep a single committed work list instead of
splitting stage content between candidate ideas and planned changes.
