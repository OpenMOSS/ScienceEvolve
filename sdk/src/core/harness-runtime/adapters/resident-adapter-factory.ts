import { claudeNativeToolApprovals } from "./claude-native-policy.js";
import { selectedSkillInstructions } from "../selected-skills.js";
import { SLEEP_TOOL_TIMEOUT_SEC } from "../../sleep-tool-contract.js";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { codexGatewayConfigOverrides, codexIndexToolOutputConfig } from "../../codex-runner.js";
import { EXPLAINER_MCP_NAME } from "../../internal/shared/explainer-tools.js";
import { prepareCodexGatewayModelCatalog } from "../../codex-gateway-model-catalog.js";
import type {
  LaunchPlan
} from "../contracts.js";
import {
  validatePreparedFilesystemMcp,
  type FilesystemAuthority
} from "../filesystem-authority.js";
import { HarnessRuntimeError } from "../errors.js";
import {
  buildInvocationEnvironment,
  DEFAULT_RAW_LOG_LIMIT_BYTES
} from "../process-host.js";
import {
  ResidentNativeDriver,
  claudeStreamJsonCodec,
  codexAppServerCodec,
  dshSdkCodec,
  piRpcCodec
} from "../resident-native-driver.js";
import { modelFacingMcpNamespaceWildcard } from "../tool-catalog.js";
import type { AdapterMcpRow } from "./adapter-utils.js";
import { harnessExecutableLaunch, gatewayModelContextWindow, safeName, sleepMcpRow } from "./adapter-utils.js";
import { assertDshSessionArtifact, dshSelectedSkillsPatch, dshMcpPatch, dshNativeSdkPatch, dshSessionArtifactPath, resolveDshSessionArtifactPath, prepareDshSettings } from "./dsh-adapter.js";
import { piMcpConfig, readResumedPiSession } from "./pi-adapter.js";
import { CONTROL_PROXY_TIMEOUT_MS } from "../../control-request-lifetime.js";
import type {
  ResidentAdapterLaunchEvidence,
  ResidentAdapterLaunchRequest,
  ResidentAdapterLaunchDefinition
} from "../resident-lease.js";
import { residentScopeId } from "../resident-lease.js";
import { validateStagedInvocationInputs } from "../invocation-inputs.js";
import { installWindowsCodexPatch } from "../windows-codex-patch.js";

export type { ResidentAdapterLaunchRequest, ResidentAdapterLaunchDefinition } from "../resident-lease.js";

export interface OpenedResidentAdapter {
  driver: ResidentNativeDriver;
  evidence: ResidentAdapterLaunchEvidence;
  unstartedReservation?: true;
}

/** Trusted launch boundary shared by all built-in resident Adapters. */
export async function openBuiltinResidentAdapter(
  input: ResidentAdapterLaunchRequest
): Promise<OpenedResidentAdapter> {
  const resident = input.adapter.resident;
  if (!resident) throw launchError("Selected Harness does not declare a resident protocol");
  await assertResidentLaunchAuthority(input);
  await fs.mkdir(input.executionRuntimePath, { recursive: true, mode: 0o700 });
  const built = await buildLaunch(input);
  const managed = await input.processHost.startResident(
    input.processBinding,
    built.plan,
    {
      onStderr: (chunk) => input.onTrace("stderr", chunk, {
        harness: input.adapter.descriptor.id,
        diagnostic: true,
        diagnosticSource: "cli",
        resident: true
      })
    }
  );
  try {
    if (input.adapter.descriptor.id === "codex" && !("nativeCodexProfileHome" in input.launchRoute)) {
      await installWindowsCodexPatch(residentHarnessHome(input, "codex-home"),
        input.executable, input.executionRuntimePath);
    }
    const driver = await ResidentNativeDriver.open({
      child: managed.child,
      session: input.session,
      processSignal: input.processBinding.signal,
      codec: built.codec,
      turnAuthority: input.turnAuthority,
      ownershipEpoch: input.request.executionContext?.role === "leader"
        ? input.request.executionContext.coordinatorEpoch
        : input.request.executionContext?.ownershipEpoch ?? -1,
      processCompletion: managed.completed,
      onFrame: input.onFrame,
      onTrace: input.onTrace,
      inactivityPolicy: input.inactivityPolicy
    });
    return {
      driver,
      ...(built.unstartedReservation ? { unstartedReservation: true as const } : {}),
      evidence: {
        harnessId: input.adapter.descriptor.id,
        protocol: resident.protocol,
        recoveryStrategy: built.codec.recoveryStrategy,
        command: built.plan.command,
        args: Object.freeze([...built.plan.args]),
        cwd: built.plan.cwd,
        rawTools: input.filesystemAuthority.rawTools
      }
    };
  } catch (error) {
    managed.terminate();
    await managed.waitForQuiescence();
    await managed.completed.catch(() => undefined);
    throw error;
  }
}

async function buildLaunch(input: ResidentAdapterLaunchRequest): Promise<ResidentAdapterLaunchDefinition> {
  const harnessId = input.adapter.descriptor.id;
  if (harnessId === "codex") return buildCodexLaunch(input);
  if ("nativeCodexProfileHome" in input.launchRoute) throw launchError("Native Codex profile cannot launch another Harness");
  if (harnessId === "claude-code") return buildClaudeLaunch(input);
  if (harnessId === "pi") return buildPiLaunch(input);
  if (harnessId === "dsh") return buildDshLaunch(input);
  if (input.adapter.resident?.buildLaunch) return input.adapter.resident.buildLaunch(input);
  throw launchError(`No trusted resident launch mapping exists for ${harnessId}`);
}

async function buildCodexLaunch(input: ResidentAdapterLaunchRequest) {
  const { request, spec } = input;
  const config = request.project.agents[request.agent];
  const native = "nativeCodexProfileHome" in input.launchRoute ? input.launchRoute : undefined;
  if (!config?.gatewaySnapshot && !native) throw launchError("Codex resident launch has no model route");
  const home = native?.nativeCodexProfileHome ?? residentHarnessHome(input, "codex-home");
  if (!native) await fs.mkdir(home, { recursive: true, mode: 0o700 });
  const routedGateway = native ? undefined : {
    ...config!.gatewaySnapshot!,
    url: gatewayLaunchRoute(input).baseUrl,
    apiKey: gatewayLaunchRoute(input).token,
    protocol: "responses" as const,
    nativeProtocol: "responses" as const,
    routeMode: "direct" as const
  };
  const yolo = request.permission === "yolo";
  const gatewayModelCatalog = native ? undefined : await prepareCodexGatewayModelCatalog(
    input.executable, spec.model, input.executionRuntimePath
  );
  const args = [
    // app-server has no ignore-user-config flag. Native login homes can carry
    // older, harmless config fields; keep explicit route/capability overrides
    // without turning those legacy preferences into a launch failure.
    ...(!native ? ["--strict-config"] : []),
    "--disable", "skill_search",
    "--enable", "skip_host_skill_discovery",
    "-a", "never",
    "-s", "danger-full-access",
    "-C", spec.inputs.workspacePath,
    ...(routedGateway ? codexGatewayConfigOverrides(routedGateway, undefined, spec.model).flatMap((value) => ["-c", value])
      : ["-c", 'model_provider="openai"']),
    ...(gatewayModelCatalog ? ["-c", `model_catalog_json=${JSON.stringify(gatewayModelCatalog)}`] : []),
    "-c", "skills.bundled.enabled=false",
    "-c", "skills.include_instructions=false",
    "-c", codexSkillConfig([...spec.policy.skillPaths, ...spec.policy.autoSkillPaths]),
    "-c", codexMcpConfig(await residentMcpRows(input), input.spec.policy.mcpServers, input.fixedMcpToken, {
      siiUrl: input.request.siiMcp?.url,
      ...(spec.policy.webSearch && !native ? { webSearch: {
        url: `${gatewayLaunchRoute(input).baseUrl.replace(/\/$/, "")}/web-mcp`, token: gatewayLaunchRoute(input).token
      } } : {}),
      yolo
    }),
    ...(spec.policy.webSearch ? ["--search"] : []),
    "-m", spec.model,
    "app-server", "--listen", "stdio://"
  ];
  const launch = harnessExecutableLaunch(input.executable, args);
  const environment = residentEnvironment(input, {
    HOME: input.filesystemAuthority.serviceUserRoot,
    CODEX_HOME: home
  });
  return {
    plan: launchPlan(input, launch.command, launch.args, environment, []),
    codec: codexAppServerCodec({
      cwd: spec.inputs.workspacePath,
      model: spec.model,
      modelProvider: native ? "openai" : "openfars_gateway",
      sandbox: "danger-full-access"
    })
  };
}

async function buildClaudeLaunch(input: ResidentAdapterLaunchRequest) {
  const { request, spec, session } = input;
  const home = residentHarnessHome(input, "claude-home");
  await fs.mkdir(home, { recursive: true, mode: 0o700 });
  const mcpPath = path.join(input.executionRuntimePath, "claude-resident-mcp.json");
  const rows = await residentMcpRows(input);
  await fs.writeFile(mcpPath, `${JSON.stringify(claudeMcpConfig(rows), null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600
  });
  const args = [
    "--print",
    "--verbose",
    "--input-format", "stream-json",
    "--output-format", "stream-json",
    "--replay-user-messages",
    "--include-partial-messages",
    "--bare",
    "--disable-slash-commands",
    "--setting-sources", "",
    "--append-system-prompt", selectedSkillInstructions([...spec.policy.skillPaths, ...spec.policy.autoSkillPaths]),
    "--tools", "default",
    "--allowedTools", ...claudeNativeToolApprovals(rows.map(row => row.namespace)),
    "--strict-mcp-config",
    "--mcp-config", mcpPath,
    "--permission-mode", "dontAsk",
    "--model", spec.model,
    ...(session.resumedAt
      ? ["--resume", session.nativeId]
      : ["--session-id", session.nativeId])
  ];
  const launch = harnessExecutableLaunch(input.executable, args);
  const environment = residentEnvironment(input, {
    HOME: input.filesystemAuthority.serviceUserRoot,
    CLAUDE_CONFIG_DIR: home,
    ANTHROPIC_MODEL: spec.model,
    ANTHROPIC_SMALL_FAST_MODEL: spec.model,
    CLAUDE_CODE_AUTO_COMPACT_WINDOW: String(
      Math.max(1, Math.floor(gatewayModelContextWindow(request, spec.model) * 0.8))
    ),
    CLAUDE_CODE_MAX_CONTEXT_TOKENS: String(gatewayModelContextWindow(request, spec.model))
  });
  return {
    plan: launchPlan(input, launch.command, launch.args, environment, [
      "CLAUDE_CONFIG_DIR", "ANTHROPIC_MODEL", "ANTHROPIC_SMALL_FAST_MODEL",
      "CLAUDE_CODE_AUTO_COMPACT_WINDOW", "CLAUDE_CODE_MAX_CONTEXT_TOKENS"
    ]),
    codec: claudeStreamJsonCodec()
  };
}

async function buildPiLaunch(input: ResidentAdapterLaunchRequest) {
  const { request, spec, session } = input;
  const home = residentHarnessHome(input, "pi-home");
  const sessionRoot = path.join(request.projectPath, "runtime", "harness-sessions", safeName(request.agent), "pi", "sessions");
  let resumedIdentity: Awaited<ReturnType<typeof readResumedPiSession>> | undefined;
  let unstartedReservation = false;
  if (session.durable) {
    if (path.dirname(session.nativeId) !== sessionRoot) throw launchError("Pi resident session is outside its Agent session root");
    if (session.resumedAt) {
      try {
        resumedIdentity = await readResumedPiSession("pi", session.nativeId, sessionRoot, spec.inputs.workspacePath);
      } catch (error) {
        const grant = input.unstartedSession;
        const context = request.executionContext;
        const epoch = context?.role === "leader" ? context.coordinatorEpoch : context?.ownershipEpoch;
        const keys = ["schemaVersion", "harnessId", "adapterVersion", "generation", "nativeId", "durable", "createdAt"] as const;
        if (!missingPiArtifact(error) || !grant || !context || typeof grant.revalidate !== "function" ||
          grant.projectId !== request.project.id || grant.scopeId !== residentScopeId(context) ||
          grant.role !== context.role || grant.workspacePath !== spec.inputs.workspacePath ||
          grant.stoppedEpoch !== (input.sameEpochReopen ? epoch : (epoch ?? 0) - 1) ||
          !keys.every(key => grant.session?.[key] === session[key])) throw error;
        input.signal.throwIfAborted();
        await grant.revalidate();
        input.signal.throwIfAborted();
        // Recheck after asynchronous stop proof: a newly present artifact must
        // satisfy the normal history/cwd/official-ID contract before launch.
        try {
          resumedIdentity = await readResumedPiSession("pi", session.nativeId, sessionRoot, spec.inputs.workspacePath);
        } catch (freshError) {
          if (!missingPiArtifact(freshError)) throw freshError;
          await fs.mkdir(sessionRoot, { recursive: true, mode: 0o700 });
          unstartedReservation = true;
          await input.onTrace("status", "Pi reserved Session initialized before its first input", {
            harness: "pi", sessionGeneration: session.generation, unstartedReservation: true
          });
        }
      }
    } else {
      await fs.mkdir(sessionRoot, { recursive: true, mode: 0o700 });
    }
  }
  await preparePiHome(home, gatewayLaunchRoute(input).baseUrl, spec.model,
    gatewayModelContextWindow(request, spec.model));
  const extension = await resolvePiResidentExtension();
  const yolo = request.permission === "yolo";
  const args = [
    "--provider", "openfars",
    "--model", spec.model,
    "--mode", "rpc",
    ...(session.durable ? ["--session", session.nativeId] : ["--no-session"]),
    "--no-extensions",
    "--extension", extension,
    "--no-prompt-templates",
    "--no-context-files",
    "--no-skills",
    ...[...new Set([...spec.policy.skillPaths, ...spec.policy.autoSkillPaths])]
      .flatMap((skill) => ["--skill", skill])
  ];
  const launch = harnessExecutableLaunch(input.executable, args);
  const environment = residentEnvironment(input, {
    HOME: input.filesystemAuthority.serviceUserRoot,
    PI_CODING_AGENT_DIR: home,
    PI_CODING_AGENT_SESSION_DIR: sessionRoot,
    PI_TELEMETRY: "0",
    PI_OFFLINE: "1",
    SCIENCEEVOLVE_PI_MCP_CONFIG: JSON.stringify(
      piMcpConfig(await residentMcpRows(input), input.fixedMcpToken, gatewayLaunchRoute(input).token)
    )
  });
  return {
    ...(unstartedReservation ? { unstartedReservation: true as const } : {}),
    plan: launchPlan(input, launch.command, launch.args, environment, [
      "PI_CODING_AGENT_DIR", "PI_CODING_AGENT_SESSION_DIR", "PI_TELEMETRY",
      "PI_OFFLINE", "SCIENCEEVOLVE_PI_MCP_CONFIG"
    ]),
    codec: piRpcCodec({ expectedSessionPath: session.nativeId,
      expectedSessionId: resumedIdentity?.id })
  };
}

function missingPiArtifact(error: unknown): boolean {
  return error instanceof HarnessRuntimeError && error.code === "SESSION_RESUME_FAILED" &&
    (error.cause as NodeJS.ErrnoException | undefined)?.code === "ENOENT";
}

async function buildDshLaunch(input: ResidentAdapterLaunchRequest) {
  const { request, spec } = input;
  const home = residentHarnessHome(input, "dsh-home");
  await fs.mkdir(home, { recursive: true, mode: 0o700 });
  await prepareDshHome(home, gatewayLaunchRoute(input).baseUrl, spec.model,
    gatewayModelContextWindow(request, spec.model));
  const nativeSessionResume = input.adapter.resident?.recoveryStrategy === "native-session-resume";
  if (nativeSessionResume && input.session.resumedAt) {
    await assertDshSessionArtifact({ artifactPath: await resolveDshSessionArtifactPath(dshSessionArtifactPath(home, spec.inputs.workspacePath, input.session.nativeId)),
      sessionRoot: path.join(home, "sessions"), expectedSessionId: input.session.nativeId,
      expectedWorkspacePath: spec.inputs.workspacePath });
  }
  const yolo = request.permission === "yolo";
  const rows = await residentMcpRows(input);
  const patchPath = path.join(input.executionRuntimePath, "dsh-resident.patch.yml");
  {
    const disabled = "";
    const inserted = dshSelectedSkillsPatch([...spec.policy.skillPaths, ...spec.policy.autoSkillPaths]) + dshMcpPatch([...rows], false);
    const resumePlugin = nativeSessionResume
      ? dshNativeSdkPatch(input.executable, input.session.nativeId) : "";
    await fs.writeFile(patchPath, `${disabled}\n${inserted}\n${resumePlugin}\n`, { encoding: "utf8", mode: 0o600 });
  }
  const args = [
    "--profile", "sdk",
    "--patch", path.join(home, "gateway.patch.yml"), "--patch", patchPath
  ];
  const launch = harnessExecutableLaunch(input.executable, args);
  const environment = residentEnvironment(input, {
    HOME: input.filesystemAuthority.serviceUserRoot,
    DSH_HOME: home,
    DSH_PERMISSION_MODE: "danger-full-access",
    DSH_TELEMETRY_DISABLED: "1"
  });
  return {
    plan: launchPlan(input, launch.command, launch.args, environment, [
      "DSH_HOME", "DSH_PERMISSION_MODE", "DSH_TELEMETRY_DISABLED"
    ]),
    codec: dshSdkCodec({
      cwd: spec.inputs.workspacePath,
      provider: "openfars",
      model: spec.model,
      expectedSessionId: input.session.nativeId,
      recoverySourceSessionId: nativeSessionResume ? undefined : dshRecoverySourceSessionId(input),
      nativeSessionResume
    })
  };
}

function residentHarnessHome(input: ResidentAdapterLaunchRequest, directory: string): string {
  return usesFixedAgentWorkspace(input)
    ? path.join(input.spec.inputs.projectPath, "runtime", "harness-agents", safeName(input.request.agent), directory)
    : path.join(input.executionRuntimePath, directory);
}

function usesFixedAgentWorkspace(input: ResidentAdapterLaunchRequest): boolean {
  return input.spec.inputs.workspacePath === path.join(input.spec.inputs.projectPath, "git-worktrees", "agents", input.request.agent);
}

function gatewayLaunchRoute(input: ResidentAdapterLaunchRequest): { baseUrl: string; token: string } {
  if ("nativeCodexProfileHome" in input.launchRoute) throw launchError("Gateway route required for this resident feature");
  return input.launchRoute;
}

export function residentEnvironment(
  input: ResidentAdapterLaunchRequest,
  adapter: NodeJS.ProcessEnv
): NodeJS.ProcessEnv {
  const gateway = "nativeCodexProfileHome" in input.launchRoute ? undefined : input.launchRoute;
  const route = !gateway ? {} : input.adapter.descriptor.nativeProtocol === "anthropic-messages"
    ? {
        SCIENCEEVOLVE_GATEWAY_API_KEY: gateway.token,
        ANTHROPIC_BASE_URL: gateway.baseUrl.replace(/\/v1\/?$/, ""),
        ANTHROPIC_AUTH_TOKEN: gateway.token
      }
    : {
        SCIENCEEVOLVE_GATEWAY_API_KEY: gateway.token,
        OPENAI_BASE_URL: gateway.baseUrl,
        OPENAI_API_KEY: gateway.token
      };
  return buildInvocationEnvironment({
    common: { ...(input.processBinding.commonEnvironment ?? {}) },
    adapter,
    route
  });
}

export function launchPlan(
  input: ResidentAdapterLaunchRequest,
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  adapterEnvironmentKeys: readonly string[]
): LaunchPlan {
  return {
    command,
    args,
    cwd: input.spec.inputs.workspacePath,
    env,
    eventFormat: input.adapter.resident?.protocol.includes("json-rpc") ||
      input.adapter.resident?.protocol === "codex-app-server"
      ? "json-rpc"
      : "stream-json",
    session: input.session,
    rawLogLimitBytes: DEFAULT_RAW_LOG_LIMIT_BYTES,
    recoveryEvidence: { kind: "resident-open" },
    adapterEnvironmentKeys
  };
}

async function assertResidentLaunchAuthority(input: ResidentAdapterLaunchRequest): Promise<void> {
  const context = input.request.executionContext;
  if (!context) throw launchError("Resident launch requires a collaboration scope");
  if (input.processBinding.scopeId !== residentScopeId(context) ||
    input.processBinding.role !== context.role) {
    throw launchError("Resident ProcessHost binding does not match collaboration scope");
  }
  const isLeader = context.role === "leader";
  if (isLeader) {
    const fixedManagement = input.spec.inputs.workspacePath ===
      path.join(input.spec.inputs.projectPath, "git-worktrees", "agents", input.request.agent);
    if (fixedManagement) {
      await validateStagedInvocationInputs({ ...input.spec.inputs,
        projectId: input.request.project.id, invocationId: input.spec.invocationId,
        fixedAgentId: input.request.agent });
    } else if (!isWithin(input.spec.inputs.workspacePath, input.executionRuntimePath) ||
      input.spec.inputs.workspacePath === input.executionRuntimePath) {
      throw launchError("Leader resident requires a management-only staged workspace");
    }
    const proposalRoot = fixedManagement && input.spec.inputs.workflowAuthoringPath
      ? path.dirname(input.spec.inputs.workflowAuthoringPath) : undefined;
    const expectedWrites = proposalRoot ? [proposalRoot] : [];
    if (JSON.stringify(input.filesystemAuthority.writeRoots) !== JSON.stringify(expectedWrites) ||
      input.filesystemAuthority.gitCapability !== "none") {
      throw launchError("Leader resident cannot receive delivery write or Git authority");
    }
  } else if (context.executionWorktree !== input.spec.inputs.workspacePath) {
    throw launchError("Resident launch workspace does not match execution ownership");
  }
  if (!input.adapter.resident) throw launchError("Harness has no resident capability");
  if (!input.session.durable) {
    throw launchError("Resident collaboration requires a durable native SessionRef");
  }
  if (input.filesystemAuthority.gitCapability !== "none" && !input.filesystemMcp) {
    throw launchError("Resident Git capability requires an invocation-bound platform Git MCP");
  }
  if (input.mcpRows.some((row) =>
    row.namespace === "openfars-filesystem-authority" || row.namespace === "openfars-git" ||
    row.namespace === "openfars-resident-control")) {
    throw launchError("Reserved resident MCP namespaces require trusted bindings");
  }
  if (input.request.permission !== "yolo") {
    const configured = new Map(input.spec.policy.mcpServers.map((server) => [
      server.name,
      server.url
    ]));
    const unconfigured = input.mcpRows.filter((row) =>
      row.transport !== "streamable-http" ||
      row.namespace !== row.name ||
      configured.get(row.name) !== row.url
    );
    if (unconfigured.length > 0) {
      throw launchError(
        "Non-yolo resident MCP rows must match explicit Agent configuration"
      );
    }
  }
  if (input.filesystemMcp) {
    await validatePreparedFilesystemMcp(
      input.filesystemMcp,
      input.filesystemAuthority,
      input.executionRuntimePath
    );
  }
  if (input.request.control) {
    if (!input.controlMcp || input.controlMcp.turnAuthority !== input.turnAuthority ||
      input.controlMcp.row.name !== "openfars-resident-control" ||
      input.controlMcp.row.namespace !== "openfars-resident-control" ||
      input.controlMcp.row.transport !== "stdio") {
      throw launchError("Resident control requires a trusted turn-rotating stable control broker");
    }
    await input.controlMcp.assertReady();
  } else if (input.controlMcp) {
    throw launchError("Resident control binding was supplied without control authority");
  }
  if (JSON.stringify(input.processBinding.route) !== JSON.stringify(input.launchRoute) ||
    input.processBinding.workspacePath !== input.spec.inputs.workspacePath ||
    input.processBinding.session().nativeId !== input.session.nativeId) {
    throw launchError("Resident ProcessHost binding does not match launch authority");
  }
  const authority = input.processBinding.authorityEnvironment;
  if (authority.SCIENCEEVOLVE_RESIDENT_SCOPE_ID !== residentScopeId(context) ||
    authority.SCIENCEEVOLVE_RESIDENT_ROLE !== context.role) {
    throw launchError("Resident ProcessHost omitted stable scope identity");
  }
  if (isLeader) {
    if (authority.SCIENCEEVOLVE_COORDINATOR_EPOCH !== String(context.coordinatorEpoch) ||
      authority.SCIENCEEVOLVE_EXECUTION_ID !== undefined ||
      authority.SCIENCEEVOLVE_OWNERSHIP_EPOCH !== undefined) {
      throw launchError("Leader resident omitted coordinator epoch fencing");
    }
  } else if (authority.SCIENCEEVOLVE_EXECUTION_ID !== context.executionId ||
    authority.SCIENCEEVOLVE_OWNERSHIP_EPOCH !== String(context.ownershipEpoch) ||
    authority.SCIENCEEVOLVE_COORDINATOR_EPOCH !== undefined) {
    throw launchError("Resident ProcessHost omitted execution epoch fencing");
  }
  if (input.signal !== input.processBinding.signal) {
    throw launchError("Resident ProcessHost signal does not match execution lifetime");
  }
}

export async function residentMcpRows(input: ResidentAdapterLaunchRequest): Promise<readonly AdapterMcpRow[]> {
  return [
    await sleepMcpRow(),
    ...input.mcpRows,
    ...(input.spec.policy.webSearch && input.adapter.descriptor.route?.webSearchMcp && !("nativeCodexProfileHome" in input.launchRoute)
      ? [{
          name: "openfars-web",
          namespace: "openfars-web",
          transport: "streamable-http" as const,
          url: `${gatewayLaunchRoute(input).baseUrl.replace(/\/$/, "")}/web-mcp`,
          headers: { Authorization: `Bearer ${gatewayLaunchRoute(input).token}` }
        }]
      : []),
    ...(input.filesystemMcp ? [input.filesystemMcp.row] : []),
    ...(input.controlMcp ? [input.controlMcp.row] : [])
  ];
}

function dshRecoverySourceSessionId(input: ResidentAdapterLaunchRequest): string | undefined {
  if (input.adapter.descriptor.id !== "dsh" || !input.session.resumedAt) return undefined;
  const sourceNativeId = input.recoverySourceSessionId ??
    input.request.project.agentSessions?.[input.request.agent]?.nativeId;
  if (!sourceNativeId) {
    throw launchError("DSH durable rehydrate requires the committed source SessionRef");
  }
  if (sourceNativeId === input.session.nativeId) {
    throw launchError("DSH durable rehydrate must allocate a new native session identity");
  }
  return sourceNativeId;
}

function isWithin(candidate: string, root: string): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === "" || (!path.isAbsolute(relative) && relative !== ".." &&
    !relative.startsWith(`..${path.sep}`));
}

function codexMcpConfig(
  rows: readonly AdapterMcpRow[],
  selected: ReadonlyArray<{ name: string; url: string }>,
  fixedToken: string | undefined,
  authorization: { siiUrl?: string; webSearch?: { url: string; token: string }; yolo: boolean }
): string {
  const entries = rows.map((row) => {
    // Agent capability selection is the authorization for these MCP tools.
    // Codex's noninteractive policy cannot ask again for tool annotations that
    // default to potentially destructive. Unselected rows retain native defaults.
    const webSearch = row.name === "openfars-web" && row.namespace === "openfars-web" &&
      row.transport === "streamable-http" && row.url === authorization.webSearch?.url &&
      Object.keys(row.headers ?? {}).length === 1 &&
      row.headers?.Authorization === `Bearer ${authorization.webSearch?.token}`;
    const approved = row.namespace === "openfars-filesystem-authority" || row.namespace === "openfars-git" ||
      row.namespace === "openfars-resident-control" || webSearch ||
      row.namespace === "scienceevolve-sleep" ||
      row.name === "scienceevolve-sii" && row.transport === "streamable-http" && row.url === authorization.siiUrl ||
      authorization.yolo && row.name !== "scienceevolve-sii" ||
      row.transport === "streamable-http" && row.namespace === row.name &&
      row.name !== "scienceevolve-sii" &&
      selected.some(server => server.name === row.name && server.url === row.url);
    const approval = approved
      ? ", default_tools_approval_mode = \"approve\""
      : "";
    const indexOutput = codexIndexToolOutputConfig(row.namespace === "openfars-filesystem-authority" ? ["read_file"]
      : row.namespace === "openfars-resident-control" ? ["state_list"] : row.namespace === EXPLAINER_MCP_NAME ? ["get_context"] : []);
    if (row.transport === "stdio") {
      const sleepTimeout = row.namespace === "scienceevolve-sleep"
        ? `, tool_timeout_sec = ${SLEEP_TOOL_TIMEOUT_SEC}` : "";
      const args = row.args.map((value) => JSON.stringify(value)).join(", ");
      const env = Object.entries(row.env ?? {})
        .map(([key, value]) => `${JSON.stringify(key)} = ${JSON.stringify(value)}`)
        .join(", ");
      const controlBudget = row.namespace === "openfars-resident-control" ? `, tool_timeout_sec = ${Math.ceil(CONTROL_PROXY_TIMEOUT_MS / 1_000) + 10}` : "";
      return `${JSON.stringify(row.name)} = { command = ${JSON.stringify(row.command)}, args = [${args}], env = { ${env} }${sleepTimeout}${approval}${indexOutput}${controlBudget} }`;
    }
    if (!row.headers) {
      return `${JSON.stringify(row.name)} = { url = ${JSON.stringify(row.url)}${approval}${indexOutput} }`;
    }
    if (webSearch) {
      return `${JSON.stringify(row.name)} = { url = ${JSON.stringify(row.url)}, bearer_token_env_var = "SCIENCEEVOLVE_GATEWAY_API_KEY"${approval} }`;
    }
    const headers = Object.entries(row.headers);
    if (!fixedToken || headers.length !== 1 || headers[0]?.[0] !== "Authorization" ||
      headers[0]?.[1] !== `Bearer ${fixedToken}`) {
      throw launchError("Codex resident MCP cannot safely express an unowned HTTP credential");
    }
    return `${JSON.stringify(row.name)} = { url = ${JSON.stringify(row.url)}, bearer_token_env_var = "SCIENCEEVOLVE_FIXED_MCP_TOKEN"${approval}${indexOutput} }`;
  });
  return `mcp_servers={${entries.join(", ")}}`;
}

function codexSkillConfig(paths: readonly string[]): string {
  const entries = [...new Set(paths)].map((skillPath) =>
    `{ path = ${JSON.stringify(skillPath)}, enabled = true }`
  );
  return `skills.config=[${entries.join(",")}]`;
}

function claudeMcpConfig(rows: readonly AdapterMcpRow[]): Record<string, unknown> {
  return {
    mcpServers: Object.fromEntries(rows.map((row) => [row.name,
      row.transport === "stdio"
        ? { type: "stdio", command: row.command, args: row.args, ...(row.env ? { env: row.env } : {}) }
        : { type: "http", url: row.url, ...(row.headers ? { headers: row.headers } : {}) }
    ]))
  };
}

async function preparePiHome(
  home: string,
  baseUrl: string,
  model: string,
  contextWindow: number
): Promise<void> {
  await fs.mkdir(path.join(home, "sessions"), { recursive: true, mode: 0o700 });
  const document = {
    providers: {
      openfars: {
        baseUrl,
        api: "openai-completions",
        apiKey: "SCIENCEEVOLVE_GATEWAY_API_KEY",
        authHeader: true,
        compat: {
          supportsStore: false,
          supportsDeveloperRole: false,
          supportsReasoningEffort: false,
          supportsUsageInStreaming: false,
          supportsStrictMode: false,
          maxTokensField: "max_tokens"
        },
        models: [{
          id: model, name: model, reasoning: true, input: ["text"], contextWindow,
          maxTokens: Math.min(32_000, contextWindow),
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }
        }]
      }
    }
  };
  await fs.writeFile(path.join(home, "models.json"), `${JSON.stringify(document, null, 2)}\n`, {
    encoding: "utf8", mode: 0o600
  });
  await fs.writeFile(path.join(home, "auth.json"), "{}\n", { encoding: "utf8", mode: 0o600 });
}

async function resolvePiResidentExtension(): Promise<string> {
  const directory = path.dirname(fileURLToPath(import.meta.url));
  for (const filename of ["pi-mcp-extension.js", "pi-mcp-extension.ts"]) {
    const candidate = path.join(directory, filename);
    try { await fs.access(candidate); return candidate; } catch { /* continue */ }
  }
  throw launchError("OpenFARS Pi MCP extension is missing");
}

async function prepareDshHome(
  home: string,
  baseUrl: string,
  model: string,
  contextWindow: number
): Promise<void> {
  await prepareDshSettings(home, baseUrl, model, contextWindow);
}

const DSH_DISABLED_TOOLS = [
  "tool-bash", "tool-pwsh", "tool-jobs", "tool-fs", "tool-str-replace-editor",
  "tool-subagent-control", "tool-subagent-list-agents", "tool-subagent", "tool-subagent-fork",
  "tool-workflow", "tool-ralph", "tool-web"
] as const;

function launchError(message: string): HarnessRuntimeError {
  return new HarnessRuntimeError(
    "HARNESS_CONTRACT_VIOLATION",
    message,
    {},
    { source: "adapter" }
  );
}
