import { describe, expect, it, vi } from "vitest";
import { ResidentScopedAgentTurnInvoker } from "../../src/core/scoped-agent-resident.js";
import { ScopedAgentTurnFailure, type ScopedAgentTurnInput } from "../../src/core/scoped-agent-execution.js";
import type { CollaborationResidentOpenInput } from "../../src/core/collaboration-runtime.js";
import { HarnessRuntimeError } from "../../src/core/harness-runtime/errors.js";

function input(): ScopedAgentTurnInput {
  return { execution: { id: "exec-retained", projectId: "prj_retained", agentId: "worker", ownershipEpoch: 1,
    worktreePath: "/tmp/retained-worker" }, groupRun: { id: "group-retained" },
    arrival: { targetNodeId: "node-worker" }, workflow: { routes: {} }, invocationId: "inv-retained-repair",
    runtimePath: "/tmp/retained-runtime", onOpened: vi.fn() } as unknown as ScopedAgentTurnInput;
}

function openInput(turn: ScopedAgentTurnInput): CollaborationResidentOpenInput {
  return { initialTask: "来源：Leader\n内容：Complete the original retained task.", request: { project: { id: turn.execution.projectId, orchestration: { schemaVersion: 3 },
    agents: { worker: { decisionBy: "agent" } }, agentSessionIds: { worker: "native-retained" } },
    agent: "worker", invocationId: turn.invocationId, workspacePath: turn.execution.worktreePath,
    runtimePath: turn.runtimePath, sessionContinuity: "strict", resumeThreadId: "native-retained",
    onDurableSessionStarted: vi.fn(), executionContext: { role: "delivery", executionId: turn.execution.id,
      ownershipEpoch: 1, groupRunId: turn.groupRun.id, executionWorktree: turn.execution.worktreePath, nodeRunId: "nr-retained" } },
    executionRuntimePath: turn.runtimePath, controlScope: { role: "scoped-agent", projectId: turn.execution.projectId,
      executionId: turn.execution.id, ownershipEpoch: 1, groupRunId: turn.groupRun.id,
      agentId: "worker", nodeRunId: "nr-retained", decisionBy: "agent", candidates: [] },
    controlAuthorityFactory: vi.fn() } as unknown as CollaborationResidentOpenInput;
}

describe("scoped native failure diagnostics", () => {
  it.each(["prepare", "launch"] as const)("retains bounded redacted native causes at %s without fabricating stop proof", async (phase) => {
    const turn = input();
    const cause = new Error("Permission denied while reading retained history; Authorization: Bearer scoped-native-secret");
    const error = new HarnessRuntimeError("HARNESS_PROCESS_EXITED", "Native startup failed", {}, { source: "process", cause });
    const open = vi.fn(async () => { throw error; });
    const acceptResult = vi.fn();
    const prepare = vi.fn(async () => { if (phase === "prepare") throw error; return openInput(turn); });
    const invoker = new ResidentScopedAgentTurnInvoker({ open }, { prepare, acceptResult });
    const failure = await invoker.invoke(turn).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(ScopedAgentTurnFailure);
    const native = failure as ScopedAgentTurnFailure;
    expect(native.message).toContain("Native startup failed");
    expect(native.message).toContain("Permission denied while reading retained history");
    expect(native.message).not.toContain("scoped-native-secret");
    expect(native.details).toMatchObject({ phase, executionId: "exec-retained", agentId: "worker", ownershipEpoch: 1,
      invocationId: "inv-retained-repair", causeChain: [{ causeClass: "HarnessRuntimeError",
        errorCode: "HARNESS_PROCESS_EXITED", redactedMessage: "Native startup failed" },
      { causeClass: "Error", redactedMessage: expect.stringContaining("Permission denied") }] });
    expect(JSON.stringify(native.details)).not.toContain("scoped-native-secret");
    expect(native.residentStopConfirmed).toBe(phase === "prepare");
    if (phase === "launch") expect(native.details.stopProof).toBe("required");
    expect(turn.onOpened).not.toHaveBeenCalled();
    expect(acceptResult).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalledTimes(phase === "prepare" ? 0 : 1);
  });

  it("bounds a cyclic or oversized cause chain without retrying or releasing the original task", async () => {
    const turn = input();
    const error = new Error("Missing original session " + "x".repeat(20_000));
    error.cause = error;
    const open = vi.fn(async () => { throw error; });
    const invoker = new ResidentScopedAgentTurnInvoker({ open }, { prepare: async () => openInput(turn), acceptResult: vi.fn() });
    const failure = await invoker.invoke(turn).catch((error: unknown) => error) as ScopedAgentTurnFailure;
    expect(failure.message).toContain("Missing original session");
    expect(failure.message.length).toBeLessThan(1_200);
    expect(failure.details.causeChain).toHaveLength(1);
    expect(JSON.stringify(failure.details).length).toBeLessThan(2_000);
    expect(failure.residentStopConfirmed).toBe(false);
    expect(open).toHaveBeenCalledOnce();
    expect(turn.onOpened).not.toHaveBeenCalled();
  });
});
