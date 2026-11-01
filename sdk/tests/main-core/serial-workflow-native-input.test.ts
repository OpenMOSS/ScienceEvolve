import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import { cloneAgentOrchestrationTemplate } from "../../src/core/agent-orchestration.js";
import { mergeAgentConfigs } from "../../src/core/validation.js";
import { HarnessRuntimeFacade } from "../../src/core/harness-runtime/runtime.js";
import type { AgentRunRequest, ProjectState } from "../../src/core/types.js";
import type { SessionRef } from "../../src/core/harness-runtime/contracts.js";
import type { SerialWorkflowNotificationContext } from "../../src/core/serial-workflow-notifications.js";
import { workflowAdjustmentContextSources, type WorkflowAdjustmentNotificationFact } from "../../src/core/workflow-adjustment-notifications.js";
import { dshSessionArtifactPath } from "../../src/core/harness-runtime/adapters/dsh-adapter.js";

const roots: string[] = [], databases: CollaborationStateDatabase[] = [];
afterEach(async () => {
  databases.splice(0).forEach(database => database.close());
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })));
});

type Harness = "codex" | "claude-code" | "dsh" | "pi";
// Controlled native CLIs exercise the actual built-in Adapter and process/input
// transport. They do not establish receipt by an installed production model.
async function nativeExecutable(root: string, workspacePath: string, harness: Harness, echo = true) {
  const executable = join(root, `${harness}.mjs`), capture = join(root, `${harness}-input.json`);
  await writeFile(executable, `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { zstdCompressSync } from "node:zlib";
const harness = ${JSON.stringify(harness)}, echo = ${JSON.stringify(echo)};
const args = process.argv.slice(2);
if (harness === "codex" && args[0] === "debug" && args[1] === "models") {
  console.log(JSON.stringify({ models: [{ slug: "fixture-model", use_responses_lite: false, tool_mode: null }] }));
  process.exit(0);
}
const emit = value => process.stdout.write(JSON.stringify(value) + "\\n");
const capture = prompt => {
  const workflowUpdates = [];
  for (const line of prompt.split("\\n").filter(line => line.startsWith("Context index: "))) {
    const index = JSON.parse(fs.readFileSync(line.slice("Context index: ".length), "utf8"));
    const source = index.entries.find(entry => entry.key === "workflow-updates");
    if (!source) continue;
    const list = JSON.parse(fs.readFileSync(path.join(index.baseDirectory, source.list.path), "utf8"));
    for (const entry of list.entries) workflowUpdates.push(JSON.parse(fs.readFileSync(path.join(list.baseDirectory, entry.detail.path), "utf8")));
  }
  fs.writeFileSync(${JSON.stringify(capture)}, JSON.stringify({ prompt, args, workflowUpdates }));
};
if (args.includes("--help") || args.includes("--version")) { console.log("Controlled native fixture 1.0"); process.exit(0); }
if (harness === "dsh") {
  let seq = 0;
  const event = (sessionId, type, data, extra = {}) => emit({ jsonrpc: "2.0", method: "session.event", params: {
    sessionId, event: { type, seq: seq++, time: Date.now(), data, ...extra }
  }});
  const lines = readline.createInterface({ input: process.stdin });
  lines.on("line", line => {
    const request = JSON.parse(line);
    if (request.method === "initialize") emit({ jsonrpc: "2.0", id: request.id, result: {
      serverInfo: { name: "deepseek-harness-sdk-runtime", version: "0.0.1" }
    }});
    else if (request.method === "shutdown") { emit({ jsonrpc: "2.0", id: request.id, result: {} }); lines.close(); }
    else if (request.method === "session/prompt") {
      const sessionId = request.params.sessionId;
      const prompt = request.params.contentBlocks.map(block => block.text ?? "").join("\\n"); capture(prompt);
      const artifact = path.join(process.env.DSH_HOME, "sessions", ${JSON.stringify(basename(dirname(dirname(dshSessionArtifactPath(root, workspacePath, "original-session")))))}, sessionId, "session.jsonl.zstd");
      fs.mkdirSync(path.dirname(artifact), { recursive: true });
      fs.writeFileSync(artifact, zstdCompressSync(Buffer.from(JSON.stringify({ type: "session", version: 0, id: sessionId, createdAt: Date.now(), cwd: process.cwd(), delegationDepth: 0 }) + "\\n")));
      emit({ jsonrpc: "2.0", id: request.id, result: { messageId: "original-user-input" } });
      emit({ jsonrpc: "2.0", method: "session.status", params: { sessionId, status: "running" } });
      event(sessionId, "sandbox/mode", { mode: "workspace-write" });
      event(sessionId, "turn/start", { turn: 1 });
      if (echo) event(sessionId, "user/message", { source: { kind: "user" }, content: [{ type: "text", text: prompt }] }, { surfaceOp: "append" });
      event(sessionId, "assistant/message", { turn: 1, step: 1,
        message: { role: "assistant", content: [{ type: "text", text: "Original native handoff." }] } });
      event(sessionId, "turn/end", { turn: 1, reason: { kind: "completed" } });
      emit({ jsonrpc: "2.0", method: "session.status", params: { sessionId, status: "idle" } });
    }
  });
} else {
  process.stdin.setEncoding("utf8");
  let wire = ""; for await (const chunk of process.stdin) wire += chunk;
  const prompt = harness === "claude-code" ? JSON.parse(wire).message.content.map(block => block.text ?? "").join("\\n") : wire;
  capture(prompt);
  if (harness === "codex") {
    emit({ type: "thread.started", thread_id: "e7994308-34ed-4e5a-9319-8261cbd0744c" });
    if (echo) emit({ type: "item.completed", item: { id: "original-user-input", type: "user_message", content: [{ type: "text", text: prompt }] } });
    emit({ type: "item.completed", item: { id: "original-answer", type: "agent_message", text: "Original native handoff." } });
    emit({ type: "turn.completed", usage: { input_tokens: 10, output_tokens: 3 } });
  } else if (harness === "claude-code") {
    const session_id = args[args.indexOf(args.includes("--resume") ? "--resume" : "--session-id") + 1];
    emit({ type: "system", subtype: "init", session_id });
    if (echo) emit({ type: "user", session_id, message: { role: "user", content: [{ type: "text", text: prompt }] } });
    emit({ type: "assistant", session_id, message: { role: "assistant", content: [{ type: "text", text: "Original native handoff." }] } });
    emit({ type: "result", subtype: "success", is_error: false, session_id, result: "Original native handoff." });
  } else {
    const file = args[args.indexOf("--session") + 1];
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ type: "session", version: 3, id: "original-pi-session", timestamp: new Date().toISOString(), cwd: process.cwd() }) + "\\n");
    emit({ type: "session", id: "original-pi-session" });
    if (echo) emit({ type: "message_end", message: { role: "user", content: [{ type: "text", text: prompt }] } });
    emit({ type: "message_end", message: { role: "assistant", content: [{ type: "text", text: "Original native handoff." }] } });
  }
}
`, { mode: 0o700 });
  return { executable, capture };
}

async function fixture(harness: Harness, large = false, echo = true) {
  const root = await mkdtemp(join(tmpdir(), "openfars-serial-native-input-")); roots.push(root);
  const projectId = `prj_${"1".repeat(32)}`, invocationId = "inv_original_notification";
  const projectPath = join(root, projectId), workspacePath = join(projectPath, "workspaces"),
    runtimePath = join(projectPath, "runtime", invocationId), inboxPath = join(projectPath, "messages", `0001_${invocationId}_to_main.md`);
  await Promise.all([mkdir(workspacePath, { recursive: true }), mkdir(runtimePath, { recursive: true }), mkdir(join(projectPath, "messages"), { recursive: true })]);
  await Promise.all([writeFile(inboxPath, "Original Main assignment.\n"), writeFile(join(workspacePath, "Memory.md"), "Original persistent memory.\n")]);
  const orchestration = cloneAgentOrchestrationTemplate(), agents = mergeAgentConfigs(undefined, orchestration);
  const database = CollaborationStateDatabase.open({ databasePath: join(root, "state.sqlite"), serviceId: "serial-native-test", hostId: "test", topology: "single-host" }); databases.push(database);
  database.createProject({ projectId, workflowRevision: 1, workflowSnapshot: orchestration, workerCapacity: 1, git: { enabled: false, status: "disabled" } });
  database.initializeScopedConfiguration(projectId, { agents, skillDefinitions: {}, mcpDefinitions: {} }); database.initializeSerialWorkflowJournal(projectId);
  const context: SerialWorkflowNotificationContext = { projectId, agentId: "main", invocationId, agentExecutionId: "original-native-task", mainInvocationSeq: 1 };
  for (let index = 0; index < (large ? 8 : 1); index++) {
    const current = database.workflowAdjustmentCurrent(projectId), proposal = structuredClone(current.snapshot), requestId = `original-change-${index}`;
    proposal.agents.idea.instructions = `Original role update ${index}`;
    database.submitUserWorkflowAdjustment({ projectId, requestId, base: current.version, proposal,
      explanation: large ? `原始说明${index}` + "界\\\"\n".repeat(4990) : "Original explanation" });
    const prepared = database.prepareSerialWorkflowAdjustmentPublication(projectId, requestId);
    if (!prepared.ready) throw new Error("Controlled original configuration must be ready");
    database.publishSerialWorkflowAdjustment(projectId, requestId, prepared.validationToken, { sessions: { agents }, waitingReason: () => undefined });
  }
  const project = { id: projectId, agents: { main: { ...agents.main, harness, model: "fixture-model", gatewayId: "gwy_fixture",
    gatewaySnapshot: { id: "gwy_fixture", name: "Fixture Gateway", url: "https://gateway.example.test/v1", apiKey: "fixture-secret",
      models: ["fixture-model"], defaultModel: "fixture-model", protocol: "responses",
      nativeProtocol: harness === "codex" ? "responses" : harness === "pi" ? "chat-completions" : "anthropic-messages", routeMode: "proxy" },
    sessionPersistence: true, permission: "workspace", webSearch: false, skills: [], autoSkills: [], mcpServers: [] } },
    agentSessionIds: {}, agentSessions: {}, agentSessionMeta: {} } as unknown as ProjectState;
  const prepared: Array<{ inputId: string; expectedSession?: SessionRef; text: string; facts: WorkflowAdjustmentNotificationFact[] }> = [], received: SessionRef[] = [],
    nativeInputs: string[] = [], actualSessions: SessionRef[] = [];
  const request: AgentRunRequest = { project, agent: "main", kind: "main", permission: "workspace", invocationId, inboxPath,
    projectPath, workspacePath, schemaPath: join(projectPath, "schema.json"), runtimePath,
    skillPaths: [], autoSkillPaths: [], availableSkillPaths: [], onModelActivity: vi.fn(),
    onNativeUserInput: event => { nativeInputs.push(String(event.message)); },
    onDurableSessionStarted: session => { actualSessions.push(session); },
    onPrepareWorkflowAdjustmentInput: async input => {
      const notification = database.prepareSerialWorkflowAdjustmentInput(context, input.inputId, input.expectedSession);
      const details = notification ? await input.publishContext?.(workflowAdjustmentContextSources(notification.facts)) : undefined;
      const text = notification ? `${notification.text}${details ? `\n\n${details}` : ""}` : "";
      prepared.push({ ...input, text, facts: notification?.facts ?? [] }); return text;
    },
    onWorkflowAdjustmentInputReceived: (event, session, inputId) => {
      database.confirmSerialWorkflowAdjustmentInput(context, inputId, session, event); received.push(session);
    }
  };
  const native = await nativeExecutable(root, workspacePath, harness, echo);
  const runtime = new HarnessRuntimeFacade({ harnessExecutables: { [harness]: native.executable },
    protocolProxyFactory: async () => ({ baseUrl: "http://127.0.0.1:43198/v1", token: "fixture-token", close: async () => undefined }) });
  const receiptEvents = () => database.eventsAfter(projectId, 0, 1000).filter(event => event.type === "workflow.adjustment.notification.received");
  return { root, database, context, request, prepared, received, nativeInputs, actualSessions, native, runtime, receiptEvents };
}

describe("Ordinary workflow notification input through the actual built-in process transports", () => {
  it.each<Harness>(["codex", "claude-code", "dsh", "pi"])("%s carries complete large accepted facts and records the actual native Session once", async harness => {
    const f = await fixture(harness, true);
    const result = await f.runtime.run(f.request, async () => undefined, new AbortController().signal);
    expect(result.handoff).toContain("Original native handoff");
    expect(f.prepared).toHaveLength(1);
    const native = JSON.parse(await readFile(f.native.capture, "utf8"));
    const captured = native.prompt as string;
    expect(f.nativeInputs.some(text => text === captured), `Native input lengths ${f.nativeInputs.map(text => text.length)}, actual ${captured.length}`).toBe(true);
    expect(captured.includes(f.prepared[0]!.text), `Prepared ${f.prepared[0]!.text.length}, actually sent ${captured.length}`).toBe(true);
    expect(f.received).toHaveLength(1);
    const full = f.prepared[0]!.text, actual = f.received[0]!;
    const details = native.workflowUpdates as Array<{ id: string; status: string } & WorkflowAdjustmentNotificationFact>;
    expect(Buffer.byteLength(JSON.stringify(details))).toBeGreaterThan(128 * 1024);
    expect(details).toEqual(f.prepared[0]!.facts.map(fact => ({ id: fact.record.requestId, status: fact.transition.status, ...fact })));
    expect(details.map(fact => fact.record.requestId)).toEqual(Array.from({ length: 8 }, (_, index) => `original-change-${index}`));
    expect(captured).toContain("source=workflow-updates");
    expect(captured).not.toContain(details[0]!.record.explanation);
    expect(captured.includes(full)).toBe(true);
    expect(actual.nativeId).not.toMatch(/^pending:/); expect(actual).toEqual(f.actualSessions.at(-1));
    if (harness === "codex") expect(f.prepared[0]!.expectedSession).toBeUndefined();
    else expect(f.prepared[0]!.expectedSession?.nativeId).toBe(actual.nativeId);
    expect(f.receiptEvents()).toHaveLength(8);
    expect(f.database.prepareSerialWorkflowAdjustmentInput(f.context, "next-legitimate-input", actual)).toBeUndefined();
    expect(f.database.projectState(f.context.projectId).executions).toEqual([]);
  }, 15_000);

  it("a successful native turn without the received input keeps notification facts pending", async () => {
    const f = await fixture("codex", false, false);
    const result = await f.runtime.run(f.request, async () => undefined, new AbortController().signal);
    expect(result.handoff).toContain("Original native handoff"); expect(f.received).toEqual([]); expect(f.receiptEvents()).toEqual([]);
    expect(f.database.prepareSerialWorkflowAdjustmentInput(f.context, "next-legitimate-input", f.actualSessions.at(-1))!.text).toContain("original-change-0");
  });

  it("a failure preparing the last input sends no prompt and preserves facts for a later legal invocation", async () => {
    const f = await fixture("codex");
    const prepare = vi.fn(() => { throw new Error("Original boundary persistence failed"); });
    f.request.onPrepareWorkflowAdjustmentInput = prepare;
    await expect(f.runtime.run(f.request, async () => undefined, new AbortController().signal)).rejects.toThrow();
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(f.receiptEvents()).toEqual([]);
    expect(f.database.prepareSerialWorkflowAdjustmentInput(f.context, "later-input")!.text).toContain("original-change-0");
  });
});
