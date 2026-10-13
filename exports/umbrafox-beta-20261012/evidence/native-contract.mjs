import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { expectedTests as original } from '/home/wyatt/Projects/umbrafox-workspace/umbrafox/artifacts/umbralink-control/producer-fence-native/gtest-contract.mjs';

const sourceRoot = '/home/wyatt/.cache/codex/umbrafox-beta-20261012-nYSBPOWS/source';
const readback = readFileSync(`${sourceRoot}/dom/canvas/gtest/TestDMABufReadback.cpp`, 'utf8');
const readbackNames = Array.from(readback.matchAll(/TEST_F\(DMABufReadback,\s*(\w+)\)/g), match => match[1]);
assert.equal(readbackNames.length, 23);
export const expected = Object.freeze({
  ...original,
  CanvasVideoSurfaceCache: [
    ...original.CanvasVideoSurfaceCache,
    'ContentOwnershipCannotAlias',
    'MissingTargetNeverPublishes',
  ],
  DMABufReadback: readbackNames,
});

export function validate(result) {
  assert.equal(result.tests, 86);
  for (const key of ['disabled', 'errors']) assert.equal(result[key], 0);
  assert.deepEqual(result.testsuites.map(suite => suite.name).sort(), Object.keys(expected).sort());
  let failures = 0;
  const skipped = [];
  for (const suite of result.testsuites) {
    assert.equal(suite.tests, expected[suite.name].length);
    assert.equal(suite.disabled, 0);
    assert.equal(suite.errors, 0);
    assert.deepEqual(suite.testsuite.map(test => test.name).sort(), [...expected[suite.name]].sort());
    let suiteFailures = 0;
    for (const test of suite.testsuite) {
      assert.equal(test.classname, suite.name);
      assert.equal(test.status, 'RUN');
      assert(['COMPLETED', 'SKIPPED'].includes(test.result));
      if (test.failures?.length) suiteFailures++;
      if (test.result === 'SKIPPED') skipped.push(`${suite.name}.${test.name}`);
    }
    assert.equal(suite.failures, suiteFailures);
    failures += suiteFailures;
  }
  assert.equal(result.failures, failures);
  return { tests: result.tests, failures, skipped };
}
