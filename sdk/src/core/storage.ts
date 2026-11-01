import { archivedWorkflowSessionMatches, validArchivedWorkflowAgentSessions } from "./workflow-session-archive.js";
import {
  closeSync,
  createReadStream,
  fstatSync,
  ftruncateSync,
  lstatSync,
  mkdirSync,
  openSync,
  promises as fs,
  readFileSync,
  readSync,
  renameSync,
  unlinkSync,
  writeFileSync,
  type Dirent
} from "node:fs";
import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import path from "node:path";
import { AgentContextSources, publishAgentContextIndex, type AgentContextSource, type AgentContextIndex } from "./agent-context-index.js";
import readline from "node:readline";
import { MAIN_AGENT_ORCHESTRATION_CURRENT_FILE, MAIN_AGENT_ORCHESTRATION_FILE } from "./main-workflow-files.js";
import { ProjectFileBrowser } from "./project-file-browser.js";
import type {
  AgentName,
  ArtifactCatalogPage,
  ArtifactCatalogSummary,
  ArtifactDirectoryEntry,
  ArtifactDirectoryPage,
  ArtifactListItem,
  ArtifactRecord,
  ControlActionEnvelope,
  TaskCompletionRecord,
  MemberExecution,
  ProjectUserInput,
  ProjectState,
  ProjectSummary,
  TimelineEvent
} from "./types.js";
import { EventHub } from "./event-hub.js";
import type { ScopedWorktreeClosingCompletionRecord, TerminalPushObservationCompletionRecord, TerminalPushCoordinatorTurn } from "./collaboration-state/contracts.js";
import { validateProjectDirectoryAliases } from "./project-directory-aliases.js";
import { publishProjectStateDocumentView, readOnlyProjectStateDocuments, type ProjectStateDocument, type ProjectStateDocumentStore } from "./project-state-documents.js";
import { buildWorkspaceManifest, type WorkspaceFileStamp, type WorkspaceManifest } from "./workspace-checkpoint.js";
import { validateSessionRef } from "./harness-runtime/session-ref.js";
import { agentDefinitionFor, SYSTEM_CONTROLLER_AGENT } from "./system-controller.js";
import { effectiveAgentInstructions } from "./prompt.js";
import { normalizeAgentOrchestrationTemplate } from "./validation.js";
import { workflowOuterNodeIds } from "./agent-orchestration.js";
import {
  escapeMarkdownCodeFence,
  mediaTypeFor,
  newId,
  nowIso,
  safeGitArtifactRelativePath,
  safeProjectRelativePath,
  safeRelativePath
} from "./utils.js";
import {
  PUBLISHED_ARTIFACT_MANIFEST_FILENAME,
  type PublishedArtifactAccessEntry,
  type PublishedArtifactAccessManifest
} from "./published-artifact-access.js";

export interface ProjectEventDraft {
  type: TimelineEvent["type"];
  level?: TimelineEvent["level"];
  agent?: AgentName;
  message: string;
  data?: Record<string, unknown>;
  eventId?: string;
  requestId?: string;
  workflowRevision?: number;
  nodeId?: TimelineEvent["nodeId"];
  nodeRunId?: TimelineEvent["nodeRunId"];
  groupRunId?: TimelineEvent["groupRunId"];
  agentId?: TimelineEvent["agentId"];
  taskId?: TimelineEvent["taskId"];
  executionId?: TimelineEvent["executionId"];
  invocationId?: TimelineEvent["invocationId"];
  ownershipEpoch?: number;
  coordinatorEpoch?: number;
}

interface InvocationCommitJournal {
  version: 1;
  status: "in_progress" | "committed";
  projectId: string;
  invocationId: string;
  startedAt: string;
  committedAt?: string;
  stateBefore: ProjectState;
  messageFilesBefore: string[];
  eventsSize: number;
  timelineSize: number;
}

interface ActiveInvocationCommit {
  invocationId: string;
  bufferedEvents: TimelineEvent[];
  settled: Promise<void>;
  resolveSettled: () => void;
  recoveryError?: Error;
}

interface ActiveProjectMutation {
  count: number;
  settled: Promise<void>;
  resolveSettled: () => void;
}

export interface WorkspaceArtifactSource {
  sourcePath: string;
  /** Canonical path relative to the common project workspace. */
  relativePath: string;
  size: number;
  mediaType: string;
  mtimeMs: number;
}

interface TrustedGitArtifactBinding {
  record: ArtifactRecord;
  execution: Pick<MemberExecution, "id" | "agentId" | "worktreePath">;
  repositoryPath: string;
}

const MAX_GIT_ARTIFACT_BYTES = 128 * 1024 * 1024;

const WORKSPACE_MEMORY_FILE = "Memory.md";
const WORKSPACE_STAT_CONCURRENCY = 64;

function formatResultFormatForRequest(state: ProjectState): string {
  const resultFormat = state.orchestration.resultFormat;
  const presets = resultFormat?.presets ?? [];
  const custom = resultFormat?.custom?.trim() ?? "";
  if (!presets.length && !custom) return "未指定；由 Main 根据用户需求和终止条件判断。";
  return [
    presets.length ? `预设：${presets.join("、")}` : "预设：未选择",
    custom ? `补充说明：${custom}` : ""
  ].filter(Boolean).join("\n");
}

export interface InvocationCommitOptions {
  abortOnControl?: boolean;
}

export interface EventBootstrap {
  events: TimelineEvent[];
  timelineEvents: TimelineEvent[];
  totalEvents: number;
  lastSeq: number;
}

export interface EventHistoryPage {
  events: TimelineEvent[];
  hasMore: boolean;
}

const AGENT_TIMELINE_EVENT_TYPES = new Set<TimelineEvent["type"]>([
  "agent.execution.started",
  "agent.execution.ended",
  "agent.started",
  "agent.experiment.waiting",
  "agent.experiment.resumed",
  "agent.completed",
  "invocation.started",
  "invocation.completed",
  "invocation.performance",
  "invocation.failed",
  "agent.failed",
  "project.completed",
  "project.progress.updated",
  "handoff.saved",
  "route.queued",
  "main.assignment.queued",
  "main.assignment.committed",
  "session.started",
  "session.resume_failed",
  "session.replaced",
  "control.action.staged",
  "control.action.rejected",
  "control.action.committed",
  "control.channel.unavailable",
  "workflow.reconfigured",
  "artifact.published",
  "display.selected",
  "user.intervention.requested",
  "user.intervention.answered",
  "user.input.queued",
  "user.input.delivered",
  "user.input.interrupt.requested",
  "user.input.interrupt.completed",
  "agent.interrupting",
  "agent.interrupted"
]);

const AGENT_CALL_SOURCE_TYPES = new Set([
  "agent.native_binding.opened", "runtime.activity.started", "runtime.activity.closed",
  "scoped.agent.native_opened", "scoped.agent.native_stopped",
  "scoped.final.native.opened", "scoped.final.native.stopped",
  "scoped.leader.released", "scoped.management.round.completed"
]);

function isAgentTimelineEvent(event: TimelineEvent): boolean {
  return AGENT_TIMELINE_EVENT_TYPES.has(event.type) ||
    event.type.startsWith("collaboration.execution.") ||
    typeof event.data?.sourceType === "string" && AGENT_CALL_SOURCE_TYPES.has(event.data.sourceType);
}

function compactTimelineEvent(event: TimelineEvent): TimelineEvent {
  const source = event.data ?? {};
  const data = Object.fromEntries(
    [
      "invocationId",
      "executionId",
      "agentId",
      "taskId",
      "groupRunId",
      "ownershipEpoch",
      "coordinatorEpoch",
      "sourceType",
      "kind",
      "phase",
      "executionNumber",
      "outcome",
      "executionSource",
      "firstInvocationId",
      "latestInvocationId",
      "cycle",
      "requestId",
      "inputId",
      "inputIds",
      "targetMainInvocation",
      "mainInvocation",
      "preview",
      "sourceAgent",
      "sourceInvocationId",
      "reason",
      "candidateAgents",
      "callId",
      "tool",
      "target",
      "nextAgent",
      "addedAgents",
      "removedAgents",
      "changedAgents",
      "agentCount",
      "excerpt",
      "message",
      "request",
      "response",
      "rationale",
      "decisionPlan",
      "artifact",
      "path",
      "threadId",
      "errorType",
      "failureCount",
      "status",
      "mode",
      "deadlineAt",
      "checkpointAgent",
      "forceTerminated",
      "recoverable",
      "percent",
      "performance",
      "evidence",
      "mainWakeOnce",
      "interruptRunningAgent"
    ].flatMap((key) =>
      source[key] === undefined ? [] : [[key, source[key]]]
    )
  );
  const binding = source.binding as { agentId?: string; invocationId?: string; executionContext?: Record<string, unknown> } | undefined;
  if (typeof binding?.agentId === "string") data.agentId ??= binding.agentId;
  if (typeof binding?.invocationId === "string") data.invocationId ??= binding.invocationId;
  const context = binding?.executionContext;
  if (context && typeof context === "object" && !Array.isArray(context)) {
    data.executionContext = Object.fromEntries([
      "role", "executionId", "taskId", "groupRunId", "nodeRunId", "routeScopeId", "ownershipEpoch", "coordinatorEpoch"
    ].flatMap(key => context[key] === undefined ? [] : [[key, context[key]]]));
  }
  return {
    ...event,
    message: "",
    data
  };
}

function orderedRing<T>(ring: T[], total: number, capacity: number): T[] {
  if (total <= capacity) return ring.slice(0, total);
  const start = total % capacity;
  return [...ring.slice(start), ...ring.slice(0, start)];
}

export interface ProjectStorageOptions {
  projectDirectoryAliases?: Readonly<Record<string, string>>;
  /** Trusted SDK host binding only; never supplied by workflow/HTTP input. */
  workspaceResolver?: (projectId: string) => Promise<string | undefined>;
}

export class ProjectStorage {
  private contextIndexPublisher?: (input: { projectId: string; projectPath: string; inboxPath: string; sources: readonly AgentContextSource[] }) => Promise<AgentContextIndex | undefined>;

  configureContextIndexPublisher(publish: NonNullable<ProjectStorage["contextIndexPublisher"]>): void {
    this.contextIndexPublisher = publish;
  }
  private configuredProjectStateStore?: ProjectStateDocumentStore;
  private readOnlyProjectStateStore?: ProjectStateDocumentStore;
  private readonly activeCommits = new Map<string, ActiveInvocationCommit>();
  private readonly activeMutations = new Map<string, ActiveProjectMutation>();
  private readonly projectEpochs = new Map<string, number>();
  private readonly workspacePreparations = new Map<string, Promise<string>>();
  private readonly artifactCatalogReads = new Map<string, Promise<ArtifactListItem[]>>();
  private readonly workflowReferenceWrites = new Map<string, Promise<void>>();
  private readonly workspaceRoots = new Map<string, string>();
  private readonly workspaceResolver?: ProjectStorageOptions["workspaceResolver"];
  private readonly directoryAliases: Readonly<Record<string, string>>;
  private readonly aliasIdentities = new Map<string, { dev: bigint; ino: bigint }>();
  private aliasesVerified = false;

  constructor(
    readonly root: string,
    readonly hub: EventHub,
    options: ProjectStorageOptions = {}
  ) {
    this.directoryAliases = validateProjectDirectoryAliases(options.projectDirectoryAliases ?? {});
    this.workspaceResolver = options.workspaceResolver;
  }

  private readProjectStateSource(): ProjectStateDocumentStore["source"] {
    let value: unknown;
    try { value = JSON.parse(readFileSync(path.join(this.root, "project-state-source.json"), "utf8")); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined; throw error; }
    if (!isRecord(value) || value.protocol !== "project-state-v1" || value.kind !== "sqlite" ||
      typeof value.databasePath !== "string" || !path.isAbsolute(value.databasePath))
      throw new Error("Invalid service-owned formal state source registration");
    return { protocol: "project-state-v1", kind: "sqlite", databasePath: value.databasePath };
  }

  private get projectStateStore(): ProjectStateDocumentStore | undefined {
    if (this.configuredProjectStateStore) return this.configuredProjectStateStore;
    if (this.readOnlyProjectStateStore) return this.readOnlyProjectStateStore;
    const source = this.readProjectStateSource();
    if (source) this.readOnlyProjectStateStore = readOnlyProjectStateDocuments(source);
    return this.readOnlyProjectStateStore;
  }

  configureProjectStateStore(store: ProjectStateDocumentStore): void {
    if (store.source) {
      const source = { ...store.source, databasePath: path.resolve(store.source.databasePath) };
      const prior = this.readProjectStateSource();
      if (prior && !isDeepStrictEqual(prior, source)) throw new Error("Formal state source cannot be silently redirected");
      if (!prior) {
        mkdirSync(this.root, { recursive: true });
        this.atomicJsonSync(path.join(this.root, "project-state-source.json"), source);
      }
    }
    this.configuredProjectStateStore = store;
  }

  publishProjectStateView(document: ProjectStateDocument): void {
    if (document.name !== "project.checkpoint") throw new Error("Project view requires the exact checkpoint document");
    publishProjectStateDocumentView(path.join(this.projectDir(document.projectId), "state.json"), document);
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.projectsDir(), { recursive: true });
    const identities = new Map<string, { dev: bigint; ino: bigint }>();
    try {
      for (const [projectId, alias] of Object.entries(this.directoryAliases)) {
        const physical = path.join(this.projectsDir(), projectId);
        const [physicalInfo, aliasInfo] = await Promise.all([
          fs.lstat(physical, { bigint: true }), fs.lstat(alias, { bigint: true })
        ]);
        const previous = this.aliasIdentities.get(projectId);
        if (!physicalInfo.isDirectory() || !aliasInfo.isDirectory() ||
            physicalInfo.dev !== aliasInfo.dev || physicalInfo.ino !== aliasInfo.ino ||
            (previous && (physicalInfo.dev !== previous.dev || physicalInfo.ino !== previous.ino))) {
          throw new Error("Project alias must refer to the same physical project directory");
        }
        const formal = this.projectStateStore?.domain(projectId);
        const state = formal ? this.projectStateStore!.read(projectId, "project.checkpoint")?.value
          : JSON.parse(await fs.readFile(path.join(physical, "state.json"), "utf8")) as unknown;
        // The existing state loader retains its version/session checks. A
        // directory mapping only verifies registration and physical identity.
        if (!isRecord(state) || state.id !== projectId) {
          throw new Error("Project alias requires an existing registered project");
        }
        identities.set(projectId, { dev: physicalInfo.dev, ino: physicalInfo.ino });
      }
    } catch (error) {
      this.aliasesVerified = false;
      throw error;
    }
    this.aliasIdentities.clear();
    for (const [projectId, identity] of identities) this.aliasIdentities.set(projectId, identity);
    this.aliasesVerified = true;
  }

  projectsDir(): string {
    return path.join(this.root, "projects");
  }

  projectDir(projectId: string): string {
    this.assertProjectId(projectId);
    const physical = path.join(this.projectsDir(), projectId);
    const alias = this.directoryAliases[projectId];
    if (!alias) return physical;
    const expected = this.aliasIdentities.get(projectId);
    if (!this.aliasesVerified || !expected) throw new Error("Project directory alias is not verified");
    // Keep the original native cwd and memory intact. The system maps an
    // explicitly registered directory; Agents still make every task, Git,
    // recovery and completion decision themselves. Never select another
    // history or silently fall back if a deployment mapping changes.
    const physicalInfo = lstatSync(physical, { bigint: true });
    const aliasInfo = lstatSync(alias, { bigint: true });
    if (!physicalInfo.isDirectory() || !aliasInfo.isDirectory() ||
        physicalInfo.dev !== expected.dev || physicalInfo.ino !== expected.ino ||
        aliasInfo.dev !== expected.dev || aliasInfo.ino !== expected.ino) {
      throw new Error("Project alias must retain the same physical project directory");
    }
    return alias;
  }

  /** Protect both deployment spellings of the same private project data. */
  projectDirectoryPaths(projectId: string): string[] {
    return [...new Set([path.join(this.projectsDir(), projectId), this.projectDir(projectId)])];
  }

  private assertProjectId(projectId: string): void {
    if (!/^prj_[a-f0-9]{32}$/.test(projectId)) {
      throw new Error("Invalid project id");
    }
  }

  async createProject(state: ProjectState): Promise<void> {
    const projectDir = this.projectDir(state.id);
    await fs.mkdir(path.join(projectDir, "messages"), { recursive: true });
    await fs.mkdir(path.join(projectDir, "traces"), { recursive: true });
    await fs.mkdir(path.join(projectDir, "runtime"), { recursive: true });
    // All Agents share one durable workspace and project memory.
    await this.projectWorkspace(state.id);
    await this.atomicJson(path.join(projectDir, "state.json"), state);
    await fs.writeFile(path.join(projectDir, "events.jsonl"), "", { flag: "wx" });
    await fs.writeFile(
      path.join(projectDir, "request.md"),
      this.requestMarkdown(state),
      "utf8"
    );
    await fs.writeFile(
      path.join(projectDir, "timeline.md"),
      `# ${state.title} — Agent timeline\n\n`,
      "utf8"
    );
  }

  private requestMarkdown(state: ProjectState): string {
    const orchestration = state.orchestration;
    const agentRows = Object.entries(state.agents)
      .map(
        ([agent, config]) => {
          const definition = agentDefinitionFor(orchestration, agent);
          return `| ${agent} | ${agent === SYSTEM_CONTROLLER_AGENT ? "main" : "worker"} | ${definition.template ?? "general"} | ${config.permission} | ${config.model || "Codex 默认模型"} | ${config.gatewaySnapshot?.reasoning?.label ?? config.gatewayReasoningOption ?? "Provider 默认"} | ${config.webSearch ? "yes" : "no"} | ${config.skills.join(", ") || "—"} | ${(config.autoSkills ?? []).join(", ") || "—"} |`;
        }
      )
      .join("\n");
    const rolePrompts = Object.entries(state.agents)
      .filter(([, config]) => config.instructions)
      .map(
        ([agent, config]) => {
          return `### ${agent}\n\n${agent === SYSTEM_CONTROLLER_AGENT ? config.instructions : effectiveAgentInstructions(agent, config.instructions)}`;
        }
      )
      .join("\n\n");
    return `# Research request

Project ID: \`${state.id}\`

Created: ${state.createdAt}

## User requirement

${state.requirement}

## Supplementary user files

Shared workspace folder: user_inputs/ (readable by all Agents).

${state.inputDescription ? `User note: ${state.inputDescription}` : "No usage note provided."}

${state.inputFiles?.length ? state.inputFiles.map((file) => `- ${JSON.stringify(`user_inputs/${file}`)}`).join("\n") : "No files uploaded at creation."}

## Result format requirement

${formatResultFormatForRequest(state)}

## Agent configuration snapshot

| Agent | Identity | Template | Permission | Model | Gateway reasoning | Web search | Fixed skills | Auto skills |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${agentRows}

## Agent orchestration template

\`\`\`json
${JSON.stringify(orchestration, null, 2)}
\`\`\`

${rolePrompts ? `## Role prompts\n\n${rolePrompts}\n` : ""}
`;
  }

  async saveState(state: ProjectState, beforeCommit?: () => void): Promise<void> {
    await this.mutateProject(state.id, async () => {
      beforeCommit?.();
      state.updatedAt = nowIso();
      await this.atomicJson(
        path.join(this.projectDir(state.id), "state.json"),
        state,
        beforeCommit
      );
    });
  }

  /** Refresh the durable request/config snapshot after an Agent configuration update. */
  async refreshRequestSnapshot(state: ProjectState, beforeCommit?: () => void): Promise<void> {
    beforeCommit?.();
    await this.atomicText(
      path.join(this.projectDir(state.id), "request.md"),
      this.requestMarkdown(state),
      beforeCommit
    );
  }

  /** Internal source read for lifecycle facts that do not reinterpret the
   * workflow. Normal project loading retains its existing format checks. */
  async readStateSnapshot(projectId: string): Promise<unknown> {
    this.assertProjectId(projectId);
    const domain = this.projectStateStore?.domain(projectId);
    return domain ? this.projectStateStore!.read(projectId, "project.checkpoint")?.value
      : JSON.parse(await fs.readFile(path.join(this.projectDir(projectId), "state.json"), "utf8")) as unknown;
  }

  async loadState(projectId: string): Promise<ProjectState> {
    const value = await this.readStateSnapshot(projectId);
    if (!isCurrentMainProjectState(value)) {
      throw new IncompatibleProjectStateError(projectId);
    }
    return value;
  }

  async tryLoadState(projectId: string): Promise<ProjectState | undefined> {
    try {
      return await this.loadState(projectId);
    } catch (error) {
      if (
        (error as NodeJS.ErrnoException).code === "ENOENT" ||
        error instanceof IncompatibleProjectStateError
      ) {
        return undefined;
      }
      throw error;
    }
  }

  async listStates(): Promise<ProjectState[]> {
    await this.initialize();
    const entries = await fs.readdir(this.projectsDir(), { withFileTypes: true });
    const states = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory() && entry.name.startsWith("prj_"))
        .map(async (entry) => {
          await this.waitForInvocationCommit(entry.name);
          return this.tryLoadState(entry.name);
        })
    );
    return states
      .filter((state): state is ProjectState => Boolean(state))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async waitForInvocationCommit(
    projectId: string,
    signal?: AbortSignal
  ): Promise<void> {
    this.assertProjectId(projectId);
    const active = this.activeCommits.get(projectId);
    if (!active || signal?.aborted) return;
    if (signal) {
      await new Promise<void>((resolve) => {
        const abort = () => {
          signal.removeEventListener("abort", abort);
          resolve();
        };
        signal.addEventListener("abort", abort, { once: true });
        void active.settled.then(abort);
      });
    } else {
      await active.settled;
    }
    if (signal?.aborted) return;
    if (active.recoveryError) throw active.recoveryError;
  }

  hasActiveInvocationCommit(projectId: string): boolean {
    this.assertProjectId(projectId);
    return this.activeCommits.has(projectId);
  }

  markInvocationRecoveryRequired(
    projectId: string,
    error: Error
  ): void {
    this.assertProjectId(projectId);
    const active = this.activeCommits.get(projectId);
    if (!active) return;
    active.recoveryError = error;
    active.resolveSettled();
  }

  private projectEpoch(projectId: string): number {
    return this.projectEpochs.get(projectId) ?? 0;
  }

  private advanceProjectEpoch(projectId: string): void {
    this.projectEpochs.set(projectId, this.projectEpoch(projectId) + 1);
  }

  private beginProjectMutation(projectId: string): void {
    this.assertProjectId(projectId);
    const active = this.activeMutations.get(projectId);
    if (active) {
      active.count += 1;
    } else {
      let resolveSettled!: () => void;
      const settled = new Promise<void>((resolve) => {
        resolveSettled = resolve;
      });
      this.activeMutations.set(projectId, {
        count: 1,
        settled,
        resolveSettled
      });
    }
    this.advanceProjectEpoch(projectId);
  }

  private endProjectMutation(projectId: string): void {
    const active = this.activeMutations.get(projectId);
    if (!active) {
      throw new Error(`Project mutation barrier underflow: ${projectId}`);
    }
    this.advanceProjectEpoch(projectId);
    active.count -= 1;
    if (active.count === 0) {
      this.activeMutations.delete(projectId);
      active.resolveSettled();
    }
  }

  private async mutateProject<T>(
    projectId: string,
    mutation: () => Promise<T>
  ): Promise<T> {
    this.beginProjectMutation(projectId);
    try {
      return await mutation();
    } finally {
      this.endProjectMutation(projectId);
    }
  }

  reserveProjectMutation(projectId: string): () => void {
    this.beginProjectMutation(projectId);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.endProjectMutation(projectId);
    };
  }

  private async waitForProjectMutations(
    projectId: string,
    signal?: AbortSignal
  ): Promise<void> {
    this.assertProjectId(projectId);
    const active = this.activeMutations.get(projectId);
    if (!active || signal?.aborted) return;
    if (signal) {
      await new Promise<void>((resolve) => {
        const finish = () => {
          signal.removeEventListener("abort", finish);
          resolve();
        };
        signal.addEventListener("abort", finish, { once: true });
        void active.settled.then(finish);
      });
    } else {
      await active.settled;
    }
  }

  async waitForProjectReadBarrier(
    projectId: string,
    signal?: AbortSignal
  ): Promise<void> {
    while (!signal?.aborted) {
      await this.waitForInvocationCommit(projectId, signal);
      await this.waitForProjectMutations(projectId, signal);
      if (
        !this.activeCommits.has(projectId) &&
        !this.activeMutations.has(projectId)
      ) {
        return;
      }
    }
  }

  hasActiveProjectMutation(projectId: string): boolean {
    this.assertProjectId(projectId);
    return this.activeMutations.has(projectId);
  }

  /** Permanently remove one settled project and every file owned by it. */
  async deleteProject(projectId: string): Promise<void> {
    this.assertProjectId(projectId);
    await this.waitForProjectReadBarrier(projectId);
    await this.workspacePreparations.get(projectId)?.catch(() => undefined);
    await this.mutateProject(projectId, async () => {
      if (this.activeCommits.has(projectId)) {
        throw new Error("Project has an active invocation commit");
      }
      await fs.rm(this.projectDir(projectId), { recursive: true, force: false });
    });
    this.workspacePreparations.delete(projectId);
    this.projectEpochs.delete(projectId);
  }

  private async stableProjectRead<T>(
    projectId: string,
    read: () => Promise<T>
  ): Promise<T> {
    while (true) {
      await this.waitForProjectReadBarrier(projectId);
      const epoch = this.projectEpoch(projectId);
      let outcome:
        | { ok: true; value: T }
        | { ok: false; error: unknown };
      try {
        outcome = { ok: true, value: await read() };
      } catch (error) {
        outcome = { ok: false, error };
      }
      if (
        epoch !== this.projectEpoch(projectId) ||
        this.activeCommits.has(projectId) ||
        this.activeMutations.has(projectId)
      ) {
        continue;
      }
      if (!outcome.ok) throw outcome.error;
      return outcome.value;
    }
  }

  async withStableProjectSnapshot<T>(
    projectId: string,
    read: () => Promise<T>
  ): Promise<T> {
    return this.stableProjectRead(projectId, read);
  }

  private async stableEventSnapshotSize(
    projectId: string,
    signal?: AbortSignal
  ): Promise<number | undefined> {
    const eventsPath = path.join(this.projectDir(projectId), "events.jsonl");
    while (!signal?.aborted) {
      await this.waitForProjectReadBarrier(projectId, signal);
      if (signal?.aborted) return undefined;
      const epoch = this.projectEpoch(projectId);
      let outcome:
        | { ok: true; size: number }
        | { ok: false; error: unknown };
      try {
        outcome = { ok: true, size: (await fs.stat(eventsPath)).size };
      } catch (error) {
        outcome = { ok: false, error };
      }
      if (
        epoch !== this.projectEpoch(projectId) ||
        this.activeCommits.has(projectId) ||
        this.activeMutations.has(projectId)
      ) {
        continue;
      }
      if (!outcome.ok) throw outcome.error;
      return outcome.size;
    }
    return undefined;
  }

  async listSummaries(): Promise<ProjectSummary[]> {
    return (await this.listStates()).map((state) => ({
      id: state.id,
      title: state.title,
      requirement: state.requirement,
      status: state.status,
      phase: state.phase,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
      currentAgent: state.currentAgent,
      queuedAgent: state.queuedAgent,
      turn: state.turn,
      cycle: state.cycle
    }));
  }

  async reconcileEventLog(state: ProjectState): Promise<void> {
    const eventsPath = path.join(this.projectDir(state.id), "events.jsonl");
    await this.trimResidualJsonlTail(eventsPath);
    const raw = await fs.readFile(eventsPath, "utf8");
    let maxSeq = 0;
    for (const line of raw.split("\n")) {
      if (!line) continue;
      try {
        const parsed = JSON.parse(line) as { seq?: unknown };
        if (
          typeof parsed.seq === "number" &&
          Number.isSafeInteger(parsed.seq) &&
          parsed.seq > maxSeq
        ) {
          maxSeq = parsed.seq;
        }
      } catch {
        // A complete but malformed historical line does not contribute a seq.
      }
    }
    state.eventSeq = Math.max(state.eventSeq, maxSeq);
  }

  async appendEvent(state: ProjectState, draft: ProjectEventDraft, beforeCommit?: () => void): Promise<TimelineEvent> {
    return this.mutateProject(state.id, () =>
      this.appendEventUntracked(state, draft, beforeCommit)
    );
  }

  private async appendEventUntracked(
    state: ProjectState,
    draft: ProjectEventDraft,
    beforeCommit?: () => void
  ): Promise<TimelineEvent> {
    beforeCommit?.();
    const projectDir = this.projectDir(state.id);
    const eventsPath = path.join(projectDir, "events.jsonl");
    // Keep the repair before the first async yield. Besides making the
    // repair+append ordering explicit, callers cannot observe the in-memory
    // "agent started" transition before the matching event append is issued.
    this.trimResidualJsonlTailSync(eventsPath);
    state.eventSeq += 1;
    state.updatedAt = nowIso();
    const event: TimelineEvent = {
      id: newId("evt"),
      ...(draft.eventId ? { eventId: draft.eventId } : {}),
      ...(draft.requestId ? { requestId: draft.requestId } : {}),
      seq: state.eventSeq,
      projectId: state.id,
      ...(draft.workflowRevision !== undefined
        ? { workflowRevision: draft.workflowRevision }
        : {}),
      ...(draft.nodeId ? { nodeId: draft.nodeId } : {}),
      ...(draft.nodeRunId ? { nodeRunId: draft.nodeRunId } : {}),
      ...(draft.groupRunId ? { groupRunId: draft.groupRunId } : {}),
      ...(draft.agentId ? { agentId: draft.agentId } : {}),
      ...(draft.taskId ? { taskId: draft.taskId } : {}),
      ...(draft.executionId ? { executionId: draft.executionId } : {}),
      ...(draft.invocationId ? { invocationId: draft.invocationId } : {}),
      ...(draft.ownershipEpoch !== undefined
        ? { ownershipEpoch: draft.ownershipEpoch }
        : {}),
      ...(draft.coordinatorEpoch !== undefined
        ? { coordinatorEpoch: draft.coordinatorEpoch }
        : {}),
      ts: state.updatedAt,
      type: draft.type,
      level: draft.level ?? "info",
      agent: draft.agent,
      message: draft.message,
      data: { cycle: state.cycle, ...draft.data }
    };
    beforeCommit?.();
    await fs.appendFile(
      eventsPath,
      `${JSON.stringify(event)}\n`,
      "utf8"
    );
    beforeCommit?.();
    const agentLabel = event.agent ? ` · ${event.agent}` : "";
    await fs.appendFile(
      path.join(projectDir, "timeline.md"),
      `- ${event.ts} · **${event.type}**${agentLabel} · ${event.message.replaceAll("\n", " ")}\n`,
      "utf8"
    );
    beforeCommit?.();
    await this.atomicJson(path.join(projectDir, "state.json"), state, beforeCommit);
    if (
      draft.type === "project.config.updated" ||
      draft.type === "workflow.reconfigured"
    ) {
      await this.atomicText(
        path.join(projectDir, "request.md"),
        this.requestMarkdown(state),
        beforeCommit
      );
    }
    beforeCommit?.();
    const activeCommit = this.activeCommits.get(state.id);
    if (activeCommit) {
      activeCommit.bufferedEvents.push(event);
    } else {
      this.hub.publish(event);
    }
    return event;
  }

  async readEvents(
    projectId: string,
    afterSeq = 0,
    limit = 10_000
  ): Promise<TimelineEvent[]> {
    const events: TimelineEvent[] = [];
    // Capture a committed byte prefix once. Later trace appends must not
    // invalidate the entire read and starve projections or control requests.
    await this.replayEvents(projectId, afterSeq, (event) => {
      events.push(event);
    });
    return events.slice(-Math.max(1, limit));
  }

  async readEventBootstrap(
    projectId: string,
    limit = 1_000
  ): Promise<EventBootstrap> {
    const boundedLimit = Math.max(1, Math.min(5_000, Math.floor(limit)));
    const recent = new Array<TimelineEvent>(boundedLimit);
    const timelineEvents: TimelineEvent[] = [];
    let totalEvents = 0;
    let lastSeq = 0;
    await this.replayEvents(projectId, 0, (event) => {
      recent[totalEvents % boundedLimit] = event;
      totalEvents += 1;
      lastSeq = Math.max(lastSeq, event.seq);
      if (isAgentTimelineEvent(event)) {
        timelineEvents.push(compactTimelineEvent(event));
      }
    });
    return {
      events: orderedRing(recent, totalEvents, boundedLimit),
      timelineEvents,
      totalEvents,
      lastSeq
    };
  }

  async readEventHistory(
    projectId: string,
    beforeSeq: number,
    limit = 1_000
  ): Promise<EventHistoryPage> {
    const boundedLimit = Math.max(1, Math.min(5_000, Math.floor(limit)));
    const recent = new Array<TimelineEvent>(boundedLimit);
    let matchingEvents = 0;
    await this.replayEvents(projectId, 0, (event) => {
      if (event.seq >= beforeSeq) return;
      recent[matchingEvents % boundedLimit] = event;
      matchingEvents += 1;
    });
    return {
      events: orderedRing(recent, matchingEvents, boundedLimit),
      hasMore: matchingEvents > boundedLimit
    };
  }

  async replayEvents(
    projectId: string,
    afterSeq: number,
    visit: (event: TimelineEvent) => Promise<boolean | void> | boolean | void,
    signal?: AbortSignal
  ): Promise<void> {
    const snapshotSize = await this.stableEventSnapshotSize(projectId, signal);
    if (signal?.aborted || snapshotSize === undefined || snapshotSize === 0) {
      return;
    }
    const input = createReadStream(
      path.join(this.projectDir(projectId), "events.jsonl"),
      { encoding: "utf8", start: 0, end: snapshotSize - 1 }
    );
    const lines = readline.createInterface({
      input,
      crlfDelay: Infinity
    });
    try {
      for await (const line of lines) {
        if (signal?.aborted) break;
        if (!line) continue;
        let event: TimelineEvent;
        try {
          event = JSON.parse(line) as TimelineEvent;
        } catch {
          // Ignore malformed historical lines; startup reconciliation removes
          // the common partial-tail case before projects are served.
          continue;
        }
        if (event.seq > afterSeq) {
          const shouldContinue = await visit(event);
          if (shouldContinue === false) break;
        }
      }
    } finally {
      lines.close();
      input.destroy();
    }
  }

  async beginInvocationCommit(
    state: ProjectState,
    invocationId: string
  ): Promise<void> {
    this.assertInvocationId(invocationId);
    const projectDir = this.projectDir(state.id);
    const current = this.activeCommits.get(state.id);
    if (current) {
      throw new Error(
        `Project ${state.id} already has active invocation commit ${current.invocationId}`
      );
    }
    const stateBefore = structuredClone(state);
    const transactionDir = this.transactionDir(state.id, invocationId);
    const existingJournal = await this.tryReadCommitJournal(
      state.id,
      invocationId
    );
    if (existingJournal) {
      throw new Error(`Invocation commit already exists: ${invocationId}`);
    }

    // A directory without an atomically-installed journal can only be residue
    // from an interrupted begin. No authoritative file has changed at that point.
    await fs.rm(transactionDir, { recursive: true, force: true });
    await fs.mkdir(transactionDir, { recursive: true });

    try {
      const [messageFilesBefore, eventsStat, timelineStat] = await Promise.all([
        // beginInvocationCommit already runs inside the project's serialized
        // write queue. Using the reader-facing barrier here could wait on a
        // control event reserved behind this very begin operation.
        fs.readdir(path.join(projectDir, "messages")),
        fs.stat(path.join(projectDir, "events.jsonl")),
        fs.stat(path.join(projectDir, "timeline.md"))
      ]);

      const journal: InvocationCommitJournal = {
        version: 1,
        status: "in_progress",
        projectId: state.id,
        invocationId,
        startedAt: nowIso(),
        stateBefore,
        messageFilesBefore: [...messageFilesBefore].sort(),
        eventsSize: eventsStat.size,
        timelineSize: timelineStat.size
      };

      // Installing this file is the transaction's durable begin marker. It is
      // deliberately the final operation after every snapshot and backup.
      await this.atomicJson(
        path.join(transactionDir, "journal.json"),
        journal
      );
      let resolveSettled!: () => void;
      const settled = new Promise<void>((resolve) => {
        resolveSettled = resolve;
      });
      this.activeCommits.set(state.id, {
        invocationId,
        bufferedEvents: [],
        settled,
        resolveSettled
      });
      this.advanceProjectEpoch(state.id);
    } catch (error) {
      await fs.rm(transactionDir, { recursive: true, force: true }).catch(() => {
        // The journal was never installed, so leftover backup data is inert.
      });
      throw error;
    }
  }

  async commitInvocationCommit(
    state: ProjectState,
    invocationId: string,
    options: InvocationCommitOptions = {}
  ): Promise<void> {
    this.assertInvocationId(invocationId);
    const active = this.activeCommits.get(state.id);
    if (active && active.invocationId !== invocationId) {
      throw new Error(
        `Active invocation commit mismatch: expected ${active.invocationId}, received ${invocationId}`
      );
    }

    const journal = await this.readCommitJournal(state.id, invocationId);
    const transactionDir = this.transactionDir(state.id, invocationId);
    if (journal.status !== "committed") {
      if (
        options.abortOnControl &&
        (state.status === "cancelling" ||
          state.status === "cancelled" ||
          state.status === "pausing" ||
          state.status === "paused")
      ) {
        throw new Error(
          `Invocation commit superseded by project control state: ${state.status}`
        );
      }
      journal.status = "committed";
      journal.committedAt = nowIso();
      // The control check and durable marker installation are one synchronous
      // event-loop turn. A pause/cancel therefore linearizes either before
      // this marker (and forces rollback) or after the committed result.
      this.atomicJsonSync(
        path.join(transactionDir, "journal.json"),
        journal
      );
    }

    const bufferedEvents =
      active?.invocationId === invocationId ? active.bufferedEvents : [];
    this.activeCommits.delete(state.id);
    active?.resolveSettled();
    for (const event of bufferedEvents) {
      try {
        this.hub.publish(event);
      } catch {
        // A listener cannot make an already-durable commit fail or prevent
        // later buffered events from reaching other subscribers.
      }
    }
    await fs.rm(transactionDir, { recursive: true, force: true }).catch(() => {
      // A committed journal is safe to clean during the next startup recovery.
    });
  }

  async rollbackInvocationCommit(
    state: ProjectState,
    invocationId: string
  ): Promise<void> {
    this.assertInvocationId(invocationId);
    const active = this.activeCommits.get(state.id);
    if (active && active.invocationId !== invocationId) {
      throw new Error(
        `Active invocation commit mismatch: expected ${active.invocationId}, received ${invocationId}`
      );
    }

    const journal = await this.tryReadCommitJournal(state.id, invocationId);
    if (!journal) {
      const current = this.activeCommits.get(state.id);
      this.activeCommits.delete(state.id);
      current?.resolveSettled();
      await fs.rm(this.transactionDir(state.id, invocationId), {
        recursive: true,
        force: true
      });
      return;
    }
    if (journal.status === "committed") {
      const current = this.activeCommits.get(state.id);
      this.activeCommits.delete(state.id);
      current?.resolveSettled();
      await fs.rm(this.transactionDir(state.id, invocationId), {
        recursive: true,
        force: true
      }).catch(() => {
        // A later recovery pass can remove an already-committed journal.
      });
      return;
    }

    try {
      await this.restoreInvocationCommit(journal, state);
    } catch (error) {
      const current = this.activeCommits.get(state.id);
      if (current?.invocationId === invocationId) {
        current.recoveryError = new Error(
          `Invocation storage recovery is required: ${(error as Error).message}`
        );
        current.resolveSettled();
      }
      throw error;
    }
  }

  /** Retry only a commit whose original invocation has already failed and
   * released its native execution. A live commit is never rolled back by a
   * background scheduler. The exact existing journal remains the authority. */
  async retryFailedInvocationRecovery(state: ProjectState): Promise<boolean> {
    this.assertProjectId(state.id);
    const active = this.activeCommits.get(state.id);
    if (!active) return false;
    if (!active.recoveryError) throw new Error("Original invocation commit has not reached its failed recovery boundary");
    await this.rollbackInvocationCommit(state, active.invocationId);
    return true;
  }

  async recoverIncompleteCommits(): Promise<void> {
    await this.initialize();
    const projects = await fs.readdir(this.projectsDir(), {
      withFileTypes: true
    });
    for (const project of projects) {
      if (
        !project.isDirectory() ||
        !/^prj_[a-f0-9]{32}$/.test(project.name)
      ) {
        continue;
      }
      const transactionsDir = path.join(
        this.projectDir(project.name),
        ".transactions"
      );
      const formalJournal = this.projectStateStore?.domain(project.name)
        ? this.projectStateStore.read(project.name, "invocation.commit")?.value as InvocationCommitJournal | null : undefined;
      if (formalJournal?.status === "in_progress") {
        const directory = this.transactionDir(project.name, formalJournal.invocationId);
        if (!(await fs.stat(directory).catch(() => undefined))?.isDirectory())
          throw new Error("Authoritative invocation recovery is missing its original backup directory");
      }
      let transactions: Dirent[];
      try {
        transactions = await fs.readdir(transactionsDir, {
          withFileTypes: true
        });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
        throw error;
      }

      for (const transaction of transactions) {
        if (!transaction.isDirectory()) continue;
        try {
          this.assertInvocationId(transaction.name);
        } catch {
          // Never derive a removal or restore target from an invalid entry.
          continue;
        }

        const transactionDir = this.transactionDir(
          project.name,
          transaction.name
        );
        const journal = await this.tryReadCommitJournal(
          project.name,
          transaction.name
        );
        if (!journal || journal.status === "committed") {
          await fs.rm(transactionDir, {
            recursive: true,
            force: true
          }).catch(() => {
            // Cleanup of inert/committed transaction data is best effort.
          });
          continue;
        }
        await this.restoreInvocationCommit(journal);
      }
    }
  }

  async writeInbox(
    state: ProjectState,
    agent: AgentName,
    invocationId: string,
    content: string
  ): Promise<string> {
    this.assertInvocationId(invocationId);
    const fileName = `${String(state.turn + 1).padStart(4, "0")}_${invocationId}_to_${agent}.md`;
    const filePath = path.join(this.projectDir(state.id), "messages", fileName);
    await this.atomicText(filePath, content);
    return filePath;
  }

  async readHandoff(projectId: string, invocationId: string): Promise<string> {
    this.assertInvocationId(invocationId);
    const root = await fs.realpath(this.projectDir(projectId));
    const directory = await fs.realpath(path.join(root, "messages"));
    this.assertDescendant(root, directory, "handoff directory");
    const files = (await fs.readdir(directory)).filter((name) =>
      new RegExp(`^\\d+_[A-Za-z0-9_-]+_${invocationId}_handoff\\.md$`).test(name));
    if (files.length !== 1) throw new Error("Saved handoff not found or ambiguous");
    const file = await fs.realpath(path.join(directory, files[0]));
    this.assertDescendant(directory, file, "handoff");
    return fs.readFile(file, "utf8");
  }

  /**
   * Keep Main's authoring file intact across invocations and restarts. Refresh
   * a separate server-owned reference; an old draft retains its original base.
   * Neither file has authority until apply_workflow validates the proposal.
   */
  async writeMainAgentOrchestrationSnapshot(
    projectId: string,
    fileName: string,
    document: unknown,
    isCurrent?: () => boolean,
    invocationId = "inv_agent_orchestration_snapshot"
  ): Promise<string> {
    const filePath = await this.mainAgentOrchestrationSnapshotPath(projectId, fileName, invocationId);
    const workspace = path.dirname(filePath);
    this.assertDescendant(workspace, filePath, "Main Agent orchestration snapshot");
    const currentPath = path.join(workspace, MAIN_AGENT_ORCHESTRATION_CURRENT_FILE);
    if (filePath === currentPath) throw new Error("Main's draft and current configuration reference must be separate files");
    const content = `${JSON.stringify(document, null, 2)}\n`;
    // Exclusive creation also preserves an Agent file created concurrently.
    // Even incomplete or invalid drafts belong to Main; never parse/reset them.
    try { await fs.writeFile(filePath, content, { flag: "wx", mode: 0o600 }); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      await this.assertMainWorkflowDocumentFile(filePath);
    }
    await this.writeMainWorkflowCurrentReference(workspace, content, isCurrent);
    return filePath;
  }

  /** Update the authoritative read reference after publication/recovery without
   * creating, reading, replacing or rebasing Main's authoring file. */
  async writeMainAgentOrchestrationCurrentSnapshot(projectId: string, document: unknown, isCurrent?: () => boolean): Promise<void> {
    const workspace = path.dirname(await this.mainAgentOrchestrationSnapshotPath(projectId, MAIN_AGENT_ORCHESTRATION_FILE, "inv_workflow_current_snapshot"));
    await this.writeMainWorkflowCurrentReference(workspace, `${JSON.stringify(document, null, 2)}\n`, isCurrent);
  }

  /** The coordinator supplies its already assigned canonical management cwd;
   * this never creates a worktree or chooses a new Agent/task workspace. */
  async writeManagementWorkflowCurrentSnapshot(workspace: string, document: unknown, isCurrent?: () => boolean): Promise<void> {
    if (path.resolve(workspace) !== workspace || await fs.realpath(workspace) !== workspace || !(await fs.lstat(workspace)).isDirectory())
      throw new Error("Management workflow reference requires its original canonical workspace");
    await this.writeMainWorkflowCurrentReference(workspace, `${JSON.stringify(document, null, 2)}\n`, isCurrent);
  }

  private async assertMainWorkflowDocumentFile(target: string): Promise<void> {
    const info = await fs.lstat(target);
    if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1 || await fs.realpath(target) !== target)
      throw new Error("Main's workflow document is not a canonical regular file");
  }

  private async writeMainWorkflowCurrentReference(workspace: string, content: string, isCurrent?: () => boolean): Promise<void> {
    const previous = this.workflowReferenceWrites.get(workspace) ?? Promise.resolve();
    const write = previous.catch(() => undefined).then(async () => {
      // Read the real journal only after earlier writes finish. An old Main
      // preparation must not overwrite a newer publication's reference.
      if (isCurrent && !isCurrent()) return;
      await this.writeMainWorkflowCurrentFile(workspace, content, isCurrent);
    });
    this.workflowReferenceWrites.set(workspace, write);
    try { await write; }
    finally { if (this.workflowReferenceWrites.get(workspace) === write) this.workflowReferenceWrites.delete(workspace); }
  }

  private async writeMainWorkflowCurrentFile(workspace: string, content: string, isCurrent?: () => boolean): Promise<void> {
    const currentPath = path.join(workspace, MAIN_AGENT_ORCHESTRATION_CURRENT_FILE);
    const referenceDirectory = path.dirname(currentPath);
    try { await fs.mkdir(referenceDirectory, { mode: 0o700 }); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
    const directoryInfo = await fs.lstat(referenceDirectory);
    if (!directoryInfo.isDirectory() || directoryInfo.isSymbolicLink() || await fs.realpath(referenceDirectory) !== referenceDirectory)
      throw new Error("Main's current workflow reference directory is not canonical");
    try { await this.assertMainWorkflowDocumentFile(currentPath); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    const staleReference = new Error("Stale current workflow reference");
    try {
      await this.atomicText(currentPath, content, () => { if (isCurrent && !isCurrent()) throw staleReference; });
    } catch (error) {
      if (error !== staleReference) throw error;
    }
  }

  /** Only the trusted external-workspace host uses an isolated proposal path. */
  private async mainAgentOrchestrationSnapshotPath(projectId: string, fileName: string, invocationId: string): Promise<string> {
    this.assertInvocationId(invocationId);
    const workspace = await this.roleWorkspace(projectId, SYSTEM_CONTROLLER_AGENT, invocationId);
    const selected = await this.workspaceResolver?.(projectId);
    let directory = workspace;
    if (selected !== undefined) {
      for (const segment of [".scienceevolve", "management", projectId, "proposal"]) {
        directory = path.join(directory, segment);
        await fs.mkdir(directory, { mode: 0o700 }).catch((error: NodeJS.ErrnoException) => {
          if (error.code !== "EEXIST") throw error;
        });
        const info = await fs.lstat(directory);
        if (!info.isDirectory() || info.isSymbolicLink() || await fs.realpath(directory) !== directory) {
          throw new Error("Workflow proposal directory must be a pinned real directory");
        }
      }
    }
    const filePath = path.join(directory, safeRelativePath(fileName));
    this.assertDescendant(directory, filePath, "Main Agent orchestration snapshot");
    return filePath;
  }

  async readMainAgentOrchestrationSnapshot(projectId: string, fileName: string, invocationId: string): Promise<Buffer> {
    const filePath = await this.mainAgentOrchestrationSnapshotPath(projectId, fileName, invocationId);
    const info = await fs.lstat(filePath);
    if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1 || info.size > 4 * 1024 * 1024 ||
        await fs.realpath(filePath) !== filePath) throw new Error("Workflow proposal must be a bounded private regular file");
    return fs.readFile(filePath);
  }

  async writeHandoff(
    state: ProjectState,
    agent: AgentName,
    invocationId: string,
    markdown: string
  ): Promise<string> {
    this.assertInvocationId(invocationId);
    const completion = Object.values(state.taskCompletions ?? {}).find((item) =>
      item.agent === agent && item.invocationId === invocationId);
    if (completion?.handoffPath) return completion.handoffPath;
    const fileName = `${String(state.turn).padStart(4, "0")}_${agent}_${invocationId}_handoff.md`;
    const filePath = path.join(this.projectDir(state.id), "messages", fileName);
    await this.atomicText(filePath, markdown);
    if (completion) {
      // This is a mechanism receipt, not a business judgement or a new handoff.
      const accepted: TaskCompletionRecord = { ...completion, status: "accepted", handoffPath: filePath, acceptedAt: nowIso() };
      await this.atomicJson(this.taskCompletionPath(state.id, completion.taskId), accepted);
      state.taskCompletions![completion.taskId] = accepted;
      // Handoff persistence can run outside an invocation commit (for example
      // scoped delivery recovery). Keep the project snapshot in sync with the
      // accepted completion record so a restart cannot regress it to requested.
      await this.atomicJson(path.join(this.projectDir(state.id), "state.json"), state);
    }
    return filePath;
  }

  private taskCompletionPath(projectId: string, taskId: string): string {
    return path.join(this.projectDir(projectId), "runtime", "task-completions", `${createHash("sha256").update(taskId).digest("hex")}.json`);
  }

  async requestTaskCompletion(state: ProjectState, taskId: string, envelope: ControlActionEnvelope,
    options: { executionWorktree?: string } = {}): Promise<TaskCompletionRecord> {
    if (envelope.action.tool !== "finish_task" || envelope.projectId !== state.id || !taskId) throw new Error("Task completion identity is invalid");
    const action = envelope.action;
    for (const content of [action.summary, action.memory]) {
      if (content !== undefined && (typeof content !== "string" || !content.trim() || content.length > 100_000)) throw new Error("Task completion content is invalid");
    }
    return this.mutateProject(state.id, async () => {
      const receiptPath = this.taskCompletionPath(state.id, taskId);
      let existing: TaskCompletionRecord | undefined;
      try { existing = JSON.parse(await fs.readFile(receiptPath, "utf8")) as TaskCompletionRecord; }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
      if (existing) {
        if (existing.agent !== envelope.agent || existing.taskId !== taskId) throw new Error("Task completion belongs to another Agent/task");
        if (options.executionWorktree) await this.saveGitTaskMemory(state.id, taskId, envelope.agent,
          existing.memory ?? existing.summary, options.executionWorktree);
        state.taskCompletions = { ...state.taskCompletions, [taskId]: existing };
        return existing;
      }
      const record: TaskCompletionRecord = { taskId, agent: envelope.agent, invocationId: envelope.invocationId,
        callId: envelope.callId, requestedAt: envelope.receivedAt, status: "requested",
        ...(action.summary ? { summary: action.summary } : {}), ...(action.memory ? { memory: action.memory } : {}) };
      if (options.executionWorktree) record.memoryPath = await this.saveGitTaskMemory(state.id, taskId,
        envelope.agent, action.memory ?? action.summary, options.executionWorktree);
      else if (action.memory) record.memoryPath = (await this.saveRoleMemorySnapshot(state.id, envelope.agent,
        action.memory, { runtimeOnly: state.git?.enabled === true })).path;
      await fs.mkdir(path.dirname(receiptPath), { recursive: true, mode: 0o700 });
      await this.atomicJson(receiptPath, record);
      state.taskCompletions = { ...state.taskCompletions, [taskId]: record };
      await this.atomicJson(path.join(this.projectDir(state.id), "state.json"), state);
      return record;
    });
  }

  /** Save exactly the Agent-authored logical-task record in its actual Git
   * worktree. Repeated finish_task calls reuse it; Git publication remains an
   * explicit Agent action and includes this file like every other file. */
  private async saveGitTaskMemory(projectId: string, taskId: string, agent: string,
    content: string | undefined, worktree: string): Promise<string> {
    if (!content?.trim()) throw new Error("This Git task must update its Memory before completion. Supply your verified task memory or summary to finish_task, then stage, commit and deliver the work record with the other workspace files.");
    if (!/^[\p{L}\p{N}][\p{L}\p{N}._-]*$/u.test(agent)) throw new Error("Agent memory identity is invalid");
    const root = await fs.realpath(worktree);
    this.assertDescendant(await fs.realpath(this.projectDir(projectId)), root, "Git task workspace");
    const directory = path.join(root, "agent-memory", agent);
    for (const parent of [path.dirname(directory), directory]) {
      await fs.mkdir(parent, { mode: 0o700 }).catch((error: NodeJS.ErrnoException) => { if (error.code !== "EEXIST") throw error; });
      if (!(await fs.lstat(parent)).isDirectory() || await fs.realpath(parent) !== parent) throw new Error("Git task memory directory is not canonical");
    }
    const target = path.join(directory, "Memory.md");
    let previous = "";
    try {
      const info = await fs.lstat(target);
      if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1) throw new Error("Git task Memory must be a regular file");
      previous = await fs.readFile(target, "utf8");
    } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    const marker = `<!-- ScienceEvolve task memory ${createHash("sha256").update(taskId).digest("hex")} -->`;
    if (!previous.split("\n").includes(marker)) await this.atomicText(target,
      `${previous}${previous && !previous.endsWith("\n") ? "\n" : ""}\n${marker}\n## Task ${taskId}\n\n${content.trim()}\n`);
    return target;
  }

  /** Rehydrate an existing Agent-authored record when upgrading a paused
   * task. Preserve its immutable receipt and never invent replacement text. */
  async synchronizeGitTaskMemory(state: ProjectState, taskId: string, agent: string, worktree: string): Promise<void> {
    const record = state.taskCompletions?.[taskId];
    if (!record) return;
    if (record.agent !== agent) throw new Error("Git task memory belongs to another Agent");
    await this.mutateProject(state.id, () => this.saveGitTaskMemory(state.id, taskId, agent,
      record.memory ?? record.summary, worktree).then(() => undefined));
  }

  /** Materialize an already accepted S receipt. The contents are authored by
   * the original Agent; this mechanism writes no business report, task record
   * or old Memory.md. Missing files after a crash can be restored from S. */
  async saveTerminalPushObservationCompletion(record: TerminalPushObservationCompletionRecord): Promise<{
    receiptPath: string; memoryPath?: string;
  }> {
    this.assertInvocationId(record.invocationId);
    if (!record.executionId || !record.operationId || !record.originalInvocationId ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(record.agentId) ||
      !Number.isSafeInteger(record.ownershipEpoch) || record.ownershipEpoch < 1 ||
      !Number.isSafeInteger(record.writerLeaseEpoch) || record.writerLeaseEpoch < 1 ||
      !/^[a-f0-9]{64}$/.test(record.capabilityHash) ||
      record.memory !== undefined && (typeof record.memory !== "string" || !record.memory.trim() || record.memory.length > 100_000 ||
        record.memorySha256 !== createHash("sha256").update(record.memory).digest("hex")) ||
      record.memory === undefined && record.memorySha256 !== undefined) {
      throw new Error("Terminal observation receipt is not the exact accepted Agent memory record");
    }
    return this.saveAgentSupplementCompletion(record, "terminal-push-observation");
  }

  /** Restore the exact S-accepted closing supplement after any materialization
   * failure. Original business memory, completion and report stay untouched. */
  async saveScopedWorktreeClosingCompletion(record: ScopedWorktreeClosingCompletionRecord): Promise<{
    receiptPath: string; memoryPath?: string;
  }> {
    this.assertInvocationId(record.invocationId);
    if (!record.executionId || !record.grantInvocationId || !record.grantCallId ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(record.agentId) || !/^[a-f0-9]{40}$/i.test(record.reportHeadSha) ||
      !validateSessionRef(record.originalSession).valid || record.originalSession.durable !== true ||
      !Number.isSafeInteger(record.ownershipEpoch) || record.ownershipEpoch < 1 ||
      !Number.isSafeInteger(record.writerLeaseEpoch) || record.writerLeaseEpoch < 1 || !/^[a-f0-9]{64}$/.test(record.capabilityHash) ||
      !record.callId || record.callId.length > 512 || /[\s\u0000-\u001f\u007f]/u.test(record.callId) ||
      !Number.isFinite(Date.parse(record.requestedAt)) || !Number.isFinite(Date.parse(record.acceptedAt)) ||
      [record.summary, record.memory].some(content => content !== undefined && (typeof content !== "string" || !content.trim() ||
        content.length > 100_000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(content))) ||
      record.memory !== undefined && record.memorySha256 !== createHash("sha256").update(record.memory).digest("hex") ||
      record.memory === undefined && record.memorySha256 !== undefined) {
      throw new Error("Closing supplement is not the exact accepted original Agent receipt");
    }
    return this.saveAgentSupplementCompletion(record, "worktree-closing");
  }

  /** Materialize only the manager's own accepted S finish/memory. This does
   * not overwrite the original role's task completion or retained Memory.md. */
  async saveTerminalPushCoordinatorCompletion(turn: TerminalPushCoordinatorTurn): Promise<{
    receiptPath: string; memoryPath?: string;
  }> {
    const completion = turn.completion;
    if (!completion || completion.action.tool !== "finish_task" || completion.projectId !== turn.projectId ||
      completion.agent !== turn.agentId || completion.invocationId !== turn.invocationId ||
      completion.capabilityHash !== turn.capabilityHash || completion.stateVersion !== turn.coordinatorEpoch ||
      !turn.incidentId || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(turn.agentId) ||
      !Number.isSafeInteger(turn.level) || turn.level < 0 || !Number.isSafeInteger(turn.coordinatorEpoch) || turn.coordinatorEpoch < 1 ||
      !Number.isSafeInteger(turn.writerLeaseEpoch) || turn.writerLeaseEpoch < 1 || !/^[a-f0-9]{64}$/.test(turn.capabilityHash) ||
      completion.action.memory !== undefined && (typeof completion.action.memory !== "string" || !completion.action.memory.trim() ||
        completion.action.memory.length > 100_000 || completion.action.memory.includes("\0"))) {
      throw new Error("Receipt manager finish does not match its original accepted S turn");
    }
    const record = { projectId: turn.projectId, invocationId: turn.invocationId, incidentId: turn.incidentId,
      agentId: turn.agentId, level: turn.level, coordinatorEpoch: turn.coordinatorEpoch, writerLeaseEpoch: turn.writerLeaseEpoch,
      completion, ...(completion.action.memory === undefined ? {} : { memory: completion.action.memory }) };
    return this.saveAgentSupplementCompletion(record, "terminal-push-coordination");
  }

  private async saveAgentSupplementCompletion(record: { projectId: string; invocationId: string; memory?: string },
    directoryName: "terminal-push-observation" | "terminal-push-coordination" | "worktree-closing"): Promise<{ receiptPath: string; memoryPath?: string }> {
    this.assertInvocationId(record.invocationId);
    return this.mutateProject(record.projectId, async () => {
      const root = await fs.realpath(this.projectDir(record.projectId));
      let directory = root;
      // Create one trusted segment at a time. Never follow a symlink while
      // recursively creating a receipt directory outside project authority.
      for (const segment of ["runtime", record.invocationId, directoryName]) {
        const next = path.join(directory, segment);
        try { await fs.mkdir(next, { mode: 0o700 }); }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
        const info = await fs.lstat(next);
        if (!info.isDirectory() || info.isSymbolicLink()) throw new Error("Terminal receipt directory must be a trusted project directory");
        directory = await fs.realpath(next);
        this.assertDescendant(root, directory, "Terminal receipt directory");
      }
      const receiptPath = path.join(directory, "finish.json");
      const memoryPath = path.join(directory, "Memory.md");
      const readExisting = async (file: string): Promise<Buffer | undefined> => {
        try {
          const info = await fs.lstat(file);
          if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1) {
            throw new Error("Terminal receipt target must be a private regular file");
          }
          return await fs.readFile(file);
        } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined; throw error; }
      };
      const existing = await readExisting(receiptPath);
      if (existing && !isDeepStrictEqual(JSON.parse(existing.toString("utf8")), record)) {
        throw new Error("Terminal receipt content conflicts with its accepted S record");
      }
      const memory = await readExisting(memoryPath);
      if (memory && (record.memory === undefined || !memory.equals(Buffer.from(record.memory)))) {
        throw new Error("Terminal memory snapshot conflicts with its accepted S record");
      }
      if (record.memory !== undefined && !memory) await this.atomicText(memoryPath, record.memory);
      if (!existing) await this.atomicJson(receiptPath, record);
      return { receiptPath, ...(record.memory === undefined ? {} : { memoryPath }) };
    });
  }

  async writeUserResponse(
    state: ProjectState,
    interventionId: string,
    markdown: string,
    targetAgent: AgentName = "main"
  ): Promise<string> {
    if (!/^usr_[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(interventionId)) {
      throw new Error("Invalid user intervention id");
    }
    const fileName = `${String(state.turn).padStart(4, "0")}_user_${interventionId}_to_${targetAgent}.md`;
    const filePath = path.join(this.projectDir(state.id), "messages", fileName);
    await this.atomicText(filePath, markdown);
    return filePath;
  }

  async writeProjectUserInput(
    state: ProjectState,
    input: ProjectUserInput,
    markdown: string
  ): Promise<string> {
    if (!/^inp_[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(input.id)) {
      throw new Error("Invalid project user input id");
    }
    const fileName = `${String(state.turn).padStart(4, "0")}_user_input_${input.id}_to_main.md`;
    const filePath = path.join(this.projectDir(state.id), "messages", fileName);
    await this.atomicText(filePath, markdown);
    return filePath;
  }

  async appendTrace(
    state: ProjectState,
    agent: AgentName,
    invocationId: string,
    kind: string,
    message: string
  ): Promise<void> {
    this.assertInvocationId(invocationId);
    const filePath = path.join(
      this.projectDir(state.id),
      "traces",
      `${String(state.turn + 1).padStart(4, "0")}_${agent}_${invocationId}.md`
    );
    const block = `\n### ${nowIso()} · ${kind}\n\n\`\`\`text\n${escapeMarkdownCodeFence(message)}\n\`\`\`\n`;
    await fs.appendFile(filePath, block, "utf8");
  }

  /** Agent identity remains invocation metadata; it never changes the cwd. */
  async roleWorkspace(
    projectId: string,
    _role: AgentName,
    invocationId: string
  ): Promise<string> {
    this.assertInvocationId(invocationId);
    return this.projectWorkspace(projectId);
  }

  async saveRoleMemorySnapshot(
    projectId: string,
    role: AgentName,
    content: string,
    options: { runtimeOnly?: boolean } = {}
  ): Promise<{ path: string; sha256: string }> {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(role) ||
      Buffer.byteLength(content, "utf8") > 2 * 1024 * 1024 || content.includes("\0")) {
      throw new Error("Agent memory snapshot is invalid or too large");
    }
    const workspace = options.runtimeOnly ? path.join(this.projectDir(projectId), "runtime", "memory-snapshots")
      : await this.projectWorkspace(projectId);
    await fs.mkdir(workspace, { recursive: true, mode: 0o700 });
    const realWorkspace = await fs.realpath(workspace);
    const memoryDirectory = path.join(realWorkspace, "agent-memory", role);
    await fs.mkdir(memoryDirectory, { recursive: true, mode: 0o700 });
    const realDirectory = await fs.realpath(memoryDirectory);
    this.assertDescendant(realWorkspace, realDirectory, "Agent memory directory");
    const memoryPath = path.join(realDirectory, "Memory.md");
    try {
      const entry = await fs.lstat(memoryPath);
      if (!entry.isFile() || entry.isSymbolicLink()) {
        throw new Error("Agent memory snapshot target is not a regular file");
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    await this.atomicText(memoryPath, content);
    await fs.chmod(memoryPath, 0o600);
    return { path: memoryPath, sha256: createHash("sha256").update(content).digest("hex") };
  }

  private async projectWorkspace(projectId: string): Promise<string> {
    const activePreparation = this.workspacePreparations.get(projectId);
    if (activePreparation) return activePreparation;

    const preparation = this.prepareProjectWorkspace(projectId);
    this.workspacePreparations.set(projectId, preparation);
    try {
      return await preparation;
    } finally {
      if (this.workspacePreparations.get(projectId) === preparation) {
        this.workspacePreparations.delete(projectId);
      }
    }
  }

  private async prepareProjectWorkspace(projectId: string): Promise<string> {
    const selected = await this.workspaceResolver?.(projectId);
    const workspace = selected ?? path.join(this.projectDir(projectId), "workspaces");
    if (selected === undefined) await fs.mkdir(workspace, { recursive: true });
    const projectRoot = await fs.realpath(this.projectDir(projectId));
    const realWorkspace = await fs.realpath(workspace);
    if (selected === undefined) this.assertDescendant(projectRoot, realWorkspace, "Project workspace");
    else if (!path.isAbsolute(selected) || selected !== realWorkspace) throw new Error("Selected workspace is not canonical");
    this.workspaceRoots.set(projectRoot, realWorkspace);
    const inputFolder = path.join(realWorkspace, "user_inputs");
    await fs.mkdir(inputFolder).catch((error: NodeJS.ErrnoException) => { if (error.code !== "EEXIST") throw error; });
    const inputEntry = await fs.lstat(inputFolder);
    if (!inputEntry.isDirectory() || inputEntry.isSymbolicLink()) throw new Error("Project user_inputs must be a regular directory");
    this.assertDescendant(realWorkspace, await fs.realpath(inputFolder), "Project user_inputs");
    const memoryPath = path.join(workspace, WORKSPACE_MEMORY_FILE);
    const memory = [
      "# Project Memory",
      "",
      `Project: ${projectId}`,
      "",
      "All Agents share this workspace and memory. Read before acting; append durable facts, decisions, evidence paths, and unresolved questions, identifying the contributing Agent. Do not overwrite other Agents' notes or include credentials or hidden chain-of-thought.",
      ""
    ].join("\n");
    try {
      await fs.writeFile(memoryPath, memory, {
        encoding: "utf8",
        flag: "wx",
        mode: 0o600
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    // An existing Memory.md must not redirect writes or chmod outside the project.
    this.assertDescendant(
      realWorkspace,
      await fs.realpath(memoryPath),
      "Project memory"
    );
    const memoryEntry = await fs.lstat(memoryPath);
    if (!memoryEntry.isFile() || memoryEntry.isSymbolicLink()) {
      throw new Error("Project memory must be a regular non-symlink file");
    }
    await fs.chmod(memoryPath, 0o600);
    return workspace;
  }

  private async projectFileBrowser(projectId: string): Promise<ProjectFileBrowser> {
    return new ProjectFileBrowser(this.projectDir(projectId), await this.loadState(projectId), () => this.artifactCatalog(projectId));
  }

  private artifactCatalog(projectId: string, scope?: "project"): Promise<ArtifactListItem[]> {
    const key = `${projectId}:${scope ?? "published"}`;
    const pending = this.artifactCatalogReads.get(key);
    if (pending) return pending;
    const read = scope === "project"
      ? this.projectFileBrowser(projectId).then(browser => browser.catalog())
      : this.readArtifactCatalog(projectId);
    this.artifactCatalogReads.set(key, read);
    const clear = () => { if (this.artifactCatalogReads.get(key) === read) this.artifactCatalogReads.delete(key); };
    void read.then(clear, clear);
    return read;
  }

  async resolveBrowserWorkspaceFile(projectId: string, workspaceId: string, requestedPath: string): Promise<WorkspaceArtifactSource> {
    return (await this.projectFileBrowser(projectId)).resolve(workspaceId, requestedPath);
  }

  async listArtifactSummary(projectId: string, options: { scope?: "project" } = {}): Promise<ArtifactCatalogSummary> {
    const catalog = await this.artifactCatalog(projectId, options.scope);
    return this.artifactSummaryFromCatalog(catalog);
  }

  private artifactSummaryFromCatalog(
    catalog: ArtifactListItem[]
  ): ArtifactCatalogSummary {
    const counts = new Map<AgentName, number>();
    for (const item of catalog) counts.set(item.producer, (counts.get(item.producer) ?? 0) + 1);
    const groups = Object.fromEntries(counts) as Record<AgentName, number>;
    return { groups, total: catalog.length };
  }

  async listArtifactPage(
    projectId: string,
    options: {
      agent?: AgentName;
      offset?: number;
      limit?: number;
      query?: string;
      scope?: "project";
    } = {}
  ): Promise<ArtifactCatalogPage> {
    const catalog = await this.artifactCatalog(projectId, options.scope);
    const query = options.query?.trim().toLowerCase();
    const filtered = catalog.filter(
      (item) =>
        (!options.agent || item.producer === options.agent) &&
        (!query || item.path.toLowerCase().includes(query))
    );
    const offset = Math.max(0, options.offset ?? 0);
    const limit = Math.min(200, Math.max(1, options.limit ?? 100));
    const summary = this.artifactSummaryFromCatalog(catalog);
    return {
      ...summary,
      artifacts: filtered.slice(offset, offset + limit),
      offset,
      limit,
      hasMore: offset + limit < filtered.length
    };
  }

  /**
   * List one project-workspace directory without walking its descendants or
   * loading the recursive artifact catalog. Hidden entries and symlinks stay
   * outside the user-facing file browser.
   */
  async listArtifactDirectory(
    projectId: string,
    role: AgentName,
    requestedDirectory = "",
    options: { offset?: number; limit?: number; scope?: "project" } = {}
  ): Promise<ArtifactDirectoryPage> {
    if (options.scope === "project") return (await this.projectFileBrowser(projectId)).directory(requestedDirectory, options);
    const state = await this.loadState(projectId);
    if (state?.git?.enabled) {
      return this.listGitArtifactDirectory(state, role, requestedDirectory, options);
    }
    const root = await this.roleWorkspace(
      projectId,
      role,
      "inv_artifact_directory"
    );
    const projectRoot = await fs.realpath(this.projectDir(projectId));
    const realRoot = await fs.realpath(root);
    this.assertWorkspaceBoundary(projectRoot, realRoot);

    const trimmedDirectory = requestedDirectory.trim();
    const relativeDirectory = trimmedDirectory
      ? safeProjectRelativePath(trimmedDirectory)
      : "";
    if (
      relativeDirectory &&
      !isUserVisibleWorkspacePath(relativeDirectory)
    ) {
      const error = new Error(
        "Workspace directory is hidden"
      ) as NodeJS.ErrnoException;
      error.code = "ENOENT";
      throw error;
    }

    const candidate = relativeDirectory
      ? path.resolve(realRoot, relativeDirectory)
      : realRoot;
    if (candidate !== realRoot) {
      this.assertDescendant(realRoot, candidate, "workspace directory");
    }
    const realDirectory = await fs.realpath(candidate);
    if (realDirectory !== realRoot) {
      this.assertDescendant(realRoot, realDirectory, "workspace directory");
    }
    const directoryStats = await fs.stat(realDirectory);
    if (!directoryStats.isDirectory()) {
      const error = new Error(
        "Workspace path is not a directory"
      ) as NodeJS.ErrnoException;
      error.code = "ENOTDIR";
      throw error;
    }

    const visibleEntries = (await fs.readdir(realDirectory, {
      withFileTypes: true
    }))
      .filter(
        (entry) =>
          !entry.name.startsWith(".") &&
          (entry.isDirectory() || entry.isFile())
      )
      .sort((left, right) => {
        const typeOrder = Number(right.isDirectory()) - Number(left.isDirectory());
        return typeOrder || left.name.localeCompare(right.name);
      });
    const offset = Math.max(0, options.offset ?? 0);
    const limit = Math.min(200, Math.max(1, options.limit ?? 50));
    const pageEntries = visibleEntries.slice(offset, offset + limit);
    const entries = (
      await Promise.all(
        pageEntries.map(async (entry): Promise<ArtifactDirectoryEntry | undefined> => {
          const relativePath = relativeDirectory
            ? path.posix.join(relativeDirectory, entry.name)
            : entry.name;
          const absolutePath = path.join(realDirectory, entry.name);
          try {
            const stats = await fs.lstat(absolutePath);
            if (stats.isSymbolicLink()) return undefined;
            if (entry.isDirectory() && stats.isDirectory()) {
              return {
                type: "directory",
                name: entry.name,
                path: relativePath,
                producer: "shared",
                origin: "workspace",
                updatedAt: new Date(stats.mtimeMs).toISOString()
              };
            }
            if (entry.isFile() && stats.isFile()) {
              return {
                type: "file",
                name: entry.name,
                path: relativePath,
                producer: "shared",
                origin: "workspace",
                size: stats.size,
                updatedAt: new Date(stats.mtimeMs).toISOString(),
                mediaType: mediaTypeFor(relativePath)
              };
            }
            return undefined;
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
              return undefined;
            }
            throw error;
          }
        })
      )
    ).filter((entry): entry is ArtifactDirectoryEntry => entry !== undefined);

    return {
      agent: role,
      directory: relativeDirectory,
      parent:
        relativeDirectory && relativeDirectory.includes("/")
          ? path.posix.dirname(relativeDirectory)
          : relativeDirectory
            ? ""
            : undefined,
      entries,
      offset,
      limit,
      total: visibleEntries.length,
      hasMore: offset + limit < visibleEntries.length
    };
  }

  async readWorkspaceArtifact(
    projectId: string,
    role: AgentName,
    requestedPath: string,
    binding?: { artifactId?: string; commitSha?: string }
  ): Promise<{ content: Buffer }> {
    const source = await this.resolveWorkspaceArtifact(
      projectId,
      role,
      requestedPath,
      binding
    );
    return {
      content: await fs.readFile(source.sourcePath)
    };
  }

  async resolvePublishedArtifactRecord(
    projectId: string,
    artifact: ArtifactRecord
  ): Promise<WorkspaceArtifactSource> {
    const source = await this.resolveWorkspaceArtifact(
      projectId,
      artifact.agent,
      artifact.path,
      artifact.gitSource ? { artifactId: artifact.id, commitSha: artifact.gitSource.commitSha } : undefined
    );
    // Accepted Git publications already have an immutable tree/blob identity.
    // Historical records can predate the additional SHA-256 field.
    if (artifact.gitSource && !artifact.sha256 && (await this.loadState(projectId)).git?.enabled) return source;
    if (!artifact.sha256) {
      throw new Error(
        `Published artifact has no integrity identity and must be republished: ${artifact.id}`
      );
    }
    const content = await fs.readFile(source.sourcePath);
    const sha256 = createHash("sha256").update(content).digest("hex");
    if (content.length !== artifact.size || sha256 !== artifact.sha256) {
      throw new Error(
        `Published artifact changed after publication: ${artifact.id}`
      );
    }
    return source;
  }

  /**
   * Build the invocation-scoped authority file consumed by the injected
   * workspace MCP. Only formally published catalog entries are included. The
   * file is private to the injected subprocess and carries server-only paths
   * that are never rendered into the Agent prompt or tool response.
   */
  async writePublishedArtifactAccessManifest(
    state: ProjectState,
    invocationId: string,
    runtimePath: string
  ): Promise<string> {
    const projectRoot = await fs.realpath(this.projectDir(state.id));
    const realRuntime = await fs.realpath(runtimePath);
    this.assertDescendant(projectRoot, realRuntime, "invocation runtime");
    const snapshotRoot = path.join(realRuntime, "published-artifacts");
    await fs.mkdir(snapshotRoot, { recursive: true, mode: 0o700 });
    await fs.chmod(snapshotRoot, 0o700);
    const realSnapshotRoot = await fs.realpath(snapshotRoot);
    this.assertDescendant(realRuntime, realSnapshotRoot, "published artifact snapshot");
    const artifacts: PublishedArtifactAccessEntry[] = [];
    for (const [index, artifact] of (state.artifacts ?? []).entries()) {
      // A legacy publication has no trustworthy byte identity. Do not bind it
      // to whatever happens to occupy its path now; its producer must publish
      // the intended bytes again.
      if (!artifact.sha256) continue;
      const source = await this.resolveWorkspaceArtifact(
        state.id,
        artifact.agent,
        artifact.path,
        artifact.gitSource ? { artifactId: artifact.id, commitSha: artifact.gitSource.commitSha } : undefined
      );
      const content = await fs.readFile(source.sourcePath);
      // Give the MCP an invocation-local immutable view instead of revealing
      // a producer workspace path. A catalog/file mismatch remains visible:
      // the entry retains its publication hash and size while the snapshot
      // contains the bytes that currently occupy the published path.
      const snapshotName = `${String(index).padStart(6, "0")}-${createHash("sha256")
        .update(artifact.id)
        .digest("hex")
        .slice(0, 24)}.bin`;
      const snapshotPath = path.join(realSnapshotRoot, snapshotName);
      await fs.writeFile(snapshotPath, content, { mode: 0o400 });
      await fs.chmod(snapshotPath, 0o400);
      artifacts.push({
        id: artifact.id,
        agent: artifact.agent,
        path: source.relativePath,
        title: artifact.title,
        kind: artifact.kind,
        description: artifact.description,
        size: artifact.size,
        mediaType: artifact.mediaType ?? source.mediaType,
        ...(artifact.modifiedAt ? { modifiedAt: artifact.modifiedAt } : {}),
        ...(artifact.registeredAt ? { registeredAt: artifact.registeredAt } : {}),
        sha256: artifact.sha256,
        workspaceRoot: realSnapshotRoot,
        sourcePath: snapshotPath
      });
    }
    const manifest: PublishedArtifactAccessManifest = {
      schemaVersion: 1,
      projectId: state.id,
      invocationId,
      createdAt: nowIso(),
      artifacts
    };
    const manifestPath = path.join(
      realRuntime,
      PUBLISHED_ARTIFACT_MANIFEST_FILENAME
    );
    await fs.writeFile(manifestPath, `${JSON.stringify(manifest)}\n`, {
      encoding: "utf8",
      mode: 0o600
    });
    return manifestPath;
  }

  async resolveWorkspaceArtifact(
    projectId: string,
    role: AgentName,
    requestedPath: string,
    binding?: { artifactId?: string; commitSha?: string }
  ): Promise<WorkspaceArtifactSource> {
    let state: ProjectState | undefined;
    try {
      state = await this.loadState(projectId);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    if (state?.git?.enabled) {
      return this.resolveGitArtifact(state, role, requestedPath, binding);
    }
    const root = await this.roleWorkspace(projectId, role, "inv_artifact_read");
    const projectRoot = await fs.realpath(this.projectDir(projectId));
    const realRoot = await fs.realpath(root);
    this.assertWorkspaceBoundary(projectRoot, realRoot);
    let relativePath = this.normalizeWorkspaceArtifactPath(
      requestedPath,
      projectRoot,
      realRoot
    );
    if (!isUserVisibleWorkspacePath(relativePath)) {
      const error = new Error("Workspace file is hidden") as NodeJS.ErrnoException;
      error.code = "ENOENT";
      throw error;
    }
    const candidate = path.resolve(realRoot, relativePath);
    this.assertDescendant(realRoot, candidate, "workspace file");
    let sourcePath: string;
    try {
      sourcePath = await fs.realpath(candidate);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      // Keep historical per-Agent files where they are. A root-level file
      // wins; otherwise a role-relative request may fall back to its legacy
      // <agent>/shared/ location without copying or overwriting anything.
      const legacyPath = safeRelativePath(`${role}/shared/${relativePath}`);
      if (!isUserVisibleWorkspacePath(legacyPath)) throw error;
      sourcePath = await fs.realpath(path.resolve(realRoot, legacyPath));
      relativePath = legacyPath;
    }
    this.assertDescendant(realRoot, sourcePath, "workspace file");
    const stats = await fs.stat(sourcePath);
    if (!stats.isFile()) throw new Error("Workspace path is not a regular file");
    return {
      sourcePath,
      relativePath,
      size: stats.size,
      mediaType: mediaTypeFor(relativePath),
      mtimeMs: stats.mtimeMs
    };
  }

  /**
   * Resolve a publication candidate from the one canonical worktree owned by
   * an execution. This is intentionally separate from the public artifact
   * resolver: before the PR is merged the file is not yet readable/catalogued.
   */
  async resolveExecutionArtifactCandidate(
    projectId: string,
    execution: Pick<MemberExecution, "id" | "agentId" | "worktreePath">,
    requestedPath: string
  ): Promise<WorkspaceArtifactSource> {
    const projectRoot = await fs.realpath(this.projectDir(projectId));
    const worktreeRoot = path.join(projectRoot, "git-worktrees");
    const fixedRoot = path.join(worktreeRoot, "agents", execution.agentId);
    if (!execution.agentId || path.basename(execution.agentId) !== execution.agentId || execution.agentId.includes("\\")) {
      throw new Error("Execution artifact Agent identity is unsafe");
    }
    const expectedRoot = path.resolve(execution.worktreePath) === fixedRoot ? fixedRoot : path.join(worktreeRoot, execution.id);
    this.assertDescendant(worktreeRoot, expectedRoot, "execution worktree");
    if (path.resolve(execution.worktreePath) !== expectedRoot) {
      throw new Error("Execution artifact worktree is not canonical");
    }
    const rootStat = await fs.lstat(expectedRoot);
    if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
      throw new Error("Execution artifact worktree is not a real directory");
    }
    const realRoot = await fs.realpath(expectedRoot);
    if (realRoot !== expectedRoot) {
      throw new Error("Execution artifact worktree escaped its canonical path");
    }
    const relativePath = safeGitArtifactRelativePath(requestedPath);
    const candidate = path.resolve(realRoot, relativePath);
    this.assertDescendant(realRoot, candidate, "execution artifact");
    const candidateStat = await fs.lstat(candidate);
    if (candidateStat.isSymbolicLink() || !candidateStat.isFile() || candidateStat.nlink !== 1) {
      throw new Error("Execution artifact path is not a regular file");
    }
    const sourcePath = await fs.realpath(candidate);
    this.assertDescendant(realRoot, sourcePath, "execution artifact");
    if (sourcePath !== candidate) {
      throw new Error("Execution artifact path traverses a symbolic link");
    }
    return {
      sourcePath,
      relativePath,
      size: candidateStat.size,
      mediaType: mediaTypeFor(relativePath),
      mtimeMs: candidateStat.mtimeMs
    };
  }

  private assertWorkspaceBoundary(projectRoot: string, realRoot: string): void {
    if (this.workspaceRoots.get(projectRoot) !== realRoot) {
      this.assertDescendant(projectRoot, realRoot, "Project workspace");
    }
  }

  private normalizeWorkspaceArtifactPath(
    requestedPath: string,
    projectRoot: string,
    realRoot: string
  ): string {
    const clean = requestedPath.replaceAll("\\", "/").trim();
    if (!clean || clean.includes("\0")) {
      throw new Error("Invalid workspace artifact path");
    }

    // Canonical paths are relative to the common project workspace.
    let relative = clean;
    if (relative === "workspaces") relative = "";
    else if (relative.startsWith("workspaces/")) {
      relative = relative.slice("workspaces/".length);
    }

    const looksAbsolute = path.posix.isAbsolute(clean) || /^[A-Za-z]:\//.test(clean);
    if (looksAbsolute) {
      if (/^[A-Za-z]:\//.test(clean) && process.platform !== "win32") {
        throw new Error("Windows absolute workspace paths are not valid on this server");
      }
      const candidate = path.resolve(clean);
      this.assertDescendant(realRoot, candidate, "workspace file");
      relative = path.relative(realRoot, candidate).replaceAll(path.sep, "/");
    }

    const normalized = safeRelativePath(relative);
    if (!isUserVisibleWorkspacePath(normalized)) {
      const error = new Error("Workspace file is hidden") as NodeJS.ErrnoException;
      error.code = "ENOENT";
      throw error;
    }
    // A trusted SDK host may bind a canonical external workspace. Individual
    // file paths must still stay inside that exact registered workspace.
    this.assertWorkspaceBoundary(projectRoot, realRoot);
    return normalized;
  }

  async readRoleWorkspaceFile(
    projectId: string,
    role: AgentName,
    requestedPath: string
  ): Promise<Buffer> {
    const root = await this.roleWorkspace(projectId, role, "inv_workspace_read");
    const projectRoot = await fs.realpath(this.projectDir(projectId));
    const realRoot = await fs.realpath(root);
    this.assertWorkspaceBoundary(projectRoot, realRoot);
    const relativePath = safeRelativePath(requestedPath);
    const candidate = path.resolve(realRoot, relativePath);
    this.assertDescendant(realRoot, candidate, "Project workspace file");
    const sourcePath = await fs.realpath(candidate);
    this.assertDescendant(realRoot, sourcePath, "Project workspace file");
    const stats = await fs.stat(sourcePath);
    if (!stats.isFile()) {
      throw new Error("Project workspace path is not a regular file");
    }
    return fs.readFile(sourcePath);
  }

  private async readArtifactCatalog(projectId: string): Promise<ArtifactListItem[]> {
    const state = await this.loadState(projectId);
    if (state.git?.enabled) {
      const byKey = new Map<string, ArtifactListItem>();
      for (const record of state.artifacts ?? []) {
        const binding = this.trustedGitArtifactBinding(state, record);
        if (!binding) continue;
        const previous = byKey.get(`${record.agent}:${record.path}`);
        if (previous && previous.updatedAt > record.updatedAt) continue;
        try {
          const materialized = await this.materializeGitArtifact(binding);
          byKey.set(`${record.agent}:${record.path}`, {
            id: record.id,
            path: record.path,
            mediaType: materialized.mediaType,
            producer: record.agent,
            size: materialized.size,
            updatedAt: record.updatedAt,
            origin: "workspace",
            gitSource: {
              executionId: binding.record.gitSource!.executionId,
              ownershipEpoch: binding.record.gitSource!.ownershipEpoch,
              commitSha: binding.record.gitSource!.commitSha,
              pullRequestId: binding.record.gitSource!.pullRequestId,
              acceptedBase: binding.record.gitSource!.acceptedBase
            }
          });
        } catch {
          // A missing or untrusted Git blob cannot fall back to mutable workspace bytes.
          continue;
        }
      }
      return [...byKey.values()].sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt) ||
        left.producer.localeCompare(right.producer) ||
        left.path.localeCompare(right.path)
      );
    }
    const workspace = await this.projectWorkspace(projectId);
    const files = await this.walkWorkspaceArtifactFiles(workspace);
    const filePaths = new Set(files.map((file) => file.path));
    const publications = new Map<string, ArtifactRecord>();
    for (const artifact of state.artifacts ?? []) {
      const legacyPath = `${artifact.agent}/shared/${artifact.path}`;
      const canonicalPath = filePaths.has(artifact.path)
        ? artifact.path
        : filePaths.has(legacyPath)
          ? legacyPath
          : artifact.path;
      publications.set(canonicalPath, artifact);
    }
    return files.map((file): ArtifactListItem => ({
      id: `workspace:${file.path}`,
      path: file.path,
      mediaType: mediaTypeFor(file.path),
      producer: publications.get(file.path)?.agent ?? "shared",
      size: file.size,
      updatedAt: new Date(file.mtimeMs).toISOString(),
      origin: "workspace"
    })).sort(
      (left, right) =>
        right.updatedAt.localeCompare(left.updatedAt) ||
        left.path.localeCompare(right.path)
    );
  }

  private trustedGitArtifactBinding(
    state: ProjectState,
    record: ArtifactRecord
  ): TrustedGitArtifactBinding | undefined {
    const source = record.gitSource;
    const repository = state.git?.repository;
    if (!state.git?.enabled || !source || !repository) return undefined;
    let normalizedPath: string;
    try {
      normalizedPath = safeGitArtifactRelativePath(record.path);
    } catch {
      return undefined;
    }
    if (normalizedPath !== record.path) {
      return undefined;
    }
    if (!/^[a-f0-9]{40,64}$/.test(source.commitSha)) return undefined;
    const execution = state.executions?.find((item) =>
      item.id === source.executionId &&
      item.ownershipEpoch === source.ownershipEpoch &&
      item.agentId === record.agent &&
      (item.status === "merged" || item.status === "succeeded")
    );
    const pull = [...(state.pullRequests ?? []), ...(state.additionalPullRequests ?? []).filter(item =>
      item.ownershipEpoch === source.ownershipEpoch)].find((item) =>
      item.id === source.pullRequestId &&
      item.ownerExecutionId === source.executionId &&
      item.status === "merged" &&
      item.headSha === source.commitSha &&
      item.base === source.acceptedBase
    );
    const scopedExecution = state.scopedExecutions?.find((item) => item.id === source.executionId &&
      item.ownershipEpoch === source.ownershipEpoch && item.agentId === record.agent && item.status === "completed");
    const scopedMerge = state.scopedAgentMerges?.find((item) => item.executionId === source.executionId &&
      item.groupRunId === scopedExecution?.groupRunId && item.pullRequest.id === source.pullRequestId &&
      item.pullRequest.ownerExecutionId === source.executionId &&
      item.pullRequest.status === "merged" && item.pullRequest.headSha === source.commitSha && item.pullRequest.base === source.acceptedBase &&
      item.synchronization.expectedSourceHead === source.commitSha && item.synchronization.targetBranch === source.acceptedBase &&
      item.synchronization.localHeadAfter === item.synchronization.remoteHead &&
      item.synchronization.mergeCommitSha === item.pullRequest.mergeCommitSha);
    const owner = execution && pull ? execution : scopedExecution && scopedMerge ? scopedExecution : undefined;
    if (!owner) return undefined;
    const projectRoot = this.projectDir(state.id);
    const expectedWorktree = state.orchestration.schemaVersion === 3
      ? path.join(projectRoot, "git-worktrees", "agents", owner.agentId) : path.join(projectRoot, "git-worktrees", owner.id);
    const expectedRepository = path.join(projectRoot, "repository");
    if (
      path.resolve(owner.worktreePath) !== expectedWorktree ||
      path.resolve(source.worktreePath) !== expectedWorktree ||
      path.resolve(repository.localPath) !== expectedRepository
    ) {
      return undefined;
    }
    return { record, execution: owner, repositoryPath: expectedRepository };
  }

  /** Validate a not-yet-persisted Git record against current accepted facts. */
  async validateGitArtifactRecord(
    state: ProjectState,
    record: ArtifactRecord
  ): Promise<WorkspaceArtifactSource> {
    const binding = this.trustedGitArtifactBinding(state, record);
    if (!binding) throw new Error("Git artifact does not match an accepted execution and merged pull request");
    return this.materializeGitArtifact(binding);
  }

  private async resolveGitArtifact(
    state: ProjectState,
    role: AgentName,
    requestedPath: string,
    exact?: { artifactId?: string; commitSha?: string }
  ): Promise<WorkspaceArtifactSource> {
    const relativePath = safeGitArtifactRelativePath(requestedPath);
    const candidates = (state.artifacts ?? [])
      .map((record, index) => ({ record, index }))
      .filter(({ record }) =>
        record.agent === role &&
        record.path === relativePath &&
        (!exact?.artifactId || record.id === exact.artifactId) &&
        (!exact?.commitSha || record.gitSource?.commitSha === exact.commitSha)
      )
      .sort((left, right) =>
        right.record.updatedAt.localeCompare(left.record.updatedAt) ||
        right.index - left.index
      );
    // An immutable display supplies an opaque publication id and commit. If
    // either exact selector is present, ambiguity is corruption and must not
    // silently retarget the read to another same-path publication.
    if ((exact?.artifactId || exact?.commitSha) && candidates.length !== 1) {
      const error = new Error("Exact Git artifact binding is missing or ambiguous") as NodeJS.ErrnoException;
      error.code = "ENOENT";
      throw error;
    }
    const binding = candidates
      .map(({ record }) => this.trustedGitArtifactBinding(state, record))
      .find((item): item is TrustedGitArtifactBinding => item !== undefined);
    if (!binding) {
      const error = new Error("Git artifact is not registered from an accepted execution") as NodeJS.ErrnoException;
      error.code = "ENOENT";
      throw error;
    }
    return this.materializeGitArtifact(binding);
  }

  private async materializeGitArtifact(
    binding: TrustedGitArtifactBinding
  ): Promise<WorkspaceArtifactSource> {
    const source = binding.record.gitSource!;
    const repositoryStat = await fs.lstat(binding.repositoryPath);
    if (repositoryStat.isSymbolicLink() || !repositoryStat.isDirectory()) {
      throw new Error("Git artifact repository is not a canonical directory");
    }
    const realRepository = await fs.realpath(binding.repositoryPath);
    if (realRepository !== binding.repositoryPath) {
      throw new Error("Git artifact repository escaped its canonical path");
    }
    // Execution/worktree provenance was checked by trustedGitArtifactBinding.
    // Reading an accepted commit must survive ordinary worktree cleanup.
    const entry = await readGitTreeEntry(
      realRepository,
      source.commitSha,
      binding.record.path
    );
    if (!entry || (entry.mode !== "100644" && entry.mode !== "100755") ||
      entry.type !== "blob" || entry.path !== binding.record.path) {
      const error = new Error("Git artifact is not a regular file in its accepted commit") as NodeJS.ErrnoException;
      error.code = "ENOENT";
      throw error;
    }
    if (entry.size > MAX_GIT_ARTIFACT_BYTES) {
      throw new Error("Git artifact exceeds the immutable read limit");
    }
    const projectRoot = path.dirname(binding.repositoryPath);
    const immutableRoot = path.join(projectRoot, "runtime", "git-artifacts", source.commitSha);
    await fs.mkdir(immutableRoot, { recursive: true, mode: 0o700 });
    const realImmutableRoot = await fs.realpath(immutableRoot);
    if (realImmutableRoot !== immutableRoot) {
      throw new Error("Git artifact cache escaped its canonical path");
    }
    const cacheName = createHash("sha256").update(binding.record.path).digest("hex");
    const sourcePath = path.join(realImmutableRoot, cacheName);
    let cachedContent: Buffer | undefined;
    try {
      const current = await fs.lstat(sourcePath);
      if (current.isSymbolicLink() || !current.isFile() || current.size !== entry.size) {
        throw new Error("Git artifact cache entry is invalid");
      }
      cachedContent = await fs.readFile(sourcePath);
      if (gitBlobObjectId(cachedContent, entry.objectId.length) !== entry.objectId) {
        throw new Error("Git artifact cache entry does not match its accepted object id");
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const content = await readGitBlob(
        realRepository,
        source.commitSha,
        binding.record.path,
        MAX_GIT_ARTIFACT_BYTES
      );
      if (content.length !== entry.size) {
        throw new Error("Git artifact blob size does not match its accepted tree entry");
      }
      if (gitBlobObjectId(content, entry.objectId.length) !== entry.objectId) {
        throw new Error("Git artifact blob does not match its accepted object id");
      }
      const temporary = path.join(realImmutableRoot, `.${cacheName}.${randomUUID()}.tmp`);
      await fs.writeFile(temporary, content, { flag: "wx", mode: 0o400 });
      await fs.rename(temporary, sourcePath);
    }
    const cached = await fs.lstat(sourcePath);
    if (cached.isSymbolicLink() || !cached.isFile() || cached.size !== entry.size) {
      throw new Error("Git artifact cache entry failed verification");
    }
    return {
      sourcePath,
      relativePath: binding.record.path,
      size: cached.size,
      mediaType: !binding.record.mediaType || binding.record.mediaType.split(";", 1)[0] === "application/octet-stream"
        ? mediaTypeFor(binding.record.path) : binding.record.mediaType,
      mtimeMs: Number.isFinite(Date.parse(binding.record.updatedAt))
        ? Date.parse(binding.record.updatedAt)
        : 0
    };
  }

  private async listGitArtifactDirectory(
    state: ProjectState,
    role: AgentName,
    requestedDirectory: string,
    options: { offset?: number; limit?: number }
  ): Promise<ArtifactDirectoryPage> {
    const directory = requestedDirectory.trim()
      ? safeGitArtifactRelativePath(requestedDirectory)
      : "";
    const catalog = (await this.readArtifactCatalog(state.id))
      .filter((item) => item.producer === role);
    const prefix = directory ? `${directory}/` : "";
    const byName = new Map<string, ArtifactDirectoryEntry>();
    for (const item of catalog) {
      if (!item.path.startsWith(prefix)) continue;
      const remainder = item.path.slice(prefix.length);
      if (!remainder) continue;
      const slash = remainder.indexOf("/");
      const name = slash < 0 ? remainder : remainder.slice(0, slash);
      const entryPath = prefix ? `${directory}/${name}` : name;
      if (slash >= 0) {
        byName.set(name, {
          type: "directory",
          name,
          path: entryPath,
          producer: role,
          origin: "workspace"
        });
      } else if (!byName.has(name)) {
        byName.set(name, {
          type: "file",
          name,
          path: item.path,
          producer: role,
          origin: "workspace",
          size: item.size,
          updatedAt: item.updatedAt,
          mediaType: item.mediaType,
          id: item.id,
          ...(item.gitSource ? { commitSha: item.gitSource.commitSha } : {})
        });
      }
    }
    const allEntries = [...byName.values()].sort((left, right) =>
      Number(right.type === "directory") - Number(left.type === "directory") ||
      left.name.localeCompare(right.name)
    );
    if (directory && allEntries.length === 0 &&
      !catalog.some((item) => item.path.startsWith(`${directory}/`))) {
      const error = new Error("Artifact directory not found") as NodeJS.ErrnoException;
      error.code = "ENOENT";
      throw error;
    }
    const offset = Math.max(0, options.offset ?? 0);
    const limit = Math.min(200, Math.max(1, options.limit ?? 50));
    return {
      agent: role,
      directory,
      parent: directory.includes("/") ? path.posix.dirname(directory) : directory ? "" : undefined,
      entries: allEntries.slice(offset, offset + limit),
      offset,
      limit,
      total: allEntries.length,
      hasMore: offset + limit < allEntries.length
    };
  }

  async writeWorkspaceCheckpoint(state: ProjectState, agent: AgentName, invocationId: string, reason: string, baseline?: WorkspaceFileStamp[]) {
    const root = await this.roleWorkspace(state.id, agent, invocationId);
    const manifest = await buildWorkspaceManifest(root, { id: newId("chk"), agent, invocationId, reason }, baseline);
    const directory = path.join(this.projectDir(state.id), "checkpoints");
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, `${manifest.id}.json`), `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx", mode: 0o400 });
    const { files: _files, ...summary } = manifest;
    return summary;
  }

  async readWorkspaceCheckpoint(projectId: string, checkpointId: string): Promise<WorkspaceManifest> {
    if (!/^chk_[a-f0-9]{32}$/.test(checkpointId)) throw new Error("Invalid checkpoint ID");
    return JSON.parse(await fs.readFile(path.join(this.projectDir(projectId), "checkpoints", `${checkpointId}.json`), "utf8")) as WorkspaceManifest;
  }

  private async walkWorkspaceArtifactFiles(
    root: string
  ): Promise<Array<{ path: string; size: number; mtimeMs: number }>> {
    const directories: Array<{ absolute: string; relative: string }> = [
      { absolute: root, relative: "" }
    ];
    const candidates: Array<{ absolute: string; relative: string }> = [];
    let cursor = 0;
    while (cursor < directories.length) {
      const batch = directories.slice(cursor, cursor + 32);
      cursor += batch.length;
      const listings = await Promise.all(
        batch.map(async (directory) => {
          try {
            return {
              directory,
              entries: await fs.readdir(directory.absolute, {
                withFileTypes: true
              })
            };
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
              return { directory, entries: [] as Dirent[] };
            }
            throw error;
          }
        })
      );
      for (const { directory, entries } of listings) {
        for (const entry of entries) {
          if (entry.name.startsWith(".")) continue;
          const relative = directory.relative
            ? path.posix.join(directory.relative, entry.name)
            : entry.name;
          const absolute = path.join(directory.absolute, entry.name);
          if (entry.isDirectory()) {
            directories.push({ absolute, relative });
          } else if (entry.isFile()) {
            candidates.push({ absolute, relative });
          }
        }
      }
    }

    const result: Array<{ path: string; size: number; mtimeMs: number }> = [];
    let candidateCursor = 0;
    await Promise.all(
      Array.from(
        { length: Math.min(WORKSPACE_STAT_CONCURRENCY, candidates.length) },
        async () => {
          while (candidateCursor < candidates.length) {
            const candidate = candidates[candidateCursor++];
            try {
              const stats = await fs.stat(candidate.absolute);
              if (stats.isFile()) {
                result.push({
                  path: candidate.relative,
                  size: stats.size,
                  mtimeMs: stats.mtimeMs
                });
              }
            } catch (error) {
              if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
                throw error;
              }
            }
          }
        }
      )
    );
    return result.sort((left, right) => left.path.localeCompare(right.path));
  }

  async invocationRuntimePath(
    projectId: string,
    invocationId: string
  ): Promise<string> {
    this.assertInvocationId(invocationId);
    const runtimePath = path.join(
      this.projectDir(projectId),
      "runtime",
      invocationId
    );
    await fs.mkdir(runtimePath, { recursive: true });
    return runtimePath;
  }

  async buildContextIndex(
    state: ProjectState,
    afterSeq = 0,
    fullSync = false,
    includeArtifactContents = false
  ): Promise<string> {
    return (await this.buildContextPackage(state, afterSeq, fullSync, includeArtifactContents)).text;
  }

  async buildContextPackage(
    state: ProjectState,
    afterSeq = 0,
    fullSync = false,
    _includeArtifactContents = false
  ): Promise<{ text: string; index?: AgentContextIndex }> {
    const projectDir = await fs.realpath(this.projectDir(state.id));
    const workspaceDir = await this.workspaceResolver?.(state.id) ?? path.join(projectDir, "workspaces");
    let cursor = fullSync ? 0 : Math.max(0, Math.floor(afterSeq));
    let effectiveFullSync = fullSync;
    let events = await this.readEvents(state.id, cursor, Number.MAX_SAFE_INTEGER);
    const firstEventSeq = events[0]?.seq;
    const eventGap =
      !effectiveFullSync &&
      cursor > 0 &&
      ((events.length === 0 && state.eventSeq > cursor) ||
        (firstEventSeq !== undefined && firstEventSeq > cursor + 1));
    if (eventGap) {
      cursor = 0;
      effectiveFullSync = true;
      events = await this.readEvents(state.id, 0, Number.MAX_SAFE_INTEGER);
    }
    const messagesDir = path.join(projectDir, "messages");
    const messageNames = (await fs.readdir(messagesDir)).sort();
    const handoffNames = messageNames.filter((name) => name.endsWith("_handoff.md"));
    const sources = new AgentContextSources();
    sources.list("project.history.events", "Recorded project events", events.map(event => ({ id: `event-${event.seq}`,
      name: `#${event.seq} ${event.type}`, type: event.type, agentId: event.agent, createdAt: event.ts, event })), "history");
    sources.list("project.history.handoffs", "Saved Agent handoffs", handoffNames.map(name => ({ id: name, name,
      path: path.join(messagesDir, name) })), "history");
    sources.list("project.workspace-checkpoints", "Unverified workspace checkpoint references", state.workspaceCheckpoints ?? [], "history");
    sources.list("project.published-artifacts", "Published artifact index", (state.artifacts ?? []).map(artifact => ({
      id: artifact.id, path: artifact.path, agentId: artifact.agent, kind: artifact.kind, size: artifact.size,
      updatedAt: artifact.updatedAt, sha256: artifact.sha256 })), "current");
    const contextRoot = path.join(projectDir, "runtime", "project-context");
    await fs.mkdir(contextRoot, { recursive: true, mode: 0o700 });
    const indexInput = { projectId: state.id, projectPath: projectDir, inboxPath: path.join(contextRoot, "Inbox.md"), sources: sources.sources };
    const published = await (this.contextIndexPublisher?.(indexInput) ?? publishAgentContextIndex(indexInput.inboxPath, indexInput.sources));
    const stateSummary = [
      `status=${state.status}`,
      `phase=${state.phase}`,
      `turn=${state.turn}`,
      `cycle=${state.cycle}`,
      `eventSeq=${state.eventSeq}`,
      `mainContextSeq=${state.mainContextSeq}`,
      `currentAgent=${state.currentAgent ?? "none"}`,
      `queuedAgent=${state.queuedAgent ?? "none"}`
    ].join(", ");
    const text = [
      `- Project path: \`${projectDir}\``,
      `- Workspace path: \`${workspaceDir}\``,
      `- Main context mode: ${effectiveFullSync ? "full" : "incremental"} (after event #${cursor})`,
      `- Current state: ${stateSummary}`,
      "",
      "## Control and display state",
      "",
      `- User intervention: ${state.userIntervention?.status ?? "none"}`,
      "",
      "<project-context-index>", published?.preview ?? "No historical records.", "</project-context-index>",
      "All handoff, event and artifact references remain in the complete expandable index. Open selected handoff paths; read selected publications with scienceevolve_read_published_artifact. Large bodies support bounded reads. Full events are retained in events.jsonl and timeline.md."
    ].join("\n");
    return { text, index: published };
  }

  private assertInvocationId(invocationId: string): void {
    if (!/^inv_[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(invocationId)) {
      throw new Error("Invalid invocation id");
    }
  }

  private transactionDir(projectId: string, invocationId: string): string {
    this.assertInvocationId(invocationId);
    const transactionsRoot = path.resolve(
      this.projectDir(projectId),
      ".transactions"
    );
    const candidate = path.resolve(transactionsRoot, invocationId);
    this.assertDescendant(transactionsRoot, candidate, "transaction");
    return candidate;
  }

  private assertDescendant(
    root: string,
    candidate: string,
    label: string
  ): void {
    if (!candidate.startsWith(`${root}${path.sep}`)) {
      throw new Error(`Invalid ${label} path`);
    }
  }

  private async tryReadCommitJournal(
    projectId: string,
    invocationId: string
  ): Promise<InvocationCommitJournal | undefined> {
    try {
      return await this.readCommitJournal(projectId, invocationId);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return undefined;
      }
      throw error;
    }
  }

  private async readCommitJournal(
    projectId: string,
    invocationId: string
  ): Promise<InvocationCommitJournal> {
    const journalPath = path.join(
      this.transactionDir(projectId, invocationId),
      "journal.json"
    );
    const domain = this.projectStateStore?.domain(projectId);
    const value = domain ? this.projectStateStore!.read(projectId, "invocation.commit")?.value
      : JSON.parse(await fs.readFile(journalPath, "utf8")) as unknown;
    if (domain && (!isRecord(value) || value.invocationId !== invocationId))
      throw Object.assign(new Error("No authoritative journal for this exact invocation"), { code: "ENOENT" });
    if (!isRecord(value)) {
      throw new Error(`Invalid invocation commit journal: ${journalPath}`);
    }
    if (
      value.version !== 1 ||
      (value.status !== "in_progress" && value.status !== "committed") ||
      value.projectId !== projectId ||
      value.invocationId !== invocationId ||
      typeof value.startedAt !== "string" ||
      !isRecord(value.stateBefore) ||
      value.stateBefore.id !== projectId ||
      !Array.isArray(value.messageFilesBefore) ||
      !value.messageFilesBefore.every(isSafeFileName) ||
      !Number.isSafeInteger(value.eventsSize) ||
      (value.eventsSize as number) < 0 ||
      !Number.isSafeInteger(value.timelineSize) ||
      (value.timelineSize as number) < 0
    ) {
      throw new Error(`Invalid invocation commit journal: ${journalPath}`);
    }
    if (
      value.committedAt !== undefined &&
      typeof value.committedAt !== "string"
    ) {
      throw new Error(`Invalid invocation commit journal: ${journalPath}`);
    }

    return value as unknown as InvocationCommitJournal;
  }

  private async restoreInvocationCommit(
    journal: InvocationCommitJournal,
    state?: ProjectState
  ): Promise<void> {
    const { projectId, invocationId } = journal;
    const transactionDir = this.transactionDir(projectId, invocationId);
    let preservedControlStatus:
      | "cancelling"
      | "cancelled"
      | "pausing"
      | "paused"
      | undefined =
      state?.status === "cancelling" ||
      state?.status === "cancelled" ||
      state?.status === "pausing" ||
      state?.status === "paused"
        ? state.status
        : undefined;
    let preservedControlPhase = preservedControlStatus ? state?.phase : undefined;
    let preservedCancelledAt =
      preservedControlStatus === "cancelled" ? state?.cancelledAt : undefined;
    let cancellationState = state;
    if (!state) {
      try {
        const persisted = await this.loadState(projectId);
        if (
          persisted.status === "cancelling" ||
          persisted.status === "cancelled" ||
          persisted.status === "pausing" ||
          persisted.status === "paused"
        ) {
          preservedControlStatus = persisted.status;
          preservedControlPhase = persisted.phase;
          preservedCancelledAt = persisted.cancelledAt;
          cancellationState = persisted;
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }

    const projectDir = this.projectDir(projectId);
    const originalMessages = new Set(journal.messageFilesBefore);
    const messagesDir = path.resolve(projectDir, "messages");
    const currentMessages = await fs.readdir(messagesDir, {
      withFileTypes: true
    });
    for (const entry of currentMessages) {
      if (originalMessages.has(entry.name) || entry.isDirectory()) continue;
      if (!isSafeFileName(entry.name)) {
        throw new Error("Invalid message filename during rollback");
      }
      const messagePath = path.resolve(messagesDir, entry.name);
      this.assertDescendant(messagesDir, messagePath, "message");
      await fs.unlink(messagePath);
    }

    await fs.truncate(
      path.join(projectDir, "events.jsonl"),
      journal.eventsSize
    );
    await fs.truncate(
      path.join(projectDir, "timeline.md"),
      journal.timelineSize
    );

    // A control request can arrive during any of the asynchronous restore
    // operations above. Re-sample the live object at the final synchronous
    // handoff so that rollback cannot overwrite that request.
    if (
      state &&
      (state.status === "cancelling" ||
        state.status === "cancelled" ||
        state.status === "pausing" ||
        state.status === "paused")
    ) {
      preservedControlStatus = state.status;
      preservedControlPhase = state.phase;
      preservedCancelledAt = state.cancelledAt;
      cancellationState = state;
    }

    const restoredState = structuredClone(journal.stateBefore);
    if (preservedControlStatus) {
      if (preservedControlStatus === "cancelling" || preservedControlStatus === "cancelled") {
        restoredState.cancelledBy = cancellationState?.cancelledBy;
        restoredState.cancelReason = cancellationState?.cancelReason;
        restoredState.cancellationRequestedAt = cancellationState?.cancellationRequestedAt;
        restoredState.cancellationSettledAt = cancellationState?.cancellationSettledAt;
      }
      restoredState.pauseRequest = cancellationState?.pauseRequest ?? state?.pauseRequest;
      restoredState.status = preservedControlStatus;
      restoredState.phase =
        preservedControlPhase ??
        (preservedControlStatus === "pausing"
          ? `pausing:after:${restoredState.currentAgent ?? "agent"}`
          : preservedControlStatus);
      if (preservedControlStatus === "cancelled") {
        restoredState.cancelledAt = preservedCancelledAt ?? nowIso();
        restoredState.completedAt = undefined;
        restoredState.currentAgent = undefined;
        restoredState.queuedAgent = undefined;
        restoredState.activeInvocationId = undefined;
        restoredState.retryAt = undefined;
      }
    }

    // Replace the live object before the final asynchronous write. A new
    // pause/cancel may mutate it while the write is in flight; there must be
    // no later Object.assign that can erase that mutation.
    if (state) {
      const mutableState = state as unknown as Record<string, unknown>;
      for (const key of Object.keys(mutableState)) {
        delete mutableState[key];
      }
      Object.assign(mutableState, structuredClone(restoredState));
    }
    await this.atomicJson(
      path.join(projectDir, "state.json"),
      structuredClone(restoredState)
    );
    if (this.projectStateStore?.domain(projectId)) {
      const marker = this.projectStateStore.read(projectId, "invocation.commit")!;
      const current = marker.value as InvocationCommitJournal | null;
      if (!current || current.invocationId !== invocationId || current.status !== "in_progress")
        throw new Error("Original invocation recovery lost its exact authoritative journal");
      this.projectStateStore.write(projectId, "invocation.commit", null, marker.version);
    }

    // Keep the in-progress marker until every authoritative file is restored.
    // If any earlier operation fails, startup recovery can repeat the rollback.
    await fs.rm(transactionDir, { recursive: true, force: true });
    const active = this.activeCommits.get(projectId);
    if (active?.invocationId === invocationId) {
      this.activeCommits.delete(projectId);
      active.resolveSettled();
    }
  }

  private async trimResidualJsonlTail(filePath: string): Promise<void> {
    const handle = await fs.open(filePath, "r+");
    try {
      const { size } = await handle.stat();
      if (size === 0) return;

      const lastByte = Buffer.allocUnsafe(1);
      const lastRead = await handle.read(lastByte, 0, 1, size - 1);
      if (lastRead.bytesRead === 1 && lastByte[0] === 0x0a) return;

      const chunkSize = 64 * 1024;
      let cursor = size;
      while (cursor > 0) {
        const start = Math.max(0, cursor - chunkSize);
        const buffer = Buffer.allocUnsafe(cursor - start);
        const { bytesRead } = await handle.read(
          buffer,
          0,
          buffer.length,
          start
        );
        for (let index = bytesRead - 1; index >= 0; index -= 1) {
          if (buffer[index] === 0x0a) {
            await handle.truncate(start + index + 1);
            return;
          }
        }
        cursor = start;
      }
      await handle.truncate(0);
    } finally {
      await handle.close();
    }
  }

  private trimResidualJsonlTailSync(filePath: string): void {
    const descriptor = openSync(filePath, "r+");
    try {
      const { size } = fstatSync(descriptor);
      if (size === 0) return;

      const lastByte = Buffer.allocUnsafe(1);
      if (
        readSync(descriptor, lastByte, 0, 1, size - 1) === 1 &&
        lastByte[0] === 0x0a
      ) {
        return;
      }

      const chunkSize = 64 * 1024;
      let cursor = size;
      while (cursor > 0) {
        const start = Math.max(0, cursor - chunkSize);
        const buffer = Buffer.allocUnsafe(cursor - start);
        const bytesRead = readSync(
          descriptor,
          buffer,
          0,
          buffer.length,
          start
        );
        for (let index = bytesRead - 1; index >= 0; index -= 1) {
          if (buffer[index] === 0x0a) {
            ftruncateSync(descriptor, start + index + 1);
            return;
          }
        }
        cursor = start;
      }
      ftruncateSync(descriptor, 0);
    } finally {
      closeSync(descriptor);
    }
  }

  private async atomicBuffer(filePath: string, value: Buffer, beforeCommit?: () => void): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const temporary = path.join(
      path.dirname(filePath),
      `.${path.basename(filePath)}.${process.pid}.${newId("tmp")}`
    );
    try {
      await fs.writeFile(temporary, value);
      for (let attempt = 0; ; attempt += 1) {
        try {
          beforeCommit?.();
          await fs.rename(temporary, filePath);
          break;
        } catch (error) {
          const code = (error as NodeJS.ErrnoException).code;
          if (attempt >= 6 || !["EPERM", "EACCES", "EBUSY"].includes(code ?? "")) {
            throw error;
          }
          // Windows can briefly deny replacement while another process has
          // state.json open. Keep the complete temporary file for retry.
          await new Promise<void>((resolve) =>
            setTimeout(resolve, Math.min(20 * 2 ** attempt, 500))
          );
        }
      }
    } catch (error) {
      await fs.unlink(temporary).catch((cleanupError) => {
        if ((cleanupError as NodeJS.ErrnoException).code !== "ENOENT") {
          // Preserve the original write error.
        }
      });
      throw error;
    }
  }

  private async atomicText(filePath: string, value: string, beforeCommit?: () => void): Promise<void> {
    await this.atomicBuffer(filePath, Buffer.from(value, "utf8"), beforeCommit);
  }

  private formalDocumentPath(filePath: string): { projectId: string; name: "project.checkpoint" | "invocation.commit" } | undefined {
    let directory = path.dirname(path.resolve(filePath));
    let name: "project.checkpoint" | "invocation.commit";
    if (path.basename(filePath) === "state.json") name = "project.checkpoint";
    else if (path.basename(filePath) === "journal.json" && path.basename(path.dirname(directory)) === ".transactions") {
      this.assertInvocationId(path.basename(directory));
      directory = path.dirname(path.dirname(directory)); name = "invocation.commit";
    } else return undefined;
    const candidate = path.basename(directory);
    const projectId = path.dirname(directory) === path.resolve(this.projectsDir()) && /^prj_[a-f0-9]{32}$/.test(candidate) ? candidate
      : Object.entries(this.directoryAliases).find(([, alias]) => path.resolve(alias) === directory)?.[0];
    return projectId && this.projectStateStore?.domain(projectId) ? { projectId, name } : undefined;
  }

  protected async atomicJson(filePath: string, value: unknown, beforeCommit?: () => void): Promise<void> {
    const target = this.formalDocumentPath(filePath);
    if (target) {
      const prior = this.projectStateStore!.read(target.projectId, target.name);
      if (!prior) throw new Error("Registered project has no authoritative document");
      beforeCommit?.();
      this.projectStateStore!.write(target.projectId, target.name, value, prior.version, document => {
        beforeCommit?.(); publishProjectStateDocumentView(filePath, document);
      });
      return;
    }
    await this.atomicText(filePath, `${JSON.stringify(value, null, 2)}\n`, beforeCommit);
  }

  private atomicJsonSync(filePath: string, value: unknown): void {
    const target = this.formalDocumentPath(filePath);
    if (target) {
      const prior = this.projectStateStore!.read(target.projectId, target.name);
      if (!prior) throw new Error("Registered project has no authoritative document");
      this.projectStateStore!.write(target.projectId, target.name, value, prior.version,
        document => publishProjectStateDocumentView(filePath, document));
      return;
    }
    const temporaryPath =
      `${filePath}.${process.pid}.${newId("tmp")}.tmp`;
    try {
      writeFileSync(
        temporaryPath,
        `${JSON.stringify(value, null, 2)}\n`,
        { encoding: "utf8", flag: "wx" }
      );
      renameSync(temporaryPath, filePath);
    } catch (error) {
      try {
        unlinkSync(temporaryPath);
      } catch {
        // Preserve the marker installation error.
      }
      throw error;
    }
  }
}

function textualArtifactMediaType(mediaType: string): boolean {
  return mediaType.startsWith("text/") ||
    /^(?:application\/(?:json|ld\+json|xml|yaml|javascript|x-javascript))$/i.test(mediaType);
}

/** Old hidden-Controller projects are intentionally not migrated or exposed. */
export class IncompatibleProjectStateError extends Error {
  override name = "IncompatibleProjectStateError";

  constructor(projectId: string) {
    super(`Project ${projectId} uses an incompatible pre-Main state format`);
  }
}

function isCurrentMainProjectState(value: unknown): value is ProjectState {
  if (!isRecord(value)) return false;
  const orchestration = value.orchestration;
  const configs = value.agents;
  if (
    !isRecord(orchestration) ||
    !Array.isArray(orchestration.agents) ||
    !isRecord(orchestration.routes) ||
    !isRecord(orchestration.termination) ||
    !isRecord(configs) ||
    Object.prototype.hasOwnProperty.call(value, "controllerContextSeq") ||
    Object.prototype.hasOwnProperty.call(value, "pendingControlRequest") ||
    Object.prototype.hasOwnProperty.call(value, "apiRecovery") ||
    Object.prototype.hasOwnProperty.call(value, "lastMainDecision") ||
    Object.prototype.hasOwnProperty.call(value, "latestWorkerResult") ||
    Object.prototype.hasOwnProperty.call(configs, "__system_controller__") ||
    orchestration.termination.decisionBy !== "main"
  ) {
    return false;
  }
  // Projects created by the new runtime are intentionally hard-cut to the
  // natural-language/tools protocol. A missing or older marker is an
  // incompatible project, never something startup may silently upgrade.
  if (value.controlProtocol !== "natural-language-tools-v1") return false;

  const names: string[] = [];
  for (const definition of orchestration.agents) {
    if (
      !isRecord(definition) ||
      typeof definition.name !== "string" ||
      Object.prototype.hasOwnProperty.call(definition, "kind")
    ) {
      return false;
    }
    names.push(definition.name);
  }
  if (names[0] !== "main" || names.filter((name) => name === "main").length !== 1) {
    return false;
  }

  const configuredNames = new Set(names);
  if (configuredNames.size !== names.length) return false;

  const scoped = orchestration.schemaVersion === 3;
  let scopedOuterNames: string[] | undefined;
  if (scoped) {
    if (!isRecord(value.git) || value.git.enabled !== true) return false;
    try {
      scopedOuterNames = workflowOuterNodeIds(normalizeAgentOrchestrationTemplate(orchestration));
    } catch {
      return false;
    }
  }

  const rawCollaborations = orchestration.collaborations;
  if (
    (orchestration.schemaVersion !== undefined && orchestration.schemaVersion !== 2 && !scoped) ||
    ((orchestration.schemaVersion === 2 || scoped) && !Array.isArray(rawCollaborations)) ||
    (rawCollaborations !== undefined && !Array.isArray(rawCollaborations))
  ) {
    return false;
  }
  const collaborations = Array.isArray(rawCollaborations)
    ? rawCollaborations
    : [];
  // Versioned groups must never reinterpret an unversioned historical state.
  if (collaborations.length > 0 && orchestration.schemaVersion !== 2 && !scoped) {
    return false;
  }
  const groupIds = new Set<string>();
  for (const group of collaborations) {
    if (
      !isRecord(group) ||
      typeof group.id !== "string" ||
      group.id.length === 0 ||
      typeof group.displayName !== "string" ||
      group.displayName.trim().length === 0 ||
      (group.renamePolicy !== "editable" && group.renamePolicy !== "locked") ||
      !Array.isArray(group.memberAgentIds) ||
      groupIds.has(group.id) ||
      configuredNames.has(group.id)
    ) {
      return false;
    }
    groupIds.add(group.id);
  }

  const groupByMember = new Map<string, string>();
  for (const group of collaborations) {
    const members = (group as Record<string, unknown>).memberAgentIds as unknown[];
    const localMembers = new Set<string>();
    for (const member of members) {
      if (
        typeof member !== "string" ||
        member === "main" ||
        groupIds.has(member) ||
        !configuredNames.has(member) ||
        localMembers.has(member) ||
        groupByMember.has(member)
      ) {
        return false;
      }
      localMembers.add(member);
      groupByMember.set(member, (group as Record<string, unknown>).id as string);
    }
    if (!scoped && localMembers.size < 2) return false;
  }

  const emittedGroups = new Set<string>();
  const children: string[] = scopedOuterNames?.filter((name) => name !== "main") ?? [];
  for (const name of names) {
    if (scoped) break;
    if (name === "main") continue;
    const groupId = groupByMember.get(name);
    if (groupId) {
      if (!emittedGroups.has(groupId)) {
        emittedGroups.add(groupId);
        children.push(groupId);
      }
    } else {
      children.push(name);
    }
  }
  if (!scoped && emittedGroups.size !== groupIds.size) return false;
  const outerNames = new Set(["main", ...children]);

  if (value.archivedAgentSessions !== undefined && !validArchivedWorkflowAgentSessions(value.archivedAgentSessions)) return false;
  const archive = value.archivedAgentSessions as ProjectState["archivedAgentSessions"];
  if (archive && isRecord(value.agentSessionIds)) {
    for (const [key, legacyId] of Object.entries(value.agentSessionIds)) {
      if (!isConfiguredAgentSessionKey(key, configuredNames) && archive.some(entry => entry.sessions[key]) &&
        !archivedWorkflowSessionMatches(archive, key, undefined, legacyId as string)) return false;
    }
  }
  const sessions = value.agentSessions;
  if (sessions !== undefined) {
    if (!isRecord(sessions)) return false;
    for (const [agent, session] of Object.entries(sessions)) {
      if (
        (!isConfiguredAgentSessionKey(agent, configuredNames) && !archivedWorkflowSessionMatches(archive, agent, session,
          isRecord(value.agentSessionIds) ? value.agentSessionIds[agent] as string | undefined : undefined)) ||
        !validateSessionRef(session).valid
      ) {
        return false;
      }
    }
  }

  for (const name of names) {
    const config = configs[name];
    // Newly-added optional runtime fields are deliberately allowed to be
    // absent. Startup normalization supplies their defaults. A missing role
    // object, however, means the state cannot be associated with the public
    // Agent contract.
    if (!isRecord(config)) return false;
    if (
      typeof config.sessionPersistence !== "boolean" ||
      (config.decisionBy !== "main" && config.decisionBy !== "agent")
    ) {
      return false;
    }
    if (
      name === SYSTEM_CONTROLLER_AGENT &&
      (config.sessionPersistence !== true || config.decisionBy !== "main")
    ) {
      return false;
    }
    // The previous product contract stored both fields on every Agent. They
    // are deliberately rejected instead of being silently mapped into the
    // new permission model: old projects are not migrated.
    if (
      Object.prototype.hasOwnProperty.call(config, "sandbox") ||
      Object.prototype.hasOwnProperty.call(config, "runtimeMode")
    ) {
      return false;
    }
  }
  if (Object.keys(configs).some((name) => !configuredNames.has(name))) {
    return false;
  }

  const mainRoutes = orchestration.routes.main;
  if (
    !Array.isArray(mainRoutes) ||
    mainRoutes.length !== children.length ||
    mainRoutes.some((edge, index) =>
      !isRecord(edge) || edge.kind !== "weak" || edge.target !== children[index]
    )
  ) {
    return false;
  }

  if (collaborations.length > 0) {
    if (
      !isRecord(orchestration.input) ||
      typeof orchestration.input.target !== "string" ||
      !outerNames.has(orchestration.input.target) ||
      typeof orchestration.termination.agent !== "string" ||
      !outerNames.has(orchestration.termination.agent) ||
      !isRecord(orchestration.decisionPlans)
    ) {
      return false;
    }
    for (const [source, plan] of Object.entries(orchestration.decisionPlans)) {
      if (!outerNames.has(source) || typeof plan !== "string") return false;
    }
  }

  for (const [source, routes] of Object.entries(orchestration.routes)) {
    if (
      collaborations.length > 0 || scoped
        ? !outerNames.has(source)
        : !configuredNames.has(source)
    ) {
      return false;
    }
    if (!Array.isArray(routes)) return false;
    for (const edge of routes) {
      if (!isRecord(edge) || typeof edge.target !== "string") return false;
      if (
        source === "main" &&
        (edge.kind !== "weak" || edge.target === "main" || edge.target === "finish")
      ) {
        return false;
      }
      if (
        collaborations.length > 0 &&
        edge.target !== "finish" &&
        !outerNames.has(edge.target)
      ) {
        return false;
      }
      if (edge.target === "__system_controller__") return false;
      if (edge.target === "controller" && !configuredNames.has("controller")) {
        return false;
      }
    }
  }
  return true;
}

function isConfiguredAgentSessionKey(
  sessionKey: string,
  configuredNames: ReadonlySet<string>
): boolean {
  if (configuredNames.has(sessionKey)) return true;
  const match = /^(.+)::collaboration:(leader|delivery|final-integration):(.+)$/.exec(
    sessionKey
  );
  return Boolean(
    match &&
    configuredNames.has(match[1]) &&
    match[3].trim().length > 0
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function gitReadEnvironment(): NodeJS.ProcessEnv {
  return {
    GIT_TERMINAL_PROMPT: "0",
    GCM_INTERACTIVE: "Never",
    GIT_PAGER: "cat",
    GIT_CONFIG_NOSYSTEM: "1",
    LC_ALL: "C",
    ...(process.env.PATH ? { PATH: process.env.PATH } : {}),
    ...(process.env.HOME ? { HOME: process.env.HOME } : {})
  };
}

async function readGitTreeEntry(
  repositoryPath: string,
  commitSha: string,
  relativePath: string
): Promise<{
  mode: string;
  type: string;
  objectId: string;
  size: number;
  path: string;
} | undefined> {
  const stdout = await new Promise<string>((resolve, reject) => {
    execFile(
      "git",
      ["-c", "core.hooksPath=/dev/null", "ls-tree", "-z", "-l", commitSha, "--", relativePath],
      {
        cwd: repositoryPath,
        env: gitReadEnvironment(),
        encoding: "utf8",
        timeout: 30_000,
        maxBuffer: 1024 * 1024
      },
      (error, output) => error ? reject(new Error("Unable to inspect accepted Git artifact tree")) : resolve(output)
    );
  });
  if (!stdout) return undefined;
  const entries = stdout.split("\0").filter(Boolean);
  if (entries.length !== 1) return undefined;
  const match = /^(\d{6})\s+(\w+)\s+([a-f0-9]{40,64})\s+(\d+)\t([\s\S]+)$/.exec(entries[0]);
  if (!match) return undefined;
  return {
    mode: match[1],
    type: match[2],
    objectId: match[3],
    size: Number.parseInt(match[4], 10),
    path: match[5]
  };
}

async function readGitBlob(
  repositoryPath: string,
  commitSha: string,
  relativePath: string,
  maxBytes: number
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    execFile(
      "git",
      ["-c", "core.hooksPath=/dev/null", "show", `${commitSha}:${relativePath}`],
      {
        cwd: repositoryPath,
        env: gitReadEnvironment(),
        encoding: "buffer",
        timeout: 60_000,
        maxBuffer: maxBytes
      },
      (error, output) => {
        if (error) {
          reject(new Error("Unable to materialize accepted Git artifact blob"));
          return;
        }
        resolve(Buffer.isBuffer(output) ? output : Buffer.from(output));
      }
    );
  });
}

function gitBlobObjectId(content: Buffer, objectIdLength: number): string {
  const algorithm = objectIdLength === 40
    ? "sha1"
    : objectIdLength === 64
      ? "sha256"
      : undefined;
  if (!algorithm) throw new Error("Git artifact object id uses an unsupported hash format");
  return createHash(algorithm)
    .update(`blob ${content.length}\0`, "utf8")
    .update(content)
    .digest("hex");
}

function isSafeFileName(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value !== "." &&
    value !== ".." &&
    !value.includes("/") &&
    !value.includes("\\") &&
    !value.includes("\0")
  );
}

function isUserVisibleWorkspacePath(relativePath: string): boolean {
  return relativePath
    .split("/")
    .every((segment) => segment.length > 0 && !segment.startsWith("."));
}
