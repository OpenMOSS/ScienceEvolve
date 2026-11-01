# main / SDK 功能一致性与宿主边界

[← 返回中文 README](../README_zh-CN.md) · [English](main-sdk-parity.md) | **简体中文**

更新日期：2026-10-30

ScienceEvolve 的 Web/Server（下文称 `main`）与默认 `@scienceevolve/sdk` 使用共同的工作流核心规则，分别提供网页与 Node API/CLI 宿主。SDK 保存明确的 main Git 基线及共同源码工作树快照，不能仅凭引擎名推断两边全部功能和版本相同。旧 `/legacy` 引擎不属于本页的当前入口。

共同核心现已按实际文件逐字节一致；SDK Hermes 实现在共同核心目录外，通过可选宿主接口接入。Git 基线和工作树文件哈希共同记录来源。

## 宿主差异

| `main` | SDK | 共同语义 |
| --- | --- | --- |
| Web、HTTP、SSE | TypeScript API、CLI、异步事件流 | 同一状态机与标准事件 |
| 服务端 Project 存储 | `dataDir` 本地存储 | 幂等恢复与迁移 |
| 部署者配置 OAuth App，用户在网页账号库登录授权 | 宿主提供 tokenEnv、credentialResolver 或 HTTPS Git credential helper | Git 与 API 使用项目绑定的 GitHub 用户凭据 |
| 选择已保存的 `gatewayId` | 网关库与显式 `gatewayBindings`，或部署提供的原生 Codex 别名 | 调用前解析并锁定模型路线 |
| 服务端分配项目目录与 Git worktree | 调用方可传 `workspace`；Git-on 隔离执行并交付回原目录 | 工作目录、输入与交付由宿主验证 |
| 可视化 Workflow 画布 | JSON、API、CLI | 同一 Workflow schema 与校验规则 |
| Codex、pi、DSH、Claude Code | 另有 SDK 宿主扩展 Hermes Harness | 共同调度与每轮能力校验 |

SDK 不包含 Web 页面，`main` 也不会接受调用方提供的任意服务器绝对路径。凭据、Gateway 快照、宿主路径和 `dataDir` 都不是通用 Workflow 字段。SDK 的 API-key env/profile 配置通过显式导入保存到部署网关库，不使用旧 workflow 的 `gatewaySource` 活绑定；当前入口见 [SDK CLI/API 手册](main-cli-zh.md)。

## 一致的工作流语义

### Main 权限

Main 只有两种控制模式：

- `autonomous`：初始调度、确定路由、终止验收、异常恢复、用户输入、Loop 批次返回和重配置续跑。它可以选择任意已配置的普通 Agent；是否可以完成、请求用户或修改 Workflow，由本轮 capability 单独决定。
- `weak-branch`：只处理某个来源 Agent 的多个弱边候选，只能选择本轮候选，不能请求用户或修改 Workflow。

候选中出现 `finish` 不表示弱分支可以直接完成。选择 `finish` 只会安排新的 autonomous 终止验收；完成权限只在合法终止上下文中出现。Main 和 Control 工具使用同一份 capability 快照，Prompt、工具 schema 和服务端校验不会分别猜测权限。

Main 的系统 Prompt 常驻根任务编排策略：重建目标合同、判断是否值得派发、管理依赖与文件写入所有权、监控执行、核验实际产物/测试/日志，再整合验收。Worker 不获得该根编排策略；Worker 的报告只是证据索引，不替代真实检查，也不扩大用户授权。

### Loop

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

`main` 画布不创建 Loop 节点：强边闭合合法环时自动生成显式 `orchestration.loops[]`，闭合边成为 `from -> to` 返回边。Loop 内强边同色，不同 Loop 异色，点击任意成员边可选中整组并编辑 ID、批大小和退出目标；`from -> exitTo` 仍是只读虚线退出边。打断闭环会同步移除 Loop 配置，非法闭环会被拒绝；改名会同步引用。运行视图显示 batch、iteration 和 total。SDK 使用同一结构，通过 JSON/API/CLI 显式配置。

### 共享 Workspace 与 Artifact

Git-off 项目的 Agent 使用共享业务 Workspace 和 `Memory.md`；Git-on 则按协作规则使用受控 worktree 与发布、集成流程。共享输入材料独立于 Git worktree 和正式产物发布。Agent 身份、Session、日志与调用级临时目录仍保持隔离。旧项目的 `<agent>/shared/` 文件原地保留，既不合并也不覆盖；读取旧产物时保留兼容回退。

`publish_artifact` 是正式登记边界，不再用于 Agent 间搬运文件。登记时绑定文件大小、mtime、producer、invocation、media type 和 SHA-256；预览、选择展示、读取或下载时重新校验。登记后被改写的文件会报完整性错误，必须由生产者重新发布。没有 hash 的旧记录保持 legacy/unverified，不会被伪装成已验证产物。

### 高级动态重配置

`orchestration.allowMainReconfiguration` 默认 `false`，只能由用户在运行前开启。开启后，仅 autonomous Main 的本轮 capability 可以暴露 `apply_workflow`。Main 不能修改该开关。

允许修改：

- 普通 Agent 名单、输入目标、路由、决策计划、Loop、终止策略、结果格式和用户介入策略；
- Agent 的 instructions、model、harness、已配置的 gatewayId、Skills、自动 Skills、MCP、experimentMcp 和 decisionBy；
- 新增 Project Skill 与 Project stdio MCP 定义，并调整 Agent 的资源分配。

已接受的 Project Skill/MCP 定义保持不可变；省略保留、相同定义可再次提交，内容调整使用新名称。同名改写、替换和删除会被拒绝。SDK 用户编写的启动 workflow 不携带 gatewayId；运行时提案中可编辑的路线以当前快照为准。

保持锁定：

- schema/project/base hash、授权开关和服务端编辑说明；
- permission、Web Search、Session 持久策略；
- Harness 原生 `reasoningEffort`、Gateway reasoning 映射与选择；
- 凭据、运行快照、任意主机路径和其他部署策略。

完整提案先进行字段、引用、拓扑、Harness 和 Gateway 校验，再通过 invocation journal 原子提交。过期 base hash 或任一校验失败都不会部分覆盖当前配置；成功后继续调度，后续调用遵循运行时的会话连续性规则读取新配置。

### 终止、网络与 Gateway reasoning

- `termination.automatic=false` 时，由 Main 做最终验收。
- 非 Main 终止 Agent 在 `termination.automatic=true` 且处于合法终止上下文时，才可依据配置条件直接完成；它不会因此获得通用路由、用户介入或重配置权限。
- Agent 脚本网络沿用服务统一环境；用户和 Main 不再逐 Agent 配置代理。旧文件中的该字段仅在正常读取时忽略，模型协议转换和 Gateway 路由沿原基础设施合同处理。
- Gateway reasoning 按 Gateway 和 model 定义“参数路径 + 可选值”。支持 `reasoning_effort`、`reasoning.effort`、`chat_template_kwargs.reasoning_effort` 和 `thinking.effort`。Agent 只选择 option ID；未选择时不注入字段。映射或选项变化会改变指纹，旧探测不能继续冒充有效。

### 公共运行时防护

- 模型活动窗口与每个工具调用的活动窗口分离；结构化模型事件和真实工具进度才能续期，普通 stdout 或 keep-alive 不会无限续命。
- Token 以 provider request 的 `usageId` 记账。未知用量保留为 unknown，不显示成零；同一请求的 unknown 可以被后续 known 修复且不会重复累计。
- Session 恢复说明仅在真实 resume 或 replacement 时注入，并带幂等标记；全新 Session 不接收伪恢复上下文。
- 非持久 Codex Worker 禁用宿主 Goals，避免跨调用污染；持久 Main 沿用产品策略。
- Harness Adapter 只处理可执行入口、原生参数、Session ID 和官方事件浅映射。Main 权限、超时、Token、Artifact 与恢复策略属于公共层，不按单个 Harness 特判。

## 推荐配置与 Project Explainer

推荐配置接收项目名称、需求、当前 Workflow 和顾问运行路线，返回完整、已校验的 `agents + orchestration + warnings`。它不使用工具、不暴露凭据、不修改项目，也不会自动启动；只有用户明确应用后才覆盖表单或写入新文件。

Project Explainer 是 Web 宿主的原生交互助手，默认 SDK 不导出该服务。它通过专用产品 MCP 读取上下文、编辑和保存草稿、撤销修改，以及提交现有项目的 Workflow 调整；创建项目只保存草稿，由用户主动启动。原生文件系统只读，Shell、Skills 执行、业务 MCP 和 Web Search 禁用；无法保证相应边界时拒绝运行。会话历史持久化，同一会话一次只允许一个活跃 turn。

总进度由系统读取当前外层 Workflow 节点计算：起点到当前节点的最短步数除以该步数与到结束节点最短步数之和。分支按最短可达路径，循环回退可以使进度下降，协作组按一个节点计算；只有项目确认完成才显示 100%。Explainer 只解释当前进度，不写入进度。

## 兼容与同步规则

- 旧 Workflow 未配置 Loop、Project Skill/MCP 或新账本时使用安全默认值；旧 Agent 代理字段在读取时忽略。已公开的 SDK API、CLI 和事件名继续可用。
- 旧 Main pending 状态只有在能确认多个 weak 候选时迁移为 `weak-branch`，其余迁移为 `autonomous`。所有状态迁移可重复执行，不重复计数或清空已有数据。
- 两个分支中的公共合同、Main Prompt 策略和黄金测试向量保持内容一致。跨宿主测试使用同一确定性 Workflow，比较 Agent 顺序、Main capability、Loop/终止结果和关键状态。
- 公共行为变更应先修改 shared core 和黄金向量，再分别接入 Web/Server 与 SDK API/CLI；不要在某个 Harness Adapter 内复制业务修复。
