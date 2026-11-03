import { promises as fs } from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { newId, nowIso, redactTrace } from "./utils.js";
import { DEFAULT_MODEL_CONTEXT_WINDOW, MAX_MODEL_CONTEXT_WINDOW } from "./model-context.js";
import {
  validateGatewayNetworkTarget,
  validateGatewayUrl,
  type GatewayHostnameResolver
} from "./gateway-security.js";
import { requiredToolChoiceRejected, specifiedToolChoiceFallback } from "./gateway-tool-choice.js";
import {
  convertProtocolResponse,
  convertStreamEvent,
  normalizeIncomingRequest,
  normalizeProtocolStreamEvents,
  routeProtocolRequest,
  PROTOCOL_ROUTER_COMPATIBILITY_VERSION
} from "./protocol-router.js";
import {
  BUILTIN_HARNESS_DESCRIPTORS,
  DEFAULT_HARNESS_ID,
  HARNESS_ID_PATTERN
} from "./harness-runtime/registry.js";
import type { HarnessId } from "./harness-runtime/contracts.js";
import type {
  PrepareResidentScopeRequest,
  ResidentAdapterLaunchEvidence,
  ResidentLeaseAuthority,
  ResidentProcessLease,
  ResidentScopeOpenRequest,
  ResidentStartupReconcileRequest,
  ResidentStartupReconcileResult,
  ResidentTurn
} from "./harness-runtime/resident-lease.js";
import type { AgentRunRequest, AgentRunResult } from "./types.js";
import {
  applyGatewayReasoning,
  normalizeGatewayModelReasoningConfigs,
  resolveGatewayReasoning,
  type GatewayReasoningDetection,
  type GatewayModelReasoningConfigs,
  type ResolvedGatewayReasoning
} from "./gateway-reasoning.js";
import { discoverGatewayReasoning, gatewayReasoningDiscoveryFingerprint } from "./gateway-reasoning-discovery.js";

export { validateGatewayUrl } from "./gateway-security.js";

/** Protocols understood by the local Agent gateway adapter. */
export type AgentProtocol =
  | "responses"
  | "chat-completions"
  | "anthropic-messages";

/** Harness IDs are Registry-backed safe strings, including historical IDs. */
export type AgentHarness = HarnessId;

/**
 * Collaboration-owned resident lifecycle. Ordinary AgentRunner.run remains
 * the compatibility one-shot API; callers with executionContext must use
 * this surface so a completed turn cannot accidentally terminate the lease.
 */
export interface ResidentScopeOpenResult {
  lease: ResidentProcessLease;
  evidence: ResidentAdapterLaunchEvidence;
}

export interface CollaborationHarnessRunner {
  prepareResidentScope(input: PrepareResidentScopeRequest): Promise<ResidentScopeOpenRequest>;
  prepareAndOpenResidentScope(input: PrepareResidentScopeRequest): Promise<ResidentScopeOpenResult>;
  openResidentScope(input: ResidentScopeOpenRequest): Promise<ResidentScopeOpenResult>;
  openResidentExecution(input: ResidentScopeOpenRequest): Promise<ResidentScopeOpenResult>;
  submitResidentTurn(
    authority: ResidentLeaseAuthority,
    turn: ResidentTurn,
    request: AgentRunRequest
  ): Promise<{ lease: ResidentProcessLease; result: AgentRunResult }>;
  waitResident(authority: ResidentLeaseAuthority): Promise<ResidentProcessLease>;
  pauseResident(authority: ResidentLeaseAuthority): Promise<ResidentProcessLease>;
  resumeResident(authority: ResidentLeaseAuthority): Promise<ResidentProcessLease>;
  probeResident(authority: ResidentLeaseAuthority): Promise<ResidentProcessLease>;
  closeResident(authority: ResidentLeaseAuthority): Promise<ResidentProcessLease>;
  reconcileResidentStartup(
    request: ResidentStartupReconcileRequest
  ): Promise<ResidentStartupReconcileResult>;
}

export const AGENT_PROTOCOLS: readonly AgentProtocol[] = [
  "responses",
  "chat-completions",
  "anthropic-messages"
] as const;

export const AGENT_HARNESSES: readonly AgentHarness[] =
  BUILTIN_HARNESS_DESCRIPTORS
    .filter((item) => item.purposes.includes("workflow") && item.purposes.includes("probe"))
    .map((item) => item.id);

export { DEFAULT_MODEL_CONTEXT_WINDOW, MAX_MODEL_CONTEXT_WINDOW } from "./model-context.js";

export const AGENT_PROTOCOL_LABELS: Record<AgentProtocol, string> = {
  responses: "OpenAI Responses",
  "chat-completions": "OpenAI Chat Completions",
  "anthropic-messages": "Anthropic Messages"
};

export { DEFAULT_HARNESS_ID };

export function nativeProtocolForHarness(harness: AgentHarness): AgentProtocol | undefined {
  return BUILTIN_HARNESS_DESCRIPTORS.find((item) => item.id === harness)?.nativeProtocol;
}

export type GatewayProbeStageId =
  | "text_ordinary"
  | "text_stream"
  | "tool_ordinary"
  | "tool_stream"
  | "adapter_smoke";

export interface GatewayProbeStageResult {
  stage: GatewayProbeStageId;
  label: string;
  expectation: "text" | "tool" | "harness";
  stream: boolean;
  status: "queued" | "running" | "passed" | "failed" | "skipped";
  durationMs?: number;
  httpStatus?: number;
  error?: string;
}

export interface GatewayTestState {
  status: "untested" | "passed" | "failed";
  testedAt?: string;
  error?: string;
  durationMs?: number;
  stageResults?: GatewayProbeStageResult[];
  protocol?: AgentProtocol;
  model?: string;
  /** Optional harness-specific route verification metadata. */
  harness?: AgentHarness;
  nativeProtocol?: AgentProtocol;
  routeMode?: "direct" | "proxy";
  routeDirection?: `${AgentProtocol}->${AgentProtocol}`;
  deliveryMode?: "native-stream" | "buffered-json";
  /** Route probes validate wire conversion; smoke probes launch the real CLI. */
  probeKind?: "route" | "adapter-smoke";
  cacheKey?: string;
  adapterVersion?: string;
  executableFingerprint?: string;
  gatewayRevision?: number;
  routerCompatibilityVersion?: string;
  /** Exact model-level Gateway reasoning selection exercised by this probe. */
  reasoningOptionId?: string;
  reasoningFingerprint?: string;
}

/**
 * A global gateway record.  `apiKey` is deliberately not part of the public
 * view; it is only read by the server when a runner is started or a gateway
 * probe is requested.
 */
export interface GatewayRecord {
  id: string;
  name: string;
  url: string;
  apiKey: string;
  models: string[];
  /** Context window advertised to local harnesses for each deployed model. */
  modelContextWindows?: Record<string, number>;
  /** Per-model, allow-listed outbound string options. Absence means provider default. */
  modelReasoning?: GatewayModelReasoningConfigs;
  /** Connection tests discover reasoning automatically unless explicitly disabled. */
  autoReasoning?: boolean;
  reasoningDetection?: Record<string, GatewayReasoningDetection>;
  /** In-memory progress of save-triggered discovery; never written as a durable result. */
  reasoningDiscovery?: Record<string, "queued" | "checking">;
  defaultModel: string;
  /** The single wire protocol enabled for this gateway. */
  protocol: AgentProtocol;
  /** Changes only when credentialed gateway configuration changes, not on probes. */
  revision: number;
  builtin?: boolean;
  /** Most recent probe, retained for the compact UI status. */
  test: GatewayTestState;
  /** Independent compatibility records keyed by protocol and model. */
  tests?: GatewayTestState[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicGatewayRecord extends Omit<GatewayRecord, "apiKey"> {
  apiKeyConfigured: boolean;
  apiKey?: never;
}

export interface GatewayInput {
  name: string;
  url: string;
  apiKey: string;
  models: string[];
  modelContextWindows?: Record<string, number>;
  modelReasoning?: GatewayModelReasoningConfigs;
  autoReasoning?: boolean;
  defaultModel: string;
  protocol: AgentProtocol;
}

const DEFAULT_SYSTEM_GATEWAY_URL = "https://aigw.sotatts.online/v1";
const DEFAULT_SYSTEM_GATEWAY_MODEL = "nex-agi/Nex-N2-Pro";

/**
 * Build the initial AIGW record from the server environment without ever
 * placing its credential in a public catalog. An empty key means the
 * deployment deliberately has no system preset and can add one in the UI.
 */
export function systemGatewayInputFromEnvironment(
  environment: NodeJS.ProcessEnv,
  modelSuggestions: string[]
): GatewayInput | undefined {
  const apiKey = environment.AIGW_API_KEY?.trim();
  if (!apiKey) return undefined;
  const models = [...new Set(modelSuggestions.map((model) => model.trim()).filter(Boolean))];
  if (!models.length) models.push(DEFAULT_SYSTEM_GATEWAY_MODEL);
  const defaultModel = models.includes(DEFAULT_SYSTEM_GATEWAY_MODEL)
    ? DEFAULT_SYSTEM_GATEWAY_MODEL
    : models[0]!;
  return normalizeGatewayInput({
    name: "AIGW",
    url: environment.AIGW_BASE_URL?.trim() || DEFAULT_SYSTEM_GATEWAY_URL,
    apiKey,
    models,
    defaultModel,
    protocol: "responses"
  });
}

export interface GatewayTestResult {
  status: "passed" | "failed";
  protocol: AgentProtocol;
  model: string;
  testedAt: string;
  error?: string;
  durationMs?: number;
  stageResults?: GatewayProbeStageResult[];
  httpStatus?: number;
  harness?: AgentHarness;
  nativeProtocol?: AgentProtocol;
  routeMode?: "direct" | "proxy";
  routeDirection?: `${AgentProtocol}->${AgentProtocol}`;
  deliveryMode?: "native-stream" | "buffered-json";
  probeKind?: "route" | "adapter-smoke";
  cacheKey?: string;
  adapterVersion?: string;
  executableFingerprint?: string;
  gatewayRevision?: number;
  routerCompatibilityVersion?: string;
  reasoningOptionId?: string;
  reasoningFingerprint?: string;
}

export interface AdapterSmokeProbeInput {
  harness: AgentHarness;
  gateway: GatewayRecord;
  model: string;
  /** Undefined means the Gateway/model default and emits no explicit field. */
  reasoningOptionId?: string;
  reasoning?: ResolvedGatewayReasoning;
}

export interface AdapterSmokeProbeResult {
  cacheKey: string;
  adapterVersion: string;
  executableFingerprint: string;
  routerCompatibilityVersion: string;
}

/** Injected by HarnessRuntimeFacade so GatewayStore never learns CLI details. */
export interface AdapterSmokeProbeRunner {
  harnessIds(): AgentHarness[];
  nativeProtocol(harness: AgentHarness): AgentProtocol | undefined;
  cacheKey(input: AdapterSmokeProbeInput): Promise<AdapterSmokeProbeResult>;
  runSmoke(
    input: AdapterSmokeProbeInput,
    signal: AbortSignal
  ): Promise<AdapterSmokeProbeResult>;
}

export interface GatewayMatrixOptions {
  /** Defaults to every embedded harness. */
  harnesses?: AgentHarness[];
  /** Defaults to the gateway's declared model list. */
  models?: string[];
  /** Optional explicit selection per model; missing/null uses provider default. */
  reasoningOptions?: Record<string, string | null>;
}

export interface GatewayMatrixResult {
  gateway: PublicGatewayRecord;
  results: GatewayTestResult[];
}

export type GatewayMatrixProgressEvent =
  | {
      type: "combination-start";
      harness: AgentHarness;
      model: string;
      stageResults: GatewayProbeStageResult[];
    }
  | {
      type: "stage";
      harness: AgentHarness;
      model: string;
      stage: GatewayProbeStageResult;
    }
  | {
      type: "result";
      harness: AgentHarness;
      model: string;
      result: GatewayTestResult;
    };

export type GatewayMatrixProgressSink = (event: GatewayMatrixProgressEvent) => void;

export type GatewayTestProgressEvent =
  | {
      type: "stage";
      stage: GatewayProbeStageResult;
    }
  | {
      type: "result";
      result: GatewayTestResult;
    };

export type GatewayTestProgressSink = (event: GatewayTestProgressEvent) => void;

type GatewayProbeStageSink = (stage: GatewayProbeStageResult) => void;

interface GatewayProbeStageDefinition {
  stage: GatewayProbeStageId;
  label: string;
  expectation: GatewayProbeStageResult["expectation"];
  stream: boolean;
}

interface GatewayRouteProbeStageDefinition extends GatewayProbeStageDefinition {
  expectation: "text" | "tool";
}

const GATEWAY_PROBE_STAGES: ReadonlyArray<GatewayRouteProbeStageDefinition> = [
  { stage: "text_ordinary", label: "文本普通", expectation: "text", stream: false },
  { stage: "text_stream", label: "文本流式", expectation: "text", stream: true },
  { stage: "tool_ordinary", label: "工具调用普通", expectation: "tool", stream: false },
  { stage: "tool_stream", label: "工具调用流式", expectation: "tool", stream: true }
] as const;

const HARNESS_SMOKE_PROBE_STAGE: GatewayProbeStageDefinition = {
  stage: "adapter_smoke",
  label: "Harness 真实探测",
  expectation: "harness",
  stream: false
};

const ALL_GATEWAY_PROBE_STAGES: ReadonlyArray<GatewayProbeStageDefinition> = [
  ...GATEWAY_PROBE_STAGES,
  HARNESS_SMOKE_PROBE_STAGE
];

export class GatewayProbeCancelledError extends Error {
  override name = "GatewayProbeCancelledError";
  constructor(message = "网关探测已取消") {
    super(message);
  }
}

function throwIfProbeCancelled(signal?: AbortSignal): void {
  if (signal?.aborted) throw new GatewayProbeCancelledError();
}

function probeStageSnapshot(
  definition: GatewayProbeStageDefinition,
  status: GatewayProbeStageResult["status"],
  options: { durationMs?: number; httpStatus?: number; error?: string } = {}
): GatewayProbeStageResult {
  return {
    ...definition,
    status,
    ...(options.durationMs !== undefined ? { durationMs: Math.round(Math.max(0, options.durationMs)) } : {}),
    ...(options.httpStatus !== undefined ? { httpStatus: options.httpStatus } : {}),
    ...(options.error ? { error: redactTrace(options.error).slice(0, 500) } : {})
  };
}

function probeStageResult(
  definition: GatewayProbeStageDefinition,
  status: GatewayProbeStageResult["status"],
  startedAt: number,
  options: { httpStatus?: number; error?: string } = {}
): GatewayProbeStageResult {
  return probeStageSnapshot(definition, status, {
    ...options,
    durationMs: Date.now() - startedAt
  });
}

function queuedHarnessProbeStageResults(): GatewayProbeStageResult[] {
  return ALL_GATEWAY_PROBE_STAGES.map((definition) => probeStageSnapshot(definition, "queued"));
}

function skippedProbeStageResults(fromIndex: number): GatewayProbeStageResult[] {
  return GATEWAY_PROBE_STAGES.slice(fromIndex).map((definition) =>
    probeStageSnapshot(definition, "skipped", { error: "前序阶段未通过，未执行" })
  );
}

export const GATEWAY_ID_PATTERN = /^gwy_[a-f0-9]{32}$/;

export function normalizeGatewayInput(input: GatewayInput): GatewayInput {
  if (input.autoReasoning !== undefined && typeof input.autoReasoning !== "boolean")
    throw new Error("自动探测思考参数必须是布尔值");
  const name = input.name.trim();
  if (!name || name.length > 160) throw new Error("网关名称不能为空且不能超过 160 个字符");
  const url = validateGatewayUrl(input.url);
  const apiKey = input.apiKey.trim();
  if (!apiKey || apiKey.length > 8_000) throw new Error("网关 API key 不能为空且不能超过 8000 个字符");
  const models = [...new Set(input.models.map((model) => model.trim()).filter(Boolean))].slice(0, 200);
  if (!models.length) throw new Error("网关至少需要一个可用 model");
  const modelContextWindows = Object.fromEntries(models.map((model) => {
    const value = input.modelContextWindows && Object.prototype.hasOwnProperty.call(input.modelContextWindows, model)
      ? input.modelContextWindows[model]
      : DEFAULT_MODEL_CONTEXT_WINDOW;
    if (!Number.isInteger(value) || value! < 1 || value! > MAX_MODEL_CONTEXT_WINDOW) {
      throw new Error(`model“${model}”的上下文长度必须是 1 到 ${MAX_MODEL_CONTEXT_WINDOW} 的整数`);
    }
    return [model, value as number];
  }));
  const modelReasoning = normalizeGatewayModelReasoningConfigs(
    models,
    input.modelReasoning
  );
  const defaultModel = input.defaultModel.trim();
  if (!models.includes(defaultModel)) throw new Error("默认 model 必须在网关模型列表中");
  if (!AGENT_PROTOCOLS.includes(input.protocol)) throw new Error("网关必须声明一种有效协议");
  return {
    name,
    url,
    apiKey,
    models,
    modelContextWindows,
    modelReasoning,
    ...(input.autoReasoning !== undefined ? { autoReasoning: input.autoReasoning !== false } : {}),
    defaultModel,
    protocol: input.protocol
  };
}

export function publicGateway(record: GatewayRecord): PublicGatewayRecord {
  const { apiKey, ...rest } = structuredClone(record);
  void apiKey;
  return { ...rest, apiKeyConfigured: Boolean(record.apiKey) };
}

export function gatewayCombinationPassed(
  gateway: Pick<GatewayRecord, "test" | "tests"> & { revision?: number; modelReasoning?: GatewayModelReasoningConfigs; autoReasoning?: boolean },
  protocol: AgentProtocol,
  model: string,
  harness?: AgentHarness,
  reasoningOptionId?: string
): boolean {
  reasoningOptionId ??= gateway.autoReasoning === false ? undefined : gateway.modelReasoning?.[model]?.defaultOptionId;
  const records = gateway.tests?.length ? gateway.tests : [gateway.test];
  const routeRecords = records.filter((test) =>
    (test.probeKind === undefined || test.probeKind === "route") &&
    test.protocol === protocol &&
    test.model === model &&
    test.reasoningOptionId === reasoningOptionId
  );
  if (!harness) return routeRecords.some((test) => test.status === "passed");

  const nativeProtocol = nativeProtocolForHarness(harness) ?? records.find((test) =>
    test.harness === harness && test.nativeProtocol !== undefined
  )?.nativeProtocol;
  const exactRoutes = routeRecords.filter((test) => test.harness === harness);
  // Persisted records are appended chronologically. An exact Harness result
  // is authoritative even when a legacy untagged direct probe also exists.
  // The legacy fallback is considered only when this combination has never
  // received an exact Harness route result.
  const route = exactRoutes.length
    ? exactRoutes[exactRoutes.length - 1]
    : nativeProtocol === protocol
      ? routeRecords.filter((test) =>
          test.harness === undefined && (test.routeMode ?? "direct") === "direct"
        ).at(-1)
      : undefined;
  const routePassed = route?.status === "passed" && (
    nativeProtocol === protocol
      ? (route.routeMode ?? "direct") === "direct"
      : route.harness === harness &&
        route.nativeProtocol === nativeProtocol &&
        route.routeMode === "proxy" &&
        route.routeDirection === `${nativeProtocol}->${protocol}`
  );
  if (!routePassed) return false;
  const smoke = records.filter((test) =>
    test.probeKind === "adapter-smoke" &&
    test.protocol === protocol &&
    test.model === model &&
    test.harness === harness &&
    test.reasoningOptionId === reasoningOptionId
  ).at(-1);
  return Boolean(
    smoke?.status === "passed" &&
    smoke.harness === harness &&
    smoke.nativeProtocol === nativeProtocol &&
    smoke.gatewayRevision === (gateway.revision ?? 1) &&
    smoke.routerCompatibilityVersion === PROTOCOL_ROUTER_COMPATIBILITY_VERSION &&
    Boolean(smoke.cacheKey && smoke.adapterVersion && smoke.executableFingerprint)
  );
}

export interface GatewayStoreOptions {
  /** Injectable fetch for deterministic tests. */
  fetch?: typeof globalThis.fetch;
  /** Injectable DNS resolver for deterministic SSRF-boundary tests. */
  resolveHostname?: GatewayHostnameResolver;
  testTimeoutMs?: number;
  adapterSmokeProbe?: AdapterSmokeProbeRunner;
  /** Allows controlled protocol-only fixtures to opt out of capability discovery. */
  autoReasoning?: boolean;
}

interface GatewayFile {
  schemaVersion: 1;
  gateways: GatewayRecord[];
  defaultGatewayId?: string;
}

interface GatewayReasoningJob {
  gateway: GatewayRecord;
  model: string;
  fingerprint: string;
  force: boolean;
  status: "queued" | "checking";
  controller: AbortController;
}

function freshReasoningDetection(cached: GatewayReasoningDetection | undefined, fingerprint: string): boolean {
  const ttlMs = cached?.status === "verified" ? 24 * 60 * 60_000 : cached?.status === "failed" ? 60_000 : 10 * 60_000;
  return Boolean(cached?.fingerprint === fingerprint && Date.now() - Date.parse(cached.checkedAt) < ttlMs);
}

/** Durable global gateway library. Old/malformed files are ignored. */
export class GatewayStore {
  private mutationTail: Promise<void> = Promise.resolve();
  private readonly fetchImpl: typeof globalThis.fetch;
  private readonly resolveHostname?: GatewayHostnameResolver;
  private readonly timeoutMs: number;
  private adapterSmokeProbe?: AdapterSmokeProbeRunner;
  private readonly automaticReasoning: boolean;
  private readonly reasoningDiscoveries = new Map<string, { task: Promise<GatewayReasoningDetection>; signal?: AbortSignal }>();
  private readonly reasoningJobs = new Map<string, GatewayReasoningJob>();
  private readonly reasoningQueue: GatewayReasoningJob[] = [];
  private readonly reasoningTasks = new Set<Promise<void>>();
  private activeReasoningJobs = 0;
  private reasoningClosed = false;

  constructor(
    private readonly root: string,
    options: GatewayStoreOptions = {}
  ) {
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.resolveHostname = options.resolveHostname;
    this.timeoutMs = Math.max(500, Math.min(options.testTimeoutMs ?? 60_000, 60_000));
    this.adapterSmokeProbe = options.adapterSmokeProbe;
    this.automaticReasoning = options.autoReasoning !== false;
  }

  setAdapterSmokeProbe(probe: AdapterSmokeProbeRunner): void {
    this.adapterSmokeProbe = probe;
  }

  /**
   * Revalidate the persisted smoke identity against the Adapter executable
   * that would run now. A previously passing probe must not survive an
   * Adapter upgrade or executable replacement merely because its old fields
   * are still structurally complete.
   */
  async harnessCombinationPassed(
    id: string,
    harness: AgentHarness,
    model: string,
    reasoningOptionId?: string
  ): Promise<boolean> {
    const gateway = await this.get(id);
    reasoningOptionId ??= gateway?.autoReasoning === false ? undefined : gateway?.modelReasoning?.[model]?.defaultOptionId;
    if (!gateway || !this.adapterSmokeProbe ||
      !gatewayCombinationPassed(gateway, gateway.protocol, model, harness, reasoningOptionId)) {
      return false;
    }
    let reasoning: ResolvedGatewayReasoning | undefined;
    try {
      reasoning = resolveGatewayReasoning(gateway.modelReasoning, model, reasoningOptionId);
    } catch {
      return false;
    }
    let identity: AdapterSmokeProbeResult;
    try {
      identity = await this.adapterSmokeProbe.cacheKey({
        harness,
        gateway,
        model,
        reasoningOptionId,
        reasoning
      });
    } catch {
      return false;
    }
    return (gateway.tests ?? []).some((test) =>
      test.status === "passed" &&
      test.probeKind === "adapter-smoke" &&
      test.protocol === gateway.protocol &&
      test.model === model &&
      test.harness === harness &&
      test.reasoningOptionId === reasoningOptionId &&
      test.reasoningFingerprint === reasoning?.fingerprint &&
      test.gatewayRevision === gateway.revision &&
      test.cacheKey === identity.cacheKey &&
      test.adapterVersion === identity.adapterVersion &&
      test.executableFingerprint === identity.executableFingerprint &&
      test.routerCompatibilityVersion === identity.routerCompatibilityVersion
    );
  }

  async assertAllowedNetworkTarget(url: string): Promise<void> {
    await validateGatewayNetworkTarget(
      url,
      this.resolveHostname
    );
  }

  async list(): Promise<PublicGatewayRecord[]> {
    await this.mutationTail;
    return (await this.read()).gateways.map(gateway => publicGateway(this.withReasoningProgress(gateway)));
  }

  async get(id: string): Promise<GatewayRecord | undefined> {
    await this.mutationTail;
    const gateway = (await this.read()).gateways.find((item) => item.id === id);
    return gateway ? this.withReasoningProgress(structuredClone(gateway)) : undefined;
  }

  async defaultGatewayId(): Promise<string | undefined> {
    await this.mutationTail;
    const document = await this.read();
    const id = document.defaultGatewayId;
    return id && document.gateways.some((gateway) => gateway.id === id) ? id : undefined;
  }

  async create(input: GatewayInput, builtin = false): Promise<PublicGatewayRecord> {
    return this.serialize(async () => {
      const normalized = normalizeGatewayInput(input);
      const document = await this.read();
      if (document.gateways.some((gateway) => gateway.name.toLowerCase() === normalized.name.toLowerCase())) {
        throw new Error("网关名称不能重复");
      }
      const timestamp = nowIso();
      const gateway: GatewayRecord = {
        id: newId("gwy"),
        ...normalized,
        builtin,
        revision: 1,
        test: { status: "untested" },
        tests: [],
        createdAt: timestamp,
        updatedAt: timestamp
      };
      document.gateways.push(gateway);
      if (!document.defaultGatewayId) document.defaultGatewayId = gateway.id;
      await this.write(document);
      return publicGateway(gateway);
    });
  }

  /**
   * Seed the deployment's system gateway only before a gateway library has
   * ever been written. Keeping an existing (even empty) file authoritative
   * means a user's edit or deletion is not silently undone on the next boot.
   */
  async seedBuiltin(input: GatewayInput): Promise<PublicGatewayRecord | undefined> {
    const normalized = normalizeGatewayInput(input);
    return this.serialize(async () => {
      try {
        await fs.access(this.filePath());
        return undefined;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
      const timestamp = nowIso();
      const gateway: GatewayRecord = {
        id: newId("gwy"),
        ...normalized,
        builtin: true,
        revision: 1,
        test: { status: "untested" },
        tests: [],
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await this.write({
        schemaVersion: 1,
        gateways: [gateway],
        defaultGatewayId: gateway.id
      });
      return publicGateway(gateway);
    });
  }

  async update(id: string, input: GatewayInput): Promise<PublicGatewayRecord | undefined> {
    return this.serialize(async () => {
      const normalized = normalizeGatewayInput(input);
      const document = await this.read();
      const index = document.gateways.findIndex((gateway) => gateway.id === id);
      if (index < 0) return undefined;
      const current = document.gateways[index]!;
      if (document.gateways.some((gateway, candidateIndex) => candidateIndex !== index && gateway.name.toLowerCase() === normalized.name.toLowerCase())) {
        throw new Error("网关名称不能重复");
      }
      const updated: GatewayRecord = {
        ...current,
        ...normalized,
        // A changed URL/key/model/protocol set invalidates the old probe.
        test: { status: "untested" },
        tests: [],
        revision: current.revision + 1,
        updatedAt: nowIso()
      };
      // Never apply a previous endpoint/key's automatically discovered default
      // to newly created projects. User-edited mappings remain authoritative.
      for (const [model, detection] of Object.entries(updated.reasoningDetection ?? {})) {
        if (updated.models.includes(model) && detection.fingerprint === gatewayReasoningDiscoveryFingerprint(updated, model)) {
          if (detection.config && !isDeepStrictEqual(updated.modelReasoning?.[model], detection.config))
            delete updated.reasoningDetection![model];
          continue;
        }
        if (detection.config && isDeepStrictEqual(updated.modelReasoning?.[model], detection.config))
          delete updated.modelReasoning![model];
        delete updated.reasoningDetection![model];
      }
      document.gateways[index] = updated;
      await this.write(document);
      return publicGateway(updated);
    });
  }

  async delete(id: string): Promise<boolean> {
    this.cancelReasoningJobs(id);
    return this.serialize(async () => {
      const document = await this.read();
      const gateway = document.gateways.find((item) => item.id === id);
      if (!gateway) return false;
      document.gateways = document.gateways.filter((item) => item.id !== id);
      if (document.defaultGatewayId === id) document.defaultGatewayId = document.gateways[0]?.id;
      await this.write(document);
      return true;
    });
  }

  async setDefault(id: string): Promise<PublicGatewayRecord> {
    return this.serialize(async () => {
      const document = await this.read();
      const gateway = document.gateways.find((item) => item.id === id);
      if (!gateway) throw new Error("Gateway not found");
      document.defaultGatewayId = id;
      await this.write(document);
      return publicGateway(gateway);
    });
  }

  async test(
    id: string,
    requestedProtocol?: AgentProtocol,
    requestedModel?: string,
    signal?: AbortSignal,
    onStage?: GatewayProbeStageSink,
    reasoningOptionId?: string
  ): Promise<GatewayTestResult> {
    throwIfProbeCancelled(signal);
    const prepared = await this.prepareReasoning(id, requestedModel, reasoningOptionId, signal, gateway => {
      if (requestedProtocol && requestedProtocol !== gateway.protocol) throw new Error("该网关不支持所选协议");
    });
    const gateway = prepared.gateway;
    reasoningOptionId = prepared.optionId;
    if (!gateway) throw new Error("Gateway not found");
    const protocol = requestedProtocol ?? gateway.protocol;
    if (protocol !== gateway.protocol) throw new Error("该网关不支持所选协议");
    const model = requestedModel?.trim() || gateway.defaultModel;
    if (!gateway.models.includes(model)) throw new Error("该 model 不在网关声明的模型列表中");
    const reasoning = resolveGatewayReasoning(gateway.modelReasoning, model, reasoningOptionId);
    const testedAt = nowIso();
    let result: GatewayTestResult;
    try {
      throwIfProbeCancelled(signal);
      await this.assertAllowedNetworkTarget(gateway.url);
      result = await probeGateway(gateway, protocol, model, this.fetchImpl, this.timeoutMs, testedAt, signal, onStage, reasoning);
    } catch (error) {
      if (error instanceof GatewayProbeCancelledError) throw error;
      result = {
        status: "failed",
        protocol,
        model,
        testedAt,
        error: redactTrace(error instanceof Error ? error.message : "网关网络目标校验失败").slice(0, 500)
      };
    }
    const recorded: GatewayTestResult = {
      ...result,
      protocol,
      model,
      testedAt,
      routeMode: "direct",
      probeKind: "route",
      gatewayRevision: gateway.revision,
      routerCompatibilityVersion: PROTOCOL_ROUTER_COMPATIBILITY_VERSION,
      ...(reasoningOptionId ? { reasoningOptionId } : {}),
      ...(reasoning ? { reasoningFingerprint: reasoning.fingerprint } : {})
    };
    await this.recordTest(id, recorded);
    return recorded;
  }

  /**
   * Probe one concrete harness/gateway/model combination.  A native protocol
   * match reuses the ordinary gateway probe; a mismatch sends text/tool ×
   * ordinary/streaming source-native probes through the same conversion layer
   * used by the invocation-local proxy. The resulting record is deliberately
   * keyed by harness, so a successful direct probe cannot silently unlock
   * another protocol direction.
   */
  async testHarnessRoute(
    id: string,
    harness: AgentHarness,
    requestedModel?: string,
    signal?: AbortSignal,
    onStage?: GatewayProbeStageSink,
    reasoningOptionId?: string
  ): Promise<GatewayTestResult> {
    throwIfProbeCancelled(signal);
    const nativeProtocol = this.adapterSmokeProbe?.nativeProtocol(harness) ?? nativeProtocolForHarness(harness);
    if (!nativeProtocol) throw new Error("不支持所选 harness");
    const prepared = await this.prepareReasoning(id, requestedModel, reasoningOptionId, signal);
    const gateway = prepared.gateway;
    reasoningOptionId = prepared.optionId;
    if (!gateway) throw new Error("Gateway not found");
    const model = requestedModel?.trim() || gateway.defaultModel;
    if (!gateway.models.includes(model)) throw new Error("该 model 不在网关声明的模型列表中");
    const reasoning = resolveGatewayReasoning(gateway.modelReasoning, model, reasoningOptionId);
    const testedAt = nowIso();
    let result: GatewayTestResult;
    try {
      throwIfProbeCancelled(signal);
      await this.assertAllowedNetworkTarget(gateway.url);
      result = nativeProtocol === gateway.protocol
        ? await probeGateway(gateway, gateway.protocol, model, this.fetchImpl, this.timeoutMs, testedAt, signal, onStage, reasoning)
        : await probeGatewayRoute(gateway, nativeProtocol, model, this.fetchImpl, this.timeoutMs, testedAt, signal, onStage, reasoning);
    } catch (error) {
      if (error instanceof GatewayProbeCancelledError) throw error;
      result = {
        status: "failed",
        protocol: gateway.protocol,
        model,
        testedAt,
        error: redactTrace(error instanceof Error ? error.message : "网关网络目标校验失败").slice(0, 500)
      };
    }
    const routeResult: GatewayTestResult = {
      ...result,
      harness,
      nativeProtocol,
      routeMode: nativeProtocol === gateway.protocol ? "direct" : "proxy",
      probeKind: "route",
      gatewayRevision: gateway.revision,
      routerCompatibilityVersion: PROTOCOL_ROUTER_COMPATIBILITY_VERSION,
      deliveryMode: result.deliveryMode ?? "native-stream",
      ...(reasoningOptionId ? { reasoningOptionId } : {}),
      ...(reasoning ? { reasoningFingerprint: reasoning.fingerprint } : {}),
      ...(nativeProtocol === gateway.protocol
        ? {}
        : { routeDirection: `${nativeProtocol}->${gateway.protocol}` as `${AgentProtocol}->${AgentProtocol}` })
    };
    await this.recordTest(id, routeResult);
    return routeResult;
  }

  /** Run a route probe followed by an actual target-Adapter sentinel read. */
  async testHarness(
    id: string,
    harness: AgentHarness,
    requestedModel?: string,
    signal?: AbortSignal,
    onStage?: GatewayProbeStageSink,
    reasoningOptionId?: string
  ): Promise<GatewayTestResult> {
    throwIfProbeCancelled(signal);
    const nativeProtocol = this.adapterSmokeProbe?.nativeProtocol(harness) ?? nativeProtocolForHarness(harness);
    if (!nativeProtocol) throw new Error("不支持所选 harness");
    const prepared = await this.prepareReasoning(id, requestedModel, reasoningOptionId, signal);
    const gateway = prepared.gateway;
    reasoningOptionId = prepared.optionId;
    if (!gateway) throw new Error("Gateway not found");
    const model = requestedModel?.trim() || gateway.defaultModel;
    if (!gateway.models.includes(model)) throw new Error("该 model 不在网关声明的模型列表中");
    const reasoning = resolveGatewayReasoning(gateway.modelReasoning, model, reasoningOptionId);
    const routeResult = await this.testHarnessRoute(id, harness, model, signal, onStage, reasoningOptionId);
    if (routeResult.status !== "passed") {
      const skippedSmokeStage = probeStageSnapshot(HARNESS_SMOKE_PROBE_STAGE, "skipped", {
        error: "网关协议阶段未通过，未执行"
      });
      const failedRouteResult = {
        ...routeResult,
        stageResults: [...(routeResult.stageResults ?? []), skippedSmokeStage]
      };
      onStage?.(skippedSmokeStage);
      await this.recordTest(id, failedRouteResult);
      return failedRouteResult;
    }
    throwIfProbeCancelled(signal);

    const smokeStartedAt = Date.now();
    onStage?.(probeStageSnapshot(HARNESS_SMOKE_PROBE_STAGE, "running"));
    const smokeBase = {
      protocol: gateway.protocol,
      model,
      harness,
      nativeProtocol,
      routeMode: routeResult.routeMode,
      deliveryMode: routeResult.deliveryMode ?? "native-stream",
      ...(routeResult.routeDirection ? { routeDirection: routeResult.routeDirection } : {}),
      probeKind: "adapter-smoke" as const,
      gatewayRevision: gateway.revision,
      routerCompatibilityVersion: PROTOCOL_ROUTER_COMPATIBILITY_VERSION,
      ...(reasoningOptionId ? { reasoningOptionId } : {}),
      ...(reasoning ? { reasoningFingerprint: reasoning.fingerprint } : {})
    };
    const finishSmoke = async (result: GatewayTestResult): Promise<GatewayTestResult> => {
      const smokeStage = probeStageResult(
        HARNESS_SMOKE_PROBE_STAGE,
        result.status === "passed" ? "passed" : "failed",
        smokeStartedAt,
        result.status === "failed" ? { error: result.error } : {}
      );
      const finished: GatewayTestResult = {
        ...result,
        durationMs: (routeResult.durationMs ?? 0) + (smokeStage.durationMs ?? 0),
        stageResults: [...(routeResult.stageResults ?? []), smokeStage]
      };
      onStage?.(smokeStage);
      await this.recordTest(id, finished);
      return finished;
    };
    if (!this.adapterSmokeProbe) {
      const unavailable: GatewayTestResult = {
        ...smokeBase,
        status: "failed",
        testedAt: nowIso(),
        error: "Harness Runtime smoke probe is not configured"
      };
      return finishSmoke(unavailable);
    }

    let identity: AdapterSmokeProbeResult;
    try {
      throwIfProbeCancelled(signal);
      identity = await this.adapterSmokeProbe.cacheKey({ harness, gateway, model, reasoningOptionId, reasoning });
      throwIfProbeCancelled(signal);
    } catch (error) {
      if (error instanceof GatewayProbeCancelledError || signal?.aborted) {
        throw new GatewayProbeCancelledError();
      }
      const unavailable: GatewayTestResult = {
        ...smokeBase,
        status: "failed",
        testedAt: nowIso(),
        error: redactTrace(error instanceof Error ? error.message : "Harness Adapter 不可用").slice(0, 500)
      };
      return finishSmoke(unavailable);
    }
    const cachedGateway = await this.get(id);
    const cached = cachedGateway?.tests?.find((test) =>
      test.status === "passed" &&
      test.probeKind === "adapter-smoke" &&
      test.protocol === gateway.protocol &&
      test.model === model &&
      test.harness === harness &&
      test.reasoningOptionId === reasoningOptionId &&
      test.reasoningFingerprint === reasoning?.fingerprint &&
      test.nativeProtocol === nativeProtocol &&
      test.gatewayRevision === gateway.revision &&
      test.cacheKey === identity.cacheKey &&
      test.adapterVersion === identity.adapterVersion &&
      test.executableFingerprint === identity.executableFingerprint &&
      test.routerCompatibilityVersion === identity.routerCompatibilityVersion
    );
    if (cached) {
      return finishSmoke({
        ...smokeBase,
        ...identity,
        status: "passed",
        testedAt: nowIso()
      });
    }

    const controller = new AbortController();
    const smokeTimeoutMs = Math.max(
      10_000,
      Math.min(
        Number.parseInt(process.env.OPENFARS_HARNESS_SMOKE_TIMEOUT_MS ?? "180000", 10) || 180_000,
        600_000
      )
    );
    const timeout = setTimeout(() => controller.abort(), smokeTimeoutMs);
    timeout.unref();
    const abortSmoke = () => controller.abort();
    signal?.addEventListener("abort", abortSmoke, { once: true });
    let smokeResult: GatewayTestResult;
    try {
      throwIfProbeCancelled(signal);
      const evidence = await this.adapterSmokeProbe.runSmoke(
        { harness, gateway, model, reasoningOptionId, reasoning },
        controller.signal
      );
      throwIfProbeCancelled(signal);
      smokeResult = {
        ...smokeBase,
        ...evidence,
        status: "passed",
        testedAt: nowIso()
      };
    } catch (error) {
      if (signal?.aborted) throw new GatewayProbeCancelledError();
      smokeResult = {
        ...smokeBase,
        ...identity,
        status: "failed",
        testedAt: nowIso(),
        error: redactTrace(
          controller.signal.aborted
            ? `Harness Adapter smoke probe 超时（${smokeTimeoutMs}ms）`
            : error instanceof Error ? error.message : "Harness Adapter smoke probe 失败"
        ).slice(0, 500)
      };
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abortSmoke);
    }
    return finishSmoke(smokeResult);
  }

  /**
   * Verify every requested harness/model combination and retain each result
   * independently in `GatewayRecord.tests`. Harnesses run concurrently so a
   * missing or slow adapter does not block the other harness rows from
   * reporting progress; each concrete harness/model probe still runs its
   * text/tool and ordinary/stream stages in a deterministic serial order.
   */
  async testMatrix(
    id: string,
    options: GatewayMatrixOptions = {},
    signal?: AbortSignal,
    onProgress?: GatewayMatrixProgressSink
  ): Promise<GatewayMatrixResult> {
    throwIfProbeCancelled(signal);
    const gateway = await this.get(id);
    if (!gateway) throw new Error("Gateway not found");
    const knownHarnesses = this.adapterSmokeProbe?.harnessIds() ?? [...AGENT_HARNESSES];
    const harnesses = [...new Set(options.harnesses ?? knownHarnesses)];
    if (!harnesses.length || harnesses.some((harness) => !knownHarnesses.includes(harness))) {
      throw new Error("不支持所选 harness");
    }
    const models = [...new Set((options.models === undefined ? gateway.models : options.models)
      .map((model) => model.trim()).filter(Boolean))];
    if (!models.length || models.some((model) => !gateway.models.includes(model))) {
      throw new Error("所选 model 不在网关声明的模型列表中");
    }
    if (models.length * harnesses.length > 800) {
      throw new Error("一次最多验证 800 个 harness/model 组合");
    }
    // Settle the requested model mappings before recording compatibility.
    for (const model of models)
      await this.prepareReasoning(id, model, options.reasoningOptions?.[model] ?? undefined, signal);
    const resultGroups = await Promise.all(harnesses.map(async (harness) => {
      const harnessResults: GatewayTestResult[] = [];
      for (const model of models) {
        throwIfProbeCancelled(signal);
        onProgress?.({ type: "combination-start", harness, model, stageResults: queuedHarnessProbeStageResults() });
        const reasoningOptionId = options.reasoningOptions?.[model] ?? undefined;
        const result = await this.testHarness(id, harness, model, signal, (stage) => {
          onProgress?.({ type: "stage", harness, model, stage });
        }, reasoningOptionId ?? undefined);
        harnessResults.push(result);
        onProgress?.({ type: "result", harness, model, result });
      }
      return harnessResults;
    }));
    const results = resultGroups.flat();
    const latest = await this.get(id);
    if (!latest) throw new Error("Gateway not found");
    return { gateway: publicGateway(latest), results };
  }

  private async recordTest(id: string, result: GatewayTestResult): Promise<void> {
    await this.serialize(async () => {
      const document = await this.read();
      const current = document.gateways.find((item) => item.id === id);
      if (!current) return;
      // A background refresh may have changed this model while its old probe
      // was still running. Never cache that old result as current validation.
      if (result.gatewayRevision !== undefined && result.gatewayRevision !== current.revision) return;
      try {
        const expected = resolveGatewayReasoning(current.modelReasoning, result.model, result.reasoningOptionId);
        if (expected?.fingerprint !== result.reasoningFingerprint) return;
      } catch { return; }
      const nextTest: GatewayTestState = {
        status: result.status,
        testedAt: result.testedAt,
        protocol: result.protocol,
        model: result.model,
        ...(result.error ? { error: redactTrace(result.error).slice(0, 500) } : {}),
        ...(result.durationMs !== undefined ? { durationMs: Math.round(result.durationMs) } : {}),
        ...(result.stageResults?.length ? {
          stageResults: result.stageResults.map((stage) => ({
            ...stage,
            ...(stage.durationMs !== undefined ? { durationMs: Math.round(stage.durationMs) } : {}),
            ...(stage.error ? { error: redactTrace(stage.error).slice(0, 500) } : {})
          }))
        } : {}),
        ...(result.harness ? { harness: result.harness } : {}),
        ...(result.nativeProtocol ? { nativeProtocol: result.nativeProtocol } : {}),
        ...(result.routeMode ? { routeMode: result.routeMode } : {}),
        ...(result.routeDirection ? { routeDirection: result.routeDirection } : {}),
        ...(result.deliveryMode ? { deliveryMode: result.deliveryMode } : {}),
        ...(result.probeKind ? { probeKind: result.probeKind } : {}),
        ...(result.cacheKey ? { cacheKey: result.cacheKey } : {}),
        ...(result.adapterVersion ? { adapterVersion: result.adapterVersion } : {}),
        ...(result.executableFingerprint ? { executableFingerprint: result.executableFingerprint } : {}),
        ...(result.gatewayRevision === undefined ? {} : { gatewayRevision: result.gatewayRevision }),
        ...(result.routerCompatibilityVersion
          ? { routerCompatibilityVersion: result.routerCompatibilityVersion }
          : {}),
        ...(result.reasoningOptionId ? { reasoningOptionId: result.reasoningOptionId } : {}),
        ...(result.reasoningFingerprint ? { reasoningFingerprint: result.reasoningFingerprint } : {})
      };
      current.test = nextTest;
      const sameCombination = (test: GatewayTestState) =>
        test.protocol === nextTest.protocol &&
        test.model === nextTest.model &&
        test.harness === nextTest.harness &&
        test.reasoningOptionId === nextTest.reasoningOptionId &&
        (test.probeKind ?? "route") === (nextTest.probeKind ?? "route");
      const staleSmokeAfterRouteFailure = (test: GatewayTestState) =>
        nextTest.status === "failed" &&
        (nextTest.probeKind ?? "route") === "route" &&
        nextTest.harness !== undefined &&
        test.probeKind === "adapter-smoke" &&
        test.protocol === nextTest.protocol &&
        test.model === nextTest.model &&
        test.harness === nextTest.harness &&
        test.reasoningOptionId === nextTest.reasoningOptionId;
      current.tests = [
        ...(current.tests ?? []).filter((test) =>
          !sameCombination(test) && !staleSmokeAfterRouteFailure(test)
        ),
        nextTest
      ].slice(-500);
      current.updatedAt = nowIso();
      await this.write(document);
    });
  }

  async discoverModels(
    input: Pick<GatewayInput, "url" | "apiKey" | "protocol">
  ): Promise<string[]> {
    const url = validateGatewayUrl(input.url);
    const apiKey = input.apiKey.trim();
    if (!apiKey || apiKey.length > 8_000) throw new Error("网关 API key 不能为空且不能超过 8000 个字符");
    if (!AGENT_PROTOCOLS.includes(input.protocol)) throw new Error("网关必须声明一种有效协议");
    await this.assertAllowedNetworkTarget(url);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    let models: string[];
    try {
      const headers: Record<string, string> = {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`
      };
      if (input.protocol === "anthropic-messages") {
        headers["x-api-key"] = apiKey;
        headers["anthropic-version"] = "2023-06-01";
      }
      const response = await probeFetchWithRetry(this.fetchImpl, `${url}/models`, {
        method: "GET",
        headers,
        redirect: "error",
        signal: controller.signal
      }, controller.signal);
      if (!response.ok) {
        throw new Error(`模型列表返回 HTTP ${response.status}：${redactTrace((await response.text()).slice(0, 500))}`);
      }
      const body = await response.json() as unknown;
      const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
      const entries = Array.isArray(record.data)
        ? record.data
        : Array.isArray(record.models)
          ? record.models
          : [];
      models = [...new Set(entries.flatMap((entry) =>
        typeof entry === "string"
          ? [entry.trim()]
          : entry && typeof entry === "object" && typeof (entry as Record<string, unknown>).id === "string"
            ? [String((entry as Record<string, unknown>).id).trim()]
            : []
      ).filter(Boolean))].slice(0, 200);
      if (!models.length) throw new Error("网关没有返回有效的 model 列表");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`模型列表刷新超时（${this.timeoutMs}ms）`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
    return models;
  }

  async refreshModels(id: string): Promise<PublicGatewayRecord> {
    const gateway = await this.get(id);
    if (!gateway) throw new Error("Gateway not found");
    const models = await this.discoverModels(gateway);
    return this.serialize(async () => {
      const document = await this.read();
      const current = document.gateways.find((item) => item.id === id);
      if (!current) throw new Error("Gateway not found");
      current.models = models;
      current.modelContextWindows = Object.fromEntries(models.map((model) => [
        model,
        current.modelContextWindows?.[model] ?? DEFAULT_MODEL_CONTEXT_WINDOW
      ]));
      current.modelReasoning = Object.fromEntries(
        Object.entries(current.modelReasoning ?? {}).filter(([model]) => models.includes(model))
      );
      if (current.reasoningDetection) current.reasoningDetection = Object.fromEntries(
        Object.entries(current.reasoningDetection).filter(([model]) => models.includes(model))
      );
      if (!models.includes(current.defaultModel)) current.defaultModel = models[0]!;
      current.revision += 1;
      current.tests = [];
      current.test = { status: "untested" };
      current.updatedAt = nowIso();
      await this.write(document);
      return publicGateway(current);
    });
  }

  private withReasoningProgress(gateway: GatewayRecord): GatewayRecord {
    const progress = Object.fromEntries([...this.reasoningJobs.values()]
      .filter(job => job.gateway.id === gateway.id && !job.controller.signal.aborted)
      .map(job => [job.model, job.status]));
    return { ...gateway, ...(Object.keys(progress).length ? { reasoningDiscovery: progress } : {}) };
  }

  private cancelReasoningJobs(id: string, models?: string[]): void {
    for (const [key, job] of this.reasoningJobs) {
      if (job.gateway.id !== id || models && !models.includes(job.model)) continue;
      job.controller.abort();
      this.reasoningJobs.delete(key);
    }
  }

  /** Product save handlers enqueue background work; ordinary reads and startup never probe. */
  async scheduleReasoningDiscovery(id: string, options: { models?: string[]; force?: boolean } = {}): Promise<PublicGatewayRecord> {
    const gateway = await this.get(id);
    if (!gateway) throw new Error("Gateway not found");
    const models = [...new Set(options.models ?? gateway.models)];
    if (models.some(model => !gateway.models.includes(model))) throw new Error("所选 model 不在网关声明的模型列表中");
    this.cancelReasoningJobs(id, options.models);
    if (!this.reasoningClosed && this.automaticReasoning && gateway.autoReasoning !== false) {
      // The default model gets the first available slot. At most two saved
      // models are probed concurrently by this background queue.
      models.sort((a, b) => Number(b === gateway.defaultModel) - Number(a === gateway.defaultModel));
      for (const model of models) {
        const cached = gateway.reasoningDetection?.[model], configured = gateway.modelReasoning?.[model];
        if (configured?.options.length && !isDeepStrictEqual(cached?.config, configured)) continue;
        const fingerprint = gatewayReasoningDiscoveryFingerprint(gateway, model);
        if (!options.force && freshReasoningDetection(cached, fingerprint)) continue;
        const job: GatewayReasoningJob = { gateway, model, fingerprint, force: options.force === true,
          controller: new AbortController(), status: "queued" };
        this.reasoningJobs.set(`${id}:${model}`, job);
        this.reasoningQueue.push(job);
      }
      this.pumpReasoningQueue();
    }
    // Progress is ephemeral. Do not return a stale progress field captured by get().
    delete gateway.reasoningDiscovery;
    return publicGateway(this.withReasoningProgress(gateway));
  }

  private pumpReasoningQueue(): void {
    while (!this.reasoningClosed && this.activeReasoningJobs < 2 && this.reasoningQueue.length) {
      const job = this.reasoningQueue.shift()!;
      const key = `${job.gateway.id}:${job.model}`;
      if (job.controller.signal.aborted || this.reasoningJobs.get(key) !== job) continue;
      job.status = "checking";
      this.activeReasoningJobs += 1;
      const task = this.runReasoningJob(job).catch(error => {
        console.error("Unable to record gateway reasoning discovery:",
          redactTrace(String(error).replaceAll(job.gateway.apiKey, "[REDACTED]")));
      }).finally(() => {
        if (this.reasoningJobs.get(key) === job) this.reasoningJobs.delete(key);
        this.reasoningTasks.delete(task);
        this.activeReasoningJobs -= 1;
        this.pumpReasoningQueue();
      });
      this.reasoningTasks.add(task);
    }
  }

  private async runReasoningJob(job: GatewayReasoningJob): Promise<void> {
    try {
      await this.discoverReasoning(job.gateway.id, job.model, job.controller.signal, job.force);
    } catch (error) {
      if (job.controller.signal.aborted) return;
      await this.serialize(async () => {
        if (job.controller.signal.aborted) return;
        const document = await this.read();
        const current = document.gateways.find(item => item.id === job.gateway.id);
        if (!current || current.autoReasoning === false || !current.models.includes(job.model) ||
          gatewayReasoningDiscoveryFingerprint(current, job.model) !== job.fingerprint ||
          !isDeepStrictEqual(current.modelReasoning?.[job.model], job.gateway.modelReasoning?.[job.model])) return;
        current.reasoningDetection = { ...current.reasoningDetection, [job.model]: {
          status: "failed", checkedAt: nowIso(), fingerprint: job.fingerprint, attempts: [],
          message: redactTrace(String(error).replaceAll(job.gateway.apiKey, "[REDACTED]")).slice(0, 500)
        } };
        current.updatedAt = nowIso();
        await this.write(document);
      });
    }
  }

  /** Cancel save-triggered probes before the host releases its runtime directory. */
  async close(): Promise<void> {
    this.reasoningClosed = true;
    for (const job of this.reasoningJobs.values()) job.controller.abort();
    this.reasoningJobs.clear();
    this.reasoningQueue.splice(0);
    await Promise.allSettled([...this.reasoningTasks]);
  }

  /** Capability discovery is scoped to explicitly configured models, never GET/list/startup. */
  async discoverReasoning(id: string, requestedModel?: string, signal?: AbortSignal, force = false): Promise<GatewayReasoningDetection> {
    throwIfProbeCancelled(signal);
    const gateway = await this.get(id);
    if (!gateway) throw new Error("Gateway not found");
    const model = requestedModel?.trim() || gateway.defaultModel;
    if (!gateway.models.includes(model)) throw new Error("该 model 不在网关声明的模型列表中");
    const fingerprint = gatewayReasoningDiscoveryFingerprint(gateway, model);
    const cached = gateway.reasoningDetection?.[model];
    const configured = gateway.modelReasoning?.[model];
    const automaticConfig = Boolean(cached?.config && isDeepStrictEqual(cached.config, configured));
    if (configured?.options.length && !automaticConfig) return {
      status: "verified", checkedAt: nowIso(), fingerprint, config: configured,
      message: "保留手动配置；自动探测不会覆盖自定义思考参数", attempts: [] };
    if (!force && freshReasoningDetection(cached, fingerprint)) return structuredClone(cached!);
    const key = `${id}:${model}:${fingerprint}`;
    const pending = this.reasoningDiscoveries.get(key);
    if (pending && !pending.signal?.aborted) return pending.task;
    const task = (async () => {
      await this.assertAllowedNetworkTarget(gateway.url);
      const result = await discoverGatewayReasoning(gateway, model, { fetch: this.fetchImpl, timeoutMs: this.timeoutMs, signal });
      throwIfProbeCancelled(signal);
      await this.serialize(async () => {
        throwIfProbeCancelled(signal);
        const document = await this.read();
        const current = document.gateways.find(item => item.id === id);
        if (!current || !current.models.includes(model) || current.autoReasoning !== gateway.autoReasoning ||
          gatewayReasoningDiscoveryFingerprint(current, model) !== fingerprint ||
          !isDeepStrictEqual(current.modelReasoning?.[model], configured))
          throw new Error("网关配置在思考参数探测期间已变化，请重新测试");
        const next = { ...current.modelReasoning };
        if (result.status === "verified" && result.config) next[model] = result.config;
        else if (automaticConfig) delete next[model];
        if (!isDeepStrictEqual(next, current.modelReasoning ?? {})) {
          current.modelReasoning = next;
          // Discovery changes only this model's options. Keep the transport
          // revision and other models' real probe results intact.
          if (current.test.model === model) current.test = { status: "untested" };
          current.tests = (current.tests ?? []).filter(test => test.model !== model);
        }
        current.reasoningDetection = { ...current.reasoningDetection, [model]: result };
        current.updatedAt = nowIso();
        await this.write(document);
      });
      return result;
    })().catch(error => {
      if (signal?.aborted || error instanceof Error && error.name === "AbortError") throw new GatewayProbeCancelledError();
      throw error;
    });
    const discovery = { task, signal };
    this.reasoningDiscoveries.set(key, discovery);
    try { return await task; }
    finally { if (this.reasoningDiscoveries.get(key) === discovery) this.reasoningDiscoveries.delete(key); }
  }

  private async prepareReasoning(id: string, requestedModel: string | undefined, optionId: string | undefined, signal?: AbortSignal,
    validate?: (gateway: GatewayRecord) => void) {
    let gateway = await this.get(id);
    if (!gateway) throw new Error("Gateway not found");
    validate?.(gateway);
    const model = requestedModel?.trim() || gateway.defaultModel;
    if (!gateway.models.includes(model)) throw new Error("该 model 不在网关声明的模型列表中");
    if (!optionId && this.automaticReasoning && gateway.autoReasoning !== false) {
      await this.discoverReasoning(id, model, signal);
      gateway = (await this.get(id))!;
    }
    return { gateway, optionId: optionId ?? (gateway.autoReasoning === false ? undefined : gateway.modelReasoning?.[model]?.defaultOptionId) };
  }

  private filePath(): string {
    return path.join(this.root, "gateways.json");
  }

  private async read(): Promise<GatewayFile> {
    try {
      const raw = JSON.parse(await fs.readFile(this.filePath(), "utf8")) as unknown;
      if (!raw || typeof raw !== "object" || (raw as Record<string, unknown>).schemaVersion !== 1 || !Array.isArray((raw as Record<string, unknown>).gateways)) {
        return { schemaVersion: 1, gateways: [] };
      }
      const gateways = (raw as { gateways: unknown[] }).gateways.flatMap((value) => {
        try {
          if (!value || typeof value !== "object") throw new Error();
          const {
            allowPrivateNetwork: legacyAllowPrivateNetwork,
            ...persistedItem
          } = value as Record<string, unknown>;
          // Older builds persisted a per-gateway opt-in that no longer
          // controls network policy. Drop it while reading so it cannot leak
          // back through public responses or newly written gateway records.
          void legacyAllowPrivateNetwork;
          const item = persistedItem as Partial<GatewayRecord>;
          if (typeof item.id !== "string" || !GATEWAY_ID_PATTERN.test(item.id) || typeof item.name !== "string" || typeof item.url !== "string" || typeof item.apiKey !== "string" || !Array.isArray(item.models) || typeof item.defaultModel !== "string" || typeof item.protocol !== "string") throw new Error();
          const normalized = normalizeGatewayInput({
            name: item.name,
            url: item.url,
            apiKey: item.apiKey,
            models: item.models.filter((model): model is string => typeof model === "string"),
            modelContextWindows: item.modelContextWindows,
            modelReasoning: item.modelReasoning,
            autoReasoning: item.autoReasoning,
            defaultModel: item.defaultModel,
            protocol: item.protocol as AgentProtocol
          });
          return [{
            ...item,
            ...normalized,
            id: item.id,
            revision: typeof item.revision === "number" && Number.isInteger(item.revision) && item.revision > 0
              ? item.revision
              : 1,
            test: normalizeGatewayTestState(item.test),
            tests: Array.isArray(item.tests)
              ? item.tests.flatMap((test) => {
                  const normalized = normalizeGatewayTestState(test);
                  return normalized.status === "untested" && !test ? [] : [normalized];
                })
              : [],
            createdAt: typeof item.createdAt === "string" ? item.createdAt : nowIso(),
            updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : nowIso()
          } as GatewayRecord];
        } catch {
          return [];
        }
      });
      return {
        schemaVersion: 1,
        gateways,
        defaultGatewayId: typeof (raw as Record<string, unknown>).defaultGatewayId === "string" ? (raw as Record<string, string>).defaultGatewayId : undefined
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return { schemaVersion: 1, gateways: [] };
      return { schemaVersion: 1, gateways: [] };
    }
  }

  private async write(document: GatewayFile): Promise<void> {
    await fs.mkdir(this.root, { recursive: true });
    const destination = this.filePath();
    const temporary = `${destination}.${process.pid}.${newId("tmp")}`;
    try {
      await fs.writeFile(temporary, `${JSON.stringify(document, null, 2)}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });
      await fs.rename(temporary, destination);
    } catch (error) {
      await fs.rm(temporary, { force: true });
      throw error;
    }
  }

  private serialize<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.mutationTail.then(operation, operation);
    this.mutationTail = result.then(() => undefined, () => undefined);
    return result;
  }
}

export { GatewayStore as GatewayRegistry };

function normalizeGatewayProbeStageResult(value: unknown): GatewayProbeStageResult | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const definition = ALL_GATEWAY_PROBE_STAGES.find((item) => item.stage === record.stage);
  if (!definition) return undefined;
  const status = record.status === "queued" || record.status === "running" || record.status === "passed" || record.status === "failed" || record.status === "skipped"
    ? record.status
    : undefined;
  if (!status) return undefined;
  const durationMs = typeof record.durationMs === "number" && Number.isFinite(record.durationMs) && record.durationMs >= 0
    ? Math.round(record.durationMs)
    : undefined;
  const httpStatus = typeof record.httpStatus === "number" && Number.isInteger(record.httpStatus) && record.httpStatus >= 100 && record.httpStatus <= 599
    ? record.httpStatus
    : undefined;
  return {
    stage: definition.stage,
    label: definition.label,
    expectation: definition.expectation,
    stream: definition.stream,
    status,
    ...(durationMs !== undefined ? { durationMs } : {}),
    ...(httpStatus !== undefined ? { httpStatus } : {}),
    ...(typeof record.error === "string" ? { error: redactTrace(record.error).slice(0, 500) } : {})
  };
}

function normalizeGatewayTestState(value: unknown): GatewayTestState {
  if (!value || typeof value !== "object") return { status: "untested" };
  const record = value as Record<string, unknown>;
  const status = record.status === "passed" || record.status === "failed"
    ? record.status
    : "untested";
  const protocol = AGENT_PROTOCOLS.includes(record.protocol as AgentProtocol)
    ? record.protocol as AgentProtocol
    : undefined;
  const harness = typeof record.harness === "string" && HARNESS_ID_PATTERN.test(record.harness)
    ? record.harness
    : undefined;
  const nativeProtocol = AGENT_PROTOCOLS.includes(record.nativeProtocol as AgentProtocol)
    ? record.nativeProtocol as AgentProtocol
    : undefined;
  const routeMode = record.routeMode === "direct" || record.routeMode === "proxy"
    ? record.routeMode
    : undefined;
  const routeDirection = typeof record.routeDirection === "string" && validRouteDirection(record.routeDirection)
    ? record.routeDirection
    : undefined;
  const probeKind = record.probeKind === "route" || record.probeKind === "adapter-smoke"
    ? record.probeKind
    : undefined;
  const durationMs = typeof record.durationMs === "number" && Number.isFinite(record.durationMs) && record.durationMs >= 0
    ? Math.round(record.durationMs)
    : undefined;
  const stageResults = Array.isArray(record.stageResults)
    ? record.stageResults.flatMap((item) => {
        const normalized = normalizeGatewayProbeStageResult(item);
        return normalized ? [normalized] : [];
      })
    : undefined;
  return {
    status,
    ...(typeof record.testedAt === "string" ? { testedAt: record.testedAt } : {}),
    ...(typeof record.error === "string" ? { error: redactTrace(record.error).slice(0, 500) } : {}),
    ...(durationMs !== undefined ? { durationMs } : {}),
    ...(stageResults?.length ? { stageResults } : {}),
    ...(protocol ? { protocol } : {}),
    ...(typeof record.model === "string" ? { model: record.model.slice(0, 500) } : {}),
    ...(harness ? { harness } : {}),
    ...(nativeProtocol ? { nativeProtocol } : {}),
    ...(routeMode ? { routeMode } : {}),
    ...(routeDirection ? { routeDirection } : {}),
    ...(record.deliveryMode === "native-stream" || record.deliveryMode === "buffered-json"
      ? { deliveryMode: record.deliveryMode }
      : {}),
    ...(probeKind ? { probeKind } : {}),
    ...(typeof record.cacheKey === "string" ? { cacheKey: record.cacheKey.slice(0, 256) } : {}),
    ...(typeof record.adapterVersion === "string" ? { adapterVersion: record.adapterVersion.slice(0, 128) } : {}),
    ...(typeof record.executableFingerprint === "string"
      ? { executableFingerprint: record.executableFingerprint.slice(0, 256) }
      : {}),
    ...(typeof record.gatewayRevision === "number" && Number.isInteger(record.gatewayRevision)
      ? { gatewayRevision: record.gatewayRevision }
      : {}),
    ...(typeof record.routerCompatibilityVersion === "string"
      ? { routerCompatibilityVersion: record.routerCompatibilityVersion.slice(0, 128) }
      : {}),
    ...(typeof record.reasoningOptionId === "string"
      ? { reasoningOptionId: record.reasoningOptionId.slice(0, 64) }
      : {}),
    ...(typeof record.reasoningFingerprint === "string" && /^[a-f0-9]{64}$/.test(record.reasoningFingerprint)
      ? { reasoningFingerprint: record.reasoningFingerprint }
      : {})
  };
}

function validRouteDirection(value: string): value is `${AgentProtocol}->${AgentProtocol}` {
  const [source, target] = value.split("->");
  return AGENT_PROTOCOLS.includes(source as AgentProtocol) &&
    AGENT_PROTOCOLS.includes(target as AgentProtocol) &&
    source !== target;
}

async function probeGateway(
  gateway: GatewayRecord,
  protocol: AgentProtocol,
  model: string,
  fetchImpl: typeof globalThis.fetch,
  timeoutMs: number,
  testedAt: string,
  signal?: AbortSignal,
  onStage?: GatewayProbeStageSink,
  reasoning?: ResolvedGatewayReasoning
): Promise<GatewayTestResult> {
  const startedAt = Date.now();
  const stageResults: GatewayProbeStageResult[] = [];
  let passed: GatewayTestResult | undefined;
  let deliveryMode: GatewayTestResult["deliveryMode"] = "native-stream";
  for (const [index, definition] of GATEWAY_PROBE_STAGES.entries()) {
    throwIfProbeCancelled(signal);
    onStage?.(probeStageSnapshot(definition, "running"));
    if (deliveryMode === "buffered-json" && definition.stream) {
      const compatible = bufferedCompatibilityStage(definition);
      onStage?.(compatible);
      stageResults.push(compatible);
      continue;
    }
    const result = await probeGatewayRequest(
      gateway,
      protocol,
      model,
      definition,
      fetchImpl,
      timeoutMs,
      testedAt,
      signal,
      undefined,
      reasoning
    );
    if (result.status !== "passed" && definition.stream) {
      deliveryMode = "buffered-json";
      const compatible = bufferedCompatibilityStage(definition, result.error);
      onStage?.(compatible);
      stageResults.push(compatible);
      continue;
    }
    for (const stage of result.stageResults ?? []) onStage?.(stage);
    stageResults.push(...(result.stageResults ?? []));
    if (result.status !== "passed") {
      const skippedStages = skippedProbeStageResults(index + 1);
      for (const stage of skippedStages) onStage?.(stage);
      const completeStages = [...stageResults, ...skippedStages];
      return { ...result, stageResults: completeStages, durationMs: Date.now() - startedAt };
    }
    passed = result;
  }
  return {
    ...passed!,
    stageResults,
    durationMs: Date.now() - startedAt,
    deliveryMode
  };
}

function bufferedCompatibilityStage(
  definition: typeof GATEWAY_PROBE_STAGES[number],
  nativeStreamError?: string
): GatewayProbeStageResult {
  return probeStageSnapshot(definition, "passed", {
    error: nativeStreamError
      ? `原生流式不可可靠使用，已选择通用 buffered-json 兼容模式：${nativeStreamError}`
      : "该路由已选择通用 buffered-json 兼容模式；无需伪造流式分片"
  });
}

async function probeGatewayRequest(
  gateway: GatewayRecord,
  protocol: AgentProtocol,
  model: string,
  definition: typeof GATEWAY_PROBE_STAGES[number],
  fetchImpl: typeof globalThis.fetch,
  timeoutMs: number,
  testedAt: string,
  signal?: AbortSignal,
  onStage?: GatewayProbeStageSink,
  reasoning?: ResolvedGatewayReasoning
): Promise<GatewayTestResult> {
  throwIfProbeCancelled(signal);
  const startedAt = Date.now();
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort, { once: true });
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const endpoint = gatewayEndpoint(gateway.url, protocol);
    const headers = gatewayHeaders(gateway.apiKey, protocol, definition.stream);
    const body = applyGatewayReasoning(
      gatewayProbeBody(protocol, model, definition.stream, definition.expectation),
      reasoning
    );
    const response = await probeFetchWithRetry(fetchImpl, endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      redirect: "error",
      signal: controller.signal
    }, controller.signal);
    throwIfProbeCancelled(signal);
    if (!response.ok) {
      const text = (await response.text()).slice(0, 500);
      const error = `${probeLabel(definition.expectation, definition.stream)}网关探测返回 HTTP ${response.status}${text ? `：${redactTrace(text)}` : ""}`;
      return {
        status: "failed",
        protocol,
        model,
        testedAt,
        httpStatus: response.status,
        error,
        stageResults: [probeStageResult(definition, "failed", startedAt, { httpStatus: response.status, error })]
      };
    }
    if (definition.stream) {
      const streamResult = await validateProbeStream(response, protocol, model, definition.expectation);
      if (!streamResult.ok) {
        return {
          status: "failed",
          protocol,
          model,
          testedAt,
          httpStatus: response.status,
          error: streamResult.error,
          stageResults: [probeStageResult(definition, "failed", startedAt, { httpStatus: response.status, error: streamResult.error })]
        };
      }
    } else {
      const value = await response.json() as unknown;
      const error = protocolResponseError(value);
      if (error) return {
        status: "failed",
        protocol,
        model,
        testedAt,
        httpStatus: response.status,
        error,
        stageResults: [probeStageResult(definition, "failed", startedAt, { httpStatus: response.status, error })]
      };
      if (!hasExpectedProbeResponse(value, protocol, definition.expectation)) {
        const error = definition.expectation === "tool"
          ? "工具调用网关探测未返回 openfars_probe 调用"
          : "文本网关探测未返回可识别的文本响应";
        return {
          status: "failed",
          protocol,
          model,
          testedAt,
          httpStatus: response.status,
          error,
          stageResults: [probeStageResult(definition, "failed", startedAt, { httpStatus: response.status, error })]
        };
      }
    }
    return {
      status: "passed",
      protocol,
      model,
      testedAt,
      httpStatus: response.status,
      stageResults: [probeStageResult(definition, "passed", startedAt, { httpStatus: response.status })]
    };
  } catch (error) {
    if (signal?.aborted) throw new GatewayProbeCancelledError();
    const message = error instanceof Error && error.name === "AbortError"
      ? `${probeLabel(definition.expectation, definition.stream)}网关探测超时（${timeoutMs}ms）`
      : error instanceof Error ? error.message : "网关探测失败";
    return {
      status: "failed",
      protocol,
      model,
      testedAt,
      error: redactTrace(message).slice(0, 500),
      stageResults: [probeStageResult(definition, "failed", startedAt, { error: message })]
    };
  } finally {
    signal?.removeEventListener("abort", onAbort);
    clearTimeout(timeout);
  }
}

function gatewayEndpoint(baseUrl: string, protocol: AgentProtocol): string {
  return `${baseUrl.replace(/\/+$/, "")}/${protocol === "responses" ? "responses" : protocol === "chat-completions" ? "chat/completions" : "messages"}`;
}

function gatewayHeaders(apiKey: string, protocol: AgentProtocol, stream: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: stream ? "text/event-stream, application/json" : "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`
  };
  if (protocol === "anthropic-messages") {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
  }
  return headers;
}

function gatewayProbeBody(
  protocol: AgentProtocol,
  model: string,
  stream: boolean,
  expectation: "text" | "tool"
): Record<string, unknown> {
  const tool = {
    name: "openfars_probe",
    description: "Return the supplied value for an OpenFARS compatibility probe",
    parameters: { type: "object", properties: { value: { type: "string" } } }
  };
  const toolProbe = expectation === "tool";
  const instruction = toolProbe
    ? "Call openfars_probe exactly once with value set to ok. Do not answer in prose."
    : "Reply with exactly: ok";
  if (protocol === "responses") return {
    model,
    instructions: `OpenFARS compatibility probe developer instruction. ${instruction}`,
    input: [{ role: "user", content: instruction }],
    ...(toolProbe ? {
      tools: [{ type: "function", ...tool }],
      tool_choice: { type: "function", name: tool.name }
    } : {}),
    stream,
    // Keep enough room for providers that emit a short reasoning item before
    // the final text even when the probe disables thinking where supported.
    // Reasoning-capable Responses models can consume a short 64-token budget
    // before emitting either visible text or the forced function call.  The
    // compatibility probe must reach a terminal provider event rather than
    // misclassifying budget exhaustion as a protocol failure.
    max_output_tokens: 512
  };
  if (protocol === "chat-completions") return {
    model,
    messages: [
      // Some OpenAI-compatible gateways reject the newer `developer` role;
      // use the broadly supported system role for the compatibility probe.
      { role: "system", content: `OpenFARS compatibility probe system instruction. ${instruction}` },
      { role: "user", content: instruction }
    ],
    ...(toolProbe ? {
      tools: [{ type: "function", function: tool }],
      // Only one tool is offered, so `required` still verifies this exact
      // call while remaining compatible with thinking-enabled gateways.
      tool_choice: "required"
    } : {}),
    stream,
    max_tokens: 512
  };
  return {
    model,
    system: `OpenFARS compatibility probe system instruction. ${instruction}`,
    messages: [{ role: "user", content: instruction }],
    ...(toolProbe ? {
      tools: [{ name: tool.name, description: tool.description, input_schema: tool.parameters }],
      tool_choice: { type: "tool", name: tool.name }
    } : {}),
    stream,
    // Responses-backed providers may spend a small prefix on reasoning before
    // emitting the visible text. Keep the Anthropic compatibility probe large
    // enough to reach the requested text instead of classifying a budget-only
    // incomplete response as a protocol failure.
    max_tokens: 512
  };
}

function probeLabel(expectation: "text" | "tool", stream: boolean): string {
  return `${expectation === "tool" ? "工具调用" : "文本"}${stream ? "流式" : "普通"}`;
}

function protocolResponseError(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  // OpenAI Responses success envelopes include `error: null`.  Presence of
  // that nullable field is not itself an error; only a non-null payload or an
  // explicit top-level error event may fail the probe.
  if ((record.error === undefined || record.error === null) && record.type !== "error") {
    return undefined;
  }
  const detail = typeof record.error === "string"
    ? record.error
    : record.error && typeof record.error === "object" && typeof (record.error as Record<string, unknown>).message === "string"
      ? String((record.error as Record<string, unknown>).message)
      : "网关返回错误响应";
  return `网关返回错误响应：${redactTrace(detail).slice(0, 500)}`;
}

async function validateProbeStream(
  response: Response,
  protocol: AgentProtocol,
  model: string,
  expectation: "text" | "tool"
): Promise<{ ok: true } | { ok: false; error: string }> {
  const raw = await response.text();
  const frames = parseSseJsonFrames(raw);
  if (!frames.length) {
    try {
      const value = JSON.parse(raw) as unknown;
      const error = protocolResponseError(value);
      if (error) return { ok: false, error };
      return hasProtocolResponseShape(value, protocol)
        ? { ok: false, error: "流式网关退化为普通 JSON 响应，未验证流式事件与终止信号" }
        : { ok: false, error: "流式网关未返回可识别的协议响应" };
    } catch {
      return { ok: false, error: "流式网关未返回可识别的事件" };
    }
  }
  let terminal = false;
  let expectedOutput = false;
  let unnamedToolDelta = false;
  let mismatchedToolName: string | undefined;
  let terminalStopReason: string | undefined;
  for (const frame of frames) {
    if (frameHasExpectedProbeResponse(frame, protocol, expectation)) expectedOutput = true;
    const normalizedEvents = normalizeProtocolStreamEvents(protocol, frame);
    for (const normalized of normalizedEvents) {
      if (normalized.type === "error") return { ok: false, error: `流式网关返回错误：${redactTrace(normalized.error ?? "provider stream failed").slice(0, 500)}` };
      if (normalized.type === "completed") {
        terminal = true;
        terminalStopReason = normalized.stopReason ?? terminalStopReason;
      }
      if (expectation === "tool" && normalized.type === "tool_call_delta") {
        if (normalized.toolName === "openfars_probe") expectedOutput = true;
        else if (!normalized.toolName) unnamedToolDelta = true;
        else mismatchedToolName = normalized.toolName;
      }
      if (expectation === "text" && normalized.type === "text_delta" && Boolean(normalized.text?.trim())) expectedOutput = true;
    }
  }
  if (!terminal) return { ok: false, error: `${probeLabel(expectation, true)}网关未返回 ${protocol} 的终止事件（model ${model}）` };
  if (expectation === "tool" && !expectedOutput && unnamedToolDelta && !mismatchedToolName) expectedOutput = true;
  if (!expectedOutput) return {
    ok: false,
    error: expectation === "tool"
      ? `工具调用流式网关探测未返回 openfars_probe 调用${mismatchedToolName ? `（返回工具：${mismatchedToolName}）` : terminalStopReason ? `（终止原因：${terminalStopReason}）` : ""}`
      : "文本流式网关探测未返回文本增量"
  };
  return { ok: true };
}

function parseSseJsonFrames(raw: string): unknown[] {
  return raw.split(/\r?\n\r?\n/).flatMap((chunk) => {
    let eventType: string | undefined;
    const dataLines: string[] = [];
    for (const line of chunk.split(/\r?\n/)) {
      const normalized = line.trimStart();
      if (normalized.startsWith("event:")) eventType = normalized.slice(6).trim();
      if (normalized.startsWith("data:")) dataLines.push(normalized.slice(5).trim());
    }
    const data = dataLines.join("\n").trim();
    if (!data) return [];
    if (data === "[DONE]") return ["[DONE]" as unknown];
    try {
      const value = JSON.parse(data) as unknown;
      if (eventType && value && typeof value === "object" && !Array.isArray(value) && typeof (value as Record<string, unknown>).type !== "string") {
        return [{ type: eventType, ...(value as Record<string, unknown>) }];
      }
      return [value];
    } catch {
      return [];
    }
  });
}

function frameHasExpectedProbeResponse(
  frame: unknown,
  protocol: AgentProtocol,
  expectation: "text" | "tool"
): boolean {
  if (!frame || typeof frame !== "object" || Array.isArray(frame)) return false;
  if (hasExpectedProbeResponse(frame, protocol, expectation)) return true;
  const record = frame as Record<string, unknown>;
  return hasExpectedProbeResponse(record.response, protocol, expectation) ||
    hasExpectedProbeResponse(record.message, protocol, expectation);
}

async function probeGatewayRoute(
  gateway: GatewayRecord,
  nativeProtocol: AgentProtocol,
  model: string,
  fetchImpl: typeof globalThis.fetch,
  timeoutMs: number,
  testedAt: string,
  signal?: AbortSignal,
  onStage?: GatewayProbeStageSink,
  reasoning?: ResolvedGatewayReasoning
): Promise<GatewayTestResult> {
  const startedAt = Date.now();
  const stageResults: GatewayProbeStageResult[] = [];
  let passed: GatewayTestResult | undefined;
  let deliveryMode: GatewayTestResult["deliveryMode"] = "native-stream";
  for (const [index, definition] of GATEWAY_PROBE_STAGES.entries()) {
    throwIfProbeCancelled(signal);
    onStage?.(probeStageSnapshot(definition, "running"));
    if (deliveryMode === "buffered-json" && definition.stream) {
      const compatible = bufferedCompatibilityStage(definition);
      onStage?.(compatible);
      stageResults.push(compatible);
      continue;
    }
    const result = await probeGatewayRouteRequest(
      gateway,
      nativeProtocol,
      model,
      definition,
      fetchImpl,
      timeoutMs,
      testedAt,
      signal,
      reasoning
    );
    if (result.status !== "passed" && definition.stream) {
      deliveryMode = "buffered-json";
      const compatible = bufferedCompatibilityStage(definition, result.error);
      onStage?.(compatible);
      stageResults.push(compatible);
      continue;
    }
    for (const stage of result.stageResults ?? []) onStage?.(stage);
    stageResults.push(...(result.stageResults ?? []));
    if (result.status !== "passed") {
      const skippedStages = skippedProbeStageResults(index + 1);
      for (const stage of skippedStages) onStage?.(stage);
      const completeStages = [...stageResults, ...skippedStages];
      return { ...result, stageResults: completeStages, durationMs: Date.now() - startedAt };
    }
    passed = result;
  }
  return {
    ...passed!,
    stageResults,
    durationMs: Date.now() - startedAt,
    deliveryMode
  };
}

async function probeGatewayRouteRequest(
  gateway: GatewayRecord,
  nativeProtocol: AgentProtocol,
  model: string,
  definition: typeof GATEWAY_PROBE_STAGES[number],
  fetchImpl: typeof globalThis.fetch,
  timeoutMs: number,
  testedAt: string,
  signal?: AbortSignal,
  reasoning?: ResolvedGatewayReasoning
): Promise<GatewayTestResult> {
  throwIfProbeCancelled(signal);
  const startedAt = Date.now();
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort, { once: true });
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const normalized = normalizeIncomingRequest(
      gatewayProbeBody(nativeProtocol, model, definition.stream, definition.expectation),
      nativeProtocol
    );
    normalized.gatewayReasoning = reasoning;
    const routed = routeProtocolRequest(normalized, gateway.protocol, gateway.apiKey);
    const endpoint = `${gateway.url.replace(/\/+$/, "")}/${routed.endpointSuffix}`;
    const response = await probeFetchWithRetry(fetchImpl, endpoint, {
      method: "POST",
      headers: routed.headers,
      body: JSON.stringify(routed.body),
      redirect: "error",
      signal: controller.signal
    }, controller.signal);
    throwIfProbeCancelled(signal);
    if (!response.ok) {
      const text = redactTrace((await response.text()).slice(0, 500));
      const error = `${probeLabel(definition.expectation, definition.stream)}路由探测返回 HTTP ${response.status}${text ? `：${text}` : ""}`;
      return {
        status: "failed",
        protocol: gateway.protocol,
        model,
        testedAt,
        httpStatus: response.status,
        error,
        stageResults: [probeStageResult(definition, "failed", startedAt, { httpStatus: response.status, error })]
      };
    }
    if (definition.stream) {
      const streamResult = await validateRoutedProbeStream(
        response,
        gateway.protocol,
        nativeProtocol,
        model,
        definition.expectation
      );
      if (!streamResult.ok) return {
        status: "failed",
        protocol: gateway.protocol,
        model,
        testedAt,
        httpStatus: response.status,
        error: streamResult.error,
        stageResults: [probeStageResult(definition, "failed", startedAt, { httpStatus: response.status, error: streamResult.error })]
      };
    } else {
      const body = await response.json() as unknown;
      const providerError = protocolResponseError(body);
      if (providerError) return {
        status: "failed",
        protocol: gateway.protocol,
        model,
        testedAt,
        httpStatus: response.status,
        error: providerError,
        stageResults: [probeStageResult(definition, "failed", startedAt, { httpStatus: response.status, error: providerError })]
      };
      // Parse the upstream response through the reverse conversion as a shape
      // check. This catches malformed provider payloads while keeping the
      // provider's own model/content opaque to the public test record.
      if (!hasExpectedProbeResponse(body, gateway.protocol, definition.expectation)) {
        const error = definition.expectation === "tool"
          ? "工具调用路由探测未返回 openfars_probe 调用"
          : "文本路由探测未返回可识别的文本响应";
        return {
          status: "failed",
          protocol: gateway.protocol,
          model,
          testedAt,
          httpStatus: response.status,
          error,
          stageResults: [probeStageResult(definition, "failed", startedAt, { httpStatus: response.status, error })]
        };
      }
      const converted = convertProtocolResponse(body, gateway.protocol, nativeProtocol, model);
      if (!converted || typeof converted !== "object") {
        const error = "路由探测返回了无法转换的响应";
        return {
          status: "failed",
          protocol: gateway.protocol,
          model,
          testedAt,
          httpStatus: response.status,
          error,
          stageResults: [probeStageResult(definition, "failed", startedAt, { httpStatus: response.status, error })]
        };
      }
    }
    return {
      status: "passed",
      protocol: gateway.protocol,
      model,
      testedAt,
      httpStatus: response.status,
      stageResults: [probeStageResult(definition, "passed", startedAt, { httpStatus: response.status })]
    };
  } catch (error) {
    if (signal?.aborted) throw new GatewayProbeCancelledError();
    const message = error instanceof Error && error.name === "AbortError"
      ? `${probeLabel(definition.expectation, definition.stream)}路由探测超时（${timeoutMs}ms）`
      : error instanceof Error ? error.message : "协议路由探测失败";
    return {
      status: "failed",
      protocol: gateway.protocol,
      model,
      testedAt,
      error: redactTrace(message).slice(0, 500),
      stageResults: [probeStageResult(definition, "failed", startedAt, { error: message })]
    };
  } finally {
    signal?.removeEventListener("abort", onAbort);
    clearTimeout(timeout);
  }
}

async function validateRoutedProbeStream(
  response: Response,
  targetProtocol: AgentProtocol,
  sourceProtocol: AgentProtocol,
  model: string,
  expectation: "text" | "tool"
): Promise<{ ok: true } | { ok: false; error: string }> {
  const raw = await response.text();
  const frames = parseSseJsonFrames(raw);
  if (!frames.length) {
    try {
      const value = JSON.parse(raw) as unknown;
      const error = protocolResponseError(value);
      if (error) return { ok: false, error };
      return hasProtocolResponseShape(value, targetProtocol)
        ? { ok: false, error: `路由流式探测退化为普通 JSON 响应，未验证 ${sourceProtocol} 流式事件与终止信号（model ${model}）` }
        : { ok: false, error: "路由流式探测未返回可识别的目标协议响应" };
    } catch {
      return { ok: false, error: "路由流式探测未返回可识别的事件" };
    }
  }
  let terminal = false;
  let expectedOutput = false;
  let unnamedToolDelta = false;
  let mismatchedToolName: string | undefined;
  let terminalStopReason: string | undefined;
  for (const frame of frames) {
    if (frameHasExpectedProbeResponse(frame, targetProtocol, expectation)) expectedOutput = true;
    for (const normalized of normalizeProtocolStreamEvents(targetProtocol, frame)) {
      if (normalized.type === "error") return { ok: false, error: `路由流式探测返回错误：${redactTrace(normalized.error ?? "provider stream failed").slice(0, 500)}` };
      if (normalized.type === "completed") {
        terminal = true;
        terminalStopReason = normalized.stopReason ?? terminalStopReason;
        continue;
      }
      if (expectation === "tool" && normalized.type === "tool_call_delta") {
        if (normalized.toolName === "openfars_probe") expectedOutput = true;
        else if (!normalized.toolName) unnamedToolDelta = true;
        else mismatchedToolName = normalized.toolName;
      }
      if (expectation === "text" && normalized.type === "text_delta" && Boolean(normalized.text?.trim())) expectedOutput = true;
      try {
        convertStreamEvent(normalized, sourceProtocol, model);
      } catch (error) {
        return { ok: false, error: `路由流式事件无法转换：${redactTrace(error instanceof Error ? error.message : "转换失败").slice(0, 500)}` };
      }
    }
  }
  if (!terminal) return { ok: false, error: `${probeLabel(expectation, true)}路由探测未返回 ${targetProtocol} 的终止事件` };
  if (expectation === "tool" && !expectedOutput && unnamedToolDelta && !mismatchedToolName) expectedOutput = true;
  if (!expectedOutput) return {
    ok: false,
    error: expectation === "tool"
      ? `工具调用流式路由探测未返回 openfars_probe 调用${mismatchedToolName ? `（返回工具：${mismatchedToolName}）` : terminalStopReason ? `（终止原因：${terminalStopReason}）` : ""}`
      : "文本流式路由探测未返回文本增量"
  };
  return { ok: true };
}

function hasExpectedProbeResponse(
  value: unknown,
  protocol: AgentProtocol,
  expectation: "text" | "tool"
): boolean {
  if (!hasProtocolResponseShape(value, protocol)) return false;
  const record = value as Record<string, unknown>;
  if (expectation === "text") {
    if (protocol === "responses") {
      if (typeof record.output_text === "string" && record.output_text.trim()) return true;
      return (Array.isArray(record.output) ? record.output : []).some((item) => {
        if (!item || typeof item !== "object") return false;
        const row = item as Record<string, unknown>;
        return row.type === "message" && Boolean(probeContentText(row.content).trim());
      });
    }
    if (protocol === "chat-completions") {
      const choice = Array.isArray(record.choices) ? record.choices[0] : undefined;
      const message = choice && typeof choice === "object"
        ? (choice as Record<string, unknown>).message
        : undefined;
      return Boolean(message && typeof message === "object" && probeContentText((message as Record<string, unknown>).content).trim());
    }
    return (Array.isArray(record.content) ? record.content : []).some((item) =>
      Boolean(item && typeof item === "object" && (item as Record<string, unknown>).type === "text" &&
        typeof (item as Record<string, unknown>).text === "string" &&
        String((item as Record<string, unknown>).text).trim())
    );
  }
  if (protocol === "responses") {
    return (Array.isArray(record.output) ? record.output : []).some((item) =>
      Boolean(item && typeof item === "object" &&
        (item as Record<string, unknown>).type === "function_call" &&
        (item as Record<string, unknown>).name === "openfars_probe")
    );
  }
  if (protocol === "chat-completions") {
    const choice = Array.isArray(record.choices) ? record.choices[0] : undefined;
    const message = choice && typeof choice === "object"
      ? (choice as Record<string, unknown>).message
      : undefined;
    const calls = message && typeof message === "object" && Array.isArray((message as Record<string, unknown>).tool_calls)
      ? (message as Record<string, unknown>).tool_calls as unknown[]
      : [];
    return calls.some((call) => {
      if (!call || typeof call !== "object") return false;
      const fn = (call as Record<string, unknown>).function;
      return Boolean(fn && typeof fn === "object" && (fn as Record<string, unknown>).name === "openfars_probe");
    });
  }
  return (Array.isArray(record.content) ? record.content : []).some((item) =>
    Boolean(item && typeof item === "object" &&
      (item as Record<string, unknown>).type === "tool_use" &&
      (item as Record<string, unknown>).name === "openfars_probe")
  );
}

function probeContentText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value.flatMap((item) => {
    if (typeof item === "string") return [item];
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    if (typeof record.text === "string") return [record.text];
    if (typeof record.content === "string") return [record.content];
    return [];
  }).join("\n");
}

function hasProtocolResponseShape(value: unknown, protocol: AgentProtocol): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (protocol === "responses") return Array.isArray(record.output) || typeof record.output_text === "string";
  if (protocol === "chat-completions") return Array.isArray(record.choices);
  return Array.isArray(record.content);
}

async function probeFetchWithRetry(
  fetchImpl: typeof globalThis.fetch,
  url: string,
  init: RequestInit,
  signal: AbortSignal
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetchImpl(url, init);
      if (attempt === 0 && (response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500) && !signal.aborted) {
        await response.body?.cancel().catch(() => {});
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => {
            signal.removeEventListener("abort", onAbort);
            resolve();
          }, 100);
          const onAbort = () => {
            clearTimeout(timer);
            reject(new Error("gateway probe aborted"));
          };
          signal.addEventListener("abort", onAbort, { once: true });
        });
        continue;
      }
      if ((response.status === 400 || response.status === 422) && !signal.aborted) {
        const fallbackBody = specifiedToolChoiceFallback(url, init.body);
        if (fallbackBody && requiredToolChoiceRejected(response.status, await response.clone().text())) {
          await response.body?.cancel().catch(() => {});
          return probeFetchWithRetry(fetchImpl, url, { ...init, body: fallbackBody }, signal);
        }
      }
      return response;
    } catch (error) {
      lastError = error;
      if (signal.aborted || attempt === 1) throw error;
      await new Promise<void>((resolve, reject) => {
        const onAbort = () => {
          clearTimeout(timer);
          reject(error);
        };
        const timer = setTimeout(() => {
          signal.removeEventListener("abort", onAbort);
          resolve();
        }, 100);
        signal.addEventListener("abort", onAbort, { once: true });
      });
    }
  }
  throw lastError instanceof Error ? lastError : new Error("gateway probe failed");
}
