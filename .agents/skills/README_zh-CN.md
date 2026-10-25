<a id="top"></a>

# ScienceEvolve 技能库

[← 返回项目 README](../../README_zh-CN.md#scientific-skills) · [English](README.md#top) | **简体中文**

**899 个内置技能：24 个通用与平台技能 + 875 个领域科研方法技能。**

按用途进入分类目录；运行时仍使用原有 `builtin:<name>` ID，分类目录不属于技能 ID。

| 类别 | 数量 | 目录 |
| :--- | :--- | :--- |
| 通用与平台 | 24 | [general/](general/README_zh-CN.md#top) |
| 领域科研方法 | 875 · 12 个领域 | [scientific/](scientific/README_zh-CN.md#top) |

网页端为 Agent 选择固定技能或自动技能；SDK 使用 `skills` / `autoSkills`。只有选中的技能及其公共依赖会进入对应 Agent 的执行目录。技能不包含模型凭据、数据或实验资源。

## Agent4Sci

新增 `agent4sci-research`、`agent4sci-experiment`、`agent4sci-checklist` 三个技能，覆盖调研 → 实验 → 检查。完整流程同时选中三个固定技能；单独使用后续技能需要前序阶段材料。提供配套文件、固定上游版本与 Apache-2.0 许可；不包含每小时自动提醒。[使用说明与示例](https://github.com/OpenMOSS/ScienceEvolve/blob/main/sdk/docs/agent4sci.md)。
