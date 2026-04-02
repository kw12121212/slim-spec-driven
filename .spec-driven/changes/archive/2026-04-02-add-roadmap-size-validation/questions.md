# Questions: add-roadmap-size-validation

## Open

<!-- No open questions -->

## Resolved

- [x] Q: Should milestone size be enforced by script validation rather than only
  by prompt wording?
  Context: This decides whether the AI receives a repository-level blocker.
  A: Yes. The repository should validate milestone size in a script.

- [x] Q: What should happen when a milestone is too large?
  Context: This determines whether the result is advisory or blocking.
  A: The AI should be told the milestone is too large and should be split.
