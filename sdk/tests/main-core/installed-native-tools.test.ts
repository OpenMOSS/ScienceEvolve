import { existsSync, promises as fs } from "node:fs";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { HarnessRuntimeFacade } from "../../src/core/harness-runtime/runtime.js";
import { HarnessRuntimeResidentAdapter } from "../../src/core/harness-runtime/resident-runtime-adapter.js";
import { startProtocolProxy } from "../../src/core/protocol-router.js";
import type { AgentRunRequest, ProjectState } from "../../src/core/types.js";
const exec = promisify(execFile), roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true }))); });
const installed = [
  ["codex", "../harness/codex/node_modules/.bin/codex"],
  ["claude-code", "../harness/claude code/node_modules/.bin/claude"],
  ["pi", "../harness/pi/node_modules/.bin/pi"],
  ["dsh", "../harness/dsh/node_modules/.bin/dsh"]
] as const;
function stream(number: number, tool?: { name: string; args: unknown }) {
  const frames: unknown[] = [];
  if (tool) {
    const item = { id: `fc_${number}`, call_id: `call_${number}`, type: "function_call", name: tool.name, arguments: JSON.stringify(tool.args) };
    frames.push({ type: "response.output_item.added", output_index: 0, item: { ...item, arguments: "" } },
      { type: "response.function_call_arguments.delta", output_index: 0, item_id: item.id, delta: item.arguments },
      { type: "response.function_call_arguments.done", output_index: 0, item_id: item.id, arguments: item.arguments },
      { type: "response.output_item.done", output_index: 0, item });
  } else frames.push({ type: "response.output_text.delta", delta: "Native script and background task verified." });
  frames.push({ type: "response.completed", response: { id: `resp_${number}`, status: "completed", usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 } } });
  return new Response(frames.map(frame => `data: ${JSON.stringify(frame)}\n\n`).join(""), { headers: { "content-type": "text/event-stream" } });
}
for (const [harnessId, relative] of installed) describe.runIf(existsSync(relative))(`installed ${harnessId} native tools`, () => {
  for (const skillCount of [0, 1, 2]) it.each(["ordinary", "resident"] as const)(`executes native files/Python/background through %s with only ${skillCount} selected Skills`, async mode => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-native-cli-")); roots.push(root);
    // Native orphan cleanup uses globally unique logical identities, as production does.
    const projectId = `prj_${randomUUID().replaceAll("-", "")}`, invocationId = `inv_${randomUUID()}`;
    const executionId = `native-${randomUUID()}`;
    const projectPath = path.join(root, projectId), workspacePath = mode === "ordinary" ? path.join(projectPath, "workspaces") : path.join(projectPath, "git-worktrees", "agents", "coder");
    const runtimePath = path.join(projectPath, "runtime", invocationId), inboxPath = path.join(projectPath, "messages", `0001_${invocationId}_to_coder.md`);
    await Promise.all([fs.mkdir(workspacePath, { recursive: true }), fs.mkdir(runtimePath, { recursive: true }), fs.mkdir(path.dirname(inboxPath), { recursive: true })]);
    await fs.writeFile(inboxPath, "Run the isolated native tool fixture."); await fs.writeFile(path.join(workspacePath, "Memory.md"), "Fixture.\n");
    await exec("git", ["init", "--initial-branch=main"], { cwd: workspacePath });
    const selectedPaths: string[] = [];
    for (let index = 0; index < skillCount; index++) {
      const skill = path.join(root, "library", `wf-selected-${index}`, "SKILL.md");
      await fs.mkdir(path.dirname(skill), { recursive: true });
      await fs.writeFile(skill, `---\nname: wf-selected-${index}\ndescription: Selected workflow fixture ${index}\n---\nRead only when needed.\n`);
      selectedPaths.push(skill);
    }
    for (const base of [".agents", ".claude"]) {
      const extra = path.join(workspacePath, base, "skills", "wf-unselected-global-probe"); await fs.mkdir(extra, { recursive: true });
      await fs.writeFile(path.join(extra, "SKILL.md"), "---\nname: wf-unselected-global-probe\ndescription: Must never be loaded\n---\nUnselected host data.\n");
    }
    const gateway = { id: "gwy_fixture", name: "Synthetic local model", url: "https://fixture.invalid/v1", apiKey: "fixture-only",
      models: ["fixture-model"], defaultModel: "fixture-model", protocol: "responses" };
    const project = { id: projectId, title: "Native tools", requirement: "Fixture", git: { enabled: false },
      agents: { coder: { model: "fixture-model", harness: harnessId, gatewayId: gateway.id, gatewaySnapshot: gateway,
        skills: selectedPaths, autoSkills: [], mcpServers: [], instructions: "Run the native fixture", permission: "workspace", webSearch: false,
        sessionPersistence: true, decisionBy: "main" } }, agentSessionIds: {}, agentSessions: {}, agentSessionMeta: {}, taskSessionIds: {}, taskSessionRefs: {} } as unknown as ProjectState;
    let calls = 0; const advertised: string[] = [], traces: string[] = [], feedback: string[] = [];
    const skillObservations: Array<{ unselected: boolean; selected: boolean[]; evidence: string }> = [];
    const script = `python3 -c 'from pathlib import Path; p=Path("native-probe"); p.mkdir(exist_ok=True); (p/"a").write_text("native-ok"); (p/"a").rename(p/"b"); assert (p/"b").read_text()=="native-ok"; (p/"b").unlink()' && (python3 -c 'from pathlib import Path; Path("background.done").write_text("completed")' & wait) && printf 'native-shell-ok'`;
    const factory: typeof startProtocolProxy = options => startProtocolProxy({ ...options, validateGatewayTarget: async () => undefined,
      modelFetch: async (_url, init) => {
        const body = JSON.parse(String(init?.body)); calls++;
        const actualInput = JSON.stringify(body.input ?? body.messages);
        skillObservations.push({ unselected: actualInput.includes("wf-unselected-global-probe"), selected: Array.from({ length: skillCount }, (_, index) => actualInput.includes(`wf-selected-${index}`)), evidence: actualInput.includes("wf-unselected-global-probe") ? actualInput.slice(Math.max(0, actualInput.indexOf("wf-unselected-global-probe") - 180), actualInput.indexOf("wf-unselected-global-probe") + 220) : "" });
        for (const item of body.input ?? []) if (item.type === "function_call_output") feedback.push(String(item.output).slice(0, 3000));
        const tools = (body.tools ?? []).map((tool: any) => tool.function ?? tool);
        advertised.push(...tools.map((tool: any) => tool.name).filter(Boolean));
        if (calls > 8) throw new Error(`Unexpected native loop: ${advertised.join(",")}`);
        if (calls > 1) return stream(calls);
        const tool = tools.find((tool: any) => /^(?:exec_command|shell_command|shell|Bash|bash)$/.test(tool.name));
        if (!tool) throw new Error(`Native Shell absent: ${advertised.join(",")}`);
        const props = tool.parameters?.properties ?? {};
        const key = "cmd" in props ? "cmd" : "command";
        const args: Record<string, unknown> = { [key]: props[key]?.type === "array" ? ["bash", "-lc", script] : script };
        if (props.description) args.description = "Verify isolated native files and background execution";
        return stream(calls, { name: tool.name, args });
      } });
    const runtime = new HarnessRuntimeFacade({ harnessExecutables: { [harnessId]: path.resolve(relative) }, protocolProxyFactory: factory });
    const request: AgentRunRequest = { project, agent: "coder", kind: "worker", permission: "workspace", invocationId, inboxPath,
      projectPath, workspacePath, runtimePath, schemaPath: path.join(runtimePath, "schema.json"), skillPaths: selectedPaths, autoSkillPaths: [], availableSkillPaths: selectedPaths,
      taskSessionId: "original-task", sessionContinuity: "strict", onDurableSessionStarted: async (session, legacy) => {
        project.agentSessions.coder = session; project.agentSessionIds.coder = legacy; project.taskSessionRefs["original-task"] = session;
      } };
    const trace = (_kind: string, message: string) => { traces.push(message); };
    let result;
    if (mode === "ordinary") { try { result = await runtime.run(request, trace, AbortSignal.timeout(40_000)); } catch (cause) { throw new Error(traces.slice(-12).join("\n"), { cause }); } }
    else {
      request.executionContext = { role: "delivery", executionId, ownershipEpoch: 1, nodeRunId: "fixture-node",
        taskId: "original-task", executionBranch: "main", executionWorktree: workspacePath };
      const adapter = new HarnessRuntimeResidentAdapter({ runtime, routeFactory: async () => {
        const sourceProtocol = harnessId === "claude-code" ? "anthropic-messages" : harnessId === "codex" ? "responses" : "chat-completions";
        const proxy = await factory({ gatewayUrl: gateway.url, apiKey: gateway.apiKey, model: "fixture-model", sourceProtocol, targetProtocol: "responses", force: true } as any);
        return { ...proxy, sourceProtocol, targetProtocol: "responses", proxy, resetFailure: proxy.resetFailure, getFailure: proxy.getFailure, close: proxy.close } as any;
      } });
      const handle = await adapter.open({ request, launchRoute: { baseUrl: "http://127.0.0.1:1/v1", token: "fixture-only" },
        executionRuntimePath: path.join(projectPath, "runtime", "resident"),
        filesystemAuthorityInput: { serviceUserRoot: root, projectWorktreeRoot: path.join(projectPath, "git-worktrees"), projectWorktrees: [workspacePath], protectedRoots: [runtimePath] },
        turnAuthority: { activate: async () => {}, deactivate: async () => {} } as any, mcpRows: [], signal: AbortSignal.timeout(40_000), onTrace: trace });
      let failure: unknown;
      try { result = await handle.submit({ inputId: `${executionId}-turn`, invocationId, prompt: "Run the isolated native fixture." }); }
      catch (cause) { failure = cause; throw new Error(traces.slice(-12).join("\n"), { cause }); }
      finally { try { await handle.close(); } catch (error) { if (!failure) throw error; } }
    }
    expect(result.handoff, traces.join("\n")).toContain("verified");
    const completed = await fs.readFile(path.join(workspacePath, "background.done"), "utf8").catch(error => { throw new Error(`${error.message}\nNative feedback: ${feedback.join("\n")}`, { cause: error }); });
    expect(completed).toBe("completed");
    expect(await fs.readdir(path.join(workspacePath, "native-probe"))).toEqual([]);
    expect(calls).toBeGreaterThanOrEqual(2);
    expect(skillObservations.every(row => !row.unselected), `${harnessId}/${mode}: unselected Skill leaked ${skillObservations.map(row => row.evidence).join("\n")}`).toBe(true);
    expect(skillObservations[0]!.selected.every(Boolean), `${harnessId}/${mode}: selected Skill absent`).toBe(true);
    expect(advertised).not.toContain("read_file");
  }, 50_000);
});
