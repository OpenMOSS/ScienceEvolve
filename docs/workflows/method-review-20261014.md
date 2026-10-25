> 当前示例输入已更名为 `research_proposal.txt` 并补充具体研究课题，运行准备见 [example/RUNTIME.md](../../example/RUNTIME.md)。下文保留 2026-10-14 的方法核对记录与历史运行命令，关于旧输入模板内容的描述不代表当前课题文件。

# 七项 TODO 的 workflow 设计与复现度报告

> 历史证据说明：历史审计与实测记录保留当时的标识；当前使用方式以 ScienceEvolve 的 SDK/CLI 手册为准。

日期：2026-10-14（Asia/Shanghai）。范围：根 README 的七项 Science workflow TODO。

云端同步说明（2026-10-15）：本报告的评分与真实运行结论保留原审计时点。`b7/` 和 `benchmark-experiments/` 中的历史证据位于仓库之外，本次不上传这些实验目录；下文以本地历史文件路径标识它们。云端包含七份 workflow、需求、固定来源、本次新增设计/测试及报告；SDK 内核沿用目标分支的最新版本，不用历史 checkout 覆盖。

七项现在均有 `workflow.json` 入口，并通过本地 SDK 默认 main 引擎的 API/CLI 校验。本次新增四份方法设计；AI Scientist v2 的已有 draft 逐字节复制为规范文件名；Kosmos、AlphaEvolve 及原 AI Scientist draft 均未修改。**配置通过不等于方法通过：目前没有证据认定七项中任何一项已完成完整论文/方法复现。**

2026-10-14 本次只做设计、离线校验和无模型的工具合同测试，没有启动模型、训练、设备任务或 GitHub 资源。既有实验的部分成果作为历史证据引用，没有重跑或修改它们。设计时新模板留在 `research/todo-seven`，没有删除根 README 的 TODO。

2026-10-15 按用户要求，将本次四份新设计及 AI Scientist v2 的规范入口连同需求模板逐字节复制至 [example](../../example/README.md#新增-todo-方法设计)，原研究文件与已有 workflow 保留。目录位置不改变本报告的方法验收结论，TODO 仍保留；本次复制没有启动任何科研运行。

## 1. 文件与评分口径

| 项目 | workflow 入口 | 本次处理 | 静态映射分 | 真实方法证据 |
| --- | --- | --- | ---: | --- |
| AI Scientist v2 | [workflow.json](../../example/ai-scientist-v2/workflow.json) | 新入口原样复制 [已有 draft](../../example/ai-scientist-v2/workflow.json) | 90/100 | r6 的部分真实研究；后半程未完成 |
| Kosmos | [workflow.json](../../example/kosmos/workflow.json) | 保留原文件 | 85/100 | r6 首轮并行研究与 world 更新；跨轮未闭合 |
| InternAgent 1.5 | [workflow.json](../../example/internagent-1-5/workflow.json) | 新设计，两个原生并行组 | 55/100 | 已有单 Task baseline；完整方法未运行 |
| Biomni-R0 | [workflow.json](../../example/biomni-r0/workflow.json) | 新设计，训练/部署闭环带前置阻断 | 45/100 | 真实训练方法未运行 |
| 化学 Coscientist | [workflow.json](../../example/chemical-coscientist/workflow.json) | 新设计，Planner 按需工具路由 | 50/100 | 完整湿实验闭环未运行 |
| AlphaEvolve | [workflow.json](../../example/alphaevolve/workflow.json) | 保留原文件 | 85/100 | r2 小规模异步生成—评测—反馈；最终验收缺失 |
| Raven Host | [workflow.json](../../example/raven/workflow.json) | 新设计，明确受限并行骨架 | 40/100 | 原生编排探针；完整 Host 未运行 |

这些分数是**结构/接口映射分，不是实测成功率、论文数值接近度或完成百分比**。每项列十个同权重核对点：

- `I = 1`：当前 SDK 原生合同或已有适配代码存在相应机制；仍不表示该环节已真实验收。
- `P = 0.5`：只有提示词、原子工具接口或部分等价设计；实际 backend、算法细节或能力等价性尚未核验。
- `U = 0`：已确认不能表达，或原方法必需定义/实现尚未获得。

分数为 `10 × Σ各核对点`。逐项评分如下，不能把 P 当 I，也不能把缺失步骤写成科学负结果。真实运行一栏独立引用冻结审计；没有为缺工具的四项造运行分数。

固定来源见 [SOURCES.json](../../example/SOURCES.json)。本次验证的 SDK HEAD 是 `ccf066844ac12df84a52df8f136870f159fab539`，版本 `0.1.1`，Node `v24.20.0`；实际加载的本地构建 runtime 为 `4ae079fe51faefed850b5b9873979f44b60a7806+e36961bb4c134316`。checkout 中原有 SDK 未提交修改未被本次改动；历史实验冻结 runtime 为 `…+46104c22ff275d97`，两者不能混称同一次验证。

## 2. AI Scientist v2：90/100，已有设计覆盖高，实测未闭合

核心思想是由实验 Manager 管理候选树和分阶段研究，以执行/错误/视觉反馈决定后续工作，再生成、反思与审核论文。[原论文 §3](https://arxiv.org/html/2504.08066v1#S3)

保留原图：`idea → manager → experiments(worker_a ∥ worker_b) → manager`；四阶段结束后进入 `writer → reflector → reviewer`。Manager 的弱分支由 Main 裁决。当前 canonical 文件与旧 draft 完全一致，连原 r6 repositoryName、模型和内嵌工具代码都保留；没有重新运行生成器把未来源码变化灌入旧配置。

| 核对点 | 分级 | workflow / 工具对应 |
| --- | --- | --- |
| 有文献支撑的想法与来源 | I | idea 与树服务的想法/主来源登记 |
| best-first/debug 候选选择与父节点 | I | 内嵌 tree-store 与 worker 的上下文/保留节点协议 |
| 初步实现、调参、研究扩展、消融四阶段 | I | manager、阶段状态和预算/关闭门槛 |
| 独立实验并发 | I | v3 experiments 的两个 parallel 入口 |
| 实际代码执行、错误、指标和绘图 | I | 原子 execution/evaluator 服务及回执 |
| 真实 VLM 图形反馈和负面保留 | I | vision-review 与聚合图修订合同 |
| 阶段最佳方案、三个 seed 复验与聚合 | I | checkpoint/replication/aggregate 状态 |
| 写作、反思、编译与独立评审工具 | I | writer/reflector/reviewer 和内嵌 paper-store |
| 完整图文/页面审查等价性 | P | 已有服务与约束，复杂版面/完整链仍未证实 |
| 原模型、研究题目与计算规模等价 | P | 固定模型、小规模 CPU Task；不能宣称原论文规模 |

历史 r6 审计记录 7 个候选，前两个阶段关闭，研究扩展尚未关闭，消融和完整论文链未完成；真实双 worker 并行、CPU/VLM 和聚合图负面后重绘有证据。参数优化改动架构、校准数据独立性等科学问题仍须处理，工具的 `good` 不能消除这些偏差。审计的 `methodAccepted=false`、`formalSDKCompleted=false`，原目录也未完成同步。

证据：r6 独立审计（本地历史文件：`../../../../b7/ai-scientist-v2-20261014-r6/independent-method-audit.json`）、阶段语义审查（本地历史文件：`../../../../benchmark-experiments/todo-seven-20261013/AI-STAGE-SEMANTICS-20261014.md`）、已有对照报告（本地历史文件：`../../../../benchmark-experiments/todo-seven-20261013/WORKFLOW-PAPER-COMPARISON.md`）。要提升复现度，先完成后两阶段和真实写作/反思/评审，再独立核对统计与最终交付；新增文件名不补齐这些证据。

## 3. Kosmos：85/100，结构化研究状态已适配，跨轮实测不足

核心是并行数据分析与文献研究，把带出处的发现写入 world model，再用旧发现推进后续研究，最终形成可追溯报告。公开 figures 仓库提供案例资产，不能当成原自治引擎源码。[原论文 §2](https://arxiv.org/html/2511.02824v1#S2)

原 workflow 不变：`planner → trajectories(analysis ∥ literature) → synthesis → planner/audit`。实际科学状态由内嵌 MCP 对专属 world 数据库进行读写；各分支通过 Git 交付自己的结果，synthesis 后续读取已整合证据。

| 核对点 | 分级 | workflow / 工具对应 |
| --- | --- | --- |
| 基于当前研究状态规划 | I | planner/get_context/plan_cycle |
| 数据、文献轨迹原生并行 | I | trajectories 两个 parallel 入口 |
| 实际数据分析与结果发布 | I | analysis/run_analysis/publish_trajectory |
| 文献检索、全文和来源身份 | I | literature/search_literature/read_primary_source |
| 有类型/版本的 world model | I | science-store、query_world/update_world |
| 支持、矛盾、替代关系和溯源 | I | typed claims/source/关系与修订合同 |
| 下一轮查询和消费旧发现的接口 | I | synthesis 弱分支回 planner 与 query_world |
| 完整逐声明报告/科学审核 | P | 已有输出和审计合同；完整实际交付未出现 |
| 未公开原 world 内部算法 | P | 独立 SQLite/类型设计，只复现公开语义 |
| 原模型、轨迹数/轮数等价性 | P | 缩至每轮两轨迹、两轮；不是原评估规模 |

冻结 r6 审计显示两条轨迹发布、1 个分析作业、2 个来源和3条 claims，world version 14，完成1轮；`record_audit=0`。Main 发出的第二轮任务交接异常，不能把再次读第一轮 claims 当成第二轮研究。三份最终报告和科学审核未完成，`methodAccepted=false`。

证据：r6 独立审计（本地历史文件：`../../../../b7/kosmos-r6-20261013/independent-protocol-audit.json`）、任务交接诊断说明（本地历史文件：`../../../../benchmark-experiments/todo-seven-20261013/WORKFLOW-PAPER-COMPARISON.md`）。提升重点是证明旧 world 真正驱动第二轮新研究及再更新，然后补齐逐声明报告/审计；本次按要求不修改原 workflow。

## 4. InternAgent 1.5：55/100，完整方法接口设计，backend 待实现

Generation、Verification、Evolution 构成外层研究闭环；知识流、图增强 Monte Carlo 与记忆消费分别承担研究、方案优化和持续改进。论文描述四类扩展运算符；固定源码的 task/online/long memory 与 DR 的 SPM 也需区分。[论文 §2](https://arxiv.org/html/2602.08990v1#S2)、[固定记忆文档](https://github.com/InternScience/InternAgent/blob/fa8c3eedfa9751d3752ea6eb49220b303ac2397d/docs/memory_module.md)

新图：`preflight → flow_planner ↔ knowledge(research_a ∥ research_b) → generation → optimization(optimizer_a ∥ optimizer_b) → verification → evolution → generation/flow_planner/audit`。flow_planner 和 generation 分别兼任所属组的 Leader，在管理 turn 只派工和核对交付，不兼任组内研究 worker。

| 核对点 | 分级 | 本次对应 |
| --- | --- | --- |
| 三子系统与结果驱动回路 | I | SDK 原生角色/强弱路由 |
| 研究/实验两个独立并行组 | I | 两组、各两个 parallel 入口 |
| 动态 search/solve/answer 知识流 | P | plan_flow/claim_flow_node/commit_flow_result 的依赖与 CAS 合同 |
| 跨域 KG、向量检索与三路径回答 | P | query_knowledge、research/generation 的协议；backend 未接入 |
| 图增强 Monte Carlo 与四算子 | P | select_search_context；Agent 生成候选，record_evaluation 数值回传 |
| baseline、真实实验及独立复验 | P | evaluate_baseline/submit_candidate/reevaluate_candidate |
| SPM/TEM/SKM 与 online 保存/检索 | P | retrieve/save_memory；每次评测立即 TEM，下一轮记录消费 IDs |
| 成对经验、IdeaGraph/novelty 与目标演化 | P | evolution/update_research_objective；改变 Task 方向，不改 SDK |
| 真实完整报告与独立科学审核 | P | audit/acceptance.json 和证据清单合同 |
| 原知识流即时 ready-set 调度 | U | 当前用固定双槽批次屏障；不是原动态即就绪即推进 |

没有整套调用 MLEvolve 或原 InternAgent。检索、图/记忆存取、数值选择/回传和实验作业均按原子接口设计；候选内容和科研决策由 SDK Agent 负责。具体数值策略、KG/embedding/记忆服务尚未实现，因此不能给这些环节 I。已存在的 AutoDebug CPU baseline 仅是 Task 资源证据，不覆盖知识流和完整记忆/演化。既有记录（本地历史文件：`../../../../benchmark-experiments/todo-seven-20261013/WORKFLOW-PAPER-COMPARISON.md`）

提升顺序：先实际接通来源/图/embedding/记忆与评分器，锁定数值策略；随后证明四算子和跨分支/跨轮消费；若要求完整 FlowSearch 调度保真，需补即时动态调度，不能只增候选数。

## 5. Biomni-R0：45/100，真实训练闭环设计，原 recipe 是关键缺口

公开 README/model card 确认使用 Biomni-E1 环境的端到端 RL 和发布权重推理；它们不提供本次已经核验完毕的完整训练/reward recipe。技术报告入口本次未能访问，不能据二手介绍固化 SFT/GRPO/PPO、奖励系数等参数。[固定 README](https://github.com/snap-stanford/Biomni/blob/400c1f366b96a35ca253e13c9b06c5076af41d65/README.md#biomni-r0)、[官方 model card](https://huggingface.co/biomni/Biomni-R0-32B-Preview)

新图：`preflight → curator → rollout → reward → trainer → deployer → evaluator → rollout/audit`。外围 Codex Agent 管理训练，不冒充或替换被训练 policy。成品 R0 可作比较基线，不能取代训练步骤。

| 核对点 | 分级 | 本次对应 |
| --- | --- | --- |
| 轨迹→奖励→训练→部署→复评结构 | I | SDK 原生路线和失败/停止分支 |
| 真实固定-policy E1 工具轨迹 | P | collect_trajectories；backend 未接入 |
| 任务/环境版本与数据清单 | P | create_training_plan 与 capability/recipe 前置检查 |
| 独立奖励与 split/标签隔离 | P | score_trajectories、scorer hash、sealed-test 合同 |
| 真实 checkpoint 和父版本 lineage | P | submit_training/register_checkpoint 的真实作业回执合同 |
| 已加载权重部署与回退 | P | deploy_checkpoint/get_deployment；不是 model alias |
| 新旧 policy 公平复评/提升策略 | P | evaluate_policy/promote_checkpoint |
| 独立审核、累计预算和 unknown 对账 | P | audit/get_request 与证据清单 |
| 原训练/reward/优化 recipe 的核验实现 | U | 未取得可据此落实完整策略的材料 |
| 原训练资源、规模与实际训练等价 | U | 无本次真实 GPU trainer/权重训练验收 |

不设置虚假权重，不把模型自评分当奖励，也不选择未经核实的 RL 算法。必需 recipe/GPU/E1/训练器/部署缺失时停在 preflight。提高复现度先补原训练定义和真实数据/奖励接口，再跑完整权重 lineage；不能通过运行发布模型推理提高“训练方法”验收等级。

## 6. 化学 Coscientist：50/100，保留按需 Planner，设备接口待接入

论文系统由 Planner 根据任务调用搜索、设备文档、代码和实验执行工具，并用实验反馈决定下一步。固定公开仓库主要是支持材料，其 simple_implementation 的表达式/随机数/停止工具不能代表完整设备实验。[原论文](https://www.nature.com/articles/s41586-023-06792-0)、[固定官方仓库](https://github.com/gomesgroup/coscientist/tree/417e82b85743f88719ba7cf8838220fcb872e2ae)

新图：`preflight → planner`；planner 弱分支按需选择 web_search/documentation/code/experiment/audit，前三者返回 planner；`experiment → optimization → planner`。不强制每次固定串行跑所有工具，也不混入 Google co-scientist 的假设排名方法。

| 核对点 | 分级 | 本次对应 |
| --- | --- | --- |
| Planner 按需委派与反馈路线 | I | 多弱分支与工具返回路由 |
| 真实化学主来源搜索/全文 | P | search_sources/read_artifact |
| 实际设备/API/版本文档 | P | search_device_docs 与 manual hash |
| 有界代码执行/数据处理 | P | run_code 原子 sandbox 合同 |
| 源码、手册、设备一致的编译 | P | compile_protocol/compiledArtifact |
| 幂等作业/unknown 对账/授权绑定 | P | submit_experiment/get_request 与 authorizationId |
| 真实测量、失败和样品链反馈 | P | get_job/record_observation |
| 结果驱动优化与后续实验 | P | evaluate_objective/optimization→planner |
| 独立报告、累计实验预算/停止 | P | audit 与 Task manifest 合同 |
| 真实湿实验设备服务的执行能力 | U | 尚未接入/验收 |

设备动作只能由已授权的设备端校验并执行；代码编译、simulation 或历史数据分析不计物理实验。Git 管理代码/证据，不能撤销已发生的实验。提升重点是连接实际设备/测量服务并用真实结果改变下一实验，而非用随机产率填反馈。

## 7. AlphaEvolve：85/100，已有小规模异步闭环，保留原文件

核心是从程序库选择 parent/inspirations，生成程序修改，进行分级自动评测并将分数/失败反馈写回库；生成和评测异步推进并兼顾多样性。官方 problems 仓库公开题目和验证资产，没有公开完整引擎。[原论文 §2](https://arxiv.org/html/2506.13131v1#S2)

保留 `search(worker_a ∥ worker_b) → audit`；外部原子 evaluator 处理队列，没有把整个方法改成每代同步屏障。每个 worker 的最后一候选必须消费实际先前反馈；每支三候选是现有缩小验收规则，不是本次重设的论文参数。

| 核对点 | 分级 | workflow / 工具对应 |
| --- | --- | --- |
| EVOLVE-BLOCK 与 SEARCH/REPLACE diff | I | submit_diff、保护块与源码摘要 |
| parent/inspirations 采样和 lineage | I | sample_prompt/program-store |
| 两生成分支真实并发合同 | I | v3 search 的两个 parallel 入口 |
| 异步生成/评测队列 | I | submit_diff 入队、原子 evaluator、非全代屏障 |
| 语法→廉价→官方几何评分级联 | I | evaluator 与保护 checker |
| 失败反馈及后续实时消费 | I | inspect_candidate、最终候选反馈门槛 |
| 程序/回执/来源导出和独立核查机制 | I | export_search_artifacts、哈希及 audit 合同 |
| 完整原数据库/岛迁移策略 | P | 按代码长度分箱/actor 分岛等为独立实现选择 |
| 原生成模型组合能力等价 | P | 固定 gpt-6.1-sol，不是原模型组合 |
| 原任务规模/种子/计算预算等价 | P | 单题、小候选量、缩短执行预算 |

冻结 r2 审计显示初始程序和6候选终结、5有效，双 worker 有重叠执行，后续提示包含先前评测/拒绝反馈。初始程序拒绝与失败保留。最终本地同步、独立 Audit 角色和原目录交付未完成，`methodAccepted=false`。这些证据支持小规模生成—评测—反馈发生，不证明原搜索效果、单调改进或刷新纪录。

证据：r2 独立审计（本地历史文件：`../../../../b7/alphaevolve-r2-20261013/independent-method-audit.json`）、恢复与交付核验（本地历史文件：`../../../../benchmark-experiments/todo-seven-20261013/ALPHA-R2-RECOVERY-20261014.md`）。提升先补正式 Audit/最终交付，再扩大长期搜索与多样性验证；本次不改既有策略或配置。

## 8. Raven Host：40/100，完整模式明确阻断

固定源码的 Host 需要按依赖就绪推进、instance 排他、后台通知、逐节点判定、失败中其余分支继续，以及 continue/abandon/replan 和多图 stint。当前 SDK 的原生 scoped 并行改善了历史单 worker 限制，但不直接给出上述完整语义。[固定 dag_runner](https://github.com/EverMind-AI/Raven/blob/25c576859a70e356befd02af646f5293fb14233b/raven/agent/subagent/dag_runner.py)、[dag_control_tools](https://github.com/EverMind-AI/Raven/blob/25c576859a70e356befd02af646f5293fb14233b/raven/agent/subagent/dag_control_tools.py)

新图是 `preflight → main(Host) → delegation(slot_a ∥ slot_b) → judge → main → audit` 的**受限骨架**。默认 strict-host 在 preflight 返回 blocked；limited-batch 只能验证两个固定 specialist 槽位和边界判定，结果必须 `methodAccepted=false`。不会黑盒调用 Raven Host，backend 也不会另建并发运行时替 SDK 规避缺口。

| 核对点 | 分级 | 本次对应/缺口 |
| --- | --- | --- |
| 两 specialist 原生并发 | I | scoped parallel；局部 planner 探针通过 |
| 固定槽位的上下文/会话复用 | I | 两个 sessionPersistence Agent；仅固定实例 |
| Host 按需选择 roster/任务 | P | Host plan/roster 合同；直接处理和任意单次委派未完整覆盖 |
| 节点完成判定、输出隐藏、两次续跑计数 | P | 边界 judge/record_verdict 合同，非在线节点控制 |
| 跨图证据与记忆消费 | P | node/instance/source/memory 存取接口待接入 |
| stint/playbook/停止和恢复 | P | record_stint 仅持久合同，无完整自动推进 |
| 任意 AND 依赖与即时 ready-set | U | A→C、B→C 是两次 arrival，不是 AND barrier |
| 存活分支中的通知/失败裁决 | U | 边界 judge 不等于 Host 在线处理通知 |
| 在途取消/replan/后继图与过期结果隔离 | U | 现有路由/重配置不提供完整生命周期 |
| 动态 instance、排他和逐节点 Skills/MCP | U | 固定身份/能力绑定不能等价替代 |

三项本地探针再次确认：原生 fan-out 有两个独立 activation；路径汇入同节点产生两 activation；`dependsOn` 是不被 SDK 接受的字段。[探针](../../scripts/example-workflows/raven-contract.test.mjs)、[当前 planner](../../sdk/src/core/scoped-workflow-planner.ts)、[当前合同](../../sdk/src/core/scoped-workflow-contract.ts)

旧 [Raven 核对文档](../../docs/sdk/raven-fidelity-audit.md) 的“单 invocation”结论基于旧版本，不能继续照搬；它列出的动态控制要求仍是本次核对依据。提高复现度需实现并验证原生依赖/在线控制/图与实例生命周期；固定两支、追加 prompt 或新增 Memory.md 都不能补足。

## 9. 新接口的实现边界与启动方式

四份新设计内嵌 [task-bridge.cjs](../../scripts/example-workflows/task-bridge.cjs)、逐角色 tools.json 和方法 Skill。桥接器实现角色工具白名单、参数检查、HTTP 回执身份核验、文本 artifact SHA-256 校验、断线 unknown 与禁止自动重复提交。**它是可测试的传输代码，不是已经实现的科研 backend。**检索/知识/训练/设备等服务必须依 [BACKEND-CONTRACT.md](../../scripts/example-workflows/BACKEND-CONTRACT.md) 实际接入。

| 方法 | 部署环境变量前缀 | 必需实际资源 |
| --- | --- | --- |
| InternAgent | `SCIENCEEVOLVE_INTERNAGENT` | 原子检索/KG/FlowGraph、有效 embedding/记忆、数值选择/回传、真实 Task 评测 |
| Biomni-R0 | `SCIENCEEVOLVE_BIOMNI_R0` | 源已核验 recipe/reward、E1/数据/基础权重、GPU trainer/部署/复评 |
| 化学 Coscientist | `SCIENCEEVOLVE_COSCIENTIST` | 主来源/设备手册、sandbox/编译、授权设备和真实测量 |
| Raven | `SCIENCEEVOLVE_RAVEN` | 受限实验的实际 roster/领域工具/状态；strict-host 仍有原生编排缺口 |

每个前缀设置 `_BACKEND_URL`、可选 `_BACKEND_TOKEN`、全新 `_SCOPE_ID`，通过 envFrom 注入；不把值/凭据写入 workflow。外部服务还需独立认证/权限和数据合同，传输层不能仅凭 actor 字符串授予权限。服务必须实现幂等、CAS、持久回执/预算和真实资源探测。没有配置时 MCP 返回 blocked。

新 [InternAgent research proposal](../../example/internagent-1-5/research_proposal.txt)、[Biomni research proposal](../../example/biomni-r0/research_proposal.txt)、[Coscientist research proposal](../../example/chemical-coscientist/research_proposal.txt)、[Raven research proposal](../../example/raven/research_proposal.txt) 以及 [AI Scientist research proposal](../../example/ai-scientist-v2/research_proposal.txt) 是输入模板，需填写真实 Task/预算/路径；原 Kosmos/AlphaEvolve requirement 保留。本次没有选择未经授权的科研任务或新实验规模。

在此 SDK checkout 根目录离线验证：

```powershell
node research/todo-seven/design-20261014/validate-workflows.mjs
node sdk/cli/scienceevolve.mjs workflow validate research/todo-seven/internagent-1-5/workflow.json
```

**资源、需求、模型/Git 路线和该次执行授权全部具备后**，采用以下格式启动；这是待填写的命令模板，本次未执行：

```powershell
node sdk/cli/scienceevolve.mjs start research/todo-seven/internagent-1-5/workflow.json research/todo-seven/internagent-1-5/requirement.txt --data-dir D:/absolute/new-run-state --workspace D:/absolute/business-workspace --gateway-bindings D:/absolute/bindings.json
```

全部配置 Git-on v3，将实际创建/使用专属私有 GitHub 仓库；workspace 与 dataDir 必须互不包含。新配置沿用现有 gpt-6.1-sol/Codex/mid，mid 需绑定实际已验证的网关选项。已有 AI/Kosmos/AlphaEvolve 的仓库名称与科学服务路径属于原尝试，不自动复用旧 run/数据；本报告不给旧现场换模型或新建替代恢复任务。

## 10. 验证、保护与证据时点

- 7/7 通过 `loadMainWorkflowConfig`，7/7 通过 `scion-ar workflow validate`，均为 `engine=main/schemaVersion=3`，没有回退 legacy。
- 8 个新桥接测试通过：缺服务阻断、工具/参数白名单、scope/稳定 ID、断线/HTTP unknown 且不重试、回执身份、真实写入证据、artifact 字节摘要。测试只用本机 fixture，没有实际科研服务/训练/模型/设备。
- 3 个既有 Raven 原生合同探针通过。总计11测试通过；它们证实局部机制/缺口，不是方法验收。
- API/CLI 的完整记录、各新文件 SHA-256 和实际 runtime 在 [validation-results.json](history/validation-results-20261014.json)。测试源码为 [task-bridge.test.mjs](../../scripts/example-workflows/task-bridge.test.mjs) 和 [Raven 探针](../../scripts/example-workflows/raven-contract.test.mjs)。
- 保护清单见 [preserved-workflows.json](history/preserved-workflows-20261014.json)。生成器只新增文件，遇已有目标拒绝覆盖；不要在已有交付上重新运行它。

| 原文件 | 本次前后 SHA-256 | 状态 |
| --- | --- | --- |
| AlphaEvolve workflow.json | `d9de0844a0ead2168dc8b5ffe166bf56a10c6be41002d403554ef71cd6aa474b` | 不变 |
| Kosmos workflow.json | `48ef7ce4b5625eb5978476191859431b9c8787dea061513ab38047e3974d17e4` | 不变 |
| AI Scientist workflow.draft.json | `cb22df890a12e60e8c93ad6bfb5184f72615d7949defc5c9cd4ef10cca552718` | 不变；新 workflow.json 完全相同 |

本报告的真实执行结论固定在所链接 r2/r6 审计时点。读取 progress.json（本地历史文件：`../../../../benchmark-experiments/todo-seven-20261013/progress.json`） 的快照时间为 2026-10-14 18:13（北京时间）：另有 Nex 新 campaign 正在执行/排队，尚无本次已读的独立最终验收；不把它的运行状态并入旧 gpt-6.1-sol 证据。本次没有操作该 campaign、打开其 SDK 宿主、改动旧运行配置或修改已有对照报告。

**可以交付的是七个合法工作流入口及清晰的方法映射。完整复现仍需：现有三项补闭环与独立科学/交付验收；InternAgent 补真实原子算法/知识/记忆后端及调度保真；Biomni 补原 recipe 与真实训练；Coscientist 补真实设备反馈；Raven 补原生动态控制。**

## 11. 各项缺口大小与原因归属

以下按本次配置、适配代码和已引用的冻结审计判断，不把另一个进行中的 campaign 当成最终验收。必须分开判断“SDK 能否表达方法”与“实际方法是否已实现、运行并交付”。前述静态映射分不能相减后称为剩余工作百分比，也不能据此估算工时。

大小采用定性分级：SDK 缺口“小”表示已有基础编排可承载，主要需要适配或修复；“中”表示部分调度语义需要补充；“很大”表示完整方法要求新的编排与生命周期机制。落地缺口“中”表示已有核心真实运行，但完整闭环/交付未验收；“大”表示重要后半程未完成，或核心后端尚只有接口；“很大”表示编排能力和核心落地都存在阻断。

| 项目 | SDK 功能缺口 | 完整落地缺口 | 主要原因及归属 | 是否主要缺上游数据/代码/环境 |
| --- | --- | --- | --- | --- |
| AI Scientist v2 | 小；交付修复与定向恢复仍需增强 | 大 | Manager 未导出/提交自己的新科学状态；调参架构漂移、统计隔离等方法问题；研究扩展、消融与论文链未完整完成。主要是角色行为、我们的方法适配/约束及验收，不是已证明无法编排 | 不是。源码、实际 CPU 数据/执行、视觉反馈已有证据；原论文任务/模型/算力规模另有差距 |
| Kosmos | 基础编排小；冻结版本有确认的任务交接缺陷 | 中 | Main 新任务被前驱回执替代，第二轮未真正推进；报告和审核未闭合。运行时缺陷应由 SDK 修复并回归，跨轮证据还需补验 | 不是主要缺数据。案例数据可用；原自治引擎/world 内部算法未公开，影响精确内部等价，不阻止按公开思想独立实现 |
| InternAgent 1.5 | 中；动态知识流调度保真不足 | 大 | 本次知识图/向量/记忆、图增强 Monte Carlo 数值选择与回传、实验评测后端尚未实现/接通；固定双槽批次不同于即时 ready-set。主要是我们待做的适配工程，另有调度能力差距 | 原仓库代码和文档已取得，不能笼统称上游没代码；还需有效 embedding、知识资源及真实 Task 评测环境 |
| Biomni-R0 | 小；未确认基础训练编排能力不足 | 大 | 本次未取得并核验完整训练/reward recipe；真实 rollout/奖励/训练/部署后端未实现或接通，GPU/E1/数据划分等尚无完整验收。资料、适配与资源共同阻断 | 是重要原因，但“本次未核验 recipe”不等于“上游从未发布”；发布权重及推理环境不能代替训练方法 |
| 化学 Coscientist | 小；按需工具调用与反馈可表达 | 大；未接设备时有硬阻断 | 搜索/文档/编译/设备/测量适配尚待实现或接通；完整湿实验需要实际设备、材料、设备匹配的 API/手册及测量。我们适配工程与外部物理资源都缺 | 是。公开支持材料/简单实现并非完整设备系统；现有历史数据、模拟或软件结果不能补齐真实物理反馈 |
| AlphaEvolve | 小；交付同步/恢复可靠性有缺口 | 中 | 小规模异步生成—评测—反馈已发生；正式 Audit、本地同步和最终交付未验收。历史回执/同步异常需定位，不能都归为缺少搜索机制 | 不是主要缺数据/评测环境。问题与验证资产、真实评测已有；原私有引擎策略、模型组合与计算规模影响精确等价 |
| Raven Host | 很大；原生动态依赖/在线控制/实例生命周期不足 | 很大 | 任意 AND 依赖、就绪调度、分支存活期间 Host 通知与裁决、在途取消/replan、动态 instance 等不由现有合同完整提供；固定双槽只是受限骨架，strict-host 默认阻断 | 不是主因。原 Host/DAG 代码已取得；roster、领域工具和记忆也待适配，但仅补这些资源不能消除编排缺口 |

### 11.1 不能混在一起的六类原因

1. **SDK 功能尚不支持**：当前合同没有相应语义。Raven 是最明确的例子；InternAgent 的即时动态调度也有差距。Raven 探针确认 `A→C`、`B→C` 产生两次 activation，并非等待两支完成后只运行一次的 AND 依赖；直接添加 `dependsOn` 也不能通过合同验证。
2. **SDK 现有功能有运行缺陷或恢复不足**：功能存在，但执行/交接/诊断未可靠完成。Kosmos 冻结运行的新任务正文替换有原生轨迹及源码佐证；Alpha 的交付同步问题应保留根因边界；定向单 Agent 恢复接口不足又是单独的功能问题。它们不能统称“workflow 设计表达不了方法”。
3. **我们尚未完成方法适配**：新增四项的 MCP 桥接器已实现传输、参数/回执核验，但具体检索、算法、状态库、训练器、编译或设备 backend 多数仅定义合同。这是本次设计的实现边界，不是上游项目或 SDK 的责任。只填 URL、token 和数据路径不会自动产生这些实现。
4. **上游内部实现未公开，或原方法材料本次未取得/核验**：Kosmos/Alpha 的完整引擎与公开问题资产要区分；Biomni 的原训练定义仍需核验。未公开和暂未取得是不同结论。前者限制内部精确等价，后者需要继续查证；两者都不应泛化成“无任何可复现材料”。
5. **外部资源尚不具备**：GPU/E1/训练数据和设备/材料/真实测量需部署或提供。SDK 可以经原子工具调用这些资源，但编排代码本身不能生成硬件、训练数据或真实物理观测。资源可提供并不代表本次适配服务已经实现。
6. **已有实现尚未完整验证，或实际科研行为偏离合同**：AI 的架构/统计问题与后半程缺失、Kosmos 的真实第二轮、Alpha 的完整审核/交付都属于这一层。通过 schema、工具合同或 Git 合并不能替代方法验收。

运行缺陷的证据与版本边界见 SDK 问题记录（本地历史文件：`../../../../benchmark-experiments/todo-seven-20261013/SDK-ISSUES.md`）；其中 AI Manager 交接未发现与 Kosmos 相同的新任务正文丢失证据，不能复制归因。这里不宣称历史缺陷在当前新运行中仍然存在，也不宣称它们已修复；须对相应运行版本独立回归。

### 11.2 补齐工作与 SDK 建设的边界

- AI/Kosmos/Alpha：优先补可靠交接/交付、角色自身任务识别及科研验收。按公开设计思想完成小规模闭环，不要求先重做整个 SDK；精确论文规模另列模型/任务/预算差异。
- InternAgent：主要工作是拆解并复用原子源码，实现真实知识、记忆、搜索数值和评测接口；要求即时 FlowSearch 保真时，另需补动态调度。
- Biomni：先核验原训练/reward 定义与数据合同，再落实真实训练、部署和评估服务/资源；自行猜一套 RL 算法或调用成品模型都不算补齐。
- Coscientist：先落实具体设备与测量服务，再做设备匹配的适配和真实反馈闭环；没有设备时可交付软件工具设计，但湿实验复现仍缺失。
- Raven：应作为 SDK 编排能力建设任务，明确依赖调度、在线控制和图/instance 生命周期后实现并验证；增加角色数、提示词或外部数据不能解决核心缺口。

对 SDK 的建设应聚焦通用编排与可靠恢复。知识图、Monte Carlo 数值、GPU trainer、化学设备控制等方法专属原子工具通常应由适配层提供，不必全放入 SDK 核心。两类工作都需要完成，不能用“SDK 不含科研算法”解释掉适配尚未实现的事实。

## 12. 云端 sdk-only 分支同步校验（2026-10-15）

同步目标为 `feat/sdk-only-v0.1.1`，基于远端最新提交 `aff389f357793e1d147b5cfcae0156f799780dc0` 整理本次文件。保留该分支现有双语文档和 SDK 内核，不带入原适配 checkout 中其他未提交的 SDK 修改；同步直接提交/推送，不创建 PR。

本次云端 checkout 的 SDK 构建通过，实际 runtime 为 `48e82cedd993d67f2379c36fade8973db63c74e8+f3c0775e4f8b06de`。七份研究入口及五份 example 副本均通过 API/CLI 校验，共 12 个配置；8 个桥接合同测试和 3 个 Raven 编排探针再次通过。五组 workflow/需求副本与研究文件逐字节一致，原三份受保护 workflow 的哈希保持不变；189 个本地文件链接检查无缺失。

完整离线记录见 [cloud-validation-results-20261015.json](history/cloud-validation-results-20261015.json)。这些结果只验证配置、传输合同与编排边界，没有启动模型、训练或实验，不改变前述科学复现评分和冻结方法验收结论。仓库外的历史运行证据未随本次同步上传。
