---
name: inspire
description: "Inspire Platform Operating Model For Agents: Decide Workspace, Resources, Paths, Workload Type, Observation, Cleanup, And Load Focused References; Use CLI Help For Command Syntax."
---

# Inspire Skill

## ScienceEvolve 的 MCP 入口

ScienceEvolve 的 compute Agent 使用自动注入的 `scienceevolve-sii` MCP；本 Skill 保留为旧配置的兼容入口，以下平台知识继续适用。`sii_command` 接收 CLI 参数数组，提供原有账号/资源查询、Notebook 执行与文件流转、Job/HPC/Ray/Serving、镜像、模型仓库、观察与清理能力；命令表面可用 `sii_command` 查询 `--help`。用 `sii_read_knowledge` 按需读取本文件和 references。

长实验优先使用 `sii_submit_experiment`。提交后系统在代码中监测状态，并在完成或失败时通知本会话。你可以继续当前任务内不依赖结果的工作；需要让出执行时调用 `sii_defer_task`，保存实验 ID 和你自己的恢复上下文，然后自然结束本轮调用。当前任务保持未完成，后继节点等待；收到通知、处理必需结果并满足目标后，再使用现有任务完成/路由工具。不要以 Shell 循环、持续日志 follow 或重复模型调用代查实验状态。按需诊断、是否重提、验收产物和资源清理由你判断。

Notebook/Ray/Serving 等常驻资源上的实验可沿用后台程序和 Sentinel 思路：在允许的工作路径中原子写入 JSON `{ "run_id": "本次 request_id", "exit_code": 0 }`，提交时指定 `completion_file`；失败时写实际非零退出码。系统代查该文件；资源 RUNNING 本身不表示实验完成。仅创建常驻资源时显式声明 `required_for_task=false`。

复用已有 Notebook/Ray/Serving 时，在启动每次后台程序前调用 `sii_register_experiment`，提供资源 kind/name/workspace、新的 `request_id` 和完成文件；再自行用 `sii_command` 执行程序。这个入口只登记监测，不创建或重启资源，也不替你启动科研程序。同一资源可登记多次独立实验，每次使用新的 run_id，避免旧完成标记误触发。

先申请常驻资源再启动程序时，可将 create 声明为资源启动（`required_for_task=false`、不提供完成文件），主动 defer 等其 `resource_ready` 通知；这只说明资源已可用。随后自行登记并启动实际实验，结果必需时使用默认 true 和本次完成文件。不要把资源就绪当作科研程序完成。

Notebook 创建由 MCP 固定添加 `--no-wait --post-start none`，避免 CLI 默认等待启动或执行配置里的启动后动作。显式启动后脚本需分阶段执行：等待 `resource_ready`，按 Notebook reference 准备连接，再登记并启动后台程序。新账号或新 Notebook 没有连接缓存时，先用 `sii_command` 执行 `notebook connection refresh`，明确 workspace 和可用公钥路径；不要把连接配置错误当作科研程序失败。

`inspire` 是启智平台的本地命令入口。这个 Skill 不复述 CLI 使用手册；命令组、子命令、参数、默认值和示例始终以 `inspire --help` / `inspire <group> --help` / `inspire <group> <subcommand> --help` 为准。

本文件只保留超出 `--help` 的平台判断：任务落在哪个 Workspace，资源条件和远端路径如何分离，公网和 SII 内部源怎么取舍，Notebook / Job / HPC / Ray / Serving 如何选型，以及观察、止损、清理闭环。

## 1. 先建模，再查命令

每个任务先拆成四个平面，再去查具体 CLI Help：

| 平面 | 要回答的问题 | 不要混淆 |
| --- | --- | --- |
| 调度条件 | 跑在哪个 Workspace / Project / Compute Group，用多少 GPU / CPU / 内存 / Shared Memory，基于哪个镜像 | 不是远端路径，也不是对象名字 |
| 远端文件 | 代码、数据、权重、Checkpoint、产物放在哪个共享盘路径 | Path Alias 不能代替 Workspace / Project / Group / Quota |
| 工作负载 | 需要交互调试、GPU 后台任务、CPU Slurm、Ray 弹性集群，还是模型服务 | 不要为了“能跑”把所有事都塞进 Notebook |
| 观察收尾 | 如何判断排队、失败、空转、已完成，以及何时 `stop` / `delete` | `status=RUNNING` 不等于业务健康，`status=SUCCEEDED` 不等于产物完整 |

`workspace`、`project`、`group`、`quota`、`image` 是核心调度条件，没有隐式默认值。创建 Workload 时显式传入，或用 Workload Profile 保存。GPU Job Shared Memory 属于资源细项，不等同于 `quota` 的内存字段，且不能超过 `quota` 的实例内存；需要时查 `job create --help` 或 [`references/compute-workloads.md`](references/compute-workloads.md)。Path Alias 只表示远端路径，服务于 `--cwd`、`scp`、日志路径和共享盘约定。

### ScienceEvolve 项目点券归属（强制）

ScienceEvolve 科研项目中的 Execution Agent 创建或启动任何 Inspire Workload 时，点券必须来自项目 `具有能动性的科学大模型`。所有 `notebook create`、`job create`、`hpc create`、`ray create`、`serving create` 及其 Workload Profile 都必须显式设置 `--project 具有能动性的科学大模型` 或等价的 Profile project 字段；不得依赖 Active Project，不得静默改用其他项目。

提交前用 Live `config context` 和 `project detail` 确认该项目在目标 Workspace 可见、状态可用且点券余额可用。若验证失败，停止提交并向用户请求处理；不得为了让任务启动而切换点券归属。只读查询不消耗点券，可以跨可见 Workspace 检查上下文、Quota、Availability、Status、Events、Logs 和 Metrics。

Compute Group 名称可能承载平台调度区语义，例如 `开发区` / `训练区`。qz 公平调度 Workspace 只接受 `1=LOW`（可抢占）或 `4=HIGH`（稳定），其他 Workspace 保留 `1–10`；CLI 从 live `is_fair_workspace` 能力选择合同。开发区同时支持整节点和碎卡 GPU 任务，训练区优先保障整节点任务，碎卡任务只能用 `1=LOW`。整节点 / 碎卡按每个实例或节点选择的 Live Quota Row 判断，不按多节点任务的 GPU 总数判断；`--nodes` 只放大实例数。选择资源时从同一行复制完整 `group` 和 `quota`，训练区碎卡提交后再从 Status / Events 核实解析后的优先级和调度结果。

资源可用性里 `Available` 是即时空闲 GPU，`Low Pri` 是低优可抢占占用，`High Pri` 是高优任务可能回收的 `Available + Low Pri` 上限；正式提交后仍以 Events / Instances / Metrics 判断调度结果。

日常 Workspace 选择通常很直接：

- `CPU资源空间`：CPU Notebook、联网准备、依赖安装、HPC 数据处理、CPU Ray。
- `分布式训练空间`：GPU Notebook、GPU Job、多节点训练、Serving、GPU 指标观察。
- 国产卡分区、`CI-情境智能` 工作空间或小组专属空间：只有任务明确要求特殊硬件、特殊权限或特殊项目环境时才切换。

## 2. 网络、内部源和镜像

联网能力属于 Workspace / Compute Group 的实际环境，不属于命令本身。先判断要访问的是公网还是 SII 内部源：

- 公网：GitHub、Hugging Face、外部数据源、公开下载地址。目标 GPU 空间不可上网时，先在 `CPU资源空间` 的可上网 CPU Notebook 准备内容，再放到共享盘或保存镜像。
- SII 内部源：PyPI / `pip`、Apt、Conda、PyTorch Wheels、`npm`、Maven、Docker Registry、OSS、NTP 等内部地址。即使没有公网，目标 Notebook / Job 所在环境也可能能访问内部源。

需要内部源地址、快速配置或发行版源选择时，加载 [`references/network-and-sources.md`](references/network-and-sources.md)。不要在 `SKILL.md` 或对话里凭记忆复写内部源清单。

### 远端合规边界

不可上网或 Live Probe 判定 `public_internet=false` 的 H100/H200 等 Notebook 不使用 `inspire notebook ssh` 系列命令。需要命令执行时使用 `notebook exec` / `notebook shell`，CLI 会走 JupyterTerminal 路径；需要文件流转时先把文件放到 `/inspire/...` 共享路径，再通过可上网 Notebook 使用 `notebook scp` 或外部 `rsync` 上传 / 下载。

网络连通性只描述技术能力，不等于合规授权。`public_internet=true` 也不能作为使用任意外部服务的依据；判断服务时看实际接入端点、服务地域、使用条款和项目政策，不按 `codex`、`claude` 等程序名一刀切。

启智远端使用遵守三项合规边界：

- 不可上网区不得通过反向隧道、代理、VPN 或中继绕过网络限制；继续使用平台提供的 JupyterTerminal 和共享路径闭环。
- 不得调用仅限海外使用或明确不向中国境内提供服务的模型 API。
- 不得在远端使用其后端或关键能力不向中国境内提供的 vibe coding（AI 辅助编程）程序或服务。

无法确认服务地域、条款或项目授权时，不在启智远端启动；把 Agent 留在本地或已批准的联网环境，只通过允许的代码、数据和产物通道与远端协作。完整判断见 [`references/network-and-sources.md`](references/network-and-sources.md)。

依赖安装跑通后，优先把运行环境固化为镜像；后续 Notebook / Job / HPC / Ray / Serving 复用镜像，而不是每次启动都重新联网安装。

## 3. 执行闭环

### ScienceEvolve Execution 代理约束（强制）

ScienceEvolve 的 Execution Agent 调用 `inspire` CLI 时，必须在该命令进程中执行 `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY`。

Execution Agent 创建 Workload 前，必须从运行时注入的 `SCIENCEEVOLVE_ROLE_WORKSPACE` 解析当前 Agent 工作区的真实路径和 `/inspire/<tier>/` 存储池；`SCIENCEEVOLVE_INSPIRE_WORKSPACE_ROOT` 只用于校验工作区边界，不是可写死的远端目录。代码、任务工作目录、输入、Checkpoint、日志和结果默认使用当前工作区或其子目录；使用 Path Alias 时必须先确认 Alias 解析到同一 `<tier>`。不得根据 Skill 示例、历史任务或账号默认 Alias 猜测存储池，也不得在路径不可用时静默回退到另一存储池。无法确认当前存储池、Alias 归属或目标项目可见性时，停止提交并请求用户处理。路径判断细则见 [`references/paths.md`](references/paths.md)。

日常执行顺序：

1. 根据用户目标选择最相关 Reference，只读需要的上下文。
2. 用 CLI Help 确认当前版本的真实命令表面。
3. 用 Live 查询确认账号、Workspace、Project、Compute Group、Quota、镜像和资源可用性；不要把本地缓存、旧截图或历史记忆当事实。
4. 准备远端文件和环境。公网准备、内部源配置、镜像保存分别按实际环境选择位置。
5. 提交 Workload。复杂调度条件先 `dry-run` 或先用小规模 Notebook 验证。
6. 系统通过 MCP 后台监测实验状态并通知原会话。你在需要诊断或收到通知后，按需观察 Events / Logs / Metrics / Instances / Status；先看调度事件，再看程序日志，再看资源曲线是否真的在工作。
7. 终态且不再需要的 Notebook、Job、HPC、Ray、Serving 和临时镜像要清理；运行中的对象先 `stop`，再 `delete`。

Name-Only 边界始终有效：普通输入输出使用名称、Alias、可读状态和短表格，不让用户理解或传递平台 Handle。需要平台 Handle 只走专门 `id` 命令或内部 Resolver。

Notebook 连接类命令可跨账号解析已有连接；`--account <name>` 指本地 Account Alias，SSH Tunnel Rebuild 应使用目标 Notebook 所属账号的 Session 和配置。

## 4. 按需加载索引

先按问题类型选一份 Reference；跨边界时再读第二份。不要把 Reference 当命令大全；命令语法回到 CLI Help。

| 用户问题或 Agent 判断点 | 先加载 |
| --- | --- |
| 安装、更新、账号添加 / 切换、首次初始化、`inspire init` 全局发现与项目初始化、SII Proxy Setup | [`references/setup/install-and-config.md`](references/setup/install-and-config.md) |
| 选择 `CPU资源空间` / `分布式训练空间` / 特殊 Workspace，理解 Compute Group、`--quota gpu,cpu,mem`、资源实时查询和 Workload Profile | [`references/resources-and-paths.md`](references/resources-and-paths.md) |
| 需要区分公网、SII 内部源、离线 GPU 空间，或查 PyPI / `pip`、Apt、Conda、PyTorch Wheels、`npm`、Maven、Docker Registry、OSS、NTP 等内部源地址 | [`references/network-and-sources.md`](references/network-and-sources.md) |
| 理解共享盘作用域、存储池、挂载隔离、Path Alias 和远端路径不可见 | [`references/paths.md`](references/paths.md) |
| 创建交互环境、连接 Notebook、SSH / `exec` / `shell` / `scp`、IDE URL、容器 HTTP 服务暴露、基底环境准备、大文件流转 | [`references/notebook.md`](references/notebook.md) |
| 在 GPU Job、CPU HPC、Ray、Serving 之间选型，或提交后观察 Events / Logs / Metrics / Instances / Status，分析排队、失败、空转、优先级和异常状态 | [`references/compute-workloads.md`](references/compute-workloads.md) |
| 一个项目跨越 CPU 准备、数据处理、GPU 训练、部署或交付，需要阶段化计划 | [`references/workflows.md`](references/workflows.md) |
| 选择已有镜像、从 Notebook 保存镜像、注册外部镜像、调整可见性、清理临时镜像 | [`references/image-management.md`](references/image-management.md) |
| 浏览 / 注册模型仓库条目，判断 Model Registry、Model Version 和 Serving 的关系 | [`references/model.md`](references/model.md) |
| 维护 CLI Browser API 封装、排查前端接口合同、Reverse Capture 平台请求，或用户明确要求看接口 | [`references/dev/browser-api.md`](references/dev/browser-api.md) |

## 5. 项目上下文

每个启智项目仓库都必须维护仓库根 `INSPIRE.md`。它只记录项目级启智上下文，不写 CLI 配置，不写本地 Agent 计划。

`INSPIRE.md` 只记录非配置性上下文，例如：

- `Default Image`
- `Path Conventions`
- `Public Directory Layout`
- `Existing Notebooks`
- `Ongoing Jobs`

不要把账号配置、密码、代理密钥、平台 Session、`.inspire/config.toml` 或 `.inspire/accounts/<account>/config.toml` 内容复制进 `INSPIRE.md`。配置事实由 CLI 合并和展示；项目说明只记录人类可读的协作约定。

`AGENTS.md` / `CLAUDE.md` 等文件可以记录本地 Agent 计划和执行风格；启智上下文必须集中在 `INSPIRE.md`，方便不同 Harness、不同成员和未来 Agent 共用同一份项目事实。
