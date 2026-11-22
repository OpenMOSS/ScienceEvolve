import { describe, expect, it, vi } from "vitest";
import { createMainSdkClient } from "../src/main-client.js";
import type { MainApplicationRuntime } from "../src/main-runtime.js";

it.each(["conflict", "failed", "pending"])("returns a completed task and accepts new input with %s workspace delivery", async status => {
  const delivery = { status, destination: "/source", error: "Original workspace needs attention" };
  const project = { id: "project", status: "completed", agents: {}, userInputs: [] };
  const add = vi.fn(async () => ({ ...project, status: "queued" }));
  const runtime = { gatewayStore: { list: async () => [] }, orchestrator: { listProjects: async () => [project],
    getProject: async () => project, addProjectUserInput: add },
    storage: { projectDir: () => "/runtime/projects/project" }, projectWorkspaces: { path: () => undefined },
    gitWorkspaces: { receipt: () => delivery, synchronize: async () => delivery }, close: vi.fn() } as unknown as MainApplicationRuntime;
  const sdk = await createMainSdkClient(runtime);
  try {
    const run = await sdk.getRun(project.id);
    expect(await run.wait()).toMatchObject({ status: "completed", workspaceDelivery: delivery });
    expect(await run.addInput("Continue the explicit new task")).toMatchObject({ status: "queued", workspaceDelivery: delivery });
    expect(add).toHaveBeenCalledWith(project.id, "Continue the explicit new task", undefined, undefined);
  } finally { await sdk.close(); }
});
