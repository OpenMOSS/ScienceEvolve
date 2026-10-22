import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { access, mkdir, copyFile, mkdtemp, readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const sdkRoot = fileURLToPath(new URL("../", import.meta.url));
const target = await mkdtemp(path.join(os.tmpdir(), "scienceevolve-sdk-consumer-"));
// Invoke npm through Node (not a shell) on both Windows and Unix.
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run using npm run smoke:package -w sdk");
// Packing and installing the ~40 MiB uncompressed builtin Skill bundle can
// exceed two minutes on Windows when antivirus scans each archive entry.
// Keep a finite timeout, but do not turn host I/O variance into a false SDK
// failure before the consumer process has even started.
function npm(args, cwd) { return execFileSync(process.execPath, [npmCli, ...args], { cwd, encoding: "utf8", timeout: 300_000 }); }
const packed = npm(["pack", "--json", "--pack-destination", target], sdkRoot);
const metadata = JSON.parse(packed.slice(packed.indexOf("[")))[0];
// Audit the actual archive, including resources that are copied during build.
const packageAuditRoot = path.join(target, "package-audit");
await mkdir(packageAuditRoot);
execFileSync("tar", ["-xzf", path.join(target, metadata.filename), "-C", packageAuditRoot]);
console.log(execFileSync(process.execPath, [path.join(sdkRoot, "scripts/check-branding.mjs"),
  "--package-root", path.join(packageAuditRoot, "package"),
  "--json", path.join(target, "branding-package.json")], { encoding: "utf8" }).trim());
if (metadata.files.some(({ path: file }) => /^(?:data|server|web|src)\//.test(file) || /(?:^|\/)\.env(?:\.|$)/.test(file))) throw new Error("Unexpected private/source file in package");
if (metadata.files.some(({ path: file }) => /(?:config-recommendations|configuration-recommendation|project-explainer)/.test(file))) {
  throw new Error("Removed recommendation or Project Explainer code was packaged");
}
if (!metadata.files.some(({ path: file }) => file === "dist/core/orchestration-control-mcp.js")) throw new Error("Missing MCP helper");
for (const moduleName of ["context-limit", "model-context", "gateway-tool-choice", "workflow-reconfiguration", "project-mcp", "project-mcp-host"]) {
  if (!metadata.files.some(({ path: file }) => file === `dist/core/${moduleName}.js`)) {
    throw new Error(`Missing synced runtime module: ${moduleName}`);
  }
}
if (!metadata.files.some(({ path: file }) => file === "assets/skills/general/awesome-ai-research-writing-director/SKILL.md")) throw new Error("Missing builtin skill");
if (!metadata.files.some(({ path: file }) => file === "docs/config-field-audit.md")) throw new Error("Missing config field audit");
if (!metadata.files.some(({ path: file }) => file === "docs/workflow-loops-zh.md")) throw new Error("Missing workflow loop documentation");
if (!metadata.files.some(({ path: file }) => file === "docs/sdk-design-explained-zh.md")) throw new Error("Missing Chinese SDK design guide");
if (!metadata.files.some(({ path: file }) => file === "docs/main-sdk-parity-zh.md")) throw new Error("Missing main/SDK parity documentation");
if (!metadata.files.some(({ path: file }) => file === "cli/scienceevolve.mjs")) throw new Error("Missing packaged CLI entry");
for (const file of ["dist/main-runtime.js", "dist/main-runtime.d.ts", "dist/core/collaboration-runtime.js",
  "dist/main.js", "dist/main.d.ts", "dist/main-client.js", "dist/main-config.js", "dist/main-options.js", "cli/main-cli.mjs", "docs/main-cli-zh.md", "examples/main-runtime/workflow.json",
  "docs/workspace-main-acceptance-20261006-zh.md", "examples/workspace-examples.md", "examples/existing-project/workflow.json", "examples/workflow-reconfiguration/workflow.json", "examples/parallel-git-review/workflow.json",
  "dist/main-workspace.js", "dist/main-workspace.d.ts", "dist/main-git-workspace.js", "dist/main-git-workspace.d.ts", "dist/core/project-mcp-host.js", "resources/main-runtime/shared-fixes.json",
  "docs/main-shared-fixes-test-report-20261005.md",
  "dist/main-source-workspace.js", "dist/main-source-workspace.d.ts", "docs/main-source-workspace-test-report-20261005.md",
  "dist/main-project-inputs.js", "dist/main-project-inputs.d.ts", "docs/project-inputs-zh.md",
  "dist/core/sii-experiments.js", "dist/core/sii-experiments.d.ts", "docs/sii-experiments-zh.md",
  "assets/skills/general/inspire/SKILL.md", "assets/skills/general/inspire/references/notebook.md",
  "dist/main-harness-gateway.js", "dist/main-harness-gateway.d.ts",
  "dist/main-native-profiles.js",
  "dist/core/control-mcp.js", "dist/core/resident-control-proxy.js", "dist/core/sleep-mcp.js",
  "dist/core/sleep-tool-contract.js", "dist/core/control-result-receipts.js", "dist/core/serial-workflow-notifications.js",
  "docs/main-sync-20261013-zh.md",
  "docs/main-sync-20261014-zh.md", "docs/main-sync-20261016-zh.md",
  "dist/core/agent-context-index.js", "dist/core/agent-git-delivery.js",
  "dist/core/collaboration-git/inspection.js", "dist/core/collaboration-git/revert.js",
  "dist/core/workflow-recovery.js", "dist/core/project-runtime-waiting.js",
  "dist/core/project-state.js", "dist/core/project-state-documents.js",
  "dist/core/project-state-mcp.js", "dist/core/project-state-service.js", "dist/core/project-runtime-projection.js",
  "dist/core/agent-queue-view.js",
  "dist/core/harness-runtime/descriptor-broker-mcp.js", "dist/core/harness-runtime/adapters/pi-mcp-extension.js",
  "dist/core/harness-runtime/adapters/hermes-adapter.js", "dist/core/harness-runtime/adapters/hermes-acp.js",
  "dist/core/harness-runtime/adapters/hermes-settings.js", "docs/hermes-zh.md", "examples/hermes/workflow.json",
  "dist/core/collaboration-state/store.js", "dist/schemas/main-decision.json", "dist/schemas/worker-result.json",
  "resources/main-runtime/manifest.json", "docs/main-runtime-migration-zh.md"]) {
  assert.ok(metadata.files.some((entry) => entry.path === file), `Missing main-runtime package file: ${file}`);
}
for (const resource of ["SKILL.md", "references/workflow.md", "references/usage.md", "assets/workflow.json"]) {
  assert.ok(metadata.files.some(({ path: file }) => file === `skills/scienceevolve-sdk/${resource}`), `Missing SDK authoring skill resource: ${resource}`);
}
npm(["install", "--ignore-scripts", "--no-audit", "--no-fund", path.join(target, metadata.filename)], target);
for (const name of ["mcp-client.mjs", "project-mcp-source.mjs", "main-runtime-consumer.mjs", "main-sdk-consumer.mjs", "main-cli-consumer.mjs", "main-examples-consumer.mjs"]) await copyFile(path.join(sdkRoot, "tests/fixtures", name), path.join(target, name));
for (const name of ["01-ahe-evolve", "02-software-development", "dynamic-research-workflow"]) {
  const directory = path.join(target, "main-example-configs", name);
  await mkdir(directory, { recursive: true });
  await copyFile(path.join(sdkRoot, "../example", name, "workflow.json"), path.join(directory, "workflow.json"));
}
const mainOutput = execFileSync(process.execPath, [path.join(target, "main-runtime-consumer.mjs")], { cwd: target, encoding: "utf8", timeout: 60_000 });
console.log(mainOutput.trim());
const mainSdkOutput = execFileSync(process.execPath, [path.join(target, "main-sdk-consumer.mjs")], { cwd: target, encoding: "utf8", timeout: 60_000 });
console.log(mainSdkOutput.trim());
const mainCliOutput = execFileSync(process.execPath, [path.join(target, "main-cli-consumer.mjs")], { cwd: target, encoding: "utf8", timeout: 120_000 });
console.log(mainCliOutput.trim());
const mainExamplesOutput = execFileSync(process.execPath, [path.join(target, "main-examples-consumer.mjs")], { cwd: target, encoding: "utf8", timeout: 60_000 });
console.log(mainExamplesOutput.trim());
const installedPackage = path.join(target, "node_modules", "@scienceevolve", "sdk");
const installed = JSON.parse(await readFile(path.join(installedPackage, "package.json"), "utf8"));
assert.deepEqual(installed.bin, { scievolve: "./cli/scienceevolve.mjs" });
for (const entry of ["./legacy", "./application/runtime", "./application/*"]) assert.equal(installed.exports[entry], undefined);
for (const entry of metadata.files) assert.ok(!/^dist\/(?:internal\/|(?:legacy|client|config|runtime)\.)/.test(entry.path), "Removed engine packaged: " + entry.path);
await access(path.join(target, "node_modules", ".bin", process.platform === "win32" ? "scievolve.cmd" : "scievolve"));
const rejection = execFileSync(process.execPath, ["--input-type=module", "-e", 'for (const name of ["@scienceevolve/sdk/legacy", "@scienceevolve/sdk/application/runtime", "@scienceevolve/sdk/application/orchestrator"]) { try { await import(name); throw new Error("Removed export resolved: " + name); } catch (error) { if (error.code !== "ERR_PACKAGE_PATH_NOT_EXPORTED") throw error; } } console.log("Removed package exports rejected");'], { cwd: target, encoding: "utf8" });
console.log(rejection.trim());
console.log(`Isolated consumer and tarball retained for inspection: ${target}`);
