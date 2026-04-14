---
mapping:
  implementation:
    - install.sh
    - scripts/spec-driven.ts
    - skills/spec-driven-resync-code-mapping/SKILL.md
    - skills/spec-driven-ship/SKILL.md
  tests: []
---

# Install Behavior

### Requirement: global-install-destination
The installer MUST copy skills to `~/.auto-spec-driven/skills/<name>/` by default.
Each skill directory contains `SKILL.md` and a `scripts/` directory.

### Requirement: install-includes-sync-specs-skill
The installer MUST copy the shipped `spec-driven-sync-specs` skill into the
agent store and create the same CLI symlinks for it as for the other bundled
`spec-driven-*` skills.

### Requirement: install-includes-roadmap-skills
The installer MUST copy the shipped `roadmap-plan`, `roadmap-milestone`,
`roadmap-recommend`, `roadmap-propose`, and `roadmap-sync` skills into the
agent store and create the same CLI symlinks for them as for the other bundled
skills.

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

### Requirement: install-includes-resync-code-mapping-skill
The installer MUST copy the shipped `spec-driven-resync-code-mapping` skill into the
agent store and create the same CLI symlinks for it as for the other bundled
`spec-driven-*` skills.

#### Scenario: resync-code-mapping-skill-installed-for-codex
- GIVEN the installer runs for the Codex CLI target
- WHEN installation completes successfully
- THEN the `spec-driven-resync-code-mapping` skill exists in the agent store
- AND the Codex skills directory links to that installed skill

### Requirement: install-includes-ship-skill
The installer MUST copy the shipped `spec-driven-ship` skill into the agent
store and create the same CLI symlinks for it as for the other bundled
`spec-driven-*` skills.

#### Scenario: ship-skill-installed-for-codex
- GIVEN the installer runs for the Codex CLI target
- WHEN installation completes successfully
- THEN the `spec-driven-ship` skill exists in the agent store
- AND the Codex skills directory links to that installed skill

#### Scenario: ship-skill-installed-for-project-mode
- GIVEN the installer runs with `--project`
- WHEN installation completes successfully
- THEN the project-local agent store contains `spec-driven-ship`
- AND the project-local CLI skill directories link to that installed skill
