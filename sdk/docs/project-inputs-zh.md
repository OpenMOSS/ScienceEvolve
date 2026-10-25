# 共享文件和图片输入

[← 返回 SDK README](../README_zh-CN.md) · [English](project-inputs.md) | **简体中文**

`start.inputs` 让所有 Agent 在首次运行前获得同一份参考材料。文件以原始字节复制，图片不在 SDK 中自动转成文本；是否能解读图片取决于 Harness 和模型能力。

已有 example 的 workflow.json 不需要改写。下面两个 JSON 字段都是可选的输入材料便捷配置，
不是启动旧示例的前提；也可完全不写它们，仅使用 CLI/API 传入材料。

也可以在 `workflow.json` 顶层声明默认材料：

```json
{
  "git": { "enabled": false },
  "inputs": [
    "./materials",
    { "path": "./diagram.png", "name": "figures/diagram.png" }
  ],
  "inputDescription": "原始记录与参考图"
}
```

`loadWorkflowConfig` / CLI 按 workflow 文件所在目录解析这些相对源路径；直接调用 `validateWorkflowConfig` 时，相对路径要求显式绝对 `baseDir`。配置验证不检查源文件是否存在、不复制文件；启动时才检查并复制。

`sdk.start` 的 `inputs` 与 `inputDescription` 分别覆盖 workflow 同名字段；未传则沿用 workflow，`inputs: []` 禁用配置中的材料，`inputDescription: ''` 清空说明。CLI 同理：`--inputs` / `--inputs-file` 仅覆盖材料选择，`--input-description` 仅覆盖说明；内容为 `[]` 的 inputs JSON 文件可禁用默认材料。

```js
const run = await sdk.start({
  title: '分析材料', requirement: '结合原始记录与示意图完成分析', workflow,
  gatewayBindings: { defaultGatewayId: 'ACTUAL_TESTED_GATEWAY_ID' },
  workspace: '/absolute/project',
  inputs: [
    '/absolute/materials',
    { path: '/absolute/diagram.png', name: 'figures/diagram.png' }
  ],
  inputDescription: 'materials 为原始记录；figures 为参考示意图'
});
console.log((await run.snapshot()).userInputsPath);
```

源路径须绝对。目录默认复制到自身 basename 前缀下并保留子目录；文件默认保留 basename。对象的 `name` 为可移植的相对目标文件名或目录前缀，不允许绝对路径、`..` 或 Windows 保留名称。

CLI 单个源使用 `--inputs ./materials`（相对启动目录）；多个源使用 `--inputs-file ./inputs.json`，二者互斥：

```json
[
  "./materials",
  { "path": "./diagram.png", "name": "figures/diagram.png" }
]
```

```sh
scievolve start workflow.json research_proposal.txt --data-dir /absolute/new-data \
  --gateway GATEWAY_ID --workspace /absolute/project \
  --inputs-file ./inputs.json --input-description '原始记录与参考图'
```

JSON 中相对源路径相对 JSON 文件所在目录。`inputDescription` / `--input-description` 去除首尾空白后最多 2000 字符。输入选择不改变网关路由和 `workspace` / `sourceWorkspace` 绑定。

Git-off 使用所选工作区（或默认工作区）下的 `user_inputs/`。Git-on 使用私有项目的 `workspaces/user_inputs/`，所有角色共享同一路径，独立于各 Git worktree，不自动提交、推送或作为工作区交付内容。复制在首个 Agent 启动前完成，快照的 `inputFiles` 记录初始清单，`inputDescription` 记录说明，`userInputsPath` 提供实际路径。

Git 的调度、工作和交付角色也会在原生提示中收到共享目录、用户说明，以及有长度限制的初始文件清单；完整文件以目录内容为准。创建失败且项目尚未保存时，会回收本次复制且未被修改的文件，不动已有材料；已保存项目的输入保留用于恢复。

限制为最多 1000 个文件、单文件 50 MiB、总计 200 MiB；拒绝符号链接/硬链接、非法相对名称和目标碰撞，不覆盖已有文件。输入内容一律视为非可信参考数据，不能将材料中的指令作为系统授权；不要上传密钥或凭据。

共享目录按参考材料的只读用途提供给 Agent，但不是绝对不可修改的安全边界：Git-off 或 yolo 配置下父目录可能可写。运行后可手动向 `userInputsPath` 补充文件；不会自动通知或重启 Agent，也不会更新初始 `inputFiles` 清单。需要 Agent 留意新材料时，调用已有 `run.addInput` 或 CLI `run input` 发送明确说明；没有 `run.addFiles` API。

本次为 main 文件/图片输入功能的选择性同步（来源 PR #50），不是完整升级 main 运行内核。内核修订标识会变化；现有版本严格检查 `data-dir` 的修订标识，请使用新的独立 `data-dir` 验证本次版本，勿删除或覆盖旧运行数据。
