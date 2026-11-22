import { describe, expect, it } from "vitest";
import {
  ScopedWorkflowContractError,
  validateScopedWorkflowContract,
  type ScopedWorkflowContract
} from "../../src/core/scoped-workflow-contract.js";

const agents = new Set(["main", "agent1", "agent2", "agent3", "agent4", "agent5"]);

function example(): ScopedWorkflowContract {
  return {
    schemaVersion: 1,
    rootAgentIds: ["main", "agent1"],
    groups: [{
      id: "G",
      leaderAgentId: "main",
      allowLeaderReconfiguration: false,
      workflow: {
        nodes: ["agent1", "agent2", "agent3", "agent4", "agent5"].map((agentId) => ({
          kind: "agent", nodeId: `G_${agentId}`, agentId
        })),
        input: { source: "input", edges: ["agent1", "agent4", "agent5"].map((agentId) => ({
          kind: "parallel", target: `G_${agentId}`
        })) },
        routes: {
          G_agent1: [{ kind: "strong", target: "G_agent2" }],
          G_agent2: [{ kind: "strong", target: "G_agent3" }],
          G_agent3: [{ kind: "strong", target: "finish" }],
          G_agent4: [{ kind: "strong", target: "finish" }],
          G_agent5: [{ kind: "strong", target: "finish" }]
        }
      }
    }]
  };
}

describe("scoped workflow contract", () => {
  it("accepts groups without a local editing switch and preserves stored metadata without inventing defaults", () => {
    const current = example(); delete current.groups[0].allowLeaderReconfiguration;
    expect(validateScopedWorkflowContract(current, agents).groups[0]).not.toHaveProperty("allowLeaderReconfiguration");
    for (const value of [false, true]) {
      const saved = example(); saved.groups[0].allowLeaderReconfiguration = value;
      expect(validateScopedWorkflowContract(saved, agents)).toEqual(saved);
    }
  });
  it("represents the five-Agent, three-path example without fixed sub-workflow containers", () => {
    const graph = validateScopedWorkflowContract(example(), agents);
    expect(graph.groups[0]?.workflow.input.edges.map((edge) => edge.target)).toEqual([
      "G_agent1", "G_agent4", "G_agent5"
    ]);
    expect(graph.groups[0]?.workflow.routes.G_agent1).toEqual([{ kind: "strong", target: "G_agent2" }]);
  });

  it("allows one Agent identity in the outer graph and multiple group scopes via distinct node references", () => {
    const graph = example();
    graph.groups.push({
      id: "H",
      leaderAgentId: "main",
      allowLeaderReconfiguration: false,
      workflow: {
        nodes: [{ kind: "agent", nodeId: "H_agent1", agentId: "agent1" }],
        input: { source: "input", edges: [{ kind: "parallel", target: "H_agent1" }] },
        routes: { H_agent1: [{ kind: "strong", target: "finish" }] }
      }
    });
    expect(validateScopedWorkflowContract(graph, agents).groups).toHaveLength(2);
  });

  it("accepts more than fifty business Agents and routes while retaining repeated references", () => {
    const graph = example();
    const available = new Set(agents);
    for (let index = 6; index <= 60; index += 1) {
      const agentId = `agent${index}`;
      const nodeId = `G_${agentId}`;
      available.add(agentId);
      graph.groups[0]!.workflow.nodes.push({ kind: "agent", nodeId, agentId });
      graph.groups[0]!.workflow.input.edges.push({ kind: "parallel", target: nodeId });
      graph.groups[0]!.workflow.routes[nodeId] = [{ kind: "strong", target: "finish" }];
    }
    graph.groups[0]!.workflow.nodes.push({ kind: "agent", nodeId: "G_agent1_again", agentId: "agent1" });
    graph.groups[0]!.workflow.input.edges.push({ kind: "parallel", target: "G_agent1_again" });
    graph.groups[0]!.workflow.routes.G_agent1_again = [{ kind: "strong", target: "finish" }];
    expect(validateScopedWorkflowContract(graph, available).groups).toHaveLength(1);

    graph.rootAgentIds = [...available];
    graph.groups[0]!.workflow.routes.G_agent1 = graph.groups[0]!.workflow.nodes
      .filter(node => node.nodeId !== "G_agent1").map(node => ({ target: node.nodeId, kind: "weak" }));
    expect(validateScopedWorkflowContract(graph, available).rootAgentIds).toHaveLength(61);
    expect(validateScopedWorkflowContract(graph, available, { strict: false }).groups[0]!.workflow.nodes).toHaveLength(61);
  });

  it("permits nested groups only through one direct parent reference", () => {
    const graph = example();
    graph.groups[0]!.workflow.nodes.push({ kind: "collaboration", nodeId: "G_H", groupId: "H" });
    graph.groups[0]!.workflow.input.edges.push({ kind: "parallel", target: "G_H" });
    graph.groups[0]!.workflow.routes.G_H = [{ kind: "strong", target: "finish" }];
    graph.groups.push({
      id: "H",
      parentGroupId: "G",
      leaderAgentId: "agent3",
      allowLeaderReconfiguration: true,
      workflow: {
        nodes: [{ kind: "agent", nodeId: "H_agent1", agentId: "agent1" }],
        input: { source: "input", edges: [{ kind: "parallel", target: "H_agent1" }] },
        routes: { H_agent1: [{ kind: "strong", target: "finish" }] }
      }
    });
    expect(validateScopedWorkflowContract(graph, agents).groups).toHaveLength(2);
    graph.groups[0]!.workflow.nodes.pop();
    expect(() => validateScopedWorkflowContract(graph, agents)).toThrow(/恰好有一个节点引用/);
  });

  it("rejects later parallel fan-out, cross-scope edges, and duplicate node IDs", () => {
    const graph = example();
    graph.groups[0]!.workflow.routes.G_agent1 = [{ kind: "parallel", target: "G_agent2" }] as never;
    expect(() => validateScopedWorkflowContract(graph, agents)).toThrow();
    graph.groups[0]!.workflow.routes.G_agent1 = [{ kind: "strong", target: "outside" }];
    expect(() => validateScopedWorkflowContract(graph, agents)).toThrow(/不属于本组/);
    graph.groups[0]!.workflow.routes.G_agent1 = [{ kind: "strong", target: "G_agent2" }];
    graph.groups[0]!.workflow.nodes[1]!.nodeId = "G_agent1";
    expect(() => validateScopedWorkflowContract(graph, agents)).toThrow(ScopedWorkflowContractError);
  });

  it("rejects a Leader as a business node anywhere in its own group tree", () => {
    const graph = example();
    graph.groups[0]!.leaderAgentId = "agent1";
    expect(() => validateScopedWorkflowContract(graph, agents)).toThrow(/Leader 不能兼任本组业务节点/);
  });

  it("keeps incomplete drafts editable but requires an Input and Finish in strict mode", () => {
    const graph = example();
    graph.groups[0]!.workflow.input.edges = [];
    graph.groups[0]!.workflow.routes.G_agent5 = [];
    expect(() => validateScopedWorkflowContract(graph, agents)).toThrow(/Input 至少需要/);
    expect(validateScopedWorkflowContract(graph, agents, { strict: false }).groups).toHaveLength(1);
  });

  it("rejects a disconnected direct member in strict mode without blocking draft edits", () => {
    const graph = example();
    graph.groups[0]!.workflow.input.edges = graph.groups[0]!.workflow.input.edges.filter(
      (edge) => edge.target !== "G_agent4"
    );
    expect(() => validateScopedWorkflowContract(graph, agents)).toThrow(/G_agent4 无法从 Input 到达/);
    expect(validateScopedWorkflowContract(graph, agents, { strict: false }).groups).toHaveLength(1);
  });

  it("rejects a reachable path that cannot reach Finish", () => {
    const graph = example();
    graph.groups[0]!.workflow.routes.G_agent4 = [{ kind: "strong", target: "G_agent5" }];
    graph.groups[0]!.workflow.routes.G_agent5 = [{ kind: "strong", target: "G_agent4" }];
    expect(() => validateScopedWorkflowContract(graph, agents)).toThrow(/G_agent4 没有通向 Finish 的路径/);
  });

  it("reuses the existing explicit Loop topology checks inside a group scope", () => {
    const graph = example();
    graph.groups[0]!.workflow.loops = [{ id: "cycle", from: "G_agent1", to: "G_agent2", maxIterations: 2, exitTo: "G_agent5" }];
    expect(() => validateScopedWorkflowContract(graph, agents)).toThrow(/Loop to must have a route back/);
  });

  it("counts implicit Loop exits in Input/Finish reachability", () => {
    const graph = example();
    const workflow = graph.groups[0]!.workflow;
    workflow.input.edges = [{ kind: "parallel", target: "G_agent1" }];
    workflow.routes.G_agent3 = [{ kind: "strong", target: "G_agent1" }];
    workflow.routes.G_agent4 = [{ kind: "strong", target: "G_agent5" }];
    workflow.loops = [{ id: "cycle", from: "G_agent3", to: "G_agent1", maxIterations: 2, exitTo: "G_agent4" }];
    expect(validateScopedWorkflowContract(graph, agents)).toEqual(graph);
  });

  it("rejects parent cycles and child nodes routed from another scope", () => {
    const graph = example();
    graph.groups[0]!.parentGroupId = "G";
    expect(() => validateScopedWorkflowContract(graph, agents)).toThrow(/不能包含自身|包含环/);
    graph.groups[0]!.parentGroupId = undefined;
    graph.groups[0]!.workflow.input.edges.push({ kind: "parallel", target: "H_agent1" });
    expect(() => validateScopedWorkflowContract(graph, agents)).toThrow(/不属于本组/);
  });
});
