---
name: spec-driven-verify
description: Verify a spec-driven change is complete and correctly implemented. Checks task completion, implementation evidence, and spec alignment.
---

You are helping the user verify a spec-driven change before archiving.

## Steps

1. **Select the change** — run `node dist/scripts/modify.js` to list active changes. Ask which change to verify. If already specified, use it.

2. **Format check** — run:
   ```
   node dist/scripts/verify.js <name>
   ```
   Report any errors (blocking) or warnings (non-blocking).

3. **Task completion check** — run:
   ```
   node dist/scripts/apply.js <name>
   ```
   If `remaining > 0`, list the incomplete tasks. These are CRITICAL issues.

4. **Implementation evidence check** — for each completed task in tasks.md:
   - Identify what code or files the task should have changed
   - Verify the change actually exists (read relevant files)
   - Note any tasks with no visible evidence as WARNINGs

5. **Spec alignment check** — read `.spec-driven/specs/` and `.spec-driven/changes/<name>/proposal.md`:
   - Does the implementation match what was proposed?
   - If behavior changed, were specs updated?
   - Flag misalignments as WARNINGs or CRITICALs

6. **Output a tiered report**:
   ```
   CRITICAL (blocks archive):
     - [list or "none"]

   WARNING (should address):
     - [list or "none"]

   SUGGESTION (optional improvements):
     - [list or "none"]
   ```

7. **Recommend next step**:
   - If CRITICAL issues: address them before archiving
   - If only WARNINGs: ask user if they want to address them or proceed
   - If clean: suggest `/spec-driven-archive <name>`

## Rules
- Be honest — don't pass a change just because tasks are checked off
- CRITICALs are things that would make the change incorrect or incomplete
- WARNINGs are things that reduce confidence but don't necessarily block
- SUGGESTIONs are optional quality improvements
