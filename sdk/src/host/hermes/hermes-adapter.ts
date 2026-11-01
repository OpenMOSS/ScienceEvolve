import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { AgentRunResult } from "../../core/types.js";
import type { HarnessAdapter, HarnessAdapterContext, HarnessAdapterRequest, InvocationInputs, SessionRef } from "../../core/harness-runtime/contracts.js";
import { HarnessRuntimeError } from "../../core/harness-runtime/errors.js";
import { OfficialEventBridge } from "../../core/harness-runtime/official-event-bridge.js";
import { JsonLineConnection, ResidentTurnActivityClock } from "../../core/harness-runtime/resident-native-driver.js";
import { HERMES_DESCRIPTOR as descriptor } from "./descriptor.js";
import { compileFilesystemAuthority, filesystemAuthorityPrompt, prepareFilesystemAuthorityMcp } from "../../core/harness-runtime/filesystem-authority.js";
import { DEFAULT_RAW_LOG_LIMIT_BYTES } from "../../core/harness-runtime/process-host.js";
import { AdapterBase, adapterResult, gatewayModelContextWindow, harnessExecutableLaunch,
  prepareAdapterRuntime, settleAdapterCleanup, writeAdapterLogs, type AdapterRuntimeOptions } from "../../core/harness-runtime/adapters/adapter-utils.js";
import { hermesAcpCodec, hermesOfficialEventMapper, validHermesSessionId } from "./hermes-acp.js";
import { hermesSkillPrompt, prepareHermesSettings } from "./hermes-settings.js";
import { buildHermesResidentLaunch } from "./resident-launch.js";

export class HermesAdapter extends AdapterBase implements HarnessAdapter {
  readonly resident = { protocol: "hermes-acp-json-rpc", recoveryStrategy: "native-session-resume",
    createOfficialEventMapper: hermesOfficialEventMapper,
    buildLaunch: buildHermesResidentLaunch } as const;
  constructor(options: AdapterRuntimeOptions = {}) { super(descriptor, options); }
  createSession(_request: HarnessAdapterRequest, _inputs: InvocationInputs, generation: number, durable: boolean): SessionRef {
    return this.session(`pending:${randomUUID()}`, generation, durable);
  }
  validateNativeSession(id: string): boolean { return validHermesSessionId(id) || /^pending:[a-f0-9-]{36}$/.test(id); }
  sessionToLegacyId(session: SessionRef): string { return `hermes:${session.nativeId}`; }
  sessionFromLegacyId(value: string, generation: number, durable: boolean): SessionRef | undefined {
    const id = value.startsWith("hermes:") ? value.slice(7) : "";
    return validHermesSessionId(id) ? this.session(id, generation, durable) : undefined;
  }
  async run(context: HarnessAdapterContext): Promise<AgentRunResult> {
    if ("nativeCodexProfileHome" in context.route) throw new Error("Hermes requires a gateway route");
    const executable = await this.resolveExecutable();
    if (!executable) throw new HarnessRuntimeError("HARNESS_UNAVAILABLE", "Hermes executable not found; install Hermes with ACP and configure harnesses.hermes", { harnessId: "hermes" });
    const { request, spec } = context;
    const explainer = spec.purpose === "explainer";
    const probe = spec.purpose === "probe";
    const allowNativeTools = !explainer && !probe && spec.policy.permission === "yolo";
    const runtime = await prepareAdapterRuntime(context, descriptor, this.options, {}, {
      OPENAI_API_KEY: context.route.token, OPENAI_BASE_URL: context.route.baseUrl
    });
    let prompt = spec.prompt;
    const skills = explainer ? [] : [...spec.policy.skillPaths, ...spec.policy.autoSkillPaths];
    if (!explainer && !probe && !allowNativeTools) {
      const authority = await compileFilesystemAuthority({
        role: "legacy", permission: request.permission, gitEnabled: false, serviceUserRoot: os.homedir(),
        executionWorktree: spec.inputs.workspacePath, ownedMemoryPath: spec.inputs.memoryPath,
        projectWorktreeRoot: spec.inputs.workspacePath, projectWorktrees: [spec.inputs.workspacePath],
        protectedRoots: [runtime.home, spec.inputs.runtimePath],
        inputReadRoots: [...(spec.inputs.userInputsPath ? [spec.inputs.userInputsPath] : []),
          ...await Promise.all(skills.map(async selected => (await fs.stat(selected)).isDirectory() ? selected : path.dirname(selected)))]
      });
      const mcp = await prepareFilesystemAuthorityMcp({ authority, executionRuntimePath: spec.inputs.runtimePath });
      runtime.mcpRows.push(mcp.row);
      prompt += `\n\n${filesystemAuthorityPrompt(authority, spec.inputs)}`;
    }
    if (explainer) prompt += `\n\nAnswer only from this quoted evidence; no tools are provided:\n${await fs.readFile(spec.inputs.inboxPath, "utf8")}`;
    else prompt += `\n\n${await hermesSkillPrompt(skills)}`;
    const prepared = await prepareHermesSettings({ home: runtime.home, cwd: spec.inputs.workspacePath,
      baseUrl: context.route.baseUrl, model: spec.model, contextWindow: gatewayModelContextWindow(request, spec.model),
      allowNativeTools, session: spec.session! });
    Object.assign(runtime.environment, { HERMES_HOME: runtime.home, HERMES_IGNORE_RULES: "1",
      HERMES_ACP_SKIP_CONFIGURED_MCP: "1" });
    const codec = hermesAcpCodec({ cwd: spec.inputs.workspacePath, model: spec.model,
      mcpRows: runtime.mcpRows, allowNativeTools, ...prepared });
    const bridge = new OfficialEventBridge({ descriptor, invocationId: spec.invocationId,
      mapEvent: hermesOfficialEventMapper(), onEvent: context.onEvent, onActivity: request.onModelActivity });
    const managed = context.processHost.start({ ...harnessExecutableLaunch(executable, ["acp"]),
      cwd: spec.inputs.workspacePath, env: runtime.environment, eventFormat: "json-rpc", session: spec.session!,
      adapterEnvironmentKeys: ["HERMES_HOME", "HERMES_IGNORE_RULES", "HERMES_ACP_SKIP_CONFIGURED_MCP"],
      rawLogLimitBytes: DEFAULT_RAW_LOG_LIMIT_BYTES
    }, { onStderr: chunk => context.onTrace("stderr", chunk, { harness: "hermes", diagnostic: true, diagnosticSource: "cli" }) });
    const clock = new ResidentTurnActivityClock({ modelTimeoutMs: this.options.residentModelInactivityTimeoutMs,
      toolTimeoutMs: this.options.residentToolInactivityTimeoutMs }, error => { connection.fail(error); managed.terminate(); });
    const connection = new JsonLineConnection(managed.child, frame => bridge.accept(frame), frame => {
      const observation = codec.observe(frame); if (observation) clock.observe(observation);
    }, "hermes-acp-json-rpc");
    void managed.completed.catch(error => connection.fail(error));
    let failed = false;
    const timer = setTimeout(() => { connection.fail(new Error("Hermes ACP initialization timed out")); managed.terminate(); }, 60_000);
    try {
      const session = await codec.initialize(connection, spec.session!);
      await codec.settleIdle?.(connection, session);
      connection.assertQuiescent("Hermes initialization");
      clearTimeout(timer);
      await context.onSessionStarted?.(session);
      clock.begin({ harnessId: "hermes", invocationId: spec.invocationId });
      const turn = { inputId: spec.invocationId, invocationId: spec.invocationId, prompt, route: context.route };
      const result = await codec.submit(connection, session, turn);
      clock.end();
      await connection.settleCompletionTail(codec.completionTail, session, turn);
      connection.assertQuiescent("Hermes completion");
      await bridge.finish();
      await managed.end();
      // EOF must close the native process, but must never hold a finished task forever.
      const closing = setTimeout(() => managed.terminate(), 5_000);
      try {
        const exit = await managed.completed;
        if (exit.code !== 0) throw new HarnessRuntimeError("HARNESS_PROCESS_EXITED", "Hermes exited unsuccessfully", { harnessId: "hermes", exitCode: exit.code });
      } finally { clearTimeout(closing); }
      return await adapterResult(request, session, result.handoff);
    } catch (error) { failed = true; throw error; }
    finally {
      clearTimeout(timer); clock.end();
      await settleAdapterCleanup({ harnessId: "hermes", invocationFailed: failed, onTrace: context.onTrace, steps: [
        { phase: "process-terminate", cleanup: () => { managed.terminate(); } },
        { phase: "process-wait", cleanup: async () => { await managed.completed; } },
        { phase: "write-adapter-logs", cleanup: async () => writeAdapterLogs(spec.inputs, "hermes", "", (await managed.completed).stderr) }
      ] });
    }
  }
}
