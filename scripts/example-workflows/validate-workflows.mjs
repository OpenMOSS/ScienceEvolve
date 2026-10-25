import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { loadMainWorkflowConfig } from '../../sdk/dist/index.js';
const root = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const args = process.argv.slice(2), outputIndex = args.indexOf('--report');
const results = [];
for (const entry of await fs.readdir(path.join(root, 'example'), { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === 'tests') continue;
  const file = path.join(root, 'example', entry.name, 'workflow.json');
  try {
    const workflow = await loadMainWorkflowConfig(file);
    if (!(await fs.readFile(path.join(path.dirname(file), 'research_proposal.txt'), 'utf8')).trim()) throw new Error('Empty research proposal');
    const cli = spawnSync(process.execPath, [path.join(root, 'sdk/cli/scienceevolve.mjs'), 'workflow', 'validate', file],
      { cwd: root, encoding: 'utf8', timeout: 30_000, windowsHide: true });
    const receipt = cli.status === 0 ? JSON.parse(cli.stdout.trim()) : null;
    if (receipt?.type !== 'workflow.valid' || receipt.engine !== 'main') throw new Error(cli.stderr || 'CLI validation failed');
    results.push({ method: entry.name, passed: true, schemaVersion: workflow.orchestration.schemaVersion, git: workflow.git.enabled, receipt });
  } catch (error) { results.push({ method: entry.name, passed: false, error: String(error) }); }
  console.log(`${results.at(-1).passed ? 'passed' : 'failed'}: ${entry.name}`);
}
const report = { generatedAt: new Date().toISOString(), realRunsStarted: 0, results,
  passed: results.length > 0 && results.every(result => result.passed) };
if (outputIndex >= 0) await fs.writeFile(path.resolve(args[outputIndex + 1]), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, workflows: results.length }));
if (!report.passed) process.exitCode = 1;
