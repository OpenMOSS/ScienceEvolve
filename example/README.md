# Workflow 示例

[← 返回 README](../README_zh-CN.md) · [English](README_en.md) | **简体中文**

共 23 个示例，每个项目由 `workflow.json` 和 `research_proposal.txt` 启动。研究课题文件已经包含具体问题、研究假设、数据范围和评估方案，可以作为编写自己研究计划的参考。这些课题是示例研究设计，不代表已完成实验或复现原论文结果。

环境变量、服务依赖与运行参数见 [运行准备](RUNTIME.md)；网关与模型配置见 [main CLI](../sdk/docs/main-cli-zh.md)。

| 项目 | 编排 | 配置 | 研究课题 |
| --- | --- | --- | --- |
| AHE 循环优化 | Git-off v2 | [workflow](01-ahe-evolve/workflow.json) | [相关性筛选与拒答阈值对笔记问答准确性的影响](01-ahe-evolve/research_proposal.txt) |
| 软件开发 | Git-off v2 | [workflow](02-software-development/workflow.json) | [原子文件写入能否提高命令行待办工具的持久化可靠性](02-software-development/research_proposal.txt) |
| Agent Laboratory | Git-off v2 | [workflow](agent-laboratory/workflow.json) | [小样本手写数字分类中，主成分降维是否改善泛化表现](agent-laboratory/research_proposal.txt) |
| AgentRxiv | Git-off v2 | [workflow](agentrxiv/workflow.json) | [共享研究记录能否减少小样本分类实验中的重复探索](agentrxiv/research_proposal.txt) |
| AI Scientist v2 | Git-on v3 | [workflow](ai-scientist-v2/workflow.json) | [小型表格分类中缺失值处理方法的稳健性](ai-scientist-v2/research_proposal.txt) |
| AlphaEvolve | Git-on v3 | [workflow](alphaevolve/workflow.json) | [单位正方形内不等半径圆堆积的构造优化](alphaevolve/research_proposal.txt) |
| ARIS | Git-off v2 | [workflow](aris/workflow.json) | [类别不均衡条件下重加权与重采样的概率校准差异](aris/research_proposal.txt) |
| autoresearch | Git-off v2 | [workflow](autoresearch/workflow.json) | [固定训练时长下小型语言模型的学习率日程优化](autoresearch/research_proposal.txt) |
| Biomni A1/E1 | Git-off v2 | [workflow](biomni/workflow.json) | [批次效应校正对差异表达检出与假阳性的影响](biomni/research_proposal.txt) |
| Biomni-R0 | Git-on v3 | [workflow](biomni-r0/workflow.json) | [生物数据分析智能体训练能否提高未见任务上的工具使用正确率](biomni-r0/research_proposal.txt) |
| 化学 Coscientist | Git-on v3 | [workflow](chemical-coscientist/workflow.json) | [自适应取样能否降低水溶性染料吸光度标定的测量次数](chemical-coscientist/research_proposal.txt) |
| Google AI co-scientist | Git-off v2 | [workflow](co-scientist/workflow.json) | [区分高温胁迫下植物生长减缓的竞争性机制](co-scientist/research_proposal.txt) |
| DrugEvolve | Git-off v2 | [workflow](drugevolve/workflow.json) | [分子描述符组合对水溶解度预测与骨架外泛化的影响](drugevolve/research_proposal.txt) |
| 通用科研 | Git-off v2 | [workflow](dynamic-research-workflow/workflow.json) | [固定推理预算下独立复核对数学应用题正确率的影响](dynamic-research-workflow/research_proposal.txt) |
| FunSearch | Git-off v2 | [workflow](funsearch/workflow.json) | [在线一维装箱中剩余容量评分函数的自动发现](funsearch/research_proposal.txt) |
| InternAgent 1.5 | Git-on v3 | [workflow](internagent-1-5/workflow.json) | [面向分布变化的在线装箱启发式优化](internagent-1-5/research_proposal.txt) |
| Kosmos | Git-on v3 | [workflow](kosmos/workflow.json) | [不同连接组中神经元长度、突触数与连接度的尺度关系](kosmos/research_proposal.txt) |
| Meta-Harness | Git-off v2 | [workflow](metaharness/workflow.json) | [示例检索策略对文本分类记忆系统的准确率与成本的影响](metaharness/research_proposal.txt) |
| Raven Host | Git-on v3 | [workflow](raven/workflow.json) | [缺失值插补策略对城市空气质量短期预测的影响](raven/research_proposal.txt) |
| Robin | Git-off v2 | [workflow](robin/workflow.json) | [区分氧化应激细胞读数中的真实效应与检测干扰](robin/research_proposal.txt) |
| RRSI | Git-off v2 | [workflow](rrsi/workflow.json) | [限制提示编辑规模能否改善代码智能体的保留任务表现](rrsi/research_proposal.txt) |
| SciAgents | Git-off v2 | [workflow](sciagents/workflow.json) | [层状纤维素复合材料中强度与韧性的协同设计](sciagents/research_proposal.txt) |
| ScientistTwo | Git-off v2 | [workflow](scientist-two/workflow.json) | [噪声标签下样本重加权对小样本图像分类的稳健性](scientist-two/research_proposal.txt) |

## 启动

在仓库根目录安装和构建，按运行准备配置所选示例：

```sh
npm ci
npm run install:cli
scievolve workflow validate example/kosmos/workflow.json
scievolve start example/kosmos/workflow.json example/kosmos/research_proposal.txt \
  --data-dir /absolute/run-data --workspace /absolute/task \
  --gateway-bindings /absolute/bindings.json
```

workspace 使用已有任务目录，dataDir 保存运行状态，两者分开且互不包含。Git-off 示例共享 workspace；Git-on 示例使用隔离 worktree 和 PR 集成。后续继续任务使用 run resume。数据、评测环境和服务是否就绪，应在启动前按 [RUNTIME.md](RUNTIME.md) 核对。

Node API 仍使用 `sdk.start({ requirement: ... })` 字段，将 `research_proposal.txt` 的文本读入该字段即可；此次统一的是示例文件名及内容，不改变 SDK 接口。Python 依赖文件 `requirements.txt` 保持其原有用途。

## 文件

- `research_proposal.txt`：具体研究课题、假设、数据和评估方案。
- `workflow.json`：角色、模型、编排和工具配置。
- [RUNTIME.md](RUNTIME.md)：环境变量、资源前提及各示例的运行准备。
- `skills/`：执行协议、脚本、上游实现、许可证及逐文件校验清单；复制示例时需整体携带。
- `SOURCES.json`：项目或共用方法的固定来源。
- `requirements.txt`、`tests/`：需要额外 Python 依赖和本地验收的项目提供。

共用来源见 [SOURCES.json](SOURCES.json)，原子工具合同见 [BACKEND-CONTRACT.md](../scripts/example-workflows/BACKEND-CONTRACT.md)，方法核对记录见 [历史报告](../docs/workflows/method-review-20261014.md)。历史报告保留当时的配置与执行记录，当前研究输入以本目录为准。
