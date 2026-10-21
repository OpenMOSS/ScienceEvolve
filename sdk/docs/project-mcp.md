# Project-specific MCP services

[← Back to SDK README](../README.md) · **English** | [简体中文](project-mcp-zh.md)

These definitions and stdio-to-HTTP instructions apply to the main engine. Use an explicit independent dataDir; see [CLI](main-cli.md) and [migration](main-runtime-migration.md) for workspace/recovery rules.

Main proposes services in workflow.json mcpDefinitions, assigns them through agents.<name>.mcpServers, and calls apply_workflow. Workers cannot submit proposals. Main needs orchestration.allowMainReconfiguration: true. With it disabled, predefined services can still run.

## Runnable definitions

Merge this fragment into an existing workflow to give Main a workspace file-listing tool. No separate launcher is required: load the workflow through the existing CLI/API, select the workspace, and provide a requirement.

```json
{
  "mcpDefinitions": {
    "workspace-tools": {
      "command": "node",
      "entrypoint": "server.cjs",
      "files": {
        "server.cjs": "const { Server } = require('@modelcontextprotocol/sdk/server/index.js');\nconst { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');\nconst { ListToolsRequestSchema, CallToolRequestSchema } = require('@modelcontextprotocol/sdk/types.js');\nconst { readdir } = require('node:fs/promises');\nconst server = new Server({ name: 'workspace-tools', version: '1' }, { capabilities: { tools: {} } });\nserver.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [{ name: 'list_workspace', description: 'List files in the current task directory', inputSchema: { type: 'object', properties: {}, additionalProperties: false } }] }));\nserver.setRequestHandler(CallToolRequestSchema, async (request) => {\n  if (request.params.name !== 'list_workspace') throw new Error('Unknown tool');\n  return { content: [{ type: 'text', text: JSON.stringify(await readdir(process.cwd())) }] };\n});\nserver.connect(new StdioServerTransport());\nprocess.stdin.on('end', () => { server.close().finally(() => process.exit()); });\n"
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

`name` is the Agent-visible service name; `project` references a mcpDefinitions key. Names must be unique per Agent and cannot impersonate a fixed catalog service. Remote `{ "name", "url" }` services remain supported and may coexist; one entry cannot specify both project and url.

## Connecting an existing stdio MCP

Agent mcpServers entries accept `{ "name", "url" }` or `{ "name", "project" }`, not direct external command/args. mcpDefinitions provides SDK-managed stdio services with source and launch settings. To reuse a separately deployed stdio service, bridge it to Streamable HTTP and supply its URL.

First verify the original launch command, dependencies, and environment. For an existing `/absolute/path/materials_mcp.py` launched with Python, run in another terminal:

```sh
npx -y supergateway --stdio "python /absolute/path/materials_mcp.py" --outputTransport streamableHttp --port 8000
```

Replace the interpreter, path, and arguments with the real launch command. The default endpoint is `http://127.0.0.1:8000/mcp`. Explicitly select --outputTransport streamableHttp: supergateway's default stdio output is SSE, whereas the SDK URL integration uses Streamable HTTP. Do not supply `/sse`. See [supergateway's documentation](https://github.com/supercorp-ai/supergateway#stdio--streamable-http).

Merge into the relevant Agent:

```json
{
  "mcpServers": [
    { "name": "materials", "url": "http://127.0.0.1:8000/mcp" }
  ]
}
```

This belongs under agents.<name>. The URL must be reachable from the SDK host; containers and remote hosts may require another address.

Before integration, use a standard MCP client to check initialization, tools/list, and a tools/call with valid arguments. Browser access or HTTP 200 alone is insufficient. Then run a minimal task where the Agent calls the actual tool and the Harness receives its result. Use tool names and arguments returned by tools/list.

The deployer manages this external bridge and original service. Keep them running before tasks and reachable after recovery; the SDK does not start or collect them. SDK http-mcp-bridge.ts adapts HTTP services for Harnesses that need stdio. supergateway handles the opposite direction here.

## Source and launch

Implement standard newline-delimited JSON-RPC stdio MCP. The readable version of the source embedded above is:

```js
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { ListToolsRequestSchema, CallToolRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { readdir } = require('node:fs/promises');
const server = new Server({ name: 'workspace-tools', version: '1' }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [{ name: 'list_workspace', description: 'List files in the current task directory', inputSchema: { type: 'object', properties: {}, additionalProperties: false } }] }));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== 'list_workspace') throw new Error('Unknown tool');
  return { content: [{ type: 'text', text: JSON.stringify(await readdir(process.cwd())) }] };
});
server.connect(new StdioServerTransport());
process.stdin.on('end', () => { server.close().finally(() => process.exit()); });

```

- `files`: complete text-file mapping; safe relative paths, excluding `..`, backslashes, absolute paths, and file/directory collisions.
- `entrypoint`: required, referencing a nonempty file in files.
- `command`: defaults to node, resolved to the SDK's Node executable. Other values name a PATH executable or executable path, not a shell command string.
- `args`: defaults to []; launch is command, absolute copied entrypoint, then args. At most 64 arguments, each up to 4,096 characters.
- `envFrom`: defaults to {}; e.g. `{ "API_KEY": "TASK_MCP_API_KEY" }` reads a host variable. Missing referenced variables fail startup. Map required host variables explicitly; the SDK does not modify process.env.

CommonJS Node services receive MCP and Zod module search paths. Supply ESM or other dependencies in the deployment environment; the SDK does not run npm/pip installation. Services run as the host user, outside the Harness's workspace/compute sandbox.

Service cwd is the Agent invocation's task workspace: shared in Git-off, role-isolated in Git-on. Use __dirname or SCIENCEEVOLVE_MCP_SOURCE_DIR for adjacent source. SCIENCEEVOLVE_WORKSPACE is the task directory; SCIENCEEVOLVE_PROJECT_ROOT is private SDK project data. Persist cross-invocation data in the workspace. These SDK variables and NODE_PATH are set by the host and cannot be overridden through envFrom.

## Lifecycle and versions

Persistent source lives at `<dataDir>/projects/<projectId>/mcp/<content-digest>/project-<name>/`; dataDir defaults to ~/.scienceevolve/data at this lower-level service boundary. Current main CLI startup still requires an explicit data directory. Digests include files, launch arguments, and environment references. Old versions remain; projects are isolated. Definitions/assignments persist and services restart on recovery without relying on old ports or processes.

An invocation starts only assigned services. Aliases of one definition share an instance within that invocation; other Agents/later invocations start their own. MCP initialization and tool listing precede Agent startup. Entry or initialization failure collects other started services and enters invocation recovery.

Services are cleaned up on completion, failure, cancellation, and close. An independent supervisor collects them if the SDK IPC connection disappears. POSIX also collects the process group and force-stops on timeout. Detached or remote workloads are outside this guarantee; real Windows process-tree acceptance remains outstanding.

Stderr logs live at runtimePath/mcp/<definition>.stderr.log, capped at 1 MiB. Startup/exit errors include diagnostic paths; logs are not broadcast as public events. Ordinary stdout logging corrupts MCP protocol framing.

Source executes from an invocation copy, not the persistent version. apply_workflow atomically submits file/launch/assignment changes; failure preserves the accepted version. Content changes invalidate affected sessions; the next call starts the new version. Submission validates definitions and references without executing the service; real initialization happens before its assigned Agent, so configuration validity is not service availability.

## Protocol and limits

The managed bridge supports tools/list, tools/call, resource listing/templates/reads, and prompt listing/reads. pi exposes tools through its existing adapter; final capability depends on the Harness. Sampling, elicitation, resource subscriptions, and server-initiated notifications are unsupported. Forwarding timeout: 60 seconds; total startup wait: 35 seconds.

Names use 1–64 lowercase letters, digits, `-`, or `_`, starting with a letter/digit. At most 32 project services, 100 text files each, 500,000 characters per file, and 1 MiB for mcpDefinitions JSON. Remote and project MCP entries total at most 32 per Agent. Submitted complete workflow snapshots remain subject to 2 MiB.

Omitting mcpDefinitions preserves existing definitions; supplying it expresses the full table. Remove a file from files to express deletion and remove all Agent references before expressing service removal. **Current Main reconfiguration also enforces immutability of already accepted definitions:** use a new name and update references to change accepted content; same-name rewriting, replacement, or removal is rejected. See [Main reconfiguration](../skills/scienceevolve-sdk/references/workflow-en.md#main-reconfiguration). The successful workflow.reconfigured event includes changedMcps and changedAgents.

Tests use actual local Node MCP subprocesses, standard clients, and simulated model decisions for calls, changes, recovery, rollback, cancellation, and abnormal exit. They do not establish acceptance across real models or platforms.
