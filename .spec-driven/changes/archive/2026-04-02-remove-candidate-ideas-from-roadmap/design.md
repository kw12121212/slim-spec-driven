# Design: remove-candidate-ideas-from-roadmap

## Approach

- Update the roadmap specs so milestone files use a five-section operational
  shape: `Goal`, `Done Criteria`, `Planned Changes`, `Dependencies / Risks`, and
  `Status`.
- Remove the dedicated requirement that milestone files separate candidate ideas
  from planned changes.
- Strengthen the remaining `Planned Changes` semantics so the single list still
  means concrete approved change work expected to enter or already exist under
  `.spec-driven/changes/`.
- Update roadmap-related skill prompts, README / guide docs, templates, and
  test fixtures to reflect the simplified milestone format.
- Adjust roadmap script expectations so `verify-roadmap` no longer requires a
  `Candidate Ideas` section and roadmap summaries no longer rely on candidate
  idea counts.

## Key Decisions

- Keep `## Planned Changes` as the section name instead of renaming it. This
  minimizes churn and preserves the existing archive-derived completion model.
- Preserve the "committed work" meaning of `Planned Changes` rather than
  redefining it as a speculative backlog. That keeps `roadmap-propose`,
  `roadmap-recommend`, and `roadmap-status` deterministic.
- Allow legacy milestone files that still contain an extra `## Candidate Ideas`
  section to remain parseable during the transition by removing it from the
  required section list rather than introducing a hard rejection rule.
- Treat docs, examples, tests, and templates as first-class change surface. The
  milestone format is user-facing, so the repository should update all shipped
  guidance together with the specs and scripts.

## Alternatives Considered

- Keep both sections and only reword the docs. Rejected because the user's
  complaint is about the structure itself, not just the wording.
- Remove `Candidate Ideas` and reinterpret the remaining list as "possible
  future work." Rejected because milestone completion and roadmap-backed change
  scaffolding currently depend on `Planned Changes` meaning approved executable
  work.
- Rename `Planned Changes` to a new heading such as `Milestone Work`. Rejected
  for now because it adds churn across scripts, skills, docs, and examples
  without solving a distinct product problem beyond removing `Candidate Ideas`.
