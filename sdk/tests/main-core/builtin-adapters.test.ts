import { afterEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { zstdCompressSync } from "node:zlib";
import type { AgentRunRequest, ProjectState } from "../../src/core/types.js";
import { HarnessRuntimeFacade } from "../../src/core/harness-runtime/runtime.js";
import { CodexRunner } from "../../src/core/codex-runner.js";
import type { SessionRef } from "../../src/core/harness-runtime/contracts.js";
import {
  DshAdapter,
  dshExplainerPatch, dshSelectedSkillsPatch,
  dshNativeSdkPatch,
  dshSessionArtifactPath
} from "../../src/core/harness-runtime/adapters/dsh-adapter.js";
import { piMcpConfig } from "../../src/core/harness-runtime/adapters/pi-adapter.js";

const roots: string[] = [];

afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(roots.splice(0).map((root) =>
    fs.rm(root, { recursive: true, force: true })
  ));
});

async function fakePiExecutable(
  root: string,
  behavior: "normal" | "malformed-hang" | "resume-mismatch" | "work-before-session" = "normal"
): Promise<{ executable: string; capture: string; terminated: string; later: string }> {
  const executable = path.join(root, "fake-pi.mjs");
  const capture = path.join(root, "pi-capture.jsonl");
  const terminated = path.join(root, "pi-terminated.txt");
  const later = path.join(root, "pi-later.txt");
  await fs.writeFile(executable, `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const args = process.argv.slice(2);
const sessionIndex = args.indexOf("--session");
const behavior = ${JSON.stringify(behavior)};
let input = "";
for await (const chunk of process.stdin) input += chunk;
const prompt = input || args.at(-1) || "";
const lineValue = (prefix, suffix) => {
  const line = prompt.split("\\n").find((value) => value.startsWith(prefix));
  return line && line.endsWith(suffix)
    ? line.slice(prefix.length, -suffix.length)
    : "";
};
const inboxPath = lineValue("Current task Inbox: ", ". Its exact current instructions are included below; use the context index for background and do not reload unchanged material.") || lineValue("Current task Inbox: ", ". Open it for your assigned task; use the context index for background records and read details only when needed.") || lineValue("Read the invocation Inbox at ", ".") || (prompt.includes("项目入口：") && process.env.SCIENCEEVOLVE_INVOCATION_ID ? process.cwd() + "/.scienceevolve/inbox/" + process.env.SCIENCEEVOLVE_INVOCATION_ID + ".md" : "");
const memoryPath =
  lineValue("Persistent project memory: ", ". Consult relevant portions when needed; do not reload unchanged memory or entire histories by default.") ||
  lineValue("Read persistent project memory at ", " before acting.") ||
  lineValue("Read persistent Agent memory at ", " before acting.") || (prompt.includes("项目入口：") && process.env.SCIENCEEVOLVE_INVOCATION_ID ? process.cwd() + "/Memory.md" : "");
process.on("SIGTERM", () => {
  fs.writeFileSync(${JSON.stringify(terminated)}, "terminated\\n");
  process.exit(0);
});
const sessionPath = sessionIndex >= 0 ? args[sessionIndex + 1] : "";
const resumedHeader = sessionPath && fs.existsSync(sessionPath)
  ? JSON.parse(fs.readFileSync(sessionPath, "utf8").split("\\n")[0])
  : null;
const sessionId = behavior === "resume-mismatch" && resumedHeader
  ? "fixture-pi-mismatched-session"
  : "fixture-pi-session";
if (sessionPath) {
  fs.mkdirSync(path.dirname(sessionPath), { recursive: true });
  fs.writeFileSync(sessionPath, JSON.stringify({
    type: "session",
    version: 3,
    id: sessionId,
    timestamp: new Date().toISOString(),
    cwd: process.cwd()
  }) + "\\n");
}
const inspireProbe = process.env.SCIENCEEVOLVE_AGENT_PERMISSION === "compute"
  ? spawnSync("inspire", ["job", "create", "--name", "pi-compute-probe", "--workspace", "fixture", "--group", "H200", "--quota", "1,1,1", "--nodes", "1", "--command", "true"], { encoding: "utf8" })
  : null;
fs.appendFileSync(${JSON.stringify(capture)}, JSON.stringify({
  args,
  prompt,
  inboxPath,
  memoryPath,
  inbox: inboxPath ? fs.readFileSync(inboxPath, "utf8") : null,
  memory: memoryPath ? fs.readFileSync(memoryPath, "utf8") : null,
  permission: process.env.SCIENCEEVOLVE_AGENT_PERMISSION,
  inspireStatus: inspireProbe?.status ?? null,
  inspireLedger: process.env.SCIENCEEVOLVE_INSPIRE_WORKLOAD_LEDGER ?? null,
  inspirePath: process.env.PATH?.split(":")[0] ?? null,
  inspireConfigPath: process.env.INSPIRE_GLOBAL_CONFIG_PATH ?? null,
  inspireWorkspaceRoot: process.env.SCIENCEEVOLVE_INSPIRE_WORKSPACE_ROOT ?? null,
  noProxy: process.env.NO_PROXY ?? null,
  webSearchEnabled: process.env.SCIENCEEVOLVE_WEB_SEARCH_ENABLED ?? null,
  mcpConfig: JSON.parse(process.env.SCIENCEEVOLVE_PI_MCP_CONFIG ?? "[]")
}) + "\\n");
const emitWork = () => {
  console.log(JSON.stringify({ type: "tool_execution_start", toolCallId: "read-1", toolName: "read", args: { path: "Memory.md" } }));
  console.log(JSON.stringify({ type: "tool_execution_end", toolCallId: "read-1", toolName: "read", result: "fixture memory", isError: false }));
  console.log(JSON.stringify({ type: "message_end", message: { role: "assistant", content: [{ type: "text", text: "Pi fixture complete." }] } }));
};
if (behavior === "work-before-session") emitWork();
console.log(JSON.stringify({ type: "session", id: sessionId }));
if (behavior === "malformed-hang") {
  console.error("Authorization: Bearer fixture-private-token");
  process.stdout.write('{"type":"tool_execution_start" broken}\\n');
  setTimeout(() => {
    fs.writeFileSync(${JSON.stringify(later)}, "late output was reached\\n");
    console.log(JSON.stringify({ type: "message_end", message: {
      role: "assistant", content: [{ type: "text", text: "must not be emitted" }]
    } }));
  }, 250);
  setTimeout(() => process.exit(0), 1000);
} else if (behavior !== "work-before-session") emitWork();
`, { encoding: "utf8", mode: 0o700 });
  return { executable, capture, terminated, later };
}

type FakeDshBehavior =
  | "normal"
  | "activity-delay"
  | "turn-timeout-once"
  | "resume-no-handoff"
  | "sequence-gap"
  | "sequence-replay"
  | "resume-identity-mismatch"
  | "resume-text-error"
  | "resume-bad-id"
  | "resume-bad-sequence"
  | "resume-regressed-sequence"
  | "malformed-hang";

async function fakeDshExecutable(
  root: string,
  behavior: FakeDshBehavior = "normal"
): Promise<{ executable: string; capture: string; terminated: string; later: string }> {
  const executable = path.join(root, "fake-dsh.mjs");
  const capture = path.join(root, "dsh-capture.jsonl");
  const terminated = path.join(root, "dsh-terminated.txt");
  const later = path.join(root, "dsh-later.txt");
  await fs.writeFile(executable, `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { zstdCompressSync } from "node:zlib";
import { spawnSync } from "node:child_process";
const args = process.argv.slice(2);
const patchIndex = args.lastIndexOf("--patch");
const patch = patchIndex >= 0 ? fs.readFileSync(args[patchIndex + 1], "utf8") : "";
let pending = "";
let nextEventSeq = 0;
const behavior = ${JSON.stringify(behavior)};
process.on("SIGTERM", () => {
  fs.writeFileSync(${JSON.stringify(terminated)}, "terminated\\n");
  process.exit(0);
});
const encodeSegment = (raw) => {
  if (raw === ".") return "~002E";
  if (raw === "..") return "~002E~002E";
  let encoded = "";
  for (let index = 0; index < raw.length; index += 1) {
    const code = raw.charCodeAt(index);
    const character = String.fromCharCode(code);
    encoded += character !== "~" && /^[A-Za-z0-9._-]$/.test(character)
      ? character
      : "~" + code.toString(16).toUpperCase().padStart(4, "0");
  }
  return encoded;
};
const projectKey = (cwd) => {
  let readable = "";
  let separatorRun = false;
  for (let index = 0; index < cwd.length; index += 1) {
    const code = cwd.charCodeAt(index);
    const character = String.fromCharCode(code);
    if (character === "/" || character === "\\\\" || character === ":") {
      if (!separatorRun) readable += "-";
      separatorRun = true;
    } else if (character !== "~" && /^[A-Za-z0-9._-]$/.test(character)) {
      readable += character;
      separatorRun = false;
    } else {
      readable += "~" + code.toString(16).toUpperCase().padStart(4, "0");
      separatorRun = false;
    }
  }
  const slug = readable.replace(/^-+/, "") || "root";
  return "--" + slug.slice(0, 251) + "--";
};
const sessionArtifact = (sessionId) => path.join(
  process.env.DSH_HOME,
  "sessions",
  projectKey(process.cwd()),
  encodeSegment(sessionId),
  "session.jsonl.zstd"
);
const emit = (value) => process.stdout.write(JSON.stringify(value) + "\\n");
const event = (sessionId, type, data) => {
  const seq = behavior === "sequence-gap" && type === "tool/result"
    ? nextEventSeq + 1
    : behavior === "sequence-replay" && type === "tool/result"
      ? nextEventSeq - 1
    : nextEventSeq;
  nextEventSeq = seq + 1;
  emit({
    jsonrpc: "2.0",
    method: "session.event",
    params: { sessionId, event: { type, seq, time: Date.now(), data } }
  });
};
const handle = (request) => {
  const prompt = request.method === "session/prompt"
    ? (request.params.contentBlocks ?? [])
        .filter((block) => block?.type === "text" && typeof block.text === "string")
        .map((block) => block.text)
        .join("\\n")
    : "";
  const lineValue = (prefix, suffix) => {
    const line = prompt.split("\\n").find((value) => value.startsWith(prefix));
    return line && line.endsWith(suffix)
      ? line.slice(prefix.length, -suffix.length)
      : "";
  };
  const inboxPath = prompt ? lineValue("Current task Inbox: ", ". Its exact current instructions are included below; use the context index for background and do not reload unchanged material.") || lineValue("Current task Inbox: ", ". Open it for your assigned task; use the context index for background records and read details only when needed.") || lineValue("Read the invocation Inbox at ", ".") || (prompt.includes("项目入口：") && process.env.SCIENCEEVOLVE_INVOCATION_ID ? process.cwd() + "/.scienceevolve/inbox/" + process.env.SCIENCEEVOLVE_INVOCATION_ID + ".md" : "") : "";
  const memoryPath = prompt
    ? lineValue("Persistent project memory: ", ". Consult relevant portions when needed; do not reload unchanged memory or entire histories by default.") ||
      lineValue("Read persistent project memory at ", " before acting.") ||
      lineValue("Read persistent Agent memory at ", " before acting.") || (prompt.includes("项目入口：") && process.env.SCIENCEEVOLVE_INVOCATION_ID ? process.cwd() + "/Memory.md" : "")
    : "";
  const inspireProbe = prompt && process.env.SCIENCEEVOLVE_AGENT_PERMISSION === "compute"
    ? spawnSync("inspire", ["job", "create", "--name", "dsh-compute-probe", "--workspace", "fixture", "--group", "H100", "--quota", "1,1,1", "--nodes", "1", "--command", "true"], { encoding: "utf8" }) : undefined;
  fs.appendFileSync(${JSON.stringify(capture)}, JSON.stringify({
    args,
    patch: fs.readFileSync(args[args.lastIndexOf("--patch") + 1], "utf8"),
    permissionMode: process.env.DSH_PERMISSION_MODE ?? null,
    request,
    patch,
    permission: process.env.SCIENCEEVOLVE_AGENT_PERMISSION,
    webSearchEnabled: process.env.SCIENCEEVOLVE_WEB_SEARCH_ENABLED,
    inspireStatus: inspireProbe?.status ?? null,
    inspireLedger: process.env.SCIENCEEVOLVE_INSPIRE_WORKLOAD_LEDGER ?? null,
    inspirePath: process.env.PATH?.split(path.delimiter)[0] ?? null,
    inspireConfigPath: process.env.INSPIRE_GLOBAL_CONFIG_PATH ?? null,
    inspireWorkspaceRoot: process.env.SCIENCEEVOLVE_INSPIRE_WORKSPACE_ROOT ?? null,
    noProxy: process.env.NO_PROXY ?? null,
    ...(prompt ? {
      prompt,
      inboxPath,
      memoryPath,
      inbox: inboxPath ? fs.readFileSync(inboxPath, "utf8") : null,
      memory: memoryPath ? fs.readFileSync(memoryPath, "utf8") : null
    } : {})
  }) + "\\n");
  if (request.method === "initialize") {
    emit({ jsonrpc: "2.0", id: request.id, result: {
      serverInfo: { name: "deepseek-harness-sdk-runtime", version: "0.0.1" }
    } });
    return;
  }
  if (request.method === "session/resume") {
    const sessionId = request.params.sessionId;
    if (!fs.existsSync(sessionArtifact(sessionId))) throw new Error("Cannot resume a missing session");
    nextEventSeq = 39;
    event(sessionId, "sandbox/mode", { mode: "workspace-write" });
    if (behavior === "activity-delay") {
      emit({ jsonrpc: "2.0", method: "session.status", params: { sessionId, status: "running" } });
      emit({ jsonrpc: "2.0", method: "session.status", params: { sessionId, status: "idle" } });
    }
    emit({ jsonrpc: "2.0", id: request.id, result: {
      sessionId: behavior === "resume-bad-id" ? sessionId + "-wrong" : sessionId,
      lastSequence: behavior === "resume-bad-sequence" ? 1.5
        : behavior === "resume-regressed-sequence" ? 38 : 39
    } });
    return;
  }
  if (request.method === "session/prompt") {
    const sessionId = request.params.sessionId;
    const artifact = sessionArtifact(sessionId);
    const resumed = fs.existsSync(artifact);
    if (behavior === "resume-text-error" && resumed) {
      emit({
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32603, message: "session not found" }
      });
      return;
    }
    fs.mkdirSync(path.dirname(artifact), { recursive: true });
    if (!resumed) {
      const header = JSON.stringify({
        type: "session",
        version: 0,
        id: sessionId,
        createdAt: Date.now(),
        cwd: process.cwd(),
        delegationDepth: 0
      }) + "\\n";
      fs.writeFileSync(artifact, zstdCompressSync(Buffer.from(header)));
    }
    const officialSessionId = behavior === "resume-identity-mismatch" && resumed
      ? sessionId + "-unexpected"
      : sessionId;
    emit({ jsonrpc: "2.0", id: request.id, result: { messageId: "fixture-user-message" } });
    emit({ jsonrpc: "2.0", method: "session.status", params: { sessionId: officialSessionId, status: "running" } });
    event(officialSessionId, "turn/start", { turn: 1 });
    if (behavior === "malformed-hang") {
      console.error("Authorization: Bearer fixture-private-token");
      process.stdout.write('{"jsonrpc":"2.0","method":"session.event" broken}\\n');
      setTimeout(() => {
        fs.writeFileSync(${JSON.stringify(later)}, "late output was reached\\n");
        event(officialSessionId, "assistant/message", {
          turn: 1,
          step: 1,
          message: { role: "assistant", content: [{ type: "text", text: "must not be emitted" }] }
        });
      }, 250);
      setTimeout(() => process.exit(0), 1000);
      return;
    }
    if (behavior === "activity-delay") {
      setTimeout(() => {
        event(officialSessionId, "assistant/chunk", {
          turn: 1,
          step: 1,
          chunk: { type: "text-delta", delta: "still working" }
        });
      }, 25);
      setTimeout(() => {
        event(officialSessionId, "assistant/message", {
          turn: 1,
          step: 1,
          message: {
            role: "assistant",
            content: [{ type: "text", text: "DSH delayed fixture complete." }]
          },
          usage: { input_tokens: 12, output_tokens: 5, total_tokens: 17 }
        });
        event(officialSessionId, "turn/end", { turn: 1, reason: { kind: "completed" } });
        emit({ jsonrpc: "2.0", method: "session.status", params: { sessionId: officialSessionId, status: "idle" } });
      }, 55);
      return;
    }
    if (behavior === "turn-timeout-once" && !fs.existsSync(${JSON.stringify(later)})) {
      fs.writeFileSync(${JSON.stringify(later)}, "first DSH turn intentionally remained active\\n");
      return;
    }
    if (behavior === "resume-no-handoff" && resumed) {
      event(officialSessionId, "turn/end", { turn: 1, reason: { kind: "interrupted" } });
      emit({ jsonrpc: "2.0", method: "session.status", params: { sessionId: officialSessionId, status: "idle" } });
      return;
    }
    event(officialSessionId, "tool/call", {
      turn: 1,
      step: 1,
      callId: "read-1",
      name: "Read",
      arguments: JSON.stringify({ file_path: "Memory.md" })
    });
    event(officialSessionId, "tool/result", {
      turn: 1,
      step: 1,
      message: {
        toolCallId: "read-1",
        toolName: "Read",
        content: "fixture memory",
        isError: false
      }
    });
    event(officialSessionId, "assistant/message", {
      turn: 1,
      step: 1,
      message: {
        role: "assistant",
        content: [{ type: "text", text: "DSH fixture complete." }]
      },
      usage: { input_tokens: 12, output_tokens: 5, total_tokens: 17 }
    });
    event(officialSessionId, "turn/end", { turn: 1, reason: { kind: "completed" } });
    emit({ jsonrpc: "2.0", method: "session.status", params: { sessionId: officialSessionId, status: "idle" } });
    return;
  }
  if (request.method === "shutdown") {
    emit({ jsonrpc: "2.0", id: request.id, result: {} });
  }
};
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  pending += chunk;
  const lines = pending.split(/\\r?\\n/);
  pending = lines.pop() ?? "";
  for (const line of lines) {
    if (line.trim()) handle(JSON.parse(line));
  }
});
`, { encoding: "utf8", mode: 0o700 });
  return { executable, capture, terminated, later };
}

async function fakeInspireExecutable(root: string): Promise<string> {
  const executable = path.join(root, "fake-inspire.sh");
  await fs.writeFile(
    executable,
    "#!/bin/sh\necho 'fixture Inspire command completed'\n",
    { encoding: "utf8", mode: 0o700 }
  );
  return executable;
}

async function fakeCodexExplainerExecutable(root: string): Promise<{
  executable: string;
  capture: string;
}> {
  const executable = path.join(root, "fake-codex-explainer.mjs");
  const capture = path.join(root, "codex-explainer-capture.json");
  await fs.writeFile(executable, `#!/usr/bin/env node
import fs from "node:fs";
const args = process.argv.slice(2);
let prompt = "";
for await (const chunk of process.stdin) prompt += chunk;
fs.writeFileSync(${JSON.stringify(capture)}, JSON.stringify({ args, prompt }));
for (const event of [
  { type: "thread.started", thread_id: "thread_codex_explainer" },
  { type: "turn.started" },
  { type: "item.completed", item: { id: "answer", type: "agent_message", text: "The evidence is from the worker inbox." } },
  { type: "turn.completed", usage: { input_tokens: 10, output_tokens: 8 } }
]) console.log(JSON.stringify(event));
`, { encoding: "utf8", mode: 0o700 });
  return { executable, capture };
}

async function fakePiResumeExecutable(root: string): Promise<{ executable: string; capture: string }> {
  const executable = path.join(root, "fake-pi-resume.mjs");
  const capture = path.join(root, "pi-resume-capture.jsonl");
  await fs.writeFile(executable, `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
const args = process.argv.slice(2);
const sessionIndex = args.indexOf("--session");
const sessionPath = args[sessionIndex + 1];
const sessionId = "fixture-pi-replacement";
fs.mkdirSync(path.dirname(sessionPath), { recursive: true });
fs.writeFileSync(sessionPath, JSON.stringify({
  type: "session",
  version: 3,
  id: sessionId,
  timestamp: new Date().toISOString(),
  cwd: process.cwd()
}) + "\\n");
fs.appendFileSync(${JSON.stringify(capture)}, JSON.stringify({ args }) + "\\n");
console.log(JSON.stringify({ type: "session", id: sessionId }));
console.log(JSON.stringify({ type: "tool_execution_start", toolCallId: "read-replacement", toolName: "read", args: { path: "Memory.md" } }));
console.log(JSON.stringify({ type: "tool_execution_end", toolCallId: "read-replacement", toolName: "read", result: "replacement memory", isError: false }));
console.log(JSON.stringify({ type: "message_end", message: { role: "assistant", content: [{ type: "text", text: "Pi replacement complete." }] } }));
`, { encoding: "utf8", mode: 0o700 });
  return { executable, capture };
}

async function workflowRequest(
  root: string,
  kind: "main" | "worker",
  invocationId: string,
  harness = "dsh"
): Promise<AgentRunRequest> {
  const projectId = kind === "main"
    ? `prj_${"1".repeat(32)}`
    : `prj_${"2".repeat(32)}`;
  const projectPath = path.join(root, projectId);
  const workspacePath = path.join(projectPath, "workspaces");
  const messagesPath = path.join(projectPath, "messages");
  const runtimePath = path.join(projectPath, "runtime", invocationId);
  const inboxPath = path.join(
    messagesPath,
    `0001_${invocationId}_to_${kind}.md`
  );
  await Promise.all([
    fs.mkdir(workspacePath, { recursive: true }),
    fs.mkdir(messagesPath, { recursive: true }),
    fs.mkdir(runtimePath, { recursive: true })
  ]);
  await Promise.all([
    fs.writeFile(inboxPath, `${kind} authoritative inbox\n`, "utf8"),
    fs.writeFile(path.join(workspacePath, "Memory.md"), `${kind} persistent memory\n`, "utf8")
  ]);
  const project = {
    id: projectId,
    agents: {
      [kind]: {
        model: "fixture-model",
        harness,
        gatewayId: "gwy_fixture",
        gatewaySnapshot: {
          id: "gwy_fixture",
          name: "Fixture Gateway",
          url: "https://gateway.example.test/v1",
          apiKey: "fixture-secret",
          models: ["fixture-model"],
          defaultModel: "fixture-model",
          protocol: "responses",
          nativeProtocol: harness === "pi" ? "chat-completions" : "anthropic-messages",
          routeMode: "proxy"
        },
        skills: [],
        autoSkills: [],
        mcpServers: [],
        instructions: "Read the assigned inputs and return a concise handoff.",
        reasoningEffort: "high",
        permission: "workspace",
        webSearch: false,
        sessionPersistence: kind === "main",
        decisionBy: "main"
      }
    },
    agentSessionIds: {},
    agentSessions: {},
    agentSessionMeta: {}
  } as unknown as ProjectState;
  return {
    project,
    agent: kind,
    kind,
    permission: "workspace",
    invocationId,
    inboxPath,
    projectPath,
    workspacePath,
    schemaPath: path.join(projectPath, "schema.json"),
    skillPaths: [],
    autoSkillPaths: [],
    availableSkillPaths: [],
    runtimePath,
    onModelActivity: vi.fn()
  };
}

type CleanupHarnessId = "pi" | "dsh";

async function cleanupFailureFixture(
  root: string,
  harnessId: CleanupHarnessId,
  behavior: "normal" | "malformed-hang"
): Promise<{
  runtime: HarnessRuntimeFacade;
  request: AgentRunRequest;
  cleanupPath: string;
  cleanupOperation: "remove" | "write";
}> {
  const executable = harnessId === "pi"
      ? (await fakePiExecutable(root, behavior)).executable
      : (await fakeDshExecutable(root, behavior)).executable;
  const runtime = new HarnessRuntimeFacade({
    harnessExecutables: { [harnessId]: executable },
    protocolProxyFactory: vi.fn(async () => ({
      baseUrl: "http://127.0.0.1:43198/v1",
      token: "invocation-token",
      close: async () => undefined
    }))
  });
  const request = await workflowRequest(
    root,
    "worker",
    `inv_${harnessId.replaceAll("-", "_")}_${behavior.replaceAll("-", "_")}`,
    harnessId
  );
  return {
    runtime,
    request,
    cleanupPath: path.join(
      request.runtimePath,
      harnessId === "dsh"
          ? "dsh-openfars.patch.yml"
          : "pi-stdout.log"
    ),
    cleanupOperation: harnessId === "pi" ? "write" : "remove"
  };
}

function rejectFixtureCleanup(
  cleanupPath: string,
  operation: "remove" | "write"
) {
  const expected = path.resolve(cleanupPath);
  if (operation === "remove") {
    const original = fs.rm.bind(fs);
    return vi.spyOn(fs, "rm").mockImplementation(async (target, options) => {
      if (path.resolve(String(target)) === expected) {
        throw new Error("fixture credential removal failure");
      }
      await original(target, options);
    });
  }
  const original = fs.writeFile.bind(fs);
  return vi.spyOn(fs, "writeFile").mockImplementation(async (target, data, options) => {
    if (path.resolve(String(target)) === expected) {
      throw new Error("fixture diagnostic write failure");
    }
    await original(target, data, options);
  });
}

async function explainerSnapshot(request: AgentRunRequest): Promise<{
  workspacePath: string;
  inboxPath: string;
  memoryPath: string;
}> {
  const workspacePath = path.join(request.runtimePath, "explainer-snapshot");
  const inboxPath = path.join(
    workspacePath,
    ".scienceevolve",
    `${request.invocationId}.md`
  );
  const memoryPath = path.join(workspacePath, "Memory.md");
  await fs.mkdir(path.dirname(inboxPath), { recursive: true });
  await Promise.all([
    fs.copyFile(request.inboxPath, inboxPath),
    fs.copyFile(path.join(request.workspacePath, "Memory.md"), memoryPath)
  ]);
  return { workspacePath, inboxPath, memoryPath };
}

describe("built-in Harness Adapters", () => {
  it.each(["codex", "pi", "dsh"] as const)("injects only product assistant tools into the native %s Explainer", async harness => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-native-assistant-")); roots.push(root);
    const fake = harness === "codex" ? await fakeCodexExplainerExecutable(root) : harness === "pi" ? await fakePiExecutable(root) : await fakeDshExecutable(root);
    const runtime = new HarnessRuntimeFacade({ harnessExecutables: { [harness]: fake.executable },
      protocolProxyFactory: vi.fn(async () => ({ baseUrl: "http://127.0.0.1:43198/v1", token: "invocation-token", close: async () => undefined })) });
    const source = await workflowRequest(root, "worker", `inv_${harness}_assistant`, harness), snapshot = await explainerSnapshot(source);
    const gateway = source.project.agents.worker!.gatewaySnapshot!;
    const url = `http://127.0.0.1:43199/mcp/${"a".repeat(48)}`;
    const input = { invocationId: source.invocationId, projectId: source.project.id, projectPath: source.projectPath,
      workspacePath: snapshot.workspacePath, runtimePath: source.runtimePath, inboxPath: snapshot.inboxPath, memoryPath: snapshot.memoryPath,
      harnessId: harness, gateway: { id: gateway.id, name: gateway.name, url: gateway.url, apiKey: gateway.apiKey, models: gateway.models,
        defaultModel: gateway.defaultModel, protocol: gateway.protocol }, model: "fixture-model", reasoningEffort: "low" as const,
      prompt: "Use supplied product tools to save a draft without starting research.", assistantMcp: { url }, onTrace: () => undefined, onEvent: () => undefined };
    await runtime.runExplainer(input, new AbortController().signal);
    const raw = await fs.readFile(fake.capture, "utf8"), capture = JSON.parse(raw.trim().split("\n")[0]);
    expect(raw).toContain("openfars-project-explainer"); expect(raw).toContain(url);
    expect(raw).not.toContain("scienceevolve-workspace"); expect(raw).not.toContain("scienceevolve-control");
    if (harness === "pi") {
      expect(capture.args).not.toContain("--no-builtin-tools"); expect(capture.args).not.toContain("--no-tools");
      expect(capture.args).toContain("--extension");
    }
    if (harness === "dsh") { expect(capture.patch).not.toContain("- id: tool-fs\n  disabled: true"); expect(capture.patch).toContain("includeDefaultRoots: false"); }
    if (harness === "codex") expect(capture.args).toEqual(expect.arrayContaining(["-s", "danger-full-access", "skip_host_skill_discovery"]));
    await expect(runtime.runExplainer({ ...input, assistantMcp: { url: "https://external.example/mcp" } }, new AbortController().signal)).rejects.toThrow();
  });
  it.each(["codex", "pi", "dsh"])("uses the service shell environment for %s even when an old Agent config contains a proxy mode", async harness => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-service-network-")); roots.push(root);
    const native = harness === "codex" ? await fakeCodexExplainerExecutable(root)
      : harness === "pi" ? await fakePiExecutable(root) : await fakeDshExecutable(root);
    const executable = path.join(root, "network-observer.mjs"), capturePath = path.join(root, "network-observer.jsonl");
    const startup = path.join(root, "service-startup.bash");
    await fs.writeFile(startup, "export OPENFARS_PROXY_ENV_SENTINEL=service-startup\n");
    for (const key of ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"]) vi.stubEnv(key, "http://service-proxy.invalid:7897");
    vi.stubEnv("BASH_ENV", startup); vi.stubEnv("NO_PROXY", "service.internal"); vi.stubEnv("no_proxy", "service.internal");
    await fs.writeFile(executable, `#!/usr/bin/env node
import fs from "node:fs";
import { spawn, spawnSync } from "node:child_process";
if (process.argv[2] === "debug" && process.argv[3] === "models") {
  console.log(JSON.stringify({ models: [{ slug: "fixture-model", use_responses_lite: false, tool_mode: null }] }));
  process.exit(0);
}
const shell = spawnSync("bash", ["-c", 'printf "%s" "$HTTP_PROXY|$HTTPS_PROXY|$ALL_PROXY|$BASH_ENV|$OPENFARS_PROXY_ENV_SENTINEL"'], { encoding: "utf8" });
fs.appendFileSync(${JSON.stringify(capturePath)}, JSON.stringify({ http: process.env.HTTP_PROXY, noProxy: process.env.NO_PROXY,
  startup: process.env.BASH_ENV, shell: shell.stdout, shellStatus: shell.status, args: process.argv.slice(2) }) + "\\n");
const child = spawn(process.execPath, [${JSON.stringify(native.executable)}, ...process.argv.slice(2)], { stdio: "inherit", env: process.env });
process.on("SIGTERM", () => child.kill("SIGTERM"));
child.on("exit", code => process.exit(code ?? 1));
`, { mode: 0o700 });
    const protocolProxyFactory = vi.fn(async () => ({ baseUrl: "http://127.0.0.1:43196/v1", token: "invocation-token", close: async () => undefined }));
    const runtime = new HarnessRuntimeFacade({ harnessExecutables: { [harness]: executable }, protocolProxyFactory });
    for (const mode of ["direct", "inherit"]) {
      const request = await workflowRequest(root, "worker", `inv_network_${harness}_${mode}`, harness);
      const legacy = { ...request.project.agents.worker!, proxy: { mode } }; request.project.agents.worker = legacy;
      const gateway = structuredClone(legacy.gatewaySnapshot);
      await runtime.run(request, () => undefined, new AbortController().signal);
      expect(legacy.proxy).toEqual({ mode }); expect(legacy.gatewaySnapshot).toEqual(gateway);
      expect(await fs.readdir(request.runtimePath)).not.toContain("shell-direct.bash");
    }
    const captures = (await fs.readFile(capturePath, "utf8")).trim().split("\n").map(line => JSON.parse(line));
    expect(captures).toHaveLength(2);
    for (const capture of captures) {
      expect(capture.http).toBe("http://service-proxy.invalid:7897"); expect(capture.noProxy).toContain("service.internal");
      expect(capture.startup).toBe(startup); expect(capture.shellStatus).toBe(0);
      expect(capture.shell).toBe(`http://service-proxy.invalid:7897|http://service-proxy.invalid:7897|http://service-proxy.invalid:7897|${startup}|service-startup`);
      expect(capture.args.some((arg: string) => arg.startsWith("shell_environment_policy."))).toBe(false);
    }
    if (harness !== "codex") expect(protocolProxyFactory).toHaveBeenCalledTimes(2);
    expect(process.env.HTTP_PROXY).toBe("http://service-proxy.invalid:7897"); expect(process.env.BASH_ENV).toBe(startup);
  }, 30_000);

  it("passes the complete quoted snapshot directly to the Codex runner", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-codex-evidence-"));
    roots.push(root);
    const runtime = new HarnessRuntimeFacade({
      harnessExecutables: { codex: process.execPath },
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43198/v1",
        token: "invocation-token",
        close: async () => undefined
      }))
    });
    const source = await workflowRequest(root, "worker", "inv_codex_evidence", "codex");
    const snapshot = await explainerSnapshot(source);
    const gateway = source.project.agents.worker!.gatewaySnapshot!;
    const run = vi.spyOn(CodexRunner.prototype, "run").mockImplementation(async (request) => {
      expect(request.purpose).toBe("explainer");
      expect(request.project.agents.__explainer__?.instructions).toContain("worker authoritative inbox");
      expect(request.project.agents.__explainer__?.instructions).toContain("<quoted-project-evidence>");
      expect(request.project.agents.__explainer__?.instructions).toMatch(/^Explain the quoted project evidence\.\n/);
      expect(request.kind).toBe("worker");
      expect(request.permission).toBe("workspace");
      expect(request.control).toBeUndefined();
      expect(request.skillPaths).toEqual([]);
      expect(request.autoSkillPaths).toEqual([]);
      expect(request.availableSkillPaths).toEqual([]);
      expect(request.project.agents.__explainer__?.mcpServers).toEqual([]);
      expect(request.project.agents.__explainer__?.webSearch).toBe(false);
      return { handoff: "The worker inbox is quoted.", threadId: "thread_codex_evidence" };
    });
    try {
      await expect(runtime.runExplainer({
        invocationId: source.invocationId,
        projectId: source.project.id,
        projectPath: source.projectPath,
        workspacePath: snapshot.workspacePath,
        runtimePath: source.runtimePath,
        inboxPath: snapshot.inboxPath,
        memoryPath: snapshot.memoryPath,
        harnessId: "codex",
        gateway: {
          id: gateway.id, name: gateway.name, url: gateway.url,
          apiKey: gateway.apiKey, models: gateway.models,
          defaultModel: gateway.defaultModel, protocol: gateway.protocol
        },
        model: "fixture-model",
        reasoningEffort: "low",
        prompt: "Explain the quoted project evidence.",
        onTrace: () => undefined,
        onEvent: () => undefined
      }, new AbortController().signal)).resolves.toMatchObject({
        answer: "The worker inbox is quoted."
      });
      expect(run).toHaveBeenCalledOnce();
    } finally {
      run.mockRestore();
    }
  });

  it.skipIf(process.platform === "win32")("runs Codex Explainer with inline evidence and native tools", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-codex-explainer-"));
    roots.push(root);
    const fake = await fakeCodexExplainerExecutable(root);
    const runtime = new HarnessRuntimeFacade({
      harnessExecutables: { codex: fake.executable },
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43198/v1",
        token: "invocation-token",
        close: async () => undefined
      }))
    });
    const source = await workflowRequest(root, "worker", "inv_codex_explainer", "codex");
    const snapshot = await explainerSnapshot(source);
    const gateway = source.project.agents.worker!.gatewaySnapshot!;
    const result = await runtime.runExplainer({
      invocationId: source.invocationId,
      projectId: source.project.id,
      projectPath: source.projectPath,
      workspacePath: snapshot.workspacePath,
      runtimePath: source.runtimePath,
      inboxPath: snapshot.inboxPath,
      memoryPath: snapshot.memoryPath,
      harnessId: "codex",
      gateway: {
        id: gateway.id,
        name: gateway.name,
        url: gateway.url,
        apiKey: gateway.apiKey,
        models: gateway.models,
        defaultModel: gateway.defaultModel,
        protocol: gateway.protocol
      },
      model: "fixture-model",
      reasoningEffort: "low",
      prompt: "Explain the quoted project evidence.",
      onTrace: () => undefined,
      onEvent: () => undefined
    }, new AbortController().signal);

    expect(result.answer).toBe("The evidence is from the worker inbox.");
    const capture = JSON.parse(await fs.readFile(fake.capture, "utf8")) as {
      args: string[];
      prompt: string;
    };
    expect(capture.prompt).toContain("worker authoritative inbox");
    expect(capture.prompt).toContain("<quoted-project-evidence>");
    expect(capture.prompt).not.toContain("Read the complete agent inbox");
    expect(capture.args).toEqual(expect.arrayContaining([
      "-s", "danger-full-access", "--enable", "skip_host_skill_discovery"
    ]));
    expect(capture.args).toContain("mcp_servers={}");
    expect(capture.args).not.toContain("--search");
  });

  it.each(["pi", "dsh"] as const)("runs %s Explainer with quoted evidence and native tools retained", async (harnessId) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), `openfars-${harnessId}-explainer-`));
    roots.push(root);
    const fake = harnessId === "pi"
      ? await fakePiExecutable(root)
      : await fakeDshExecutable(root);
    const runtime = new HarnessRuntimeFacade({
      harnessExecutables: { [harnessId]: fake.executable },
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43198/v1",
        token: "invocation-token",
        close: async () => undefined
      }))
    });
    const source = await workflowRequest(root, "worker", `inv_${harnessId}_explainer`, harnessId);
    const snapshot = await explainerSnapshot(source);
    const gateway = source.project.agents.worker!.gatewaySnapshot!;
    const result = await runtime.runExplainer({
      invocationId: source.invocationId,
      projectId: source.project.id,
      projectPath: source.projectPath,
      workspacePath: snapshot.workspacePath,
      runtimePath: source.runtimePath,
      inboxPath: snapshot.inboxPath,
      memoryPath: snapshot.memoryPath,
      harnessId,
      gateway: {
        id: gateway.id, name: gateway.name, url: gateway.url,
        apiKey: gateway.apiKey, models: gateway.models,
        defaultModel: gateway.defaultModel, protocol: gateway.protocol
      },
      model: "fixture-model",
      reasoningEffort: "low",
      prompt: "Explain the quoted project evidence.",
      onTrace: () => undefined,
      onEvent: () => undefined
    }, new AbortController().signal);
    expect(result.answer).toContain("fixture complete");
    const captures = (await fs.readFile(fake.capture, "utf8"))
      .trim().split("\n").map((line) => JSON.parse(line) as {
        args: string[]; prompt?: string; patch?: string; permissionMode?: string;
        inbox?: string | null; memory?: string | null;
      });
    const promptCapture = captures.find((item) => item.prompt);
    expect(promptCapture?.prompt).toContain("worker authoritative inbox");
    expect(promptCapture?.prompt).toContain("<quoted-project-evidence>");
    expect(promptCapture?.inbox).toBeNull();
    expect(promptCapture?.memory).toBeNull();
    if (harnessId === "pi") {
      expect(promptCapture?.args).not.toContain("--no-tools");
      expect(promptCapture?.args).toContain("--no-skills");
      expect(promptCapture?.args).not.toContain("--extension");
    } else {
      expect(promptCapture?.permissionMode).toBe("danger-full-access");
      expect(promptCapture?.patch).toBe(dshExplainerPatch(snapshot.workspacePath) + dshSelectedSkillsPatch([]) +
        dshNativeSdkPatch(fake.executable, result.session.nativeId));
      expect(promptCapture?.patch).toContain("    mode: danger-full-access");
      expect(promptCapture?.patch).not.toContain("- id: tool-pwsh\n  disabled: true");
      expect(promptCapture?.patch).not.toContain("- id: tool-fs\n  disabled: true");
      expect(promptCapture?.patch).not.toContain("- id: tool-web\n  disabled: true");
    }
  });



  it("removes only the fixed DSH credential artifact after interruption", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-adapter-interrupted-cleanup-"));
    roots.push(root);
    const runtimePath = path.join(root, "runtime");
    const dshPatch = path.join(runtimePath, "dsh-openfars.patch.yml");
    const unrelated = path.join(runtimePath, "keep.txt");
    await fs.mkdir(runtimePath, { recursive: true });
    await Promise.all([
      fs.writeFile(dshPatch, "dsh-secret", "utf8"),
      fs.writeFile(unrelated, "keep", "utf8")
    ]);

    await new DshAdapter().cleanupInterrupted("inv_cleanup", runtimePath);
    // Interruption recovery may run more than once after a server restart.
    await new DshAdapter().cleanupInterrupted("inv_cleanup", runtimePath);

    await expect(fs.lstat(dshPatch)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(fs.readFile(unrelated, "utf8")).resolves.toBe("keep");
  });


  it.each(["workflow", "explainer"] as const)(
    "does not start a %s same-Harness replacement after the invocation process budget is exhausted",
    async (purpose) => {
      const root = await fs.mkdtemp(path.join(
        os.tmpdir(),
        `openfars-pi-${purpose}-budget-`
      ));
      roots.push(root);
      const fake = await fakePiExecutable(root, "resume-mismatch");
      const runtime = new HarnessRuntimeFacade({
        harnessExecutables: { "pi": fake.executable },
        invocationRecoveryMaxAttempts: 1,
        protocolProxyFactory: vi.fn(async () => ({
          baseUrl: "http://127.0.0.1:43197/v1",
          token: "invocation-token",
          close: async () => undefined
        }))
      });
      const source = await workflowRequest(
        root,
        purpose === "workflow" ? "main" : "worker",
        `inv_pi_${purpose}_budget`,
        "pi"
      );
      const explainerPaths = purpose === "explainer"
        ? await explainerSnapshot(source)
        : undefined;
      const sessionPath = path.join(
        source.projectPath, "runtime", "harness-sessions",
        purpose === "workflow" ? "main" : "__explainer__", "pi", "sessions", "previous.jsonl"
      );
      await fs.mkdir(path.dirname(sessionPath), { recursive: true });
      await fs.writeFile(sessionPath, JSON.stringify({
        type: "session", version: 3, id: "previous-pi-session",
        timestamp: "2026-09-16T00:00:00.000Z",
        cwd: explainerPaths?.workspacePath ?? source.workspacePath
      }) + "\n", "utf8");
      const previousSession: SessionRef = {
        schemaVersion: 1,
        harnessId: "pi",
        adapterVersion: "1",
        generation: 2,
        nativeId: sessionPath,
        durable: true,
        createdAt: "2026-09-16T00:00:00.000Z"
      };
      const invocation = purpose === "workflow"
        ? (() => {
            source.project.agentSessions = { main: previousSession };
            return runtime.run(
              source,
              () => undefined,
              new AbortController().signal
            );
          })()
        : runtime.runExplainer({
            invocationId: source.invocationId,
            projectId: source.project.id,
            projectPath: source.projectPath,
            workspacePath: explainerPaths!.workspacePath,
            runtimePath: source.runtimePath,
            inboxPath: explainerPaths!.inboxPath,
            memoryPath: explainerPaths!.memoryPath,
            harnessId: "pi",
            gateway: {
              id: source.project.agents.worker!.gatewaySnapshot!.id,
              name: source.project.agents.worker!.gatewaySnapshot!.name,
              url: source.project.agents.worker!.gatewaySnapshot!.url,
              apiKey: source.project.agents.worker!.gatewaySnapshot!.apiKey,
              models: source.project.agents.worker!.gatewaySnapshot!.models,
              defaultModel: source.project.agents.worker!.gatewaySnapshot!.defaultModel,
              protocol: source.project.agents.worker!.gatewaySnapshot!.protocol
            },
            model: "fixture-model",
            reasoningEffort: "low",
            prompt: [
              `Read the invocation Inbox at ${explainerPaths!.inboxPath}.`,
              `Read persistent Agent memory at ${explainerPaths!.memoryPath}.`
            ].join("\n"),
            session: previousSession,
            onTrace: () => undefined,
            onEvent: () => undefined
          }, new AbortController().signal);

      await expect(invocation).rejects.toMatchObject({
        code: "INVOCATION_ATTEMPT_BUDGET_EXHAUSTED",
        source: "runtime",
        details: {
          attemptsStarted: 1,
          maxAttempts: 1,
          requestedEvidence: "adapter-dispatch"
        }
      });
      const captures = (await fs.readFile(fake.capture, "utf8"))
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line) as { args: string[] });
      expect(captures).toHaveLength(1);
      expect(captures[0]?.args).toContain("--session");
    }
  );

  it.each([ "pi", "dsh"] as const)(
    "normalizes %s cleanup failures after otherwise successful execution",
    async (harnessId) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), `openfars-${harnessId}-cleanup-fail-`));
      roots.push(root);
      const fixture = await cleanupFailureFixture(root, harnessId, "normal");
      const cleanupSpy = rejectFixtureCleanup(
        fixture.cleanupPath,
        fixture.cleanupOperation
      );
      try {
        await expect(fixture.runtime.run(
          fixture.request,
          () => undefined,
          new AbortController().signal
        )).rejects.toMatchObject({
          code: "HARNESS_CONTRACT_VIOLATION",
          safeMessage: `${harnessId} Adapter cleanup failed`,
          source: "adapter",
          harnessId,
          details: {
            cleanupPhases: [harnessId === "pi"
              ? "write-adapter-logs"
              : "remove-runtime-credential"]
          }
        });
      } finally {
        cleanupSpy.mockRestore();
      }
    }
  );

  it.each([ "pi", "dsh"] as const)(
    "does not let a %s cleanup failure replace the primary event-stream error",
    async (harnessId) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), `openfars-${harnessId}-primary-fail-`));
      roots.push(root);
      const fixture = await cleanupFailureFixture(root, harnessId, "malformed-hang");
      const cleanupSpy = rejectFixtureCleanup(
        fixture.cleanupPath,
        fixture.cleanupOperation
      );
      const trace = vi.fn((_kind: string, message: string) => {
        if (harnessId === "pi" &&
          message === "Harness Adapter cleanup encountered a secondary failure") {
          throw new Error("fixture cleanup diagnostic failure");
        }
      });
      try {
        await expect(fixture.runtime.run(
          fixture.request,
          trace,
          new AbortController().signal
        )).rejects.toMatchObject({
          code: "HARNESS_EVENT_STREAM_FAILED",
          safeMessage: "Invalid official JSON event",
          harnessId
        });
        expect(trace).toHaveBeenCalledWith(
          "stderr",
          "Harness Adapter cleanup encountered a secondary failure",
          expect.objectContaining({
            harness: harnessId,
            diagnostic: true,
            diagnosticSource: "adapter",
            cleanupFailureSuppressed: true,
            cleanupPhases: expect.arrayContaining([harnessId === "pi"
              ? "write-adapter-logs"
              : "remove-runtime-credential"])
          })
        );
        expect(JSON.stringify(trace.mock.calls)).not.toContain("fixture credential removal failure");
        expect(JSON.stringify(trace.mock.calls)).not.toContain("fixture diagnostic write failure");
      } finally {
        cleanupSpy.mockRestore();
      }
    }
  );

  it("keeps fixed MCP and control credentials out of Pi's serialized config", () => {
    const fixedToken = "fixed-mcp-secret-value";
    const capability = "control-capability-secret-value";
    const controlContext = JSON.stringify({ capabilityHash: "fixture-hash" });
    const config = piMcpConfig([
      {
        name: "control",
        namespace: "control",
        transport: "stdio",
        command: "/fixture/control-mcp",
        args: [],
        env: {
          SCIENCEEVOLVE_CONTROL_CONTEXT: controlContext,
          SCIENCEEVOLVE_CONTROL_CAPABILITY: capability
        }
      },
      {
        name: "fixed",
        namespace: "fixed",
        transport: "streamable-http",
        url: "https://fixed.example.test/mcp",
        headers: { Authorization: `Bearer ${fixedToken}` }
      }
    ], fixedToken);
    const serialized = JSON.stringify(config);

    expect(serialized).not.toContain(fixedToken);
    expect(serialized).not.toContain(capability);
    expect(serialized).not.toContain(controlContext);
    expect(config).toEqual([
      expect.objectContaining({
        transport: "stdio",
        environmentKeys: [
          "SCIENCEEVOLVE_CONTROL_CONTEXT",
          "SCIENCEEVOLVE_CONTROL_CAPABILITY"
        ]
      }),
      expect.objectContaining({
        transport: "streamable-http",
        fixedAuthorization: true
      })
    ]);
  });

  it("binds Pi's local Web MCP authorization to the invocation Gateway token without serializing it", () => {
    const routeToken = "invocation-route-secret";
    const config = piMcpConfig([{
      name: "openfars-web",
      namespace: "openfars-web",
      transport: "streamable-http",
      url: "http://127.0.0.1:43196/v1/web-mcp",
      headers: { Authorization: `Bearer ${routeToken}` }
    }], undefined, routeToken);

    expect(config).toEqual([{
      name: "openfars-web",
      namespace: "openfars-web",
      transport: "streamable-http",
      url: "http://127.0.0.1:43196/v1/web-mcp",
      routeAuthorization: true
    }]);
    expect(JSON.stringify(config)).not.toContain(routeToken);
  });

  it.each(["pi", "dsh"] as const)(
    "keeps %s terminal and Web Search capabilities independent from permission",
    async (harness) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), `openfars-${harness}-capabilities-`));
      roots.push(root);
      const fake = harness === "pi"
        ? await fakePiExecutable(root)
        : await fakeDshExecutable(root);
      const runtime = new HarnessRuntimeFacade({
        harnessExecutables: { [harness]: fake.executable },
        protocolProxyFactory: vi.fn(async () => ({
          baseUrl: "http://127.0.0.1:43196/v1",
          token: "invocation-token",
          close: async () => undefined
        }))
      });

      for (const permission of ["workspace", "compute", "yolo"] as const) {
        for (const webSearch of [false, true]) {
          const request = await workflowRequest(
            root,
            "worker",
            `inv_${harness}_${permission}_${webSearch ? "web" : "no_web"}`,
            harness
          );
          request.permission = permission;
          request.project.agents.worker!.permission = permission;
          request.project.agents.worker!.webSearch = webSearch;
          await runtime.run(request, () => undefined, new AbortController().signal);

          const records = (await fs.readFile(fake.capture, "utf8"))
            .trim()
            .split("\n")
            .map((line) => JSON.parse(line) as Record<string, any>);
          const capture = records.at(-1)!;
          expect(capture.permission).toBe(permission);
          expect(capture.webSearchEnabled).toBe(webSearch ? "1" : "0");
          if (harness === "pi") {
            expect(capture.args).not.toContain("--no-builtin-tools");
            expect(capture.args).not.toContain("--tools");
            expect(JSON.stringify(capture.mcpConfig).includes("openfars-web")).toBe(webSearch);
          } else {
            expect(capture.args).toEqual(expect.arrayContaining(["--profile", "sdk"]));
            expect(capture.patch).not.toContain("tool-bash\n  disabled: true");
            expect(capture.patch.includes('serverName: "openfars-web"')).toBe(webSearch);
          }
        }
      }
    },
    20_000
  );

  it("gives multiple compute Adapters the same staged Inspire wrapper and workload ledger", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-compute-adapters-"));
    roots.push(root);
    const dsh = await fakeDshExecutable(root);
    const pi = await fakePiExecutable(root);
    const inspireBin = await fakeInspireExecutable(root);
    const inspireConfigPath = "/secure/inspire/config.toml";
    const runtime = new HarnessRuntimeFacade({
      inspireBin,
      inspireConfigPath,
      inspireNoProxy: ["inspire.fixture"],
      inspireWorkspaceRoot: root,
      harnessExecutables: {
        dsh: dsh.executable,
        pi: pi.executable
      },
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43196/v1",
        token: "invocation-token",
        close: async () => undefined
      }))
    });

    for (const [harness, invocationId] of [
      ["dsh", "inv_compute_dsh"],
      ["pi", "inv_compute_pi"]
    ] as const) {
      const runRequest = await workflowRequest(root, "worker", invocationId, harness);
      runRequest.permission = "compute";
      runRequest.project.agents.worker!.permission = "compute";
      await runtime.run(
        runRequest,
        () => undefined,
        new AbortController().signal
      );
    }

    const captures = await Promise.all([dsh.capture, pi.capture].map(async (file) =>
      (await fs.readFile(file, "utf8")).trim().split("\n").map(line => JSON.parse(line))
        .findLast(record => typeof record.prompt === "string") as {
        permission: string;
        inspireStatus: number | null;
        inspireLedger: string | null;
        inspirePath: string | null;
        inspireConfigPath: string | null;
        inspireWorkspaceRoot: string | null;
        noProxy: string | null;
      }
    ));
    const projectPath = path.join(root, `prj_${"2".repeat(32)}`);
    const ledgerPath = path.join(projectPath, "runtime", "inspire-workloads.jsonl");
    for (const capture of captures) {
      expect(capture).toMatchObject({
        permission: "compute",
        inspireStatus: 0,
        inspireLedger: ledgerPath,
        inspireConfigPath,
        inspireWorkspaceRoot: root
      });
      expect(capture.noProxy?.split(",")).toContain("inspire.fixture");
      expect(capture.inspirePath).toMatch(
        new RegExp(`${path.sep}runtime${path.sep}inv_compute_(?:dsh|pi)${path.sep}bin$`)
      );
    }
    const ledger = (await fs.readFile(ledgerPath, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    expect(ledger).toEqual(expect.arrayContaining([
      expect.objectContaining({
        invocationId: "inv_compute_dsh",
        name: "dsh-compute-probe",
        requestedAcceleratorType: "H100",
        source: "wrapper"
      }),
      expect.objectContaining({
        invocationId: "inv_compute_pi",
        name: "pi-compute-probe",
        requestedAcceleratorType: "H200",
        source: "wrapper"
      })
    ]));
  });

  it("launches Pi in official JSON print mode with durable Main and ephemeral Worker sessions", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-pi-adapter-"));
    roots.push(root);
    const fake = await fakePiExecutable(root);
    const runtime = new HarnessRuntimeFacade({
      harnessExecutables: { pi: fake.executable },
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43198/v1",
        token: "invocation-token",
        close: async () => undefined
      }))
    });

    for (const [kind, invocationId] of [["main", "inv_pi_main"], ["worker", "inv_pi_worker"]] as const) {
      const request = await workflowRequest(root, kind, invocationId, "pi");
      const officialEvents = vi.fn();
      request.onOfficialHarnessEvent = officialEvents;
      const result = await runtime.run(
        request,
        () => undefined,
        new AbortController().signal
      );
      expect(result.handoff).toBe("Pi fixture complete.");
      expect(request.onModelActivity).toHaveBeenCalledTimes(3);
      expect((request.onModelActivity as ReturnType<typeof vi.fn>).mock.calls.map(
        ([activity]) => activity
      )).toEqual([
        expect.objectContaining({ kind: "tool", phase: "started", callId: "read-1" }),
        expect.objectContaining({ kind: "tool", phase: "completed", callId: "read-1" }),
        expect.objectContaining({ kind: "model", phase: "completed" })
      ]);
      expect(officialEvents).toHaveBeenCalledTimes(4);
    }

    const captures = (await fs.readFile(fake.capture, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as {
        args: string[];
        prompt: string;
        inboxPath: string;
        memoryPath: string;
        inbox: string;
        memory: string;
        mcpConfig: Array<{
          namespace?: string;
          environmentKeys?: string[];
        }>;
      });
    expect(captures).toHaveLength(2);
    expect(captures.every(({ args }) =>
      args.includes("--mode") && args.includes("json") && args.includes("--print")
    )).toBe(true);
    expect(captures[0]?.args).toContain("--session");
    expect(captures[0]?.args).not.toContain("--no-session");
    expect(captures[1]?.args).toContain("--no-session");
    for (const capture of captures) {
      expect(capture.args).not.toContain("--thinking");
      const workspaceMcp = capture.mcpConfig.find(
        ({ namespace }) => namespace === "scienceevolve-workspace"
      );
      expect(capture.mcpConfig.some(({ namespace }) => namespace === "scienceevolve-sleep")).toBe(true);
      expect(workspaceMcp?.environmentKeys).toEqual(expect.arrayContaining([
        "SCIENCEEVOLVE_PROJECT_ID",
        "SCIENCEEVOLVE_INVOCATION_ID",
        "SCIENCEEVOLVE_PUBLISHED_ARTIFACT_MANIFEST"
      ]));
      expect(capture.inboxPath).toContain(
        `${path.sep}.scienceevolve${path.sep}inbox${path.sep}`
      );
      expect(capture.memoryPath).toMatch(/Memory\.md$/);
      expect(capture.prompt).toContain(capture.inbox);
      expect(capture.prompt).not.toContain("Current task Inbox:");
      expect(capture.prompt).not.toContain("Persistent project memory:");
    }
    expect(captures.map((capture) => capture.inbox)).toEqual([
      "main authoritative inbox\n",
      "worker authoritative inbox\n"
    ]);
    expect(captures.map((capture) => capture.memory)).toEqual([
      "main persistent memory\n",
      "worker persistent memory\n"
    ]);
  });

  it("terminates Pi on malformed JSONL, emits no later events, and retains redacted stderr", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-pi-stream-failfast-"));
    roots.push(root);
    const fake = await fakePiExecutable(root, "malformed-hang");
    const runtime = new HarnessRuntimeFacade({
      harnessExecutables: { pi: fake.executable },
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43198/v1",
        token: "invocation-token",
        close: async () => undefined
      }))
    });
    const request = await workflowRequest(root, "worker", "inv_pi_stream_failfast", "pi");
    const officialEvents = vi.fn();
    request.onOfficialHarnessEvent = officialEvents;

    await expect(runtime.run(
      request,
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "HARNESS_EVENT_STREAM_FAILED",
      safeMessage: "Invalid official JSON event"
    });

    await expect(fs.readFile(fake.terminated, "utf8")).resolves.toContain("terminated");
    await new Promise((resolve) => setTimeout(resolve, 400));
    await expect(fs.lstat(fake.later)).rejects.toMatchObject({ code: "ENOENT" });
    const stderr = await fs.readFile(path.join(
      request.runtimePath,
      "pi-stderr.log"
    ), "utf8");
    expect(stderr).toContain("[REDACTED]");
    expect(stderr).not.toContain("fixture-private-token");
    expect(officialEvents).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(officialEvents.mock.calls)).not.toContain("must not be emitted");
  });

  it("publishes no Pi work before the native stream confirms its Session identity", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-pi-work-before-session-"));
    roots.push(root);
    const fake = await fakePiExecutable(root, "work-before-session");
    const runtime = new HarnessRuntimeFacade({
      harnessExecutables: { pi: fake.executable },
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43198/v1",
        token: "invocation-token",
        close: async () => undefined
      }))
    });
    const request = await workflowRequest(root, "worker", "inv_pi_work_before_session", "pi");
    const officialEvents = vi.fn();
    request.onOfficialHarnessEvent = officialEvents;

    await expect(runtime.run(
      request,
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "HARNESS_CONTRACT_VIOLATION",
      safeMessage: "Pi official stream emitted work before confirming its Session identity",
      harnessId: "pi"
    });
    expect(officialEvents).not.toHaveBeenCalled();
  });

  it("gives DSH Main and Worker real staged Inbox and Memory paths", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-dsh-inputs-"));
    roots.push(root);
    const fake = await fakeDshExecutable(root);
    const runtime = new HarnessRuntimeFacade({
      harnessExecutables: { dsh: fake.executable },
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43195/v1",
        token: "invocation-token",
        close: async () => undefined
      }))
    });

    for (const [kind, invocationId] of [
      ["main", "inv_dsh_inputs_main"],
      ["worker", "inv_dsh_inputs_worker"]
    ] as const) {
      await expect(runtime.run(
        await workflowRequest(root, kind, invocationId, "dsh"),
        () => undefined,
        new AbortController().signal
      )).resolves.toMatchObject({ handoff: "DSH fixture complete." });
    }

    const promptCalls = (await fs.readFile(fake.capture, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as {
        request: { method: string };
        prompt?: string;
        inboxPath?: string;
        memoryPath?: string;
        inbox?: string;
        memory?: string;
        patch: string;
      })
      .filter((call) => call.request.method === "session/prompt");
    expect(promptCalls).toHaveLength(2);
    for (const capture of promptCalls) {
      expect(capture.patch).toContain('serverName: "scienceevolve-workspace"');
      expect(capture.patch).toContain('serverName: "scienceevolve-sleep"');
      expect(capture.patch).toContain("SCIENCEEVOLVE_PROJECT_ID:");
      expect(capture.patch).toContain("SCIENCEEVOLVE_INVOCATION_ID:");
      expect(capture.patch).toContain("SCIENCEEVOLVE_PUBLISHED_ARTIFACT_MANIFEST:");
      expect(capture.inboxPath).toContain(
        `${path.sep}.scienceevolve${path.sep}inbox${path.sep}`
      );
      expect(capture.memoryPath).toMatch(/Memory\.md$/);
      expect(capture.prompt).toContain(capture.inbox);
      expect(capture.prompt).not.toContain("Current task Inbox:");
      expect(capture.prompt).not.toContain("Persistent project memory:");
    }
    expect(promptCalls.map((capture) => capture.inbox)).toEqual([
      "main authoritative inbox\n",
      "worker authoritative inbox\n"
    ]);
    expect(promptCalls.map((capture) => capture.memory)).toEqual([
      "main persistent memory\n",
      "worker persistent memory\n"
    ]);
  });

  it("runs and resumes a durable DSH SDK session through JSON-RPC official events", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-dsh-adapter-"));
    roots.push(root);
    const fake = await fakeDshExecutable(root);
    const runtime = new HarnessRuntimeFacade({
      harnessExecutables: { dsh: fake.executable },
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43195/v1",
        token: "invocation-token",
        close: async () => undefined
      }))
    });
    let persistedSession: SessionRef | undefined;
    const firstEvents = vi.fn();
    const firstRequest = await workflowRequest(root, "main", "inv_dsh_new", "dsh");
    firstRequest.onOfficialHarnessEvent = firstEvents;
    firstRequest.onSessionStarted = (session) => { persistedSession = session; };

    const firstResult = await runtime.run(
      firstRequest,
      () => undefined,
      new AbortController().signal
    );

    expect(firstResult).toMatchObject({
      handoff: "DSH fixture complete.",
      threadId: expect.stringMatching(/^dsh:/)
    });
    expect(persistedSession).toMatchObject({
      harnessId: "dsh",
      generation: 0,
      durable: true
    });
    expect(persistedSession).not.toHaveProperty("resumedAt");
    expect(firstEvents).toHaveBeenCalledWith(expect.objectContaining({
      harnessId: "dsh",
      kind: "tool.started",
      tool: expect.objectContaining({ callId: "read-1", status: "started" })
    }));
    expect(firstEvents).toHaveBeenCalledWith(expect.objectContaining({
      harnessId: "dsh",
      kind: "tool.completed",
      tool: expect.objectContaining({ callId: "read-1", status: "completed" })
    }));
    expect(firstEvents).toHaveBeenCalledWith(expect.objectContaining({
      harnessId: "dsh",
      kind: "assistant.message",
      message: "DSH fixture complete."
    }));

    const secondEvents = vi.fn();
    const resumedSession = persistedSession!;
    const secondRequest = await workflowRequest(root, "main", "inv_dsh_resume", "dsh");
    secondRequest.project.agentSessions = { main: resumedSession };
    const onResumedSession = vi.fn();
    secondRequest.onSessionStarted = onResumedSession;
    secondRequest.onOfficialHarnessEvent = secondEvents;

    const secondResult = await runtime.run(
      secondRequest,
      () => undefined,
      new AbortController().signal
    );

    expect(secondResult).toEqual({
      handoff: "DSH fixture complete.",
      threadId: `dsh:${resumedSession.nativeId}`
    });
    expect(onResumedSession).toHaveBeenCalledWith(expect.objectContaining({
      nativeId: resumedSession.nativeId,
      harnessId: "dsh",
      generation: 0,
      durable: true,
      resumedAt: expect.any(String)
    }));
    expect(secondEvents).toHaveBeenCalledWith(expect.objectContaining({
      kind: "tool.started"
    }));
    expect(secondEvents).toHaveBeenCalledWith(expect.objectContaining({
      kind: "tool.completed"
    }));
    expect(secondEvents).toHaveBeenCalledWith(expect.objectContaining({
      kind: "assistant.message",
      message: "DSH fixture complete."
    }));
    expect(secondEvents).toHaveBeenCalledWith(expect.objectContaining({
      kind: "tool.started",
      itemId: `dsh:${resumedSession.nativeId}:41`
    }));
    await expect(fs.lstat(path.join(
      secondRequest.runtimePath,
      "dsh-openfars.patch.yml"
    ))).rejects.toMatchObject({ code: "ENOENT" });

    const calls = (await fs.readFile(fake.capture, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as {
        args: string[];
        patch: string;
        request: { method: string; params?: { sessionId?: string } };
      });
    expect(calls.map((call) => call.request.method)).toEqual([
      "initialize", "session/prompt", "shutdown",
      "initialize", "session/resume", "session/prompt", "shutdown"
    ]);
    const resumeCall = calls.find((call) => call.request.method === "session/resume")!;
    expect(resumeCall.request.params?.sessionId).toBe(resumedSession.nativeId);
    expect(resumeCall.patch).toContain("dsh-sdk-resume-plugin.mjs");
    expect(resumeCall.patch).toContain(`sessionId: ${JSON.stringify(resumedSession.nativeId)}`);
    const promptCalls = calls.filter((call) => call.request.method === "session/prompt");
    expect(promptCalls).toHaveLength(2);
    expect(promptCalls.map((call) => call.request.params?.sessionId)).toEqual([
      resumedSession.nativeId,
      resumedSession.nativeId
    ]);
    expect(promptCalls.every((call) =>
      call.args.includes("--profile") && call.args.includes("sdk") && call.args.includes("--patch")
    )).toBe(true);
  });

  it.each(["resume-bad-id", "resume-bad-sequence", "resume-regressed-sequence"] as const)(
    "preserves the original DSH session when native resume returns %s",
    async (behavior) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-dsh-native-resume-"));
      roots.push(root);
      const fake = await fakeDshExecutable(root, behavior);
      const runtime = new HarnessRuntimeFacade({
        harnessExecutables: { dsh: fake.executable },
        protocolProxyFactory: async () => ({
          baseUrl: "http://127.0.0.1:43195/v1", token: "invocation-token",
          close: async () => undefined
        })
      });
      const first = await workflowRequest(root, "worker", `inv_dsh_${behavior}_first`, "dsh");
      first.taskSessionId = "original-task";
      let original: SessionRef | undefined;
      first.onDurableSessionStarted = (session) => { original = session; };
      await runtime.run(first, () => undefined, new AbortController().signal);
      expect(original?.durable).toBe(true);
      const second = await workflowRequest(root, "worker", `inv_dsh_${behavior}_second`, "dsh");
      second.taskSessionId = "original-task";
      second.sessionContinuity = "strict";
      second.project.taskSessionRefs = { "original-task": original! };
      const onStarted = vi.fn();
      second.onDurableSessionStarted = onStarted;
      await expect(runtime.run(second, () => undefined, new AbortController().signal))
        .rejects.toMatchObject({ code: "SESSION_RESUME_FAILED" });
      for (const [session] of onStarted.mock.calls) {
        expect(session).toMatchObject({ nativeId: original!.nativeId, generation: original!.generation });
      }
      const calls = (await fs.readFile(fake.capture, "utf8")).trim().split("\n")
        .map((line) => JSON.parse(line) as { request: { method: string } });
      expect(calls.filter((call) => call.request.method === "session/prompt")).toHaveLength(1);
      expect(second.project.taskSessionRefs["original-task"]).toEqual(original);
    }
  );

  it("keeps a DSH turn alive when native events arrive after the configured idle window", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-dsh-activity-deadline-"));
    roots.push(root);
    const fake = await fakeDshExecutable(root, "activity-delay");
    const runtime = new HarnessRuntimeFacade({
      harnessExecutables: { dsh: fake.executable },
      dshTurnIdleTimeoutMs: 40,
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43193/v1",
        token: "invocation-token",
        close: async () => undefined
      }))
    });
    const request = await workflowRequest(root, "main", "inv_dsh_activity_deadline", "dsh");
    let session: SessionRef | undefined;
    request.onSessionStarted = (value) => { session = value; };
    const result = await runtime.run(request, () => undefined, new AbortController().signal);
    expect(result).toMatchObject({
      handoff: "DSH delayed fixture complete.",
      threadId: expect.stringMatching(/^dsh:/)
    });
    const resumed = await workflowRequest(root, "main", "inv_dsh_activity_deadline_resumed", "dsh");
    resumed.project.agentSessions = { main: session! };
    await expect(runtime.run(resumed, () => undefined, new AbortController().signal))
      .resolves.toMatchObject({ handoff: "DSH delayed fixture complete.", threadId: `dsh:${session!.nativeId}` });
  });

  it("resumes the same DSH session after a turn inactivity timeout", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-dsh-turn-timeout-recovery-"));
    roots.push(root);
    const fake = await fakeDshExecutable(root, "turn-timeout-once");
    const runtime = new HarnessRuntimeFacade({
      harnessExecutables: { dsh: fake.executable },
      dshTurnIdleTimeoutMs: 40,
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43191/v1",
        token: "invocation-token",
        close: async () => undefined
      }))
    });
    const onTrace = vi.fn();
    const request = await workflowRequest(root, "main", "inv_dsh_turn_timeout_recovery", "dsh");
    const result = await runtime.run(request, onTrace, new AbortController().signal);
    expect(result).toMatchObject({
      handoff: "DSH fixture complete.",
      threadId: expect.stringMatching(/^dsh:/)
    });
    expect(onTrace).toHaveBeenCalledWith(
      "status",
      "Native session recovery retrying the original Session",
      expect.objectContaining({
        errorCode: "INVOCATION_TIMED_OUT",
        sessionGeneration: 0,
        recoveryStrategy: "native-session-resume"
      })
    );
  });

  it("preserves a resumed DSH session that repeatedly reaches idle without a handoff", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-dsh-resume-no-handoff-"));
    roots.push(root);
    const fake = await fakeDshExecutable(root, "resume-no-handoff");
    const runtime = new HarnessRuntimeFacade({
      harnessExecutables: { dsh: fake.executable },
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43192/v1",
        token: "invocation-token",
        close: async () => undefined
      }))
    });
    let persistedSession: SessionRef | undefined;
    const firstRequest = await workflowRequest(root, "main", "inv_dsh_no_handoff_new", "dsh");
    firstRequest.onSessionStarted = (session) => { persistedSession = session; };
    await runtime.run(firstRequest, () => undefined, new AbortController().signal);

    const secondRequest = await workflowRequest(root, "main", "inv_dsh_no_handoff_resume", "dsh");
    secondRequest.project.agentSessions = { main: persistedSession! };
    const onSessionStarted = vi.fn();
    const onTrace = vi.fn();
    secondRequest.onSessionStarted = onSessionStarted;
    await expect(runtime.run(
      secondRequest,
      onTrace,
      new AbortController().signal
    )).rejects.toMatchObject({ code: "SESSION_RESUME_FAILED", retryable: false, details: { recoveryLimit: 1 } });

    expect(onSessionStarted).toHaveBeenCalledOnce();
    expect(onSessionStarted).toHaveBeenCalledWith(expect.objectContaining({
      nativeId: persistedSession!.nativeId, generation: persistedSession!.generation
    }));
    expect(onTrace).toHaveBeenCalledWith("status", "Native session recovery retrying the original Session",
      expect.objectContaining({ errorCode: "SESSION_RESUME_FAILED", recoveryStrategy: "native-session-resume" }));
  });

  it("preserves a DSH Session whose durable artifact is missing without creating another identity", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-dsh-resume-"));
    roots.push(root);
    const fake = await fakeDshExecutable(root);
    const runtime = new HarnessRuntimeFacade({
      harnessExecutables: { dsh: fake.executable },
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43194/v1",
        token: "invocation-token",
        close: async () => undefined
      }))
    });
    let persistedSession: SessionRef | undefined;
    const firstRequest = await workflowRequest(root, "main", "inv_dsh_artifact_new", "dsh");
    firstRequest.onSessionStarted = (session) => { persistedSession = session; };
    await runtime.run(firstRequest, () => undefined, new AbortController().signal);

    const dshHome = path.join(
      firstRequest.projectPath,
      "runtime",
      "harness-sessions",
      "main",
      "dsh"
    );
    const oldArtifact = dshSessionArtifactPath(
      dshHome,
      firstRequest.workspacePath,
      persistedSession!.nativeId
    );
    expect((await fs.lstat(oldArtifact)).isFile()).toBe(true);
    await fs.unlink(oldArtifact);

    const secondRequest = await workflowRequest(root, "main", "inv_dsh_artifact_resume", "dsh");
    secondRequest.project.agentSessions = { main: persistedSession! };
    const onSessionStarted = vi.fn();
    const onTrace = vi.fn();
    secondRequest.onSessionStarted = onSessionStarted;
    await expect(runtime.run(
      secondRequest,
      onTrace,
      new AbortController().signal
    )).rejects.toMatchObject({ code: "SESSION_RESUME_FAILED", retryable: false, details: { recoveryLimit: 1 } });

    expect(onSessionStarted).toHaveBeenCalledOnce();
    expect(onSessionStarted).toHaveBeenCalledWith(expect.objectContaining({
      nativeId: persistedSession!.nativeId, generation: persistedSession!.generation
    }));
    await expect(fs.lstat(oldArtifact)).rejects.toMatchObject({ code: "ENOENT" });
    expect(secondRequest.project.agentSessions.main).toEqual(persistedSession);

    const calls = (await fs.readFile(fake.capture, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as {
        request: { method: string; params?: { sessionId?: string } };
      });
    expect(calls
      .filter((call) => call.request.method === "session/prompt")
      .map((call) => call.request.params?.sessionId)
    ).toEqual([persistedSession!.nativeId]);
  });

  it.each(["wrong-workspace", "invalid-zstd-magic"] as const)(
    "preserves and reports a DSH session whose official artifact has %s",
    async (damage) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), `openfars-dsh-${damage}-`));
      roots.push(root);
      const fake = await fakeDshExecutable(root);
      const runtime = new HarnessRuntimeFacade({
        harnessExecutables: { dsh: fake.executable },
        protocolProxyFactory: vi.fn(async () => ({
          baseUrl: "http://127.0.0.1:43193/v1",
          token: "invocation-token",
          close: async () => undefined
        }))
      });
      let persistedSession: SessionRef | undefined;
      const firstRequest = await workflowRequest(root, "main", `inv_dsh_${damage}_new`, "dsh");
      firstRequest.onSessionStarted = (session) => { persistedSession = session; };
      await runtime.run(firstRequest, () => undefined, new AbortController().signal);

      const artifact = dshSessionArtifactPath(
        path.join(firstRequest.projectPath, "runtime", "harness-sessions", "main", "dsh"),
        firstRequest.workspacePath,
        persistedSession!.nativeId
      );
      if (damage === "wrong-workspace") {
        const wrongHeader = `${JSON.stringify({
          type: "session",
          version: 0,
          id: persistedSession!.nativeId,
          createdAt: Date.now(),
          cwd: path.join(root, "different-workspace"),
          delegationDepth: 0
        })}\n`;
        await fs.writeFile(artifact, zstdCompressSync(Buffer.from(wrongHeader)));
      } else {
        await fs.writeFile(artifact, "not-a-zstandard-session-artifact\n", "utf8");
      }

      const secondRequest = await workflowRequest(
        root,
        "main",
        `inv_dsh_${damage}_resume`,
        "dsh"
      );
      secondRequest.project.agentSessions = { main: persistedSession! };
      const started = vi.fn();
      secondRequest.onSessionStarted = started;
      const damagedBytes = await fs.readFile(artifact);
      await expect(runtime.run(secondRequest, () => undefined, new AbortController().signal))
        .rejects.toMatchObject({ code: "SESSION_RESUME_FAILED", retryable: false });
      expect(started).toHaveBeenCalledOnce();
      expect(started).toHaveBeenCalledWith(expect.objectContaining({
        nativeId: persistedSession!.nativeId, generation: persistedSession!.generation
      }));
      expect(await fs.readFile(artifact)).toEqual(damagedBytes);
    }
  );

  it("refuses a DSH durable artifact reached through a symlinked session directory", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-dsh-symlink-"));
    roots.push(root);
    const fake = await fakeDshExecutable(root);
    const runtime = new HarnessRuntimeFacade({
      harnessExecutables: { dsh: fake.executable },
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43189/v1",
        token: "invocation-token",
        close: async () => undefined
      }))
    });
    let persistedSession: SessionRef | undefined;
    const firstRequest = await workflowRequest(root, "main", "inv_dsh_symlink_new", "dsh");
    firstRequest.onSessionStarted = (session) => { persistedSession = session; };
    await runtime.run(firstRequest, () => undefined, new AbortController().signal);

    const artifact = dshSessionArtifactPath(
      path.join(firstRequest.projectPath, "runtime", "harness-sessions", "main", "dsh"),
      firstRequest.workspacePath,
      persistedSession!.nativeId
    );
    const sessionDirectory = path.dirname(artifact);
    const realDirectory = `${sessionDirectory}-real`;
    await fs.rename(sessionDirectory, realDirectory);
    await fs.symlink(path.basename(realDirectory), sessionDirectory, "dir");

    const secondRequest = await workflowRequest(root, "main", "inv_dsh_symlink_resume", "dsh");
    secondRequest.project.agentSessions = { main: persistedSession! };
    const started = vi.fn();
    secondRequest.onSessionStarted = started;
    await expect(runtime.run(
      secondRequest,
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({ code: "SESSION_RESUME_FAILED", retryable: false, details: { recoveryLimit: 1 } });

    expect(started).toHaveBeenCalledOnce();
    expect(started).toHaveBeenCalledWith(expect.objectContaining({
      nativeId: persistedSession!.nativeId, generation: persistedSession!.generation
    }));
    expect((await fs.lstat(sessionDirectory)).isSymbolicLink()).toBe(true);
  });

  it.each([
    ["sequence-gap", "gap", "DSH official event sequence contains a gap"],
    ["sequence-replay", "replay", "DSH official event sequence replayed or regressed"]
  ] as const)("rejects a %s in the official DSH native sequence and cleans up", async (
    behavior,
    label,
    safeMessage
  ) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), `openfars-dsh-${label}-`));
    roots.push(root);
    const fake = await fakeDshExecutable(root, behavior);
    const runtime = new HarnessRuntimeFacade({
      harnessExecutables: { dsh: fake.executable },
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43192/v1",
        token: "invocation-token",
        close: async () => undefined
      }))
    });
    const request = await workflowRequest(root, "main", `inv_dsh_sequence_${label}`, "dsh");

    await expect(runtime.run(
      request,
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "HARNESS_EVENT_STREAM_FAILED",
      safeMessage
    });
    await expect(fs.readFile(fake.terminated, "utf8")).resolves.toContain("terminated");
    await expect(fs.lstat(path.join(
      request.runtimePath,
      "dsh-openfars.patch.yml"
    ))).rejects.toMatchObject({ code: "ENOENT" });
  }, 10_000);

  it("terminates DSH on malformed JSON-RPC and removes its token-bearing patch", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-dsh-stream-failfast-"));
    roots.push(root);
    const fake = await fakeDshExecutable(root, "malformed-hang");
    const runtime = new HarnessRuntimeFacade({
      harnessExecutables: { dsh: fake.executable },
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43192/v1",
        token: "invocation-token",
        close: async () => undefined
      }))
    });
    const request = await workflowRequest(root, "main", "inv_dsh_stream_failfast", "dsh");
    const officialEvents = vi.fn();
    request.onOfficialHarnessEvent = officialEvents;

    await expect(runtime.run(
      request,
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "HARNESS_EVENT_STREAM_FAILED",
      safeMessage: "Invalid official JSON event"
    });

    await expect(fs.readFile(fake.terminated, "utf8")).resolves.toContain("terminated");
    await new Promise((resolve) => setTimeout(resolve, 400));
    await expect(fs.lstat(fake.later)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(fs.lstat(path.join(
      request.runtimePath,
      "dsh-openfars.patch.yml"
    ))).rejects.toMatchObject({ code: "ENOENT" });
    const stderr = await fs.readFile(path.join(
      request.runtimePath,
      "dsh-stderr.log"
    ), "utf8");
    expect(stderr).toContain("[REDACTED]");
    expect(stderr).not.toContain("fixture-private-token");
    expect(JSON.stringify(officialEvents.mock.calls)).not.toContain("must not be emitted");
  });

  it("preserves a resumed DSH session when the typed SDK repeatedly reports another identity", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-dsh-identity-"));
    roots.push(root);
    const fake = await fakeDshExecutable(root, "resume-identity-mismatch");
    const runtime = new HarnessRuntimeFacade({
      harnessExecutables: { dsh: fake.executable },
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43191/v1",
        token: "invocation-token",
        close: async () => undefined
      }))
    });
    let persistedSession: SessionRef | undefined;
    const firstRequest = await workflowRequest(root, "main", "inv_dsh_identity_new", "dsh");
    firstRequest.onSessionStarted = (session) => { persistedSession = session; };
    await runtime.run(firstRequest, () => undefined, new AbortController().signal);

    const secondRequest = await workflowRequest(root, "main", "inv_dsh_identity_resume", "dsh");
    secondRequest.project.agentSessions = { main: persistedSession! };
    const traces: string[] = [];
    const started = vi.fn();
    secondRequest.onSessionStarted = started;
    await expect(runtime.run(
      secondRequest,
      (_type, message) => { traces.push(message); },
      new AbortController().signal
    )).rejects.toMatchObject({ code: "SESSION_RESUME_FAILED", retryable: false, details: { recoveryLimit: 1 } });

    expect(started).toHaveBeenCalledOnce();
    expect(started).toHaveBeenCalledWith(expect.objectContaining({
      nativeId: persistedSession!.nativeId, generation: persistedSession!.generation
    }));
    expect(traces).toContain("Native session recovery retrying the original Session");
    const promptCalls = (await fs.readFile(fake.capture, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as {
        request: { method: string; params?: { sessionId?: string } };
      })
      .filter((entry) => entry.request.method === "session/prompt");
    expect(promptCalls.map((entry) => entry.request.params?.sessionId)).toEqual([
      persistedSession!.nativeId,
      persistedSession!.nativeId,
      persistedSession!.nativeId
    ]);
  }, 10_000);

  it("does not infer DSH resume failure from untyped JSON-RPC error text", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-dsh-rpc-text-"));
    roots.push(root);
    const fake = await fakeDshExecutable(root, "resume-text-error");
    const runtime = new HarnessRuntimeFacade({
      harnessExecutables: { dsh: fake.executable },
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43190/v1",
        token: "invocation-token",
        close: async () => undefined
      }))
    });
    let persistedSession: SessionRef | undefined;
    const firstRequest = await workflowRequest(root, "main", "inv_dsh_rpc_text_new", "dsh");
    firstRequest.onSessionStarted = (session) => { persistedSession = session; };
    await runtime.run(firstRequest, () => undefined, new AbortController().signal);

    const secondRequest = await workflowRequest(root, "main", "inv_dsh_rpc_text_resume", "dsh");
    secondRequest.project.agentSessions = { main: persistedSession! };
    const started = vi.fn();
    secondRequest.onSessionStarted = started;
    await expect(runtime.run(
      secondRequest,
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "HARNESS_CONTRACT_VIOLATION",
      safeMessage: "dsh SDK request failed"
    });

    expect(started.mock.calls.map(([session]) => (session as SessionRef).generation)).toEqual([
      persistedSession!.generation
    ]);
    const promptCalls = (await fs.readFile(fake.capture, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { request: { method: string } })
      .filter((entry) => entry.request.method === "session/prompt");
    expect(promptCalls).toHaveLength(2);
    await expect(fs.lstat(path.join(
      secondRequest.runtimePath,
      "dsh-openfars.patch.yml"
    ))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("preserves an unresumable Pi Session without launching a replacement", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-pi-resume-"));
    roots.push(root);
    const fake = await fakePiResumeExecutable(root);
    const runtime = new HarnessRuntimeFacade({
      harnessExecutables: { pi: fake.executable },
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43197/v1",
        token: "invocation-token",
        close: async () => undefined
      }))
    });
    const request = await workflowRequest(root, "main", "inv_pi_resume", "pi");
    const previousNativeId = path.join(
      request.projectPath,
      "runtime",
      "harness-sessions",
      "main",
      "pi",
      "sessions",
      "missing-pi-session.jsonl"
    );
    request.project.agentSessions = {
      main: {
        schemaVersion: 1,
        harnessId: "pi",
        adapterVersion: "1",
        generation: 2,
        nativeId: previousNativeId,
        durable: true,
        createdAt: "2026-09-16T00:00:00.000Z"
      }
    };
    const onSessionStarted = vi.fn();
    request.onSessionStarted = onSessionStarted;

    await expect(runtime.run(
      request,
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({ code: "SESSION_RESUME_FAILED", retryable: false, details: { recoveryLimit: 1 } });

    await expect(fs.access(fake.capture)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(fs.access(previousNativeId)).rejects.toMatchObject({ code: "ENOENT" });
    expect(onSessionStarted).toHaveBeenCalledOnce();
    expect(onSessionStarted).toHaveBeenCalledWith(expect.objectContaining({
      harnessId: "pi", generation: 2, nativeId: previousNativeId, durable: true
    }));
  });

  it("rejects a mismatched resumed Pi identity before publishing its work events", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-pi-resume-identity-"));
    roots.push(root);
    const fake = await fakePiExecutable(root, "resume-mismatch");
    const runtime = new HarnessRuntimeFacade({
      harnessExecutables: { pi: fake.executable },
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43197/v1",
        token: "invocation-token",
        close: async () => undefined
      }))
    });
    let persistedSession: SessionRef | undefined;
    const firstRequest = await workflowRequest(root, "main", "inv_pi_identity_new", "pi");
    firstRequest.onSessionStarted = (session) => { persistedSession = session; };
    await runtime.run(firstRequest, () => undefined, new AbortController().signal);

    const secondRequest = await workflowRequest(root, "main", "inv_pi_identity_resume", "pi");
    secondRequest.project.agentSessions = { main: persistedSession! };
    const officialEvents = vi.fn();
    const started = vi.fn();
    secondRequest.onOfficialHarnessEvent = officialEvents;
    secondRequest.onSessionStarted = started;

    await expect(runtime.run(
      secondRequest,
      () => undefined,
      new AbortController().signal
    )).resolves.toMatchObject({ handoff: "Pi fixture complete." });

    expect(officialEvents.mock.calls.map(([event]) =>
      (event as { kind: string }).kind
    )).toEqual([
      "lifecycle",
      "tool.started",
      "tool.completed",
      "assistant.message"
    ]);
    expect(started).toHaveBeenCalledWith(expect.objectContaining({
      harnessId: "pi",
      generation: persistedSession!.generation,
      nativeId: persistedSession!.nativeId,
      durable: true
    }));
    const captures = (await fs.readFile(fake.capture, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { args: string[] });
    expect(captures).toHaveLength(3);
  });

  it("refuses a symlinked Pi resume artifact and leaves its target untouched", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-pi-symlink-"));
    roots.push(root);
    const fake = await fakePiResumeExecutable(root);
    const runtime = new HarnessRuntimeFacade({
      harnessExecutables: { pi: fake.executable },
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43197/v1",
        token: "invocation-token",
        close: async () => undefined
      }))
    });
    const request = await workflowRequest(root, "main", "inv_pi_symlink", "pi");
    const sessionRoot = path.join(
      request.projectPath,
      "runtime",
      "harness-sessions",
      "main",
      "pi",
      "sessions"
    );
    await fs.mkdir(sessionRoot, { recursive: true });
    const outside = path.join(root, "outside-pi-session.jsonl");
    const outsideContents = `${JSON.stringify({
      type: "session",
      version: 3,
      id: "outside-session",
      timestamp: "2026-09-16T00:00:00.000Z",
      cwd: request.workspacePath
    })}\n`;
    await fs.writeFile(outside, outsideContents, "utf8");
    const linkedSession = path.join(sessionRoot, "linked-session.jsonl");
    await fs.symlink(outside, linkedSession);
    request.project.agentSessions = {
      main: {
        schemaVersion: 1,
        harnessId: "pi",
        adapterVersion: "1",
        generation: 4,
        nativeId: linkedSession,
        durable: true,
        createdAt: "2026-09-16T00:00:00.000Z"
      }
    };
    const onSessionStarted = vi.fn();
    request.onSessionStarted = onSessionStarted;

    await expect(runtime.run(
      request,
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({ code: "SESSION_RESUME_FAILED", retryable: false, details: { recoveryLimit: 1 } });

    expect(await fs.readFile(outside, "utf8")).toBe(outsideContents);
    expect((await fs.lstat(linkedSession)).isSymbolicLink()).toBe(true);
    await expect(fs.access(fake.capture)).rejects.toMatchObject({ code: "ENOENT" });
    expect(onSessionStarted).toHaveBeenCalledOnce();
    expect(onSessionStarted).toHaveBeenCalledWith(expect.objectContaining({
      harnessId: "pi", generation: 4, nativeId: linkedSession, durable: true
    }));
  });
});
