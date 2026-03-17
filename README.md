# spec-driven

A lightweight spec-driven development framework: 5 Claude skills + thin TypeScript scaffolding.

## Quick Start

```bash
git clone <this-repo> ~/Code/slim-spec-driven
cd ~/Code/slim-spec-driven
npm install
npm run build

# Install skills globally (~/.agents/skills/)
npm run install-skills

# Or install project-locally (.agent/skills/ in CWD)
cd /your/project
npm run install-skills:project
```

## Skills

| Skill | What it does |
|-------|-------------|
| `/spec-driven-propose` | Scaffold a new change with proposal.md, design.md, tasks.md |
| `/spec-driven-modify` | Edit an existing change artifact |
| `/spec-driven-apply` | Implement tasks one by one, marking each complete |
| `/spec-driven-verify` | Check completion and implementation evidence |
| `/spec-driven-archive` | Move a completed change to archive/ |

## Workflow

```
propose → modify → apply → verify → archive
```

1. **propose** a change to get scaffolded artifacts
2. **modify** artifacts to refine the plan
3. **apply** to implement tasks (marks `- [x]` as each completes)
4. **verify** to check implementation matches the proposal
5. **archive** to move the change to `changes/archive/YYYY-MM-DD-<name>/`

## Project Structure

After running `/spec-driven-propose` in a project, you get:

```
.spec-driven/
├── config.yaml          # Project context and rules
├── specs/               # Current-state specs (what the system does)
└── changes/
    ├── <change-name>/
    │   ├── proposal.md  # What & why
    │   ├── design.md    # How (approach, decisions)
    │   └── tasks.md     # Implementation checklist
    └── archive/         # Completed changes
```

## Scripts

Scripts handle filesystem mechanics only — skills handle intelligent content.

```bash
node dist/scripts/propose.js <name>   # Create change scaffold
node dist/scripts/modify.js [name]    # List changes or show artifact paths
node dist/scripts/apply.js <name>     # Parse tasks.md → JSON status
node dist/scripts/verify.js <name>    # Validate artifact format → JSON
node dist/scripts/archive.js <name>   # Move to archive/YYYY-MM-DD-<name>/
```

## Initialize a Project

Copy the template into your project:

```bash
cp -r ~/Code/slim-spec-driven/template /your/project/.spec-driven
```

Then edit `.spec-driven/config.yaml` to add project context.
