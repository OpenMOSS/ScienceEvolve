import { promises as fs } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type {
  AgentConfig,
  AgentPermission,
  AgentRunRequest,
  ControlActionEnvelope,
  ControlMcpRequest
} from "../types.js";
import {
  inspireWorkloadLedgerPath,
  inspireWorkloadRecorderSource
} from "../inspire-workload-registry.js";
import { FIXED_MCP_TOKEN_ENV_VAR } from "../mcp-directory.js";
import { ensureLoopbackNoProxy } from "../utils.js";
import {
  PUBLISHED_ARTIFACT_MANIFEST_ENV,
  PUBLISHED_ARTIFACT_MANIFEST_FILENAME
} from "../published-artifact-access.js";

export const SAFE_AGENT_PASSTHROUGH_ENV = [
  "PATH",
  "SystemRoot", "WINDIR", "COMSPEC", "PATHEXT", "TEMP", "TMP",
  "USERPROFILE", "LOCALAPPDATA", "APPDATA",
  "LANG",
  "LC_ALL",
  "TERM",
  "TMPDIR",
  "SSL_CERT_FILE",
  "SSL_CERT_DIR",
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "ALL_PROXY",
  "NO_PROXY",
  "http_proxy",
  "https_proxy",
  "all_proxy",
  "no_proxy",
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "OPENAI_ORG_ID",
  "OPENAI_PROJECT_ID",
  "AZURE_OPENAI_API_KEY",
  "AZURE_OPENAI_ENDPOINT"
] as const;

export interface HarnessHostOptions {
  inspireBin?: string;
  inspireConfigPath?: string;
  inspireNoProxy?: string[];
  inspireWorkspaceRoot?: string;
}

/** Configuration generation and process authorization share this workspace path. */
export function natureFigureWorkspaceConfigPath(workspacePath: string): string {
  return path.join(workspacePath, ".scienceevolve", "nature-figure.json");
}

export function serializeInvocationControlContext(
  control: ControlMcpRequest,
  identity: {
    projectId: string;
    agent: AgentRunRequest["agent"];
    invocationId: string;
    kind: string;
    workspacePath: string;
  }
): string {
  return JSON.stringify({
    projectId: identity.projectId,
    agent: identity.agent,
    invocationId: identity.invocationId,
    stateVersion: control.stateVersion,
    ...(control.projectState ? { projectState: true } : {}),
    ...(control.projectStateReconciliation === false ? { projectStateReconciliation: false } : {}),
    kind: identity.kind,
    candidates: control.candidates,
    ...(control.tasklessRouteTargets
      ? { tasklessRouteTargets: control.tasklessRouteTargets }
      : {}),
    decisionBy: control.decisionBy,
    ...(control.scopedAgentRouting ? { scopedAgentRouting: true } : {}),
    ...(control.collaboration ? { collaboration: control.collaboration } : {}),
    ...(control.allowFinishRoute !== undefined ? { allowFinishRoute: control.allowFinishRoute } : {}),
    ...(control.workflowAuthoringPath ? { workflowAuthoringPath: control.workflowAuthoringPath } : {}),
    allowUserIntervention: control.allowUserIntervention,
    allowAgentOrchestrationReconfiguration:
      control.allowAgentOrchestrationReconfiguration === true,
    allowWorkflowReconfiguration: control.allowWorkflowReconfiguration === true,
    allowAgentGitActions: control.allowAgentGitActions === true,
    ...(control.terminalPushObservation ? { terminalPushObservation: control.terminalPushObservation } : {}),
    ...(control.terminalPushCoordination ? { terminalPushCoordination: control.terminalPushCoordination } : {}),
    ...(control.worktreeClosing ? { worktreeClosing: structuredClone(control.worktreeClosing) } : {}),
    canonicalFinalIntegration: control.canonicalFinalIntegration === true,
    canComplete: control.canComplete,
    ...(control.mainCapabilities ? { mainCapabilities: control.mainCapabilities } : {}),
    ...(control.capabilityHash ? { capabilityHash: control.capabilityHash } : {}),
    ...(control.expiresAt ? { expiresAt: control.expiresAt } : {}),
    stagingPath: control.stagingPath,
    workspacePath: identity.workspacePath,
    ...(control.bridgePath ? { bridgePath: control.bridgePath } : {}),
    ...(control.bridgePort !== undefined
      ? { bridgePort: control.bridgePort, bridgeHost: control.bridgeHost ?? "127.0.0.1" }
      : {}),
    ...(control.requireBridge ? { requireBridge: true } : {})
  });
}

/**
 * Stage the project-scoped Inspire command and workload recorder once, before
 * dispatching a compute invocation to any Adapter. Adapter environments all
 * prepend this directory to PATH through agentEnvironment().
 */
export async function prepareComputeRuntime(
  request: Pick<AgentRunRequest, "permission" | "workspacePath" | "runtimePath">,
  options: HarnessHostOptions
): Promise<void> {
  if (request.permission !== "compute" || !options.inspireBin) return;
  const allowedRoot = options.inspireWorkspaceRoot ?? "/inspire/qb-ilm";
  if (!pathIsWithin(request.workspacePath, allowedRoot)) {
    throw new Error(
      `Execution workspace must be under the configured Inspire qb-ilm root: ${allowedRoot}`
    );
  }
  await stageInspireWrapper(
    request.runtimePath,
    options.inspireBin,
    allowedRoot
  );
}

/** Compile the common, authority-bearing environment before Adapter filtering. */
export function agentEnvironment(
  agentHome: string,
  runtimePath: string,
  projectId: string,
  invocationId: string,
  agent: AgentRunRequest["agent"],
  kind: string,
  permission: AgentPermission,
  projectPath: string,
  workspacePath: string,
  options: HarnessHostOptions,
  providerEnvironmentKeys: string[],
  natureFigureConfigPath?: string,
  fixedToken?: string,
  control?: ControlMcpRequest,
  gatewaySnapshot?: AgentConfig["gatewaySnapshot"],
  harness = "",
  protocol = "responses",
  hostEnvironment: Readonly<NodeJS.ProcessEnv> = process.env
): NodeJS.ProcessEnv {
  const canCompute = permission === "compute";
  const environment: NodeJS.ProcessEnv = {};
  delete environment[FIXED_MCP_TOKEN_ENV_VAR];
  // Permission modes alter native filesystem/compute policy, never which
  // unrelated service credentials cross the process boundary.  Every mode
  // starts from the same explicit allowlist; provider-specific names are
  // supplied by the trusted provider configuration loader and are scrubbed
  // again when an invocation-local Gateway route is installed below.
  for (const key of [...SAFE_AGENT_PASSTHROUGH_ENV, ...providerEnvironmentKeys]) {
    if (hostEnvironment[key] !== undefined) environment[key] = hostEnvironment[key];
  }
  environment.HOME = agentHome;
  environment.SCIENCEEVOLVE_PROJECT_ID = projectId;
  environment.SCIENCEEVOLVE_INVOCATION_ID = invocationId;
  environment.SCIENCEEVOLVE_AGENT_NAME = agent;
  environment.SCIENCEEVOLVE_AGENT_KIND = kind;
  environment.SCIENCEEVOLVE_AGENT_PERMISSION = permission;
  environment.SCIENCEEVOLVE_AGENT_HARNESS = harness;
  environment.SCIENCEEVOLVE_AGENT_PROTOCOL = protocol;
  environment.SCIENCEEVOLVE_PROJECT_ROOT = projectPath;
  environment.SCIENCEEVOLVE_ROLE_WORKSPACE = workspacePath;
  environment.SCIENCEEVOLVE_APPEND_ROOT = workspacePath;
  environment[PUBLISHED_ARTIFACT_MANIFEST_ENV] = path.join(
    runtimePath,
    PUBLISHED_ARTIFACT_MANIFEST_FILENAME
  );
  if (gatewaySnapshot) {
    scrubProviderEnvironment(environment, providerEnvironmentKeys);
    environment.SCIENCEEVOLVE_GATEWAY_ID = gatewaySnapshot.id;
    environment.SCIENCEEVOLVE_GATEWAY_API_KEY = gatewaySnapshot.apiKey;
    if (protocol === "anthropic-messages") {
      environment.ANTHROPIC_BASE_URL = gatewaySnapshot.url;
      environment.ANTHROPIC_AUTH_TOKEN = gatewaySnapshot.apiKey;
      delete environment.ANTHROPIC_API_KEY;
    } else {
      environment.OPENAI_BASE_URL = gatewaySnapshot.url;
      environment.OPENAI_API_KEY = gatewaySnapshot.apiKey;
    }
    ensureLoopbackNoProxy(environment, gatewaySnapshot.url);
  }
  if (fixedToken) environment[FIXED_MCP_TOKEN_ENV_VAR] = fixedToken;
  if (control) {
    environment.SCIENCEEVOLVE_CONTROL_CONTEXT = serializeInvocationControlContext(control, {
      projectId,
      agent,
      invocationId,
      kind,
      workspacePath
    });
    environment.SCIENCEEVOLVE_CONTROL_CAPABILITY = control.capability;
  }
  if (canCompute) {
    if (natureFigureConfigPath) {
      environment.NATURE_FIGURE_CONFIG = natureFigureConfigPath;
      environment.MPLBACKEND = "Agg";
    }
    if (options.inspireConfigPath) {
      environment.INSPIRE_GLOBAL_CONFIG_PATH = options.inspireConfigPath;
    }
    environment.SCIENCEEVOLVE_INSPIRE_WORKSPACE_ROOT =
      options.inspireWorkspaceRoot ?? "/inspire/qb-ilm";
    environment.SCIENCEEVOLVE_INSPIRE_WORKLOAD_LEDGER = inspireWorkloadLedgerPath(projectPath);
    if (options.inspireBin) {
      environment.PATH = [path.join(runtimePath, "bin"), environment.PATH]
        .filter(Boolean)
        .join(path.delimiter);
    }
    const noProxy = mergeNoProxy(
      environment.NO_PROXY ?? environment.no_proxy,
      options.inspireNoProxy ?? []
    );
    if (noProxy) {
      environment.NO_PROXY = noProxy;
      environment.no_proxy = noProxy;
    }
  }
  return environment;
}

/** Resolve OpenFARS-owned MCP child entry points for source and build layouts. */
export async function resolveWorkspaceMcpCommand(): Promise<{
  command: string;
  args: string[];
}> {
  return resolveServerChild("control-mcp");
}

export async function resolveSleepMcpCommand(): Promise<{ command: string; args: string[] }> {
  return resolveServerChild("sleep-mcp");
}

export async function resolveOrchestrationControlMcpCommand(): Promise<{
  command: string;
  args: string[];
}> {
  return resolveServerChild("orchestration-control-mcp");
}

/** Stable stdio entry used by a resident Harness across many turn capabilities. */
export async function resolveResidentControlProxyCommand(): Promise<{
  command: string;
  args: string[];
}> {
  return resolveServerChild("resident-control-proxy");
}

export async function readControlActions(file: string): Promise<ControlActionEnvelope[]> {
  try {
    const parsed = JSON.parse(await fs.readFile(file, "utf8")) as unknown;
    return Array.isArray(parsed) ? parsed as ControlActionEnvelope[] : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function stageInspireWrapper(
  runtimePath: string,
  inspireBin: string,
  allowedRoot: string
): Promise<void> {
  if (process.platform === "win32") return;
  const binDirectory = path.join(runtimePath, "bin");
  await fs.mkdir(binDirectory, { recursive: true, mode: 0o700 });
  const wrapperPath = path.join(binDirectory, "inspire");
  const recorderPath = path.join(
    binDirectory,
    "scienceevolve-inspire-workload-recorder.mjs"
  );
  const quotedBinary = shellSingleQuote(inspireBin);
  const quotedAllowedRoot = shellSingleQuote(allowedRoot);
  const quotedNode = shellSingleQuote(process.execPath);
  const quotedRecorder = shellSingleQuote(recorderPath);
  const quotedOutputTemplate = shellSingleQuote(
    path.join(binDirectory, "scienceevolve-inspire-output.XXXXXX")
  );
  await fs.writeFile(recorderPath, inspireWorkloadRecorderSource(), {
    encoding: "utf8",
    mode: 0o600
  });
  await fs.chmod(recorderPath, 0o600);
  await fs.writeFile(
    wrapperPath,
    [
      "#!/bin/bash",
      "unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY all_proxy ALL_PROXY",
      `scienceevolve_inspire_allowed_root=${quotedAllowedRoot}`,
      "for scienceevolve_inspire_arg in \"$@\"; do",
      "  case \"$scienceevolve_inspire_arg\" in",
      "    *\"/inspire/hdd\"*)",
      "      echo \"ScienceEvolve blocked Inspire access to /inspire/hdd; use the corresponding path under $scienceevolve_inspire_allowed_root\" >&2",
      "      exit 64",
      "      ;;",
      "  esac",
      "done",
      'scienceevolve_inspire_action=""',
      "scienceevolve_inspire_kind_seen=0",
      'for scienceevolve_inspire_arg in "$@"; do',
      '  if [ "$scienceevolve_inspire_kind_seen" -eq 1 ]; then',
      '    scienceevolve_inspire_action="$scienceevolve_inspire_arg"',
      "    break",
      "  fi",
      '  case "$scienceevolve_inspire_arg" in',
      "    job|hpc|notebook|ray|serving) scienceevolve_inspire_kind_seen=1 ;;",
      "  esac",
      "done",
      'if [ "$scienceevolve_inspire_action" = "create" ] || [ "$scienceevolve_inspire_action" = "batch" ]; then',
      `  scienceevolve_inspire_output=$(mktemp ${quotedOutputTemplate})`,
      '  if [ -n "$scienceevolve_inspire_output" ]; then',
      `    ${quotedBinary} "$@" | tee "$scienceevolve_inspire_output"`,
      '    scienceevolve_inspire_status=${PIPESTATUS[0]}',
      '    if [ "$scienceevolve_inspire_status" -eq 0 ]; then',
      `      ${quotedNode} ${quotedRecorder} --scienceevolve-output-file "$scienceevolve_inspire_output" -- "$@" >/dev/null 2>&1 || true`,
      "    fi",
      '    rm -f -- "$scienceevolve_inspire_output"',
      '    exit "$scienceevolve_inspire_status"',
      "  fi",
      "fi",
      `${quotedBinary} "$@"`,
      "scienceevolve_inspire_status=$?",
      'if [ "$scienceevolve_inspire_status" -eq 0 ]; then',
      `  ${quotedNode} ${quotedRecorder} "$@" >/dev/null 2>&1 || true`,
      "fi",
      'exit "$scienceevolve_inspire_status"',
      ""
    ].join("\n"),
    { encoding: "utf8", mode: 0o700 }
  );
  await fs.chmod(wrapperPath, 0o700);
}

function shellSingleQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function pathIsWithin(candidate: string, root: string): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === "" || (
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function scrubProviderEnvironment(
  environment: NodeJS.ProcessEnv,
  additionalProviderKeys: readonly string[] = []
): void {
  for (const key of new Set([
    "OPENAI_API_KEY", "OPENAI_BASE_URL", "OPENAI_ORG_ID", "OPENAI_PROJECT_ID",
    "ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_BASE_URL",
    "AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT",
    "DEEPSEEK_API_KEY", "SII_API_KEY", "AIGW_API_KEY", "AIGW_BASE_URL",
    "SCIENCEEVOLVE_GATEWAY_API_KEY", "SCIENCEEVOLVE_GATEWAY_ID",
    ...additionalProviderKeys
  ])) delete environment[key];
}

function mergeNoProxy(current: string | undefined, additions: string[]): string {
  return [...new Set(
    [...(current ?? "").split(","), ...additions]
      .map((item) => item.trim())
      .filter(Boolean)
  )].join(",");
}

async function resolveServerChild(name: string): Promise<{ command: string; args: string[] }> {
  const sourceDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const compiledPath = path.join(sourceDirectory, `${name}.js`);
  try {
    await fs.access(compiledPath);
    return { command: process.execPath, args: [compiledPath] };
  } catch {
    const sourcePath = path.join(sourceDirectory, `${name}.ts`);
    await fs.access(sourcePath);
    return {
      command: process.execPath,
      // The source entrypoints use the same explicit `.js` specifiers as the
      // compiled NodeNext output. The tsx loader preserves that resolution in
      // development; Node's type-stripper alone cannot map `.js` back to `.ts`.
      // --import requires a file URL for an absolute Windows loader path.
      args: ["--import", pathToFileURL(createRequire(import.meta.url).resolve("tsx")).href, sourcePath]
    };
  }
}
