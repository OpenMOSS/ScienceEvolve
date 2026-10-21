# SDK CLI 与部署

[← 返回 SDK README](../README_zh-CN.md) · [English](main-cli.md) | **简体中文**

`scievolve` 默认使用 main 内核；`--engine main` 是显式别名，
`@scienceevolve/sdk` 与 `@scienceevolve/sdk/main` 使用同一实现。
源码仓库提供 23 个 workflow：16 个 Git-off 共享目录流程、7 个 Git-on 协作流程。
下文介绍网关、模型路由、GitHub 认证、运行目录和恢复命令。
旧部署入口与数据迁移见 [运行时迁移](main-runtime-migration-zh.md)。

## 部署与启动

共享文件/图片可在 `start` 上加 `--inputs ./materials`，或 `--inputs-file ./inputs.json`。
也可由 workflow 顶层 `inputs`、`inputDescription` 提供默认值；其中相对源路径按 workflow 文件目录解析。
CLI 材料与描述参数分别覆盖对应默认值，省略则继承；`--inputs-file` 内容为 `[]` 可禁用默认材料，
`--input-description ''` 可清空默认说明。两种材料参数互斥。前者相对启动目录解析；后者是字符串或 `{ "path": "../image.png", "name": "figures/image.png" }`
组成的 JSON 数组，源路径相对 JSON 文件目录解析。`--input-description '材料用途'` 去除首尾空白后最多
2000 字符。材料在首个 Agent 运行前复制，目录保留层级；CLI 先检查清单基本格式，复制前再完整检查文件、名称、大小和目标冲突。
Git-off 使用实际工作区 `user_inputs/`；Git-on 使用私有项目 `workspaces/user_inputs/`，
不进入 Git worktree 或自动发布。限制与后续补充方式见 [共享输入材料](project-inputs-zh.md)。

需要 Node >=24 和对应 Harness；安装包自带 Pi 的 JS 入口。Git-on 协作和 Task 自己的 Git 操作需要 Git。默认 main 还支持另行安装的 [Hermes ACP Harness](hermes-zh.md)。
明确传入新的绝对 `--data-dir`，不采用旧 `SCIENCEEVOLVE_DATA_DIR` 或默认数据目录。
运行数据带引擎/实际 runtimeRevision 标记，不能混用 Web、旧 SDK 或修复前的预览运行数据。

```powershell
scievolve --engine main --help
scievolve harnesses --engine main --data-dir D:/runs/main-data
scievolve workflow validate D:/research/workflow.json --engine main
```

`workflow validate` 是离线校验，不开宿主、不要求 dataDir。其他运行/网关命令打开宿主时会遵循
main 的自动恢复规则，包括 list/show/events；它们**不是离线只读查看器**。
不要为查看进度再启动一个拥有相同 dataDir 的进程，使用前台事件流。

先在该数据目录配置网关；密钥通过已有环境变量传入，不写在命令参数或 workflow 中：

```powershell
scievolve gateway add --engine main --data-dir D:/runs/main-data `
  --name research --url https://your-provider.example/v1 --protocol chat-completions `
  --models your-model --default-model your-model --key-env MODEL_API_KEY
scievolve gateway test GATEWAY_ID --engine main --data-dir D:/runs/main-data `
  --model your-model --harness pi
scievolve run start D:/research/workflow.json D:/research/task.txt `
  --engine main --data-dir D:/runs/main-data --gateway GATEWAY_ID `
  --model your-model --harness pi
```

workflow 必须通过 main 校验，Git-on 按 main 规范化为 v3；`--model`/`--harness` 可一起覆盖。
示例 URL/model/ID 是占位符，不会预置模型或伪造探测通过。
Git 开启时会真实创建/推送 GitHub 仓库及 PR，启动前检查 repositoryName、private、账号权限。
网关测试和运行都会请求真实模型，可能产生费用。

### 推理档位

上面的基础配置使用供应商默认推理策略。workflow 中有 `gatewayReasoningOption` 时，
在添加网关时通过 `--reasoning-file` 提供对应映射。例如，模型支持 Chat Completions 的
`reasoning_effort: high` 时，将下面内容保存为 `reasoning.json`，替换实际模型 ID：

```json
{
  "your-model": {
    "parameter": "reasoning_effort",
    "options": [{ "id": "high", "label": "High", "value": "high" }]
  }
}
```

```powershell
scievolve gateway add --data-dir D:/runs/main-data `
  --name research-high --url https://your-provider.example/v1 --protocol chat-completions `
  --models your-model --default-model your-model --key-env MODEL_API_KEY --reasoning-file reasoning.json
scievolve gateway test GATEWAY_ID --data-dir D:/runs/main-data `
  --model your-model --harness pi --reasoning-option high
```

映射键是模型 ID，`id` 对应 Agent 的 `gatewayReasoningOption`，`value` 是供应商接受的值。
支持的参数路径为 `reasoning_effort`、`reasoning.effort`、`chat_template_kwargs.reasoning_effort`
和 `thinking.effort`；按供应商协议选择。模型、Harness 或推理选项改变后重新测试对应组合。
软件开发示例使用 `high`；启动时同时传 `--model` 和 `--harness` 可统一覆盖角色模型与 Harness，
原来的推理选项保持不变。

### 逐 Agent 网关绑定

多个 Agent 使用不同网关时，把部署选择放在单独 bindings JSON：

```json
{ "defaultGatewayId": "gateway-id", "agents": { "review": "other-gateway-id" } }
```

用 `--gateway-bindings D:/research/bindings.json` 替代 `--gateway`，不能同时提供。
所有 Agent 都需要显式模型路由，未知 Agent 或空 ID 会拒绝。
bindings 不导入网页密钥；也可为 Codex 显式选择部署中的原生登录别名，见下节。

### Codex 原生 OAuth 登录

先用 Codex 自己的登录流程登录；GitHub `gh auth login` 是另一个账号，不是模型登录。
部署文件注册目录别名（不是 token）：

```json
{ "nativeCodexProfiles": { "login": "C:/Users/YOU/.codex" } }
```

```powershell
scievolve run start D:/research/workflow.json D:/research/task.txt `
  --data-dir D:/runs/new-native-data --runtime-config D:/research/deployment.json `
  --native-codex-profile login --harness codex --model YOUR_AVAILABLE_MODEL
```

`--native-codex-profile` 与 `--gateway` / `--gateway-bindings` 互斥。逐 Agent 混用时可用 bindings：
`{ "defaultGatewayId": "gateway-id", "agents": { "main": { "nativeCodexProfileId": "login" } } }`。
或 `{ "defaultNativeCodexProfileId": "login" }` 绑定全部 Codex Agent。
只有 Codex 支持此原生路线；不能混用网关 reasoning option，不能写入 workflow。

SDK API：`createResearchSdk({ dataDir, nativeCodexProfiles: { login: absoluteHome } })`，
启动时使用 `gatewayBindings: { defaultNativeCodexProfileId: 'login' }`。
目录别名固定在 dataDir 中，重开需提供原部署配置；不允许恢复时换成另一份登录目录。
SDK 不读/复制 auth.json，不修改 config.toml，认证与正常登录刷新由 Codex 管理。
路线显式选官方 `openai` provider，不沿用 CCSwitch 自定义中转 provider。
普通 exec 隔离用户配置；常驻 app-server 当前没有相同隔离选项，会读取可信登录目录的配置偏好，
同时显式覆盖 provider、MCP、权限及禁用自动多 Agent/插件等能力。
不支持的格式明确拒绝；不会把 OAuth token 当 API key，也不会伪造通过网关测试。
原生路线不经过网关代理，当前没有同等的逐请求 Token 账本；不要把缺失/零统计理解为免费调用，
费用及配额以原生服务为准。协议中的 usage 事实与网关逐请求账本不可混为一谈。

### 只读导入 Harness 的 API-key 配置

也可以显式导入已有配置，省去手动重填 URL/key：

```powershell
scievolve gateway import --engine main --data-dir D:/runs/main-data `
  --harness codex --model your-model --source profile --profile-path D:/profiles/codex
scievolve gateway import --engine main --data-dir D:/runs/main-data `
  --harness pi --model your-model --source env
```

Codex、pi、DSH 和 Claude Code 支持 env/profile 导入；`--source` 必须明确指定。env 读取 `SDK_CODEX_*`、
`SDK_PI_*`、`SDK_DSH_*` 或 `SDK_CLAUDE_CODE_*`，至少需要 `_BASE_URL` 和 `_API_KEY`，
可选 `_PROTOCOL`、`_CONTEXT_WINDOW`、`_REASONING_JSON` / `_REASONING_FILE`。
profile 可用绝对 `--profile-path`，省略时按既有 `SDK_*_PROFILE` / 原生目录发现规则读取。
两种来源不互相兜底；不会修改 config/auth、CCSwitch 或登录态，也不执行 credential shell helpers。
这是一次性配置复制，不是活绑定：密钥会保存到私有 runtime 网关文件，应保护 dataDir，
不将它提交 Git 或分享。配置/密钥变化后需显式重新导入并使用新网关 ID。
导入不启动模型探测，不宣称验证通过；继续 `gateway test` 再绑定返回的 ID。
OAuth-only profile 的 gateway import 仍明确拒绝；原生 OAuth 请用上一节的独立路线。

Hermes 支持显式 `--harness hermes --source env`，读取 `OPENAI_BASE_URL` / `OPENAI_API_KEY`，不读取个人 Hermes profile 或 OAuth。安装、ACP 接口和权限说明见 [Hermes Harness](hermes-zh.md)。

## GitHub 认证与 Git 协作

默认 SDK 支持 Git-on 的个人仓库、Git 操作、PR 与成果交付，凭据由运行 SDK 的宿主提供。**无需注册 Web 登录用的 OAuth App，也不需要 Client ID、Client Secret 或 Callback URL。** Web/Server 的账号库由部署者配置 OAuth App、使用者网页登录；SDK 的公开入口使用下列凭据路线，不能用 Web accountId 直接绑定账号。

Git-off 不要求 SDK GitHub 凭据。启用 Git 时，HTTPS Git transport 和 GitHub API 使用同一用户凭据；仅有 SSH key 或能手动 clone，尚未证明建仓和 PR 的 API 授权可用。GitHub 用户凭据也独立于模型网关 API key / Codex 原生登录。

### Token 环境变量路线

本节使用 classic PAT 的 `repo` scope。登录执行项目的 GitHub 账号，在 **Settings → Developer settings → Personal access tokens → Tokens (classic)** 创建 token，设置有效期并勾选 `repo`；见 [GitHub 官方步骤](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic)。GitHub 的个人私有仓库创建接口需要相应授权，见 [官方 API 权限说明](https://docs.github.com/en/rest/repos/repos#create-a-repository-for-the-authenticated-user)。fine-grained token 使用独立权限模型，须另行核对建仓、内容与 PR 所需权限，不能用勾选 classic scope 的步骤代替。

将 token 通过凭据管理工具或仓库外的纯文本文件注入启动进程。例如：

```bash
export SCIENCEEVOLVE_GIT_TOKEN="$(cat /absolute/path/to/github-token.txt)"
```

```powershell
$env:SCIENCEEVOLVE_GIT_TOKEN = (Get-Content -Raw 'D:/secrets/github-token.txt').Trim()
```

创建 `runtime.json`，只保存环境变量名：

```json
{
  "git": {
    "tokenEnv": "SCIENCEEVOLVE_GIT_TOKEN"
  }
}
```

已有 `GITHUB_TOKEN` 时可将 tokenEnv 改为 `GITHUB_TOKEN`。SDK 不自动读取这个变量或 Web `.env`；不配置 tokenEnv 时会尝试 Git credential helper。token 不放进 workflow、runtime JSON、需求或命令参数。后续启动和恢复保持原 `--runtime-config`，并确保启动进程仍能取得凭据。

### GitHub 身份与权限预检查

以下脚本针对上面的 classic PAT 路线，只访问 `/user`，不建仓、不启动模型，也不输出 token。保存为 `check-github.mjs`，在刚设置环境变量的终端执行 `node check-github.mjs`：

```js
const token = process.env.SCIENCEEVOLVE_GIT_TOKEN?.trim();
if (!token) throw new Error('SCIENCEEVOLVE_GIT_TOKEN 未设置或为空');
const response = await fetch('https://api.github.com/user', {
  headers: {
    Authorization: 'Bearer ' + token,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'ScienceEvolve-credential-check'
  },
  signal: AbortSignal.timeout(15000)
});
if (!response.ok) throw new Error('GitHub 身份检查失败，HTTP ' + response.status);
const scopes = (response.headers.get('x-oauth-scopes') ?? '')
  .split(',').map(value => value.trim().toLowerCase());
if (!scopes.includes('repo')) throw new Error('本节 classic PAT 路线需要 repo scope');
const { login, id } = await response.json();
console.log(JSON.stringify({ login, id, repoScope: true }));
```

输出应是目标账号的 `login`、数字 `id` 与 `repoScope: true`。这一步验证身份、网络和 classic scope；仓库创建与 PR 的最终结果由实际任务确认。需要固定账号时，可按此真实输出配置可选的 `git.expectedIdentity: { id, login }`；不确定时省略整个 expectedIdentity，不要照抄示例账号或数字。

### Git credential helper 路线

已安装的 HTTPS helper 可以提供用户 token。使用 GitHub CLI 时，在运行 SDK 的同一个系统用户下执行：

```sh
gh auth login --hostname github.com --git-protocol https --web --scopes repo
gh auth setup-git --hostname github.com
gh auth status --hostname github.com
gh api user --jq '{login: .login, id: .id}'
```

GitHub CLI 使用自己的注册应用，用户无需再创建 OAuth App；安装与命令见 [gh auth login](https://cli.github.com/manual/gh_auth_login) 和 [gh auth setup-git](https://cli.github.com/manual/gh_auth_setup-git)。这里使用已保存的登录状态配置 Git helper；只给 gh 设置临时 GH_TOKEN 不等于 SDK 已取得凭据，环境 token 请走明确的 tokenEnv 路线。

使用此路线时不配置 tokenEnv，SDK 从 HTTPS `git credential fill` 获取 token，非交互调用不会临时弹出登录框。`gh auth status` 成功仍需完成 setup-git，并确认 helper 在实际启动 SDK 的系统用户和环境下可用。

### 准备 workflow 并启动

以包内 [Git-on v3 workflow](../examples/main-runtime/workflow.json) 为起点，将各 Agent 的 model 改成网关实际提供的模型，并设置未被占用的个人仓库名。保留 v3 协作结构；普通科研 example 依赖共享目录，不能只翻转 Git 开关就沿用其文件协议。

先完成上文的模型配置，在**同一个 dataDir** 中拿到测试通过的 GATEWAY_ID。使用 tokenEnv 路线时，启动命令例如：

```powershell
scievolve workflow validate D:/research/git-workflow.json
scievolve start D:/research/git-workflow.json D:/research/task.txt `
  --data-dir D:/runs/main-data --gateway GATEWAY_ID `
  --workspace D:/research/project --runtime-config D:/research/runtime.json
```

Git-on 会在授权账号的个人空间创建仓库并操作 PR。恢复使用同一 dataDir、run ID 和 runtime-config；运行或恢复前应确保凭据仍有效。配置、身份预检查和离线 validate 都不提前创建仓库。

### Node API 凭据配置

CLI 的 tokenEnv 文件也可由 Node API 读取：

```js
import { createResearchSdk, loadMainRuntimeConfig, loadWorkflowConfig } from '@scienceevolve/sdk';
const deployment = await loadMainRuntimeConfig('/absolute/path/to/runtime.json');
const sdk = await createResearchSdk({ ...deployment, dataDir: '/absolute/path/to/new-main-data' });
try {
  const run = await sdk.start({
    title: 'Git 协作任务', requirement: '填写已授权的实际任务和验收要求',
    workflow: await loadWorkflowConfig('/absolute/path/to/git-workflow.json'),
    workspace: '/absolute/path/to/your-project',
    gatewayBindings: { defaultGatewayId: 'ACTUAL_TESTED_GATEWAY_ID' }
  });
  for await (const event of run.events()) console.log(event);
  console.log((await run.wait()).status);
} finally { await sdk.close(); }
```

也可直接给 `createResearchSdk()` 提供 `git.credentialResolver`，返回 `{ token, requestedScopes: ['repo'] }`。该 scope 是 SDK 请求声明，不会替 token 增加真实权限；实际 token 仍须由用户或宿主授权提供，不能在 workflow 中伪造 gateway 或 GitHub 身份。

### GitHub 配置排错

| 错误或现象 | 检查方法 |
| --- | --- |
| token 环境变量为空 / credential could not be resolved | 在启动 SDK 的同一终端设置变量，确认 tokenEnv 拼写和 `--runtime-config` 路径；仅修改 Web `.env` 不生效。 |
| credential helper did not return a credential | 完成 HTTPS helper 登录与配置；只配置 SSH 或只让 gh 使用临时环境 token，不保证 helper 可用。 |
| 401 | 检查 token 是否有效、过期或撤销，重新提供凭据。 |
| 403 / 缺少 repo scope | 对 classic PAT 检查 repo scope、账号限制及目标操作权限；fine-grained token 另行核对对应权限。 |
| identity does not match | 核对 expectedIdentity 的真实数字 id；登录名变化不改变 GitHub 数字身份。 |
| 仓库名被占用 / 创建参数错误 | 检查 repositoryName 和个人空间中的已有仓库，使用合法且未被占用的名称。 |
| 登录了模型但 Git 仍失败 | 模型认证与 GitHub 用户凭据分别配置；Codex 原生 OAuth 不提供 GitHub 建仓/PR 授权。 |

## 运行时配置

Agent 脚本沿用宿主统一启动环境。旧 workflow 的 `agents.<name>.proxy` 在规范化时移除；网络要求在启动宿主中配置，不再使用逐 Agent 的 direct/inherit 策略。

### 指定现有工作目录

通过 main 校验的 workflow 可以接入已有目录，Git 开关决定执行及交付方式：

```powershell
scievolve start D:/research/workflow.json D:/research/task.txt `
  --data-dir D:/runs/main-data --gateway GATEWAY_ID --workspace D:/research/project
```

`--workspace` 支持相对路径，按启动 CLI 时的当前目录解析。API 对应
`sdk.start({ title, requirement, workflow, gatewayBindings, workspace: absoluteProjectPath })`，
要求绝对路径。目录必须已存在，与专用 dataDir 分开且互不包含；选定路径持久化，后续轮次和恢复继续使用。
Git-off：Agent 直接修改该目录；Git-on：从当前源码建立起始快照，在原有隔离 worktree 中执行，
正式完成后自动回写集成 main 的文件变更。串行/并行目录策略没有改变。原项目的 `.git`、HEAD、
暂存区、hooks 均不改，成果在原仓库表现为未提交修改；不自动提交原仓库或迁移其历史。
省略 workspace 时仍用内部默认目录；`--source-workspace` 保持只读，二者互斥。

Git workspace 自动选择 tracked + 非 ignored 的安全 untracked 文件（非 Git 目录自动扫描），
排除管理路径、依赖和已知凭据；不复制 symlink/submodule/hardlink。限制为 5000 文件、
32 MiB/文件、256 MiB 总量。源码中嵌入的密钥仍需自行检查。

回写前核对待变更文件的原始指纹，冲突时停止覆盖并保留成果。`snapshot.workspaceDelivery`
给出 synced/conflict/failed、commit、冲突文件；`wait()` 不会把回写失败当交付成功。
人工解决后执行 `scievolve run sync-workspace RUN_ID --data-dir DATA` 或 `run.syncWorkspace()`，
没有 force。失败可能已完成部分安全回写，journal/备份保留，重试识别已完成项。不要在实际回写时并发改文件。
崩溃残留 `.scienceevolve-sdk-delivery.lock` 只在确认原进程已停止后人工移除，不能盲删别人的锁。

Git-off 的已有 `Memory.md` 保留且须为普通文件。Main 重配置提案改存
`<workspace>/.scienceevolve/management/<projectId>/proposal/workflow.json`，跨调用保留草稿和根目录配置。
Main 编辑注入的实际提案路径；`apply_workflow path:"workflow.json"` 是逻辑别名，不覆盖用户原文件。

运行前开启 `orchestration.allowMainReconfiguration` 后，获准 Main 可修改当前提案允许的 Agent 与编排字段，并通过 `apply_workflow` 提交。`editableFields` / `lockedRuntime` 和内核校验决定实际范围；权限、凭据、会话持久策略与推理档位仍锁定。已接受的 Project Skill/MCP 定义不可同名改写、替换或删除，调整内容须使用新名称并更新引用。接受配置后按会话连续性规则续跑。

### 只读源码导入（Git-on）

```powershell
scievolve run start D:/research/workflow.json D:/research/task.txt `
  --engine main --data-dir D:/runs/main-data --gateway GATEWAY_ID `
  --source-workspace D:/research/source-repository
```

Git 来源默认选 tracked 工作树文件（包括选中文件的未提交内容），不导入历史/.git/hooks，
不改来源的 HEAD/index/config。非 Git 来源必须加 `--source-files D:/research/files.json`，
内容如 `["README.md", "src/code.py"]`；Git 来源也可用它缩小选择范围。
`--source-files` 不能单独使用，source 必须绝对且与 dataDir 不重叠。
此选项与 Git-off 的 `--workspace` 原地执行不同；Agent 仍在受控 worktree 执行。
快照在首次创建时保存，授权重试/恢复不重读来源。秘密/依赖/管理路径和链接文件会拒绝；
限制、GitHub 发布风险和最终交付位置见 [源码导入](main-runtime-migration-zh.md#源码工作区导入)。

### 部署 JSON

可选 `--runtime-config D:/research/deployment.json`：

```json
{
  "execution": { "agentConcurrency": 2 },
  "timeouts": { "residentModelInactivityTimeoutMs": 1200000 },
  "git": {
    "tokenEnv": "SCIENCEEVOLVE_GIT_TOKEN"
  }
}
```

路径相对于 deployment.json 的目录解析；不配置 harnesses 时使用内核的本机发现与包内 Pi。
只支持 native executable/JS CLI 路径，不接受旧 `{ executable, args }` 对象或 Windows shell wrapper。
不接受 dataDir、runnerOptions、internal、controlBridgeFactory、raw token/API key 等字段。
所有数字严格校验，字符串不会转换成数字；超时为正整数且不超过 Node timer 上限，
retryBaseMs 不能超过有效 retryMaxMs。配置错误在创建运行目录前拒绝。

execution 支持 retryBaseMs、retryMaxMs、agentConcurrency、interruptForceTimeoutMs、
agentActivityIdleWindowMs、agentToolActivityIdleWindowMs；timeouts 支持
residentModelInactivityTimeoutMs、residentToolInactivityTimeoutMs、protocolProxyTimeoutMs、
dshHandshakeTimeoutMs、dshTurnIdleTimeoutMs。

Git 不指定 tokenEnv 时使用 main 的 Git credential helper；没有网页 OAuth 登录或 accountId 映射。
tokenEnv 只引用变量名，每次 Git API/transport 使用时读取，支持进程内 token 轮换。
expectedIdentity 可选，按前面的身份预检查填写真实 GitHub 数字 id 与 login，或省略整个字段。
配置文件和输出不包含 token。SDK API 对应方法是 `loadMainRuntimeConfig()`；
程序直接创建 SDK 时，harness/Skill 路径必须绝对，可在内存中注入 credentialResolver。

## 停止、恢复与结果

```powershell
scievolve run resume RUN_ID --engine main --data-dir D:/runs/main-data
scievolve run retry-git RUN_ID --engine main --data-dir D:/runs/main-data
scievolve run events RUN_ID --engine main --data-dir D:/runs/main-data --after-seq 42
scievolve run export RUN_ID --engine main --data-dir D:/runs/main-data --output D:/deliveries/new-result
```

- Git-on `run cancel` 是 main F13 **可恢复 Stop**：原生 Stop 确认后是 paused /
  collaboration:user-cancelled，保留执行/session/Git 现场，不假装 terminal cancelled。
- Git-off `run cancel` 仍是终态取消；Ctrl+C/SIGTERM 请求安全暂停。
- `run pause` 使用 main 安全点规则，可能等待当前 turn 完成；不是强制杀进程。
- 初始化/恢复中收到信号会先等宿主安全打开并 close，尚未开始的命令不再执行。
  命令已在执行则锁存信号，拿到 RunHandle 后请求 Stop；初始化没有强行加一个总超时。
- 重复信号不强杀。恢复命令只在 SDK close 确认停机、释放锁后打印，带 main 引擎、
  绝对 dataDir 和原 runtime-config 路径；Stop 失败不打印误导的可恢复成功提示。
- JSON Lines 的每条运行输出标记 engine: main；内核 event.type、sourceType、seq、epoch 原样保留。
  用 run.result / wait 的状态判断完成，不要求旧 project.completed 事件。
- 退出码：正常完成/显式成功的暂停或 Stop 为 0，非成功任务/探测为 2，
  收到信号且成功暂停/取消探测为 130，参数或操作错误为 1。

在一个活动的前台进程中接收 Ctrl+C；另开 `run pause/cancel` 不能绕过单宿主目录锁。
暂不提供守护进程或跨进程控制接口。掉电/强杀留下锁时必须先确认原进程已经停止再人工恢复。

`run export` 只导出已完成 Git 任务的集成 main commit。目标父目录需存在，目标目录必须是
runtime 数据之外的新目录；不会覆盖旧 workspace 或包含 `.git`/运行日志/未合并修改。
保留原始文本与二进制、返回 commit 和文件/字节数，不运行 Git filter、下载 LFS 或访问 GitHub。
上限 5000 文件、32 MiB/文件、256 MiB 总量；symlink、submodule 和非跨平台路径会明确拒绝。
Ctrl+C 只取消导出，不取消课题；失败后保留部分输出目录，检查后选择另一个新目录重试。

## 当前边界

默认入口支持 API-key env/profile 导入、显式 Codex 原生 OAuth，以及 `--workspace`：Git-off 原地执行，Git-on 从原项目导入、隔离执行并在正式完成后自动回写。
当前仓库 example 已移除旧 `gatewaySource` / `reasoningEffort`；模型与 Harness 保留，思考策略按实际网关或可信原生 profile 显式部署。用户自己的旧配置仍须显式迁移。Git-off Loop/Evolver 已用 main 实际内核验证。
不支持的输入会明确拒绝，不悄悄使用另一份目录或伪造 gatewaySnapshot。
Git 授权错误 checkpoint 和源码 MCP 已通过共用补丁修复，见 [迁移记录](main-runtime-migration-zh.md)。
本地单测/安装包烟测中的模型/provider 是模拟的，真实模型记录与之分开。
Windows 的一轮真实任务不能代替四 Harness 和 Linux/macOS 完整验收。
当前非 yolo Git-on 的严格文件 broker 只支持 Windows/Linux；macOS 会明确拒绝，
Git-off 通过 workspace 指定工作目录。legacy 引擎已移除；旧运行数据需使用旧版本处理。
10 月 5 日导入和 Loop 历史验证见 [API-key profile / Loop 验证记录](main-profile-loop-test-report-20261005.md)。
10 月 5 日原生 OAuth、Git-on Evolver 与默认入口历史验证见 [真实验收报告](main-oauth-git-evolver-default-test-report-20261005.md)。
2026-10-06 的原目录适配、Codex/Pi/DSH 实测和已知边界见 [更新与测试记录](workspace-main-acceptance-20261006-zh.md)；Claude Code 按用户要求未参与本轮。
普通 workspace 调用可使用 `scienceevolve_read_invocation_input` 分块读取本轮 Inbox/Memory；
该工具不接收任意文件路径，也不使 shell 变为允许。
