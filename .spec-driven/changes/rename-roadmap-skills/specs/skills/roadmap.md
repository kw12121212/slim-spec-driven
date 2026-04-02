# Delta: Skills Roadmap

## MODIFIED Requirements

### Requirement: roadmap-plan-builds-or-restructures-milestones
`roadmap-plan` MUST help the user create or restructure the roadmap into
milestone files with explicit phase goals, milestone boundaries, candidate
ideas, and planned changes. Before writing or rewriting roadmap assets, it MUST
read `.spec-driven/config.yaml`, any existing roadmap files, relevant specs, and
the currently active or archived changes needed to understand the repository's
present state.

Previously: This requirement referred to `spec-driven-roadmap-plan`.

### Requirement: roadmap-milestone-refines-one-milestone-without-collapsing-the-roadmap
`roadmap-milestone` MUST focus on one milestone at a time. It MUST refine that
milestone's goal, done criteria, candidate ideas, planned changes,
dependencies, and risks without collapsing multiple milestones into one
oversized document.

Previously: This requirement referred to `spec-driven-roadmap-milestone`.

### Requirement: roadmap-sync-reconciles-roadmap-state-with-change-history
`roadmap-sync` MUST read roadmap milestone files together with
`.spec-driven/changes/` and `.spec-driven/changes/archive/` to reconcile status
and listed change state. It MUST update roadmap status based on repository
evidence rather than preserving stale manual labels.

Previously: This requirement referred to `spec-driven-roadmap-sync`.

### Requirement: roadmap-skills-run-size-validation-before-finish
After `roadmap-plan`, `roadmap-milestone`, or `roadmap-sync` edit roadmap
files, they MUST run the roadmap validation command. If roadmap validation
reports that a milestone is too large, the skill MUST stop and tell the user to
split the milestone rather than presenting the roadmap as ready.

Previously: This requirement referred to `spec-driven-roadmap-plan`,
`spec-driven-roadmap-milestone`, and `spec-driven-roadmap-sync`.
