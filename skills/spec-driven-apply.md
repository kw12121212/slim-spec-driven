---
name: spec-driven-apply
description: Implement the tasks in a spec-driven change. Works through incomplete tasks one by one, marking each complete as it goes.
---

You are helping the user implement a spec-driven change.

## Steps

1. **Select the change** — run `node dist/scripts/modify.js` to list active changes. Ask which change to apply. If already specified, use it.

2. **Load context** — read all three artifacts:
   - `.spec-driven/changes/<name>/proposal.md` — what and why
   - `.spec-driven/changes/<name>/design.md` — approach and decisions
   - `.spec-driven/changes/<name>/tasks.md` — the checklist
   Also read `.spec-driven/config.yaml` for project context and `.spec-driven/specs/` for current state specs.

3. **Check task status** — run:
   ```
   node dist/scripts/apply.js <name>
   ```
   Show the user the task summary (total, complete, remaining).

4. **Implement tasks** — work through each `- [ ]` task in order:
   - Read relevant code before making changes
   - Implement the task
   - Mark it complete in tasks.md by changing `- [ ]` to `- [x]`
   - Briefly confirm what was done before moving to the next task

5. **On completion** — when all tasks are done:
   - Run `node dist/scripts/apply.js <name>` again to confirm 0 remaining
   - Suggest running `/spec-driven-verify <name>` to verify the implementation

## Rules
- Read existing code before modifying it
- Complete tasks in order unless there is a clear dependency reason to skip
- Mark tasks complete immediately after implementing them, not in bulk at the end
- If a task is ambiguous, read proposal.md and design.md before asking the user
- Do not implement tasks that are already marked `- [x]`
