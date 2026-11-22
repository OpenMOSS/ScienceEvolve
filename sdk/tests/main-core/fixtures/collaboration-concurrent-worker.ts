import {
  existsSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import { workerData } from "node:worker_threads";
import {
  CollaborationStateDatabase,
  type WriterLeaseToken
} from "../../../src/core/collaboration-state/index.js";

interface WorkerConfig {
  mode: "commit" | "fail-after-usage-insert";
  databasePath: string;
  lease: WriterLeaseToken;
  nowMs: number;
  projectId: string;
  usageId: string;
  requestId: string;
  agentId: string;
  readyPath?: string;
  goPath?: string;
  attemptPath?: string;
  releasePath?: string;
  donePath: string;
  eventId?: string;
}

const waitArray = new Int32Array(new SharedArrayBuffer(4));

function waitForFile(filePath: string, timeoutMs = 10_000): void {
  const deadline = Date.now() + timeoutMs;
  while (!existsSync(filePath)) {
    if (Date.now() >= deadline) {
      throw new Error(`Timed out waiting for ${filePath}`);
    }
    Atomics.wait(waitArray, 0, 0, 10);
  }
}

const configPath = workerData.configPath as string;
if (!configPath) throw new Error("Worker configuration path is required");
const config = JSON.parse(readFileSync(configPath, "utf8")) as WorkerConfig;

const database = CollaborationStateDatabase.open({
  databasePath: config.databasePath,
  serviceId: config.lease.serviceId,
  instanceId: config.lease.instanceId,
  hostId: config.lease.hostId,
  topology: "single-host",
  now: () => config.nowMs,
  writerLease: config.lease,
  writerOwner: workerData.attachment,
  ...(config.mode === "fail-after-usage-insert"
    ? {
        transactionFault: (point: "usage.after_insert") => {
          if (point !== "usage.after_insert" || !config.releasePath) return;
          if (config.attemptPath) writeFileSync(config.attemptPath, "after-insert\n", "utf8");
          waitForFile(config.releasePath);
          throw new Error("injected transaction rollback before commit");
        }
      }
    : {})
});

try {
  if (config.readyPath) writeFileSync(config.readyPath, "ready\n", "utf8");
  if (config.goPath) waitForFile(config.goPath);
  if (config.mode === "commit" && config.attemptPath) {
    writeFileSync(config.attemptPath, "attempting\n", "utf8");
  }

  let injectedFailure = false;
  try {
    database.appendUsage({
      projectId: config.projectId,
      usageId: config.usageId,
      requestId: config.requestId,
      agentId: config.agentId,
      inputTokens: config.mode === "commit" ? 3 : 11,
      cachedInputTokens: 0,
      outputTokens: 2,
      totalTokens: config.mode === "commit" ? 5 : 13
    });
  } catch (error) {
    if (config.mode !== "fail-after-usage-insert" ||
      !(error instanceof Error) ||
      !error.message.includes("injected transaction rollback")) {
      throw error;
    }
    injectedFailure = true;
  }
  if (config.mode === "fail-after-usage-insert" && !injectedFailure) {
    throw new Error("Expected the transaction fault to roll back writer A");
  }
  if (config.mode === "commit" && config.eventId) {
    database.appendEvent({
      projectId: config.projectId,
      eventId: config.eventId,
      requestId: `${config.requestId}:event`,
      agentId: config.agentId,
      type: "fixture.concurrent-writer.committed",
      payload: { usageId: config.usageId }
    });
  }
  writeFileSync(config.donePath, "done\n", "utf8");
} finally {
  database.close();
}
