# brainstorm-auto-handoff

## What

Connect `spec-driven-brainstorm` and `spec-driven-auto` into two clear workflow paths:
1. **Auto path**: `/spec-driven-auto` assesses complexity — Green/Yellow proceeds directly; Red suggests brainstorm, and after brainstorm completes the user is prompted to enter auto or continue modifying
2. **Step-by-step path**: `/spec-driven-propose` → apply → verify → review → archive (unchanged)

## Why

Currently brainstorm and auto are disconnected. When a user starts with `/spec-driven-auto` but hits the Red tier, the only suggestion is "use step-by-step workflow" — which ignores brainstorm entirely. And after brainstorm produces a full proposal, the user is left to manually invoke `/spec-driven-apply` or `/spec-driven-auto`. This creates a gap in the workflow where brainstorm's output isn't naturally routed into execution.

## Scope

- Update `spec-driven-auto` Red tier prompt to suggest brainstorm
- Add hand-off step to `spec-driven-brainstorm` asking user to enter auto or continue modifying
- Update `auto-applies-complexity-gate` spec in lifecycle.md
- Update brainstorm-related specs in planning.md

Out of scope:
- Step-by-step workflow (propose → apply → verify → review → archive) remains unchanged
- Auto's Green/Yellow logic unchanged
- Brainstorm's convergence discussion flow unchanged

## Unchanged Behavior

- Green and Yellow tier behavior in auto (proceed or warn+confirm)
- Brainstorm's Steps 1-8 (idea discussion, convergence, artifact generation, validation)
- The step-by-step workflow from propose through archive
