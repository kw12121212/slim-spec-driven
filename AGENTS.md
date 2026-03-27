# AGENTS.md

Instructions for AI agents working in this repository.

## What This Repo Is

`auto-spec-driven` is a lightweight spec-driven development framework. It ships:

- **11 Claude skills** (`skills/*/SKILL.md`) — AI prompts that drive the workflow
- **1 TypeScript CLI** (`scripts/spec-driven.ts`) — filesystem mechanics only (create, move, parse, validate); 9 subcommands
- **`install.sh`** — installs skills to `~/.auto-spec-driven/skills/` then symlinks into `~/.claude/skills/` / `~/.config/opencode/skills/` / `~/.trae/skills/` / `~/.agents/skills/`
- **`template/`** — starter `.spec-driven/` directory for target projects
- **`test/`** — automated test suite + todo-app fixture for dogfooding

## Directory Structure

```
auto-spec-driven/
├── scripts/          # TypeScript source — compiled to dist/scripts/*.js
├── skills/           # Skill prompt files (Agent Skills standard)
│   └── <name>/SKILL.md
├── template/         # .spec-driven/ starter template
├── test/
│   ├── run.sh        # Test runner (fully repeatable)
│   └── todo-app/     # Fixture project used by tests
├── .spec-driven/     # This repo uses its own workflow (dogfooding)
├── install.sh
├── package.json
└── tsconfig.json
```

## Build

```bash
npm install
npm run build       # compiles scripts/*.ts → dist/scripts/*.js
```

Always rebuild after editing any `scripts/*.ts` file. Tests run against `dist/`.

## Running Tests

```bash
bash test/run.sh
```

Tests are fully repeatable — they reset state before and after each run. All tests must pass before committing changes to scripts.

## Skill Format

Skills follow the [Agent Skills standard](https://agentskills.io): a directory containing `SKILL.md` with YAML frontmatter.

```
skills/
└── spec-driven-propose/
    └── SKILL.md       ← frontmatter: name, description; body: prompt content
```

Frontmatter fields used: `name`, `description`. CLIs (Claude Code, OpenCode, Trae, Codex, Gemini CLI) read their respective skills directories.

## Scripts Contract

Scripts handle **filesystem mechanics only** — no content generation, no AI logic.
All subcommands run as `node dist/scripts/spec-driven.js <cmd>` from the project root.

| Subcommand | Input | Output |
|------------|-------|--------|
| `propose <name>` | kebab-case name | creates `.spec-driven/changes/<name>/` with `proposal.md`, `specs/`, `design.md`, `tasks.md`, `questions.md` |
| `modify [name]` | optional name | stdout: active change list, or paths to all five artifacts |
| `apply <name>` | change name | stdout: JSON `{total, complete, remaining, tasks}` |
| `verify <name>` | change name | stdout: JSON `{valid, warnings[], errors[]}` |
| `archive <name>` | change name | moves change to `.spec-driven/changes/archive/YYYY-MM-DD-<name>/` |
| `cancel <name>` | change name | deletes `.spec-driven/changes/<name>/` |
| `init [path]` | optional path | creates `.spec-driven/` scaffold at path (or CWD) |
| `migrate [path]` | optional path | migrates `openspec/` artifacts to auto-spec-driven where supported |
| `list` | none | stdout: all changes (active with status, archived) |

All subcommands exit `0` on success, `1` on error (except `verify` which always exits `0` and reports errors in JSON).

## The .spec-driven/ Workflow

This repo uses its own workflow. To propose a change to this project:

```
/spec-driven-propose   → fills .spec-driven/changes/<name>/
/spec-driven-apply     → implements tasks, marks [x]
/spec-driven-verify    → checks completion and spec alignment
/spec-driven-review    → reviews code quality
/spec-driven-archive   → moves to archive/
/spec-driven-auto      → runs the full workflow (propose→apply→verify→review→archive); suggests brainstorm for vague scope
```

Changes in progress live in `.spec-driven/changes/`. Completed changes are in `.spec-driven/changes/archive/`.

## install.sh Flags

```bash
bash install.sh                          # global: store in ~/.auto-spec-driven/skills/, symlink into all CLIs
bash install.sh --cli claude             # global: store in ~/.auto-spec-driven/skills/, symlink into ~/.claude/skills/ only
bash install.sh --cli opencode           # global: store in ~/.auto-spec-driven/skills/, symlink into ~/.config/opencode/skills/ only
bash install.sh --cli trae               # global: store in ~/.auto-spec-driven/skills/, symlink into ~/.trae/skills/ only
bash install.sh --cli codex              # global: store in ~/.auto-spec-driven/skills/, symlink into ~/.agents/skills/ for Codex
bash install.sh --cli gemini             # global: store in ~/.auto-spec-driven/skills/, symlink into ~/.agents/skills/ for Gemini CLI
bash install.sh --project                # project-local: store in .agent/skills/, symlink into .claude/skills/ + .opencode/skills/ + .trae/skills/ + .codex/skills/ + .gemini/skills/ + .agents/skills/
bash install.sh --project /path/to/proj  # project-local at path
bash install.sh --uninstall              # remove symlinks and agent store entries (same --cli/--project flags)
```

Skills live in `~/.auto-spec-driven/skills/` (or `.agent/skills/` for project mode). CLI-specific directories only hold symlinks pointing there.

Skills are always copied into the agent store (never symlinked), making the store git-friendly. CLI-specific directories hold symlinks pointing into the agent store.

## Conventions

- Scripts use Node.js stdlib only — no external runtime dependencies
- TypeScript: strict mode, ESM, NodeNext module resolution
- Skill names are prefixed `spec-driven-` to namespace them in shared skill directories
- Change names must be kebab-case: `^[a-z0-9]+(-[a-z0-9]+)*$`
