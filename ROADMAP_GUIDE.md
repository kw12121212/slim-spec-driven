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
- you want to track candidate ideas separately from approved work
- you want milestone completion to follow archive history instead of chat memory

Do not use roadmap files as a replacement for:
- `proposal.md`
- `design.md`
- `tasks.md`
- `questions.md`
- delta specs under `changes/<name>/specs/`

## The Three Skills

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
- move items between `Candidate Ideas` and `Planned Changes`
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
- no more than 5 bullet items under `## Planned Changes`

If a milestone exceeds that size, the command reports it as invalid and tells
you to split it into smaller milestones.

## Recommended Workflow

A common pattern is:

```text
roadmap-plan -> roadmap-milestone -> propose -> auto/apply -> archive -> roadmap-sync
```

In practice:

1. Create the roadmap shape.
2. Refine the current milestone.
3. Turn approved planned work into one or more changes.
4. Implement and archive those changes.
5. Run roadmap sync so milestone state reflects reality.

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

## Done Criteria
- roadmap 资产正式进入 .spec-driven/
- roadmap skills 可用
- README / install / tests 已对齐

## Candidate Ideas
- roadmap priority scoring
- roadmap dependency graph

## Planned Changes
- add-roadmap-milestones
- improve-sync-specs-reporting

## Dependencies / Risks
- roadmap 不能替代 changes/
- milestone 状态必须和 archive 一致

## Status
in-progress
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
- promote one candidate idea into planned work
- rewrite done criteria

use:

```bash
/roadmap-milestone 调整 m1-foundation，把 roadmap priority scoring 保留在 candidate ideas，新增 improve-readme-onboarding 到 planned changes
```

This is the right tool for local edits.

### Case 3: roadmap state no longer matches reality

If some changes have already been archived or are still active, run:

```bash
/roadmap-sync
```

This is the right tool for status reconciliation.

## Candidate Ideas vs Planned Changes

This distinction matters.

`Candidate Ideas` means:
- worth tracking
- not yet approved as execution work
- may move, merge, or disappear later

`Planned Changes` means:
- concrete work expected to exist under `.spec-driven/changes/`
- should eventually be proposed, implemented, and archived
- contributes to milestone completion

Do not mix these two sections together. If you do, milestone progress becomes
ambiguous.

## How Milestone Completion Works

Milestone completion is not manual.

A milestone is complete only when all items in `Planned Changes` are archived
under `.spec-driven/changes/archive/`.

That means:
- if one planned change is still active, the milestone is not complete
- if one planned change was never created, the milestone is not complete
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
/roadmap-milestone 细化 m1-cli，把 migrate polish 保留为 candidate idea，把 add-roadmap-milestones 作为 planned change
```

3. Turn planned work into a normal change:

```bash
/spec-driven-propose add-roadmap-milestones
/spec-driven-auto
```

4. After archive, sync roadmap state:

```bash
/roadmap-sync
```

Expected result:
- the milestone file still carries the phase goal and remaining ideas
- archived planned changes are reflected as complete work
- the milestone remains open until every listed planned change is archived

## Rules Of Thumb

- Use `roadmap-plan` for shape.
- Use `roadmap-milestone` for one-stage edits.
- Use `roadmap-sync` after real execution progress.
- Keep `Candidate Ideas` and `Planned Changes` separate.
- Do not manually treat a milestone as done if archive state does not support it.
