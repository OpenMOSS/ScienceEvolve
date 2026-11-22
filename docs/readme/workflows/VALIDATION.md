# 图册交付与验证记录

日期：2026-11-14。当前方法说明见 [METHODS.md](../../../example/METHODS.md)，图册见 [README.md](README.md)。

## 修改范围

- 两仓库同步修正化学 Coscientist 的实验反馈：`experiment → planner`；`optimization` 是 Planner 可选分析扩展。
- 两仓库同步修正 InternAgent 子系统归属：Generation 交 Verification；后者管理 optimization 并按真实批次状态决定实验或复核。SDK 生成源与回归测试一并更新。
- 其他例逐项补充方法顺序、反馈、状态／工具边界、同步／串行适配与外部实验说明，保留现有 controller 和可执行路由。Raven 与 Biomni-R0 不宣称完成未支持／未核验能力。
- 主项目 21 个例：21 张总览＋34 张细节；SDK 23 个例：23＋36。两仓库分别从本地配置生成，来源哈希分别记录。ScientistTwo 有 9 张阶段图。
- 未修改前端组件或科研运行时；截图是使用真实组件的独立文档排版，不是完整应用窗口。

## 通过的检查

1. 当前 SDK 配置加载：**44/44**；21 个共同示例的 `input/routes/scopedWorkflow/loops/termination` 一致。
2. 导出／通用导入解析与真实画布语义：全部来源通过；阶段图覆盖全部密集角色，组内并行入口未丢失。
3. 浏览器截图检查：全部正式图片通过节点计数、276×132 CSS px 卡片尺寸、16 CSS px 标题、标题不溢出、无节点重叠／画布裁切。画布 zoom=1、设备像素比 1.5；路由采样检查未穿过非端点节点。
4. 正式图片 SHA-256、源文件 SHA-256、图片实际尺寸、本地文档链接、关键前端／截图源文件哈希通过。manifest 保存可核对证据。
5. Node 回归：两仓库的 `example/tests/workflow-topology.test.mjs`、`workflow-gallery.test.mjs` 和 SDK `scripts/example-workflows/workflow-topology.test.mjs`，**53 项通过**。
6. Web：`canvas-layout.test.ts`、`scoped-canvas-layout.test.ts`，**17 项通过**。
7. SDK：`tests/research-examples.test.ts`，**14 项通过**；规定的 pretest runtime-sync、资源准备、branding 检查也通过。
8. 针对本次文件的 `git diff --check` 通过。

## 边界与保留项

- 不是人工逐像素视觉验收；几何检查不证明连线交叉数最优，也不验证完整应用中的交互布局。
- 方法导读不是执行图，阶段诱导子图不展示跨阶段边；完整路由保留在总览。阅读页面默认折叠大总览并展示可读细节。
- 未调用真实模型、远程科研服务、GPU、设备或运行科学端到端任务；没有全量测试、全量构建或论文结果复现。
- Raven strict-host 保持阻断；InternAgent 固定双槽限制保留；Biomni-R0 原 training/reward recipe 待核验。
- SDK 生成器与静态例的其他角色提示词存在先前已有的文本排布差异（例如 optimizer 的 TEM 保存句位于提示末尾）；本次严格比较改动角色、完整编排与方法协议，不宣称所有生成文件逐字节一致。
- 既有运行时未提交改动未纳入本次提交。仅创建本地提交，未推送、部署或发布。
