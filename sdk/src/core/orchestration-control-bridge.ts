import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import net, { type Server, type Socket } from "node:net";
import path from "node:path";
import type {
  AgentName,
  AuthoritativeWorkflowFiles,
  ControlAction,
  ControlActionEnvelope
} from "./types.js";
import {
  containsCredentialMaterial,
  isSensitiveCredentialKey,
  redactTrace
} from "./utils.js";
import { controlDecisionsConflict } from "./orchestration-control-decisions.js";
import { sameControlActionRequest } from "./control-action-identity.js";
import { assertSiiControlAction } from "./sii-experiments.js";
import { CONTROL_OPERATION_TIMEOUT_MS } from "./control-request-lifetime.js";
import { CollaborationGitError } from "./collaboration-git/errors.js";
import type { ControlResultInput } from "./control-result-receipts.js";
import { CollaborationStateError } from "./collaboration-state/errors.js";
import { validateProjectStateRequest, type ProjectStateRequest } from "./project-state.js";

const MAX_LINE_BYTES = 1024 * 1024;
/** Transport activity only; this never counts as Agent/business progress. */
export const CONTROL_BRIDGE_PROGRESS_PROTOCOL = "control-pending-v1";
export const AUTHORITATIVE_WORKFLOW_DIRECTORY = "workflow";
export const AUTHORITATIVE_WORKFLOW_DEFINITION_FILE = "definition.json";
export const AUTHORITATIVE_WORKFLOW_CURRENT_STATE_FILE = "current-state.json";
export const AUTHORITATIVE_WORKFLOW_REFERENCES = Object.freeze({
  definition: `${AUTHORITATIVE_WORKFLOW_DIRECTORY}/${AUTHORITATIVE_WORKFLOW_DEFINITION_FILE}`,
  currentState: `${AUTHORITATIVE_WORKFLOW_DIRECTORY}/${AUTHORITATIVE_WORKFLOW_CURRENT_STATE_FILE}`
});
const authoritativeWorkflowPublicationQueues = new Map<string, Promise<void>>();

export function authoritativeWorkflowPaths(projectRoot: string): {
  directory: string;
  definition: string;
  currentState: string;
} {
  const directory = path.join(
    path.resolve(projectRoot),
    AUTHORITATIVE_WORKFLOW_DIRECTORY
  );
  return {
    directory,
    definition: path.join(directory, AUTHORITATIVE_WORKFLOW_DEFINITION_FILE),
    currentState: path.join(directory, AUTHORITATIVE_WORKFLOW_CURRENT_STATE_FILE)
  };
}

/**
 * Publishes the two server-owned workflow documents without ever exposing a
 * partially written JSON file. Calls for one project are serialized and a
 * stale SQLite projection is not allowed to replace a newer publication.
 * The writer fence is read again after queue waits and before each replacement.
 */
export function publishAuthoritativeWorkflowFiles(
  projectRoot: string,
  files: AuthoritativeWorkflowFiles,
  beforeCommit?: () => void
): Promise<void> {
  const queueKey = path.resolve(projectRoot);
  const prior = authoritativeWorkflowPublicationQueues.get(queueKey) ?? Promise.resolve();
  const queued = prior.catch(() => undefined).then(async () => {
    beforeCommit?.();
    validateAuthoritativeWorkflowFiles(files);
    const canonicalRoot = await fs.realpath(queueKey);
    const paths = authoritativeWorkflowPaths(canonicalRoot);
    beforeCommit?.();
    await fs.mkdir(paths.directory, { recursive: true, mode: 0o700 });
    if (await fs.realpath(paths.directory) !== paths.directory) {
      throw new Error("Authoritative workflow directory escapes the canonical project workspace");
    }
    const existing = await readPublishedCurrentState(paths.currentState);
    beforeCommit?.();
    if (existing && (
      existing.stateRevision > files.currentState.stateRevision ||
      (existing.stateRevision === files.currentState.stateRevision &&
        existing.workflowRevision > files.currentState.workflowRevision)
    )) return;

    const publicationId = `${process.pid}.${randomUUID()}`;
    const definitionTemporary = `${paths.definition}.${publicationId}.tmp`;
    const currentStateTemporary = `${paths.currentState}.${publicationId}.tmp`;
    try {
      beforeCommit?.();
      await fs.writeFile(
        definitionTemporary,
        `${JSON.stringify(files.definition, null, 2)}\n`,
        { encoding: "utf8", mode: 0o400, flag: "wx" }
      );
      await fs.writeFile(
        currentStateTemporary,
        `${JSON.stringify(files.currentState, null, 2)}\n`,
        { encoding: "utf8", mode: 0o400, flag: "wx" }
      );
      await replacePublishedWorkflowFile(definitionTemporary, paths.definition, beforeCommit);
      await replacePublishedWorkflowFile(currentStateTemporary, paths.currentState, beforeCommit);
      beforeCommit?.();
    } finally {
      await Promise.all([
        fs.rm(definitionTemporary, { force: true }),
        fs.rm(currentStateTemporary, { force: true })
      ]);
    }
  });
  authoritativeWorkflowPublicationQueues.set(queueKey, queued);
  return queued.finally(() => {
    if (authoritativeWorkflowPublicationQueues.get(queueKey) === queued) {
      authoritativeWorkflowPublicationQueues.delete(queueKey);
    }
  });
}

async function replacePublishedWorkflowFile(temporary: string, destination: string, beforeCommit?: () => void): Promise<void> {
  beforeCommit?.();
  let previousMode: number | undefined;
  if (process.platform === "win32") {
    try {
      const info = await fs.lstat(destination);
      if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1) {
        throw new Error("Authoritative workflow publication target must be a regular unlinked file");
      }
      previousMode = info.mode & 0o777;
      // Windows cannot atomically replace a file while its read-only attribute
      // is set. The replacement already carries the read-only attribute.
      beforeCommit?.();
      await fs.chmod(destination, 0o600);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  try {
    for (let attempt = 0; ; attempt += 1) {
      try {
        beforeCommit?.();
        await fs.rename(temporary, destination);
        break;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (process.platform !== "win32" || attempt >= 19 ||
            !["EPERM", "EACCES", "EBUSY"].includes(code ?? "")) throw error;
        // Concurrent Windows readers may briefly hold a handle without delete
        // sharing. Keep the old complete publication until replacement succeeds.
        await new Promise<void>((resolve) => setTimeout(resolve, 25));
      }
    }
  } catch (error) {
    if (previousMode !== undefined) {
      beforeCommit?.();
      await fs.chmod(destination, previousMode);
    }
    throw error;
  }
}

function validateAuthoritativeWorkflowFiles(files: AuthoritativeWorkflowFiles): void {
  if (
    files.definition.schemaVersion !== 1 ||
    files.currentState.schemaVersion !== 1 ||
    !files.definition.projectId ||
    files.definition.projectId !== files.currentState.projectId ||
    files.definition.workflowRevision !== files.currentState.workflowRevision ||
    !Number.isSafeInteger(files.definition.workflowRevision) ||
    files.definition.workflowRevision < 1 ||
    !Number.isSafeInteger(files.currentState.stateRevision) ||
    files.currentState.stateRevision < 1
  ) {
    throw new Error("Authoritative workflow files do not describe one valid SQLite revision");
  }
  assertCredentialFreeWorkflowDocument(files);
}

function assertCredentialFreeWorkflowDocument(
  value: unknown,
  location = "$",
  seen = new Set<object>()
): void {
  if (typeof value === "string") {
    if (containsCredentialMaterial(value)) {
      throw new Error(`Credential-like value is forbidden in authoritative workflow files at ${location}`);
    }
    return;
  }
  if (!value || typeof value !== "object") return;
  if (seen.has(value)) throw new Error("Authoritative workflow files must be acyclic JSON");
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertCredentialFreeWorkflowDocument(item, `${location}[${index}]`, seen));
  } else {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (isSensitiveCredentialKey(key)) {
        throw new Error(`Credential field ${location}.${key} is forbidden in authoritative workflow files`);
      }
      assertCredentialFreeWorkflowDocument(item, `${location}.${key}`, seen);
    }
  }
  seen.delete(value);
}

async function readPublishedCurrentState(
  filePath: string
): Promise<{ stateRevision: number; workflowRevision: number } | undefined> {
  try {
    const parsed = JSON.parse(await fs.readFile(filePath, "utf8")) as Record<string, unknown>;
    return typeof parsed.stateRevision === "number" &&
      typeof parsed.workflowRevision === "number"
      ? {
          stateRevision: parsed.stateRevision,
          workflowRevision: parsed.workflowRevision
        }
      : undefined;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT" || error instanceof SyntaxError) {
      return undefined;
    }
    throw error;
  }
}

export function hashControlCapability(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

export interface ControlActionRejection {
  code: string;
  message: string;
  invalidField?: string;
  currentRevision?: number;
  workflowRevision?: number;
  stateDetails?: Readonly<Record<string, unknown>>;
  /** Exact journal identity, not authority to repeat a provider mutation. */
  operationId?: string;
  reconcileRequired?: boolean;
  retryable?: boolean;
  status?: "completed" | "remote_success_local_pending";
  localStage?: "synchronization_pending" | "journal_finalization_pending" | "synchronized" | "not_required";
  authoritativeFiles?: {
    definition: string;
    currentState: string;
  };
}

/** A semantic rejection that is safe to return to the active Harness turn. */
export class ControlActionRejectedError extends Error {
  constructor(readonly rejection: ControlActionRejection) {
    super(rejection.message);
    this.name = "ControlActionRejectedError";
  }
}

export interface ControlActionServiceOptions {
  projectId: string;
  agent: AgentName;
  invocationId: string;
  stateVersion: number;
  capability: string;
  capabilityHash?: string;
  expiresAt?: string;
  stagingPath: string;
  /** Re-checks the current project state while its serialized write lock is held. */
  revalidate: (
    envelope: ControlActionEnvelope,
    stagedActions: ControlActionEnvelope[]
  ) => Promise<void>;
  /** Records a rejected invocation action without exposing the bearer secret. */
  onRejected?: (envelope: ControlActionEnvelope | undefined, error: Error) => Promise<void>;
  /** Called with the canonical staged envelope before returning acceptance.
   * A persistent authority may reject the request; the staging file alone
   * then cannot be used as that authority's accepted business receipt. */
  onStaged?: (envelope: ControlActionEnvelope) => Promise<void>;
  /** Executes an explicit Agent-owned business action after it is accepted.
   * The returned value is sent only to the same live Agent turn. */
  execute?: (envelope: ControlActionEnvelope, signal: AbortSignal) => Promise<unknown>;
  /** Server-bound identity and current ownership are checked by the shared
   * state service. This channel does not stage or replace workflow decisions. */
  projectState?: (request: ProjectStateRequest) => Promise<unknown> | unknown;
  /** Retains returned facts before transport. Saving them does not prove reception. */
  onResult?: (input: ControlResultInput) => Promise<string> | string;
  signal?: AbortSignal;
}

/**
 * The sole writer for an invocation's control staging record. The MCP child
 * supplies only a bearer capability, call id, and already schema-checked tool
 * action; project identity and the durable staging location stay server-owned.
 */
export class ControlActionService {
  private revoked = false;
  private sealed = false;
  private writeQueue: Promise<void> = Promise.resolve();
  private readonly results = new Map<string, unknown>();
  private readonly pendingResults = new Map<string, Promise<unknown>>();
  private readonly controller = new AbortController();
  private readonly activeRequests = new Set<Promise<unknown>>();

  constructor(private readonly options: ControlActionServiceOptions) {}

  get stateVersion(): number {
    return this.options.stateVersion;
  }

  revoke(): void {
    this.revoked = true;
    this.controller.abort(new Error("control capability has been revoked"));
  }

  seal(): void {
    this.sealed = true;
  }

  /** A disconnected client is not proof that its accepted callback stopped.
   * Retain the native/session reservation until actual execution settles. The
   * callback receives the bounded operation and turn cancellation signals. */
  async drain(): Promise<void> {
    for (;;) {
      const writes = this.writeQueue;
      await Promise.allSettled([writes, ...this.activeRequests]);
      if (writes === this.writeQueue && this.activeRequests.size === 0) return;
    }
  }

  async stage(
    capability: string,
    callId: string,
    action: ControlAction
  ): Promise<ControlActionEnvelope> {
    this.assertCapability(capability, true);
    if (!isCallId(callId)) throw new Error("callId is invalid");
    if (!isKnownControlAction(action)) throw new Error("control action is invalid");

    let envelope: ControlActionEnvelope | undefined;
    const operation = this.writeQueue.then(async () => {
      this.assertCapability(capability, true);
      envelope = {
        projectId: this.options.projectId,
        agent: this.options.agent,
        invocationId: this.options.invocationId,
        callId,
        stateVersion: this.options.stateVersion,
        ...(this.options.capabilityHash
          ? { capabilityHash: this.options.capabilityHash }
          : {}),
        ...(this.options.expiresAt ? { expiresAt: this.options.expiresAt } : {}),
        receivedAt: new Date().toISOString(),
        action
      };

      // This callback is intentionally invoked inside the per-invocation
      // staging queue. The orchestrator serializes it with project writes so
      // a paused, cancelled, superseded, or replaced invocation cannot stage
      // an action after its authority has ended.
      try {
        const current = await readStagedControlActions(this.options.stagingPath);
        const existing = current.find((item) => item.callId === callId);
        if (existing) {
          if (
            !sameControlActionRequest(existing.action, action) &&
            !samePreparatoryEffect(existing.action, action)
          ) {
            throw new Error("callId was already used for a different action");
          }
        }
        const lockedDecision = current.find((item) => controlDecisionsConflict(item.action, action));
        if (lockedDecision) {
          // A provider may repeat its already accepted decision with a
          // newly generated call id after seeing the tool result. Treat only
          // an equivalent transition as idempotent: the first envelope stays
          // authoritative and no second action is appended. A changed route,
          // a changed user request, or a different decision tool still fails
          // closed as a conflicting decision. Independent failed arrivals
          // retain separate choices, validated by the same live authority.
          if (!sameDecision(lockedDecision.action, action)) throw new Error("the invocation decision is already locked");
        }
        const equivalentPreparation = current.find((item) =>
          samePreparatoryEffect(item.action, action)
        );
        if (!equivalentPreparation && action.tool === "finish_task" && current.some((item) => item.action.tool === "finish_task")) {
          throw new Error("task completion is already staged with different content; the first finish_task is already accepted. Preserve its summary and memory, complete any remaining authorized actions, then return your handoff. Do not resubmit finish_task with revised content.");
        }
        // Reject conflicting call identities/content before revalidation:
        // live finish_task may save Agent-authored memory there. A rejected
        // request must not mint a receipt or cause those filesystem effects.
        // Valid repeats still revalidate current authority before returning.
        await assertSiiControlAction(this.options.projectId, this.options.agent, this.options.invocationId, action);
        await this.options.revalidate(envelope!, current);
        const accepted = async (canonical: ControlActionEnvelope) => {
          await this.options.onStaged?.(structuredClone(canonical));
          return canonical;
        };
        if (existing) return await accepted(existing);
        if (lockedDecision) return await accepted(lockedDecision);
        if (equivalentPreparation) return await accepted(equivalentPreparation);
        if (action.tool === "select_display") {
          const previousDisplayIndex = current.findIndex(
            (item) => item.action.tool === "select_display"
          );
          if (previousDisplayIndex >= 0) {
            const replacement = [...current];
            replacement[previousDisplayIndex] = envelope!;
            await writeStagedControlActions(this.options.stagingPath, replacement);
            return await accepted(envelope!);
          }
        }
        await writeStagedControlActions(this.options.stagingPath, [...current, envelope!]);
        return await accepted(envelope!);
      } catch (error) {
        try {
          await this.options.onRejected?.(
            envelope,
            error instanceof Error ? error : new Error(String(error))
          );
        } catch {
          // Rejection auditing must never turn a useful tool error into a
          // capability or transport failure.
        }
        throw error;
      }
    });
    this.writeQueue = operation.then(
      () => undefined,
      () => undefined
    );
    return operation;
  }

  async requestProjectState(capability: string, value: unknown): Promise<unknown> {
    this.assertCapability(capability, true);
    const request = validateProjectStateRequest(value);
    const operation = this.writeQueue.then(async () => {
      this.assertCapability(capability, true);
      this.options.signal?.throwIfAborted();
      this.controller.signal.throwIfAborted();
      if (!this.options.projectState) throw new Error("Project state service is unavailable for this invocation");
      return this.options.projectState(request);
    });
    this.writeQueue = operation.then(() => {}, () => {});
    this.activeRequests.add(operation);
    try { return await operation; } finally { this.activeRequests.delete(operation); }
  }

  stageWithResult(
    capability: string,
    callId: string,
    action: ControlAction,
    onPending?: () => void
  ): Promise<{ envelope: ControlActionEnvelope; result?: unknown; receiptId?: string }> {
    const request = this.executeStagedRequest(capability, callId, action, onPending);
    this.activeRequests.add(request);
    void request.then(() => this.activeRequests.delete(request), () => this.activeRequests.delete(request));
    return request;
  }

  private async executeStagedRequest(
    capability: string,
    callId: string,
    action: ControlAction,
    onPending?: () => void
  ): Promise<{ envelope: ControlActionEnvelope; result?: unknown; receiptId?: string }> {
    // Pending means only that this exact authenticated request is being
    // handled. Revalidation, native cancellation and tool budgets still own
    // permission/lifetime; the bridge must never decide or retry Agent work.
    this.assertCapability(capability, true);
    if (!isCallId(callId)) throw new Error("callId is invalid");
    if (!isKnownControlAction(action)) throw new Error("control action is invalid");
    onPending?.();
    const envelope = await this.stage(capability, callId, action);
    if (!isAgentGitAction(action) || !this.options.execute) return this.retainResult(envelope, callId);
    if (this.results.has(callId)) return this.retainResult(envelope, callId, this.results.get(callId));
    // An Agent can reconnect/repeat the same call while its original result
    // is pending. Join that operation; never perform a second Git mutation.
    let pending = this.pendingResults.get(callId);
    if (!pending) {
      const deadline = new AbortController();
      const timer = setTimeout(() => deadline.abort(new Error(
        "accepted control operation exceeded its deadline; inspect its original journal before retrying"
      )), CONTROL_OPERATION_TIMEOUT_MS);
      timer.unref();
      const signal = AbortSignal.any([this.controller.signal, deadline.signal,
        ...(this.options.signal ? [this.options.signal] : [])]);
      pending = Promise.resolve().then(() => {
        signal.throwIfAborted();
        return this.options.execute!(envelope, signal);
      }).finally(() => clearTimeout(timer));
      this.pendingResults.set(callId, pending);
    }
    try {
      const result = await pending;
      this.results.set(callId, result);
      // A late, known result remains durable even if the caller's capability
      // has since expired. It grants no permission and is not a receipt.
      const retained = await this.retainResult(envelope, callId, result);
      this.assertCapability(capability);
      return retained;
    } finally {
      if (this.pendingResults.get(callId) === pending) this.pendingResults.delete(callId);
    }
  }

  private async retainResult(envelope: ControlActionEnvelope, requestedCallId: string, result?: unknown) {
    const receiptId = await this.options.onResult?.({ envelope, requestedCallId,
      ...(result === undefined ? {} : { result }) });
    if (receiptId !== undefined && !/^[a-f0-9]{64}$/.test(receiptId)) throw new Error("Invalid control result receipt identity");
    return { envelope, ...(result === undefined ? {} : { result }), ...(receiptId ? { receiptId } : {}) };
  }

  private assertCapability(capability: string, admission = false): void {
    if (this.revoked) throw new Error("control capability has been revoked");
    if (admission && this.sealed) throw new Error("control turn no longer accepts new actions");
    if (this.options.expiresAt && Date.parse(this.options.expiresAt) <= Date.now()) {
      throw new Error("control capability has expired");
    }
    const expected = Buffer.from(this.options.capability, "utf8");
    const supplied = Buffer.from(capability, "utf8");
    if (
      expected.length !== supplied.length ||
      !timingSafeEqual(expected, supplied)
    ) {
      throw new Error("control capability is invalid");
    }
  }
}

function sameDecision(existing: ControlAction, candidate: ControlAction): boolean {
  if (existing.tool === "coordinate_agent_receipt" && candidate.tool === "coordinate_agent_receipt") return JSON.stringify(existing) === JSON.stringify(candidate);
  if (existing.tool === "coordinate_group_task" && candidate.tool === "coordinate_group_task") return JSON.stringify(existing) === JSON.stringify(candidate);
  if (existing.tool === "route_to_agent" && candidate.tool === "route_to_agent") {
    return existing.target === candidate.target;
  }
  if (existing.tool === "complete_project" && candidate.tool === "complete_project") {
    return true;
  }
  if (existing.tool === "request_user" && candidate.tool === "request_user") {
    return JSON.stringify(existing) === JSON.stringify(candidate);
  }
  if (existing.tool === "apply_workflow" && candidate.tool === "apply_workflow") {
    return existing.path === candidate.path;
  }
  if (existing.tool === "assign_group_tasks" && candidate.tool === "assign_group_tasks") {
    return existing.groupRunId === candidate.groupRunId &&
      existing.coordinatorEpoch === candidate.coordinatorEpoch &&
      JSON.stringify(existing.tasks) === JSON.stringify(candidate.tasks);
  }
  if (existing.tool === "claim_group_task" && candidate.tool === "claim_group_task") {
    return existing.taskId === candidate.taskId &&
      existing.coordinatorEpoch === candidate.coordinatorEpoch;
  }
  if (
    existing.tool === "request_group_integration" &&
    candidate.tool === "request_group_integration"
  ) {
    return existing.groupRunId === candidate.groupRunId &&
      existing.coordinatorEpoch === candidate.coordinatorEpoch &&
      existing.integrationOwnerAgentId === candidate.integrationOwnerAgentId;
  }
  if (existing.tool === "complete_group" && candidate.tool === "complete_group") {
    return existing.groupRunId === candidate.groupRunId &&
      existing.coordinatorEpoch === candidate.coordinatorEpoch &&
      existing.output === candidate.output;
  }
  return false;
}

function samePreparatoryEffect(existing: ControlAction, candidate: ControlAction): boolean {
  if (existing.tool === "finish_task" && candidate.tool === "finish_task") {
    return JSON.stringify(existing) === JSON.stringify(candidate);
  }
  if (existing.tool === "publish_artifact" && candidate.tool === "publish_artifact") {
    return existing.path === candidate.path && existing.replacesPath === candidate.replacesPath;
  }
  if (existing.tool !== "select_display" || candidate.tool !== "select_display") {
    return false;
  }
  const existingEntries = [existing.primary, ...(existing.items ?? [])];
  const candidateEntries = [candidate.primary, ...(candidate.items ?? [])];
  return existingEntries.length === candidateEntries.length &&
    existingEntries.every((item, index) =>
      item.agent === candidateEntries[index]?.agent &&
      item.path === candidateEntries[index]?.path
    );
}

export interface ControlBridgeEndpoint {
  path?: string;
  host?: string;
  port?: number;
}

export interface ControlActionBridge {
  endpoint: ControlBridgeEndpoint;
  close(): Promise<void>;
}

interface BridgeRequest {
  capability?: unknown;
  callId?: unknown;
  action?: unknown;
  stateRequest?: unknown;
  progressProtocol?: unknown;
}

interface BridgeResponse {
  ok: boolean;
  envelope?: ControlActionEnvelope;
  result?: unknown;
  stateResult?: unknown;
  receiptId?: string;
  error?: ControlActionRejection;
}

/**
 * Start an invocation-local bridge. Unix sockets avoid exposing a network
 * listener in the normal case; a randomly assigned loopback port is used only
 * where a local Unix socket cannot be created.
 */
export async function startControlActionBridge(
  service: ControlActionService,
  runtimePath: string
): Promise<ControlActionBridge> {
  const sockets = new Set<Socket>();
  const server = net.createServer((socket) => {
    sockets.add(socket);
    socket.setEncoding("utf8");
    socket.on("close", () => sockets.delete(socket));
    socket.on("error", () => socket.destroy());
    let buffered = "";
    let queue: Promise<void> = Promise.resolve();
    socket.on("data", (chunk: string) => {
      buffered += chunk;
      if (Buffer.byteLength(buffered, "utf8") > MAX_LINE_BYTES) {
        socket.destroy(new Error("control bridge request is too large"));
        return;
      }
      while (true) {
        const newline = buffered.indexOf("\n");
        if (newline < 0) break;
        const line = buffered.slice(0, newline);
        buffered = buffered.slice(newline + 1);
        queue = queue.then(() => handleBridgeLine(socket, service, line));
      }
    });
  });

  const socketPath = path.join(runtimePath, "orchestration-control.sock");
  let endpoint: ControlBridgeEndpoint;
  try {
    await fs.rm(socketPath, { force: true });
    await listen(server, socketPath);
    endpoint = { path: socketPath };
  } catch {
    await closeServer(server);
    const fallback = net.createServer((socket) => {
      sockets.add(socket);
      socket.setEncoding("utf8");
      socket.on("close", () => sockets.delete(socket));
      socket.on("error", () => socket.destroy());
      let buffered = "";
      let queue: Promise<void> = Promise.resolve();
      socket.on("data", (chunk: string) => {
        buffered += chunk;
        if (Buffer.byteLength(buffered, "utf8") > MAX_LINE_BYTES) {
          socket.destroy(new Error("control bridge request is too large"));
          return;
        }
        while (true) {
          const newline = buffered.indexOf("\n");
          if (newline < 0) break;
          const line = buffered.slice(0, newline);
          buffered = buffered.slice(newline + 1);
          queue = queue.then(() => handleBridgeLine(socket, service, line));
        }
      });
    });
    await listen(fallback, 0, "127.0.0.1");
    const address = fallback.address();
    if (!address || typeof address === "string") {
      await closeServer(fallback);
      throw new Error("control bridge did not receive a loopback address");
    }
    endpoint = { host: "127.0.0.1", port: address.port };
    return bridgeHandle(fallback, sockets, service, endpoint, socketPath);
  }
  return bridgeHandle(server, sockets, service, endpoint, socketPath);
}

export async function readStagedControlActions(
  stagingPath: string
): Promise<ControlActionEnvelope[]> {
  try {
    const parsed = JSON.parse(await fs.readFile(stagingPath, "utf8")) as unknown;
    return Array.isArray(parsed) ? parsed as ControlActionEnvelope[] : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function handleBridgeLine(
  socket: Socket,
  service: ControlActionService,
  line: string
): Promise<void> {
  let response: BridgeResponse;
  let stateRequest = false;
  let pendingTimer: ReturnType<typeof setInterval> | undefined;
  const clearPending = () => {
    if (pendingTimer) clearInterval(pendingTimer);
    pendingTimer = undefined;
  };
  socket.once("close", clearPending);
  try {
    const request = JSON.parse(line) as BridgeRequest;
    stateRequest = request.stateRequest !== undefined;
    if (request.stateRequest !== undefined) {
      if (typeof request.capability !== "string" || request.action !== undefined)
        throw new Error("State bridge requires one authenticated state request");
      if (request.progressProtocol === CONTROL_BRIDGE_PROGRESS_PROTOCOL && typeof request.callId === "string") {
        const notify = () => {
          if (!socket.destroyed && !socket.writableEnded) socket.write(`${JSON.stringify({
            protocol: CONTROL_BRIDGE_PROGRESS_PROTOCOL, callId: request.callId, pending: true
          })}\n`);
        };
        notify(); pendingTimer = setInterval(notify, 1_000); pendingTimer.unref();
      }
      const stateResult = await service.requestProjectState(request.capability, request.stateRequest);
      clearPending();
      if (!socket.destroyed && !socket.writableEnded) socket.write(`${JSON.stringify({ ok: true, stateResult })}\n`);
      return;
    }
    if (
      typeof request.capability !== "string" ||
      typeof request.callId !== "string" ||
      !request.action ||
      typeof request.action !== "object"
    ) {
      throw new Error("control bridge request is invalid");
    }
    const staged = await service.stageWithResult(
      request.capability,
      request.callId,
      request.action as ControlAction,
      request.progressProtocol === CONTROL_BRIDGE_PROGRESS_PROTOCOL ? () => {
        const notify = () => {
          if (!socket.destroyed && !socket.writableEnded) socket.write(`${JSON.stringify({
            protocol: CONTROL_BRIDGE_PROGRESS_PROTOCOL, callId: request.callId, pending: true
          })}\n`);
        };
        // Legacy callers still receive one final frame. New callers keep
        // their exact request alive without extending native tool deadlines.
        notify();
        pendingTimer = setInterval(notify, 1_000);
        pendingTimer.unref();
      } : undefined
    );
    response = { ok: true, envelope: staged.envelope,
      ...(staged.receiptId ? { receiptId: staged.receiptId } : {}),
      ...(staged.result === undefined ? {} : { result: staged.result }) };
  } catch (error) {
    const message = error instanceof Error
      ? redactTrace(error.message).trim().slice(0, 1_000)
      : "control bridge request failed";
    const detail = error instanceof ControlActionRejectedError
      ? {
          ...error.rejection,
          message: redactTrace(error.rejection.message).trim().slice(0, 1_000) ||
            "control bridge request failed"
        }
      : {
          code: error instanceof CollaborationGitError || error instanceof CollaborationStateError ? error.code : "CONTROL_ACTION_REJECTED",
          message: message || "control bridge request failed",
          ...(stateRequest
            ? error instanceof CollaborationStateError && typeof error.details.projectRevision === "number" &&
              Number.isSafeInteger(error.details.projectRevision) ? { currentRevision: error.details.projectRevision } : {}
            : { invalidField: "action", currentRevision: service.stateVersion, authoritativeFiles: AUTHORITATIVE_WORKFLOW_REFERENCES }),
          ...(error instanceof CollaborationStateError && !containsCredentialMaterial(JSON.stringify(error.details))
            ? { stateDetails: error.details,
                ...(typeof error.details.invalidField === "string" ? { invalidField: error.details.invalidField } : {}) } : {}),
          ...(error instanceof CollaborationGitError ? {
            retryable: error.retryable,
            ...(typeof error.publicData.operationId === "string" && error.publicData.operationId.trim() &&
              error.publicData.operationId.length <= 1_024 && !containsCredentialMaterial(error.publicData.operationId)
              ? { operationId: error.publicData.operationId } : {}),
            ...(["completed", "remote_success_local_pending"].includes(String(error.publicData.status))
              ? { status: error.publicData.status as ControlActionRejection["status"] } : {}),
            ...(["synchronization_pending", "journal_finalization_pending", "synchronized", "not_required"].includes(String(error.publicData.localStage))
              ? { localStage: error.publicData.localStage as ControlActionRejection["localStage"] } : {}),
            ...(typeof error.publicData.reconcileRequired === "boolean"
              ? { reconcileRequired: error.publicData.reconcileRequired } : {})
          } : {})
        };
    response = {
      ok: false,
      error: detail
    };
  } finally {
    clearPending();
    socket.off("close", clearPending);
  }
  if (!socket.destroyed) socket.write(`${JSON.stringify(response)}\n`);
}

function bridgeHandle(
  server: Server,
  sockets: Set<Socket>,
  service: ControlActionService,
  endpoint: ControlBridgeEndpoint,
  socketPath: string
): ControlActionBridge {
  let closed = false;
  return {
    endpoint,
    async close(): Promise<void> {
      if (closed) return;
      closed = true;
      service.revoke();
      for (const socket of sockets) socket.destroy();
      await closeServer(server);
      if (endpoint.path) await fs.rm(socketPath, { force: true });
    }
  };
}

async function writeStagedControlActions(
  stagingPath: string,
  actions: ControlActionEnvelope[]
): Promise<void> {
  await fs.mkdir(path.dirname(stagingPath), { recursive: true });
  const temporary = `${stagingPath}.${process.pid}.${randomUUID()}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(actions, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
    flag: "wx"
  });
  await fs.rename(temporary, stagingPath);
}

function listen(server: Server, target: string | number, host?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const onListening = () => {
      cleanup();
      resolve();
    };
    const cleanup = () => {
      server.off("error", onError);
      server.off("listening", onListening);
    };
    server.once("error", onError);
    server.once("listening", onListening);
    if (typeof target === "string") server.listen(target);
    else server.listen(target, host);
  });
}

function closeServer(server: Server): Promise<void> {
  if (!server.listening) return Promise.resolve();
  return new Promise((resolve) => server.close(() => resolve()));
}

function isCallId(value: string): boolean {
  return value.trim().length > 0 && value.length <= 256;
}

function isKnownControlAction(value: ControlAction): boolean {
  return Boolean(value && typeof value === "object" && (
    value.tool === "finish_task" ||
    value.tool === "git_push" ||
    value.tool === "git_get_operation" ||
    value.tool === "git_reconcile_push" ||
    value.tool === "github_create_pr" ||
    value.tool === "github_get_pr" ||
    value.tool === "github_merge_pr" ||
    value.tool === "github_close_pr" ||
    value.tool === "git_prepare_conflict" ||
    value.tool === "git_log" || value.tool === "git_show" || value.tool === "git_diff" || value.tool === "git_revert" ||
    value.tool === "route_to_agent" ||
    value.tool === "publish_artifact" ||
    value.tool === "select_display" ||
    value.tool === "request_user" ||
    value.tool === "apply_workflow" ||
    value.tool === "complete_project" ||
    value.tool === "assign_group_tasks" ||
    value.tool === "claim_group_task" ||
    value.tool === "request_group_integration" ||
    value.tool === "complete_group" ||
    value.tool === "coordinate_group_task" ||
    value.tool === "coordinate_agent_receipt"
  ));
}

function isAgentGitAction(value: ControlAction): boolean {
  return value.tool === "git_push" || value.tool === "git_get_operation" || value.tool === "git_reconcile_push" || value.tool === "github_create_pr" ||
    value.tool === "github_get_pr" || value.tool === "github_merge_pr" || value.tool === "github_close_pr" ||
    value.tool === "git_prepare_conflict" || value.tool === "git_log" || value.tool === "git_show" || value.tool === "git_diff" || value.tool === "git_revert";
}
