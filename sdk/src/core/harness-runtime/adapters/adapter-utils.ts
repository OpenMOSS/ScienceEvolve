import { randomUUID } from "node:crypto";
import { isExplainerMcp } from "../../internal/shared/explainer-tools.js";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  agentEnvironment,
  readControlActions,
  resolveOrchestrationControlMcpCommand,
  resolveWorkspaceMcpCommand,
  resolveSleepMcpCommand,
  type HarnessHostOptions
} from "../runtime-support.js";
import {
  PUBLISHED_ARTIFACT_MANIFEST_ENV,
  PUBLISHED_ARTIFACT_MANIFEST_FILENAME
} from "../../published-artifact-access.js";
import { fixedMcpToken, isFixedMcpServer, resolvedMcpServers } from "../../mcp-directory.js";
import { redactTrace } from "../../utils.js";
import { configuredModelContextWindow } from "../../model-context.js";
import type {
  AgentRunResult
} from "../../types.js";
import type {
  HarnessAdapterContext,
  HarnessAdapterRequest,
  HarnessDescriptor,
  InvocationInputs,
  SessionRef
} from "../contracts.js";
import { HarnessRuntimeError } from "../errors.js";
import {
  executableFingerprint,
  resolveHarnessExecutable
} from "../registry.js";
import {
  boundedUtf8Suffix,
  buildInvocationEnvironment,
  DEFAULT_RAW_LOG_LIMIT_BYTES
} from "../process-host.js";

export interface AdapterRuntimeOptions extends HarnessHostOptions {
  /** Trusted SDK host binding, never supplied by a workflow or Agent. */
  resolveProjectWorkspace?: (projectId: string) => Promise<string | undefined>;
  explainerSandboxMode?: "read-only" | "danger-full-access";
  harnessId?: string;
  harnessExecutables?: Record<string, string | undefined>;
  /** DSH JSON-RPC handshake deadline; turn execution uses an activity deadline. */
  dshHandshakeTimeoutMs?: number;
  /** Ordinary DSH Adapter turn inactivity deadline. */
  dshTurnIdleTimeoutMs?: number;
  /** Common resident model/provider inactivity deadline. */
  residentModelInactivityTimeoutMs?: number;
  /** Common resident tool inactivity deadline. */
  residentToolInactivityTimeoutMs?: number;
  /** Invocation-local protocol proxy inactivity deadline. */
  protocolProxyTimeoutMs?: number;
}

export type AdapterMcpRow = {
  name: string;
  namespace: string;
  transport: "stdio";
  command: string;
  args: string[];
  env?: Record<string, string>;
} | {
  name: string;
  namespace: string;
  transport: "streamable-http";
  url: string;
  headers?: Record<string, string>;
};

/** Resolve the selected model's gateway-owned context limit for one Adapter run. */
export function gatewayModelContextWindow(
  request: HarnessAdapterRequest,
  model: string
): number {
  const value = request.project.agents[request.agent]
    ?.gatewaySnapshot
    ?.modelContextWindows?.[model];
  return configuredModelContextWindow(value);
}

export abstract class AdapterBase {
  protected constructor(
    readonly descriptor: HarnessDescriptor,
    protected readonly options: AdapterRuntimeOptions = {}
  ) {}

  resolveExecutable(): Promise<string | undefined> {
    return resolveHarnessExecutable(
      this.descriptor,
      this.options.harnessExecutables?.[this.descriptor.id]
    );
  }

  fingerprint(executable: string): Promise<string> {
    return executableFingerprint(executable);
  }

  protected session(
    nativeId: string,
    generation: number,
    durable: boolean
  ): SessionRef {
    return {
      schemaVersion: 1,
      harnessId: this.descriptor.id,
      adapterVersion: this.descriptor.adapterVersion,
      generation,
      nativeId,
      durable,
      createdAt: new Date().toISOString()
    };
  }

  protected uuidSession(generation: number, durable: boolean): SessionRef {
    return this.session(randomUUID(), generation, durable);
  }
}

export { harnessExecutableLaunch } from "../process-host.js";

export async function prepareAdapterRuntime(
  context: HarnessAdapterContext,
  descriptor: HarnessDescriptor,
  options: AdapterRuntimeOptions,
  adapterEnvironment: NodeJS.ProcessEnv = {},
  routeEnvironment: NodeJS.ProcessEnv = {}
): Promise<{
  home: string;
  environment: NodeJS.ProcessEnv;
  mcpRows: AdapterMcpRow[];
}> {
  const { request, spec, route } = context;
  if ("nativeCodexProfileHome" in route) throw new Error("Native Codex profile routes cannot launch another Harness");
  const config = request.project.agents[request.agent];
  if (!config) {
    throw new HarnessRuntimeError(
      "HARNESS_CONTRACT_VIOLATION",
      `${descriptor.label} invocation is missing its selected Agent configuration`,
      { harnessId: descriptor.id },
      { source: "runtime" }
    );
  }
  const originalGateway = config.gatewaySnapshot;
  if (!originalGateway) {
    throw new HarnessRuntimeError(
      "HARNESS_CONFIGURATION_INVALID",
      `${descriptor.label} requires an invocation Gateway snapshot`,
      { harnessId: descriptor.id },
      { source: "adapter" }
    );
  }
  const home = path.join(
    request.projectPath,
    "runtime",
    "harness-sessions",
    safeName(request.agent),
    descriptor.id
  );
  await fs.mkdir(home, { recursive: true, mode: 0o700 });
  const explainer = spec.purpose === "explainer";
  const [workspaceMcp, controlMcp] = explainer
    ? [undefined, undefined] as const
    : await Promise.all([
        resolveWorkspaceMcpCommand(),
        request.control ? resolveOrchestrationControlMcpCommand() : Promise.resolve(undefined)
      ]);
  const configuredMcpServers = resolvedMcpServers(config.mcpServers);
  const token = !explainer && configuredMcpServers.some(isFixedMcpServer) ? fixedMcpToken() : undefined;
  if (!explainer && configuredMcpServers.some(isFixedMcpServer) && !token) {
    throw new HarnessRuntimeError(
      "HARNESS_CONFIGURATION_INVALID",
      "A selected system MCP requires its server credential",
      { harnessId: descriptor.id },
      { source: "adapter" }
    );
  }
  const routedGateway = {
    ...originalGateway,
    url: route.baseUrl,
    apiKey: route.token,
    protocol: descriptor.nativeProtocol
  };
  const common = agentEnvironment(
    home,
    spec.inputs.runtimePath,
    request.project.id,
    request.invocationId,
    request.agent,
    request.kind,
    request.permission,
    spec.inputs.projectPath,
    spec.inputs.workspacePath,
    options,
    [],
    undefined,
    token,
    request.control,
    routedGateway,
    descriptor.id,
    descriptor.nativeProtocol
  );
  delete common.CODEX_HOME;
  const environment = buildInvocationEnvironment({
    common,
    adapter: adapterEnvironment,
    route: routeEnvironment
  });
  const mcpRows: AdapterMcpRow[] = explainer ? configuredMcpServers.filter(isExplainerMcp).map(server => ({
    name: server.name, namespace: server.name, transport: "streamable-http" as const, url: server.url!
  })) : [
    await sleepMcpRow(),
    ...(spec.policy.webSearch && descriptor.route?.webSearchMcp ? [{
      name: "openfars-web",
      namespace: "openfars-web",
      transport: "streamable-http" as const,
      url: `${route.baseUrl.replace(/\/$/, "")}/web-mcp`,
      headers: { Authorization: `Bearer ${route.token}` }
    }] : []),
    ...(workspaceMcp ? [{
      name: "scienceevolve-workspace",
      namespace: "scienceevolve-workspace",
      transport: "stdio" as const,
      command: workspaceMcp.command,
      args: workspaceMcp.args,
      env: {
        SCIENCEEVOLVE_PROJECT_ID: request.project.id,
        SCIENCEEVOLVE_INVOCATION_ID: request.invocationId,
        SCIENCEEVOLVE_AGENT_NAME: request.agent,
        SCIENCEEVOLVE_APPEND_ROOT: spec.inputs.workspacePath,
        [PUBLISHED_ARTIFACT_MANIFEST_ENV]: path.join(
          spec.inputs.runtimePath,
          PUBLISHED_ARTIFACT_MANIFEST_FILENAME
        )
      }
    }] : []),
    ...(controlMcp ? [{
      name: "scienceevolve-orchestration-control",
      namespace: "scienceevolve-orchestration-control",
      transport: "stdio" as const,
      command: controlMcp.command,
      args: controlMcp.args,
      env: {
        ...(environment.SCIENCEEVOLVE_CONTROL_CONTEXT
          ? { SCIENCEEVOLVE_CONTROL_CONTEXT: environment.SCIENCEEVOLVE_CONTROL_CONTEXT }
          : {}),
        ...(environment.SCIENCEEVOLVE_CONTROL_CAPABILITY
          ? { SCIENCEEVOLVE_CONTROL_CAPABILITY: environment.SCIENCEEVOLVE_CONTROL_CAPABILITY }
          : {})
      }
    }] : []),
    ...configuredMcpServers.flatMap((server): AdapterMcpRow[] =>
      server.url !== undefined
        ? [{
            name: server.name,
            namespace: server.name,
            transport: "streamable-http",
            url: server.url,
            ...(isFixedMcpServer(server) && token
              ? { headers: { Authorization: `Bearer ${token}` } }
              : {})
          }]
        : []
    )
  ];
  return { home, environment, mcpRows };
}

/** Trusted baseline tool shared by ordinary and resident Agent launches. */
export async function sleepMcpRow(): Promise<AdapterMcpRow> {
  const command = await resolveSleepMcpCommand();
  return {
    name: "scienceevolve-sleep", namespace: "scienceevolve-sleep", transport: "stdio",
    ...command
  };
}

export async function adapterResult(
  request: HarnessAdapterRequest,
  session: SessionRef,
  handoff: string | undefined
): Promise<AgentRunResult> {
  const controlActions = request.control
    ? await readControlActions(request.control.stagingPath)
    : [];
  const normalized = stripTerminalFormatting(handoff ?? "").trim();
  if (!normalized) {
    throw new HarnessRuntimeError(
      "HARNESS_CONTRACT_VIOLATION",
      `${session.harnessId} completed without a natural-language handoff`,
      { harnessId: session.harnessId, reason: "missing-natural-language-handoff" },
      { source: "adapter" }
    );
  }
  return {
    handoff: normalized,
    threadId: session.nativeId,
    ...(controlActions.length ? { controlActions } : {})
  };
}

export async function writeAdapterLogs(
  inputs: InvocationInputs,
  harnessId: string,
  _stdout: string,
  stderr: string
): Promise<void> {
  // stdout is the official structured event transport and may contain hidden
  // reasoning blocks. Canonical events are the durable product record; do not
  // persist the transport payload a second time. stderr remains a bounded,
  // credential-redacted operational diagnostic.
  await Promise.all([
    fs.writeFile(
      path.join(inputs.runtimePath, `${harnessId}-stdout.log`),
      "Official event transport omitted; canonical Harness events are authoritative.\n",
      { encoding: "utf8", mode: 0o600 }
    ),
    fs.writeFile(
      path.join(inputs.runtimePath, `${harnessId}-stderr.log`),
      boundedUtf8Suffix(redactTrace(stderr), DEFAULT_RAW_LOG_LIMIT_BYTES),
      { encoding: "utf8", mode: 0o600 }
    )
  ]);
}

export interface AdapterCleanupStep {
  /** Stable, non-secret phase label suitable for diagnostics. */
  phase: string;
  cleanup: () => Promise<void> | void;
}

/**
 * Run every Adapter cleanup step without allowing a secondary cleanup failure
 * to replace the invocation's primary error.  Raw cleanup errors remain only
 * as an internal cause when cleanup is itself the primary failure.
 */
export async function settleAdapterCleanup(options: {
  harnessId: string;
  invocationFailed: boolean;
  onTrace: HarnessAdapterContext["onTrace"];
  steps: readonly AdapterCleanupStep[];
}): Promise<void> {
  const failures: Array<{ phase: string; error: unknown }> = [];
  for (const step of options.steps) {
    try {
      await step.cleanup();
    } catch (error) {
      failures.push({ phase: step.phase, error });
    }
  }
  if (failures.length === 0) return;
  const cleanupPhases = failures.map(({ phase }) => phase);
  if (options.invocationFailed) {
    try {
      await options.onTrace(
        "stderr",
        "Harness Adapter cleanup encountered a secondary failure",
        {
          harness: options.harnessId,
          diagnostic: true,
          diagnosticSource: "adapter",
          cleanupFailureSuppressed: true,
          cleanupPhases
        }
      );
    } catch {
      // Cleanup diagnostics are best-effort and must not replace the primary
      // invocation failure either.
    }
    return;
  }
  const first = failures[0]!.error;
  throw new HarnessRuntimeError(
    "HARNESS_CONTRACT_VIOLATION",
    `${options.harnessId} Adapter cleanup failed`,
    { harnessId: options.harnessId, cleanupPhases },
    {
      source: "adapter",
      cause: first instanceof Error ? first : undefined
    }
  );
}

export function stripTerminalFormatting(value: string): string {
  return value
    .replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, "")
    .replace(/\u200b/g, "")
    .replace(/\r/g, "");
}

export function safeName(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 120);
}
