# workflow.json 合同与设计规则

[← 返回 SDK README](../../../README_zh-CN.md) · [English](workflow-en.md) | **简体中文**

## 顶层与 Agent

普通启动配置使用 `agents`、`orchestration`、`git`，可选 `skillDefinitions`、`mcpDefinitions`、`inputs` 和 `inputDescription`。输入材料的相对路径按 workflow 文件目录解析，CLI/API 的显式材料参数覆盖同名默认字段。`schemaVersion: 2` 可用于预设封装；不需要自行添加版本字段。未知字段会被拒绝。标题、自然语言需求、workspace、dataDir、harness 可执行路径不属于 workflow 字段。

`agents` 是以 Agent 名为键的对象，`orchestration.agents` 是 `{ "name", "template", "description"? }` 数组。保留唯一的 `main`，其模板是 `main`；新角色通常使用 `general`，也可使用内置 `idea`、`execution`、`writing`、`review` 模板。角色增删时同步更新两处名单、routes、decisionPlans、input、termination 和 loops 中的引用。

| Agent 字段 | 用法 |
| --- | --- |
| `model` | 实际可用的模型 ID；profile 默认模型不覆盖它 |
| `harness` | `codex` / `pi` / `dsh` / `claude-code` / `hermes`；Hermes 需另行安装 ACP/MCP 依赖 |
| `proxy` | 弃用兼容字段，main 规范化时移除；新配置省略。Agent 脚本沿用宿主统一启动环境，网络要求在部署中配置。 |
| `gatewayReasoningOption` | 模型级网关思考选项 ID，例如 high/xhigh；必须配置对应映射并通过精确探测，原生 OAuth 不使用此字段 |
| `instructions` | 角色职责与可执行的交接规则 |
| `skills` / `autoSkills` | 固定加载 / 按需候选 Skill 数组；不需要时显式 `[]` |
| `mcpServers` | MCP 数组；不需要时 `[]` |
| `permission` | `workspace` / `compute` / `yolo`；选择任务需要且 Harness 支持的文件修改范围，不自动获得实验工具 |
| `experimentMcp` | 显式选择 SII 实验工具；还需宿主 sii 配置，仅业务 Worker 轮次获得工具 |
| `webSearch` | 是否启用搜索；受适配器能力限制 |
| `sessionPersistence` | 是否复用会话；Main 固定启用 |
| `decisionBy` | `main` 或 `agent`；Main 固定为 `main` |

不要通过写 prompt 来假定不支持的 Harness 能力会生效。Codex Git-off workspace 仍有 shell；Claude Code workspace 不提供 Bash，需要脚本时使用 compute 或任务实际需要的 yolo。Git-on 非 yolo 常驻策略更严格，不等同于 Git-off shell 权限。

## 引擎与工作区

共享文件科研流程使用 `git: {"enabled":false}`，orchestration.schemaVersion 可显式为 2；main 内核直接承载该模式。v3 必须 Git-on；Git-off 不接受协作组。

Git-on 使用 `git:{"enabled":true,"repositoryName":"实际仓库名","repositoryVisibility":"private"}` 与 v3 scopedWorkflow，或由内核规范化支持的 v2 图。它会真实创建 GitHub 仓库/PR、隔离 worktree，需部署 Git 凭据与明确的任务授权。依赖共享目录的状态机不能只开 Git 就迁移；各组要重新定义依赖、汇合和文件集成，只有任务需要时采用。包内 examples/main-runtime/workflow.json 是 v3 参考。

workspace 由 CLI/API 指定，不放 workflow。Git-off 直接使用所选原目录；Git-on 从原项目快照开始，仍隔离执行，正式完成并集成后自动回写，原 Git 历史/暂存区不变。冲突不覆盖，检查 workspaceDelivery 并按运行说明恢复。sourceWorkspace 仍只读导入，与 workspace 互斥。

## Git-off v2 路由与结束

- `input: { "source": "input", "target": "角色名" }` 指定首个执行角色，不必是 Main。
- `routes.<角色>` 是 `{ "target": "角色名或finish", "kind": "strong或weak" }` 数组，不是字符串数组。每个 Worker 必须有出边，不能指向自身或重复目标。
- `strong` 表示确定下一跳，必须是该角色唯一出边；不能与其他强/弱边混合。
- `weak` 表示可选分支，通常交 Main 决策。`decisionBy: "agent"` 只允许符合条件的多个普通弱分支自行选择，不授予任意调度或结束权限。
- 为每个 Agent 填写 `decisionPlans` 文本，描述如何根据证据选下一步；不要在边上添加不支持的 condition 字段。
- `termination` 为 `{ "agent", "condition", "decisionBy": "main", "automatic": false或true }`。即使 automatic 为 true，decisionBy 也仍写 `main`。
- `automatic: false` 由 Main 判断结束。`automatic: true` 时，配置的非 Main 终止 Agent 只有拥有 `finish` 边才得到受限的 `complete_project` 能力。只有终止 Agent 可以有 `finish` 边；非 Main 终止 Agent 必须有该边。
- 验收 Agent 有 `finish` 和一个普通 Agent 两条弱边、且 automatic 为 true 时，通过则 `complete_project`；未完成则直接返回普通 Agent，适合 coding/testing 修复循环。
- `resultFormat: { "presets": ["代码", "报告"], "custom": "交付文件和证据要求" }` 描述成果，不会自动创建文件。
- `allowUserIntervention` 控制用户介入；`allowMainReconfiguration` 控制流程自修改，通常从 false 开始。

## 批次循环

在 orchestration 中添加，例如：

```json
{
  "loops": [{ "id": "refine", "from": "assess", "to": "revise", "maxIterations": 3, "exitTo": "main" }]
}
```

需同时配置 `revise → measure → assess → revise` 的唯一强路由。`to` 是入口，`from` 是组尾；两者是普通 Agent，组尾不能兼任终止 Agent；`exitTo` 在循环外。成员不重叠、不嵌套，不支持组内弱分支。

每批三轮后交 Main；Main 未完成时直接路由回 revise 开始下一批。批次数和累计轮数持久化；重试/恢复不会重置。总预算和完成条件另行定义，不把批次完成当项目完成。

## Skills 与 MCP

Skill 选择可以是有效的 `builtin:<name>`、本地 Skill 目录或 `project:<name>`。外部 `./`、`../` Skill 路径相对于启动 workflow 的目录；运行快照中的相对路径则相对于 workspace。使用 builtin 前检查安装包实际提供的名称，不编造标识。

Agent4Sci 完整流程使用 `builtin:agent4sci-research`、`builtin:agent4sci-experiment`、`builtin:agent4sci-checklist`，在需要这些指引的角色上同时配置到 `skills`。技能之间的文本引用不会自动加入依赖；角色指令决定本轮执行阶段。只选择后续技能时，先提供前序阶段材料。checklist 按需执行，不会设置定时任务。详见[使用说明](../../../docs/agent4sci.md)与[示例配置](../../../examples/agent4sci/workflow.json)。

可将任务专属 Skill 一起存入 workflow：

```json
{
  "skillDefinitions": {
    "verify": {
      "files": {
        "SKILL.md": "---\nname: verify\ndescription: 核对当前任务的交付与测试证据\n---\n核对实际运行日志和验收标准，报告缺失项。\n"
      }
    }
  }
}
```

然后在已有 Agent 上设置 `"skills": ["project:verify"]`。files 支持文本脚本和参考文件，必须包含非空 SKILL.md；文件名为安全相对路径，不含 `..`。

远程 MCP 使用 `{ "name": "tools", "url": "https://.../mcp" }`，不支持内嵌认证字段。任务 MCP 使用 `mcpDefinitions.<name>: { "command": "node", "entrypoint": "server.cjs", "files": { ... }, "args": [], "envFrom": {} }`，Agent 用 `{ "name": "tools", "project": "定义名称" }` 引用。envFrom 将子进程变量名映射到宿主变量名，不放密钥值。任务服务是 stdio MCP，以宿主权限运行；其他依赖不会自动安装。编写服务时按需查看安装包 `docs/project-mcp-zh.md`。

## Main 自修改

仅在需要流程自进化时开启 `orchestration.allowMainReconfiguration`。指定外部 Git-off workspace 时，Main 提案放在 `.scienceevolve/management/<projectId>/proposal/workflow.json`，跨调用保留草稿和原根 workflow.json。真实地址写入本轮 Inbox，apply_workflow(path:"workflow.json") 是兼容逻辑别名；只编辑注入的提案，不改运行缓存。内部 Git-off 默认目录与 Git-on 管理提案保持上游行为。

Main 应读取本轮生成文档的 editableFields、lockedRuntime 和允许修改范围，不自行添加旧部署字段。提案可提交受授权的 prompt/角色/编排、model、harness、已配置 gatewayId、Skills/MCP、experimentMcp 和 decisionBy 变更；权限、Web Search、会话持久策略、Harness/Gateway reasoning 与凭据保持锁定。不能用 gatewaySource 选择原生配置或借提案绕过网关部署。Main 编辑快照后调用 `apply_workflow`，该调用是本轮唯一终结控制动作。通过校验后才生效，后续调用遵循运行时的会话连续性规则读取新配置。

已有 Agent 省略字段表示保留；`[]` 清空能力列表。已接受的 skillDefinitions/mcpDefinitions 保持不可变：省略保留，相同定义可再次提交，允许新增名称；同名改写、替换和删除会被拒绝。需要调整资源内容时使用新名称并更新 Agent 引用。不能直接编辑 `.scienceevolve/agent-skills` 中的执行副本来提交修改。
