import path from "node:path";
import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { bundledHarnessInvocation } from "./host/bundled-harness.js";
import { createMainApplicationRuntime, type MainApplicationRuntime } from "./main-runtime.js";
import { validateMainWorkflowConfig, type MainWorkflowConfig } from "./main-config.js";
import { mainRedactor, type MainRedactor } from "./main-redaction.js";
import { gitCredentialHelperResolver } from "./core/collaboration-git/index.js";
import { harnessCatalogRegistry, resolveHarnessExecutable } from "./core/harness-runtime/registry.js";
import type { PublicHarnessDescriptor } from "./core/harness-runtime/contracts.js";
import type { AgentHarness, GatewayInput, PublicGatewayRecord, GatewayTestResult, GatewayProbeStageResult } from "./core/agent-runtime.js";
import type { ProjectView, TimelineEvent } from "./core/types.js";
import { validateMainResearchSdkOptions, validateMainGatewayBindings, type MainGatewayBindings, type MainResearchSdkOptions } from "./main-options.js";
import { exportMainWorkspace, type MainWorkspaceExportOptions, type MainWorkspaceExportResult } from "./main-workspace.js";
import type { MainSourceWorkspaceOptions } from "./main-source-workspace.js";
import type { MainWorkspaceDelivery } from "./main-git-workspace.js";
import { readMainHarnessGateway, type MainHarnessGatewayImportOptions } from "./main-harness-gateway.js";
import { prepareMainProjectInputs, type MainProjectInput } from "./main-project-inputs.js";
export type { MainResearchSdkOptions } from "./main-options.js";

const snapshotKeys = [
  "id", "title", "requirement", "status", "phase", "createdAt", "updatedAt", "completedAt", "cancelledAt",
  "inputFiles", "inputDescription",
  "currentAgent", "queuedAgent", "eventSeq", "completionGeneration", "lastError", "userIntervention",
  "agentProgress", "overallProgress", "latestHandoff", "artifacts", "display", "tokenUsage",
  "loopIterations", "loopBatches", "loopTotalIterations", "git", "workflowRevision", "runtime", "collaboration",
  "nodeRuns", "groupRuns", "tasks", "executions", "pullRequests", "scopedGroupRuns", "scopedExecutions",
  "scopedAgentReports", "scopedAgentTaskCompletions", "scopedArrivals", "scopedFinalIntegrations", "scopedPullRequests",
  "scopedAgentMerges", "scopedGroupFinalMerges", "scopedGroupIssues", "scopedManagementFailures", "scopedManagementTurns",
  "failureAttempts", "failureSummary", "gitRetryScheduling", "pauseRequest", "cancellationRequestedAt", "cancellationSettledAt"
] as const satisfies ReadonlyArray<keyof ProjectView>;
export type MainRunSnapshot = Pick<ProjectView, typeof snapshotKeys[number]> & {
  workspaceDelivery?: MainWorkspaceDelivery;
  /** Canonical shared original-input folder; not an Agent business Git worktree. */
  userInputsPath: string;
};
export interface MainEventOptions { afterSeq?: number; signal?: AbortSignal; follow?: boolean }
export interface MainResearchRun {
  readonly id: string;
  snapshot(): Promise<MainRunSnapshot>;
  wait(options?: { signal?: AbortSignal }): Promise<MainRunSnapshot>;
  events(options?: MainEventOptions): AsyncIterable<TimelineEvent>;
  pause(): Promise<MainRunSnapshot>;
  resume(): Promise<MainRunSnapshot>;
  /** main Git-on F13 Stop preserves resumable work (paused); Git-off cancellation is terminal. */
  cancel(): Promise<MainRunSnapshot>;
  retryGitInitialization(): Promise<MainRunSnapshot>;
  /** Export the pinned integrated main tree of a completed Git run to a new, external directory. */
  exportWorkspace(options: MainWorkspaceExportOptions): Promise<MainWorkspaceExportResult>;
  /** Retry a blocked final delivery after resolving original-workspace conflicts; never force-overwrites. */
  syncWorkspace(): Promise<MainWorkspaceDelivery | undefined>;
  addInput(message: string, options?: { mode?: "wait" | "interrupt"; requestId?: string }): Promise<MainRunSnapshot>;
  respond(message: string): Promise<MainRunSnapshot>;
}
export interface MainResearchSdk {
  readonly sourceCommit: string;
  readonly runtimeRevision: string;
  start(input: {
    title: string; requirement: string; workflow: MainWorkflowConfig;
    /** Deployment-owned selection, not embedded in the portable workflow. All configured Agents need a binding. */
    gatewayBindings: MainGatewayBindings;
    /** Existing directory: Git-off edits in place; Git-on seeds worktrees and delivers the integrated result here. */
    workspace?: string;
    /** Read-only seed into owned Git worktrees, not the legacy in-place workspace option. Git-on only. */
    sourceWorkspace?: MainSourceWorkspaceOptions;
    /** Local files/directories copied before the first Agent; API source paths must be absolute. */
    inputs?: readonly MainProjectInput[];
    /** User's note about the supplementary input files, at most 2,000 characters. */
    inputDescription?: string;
  }): Promise<MainResearchRun>;
  getRun(id: string): Promise<MainResearchRun>;
  listRuns(): Promise<MainRunSnapshot[]>;
  harnesses(): Promise<PublicHarnessDescriptor[]>;
  gateways: {
    list(): Promise<PublicGatewayRecord[]>;
    add(input: GatewayInput): Promise<PublicGatewayRecord>;
    /** Read native API-key configuration once and save a main gateway; no profile writes or probes. */
    importHarness(input: MainHarnessGatewayImportOptions): Promise<PublicGatewayRecord>;
    update(id: string, input: GatewayInput): Promise<PublicGatewayRecord | undefined>;
    test(id: string, harness: AgentHarness, model: string, options?: {
      signal?: AbortSignal; onStage?: (stage: GatewayProbeStageResult) => void; reasoningOptionId?: string;
    }): Promise<GatewayTestResult>;
  };
  /** Waiters stop immediately; the directory lock is released only after main and all residents stop. Retryable on Stop failure. */
  close(): Promise<void>;
}
const settled = (state: MainRunSnapshot) => ["completed", "cancelled", "paused", "interrupted"].includes(state.status);

/** Main kernel public entry; also exported as the root createResearchSdk default. */
export async function createMainResearchSdk(options: MainResearchSdkOptions): Promise<MainResearchSdk> {
  const redactor = mainRedactor();
  try {
    options = validateMainResearchSdkOptions(options);
    const harnesses: Partial<Record<AgentHarness, string>> = {};
    for (const [id, command] of Object.entries(options.harnesses ?? {})) {
      const descriptor = harnessCatalogRegistry.descriptor(id);
      if (typeof command !== "string" || !path.isAbsolute(command) || (process.platform === "win32" && /\.(?:cmd|bat|ps1|sh)$/i.test(command))) {
        throw new Error(`${id}: use an absolute native executable or JavaScript CLI path (legacy executable+args is not supported)`);
      }
      const resolved = await resolveHarnessExecutable(descriptor, command);
      // main's resolver may fall back to installed binaries. Explicit SDK overrides must never silently fall back.
      const { realpath } = await import("node:fs/promises");
      if (!resolved || resolved !== await realpath(command)) throw new Error(`Harness executable not found: ${command}`);
      harnesses[id] = resolved;
    }
    if (!harnesses.pi && !process.env.SCIENCEEVOLVE_PI_BIN?.trim()) {
      const managed = bundledHarnessInvocation("pi");
      if (managed?.args.length === 1) harnesses.pi = managed.args[0];
    }
    const resolver = options.git?.credentialResolver ?? gitCredentialHelperResolver();
    const runtime = await createMainApplicationRuntime({ dataDir: options.dataDir,
      nativeCodexProfiles: options.nativeCodexProfiles,
      sii: options.sii,
      skillRoots: [fileURLToPath(new URL("../assets/skills/", import.meta.url)), ...(options.skillRoots ?? [])],
      userSkillRoot: options.userSkillRoot,
      execution: options.execution ? { retryBaseMs: 2_000, retryMaxMs: 60_000, ...options.execution } : undefined,
      runnerOptions: { harnessExecutables: harnesses, ...options.timeouts },
      git: { credentialResolver: async (signal) => {
        const credential = await resolver(signal); redactor.remember(credential.token); return credential;
      }, ...(options.git?.expectedIdentity ? { expectedIdentity: { ...options.git.expectedIdentity } } : {}) }
    });
    try { return await createMainSdkClient(runtime, redactor); }
    catch (error) { await runtime.close(); throw error; }
  } catch (error) { throw redactor.error(error); }
}

/** Internal contract-test seam; production callers construct the actual host with createMainResearchSdk. */
export async function createMainSdkClient(runtime: MainApplicationRuntime, redactor: MainRedactor = mainRedactor()): Promise<MainResearchSdk> {
  const stopped = new AbortController();
  const pending = new Set<Promise<unknown>>();
  let closing: Promise<void> | undefined;
  let closed = false;
  for (const publicGateway of await runtime.gatewayStore.list()) {
    redactor.remember((await runtime.gatewayStore.get(publicGateway.id))?.apiKey);
  }
  function rememberProject(project: ProjectView) {
    for (const agent of Object.values(project.agents)) redactor.remember(agent.gatewaySnapshot?.apiKey);
  }
  for (const project of await runtime.orchestrator.listProjects(true)) rememberProject(project);
  function assertOpen() { if (stopped.signal.aborted) throw new Error("SDK is closed"); }
  function operation<T>(action: () => Promise<T>): Promise<T> {
    if (stopped.signal.aborted) return Promise.reject(new Error("SDK is closed"));
    const result = Promise.resolve().then(action).catch((error: unknown) => { throw redactor.error(error); });
    pending.add(result);
    void result.then(() => pending.delete(result), () => pending.delete(result));
    return result;
  }
  function snapshot(project: ProjectView): MainRunSnapshot {
    rememberProject(project);
    const delivery = runtime.gitWorkspaces.receipt(project.id);
    const workspace = runtime.projectWorkspaces.path(project.id) ?? path.join(runtime.storage.projectDir(project.id), "workspaces");
    return redactor.clean({ ...Object.fromEntries(snapshotKeys.filter((key) => project[key] !== undefined)
      .map((key) => [key, project[key]])), userInputsPath: path.join(workspace, "user_inputs"),
      ...(delivery ? { workspaceDelivery: delivery } : {}) }) as unknown as MainRunSnapshot;
  }
  async function read(id: string) {
    const project = await runtime.orchestrator.getProject(id);
    if (!project) throw new Error(`Run not found: ${id}`);
    const delivery = await runtime.gitWorkspaces.synchronize(project);
    return { ...snapshot(project), ...(delivery ? { workspaceDelivery: redactor.clean(delivery) } : {}) };
  }
  function handle(id: string): MainResearchRun {
    return {
      id, snapshot: () => operation(() => read(id)),
      async wait(options = {}) {
        assertOpen();
        const signal = AbortSignal.any([stopped.signal, ...(options.signal ? [options.signal] : [])]);
        while (true) {
          signal.throwIfAborted();
          const state = await operation(() => read(id));
          if (state.status === "completed" && state.workspaceDelivery && state.workspaceDelivery.status !== "synced") {
            throw new Error(`Task completed but original workspace delivery is ${state.workspaceDelivery.status}: ${state.workspaceDelivery.message ?? "retry syncWorkspace after resolving conflicts"}`);
          }
          if (settled(state)) return state;
          await delay(100, undefined, { signal });
        }
      },
      async *events(options = {}) {
        assertOpen();
        let cursor = options.afterSeq ?? 0;
        if (!Number.isSafeInteger(cursor) || cursor < 0) throw new Error("afterSeq must be a non-negative integer");
        const signal = AbortSignal.any([stopped.signal, ...(options.signal ? [options.signal] : [])]);
        let revision = 0;
        let wake: (() => void) | undefined;
        // Subscribe before reading the replay boundary; no history/live gap.
        const unsubscribe = runtime.eventHub.subscribe(id, () => { revision++; wake?.(); });
        // Even a consumer abandoned at `yield` must release its subscription when the SDK closes.
        signal.addEventListener("abort", unsubscribe, { once: true });
        try {
          signal.throwIfAborted();
          const initial = await operation(() => read(id));
          const historyEnd = options.follow === false ? initial.eventSeq : undefined;
          while (true) {
            signal.throwIfAborted();
            const observed = revision;
            const state = await operation(() => read(id));
            const page: TimelineEvent[] = [];
            await operation(() => runtime.storage.replayEvents(id, cursor, (event) => {
              if (historyEnd !== undefined && event.seq > historyEnd) return false;
              page.push(redactor.clean(event));
              return page.length < 256;
            }, signal));
            for (const event of page) { signal.throwIfAborted(); cursor = event.seq; yield event; }
            if (page.length === 256) continue;
            if (historyEnd !== undefined || (settled(state) && cursor >= state.eventSeq)) return;
            if (revision !== observed) continue;
            await new Promise<void>((resolve, reject) => {
              const finish = () => { clearTimeout(timer); signal.removeEventListener("abort", abort); wake = undefined; resolve(); };
              const abort = () => { clearTimeout(timer); signal.removeEventListener("abort", abort); wake = undefined; reject(signal.reason); };
              const timer = setTimeout(finish, 250);
              wake = finish;
              signal.addEventListener("abort", abort, { once: true });
              if (signal.aborted) abort();
            });
          }
        } finally { signal.removeEventListener("abort", unsubscribe); unsubscribe(); }
      },
      pause: () => operation(async () => snapshot(await runtime.orchestrator.pause(id))),
      resume: () => operation(async () => snapshot(await runtime.orchestrator.resume(id))),
      cancel: () => operation(async () => snapshot(await runtime.orchestrator.cancel(id))),
      retryGitInitialization: () => operation(async () => snapshot(await runtime.orchestrator.retryGitInitialization(id))),
      exportWorkspace: (options) => operation(async () => {
        // Presentation snapshots can redact substrings inside a path. Never
        // feed a redacted public path back into an internal filesystem action.
        const state = await runtime.orchestrator.getProject(id);
        if (!state) throw new Error(`Run not found: ${id}`);
        rememberProject(state);
        if (state.status !== "completed" || !state.git?.enabled || state.git.status !== "ready" || !state.git.repository?.localPath) {
          throw new Error("Workspace export requires a completed Git-enabled run with a ready, integrated repository");
        }
        return redactor.clean(await exportMainWorkspace({ dataDir: runtime.storage.root, projectDir: runtime.storage.projectDir(id),
          repository: state.git.repository.localPath, options: { ...options,
            signal: AbortSignal.any([stopped.signal, ...(options?.signal ? [options.signal] : [])]) } }));
      }),
      syncWorkspace: () => operation(async () => {
        const state = await runtime.orchestrator.getProject(id);
        if (!state || state.status !== "completed") throw new Error("Workspace delivery requires a completed task");
        return redactor.clean(await runtime.gitWorkspaces.synchronize(state, true));
      }),
      addInput: (message, options = {}) => operation(async () => {
        const current = await read(id);
        if (current.status === "completed" && current.workspaceDelivery && current.workspaceDelivery.status !== "synced") {
          throw new Error("Resolve and synchronize the original workspace before opening a new completion generation");
        }
        const next = await runtime.orchestrator.addProjectUserInput(id, message, options.mode, options.requestId);
        await runtime.gitWorkspaces.synchronize(next);
        return snapshot(next);
      }),
      respond: (message) => operation(async () => snapshot(await runtime.orchestrator.respondToUserIntervention(id, message)))
    };
  }
  return {
    sourceCommit: runtime.sourceCommit,
    runtimeRevision: runtime.runtimeRevision,
    start: (input) => operation(async () => {
      if ("prepareWorkspace" in input) {
        throw new Error("prepareWorkspace is not supported by the main SDK entry");
      }
      const { inputs: workflowInputs, inputDescription: workflowInputDescription, ...workflow } = validateMainWorkflowConfig(input.workflow);
      if (input.workspace !== undefined && input.sourceWorkspace !== undefined) {
        throw new Error("workspace and sourceWorkspace are mutually exclusive");
      }
      const inputDescription = input.inputDescription === undefined ? workflowInputDescription : input.inputDescription;
      if (inputDescription !== undefined && (typeof inputDescription !== "string" || inputDescription.trim().length > 2000)) {
        throw new Error("inputDescription must be text of at most 2000 characters");
      }
      const initialInputs = await prepareMainProjectInputs(input.inputs === undefined ? workflowInputs : input.inputs, stopped.signal);
      const bindings = validateMainGatewayBindings(input.gatewayBindings);
      for (const name of Object.keys(bindings.agents ?? {})) {
        if (!Object.hasOwn(workflow.agents, name)) throw new Error(`Gateway binding for unknown Agent: ${name}`);
      }
      const agents = Object.fromEntries(Object.entries(workflow.agents).map(([name, config]) => {
        const assigned = bindings.agents && Object.hasOwn(bindings.agents, name) ? bindings.agents[name] : undefined;
        const nativeCodexProfileId = typeof assigned === "object" ? assigned.nativeCodexProfileId
          : assigned === undefined ? bindings.defaultNativeCodexProfileId : undefined;
        if (nativeCodexProfileId) {
          if (config.harness !== "codex" || config.gatewayReasoningOption) throw new Error(`Native Codex binding conflicts with Agent: ${name}`);
          return [name, { ...config, nativeCodexProfileId }];
        }
        const gatewayId = typeof assigned === "string" ? assigned : bindings.defaultGatewayId;
        if (!gatewayId) throw new Error(`Gateway binding required for Agent: ${name}`);
        return [name, { ...config, gatewayId }];
      }));
      const gitWorkspace = input.workspace !== undefined && workflow.git.enabled ? await runtime.gitWorkspaces.prepare(input.workspace) : null;
      const workspace = input.workspace === undefined || workflow.git.enabled ? null : await runtime.projectWorkspaces.prepare(input.workspace);
      if (input.sourceWorkspace !== undefined && !workflow.git.enabled) throw new Error("sourceWorkspace requires Git-enabled main workflow; source directories are never modified in place");
      const source = gitWorkspace ? gitWorkspace.source : input.sourceWorkspace === undefined ? null : await runtime.sourceWorkspaces.prepare(input.sourceWorkspace, stopped.signal);
      let creatingProjectId: string | undefined;
      const project = await runtime.orchestrator.createProject({ title: input.title, requirement: input.requirement, ...workflow, agents,
        ...(inputDescription === undefined ? {} : { inputDescription: inputDescription.trim() }),
        ...(initialInputs ? { inputUploadId: randomBytes(24).toString("hex") } : {}) }, {
        ...(initialInputs ? { initialInputs: { files: [...initialInputs.files], install: async (projectId: string) => {
          const shared = await runtime.storage.roleWorkspace(projectId, "main", "inv_user_inputs_install");
          await initialInputs.install(path.join(shared, "user_inputs"));
        } } } : {}),
        beforePersist: async ({ projectId }) => {
          creatingProjectId = projectId;
          stopped.signal.throwIfAborted();
          await runtime.projectWorkspaces.bind(projectId, workspace);
          if (gitWorkspace) await runtime.gitWorkspaces.bind(projectId, gitWorkspace.binding);
          await runtime.sourceWorkspaces.bind(projectId, source);
        }
      }).catch(async (error: unknown) => {
        if (creatingProjectId) {
          try {
            // Once state exists, the durable project owns its inputs even if a
            // later initialization step failed. Never remove resumable inputs.
            let unpersisted = false;
            try { await fs.lstat(path.join(runtime.storage.projectDir(creatingProjectId), "state.json")); }
            catch (inspectionError) {
              if ((inspectionError as NodeJS.ErrnoException).code !== "ENOENT") throw inspectionError;
              unpersisted = true;
            }
            if (unpersisted) await initialInputs?.rollback();
            if (workspace || gitWorkspace) {
              await runtime.projectWorkspaces.releaseUnpersisted(creatingProjectId);
              await runtime.gitWorkspaces.releaseUnpersisted(creatingProjectId);
            }
          } catch (cleanupError) { throw new AggregateError([error, cleanupError], "Project creation failed and input/workspace cleanup failed"); }
        }
        throw error;
      });
      rememberProject(project);
      return handle(project.id);
    }),
    getRun: (id) => operation(async () => { await read(id); return handle(id); }),
    listRuns: () => operation(async () => (await runtime.orchestrator.listProjects()).map(snapshot)),
    harnesses: () => operation(async () => redactor.clean(await runtime.runner.harnessCatalog!())),
    gateways: {
      list: () => operation(async () => redactor.clean(await runtime.gatewayStore.list())),
      add: (input) => operation(async () => {
        redactor.remember(input.apiKey);
        const saved = await runtime.gatewayStore.create(input);
        return redactor.clean(await runtime.gatewayStore.scheduleReasoningDiscovery(saved.id));
      }),
      importHarness: (input) => operation(async () => {
        const gateway = await readMainHarnessGateway(input);
        redactor.remember(gateway.apiKey);
        stopped.signal.throwIfAborted();
        return redactor.clean(await runtime.gatewayStore.create(gateway));
      }),
      update: (id, input) => operation(async () => {
        redactor.remember(input.apiKey);
        const saved = await runtime.gatewayStore.update(id, input);
        return saved ? redactor.clean(await runtime.gatewayStore.scheduleReasoningDiscovery(saved.id)) : undefined;
      }),
      test: (id, harness, model, options = {}) => operation(async () => redactor.clean(await runtime.gatewayStore.testHarness(
        id, harness, model, AbortSignal.any([stopped.signal, ...(options.signal ? [options.signal] : [])]),
        (stage) => { try { options.onStage?.(redactor.clean(stage)); } catch { /* Observers do not control the probe. */ } },
        options.reasoningOptionId
      )))
    },
    close() {
      if (closed) return Promise.resolve();
      if (closing) return closing;
      stopped.abort(new Error("SDK is closed"));
      closing = Promise.allSettled([...pending]).then(() => runtime.close()).then(() => { closed = true; })
        .catch((error: unknown) => { throw redactor.error(error); }).finally(() => { closing = undefined; });
      return closing;
    }
  };
}
