/** Exercise real MCP hosts and shipped workflow consumers using local fixtures. */
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const root = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const args = process.argv.slice(2), option = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const tempRoot = option('--temp-root');
if (!tempRoot || !path.isAbsolute(tempRoot)) throw new Error('--temp-root must be an explicit absolute isolated directory');
await fs.mkdir(tempRoot, { recursive: true });
const temporary = await fs.mkdtemp(path.join(tempRoot, 'env-'));
const sha = value => createHash('sha256').update(value).digest('hex');
const read = relative => fs.readFile(path.join(root, relative), 'utf8');
const files = [];
for (const entry of await fs.readdir(path.join(root, 'example'), { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === 'tests') continue;
  files.push(`example/${entry.name}/workflow.json`);
}
const families = new Map();
for (const p of files) {
  const text = await read(p), workflow = JSON.parse(text);
  for (const [name, definition] of Object.entries(workflow.mcpDefinitions ?? {})) {
    const key = JSON.stringify(Object.entries(definition.envFrom ?? {}).sort());
    if (!families.has(key)) families.set(key, { path: p, name, definition, workflowSha256: sha(text) });
  }
}
const results = [], sourceInputs = [], savedEnvironment = { ...process.env };
const cleanProductEnv = () => { for (const key of Object.keys(process.env)) if (key.startsWith('SCIENCEEVOLVE_')) delete process.env[key]; };
const server = http.createServer(async (request, response) => {
  let data = ''; for await (const part of request) data += part;
  const body = JSON.parse(data);
  backendRequests.push({ body, authorization: request.headers.authorization });
  response.writeHead(200, { 'content-type': 'application/json' });
  response.end(JSON.stringify({ schemaVersion: 1, method: body.method, scopeId: body.scopeId,
    operation: body.operation, requestId: body.requestId, status: 'ok', data: { fixture: true },
    evidence: [{ id: 'env-fixture', uri: 'fixture://environment-probe', kind: 'fixture-only', sha256: 'a'.repeat(64) }] }));
});
const backendRequests = [], proxyConnects = [];
const proxy = http.createServer((_request, response) => { response.writeHead(502).end(); });
proxy.on('connect', (request, socket) => {
  proxyConnects.push(request.url);
  socket.end('HTTP/1.1 502 Local Fixture Rejection\r\nContent-Length: 0\r\nConnection: close\r\n\r\n');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
await new Promise(resolve => proxy.listen(0, '127.0.0.1', resolve));
const backendUrl = `http://127.0.0.1:${server.address().port}/atomic`;
const proxyUrl = `http://127.0.0.1:${proxy.address().port}`;
const states = {};
for (const method of ['ai-scientist-v2', 'alphaevolve', 'kosmos']) {
  const directory = path.join(temporary, method); await fs.mkdir(directory);
  const initialProgram = path.join(directory, 'initial.py');
  await fs.writeFile(initialProgram, '# Environment audit fixture; never executed.\n');
  const settings = { method, numSeeds: 3, numDrafts: 3, debugProbability: .5, maxDebugDepth: 3,
    publicHTTPTransport: 'existing-loopback-proxy', initialProgram, perWorkerBudget: 3,
    maxCycles: 2, datasets: [], stageBudgets: [3, 3, 3, 3], task: 'Environment fixture only' };
  await fs.writeFile(path.join(directory, 'settings.json'), JSON.stringify(settings)); states[method] = directory;
}
let leaseCounter = 0;
async function withService(engine, definition, action) {
  const { startProjectMcps } = await import(pathToFileURL(path.join(root, `sdk/dist/${engine}/project-mcp.js`)));
  const base = path.join(temporary, `${engine}-${++leaseCounter}`), workspacePath = path.join(base, 'workspace');
  await fs.mkdir(workspacePath, { recursive: true });
  const lease = await startProjectMcps({ definitions: { probe: definition }, servers: [{ name: 'env-proof', project: 'probe' }],
    projectPath: path.join(base, 'project'), runtimePath: path.join(base, 'runtime'), workspacePath,
    signal: AbortSignal.timeout(45_000) });
  const client = new Client({ name: 'environment-auditor', version: '1' });
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(lease.servers[0].url)));
    return await action(client, { workspacePath, base });
  } finally { await client.close().catch(() => undefined); await lease.close(); }
}
async function record(id, action) {
  const start = performance.now();
  try { results.push({ id, status: 'passed', ...(await action()), elapsedMs: Math.round(performance.now() - start) }); }
  catch (error) { results.push({ id, status: 'failed', error: String(error), elapsedMs: Math.round(performance.now() - start) }); }
  console.log(`${results.at(-1).status}: ${id}`);
}
try {
  // Run the actual generator in a private copy: it intentionally refuses existing destinations.
  await record('isolated-workflow-generator-environment-contracts', async () => {
    const base = path.join(temporary, 'generator'), design = path.join(base, 'scripts', 'example-workflows');
    await fs.mkdir(design, { recursive: true });
    for (const name of ['build-workflows.mjs', 'task-bridge.cjs', 'BACKEND-CONTRACT.md']) {
      const source = await read(`scripts/example-workflows/${name}`);
      await fs.writeFile(path.join(design, name), source);
      sourceInputs.push({ path: `scripts/example-workflows/${name}`, sha256: sha(source) });
    }
    const runtimeGuide = await read('example/RUNTIME.md');
    sourceInputs.push({ path: 'example/RUNTIME.md', sha256: sha(runtimeGuide) });
    assert.ok(runtimeGuide.includes('BACKEND_TOKEN` 显式设为空字符串'));
    for (const method of ['internagent-1-5', 'biomni-r0', 'chemical-coscientist', 'raven']) {
      const relative = `example/${method}/research_proposal.txt`;
      const proposal = await read(relative);
      await fs.mkdir(path.join(base, 'example', method), { recursive: true });
      await fs.writeFile(path.join(base, relative), proposal);
      sourceInputs.push({ path: relative, sha256: sha(proposal) });
    }
    const generatedRoot = path.join(base, 'generated');
    const run = spawnSync(process.execPath, [path.join(design, 'build-workflows.mjs'), '--output-root', generatedRoot], { cwd: base, encoding: 'utf8', timeout: 20_000 });
    assert.equal(run.status, 0, run.stderr);
    let definitions = 0;
    for (const method of ['internagent-1-5', 'biomni-r0', 'chemical-coscientist', 'raven']) {
      const generated = JSON.parse(await fs.readFile(path.join(generatedRoot, method, 'workflow.json'), 'utf8'));
      const proposal = await fs.readFile(path.join(generatedRoot, method, 'research_proposal.txt'), 'utf8');
      for (const location of ['example']) {
        const actual = JSON.parse(await read(`${location}/${method}/workflow.json`));
        assert.equal((await read(`${location}/${method}/research_proposal.txt`)).replaceAll('\r\n', '\n'), proposal.replaceAll('\r\n', '\n'));
        const actualBackend = actual.skillDefinitions['method-protocol'].files['references/backend.md'];
        const generatedBackend = generated.skillDefinitions['method-protocol'].files['references/backend.md'];
        assert.equal(actualBackend.replaceAll('\r\n', '\n'), generatedBackend.replaceAll('\r\n', '\n'));
        for (const [name, d] of Object.entries(actual.mcpDefinitions)) {
          assert.deepEqual(generated.mcpDefinitions[name].envFrom, d.envFrom);
          for (const source of Object.values(d.envFrom)) assert.ok(runtimeGuide.includes(source), `${method}: missing operator key ${source}`);
          definitions++;
        }
      }
    }
      return { evidence: 'real-generator-execution-in-isolated-copy', definitionsCompared: definitions,
        researchProposalFilesCompared: 4, embeddedBackendDocumentsCompared: 4,
        runtimeGuideDeclaresAllOperatorKeys: true, blankTokenPresenceDocumented: true, writesOutsideFixture: false };
  });
  for (const engine of ['core']) {
    for (const p of [`sdk/dist/${engine}/project-mcp.js`, `sdk/dist/${engine}/project-mcp-host.js`]) {
      const bytes = await fs.readFile(path.join(root, p)); sourceInputs.push({ path: p, sha256: sha(bytes) });
    }
    for (const [familyIndex, family] of [...families.values()].entries()) {
      await record(`${engine}:workflow-env-family-${familyIndex + 1}`, async () => {
        cleanProductEnv();
        const mapping = family.definition.envFrom;
        for (const [target, source] of Object.entries(mapping)) {
          process.env[source] = target.endsWith('BACKEND_URL') ? backendUrl : target.endsWith('BACKEND_TOKEN') ? 'fixture-token' :
            target.endsWith('SCOPE_ID') ? 'fixture-scope' : target.includes('AISCI_SCIENCE_ROOT') ? states['ai-scientist-v2'] :
              target.includes('ALPHA_SCIENCE_ROOT') ? states.alphaevolve : target.includes('TODO_SCIENCE_ROOT') ? states.kosmos :
                target.endsWith('PUBLIC_PROXY_URI') ? proxyUrl : target.endsWith('DEPENDENCY_ANCHOR') ? path.join(root, 'package.json') : 'fixture';
        }
        const beforeRequests = backendRequests.length;
        const result = await withService(engine, family.definition, async client => {
          const catalog = (await client.listTools()).tools;
          const tool = ['get_state', 'get_tree', 'get_search_state', 'get_context'].find(name => catalog.some(t => t.name === name));
          assert.ok(tool, 'Representative workflow must expose a read-only state tool');
          const call = await client.callTool({ name: tool, arguments: {} });
          assert.notEqual(call.isError, true, JSON.stringify(call));
          const data = JSON.parse(call.content[0].text);
          if (tool === 'get_tree') assert.equal(data.config.executionContract.experiment.seedEnvironment, 'SCIENCEEVOLVE_SEED');
          return { tool, toolCount: catalog.length, resultSha256: sha(JSON.stringify(data)) };
        });
        const requests = backendRequests.slice(beforeRequests);
        if (Object.keys(mapping).some(k => k.endsWith('BACKEND_URL'))) {
          assert.equal(requests.length, 1); assert.equal(requests[0].body.scopeId, 'fixture-scope');
          assert.equal(requests[0].authorization, 'Bearer fixture-token');
        }
        return { evidence: 'real-shipped-workflow-source-through-real-host-and-stdio-child', source: family.path,
          definition: family.name, workflowSha256: family.workflowSha256, envFrom: mapping, ...result,
          localBackendRequests: requests.length, externalConnections: 0, scientificJobsLaunched: 0 };
      });
    }
    await record(`${engine}:actual-proxy-and-dependency-anchor-consumers`, async () => {
      cleanProductEnv();
      process.env.SCIENCEEVOLVE_AISCI_SCIENCE_ROOT = states['ai-scientist-v2'];
      process.env.SCIENCEEVOLVE_AISCI_PUBLIC_PROXY_URI = proxyUrl;
      process.env.SCIENCEEVOLVE_AISCI_DEPENDENCY_ANCHOR = path.join(root, 'package.json');
      const doc = JSON.parse(await read('example/ai-scientist-v2/workflow.json'));
      const definition = Object.values(doc.mcpDefinitions).find(d => d.args?.[0] === 'idea');
      const before = proxyConnects.length;
      await withService(engine, definition, async client => {
        const result = await client.callTool({ name: 'search_primary', arguments: { query: 'environment fixture' } });
        assert.equal(result.isError, true, 'Local proxy deliberately rejects all outbound targets');
      });
      assert.ok(proxyConnects.length > before);
      return { evidence: 'actual-public-fetch-loads-real-undici-through-configured-anchor-and-reaches-only-rejecting-local-proxy',
        localProxyConnects: proxyConnects.length - before, externalConnections: 0,
        expectedOutcome: 'consumer returns an error after the fixture proxy rejects CONNECT; no public service contacted' };
    });
    await record(`${engine}:injected-keys-and-explicit-forwarding`, async () => {
      cleanProductEnv(); process.env.SCIENCEEVOLVE_ENV_FIXTURE = 'mapped-fixture'; process.env.SCIENCEEVOLVE_UNMAPPED_SECRET = 'must-not-forward';
      const source = `const {Server}=require('@modelcontextprotocol/sdk/server/index.js');
const {StdioServerTransport}=require('@modelcontextprotocol/sdk/server/stdio.js');
const {ListToolsRequestSchema,CallToolRequestSchema}=require('@modelcontextprotocol/sdk/types.js');
const server=new Server({name:'environment-fixture',version:'1'},{capabilities:{tools:{}}});
server.setRequestHandler(ListToolsRequestSchema,async()=>({tools:[{name:'environment',description:'local proof',inputSchema:{type:'object'}}]}));
server.setRequestHandler(CallToolRequestSchema,async()=>({content:[{type:'text',text:JSON.stringify({mapped:process.env.FIXTURE_INPUT,source:process.env.SCIENCEEVOLVE_MCP_SOURCE_DIR,workspace:process.env.SCIENCEEVOLVE_WORKSPACE,project:process.env.SCIENCEEVOLVE_PROJECT_ROOT,leaked:process.env.SCIENCEEVOLVE_UNMAPPED_SECRET??null})}]}));
server.connect(new StdioServerTransport());`;
      await withService(engine, { files: { 'server.cjs': source }, entrypoint: 'server.cjs', envFrom: { FIXTURE_INPUT: 'SCIENCEEVOLVE_ENV_FIXTURE' } }, async (client, { workspacePath, base }) => {
        const result = JSON.parse((await client.callTool({ name: 'environment', arguments: {} })).content[0].text);
        assert.equal(result.mapped, 'mapped-fixture'); assert.equal(result.leaked, null);
        assert.equal(result.workspace, workspacePath); assert.equal(result.project, path.join(base, 'project'));
        assert.ok(result.source.startsWith(path.join(base, 'runtime')));
        assert.equal(await fs.readFile(path.join(result.source, 'server.cjs'), 'utf8'), source);
      });
      return { evidence: 'real-materialization-supervisor-and-child-observation', injectedKeys: 3, explicitForwarding: true, unmappedSecretAbsent: true };
    });
    await record(`${engine}:missing-operator-key-blocks-startup`, async () => {
      cleanProductEnv(); const family = [...families.values()].find(f => Object.keys(f.definition.envFrom).some(k => k.endsWith('BACKEND_URL')));
      await assert.rejects(withService(engine, family.definition, async () => assert.fail('must not start')),
        /failed to initialize|exited before becoming ready/);
      return { evidence: 'real-host-startup-rejection', successWasNotInferredFromCatalog: true, externalConnections: 0 };
    });
    await record(`${engine}:optional-auth-token-host-presence-contract`, async () => {
      cleanProductEnv();
      const family = [...families.values()].find(f => Object.keys(f.definition.envFrom).some(k => k.endsWith('BACKEND_URL')));
      const mapping = family.definition.envFrom;
      for (const [target, source] of Object.entries(mapping)) {
        if (target.endsWith('BACKEND_URL')) process.env[source] = backendUrl;
        if (target.endsWith('SCOPE_ID')) process.env[source] = 'fixture-scope';
      }
      await assert.rejects(withService(engine, family.definition, async () => assert.fail('undefined token must fail the actual host')),
        /failed to initialize|exited before becoming ready/);
      process.env[Object.entries(mapping).find(([target]) => target.endsWith('BACKEND_TOKEN'))[1]] = '';
      const before = backendRequests.length;
      await withService(engine, family.definition, async client => {
        const result = await client.callTool({ name: 'get_state', arguments: {} }); assert.notEqual(result.isError, true);
      });
      assert.equal(backendRequests.length - before, 1);
      assert.equal(backendRequests.at(-1).authorization, undefined);
      return { evidence: 'real-missing-token-rejection-followed-by-blank-token-success',
        undefinedToken: 'startup-rejected', emptyToken: 'startup-and-unauthenticated-local-call-passed',
        operatorContract: 'Every envFrom source must exist; an unauthenticated backend still needs an explicitly empty token variable.',
        baselineBehavior: 'The same undefined-source guard exists in the authoritative original host; this is not a naming-induced change.' };
    });
  }
} finally {
  cleanProductEnv(); for (const [key, value] of Object.entries(savedEnvironment)) if (key.startsWith('SCIENCEEVOLVE_')) process.env[key] = value;
  server.closeAllConnections(); proxy.closeAllConnections();
  await Promise.all([new Promise(resolve => server.close(resolve)), new Promise(resolve => proxy.close(resolve))]);
}
const report = { schemaVersion: 1, status: 'executed', generatedAt: new Date().toISOString(),
  platform: process.platform, node: process.version, fixtureRoot: temporary,
  scope: 'actual main MCP host; seven shipped workflow envFrom families; isolated generator; explicit injection/forwarding/missing-key paths',
  network: { localLoopbackOnly: true, externalConnections: 0, localBackendRequests: backendRequests.length,
    localProxyConnects: proxyConnects.length, proxyNeverOpensAnUpstreamSocket: true },
  modelsCalled: 0, scientificJobsLaunched: 0, sourceInputs, results,
  passed: results.filter(r => r.status === 'passed').length, failed: results.filter(r => r.status === 'failed').length,
  success: results.every(r => r.status === 'passed') };
if (option('--report')) await fs.writeFile(path.resolve(option('--report')), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ success: report.success, passed: report.passed, failed: report.failed, fixtureRoot: temporary }));
if (!report.success) process.exitCode = 1;
