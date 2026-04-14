# Design: add-delta-spec-format-samples

## Approach

Treat this as a planning-guidance change rather than a CLI change. Add one new
planning requirement that proposal-authoring skills must embed a copyable delta
spec sample, then update the relevant skills to include the same canonical
example and format notes.

Mirror that same example in `.spec-driven/specs/README.md` so the repository has
one human-readable reference outside the skill prompts. Add regression coverage
where practical so later edits do not silently remove or weaken the example.

For the separate test-suite issue, remove the dedicated `install.sh` section
from `test/run.js` rather than changing installer behavior. That keeps the code
change minimal and aligns the test suite with the requested scope.

## Key Decisions

- Put the canonical sample directly in the skill prompts instead of relying on a
  README lookup. The failure happens while the agent is generating artifacts, so
  the example needs to be present at the point of use.
- Keep `verify` strict. The problem is missing guidance, not excessive
  validation.
- Scope the change to proposal-authoring and delta-spec editing planning skills.
  Execution-only skills stay out of scope unless future evidence shows they need
  their own standalone sample.
- Keep one canonical example shape across skills and README to reduce drift.
- Remove installer coverage by deleting the standalone test section instead of
  weakening unrelated assertions elsewhere in the suite.

## Alternatives Considered

- Relax `verify` so malformed delta specs pass more often.
  Rejected because the repository benefits from strict structure checks; the
  issue is that agents need a better target to generate toward.
- Change `spec-driven.js propose` to preseed delta spec sample files.
  Rejected for this change because the requested scope is guidance-oriented and
  can be improved without modifying the CLI scaffold.
- Document the format only in `.spec-driven/specs/README.md`.
  Rejected because agents may not consult that file at the exact moment they are
  writing delta specs unless the skill also surfaces the example inline.
- Change `install.sh` to satisfy the existing tests.
  Rejected because the user explicitly asked not to test `install.sh`; removing
  that test coverage is the smaller and clearer change.
