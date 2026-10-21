# Hermes Harness

[← 返回 SDK README](../README_zh-CN.md) · [English](hermes.md) | **简体中文**

默认 main 引擎支持 NousResearch/hermes-agent，标识为 `hermes`，与 Codex、Pi、DSH 使用同一注册表和运行接口。默认 Harness 为 Codex。

## 安装与配置

Hermes 需要另外安装，包含 ACP 与 MCP 依赖；SDK 不捆绑 Python/Hermes，也不会在任务运行中替你安装。当前适配针对 Hermes `v0.21.6` 的 ACP 接口验证。请先确认 `hermes acp --check` 可用。官方安装说明：<https://hermes-agent.nousresearch.com/docs/user-guide/windows-native>。

部署配置 `runtime.json`：

```json
{
  "harnesses": {
    "hermes": "C:/absolute/path/to/hermes.exe"
  }
}
```

Linux/macOS 使用对应的本机可执行文件路径。也可用 `SCIENCEEVOLVE_HERMES_BIN` 或 PATH 发现；Windows 不接收 `.cmd`、`.bat`、`.ps1` 启动脚本。API 的 `harnesses.hermes` 必须是绝对路径；CLI runtime-config 中的相对路径以配置文件所在目录为基准。

Hermes 使用 SDK 的网关和模型，不读取个人 Hermes profile 或 OAuth。API-key 网关可通过已有 `gateway add` 配置，也支持 `gateway import --harness hermes --model YOUR_MODEL --source env` 从明确提供的 `OPENAI_BASE_URL`、`OPENAI_API_KEY` 一次性导入。不要把密钥放进 workflow.json。

```powershell
scievolve harnesses --data-dir D:/runs/hermes-data --runtime-config D:/research/runtime.json
scievolve gateway test GATEWAY_ID --harness hermes --model YOUR_MODEL `
  --data-dir D:/runs/hermes-data --runtime-config D:/research/runtime.json
scievolve start D:/research/workflow.json D:/research/requirement.txt `
  --workspace D:/research/project --gateway GATEWAY_ID `
  --data-dir D:/runs/hermes-data --runtime-config D:/research/runtime.json
```

API 仍使用同一入口：

```js
import { createResearchSdk, loadWorkflowConfig } from '@scienceevolve/sdk';
const sdk = await createResearchSdk({
  dataDir: 'D:/runs/hermes-data',
  harnesses: { hermes: 'C:/absolute/path/to/hermes.exe' }
});
try {
  const workflow = await loadWorkflowConfig('D:/research/workflow.json');
  const run = await sdk.start({
    title: 'Hermes implementation and independent review',
    requirement: 'Implement the requested change and include reproducible tests.',
    workflow,
    workspace: 'D:/research/project',
    gatewayBindings: { defaultGatewayId: 'GATEWAY_ID' }
  });
  console.log(await run.wait());
} finally {
  await sdk.close();
}
```

## workflow 与权限

只需将相应 Agent 配置为 `"harness": "hermes"`。不增加另一套 workflow 格式。可让 Main、执行、审计分别使用不同 Harness；完整混合示例见 [workflow.json](../examples/hermes/workflow.json)。示例需要执行脚本，显式使用 `yolo`；这是广泛权限，仅应用于用户授权的环境。

- `workspace` / `compute`：禁用 Hermes 原生终端、文件写入和独立委派，通过 SDK 的文件权限 MCP 和显式配置的 MCP 工作。`compute` 不表示可绕过现有工具权限。
- `yolo`：允许 Hermes 原生 terminal/file 工具。独立委派、cron、自动个人记忆/技能修改不默认开启。
- 只读解释：不提供工具，只传入当前解释所需的证据。
- 连接探测：使用 SDK 的真实 Harness 工具回执检测，不把普通文本请求通过当作整个 Harness 通过。

Skills/autoSkills 仍由 SDK 选择与暂存，适配器传递选定的指令正文，不启用 Hermes 自己的自动技能安装与修改。输入文件仍使用 SDK 的文件入口；本次不增加图片等二进制内容的 ACP 直接传输接口。

## 与原架构的关系

Hermes 只负责一个 Agent 内的模型和工具循环。调度、完成判断、Loop/Evolver、SII 等待、Git 协作仍由原 SDK 内核管理。

- Git-off：在 SDK 分配的共享目录工作，指定 workspace 时就是原目录。
- Git-on：在 SDK 分配的 worktree 工作，提交、集成和原目录交付遵循原规则。不使用 Hermes 自己的 worktree 功能。
- 多个逻辑轮次使用真实 ACP 会话，经过统一常驻进程、所有权和逐轮权限控制。
- 恢复使用 `session/load`，不用“找不到旧会话就创建新会话”的宽松恢复。旧历史只作为恢复证据，不重新计入工具执行与用量。
- SDK 自己的 Hermes home 保存在运行数据目录。恢复前只更新该 home 中的原生会话路由元数据，保留消息和工具历史；不会编辑用户 `~/.hermes`。
- 禁用自动会话标题的后台模型调用。SDK 本身记录任务名称；后台标题请求可能在本轮已结束后继续运行，与逐轮网关权限收尾冲突。
- 工具结果按 native toolCallId 配对；Hermes 仅提供展示内容时标记为预览，不能声称保留了未提供的完整原始工具输出。
- 推理与工具事件驱动统一空闲超时；背景菜单、上下文占用更新不算模型仍在工作。

## 验证口径

普通单元测试覆盖协议关联、工具配对、权限、历史重放和路由更新。另有需显式开启的真实 Hermes 测试：

```powershell
$env:SCIENCEEVOLVE_HERMES_ACCEPTANCE_BIN = 'C:/absolute/path/to/hermes.exe'
cd sdk
npx vitest run tests/hermes-native.test.ts
```

此测试启动真正的 Hermes、实际执行本地文件/MCP 工具，并验证原生会话恢复及常驻暂停/继续。模型接口是本地可控响应，**不是付费模型质量或科研 benchmark 验收**，也不等于完整 GitHub PR 协作验收。Windows 是本轮实际运行环境；Linux/macOS 和真实远端模型验收不能由这些结果代替。
