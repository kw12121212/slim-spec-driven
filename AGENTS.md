# AGENTS.md

Instructions for AI agents working in this repository.

## What This Repo Is

`slim-spec-driven` is a lightweight spec-driven development framework. It ships:

- **5 Claude skills** (`skills/*/SKILL.md`) — AI prompts that drive the workflow
- **5 TypeScript scripts** (`scripts/*.ts`) — filesystem mechanics only (create, move, parse, validate)
- **`install.sh`** — installs skills to `~/.agent/skills/` then symlinks into `~/.claude/skills/` / `~/.config/opencode/skills/`
- **`template/`** — starter `.spec-driven/` directory for target projects
- **`test/`** — automated test suite + todo-app fixture for dogfooding

## Directory Structure

```
slim-spec-driven/
├── scripts/          # TypeScript source — compiled to dist/scripts/*.js
├── skills/           # Skill prompt files (Agent Skills standard)
│   └── <name>/SKILL.md
├── template/         # .spec-driven/ starter template
├── test/
│   ├── run.sh        # Test runner (32 tests, fully repeatable)
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

Tests are fully repeatable — they reset state before and after each run. All 32 must pass before committing changes to scripts.

## Skill Format

Skills follow the [Agent Skills standard](https://agentskills.io): a directory containing `SKILL.md` with YAML frontmatter.

```
skills/
└── spec-driven-propose/
    └── SKILL.md       ← frontmatter: name, description; body: prompt content
```

Frontmatter fields used: `name`, `description`. Both CLIs (Claude Code, OpenCode) read `~/.claude/skills/`.

## Scripts Contract

Scripts handle **filesystem mechanics only** — no content generation, no AI logic.

| Script | CWD assumption | Input | Output |
|--------|---------------|-------|--------|
| `propose.js <name>` | project root | kebab-case name | creates `.spec-driven/changes/<name>/` with seed files |
| `modify.js [name]` | project root | optional name | stdout: change list or artifact paths |
| `apply.js <name>` | project root | change name | stdout: JSON `{total, complete, remaining, tasks}` |
| `verify.js <name>` | project root | change name | stdout: JSON `{valid, warnings[], errors[]}` |
| `archive.js <name>` | project root | change name | moves change to `.spec-driven/changes/archive/YYYY-MM-DD-<name>/` |

All scripts exit `0` on success, `1` on error (except `verify.js` which always exits `0` and reports errors in JSON).

## The .spec-driven/ Workflow

This repo uses its own workflow. To propose a change to this project:

```
/spec-driven-propose   → fills .spec-driven/changes/<name>/
/spec-driven-apply     → implements tasks, marks [x]
/spec-driven-verify    → checks implementation
/spec-driven-archive   → moves to archive/
```

Changes in progress live in `.spec-driven/changes/`. Completed changes are in `.spec-driven/changes/archive/`.

## install.sh Flags

```bash
bash install.sh                          # global: store in ~/.agent/skills/, symlink into both CLIs
bash install.sh --cli claude             # global: store in ~/.agent/skills/, symlink into ~/.claude/skills/ only
bash install.sh --cli opencode           # global: store in ~/.agent/skills/, symlink into ~/.config/opencode/skills/ only
bash install.sh --project                # project-local: store in .agent/skills/, symlink into .claude/skills/ + .opencode/skills/
bash install.sh --project /path/to/proj  # project-local at path
bash install.sh --uninstall              # remove symlinks and agent store entries (same --cli/--project flags)
```

Skills live in `~/.agent/skills/` (or `.agent/skills/` for project mode). CLI-specific directories only hold symlinks pointing there.

Skills are always copied into the agent store (never symlinked), making the store git-friendly. CLI-specific directories hold symlinks pointing into the agent store.

## Conventions

- Scripts use Node.js stdlib only — no external runtime dependencies
- TypeScript: strict mode, ESM, NodeNext module resolution
- Skill names are prefixed `spec-driven-` to namespace them in shared skill directories
- Change names must be kebab-case: `^[a-z0-9]+(-[a-z0-9]+)*$`
