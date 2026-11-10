# Harness 网关与原生配置

在部署时配置网关，再通过 gatewayBindings 绑定工作流。`workflow.json` 保存模型、Harness 和工作流定义，凭据由宿主管理。

- [CLI/API 与网关命令](main-cli-zh.md)
- [网关绑定与原生 Codex profile](../skills/scienceevolve-sdk/references/usage.md)

旧引擎的 gatewaySource 自动绑定机制已移除。现有 API-key 原生配置可使用显式 gateway import 导入。
