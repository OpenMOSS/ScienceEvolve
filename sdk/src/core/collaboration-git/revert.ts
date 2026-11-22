import { gitDeliveryRef } from "./contracts.js";
import { constants, promises as fs } from "node:fs";
import path from "node:path";
import type { ControlAction, OperationRecord } from "../types.js";
import type { CollaborationGitOperationStore, GitCommandResult, GitExecutionAuthority } from "./contracts.js";
import { GitInputError, OperationPayloadMismatchError, OperationStoreViolationError } from "./errors.js";
import { assertBusinessGitPaths, authorizedCommit, completeCommitSha, gitOutputPage } from "./inspection.js";
import { finalizeOperation, operationPayloadHash, prepareOperation, transitionOperation } from "./operation.js";

export type GitRevertRequest = Extract<ControlAction, { tool: "git_revert" }>;
export interface HistoricalPullSource {
  sourceOperationId: string;
  providerNumber: number;
  ownerExecutionId: string;
  headSha: string;
  base: string;
  mergeCommitSha: string;
}
type StartRequest = Extract<GitRevertRequest, { target: string }>;
interface RevertMarker {
  schemaVersion: 1;
  operationId: string;
  payloadHash: string;
  projectId: string;
  executionId: string;
  ownershipEpoch: number;
  branch: string;
  request: StartRequest;
  source?: HistoricalPullSource;
  parent: string;
  files: string[];
  lastAttemptId: string;
  lastAttemptMode: string;
}

export function parseGitRevertRequest(args: Record<string, unknown>, mcp = false): GitRevertRequest {
  const start = args.mode === "apply" || args.mode === "preview";
  const allowed = start ? ["mode", "target", "expectedHead", "mainline", "sourceOperationId", "offset", "maxBytes", "expectedVersion"]
    : ["mode", "operationId", "expectedHead"];
  if (!["preview", "apply", "status", "continue", "abort"].includes(String(args.mode)) ||
    Object.keys(args).some(key => !allowed.includes(key) && key !== "tool" && !(mcp && key === "callId"))) throw new GitInputError("Invalid revert mode or unexpected field");
  if (start) {
    completeCommitSha(args.target as string); completeCommitSha(args.expectedHead as string);
    if (args.mainline !== undefined && (!Number.isSafeInteger(args.mainline) || Number(args.mainline) < 1)) throw new GitInputError("mainline must select an actual parent starting at 1");
    if (args.sourceOperationId !== undefined && (typeof args.sourceOperationId !== "string" || !args.sourceOperationId || args.sourceOperationId.length > 1024)) throw new GitInputError("Invalid historical source operation");
    for (const [key, min, max] of [["offset", 0, Number.MAX_SAFE_INTEGER], ["maxBytes", 4, 262144]] as const) {
      if (args[key] !== undefined && (!Number.isSafeInteger(args[key]) || Number(args[key]) < min || Number(args[key]) > max)) throw new GitInputError(`Invalid ${key}`);
    }
    if (args.expectedVersion !== undefined && (typeof args.expectedVersion !== "string" || !/^[a-f0-9]{64}$/.test(args.expectedVersion))) throw new GitInputError("Invalid patch version");
    if (args.mode === "apply" && ["offset", "maxBytes", "expectedVersion"].some(key => args[key] !== undefined)) throw new GitInputError("Patch paging applies only to preview");
  } else {
    if (typeof args.operationId !== "string" || !/^git-revert-[a-f0-9]{64}$/.test(args.operationId)) throw new GitInputError("Select the exact returned revert operationId");
    if (args.expectedHead !== undefined || args.mode !== "status") completeCommitSha(args.expectedHead as string);
  }
  return { tool: "git_revert", ...Object.fromEntries(allowed.filter(key => args[key] !== undefined).map(key =>
    [key, ["target", "expectedHead"].includes(key) ? completeCommitSha(args[key] as string) : args[key]])) } as GitRevertRequest;
}

export interface RevertContext {
  projectId: string;
  execution: GitExecutionAuthority;
  activationBase: string;
  directBaseHead: string;
  markerPath: string;
  store: CollaborationGitOperationStore;
  request: GitRevertRequest;
  /** Every distinct Agent call is recorded before this function is invoked. */
  attemptId: string;
  source?: HistoricalPullSource;
  run(args: readonly string[], mutation?: boolean, acceptedExitCodes?: readonly number[], expectedHead?: string): Promise<GitCommandResult>;
  verify(): Promise<void>;
}

async function readMarker(file: string): Promise<RevertMarker | undefined> {
  let handle;
  try { handle = await fs.open(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0)); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined; throw error; }
  try {
    const info = await handle.stat();
    if (!info.isFile() || info.nlink !== 1 || info.size > 1024 * 1024 || process.platform !== "win32" && (info.mode & 0o077)) throw new GitInputError("Revert marker is not a private regular file");
    return JSON.parse(await handle.readFile("utf8")) as RevertMarker;
  } finally { await handle.close(); }
}

async function writeMarker(file: string, marker: RevertMarker, fresh = false) {
  const handle = await fs.open(file, (fresh ? constants.O_EXCL | constants.O_CREAT : 0) |
    constants.O_WRONLY | (constants.O_NOFOLLOW ?? 0), 0o600);
  try { await handle.truncate(0); await handle.writeFile(`${JSON.stringify(marker)}\n`, "utf8"); await handle.sync(); }
  finally { await handle.close(); }
}

function markerMatches(c: RevertContext, marker: RevertMarker, op: OperationRecord) {
  if (marker.schemaVersion !== 1 || marker.projectId !== c.projectId || marker.executionId !== c.execution.id ||
    marker.ownershipEpoch !== c.execution.ownershipEpoch || marker.branch !== c.execution.executionBranch ||
    marker.operationId !== op.id || marker.payloadHash !== op.payloadHash || marker.request.expectedHead !== op.expectedHead ||
    op.expectedBase !== c.execution.executionBranch || op.kind !== "git.revert" || op.ownerExecutionId !== c.execution.id ||
    op.ownershipEpoch !== c.execution.ownershipEpoch || operationPayloadHash(revertPayload(c, marker.request, marker.source)) !== op.payloadHash) {
    throw new OperationPayloadMismatchError(op.id);
  }
}

function revertPayload(c: RevertContext, request: StartRequest, source?: HistoricalPullSource) {
  return { projectId: c.projectId, executionId: c.execution.id, ownershipEpoch: c.execution.ownershipEpoch,
    branch: gitDeliveryRef(c.execution.executionBranch), target: request.target.toLowerCase(), expectedHead: request.expectedHead.toLowerCase(),
    mainline: request.mainline, source };
}

async function currentHead(c: RevertContext) { return completeCommitSha((await c.run(["rev-parse", "HEAD"])).stdout.trim()); }
async function revertHead(c: RevertContext) {
  const result = await c.run(["rev-parse", "--verify", "--quiet", "REVERT_HEAD"], false, [0, 1, 128]);
  return result.code === 0 ? completeCommitSha(result.stdout.trim()) : undefined;
}
async function changed(c: RevertContext, cached = false) {
  return (await c.run(["diff", ...(cached ? ["--cached"] : []), "--no-renames", "--name-only", "-z", "--"])).stdout.split("\0").filter(Boolean);
}
async function conflicts(c: RevertContext) {
  return (await c.run(["diff", "--name-only", "--diff-filter=U", "-z", "--"])).stdout.split("\0").filter(Boolean);
}

async function assertNoForeignOperation(c: RevertContext, allowedTarget?: string) {
  const activeTarget = await revertHead(c);
  if (activeTarget && activeTarget !== allowedTarget) throw new GitInputError("Another exact revert operation is active");
  for (const ref of ["MERGE_HEAD", "CHERRY_PICK_HEAD"]) {
    if ((await c.run(["rev-parse", "--verify", "--quiet", ref], false, [0, 1, 128])).code === 0) throw new GitInputError("Another native Git operation is active; original revert retained");
  }
  for (const name of ["rebase-merge", "rebase-apply", "sequencer"]) {
    try { await fs.lstat(path.join(path.dirname(c.markerPath), name)); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") continue; throw error; }
    throw new GitInputError("Another native Git sequence is active; original revert retained");
  }
}

/** No business mutation happens here. A lost response is reconciled from its
 * exact commit marker and parent; an inconclusive observation stays unknown. */
async function observe(c: RevertContext, op: OperationRecord, marker?: RevertMarker): Promise<Record<string, unknown>> {
  await c.verify();
  const head = await currentHead(c);
  if (["finalized", "failed"].includes(op.status)) return { ...op.remoteFact, operationId: op.id, currentHead: head };
  if (!marker) return { status: "outcome_unknown", operationId: op.id, beforeHead: op.expectedHead, currentHead: head,
    message: "Original request exists but its local operation binding is unavailable; no Git operation was repeated." };
  markerMatches(c, marker, op);
  await assertNoForeignOperation(c, marker.request.target);
  const log = (await c.run(["log", "--format=%H%x00%P%x00%B%x00", "--fixed-strings",
    `--grep=OpenFARS-Operation: ${op.id}`, `${op.expectedHead}..${head}`, "--"])).stdout.split("\0");
  const found: string[] = [];
  for (let i = 0; i + 2 < log.length; i += 3) {
    if (log[i + 1] === op.expectedHead && log[i + 2]!.split("\n").includes(`OpenFARS-Operation: ${op.id}`)) found.push(completeCommitSha(log[i]!.trim()));
  }
  if (found.length > 1) throw new OperationStoreViolationError("Revert commit provenance is ambiguous");
  if (found[0]) {
    const actualFiles = (await c.run(["diff", op.expectedHead!, found[0], "--name-only", "--no-renames", "-z", "--"])).stdout.split("\0").filter(Boolean);
    if (actualFiles.some(file => !marker.files.includes(file))) throw new GitInputError("Revert commit includes unrelated files");
    const fact = { status: "committed", operationId: op.id, target: marker.request.target, mainline: marker.request.mainline,
      beforeHead: op.expectedHead, afterHead: found[0], files: actualFiles, source: marker.source, observedAt: new Date().toISOString() };
    const activeTarget = await revertHead(c);
    if (activeTarget) {
      if (activeTarget !== marker.request.target || head !== found[0]) throw new GitInputError("Native revert metadata no longer matches its committed operation");
      return { ...fact, status: "committed_cleanup_pending", currentHead: head };
    }
    await c.verify();
    await finalizeOperation(c.store, op, fact);
    await fs.unlink(c.markerPath);
    return { ...fact, currentHead: head };
  }
  const conflictPaths = await conflicts(c), activeTarget = await revertHead(c);
  if (head !== op.expectedHead || activeTarget && activeTarget !== marker.request.target) throw new GitInputError("Revert HEAD or current operation changed; original facts retained");
  return { status: conflictPaths.length ? "conflicted" : op.remoteFact?.stage === "patch_applied" ? "ready_to_commit" : "outcome_unknown",
    operationId: op.id, target: marker.request.target, beforeHead: op.expectedHead, currentHead: head,
    files: marker.files, conflictPaths, source: marker.source, originalResult: op.remoteFact };
}

export async function revertGit(c: RevertContext): Promise<Record<string, unknown>> {
  const request = parseGitRevertRequest(c.request as unknown as Record<string, unknown>);
  await c.verify();
  let marker = await readMarker(c.markerPath);
  if (request.mode === "preview" || request.mode === "apply") {
    if (request.mode === "apply") {
      const prior = await c.store.recordedOperation?.(c.attemptId);
      if (prior) {
        const originalSource = marker?.operationId === prior.id ? marker.source : prior.remoteFact?.source as HistoricalPullSource | undefined;
        if (request.sourceOperationId !== originalSource?.sourceOperationId ||
          prior.payloadHash !== operationPayloadHash(revertPayload(c, request, originalSource))) throw new OperationPayloadMismatchError(c.attemptId);
        return observe(c, prior, marker);
      }
    }
    const head = await currentHead(c);
    if (head !== completeCommitSha(request.expectedHead)) {
      throw new GitInputError("Revert expectedHead does not match actual HEAD");
    }
    const target = await authorizedCommit(args => c.run(args), request.target, head);
    const parents = (await c.run(["show", "-s", "--format=%P", target, "--"])).stdout.trim().split(" ").filter(Boolean);
    if (!parents.length || (parents.length > 1 ? request.mainline === undefined : request.mainline !== undefined) ||
      request.mainline !== undefined && request.mainline > parents.length) throw new GitInputError("A merge requires an explicit actual mainline parent; ordinary commits omit mainline");
    const parent = parents[(request.mainline ?? 1) - 1]!;
    if (request.sourceOperationId) {
      if (!c.source || c.source.sourceOperationId !== request.sourceOperationId || c.source.mergeCommitSha !== target ||
        c.source.ownerExecutionId === c.execution.id || parents.length > 1 &&
          (!parents.includes(c.source.headSha) || parent === c.source.headSha)) throw new GitInputError("Merged PR source does not authorize this target/mainline in the new repair task");
    } else {
      const ownCommits = (await c.run(["log", "--first-parent", "--format=%H", `${c.activationBase}..${head}`, "--"])).stdout.split(/\r?\n/);
      if (c.source || !ownCommits.includes(target) ||
        (await c.run(["merge-base", "--is-ancestor", target, c.directBaseHead], false, [0, 1])).code === 0) {
        throw new GitInputError("Choose a commit from this task, or supply its authorized historical merged PR source");
      }
    }
    const files = (await c.run(["diff", parent, target, "--name-only", "--no-renames", "-z", "--"])).stdout.split("\0").filter(Boolean);
    assertBusinessGitPaths(files, c.execution.agentId);
    if (!files.length) throw new GitInputError("Target has no changes to revert");
    if (request.mode === "preview") {
      const patch = (await c.run(["diff", target, parent, "--no-ext-diff", "--no-textconv", "--no-renames", "--binary", "--"])).stdout;
      await c.verify();
      if (await currentHead(c) !== head) throw new GitInputError("HEAD changed during preview");
      return { status: "preview", target, parents, mainline: request.mainline, expectedHead: head, files, source: c.source,
        applicability: "not_executed", ...gitOutputPage(patch, request.offset, request.maxBytes, request.expectedVersion) };
    }
    if (!c.store.recordedOperation || !c.store.activeRevertOperation) throw new OperationStoreViolationError("Revert requires the durable operation journal");
    const existing = await c.store.recordedOperation(c.attemptId);
    if (existing) {
      if (existing.payloadHash !== operationPayloadHash(revertPayload(c, request, c.source))) throw new OperationPayloadMismatchError(c.attemptId);
      return observe(c, existing, marker);
    }
    if (marker || await c.store.activeRevertOperation(c.execution.id)) throw new GitInputError("An earlier exact revert operation remains unresolved; inspect that operation");
    if ((await changed(c)).length || (await changed(c, true)).length || await revertHead(c)) throw new GitInputError("Revert requires a clean tracked worktree and index with no active operation");
    await assertNoForeignOperation(c);
    let op = await prepareOperation(c.store, { id: c.attemptId, kind: "git.revert", ownerExecutionId: c.execution.id,
      ownershipEpoch: c.execution.ownershipEpoch, expectedHead: head, expectedBase: c.execution.executionBranch }, revertPayload(c, request, c.source));
    marker = { schemaVersion: 1, operationId: op.id, payloadHash: op.payloadHash, projectId: c.projectId,
      executionId: c.execution.id, ownershipEpoch: c.execution.ownershipEpoch, branch: gitDeliveryRef(c.execution.executionBranch),
      request: { ...request, target, expectedHead: head }, parent, files, lastAttemptId: c.attemptId, lastAttemptMode: "apply",
      ...(c.source ? { source: c.source } : {}) };
    await writeMarker(c.markerPath, marker, true);
    const result = await c.run(["revert", "--no-commit", "--no-rerere-autoupdate",
      ...(request.mainline === undefined ? [] : ["--mainline", String(request.mainline)]), target], true, [0, 1, 128], head);
    const conflictPaths = await conflicts(c);
    op = await transitionOperation(c.store, op, { status: "uncertain", remoteFact: { stage: result.code === 0 ? "patch_applied" : "revert_returned_error",
      operationId: op.id, target, beforeHead: head, files, conflictPaths, commandResult: result, attemptId: c.attemptId,
      ...(c.source ? { source: c.source } : {}) } });
    if (result.code !== 0 || conflictPaths.length) return { ...(await observe(c, op, marker)), commandResult: result };
    return commitResolution(c, op, marker);
  }
  if (!("operationId" in request)) throw new GitInputError("An exact revert operationId is required");
  if (!c.store.recordedOperation) throw new OperationStoreViolationError("Revert journal is unavailable");
  const op = await c.store.recordedOperation(request.operationId);
  if (!op || op.kind !== "git.revert" || op.ownerExecutionId !== c.execution.id || op.ownershipEpoch !== c.execution.ownershipEpoch || op.expectedBase !== c.execution.executionBranch) throw new GitInputError("Revert operation belongs to another task or ownership epoch");
  const observed = await observe(c, op, marker);
  if (request.mode === "status" || ["committed", "aborted", "failed"].includes(String(observed.status))) return observed;
  if (!marker) throw new GitInputError("The original local operation binding is missing; no mutation was repeated");
  markerMatches(c, marker, op);
  if (observed.status === "committed_cleanup_pending") {
    if (request.mode !== "continue" || request.expectedHead !== observed.afterHead) throw new GitInputError("The revert is already committed; explicitly continue its exact native metadata cleanup");
    await c.run(["revert", "--quit"], true, [0], String(observed.afterHead));
    return observe(c, op, marker);
  }
  if (request.expectedHead !== op.expectedHead || await currentHead(c) !== op.expectedHead) throw new GitInputError("Revert continuation expectedHead changed");
  if (marker.lastAttemptId === c.attemptId) return observed;
  const staged = await changed(c, true);
  if (staged.some(file => !marker!.files.includes(file))) throw new GitInputError("Unrelated staged changes must be preserved outside this revert operation");
  marker.lastAttemptId = c.attemptId; marker.lastAttemptMode = request.mode;
  await writeMarker(c.markerPath, marker);
  if (request.mode === "continue") {
    if (await revertHead(c) !== marker.request.target && op.remoteFact?.stage !== "patch_applied") throw new GitInputError("No confirmed patch or matching conflicted revert is available to continue");
    return commitResolution(c, op, marker);
  }
  // Restore only this exact operation's paths, preserving unrelated files and
  // their index entries. Quit clears only the matching native revert metadata.
  const restorePaths = [...new Set([...staged, ...await changed(c), ...await conflicts(c)])].filter(file => marker!.files.includes(file));
  for (let i = 0; i < restorePaths.length; i += 40) await c.run(["restore", `--source=${op.expectedHead}`, "--staged", "--worktree", "--", ...restorePaths.slice(i, i + 40)], true, [0], op.expectedHead);
  if (await revertHead(c)) await c.run(["revert", "--quit"], true, [0], op.expectedHead);
  const retainedUntrackedPaths = (await c.run(["ls-files", "--others", "--exclude-standard", "-z", "--"])).stdout.split("\0")
    .filter(file => marker!.files.includes(file));
  const fact = { status: "aborted", operationId: op.id, target: marker.request.target, beforeHead: op.expectedHead,
    afterHead: await currentHead(c), files: marker.files, restoredFiles: restorePaths, retainedUntrackedPaths,
    source: marker.source, attemptId: c.attemptId, observedAt: new Date().toISOString() };
  await transitionOperation(c.store, op, { status: "failed", remoteFact: fact });
  await fs.unlink(c.markerPath);
  return fact;
}

async function commitResolution(c: RevertContext, op: OperationRecord, marker: RevertMarker) {
  if ((await conflicts(c)).length) throw new GitInputError("Resolve and stage all conflicts before explicitly continuing");
  const staged = await changed(c, true);
  if (!staged.length || staged.some(file => !marker.files.includes(file))) throw new GitInputError("Revert commit requires only this exact operation's staged paths");
  assertBusinessGitPaths(staged, c.execution.agentId);
  if (await currentHead(c) !== op.expectedHead) throw new GitInputError("Revert HEAD changed before commit");
  const tree = completeCommitSha((await c.run(["write-tree"], true, [0], op.expectedHead)).stdout.trim());
  const files = (await c.run(["diff", op.expectedHead!, tree, "--name-only", "--no-renames", "-z", "--"])).stdout.split("\0").filter(Boolean);
  if (!files.length || files.some(file => !marker.files.includes(file))) throw new GitInputError("The staged revert snapshot includes unrelated files or no changes");
  // Commit the verified immutable index tree. A concurrent later stage stays
  // in the real index and cannot silently enter this commit or be discarded.
  const result = await c.run(["commit-tree", tree, "-p", op.expectedHead!, "-m", `Revert ${marker.request.target}`,
    "-m", `This reverts commit ${marker.request.target}.`, "-m", `OpenFARS-Operation: ${op.id}`], true, [0], op.expectedHead);
  const afterHead = completeCommitSha(result.stdout.trim());
  await c.run(["update-ref", `refs/heads/${c.execution.executionBranch}`, afterHead, op.expectedHead!], true, [0], op.expectedHead);
  if (await revertHead(c) === marker.request.target) await c.run(["revert", "--quit"], true, [0], afterHead);
  return { ...(await observe(c, op, marker)), commandResult: result };
}
