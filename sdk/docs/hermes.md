# Hermes Harness

[← Back to SDK README](../README.md) · **English** | [简体中文](hermes-zh.md)

The default main engine supports NousResearch/hermes-agent as hermes, using the same registry and runtime interface as Codex, pi, and DSH. The default Harness is Codex.

## Installation and configuration

Install Hermes separately with ACP and MCP dependencies. The SDK bundles neither Python nor Hermes and does not install them during tasks. The recorded adapter validation targets Hermes v0.21.6 ACP. First verify `hermes acp --check`. See the [official installation guide](https://hermes-agent.nousresearch.com/docs/user-guide/windows-native).

Deployment runtime.json:

```json
{
  "harnesses": {
    "hermes": "C:/absolute/path/to/hermes.exe"
  }
}
```

On Linux/macOS, use the native executable path. Discovery also accepts SCIENCEEVOLVE_HERMES_BIN or PATH; Windows rejects .cmd/.bat/.ps1 launchers. API harnesses.hermes requires an absolute path; CLI runtime-config resolves relative paths from its file directory.

Hermes uses SDK gateways/models, without reading personal Hermes profiles or OAuth. Use gateway add or explicit `gateway import --harness hermes --model YOUR_MODEL --source env` to import OPENAI_BASE_URL / OPENAI_API_KEY once. Never put keys in workflow.json.

```powershell
scievolve harnesses --data-dir D:/runs/hermes-data --runtime-config D:/research/runtime.json
scievolve gateway test GATEWAY_ID --harness hermes --model YOUR_MODEL `
  --data-dir D:/runs/hermes-data --runtime-config D:/research/runtime.json
scievolve start D:/research/workflow.json D:/research/research_proposal.txt `
  --workspace D:/research/project --gateway GATEWAY_ID `
  --data-dir D:/runs/hermes-data --runtime-config D:/research/runtime.json
```

The Node API uses the same entry point:

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

## Workflow and permissions

Set the relevant Agent's harness to hermes. No alternate workflow format is introduced. Main, execution, and audit can use different Harnesses; see the [mixed example](../examples/hermes/workflow.json). It executes scripts and explicitly uses yolo, a broad permission appropriate only for authorized environments.

- workspace / compute disable native Hermes terminal, file writes, and independent delegation, using SDK file-permission MCP and explicitly configured MCP. compute does not bypass tool permissions.
- yolo enables native terminal/file tools. Independent delegation, cron, and automatic personal-memory/Skill changes remain off by default.
- Read-only explanation receives only the necessary evidence and no tools.
- Connection probes check real Harness tool receipts, not just successful text requests.

The SDK still selects/stages Skills and autoSkills; the adapter forwards selected instruction bodies and disables Hermes auto-installation/modification. Inputs use existing SDK file entry points. No direct ACP transport for images or other binary input is added.

## Architectural boundary

Hermes handles one Agent's model/tool loop. Scheduling, completion, Loop/Evolver, SII waits, and Git collaboration remain kernel responsibilities.

- Git-off uses the SDK shared workspace, including the original directory when explicitly selected.
- Git-on uses SDK worktrees, commit/integration/delivery rules, not Hermes's worktree feature.
- Logical turns use real ACP sessions under shared resident-process ownership and per-turn authority.
- Recovery uses session/load, without silently replacing a missing old session. Replayed history is recovery evidence, not newly counted work or usage.
- SDK-owned Hermes home lives in runtime data. Recovery updates only that home's routing metadata, preserving messages/tool history; user ~/.hermes is not edited.
- Background model calls for automatic titles are disabled: they can outlive a turn and conflict with per-turn gateway closure. The SDK records task names itself.
- Tool results pair by native toolCallId. Display-only content is a preview, not an unprovided full raw result.
- Reasoning/tool events drive shared idle timeouts. Background menus and context-usage updates are not model activity.

## Validation scope

Unit tests cover protocol association, tool pairing, permissions, history replay, and routing updates. Explicitly enable real-Hermes tests with:

```powershell
$env:SCIENCEEVOLVE_HERMES_ACCEPTANCE_BIN = 'C:/absolute/path/to/hermes.exe'
cd sdk
npx vitest run tests/hermes-native.test.ts
```

They start actual Hermes, execute local file/MCP tools, and verify native-session recovery and resident pause/resume. The model endpoint is locally controlled: **this is not paid-model quality or scientific benchmark acceptance**, nor full GitHub PR collaboration acceptance. Windows was the actual recorded platform. These results do not substitute for Linux/macOS or real remote-model validation.
