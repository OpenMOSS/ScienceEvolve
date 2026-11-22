import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = async (name) => JSON.parse(await readFile(new URL(`../${name}/workflow.json`, import.meta.url), 'utf8'));

test('Coscientist returns every tool result to Planner; optimization is optional', async () => {
  const config = await workflow('chemical-coscientist');
  for (const source of ['web_search', 'documentation', 'code', 'experiment', 'optimization']) {
    assert.deepEqual(config.orchestration.routes[source], [{ kind: 'strong', target: 'planner' }]);
  }
  assert.ok(config.orchestration.routes.planner.some(edge => edge.target === 'optimization' && edge.kind === 'weak'));
  assert.match(config.agents.experiment.instructions, /直接交 planner/);
  assert.match(config.agents.optimization.instructions, /非论文独立必经角色/);
  assert.doesNotMatch(config.skillDefinitions['method-protocol'].files['references/method.md'], /后交 optimization/);
});

test('InternAgent Verification owns parallel optimization and evaluates its returned evidence', async () => {
  const config = await workflow('internagent-1-5');
  const group = config.orchestration.scopedWorkflow.groups.find(group => group.id === 'optimization');
  assert.equal(group.leaderAgentId, 'verification');
  assert.deepEqual(config.orchestration.routes.generation, [{ kind: 'strong', target: 'verification' }]);
  assert.deepEqual(config.orchestration.routes.optimization, [{ kind: 'strong', target: 'verification' }]);
  assert.deepEqual(config.orchestration.routes.verification, [
    { kind: 'weak', target: 'optimization' }, { kind: 'weak', target: 'evolution' }
  ]);
  assert.deepEqual(group.workflow.input.edges.map(edge => edge.kind), ['parallel', 'parallel']);
  assert.doesNotMatch(config.agents.generation.instructions, /作为 optimization 组 Leader/);
  assert.match(config.agents.verification.instructions, /当前批次和实际回执/);
  assert.match(config.orchestration.decisionPlans.verification, /不能重派已完成批次/);
  assert.match(config.skillDefinitions['method-protocol'].files['references/method.md'], /固定双槽批次/);
});

test('unverified method designs remain explicitly blocked, not certified by their graphs', async () => {
  const raven = await workflow('raven');
  assert.match(raven.agents.preflight.instructions, /strict-host.*blocked/);
  assert.match(raven.orchestration.termination.condition, /methodAccepted=false/);
  const biomni = await workflow('biomni-r0');
  assert.match(biomni.agents.preflight.instructions, /read_training_recipe/);
  assert.match(biomni.orchestration.termination.condition, /缺 recipe.*不接受/);
});
