# Workflow examples

[← Back to README](../README.md) · **English** | [简体中文](README.md)

There are 23 examples, each started from `workflow.json` and `research_proposal.txt`. Each proposal describes a concrete research question, hypothesis, data, and evaluation plan. These are illustrative research designs, not completed experiments or claims of reproducing the original papers. Prepare resources using [runtime setup](RUNTIME.md) (Chinese), and configure gateways and reasoning options through the [CLI guide](../sdk/docs/main-cli.md).

| Project | Orchestration | Configuration | Research proposal |
| --- | --- | --- | --- |
| AHE iterative optimization · [Paper](https://arxiv.org/abs/2604.25850) · [Official code](https://github.com/china-qijizhifeng/agentic-harness-engineering) | Git-off v2 | [workflow](01-ahe-evolve/workflow.json) | [research proposal](01-ahe-evolve/research_proposal.txt) |
| Software development | Git-off v2 | [workflow](02-software-development/workflow.json) | [research proposal](02-software-development/research_proposal.txt) |
| Agent Laboratory | Git-off v2 | [workflow](agent-laboratory/workflow.json) | [research proposal](agent-laboratory/research_proposal.txt) |
| AgentRxiv | Git-off v2 | [workflow](agentrxiv/workflow.json) | [research proposal](agentrxiv/research_proposal.txt) |
| AI Scientist v2 | Git-on v3 | [workflow](ai-scientist-v2/workflow.json) | [research proposal](ai-scientist-v2/research_proposal.txt) |
| AlphaEvolve | Git-on v3 | [workflow](alphaevolve/workflow.json) | [research proposal](alphaevolve/research_proposal.txt) |
| ARIS | Git-off v2 | [workflow](aris/workflow.json) | [research proposal](aris/research_proposal.txt) |
| autoresearch | Git-off v2 | [workflow](autoresearch/workflow.json) | [research proposal](autoresearch/research_proposal.txt) |
| Biomni A1/E1 | Git-off v2 | [workflow](biomni/workflow.json) | [research proposal](biomni/research_proposal.txt) |
| Biomni-R0 | Git-on v3 | [workflow](biomni-r0/workflow.json) | [research proposal](biomni-r0/research_proposal.txt) |
| Chemical Coscientist | Git-on v3 | [workflow](chemical-coscientist/workflow.json) | [research proposal](chemical-coscientist/research_proposal.txt) |
| Google AI co-scientist | Git-off v2 | [workflow](co-scientist/workflow.json) | [research proposal](co-scientist/research_proposal.txt) |
| DrugEvolve | Git-off v2 | [workflow](drugevolve/workflow.json) | [research proposal](drugevolve/research_proposal.txt) |
| General research | Git-off v2 | [workflow](dynamic-research-workflow/workflow.json) | [research proposal](dynamic-research-workflow/research_proposal.txt) |
| FunSearch | Git-off v2 | [workflow](funsearch/workflow.json) | [research proposal](funsearch/research_proposal.txt) |
| InternAgent 1.5 | Git-on v3 | [workflow](internagent-1-5/workflow.json) | [research proposal](internagent-1-5/research_proposal.txt) |
| Kosmos | Git-on v3 | [workflow](kosmos/workflow.json) | [research proposal](kosmos/research_proposal.txt) |
| Meta-Harness | Git-off v2 | [workflow](metaharness/workflow.json) | [research proposal](metaharness/research_proposal.txt) |
| Raven Host | Git-on v3 | [workflow](raven/workflow.json) | [research proposal](raven/research_proposal.txt) |
| Robin | Git-off v2 | [workflow](robin/workflow.json) | [research proposal](robin/research_proposal.txt) |
| RRSI | Git-off v2 | [workflow](rrsi/workflow.json) | [research proposal](rrsi/research_proposal.txt) |
| SciAgents | Git-off v2 | [workflow](sciagents/workflow.json) | [research proposal](sciagents/research_proposal.txt) |
| ScientistTwo | Git-off v2 | [workflow](scientist-two/workflow.json) | [research proposal](scientist-two/research_proposal.txt) |


## Startup

Install/build from the repository root, then choose an example:

```sh
npm ci
npm run install:cli
scievolve workflow validate example/kosmos/workflow.json
scievolve start example/kosmos/workflow.json example/kosmos/research_proposal.txt \
  --data-dir /absolute/run-data --workspace /absolute/task \
  --gateway-bindings /absolute/bindings.json
```

workspace is an existing task directory; dataDir stores runtime state. Keep them separate, with neither containing the other. Git-off shares the workspace; Git-on uses isolated worktrees and PR integration. Continue an existing task with run resume.

Copy an entire project's skills/ directory when present. Embedded Skill/MCP resources come from workflow.json; environment variables and service prerequisites are documented in [runtime setup](RUNTIME.md). A backend that requires no authentication still explicitly sets an empty BACKEND_TOKEN.

The Node API still accepts the proposal text through `sdk.start({ requirement: ... })`. Python dependency files named `requirements.txt` keep their existing purpose.

## Files

- workflow.json: roles, models, orchestration, and tools.
- research_proposal.txt: a concrete research question, hypothesis, data, and evaluation plan.
- [RUNTIME.md](RUNTIME.md): environment variables, service prerequisites, and runtime preparation (Chinese).
- skills/: protocols, scripts, upstream implementations, licenses, and per-file manifests.
- SOURCES.json: pinned project/shared-method sources.
- requirements.txt and tests/: additional Python dependencies and local acceptance where applicable.

See [shared sources](SOURCES.json). The original [atomic backend contract](../scripts/example-workflows/BACKEND-CONTRACT.md) and [method review](../docs/workflows/method-review-20261014.md) remain in Chinese as implementation/evidence references.
