# SDK CLI and deployment

[← Back to SDK README](../README.md) · **English** | [简体中文](main-cli-zh.md)

`scievolve` uses the main kernel by default; `--engine main` is an explicit alias. `@scienceevolve/sdk` and `@scienceevolve/sdk/main` use the same implementation. The source repository provides 23 workflows: 16 Git-off workflows sharing a directory and seven Git-on collaboration workflows.
This guide covers gateways, model routing, GitHub credentials, workspaces, and recovery. See [runtime migration](main-runtime-migration.md) for earlier deployment entry points and data boundaries.

## Deployment and startup

Attach shared files or images with `start --inputs ./materials` or `--inputs-file ./inputs.json`. Workflow-level `inputs` and `inputDescription` supply defaults; relative source paths resolve from the workflow file's directory. CLI input and description options override their respective defaults independently. An inputs JSON file containing `[]` disables default materials; `--input-description ''` clears the default description.

The two input options are mutually exclusive. `--inputs` resolves from the launch directory. An inputs JSON file contains strings or objects such as `{ "path": "../image.png", "name": "figures/image.png" }`; its source paths resolve from that JSON file's directory. Descriptions are limited to 2,000 characters after trimming. Materials are copied before the first Agent runs, preserving directory structure. The CLI checks the basic list format first, then validates files, names, sizes, and destination conflicts before copying.

Git-off uses `user_inputs/` in the actual workspace. Git-on uses the private project's `workspaces/user_inputs/`, outside Git worktrees, without automatic publication. See [shared inputs](project-inputs.md) for limits and later additions.

Requires Node.js 24+ and the selected Harness. The package includes pi's JavaScript entry point. Git-on collaboration and Task-level Git operations require Git. The default main runtime also supports a separately installed [Hermes ACP Harness](hermes.md).

Explicitly select a new absolute `--data-dir`; the old `SCIENCEEVOLVE_DATA_DIR` or implicit default is not used. Data carries engine and actual `runtimeRevision` markers. Do not mix Web data, older SDK data, or preview data from before a fix.

```powershell
scievolve --engine main --help
scievolve harnesses --engine main --data-dir D:/runs/main-data
scievolve workflow validate D:/research/workflow.json --engine main
```

`workflow validate` runs offline, opens no host, and requires no data directory. Other run and gateway commands open the host under main's recovery rules, including list/show/events: **they are not offline, read-only viewers**. Do not start another process with the same data directory just to monitor progress; use the foreground event stream.

Configure a gateway in that data directory first. Supply its key through an existing environment variable, never a command argument or workflow:

```powershell
scievolve gateway add --engine main --data-dir D:/runs/main-data `
  --name research --url https://your-provider.example/v1 --protocol chat-completions `
  --models your-model --default-model your-model --key-env MODEL_API_KEY
scievolve gateway test GATEWAY_ID --engine main --data-dir D:/runs/main-data `
  --model your-model --harness pi
scievolve run start D:/research/workflow.json D:/research/task.txt `
  --engine main --data-dir D:/runs/main-data --gateway GATEWAY_ID `
  --model your-model --harness pi
```

Workflows must pass main validation; Git-on configurations normalize to v3. `--model` and `--harness` can override roles together. URLs, model names, and IDs above are placeholders; they do not provision models or fabricate successful probes. Git-on creates and pushes real GitHub repositories and PRs: check repository name, visibility, and account permissions before starting. Gateway tests and runs call real models and may incur charges.

### Reasoning options

The basic configuration uses the provider's default reasoning policy. If a workflow specifies `gatewayReasoningOption`, pass the corresponding mapping through `--reasoning-file` when adding the gateway. For a model that supports Chat Completions `reasoning_effort: high`, save this as `reasoning.json` and replace the model ID:

```json
{
  "your-model": {
    "parameter": "reasoning_effort",
    "options": [{ "id": "high", "label": "High", "value": "high" }]
  }
}
```

```powershell
scievolve gateway add --data-dir D:/runs/main-data `
  --name research-high --url https://your-provider.example/v1 --protocol chat-completions `
  --models your-model --default-model your-model --key-env MODEL_API_KEY --reasoning-file reasoning.json
scievolve gateway test GATEWAY_ID --data-dir D:/runs/main-data `
  --model your-model --harness pi --reasoning-option high
```

Mapping keys are model IDs; option `id` matches the Agent's `gatewayReasoningOption`; `value` is accepted by the provider. Supported parameter paths are `reasoning_effort`, `reasoning.effort`, `chat_template_kwargs.reasoning_effort`, and `thinking.effort`. Choose the provider's actual protocol. Retest whenever the model, Harness, or reasoning option changes.

The software example uses `high`. Passing both `--model` and `--harness` overrides role models and Harnesses while preserving reasoning selections.

### Per-Agent gateway bindings

Put deployment choices in a separate bindings JSON when Agents use different gateways:

```json
{ "defaultGatewayId": "gateway-id", "agents": { "review": "other-gateway-id" } }
```

Use `--gateway-bindings D:/research/bindings.json` instead of `--gateway`; the options are mutually exclusive. All Agents require an explicit model route. Unknown Agents or empty IDs are rejected. Bindings do not import Web credentials. Codex can also select a registered native-login alias, as described below.

### Codex native OAuth login

Log in through Codex's own login flow first. `gh auth login` authenticates a separate GitHub account, not the model. Register directory aliases, not tokens, in the deployment file:

```json
{ "nativeCodexProfiles": { "login": "C:/Users/YOU/.codex" } }
```

```powershell
scievolve run start D:/research/workflow.json D:/research/task.txt `
  --data-dir D:/runs/new-native-data --runtime-config D:/research/deployment.json `
  --native-codex-profile login --harness codex --model YOUR_AVAILABLE_MODEL
```

`--native-codex-profile` is mutually exclusive with `--gateway` and `--gateway-bindings`. For mixed routes, bindings can contain `{ "defaultGatewayId": "gateway-id", "agents": { "main": { "nativeCodexProfileId": "login" } } }`. Use `{ "defaultNativeCodexProfileId": "login" }` for all-Codex native routing. Only Codex supports this route; it cannot use gateway reasoning options and does not belong in workflow JSON.

In the API, configure `createResearchSdk({ dataDir, nativeCodexProfiles: { login: absoluteHome } })`, then start with `gatewayBindings: { defaultNativeCodexProfileId: 'login' }`. The directory alias is fixed in the data directory. Reopening requires the original deployment mapping; recovery cannot switch to another login directory.

The SDK does not read or copy `auth.json` or edit `config.toml`. Codex manages authentication and normal refresh. Routing explicitly chooses the official `openai` provider, rather than a custom CCSwitch relay. Ordinary exec isolates user configuration. The resident app-server currently lacks the same isolation option and reads preferences from the trusted login directory, while explicitly overriding provider, MCP, permissions, and automatic multi-Agent/plugin capabilities.

Unsupported formats are rejected. OAuth tokens are not treated as API keys, and no gateway test is fabricated. Native routing bypasses the gateway proxy and currently lacks its equivalent per-request token ledger. Missing or zero statistics do not mean free calls; use the native service's billing and quota information. Protocol usage facts and the gateway request ledger are distinct.

### Read-only import of Harness API-key configuration

Explicit import can reuse an existing URL and API key:

```powershell
scievolve gateway import --engine main --data-dir D:/runs/main-data `
  --harness codex --model your-model --source profile --profile-path D:/profiles/codex
scievolve gateway import --engine main --data-dir D:/runs/main-data `
  --harness pi --model your-model --source env
```

Codex, pi, DSH, and Claude Code support env/profile imports; `--source` is mandatory. Environment import reads `SDK_CODEX_*`, `SDK_PI_*`, `SDK_DSH_*`, or `SDK_CLAUDE_CODE_*`. `_BASE_URL` and `_API_KEY` are required; `_PROTOCOL`, `_CONTEXT_WINDOW`, and `_REASONING_JSON` / `_REASONING_FILE` are optional. Profile import accepts an absolute `--profile-path`; otherwise existing `SDK_*_PROFILE` / native-directory discovery applies.

There is no fallback between sources. Import does not change config/auth, CCSwitch, or login state, and does not execute credential shell helpers. It is a one-time copy, not a live binding: the key is saved in private runtime gateway files. Protect the data directory and exclude it from Git and shared material. When configuration or credentials change, explicitly reimport and use the new gateway ID.

Import does not probe models or claim validation. Run `gateway test` before binding the returned ID. OAuth-only profiles are rejected by gateway import; use the separate native route above.

Hermes supports explicit `--harness hermes --source env`, reading `OPENAI_BASE_URL` / `OPENAI_API_KEY`, without reading personal Hermes profiles or OAuth. See [Hermes](hermes.md).

## GitHub authentication and Git collaboration

The default SDK supports personal Git-on repositories, Git operations, PRs, and result delivery using host-provided credentials. **No Web OAuth App, Client ID, Client Secret, or Callback URL is required.** Web/Server uses a deployment-owned OAuth App and browser account library; the public SDK uses the routes below. A Web accountId cannot bind SDK credentials.

Git-off needs no SDK GitHub credentials. Git-on uses the same user credential for HTTPS Git transport and the GitHub API. An SSH key or a successful manual clone does not establish API authorization for repository creation or PRs. GitHub user credentials are separate from model API keys and Codex native login.

### Token environment variable

This section uses a classic PAT with `repo` scope. In the GitHub account that will run the project, open **Settings → Developer settings → Personal access tokens → Tokens (classic)**, choose an expiry, and select `repo`. See [GitHub's instructions](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) and [repository creation API permissions](https://docs.github.com/en/rest/repos/repos#create-a-repository-for-the-authenticated-user). Fine-grained tokens use a different permissions model; independently verify repository creation, contents, and PR permissions rather than applying classic-scope steps.

Inject the token through a credential manager or a plaintext file outside the repository, for example:

```bash
export SCIENCEEVOLVE_GIT_TOKEN="$(cat /absolute/path/to/github-token.txt)"
```

```powershell
$env:SCIENCEEVOLVE_GIT_TOKEN = (Get-Content -Raw 'D:/secrets/github-token.txt').Trim()
```

Create `runtime.json` containing only the environment variable's name:

```json
{
  "git": {
    "tokenEnv": "SCIENCEEVOLVE_GIT_TOKEN"
  }
}
```

If using `GITHUB_TOKEN`, set tokenEnv to that name. The SDK does not automatically read it or a Web `.env`; without tokenEnv it tries the Git credential helper. Never put tokens in workflows, runtime JSON, requirements, or command arguments. Keep the original `--runtime-config` for startup and recovery and ensure the launch process can still access the credential.

### GitHub identity and permission preflight

This script checks only `/user` for the classic-PAT route. It creates no repository, starts no model, and prints no token. Save as `check-github.mjs` and run `node check-github.mjs` in the terminal where the variable is set:

```js
const token = process.env.SCIENCEEVOLVE_GIT_TOKEN?.trim();
if (!token) throw new Error('SCIENCEEVOLVE_GIT_TOKEN is missing or empty');
const response = await fetch('https://api.github.com/user', {
  headers: {
    Authorization: 'Bearer ' + token,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'ScienceEvolve-credential-check'
  },
  signal: AbortSignal.timeout(15000)
});
if (!response.ok) throw new Error('GitHub identity check failed, HTTP ' + response.status);
const scopes = (response.headers.get('x-oauth-scopes') ?? '')
  .split(',').map(value => value.trim().toLowerCase());
if (!scopes.includes('repo')) throw new Error('This classic PAT route requires repo scope');
const { login, id } = await response.json();
console.log(JSON.stringify({ login, id, repoScope: true }));
```

Expected output is the intended account's `login`, numeric `id`, and `repoScope: true`. This checks identity, network access, and classic scope; actual tasks establish repository and PR outcomes. To pin identity, configure optional `git.expectedIdentity: { id, login }` using this real output. Otherwise omit expectedIdentity entirely; never copy an example account or numeric ID.

### Git credential helper

An installed HTTPS helper can provide a user token. With GitHub CLI, run as the same system user that launches the SDK:

```sh
gh auth login --hostname github.com --git-protocol https --web --scopes repo
gh auth setup-git --hostname github.com
gh auth status --hostname github.com
gh api user --jq '{login: .login, id: .id}'
```

GitHub CLI uses its own registered application, so users need not create another OAuth App. See [gh auth login](https://cli.github.com/manual/gh_auth_login) and [gh auth setup-git](https://cli.github.com/manual/gh_auth_setup-git). These commands configure the Git helper using saved login state. Setting temporary `GH_TOKEN` for gh alone does not establish SDK credentials; use explicit tokenEnv for environment tokens.

Leave tokenEnv unset with this route. The SDK obtains a token through HTTPS `git credential fill`; noninteractive calls cannot open a login prompt. A successful `gh auth status` still requires setup-git and a helper available to the SDK's actual system user and environment.

### Prepare the workflow and start

Start from the packaged [Git-on v3 workflow](../examples/main-runtime/workflow.json). Set each Agent's actual gateway model and an unused personal repository name. Keep the v3 collaboration structure. Shared-directory research examples cannot retain their file protocol by merely enabling Git.

Configure and test the model first in **the same data directory**. For tokenEnv, start with:

```powershell
scievolve workflow validate D:/research/git-workflow.json
scievolve start D:/research/git-workflow.json D:/research/task.txt `
  --data-dir D:/runs/main-data --gateway GATEWAY_ID `
  --workspace D:/research/project --runtime-config D:/research/runtime.json
```

Git-on creates repositories and operates on PRs in the authorized account's personal namespace. Recovery uses the same data directory, run ID, and runtime-config; credentials must remain valid. Configuration, identity preflight, and offline validation do not create repositories early.

### Node API credentials

The Node API can load the same tokenEnv deployment file:

```js
import { createResearchSdk, loadMainRuntimeConfig, loadWorkflowConfig } from '@scienceevolve/sdk';
const deployment = await loadMainRuntimeConfig('/absolute/path/to/runtime.json');
const sdk = await createResearchSdk({ ...deployment, dataDir: '/absolute/path/to/new-main-data' });
try {
  const run = await sdk.start({
    title: 'Git collaboration task', requirement: 'Describe the authorized task and acceptance criteria',
    workflow: await loadWorkflowConfig('/absolute/path/to/git-workflow.json'),
    workspace: '/absolute/path/to/your-project',
    gatewayBindings: { defaultGatewayId: 'ACTUAL_TESTED_GATEWAY_ID' }
  });
  for await (const event of run.events()) console.log(event);
  console.log((await run.wait()).status);
} finally { await sdk.close(); }
```

Alternatively, provide `git.credentialResolver` to `createResearchSdk()`, returning `{ token, requestedScopes: ['repo'] }`. This scope declares what the SDK requests; it grants no extra token permissions. The user or host must provide actual authorization. Do not fabricate gateway or GitHub identities in workflows.

### GitHub troubleshooting

| Error or symptom | Check |
| --- | --- |
| Empty token variable / credential could not be resolved | Set the variable in the actual launch terminal; check tokenEnv and runtime-config. Changing only the Web `.env` has no effect. |
| credential helper did not return a credential | Complete HTTPS login and helper setup. SSH alone or a temporary token only for gh does not establish a usable helper. |
| 401 | Check whether the token is invalid, expired, or revoked; replace it. |
| 403 / missing repo scope | Check classic PAT scope, account restrictions, and operation permissions; verify fine-grained permissions separately. |
| identity does not match | Check expectedIdentity's real numeric ID. Changing the login name does not change the GitHub numeric identity. |
| Repository name occupied / invalid creation parameters | Choose a valid unused name in the personal namespace. |
| Model login works but Git fails | Configure model and GitHub credentials separately. Codex OAuth does not authorize GitHub repository creation or PRs. |

## Runtime configuration

Agent scripts use the host's launch environment. Old `agents.<name>.proxy` fields are removed during normalization. Configure network requirements in the host instead of using per-Agent direct/inherit policies.

### Existing workspace

A main-valid workflow can work with an existing directory; Git mode determines execution and delivery:

```powershell
scievolve start D:/research/workflow.json D:/research/task.txt `
  --data-dir D:/runs/main-data --gateway GATEWAY_ID --workspace D:/research/project
```

CLI `--workspace` accepts paths relative to the launch directory. API `sdk.start({ title, requirement, workflow, gatewayBindings, workspace: absoluteProjectPath })` requires an absolute path. The directory must exist, remain separate from the dedicated data directory, with neither directory containing the other. The binding persists across rounds and recovery.

Git-off edits that directory directly. Git-on snapshots current safe files, executes in isolated worktrees, and writes integrated main changes back after formal completion. Serial/parallel worktree policy is unchanged. The original `.git`, HEAD, index, and hooks remain unchanged; results appear as uncommitted file changes. The SDK does not commit to the original repository or migrate its history. Omitting workspace uses an internal default. `--source-workspace` remains read-only and is mutually exclusive with workspace.

Git workspace import selects tracked and safe nonignored untracked files, or scans a non-Git directory. It excludes management paths, dependencies, and known credentials, and rejects symlinks, submodules, and hardlinks. Limits: 5,000 files, 32 MiB each, 256 MiB total. Check source-embedded secrets yourself.

Before delivery, original file fingerprints are checked. Conflicts stop overwrites and preserve results. `snapshot.workspaceDelivery` reports synced/conflict/failed, commit, and conflicting files. `wait()` does not treat failed write-back as successful delivery. Resolve conflicts and use `scievolve run sync-workspace RUN_ID --data-dir DATA` or `run.syncWorkspace()`; no force mode exists. Failure may leave some safe writes completed; journals/backups remain and retries recognize completed work. Do not edit files concurrently during write-back. Remove a stale `.scienceevolve-sdk-delivery.lock` only after confirming its process stopped.

Existing Git-off `Memory.md` is preserved and must be a regular file. Main's reconfiguration proposal lives at `<workspace>/.scienceevolve/management/<projectId>/proposal/workflow.json`, preserving drafts and the root configuration across calls. Edit the injected proposal path. `apply_workflow path:"workflow.json"` is a logical alias, not an overwrite of the user's root file.

Enable `orchestration.allowMainReconfiguration` before running if needed. Authorized Main may submit the current proposal's allowed Agent and orchestration fields through `apply_workflow`. `editableFields`, `lockedRuntime`, and kernel validation define the actual scope. Permissions, credentials, session persistence, and reasoning options remain locked. Accepted Project Skill/MCP definitions cannot be rewritten, replaced, or removed under the same name; add a new name and update references. Accepted configurations follow session-continuity rules.

### Read-only source import (Git-on)

```powershell
scievolve run start D:/research/workflow.json D:/research/task.txt `
  --engine main --data-dir D:/runs/main-data --gateway GATEWAY_ID `
  --source-workspace D:/research/source-repository
```

Git sources default to tracked working-tree files, including their uncommitted contents, without importing history, `.git`, or hooks or changing HEAD/index/config. For non-Git sources, add `--source-files D:/research/files.json`, such as `["README.md", "src/code.py"]`; Git sources may also use it to narrow selection. `--source-files` requires source-workspace. Source paths must be absolute and separate from the data directory.

Unlike in-place workspace execution, Agents still run in controlled worktrees. The snapshot is saved at creation; retries and recovery do not reread source. Secrets, dependencies, management paths, and linked files are rejected. See [source workspace import](main-runtime-migration.md#source-workspace-import) for limits, GitHub publication risks, and delivery location.

### Deployment JSON

Optionally pass `--runtime-config D:/research/deployment.json`:

```json
{
  "execution": { "agentConcurrency": 2 },
  "timeouts": { "residentModelInactivityTimeoutMs": 1200000 },
  "git": {
    "tokenEnv": "SCIENCEEVOLVE_GIT_TOKEN"
  }
}
```

Paths resolve from the deployment file's directory. Without harnesses, kernel discovery and packaged pi apply. Only native executable or JavaScript CLI paths are supported, not old `{ executable, args }` objects or Windows shell wrappers. Fields such as dataDir, runnerOptions, internal, controlBridgeFactory, and raw tokens/API keys are rejected.

Numbers are strictly validated; strings are not coerced. Timeouts must be positive integers within Node's timer limit; retryBaseMs cannot exceed effective retryMaxMs. Invalid configuration is rejected before run-directory creation.

execution supports retryBaseMs, retryMaxMs, agentConcurrency, interruptForceTimeoutMs, agentActivityIdleWindowMs, and agentToolActivityIdleWindowMs. timeouts supports residentModelInactivityTimeoutMs, residentToolInactivityTimeoutMs, protocolProxyTimeoutMs, dshHandshakeTimeoutMs, and dshTurnIdleTimeoutMs.

Without tokenEnv, Git uses main's credential helper, with no Web OAuth login or accountId mapping. tokenEnv names a variable read for each Git API/transport use, allowing in-process rotation. Optional expectedIdentity must use the real numeric ID and login from preflight, or be omitted. Configuration and output contain no token. The API equivalent is `loadMainRuntimeConfig()`. Programmatic Harness/Skill paths must be absolute; an in-memory credentialResolver is supported.

## Stop, recovery, and results

```powershell
scievolve run resume RUN_ID --engine main --data-dir D:/runs/main-data
scievolve run retry-git RUN_ID --engine main --data-dir D:/runs/main-data
scievolve run events RUN_ID --engine main --data-dir D:/runs/main-data --after-seq 42
scievolve run export RUN_ID --engine main --data-dir D:/runs/main-data --output D:/deliveries/new-result
```

- Git-on `run cancel` is main F13 **recoverable Stop**. Confirmed native Stop leaves paused / collaboration:user-cancelled and retains execution/session/Git state, rather than fabricating terminal cancellation.
- Git-off `run cancel` remains terminal cancellation. Ctrl+C/SIGTERM requests safe pause.
- `run pause` follows safe-point rules and may wait for the current turn; it does not forcibly kill processes.
- A signal during initialization/recovery waits for safe open and close, skipping a command that has not started. For an active command, the signal is latched and Stop is requested once a RunHandle exists. Initialization has no artificial overall timeout.
- Repeated signals do not force-kill. The resume command prints only after confirmed close and lock release, including engine, absolute dataDir, and original runtime-config. Failed Stop does not print a misleading success message.
- JSON Lines retain engine: main, native event.type, sourceType, seq, and epoch. Use run.result / wait status, not the old project.completed event, to judge completion.
- Exit codes: completed work or explicitly successful pause/Stop: 0; unsuccessful task/probe: 2; successful pause/probe cancellation due to a signal: 130; argument/operation errors: 1.

Send Ctrl+C to the active foreground process. Another `run pause/cancel` process cannot bypass the single-host lock. There is no daemon or cross-process control API. Confirm the old process stopped before manually recovering a crash/power-loss lock.

`run export` exports only the integrated main commit of a completed Git task. Its parent must exist and its destination must be a new directory outside runtime data. It does not overwrite workspaces or include `.git`, runtime logs, or unmerged changes. Text and binary bytes are preserved; the result includes commit and file/byte counts. Export does not run Git filters, download LFS, or contact GitHub.

Limits are 5,000 files, 32 MiB per file, 256 MiB total. Symlinks, submodules, and nonportable paths are rejected. Ctrl+C cancels only the export, not the task. Failed exports leave partial output for inspection; retry into another new directory.

## Current boundaries

The default entry supports API-key env/profile import, explicit Codex OAuth, and workspace binding: Git-off edits in place; Git-on imports safe source, executes in isolation, and writes back after completion.

Repository examples no longer use old gatewaySource / reasoningEffort fields. Models and Harnesses are retained; deploy reasoning through an actual gateway or trusted native profile. User-owned old configurations still require explicit migration. Git-off Loop/Evolver has been tested against the actual main kernel. Unsupported input is rejected rather than silently switching directories or fabricating gatewaySnapshot.

Shared patches fix Git authorization checkpoints and source MCP; see [migration](main-runtime-migration.md). Unit/package smoke tests use simulated model/providers, separate from real-model records. A single real Windows task does not establish the four-Harness or Linux/macOS matrix. Strict non-yolo Git-on file brokerage currently supports Windows/Linux and explicitly rejects macOS. Git-off accepts workspace binding. Legacy has been removed; old data needs an older release.

Historical records: [API-key profile / Loop](main-profile-loop-test-report-20261005.md), [native OAuth / Git-on Evolver / default entry](main-oauth-git-evolver-default-test-report-20261005.md), and [2026-10-06 workspace acceptance](workspace-main-acceptance-20261006-zh.md) are retained in Chinese. Claude Code was excluded from that last round at the user's request. Ordinary workspace calls can read current Inbox/Memory in chunks with `scienceevolve_read_invocation_input`; it accepts no arbitrary file path and does not grant shell access.
