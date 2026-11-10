import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  closeSync,
  constants as fsConstants,
  fstatSync,
  fsyncSync,
  mkdirSync,
  openSync,
  promises as fs,
  readFileSync,
  readlinkSync,
  readdirSync,
  renameSync,
  unlinkSync,
  writeFileSync
} from "node:fs";
import path from "node:path";
import { syncDirectory, syncDirectorySync } from "./directory-sync.js";
import { acknowledgeWindowsResident, cleanupWindowsResident, controlWindowsResident,
  prepareWindowsResidentLaunch, registeredWindowsResident } from "./windows-resident.js";
import type {
  InvocationRecoveryBudget,
  LaunchPlan,
  ProcessExit,
  SessionRef
} from "./contracts.js";
import { HarnessRuntimeError } from "./errors.js";
import { harnessSupportsNativeProfile } from "./registry.js";
import { NATIVE_PROCESS_SCOPE_ENV, NativeProcessScope, nativeProcessScope, newNativeProcessScope,
  recoverNativeProcesses, stopNativeProcessScope, type NativeProcessOwner } from "./native-processes.js";
import {
  PUBLISHED_ARTIFACT_MANIFEST_ENV,
  PUBLISHED_ARTIFACT_MANIFEST_FILENAME
} from "../published-artifact-access.js";

export const DEFAULT_RAW_LOG_LIMIT_BYTES = 4 * 1024 * 1024;
/** Absolute common-host ceiling; Codex's retained compatibility log uses it. */
export const MAX_RAW_LOG_LIMIT_BYTES = 64 * 1024 * 1024;

const SAFE_HOST_ENV = new Set([
  "PATH", "LANG", "LC_ALL", "LC_CTYPE", "TERM", "TMPDIR", "TMP", "TEMP",
  "SSL_CERT_FILE", "SSL_CERT_DIR", "NODE_EXTRA_CA_CERTS", "HTTP_PROXY", "HTTPS_PROXY",
  "ALL_PROXY", "NO_PROXY", "http_proxy", "https_proxy", "all_proxy", "no_proxy",
  "BASH_ENV", "SHLVL",
  "SystemRoot", "WINDIR", "COMSPEC", "PATHEXT", "USERPROFILE", "LOCALAPPDATA", "APPDATA"
]);

function hostEnvironmentValue(
  environment: Readonly<NodeJS.ProcessEnv>,
  key: string
): string | undefined {
  const exact = environment[key];
  if (exact !== undefined || process.platform !== "win32") return exact;
  const windowsKey = Object.keys(environment).find(
    (candidate) => candidate.toLowerCase() === key.toLowerCase()
  );
  return windowsKey === undefined ? undefined : environment[windowsKey];
}

const SENSITIVE_ENV_NAME = /(?:API[_-]?KEY|ACCESS[_-]?KEY|AUTH|BEARER|CREDENTIAL|PASSWORD|SECRET|TOKEN|COOKIE)/i;

function sensitiveEnvironmentValue(key: string): boolean {
  return SENSITIVE_ENV_NAME.test(key);
}

const PROVIDER_CREDENTIALS = [
  "OPENAI_API_KEY", "OPENAI_BASE_URL", "OPENAI_ORG_ID", "OPENAI_PROJECT_ID",
  "ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_BASE_URL",
  "AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT", "DEEPSEEK_API_KEY",
  "SII_API_KEY", "AIGW_API_KEY", "AIGW_BASE_URL", "SCIENCEEVOLVE_GATEWAY_API_KEY",
  "SCIENCEEVOLVE_GATEWAY_ID"
] as const;

const PROTECTED_OPENFARS_KEYS = new Set([
  NATIVE_PROCESS_SCOPE_ENV,
  "SCIENCEEVOLVE_PROJECT_ID", "SCIENCEEVOLVE_INVOCATION_ID", "SCIENCEEVOLVE_AGENT_NAME",
  "SCIENCEEVOLVE_AGENT_KIND", "SCIENCEEVOLVE_AGENT_PERMISSION", "SCIENCEEVOLVE_AGENT_HARNESS",
  "SCIENCEEVOLVE_AGENT_PROTOCOL", "SCIENCEEVOLVE_PROJECT_ROOT", "SCIENCEEVOLVE_ROLE_WORKSPACE",
  "SCIENCEEVOLVE_APPEND_ROOT", "SCIENCEEVOLVE_CONTROL_CONTEXT", "SCIENCEEVOLVE_CONTROL_CAPABILITY",
  "SCIENCEEVOLVE_EXECUTION_ID", "SCIENCEEVOLVE_OWNERSHIP_EPOCH",
  "SCIENCEEVOLVE_RESIDENT_SCOPE_ID", "SCIENCEEVOLVE_RESIDENT_ROLE",
  "SCIENCEEVOLVE_COORDINATOR_EPOCH",
  PUBLISHED_ARTIFACT_MANIFEST_ENV
]);

const COMMON_INVOCATION_ENV = new Set([
  ...SAFE_HOST_ENV,
  "HOME", "CODEX_HOME",
  ...PROTECTED_OPENFARS_KEYS,
  "SCIENCEEVOLVE_GATEWAY_API_KEY", "SCIENCEEVOLVE_GATEWAY_ID", "SCIENCEEVOLVE_FIXED_MCP_TOKEN",
  "SCIENCEEVOLVE_INSPIRE_WORKSPACE_ROOT", "SCIENCEEVOLVE_INSPIRE_WORKLOAD_LEDGER",
  "NATURE_FIGURE_CONFIG", "MPLBACKEND", "INSPIRE_GLOBAL_CONFIG_PATH",
  "OPENAI_API_KEY", "OPENAI_BASE_URL",
  "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_BASE_URL"
]);

const COMPUTE_ONLY_ENV = new Set([
  "SCIENCEEVOLVE_INSPIRE_WORKSPACE_ROOT",
  "SCIENCEEVOLVE_INSPIRE_WORKLOAD_LEDGER",
  "NATURE_FIGURE_CONFIG",
  "MPLBACKEND",
  "INSPIRE_GLOBAL_CONFIG_PATH"
]);

const SPECIAL_BOUND_ENV = new Set(["HOME", "CODEX_HOME", "NATURE_FIGURE_CONFIG", "MPLBACKEND"]);
const MARKER_LIMIT_BYTES = 16 * 1024;
const NO_FOLLOW = typeof fsConstants.O_NOFOLLOW === "number" ? fsConstants.O_NOFOLLOW : 0;
const NON_BLOCK = typeof fsConstants.O_NONBLOCK === "number" ? fsConstants.O_NONBLOCK : 0;
const PROCESS_TREE_IDENTITIES = new WeakMap<ChildProcessWithoutNullStreams, LinuxProcessTreeIdentity>();

// Resident startup uses a trusted process-group supervisor.  The supervisor
// durably records its own detached Linux identity before it is permitted to
// spawn the native CLI, closing the otherwise unobservable fork/exec window
// between a service crash and the resident marker write.
const RESIDENT_SUPERVISOR_SOURCE = String.raw`
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const configFile=process.argv[1];
const readJson=(file)=>JSON.parse(fs.readFileSync(file,'utf8'));
const syncDirectory=(file)=>{const fd=fs.openSync(path.dirname(file),fs.constants.O_RDONLY|fs.constants.O_DIRECTORY);try{fs.fsyncSync(fd)}finally{fs.closeSync(fd)}};
const fenceExists=(file)=>{try{fs.accessSync(file,fs.constants.F_OK);return true}catch(error){if(error&&error.code==='ENOENT')return false;throw error}};
const stat=fs.readFileSync('/proc/self/stat','utf8');
const status=fs.readFileSync('/proc/self/status','utf8');
const tail=stat.slice(stat.lastIndexOf(')')+2).trim().split(/\s+/);
const field=(name)=>{const match=status.match(new RegExp('^'+name+':\\s+(.+)$','m'));if(!match)return undefined;const value=Number.parseInt(match[1].trim().split(/\s+/).at(-1),10);return Number.isSafeInteger(value)&&value>0?value:undefined};
const procPid=Number.parseInt(stat.split(' ',1)[0],10);
const pid=field('NSpid')||procPid;
const observedProcessGroupId=field('NSpgid')||Number.parseInt(tail[2]||'',10);
const observedSessionId=field('NSsid')||Number.parseInt(tail[3]||'',10);
const procProcessGroupId=Number.parseInt(tail[2]||'',10);
const procSessionId=Number.parseInt(tail[3]||'',10);
const startTicks=tail[19];
const config=readJson(configFile);
const claim=readJson(config.claimFile);
if(config.protocol!=='trusted-supervisor-v1'||claim.protocol!==config.protocol||claim.status!=='launching'||JSON.stringify(claim.identity)!==JSON.stringify(config.identity))process.exit(72);
if(fenceExists(config.fenceFile))process.exit(73);
if(!Number.isSafeInteger(procPid)||procPid<=1||!Number.isSafeInteger(pid)||pid<=1||observedProcessGroupId!==pid||observedSessionId!==pid||procProcessGroupId!==procPid||procSessionId!==procPid||!startTicks||!/^[0-9]+$/.test(startTicks))process.exit(74);
const processIdentity={pid,procPid,processGroupId:pid,observedProcessGroupId,procProcessGroupId,procSessionId,pidNamespace:fs.readlinkSync('/proc/self/ns/pid'),bootId:fs.readFileSync('/proc/sys/kernel/random/boot_id','utf8').trim(),startTicks};
const next={...claim,status:'spawned',process:processIdentity};
const temporary=config.claimFile+'.'+process.pid+'.'+crypto.randomUUID()+'.tmp';
const descriptor=fs.openSync(temporary,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);
try{fs.writeFileSync(descriptor,JSON.stringify(next)+'\n','utf8');fs.fsyncSync(descriptor)}finally{fs.closeSync(descriptor)}
fs.renameSync(temporary,config.claimFile);syncDirectory(config.claimFile);
if(fenceExists(config.fenceFile))process.exit(75);
try{fs.unlinkSync(configFile);syncDirectory(configFile)}catch(error){if(!error||error.code!=='ENOENT')throw error}
const child=spawn(config.command,config.args,{cwd:config.cwd,env:process.env,stdio:['pipe','pipe','pipe'],detached:false,windowsHide:true});
// Namespace-local PIDs can collide. Ignore foreign or unreadable process
// rows before comparing the native child's PID and inherited group identity.
const observeNativeGroup=()=>{for(const entry of fs.readdirSync('/proc')){if(!/^\d+$/.test(entry))continue;try{if(fs.readlinkSync('/proc/'+entry+'/ns/pid')!==processIdentity.pidNamespace)continue;const candidateStatus=fs.readFileSync('/proc/'+entry+'/status','utf8');const nspid=candidateStatus.match(/^NSpid:\s+(.+)$/m)?.[1]?.trim().split(/\s+/).map(Number);if(nspid?.at(-1)!==child.pid)continue;const candidateStat=fs.readFileSync('/proc/'+entry+'/stat','utf8');const candidateTail=candidateStat.slice(candidateStat.lastIndexOf(')')+2).trim().split(/\s+/);const candidateGroup=Number.parseInt(candidateTail[2]||'',10);const candidateSession=Number.parseInt(candidateTail[3]||'',10);const candidateNsGroup=Number.parseInt(candidateStatus.match(/^NSpgid:\s+(.+)$/m)?.[1]?.trim().split(/\s+/).at(-1)||'',10);const candidateNsSession=Number.parseInt(candidateStatus.match(/^NSsid:\s+(.+)$/m)?.[1]?.trim().split(/\s+/).at(-1)||'',10);return candidateGroup===procPid&&candidateSession===procPid&&candidateNsGroup===pid&&candidateNsSession===pid}catch(error){if(!error||!['ENOENT','ESRCH','EACCES','EPERM'].includes(error.code))throw error}}return undefined};
let nativeGroupObserved;const nativeDeadline=Date.now()+2000;while(nativeGroupObserved===undefined&&Date.now()<nativeDeadline){nativeGroupObserved=observeNativeGroup();if(nativeGroupObserved===undefined)Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,2)}
if(nativeGroupObserved!==true){try{process.kill(-pid,'SIGKILL')}catch{process.exit(76)}}
process.stdin.pipe(child.stdin);child.stdout.pipe(process.stdout);child.stderr.pipe(process.stderr);
const keeper=setInterval(()=>{},2147483647);
let finishing=false;
const groupHasOtherMembers=()=>{try{for(const entry of fs.readdirSync('/proc')){if(!/^[0-9]+$/.test(entry))continue;try{const candidate=fs.readFileSync('/proc/'+entry+'/stat','utf8');const close=candidate.lastIndexOf(')');const fields=candidate.slice(close+2).trim().split(/\s+/);const candidateProcPid=Number.parseInt(candidate.split(' ',1)[0],10);const candidateGroup=Number.parseInt(fields[2]||'',10);if(fields[0]!=='Z'&&candidateProcPid!==procPid&&candidateGroup===procPid)return true}catch(error){if(!error||!['ENOENT','ESRCH'].includes(error.code))return true}}return false}catch{return true}};
const finish=(code,signal)=>{if(finishing)return;finishing=true;process.stdin.unpipe(child.stdin);process.stdin.pause();clearInterval(keeper);/* CommonProcessHost confirms and closes the retained owned group after the supervisor exits; preserve the native exit status. */if(signal){try{process.kill(process.pid,signal)}catch{process.exit(1)}}else{setImmediate(()=>process.exit(code))}};
child.once('error',(error)=>{process.stderr.write(String(error&&error.stack||error),()=>finish(1,null))});
child.once('close',(code,signal)=>finish(code===null?1:code,signal));
`;

export interface InvocationEnvironmentOptions {
  common: NodeJS.ProcessEnv;
  adapter?: NodeJS.ProcessEnv;
  route?: NodeJS.ProcessEnv;
  /** Facade-captured host values; defaults to the current service environment. */
  hostEnvironment?: Readonly<NodeJS.ProcessEnv>;
}

/** Build a minimal environment and prevent an Adapter from replacing authority values. */
export function buildInvocationEnvironment(options: InvocationEnvironmentOptions): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = {};
  const hostEnvironment = options.hostEnvironment ?? process.env;
  for (const key of SAFE_HOST_ENV) {
    const value = hostEnvironmentValue(hostEnvironment, key);
    if (value !== undefined) environment[key] = value;
  }
  for (const key of PROVIDER_CREDENTIALS) delete environment[key];
  Object.assign(environment, options.common);
  for (const [key, value] of Object.entries(options.adapter ?? {})) {
    if (PROTECTED_OPENFARS_KEYS.has(key) && environment[key] !== value) {
      throw new Error(`Harness Adapter cannot override protected environment key ${key}`);
    }
    if ((PROVIDER_CREDENTIALS as readonly string[]).includes(key)) {
      throw new Error(`Harness Adapter cannot inject provider credential ${key}`);
    }
    environment[key] = value;
  }
  Object.assign(environment, options.route ?? {});
  return environment;
}

export interface ProcessHostCallbacks {
  onStdout?: (chunk: string) => Promise<void> | void;
  onStderr?: (chunk: string) => Promise<void> | void;
  onSpawn?: (child: ChildProcessWithoutNullStreams) => Promise<void> | void;
}

export interface ManagedProcess {
  child: ChildProcessWithoutNullStreams;
  write(value: string): Promise<void>;
  end(value?: string): Promise<void>;
  completed: Promise<ProcessExit>;
  terminate(): void;
  waitForQuiescence(): Promise<void>;
}

export interface RawManagedProcess {
  child: ChildProcessWithoutNullStreams;
  completed: Promise<ProcessExit>;
  terminate(): void;
  forceTerminate(): void;
  waitForQuiescence(): Promise<void>;
}

export interface RawProcessOptions {
  rejectOnAbort?: boolean;
  termination?: {
    initialSignal?: NodeJS.Signals;
    terminateAfterMs?: number;
    killAfterMs?: number;
  };
}

/** Pinned server-side helper launch; never exposed through an Adapter capability. */
export function spawnTrustedUtility(
  command: string,
  args: readonly string[],
  environment: NodeJS.ProcessEnv
): ChildProcessWithoutNullStreams {
  return spawn(command, [...args], {
    env: environment,
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true
  });
}

export interface InvocationProcessBinding {
  nativeProcesses?: NativeProcessOwner;
  invocationId: string;
  harnessId: string;
  runtimePath: string;
  workspacePath: string;
  signal: AbortSignal;
  recoveryBudget: InvocationRecoveryBudget;
  /** Facade-owned current SessionRef; changes only for same-Harness replacement. */
  session: () => SessionRef;
  route?: import("./gateway-route.js").ModelRouteBinding;
  /** Complete Facade-derived common environment; absent only in low-level tests. */
  commonEnvironment?: Readonly<NodeJS.ProcessEnv>;
  authorityEnvironment?: Readonly<Record<string, string>>;
  /** Service-user HOME captured by Facade before Adapter hooks run. */
  hostHome?: string;
  /** Optional compute-only Nature configuration path selected by Facade policy. */
  natureFigureConfigPath?: string;
}

/**
 * Stable process authority for a collaboration lease. It is intentionally
 * distinct from InvocationProcessBinding: one resident process serves many
 * per-turn invocation ids, and none of those ids is valid for its lifetime.
 */
export interface ResidentProcessBinding {
  nativeProcesses?: NativeProcessOwner;
  scopeId: string;
  role: "leader" | "delivery" | "final-integration";
  harnessId: string;
  runtimePath: string;
  workspacePath: string;
  signal: AbortSignal;
  recoveryBudget: InvocationRecoveryBudget;
  session: () => SessionRef;
  route: import("./gateway-route.js").ModelRouteBinding;
  commonEnvironment: Readonly<NodeJS.ProcessEnv>;
  authorityEnvironment: Readonly<Record<string, string>>;
  hostHome?: string;
  natureFigureConfigPath?: string;
}

export type ResidentProcessCleanupIdentity =
  | {
      projectId: string;
      harnessId: string;
      scopeId: string;
      role: "leader";
      coordinatorEpoch: number;
    }
  | {
      projectId: string;
      harnessId: string;
      scopeId: string;
      role: "delivery" | "final-integration";
      executionId: string;
      ownershipEpoch: number;
    };

export interface ResidentProcessCleanupOptions {
  /**
   * A durable trusted-supervisor-v1 launch record proves that a missing claim
   * is the pre-spawn side of the protocol. Legacy callers must fail closed.
   */
  allowMissingClaim?: boolean;
}

/** Narrow launch capability used by resident Adapter composition. */
export interface ResidentProcessLauncher {
  startResident(
    binding: ResidentProcessBinding,
    plan: LaunchPlan,
    callbacks?: ProcessHostCallbacks
  ): Promise<ManagedProcess>;
}

/**
 * Invocation-scoped process capability handed to an Adapter. The signal,
 * process-attempt budget and marker paths are deliberately absent from each
 * method so an Adapter cannot replace or forget the Facade-owned values.
 */
export interface InvocationProcessHost {
  startRaw(plan: LaunchPlan, options?: RawProcessOptions): RawManagedProcess;
  start(plan: LaunchPlan, callbacks: ProcessHostCallbacks): ManagedProcess;
  run(plan: LaunchPlan, callbacks: ProcessHostCallbacks): Promise<ProcessExit>;
}

export class CommonProcessHost {
  readonly #boundInvocations = new WeakMap<
    InvocationProcessHost,
    BoundInvocationProcessHost
  >();

  forInvocation(binding: InvocationProcessBinding): InvocationProcessHost {
    const processHost = new BoundInvocationProcessHost(this, binding);
    this.#boundInvocations.set(processHost, processHost);
    return processHost;
  }

  /**
   * Trusted execution-scoped launch. Unlike InvocationProcessHost this lease
   * is not finalized when one model turn returns; ResidentLeaseManager owns
   * its marker, identity checks and terminal close.
   */
  async startResident(
    binding: ResidentProcessBinding,
    plan: LaunchPlan,
    callbacks: ProcessHostCallbacks = {}
  ): Promise<ManagedProcess> {
    assertResidentLaunchPlan(plan, binding);
    const cleanupIdentity = residentCleanupIdentity(binding);
    if (process.platform === "win32") {
      const launch = await prepareWindowsResidentLaunch(cleanupIdentity, binding.runtimePath, plan);
      let started: ManagedProcess | undefined;
      try {
        binding.recoveryBudget.startAttempt(plan.recoveryEvidence ?? { kind: "resident-open" });
        started = this.start({ ...plan, command: launch.command, args: launch.args, stdin: undefined }, callbacks, binding.signal);
        await acknowledgeWindowsResident(cleanupIdentity, launch.claimFile, started.child);
        return started;
      } catch (error) {
        if (started) {
          started.terminate();
          await started.waitForQuiescence();
          await started.completed.catch(() => undefined);
        }
        await cleanupWindowsResident(cleanupIdentity, binding.runtimePath, false);
        await fs.unlink(launch.configFile).catch((failure: NodeJS.ErrnoException) => {
          if (failure.code !== "ENOENT") throw failure;
        });
        throw error;
      }
    }
    const claim = claimResidentLaunch(cleanupIdentity, binding.runtimePath, plan);
    let started: ManagedProcess | undefined;
    try {
      binding.recoveryBudget.startAttempt(
        plan.recoveryEvidence ?? { kind: "resident-open" }
      );
      started = this.start({
        ...plan,
        command: process.execPath,
        args: ["-e", RESIDENT_SUPERVISOR_SOURCE, claim.configFile],
        stdin: undefined
      }, callbacks, binding.signal, binding.nativeProcesses ? { owner: binding.nativeProcesses, runtimePath: binding.runtimePath } : undefined);
      await waitForResidentSupervisorClaim(claim, started);
      return started;
    } catch (error) {
      if (started) {
        // The trusted supervisor is the process-group leader, so completion
        // confirms that no untracked native child survives when its durable
        // spawn handshake failed.
        started.terminate();
        let quiescenceFailure: unknown;
        try { await started.waitForQuiescence(); } catch (failure) {
          quiescenceFailure = failure;
        }
        await started.completed.catch(() => undefined);
        try {
          const current = readPrivateJsonSync(claim.file) as ResidentLaunchClaim;
          if (current.status === "launching") {
            if (quiescenceFailure) throw quiescenceFailure;
            persistResidentLaunchClaim(claim, "terminated");
            installResidentStopFenceSync(cleanupIdentity, binding.runtimePath);
          } else if (current.status === "spawned") {
            await this.cleanupResidentInterrupted(cleanupIdentity, binding.runtimePath);
          } else if (quiescenceFailure) {
            throw quiescenceFailure;
          }
        } catch (cleanupError) {
          // Retain the claim when quiescence cannot be confirmed.  A later
          // cleanup must fail closed or kill the recorded supervisor group.
          throw new HarnessRuntimeError(
            "HARNESS_PROCESS_EXITED",
            "Resident startup failed and quiescence could not be proven",
            {
              scopeId: cleanupIdentity.scopeId,
              role: cleanupIdentity.role,
              harnessId: cleanupIdentity.harnessId,
              executionId: "executionId" in cleanupIdentity ? cleanupIdentity.executionId : undefined,
              ownershipEpoch: "ownershipEpoch" in cleanupIdentity
                ? cleanupIdentity.ownershipEpoch
                : undefined,
              coordinatorEpoch: "coordinatorEpoch" in cleanupIdentity
                ? cleanupIdentity.coordinatorEpoch
                : undefined,
              stopProof: "unconfirmed",
              cleanupError: cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
            },
            { source: "process", cause: error instanceof Error ? error : undefined }
          );
        }
      } else {
        releaseResidentLaunchClaim(claim);
      }
      throw error;
    }
  }

  /**
   * Facade-only lifecycle boundary. Adapters receive only InvocationProcessHost,
   * so they cannot suppress this final quiescence check themselves.
   */
  async finalizeInvocation(processHost: InvocationProcessHost): Promise<void> {
    const bound = this.#boundInvocations.get(processHost);
    if (!bound) {
      throw new HarnessRuntimeError(
        "HARNESS_CONTRACT_VIOLATION",
        "Invocation ProcessHost does not belong to this common host",
        {},
        { source: "process" }
      );
    }
    await bound.finalize();
  }

  startRaw(
    plan: LaunchPlan,
    signal: AbortSignal,
    options: RawProcessOptions = {},
    inventory?: { owner: NativeProcessOwner; runtimePath: string }
  ): RawManagedProcess {
    assertCommonRawLogLimit(plan.rawLogLimitBytes);
    if (signal.aborted) {
      throw new HarnessRuntimeError("INVOCATION_INTERRUPTED", "Invocation cancelled before process start");
    }
    let child!: ChildProcessWithoutNullStreams;
    const scopeId = inventory && process.platform === "linux" ? newNativeProcessScope() : undefined;
    try {
      child = spawn(plan.command, plan.args, {
        cwd: plan.cwd,
        env: scopeId ? { ...plan.env, [NATIVE_PROCESS_SCOPE_ENV]: scopeId } : plan.env,
        stdio: ["pipe", "pipe", "pipe"],
        detached: process.platform !== "win32",
        windowsHide: true
      });
      rememberProcessTreeIdentity(child);
      if (scopeId && inventory) {
        const captured = PROCESS_TREE_IDENTITIES.get(child);
        new NativeProcessScope(child, inventory.runtimePath, inventory.owner, scopeId, captured ? {
          pid: captured.pid, procPid: captured.procPid, processGroupId: captured.processGroupId,
          namespace: captured.pidNamespace, startTicks: captured.startTicks,
          parentProcPid: Number.parseInt(readFileSync("/proc/self/stat", "utf8").split(" ", 1)[0]!, 10),
          command: path.basename(plan.command)
        } : undefined);
      }
    } catch (error) {
      let cleanupFailure: unknown;
      if (child?.pid) {
        try { if (scopeId) stopNativeProcessScope(scopeId); }
        catch (failure) { cleanupFailure = failure; }
        try { signalProcessTree(child, "SIGKILL"); }
        catch (failure) { cleanupFailure ??= failure; }
      }
      throw new HarnessRuntimeError(
        "HARNESS_PROCESS_EXITED",
        "Unable to start Harness process",
        { command: path.basename(plan.command), ...(cleanupFailure !== undefined ? {
          stopProof: "unconfirmed", cleanupFailure: cleanupFailure instanceof Error ? cleanupFailure.message : String(cleanupFailure)
        } : {}) },
        { source: "process", cause: error instanceof Error ? error : undefined }
      );
    }
    let termination: Promise<void> | undefined;
    const rememberTermination = (task: Promise<void>) => {
      termination = termination
        ? Promise.allSettled([termination, task]).then((results) => {
            const failure = results.find((result) => result.status === "rejected");
            if (failure?.status === "rejected") throw failure.reason;
          })
        : task;
      // The awaited completion owns this error, including when process exit
      // follows the termination request on a later event-loop iteration.
      void termination.catch(() => undefined);
    };
    const terminate = () => rememberTermination(terminateProcessTree(child, options.termination));
    const forceTerminate = () => rememberTermination(terminateProcessTree(child, {
      initialSignal: "SIGKILL",
      killAfterMs: 0
    }));
    signal.addEventListener("abort", terminate, { once: true });
    if (signal.aborted) terminate();
    let exitCleanup: Promise<void> | undefined;
    child.once("exit", () => {
      if (!nativeProcessScope(child)) return;
      exitCleanup = terminateProcessTree(child, { killAfterMs: 250 });
      void exitCleanup.catch(() => undefined);
    });
    const completed = (async (): Promise<ProcessExit> => {
      const exit = await waitForExit(child);
      await settleThenCleanup((async () => { await exitCleanup; await termination; })(),
        () => nativeProcessScope(child)?.finish() ?? Promise.resolve());
      if (signal.aborted && options.rejectOnAbort !== false) {
        throw new HarnessRuntimeError("INVOCATION_INTERRUPTED", "Harness invocation was cancelled");
      }
      if (exit.error) {
        throw new HarnessRuntimeError(
          "HARNESS_PROCESS_EXITED",
          "Unable to start Harness process",
          { command: path.basename(plan.command) },
          { source: "process", cause: exit.error }
        );
      }
      return { code: exit.code, signal: exit.signal, stderr: "", stdout: "", child };
    })().finally(() => signal.removeEventListener("abort", terminate));
    const waitForQuiescence = async () => { await termination; };
    return { child, completed, terminate, forceTerminate, waitForQuiescence };
  }

  start(
    plan: LaunchPlan,
    callbacks: ProcessHostCallbacks,
    signal: AbortSignal,
    inventory?: { owner: NativeProcessOwner; runtimePath: string }
  ): ManagedProcess {
    const raw = this.startRaw(plan, signal, {}, inventory);
    const child = raw.child;
    // Defer invocation so a synchronous bookkeeping failure follows the same
    // cleanup path as a rejected async callback after the process has spawned.
    const spawnCallback = Promise.resolve().then(() => callbacks.onSpawn?.(child));

    const limit = Math.max(1, plan.rawLogLimitBytes || DEFAULT_RAW_LOG_LIMIT_BYTES);
    let stdout = "";
    let stderr = "";
    let callbackTail = Promise.resolve();
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout = boundedUtf8Suffix(stdout + chunk, limit);
      child.stdout.pause();
      callbackTail = callbackTail
        .then(() => callbacks.onStdout?.(chunk))
        .then(() => { if (!child.stdout.destroyed) child.stdout.resume(); });
      void callbackTail.catch(() => raw.terminate());
    });
    child.stderr.on("data", (chunk: string) => {
      stderr = boundedUtf8Suffix(stderr + chunk, limit);
      child.stderr.pause();
      callbackTail = callbackTail
        .then(() => callbacks.onStderr?.(chunk))
        .then(() => { if (!child.stderr.destroyed) child.stderr.resume(); });
      void callbackTail.catch(() => raw.terminate());
    });

    const completed = (async (): Promise<ProcessExit> => {
      try {
        await spawnCallback;
        const exit = await raw.completed;
        await callbackTail;
        return { ...exit, stderr, stdout, child };
      } catch (error) {
        // Callback and marker failures are invocation failures too. Never
        // leave a successfully spawned CLI running after its owner rejected.
        raw.terminate();
        await raw.waitForQuiescence();
        await raw.completed.catch(() => undefined);
        throw error;
      }
    })();
    return {
      child,
      write: (value) => writeStreamWithBackpressure(child.stdin, value),
      end: async (value) => {
        if (value !== undefined) await writeStreamWithBackpressure(child.stdin, value);
        child.stdin.end();
      },
      completed,
      terminate: raw.terminate,
      waitForQuiescence: raw.waitForQuiescence
    };
  }

  async run(
    plan: LaunchPlan,
    callbacks: ProcessHostCallbacks,
    signal: AbortSignal
  ): Promise<ProcessExit> {
    const managed = this.start(plan, callbacks, signal);
    try {
      if (plan.stdin !== undefined) await managed.write(plan.stdin);
      await managed.end();
      return await managed.completed;
    } catch (error) {
      managed.terminate();
      await managed.waitForQuiescence();
      await managed.completed.catch(() => undefined);
      throw error;
    }
  }

  async writeMarker(runtimePath: string, pid: number, invocationId: string): Promise<void> {
    const marker = path.join(runtimePath, "harness-process.json");
    const payload = `${JSON.stringify({
      invocationId,
      pid,
      processGroupId: pid,
      status: "running",
      createdAt: new Date().toISOString()
    })}\n`;
    try {
      await createRegularFileNoFollow(marker, payload);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw markerWriteError(error);
      await removeOwnedRegularMarker(marker, invocationId);
      try {
        await createRegularFileNoFollow(marker, payload);
      } catch (replacementError) {
        throw markerWriteError(replacementError);
      }
    }
  }

  async cleanupMarker(runtimePath: string): Promise<void> {
    await fs.rm(path.join(runtimePath, "harness-process.json"), { force: true });
  }

  async cleanupInterrupted(invocationId: string, runtimePath: string): Promise<void> {
    await recoverNativeProcesses(runtimePath, { invocationId });
    const identities = await findInvocationProcesses(invocationId, runtimePath);
    for (const identity of identities) {
      const target = process.platform === "win32"
        ? identity.pid
        : -identity.processGroupId;
      safeProcessSignal(target, "SIGKILL");
    }
    if (process.platform !== "win32" && identities.length > 0) {
      for (let attempt = 0; attempt < 50; attempt += 1) {
        if ((await findInvocationProcesses(invocationId, runtimePath)).length === 0) break;
        await delay(100);
      }
      if ((await findInvocationProcesses(invocationId, runtimePath)).length > 0) {
        throw new Error(`Unable to terminate stale Harness invocation ${invocationId}`);
      }
    }
    await this.cleanupMarker(runtimePath);
  }

  /**
   * Resident processes intentionally carry no per-turn invocation id. Locate
   * and terminate them by the complete stable authority tuple, then rescan
   * `/proc` to prove that no matching process group survives.
   */
  async cleanupResidentInterrupted(
    identity: ResidentProcessCleanupIdentity,
    runtimePath: string,
    options: ResidentProcessCleanupOptions = {}
  ): Promise<void> {
    if (process.platform === "win32") {
      return cleanupWindowsResident(identity, runtimePath, options.allowMissingClaim === true);
    }
    const claim = await installResidentStopFence(identity, runtimePath);
    if (!claim && !options.allowMissingClaim) {
      throw new Error(
        `Resident ${identity.scopeId} has no trusted launch claim or durable launch protocol proof`
      );
    }
    await recoverNativeProcesses(runtimePath, { projectId: identity.projectId, executionId: identity.scopeId });
    if (claim?.status === "spawned") {
      const processIdentity = claim.process!;
      assertLinuxProcessTreeIdentity(processIdentity);
      for (let attempt = 0; attempt < 50; attempt += 1) {
        if (!claimedLinuxProcessGroupLive(processIdentity)) break;
        safeProcessSignal(-processIdentity.processGroupId, "SIGKILL");
        await delay(100);
      }
      if (claimedLinuxProcessGroupLive(processIdentity)) {
        throw new Error(`Unable to terminate claimed Harness resident ${identity.scopeId}`);
      }
    }
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const identities = await findResidentProcesses(identity, runtimePath, false);
      if (identities.length === 0) return;
      const confirmed = await findResidentProcesses(identity, runtimePath, false);
      for (const processIdentity of identities.filter((candidate) =>
        confirmed.some((current) =>
          current.procPid === candidate.procPid &&
          current.processGroupId === candidate.processGroupId &&
          current.startTicks === candidate.startTicks
        )
      )) {
        safeProcessSignal(-processIdentity.processGroupId, "SIGKILL");
      }
      await delay(100);
    }
    throw new Error(`Unable to terminate stale Harness resident ${identity.scopeId}`);
  }
}

interface ActiveBoundProcess {
  child: ChildProcessWithoutNullStreams;
  completed: Promise<ProcessExit>;
}

class BoundInvocationProcessHost implements InvocationProcessHost {
  #finalized = false;
  #processActive = false;
  #activeProcess: ActiveBoundProcess | undefined;
  readonly #host: CommonProcessHost;
  readonly #binding: InvocationProcessBinding;

  constructor(
    host: CommonProcessHost,
    binding: InvocationProcessBinding
  ) {
    this.#host = host;
    this.#binding = binding;
  }

  startRaw(
    plan: LaunchPlan,
    options: RawProcessOptions = {}
  ): RawManagedProcess {
    this.#claimLaunch(plan);
    let raw: RawManagedProcess;
    try {
      raw = this.#host.startRaw(plan, this.#binding.signal, options, this.#binding.nativeProcesses
        ? { owner: this.#binding.nativeProcesses, runtimePath: this.#binding.runtimePath } : undefined);
    } catch (error) {
      this.#processActive = false;
      throw error;
    }
    const markerReady = (raw.child.pid
      ? this.#host.writeMarker(
          this.#binding.runtimePath,
          raw.child.pid,
          this.#binding.invocationId
        )
      : Promise.reject(new HarnessRuntimeError(
          "HARNESS_PROCESS_EXITED",
          "Harness process did not expose a process identifier",
          { harnessId: this.#binding.harnessId },
          { source: "process" }
        ))
    ).catch(async (error: unknown) => {
      raw.terminate();
      await raw.waitForQuiescence();
      await raw.completed.catch(() => undefined);
      throw error;
    });
    let activeProcess!: ActiveBoundProcess;
    const completed = settleThenCleanup(
      (async () => {
        await markerReady;
        return raw.completed;
      })(),
      () => this.#cleanupAndRelease(activeProcess)
    );
    activeProcess = { child: raw.child, completed };
    this.#activeProcess = activeProcess;
    return {
      child: raw.child,
      completed,
      terminate: raw.terminate,
      forceTerminate: raw.forceTerminate,
      waitForQuiescence: raw.waitForQuiescence
    };
  }

  start(plan: LaunchPlan, callbacks: ProcessHostCallbacks): ManagedProcess {
    this.#claimLaunch(plan);
    let managed: ManagedProcess;
    try {
      managed = this.#host.start(plan, {
        ...callbacks,
        onSpawn: async (child) => {
          if (!child.pid) {
            throw new HarnessRuntimeError(
              "HARNESS_PROCESS_EXITED",
              "Harness process did not expose a process identifier",
              { harnessId: this.#binding.harnessId },
              { source: "process" }
            );
          }
          await this.#host.writeMarker(
            this.#binding.runtimePath,
            child.pid,
            this.#binding.invocationId
          );
          await callbacks.onSpawn?.(child);
        }
      }, this.#binding.signal, this.#binding.nativeProcesses
        ? { owner: this.#binding.nativeProcesses, runtimePath: this.#binding.runtimePath } : undefined);
    } catch (error) {
      this.#processActive = false;
      throw error;
    }
    let activeProcess!: ActiveBoundProcess;
    const completed = settleThenCleanup(
      managed.completed,
      () => this.#cleanupAndRelease(activeProcess)
    );
    activeProcess = { child: managed.child, completed };
    this.#activeProcess = activeProcess;
    return {
      ...managed,
      completed
    };
  }

  async run(plan: LaunchPlan, callbacks: ProcessHostCallbacks): Promise<ProcessExit> {
    const managed = this.start(plan, callbacks);
    try {
      if (plan.stdin !== undefined) await managed.write(plan.stdin);
      await managed.end();
      return await managed.completed;
    } catch (error) {
      managed.terminate();
      await managed.waitForQuiescence();
      await managed.completed.catch(() => undefined);
      throw error;
    }
  }

  async finalize(): Promise<void> {
    // Revoke the Adapter's capability before the first await so work queued by
    // a returned Adapter cannot launch a process after the Facade settles it.
    this.#finalized = true;
    const active = this.#activeProcess;
    if (!active) {
      // Retry removal in case an earlier process completion could not unlink
      // its marker. This is idempotent and keeps the Facade as final owner.
      await this.#host.cleanupMarker(this.#binding.runtimePath);
      return;
    }

    signalProcessTree(active.child, "SIGKILL");
    let completionFailure: unknown;
    try {
      await active.completed;
    } catch (error) {
      completionFailure = error;
    }
    try {
      await this.#host.cleanupMarker(this.#binding.runtimePath);
    } catch (error) {
      completionFailure ??= error;
    }
    throw new HarnessRuntimeError(
      "HARNESS_CONTRACT_VIOLATION",
      "Harness Adapter returned while its native process was still active",
      { harnessId: this.#binding.harnessId },
      {
        source: "process",
        cause: completionFailure instanceof Error ? completionFailure : undefined
      }
    );
  }

  #claimLaunch(plan: LaunchPlan): void {
    if (this.#finalized) {
      throw new HarnessRuntimeError(
        "HARNESS_CONTRACT_VIOLATION",
        "Harness invocation process lease has already been finalized",
        { harnessId: this.#binding.harnessId },
        { source: "process" }
      );
    }
    assertBoundLaunchPlan(plan, this.#binding);
    if (this.#processActive) {
      throw new HarnessRuntimeError(
        "HARNESS_CONTRACT_VIOLATION",
        "An Adapter cannot launch concurrent root processes for one invocation",
        { harnessId: this.#binding.harnessId },
        { source: "process" }
      );
    }
    this.#binding.recoveryBudget.startAttempt(
      plan.recoveryEvidence ?? { kind: "adapter-dispatch" }
    );
    this.#processActive = true;
  }

  async #cleanupAndRelease(activeProcess: ActiveBoundProcess): Promise<void> {
    try {
      await this.#host.cleanupMarker(this.#binding.runtimePath);
    } finally {
      if (this.#activeProcess === activeProcess) {
        this.#activeProcess = undefined;
        this.#processActive = false;
      }
    }
  }
}

interface ProcessAuthorityBinding {
  harnessId: string;
  runtimePath: string;
  workspacePath: string;
  session: () => SessionRef;
  route?: import("./gateway-route.js").ModelRouteBinding;
  commonEnvironment?: Readonly<NodeJS.ProcessEnv>;
  authorityEnvironment?: Readonly<Record<string, string>>;
  hostHome?: string;
  natureFigureConfigPath?: string;
}

function assertBoundLaunchPlan(plan: LaunchPlan, binding: InvocationProcessBinding): void {
  assertAuthorizedLaunchPlan(plan, binding, {
    ...(binding.authorityEnvironment ?? {}),
    SCIENCEEVOLVE_INVOCATION_ID: binding.invocationId,
    SCIENCEEVOLVE_AGENT_HARNESS: binding.harnessId,
    SCIENCEEVOLVE_ROLE_WORKSPACE: binding.workspacePath,
    [PUBLISHED_ARTIFACT_MANIFEST_ENV]: path.join(
      binding.runtimePath,
      PUBLISHED_ARTIFACT_MANIFEST_FILENAME
    )
  }, "invocation");
}

function assertResidentLaunchPlan(plan: LaunchPlan, binding: ResidentProcessBinding): void {
  const reject = (message: string): never => {
    throw new HarnessRuntimeError(
      "HARNESS_CONTRACT_VIOLATION",
      message,
      { harnessId: binding.harnessId, residentScopeId: binding.scopeId },
      { source: "process" }
    );
  };
  if (!binding.scopeId.trim() || binding.scopeId.includes("\0")) {
    reject("Resident process binding has an invalid stable scope id");
  }
  for (const key of [
    "SCIENCEEVOLVE_INVOCATION_ID",
    "SCIENCEEVOLVE_CONTROL_CONTEXT",
    "SCIENCEEVOLVE_CONTROL_CAPABILITY"
  ]) {
    if (binding.authorityEnvironment[key] !== undefined ||
      binding.commonEnvironment[key] !== undefined || plan.env[key] !== undefined) {
      reject(`Resident process cannot retain per-turn authority key ${key}`);
    }
  }
  const expectedEnvironment: Record<string, string> = {
    ...binding.authorityEnvironment,
    SCIENCEEVOLVE_RESIDENT_SCOPE_ID: binding.scopeId,
    SCIENCEEVOLVE_RESIDENT_ROLE: binding.role,
    SCIENCEEVOLVE_AGENT_HARNESS: binding.harnessId,
    SCIENCEEVOLVE_ROLE_WORKSPACE: binding.workspacePath
  };
  if (binding.role === "leader") {
    if (!expectedEnvironment.SCIENCEEVOLVE_COORDINATOR_EPOCH ||
      expectedEnvironment.SCIENCEEVOLVE_EXECUTION_ID !== undefined ||
      expectedEnvironment.SCIENCEEVOLVE_OWNERSHIP_EPOCH !== undefined) {
      reject("Leader resident binding must carry only a coordinator epoch");
    }
  } else if (!expectedEnvironment.SCIENCEEVOLVE_EXECUTION_ID ||
    !expectedEnvironment.SCIENCEEVOLVE_OWNERSHIP_EPOCH ||
    expectedEnvironment.SCIENCEEVOLVE_COORDINATOR_EPOCH !== undefined) {
    reject("Business resident binding must carry execution ownership fencing");
  }
  assertAuthorizedLaunchPlan(plan, binding, expectedEnvironment, "resident");
}

function assertAuthorizedLaunchPlan(
  plan: LaunchPlan,
  binding: ProcessAuthorityBinding,
  expectedEnvironment: Record<string, string>,
  mode: "invocation" | "resident"
): void {
  const reject = (message: string): never => {
    throw new HarnessRuntimeError(
      "HARNESS_CONTRACT_VIOLATION",
      message,
      { harnessId: binding.harnessId },
      { source: "process" }
    );
  };
  if (!path.isAbsolute(plan.command) || !path.isAbsolute(plan.cwd)) {
    reject("Harness launch command and working directory must be absolute");
  }
  if (path.resolve(plan.cwd) !== path.resolve(binding.workspacePath)) {
    reject("Harness launch working directory does not match the invocation workspace");
  }
  if (plan.session.harnessId !== binding.harnessId) {
    reject("Harness launch SessionRef does not match the selected Adapter");
  }
  const expectedSession = binding.session();
  if (
    plan.session.schemaVersion !== expectedSession.schemaVersion ||
    plan.session.harnessId !== expectedSession.harnessId ||
    plan.session.adapterVersion !== expectedSession.adapterVersion ||
    plan.session.generation !== expectedSession.generation ||
    plan.session.nativeId !== expectedSession.nativeId ||
    plan.session.durable !== expectedSession.durable ||
    plan.session.createdAt !== expectedSession.createdAt ||
    plan.session.resumedAt !== expectedSession.resumedAt
  ) {
    reject("Harness launch SessionRef does not match invocation authority");
  }
  if (!validRawLogLimit(plan.rawLogLimitBytes)) {
    reject(`Harness launch raw log limit must be between 1 and ${MAX_RAW_LOG_LIMIT_BYTES} bytes`);
  }
  for (const [key, expected] of Object.entries(expectedEnvironment)) {
    if (plan.env[key] !== expected) {
      reject(`Harness launch environment has an invalid ${key}`);
    }
  }
  for (const key of PROTECTED_OPENFARS_KEYS) {
    if (key === "SCIENCEEVOLVE_CONTROL_CONTEXT") continue;
    const expected = expectedEnvironment[key];
    if (expected === undefined && plan.env[key] !== undefined) {
      reject(`Harness launch injected unexpected authority key ${key}`);
    }
  }
  if (binding.commonEnvironment) {
    for (const [key, value] of Object.entries(plan.env)) {
      if (value !== undefined && sensitiveEnvironmentValue(key) &&
        !allowedInvocationSecret(key, value, plan, binding)) {
        reject(`Harness launch contains an unapproved credential key ${key}`);
      }
    }
    for (const key of COMMON_INVOCATION_ENV) {
      if (SPECIAL_BOUND_ENV.has(key)) continue;
      if (plan.env[key] !== binding.commonEnvironment[key]) {
        reject(`Harness launch environment has an invalid ${key}`);
      }
    }
  }
  const projectRoot = binding.authorityEnvironment?.SCIENCEEVOLVE_PROJECT_ROOT;
  const permission = binding.authorityEnvironment?.SCIENCEEVOLVE_AGENT_PERMISSION;
  const home = plan.env.HOME;
  const codexHome = plan.env.CODEX_HOME;
  // Facade bindings always carry a project root. Low-level host consumers may
  // omit it, in which case they receive no Adapter capability in production.
  if (projectRoot) {
    const authoritativeHome = home || reject(
      "Harness launch omitted an authoritative HOME boundary"
    );
    if (!path.isAbsolute(authoritativeHome)) {
      reject("Harness launch HOME must be absolute");
    }
    const homeInsideProject = pathIsWithin(authoritativeHome, projectRoot) ||
      pathIsWithin(authoritativeHome, binding.runtimePath);
    const residentExecution = binding.authorityEnvironment?.SCIENCEEVOLVE_EXECUTION_ID;
    const residentLeader = mode === "resident" &&
      expectedEnvironment.SCIENCEEVOLVE_RESIDENT_ROLE === "leader";
    const authorizedHostHome = (permission !== "workspace" || Boolean(residentExecution) ||
      residentLeader) &&
      Boolean(binding.hostHome) &&
      path.resolve(authoritativeHome) === path.resolve(binding.hostHome!);
    if (!homeInsideProject && !authorizedHostHome) {
      reject("Harness launch HOME is outside the permitted invocation boundary");
    }
    const trustedNativeHome = harnessSupportsNativeProfile(binding.harnessId) && binding.route && "nativeCodexProfileHome" in binding.route
      ? binding.route.nativeCodexProfileHome : undefined;
    if (trustedNativeHome && codexHome !== trustedNativeHome) reject("Harness launch did not install its trusted native Codex profile");
    if (codexHome !== undefined && codexHome !== trustedNativeHome &&
      (!path.isAbsolute(codexHome) || !pathIsWithin(codexHome, projectRoot))) {
      reject("Harness launch CODEX_HOME is outside the project boundary");
    }
  }
  const natureFigureConfig = plan.env.NATURE_FIGURE_CONFIG;
  const matplotlibBackend = plan.env.MPLBACKEND;
  if (natureFigureConfig !== undefined || matplotlibBackend !== undefined) {
    if (permission !== "compute" || !binding.natureFigureConfigPath ||
      natureFigureConfig !== binding.natureFigureConfigPath || matplotlibBackend !== "Agg") {
      reject("Harness launch has an invalid compute-only Nature configuration");
    }
  }
  if (permission !== "compute") {
    for (const key of COMPUTE_ONLY_ENV) {
      if (plan.env[key] !== undefined) {
        reject(`Harness launch injected compute-only environment key ${key}`);
      }
    }
  }
  if (mode === "invocation") {
    validateControlContext(plan, binding as InvocationProcessBinding, reject);
  }
  if (binding.route && "nativeCodexProfileHome" in binding.route) {
    if (!harnessSupportsNativeProfile(binding.harnessId) || plan.env.CODEX_HOME !== binding.route.nativeCodexProfileHome ||
      !path.isAbsolute(binding.route.nativeCodexProfileHome)) reject("Invalid native Codex profile authority");
    for (const key of ["SCIENCEEVOLVE_GATEWAY_API_KEY", "OPENAI_API_KEY", "OPENAI_BASE_URL", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_BASE_URL"]) {
      if (plan.env[key] !== undefined) reject(`Native Codex profile launch injected provider environment key ${key}`);
    }
  } else if (binding.route) {
    if (plan.env.SCIENCEEVOLVE_GATEWAY_API_KEY !== binding.route.token) {
      reject("Harness launch did not install the invocation Gateway token");
    }
    const protocol = binding.authorityEnvironment?.SCIENCEEVOLVE_AGENT_PROTOCOL;
    if (protocol === "responses" || protocol === "chat-completions") {
      if (plan.env.OPENAI_BASE_URL !== binding.route.baseUrl ||
        plan.env.OPENAI_API_KEY !== binding.route.token) {
        reject("Harness launch omitted the OpenAI-compatible invocation Gateway binding");
      }
      if (plan.env.ANTHROPIC_BASE_URL !== undefined ||
        plan.env.ANTHROPIC_AUTH_TOKEN !== undefined) {
        reject("Harness launch mixed provider environment families");
      }
    } else if (protocol === "anthropic-messages") {
      const expectedAnthropicBase = binding.route.baseUrl.replace(/\/v1\/?$/, "");
      if (plan.env.ANTHROPIC_BASE_URL?.replace(/\/$/, "") !== expectedAnthropicBase.replace(/\/$/, "") ||
        plan.env.ANTHROPIC_AUTH_TOKEN !== binding.route.token) {
        reject("Harness launch omitted the Anthropic invocation Gateway binding");
      }
      if (plan.env.OPENAI_BASE_URL !== undefined || plan.env.OPENAI_API_KEY !== undefined) {
        reject("Harness launch mixed provider environment families");
      }
    } else if (protocol !== undefined) {
      reject("Harness launch has an unsupported native protocol binding");
    }
  }
  const adapterKeys = new Set(plan.adapterEnvironmentKeys ?? []);
  for (const key of adapterKeys) {
    if (!/^[A-Z][A-Z0-9_]{0,127}$/.test(key) || sensitiveEnvironmentValue(key) ||
      COMMON_INVOCATION_ENV.has(key) || key.startsWith("SCIENCEEVOLVE_INSPIRE_")) {
      reject(`Harness launch declares an unsafe Adapter environment key ${key}`);
    }
  }
  for (const [key, value] of Object.entries(plan.env)) {
    if (value === undefined) continue;
    if (!COMMON_INVOCATION_ENV.has(key) && !adapterKeys.has(key)) {
      reject(`Harness launch environment key ${key} was not approved by the common host`);
    }
    if (adapterKeys.has(key) && process.env[key] !== undefined && process.env[key] === value) {
      reject(`Harness launch attempted to pass through host environment key ${key}`);
    }
    if (adapterKeys.has(key) && embedsInvocationSecret(value, binding)) {
      reject(`Harness launch embedded an invocation credential in Adapter environment key ${key}`);
    }
    if (sensitiveEnvironmentValue(key) && !allowedInvocationSecret(key, value, plan, binding)) {
      reject(`Harness launch contains an unapproved credential key ${key}`);
    }
  }
}

function validRawLogLimit(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 1 && value <= MAX_RAW_LOG_LIMIT_BYTES;
}

function assertCommonRawLogLimit(value: number): void {
  if (validRawLogLimit(value)) return;
  throw new HarnessRuntimeError(
    "HARNESS_CONTRACT_VIOLATION",
    `Harness launch raw log limit must be between 1 and ${MAX_RAW_LOG_LIMIT_BYTES} bytes`,
    {},
    { source: "process" }
  );
}

function pathIsWithin(candidate: string, root: string): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === "" || (
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function embedsInvocationSecret(
  value: string,
  binding: ProcessAuthorityBinding
): boolean {
  const secrets = [
    binding.route && "token" in binding.route ? binding.route.token : undefined,
    binding.authorityEnvironment?.SCIENCEEVOLVE_FIXED_MCP_TOKEN,
    binding.authorityEnvironment?.SCIENCEEVOLVE_CONTROL_CAPABILITY
  ].filter((secret): secret is string => Boolean(secret));
  return secrets.some((secret) => value.includes(secret));
}

function validateControlContext(
  plan: LaunchPlan,
  binding: InvocationProcessBinding,
  reject: (message: string) => never
): void {
  const raw = plan.env.SCIENCEEVOLVE_CONTROL_CONTEXT;
  const expectedCapability = binding.authorityEnvironment?.SCIENCEEVOLVE_CONTROL_CAPABILITY;
  const expectedRaw = binding.authorityEnvironment?.SCIENCEEVOLVE_CONTROL_CONTEXT;
  if (!expectedCapability) {
    if (raw !== undefined) reject("Harness launch injected an unexpected control context");
    return;
  }
  if (!expectedRaw) reject("Invocation binding omitted the authoritative control context");
  if (!raw || raw !== expectedRaw) {
    reject("Harness launch control context does not match invocation authority");
  }
  let context: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    context = parsed as Record<string, unknown>;
  } catch {
    reject("Harness launch control context is malformed");
  }
  const expected = binding.authorityEnvironment ?? {};
  if (context.projectId !== expected.SCIENCEEVOLVE_PROJECT_ID ||
    context.invocationId !== binding.invocationId ||
    context.agent !== expected.SCIENCEEVOLVE_AGENT_NAME ||
    context.kind !== expected.SCIENCEEVOLVE_AGENT_KIND ||
    context.workspacePath !== binding.workspacePath) {
    reject("Harness launch control context does not match invocation authority");
  }
}

function allowedInvocationSecret(
  key: string,
  value: string,
  plan: LaunchPlan,
  binding: ProcessAuthorityBinding
): boolean {
  if (key === "SCIENCEEVOLVE_CONTROL_CAPABILITY" || key === "SCIENCEEVOLVE_FIXED_MCP_TOKEN") {
    return binding.authorityEnvironment?.[key] === value;
  }
  if (key === "SCIENCEEVOLVE_GATEWAY_API_KEY" || key === "OPENAI_API_KEY" ||
    key === "ANTHROPIC_AUTH_TOKEN") {
    return Boolean(binding.route && "token" in binding.route && binding.route.token) && Boolean(binding.route && "token" in binding.route && value === binding.route.token &&
      plan.env.SCIENCEEVOLVE_GATEWAY_API_KEY === binding.route.token);
  }
  // Authority-bearing OpenFARS metadata is validated separately and is not a
  // provider credential even if a future field name happens to match.
  return PROTECTED_OPENFARS_KEYS.has(key) && plan.env.SCIENCEEVOLVE_AGENT_HARNESS === binding.harnessId;
}

async function settleThenCleanup<T>(
  completion: Promise<T>,
  cleanup: () => Promise<void>
): Promise<T> {
  let primaryFailure = false;
  try {
    return await completion;
  } catch (error) {
    primaryFailure = true;
    throw error;
  } finally {
    try {
      await cleanup();
    } catch (error) {
      if (!primaryFailure) throw error;
    }
  }
}

interface ProcessIdentity {
  pid: number;
  processGroupId: number;
  procPid?: number;
  startTicks?: string;
}

interface ResidentLaunchOwnerIdentity {
  pid: number;
  procPid: number;
  pidNamespace: string;
  bootId: string;
  startTicks: string;
}

interface ResidentLaunchClaim {
  schemaVersion: 1;
  protocol: "trusted-supervisor-v1";
  identity: ResidentProcessCleanupIdentity;
  owner: ResidentLaunchOwnerIdentity;
  status: "launching" | "spawned" | "terminated";
  process?: LinuxProcessTreeIdentity;
}

interface ResidentLaunchClaimHandle {
  file: string;
  configFile: string;
  claim: ResidentLaunchClaim;
}

interface ResidentSupervisorConfig {
  protocol: "trusted-supervisor-v1";
  identity: ResidentProcessCleanupIdentity;
  claimFile: string;
  fenceFile: string;
  command: string;
  args: readonly string[];
  cwd: string;
}

function residentCleanupIdentity(
  binding: ResidentProcessBinding
): ResidentProcessCleanupIdentity {
  const projectId = binding.authorityEnvironment.SCIENCEEVOLVE_PROJECT_ID;
  if (!projectId) throw new Error("Resident process binding omitted project identity");
  if (binding.role === "leader") {
    const coordinatorEpoch = Number(binding.authorityEnvironment.SCIENCEEVOLVE_COORDINATOR_EPOCH);
    return {
      projectId,
      harnessId: binding.harnessId,
      scopeId: binding.scopeId,
      role: "leader",
      coordinatorEpoch
    };
  }
  const executionId = binding.authorityEnvironment.SCIENCEEVOLVE_EXECUTION_ID;
  const ownershipEpoch = Number(binding.authorityEnvironment.SCIENCEEVOLVE_OWNERSHIP_EPOCH);
  if (!executionId) throw new Error("Resident process binding omitted execution identity");
  return {
    projectId,
    harnessId: binding.harnessId,
    scopeId: binding.scopeId,
    role: binding.role,
    executionId,
    ownershipEpoch
  };
}

function residentAuthorityEpoch(identity: ResidentProcessCleanupIdentity): number {
  return identity.role === "leader"
    ? identity.coordinatorEpoch
    : identity.ownershipEpoch;
}

function residentLaunchClaimPath(
  runtimePath: string,
  identity: ResidentProcessCleanupIdentity
): string {
  return path.join(runtimePath, `resident-launch-claim-v1-${residentAuthorityEpoch(identity)}.json`);
}

function residentStopFencePath(
  runtimePath: string,
  identity: ResidentProcessCleanupIdentity
): string {
  return path.join(runtimePath, `resident-stop-fence-v1-${residentAuthorityEpoch(identity)}.json`);
}

function currentResidentLaunchOwner(): ResidentLaunchOwnerIdentity {
  if (process.platform !== "linux") {
    throw new Error("Resident launch fencing requires Linux process identity");
  }
  const stat = readFileSync("/proc/self/stat", "utf8");
  const status = readFileSync("/proc/self/status", "utf8");
  const close = stat.lastIndexOf(")");
  const tail = close >= 0 ? stat.slice(close + 2).trim().split(/\s+/) : [];
  const startTicks = tail[19];
  const procPid = Number.parseInt(stat.split(" ", 1)[0] ?? "", 10);
  const pid = namespaceProcessId(status, "NSpid") ?? procPid;
  if (!startTicks || !/^\d+$/.test(startTicks) ||
    !Number.isSafeInteger(procPid) || procPid < 1 ||
    !Number.isSafeInteger(pid) || pid < 1) {
    throw new Error("Unable to capture resident launch owner start identity");
  }
  return {
    pid,
    procPid,
    pidNamespace: readlinkSync("/proc/self/ns/pid"),
    bootId: readFileSync("/proc/sys/kernel/random/boot_id", "utf8").trim(),
    startTicks
  };
}

function readPrivateJsonSync(file: string): unknown {
  const descriptor = openSync(file, fsConstants.O_RDONLY | NO_FOLLOW);
  try {
    const info = fstatSync(descriptor);
    // An atomic rename can unlink the old inode after open but before fstat.
    // Reading that already-open immutable snapshot is safe; the caller will
    // loop and observe the replacement. Multiple hard links remain invalid.
    if (!info.isFile() || info.nlink > 1 || info.size <= 0 || info.size > MARKER_LIMIT_BYTES) {
      throw new Error("Resident authority file is not a bounded private regular file");
    }
    return JSON.parse(readFileSync(descriptor, "utf8"));
  } finally {
    closeSync(descriptor);
  }
}

function createPrivateJsonSync(file: string, value: unknown): void {
  const descriptor = openSync(
    file,
    fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | NO_FOLLOW,
    0o600
  );
  try {
    writeFileSync(descriptor, `${JSON.stringify(value)}\n`, "utf8");
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
  syncDirectorySync(path.dirname(file));
}

function readOptionalPrivateJsonSync(file: string): unknown | undefined {
  try {
    return readPrivateJsonSync(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

function sameResidentCleanupIdentity(
  left: ResidentProcessCleanupIdentity,
  right: ResidentProcessCleanupIdentity
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function assertNoResidentStopFence(
  identity: ResidentProcessCleanupIdentity,
  runtimePath: string
): void {
  const value = readOptionalPrivateJsonSync(residentStopFencePath(runtimePath, identity));
  if (value === undefined) return;
  const fenced = (value as { identity?: ResidentProcessCleanupIdentity }).identity;
  if (!fenced || !sameResidentCleanupIdentity(fenced, identity)) {
    throw new Error("Resident stop fence identity is malformed or mismatched");
  }
  throw new Error("Resident process launch is fenced for this authority epoch");
}

function claimResidentLaunch(
  identity: ResidentProcessCleanupIdentity,
  runtimePath: string,
  plan: LaunchPlan
): ResidentLaunchClaimHandle {
  assertResidentCleanupIdentity(identity);
  mkdirSync(runtimePath, { recursive: true, mode: 0o700 });
  assertNoResidentStopFence(identity, runtimePath);
  const claim: ResidentLaunchClaim = {
    schemaVersion: 1,
    protocol: "trusted-supervisor-v1",
    identity,
    owner: currentResidentLaunchOwner(),
    status: "launching"
  };
  const file = residentLaunchClaimPath(runtimePath, identity);
  const configFile = path.join(
    runtimePath,
    `resident-supervisor-v1-${residentAuthorityEpoch(identity)}-${randomUUID()}.json`
  );
  const config: ResidentSupervisorConfig = {
    protocol: "trusted-supervisor-v1",
    identity,
    claimFile: file,
    fenceFile: residentStopFencePath(runtimePath, identity),
    command: plan.command,
    args: plan.args,
    cwd: plan.cwd
  };
  createPrivateJsonSync(configFile, config);
  try {
    createPrivateJsonSync(file, claim);
  } catch (error) {
    try { unlinkSync(configFile); } catch { /* Best-effort orphan cleanup. */ }
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new Error("Resident launch authority is already claimed for this epoch");
    }
    throw error;
  }
  try {
    assertNoResidentStopFence(identity, runtimePath);
  } catch (error) {
    releaseResidentLaunchClaim({ file, configFile, claim });
    throw error;
  }
  return { file, configFile, claim };
}

function persistResidentLaunchClaim(
  handle: ResidentLaunchClaimHandle,
  status: ResidentLaunchClaim["status"]
): void {
  const current = readPrivateJsonSync(handle.file) as ResidentLaunchClaim;
  assertResidentLaunchOwnerIdentity(current.owner);
  if (!sameResidentCleanupIdentity(current.identity, handle.claim.identity) ||
    JSON.stringify(current.owner) !== JSON.stringify(handle.claim.owner)) {
    throw new Error("Resident launch claim changed ownership before spawn");
  }
  const next = { ...current, status } satisfies ResidentLaunchClaim;
  const temporary = `${handle.file}.${process.pid}.${randomUUID()}.tmp`;
  createPrivateJsonSync(temporary, next);
  renameSync(temporary, handle.file);
  syncDirectorySync(path.dirname(handle.file));
  handle.claim = next;
}

async function waitForResidentSupervisorClaim(
  handle: ResidentLaunchClaimHandle,
  started: ManagedProcess
): Promise<void> {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const current = readPrivateJsonSync(handle.file) as ResidentLaunchClaim;
    assertResidentLaunchOwnerIdentity(current.owner);
    if (current.schemaVersion !== 1 || current.protocol !== "trusted-supervisor-v1" ||
      !sameResidentCleanupIdentity(current.identity, handle.claim.identity) ||
      JSON.stringify(current.owner) !== JSON.stringify(handle.claim.owner)) {
      throw new Error("Resident supervisor changed its durable launch authority");
    }
    if (current.status === "spawned") {
      if (!current.process) throw new Error("Resident supervisor omitted its process identity");
      assertLinuxProcessTreeIdentity(current.process);
      const observed = PROCESS_TREE_IDENTITIES.get(started.child);
      if (!observed || !sameLinuxProcessIdentity(current.process, observed) ||
        current.process.processGroupId !== observed.processGroupId ||
        current.process.observedProcessGroupId !== observed.observedProcessGroupId) {
        throw new Error("Resident supervisor durable identity does not match the spawned process");
      }
      handle.claim = current;
      return;
    }
    if (current.status !== "launching" || started.child.exitCode !== null ||
      started.child.signalCode !== null) {
      throw new Error("Resident supervisor exited before its durable spawn handshake");
    }
    await delay(5);
  }
  throw new Error("Resident supervisor did not durably acknowledge its launch");
}

function releaseResidentLaunchClaim(handle: ResidentLaunchClaimHandle): void {
  try {
    const current = readPrivateJsonSync(handle.file) as ResidentLaunchClaim;
    if (sameResidentCleanupIdentity(current.identity, handle.claim.identity) &&
      JSON.stringify(current.owner) === JSON.stringify(handle.claim.owner)) {
      unlinkSync(handle.file);
      syncDirectorySync(path.dirname(handle.file));
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  try { unlinkSync(handle.configFile); } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

function installResidentStopFenceSync(
  identity: ResidentProcessCleanupIdentity,
  runtimePath: string
): void {
  assertResidentCleanupIdentity(identity);
  mkdirSync(runtimePath, { recursive: true, mode: 0o700 });
  const file = residentStopFencePath(runtimePath, identity);
  const fence = { schemaVersion: 1, identity };
  try {
    createPrivateJsonSync(file, fence);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    const existing = readPrivateJsonSync(file) as {
      identity?: ResidentProcessCleanupIdentity;
    };
    if (!existing.identity || !sameResidentCleanupIdentity(existing.identity, identity)) {
      throw new Error("Resident stop fence was reused with another authority identity");
    }
  }
}

function residentLaunchOwnerAlive(owner: ResidentLaunchOwnerIdentity): boolean {
  if (process.platform !== "linux") return false;
  try {
    if (readFileSync("/proc/sys/kernel/random/boot_id", "utf8").trim() !== owner.bootId ||
      readlinkSync(`/proc/${owner.procPid}/ns/pid`) !== owner.pidNamespace) return false;
    const status = readFileSync(`/proc/${owner.procPid}/status`, "utf8");
    const namespacePid = namespaceProcessId(status, "NSpid") ?? owner.procPid;
    if (namespacePid !== owner.pid) return false;
    const stat = readFileSync(`/proc/${owner.procPid}/stat`, "utf8");
    const close = stat.lastIndexOf(")");
    const tail = close >= 0 ? stat.slice(close + 2).trim().split(/\s+/) : [];
    return tail[19] === owner.startTicks;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ESRCH") return false;
    throw error;
  }
}

async function installResidentStopFence(
  identity: ResidentProcessCleanupIdentity,
  runtimePath: string
): Promise<ResidentLaunchClaim | undefined> {
  assertResidentCleanupIdentity(identity);
  await fs.mkdir(runtimePath, { recursive: true, mode: 0o700 });
  const fenceFile = residentStopFencePath(runtimePath, identity);
  const fence = { schemaVersion: 1, identity };
  try {
    await createRegularFileNoFollow(fenceFile, `${JSON.stringify(fence)}\n`);
    await syncDirectory(path.dirname(fenceFile));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    const existing = JSON.parse(await readRegularFileNoFollow(fenceFile)) as {
      identity?: ResidentProcessCleanupIdentity;
    };
    if (!existing.identity || !sameResidentCleanupIdentity(existing.identity, identity)) {
      throw new Error("Resident stop fence was reused with another authority identity");
    }
  }
  const claimFile = residentLaunchClaimPath(runtimePath, identity);
  let claim: ResidentLaunchClaim | undefined;
  try {
    claim = JSON.parse(await readRegularFileNoFollow(claimFile)) as ResidentLaunchClaim;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  if (!claim) return undefined;
  if (claim.schemaVersion !== 1 ||
    claim.protocol !== "trusted-supervisor-v1" ||
    !sameResidentCleanupIdentity(claim.identity, identity) ||
    !["launching", "spawned", "terminated"].includes(claim.status)) {
    throw new Error("Resident launch claim is malformed or mismatched");
  }
  assertResidentLaunchOwnerIdentity(claim.owner);
  if (claim.status === "spawned") {
    if (!claim.process) {
      throw new Error("Resident supervisor claim omitted its process identity");
    }
    assertLinuxProcessTreeIdentity(claim.process);
  } else if (claim.process !== undefined) {
    throw new Error("Resident launch claim has a process outside the spawned state");
  }
  if (claim.status === "launching" && residentLaunchOwnerAlive(claim.owner)) {
    throw new Error("Resident launch owner is still live before its spawn boundary");
  }
  return claim;
}

function assertResidentLaunchOwnerIdentity(
  owner: ResidentLaunchOwnerIdentity | undefined
): asserts owner is ResidentLaunchOwnerIdentity {
  if (!owner ||
    !Number.isSafeInteger(owner.pid) || owner.pid < 1 ||
    !Number.isSafeInteger(owner.procPid) || owner.procPid < 1 ||
    typeof owner.pidNamespace !== "string" || !owner.pidNamespace.trim() ||
    typeof owner.bootId !== "string" || !owner.bootId.trim() ||
    typeof owner.startTicks !== "string" || !/^\d+$/.test(owner.startTicks)) {
    throw new Error("Resident launch owner identity is malformed");
  }
}

function assertResidentCleanupIdentity(identity: ResidentProcessCleanupIdentity): void {
  const epoch = residentAuthorityEpoch(identity);
  for (const [name, value] of Object.entries({
    projectId: identity.projectId,
    harnessId: identity.harnessId,
    scopeId: identity.scopeId,
    role: identity.role
  })) {
    if (typeof value !== "string" || !value.trim() || value.includes("\0")) {
      throw new Error(`Invalid resident cleanup ${name}`);
    }
  }
  if (!(["leader", "delivery", "final-integration"] as const).includes(identity.role) ||
    (identity.role !== "leader" && identity.executionId !== identity.scopeId) ||
    (identity.role === "leader" &&
      ("executionId" in identity || "ownershipEpoch" in identity)) ||
    (identity.role !== "leader" && "coordinatorEpoch" in identity) ||
    !Number.isSafeInteger(epoch) || epoch < 1) {
    throw new Error("Invalid resident cleanup authority identity");
  }
}

async function findInvocationProcesses(
  invocationId: string,
  runtimePath: string
): Promise<ProcessIdentity[]> {
  if (process.platform === "linux") {
    const matches = new Map<number, ProcessIdentity>();
    let entries: string[] = [];
    let procScanAvailable = false;
    try {
      entries = await fs.readdir("/proc");
      procScanAvailable = true;
    } catch {
      // Non-proc environments retain the legacy marker fallback below.
    }
    await Promise.all(entries.filter((entry) => /^\d+$/.test(entry)).map(async (entry) => {
      const pid = Number.parseInt(entry, 10);
      try {
        const environment = await fs.readFile(`/proc/${pid}/environ`);
        if (!environment.includes(Buffer.from(`SCIENCEEVOLVE_INVOCATION_ID=${invocationId}\0`, "utf8"))) return;
        const status = await fs.readFile(`/proc/${pid}/status`, "utf8");
        if (/^State:\s+Z\b/m.test(status)) return;
        const namespacePid = namespaceProcessId(status, "NSpid") ?? pid;
        const processGroupId = namespaceProcessId(status, "NSpgid") ?? namespacePid;
        if (namespacePid > 1 && processGroupId > 1) {
          matches.set(processGroupId, { pid: namespacePid, processGroupId });
        }
      } catch {
        // Processes may exit while /proc is scanned.
      }
    }));
    if (matches.size) return [...matches.values()];
    // A PID recorded in another Linux PID namespace can alias an unrelated
    // live process after restart. When /proc is available, the invocation
    // environment is the authority; a marker alone is never sufficient.
    if (procScanAvailable) return [];
  }

  for (const markerName of ["harness-process.json", "process.json"]) {
    try {
      const value = JSON.parse(await readRegularFileNoFollow(
        path.join(runtimePath, markerName)
      )) as {
        invocationId?: unknown;
        pid?: unknown;
        processGroupId?: unknown;
        status?: unknown;
      };
      if (value.invocationId !== undefined && value.invocationId !== invocationId) continue;
      if (value.status !== undefined && value.status !== "running") continue;
      if (typeof value.pid !== "number" || !Number.isSafeInteger(value.pid) || value.pid <= 1) continue;
      const processGroupId = typeof value.processGroupId === "number" &&
        Number.isSafeInteger(value.processGroupId) && value.processGroupId > 1
        ? value.processGroupId
        : value.pid;
      try {
        process.kill(value.pid, 0);
        return [{ pid: value.pid, processGroupId }];
      } catch {
        // Stale marker.
      }
    } catch {
      // Missing or malformed markers have no trusted target.
    }
  }
  return [];
}

async function findResidentProcesses(
  identity: ResidentProcessCleanupIdentity,
  runtimePath: string,
  failOnUnreadableSameUid = true
): Promise<ProcessIdentity[]> {
  if (process.platform !== "linux") {
    throw new Error("Exact resident process cleanup requires Linux /proc authority");
  }
  assertResidentCleanupIdentity(identity);
  const epoch = identity.role === "leader"
    ? identity.coordinatorEpoch
    : identity.ownershipEpoch;
  const serviceUid = process.geteuid?.();
  if (serviceUid === undefined) {
    throw new Error("Exact resident process cleanup requires a service uid");
  }
  let entries: string[];
  try {
    entries = await fs.readdir("/proc");
  } catch (error) {
    throw new Error("Unable to scan /proc for stale Harness residents", { cause: error });
  }
  const servicePidNamespace = await fs.readlink("/proc/self/ns/pid").catch((error) => {
    throw new Error("Unable to read the service PID namespace for resident cleanup", {
      cause: error
    });
  });
  const required = new Set([
    `SCIENCEEVOLVE_PROJECT_ID=${identity.projectId}`,
    `SCIENCEEVOLVE_AGENT_HARNESS=${identity.harnessId}`,
    `SCIENCEEVOLVE_RESIDENT_SCOPE_ID=${identity.scopeId}`,
    `SCIENCEEVOLVE_RESIDENT_ROLE=${identity.role}`,
    ...(identity.role === "leader"
      ? [`SCIENCEEVOLVE_COORDINATOR_EPOCH=${identity.coordinatorEpoch}`]
      : [
          `SCIENCEEVOLVE_EXECUTION_ID=${identity.executionId}`,
          `SCIENCEEVOLVE_OWNERSHIP_EPOCH=${identity.ownershipEpoch}`
        ])
  ]);
  const forbidden = identity.role === "leader"
    ? ["SCIENCEEVOLVE_INVOCATION_ID", "SCIENCEEVOLVE_EXECUTION_ID", "SCIENCEEVOLVE_OWNERSHIP_EPOCH"]
    : ["SCIENCEEVOLVE_INVOCATION_ID", "SCIENCEEVOLVE_COORDINATOR_EPOCH"];
  const matches = new Map<number, ProcessIdentity>();
  for (const entry of entries.filter((candidate) => /^\d+$/.test(candidate))) {
    const pid = Number.parseInt(entry, 10);
    try {
      const status = await fs.readFile(`/proc/${pid}/status`, "utf8");
      const uid = /^Uid:\s+(\d+)\s+(\d+)\b/m.exec(status);
      if (!uid) throw new Error(`Process ${pid} omitted uid during resident cleanup`);
      if (Number(uid[1]) !== serviceUid && Number(uid[2]) !== serviceUid) continue;
      if (/^State:\s+Z\b/m.test(status)) continue;
      const namespacePid = namespaceProcessId(status, "NSpid") ?? pid;
      const processGroupId = namespaceProcessId(status, "NSpgid") ?? namespacePid;
      // A detached resident always owns a non-init process group. Skipping
      // namespace init before touching its commonly restricted ns/environ
      // files is safe and keeps a root service from confusing PID 1 with a
      // possible resident candidate.
      if (namespacePid <= 1 || processGroupId <= 1) continue;
      const pidNamespace = await fs.readlink(`/proc/${pid}/ns/pid`);
      if (pidNamespace !== servicePidNamespace) continue;
      const rawEnvironment = await fs.readFile(`/proc/${pid}/environ`, "utf8");
      const environment = new Set(rawEnvironment.split("\0").filter(Boolean));
      if (![...required].every((value) => environment.has(value)) ||
        forbidden.some((key) => [...environment].some((value) => value.startsWith(`${key}=`)))) continue;
      const stat = await fs.readFile(`/proc/${pid}/stat`, "utf8");
      const close = stat.lastIndexOf(")");
      const tail = close >= 0 ? stat.slice(close + 2).trim().split(/\s+/) : [];
      const startTicks = tail[19];
      if (namespacePid > 1 && processGroupId > 1) {
        if (!startTicks || !/^\d+$/.test(startTicks)) {
          throw new Error(`Process ${pid} has an invalid start identity`);
        }
        const candidate = {
          pid: namespacePid,
          processGroupId,
          procPid: pid,
          startTicks
        };
        const current = matches.get(processGroupId);
        if (!current || pid < (current.procPid ?? Number.MAX_SAFE_INTEGER)) {
          matches.set(processGroupId, candidate);
        }
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT" || code === "ESRCH") continue;
      if (!failOnUnreadableSameUid && (code === "EACCES" || code === "EPERM")) continue;
      throw new Error(`Unable to inspect same-host process ${pid} during resident cleanup`, {
        cause: error
      });
    }
  }
  if (matches.size) return [...matches.values()];

  // Reconciliation owns marker-based signalling with full boot/start identity.
  // This fallback never signals a marker PID; it only refuses to treat a live
  // or mismatched marker as absence after the /proc scan.
  try {
    const marker = JSON.parse(await readRegularFileNoFollow(
      path.join(runtimePath, "resident-process.json")
    )) as {
      executionId?: unknown;
      harnessId?: unknown;
      role?: unknown;
      ownershipEpoch?: unknown;
      state?: unknown;
    };
    if (marker.executionId !== identity.scopeId ||
      marker.harnessId !== identity.harnessId || marker.role !== identity.role) {
      throw new Error("Resident cleanup marker does not match the exact authority tuple");
    }
    const markerEpoch = marker.ownershipEpoch;
    if (typeof markerEpoch !== "number" || !Number.isSafeInteger(markerEpoch) ||
      markerEpoch < 1 || markerEpoch > epoch) {
      throw new Error("Resident cleanup marker has an invalid future ownership epoch");
    }
    if (!["stopped", "crashed"].includes(String(marker.state))) {
      throw new Error("Resident cleanup found an active marker after process reconciliation");
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  return [];
}

async function createRegularFileNoFollow(file: string, value: string): Promise<void> {
  const handle = await fs.open(
    file,
    fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | NO_FOLLOW,
    0o600
  );
  try {
    const info = await handle.stat();
    if (!info.isFile()) throw new Error("Harness process marker is not a regular file");
    await handle.writeFile(value, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function readRegularFileNoFollow(file: string): Promise<string> {
  if (NO_FOLLOW === 0) {
    const before = await fs.lstat(file);
    if (before.isSymbolicLink()) throw new Error("Harness process marker cannot be a symbolic link");
  }
  // O_NONBLOCK prevents an attacker-controlled FIFO/device at the marker path
  // from stalling recovery before fstat can reject the non-regular file.
  const handle = await fs.open(file, fsConstants.O_RDONLY | NO_FOLLOW | NON_BLOCK);
  try {
    const info = await handle.stat();
    if (!info.isFile() || info.nlink > 1 || info.size <= 0 || info.size > MARKER_LIMIT_BYTES) {
      throw new Error("Harness process marker is not a bounded regular file");
    }
    return await handle.readFile("utf8");
  } finally {
    await handle.close();
  }
}

async function removeOwnedRegularMarker(file: string, invocationId: string): Promise<void> {
  let value: unknown;
  try {
    value = JSON.parse(await readRegularFileNoFollow(file));
  } catch (error) {
    throw markerWriteError(error);
  }
  if (!value || typeof value !== "object" || Array.isArray(value) ||
    (value as Record<string, unknown>).invocationId !== invocationId) {
    throw markerWriteError(new Error("Existing Harness process marker has different ownership"));
  }
  try {
    await fs.unlink(file);
  } catch (error) {
    throw markerWriteError(error);
  }
}

function markerWriteError(error: unknown): HarnessRuntimeError {
  return new HarnessRuntimeError(
    "HARNESS_CONTRACT_VIOLATION",
    "Unable to create the Facade-owned Harness process marker safely",
    {},
    { source: "process", cause: error instanceof Error ? error : undefined }
  );
}

function namespaceProcessId(status: string, field: "NSpid" | "NSpgid"): number | undefined {
  const line = status.match(new RegExp(`^${field}:\\s+(.+)$`, "m"))?.[1];
  if (!line) return undefined;
  const value = Number.parseInt(line.trim().split(/\s+/).at(-1) ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function safeProcessSignal(pid: number, signal: NodeJS.Signals): void {
  try { process.kill(pid, signal); } catch { /* Process already exited. */ }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function boundedUtf8Suffix(value: string, limit: number): string {
  const encoded = Buffer.from(value, "utf8");
  if (encoded.byteLength <= limit) return value;

  // Keep a complete UTF-8 suffix. Starting at the raw byte boundary could
  // split a multi-byte code point and manufacture a replacement character.
  let start = encoded.byteLength - limit;
  while (start < encoded.byteLength && (encoded[start]! & 0xc0) === 0x80) {
    start += 1;
  }
  return encoded.subarray(start).toString("utf8");
}

function waitForExit(child: ChildProcessWithoutNullStreams): Promise<{
  code: number | null;
  signal: NodeJS.Signals | null;
  error?: Error;
}> {
  return new Promise((resolve) => {
    let error: Error | undefined;
    child.once("error", (reason) => { error = reason; });
    child.once("close", (code, signal) => resolve({ code, signal, ...(error ? { error } : {}) }));
  });
}

export async function terminateProcessTree(
  child: ChildProcessWithoutNullStreams,
  options: RawProcessOptions["termination"] = {}
): Promise<void> {
  if (!child.pid) return;
  const windowsResident = process.platform === "win32" ? registeredWindowsResident(child) : undefined;
  if (windowsResident) {
    await controlWindowsResident(windowsResident, "terminate");
    return;
  }
  const startedAt = Date.now();
  const initialSignal = options.initialSignal ?? "SIGTERM";
  signalProcessTree(child, initialSignal);
  const terminateAfterMs = options.terminateAfterMs;
  if (terminateAfterMs !== undefined && initialSignal !== "SIGTERM") {
    if (await waitForOwnedProcessTreeExit(child, startedAt + terminateAfterMs)) { await nativeProcessScope(child)?.flushAudit(); return; }
    signalProcessTree(child, "SIGTERM");
  }
  if (await waitForOwnedProcessTreeExit(child, startedAt + (options.killAfterMs ?? 1_000))) { await nativeProcessScope(child)?.flushAudit(); return; }
  // Do not gate escalation on the group leader's ChildProcess state. A native
  // CLI can exit on SIGTERM while a same-PGID descendant deliberately ignores
  // it. The captured Linux identity prevents a reused leader PID/PGID from
  // becoming an unrelated kill target.
  signalProcessTree(child, "SIGKILL");
  if (!await waitForOwnedProcessTreeExit(child, Date.now() + 5_000)) {
    throw new HarnessRuntimeError(
      "HARNESS_CONTRACT_VIOLATION",
      "Harness process group remained alive after SIGKILL",
      { pid: child.pid },
      { source: "process" }
    );
  }
  await nativeProcessScope(child)?.flushAudit();
}

export function signalProcessTree(child: ChildProcessWithoutNullStreams, signal: NodeJS.Signals): void {
  let scopeFailure: Error | undefined;
  try { nativeProcessScope(child)?.signal(signal); }
  catch (error) { scopeFailure = error instanceof Error ? error : new Error("Native descendant signal failed", { cause: error }); }
  if (process.platform === "win32") {
    try { child.kill(signal); } catch { /* Process already exited. */ }
    return;
  }
  const identity = PROCESS_TREE_IDENTITIES.get(child) ?? rememberProcessTreeIdentity(child);
  let rootOwned = false;
  if (identity) {
    try {
      rootOwned = sameLinuxProcessIdentity(
        identity,
        readLinuxProcessTreeIdentity(identity.pid, identity.procPid)
      );
    } catch { /* The original group leader exited. */ }
  }
  // On Linux a detached group is never signalled from its numeric PGID alone.
  // If both capture attempts lost the leader before /proc exposed its full
  // identity, the ChildProcess handle can still safely address the live root
  // but PID reuse makes group escalation unauthorised. Other Unix platforms
  // retain the pre-existing best-effort process-group behaviour.
  const groupOwned = process.platform === "linux"
    ? identity ? ownedLinuxProcessGroup(identity) : false
    : true;
  if (identity && !rootOwned && !groupOwned &&
    (child.exitCode !== null || child.signalCode !== null)) {
    if (scopeFailure) throw scopeFailure;
    return;
  }
  // Signal the known child PID as well as its detached process group.  Some
  // container runtimes acknowledge a group-directed STOP/KILL while delaying
  // delivery to the namespace-visible group leader; PID-first delivery keeps
  // resident pause/close deterministic and the group signal still covers any
  // native subprocesses.
  // The live ChildProcess handle remains authoritative for its exact root PID;
  // full /proc identity gates orphan-group escalation, where PID reuse is the
  // actual hazard. This also keeps STOP/CONT reliable across nested namespace
  // views whose /proc mapping can momentarily disagree during spawn.
  if (!identity || rootOwned ||
    (child.exitCode === null && child.signalCode === null)) {
    try { process.kill(child.pid!, signal); } catch { /* Process already exited. */ }
  }
  if (groupOwned) {
    const processGroupId = identity?.processGroupId ?? child.pid!;
    try { process.kill(-processGroupId, signal); } catch { /* Group already exited. */ }
  }
  if (scopeFailure) throw scopeFailure;
}

interface LinuxProcessTreeIdentity {
  pid: number;
  procPid: number;
  processGroupId: number;
  observedProcessGroupId: number;
  procProcessGroupId: number;
  procSessionId: number;
  pidNamespace: string;
  bootId: string;
  startTicks: string;
}

function assertLinuxProcessTreeIdentity(identity: LinuxProcessTreeIdentity): void {
  if (!identity || !Number.isSafeInteger(identity.pid) || identity.pid <= 1 ||
    !Number.isSafeInteger(identity.procPid) || identity.procPid <= 1 ||
    !Number.isSafeInteger(identity.processGroupId) || identity.processGroupId !== identity.pid ||
    !Number.isSafeInteger(identity.observedProcessGroupId) ||
    identity.observedProcessGroupId !== identity.processGroupId ||
    !Number.isSafeInteger(identity.procProcessGroupId) ||
    identity.procProcessGroupId !== identity.procPid ||
    !Number.isSafeInteger(identity.procSessionId) || identity.procSessionId !== identity.procPid ||
    typeof identity.pidNamespace !== "string" || !identity.pidNamespace ||
    typeof identity.bootId !== "string" || !identity.bootId ||
    typeof identity.startTicks !== "string" || !/^\d+$/.test(identity.startTicks)) {
    throw new Error("invalid durable resident process identity");
  }
}

function rememberProcessTreeIdentity(
  child: ChildProcessWithoutNullStreams
): LinuxProcessTreeIdentity | undefined {
  if (process.platform !== "linux" || !child.pid) return undefined;
  try {
    const identity = captureLinuxProcessTreeIdentity(child.pid);
    PROCESS_TREE_IDENTITIES.set(child, identity);
    return identity;
  } catch {
    // A just-spawned process may exit before /proc is readable. The ordinary
    // ChildProcess signal remains the safe fallback in that case.
    return undefined;
  }
}

function captureLinuxProcessTreeIdentity(pid: number): LinuxProcessTreeIdentity {
  const parentProcPid = Number.parseInt(
    readFileSync("/proc/self/stat", "utf8").split(" ", 1)[0] ?? "",
    10
  );
  if (!Number.isSafeInteger(parentProcPid) || parentProcPid <= 1) {
    throw new Error("invalid parent process identity");
  }
  for (const entry of readdirSync("/proc")) {
    if (!/^\d+$/.test(entry)) continue;
    const procPid = Number.parseInt(entry, 10);
    try {
      const status = readFileSync(`/proc/${entry}/status`, "utf8");
      const namespacePid = namespaceProcessId(status, "NSpid") ?? procPid;
      if (namespacePid !== pid) continue;
      const stat = readFileSync(`/proc/${entry}/stat`, "utf8");
      const close = stat.lastIndexOf(")");
      const tail = close >= 0 ? stat.slice(close + 2).trim().split(/\s+/) : [];
      const parentPid = Number.parseInt(tail[1] ?? "", 10);
      const processGroupId = Number.parseInt(tail[2] ?? "", 10);
      const sessionId = Number.parseInt(tail[3] ?? "", 10);
      // detached:true creates a new session before spawn returns. Requiring
      // that relationship and our own outer parent PID disambiguates equal
      // nested-namespace PIDs exposed by a host-mounted /proc.
      if (parentPid !== parentProcPid || processGroupId !== procPid || sessionId !== procPid) {
        continue;
      }
      return readLinuxProcessTreeIdentity(pid, procPid);
    } catch { /* Candidate exited during capture. */ }
  }
  throw new Error("spawned process identity is unavailable");
}

function readLinuxProcessTreeIdentity(pid: number, procPid: number): LinuxProcessTreeIdentity {
  const stat = readFileSync(`/proc/${procPid}/stat`, "utf8");
  const status = readFileSync(`/proc/${procPid}/status`, "utf8");
  const bootId = readFileSync("/proc/sys/kernel/random/boot_id", "utf8").trim();
  const close = stat.lastIndexOf(")");
  const tail = close >= 0 ? stat.slice(close + 2).trim().split(/\s+/) : [];
  const startTicks = tail[19];
  const namespacePid = namespaceProcessId(status, "NSpid") ?? procPid;
  const observedProcessGroupId = namespaceProcessId(status, "NSpgid") ??
    Number.parseInt(tail[2] ?? "", 10);
  const procProcessGroupId = Number.parseInt(tail[2] ?? "", 10);
  const procSessionId = Number.parseInt(tail[3] ?? "", 10);
  if (!startTicks || !/^\d+$/.test(startTicks) ||
    namespacePid !== pid || !Number.isSafeInteger(procPid) || procPid <= 1 ||
    !Number.isSafeInteger(observedProcessGroupId) || observedProcessGroupId <= 1) {
    throw new Error("invalid process identity");
  }
  // libuv's detached spawn makes the child PID the intended PGID. Never use
  // an innermost NSpgid value here: in nested PID namespaces it may be `1`,
  // where process.kill(-1, ...) would target every signalable process.
  return {
    pid,
    procPid,
    processGroupId: pid,
    observedProcessGroupId,
    procProcessGroupId,
    procSessionId,
    pidNamespace: readlinkSync(`/proc/${procPid}/ns/pid`),
    bootId,
    startTicks
  };
}

function sameLinuxProcessIdentity(
  left: LinuxProcessTreeIdentity,
  right: LinuxProcessTreeIdentity
): boolean {
  return left.pid === right.pid &&
    left.procPid === right.procPid &&
    left.procProcessGroupId === right.procProcessGroupId &&
    left.procSessionId === right.procSessionId &&
    left.pidNamespace === right.pidNamespace &&
    left.bootId === right.bootId &&
    left.startTicks === right.startTicks;
}

function ownedLinuxProcessGroup(identity: LinuxProcessTreeIdentity): boolean {
  if (process.platform !== "linux") return false;
  let bootId: string;
  try { bootId = readFileSync("/proc/sys/kernel/random/boot_id", "utf8").trim(); }
  catch { return false; }
  if (bootId !== identity.bootId) return false;
  try {
    const leader = readLinuxProcessTreeIdentity(identity.pid, identity.procPid);
    // A PID-reused group leader is never an authorized signal target.
    return sameLinuxProcessIdentity(identity, leader) &&
      leader.observedProcessGroupId === identity.processGroupId;
  } catch {
    // The original leader exited. Linux retains its PGID while descendants are
    // members, and that numeric PID cannot be reused as a new leader meanwhile.
  }
  try {
    for (const entry of readdirSync("/proc")) {
      if (!/^\d+$/.test(entry)) continue;
      try {
        if (readlinkSync(`/proc/${entry}/ns/pid`) !== identity.pidNamespace) continue;
        const status = readFileSync(`/proc/${entry}/status`, "utf8");
        if (/^State:\s+Z\b/m.test(status)) continue;
        const memberPid = namespaceProcessId(status, "NSpid") ?? Number(entry);
        const memberGroup = namespaceProcessId(status, "NSpgid") ?? memberPid;
        if (memberGroup !== identity.processGroupId) continue;
        // Seeing a different process at the old leader PID proves reuse.
        if (memberPid === identity.pid) return false;
        return true;
      } catch { /* Process exited during the scan. */ }
    }
  } catch { /* /proc became unavailable. */ }
  return false;
}

/** Strict durable-claim inspection: uncertainty is never treated as absence. */
function claimedLinuxProcessGroupLive(identity: LinuxProcessTreeIdentity): boolean {
  assertLinuxProcessTreeIdentity(identity);
  let bootId: string;
  try {
    bootId = readFileSync("/proc/sys/kernel/random/boot_id", "utf8").trim();
  } catch (error) {
    throw new Error("Unable to verify the claimed resident boot identity", { cause: error });
  }
  // An earlier kernel boot cannot retain this physical process group. Check
  // that proof before comparing namespaces whose IDs belong to the old boot;
  // never signal a colliding current PID or manufacture Agent completion.
  if (bootId !== identity.bootId) return false;
  let callerPidNamespace: string;
  try { callerPidNamespace = readlinkSync("/proc/self/ns/pid"); } catch (error) {
    throw new Error("Unable to verify the cleanup caller PID namespace", { cause: error });
  }
  if (callerPidNamespace !== identity.pidNamespace) {
    throw new Error("Claimed resident belongs to another PID namespace");
  }
  try {
    const status = readFileSync(`/proc/${identity.procPid}/status`, "utf8");
    const leader = readLinuxProcessTreeIdentity(identity.pid, identity.procPid);
    if (!sameLinuxProcessIdentity(identity, leader) ||
      leader.observedProcessGroupId !== identity.processGroupId) {
      // A fully observed different process at the durable proc row proves
      // reuse; never signal the replacement, including a zombie replacement.
      return false;
    }
    if (!/^State:\s+Z\b/m.test(status)) return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT" && code !== "ESRCH") {
      throw new Error("Unable to verify the claimed resident group leader", { cause: error });
    }
  }

  let entries: string[];
  try { entries = readdirSync("/proc"); } catch (error) {
    throw new Error("Unable to scan the claimed resident process group", { cause: error });
  }
  for (const entry of entries) {
    if (!/^\d+$/.test(entry)) continue;
    try {
      const stat = readFileSync(`/proc/${entry}/stat`, "utf8");
      const close = stat.lastIndexOf(")");
      const fields = close >= 0 ? stat.slice(close + 2).trim().split(/\s+/) : [];
      if (fields[0] === "Z") continue;
      const memberProcPid = Number.parseInt(stat.split(" ", 1)[0] ?? "", 10);
      const memberGroup = Number.parseInt(fields[2] ?? "", 10);
      if (memberGroup !== identity.procProcessGroupId) continue;
      // If the old numeric leader was fully reused, its new group is not ours.
      if (memberProcPid === identity.procPid) return false;
      return true;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT" || code === "ESRCH") continue;
      throw new Error("Unable to verify a possible claimed resident group member", {
        cause: error
      });
    }
  }
  return false;
}

async function waitForOwnedProcessTreeExit(
  child: ChildProcessWithoutNullStreams,
  deadline: number
): Promise<boolean> {
  if (process.platform === "win32") {
    while (Date.now() < deadline) {
      if (child.exitCode !== null || child.signalCode !== null) return true;
      await delay(Math.min(20, Math.max(1, deadline - Date.now())));
    }
    return child.exitCode !== null || child.signalCode !== null;
  }
  const identity = PROCESS_TREE_IDENTITIES.get(child);
  if (!identity) {
    while (Date.now() < deadline) {
      if (child.exitCode !== null || child.signalCode !== null) {
        if (!nativeProcessScope(child)?.live()) return true;
        nativeProcessScope(child)?.signal("SIGKILL");
      }
      await delay(Math.min(20, Math.max(1, deadline - Date.now())));
    }
    return (child.exitCode !== null || child.signalCode !== null) && !nativeProcessScope(child)?.live();
  }
  while (Date.now() < deadline) {
    if (!ownedLinuxProcessGroup(identity) && !nativeProcessScope(child)?.live()) return true;
    if (child.exitCode !== null || child.signalCode !== null) nativeProcessScope(child)?.signal("SIGKILL");
    await delay(Math.min(20, Math.max(1, deadline - Date.now())));
  }
  return !ownedLinuxProcessGroup(identity) && !nativeProcessScope(child)?.live();
}

export async function writeStreamWithBackpressure(
  stream: NodeJS.WritableStream,
  value: string
): Promise<void> {
  if (stream.write(value)) return;
  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      stream.removeListener("drain", onDrain);
      stream.removeListener("error", onError);
      stream.removeListener("close", onClose);
    };
    const onDrain = () => { cleanup(); resolve(); };
    const onError = (error: Error) => { cleanup(); reject(error); };
    const onClose = () => { cleanup(); reject(new Error("Stream closed before buffered data drained")); };
    stream.once("drain", onDrain);
    stream.once("error", onError);
    stream.once("close", onClose);
  });
}

/** Launch JavaScript npm entrypoints through Node on Windows, without cmd shims. */
export function harnessExecutableLaunch(executable: string, args: readonly string[]): { command: string; args: string[] } {
  return process.platform === "win32" && [".js", ".mjs", ".cjs"].includes(path.extname(executable).toLowerCase())
    ? { command: process.execPath, args: [executable, ...args] }
    : { command: executable, args: [...args] };
}
