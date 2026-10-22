# 远端路径

理解共享盘作用域、存储池、挂载隔离和 Path Alias 时先看本页。调度条件和资源规格看 [`resources-and-paths.md`](resources-and-paths.md)；公网 / 内部源看 [`network-and-sources.md`](network-and-sources.md)。

## 1. 路径不是调度条件

Path Alias 是远端路径 Alias，不是 Workload Profile。它只回答“文件在哪里”，不回答“任务在哪里跑”。

| 概念 | 保存什么 | 不能替代 |
| --- | --- | --- |
| Workload Profile | `workspace`、`project`、`group`、`quota`、`image` | 远端目录 |
| Path Alias | 共享盘上的目录 | `workspace`、`project`、`group`、`quota`、`image` |

账号级 `[path_aliases]` 提供默认远端路径；仓库级、账号隔离的 `[path_aliases]` 可以覆盖当前 Repo 的同名 Alias。不要维护单独的“远端工作目录”字段。

### ScienceEvolve 动态存储归属

ScienceEvolve Execution Agent 不预设固定存储池。每次创建 Workload 前，以运行时注入的 `SCIENCEEVOLVE_ROLE_WORKSPACE` 为唯一当前工作区事实：

1. 规范化 `SCIENCEEVOLVE_ROLE_WORKSPACE` 的真实路径，并确认它位于 `SCIENCEEVOLVE_INSPIRE_WORKSPACE_ROOT` 边界内。不使用当前 shell 的偶然 `cwd`、历史会话或文档示例代替这两个运行时事实。
2. 从真实工作区的 `/inspire/<tier>/...` 前缀提取 `<tier>`。这个值由当前部署决定，Skill 不写死任何存储池名称。
3. 任务源码、启动脚本、工作目录、输入、Checkpoint、日志和结果默认位于该工作区或其子目录。提交前检查 `--cwd`、命令文本和所有显式输入输出路径，不得静默切换到其他 `<tier>`。
4. 必须使用 Path Alias 时，选择并验证与当前 `<tier>` 一致的 `<tier>.me` 或 `<tier>.public`。`me` 和 `public` 只有在当前合并配置显示它们解析到同一 `<tier>` 时才可使用；不从 Alias 名称猜测其目标。
5. 无法解析真实工作区、路径不在允许边界内、Alias 存储池不一致，或目标 Workload 看不到该项目路径时，停止创建并向用户说明。只有用户明确要求跨存储池，并已确认目标路径在当前项目可见时，才能偏离默认归属。

## 2. 路径作用域

| 作用域 | 路径形状 | 定位 |
| --- | --- | --- |
| 项目个人 | `/inspire/<tier>/project/<topic>/<path-user>/...` | 每项目、每账号一份，适合代码、脚本、调试输出 |
| 项目公共 | `/inspire/<tier>/project/<topic>/public/...` | 项目成员共享，适合数据集、权重、批量结果、checkpoint |
| 全局个人 | `/inspire/<tier>/global_user/<path-user>/...` | 跨项目个人盘，适合小工具和中转 |
| 全局公共 | `/inspire/hdd/global_public/...` | 全平台共享，普通账号通常只读 |

`<path-user>` 是共享盘返回的个人目录名，不一定等于登录 ID。路径事实以文件页 Browser API 发现结果为准。

## 3. 存储池

| 池 | 项目路径前缀 | 定位 |
| --- | --- | --- |
| SSD `gpfs_flash` | `/inspire/ssd/project/<topic>/` | 训练 Hot Path、活跃工作集、Checkpoint 热点 |
| HDD `gpfs_hdd` | `/inspire/hdd/project/<topic>/` | 通用空间，写前看剩余容量 |
| qb-ilm `qb_prod_ipfs01` | `/inspire/qb-ilm/project/<topic>/` | 大容量，顺序读带宽接近 SSD |
| qb-ilm2 `qb_prod_ipfs02` | `/inspire/qb-ilm2/project/<topic>/` | 新的大容量存储池；是否使用以当前工作区和项目路径事实为准 |

`global_public` 只在 HDD。需要 SSD 或 Qb-Ilm 速度时，优先走项目个人或项目公共路径。

## 4. 挂载隔离

实例只挂自身所在项目的 Fileset。其它项目的 `/inspire/{hdd,ssd,qb-ilm,qb-ilm2}/project/<others>/` 在该实例里通常不存在，`ls` 报 `No such file` 不是权限问题。

跨项目搬小文件时，在两个项目各起一个 Notebook，用全局个人路径中转。大数据集或全量 Checkpoint 超出个人 Quota 时，联系项目管理员处理。

## 5. Alias 语义

默认 Alias 由 `inspire init` 写入账号配置；当前 Repo 需要覆盖时，用项目初始化或 Path Alias 命令写仓库级配置。

| Alias | 指向 |
| --- | --- |
| `me` | 当前项目、当前账号、初始化时选择的默认存储池 |
| `public` | 当前项目公共目录、初始化时选择的默认存储池 |
| `global-me` | 当前账号全局目录 |
| `<tier>.me` | 指定存储池下的项目个人目录，例如 `ssd.me`、`hdd.me`、`qb-ilm2.me` |
| `<tier>.public` | 指定存储池下的项目公共目录 |
| `<tier>.global-me` | 指定存储池下的全局个人目录 |

路径参数支持 `alias`、`alias:<subdir>` 和命名 Alias 三种模型。具体命令语法看 CLI Help；Reference 只强调语义：把代码、数据、权重和产物放到远端路径约定里，不把路径含义塞进 Workload Profile。
