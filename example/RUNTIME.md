# 示例运行准备

`research_proposal.txt` 描述研究问题、假设、数据和评估方案；`workflow.json` 及随附 skills 定义角色和执行方法。本页集中说明运行所需的环境与资源。课题文件中的实验规模是研究设计，不代表数据、设备或服务已经随仓库提供。

## 通用准备

- 按 [main CLI](../sdk/docs/main-cli-zh.md) 安装 Node.js、对应 Harness，并配置网关、模型和推理档位。
- 使用已有的任务 workspace；运行状态 dataDir 与其分开且互不包含。确认数据版本、划分、评测入口、可修改范围，以及累计时间、费用和作业预算。
- 示例涉及的数据集、评测器、模型权重和外部服务需按课题及方法协议准备；缺失资源应记录为未完成，不能用模拟结果冒充真实实验。
- 有 `skills/` 的示例需携带整个目录；内嵌 Skill/MCP 的示例使用 `workflow.json` 中的资源。方法细节见各 Skill 的 references 或内嵌 `method-protocol`。
- 本次修改文件不启动研究实验。实际启动时，训练、部署、外部发布和设备操作仍遵循各工作流已有的授权与资源检查。

## 内嵌 MCP 的环境变量

在启动 CLI 的进程环境中设置下列变量。变量值和凭据不写入研究课题文件。

| 示例 | 环境变量 |
| --- | --- |
| AI Scientist v2 | `SCIENCEEVOLVE_AISCI_DEPENDENCY_ANCHOR`、`SCIENCEEVOLVE_AISCI_PUBLIC_PROXY_URI`、`SCIENCEEVOLVE_AISCI_SCIENCE_ROOT` |
| AlphaEvolve | `SCIENCEEVOLVE_ALPHA_SCIENCE_ROOT` |
| Kosmos | `SCIENCEEVOLVE_TODO_SCIENCE_ROOT` |
| InternAgent 1.5 | `SCIENCEEVOLVE_INTERNAGENT_BACKEND_URL`、`SCIENCEEVOLVE_INTERNAGENT_BACKEND_TOKEN`、`SCIENCEEVOLVE_INTERNAGENT_SCOPE_ID` |
| Biomni-R0 | `SCIENCEEVOLVE_BIOMNI_R0_BACKEND_URL`、`SCIENCEEVOLVE_BIOMNI_R0_BACKEND_TOKEN`、`SCIENCEEVOLVE_BIOMNI_R0_SCOPE_ID` |
| 化学 Coscientist | `SCIENCEEVOLVE_COSCIENTIST_BACKEND_URL`、`SCIENCEEVOLVE_COSCIENTIST_BACKEND_TOKEN`、`SCIENCEEVOLVE_COSCIENTIST_SCOPE_ID` |
| Raven Host | `SCIENCEEVOLVE_RAVEN_BACKEND_URL`、`SCIENCEEVOLVE_RAVEN_BACKEND_TOKEN`、`SCIENCEEVOLVE_RAVEN_SCOPE_ID` |

无需认证时，`BACKEND_TOKEN` 显式设为空字符串，仍须提供对应的环境变量。每次研究使用独立的 scope。后四类后端需要实际实现或接入原子工具；仓库中的桥接器本身不提供训练器、设备或科研算法。接口、权限和恢复机制见 [后端合同](../scripts/example-workflows/BACKEND-CONTRACT.md)。

## 各示例的额外准备

| 示例 | 运行前需要准备或确认 |
| --- | --- |
| AHE | workspace 中的 `agent.py`、固定 `evaluate.py` 与笔记问答测试数据；入口为 `answer(question, notes)`，评测输出 `score`。候选仅修改 `agent.py`，保留接口并使用 Python 标准库。 |
| 软件开发 | Node.js 标准库与内置测试框架；临时数据目录。`TODO_DATA_FILE` 指定持久化文件，默认 workspace 的 `todos.json`。 |
| Agent Laboratory | Python、文献检索、实验和 LaTeX 环境；单实验室模式 `agentRxiv=false`，逐阶段确认 `human_in_loop`。方法默认 `max_steps=100`、`mlesolver_max_steps=3`、`papersolver_max_steps=5`、`compile_pdf=true`、`review_override=true`、`review_total_steps=0`。 |
| AgentRxiv | 各实验室 ID、独立 workspace、实验室数量、每个实验室的 `num_papers`、archive URL 与共享 uploads 绝对路径；沿用 Laboratory 的 solver、review 和 human 参数。 |
| AI Scientist v2 | 固定数据清单中的 Iris / breast-cancer 输入、四阶段预算、CPU、vision 和 ICML 论文编译服务，以及独立科学状态和 Git 仓库。 |
| AlphaEvolve | 固定版本官方 notebook 的初始程序、Task prompt 和几何验证器；保留 EVOLVE-BLOCK 与 SEARCH/REPLACE。示例方法以两个分支各 3 个候选、异步队列、每次 construction 60 秒 CPU、n=8 筛选与 n=26 两种子验证运行。 |
| ARIS | 研究说明、参考论文或基础仓库、数据与评测入口；作者和 reviewer 使用不同模型家族。方法默认 `AUTO_PROCEED=true`、`CODE_REVIEW=true`、`REVIEWER_DIFFICULTY=medium`、`RESUMABLE=true`；开启 `AUTO_WRITE` 时配置 VENUE 与 LaTeX/PDF。随附投稿检查工具另需其规定的模型与 proof-checker 档位。 |
| autoresearch | 固定 checkout、专用实验 workspace、运行 tag 和初始 master 提交；数据缓存、uv 依赖和单 GPU。只修改 `train.py`，固定 `prepare.py` 和依赖，每个候选训练 300 秒；提前设置总实验上限。 |
| Biomni A1/E1 | E1 解释器、数据湖、所需数据库与 Python/R/Bash/CLI 工具；默认 `self_critic=false`、`test_time_scale_round=0`。 |
| Biomni-R0 | 已溯源的原始 training/reward recipe、基础权重、E1 环境、固定任务划分、GPU trainer 与部署服务；设置累计训练、时间和费用预算及适用的 authorizationId。缺少原 recipe 时停在准备阶段。 |
| 化学 Coscientist | 与设备及 firmware/API 匹配的手册、Task manifest、编译、执行和真实测量服务；实验方案、累计实验预算与物理实验 authorizationId。历史数据分析和模拟不能作为物理实验完成证据。 |
| Google AI co-scientist | 文献和资料检索、领域预测工具、持久化假设池；设置评价标准、资源预算、终止条件与是否仅保留新颖候选。按课题准备实验接口。 |
| DrugEvolve | Task workspace、Python 环境、`config.json`、run-dir、固定数据划分、基线及训练/评估 launcher；在 run_spec 设置轮数、patience、失败上限、单次训练时限与停止条件。 |
| 通用科研 | 数据、固定模型与评测器，以及可计量的推理预算；检索、实验、绘图与报告所需工具。 |
| FunSearch | `specification.py`、固定 test inputs JSON、实现 `create_sandbox` 的适配器及 Python 环境。方法默认 10 岛、每 prompt 4 个样本、温度参数 0.1/30000，每 14400 秒重置弱半岛；提前设置总预算。 |
| InternAgent 1.5 | 固定 Task manifest、评测器、KG/检索/embedding、SPM/TEM/SKM 和图增强 Monte Carlo 数值接口；至少两轮及跨轮反馈所需的累计预算。 |
| Kosmos | 固定版本 kosmos-figures 的原始 CSV、CPU 分析环境、文献检索与 SQLite world-model；两轮分析中保留来源和 claim IDs，后续轮次消费已有证据。 |
| Meta-Harness | 固定版本的 text_classification Task、MemorySystem、数据与配置，指定 run_name；固定 Task 模型与种子。默认搜索 20 轮、每轮 3 个候选；默认不执行 finalize/test，需要在冻结搜索结果后明确开启。 |
| Raven Host | Task manifest、roster、instance、节点依赖、领域工具与预算。默认 strict-host，当前 SDK 的完整动态 DAG/在线控制缺口会阻断；显式选择 limited-batch 时仅使用两个预绑定 specialist 槽位，不能据此声称完整 Raven 方法验收。 |
| Robin | Edison 访问、原始数据、实验接口与交接人；指定实验轮数和结束条件，方法默认 `num_queries=3`、`num_assays=3`、`num_candidates=5`。 |
| RRSI | 固定 Task policy、grader、token 计量、组件约束和 evolve/heldout/smoke 清单；按 Skill 的 environment.md 配置评测。默认 eng profile：T=40、k=4、m=2，编辑预算 1..4、w=3、探索槽 1、repair_rounds=5；新 Task 以 delta=null 按 H0 校准。 |
| SciAgents | 图谱及来源、embedding/tokenizer/model、GraphReasoning、文献检索与 PDF 渲染；默认 automated 模式，也支持 fixed。 |
| ScientistTwo | 人类基线论文/代码、全量结果和数据，固定可改范围、subset/full 划分、统计方法、种子与重跑容差；准备检索、全文、LaTeX、PDF 视觉检查和绘图。方法首轮 3 个候选、默认种子池 6 个、总实验最多 4 轮，4 个 full Good 时提前结束。 |

这些默认参数来自现有示例及方法协议。实际配置以当前 `workflow.json`、随附 Skill 和已接入服务的能力为准。
