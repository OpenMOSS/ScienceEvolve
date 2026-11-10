import path from "node:path";
import { CollaborationRuntimeCoordinator } from "../../../src/core/collaboration-runtime.js";
import { EventHub } from "../../../src/core/event-hub.js";
import { ProjectStorage } from "../../../src/core/storage.js";
import { mainAgentOrchestrationDocument } from "../../../src/core/agent-orchestration-reconfiguration.js";

const [root, projectId, clockText] = process.argv.slice(2);
const clock = Number(clockText);
if (!root || !projectId || !Number.isSafeInteger(clock)) throw new Error("Invalid writer fixture arguments");
const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
let nativeCalls = 0;
const coordinator = new CollaborationRuntimeCoordinator({ storage, databasePath: path.join(root, "writer.sqlite"),
  serviceId: "git-writer-fixture", hostId: "test", now: () => clock, leaseDurationMs: 300_000,
  validateWorkflowConfiguration: async () => undefined,
  residentLauncher: { async open() { nativeCalls++; throw new Error("File publication cannot open a model"); },
    async decideRoute() { nativeCalls++; throw new Error("File publication cannot create a Main turn"); } } });
await coordinator.initialize();
try {
  const state = await storage.loadState(projectId), database = coordinator.database();
  state.title = "Current writer publication";
  await database.appendEvent({ projectId, type: "projection.test.observation", payload: { message: "Successor writer owns this publication" } });
  await coordinator.saveWorkflowRevision(state, { orchestration: state.orchestration, affectedGroupIds: [] });
  const current = (await coordinator.getWorkflowAdjustments(state)).current;
  await storage.writeMainAgentOrchestrationCurrentSnapshot(projectId, mainAgentOrchestrationDocument(projectId,
    current.snapshot.orchestration, current.snapshot.agents, current.snapshot.skillDefinitions, current.snapshot.mcpDefinitions, current.version),
    async () => { await database.assertWriterLeaseHeld(); return true; });
  process.stdout.write(JSON.stringify({ epoch: (await database.writerLease()).epoch, version: current.version,
    nativeCalls, eventCount: (await storage.readEvents(projectId, 0, Number.MAX_SAFE_INTEGER)).length }));
} finally { await coordinator.shutdown(); }
