# ScienceEvolve Workflow 图册

[← README](../../../README_zh-CN.md#examples) · [English](README_en.md) · [方法映射](../../../example/METHODS.md)

23 个示例，23 张总览 + 36 张阶段／组内细节。**大流程先读细节，不把全图缩到节点不可读。** ScientistTwo 提供 9 张阶段图；协作组有独立的组内并行图。

截图使用真实前端 CanvasWorld / CanvasNodes / CanvasEdges 与语义适配器、路由器；经导出及通用导入解析器检查。文档页面单独排版：画布缩放固定为 100%，节点标题 16 CSS px，长名称换行，设备像素比 1.5。它们不是完整应用窗口截图。正文方法导读不参与执行，也不伪造角色间直接路由。

Main 星形图是宿主调度关系，不能单凭它判断论文方法是否完整。每页分别说明方法顺序、反馈、外部工具／人类实验和适配限制。**没有连接模型、训练、湿实验或科研端到端执行；配置和截图验证不等于论文结果复现。**

| 示例 | 方法定位 | 图与配置 |
| --- | --- | --- |
| [通用科研 / General research](dynamic-research-workflow.md) | 入门分工模板，不对应某篇论文。Main 协调选题、执行、写作与评审。 | [总览](dynamic-research-workflow.jpg) · [细节与说明](dynamic-research-workflow.md) · [JSON](../../../example/dynamic-research-workflow/workflow.json) |
| [AHE · 代码自进化 / Code evolution](01-ahe-evolve.md) | 入门代码改进示例；不认证为 AHE 论文完整系统。 | [总览](01-ahe-evolve.jpg) · [细节与说明](01-ahe-evolve.md) · [JSON](../../../example/01-ahe-evolve/workflow.json) |
| [软件开发 / Software development](02-software-development.md) | 入门开发与独立测试模板，不是论文复现。 | [总览](02-software-development.jpg) · [细节与说明](02-software-development.md) · [JSON](../../../example/02-software-development/workflow.json) |
| [ARIS](aris.md) | 官方协议适配；作者侧 Pi，跨模型评审。星形路由表示调度，不是阶段顺序。 | [总览](aris.jpg) · [细节与说明](aris.md) · [JSON](../../../example/aris/workflow.json) |
| [Meta-Harness](metaharness.md) | 文本分类参考任务；提案 Agent 外围的执行与分析角色是宿主分工。 | [总览](metaharness.jpg) · [细节与说明](metaharness.md) · [JSON](../../../example/metaharness/workflow.json) |
| [autoresearch](autoresearch.md) | 官方 Git keep/discard 循环的角色拆分适配。 | [总览](autoresearch.jpg) · [细节与说明](autoresearch.md) · [JSON](../../../example/autoresearch/workflow.json) |
| [FunSearch · 串行参考适配 / Serial reference](funsearch.md) | 对齐官方单线程参考实现，不是论文分布式异步系统。程序数据库是工具状态，不是缺失的 Agent。 | [总览](funsearch.jpg) · [细节与说明](funsearch.md) · [JSON](../../../example/funsearch/workflow.json) |
| [Agent Laboratory](agent-laboratory.md) | 七阶段由 Main/Skill 管理；角色会跨阶段复用。MLE-solver 按固定公开源码串行尝试。 | [总览](agent-laboratory.jpg) · [细节与说明](agent-laboratory.md) · [JSON](../../../example/agent-laboratory/workflow.json) |
| [SciAgents](sciagents.md) | 同时支持 fixed 与自动 speaker；不能把所有科学角色强制画成并行。 | [总览](sciagents.jpg) · [细节与说明](sciagents.md) · [JSON](../../../example/sciagents/workflow.json) |
| [Robin · 公开代码适配 / Public-code adaptation](robin.md) | 真实实验由外部研究人员完成并上传数据；公开代码为 5 条分析轨迹，论文描述 10 条。 | [总览](robin.jpg) · [细节与说明](robin.md) · [JSON](../../../example/robin/workflow.json) |
| [Google AI co-scientist · 同步适配 / Synchronous](co-scientist.md) | 六个核心科学角色；Main 同步调度代替论文异步队列。wetlab 是外部验证扩展，不是第七个原生核心角色。 | [总览](co-scientist.jpg) · [细节与说明](co-scientist.md) · [JSON](../../../example/co-scientist/workflow.json) |
| [Biomni A1 / E1](biomni.md) | 论文是单个 generalist A1 使用 E1 环境；下方多角色拆分 A1 内部步骤，不代表论文原生多科学家团队。 | [总览](biomni.jpg) · [细节与说明](biomni.md) · [JSON](../../../example/biomni/workflow.json) |
| [AgentRxiv · 单实验室模板 / Single lab](agentrxiv.md) | 一个 workflow 实例代表一个 lab。多 lab 必须独立启动并共享 archive；archive 角色是客户端。 | [总览](agentrxiv.jpg) · [细节与说明](agentrxiv.md) · [JSON](../../../example/agentrxiv/workflow.json) |
| [RRSI](rrsi.md) | 控制器维护编辑预算、正则化与固定划分；不是简单选最高分。 | [总览](rrsi.jpg) · [细节与说明](rrsi.md) · [JSON](../../../example/rrsi/workflow.json) |
| [DrugEvolve](drugevolve.md) | Researcher / Engineer / Analyst 三域；控制器内保存生成-检查与训练-调试循环。 | [总览](drugevolve.jpg) · [细节与说明](drugevolve.md) · [JSON](../../../example/drugevolve/workflow.json) |
| [ScientistTwo](scientist-two.md) | 49 个角色是注册表，不是 49 个线性阶段。protocol.py 管理条件分支、实验状态与评审接续。 | [总览](scientist-two.jpg) · [细节与说明](scientist-two.md) · [JSON](../../../example/scientist-two/workflow.json) |
| [AI Scientist v2](ai-scientist-v2.md) | 缩小任务适配；四个实验阶段和 checkpoint / replication / aggregation 保存在 manager 与 tree tools。 | [总览](ai-scientist-v2.jpg) · [细节与说明](ai-scientist-v2.md) · [JSON](../../../example/ai-scientist-v2/workflow.json) |
| [InternAgent 1.5](internagent-1-5.md) | Generation 含知识流与假设；Verification 管理 optimization 并复核；Evolution 更新证据和记忆。 | [总览](internagent-1-5.jpg) · [细节与说明](internagent-1-5.md) · [JSON](../../../example/internagent-1-5/workflow.json) |
| [Biomni-R0 · 待核验 / Unverified design](biomni-r0.md) | 原训练 / reward recipe 尚不足以核验；官方报告在 2026-11-12 审计时返回 404。缺 recipe 必须阻断。 | [总览](biomni-r0.jpg) · [细节与说明](biomni-r0.md) · [JSON](../../../example/biomni-r0/workflow.json) |
| [化学 Coscientist / Chemical Coscientist](chemical-coscientist.md) | Planner 按需调用工具，各结果和错误直接返回 Planner。optimization 是可选分析扩展，不是必经阶段。 | [总览](chemical-coscientist.jpg) · [细节与说明](chemical-coscientist.md) · [JSON](../../../example/chemical-coscientist/workflow.json) |
| [Raven · 受限双槽 / Limited batch](raven.md) | strict-host 保持阻断；仅明确 limited-batch 可验证双槽子项，不接受为完整 Raven。 | [总览](raven.jpg) · [细节与说明](raven.md) · [JSON](../../../example/raven/workflow.json) |
| [Kosmos · 缩小周期 / Reduced-scale cycles](kosmos.md) | SDK 示例；两条轨迹、两轮分析，不代表原论文规模。world model 是工具状态。 | [总览](kosmos.jpg) · [细节与说明](kosmos.md) · [JSON](../../../example/kosmos/workflow.json) |
| [AlphaEvolve · 缩小异步适配 / Reduced-scale](alphaevolve.md) | SDK 示例；程序库、验证器与异步评测是工具层。两个 worker 内可消费已经完成的反馈。 | [总览](alphaevolve.jpg) · [细节与说明](alphaevolve.md) · [JSON](../../../example/alphaevolve/workflow.json) |

[Manifest](manifest.json) 记录源配置与每张图片的 SHA-256、尺寸、字号、实际节点和前端文件哈希。[重新截图说明](https://github.com/OpenMOSS/ScienceEvolve-server/blob/main/scripts/workflow-gallery/README.md)。
