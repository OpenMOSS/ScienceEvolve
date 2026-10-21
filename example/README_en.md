# Workflow examples

[← Back to README](../README.md) · **English** | [简体中文](README.md)

There are 23 examples, each started from workflow.json and requirement.txt. Fill in Task inputs, data, tools, and budget. Configure gateways and reasoning options through the [CLI guide](../sdk/docs/main-cli.md).

| Project | Orchestration | Configuration | Requirement |
| --- | --- | --- | --- |
| AHE iterative optimization · [Paper](https://arxiv.org/abs/2604.25850) · [Official code](https://github.com/china-qijizhifeng/agentic-harness-engineering) | Git-off v2 | [workflow](01-ahe-evolve/workflow.json) | [requirement](01-ahe-evolve/requirement.txt) |
| Software development | Git-off v2 | [workflow](02-software-development/workflow.json) | [requirement](02-software-development/requirement.txt) |
| Agent Laboratory | Git-off v2 | [workflow](agent-laboratory/workflow.json) | [requirement](agent-laboratory/requirement.txt) |
| AgentRxiv | Git-off v2 | [workflow](agentrxiv/workflow.json) | [requirement](agentrxiv/requirement.txt) |
| AI Scientist v2 | Git-on v3 | [workflow](ai-scientist-v2/workflow.json) | [requirement](ai-scientist-v2/requirement.txt) |
| AlphaEvolve | Git-on v3 | [workflow](alphaevolve/workflow.json) | [requirement](alphaevolve/requirement.txt) |
| ARIS | Git-off v2 | [workflow](aris/workflow.json) | [requirement](aris/requirement.txt) |
| autoresearch | Git-off v2 | [workflow](autoresearch/workflow.json) | [requirement](autoresearch/requirement.txt) |
| Biomni A1/E1 | Git-off v2 | [workflow](biomni/workflow.json) | [requirement](biomni/requirement.txt) |
| Biomni-R0 | Git-on v3 | [workflow](biomni-r0/workflow.json) | [requirement](biomni-r0/requirement.txt) |
| Chemical Coscientist | Git-on v3 | [workflow](chemical-coscientist/workflow.json) | [requirement](chemical-coscientist/requirement.txt) |
| Google AI co-scientist | Git-off v2 | [workflow](co-scientist/workflow.json) | [requirement](co-scientist/requirement.txt) |
| DrugEvolve | Git-off v2 | [workflow](drugevolve/workflow.json) | [requirement](drugevolve/requirement.txt) |
| General research | Git-off v2 | [workflow](dynamic-research-workflow/workflow.json) | [requirement](dynamic-research-workflow/requirement.txt) |
| FunSearch | Git-off v2 | [workflow](funsearch/workflow.json) | [requirement](funsearch/requirement.txt) |
| InternAgent 1.5 | Git-on v3 | [workflow](internagent-1-5/workflow.json) | [requirement](internagent-1-5/requirement.txt) |
| Kosmos | Git-on v3 | [workflow](kosmos/workflow.json) | [requirement](kosmos/requirement.txt) |
| Meta-Harness | Git-off v2 | [workflow](metaharness/workflow.json) | [requirement](metaharness/requirement.txt) |
| Raven Host | Git-on v3 | [workflow](raven/workflow.json) | [requirement](raven/requirement.txt) |
| Robin | Git-off v2 | [workflow](robin/workflow.json) | [requirement](robin/requirement.txt) |
| RRSI | Git-off v2 | [workflow](rrsi/workflow.json) | [requirement](rrsi/requirement.txt) |
| SciAgents | Git-off v2 | [workflow](sciagents/workflow.json) | [requirement](sciagents/requirement.txt) |
| ScientistTwo | Git-off v2 | [workflow](scientist-two/workflow.json) | [requirement](scientist-two/requirement.txt) |


## Startup

Install/build from the repository root, then choose an example:

```sh
npm ci
npm run install:cli
scievolve workflow validate example/kosmos/workflow.json
scievolve start example/kosmos/workflow.json example/kosmos/requirement.txt \
  --data-dir /absolute/run-data --workspace /absolute/task \
  --gateway-bindings /absolute/bindings.json
```

workspace is an existing task directory; dataDir stores runtime state. Keep them separate, with neither containing the other. Git-off shares the workspace; Git-on uses isolated worktrees and PR integration. Continue an existing task with run resume.

Copy an entire project's skills/ directory when present. Embedded Skill/MCP resources come from workflow.json; set environment variables required by requirement.txt. A backend that requires no authentication still explicitly sets an empty BACKEND_TOKEN.

## Files

- workflow.json: roles, models, orchestration, and tools.
- requirement.txt: Task inputs, execution, budget, and delivery.
- skills/: protocols, scripts, upstream implementations, licenses, and per-file manifests.
- SOURCES.json: pinned project/shared-method sources.
- requirements.txt and tests/: additional Python dependencies and local acceptance where applicable.

See [shared sources](SOURCES.json). The original [atomic backend contract](../scripts/example-workflows/BACKEND-CONTRACT.md) and [method review](../docs/workflows/method-review-20261014.md) remain in Chinese as implementation/evidence references.
