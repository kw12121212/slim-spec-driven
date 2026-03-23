## ADDED Requirements

### Requirement: propose-fills-questions
`spec-driven-propose` MUST populate `questions.md` with any open questions the AI has about the change — ambiguities, missing context, scope uncertainties, or decisions that need human input. If there are no questions, it MUST write "No open questions." under `## Open`.

### Requirement: apply-blocks-on-open-questions
`spec-driven-apply` MUST check `questions.md` for open questions before implementing.
If open questions exist, it MUST list them and stop — the user must resolve questions before implementation proceeds.

### Requirement: verify-checks-questions
`spec-driven-verify` MUST check `questions.md` for open questions.
Open questions MUST be reported as CRITICAL issues that block archiving.

### Requirement: modify-supports-questions
`spec-driven-modify` MUST include `questions.md` as a modifiable artifact,
allowing users to answer questions by editing the file.

## MODIFIED Requirements

### Requirement: propose-scaffolds-change
`spec-driven-propose` MUST scaffold a new change with all five artifacts
(`proposal.md`, `specs/` directory, `design.md`, `tasks.md`, `questions.md`) populated from project context.
It MUST NOT modify any codebase files — planning only.
Ambiguities MUST be recorded as open questions in `questions.md`, not as inline `[NEEDS CLARIFICATION]` markers.

Previously: Scaffolded four artifacts (no `questions.md`). Used `[NEEDS CLARIFICATION]` inline markers for ambiguities.

### Requirement: apply-implements-in-order
`spec-driven-apply` MUST check `questions.md` for open questions before implementing — if any exist, stop and ask the user to resolve them.
It MUST implement tasks in order, marking each `- [x]` immediately upon completion.
It MUST load all five artifacts and main specs before writing code,
and MUST update delta files in `changes/<name>/specs/` to reflect what was actually implemented.

Previously: Checked for `[NEEDS CLARIFICATION]` markers instead of questions.md.

### Requirement: verify-tiered-report
`spec-driven-verify` MUST output a tiered report: CRITICAL / WARNING / SUGGESTION.
CRITICAL issues block archiving. Checks include artifact format (via verify.js),
implementation evidence, delta spec accuracy, spec alignment, and open questions in questions.md.

Previously: Checked for `[NEEDS CLARIFICATION]` markers instead of questions.md.
