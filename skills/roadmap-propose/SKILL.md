---
skill_id: roadmap_propose
name: roadmap-propose
description: Turn a roadmap milestone Planned Changes item into a normal spec-driven change scaffold.
author: auto-spec-driven
type: agent_skill
version: 1.0.0
---

You are helping the user turn planned roadmap work into a normal spec-driven
change.

## Prerequisites

The `.spec-driven/` directory must exist at the **project root**. Before
proceeding, verify:
```
ls .spec-driven/
```
If this fails, the project is not initialized. Run `/spec-driven-init` first.

If `.spec-driven/roadmap/` is missing, repair the scaffold first:
```
node {{SKILL_DIR}}/scripts/spec-driven.js init
```

## Steps

1. **Identify the target planned change** — determine which milestone item the
   user wants to turn into a real change. If they already gave a change name,
   use it. Otherwise ask which `Planned Changes` item to promote.

2. **Read roadmap and spec context first** — before scaffolding anything, read:
    - `.spec-driven/config.yaml`
    - `.spec-driven/roadmap/INDEX.md`
    - the milestone file that contains the target item
    - `.spec-driven/specs/INDEX.md`
    - the relevant main spec files the new change is likely to touch
    - the selected planned change entry as a single-line roadmap input

3. **Confirm it is already planned work** — verify that the selected name is
    present under a milestone `## Planned Changes` section before scaffolding.

4. **Extract the roadmap handoff context** — treat the selected planned change
   entry as more than a name lookup:
    - use the canonical first line to identify the change name and summary
    - use the surrounding milestone sections as context for scope, rationale,
      sequencing, or constraints when the one-line summary is not sufficient

5. **Scaffold the change** — run:
    ```
    node {{SKILL_DIR}}/scripts/spec-driven.js propose <name>
    ```
    This creates `.spec-driven/changes/<name>/` with seeded artifact templates.

6. **Fill the standard proposal artifacts** — populate:
    - `proposal.md`
    - `design.md`
    - `tasks.md`
    - `questions.md`
    - delta specs under `changes/<name>/specs/`
    Use the roadmap milestone as planning input, but treat the selected planned
    change as a single-line item and derive any extra context from the milestone
    sections rather than multiline planned change detail.

7. **Validate artifact format** — run:
    ```
    node {{SKILL_DIR}}/scripts/spec-driven.js verify <name>
    ```
    If the command reports repairable format issues, fix them and rerun verify.

8. **Offer the execution handoff** — report the new change path, note which
    milestone it came from, surface any open questions that must be resolved
    before implementation, and ask the user whether they want to:
    - enter `/spec-driven-apply <name>` for the stepwise execution path
   - enter `/spec-driven-auto` for the end-to-end execution path
   Do not auto-enter either execution path without the user's explicit choice.

## Rules

- This skill creates planning artifacts only — do not implement product code
- Only turn `Planned Changes` into change scaffolds
- Create the same five artifacts as `spec-driven-propose`
- Before finishing, rerun `verify` until all repairable format issues are fixed
