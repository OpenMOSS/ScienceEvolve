# main / SDK 功能一致性与宿主边界

[← 返回 SDK README](../README_zh-CN.md) · [English](main-sdk-parity.md) | **简体中文**

> 历史记录：legacy 引擎及其 API/CLI 入口已移除。下文保留旧版本设计与验收事实；当前用法见 [CLI/API 手册](main-cli-zh.md)。

当前宿主说明更新日期：2026-10-16。默认 SDK 与 CLI 使用固定 main 内核；旧 `/legacy` 引擎已移除，下文旧接口仅作历史记录。当前来源为 `6bf6a7bb5b200e92511aa4010b7d5fc3711ed79b`，正式项目状态、Workflow 自动恢复、按需上下文和 Git 查询、撤销、交付机制已同步。宿主扩展和实际验证范围见 [2026-10-16 同步记录](main-sync-20261016-zh.md)；下方 2026-09-26 的 legacy 对齐表仅作历史记录。

## 当前默认 main 的宿主边界

| 范围 | Web/Server | 独立 SDK |
| --- | --- | --- |
| 入口 | Web、HTTP、SSE、可视化画布 | Node API、CLI、异步事件流 |
| GitHub 认证 | 部署者注册 OAuth App，用户在网页账号库授权 | tokenEnv、credentialResolver 或 HTTPS helper；无需注册 Web OAuth App |
| 模型部署 | 网关库与项目 Agent 的 gatewayId | 显式网关库与 gatewayBindings，或宿主注册的 nativeCodexProfiles 别名 |
| 工作目录 | 服务端分配项目目录与 worktree | 可选 workspace；Git-off 原地共享，Git-on 隔离执行后交付回原目录 |
| Harness | Codex、pi、DSH、Claude Code | 另含 Hermes ACP 宿主扩展 |
| 输入材料 | 网页上传与共享 user_inputs | CLI/API 或 workflow 的 inputs / inputDescription |
| 实验工具 | 服务端 SII 生命周期与显式 experimentMcp | 可选宿主 sii 配置与显式 experimentMcp |
| 配置推荐与 Explainer | Web 宿主专用服务与产品 MCP | 默认公开 SDK 不导出这些网页服务 |

工作流核心负责路由、每轮能力、Loop、终止、成果与恢复；入口、文件选择、网关绑定和部署路径由宿主管理。SDK 的 gatewaySource 不属于当前启动 workflow；API-key env/profile 使用显式一次性导入。Agent 脚本沿用宿主统一启动环境，旧 proxy 字段在规范化时忽略。

流程自修改遵循当前提案的 editableFields / lockedRuntime；已接受的 Project Skill/MCP 定义不可同名改写、替换或删除，调整内容需新增名称并更新引用。SDK 的运行数据仍有严格的引擎与 runtimeRevision 边界，不能将 Web、legacy 或其他修订的 dataDir 直接混用。

当前部署与恢复见 [main CLI/API](main-cli-zh.md)，共享文件规则见 [输入材料](project-inputs-zh.md)，实验工具见 [SII 异步实验](sii-experiments-zh.md)。

## 历史：2026-09-26 legacy 对齐记录

以下保留当时的接口、字段与设计要求，不作为当前默认 main 的使用合同。

ScienceEvolve 的 Web/Server（下文称 `main`）与 `@scienceevolve/sdk` 保持相同的工作流和运行时语义，但仍是两个独立宿主。两边不要求具有相同入口或存储实现；进入工作流核心后的路由、权限、Loop、终止、恢复和安全规则必须一致。

### 宿主差异

| `main` | SDK | 共同语义 |
| --- | --- | --- |
| Web、HTTP、SSE | TypeScript API、CLI、异步事件流 | 同一状态机与标准事件 |
| 服务端 Project 存储 | `dataDir` 本地存储 | 幂等恢复与迁移 |
| 选择已保存的 `gatewayId` | `gatewaySource=env/profile` | 调用前解析并锁定 Gateway 路由 |
| 服务端分配受控 Workspace | 调用方可传 `workspace` | 一个项目只有一个业务 Workspace |
| 可视化 Workflow 画布 | JSON、API、CLI | 同一 Workflow schema 与校验规则 |

SDK 不包含 Web 页面，`main` 也不会接受调用方提供的任意服务器绝对路径。凭据、Gateway 快照、宿主路径和 `dataDir` 都不是通用 Workflow 字段。

### 一致的工作流语义

#### Main 权限

Main 只有两种控制模式：

- `autonomous`：初始调度、确定路由、终止验收、异常恢复、用户输入、Loop 批次返回和重配置续跑。它可以选择任意已配置的普通 Agent；是否可以完成、请求用户或修改 Workflow，由本轮 capability 单独决定。
- `weak-branch`：只处理某个来源 Agent 的多个弱边候选，只能选择本轮候选，不能请求用户或修改 Workflow。

候选中出现 `finish` 不表示弱分支可以直接完成。选择 `finish` 只会安排新的 autonomous 终止验收；完成权限只在合法终止上下文中出现。Main 和 Control 工具使用同一份 capability 快照，Prompt、工具 schema 和服务端校验不会分别猜测权限。

Main 的系统 Prompt 常驻根任务编排策略：重建目标合同、判断是否值得派发、管理依赖与文件写入所有权、监控执行、核验实际产物/测试/日志，再整合验收。Worker 不获得该根编排策略；Worker 的报告只是证据索引，不替代真实检查，也不扩大用户授权。

#### Loop

```json
{
  "id": "refinement",
  "from": "review",
  "to": "execution",
  "maxIterations": 3,
  "exitTo": "main"
}
```

`to` 是循环组入口，`from` 是组尾，`maxIterations` 是每批迭代数，`exitTo` 是批次耗尽后的目标。运行状态分别保存当前批迭代数、批次号和累计迭代数；暂停、恢复、失败重试和普通重配置不会重置计数。批次耗尽进入 Main 时属于 autonomous 调度，但不会绕过原来的终止条件。

`main` 画布不创建 Loop 节点：真实的 `from -> to` 强边显示为循环返回边，`from -> exitTo` 显示为只读虚线退出边。点击返回边可编辑 ID、批大小和退出目标；运行视图显示 batch、iteration 和 total。删除或改名会破坏 Loop 时，界面要求先显式删除 Loop。SDK 使用同一结构，通过 JSON/API/CLI 配置。

#### 共享 Workspace 与 Artifact

新项目的所有 Agent 使用同一业务 Workspace 和 `Memory.md`。Agent 身份、Session、日志与调用级临时目录仍保持隔离。旧项目的 `<agent>/shared/` 文件原地保留，既不合并也不覆盖；读取旧产物时保留兼容回退。

`publish_artifact` 是正式登记边界，不再用于 Agent 间搬运文件。登记时绑定文件大小、mtime、producer、invocation、media type 和 SHA-256；预览、选择展示、读取或下载时重新校验。登记后被改写的文件会报完整性错误，必须由生产者重新发布。没有 hash 的旧记录保持 legacy/unverified，不会被伪装成已验证产物。

#### 高级动态重配置

`orchestration.allowMainReconfiguration` 默认 `false`，只能由用户在运行前开启。开启后，仅 autonomous Main 的本轮 capability 可以暴露 `apply_workflow`。Main 不能修改该开关。

允许修改：

- 普通 Agent 名单、输入目标、路由、决策计划、Loop、终止策略、结果格式和用户介入策略；
- Agent 的 instructions、model、harness、Bash `proxy`、Skills、自动 Skills 和 MCP；
- `main` 的 `gatewayId`，或 SDK 的 `gatewaySource`；
- Project Skill 与 Project stdio MCP 的定义、版本和分配。

保持锁定：

- schema/project/base hash、授权开关和服务端编辑说明；
- permission、Web Search、Session 持久策略、弱边决策者；
- Harness 原生 `reasoningEffort`、Gateway reasoning 映射与选择；
- 凭据、运行快照、任意主机路径和其他部署策略。

完整提案先进行字段、引用、拓扑、Harness 和 Gateway 校验，再通过 invocation journal 原子提交。过期 base hash 或任一校验失败都不会部分覆盖当前配置；受影响 Agent 在成功提交后刷新 Session。

#### 终止、网络与 Gateway reasoning

- `termination.automatic=false` 时，由 Main 做最终验收。
- 非 Main 终止 Agent 在 `termination.automatic=true` 且处于合法终止上下文时，才可依据配置条件直接完成；它不会因此获得通用路由、用户介入或重配置权限。
- `agents.<name>.proxy.mode` 只控制该 Agent 执行的 Bash/脚本环境。`direct`（默认）清除代理变量，`inherit` 继承宿主代理；它不改变 Harness、模型 API 或 Gateway 网络路径。
- Gateway reasoning 按 Gateway 和 model 定义“参数路径 + 可选值”。支持 `reasoning_effort`、`reasoning.effort`、`chat_template_kwargs.reasoning_effort` 和 `thinking.effort`。Agent 只选择 option ID；未选择时不注入字段。映射或选项变化会改变指纹，旧探测不能继续冒充有效。

#### 公共运行时防护

- 模型活动窗口与每个工具调用的活动窗口分离；结构化模型事件和真实工具进度才能续期，普通 stdout 或 keep-alive 不会无限续命。
- Token 以 provider request 的 `usageId` 记账。未知用量保留为 unknown，不显示成零；同一请求的 unknown 可以被后续 known 修复且不会重复累计。
- Session 恢复说明仅在真实 resume 或 replacement 时注入，并带幂等标记；全新 Session 不接收伪恢复上下文。
- 非持久 Codex Worker 禁用宿主 Goals，避免跨调用污染；持久 Main 沿用产品策略。
- Harness Adapter 只处理可执行入口、原生参数、Session ID 和官方事件浅映射。Main 权限、超时、Token、Artifact 与恢复策略属于公共层，不按单个 Harness 特判。

### 兼容与同步规则

- 旧 Workflow 未配置 Loop、Project Skill/MCP、proxy 或新账本时使用安全默认值；已公开的 SDK API、CLI 和事件名继续可用。
- 旧 Main pending 状态只有在能确认多个 weak 候选时迁移为 `weak-branch`，其余迁移为 `autonomous`。所有状态迁移可重复执行，不重复计数或清空已有数据。
- 两个分支中的公共合同、Main Prompt 策略和黄金测试向量保持内容一致。跨宿主测试使用同一确定性 Workflow，比较 Agent 顺序、Main capability、Loop/终止结果和关键状态。
- 公共行为变更应先修改 shared core 和黄金向量，再分别接入 Web/Server 与 SDK API/CLI；不要在某个 Harness Adapter 内复制业务修复。
