import { describe, expect, it } from "vitest";
import type { AgentRunRequest } from "../../src/core/types.js";
import type { HarnessAdapter, HarnessDescriptor, InvocationInputs } from "../../src/core/harness-runtime/contracts.js";
import {
  HarnessRuntimeError,
  isSessionResumeFailure,
  SessionResumeError
} from "../../src/core/harness-runtime/errors.js";
import { SessionCoordinator } from "../../src/core/harness-runtime/session-coordinator.js";
import { validateSessionRef } from "../../src/core/harness-runtime/session-ref.js";

const descriptor: HarnessDescriptor = {
  schemaVersion: 1,
  id: "fixture", label: "Fixture", adapterVersion: "1", nativeProtocol: "responses",
  purposes: ["workflow"], executableEnv: "FIXTURE", defaultCommand: "fixture",
  notes: "fixture", default: true,
  capabilities: {
    structuredEvents: true, toolResults: true, durableSession: true,
    permissionPrompts: ["workspace", "compute", "yolo"], workspaceInputs: true,
    autoSkills: true,
    officialEvents: true, toolEvents: true, usageEvents: true,
    readOnlyExplainer: false, webSearch: false, skills: false, mcp: false
  }
};

const adapter: HarnessAdapter = {
  descriptor,
  resolveExecutable: async () => "/fixture",
  fingerprint: async () => "fixture",
  run: async () => ({ handoff: "done" }),
  createSession: (_request, _inputs, generation, durable) => ({
    schemaVersion: 1, harnessId: "fixture", adapterVersion: "1", generation,
    nativeId: `native-${generation}`, durable, createdAt: "2000-01-01T00:00:00.000Z"
  }),
  sessionFromLegacyId: (value, generation, durable) => value.startsWith("fixture:") ? ({
    schemaVersion: 1, harnessId: "fixture", adapterVersion: "1", generation,
    nativeId: value.slice("fixture:".length), durable, createdAt: "2000-01-01T00:00:00.000Z"
  }) : undefined,
  sessionToLegacyId: (session) => `fixture:${session.nativeId}`,
  validateNativeSession: (nativeId) => nativeId.startsWith("native-")
};

const inputs: InvocationInputs = {
  projectPath: "/fixture/project", workspacePath: "/fixture/workspace",
  inboxPath: "/fixture/inbox", memoryPath: "/fixture/Memory.md",
  runtimePath: "/fixture/runtime", inboxSha256: "fixture"
};

const validSession = {
  schemaVersion: 1,
  harnessId: "fixture",
  adapterVersion: "1",
  generation: 3,
  nativeId: "native-existing",
  durable: true,
  createdAt: "2000-01-01T00:00:00.000Z"
} as const;

function request(overrides: Record<string, unknown> = {}): AgentRunRequest {
  return {
    kind: "main", agent: "main", resumeThreadId: undefined,
    project: {
      agents: { main: { harness: "fixture", sessionPersistence: false } },
      agentSessionMeta: { main: { generation: 0, contextSeq: 0, resumeFailureCount: 0 } },
      ...overrides
    }
  } as AgentRunRequest;
}

function workerRequest(
  sessionPersistence: boolean,
  overrides: Record<string, unknown> = {}
): AgentRunRequest {
  return {
    kind: "worker", agent: "worker", resumeThreadId: undefined,
    project: {
      agents: { worker: { harness: "fixture", sessionPersistence } },
      agentSessionMeta: { worker: { generation: 0, contextSeq: 0, resumeFailureCount: 0 } },
      ...overrides
    }
  } as AgentRunRequest;
}

describe("SessionCoordinator", () => {
  it("continues a durable Session without allocating or changing its identity", () => {
    const guarded = { ...adapter, createSession: () => { throw new Error("must not allocate"); } };
    expect(new SessionCoordinator().resume(guarded, validSession)).toEqual({
      session: { ...validSession, resumedAt: expect.any(String) },
      resumed: true,
      replaced: false
    });
    expect(validSession).not.toHaveProperty("resumedAt");
  });

  it.each([
    { harnessId: "other" }, { adapterVersion: "other" },
    { nativeId: "rejected" }, { durable: false }
  ])("preserves an incompatible original Session without allocating a fallback: %j", override => {
    const guarded = { ...adapter, createSession: () => { throw new Error("must not allocate"); } };
    expect(() => new SessionCoordinator().resume(guarded, { ...validSession, ...override })).toThrow(
      expect.objectContaining({ code: "SESSION_RESUME_FAILED", retryable: false })
    );
  });

  it("makes Main durable and migrates a valid legacy ID", async () => {
    const prepared = await new SessionCoordinator().prepare(adapter, {
      ...request(), resumeThreadId: "fixture:native-old"
    }, inputs);
    expect(prepared.resumed).toBe(true);
    expect(prepared.session.durable).toBe(true);
    expect(prepared.session.nativeId).toBe("native-old");
  });

  it.each([
    ["Harness ownership", { harnessId: "other" }],
    ["Adapter version", { adapterVersion: "other" }],
    ["generation", { generation: 9 }],
    ["durability", { durable: false }]
  ] as const)("replaces a legacy migration with invalid %s", async (_label, override) => {
    const malicious: HarnessAdapter = {
      ...adapter,
      sessionFromLegacyId: (_value, generation) => ({
        schemaVersion: 1,
        harnessId: "fixture",
        adapterVersion: "1",
        generation,
        nativeId: "native-old",
        durable: true,
        createdAt: "2000-01-01T00:00:00.000Z",
        ...override
      })
    };

    const prepared = await new SessionCoordinator().prepare(malicious, {
      ...request(),
      resumeThreadId: "legacy-value"
    }, inputs);

    expect(prepared).toMatchObject({
      resumed: false,
      replaced: true,
      session: { harnessId: "fixture", generation: 1, durable: true },
      resumeFailure: { code: "SESSION_RESUME_FAILED" }
    });
  });

  it("replaces a failed resume within the locked Harness and increments generation", async () => {
    const prepared = await new SessionCoordinator().prepare(adapter, request({
      agentSessions: {
        main: {
          schemaVersion: 1, harnessId: "removed", adapterVersion: "1",
          generation: 3, nativeId: "wrong", durable: true,
          createdAt: "2000-01-01T00:00:00.000Z"
        }
      }
    }), inputs);
    expect(prepared.replaced).toBe(true);
    expect(prepared.session.harnessId).toBe("fixture");
    expect(prepared.session.generation).toBe(4);
    expect(prepared.resumeFailure?.code).toBe("SESSION_RESUME_FAILED");
  });

  it("never resumes an ephemeral ref when Main requires a durable session", async () => {
    const prepared = await new SessionCoordinator().prepare(adapter, request({
      agentSessions: {
        main: {
          schemaVersion: 1, harnessId: "fixture", adapterVersion: "1",
          generation: 2, nativeId: "native-ephemeral", durable: false,
          createdAt: "2000-01-01T00:00:00.000Z"
        }
      }
    }), inputs);

    expect(prepared).toMatchObject({
      resumed: false,
      replaced: true,
      session: { harnessId: "fixture", generation: 3, durable: true },
      resumeFailure: {
        code: "SESSION_RESUME_FAILED",
        reason: expect.stringContaining("requires a durable session")
      }
    });
  });

  it("makes a non-persistent Worker ephemeral even when an old durable ref exists", async () => {
    const prepared = await new SessionCoordinator().prepare(adapter, workerRequest(false, {
      agentSessions: {
        worker: {
          schemaVersion: 1, harnessId: "fixture", adapterVersion: "1",
          generation: 4, nativeId: "native-old", durable: true,
          createdAt: "2000-01-01T00:00:00.000Z"
        }
      }
    }), inputs);

    expect(prepared).toMatchObject({
      resumed: false,
      replaced: false,
      session: { harnessId: "fixture", generation: 4, durable: false }
    });
  });

  it("resumes a persistent Worker's durable session", async () => {
    const prepared = await new SessionCoordinator().prepare(adapter, workerRequest(true, {
      agentSessions: {
        worker: {
          schemaVersion: 1, harnessId: "fixture", adapterVersion: "1",
          generation: 4, nativeId: "native-old", durable: true,
          createdAt: "2000-01-01T00:00:00.000Z"
        }
      }
    }), inputs);

    expect(prepared).toMatchObject({
      resumed: true,
      replaced: false,
      session: { harnessId: "fixture", generation: 4, durable: true }
    });
    expect(prepared.session.resumedAt).toEqual(expect.any(String));
  });

  it("prefers the task-owned session over the Agent compatibility index", async () => {
    const prepared = await new SessionCoordinator().prepare(adapter, {
      ...workerRequest(false, {
        agentSessionIds: { worker: "fixture:native-agent-index" },
        agentSessions: {
          worker: { ...validSession, nativeId: "native-agent-index", generation: 2 }
        },
        taskSessionIds: { "task-1": "fixture:native-task" },
        taskSessionRefs: {
          "task-1": { ...validSession, nativeId: "native-task", generation: 7 }
        }
      }),
      taskSessionId: "task-1",
      sessionContinuity: "strict"
    }, inputs);

    expect(prepared).toMatchObject({
      resumed: true,
      replaced: false,
      session: { nativeId: "native-task", generation: 7, durable: true }
    });
  });

  it("keeps a non-persistent Worker durable within a task but starts a fresh session for the next task", async () => {
    const coordinator = new SessionCoordinator();
    let allocations = 0;
    const countingAdapter: HarnessAdapter = {
      ...adapter,
      createSession: async (...args) => {
        allocations += 1;
        return adapter.createSession(...args);
      }
    };
    const first = await coordinator.prepare(countingAdapter, {
      ...workerRequest(false), taskSessionId: "task-1", sessionContinuity: "strict"
    }, inputs);
    const second = await coordinator.prepare(countingAdapter, {
      ...workerRequest(false), taskSessionId: "task-2", sessionContinuity: "strict"
    }, inputs);

    expect(first.session).toMatchObject({ durable: true, generation: 0 });
    expect(second.session).toMatchObject({ durable: true, generation: 0 });
    expect(allocations).toBe(2);
  });

  it("does not fall back to the Agent session when a task session cannot be resumed", async () => {
    let allocations = 0;
    const guardedAdapter: HarnessAdapter = {
      ...adapter,
      createSession: async (...args) => {
        allocations += 1;
        return adapter.createSession(...args);
      }
    };
    await expect(new SessionCoordinator().prepare(guardedAdapter, {
      ...workerRequest(false, {
        agentSessions: { worker: { ...validSession, nativeId: "native-agent" } },
        taskSessionRefs: { "task-1": { ...validSession, nativeId: "invalid-task" } }
      }),
      taskSessionId: "task-1",
      sessionContinuity: "strict"
    }, inputs)).rejects.toMatchObject({ code: "SESSION_RESUME_FAILED" });
    expect(allocations).toBe(0);
  });

  it("preserves an ephemeral Worker's durability when replacing its native Session", async () => {
    const coordinator = new SessionCoordinator();
    const current = await coordinator.prepare(adapter, workerRequest(false), inputs);
    const replacement = await coordinator.replace(
      adapter,
      workerRequest(false),
      inputs,
      current.session,
      "malformed gateway tool arguments"
    );

    expect(current.session).toMatchObject({ generation: 0, durable: false });
    expect(replacement).toMatchObject({
      resumed: false,
      replaced: true,
      session: { harnessId: "fixture", generation: 1, durable: false }
    });
  });

  it("makes a scoped Worker durable even when its legacy setting was ephemeral", async () => {
    const prepared = await new SessionCoordinator().prepare(adapter, {
      ...workerRequest(false), sessionContinuity: "strict"
    }, inputs);
    expect(prepared.session).toMatchObject({ durable: true, generation: 0 });
  });

  it("preserves an invalid scoped Agent session instead of allocating a replacement", async () => {
    let allocations = 0;
    const guardedAdapter: HarnessAdapter = {
      ...adapter,
      createSession: async (...args) => {
        allocations += 1;
        return adapter.createSession(...args);
      }
    };
    const scopedRequest = {
      ...workerRequest(false, { agentSessions: { worker: { ...validSession, harnessId: "other" } } }),
      sessionContinuity: "strict" as const
    };
    await expect(new SessionCoordinator().prepare(guardedAdapter, scopedRequest, inputs))
      .rejects.toMatchObject({ code: "SESSION_RESUME_FAILED", retryable: false });
    expect(allocations).toBe(0);
    expect(scopedRequest.project.agentSessions).toEqual({ worker: { ...validSession, harnessId: "other" } });
  });

  it("rejects replacement after a native scoped resume failure", async () => {
    const scopedRequest = { ...workerRequest(true), sessionContinuity: "strict" as const };
    await expect(new SessionCoordinator().replace(
      adapter, scopedRequest, inputs, validSession, "native cwd changed"
    )).rejects.toMatchObject({ code: "SESSION_RESUME_FAILED", retryable: false });
  });

  it.each([
    ["null", null, 1],
    ["wrong schema version", { ...validSession, schemaVersion: 2 }, 4],
    ["non-string native identity", { ...validSession, nativeId: { trim: true } }, 4],
    ["negative generation", { ...validSession, generation: -1 }, 1],
    ["invalid created timestamp", { ...validSession, createdAt: "not-a-date" }, 4]
  ] as const)("replaces a damaged persisted SessionRef (%s) without throwing", async (
    _label,
    persisted,
    expectedGeneration
  ) => {
    const prepared = await new SessionCoordinator().prepare(adapter, request({
      agentSessions: { main: persisted }
    }), inputs);

    expect(prepared).toMatchObject({
      resumed: false,
      replaced: true,
      session: {
        harnessId: "fixture",
        generation: expectedGeneration,
        durable: true
      },
      resumeFailure: {
        code: "SESSION_RESUME_FAILED",
        reason: expect.stringContaining("Persisted SessionRef is invalid")
      }
    });
  });

  it("classifies only typed native resume evidence", () => {
    expect(isSessionResumeFailure(
      new SessionResumeError("fixture", "stale-session")
    )).toBe(true);
    expect(isSessionResumeFailure(
      new HarnessRuntimeError("SESSION_RESUME_FAILED", "typed resume failure")
    )).toBe(true);
    expect(isSessionResumeFailure(
      new Error("No conversation found with session ID: stale-session")
    )).toBe(false);
    expect(isSessionResumeFailure(
      new Error("The upstream request timed out")
    )).toBe(false);
  });
});

describe("SessionRef schema guard", () => {
  it("accepts a safe historical Harness ID without consulting the Registry", () => {
    const result = validateSessionRef({
      ...validSession,
      harnessId: "retired-harness.v2",
      resumedAt: "2000-01-01T00:00:01Z"
    });

    expect(result.valid).toBe(true);
  });

  it.each([
    ["schemaVersion", { ...validSession, schemaVersion: "1" }],
    ["harnessId", { ...validSession, harnessId: "" }],
    ["adapterVersion", { ...validSession, adapterVersion: "bad\nversion" }],
    ["generation", { ...validSession, generation: 1.5 }],
    ["generation range", { ...validSession, generation: Number.MAX_SAFE_INTEGER + 1 }],
    ["nativeId", { ...validSession, nativeId: "native\ridentity" }],
    ["durable", { ...validSession, durable: "true" }],
    ["createdAt", { ...validSession, createdAt: "2024-02-30T00:00:00.000Z" }],
    ["resumedAt", { ...validSession, resumedAt: "yesterday" }],
    ["unknown field", { ...validSession, token: "must-not-persist" }]
  ] as const)("rejects an invalid %s field", (_field, value) => {
    expect(validateSessionRef(value).valid).toBe(false);
  });
});
