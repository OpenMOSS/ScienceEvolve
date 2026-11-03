import { promises as fs } from "node:fs";
import path from "node:path";
import { redactTrace } from "../utils.js";
import { randomUUID } from "node:crypto";

export interface NativeJobScope { projectId: string; projectPath: string; agentId: string; invocationId: string; workspacePath: string; executionId?: string; }
export interface NativeJobRequest { operation: "register" | "status" | "pause" | "resume" | "stop"; jobId: string; pid?: number; reason?: string; }
export interface NativeJobRecord {
  schemaVersion: 1; jobId: string; projectId: string; agentId: string; invocationId: string; executionId?: string;
  pid: number; processGroupId: number; startTicks: string; bootId: string; namespace: string;
  state: "running" | "paused" | "exited"; pausedByProject?: boolean; observedAt: string; registeredAt: string;
}
const queues = new Map<string, Promise<unknown>>();
async function serialized<T>(root: string, action: () => Promise<T>): Promise<T> {
  const previous = queues.get(root) ?? Promise.resolve();
  const next = previous.catch(() => {}).then(action); queues.set(root, next);
  try { return await next; } finally { if (queues.get(root) === next) queues.delete(root); }
}
function directory(projectPath: string) { return path.join(projectPath, "runtime", "native-background-jobs"); }
const procPids = new Map<number, string>();
async function procDirectory(pid: number): Promise<string> {
  const namespace = await fs.readlink("/proc/self/ns/pid");
  const matches = async (root: string) => {
    try {
      if (await fs.readlink(`${root}/ns/pid`) !== namespace) return false;
      const status = await fs.readFile(`${root}/status`, "utf8");
      const nested = status.match(/^NSpid:\s+(.+)$/m)?.[1]?.trim().split(/\s+/).map(Number);
      return (nested?.at(-1) ?? Number(path.basename(root))) === pid;
    } catch (error) { if (["ENOENT", "ESRCH", "EACCES", "EPERM"].includes((error as NodeJS.ErrnoException).code ?? "")) return false; throw error; }
  };
  for (const root of [...new Set([procPids.get(pid), `/proc/${pid}`].filter((value): value is string => !!value))]) {
    if (await matches(root)) return root;
  }
  for (const name of await fs.readdir("/proc")) {
    if (!/^[0-9]+$/.test(name)) continue;
    const root = `/proc/${name}`;
    if (await matches(root)) { procPids.set(pid, root); return root; }
  }
  throw Object.assign(new Error(`Native process ${pid} no longer exists in this PID namespace`), { code: "ESRCH" });
}
async function identity(pid: number) {
  if (!Number.isSafeInteger(pid) || pid <= 1 || process.platform !== "linux") throw new Error("Native job tracking requires a Linux PID greater than 1");
  const root = await procDirectory(pid);
  const [stat, status, bootId, namespace] = await Promise.all([fs.readFile(`${root}/stat`, "utf8"), fs.readFile(`${root}/status`, "utf8"),
    fs.readFile("/proc/sys/kernel/random/boot_id", "utf8"), fs.readlink(`${root}/ns/pid`)]);
  const fields = stat.slice(stat.lastIndexOf(")") + 2).trim().split(/\s+/);
  if (fields[0] === "Z" || fields[0] === "X") return undefined;
  const group = Number(status.match(/^NSpgid:\s+(.+)$/m)?.[1]?.trim().split(/\s+/).at(-1) ?? fields[2]);
  return { pid, processGroupId: group, startTicks: fields[19]!, bootId: bootId.trim(), namespace,
    state: fields[0] === "T" || fields[0] === "t" ? "paused" as const : "running" as const };
}
async function observe(record: NativeJobRecord): Promise<NativeJobRecord> {
  const actual = await identity(record.pid).catch(error => { if (["ENOENT", "ESRCH"].includes(error.code)) return undefined; throw error; });
  const same = actual && ["pid", "processGroupId", "startTicks", "bootId", "namespace"].every(key => actual[key as keyof typeof actual] === record[key as keyof NativeJobRecord]);
  return { ...record, state: same ? actual.state : "exited", observedAt: new Date().toISOString() };
}
async function read(root: string, jobId: string): Promise<NativeJobRecord | undefined> {
  const file = path.join(root, `${jobId}.json`);
  const info = await fs.lstat(file).catch(error => { if (error.code === "ENOENT") return undefined; throw error; });
  if (!info) return undefined;
  if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1) throw new Error("Native job record must be a regular unaliased file");
  const record = JSON.parse(await fs.readFile(file, "utf8")) as NativeJobRecord;
  if (record.schemaVersion !== 1 || record.jobId !== jobId || record.pid !== record.processGroupId || !/^[0-9]+$/.test(record.startTicks)) throw new Error("Invalid native job process identity");
  return record;
}
async function save(root: string, record: NativeJobRecord, event: Record<string, unknown>) {
  await fs.mkdir(root, { recursive: true, mode: 0o700 });
  if (await fs.realpath(root) !== path.resolve(root)) throw new Error("Native job records must remain in the canonical project runtime");
  // Append evidence before replacing the latest observation. Never remove process history.
  await fs.appendFile(path.join(root, "events.jsonl"), JSON.stringify({ ...event, job: record, at: new Date().toISOString() }) + "\n", { mode: 0o600 });
  const file = path.join(root, `${record.jobId}.json`), temporary = `${file}.${randomUUID()}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(record) + "\n", { mode: 0o600, flag: "wx" }); await fs.rename(temporary, file);
}
async function signal(record: NativeJobRecord, operation: "pause" | "resume" | "stop", assertCurrent: () => unknown = () => {}) {
  const current = await observe(record); if (current.state === "exited") return current;
  // Only an explicitly registered isolated group is signalable. Re-check the
  // boot/namespace/start identity immediately before every signal, including KILL.
  await assertCurrent();
  process.kill(-current.processGroupId, operation === "pause" ? "SIGSTOP" : operation === "resume" ? "SIGCONT" : "SIGTERM");
  if (operation === "stop") {
    for (let i = 0; i < 20; i++) { await new Promise(resolve => setTimeout(resolve, 25)); if ((await observe(current)).state === "exited") break; }
    const remaining = await observe(current); if (remaining.state !== "exited") { await assertCurrent(); process.kill(-remaining.processGroupId, "SIGKILL"); }
  }
  for (let i = 0; i < 20; i++) {
    const actual = await observe(current);
    if (actual.state === "exited" || actual.state === (operation === "pause" ? "paused" : "running")) return actual;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw new Error(`Native job ${operation} signal was sent, but the requested process state is not yet confirmed; inspect status before retrying`);
}
export async function requestNativeBackgroundJob(scope: NativeJobScope, value: unknown, assertCurrent: () => Promise<unknown>): Promise<NativeJobRecord> {
  const request = value as NativeJobRequest;
  if (!request || !["register", "status", "pause", "resume", "stop"].includes(request.operation) ||
    typeof request.jobId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,95}$/.test(request.jobId) ||
    Object.keys(request).some(key => !["operation", "jobId", "pid", "reason"].includes(key)) ||
    request.reason !== undefined && (typeof request.reason !== "string" || request.reason.length > 2000)) throw new Error("Invalid background job operation/jobId/pid/reason");
  const root = directory(scope.projectPath);
  return serialized(root, async () => {
    await assertCurrent();
    let record = await read(root, request.jobId);
    if (record && (record.projectId !== scope.projectId || record.agentId !== scope.agentId && request.operation !== "status")) throw new Error("This native background job belongs to another Agent/project");
    if (request.operation === "register") {
      if (record) {
        if (record.pid !== request.pid) throw new Error("jobId already names a different retained process; use another explicit jobId");
      } else {
        const actual = await identity(request.pid!); if (!actual) throw new Error("The requested process already exited");
        if (actual.pid !== actual.processGroupId) throw new Error("Background handoff requires an isolated process group. Start the native job with setsid and register its actual leader PID; never register the Harness group.");
        const proc = await procDirectory(request.pid!);
        const cwd = await fs.realpath(`${proc}/cwd`), workspace = await fs.realpath(scope.workspacePath);
        const relative = path.relative(workspace, cwd);
        const environment = await fs.readFile(`${proc}/environ`, "utf8");
        const env = new Map(environment.split("\0").map(row => { const at = row.indexOf("="); return [row.slice(0, at), row.slice(at + 1)] as const; }));
        if (relative.startsWith("..") || path.isAbsolute(relative) || env.get("SCIENCEEVOLVE_PROJECT_ID") !== scope.projectId ||
          env.get("SCIENCEEVOLVE_AGENT_NAME") !== scope.agentId) throw new Error("Background process does not belong to this Agent's native workspace and project environment");
        record = { schemaVersion: 1, jobId: request.jobId, projectId: scope.projectId, agentId: scope.agentId,
          invocationId: scope.invocationId, ...(scope.executionId ? { executionId: scope.executionId } : {}),
          ...actual, registeredAt: new Date().toISOString(), observedAt: new Date().toISOString() };
      }
    }
    if (!record) throw new Error("Unknown background jobId; register its native PID before handing off monitoring");
    await assertCurrent();
    record = request.operation === "register" || request.operation === "status" ? await observe(record) : await signal(record, request.operation, assertCurrent);
    await save(root, record, { operation: request.operation, actor: scope.agentId, invocationId: scope.invocationId, reason: request.reason ? redactTrace(request.reason) : undefined });
    return record;
  });
}
/** User lifecycle intent controls registered jobs; ordinary task return does not kill them. */
export async function nativeBackgroundJobLifecycle(projectPath: string, operation: "pause" | "resume" | "stop", assertCurrent: () => unknown): Promise<void> {
  const root = directory(projectPath);
  await serialized(root, async () => {
    const files = await fs.readdir(root).catch(error => { if (error.code === "ENOENT") return []; throw error; });
    for (const file of files.filter(file => /^[A-Za-z0-9][A-Za-z0-9_-]{0,95}\.json$/.test(file))) {
      let job = await read(root, file.slice(0, -5)); if (!job) continue;
      job = await observe(job);
      if (job.state !== "exited" && (operation !== "resume" || job.pausedByProject)) {
        assertCurrent();
        const wasRunning = job.state === "running";
        job = await signal(job, operation, assertCurrent);
        job.pausedByProject = operation === "pause" ? wasRunning || job.pausedByProject : false;
      }
      await save(root, job, { operation: `project.${operation}`, actor: "user-lifecycle" });
    }
  });
}
