# 部署、CLI 与 Node SDK（默认 main）

[← 返回 SDK README](../../../README_zh-CN.md) · [English](usage-en.md) | **简体中文**

需要 Node >=24。Codex/Claude Code/DSH 按需安装；Pi 随包提供。
每个 main dataDir 都是显式指定的绝对路径，不能复用 legacy/Web/其他 runtimeRevision 的数据。
运行中同一目录只能有一个宿主。密钥不进入 workflow、需求或输出。

## GitHub 凭据（Git-on）

Git-off 不需要 SDK GitHub 凭据。Git-on 使用宿主的 tokenEnv、git.credentialResolver 或 HTTPS Git credential helper，无需注册 Web 的 OAuth App；模型登录与 GitHub 授权分别配置。tokenEnv 在 `--runtime-config` 中指定环境变量名，SDK 不自动读取 GITHUB_TOKEN 或 Web `.env`。先完成 [GitHub 身份与权限预检查](../../../docs/main-cli-zh.md#github-身份与权限预检查)，再以同一 dataDir、网关绑定和 runtime-config 启动/恢复 Git-on v3。详细步骤见 [GitHub 认证手册](../../../docs/main-cli-zh.md#github-认证与-git-协作)。

## API-key 路线

启动时附带文件/图片：`--inputs /absolute/materials` 或 `--inputs-file /absolute/inputs.json`。
workflow 顶层也接受 `inputs` 与 `inputDescription`；经 loadWorkflowConfig/CLI 加载时，材料路径相对 workflow 文件解析。
显式 start/CLI 参数分别覆盖同名字段，缺省则沿用 workflow；`inputs: []` 禁用默认材料，空字符串清空描述。
直接 validateWorkflowConfig 处理相对源路径时必须提供绝对 baseDir；验证不读取或复制材料。两种 CLI 材料参数
互斥；JSON 为字符串或 `{ "path": "../image.png", "name": "figures/image.png" }` 数组，
相对源路径按 JSON 文件目录解析（`--inputs` 按启动目录解析）。Node 使用
`sdk.start({ ..., inputs: ['/absolute/materials', {path: '/absolute/image.png', name: 'figures/image.png'}], inputDescription: '参考材料' })`。
SDK 源路径须绝对，目录默认保留自身名称及下级路径，name 为可移植相对目标名称/前缀。
描述去除首尾空白后最多 2000 字符。输入在首个 Agent 运行前复制到共享 `user_inputs`：
Git-off 位于实际工作区，Git-on 位于私有项目 `workspaces/user_inputs`，独立于 worktree，
不自动提交/发布。最多 1000 文件、单文件 50 MiB、总计 200 MiB；拒绝链接及目标冲突，绝不覆盖。
材料内容是非可信参考数据，不是指令；不要附带凭据。可通过快照 `userInputsPath` 定位共享目录手动补充，
后续补充不会自动通知/重启 Agent 或更新初始 `inputFiles` 清单。共享只读策略不是绝对不可修改保证，
尤其 Git-off/yolo 的父目录可能可写。

```sh
# 环境已有 SDK_CODEX_BASE_URL、SDK_CODEX_API_KEY；也可用 --source profile。
scievolve gateway import --data-dir /absolute/new-main-data \
  --harness codex --model ACTUAL_MODEL --source env
scievolve gateway test GATEWAY_ID --data-dir /absolute/new-main-data \
  --harness codex --model ACTUAL_MODEL --reasoning-option high
scievolve start workflow.json research_proposal.txt --data-dir /absolute/new-main-data \
  --workspace /absolute/your-project \
  --gateway GATEWAY_ID
```

示例模板使用 high 思考选项，必须在导入前用 SDK_CODEX_REASONING_FILE（或 JSON）
定义模型映射。使用其他 Harness 时换成 SDK_PI / SDK_DSH / SDK_CLAUDE_CODE。
例如上游确实支持 Responses reasoning.effort 时：

```json
{"ACTUAL_MODEL":{"parameter":"reasoning.effort","options":[{"id":"high","label":"High","value":"high"}]}}
```

parameter/value 取实际供应商合同，不猜测。也可 `gateway add --reasoning-file FILE`
配置映射。支持 reasoning_effort、reasoning.effort、chat_template_kwargs.reasoning_effort、
thinking.effort。不要移除需求指定的思考档位以绕过探测；没有档位要求的新配置可省略
option 并明确使用 Provider 默认策略。必须逐 Harness/model/option test。

profile 导入是 API-key 配置的一次性复制；不是 Codex 原生 OAuth 登录路线。
API-key 自定义 provider 也用网关路线。model 不从 profile 默认值覆盖。

多网关使用 --gateway-bindings FILE（与 --gateway 互斥）：

```json
{"defaultGatewayId":"AUTHOR_GATEWAY_ID","agents":{"reviewer":"REVIEW_GATEWAY_ID"}}
```

不能对 ARIS 等跨家族方法使用全局 --model 覆盖破坏独立审查。

## Codex 原生 OAuth

原生登录不用额外 API key，不提取 OAuth token。deployment.json 注册目录别名：

```json
{"nativeCodexProfiles":{"login":"/absolute/path/to/.codex"}}
```

workflow 的这些角色必须是 codex，不能带 gatewayReasoningOption；不能默认宣称与高思考
网关方案等价。现有带 high/xhigh 的模板需要先明确替换策略，再另存配置并删除对应 option。
原生 Git-off exec 忽略用户 config/rules，显式使用官方 openai provider；不会沿用自定义中转。

```sh
scievolve start workflow.native.json research_proposal.txt --data-dir /absolute/new-native-data \
  --runtime-config /absolute/deployment.json --native-codex-profile login
```

恢复必须保留同一别名映射。多角色混用可在 bindings.agents 中写
`{"nativeCodexProfileId":"login"}`；全原生也可用 defaultNativeCodexProfileId。
其他部署配置可包含 harnesses（绝对可执行文件或 JS CLI 路径）、skillRoots、execution、timeouts、
Git 凭据环境变量名；不能沿用旧 executable+args 对象或顶层 agentConcurrency/compute。
例如 `{"harnesses":{"codex":"/absolute/bin/codex"},"execution":{"agentConcurrency":2}}`。

## 输入目录与生命周期

新引擎接受 CLI --workspace（相对启动 cwd 解析）和 API start.workspace（绝对路径）。
目录须已存在、非链接，与专用 dataDir 互不包含。Git-off 所有角色直接使用指定原目录；
省略时使用 `<dataDir>/projects/<runId>/workspaces/`。恢复继续使用同一目录，不重新准备源码。
工作目录通过 workspace 配置。Skill 脚本以实际加载位置定位，状态不要写入暂存
Skill 目录。依赖环境使用可用的绝对解释器路径。

Git-on 指定 workspace 时，导入当前安全源码（含未提交修改与非忽略新文件），继续使用
现有隔离 worktree；正式完成且集成后自动回写。原 .git/HEAD/index 不变，成果是原目录中的
未提交文件修改。回写先完整预检，冲突不覆盖；中途失败保留恢复日志，不保证整个目录原子回滚。
解决后 run sync-workspace 或 run.syncWorkspace()；workspaceDelivery.status 为 synced 才表示
交付完成。导入/导出限 5000 文件、单文件 32 MiB、总计 256 MiB，并拒绝不安全链接。
workspace 与 sourceWorkspace 互斥。交付过程中不要同时外部编辑原目录。

外部 Git-off 重配置提案使用 `.scienceevolve/management/<projectId>/proposal/workflow.json`，
跨调用保留草稿，真实位置写入 Inbox；apply_workflow path "workflow.json" 保留为逻辑别名，不覆盖根配置。

Git-on 专用 `--source-workspace /absolute/source` 做只读源码快照：Git 来源默认 tracked
工作树内容，非 Git 需 `--source-files /absolute/files.json` 指定相对文件数组。
不导入历史/.git/凭据/依赖；来源与 dataDir 不重叠。完成后 run export 导出集成 main。

```sh
scievolve run resume RUN_ID --data-dir /absolute/new-main-data
# 使用过 runtime-config 时，上述恢复命令也须带原文件。
scievolve run input RUN_ID followup.txt --data-dir /absolute/new-main-data --request-id followup-1
scievolve run respond RUN_ID answer.txt --data-dir /absolute/new-main-data
scievolve run export RUN_ID --data-dir /absolute/new-main-data --output /absolute/new-delivery
scievolve run sync-workspace RUN_ID --data-dir /absolute/new-main-data
```

Git-off 显式 cancel 是不可恢复取消；Ctrl+C 是安全点暂停。Git-on cancel 是原生 Stop，
确认后可 resume。安全暂停可能等当前调用结束；重复信号不强杀。CLI close 确认退出后
才打印彩色 resume 命令，保留 dataDir/runtime-config；stdout 保持 JSONL。
run export 仅适用于已完成 Git-on，目标目录必须不存在；Git-off 在停机后复制所需交付文件。

list/show/events 会打开并可能自动恢复宿主，不能并发监控同一目录；运行中看前台事件流。
resume 不替代 respond，追加 input 可能重开已完成任务。信号成功暂停退出 130，
显式暂停/成功命令 0，非成功任务或探测 2，参数/操作错误 1。

## ESM API

在宿主项目安装 SDK 依赖后导入；全局 CLI 安装不等于任意目录都能 import。

```js
import { createResearchSdk, loadWorkflowConfig } from '@scienceevolve/sdk';
const workflow = await loadWorkflowConfig('/absolute/workflow.json');
const sdk = await createResearchSdk({ dataDir: '/absolute/new-main-data' });
try {
  // 网关须事先在这个 dataDir 配置并通过全部所用组合的真实 test。
  const run = await sdk.start({
    title: '任务', requirement: '实际目标、输入清单、修改范围和验收标准',
    workflow, workspace: '/absolute/your-project',
    gatewayBindings: { defaultGatewayId: 'ACTUAL_GATEWAY_ID' }
  });
  console.log('runId', run.id);
  for await (const event of run.events()) console.log(event);
  const result = await run.wait();
  console.log(result.status, result.artifacts);
  if (result.status !== 'completed') process.exitCode = 2;
} finally { await sdk.close(); }
```

网关也可用 sdk.gateways.add/importHarness/test 准备。
OAuth 使用 createResearchSdk({dataDir,nativeCodexProfiles:{login:absoluteHome}})，
start.gatewayBindings={defaultNativeCodexProfileId:'login'}。
Git-on 可在 start 传 sourceWorkspace:{path:absoluteSource,files:['src/file.py']}。
内存 workflow 有相对 Skill 路径时，validateWorkflowConfig(input,{baseDir:absoluteDir})。

同进程 run.snapshot/events 观察，pause/cancel 控制；wait 在 paused/interrupted 也会返回。
AbortSignal 只停止等待/订阅，不停止任务。重开用 sdk.getRun(id) 并检查状态后 resume/respond；
createResearchSdk 本身会执行 main 恢复规则，不是只读查看接口。
