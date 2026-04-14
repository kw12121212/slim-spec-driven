---
mapping:
  implementation:
    - .spec-driven/specs/README.md
    - skills/spec-driven-init/SKILL.md
    - skills/spec-driven-propose/SKILL.md
    - skills/spec-driven-brainstorm/SKILL.md
    - skills/spec-driven-modify/SKILL.md
    - skills/spec-driven-spec-edit/SKILL.md
    - skills/spec-driven-sync-specs/SKILL.md
    - skills/spec-driven-resync-code-mapping/SKILL.md
    - skills/roadmap-plan/SKILL.md
    - skills/roadmap-milestone/SKILL.md
    - skills/roadmap-recommend/SKILL.md
    - skills/roadmap-propose/SKILL.md
    - skills/roadmap-sync/SKILL.md
    - scripts/spec-driven.ts
  tests:
    - test/run.js
    - test/validate-skills.ts
---

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

### Requirement: roadmap-planning-skills-may-delegate-analysis-only-subtasks
`roadmap-plan`, `roadmap-milestone`, and `roadmap-recommend` MAY delegate
bounded analysis-only subtasks to a sub-agent after the parent agent has
identified the concrete question that needs sidecar help.

Allowed delegated work includes:
- summarizing roadmap, spec, or repository context
- comparing candidate changes or milestone structures
- identifying likely affected spec paths or repository files
- drafting candidate open questions or alternative options for the parent agent
  to evaluate

Those skills MUST keep the following work in the parent agent:
- any user-facing confirmation checkpoint
- selecting the final recommended change, milestone structure, or proposal
  scope presented as the skill result
- scaffolding `.spec-driven/changes/<name>/`
- writing or updating the final proposal artifacts under `.spec-driven/`

#### Scenario: roadmap-recommend-uses-sidecar-analysis-but-keeps-scaffolding-local
- GIVEN `roadmap-recommend` wants help comparing planned change candidates
- WHEN it delegates that comparison to a sub-agent
- THEN the parent agent still chooses what recommendation to present
- AND it still waits for explicit user confirmation before scaffolding

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

### Requirement: brainstorm-confirms-before-scaffolding
Before creating any files, `spec-driven-brainstorm` MUST propose a kebab-case
change name and summarize the intended change for explicit user confirmation. It
MUST NOT scaffold proposal artifacts until that confirmation is received.

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
MUST ask the user whether to enter `/spec-driven-auto` to execute the proposal or
continue modifying the proposal artifacts with `/spec-driven-modify`. It MUST NOT
auto-enter auto without the user's explicit choice.

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

### Requirement: planning-skills-preserve-spec-mapping-frontmatter
When planning skills create or modify spec delta files for existing spec paths,
they MUST preserve relevant mapping frontmatter when known. If the expected
implementation or test files are clear from repository context, planning skills
SHOULD include them in `mapping.implementation` and `mapping.tests`.

If the expected mappings are unclear at proposal time, planning skills MAY leave
mapping completion to `spec-driven-apply`, but they MUST NOT invent file paths.

#### Scenario: proposal-includes-known-mapped-files
- GIVEN a proposal clearly affects an existing script and test runner
- WHEN a planning skill writes the delta spec file
- THEN it includes mapping frontmatter for the known implementation and test
  files

### Requirement: proposal-authoring-skills-embed-canonical-delta-spec-samples
When `spec-driven-propose`, `spec-driven-brainstorm`, `spec-driven-modify`,
`roadmap-propose`, or `roadmap-recommend` instruct the agent to create or edit
delta spec files under `.spec-driven/changes/<name>/specs/`, they MUST include a
copyable canonical delta spec sample directly in the skill instructions.

That sample MUST show:
- YAML frontmatter using `mapping.implementation` and `mapping.tests`
- the mirrored delta-spec path shape relative to `.spec-driven/specs/`
- `## ADDED Requirements`, `## MODIFIED Requirements`, and
  `## REMOVED Requirements` section markers
- `### Requirement:` headings
- a `Previously:` line inside a modified requirement block
- a removal reason inside a removed requirement block
- omission of empty sections rather than leaving blank placeholders

The skill instructions MUST also tell the agent not to create a prose-only delta
spec file and not to invent mapping paths when repository evidence is unclear.

#### Scenario: proposal-skill-includes-copyable-delta-spec-example
- GIVEN a planning skill is about to direct the agent to write a delta spec
- WHEN the skill describes the required delta spec format
- THEN it includes a copyable example showing the canonical section markers and
  requirement block structure
- AND the example includes a `Previously:` line for modified requirements
- AND the example includes a removal reason for removed requirements

### Requirement: spec-authoring-readme-documents-canonical-delta-spec-format
The repository's `.spec-driven/specs/README.md` MUST document the canonical
change delta spec format separately from the main spec format so humans and
agents can reference the same example outside the skill prompts.

That README guidance MUST include:
- when to use delta specs under `.spec-driven/changes/<name>/specs/`
- a copyable sample file showing ADDED, MODIFIED, and REMOVED sections
- a note that empty sections are omitted
- a note that `Previously:` belongs in modified requirement blocks
- a note that removed requirement blocks include a reason

#### Scenario: readme-shows-delta-spec-example
- GIVEN a user or agent opens `.spec-driven/specs/README.md`
- WHEN they look for change-authoring guidance
- THEN they can find a dedicated delta spec example separate from the main spec
  format example

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

### Requirement: sync-specs-maintains-main-spec-mappings
`spec-driven-sync-specs` and direct spec editing workflows MUST update mapping
frontmatter when they edit spec files. If sync detects that code behavior has
moved to a different implementation or test file, the mapping must be updated
with the spec change.

#### Scenario: sync-specs-updates-moved-implementation-path
- GIVEN current code behavior moved from one implementation file to another
- WHEN `spec-driven-sync-specs` updates the affected spec artifact
- THEN the spec mapping points to the current implementation file

### Requirement: resync-code-mapping-repairs-existing-spec-mappings
`spec-driven-resync-code-mapping` MUST retrofit and repair mapping frontmatter for
existing main spec files without entering the normal change lifecycle. It MUST
read `.spec-driven/config.yaml`, `.spec-driven/specs/INDEX.md`, and the target
main spec files, then run the CLI mapping validator before deciding what mapping
repairs to propose.

The skill MUST inspect relevant repository files before proposing mapping
changes. It MUST separate implementation mappings from test mappings, present
the proposed frontmatter changes to the user, and wait for explicit
confirmation before editing spec files.

After building a confident candidate mapping for a target spec, the skill MUST
use the CLI audit command when available to compare the candidate evidence set
against the spec's current mapping before presenting edits to the user.

After confirmation, it MAY edit mapping frontmatter and mapping format only. It
MUST NOT change implementation files or rewrite requirement behavior. If it
detects behavior/spec drift that requires requirement changes, it MUST recommend
`spec-driven-sync-specs`, `spec-driven-spec-edit`, or the normal change
workflow instead of silently changing requirements.

#### Scenario: resync-code-mapping-fixes-legacy-spec-without-frontmatter
- GIVEN an existing main spec file has no mapping frontmatter
- WHEN `spec-driven-resync-code-mapping` runs and the user confirms the proposed mapping
- THEN the skill adds `mapping.implementation` and `mapping.tests` frontmatter
- AND it does not change requirement bodies or implementation files

#### Scenario: resync-code-mapping-corrects-stale-mapping
- GIVEN a spec file maps a path that no longer exists or is no longer relevant
- WHEN `spec-driven-resync-code-mapping` confirms a replacement mapping with the user
- THEN it updates the mapping frontmatter to current implementation and test paths
- AND reruns the CLI mapping validator

#### Scenario: resync-code-mapping-audits-candidate-mapping-before-edit
- GIVEN the skill has inferred candidate implementation and test evidence for a
  target spec
- WHEN it prepares the proposed mapping edits
- THEN it runs the CLI audit command with that explicit evidence set before
  asking the user to confirm the edit
- AND it uses the audit output to highlight missing or extra mapping entries

#### Scenario: resync-code-mapping-defers-behavior-drift
- GIVEN mapping repair reveals that the current requirement behavior is stale
  relative to code
- WHEN `spec-driven-resync-code-mapping` reports its findings
- THEN it recommends the appropriate spec synchronization or change workflow
- AND it does not rewrite requirement behavior as part of mapping repair

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
