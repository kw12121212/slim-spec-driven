# Design: standardize-index-and-roadmap-format

## Approach

Describe the file formats as explicit Markdown contracts in delta specs, then
bind those contracts to CLI behavior so the scripts become the single source of
truth for generated indexes and roadmap state checks.

The change will update the main roadmap spec to define the canonical structure
of roadmap index files and milestone status blocks. It will update the scripts
behavior spec to define how `init`, `verify-roadmap`, and `roadmap-status`
generate or validate those files.

It will also update archive workflow requirements so the roadmap layer is
reconciled after archive changes repository evidence. That keeps declared
milestone status and roadmap index entries from drifting behind archived change
history.

The normalized formats should be simple enough to parse with the existing thin
filesystem-oriented CLI and rigid enough that skills can safely read and rewrite
them without depending on prose interpretation.

## Key Decisions

- Treat both `INDEX.md` files as structured navigation artifacts rather than
  freeform prose documents. This keeps them scriptable and reduces drift.
- Keep roadmap status as a declared value in the milestone file plus a derived
  value from repository evidence. This preserves human intent while keeping the
  archive state authoritative.
- Use a limited declared-status enum instead of arbitrary free text so
  `verify-roadmap` can enforce a stable contract.
- Reconcile roadmap files after archive rather than treating roadmap cleanup as
  a separate optional follow-up. Archive changes the evidence used for derived
  milestone state, so roadmap synchronization belongs in the same closeout flow.
- Keep the change at the spec level only. Script and template implementation can
  follow in a separate execution step.

## Alternatives Considered

- Leave format guidance as examples only. Rejected because examples are too weak
  for machine validation and too easy for skills to drift from.
- Store derived status inside milestone files. Rejected because derived state is
  repository evidence and would become stale immediately unless every command
  rewrites roadmap files.
- Allow arbitrary freeform status text plus best-effort parsing. Rejected
  because it preserves the current ambiguity instead of solving it.
- Require users to run `roadmap-sync` manually after every archive. Rejected
  because it makes roadmap correctness depend on a separate optional cleanup
  step and guarantees stale statuses when that step is forgotten.
