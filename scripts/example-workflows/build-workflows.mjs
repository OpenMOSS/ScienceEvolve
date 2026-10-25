import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const outputIndex = args.indexOf('--output-root');
const root = outputIndex < 0 ? path.resolve(here, '../../example') : path.resolve(args[outputIndex + 1]);
const bridge = await fs.readFile(path.join(here, 'task-bridge.cjs'), 'utf8');
const backendContract = await fs.readFile(path.join(here, 'BACKEND-CONTRACT.md'), 'utf8');
const str = { type: 'string', minLength: 1, maxLength: 4000 };
const text = { type: 'string', minLength: 1, maxLength: 50000 };
const obj = { type: 'object', additionalProperties: true };
const list = { type: 'array', items: str, minItems: 1, maxItems: 100 };
const tool = (name, description, properties = {}, mode = 'read') => ({ name, description, mode,
  inputSchema: { type: 'object', additionalProperties: false,
    required: [...Object.keys(properties), ...(mode === 'write' ? ['requestId', 'expectedRevision'] : [])],
    properties: { ...properties, ...(mode === 'write' ? { requestId: { ...str, maxLength: 128 }, expectedRevision: { type: 'integer', minimum: 0 } } : {}) } } });
const catalog = {
  get_capabilities: tool('get_capabilities', 'Read actual method/tool versions, resources, scope budget, provenance and capability limitations. A design declaration is not a resource probe.'),
  get_state: tool('get_state', 'Read durable current scope revision, budgets, jobs, graph/memory/weight versions and accepted evidence. Do not infer current tasks from an old predecessor handoff.'),
  get_request: tool('get_request', 'Reconcile the original durable request without submitting another job; preserve unknown until authoritative evidence exists.', { originalRequestId: str }),
  get_job: tool('get_job', 'Read actual job status, input/output hashes, error or measurement receipts. Accepted/queued is not completed.', { jobId: str }),
  read_artifact: tool('read_artifact', 'Read a small retained UTF-8 artifact and verify its SHA-256 bytes; paginate large evidence at the backend.', { artifactId: str }),
  export_evidence: tool('export_evidence', 'Create an immutable scope evidence manifest for this actor. Export receipt does not commit SDK branch files or complete a group.', { selection: list }, 'write'),
  search_sources: tool('search_sources', 'Search actual scholarly/web/domain sources and return source IDs, URLs, versions and full-text access references.', { query: str, domains: list }),
  query_knowledge: tool('query_knowledge', 'Retrieve typed cross-domain graph paths plus dense-vector results, ranking and exact supporting source spans.', { query: str }),
  retrieve_memory: tool('retrieve_memory', 'Retrieve an actual SPM, TEM or SKM record with query, similarity, record IDs and injected context; report empty/unavailable explicitly.', { query: str, memoryType: { type: 'string', enum: ['SPM', 'TEM', 'SKM'] } }),
  plan_flow: tool('plan_flow', 'CAS-persist an Agent-authored search/solve/answer FlowGraph revision, typed dependency edges, selected ready nodes and causal evidence. Backend validates, does not autonomously plan.', { graph: obj, assignments: obj }, 'write'),
  claim_flow_node: tool('claim_flow_node', 'Atomically claim one assigned node only when all required dependencies have accepted results; preserve ownership/epoch and prevent duplicate execution.', { nodeId: str, instanceId: str }, 'write'),
  commit_flow_result: tool('commit_flow_result', 'Commit actual node evidence/context and graph entities/relations with lease/epoch; failed or unavailable retrieval cannot be marked successful.', { nodeId: str, leaseId: str, result: obj }, 'write'),
  register_ideas: tool('register_ideas', 'Persist Agent-authored novel ideas, source/memory links, baseline and falsifiable evaluation plan; never launch an external autonomous generator.', { ideas: { type: 'array', items: obj, minItems: 1, maxItems: 20 } }, 'write'),
  evaluate_baseline: tool('evaluate_baseline', 'Enqueue actual fixed baseline code/protocol with locked data split and scorer. Inspect its real terminal receipt before search.', { baselineArtifactId: str, taskManifestId: str }, 'write'),
  select_search_context: tool('select_search_context', 'Apply the explicit numeric graph-Monte-Carlo selection policy and lease a parent/operator context: primary, intra_branch, cross_branch or multi_branch. Return visit/value, ancestors and reference artifact IDs, not a generated proposal.', { ideaId: str, branchId: str, operator: { type: 'string', enum: ['primary', 'intra_branch', 'cross_branch', 'multi_branch'] } }, 'write'),
  submit_candidate: tool('submit_candidate', 'Persist actual Agent-authored source/protocol and enqueue one atomic experiment tied to selected context, task/split/scorer hashes. No black-box MLEvolve invocation.', { contextId: str, source: text, taskManifestId: str }, 'write'),
  record_evaluation: tool('record_evaluation', 'Backpropagate real experiment metrics through the recorded ancestral path; retain reference edges separately from credit ancestry and keep failures.', { candidateId: str, jobReceiptId: str }, 'write'),
  reevaluate_candidate: tool('reevaluate_candidate', 'Enqueue an independent repeat of the retained exact candidate bytes under the locked task/split/scorer and declared repeat seeds; no candidate edits or test-set tuning.', { candidateId: str, taskManifestId: str, repeatPlanId: str }, 'write'),
  save_memory: tool('save_memory', 'Append evidence-derived SPM/TEM/SKM with real experiment/source IDs and baseline-relative labels; online save and retrieval are independent controls.', { memoryType: { type: 'string', enum: ['SPM', 'TEM', 'SKM'] }, record: obj }, 'write'),
  update_research_objective: tool('update_research_objective', 'Persist an Agent-authored task generation-prompt/objective revision and IdeaGraph links from actual paired results, insight and novelty; does not edit SDK workflow.', { objective: obj, evidenceIds: list }, 'write'),
  read_training_recipe: tool('read_training_recipe', 'Read source-verified Biomni-R0 training/reward recipe, base weights, E1 task/environment versions, split/scorer hashes and unresolved parameters. Missing original recipe blocks training.'),
  create_training_plan: tool('create_training_plan', 'Persist the verified immutable task/split/reward/recipe/budget plan. Do not guess optimizer, reward or training stages.', { recipeId: str, plan: obj }, 'write'),
  evaluate_policy: tool('evaluate_policy', 'Enqueue actual locked policy evaluation on a specified split with retained environment traces and independent scorer; sealed held-out labels stay outside model context.', { policyHash: str, splitId: str, planId: str }, 'write'),
  collect_trajectories: tool('collect_trajectories', 'Enqueue bounded fixed-policy interaction rollouts in real Biomni-E1; retain tool observations/actions/errors, terminal outcome, policy and environment hashes.', { policyHash: str, taskIds: list, planId: str }, 'write'),
  score_trajectories: tool('score_trajectories', 'Score retained real trajectories using the plan-locked independent task reward and quality checks; Agent self-grades are not rewards.', { trajectoryManifestId: str, rewardRecipeId: str }, 'write'),
  submit_training: tool('submit_training', 'Enqueue a real trainer job with source-verified recipe, base checkpoint, trajectories, rewards and split hashes. Return an actual job; no fake checkpoints or guessed RL algorithm.', { basePolicyHash: str, recipeId: str, trajectoryManifestId: str, rewardManifestId: str }, 'write'),
  register_checkpoint: tool('register_checkpoint', 'Register only an existing terminal trainer output with parent hash, tokenizer/config/weight bytes and training-log hash.', { trainingJobReceiptId: str }, 'write'),
  deploy_checkpoint: tool('deploy_checkpoint', 'Bind a real checkpoint to an authorized inference endpoint; attest exact loaded bytes and retain previous deployment for rollback.', { checkpointHash: str, authorizationId: str }, 'write'),
  get_deployment: tool('get_deployment', 'Read actual loaded checkpoint hash and health, not a model alias.', { deploymentId: str }),
  promote_checkpoint: tool('promote_checkpoint', 'Promote a source-verified checkpoint only against retained validation evidence and predeclared acceptance policy, with explicit prior-version rollback.', { checkpointHash: str, evaluationReceiptId: str, policyId: str }, 'write'),
  search_device_docs: tool('search_device_docs', 'Retrieve actual device/API manuals matching installed hardware/firmware versions, with source spans and content hashes.', { deviceId: str, query: str }),
  run_code: tool('run_code', 'Run a bounded atomic computation against authorized data in the declared sandbox; return actual exit/errors/output hashes. Never execute wet operations as local code.', { code: text, inputArtifactIds: list }, 'write'),
  register_experiment_plan: tool('register_experiment_plan', 'CAS-register a Planner-authored testable experiment, domain constraints, uncertainties, optimization objective and cumulative budget.', { plan: obj, evidenceIds: list }, 'write'),
  compile_protocol: tool('compile_protocol', 'Compile/check actual code against the exact device/API capability and protocol/plan hashes; retain dry-run and diagnostics without claiming a physical run.', { code: text, deviceId: str, planId: str, manualArtifactIds: list }, 'write'),
  submit_experiment: tool('submit_experiment', 'Enqueue a physically authorized experiment with exact compiled source/device/plan and idempotent receipt. Service validates authorization; Git cannot undo physical work.', { compiledArtifactId: str, deviceId: str, planId: str, authorizationId: str }, 'write'),
  record_observation: tool('record_observation', 'Append authentic raw measurement/error/sample provenance linked to the exact physical job; never substitute simulation or historical data.', { jobReceiptId: str, interpretation: obj }, 'write'),
  evaluate_objective: tool('evaluate_objective', 'Compute the predeclared chemical objective and uncertainty from authentic observations and controls; retain invalid/failed outcomes.', { observationIds: list, objectiveId: str }),
  get_roster: tool('get_roster', 'Read actual Research/Code/Design/Oncall capabilities and conditional Design-to-PPT route; unavailable skills/tools are explicit.'),
  record_host_plan: tool('record_host_plan', 'Persist Host-authored graph/node IDs, dependencies, instance assignments, verdict/continuation budget and cross-graph accepted evidence. State storage does not schedule a dynamic DAG.', { graph: obj, assignments: obj }, 'write'),
  get_node: tool('get_node', 'Read exact node/attempt/instance/epoch, accepted dependencies, completion receipt and output visibility.', { nodeId: str }),
  specialist_step: tool('specialist_step', 'Execute one atomic role-specific domain tool chosen by the SDK specialist. Does not run Raven Host or an autonomous specialist loop.', { nodeId: str, instanceId: str, operation: str, payload: obj }, 'write'),
  record_node_result: tool('record_node_result', 'Persist specialist evidence as provisional, not successor-visible until judged complete; bind instance and ownership epoch.', { nodeId: str, result: obj }, 'write'),
  record_verdict: tool('record_verdict', 'Persist an Agent-authored evidence verdict, separating incomplete/unavailable/invalid and enforcing at most two continuations across resume. Does not control an in-flight SDK node.', { nodeId: str, verdict: { type: 'string', enum: ['complete', 'incomplete', 'unavailable', 'invalid'] }, evidenceIds: list, rationale: str }, 'write'),
  record_stint: tool('record_stint', 'Record playbook round, accepted evidence, budget, stop reason and graph successor lineage; does not implement live graph cancellation or automatic stint execution.', { stint: obj, evidenceIds: list }, 'write')
};

const common = `你在 ScienceEvolve SDK main 内核中执行当前 Inbox 的确切任务。先通过工具发现加载实际 MCP schema，读取 method protocol 和 get_state；不能把前驱完成回执当成自己的新任务。科研决定由你作出，backend 只能提供原子工具。每条结论绑定真实来源/代码/数据/模型/执行回执；pending、unknown、blocked、科学负结果分别记录。写操作用稳定 requestId 和当前 expectedRevision；断线先 get_request 对账，不以新 ID 重复副作用。累计轮次/作业/费用预算保存在专属 scope，恢复不清零；预算未填写则 preflight 阻断。不得修改评分器、测试标签或用聊天分数代替实际结果。各业务角色只写 results/<role>/，导出之后通过当前 Inbox 暴露的真实文件/Git 工具提交、发布、集成，不能把 export 或 staged 控制回执当作已提交。Leader 的 planning turn 只 assign_group_tasks、finish_task 并立即 native Stop，不能轮询等待尚未派发的 worker；后续 integration turn 根据实际 PR/集成回执完成组。遵循实际暴露的工具与锁定权限，不猜参数。只有 Main 审核正式交付与方法证据后才能完成项目；必要工具缺失请求介入并暂停，不能虚构成功或无界重试。`;
const preflight = `核验 requirement 中的真实 Task 清单、来源版本、输入/输出路径、预算、服务 scope、权限以及 get_capabilities 的实际资源探测。能力清单必须来自已部署工具，不把本 workflow 定义当成实现。所有关键原子接口和模型路线具备后才进入方法；否则写 blockers.md，把确切缺口交 Main 后暂停。`;
const delivery = `独立核对原始证据、所有累计预算、失败/unknown 的去向、每项方法门槛与最终 Git/原目录交付。生成 report.md、acceptance.json 和 evidence-index.json，包含 methodAccepted、executedSteps、missingSteps、sourceHashes、actualRunId、scopeId 与限制。前面的研究角色不能替自己盖章；methodAccepted=true 仅限全合同成立。科学负结果可如实报告，缺执行不得伪装为负结果完成。`;

function makeWorkflow({ id, env, roles, permissions = {}, operations, roots, groups = [], input, routes, decisions, condition, protocol, reconfigure = false }) {
  const ids = Object.keys(roles);
  return {
    git: { enabled: true, repositoryName: `scienceevolve-${id}-design-20261014`, repositoryVisibility: 'private' },
    agents: Object.fromEntries(ids.map(actor => [actor, { harness: 'codex', model: 'gpt-6.1-sol', gatewayReasoningOption: 'mid', permission: permissions[actor] || 'workspace', proxy: { mode: 'direct' }, skills: ['project:method-protocol'], autoSkills: [], webSearch: false, sessionPersistence: true, decisionBy: 'main', instructions: `${roles[actor]}\n\n${common}`, mcpServers: [{ name: `${id}-tools`, project: `task-${actor}` }] }])),
    skillDefinitions: { 'method-protocol': { files: { 'SKILL.md': `---\nname: method-protocol\ndescription: ${id} 方法状态、输入输出、循环与验收协议\n---\n先阅读 references/method.md 与 references/backend.md。按当前任务核验真实证据，缺少必需资源时返回阻断。\n`, 'references/method.md': protocol, 'references/backend.md': backendContract } } },
    mcpDefinitions: Object.fromEntries(ids.map(actor => [`task-${actor}`, { command: 'node', entrypoint: 'task-bridge.cjs', args: [], envFrom: { SCIENCEEVOLVE_TASK_BACKEND_URL: `${env}_BACKEND_URL`, SCIENCEEVOLVE_TASK_BACKEND_TOKEN: `${env}_BACKEND_TOKEN`, SCIENCEEVOLVE_TASK_SCOPE_ID: `${env}_SCOPE_ID` }, files: { 'task-bridge.cjs': bridge, 'tools.json': JSON.stringify({ method: id, actor, tools: ['get_capabilities', 'get_state', 'get_request', 'get_job', 'read_artifact', ...(operations[actor] || [])].map(name => catalog[name]) }, null, 2) + '\n' } }])),
    orchestration: { schemaVersion: 3, agents: ids.map(name => ({ name, template: name === 'main' ? 'main' : 'general' })),
      collaborations: groups.map(group => ({ id: group.id, displayName: group.title, memberAgentIds: [], renamePolicy: 'editable' })),
      scopedWorkflow: { schemaVersion: 1, rootAgentIds: roots, groups: groups.map(group => ({ id: group.id, leaderAgentId: group.leader, allowLeaderReconfiguration: false, workflow: { nodes: group.members.map(([nodeId, agentId]) => ({ kind: 'agent', nodeId, agentId })), input: { source: 'input', edges: group.members.map(([target]) => ({ kind: 'parallel', target })) }, routes: Object.fromEntries(group.members.map(([node]) => [node, [{ kind: 'strong', target: 'finish' }]])) } })) },
      input: { source: 'input', target: input }, routes, decisionPlans: decisions,
      allowMainReconfiguration: reconfigure, allowUserIntervention: true,
      termination: { agent: 'audit', condition, decisionBy: 'main', automatic: false },
      resultFormat: { presets: ['markdown', 'code'], custom: '交付 report.md、acceptance.json、evidence-index.json、真实源码/结果/失败回执、版本摘要与 SDK/Git/原目录交付证据。完整方法与缩小/受限模式分开；不以配置校验代替方法验收。' }
    }
  };
}
const strong = target => [{ kind: 'strong', target }];
const weak = (...targets) => targets.map(target => ({ kind: 'weak', target }));

const internProtocol = `# InternAgent 1.5 方法协议\n来源：SOURCES.json 的 fa8c3ee；https://arxiv.org/html/2602.08990v1 §2.1–2.4；固定 docs/deep_research.md、docs/memory_module.md、internagent/stage.py。\n\nTask 是明确的算法发现或经验科学任务，指标/数据/实际执行器由 Task manifest 固定；workflow 承担 Generation→Verification→Evolution。不能调用完整 InternAgent/MLEvolve/DR 自治引擎。\n\n1. preflight 验证真实检索/全文、异构知识图谱+向量排序、embedding、SPM/TEM/SKM、baseline、实验执行/评分与图增强 Monte Carlo 数值接口。缺任一完整目标要求的能力则 blocked。\n2. flow_planner 查询 SPM，建立 search/solve/answer 节点、requires/provides/constrains 边和来源；选择全部依赖满足的任务分给两个研究 worker。它也作组 Leader，但 management turn 不研究、不写业务文件。\n3. 两研究 worker 各自 claim 任务，实际检索/读取全文、图路径/向量证据，commit 结果。FlowGraph 与世界知识图谱是两个结构，不能用一份 Memory.md 替代。组 Finish 后 flow_planner 核验全依赖与知识缺口，补图或转 generation。该固定双槽批次会引入同步屏障，是调度保真限制。\n4. generation 实际消费 TEM/SKM/IdeaGraph，输出可证伪想法、方法、真实 baseline 与评测计划，并保存 memory record IDs。综合 direct/search-augmented/self-driven 三类回答，避免只拼引文。\n5. optimizer_a/b 并行执行图增强 Monte Carlo 的 selection→expansion→simulation→backpropagation。只让工具提供数值选择、租约、执行与回传；候选代码由 Agent 生成。保留 primary、intra_branch、cross_branch、multi_branch 四运算符与来源：父边承担 credit ancestry，引用边不能盲目重复回传。回传每个实际 job 的指标/失败，后续候选消费已返回的跨支经验。\n6. verification 对所有分支/候选/基线独立核对代码和指标，选择复验方案；使用真实重复实验与原 scorer，不向 held-out 测试集调参。\n7. evolution 在每批真实结果后立即保存 TEM/online memory，归纳 SPM；对成对方法/结果提炼长期经验，更新 SKM/IdeaGraph 与 novel research objective/生成 prompt。它改变 Task 的研究方向，不是自动重写 SDK workflow。下一轮 generation 或 flow_planner 必须记录实际消费。\n8. 至少两轮才可主张跨轮反馈，不能把两轮当论文全部尺度。轮数/候选数/时间预算来自 Task manifest，未填写不运行；达到预算输出未接受/负面结果或请求 Main 暂停，不自动加预算。审计包含三子系统、四运算符、真实检索与记忆消费、重复评测和交付。\n\n物理执行需另外明确授权与原子设备接口。算法路径不宣称验证所有湿实验领域；具体 Monte Carlo 公式、operator 参数与 embedding 必须锁定已核验实现，现有桥接器不实现算法。`;
const intern = makeWorkflow({ id: 'internagent-1-5', env: 'SCIENCEEVOLVE_INTERNAGENT', protocol: internProtocol,
  roles: {
    main: '管理 Generation、Verification、Evolution 的证据闭环与预算。查真实 backend 与 Task manifest；不可把单个 AutoDebug baseline 当完整 InternAgent。只在验收/交付成立时完成。',
    preflight: `${preflight} 对照 intern 方法协议逐项核验 FlowGraph、KG、图增强 Monte Carlo 的数值接口和三层记忆/embedding，禁止 silent skip。`,
    flow_planner: '承担 Generation 的 deep-research 规划/合并与 knowledge 组 Leader。实际 retrieve_memory(SPM)、query_knowledge；plan_flow 保存动态 search/solve/answer 依赖图与两个 ready 任务。合并后检查覆盖/矛盾，必要时下一批补图；完整知识支持再交 generation。预备 planning turn 将当前节点、依赖结果、memory IDs 分派给 research_a/b 后停止。',
    research_a: '独立执行分配的主领域 FlowGraph 节点：claim_flow_node→search_sources/实际全文→query_knowledge→commit_flow_result。先核验所有依赖 accepted；保留 URL/版本/证据跨度，失败不提交虚假成功。记录检索到的 SPM 如何改变查询或执行。',
    research_b: '独立执行跨学科 FlowGraph 节点，检索替代机制、反例和跨领域图路径，使用真实来源与向量结果；claim/commit 与 research_a 相同。不能复制另一分支猜测完成，也不能忽略依赖。',
    generation: '生成研究候选并作为 optimization 组 Leader 派工。先读真实 graph 证据、TEM/SKM 和 novelty/历史失败；综合直接回答、检索回答、自驱检索修订，register_ideas 保存证据。实际 evaluate_baseline 并核验真实终态；为两分支明确假设、operator 覆盖与预算。在 management turn 只派发上下文，候选程序由 optimizer 编写。',
    optimizer_a: '分支 A 保留 selection→expansion→真实执行→backpropagation。select_search_context 选择 primary 或 intra_branch，读取真实父/祖先源码与失败；生成完整候选 submit_candidate，get_job 终态后 record_evaluation，随即 save_memory(TEM) 在线保存真实结果/基线相对标签。探索与利用参数来自核验 Task manifest，不能猜算法；保留每次失败及后续消费证据。',
    optimizer_b: '分支 B 先建立可行候选，再在已存在真实高分引用时尝试 cross_branch 和 multi_branch。读取其他支历史与实际源码，组合策略要说明引用位置；没有可用父/引用时返回阶段未就绪，不虚构运算符已覆盖。候选与数值回传同 A，每次评测随即 save_memory(TEM) 在线保存。',
    verification: '读取双分支全量真实候选/失败，独立比较 baseline 与公平 scorer/split、源码、visit/value 更新和引用归属。reevaluate_candidate 在锁定源码/Task/scorer 与预注册重复计划下实际复验，读取真实终态；汇总可信结果和未解决问题交 evolution。不以单次分数提升证明泛化。',
    evolution: '用实际评测结果和成对方法比较保存 TEM/online memory、SPM 与 SKM，更新 IdeaGraph 和生成 prompt/研究目标版本。记录持久化与下一轮可检索 IDs；不改 SDK 本身。达到目标/预算交 audit，否则 generation；知识缺口转 flow_planner。至少两轮实际消费是反馈验收门槛。',
    audit: `${delivery} 特别审核三子系统、四扩展算子及数值回传、FlowGraph/KG 区别、真实 embedding、SPM/TEM/SKM 实际消费；固定双槽批次与原动态调度差异必须明示。`
  },
  operations: { main: [], preflight: ['query_knowledge', 'retrieve_memory'], flow_planner: ['retrieve_memory', 'query_knowledge', 'plan_flow'], research_a: ['retrieve_memory', 'search_sources', 'query_knowledge', 'claim_flow_node', 'commit_flow_result', 'export_evidence'], research_b: ['retrieve_memory', 'search_sources', 'query_knowledge', 'claim_flow_node', 'commit_flow_result', 'export_evidence'], generation: ['retrieve_memory', 'query_knowledge', 'register_ideas', 'evaluate_baseline'], optimizer_a: ['select_search_context', 'submit_candidate', 'record_evaluation', 'save_memory', 'export_evidence'], optimizer_b: ['select_search_context', 'submit_candidate', 'record_evaluation', 'save_memory', 'export_evidence'], verification: ['query_knowledge', 'reevaluate_candidate', 'export_evidence'], evolution: ['retrieve_memory', 'save_memory', 'update_research_objective', 'export_evidence'], audit: ['retrieve_memory', 'query_knowledge', 'export_evidence'] },
  roots: ['main', 'preflight', 'flow_planner', 'generation', 'verification', 'evolution', 'audit'],
  groups: [{ id: 'knowledge', title: 'FlowGraph evidence collection', leader: 'flow_planner', members: [['evidence_a', 'research_a'], ['evidence_b', 'research_b']] }, { id: 'optimization', title: 'Graph augmented Monte Carlo branches', leader: 'generation', members: [['search_a', 'optimizer_a'], ['search_b', 'optimizer_b']] }],
  input: 'preflight', routes: { main: weak('preflight', 'audit'), preflight: weak('flow_planner', 'main'), flow_planner: weak('knowledge', 'generation'), knowledge: strong('flow_planner'), generation: strong('optimization'), optimization: strong('verification'), verification: strong('evolution'), evolution: weak('generation', 'flow_planner', 'audit'), audit: weak('evolution', 'finish') },
  decisions: { preflight: '全部关键原子能力真实可用才 flow_planner；否则 Main 请求介入并暂停，不开始付费/物理任务。', flow_planner: '依赖满足且仍缺证据则 knowledge；知识覆盖、矛盾处理与来源核验后 generation。跨批次 graph revision/预算保留。', evolution: '核对累计轮次和真实 memory 保存/消费；继续实验选 generation，知识缺口选 flow_planner；达到明确停止策略选 audit。不能 silent disable memory。', audit: '仅全方法与交付成立才能 finish；未达证据且仍有授权预算交 evolution，缺服务/预算则 Main 请求介入暂停。' },
  condition: '真实 Generation→Verification→Evolution 至少两轮；带依赖/来源的知识流、四扩展算子及真实数值回传、三层记忆保存与后续消费、可复核实际评测、独立审核和正式集成交付全部成立。批次调度限制已披露；不宣称原论文全域数值复现。'
});

const biomniProtocol = `# Biomni-R0 方法协议\n来源：Biomni 400c1f3 README 的 R0 节与 https://huggingface.co/biomni/Biomni-R0-32B-Preview 。只确认 E1 工具环境中的端到端 RL 与公开权重推理；完整训练/奖励 recipe 仍需核对，不猜具体 RL 算法/奖励系数/SFT 阶段。\n\nTask 是被训练的 policy 在真实 Biomni-E1 中与任务/工具交互，workflow 不冒充 policy 内部 reasoning。外层 gpt-6.1-sol 仅作训练管理和独立审核，不替换训练基础权重。\n\npreflight→curator 固定来源已核验的 recipe、基础 checkpoint、E1/工具/数据版本、train/validation/sealed-test 划分、实际 reward、预算。先 evaluate_policy 真实 baseline，测试标签不进入研究上下文。rollout 用固定 policy 收集真实工具轨迹，reward 用独立 task evaluator 判定；失败、环境错误和格式/正确性奖励若存在需分项保留。trainer 对真实轨迹/奖励提交原子训练 job；queued 不代表权重存在，必须读真实日志/terminal receipt 再 register_checkpoint。deployer 核验真实 checkpoint 字节、tokenizer/config/环境，绑定受授权 endpoint；evaluator 比较同 split、环境和评分器的真实新旧 policy 表现。promote_checkpoint 按预注册 validation 策略作决定；失败不提升，保留旧权重与回退。下一轮 rollout 必须从已证实部署的 policy hash 开始。sealed-test 只作最终独立测试，不用于调参。\n\n权重、轨迹、奖励、训练作业、部署、复评各有不可变 lineage 与摘要；任何 unknown 副作用先 get_request 对账。轮数、rollout 数、max steps、GPU/时间/费用及停止策略来自已验证 recipe/预算，没有默认假算力。运行成品 R0 推理或换成任意小模型训练均不算原 R0 训练复现。此文件是带前置阻断的训练合同设计，backend/train recipe/GPU 未接入。`;
const biomni = makeWorkflow({ id: 'biomni-r0', env: 'SCIENCEEVOLVE_BIOMNI_R0', protocol: biomniProtocol,
  roles: {
    main: '管理 Biomni-R0 的真实训练、权重部署与复评闭环。外层模型不作为 R0 policy；原训练 recipe 未核对或资源不足则暂停，不改用成品推理冒充训练。',
    preflight: `${preflight} read_training_recipe 核验原 recipe、奖励/评分器、基础权重、E1 数据和 GPU/训练部署服务；未核对的参数逐条写 blocker。`,
    curator: '锁定已核验 recipe 与真实任务数据、train/validation/sealed-test 划分、环境/工具版本、预算和验收策略。create_training_plan 保存不可变清单；evaluate_policy 完成实际 baseline 后才交 rollout。去重/泄漏检查和标签隔离必须有证据，不自造数据。',
    rollout: '读取计划与实际 loaded policy hash；固定 policy 在真实 E1 调用 collect_trajectories，观察任务完成/工具错误/终止和累计步数。保存逐步 action/observation/tool receipt 及权重哈希。resume 不重复已终结任务，不代替 Task 的自治研究。',
    reward: '由 source-verified 独立 scorer 调用 score_trajectories，核对 ground truth、正确性/格式项（以真实 recipe 为准）、失败与环境异常的区别。轨迹 hash/任务 hash/奖励 hash 一一对应；缺 recipe 或真标签不训练。',
    trainer: '只消费真轨迹和独立 reward，submit_training 使用核实 recipe 与 base policy hash。轮询已有 job，不能提交替代任务来绕过 unknown。实际终态输出权重后 register_checkpoint；记录优化器/随机种子/训练日志/费用/父权重与 checkpoint bytes，不伪造。',
    deployer: '读取真实训练 checkpoint，验证 tokenizer/config 与全部权重字节摘要；在明确 authorizationId 下 deploy_checkpoint，用 get_deployment 证明实际加载版本及健康。保留前一权重与可回退信息；提交成功不等于已加载。',
    evaluator: '对新旧 policy 在同一固定 validation split/E1/scorer 做真实 evaluate_policy；保留工具轨迹、错误、置信区间/任务分项和预算。依预注册准则 promote_checkpoint；负面不提升，实际 policy hash 决定下一轮。达到预算/目标交 audit；sealed-test 不给训练角色。',
    audit: `${delivery} 逐项审核 trajectory→独立 reward→真实训练日志/权重→已加载部署→复评 lineage 和 held-out 隔离。没有源证实 recipe 不能声称原方法；仅预训练推理报告 methodAccepted=false。`
  },
  operations: { main: ['read_training_recipe'], preflight: ['read_training_recipe'], curator: ['read_training_recipe', 'create_training_plan', 'evaluate_policy', 'export_evidence'], rollout: ['get_deployment', 'collect_trajectories', 'export_evidence'], reward: ['read_training_recipe', 'score_trajectories', 'export_evidence'], trainer: ['read_training_recipe', 'submit_training', 'register_checkpoint', 'export_evidence'], deployer: ['deploy_checkpoint', 'get_deployment', 'export_evidence'], evaluator: ['evaluate_policy', 'get_deployment', 'promote_checkpoint', 'export_evidence'], audit: ['read_training_recipe', 'evaluate_policy', 'get_deployment', 'export_evidence'] },
  roots: ['main', 'preflight', 'curator', 'rollout', 'reward', 'trainer', 'deployer', 'evaluator', 'audit'],
  input: 'preflight', routes: { main: weak('preflight', 'audit'), preflight: weak('curator', 'main'), curator: strong('rollout'), rollout: strong('reward'), reward: weak('trainer', 'rollout', 'main'), trainer: weak('deployer', 'main'), deployer: weak('evaluator', 'main'), evaluator: weak('rollout', 'audit'), audit: weak('evaluator', 'finish') },
  decisions: { preflight: '有来源已核验的训练/reward recipe、E1、权重、真实训练器/GPU/部署/评估才 curator；否则 Main。', reward: '真实奖励合格且训练样本满足已核验 recipe 才 trainer；可修复且预算允许回 rollout；缺定义或错误标签 Main 暂停。', trainer: '真实权重和训练 lineage 已核验才 deployer，否则 Main；unknown 对账，不重训。', deployer: '真实 loaded hash 与健康才 evaluator；失败交 Main 恢复原 job/版本。', evaluator: '已核验策略和剩余预算决定 rollout 或 audit；不能调 sealed-test，不自动增加训练轮次。', audit: '全部训练/部署/复评合同成立且正式交付才 finish；可修复 evaluation 且预算允许选 evaluator，其余暂停。' },
  condition: '源已核验的 R0 recipe、真实 E1 轨迹与独立奖励、真实训练 checkpoint 与完整 lineage、授权部署的实际 loaded hash、独立固定 split 复评、无泄漏与正式交付全部成立；缺 recipe 或只有预训练推理不接受。'
});

const chemicalProtocol = `# 化学 Coscientist 方法协议\n来源：https://www.nature.com/articles/s41586-023-06792-0 与固定 gomesgroup/coscientist 417e82b 支持材料。公开 simple_implementation 只有简单表达式、随机数/停止工具，不是论文完整系统。不能把 Google co-scientist 假设系统混进这个方法。\n\nPlanner 按当前问题选择 web search、设备文档、code 或 experiment；这些工具不是强制顺序全跑，docs/web/code 可再次检索后返回 Planner。Planner 保存研究目标、科学假设、设备/样品/API 与预算，分解具体任务。工具角色完成后必须把实际证据交回 Planner，失败影响下一动作。\n\nCode 根据真实设备手册与 plan 编写完整可执行协议，用原子 sandbox 做必要数值/数据处理，用 compile_protocol 检查设备/API/代码 hash；编译/模拟成功不宣称执行。只有匹配当前计划和设备、具备真实 authorizationId 才由 experiment 提交物理作业。记录设备确认、job/样品 chain、原始测量/失败、代码与手册版本；queued/running/unknown 不计实验结果，断线先对账。\n\noptimization 从原始观测和目标/噪声/对照出发优化下一实验，保留失败并将原因/结果返回 Planner。优化算法和停止条件来自具体实验问题/固定支持材料，不能把随机数或模型自评分当收益。预算是累计实际实验次数/时间/费用，不由 weak route 次数隐含决定。支持历史数据/simulation 的独立评估模式，但它们只验证分析工具，不计湿实验闭环。Git 管理代码和报告，不撤销物理操作。\n\n审计须关联 search/docs/code/device/actual measurement 的完整证据链、真实结果驱动的后续实验、预算/停止和科学限制；Planner 自己写完方案不算任务完成。没有设备服务时 workflow 前置阻断；服务 backend 不得整套调用原 Coscientist。`;
const chemical = makeWorkflow({ id: 'chemical-coscientist', env: 'SCIENCEEVOLVE_COSCIENTIST', protocol: chemicalProtocol,
  roles: {
    main: '监督化学 Coscientist 按需工具委派与真实实验反馈、授权和总预算。区分协议设计、simulation、历史数据与物理执行；后者缺资源则暂停。',
    preflight: `${preflight} 核对真实 web/设备文档/代码 sandbox/编译器/设备作业/测量接口、实际硬件/API 与 authorizationId，不使用 random 工具模拟产率。`,
    planner: '承担论文 Planner，读当前需求和累计实验观测后按需选择 web_search、documentation、code、experiment 或 audit。register_experiment_plan 固定目标、限制、真实来源/设备和预算。只有当前编译代码/手册/设备 hash 与授权齐备才 experiment；缺文献/手册优先检索。科学结论以实际测量为依据。',
    web_search: '针对 Planner 的确切化学问题检索公开真实主来源，读取全文/证据，search_sources 保存 URL/来源跨度/不确定性与矛盾。返回 Planner 的答案和未解决项；不推测实际设备支持。',
    documentation: 'search_device_docs 核对具体硬件、firmware/API 和动作限制，读完整相关指令及错误信息；给 Planner 可执行接口和证据 hash。与设备不匹配或文档不可达返回明确阻断。',
    code: '按当前 plan 与实际手册编写协议/实验代码，用 run_code 做有界的纯计算/数据检查，用 compile_protocol 针对真实设备/API 校验。错误返回 Planner 具体诊断；只有实际编译 receipt 与精确 source/manual/device hash 可用于后续提交。此角色不提交物理实验。',
    experiment: '核对 authorizationId、精确 compiledArtifact/device/plan 和最新状态，submit_experiment 提交真实物理 job。get_job 读 actual status/原始测量/样品/错误；unknown 先 get_request 对账，不能换 ID 或声称取消。record_observation 保留真实 raw receipt 与解释后交 optimization。',
    optimization: 'evaluate_objective 从真实观测/对照计算目标与不确定性；比较先前失败/有效测量，提出下一实验的可检验改动、信息增益和预算成本，返回 Planner。算法来自已核验实验任务，不能把模型打分当产率；负结果保留。',
    audit: `${delivery} 核对 Planner 按需委派、真实设备与文档匹配、source/compile/物理 job/raw measurements 绑定和结果驱动优化。历史分析/模拟可以出报告，但 methodAccepted=false。`
  },
  operations: { main: [], preflight: ['search_device_docs'], planner: ['register_experiment_plan', 'evaluate_objective'], web_search: ['search_sources', 'export_evidence'], documentation: ['search_device_docs', 'export_evidence'], code: ['run_code', 'compile_protocol', 'export_evidence'], experiment: ['submit_experiment', 'record_observation', 'export_evidence'], optimization: ['evaluate_objective', 'export_evidence'], audit: ['evaluate_objective', 'export_evidence'] },
  roots: ['main', 'preflight', 'planner', 'web_search', 'documentation', 'code', 'experiment', 'optimization', 'audit'],
  input: 'preflight', routes: { main: weak('preflight', 'audit'), preflight: weak('planner', 'main'), planner: weak('web_search', 'documentation', 'code', 'experiment', 'audit'), web_search: strong('planner'), documentation: strong('planner'), code: strong('planner'), experiment: strong('optimization'), optimization: strong('planner'), audit: weak('planner', 'finish') },
  decisions: { preflight: '完整湿实验目标必须全部真实工具和设备就绪才 planner；缺设备/authorization 则 Main 暂停。', planner: '按实际缺口与当前 raw observations 选相应工具；experiment 仅在当前 plan/code/device/docs/授权完全匹配时。目标/预算停止才 audit，不强制工具固定链，不从失败回执推断成功。', audit: 'methodAccepted 全部成立并正式交付才 finish；预算允许补证据时 planner，服务缺失/unknown 则请求 Main 暂停。' },
  condition: '真实 web/docs/code 的按需 Planner 委派、匹配实际设备/版本的可执行协议、授权物理实验与原始测量、结果驱动优化/后续实验、预算与独立审计/正式交付全部成立。simulation 或历史数据模式不能满足完整湿实验方法。'
});

const ravenProtocol = `# Raven Host 受限设计与阻断协议\n来源：EverMind-AI/Raven 25c5768 的 dag_graph/dag_runner/dag_control_tools/dag_verdict/dag_resume、config/raven.py、playbook/stint.py；本目录 contract-audit.test.mjs 与 sdk/src/core/scoped-workflow-planner.ts。旧 docs/sdk/raven-fidelity-audit.md 关于单 worker 已过时，但任意 AND 依赖/在线控制缺口仍需按当前合同核对。\n\n本模板只提供固定双 specialist 并行批次＋边界 judge＋Host 决策。严格默认 Host 模式必须在 preflight 阻断，不能拿这个骨架作完整 Raven。scoped input 的 parallel 是原生并发；A→C 与 B→C 会产生两个 C arrival，不是 AND join。backend 只存图/实例/记忆和执行原子工具，不增加第二套 DAG 运行时，也不整套调用 Raven。\n\nHost 根据问题选择自己处理、单次委派或多步 DAG，并保存动态节点/依赖/instance 计划。此固定模板只有两个预绑定 slot，严格任意 roster/instance/每节点 Skills/MCP 需求返回 unsupported。受限批次实验需 Task manifest 明确 limited-batch 模式；Host 只能把当前两个依赖满足节点分给槽位，不能把整个任意 DAG 伪装成固定两支。少于两个任务时另一槽位是明确 idle，不产生任务/完成证据；这是容量演示的适配，不是原单次委派语义。Research/Code/Design/Oncall 按 roster 挑选，Design 的 PPT 路由只有 actual 能力就绪才允许，不强制全角色执行。\n\n每个 specialist 使用确切 node/instance/epoch/context、已 accepted 的跨图证据与实际 memory，逐步选择原子领域工具并保存 provisional 输出。judge 在批次边界检验任务完成，区分 incomplete、judge unavailable、signature invalid；未通过的输出不可给后继。最多两次 continuation（总共三尝试）计数跨重启保留；继续、放弃与重规划是 Host 决策，但此骨架不能对存活 worker 执行这些控制。需要“失败 A 等裁决时 B 继续”、后台通知中 Host 即时响应、取消旧图在途节点/继承已完成引用时，返回完整语义 unsupported，不能改为整批重跑。\n\n持久 stint 包含 playbook/round/budget/stop reason/graph successor 与 evidence。静态 sessionPersistence 仅覆盖两个槽位固定会话，不等价任意动态 instance 注册。恢复通过原 SDK run/state，不声称还原进程中协程/mailbox；孤立未终结节点须 interrupted 对账。strict-host 若未实现关键原生控制只能写 gaps.md 并暂停。离线 Evolver 和实验 Curator 不在此 Host 图内。`;
const raven = makeWorkflow({ id: 'raven-host', env: 'SCIENCEEVOLVE_RAVEN', protocol: ravenProtocol,
  roles: {
    main: '作为 Raven Host 作请求分解、按需 roster/instance 选择、结果整合和停止裁决，并作为 delegation 组 Leader 只管理派工/集成。先核对 method protocol：完整默认 Host 目前应 blocked；limited-batch 只做明确受限验证。原生并行不等于任意动态 DAG。record_host_plan 保留图与 node/instance/依赖/跨图引用，不能越权假设在线控制。',
    preflight: `${preflight} 强制区分 strict-host 与 limited-batch。当前 SDK 缺任意 AND ready-set、后台在线裁决、在途节点取消/图替换及动态 instance/capability 生命周期，strict-host 返回 blocked。只有需求明确受限且原子领域工具真实可用才交 Main。`,
    specialist_a: '固定槽 A，根据 Host 的当前 assignment 选择 actual roster 中一个 specialist，而非固定 Research 身份。核对 nodeId/instanceId/epoch/全部 accepted dependencies 与记忆；逐步 specialist_step 执行确切领域工具并记录真实证据。record_node_result 保存 provisional，未经 judge 不提供给依赖任务。idle 任务不伪造科研工作。',
    specialist_b: '固定槽 B 独立执行 Host 分派的实际 specialist 节点，与 A 使用不同会话/instance。记录领域工具/来源/文件和 provisional result；不能共享未通过输出、猜任何任意动态 instance 或超出绑定 Skills/MCP 的能力。失败报告当前 node，不把整批重跑当 continuation。',
    judge: '在 delegation 的真实两支集成后，对每个 exact node/task 的证据作完成判定，record_verdict 保留 complete/incomplete/unavailable/invalid 差别及每节点最多两次 continuation 总计数。输出未满足判定保持隐藏。若需存活分支中的即时裁决，返回 unsupported 而不是声称此边界审核等价。',
    audit: `${delivery} 明确这是固定双槽/批次边界骨架。严格 Host 的 AND ready-set、instance 排他/逐节点能力、在线失败裁决、replan 取消/epoch、后台通知与 stint 多图必须有原生实证；目前不得接受完整方法。有限模式只报告已验证子项且 methodAccepted=false。`
  },
  operations: { main: ['get_roster', 'record_host_plan', 'record_stint', 'retrieve_memory'], preflight: ['get_roster'], specialist_a: ['get_roster', 'get_node', 'retrieve_memory', 'specialist_step', 'record_node_result', 'export_evidence'], specialist_b: ['get_roster', 'get_node', 'retrieve_memory', 'specialist_step', 'record_node_result', 'export_evidence'], judge: ['get_node', 'record_verdict', 'export_evidence'], audit: ['get_roster', 'get_node', 'export_evidence'] },
  roots: ['main', 'preflight', 'judge', 'audit'],
  groups: [{ id: 'delegation', title: 'Explicit limited two specialist batch', leader: 'main', members: [['slot_a', 'specialist_a'], ['slot_b', 'specialist_b']] }],
  input: 'preflight', routes: { main: weak('delegation', 'audit'), preflight: strong('main'), delegation: strong('judge'), judge: strong('main'), audit: weak('main', 'finish') },
  decisions: { main: 'strict-host 或需要完整在线/任意 DAG 语义则 request_user 暂停，不路由假运行。仅明确 limited-batch、依赖与原子能力核验、累计预算允许时 delegation；子项报告完成时 audit。不自动重配置制造未支持字段。', audit: '受限运行只交付 methodAccepted=false 的子项证据；完整 Host 当前不可 finish。' },
  condition: '完整 Raven 默认 Host 只有所有动态 DAG/AND/instance/在线通知裁决/在途 replan/判定续跑/stint/记忆和领域能力均有实证，且正式交付，才可接受。当前模板不满足该条件；limited-batch 报告保持 methodAccepted=false，并由 Main 暂停/交接。'
});

// Keep research topics in the canonical examples, separate from runtime configuration.
const proposalRoot = path.resolve(here, '../../example');
const additions = await Promise.all([
  ['internagent-1-5', intern],
  ['biomni-r0', biomni],
  ['chemical-coscientist', chemical],
  ['raven', raven]
].map(async ([dir, workflow]) => [dir, workflow,
  await fs.readFile(path.join(proposalRoot, dir, 'research_proposal.txt'), 'utf8')
]));

// Never overwrite an existing example. Use --output-root for isolated generation.
for (const [dir] of additions) for (const name of ['workflow.json', 'research_proposal.txt']) {
  try { await fs.access(path.join(root, dir, name)); throw new Error('Refuse to replace existing '+dir+'/'+name); }
  catch(error) { if(error.code !== 'ENOENT') throw error; }
}
for(const [dir,workflow,input] of additions) {
  await fs.mkdir(path.join(root,dir),{recursive:true});
  await fs.writeFile(path.join(root,dir,'workflow.json'),JSON.stringify(workflow,null,2)+'\n',{flag:'wx'});
  await fs.writeFile(path.join(root,dir,'research_proposal.txt'),input,{flag:'wx'});
}
console.log(JSON.stringify({created:additions.map(([dir])=>dir+'/workflow.json')}));
