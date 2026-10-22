import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EventHub } from "./core/event-hub.js";
import { ProjectStorage } from "./core/storage.js";
import { SkillCatalog } from "./core/skill-catalog.js";
import { GatewayStore, type GatewayStoreOptions, type GatewayInput } from "./core/agent-runtime.js";
import { HarnessRuntimeFacade, type HarnessRuntimeOptions } from "./core/harness-runtime/runtime.js";
import { createProductionHarnessRuntimeResidentAdapter } from "./core/harness-runtime/resident-runtime-adapter.js";
import { createProductionCollaborationResidentLauncher } from "./core/collaboration-resident-launcher.js";
import {
  CollaborationRuntimeCoordinator,
  ProductionCollaborationExecutionInputBuilder,
  ProductionCollaborationInvocationDispatcher,
  type CollaborationResidentLauncher,
  type CollaborationRuntimeOptions
} from "./core/collaboration-runtime.js";
import {
  createCollaborationGitFacade,
  type GitHubCredentialResolver
} from "./core/collaboration-git/index.js";
import { Orchestrator } from "./core/orchestrator.js";
import type { AgentRunner } from "./core/types.js";
import { trackMainResidents, trackResidentOpens } from "./main-resident-tracker.js";
import { MainSourceWorkspaceStore } from "./main-source-workspace.js";
import { MainProjectWorkspaceStore } from "./main-project-workspace.js";
import { MainGitWorkspaceStore } from "./main-git-workspace.js";
import { MainNativeCodexProfiles } from "./main-native-profiles.js";
import { SiiExperimentService } from "./core/sii-experiments.js";
import type { MainResearchSdkOptions } from "./main-options.js";

export const MAIN_RUNTIME_SOURCE_COMMIT = "6bf6a7bb5b200e92511aa4010b7d5fc3711ed79b";
const sourceManifest = JSON.parse(await fs.readFile(new URL("../resources/main-runtime/manifest.json", import.meta.url), "utf8"));
if (sourceManifest.sourceCommit !== MAIN_RUNTIME_SOURCE_COMMIT || typeof sourceManifest.runtimeRevision !== "string") {
  throw new Error("Unsupported main-runtime source manifest");
}
/** Includes the exact core/schema bytes and declared shared fixes, not only the upstream base commit. */
export const MAIN_RUNTIME_REVISION: string = sourceManifest.runtimeRevision;
export const MAIN_RUNTIME_MARKER = ".scienceevolve-main-runtime.json";
const builtinSkillRoot = fileURLToPath(new URL("../assets/skills/", import.meta.url));

/** Internal, same-version host backing the main/default API and CLI. */
export interface MainApplicationRuntimeOptions {
  /** Use a dedicated absolute directory, not a legacy SDK/Web data directory. */
  dataDir: string;
  skillRoots?: string[];
  userSkillRoot?: string;
  nativeCodexProfiles?: Record<string, string>;
  /** Explicit opt-in; this host owns the service lifecycle. */
  sii?: MainResearchSdkOptions["sii"];
  runnerOptions?: HarnessRuntimeOptions;
  gatewayOptions?: GatewayStoreOptions;
  initialGateway?: GatewayInput;
  execution?: ConstructorParameters<typeof Orchestrator>[3];
  /** Inject credentials in memory. Never store tokens in workflow.json. */
  git?: {
    credentialResolver: GitHubCredentialResolver;
    expectedIdentity?: { id: number; login: string };
  };
  /** Internal contract-test seam; custom runners must provide a trusted resident launcher. */
  internal?: {
    runner: AgentRunner;
    residentLauncher: CollaborationResidentLauncher;
    /** Trusted deterministic provider/local-Git seam, never part of the public SDK options. */
    gitFactory?: CollaborationRuntimeOptions["gitFactory"];
  };
}

async function requireDedicatedDirectory(root: string) {
  const markerPath = path.join(root, MAIN_RUNTIME_MARKER);
  let markerStat;
  try { markerStat = await fs.lstat(markerPath); } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  if (markerStat) {
    if (!markerStat.isFile() || markerStat.isSymbolicLink()) throw new Error("Invalid main-runtime directory marker");
    const marker = JSON.parse(await fs.readFile(markerPath, "utf8"));
    if (marker.schemaVersion !== 1 || marker.engine !== "main-runtime" || typeof marker.sourceCommit !== "string") {
      throw new Error("Unsupported runtime directory format");
    }
    if (marker.sourceCommit !== MAIN_RUNTIME_SOURCE_COMMIT || marker.runtimeRevision !== MAIN_RUNTIME_REVISION) {
      throw new Error("Runtime data belongs to another main revision; an explicit migration is required");
    }
    return false;
  }
  const entries = (await fs.readdir(root)).filter((name) => name !== ".scienceevolve-runtime.lock");
  if (entries.length) throw new Error("Main runtime requires an empty dedicated data directory. Existing SDK/Web data and source repositories are not migrated or modified automatically.");
  await fs.writeFile(markerPath, JSON.stringify({ schemaVersion: 1, engine: "main-runtime", sourceCommit: MAIN_RUNTIME_SOURCE_COMMIT,
    runtimeRevision: MAIN_RUNTIME_REVISION }) + "\n", { flag: "wx", mode: 0o600 });
  return true;
}

/** Compose main's actual runtime without HTTP, Web OAuth, global signal handlers or a main checkout. */
export async function createMainApplicationRuntime(options: MainApplicationRuntimeOptions) {
  if (!path.isAbsolute(options.dataDir)) throw new Error("dataDir must be an absolute, dedicated directory");
  if (options.sii && options.runnerOptions?.siiExperiments) {
    throw new Error("Choose host-owned sii options or a caller-owned siiExperiments service, not both");
  }
  const root = path.resolve(options.dataDir);
  // Pin the resolver/expected identity for this host; callers may rotate a
  // token inside the resolver, but mutating the options object cannot swap
  // the credential route underneath an already running project.
  const git = options.git ? {
    credentialResolver: options.git.credentialResolver,
    ...(options.git.expectedIdentity ? { expectedIdentity: { ...options.git.expectedIdentity } } : {})
  } : undefined;
  await fs.mkdir(root, { recursive: true, mode: 0o700 });
  const lockPath = path.join(root, ".scienceevolve-runtime.lock");
  const lock = await fs.open(lockPath, "wx", 0o600).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "EEXIST") throw new Error("Data directory is in use (or has a stale .scienceevolve-runtime.lock). Confirm the owner has stopped before operator recovery.");
    throw error;
  });
  const release = async () => { await lock.close(); await fs.unlink(lockPath); };
  let engine: Orchestrator | undefined;
  let residents: ReturnType<typeof trackMainResidents> | undefined;
  let collaborationRuntime: CollaborationRuntimeCoordinator | undefined;
  let unsubscribeDelivery: (() => void) | undefined;
  let deliverySweep: ReturnType<typeof setInterval> | undefined;
  let siiExperiments: SiiExperimentService | undefined;
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, engine: "main-runtime", startedAt: new Date().toISOString() }));
    const fresh = await requireDedicatedDirectory(root);
    const nativeProfiles = new MainNativeCodexProfiles();
    await nativeProfiles.initialize(root, options.nativeCodexProfiles, fresh);
    const sourceWorkspaces = new MainSourceWorkspaceStore(root);
    await sourceWorkspaces.initialize(fresh);
    const projectWorkspaces = new MainProjectWorkspaceStore(root);
    await projectWorkspaces.initialize();
    const gitWorkspaces = new MainGitWorkspaceStore(root, sourceWorkspaces);
    await gitWorkspaces.initialize();
    const eventHub = new EventHub();
    const storage = new ProjectStorage(root, eventHub, {
      workspaceResolver: (id) => projectWorkspaces.resolve(id)
    });
    await storage.initialize();
    if (options.sii) {
      siiExperiments = new SiiExperimentService({
        ...options.sii,
        noProxy: options.sii.noProxy ? [...options.sii.noProxy] : undefined,
        projectsRoot: storage.projectsDir(),
        knowledgeRoot: options.sii.knowledgeRoot ?? path.join(builtinSkillRoot, "general", "inspire"),
        resolveProjectWorkspace: (id) => projectWorkspaces.resolve(id)
      });
    }
    const gatewayStore = new GatewayStore(root, options.gatewayOptions);
    if (options.initialGateway) await gatewayStore.seedBuiltin(options.initialGateway);
    const skills = new SkillCatalog(options.skillRoots ?? [builtinSkillRoot], options.userSkillRoot ?? path.join(root, "skills"));
    const facade = options.internal ? undefined : new HarnessRuntimeFacade({
      ...options.runnerOptions,
      ...(siiExperiments ? { siiExperiments,
        // Async SII uses direct execFile in its service. Do not activate the
        // legacy shell wrapper, whose root guard rejects bound SDK workspaces.
        inspireBin: undefined,
        inspireConfigPath: options.sii!.configPath,
        inspireNoProxy: options.sii!.noProxy ? [...options.sii!.noProxy] : undefined,
        inspireWorkspaceRoot: options.sii!.workspaceRoot
      } : {}),
      resolveNativeCodexProfile: (id) => nativeProfiles.resolve(id),
      resolveProjectWorkspace: (id) => projectWorkspaces.resolve(id),
      validateGatewayTarget: (url) => gatewayStore.assertAllowedNetworkTarget(url)
    });
    const runner = options.internal?.runner ?? facade!;
    if (facade) gatewayStore.setAdapterSmokeProbe(facade);
    const nativeResidents = facade ? trackResidentOpens(createProductionHarnessRuntimeResidentAdapter(facade)) : undefined;
    const launcherResidents = trackMainResidents(options.internal?.residentLauncher ?? createProductionCollaborationResidentLauncher(
      facade!, nativeResidents!.launcher
    ));
    residents = { launcher: launcherResidents.launcher, async stopRemaining() {
      await launcherResidents.stopRemaining();
      await nativeResidents?.stopRemaining();
    } };
    collaborationRuntime = new CollaborationRuntimeCoordinator({
      storage,
      // Both HTTPS Git transport and provider API use the same resolver.
      gitFactory: (binding) => {
        const hostBinding = { ...binding, initialTree: (input: { repositoryPath: string; signal?: AbortSignal }) => sourceWorkspaces.initialTree(binding.projectId, input) };
        if (options.internal?.gitFactory) return options.internal.gitFactory(hostBinding);
        return createCollaborationGitFacade({ ...hostBinding,
          ...(git ? { credentialResolver: git.credentialResolver } : {}),
          ...(git?.expectedIdentity ? { expectedIdentity: git.expectedIdentity } : {}) });
      },
      executionInputBuilder: new ProductionCollaborationExecutionInputBuilder(storage, skills),
      invocationDispatcher: new ProductionCollaborationInvocationDispatcher(storage),
      residentLauncher: residents.launcher,
      validateWorkflowConfiguration: (state, proposal) => engine!.prepareWorkflowConfiguration(state, proposal)
    });
    // Match main's bootstrap: formal state must exist before SII can import
    // its ledger or publish experiment outcomes. Never start its monitor on
    // the obsolete file-only state store.
    await collaborationRuntime.initialize();
    (siiExperiments ?? options.runnerOptions?.siiExperiments)?.configureDocumentStore(collaborationRuntime.projectStateDocuments());
    engine = new Orchestrator(storage, skills, runner, {
      retryBaseMs: 2_000, retryMaxMs: 60_000, ...options.execution
    }, gatewayStore, collaborationRuntime, undefined, {
      beforePersist: async ({ projectId }) => { await sourceWorkspaces.bindDefault(projectId); },
      validateNativeCodexProfile: async (config) => { await nativeProfiles.resolve(config.nativeCodexProfileId!); }
    });
    await engine.initialize();
    await siiExperiments?.start();
    const orchestrator = engine;
    const deliveryNotifications = new Map<string, Promise<void>>();
    const reconcileDelivery = (id: string) => {
      if (deliveryNotifications.has(id)) return;
      const notification = orchestrator.getProject(id).then(async state => {
        if (state) await gitWorkspaces.synchronize(state);
      }).catch(() => {});
      deliveryNotifications.set(id, notification);
      void notification.finally(() => deliveryNotifications.delete(id));
    };
    unsubscribeDelivery = eventHub.subscribeAll((event) => {
      const sourceType = event.data?.sourceType;
      // Git-on uses committed scoped/node completion facts, not the old
      // Git-off project.completed event. No API polling is required to deliver.
      if (!gitWorkspaces.receipt(event.projectId) || (event.type !== "project.completed" &&
          !(typeof sourceType === "string" && sourceType.endsWith(".completed")))) return;
      // Event listeners must never throw into the main invocation transaction.
      reconcileDelivery(event.projectId);
    });
    // Scoped facts can be published before the coordinator refreshes its
    // terminal projection. Reconcile pending host deliveries independently
    // of public wait/snapshot calls; never overlap reads for a project.
    deliverySweep = setInterval(() => {
      for (const id of gitWorkspaces.ids()) {
        if (["pending", "applying"].includes(gitWorkspaces.receipt(id)!.status)) reconcileDelivery(id);
      }
    }, 250);
    deliverySweep.unref();
    for (const id of gitWorkspaces.ids()) {
      const state = await orchestrator.getProject(id);
      if (state) await gitWorkspaces.synchronize(state);
    }
    const trackedResidents = residents;
    let closing: Promise<void> | undefined;
    let closed = false;
    return {
      sourceCommit: MAIN_RUNTIME_SOURCE_COMMIT,
      runtimeRevision: MAIN_RUNTIME_REVISION,
      eventHub, storage, gatewayStore, skills, runner, orchestrator, collaborationRuntime, sourceWorkspaces, projectWorkspaces, gitWorkspaces,
      close(): Promise<void> {
        if (closed) return Promise.resolve();
        if (closing) return closing;
        closing = (async () => {
          clearInterval(deliverySweep);
          try {
            await orchestrator.shutdown();
            await trackedResidents.stopRemaining();
          } finally { await siiExperiments?.stop(); }
          unsubscribeDelivery?.();
          await Promise.all(deliveryNotifications.values());
          await gitWorkspaces.flush();
          await release();
          closed = true;
        })().finally(() => { closing = undefined; });
        return closing;
      }
    };
  } catch (error) {
    clearInterval(deliverySweep);
    unsubscribeDelivery?.();
    try {
      try {
        if (engine) await engine.shutdown();
        else await collaborationRuntime?.shutdown();
        await residents?.stopRemaining();
      } finally { await siiExperiments?.stop(); }
    } catch (stopError) {
      throw new AggregateError([error, stopError], "Runtime initialization failed and Stop was not confirmed; directory remains locked");
    }
    await release();
    throw error;
  }
}

export type MainApplicationRuntime = Awaited<ReturnType<typeof createMainApplicationRuntime>>;
