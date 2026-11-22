import { CollaborationRuntimeCoordinator } from "../../../src/core/collaboration-runtime.js";
import { ProjectStorage } from "../../../src/core/storage.js";
import { EventHub } from "../../../src/core/event-hub.js";

// Owned test writer: hold the first publication after the production Pause
// entry has saved user intent, then let the parent kill this exact process.
// This never fabricates a native safe-point/stop receipt or touches GitHub.
process.on("message", () => {}); // Keep only the owned parent's IPC alive.
process.on("disconnect", () => process.exit(0));
const storage = new ProjectStorage(process.argv[2]!, new EventHub());
await storage.initialize();
const state = await storage.loadState(process.argv[3]!);
const coordinator = new CollaborationRuntimeCoordinator({ storage,
  serviceId: "pause-crash-owned-writer", hostId: "host-test" });
await coordinator.initialize();
storage.readEvents = async () => {
  process.send!({ kind: "pause-publication-held", projectId: state.id });
  return new Promise(() => {});
};
await coordinator.pauseProject(state);
