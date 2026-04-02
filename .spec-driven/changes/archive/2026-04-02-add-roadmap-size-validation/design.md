# Design: add-roadmap-size-validation

## Approach

Add a new script command:

```bash
node dist/scripts/spec-driven.js verify-roadmap [path]
```

The command should inspect `.spec-driven/roadmap/milestones/*.md`, parse a small
set of standard milestone sections, and emit JSON:

```json
{
  "valid": false,
  "warnings": [],
  "errors": ["milestones/m1-foundation.md has 6 planned changes; split it into smaller milestones"],
  "milestones": [...]
}
```

To keep the check objective and scriptable, milestone files will be validated
against standard headings:
- `## Goal`
- `## Done Criteria`
- `## Candidate Ideas`
- `## Planned Changes`
- `## Dependencies / Risks`
- `## Status`

The first enforced size limit should be strict and simple:
- `Planned Changes` MUST contain no more than 5 bullet items

Roadmap skills will run `verify-roadmap` after editing roadmap files. If the
result contains oversize errors, they must stop and tell the user to split the
milestone rather than presenting the roadmap as ready.

## Key Decisions

- Add a dedicated `verify-roadmap` command instead of overloading `verify
  <change-name>`. Change artifacts and roadmap assets are different scopes and
  should have separate validators.
- Enforce standard milestone section headings so the script has a stable format
  to inspect.
- Make `Planned Changes > 5` a hard error. This is the clearest proxy for an
  oversized milestone and directly controls stage execution size.
- Keep `Candidate Ideas` unconstrained for now at the script level. They can
  grow, but they do not directly define milestone completion or execution load.

## Alternatives Considered

- Rely only on skill wording. Rejected because it does not produce a durable,
  checkable repository rule.
- Add milestone sizing as a warning only. Rejected because the user explicitly
  wants the AI to be told the milestone is too large and should be split.
- Extend `verify <change-name>` to validate roadmap files. Rejected because that
  command is scoped to change artifacts and takes a change name, not a project
  path.
