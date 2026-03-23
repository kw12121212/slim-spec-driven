# spec-driven

轻量级规范驱动开发框架：7 个 Claude 技能 + 少量 TypeScript 脚手架。

## 如何辅助 AI 编程

AI 编程助手能力很强，但容易出现几个典型问题：不了解现有行为边界、范围蔓延、决策前后矛盾、没有历史记录。spec-driven 通过三层结构来应对这些问题。

### 第一层：`specs/`——系统的长期记忆

AI 不靠通读代码来理解"系统做什么"，而是读 `specs/`：

- `INDEX.md` 一眼导航全部规格文件
- 每个规格文件用 RFC 2119 格式描述可观测行为（`### Requirement:`、GIVEN/WHEN/THEN 场景）
- `propose` 和 `apply` 都必须先读 INDEX.md 和相关规格文件，才能生成内容或写代码

这样 AI 就知道哪些行为已经存在，不会引入冲突或重复。

### 第二层：变更 artifacts——单次变更的结构化上下文

每个变更是一个目录，包含四个文件，各司其职：

| 文件 | 内容 | 对 AI 的约束 |
|------|------|------------|
| `proposal.md` | 做什么 & 为什么 | 约束 AI 不偏离目标 |
| `specs/` | 规格变化（ADDED/MODIFIED/REMOVED） | 明确本次变更的规格意图 |
| `design.md` | 如何实现——方案与决策 | 防止 AI 中途另起炉灶 |
| `tasks.md` | `- [ ]` 任务清单 | 控制步伐，一次一个任务 |

### 第三层：7 个技能——AI 行为的精确约束

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
| AI 读取已有规格 | 明确要求：`propose` 和 `apply` 必须先读 INDEX.md，再读所有相关规格文件，才能生成任何内容 | "搜索已有规格"（模糊） |
| Delta spec 结构 | 按路径镜像 `specs/`——`changes/<name>/specs/auth/login.md` 对应 `specs/auth/login.md` | 无路径约束 |
| Archive 规格合并 | 硬性门控：移动前必须按路径将每个 delta 文件合并进主 `specs/`，用 ADDED/MODIFIED/REMOVED 标记精确操作 | 仅文件移动 |
| 运行时依赖 | 只用 Node.js 标准库，一个 280 行 TypeScript 文件 | 全局 npm 包（`npm install -g`，需 Node 20.19+） |
| 项目级 AI 规则 | `config.yaml` rules 字段注入每个 skill 提示词 | 无 |
| 设计哲学 | 约束优先——限制本身就是价值所在 | "fluid not rigid"，灵活优先 |
| 工具支持 | Claude Code、OpenCode | 30+ AI 工具 |

**选 spec-driven**：希望 AI 被规格标准强制约束而不能静默绕过，且使用 Claude Code 或 OpenCode。

**选 OpenSpec**：使用多种 AI 工具，更看重流程灵活性，或需要更大的社区支持。

---

## 快速开始

**通过 [skills.sh](https://skills.sh) 安装（推荐 — 不会在项目中产生额外文件）：**
```bash
npx skills add kw12121212/slim-spec-driven
```

`skills` 提示你选择支持的 AI 工具时，按自己实际使用的工具勾选即可。安装范围建议选择公共/全局安装，避免在每个项目里重复生成一份 skills 文件。

**一行安装（curl）：**
```bash
# 全局安装 — 同时支持 Claude Code、OpenCode、Trae、Codex 和 Gemini CLI
curl -fsSL https://raw.githubusercontent.com/kw12121212/slim-spec-driven/main/install.sh | bash

# 项目本地安装（.claude/skills/ + .opencode/skills/ + .trae/skills/ + .codex/skills/ + .gemini/skills/ + .agents/skills/）
curl -fsSL https://raw.githubusercontent.com/kw12121212/slim-spec-driven/main/install.sh | bash -s -- --project

# 指定 CLI 或路径
curl -fsSL .../install.sh | bash -s -- --cli claude
curl -fsSL .../install.sh | bash -s -- --cli opencode
curl -fsSL .../install.sh | bash -s -- --cli trae
curl -fsSL .../install.sh | bash -s -- --cli codex
curl -fsSL .../install.sh | bash -s -- --cli gemini
curl -fsSL .../install.sh | bash -s -- --project /path/to/project
```

**从源码安装（用于开发或实时编辑）：**
```bash
git clone https://github.com/kw12121212/slim-spec-driven ~/Code/slim-spec-driven
cd ~/Code/slim-spec-driven
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

## 工作流

```
init → propose → apply → verify → archive
```

1. **init** — 初始化 `.spec-driven/`，生成 config.yaml、specs/INDEX.md 和 specs/
2. **propose** — 读取现有规格，生成四个变更 artifacts，填写 delta specs
3. **apply** — 逐任务实现，完成后更新 delta specs 使其与实际实现一致
4. **verify** — 检查任务完整性、实现证据、规格格式和对齐情况
5. **archive** — 按文件路径将 delta specs 合并进 `specs/`，更新 INDEX.md，移至 archive/

中途可用 **modify** 调整任意 artifact，用 **cancel** 放弃变更。

## 技能列表

| 技能 | 功能 |
|------|------|
| `/spec-driven-init` | 初始化 `.spec-driven/`，填写 config.yaml |
| `/spec-driven-propose` | 读取现有规格，生成全部四个变更 artifacts |
| `/spec-driven-modify` | 编辑现有变更的某个 artifact |
| `/spec-driven-apply` | 逐任务实现，完成后更新 delta specs |
| `/spec-driven-verify` | 检查完整性、实现证据和规格对齐 |
| `/spec-driven-archive` | 将 delta specs 合并进 specs/，更新 INDEX.md，移至 archive/ |
| `/spec-driven-cancel` | 永久删除进行中的变更（需确认） |
| `/spec-driven-auto` | 自动运行完整工作流（propose → apply → verify → review → archive），仅需一次确认。适合小型、边界清晰的变更。 |

### 自动工作流

`/spec-driven-auto` 适合小型、定义明确的变更：

```bash
/spec-driven-auto 添加用户头像上传功能
```

**适用场景：**
- 变更涉及 ≤3 个模块、≤10 个文件
- 不涉及数据库迁移、认证/支付、跨服务协调
- 范围具体且边界清晰

**会拒绝并回退到分步模式：**
- 范围模糊（如"重构代码库"）
- 变更较大或涉及多个切面
- 高风险区域（认证、支付、多仓库）

唯一必须的确认点在 proposal 之后——其余步骤自动执行，除非遇到阻塞问题。

## 项目结构

```
.spec-driven/
├── config.yaml              # 项目上下文与规则（注入每个技能）
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
    │   └── tasks.md         # 实现任务清单
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
node dist/scripts/spec-driven.js archive <name>  # 移至 archive/YYYY-MM-DD-<name>/
node dist/scripts/spec-driven.js cancel <name>   # 永久删除变更目录
node dist/scripts/spec-driven.js init [path]     # 初始化 .spec-driven/ 脚手架
```
