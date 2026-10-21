# Deployment, CLI, and Node SDK (default main)

[← Back to SDK README](../../../README.md) · **English** | [简体中文](usage.md)

Requires Node.js 24+. Install Codex/Claude Code/DSH as needed; pi is packaged. Each main dataDir is an explicit absolute path, separate from legacy/Web/other runtime revisions. Only one host may open it at a time. Keep credentials out of workflows, requirements, and output.

## GitHub credentials (Git-on)

Git-off needs no SDK GitHub credentials. Git-on uses host tokenEnv, git.credentialResolver, or HTTPS credential helpers, without a Web OAuth App. Model login and GitHub authorization are separate. tokenEnv names an environment variable in runtime-config; the SDK does not automatically read GITHUB_TOKEN or Web .env. Complete [identity preflight](../../../docs/main-cli.md#github-identity-and-permission-preflight), then start/recover Git-on v3 with the same directory, gateway binding, and runtime-config. See [authentication](../../../docs/main-cli.md#github-authentication-and-git-collaboration).

## API-key route

Attach materials with --inputs /absolute/materials or --inputs-file /absolute/inputs.json. Workflow inputs/inputDescription can provide defaults; loadWorkflowConfig/CLI resolve relative material paths from the workflow file. Explicit start/CLI parameters override each field independently. inputs: [] disables defaults and an empty description clears it.

Direct validateWorkflowConfig requires absolute baseDir for relative sources and neither reads nor copies materials. The CLI material options are mutually exclusive. JSON entries are strings or `{ "path": "../image.png", "name": "figures/image.png" }`, resolving from the JSON directory; --inputs resolves from launch cwd. API sources must be absolute. Directories preserve basename/subpaths; name is a portable relative destination or prefix. Descriptions have at most 2,000 trimmed characters.

Inputs are copied before the first Agent into shared user_inputs: workspace-local in Git-off and private project workspaces/user_inputs in Git-on, outside worktrees and automatic Git publication. Limits: 1,000 files, 50 MiB each, 200 MiB total; reject links/collisions and never overwrite. Treat materials as untrusted references, not authority, and exclude credentials.

Snapshot userInputsPath locates the shared directory for manual additions. Additions do not notify/restart Agents or update initial inputFiles. Read-only reference policy is not an immutability guarantee, especially with writable Git-off/yolo parent directories.

```sh
# Set SDK_CODEX_BASE_URL and SDK_CODEX_API_KEY first; --source profile is also supported.
scievolve gateway import --data-dir /absolute/new-main-data \
  --harness codex --model ACTUAL_MODEL --source env
scievolve gateway test GATEWAY_ID --data-dir /absolute/new-main-data \
  --harness codex --model ACTUAL_MODEL --reasoning-option high
scievolve start workflow.json requirement.txt --data-dir /absolute/new-main-data \
  --workspace /absolute/your-project \
  --gateway GATEWAY_ID
```

The templates use high. Before import, define the model mapping with SDK_CODEX_REASONING_FILE or JSON. Other Harnesses use SDK_PI / SDK_DSH / SDK_CLAUDE_CODE prefixes. If the provider actually supports Responses reasoning.effort:

```json
{"ACTUAL_MODEL":{"parameter":"reasoning.effort","options":[{"id":"high","label":"High","value":"high"}]}}
```

Use the provider's actual parameter/value. gateway add --reasoning-file also configures mappings. Supported paths: reasoning_effort, reasoning.effort, chat_template_kwargs.reasoning_effort, thinking.effort. Do not remove required reasoning options merely to bypass probes. New configurations without such requirements may explicitly use provider defaults. Test every Harness/model/option combination.

Profile import copies API-key configuration once; it is distinct from native Codex OAuth. Custom API-key providers also use gateways. Profile defaults do not override workflow models.

For multiple gateways, use --gateway-bindings FILE instead of --gateway:

```json
{"defaultGatewayId":"AUTHOR_GATEWAY_ID","agents":{"reviewer":"REVIEW_GATEWAY_ID"}}
```

Do not globally override models in methods such as ARIS that depend on independent model-family review.

## Codex native OAuth

Native login needs no additional API key and extracts no OAuth token. Register a trusted directory alias in deployment.json:

```json
{"nativeCodexProfiles":{"login":"/absolute/path/to/.codex"}}
```

Affected roles must use codex without gatewayReasoningOption. Native routing is not automatically equivalent to a high-reasoning gateway setup. Explicitly choose a replacement policy and save a separate configuration before removing existing high/xhigh options. Native Git-off exec ignores user config/rules and explicitly selects official openai rather than custom relays.

```sh
scievolve start workflow.native.json requirement.txt --data-dir /absolute/new-native-data \
  --runtime-config /absolute/deployment.json --native-codex-profile login
```

Recovery requires the same alias mapping. Mixed roles can use bindings.agents entries `{ "nativeCodexProfileId":"login" }`; all-native uses defaultNativeCodexProfileId. Other deployment fields include harnesses with absolute executables/JS CLIs, skillRoots, execution, timeouts, and Git variable names. Old executable+args objects and top-level agentConcurrency/compute are unsupported. Example: `{ "harnesses":{"codex":"/absolute/bin/codex"}, "execution":{"agentConcurrency":2} }`.

## Input directories and lifecycle

CLI workspace resolves from launch cwd; API start.workspace requires an absolute path. The existing real directory must not overlap dedicated dataDir. Git-off roles edit the original directory, or use `<dataDir>/projects/<runId>/workspaces/` by default. Recovery reuses the binding rather than preparing source again. Locate Skill scripts from their actual loaded location and keep state out of staged Skill directories. Use available absolute interpreters for dependencies.

Git-on workspace imports safe current source, including uncommitted/nonignored new files, and executes in isolated worktrees. Formal completion/integration triggers write-back without changing original .git/HEAD/index. Preflight prevents conflict overwrites; a mid-delivery failure leaves recovery journals rather than promising directory-wide atomic rollback. Resolve and run sync-workspace / run.syncWorkspace(). Delivery completes only when workspaceDelivery.status is synced. Limits are 5,000 files, 32 MiB each, 256 MiB total, excluding unsafe links. workspace and sourceWorkspace are mutually exclusive. Do not edit the original concurrently during delivery.

External Git-off proposals live at `.scienceevolve/management/<projectId>/proposal/workflow.json`; the Inbox provides the actual location. Drafts persist. The logical alias workflow.json does not overwrite root configuration.

Git-on --source-workspace /absolute/source is read-only source import. Git defaults to tracked working-tree content; non-Git requires --source-files /absolute/files.json with relative filenames. History, .git, credentials, and dependencies are excluded; source and dataDir cannot overlap. After completion, run export exports integrated main.

```sh
scievolve run resume RUN_ID --data-dir /absolute/new-main-data
# If runtime-config was used, include the original file in the resume command.
scievolve run input RUN_ID followup.txt --data-dir /absolute/new-main-data --request-id followup-1
scievolve run respond RUN_ID answer.txt --data-dir /absolute/new-main-data
scievolve run export RUN_ID --data-dir /absolute/new-main-data --output /absolute/new-delivery
scievolve run sync-workspace RUN_ID --data-dir /absolute/new-main-data
```

Git-off cancel is terminal, while Ctrl+C requests safe pause. Git-on cancel is native recoverable Stop; resume after confirmation. Safe pause may wait for a call to finish; repeated signals do not force-kill. After confirmed close, a colored resume command preserves dataDir/runtime-config; stdout stays JSONL. run export requires completed Git-on and a new destination. For Git-off, copy required deliverables after shutdown.

list/show/events open the host and may recover tasks. Do not concurrently monitor the same directory; use foreground events. resume does not replace respond; added input may reopen a completed task. Exit codes: signal with safe pause 130, successful command/explicit pause 0, unsuccessful task/probe 2, argument/operation error 1.

## ESM API

Install the SDK in the consuming Node project. Global CLI installation alone does not make imports available everywhere.

```js
import { createResearchSdk, loadWorkflowConfig } from '@scienceevolve/sdk';
const workflow = await loadWorkflowConfig('/absolute/workflow.json');
const sdk = await createResearchSdk({ dataDir: '/absolute/new-main-data' });
try {
  // Configure this gateway in the same dataDir and test every combination before starting.
  const run = await sdk.start({
    title: 'Task', requirement: 'Actual goal, input manifest, editable scope, and acceptance criteria',
    workflow, workspace: '/absolute/your-project',
    gatewayBindings: { defaultGatewayId: 'ACTUAL_GATEWAY_ID' }
  });
  console.log('runId', run.id);
  for await (const event of run.events()) console.log(event);
  const result = await run.wait();
  console.log(result.status, result.artifacts);
  if (result.status !== 'completed') process.exitCode = 2;
} finally { await sdk.close(); }
```

Gateways can also be prepared with sdk.gateways.add/importHarness/test. Native OAuth uses createResearchSdk({dataDir,nativeCodexProfiles:{login:absoluteHome}}) and start.gatewayBindings={defaultNativeCodexProfileId:'login'}. Git-on start accepts sourceWorkspace:{path:absoluteSource,files:['src/file.py']}. For in-memory configurations with relative Skills, call validateWorkflowConfig(input,{baseDir:absoluteDir}).

Observe through same-process run.snapshot/events, control with pause/cancel. wait also returns on paused/interrupted. AbortSignal stops waiting/subscription, not the task. Reopen through sdk.getRun(id), inspect status, then resume/respond. createResearchSdk performs recovery itself and is not a read-only inspection interface.
