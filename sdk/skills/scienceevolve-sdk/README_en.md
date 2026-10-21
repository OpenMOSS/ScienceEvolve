# ScienceEvolve workflow authoring and execution

[← Back to SDK README](../../README.md) · **English** | [简体中文](SKILL.md)

This is the English reading companion to the packaged configuration-authoring Skill. Install the entire scienceevolve-sdk directory, including its canonical SKILL.md, references, and assets. This page does not introduce another runtime Skill.

Deliver a valid workflow.json, UTF-8 requirement.txt, and complete startup command. Configuration-only requests do not authorize paid tasks. When execution is requested, verify actual run and delivery evidence. Use existing fields; do not invent steps, dependsOn, or maxSteps.

## Start directly from workflow.json

```sh
scievolve workflow validate ./workflow.json
scievolve start ./workflow.json ./requirement.txt \
  --data-dir /absolute/path/to/new-main-data \
  --workspace /absolute/path/to/your-project \
  --gateway-bindings /absolute/path/to/bindings.json
```

start and run start are equivalent and accept a workflow without import/registration. Validation is offline. Startup requires Node.js 24+, a working Harness, and explicit deployment bindings, e.g. `{ "defaultGatewayId":"ACTUAL_GATEWAY_ID" }`, not secrets. Configure/import and test all real routes first; see [deployment/API](references/usage-en.md). JSON and requirement paths resolve from cwd; dataDir is absolute.

The default entry uses main; project examples and the [template](assets/workflow.json) are migrated. CLI workspace and API start.workspace are supported. Legacy is removed; old gatewaySource and run data cannot be passed directly to the current version.

## From requirements to configuration

1. Distinguish the **Task** from the **research workflow**. Task is the object optimized and its feedback; workflow makes research decisions. Agents inside a Task do not necessarily require extra workflow nodes. MetaHarness evolves Task harnesses; co-scientist evolves hypotheses. Ordinary single-level iteration keeps allowMainReconfiguration false. Enable Evolver only to change the research process itself.
2. Define goals, inputs, editable scope, actual tools/models, budget, acceptance evidence, and stop conditions. Batch maxIterations is not total budget. Preserve user choices and independent model-family reviews.
3. Read the [workflow contract](references/workflow-en.md). Explicitly choose shared-directory Git-off v2 or isolated Git-on v3; main does not imply Git-on. Existing methods sharing Python state, candidate pools, or Task Git use Git-off. Migrating to v3 requires redesigned handoffs.
4. Divide roles with input/action/output/failure/handoff rules consistent with instructions, routes, decisionPlans, and termination. Copy the full named-method directory, preserving relative Skills and upstream assets, not JSON alone.
5. Set actual model, Harness, permissions, and explicit capability lists. Scripts use the host launch environment. Omit proxy in new workflows; old fields normalize away. Deploy networking in the host.
6. Bind authentication through deployment. gatewayReasoningOption requires actual model mapping and exact probes. Old reasoningEffort normalizes away. Codex native OAuth needs no API key but excludes gateway reasoning options; native Git-off exec does not inherit user reasoning config. Do not claim it preserves high/xhigh.
7. Specify input paths/manifests in requirements. Git-off workspace edits the original directory; omission uses an internal shared directory. Later roles/recovery reuse it. API paths are absolute; CLI paths resolve from cwd. Directory must exist, be real, and not overlap dataDir. Git-on snapshots current files, executes in isolation, and writes back completed integrated work, preserving original history/index. Conflicts require explicit sync-workspace after resolution. sourceWorkspace is mutually exclusive read-only import, without automatic write-back. Old run data is not source seed material.

dataDir stores runtime state, not business workspace. Edit only the injected proposal path. External Git-off uses `.scienceevolve/management/<projectId>/proposal/workflow.json` and preserves drafts/root configuration. apply_workflow path workflow.json is a logical alias. Accepted Project Skill/MCP definitions remain immutable; add new names and update references for content changes.

Codex Git-off workspace can run shell. Claude Code workspace has read-only/native and injected file tools without Bash; use compute or task-necessary yolo for scripts. Do not assume non-yolo resident Git-on has a native shell. Prompts cannot supply missing capability.

## Scientific-method fidelity

A named method is either implemented under its verified boundary or recorded as TODO. Pin upstream first and check stages, branches, candidate counts, loops, selection/ranking algorithms, review, failures, termination, and required tools. Missing method elements remain TODO, rather than a simplified placeholder advertised as complete. Prefer an available newer version over adding an older one.

Equivalent model/Harness/tool/session implementations are allowed with a recorded mapping: upstream capability → workflow/Skill/tool → actual inputs/outputs → validation. Reuse atomic algorithms, without black-box launching another entire autonomous system. External data, GPUs, knowledge services, and wet-lab tools are runtime prerequisites; missing resources are blockers, not permission to substitute chat or simulated data.

Google co-scientist may use the separately established synchronous scheduling/file-pool boundary; do not generalize that permission to other methods. Task Git rollback is not joint Agent-session rollback. Existing Git/v3 capabilities do not establish arbitrary dynamic DAG, live replanning, or external experiment rollback without verification.

## Validate, run, and recover

Validate offline, then check full Skill staging, permissions, and actual tools. Valid configuration is not an executed scientific method. Install a missing CLI from source/tarball under the README, not a guessed registry name. Record run.started.runId and judge run.result status: only completed means SDK completion. Git-on original-directory delivery additionally requires workspaceDelivery.status synced and actual artifacts/evidence.

Ctrl+C/SIGTERM requests safe pause. Wait for exit and a copyable resume command. Only one host may open a data directory; list/show/events can recover tasks. Watch foreground events. Git-off cancel is terminal; Git-on cancel is recoverable Stop. Reuse dataDir/runtime-config/run ID; do not start a new run as recovery. See [lifecycle](references/usage-en.md).

Deliver files, key routes/completion conditions, validation results, and executable commands. For real runs, include ID, final status, artifacts, and unresolved items. Simulated model/routing tests are not paper-result reproduction.
