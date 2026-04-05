---
skill_id: spec_driven_auto
name: spec-driven-auto
description: Run the full spec-driven workflow automatically. Proposes, implements, verifies, reviews, and archives a change with one mandatory proposal checkpoint plus any extra confirmations required by blocking conditions.
author: auto-spec-driven
type: agent_skill
version: 1.0.0
---

You are running the full spec-driven workflow end-to-end for a single change.

## Prerequisites

The `.spec-driven/` directory must exist at the **project root**. Before proceeding, verify:
```
ls .spec-driven/
```
If this fails, the project is not initialized. Run `/spec-driven-init` first.

## Steps

1. **Load context** — rebuild working context from the current files before doing anything:
   - You MUST treat all prior conversational context as stale, unreliable, and non-authoritative.
   - You MUST NOT use prior chat context as a source of truth for requirements, task state, implementation details, or completion status.
   - You MUST rebuild working context from the current change artifacts, relevant base specs, and the current repository state before taking any workflow action.
   - If prior chat context differs from the files or repository state in any way, you MUST discard the prior chat context and follow the files and repository state only.
   - Do not use prior chat context unless it has been explicitly re-validated against the current files and repository state.

2. **Assess complexity** — before doing anything else, evaluate the change using a two-tier model:
    - Read `.spec-driven/config.yaml` for project context
    - Read `.spec-driven/specs/INDEX.md` and relevant spec files to understand the current system
    - Read the codebase files that the change will likely touch — estimate the number of files, modules, and cross-cutting concerns involved
   - **Classify the change into one of two tiers:**
     - **Green** (proceed): clear scope and a concrete definition of done within a single repository, including changes that touch up to 15 modules or packages, modify up to 50 files, involve schema migrations with data transformation, modify existing auth/authz/payment logic, or make cross-cutting changes across multiple subsystems — proceed without additional confirmation beyond the standard proposal checkpoint
     - **Red** (suggest brainstorm): requires coordinating across multiple services or repositories, scope is vague or open-ended (e.g. "refactor the codebase", "improve performance"), or has no clear definition of done — explain why and suggest running `/spec-driven-brainstorm` first to converge the idea, then entering `/spec-driven-auto` to execute the resulting proposal
   - If Red, stop and suggest brainstorm
   - If Green, proceed

3. **Propose** — run `/spec-driven-propose`:
   - Run `node {{SKILL_DIR}}/scripts/spec-driven.js propose <name>`
   - Fill all artifacts: proposal.md (with Unchanged Behavior), specs/ delta files, design.md, tasks.md (with ## Testing), questions.md (open questions)
   - Show the user a summary: scope, key decisions, task count, unchanged behaviors, and any open questions
   - **Wait for explicit confirmation** before proceeding — this is the only mandatory checkpoint
   - If questions.md has open questions, list them and ask the user to resolve them before confirming
   - If the user requests changes, apply them and re-confirm

4. **Apply** — implement all tasks:
   - Run `node {{SKILL_DIR}}/scripts/spec-driven.js apply <name>` to show task summary
   - Check questions.md for open `- [ ] Q:` entries — if any, list each unresolved question, ask the user to answer or confirm the decision needed, and stop until the user explicitly resolves them
   - You MAY recommend a preferred answer, but only as a suggestion; you MUST NOT treat your own recommendation as a resolved answer or continue implementation until the user explicitly confirms it
   - Work through each `- [ ]` task in order: read code, implement, verify Unchanged Behavior, mark `- [x]`
   - For `## Testing` tasks: actually run the tests and confirm they pass
   - Run `node {{SKILL_DIR}}/scripts/spec-driven.js apply <name>` to confirm `remaining === 0`

5. **Verify** — check completeness:
   - Run `node {{SKILL_DIR}}/scripts/spec-driven.js verify <name>`
   - Then perform the rest of the `/spec-driven-verify` checks: task completion, open questions, implementation evidence, and spec alignment
   - Treat script `errors` plus any CRITICAL findings from those checks as blockers
   - If there are blockers you can safely fix, fix them automatically, then rerun both the script check and the verification pass
   - If any blocker cannot be auto-fixed: stop and ask the user
   - Re-read delta spec files and update them to match what was actually implemented

6. **Review** — check code quality:
   - Read every file changed by this change
   - Check: readability, security, error handling, performance, best practices, test quality
   - MUST FIX issues: fix them automatically, then re-review
   - If MUST FIX issues cannot be auto-fixed: stop and ask the user
   - SHOULD FIX and NITS: fix if straightforward, otherwise note in the final report

7. **Archive** — close out the change:
    - Confirm there are no incomplete tasks before archiving
    - List all delta files in `specs/` and merge each into the corresponding main spec file
    - If `changes/<name>/specs/` is empty, ask the user to confirm this change has no observable spec impact before continuing
    - Update `.spec-driven/specs/INDEX.md` if new spec files were created
    - Run `node {{SKILL_DIR}}/scripts/spec-driven.js archive <name>`
    - If `.spec-driven/roadmap/` exists, treat any milestone declared status or roadmap index updates performed by the archive command as part of archive closeout
    - Report the final result: what was built, files changed, tests passing, archive location, and any roadmap status changes caused by archive

## Rules
- The context reset in Step 1 is mandatory — never skip it
- The complexity check in Step 2 is mandatory — never skip it
- The user confirmation in Step 3 is mandatory — never skip it
- Additional confirmations are required whenever the workflow is blocked by unresolved questions or an empty delta-spec archive decision
- All other steps run automatically unless blocked by an unresolvable issue
- Follow all config.yaml rules (specs, change, code, test) throughout
- If anything goes wrong mid-flow, stop and explain — do not silently continue
- Mark tasks complete one at a time, not in bulk
- Recommended answers do not count as question resolution without explicit user confirmation
