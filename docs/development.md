# Development Guide

A complete reference for understanding and extending `slim-spec-driven`.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Architecture](#architecture)
3. [The .spec-driven/ Directory](#the-spec-driven-directory)
4. [Scripts](#scripts)
5. [Skills](#skills)
6. [Skill–Script Relationship](#skillscript-relationship)
7. [install.sh](#installsh)
8. [Test Suite](#test-suite)
9. [Adding a New Script](#adding-a-new-script)
10. [Adding a New Skill](#adding-a-new-skill)
11. [Adding a New CLI Target](#adding-a-new-cli-target)

---

## Design Philosophy

The core principle is **separation of intelligence from mechanics**:

- **Scripts** do filesystem work: create directories, move files, parse checkbox counts, validate file presence. They are dumb, fast, and testable.
- **Skills** do all intelligent work: generate content, implement code, reason about completeness. They use the scripts as tools.

This separation means:
- Scripts can be unit-tested without an AI model
- Skills can be changed freely without touching file operations
- The filesystem is the single source of truth — no database, no state files

A secondary principle is **zero runtime dependencies**. Scripts use Node.js stdlib only (`fs`, `path`). The project has no production `dependencies` in `package.json`, only `devDependencies` for TypeScript compilation.

---

## Architecture

```
User invokes skill (e.g. /spec-driven-apply)
        │
        ▼
  Skill prompt (SKILL.md) guides the AI
        │
        ├── reads .spec-driven/config.yaml     (project context)
        ├── reads .spec-driven/specs/           (current state specs)
        ├── reads .spec-driven/changes/<name>/  (artifacts)
        │
        ├── calls node dist/scripts/spec-driven.js <cmd>  (filesystem operations)
        │       └── reads/writes .spec-driven/changes/<name>/
        │
        └── reads/writes codebase files         (actual implementation)
```

The AI orchestrates everything. Scripts are called by the AI during skill execution, not by the user directly (though direct use is also valid for scripting).

---

## The .spec-driven/ Directory

Created by running `spec-driven.js init` (or `/spec-driven-init`):

```
.spec-driven/
├── config.yaml          # Project context injected into skills
├── specs/               # Current-state specs (what the system does now)
│   └── *.md
└── changes/
    ├── <change-name>/   # One directory per active change
    │   ├── proposal.md  # What & why
    │   ├── specs/       # Delta spec files mirroring .spec-driven/specs/ structure
    │   │   └── <category>/<name>.md  # ADDED/MODIFIED/REMOVED Requirements
    │   ├── design.md    # How (approach, decisions)
    │   └── tasks.md     # Checklist of - [ ] / - [x] items
    └── archive/         # Completed changes, prefixed YYYY-MM-DD-<name>/
```

### config.yaml

```yaml
schema: spec-driven
context: |
  <free-text description of the project>
  Skills read this and use it to generate relevant content.
rules:
  specs:
    - Describe observable behavior only — no implementation details, technology
      choices, or internal structure
    - MUST = required with no exceptions; SHOULD = default unless explicitly
      justified; MAY = genuinely optional
    - Each requirement must be independently verifiable from outside the system
  change:
    - Implement only what is in scope in proposal.md — if scope needs to expand,
      use /spec-driven-modify first, never expand silently
    - When a requirement or task is ambiguous, ask the user before proceeding —
      do not assume or guess
    - Delta specs must reflect what was actually built, not the original plan
    - Mark tasks [x] immediately upon completion — never batch at the end
  code:
    - Read existing code before modifying it
    - Implement only what the current task requires — no speculative features
    - No abstractions for hypothetical future needs (YAGNI)
# fileMatch:              # per-pattern rules applied in addition to global rules above
#   - pattern: "**/*.test.*"
#     rules:
#       - Tests must cover happy path, error cases, and edge cases
```

The `context` field is the most important — it's what skills inject when generating proposals, designs, and tasks. A good context describes: what the project is, what language/framework, key architectural decisions. The `rules` field has three categories (`specs`, `change`, `code`) that skills treat as binding constraints. Optional `fileMatch` entries apply additional rules per file glob pattern.

### Artifact files

**proposal.md** — describes *what* and *why*. Sections: `## What`, `## Why`, `## Scope`, `## Unchanged Behavior`. No implementation details.

**specs/** — a directory of delta spec files mirroring the main `.spec-driven/specs/` structure by path (e.g. `changes/<name>/specs/api/search.md` maps to `specs/api/search.md`). Each file uses `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements` section markers. Requirements use `### Requirement: <name>` headings and RFC 2119 keywords (MUST/SHOULD/MAY). Scenarios use `#### Scenario:` with GIVEN/WHEN/THEN. At archive time the skill merges each delta file into the corresponding main spec file.

**design.md** — describes *how*. Sections: `## Approach`, `## Key Decisions`, `## Alternatives Considered`.

**tasks.md** — the implementation checklist. Uses standard markdown checkboxes:
- `- [ ]` incomplete task
- `- [x]` complete task (case-insensitive `x`)

The `apply` subcommand parses these with regex: `^\s*-\s*\[x\]\s+` and `^\s*-\s*\[ \]\s+`.

---

## Scripts

All subcommands live in a single file: `scripts/spec-driven.ts`, compiled to `dist/scripts/spec-driven.js`. Run from the **project root** (the directory containing `.spec-driven/`).

```bash
node dist/scripts/spec-driven.js <subcommand> [args]
```

### propose `<name>`

Scaffolds a new change directory. Validates the name matches `^[a-z0-9]+(-[a-z0-9]+)*$`. Creates `proposal.md`, `specs/` directory, `design.md`, and `tasks.md` with seed content. Exit `1` on duplicate name or invalid name.

**Output:**
```
Created change: .spec-driven/changes/my-feature
  .spec-driven/changes/my-feature/proposal.md
  .spec-driven/changes/my-feature/specs/ (populate to mirror .spec-driven/specs/ structure)
  .spec-driven/changes/my-feature/design.md
  .spec-driven/changes/my-feature/tasks.md
```

**Seed content:** `proposal.md` and `design.md` use `[Describe ...]`/`[List ...]` placeholders — `verify` checks for these and emits warnings. `specs/` starts empty — the skill populates it with delta files mirroring the main specs structure.

---

### modify `[name]`

Navigation/discovery utility — does not modify files. With no argument: lists active changes (excludes `archive/`). With a name: prints paths to all four artifacts, appending `(missing)` if absent. Exit `1` if named change not found.

**Output (with name):**
```
Artifacts for 'my-feature':
  .spec-driven/changes/my-feature/proposal.md
  .spec-driven/changes/my-feature/specs/<files or "(empty)">
  .spec-driven/changes/my-feature/design.md
  .spec-driven/changes/my-feature/tasks.md
```

---

### apply `<name>`

Parses `tasks.md` for `- [ ]` and `- [x]` checkboxes (case-insensitive, leading whitespace allowed). Outputs JSON task status. Exit `1` if change or tasks.md missing.

**Output:**
```json
{
  "total": 4,
  "complete": 2,
  "remaining": 2,
  "tasks": [
    { "text": "Add the feature", "complete": true },
    { "text": "Write tests", "complete": false }
  ]
}
```

Skills call this twice: before implementation (to show progress) and after (to confirm `remaining === 0`).

---

### verify `<name>`

Validates artifact format and content quality. Always exits `0`; errors are in the JSON payload. `valid` is `false` only when `errors` is non-empty.

**Checks performed:**
1. `specs/` directory exists (error if missing)
2. `specs/` has `.md` files with real content (warning if empty)
3. Each spec file uses `### Requirement:` headings (error if not — format is mandatory)
4. Each spec file has `## ADDED Requirements`, `## MODIFIED Requirements`, or `## REMOVED Requirements` section marker (error if missing)
5. `proposal.md`, `design.md`, `tasks.md` exist and are non-empty (error if not)
6. Unfilled placeholders (`[Describe`, `[List`) in artifacts → warning
7. `[NEEDS CLARIFICATION]` markers in any artifact or spec file → warning
8. `tasks.md` has no checkboxes → warning; has incomplete tasks → warning

**Output:**
```json
{ "valid": true, "warnings": ["..."], "errors": [] }
```

---

### archive `<name>`

Moves `.spec-driven/changes/<name>/` to `.spec-driven/changes/archive/YYYY-MM-DD-<name>/`. Creates `archive/` if needed. Exit `1` if source not found or target already exists. This is a move, not a delete — archive accumulates all completed changes as a historical record.

---

### cancel `<name>`

Deletes `.spec-driven/changes/<name>/` without archiving. Exit `1` if not found. The skill requires explicit user confirmation before calling this — deletion is irreversible.

---

### init `[path]`

Creates `.spec-driven/` scaffold at the given path (or CWD): `config.yaml`, `specs/README.md`, and `changes/` directory. Exit `1` if `.spec-driven/` already exists.

---

## Skills

Skills live in `skills/<name>/SKILL.md`. Each is a markdown file with YAML frontmatter that instructs the AI how to carry out a workflow step.

### Frontmatter fields

```yaml
---
name: spec-driven-propose        # Must match directory name
description: One-line summary    # Shown in CLI autocomplete and used for auto-invocation
---
```

`name` must match the containing directory name and must be `^[a-z0-9]+(-[a-z0-9]+)*$`.

`description` is critical — it's what the AI uses to decide whether to auto-invoke the skill. Keep it precise.

### spec-driven-init

**Trigger:** User wants to set up the spec-driven workflow in a project.

**Flow:**
1. Confirms target directory
2. Runs `spec-driven.js init [path]` to create scaffold
3. Reads existing project files (`README.md`, `AGENTS.md`, etc.) and drafts a `context` value; shows the user for confirmation
4. Optionally captures existing behavior into initial spec files
5. Suggests `/spec-driven-propose` to create the first change

---

### spec-driven-propose

**Trigger:** User wants to start planning a new change.

**Flow:**
1. Gets change name from user (or asks)
2. Reads `.spec-driven/config.yaml` for project context and rules
3. Runs `spec-driven.js propose <name>` to create scaffold
4. Fills `proposal.md` — what and why, no implementation detail
5. Populates `specs/` delta files — creates files mirroring the main specs structure with ADDED/MODIFIED/REMOVED requirements using `### Requirement:` format and RFC 2119 keywords
6. Fills `design.md` — approach, decisions, alternatives
7. Fills `tasks.md` — atomic, independently-completable checkboxes (no "Update specs" task — delta spec is the spec artifact)
8. Shows user the four files and asks for adjustments

**Key constraint:** Planning only — does not touch codebase files.

---

### spec-driven-modify

**Trigger:** User wants to edit an existing change artifact.

**Flow:**
1. Runs `spec-driven.js modify` to list changes
2. Runs `spec-driven.js modify <name>` to get artifact paths
3. Reads the selected artifact (`proposal.md`, `specs/` delta files, `design.md`, or `tasks.md`)
4. Applies edits, shows summary

**Key constraint:** Never uncheck a `- [x]` task unless the user explicitly asks.

---

### spec-driven-apply

**Trigger:** User wants to implement a change.

**Flow:**
1. Runs `spec-driven.js modify` to list changes
2. Reads all four artifacts + `config.yaml` + `specs/` for full context
3. Runs `spec-driven.js apply <name>` to show task summary
4. For each `- [ ]` task: reads relevant code, implements, marks `- [x]` immediately
5. After all tasks: reviews delta files in `specs/` and updates them to reflect what was actually implemented
6. Runs `spec-driven.js apply <name>` again to confirm `remaining === 0`
7. Suggests `/spec-driven-verify`

**Key constraint:** Mark tasks complete one at a time immediately — not in bulk. Update delta files in `specs/` to stay accurate with the actual implementation. Verify each change does not violate any **Unchanged Behavior** listed in proposal.md.

---

### spec-driven-verify

**Trigger:** User wants to confirm a change is complete and correct before archiving.

**Flow:**
1. Runs `spec-driven.js verify <name>` → format/completeness check (including delta spec format)
2. Runs `spec-driven.js apply <name>` → task completion check
3. For each completed task, reads actual code to verify evidence exists
4. Reads `specs/`, `config.yaml`, `proposal.md`, and delta files in `specs/` to check alignment
5. Outputs tiered report: CRITICAL / WARNING / SUGGESTION
6. Recommends next step based on severity

**Tiers:**
- **CRITICAL** — blocks archive (incomplete tasks, missing/invalid artifacts, delta spec format violation, implementation doesn't match proposal)
- **WARNING** — should address but user decides
- **SUGGESTION** — optional quality improvements

---

### spec-driven-archive

**Trigger:** User wants to close out a completed change.

**Flow:**
1. Runs `spec-driven.js modify` to list changes
2. Runs `spec-driven.js apply <name>` → checks for incomplete tasks; warns if any remain
3. Lists all delta files in `specs/` and merges each into the corresponding main spec file by path: ADDED requirements appended, MODIFIED replaced by `### Requirement:` name, REMOVED deleted by name
4. Runs `spec-driven.js archive <name>`
5. Reports destination path

**Key constraint:** Delta spec merge is mandatory before archiving — cannot be skipped.

---

### spec-driven-cancel

**Trigger:** User wants to abandon an in-progress change.

**Flow:**
1. Runs `spec-driven.js modify` to list changes
2. Shows explicit warning: deletion is permanent and irreversible
3. Waits for user confirmation
4. Runs `spec-driven.js cancel <name>`

**Key constraint:** Always confirm before deleting. If the change is fully implemented, suggest `/spec-driven-archive` instead.

---

## Skill–Script Relationship

Each skill orchestrates multiple scripts. Here's the full call graph:

```
spec-driven-init
  └── spec-driven.js init [path]

spec-driven-propose
  └── spec-driven.js propose <name>

spec-driven-modify
  ├── spec-driven.js modify             (list changes)
  └── spec-driven.js modify <name>      (get artifact paths)

spec-driven-apply
  ├── spec-driven.js modify             (list changes)
  ├── spec-driven.js apply <name>       (show progress before)
  └── spec-driven.js apply <name>       (confirm completion after)

spec-driven-verify
  ├── spec-driven.js modify             (list changes)
  ├── spec-driven.js verify <name>      (format check)
  └── spec-driven.js apply <name>       (task completion check)

spec-driven-archive
  ├── spec-driven.js modify             (list changes)
  ├── spec-driven.js apply <name>       (incomplete task check)
  └── spec-driven.js archive <name>     (move to archive)

spec-driven-cancel
  ├── spec-driven.js modify             (list changes)
  └── spec-driven.js cancel <name>      (delete change)
```

`apply` and `modify` are called by multiple skills — they are general-purpose utilities. `propose`, `archive`, `cancel`, and `init` are called by a single skill each — they implement specific lifecycle transitions.

---

## install.sh

### Installed directory structure

After installation, skills live in a target directory with the following layout:

**Global install (default `--cli all`):**
```
~/.slim-spec-driven/skills/
├── spec-driven-propose/
│   ├── SKILL.md
│   └── scripts/
│       └── spec-driven.js
├── spec-driven-modify/
│   ├── SKILL.md
│   └── scripts/ → spec-driven.js (same file)
├── spec-driven-apply/  ...
├── spec-driven-verify/ ...
├── spec-driven-archive/...
├── spec-driven-init/   ...
└── spec-driven-cancel/ ...
```

**Global install `--cli claude`:**
```
~/.claude/skills/
└── spec-driven-propose/ → ~/.slim-spec-driven/skills/spec-driven-propose/  (symlink)
    ...
```

**Global install `--cli opencode`:**
```
~/.config/opencode/skills/
└── spec-driven-propose/ → ~/.slim-spec-driven/skills/spec-driven-propose/  (symlink)
    ...
```

**Project-local install (`--project` or `--project /path`):**
```
<project-root>/
├── .agent/skills/           # agent store (copies)
│   └── spec-driven-propose/
│       ├── SKILL.md
│       └── scripts/
│           └── spec-driven.js
├── .claude/skills/          # symlinks → .agent/skills/
│   └── spec-driven-propose/ → ../.agent/skills/spec-driven-propose/
└── .opencode/skills/        # symlinks → .agent/skills/
    └── spec-driven-propose/ → ../.agent/skills/spec-driven-propose/
```

**Local clone vs curl — what `scripts/` contains:**

| Mode | `scripts/` content |
|------|--------------------|
| Local clone | Symlink → `repo/dist/scripts/` (live, updates with repo) |
| curl | Copied `.js` files downloaded from GitHub |

### Detection logic

The script detects its execution context by checking whether `$SCRIPT_DIR/skills/` exists:

```
$SCRIPT_DIR/skills/ exists  →  local clone mode  →  create symlinks
$SCRIPT_DIR/skills/ missing →  curl pipe mode    →  download files
```

When piped via `curl ... | bash`, `$SCRIPT_DIR` resolves to something like `/dev/fd/63` or `/tmp`, so `skills/` won't exist there.

### Symlink vs copy

| Mode | Result | Update behavior |
|------|--------|----------------|
| Local clone | `ln -s skills/<name>` → real dir | Edit `skills/*/SKILL.md`, change is live immediately |
| curl | Copies `SKILL.md` into `~/.claude/skills/<name>/` | Must re-run curl to update |

The `-sfn` flags on `ln`: `-s` symbolic, `-f` force (replace existing), `-n` treat target as file not dir (required when relinking a directory symlink).

### CLI target directories

```bash
declare -A GLOBAL_DIRS=(
  [claude]="$HOME/.claude/skills"
  [opencode]="$HOME/.config/opencode/skills"
  [all]="$HOME/.claude/skills"        # shared: OpenCode also reads this
)
declare -A PROJECT_DIRS=(
  [claude]=".claude/skills"
  [opencode]=".opencode/skills"
  [all]=".claude/skills"              # shared
)
```

To add a new CLI, add it to both arrays.

### Uninstall logic

Symlinks: `rm <target>` — safe, removes only the pointer.

Curl-installed directories: only removed if the directory contains exactly `SKILL.md` and nothing else. This prevents accidentally deleting a directory the user has modified. The check uses `ls -A "$target"` and compares to the string `"SKILL.md"`.

---

## Test Suite

### test/run.sh

Fully repeatable — resets state before and after. All 50 tests must pass before committing script changes.

**Structure:**
```bash
reset_state()     # rm -rf the test change and archive
[0] init          # 5 tests
[1] propose       # 11 tests
[2] modify        # 6 tests
[3] apply         # 6 tests
[4] verify        # 7 tests
[5] archive       # 6 tests
[6] cancel        # 4 tests
reset_state()     # leave repo clean
```

**Helper functions:**

`assert_exit label expected_code cmd...` — runs command, captures exit code via `echo "EXIT:$?"` suffix trick (works even when set -e is active because of `|| true`).

`assert_contains label needle haystack` — uses `grep -qF` (fixed string, not regex).

`assert_json_field label field expected json` — uses `grep -m 1 -oP` with a Perl regex lookahead. The `-m 1` is critical: the `tasks` array in `apply.js` output contains nested `"complete": true/false` entries that would otherwise cause false matches on the top-level `complete` field.

**test/todo-app/** — the fixture project. `todo.js` is a minimal Node.js CLI that exists purely so `spec-driven-apply` has real code to modify during manual testing. The automated test suite doesn't run `todo.js`.

### Adding a test

Add assertions after the relevant section. Use the existing helpers. The `CHANGE` variable (`add-delete-command`) is the name used throughout — all test state lives under `.spec-driven/changes/add-delete-command/`.

---

## Adding a New Subcommand

1. Add a new `case` branch in `scripts/spec-driven.ts` and implement the function:
   - Import only `fs` and `path` (no external deps)
   - Print to stdout on success, stderr on error
   - Exit `0` on success, `1` on error
   - If outputting structured data, use JSON
   - CWD is assumed to be the target project root — construct paths with `path.join(".spec-driven", ...)`

2. Rebuild: `npm run build` (or `npx tsc`)

3. Add tests in `test/run.sh`

4. If the subcommand needs a corresponding skill, see the next section.

---

## Adding a New Skill

1. Create `skills/<name>/SKILL.md`:

```markdown
---
name: <name>
description: <one-line description for autocomplete and auto-invocation>
---

[Prompt content — describe the workflow in steps, then list rules]
```

2. Naming: use the `spec-driven-` prefix to namespace. Name must match directory: `skills/spec-driven-foo/SKILL.md` → `name: spec-driven-foo`.

3. Structure your prompt as:
   - `## Steps` — numbered workflow, each step is a concrete action
   - `## Rules` — invariants the AI must not violate

4. Reference scripts explicitly with full commands (`node dist/scripts/foo.js <name>`), not abstract descriptions.

5. Re-run `bash install.sh` to update symlinks (local clone mode does this automatically since symlinks point to the live files).

6. Test manually by invoking `/spec-driven-<name>` in a project with `.spec-driven/` initialized.

---

## Adding a New CLI Target

Edit `install.sh`:

```bash
declare -A GLOBAL_DIRS=(
  [claude]="$HOME/.claude/skills"
  [opencode]="$HOME/.config/opencode/skills"
  [mynewtool]="$HOME/.config/mynewtool/skills"   # ← add here
  [all]="$HOME/.claude/skills"
)
declare -A PROJECT_DIRS=(
  [claude]=".claude/skills"
  [opencode]=".opencode/skills"
  [mynewtool]=".mynewtool/skills"                 # ← add here
  [all]=".claude/skills"
)
```

If the new CLI uses a different skill format (not `<name>/SKILL.md`), you'll need to add conditional logic in the install loop to handle alternate file structures.
