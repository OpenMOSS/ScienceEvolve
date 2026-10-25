/** Audit active workflow environment contracts after example consolidation. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const args = process.argv.slice(2), option = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const paths = [];
for (const [directory, topLevel] of [['example', false], ['sdk/examples', true]]) {
  for (const entry of await fs.readdir(path.join(root, directory), { withFileTypes: true })) {
    const relative = entry.isDirectory() ? `${directory}/${entry.name}/workflow.json`
      : topLevel && /^(?:default-)?workflow\.json$/.test(entry.name) ? `${directory}/${entry.name}` : null;
    if (!relative) continue;
    try { if ((await fs.stat(path.join(root, relative))).isFile()) paths.push(relative); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}
paths.push('sdk/skills/scienceevolve-sdk/assets/workflow.json');
const injected = ['SCIENCEEVOLVE_MCP_SOURCE_DIR', 'SCIENCEEVOLVE_WORKSPACE', 'SCIENCEEVOLVE_PROJECT_ROOT'];
const runtimeGuidePath = 'example/RUNTIME.md';
const runtimeGuide = await fs.readFile(path.join(root, runtimeGuidePath), 'utf8');
const issues = [], workflows = [], families = new Set();
for (const relative of paths.sort()) {
  const bytes = await fs.readFile(path.join(root, relative)), document = JSON.parse(bytes);
  const row = { path: relative, sha256: sha(bytes), definitions: [] };
  for (const [name, definition] of Object.entries(document.mcpDefinitions ?? {})) {
    const envFrom = definition.envFrom ?? {}, consumers = [];
    families.add(JSON.stringify(Object.entries(envFrom).sort()));
    for (const [file, source] of Object.entries(definition.files ?? {})) {
      for (const match of source.matchAll(/process\.env(?:\.([A-Z][A-Z0-9_]*)|\[['"]([A-Z][A-Z0-9_]*)['"]\])/g)) {
        const key = match[1] ?? match[2];
        if (!key.startsWith('SCIENCEEVOLVE_')) continue;
        consumers.push({ file, key, sourceHostKey: envFrom[key] ?? null, injectedByHost: injected.includes(key) });
        if (!(key in envFrom) && !injected.includes(key)) issues.push({ path: relative, definition: name, file, key, reason: 'Environment consumer has no explicit producer' });
      }
    }
    for (const [target, source] of Object.entries(envFrom)) {
      if (typeof source !== 'string' || !source.trim()) issues.push({ path: relative, definition: name, target, reason: 'Invalid operator variable name' });
      if (relative.startsWith('example/') && !runtimeGuide.includes(source)) issues.push({ path: relative, definition: name, source, reason: 'Operator variable absent from example/RUNTIME.md' });
    }
    row.definitions.push({ name, envFrom, consumers });
  }
  workflows.push(row);
}
const hosts = [];
for (const relative of ['sdk/src/core/project-mcp-host.ts']) {
  const bytes = await fs.readFile(path.join(root, relative)), source = bytes.toString('utf8');
  const missingSourceRejected = source.includes('process.env[source] === undefined');
  if (!missingSourceRejected) issues.push({ path: relative, reason: 'Missing-source environment guard absent' });
  for (const key of injected) if (!source.includes(key)) issues.push({ path: relative, key, reason: 'Host injection absent' });
  hosts.push({ path: relative, sha256: sha(bytes), missingSourceRejected });
}
const report = { schemaVersion: 2, generatedAt: new Date().toISOString(),
  scope: 'Current canonical workflow environment producers, consumers, operator requirements and host guards',
  historicalNamingProof: 'Original naming occurrence and acceptance snapshots remain under docs/renaming.',
  runtimeGuide: { path: runtimeGuidePath, sha256: sha(runtimeGuide) },
  workflows, hosts, workflowFilesEnumerated: paths.length,
  mcpDefinitions: workflows.reduce((n, row) => n + row.definitions.length, 0), distinctEnvFromFamilies: families.size,
  issues, success: issues.length === 0 };
if (option('--output')) await fs.writeFile(path.resolve(option('--output')), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ success: report.success, workflowFiles: paths.length, mcpDefinitions: report.mcpDefinitions, envFamilies: families.size, issues }));
if (!report.success) process.exitCode = 1;
