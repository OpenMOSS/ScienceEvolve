import type { ChildProcessWithoutNullStreams } from "node:child_process";
import { randomUUID } from "node:crypto";
import { closeSync, constants, lstatSync, mkdirSync, openSync, readFileSync, readlinkSync,
  readSync, readdirSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

/** Assigned by ProcessHost, independently of the Agent's command and PID. */
export const NATIVE_PROCESS_SCOPE_ENV = "SCIENCEEVOLVE_NATIVE_PROCESS_SCOPE";
/** Set only on the Harness's configured MCP launch environment. */
export const NATIVE_PROCESS_SUPPORT_ENV = "SCIENCEEVOLVE_NATIVE_PROCESS_SUPPORT";

export interface NativeProcessOwner {
  projectId: string;
  projectPath: string;
  agentId: string;
  invocationId?: string;
  executionId?: string;
  onChanges(records: readonly NativeProcessRecord[]): Promise<void> | void;
}

export interface NativeProcessRecord {
  scopeId: string;
  projectId: string;
  agentId: string;
  invocationId?: string;
  executionId?: string;
  pid: number;
  procPid: number;
  processGroupId: number;
  parentProcPid: number;
  startTicks: string;
  bootId: string;
  namespace: string;
  command: string;
  root: boolean;
  state: "running" | "exited" | "handed_off";
  firstObservedAt: string;
  exitObservedAt?: string;
  jobId?: string;
}

interface ProcessRow {
  pid: number; procPid: number; processGroupId: number; parentProcPid: number;
  startTicks: string; namespace: string; command: string; scopeId?: string; support?: boolean;
}
interface Inventory {
  version: 1; scopeId: string; owner: Omit<NativeProcessOwner, "onChanges">;
  bootId: string; namespace: string; rootPid: number; rootStartTicks: string;
  records: NativeProcessRecord[];
}

const scopes = new Set<NativeProcessScope>();
const children = new WeakMap<ChildProcessWithoutNullStreams, NativeProcessScope>();
const roots = new Map<number, NativeProcessScope>();
let timer: ReturnType<typeof setInterval> | undefined;

function absent(error: unknown): boolean {
  return ["ENOENT", "ESRCH"].includes((error as NodeJS.ErrnoException).code ?? "");
}
function readRow(procPid: number): ProcessRow | undefined {
  const directory = `/proc/${procPid}`;
  try {
    const stat = readFileSync(`${directory}/stat`, "utf8"), close = stat.lastIndexOf(")");
    const fields = stat.slice(close + 2).trim().split(/\s+/);
    if (fields[0] === "Z" || fields[0] === "X") return undefined;
    const status = readFileSync(`${directory}/status`, "utf8");
    const field = (name: string, fallback: number) => Number(status.match(new RegExp(`^${name}:\\s+(.+)$`, "m"))?.[1]?.trim().split(/\s+/).at(-1) ?? fallback);
    const row = { pid: field("NSpid", procPid), procPid, processGroupId: field("NSpgid", Number(fields[2])),
      parentProcPid: Number(fields[1]), startTicks: fields[19]!, namespace: readlinkSync(`${directory}/ns/pid`),
      command: stat.slice(stat.indexOf("(") + 1, close) };
    if (row.pid <= 1 || row.processGroupId <= 1) return undefined;
    if (!Number.isSafeInteger(row.pid) || !Number.isSafeInteger(row.processGroupId) ||
        !/^\d+$/.test(row.startTicks)) throw new Error("Native process has invalid Linux identity");
    return row;
  } catch (error) { if (absent(error)) return undefined; throw error; }
}
function processTable(): ProcessRow[] {
  const uid = process.geteuid?.(), namespace = readlinkSync("/proc/self/ns/pid");
  if (uid === undefined) throw new Error("Native process tracking requires the service UID");
  const rows: ProcessRow[] = [];
  for (const entry of readdirSync("/proc")) {
    if (!/^\d+$/.test(entry)) continue;
    try {
      if (lstatSync(`/proc/${entry}`).uid !== uid || readlinkSync(`/proc/${entry}/ns/pid`) !== namespace) continue;
      const row = readRow(Number(entry));
      if (row) {
        try {
          const environment = readFileSync(`/proc/${row.procPid}/environ`, "utf8").split("\0");
          const assignment = environment.find(value => value.startsWith(NATIVE_PROCESS_SCOPE_ENV + "="));
          row.scopeId = assignment?.slice(NATIVE_PROCESS_SCOPE_ENV.length + 1);
          row.support = environment.includes(`${NATIVE_PROCESS_SUPPORT_ENV}=1`);
        } catch (error) { if (!absent(error) && !["EACCES", "EPERM"].includes((error as NodeJS.ErrnoException).code ?? "")) throw error; }
        rows.push(row);
      }
    } catch (error) {
      // Foreign/uninspectable rows establish no ownership. Known owned PIDs
      // are separately checked strictly before completion and every signal.
      if (!absent(error) && !["EACCES", "EPERM"].includes((error as NodeJS.ErrnoException).code ?? "")) throw error;
    }
  }
  return rows;
}
function same(record: NativeProcessRecord, row: ProcessRow | undefined): boolean {
  return !!row && row.pid === record.pid && row.procPid === record.procPid &&
    row.startTicks === record.startTicks && row.namespace === record.namespace;
}
function privateJson(file: string): any {
  const stat = lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || (stat.mode & 0o077)) {
    throw new Error("Native process inventory must be a private regular file");
  }
  return JSON.parse(readFileSync(file, "utf8"));
}

function registeredHandoff(owner: Pick<NativeProcessOwner, "projectPath" | "projectId" | "agentId">,
  bootId: string, namespace: string, row: ProcessRow, rows: ProcessRow[]): string | undefined {
  const directory = path.join(owner.projectPath, "runtime", "native-background-jobs");
  let files: string[];
  try { files = readdirSync(directory); } catch (error) { if (absent(error)) return undefined; throw error; }
  for (const file of files) {
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,95}\.json$/.test(file)) continue;
    const job = privateJson(path.join(directory, file));
    if (job.projectId !== owner.projectId || job.agentId !== owner.agentId || job.bootId !== bootId ||
        job.namespace !== namespace || job.state === "exited" || job.processGroupId !== row.processGroupId) continue;
    const leader = rows.find(candidate => candidate.pid === job.pid);
    if (leader && leader.startTicks === job.startTicks && leader.processGroupId === row.processGroupId) return job.jobId;
  }
  return undefined;
}

function appendObservations(file: string, records: NativeProcessRecord[]): number {
  const lines = records.map(record => JSON.stringify(record) + "\n").join("");
  const log = openSync(file + "l", constants.O_WRONLY | constants.O_APPEND | constants.O_CREAT | constants.O_NOFOLLOW, 0o600);
  try { writeFileSync(log, lines, "utf8"); } finally { closeSync(log); }
  return Buffer.byteLength(lines);
}
function publishInventory(file: string, inventory: Inventory): void {
  const temporary = file + `.${randomUUID()}.tmp`;
  writeFileSync(temporary, JSON.stringify(inventory) + "\n", { mode: 0o600, flag: "wx" });
  try { renameSync(temporary, file); }
  catch (error) {
    try { unlinkSync(temporary); }
    catch (cleanupError) { if (!absent(cleanupError)) throw new AggregateError([error, cleanupError], "Native process inventory publication and temporary cleanup failed"); }
    throw error;
  }
}

/** One shared observation pass; ordinary output never schedules a scan/write. */
function startObserving(): void {
  if (timer) return;
  timer = setInterval(() => {
    let rows: ProcessRow[];
    try { rows = processTable(); }
    catch (error) { for (const scope of scopes) scope.observationFailed(error); return; }
    for (const scope of scopes) {
      try { scope.observe(rows); } catch (error) { scope.observationFailed(error); }
    }
  }, 1000);
  timer.unref();
}

export class NativeProcessScope {
  readonly scopeId: string;
  readonly #owner: NativeProcessOwner;
  readonly #file: string;
  readonly #bootId = readFileSync("/proc/sys/kernel/random/boot_id", "utf8").trim();
  readonly #namespace = readlinkSync("/proc/self/ns/pid");
  readonly #records = new Map<string, NativeProcessRecord>();
  readonly #support = new Set<string>();
  readonly #root: ProcessRow;
  #delivery?: Promise<void>;
  #writtenBytes = 0;
  #deliveredBytes = 0;
  #failure?: Error;
  #observationFailure?: Error;
  #closed = false;

  constructor(child: ChildProcessWithoutNullStreams, runtimePath: string, owner: NativeProcessOwner, scopeId: string,
    captured?: ProcessRow) {
    if (!owner.projectId || !owner.agentId || !(owner.invocationId || owner.executionId) || typeof owner.onChanges !== "function" ||
        !path.isAbsolute(owner.projectPath) || !path.isAbsolute(runtimePath)) {
      throw new Error("Native process tracking requires project, Agent, task authority, audit callback and absolute runtime paths");
    }
    this.scopeId = scopeId; this.#owner = owner;
    const rows = processTable();
    const root = captured ?? rows.find(row => row.pid === child.pid);
    if (!root) throw new Error("Cannot record the launched native process identity");
    this.#root = root;
    mkdirSync(runtimePath, { recursive: true, mode: 0o700 });
    this.#file = path.join(runtimePath, `native-processes-${scopeId}.json`);
    if (!rows.some(row => row.procPid === root.procPid && row.startTicks === root.startTicks)) {
      const record = this.record(root);
      this.#records.set(`${root.procPid}:${root.startTicks}`, record);
      this.persist([{ ...record }]);
    }
    this.observe(rows);
    children.set(child, this); roots.set(root.pid, this); scopes.add(this); startObserving();
  }

  fail(error: unknown): void {
    this.#failure ??= error instanceof Error ? error : new Error("Native process audit failed", { cause: error });
  }

  observationFailed(error: unknown): void {
    if (this.#failure) return;
    const failure = error instanceof Error ? error : new Error("Native process observation failed", { cause: error });
    if (this.#observationFailure?.message !== failure.message) {
      console.warn("Native process observation unavailable", { scopeId: this.scopeId, projectId: this.#owner.projectId,
        agentId: this.#owner.agentId, invocationId: this.#owner.invocationId, executionId: this.#owner.executionId,
        error: failure.message });
    }
    this.#observationFailure = failure;
  }

  private record(row: ProcessRow): NativeProcessRecord {
    const { scopeId: _launchScope, support: _support, ...identity } = row;
    return { ...identity, scopeId: this.scopeId, projectId: this.#owner.projectId, agentId: this.#owner.agentId,
      ...(this.#owner.invocationId ? { invocationId: this.#owner.invocationId } : {}),
      ...(this.#owner.executionId ? { executionId: this.#owner.executionId } : {}),
      bootId: this.#bootId, root: row.procPid === this.#root.procPid && row.startTicks === this.#root.startTicks,
      state: "running", firstObservedAt: new Date().toISOString() };
  }

  observe(rows: ProcessRow[]): void {
    if (this.#closed) return;
    // Every discovery path must respect this concrete launch, including
    // ancestry discovery when a child has its own Agent launch assignment.
    const launchRows = rows.filter(row => row.namespace === this.#root.namespace &&
      BigInt(row.startTicks) >= BigInt(this.#root.startTicks) && (!row.scopeId || row.scopeId === this.scopeId));
    const owned = new Set<number>();
    const currentRoot = launchRows.find(row => row.procPid === this.#root.procPid);
    if (currentRoot?.pid === this.#root.pid && currentRoot.startTicks === this.#root.startTicks &&
        currentRoot.namespace === this.#root.namespace) owned.add(this.#root.procPid);
    for (const record of this.#records.values()) {
      if (record.state === "running" && same(record, launchRows.find(row => row.procPid === record.procPid))) owned.add(record.procPid);
    }
    // An inherited opaque launch identity retains ownership after a shell's
    // parent exits or it creates another process group/session.
    for (const row of launchRows) if (row.scopeId === this.scopeId) owned.add(row.procPid);
    let changed = true;
    while (changed) {
      changed = false;
      for (const row of launchRows) if (!owned.has(row.procPid) && owned.has(row.parentProcPid)) { owned.add(row.procPid); changed = true; }
    }
    // MCPs and their helpers are managed by the Harness lifecycle. They are
    // still tracked and stopped with it, but are not unfinished Agent work.
    const support = new Set(launchRows.filter(row => owned.has(row.procPid) &&
      (row.support || this.#support.has(`${row.procPid}:${row.startTicks}`))).map(row => row.procPid));
    changed = true;
    while (changed) {
      changed = false;
      for (const row of launchRows) if (owned.has(row.procPid) && !support.has(row.procPid) && support.has(row.parentProcPid)) {
        support.add(row.procPid); changed = true;
      }
    }
    // Read all identities and handoffs before changing records. An unavailable
    // row must not leave an unaudited partial transition in the next pass.
    const current = new Map<number, ProcessRow | undefined>();
    for (const record of this.#records.values()) if (record.state === "running") {
      current.set(record.procPid, readRow(record.procPid));
    }
    const handoffs = new Map<number, string>();
    for (const row of launchRows) {
      if (!owned.has(row.procPid)) continue;
      const record = this.#records.get(`${row.procPid}:${row.startTicks}`);
      // A registered background job has its own supervisor and no longer
      // participates in this Agent launch's completion or stop proof.
      if (record?.state === "handed_off") continue;
      if (!current.has(row.procPid)) current.set(row.procPid, readRow(row.procPid));
      if (record ? !record.root && record.state === "running" : row.procPid !== this.#root.procPid) {
        const jobId = registeredHandoff(this.#owner, this.#bootId, this.#namespace, row, rows);
        if (jobId) handoffs.set(row.procPid, jobId);
      }
    }
    const changes: NativeProcessRecord[] = [];
    for (const row of launchRows) {
      if (!owned.has(row.procPid)) continue;
      const key = `${row.procPid}:${row.startTicks}`;
      if (support.has(row.procPid)) this.#support.add(key);
      let record = this.#records.get(key);
      if (!record) {
        record = this.record(row);
        this.#records.set(key, record); changes.push({ ...record });
      }
      if (!record.root && record.state === "running") {
        const jobId = handoffs.get(row.procPid);
        if (jobId) { record.state = "handed_off"; record.jobId = jobId; changes.push({ ...record }); }
      }
    }
    for (const record of this.#records.values()) {
      if (record.state !== "running") continue;
      if (!same(record, current.get(record.procPid))) {
        record.state = "exited"; record.exitObservedAt = new Date().toISOString(); changes.push({ ...record });
      }
    }
    if (changes.length) {
      this.persist(changes);
      for (const [key, record] of this.#records) if (record.state === "exited") {
        this.#records.delete(key); this.#support.delete(key);
      }
    }
    if (this.#observationFailure) {
      console.info("Native process observation recovered", { scopeId: this.scopeId, projectId: this.#owner.projectId,
        agentId: this.#owner.agentId, previousError: this.#observationFailure.message });
      this.#observationFailure = undefined;
    }
  }

  private persist(changes: NativeProcessRecord[]): void {
    const { onChanges, ...owner } = this.#owner;
    const inventory: Inventory = { version: 1, scopeId: this.scopeId, owner, bootId: this.#bootId,
      namespace: this.#namespace, rootPid: this.#root.pid, rootStartTicks: this.#root.startTicks,
      records: [...this.#records.values()].filter(record => record.state !== "exited") };
    try {
      this.#writtenBytes += appendObservations(this.#file, changes);
      publishInventory(this.#file, inventory);
      this.deliver();
    } catch (error) { this.fail(error); throw error; }
  }

  private deliver(): void {
    if (this.#delivery || this.#failure) return;
    // The retained log is the queue. A slow SQLite writer can hold at most
    // one bounded delivery batch in memory, without dropping observations.
    this.#delivery = (async () => {
      while (this.#deliveredBytes < this.#writtenBytes) {
        const buffer = Buffer.alloc(Math.min(256 * 1024, this.#writtenBytes - this.#deliveredBytes));
        const fd = openSync(this.#file + "l", constants.O_RDONLY | constants.O_NOFOLLOW);
        let count: number;
        try { count = readSync(fd, buffer, 0, buffer.length, this.#deliveredBytes); } finally { closeSync(fd); }
        const records: NativeProcessRecord[] = [];
        let used = 0;
        for (let offset = 0; offset < count && records.length < 128; offset++) if (buffer[offset] === 10) {
          records.push(JSON.parse(buffer.subarray(used, offset).toString("utf8")) as NativeProcessRecord);
          used = offset + 1;
        }
        if (!used) throw new Error("Native process audit record exceeds the delivery limit");
        await this.#owner.onChanges(records);
        this.#deliveredBytes += used;
      }
    })().catch(error => { this.fail(error); }).finally(() => {
      this.#delivery = undefined;
      if (!this.#failure && this.#deliveredBytes < this.#writtenBytes) this.deliver();
    });
  }

  private scan(): void {
    try { this.observe(processTable()); }
    catch (error) { this.observationFailed(error); throw error; }
  }

  refresh(): void { if (this.#failure) throw this.#failure; this.scan(); }

  pending(): NativeProcessRecord[] {
    this.refresh();
    return [...this.#records.entries()].filter(([key, record]) => !record.root && record.state === "running" &&
      !this.#support.has(key) && record.processGroupId !== this.#root.processGroupId).map(([, record]) => ({ ...record }));
  }

  signal(signal: NodeJS.Signals): void {
    // Capture descendants while the native parent is still alive, before the
    // caller signals its group. PID reuse never authorizes a replacement.
    let failure: unknown;
    try { this.scan(); } catch (error) { failure = error; }
    for (const record of [...this.#records.values()].reverse()) {
      if (record.root || record.state !== "running") continue;
      try {
        if (same(record, readRow(record.procPid))) process.kill(record.pid, signal);
      } catch (error) { if (!absent(error)) failure ??= error; }
    }
    if (failure) throw failure;
  }

  live(): boolean {
    this.scan();
    return [...this.#records.values()].some(record => record.state === "running");
  }

  async flushAudit(): Promise<void> {
    this.refresh();
    await this.#delivery;
    if (this.#failure) throw this.#failure;
    if (this.#observationFailure) this.refresh();
  }

  async finish(): Promise<void> {
    try {
      this.refresh();
      await this.flushAudit();
      if (this.live()) throw new Error("Native process inventory still contains live untransferred processes");
    } finally {
      try {
        if (![...this.#records.values()].some(record => record.state === "running" && same(record, readRow(record.procPid)))) {
          this.#closed = true; scopes.delete(this);
          if (roots.get(this.#root.pid) === this) roots.delete(this.#root.pid);
          if (!scopes.size && timer) { clearInterval(timer); timer = undefined; }
        }
      } catch (error) { this.observationFailed(error); }
    }
  }
}

export function nativeProcessScope(child: ChildProcessWithoutNullStreams): NativeProcessScope | undefined { return children.get(child); }
export function pendingNativeProcesses(pid: number): NativeProcessRecord[] { return roots.get(pid)?.pending() ?? []; }
export function newNativeProcessScope(): string { return randomUUID(); }

export function stopNativeProcessScope(scopeId: string): void {
  for (const row of processTable().filter(row => row.scopeId === scopeId).reverse()) {
    const current = readRow(row.procPid);
    if (!current || current.pid !== row.pid || current.startTicks !== row.startTicks || current.namespace !== row.namespace) continue;
    try { process.kill(row.pid, "SIGKILL"); } catch (error) { if (!absent(error)) throw error; }
  }
}

/** Restart reconciliation uses the retained birth identity, never a PID alone. */
export async function recoverNativeProcesses(runtimePath: string,
  expected?: Partial<Pick<NativeProcessOwner, "projectId" | "invocationId" | "executionId">>): Promise<void> {
  if (process.platform !== "linux") return;
  let files: string[];
  try { files = readdirSync(runtimePath); } catch (error) { if (absent(error)) return; throw error; }
  for (const file of files.filter(name => /^native-processes-[0-9a-f-]{36}\.json$/.test(name))) {
    const target = path.join(runtimePath, file), inventory = privateJson(target) as Inventory;
    if (inventory.version !== 1 || !Array.isArray(inventory.records) || !inventory.owner?.projectId || !inventory.owner.agentId ||
        !(inventory.owner.invocationId || inventory.owner.executionId) || !inventory.bootId || !inventory.namespace ||
        !Number.isSafeInteger(inventory.rootPid) || inventory.rootPid <= 1 || !/^\d+$/.test(inventory.rootStartTicks) ||
        !path.isAbsolute(inventory.owner.projectPath) || file !== `native-processes-${inventory.scopeId}.json`) throw new Error("Invalid retained native process inventory");
    if (expected && Object.entries(expected).some(([key, value]) => inventory.owner[key as keyof typeof inventory.owner] !== value)) {
      throw new Error("Retained native process inventory belongs to another task authority");
    }
    if (inventory.bootId !== readFileSync("/proc/sys/kernel/random/boot_id", "utf8").trim()) continue;
    if (inventory.namespace !== readlinkSync("/proc/self/ns/pid")) throw new Error("Retained native process inventory belongs to another PID namespace");
    for (const record of inventory.records) if (record.scopeId !== inventory.scopeId || record.projectId !== inventory.owner.projectId ||
      record.agentId !== inventory.owner.agentId || record.bootId !== inventory.bootId || record.namespace !== inventory.namespace ||
      !Number.isSafeInteger(record.pid) || record.pid <= 1 || !Number.isSafeInteger(record.procPid) || record.procPid <= 1 ||
      typeof record.root !== "boolean" || !["running", "exited", "handed_off"].includes(record.state) ||
      !/^\d+$/.test(record.startTicks)) throw new Error("Retained native process has invalid ownership or birth identity");
    const rows = processTable();
    const changes: NativeProcessRecord[] = [];
    // A process can detach and its parent can exit between observation ticks.
    for (const row of rows.filter(row => row.scopeId === inventory.scopeId &&
      BigInt(row.startTicks) >= BigInt(inventory.rootStartTicks))) {
      if (inventory.records.some(record => same(record, row))) continue;
      const { scopeId: _scope, support: _support, ...identity } = row;
      const record: NativeProcessRecord = { ...identity, scopeId: inventory.scopeId, projectId: inventory.owner.projectId,
        agentId: inventory.owner.agentId, ...(inventory.owner.invocationId ? { invocationId: inventory.owner.invocationId } : {}),
        ...(inventory.owner.executionId ? { executionId: inventory.owner.executionId } : {}),
        bootId: inventory.bootId, root: row.pid === inventory.rootPid && row.startTicks === inventory.rootStartTicks,
        state: "running", firstObservedAt: new Date().toISOString() };
      inventory.records.push(record); changes.push({ ...record });
    }
    for (const record of inventory.records) if (!record.root && record.state === "running") {
      const row = rows.find(row => same(record, row));
      const jobId = row && registeredHandoff(inventory.owner, inventory.bootId, inventory.namespace, row, rows);
      if (jobId) { record.state = "handed_off"; record.jobId = jobId; changes.push({ ...record }); }
    }
    const records = inventory.records.filter(record => record.state === "running");
    for (const record of records) if (same(record, readRow(record.procPid))) {
      try { process.kill(record.pid, "SIGTERM"); } catch (error) { if (!absent(error)) throw error; }
    }
    for (let attempt = 0; attempt < 30; attempt++) {
      const remaining = records.filter(record => same(record, readRow(record.procPid)));
      if (!remaining.length) break;
      if (attempt >= 10) for (const record of remaining) {
        if (same(record, readRow(record.procPid))) try { process.kill(record.pid, "SIGKILL"); } catch (error) { if (!absent(error)) throw error; }
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    if (records.some(record => same(record, readRow(record.procPid)))) throw new Error("Retained native process did not exit during restart reconciliation");
    for (const record of records) {
      record.state = "exited"; record.exitObservedAt = new Date().toISOString(); changes.push({ ...record });
    }
    if (changes.length) {
      appendObservations(target, changes);
      inventory.records = inventory.records.filter(record => record.state !== "exited");
      publishInventory(target, inventory);
    }
  }
}
