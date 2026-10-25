# ScienceEvolve SDK

[English](./README.md) | **简体中文**

[← 返回仓库 README](../README_zh-CN.md)

通过 Node.js 或命令行运行多 Agent 科研工作流，支持评审循环、Git 协作、流程演化、状态持久化与中断恢复。

[源码仓库首页](https://github.com/OpenMOSS/ScienceEvolve/blob/main/README_zh-CN.md)提供快速开始、功能图、23 个源码工作流和上游致谢。

## 安装与 Skill

需要 **Node.js 24+**。当前 0.1.1 通过源码或本地安装包使用。在源码仓库根目录执行：

```sh
npm ci
npm run install:cli
npm run pack:sdk
```

在其他 Node 项目中，将生成的安装包添加为依赖；只需全局 CLI 时改用第二条命令：

```sh
npm install /absolute/scienceevolve-sdk-0.1.1.tgz
npm install -g /absolute/scienceevolve-sdk-0.1.1.tgz
```

pi 随包提供；Codex、Claude Code、DSH 和 [Hermes](docs/hermes-zh.md) 按需安装。[配置编写 Skill](skills/scienceevolve-sdk/SKILL.md) 连同参考文档和模板随包交付，复制到编程 Agent 使用的 Skills 目录后新建会话即可使用。安装后的路径为 `node_modules/@scienceevolve/sdk/skills/scienceevolve-sdk`。

## 科研方法技能库

SDK 按 `general/` 与 `scientific/` 分类提供 **21 个通用与平台技能，以及覆盖 12 个研究领域的 875 个科研方法 Skill**，从 7 万余篇已发表论文中提炼，涵盖假设生成、研究设计、验证、证据分析与迭代。

在工作流中，将所需技能的 `builtin:` ID 配置到目标 Agent 的 `skills` 或 `autoSkills`。构建时会将技能及完整目录一并打包到 `assets/skills`，沿用现有运行时加载与 Harness 能力校验。

[科研方法技能库介绍](https://github.com/OpenMOSS/ScienceEvolve/blob/main/README_zh-CN.md#scientific-skills) · [完整技能目录](https://github.com/OpenMOSS/ScienceEvolve/blob/main/.agents/skills/README_zh-CN.md)

## 配置与启动

选择专用的绝对 `dataDir`，先在该目录[添加并测试模型网关](docs/main-cli-zh.md#部署与启动)，再为 workflow 中的 Agent 配置模型、Harness 和推理档位。启动时使用返回的网关 ID：

```sh
scievolve workflow validate /absolute/workflow.json
scievolve start /absolute/workflow.json /absolute/research_proposal.txt --data-dir /absolute/scienceevolve-data --workspace /absolute/task-project --gateway GATEWAY_ID
```

任务目录须已存在，且任务目录与 `dataDir` 均须使用绝对路径。两个目录分开且互不包含。Git-off 在任务目录中执行；Git-on 使用隔离 worktree，集成后回写结果。按 Ctrl+C 暂停，等待退出，再使用打印出的命令恢复。同一个数据目录同时由一个 SDK 宿主持有。

## Node API

使用已在同一 `dataDir` 中通过模型路由测试的 workflow：

```js
import { readFile } from 'node:fs/promises';
import { createResearchSdk, loadWorkflowConfig } from '@scienceevolve/sdk';

const sdk = await createResearchSdk({ dataDir: '/absolute/scienceevolve-data' });
try {
  const run = await sdk.start({
    title: '科研任务',
    requirement: await readFile('/absolute/research_proposal.txt', 'utf8'),
    workflow: await loadWorkflowConfig('/absolute/workflow.json'),
    workspace: '/absolute/task-project',
    gatewayBindings: { defaultGatewayId: 'GATEWAY_ID' }
  });
  console.log('runId', run.id);
  for await (const event of run.events()) console.log(event);
  const result = await run.wait();
  console.log(result.status, result.artifacts);
  if (result.status !== 'completed') process.exitCode = 2;
} finally {
  await sdk.close();
}
```

`wait()` 在暂停或中断时也会返回。通过 `run.snapshot()`、`pause()`、`resume()`、`addInput()` 和 `respond()` 查看或管理任务。详见 [API 与生命周期参考](skills/scienceevolve-sdk/references/usage.md#esm-api)。

## 按需阅读

以下文档均随安装包提供。

| 你想做什么 | 文档 |
| --- | --- |
| 配置模型、推理档位、原生登录与部署 | [CLI 指南](docs/main-cli-zh.md) |
| 编写 Agent、路由与动态重配置 | [Workflow 参考](skills/scienceevolve-sdk/references/workflow.md) · [Loop](docs/workflow-loops-zh.md) |
| 连接 GitHub 与并行协作 | [认证](docs/main-cli-zh.md#github-认证与-git-协作) · [Git-on v3 workflow](examples/main-runtime/workflow.json) |
| 选择工作目录与输入文件 | [工作目录示例](examples/workspace-examples.md) · [共享材料](docs/project-inputs-zh.md) |
| 接入 Skills、工具与实验平台 | [Skills](skills/scienceevolve-sdk/references/workflow.md#skills-与-mcp) · [MCP](docs/project-mcp-zh.md) · [Inspire / SII](docs/sii-experiments-zh.md) |
| 升级现有部署 | [命名迁移](docs/naming-migration-zh.md) · [运行时迁移](docs/main-runtime-migration-zh.md) |

API 与 CLI 统一使用 main 内核，`@scienceevolve/sdk/main` / `--engine main` 保留为显式别名。legacy 引擎及其包入口已移除；已有旧运行数据需使用旧版本处理。

当前内核基于 main `6bf6a7bb`，更新范围见 [2026-10-16 同步说明](docs/main-sync-20261016-zh.md)。
