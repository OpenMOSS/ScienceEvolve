# Web / SDK parity and host boundaries

[← Back to SDK README](../README.md) · **English** | [简体中文](main-sdk-parity-zh.md)

> Historical material below preserves earlier designs and acceptance facts. The legacy engine and its API/CLI entry points have since been removed. Use the [current CLI/API guide](main-cli.md).

Host-boundary update: 2026-10-16. The SDK/CLI use the pinned main kernel, based on `6bf6a7bb5b200e92511aa4010b7d5fc3711ed79b`, including formal project status, Workflow recovery, on-demand context, and Git query/revert/delivery. See the [synchronization record](main-sync-20261016.md) for host extensions and actual validation scope. The 2026-09-26 table below is historical, including references to legacy availability.

## Current default main host boundaries

| Area | Web / Server | Standalone SDK |
| --- | --- | --- |
| Entry | Web, HTTP, SSE, visual canvas | Node API, CLI, asynchronous events |
| GitHub authentication | Deployment-owned OAuth App; browser account library | tokenEnv, credentialResolver, or HTTPS helper; no Web OAuth App |
| Model deployment | Gateway library and per-Agent gatewayId | Explicit gateways/gatewayBindings or host-registered nativeCodexProfiles aliases |
| Workspaces | Server-assigned project directories/worktrees | Optional workspace: shared in-place Git-off, isolated Git-on with final write-back |
| Harnesses | Codex, pi, DSH, Claude Code | Also Hermes ACP host extension |
| Materials | Web uploads and shared user_inputs | CLI/API or workflow inputs / inputDescription |
| Experiments | Server SII lifecycle and explicit experimentMcp | Optional host sii and explicit experimentMcp |
| Recommendation / Explainer | Web-host services and product MCP | Not exported as public SDK Web services |

The core owns routing, per-turn capabilities, Loops, termination, artifacts, and recovery. Hosts manage entry points, file selection, gateway bindings, and deployment paths. gatewaySource is not a current startup-workflow field; API-key env/profile import is explicit and one-time. Scripts use the host launch environment; old proxy fields normalize away.

Reconfiguration follows current editableFields / lockedRuntime. Accepted Project Skill/MCP definitions cannot be rewritten, replaced, or removed under the same name. Use a new name and update references. Data remains isolated by engine/runtimeRevision: do not directly share Web, legacy, or other-revision dataDir.

See [deployment/recovery](main-cli.md), [inputs](project-inputs.md), and [SII](sii-experiments.md).

## Historical: 2026-09-26 legacy alignment

The following records old interfaces, fields, and design requirements. It is not the current default-main usage contract.

Web/Server (historically called main) and the SDK share workflow/runtime semantics while remaining separate hosts. Entry/storage implementations can differ; core routing, authority, Loops, termination, recovery, and safety must align.

### Host differences

| Web / Server | SDK at that time | Shared semantics |
| --- | --- | --- |
| Web, HTTP, SSE | TypeScript API, CLI, async streams | Same state machine and standard events |
| Server project storage | Local dataDir storage | Idempotent recovery/migration |
| Saved gatewayId | gatewaySource=env/profile | Resolve and lock routes before calls |
| Server-controlled workspace | Caller workspace | One business workspace per project |
| Visual canvas | JSON/API/CLI | Same schema and validation |

The SDK has no Web pages; Server does not accept arbitrary caller-provided host paths. Credentials, gateway snapshots, host paths, and dataDir are not portable workflow fields.

### Shared workflow semantics

#### Main authority

Main has two control modes:

- autonomous handles initial dispatch, routing, acceptance, recovery, user input, Loop batch handoff, and reconfiguration continuation. It can select configured Workers; completion, questions, and reconfiguration depend on the current capability.
- weak-branch selects only the offered weak targets from one source Agent. It cannot ask users or reconfigure.

A finish candidate does not allow weak-branch completion; it schedules autonomous acceptance. Main and control tools share one capability snapshot across prompts, tool schemas, and validation.

Main's root orchestration policy reconstructs the task contract, evaluates dispatch value, manages dependencies/file ownership, monitors execution, checks actual artifacts/tests/logs, and integrates acceptance. Workers do not receive that root policy. Their reports index evidence; they replace neither checks nor user authorization.

#### Loop

```json
{
  "id": "refinement",
  "from": "review",
  "to": "execution",
  "maxIterations": 3,
  "exitTo": "main"
}
```

to is entry, from is tail, maxIterations is batch size, exitTo is the exhausted-batch target. State stores batch iteration, batch number, and total. Pause, recovery, retry, and ordinary reconfiguration do not reset them. Returning to autonomous Main does not bypass original termination.

The canvas creates no Loop node: from → to is the real strong return edge; from → exitTo is a read-only dashed exit. Edit ID, batch size, and exit on the return edge; runtime displays batch/iteration/total. Delete a Loop explicitly before a rename/deletion breaks it. SDK JSON/API/CLI use the same structure.

#### Shared workspace and artifacts

New project Agents share a business workspace and Memory.md, while identity, sessions, logs, and invocation-temporary directories stay isolated. Old <agent>/shared files remain in place with compatibility read fallbacks, without merging or overwriting.

publish_artifact formally registers output rather than moving files between Agents. Records bind size, mtime, producer, invocation, media type, and SHA-256; preview/read/download revalidate. Modified files fail integrity until republished. Old unhashed records remain legacy/unverified.

#### Advanced reconfiguration (historical contract)

allowMainReconfiguration defaults false, enabled by users before runtime. Only autonomous Main with current capability sees apply_workflow; Main cannot change the switch.

The historical editable list included ordinary Agents, input/routing/decision plans, Loops, termination/results/intervention policy; instructions/model/harness/proxy/Skills/autoSkills/MCP; Web gatewayId or old SDK gatewaySource; and Project Skill/stdio-MCP definitions/versions/assignments. **Current limits are narrower in places:** proxy normalizes away, gatewaySource is not deployment binding, and accepted definitions are immutable. Use [the current workflow reference](../skills/scienceevolve-sdk/references/workflow-en.md#main-reconfiguration).

Locked fields included schema/project/base hash, authorization and generated editing instructions, permissions/Web Search/persistence/weak-edge decision ownership, Harness/Gateway reasoning, credentials, runtime snapshots, host paths, and deployment policy.

Whole proposals pass fields/references/topology/Harness/gateway checks before atomic journal commit. Stale base hashes and validation failures cannot partially overwrite state. Successful application refreshes affected sessions under continuity rules.

#### Termination, networking, and reasoning (historical)

- termination.automatic=false delegates final acceptance to Main.
- A non-Main terminal Agent completes only with automatic=true in a valid terminal context, without gaining general dispatch/input/reconfiguration authority.
- The historical proxy.mode direct/inherit policy controlled Agent Bash/script networking only, not model/gateway transport. Current main removes this field and uses host networking.
- Gateway/model reasoning maps parameter paths to options: reasoning_effort, reasoning.effort, chat_template_kwargs.reasoning_effort, thinking.effort. Agents select IDs; omission injects nothing. Changes invalidate fingerprints and previous probes.

#### Shared runtime protections

- Model and individual tool activity windows are separate. Structured events/actual progress renew them; stdout/keepalive cannot extend indefinitely.
- Tokens are counted by provider-request usageId. Unknown stays unknown, not zero; later known usage repairs without double counting.
- Recovery context is injected only for genuine resume/replacement with idempotency markers, not new sessions.
- Nonpersistent Codex Workers disable host Goals; persistent Main follows product policy.
- Harness adapters handle executables, native parameters/session IDs, and shallow official-event mapping. Shared layers own authority, timeout, tokens, artifacts, and recovery.

### Compatibility and synchronization rules

- Missing old Loop/Project Skill/MCP/proxy/ledger fields use safe defaults. Historical compatibility does not restore removed current APIs.
- Old pending Main migrates to weak-branch only when multiple weak choices are confirmed; otherwise autonomous. Migrations are repeatable without duplicate counts or data deletion.
- Shared contracts, Main policy, and golden vectors align across hosts. Deterministic tests compare call order, capability, Loop/termination outcomes, and key state.
- Change shared core/golden vectors first, then both host integrations; do not copy business fixes into an individual Harness adapter.
