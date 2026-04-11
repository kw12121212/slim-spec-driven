# spec-driven

A lightweight spec-driven development framework: 21 agent skills + thin TypeScript scaffolding.

**[中文说明](README.zh.md)**

## How It Helps AI Programming

AI coding agents are capable but tend to drift — they lose track of existing behavior, expand scope, make inconsistent decisions, and leave no record of why things were built a certain way. spec-driven addresses this with four layers of structure.

### Layer 1: `specs/` — the system's long-term memory

Instead of reading the entire codebase to understand what the system does, the AI reads `specs/`:

- `INDEX.md` navigates the full spec collection at a glance
- Each spec file describes observable behavior using RFC 2119 format (`### Requirement:`, GIVEN/WHEN/THEN scenarios)
- `brainstorm`, `propose`, `apply`, `modify`, `sync-specs`, and `resync-code-mapping` are required to read INDEX.md and the relevant spec files before generating anything
- Spec files can declare related implementation and test files in frontmatter
  mappings, so agents can load the right code context without embedding
  implementation details in requirement prose

This prevents the AI from introducing conflicting or duplicate behavior — it knows what already exists.

### Layer 2: `roadmap/` — persistent long-horizon planning

When work spans multiple changes, the AI can maintain a roadmap under
`.spec-driven/roadmap/`:

- `INDEX.md` tracks milestone ordering at a glance
- Each milestone file defines a bounded stage with goal, done criteria,
  planned changes, dependencies, risks, and derived status
- Milestone completion is derived from archived planned changes, not manual
  toggles

This prevents long-range planning from collapsing into one oversized document or
getting lost in chat.

### Layer 3: change artifacts — structured context per change

Every change is a folder with five files, each serving a distinct purpose:

| File | Content | Effect on AI |
|------|---------|--------------|
| `proposal.md` | What & Why | Constrains the AI to the stated goal |
| `specs/` | Delta (ADDED/MODIFIED/REMOVED) | Makes spec intent explicit, not implicit |
| `design.md` | How — approach and decisions | Prevents the AI from reinventing the approach mid-task |
| `tasks.md` | `- [ ]` checklist | Controls pace — one task at a time, marked complete immediately |
| `questions.md` | Open/resolved Q&A | Centralizes ambiguities; propose may leave questions open, apply surfaces them as a structured blocker, and unresolved questions still block verify/archive |

### Layer 4: 21 skills — explicit constraints on AI behavior

Each skill is a precise prompt that specifies:
- Exactly which files to read (no vague "read the codebase")
- What to do and what not to do (`propose` does not touch code; `apply` marks tasks complete one at a time)
- Hard rules enforced by the verify script (spec format violations block archive)

The TypeScript CLI handles all filesystem operations; the AI handles content and judgment.

### Problems solved

| Problem | Solution |
|---------|----------|
| AI doesn't know existing system behavior | `specs/` with INDEX.md gives structured, navigable system state |
| AI expands scope | `proposal.md` defines explicit scope; `tasks.md` controls steps |
| AI does too much at once | `apply` enforces one task at a time, marked immediately |
| Specs drift from code over time | Delta specs travel with each change; archive force-merges them back |
| Spec-code relationships are unclear | Spec frontmatter maps each spec file to implementation and test files |
| Past decisions are lost | `design.md` records rationale; `archive/` preserves the full change history |
| Spec quality is inconsistent | RFC 2119 + Requirement/Scenario format enforced; violations are errors, not warnings |

---

## vs. OpenSpec

[OpenSpec](https://github.com/Fission-AI/OpenSpec/) is the most prominent project in this space (33K stars). The core idea is the same: a change folder with proposal, specs, design, and tasks. The differences are in enforcement and philosophy.

| | spec-driven | OpenSpec |
|--|-------------|----------|
| Spec format | RFC 2119 enforced — `### Requirement:` + MUST/SHOULD/MAY + GIVEN/WHEN/THEN; violations are script errors | No required format |
| AI reads existing specs | Explicit: `brainstorm`, `propose`, `apply`, `modify`, and `sync-specs` must read INDEX.md then every relevant spec file before generating anything | Not explicitly required |
| Delta spec structure | Mirrors `specs/` by path — `changes/<name>/specs/auth/login.md` maps to `specs/auth/login.md` | Not path-bound |
| Archive spec merge | Hard gate: merge each delta file by path into main `specs/` using ADDED/MODIFIED/REMOVED markers before moving | Specs updated on archive, no formal merge gate |
| Ambiguity tracking | `questions.md` centralizes open questions; propose can hand off with them, apply blocks on them with structured guidance, and unresolved questions still block verify/archive | Not built in |
| Runtime dependencies | Node.js stdlib only — one TypeScript CLI file | Global npm package (`npm install -g @fission-ai/openspec`, Node 20.19+) |
| Project-level AI rules | `config.yaml` rules injected into every skill prompt | None |
| Philosophy | Enforcement over flexibility — constraints are the point | Fluid, iterative, easy, scalable |
| Tool support | Any Agent Skills-compatible CLI (Claude Code, OpenCode, Trae, Codex, Gemini CLI) | 20+ AI assistants |

**When to use spec-driven**: you want the AI constrained by a spec standard it cannot silently ignore, and you're working in Claude Code or OpenCode.

**When to use OpenSpec**: you use multiple AI tools, prefer minimal process friction, or want a larger community.

---

## Quick Start

**Install via [skills.sh](https://skills.sh) (recommended — no extra files in your project):**
```bash
npx skills add kw12121212/auto-spec-driven
```

When prompted by `skills`, select the AI tools you actually use. For installation scope, prefer the shared/global option so you avoid duplicating skill files inside each project.

**From source (for development or live-edit):**
```bash
git clone https://github.com/kw12121212/auto-spec-driven ~/Code/auto-spec-driven
cd ~/Code/auto-spec-driven
npm install && npm run build

bash install.sh                                  # global, all CLIs
bash install.sh --cli claude                     # global, Claude Code only (~/.claude/skills/)
bash install.sh --cli opencode                   # global, OpenCode only (~/.config/opencode/skills/)
bash install.sh --cli trae                       # global, Trae only (~/.trae/skills/)
bash install.sh --cli codex                      # global, Codex via ~/.agents/skills/
bash install.sh --cli gemini                     # global, Gemini CLI via ~/.agents/skills/
bash install.sh --project                        # project-local in CWD
bash install.sh --project /path/to/project       # project-local at specified path
```

**CLI install targets:**

| `--cli` | Global | Project-local |
|---------|--------|---------------|
| `all` (default) | `~/.claude/skills/` + `~/.config/opencode/skills/` + `~/.trae/skills/` + `~/.agents/skills/` | `.claude/skills/` + `.opencode/skills/` + `.trae/skills/` + `.codex/skills/` + `.gemini/skills/` + `.agents/skills/` |
| `claude` | `~/.claude/skills/` | `.claude/skills/` |
| `opencode` | `~/.config/opencode/skills/` | `.opencode/skills/` |
| `trae` | `~/.trae/skills/` | `.trae/skills/` |
| `codex` | `~/.agents/skills/` | `.codex/skills/` |
| `gemini` | `~/.agents/skills/` | `.gemini/skills/` |

## Four Workflows

Choose based on the nature of your task:

| Scenario | Workflow | Command |
|----------|----------|---------|
| Small issue, clear scope | **auto** (one-shot) | `/spec-driven-auto add user avatar` |
| Regular ticket, defined requirements | **propose → apply → verify → review → archive** | `/spec-driven-propose` → `/spec-driven-apply` → ... |
| Quick fix, no formal change needed | **simple-task** | `/spec-driven-simple-task fix typo in README` |
| Existing code is ahead of specs | **sync-specs** | `/spec-driven-sync-specs` |
| Long-horizon planning across phases | **roadmap-plan → roadmap-milestone → roadmap-recommend → roadmap-sync** | `/roadmap-plan` → `/roadmap-milestone` → `/roadmap-recommend` → `/roadmap-sync` |
| Fuzzy concept, needs exploration | **brainstorm → auto** | `/spec-driven-brainstorm` → confirm → `/spec-driven-auto` |

### 1. Auto Workflow (Small Issues)

For small, well-scoped changes — single feature, few files, no cross-cutting concerns:

```bash
/spec-driven-auto add user avatar upload
```

Runs propose → apply → verify → review → archive with one mandatory proposal checkpoint plus any additional confirmations required by blockers such as open questions or empty-delta archive decisions. During verify, it conditionally runs mapping and unmapped-evidence audits when implementation or direct test evidence exists; during review, it reuses that audit result unless the reviewed evidence set changes. For vague scope, suggests brainstorm first, then auto.

### 2. Simple Task Workflow (Quick Fixes)

For ad-hoc work that doesn't warrant a formal change — debugging, documentation tweaks, config adjustments:

```bash
/spec-driven-simple-task fix the broken date format in utils.ts
```

This executes the task directly with spec context loaded, then assesses whether specs were affected. It never creates entries under `.spec-driven/changes/`. If the task is too large, ambiguous, or urgent, it redirects to the appropriate workflow. Completed tasks are logged to `.spec-driven/simple-tasks/YYYY-MM-DD-<name>.md`.

### 3. Standard Workflow (Regular Tickets)

For typical tasks with clear requirements but non-trivial implementation:

```
/spec-driven-propose add order tracking
/spec-driven-apply
/spec-driven-verify
/spec-driven-review
/spec-driven-archive
```

`/spec-driven-propose` can hand off a ready proposal without waiting for extra
confirmation, even if `questions.md` still contains open items. `/spec-driven-apply`
then surfaces those questions with explicit explanation, impact, and
recommendation, and waits for user resolution before working the task list.

Use `/spec-driven-modify` to adjust artifacts mid-flight, `/spec-driven-spec-edit` to directly create or modify main spec files, and `/spec-driven-sync-specs` when code has moved ahead of the specs and you need to catch them up.

Use `/roadmap-plan`, `/roadmap-milestone`, `/roadmap-recommend`, `/roadmap-propose`, and `/roadmap-sync` when you need a persistent milestone-based roadmap above individual changes. `roadmap-recommend` now behaves like a roadmap-specific brainstorm: after confirmation it scaffolds the accepted change directly, while `roadmap-propose` remains available as a direct path when the planned change is already chosen.

Analysis-heavy roadmap planning skills may use bounded sub-agent sidecars for
context synthesis or candidate comparison. Confirmation checkpoints, proposal
scaffolding, workflow-state writes, and the final recommendation stay with the
parent agent.

### 4. Sync Specs Workflow (Code Ahead of Spec)

For initialization and catch-up work when the repository already contains
behavior that the specs do not fully describe:

```bash
/spec-driven-sync-specs
/spec-driven-sync-specs scan the CLI only
```

This reads config and existing specs first, scans either the whole repository or
a requested scope, creates a dedicated spec-only change, and summarizes
confirmed gaps plus open questions in chat. It does not write product code and
does not create a standalone report file.

### 5. Brainstorm Workflow (Fuzzy Concepts)

For exploratory work where scope, approach, or even the problem itself is unclear:

```
/spec-driven-brainstorm improve task planning for large changes
```

This enters a discussion phase — reads context, helps narrow scope and tradeoffs, proposes a change name. After explicit confirmation, it generates the same five artifacts as `/spec-driven-propose`, then offers to enter `/spec-driven-auto` to execute or `/spec-driven-modify` to continue refining.

### 6. Roadmap Workflow (Milestone Planning)

For long-horizon planning that spans multiple changes and needs durable stage
boundaries:

```bash
/roadmap-plan
/roadmap-milestone
/roadmap-recommend
/roadmap-propose
/roadmap-sync
```

This creates and maintains `.spec-driven/roadmap/` as a milestone-based planning
layer. Milestones keep a single `Planned Changes` work list with single-line
entries in the form `- \`<change-name>\` - Declared: <planned|complete> - <summary>`,
`roadmap-recommend` now recommends the next roadmap-backed change and, after
explicit confirmation, scaffolds it directly into a normal change before asking
the user to choose between `apply` and `auto` for execution. `roadmap-propose`
remains available when the planned change is already known and the user wants
to skip the recommendation step. Completion is derived from whether the listed
planned changes are archived.

See [ROADMAP_GUIDE.md](ROADMAP_GUIDE.md) for concrete examples, mid-flight edit
patterns, and expected file-level effects.

---

## Full Workflow Reference

```
init → [roadmap-plan / roadmap-milestone / roadmap-recommend / roadmap-propose / roadmap-sync] → [brainstorm] → propose → apply → verify → review → archive → [ship]
        ↘ simple-task (outside the change lifecycle)
```

1. **init** — create `.spec-driven/` with config.yaml, roadmap/, specs/INDEX.md, and specs/
2. **brainstorm** — discuss a rough idea, converge on scope, and confirm a proposed change name before scaffolding
3. **propose** — read existing specs, scaffold all five artifacts, populate delta specs
4. **apply** — implement tasks one by one; update delta specs to match what was built
5. **verify** — check task completion, implementation evidence, spec format, and alignment
6. **review** — review the completed change for code quality before archive
7. **archive** — AI merges delta specs into `specs/` by file path and updates INDEX.md; the archive script then moves the change into `archive/`
8. **ship** — optionally commit and push the archived, reconciled change after all quality gates have completed

Use **roadmap-plan**, **roadmap-milestone**, **roadmap-recommend**, **roadmap-propose**, and **roadmap-sync** for persistent milestone planning above the change layer. Use **roadmap-recommend** when you want a roadmap-specific brainstorm that recommends the next change and, after confirmation, scaffolds it directly. Use **roadmap-propose** when the planned change is already chosen and you want to scaffold it immediately. Use **modify** to refine any artifact mid-flight. Use **spec-edit** to directly create or modify main spec files outside the change workflow. Use **sync-specs** when the repository already contains behavior that needs to be reflected back into the specs. Use **resync-code-mapping** when old specs need mapping frontmatter added or corrected. Use **cancel** to abandon a change.

Role split: use **resync-code-mapping** to repair legacy, stale, or malformed main-spec mappings; use **verify** to check whether the current change's mappings cover the implementation and test evidence it introduced or relied on; use **review** to flag mappings that would mislead future maintenance even if verification already passed.

## Skills

| Skill | What it does |
|-------|-------------|
| `/spec-driven-brainstorm` | Discuss a rough idea, converge on scope and a change name, then generate the full five-artifact proposal after confirmation |
| `/spec-driven-init` | Initialize `.spec-driven/` in a project and fill config.yaml |
| `/spec-driven-maintenance` | Inspect or run the manual maintenance workflow for explicitly configured safe auto-fixes |
| `/spec-driven-propose` | Read existing specs, scaffold a new change with all five artifacts |
| `/spec-driven-modify` | Edit an existing change artifact |
| `/spec-driven-spec-edit` | Directly create or modify individual main spec files under `.spec-driven/specs/` (confirm before writing) |
| `/spec-driven-sync-specs` | Scan code and existing specs for drift, create a dedicated spec-only change, and report the gaps in chat |
| `/spec-driven-resync-code-mapping` | Retrofit or repair spec frontmatter mappings between specs, implementation files, and test files |
| `/roadmap-plan` | Create or restructure `.spec-driven/roadmap/` into milestone files with explicit stage goals |
| `/roadmap-milestone` | Refine one milestone's goal, planned changes, risks, and derived status |
| `/roadmap-recommend` | Recommend the next roadmap-backed change, then after confirmation scaffold it directly and offer an explicit `apply` vs `auto` execution handoff |
| `/roadmap-propose` | Turn a milestone `Planned Changes` item into a normal change scaffold under `.spec-driven/changes/` when the planned change is already chosen |
| `/roadmap-sync` | Reconcile roadmap milestone status against active and archived changes |
| `/spec-driven-apply` | Implement tasks one by one, update delta specs when done |
| `/spec-driven-verify` | Check completion, implementation evidence, and spec alignment |
| `/spec-driven-review` | Review a completed change for code quality before archive |
| `/spec-driven-archive` | AI merges delta specs and updates INDEX.md; script moves the change into archive/ |
| `/spec-driven-cancel` | Permanently delete an in-progress change (with confirmation) |
| `/spec-driven-auto` | Run full workflow automatically (propose → apply → verify → review → archive) with one mandatory proposal checkpoint plus any additional blocker-driven confirmations. For vague scope, suggests brainstorm first. |
| `/spec-driven-ship` | Optionally commit and push an archived, roadmap-reconciled change after the normal workflow gates have completed. |
| `/spec-driven-simple-task` | Execute a lightweight ad-hoc task (debugging, docs, config tweaks) without the formal change lifecycle. Assesses spec impact afterward and logs to `.spec-driven/simple-tasks/`. |

### Auto Workflow

`/spec-driven-auto` is a convenience for well-defined single-repo changes:

```bash
/spec-driven-auto add user avatar upload
```

**Suitable when:**
- Scope is specific, bounded, and has a clear definition of done
- Change stays within a single repository
- Even if it is larger or cross-cutting, the work is still concrete enough to propose and execute automatically
- This can include schema migrations, auth/payment changes, and multi-subsystem changes when the scope is still well-defined

**Redirects to brainstorm when:**
- Scope is vague ("refactor the codebase")
- No clear definition of done
- Change requires multi-repo or multi-service coordination

After brainstorm produces a proposal, you can enter `/spec-driven-auto` to execute it.

The only mandatory checkpoint is after the proposal — everything else runs automatically unless blocked. Auto does not commit or push; use `/spec-driven-ship <name>` after archive when you want to ship the completed change.

When roadmap planning skills use sub-agents, they are intended as bounded
sidecars for analysis only. The parent agent still owns any confirmation gate,
workflow transition, or final recommendation presented to the user.

### Brainstorm Workflow

`/spec-driven-brainstorm` is the discussion-first entrypoint for fuzzy requests:

```bash
/spec-driven-brainstorm improve task planning for large changes
```

It reads project context and relevant specs, helps narrow scope and tradeoffs,
proposes a kebab-case change name, and waits for explicit confirmation before it
creates the same five proposal artifacts as `/spec-driven-propose`. After that,
it offers to enter `/spec-driven-auto` to execute or `/spec-driven-modify` to
continue refining.

## Project Structure

```
.spec-driven/
├── config.yaml              # Project context and rules (injected into every skill)
├── roadmap/
│   ├── INDEX.md             # Milestone ordering for long-horizon planning
│   └── milestones/
│       └── <milestone>.md   # Goal, scope boundaries, planned changes, risks, notes, and status
├── specs/
│   ├── INDEX.md             # Top-level index of all spec files
│   ├── README.md            # Spec format and conventions
│   └── <category>/          # One directory per domain area
│       └── <topic>.md       # Requirements in RFC 2119 format
└── changes/
    ├── <change-name>/
    │   ├── proposal.md      # What & why
    │   ├── specs/           # Delta specs mirroring specs/ structure
    │   │   └── <category>/
    │   │       └── <topic>.md  # ADDED / MODIFIED / REMOVED Requirements
    │   ├── design.md        # How (approach, decisions, alternatives)
    │   ├── tasks.md         # Implementation checklist
    │   └── questions.md     # Open questions and resolved Q&A
    └── archive/             # Completed changes (YYYY-MM-DD-<name>/)
```

## Spec Format

```markdown
---
mapping:
  implementation:
    - src/example.ts
  tests:
    - test/example.test.ts
---

### Requirement: <name>
The system MUST/SHOULD/MAY <observable behavior>.

#### Scenario: <name>
- GIVEN <precondition>
- WHEN <action>
- THEN <expected outcome>
```

**Keywords**: MUST = required, SHOULD = recommended, MAY = optional (RFC 2119).

Delta specs use `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`. At archive time each delta file is merged into its corresponding main spec file by matching `### Requirement: <name>`.

Mapping frontmatter uses repo-relative file paths. Keep implementation files
under `mapping.implementation` and test files under `mapping.tests`; do not put
those paths inside requirement prose.

## Scripts

Scripts handle filesystem mechanics only — skills handle intelligent content.

```bash
node dist/scripts/spec-driven.js propose <name>  # Create change scaffold
node dist/scripts/spec-driven.js modify [name]   # List changes or show artifact paths
node dist/scripts/spec-driven.js apply <name>    # Parse tasks.md → JSON status
node dist/scripts/spec-driven.js verify <name>   # Validate artifact format → JSON
node dist/scripts/spec-driven.js verify-spec-mappings [path]  # Validate spec mapping frontmatter → JSON
node dist/scripts/spec-driven.js audit-spec-mapping-coverage <spec-path> [--implementation <repo-path> ...] [--tests <repo-path> ...]  # Compare one spec's mapping against explicit evidence → JSON
node dist/scripts/spec-driven.js audit-unmapped-spec-evidence [--implementation <repo-path> ...] [--tests <repo-path> ...]  # Report candidate files not mapped by any main spec → JSON
node dist/scripts/spec-driven.js verify-roadmap [path]  # Validate roadmap milestone size/shape → JSON
node dist/scripts/spec-driven.js roadmap-status [path]  # Compare roadmap milestones against active/archive change state → JSON
node dist/scripts/spec-driven.js archive <name>  # Move to archive/YYYY-MM-DD-<name>/
node dist/scripts/spec-driven.js cancel <name>   # Delete change (no archive)
node dist/scripts/spec-driven.js init [path]     # Bootstrap .spec-driven/ scaffold
node dist/scripts/spec-driven.js run-maintenance [path]      # Run the manual maintenance workflow now
node dist/scripts/spec-driven.js migrate [path]  # Migrate openspec/ artifacts
node dist/scripts/spec-driven.js list            # List all changes (active + archived)
```

## Manual Maintenance Workflow

`run-maintenance` reads `.spec-driven/maintenance/config.json` and executes only
the checks and safe auto-fixes that the repository explicitly configures.

Example config:

```json
{
  "changePrefix": "maintenance",
  "branchPrefix": "maintenance",
  "commitMessagePrefix": "chore: maintenance",
  "checks": [
    {
      "name": "lint",
      "command": "npm run lint",
      "fixCommand": "npm run lint:fix"
    }
  ]
}
```

Config behavior:
- `checks` is required; only listed checks and `fixCommand`s are allowed to run
- `changePrefix`, `branchPrefix`, and `commitMessagePrefix` are optional and fall back to maintenance defaults
- No scheduler or background job is installed; maintenance runs only when explicitly invoked

`run-maintenance`:
- errors when the maintenance config is missing or invalid
- skips when the repo is dirty, has no configured checks, or already has an active maintenance change
- exits cleanly when configured checks already pass
- reports unfixable failures when a failing check has no configured `fixCommand`
- reports blocked results when fix, archive, commit, or branch restore steps fail
- creates a dedicated maintenance branch/change, applies configured fixes, archives the change, commits the result on the maintenance branch, and returns to the original branch on success

## License

[Apache License 2.0](LICENSE)
