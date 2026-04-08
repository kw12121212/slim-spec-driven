# Skills Planning

### Requirement: init-bootstraps-or-repairs-workflow-scaffold
`spec-driven-init` MUST create `.spec-driven/` with `config.yaml`,
`.spec-driven/roadmap/INDEX.md`, `.spec-driven/roadmap/milestones/`,
`specs/INDEX.md`, and `specs/README.md` when the workflow is absent.
If `.spec-driven/` already exists, it MUST create any missing scaffold files and
directories, including the roadmap scaffold, and regenerate `specs/INDEX.md`
without overwriting existing files.

### Requirement: init-drafts-context-and-captures-current-behavior
After initialization, `spec-driven-init` MUST help draft a concise `context` value in
`.spec-driven/config.yaml` from existing project files and MAY help the user seed
initial current-state specs under `.spec-driven/specs/`.

### Requirement: roadmap-skills-read-roadmap-context-before-editing
`roadmap-plan`, `roadmap-milestone`, and `roadmap-sync` MUST read
`.spec-driven/config.yaml`, existing
`.spec-driven/roadmap/INDEX.md` and relevant milestone files when present, and
the active or archived changes needed to understand current execution state
before they decide what roadmap updates to make.

Those skills MUST also surface the legal roadmap status enums directly in their
instructions before editing roadmap assets so the AI can use the legal values
without inferring them from separate spec files.

When legacy milestone migration is in scope, `roadmap-plan` MUST also treat the
existing milestone wording itself as migration evidence and use that evidence to
preserve intent conservatively while rewriting the file. That includes reading
legacy section labels and nearby prose as evidence for whether content should
map into `## Planned Changes`, `## Dependencies`, `## Risks`, `## In Scope`,
`## Out of Scope`, or `## Notes`.

### Requirement: roadmap-plan-confirms-milestone-structure-before-writing
Before `roadmap-plan` creates or substantially restructures roadmap
artifacts, it MUST converge with the user on milestone boundaries, stage goals,
and completion criteria, then confirm the intended roadmap shape before writing
files.

If the roadmap contains legacy milestone files that need migration, that
confirmation step MUST also cover any non-obvious content reinterpretation the
skill plans to make while rewriting those milestones into the canonical format,
including how it will handle older sections such as `## Candidate Ideas`,
combined `## Dependencies / Risks`, or missing scope and notes sections.

### Requirement: roadmap-propose-reads-roadmap-and-spec-context-before-writing
`roadmap-propose` MUST read `.spec-driven/config.yaml`,
`.spec-driven/roadmap/INDEX.md`, the relevant milestone file, and
`.spec-driven/specs/INDEX.md` before it scaffolds a change.

Before it asks the AI to interpret milestone or planned change status values,
`roadmap-propose` MUST surface the legal roadmap status enums directly in its
instructions rather than assuming the AI will infer them from main specs or
validator behavior.

`roadmap-propose` MUST treat planned change entries as single-line roadmap input
in the canonical format
`- \`<change-name>\` - Declared: <status> - <summary>` when reading milestone
context. It MUST resolve the target change from the ``<change-name>`` portion
and MUST NOT rely on the declared status or trailing summary text as part of the
planning context.

### Requirement: roadmap-propose-creates-standard-change-artifacts
`roadmap-propose` MUST create the same five artifacts as
`spec-driven-propose`: `proposal.md`, `specs/`, `design.md`, `tasks.md`, and
`questions.md`. It MUST NOT implement product code while doing so.

Its `tasks.md` output MUST include a `## Testing` section with at least one
explicit lint or validation command task and one explicit unit test command
task when the commands are knowable from repository context.

If roadmap and repository context do not make the commands clear,
`roadmap-propose` MUST add an open question instead of inventing commands.

### Requirement: roadmap-propose-offers-execution-handoff-choice
After presenting the new change and any open questions, `roadmap-propose`
MUST ask the user whether to enter the stepwise execution path with
`/spec-driven-apply <name>` or the end-to-end execution path with
`/spec-driven-auto`. It MUST NOT auto-enter either execution path without the
user's explicit choice.

### Requirement: roadmap-recommend-reads-roadmap-context-before-recommending
`roadmap-recommend` MUST read `.spec-driven/config.yaml`,
`.spec-driven/roadmap/INDEX.md`, the relevant milestone files, and
`.spec-driven/specs/INDEX.md` before it recommends a change.

Before it asks the AI to interpret milestone or planned change status values,
`roadmap-recommend` MUST surface the legal roadmap status enums directly in its
instructions rather than assuming the AI will infer them from main specs or
validator behavior.

`roadmap-recommend` MUST treat planned change entries as single-line roadmap
input in the canonical format
`- \`<change-name>\` - Declared: <status> - <summary>` when reading milestone
context. It MUST resolve the candidate change from the ``<change-name>`` portion
and MUST NOT rely on the declared status or trailing summary text as part of the
recommendation context.

### Requirement: roadmap-authoring-skills-default-new-planned-changes-to-planned
`roadmap-plan` and `roadmap-milestone` MUST write planned change entries in the
canonical format `- \`<change-name>\` - Declared: <status> - <summary>`.

Those skills MUST explicitly describe the legal milestone declared status enum
as `proposed`, `active`, `blocked`, or `complete`, and the legal planned change
declared status enum as `planned` or `complete`, before they write or revise
roadmap content.

When those skills add a new planned change, or rewrite an existing planned
change that is not yet archived, they MUST use `Declared: planned`. They MUST
NOT invent other per-change status labels.

When `roadmap-sync` rewrites milestone files from repository evidence, it MUST
set archived planned changes to `Declared: complete` and all other planned
changes to `Declared: planned`.

### Requirement: roadmap-recommend-confirms-before-scaffolding
`roadmap-recommend` MUST recommend a candidate change name and explain the
reasoning, summarize the intended roadmap-backed change, and wait for the user
to accept or modify the recommendation before it scaffolds proposal artifacts.

If the recommendation discussion reveals one or more open questions that affect
scope, behavior, or other proposal-shaping decisions, `roadmap-recommend` MUST
surface those questions and obtain explicit user answers or confirmation before
it scaffolds proposal artifacts.

For each such open question, `roadmap-recommend` MUST present a structured
user-facing block with the fields `Question`, `Explanation`, `Impact`, and
`Recommendation`.

`Explanation` MUST clarify why the issue is unresolved or why the skill cannot
finish shaping the proposal without a user decision. `Impact` MUST describe
what part of the proposal scope, behavior, or next step depends on that answer.
`Recommendation` MUST state the skill's suggested resolution, if any.

`roadmap-recommend` MAY recommend a preferred answer, but it MUST present that
recommendation as a suggestion only. It MUST NOT treat its own recommendation as
the resolved answer or continue to scaffolding until the user has explicitly
confirmed the resolution.

### Requirement: roadmap-recommend-produces-standard-change-artifacts
After confirmation, `roadmap-recommend` MUST create the same five artifacts as
`spec-driven-propose`: `proposal.md`, `specs/`, `design.md`, `tasks.md`, and
`questions.md`. It MUST follow the same validation standard as
`roadmap-propose` and MUST NOT implement product code while doing so.

Its `tasks.md` output MUST include a `## Testing` section with at least one
explicit lint or validation command task and one explicit unit test command
task when the commands are knowable from repository context.

If roadmap and repository context do not make the commands clear,
`roadmap-recommend` MUST add an open question instead of inventing commands.

### Requirement: roadmap-recommend-offers-execution-handoff
After presenting the new change and any open questions, `roadmap-recommend`
MUST ask the user whether to enter the stepwise execution path with
`/spec-driven-apply <name>` or the end-to-end execution path with
`/spec-driven-auto`. It MUST NOT auto-enter either execution path without the
user's explicit choice.

### Requirement: propose-scaffolds-five-artifacts
`spec-driven-propose` MUST scaffold a new change with `proposal.md`, `specs/`,
`design.md`, `tasks.md`, and `questions.md`, populated from project context.
It MUST NOT modify implementation code while proposing.

When it writes `tasks.md`, it MUST include a `## Testing` section with at least:
- one lint or validation task written as an explicit runnable command when the repository
  command is knowable from project context
- one unit test task written as an explicit runnable command when the repository
  command is knowable from project context

If the relevant command cannot be determined confidently from repository
context, `spec-driven-propose` MUST record that ambiguity in `questions.md`
instead of guessing.

### Requirement: propose-derives-name-and-hands-off-without-confirmation
`spec-driven-propose` MUST use a user-provided valid kebab-case change name when
one exists. If the user does not provide one, it MUST derive a short kebab-case
change name from the request and the proposal scope rather than stopping to ask
for a name.

During proposal creation, `spec-driven-propose` MUST NOT ask follow-up questions
or require a proposal-stage confirmation checkpoint. It MUST record unresolved
ambiguity in `questions.md` and hand that ambiguity off to `/spec-driven-apply`.

After generating the proposal artifacts, `spec-driven-propose` MUST present the
result as ready without requiring a post-proposal confirmation checkpoint. It
MUST summarize any open questions as inputs for `/spec-driven-apply` to surface
and block on at implementation start, and it MAY mention `/spec-driven-modify`
only as an optional path when the user wants to revise the proposal.

### Requirement: brainstorm-converges-before-proposing
`spec-driven-brainstorm` MUST accept a rough idea without requiring a change name
up front. It MUST read `.spec-driven/config.yaml`, `.spec-driven/specs/INDEX.md`,
and each relevant main spec file before locking scope. It MUST help the user
converge on goal, scope, non-goals, unchanged behavior, and likely spec impact
before generating proposal artifacts.

During proposal creation, `spec-driven-brainstorm` MUST NOT ask follow-up
questions or require a pre-scaffolding confirmation checkpoint. It MUST derive
the best available proposal from the request and repository context, and record
remaining ambiguity in `questions.md` for `/spec-driven-apply`.

### Requirement: brainstorm-derives-name-and-scaffolds-without-confirmation
Before creating any files, `spec-driven-brainstorm` MUST derive a kebab-case
change name from the request and proposal scope when the user has not already
provided one. It MUST NOT require an explicit pre-scaffolding user confirmation
checkpoint before creating proposal artifacts.

### Requirement: brainstorm-produces-the-same-proposal-artifacts
`spec-driven-brainstorm` MUST generate the same five planning
artifacts as `spec-driven-propose`, follow the same delta-spec formatting rules,
record unresolved ambiguity in `questions.md`, and run `verify` before presenting
the proposal as ready.

Its `tasks.md` output MUST follow the same testing minimum as
`spec-driven-propose`: a `## Testing` section with explicit lint or validation
and unit test tasks written as runnable commands when those commands are
knowable from project context.

### Requirement: brainstorm-offers-auto-handoff
After presenting the proposal and listing open questions, `spec-driven-brainstorm`
MUST mention `/spec-driven-auto` as the end-to-end execution path and
`/spec-driven-modify` as the revision path. It MUST NOT auto-enter either path
without the user's explicit choice.

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

### Requirement: sync-specs-reads-spec-context-before-judging-drift
`spec-driven-sync-specs` MUST read `.spec-driven/config.yaml`,
`.spec-driven/specs/INDEX.md`, and each relevant main spec file before deciding
that repository behavior has drifted from the specs.

### Requirement: sync-specs-supports-repository-or-scoped-scans
`spec-driven-sync-specs` MUST support either a repository-wide scan or a
user-limited scoped scan for a specific directory, module, or feature area. When
the user chooses a scoped scan, the skill MUST limit its findings and proposed
spec updates to that declared scope and MUST NOT imply repository-wide coverage.

### Requirement: sync-specs-creates-a-dedicated-spec-only-change
When `spec-driven-sync-specs` finds confirmed code-to-spec drift, it MUST create
or update a dedicated change containing `proposal.md`, `design.md`, `tasks.md`,
`questions.md`, and delta spec files aligned with `.spec-driven/specs/`. It MUST
NOT edit `.spec-driven/specs/` main spec files directly.

### Requirement: sync-specs-turns-evidence-into-delta-specs-and-questions
`spec-driven-sync-specs` MUST read the selected code, tests, and nearby
documentation as evidence of current observable behavior, then translate
confirmed gaps into delta spec files. If the behavior or target spec path is
ambiguous, it MUST record that ambiguity in `questions.md` instead of guessing.

### Requirement: sync-specs-reports-findings-in-chat
After preparing the sync change and running workflow verification,
`spec-driven-sync-specs` MUST present a concise in-chat summary that identifies
the scan scope, confirmed gaps, affected delta spec files, and unresolved
questions. It MUST NOT require or create a standalone report artifact.

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

### Requirement: modify-validates-after-editing
After modifying any change artifact, `spec-driven-modify` MUST run the
workflow verification step via the CLI `verify` command. It MUST fix any
safe-to-repair format issues immediately and rerun `verify`. If a verify
result contains only non-format workflow blockers such as open questions,
the skill MUST surface them separately and MUST NOT misreport them as
spec-format failures. If a request removes spec behavior, the skill MUST
name the exact `### Requirement:` heading or headings being removed and
place them under `## REMOVED Requirements` with a reason; it MUST NOT
describe removals vaguely.

### Requirement: spec-edit-reads-index-before-choosing-target
`spec-driven-spec-edit` MUST read `.spec-driven/specs/INDEX.md` and the relevant
main spec files before deciding which spec file to create or modify. It MUST
prefer existing categories and files unless the content clearly requires a new
path.

### Requirement: spec-edit-edits-main-specs-directly
`spec-driven-spec-edit` MUST edit `.spec-driven/specs/` main spec files directly.
It MUST NOT create or interact with `.spec-driven/changes/` delta spec files.

### Requirement: spec-edit-updates-index-on-structural-changes
When `spec-driven-spec-edit` creates a new spec file or category under
`.spec-driven/specs/`, it MUST update `.spec-driven/specs/INDEX.md` to include
the new entry.

### Requirement: spec-edit-describes-observable-behavior-only
When `spec-driven-spec-edit` writes or modifies requirements, it MUST describe
observable behavior only, not implementation details.

### Requirement: spec-edit-handles-removals-explicitly
When `spec-driven-spec-edit` removes requirements, it MUST identify the exact
`### Requirement:` heading or headings being removed and delete them cleanly.
It MUST NOT leave orphaned headings or vague remnants.

### Requirement: spec-edit-confirms-before-writing
`spec-driven-spec-edit` MUST present the planned modifications — which files
will be changed and what the new content will look like — and wait for
explicit user confirmation before writing anything to disk. It MUST NOT
silently modify spec files.

### Requirement: spec-edit-is-planning-layer-only
`spec-driven-spec-edit` is a planning/documentation skill. It MUST NOT
implement product code changes.
