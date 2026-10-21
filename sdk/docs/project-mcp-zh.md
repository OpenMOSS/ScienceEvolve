# 任务专属 MCP 服务

[← 返回 SDK README](../README_zh-CN.md) · [English](project-mcp.md) | **简体中文**

本文配置及 stdio → HTTP 接入方式用于 main 引擎。运行时显式指定独立 dataDir，Git 工作区和恢复规则见 [main CLI](main-cli-zh.md) 与 [迁移说明](main-runtime-migration-zh.md)。

Main 在 `workflow.json` 的 `mcpDefinitions` 中创建和修改服务，用 `agents.<name>.mcpServers` 分配，再提交 `apply_workflow`。普通 Agent 不能提交，Main 需要 `orchestration.allowMainReconfiguration: true`；关闭时仍可运行模板预先定义的服务。

## 可运行的定义

下面的片段合入已有 workflow 模板，给 Main 添加读取任务文件列表的工具。不需要另写启动脚本，按原有 CLI/API 方式读取 workflow、指定 workspace 并输入自然语言需求即可。

```json
{
  "mcpDefinitions": {
    "workspace-tools": {
      "command": "node",
      "entrypoint": "server.cjs",
      "files": {
        "server.cjs": "const { Server } = require('@modelcontextprotocol/sdk/server/index.js');\nconst { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');\nconst { ListToolsRequestSchema, CallToolRequestSchema } = require('@modelcontextprotocol/sdk/types.js');\nconst { readdir } = require('node:fs/promises');\nconst server = new Server({ name: 'workspace-tools', version: '1' }, { capabilities: { tools: {} } });\nserver.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [{ name: 'list_workspace', description: '列出当前任务目录中的文件', inputSchema: { type: 'object', properties: {}, additionalProperties: false } }] }));\nserver.setRequestHandler(CallToolRequestSchema, async (request) => {\n  if (request.params.name !== 'list_workspace') throw new Error('Unknown tool');\n  return { content: [{ type: 'text', text: JSON.stringify(await readdir(process.cwd())) }] };\n});\nserver.connect(new StdioServerTransport());\nprocess.stdin.on('end', () => { server.close().finally(() => process.exit()); });\n"
      }
    }
  },
  "agents": {
    "main": {
      "mcpServers": [
        {
          "name": "workspace-tools",
          "project": "workspace-tools"
        }
      ]
    }
  }
}
```

`name` 是 Agent 看到的服务名，`project` 是 `mcpDefinitions` 的键。同一个 Agent 的服务名称不能重复；固定目录服务的名称不能用于冒充任务服务。远程 `{ "name", "url" }` 配置仍然支持，与任务服务可共存；一项不能同时指定 `project` 和 `url`。

## 已有 stdio MCP 如何接入

`agents.<name>.mcpServers` 支持 `{ "name", "url" }` 和 `{ "name", "project" }`，不能直接填写外部进程的 `command`、`args`。前文的 `mcpDefinitions` 是 SDK 托管 stdio 服务的方式，适合把服务源码及启动配置纳入任务。如果已有独立部署的材料检索等 stdio MCP，可先将它桥接成 Streamable HTTP，再配置 URL。

先确认原 MCP 的启动命令可用、Python/npm 等依赖和所需环境变量已准备好。以下示例假定已有 `/absolute/path/materials_mcp.py`，通过 `python /absolute/path/materials_mcp.py` 启动标准 stdio MCP。在另一个终端运行：

```sh
npx -y supergateway --stdio "python /absolute/path/materials_mcp.py" --outputTransport streamableHttp --port 8000
```

将路径、解释器和参数换成实际服务的启动命令。桥接端点默认为 `http://127.0.0.1:8000/mcp`。必须显式指定 `--outputTransport streamableHttp`：supergateway 的 stdio 输入默认输出 SSE，而本 SDK 的 URL 接入使用 Streamable HTTP，不能直接填写 `/sse`。参数见 [supergateway 官方说明](https://github.com/supercorp-ai/supergateway#stdio--streamable-http)。

在已有 workflow 的相应 Agent 中合入：

```json
{
  "mcpServers": [
    { "name": "materials", "url": "http://127.0.0.1:8000/mcp" }
  ]
}
```

这段配置位于 `agents.<name>` 下。`127.0.0.1` 必须能从运行 SDK 的环境访问；SDK 在容器或远端机器中运行时，应填写从该环境可达的桥接地址。

接入前用标准 MCP 客户端连接该 URL，依次验证初始化、`tools/list` 和一次使用有效参数的 `tools/call`；仅浏览器访问或 HTTP 200 不足以证明 MCP 可用。随后在最小任务中让该 Agent 实际调用材料工具，确认 Harness 也能取得结果。工具名称和参数以该服务的 `tools/list` 返回值为准。

此方式的桥接进程和原服务由部署方管理：启动任务前保持桥接运行，暂停恢复后仍须可连接，SDK 不负责启动或回收它。SDK 内部的 `http-mcp-bridge.ts` 用于把 HTTP 服务提供给需要 stdio 的 Harness；外部 stdio 服务转为 HTTP 的步骤由这里的 supergateway 完成。

## 服务源码与启动

服务源码须实现标准 newline-delimited JSON-RPC stdio MCP。可读形式的示例代码如下（其完整内容已包含在上面的 JSON 中）：

```js
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { ListToolsRequestSchema, CallToolRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { readdir } = require('node:fs/promises');
const server = new Server({ name: 'workspace-tools', version: '1' }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [{ name: 'list_workspace', description: '列出当前任务目录中的文件', inputSchema: { type: 'object', properties: {}, additionalProperties: false } }] }));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== 'list_workspace') throw new Error('Unknown tool');
  return { content: [{ type: 'text', text: JSON.stringify(await readdir(process.cwd())) }] };
});
server.connect(new StdioServerTransport());
process.stdin.on('end', () => { server.close().finally(() => process.exit()); });

```

- `files`：完整文本文件映射；相对路径不能含 `..`、反斜线或绝对路径，不能有文件/目录名称冲突。
- `entrypoint`：必填，须指向 `files` 中一个非空文件。
- `command`：默认 `node`，解析为 SDK 的 Node 可执行程序。其他值是 PATH 中的程序名或可执行程序路径，不是 shell 命令串。
- `args`：默认 `[]`，启动形式为 `command <执行副本中的入口绝对路径> ...args`。最多 64 项，每项最多 4096 字符。
- `envFrom`：默认 `{}`，例如 `{ "API_KEY": "TASK_MCP_API_KEY" }` 从宿主环境取值；所引用变量缺失则启动失败。服务环境由所选引擎构造，需要提供的宿主变量通过 `envFrom` 显式映射；SDK 不修改宿主的 `process.env`。

SDK 为 CommonJS Node 服务提供 MCP 库与 Zod 的模块搜索路径；ESM 或其他额外依赖应由部署环境提供。SDK 不自动运行 npm/pip 安装。服务进程以宿主用户身份运行，不套用 Harness 的 workspace/compute 沙箱。

服务的 cwd 是该 Agent 调用使用的任务 workspace；main 的 Git-off 模式共享工作区，Git-on 使用相应角色的隔离工作区。读取配套源码文件用 `__dirname` 或 `SCIENCEEVOLVE_MCP_SOURCE_DIR`；`SCIENCEEVOLVE_WORKSPACE` 是任务工作目录，`SCIENCEEVOLVE_PROJECT_ROOT` 是项目 SDK 数据目录。需要跨调用保留的数据写到 workspace。上述 SDK 变量及 `NODE_PATH` 由 SDK 设置，不通过 `envFrom` 覆盖。

## 生命周期与版本

持久源码位于 `<dataDir>/projects/<项目ID>/mcp/<内容摘要>/project-<名称>/`，`dataDir` 默认 `~/.scienceevolve/data`。摘要包含文件、启动参数和环境变量引用；旧版本保留，任务间隔离。SDK 保存定义及 Agent 分配，恢复后重新启动服务，不依赖旧端口或残留进程。

每次 Agent 调用只启动它引用的服务，同一定义的多个别名共用一个实例；不同 Agent 或后续调用各自启动。SDK 执行 MCP 初始化和工具列表检查后才启动 Agent。入口错误或初始化失败会回收已启动的其他任务服务，并进入原有调用失败恢复流程。

SDK 在调用结束、失败、取消和关闭时清理服务。独立 supervisor 在 SDK 的 IPC 连接消失时主动清理；POSIX 上还会回收同一进程组，超时强制结束。不承诺清理由服务主动脱离进程组或提交到远端的工作负载；Windows 进程树行为尚待真实平台验收。

运行时日志位于该调用的 `runtimePath/mcp/<定义名称>.stderr.log`，其中服务 stderr 最多保存 1 MiB。启动/异常退出错误包含诊断路径；日志不直接广播到公共事件。stdout 不能打印普通日志，否则会破坏 MCP 协议。

源码在独立调用副本中执行，不直接运行持久版本。通过 `apply_workflow` 提交文件、启动配置或分配变更，定义与分配一起原子提交；失败保持原有效版本。内容改变会清空使用它的 Agent 旧会话，下一次调用启动新版本。提交只校验配置与引用，不执行用户服务；实际初始化在被分配的 Agent 调用前完成，代码错误不会被误报为可用服务。

## 协议范围与限制

SDK 托管桥支持 `tools/list`、`tools/call`、资源列表/模板/读取、提示词列表/读取。Pi 仍按现有适配器暴露工具；最终能力受 Harness 支持范围约束。托管桥不提供 sampling、elicitation、资源订阅或服务主动推送通知。调用转发超时为 60 秒，启动总等待上限为 35 秒。

定义名称使用 1–64 位小写字母、数字、`-`、`_`，首字符为字母或数字。最多 32 个任务服务；每个最多 100 个文本文件、单文件最多 500,000 字符，`mcpDefinitions` JSON 总大小不超过 1 MiB。每个 Agent 的远程与任务 MCP 合计最多 32 项；运行中提交的完整 workflow 快照仍受 2 MiB 上限约束。

Main 提案中省略 `mcpDefinitions` 保留已有值，提供时整表替换。删除单个源文件从 `files` 移除；删除服务前须同时解除所有 Agent 对它的引用。**当前 Main 重配置还受已接受定义不可变规则约束：** 同名改写、替换和删除会被拒绝；调整内容需新增定义名称并更新引用，见 [Main 自修改](../skills/scienceevolve-sdk/references/workflow.md#main-自修改)。成功提交的 `workflow.reconfigured` 事件包含 `changedMcps` 和受影响的 `changedAgents`。

自动化测试使用真实 Node MCP 子进程、标准 MCP 客户端和模拟模型决策，覆盖调用、修改、恢复、失败回滚、取消与异常进程退出。它不代表四种真实模型或跨平台环境均已验收。
