import assert from 'node:assert/strict';
import test from 'node:test';
import { expected, validate } from './native-contract.mjs';

function fixture() {
  return { tests: 86, disabled: 0, errors: 0, failures: 0,
    testsuites: Object.entries(expected).map(([name, names]) => ({
      name, tests: names.length, disabled: 0, errors: 0, failures: 0,
      testsuite: names.map(testName => ({ name: testName, classname: name, status: 'RUN', result: 'COMPLETED' })),
    })),
  };
}

test('complete inventory', () => assert.deepEqual(validate(fixture()), { tests: 86, failures: 0, skipped: [] }));
test('missing, duplicate, disabled and malformed results reject', () => {
  for (const change of [
    value => value.tests--,
    value => value.testsuites.pop(),
    value => value.testsuites[0].testsuite.pop(),
    value => { value.testsuites[0].testsuite[1] = value.testsuites[0].testsuite[0]; },
    value => { value.disabled = 1; },
    value => { value.testsuites[0].testsuite[0].result = 'UNKNOWN'; },
    value => { value.testsuites[0].testsuite[0].failures = [{}]; },
  ]) {
    const value = fixture();
    change(value);
    assert.throws(() => validate(value));
  }
});
test('skipped hardware is exposed, never counted as verified', () => {
  const value = fixture();
  value.testsuites[0].testsuite[0].result = 'SKIPPED';
  assert.equal(validate(value).skipped.length, 1);
});
