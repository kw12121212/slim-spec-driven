# Skills Workflow

## spec-driven-propose

- Scaffolds a new change with proposal.md, design.md, tasks.md populated from project context
- Does not modify any codebase files — planning only

## spec-driven-modify

- Edits an existing change artifact without unchecking completed tasks
- Completed tasks (`- [x]`) are preserved unless the user explicitly requests otherwise

## spec-driven-apply

- Implements tasks in order, marking each `- [x]` immediately upon completion
- Loads all three artifacts and specs before writing code
- Confirms `remaining === 0` after completing all tasks

## spec-driven-verify

- Outputs a tiered report: CRITICAL / WARNING / SUGGESTION
- CRITICAL issues block archiving
- Checks both artifact format (via verify.js) and implementation evidence (by reading code)

## spec-driven-archive

- Warns the user if incomplete tasks remain before archiving
- Never deletes — only moves to archive/
