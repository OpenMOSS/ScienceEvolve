# 已有项目、重配置与并行 Git 示例

[← 返回 SDK README](../README_zh-CN.md) · [English](workspace-examples-en.md) | **简体中文**

下面演示已有项目执行、工作流重配置和并行 Git 协作。使用当前 main 引擎，需要 Node.js 24+ 和已配置的模型网关。

| 配置 | 场景 | 工作目录 |
| --- | --- | --- |
| `existing-project/workflow.json` | 实现 → 独立审计 → Main 验收/修复循环 | Git-off，直接使用指定 workspace |
| `workflow-reconfiguration/workflow.json` | Main 修改 worker prompt 并正式 apply_workflow | Git-off，保护 workspace 根部原 workflow.json |
| `main-runtime/workflow.json` | 实现 → 审计的 Git 集成 | 从原 workspace 导入，在受控 worktree 执行，完成后自动回写 |
| `parallel-git-review/workflow.json` | 两个独立审计节点并行，组长聚合 | 同上；保留现有每 Agent worktree 策略 |

将每个 Agent 的 model 改为真实 ID，或同时传 `--model` 和 `--harness`。不要填写 key、URL、旧 `gatewaySource`。在同一个独立 dataDir 中先 `gateway add/import` 和 `gateway test`，得到 GATEWAY_ID。需求文件请明确可修改范围、测试命令与完成标准。

```sh
scievolve start /absolute/path/workflow.json /absolute/path/requirement.txt \
  --workspace /absolute/path/existing-project \
  --data-dir /absolute/path/sdk-run-data \
  --gateway GATEWAY_ID --title '已有项目验收'
```

workspace 必须已存在，与 dataDir 分离且不能互相包含。API 使用绝对路径：

```js
const workflow = await loadWorkflowConfig('/absolute/path/workflow.json');
const run = await sdk.start({ title: '已有项目验收', requirement: '具体要求', workflow,
  workspace: '/absolute/path/existing-project', gatewayBindings: { defaultGatewayId: gateway.id } });
const result = await run.wait();
console.log(result.status, result.workspaceDelivery);
```

Git-on 还需要 GitHub 权限，会真实创建/推送仓库、分支和 PR。先修改 repositoryName，使用专用私有仓库；并行样例需 deployment 的 `execution.agentConcurrency >= 2`。token 只通过部署环境引用/可信 credentialResolver 提供，见 main CLI 文档。串行样例也保留隔离 worktree，本轮未更改策略。

给业务 Agent 的指令应写清：写文件 → 暂存/业务提交 → git_push → PR → 规定目标合并 → finish_task。git_push 不自动创建提交，`not_committed` 不能当作成功。重试用相同 callId/参数，已接受的完成收据不改写；网络或机制问题通过 Main 协调恢复。

Git-on 只有正式完成、结果集成到受控 main 后才回写原目录；运行期间原目录不受 Agent 修改。不会对原 `.git` 做 commit/reset/pull。若用户同时编辑了将被替换的文件，回写报告 conflict，保留生成结果和备份，不覆盖该文件；解决冲突后显式 `run sync-workspace RUN_ID`。可另行 `run export`，不要求每次手动导出。

重配置样例的物理提案路径在 `.scienceevolve/management/<invocation>/proposal/workflow.json`，以实际 Inbox 为准；官方 `apply_workflow(path: "workflow.json")` 的逻辑别名不变。不允许把原业务目录的配置文件当作提案。

本地加载/模拟内核测试只验证合同；真实验收范围见 [2026-10-06 测试报告](../docs/workspace-main-acceptance-20261006-zh.md)。并行科研方法、外部实验依赖和算法 fidelity 需分别补齐，不能用通用并行审计代替。
