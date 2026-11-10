import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const mainHelp = `ScienceEvolve CLI — default main engine

Usage: scievolve <command> [--engine main] --data-dir <absolute-dedicated-directory>
       [--runtime-config <deployment-json>]

  harnesses
  workflow init OUTPUT_JSON
  workflow validate WORKFLOW_JSON [--preset-id ID]
  gateway list
  gateway add --name N --url U --protocol P --models M1,M2 --default-model M1 --key-env ENV
              [--context-windows-file FILE] [--reasoning-file FILE]
  gateway import --harness H --model M --source env|profile [--profile-path ABS_PATH] [--name N]
  gateway test ID --model M --harness codex|pi|dsh|all [--reasoning-option ID]
  start WORKFLOW_JSON REQUIREMENT_TXT     Alias of run start
  run start WORKFLOW_JSON REQUIREMENT_TXT [--title T] [--preset-id ID]
            (--gateway ID | --gateway-bindings FILE | --native-codex-profile ID) [--model M --harness H]
            [--workspace <existing-directory>] (relative to launch cwd)
            [--inputs FILE_OR_DIRECTORY | --inputs-file JSON_ARRAY_FILE] [--input-description TEXT]
            [--source-workspace <absolute-source-directory> [--source-files <json-array-file>]]
  run list | show ID | events ID [--after-seq N]
  run resume ID | retry-git ID
  run pause ID | cancel ID
  run export ID --output <absolute-new-directory>
  run sync-workspace ID
  run input ID TEXT_FILE [--mode wait|interrupt] [--request-id ID]
  run respond ID TEXT_FILE

API and CLI use the main engine. --engine main is optional.
Repository examples and SDK default use main Git-off; the Git-on example stays separate.
Bind a Gateway explicitly and select --workspace for original-directory execution.
Use a dedicated data directory; existing legacy data is not auto-migrated.
Main uses its workflow validator and v3/Git scheduler.
--workspace runs Git-off workflows in place; Git-on imports the project into existing
isolated worktrees and automatically delivers the completed integrated result back.
It is mutually exclusive with --source-workspace, which remains read-only.
--inputs is relative to launch cwd; --inputs-file contains strings or {path,name?}
objects, with source paths relative to that JSON file. Inputs are copied before Agents
start into shared user_inputs, outside Git worktrees and automatic publication.
Workflow JSON may set inputs and inputDescription; its relative input paths resolve
against the workflow file. CLI flags override each field independently. An empty JSON
array disables workflow inputs; an empty --input-description clears its description.
--input-description is trimmed and limited to 2000 characters. Inputs are untrusted
reference data; links, collisions, over 1000 files, 50 MiB/file or 200 MiB total fail.
Delivery preserves original Git metadata/index and refuses concurrent file conflicts.
Resolve a blocked delivery then run sync-workspace; no force-overwrite is provided.
The workspace must exist and must not overlap the dedicated data directory.
Native Codex OAuth binds a deployment
profile alias via --native-codex-profile; Codex owns auth.json and token renewal.
gateway import reads API-key env/profile configuration once into the main gateway
library, without changing native profiles or running a probe. OAuth-only profiles
and credential shell helpers are rejected; no silent env/profile fallback occurs.
--source-workspace seeds a Git-enabled run from a read-only snapshot, not in-place execution.
Git sources default to tracked working-tree files (including selected dirty contents).
Non-Git sources require --source-files; credentials, management paths, dependencies,
symlinks/submodules and hardlinks are rejected. History, .git and hooks are not imported.
run export writes only a completed Git run's integrated main tree, never dirty Agent
worktrees or .git; the destination must be new and outside runtime data.
All Agents must bind an explicit route; --gateway-bindings is credential-free JSON:
{ "defaultGatewayId": "gateway-id", "agents": { "review": "other-gateway-id" } }
Native selection: { "defaultNativeCodexProfileId": "login" } or
{ "agents": { "main": { "nativeCodexProfileId": "login" } } }.
Runtime JSON nativeCodexProfiles maps aliases to absolute/relative login directories.
These aliases/paths are pinned on first open, and cannot change underneath saved runs.
The native route selects the official OpenAI provider, not a configured middleman.
Runtime JSON accepts harnesses (native/JS paths), skillRoots, userSkillRoot,
execution, timeouts and git { tokenEnv, expectedIdentity }. Git credentials default
to main's Git credential helper; tokenEnv names an environment variable, never a token.
Gateway keys are read through --key-env or the explicit gateway import command.
Output is redacted JSON Lines. Imported API keys are stored in private runtime data.

The data directory must be explicit: SCIENCEEVOLVE_DATA_DIR and ~/.scienceevolve/data are
not used. Opening saved data follows main's automatic recovery rules, including
for list/show/events; these are NOT offline read-only commands. Do not open data
already owned by another process. Different engines/revisions refuse shared data.
Git-enabled runs can CREATE/PUSH real GitHub repositories and PRs; model runs/probes
may incur charges. Review workflow Git repository settings before starting.

Git-on cancel / Ctrl+C / SIGTERM uses main's resumable Stop (paused after confirmed
native Stop), NOT terminal cancellation. Git-off cancel is terminal; signals request
a safe-point pause. Explicit pause waits for the current turn's safe point.
Repeated signals do not force-kill. Resume instructions are printed only after close
confirms Stop and releases the data lock. The pinned core includes declared shared
fixes for Git authorization checkpoints and source MCP; see docs/main-runtime-migration-zh.md.`;

/** CLI transport only. The optional services parameter is a deterministic test seam, never a CLI flag. */
export async function runMainCli(positionals, options, services = {}) {
  const api = services.api ?? await import("../dist/main.js");
  const stdout = services.stdout ?? process.stdout;
  const stderr = services.stderr ?? process.stderr;
  const signals = services.signals ?? process;
  let exitCode = 0;
  const line = (value) => stdout.write(`${JSON.stringify(value)}\n`);
  const guidance = (value) => stderr.write(`${value}\n`);
  const harnesses = ["codex", "pi", "dsh"];
  function only(names, count, args) {
    const allowed = new Set(["engine", "data-dir", "runtime-config", ...names]);
    for (const name of options.keys()) if (!allowed.has(name)) throw new Error(`Unknown main-engine option --${name}`);
    if (args.length !== count) throw new Error(`Expected ${count} positional argument(s); received ${args.length}`);
  }
  function required(name) {
    const value = options.get(name);
    if (typeof value !== "string" || !value.trim()) throw new Error(`Missing --${name}`);
    return value;
  }
  function harness(name) {
    if (!harnesses.includes(name)) throw new Error(`--harness must be one of: ${harnesses.join(", ")}`);
    return name;
  }
  function shellArgument(value) {
    return /^[a-zA-Z0-9_./:-]+$/.test(value) ? value : "'" + value.replaceAll("'", process.platform === "win32" ? "''" : "'\"'\"'") + "'";
  }
  function resumeGuidance(id, dataDir) {
    const args = ["scievolve", "run", "resume", id, "--engine", "main", "--data-dir", dataDir];
    if (options.has("runtime-config")) args.push("--runtime-config", path.resolve(required("runtime-config")));
    guidance(`任务已暂停，现场已保存：${id}\n恢复命令${process.platform === "win32" ? "（PowerShell）" : ""}：\n${args.map(shellArgument).join(" ")}`);
  }
  async function withSdk(action) {
    const dataDir = required("data-dir");
    if (!path.isAbsolute(dataDir)) throw new Error("--engine main requires an absolute dedicated --data-dir");
    const config = options.has("runtime-config") ? await api.loadMainRuntimeConfig(required("runtime-config")) : {};
    let interrupted = false;
    let onInterrupt;
    const interrupt = () => {
      if (interrupted) return;
      interrupted = true;
      if (onInterrupt) onInterrupt();
      else guidance("收到停止请求；等待当前初始化或操作安全收尾后释放目录锁，不会强制杀进程。");
    };
    const lifecycle = { register(handler) {
      onInterrupt = handler;
      if (interrupted) handler();
      return () => { if (onInterrupt === handler) onInterrupt = undefined; };
    }, retrySignal() { interrupted = false; } };
    // Install before opening a data directory: initialization/recovery can be asynchronous.
    signals.on("SIGINT", interrupt); signals.on("SIGTERM", interrupt);
    let result;
    let sdk;
    try {
      sdk = await api.createMainResearchSdk({ ...config, dataDir });
      if (interrupted) {
        exitCode = 130;
        line({ type: "runtime.open.interrupted", engine: "main" });
      } else result = await action(sdk, lifecycle);
    } finally {
      try { await sdk?.close(); }
      finally { signals.off("SIGINT", interrupt); signals.off("SIGTERM", interrupt); }
    }
    if (result?.resumeRunId) resumeGuidance(result.resumeRunId, dataDir);
  }
  async function foreground(run, afterSeq, lifecycle) {
    let requested = false;
    let pendingStop;
    const requestStop = () => {
      if (requested) return;
      requested = true;
      line({ type: "run.stop.requested", engine: "main", runId: run.id });
      guidance("正在保存并停止；Git 模式保留可恢复现场，普通模式等待安全暂停点。不会强制杀进程。");
      pendingStop = (async () => {
        const state = await run.snapshot();
        if (["completed", "cancelled"].includes(state.status)) return;
        if (state.git?.enabled) await run.cancel();
        else await run.pause();
      })().catch((error) => {
        // A failed Stop is not a successful pause. Keep following the actual state.
        requested = false;
        lifecycle.retrySignal();
        line({ type: "run.stop.error", engine: "main", runId: run.id, message: error.message });
      });
    };
    const unregister = lifecycle.register(requestStop);
    try {
      for await (const event of run.events({ afterSeq })) line({ type: "event", engine: "main", runId: run.id, event });
      await pendingStop;
      const result = await run.wait();
      line({ type: "run.result", engine: "main", runId: run.id, result });
      exitCode = result.status === "completed" ? 0 : requested && result.status === "paused" ? 130 : 2;
      if (result.status === "paused") return { resumeRunId: run.id };
    } finally {
      unregister();
    }
  }
  const [command, action, ...args] = positionals[0] === "start"
    ? ["run", "start", ...positionals.slice(1)] : positionals;
  if (command === "workflow") {
    if (action === "init") {
      only([], 1, args);
      await writeFile(path.resolve(args[0]), JSON.stringify(api.defaultMainWorkflowConfig(), null, 2) + "\n", { flag: "wx" });
      line({ type: "workflow.created", engine: "main", file: path.resolve(args[0]) });
      return exitCode;
    }
    if (action !== "validate") throw new Error("Main engine only supports workflow validate or init");
    only(["preset-id"], 1, args);
    const workflow = await api.loadMainWorkflowConfig(args[0], { presetId: options.get("preset-id") });
    line({ type: "workflow.valid", engine: "main", sourceCommit: api.MAIN_RUNTIME_SOURCE_COMMIT, runtimeRevision: api.MAIN_RUNTIME_REVISION,
      file: path.resolve(args[0]), schemaVersion: workflow.orchestration.schemaVersion, git: workflow.git,
      agents: workflow.orchestration.agents.map((agent) => agent.name) });
  } else if (command === "harnesses") {
    only([], 0, positionals.slice(1));
    await withSdk(async (sdk) => line({ type: "harness.list", engine: "main", harnesses: await sdk.harnesses() }));
  } else if (command === "gateway") {
    if (action === "list") {
      only([], 0, args);
      await withSdk(async (sdk) => line({ type: "gateway.list", engine: "main", gateways: await sdk.gateways.list() }));
    } else if (action === "add") {
      only(["name", "url", "protocol", "models", "default-model", "key-env", "context-windows-file", "reasoning-file"], 0, args);
      const name = required("name"), url = required("url"), protocol = required("protocol");
      const keyEnv = required("key-env");
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(keyEnv)) throw new Error("--key-env must name an environment variable");
      const apiKey = process.env[keyEnv];
      if (!apiKey) throw new Error(`Environment variable ${keyEnv} is empty or unset`);
      const models = [...new Set(required("models").split(",").map((item) => item.trim()).filter(Boolean))];
      const defaultModel = required("default-model");
      if (!models.length || !models.includes(defaultModel)) throw new Error("--default-model must occur in nonempty --models");
      const fromFile = async (option) => options.has(option) ? JSON.parse(await readFile(path.resolve(required(option)), "utf8")) : undefined;
      try {
        const input = { name, url, protocol, apiKey, models, defaultModel,
          modelContextWindows: await fromFile("context-windows-file"), modelReasoning: await fromFile("reasoning-file") };
        await withSdk(async (sdk) => line({ type: "gateway.added", engine: "main", gateway: await sdk.gateways.add(input) }));
      } catch (error) {
        // Errors before SDK construction must not disclose an opaque key either.
        throw new Error(String(error.message ?? error).split(apiKey).join("[REDACTED]").split(encodeURIComponent(apiKey)).join("[REDACTED]"));
      }
    } else if (action === "import") {
      only(["harness", "model", "source", "profile-path", "name"], 0, args);
      const selected = harness(required("harness")), model = required("model"), source = required("source");
      if (!["env", "profile"].includes(source)) throw new Error("--source must be env or profile");
      if (options.has("profile-path") && (source !== "profile" || !path.isAbsolute(required("profile-path")))) {
        throw new Error("--profile-path requires --source profile and an absolute path");
      }
      await withSdk(async (sdk) => line({ type: "gateway.imported", engine: "main", harness: selected, model, source,
        gateway: await sdk.gateways.importHarness({ harness: selected, model, source,
          ...(options.has("profile-path") ? { profilePath: required("profile-path") } : {}),
          ...(options.has("name") ? { name: required("name") } : {}) }) }));
    } else if (action === "test") {
      only(["model", "harness", "reasoning-option"], 1, args);
      const model = required("model");
      const selected = required("harness");
      const targets = selected === "all" ? harnesses : [harness(selected)];
      await withSdk(async (sdk, lifecycle) => {
        const controller = new AbortController();
        const abort = () => controller.abort(new Error("Probe cancelled"));
        const unregister = lifecycle.register(abort);
        try {
          const passed = await Promise.all(targets.map(async (target) => {
            try {
              const result = await sdk.gateways.test(args[0], target, model, {
                signal: controller.signal, reasoningOptionId: options.get("reasoning-option"),
                onStage: (stage) => line({ type: "gateway.stage", engine: "main", harness: target, model, stage })
              });
              line({ type: "gateway.test", engine: "main", harness: target, model, result });
              return result.status === "passed";
            } catch (error) {
              line({ type: "gateway.test.error", engine: "main", harness: target, model, message: error.message });
              return false;
            }
          }));
          if (controller.signal.aborted) exitCode = 130;
          else if (passed.some((value) => !value)) exitCode = 2;
        } finally { unregister(); }
      });
    } else throw new Error(`Unknown main gateway command: ${action ?? ""}`);
  } else if (command === "run") {
    if (action === "start") {
      only(["title", "preset-id", "model", "harness", "gateway", "gateway-bindings", "native-codex-profile", "workspace", "source-workspace", "source-files", "inputs", "inputs-file", "input-description"], 2, args);
      if (options.has("inputs") && options.has("inputs-file")) throw new Error("--inputs and --inputs-file are mutually exclusive");
      let inputs;
      if (options.has("inputs")) {
        const source = required("inputs");
        if (source.includes("\0")) throw new Error("--inputs path must contain no NUL");
        inputs = [path.resolve(source)];
      }
      if (options.has("inputs-file")) {
        const file = path.resolve(required("inputs-file"));
        const values = JSON.parse(await readFile(file, "utf8"));
        if (!Array.isArray(values)) throw new Error("--inputs-file must contain a JSON array");
        inputs = values.map((value) => {
          if (typeof value === "string" && value.trim() && !value.includes("\0")) return path.resolve(path.dirname(file), value);
          if (!value || typeof value !== "object" || Array.isArray(value) ||
            Object.keys(value).some((key) => !["path", "name"].includes(key)) ||
            typeof value.path !== "string" || !value.path.trim() || value.path.includes("\0") ||
            (value.name !== undefined && (typeof value.name !== "string" || !value.name.trim()))) {
            throw new Error("--inputs-file entries must be nonempty paths or {path: string, name?: string}");
          }
          if (value.name !== undefined && (value.name.length > 1024 || /[\\\\\u0000-\u001f\u007f<>:\"|?*]/.test(value.name) ||
            value.name.split("/").some((part) => !part || part.length > 255 || part === "." || part === ".." || /[. ]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part)))) {
            throw new Error("--inputs-file name must be a portable relative path");
          }
          return { ...value, path: path.resolve(path.dirname(file), value.path) };
        });
      }
      if (options.has("input-description") && typeof options.get("input-description") !== "string") throw new Error("--input-description must be text");
      const inputDescription = options.has("input-description") ? options.get("input-description").trim() : undefined;
      if (inputDescription !== undefined && inputDescription.length > 2000) throw new Error("--input-description must be at most 2000 characters");
      if (options.has("workspace") && options.has("source-workspace")) throw new Error("--workspace and --source-workspace are mutually exclusive");
      const workspace = options.has("workspace") ? path.resolve(required("workspace")) : undefined;
      if (options.has("source-files") && !options.has("source-workspace")) throw new Error("--source-files requires --source-workspace");
      if (options.has("source-workspace") && !path.isAbsolute(required("source-workspace"))) throw new Error("--source-workspace must be absolute");
      if (options.has("model") !== options.has("harness")) throw new Error("--model and --harness must be supplied together");
      if (["gateway", "gateway-bindings", "native-codex-profile"].filter((key) => options.has(key)).length !== 1) throw new Error("Supply exactly one of --gateway, --gateway-bindings or --native-codex-profile");
      let workflow = await api.loadMainWorkflowConfig(args[0], { presetId: options.get("preset-id") });
      if (options.has("model")) workflow = api.bindMainWorkflowConfig(workflow, { model: required("model"), harness: harness(required("harness")) });
      const gatewayBindings = api.validateMainGatewayBindings(options.has("gateway") ? { defaultGatewayId: required("gateway") }
        : options.has("native-codex-profile") ? { defaultNativeCodexProfileId: required("native-codex-profile") }
        : JSON.parse(await readFile(path.resolve(required("gateway-bindings")), "utf8")));
      const requirement = await readFile(path.resolve(args[1]), "utf8");
      if (!requirement.trim()) throw new Error("Requirement file is empty");
      const sourceWorkspace = options.has("source-workspace") ? { path: required("source-workspace"),
        ...(options.has("source-files") ? { files: JSON.parse(await readFile(path.resolve(required("source-files")), "utf8")) } : {}) } : undefined;
      if (sourceWorkspace && (!workflow.git.enabled || (sourceWorkspace.files !== undefined &&
        (!Array.isArray(sourceWorkspace.files) || sourceWorkspace.files.some((name) => typeof name !== "string"))))) throw new Error("Source import requires a Git-enabled workflow and an optional JSON array of relative file names");
      await withSdk(async (sdk, lifecycle) => {
        const run = await sdk.start({ title: options.get("title") ?? path.basename(args[1], path.extname(args[1])), requirement, workflow, gatewayBindings, sourceWorkspace, ...(workspace ? { workspace } : {}), ...(inputs !== undefined ? { inputs } : {}), ...(inputDescription !== undefined ? { inputDescription } : {}) });
        line({ type: "run.started", engine: "main", sourceCommit: sdk.sourceCommit, runtimeRevision: sdk.runtimeRevision, runId: run.id });
        return foreground(run, 0, lifecycle);
      });
    } else if (action === "list") {
      only([], 0, args);
      await withSdk(async (sdk) => line({ type: "run.list", engine: "main", runs: await sdk.listRuns() }));
    } else if (action === "show" || action === "events") {
      only(action === "events" ? ["after-seq"] : [], 1, args);
      const afterSeq = options.has("after-seq") ? Number(required("after-seq")) : 0;
      if (!Number.isSafeInteger(afterSeq) || afterSeq < 0) throw new Error("--after-seq must be a non-negative integer");
      await withSdk(async (sdk) => {
        const run = await sdk.getRun(args[0]);
        if (action === "show") line({ type: "run.snapshot", engine: "main", runId: run.id, result: await run.snapshot() });
        else for await (const event of run.events({ afterSeq, follow: false })) line({ type: "event", engine: "main", runId: run.id, event });
      });
    } else if (action === "sync-workspace") {
      only([], 1, args);
      await withSdk(async (sdk) => {
        const result = await (await sdk.getRun(args[0])).syncWorkspace();
        line({ type: "run.workspace.delivery", engine: "main", runId: args[0], result });
        if (result && result.status !== "synced") exitCode = 2;
      });
    } else if (action === "export") {
      only(["output"], 1, args);
      const destination = required("output");
      if (!path.isAbsolute(destination)) throw new Error("--output must be an absolute new directory");
      await withSdk(async (sdk, lifecycle) => {
        const controller = new AbortController();
        const unregister = lifecycle.register(() => controller.abort(new Error("Workspace export cancelled")));
        try {
          const result = await (await sdk.getRun(args[0])).exportWorkspace({ destination, signal: controller.signal });
          line({ type: "run.workspace.exported", engine: "main", runId: args[0], result });
        } catch (error) {
          if (!controller.signal.aborted) throw error;
          exitCode = 130;
          line({ type: "run.workspace.export.cancelled", engine: "main", runId: args[0], message: error.message });
        } finally { unregister(); }
      });
    } else if (["resume", "retry-git", "pause", "cancel"].includes(action)) {
      only([], 1, args);
      await withSdk(async (sdk, lifecycle) => {
        const run = await sdk.getRun(args[0]);
        const before = await run.snapshot();
        if (action === "cancel" || action === "pause") {
          await (action === "cancel" ? run.cancel() : run.pause());
          const result = await run.wait();
          line({ type: "run.result", engine: "main", runId: run.id, result });
          const resumableStop = result.git?.enabled && result.status === "paused" && result.phase === "collaboration:user-cancelled";
          if (!(action === "pause" ? result.status === "paused" : result.status === "cancelled" || resumableStop)) exitCode = 2;
          if (result.status === "paused") return { resumeRunId: run.id };
        } else {
          await (action === "resume" ? run.resume() : run.retryGitInitialization());
          line({ type: action === "resume" ? "run.resumed" : "run.git.retried", engine: "main", runId: run.id });
          return foreground(run, before.eventSeq, lifecycle);
        }
      });
    } else if (action === "input" || action === "respond") {
      only(action === "input" ? ["mode", "request-id"] : [], 2, args);
      const mode = options.get("mode") ?? "wait";
      if (!["wait", "interrupt"].includes(mode)) throw new Error("--mode must be wait or interrupt");
      const message = await readFile(path.resolve(args[1]), "utf8");
      if (!message.trim()) throw new Error("Input file is empty");
      await withSdk(async (sdk, lifecycle) => {
        const run = await sdk.getRun(args[0]);
        const before = await run.snapshot();
        if (action === "respond") await run.respond(message);
        else await run.addInput(message, { mode, requestId: options.get("request-id") });
        line({ type: action === "respond" ? "run.responded" : "run.input.queued", engine: "main", runId: run.id });
        return foreground(run, before.eventSeq, lifecycle);
      });
    } else throw new Error(`Unknown main run command: ${action ?? ""}`);
  } else throw new Error(`Unknown main command: ${command ?? ""}`);
  return exitCode;
}
