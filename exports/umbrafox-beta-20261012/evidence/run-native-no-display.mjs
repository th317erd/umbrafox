import assert from 'node:assert/strict';
import { readFile, writeFile, lstat } from 'node:fs/promises';
import { join } from 'node:path';
import { validate } from './native-contract.mjs';
import { validateDependencies } from '/home/wyatt/Projects/umbrafox-workspace/umbrafox/artifacts/umbralink-control/descriptor-borrow/gtest-contract.mjs';
import { admitInstallation, verifyInstallation } from '/home/wyatt/Projects/umbrafox-workspace/umbrafox/artifacts/umbralink-control/installation-state.mjs';
import { browserEnvironment, readIdentity, stopOwned, withTimeout } from '/home/wyatt/Projects/umbrafox-workspace/umbrafox/tools/umbrafox/performance/helpers.mjs';
import { createApplicationData, createOutputRoot, verifyApplicationData } from '/home/wyatt/Projects/umbrafox-workspace/umbrafox/tools/umbrafox/performance/run.mjs';
import { admitOwned, boundedOperation, createLocalCaptureBudget, launchRetained } from '/home/wyatt/Projects/umbrafox-workspace/umbrafox/tools/umbrafox/tests/readback/capture.mjs';

const [installation, manifestFile, root] = process.argv.slice(2);
const namespace = '/home/wyatt/.cache/codex/umbrafox-beta-20261012-nYSBPOWS/';
for (const value of [installation, manifestFile, root]) assert(value.startsWith(namespace) && !value.includes('/../'));
const budget = createLocalCaptureBudget(120000);
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(new Error('Native work deadline')), 105000);
const bounded = (operation, label, cap = 10000) => boundedOperation(budget, controller.signal, operation, label, cap);
const cleanup = (operation, label, cap = 2000) => boundedOperation(budget, undefined, operation, label, cap, true);
const receipt = { controllerPID: process.pid, installation, root };
const output = [];
let bytes = 0;
let owned;
let admission;
let rootCreated = false;
let failure;
try {
  const files = JSON.parse(await bounded(() => readFile(manifestFile, 'utf8'), 'Manifest')).files;
  admission = await bounded(() => admitInstallation(installation, files, controller.signal), 'Installation', 20000);
  validateDependencies(files, await bounded(() => readFile(join(installation, 'dependentlibs.list.gtest'), 'utf8'), 'Dependencies'));
  const outputRoot = await bounded(() => createOutputRoot(root, controller.signal), 'Create output');
  rootCreated = true;
  const applicationData = await bounded(() => createApplicationData(outputRoot, controller.signal), 'Private roots');
  receipt.applicationData = applicationData;
  const { env } = browserEnvironment(process.env, 'off', 'basic', applicationData);
  delete env.MOZ_HEADLESS;
  delete env.MOZ_HEADLESS_WIDTH;
  delete env.MOZ_HEADLESS_HEIGHT;
  Object.assign(env, {
    MOZ_RUN_GTEST: 'True', MOZ_XRE_DIR: installation, MOZ_WEBRENDER: '0',
    MOZ_ENABLE_INC_ORIGIN_INIT: '0', MOZ_CRASHREPORTER_NO_REPORT: '1',
    MOZ_DISABLE_NONLOCAL_CONNECTIONS: '1',
    GTEST_FILTER: 'DMABufProducerFence.*:DMABufReadback.*:CanvasVideoSurfaceCache.*:CanvasSurfaceImport.*:GPUVideoReadback.*:IPDLTest_CrossThread.TestGPUVideoReadbackIPC*:IPDLTest_CrossProcess.TestGPUVideoReadbackIPC*:TestRemoteImageHolder.*',
    GTEST_OUTPUT: `json:${root}/results.json`,
  });
  receipt.env = env;
  await bounded(() => writeFile(join(root, 'launch.json'), JSON.stringify(receipt, null, 2), { mode: 0o600, flag: 'wx' }), 'Launch evidence');
  await bounded(() => verifyApplicationData(applicationData, controller.signal), 'Directory recheck');
  controller.signal.throwIfAborted();
  budget.remaining();
  owned = launchRetained(join(installation, 'umbrafox'), ['-unittest', '--gtest_death_test_style=threadsafe'], env);
  receipt.pid = owned.child.pid;
  for (const stream of [owned.child.stdout, owned.child.stderr]) {
    stream.on('data', chunk => {
      bytes += chunk.length;
      if (bytes <= 1024 ** 2) output.push(chunk);
      else controller.abort(new Error('Native log cap'));
    });
  }
  await admitOwned(owned, bounded);
  receipt.identity = owned.identity;
  receipt.outcome = await bounded(() => owned.completion, 'Native tests', 60000);
  await bounded(() => owned.closed, 'Drain');
} catch (error) {
  failure = error;
  receipt.error = String(error);
} finally {
  clearTimeout(timer);
  if (owned) {
    try {
      receipt.cleanup = await stopOwned(owned, 4500, AbortSignal.timeout(Math.ceil(Math.min(5000, budget.remaining(true)))));
      await cleanup(() => owned.closed, 'Cleanup drain', 1000);
      await cleanup(() => assert.rejects(readIdentity(owned.child.pid), { code: 'ENOENT' }), 'Owned root absence', 1000);
      receipt.rootAbsent = true;
      assert.equal(receipt.cleanup.status, 'clean');
    } catch (error) {
      failure ??= error;
      receipt.cleanupError = String(error);
    }
  }
  receipt.logBytes = bytes;
  if (rootCreated) {
    try {
      await cleanup(() => writeFile(join(root, 'gtest.log'), Buffer.concat(output), { mode: 0o600 }), 'Save log');
      const info = await cleanup(() => lstat(join(root, 'results.json')), 'Results size');
      assert(info.isFile() && info.size <= 1024 ** 2);
      const results = JSON.parse(await cleanup(() => readFile(join(root, 'results.json'), 'utf8'), 'Results'));
      receipt.tests = validate(results);
      assert.equal(receipt.outcome.code, results.failures ? 1 : 0);
      if (admission) receipt.installationPostcheck = await cleanup(() => verifyInstallation(admission, AbortSignal.timeout(5000)), 'Installation postcheck', 5000);
    } catch (error) {
      failure ??= error;
      receipt.evidenceError = String(error);
    }
    receipt.status = failure || receipt.tests?.failures || receipt.tests?.skipped.length ? 'not-accepted' : 'pass';
    await withTimeout(writeFile(join(root, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n', { mode: 0o600 }), Math.min(1000, budget.remainingTerminal()), 'Final receipt');
  }
}
console.log(JSON.stringify({ status: receipt.status, tests: receipt.tests, error: receipt.error, evidenceError: receipt.evidenceError, cleanup: receipt.cleanup }));
process.exitCode = receipt.status === 'pass' ? 0 : 1;
