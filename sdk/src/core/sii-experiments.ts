import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import { promises as fs } from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { AgentRunRequest, ControlAction, TraceSink } from "./types.js";
import type { SessionRef } from "./harness-runtime/contracts.js";
import { collaborationSessionKey } from "./internal/shared/collaboration-session-key.js";
import { redactTrace } from "./utils.js";
import { inspireWorkloadLedgerPath, registrationFromCreateArgs, type InspireWorkloadRegistration } from "./inspire-workload-registry.js";
import { readStagedControlActions } from "./orchestration-control-bridge.js";
import { compileFilesystemAuthority, type CompileFilesystemAuthorityRequest } from "./harness-runtime/filesystem-authority.js";
import { SiiLocalFiles } from "./sii-local-files.js";
import { sameDurableSession } from "./control-result-receipts.js";
import { experimentResultReceived } from "./sii-result-receipt.js";
import type { NativeInputHistoryEvidence } from "./harness-runtime/native-input-history.js";
import { publishProjectStateDocumentView, type ProjectStateDocumentStore } from "./project-state-documents.js";

const KINDS = ["job", "hpc", "notebook", "ray", "serving"] as const;
const TERMINAL = new Set(["succeeded", "failed", "cancelled", "resource_ready"]);
const BILLING_PROJECT = "具有能动性的科学大模型";
const MAX_OUTPUT = 64 * 1024;
const DEFAULT_CHECK_INTERVAL_MINUTES = 5;
type Kind = typeof KINDS[number];
type RunJson = (args: string[], cwd: string, signal?: AbortSignal) => Promise<unknown>;
export type SiiFilesystemInput = Pick<CompileFilesystemAuthorityRequest,
  "serviceUserRoot" | "projectWorktreeRoot" | "projectWorktrees" | "protectedRoots" | "ownedMemoryPath">;

/** Accepted business choice and current turn role are separate from file scope. */
export function canUseSiiExperiments(request: AgentRunRequest): boolean {
  return request.project.agents[request.agent]?.experimentMcp === true &&
    request.kind === "worker" && request.agent !== "main" &&
    (!request.purpose || request.purpose === "workflow") &&
    request.executionContext?.role !== "leader" &&
    !request.terminalPushObservation && !request.terminalPushCoordination && !request.worktreeClosing;
}

interface NativeNotificationReceipt {
  eventId: string;
  invocationId: string;
  nativeEventId: string;
  nativeCallId?: string;
  session: SessionRef;
  receivedAt: string;
  source?: "native_event" | "native_session_history" | "native_tool_result";
  history?: NativeInputHistoryEvidence["history"];
}

export interface SiiExperiment {
  id: string;
  submissionHash: string;
  owner: string;
  agent: string;
  taskId: string;
  /** Server-supplied original owner, retained across later role/epoch changes. */
  scope?: { projectId: string; invocationId: string; executionId?: string; ownershipEpoch?: number; groupRunId?: string };
  account: string;
  kind: Kind;
  name: string;
  workspace: string;
  runId: string;
  required: boolean;
  session: SessionRef;
  workspacePath: string;
  completionFile?: string;
  status: string;
  rawStatus?: string;
  evidence?: unknown;
  createdAt: string;
  observedAt?: string;
  nextCheckAt: number;
  /** Agent review cadence, independent of the platform status polling rate. */
  checkIntervalMinutes?: number;
  nextAgentCheckAt?: number;
  queryErrors: number;
  queryError?: string;
  monitorAcknowledged?: boolean;
  acknowledged?: boolean;
  notificationReceipt?: NativeNotificationReceipt;
  /** Preparing an MCP response is not proof that the original CLI received it. */
  resultDelivery?: {
    id: string;
    factHash: string;
    fact: Record<string, unknown>;
    invocationId: string;
    session: SessionRef;
    preparedAt: string;
  };
  usageRegistration?: InspireWorkloadRegistration;
  usageRegistered?: boolean;
  registration?: "created" | "existing";
  /** Derived only in the public state projection, never trusted as a receipt. */
  resultReceived?: boolean;
}

interface DeferredTask {
  owner: string;
  ids: string[];
  context: string;
  handoff?: string;
  session: SessionRef;
  status: "waiting" | "ready";
  eventId: string;
  reason?: "experiment_finished" | "monitor_error" | "periodic_check";
  checkExperimentIds?: string[];
  nativeReceipt?: NativeNotificationReceipt;
}
export interface SiiExperimentDocument { version: 1; experiments: SiiExperiment[]; waits: DeferredTask[] }
type Document = SiiExperimentDocument;
interface Options {
  projectsRoot: string;
  inspireBin: string;
  configPath?: string;
  noProxy?: string[];
  workspaceRoot: string;
  knowledgeRoot: string;
  /** Trusted SDK host binding, never accepted from workflow or Agent input. */
  resolveProjectWorkspace?: (projectId: string) => Promise<string | undefined>;
  refreshMs?: number;
  runJson?: RunJson;
  accountReader?: () => Promise<string>;
  documentStore?: ProjectStateDocumentStore;
}

const gates = new Map<string, () => Promise<void>>();
const gateKey = (project: string, agent: string, invocation: string) => `${project}\0${agent}\0${invocation}`;

/** Runs before any finish/routing side effects or completion receipts. */
export async function assertSiiControlAction(project: string, agent: string, invocation: string, action: ControlAction): Promise<void> {
  if (["finish_task", "route_to_agent", "complete_project", "complete_group"].includes(action.tool)) {
    await gates.get(gateKey(project, agent, invocation))?.();
  }
}

export const SII_AGENT_GUIDANCE = "SII operations are available through scienceevolve-sii MCP. Use sii_command for CLI help and all existing platform operations, and sii_read_knowledge for the original Inspire operating knowledge. Submit new workloads with sii_submit_experiment. Set check_interval_minutes to an integer from 5 to 60 (default 5) for periodic reviews in this same session while the experiment is still running. Completion/failure notifications do not wait for that interval. At each periodic review, inspect current logs/metrics with the existing tools and decide whether to continue, adjust, stop or submit a revised experiment; the system does not choose for you. For experiments on an existing notebook/ray/serving resource, call sii_register_experiment before starting your background program with sii_command; use a fresh request_id and completion_file for each run. The server monitors and notifies this same session; do not spend model turns polling. You may continue work within this task that does not require the results. When you need to yield, explicitly call sii_defer_task with the required experiment ids and your own continuation context, optionally adjusting check_interval_minutes, then end this turn with a pending handoff. This ends only a model turn: the task remains unfinished and its successors stay blocked. After notification, inspect actual results and choose further work, retry, cleanup or the existing completion/routing tools yourself. Platform success or a periodic review alone is not task completion.";

const ARGS_SCHEMA = { type: "array", minItems: 1, maxItems: 256, items: { type: "string", maxLength: 32768 } };
const CHECK_INTERVAL_SCHEMA = { type: "integer", minimum: 5, maximum: 60, default: DEFAULT_CHECK_INTERVAL_MINUTES,
  description: "Minutes between original-Agent reviews of an unfinished experiment (5–60, default 5). Platform monitoring stays frequent; completion/failure wakes the Agent without waiting for this interval." };
function checkIntervalMinutes(value: unknown = DEFAULT_CHECK_INTERVAL_MINUTES): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 5 || value > 60)
    throw new Error("check_interval_minutes must be an integer from 5 to 60");
  return value;
}
function nextAgentCheck(experiment: SiiExperiment): number {
  return experiment.nextAgentCheckAt ?? Date.parse(experiment.createdAt) + checkIntervalMinutes(experiment.checkIntervalMinutes) * 60_000;
}
function experimentWakeReason(wait: DeferredTask, experiments: SiiExperiment[]): DeferredTask["reason"] {
  if (wait.status === "ready") return wait.reason ?? "experiment_finished";
  if (experiments.some(e => TERMINAL.has(e.status) && !experimentResultReceived(e))) return "experiment_finished";
  if (experiments.some(e => e.queryErrors >= 3 && !e.monitorAcknowledged)) return "monitor_error";
  if (experiments.some(e => !TERMINAL.has(e.status) && nextAgentCheck(e) <= Date.now())) return "periodic_check";
}
export const SII_TOOLS = [
  { name: "sii_get_task_context", description: "List this unfinished task's saved continuation notes. Use field=context or handoff to read only that note, in bounded character pages. Notifications do not automatically repeat old handoffs or continuation text. This reads only the current invocation-bound task and does not acknowledge experiment results or change state.",
    inputSchema: { type: "object", additionalProperties: false, properties: {
      field: { type: "string", enum: ["context", "handoff"] }, offset: { type: "integer", minimum: 0 },
      maxChars: { type: "integer", minimum: 1, maximum: 16384 }
    } }, annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false } },
  { name: "sii_command", description: "Run one parameterized Inspire CLI operation, including --help, resource/context discovery, notebook exec/scp, images, model registry, diagnostics and cleanup. No shell expansion. Create operations are monitored automatically; prefer sii_submit_experiment to describe completion. Do not run follow/watch/wait loops. Read operating knowledge with sii_read_knowledge.", inputSchema: { type: "object", additionalProperties: false, required: ["args"], properties: { args: ARGS_SCHEMA } } },
  { name: "sii_submit_experiment", description: "Submit an Inspire workload and return immediately after submission/monitoring registration. Supply explicit --name, --workspace and --project. For notebook/ray/serving experiments, supply an Agent-prepared completion_file whose JSON atomically records {run_id: request_id, exit_code}. Submission does not end your turn or complete your task. The system queries and notifies your original session.", inputSchema: { type: "object", additionalProperties: false, required: ["args", "request_id"], properties: { args: ARGS_SCHEMA, check_interval_minutes: CHECK_INTERVAL_SCHEMA, request_id: { type: "string", minLength: 1, maxLength: 200, description: "Stable key for this submission and the completion file's run_id; reuse when its response is lost." }, completion_file: { type: "string", maxLength: 4096 }, required_for_task: { type: "boolean", default: true, description: "True when this task needs the experiment result. False only for resources/background work outside its result requirements." } } } },
  { name: "sii_register_experiment", description: "Register this task's experiment on an EXISTING authorized workload, without creating or restarting resources. For notebook/ray/serving, register a fresh request_id and completion_file BEFORE launching the background program yourself with sii_command. Use the same run_id in its atomic exit marker. The system only checks status/marker and resumes your original session; you decide the program, resource reuse and cleanup.", inputSchema: { type: "object", additionalProperties: false, required: ["kind", "name", "workspace", "request_id"], properties: { check_interval_minutes: CHECK_INTERVAL_SCHEMA, kind: { type: "string", enum: KINDS }, name: { type: "string", minLength: 1, maxLength: 255 }, workspace: { type: "string", minLength: 1, maxLength: 255 }, request_id: { type: "string", minLength: 1, maxLength: 200 }, completion_file: { type: "string", maxLength: 4096 }, required_for_task: { type: "boolean", default: true } } } },
  { name: "sii_submit_batch", description: "Submit multiple experiments using the same create flags as Inspire job batch items, with per-item stable request ids. Each item is independently persisted, monitored and reported, including partial/ambiguous outcomes. You choose every item's resource/command/options; no automatic retry or resource selection.", inputSchema: { type: "object", additionalProperties: false, required: ["experiments"], properties: { experiments: { type: "array", minItems: 1, maxItems: 100, items: { type: "object", required: ["args", "request_id"], properties: { args: ARGS_SCHEMA, check_interval_minutes: CHECK_INTERVAL_SCHEMA, request_id: { type: "string" }, completion_file: { type: "string" }, required_for_task: { type: "boolean" } } } } } } },
  { name: "sii_get_experiment", description: "Read one registered experiment's current persisted state. This is a one-time diagnostic, not a waiting tool. The runtime acknowledges a terminal result only after your original native Session receives this tool response. Inspect the actual evidence before choosing completion.", inputSchema: { type: "object", additionalProperties: false, required: ["experiment_id"], properties: { experiment_id: { type: "string" } } } },
  { name: "sii_defer_task", description: "Voluntarily save this UNFINISHED task and your own continuation context while experiments run. Returns immediately; then end your current turn normally with a pending handoff. The server retains this task and session, monitors in code, and wakes you at the configured review interval while experiments run, or as soon as any listed experiment finishes/fails. A periodic review does not complete an experiment. Do not call finish_task or route successors before processing required results. You can keep doing independent work instead of calling this tool.", inputSchema: { type: "object", additionalProperties: false, required: ["experiment_ids", "context"], properties: { check_interval_minutes: { type: "integer", minimum: 5, maximum: 60, description: "Override the review interval for the listed experiments. Omit to retain each experiment's configured interval (default 5 minutes)." }, experiment_ids: { type: "array", minItems: 1, maxItems: 100, items: { type: "string" } }, context: { type: "string", minLength: 1, maxLength: 20000 } } } },
  { name: "sii_read_knowledge", description: "Read the original Inspire skill and focused references for resource selection, paths/network, notebooks, compute, images, models, installation and platform API knowledge. Omit path to list available documents. Use SKILL.md as entrypoint; read references only as needed. Paths remain confined to the knowledge directory and the filesystem's actual limits.", inputSchema: { type: "object", additionalProperties: false, properties: { path: { type: "string" } } } }
];

function record(value: unknown): Record<string, any> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {}; }
function cliJson(output: string): unknown {
  const clean = output.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "");
  try { return JSON.parse(clean); } catch { /* Some CLI commands emit progress before JSON. */ }
  const starts = /^[\t ]*[\[{]/gm;
  for (let match; (match = starts.exec(clean));) {
    const start = starts.lastIndex - 1;
    let depth = 0, quoted = false, escaped = false;
    for (let end = start; end < clean.length; end++) {
      const char = clean[end];
      if (quoted) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') quoted = false;
      } else if (char === '"') quoted = true;
      else if (char === "{" || char === "[") depth++;
      else if ((char === "}" || char === "]") && --depth === 0) {
        try { return JSON.parse(clean.slice(start, end + 1)); } catch { break; }
      }
    }
  }
  return undefined;
}
function option(args: string[], key: string): string | undefined {
  const inline = args.find(v => v.startsWith(`${key}=`));
  if (inline) return inline.slice(key.length + 1);
  const index = args.indexOf(key);
  return index >= 0 ? args[index + 1] : undefined;
}
function bounded(value: unknown): unknown {
  const text = redactTrace(JSON.stringify(value) ?? "null");
  return text.length > MAX_OUTPUT ? { ...(typeof record(value).success === "boolean" ? { success: record(value).success } : {}),
    preview: text.slice(0, MAX_OUTPUT), truncated: true } : JSON.parse(text);
}
function within(candidate: string, root: string): boolean { const relative = path.relative(root, candidate); return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative)); }
function ownerFor(request: AgentRunRequest): { owner: string; taskId: string } {
  const context = request.executionContext;
  const taskId = request.taskSessionId ?? (context && "executionId" in context ? context.executionId : undefined) ??
    `${collaborationSessionKey(request.agent, context, request.project.orchestration.schemaVersion === 3)}:${context?.nodeRunId ?? request.project.activeAgentExecution?.id ?? request.invocationId}`;
  return { owner: `${request.agent}\0${taskId}`, taskId };
}
export function siiStatus(payload: unknown, kind: Kind): { status: string; raw: string; evidence: unknown } {
  const root = record(payload);
  if (root.success === false) throw new Error(String(root.message ?? root.error ?? "Platform status query failed"));
  const data = record(root.data ?? root.Result ?? root.result ?? root);
  const workload = record(data[kind] ?? data.job ?? data);
  const raw = String(workload.status ?? workload.phase ?? workload.state ?? "unknown");
  const normalized = raw.toLowerCase().replace(/^(job|hpc|notebook|ray|serving)[_:.-]/, "");
  const status = ["succeeded", "success", "completed"].includes(normalized) ? "succeeded" :
    ["failed", "error", "failure"].includes(normalized) ? "failed" :
    ["cancelled", "canceled", "stopped", "terminated"].includes(normalized) ? "cancelled" :
    ["running", "ready"].includes(normalized) ? "running" :
    ["pending", "queued", "creating", "starting"].includes(normalized) ? "queued" : "unknown";
  return { status, raw, evidence: bounded(workload) };
}

export class SiiExperimentService {
  private readonly events = new EventEmitter();
  private readonly queues = new Map<string, Promise<unknown>>();
  private readonly bindings = new Map<string, SiiMcpBinding>();
  private readonly activeCalls = new Set<Promise<unknown>>();
  private readonly activeMutations = new Set<Promise<unknown>>();
  private mutationsClosed = false;
  private stopping?: Promise<void>;
  private starting?: Promise<void>;
  private server?: http.Server;
  private port?: number;
  private timer?: NodeJS.Timeout;
  private refresh?: Promise<void>;
  private readonly controller = new AbortController();
  private documentStore?: ProjectStateDocumentStore;
  private readonly documentVersions = new WeakMap<Document, { projectId: string; version: string }>();
  readonly interval: number;
  readonly runJson: RunJson;
  readonly accountReader: () => Promise<string>;

  constructor(readonly options: Options) {
    this.documentStore = options.documentStore;
    this.interval = options.refreshMs ?? 30_000;
    this.accountReader = options.accountReader ?? (async () => {
      const account = (await fs.readFile(path.join(os.homedir(), ".inspire", "current"), "utf8")).trim();
      if (!account || account.includes("/") || account.includes("\\")) throw new Error("Inspire account is not initialized");
      return account;
    });
    this.runJson = options.runJson ?? ((args, cwd, signal) => new Promise((resolve, reject) => {
      const env = { ...process.env };
      for (const key of ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"]) delete env[key];
      const noProxy = [...new Set([...(env.NO_PROXY ?? env.no_proxy ?? "").split(","), ...(options.noProxy ?? [])].map(value => value.trim()).filter(Boolean))].join(",");
      if (noProxy) { env.NO_PROXY = noProxy; env.no_proxy = noProxy; }
      if (options.configPath) env.INSPIRE_GLOBAL_CONFIG_PATH = options.configPath;
      execFile(options.inspireBin, ["--no-env-file", "--json", ...args], { cwd, env, signal, timeout: 120_000, maxBuffer: 8 * 1024 * 1024, encoding: "utf8" }, (error, stdout, stderr) => {
        if (error) {
          // CLI business rejections can be explicit JSON despite a nonzero exit.
          // Transport/timeouts remain ambiguous and must never trigger a retry.
          const response = cliJson(stdout);
          const failure = record(record(response).error);
          const message = String(failure.message ?? record(response).message ?? "");
          // A nonzero CLI can serialize a transport exception as success:false.
          // That is no platform rejection receipt: creation may be ambiguous.
          const transportFailure = /APIRequestContext\.\w+:[^\r\n]*(?:network socket disconnected|TLS connection|Timeout \d+ms exceeded|ECONNRESET|ETIMEDOUT|ECONNREFUSED)/i.test(message);
          if (record(response).success === false && !transportFailure) { resolve(response); return; }
          reject(new Error(redactTrace(transportFailure ? message : stderr || error.message))); return;
        }
        if (args.includes("--help") || args.includes("--version")) { resolve({ output: stdout }); return; }
        const response = cliJson(stdout);
        if (response !== undefined) { resolve(response); return; }
        // Connection setup and several original CLI operations have no JSON
        // output even with --json. Keep their observed text and exit status.
        // Submission and monitoring still require authoritative JSON facts.
        const needsFacts = KINDS.includes(args[0] as Kind) && ["create", "status"].includes(args[1]);
        if (!needsFacts) { resolve({ output: stdout, exit_code: 0 }); return; }
        reject(new Error("Inspire returned non-JSON output; inspect CLI compatibility"));
      });
    }));
    this.events.setMaxListeners(0);
  }

  async start(): Promise<void> {
    this.controller.signal.throwIfAborted();
    if (this.server) return;
    this.server = http.createServer(async (req, res) => {
      const binding = this.bindings.get(req.url ?? "");
      if (!binding || req.method !== "POST") { res.writeHead(404).end(); return; }
      const server = new Server({ name: "scienceevolve-sii", version: "1.0.0" }, { capabilities: { tools: {} }, instructions: SII_AGENT_GUIDANCE });
      server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: binding.availableTools() }));
      server.setRequestHandler(CallToolRequestSchema, async request => {
        try {
          const value = await binding.call(request.params.name, record(request.params.arguments));
          const result = record(value);
          const rejected = ["sii_command", "sii_submit_experiment", "sii_submit_batch"].includes(request.params.name) &&
            (record(result.result).success === false || record(result.experiment).status === "failed" ||
              Array.isArray(result.results) && result.results.some(item => record(item).error !== undefined || record(record(item).experiment).status === "failed"));
          return { ...(rejected ? { isError: true } : {}),
            content: [{ type: "text" as const, text: JSON.stringify(value) }], structuredContent: result };
        } catch (error) { return { isError: true, content: [{ type: "text" as const, text: redactTrace(error instanceof Error ? error.message : String(error)) }] }; }
      });
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      res.on("close", () => { void transport.close(); void server.close(); });
      try { await server.connect(transport); await transport.handleRequest(req, res); }
      catch { if (!res.headersSent) res.writeHead(500).end(); }
    });
    this.starting = new Promise<void>((resolve, reject) => { this.server!.once("error", reject); this.server!.listen(0, "127.0.0.1", () => resolve()); });
    await this.starting;
    this.controller.signal.throwIfAborted();
    this.port = (this.server.address() as { port: number }).port;
    this.timer = setInterval(() => { void this.refreshNow(); }, this.interval);
    this.timer.unref();
    void this.refreshNow();
  }

  stop(): Promise<void> {
    if (this.stopping) return this.stopping;
    clearInterval(this.timer);
    this.controller.abort();
    this.events.emit("changed");
    for (const binding of this.bindings.values()) binding.close();
    this.bindings.clear();
    this.stopping = (async () => {
      await Promise.allSettled([this.starting]);
      this.server?.closeAllConnections();
      if (this.server) await new Promise<void>(resolve => this.server!.close(() => resolve()));
      this.server = undefined;
      // Accepted calls may still persist an ambiguous submission after abort.
      // Drain their complete lifetime before sealing mutation admission.
      await Promise.allSettled([this.refresh, ...this.activeCalls]);
      this.mutationsClosed = true;
      await Promise.allSettled([...this.activeMutations, ...this.queues.values()]);
    })();
    return this.stopping;
  }

  async trackCall<T>(operation: () => Promise<T>): Promise<T> {
    this.controller.signal.throwIfAborted();
    const call = Promise.resolve().then(operation);
    this.activeCalls.add(call);
    try { return await call; } finally { this.activeCalls.delete(call); }
  }

  async bind(request: AgentRunRequest, signal: AbortSignal, filesystem?: SiiFilesystemInput): Promise<SiiMcpBinding> {
    this.controller.signal.throwIfAborted();
    if (!canUseSiiExperiments(request)) throw new Error("SII MCP requires explicit experimentMcp selection on a business Worker turn");
    if (!/^prj_[a-f0-9]{32}$/.test(request.project.id)) throw new Error("Invalid SII project id");
    const projectPath = await fs.realpath(path.join(this.options.projectsRoot, request.project.id));
    const [actual, physical] = await Promise.all([fs.stat(request.projectPath), fs.stat(projectPath)]);
    if (!within(projectPath, await fs.realpath(this.options.projectsRoot)) || !actual.isDirectory() || actual.dev !== physical.dev || actual.ino !== physical.ino) throw new Error("Invalid SII project directory");
    const workspace = await fs.realpath(request.workspacePath);
    const selectedWorkspace = request.project.git?.enabled !== true
      ? await this.options.resolveProjectWorkspace?.(request.project.id) : undefined;
    if (selectedWorkspace && (!path.isAbsolute(selectedWorkspace) || await fs.realpath(selectedWorkspace) !== selectedWorkspace))
      throw new Error("Selected SII workspace is not canonical");
    if (!within(workspace, await fs.realpath(this.options.workspaceRoot)) && workspace !== selectedWorkspace)
      throw new Error("SII workspace is outside the configured storage root");
    const executionWorktree = request.executionContext?.role !== "leader"
      ? request.executionContext?.executionWorktree : undefined;
    const expected = await fs.realpath(executionWorktree ?? selectedWorkspace ?? path.join(projectPath, "workspaces"));
    const legacyWorkspace = request.project.git?.enabled !== true
      ? path.join(projectPath, "workspaces", request.agent, "shared") : undefined;
    if (workspace !== expected && workspace !== legacyWorkspace) throw new Error("SII workspace does not match this task's assigned directory");
    const authority = await compileFilesystemAuthority({
      // Resident callers supply the same trusted registrations as the native
      // filesystem broker. Legacy tasks have only their one assigned workspace.
      ...(filesystem ?? { serviceUserRoot: workspace, projectWorktreeRoot: workspace,
        projectWorktrees: [workspace], protectedRoots: [] }),
      permission: request.permission, role: request.executionContext?.role ?? "legacy",
      gitEnabled: request.project.git?.enabled === true, executionWorktree: workspace,
      ownedMemoryPath: filesystem?.ownedMemoryPath ?? (request.project.git?.enabled && executionWorktree
        ? path.join(workspace, "agent-memory", request.agent, "Memory.md") : path.join(workspace, "Memory.md"))
    });
    this.controller.signal.throwIfAborted();
    if (!this.server) await this.start();
    const route = `/sii/${randomUUID()}`;
    const binding = new SiiMcpBinding(this, { ...request, projectPath, workspacePath: workspace }, signal,
      `http://127.0.0.1:${this.port}${route}`, () => this.bindings.delete(route), new SiiLocalFiles(workspace, authority));
    this.bindings.set(route, binding);
    return binding;
  }

  configureDocumentStore(store: ProjectStateDocumentStore): void {
    if (this.server || this.queues.size || this.bindings.size) throw new Error("Configure formal experiment storage before starting the monitor or any binding");
    this.documentStore = store;
  }

  private async documentProject(projectPath: string): Promise<string | undefined> {
    if (!this.documentStore) return undefined;
    const [root, actual] = await Promise.all([fs.realpath(this.options.projectsRoot), fs.realpath(projectPath)]);
    const projectId = path.basename(actual);
    if (path.dirname(actual) !== root || !/^prj_[a-f0-9]{32}$/.test(projectId)) throw new Error("Experiment state path is outside the registered projects root");
    return await this.documentStore.domain(projectId) ? projectId : undefined;
  }

  async document(projectPath: string): Promise<Document> {
    const projectId = await this.documentProject(projectPath);
    if (projectId) {
      const record = await this.documentStore!.read(projectId, "sii.ledger");
      if (!record) throw new Error("Registered project has no authoritative experiment ledger");
      const value = record.value as Document;
      if (value.version !== 1 || !Array.isArray(value.experiments) || !Array.isArray(value.waits)) throw new Error("Invalid authoritative SII experiment ledger");
      this.documentVersions.set(value, { projectId, version: record.version });
      return value;
    }
    try {
      const value = JSON.parse(await fs.readFile(path.join(projectPath, "runtime", "sii-experiments.json"), "utf8"));
      if (value.version !== 1 || !Array.isArray(value.experiments) || !Array.isArray(value.waits)) throw new Error("Invalid SII experiment ledger");
      return value;
    } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return { version: 1, experiments: [], waits: [] }; throw error; }
  }

  /** Used both for the pre-submission intent and the final actual response.
   * A file view never becomes a fallback authority for registered projects. */
  async persistDocument(projectPath: string, doc: Document): Promise<void> {
    const projectId = await this.documentProject(projectPath);
    const target = path.join(projectPath, "runtime", "sii-experiments.json");
    if (projectId) {
      const prior = this.documentVersions.get(doc);
      if (!prior || prior.projectId !== projectId) throw new Error("Experiment ledger authority changed; read the current document before deciding another operation");
      const saved = await this.documentStore!.write(projectId, "sii.ledger", doc, prior.version,
        record => publishProjectStateDocumentView(target, record));
      this.documentVersions.set(doc, { projectId, version: saved.version });
      return;
    }
    await fs.mkdir(path.dirname(target), { recursive: true });
    const temporary = `${target}.${randomUUID()}.tmp`;
    try { await fs.writeFile(temporary, `${JSON.stringify(doc)}\n`, { mode: 0o600, flag: "wx" }); await fs.rename(temporary, target); }
    finally { await fs.rm(temporary, { force: true }); }
  }

  async mutate<T>(projectPath: string, operation: (doc: Document) => Promise<T> | T): Promise<T> {
    if (this.mutationsClosed) throw new Error("SII experiment service is stopped");
    const mutation = this.mutateDocument(projectPath, operation);
    this.activeMutations.add(mutation);
    try { return await mutation; } finally { this.activeMutations.delete(mutation); }
  }

  private async mutateDocument<T>(projectPath: string, operation: (doc: Document) => Promise<T> | T): Promise<T> {
    projectPath = await fs.realpath(projectPath);
    const previous = this.queues.get(projectPath) ?? Promise.resolve();
    const job = previous.catch(() => undefined).then(async () => {
      const doc = await this.document(projectPath);
      const result = await operation(doc);
      await this.persistDocument(projectPath, doc);
      this.events.emit("changed");
      return result;
    });
    this.queues.set(projectPath, job);
    try { return await job; } finally { if (this.queues.get(projectPath) === job) this.queues.delete(projectPath); }
  }

  refreshNow(): Promise<void> {
    if (this.controller.signal.aborted) return Promise.resolve();
    if (this.refresh) return this.refresh;
    this.refresh = this.refreshAll().catch(error => { if (!this.controller.signal.aborted) console.warn("SII experiment monitor:", redactTrace(String(error))); }).finally(() => { this.refresh = undefined; });
    return this.refresh;
  }

  async registerUsage(projectPath: string, experiment: SiiExperiment): Promise<void> {
    if (!experiment.usageRegistration || experiment.usageRegistered) return;
    // The existing registry deduplicates crash-replayed appends by workload identity.
    await fs.appendFile(inspireWorkloadLedgerPath(projectPath), `${JSON.stringify(experiment.usageRegistration)}\n`, { mode: 0o600 });
    experiment.usageRegistered = true;
  }

  private async refreshAll(): Promise<void> {
    const entries = await fs.readdir(this.options.projectsRoot, { withFileTypes: true }).catch(() => []);
    // Bounded serial probes avoid flooding the platform and overlapping mutations.
    for (const entry of entries) {
      if (this.controller.signal.aborted) return;
      if (!entry.isDirectory() || !/^prj_[a-f0-9]{32}$/.test(entry.name)) continue;
      const projectPath = path.join(this.options.projectsRoot, entry.name);
      for (const experiment of (await this.document(projectPath)).experiments) {
        if (TERMINAL.has(experiment.status) || experiment.nextCheckAt > Date.now()) continue;
        try {
          if (await this.accountReader() !== experiment.account) throw new Error("Inspire active account changed; restore the submitting account to continue monitoring");
          const payload = await this.runJson([experiment.kind, "status", experiment.name, "--workspace", experiment.workspace], experiment.workspacePath, this.controller.signal);
          const observation = siiStatus(payload, experiment.kind);
          if (experiment.completionFile) {
            if (!["failed", "cancelled"].includes(observation.status)) observation.status = "running";
            const info = await fs.lstat(experiment.completionFile).catch(error => { if (error.code === "ENOENT") return undefined; throw error; });
            if (info && (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1 || info.size > MAX_OUTPUT || !within(await fs.realpath(experiment.completionFile), await fs.realpath(experiment.workspacePath)))) throw new Error("Invalid completion file or path boundary");
            const marker = info ? await fs.readFile(experiment.completionFile, "utf8") : "";
            if (marker) {
              const result = JSON.parse(marker);
              if (result.run_id === experiment.runId && Number.isInteger(result.exit_code)) {
                observation.status = result.exit_code === 0 ? "succeeded" : "failed";
                observation.evidence = bounded({ platform: observation.evidence, completion: result });
              }
            }
          }
          if (!experiment.required && !experiment.completionFile && !["job", "hpc"].includes(experiment.kind) && observation.status === "running") {
            // Explicit resource-only creation can wake the Agent to launch its
            // program. Resource readiness never means a scientific run ended.
            observation.status = "resource_ready";
            observation.evidence = bounded({ platform: observation.evidence, completion_scope: "resource_startup" });
          }
          await this.mutate(projectPath, async doc => {
            const current = doc.experiments.find(e => e.id === experiment.id)!;
            if (TERMINAL.has(current.status)) return;
          if (observation.status !== "unknown") await this.registerUsage(projectPath, current);
            Object.assign(current, { status: observation.status, rawStatus: observation.raw, evidence: observation.evidence, observedAt: new Date().toISOString(), nextCheckAt: Date.now() + this.interval, queryErrors: 0, queryError: undefined, monitorAcknowledged: false });
          });
        } catch (error) {
          if (this.controller.signal.aborted) return;
          await this.mutate(projectPath, doc => {
            const current = doc.experiments.find(e => e.id === experiment.id)!;
            current.queryErrors += 1;
            current.queryError = redactTrace(String(error)).slice(0, 2000);
            current.nextCheckAt = Date.now() + Math.min(300_000, this.interval * 2 ** Math.min(current.queryErrors, 5));
          });
        }
      }
    }
  }

  async waitFor(projectPath: string, owner: string, signal: AbortSignal): Promise<{ wait: DeferredTask; experiments: SiiExperiment[] } | undefined> {
    // Subscribe before reading to close the completion-between-read-and-wait race.
    while (true) {
      signal.throwIfAborted(); this.controller.signal.throwIfAborted();
      let wake!: () => void;
      let reviewTimer: NodeJS.Timeout | undefined;
      const changed = new Promise<void>(resolve => { wake = resolve; });
      this.events.once("changed", wake);
      signal.addEventListener("abort", wake, { once: true });
      try {
        const doc = await this.document(projectPath);
        const wait = doc.waits.find(w => w.owner === owner);
        if (!wait) return undefined;
        const experiments = doc.experiments.filter(e => e.owner === owner && wait.ids.includes(e.id));
        if (experimentWakeReason(wait, experiments)) {
          const ready = await this.mutate(projectPath, state => {
            const current = state.waits.find(w => w.owner === owner);
            if (!current) return undefined;
            const observations = state.experiments.filter(e => e.owner === owner && current.ids.includes(e.id));
            const reason = experimentWakeReason(current, observations);
            if (!reason) return undefined;
            if (current.status !== "ready") {
              current.status = "ready";
              current.reason = reason;
              if (reason === "periodic_check") current.checkExperimentIds = observations
                .filter(e => !TERMINAL.has(e.status) && nextAgentCheck(e) <= Date.now()).map(e => e.id);
            }
            return { wait: structuredClone(current), experiments: structuredClone(observations) };
          });
          if (ready) return ready;
          continue;
        }
        const nextReview = Math.min(...experiments.filter(e => !TERMINAL.has(e.status)).map(nextAgentCheck));
        if (Number.isFinite(nextReview)) {
          // A review deadline must not depend on another status poll, a
          // successful provider response or a ledger mutation to wake us.
          reviewTimer = setTimeout(wake, Math.max(0, nextReview - Date.now()));
          reviewTimer.unref();
        }
        await changed;
      } finally { clearTimeout(reviewTimer); this.events.removeListener("changed", wake); signal.removeEventListener("abort", wake); }
    }
  }
}

export class SiiMcpBinding {
  private readonly controller = new AbortController();
  readonly signal: AbortSignal;
  private resumingEvent?: string;
  private notification?: { eventId: string; text: string; session: SessionRef; experiments: SiiExperiment[] };
  private readonly nativeResultCalls = new Map<string, { experimentId?: string; session: SessionRef }>();
  session?: SessionRef;
  /** Server-only, bounded read of native history when a CLI has no user event. */
  readNativeNotification?: (input: { text: string; session: SessionRef }) => Promise<NativeInputHistoryEvidence | undefined>;
  private active = false;
  private submissions = 0;
  private closed = false;
  private removeGate?: () => void;
  private readonly permission: AgentRunRequest["permission"];
  private readonly identity: { projectId: string; owner: string };
  request: AgentRunRequest;
  constructor(readonly service: SiiExperimentService, request: AgentRunRequest, signal: AbortSignal, readonly url: string,
    private readonly remove: () => void, private readonly files: SiiLocalFiles) {
    this.request = request; this.permission = request.permission;
    this.identity = { projectId: request.project.id, owner: ownerFor(request).owner };
    this.signal = AbortSignal.any([signal, this.controller.signal]);
  }
  get owner(): string { return this.identity.owner; }
  get server(): { name: string; url: string } { return { name: "scienceevolve-sii", url: this.url }; }
  availableTools() { return !this.closed && canUseSiiExperiments(this.request) ? SII_TOOLS : []; }
  activate(request = this.request, session = this.session): void {
    if (this.closed || !canUseSiiExperiments(request) || request.permission !== this.permission || ownerFor(request).owner !== this.owner ||
        request.project.id !== this.identity.projectId || path.resolve(request.workspacePath) !== this.files.cwd) {
      this.close();
      throw new Error("SII capability does not belong to this current Worker task and directory");
    }
    this.nativeResultCalls.clear();
    this.removeGate?.(); this.request = request; this.session = session; this.active = true;
    const key = gateKey(request.project.id, request.agent, request.invocationId);
    const gate = () => this.assertTaskComplete();
    gates.set(key, gate);
    this.removeGate = () => { if (gates.get(key) === gate) gates.delete(key); };
  }
  // Revoke tool access between native turns, but retain the unfinished task's
  // completion guard throughout system-only waiting.
  deactivate(): void { this.active = false; this.nativeResultCalls.clear(); }
  close(): void { this.closed = true; this.controller.abort(); this.deactivate(); this.removeGate?.(); this.removeGate = undefined; this.remove(); }

  async assertTaskComplete(): Promise<void> {
    let doc = await this.service.document(this.request.projectPath);
    if (doc.waits.some(w => w.owner === this.owner && w.status === "ready" && w.nativeReceipt?.eventId !== w.eventId)) {
      await this.observeNativeNotificationHistory();
      doc = await this.service.document(this.request.projectPath);
    }
    if (this.submissions || doc.waits.some(w => w.owner === this.owner && (w.status === "waiting" || w.nativeReceipt?.eventId !== w.eventId)) || doc.experiments.some(e => e.owner === this.owner && e.required && (!TERMINAL.has(e.status) || !experimentResultReceived(e)))) {
      throw new Error("This task still needs experiment results. Continue independent work or call sii_defer_task and return a pending handoff. Process the notification/results before finish_task or routing successors.");
    }
  }

  private async assertUnfinished(): Promise<void> {
    if (!this.request.control) return;
    const staged = await readStagedControlActions(this.request.control.stagingPath);
    if (staged.some(item => ["finish_task", "route_to_agent", "complete_project", "complete_group"].includes(item.action.tool))) throw new Error("This turn already recorded task completion/routing; submit or defer experiments before finishing the task");
  }

  async call(name: string, input: Record<string, any>): Promise<unknown> {
    return this.service.trackCall(() => this.callActive(name, input));
  }

  private async callActive(name: string, input: Record<string, any>): Promise<unknown> {
    this.signal.throwIfAborted();
    if (this.closed || !this.active) throw new Error("SII capability is not attached to an active Agent turn");
    if (!canUseSiiExperiments(this.request)) throw new Error("SII capability is not selected for this current Worker turn");
    if (name === "sii_get_task_context") {
      const wait = (await this.service.document(this.request.projectPath)).waits.find(item => item.owner === this.owner);
      const notes = { context: wait?.context ?? "", handoff: wait?.handoff ?? "" };
      if (input.field === undefined) return { experiment_ids: wait?.ids ?? [],
        fields: Object.entries(notes).map(([field, value]) => ({ field, characters: value.length })) };
      if (!["context", "handoff"].includes(input.field)) throw new Error("Choose field=context or field=handoff from sii_get_task_context");
      const offset = input.offset ?? 0, maxChars = input.maxChars ?? 4096;
      if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(maxChars) || maxChars < 1 || maxChars > 16384)
        throw new Error("offset must be nonnegative and maxChars must be between 1 and 16384");
      const value = notes[input.field as keyof typeof notes];
      return { field: input.field, offset, content: value.slice(offset, offset + maxChars), totalCharacters: value.length,
        nextPage: offset + maxChars < value.length ? { field: input.field, offset: offset + maxChars, maxChars } : null };
    }
    if (name === "sii_read_knowledge") return this.knowledge(input.path);
    if (name === "sii_register_experiment") {
      if (typeof input.request_id !== "string") throw new Error("Provide a stable request_id for this program run");
      if (!KINDS.includes(input.kind) || typeof input.name !== "string" || !/^[\p{L}\p{N}][\p{L}\p{N}._-]{0,254}$/u.test(input.name) || typeof input.workspace !== "string" || !input.workspace.trim() || input.workspace.length > 255) throw new Error("Provide workload kind, name and workspace");
      this.submissions += 1;
      try {
        await this.assertUnfinished();
        return await this.submit([input.kind, "create", "--name", input.name, "--workspace", input.workspace, "--project", BILLING_PROJECT], input, true);
      } finally { this.submissions -= 1; }
    }
    if (name === "sii_submit_batch") {
      if (!Array.isArray(input.experiments) || !input.experiments.length || input.experiments.length > 100) throw new Error("Provide 1–100 experiment submission objects");
      const results: unknown[] = [];
      for (const experiment of input.experiments) {
        try { results.push(await this.call("sii_submit_experiment", record(experiment))); }
        catch (error) { results.push({ request_id: experiment?.request_id, error: redactTrace(String(error)) }); }
      }
      return { results };
    }
    if (name === "sii_get_experiment") return this.service.mutate(this.request.projectPath, doc => {
      const experiment = doc.experiments.find(e => e.id === input.experiment_id && e.owner === this.owner);
      if (!experiment) throw new Error("Experiment does not belong to this task");
      const snapshot = structuredClone(experiment);
      delete snapshot.resultDelivery;
      const received = experimentResultReceived(experiment);
      // Legacy handler-side booleans remain historical data, not native proof.
      if (snapshot.acknowledged && !received) snapshot.acknowledged = false;
      if (!TERMINAL.has(experiment.status) || received) return { experiment: snapshot };
      if (!this.session?.durable) throw new Error("Original SII session has not been durably recorded");
      const factHash = createHash("sha256").update(JSON.stringify(this.notificationFact(experiment))).digest("hex");
      const id = createHash("sha256").update(JSON.stringify([this.identity.projectId, this.owner,
        this.request.invocationId, this.session, experiment.id, factHash])).digest("hex");
      if (experiment.resultDelivery?.id !== id) experiment.resultDelivery = {
        id, factHash, fact: structuredClone(this.notificationFact(experiment)),
        invocationId: this.request.invocationId, session: structuredClone(this.session),
        preparedAt: new Date().toISOString()
      };
      // The marker is carried in the actual MCP result. A matching canonical
      // native tool completion proves CLI receipt, even when its display
      // preview is bounded; neither the handler nor socket write confirms it.
      return { result_receipt: "[OpenFARS SII result " + id + "]", experiment: snapshot };
    });
    if (name === "sii_defer_task") {
      await this.assertUnfinished();
      if (!Array.isArray(input.experiment_ids) || !input.experiment_ids.length || typeof input.context !== "string" || !input.context.trim() || input.context.length > 20000) throw new Error("Provide experiment_ids and your continuation context");
      const intervalOverride = input.check_interval_minutes === undefined ? undefined : checkIntervalMinutes(input.check_interval_minutes);
      if (!this.session?.durable || this.session.nativeId.startsWith("pending:")) throw new Error("Original session has not been durably recorded");
      return this.service.mutate(this.request.projectPath, doc => {
        if (input.experiment_ids.some((id: unknown) => typeof id !== "string" || !doc.experiments.some(e => e.id === id && e.owner === this.owner))) throw new Error("Can defer only this task's experiments");
        const prior = doc.waits.find(w => w.owner === this.owner);
        const wait: DeferredTask = { owner: this.owner, ids: [...new Set<string>(input.experiment_ids)], context: input.context, session: this.session!, status: "waiting", eventId: randomUUID() };
        for (const e of doc.experiments) if (wait.ids.includes(e.id)) {
          if (TERMINAL.has(e.status)) e.acknowledged = false;
          else {
            const previousInterval = checkIntervalMinutes(e.checkIntervalMinutes);
            const previousDeadline = nextAgentCheck(e);
            e.checkIntervalMinutes = intervalOverride ?? previousInterval;
            // Reviewing a faster experiment must not keep postponing a
            // different experiment's later, independently configured review.
            e.nextAgentCheckAt = (prior?.status === "ready" && previousDeadline <= Date.now()) || e.checkIntervalMinutes !== previousInterval
              ? Date.now() + e.checkIntervalMinutes * 60_000 : previousDeadline;
          }
        }
        if (prior) { Object.assign(prior, wait); delete prior.nativeReceipt; delete prior.reason; delete prior.checkExperimentIds; } else doc.waits.push(wait);
        return { status: "awaiting_experiment_result", task_completed: false,
          checks: doc.experiments.filter(e => wait.ids.includes(e.id) && !TERMINAL.has(e.status))
            .map(e => ({ experiment_id: e.id, check_interval_minutes: e.checkIntervalMinutes, next_agent_check_at: e.nextAgentCheckAt })),
          message: "Task saved as unfinished. You can now end this model turn with a pending handoff. The system will resume this same session for periodic reviews of running experiments, or immediately on observed completion/failure. Inspect actual logs/metrics and decide whether to continue, adjust or stop; successors remain blocked until you process results and finish the task." };
      });
    }
    if (name !== "sii_command" && name !== "sii_submit_experiment") throw new Error("Unknown SII tool");
    if (name === "sii_submit_experiment" && typeof input.request_id !== "string") throw new Error("Provide a stable request_id for this submission");
    const args = input.args;
    if (!Array.isArray(args) || !args.length || args.length > 256 || args.some((v: unknown) => typeof v !== "string" || v.includes("\0") || v.length > 32768)) throw new Error("args must be an array of literal CLI arguments");
    if (args.some((v: string) => ["--follow", "--watch", "--wait"].includes(v.split("=")[0]!))) throw new Error("Use a one-time diagnostic; background monitoring already handles waiting");
    const kind = args.find((v: string) => KINDS.includes(v as Kind)) as Kind | undefined;
    const action = kind ? args[args.indexOf(kind) + 1] : undefined;
    const discovery = args.some((value: string) => ["--dry-run", "--dry-run=true", "--help", "--help=true"].includes(value));
    if (action === "batch" && !discovery) throw new Error("Use sii_submit_batch with each item's create arguments and request_id so every experiment is monitored and resumable");
    if (action === "create" && !discovery) {
      this.submissions += 1;
      try { await this.assertUnfinished(); return await this.submit(args, input); }
      finally { this.submissions -= 1; }
    }
    if (name === "sii_submit_experiment") throw new Error("Submit one job/hpc/notebook/ray/serving create operation with explicit name/workspace/project");
    await this.files.assertCommand(args);
    return { result: bounded(await this.service.runJson(args, this.request.workspacePath, this.signal)) };
  }

  private async submit(args: string[], input: Record<string, any>, existingResource = false): Promise<unknown> {
    const interval = checkIntervalMinutes(input.check_interval_minutes);
    if (!this.session?.durable || this.session.nativeId.startsWith("pending:")) throw new Error("Submission needs this Agent's persisted original session");
    const kind = args.find(v => KINDS.includes(v as Kind)) as Kind;
    if (kind === "notebook" && !existingResource) {
      const postStart = option(args, "--post-start");
      if (args.some(value => value.split("=")[0] === "--post-start-script") ||
          (postStart !== undefined && !["0", "disable", "disabled", "false", "none", "off"].includes(postStart.toLowerCase()))) {
        throw new Error("Notebook post-start actions force CLI waiting. Submit the resource first, defer until resource_ready, then register and start your program with sii_command");
      }
      // The installed CLI waits by default and configured post-start actions
      // force waiting even with --no-wait. Disable both at the submission boundary.
      args = [...args, "--no-wait", "--post-start", "none"];
    }
    await this.files.assertCommand(args);
    const name = option(args, "--name"), workspace = option(args, "--workspace");
    if (!name || !workspace || option(args, "--project") !== BILLING_PROJECT) throw new Error(`Supply --name, --workspace and --project ${BILLING_PROJECT} explicitly`);
    const requestId = input.request_id ?? `${kind}:${workspace}:${name}`;
    if (input.required_for_task !== undefined && typeof input.required_for_task !== "boolean") throw new Error("required_for_task must be boolean");
    if (typeof requestId !== "string" || !requestId.trim() || requestId.length > 200) throw new Error("Invalid request_id");
    let completionFile: string | undefined;
    if (input.completion_file !== undefined) {
      if (typeof input.completion_file !== "string") throw new Error("completion_file must be a path");
      completionFile = path.resolve(this.request.workspacePath, input.completion_file);
      const parent = await fs.realpath(path.dirname(completionFile));
      if (!within(parent, await fs.realpath(this.request.workspacePath)) || parent !== path.dirname(completionFile)) throw new Error("Completion file must use a real directory inside this Agent workspace");
      const existing = await fs.lstat(completionFile).catch(error => { if (error.code === "ENOENT") return undefined; throw error; });
      if (existing?.isSymbolicLink()) throw new Error("Completion file cannot be a symlink");
    }
    if (!["job", "hpc"].includes(kind) && input.required_for_task !== false && !completionFile) throw new Error("A notebook/ray/serving experiment needs a completion_file; mark resource-only creation required_for_task=false");
    const account = await this.service.accountReader();
    if (option(args, "--account") && option(args, "--account") !== account) throw new Error("Explicit account must match the active submitting account; switch accounts before submitting");
    const submissionHash = createHash("sha256").update(JSON.stringify({ args, completionFile, required: input.required_for_task !== false, account, ...(existingResource ? { existingResource: true } : {}) })).digest("hex");
    const id = `exp_${Buffer.from(`${this.owner}\0${requestId}`).toString("base64url")}`;
    // Hold the project ledger lock over create: duplicate requests cannot submit twice.
    return this.service.mutate(this.request.projectPath, async doc => {
      const previous = doc.experiments.find(e => e.id === id);
      if (previous) {
        if (previous.submissionHash !== submissionHash) throw new Error("request_id already identifies a different submission; use a new id for a new experiment");
        // Review policy is not a new resource submission. Keep legacy hashes
        // replayable and never duplicate a workload just to change its timer.
        if (input.check_interval_minutes !== undefined && !TERMINAL.has(previous.status) &&
          checkIntervalMinutes(previous.checkIntervalMinutes) !== interval) {
          previous.checkIntervalMinutes = interval;
          previous.nextAgentCheckAt = Date.now() + interval * 60_000;
        }
        return { experiment: previous, message: "Existing submission retained; no duplicate create. If its status is submission_unknown, inspect/reconcile it rather than resubmitting." };
      }
      if (!existingResource && doc.experiments.some(e => e.account === account && e.kind === kind && e.workspace === workspace && e.name === name)) throw new Error("This workload name is already registered; choose a unique name for a new experiment");
      if (completionFile) {
        if (doc.experiments.some(e => e.completionFile === completionFile && e.runId === requestId)) throw new Error("This completion file/run_id already belongs to another run; choose a fresh request_id");
        const old = await fs.lstat(completionFile).catch(error => { if (error.code === "ENOENT") return undefined; throw error; });
        if (old && (!old.isFile() || old.isSymbolicLink() || old.nlink !== 1 || old.size > MAX_OUTPUT)) throw new Error("Invalid completion file");
        if (old) {
          try { if (JSON.parse(await fs.readFile(completionFile, "utf8")).run_id === requestId) throw new Error("Completion file already contains this run_id; use a fresh request_id and register before launching the program"); }
          catch (error) { if (!(error instanceof SyntaxError)) throw error; }
        }
      }
      const experiment: SiiExperiment = { id, submissionHash, owner: this.owner, agent: this.request.agent, taskId: ownerFor(this.request).taskId, account, kind, name, workspace, runId: requestId, required: input.required_for_task !== false, session: this.session!, workspacePath: this.request.workspacePath, completionFile, status: "submission_unknown", createdAt: new Date().toISOString(), nextCheckAt: 0,
        checkIntervalMinutes: interval, nextAgentCheckAt: Date.now() + interval * 60_000, queryErrors: 0 };
      const context = this.request.executionContext;
      const serial = this.request.project.activeAgentExecution;
      experiment.scope = { projectId: this.request.project.id, invocationId: this.request.invocationId,
        ...(context && "executionId" in context && context.executionId ? { executionId: context.executionId } :
          serial?.agent === this.request.agent && serial.latestInvocationId === this.request.invocationId ? { executionId: serial.id } : {}),
        ...(context && "ownershipEpoch" in context && context.ownershipEpoch !== undefined ? { ownershipEpoch: context.ownershipEpoch } : {}),
        ...(context?.groupRunId ? { groupRunId: context.groupRunId } : {}) };
      experiment.registration = existingResource ? "existing" : "created";
      if (!existingResource) experiment.usageRegistration = registrationFromCreateArgs(args, { projectId: this.request.project.id, invocationId: this.request.invocationId, source: "wrapper", registeredAt: experiment.createdAt });
      doc.experiments.push(experiment);
      // Save the intent before the remote mutation, including ambiguous outcomes.
      await this.service.persistDocument(this.request.projectPath, doc);
      try {
        if (await this.service.accountReader() !== account) throw new Error("Active Inspire account changed before submission");
        const response = await this.service.runJson(existingResource ? [kind, "status", name, "--workspace", workspace] : args, this.request.workspacePath, this.signal);
        if (existingResource) {
          const observation = siiStatus(response, kind);
          experiment.status = completionFile && !["failed", "cancelled"].includes(observation.status) ? "running" : observation.status;
          experiment.rawStatus = observation.raw;
          experiment.observedAt = new Date().toISOString();
        } else experiment.status = record(response).success === false ? "failed"
          : record(response).success === true ? "queued" : "submission_unknown";
        experiment.evidence = bounded(response);
        if (experiment.status === "queued") await this.service.registerUsage(this.request.projectPath, experiment);
      } catch (error) { experiment.queryError = redactTrace(String(error)).slice(0, 2000); }
      return { experiment, monitoring: "active", message: ["queued", "running"].includes(experiment.status) ? `${existingResource ? "已有资源上的实验已登记。请自行启动后台程序并写入本次完成标记。" : "实验已提交。"}系统已接管状态监测，每 ${interval} 分钟会唤醒本会话检查仍在运行的实验；完成或失败会提前通知，无需持续轮询。你可以继续当前任务内不依赖结果的工作；需要让出执行时调用 sii_defer_task 保存未完成任务，然后结束本轮。处理结果后再完成任务及路由后继。` : existingResource && TERMINAL.has(experiment.status) ? "所登记的实验或资源已进入终态，请检查实际结果并自行决定后续处理；平台终态不完成本任务。" : experiment.status === "failed" ? "平台明确拒绝了本次操作。请检查返回证据，自行决定诊断或用新 request_id 重提；本任务仍未完成。" : "操作结果尚未确认，系统将核对同一任务；不要重复创建。可暂存任务让系统继续查询，或按需诊断。" };
    });
  }

  private async knowledge(relative: unknown): Promise<unknown> {
    const root = await fs.realpath(this.service.options.knowledgeRoot);
    if (relative === undefined) {
      const paths: string[] = [];
      const walk = async (dir: string) => { for (const entry of await fs.readdir(dir, { withFileTypes: true })) { if (entry.isDirectory()) await walk(path.join(dir, entry.name)); else if (entry.isFile() && entry.name.endsWith(".md")) paths.push(path.relative(root, path.join(dir, entry.name))); } };
      await walk(root); return { documents: paths, entrypoint: "SKILL.md" };
    }
    if (typeof relative !== "string" || !relative.endsWith(".md")) throw new Error("Choose a Markdown document from sii_read_knowledge");
    const target = await fs.realpath(path.resolve(root, relative));
    if (!within(target, root)) throw new Error("Knowledge path escapes Inspire references");
    return { path: relative, content: (await fs.readFile(target, "utf8")).slice(0, MAX_OUTPUT) };
  }

  async deferred(): Promise<boolean> { return (await this.service.document(this.request.projectPath)).waits.some(w => w.owner === this.owner); }
  async wait(handoff: string | undefined, onTrace: TraceSink): Promise<string | undefined> {
    this.signal.throwIfAborted();
    let doc = await this.service.document(this.request.projectPath);
    const unreceived = doc.experiments.filter(e => this.pendingResultSession(e));
    if (!doc.waits.some(w => w.owner === this.owner) && unreceived.length) {
      if (!this.session || unreceived.some(e => !sameDurableSession(this.pendingResultSession(e)!, this.session!))) {
        throw new Error("Original SII session cannot be replaced during synchronous-result recovery");
      }
      // Reuse the existing result-notification wait, not another task or
      // provider operation. Native receipt may be absent after disconnect,
      // crash or writer handoff even though the synchronous response exists.
      const session = structuredClone(this.session);
      await this.service.mutate(this.request.projectPath, state => {
        this.signal.throwIfAborted();
        if (state.waits.some(w => w.owner === this.owner)) return;
        const pending = state.experiments.filter(e => {
          const original = this.pendingResultSession(e);
          return original && sameDurableSession(original, session);
        });
        if (!pending.length) return;
        state.waits.push({ owner: this.owner, ids: pending.map(e => e.id), session, status: "ready",
          eventId: randomUUID(), context: "Terminal experiment facts were retained without proof of receipt in this original task's native Session. Receive these facts before continuing. No experiment submission, provider mutation or completed business has been repeated." });
      });
      doc = await this.service.document(this.request.projectPath);
    }
    const pending = doc.waits.find(w => w.owner === this.owner);
    if (!pending || pending.eventId === this.resumingEvent) return undefined;
    if (!this.session || pending.session.nativeId !== this.session.nativeId || pending.session.generation !== this.session.generation || pending.session.harnessId !== this.session.harnessId) throw new Error("Original SII session cannot be replaced during deferred-task recovery");
    await this.service.mutate(this.request.projectPath, state => { const wait = state.waits.find(w => w.owner === this.owner)!; if (handoff) wait.handoff = handoff; });
    this.deactivate();
    await onTrace("status", "Waiting for SII experiment results; this task is unfinished", { experimentIds: pending.ids, taskCompleted: false, siiWaiting: true });
    await this.request.onExperimentWait?.(true);
    const ready = await this.service.waitFor(this.request.projectPath, this.owner, this.signal);
    if (!ready) return undefined;
    await this.request.onExperimentWait?.(false);
    await onTrace("status", ready.wait.reason === "periodic_check"
      ? "Periodic SII experiment review resumes the original unfinished task/session"
      : "SII experiment event resumes the original unfinished task/session", {
      eventId: ready.wait.eventId, wakeReason: ready.wait.reason ?? "experiment_finished",
      ...(ready.wait.checkExperimentIds ? { experimentIds: ready.wait.checkExperimentIds } : {}),
      taskCompleted: false, siiWaiting: false
    });
    const included: SiiExperiment[] = [];
    const facts: string[] = [];
    for (const experiment of ready.experiments) {
      const fact = JSON.stringify(this.notificationFact(experiment));
      if (facts.join(",").length + fact.length + 2 > 16000) continue;
      facts.push(fact); included.push(experiment);
    }
    const omitted = ready.experiments.filter(e => !included.includes(e)).map(e => e.id);
    const review = ready.wait.reason === "periodic_check"
      ? `\nPeriodic experiment review: the configured check interval has elapsed for ${JSON.stringify(ready.wait.checkExperimentIds ?? [])}. This is not experiment completion or failure. Inspect current logs/metrics with your SII tools and decide whether to continue, adjust or stop. Use check_interval_minutes (5–60) in sii_defer_task to adjust the next review; omitting it retains each experiment's interval.` : "";
    const text = `SII system notification (${ready.wait.eventId}). Continue your SAME unfinished task/session and directory.${review}\nSaved continuation notes: use sii_get_task_context to list and read the required context/handoff pages; their bodies are not repeated here.\nObserved facts: [${facts.join(",")}]${omitted.length ? `\nResults omitted from this bounded notification: ${JSON.stringify(omitted)}. Read each with sii_get_experiment; they are not acknowledged by this notification.` : ""}\nInspect results and choose further work, retry, cleanup or completion yourself. A monitoring query error is not an experiment failure. Platform termination does not complete this task. Remaining experiments may still be running; defer again if their results are required.`;
    this.notification = { eventId: ready.wait.eventId, text: redactTrace(text), session: structuredClone(ready.wait.session), experiments: structuredClone(included) };
    return text;
  }
  private notificationFact(e: SiiExperiment) {
    return { id: e.id, name: e.name, status: e.status, observedAt: e.observedAt, queryError: e.queryError, evidence: e.evidence, completionFile: e.completionFile };
  }
  private pendingResultSession(e: SiiExperiment): SessionRef | undefined {
    if (e.owner !== this.owner || !TERMINAL.has(e.status) || experimentResultReceived(e)) return undefined;
    if (e.resultDelivery) return createHash("sha256").update(JSON.stringify(this.notificationFact(e))).digest("hex") ===
      e.resultDelivery.factHash ? e.resultDelivery.session : undefined;
    // An old handler-side acknowledgement proves no delivery. Recover only
    // when this same unfinished owner is invoked; never scan/reopen history.
    return e.acknowledged ? e.session : undefined;
  }
  async observeNativeResult(event: Record<string, unknown>, session: SessionRef | undefined): Promise<void> {
    if (!this.active || this.closed || !session || !this.session || !sameDurableSession(session, this.session) ||
      event.invocationId !== this.request.invocationId || event.harnessId !== session.harnessId ||
      typeof event.eventId !== "string" || !event.eventId) return;
    const tool = record(event.tool);
    const ownTool = tool.server === "scienceevolve-sii" && tool.name === "sii_get_experiment" ||
      tool.name === "mcp__scienceevolve-sii__sii_get_experiment" ||
      tool.name === "mcp__scienceevolve_sii__sii_get_experiment";
    if (typeof tool.callId !== "string" || !tool.callId) return;
    if (event.kind === "tool.started" && event.phase === "started" && tool.status === "started" && ownTool) {
      let input: Record<string, unknown>;
      try { input = record(typeof tool.input === "string" ? JSON.parse(tool.input) : tool.input); }
      catch { return; }
      this.nativeResultCalls.set(tool.callId, { session: structuredClone(session),
        ...(typeof input.experiment_id === "string" ? { experimentId: input.experiment_id } : {}) });
      return;
    }
    const nativeCall = this.nativeResultCalls.get(tool.callId);
    // Result frames may identify only the call. Reuse its actual preceding
    // tool binding, as the control-result path does.
    const boundGeneric = tool.name === "tool" && nativeCall && sameDurableSession(nativeCall.session, session);
    if (event.kind !== "tool.completed" || event.phase !== "completed" ||
      (!ownTool && !boundGeneric) || tool.status !== "completed" ||
      typeof tool.outputPreview !== "string" || tool.isError === true) return;
    // Codex may expose the same MCP payload in content and structuredContent.
    const ids = [...new Set([...tool.outputPreview.matchAll(/\[OpenFARS SII result ([a-f0-9]{64})\]/g)].map(match => match[1]))];
    if (ids.length !== 1) return;
    await this.service.mutate(this.request.projectPath, doc => {
      if (this.closed || !this.active || !this.session || !sameDurableSession(this.session, session) ||
        event.invocationId !== this.request.invocationId) return;
      const experiment = doc.experiments.find(e => e.owner === this.owner && e.resultDelivery?.id === ids[0]);
      const delivery = experiment?.resultDelivery;
      if (!experiment || !delivery || delivery.invocationId !== this.request.invocationId ||
        (boundGeneric && nativeCall!.experimentId && experiment.id !== nativeCall!.experimentId) ||
        !sameDurableSession(delivery.session, session) || !TERMINAL.has(experiment.status) ||
        createHash("sha256").update(JSON.stringify(this.notificationFact(experiment))).digest("hex") !== delivery.factHash) return;
      if (experiment.acknowledged && experiment.notificationReceipt?.eventId === delivery.id) return;
      experiment.acknowledged = true;
      experiment.notificationReceipt = { eventId: delivery.id, invocationId: this.request.invocationId,
        nativeEventId: event.eventId as string, source: "native_tool_result",
        nativeCallId: tool.callId as string,
        session: structuredClone(session), receivedAt: new Date().toISOString() };
    });
    this.nativeResultCalls.delete(tool.callId);
  }
  /** Preparation and model admission are not receipt. Only the current
   * original Session's actual native user message can acknowledge this batch. */
  async observeNativeNotification(event: Record<string, unknown>, session: SessionRef | undefined): Promise<void> {
    const notification = this.notification;
    if (!this.active || this.closed || !notification || notification.eventId !== this.resumingEvent || !session ||
      !sameDurableSession(session, notification.session) || event.invocationId !== this.request.invocationId ||
      event.harnessId !== session.harnessId || event.kind !== "user.message" || event.phase !== "completed" ||
      typeof event.eventId !== "string" || !event.eventId || typeof event.message !== "string" || !event.message.includes(notification.text)) return;
    await this.acknowledgeNotification(notification, session, { eventId: notification.eventId,
      invocationId: this.request.invocationId, nativeEventId: event.eventId, source: "native_event",
      session: structuredClone(session), receivedAt: new Date().toISOString() });
  }
  private async observeNativeNotificationHistory(): Promise<void> {
    const notification = this.notification;
    const session = this.session;
    if (!this.active || this.closed || !notification || notification.eventId !== this.resumingEvent || !session ||
      !sameDurableSession(session, notification.session) || !this.readNativeNotification) return;
    const evidence = await this.readNativeNotification({ text: notification.text, session: structuredClone(session) });
    if (!evidence || this.closed || !this.active || !this.session || this.notification !== notification ||
      !sameDurableSession(this.session, session) || !sameDurableSession(evidence.session, notification.session)) return;
    await this.acknowledgeNotification(notification, session, { eventId: notification.eventId,
      invocationId: this.request.invocationId, nativeEventId: `history:${evidence.history.relativePath}:${evidence.history.byteOffset}`,
      source: "native_session_history", history: structuredClone(evidence.history), session: structuredClone(session), receivedAt: new Date().toISOString() });
  }
  private async acknowledgeNotification(notification: NonNullable<SiiMcpBinding["notification"]>, session: SessionRef,
    receipt: NativeNotificationReceipt): Promise<void> {
    await this.service.mutate(this.request.projectPath, doc => {
      const wait = doc.waits.find(w => w.owner === this.owner && w.eventId === notification.eventId);
      if (!wait || !sameDurableSession(wait.session, session) || wait.nativeReceipt?.eventId === wait.eventId) return;
      for (const observed of notification.experiments) {
        const e = doc.experiments.find(e => e.id === observed.id && e.owner === this.owner);
        if (!e || JSON.stringify(this.notificationFact(e)) !== JSON.stringify(this.notificationFact(observed))) continue;
        if (TERMINAL.has(e.status)) e.acknowledged = true;
        if (e.queryErrors >= 3 && e.queryErrors === observed.queryErrors) e.monitorAcknowledged = true;
        if (TERMINAL.has(e.status) || e.monitorAcknowledged) e.notificationReceipt = receipt;
      }
      wait.nativeReceipt = receipt;
    });
  }
  async clearWait(): Promise<void> { await this.service.mutate(this.request.projectPath, doc => { doc.waits = doc.waits.filter(w => w.owner !== this.owner); }); }
  async beginResume(): Promise<void> { this.resumingEvent = (await this.service.document(this.request.projectPath)).waits.find(w => w.owner === this.owner)?.eventId; }
}
