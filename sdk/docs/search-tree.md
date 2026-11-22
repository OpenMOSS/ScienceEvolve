# ScienceEvolve 搜索树

搜索树是项目创建时可选的探索记录，省略 `searchTree` 即关闭。创建后不能启停或替换根。它不派任务、不执行实验、不触发业务 PR，也不作为完成门禁。

Web 在新建项目或科研任务草稿中启用并规划方向，运行页「搜索树与探索记录」读取当前结构、候选详情、初始文件快照和变更历史。运行中只有用户可编辑方向；移动父节点同时移动整个子树，删除有子节点的节点会报错。候选由项目中当前有效调用的 Agent 登记、更新和删除。

```json
{
  "searchTree": {
    "root": { "name": "研究起点", "inputFiles": ["reference.txt"] },
    "directions": [
      { "id": "speed", "kind": "direction", "name": "速度", "parentId": "root" },
      { "id": "latency", "kind": "direction", "name": "延迟", "parentId": "speed" }
    ]
  }
}
```

`inputFiles` 可省略；指定时必须是本项目初始上传材料的相对路径。根名称必填，方向可为空。结构必须单根、无环、身份唯一、父节点存在。方向不能放在候选下面。Web、Server 与 SDK 使用相同校验。

Agent 只获得按需查询索引，调用 MCP 工具 `search_tree`。用户 API 为 `POST /api/projects/:id/search-tree`；SDK 使用 `run.searchTree(request)`，无需 Web 服务。查询：

- `{"operation":"overview"}`：当前版本与节点目录，不包含候选结果正文。
- `{"operation":"node","nodeId":"cache"}`：节点详情；可加 `revision` 读取历史版本。
- `{"operation":"subtree","nodeId":"speed"}`：指定子树详情。
- `{"operation":"history","limit":20}`：更新来源与版本；用返回的 `nextBefore` 作为 `before` 翻页。
- `{"operation":"input","path":"reference.txt"}`：原始快照，含 SHA-256 与 base64 内容。

候选写入示例（`expectedRevision` 使用最近读取的版本，`requestId` 标识本次明确更新）：

```json
{
  "operation": "put",
  "requestId": "record-cache-proposal-1",
  "expectedRevision": "<metadata commit SHA>",
  "node": {
    "id": "cache", "kind": "candidate", "parentId": "latency", "name": "复用缓存",
    "goal": "减少重复计算", "source": "当前 Agent 提出的方案",
    "version": { "status": "uncommitted" },
    "execution": { "status": "not_started" }
  }
}
```

候选可保存 `change`、`parameters`、`result`、`evidence`、`evaluation`。执行状态为 `not_started/running/succeeded/failed/unknown`，成功声明需带证据；未执行想法不得带实验结果或评价。已有业务提交时使用 `version: {status:"committed",commit:"<40位 SHA>"}`，系统核对真实提交对象并保留引用；元数据提交不能冒充业务版本。保存的是有来源的记录，不证明 Agent 的科研判断客观正确。删除使用 `operation: "delete"`、`nodeId`、`requestId` 和 `expectedRevision`。

Git 开启时复用项目平台裸仓库；Git 关闭时在项目数据目录创建 `search-tree.git`，不改用户工作区。权威记录在 `refs/heads/metadata/search-tree`，通过独立索引提交；业务版本保留在 `refs/scienceevolve/search-tree/versions/`，请求回执保留为 Git refs。初始材料不可变；后续工作区改动不会改变快照。查询不产生提交，删除保留历史。没有自动远端备份或 push。

并发写入以 `expectedRevision` 检查实际版本；冲突明确失败。相同身份、相同 `requestId`、相同内容可核对原成功回执，不重复提交；复用 ID 改内容会报错。失败或结果未确认时先查询核对，不自动重试。初始快照限制为每文件 10 MiB、总计 200 MiB，拒绝链接与越界路径。

SDK 的 Workflow 配置保存相同的 `searchTree` 字段。CLI：

```bash
scievolve run search-tree PROJECT_ID request.json
```

该命令读取本地 JSON 请求并使用本地 SDK 运行时，支持与 MCP 相同的查询、更新与版本冲突语义。
