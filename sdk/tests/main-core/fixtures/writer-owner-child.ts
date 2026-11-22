import { CollaborationStateDatabase } from "../../../src/core/collaboration-state/store.js";

const database = CollaborationStateDatabase.open(JSON.parse(process.argv[2]));
database.createProject({ projectId: "p", workflowRevision: 1, workflowSnapshot: { agents: [] },
  git: { enabled: false, status: "disabled" }, workerCapacity: 1, managementCapacity: 1 });
process.send!({ epoch: database.writerLease().epoch });
process.on("message", message => {
  if (message === "write") {
    database.appendEvent({ projectId: "p", type: "resumed", payload: {}, requestId: "resumed-once" });
    process.send!({ committed: true, epoch: database.writerLease().epoch });
  }
});
process.on("disconnect", () => { database.close(); process.exit(0); });
