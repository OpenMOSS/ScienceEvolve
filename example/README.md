# Workflow 示例

[← 返回 README](../README_zh-CN.md) · [English](README_en.md) | **简体中文**

共 23 个示例，每个项目从 workflow.json 和 requirement.txt 启动。填写需求中的 Task、数据、工具和预算，按 [main CLI](../sdk/docs/main-cli-zh.md) 配置网关与模型推理选项。

| 项目 | 编排 | 配置 | 需求 |
| --- | --- | --- | --- |
| AHE 循环优化 · [论文](https://arxiv.org/abs/2604.25850) · [官方代码](https://github.com/china-qijizhifeng/agentic-harness-engineering) | Git-off v2 | [workflow](01-ahe-evolve/workflow.json) | [requirement](01-ahe-evolve/requirement.txt) |
| 软件开发 | Git-off v2 | [workflow](02-software-development/workflow.json) | [requirement](02-software-development/requirement.txt) |
| Agent Laboratory | Git-off v2 | [workflow](agent-laboratory/workflow.json) | [requirement](agent-laboratory/requirement.txt) |
| AgentRxiv | Git-off v2 | [workflow](agentrxiv/workflow.json) | [requirement](agentrxiv/requirement.txt) |
| AI Scientist v2 | Git-on v3 | [workflow](ai-scientist-v2/workflow.json) | [requirement](ai-scientist-v2/requirement.txt) |
| AlphaEvolve | Git-on v3 | [workflow](alphaevolve/workflow.json) | [requirement](alphaevolve/requirement.txt) |
| ARIS | Git-off v2 | [workflow](aris/workflow.json) | [requirement](aris/requirement.txt) |
| autoresearch | Git-off v2 | [workflow](autoresearch/workflow.json) | [requirement](autoresearch/requirement.txt) |
| Biomni A1/E1 | Git-off v2 | [workflow](biomni/workflow.json) | [requirement](biomni/requirement.txt) |
| Biomni-R0 | Git-on v3 | [workflow](biomni-r0/workflow.json) | [requirement](biomni-r0/requirement.txt) |
| 化学 Coscientist | Git-on v3 | [workflow](chemical-coscientist/workflow.json) | [requirement](chemical-coscientist/requirement.txt) |
| Google AI co-scientist | Git-off v2 | [workflow](co-scientist/workflow.json) | [requirement](co-scientist/requirement.txt) |
| DrugEvolve | Git-off v2 | [workflow](drugevolve/workflow.json) | [requirement](drugevolve/requirement.txt) |
| 通用科研 | Git-off v2 | [workflow](dynamic-research-workflow/workflow.json) | [requirement](dynamic-research-workflow/requirement.txt) |
| FunSearch | Git-off v2 | [workflow](funsearch/workflow.json) | [requirement](funsearch/requirement.txt) |
| InternAgent 1.5 | Git-on v3 | [workflow](internagent-1-5/workflow.json) | [requirement](internagent-1-5/requirement.txt) |
| Kosmos | Git-on v3 | [workflow](kosmos/workflow.json) | [requirement](kosmos/requirement.txt) |
| Meta-Harness | Git-off v2 | [workflow](metaharness/workflow.json) | [requirement](metaharness/requirement.txt) |
| Raven Host | Git-on v3 | [workflow](raven/workflow.json) | [requirement](raven/requirement.txt) |
| Robin | Git-off v2 | [workflow](robin/workflow.json) | [requirement](robin/requirement.txt) |
| RRSI | Git-off v2 | [workflow](rrsi/workflow.json) | [requirement](rrsi/requirement.txt) |
| SciAgents | Git-off v2 | [workflow](sciagents/workflow.json) | [requirement](sciagents/requirement.txt) |
| ScientistTwo | Git-off v2 | [workflow](scientist-two/workflow.json) | [requirement](scientist-two/requirement.txt) |

## 启动

在仓库根目录安装和构建，然后选择示例：

```sh
npm ci
npm run install:cli
scievolve workflow validate example/kosmos/workflow.json
scievolve start example/kosmos/workflow.json example/kosmos/requirement.txt \
  --data-dir /absolute/run-data --workspace /absolute/task \
  --gateway-bindings /absolute/bindings.json
```

workspace 使用已有任务目录，dataDir 保存运行状态，两者分开且互不包含。Git-off 示例共享 workspace；Git-on 示例使用隔离 worktree 和 PR 集成。后续继续任务使用 run resume。

有 skills/ 的项目需整体携带该目录。内嵌 Skill/MCP 的项目由 workflow.json 提供资源，按 requirement.txt 设置环境变量；无需认证的后端仍显式设置空 BACKEND_TOKEN。

## 文件

- workflow.json：角色、模型、编排和工具配置。
- requirement.txt：Task 输入、执行步骤、预算和交付。
- skills/：执行协议、脚本、上游实现、许可证及逐文件校验清单。
- SOURCES.json：项目或共用方法的固定来源。
- requirements.txt、tests/：需要额外 Python 依赖和本地验收的项目提供。

共用来源见 [SOURCES.json](SOURCES.json)，原子工具合同见 [BACKEND-CONTRACT.md](../scripts/example-workflows/BACKEND-CONTRACT.md)，方法核对记录见 [历史报告](../docs/workflows/method-review-20261014.md)。
