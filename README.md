# spec-driven

A lightweight spec-driven development framework: 10 agent skills + thin TypeScript scaffolding.

## How It Helps AI Programming

AI coding agents are capable but tend to drift — they lose track of existing behavior, expand scope, make inconsistent decisions, and leave no record of why things were built a certain way. spec-driven addresses this with three layers of structure.

### Layer 1: `specs/` — the system's long-term memory

Instead of reading the entire codebase to understand what the system does, the AI reads `specs/`:

- `INDEX.md` navigates the full spec collection at a glance
- Each spec file describes observable behavior using RFC 2119 format (`### Requirement:`, GIVEN/WHEN/THEN scenarios)
- `propose`, `apply`, and `spec-content` are required to read INDEX.md and the relevant spec files before generating anything

This prevents the AI from introducing conflicting or duplicate behavior — it knows what already exists.

### Layer 2: change artifacts — structured context per change

Every change is a folder with five files, each serving a distinct purpose:

| File | Content | Effect on AI |
|------|---------|--------------|
| `proposal.md` | What & Why | Constrains the AI to the stated goal |
| `specs/` | Delta (ADDED/MODIFIED/REMOVED) | Makes spec intent explicit, not implicit |
| `design.md` | How — approach and decisions | Prevents the AI from reinventing the approach mid-task |
| `tasks.md` | `- [ ]` checklist | Controls pace — one task at a time, marked complete immediately |
| `questions.md` | Open/resolved Q&A | Centralizes ambiguities; open questions block apply and archive |

### Layer 3: 10 skills — explicit constraints on AI behavior

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
| Past decisions are lost | `design.md` records rationale; `archive/` preserves the full change history |
| Spec quality is inconsistent | RFC 2119 + Requirement/Scenario format enforced; violations are errors, not warnings |

---

## vs. OpenSpec

[OpenSpec](https://github.com/Fission-AI/OpenSpec/) is the most prominent project in this space (33K stars). The core idea is the same: a change folder with proposal, specs, design, and tasks. The differences are in enforcement and philosophy.

| | spec-driven | OpenSpec |
|--|-------------|----------|
| Spec format | RFC 2119 enforced — `### Requirement:` + MUST/SHOULD/MAY + GIVEN/WHEN/THEN; violations are script errors | No required format |
| AI reads existing specs | Explicit: `propose`, `apply`, and `spec-content` must read INDEX.md then every relevant spec file before generating anything | "Searches existing specs" (vague) |
| Delta spec structure | Mirrors `specs/` by path — `changes/<name>/specs/auth/login.md` maps to `specs/auth/login.md` | Not path-bound |
| Archive spec merge | Hard gate: merge each delta file by path into main `specs/` using ADDED/MODIFIED/REMOVED markers before moving | File organization only |
| Runtime dependencies | Node.js stdlib only — one 280-line TypeScript file | Global npm package (`npm install -g`, Node 20.19+) |
| Project-level AI rules | `config.yaml` rules injected into every skill prompt | None |
| Philosophy | Enforcement over flexibility — constraints are the point | "Fluid not rigid" |
| Tool support | Claude Code, OpenCode | 30+ AI tools |

**When to use spec-driven**: you want the AI constrained by a spec standard it cannot silently ignore, and you're working in Claude Code or OpenCode.

**When to use OpenSpec**: you use multiple AI tools, prefer minimal process friction, or want a larger community.

---

## Quick Start

**Install via [skills.sh](https://skills.sh) (recommended — no extra files in your project):**
```bash
npx skills add kw12121212/slim-spec-driven
```

When prompted by `skills`, select the AI tools you actually use. For installation scope, prefer the shared/global option so you avoid duplicating skill files inside each project.

**From source (for development or live-edit):**
```bash
git clone https://github.com/kw12121212/slim-spec-driven ~/Code/slim-spec-driven
cd ~/Code/slim-spec-driven
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

## Workflow

```
init → propose → apply → verify → archive
```

1. **init** — create `.spec-driven/` with config.yaml, specs/INDEX.md, and specs/
2. **propose** — read existing specs, scaffold all five artifacts, populate delta specs
3. **apply** — implement tasks one by one; update delta specs to match what was built
4. **verify** — check task completion, implementation evidence, spec format, and alignment
5. **archive** — merge delta specs into `specs/` by file path, update INDEX.md, move to archive/

Use **modify** to refine any artifact mid-flight. Use **spec-content** when the
content is clear but the correct spec category/file is not. Use **cancel** to
abandon a change.

## Skills

| Skill | What it does |
|-------|-------------|
| `/spec-driven-init` | Initialize `.spec-driven/` in a project and fill config.yaml |
| `/spec-driven-propose` | Read existing specs, scaffold a new change with all five artifacts |
| `/spec-driven-modify` | Edit an existing change artifact |
| `/spec-driven-spec-content` | Read `specs/INDEX.md`, classify spec content, and place it in the correct delta spec file |
| `/spec-driven-apply` | Implement tasks one by one, update delta specs when done |
| `/spec-driven-verify` | Check completion, implementation evidence, and spec alignment |
| `/spec-driven-review` | Review a completed change for code quality before archive |
| `/spec-driven-archive` | Merge delta specs into specs/, update INDEX.md, move to archive/ |
| `/spec-driven-cancel` | Permanently delete an in-progress change (with confirmation) |
| `/spec-driven-auto` | Run full workflow automatically (propose → apply → verify → review → archive) with one confirmation checkpoint. Best for small, well-scoped changes. |

### Auto Workflow

`/spec-driven-auto` is a convenience for small, well-defined changes:

```bash
/spec-driven-auto add user avatar upload
```

**Suitable when:**
- Change touches ≤3 modules and ≤10 files
- No database migrations, auth/payments, or cross-service coordination
- Scope is specific and bounded

**Rejects and falls back to step-by-step when:**
- Scope is vague ("refactor the codebase")
- Change is large or cross-cutting
- High-risk areas (auth, payments, multi-repo)

The only mandatory checkpoint is after the proposal — everything else runs automatically unless blocked.

## Project Structure

```
.spec-driven/
├── config.yaml              # Project context and rules (injected into every skill)
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
### Requirement: <name>
The system MUST/SHOULD/MAY <observable behavior>.

#### Scenario: <name>
- GIVEN <precondition>
- WHEN <action>
- THEN <expected outcome>
```

**Keywords**: MUST = required, SHOULD = recommended, MAY = optional (RFC 2119).

Delta specs use `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`. At archive time each delta file is merged into its corresponding main spec file by matching `### Requirement: <name>`.

## Scripts

Scripts handle filesystem mechanics only — skills handle intelligent content.

```bash
node dist/scripts/spec-driven.js propose <name>  # Create change scaffold
node dist/scripts/spec-driven.js modify [name]   # List changes or show artifact paths
node dist/scripts/spec-driven.js apply <name>    # Parse tasks.md → JSON status
node dist/scripts/spec-driven.js verify <name>   # Validate artifact format → JSON
node dist/scripts/spec-driven.js archive <name>  # Move to archive/YYYY-MM-DD-<name>/
node dist/scripts/spec-driven.js cancel <name>   # Delete change (no archive)
node dist/scripts/spec-driven.js init [path]     # Bootstrap .spec-driven/ scaffold
```
