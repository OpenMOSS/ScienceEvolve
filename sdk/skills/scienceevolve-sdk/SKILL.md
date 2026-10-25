---
name: scienceevolve-sdk
description: 根据需求设计、编写和校验 ScienceEvolve workflow.json，通过默认 main 引擎的 scievolve CLI 或 @scienceevolve/sdk 启动、观察、暂停和恢复多 Agent 科研/开发工作流。
---

# ScienceEvolve workflow 设计与运行

交付可校验的 workflow.json、UTF-8 research_proposal.txt 和完整启动命令。research_proposal.txt 写具体研究问题、假设、数据与评估方案；环境变量和运行参数写入配套运行说明。Node API 仍用 requirement 字段传入该文本。只要求配置时不启动付费任务；要求执行时检查实际运行与交付证据。使用现有合同，不发明 steps、dependsOn、maxSteps 等字段。

## 直接带 workflow.json 启动

```sh
scievolve workflow validate ./workflow.json
scievolve start ./workflow.json ./research_proposal.txt \
  --data-dir /absolute/path/to/new-main-data \
  --workspace /absolute/path/to/your-project \
  --gateway-bindings /absolute/path/to/bindings.json
```

`start` 与 `run start` 等价，直接接受 workflow 文件，不需先导入或注册。验证离线运行；start 需要 Node >=24、可用 Harness 和显式部署绑定。bindings 例如 `{"defaultGatewayId":"实际网关ID"}`，不是密钥；先导入/配置并测试所有实际模型路线，见 [部署、CLI 与 API](references/usage.md)。JSON、需求路径相对当前目录；dataDir 必须绝对。

默认入口是 main，项目 example 和 [配置模板](assets/workflow.json) 已迁移。CLI --workspace 与 API start.workspace 已支持新引擎；legacy 引擎已移除，旧 gatewaySource 与旧运行数据不能直接用于当前版本。

## 从需求到配置

1. 区分 **Task** 与 **research workflow**。Task 是被研究/优化的对象及其执行反馈；workflow 负责研究决策。Task 内部有 Agent 不等于要增加 workflow 节点。MetaHarness 改 Task harness，co-scientist 改假设，普通单层迭代保持 `allowMainReconfiguration: false`。仅需修改研究流程本身时启用 Evolver。
2. 确定目标、输入来源、修改范围、真实工具/模型、预算、验收证据和停止条件。每批 maxIterations 不等于总预算。沿用用户已指定的选择；不同模型家族评审不能统一覆盖成一个模型。
3. 读 [workflow 合同](references/workflow.md)。明确选择 Git-off v2 共享目录或 Git-on v3 隔离协作，不因引擎名 main 就强制 Git-on。依赖共享 Python 状态、候选池和 Task Git 的现有科研例使用 Git-off；切成 v3 必须重新处理所有文件交接。
4. 按职责划分角色，为每个角色写输入/操作/输出/失败与交接规则，使 instructions、routes、decisionPlans、termination 一致。复制整个具名方法目录，保留相对 Skills 与上游资产；不要只复制 JSON。
5. 填入实际 model、harness、权限与显式能力列表。当前 main 的脚本沿用宿主统一启动环境；新配置省略 proxy，旧字段在规范化时忽略。网络要求在宿主部署中配置。
6. 模型认证在部署中绑定。思考策略使用 `gatewayReasoningOption`，对应模型的 option 必须配置并精确探测；不要继续写会被 main 归并丢弃的旧 reasoningEffort。Codex 原生 OAuth 不要求 API key，但与网关思考选项互斥，Git-off 原生 exec 不继承用户 config 推理设置。不能声称它保留原 high/xhigh。
7. 在 requirement 写清输入路径/清单；Git-off 指定 workspace 时直接在原目录执行，省略时用内部共享目录，后续角色和恢复复用同一目录。API workspace 须绝对路径，CLI 相对启动目录解析；目录已存在、非链接，与 dataDir 互不包含。工作目录通过 workspace 配置。Git-on 从 workspace 当前文件开始，仍隔离执行，正式完成并集成后自动回写；冲突不覆盖，处理后显式 sync-workspace。原 Git 历史/暂存区不变。sourceWorkspace 只读、不自动回写，与 workspace 互斥。不能把旧运行数据当源码种子迁移。

dataDir 保存状态，不是业务 workspace。重配置只编辑本轮注入的 proposal path：外部 Git-off 使用 `.scienceevolve/management/<projectId>/proposal/workflow.json`，跨调用保留草稿和原根配置；apply_workflow path "workflow.json" 是逻辑别名。已接受的 Project Skill/MCP 定义保持不可变，内容调整使用新定义名称并更新引用。

Codex Git-off workspace 可运行共享目录中的 shell；Claude Code workspace 只读工具及注入的文件工具，不提供 Bash，需要执行脚本时选择 compute（有 Bash）或任务实际需要的 yolo。非 yolo 的 Git-on 常驻 Agent 不应假定有原生 shell，先核对所需工具承载；prompt 不会赋予缺失能力。

## 科研方法完整性

具名方法的 example 与 README TODO 互斥。先固定上游版本，逐项核对阶段、分支、候选数、循环、选择/排名算法、评审、失败处理、终止规则和必需工具。缺一项就保留 TODO，不发布“可表达/简化版”来冒充完整方法。已有新版时不再增加旧版。

允许模型、Harness、工具、会话承载的等价能力替换，记录“上游能力 → workflow/Skill/工具 → 真实输入输出 → 验证”对应关系。原子算法可以直接复用，不能黑盒启动另一套完整自治系统。外部数据、GPU、知识服务和湿实验工具是运行前提，不要求在 workflow 内重建共享服务；缺资源时报告阻断，不能以聊天/模拟数据替代。

Google co-scientist 可按已确认边界同步调度、用文件持久假设池；不要将这项许可泛化到其他方法。Task Git 回退不等于 Agent 会话联合回退；main 已有 Git/v3 协作能力，但不能未经核对就把任意动态 DAG、运行中 replan 或外部实验回滚说成已支持。

## 验证、运行与恢复

先离线 validate，再核对 Skill 完整暂存、权限与实际工具；配置合法不证明科研流程已跑通。CLI 缺失时按项目 README 从源码或 tarball 安装，不猜测 registry 包名。运行时记录 run.started.runId，用 run.result 的 status 判断状态，只有 completed 表示 SDK 完成；Git-on 原目录交付还须 workspaceDelivery.status 为 synced，并检查真实成果与验收证据。

Ctrl+C/SIGTERM 请求安全暂停，等待 CLI 退出并打印可复制的 resume 命令。同一 dataDir 一次只能有一个宿主；list/show/events 打开宿主也可能自动恢复，运行中看前台事件流。Git-off cancel 终态不可恢复；Git-on cancel 是可恢复 Stop。沿用原 dataDir/runtime-config/run ID，不能再次 start 当恢复。详见 [运行说明](references/usage.md)。

交付时列出文件、关键路由/终止条件、验证结果和可执行命令。真实运行时补充 run ID、最终状态、产物与未解决项；模拟模型/路由测试不作为论文结果复现证据。
