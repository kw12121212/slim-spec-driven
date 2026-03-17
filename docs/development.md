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
        ├── calls node dist/scripts/*.js        (filesystem operations)
        │       └── reads/writes .spec-driven/changes/<name>/
        │
        └── reads/writes codebase files         (actual implementation)
```

The AI orchestrates everything. Scripts are called by the AI during skill execution, not by the user directly (though direct use is also valid for scripting).

---

## The .spec-driven/ Directory

Created by copying `template/` into a project root:

```
.spec-driven/
├── config.yaml          # Project context injected into skills
├── specs/               # Current-state specs (what the system does now)
│   └── *.md
└── changes/
    ├── <change-name>/   # One directory per active change
    │   ├── proposal.md  # What & why
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
    - Requirements specify observable behavior, not implementation details
  tasks:
    - Tasks should be independently completable
```

The `context` field is the most important — it's what skills inject when generating proposals, designs, and tasks. A good context describes: what the project is, what language/framework, key architectural decisions.

### Artifact files

**proposal.md** — describes *what* and *why*. Sections: `## What`, `## Why`, `## Scope`. No implementation details.

**design.md** — describes *how*. Sections: `## Approach`, `## Key Decisions`, `## Alternatives Considered`.

**tasks.md** — the implementation checklist. Uses standard markdown checkboxes:
- `- [ ]` incomplete task
- `- [x]` complete task (case-insensitive `x`)

The `apply.js` script parses these with regex: `^\s*-\s*\[x\]\s+` and `^\s*-\s*\[ \]\s+`.

---

## Scripts

All scripts live in `scripts/*.ts`, compiled to `dist/scripts/*.js`. They must be run from the **project root** (the directory containing `.spec-driven/`).

### propose.ts

**Purpose:** Scaffold a new change directory with seed artifact files.

**Usage:**
```bash
node dist/scripts/propose.js <kebab-case-name>
```

**What it does:**
1. Validates the name matches `^[a-z0-9]+(-[a-z0-9]+)*$`
2. Checks `.spec-driven/changes/<name>/` does not already exist
3. Creates the directory
4. Writes `proposal.md`, `design.md`, `tasks.md` with placeholder content

**Output (stdout):**
```
Created change: .spec-driven/changes/my-feature
  .spec-driven/changes/my-feature/proposal.md
  .spec-driven/changes/my-feature/design.md
  .spec-driven/changes/my-feature/tasks.md
```

**Exit codes:** `0` success, `1` error (duplicate name, invalid name)

**Seed content:** The placeholder text uses `[Describe ...]` and `[List ...]` patterns. `verify.js` checks for these and emits warnings — this is intentional to prompt the AI to fill them in.

---

### modify.ts

**Purpose:** List active changes, or show artifact paths for a named change. This is a navigation/discovery utility — it does not modify any files despite its name.

**Usage:**
```bash
node dist/scripts/modify.js              # list all active changes
node dist/scripts/modify.js <name>       # show artifact paths for <name>
```

**What it does (no name):**
- Reads `.spec-driven/changes/` directory entries
- Filters to directories, excludes `archive/`
- Prints list to stdout

**What it does (with name):**
- Checks the change directory exists
- Prints the expected paths for `proposal.md`, `design.md`, `tasks.md`
- Appends `(missing)` if a file doesn't exist

**Output (no name):**
```
Active changes:
  my-feature
  another-change
```

**Output (with name):**
```
Artifacts for 'my-feature':
  .spec-driven/changes/my-feature/proposal.md
  .spec-driven/changes/my-feature/design.md
  .spec-driven/changes/my-feature/tasks.md
```

**Exit codes:** `0` always (no name case), `0` success / `1` not found (with name)

**Why skills call this:** Skills use the no-argument form to enumerate available changes when the user hasn't specified one. They use the named form to get explicit paths before reading files.

---

### apply.ts

**Purpose:** Parse `tasks.md` and output a JSON task status summary.

**Usage:**
```bash
node dist/scripts/apply.js <name>
```

**What it does:**
1. Reads `.spec-driven/changes/<name>/tasks.md`
2. Scans every line with regex for `- [x]` (complete) and `- [ ]` (incomplete)
3. Extracts task text by stripping the checkbox prefix
4. Outputs JSON

**Output (stdout):**
```json
{
  "total": 5,
  "complete": 2,
  "remaining": 3,
  "tasks": [
    { "text": "Add the feature", "complete": true },
    { "text": "Write tests", "complete": false }
  ]
}
```

**Exit codes:** `0` success, `1` error (missing change, missing tasks.md)

**Important detail:** The regex is case-insensitive for `x` — both `- [x]` and `- [X]` count as complete. The regex also allows leading whitespace, so indented tasks in nested lists are counted.

**Skills use this for two purposes:**
1. Display progress to the user before starting implementation
2. Confirm all tasks are done after implementation (`remaining === 0`)

---

### verify.ts

**Purpose:** Validate artifact format and content quality. Outputs structured JSON — always exits `0`, errors are in the JSON payload.

**Usage:**
```bash
node dist/scripts/verify.js <name>
```

**What it does:**
1. Checks change directory exists (error if not)
2. For each of `proposal.md`, `design.md`, `tasks.md`:
   - Checks file exists (error if missing)
   - Checks file is non-empty (error if empty)
   - Checks for unfilled placeholders (`[Describe`, `[List`) → warning
3. Checks `tasks.md` has at least one checkbox → warning if none
4. Checks all tasks are complete → warning if any remain

**Output (stdout):**
```json
{
  "valid": true,
  "warnings": [
    "proposal.md contains unfilled placeholders",
    "tasks.md has incomplete tasks"
  ],
  "errors": []
}
```

**`valid` field:** `true` when `errors` is empty. Warnings do not affect `valid`.

**Exit codes:** Always `0`. The calling skill decides how to handle errors/warnings.

**Design rationale:** `verify.js` does format/completeness checking only — it cannot check whether the *implementation* actually matches the proposal. That semantic check is the skill's responsibility (`spec-driven-verify` reads actual code files).

---

### archive.ts

**Purpose:** Move a completed change to the archive directory with a date prefix.

**Usage:**
```bash
node dist/scripts/archive.js <name>
```

**What it does:**
1. Checks `.spec-driven/changes/<name>/` exists
2. Computes today's date as `YYYY-MM-DD` using `new Date().toISOString().slice(0, 10)`
3. Checks `.spec-driven/changes/archive/YYYY-MM-DD-<name>/` does not already exist
4. Creates `archive/` if needed
5. Moves the directory with `fs.renameSync`

**Output (stdout):**
```
Archived: .spec-driven/changes/my-feature → .spec-driven/changes/archive/2026-03-17-my-feature
```

**Exit codes:** `0` success, `1` error (not found, archive target already exists)

**Important:** This is a move, not a delete. The archive directory accumulates all completed changes as a historical record.

**Edge case:** If the same change name is archived twice on the same day, the second attempt fails because the target path already exists. The skill handles this by warning the user before calling the script.

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

### spec-driven-propose

**Trigger:** User wants to start planning a new change.

**Flow:**
1. Gets change name from user (or asks)
2. Reads `.spec-driven/config.yaml` for project context
3. Runs `node dist/scripts/propose.js <name>` to create scaffold
4. Fills `proposal.md` — what and why, no implementation detail
5. Fills `design.md` — approach, decisions, alternatives
6. Fills `tasks.md` — atomic, independently-completable checkboxes
7. Shows user the three files and asks for adjustments

**Key constraint:** Planning only — does not touch codebase files. The rule "do not implement anything" is explicit in the prompt.

**How it uses the script:** The script creates the directory structure and seed files with placeholders. The skill then overwrites the placeholder content with real content. The script's role is purely filesystem scaffolding.

---

### spec-driven-modify

**Trigger:** User wants to edit an existing change's proposal, design, or task list.

**Flow:**
1. Runs `node dist/scripts/modify.js` to list changes (if user hasn't specified one)
2. Runs `node dist/scripts/modify.js <name>` to get artifact paths
3. Reads the selected artifact
4. Asks what to change (if not specified)
5. Applies edits, shows summary

**Key constraint:** For `tasks.md`, never uncheck a `- [x]` task unless explicitly asked. This protects implementation progress from being accidentally erased during plan refinement.

**Why it exists as a separate skill from propose:** Modifying mid-flight requires reading existing content, understanding what's already done, and making targeted edits. Propose starts from scratch. Different mental model, different rules.

---

### spec-driven-apply

**Trigger:** User wants to implement a change.

**Flow:**
1. Runs `node dist/scripts/modify.js` to list changes
2. Reads all three artifacts + `config.yaml` + `specs/` for full context
3. Runs `node dist/scripts/apply.js <name>` to show task summary
4. For each `- [ ]` task:
   - Reads relevant code
   - Implements the task
   - Marks `- [x]` in `tasks.md` immediately
5. Runs `node dist/scripts/apply.js <name>` again at end to confirm `remaining === 0`
6. Suggests `/spec-driven-verify`

**Key constraint:** Mark tasks complete one at a time, immediately after completing each — not in bulk at the end. This keeps the task list as an accurate progress tracker if the session is interrupted.

**Context loading pattern:** The skill loads all three artifacts before writing a single line of code. This prevents the AI from making up an approach that contradicts the design doc.

---

### spec-driven-verify

**Trigger:** User wants to confirm a change is complete and correct before archiving.

**Flow:**
1. Runs `node dist/scripts/verify.js <name>` → format/completeness check
2. Runs `node dist/scripts/apply.js <name>` → task completion check
3. For each completed task, reads actual code to verify evidence exists
4. Reads `specs/` and `proposal.md` to check alignment
5. Outputs tiered report: CRITICAL / WARNING / SUGGESTION
6. Recommends next step based on severity

**Tiers:**
- **CRITICAL** — blocks archive (incomplete tasks, missing files, implementation doesn't match proposal)
- **WARNING** — should address but user decides (no tests, specs not updated)
- **SUGGESTION** — optional quality improvements

**What the script does vs what the skill does:**
- `verify.js` checks: files exist, non-empty, no placeholders, checkbox counts
- The skill checks: does the code actually do what was proposed? are tests passing? are specs updated?

The script is fast and deterministic. The skill's verification requires reading and reasoning about code.

---

### spec-driven-archive

**Trigger:** User wants to close out a completed change.

**Flow:**
1. Runs `node dist/scripts/modify.js` to list changes
2. Runs `node dist/scripts/apply.js <name>` → checks for incomplete tasks
3. If `remaining > 0`: warns user and waits for explicit confirmation
4. Runs `node dist/scripts/archive.js <name>`
5. Reports destination path, suggests `/spec-driven-propose` for follow-up work

**Key constraint:** Never skip the incomplete-task warning. The user must make an informed decision. The skill doesn't automatically abort — it waits for confirmation so the user can archive partial work intentionally.

---

## Skill–Script Relationship

Each skill orchestrates multiple scripts. Here's the full call graph:

```
spec-driven-propose
  └── propose.js <name>

spec-driven-modify
  ├── modify.js             (list changes)
  └── modify.js <name>      (get artifact paths)

spec-driven-apply
  ├── modify.js             (list changes)
  ├── apply.js <name>       (show progress before)
  └── apply.js <name>       (confirm completion after)

spec-driven-verify
  ├── modify.js             (list changes)
  ├── verify.js <name>      (format check)
  └── apply.js <name>       (task completion check)

spec-driven-archive
  ├── modify.js             (list changes)
  ├── apply.js <name>       (incomplete task check)
  └── archive.js <name>     (move to archive)
```

`apply.js` and `modify.js` are called by multiple skills — they are general-purpose utilities. `propose.js` and `archive.js` are called by a single skill each — they implement a specific lifecycle transition.

---

## install.sh

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

Fully repeatable — resets state before and after. All 32 tests must pass before committing script changes.

**Structure:**
```bash
reset_state()     # rm -rf the test change and archive
[1] propose       # 9 tests
[2] modify        # 5 tests
[3] apply         # 6 tests
[4] verify        # 6 tests
[5] archive       # 6 tests
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

## Adding a New Script

1. Create `scripts/<name>.ts` following the existing pattern:
   - Import only `fs` and `path`
   - Read `process.argv[2]` for the primary argument
   - Print to stdout on success, stderr on error
   - Exit `0` on success, `1` on error
   - If outputting structured data, use JSON

2. The script's CWD is assumed to be the target project root. Always construct paths with `path.join(".spec-driven", ...)`.

3. Rebuild: `npm run build`

4. Add tests in `test/run.sh`

5. If the script needs a corresponding skill, see the next section.

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
