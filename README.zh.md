# spec-driven

[English](README.md) | 中文

轻量级规范驱动开发框架：15 个 agent skills + 少量 TypeScript 脚手架。

## 如何辅助 AI 编程

AI 编程助手能力很强，但容易出现几个典型问题：不了解现有行为边界、范围蔓延、决策前后矛盾、没有历史记录。spec-driven 通过四层结构来应对这些问题。

### 第一层：`specs/`——系统的长期记忆

AI 不靠通读代码来理解"系统做什么"，而是读 `specs/`：

- `INDEX.md` 一眼导航全部规格文件
- 每个规格文件用 RFC 2119 格式描述可观测行为（`### Requirement:`、GIVEN/WHEN/THEN 场景）
- `brainstorm`、`propose`、`apply`、`modify` 和 `sync-specs` 都必须先读 INDEX.md 和相关规格文件，才能生成内容或写代码

这样 AI 就知道哪些行为已经存在，不会引入冲突或重复。

### 第二层：`roadmap/`——长期规划资产

当工作会跨越多个 change 时，AI 可以把阶段性规划保存在
`.spec-driven/roadmap/` 下：

- `INDEX.md` 维护 milestone 的顺序
- 每个 milestone 文件都定义阶段目标、完成标准、已规划的 changes、依赖、
  风险和推导出的状态
- milestone 是否完成只由关联 planned changes 是否已归档推导，不允许手工切换

这样长期规划不会退化成一个超大的 roadmap 文档，也不会只存在于聊天记录里。

### 第三层：变更 artifacts——单次变更的结构化上下文

每个变更是一个目录，包含五个文件，各司其职：

| 文件 | 内容 | 对 AI 的约束 |
|------|------|------------|
| `proposal.md` | 做什么 & 为什么 | 约束 AI 不偏离目标 |
| `specs/` | 规格变化（ADDED/MODIFIED/REMOVED） | 明确本次变更的规格意图 |
| `design.md` | 如何实现——方案与决策 | 防止 AI 中途另起炉灶 |
| `tasks.md` | `- [ ]` 任务清单 | 控制步伐，一次一个任务 |
| `questions.md` | 开放/已解决问题 | 把歧义集中管理，未解决问题会阻塞 apply 和 archive |

### 第四层：15 个技能——AI 行为的精确约束

每个技能都是一份精确的提示词，明确指定：
- 读哪些文件（逐一列出，不模糊）
- 做什么、不做什么（如 `propose` 不碰代码，`apply` 完成一个立即标记一个）
- 硬性规则由 verify 脚本强制执行（规格格式违规会 block 归档）

TypeScript CLI 负责所有文件系统操作，AI 只做内容生成和判断。

### 解决的核心问题

| 问题 | 解法 |
|------|------|
| AI 不了解现有系统行为 | `specs/` 提供结构化系统状态，INDEX.md 导航 |
| AI 范围蔓延 | `proposal.md` 明确 Scope，`tasks.md` 控制步骤 |
| AI 一次做太多 | `apply` 强制逐任务执行，完成即标记 |
| 规格随代码漂移 | delta specs 随变更走，归档时强制合并回主 specs |
| 历史决策丢失 | `design.md` 记录决策理由，`archive/` 保留完整历史 |
| 规格质量参差不齐 | RFC 2119 + Requirement/Scenario 格式强制，违规是 error 而非 warning |

---

## 与 OpenSpec 对比

[OpenSpec](https://github.com/Fission-AI/OpenSpec/) 是该领域最知名的项目（33K stars）。核心思路相同：每个变更一个目录，包含 proposal、specs、design、tasks。差异在于强制程度和设计哲学。

| | spec-driven | OpenSpec |
|--|-------------|----------|
| 规格格式 | 强制 RFC 2119 — `### Requirement:` + MUST/SHOULD/MAY + GIVEN/WHEN/THEN；违规是脚本 error | 无格式要求 |
| AI 读取已有规格 | 明确要求：`brainstorm`、`propose`、`apply`、`modify` 和 `sync-specs` 必须先读 INDEX.md，再读所有相关规格文件，才能生成任何内容 | 无明确要求 |
| Delta spec 结构 | 按路径镜像 `specs/`——`changes/<name>/specs/auth/login.md` 对应 `specs/auth/login.md` | 无路径约束 |
| Archive 规格合并 | 硬性门控：移动前必须按路径将每个 delta 文件合并进主 `specs/`，用 ADDED/MODIFIED/REMOVED 标记精确操作 | 归档时自动更新规格，无正式合并门控 |
| 歧义追踪 | `questions.md` 集中管理开放问题；未解决的问题会阻塞 apply 和 archive | 无内置支持 |
| 运行时依赖 | 只用 Node.js 标准库，一个约 640 行 TypeScript 文件 | 全局 npm 包（`npm install -g @fission-ai/openspec`，需 Node 20.19+） |
| 项目级 AI 规则 | `config.yaml` rules 字段注入每个 skill 提示词 | 无 |
| 设计哲学 | 约束优先——限制本身就是价值所在 | 流动、迭代、易用、可扩展 |
| 工具支持 | 任何兼容 Agent Skills 的 CLI（Claude Code、OpenCode、Trae、Codex、Gemini CLI） | 20+ AI 助手 |

**选 spec-driven**：希望 AI 被规格标准强制约束而不能静默绕过，且使用 Claude Code 或 OpenCode。

**选 OpenSpec**：使用多种 AI 工具，更看重流程灵活性，或需要更大的社区支持。

---

## 快速开始

**通过 [skills.sh](https://skills.sh) 安装（推荐 — 不会在项目中产生额外文件）：**
```bash
npx skills add kw12121212/auto-spec-driven
```

`skills` 提示你选择支持的 AI 工具时，按自己实际使用的工具勾选即可。安装范围建议选择公共/全局安装，避免在每个项目里重复生成一份 skills 文件。

**从源码安装（用于开发或实时编辑）：**
```bash
git clone https://github.com/kw12121212/auto-spec-driven ~/Code/auto-spec-driven
cd ~/Code/auto-spec-driven
npm install && npm run build

bash install.sh                                  # 全局，所有 CLI
bash install.sh --cli claude                     # 全局，仅 Claude Code（~/.claude/skills/）
bash install.sh --cli opencode                   # 全局，仅 OpenCode（~/.config/opencode/skills/）
bash install.sh --cli trae                       # 全局，仅 Trae（~/.trae/skills/）
bash install.sh --cli codex                      # 全局，仅 Codex（通过 ~/.agents/skills/）
bash install.sh --cli gemini                     # 全局，仅 Gemini CLI（通过 ~/.agents/skills/）
bash install.sh --project                        # 项目本地，当前目录
bash install.sh --project /path/to/project       # 项目本地，指定路径
```

**安装目标说明：**

| `--cli` | 全局路径 | 项目本地路径 |
|---------|---------|------------|
| `all`（默认） | `~/.claude/skills/` + `~/.config/opencode/skills/` + `~/.trae/skills/` + `~/.agents/skills/` | `.claude/skills/` + `.opencode/skills/` + `.trae/skills/` + `.codex/skills/` + `.gemini/skills/` + `.agents/skills/` |
| `claude` | `~/.claude/skills/` | `.claude/skills/` |
| `opencode` | `~/.config/opencode/skills/` | `.opencode/skills/` |
| `trae` | `~/.trae/skills/` | `.trae/skills/` |
| `codex` | `~/.agents/skills/` | `.codex/skills/` |
| `gemini` | `~/.agents/skills/` | `.gemini/skills/` |

## 四种使用流程

根据任务性质选择：

| 场景 | 流程 | 命令 |
|------|------|------|
| 小型 issue，范围清晰 | **auto**（一键完成） | `/spec-driven-auto 添加用户头像` |
| 普通 ticket，需求明确 | **propose → apply → verify → review → archive** | `/spec-driven-propose` → `/spec-driven-apply` → ... |
| 代码已先于 spec 演进 | **sync-specs** | `/spec-driven-sync-specs` |
| 需要长期、多阶段规划 | **roadmap-plan → roadmap-milestone → roadmap-recommend → roadmap-sync** | `/roadmap-plan` → `/roadmap-milestone` → `/roadmap-recommend` → `/roadmap-sync` |
| 模糊概念，需要探索 | **brainstorm → auto** | `/spec-driven-brainstorm` → 确认 → `/spec-driven-auto` |

### 1. 自动流程（小型 Issue）

适合范围清晰的小改动——单一功能、少量文件、无跨切面逻辑：

```bash
/spec-driven-auto 添加用户头像上传功能
```

自动执行 propose → apply → verify → review → archive，包含一个强制的 proposal 确认点，以及由阻塞条件触发的额外确认（例如 open questions 或空 delta archive 决策）。若范围模糊，会建议先 brainstorm 再 auto。

### 2. 标准流程（普通 Ticket）

适合需求明确但实现较复杂的常规任务：

```
/spec-driven-propose 添加订单追踪功能
/spec-driven-apply
/spec-driven-verify
/spec-driven-review
/spec-driven-archive
```

中途可用 `/spec-driven-modify` 调整 artifacts，用 `/spec-driven-spec-edit` 直接创建或修改主 spec 文件；若代码已经先于 spec 演进，可用 `/spec-driven-sync-specs` 做补齐。

若需要在多个变更之上维护长期路线图，可用
`/roadmap-plan`、`/roadmap-milestone`、`/roadmap-recommend`、`/roadmap-propose` 和 `/roadmap-sync` 来维护 milestone 化的 roadmap。现在 `roadmap-recommend` 更像 roadmap 专用的 brainstorm：确认后会直接把 change scaffold 出来；`roadmap-propose` 则保留为“已知 planned change 时可直达”的入口。

### 3. Sync Specs 流程（代码领先于 Spec）

适合初始化阶段，或一段时间人工改动后需要把代码中的既有行为同步回
spec 的场景：

```bash
/spec-driven-sync-specs
/spec-driven-sync-specs 只扫描 CLI 目录
```

它会先读取 config 和现有 specs，再扫描全仓或指定范围，创建一个专用的
spec-only change，并在对话中总结已确认差距和未决问题。不写产品代码，
也不会生成单独的报告文件。

### 4. 探索流程（模糊概念）

适合方向、范围或问题本身都还不清晰的需求：

```
/spec-driven-brainstorm 改进大型变更的任务规划方式
```

进入讨论阶段——读取上下文、帮助收敛目标和取舍、给出变更名。显式确认后，生成与 `/spec-driven-propose` 相同的五个 artifacts，然后可选择进入 `/spec-driven-auto` 执行或用 `/spec-driven-modify` 继续修改。

### 5. Roadmap 流程（Milestone 规划）

适合需要跨多个 change 维护阶段目标和前进顺序的长期规划：

```bash
/roadmap-plan
/roadmap-milestone
/roadmap-recommend
/roadmap-propose
/roadmap-sync
```

这组技能会维护 `.spec-driven/roadmap/` 这层长期资产，按 milestone
拆分规划，并把单行 `Planned Changes` 作为 milestone 唯一的工作列表，
格式为 `- \`<change-name>\` - Declared: <planned|complete> - <summary>`。
`roadmap-recommend`
现在会先推荐下一个 roadmap-backed change，并在显式确认后直接把它转成
普通 change，再明确让用户选择后续走 `apply` 还是 `auto`。`roadmap-propose`
仍然保留给“已经选好 planned change，想直接建 change”的场景。milestone
完成状态只由关联 planned changes 是否归档来推导。

更具体的示例、修改方式和产物效果，见 [ROADMAP_GUIDE.zh.md](ROADMAP_GUIDE.zh.md)；英文版见 [ROADMAP_GUIDE.md](ROADMAP_GUIDE.md)。

---

## 完整工作流参考

```
init → [roadmap-plan / roadmap-milestone / roadmap-recommend / roadmap-propose / roadmap-sync] → [brainstorm] → propose → apply → verify → review → archive
```

1. **init** — 初始化 `.spec-driven/`，生成 config.yaml、roadmap/、specs/INDEX.md 和 specs/
2. **brainstorm** — 讨论模糊想法，收敛范围并确认变更名后再生成产物，然后可选择进入 auto 执行或继续修改
3. **propose** — 读取现有规格，生成五个变更 artifacts，填写 delta specs
4. **apply** — 逐任务实现，完成后更新 delta specs 使其与实际实现一致
5. **verify** — 检查任务完整性、实现证据、规格格式和对齐情况
6. **review** — 在归档前审查已完成变更的代码质量
7. **archive** — 由 AI 按文件路径将 delta specs 合并进 `specs/` 并更新 INDEX.md；随后由 archive 脚本将 change 移入 `archive/`

需要长期规划时，可用 **roadmap-plan**、**roadmap-milestone**、
**roadmap-recommend**、**roadmap-propose** 和 **roadmap-sync** 维护 milestone 化 roadmap。用 **roadmap-recommend** 时，会先像 roadmap 专用 brainstorm 一样收敛并推荐下一个 change，确认后直接 scaffold；如果 planned change 已经明确，也可直接用 **roadmap-propose**。中途可用 **modify** 调整任意 artifact，用 **spec-edit** 直接创建或修改主 spec 文件，用 **sync-specs** 把现有代码行为补回规格，用 **cancel** 放弃变更。

## 技能列表

| 技能 | 功能 |
|------|------|
| `/spec-driven-brainstorm` | 从模糊想法开始讨论，收敛范围与变更名，确认后生成完整的五个 proposal artifacts |
| `/spec-driven-init` | 初始化 `.spec-driven/`，填写 config.yaml |
| `/spec-driven-maintenance` | 查看或运行纯手动 maintenance 工作流，只执行仓库显式配置的安全自动修复 |
| `/spec-driven-propose` | 读取现有规格，生成全部五个变更 artifacts |
| `/spec-driven-modify` | 编辑现有变更的某个 artifact |
| `/spec-driven-spec-edit` | 直接创建或修改 `.spec-driven/specs/` 下的主 spec 文件（修改前需确认） |
| `/spec-driven-sync-specs` | 扫描代码与现有 specs 的差距，创建一个专用的 spec-only change，并在对话中输出差距摘要 |
| `/roadmap-plan` | 创建或重构 `.spec-driven/roadmap/`，按 milestone 组织阶段目标 |
| `/roadmap-milestone` | 细化单个 milestone 的目标、planned changes、风险与状态 |
| `/roadmap-recommend` | 基于 roadmap 推荐下一个 change，确认后直接 scaffold，并显式交接到 `apply` 或 `auto` |
| `/roadmap-propose` | 当某个 planned change 已经明确时，直接把它转成 `.spec-driven/changes/` 下的普通 change |
| `/roadmap-sync` | 根据 active/archive changes 同步 roadmap 里的 milestone 状态 |
| `/spec-driven-apply` | 逐任务实现，完成后更新 delta specs |
| `/spec-driven-verify` | 检查完整性、实现证据和规格对齐 |
| `/spec-driven-review` | 在归档前审查已完成变更的代码质量 |
| `/spec-driven-archive` | 由 AI 合并 delta specs 并更新 INDEX.md；由脚本将 change 移入 archive/ |
| `/spec-driven-cancel` | 永久删除进行中的变更（需确认） |
| `/spec-driven-auto` | 自动运行完整工作流（propose → apply → verify → review → archive），包含一个强制的 proposal 确认点，以及由阻塞条件触发的额外确认。范围模糊时建议先 brainstorm。 |

### 自动工作流

`/spec-driven-auto` 适合小型、定义明确的变更：

```bash
/spec-driven-auto 添加用户头像上传功能
```

**适用场景：**
- 变更涉及 ≤3 个模块、≤10 个文件
- 不涉及数据库迁移、认证/支付、跨服务协调
- 范围具体且边界清晰

**范围模糊时引导至 brainstorm：**
- 范围模糊（如"重构代码库"）
- 变更较大或涉及多个切面
- 高风险区域（认证、支付、多仓库）

brainstorm 产出提案后，可进入 `/spec-driven-auto` 执行。

默认必须的确认点在 proposal 之后；如果遇到 open questions、空 delta archive 决策等阻塞条件，还需要额外的显式确认。

### Brainstorm 工作流

`/spec-driven-brainstorm` 适合还在探索方向的需求：

```bash
/spec-driven-brainstorm 改进大型变更的任务规划方式
```

它会先读取项目上下文和相关 specs，帮助收敛目标、范围与取舍，给出
kebab-case 变更名，并在显式确认后再生成与 `/spec-driven-propose`
相同的五个 proposal artifacts。之后可选择进入 `/spec-driven-auto` 执行或用 `/spec-driven-modify` 继续修改。

## 项目结构

```
.spec-driven/
├── config.yaml              # 项目上下文与规则（注入每个技能）
├── roadmap/
│   ├── INDEX.md             # 长期路线图的 milestone 顺序
│   └── milestones/
│       └── <milestone>.md   # 目标、范围边界、planned changes、风险、备注与状态
├── specs/
│   ├── INDEX.md             # 所有规格文件的顶层索引
│   ├── README.md            # 规格格式与约定说明
│   └── <分类>/              # 每个领域一个目录
│       └── <主题>.md        # RFC 2119 格式的需求文档
└── changes/
    ├── <变更名>/
    │   ├── proposal.md      # 做什么 & 为什么
    │   ├── specs/           # Delta 规格，镜像主 specs/ 结构
    │   │   └── <分类>/
    │   │       └── <主题>.md  # ADDED / MODIFIED / REMOVED Requirements
    │   ├── design.md        # 如何实现（方案、决策、备选方案）
    │   ├── tasks.md         # 实现任务清单
    │   └── questions.md     # 开放问题与已解决问答
    └── archive/             # 已归档变更（YYYY-MM-DD-<名称>/）
```

## 规格格式

```markdown
### Requirement: <名称>
The system MUST/SHOULD/MAY <可观测行为>.

#### Scenario: <名称>
- GIVEN <前置条件>
- WHEN <触发动作>
- THEN <预期结果>
```

**关键词**：MUST = 必须，SHOULD = 建议，MAY = 可选（RFC 2119）。

Delta 规格使用 `## ADDED Requirements`、`## MODIFIED Requirements`、`## REMOVED Requirements` 三个区块。归档时，每个 delta 文件按文件路径合并到对应的主规格文件，通过 `### Requirement: <名称>` 精准定位需求条目。

## 脚本参考

脚本只负责文件系统操作，智能内容由技能生成。

```bash
node dist/scripts/spec-driven.js propose <name>  # 创建变更脚手架
node dist/scripts/spec-driven.js modify [name]   # 列出变更或显示 artifact 路径
node dist/scripts/spec-driven.js apply <name>    # 解析 tasks.md → JSON 状态
node dist/scripts/spec-driven.js verify <name>   # 验证 artifact 格式 → JSON
node dist/scripts/spec-driven.js verify-roadmap [path]  # 验证 roadmap milestone 结构与大小 → JSON
node dist/scripts/spec-driven.js roadmap-status [path]  # 对比 roadmap milestone 与 active/archive change 状态 → JSON
node dist/scripts/spec-driven.js archive <name>  # 移至 archive/YYYY-MM-DD-<name>/
node dist/scripts/spec-driven.js cancel <name>   # 永久删除变更目录
node dist/scripts/spec-driven.js init [path]     # 初始化 .spec-driven/ 脚手架
node dist/scripts/spec-driven.js run-maintenance [path]      # 立即运行手动 maintenance 工作流
node dist/scripts/spec-driven.js migrate [path]  # 迁移 openspec/ 产物
node dist/scripts/spec-driven.js list            # 列出所有变更（活跃 + 已归档）
```

## 手动 Maintenance 工作流

`run-maintenance` 会读取 `.spec-driven/maintenance/config.json`，只执行仓库显式配置的检查项与安全自动修复。

配置示例：

```json
{
  "changePrefix": "maintenance",
  "branchPrefix": "maintenance",
  "commitMessagePrefix": "chore: maintenance",
  "checks": [
    {
      "name": "lint",
      "command": "npm run lint",
      "fixCommand": "npm run lint:fix"
    }
  ]
}
```

配置行为：
- `checks` 是必填项；只允许执行其中列出的检查与 `fixCommand`
- `changePrefix`、`branchPrefix`、`commitMessagePrefix` 为可选项，缺省时会回退到 maintenance 默认值
- 不会安装任何定时器或后台任务；maintenance 只会在显式触发时运行

`run-maintenance`：
- 当 maintenance 配置缺失或无效时会报错退出
- 当仓库有未提交修改、没有配置检查项，或已经存在活跃 maintenance change 时会跳过
- 当所有配置检查都通过时会 clean 退出
- 当失败检查没有安全的 `fixCommand` 时，会报告 unfixable
- 当 fix、archive、commit 或切回原分支失败时，会报告 blocked
- 当可安全修复时，会创建独立的 maintenance branch/change，执行修复、归档变更、在 maintenance 分支上提交结果，并在成功后切回原分支

## 许可证

[Apache License 2.0](LICENSE)
