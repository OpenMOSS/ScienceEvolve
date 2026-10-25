# Existing projects, reconfiguration, and parallel Git

[← Back to SDK README](../README.md) · **English** | [简体中文](workspace-examples.md)

These examples cover existing-project execution, workflow updates, and parallel Git collaboration on the current main engine, with Node.js 24+ and a configured gateway.

| Configuration | Scenario | Workspace |
| --- | --- | --- |
| existing-project/workflow.json | Implementation → independent audit → Main acceptance/repair | Git-off, in the selected original directory |
| workflow-reconfiguration/workflow.json | Main revises a Worker prompt and formally calls apply_workflow | Git-off, preserving root workflow.json |
| main-runtime/workflow.json | Implementation → audit with Git integration | Import original files, isolated worktrees, automatic final write-back |
| parallel-git-review/workflow.json | Two independent auditors in parallel, aggregated by a Leader | Same worktree and delivery policy |

Set actual Agent models or pass --model and --harness together. Do not add keys, URLs, or old gatewaySource fields. First add/import and test the gateway in the same dedicated data directory. Requirements should state editable scope, test commands, and acceptance criteria.

```sh
scievolve start /absolute/path/workflow.json /absolute/path/research_proposal.txt \
  --workspace /absolute/path/existing-project \
  --data-dir /absolute/path/sdk-run-data \
  --gateway GATEWAY_ID --title 'Existing project acceptance'
```

Workspace must exist and remain separate from dataDir, with neither containing the other. API paths are absolute:

```js
const workflow = await loadWorkflowConfig('/absolute/path/workflow.json');
const run = await sdk.start({ title: 'Existing project acceptance', requirement: 'Specific requirements', workflow,
  workspace: '/absolute/path/existing-project', gatewayBindings: { defaultGatewayId: gateway.id } });
const result = await run.wait();
console.log(result.status, result.workspaceDelivery);
```

Git-on needs GitHub authorization and creates/pushes actual repositories, branches, and PRs. Choose a dedicated private repositoryName first. Parallel examples need execution.agentConcurrency >= 2 in deployment. Credentials come from environment references or a trusted credentialResolver; see [CLI authentication](../docs/main-cli.md#github-authentication-and-git-collaboration). Serial examples retain isolated worktrees too.

Business instructions should cover file edits → staging/business commit → git_push → PR → merge to designated target → finish_task. git_push creates no commit; not_committed is not success. Retries reuse the same callId/arguments and preserve accepted completion receipts. Main coordinates network/mechanism recovery.

Original-directory write-back occurs only after formal Git-on completion and integration to controlled main. Agents do not modify it during execution, and the SDK does not commit/reset/pull its .git. Concurrent user edits produce conflict rather than overwrite, preserving output/backups. Resolve and explicitly run sync-workspace. Separate run export is also available; routine manual export is not required.

The reconfiguration example uses a physical proposal path under `.scienceevolve/management/<invocation>/proposal/workflow.json`; the actual Inbox is authoritative. The apply_workflow(path: "workflow.json") logical alias remains. Do not treat the original business configuration as the proposal.

Local load/simulated-kernel tests verify contracts only. The [2026-10-06 historical report](../docs/workspace-main-acceptance-20261006-zh.md) remains in Chinese. Scientific methods, external experiments, and algorithm fidelity need separate verification; generic parallel auditing is not a substitute.
