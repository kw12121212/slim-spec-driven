# Design: sync-roadmap-on-archive

## Approach

Update the archive-related specs first, then refresh the skill prompts so the
archive closeout language matches the documented contract and the current CLI
behavior.

The lifecycle spec will keep archive gating and spec merging with the AI, but
it will stop pretending that roadmap status reconciliation is AI-only work.
Instead, the scripts behavior spec will explicitly document that the archive
command performs deterministic roadmap milestone and roadmap index updates after
the change is moved to archive.

With that contract in place, `spec-driven-archive` can tell the user that
roadmap status is reconciled as part of archive closeout, and
`spec-driven-auto` can reuse the same archive closeout language instead of
ending at a generic final result summary.

## Key Decisions

- Treat post-archive roadmap reconciliation as deterministic CLI behavior,
  because the current archive command already performs it and existing tests
  depend on that behavior.
- Keep the AI responsible for workflow judgment and spec edits, not for
  low-level roadmap status derivation that can be computed mechanically from the
  repository state.
- Update both `spec-driven-archive` and `spec-driven-auto` together so the
  stepwise and end-to-end archive flows do not diverge again.
- Keep this change focused on archive closeout semantics rather than expanding
  into broader roadmap workflow redesign.

## Alternatives Considered

- Update only `skills/spec-driven-archive/SKILL.md`. Rejected because
  `spec-driven-auto` would keep the same closeout gap and the behavior contract
  would remain inconsistent.
- Move roadmap reconciliation out of the CLI and make the AI perform all
  milestone and roadmap index edits. Rejected because the current CLI already
  performs deterministic reconciliation and the existing tests assert that
  behavior.
- Tell users to run `roadmap-sync` manually after every archive. Rejected
  because it makes roadmap correctness depend on an optional follow-up step and
  contradicts the existing archive behavior.
