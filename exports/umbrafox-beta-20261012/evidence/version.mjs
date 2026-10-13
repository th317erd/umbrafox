import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { browserEnvironment, readIdentity, stopOwned } from '/home/wyatt/Projects/umbrafox-workspace/umbrafox/tools/umbrafox/performance/helpers.mjs';
import { createApplicationData, createOutputRoot, verifyApplicationData } from '/home/wyatt/Projects/umbrafox-workspace/umbrafox/tools/umbrafox/performance/run.mjs';
import { admitOwned, boundedOperation, createLocalCaptureBudget, launchRetained } from '/home/wyatt/Projects/umbrafox-workspace/umbrafox/tools/umbrafox/tests/readback/capture.mjs';

const root = '/home/wyatt/.cache/codex/umbrafox-beta-20261012-nYSBPOWS/version-run';
const budget = createLocalCaptureBudget(60000);
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(new Error('Version deadline')), 45000);
const bounded = (operation, label, cap = 2000) => boundedOperation(budget, controller.signal, operation, label, cap);
const cleanup = (operation, label, cap = 2000) => boundedOperation(budget, undefined, operation, label, cap, true);
const receipt = {};
let owned;
let error;
try {
  const outputRoot = await bounded(() => createOutputRoot(root, controller.signal), 'Root');
  const applicationData = await bounded(() => createApplicationData(outputRoot, controller.signal), 'Directories');
  const { env } = browserEnvironment(process.env, 'off', 'basic', applicationData);
  await bounded(() => verifyApplicationData(applicationData, controller.signal), 'Directory admission');
  budget.remaining();
  controller.signal.throwIfAborted();
  owned = launchRetained('/home/wyatt/Programs/umbrafox-nightly/umbrafox', ['--version'], env);
  receipt.pid = owned.child.pid;
  receipt.stdout = '';
  receipt.stderr = '';
  for (const name of ['stdout', 'stderr']) {
    owned.child[name].on('data', bytes => {
      if (Buffer.byteLength(receipt[name]) + bytes.length > 4096) {
        controller.abort(new Error('Version output cap'));
      } else receipt[name] += bytes.toString();
    });
  }
  await admitOwned(owned, bounded);
  receipt.identity = owned.identity;
  receipt.outcome = await bounded(() => owned.completion, 'Version', 10000);
  await bounded(() => owned.closed, 'Drain');
  assert.equal(receipt.outcome.code, 0);
  assert.match(receipt.stdout.trim(), /Umbrafox 160\.0a1$/);
} catch (failure) {
  error = failure;
  receipt.error = String(failure);
} finally {
  clearTimeout(timer);
  if (owned) {
    try {
      receipt.cleanup = await stopOwned(owned, 4500, AbortSignal.timeout(Math.ceil(Math.min(5000, budget.remaining(true)))));
      await cleanup(() => owned.closed, 'Cleanup drain');
      await cleanup(() => assert.rejects(readIdentity(owned.child.pid), { code: 'ENOENT' }), 'Root absence');
      receipt.rootAbsent = true;
      assert.equal(receipt.cleanup.status, 'clean');
    } catch (failure) {
      error ??= failure;
      receipt.cleanupError = String(failure);
    }
  }
  receipt.status = error ? 'failed' : 'pass';
  await cleanup(() => writeFile(`${root}/result.json`, JSON.stringify(receipt, null, 2) + '\n', { mode: 0o600, flag: 'wx' }), 'Final receipt');
}
console.log(JSON.stringify(receipt));
process.exitCode = error ? 1 : 0;
