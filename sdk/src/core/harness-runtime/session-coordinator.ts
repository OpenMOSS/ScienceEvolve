import type {
  HarnessAdapter,
  HarnessAdapterRequest,
  InvocationInputs,
  SessionRef
} from "./contracts.js";
import { HarnessRuntimeError } from "./errors.js";
import { validateSessionRef } from "./session-ref.js";
import { deriveInvocationSessionPolicy } from "../internal/shared/invocation-session-policy.js";

export interface PreparedHarnessSession {
  session: SessionRef;
  resumed: boolean;
  replaced: boolean;
  resumeFailure?: {
    code: "SESSION_RESUME_FAILED";
    previousHarnessId?: string;
    previousNativeId?: string;
    reason: string;
  };
}

/** Owns durable/ephemeral Session preparation and continuation semantics. */
export class SessionCoordinator {
  async prepare(
    adapter: HarnessAdapter,
    request: HarnessAdapterRequest,
    inputs: InvocationInputs
  ): Promise<PreparedHarnessSession> {
    const taskSessionId = request.taskSessionId;
    const taskSessions = request.project.taskSessionRefs as unknown;
    const taskSessionIds = request.project.taskSessionIds as unknown;
    const taskSession = taskSessionId && isRecord(taskSessions)
      ? taskSessions[taskSessionId]
      : undefined;
    const taskLegacyValue = taskSessionId && isRecord(taskSessionIds)
      ? taskSessionIds[taskSessionId]
      : undefined;
    const taskLegacy = typeof taskLegacyValue === "string" ? taskLegacyValue : undefined;
    // A task-scoped invocation remains durable for its whole lifetime. The
    // Worker preference only affects reuse between independent tasks.
    const durable = Boolean(taskSessionId) || request.sessionContinuity === "strict" || deriveInvocationSessionPolicy(
      request.kind,
      request.project.agents[request.agent]?.sessionPersistence === true
    ).durableSession;
    const persistedSessions = request.project.agentSessions as unknown;
    const hasTaskPersisted = taskSession !== undefined;
    const hasPersisted = hasTaskPersisted || (isRecord(persistedSessions) &&
      Object.prototype.hasOwnProperty.call(persistedSessions, request.agent));
    const persisted = hasTaskPersisted
      ? taskSession
      : hasPersisted && isRecord(persistedSessions)
        ? persistedSessions[request.agent]
        : undefined;
    const legacy = request.resumeThreadId ?? taskLegacy ?? request.project.agentSessionIds?.[request.agent];
    const priorGeneration = recoverableGeneration(persisted) ??
      recoverableGeneration(request.project.agentSessionMeta?.[request.agent]) ?? 0;

    if (durable && hasPersisted) {
      const validation = validateSessionRef(persisted);
      if (!validation.valid) {
        return this.replacement(adapter, request, inputs, priorGeneration + 1, {
          code: "SESSION_RESUME_FAILED",
          ...sessionIdentityHints(persisted),
          reason: `Persisted SessionRef is invalid: ${validation.reason}`
        });
      }
      const rejection = this.validatePersisted(adapter, validation.session);
      if (!rejection) {
        const session = { ...validation.session, resumedAt: new Date().toISOString() };
        return {
          session,
          resumed: true,
          replaced: false
        };
      }
      return this.replacement(adapter, request, inputs, priorGeneration + 1, {
        code: "SESSION_RESUME_FAILED",
        previousHarnessId: validation.session.harnessId,
        previousNativeId: validation.session.nativeId,
        reason: rejection
      });
    }

    if (durable && legacy) {
      const migrated = adapter.sessionFromLegacyId?.(legacy, priorGeneration, true);
      const validation = validateSessionRef(migrated);
      if (validation.valid &&
        validation.session.generation === priorGeneration &&
        !this.validatePersisted(adapter, validation.session)) {
        const session = { ...validation.session, resumedAt: new Date().toISOString() };
        return {
          session,
          resumed: true,
          replaced: false
        };
      }
      return this.replacement(adapter, request, inputs, priorGeneration + 1, {
        code: "SESSION_RESUME_FAILED",
        previousNativeId: legacy,
        reason: "Adapter rejected the persisted legacy session ID"
      });
    }

    const session = await this.createValidatedSession(
      adapter,
      request,
      inputs,
      priorGeneration,
      durable
    );
    return {
      session,
      resumed: false,
      replaced: false
    };
  }

  resume(adapter: HarnessAdapter, previous: SessionRef): PreparedHarnessSession {
    const validation = validateSessionRef(previous);
    const rejection = validation.valid
      ? this.validatePersisted(adapter, validation.session)
      : validation.reason;
    if (!validation.valid || rejection) {
      throw new HarnessRuntimeError(
        "SESSION_RESUME_FAILED",
        "The original native Session cannot be resumed; it was preserved for explicit recovery",
        { harnessId: adapter.descriptor.id, reason: rejection },
        { source: "runtime", retryable: false }
      );
    }
    return {
      session: { ...validation.session, resumedAt: new Date().toISOString() },
      resumed: true,
      replaced: false
    };
  }

  async replace(
    adapter: HarnessAdapter,
    request: HarnessAdapterRequest,
    inputs: InvocationInputs,
    previous: SessionRef,
    reason: string
  ): Promise<PreparedHarnessSession> {
    return this.replacement(adapter, request, inputs, previous.generation + 1, {
      code: "SESSION_RESUME_FAILED",
      previousHarnessId: previous.harnessId,
      previousNativeId: previous.nativeId,
      reason
    }, previous.durable);
  }

  private async replacement(
    adapter: HarnessAdapter,
    request: HarnessAdapterRequest,
    inputs: InvocationInputs,
    generation: number,
    resumeFailure: PreparedHarnessSession["resumeFailure"],
    durable = true
  ): Promise<PreparedHarnessSession> {
    const taskSessionId = request.taskSessionId;
    if (request.sessionContinuity === "strict") {
      throw new HarnessRuntimeError(
        "SESSION_RESUME_FAILED",
        "The existing Agent session cannot be continued; it was preserved for explicit recovery",
        {
          harnessId: adapter.descriptor.id,
          agent: request.agent,
          reason: resumeFailure?.reason
        },
        { source: "runtime", retryable: false }
      );
    }
    // The selected Adapter is deliberately unchanged. There is no fallback.
    const agentSessionIds = { ...(request.project.agentSessionIds ?? {}) };
    const agentSessions = { ...(request.project.agentSessions ?? {}) };
    const agentSessionMeta = { ...(request.project.agentSessionMeta ?? {}) };
    delete agentSessionIds[request.agent];
    delete agentSessions[request.agent];
    delete agentSessionMeta[request.agent];
    const replacementRequest: HarnessAdapterRequest = Object.freeze({
      ...request,
      resumeThreadId: undefined,
      project: Object.freeze({
        ...request.project,
        agentSessionIds: Object.freeze(agentSessionIds),
        agentSessions: Object.freeze(agentSessions),
        agentSessionMeta: Object.freeze(agentSessionMeta),
        ...(taskSessionId
          ? {
              taskSessionRefs: Object.freeze(
                Object.fromEntries(
                  Object.entries(request.project.taskSessionRefs ?? {})
                    .filter(([key]) => key !== taskSessionId)
                )
              ),
              taskSessionIds: Object.freeze(
                Object.fromEntries(
                  Object.entries(request.project.taskSessionIds ?? {})
                    .filter(([key]) => key !== taskSessionId)
                )
              )
            }
          : {})
      })
    });
    const session = await this.createValidatedSession(
      adapter,
      replacementRequest,
      inputs,
      generation,
      durable
    );
    return {
      session,
      resumed: false,
      replaced: true,
      resumeFailure
    };
  }

  private validatePersisted(adapter: HarnessAdapter, session: SessionRef): string | undefined {
    if (session.harnessId !== adapter.descriptor.id) {
      return `Persisted session belongs to ${session.harnessId}; project remains locked to ${adapter.descriptor.id}`;
    }
    if (session.adapterVersion !== adapter.descriptor.adapterVersion) {
      return `Persisted session adapter version ${session.adapterVersion} is not ${adapter.descriptor.adapterVersion}`;
    }
    // prepare() only reaches this branch when the current invocation requires
    // persistence (Main always does; Worker follows sessionPersistence). An
    // old or damaged ephemeral ref must never be advertised as a successful
    // durable resume.
    if (!session.durable) {
      return "Persisted session is ephemeral but this invocation requires a durable session";
    }
    if (!this.validNative(adapter, session.nativeId)) {
      return "Adapter rejected the persisted native session ID";
    }
    return undefined;
  }

  private validNative(adapter: HarnessAdapter, nativeId: string): boolean {
    try {
      return Boolean(nativeId.trim()) &&
        (adapter.validateNativeSession?.(nativeId) ?? true);
    } catch {
      throw new HarnessRuntimeError(
        "HARNESS_CONTRACT_VIOLATION",
        `${adapter.descriptor.label} native Session validator failed`,
        { harnessId: adapter.descriptor.id },
        { source: "adapter" }
      );
    }
  }

  private async createValidatedSession(
    adapter: HarnessAdapter,
    request: HarnessAdapterRequest,
    inputs: InvocationInputs,
    generation: number,
    durable: boolean
  ): Promise<SessionRef> {
    const created = await adapter.createSession(
      request,
      Object.freeze({ ...inputs }),
      generation,
      durable
    );
    const validation = validateSessionRef(created);
    if (
      !validation.valid ||
      validation.session.harnessId !== adapter.descriptor.id ||
      validation.session.adapterVersion !== adapter.descriptor.adapterVersion ||
      validation.session.generation !== generation ||
      validation.session.durable !== durable
    ) {
      throw new HarnessRuntimeError(
        "HARNESS_CONTRACT_VIOLATION",
        `${adapter.descriptor.label} created an invalid SessionRef`,
        { harnessId: adapter.descriptor.id, sessionGeneration: generation },
        { source: "adapter" }
      );
    }
    return validation.session;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function recoverableGeneration(value: unknown): number | undefined {
  if (!isRecord(value)) return undefined;
  return Number.isSafeInteger(value.generation) && (value.generation as number) >= 0
    ? value.generation as number
    : undefined;
}

function sessionIdentityHints(value: unknown): {
  previousHarnessId?: string;
  previousNativeId?: string;
} {
  if (!isRecord(value)) return {};
  return {
    ...(safeDiagnosticIdentity(value.harnessId)
      ? { previousHarnessId: value.harnessId }
      : {}),
    ...(safeDiagnosticIdentity(value.nativeId)
      ? { previousNativeId: value.nativeId }
      : {})
  };
}

function safeDiagnosticIdentity(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 &&
    value.length <= 8_192 &&
    value === value.trim() &&
    !/[\u0000-\u001f\u007f-\u009f]/u.test(value);
}
