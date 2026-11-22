import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../../', import.meta.url));
test('generator preserves the corrected Planner feedback and Verification ownership', async () => {
  const scratch = path.join(root, '.scratch');
  await fs.mkdir(scratch, { recursive: true });
  const temporary = await fs.mkdtemp(path.join(scratch, 'workflow-topology-'));
  try {
    const result = spawnSync(process.execPath, [path.join(root, 'scripts/example-workflows/build-workflows.mjs'), '--output-root', temporary], { encoding: 'utf8', timeout: 20_000 });
    assert.equal(result.status, 0, result.stderr);
    for (const [id, roles] of [
      ['chemical-coscientist', ['planner', 'experiment', 'optimization']],
      ['internagent-1-5', ['generation', 'verification']]
    ]) {
      const actual = JSON.parse(await fs.readFile(path.join(root, 'example', id, 'workflow.json'), 'utf8'));
      const generated = JSON.parse(await fs.readFile(path.join(temporary, id, 'workflow.json'), 'utf8'));
      assert.deepEqual(generated.orchestration, actual.orchestration, `${id}: generated topology drift`);
      assert.equal(generated.skillDefinitions['method-protocol'].files['references/method.md'], actual.skillDefinitions['method-protocol'].files['references/method.md']);
      for (const role of roles) assert.equal(generated.agents[role].instructions, actual.agents[role].instructions, `${id}: ${role} instructions drift`);
    }
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
});
