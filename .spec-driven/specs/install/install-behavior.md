# Install Behavior

### Requirement: global-install-destination
The installer MUST copy skills to `~/.auto-spec-driven/skills/<name>/` by default.
Each skill directory contains `SKILL.md` and a `scripts/` directory.

### Requirement: install-includes-sync-specs-skill
The installer MUST copy the shipped `spec-driven-sync-specs` skill into the
agent store and create the same CLI symlinks for it as for the other bundled
`spec-driven-*` skills.

### Requirement: install-includes-roadmap-skills
The installer MUST copy the shipped `roadmap-plan`, `roadmap-milestone`, and
`roadmap-sync` skills into the agent store and create the same CLI symlinks for
them as for the other bundled skills.

### Requirement: cli-symlinks
The installer MUST create symlinks from CLI-specific directories into the agent store:
- `~/.claude/skills/<name>` → `~/.auto-spec-driven/skills/<name>` for Claude Code
- `~/.config/opencode/skills/<name>` → `~/.auto-spec-driven/skills/<name>` for OpenCode

### Requirement: cli-targeting
The `--cli` flag restricts which CLI symlinks are created.
- `--cli claude`: only `~/.claude/skills/`
- `--cli opencode`: only `~/.config/opencode/skills/`
- Default (no flag): both CLIs

### Requirement: project-install
With `--project [path]`, skills MUST install to `.agent/skills/` under the given path,
with symlinks in `.claude/skills/` and `.opencode/skills/` within the same path.
Running with `--project` on a directory without `.spec-driven/` initializes it automatically.

### Requirement: uninstall
The `--uninstall` flag MUST remove all CLI symlinks created by the installer.
Copied agent store directories are only removed if they contain no unexpected files.

### Requirement: optional-openspec-migration
The installer MUST support an optional OpenSpec migration mode.
When invoked with `--migrate` (or `--migrate-openspec`), it MUST run the CLI migration flow
against the target project directory selected by `--project [path]` or the current working directory.
It MUST NOT run OpenSpec migration unless the flag is explicitly provided.
