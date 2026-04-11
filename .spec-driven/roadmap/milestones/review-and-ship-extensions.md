# Review And Ship Extensions

## Goal
Extend the spec-driven workflow with stronger review guidance and a lightweight ship stage after the core milestone automation path is defined.

## In Scope
- Add change-type-specific review checklist routing without splitting review into many separate skills.
- Add a basic commit-and-push ship stage after verification, review, archive, and roadmap reconciliation have succeeded.
- Keep the extensions lightweight and compatible with the existing single-repository workflow.

## Out of Scope
- Replacing the existing review skill with many specialized review skills.
- Adding pull request, deployment, release, or canary automation.
- Introducing parallel milestone execution or multi-repository shipping workflows.

## Done Criteria
- Review guidance can adapt to security-sensitive, UI, DX, migration, API, and maintenance changes while preserving the existing review lifecycle.
- A basic ship step is defined for successful changes that have already passed verification, review, archive, and roadmap reconciliation.
- The ship behavior remains optional workflow automation and does not weaken existing quality gates.

## Planned Changes
- `specialize-review-checklists` - Declared: complete - route review through change-type-specific checklists for security-sensitive, UI, DX, migration, API, and maintenance changes without immediately splitting review into many separate skills.
- `add-basic-ship-step` - Declared: complete - add a lightweight ship stage that performs a simple commit and push after successful verification, review, archive, and roadmap reconciliation without introducing PR, deployment, or canary automation.

## Dependencies
- These extensions should build on the existing review, archive, and roadmap reconciliation workflow.
- The basic ship step should run only after verification, review, archive, and roadmap reconciliation have succeeded.

## Risks
- Review checklist routing could become too complex if it tries to encode every change type up front.
- A ship step can be risky if it runs before archive and roadmap reconciliation are complete or if it hides commit and push failures.

## Status
- Declared: complete

## Notes
- This milestone is intentionally separate from automatic milestone delivery so the first milestone can focus on core milestone execution and recovery semantics.



