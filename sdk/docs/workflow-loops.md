# Configurable Loop groups

[← Back to SDK README](../README.md) · **English** | [简体中文](workflow-loops-zh.md)

`orchestration.loops` defines groups of ordinary Agents and iterations per batch, executed by the SDK scheduler. After a batch, control passes to the configured exit target, commonly Main. If the task is unfinished, Main can route directly back to the entry to start another batch. Project completion still follows `termination` and control tools; batch completion is not project completion.

```json
{
  "loops": [
    {
      "id": "refinement",
      "from": "assess",
      "to": "revise",
      "maxIterations": 3,
      "exitTo": "main"
    }
  ]
}
```

Place this object inside `orchestration`. `to` is the entry and `from` is the tail; other members follow the deterministic path between them. This example uses strong routes `revise → measure → assess → revise`.

```text
[revise → measure → assess] × 3 → Main
             ↑                    │
             └── unfinished: new batch ────┤
                                  └── original completion criteria met: finish
```

Main continues with `route_to_agent(target="revise")`. No new ID, iteration change, or user confirmation is needed merely to continue, and dynamic reconfiguration need not be enabled. Starting at `measure` can run a `measure → assess` baseline before the first batch. Starting at `revise` begins and counts the first iteration directly.

## Configuration constraints

| Field | Meaning |
| --- | --- |
| `id` | Stable unique project ID; starts with a letter, then letters/digits/`_`/`-`, up to 64 characters. |
| `to` | Entry Agent; returning here from Main starts a new batch. |
| `from` | Tail Agent; its unique strong route must point to `to`. |
| `maxIterations` | Integer from 1 to 1,000,000 per batch, not a project-wide limit. |
| `exitTo` | Target after the batch, usually `main` or another Worker outside the group. |

Each member must have one strong route, reaching the tail from the entry without passing through Main. The tail cannot also be the terminal Agent. The exit must be outside. Groups cannot share members or entries; nested Loops and internal weak branches are unsupported. Workflows without Loop groups retain existing behavior.

## Batches and recovery

- `(await run.snapshot()).loopIterations[id]`: iterations started in the current batch.
- `loopBatches[id]`: batch number started.
- `loopTotalIterations[id]`: total iterations started, for auditing and evidence numbering, not completion.
- Explicit Main routing to the entry increments the batch, restarts its iteration at one, and preserves the total. This also applies after intervention or recovery; resuming an already queued call does not reset it.
- Pause, restart, model retry, and `apply_workflow` do not themselves reset counters. Failed commits roll back counters and the next hop together.
- Ordinary routing into the entry from outside also starts a batch. Tail-to-entry increments within the current batch; exhaustion routes to `exitTo`.
- Events are `workflow.loop.batch.started`, `workflow.loop.iteration`, and `workflow.loop.exhausted`. Exhaustion means the batch finished, not the project.
- Agent inboxes include batch, iteration, total, and configuration. Number evidence files by total iterations to avoid overwriting earlier batches.

Authorized dynamic reconfiguration can change maxIterations while preserving counters; subsequent scheduling uses the new value. Continuing the next batch requires no reconfiguration.

`exitTo: "main"` hands off with reason `loop-limit`. Existing termination permissions remain: if a different terminal Agent is configured, exhaustion does not bypass its evaluation. Existing intervention and recovery rules apply.

## Start through the CLI

Write the goal and constraints in a natural-language requirement file and select an existing workspace:

```bash
scievolve run start /absolute/path/workflow.json /absolute/path/research_proposal.txt \
  --workspace /absolute/path/task-project \
  --data-dir /absolute/path/run-data --gateway GATEWAY_ID
```

First configure and test the model, Harness, and reasoning option in the same data directory; see [gateway deployment](main-cli.md#deployment-and-startup).

The source example `example/01-ahe-evolve/` gives the first `execute` Agent preparation instructions: run existing task code in the selected workspace, save the initial snapshot, and evaluate a baseline. Subsequent execution follows `execute → judge → optimizer → execute`. Agents perform snapshots and scoring under their instructions; the scheduler deterministically controls routing, batch counts, and Main handoff.

In Node, use `sdk.start({ ..., workspace: '/absolute/path/task-project' })`. Prepare code/data there before startup; external references can also use `inputs`.
