# ScienceEvolve 示例方法映射

[示例目录](README.md) · [可读 Workflow 图册](../docs/readme/workflows/README.md)

**方法导读与执行路由分开。** `Main ↔ 角色` 表示宿主可调度关系，不代表论文顺序。下表说明阶段、反馈与适配边界；阶段／组内图只显示配置中实际存在的边，不新增虚假的论文连线。工具、数据库、外部实验和人类参与不因为没有 Agent 节点就被视作缺失。

这是配置与展示说明，不是科研运行验收。没有模型调用、训练、湿实验或论文数值复现。

## chemical-coscientist

[Nature 系统架构 / Fig. 1](https://www.nature.com/articles/s41586-023-06792-0)：`Planner ⇄ {Web Search, Documentation, Python, Experiment}`。

- 配置的 `web_search/documentation/code/experiment` 均直接返回 `planner`，包括失败与错误；Planner 决定下一动作。
- `optimization` 仅为 Planner 按需委派的分析扩展，不是原论文的独立必经阶段。
- Python 与 Experiment 是执行能力；同名 Agent 负责工具调用及交接。Preflight、授权、audit 属于宿主外围约束；模拟或历史数据不能代替物理实验。

## internagent-1-5

[论文 §2.1–2.4](https://arxiv.org/html/2602.08990v1)：

```text
Generation:   flow_planner ⇄ knowledge
                  ↓
              generation
                  ↓
Verification: verification ⇄ optimization(optimizer_a ∥ optimizer_b)
                  ↓
Evolution:    evolution → generation / flow_planner / audit
```

知识流与假设生成属于 Generation；图增强搜索、实验与复核属于 Verification。`verification` 是 optimization 组 Leader，按当前假设、批次和真实回执区分派工与复核，不能重派已完成实验。Evolution 更新 SPM/TEM/SKM、IdeaGraph 和研究目标。

**限制：** 两个预绑定知识 worker 的固定批次引入屏障，不等同论文任意动态依赖就绪调度；保存 FlowGraph 并不意味着实现了那套调度器。原子后端和科学资源仍须独立准备。

## raven

[官方报告 §3.1–3.3、Algorithm 1](https://github.com/EverMind-AI/Raven/releases/download/tech-report-v1/technical-report.pdf)：原 Host 支持动态 DAG、全部前驱结算后就绪、逐节点 Judge、在线异常处置、动态 instance 与跨图产物。

当前仅 `Main → (slot_a ∥ slot_b) → 批次 judge → Main`。**strict-host 保持阻断；limited-batch 不接受为完整 Raven。** `A → C` 和 `B → C` 是两个到达，不是 AND-join。不能通过增加汇合箭头、重命名 judge 或整批重跑伪装完整语义。

## biomni-r0

[官方 model card](https://huggingface.co/biomni/Biomni-R0-32B-Preview)确认基础权重、E1 和端到端 RL，但不足以核对完整训练、奖励与优化策略。官方报告链接在 2026-11-12 审计时返回 404，不代表从未发布。

`curator → rollout → reward → trainer → deployer → evaluator` 是**待核验的训练合同设计**。没有来源可核验的 recipe 必须停在 preflight；不猜 SFT/PPO/GRPO 等步骤，成品模型推理不算训练复现。

## co-scientist

[论文 §3.1–3.3 / Fig. 2](https://arxiv.org/html/2502.18864v1)：六个核心科学角色与共享 hypothesis/tournament 状态。

```text
Generation → Reflection → Ranking → Evolution
                             ↑          │
Proximity ───────────────────┘          └→ 新候选重新 Reflection / Ranking
Meta-review → 后续生成、反思、排名与进化的反馈
```

这是方法／数据关系，不是新增可执行路由。当前 Main 同步调度代替论文异步 worker/task queue；文件池维护真实状态，但不能因此称异步架构等价。`wetlab` 是外部验证扩展，不是第七个原生核心角色。

## funsearch

[Nature 原文](https://www.nature.com/articles/s41586-023-06924-6)：`Programs DB → best-shot prompt → sample → evaluate → Programs DB`，多岛状态和周期重置在工具中。

配置对齐官方**单线程参考实现**，每个 pending prompt 批次处理完才取下一批；不是论文分布式异步部署。程序数据库不是 LLM 决策角色，不为补图新增 Agent。

## biomni

[论文 Overview / Fig. 1c](https://www.biorxiv.org/content/10.1101/2025.05.30.656746v1.full)：单个 generalist A1 使用 E1 工具／数据／软件环境。

`资源检索 → A1 规划/代码 → E1 执行 → observation → A1 → 最终回答`。多个配置角色是 A1 内部步骤拆分；`bridge.py` 保留单步转移。critic 可选，wetlab 是外接能力；不能把它画成论文原生多科学家团队。

## agentrxiv

[论文 §3.1–3.2 / Fig. 3](https://arxiv.org/html/2503.18102v1)：单 lab 累计研究与多 lab 异步共享都属于原方法。

```text
Lab A（独立 workflow / workspace） ⇄ 共享 archive 服务 ⇄ Lab B（独立 workflow / workspace）
      检索 → 研究 → 发布 → 后续研究实际消费
```

一个配置实例代表一个实验室；`archive` 角色是客户端，不是共享服务器。SDK 课题要求两个实验室，必须分别启动并核验跨轮内容消费，单次启动不能作为多 lab 完成证据。求解器差异同 Agent Laboratory。

## robin

[论文 §2.1](https://arxiv.org/html/2505.13400v1)：`Assay 选择 → 候选筛选 → 人类实验/上传数据 → 并行分析 → 共识 → 洞见 → 下一轮候选`。

外部研究人员执行实验；`analysis` 内部调用远程分析。论文描述 10 条分析轨迹，固定公开 `analyses.py` 为 5 条，适配按代码执行。一个 analysis 节点不等于只有一条轨迹，也不代表实验已实际发生。

## agent-laboratory

[论文 §3.2 / Fig. 3](https://arxiv.org/html/2501.04227v1)：文献 → 计划 → 数据 → 实验 → 解释 → 写作 → 评审；角色可跨阶段复用，评审／人工反馈可回计划。

MLE/Paper solver 内有提案、执行、评分和修复。固定公开 MLE 源码串行处理尝试，候选严格改善时才调用反思；论文描述的批量并行及成功/失败反思不能自动据此认证。星形角色图不是七阶段方法图。

## aris

[固定 research-pipeline](https://github.com/wanshuiyin/Auto-claude-code-research-in-sleep/blob/341f914024d270dc5c8fa51337d1ad38829273aa/skills/research-pipeline/SKILL.md)：`W1 → W1.5 → W2 → summary → 条件 W3`。

评审 continuation 返回发起评审的原阶段；W3 受 AUTO_WRITE 等条件控制。作者侧配置为 Pi，reviewer 保持独立家族。不能把所有角色串成各执行一次的直线，绕过 continuation 和阶段状态。

## drugevolve

[论文 §4.1](https://www.biorxiv.org/content/10.64898/2026.08.16.745117v1.full)：Researcher（Generator ⇄ Inspector）、Engineer（Implementer → Trainer ⇄ Debugger）、Analyst（Judger → 分析／总结）。

`steps.py` 保存实际循环与失败分支，Idea Pool / Experience Pool 反馈下一代；外层 Main 路由不是方法闭环的全部表达。避免用直接路由绕过 phase/request 状态。

## rrsi

[论文 §3 / Algorithms 1–2](https://arxiv.org/html/2609.24972v1)：baseline → 诊断/digest → 编辑预算内提案 → critic/repair → smoke/测量 → 正则化选择 → 下一轮。

控制器维护编辑惩罚、噪声、探索、归因与冻结策略；不是简单最高分获胜。结束后冻结 Harness 再做 heldout，不能用 heldout 调参。图册把候选阶段与最终评测分开。

## sciagents

[论文 Fig. 1–2 / §4.3–4.4](https://arxiv.org/html/2409.05556v1)：图路径 → Ontologist → proposal → 七方面细化 → Critic / novelty。

fixed 模式按固定顺序；automated 模式由管理者选择 speaker。两种模式都存在，不能把所有细化角色强制画成并行，或用一种模式覆盖另一种。

## scientist-two

[论文 §3.1–3.6](https://arxiv.org/html/2609.19644v1)：种子与想法 → subset/full → 消融 → 写作 → review/rebuttal → meta-review。

`protocol.py` 维护 Good / Bad / Engineer 分支：Good 推进，Bad 修订想法，Engineer 修复执行；meta-review 可再实验或保留旧最佳。49 个角色是注册表，不是 49 步线性执行。图册有 **9 张阶段细节图**，覆盖全部角色，保留阶段间状态和失败条件说明。

## ai-scientist-v2

[论文 §3.2–3.4 / Fig. 1–2](https://arxiv.org/html/2504.08066v1)：idea → manager ⇄ experiments → writer → reflector → reviewer。

四个实验阶段、checkpoint、replication/aggregation 与 VLM 检查在 manager/tree tools 内；两个 worker 不代表只有两个阶段。独立 reflection 在最终 review 之前，不因缺 reviewer → writer 直连而添加论文未要求的回边。当前是缩小任务适配。

## kosmos

[论文 §2.1 / Fig. 1](https://arxiv.org/html/2511.02824v1)：规划 → 数据/文献轨迹 → 周期 world update → 再规划/报告。

SDK 独有示例；两条轨迹、两轮为缩小配置。world model 为工具状态，下一周期须实际消费带来源的旧证据；原方法按 cycle 更新，不误要求完全异步。主项目不额外加入可执行配置。

## alphaevolve

[论文 §2.2–2.6 / Fig. 2](https://arxiv.org/html/2506.13131v1)：parent/inspirations → 生成 → 评测 → 程序数据库反馈。

SDK 独有示例；异步反馈可被 worker 内后续候选消费，不添加全局逐代屏障。程序库与验证器是工具基础设施；固定几何任务和预算为缩小适配，不等于论文全规模。主项目不额外加入可执行配置。

## metaharness

[论文 §3 / Algorithm 1](https://arxiv.org/html/2603.28052v1)：基线 → 提案 → 评测 → 日志/筛选 → 再提案。单 proposer 外围的执行与分析角色是宿主拆分；搜索与最终 test 分离，参考文本分类任务不代表所有论文实验。

## autoresearch

[固定 program.md](https://github.com/karpathy/autoresearch/blob/228791fb499afffb54b46200aca536f79142f117/program.md)：baseline → 修改 train.py → 固定时长训练 → keep/discard/crash → 再实验。角色拆分是适配；单次训练预算与总研究预算分开。

## 01-ahe-evolve

入门代码自进化示例：execute → judge → optimizer → execute，Loop 批次退出由 Main 裁决。不认证为 AHE 论文完整系统。

## 02-software-development

入门开发测试示例：coding → testing，失败修复、通过后按条件交付；不作论文复刻认证。

## dynamic-research-workflow

通用科研分工：idea、execution、writing、review 与 Main；不对应一篇固定论文。
