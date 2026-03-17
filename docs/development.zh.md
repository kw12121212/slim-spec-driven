# 开发指南

`slim-spec-driven` 的完整开发参考文档。

---

## 目录

1. [设计理念](#设计理念)
2. [架构](#架构)
3. [.spec-driven/ 目录](#spec-driven-目录)
4. [脚本（Scripts）](#脚本scripts)
5. [技能（Skills）](#技能skills)
6. [Skill 与 Script 的关系](#skill-与-script-的关系)
7. [install.sh](#installsh)
8. [测试套件](#测试套件)
9. [新增 Script](#新增-script)
10. [新增 Skill](#新增-skill)
11. [新增 CLI 支持](#新增-cli-支持)

---

## 设计理念

核心原则是**智能与机械分离**：

- **Scripts（脚本）** 负责文件系统操作：创建目录、移动文件、解析复选框计数、验证文件存在。它们简单、快速、可测试。
- **Skills（技能）** 负责所有智能工作：生成内容、实现代码、判断完整性。它们把脚本当作工具来调用。

这种分离带来以下好处：
- 脚本可以在不依赖 AI 模型的情况下进行单元测试
- Skills 可以自由修改而不触碰文件操作逻辑
- 文件系统是唯一的事实来源——没有数据库，没有状态文件

第二个原则是**零运行时依赖**。脚本只使用 Node.js 标准库（`fs`、`path`）。`package.json` 中没有生产环境 `dependencies`，只有用于 TypeScript 编译的 `devDependencies`。

---

## 架构

```
用户调用 skill（如 /spec-driven-apply）
        │
        ▼
  Skill 提示词（SKILL.md）引导 AI
        │
        ├── 读取 .spec-driven/config.yaml     （项目上下文）
        ├── 读取 .spec-driven/specs/           （当前状态规格）
        ├── 读取 .spec-driven/changes/<name>/  （变更文件）
        │
        ├── 调用 node dist/scripts/*.js        （文件系统操作）
        │       └── 读写 .spec-driven/changes/<name>/
        │
        └── 读写代码库文件                      （实际实现）
```

AI 负责协调一切。脚本由 AI 在执行 skill 时调用，而不是由用户直接调用（不过直接调用用于脚本化也完全有效）。

---

## .spec-driven/ 目录

通过将 `template/` 复制到项目根目录来创建：

```
.spec-driven/
├── config.yaml          # 注入到 skills 的项目上下文
├── specs/               # 当前状态规格（系统现在做什么）
│   └── *.md
└── changes/
    ├── <change-name>/   # 每个活跃变更一个目录
    │   ├── proposal.md  # 做什么 & 为什么
    │   ├── design.md    # 怎么做（方案、决策）
    │   └── tasks.md     # - [ ] / - [x] 任务清单
    └── archive/         # 已完成的变更，前缀 YYYY-MM-DD-<name>/
```

### config.yaml

```yaml
schema: spec-driven
context: |
  <项目的自由文本描述>
  Skills 读取这里并用于生成相关内容。
rules:
  specs:
    - 需求描述可观察的行为，而不是实现细节
  tasks:
    - 任务应可独立完成
```

`context` 字段最为关键——它是 skills 在生成 proposal、design 和 tasks 时注入的内容。一个好的 context 应描述：项目是什么、使用什么语言/框架、关键架构决策。

### 文件（Artifact files）

**proposal.md** — 描述*做什么*和*为什么*。章节：`## What`、`## Why`、`## Scope`。不含实现细节。

**design.md** — 描述*怎么做*。章节：`## Approach`、`## Key Decisions`、`## Alternatives Considered`。

**tasks.md** — 实现任务清单。使用标准 Markdown 复选框：
- `- [ ]` 未完成任务
- `- [x]` 已完成任务（`x` 大小写不敏感）

`apply.js` 脚本用正则解析这些：`^\s*-\s*\[x\]\s+` 和 `^\s*-\s*\[ \]\s+`。

---

## 脚本（Scripts）

所有脚本位于 `scripts/*.ts`，编译到 `dist/scripts/*.js`。必须在**项目根目录**（包含 `.spec-driven/` 的目录）下运行。

### propose.ts

**用途：** 为新变更创建目录脚手架和种子文件。

**用法：**
```bash
node dist/scripts/propose.js <kebab-case-name>
```

**执行内容：**
1. 验证名称符合 `^[a-z0-9]+(-[a-z0-9]+)*$`
2. 检查 `.spec-driven/changes/<name>/` 不存在
3. 创建目录
4. 写入带占位符内容的 `proposal.md`、`design.md`、`tasks.md`

**输出（stdout）：**
```
Created change: .spec-driven/changes/my-feature
  .spec-driven/changes/my-feature/proposal.md
  .spec-driven/changes/my-feature/design.md
  .spec-driven/changes/my-feature/tasks.md
```

**退出码：** `0` 成功，`1` 错误（重名、非法名称）

**种子内容：** 占位符文本使用 `[Describe ...]` 和 `[List ...]` 模式。`verify.js` 检测这些模式并发出警告——这是故意的，用来提示 AI 填充内容。

---

### modify.ts

**用途：** 列出活跃变更，或显示指定变更的文件路径。这是一个导航/发现工具——尽管名称是 modify，但它不修改任何文件。

**用法：**
```bash
node dist/scripts/modify.js              # 列出所有活跃变更
node dist/scripts/modify.js <name>       # 显示指定变更的文件路径
```

**无参数时的执行内容：**
- 读取 `.spec-driven/changes/` 目录条目
- 过滤为目录，排除 `archive/`
- 打印列表到 stdout

**有名称参数时的执行内容：**
- 检查变更目录是否存在
- 打印 `proposal.md`、`design.md`、`tasks.md` 的预期路径
- 如果文件不存在，追加 `(missing)`

**输出（无参数）：**
```
Active changes:
  my-feature
  another-change
```

**输出（有名称参数）：**
```
Artifacts for 'my-feature':
  .spec-driven/changes/my-feature/proposal.md
  .spec-driven/changes/my-feature/design.md
  .spec-driven/changes/my-feature/tasks.md
```

**退出码：** 无参数时始终 `0`；有名称参数时 `0` 成功、`1` 未找到

**Skills 调用此脚本的原因：** Skills 用无参数形式在用户未指定变更时枚举可用变更；用有名称参数形式在读取文件前获取明确路径。

---

### apply.ts

**用途：** 解析 `tasks.md` 并输出 JSON 格式的任务状态摘要。

**用法：**
```bash
node dist/scripts/apply.js <name>
```

**执行内容：**
1. 读取 `.spec-driven/changes/<name>/tasks.md`
2. 用正则扫描每一行，匹配 `- [x]`（完成）和 `- [ ]`（未完成）
3. 去除复选框前缀，提取任务文本
4. 输出 JSON

**输出（stdout）：**
```json
{
  "total": 5,
  "complete": 2,
  "remaining": 3,
  "tasks": [
    { "text": "Add the feature", "complete": true },
    { "text": "Write tests", "complete": false }
  ]
}
```

**退出码：** `0` 成功，`1` 错误（变更不存在、tasks.md 不存在）

**重要细节：** 正则对 `x` 大小写不敏感——`- [x]` 和 `- [X]` 都算完成。正则还允许前导空白，因此嵌套列表中的缩进任务也会被计入。

**Skills 用此脚本的两个场景：**
1. 实现开始前向用户展示进度
2. 实现完成后确认 `remaining === 0`

---

### verify.ts

**用途：** 验证文件格式和内容质量。输出结构化 JSON——始终以 `0` 退出，错误信息在 JSON 负载中。

**用法：**
```bash
node dist/scripts/verify.js <name>
```

**执行内容：**
1. 检查变更目录是否存在（不存在则报错）
2. 对 `proposal.md`、`design.md`、`tasks.md` 逐一检查：
   - 文件是否存在（不存在则报错）
   - 文件是否非空（为空则报错）
   - 是否含未填充占位符（`[Describe`、`[List`）→ 警告
3. 检查 `tasks.md` 是否至少有一个复选框 → 无则警告
4. 检查所有任务是否完成 → 有未完成则警告

**输出（stdout）：**
```json
{
  "valid": true,
  "warnings": [
    "proposal.md contains unfilled placeholders",
    "tasks.md has incomplete tasks"
  ],
  "errors": []
}
```

**`valid` 字段：** `errors` 为空时为 `true`。警告不影响 `valid`。

**退出码：** 始终 `0`。由调用方 skill 决定如何处理 errors/warnings。

**设计原理：** `verify.js` 只做格式/完整性检查——它无法判断*实现*是否真正符合 proposal。语义层面的检查由 skill 负责（`spec-driven-verify` 会读取实际代码文件）。

---

### archive.ts

**用途：** 将已完成的变更移动到归档目录，并添加日期前缀。

**用法：**
```bash
node dist/scripts/archive.js <name>
```

**执行内容：**
1. 检查 `.spec-driven/changes/<name>/` 是否存在
2. 用 `new Date().toISOString().slice(0, 10)` 计算今日日期（`YYYY-MM-DD`）
3. 检查 `.spec-driven/changes/archive/YYYY-MM-DD-<name>/` 是否已存在
4. 按需创建 `archive/` 目录
5. 用 `fs.renameSync` 移动目录

**输出（stdout）：**
```
Archived: .spec-driven/changes/my-feature → .spec-driven/changes/archive/2026-03-17-my-feature
```

**退出码：** `0` 成功，`1` 错误（未找到、归档目标已存在）

**重要：** 这是移动而非删除。归档目录作为所有已完成变更的历史记录不断积累。

**边界情况：** 同名变更在同一天归档两次时，第二次会失败，因为目标路径已存在。Skill 在调用脚本前会警告用户，以处理此情况。

---

## 技能（Skills）

Skills 位于 `skills/<name>/SKILL.md`。每个文件是带 YAML frontmatter 的 Markdown，用于指导 AI 如何执行工作流步骤。

### Frontmatter 字段

```yaml
---
name: spec-driven-propose        # 必须与目录名一致
description: 一行摘要             # 显示在 CLI 自动补全中，用于自动调用判断
---
```

`name` 必须与所在目录名一致，且符合 `^[a-z0-9]+(-[a-z0-9]+)*$`。

`description` 至关重要——AI 用它判断是否自动调用该 skill。保持精准简洁。

### spec-driven-propose

**触发时机：** 用户想要开始规划一个新变更。

**流程：**
1. 从用户获取变更名称（或主动询问）
2. 读取 `.spec-driven/config.yaml` 获取项目上下文
3. 运行 `node dist/scripts/propose.js <name>` 创建脚手架
4. 填写 `proposal.md`——做什么和为什么，不含实现细节
5. 填写 `design.md`——方案、决策、备选方案
6. 填写 `tasks.md`——原子化、可独立完成的复选框任务
7. 向用户展示三个文件并询问是否需要调整

**关键约束：** 仅做规划——不触碰代码库文件。提示词中明确写有"不实现任何内容"的规则。

**与脚本的协作方式：** 脚本创建目录结构和带占位符的种子文件。Skill 随后用真实内容覆盖占位符。脚本的角色纯粹是文件系统脚手架。

---

### spec-driven-modify

**触发时机：** 用户想要编辑现有变更的 proposal、design 或任务列表。

**流程：**
1. 运行 `node dist/scripts/modify.js` 列出变更（如果用户未指定）
2. 运行 `node dist/scripts/modify.js <name>` 获取文件路径
3. 读取选定的文件
4. 询问要修改什么（如果未指定）
5. 应用修改，展示摘要

**关键约束：** 对于 `tasks.md`，除非明确被要求，否则绝不取消已勾选的 `- [x]` 任务。这保护了实现进度不会在调整计划时被意外清除。

**为何与 propose 独立成 skill：** 修改进行中的变更需要读取现有内容、理解已完成的工作，并进行精准编辑。Propose 是从零开始。不同的思维模型，不同的规则。

---

### spec-driven-apply

**触发时机：** 用户想要实现一个变更。

**流程：**
1. 运行 `node dist/scripts/modify.js` 列出变更
2. 读取三个文件 + `config.yaml` + `specs/` 获取完整上下文
3. 运行 `node dist/scripts/apply.js <name>` 展示任务摘要
4. 对每个 `- [ ]` 任务：
   - 读取相关代码
   - 实现该任务
   - 立即在 `tasks.md` 中标记为 `- [x]`
5. 结束时再次运行 `node dist/scripts/apply.js <name>` 确认 `remaining === 0`
6. 建议运行 `/spec-driven-verify`

**关键约束：** 每完成一个任务立即标记，而不是最后批量标记。这确保在会话中断时任务列表能准确反映进度。

**上下文加载模式：** Skill 在写下第一行代码前先加载所有三个文件。这防止 AI 自行发挥出与设计文档相矛盾的方案。

---

### spec-driven-verify

**触发时机：** 用户想在归档前确认变更已完成且实现正确。

**流程：**
1. 运行 `node dist/scripts/verify.js <name>` → 格式/完整性检查
2. 运行 `node dist/scripts/apply.js <name>` → 任务完成情况检查
3. 对每个已完成任务，读取实际代码确认变更存在
4. 读取 `specs/` 和 `proposal.md` 检查对齐情况
5. 输出分层报告：CRITICAL / WARNING / SUGGESTION
6. 根据严重程度推荐下一步操作

**分层说明：**
- **CRITICAL（严重）** — 阻止归档（任务未完成、文件缺失、实现与 proposal 不符）
- **WARNING（警告）** — 应当处理但由用户决定（无测试、specs 未更新）
- **SUGGESTION（建议）** — 可选的质量改进

**脚本 vs Skill 的职责边界：**
- `verify.js` 检查：文件存在、非空、无占位符、复选框计数
- Skill 检查：代码是否真正实现了 proposal？测试是否通过？specs 是否已更新？

脚本快速且确定性强。Skill 的验证需要读取代码并推理。

---

### spec-driven-archive

**触发时机：** 用户想要关闭一个已完成的变更。

**流程：**
1. 运行 `node dist/scripts/modify.js` 列出变更
2. 运行 `node dist/scripts/apply.js <name>` → 检查未完成任务
3. 若 `remaining > 0`：警告用户并等待明确确认
4. 运行 `node dist/scripts/archive.js <name>`
5. 报告目标路径，建议运行 `/spec-driven-propose` 处理后续工作

**关键约束：** 绝不跳过未完成任务警告。用户必须做出知情决策。Skill 不会自动中止——它等待确认，允许用户有意归档未完成的工作。

---

## Skill 与 Script 的关系

每个 skill 协调多个脚本。完整调用关系图：

```
spec-driven-propose
  └── propose.js <name>

spec-driven-modify
  ├── modify.js             （列出变更）
  └── modify.js <name>      （获取文件路径）

spec-driven-apply
  ├── modify.js             （列出变更）
  ├── apply.js <name>       （实现前展示进度）
  └── apply.js <name>       （实现后确认完成）

spec-driven-verify
  ├── modify.js             （列出变更）
  ├── verify.js <name>      （格式检查）
  └── apply.js <name>       （任务完成情况检查）

spec-driven-archive
  ├── modify.js             （列出变更）
  ├── apply.js <name>       （未完成任务检查）
  └── archive.js <name>     （移动到归档）
```

`apply.js` 和 `modify.js` 被多个 skill 调用——它们是通用工具。`propose.js` 和 `archive.js` 各自只被一个 skill 调用——它们实现特定的生命周期转换。

---

## install.sh

### 检测逻辑

脚本通过检查 `$SCRIPT_DIR/skills/` 是否存在来判断执行上下文：

```
$SCRIPT_DIR/skills/ 存在  →  本地 clone 模式  →  创建符号链接
$SCRIPT_DIR/skills/ 不存在 →  curl 管道模式   →  下载文件
```

通过 `curl ... | bash` 管道执行时，`$SCRIPT_DIR` 会解析为类似 `/dev/fd/63` 或 `/tmp` 的路径，因此 `skills/` 目录不会存在于那里。

### 符号链接 vs 文件复制

| 模式 | 结果 | 更新方式 |
|------|------|---------|
| 本地 clone | `ln -s skills/<name>` → 真实目录 | 编辑 `skills/*/SKILL.md`，变更立即生效 |
| curl | 将 `SKILL.md` 复制到 `~/.claude/skills/<name>/` | 需重新运行 curl 才能更新 |

`ln` 的 `-sfn` 参数：`-s` 符号链接，`-f` 强制（替换已有链接），`-n` 将目标视为文件而非目录（重新链接目录符号链接时必须加此参数）。

### CLI 目标目录

```bash
declare -A GLOBAL_DIRS=(
  [claude]="$HOME/.claude/skills"
  [opencode]="$HOME/.config/opencode/skills"
  [all]="$HOME/.claude/skills"        # 共享路径：OpenCode 也会读取此处
)
declare -A PROJECT_DIRS=(
  [claude]=".claude/skills"
  [opencode]=".opencode/skills"
  [all]=".claude/skills"              # 共享路径
)
```

新增 CLI 时，在两个数组中都加入对应条目。

### 卸载逻辑

符号链接：`rm <target>`——安全，只移除指针。

curl 安装的目录：只有当目录中仅含 `SKILL.md` 时才删除。这防止意外删除用户已修改的目录。检查方式是用 `ls -A "$target"` 与字符串 `"SKILL.md"` 比较。

---

## 测试套件

### test/run.sh

完全可重复——每次运行前后都会重置状态。修改脚本后，提交前必须保证全部 32 个测试通过。

**结构：**
```bash
reset_state()     # rm -rf 测试变更和归档目录
[1] propose       # 9 个测试
[2] modify        # 5 个测试
[3] apply         # 6 个测试
[4] verify        # 6 个测试
[5] archive       # 6 个测试
reset_state()     # 保持仓库干净
```

**辅助函数：**

`assert_exit label expected_code cmd...` — 运行命令，通过 `echo "EXIT:$?"` 后缀技巧捕获退出码（即使在 `set -e` 下也能正常工作，因为加了 `|| true`）。

`assert_contains label needle haystack` — 使用 `grep -qF`（固定字符串，非正则）。

`assert_json_field label field expected json` — 使用 `grep -m 1 -oP` 配合 Perl 正则前瞻。`-m 1` 至关重要：`apply.js` 输出的 `tasks` 数组中每个任务都含有嵌套的 `"complete": true/false`，否则会对顶层 `complete` 字段造成误匹配。

**test/todo-app/** — 测试夹具项目。`todo.js` 是一个最小化 Node.js CLI，存在的目的是让 `/spec-driven-apply` 在手动测试时有真实代码可修改。自动化测试套件不运行 `todo.js`。

### 新增测试

在对应章节后添加断言。使用现有辅助函数。`CHANGE` 变量（`add-delete-command`）贯穿全程——所有测试状态都在 `.spec-driven/changes/add-delete-command/` 下。

---

## 新增 Script

1. 按照现有模式创建 `scripts/<name>.ts`：
   - 只导入 `fs` 和 `path`
   - 从 `process.argv[2]` 读取主参数
   - 成功时输出到 stdout，错误时输出到 stderr
   - 成功退出 `0`，错误退出 `1`
   - 如果输出结构化数据，使用 JSON

2. 脚本的 CWD 默认为目标项目根目录。始终用 `path.join(".spec-driven", ...)` 构建路径。

3. 重新构建：`npm run build`

4. 在 `test/run.sh` 中添加测试

5. 如果脚本需要对应的 skill，参见下一节。

---

## 新增 Skill

1. 创建 `skills/<name>/SKILL.md`：

```markdown
---
name: <name>
description: <用于自动补全和自动调用判断的一行描述>
---

[提示词内容——用步骤描述工作流，然后列出规则]
```

2. 命名：使用 `spec-driven-` 前缀作为命名空间。名称必须与目录一致：`skills/spec-driven-foo/SKILL.md` → `name: spec-driven-foo`。

3. 提示词结构：
   - `## Steps` — 编号工作流，每步是一个具体操作
   - `## Rules` — AI 不得违反的不变量

4. 明确引用脚本的完整命令（`node dist/scripts/foo.js <name>`），而非抽象描述。

5. 重新运行 `bash install.sh` 更新符号链接（本地 clone 模式因符号链接指向实时文件，自动生效）。

6. 在已初始化 `.spec-driven/` 的项目中调用 `/spec-driven-<name>` 进行手动测试。

---

## 新增 CLI 支持

编辑 `install.sh`：

```bash
declare -A GLOBAL_DIRS=(
  [claude]="$HOME/.claude/skills"
  [opencode]="$HOME/.config/opencode/skills"
  [mynewtool]="$HOME/.config/mynewtool/skills"   # ← 在此添加
  [all]="$HOME/.claude/skills"
)
declare -A PROJECT_DIRS=(
  [claude]=".claude/skills"
  [opencode]=".opencode/skills"
  [mynewtool]=".mynewtool/skills"                 # ← 在此添加
  [all]=".claude/skills"
)
```

如果新 CLI 使用不同的 skill 格式（非 `<name>/SKILL.md`），需要在安装循环中添加条件逻辑来处理不同的文件结构。
