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

### Requirement: roadmap-plan-confirms-milestone-structure-before-writing
Before `roadmap-plan` creates or substantially restructures roadmap
artifacts, it MUST converge with the user on milestone boundaries, stage goals,
and completion criteria, then confirm the intended roadmap shape before writing
files.

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

### Requirement: propose-validates-artifacts-before-finish
Before completing, `spec-driven-propose` MUST run `verify`, repair any safe-to-fix
artifact format issues, and rerun validation. If any non-question error remains, it
MUST report the problem to the user instead of presenting the proposal as ready.

### Requirement: spec-content-classifies-spec-targets-from-index
`spec-driven-spec-content` MUST read `.spec-driven/specs/INDEX.md` before deciding
where requested spec content belongs. It MUST classify the request into one of:
editing an existing spec file, adding a new file under an existing category,
adding a new category with a new file, modifying existing requirements, or
removing existing requirements.

### Requirement: spec-content-loads-relevant-main-specs-before-editing
After reading `INDEX.md`, `spec-driven-spec-content` MUST read the relevant main
spec file or files before editing any delta spec content. If a matching delta spec
file already exists under `changes/<name>/specs/`, it MUST read that file too
before appending or revising content.

### Requirement: spec-content-validates-and-names-removals
After editing delta specs, `spec-driven-spec-content` MUST run the workflow
verification step and fix any safe-to-repair format issues before finishing. If a
verify result contains only non-format workflow blockers such as open questions,
the skill MUST surface them separately and MUST NOT misreport them as spec-format
failures. If a request removes behavior, the skill MUST name the exact
`### Requirement:` heading or headings being removed and place them under
`## REMOVED Requirements` with a reason; it MUST NOT describe removals vaguely.

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
