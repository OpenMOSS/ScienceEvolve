import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const inventory = JSON.parse(fs.readFileSync(path.join(root, 'docs/renaming/baseline-inventory.json'), 'utf8'));
const baseline = JSON.parse(fs.readFileSync(path.join(root, 'sdk/tests/fixtures/example-migration.json'), 'utf8'));
const proofPath = path.join(root, 'sdk/tests/fixtures/example-migration-branding.json');
const savedProof = JSON.parse(fs.readFileSync(proofPath, 'utf8'));
const sourceArgument = process.argv.indexOf('--source');
if (sourceArgument >= 0 && (!process.argv[sourceArgument + 1] || process.argv[sourceArgument + 1].startsWith('--')))
  throw new Error('Use --source <historical checkout>');
if (process.argv.includes('--write') && sourceArgument < 0)
  throw new Error('Regenerating the semantic proof requires --source <historical checkout>');
const { brandBytes, unbrandBytes, brandingDigest, brandingVersion } = await import(pathToFileURL(path.join(root, 'sdk/scripts/scienceevolve-branding.mjs')));
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]` : value && typeof value === 'object'
  ? `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}` : JSON.stringify(value);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function semantic(source) {
  const agents = {};
  for (const [name, agent] of Object.entries(source.agents)) {
    agents[name] = Object.fromEntries(Object.entries(agent).filter(([key]) => !['proxy', 'permission', 'gatewayReasoningOption'].includes(key)));
    if (typeof agents[name].instructions === 'string') agents[name].instructions = agents[name].instructions.replace(
      'All Agents in this Git-off project use the same persistent workspace selected by the SDK host. Use the actual workspace path supplied in this invocation rather than assuming a dataDir subdirectory.',
      'All Agents in this project use the same persistent workspace: <dataDir>/projects/<projectId>/workspaces/.'
    );
  }
  return Buffer.from(canonical({ agents, orchestration: source.orchestration }));
}
const workflows = {};
for (const [file, record] of Object.entries(baseline.workflows)) {
  const workflow = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
  // Pin the ARIS author deployment while checking the fixed method digest.
  if (file === 'example/aris/workflow.json') {
    for (const [name, agent] of Object.entries(workflow.agents)) {
      if (['reviewer', 'paper_reviewer'].includes(name)) continue;
      if (agent.harness !== 'pi') throw new Error(`Invalid ARIS author Harness: ${name}`);
      agent.harness = 'claude-code';
    }
  }
  const actual = semantic(workflow);
  let before;
  if (sourceArgument >= 0) {
    const beforePath = inventory.candidates.find(candidate => candidate.afterPath === file)?.beforePath ?? file;
    const original = JSON.parse(execFileSync('git', ['show', `${inventory.baselineCommit}:${beforePath}`],
      { cwd: path.resolve(process.argv[sourceArgument + 1]), maxBuffer: 20 * 1024 * 1024, windowsHide: true }));
    before = semantic(original);
  } else {
    const saved = savedProof.workflows[file];
    if (!saved || !Array.isArray(saved.edits)) throw new Error(`Missing semantic naming proof: ${file}`);
    before = unbrandBytes(actual, saved.edits);
  }
  if (hash(before) !== record.sha256) throw new Error(`Original semantic hash does not match the immutable fixture: ${file}`);
  const branded = brandBytes(before);
  if (!actual.equals(branded.bytes)) throw new Error(`Current workflow has non-naming semantic differences: ${file}`);
  if (!unbrandBytes(actual, branded.edits).equals(before)) throw new Error(`Semantic overlay is not reversible: ${file}`);
  workflows[file] = { originalSemanticSha256: record.sha256, brandedSemanticSha256: hash(actual), edits: branded.edits };
}
const proof = {
  schemaVersion: 1, sourceCommit: inventory.baselineCommit, semanticBaselineCommit: baseline.sourceCommit,
  method: 'Exact declared naming edits on canonical semantic bytes; inverse replay recovers every unchanged pre-migration semantic digest.',
  brandingDigest, brandingVersion, workflows
};
if (process.argv.includes('--write')) fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2) + '\n');
else if (JSON.stringify(savedProof) !== JSON.stringify(proof)) throw new Error('Semantic naming proof is stale');
console.log(`Exact semantic naming proof: ${Object.keys(workflows).length} workflows, ${Object.values(workflows).reduce((n, item) => n + item.edits.length, 0)} reversible edits; every original hash preserved.`);
