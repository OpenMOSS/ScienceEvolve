# ScienceEvolve config SDK 交付、使用与负责人手册

> 历史记录：当前 SDK 已移除 legacy 引擎及其脚本；下文命令和结果仅对应当时版本。当前用法见 [CLI/API 手册](../../sdk/docs/main-cli-zh.md)。

> 历史适用范围：本文记录 2026-09-23 的 legacy API/部署方式，不是当前默认入口的使用合同。当前 SDK 要求 Node 24+，默认 main；CLI/API 均可选择 workspace。Git-off 在原目录工作，Git-on 导入原项目、隔离执行并在正式完成后自动回写。请使用 [当前 CLI/API 手册](../../sdk/docs/main-cli-zh.md)、[迁移说明](../../sdk/docs/main-runtime-migration-zh.md) 和 [本轮验收](../../sdk/docs/workspace-main-acceptance-20261006-zh.md)。下方旧 Node 与接口说明只用于理解历史实现。

> 适用版本：`@scienceevolve/sdk` 0.1.1
>
> 更新时间：2026-09-23
>
> 主要读者：SDK 负责人、leader、驾驶舱 CLI 开发者，以及后续维护者。

## 1. 先说结论

这次交付的 SDK 是一个可以被 Node.js 程序直接导入的“科研工作流执行引擎”。驾驶舱 CLI 不需要启动 ScienceEvolve 网页或 HTTP Server，就能通过 config 创建和运行科研任务。

它目前可以：

- 读取 ScienceEvolve 现有的 `agents + orchestration` config；
- 使用内置五 Agent 工作流，也可以描述自定义 Agent、路由、循环和终止条件；
- 调用 Codex、pi、dsh 三种 Harness；
- 注册并测试模型网关；
- 启动任务并持续返回事件、进度、结果和产物；
- 暂停、恢复、取消任务，补充输入或回答 Agent 的问题；
- 把任务状态保存到磁盘，供之后重新打开；
- 打包后脱离 ScienceEvolve 源码独立安装和运行。

当前应称为“可本地试接配置驱动工作流、支持 Main 动态编排的 0.1.1 初版”，不能表述成“与最新主线完全等价”或“所有模型/平台生产验收完成”。2026-09-23 主线同步后的类型检查、自动测试、构建及独立打包 CLI 模拟烟测结果见当日记录；当前测试数量以当前提交的 `npm test` 输出为准；同日更早的 Windows 真实网关与多 Harness 验收属于**同步前**的代码状态，不是这次改动的真实验收。详情分别见 [主线同步记录](main-sync-20260923.md)与[历史真实验收](real-acceptance-20260923.md)。SDK 源码在专用分支，尚未发布 npm 包。

固定配置下的 SDK API 和包内 `scienceevolve` CLI 可以用于试接。2026-09-25 已支持 `orchestration.allowMainReconfiguration: true`，Main 可通过 `workflow.json` 和 `apply_workflow` 修改编排；新版 Harness Runtime、工作区 checkpoint 和 provider-failure 遥测尚未完整移植。真实模型、新版打包产物与 macOS/Linux 的验收仍须补齐。

## 2. 对方会拿到什么

正式交付不应只有一个压缩包，建议同时提供以下内容。

### 2.1 源码分支与后续 PR

当前主线已合入 **SDK 分支**，不是把 SDK 合回本地或远端 `main`。本轮代码保存在该专用分支，尚未创建合并到 `main` 的 PR；未来的源码 PR 才是正式交付物。它让其他人能够：

- 审查实现；
- 看到接口和测试；
- 在自己的机器重新构建；
- 后续修复问题并发布新版本；
- 准确追踪某个版本对应的代码。

0.1.1 的 TypeScript 源码已经根据已验证构建产物恢复，并补齐 namespace 工具转换、流式 usage、Codex model catalog、编排 MCP 环境变量和控制桥 socket 保护的回归覆盖。`dist` 和 tarball 不进入 Git；发布包必须从本版本源码重新构建。

SDK 代码位于：

```text
ScienceEvolve/sdk/
```

提交 SDK PR 时，应避免混入之前的 Gateway 页面、Server 或 Web 修改。SDK PR 应尽量只包含：

- `sdk/`；
- 根目录 `package.json` 中的 SDK workspace 和脚本；
- 对应的 `package-lock.json`；
- 必要的 `.gitignore`、README 和 SDK 文档修改。

### 2.2 可安装 tarball

当前安装包：

```text
<output-directory>\scienceevolve-sdk-0.1.1.tgz
```

它适合立即试接或离线传递。接收方可以把它复制到自己的机器，然后执行：

```sh
npm install /absolute/path/scienceevolve-sdk-0.1.1.tgz
```

tarball 不能代替源码 PR。只给 tarball 会让后续代码审查、维护、升级和问题定位变得困难。这里的 npm 安装包包含编译产物，不包含重新编译所需的 TypeScript 源码和构建脚本；重新构建应取得完整源码。源码 ZIP/tar 保留 `.agents/skills` 后可直接构建，资源复制不要求 Git、`.git` 或 Git 索引。

### 2.3 文档和示例

- SDK 入口说明：`ScienceEvolve/sdk/README.md`
- 通俗设计文档：`ScienceEvolve/sdk/docs/sdk-design-explained-zh.md`
- config 逐字段审计：`ScienceEvolve/sdk/docs/config-field-audit.md`
- 可运行示例：`ScienceEvolve/sdk/examples/README.md`

### 2.4 验收说明

需要告诉接收方哪些已经验证，哪些还没有：

- 类型检查通过；
- 自动测试结果和数量以交付提交的 `npm test` 输出为准，并记录操作系统、Node 版本及环境前提；
- npm 打包通过；
- 仓库外安装和独立 consumer smoke 通过；
- Windows 上四个 Harness 有同步前的真实模型验收记录；这不覆盖本轮新增代码；
- smoke 使用模拟模型，不代表真实收费模型验收；
- macOS 尚未进行真实机器验收；
- 包内已有初版 `scienceevolve` 前台 CLI，驾驶舱正式接入尚未完成。

## 3. 驾驶舱拿到 SDK 后怎么用

完整过程可以理解成八步：

```text
安装 SDK
  ↓
准备 Harness CLI
  ↓
设置 Harness 配置来源（profile 或 env）
  ↓
创建 SDK，指定 dataDir
  ↓
读取并绑定 workflow config
  ↓
启动科研任务
  ↓
消费事件并处理用户交互
  ↓
读取结果并关闭 SDK
```

### 3.1 环境要求

接入程序需要：

- Node.js `>= 20.12.0`；
- ESM 或者能够导入 ESM 包的构建环境；
- 至少安装一种需要使用的 Harness CLI；
- 可访问的模型网关、模型名称和 API key；
- 一个专门给 SDK 使用、可读写的 `dataDir`。

SDK 包含工作流运行代码、类型和内置 Skill；`pi` 由包的 npm 依赖提供，默认不需单独安装。Codex、dsh 及模型服务不随包提供。

### 3.2 安装

试接阶段须从**当前工作区重新构建并打包**，旧 tarball 不包含这轮主线适配：

```sh
npm run build -w sdk
npm pack -w sdk --pack-destination sdk
```

然后在消费项目安装生成的 tarball：

```sh
npm install D:/packages/scienceevolve-sdk-0.1.1.tgz
```

正式长期使用更适合把包放入团队内部 npm registry，并通过精确版本安装：

```sh
npm install @scienceevolve/sdk@0.1.1
```

当前 `package.json` 中仍有 `private: true`，所以 0.1.1 适合 tarball 分发，尚不能直接发布到 npm registry。决定进入内部 registry 前，还需确认包名、权限、Skill 许可、发布流程和版本负责人。命令行试用步骤见 [CLI 使用说明](../../sdk/docs/cli-guide-zh.md)。

### 3.3 创建 SDK

```js
import { createResearchSdk } from "@scienceevolve/sdk";

const sdk = await createResearchSdk({
  dataDir: "D:/cockpit-data/scienceevolve",
  harnesses: {
    codex: {
      executable: "D:/tools/codex.exe"
    }
  },
  agentConcurrency: 2
});
```

几个关键点：

- `dataDir` 是 SDK 的私有运行目录，不是源码目录；
- 同一个 `dataDir` 同一时刻只能由一个 SDK/ScienceEvolve 实例打开；
- `agentConcurrency` 控制最多同时执行多少个 Agent 调用；
- 不使用某个 Harness 时可以不配置它；真正选中但找不到可执行文件时，启动任务会明确失败。

Windows 下不直接执行 `.cmd`、`.bat`、`.ps1` 或 `.sh`。如果一个 CLI 是 JavaScript，应使用 `node.exe + JS 入口`：

```js
harnesses: {
  pi: {
    executable: "C:/Program Files/nodejs/node.exe",
    args: ["D:/tools/pi/dist/cli.js"]
  }
}
```

### 3.4 配置 Harness 网关

先在 workflow 中用 `gatewaySource` 选择来源。`profile` 读取 Harness 原生配置：`SDK_<HARNESS>_PROFILE` 可指定路径，未设置、为空或为 `default` 时使用默认位置。`env` 只读取 `SDK_<HARNESS>_API_KEY` 与 `SDK_<HARNESS>_BASE_URL`，不会因设置了 profile 路径而改读 profile。默认模板选择 `profile`；Codex profile 直接使用 Codex 的原生配置和登录态，包括 OAuth/钥匙串。创建 SDK 前准备相应环境或原生配置，模型 ID 仍由 workflow 的 `model` 指定。四 Harness 的默认路径与变量名见 [网关配置说明](../../sdk/docs/harness-gateway-zh.md)。workflow 不接受 `gatewayId`、URL、key 或 profile 路径；无需预先手动登记网关。

### 3.5 自动连接测试

API-key 网关路径在启动或应用新的 Harness/model 组合时由 SDK 自动解析、登记并完成必要的连接测试；已通过且配置未变化的组合可复用结果，不需要用户预先注册。Codex 的 `gatewaySource: "profile"` 直接使用原生连接，不创建 SDK 网关，也不执行以下四阶段探测。手动网关登记/测试 API 或 CLI 用于独立诊断，不是启动任务的必经步骤。

API-key 网关的一次测试包含：

1. 文本普通；
2. 文本流式；
3. 工具调用普通；
4. 工具调用流式。

不能用“HTTP 200”替代这四项测试。科研流程依赖工具调用来完成路由、发布成果、请求用户和结束任务。

### 3.6 读取 config

读取已有配置：

```js
import { loadWorkflowConfig } from "@scienceevolve/sdk";

const workflow = await loadWorkflowConfig(
  "D:/cockpit-config/workflow.json"
);
```

如果读取的是一个包含多个 preset 的配置库，需要选择 `presetId`：

```js
const workflow = await loadWorkflowConfig(configFile, {
  presetId: "five-agent-research"
});
```

不提供文件、直接使用内置五 Agent 配置：

```js
import { defaultWorkflowConfig } from "@scienceevolve/sdk";

const workflow = defaultWorkflowConfig();
```

### 3.7 绑定部署信息

如果希望所有 Agent 暂时都使用相同的 Harness 和 model：

```js
import { bindWorkflowConfig } from "@scienceevolve/sdk";

const boundWorkflow = bindWorkflowConfig(workflow, {
  harness: "codex",
  model: "model-a"
});
```

`bindWorkflowConfig()` 是接入方便函数。它不会改变工作流路由，只给全部 Agent 统一绑定部署信息。

如果每个 Agent 要使用不同 Harness 或 model，应直接在 config 的 `agents[name]` 中分别配置，不能再用一次全局绑定把它们覆盖。

### 3.8 启动任务并接收事件

```js
const run = await sdk.start({
  title: "科研任务",
  requirement: "分析指定问题，并输出带证据的研究报告",
  workflow: boundWorkflow
});

console.log("Run ID:", run.id);

for await (const event of run.events()) {
  console.log(`[${event.seq}] ${event.type}: ${event.message}`);
}

const result = await run.wait();
console.log(result.status, result.artifacts);
```

驾驶舱需要保存 `run.id`。程序重启后，可以通过它重新打开任务：

```js
const run = await sdk.getRun(runId);
const state = await run.snapshot();
```

### 3.9 正确关闭

```js
try {
  // 使用 SDK
} finally {
  await sdk.close();
}
```

`close()` 会停止本地执行、保存检查点并释放 `dataDir` 锁。它不等同于把所有任务标记为取消。

## 4. 驾驶舱怎样使用任务控制能力

### 4.1 暂停与恢复

```js
await run.pause();
await run.resume();
```

暂停通常在安全边界生效，而不是随意破坏一次已经进行中的状态提交。

### 4.2 取消

```js
await run.cancel();
const state = await run.wait();
```

取消会停止 SDK 管理的本地 Harness 进程并落稳任务状态，但远端已经提交的计算能否同时撤销，取决于远端服务本身是否提供取消接口。

### 4.3 补充输入

等待当前 Agent 完成后加入：

```js
await run.addInput("补充考虑数据隐私", {
  mode: "wait",
  requestId: "input-001"
});
```

打断当前调用，让 Main 尽快重新判断：

```js
await run.addInput("停止当前方向，改做方案 B", {
  mode: "interrupt",
  requestId: "input-002"
});
```

`requestId` 应由驾驶舱生成并持久化，用于避免网络重试造成重复输入。

### 4.4 回答 Agent 的问题

如果任务进入需要用户回答的状态：

```js
await run.respond("确认使用公开数据集");
```

此时不能简单调用 `resume()` 代替回答。

### 4.5 事件断线续读

每个事件都有递增的 `seq`。驾驶舱可以保存最后一个序号：

```js
for await (const event of run.events({ afterSeq: lastSeq })) {
  lastSeq = event.seq;
}
```

只读历史、不持续等待新事件：

```js
for await (const event of run.events({ follow: false })) {
  console.log(event);
}
```

## 5. 你作为 SDK 负责人必须熟悉什么

不需要一开始记住所有源码，但下面内容需要分层掌握。

| 掌握程度 | 内容 | 为什么必须知道 |
| --- | --- | --- |
| 必须能直接解释 | SDK 的目标和边界 | 防止把 CLI 页面、模型服务或 ScienceEvolve Server 的需求误算成 SDK 问题 |
| 必须熟练 | 公开 API 和任务生命周期 | 接入方首先会问如何启动、监听、暂停、取消和恢复 |
| 必须熟练 | config 合同 | 这是 SDK 的核心输入，也是双方最容易产生误解的地方 |
| 必须理解 | Agent、强边、弱边、循环、Main 和终止条件 | 需要判断一个 workflow 为什么这样运行 |
| 必须理解 | 四个 Harness 的能力差异 | 同一个字段不一定能在四个 CLI 上等价实现 |
| 必须理解 | 网关协议和四阶段探测 | 很多“模型坏了”实际是协议或工具流不兼容 |
| 必须理解 | `dataDir`、持久化和锁 | 避免重复执行、数据覆盖和恢复错误 |
| 必须理解 | 密钥、权限、Skill、MCP 的安全边界 | 这些配置可能允许读写文件、联网或执行命令 |
| 会查文档即可 | 内部协议转换细节 | 出现特定协议问题时再深入源码 |
| 会查文档即可 | Orchestrator 内部状态机 | 普通接入不需要直接调用内部类 |

### 5.1 必须记住的 SDK 边界

SDK 负责：

- 校验 config；
- 执行 Agent 工作流；
- 调用 Harness 和网关；
- 持久化任务；
- 暴露事件、结果和控制接口。

SDK 不负责：

- 驾驶舱业务级终端交互界面和后台服务；包内仅提供初版 `scienceevolve` 前台 CLI；
- 驾驶舱账号、权限、业务数据库；
- 模型网关本身的部署和稳定性；
- 自动安装四个 Harness；
- 替驾驶舱保存 API key 到它自己的密钥系统；
- 把任意不可信 config 变成绝对安全的沙箱。

### 5.2 必须掌握的 config 结构

config 主要是两部分：

```json
{
  "agents": {},
  "orchestration": {}
}
```

`agents` 说明每个 Agent 用什么 Harness、model、权限、Skill 和 MCP；网关来自 Harness 的环境绑定。

`orchestration` 说明：

- 有哪些工作流节点；
- 从哪个 Agent 开始；
- Agent 之间怎么流转；
- 谁做分支决定；
- 何时可以结束；
- 最终结果格式是什么。

“任何合法 config 都能运行”的准确含义是：

> 只要 config 同时满足结构校验、工作流不变量和所选 Harness 的能力约束，SDK 就必须执行；确实无法兑现的组合必须在启动前明确报错，不能校验通过后静默忽略字段。

它不意味着任意 JSON、任意 Harness 能力组合或任意第三方 MCP 都一定可用。

### 5.3 必须理解的路由语义

- 强边：确定下一步，只能有唯一目标；
- 弱边：多个合法候选，由 Main 或当前 Agent 判断；
- 循环：允许返回之前的 Agent，例如“研究—评审—修改—再评审”；
- Main：唯一的系统控制 Agent，负责全局路由和完成判断；
- `termination.automatic: false`：终止 Agent 完成后交回 Main 判断；
- `termination.automatic: true`：满足严格条件的终止 Agent 可以直接结束任务。

### 5.4 必须理解的 Harness

Harness 是实际运行 Agent 的 CLI，不是模型名称。

- Codex、pi、dsh 的参数和协议不同；
- 模型网关提供的协议也可能不同；
- SDK 会在必要时启动本地协议转换代理；
- 某个 Harness 不支持某项权限或功能时，不能假装支持。

判断 Harness 问题时至少要问清：

1. 操作系统；
2. Harness 名称和版本；
3. 实际可执行文件路径；
4. model；
5. 网关协议；
6. 失败的是普通文本、流式文本、普通工具还是流式工具；
7. 是否使用 Skill、MCP、Web 搜索、会话恢复或 compute。

## 6. 别人可能提出哪些需求

收到需求时，先判断它属于哪一层，不要看到“科研任务”就全部改 SDK。

| 需求示例 | 通常归属 | 判断依据 |
| --- | --- | --- |
| 增加驾驶舱专用参数或后台控制 | 驾驶舱 CLI | 包内已有基础 `workflow`、`run resume` 等命令，业务交互与跨进程控制尚未提供 |
| 终端显示彩色进度条 | 驾驶舱 CLI | SDK 提供事件，如何展示由 CLI 决定 |
| 增加新的 Agent 配置字段 | SDK config + 执行层 | 必须完成校验、执行、兼容性和测试闭环 |
| 支持新的 Harness | SDK Harness 适配层 | 涉及进程启动、权限、协议、会话和真实验收 |
| 支持新的网关协议 | SDK 协议层 | 需要探测、请求/响应、流式和工具调用转换 |
| 支持暂停、取消、补充输入 | SDK 已支持，CLI 负责暴露 | 先确认现有 API 是否已满足交互需求 |
| 用户账号能看到哪些任务 | 驾驶舱业务层 | SDK 不管理账号和多租户权限 |
| 把 API key 存入系统密钥库 | 驾驶舱基础设施 | SDK 只接收并在私有运行目录使用网关配置 |
| Agent 需要新领域工具 | config/Skill/MCP | 先确认是否无需修改 SDK 即可完成 |
| 修改工作流节点和路线 | config | 现有编排能力能描述时，不应硬编码到 SDK |
| 多机器分布式调度 | 新架构需求 | 当前 SDK 是单机、本地持久化执行模型 |

## 7. 收到新需求时应该问什么

至少确认以下七点：

1. 谁是调用者：驾驶舱 CLI、ScienceEvolve、测试程序，还是其他服务？
2. 希望输入什么：config 文件、内存对象、命令行参数，还是数据库记录？
3. 希望观察什么：事件、进度、日志、产物还是最终文本？
4. 涉及哪个平台、Harness、版本、model 和网关协议？
5. 现有 config 是否能表达，只是 CLI 没有暴露？
6. 失败或新增行为的验收标准是什么？
7. 是否要求兼容已有 config、旧任务数据和旧 SDK 版本？

然后按以下顺序判断：

```text
现有 API 已经支持？
  ├─ 是 → 优先改 CLI 或 config
  └─ 否
      ↓
现有 config 能表达？
  ├─ 是 → 补接入或执行缺口
  └─ 否
      ↓
是否应该扩展公开合同？
  ├─ 是 → 设计字段、兼容性、实现、测试、文档、版本
  └─ 否 → 放到业务层或外部服务
```

## 8. 常见问题及推荐回答

### SDK 是否依赖 ScienceEvolve Server？

不依赖。SDK 可以脱离 Web 和 HTTP Server 运行，但仍需要外部 Harness CLI 和模型网关。

### SDK 是否替换了 ScienceEvolve？

没有。当前 SDK 是给驾驶舱等外部调用方使用的独立包，ScienceEvolve 原应用可以继续保留自己的入口。

### 只把 tarball 给驾驶舱就可以了吗？

短期试接可以，正式交付不够。还应提供源码 PR、版本、文档、示例和验收边界。长期最好放入内部包仓库。

### config 可以自定义到什么程度？

可以自定义项目现有合同支持的 Agent、路由、循环、终止条件、Harness、model、Skill 和 MCP，但不会额外发明任意脚本式工作流语言。

### API key 应放在 config 中吗？

不应。config 不保存网关字段；通过 Harness 对应的环境变量或原生 profile 提供网关。

### SDK 自带四个 Harness 吗？

SDK 有三种适配器。`pi` 由 SDK 的 npm 依赖安装并默认使用；Codex、dsh 仍需在调用机器上单独安装。

### 当前 SDK 可以直接使用吗？

可以在本地试接配置驱动工作流：从当前工作区打包，安装 CLI 或导入 SDK，准备 Harness 与 workflow 选择的网关来源，再启动任务。API-key 路径自动执行必要的四阶段测试；Codex 原生 profile 按 §3.5 直接连接。自动测试数量以当前提交的 `npm test` 输出为准，环境前提见 [测试环境要求](../../README_zh-CN.md#测试环境要求)。历史安装包烟测及真实模型报告仅覆盖报告注明的版本和环境，不能替代当前产物验证。

### 如何让 Main 在运行中修改工作流？

使用 2026-09-25 更新后的源码重新打包，在配置中设置 `orchestration.allowMainReconfiguration: true`。SDK 会给 Main 提供 `workflow.json` 和 `apply_workflow`；Main 可增删普通 Agent、调整路由和终止条件，提交成功后新一轮 Main 按新工作流继续。直接编辑同一份 JSON 的 `agents[name]` 可修改 instructions、model、harness、skills、autoSkills 和 mcpServers，对已有 Agent、新增 Agent 和 Main 自身均生效。旧 tarball 仍可能拒绝该字段，须重新安装。具体流程见 [SDK README](../../sdk/README_zh-CN.md#配置与启动)。

### 任务中断后能恢复吗？

任务状态和检查点会保存在 `dataDir`。程序重启后使用 `getRun(id)`，再根据状态调用 `resume()` 或 `respond()`。SDK 默认不会在进程启动时偷偷继续历史任务。

### 可以立即取消吗？

SDK 会中止本地 Harness 调用并保存状态。已经提交到远程计算服务的任务能否撤销，要看远程服务能力。

### 为什么包有三十多 MiB？

因为 tarball 包含内置 Skill 及其资源，确保脱离 ScienceEvolve 源码后仍可使用。正式发布前可以继续审计许可和体积，决定是否拆成可选资源包。

### ScienceEvolve 更新后 SDK 会自动更新吗？

不会。独立 SDK 版本是有意隔离的。适用的修复需要明确同步、测试并发布新 SDK 版本。

### 旧版本能继续使用吗？

可以。驾驶舱通过锁定确切版本或保存 tarball，可以继续使用旧版本。升级前应检查 config 和数据兼容性。

## 9. 常见故障怎样排查

### 9.1 `Executable not found`

检查：

- Harness 是否真的安装；
- 路径是否为绝对路径；
- Windows 是否错误地传入了 `.cmd`；
- JavaScript CLI 是否应该改成 `node.exe + args`；
- 运行驾驶舱的账号是否有执行权限。

### 9.2 网关探测失败

不要只看 HTTP 状态。需要记录：

- 四个阶段中哪一个失败；
- 阶段耗时；
- 是否收到 SSE 结束帧；
- 工具调用名称和参数是否正确；
- Harness 原生协议和网关协议；
- model 是否与测试时相同。

### 9.3 config 校验失败

优先看错误指出的字段，不要先删除配置绕过。

常见原因：

- 未知字段；
- Agent 或路由引用不存在；
- 强边和弱边组合不合法；
- 缺少唯一 Main；
- 相对 Skill 路径没有 config 文件基准目录；
- 选择的 Harness 无法兑现某项权限或能力。

### 9.4 `dataDir` 被占用

同一目录已经被另一个 SDK/ScienceEvolve 进程打开。不要删除锁文件强行继续，应先找到并正常关闭持有者，或者为新实例使用不同目录。

### 9.5 任务停在 paused/interrupted

检查 `snapshot().userIntervention` 和最近事件：

- 等待用户回答时调用 `respond()`；
- 普通暂停时调用 `resume()`；
- 不确定时不要重复创建一个相同任务。

### 9.6 Skill 或 MCP 不工作

检查：

- Skill 路径是否存在；
- 相对路径是否以 config 所在目录解析；
- Skill 是否被暂存到 Agent 工作区；
- MCP URL 和凭据是否有效；
- 当前 Harness 是否通过原生配置、客户端扩展还是 HTTP→stdio 桥接；
- 是否错误地把外部服务故障归因于 SDK。

### 9.7 报问题时必须收集的信息

- SDK 精确版本和 tarball SHA256；
- Node、操作系统和 Harness 版本；
- 脱敏后的 config；
- run ID、状态和最后事件序号；
- 可复现步骤；
- 期望行为与实际行为；
- 脱敏后的错误信息和阶段耗时。

不要要求对方把 API key、Authorization、token 或完整私有数据发进 issue/群聊。

## 10. 代码出问题时从哪里看

| 问题 | 主要文件 |
| --- | --- |
| SDK 对外导出了什么 | `ScienceEvolve/sdk/src/index.ts` |
| start、events、pause、cancel 等公开 API | `ScienceEvolve/sdk/src/client.ts` |
| config 加载、默认值和绑定 | `ScienceEvolve/sdk/src/config.ts` |
| 运行时依赖怎样组装 | `ScienceEvolve/sdk/src/runtime.ts` |
| Agent 如何调度和交接 | `ScienceEvolve/sdk/src/internal/orchestrator.ts` |
| 四 Harness 如何启动 | `ScienceEvolve/sdk/src/internal/multi-harness-runner.ts` |
| Codex 调用 | `ScienceEvolve/sdk/src/internal/codex-runner.ts` |
| 协议转换 | `ScienceEvolve/sdk/src/internal/protocol-router.ts` |
| config/工作流校验 | `ScienceEvolve/sdk/src/internal/validation.ts` |
| 项目和事件持久化 | `ScienceEvolve/sdk/src/internal/storage.ts` |
| MCP 接入 | `ScienceEvolve/sdk/src/internal/configured-mcp.ts` |
| 工作流控制工具 | `ScienceEvolve/sdk/src/internal/orchestration-control-mcp.ts` |
| 生命周期自动测试 | `ScienceEvolve/sdk/tests/sdk.test.ts` |
| config/Harness 兼容测试 | `ScienceEvolve/sdk/tests/config-compatibility.test.ts` |

建议从公开 API 或失败测试开始追踪，不要一上来通读整个 Orchestrator。

## 11. 修改 SDK 时应遵守的原则

### 11.1 一个字段必须形成完整闭环

增加或修改 config 字段时必须回答：

1. 类型和 schema 是否接受？
2. 默认值是什么？
3. 是否被规范化或覆盖？
4. 四个 Harness 分别怎样执行？
5. 不支持时在哪里明确报错？
6. 是否影响持久化、恢复和旧 config？
7. 是否有自动测试和文档？

不能只让校验通过，而执行层忽略。

### 11.2 优先增加通用能力，不硬编码单个业务

如果需求可以通过 config、Skill 或 MCP 表达，应优先使用已有扩展点。只有确实属于所有调用方都需要的运行能力，才扩展 SDK 公共 API。

### 11.3 公共 API 要保守

内部类可以重构，公开 API 一旦被驾驶舱使用，就需要考虑兼容性。破坏性变更应升级主版本或提供迁移期。

### 11.4 不静默降级

无法支持的 Harness、权限、协议或 config 组合，应在任务开始前给出清晰错误，不能偷偷换成别的行为。

### 11.5 不能只跑模拟测试

修改 Harness、协议、流式解析、工具调用或 MCP 后，除单元测试外，还应安排对应真实环境验收。

## 12. 每次交付前的检查表

### 12.1 代码和范围

- [ ] SDK 工作区修改已提交，PR（若创建）只包含本次 SDK 相关修改；
- [ ] 没有网关密钥、token、`.env` 或用户任务数据；
- [ ] 公开 API 变更已经写进 README；
- [ ] config 字段与执行行为一致；
- [ ] 不支持的能力有明确错误；
- [ ] 版本号符合变更范围。

### 12.2 自动验证

在 `ScienceEvolve` 根目录执行：

```sh
npm run typecheck:sdk
npm run test:sdk
npm run build:sdk
npm run smoke:sdk
```

其中 `smoke:sdk` 会：

- 重新打包；
- 检查包内文件；
- 安装到临时目录；
- 从仓库外导入 SDK；
- 跑完模拟科研任务。

### 12.3 生成交付包

```sh
npm pack -w sdk --pack-destination sdk
```

PowerShell 计算校验值：

```powershell
Get-FileHash -Algorithm SHA256 `
  <output-directory>\scienceevolve-sdk-0.1.1.tgz
```

### 12.4 真实验收

如果改动涉及真实运行，还应记录：

- 操作系统；
- Node 版本；
- Harness 名称和版本；
- 网关协议和 model；
- 四个探测阶段结果；
- 一个最小真实任务结果；
- 取消和异常退出后的状态。

## 13. 推荐的交付演示

给 leader 或驾驶舱开发者演示时，十分钟足够：

1. 展示本地 SDK 分支与准备交付的源码范围；若已有 PR，再展示 PR；
2. 在一个仓库外临时项目安装 `.tgz`；
3. 展示一个 config；
4. 创建 SDK 并列出 Harness；
5. 展示 workflow 选择的 profile/env 来源；API-key 路径展示自动四阶段测试，Codex 原生 profile 展示原生连接；
6. 启动一个最小科研任务；
7. 展示实时事件和最终产物；
8. 展示取消或补充输入；
9. 关闭 SDK，再通过 run ID 读取历史；
10. 明确同步前的真实矩阵不覆盖本轮代码，macOS/Linux 尚未验收。

不要在演示里使用真实生产密钥，也不要为了演示隐藏失败阶段。

## 14. 可以直接发给 leader 的交付说明

> config 驱动的 ScienceEvolve SDK 0.1.1 当前可用于本地试接固定工作流，无须启动 ScienceEvolve Web/HTTP Server。包内已有 `scienceevolve` 前台 CLI，外部 Node 程序也可直接导入 SDK；支持默认五 Agent 和现有 config 描述的自定义 Agent、路由、循环与终止条件。
>
> SDK 专用分支已合入当时的 `origin/main`，但没有合回 `main`。交付时附上当前提交的类型检查、`npm test`（数量以实际输出为准）和独立打包 CLI 烟测结果及环境。同步前的 Windows 真实模型/四 Harness 验收仅覆盖当时版本，不能证明当前完整套件在干净 Windows 上通过；详情见 `docs/sdk/main-sync-20260923.md` 和 `docs/sdk/real-acceptance-20260923.md`。
>
> 驾驶舱接入时需要提供 dataDir、所选 Harness 可执行入口（pi 默认由包提供）、模型网关和 workflow config；SDK 提供任务事件、结果和控制接口。Main 动态重配置已在显式授权下提供；当前产物的真实模型与目标平台验收仍需分别执行，不宣称生产全平台可用。

## 15. 接下来最合理的工作顺序

1. 整理并提交当前 SDK 工作区修改，不误把本地分支合入 `main`；
2. 用最终打包产物在 VPN 环境重跑真实 Harness/model 验收，并复核新版 checkpoint 与失败生命周期差异；
3. 让驾驶舱用 tarball 完成一次最小试接，再根据结果调整公开 API；
4. 若业务需要 Main 自动重配置，单独设计并实现其提案、权限和原子提交合同；
5. 在 macOS/Linux 实机完成进程、路径、权限和取消验收；
6. 决定内部 npm registry、包名、版本和发布负责人；
7. 为 config schema、持久化数据和 SDK 版本建立兼容策略；
8. 再考虑包体积、可选 Skill 资源和更完善的 CLI 体验。

## 16. 你现在最应该先学会的五件事

如果时间有限，按这个顺序熟悉：

1. 按 `sdk/examples/README.md` 使用 CLI 加载 workflow 独立跑一次任务；
2. 能解释 `createResearchSdk → gateways.test → start → events → wait → close`；
3. 能看懂一个 `agents + orchestration` config；
4. 能区分“SDK 能力问题、CLI 展示问题、Harness 问题、网关问题”；
5. 能独立运行四条发布检查命令，并向别人说明哪些是真实验收、哪些是模拟测试。

掌握这五件事后，你就可以接住大部分第一轮问题；遇到协议、状态机或 Harness 内部细节时，再按第 10 节定位具体源码。
