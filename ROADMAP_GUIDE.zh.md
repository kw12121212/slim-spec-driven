# Roadmap Guide

[English](ROADMAP_GUIDE.md) | 中文

这份文档说明如何在日常工作中使用 roadmap 相关 skills。

roadmap 这一层用于管理跨多个 change 的长期规划。它位于：

```text
.spec-driven/
└── roadmap/
    ├── INDEX.md
    └── milestones/
        └── <milestone>.md
```

`roadmap/` 是长期规划层。
`changes/` 仍然是执行层。

## 什么时候使用 Roadmap

适合使用 roadmap skills 的情况：
- 你接下来有多个 change 要做
- 你需要明确的阶段边界
- 你想在单个 change 之上保留一个稳定的 milestone 工作列表
- 你希望 milestone 完成状态依据 archive 历史，而不是聊天上下文

不要把 roadmap 文件拿来替代这些 artifacts：
- `proposal.md`
- `design.md`
- `tasks.md`
- `questions.md`
- `changes/<name>/specs/` 下的 delta specs

## Roadmap Skills

实际上一共有五个 roadmap skills：建立结构、细化单个 milestone、推荐并
scaffold 下一个 change、直接 scaffold 已选定的 planned work，以及根据
执行历史回填状态。

### `/roadmap-plan`

当你想创建第一版 roadmap，或者重构整个 roadmap 结构时，用这个。

典型用途：
- 创建第一版 roadmap
- 把一个很大的 roadmap 拆成多个 milestones
- 调整 milestone 顺序
- 重命名或合并 milestone 阶段

示例：

```bash
/roadmap-plan 我想把 auto-spec-driven 的后续工作拆成 foundation、adoption、scale 三个 milestone
```

预期效果：
- 创建或更新 `.spec-driven/roadmap/INDEX.md`
- 创建或更新 `.spec-driven/roadmap/milestones/` 下的多个文件
- 把阶段目标和具体执行工作分开

### `/roadmap-milestone`

当你只想细化一个 milestone 时，用这个。

典型用途：
- 调整某个 milestone 的目标
- 新增或删除 planned changes
- 收紧 done criteria
- 重写 dependencies 或 risks

示例：

```bash
/roadmap-milestone 调整 m2-adoption，把 plugin marketplace 提前，把 telemetry 推迟到 m3-scale
```

预期效果：
- 只编辑一个 milestone 文件
- 其余 roadmap 结构保持稳定
- 保留 milestone 局部规划，而不是重写整个 roadmap

### `/roadmap-propose`

当某个条目已经出现在 milestone 的 `## Planned Changes` 下，并且你想把它
直接转成 `.spec-driven/changes/` 下的普通 change 时，用这个。

典型用途：
- 当 planned item 已经选定时，跳过 recommendation 直接脚手架成正式 change
- 保持 roadmap 规划和执行 artifacts 分层
- 从 milestone 规划切换到 apply/auto 执行流

示例：

```bash
/roadmap-propose add-roadmap-milestones
```

预期效果：
- 创建 `.spec-driven/changes/add-roadmap-milestones/`
- 填充标准的五个 change artifacts
- roadmap 文件继续保留规划角色，而 change 进入执行层
- 明确询问你后续要走 `/spec-driven-apply <name>` 还是 `/spec-driven-auto`

### `/roadmap-recommend`

当你希望 roadmap 先推荐下一个 change，再决定是否接受、修改或改选别的
条目，并在确认后直接把它 scaffold 成普通 change 时，用这个。

典型用途：
- 问 roadmap 当前最适合推进哪个条目
- 按依赖顺序、紧急程度或阶段价值来选下一个 change
- 在正式建 change 前先看推荐并收敛

示例：

```bash
/roadmap-recommend 推荐下一个最适合启动的 change
```

预期效果：
- 读取 roadmap 上下文和 roadmap-status 输出
- 推荐一个 candidate change 并解释原因
- 在你接受或修改之前，不会创建任何 change 文件
- 确认后创建标准的五个 change artifacts
- 明确询问你后续要走 `/spec-driven-apply <name>` 还是 `/spec-driven-auto`

### `/roadmap-sync`

当 roadmap 文件和实际执行历史可能已经发生漂移时，用这个。

典型用途：
- 某些 planned changes 已经 archive
- 某些 planned changes 仍处于 active 状态
- 某个 change 改名了
- roadmap 状态看起来已经陈旧

示例：

```bash
/roadmap-sync
```

预期效果：
- 读取 `.spec-driven/changes/`
- 读取 `.spec-driven/changes/archive/`
- 按真实 change 状态对齐 milestone 状态
- 更新过时的 roadmap 状态

## 脚本验证

如果你想显式做一次仓库级检查，可以运行：

```bash
node dist/scripts/spec-driven.js verify-roadmap
```

它会验证 milestone 的结构和大小。

当前会检查：
- 是否使用标准 milestone section headings
- `## Planned Changes` 下是否不超过 5 个 bullet items

如果某个 milestone 超过这个大小，命令会报告无效，并提示你把它拆成更小的 milestones。

## 推荐工作流

常见模式是：

```text
roadmap-plan -> roadmap-milestone -> roadmap-recommend -> auto/apply -> archive -> roadmap-sync
```

在实际操作里：

1. 先建立 roadmap 结构。
2. 再细化当前 milestone。
3. 如果你想先看建议，用 roadmap-recommend 先做 roadmap 专用的
   brainstorm，确认后直接 scaffold 下一个 change。
4. 如果 planned change 已经明确，则改用 roadmap-propose，跳过推荐步骤。
5. 实现并 archive 这些 changes。
6. 最后运行 roadmap sync，让 milestone 状态回到真实仓库状态。

## 示例：初始化 Roadmap

假设你想要三个阶段：
- `m1-foundation`
- `m2-adoption`
- `m3-scale`

你可以这样开始：

```bash
/roadmap-plan 我想按 foundation、adoption、scale 三个 milestone 规划这个仓库
```

运行后，通常会得到：

```text
.spec-driven/
└── roadmap/
    ├── INDEX.md
    └── milestones/
        ├── m1-foundation.md
        ├── m2-adoption.md
        └── m3-scale.md
```

某个 milestone 可能长这样：

```md
# m1-foundation

## Goal
补齐 roadmap、planning、sync 相关基础能力

## Done Criteria
- roadmap 资产正式进入 .spec-driven/
- roadmap skills 可用
- README / install / tests 已对齐

## Planned Changes
- add-roadmap-milestones
- roadmap-priority-scoring
- improve-sync-specs-reporting

## Dependencies / Risks
- roadmap 不能替代 changes/
- milestone 状态必须和 archive 一致

## Status
in-progress
```

## 示例：中途调整 Roadmap

roadmap 在执行中途修改是正常的。

### 情况 1：调整整个 roadmap 结构

如果你想把一个 milestone 拆成两个、重排阶段顺序，或重命名阶段，用：

```bash
/roadmap-plan 把现有 roadmap 从 3 个 milestone 改成 4 个，并重排顺序
```

这是跨整个 roadmap 的结构性修改入口。

### 情况 2：只改一个 milestone

如果你想：
- 把一个 idea 移到后续 milestone
- 新增一个 planned change
- 重写 done criteria

就用：

```bash
/roadmap-milestone 调整 m1-foundation，新增 improve-readme-onboarding 到 planned changes，并重写 done criteria
```

这是局部修改的正确入口。

### 情况 3：roadmap 状态与现实不一致

如果某些 changes 已经 archive，或者仍处于 active 状态，运行：

```bash
/roadmap-sync
```

这是做状态对齐的正确入口。

## Planned Changes

`Planned Changes` 表示：
- 预期会在 `.spec-driven/changes/` 下落地成具体 change
- 最终应该被 propose、实现并 archive
- 会影响 milestone 完成状态

它应该是 milestone 唯一的工作列表，而不是一个模糊的“以后也许会做”清单。

## Milestone 完成是如何判定的

Milestone 完成不是手工标记的。

只有当 `Planned Changes` 中的所有条目都已经出现在
`.spec-driven/changes/archive/` 下时，这个 milestone 才算完成。

这意味着：
- 如果还有一个 planned change 处于 active，这个 milestone 就没完成
- 如果有一个 planned change 甚至还没创建，这个 milestone 也没完成
- 如果 roadmap 文本写着 done，但 archive 状态不支持，roadmap sync 应该纠正它

这个规则是刻意设计的。它保证 roadmap 始终和仓库现实一致。

## 一个完整的端到端示例

1. 先规划 roadmap：

```bash
/roadmap-plan 为 CLI、workflow、distribution 三个阶段建立 roadmap
```

2. 再细化第一个 milestone：

```bash
/roadmap-milestone 细化 m1-cli，把 add-roadmap-milestones 和 migrate-polish 作为 planned changes
```

3. 先让 roadmap 推荐下一个 change：

```bash
/roadmap-recommend 推荐下一个最合理的 roadmap change
```

4. 把 planned work 转成普通 change：

```bash
/roadmap-propose add-roadmap-milestones
/spec-driven-auto
```

5. archive 后同步 roadmap 状态：

```bash
/roadmap-sync
```

预期结果：
- milestone 文件仍保留阶段目标和剩余 planned work
- 已 archive 的 planned changes 会体现在完成状态里
- 只要还有一个 listed planned change 没 archive，这个 milestone 就保持未完成

## 经验法则

- 用 `roadmap-plan` 管 roadmap 结构。
- 用 `roadmap-milestone` 管单个阶段的内容。
- 用 `roadmap-recommend` 在真正创建 change 前先拿一个推荐。
- 用 `roadmap-propose` 把 planned work 交接成普通 change。
- 在真实执行进展发生后，用 `roadmap-sync` 做状态对齐。
- 始终让 `Planned Changes` 保持具体、可执行。
- 如果 archive 状态不支持，不要手工把 milestone 当成 done。
