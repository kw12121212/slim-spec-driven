# Roadmap Guide

This document shows how to use the roadmap skills in day-to-day work.

The roadmap layer exists for work that spans multiple changes. It lives under:

```text
.spec-driven/
└── roadmap/
    ├── INDEX.md
    └── milestones/
        └── <milestone>.md
```

`roadmap/` is the long-horizon planning layer.
`changes/` is still the execution layer.

## When To Use Roadmap

Use roadmap skills when:
- you have more than one upcoming change
- you need explicit phase boundaries
- you want one durable milestone-level work list above individual changes
- you want milestone completion to follow archive history instead of chat memory

Do not use roadmap files as a replacement for:
- `proposal.md`
- `design.md`
- `tasks.md`
- `questions.md`
- delta specs under `changes/<name>/specs/`

## The Roadmap Skills

There are five roadmap skills in practice: create structure, refine one
milestone, recommend and scaffold the next change, directly scaffold already
chosen planned work, and sync status back from execution history.

### `/roadmap-plan`

Use this when you want to create or restructure the whole roadmap.

Typical uses:
- create the first roadmap
- split one large roadmap into milestones
- reorder milestones
- rename or merge milestone phases

Example:

```bash
/roadmap-plan 我想把 auto-spec-driven 的后续工作拆成 foundation、adoption、scale 三个 milestone
```

Expected effect:
- creates or updates `.spec-driven/roadmap/INDEX.md`
- creates or updates multiple files under `.spec-driven/roadmap/milestones/`
- separates stage goals from concrete execution work

### `/roadmap-milestone`

Use this when you only want to refine one milestone.

Typical uses:
- adjust one milestone's goal
- add or remove planned changes
- tighten done criteria
- rewrite dependencies or risks

Example:

```bash
/roadmap-milestone 调整 m2-adoption，把 plugin marketplace 提前，把 telemetry 推迟到 m3-scale
```

Expected effect:
- edits one milestone file
- keeps the rest of the roadmap stable
- preserves milestone-local planning instead of rewriting the whole roadmap

### `/roadmap-propose`

Use this when a milestone item is already listed under `## Planned Changes` and
you already know that it should be turned into a normal change under
`.spec-driven/changes/`.

Typical uses:
- take one planned item from a milestone and scaffold it as a change without
  running the recommendation step first
- keep roadmap planning separate from execution artifacts
- move from milestone planning into apply/auto execution flow

Example:

```bash
/roadmap-propose add-roadmap-milestones
```

Expected effect:
- creates `.spec-driven/changes/add-roadmap-milestones/`
- fills the standard five change artifacts
- keeps the roadmap file as planning state while the change becomes execution state
- asks you whether to continue with `/spec-driven-apply <name>` or `/spec-driven-auto`

### `/roadmap-recommend`

Use this when you want the roadmap to recommend the next change before you
decide whether to accept it, adjust it, or pick a different roadmap item, and
then scaffold the accepted recommendation directly.

Typical uses:
- ask which milestone item should come next
- choose based on dependencies, urgency, or phase impact
- review a recommendation before confirming the scaffold

Example:

```bash
/roadmap-recommend 推荐下一个最适合启动的 change
```

Expected effect:
- reads roadmap context and roadmap-status output
- recommends one candidate change and explains why
- waits for you to accept or modify it before scaffolding
- creates the standard five change artifacts after confirmation
- asks you whether to continue with `/spec-driven-apply <name>` or `/spec-driven-auto`

### `/roadmap-sync`

Use this when roadmap files and real execution history may have drifted apart.

Typical uses:
- some planned changes were archived
- some planned changes are still active
- a change was renamed
- roadmap status now looks stale

Example:

```bash
/roadmap-sync
```

Expected effect:
- reads `.spec-driven/changes/`
- reads `.spec-driven/changes/archive/`
- reconciles milestone status against real change state
- updates stale roadmap state

## Script Validation

If you want an explicit repository-level check, run:

```bash
node dist/scripts/spec-driven.js verify-roadmap
```

This validates milestone structure and size.

Today it enforces:
- standard milestone section headings
- described planned-change entries using
  `- \`<change-name>\` - Declared: <planned|complete> - <summary>`
- single-line planned change descriptions only; indented continuation lines are invalid
- no more than 10 bullet items under `## Planned Changes`

If a milestone exceeds that size, the command reports it as invalid and tells
you to split it into smaller milestones.

## Recommended Workflow

A common pattern is:

```text
roadmap-plan -> roadmap-milestone -> roadmap-recommend -> auto/apply -> archive -> roadmap-sync
```

In practice:

1. Create the roadmap shape.
2. Refine the current milestone.
3. Use roadmap-recommend if you want a roadmap-specific brainstorm that
   recommends the next change and scaffolds it after confirmation.
4. Use roadmap-propose instead when the planned change is already chosen and
   you want to skip the recommendation step.
5. Implement and archive those changes.
6. Run roadmap sync so milestone state reflects reality.

## Example: Initial Roadmap Setup

Suppose you want three stages:
- `m1-foundation`
- `m2-adoption`
- `m3-scale`

You might start with:

```bash
/roadmap-plan 我想按 foundation、adoption、scale 三个 milestone 规划这个仓库
```

After the skill runs, you would typically get:

```text
.spec-driven/
└── roadmap/
    ├── INDEX.md
    └── milestones/
        ├── m1-foundation.md
        ├── m2-adoption.md
        └── m3-scale.md
```

And one milestone might look like:

```md
# m1-foundation

## Goal
补齐 roadmap、planning、sync 相关基础能力

## In Scope
- define the first roadmap milestone structure
- ship roadmap-specific planning and sync capabilities

## Out of Scope
- speculative scoring or prioritization systems
- unrelated workflow redesign outside roadmap support

## Done Criteria
- roadmap 资产正式进入 .spec-driven/
- roadmap skills 可用
- README / install / tests 已对齐

## Planned Changes
- `add-roadmap-milestones` - Declared: planned - add milestone files and roadmap-specific planning flow, creating the long-lived roadmap scaffold and the first roadmap-aware planning workflow entry points.
- `roadmap-priority-scoring` - Declared: planned - explore roadmap-level prioritization guidance while keeping it secondary to the foundational roadmap mechanics.
- `improve-sync-specs-reporting` - Declared: planned - improve reporting when roadmap and repository state drift so stale or mismatched roadmap state is easier for maintainers to understand quickly.

## Dependencies
- roadmap 不能替代 changes/

## Risks
- milestone 状态必须和 archive 一致

## Status
- Declared: active

## Notes
- This milestone stays focused on roadmap foundations before broader adoption work.
```

## Example: Mid-Flight Roadmap Changes

Mid-flight roadmap edits are normal.

### Case 1: change the whole roadmap structure

If you want to split one milestone into two, reorder the phases, or rename the
stages, use:

```bash
/roadmap-plan 把现有 roadmap 从 3 个 milestone 改成 4 个，并重排顺序
```

This is the right tool for structural changes across the roadmap.

### Case 2: change only one milestone

If you want to:
- move one idea to a later milestone
- add one more planned change
- rewrite done criteria

use:

```bash
/roadmap-milestone 调整 m1-foundation，新增 improve-readme-onboarding 到 planned changes，并重写 done criteria
```

This is the right tool for local edits.

### Case 3: roadmap state no longer matches reality

If some changes have already been archived or are still active, run:

```bash
/roadmap-sync
```

This is the right tool for status reconciliation.

## Planned Changes

`Planned Changes` means:
- concrete work expected to exist under `.spec-driven/changes/`
- should eventually be proposed, implemented, and archived
- contributes to milestone completion
- each line carries a declared status, usually `planned` until archive and then
  `complete`

Treat it as the milestone's only work list, not as a speculative someday
backlog.

## How Milestone Completion Works

Milestone completion is not manual.

A milestone is complete only when all items in `Planned Changes` are archived
under `.spec-driven/changes/archive/`.

That means:
- if one planned change is still active, the milestone is not complete
- if one planned change was never created, the milestone is not complete
- if a planned change line still says `Declared: complete` before archive,
  roadmap-status reports that mismatch
- if roadmap text says "done" but archive state disagrees, roadmap sync should
  correct it

This rule is intentional. It keeps the roadmap tied to repository reality.

## A Concrete End-To-End Example

1. Plan the roadmap:

```bash
/roadmap-plan 为 CLI、workflow、distribution 三个阶段建立 roadmap
```

2. Refine the first milestone:

```bash
/roadmap-milestone 细化 m1-cli，把 add-roadmap-milestones 和 migrate-polish 作为 planned changes
```

3. Ask for the next recommended change:

```bash
/roadmap-recommend 推荐下一个最合理的 roadmap change
```

4. Turn planned work into a normal change:

```bash
/roadmap-propose add-roadmap-milestones
/spec-driven-auto
```

5. After archive, sync roadmap state:

```bash
/roadmap-sync
```

Expected result:
- the milestone file still carries the phase goal and remaining planned work
- archived planned changes are reflected as `Declared: complete`
- the milestone remains open until every listed planned change is archived

## Rules Of Thumb

- Use `roadmap-plan` for shape.
- Use `roadmap-milestone` for one-stage edits.
- Use `roadmap-recommend` when you want a recommendation before you commit.
- Use `roadmap-propose` to hand off planned work into a normal change.
- Use `roadmap-sync` after real execution progress.
- Keep `Planned Changes` concrete and execution-ready.
- Do not manually treat a milestone as done if archive state does not support it.
