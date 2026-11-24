import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSimulatorSteps, SIMULATOR_SCENARIOS } from './agentSimulator';

test('builds complete step progression for every simulator scenario', () => {
  for (const scenario of SIMULATOR_SCENARIOS) {
    const steps = buildSimulatorSteps(scenario.id, 'command_code_goat');
    assert.ok(steps.length >= 4);
    assert.equal(steps[0].index, 0);
    assert.equal(steps[steps.length - 1].index, steps.length - 1);
  }
});

test('riddle scenario transitions secret-file.txt from existing to read', () => {
  const steps = buildSimulatorSteps('riddle', 'command_code_goat');
  const firstFile = steps[0].files.find((f) => f.name === 'secret-file.txt');
  const readFileStep = steps[3].files.find((f) => f.name === 'secret-file.txt');
  assert.equal(firstFile?.status, 'existing');
  assert.equal(readFileStep?.status, 'read');
});

test('fizzbuzz scenario creates fizzbuzz.py and adapts endpoint to selected provider', () => {
  const steps = buildSimulatorSteps('fizzbuzz', 'gemini', 'gemini-2.5-flash');
  assert.equal(steps[0].files.some((f) => f.name === 'fizzbuzz.py'), false);
  assert.equal(steps[2].files.some((f) => f.name === 'fizzbuzz.py' && f.status === 'created'), true);
  assert.ok(steps[3].payloadPreview.includes('gemini-2.5-flash'));
});
