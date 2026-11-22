import { createInterface } from "node:readline";
import { CollaborationStateDatabase } from "../../../src/core/collaboration-state/store.js";

const database = CollaborationStateDatabase.open(JSON.parse(process.argv[2]));
try {
  database.createProject({ projectId: "p", workflowRevision: 1, workflowSnapshot: { agents: [] },
    git: { enabled: false, status: "disabled" }, workerCapacity: 1, managementCapacity: 1 });
  console.log(JSON.stringify({ epoch: database.writerLease().epoch, pid: process.pid }));
  for await (const message of createInterface({ input: process.stdin })) {
    if (message !== "write") throw new Error("Unexpected writer fixture request");
    database.appendEvent({ projectId: "p", type: "resumed", payload: {}, requestId: "resumed-once" });
    console.log(JSON.stringify({ committed: true, epoch: database.writerLease().epoch }));
  }
} finally { database.close(); }
