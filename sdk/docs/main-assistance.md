# ScienceEvolve 异步 Main 求助

Worker 和组内成员可用独立的 `main_assistance` MCP 工具直接请求 Main。请求持久保存后立即返回；原任务继续执行，Main 使用既有管理通道独立处理。同一项目的 Main 求助回合按序运行，并与正常 Main 执行共享占用检查。

```json
{"operation":"request","requestId":"compare-baseline-1","question":"这次实验缺少哪项对照证据？"}
```

`requestId` 是调用方在原逻辑任务内稳定的去重键，不能复用于不同问题。服务端绑定真实项目、Agent、任务、作用域及原生 Session，调用方不能指定接收对象。工具返回保存状态及持久请求 ID，不等待 Main 答复。`list` 列出本任务请求，`read` 配合返回的持久请求 ID 读取详情。Main 在实际收到原生输入后，以 `reply`、原请求 ID 和 `text` 保存一次答复；无法解决的说明也可作为答复。

`state_request_leader`、特定状态协调入口 `state_request_main` 及图上的 Main 路由各自保留原契约。求助不提供路由、改派、改图、修改 Gate 或项目完成授权，也不成为 `finish_task` 的条件。Main 保留已配置的原生工具和项目 MCP；求助回合的编排工具只处理该请求。

## 接收与连续性

请求和答复写入现有 SQLite 事件日志，保留版本、来源、实际 Main 调用、原生接收事件与投递记录。版本冲突、缺失原生 Session、错误调用身份和不可确认的原生停止状态明确报错。

| 记录 | 事实 |
|---|---|
| `status=queued` | 请求已保存，Main 尚未领取 |
| `main.receivedAt` / `eventId` | 已观察到该 Main 调用的原生用户消息，含绑定的请求正文 |
| `reply` | Main 已明确保存答复；不代表请求方已收到 |
| `delivery.status=queued` | 答复等待原任务可接收边界 |
| `delivery.status=offered` | 已向原任务发出答复，尚无原生收件证据 |
| `delivery.status=received` | 原调用、Session 的实际消息或完整工具结果包含绑定答复 |
| `delivery.status=unknown` | 原生投递失败或结果不可确认；保留原因，不自动重投 |
| `delivery.status=late` | 原任务已经结束；保留答复，不重开或转投同名新任务 |

Codex 常驻执行在原生工具完成边界调用 `turn/steer`，绑定 `expectedTurnId`，不创建新的业务 turn。该接口的原生规则见 [Codex App Server 文档](https://learn.chatgpt.com/docs/app-server)。RPC 应答本身不算请求方收件；仍须观察原生用户消息。原回合已结束时保留拒收事实。

所有接入控制 MCP 的 Harness 均可在原任务后续工具结果中收到答复；既有获准输入的边界也会附加待投递答复。Pi、DSH 和单次执行入口使用这些可接收边界；不会为收件强杀进程或另开任务。原任务期间没有后续边界时，答复保留为待投递或迟到。过长、截断、错误工具输出不能作为完整收件证明。

暂停保留请求和答复，等待实际运行回合进入安全点；恢复不自动重复已领取的 Main 调用。服务中断后先核对原 Main 的停止事实，再释放其管理占用；无法确定结果时记为 `unknown`。已发出但未确认的答复不会重新发送。请求方恢复必须仍是原逻辑任务和原生 Session；新任务、不同 Loop 轮次和替换 Session 不接收旧答复。

Main 使用持续保留的管理工作区；Git-off 项目读取共享 Memory 的调用快照，Git 项目沿用管理 Memory 和 scoped 固定工作区规则。原请求方的工作区、原输入和已完成工作不因答复改变。

## Web 与 SDK

Web 工作区显示请求、答复、Main 接收记录、原任务接收记录及失败或迟到原因。SDK 的 `run.snapshot().mainAssistance`、`sdk.getRun(id)` 和 CLI 的既有运行快照输出提供同一记录，无需 Web 服务。SDK 导出 `MainAssistanceRecord` 和 `MainAssistanceOrigin` 类型；普通 SDK 客户端不能伪装活跃 Agent 发起请求或收件确认。

新项目沿既有状态域注册机制使用此功能。不通过读取旧项目静默注册状态域或补造运行身份。局部测试使用真实 SQLite、原生协议进程 fixture、MCP 进程及调度器 fixture；没有调用真实模型或外部 GitHub。
