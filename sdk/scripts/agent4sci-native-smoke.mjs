// Opt-in real-model acceptance. No training, web search or project launch.
// Usage: node sdk/scripts/agent4sci-native-smoke.mjs --codex-cli PATH_TO_codex.js
// Optional: --package-root PATH_TO_INSTALLED_SDK --model MODEL_ID
import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile, open } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const { values } = parseArgs({ options: {
  "codex-cli": { type: "string" }, "package-root": { type: "string" }, model: { type: "string" },
  sandbox: { type: "string", default: "read-only" }
} });
assert.ok(values["codex-cli"], "Pass --codex-cli with the installed Codex JavaScript entrypoint");
assert.ok(["read-only", "workspace-write", "danger-full-access"].includes(values.sandbox), "Invalid sandbox mode");
const packageRoot = path.resolve(values["package-root"] ?? fileURLToPath(new URL("../", import.meta.url)));
const { createMainApplicationRuntime } = await import(pathToFileURL(path.join(packageRoot, "dist/main-runtime.js")));
const { stageInvocationSkills } = await import(pathToFileURL(path.join(packageRoot, "dist/core/harness-runtime/skill-staging.js")));
const root = await mkdtemp(path.join(os.tmpdir(), "agent4sci-native-"));
const workspace = path.join(root, "workspace"); await mkdir(workspace);
const runtime = await createMainApplicationRuntime({ dataDir: path.join(root, "runtime") });
const names = ["research", "experiment", "checklist"].map(name => `agent4sci-${name}`);
let paths;
try {
  const selected = await runtime.skills.resolve(names.map(name => `builtin:${name}`));
  paths = (await stageInvocationSkills(selected, [], workspace, selected, "research")).skillPaths;
} finally { await runtime.close(); }
const directories = ["1A", "1B", "2A", "2B"].map(name => path.join(workspace, "review batch", name));
for (const [index, directory] of directories.entries()) {
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "REVIEW.md"), "Synthetic integration fixture only, not scientific evidence.\n");
  await writeFile(path.join(directory, "REFERENCES.md"), "Synthetic fixture: no external sources used.\n");
  if (index !== 3) await writeFile(path.join(directory, "done.json"), '{"completed_at":"2026-10-25T00:00:00Z"}');
}
const schema = { type: "object", additionalProperties: false,
  required: ["skill_names", "report_files", "wrapper_arguments", "reviews_ready", "incomplete_review", "automatic_reminders"], properties: {
    skill_names: { type: "array", items: { type: "string" } }, report_files: { type: "array", items: { type: "string" } },
    wrapper_arguments: { type: "array", items: { type: "string" } }, reviews_ready: { type: "boolean" },
    incomplete_review: { type: "string" }, automatic_reminders: { type: "boolean" }
  } };
await writeFile(path.join(root, "schema.json"), JSON.stringify(schema));
const prompt = `This is a bounded integration acceptance test, not a research task. Do not start experiments, search the web, delegate, or modify files. Read all three selected SKILL.md files and their linked literature-review assignment and experiment best_practices.md using actual file tools. Then run the bundled check_reviews.py once on these delivered review directories: ${JSON.stringify(directories)}. Do not repair the fixtures. Return the skill names, required review report filenames, required experiment wrapper arguments, whether all reviews are ready, the incomplete review directory basename, and whether this integration installs automatic reminders. Base these answers on the files and actual validator output. Use PowerShell 7 on Windows. Selected skills:\n${paths.join("\n")}`;
await writeFile(path.join(root, "prompt.txt"), prompt);
const args = [path.resolve(values["codex-cli"]), "--disable", "multi_agent", "--disable", "plugins", "--disable", "apps",
  "--disable", "skill_search", "-a", "never", "exec", "--ephemeral", "--skip-git-repo-check", "-s", values.sandbox, "-C", workspace,
  "-c", "skills.bundled.enabled=false", "-c", 'model_reasoning_effort="low"',
  "-c", `skills.config=[${paths.map(p => `{path=${JSON.stringify(p)},enabled=true}`).join(",")}]`,
  ...(values.model ? ["-m", values.model] : []), "--json", "--output-schema", path.join(root, "schema.json"),
  "-o", path.join(root, "answer.json"), "-"];
const stdout = await open(path.join(root, "events.jsonl"), "w");
const stderr = await open(path.join(root, "stderr.log"), "w");
console.log(`Agent4Sci real-model acceptance evidence: ${root}`);
try {
  const child = spawn(process.execPath, args, { cwd: workspace, stdio: ["pipe", stdout.fd, stderr.fd], windowsHide: true });
  const timer = setTimeout(() => {
    // The npm entrypoint owns a native child; terminate that owned process tree.
    if (process.platform === "win32" && child.pid) execFile("taskkill", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true });
    else child.kill();
  }, 240_000);
  child.stdin.end(prompt);
  const code = await new Promise((resolve, reject) => { child.on("error", reject); child.on("close", resolve); }).finally(() => clearTimeout(timer));
  assert.equal(code, 0, `Native acceptance failed; inspect ${path.join(root, "stderr.log")}`);
} finally { await stdout.close(); await stderr.close(); }
const answer = JSON.parse(await readFile(path.join(root, "answer.json"), "utf8"));
assert.deepEqual([...answer.skill_names].sort(), [...names].sort());
assert.ok(answer.report_files.includes("REVIEW.md") && answer.report_files.includes("REFERENCES.md"));
for (const flag of ["--data-dir", "--checkpoint-dir", "--output-dir"]) assert.ok(answer.wrapper_arguments.includes(flag));
assert.equal(answer.reviews_ready, false);
assert.equal(answer.incomplete_review, "2B");
assert.equal(answer.automatic_reminders, false);
// A plausible final answer alone is not proof of loading or helper execution.
const events = (await readFile(path.join(root, "events.jsonl"), "utf8")).trim().split("\n").map(line => JSON.parse(line));
const commands = events.filter(event => event.type === "item.completed" && event.item?.type === "command_execution").map(event => event.item);
for (const resource of [...names.map(name => `${name}/SKILL.md`), "references/literature-review.md", "best_practices.md"]) {
  assert.ok(commands.some(item => item.exit_code === 0 && item.command.replace(/\\+/g, "/").includes(resource)), `Missing native read evidence: ${resource}`);
}
assert.ok(commands.some(item => item.command.includes("check_reviews.py") && item.exit_code === 1 && item.aggregated_output.includes('"ready": false')),
  "Missing actual validator execution with the expected incomplete-fixture result");
await writeFile(path.join(root, "result.json"), JSON.stringify({ passed: true, packageRoot, skillPaths: paths, answer }, null, 2));
console.log(`PASS: real Agent read all three staged skills and support files and executed the review validator. Evidence: ${root}`);
