# Agent4Sci skills / Agent4Sci 科研技能

The three builtins adapt [Agent4Sci](https://github.com/maszhongming/agent4sci) at commit `74b0e8c4dc55610072bed4326b6bfac24dc77377` (Apache-2.0). Each installed skill carries LICENSE and UPSTREAM.md, including source links and modifications.

| ID | Purpose / 用途 |
| --- | --- |
| `builtin:agent4sci-research` | Literature-grounded hypotheses and experiment registration / 文献调研、研究假设与实验登记 |
| `builtin:agent4sci-experiment` | Implementation, smoke tests, resource use and failure diagnosis / 实验实现、验证、资源使用与失败诊断 |
| `builtin:agent4sci-checklist` | Evidence-based strategic and operational review / 研究策略及实验状态检查 |

## Configure / 配置

For the complete flow, select **all three fixed skills** on each role that may need to read them. Merely mentioning another skill does not install it. The role's instructions decide which phase to execute. Existing fixed/automatic selection behavior is unchanged.

完整流程请为相关角色同时选择三个固定技能，再用角色指令规定执行阶段。技能中引用其他技能不会自动安装或选中它。单独选用 experiment 或 checklist 时，必须已有前序阶段的真实材料。

```json
{"skills":["builtin:agent4sci-research","builtin:agent4sci-experiment","builtin:agent4sci-checklist"],"autoSkills":[]}
```

See [the example workflow](../examples/agent4sci/workflow.json): research → execution → review, with Main coordinating corrections/completion. Replace each model placeholder with an available model and configure its gateway before running. In the Web workflow editor, open an Agent's Skill section, add the three names and retain 固定加载; save/export the workflow and import the same configuration when needed. The example uses a shared Git-off workspace and does not create repositories or launch GPU jobs by itself.

示例为 Git-off 共享工作区。替换所有 model 占位符并配置模型网关后使用；网页中打开 Agent 的 Skill 设置，添加三个技能并保留“固定加载”，随后保存或导出配置。研究角色需要实际搜索能力；实验角色还需要任务数据、可用计算环境和明确预算。

## Adaptation boundaries / 适配边界

- Resolve outputs relative to the assigned workspace and resources relative to the staged SKILL.md. Scripts and references travel with the skill in the SDK package and Server staging.
- Literature review uses actual available delegation or configured role handoffs. A serial role route is not a concurrent spawn. When no delegation is exposed, the same four review categories can run sequentially; record this adaptation. Native agent-type/model registrations are not installed.
- The research helper validates delivered REVIEW.md, REFERENCES.md and UTC done.json once. It reports missing/invalid artifacts with a nonzero exit; it does not poll, perform research or assess scientific correctness.
- Complete prior-stage artifacts must be present before the next stage. In isolated Git worktrees, deliver/integrate them through the platform before checking their paths.
- Checklist runs on request or at experiment milestones. No hourly scheduler, idle reminders or upstream permission hooks are included. Resource allocations, baseline validity and deadlines come from the actual task.

输出路径相对于当前工作区，配套文件相对于已加载的 SKILL.md；不依赖 /workspace。文献调研优先使用实际可用的委派工具或配置好的工作流角色，无委派能力时按四个类别顺序完成。一次性校验脚本只检查交付物是否齐备；不阻塞未来角色运行。checklist 按需或在实验节点调用，不含每小时自动触发。收录验证不等于复现上游论文的科研性能。

## Prerequisites and artifacts / 运行前提与交付物

Use a Python 3 interpreter available in the execution environment for the bundled research validator (`python3` on many Linux hosts, `python` on many Windows hosts); it uses only the standard library. Research needs actual source/search access. Experiments need the task's data, metrics, allocated compute and deadline. Enable only capabilities supported by the configured Harness.

研究校验脚本需要执行环境中可用的 Python 3，无第三方 Python 依赖。调研需要真实搜索或原始资料访问，实验需要任务数据、指标、计算预算与截止时间；是否有这些能力由当前 Harness 和工作流配置决定。

| Phase / 阶段 | Expected handoff / 交付 |
| --- | --- |
| Research / 调研 | Four category directories (`1A`, `1B`, `2A`, `2B`) in a fresh review batch, each with `REVIEW.md`, `REFERENCES.md` and UTC `done.json`; registered hypotheses and experiment plan / 四类调研报告、完成标记、研究假设与实验计划 |
| Experiment / 实验 | Implementation changes, smoke-test evidence, training/validation logs, results and artifact paths / 实现说明、实际验证与训练日志、结果及产物路径 |
| Checklist / 检查 | Assessment tied to actual evidence, corrective tasks, and handoff or completion rationale / 基于证据的检查、待处理行动及交接或完成依据 |

The validator exits 0 with `ready: true` when all supplied review directories contain the required reports and a valid completion marker. Exit 1 with `ready: false` identifies missing, empty or malformed inputs; read `errors`, repair or request the missing handoff, then retry. A readiness result does not assess scientific correctness. No polling or scheduler is started.

校验器成功返回退出码 0 与 `ready: true`；材料缺失、空白或格式错误时返回退出码 1 与 `ready: false`，具体原因在 `errors` 中。按错误补齐材料或交接给相应角色后重试；材料齐备不等于科学结论已经通过评审。

## Troubleshooting / 常见问题

- **Skill missing from the list:** verify the deployed revision includes the three directories. Rebuild/reinstall the SDK, or restart Server after updating its builtin files so the catalog cache is refreshed. / 列表找不到技能：确认部署版本已包含三个目录；SDK 重新构建安装，Server 更新技能文件后重启以刷新目录缓存。
- **Next skill unavailable:** add all three IDs to the relevant role's fixed Skills, or hand off to a role configured with the next skill. / 后续技能未加载：为当前角色同时选择三个固定技能，或交接给已配置下一阶段技能的角色。
- **Resource path missing:** use the actual staged SKILL.md directory as the base for support files and the assigned workspace for outputs. In Git-isolated workflows, complete artifact delivery before consuming another role's paths. / 配套文件找不到：按已加载 SKILL.md 的目录解析资源，按当前工作区解析输出；隔离工作区中的交付物先经平台交付再读取。
- **No hourly prompt:** expected; invoke checklist when requested or at an experiment milestone. / 没有每小时提醒：属于本次集成的预期行为，在需要时或实验节点调用 checklist。
