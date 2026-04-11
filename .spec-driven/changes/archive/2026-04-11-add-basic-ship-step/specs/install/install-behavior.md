---
mapping:
  implementation:
    - install.sh
    - scripts/spec-driven.ts
    - skills/spec-driven-resync-code-mapping/SKILL.md
    - skills/spec-driven-ship/SKILL.md
  tests:
    - test/run.js
---

# Install Behavior

## ADDED Requirements

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
