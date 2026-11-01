import { existsSync, promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { AgentRunRequest, ProjectState } from "../../src/core/types.js";
import type { HarnessEvent } from "../../src/core/harness-runtime/contracts.js";
import { HarnessRuntimeFacade } from "../../src/core/harness-runtime/runtime.js";
import { startProtocolProxy } from "../../src/core/protocol-router.js";

const executable = process.env.SCIENCEEVOLVE_TEST_DSH_BIN ?? path.resolve("../harness/dsh/node_modules/.bin/dsh");
const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true })));
});

// Exercise the installed native CLI and real proxy, with a synthetic upstream
// Responses stream. No production project, credentials or model calls are used.
function response(number: number, args?: string) {
  const frames: Record<string, unknown>[] = [];
  if (args !== undefined) {
    const item = { id: `fc_${number}`, call_id: `call_${number}`, type: "function_call", name: "write", arguments: args };
    frames.push({ type: "response.output_item.added", output_index: 1, item: { ...item, arguments: "" } });
    const split = Math.floor(args.length / 2);
    for (const delta of [args.slice(0, split), args.slice(split)]) {
      frames.push({ type: "response.function_call_arguments.delta", output_index: 1, item_id: item.id, delta });
    }
    frames.push({ type: "response.function_call_arguments.done", output_index: 1, item_id: item.id, arguments: args },
      { type: "response.output_item.done", output_index: 1, item });
  } else frames.push({ type: "response.output_text.delta", delta: "The fixture file has been written and checked." });
  frames.push({ type: "response.completed", response: { id: `resp_${number}`, status: "completed",
    usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 } } });
  return new Response(frames.map(frame => `data: ${JSON.stringify(frame)}\n\n`).join(""),
    { headers: { "content-type": "text/event-stream" } });
}

async function fixture(plan: (number: number) => string | undefined) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-dsh-protocol-test-"));
  roots.push(root);
  const projectPath = path.join(root, "prj_fixture"), workspacePath = path.join(projectPath, "workspaces");
  const runtimePath = path.join(projectPath, "runtime", "inv_fixture");
  const inboxPath = path.join(projectPath, "messages", "0001_inv_fixture_to_coder.md");
  await Promise.all([fs.mkdir(workspacePath, { recursive: true }), fs.mkdir(path.dirname(inboxPath), { recursive: true }),
    fs.mkdir(runtimePath, { recursive: true })]);
  await fs.writeFile(path.join(workspacePath, "Memory.md"), "Isolated fixture.\n");
  await fs.writeFile(inboxPath, "Write analysis/probe.md. Correct rejected tool input and continue the same task.\n");
  const gateway = { id: "gwy_fixture", name: "Synthetic only", url: "https://gateway.invalid/v1", apiKey: "fixture-only",
    models: ["fixture-model"], defaultModel: "fixture-model", protocol: "responses" };
  const project = { id: "prj_fixture", title: "Isolated correction test", requirement: "Write the fixture file.", git: { enabled: false },
    agents: { coder: { model: "fixture-model", harness: "dsh", gatewayId: gateway.id, gatewaySnapshot: gateway,
      skills: [], autoSkills: [], mcpServers: [], instructions: "Complete the local fixture task.", permission: "workspace",
      webSearch: false, sessionPersistence: true, decisionBy: "main" } },
    agentSessionIds: {}, agentSessions: {}, agentSessionMeta: {}, taskSessionIds: {}, taskSessionRefs: {} } as unknown as ProjectState;
  const requests: string[] = [], events: HarnessEvent[] = [], sessions: string[] = [];
  const traces: Array<{ message: string; data?: Record<string, unknown> }> = [];
  const runtime = new HarnessRuntimeFacade({ harnessExecutables: { dsh: executable },
    protocolProxyFactory: options => startProtocolProxy({ ...options, validateGatewayTarget: async () => undefined,
      modelFetch: async (_url, init) => {
        const body = JSON.parse(String(init?.body));
        requests.push(JSON.stringify(body.input ?? body.messages));
        if (requests.length > 6) throw new Error("Unexpected native retry loop");
        return response(requests.length, plan(requests.length));
      } }) });
  const request: AgentRunRequest = { project, agent: "coder", kind: "worker", permission: "workspace", invocationId: "inv_fixture",
    inboxPath, projectPath, workspacePath, runtimePath, schemaPath: path.join(projectPath, "schema.json"),
    skillPaths: [], autoSkillPaths: [], availableSkillPaths: [], taskSessionId: "original-task", sessionContinuity: "strict",
    onDurableSessionStarted: async (session, legacyId) => {
      sessions.push(session.nativeId);
      project.agentSessions.coder = session; project.agentSessionIds.coder = legacyId;
      project.taskSessionRefs["original-task"] = session; project.taskSessionIds["original-task"] = legacyId;
    }, onOfficialHarnessEvent: event => { events.push(event as unknown as HarnessEvent); } };
  return { run: () => runtime.run(request, (_kind, message, data) => { traces.push({ message, data }); }, AbortSignal.timeout(25_000)),
    requests, project, workspacePath, sessions, events, traces };
}

const corrected = JSON.stringify({ file_path: "analysis/probe.md", content: "corrected fixture\n" });
const malformed = '{"file_path":"analysis/probe.md","content":"unfinished';

describe.runIf(existsSync(executable))("installed DSH error correction", () => {
  it("lets the native write tool return a detailed type error and correct it in the same turn", async () => {
    const test = await fixture(number => number === 1 ? JSON.stringify({ file_path: "analysis/probe.md", content: 23 })
      : number === 2 ? corrected : undefined);
    expect((await test.run()).handoff).toContain("written and checked");
    expect(test.requests).toHaveLength(3);
    expect(test.requests[1]).toContain('"content" must be a string'.replaceAll('"', '\\"'));
    expect(test.events.some(event => event.tool?.isError || event.tool?.status === "failed")).toBe(true);
    expect(test.sessions).toHaveLength(1);
    expect(test.traces.some(trace => trace.data?.automaticRecovery)).toBe(false);
    expect(await fs.readFile(path.join(test.workspacePath, "analysis/probe.md"), "utf8")).toBe("corrected fixture\n");
  }, 30_000);

  it("resumes the strict original task after malformed JSON, feeds back the parser error and preserves completed tool history", async () => {
    const test = await fixture(number => number === 1
      ? JSON.stringify({ file_path: "analysis/evidence.md", content: "completed-before-protocol-error\n" })
      : number === 2 ? malformed : number === 3 ? corrected : undefined);
    expect((await test.run()).handoff).toContain("written and checked");
    expect(test.requests).toHaveLength(4);
    expect(test.requests[2]).toContain("Protocol validation feedback");
    expect(test.requests[2]).toContain("Unterminated string");
    expect(test.requests[2]).toContain("completed-before-protocol-error");
    expect(test.sessions).toHaveLength(1);
    expect(test.project.taskSessionRefs["original-task"]).toMatchObject({ nativeId: test.sessions[0], generation: 0 });
    expect(test.traces.some(trace => trace.data?.recoveryStrategy === "native-session-resume")).toBe(true);
    expect(await fs.readFile(path.join(test.workspacePath, "analysis/evidence.md"), "utf8")).toBe("completed-before-protocol-error\n");
    expect(await fs.readFile(path.join(test.workspacePath, "analysis/probe.md"), "utf8")).toBe("corrected fixture\n");
  }, 30_000);

  it("stops after one same-Session correction attempt without masking the protocol error", async () => {
    const test = await fixture(() => malformed);
    await expect(test.run()).rejects.toMatchObject({ code: "PROTOCOL_RECOVERY_EXHAUSTED", retryable: false,
      details: { recoveryLimit: 1, toolName: "write", protocolMessage: expect.stringContaining("Unterminated string") } });
    expect(test.requests).toHaveLength(2);
    expect(test.sessions).toHaveLength(1);
    expect(test.project.taskSessionRefs["original-task"]).toMatchObject({ nativeId: test.sessions[0], generation: 0 });
    expect(test.requests[1]).toContain("Protocol validation feedback");
    expect(test.events.some(event => event.kind === "tool.started" && event.tool?.name === "write")).toBe(false);
    await expect(fs.access(path.join(test.workspacePath, "analysis/probe.md"))).rejects.toMatchObject({ code: "ENOENT" });
  }, 30_000);
});
