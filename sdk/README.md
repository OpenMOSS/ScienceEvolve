# ScienceEvolve SDK

**English** | [简体中文](./README_zh-CN.md)

[← Back to repository README](../README.md)

Run multi-Agent research workflows from Node.js or the command line. The SDK supports review loops, Git collaboration, workflow evolution, persistent state, and recovery.

The [repository overview](https://github.com/OpenMOSS/ScienceEvolve/blob/main/README.md) covers the quick start, diagrams, 23 source workflows, and upstream acknowledgements.

## Installation and Skill

Requires **Node.js 24+**. Version 0.1.1 is currently distributed from source or a local package. From the source repository root:

```sh
npm ci
npm run install:cli
npm run pack:sdk
```

In another Node project, install the generated package as a dependency. To install only the CLI globally, use the second command instead:

```sh
npm install /absolute/scienceevolve-sdk-0.1.1.tgz
npm install -g /absolute/scienceevolve-sdk-0.1.1.tgz
```

The SDK bundles pi; install Codex, Claude Code, DSH, or [Hermes](docs/hermes.md) as needed. The [configuration-authoring Skill](skills/scienceevolve-sdk/README_en.md) ships with its references and templates. Copy its directory into the Skills directory used by your coding agent and start a new session. In an installed package it is at `node_modules/@scienceevolve/sdk/skills/scienceevolve-sdk`.

## Scientific Skills

The SDK organizes **24 general/platform Skills and 875 scientific method Skills across 12 research areas** under `general/` and `scientific/`, distilled from 70,000+ published papers. They cover hypothesis generation, research design, validation, evidence analysis, and iteration.

Add the relevant `builtin:` Skill IDs to an Agent’s `skills` or `autoSkills` in its workflow configuration. The build includes the Skills and full catalog under `assets/skills`; loading uses the existing runtime and Harness capability checks.

[Scientific Skills overview](https://github.com/OpenMOSS/ScienceEvolve#scientific-skills) · [Full catalog](https://github.com/OpenMOSS/ScienceEvolve/blob/main/.agents/skills/README.md)

The three [Agent4Sci Skills](docs/agent4sci.md) provide research, experiment execution, and on-demand checklist guidance. Select all three fixed Skill IDs for the complete flow; see the [example workflow](examples/agent4sci/workflow.json). Support files and upstream license/provenance ship with each Skill. No automatic reminders are installed.

## Configure and start

Choose a dedicated absolute `dataDir`, then [add and test a model gateway](docs/main-cli.md#deployment-and-startup) in that directory. Set each Agent's model, Harness, and reasoning option in your workflow. Use the returned gateway ID when starting:

```sh
scievolve workflow validate /absolute/workflow.json
scievolve start /absolute/workflow.json /absolute/requirement.txt --data-dir /absolute/scienceevolve-data --workspace /absolute/task-project --gateway GATEWAY_ID
```

The task directory must exist, and both it and `dataDir` must use absolute paths. The two directories must be separate, and neither may contain the other. Git-off runs directly in the task directory; Git-on uses isolated worktrees and delivers the integrated result back. Press Ctrl+C to pause, wait for shutdown, then use the printed resume command. Keep one SDK host per data directory.

## Node API

Use a workflow with its model routes already tested in the same `dataDir`:

```js
import { createResearchSdk, loadWorkflowConfig } from '@scienceevolve/sdk';

const sdk = await createResearchSdk({ dataDir: '/absolute/scienceevolve-data' });
try {
  const run = await sdk.start({
    title: 'Research task',
    requirement: 'Describe the task, inputs, and acceptance criteria.',
    workflow: await loadWorkflowConfig('/absolute/workflow.json'),
    workspace: '/absolute/task-project',
    gatewayBindings: { defaultGatewayId: 'GATEWAY_ID' }
  });
  console.log('runId', run.id);
  for await (const event of run.events()) console.log(event);
  const result = await run.wait();
  console.log(result.status, result.artifacts);
  if (result.status !== 'completed') process.exitCode = 2;
} finally {
  await sdk.close();
}
```

`wait()` also returns on pause or interruption. Use `run.snapshot()`, `pause()`, `resume()`, `addInput()`, and `respond()` to inspect and manage tasks. See the [API and lifecycle reference](skills/scienceevolve-sdk/references/usage-en.md#esm-api).

## Guides

English and Chinese guides are included in the package. Use the language links at the top of each guide.

| Task | Guide |
| --- | --- |
| Models, reasoning, native login, and deployment | [CLI guide](docs/main-cli.md) |
| Agents, routing, and dynamic reconfiguration | [Workflow reference](skills/scienceevolve-sdk/references/workflow-en.md) · [Loops](docs/workflow-loops.md) |
| GitHub and parallel collaboration | [Authentication](docs/main-cli.md#github-authentication-and-git-collaboration) · [Git-on v3 workflow](examples/main-runtime/workflow.json) |
| Workspaces and input files | [Workspace examples](examples/workspace-examples-en.md) · [Shared inputs](docs/project-inputs.md) |
| Skills, tools, and experiments | [Skills](skills/scienceevolve-sdk/references/workflow-en.md#skills-and-mcp) · [MCP](docs/project-mcp.md) · [Inspire / SII](docs/sii-experiments.md) |
| Upgrade an existing deployment | [Naming migration](docs/naming-migration.md) · [Runtime migration](docs/main-runtime-migration.md) |

The API and CLI use the main runtime. `@scienceevolve/sdk/main` and `--engine main` remain explicit aliases. The legacy engine and its package exports have been removed; existing legacy data requires an older release.

The runtime is based on main `6bf6a7bb`; see the [2026-10-16 synchronization notes](docs/main-sync-20261016.md).
