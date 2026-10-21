# 通用循环组

[← 返回 SDK README](../README_zh-CN.md) · [English](workflow-loops.md) | **简体中文**

`orchestration.loops` 定义普通 Agent 的循环组和每批循环次数，由 SDK 调度器执行。每批完成后转交 Main；Main 判断任务未结束时，直接将任务交回组入口，开始下一批。项目结束仍由原来的 `termination` 和控制工具判定，批次完成不是项目完成。

```json
{
  "loops": [
    {
      "id": "refinement",
      "from": "assess",
      "to": "revise",
      "maxIterations": 3,
      "exitTo": "main"
    }
  ]
}
```

对象放在 `orchestration` 内。`to` 是组入口，`from` 是组尾；其余 Agent 由入口到组尾之间的确定性路由定义。本例路由为 `revise → measure → assess → revise`，每条都是 `strong`。

```text
[revise → measure → assess] × 3 → Main
             ↑                    │
             └── 未结束：新一批 ────┤
                                  └── 原终止条件满足：完成
```

Main 继续时调用 `route_to_agent(target="revise")` 即可。无需更改 `maxIterations`、换循环 ID 或仅为继续而请求用户确认；无需开启 Main 动态重配置。若从 `measure` 输入，可先执行一次 `measure → assess` 基线，再进入第一批；若输入就是 `revise`，直接开始第一批并正确计入第一轮。

## 配置约束

| 字段 | 含义 |
| --- | --- |
| `id` | 项目内唯一稳定 ID；字母开头，后续可含字母、数字、`_`、`-`，最长 64 字符 |
| `to` | 循环组入口；Main 回到此 Agent 会开启新一批 |
| `from` | 循环组尾；其唯一强路由必须返回 `to` |
| `maxIterations` | 每批执行的轮数，1–1,000,000 的整数；不是项目累计上限 |
| `exitTo` | 每批完成后的目标 Agent，通常是 `main`，也可接其他组外 Worker |

组内每个 Agent 必须有唯一强路由，从入口可沿路径到达组尾，不经过 Main。组尾不能同时是终止 Agent，出口必须在组外。多个组的入口与成员不能重叠；当前不支持嵌套组或组内弱分支。未配置循环组的工作流保留原行为。

## 批次与恢复

- `(await run.snapshot()).loopIterations[id]`：本批已启动的轮数。
- `loopBatches[id]`：已启动批次号。
- `loopTotalIterations[id]`：累计已启动轮数，仅用于审计和证据编号，不是完成条件。
- Main 明确调度回组入口时，批次号增加、本批轮数从 1 开始，累计轮数继续增长。即使 Main 因用户输入或异常中途接管，明确回到入口也表示开启新批；继续已排队的调用则不重置。
- 暂停、重启、模型重试和 `apply_workflow` 本身均不重置计数；提交失败会一并回滚计数和下一跳。
- 普通路由从组外进入入口时也开始新批。组尾返回入口只增加当前批次轮数；达到本批次数时改走 `exitTo`。
- SDK 发送 `workflow.loop.batch.started`、`workflow.loop.iteration` 和 `workflow.loop.exhausted` 事件。最后一个表示批次完成，不表示项目完成。
- Agent inbox 含批次号、批内轮数、累计轮数和配置。文件应按累计轮数编号，避免重启新批后覆盖证据。

需要更改每批大小时，可在获准使用动态重配置的工作流中修改 `maxIterations`。当前计数保持不变，后续按新值调度。普通地继续下一批完全不依赖重配置。

`exitTo: "main"` 使用 `loop-limit` 原因交接。Main 仍受现有终止权限约束：若 `termination.agent` 不是 Main，循环完成也不会绕过指定终止 Agent 的评估。用户介入和故障恢复继续沿用原机制。

## 通过 CLI 启动

将任务目标和约束写入自然语言需求文件，选择已有任务目录作为 workspace，使用 SDK 自带 CLI 读取配置：

```bash
scievolve run start /absolute/path/workflow.json /absolute/path/requirement.txt \
  --workspace /absolute/path/task-project \
  --data-dir /absolute/path/run-data --gateway GATEWAY_ID
```

先在同一个 dataDir 中配置并测试 workflow 使用的模型、Harness 和推理档位，见 [网关部署](main-cli-zh.md#部署与启动)。

源码仓库的 `example/01-ahe-evolve/` 在 workflow 中定义了首个 `execute` Agent 的准备指令：直接在指定 workspace 中运行已有任务代码，保存初始快照，再开始基线评估。后续按 `execute → judge → optimizer → execute` 运行。代码快照和评分由 Agent 根据指令执行；SDK 调度器确定性地处理路由、批内计数和 Main 交接。

通过 Node API 启动时使用 `sdk.start({ ..., workspace: '/absolute/path/task-project' })`。需要预先准备代码或数据时，在启动前写入该目录；外部参考文件也可通过 `inputs` 提供。
