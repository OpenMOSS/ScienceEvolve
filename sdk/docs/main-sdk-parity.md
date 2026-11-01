# Web / SDK parity and host boundaries

[← Back to README](../README.md) · **English** | [简体中文](main-sdk-parity-zh.md)

Source updated: 2026-10-30

ScienceEvolve Web / Server (`main` below) and the default `@scienceevolve/sdk` share workflow core rules, with Web and Node API/CLI hosts respectively. The actual shared core is byte-identical, including optional trusted host interfaces. SDK-owned Hermes code lives outside that core. The SDK records the main Git baseline plus exact working-tree source hashes. The dated [one-way sync record](main-sync-20261030.md) is historical; use the exact-source manifest when checking parity. Host features remain independent. The old `/legacy` engine is outside this guide's current entry points.

## Host differences

| Web / Server | SDK | Shared semantics |
| :--- | :--- | :--- |
| Web, HTTP, SSE | TypeScript API, CLI, asynchronous event stream | Same state machine and standard events |
| Server-side Project storage | Local `dataDir` storage | Idempotent recovery and migration |
| Deployment owner configures an OAuth App; users authorize through the Web account library | Host supplies `tokenEnv`, `credentialResolver`, or an HTTPS Git credential helper | Git and API operations use the project's bound GitHub user credentials |
| Select a saved `gatewayId` | Gateway library and explicit `gatewayBindings`, or deployment-provided native Codex aliases | Resolve and lock the model route before invocation |
| Server allocates project directories and Git worktrees | Caller may supply `workspace`; Git execution is isolated and delivers back to the original directory | Host validates working directories, inputs, and delivery |
| Visual Workflow canvas | JSON, API, CLI | Same Workflow schema and validation rules |
| Codex, pi, DSH, Claude Code | Also supports the SDK host extension Hermes Harness | Shared scheduling and per-turn capability checks |

The SDK does not include Web pages. Web / Server does not accept arbitrary absolute server paths from callers. Credentials, Gateway snapshots, host paths, and `dataDir` are not portable Workflow fields. The SDK explicitly imports API-key environment/profile settings into its deployment gateway library, rather than retaining live bindings through the old workflow `gatewaySource`. See the [SDK repository](https://github.com/OpenMOSS/ScienceEvolve) for CLI/API entry points.

## Shared workflow semantics

### Main capabilities

Main has two control modes:

- `autonomous`: initial scheduling, deterministic routing, final acceptance, failure recovery, user input, Loop batch returns, and continuation after reconfiguration. It can select any configured ordinary Agent. Completion, user requests, and Workflow changes each require that turn's separate capability.
- `weak-branch`: handles multiple weak-edge candidates from one source Agent. It can select only the current candidates and cannot request user input or change the Workflow.

A `finish` candidate does not permit a weak branch to finish directly. Selecting it schedules a new autonomous final-acceptance turn; completion authority exists only in a valid terminal context. Main and Control tools use the same capability snapshot, aligning prompts, tool schemas, and server validation.

Main's system prompt retains the root orchestration policy: reconstruct the objective contract, assess whether delegation is worthwhile, manage dependencies and file-write ownership, monitor execution, verify actual artifacts/tests/logs, and integrate delivery. Workers do not receive that root policy. Their reports index evidence and do not replace inspection or expand user authorization.

### Loops

```json
{
  "id": "refinement",
  "from": "review",
  "to": "execution",
  "maxIterations": 3,
  "exitTo": "main"
}
```

`to` is the loop entry, `from` its tail, `maxIterations` the iterations per batch, and `exitTo` the destination when the batch is exhausted. Runtime state separately records the current batch's iteration count, batch number, and cumulative iterations. Pause, recovery, failure retry, and ordinary reconfiguration do not reset these counters. Returning to Main after batch exhaustion invokes autonomous scheduling without bypassing termination conditions.

The Web canvas does not create Loop nodes. Closing a valid strong-edge cycle generates an explicit `orchestration.loops[]` entry; the closing edge becomes the `from -> to` return edge. Strong edges within a Loop share a color; different Loops use different colors. Select any member edge to edit the Loop ID, batch size, and exit destination. The `from -> exitTo` exit edge remains a read-only dashed line. Breaking the cycle removes the Loop configuration; invalid cycles are rejected and renaming updates references. The running view shows batch, iteration, and total. SDK workflows configure the same structure explicitly through JSON/API/CLI.

### Shared workspace and artifacts

Without Git, Agents share the business workspace and `Memory.md`. Git projects use controlled worktrees, publication, and integration under the collaboration rules. Shared inputs are separate from Git worktrees and formal artifact publication. Agent identities, sessions, logs, and invocation temporary directories remain isolated. Historical `<agent>/shared/` files stay in place without merging or overwriting; reads retain a compatibility fallback.

`publish_artifact` formally registers a file rather than moving files between Agents. Registration binds size, mtime, producer, invocation, media type, and SHA-256. Preview, selection, reading, and download revalidate integrity. A file changed after registration produces an integrity error and must be republished by its producer. Old records without hashes remain legacy/unverified.

### Advanced dynamic reconfiguration

`orchestration.allowMainReconfiguration` defaults to `false` and must be enabled by the user before execution. When enabled, only an authorized autonomous Main turn can expose `apply_workflow`. Main cannot change the authorization switch.

Editable fields include:

- Ordinary Agent roster, input targets, routing, decision plans, Loops, termination policy, result format, and user-intervention policy.
- Agent instructions, model, Harness, configured `gatewayId`, Skills, automatic Skills, MCP, `experimentMcp`, and `decisionBy`.
- New Project Skill and Project stdio MCP definitions, and Agent resource assignments.

Accepted Project Skill/MCP definitions are immutable. Omitting one retains it; an identical definition may be resubmitted. Use a new name for changed content. Overwriting, replacing, or deleting a definition under the same name is rejected. SDK-authored launch workflows do not contain `gatewayId`; editable routes in runtime proposals follow the current snapshot.

Locked fields include:

- Schema/project/base hash, authorization switches, and server editing instructions.
- Permissions, Web Search, and session persistence policy.
- Native Harness `reasoningEffort`, Gateway reasoning mappings, and selections.
- Credentials, runtime snapshots, arbitrary host paths, and other deployment policies.

A full proposal passes field, reference, topology, Harness, and Gateway checks before an atomic commit through the invocation journal. A stale base hash or failed check never partially overwrites configuration. After acceptance, scheduling continues and later invocations read the new configuration under session-continuity rules.

### Termination, networking, and Gateway reasoning

- With `termination.automatic=false`, Main performs final acceptance.
- A non-Main terminal Agent may complete directly only with `termination.automatic=true`, a valid terminal context, and satisfied conditions. This does not grant general routing, user-intervention, or reconfiguration authority.
- Agent scripts inherit the service's shared network environment. Users and Main no longer configure proxies per Agent. Legacy proxy fields are ignored during normal reads; model protocol conversion and Gateway routing retain their infrastructure contracts.
- Gateway reasoning defines a parameter path and options per Gateway/model. Supported paths include `reasoning_effort`, `reasoning.effort`, `chat_template_kwargs.reasoning_effort`, and `thinking.effort`. Agents select an option ID; no selection injects no field. Mapping or option changes alter the fingerprint, invalidating old probe results.

### Shared runtime protections

- Model activity and each tool call have separate activity windows. Only structured model events and real tool progress renew them; ordinary stdout and keep-alive traffic cannot keep an invocation alive indefinitely.
- Token accounting uses provider-request `usageId`. Unknown usage remains unknown rather than zero. Later known usage can repair the same request without double counting.
- Recovery context is injected only on actual resume or replacement, with an idempotency marker. New sessions do not receive fabricated recovery context.
- Nonpersistent Codex Workers disable host Goals to avoid cross-invocation state leakage. Persistent Main follows the product policy.
- Harness Adapters handle executable entry points, native arguments, session IDs, and shallow mappings of official events. Main capabilities, timeouts, tokens, artifacts, and recovery belong to the shared layer.

## Configuration recommendations and Project Explainer

Configuration recommendations accept the project name, requirements, current Workflow, and advisor route, returning a complete, validated `agents + orchestration + warnings`. They use no tools, expose no credentials, modify no project, and do not start execution. Only explicit user application overwrites a form or writes a new file.

Project Explainer is a native Web-host assistant and is not exported by the default SDK. Its dedicated product MCP reads context, edits and saves drafts, undoes changes, and submits Workflow updates for existing projects. Project creation saves a draft for the user to start. Native filesystem access is read-only; Shell, Skill execution, business MCP, and Web Search are disabled. It refuses to run if those boundaries cannot be enforced. Session history persists, with at most one active turn per session.

The system computes progress from current outer Workflow nodes: the shortest distance from start to the current node divided by that distance plus the shortest distance to finish. Branches use shortest reachable paths; Loop returns may reduce progress. Each collaboration group counts as one node. Only confirmed completion displays 100%. Explainer explains progress and does not write it.

## Compatibility and synchronization

- Old workflows without Loops, Project Skill/MCP definitions, or new ledgers receive safe defaults. Legacy Agent proxy fields are ignored. Public SDK APIs, CLI commands, and event names remain available.
- Old pending Main states migrate to `weak-branch` only when multiple weak candidates can be confirmed; otherwise they become `autonomous`. Migrations are repeatable without duplicate counts or clearing existing data.
- Shared contracts, Main prompt policies, and golden test vectors remain aligned across hosts. Cross-host tests run the same deterministic Workflow and compare Agent order, Main capabilities, Loop/termination outcomes, and key state.
- Change shared core and golden vectors first, then integrate Web / Server and SDK API/CLI. Do not duplicate business fixes inside a Harness Adapter.
