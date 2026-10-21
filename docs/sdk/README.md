# ScienceEvolve SDK 文档

[← 返回 README](../../README_zh-CN.md) · [English](README_en.md) | **简体中文**

日常使用从[首页快速开始](../../README_zh-CN.md#quick-start)进入。此目录汇总开发入口与按日期保存的实现、测试记录。

当前使用文档见 [CLI 与部署](../../sdk/docs/main-cli-zh.md)、[Workflow 参考](../../sdk/skills/scienceevolve-sdk/references/workflow.md)和 [API 参考](../../sdk/skills/scienceevolve-sdk/references/usage.md)。

## 开发与测试

在仓库根目录执行：

```sh
npm ci
npm run check:main-runtime
npm run typecheck
npm run build
npm test
npm run smoke:package
```

构建会校验固定内核源码并复制运行资源；`smoke:package` 打包后在独立目录安装并检查 CLI/API。
完整测试需要 Node.js 24+、Git、Bash/POSIX 命令、符号链接权限，以及本地 HTTP、子进程和 SQLite 支持。
Linux 验证环境见 [validation 指南](../../scripts/validation/README.md)。

需要安装包时执行 `npm run pack:sdk`，产物位于 `sdk/scienceevolve-sdk-0.1.1.tgz`。
测试记录应注明提交、环境和实际结果。运行时来源与同步机制见 [内核同步记录](../../sdk/docs/main-sync-20261016-zh.md)。

## 实现与历史记录

- [当前 main CLI/API 手册](../../sdk/docs/main-cli-zh.md)
- [2026-10-16 内核同步与验证](../../sdk/docs/main-sync-20261016-zh.md)
- [2026-10-13 内核同步与宿主兼容](../../sdk/docs/main-sync-20261013-zh.md)
- [双闭环与内部自进化实现核对](dual-loop-audit.md#默认-main-引擎)
- [历史 legacy 交付与使用手册](usage-guide.md)
- [真实模型验收记录](real-model-acceptance-20260921.md)
- [2026-09-23 真实网关、Harness 与多轮验收](real-acceptance-20260923.md)
- [系统回归测试矩阵与结果](test-matrix-20260923.md)
- [2026-09-23 主线同步与 SDK 差异](main-sync-20260923.md)
- [CLI 使用入口](../../sdk/docs/cli-guide-zh.md)
- [历史 legacy config 逐字段执行审计](config-field-audit.md)

快速安装见 [`sdk/README.md`](../../sdk/README.md)。可用范围与尚缺功能以 [当前 main/SDK 对照](../../sdk/docs/main-sdk-parity-zh.md) 和本轮验收为准；下列 2026-09 历史材料不再决定默认入口合同。

`docs/sdk` 同时保留历史报告和方法核对，按各文档日期与适用引擎阅读。早期 API、实现计划及 legacy 专属说明不作为当前 main 接口合同。
