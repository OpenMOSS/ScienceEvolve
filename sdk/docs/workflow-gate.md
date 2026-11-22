# ScienceEvolve Workflow Gate

Gate 是 Workflow 检查节点，在 `orchestration.gates` 中定义，出边仍放在同一作用域的 `routes`。Web 的根画布和协作组编辑器可创建、编辑和选择 Gate；运行视图显示原输入、实际结果、执行证据、所选路径和故障。SDK 导入、运行、CLI `workflow validate` 使用共同校验，`run.snapshot()` / CLI `run show` 的 `workflowGates` 保留同一批运行事实。

```json
{
  "id": "quality",
  "name": "质量检查",
  "verifier": {
    "kind": "code",
    "interpreter": "python3",
    "code": "import json, os, base64\nrequest = json.loads(base64.b64decode(os.environ['SCIENCEEVOLVE_GATE_INPUT_BASE64']))\nprint(json.dumps({'category': 'needs-review', 'input': request}))",
    "output": "json"
  },
  "rules": [
    {"target": "review", "all": [{"path": ["category"], "operator": "eq", "value": "needs-review"}]}
  ]
}
```

这段是一个 Gate 定义；还需配置进入它的边及 `quality -> review` 出边，并配置对应 Agent。代码型支持 `python3`、`node`、`bash`，沿原 Agent 的实际工作区、权限和调用运行。输入通过 `SCIENCEEVOLVE_GATE_INPUT_BASE64` 传入，包含项目需求和本任务 inbox。解释器与依赖必须已存在，不自动安装。标准输出必须是完整 JSON 或配置的文字；输出上限 64 KB，原生工具输出截断、缺失或失败均记为错误。

Agent 型用 `{"kind":"agent","agentId":"review","instructions":"核对提交的证据并给出诊断"}` 替换 `verifier`。检查者通过自己的真实 MCP 调用 `report` 保存任意 JSON 或文字结果，保留其 Agent 判断来源。可选 `decisionAgentId` 指定独立的决策 Agent，否则检查执行者负责决策。检查实现、决策人、硬规则分别配置。

Agent 使用既有控制 MCP 中的 `workflow_gate`：

- `list` 列出本次路径上的 Gate；`read` / `prepare` 加 `gateId`，读取被冻结的输入、配置及代码型的精确 `command`。
- 代码型由前序 Agent 在当前原生 Shell 中执行该命令。运行时只接收同一调用、工具 call ID、精确命令的真实开始和完整完成事件；`report` 不能代替代码输出。
- Agent 型检查者用 `{"operation":"report","gateId":"quality","result":...}` 提交实际判断。
- 决策者用 `{"operation":"choose","gateId":"quality","target":"review"}` 选择配置内的一条边。

无硬规则且只有一条边时，有效结果直接沿该边传递，负面评价也不阻断。多边必须选择一条。硬规则 `all` 的每个谓词都需成立；`path` 是字段名或数组索引的数组（空数组表示整个结果），支持 `eq/ne/lt/lte/gt/gte/in/contains`。规则必须覆盖所有出边；多匹配保留可选集合，由决策 Agent 选一条，无匹配明确失败。缺字段、类型错误不变成低分或默认路径。错误不另设隐式出口，不自动交回 Main。

根流程、串行流程、scoped 协作组、多个入边及 Loop 内检查均有独立来源绑定。组内 Gate 另设 `groupId`，并在该组的 `workflow.nodes` 放置 `{"kind":"gate","nodeId":"quality","gateId":"quality"}`。组内管理 Leader（含祖先 Leader）不能兼任本组 Gate 检查者或决策者。代码型不能直接接 Input，也不能直接连接下一个代码型 Gate；需要真实 Agent 任务承担下一次检查。Gate 可位于 Loop 内或入口，不能同时作为拥有迭代上限出口的 `loop.from`，这些组合在配置校验时报错。

配置与出边在每次进入前冻结；运行中只有用户能改 Gate 标准、硬规则或出边，既有调用继续使用原版本。SQLite 项目事件保存准备、开始、结果、选择和下游交付事实；运行记录按项目、实际来源、作用域绑定，恢复读取已知结果，未知调用不会自动重跑。下游收到原输入、反馈与证据，不只收到分数。未选中的候选 Gate 可有输入准备记录，但没有执行义务。

工具证据依赖 Harness 提供完整的规范化原生 Shell 开始/完成事件。缺少该能力时检查不能被确认为成功。路由校验不保证模型判断客观，也不提供代码隔离或评测保密沙箱。没有 Gate 的 Workflow 不增加 Gate 工具或运行义务。
