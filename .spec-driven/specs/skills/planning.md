# Skills Planning

### Requirement: init-bootstraps-or-repairs-workflow-scaffold
`spec-driven-init` MUST create `.spec-driven/` with `config.yaml`, `specs/INDEX.md`,
and `specs/README.md` when the workflow is absent.
If `.spec-driven/` already exists, it MUST create any missing scaffold files and
regenerate `specs/INDEX.md` without overwriting existing files.

### Requirement: init-drafts-context-and-captures-current-behavior
After initialization, `spec-driven-init` MUST help draft a concise `context` value in
`.spec-driven/config.yaml` from existing project files and MAY help the user seed
initial current-state specs under `.spec-driven/specs/`.

### Requirement: propose-scaffolds-five-artifacts
`spec-driven-propose` MUST scaffold a new change with `proposal.md`, `specs/`,
`design.md`, `tasks.md`, and `questions.md`, populated from project context.
It MUST NOT modify implementation code while proposing.

### Requirement: brainstorm-converges-before-proposing
`spec-driven-brainstorm` MUST accept a rough idea without requiring a change name
up front. It MUST read `.spec-driven/config.yaml`, `.spec-driven/specs/INDEX.md`,
and each relevant main spec file before locking scope. It MUST help the user
converge on goal, scope, non-goals, unchanged behavior, and likely spec impact
before generating proposal artifacts.

### Requirement: brainstorm-confirms-before-scaffolding
Before creating any files, `spec-driven-brainstorm` MUST propose a kebab-case
change name and summarize the intended change for explicit user confirmation. It
MUST NOT scaffold proposal artifacts until that confirmation is received.

### Requirement: brainstorm-produces-the-same-proposal-artifacts
After confirmation, `spec-driven-brainstorm` MUST generate the same five planning
artifacts as `spec-driven-propose`, follow the same delta-spec formatting rules,
record unresolved ambiguity in `questions.md`, and run `verify` before presenting
the proposal as ready.

### Requirement: propose-reads-context-before-writing
Before filling a proposal, `spec-driven-propose` MUST read `.spec-driven/config.yaml`,
`.spec-driven/specs/INDEX.md`, and each relevant main spec file needed to understand
the current requirements the proposal is changing.

### Requirement: propose-records-ambiguity-in-questions
`spec-driven-propose` MUST record unclear scope, requirements, or decisions in
`questions.md`. It MUST NOT use inline ambiguity markers in other artifacts.

### Requirement: propose-populates-valid-delta-specs
`spec-driven-propose` MUST populate delta specs under `changes/<name>/specs/`,
mirroring `.spec-driven/specs/` by path and using the standard requirement format.
If a change has no observable spec impact, it MAY leave `changes/<name>/specs/` empty,
but it MUST NOT create prose-only placeholder files that do not follow the delta spec format.

### Requirement: propose-validates-artifacts-before-finish
Before completing, `spec-driven-propose` MUST run `verify`, repair any safe-to-fix
artifact format issues, and rerun validation. If any non-question error remains, it
MUST report the problem to the user instead of presenting the proposal as ready.

### Requirement: modify-preserves-completed-task-state
`spec-driven-modify` MUST NOT uncheck completed tasks (`- [x]`) unless the user
explicitly requests it.

### Requirement: modify-loads-main-spec-context-for-spec-edits
If a `spec-driven-modify` request affects `changes/<name>/specs/`, it MUST read
`.spec-driven/config.yaml`, `.spec-driven/specs/INDEX.md`, and each relevant main
spec file before editing the delta specs.

### Requirement: modify-preserves-delta-spec-format
When `spec-driven-modify` edits delta specs, it MUST keep those files aligned by path
with `.spec-driven/specs/`, preserve requirement headings and delta sections, and
describe observable behavior only rather than implementation details.

### Requirement: modify-supports-question-management
`spec-driven-modify` MUST allow editing `questions.md`, including adding new open
questions under `## Open` and moving answered questions to `## Resolved` with an
`A:` answer line.
