import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { constants, promises as fs } from "node:fs";
import path from "node:path";
import type { ControlActionEnvelope, OperationRecord } from "./types.js";
import type { CollaborationGitFacade, SynchronizedPullRequestFact } from "./collaboration-git/facade.js";
import { agentGitOperationId } from "./agent-git-tools.js";
import { consumeAcceptanceFault, readBoundAcceptanceArm, readConsumedAcceptanceFault,
  writeAcceptanceEvidence, type AcceptanceBoundary } from "./acceptance-controller.js";

const file = "evidence/pending-owned.json";
const initialInput = (input: AcceptanceBoundary) => `scoped:${input.arrivalRequestId}:epoch:${input.execution.ownershipEpoch}`;
function binding(input: AcceptanceBoundary & { directory?: string; invocationId: string; boundaryAt: string }) {
  return readBoundAcceptanceArm({ ...input, case: "R04", variant: "owned-pending-file",
    directory: input.directory ?? process.env.OPENFARS_R04_PENDING_FAULT_DIRECTORY });
}

/** The actual Agent creates its own diagnostic with its existing file tool.
 * This only adds a once-only request to a real, successful merge result. */
export async function requestR04PendingFile(input: AcceptanceBoundary & {
  inputId: string; envelope: ControlActionEnvelope; result: unknown; operation?: OperationRecord; directory?: string;
}): Promise<unknown> {
  const { execution, envelope } = input;
  if (input.inputId !== initialInput(input) || envelope.action.tool !== "github_merge_pr" ||
    envelope.projectId !== execution.projectId || envelope.agent !== execution.agentId || envelope.stateVersion !== execution.ownershipEpoch) return input.result;
  const bound = await binding({ ...input, invocationId: envelope.invocationId, boundaryAt: envelope.receivedAt });
  if (!bound) return input.result;
  const merged = input.result as SynchronizedPullRequestFact | undefined, op = input.operation;
  if (!merged || merged.status !== "merged" || !merged.localSynchronization || !op || op.status !== "finalized") return input.result;
  const sync = merged.localSynchronization;
  const operationId = await agentGitOperationId({ execution, envelope,
    recordedOperation: id => op.id === id ? op : undefined }, "merge");
  assert.ok(op.id === operationId &&
    op.kind === "pull.merge" && op.ownerExecutionId === execution.id && op.ownershipEpoch === execution.ownershipEpoch &&
    op.expectedHead === merged.headSha && op.expectedBase === input.base &&
    merged.ownerExecutionId === execution.id && merged.head === execution.executionBranch && merged.base === input.base &&
    merged.owner === input.repository.owner && merged.repository === input.repository.name &&
    Number.isSafeInteger(merged.providerNumber) && merged.providerNumber > 0 &&
    (envelope.action.providerNumber === undefined || envelope.action.providerNumber === merged.providerNumber) &&
    /^[a-f0-9]{40}$/.test(merged.headSha ?? "") && /^[a-f0-9]{40}$/.test(merged.mergeCommitSha ?? "") &&
    sync.projectId === execution.projectId && sync.targetBranch === input.base && sync.expectedSourceHead === merged.headSha &&
    sync.mergeCommitSha === merged.mergeCommitSha && sync.localHeadAfter === sync.remoteHead &&
    ["synchronized", "already_synchronized"].includes(sync.status), "R04 request differs from its bound delivery");
  const existing = await fs.lstat(path.join(execution.worktreePath, file)).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return undefined; throw error;
  });
  if (existing) return input.result; // Never ask the Agent to replace inherited work.
  const marker = randomUUID();
  const content = JSON.stringify({ case: "R04", runId: bound.arm.runId, projectId: execution.projectId,
    executionId: execution.id, invocationId: envelope.invocationId, ownershipEpoch: execution.ownershipEpoch,
    branch: execution.executionBranch, marker, disposable: true }, null, 2) + "\n";
  const acceptancePendingFile = { file, content,
    instruction: "R04 armed diagnostic: use your assigned file tool to create this exact new file once, only if absent. Leave it uncommitted for this initial handoff, call finish_task normally, and return. On the ordinary original-task closing supplement inspect it and decide whether to deliver it or remove your disposable diagnostic. Preserve business work and successful PRs; do not recreate this file on later turns." };
  if (!await consumeAcceptanceFault(bound, { status: "pending-file-requested", inputId: input.inputId,
    callId: envelope.callId, operation: op, result: merged, acceptancePendingFile,
    observationLimit: "This request is not evidence of file creation. Require the separate observed receipt and real file-tool, closing/FIFO and native traces." })) return input.result;
  return { ...merged, acceptancePendingFile };
}

/** Read-only evidence at the initial model return. Normal closing performs
 * the repair and checks again after native stop; this controller does neither. */
export async function observeR04PendingFile(input: AcceptanceBoundary & {
  invocationId: string; inputId: string; directory?: string;
  git: Partial<Pick<CollaborationGitFacade, "observeExecutionWorktree">>;
}): Promise<void> {
  if (input.inputId !== initialInput(input)) return;
  const bound = await binding({ ...input, boundaryAt: new Date().toISOString() });
  if (!bound) return;
  let receipt: Record<string, unknown>;
  try { receipt = await readConsumedAcceptanceFault(bound); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return; throw error; }
  const request = receipt.acceptancePendingFile as { file: string; content: string } | undefined;
  assert.ok(receipt.status === "pending-file-requested" && receipt.inputId === input.inputId &&
    request?.file === file && typeof request.content === "string" && request.content.length < 16_384,
    "R04 request receipt is incomplete; preserve it for review");
  const root = await fs.realpath(input.execution.worktreePath);
  assert.equal(root, input.execution.worktreePath, "R04 checkout changed its fixed path");
  const target = path.join(root, file);
  const actual = await fs.realpath(target).catch((error: NodeJS.ErrnoException) => { if (error.code === "ENOENT") return undefined; throw error; });
  if (!actual) return;
  assert.equal(actual, target, "R04 pending file must not traverse a symlink");
  const handle = await fs.open(target, constants.O_RDONLY | constants.O_NOFOLLOW);
  let bytes: Buffer;
  try {
    const stat = await handle.stat();
    assert.ok(stat.isFile() && stat.nlink === 1 && stat.size <= 16_384, "Invalid R04 pending diagnostic");
    const assertIdentity = async () => {
      const current = await fs.lstat(target);
      assert.ok(current.isFile() && !current.isSymbolicLink() && current.nlink === 1 &&
        current.dev === stat.dev && current.ino === stat.ino &&
        await fs.realpath(target) === target && await fs.realpath(root) === root,
      "R04 pending descriptor escaped its checkout");
    };
    if (process.platform === "linux") {
      assert.equal(await fs.realpath(`/proc/self/fd/${handle.fd}`), target, "R04 pending descriptor escaped its checkout");
    }
    await assertIdentity();
    bytes = await handle.readFile();
    await assertIdentity();
  } finally { await handle.close(); }
  if (bytes.toString("utf8") !== request.content) return;
  if (!input.git.observeExecutionWorktree) throw new Error("R04 observation requires trusted worktree status");
  const worktree = await input.git.observeExecutionWorktree(input.execution, input.execution.ownershipEpoch);
  assert.ok(worktree.executionId === input.execution.id && worktree.ownershipEpoch === input.execution.ownershipEpoch &&
    worktree.branch === input.execution.executionBranch && worktree.worktreePath === root, "R04 observed another checkout");
  if (!worktree.pendingPaths.includes(file)) return;
  await writeAcceptanceEvidence(bound, "observed", { status: "pending-file-observed", inputId: input.inputId,
    invocationId: input.invocationId, file, contentSha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.length,
    worktree, observationLimit: "Observed only after the initial model return. Native stop, original Agent cleanup/delivery and next-arrival ordering still require real traces." });
}
