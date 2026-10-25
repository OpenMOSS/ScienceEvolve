# 读取 workflow 启动（main 新引擎）

[default-workflow.json](default-workflow.json) 是已迁移的五 Agent 科研模板，显式 `git.enabled: false`。Agent 共用你指定的已有目录，不复制到另一份代码目录；状态目录另行指定。

[research_proposal.txt](research_proposal.txt) 提供具体课题：固定推理预算下，独立复核是否提高数学应用题正确率。文件包含假设、数据设计和评估方案；模型、工具和算力配置由 workflow 与运行环境提供。Node API 仍通过 `requirement` 字段传入研究计划文本。

需要 Node >=24 和对应 Harness。先在独立 dataDir 配置网关，例如：

```bash
scievolve gateway import --data-dir /absolute/path/sdk-run-data \
  --harness codex --model nex-agi/Nex-N2-Pro --source profile
scievolve gateway test GATEWAY_ID --data-dir /absolute/path/sdk-run-data \
  --harness codex --model nex-agi/Nex-N2-Pro
scievolve workflow validate /absolute/path/default-workflow.json
scievolve start /absolute/path/default-workflow.json /absolute/path/research_proposal.txt \
  --data-dir /absolute/path/sdk-run-data \
  --gateway GATEWAY_ID \
  --workspace /absolute/path/task-project \
  --title '科研任务'
```

把路径替换为本目录配置及 [research_proposal.txt](research_proposal.txt) 的实际位置，GATEWAY_ID 替换为 import/add 返回的 ID。import 不改原生配置，不探测模型；test 和启动会真实调用模型，可能产生费用。也可用 `gateway add` / 明确的原生 Codex 登录别名，详见 [main CLI 文档](../docs/main-cli-zh.md)。

workspace 必须已存在，与 dataDir 分开且不能互相包含；CLI 相对路径按启动目录解析，API 的 `sdk.start({ workspace })` 要求绝对路径。后续轮次和重开使用保存的绑定。省略 workspace 则使用 dataDir 内该任务的默认工作目录；旧引擎的数据不会自动迁移。

模板保留 `nex-agi/Nex-N2-Pro` / Codex；更换时编辑 Agent model/Harness 或同时传 `--model` / `--harness`。不再用隐式 `gatewaySource` 和旧 `reasoningEffort` 字段；思考强度应在真实网关模型配置中定义受支持选项，并绑定具体 `gatewayReasoningOption`。不能假定不同网关共享 high/xhigh ID。默认 execution 的 compute 权限和 Inspire Skill 还需要真实算力工具；本地配置/模拟调度通过不等于科研任务已验收。

源码中可用 `node sdk/cli/scienceevolve.mjs` 替代 `scievolve`。更完整的源码科研方法模板见 [example 使用说明](../../example/README.md)。

## 单独的 Git 协作样例

[main-runtime/workflow.json](main-runtime/workflow.json) 是 main v3 / Git-on 样例。现在也接受 workspace：导入原项目，在受控 worktree 中执行，正式完成后自动回写原目录。它会真实创建仓库、分支及 PR；先检查仓库设置、账号权限和 [main 迁移文档](../docs/main-runtime-migration-zh.md)。

新增 [已有项目](existing-project/workflow.json)、[重配置](workflow-reconfiguration/workflow.json) 和 [并行 Git 审计](parallel-git-review/workflow.json) 样例。部署、API、冲突处理与验证边界见 [工作目录样例说明](workspace-examples.md)。它们展示 SDK 机制，不算尚缺的科研方法复现。
