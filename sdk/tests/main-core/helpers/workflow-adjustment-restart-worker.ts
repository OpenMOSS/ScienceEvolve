import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { Orchestrator } from "../../../src/core/orchestrator.js";
import { CollaborationRuntimeCoordinator, type CollaborationGitRuntime } from "../../../src/core/collaboration-runtime.js";
import { createProductionCollaborationResidentLauncher } from "../../../src/core/collaboration-resident-launcher.js";
import { ProjectStorage } from "../../../src/core/storage.js";
import { EventHub } from "../../../src/core/event-hub.js";
import { SkillCatalog } from "../../../src/core/skill-catalog.js";
import { harnessCatalogRegistry, toPublicHarnessDescriptor } from "../../../src/core/harness-runtime/registry.js";
import { ControlActionService } from "../../../src/core/orchestration-control-bridge.js";
import { prepareOperation, finalizeOperation } from "../../../src/core/collaboration-git/operation.js";
import type { HarnessRuntimeFacade } from "../../../src/core/harness-runtime/runtime.js";
import type { HarnessRuntimeResidentAdapter } from "../../../src/core/harness-runtime/resident-runtime-adapter.js";
import type { AgentRunner, ControlActionEnvelope } from "../../../src/core/types.js";

// Two independent backend processes use the normal Orchestrator storage and
// recovery entry. Only the external Git provider and native Agent are controlled.
const [root, mode, existingId] = process.argv.slice(2) as [string, string, string?];
const storage = new ProjectStorage(root, new EventHub());
const send = (value: unknown) => process.send?.(value);
const stage = (name: string) => send({ kind: "stage", name });
let projectId = existingId, submitted = false, stopping = false, openCount = 0;
let releaseInput: (() => void) | undefined;
let orchestrator!: Orchestrator;
const adapter = { async open(input: Parameters<HarnessRuntimeResidentAdapter["open"]>[0]) {
  openCount++;
  const session = { schemaVersion: 1 as const, harnessId: "codex", adapterVersion: "controlled", nativeId: `controlled-main-${input.request.project.id}`,
    generation: 0, durable: true, createdAt: input.request.project.createdAt };
  const lease = { session, acknowledgedControlSeq: 0 };
  return { initialLease: lease, async pause() {}, async resume() {}, async probe() { return lease; }, async close() { releaseInput?.(); },
    async submit(turn: { inputId: string; invocationId: string; prompt: string }) {
      const fresh = await input.turnRequestFactory!({ baseRequest: input.request, turn });
      await fresh.request.onDurableSessionStarted?.(session, session.nativeId);
      send({ kind: "native-input", projectId: input.request.project.id, instructions: fresh.request.project.agents.main.instructions,
        invocationId: turn.invocationId, inputId: turn.inputId, context: fresh.request.executionContext });
      await new Promise<void>(resolve => { releaseInput = resolve; input.signal.addEventListener("abort", () => resolve(), { once: true }); });
      if (input.signal.aborted || stopping) return { handoff: "Controlled original input stopped during backend shutdown" };
      const authority = await input.controlAuthorityFactory!({ request: fresh.request, turn });
      const service = new ControlActionService({ projectId: fresh.request.project.id, agent: "main", invocationId: turn.invocationId,
        stateVersion: authority.control.stateVersion, capability: authority.control.capability, capabilityHash: authority.control.capabilityHash,
        stagingPath: authority.control.stagingPath, revalidate: authority.revalidate });
      const actions: ControlActionEnvelope[] = [];
      actions.push(await service.stage(authority.control.capability, `finish-${turn.inputId}`,
        { tool: "finish_task", summary: "Main explicitly finished the original management task", memory: "Original Main task inspected after backend restart" }));
      actions.push(await service.stage(authority.control.capability, `complete-${turn.inputId}`,
        { tool: "complete_project", rationale: "Main explicitly verified the original no-artifact task" }));
      return { handoff: "Original controlled Main task completed", controlActions: actions };
    } };
} } as unknown as HarnessRuntimeResidentAdapter;
const native = { reconcileResidentStartup: async () => ({ status: "none" }), residentRecoveryStrategy: () => "native-resume",
  cleanupResidentInterrupted: async () => undefined } as unknown as HarnessRuntimeFacade;
const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: `owned-restart-${mode}`, hostId: "fixture", leaseDurationMs: 1_000,
  validateWorkflowConfiguration: async (state, proposal) => {
    stage("configuration-validation-start");
    await orchestrator.prepareWorkflowConfiguration(state, proposal);
    stage("configuration-validation-ready");
    if (mode !== "apply" && (await coordinator.getWorkflowAdjustments(state)).records.some(record => record.status === "pending"))
      throw new Error("Controlled resource revalidation still waiting");
  },
  residentLauncher: createProductionCollaborationResidentLauncher(native, adapter),
  gitFactory: options => ({
    async initialize(request) {
      stage("git-initialization-start");
      const repository = { provider: "github" as const, providerId: 1, owner: "fixture-owner", name: request.repositoryName,
        htmlUrl: `https://github.example/${request.repositoryName}`, cloneUrl: `https://github.example/${request.repositoryName}.git`,
        private: true as const, defaultBranch: "main", observedAt: new Date().toISOString() };
      const directory = path.join(options.projectRoot, "repository"); await fs.mkdir(directory, { recursive: true });
      const operation = await prepareOperation(options.operationStore, { id: `${request.operationId}-repository`, kind: "repository.create" },
        { projectId: request.projectId, repositoryName: request.repositoryName });
      await finalizeOperation(options.operationStore, operation, repository);
      const state = { enabled: true as const, status: "ready" as const, provider: "github" as const,
        repository: { ...repository, localPath: directory }, initialization: { operationId: request.operationId, attempt: request.attempt,
          completedSteps: ["github.authorized", "remote.main.observed"] } };
      await options.operationStore.checkpointInitialization({ projectId: request.projectId, operationId: request.operationId, attempt: request.attempt, state });
      stage("git-checkpoint-ready");
      if (mode === "seed" && !submitted) {
        submitted = true; projectId = request.projectId;
        const current = (await orchestrator.getWorkflowAdjustments(projectId)).current, proposal = structuredClone(current.snapshot);
        stage("original-user-snapshot-read");
        proposal.agents.main.instructions = "Exact user instructions for the original next Main task";
        await orchestrator.submitWorkflowAdjustment(projectId, { projectId, requestId: "original-user-edit", base: current.version, proposal, explanation: "Original user's public explanation" });
        stage("original-user-request-accepted");
      }
      return { state, repository, localRepository: { projectId: request.projectId, repositoryPath: directory, branch: "main", head: "a".repeat(40), observedAt: new Date().toISOString() } };
    },
    async observeRemoteRef(repository, ref) { return { owner: repository.owner, repository: repository.name, ref, status: "present", sha: "a".repeat(40), observedAt: new Date().toISOString() }; },
    async prepareAgentManagementWorkspace(agentId) { const directory = path.join(options.projectRoot, "git-worktrees", "agents", agentId); await fs.mkdir(directory, { recursive: true }); return directory; },
    async managementMemorySnapshot() {
      try { return JSON.parse(await fs.readFile(path.join(options.projectRoot, "fixture-management-memory.json"), "utf8")); }
      catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new Error("Required Git ref is missing: management/memory"); throw error; }
    },
    async commitManagementMemory(agentId, operationId, content) {
      const snapshot = { branch: "management/memory", commitSha: createHash("sha256").update(content).digest("hex").slice(0, 40),
        provenance: operationId, entries: [{ agentId, path: `agent-memory/${agentId}/Memory.md`, content }], observedAt: new Date().toISOString() };
      await fs.writeFile(path.join(options.projectRoot, "fixture-management-memory.json"), JSON.stringify(snapshot)); return snapshot;
    }
  } as CollaborationGitRuntime) });
const runner = { run: async () => { throw new Error("Git recovery must never enter the legacy Agent scheduler"); },
  harnessCatalog: async () => harnessCatalogRegistry.list().map(descriptor => toPublicHarnessDescriptor(descriptor, { available: true })) } as AgentRunner;
orchestrator = new Orchestrator(storage, new SkillCatalog([]), runner, { retryBaseMs: 1, retryMaxMs: 1 }, undefined, coordinator);
const snapshot = async () => {
  if (!projectId) throw new Error("Original project identity is not ready");
  const database = coordinator.database(), state = await storage.loadState(projectId);
  const raw = new DatabaseSync(path.join(root, "collaboration-state.sqlite"), { readOnly: true });
  const lease = raw.prepare("SELECT * FROM writer_service_lease").get(); raw.close();
  return { pid: process.pid, state, projection: await database.projectState(projectId), records: (await coordinator.getWorkflowAdjustments(state)).records,
    events: await database.eventsAfter(projectId, 0, 10_000), openCount, lease };
};
process.on("message", async (message: { id: string; action: string }) => {
  try {
    if (message.action === "shutdown") {
      stopping = true; releaseInput?.(); await orchestrator.shutdown();
      process.send?.({ id: message.id, result: { stopped: true } }, () => process.exit(0)); return;
    }
    if (message.action === "withdraw") await orchestrator.withdrawWorkflowAdjustment(projectId!, { projectId, requestId: "original-user-edit", operationId: "explicit-user-withdraw", note: "Keep the original task and instructions" });
    if (message.action === "pause") await orchestrator.pause(projectId!);
    if (message.action === "resume") await orchestrator.resume(projectId!);
    if (message.action === "finish") releaseInput?.();
    send({ id: message.id, result: await snapshot() });
  } catch (error) { send({ id: message.id, error: error instanceof Error ? error.stack : String(error) }); }
});
process.on("disconnect", () => { if (!stopping) { stopping = true; releaseInput?.(); void orchestrator.shutdown().finally(() => process.exit(0)); } });
try {
  stage("backend-initialize-start");
  await orchestrator.initialize();
  stage("backend-initialize-ready");
  if (mode === "seed") {
    const created = await orchestrator.createProject({ title: "Original restart task", requirement: "Inspect the original task without producing business artifacts",
      git: { enabled: true }, agents: { main: { model: "fixture-model", harness: "codex", skills: [], autoSkills: [], instructions: "Original Main instructions", sessionPersistence: true } },
      orchestration: { agents: [{ name: "main", template: "main" }], input: { source: "input", target: "main" }, routes: { main: [] },
        decisionPlans: { main: "Inspect the original task" }, allowMainReconfiguration: false, allowUserIntervention: true,
        termination: { agent: "main", condition: "Main explicitly verifies the task", decisionBy: "main", automatic: false }, resultFormat: { presets: [], custom: "" } } });
    projectId = created.id;
  }
  send({ kind: "ready", projectId, pid: process.pid });
} catch (error) { send({ kind: "fatal", error: error instanceof Error ? error.stack : String(error) }); await orchestrator.shutdown(); process.exit(1); }
