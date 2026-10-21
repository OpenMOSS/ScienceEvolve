# SII / Inspire 异步实验

[← 返回 SDK README](../README_zh-CN.md) · [English](sii-experiments.md) | **简体中文**

默认 SDK 不启用 SII，普通 `compute` Agent 不需要 Inspire CLI 或平台账号。
需要平台实验时，由部署方显式配置 `sii`；此配置属于宿主，不写入可移植 workflow。

```js
const sdk = await createResearchSdk({
  dataDir: '/absolute/new-data',
  sii: {
    inspireBin: '/absolute/bin/inspire',
    workspaceRoot: '/absolute/allowed-workspaces',
    configPath: '/absolute/inspire/config.yaml', // 可选
    noProxy: ['localhost', '127.0.0.1'],         // 可选
    refreshMs: 30000                           // 可选，整数且至少 1000 ms
  }
});
try {
  // 使用现有 start / events / wait API。
} finally {
  await sdk.close();
}
```

Node API 中四个路径字段必须为绝对路径。CLI 的 `--runtime-config` JSON 接受同样的
`sii` 对象，其中 `inspireBin`、`workspaceRoot`、`configPath`、`knowledgeRoot` 的相对路径
均相对于配置文件所在目录解析。`knowledgeRoot` 默认使用 SDK 随包携带的
`assets/skills/inspire`，与自定义 `skillRoots` 无关；如需替换，请显式设置该字段。

部署方事先安装原生 Inspire 可执行文件，并使用 CLI 完成账号登录及配置。
SDK 使用 CLI 本地已有账号上下文，不保存独立的平台账号/密码清单，不自动安装、登录
或分配资源。启用服务本身不会创建实验；Agent 发起的平台操作仍须处于用户授权范围。
异步服务直接执行指定 CLI，不依赖旧的 shell wrapper。

SDK 在本地存储初始化后启动服务，随后启动引擎；正常关闭与启动失败均回收服务。
部署 `workspaceRoot` 约束工作区访问；通过 SDK `workspace` 绑定的 Git-off 外部工作区
由宿主验证绑定后使用。workflow、Agent 参数不能自行扩展工作区授权。

具有 `compute` 权限的交付 Agent 使用 `scienceevolve-sii` MCP：

- `sii_read_knowledge` 读取操作知识，`sii_command` 查询 CLI 帮助及执行平台操作。
- `sii_submit_experiment` 提交并登记异步实验；已有 notebook/ray/serving 资源上的程序，
  先用 `sii_register_experiment` 登记，再启动后台程序。
- 每次运行使用新的 `request_id`；响应丢失的同次提交重用该 ID。
  notebook/ray/serving 的 `completion_file` 须由程序原子写入 `{run_id: request_id, exit_code}`。
- Agent 可继续同一任务中不依赖结果的工作；需要让出执行时调用 `sii_defer_task`，
  带上所需实验 ID 和后续上下文，然后结束当前模型轮次。

系统监测结果并通知原会话，无需让模型循环轮询。等待期间任务仍未完成，后继任务保持阻塞。
平台成功也不自动完成任务：Agent 恢复后检查结果，决定继续、重试、清理或调用已有完成工具。
关闭 SDK 只停止本地监测与会话服务，不自动删除平台资源；资源清理由已有 CLI 操作显式执行。

## 本轮验证范围（2026-10-08）

Windows / Node 24.20.0：全套 SDK 回归 787 项通过，3 项受文件符号链接权限限制跳过；
类型检查、构建、独立 tarball 安装验收通过。22 份既有 main workflow 配置原样加载，示例文件未改写。
SII 测试实际使用本地 MCP/HTTP、文件账本和调度内核，平台结果与原生模型轮次由测试替身提供；
覆盖提交去重、等待与原会话恢复、暂停/取消、完成门禁、执行槽释放及关闭时写入收尾。
安装包也验证了可选服务启停和新版知识资源。没有调用真实 SII 平台或模型，不代表完整平台验收；
Linux/macOS 未在本轮执行。
