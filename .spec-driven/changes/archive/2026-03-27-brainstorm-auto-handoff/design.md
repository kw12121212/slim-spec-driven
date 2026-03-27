# Design: brainstorm-auto-handoff

## Approach

Two small, targeted edits to skill prompts plus corresponding spec updates:

1. **`spec-driven-auto` Red tier** — Replace the current text "suggest using the step-by-step workflow (`/spec-driven-propose` → `/spec-driven-apply` → ...) instead" with a suggestion to run `/spec-driven-brainstorm` first to converge the idea, then enter auto.

2. **`spec-driven-brainstorm` Step 9 (new)** — After the existing hand-off (Step 9), add a new step that asks the user: "Enter `/spec-driven-auto` to execute this proposal, or continue modifying with `/spec-driven-modify`?" This renumbers the existing hand-off step.

## Key Decisions

- **Brainstorm does NOT auto-enter auto** — the user explicitly chooses. This preserves brainstorm as a planning-only tool and avoids surprising the user with an immediate implementation run.
- **Red tier suggests brainstorm, not step-by-step** — brainstorm is the better starting point for vague scope because it helps the user converge before proposing. Step-by-step is still available but isn't the primary recommendation.
- **Step-by-step flow is untouched** — users who know what they want can still go propose → apply → verify → review → archive directly.

## Alternatives Considered

- **Make brainstorm auto-enter auto after confirmation** — rejected because brainstorm users may want to review artifacts, share the proposal, or iterate before executing.
- **Add brainstorm as a step inside auto** — rejected because brainstorm's multi-round discussion contradicts auto's automation model. Better as a pre-auto detour triggered only for Red tier.
