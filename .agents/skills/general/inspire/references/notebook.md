# Notebook 工作流

创建交互环境、进入容器、管理远端文件、按网络策略暴露容器 HTTP 服务，或用 Notebook 准备可复用环境时看本页。资源条件看 [`resources-and-paths.md`](resources-and-paths.md)；公网和内部源看 [`network-and-sources.md`](network-and-sources.md)；镜像生命周期看 [`image-management.md`](image-management.md)。命令语法和参数以 CLI Help 为准。

## 1. Notebook 的角色

Notebook 是交互工作台，不只是“开一个终端”。

| 角色 | 适用场景 |
| --- | --- |
| 联网准备盒 | 在 `CPU资源空间` 准备公网内容，写共享盘或保存镜像 |
| 内部源验证盒 | 在目标 Workspace 验证 `pip` / Apt / Conda / `npm` / Docker 内部源是否可达 |
| GPU Probe | 在 `分布式训练空间` 小规模验证 CUDA、NCCL、数据路径和训练入口 |
| 远端文件入口 | 通过 `shell` / `exec` / `scp` 管理共享盘文件 |
| 临时服务盒 | 跑 Gradio、FastAPI、OpenAI-Compatible API，再通过 Notebook Proxy 访问 |

`分布式训练空间` 不可上网时，不要把外部下载塞进 GPU Notebook 或 Job 的启动路径。公网内容先放到 CPU 准备盒；只依赖 SII 内部源时可以直接在目标 Notebook 验证。

## 2. 创建前判断

创建 Notebook 前只判断平台语义，不在 Reference 里维护完整命令模板：

1. 用真实 Workspace 选择角色：CPU 准备盒走 `CPU资源空间`，GPU Probe 走 `分布式训练空间`。
2. 用 Quota Live 查询选择合法 `gpu,cpu,mem` 三元组。
3. 确认 Project 是目标项目名，Image 已 `READY`。
4. 需要复用同一调度条件时写 Workload Profile；远端目录仍用 Path Alias。

ScienceEvolve 的 MCP 创建固定使用 `--no-wait --post-start none`。需要启动后动作时，先 defer 等 `resource_ready`，再配置连接并自行启动；不要依赖 CLI 隐含的等待或配置里的 post-start 脚本。

`--auto-stop` 只表达空闲自动停止请求，不覆盖平台管理员设置的自动回收规则或 Workspace 生命周期上限。`分布式训练空间` 的交互式建模实例启动 18 小时后会被自动回收，不受 GPU 利用率等指标影响；长时间训练、批量推理或守护任务应改用 Job、Ray 或 Serving 这类匹配的 Workload。需要在 Notebook 中验证长任务入口时，只跑短 probe，并把正式命令迁移到后台 Workload。

手动 Pin 节点只用于排查坏节点、复现实验或平台同学明确指定节点。节点名是 Compute Group 里的节点名，不是平台 Handle；节点必须属于所选 Group。

## 3. 连接方式

| 入口 | 心智模型 | 受限 Notebook 行为 |
| --- | --- | --- |
| `exec` | 一次性独立命令 | 自动走 JupyterTerminal |
| `shell` | 持久交互会话 | 自动走 JupyterTerminal |
| `scp` | SSH/SCP 文件复制 | 禁止；把同一个 `/inspire/...` 路径改由可上网 Notebook 执行 |
| `ssh` | OpenSSH 交互 | 禁止 |
| `ssh-config` | 给 OpenSSH、`scp`、`rsync`、VS Code Remote SSH 使用 | 禁止；`rsync` 改用可上网 Notebook 的 SSH Config Entry 与同一个 `/inspire/...` 路径 |
| `connection refresh` | 创建/刷新 SSH/Rtunnel Cache | 禁止 |
| `ssh-proxy` | OpenSSH ProxyCommand | 禁止 |
| `proxy-url` | 暴露容器 HTTP 端口 | 默认禁止 |
| `url` | Notebook Web IDE 入口 | 允许 |
| `net-test` | JupyterTerminal 网络探测 | 允许 |

`--workspace` 主要用于首次解析或同名 Notebook 消歧；连接缓存建立后，后续命令通常可按名称使用。缓存是性能和连接复用工具，不是平台事实来源。

连接方式只解决 Transport，不提供外部服务的合规授权。即使 Notebook 可上网并允许 SSH，也仍要按实际接入端点、服务地域、使用条款和项目政策判断模型 API 或 AI 编程服务是否可用；不可上网区不得自建反向隧道、代理、VPN 或中继绕过限制。完整边界见 [`network-and-sources.md`](network-and-sources.md)。

受限 Notebook 的 `exec` 每次仍使用独立临时 Jupyter Terminal，命令结束后立即回收，不共享 `cwd`、环境变量或 Shell 状态。对 H100 / H200 等平台已明确不可上网的类型，CLI 会直接选择 JupyterTerminal，不会先重复执行公网探测；真正执行时优先直达 Notebook Lab 代理，只有直接入口不可用时才回退到完整 IDE 页面发现。

### 跨账号 Notebook 连接

Notebook 连接类命令包括 `ssh`、`exec`、`shell`、`scp`、`ssh-config` 和 `ssh-proxy`。它们的 `--account <name>` 参数使用本地 Account Alias，也就是 `~/.inspire/accounts/<name>/` 的目录名，不是平台登录 Username。`all` 是跨账号扫描 Selector。

不传 `--account` 时，CLI 会先查 Remembered Target Cache；如果没有可用记录，再扫描所有账号下已有的 Cached Bridge。唯一匹配会自动使用；多匹配时会列出候选，交互环境会 Prompt 选择并把选择写入 Target Cache。需要忽略 Remembered Target 时传 `--ignore-target-cache`。

已缓存的联网 Notebook Connection 不要求当前 Active Account 是 Notebook 所属账号。SSH Tunnel 不可用、需要 Rebuild 时，CLI 会自动用目标 Account Alias 对应的 Web Session、账号配置、Playwright Proxy 和 Rtunnel State 重建；用户不需要先 `inspire account use <name>`。受限 Notebook 不刷新 SSH / Rtunnel Connection，命令执行走 JupyterTerminal。

受限 Notebook 的 JupyterTerminal 执行同样复用目标 Account Alias 对应的 Web Session 和代理；显式 `--account <name>` 时不会退回当前 Active Account 的登录态。

没有任何 Cached Connection 时，联网 Notebook 的首次 Bootstrap 仍需要能解析 Notebook 的上下文：通常传 `--workspace <workspace>`，必要时再传 `--account <alias>` 指定所属账号。`ssh-config` 生成的 OpenSSH `ProxyCommand` 会固化解析出的 Account Alias，后续 VS Code Remote SSH / 原生 OpenSSH 连接也按该账号路径执行。

新账号没有默认 SSH 公钥时，联网 Notebook 先执行 `notebook connection refresh <name> --workspace <workspace> --pubkey <公钥文件>` 建立缓存，再执行 `notebook exec <name> --account <alias> --cwd <工作路径> <短启动命令>`。`exec` 不接受 `--workspace`；长实验用短命令启动后台程序，将等待交给系统。公钥和私钥应由运行 Server 的系统用户预先配置，私钥不写入项目知识或实验产物。

使用 `--cwd` 时，后台启动命令整体加括号，例如 `"(nohup python3 probe.py > probe.log 2>&1 < /dev/null & echo LAUNCHED)"`。CLI 会在命令前拼接 `cd … &&`；未分组的 `&` 会把前面的命令链一起放入后台，可能让 SSH 输出连接一直保留到程序退出，失去短启动命令的效果。

`exec` 超过 20 分钟时，把任务写成远端后台进程和 Sentinel 文件。ScienceEvolve 中先用 `sii_register_experiment` 将本次完成文件登记到 SII MCP，再自行启动后台程序；由系统代码查询，完成或失败后通知原会话。Agent 可主动暂存未完成任务并结束本轮，不用从本机持续轮询或同步等待。完成文件的 JSON 使用新的 `request_id` 作为 `run_id`，并在程序结束时原子写入实际 `exit_code`。

## 4. 路径和文件流转

源码同步优先走 Git：本地 push，远端 pull。`notebook scp` 适合少量非 Git 文件、产物下载和临时配置，不适合作为源码同步主路径。

多仓库项目把 Repo 并列放在 `me:<repo>` 这类路径约定下；项目公共数据、权重和 Checkpoint 放 `public` 或指定存储池 Alias。

跨 Workspace 时先确认共享盘作用域：同项目路径通常可见，不同项目路径通常因 Fileset 隔离不可见。

### 受限 Notebook 文件流转

受限 Notebook 不使用 SSH/SCP/`rsync`。文件流转以共享盘为边界：

1. 在同账号、同项目上下文里选择一个可上网 Notebook。
2. 用 `inspire notebook scp <public-notebook> ... /inspire/<storage>/...` 上传或下载共享路径文件。需要 `rsync` 语义时，先为可上网 Notebook 生成 SSH Config，再用外部 `rsync` 操作同一个 `/inspire/...` 路径。
3. 用 `inspire notebook exec <restricted-notebook> "..."` 或 `inspire notebook shell <restricted-notebook>` 在受限 Notebook 内操作同一个 `/inspire/<storage>/...` 路径。

示例：

```bash
# 通过可上网 Notebook 从本机上传到共享盘。
inspire notebook scp cpu-box ./dataset.tar /inspire/hdd/project/topic/user/dataset.tar

# 在受限 Notebook 内直接使用同一共享路径，不走 SSH。
inspire notebook exec gpu-box "ls -lh /inspire/hdd/project/topic/user/dataset.tar"

# 通过可上网 Notebook 下载共享路径产物。
inspire notebook scp cpu-box -d /inspire/hdd/project/topic/user/results.tar ./results.tar

# 为可上网 Notebook 配好 SSH 后，也可以用外部 rsync 操作共享路径。
rsync -av ./dataset/ cpu-box:/inspire/hdd/project/topic/user/dataset/
```

受限 Notebook 上 `/inspire/...` 之外的容器本地路径不能由本地 CLI 直接传输；需要带出时先把产物放到 `/inspire/...`。

## 5. IDE URL 与 HTTP Proxy

Notebook Web IDE URL 是浏览器入口，受启智登录态和项目权限约束，不是 SDK base URL。

容器内 HTTP 服务用 Notebook Proxy 暴露。Proxy 只提供网络通路，不替代应用自己的鉴权；Gradio、FastAPI、LLM API 仍要有自己的登录或 API Key。发布给协作者前做无 Key / 有 Key 对照，确认未授权请求会被拒绝。

不要用本机临时 gateway 绑定 `0.0.0.0` 对外分享，这会绕开启智访问控制。

## 6. 基底环境

项目早期用统一基底镜像起 Notebook，把 Slurm、Ray、分布式训练依赖和项目依赖一次性装好。公网下载放 CPU 准备盒；只缺内部源时可在目标 GPU Notebook 配置验证。

验证通过后保存项目镜像。`image save` 会触发中等时长的保存过程，期间不可操作该 Notebook；保存完成后 Notebook 不会自动停止。保存出的镜像才是后续 Notebook / Job / HPC / Ray / Serving 应复用的稳定环境。

普通 Notebook 中 Slurm 命令因无 Controller 报错是正常现象；只有 HPC 任务运行时才具备完整 Slurm 运行环境。

## 7. 观察与清理

| 工具 | 主要回答 |
| --- | --- |
| `events` | 平台为什么还没调度、为什么启动失败、生命周期走到哪 |
| `metrics` | GPU / CPU / 内存 / I/O 是否真的在工作 |
| `exec` / `shell` | 进容器查进程、文件、日志和应用状态 |

Notebook 卡在 `PENDING`、`CREATING` 或启动失败时先看 Events；显示 `RUNNING` 但业务不推进时看 Metrics，再回到应用日志和产物路径。

终态且不再需要的 Notebook 要清理。Running Notebook 先 `stop`，再 `delete`；不确定是否仍有人使用时跳过。

## 8. 大文件操作

大规模 `mv` / `cp` / `rm` 前先探目录形状：顶层 fan-out、一两个巨型子树、百万级小文件对应的策略不同。

| 形状 | 策略 |
| --- | --- |
| 顶层 fan-out 大且大小均匀 | 顶层并行处理，控制并发 |
| 一两个巨型子树 | 先下钻再并行，否则实际只有一路 |
| 百万级小文件 | 优先使用 `find -delete` 或 `rsync --delete-after` 这类少 fork 的方式 |

超过 20 分钟的操作一律后台运行并写 sentinel；并行度不要无脑拉满，先看文件系统和业务风险。
