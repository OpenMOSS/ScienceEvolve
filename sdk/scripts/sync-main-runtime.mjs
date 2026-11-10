import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { access, mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applySharedFixes, sharedFixIds, sharedFixes, sharedFixesDigest, runtimeRevision,
  supplementalSources, supplementalSource, assertSupplementalIdentity, hostSources } from "./main-runtime-fixes.mjs";
import { brandBytes, unbrandBytes, brandingDigest, brandingVersion } from "./scienceevolve-branding.mjs";
import { deriveRuntimePins, unpinBytes, assertRuntimePinEdits, runtimePinsDigest } from "./scienceevolve-runtime-pins.mjs";

const sdkRoot = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const manifestFile = path.join(sdkRoot, "resources/main-runtime/manifest.json");
const sourceCommit = sharedFixes.sourceCommit;
const sourceSnapshotKind = sharedFixes.sourceSnapshotKind ?? "git";
const coreIdentity = "exact-source-v1";
if (!/^[a-f0-9]{40}$/.test(sourceCommit) || sharedFixes.fixes.length || hostSources.length || supplementalSources.length)
  throw new Error("Shared core must use one exact main source without SDK patches or host files");
if (["--refresh-host-extensions", "--refresh-branding", "--refresh-runtime-pins"].some(flag => process.argv.includes(flag)))
  throw new Error("Shared core transformations are retired; adapt the host or update the common implementation");
const roots = [
  "orchestrator.ts", "collaboration-runtime.ts", "collaboration-resident-launcher.ts",
  "harness-runtime/runtime.ts", "harness-runtime/resident-runtime-adapter.ts",
  "collaboration-git/index.ts", "collaboration-state/index.ts", "scoped-workflow-contract.ts",
  "agent-runtime.ts", "validation.ts", "github-accounts.ts", "git-graph.ts",
  // Fork-loaded module paths are not static imports. Include the real main
  // supervisor explicitly rather than accidentally falling back to legacy.
  "project-mcp-host.ts",
  "control-mcp.ts", "harness-runtime/descriptor-broker-mcp.ts", "resident-control-proxy.ts",
  "harness-runtime/adapters/pi-mcp-extension.ts", "sleep-mcp.ts"
];
const forbidden = new Set(["app.ts", "index.ts"]);
const helperResources = [
  "harness-runtime/descriptor-broker-helper.py", "harness-runtime/descriptor-broker-windows.py",
  "harness-runtime/dsh-sdk-resume-plugin.mjs", "harness-runtime/windows-apply-patch.cs",
  "harness-runtime/windows-resident-helper.py"
];
const regressionTests = [
  "agent-context-index.test.ts", "agent-git-delivery.test.ts",
  "agent-orchestration-reconfiguration.test.ts", "collaboration-git-command-runner.test.ts",
  "harness-recovery.test.ts", "invocation-inputs.test.ts", "invocation-policy.test.ts",
  "session-coordinator.test.ts", "orchestrator-main.test.ts", "builtin-adapters.test.ts",
  "skill-library.test.ts", "skill-staging.test.ts", "dsh-adapter-config.test.ts",
  "harness-prompt-catalog.test.ts", "dsh-protocol-recovery.test.ts",
  "pi-mcp-extension.test.ts", "pi-protocol-backpressure.test.ts",
  "project-runtime-waiting.test.ts", "workflow-adjustment-notifications.test.ts",
  "workflow-context.test.ts", "workflow-recovery.test.ts", "scoped-collaboration-schema.test.ts",
  "scoped-workflow-contract.test.ts", "orchestrator-collaboration-api.test.ts",
  "collaboration-git-local.test.ts", "collaboration-state.test.ts", "agent-git-tools.test.ts",
  "workflow-session-compatibility.test.ts", "workflow-adjustment-restart.test.ts",
  "serial-workflow-native-input.test.ts", "control-result-receipts.test.ts", "control-stage-drain.test.ts",
  "codex-native-input-history.test.ts", "main-workflow-draft-storage.test.ts", "sii-experiments.test.ts",
  "agent-tool-catalog.test.ts", "agent-git-operation-query.test.ts", "push-supersession.test.ts",
  "scoped-unopened-preparation.test.ts", "scoped-worktree-closing-delivery.test.ts",
  "scoped-worktree-closing-settlement.test.ts", "scoped-worktree-closing-authorization.test.ts",
  "helpers/scoped-worktree-closing-fixture.ts", "helpers/scoped-worktree-closing-delivery-fixture.ts",
  "helpers/workflow-adjustment-restart-worker.ts",
  "helpers/merged-tree.ts", "fixtures/collaboration-concurrent-worker.ts",
  "agent-queue-view.test.ts", "collaboration-dispatcher-rejection.test.ts",
  "collaboration-git-provider.test.ts", "collaboration-runtime-integration.test.ts",
  "harness-runtime.test.ts", "official-event-bridge.test.ts", "harness-runtime-contract.ts",
  "orchestration-control-mcp.test.ts", "orchestration-control-pending.test.ts",
  "project-state-documents.test.ts", "project-state-reconciliation.test.ts", "project-state.test.ts",
  "resident-adapter-factory.test.ts", "resident-initialization-quiet.test.ts",
  "resident-lease.test.ts", "resident-native-driver.test.ts",
  "scoped-project-runtime.test.ts", "scoped-worktree-closing-control.test.ts",
  "scoped-worktree-closing-runtime.test.ts",
  "terminal-push-coordination-state.test.ts", "terminal-push-observation-runtime.test.ts",
  "terminal-push-observation-completion.test.ts", "validation.test.ts",
  "helpers/agent-git-native-fixture.ts", "helpers/scoped-runtime-git.ts",
  "helpers/workflow-projection-writer.ts", "helpers/pause-writer-crash.ts",
  "fixtures/harness-events/codex.jsonl", "fixtures/harness-events/pi.jsonl",
  "fixtures/harness-events/dsh.jsonl"
];
const selectedRegressionTests = sharedFixes.regressionTests ?? regressionTests;
const selectedSchemas = sharedFixes.schemas ?? ["main-decision.json", "worker-result.json"];
const additionalSources = sharedFixes.additionalSources ?? [];
if (!Array.isArray(selectedRegressionTests) || !Array.isArray(selectedSchemas) || !Array.isArray(additionalSources) ||
  selectedSchemas.some(value => typeof value !== "string" || !/^[\w/-]+\.json$/.test(value) || path.posix.normalize(value) !== value) ||
  selectedRegressionTests.some(value => typeof value !== "string" || value.includes("\\") ||
    path.posix.normalize(value) !== value || value.startsWith("../") || path.posix.isAbsolute(value)) ||
  additionalSources.some(value => typeof value !== "string" || !value.startsWith("server/src/") ||
    value.includes("\\") || path.posix.normalize(value) !== value))
  throw new Error("Invalid shared-core source/test selection");
// Portable upstream test fixtures: exact, reversible test-only adaptations.
const portableRegressionFixes = {
  "scoped-worktree-closing-runtime.test.ts": {
    description: "Skip only file-symlink cases when Windows privilege is unavailable",
    replacements: [{
      before: 'it("carries a completed child\'s untrusted manifest through its completed direct parent without granting writes", async () => {',
      after: 'it("carries a completed child\'s untrusted manifest through its completed direct parent without granting writes", async context => {'
    }, {
      before: 'it.each([true, false])("binds the completed child\'s actual manager request to closing-only control (trusted=%s)", async trusted => {',
      after: 'it.for([true, false])("binds the completed child\'s actual manager request to closing-only control (trusted=%s)", async (trusted, context) => {'
    }, {
      before: '    await fs.writeFile(path.join(f.root, "uncertain-original.txt"), "Retain unknown ownership");\n    await fs.symlink(path.join(f.root, "uncertain-original.txt"), path.join(f.worktree, "uncertain.txt"));',
      after: '    await fs.writeFile(path.join(f.root, "uncertain-original.txt"), "Retain unknown ownership");\n    try { await fs.symlink(path.join(f.root, "uncertain-original.txt"), path.join(f.worktree, "uncertain.txt")); } catch (error) {\n      if (process.platform === "win32" && (error as NodeJS.ErrnoException).code === "EPERM") { context.skip(); return; }\n      throw error;\n    }'
    }, {
      before: '      await fs.writeFile(path.join(f.root, "uncertain-original.txt"), "Preserved unknown file");\n      await fs.symlink(path.join(f.root, "uncertain-original.txt"), path.join(f.worktree, "uncertain.txt"));',
      after: '      await fs.writeFile(path.join(f.root, "uncertain-original.txt"), "Preserved unknown file");\n      try { await fs.symlink(path.join(f.root, "uncertain-original.txt"), path.join(f.worktree, "uncertain.txt")); } catch (error) {\n        if (process.platform === "win32" && (error as NodeJS.ErrnoException).code === "EPERM") { context.skip(); return; }\n        throw error;\n      }'
    }]
  },
  "harness-runtime.test.ts": {
    description: "Windows Inspire wrapper/mode expectations",
    replacements: [{
      before: '  it("stages the shared Inspire wrapper before a fixture compute Adapter starts", async () => {',
      after: '  it.runIf(process.platform !== "win32")("stages the shared Inspire wrapper before a fixture compute Adapter starts", async () => {'
    }]
  },
  "collaboration-runtime-integration.test.ts": {
    description: "Windows readonly mode and project-directory junction in isolated fixtures",
    replacements: [{
      before: '          ))).mode & 0o777).toBe(0o400);',
      after: '          ))).mode & (process.platform === "win32" ? 0o222 : 0o777)).toBe(process.platform === "win32" ? 0 : 0o400);'
    }, {
      before: 'await fs.symlink(root, originalData, "dir");',
      after: 'await fs.symlink(root, originalData, process.platform === "win32" ? "junction" : "dir");'
    }]
  },
  "orchestration-control-mcp.test.ts": {
    description: "SDK MCP entrypoint, Windows test pipe and explicit file-symlink privilege skip",
    replacements: [{
      before: '  "../src/orchestration-control-mcp.ts"',
      after: '  "../../src/core/orchestration-control-mcp.ts"'
    }, {
      before: '    const bridgePath = path.join(root, "control.sock");',
      after: '    const bridgePath = process.platform === "win32" ? ["", "", ".", "pipe", path.basename(root)].join(String.fromCharCode(92)) : path.join(root, "control.sock");'
    }, {
      before: 'it.each(["outside", "symlink", "hardlink"] as const)("rejects a %s proposal before staging on a repair invocation", async mode => {',
      after: 'it.for(["outside", "symlink", "hardlink"] as const)("rejects a %s proposal before staging on a repair invocation", async (mode, testContext) => {'
    }, {
      before: '    if (mode === "symlink") await fs.symlink(source, proposal);',
      after: '    if (mode === "symlink") {\n      try { await fs.symlink(source, proposal); } catch (error) {\n        if (process.platform === "win32" && (error as NodeJS.ErrnoException).code === "EPERM") { testContext.skip(); return; }\n        throw error;\n      }\n    }'
    }]
  },
  "resident-initialization-quiet.test.ts": {
    "description": "Linux raw-process fixtures require /proc identity; Windows production requires a managed Job Object",
    "replacements": [{
      "before": "describe(\"resident initialization quiet proof\",()=>{",
      "after": "describe.runIf(process.platform === \"linux\")(\"resident initialization quiet proof\",()=>{"
    }, {
      "before": "describe(\"resident process exit facts\",()=>{",
      "after": "describe.runIf(process.platform === \"linux\")(\"resident process exit facts\",()=>{"
    }]
  },
  "orchestration-control-pending.test.ts": {
    "description": "Windows named-pipe peer for the isolated control transport fixture",
    "replacements": [{
      "before": "  const socketPath = path.join(settings.root, \"fake.sock\"); const sockets = new Set<net.Socket>();",
      "after": "  const socketPath = process.platform === \"win32\"\n    ? [\"\", \"\", \".\", \"pipe\", path.basename(settings.root)].join(String.fromCharCode(92))\n    : path.join(settings.root, \"fake.sock\"); const sockets = new Set<net.Socket>();"
    }]
  },
  "terminal-push-observation-completion.test.ts": {
    "description": "Windows directory junctions; explicitly skip only unavailable file-symlink privilege",
    "replacements": [
      {
        "before": "  it.each([\"symlink-parent\", \"symlink-file\", \"hardlink-file\", \"changed-content\", \"changed-digest\"] as const)(\"rejects %s materialization and preserves all prior bytes\", async invalid => {",
        "after": "  it.for([\"symlink-parent\", \"symlink-file\", \"hardlink-file\", \"changed-content\", \"changed-digest\"] as const)(\"rejects %s materialization and preserves all prior bytes\", async (invalid, context) => {"
      },
      {
        "before": "    if (invalid === \"symlink-parent\") await fs.symlink(outside, path.join(f.projectPath, \"runtime\", f.turn.invocationId));",
        "after": "    if (invalid === \"symlink-parent\") await fs.symlink(outside, path.join(f.projectPath, \"runtime\", f.turn.invocationId), process.platform === \"win32\" ? \"junction\" : \"dir\");"
      },
      {
        "before": "      if (invalid === \"symlink-file\") await fs.symlink(outsideFile, path.join(dir, \"Memory.md\"));",
        "after": "      if (invalid === \"symlink-file\") {\n        try { await fs.symlink(outsideFile, path.join(dir, \"Memory.md\")); } catch (error) {\n          if (process.platform === \"win32\" && (error as NodeJS.ErrnoException).code === \"EPERM\") { context.skip(); return; }\n          throw error;\n        }\n      }"
      }
    ]
  },
  "collaboration-git-provider.test.ts": {
    "description": "Fixture-local autocrlf=false for byte-exact canonical delivery on Windows",
    "replacements": [{
      "before": "import { promises as fs } from \"node:fs\";",
      "after": "import { promises as fs } from \"node:fs\";\nimport { execFileSync as sdkFixtureGit } from \"node:child_process\";"
    }, {
      "before": "      title: \"Existing group publication\", operationId: \"existing-publication-initialize\", attempt: 1 });\n    const repository = initialized.repository!;\n",
      "after": "      title: \"Existing group publication\", operationId: \"existing-publication-initialize\", attempt: 1 });\n    sdkFixtureGit(\"git\", [\"config\", \"--local\", \"core.autocrlf\", \"false\"], { cwd: local.repositoryPath, stdio: \"pipe\" });\n    const repository = initialized.repository!;\n"
    }]
  },
  "codex-native-input-history.test.ts": {
    "description": "Windows directory junctions; skip only unavailable file symlink privilege",
    "replacements": [
      {
        "before": "  expect(await fs.readFile(f.file)).toEqual(bytes);\n});\n\nit.each([\"session\", \"cwd\", \"agent\", \"harness\", \"ephemeral\", \"unsafe_id\", \"assistant\", \"reasoning\", \"partial\", \"truncated\", \"stale_batch\", \"timestamp\", \"duplicate\", \"symlink_file\", \"symlink_parent\", \"hardlink\"] as const)(\n  \"refuses ambiguous, stale or foreign native history (%s)\", async mode => {\n    const f = await fixture(); const input = structuredClone(f.input);\n    if (mode === \"session\") f.meta.payload.id = \"01a1220c-aaa6-78c1-b64b-de7b3ef8b270\";\n    if (mode === \"cwd\") f.meta.payload.cwd = path.dirname(f.workspacePath);\n",
        "after": "  expect(await fs.readFile(f.file)).toEqual(bytes);\n});\n\nit.for([\"session\", \"cwd\", \"agent\", \"harness\", \"ephemeral\", \"unsafe_id\", \"assistant\", \"reasoning\", \"partial\", \"truncated\", \"stale_batch\", \"timestamp\", \"duplicate\", \"symlink_file\", \"symlink_parent\", \"hardlink\"] as const)(\n  \"refuses ambiguous, stale or foreign native history (%s)\", async (mode, context) => {\n    const f = await fixture(); const input = structuredClone(f.input);\n    if (mode === \"session\") f.meta.payload.id = \"01a1220c-aaa6-78c1-b64b-de7b3ef8b270\";\n    if (mode === \"cwd\") f.meta.payload.cwd = path.dirname(f.workspacePath);\n"
      },
      {
        "before": "    await f.write([f.meta, f.user], mode !== \"partial\");\n    if (mode === \"duplicate\") await fs.copyFile(f.file, path.join(f.directory, `rollout-other-${session.nativeId}.jsonl`));\n    if (mode === \"hardlink\") await fs.link(f.file, path.join(f.projectPath, \"external-link.jsonl\"));\n    if (mode === \"symlink_file\") { const original = path.join(f.projectPath, \"other-history.jsonl\"); await fs.rename(f.file, original); await fs.symlink(original, f.file); }\n    if (mode === \"symlink_parent\") { const original = path.join(f.projectPath, \"other-sessions\"); await fs.rename(path.join(f.home, \"sessions\"), original); await fs.symlink(original, path.join(f.home, \"sessions\")); }\n    expect(await readCodexNativeNotification(input)).toBeUndefined();\n  });\n\n",
        "after": "    await f.write([f.meta, f.user], mode !== \"partial\");\n    if (mode === \"duplicate\") await fs.copyFile(f.file, path.join(f.directory, `rollout-other-${session.nativeId}.jsonl`));\n    if (mode === \"hardlink\") await fs.link(f.file, path.join(f.projectPath, \"external-link.jsonl\"));\n    if (mode === \"symlink_file\") {\n      const original = path.join(f.projectPath, \"other-history.jsonl\"); await fs.rename(f.file, original);\n      try { await fs.symlink(original, f.file); } catch (error) {\n        if (process.platform === \"win32\" && (error as NodeJS.ErrnoException).code === \"EPERM\") {\n          context.skip(); return;\n        }\n        throw error;\n      }\n    }\n    if (mode === \"symlink_parent\") { const original = path.join(f.projectPath, \"other-sessions\"); await fs.rename(path.join(f.home, \"sessions\"), original); await fs.symlink(original, path.join(f.home, \"sessions\"), process.platform === \"win32\" ? \"junction\" : \"dir\"); }\n    expect(await readCodexNativeNotification(input)).toBeUndefined();\n  });\n\n"
      }
    ]
  },
  "main-workflow-draft-storage.test.ts": {
    "description": "Windows directory junctions; skip only unavailable file symlink privilege",
    "replacements": [
      {
        "before": "\n  it(\"rejects an alias of the assigned management cwd without publishing a current reference\", async () => {\n    const f = await fixture(), alias = path.join(f.root, \"management-alias\");\n    await fs.symlink(f.workspace, alias);\n    await expect(f.storage.writeManagementWorkflowCurrentSnapshot(alias, f.changed)).rejects.toThrow(/original canonical workspace/);\n    await expect(fs.stat(f.current)).rejects.toMatchObject({ code: \"ENOENT\" });\n  });\n",
        "after": "\n  it(\"rejects an alias of the assigned management cwd without publishing a current reference\", async () => {\n    const f = await fixture(), alias = path.join(f.root, \"management-alias\");\n    await fs.symlink(f.workspace, alias, process.platform === \"win32\" ? \"junction\" : \"dir\");\n    await expect(f.storage.writeManagementWorkflowCurrentSnapshot(alias, f.changed)).rejects.toThrow(/original canonical workspace/);\n    await expect(fs.stat(f.current)).rejects.toMatchObject({ code: \"ENOENT\" });\n  });\n"
      },
      {
        "before": "    expect(JSON.parse(await fs.readFile(f.current, \"utf8\"))).toEqual(f.changed); expect(await fs.readFile(f.draft)).toEqual(draft);\n  });\n\n  it.each([\"symlink\", \"hardlink\", \"directory\"])(\"rejects a %s draft without writing through or replacing it\", async kind => {\n    const f = await fixture(), outside = path.join(f.root, \"original-outside.txt\"); await fs.writeFile(outside, \"Original outside bytes\");\n    if (kind === \"symlink\") await fs.symlink(outside, f.draft);\n    else if (kind === \"hardlink\") await fs.link(outside, f.draft);\n    else await fs.mkdir(f.draft);\n    await expect(f.refresh()).rejects.toThrow(\"canonical regular file\");\n",
        "after": "    expect(JSON.parse(await fs.readFile(f.current, \"utf8\"))).toEqual(f.changed); expect(await fs.readFile(f.draft)).toEqual(draft);\n  });\n\n  it.for([\"symlink\", \"hardlink\", \"directory\"])(\"rejects a %s draft without writing through or replacing it\", async (kind, context) => {\n    const f = await fixture(), outside = path.join(f.root, \"original-outside.txt\"); await fs.writeFile(outside, \"Original outside bytes\");\n    if (kind === \"symlink\") {\n      try { await fs.symlink(outside, f.draft); }\n      catch (error) { if (process.platform === \"win32\" && (error as NodeJS.ErrnoException).code === \"EPERM\") context.skip(); else throw error; }\n    }\n    else if (kind === \"hardlink\") await fs.link(outside, f.draft);\n    else await fs.mkdir(f.draft);\n    await expect(f.refresh()).rejects.toThrow(\"canonical regular file\");\n"
      },
      {
        "before": "    expect((await fs.lstat(f.draft)).isSymbolicLink()).toBe(kind === \"symlink\");\n  });\n\n  it.each([\"directory\", \"file\"])(\"rejects a redirected current-reference %s and preserves the draft and external content\", async target => {\n    const f = await fixture(); await f.refresh(); const draft = await fs.readFile(f.draft);\n    const outside = path.join(f.root, \"external-current\"); await fs.mkdir(outside); const externalFile = path.join(outside, \"workflow-current.json\"); await fs.writeFile(externalFile, \"Original external reference\");\n    if (target === \"directory\") { await fs.rm(path.dirname(f.current), { recursive: true }); await fs.symlink(outside, path.dirname(f.current)); }\n    else { await fs.unlink(f.current); await fs.symlink(externalFile, f.current); }\n    await expect(f.refresh(f.changed)).rejects.toThrow(/canonical/);\n    expect(await fs.readFile(f.draft)).toEqual(draft); expect(await fs.readFile(externalFile, \"utf8\")).toBe(\"Original external reference\");\n  });\n",
        "after": "    expect((await fs.lstat(f.draft)).isSymbolicLink()).toBe(kind === \"symlink\");\n  });\n\n  it.for([\"directory\", \"file\"])(\"rejects a redirected current-reference %s and preserves the draft and external content\", async (target, context) => {\n    const f = await fixture(); await f.refresh(); const draft = await fs.readFile(f.draft);\n    const outside = path.join(f.root, \"external-current\"); await fs.mkdir(outside); const externalFile = path.join(outside, \"workflow-current.json\"); await fs.writeFile(externalFile, \"Original external reference\");\n    if (target === \"directory\") { await fs.rm(path.dirname(f.current), { recursive: true }); await fs.symlink(outside, path.dirname(f.current), process.platform === \"win32\" ? \"junction\" : \"dir\"); }\n    else {\n      await fs.unlink(f.current);\n      try { await fs.symlink(externalFile, f.current); }\n      catch (error) { if (process.platform === \"win32\" && (error as NodeJS.ErrnoException).code === \"EPERM\") context.skip(); else throw error; }\n    }\n    await expect(f.refresh(f.changed)).rejects.toThrow(/canonical/);\n    expect(await fs.readFile(f.draft)).toEqual(draft); expect(await fs.readFile(externalFile, \"utf8\")).toBe(\"Original external reference\");\n  });\n"
      }
    ]
  },
  "sii-experiments.test.ts": {
    "description": "Explicit Node fixture launcher and Windows symlink privilege handling",
    "replacements": [
      {
        "before": "  it(\"keeps yolo native access separate from actual SII transfer path authority\", async () => {",
        "after": "  it(\"keeps yolo native access separate from actual SII transfer path authority\", async (context) => {"
      },
      {
        "before": "      await fs.symlink(program, path.join(f.request.workspacePath, \"alias.py\"));",
        "after": "      try { await fs.symlink(program, path.join(f.request.workspacePath, \"alias.py\")); } catch (error) {\n        if (process.platform === \"win32\" && [\"EPERM\", \"EACCES\"].includes((error as NodeJS.ErrnoException).code ?? \"\")) { context.skip(); return; }\n        throw error;\n      }"
      },
      {
        "before": "import type { AgentRunRequest } from \"../../src/core/types.js\";\nimport type { SessionRef } from \"../../src/core/harness-runtime/contracts.js\";\n\nconst PROJECT = \"prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\";\nconst services: SiiExperimentService[] = [];\nconst roots: string[] = [];\n",
        "after": "import type { AgentRunRequest } from \"../../src/core/types.js\";\nimport type { SessionRef } from \"../../src/core/harness-runtime/contracts.js\";\n\n// Windows cannot execute shebang .cjs fixtures directly. Keep real child I/O\n// and CLI argument construction, selecting Node only for these test programs.\nvi.mock(\"node:child_process\", async (original) => {\n  const actual = await original<typeof import(\"node:child_process\")>();\n  return { ...actual, execFile: (...args: Parameters<typeof actual.execFile>) => {\n    if (process.platform === \"win32\" && typeof args[0] === \"string\" && /inspire-(?:fixture|progress|transport-failure)\\.cjs$/.test(args[0])) {\n      return actual.execFile(process.execPath, [args[0], ...(args[1] as string[])], args[2] as never, args[3] as never);\n    }\n    return actual.execFile(...args);\n  } };\n});\n\nconst PROJECT = \"prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\";\nconst services: SiiExperimentService[] = [];\nconst roots: string[] = [];\n"
      },
      {
        "before": "      [\"notebook\", \"exec\", \"box\", \"--download\", f.root, \"python program.py\"],\n      [\"notebook\", \"connection\", \"refresh\", \"box\", `--pubkey=${outside}`]\n    ]) await expect(binding.call(\"sii_command\", { args })).rejects.toThrow(\"file scope\");\n    await fs.symlink(outside, path.join(f.request.workspacePath, \"alias.py\"));\n    await expect(binding.call(\"sii_command\", { args: [\"notebook\", \"scp\", \"box\", \"alias.py\", \"remote:program.py\"] })).rejects.toThrow();\n    await fs.link(outside, path.join(f.request.workspacePath, \"linked.py\"));\n    await expect(binding.call(\"sii_command\", { args: [\"notebook\", \"scp\", \"box\", \"linked.py\", \"remote:program.py\"] })).rejects.toThrow(\"hardlink\");\n    await expect(f.service.bind({ ...f.request, workspacePath: f.root }, new AbortController().signal)).rejects.toThrow(\"assigned directory\");\n    expect(f.runJson).toHaveBeenCalledTimes(2);\n  });\n\n  it(\"allows compute transfers only to registered worktrees of the same project\", async () => {\n    const f = await fixture();\n    const projectWorktreeRoot = path.join(f.request.projectPath, \"git-worktrees\");\n",
        "after": "      [\"notebook\", \"exec\", \"box\", \"--download\", f.root, \"python program.py\"],\n      [\"notebook\", \"connection\", \"refresh\", \"box\", `--pubkey=${outside}`]\n    ]) await expect(binding.call(\"sii_command\", { args })).rejects.toThrow(\"file scope\");\n    await fs.link(outside, path.join(f.request.workspacePath, \"linked.py\"));\n    await expect(binding.call(\"sii_command\", { args: [\"notebook\", \"scp\", \"box\", \"linked.py\", \"remote:program.py\"] })).rejects.toThrow(\"hardlink\");\n    await expect(f.service.bind({ ...f.request, workspacePath: f.root }, new AbortController().signal)).rejects.toThrow(\"assigned directory\");\n    expect(f.runJson).toHaveBeenCalledTimes(2);\n  });\n\n  it(\"refuses file symlinks before the CLI runs when the host permits creating them\", async (context) => {\n    const f = await fixture();\n    const outside = path.join(f.root, \"outside.py\");\n    await fs.writeFile(outside, \"outside\");\n    try {\n      await fs.symlink(outside, path.join(f.request.workspacePath, \"alias.py\"));\n    } catch (error) {\n      const code = (error as NodeJS.ErrnoException).code;\n      if (process.platform === \"win32\" && (code === \"EPERM\" || code === \"EACCES\")) {\n        context.skip(`File symlinks unavailable on this host: ${code}`);\n        return;\n      }\n      throw error;\n    }\n    await expect(f.binding.call(\"sii_command\", { args: [\"notebook\", \"scp\", \"box\", \"alias.py\", \"remote:program.py\"] })).rejects.toThrow();\n    expect(f.runJson).not.toHaveBeenCalled();\n  });\n\n  it(\"allows compute transfers only to registered worktrees of the same project\", async () => {\n    const f = await fixture();\n    const projectWorktreeRoot = path.join(f.request.projectPath, \"git-worktrees\");\n"
      }
    ]
  },
  "scoped-worktree-closing-delivery.test.ts": {
    "description": "Bounded Windows real-Git execution budget",
    "replacements": [
      {
        "before": "    expect(f.db.scopedWorktreeClosingCandidates(P)).toHaveLength(1);\n    if (status === \"failed\") expect(() => f.db.completeScopedAgentArrivalAfterMerge({ projectId: P, executionId: f.execution.id,\n      arrivalRequestId: f.execution.arrivalRequestId, ownershipEpoch: 1, ...f.businessDelivery! })).toThrow(\"not eligible\");\n  }, 30_000);\n\n  it(\"requires actual original-Session reception of all three B results\", async () => {\n    const f = await delivered(\"failed\", false), result = f.inspect();\n    expect(result.proof).toBeUndefined(); expect(result.missing).toHaveLength(3);\n    expect(result.missing.every(value => value.includes(\"reception\"))).toBe(true);\n  }, 30_000);\n\n  it.each([\"push\", \"create\", \"merge\"])(\"does not borrow A or another native receipt when the B %s receipt is missing\", async callId => {\n    const f = await delivered();\n    f.edit(\"DELETE FROM project_events WHERE project_id=? AND event_type='control.result.received' AND json_extract(payload_json,'$.receiptId') IN (SELECT json_extract(payload_json,'$.receipt.id') FROM project_events WHERE event_type='control.result.recorded' AND json_extract(payload_json,'$.receipt.callId')=?)\", P, callId);\n    const result = f.inspect(); expect(result.proof).toBeUndefined(); expect(result.missing.some(value => value.includes(\"independent B\"))).toBe(true);\n    expect(f.db.scopedAgentHasUnreleasedActivity(P, \"worker\")).toBe(true);\n  }, 30_000);\n\n  it.each([\"original finish\", \"supplemental finish\", \"actual output\", \"A merge\", \"A sync\", \"B sync\", \"native binding\", \"unsettled journal\"])(\n    \"rejects missing or mismatched %s without inventing delivery\", async variant => {\n",
        "after": "    expect(f.db.scopedWorktreeClosingCandidates(P)).toHaveLength(1);\n    if (status === \"failed\") expect(() => f.db.completeScopedAgentArrivalAfterMerge({ projectId: P, executionId: f.execution.id,\n      arrivalRequestId: f.execution.arrivalRequestId, ownershipEpoch: 1, ...f.businessDelivery! })).toThrow(\"not eligible\");\n  }, process.platform === \"win32\" ? 120_000 : 30_000);\n\n  it(\"requires actual original-Session reception of all three B results\", async () => {\n    const f = await delivered(\"failed\", false), result = f.inspect();\n    expect(result.proof).toBeUndefined(); expect(result.missing).toHaveLength(3);\n    expect(result.missing.every(value => value.includes(\"reception\"))).toBe(true);\n  }, process.platform === \"win32\" ? 120_000 : 30_000);\n\n  it.each([\"push\", \"create\", \"merge\"])(\"does not borrow A or another native receipt when the B %s receipt is missing\", async callId => {\n    const f = await delivered();\n    f.edit(\"DELETE FROM project_events WHERE project_id=? AND event_type='control.result.received' AND json_extract(payload_json,'$.receiptId') IN (SELECT json_extract(payload_json,'$.receipt.id') FROM project_events WHERE event_type='control.result.recorded' AND json_extract(payload_json,'$.receipt.callId')=?)\", P, callId);\n    const result = f.inspect(); expect(result.proof).toBeUndefined(); expect(result.missing.some(value => value.includes(\"independent B\"))).toBe(true);\n    expect(f.db.scopedAgentHasUnreleasedActivity(P, \"worker\")).toBe(true);\n  }, process.platform === \"win32\" ? 120_000 : 30_000);\n\n  it.each([\"original finish\", \"supplemental finish\", \"actual output\", \"A merge\", \"A sync\", \"B sync\", \"native binding\", \"unsettled journal\"])(\n    \"rejects missing or mismatched %s without inventing delivery\", async variant => {\n"
      },
      {
        "before": "      if (variant === \"unsettled journal\") f.edit(\"UPDATE scoped_operations SET status='uncertain' WHERE operation_id='original-business-git.push'\");\n      expect(f.inspect().proof).toBeUndefined(); expect(f.inspect().missing.length).toBeGreaterThan(0);\n      expect(f.db.scopedAgentHasUnreleasedActivity(P, \"worker\")).toBe(true);\n    }, 30_000);\n});\n",
        "after": "      if (variant === \"unsettled journal\") f.edit(\"UPDATE scoped_operations SET status='uncertain' WHERE operation_id='original-business-git.push'\");\n      expect(f.inspect().proof).toBeUndefined(); expect(f.inspect().missing.length).toBeGreaterThan(0);\n      expect(f.db.scopedAgentHasUnreleasedActivity(P, \"worker\")).toBe(true);\n    }, process.platform === \"win32\" ? 120_000 : 30_000);\n});\n"
      }
    ]
  },
  "scoped-worktree-closing-settlement.test.ts": {
    "description": "Bounded Windows real-Git execution budget",
    "replacements": [
      {
        "before": "    expect(f.db.settleScopedWorktreeClosing(input)).toMatchObject({ replay: true, record: result.record, revision: result.revision });\n    expect(f.db.eventsAfter(P)).toEqual(settledEvents); expect(counts(f.databasePath)).toEqual(settledCounts);\n    expect(() => f.db.settleScopedWorktreeClosing({ ...input, target: { ...input.target, remoteHead: f.A } })).toThrow(\"changed on replay\");\n  }, 30_000);\n\n  it.each([\"completed\", \"failed\"] as const)(\"releases the %s owner's original FIFO successor once, using the actual updated group base\", async status => {\n    const f = await deliveredClosingFixture(status, true, { nextArrival: true });\n",
        "after": "    expect(f.db.settleScopedWorktreeClosing(input)).toMatchObject({ replay: true, record: result.record, revision: result.revision });\n    expect(f.db.eventsAfter(P)).toEqual(settledEvents); expect(counts(f.databasePath)).toEqual(settledCounts);\n    expect(() => f.db.settleScopedWorktreeClosing({ ...input, target: { ...input.target, remoteHead: f.A } })).toThrow(\"changed on replay\");\n  }, process.platform === \"win32\" ? 120_000 : 30_000);\n\n  it.each([\"completed\", \"failed\"] as const)(\"releases the %s owner's original FIFO successor once, using the actual updated group base\", async status => {\n    const f = await deliveredClosingFixture(status, true, { nextArrival: true });\n"
      },
      {
        "before": "    expect(f.rawGit([\"rev-parse\", \"refs/heads/executions/original\"])).toBe(input.observation.head);\n    expect(f.db.scopedExecution(P, f.execution.id)?.status).toBe(\"completed\");\n    expect(f.db.scopedAgentReport(P, f.execution.id, 1)?.headSha).toBe(f.A);\n  }, 30_000);\n\n  it(\"retains an already accepted merge route when the failed owner is finally discharged\", async () => {\n    const f = await deliveredClosingFixture(\"failed\", true, { retainedMergedRoute: true }), input = await settlementInput(f), before = f.snapshot();\n",
        "after": "    expect(f.rawGit([\"rev-parse\", \"refs/heads/executions/original\"])).toBe(input.observation.head);\n    expect(f.db.scopedExecution(P, f.execution.id)?.status).toBe(\"completed\");\n    expect(f.db.scopedAgentReport(P, f.execution.id, 1)?.headSha).toBe(f.A);\n  }, process.platform === \"win32\" ? 120_000 : 30_000);\n\n  it(\"retains an already accepted merge route when the failed owner is finally discharged\", async () => {\n    const f = await deliveredClosingFixture(\"failed\", true, { retainedMergedRoute: true }), input = await settlementInput(f), before = f.snapshot();\n"
      },
      {
        "before": "    expect(f.db.scopedExecution(P, f.execution.id)?.status).toBe(\"completed\"); expect(f.snapshot().slice(1)).toEqual(before.slice(1));\n    expect(counts(f.databasePath)).toEqual([1, 1, 1, 1]); expect(f.db.eventsAfter(P).filter(event => event.type === \"scoped.agent.merged_route\")).toEqual(routes);\n    expect(f.db.eventsAfter(P).filter(event => event.type === \"scoped.agent.closing_completion.recorded\")).toHaveLength(1);\n  }, 30_000);\n\n  it(\"requires every exact owner, Stop and target identity before any S write\", async () => {\n    const f = await deliveredClosingFixture(), input = await settlementInput(f), before = f.snapshot(), events = f.db.eventsAfter(P), revision = f.db.projectState(P).revision;\n",
        "after": "    expect(f.db.scopedExecution(P, f.execution.id)?.status).toBe(\"completed\"); expect(f.snapshot().slice(1)).toEqual(before.slice(1));\n    expect(counts(f.databasePath)).toEqual([1, 1, 1, 1]); expect(f.db.eventsAfter(P).filter(event => event.type === \"scoped.agent.merged_route\")).toEqual(routes);\n    expect(f.db.eventsAfter(P).filter(event => event.type === \"scoped.agent.closing_completion.recorded\")).toHaveLength(1);\n  }, process.platform === \"win32\" ? 120_000 : 30_000);\n\n  it(\"requires every exact owner, Stop and target identity before any S write\", async () => {\n    const f = await deliveredClosingFixture(), input = await settlementInput(f), before = f.snapshot(), events = f.db.eventsAfter(P), revision = f.db.projectState(P).revision;\n"
      },
      {
        "before": "    }\n    expect(() => f.db.resolveScopedGroupIssueIfPresent(P, \"run-G\", \"worktree-closing\", \"Mere claimed success\")).toThrow(\"exact A/B/directory\");\n    expect(f.db.scopedWorktreeClosingCandidates(P)).toHaveLength(1);\n  }, 30_000);\n\n  it(\"does not settle a clean B whose results were only saved, or a freshly dirty directory\", async () => {\n    const f = await deliveredClosingFixture(\"failed\", false), input = await settlementInput(f), events = f.db.eventsAfter(P), before = f.snapshot();\n",
        "after": "    }\n    expect(() => f.db.resolveScopedGroupIssueIfPresent(P, \"run-G\", \"worktree-closing\", \"Mere claimed success\")).toThrow(\"exact A/B/directory\");\n    expect(f.db.scopedWorktreeClosingCandidates(P)).toHaveLength(1);\n  }, process.platform === \"win32\" ? 120_000 : 30_000);\n\n  it(\"does not settle a clean B whose results were only saved, or a freshly dirty directory\", async () => {\n    const f = await deliveredClosingFixture(\"failed\", false), input = await settlementInput(f), events = f.db.eventsAfter(P), before = f.snapshot();\n"
      },
      {
        "before": "    expect(f.db.settleScopedWorktreeClosing({ ...input, observation: { ...input.observation, pendingPaths: f.files } })).toBeUndefined();\n    expect(f.db.eventsAfter(P)).toEqual(events); expect(f.snapshot()).toEqual(before);\n    expect(f.db.scopedWorktreeClosingCandidates(P)).toHaveLength(1);\n  }, 30_000);\n\n  it.each([\"pause\", \"cancel\", \"new-binding\", \"new-reservation\", \"management\"])(\"refuses %s without releasing the original issue or changing business history\", async fault => {\n    const f = await deliveredClosingFixture(fault === \"new-reservation\" ? \"completed\" : \"failed\"), input = await settlementInput(f);\n",
        "after": "    expect(f.db.settleScopedWorktreeClosing({ ...input, observation: { ...input.observation, pendingPaths: f.files } })).toBeUndefined();\n    expect(f.db.eventsAfter(P)).toEqual(events); expect(f.snapshot()).toEqual(before);\n    expect(f.db.scopedWorktreeClosingCandidates(P)).toHaveLength(1);\n  }, process.platform === \"win32\" ? 120_000 : 30_000);\n\n  it.each([\"pause\", \"cancel\", \"new-binding\", \"new-reservation\", \"management\"])(\"refuses %s without releasing the original issue or changing business history\", async fault => {\n    const f = await deliveredClosingFixture(fault === \"new-reservation\" ? \"completed\" : \"failed\"), input = await settlementInput(f);\n"
      },
      {
        "before": "    const before = f.snapshot(), events = f.db.eventsAfter(P);\n    expect(() => f.db.settleScopedWorktreeClosing(input)).toThrow(); expect(f.snapshot()).toEqual(before); expect(f.db.eventsAfter(P)).toEqual(events);\n    expect(f.db.scopedWorktreeClosingCandidates(P)).toHaveLength(1);\n  }, 30_000);\n\n  it(\"rolls back the settlement and resolution when original completion fails, then completes through the same route\", async () => {\n    const f = await deliveredClosingFixture(), input = await settlementInput(f), before = f.snapshot(), events = f.db.eventsAfter(P), revision = f.db.projectState(P).revision;\n",
        "after": "    const before = f.snapshot(), events = f.db.eventsAfter(P);\n    expect(() => f.db.settleScopedWorktreeClosing(input)).toThrow(); expect(f.snapshot()).toEqual(before); expect(f.db.eventsAfter(P)).toEqual(events);\n    expect(f.db.scopedWorktreeClosingCandidates(P)).toHaveLength(1);\n  }, process.platform === \"win32\" ? 120_000 : 30_000);\n\n  it(\"rolls back the settlement and resolution when original completion fails, then completes through the same route\", async () => {\n    const f = await deliveredClosingFixture(), input = await settlementInput(f), before = f.snapshot(), events = f.db.eventsAfter(P), revision = f.db.projectState(P).revision;\n"
      },
      {
        "before": "    expect(f.db.scopedWorktreeClosingSettlements(P)).toEqual([]); expect(f.db.scopedWorktreeClosingCandidates(P)).toHaveLength(1);\n    const repaired = new DatabaseSync(f.databasePath); try { repaired.exec(\"DROP TRIGGER reject_settlement_completion\"); } finally { repaired.close(); }\n    expect(f.db.settleScopedWorktreeClosing(input)?.record.reportHeadSha).toBe(f.A); expect(counts(f.databasePath)).toEqual([1, 1, 1, 1]);\n  }, 30_000);\n\n  it(\"settles after a writer restart using original receipts without inventing report recovery or rewriting the old writer\", async () => {\n    const f = await deliveredClosingFixture(), oldRows = f.snapshot(); f.db.close(); f.advance(600_001);\n",
        "after": "    expect(f.db.scopedWorktreeClosingSettlements(P)).toEqual([]); expect(f.db.scopedWorktreeClosingCandidates(P)).toHaveLength(1);\n    const repaired = new DatabaseSync(f.databasePath); try { repaired.exec(\"DROP TRIGGER reject_settlement_completion\"); } finally { repaired.close(); }\n    expect(f.db.settleScopedWorktreeClosing(input)?.record.reportHeadSha).toBe(f.A); expect(counts(f.databasePath)).toEqual([1, 1, 1, 1]);\n  }, process.platform === \"win32\" ? 120_000 : 30_000);\n\n  it(\"settles after a writer restart using original receipts without inventing report recovery or rewriting the old writer\", async () => {\n    const f = await deliveredClosingFixture(), oldRows = f.snapshot(); f.db.close(); f.advance(600_001);\n"
      },
      {
        "before": "      expect(next.eventsAfter(P).filter(event => event.type === \"scoped.agent.reconciled\")).toEqual([]);\n      expect(next.settleScopedWorktreeClosing(input)?.replay).toBe(true); expect(counts(f.databasePath)).toEqual([1, 1, 1, 1]);\n    } finally { next.close(); }\n  }, 30_000);\n\n  it(\"accepts the original Agent's clean restoration to A without inventing a B delivery\", async () => {\n    const f = await openedClosingFixture({ originalStatus: \"completed\", businessDelivery: true });\n",
        "after": "      expect(next.eventsAfter(P).filter(event => event.type === \"scoped.agent.reconciled\")).toEqual([]);\n      expect(next.settleScopedWorktreeClosing(input)?.replay).toBe(true); expect(counts(f.databasePath)).toEqual([1, 1, 1, 1]);\n    } finally { next.close(); }\n  }, process.platform === \"win32\" ? 120_000 : 30_000);\n\n  it(\"accepts the original Agent's clean restoration to A without inventing a B delivery\", async () => {\n    const f = await openedClosingFixture({ originalStatus: \"completed\", businessDelivery: true });\n"
      },
      {
        "before": "    const settled = f.db.settleScopedWorktreeClosing({ projectId: P, executionId: f.execution.id, ownershipEpoch: 1, agentId: \"worker\", invocationId: f.closing.invocationId,\n      observation, target, nativeStop: { invocationId: f.closing.invocationId, runtimePath: f.closing.runtimePath, residentStopConfirmed: true, evidence: { exactNativeClosed: true } } })!;\n    expect(settled.record.delivery.supplement).toBeUndefined(); expect(f.snapshot()).toEqual(before); expect(counts(f.databasePath)).toEqual([1, 1, 1, 1]);\n  }, 30_000);\n});\n",
        "after": "    const settled = f.db.settleScopedWorktreeClosing({ projectId: P, executionId: f.execution.id, ownershipEpoch: 1, agentId: \"worker\", invocationId: f.closing.invocationId,\n      observation, target, nativeStop: { invocationId: f.closing.invocationId, runtimePath: f.closing.runtimePath, residentStopConfirmed: true, evidence: { exactNativeClosed: true } } })!;\n    expect(settled.record.delivery.supplement).toBeUndefined(); expect(f.snapshot()).toEqual(before); expect(counts(f.databasePath)).toEqual([1, 1, 1, 1]);\n  }, process.platform === \"win32\" ? 120_000 : 30_000);\n});\n"
      }
    ]
  },
  "scoped-worktree-closing-authorization.test.ts": {
    "description": "Bounded Windows real-Git checkpoint execution budget",
    "replacements": [
      {
        "before": "    expect(rawGit([\"show\", `${reportHeadSha}:agent-memory/worker/Memory.md`])).toBe(\"Immutable business A\");\n    expect(rawGit([\"diff\", \"--name-only\", reportHeadSha, result.checkpoint.commitSha])).toBe(\"agent-memory/worker/Memory.md\");\n    expect(rawGit([\"status\", \"--porcelain=v1\"])).toBe(\"\");\n  });\n  it.each([\"completed\", \"failed\"] as const)(\"retains a %s owner's A while recording B push/PR/merge and separate local synchronization\", async status => {\n    const f = await closingJournalFixture(status), before = f.snapshot();\n    await f.journal.recordRestrictedClosingCheckpoint!(f.checkpoint);\n",
        "after": "    expect(rawGit([\"show\", `${reportHeadSha}:agent-memory/worker/Memory.md`])).toBe(\"Immutable business A\");\n    expect(rawGit([\"diff\", \"--name-only\", reportHeadSha, result.checkpoint.commitSha])).toBe(\"agent-memory/worker/Memory.md\");\n    expect(rawGit([\"status\", \"--porcelain=v1\"])).toBe(\"\");\n  }, process.platform === \"win32\" ? 120_000 : 30_000);\n  it.each([\"completed\", \"failed\"] as const)(\"retains a %s owner's A while recording B push/PR/merge and separate local synchronization\", async status => {\n    const f = await closingJournalFixture(status), before = f.snapshot();\n    await f.journal.recordRestrictedClosingCheckpoint!(f.checkpoint);\n"
      }
    ]
  },
  "helpers/scoped-worktree-closing-fixture.ts": {
    "description": "Windows temporary worktree cleanup retries",
    "replacements": [
      {
        "before": "const roots: string[] = [], stores: CollaborationStateDatabase[] = [];\nexport async function cleanupClosingFixtures() {\n  stores.splice(0).forEach(db => db.close());\n  await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true })));\n}\n\nexport async function authorizedClosingFixture(options: {\n",
        "after": "const roots: string[] = [], stores: CollaborationStateDatabase[] = [];\nexport async function cleanupClosingFixtures() {\n  stores.splice(0).forEach(db => db.close());\n  await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })));\n}\n\nexport async function authorizedClosingFixture(options: {\n"
      }
    ]
  },
  "helpers/scoped-worktree-closing-delivery-fixture.ts": {
    "description": "Single terminal newline",
    "replacements": [
      {
        "before": "  };\n  return { ...f, observation, inspect, edit };\n}\n\n",
        "after": "  };\n  return { ...f, observation, inspect, edit };\n}\n"
      }
    ]
  }
};
// End portable upstream test fixtures.
// The pinned upstream contains several assertions predating its on-demand
// context and recovery contracts. Keep every original source digest and record
// exact test adaptations; production runtime bytes are unchanged.
const contractRegressionFixes = {
  "collaboration-runtime-integration.test.ts": {
    description: "Await the durable retrying projection after the in-memory transition; retain recovery and single-dispatch checks",
    replacements: [{
      before: '        expect((await storage.loadState(state.id)).status).toBe("retrying");\n        await waitFor(() => gitFactory.mock.calls.length > 0);',
      after: '        await vi.waitFor(async () => expect((await storage.loadState(state.id)).status).toBe("retrying"), { timeout: 5_000 });\n        await waitFor(() => gitFactory.mock.calls.length > 0);'
    }]
  },
  "scoped-worktree-closing-runtime.test.ts": {
    description: "Bound the real Git ancestor closing integration case at 30s on Unix and 60s on Windows; retain every barrier assertion",
    replacements: [{
      before: '    expect(f.db.scopedGroupRun(P, "run-G")!.status).toBe("completed");\n  }, process.platform === "win32" ? 60_000 : 15_000);',
      after: '    expect(f.db.scopedGroupRun(P, "run-G")!.status).toBe("completed");\n  }, process.platform === "win32" ? 60_000 : 30_000);'
    }]
  },

};

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
function target(relative) {
  const absolute = path.resolve(sdkRoot, relative);
  if (!absolute.startsWith(sdkRoot + path.sep)) throw new Error(`Unsafe SDK target: ${relative}`);
  return absolute;
}

function assertNoExpress(bytes, source) {
  if (/\b(?:from\s*|import\s*\(\s*|import\s*)["']express(?:\/[^"']*)?["']/.test(bytes.toString("utf8"))) {
    throw new Error("Express runtime dependency: " + source);
  }
}
async function pinRuntimeEntries(entries) {
  const derived = await deriveRuntimePins(sdkRoot, new Map(entries.map((entry) => [entry.target, entry.bytes])));
  for (const entry of entries) {
    const pinned = derived.outputs.get(entry.target);
    if (!pinned) continue;
    if (entry.target.startsWith("src/core/") && !pinned.bytes.equals(entry.bytes))
      throw new Error("Executable pins must be reviewed in the common source: " + entry.target);
    entry.bytes = pinned.bytes;
    entry.sha256 = digest(pinned.bytes);
    if (pinned.edits.length) entry.derivedPinEdits = pinned.edits;
    else delete entry.derivedPinEdits;
  }
  return derived.proof;
}
function reverseAddedBrandedFixes(source, bytes, ids) {
  let text = bytes.toString("utf8");
  const fixes = sharedFixes.fixes.filter((fix) => fix.source === source && ids.includes(fix.id));
  for (const fix of fixes.toReversed()) for (const replacement of fix.replacements.toReversed()) {
    const before = brandBytes(Buffer.from(replacement.after)).bytes.toString("utf8");
    const after = brandBytes(Buffer.from(replacement.before)).bytes.toString("utf8");
    if (text.split(before).length !== 2) throw new Error(`Shared-fix context drift: ${fix.id}`);
    text = text.replace(before, () => after);
  }
  return Buffer.from(text);
}
async function check(allowPrevious = false, suppliedManifest, suppliedBytes = new Map()) {
  const manifest = suppliedManifest ?? JSON.parse(await readFile(manifestFile, "utf8"));
  const exactCore = manifest.coreIdentity === coreIdentity;
  if (!allowPrevious && !exactCore) throw new Error("Missing exact shared-core identity policy");
  const previous = allowPrevious && manifest.schemaVersion === 1;
  const branded = manifest.brandingVersion !== undefined;
  if (branded ? manifest.brandingVersion !== brandingVersion || manifest.brandingSha256 !== brandingDigest
    : !allowPrevious) throw new Error("Unexpected runtime branding policy");
  if ((!previous && manifest.schemaVersion !== 2) || manifest.sourceCommit !== sourceCommit) throw new Error("Unexpected main-runtime source manifest");
  if ((manifest.sourceSnapshotKind ?? "git") !== sourceSnapshotKind) throw new Error("Unexpected runtime source snapshot kind");
  const expectedRoots = previous ? roots.slice(0, 12) : roots;
  if (JSON.stringify(manifest.roots) !== JSON.stringify(expectedRoots) &&
    !(allowPrevious && [13, 15, 16, 17].includes(manifest.roots.length) && JSON.stringify(manifest.roots) === JSON.stringify(roots.slice(0, manifest.roots.length)))) throw new Error("Unexpected runtime roots");
  if (!previous && ((!allowPrevious && manifest.sharedFixesSha256 !== sharedFixesDigest) || sharedFixes.sourceCommit !== sourceCommit ||
    manifest.runtimeRevision !== runtimeRevision(sourceCommit, manifest.files))) throw new Error("Unexpected shared-fix/runtime revision");
  const seen = new Set();
  const checkedBytes = new Map();
  for (const entry of manifest.files) {
    if (entry.source.startsWith("sdk/src/core/")) {
      const relative = entry.source.slice("sdk/src/core/".length);
      if (!hostSources.includes(relative) || entry.target !== `src/core/${relative}` || seen.has(entry.target) ||
        entry.sourceSha256 !== undefined || entry.upstreamCommit !== undefined) throw new Error("Invalid SDK adapter provenance");
      const bytes = suppliedBytes.get(entry.target) ?? await readFile(target(entry.target));
      checkedBytes.set(entry.target, bytes);
      if (digest(bytes) !== entry.sha256) throw new Error("SDK adapter source drift: " + entry.target);
      assertNoExpress(bytes, entry.source);
      seen.add(entry.target);
      continue;
    }
    assertSupplementalIdentity(entry);
    if (seen.has(entry.target)) throw new Error(`Duplicate manifest target: ${entry.target}`);
    seen.add(entry.target);
    const expected = entry.source.startsWith("server/src/")
      ? `src/core/${entry.source.slice("server/src/".length)}`
      : entry.source.startsWith("server/schemas/")
        ? `resources/main-runtime/schemas/${entry.source.slice("server/schemas/".length)}`
        : selectedRegressionTests.includes(entry.source.slice("server/tests/".length)) && entry.source.startsWith("server/tests/")
          ? `tests/main-core/${entry.source.slice("server/tests/".length)}` : undefined;
    if (!expected || expected !== entry.target) throw new Error(`Unexpected manifest mapping: ${entry.source}`);
    const bytes = suppliedBytes.get(entry.target) ?? await readFile(target(entry.target));
    checkedBytes.set(entry.target, bytes);
    if (digest(bytes) !== entry.sha256) throw new Error(`Main source drift: ${entry.target}`);
    const commonFile = entry.source.startsWith("server/src/") || entry.source.startsWith("server/schemas/");
    if (exactCore && commonFile && ((entry.sharedFixes ?? []).length || (entry.brandingEdits ?? []).length ||
      (entry.derivedPinEdits ?? []).length || entry.sourceSha256 !== entry.sha256))
      throw new Error("Shared core contains a source transformation: " + entry.target);
    const originalPins = exactCore && commonFile ? bytes : unpinBytes(bytes, entry.derivedPinEdits ?? []);
    const originalBranding = branded && !(exactCore && commonFile)
      ? unbrandBytes(originalPins, entry.brandingEdits) : originalPins;
    if (entry.target.startsWith("src/core/")) assertNoExpress(bytes, entry.source);
    if (supplementalSource(entry.source)) {
      const available = new Set(manifest.files.map((file) => file.source));
      for (const match of bytes.toString("utf8").matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["'](\.[^"']+)["']/g)) {
        const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(entry.source), match[1]));
        if (!resolved.startsWith("server/src/") ||
          ![resolved.replace(/\.js$/, ".ts"), resolved].some((candidate) => available.has(candidate))) {
          throw new Error("Unresolved supplemental dependency: " + entry.source + " -> " + match[1]);
        }
      }
    }
    if (!previous && entry.source.startsWith("server/src/")) {
      if (!Array.isArray(entry.sharedFixes) || (!allowPrevious && JSON.stringify(entry.sharedFixes) !== JSON.stringify(sharedFixIds(entry.source)))) throw new Error(`Unexpected shared fixes: ${entry.target}`);
      // When adding declarations, still verify every old byte and reverse only
      // the recorded subset to its exact upstream hash. Never skip drift checks.
      if (digest(applySharedFixes(entry.source, originalBranding, true, entry.sharedFixes)) !== entry.sourceSha256) throw new Error(`Upstream source drift: ${entry.target}`);
    }
    if (branded && entry.source.startsWith("server/schemas/") && digest(originalBranding) !== entry.sourceSha256) {
      throw new Error(`Upstream schema drift: ${entry.target}`);
    }
    if (entry.source.startsWith("server/src/") && forbidden.has(entry.source.slice("server/src/".length))) {
      throw new Error(`Web/process entrypoint in runtime closure: ${entry.source}`);
    }
    if (entry.target.startsWith("src/core/") && /\b(?:from\s*|import\s*\(\s*)["']express["']/.test(bytes.toString("utf8"))) {
      throw new Error(`Express runtime dependency: ${entry.target}`);
    }
  }
  if (!allowPrevious) for (const declared of supplementalSources) {
    if (!manifest.files.some((entry) => entry.source === declared.source)) throw new Error("Missing supplemental source: " + declared.source);
  }
  for (const relative of hostSources) {
    if (!seen.has(`src/core/${relative}`)) throw new Error("Missing SDK adapter source: " + relative);
  }
  for (const file of await readdir(target("src/core"), { recursive: true, withFileTypes: true })) {
    if (file.isDirectory()) continue;
    const relative = path.relative(sdkRoot, path.join(file.parentPath, file.name)).split(path.sep).join("/");
    if (!seen.has(relative)) throw new Error(`Unmanifested runtime file: ${relative}`);
  }
  if (manifest.runtimePins) {
    const derived = await deriveRuntimePins(sdkRoot, checkedBytes);
    if (JSON.stringify(derived.proof) !== JSON.stringify(manifest.runtimePins)) throw new Error("Derived executable pin proof drift");
    for (const entry of manifest.files) assertRuntimePinEdits(entry.target, checkedBytes.get(entry.target), entry.derivedPinEdits ?? [], derived.proof);
  } else if (!allowPrevious) throw new Error("Missing derived executable pin proof");
  console.log(`Main runtime verified: ${manifest.runtimeRevision ?? manifest.sourceCommit}, ${manifest.files.length} files`);
}

if (process.argv.includes("--refresh-runtime-pins-policy")) {
  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  if (!manifest.runtimePins || !/^[a-f0-9]{64}$/.test(manifest.runtimePins.moduleSha256)) throw new Error("Missing runtime pin policy");
  manifest.runtimePins.moduleSha256 = runtimePinsDigest;
  await check(false, manifest);
  await writeFile(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
} else if (process.argv.includes("--refresh-runtime-pins")) {
  await check(true);
  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  if (manifest.runtimePins) throw new Error("Runtime executable pins are already declared");
  const entries = await Promise.all(manifest.files.map(async (entry) => ({ ...entry, bytes: await readFile(target(entry.target)) })));
  manifest.runtimePins = await pinRuntimeEntries(entries);
  manifest.files = entries.map(({ bytes, ...entry }) => entry);
  manifest.runtimeRevision = runtimeRevision(sourceCommit, manifest.files);
  await check(false, manifest, new Map(entries.map((entry) => [entry.target, entry.bytes])));
  for (const entry of entries) {
    if (!(await readFile(target(entry.target))).equals(entry.bytes)) await writeFile(target(entry.target), entry.bytes);
  }
  await writeFile(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
} else if (process.argv.includes("--refresh-branding-policy")) {
  // A policy correction can be pinned only when all current target hashes,
  // recorded edits, deterministic replays and exact upstream hashes still hold.
  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  if (manifest.brandingVersion !== brandingVersion || !/^[a-f0-9]{64}$/.test(manifest.brandingSha256))
    throw new Error("Missing prior runtime branding policy");
  manifest.brandingSha256 = brandingDigest;
  await check(false, manifest);
  await writeFile(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
} else if (process.argv.includes("--refresh-branding")) {
  // A one-time migration is accepted only when a specified Git snapshot proves
  // every old target byte and every current target is its exact brand transform.
  // This cannot bless arbitrary edits or alter upstream identities.
  const baselineArgument = process.argv.indexOf("--baseline");
  if (baselineArgument < 0 || !process.argv[baselineArgument + 1]) throw new Error("Use --refresh-branding --baseline <commit>");
  const git = (args) => execFileSync("git", ["-C", sdkRoot, ...args], { maxBuffer: 32 * 1024 * 1024 });
  const baseline = git(["rev-parse", process.argv[baselineArgument + 1] + "^{commit}"]).toString().trim();
  const manifestBytes = await readFile(manifestFile);
  if (!manifestBytes.equals(git(["show", `${baseline}:sdk/resources/main-runtime/manifest.json`])))
    throw new Error("Pre-branding manifest differs from its baseline snapshot");
  const manifest = JSON.parse(manifestBytes);
  if (manifest.schemaVersion !== 2 || manifest.sourceCommit !== sourceCommit || manifest.brandingVersion !== undefined ||
    manifest.sharedFixesSha256 !== sharedFixesDigest || manifest.runtimeRevision !== runtimeRevision(sourceCommit, manifest.files))
    throw new Error("Invalid pre-branding runtime manifest");
  for (const entry of manifest.files) {
    const original = git(["show", `${baseline}:sdk/${entry.target}`]);
    if (digest(original) !== entry.sha256) throw new Error("Branding baseline drift: " + entry.target);
    const transformed = brandBytes(original);
    const current = await readFile(target(entry.target));
    if (!current.equals(transformed.bytes)) throw new Error("Non-branding source change: " + entry.target);
    if (!entry.source.startsWith("sdk/")) entry.brandingEdits = transformed.edits;
    if (entry.source.startsWith("server/schemas/")) entry.sourceSha256 = digest(original);
    entry.sha256 = digest(current);
  }
  manifest.brandingVersion = brandingVersion;
  manifest.brandingSha256 = brandingDigest;
  manifest.brandingBaselineCommit = baseline;
  manifest.runtimeRevision = runtimeRevision(sourceCommit, manifest.files);
  await check(false, manifest);
  await writeFile(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
} else if (process.argv.includes("--refresh-host-extensions")) {
  // Register a declared SDK-only host extension without weakening the normal
  // pinned-source check or editing the user's main checkout. Every changed
  // byte must reverse to the same original blob and all old fixes remain.
  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  if (manifest.schemaVersion !== 2 || manifest.sourceCommit !== sourceCommit) throw new Error("Unexpected runtime manifest");
  if (manifest.runtimeRevision !== runtimeRevision(sourceCommit, manifest.files)) throw new Error("Unexpected prior runtime revision");
  for (const entry of manifest.files) {
    if (entry.source.startsWith("sdk/src/core/")) {
      const relative = entry.source.slice("sdk/src/core/".length);
      if (!hostSources.includes(relative) || entry.target !== `src/core/${relative}`) throw new Error("Invalid SDK adapter provenance");
      entry.sha256 = digest(await readFile(target(entry.target)));
      continue;
    }
    assertSupplementalIdentity(entry);
    const bytes = await readFile(target(entry.target));
    if (!entry.source.startsWith("server/src/")) {
      if (digest(bytes) !== entry.sha256) throw new Error(`Unrelated resource drift: ${entry.target}`);
      continue;
    }
    const ids = sharedFixIds(entry.source);
    const old = entry.sharedFixes ?? [];
    if (old.some((id) => !ids.includes(id))) throw new Error("Cannot remove existing runtime fixes");
    const added = ids.filter((id) => !old.includes(id));
    if (added.some((id) => !sharedFixes.fixes.find((fix) => fix.id === id)?.hostOnly)) throw new Error("Only explicit host extensions may be refreshed");
    if (!added.length && digest(bytes) !== entry.sha256) throw new Error(`Unrelated source drift: ${entry.target}`);
    const originalPins = unpinBytes(bytes, entry.derivedPinEdits ?? []);
    // Existing recorded transforms are sufficient to verify unchanged entries;
    // appending a declared supplemental source must not need a main checkout.
    const priorBranded = reverseAddedBrandedFixes(entry.source, originalPins, added);
    const upstream = applySharedFixes(entry.source, unbrandBytes(priorBranded, entry.brandingEdits), true, old);
    if (digest(upstream) !== entry.sourceSha256) throw new Error(`Host extension upstream drift: ${entry.source}`);
    const branded = brandBytes(applySharedFixes(entry.source, upstream, false, ids));
    if (!originalPins.equals(branded.bytes) || digest(applySharedFixes(entry.source,
      unbrandBytes(originalPins, branded.edits), true, ids)) !== entry.sourceSha256) throw new Error(`Host extension source drift: ${entry.target}`);
    entry.sharedFixes = ids;
    entry.brandingEdits = branded.edits;
    entry.sha256 = digest(bytes);
  }
  // Verify all existing entries before considering explicitly pinned additions.
  for (const declared of supplementalSources) {
    if (manifest.files.some((entry) => entry.source === declared.source)) continue;
    const relative = "src/core/" + declared.source.slice("server/src/".length);
    const bytes = await readFile(target(relative));
    const ids = sharedFixIds(declared.source);
    if (ids.some((id) => !sharedFixes.fixes.find((fix) => fix.id === id)?.hostOnly)) throw new Error("Only explicit host extensions may be refreshed");
    // Newly imported branded sources declare exact reversible edits alongside
    // their immutable original hash. Sources with no renamed bytes need none.
    const originalBranding = unbrandBytes(bytes, declared.brandingEdits ?? []);
    if (digest(applySharedFixes(declared.source, originalBranding, true, ids)) !== declared.sourceSha256)
      throw new Error("Supplemental source drift: " + declared.source);
    const replay = brandBytes(originalBranding);
    if (!replay.bytes.equals(bytes)) throw new Error("Supplemental branding drift: " + declared.source);
    manifest.files.push({ ...declared, target: relative, sharedFixes: ids, brandingEdits: replay.edits, sha256: digest(bytes) });
  }
  manifest.sharedFixesSha256 = sharedFixesDigest;
  for (const relative of hostSources) {
    const source = `sdk/src/core/${relative}`;
    if (manifest.files.some(entry => entry.source === source)) continue;
    const output = `src/core/${relative}`;
    manifest.files.push({ source, target: output, sha256: digest(await readFile(target(output))) });
  }
  manifest.runtimeRevision = runtimeRevision(sourceCommit, manifest.files);
  // Reject invalid candidates without changing the persisted manifest.
  await check(false, manifest);
  await writeFile(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
} else if (process.argv.includes("--check") || process.argv.includes("--check-source")) {
  await check();
  if (process.argv.includes("--check-source")) {
    const argument = process.argv.indexOf("--source");
    if (argument < 0 || !process.argv[argument + 1] || process.argv[argument + 1].startsWith("--"))
      throw new Error("Use --check-source --source <main checkout>");
    const checkout = path.resolve(process.argv[argument + 1]);
    const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
    let checked = 0;
    for (const entry of manifest.files.filter(entry => entry.source.startsWith("server/"))) {
      const original = await readFile(path.join(checkout, entry.source));
      if (digest(original) !== entry.sourceSha256) throw new Error("Current main source drift: " + entry.source);
      if (entry.source.startsWith("server/src/")) {
        const output = await readFile(target(entry.target));
        if (!output.equals(original)) throw new Error("Actual main core differs: " + entry.source);
      }
      checked++;
    }
    console.log(`Actual main core parity verified: ${checked} sources; shared core is compared without transformations`);
  }
} else {
  const sourceArgument = process.argv.indexOf("--source");
  const fromSnapshot = sourceArgument < 0 && process.argv.includes("--verify-generation");
  if ((!fromSnapshot && (sourceArgument < 0 || !process.argv[sourceArgument + 1] || process.argv[sourceArgument + 1].startsWith("--"))) ||
    (fromSnapshot && process.argv.includes("--upgrade"))) throw new Error("Use --source <main checkout>, --verify-generation or --check; upgrades require a checkout");
  const checkout = fromSnapshot ? undefined : path.resolve(process.argv[sourceArgument + 1]);
  let hasManifest = false;
  try { await access(manifestFile); hasManifest = true; } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const git = (args) => execFileSync("git", ["-c", `safe.directory=${checkout.split(path.sep).join("/")}`, "-C", checkout, ...args], { maxBuffer: 32 * 1024 * 1024 });
  const previousManifest = hasManifest ? JSON.parse(await readFile(manifestFile, "utf8")) : undefined;
  if (fromSnapshot && !previousManifest) throw new Error("Generation verification requires an existing runtime manifest");
  const snapshot = fromSnapshot ? (await import("./runtime-source-snapshot.mjs")).decodeSnapshot(
    await readFile(target("tests/fixtures/main-runtime-upstream.json.gz")), previousManifest) : undefined;
  const useWorkingTree = process.argv.includes("--worktree");
  if (!fromSnapshot && useWorkingTree !== (sourceSnapshotKind === "working-tree"))
    throw new Error("This source baseline requires --worktree for explicit capture of current main files");
  if (useWorkingTree && git(["rev-parse", "HEAD"]).toString().trim() !== sourceCommit)
    throw new Error("Working-tree base commit does not match the pinned main commit");
  const readSource = (commit, source) => snapshot ? snapshot.read(commit, source)
    : useWorkingTree ? readFileSync(path.join(checkout, source)) : git(["show", `${commit}:${source}`]);
  const resolveSource = commit => snapshot ? snapshot.resolve(commit) : git(["rev-parse", `${commit}^{commit}`]).toString().trim();
  const acceptSyncedCore = process.argv.includes("--accept-synced-core");
  const acceptSyncedTests = acceptSyncedCore && process.argv.includes("--accept-synced-tests");
  if (acceptSyncedCore && (!previousManifest || previousManifest.coreIdentity !== coreIdentity))
    throw new Error("Synced-core capture requires an existing exact-source baseline");
  if (acceptSyncedCore) {
    // A bidirectional synchronization already applied a reviewed merge. Check
    // its actual core against the new main source before refreshing metadata.
    for (const entry of previousManifest.files.filter(entry => !entry.source.startsWith("server/src/") && !entry.source.startsWith("server/schemas/"))) {
      if (!acceptSyncedTests && digest(await readFile(target(entry.target))) !== entry.sha256)
        throw new Error("Unrelated regression fixture changed: " + entry.target);
    }
  } else if (previousManifest && previousManifest.sourceCommit !== sourceCommit && process.argv.includes("--upgrade")) {
    // A baseline upgrade may retire patches and remove upstream files. Verify
    // every old published byte before replacing anything; a dirty core must
    // never be silently overwritten. Git is needed only for source extraction.
    if (previousManifest.schemaVersion !== 2 || !/^[a-f0-9]{40}$/.test(previousManifest.sourceCommit) ||
      previousManifest.runtimeRevision !== runtimeRevision(previousManifest.sourceCommit, previousManifest.files))
      throw new Error("Invalid previous runtime manifest");
    const seen = new Set(), seenSources = new Set();
    const oldSnapshot = previousManifest.sourceSnapshotKind === "working-tree"
      ? (await import("./runtime-source-snapshot.mjs")).decodeSnapshot(
        await readFile(target("tests/fixtures/main-runtime-upstream.json.gz")), previousManifest) : undefined;
    for (const entry of previousManifest.files) {
      if (!entry || typeof entry.source !== "string" || typeof entry.target !== "string" ||
        entry.source.includes("\\") || path.posix.normalize(entry.source) !== entry.source ||
        entry.target.includes("\\") || path.posix.normalize(entry.target) !== entry.target ||
        seen.has(entry.target) || seenSources.has(entry.source))
        throw new Error("Invalid previous runtime target");
      const expected = entry.source.startsWith("server/src/")
        ? `src/core/${entry.source.slice("server/src/".length)}`
        : entry.source.startsWith("server/schemas/")
          ? `resources/main-runtime/schemas/${entry.source.slice("server/schemas/".length)}`
          : entry.source.startsWith("server/tests/")
            ? `tests/main-core/${entry.source.slice("server/tests/".length)}`
            : undefined;
      if (!expected || expected !== entry.target || !/^[a-f0-9]{64}$/.test(entry.sha256) ||
        (entry.sourceSha256 !== undefined && !/^[a-f0-9]{64}$/.test(entry.sourceSha256)) ||
        (entry.upstreamCommit !== undefined && !/^[a-f0-9]{40}$/.test(entry.upstreamCommit)) ||
        (entry.source.startsWith("sdk/") && (entry.sourceSha256 !== undefined || entry.upstreamCommit !== undefined)))
        throw new Error("Invalid previous runtime mapping: " + entry.source);
      seen.add(entry.target);
      seenSources.add(entry.source);
      if (digest(await readFile(target(entry.target))) !== entry.sha256) throw new Error("Previous runtime source drift: " + entry.target);
      if (entry.source.startsWith("server/")) {
        const original = oldSnapshot
          ? oldSnapshot.read(entry.upstreamCommit ?? previousManifest.sourceCommit, entry.source)
          : git(["show", `${entry.upstreamCommit ?? previousManifest.sourceCommit}:${entry.source}`]);
        if (digest(original) !== (entry.sourceSha256 ?? entry.sha256)) throw new Error("Previous upstream source drift: " + entry.source);
      }
    }
    for (const file of await readdir(target("src/core"), { recursive: true, withFileTypes: true })) {
      if (file.isDirectory()) continue;
      const relative = path.relative(sdkRoot, path.join(file.parentPath, file.name)).split(path.sep).join("/");
      if (!seen.has(relative)) throw new Error("Unmanifested previous runtime file: " + relative);
    }
  } else if (hasManifest) await check(true);
  const resolved = resolveSource(sourceCommit);
  if (resolved !== sourceCommit) throw new Error("Pinned main commit not found");
  const tree = snapshot?.tree ?? new Set(git(useWorkingTree
    ? ["ls-files", "--cached", "--others", "--exclude-standard", "server/src", "server/schemas"]
    : ["ls-tree", "-r", "--name-only", sourceCommit, "server/src", "server/schemas"]).toString().trim().split("\n"));
  for (const declared of supplementalSources) {
    if (tree.has(declared.source)) throw new Error("Supplemental source already belongs to baseline: " + declared.source);
    const revision = resolveSource(declared.upstreamCommit);
    if (revision !== declared.upstreamCommit || digest(readSource(declared.upstreamCommit, declared.source)) !== declared.sourceSha256) throw new Error("Supplemental Git source drift: " + declared.source);
  }
  const available = (source) => tree.has(source) || Boolean(supplementalSource(source)) || hostSources.includes(source.slice("server/src/".length));
  const queue = [...roots, ...additionalSources.filter(source => /\.(?:ts|mjs)$/.test(source)).map(source => source.slice("server/src/".length)),
    ...supplementalSources.map((entry) => entry.source.slice("server/src/".length))];
  // Regression fixtures may cover leaf runtime modules that are not reached
  // from an application entrypoint. Import their exact upstream dependencies.
  for (const relative of selectedRegressionTests) {
    const text = readSource(sourceCommit, `server/tests/${relative}`).toString("utf8");
    for (const match of text.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["'](\.[^"']+)["']/g)) {
      const resolved = path.posix.normalize(path.posix.join("server/tests", path.posix.dirname(relative), match[1]));
      if (resolved.startsWith("server/src/")) queue.push(resolved.slice("server/src/".length).replace(/\.js$/, ".ts"));
    }
  }
  const sources = new Map();
  while (queue.length) {
    const relative = queue.shift();
    if (sources.has(relative)) continue;
    if (forbidden.has(relative)) throw new Error(`Forbidden runtime dependency: ${relative}`);
    const source = `server/src/${relative}`;
    if (!available(source)) throw new Error(`Missing pinned dependency: ${source}`);
    const bytes = hostSources.includes(relative) ? await readFile(target(`src/core/${relative}`))
      : readSource(supplementalSource(source)?.upstreamCommit ?? sourceCommit, source);
    sources.set(relative, bytes);
    const text = applySharedFixes(source, bytes).toString("utf8");
    assertNoExpress(text, source);
    if (/\b(?:from\s*|import\s*\(\s*)["']express["']/.test(text)) throw new Error(`Express runtime dependency: ${source}`);
    for (const match of text.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["'](\.[^"']+)["']/g)) {
      const importPath = path.posix.normalize(path.posix.join(path.posix.dirname(relative), match[1]));
      if (importPath.startsWith("../")) throw new Error(`Dependency escapes server/src: ${source} -> ${match[1]}`);
      const candidates = [importPath.replace(/\.js$/, ".ts"), importPath];
      const dependency = candidates.find((candidate) => available(`server/src/${candidate}`));
      if (!dependency) throw new Error(`Unresolved relative import: ${source} -> ${match[1]}`);
      queue.push(dependency);
    }
  }
  for (const resource of helperResources) sources.set(resource, readSource(sourceCommit, `server/src/${resource}`));
  for (const source of additionalSources.filter(source => !/\.(?:ts|mjs)$/.test(source)))
    sources.set(source.slice("server/src/".length), readSource(sourceCommit, source));
  const entries = [];
  for (const [relative, original] of [...sources].sort(([a], [b]) => a.localeCompare(b))) {
    if (hostSources.includes(relative)) {
      entries.push({ source: `sdk/src/core/${relative}`, target: `src/core/${relative}`, sha256: digest(original), bytes: original });
      continue;
    }
    const source = `server/src/${relative}`;
    const branded = { bytes: original, edits: [] };
    const bytes = branded.bytes;
    const fixes = sharedFixIds(source);
    // Confirm shared fixes match the main host. SDK-only deployment extensions
    // are independently declared/reversible, not changes to the main checkout.
    const commonFixes = fixes.filter((id) => !sharedFixes.fixes.find((fix) => fix.id === id)?.hostOnly);
    if (commonFixes.length) {
      if (fromSnapshot) throw new Error("Shared main fixes require --source <main checkout> verification: " + source);
      const working = await readFile(path.join(checkout, source), "utf8");
      if (working.replaceAll("\r\n", "\n") !== applySharedFixes(source, original, false, commonFixes).toString("utf8")) throw new Error(`Shared main source does not match declared fixes: ${source}`);
    }
    entries.push({ source, target: `src/core/${relative}`, sourceSha256: digest(original),
      ...(supplementalSource(source) ? { upstreamCommit: supplementalSource(source).upstreamCommit } : {}),
      sharedFixes: fixes, brandingEdits: branded.edits, sha256: digest(bytes), bytes });
  }
  for (const schema of selectedSchemas) {
    const source = `server/schemas/${schema}`;
    const original = readSource(sourceCommit, source);
    const branded = { bytes: original, edits: [] };
    entries.push({ source, target: `resources/main-runtime/schemas/${schema}`, sourceSha256: digest(original),
      brandingEdits: branded.edits, sha256: digest(branded.bytes), bytes: branded.bytes });
  }
  // Keep main's regression bodies, changing only import paths for the SDK layout.
  for (const relative of selectedRegressionTests) {
    const source = `server/tests/${relative}`;
    const original = readSource(sourceCommit, source);
    const outputPath = `tests/main-core/${relative}`;
    let text = original.toString("utf8").replace(/((?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*|\bnew\s+URL\s*\(\s*)["'])(\.[^"']+)(["'])/g,
      (match, prefix, specifier, suffix) => {
        const resolved = path.posix.normalize(path.posix.join("server/tests", path.posix.dirname(relative), specifier));
        if (!resolved.startsWith("server/src/") && !resolved.startsWith(".agents/")) return match;
        const destination = resolved.startsWith(".agents/") ? `../${resolved}` : `src/core/${resolved.slice("server/src/".length)}`;
        let replacement = path.posix.relative(path.posix.dirname(outputPath), destination);
        if (!replacement.startsWith(".")) replacement = `./${replacement}`;
        return prefix + replacement + suffix;
      });
    const testAdaptations = [];
    if (relative === "dsh-protocol-recovery.test.ts") {
      const before = 'const executable = path.resolve("../harness/dsh/node_modules/.bin/dsh");';
      if (text.split(before).length !== 2) throw new Error("Installed DSH fixture path changed");
      text = text.replace(before, 'const executable = process.env.SCIENCEEVOLVE_TEST_DSH_BIN ?? path.resolve("../harness/dsh/node_modules/.bin/dsh");');
      testAdaptations.push("Explicit installed DSH executable for SDK-only source layouts");
    }
    if (relative === "scoped-project-runtime.test.ts") {
      const before = '    expect(turns).toBe(2); expect(heads[0]).not.toBe(heads[1]);';
      if (text.split(before).length !== 2) throw new Error("Pinned pending-file recovery assertion changed");
      text = text.replace(before, '    expect(turns, JSON.stringify({ outcome, events: f.database.eventsAfter(id, 0, 10000).filter(e => /fail|invalid/.test(e.type)) })).toBe(2); expect(heads[0]).not.toBe(heads[1]);');
      testAdaptations.push("Preserve failing recovery event diagnostics");
    }
    if (["scoped-worktree-closing-runtime.test.ts", "scoped-worktree-closing-control.test.ts"].includes(relative)) {
      // These local Git/SQLite end-to-end cases take ~10-30s in isolation on
      // Windows. Keep finite test deadlines; do not change production timeouts.
      text = text.replace(/, (15|20|30)_000\);/g,
        (_, seconds) => `, process.platform === "win32" ? ${Number(seconds) * 4}_000 : ${seconds}_000);`);
      testAdaptations.push("Bounded Windows-only integration test deadlines (four times Unix); runtime unchanged");
    }
    const tsxLoader = 'createRequire(import.meta.url).resolve("tsx")';
    if (text.includes(tsxLoader)) {
      // Node --import expects a file URL for absolute Windows loader paths.
      // This changes only the isolated test's loader, not runtime behavior.
      text = 'import { pathToFileURL as sdkFixtureFileURL } from "node:url";\n' +
        text.replaceAll(tsxLoader, `sdkFixtureFileURL(${tsxLoader}).href`);
      testAdaptations.push("Portable file URL for the test-only tsx loader");
    }
    if (relative === "validation.test.ts") {
      const before = "new URL(`../schemas/${fileName}`, import.meta.url)";
      if (text.split(before).length !== 3) throw new Error("Pinned validation schema paths changed");
      text = text.replaceAll(before, "new URL(`../../resources/main-runtime/schemas/${fileName}`, import.meta.url)");
      testAdaptations.push("SDK packaged schema locations");
    }
    if (relative === "scoped-collaboration-schema.test.ts") {
      // These database-only fixture paths must satisfy the same canonical
      // absolute-path contract on Windows as on the upstream Unix host.
      const fixtures = /(["`])\/srv\/openfars\/git-worktrees\/agents\/[^"`\n]+\1/g;
      if ([...text.matchAll(fixtures)].length !== 16) throw new Error("Pinned scoped schema fixture paths changed");
      text = 'import { resolve as sdkFixturePath } from "node:path";\n' +
        text.replace(fixtures, value => `sdkFixturePath(${value})`);
      testAdaptations.push("Canonical absolute paths for database-only scoped execution fixtures on every host");
    }
    if (relative === "workflow-context.test.ts") {
      const before = 'expect((await fs.stat(context.agentsPath)).mode & 0o777).toBe(0o400);';
      if (text.split(before).length !== 2) throw new Error("Pinned Workflow context mode assertion changed");
      text = text.replace(before, 'expect((await fs.stat(context.agentsPath)).mode & (process.platform === "win32" ? 0o222 : 0o777)).toBe(process.platform === "win32" ? 0 : 0o400);');
      testAdaptations.push("Windows readonly-bit assertion; Unix keeps the full 0400 permission check");
    }
    if (relative === "agent-context-index.test.ts") {
      const before = 'await fs.symlink(outside, path.join(root, "context-records"));';
      if (text.split(before).length !== 2) throw new Error("Pinned context directory alias fixture changed");
      text = text.replace(before, 'await fs.symlink(outside, path.join(root, "context-records"), process.platform === "win32" ? "junction" : "dir");');
      testAdaptations.push("Windows directory junction exercises the redirected context root rejection");
    }
    if (/\bnew\s+URL\s*\(\s*["']\.\.\/src\//.test(original.toString("utf8"))) {
      testAdaptations.push("SDK source URL location");
    }
    for (const portable of [portableRegressionFixes[relative], contractRegressionFixes[relative]]) {
      if (!portable) continue;
      for (const { before, after } of portable.replacements) {
        if (text.split(before).length !== 2) throw new Error("Pinned portable fixture changed: " + relative + " / " + portable.description + " / " + before.slice(0, 120));
        text = text.replace(before, () => after);
      }
      testAdaptations.push(portable.description);
    }
    if (relative === "workflow-adjustment-restart.test.ts") {
      const original = "tests/helpers/workflow-adjustment-restart-worker.ts";
      if (!text.includes(original)) throw new Error("Restart fixture path changed");
      text = text.replace(original, "tests/main-core/helpers/workflow-adjustment-restart-worker.ts");
      testAdaptations.push("SDK helper location");
    }
    if (relative === "collaboration-runtime-integration.test.ts") {
      for (const helper of ["workflow-projection-writer.ts", "pause-writer-crash.ts"]) {
        const before = `tests/helpers/${helper}`;
        if (text.split(before).length !== 2) throw new Error("Pinned collaboration helper path changed: " + helper);
        text = text.replace(before, `tests/main-core/helpers/${helper}`);
      }
      testAdaptations.push("SDK collaboration helper locations");
    }
    if (relative === "collaboration-git-local.test.ts") {
      // Test-only fixture portability. Runtime source stays byte-identical.
      const replacements = [
        ["it.each([\"symlink\", \"hardlink\"] as const)", "it.for([\"symlink\", \"hardlink\"] as const)"],
        ["  return { scratch, projectId, projectRoot, store, service, main };",
          "  await git(service.repositoryPath, [\"config\", \"core.autocrlf\", \"false\"]);\n  return { scratch, projectId, projectRoot, store, service, main };"],
        ["async (kind) => {", "async (kind, context) => {"],
        ["    if (kind === \"symlink\") await fs.symlink(outside, target); else await fs.link(outside, target);",
          "    if (kind === \"symlink\") {\n      try { await fs.symlink(outside, target); } catch (error) {\n        if (process.platform === \"win32\" && (error as NodeJS.ErrnoException).code === \"EPERM\") { context.skip(); return; }\n        throw error;\n      }\n    } else await fs.link(outside, target);"],
        ["await fs.symlink(`${checkout}-original`, checkout);", "await fs.symlink(`${checkout}-original`, checkout, process.platform === \"win32\" ? \"junction\" : \"dir\");"],
        ["await fs.symlink(workflow, path.join(workspace, \"workflow\"), \"dir\");", "await fs.symlink(workflow, path.join(workspace, \"workflow\"), process.platform === \"win32\" ? \"junction\" : \"dir\");"],
        ["await fs.symlink(escaped, path.join(delivery.worktreePath, \".scienceevolve\"));", "await fs.symlink(escaped, path.join(delivery.worktreePath, \".scienceevolve\"), process.platform === \"win32\" ? \"junction\" : \"dir\");"],
        ['["commit-tree", main.head + "^{tree}"',
          '["-c", "user.name=Fixture", "-c", "user.email=fixture@example.test",\n      "commit-tree", main.head + "^{tree}"'],
        ['await fs.writeFile(path.join(owner.worktreePath, "line\\nbreak.txt"), "owned diagnostic");',
          'const diagnosticName = process.platform === "win32" ? "诊断 file.txt" : "line\\nbreak.txt";\n    await fs.writeFile(path.join(owner.worktreePath, diagnosticName), "owned diagnostic");'],
        ['[".scienceevolve/runtime.json", "agent-memory/worker/Memory.md", "line\\nbreak.txt", "new name.txt", "old.txt"]',
          '[".scienceevolve/runtime.json", "agent-memory/worker/Memory.md", diagnosticName, "new name.txt", "old.txt"]'],
        ["}, 10_000);", "}, 60_000);"], ["}, 15_000);", "}, 30_000);"],
        ["fs.rm(root, { recursive: true, force: true })", "fs.rm(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })"]
      ];
      for (const [before, after] of replacements) {
        if (!text.includes(before)) throw new Error(`Pinned regression fixture changed: ${before}`);
        text = text.replace(before, () => after);
      }
      testAdaptations.push("fixture-local-autocrlf=false", "Windows directory junctions", "it.for context: explicit skip on file-symlink EPERM", "fixture-local commit identity", "Windows legal quoted filename", "finite 30/60s slow-Git cases", "temporary cleanup retry");
    }
    const branded = brandBytes(Buffer.from(text));
    const bytes = branded.bytes;
    entries.push({ source, target: outputPath, sha256: digest(bytes), sourceSha256: digest(original), testAdaptations,
      brandingEdits: branded.edits, bytes });
  }
  const runtimePins = await pinRuntimeEntries(entries);
  {
    // Complete the collision audit before writing even the first file, including
    // newly imported targets during an upgrade of an existing source closure.
    const previousTargets = new Set(previousManifest?.files.map(entry => entry.target) ?? []);
    for (const entry of entries) {
      if (previousTargets.has(entry.target)) continue;
      try {
        await access(target(entry.target));
        if (!(acceptSyncedCore && (entry.target.startsWith("src/core/") || entry.source.startsWith("server/schemas/") ||
          (acceptSyncedTests && entry.source.startsWith("server/tests/"))) &&
          (await readFile(target(entry.target))).equals(entry.bytes)))
          throw new Error(`Refusing to overwrite an existing, unmanifested file: ${entry.target}`);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
  }
  if (acceptSyncedCore) {
    for (const entry of entries.filter(entry => entry.source.startsWith("server/schemas/") ||
      (acceptSyncedTests && entry.source.startsWith("server/tests/")))) {
      if (!(await readFile(target(entry.target))).equals(entry.bytes))
        throw new Error("Synced schema/test does not match its declared source: " + entry.target);
    }
    const coreEntries = new Map(entries.filter(entry => entry.target.startsWith("src/core/")).map(entry => [entry.target, entry]));
    for (const entry of coreEntries.values()) {
      if (!(await readFile(target(entry.target))).equals(entry.bytes))
        throw new Error("Synced core does not match actual main: " + entry.target);
    }
    for (const file of await readdir(target("src/core"), { recursive: true, withFileTypes: true })) {
      if (file.isDirectory()) continue;
      const relative = path.relative(sdkRoot, path.join(file.parentPath, file.name)).split(path.sep).join("/");
      if (!coreEntries.has(relative)) throw new Error("Synced core contains an unregistered file: " + relative);
    }
  }
  if (process.argv.includes("--verify-generation")) {
    if (!previousManifest) throw new Error("Generation verification requires an existing runtime manifest");
    const fields = ["source", "target", "sourceSha256", "upstreamCommit", "sharedFixes", "testAdaptations", "brandingEdits", "derivedPinEdits", "sha256"];
    const canonical = (entry) => JSON.stringify(fields.map((field) => [field, entry[field] ?? null]));
    const previousEntries = new Map(previousManifest.files.map((entry) => [entry.target, canonical(entry)]));
    if (previousEntries.size !== entries.length) throw new Error("Regenerated runtime file count drift");
    for (const entry of entries) {
      if (canonical(entry) !== previousEntries.get(entry.target) ||
        !(await readFile(target(entry.target))).equals(entry.bytes)) throw new Error("Regenerated runtime drift: " + entry.target);
    }
    await check();
    console.log(`Pinned upstream regeneration verified without writing: ${entries.length} files`);
    process.exit(0);
  }
  // Mechanical extraction plus declared, reversible fixes verified against
  // shared main source. No unmanifested SDK-only core changes are accepted.
  for (const entry of entries) {
    await mkdir(path.dirname(target(entry.target)), { recursive: true });
    let current;
    try { current = await readFile(target(entry.target)); } catch (error) { if (error.code !== "ENOENT") throw error; }
    if (current?.equals(entry.bytes)) continue;
    if (acceptSyncedCore) throw new Error("Concurrent edit during SDK source capture: " + entry.target);
    const temporary = target(entry.target) + ".runtime-capture.tmp";
    await writeFile(temporary, entry.bytes, { flag: "wx" });
    try { await (await import("node:fs/promises")).rename(temporary, target(entry.target)); }
    finally { await unlink(temporary).catch(error => { if (error.code !== "ENOENT") throw error; }); }
  }
  // Remove only verified files retired from the old source closure. Leave all
  // other SDK sources, user files and generated artifacts alone.
  const nextTargets = new Set(entries.map((entry) => entry.target));
  for (const entry of previousManifest?.files ?? []) {
    if (!nextTargets.has(entry.target)) await unlink(target(entry.target)).catch(error => { if (error.code !== "ENOENT") throw error; });
  }
  await mkdir(path.dirname(manifestFile), { recursive: true });
  await writeFile(manifestFile, JSON.stringify({ schemaVersion: 2, coreIdentity, sourceCommit, sourceSnapshotKind, roots, sharedFixesSha256: sharedFixesDigest,
    brandingVersion, brandingSha256: brandingDigest, runtimePins,
    runtimeRevision: runtimeRevision(sourceCommit, entries),
    files: entries.map(({ bytes, ...entry }) => entry) }, null, 2) + "\n");
  await check();
}
