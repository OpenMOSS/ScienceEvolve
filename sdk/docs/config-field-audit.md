# SDK config 逐字段执行审计

> 历史记录：legacy 引擎及其 API/CLI 入口已移除。下文保留旧版本设计与验收事实；当前用法见 [CLI/API 手册](main-cli-zh.md)。

> 历史证据说明：历史审计与实测记录保留当时的标识；当前使用方式以 ScienceEvolve 的 SDK/CLI 手册为准。

> 历史适用范围：本文记录 2026-09-26 的 legacy 引擎，不是当前默认 main 的字段合同。当前配置见 [workflow 合同](../skills/scienceevolve-sdk/references/workflow.md) 和 [main CLI/API](main-cli-zh.md)。旧 proxy 字段在默认 main 中被忽略，gatewaySource 不属于其启动 workflow。

日期：2026-09-26。此文件随独立 npm tarball 发布。审计对象是当时 legacy SDK 接受的 ScienceEvolve `agents + orchestration` 配置，不是早期另拟的配置格式。

## 状态说明

- **执行生效**：字段会改变调度、提示词、CLI 参数、协议请求、权限或运行资源。
- **规范化**：输入会按既有系统不变量被改写，返回的 `WorkflowConfig` 是实际执行值。
- **展示元数据**：会持久化并进入项目配置/事件，但设计上不参与调度。
- **环境受限**：结构合法，具体 Harness 或宿主无法兑现时必须在创建任务前报错，不静默降级。

## 任务 Skill 字段

顶层 `skillDefinitions` 是 `{ "名称": { "files": { "SKILL.md": "完整文本", "scripts/check.py": "完整代码" } } }`。启动前可定义，授权后的 Main 也可通过 `apply_workflow` 创建和改写；Agent 的 `skills` / `autoSkills` 用 `project:<名称>` 引用。内容持久化在 `<dataDir>/projects/<项目ID>/skills/<内容摘要>/project-<名称>/`，四种 Harness 沿用共同的工作区 Skill 暂存机制。

内容与分配一同校验、原子提交，内容变更会刷新使用它的 Agent 会话；纯内容修改也视为有效配置变更。省略该字段保留原定义，提供时全表替换，不能删除仍被引用的 Skill。新版本保留旧文件，恢复任务使用已提交版本。名称、路径、文件数量和内容大小限制见 [SDK README](../README.md)。

## 任务 MCP 字段

顶层 `mcpDefinitions` 定义服务源码与启动配置，Agent 使用 `{ "name", "project" }` 引用。Main 可通过 `apply_workflow` 新建、改写、分配和删除未被引用的服务；持久化、内容版本、旧会话刷新及提交回滚与任务 Skill 一致。执行器按调用启动标准 stdio 服务、完成初始化，临时转换为本地 HTTP 接入现有四 Harness。取消、失败、结束或 SDK IPC 断开后回收；服务意外退出触发当前调用失败恢复。完整字段和边界见 [project-mcp-zh.md](project-mcp-zh.md)。

## Agent 字段

| 字段 | 状态 | 实际作用与覆盖规则 |
| --- | --- | --- |
| `gatewaySource` | 执行生效 | `env` 读取对应 Harness 的 URL/key；Codex 的 `profile` 由原生 CLI 加载配置和登录态，无需 API key 或 SDK 网关探测；其他 Harness 读取原生配置中的 API-key 网关。未设置路径变量时使用默认位置。不覆盖 workflow 的模型 ID。可由 Main 动态切换并重新校验网关。 |
| `gatewayReasoningOption` | 执行生效、环境受限 | 选择部署者为当前 API-key Gateway/model 定义的 option ID，并按其精确参数路径和值注入。省略时不发送字段；映射或选项变化使旧探测失效。Codex 原生 profile 使用 Codex 自身设置。Main 动态重配置无权修改。 |
| `model` | 执行生效 | 校验属于所选网关模型列表，写入网关快照并传给四种 Harness；协议代理也使用该值。 |
| `harness` | 执行生效 | 选择 `codex`、`pi`、`dsh` 或 `claude-code` 适配器，并决定原生协议、CLI 参数和是否需要协议代理。默认 `codex`。 |
| `gatewayId` | 不接受 | 网关由 Harness 环境变量/原生 profile 绑定，workflow 不允许设置；仅内部持久化状态保存网关 ID。 |
| `proxy` | 执行生效 | 只影响 Agent 执行的 Bash/脚本环境。省略或 `direct` 清除代理变量，`inherit` 继承宿主代理；不改变 Harness、模型 API 或 Gateway 连接。Main 可在高级权限下修改。 |
| `instructions` | 执行生效 | 进入 Agent mandate；显式空白值清空自定义职责，省略字段沿用原配置或新 Agent 的模板默认值；SDK 通用执行协议仍保留。完整用户需求仍高于模型生成的分工说明。 |
| `skills` | 执行生效 | 固定选择。Codex 和外部 Harness 都先把所选 Skill 依赖闭包复制到 Agent 工作区；Codex 作为启用 Skill，Pi 通过 `--skill`，DSH/Claude 通过可读工作区路径和提示加载。 |
| `autoSkills` | 执行生效 | 可选 Skill 集；与 `skills` 去重。当前编排器解析后也随调用下发，外部 Harness 不具备 Codex 的自动发现机制，因此会收到同一组显式可读候选，模型按任务相关性使用。 |
| `mcpServers` | 执行生效、环境受限 | 支持远程 URL 及任务服务 project 引用；执行器将任务服务解析为私有 HTTP 地址。Codex 使用 HTTP MCP 配置；Pi 使用官方 MCP 客户端扩展；DSH/Claude 使用调用级 HTTP→stdio 桥。系统固定 MCP 从 `SCION_AR_FIXED_MCP_TOKEN` 取凭据；缺失时启动前报错。自定义项当前合同不接受内嵌认证字段。任务服务用 envFrom 引用宿主环境变量。 |
| `reasoningEffort` | 执行生效 | Codex CLI、Pi、DSH、Claude CLI 收到各自原生 effort；它与 Gateway reasoning 分离，不再依据协议猜测供应商请求字段。Main 动态重配置无权修改。 |
| `permission` | 执行生效、环境受限 | Codex 支持 workspace/compute/yolo；DSH 支持 workspace/yolo；Claude 支持 workspace/yolo；Pi 只能明确使用 yolo，因为当前 Pi 适配器没有 SDK 可强制的工作区沙箱。外部 Harness 的 compute 会在任务创建前拒绝，不会冒充 Inspire 支持。 |
| `webSearch` | 执行生效、环境受限 | 四种 Harness 都通过调用级本地 MCP 使用所选网关的原生搜索能力；Codex/Claude 也保留原生搜索开关。仅在当前 Agent 显式开启时暴露工具。具体网关或模型若不支持搜索，会返回明确的工具错误。 |
| `sessionPersistence` | 执行生效、环境受限 | Codex、Pi、Claude 使用可恢复会话；DSH headless 当前只能新建会话，因此 `true` 和 Main+DSH 会在创建前拒绝。 |
| `decisionBy` | 执行生效、规范化 | Worker 为 `agent` 且恰有至少两个普通弱边时，获得一次 `route_to_agent` 选择；其他情况由 Main 决策。Main 始终规范化为 `main`。 |

合并顺序是 template 默认 → 对应 Agent 显式配置 → 系统不变量。数组在 Agent 层整体替换；`skills`/`autoSkills` 会去重。Main 的 `sessionPersistence` 固定为 `true`、`decisionBy` 固定为 `main`，这是返回值中可观察的规范化，不是运行时暗改。

## orchestration 字段

| 字段 | 状态 | 实际作用与覆盖规则 |
| --- | --- | --- |
| `agents[].name` | 执行生效 | 定义任务中的 Agent 身份，也是路由、配置、事件和会话的键。所有 Agent 共用项目业务 Workspace；名单外 Agent 配置会报错。 |
| `agents[].template` | 执行生效 | 仅作为初始职责、Skill 和权限配置的模板；显式 Agent 字段随后覆盖。Main 模板固定规范化为 `main`。 |
| `agents[].description` | 展示元数据 | 保存在工作流快照及创建事件中，供编辑器/调用方说明角色；当前不注入模型提示词，也不影响路由。完整运行职责应写在 `agents[name].instructions`。 |
| `agentTemplates` | 展示元数据 | 接受主线新增的自定义 Agent 模板库，校验名称并保存在工作流快照中；它们不是当前任务中会运行的 Agent。 |
| `input.source` | 执行生效 | 必须是固定值 `input`。 |
| `input.target` | 执行生效 | 决定新任务最先排队的 Agent。 |
| `routes` | 执行生效、规范化 | strong 唯一路由直接排队；多个 weak 进入 Main 或 Worker 的选择。Loop 回边仍是 routes 中的真实 strong 边。Main 的出边由系统按全部 Worker 重建为 weak fan-out，用户填写的 Main 路由不保留。 |
| `loops` | 执行生效 | 每项 `{ id, from, to, maxIterations, exitTo }` 定义一个不重叠、不嵌套的确定性循环组。SDK 持久化批内轮数、批次和累计轮数；暂停/恢复、重试与普通重配置不重置。耗尽后沿虚拟退出目标调度并发出标准 Loop 事件。 |
| `decisionPlans` | 执行生效 | 在弱分支时进入 Main 的待决策上下文；每个 Agent 必须有一项，Main 缺省值可被补齐。 |
| `allowUserIntervention` | 执行生效 | 控制 Main 是否获得 `request_user` 工具；关闭后相关控制动作也会被服务端拒绝。 |
| `allowMainReconfiguration` | 执行生效 | 默认 `false`；`true` 仅向有 `canReconfigure` 的 autonomous Main 提供 workflow.json 与 apply_workflow，支持编排、Loop、agents[name] 的 instructions/model/harness/gatewaySource/proxy/skills/autoSkills/mcpServers 及顶层 skillDefinitions/mcpDefinitions。授权开关、permission、Web Search、Session/decision 策略、Harness/Gateway reasoning 与凭据快照锁定。完整提案重新校验、原子提交并刷新受影响会话。 |
| `termination.agent` | 执行生效 | 只有该 Agent 可以拥有 `finish` 边；其完成后进入终止决策上下文。 |
| `termination.condition` | 执行生效 | 作为自然语言完成标准进入所有 Agent inbox 和 Main 终止判断；当前不是可由 SDK 本地求值的表达式。 |
| `termination.decisionBy` | 规范化 | 现有合同只接受 `main`，普通终止决策由 Main 提交并由运行时复核路由上下文；`automatic: true` 是下述显式例外。 |
| `termination.automatic` | 执行生效 | `false` 时终止 Agent 完成后必须经过 Main 判断；`true` 时指定的非 Main 终止 Agent获得受限的 `select_display`/`complete_project` 工具，按照自然语言 condition 自行核对证据并可直接完成。运行时只在该 Agent、存在 finish 边且当前调用能力匹配时接受动作；条件不满足时不调用完成工具：若出边恰为 finish 加一个普通 Agent 的两条弱边，则直接返回该 Agent；其他配置仍交 Main 继续编排。 |
| `resultFormat.presets/custom` | 执行生效 | 去重/裁剪后写入 Main 上下文和各 Agent inbox，作为最终交付形式要求；不是强制 JSON schema。 |
| `canvas.schemaVersion/nodes/edges/viewport/layoutMode` | 展示元数据 | 保存编辑器布局，不参与调度。类型定义明确标注 presentation-only。 |
| `canvas.connections.input/termination` | 配置完整性检查 | `false` 表示画布上关键连接未完成，严格工作流校验拒绝启动；`true` 本身不改变调度。 |

## Harness 支持矩阵

| 能力 | Codex | Pi | DSH | Claude Code |
| --- | --- | --- | --- | --- |
| workspace | 支持 | 不支持，启动前报错 | 支持 | 支持 |
| compute/Inspire | 支持 | 不支持，启动前报错 | 不支持，启动前报错 | 不支持，启动前报错 |
| yolo | 支持 | 支持 | 支持 | 支持 |
| webSearch | 支持 | 支持（需 yolo） | 支持 | 支持 |
| sessionPersistence | 支持 | 支持 | 不支持，启动前报错 | 支持 |
| Skill | 工作区暂存 + 原生配置 | 工作区暂存 + `--skill` | 工作区暂存 + prompt | 工作区暂存 + prompt |
| HTTP MCP | 原生配置 | 官方客户端扩展 | 调用级 stdio 桥 | 调用级 stdio 桥 |
| reasoningEffort | 支持 | 支持 | 支持 | 支持 |

上述“支持”表示适配器已生成并校验相应参数/工具边界，不等于所有 CLI 版本、网关和模型已经完成真实端到端验收。CLI 不存在、网关探测证据缺失、Skill 路径无效、固定 MCP 凭据缺失等环境问题会显式失败。

## 自动化证据

`sdk/tests/config-compatibility.test.ts` 覆盖：

1. 四 Harness 的支持/拒绝组合；
2. Harness reasoning 与 Gateway/model-specific reasoning 分离，精确参数路径进入三种网关协议且指纹变化使旧探测失效；
3. MCP 名称稳定、抗碰撞且不携带凭据；
4. 外部 Harness 的 Skill 被复制到 Agent 工作区；
5. 自定义角色、弱分支、强边回环、终止节点、不同 Harness、Skill、MCP、resultFormat 和 canvas 的组合规范化。
6. `automatic: true` 允许终止 Worker 直接完成，而 `false` 必须再经过 Main；未授权 Worker 看不到完成工具。

`project-skills.test.ts` 与 `sdk.test.ts` 还覆盖任务 Skill 的新建、分配、改写、脚本执行、版本隔离、会话刷新、内容校验、状态回滚和重启恢复。安装包烟测通过真实 Node/MCP 子进程执行 Main 创建及修改后的 Skill 脚本，模型动作为确定性模拟。

仍需真实环境验收的部分：Windows/macOS 上四个 CLI 的具体版本、真实模型协议组合、远程 MCP 可用性和 compute/Inspire。离线测试不能替代这些证据。

## Agent Bash 代理

`proxy` 只接受 `inherit` / `direct`，省略时默认 `direct`，作用于 Agent 执行 Bash 命令/脚本时的代理环境；Agent/Harness 自身、模型 API、网关探测及协议转换沿用原有网络行为。见 [配置与范围](harness-gateway-zh.md#每个-agent-的-bash-代理)。测试覆盖真实父子进程环境分离、原有启动文件、登录/嵌套 Bash 和 Pi Bash 工具；不声称对所有外部 Harness 版本完成真实模型验收。
