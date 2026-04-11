# add-basic-ship-step

## What

Add a lightweight `spec-driven-ship` stage that commits and pushes a completed
change after verification, review, archive, and roadmap reconciliation have
succeeded.

The ship stage should be an explicit optional workflow entry point. It should
read current repository state, confirm that the selected change has already been
archived, verify roadmap status is valid when roadmap assets exist, create one
ordinary git commit for the completed work, and push the current branch.

## Why

The roadmap now has stronger review guidance in place. The remaining milestone
extension is a minimal closeout step that helps a user move a finished,
archived, roadmap-reconciled change from local repository state to the remote
branch without adding pull request, deployment, release, or canary automation.

## Scope

In scope:
- Add a `spec-driven-ship` skill as the explicit ship entry point.
- Require ship to run only after verification, review, archive, and roadmap
  reconciliation have succeeded.
- Have the ship skill inspect git state, stage the intended completed work,
  create a simple commit, and push the current branch.
- Preserve the existing quality gates by treating incomplete, unarchived,
  unreconciled, or dirty-ambiguous state as blockers.
- Install the new ship skill with the other bundled skills.
- Add validation and test coverage so the new skill remains schema-valid and
  installer behavior includes it.

Out of scope:
- Pull request creation.
- Deployment, release, canary, or package publication automation.
- Multi-repository or parallel milestone shipping workflows.
- Changing the existing verification, review, archive, or roadmap
  reconciliation gates.
- Adding a new TypeScript CLI subcommand for git operations.

## Unchanged Behavior

Behaviors that must not change as a result of this change (leave blank if nothing is at risk):
- `spec-driven-apply`, `spec-driven-verify`, `spec-driven-review`, and
  `spec-driven-archive` keep their existing responsibilities.
- Archive still merges delta specs before moving a change into
  `.spec-driven/changes/archive/`.
- Roadmap reconciliation still happens before a roadmap-backed change is
  considered ready to ship.
- The TypeScript CLI remains limited to deterministic filesystem mechanics and
  validation helpers.
- Ship remains optional; existing users can continue stopping after archive.
