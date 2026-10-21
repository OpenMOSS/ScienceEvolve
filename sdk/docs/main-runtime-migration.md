# Main kernel migration: standalone SDK host

[← Back to SDK README](../README.md) · **English** | [简体中文](main-runtime-migration-zh.md)

> Historical implementation and acceptance record. Legacy and its API/CLI entries have since been removed. For current operation, use [CLI/API](main-cli.md); for the latest pinned source and recorded checks, use [2026-10-16 synchronization](main-sync-20261016.md). Historical revisions and test figures below are not current release promises.

This record includes the earlier main baseline `48e82cedd993d67f2379c36fade8973db63c74e8` and the previous `4ae079fe51faefed850b5b9873979f44b60a7806` phase. See the Chinese [2026-10-14](main-sync-20261014-zh.md) and [2026-10-13](main-sync-20261013-zh.md) records for their original scopes. Package version stayed 0.1.1; this was not a new stable-release announcement. Use the corresponding older release for old data.

## Implemented entry points and boundaries

Phase two added @scienceevolve/sdk/main with createMainResearchSdk, RunHandle, v3 validation, gateway management, and asynchronous events. CLI and root createResearchSdk now default to main. --engine main / @scienceevolve/sdk/main are aliases, with legacy entry points removed.

Current deployment is in [CLI](main-cli.md). Chinese historical records retain their original validation scopes: [native OAuth / Git-on Evolver / default entry](main-oauth-git-evolver-default-test-report-20261005.md), [API-key/Loop](main-profile-loop-test-report-20261005.md), [source import](main-source-workspace-test-report-20261005.md), and [shared fixes](main-shared-fixes-test-report-20261005.md). The migration phase moved 16 root examples and the SDK default to Git-off main while retaining the Git-on main-runtime example. Engine data cannot be shared, and old workflow env/profile fields cannot pass directly to the new entry.

@scienceevolve/sdk/application/main-runtime composes main's Orchestrator, CollaborationRuntimeCoordinator, HarnessRuntimeFacade, official resident adapters, execution input builder, and invocation dispatcher. It starts no HTTP application and includes neither Express nor Web pages.

sdk/src/core comes from pinned main plus declared host extensions: source-MCP file URLs, trusted pre-persistence callbacks, initial Git tree factory, native profiles, external workspace binding/delivery, and Windows support. These were reviewed as hostOnly, leaving Web behavior and HTTP/workflow authorization unchanged. resources/main-runtime/shared-fixes.json records exact replacement contexts; manifests retain original and patched SHA-256. Verification reverses every source blob without fuzzy patches or unregistered core edits. Forked project-mcp-host, control-mcp, resident-control-proxy, descriptor broker MCP, and pi MCP extension belong to the explicit dependency closure. The manifest then had 247 files; use the current manifest as authority. Builds/tests need no local main checkout.

runtimeRevision includes actual kernel/schema digests; sourceCommit alone is only an upstream baseline. Main does not finish merely because an Agent returns or auto-commit on exit. Git tools, finish_task, PR facts, ownership/epoch, writer leases, and recovery remain kernel decisions.

```js
import { createMainApplicationRuntime } from '@scienceevolve/sdk/application/main-runtime';

const runtime = await createMainApplicationRuntime({
  dataDir: '/absolute/path/to/a-new-empty-data-directory',
  runnerOptions: { harnessExecutables: { codex: '/absolute/path/to/codex' } },
  // optional：credentials are required only for Git-enabled projects.
  git: {
    credentialResolver: async () => {
      const token = process.env.GITHUB_TOKEN;
      if (!token) throw new Error('GITHUB_TOKEN is required for this Git project');
      return { token, requestedScopes: ['repo'] };
    }
  }
});
try {
  console.log(await runtime.orchestrator.listProjects());
  // Project creation accepts main createProjectSchema, not the old SDK WorkflowConfig.
  // Use runtime.gatewayStore; keep API keys out of workflow.json.
} finally {
  await runtime.close();
}
```

Use absolute Windows paths such as D:/runs/main-core-test and Node.js 24+ with node:sqlite. Required schema and Windows/Python/MJS helpers ship in the package. Actual helper execution still depends on platform, interpreters/compiler, and Harness setup; local tests do not establish those environments.

## Data, shutdown, and recovery

- New hosts require an empty independent dataDir and record engine/pinned-source/runtimeRevision markers. They do not take over old projects, repositories, or SDK/Web data.
- .scienceevolve-runtime.lock excludes concurrent hosts; old engines also reject new-engine data.
- Reopening follows main initialization/recovery and may resume runnable projects. It is not read-only inspection.
- close waits for orchestration/database shutdown and confirms all opened residents closed. Unconfirmed native Stop retains the directory lock; close can be retried. Remove crash locks only after confirming the original process stopped.
- Other revisions, including previews marked only by sourceCommit, do not auto-upgrade. Explicit migration/recovery acceptance is required; never edit markers just to open them.
- A Git resolver supplies both HTTPS transport and GitHub API. Without one, main's helper applies, without Web OAuth. Web accountId does not select SDK credentials; public multi-account adaptation remained outstanding in this phase.

## Compatibility and acceptance boundaries

Public createResearchSdk and CLI changed default. Existing consumers must update calls or use an older release, without silent conversion of state/profile routes.

Git-off CLI workspace / API absolute workspace execute in place. CLI relative paths resolve from launch cwd. The directory must exist and not overlap explicit dataDir. Bindings persist; omission retains the internal directory. workspace and sourceWorkspace are mutually exclusive.

Git-on also accepts workspace: safe current files enter controlled worktrees and formally completed integrated results write back, preserving original .git/HEAD/index. Conflicts stop overwrites; inspect workspaceDelivery and retry explicit syncWorkspace after resolution. Serial/parallel isolation is unchanged. sourceWorkspace is read-only with no automatic write-back. External Git-off proposals use `.scienceevolve/management/<projectId>/proposal/workflow.json`, preserving drafts/root configuration.

API-key env/profile import and Git-off Loop/Evolver tests were completed. Native Codex OAuth uses trusted host aliases and explicit official provider routing without extracting tokens or fabricating probes. Web did not enable that host extension; HTTP/workflow cannot register aliases. Permissions, per-turn authority, and Stop validation remain. OAuth notifications accept exact fields, and evidence uses separate read-only paths without opening traversal.

See [native OAuth](main-cli.md#codex-native-oauth-login) for app-server trusted-config boundaries. A bounded real Windows package test covered ordinary OAuth and Git-on scoped Evolver, prompt edits, implementation/audit, member/final PRs, integrated export, actual host tests, and reopen without rerun. Details remain in the Chinese [acceptance report](main-oauth-git-evolver-default-test-report-20261005.md). Current examples require independent dataDir, explicit gateway binding, and existing workspace; see [examples](https://github.com/OpenMOSS/ScienceEvolve/blob/main/example/README_en.md). User configurations need explicit migration; cross-platform/four-Harness real acceptance is not established.

## Explicit main API

```js
import { createMainResearchSdk, loadMainWorkflowConfig, bindMainWorkflowConfig } from '@scienceevolve/sdk/main';

const sdk = await createMainResearchSdk({
  dataDir: '/absolute/path/to/new-main-data',
  harnesses: { codex: '/absolute/path/to/codex' },
  git: {
    credentialResolver: async () => {
      const token = process.env.GITHUB_TOKEN;
      if (!token) throw new Error('GITHUB_TOKEN is required');
      return { token, requestedScopes: ['repo'] };
    }
    // For multiple accounts, consider expectedIdentity with the actual numeric ID and login.
  }
});
try {
  const apiKey = process.env.MODEL_API_KEY;
  if (!apiKey) throw new Error('MODEL_API_KEY is required');
  const gateway = await sdk.gateways.add({
    name: 'research', url: 'https://your-provider.example/v1', apiKey,
    protocol: 'chat-completions', models: ['your-model'], defaultModel: 'your-model'
  });
  const workflow = bindMainWorkflowConfig(await loadMainWorkflowConfig('/absolute/path/to/workflow.json'),
    { harness: 'codex', model: 'your-model' });
  // Git-enabled runs create/push real GitHub repositories; verify name and authorization first.
  const run = await sdk.start({ title: 'Research', requirement: 'Your bounded research task',
    workflow, gatewayBindings: { defaultGatewayId: gateway.id }
  });
  for await (const event of run.events()) console.log(event);
  console.log(await run.wait());
} finally { await sdk.close(); }
```

- validateMainWorkflowConfig uses main validation. Git-on v2 normalizes to v3; v3/Git-off and Git-off groups are rejected, without fallback. Outer preset schemaVersion: 2 differs from orchestration.schemaVersion: 3.
- Prompts, Skills/MCP, and scoped graphs follow main. Unknown SDK-only fields error rather than disappear. Relative Skills resolve from JSON location; in-memory inputs require absolute baseDir.
- JSON contains no gatewayId, gatewaySnapshot, gatewaySource, or key. gatewayBindings.agents overrides the defaultGatewayId per Agent; reasoning remains gatewayReasoningOption.
- harnesses() is asynchronous. Paths accept absolute native executables/JS CLIs, with packaged pi. Old executable+args is not falsely accepted after dropping args.
- snapshot retains Git/runtime/collaboration/task/execution/PR/parallel/failure projections, without full Agent settings, gateway snapshots, or internal control context. Outputs/events/errors separately redact credentials.
- events({afterSeq,follow:false}) fixes and pages the history boundary. Default subscription then replay avoids reconnect gaps. eventId, ownership/coordinator epoch, scope identity, and data.sourceType remain. Git-on completion does not require the old project.completed event; use wait()/snapshot().status.
- wait returns on completion, terminal cancel, paused, or interrupted. AbortSignal stops consumers, not tasks. Git-on F13 cancel preserves state as paused / collaboration:user-cancelled for explicit resume; Git-off cancel is generally terminal. pause is safe-point pause, distinct from Stop.
- retryGitInitialization delegates idempotent retry, without recreating repositories or rerunning completed work. close wakes waiters; failed close retains locks for retry. Stop guards cover ordinary and internal native opens.

See packaged examples/main-runtime/workflow.json for a v3 implementation/audit group. Use the default start / --engine main, not legacy.

## Shared kernel fixes

The pinned source generated `GITHUB_WAITING_FOR_AUTHORIZATION: ...` for GitHub 401/403. Conservative credential checks mistook the suffix for an assignment, rejected waiting_for_github checkpoints, retained authorizing, and paused as git:failed. The patch uses `[GITHUB_WAITING_FOR_AUTHORIZATION]` plus a redacted message while preserving credential detection. Actual SQLite tests verified waiting_for_github, same-operationId retry, and reopen after Stop without rerun. Invalid credentials still pause; no authorization is fabricated. The historical local main patch had not yet been submitted upstream at the time.

Source-MCP --import previously used raw Windows paths interpreted as URL schemes; pathToFileURL fixes Windows and POSIX. Compiled packages also need the forked supervisor, included in the source manifest and external-package MCP acceptance.

## Explicit final delivery directory

run.exportWorkspace({destination:absoluteNewDirectory}) requires completed Git-ready work and reads controlled bare-repository refs/heads/main. It returns destination, commit, files, bytes, without committing/merging/pushing or copying unmerged worktrees. CLI: `scievolve run export RUN_ID --engine main --data-dir DATA --output ABSOLUTE_NEW_DIR`.

Parent must exist; destination must not, even when an existing directory is empty, and must lie outside runtime data. Export preserves text/binary Git blobs without summary/redaction/newline conversion, excluding .git, credentials, runtime logs, and untracked files. LFS pointers stay pointers. Limits: 5,000 files, 32 MiB/file, 256 MiB total. Symlinks, submodules, illegal paths, case/Unicode-normalization collisions are rejected.

Cancel stops only export; close cancels and awaits it. Partial output remains on failure for inspection; do not concurrently edit destination. sourceWorkspace import and export are explicit actions, distinct from workspace in-place execution and automatic original-workspace write-back.

## Source workspace import

```js
const run = await sdk.start({
  title: 'Research existing code', requirement: 'Task description', workflow,
  gatewayBindings: { defaultGatewayId: gateway.id },
  sourceWorkspace: { path: '/absolute/path/to/source-repository' }
});
// Non-Git sources require file selection; Git sources can also override the default:
// sourceWorkspace: { path: '/absolute/path/to/source', files: ['README.md', 'src/code.py'] }
```

- Git-on main only. sourceWorkspace is host input, not workflow JSON. Source/dataDir must be real, mutually nonoverlapping directories, excluding junctions/symlinks.
- Git source must be the worktree root. Default selection is tracked regular files, reading **current working-tree bytes**, including uncommitted edits. No history/branches/refs/.git/hooks/untracked/ignored content or checkout/add/reset/fetch. HEAD/index/config remain unchanged. Exclude deleted tracked files explicitly; unresolved index conflicts are rejected.
- Non-Git needs a relative whitelist. Reject selected submodules, links/junctions/hardlinks, nonportable names, case/Unicode conflicts. Same 5,000-file / 32-MiB-file / 256-MiB-total limits as export.
- Exclude .env*, key/auth/gateway/credential files, dependencies, and main management mounts. This cannot identify every secret embedded in source; check credentials/data authorization, especially before public GitHub creation. It snapshots content, not Git history or LFS downloads.
- Save private manifests/blobs before binding and before project/provider/Agent work. Git creates the initial commit with operationId and source fingerprints. Retries verify the same commit/tree without resampling changed/moved/deleted source. README/.gitignore import only when selected, without default-template overwrite.
- Reopen uses saved bindings. Missing/corrupt registry/manifests/blobs fail explicitly, without an empty-project fallback. No filters/newline conversion/summarization. Per-file concurrent change checks are not a multi-file atomic filesystem snapshot.
- Agents execute in main-owned worktrees. Completed integrated work can explicitly export to a new directory. Failed preparation retains incomplete private snapshots for diagnosis, without deleting source. No automatic snapshot collection command was provided.

## API-key profile and Loop/Evolver

The new entry offers explicit one-time import rather than reading old workflow gatewaySource:

```js
const gateway = await sdk.gateways.importHarness({
  harness: 'codex', model: 'your-model', source: 'profile',
  profilePath: '/absolute/path/to/native/profile'
});
// Still test with sdk.gateways.test(...), then bind the returned ID.
```

Four Harnesses support API-key env/profile import through read-only native readers, then main gateway validation/storage. source is required; absolute profilePath applies only to profile mode. Optional in-memory environment fully replaces process.env rather than merging credentials; omission snapshots the current environment at import time.

Import edits no native config/auth, runs no shell helper/probe, and fabricates no successful record. It saves keys to private dataDir, without live binding or OAuth-only import. Native ordinary/resident routes use separate profile aliases, not auth.tokens extraction.

Main already supports Git-off v2 batch Loops and capability-bound Evolver. Actual SQLite/kernel tests covered two-batch golden call order/counters/events, pause/reopen without replaying committed iterations, Main/Worker prompt and batch-size updates, session refresh, reopen after completion, and rejection of locked permissions without partial commit. Disabled Evolver exposes no authority. No old Loop engine was copied or exact gateway probing weakened. Test Agents/upstreams/package smoke are deterministic doubles, not real-model acceptance.

Examples were explicitly migrated to Git-off/v2/empty collaborations, dropping old gatewaySource/reasoningEffort while preserving roles/models/Harnesses/instructions/routes/Loops/completion. Reasoning must be deployed and tested through actual modelReasoning/options or trusted native profiles; do not invent IDs. This does not migrate user-owned old files or turn Git-on v3 groups into in-place execution. Default is main; old state still needs its original release.

## Local validation scope

check:main-runtime verifies pinned source. Selective regressions include v3 validation, Git-on API avoiding the old scheduler, explicit Git tools, actual local worktrees/checkpoints, SQLite writers/epoch, concurrency, and recovery. Main assertions remain; declared test adaptations cover imports, temporary autocrlf settings, Windows junctions, explicit EPERM symlink skips, bounded 30/60-second timeouts, and temporary deletion retries. Manifest testAdaptations records them. Production patches remain registered shared fixes. Host tests cover directory isolation, Stop retry, and simulated Git-off projects.

smoke:package installs outside the repository to test actual SQLite, resources, and child processes. This historical phase also checked old APIs/CLI, since removed. Simulated providers are not real-model/GitHub acceptance. Bounded real Windows Codex OAuth/GitHub work had been completed earlier; this sync did not repeat paid model or GitHub write acceptance, nor complete cross-platform/four-Harness acceptance.

Chinese historical results: [phase one](main-runtime-test-report-20261005.md), [phase two](main-sdk-api-test-report-20261005.md). Read them under their recorded dates and scope.
