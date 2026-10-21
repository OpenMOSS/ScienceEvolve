# main 内核迁移：独立 SDK 宿主

[← 返回 SDK README](../README_zh-CN.md) · [English](main-runtime-migration.md) | **简体中文**

> 历史记录：legacy 引擎及其 API/CLI 入口已移除。下文保留旧版本设计与验收事实；当前用法见 [CLI/API 手册](main-cli-zh.md)。

当前默认内核基线：main `48e82cedd993d67f2379c36fade8973db63c74e8`。
本轮更新范围见 [2026-10-14 同步说明](main-sync-20261014-zh.md)。这不是新的稳定 SDK 发布公告，包版本仍为 0.1.1。
下文按阶段保留历史实现与验收说明；本轮最新结果以同步说明为准。旧数据需使用其对应旧版本处理；当前版本不提供 legacy 入口。

下文保留早期开发基线与阶段性记录。当前默认 main 来源已更新为 `4ae079fe51faefed850b5b9873979f44b60a7806`；最新来源、代理字段兼容、稳定提案路径与验证范围见 [2026-10-13 同步记录](main-sync-20261013-zh.md)。

## 已实现的入口与边界

第二阶段新增 `@scienceevolve/sdk/main`：`createMainResearchSdk()`、RunHandle、v3 配置、
网关管理及异步事件接口已接通同款内核。CLI 和根入口 `createResearchSdk()` 已默认使用 main。
`--engine main` / `@scienceevolve/sdk/main` 是显式别名；legacy 旧入口已移除。

显式 CLI 的部署与运行方法见 [main CLI 说明](main-cli-zh.md)，最新本地验收见
[原生 OAuth / Git-on Evolver / 默认入口验收](main-oauth-git-evolver-default-test-report-20261005.md)。
API-key/Loop 轮见 [历史验证记录](main-profile-loop-test-report-20261005.md)。源码导入验收见
[源码导入验证记录](main-source-workspace-test-report-20261005.md)。第四阶段历史记录保留在
[共用修复验证记录](main-shared-fixes-test-report-20261005.md)。这些历史报告保留原验证范围。当前仓库 16 个根 example workflow 与 SDK default 示例已迁移为 main Git-off；Git-on main-runtime 示例保留原样。
两种引擎不共享运行数据目录，旧 workflow 的 env/profile 字段也不能直接交给新入口。

`@scienceevolve/sdk/application/main-runtime` 直接组合 main 的 Orchestrator、
CollaborationRuntimeCoordinator、HarnessRuntimeFacade、正式 resident adapter、
执行输入构造和 invocation dispatcher。没有启动 HTTP 服务，不引入 Express 或 Web 页面。
`sdk/src/core/` 来自固定 main 提交，另包含登记的 SDK 宿主扩展：
源码 MCP `file:` URL、项目持久化前可信宿主回调、Git 初始 tree 工厂透传、
native profile、指定外部 workspace 的绑定和交付边界，以及 Windows 兼容适配。
本轮全部按 `hostOnly` 核对，没有修改 main 前后端。Web 默认行为不变，
不增加 HTTP/workflow 输入权限。
`resources/main-runtime/shared-fixes.json` 明确记录替换上下文；manifest 同时保存原始和修复后的 SHA-256。
校验可反向还原每个原始 blob，不接受模糊补丁或未登记的 core 改写。动态 fork 的
`project-mcp-host`、`control-mcp`、`resident-control-proxy`、descriptor broker MCP 与 Pi MCP extension
均列入显式依赖闭包。当前来源清单为 247 项文件，以 `resources/main-runtime/manifest.json` 为准；构建/测试不需要本机 main 仓库。
`runtimeRevision` 包含实际内核及 schema 内容摘要；`sourceCommit` 只表示上游基线，不能单独表示修复版本。

main 的规则未改成“Agent 返回就完成”或“退出时自动提交”。Git 工具、finish_task、
PR 合并事实、ownership/epoch、writer lease 和恢复条件仍由原内核裁决。

```js
import { createMainApplicationRuntime } from '@scienceevolve/sdk/application/main-runtime';

const runtime = await createMainApplicationRuntime({
  dataDir: '/absolute/path/to/a-new-empty-data-directory',
  runnerOptions: { harnessExecutables: { codex: '/absolute/path/to/codex' } },
  // 可选：只在启动 Git 项目后才需要凭据。
  git: {
    credentialResolver: async () => {
      const token = process.env.GITHUB_TOKEN;
      if (!token) throw new Error('GITHUB_TOKEN is required for this Git project');
      return { token, requestedScopes: ['repo'] };
    }
  }
});
try {
  console.log(await runtime.orchestrator.listProjects());
  // 项目创建接收 main 的 createProjectSchema，而不是旧 SDK 的 WorkflowConfig。
  // 网关使用 runtime.gatewayStore；不要把 API key 放入 workflow.json。
} finally {
  await runtime.close();
}
```

Windows 使用绝对路径，例如 `D:/runs/main-core-test`。要求 Node >=24（内置 node:sqlite）。
不需要本机 main 仓库；必要 JSON schema 和 Windows/Python/MJS 原生辅助文件随构建包分发。
原生辅助文件是否可运行仍取决于目标系统及其 Python/编译器/Harness 配置，不由本地单测替代。

## 数据、停机与恢复

- 新宿主要求空的独立 dataDir，写入引擎/固定提交/runtimeRevision 标记。不会接管已有项目、Git 仓库或旧 SDK/Web 数据。
- 同一 `.scienceevolve-runtime.lock` 防止两个 SDK 宿主同时打开目录；旧引擎也拒绝打开新引擎标记的数据。
- 重新打开遵循 main 的 initialize/recover 行为，可能恢复可运行项目；它不是只读查看操作。
- close 等待 Orchestrator 停机、数据库关闭，并额外确认所有已打开 resident 的 close 成功。
  未确认原生 Stop 时保留目录锁；可重试 close。崩溃残留锁只能在确认原进程已停止后人工恢复。
- 不同 runtimeRevision 的数据暂不自动升级；包括之前只写 sourceCommit 的预览数据。
  需要显式迁移及恢复验收，不能为了打开旧数据手工改写标记。
- 注入的 Git resolver 同时供 HTTPS Git transport 与 GitHub API 使用。
  没有注入时沿用 main 的 Git credential helper，不提供网页 OAuth 登录。
  workflow 中的 Web accountId 不会变成 SDK 的凭据选择器；多账户绑定尚待公开 API 适配。

## 兼容性及验收边界

默认公开 `createResearchSdk()` 和 CLI 已切换；旧消费者需升级调用方式或继续使用旧版本，
不能把旧运行数据或 profile 路由字段静默转换成新内核配置。
新引擎 Git-off 已支持 CLI `--workspace` 和 API `sdk.start({ workspace: absolutePath, ... })` 原地执行。
CLI 相对路径按启动目录解析，API 要求绝对路径；目录必须已存在，与显式专用 dataDir 分开且互不包含。
绑定持久化供后续轮次及恢复使用，省略参数仍使用任务内部默认目录。workspace 与 sourceWorkspace 互斥。
Git-on 也接受 workspace，读取原项目当前安全文件到受控 worktree，正式完成后自动回写集成成果，
不改原 .git/HEAD/index。冲突不覆盖；收据在 workspaceDelivery，解决后显式 syncWorkspace 重试。
串行/并行 worktree 策略没有改变。sourceWorkspace 保持只读，不自动回写，与 workspace 互斥。
外部 Git-off 的重配置提案放在 `.scienceevolve/management/<projectId>/proposal/workflow.json`，跨调用保留草稿和根配置。

API-key env/profile 导入与 Git-off Loop/Evolver 验证已完成。Codex 原生 OAuth 有独立路线：
可信宿主注册绝对目录别名，普通/常驻入口显式使用官方 provider，既不提取 token，也不伪造网关探测。
Web 默认宿主没有开启此能力，HTTP/workflow 不能自行注册别名。运行时保持权限、每轮 authority 和 Stop 校验。
OAuth 通知只接纳精确字段；工作流证据通过独立只读目录引用，不放开链接遍历安全规则。
使用方法和 app-server 读取可信原生配置的限制见 [原生 OAuth](main-cli-zh.md#codex-原生-oauth-登录)。
Windows 的安装包默认入口已完成普通 OAuth 及 Git-on scoped Evolver 的有界真实验收：
prompt 修改、执行/审计、成员和最终 PR、集成导出、宿主实际测试及重开不重跑。
结果和排障记录见 [本轮报告](main-oauth-git-evolver-default-test-report-20261005.md)。
当前 Git-off example 使用 main，须显式指定独立 dataDir、Gateway 绑定和已有 workspace，见[统一示例部署](https://github.com/OpenMOSS/ScienceEvolve/blob/main/example/README.md)。调用方旧配置需更新，旧状态不自动迁移。跨平台和四 Harness 真实矩阵尚未验收。

## 显式 main API 使用方法

```js
import { createMainResearchSdk, loadMainWorkflowConfig, bindMainWorkflowConfig } from '@scienceevolve/sdk/main';

const sdk = await createMainResearchSdk({
  dataDir: '/absolute/path/to/new-main-data',
  harnesses: { codex: '/absolute/path/to/codex' },
  git: {
    credentialResolver: async () => {
      const token = process.env.GITHUB_TOKEN;
      if (!token) throw new Error('GITHUB_TOKEN is required');
      return { token, requestedScopes: ['repo'] };
    }
    // 多账户使用时建议同时绑定 expectedIdentity: { id: 数字用户ID, login: '账号名' }。
  }
});
try {
  const apiKey = process.env.MODEL_API_KEY;
  if (!apiKey) throw new Error('MODEL_API_KEY is required');
  const gateway = await sdk.gateways.add({
    name: 'research', url: 'https://your-provider.example/v1', apiKey,
    protocol: 'chat-completions', models: ['your-model'], defaultModel: 'your-model'
  });
  const workflow = bindMainWorkflowConfig(await loadMainWorkflowConfig('/absolute/path/to/workflow.json'),
    { harness: 'codex', model: 'your-model' });
  // Git enabled 时会真实创建/推送 GitHub 仓库，确认仓库名与访问权限后才能运行。
  const run = await sdk.start({ title: 'Research', requirement: 'Your bounded research task',
    workflow, gatewayBindings: { defaultGatewayId: gateway.id }
  });
  for await (const event of run.events()) console.log(event);
  console.log(await run.wait());
} finally { await sdk.close(); }
```

- `validateMainWorkflowConfig()` 直接使用 main 校验。Git-on 的 v2 自动规范化为 v3；
  v3/Git-off 及 Git-off 协作组会拒绝，不降级为旧调度器。外层预设的 `schemaVersion: 2`
  是预设文件版本，不能与 `orchestration.schemaVersion: 3` 混淆。
- Agent prompt、Skill/MCP 和组内图保持 main 的定义。未知 SDK-only 字段会报错，不静默删除。
  相对 Skill 路径以 JSON 所在目录为基准；内存配置需要绝对 `baseDir`。
- JSON 不含 `gatewayId`、`gatewaySnapshot`、`gatewaySource` 或密钥。
  `gatewayBindings.agents` 可逐 Agent 选择网关，未指定项使用 `defaultGatewayId`。
  网关思考选项仍使用 main 的 `gatewayReasoningOption`。
- `harnesses()` 返回异步的 main Harness Catalog；显式路径仅支持绝对原生二进制或 JS CLI。
  SDK 自带 Pi 使用已安装包的 JS 入口，不会丢弃旧 `executable + args` 的参数后冒充兼容。
- `snapshot()` 保留 Git、runtime、collaboration、任务、执行、PR、并行投影和失败历史；
  不暴露完整 Agent 配置、网关快照或内部控制上下文。输出、事件和异常另做凭据脱敏。
- `events({afterSeq, follow:false})` 固定本次历史边界并分页；默认订阅再回放，避免重连漏帧。
  `eventId`、ownership/coordinator epoch、scope 身份和 `data.sourceType` 保留。
  Git-on 结束不能只等旧 `project.completed` 事件：main 使用完成节点事实及终态投影；
  `wait()`/`snapshot().status` 是项目状态接口。
- `wait()` 在完成、终态取消、paused 或 interrupted 时返回，并不表示每次返回都是成功。
  AbortSignal 只停止等待/消费事件，不取消任务。`cancel()` 完全沿用 main：
  Git-on F13 Stop 保留现场，返回 `paused` / `collaboration:user-cancelled`，可显式 resume；
  Git-off 取消通常为不可恢复的 `cancelled`。`pause()` 是安全点暂停，不等同 Stop。
- `retryGitInitialization()` 委托 main 幂等重试，不在 SDK 重建仓库或重跑已完成任务。
  `close()` 唤醒等待者；关闭失败仍保留锁，后续可重试 close。普通和路由内部 native open 均受 Stop guard 覆盖。

完整的 v3 配置样例见 `examples/main-runtime/workflow.json`（执行→审计组）。
它使用当前默认 `scievolve start`（或 --engine main），不可套用 --engine legacy。

## 已修复的共用内核问题

固定提交的 GitHub 401/403 授权错误会生成 `GITHUB_WAITING_FOR_AUTHORIZATION: ...`。
状态库的保守凭据检查把末尾 `FOR_AUTHORIZATION: ...` 当成 credential assignment，
因此 `waiting_for_github` checkpoint 被拒绝，项目仍保留 `authorizing`，并以 `git:failed` 暂停。
修复改成 `[GITHUB_WAITING_FOR_AUTHORIZATION]` 加已脱敏消息，保留原始凭据检测规则。
main 共用源码和 SDK 固定来源都已修改；401/403 的实际 SQLite 测试确认保存
`waiting_for_github`、同一个 operationId 重试，以及 Stop 后重新打开不重跑。
这不是伪造授权成功；没有有效凭据时仍暂停等待授权。本地 main 修复尚未提交到上游。

源码模式 MCP 的 `--import` 以前传 Windows 原始路径，Node 将盘符当成 URL 协议；
现在由 `pathToFileURL()` 转换，POSIX 路径同样适用。编译包还必须包含实际 fork 的 supervisor，
已纳入来源 manifest 和仓库外 MCP 调用验收。

## 明确的最终交付目录

`run.exportWorkspace({ destination: '/absolute/path/to/new-delivery' })` 只接受
已完成、Git ready 的任务，固定读取受控 bare repository 的 `refs/heads/main` commit。
返回 `{ destination, commit, files, bytes }`；不会提交、合并、推送，或复制未合并的 Agent worktree。
CLI 对应 `scievolve run export RUN_ID --engine main --data-dir DATA --output ABSOLUTE_NEW_DIR`。

目标父目录必须存在，目标目录必须不存在且位于 runtime 数据之外，即使已有目录为空也不覆盖。
导出保留 Git blob 原文（含二进制），不做摘要、脱敏或换行转换，不包含 `.git`、凭据配置、
运行日志和未追踪文件。LFS pointer 原样导出，不自动下载 LFS 内容。
限制为 5000 文件、32 MiB/文件、256 MiB 总量；拒绝 symlink/submodule、非法路径与
大小写/Unicode 规范化冲突，避免在不同平台静默合并路径。
取消只停止导出，close 会取消并等导出收尾；失败后的部分目录保留供检查，不自动递归删除。
不要让其他进程同时修改目标目录。下述源码导入与导出是两个显式动作；
它们都不等同旧 `--workspace` 原地修改，也不自动把完成结果合回来源仓库。

## 源码工作区导入

```js
const run = await sdk.start({
  title: '研究已有代码', requirement: '任务说明', workflow,
  gatewayBindings: { defaultGatewayId: gateway.id },
  sourceWorkspace: { path: '/absolute/path/to/source-repository' }
});
// 非 Git 目录必须明确选择文件，Git 目录也可用 files 覆盖默认选择：
// sourceWorkspace: { path: '/absolute/path/to/source', files: ['README.md', 'src/code.py'] }
```

- 只用于 Git-on main 任务。`sourceWorkspace` 是宿主部署输入，不是 workflow JSON 字段；
  source 和 dataDir 必须为不互相包含的真实目录，不接受 junction/symlink。
- Git 来源必须是 working-tree 根目录；默认选 Git index 中的 tracked 普通文件，但读取
  **工作树当前内容**（包括这些文件的未提交修改）。不导入提交历史、分支、refs、`.git`、hooks、
  untracked/ignored 文件；不执行 checkout、add、reset、fetch，不改 HEAD/index/config。
  已删除的 tracked 文件需从显式 files 列表排除，未解决的 index 冲突会拒绝。
- 非 Git 目录必须提供相对文件白名单。选中子模块、文件/目录 symlink、junction、hardlink、
  非跨平台路径、大小写/Unicode 冲突会拒绝。与导出同为 5000 文件、32 MiB/文件、256 MiB 总量。
- `.env*`、密钥文件、auth/gateways/credentials、依赖目录与 main 管理挂载路径禁止导入。
  不会声称能从任意源码中识别全部秘密：请核查源码内嵌凭据及数据授权，尤其在创建公开 GitHub 仓库前。
  本实现是文件内容快照，不是 LFS 下载器，也不是 Git history 克隆；LFS pointer 保留原文。
- 先保存私有 manifest/二进制 blobs，再在项目持久化与 provider/Agent 工作之前绑定快照。
  main Git 服务创建初始提交，记录 operationId 与 source fingerprint；重试验证相同提交/初始 tree，
  不因来源变更、移走或删除而重新采样。原 README/.gitignore 仅在选中时导入，不覆盖为默认模板。
- 重开使用保存的绑定；注册表、manifest 或 blob 缺失/损坏时明确失败，不回退默认空项目。
  快照未执行 filter、换行转换或摘要。不要在复制期间并发改动来源；读取会检查单文件变化，
  但这不是多文件原子 filesystem snapshot。
- Agent 在 main 自有 worktree 中执行，结果只在 main 完成判断/集成后可显式 export 到新目录。
  初始化或准备失败时保留 SDK 私有的未完成快照供排查，不删除来源；暂无自动快照回收命令。

## API-key profile 与 Loop/Evolver 进展

新入口提供显式的一次性配置导入，不自动读取旧 workflow 的 `gatewaySource`：

```js
const gateway = await sdk.gateways.importHarness({
  harness: 'codex', model: 'your-model', source: 'profile',
  profilePath: '/absolute/path/to/native/profile'
});
// 仍需通过 sdk.gateways.test(...) 后，用 gatewayBindings 选择返回的 ID。
```

支持四 Harness 的 API-key env/profile；只读复用原 SDK 的 native reader，再由 main 网关库校验和保存。
`source` 必填，`profilePath` 仅允许在 profile 模式使用且必须绝对。API 的 `environment` 是可选的内存
环境映射；提供时完全替代 process.env，不混用两份密钥。省略时在导入调用时复制当前环境。
导入不修改 native config/auth、执行 shell helper、发起 probe 或伪造通过记录。
它会保存 API key 到私有 dataDir；不是 live profile binding，不能用于原生 OAuth-only 登录。
OAuth 的普通/常驻路由使用已实现的独立 native profile binding，不从 auth.tokens 提取 key。

main 内核本来已支持 Git-off v2 的批内/批间 Loop 和受 capability 约束的 Main Evolver。
新增实际 SQLite/内核测试验证：两批黄金调用顺序、计数与事件；安全点暂停再重开不重跑已提交迭代；
Main/Worker prompt + 批大小重配置、Session 刷新、完成后重开；锁定权限修改拒绝且不部分提交；
关闭 Evolver 时不暴露权限。没有复制旧 loop 引擎，也没有放宽 main 的精确 Gateway 连接检查。
测试 Agent/upstream/smoke 为显式确定性模拟，不代表真实模型验收。

仓库 example 已显式迁移：设置 Git-off、v2 orchestration 与空 collaborations，移除旧 `gatewaySource` 和 `reasoningEffort`，保留原 Agent、模型、Harness、指令、路由、循环和终止条件。思考策略需按实际网关 modelReasoning/有效 gatewayReasoningOption 或可信原生 profile 部署验证，不能填造选项 ID。
这不自动转换调用方的旧配置，也不将 Git-on v3 组/隔离工作区改为原目录执行。
默认入口现已切换为 main；数据格式不自动转换，旧部署须使用对应旧版本。

## 本地验证范围

`npm run check:main-runtime` 验证固定内核；`npm test` 包含 main 的选择性回归：
v3 图校验、Git-on API 不进入旧调度器、显式 Agent Git 工具、真实本地 Git worktree/checkpoint、
SQLite writer/epoch、事务并发与恢复。测试保留 main 的断言；除了源码 import 路径，
Git 夹具明确记录了平台适配：仅临时仓库关闭 autocrlf、Windows 目录 junction、
文件符号链接 EPERM 时显式跳过、有限 30/60 秒时限及临时目录删除重试。
这些测试差异列在 manifest 的 testAdaptations 中；正式内核只应用上述登记的共用修复。
宿主测试覆盖目录隔离、Stop 重试和模拟模型的 Git-off 项目。

`npm run smoke:package` 在仓库外安装 tarball，检查新入口的实际 SQLite、资源和 Node 子进程，
同时继续验证旧 API/CLI。模拟模型或 provider 的结果不等于真实模型/GitHub 验收；
此前已完成 Windows 上的有界真实 Codex OAuth/GitHub 流程；本轮同步没有重做真实模型/GitHub 写入验收，跨平台/四 Harness 真实矩阵仍未完成。

本次实际结果和旧基线失败对照见 [第一阶段验证记录](main-runtime-test-report-20261005.md)。
第二阶段的新入口及安装包结果另见 [第二阶段验证记录](main-sdk-api-test-report-20261005.md)。
