import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../../', import.meta.url));
const directory = path.join(root, 'docs/readme/workflows');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(await fs.readFile(path.join(directory, 'manifest.json'), 'utf8'));

test('gallery covers exactly the local workflow examples', async () => {
  const examples = [];
  for (const item of await fs.readdir(path.join(root, 'example'), { withFileTypes: true })) {
    if (!item.isDirectory() || item.name === 'tests') continue;
    await fs.access(path.join(root, 'example', item.name, 'workflow.json'));
    examples.push(item.name);
  }
  assert.deepEqual(manifest.map(record => record.id).sort(), examples.sort());
});

for (const record of manifest) test(`gallery source, image and readable-role coverage: ${record.id}`, async () => {
  const bytes = await fs.readFile(path.join(root, record.source));
  assert.equal(hash(bytes), record.sourceSha256, `${record.id}: stale source capture`);
  const config = JSON.parse(bytes);
  const groups = config.orchestration.scopedWorkflow?.groups ?? [];
  const covered = new Set();
  for (const capture of [record, ...record.details]) {
    assert.equal(hash(await fs.readFile(path.join(directory, capture.screenshot))), capture.screenshotSha256);
    assert.equal(capture.canvasZoom, 1, 'Do not fit dense graphs by shrinking nodes');
    assert.ok(capture.nodeTitleCssPx >= 16);
    if (capture !== record || !record.details.length) for (const id of capture.nodeIds) covered.add(id);
  }
  for (const group of groups) {
    const detail = record.details.find(capture => capture.groupId === group.id);
    assert.ok(detail, `${record.id}: missing scoped workflow ${group.id}`);
    for (const node of group.workflow.nodes) assert.ok(detail.nodeIds.includes(node.nodeId));
  }
  // Dense role registries require stage details covering every outer worker.
  if (Object.keys(config.agents).length >= 14) {
    assert.ok(record.details.length >= 2);
    for (const id of Object.keys(config.agents)) assert.ok(covered.has(id), `${record.id}: no readable detail for ${id}`);
  }
  if (record.id === 'scientist-two') assert.equal(record.details.length, 9);
  const page = await fs.readFile(path.join(directory, `${record.id}.md`), 'utf8');
  assert.ok(page.includes(record.screenshot));
  for (const detail of record.details) assert.ok(page.includes(detail.screenshot));
});
