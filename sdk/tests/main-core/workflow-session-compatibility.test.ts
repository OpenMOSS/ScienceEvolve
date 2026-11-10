import { describe, expect, it } from "vitest";
import type { SessionRef } from "../../src/core/harness-runtime/contracts.js";
import { collaborationSessionKey } from "../../src/core/internal/shared/collaboration-session-key.js";
import type { AgentRunRequest, ProjectState } from "../../src/core/types.js";
import { defaultAgentConfigFor } from "../../src/core/validation.js";
import { assertWorkflowSessionHarnesses, boundWorkflowHarnesses } from "../../src/core/workflow-session-compatibility.js";

function fixture(): Pick<ProjectState, "agents" | "agentSessions" | "agentSessionIds"> {
  return { agents: { main: { ...defaultAgentConfigFor("main"), harness: "codex" } }, agentSessions: {}, agentSessionIds: {} };
}
function session(harnessId = "codex"): SessionRef {
  return { schemaVersion: 1, harnessId, adapterVersion: "test", nativeId: "private-original-session", generation: 0, durable: true, createdAt: "2026-10-11T00:00:00.000Z" };
}
const contexts: Array<[string, AgentRunRequest["executionContext"]]> = [
  ["unscoped", undefined],
  ["legacy leader", { role: "leader", nodeRunId: "node", groupRunId: "group", coordinatorEpoch: 1 }],
  ["independent route leader", { role: "leader", nodeRunId: "node", routeScopeId: "route", coordinatorEpoch: 1 }],
  ["delivery", { role: "delivery", nodeRunId: "node", executionId: "execution", ownershipEpoch: 1, executionWorktree: "/tmp/original-worktree" }],
  ["final integration", { role: "final-integration", nodeRunId: "node", executionId: "final", ownershipEpoch: 1, executionWorktree: "/tmp/original-worktree" }]
];

describe("retained workflow Session compatibility", () => {
  it("allows an unbound Agent to change Harness", () => {
    const state = fixture(), proposal = structuredClone(state.agents); proposal.main.harness = "dsh";
    expect(() => assertWorkflowSessionHarnesses(state, proposal)).not.toThrow();
    expect(boundWorkflowHarnesses(state, "main")).toEqual([]);
  });

  it("uses the actual Session Harness when the old configuration projection lags", () => {
    const state = fixture(); state.agents.main.harness = "dsh"; state.agentSessions!.main = session();
    expect(boundWorkflowHarnesses(state, "main")).toEqual(["codex"]);
    expect(() => assertWorkflowSessionHarnesses(state, state.agents)).toThrow(/codex/);
    const proposal = structuredClone(state.agents); proposal.main.harness = "codex";
    expect(() => assertWorkflowSessionHarnesses(state, proposal)).not.toThrow();
  });

  it.each(contexts)("protects the original %s role binding without rewriting its key", (_name, context) => {
    const state = fixture(), key = collaborationSessionKey("main", context), original = session();
    state.agentSessions![key] = original;
    const before = structuredClone(state), proposal = structuredClone(state.agents); proposal.main.harness = "dsh";
    expect(() => assertWorkflowSessionHarnesses(state, proposal)).toThrow(/现有 session/);
    expect(state).toEqual(before); expect(state.agentSessions![key]).toBe(original);
  });

  it("retains the configured original Harness for legacy IDs without a SessionRef", () => {
    const state = fixture(), key = collaborationSessionKey("main", contexts[1][1]);
    state.agentSessionIds![key] = "private-legacy-session";
    const proposal = structuredClone(state.agents); proposal.main.harness = "dsh";
    expect(boundWorkflowHarnesses(state, "main")).toEqual(["codex"]);
    expect(() => assertWorkflowSessionHarnesses(state, proposal)).toThrow(/codex/);
    expect(state.agentSessionIds![key]).toBe("private-legacy-session");
  });

  it("does not lock neighboring Agent names or a new independent Agent", () => {
    const state = fixture(); state.agents.main2 = { ...defaultAgentConfigFor("main2"), harness: "codex" };
    state.agentSessions![collaborationSessionKey("main2", contexts[1][1])] = session();
    const proposal = structuredClone(state.agents); proposal.main.harness = "dsh";
    proposal.new_main = { ...defaultAgentConfigFor("new_main"), harness: "dsh" };
    expect(boundWorkflowHarnesses(state, "main")).toEqual([]);
    expect(() => assertWorkflowSessionHarnesses(state, proposal)).not.toThrow();
  });

  it("keeps all original bindings when an Agent has incompatible role Harnesses", () => {
    const state = fixture(); state.agentSessions!.main = session();
    state.agentSessions![collaborationSessionKey("main", contexts[1][1])] = session("dsh");
    const before = structuredClone(state);
    expect(boundWorkflowHarnesses(state, "main")).toEqual(["codex", "dsh"]);
    expect(() => assertWorkflowSessionHarnesses(state, state.agents)).toThrow(/codex、dsh/);
    try { assertWorkflowSessionHarnesses(state, state.agents); } catch (error) { expect(String(error)).not.toContain("private-original-session"); }
    expect(state).toEqual(before);
  });

  it("allows explicit removal while preventing retained identity reuse with another Harness", () => {
    const state = fixture(); state.agentSessions!.main = session();
    expect(() => assertWorkflowSessionHarnesses(state, {})).not.toThrow();
    delete state.agents.main;
    const replacement = { main: { ...defaultAgentConfigFor("main"), harness: "dsh" } };
    expect(() => assertWorkflowSessionHarnesses(state, replacement)).toThrow(/现有 session/);
    expect(state.agentSessions!.main!.nativeId).toBe("private-original-session");
  });

  it("allows compatible model and instruction edits without altering original Session maps", () => {
    const state = fixture(); state.agentSessions!.main = session(); state.agentSessionIds!.main = "private-original-session";
    const before = structuredClone(state), proposal = structuredClone(state.agents);
    proposal.main.instructions = "Keep the original memory and continue the changed task."; proposal.main.model = "another-supported-model";
    delete proposal.main.harness;
    expect(() => assertWorkflowSessionHarnesses(state, proposal)).not.toThrow();
    expect(state).toEqual(before);
  });
});
