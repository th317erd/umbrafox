import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';

const [binary, stopped, normal, output, bus] = process.argv.slice(2);
assert(binary && stopped && normal && output && bus);
const root = resolve(output);
const on = `${root}/even-odd-on`;
const off = `${stopped}/even-odd-off`;
const exec = promisify(execFile);
const json = async (path) => JSON.parse(await readFile(path, 'utf8'));
const save = (path, value) => writeFile(path, JSON.stringify(value, null, 2));
const mesaEnvironment = {
  GALLIVM_PERF: 'no_aos_sampling',
  GALLIVM_DEBUG: 'perf',
  MESA_SHADER_CACHE_DISABLE: 'true',
};
await mkdir(root);
async function checkBus() {
  assert.equal((await readFile(bus, 'utf8')).trim(), 'OK', 'Coordinator halted work');
}
async function command(program, args, log, timeout = 30000, options = {}) {
  await checkBus();
  try {
    const result = await exec(program, args, { timeout, maxBuffer: 32 * 1024 * 1024, ...options });
    if (log) await writeFile(log, result.stdout + result.stderr);
    await checkBus();
    return result;
  } catch (error) {
    if (log) await writeFile(log, `${error.stdout ?? ''}${error.stderr ?? ''}\n${error.message}\n`);
    throw error;
  }
}
async function ownedIdentity(pid) {
  const args = (await readFile(`/proc/${pid}/cmdline`, 'utf8')).split('\0');
  assert(args.includes(`${on}/profile`), 'Not the owned browser profile');
  const stat = await readFile(`/proc/${pid}/stat`, 'utf8');
  const fields = stat.slice(stat.lastIndexOf(')') + 2).trim().split(/\s+/);
  return { pid, startTime: fields[19], profile: `${on}/profile` };
}
let captureFinished = false;
let observedIdentity;
async function observeParent() {
  const deadline = Date.now() + 150000;
  while (!captureFinished && Date.now() < deadline) {
    await checkBus();
    try {
      const record = await json(`${on}/browser-process.json`);
      const identity = await ownedIdentity(record.pid);
      if (observedIdentity) assert.deepEqual(identity, observedIdentity, 'PID identity changed');
      observedIdentity = identity;
      const entries = (await readFile(`/proc/${record.pid}/environ`, 'utf8')).split('\0');
      const environment = {};
      for (const key of Object.keys(mesaEnvironment)) {
        const matches = entries.filter((entry) => entry.startsWith(`${key}=`));
        assert.equal(matches.length, 1, `Missing or duplicate ${key}`);
        environment[key] = matches[0].slice(key.length + 1);
      }
      assert.deepEqual(environment, mesaEnvironment, 'Renderer environment differs');
      const mappings = (await readFile(`/proc/${record.pid}/maps`, 'utf8')).split('\n')
        .filter((line) => /\/(?:libgallium|libEGL|libGL|libLLVM)[^/]*$/.test(line));
      const galliumPaths = [...new Set(mappings.filter((line) => line.includes('/libgallium'))
        .map((line) => line.match(/\s+(\/.*)$/)[1]))];
      if (galliumPaths.length) {
        assert.equal(galliumPaths.length, 1, 'Unexpected multiple gallium libraries');
        const driver = await realpath(galliumPaths[0]);
        const hash = (await command('sha256sum', [driver], `${root}/driver-hash.txt`)).stdout;
        const notes = (await command('readelf', ['-n', driver], null)).stdout;
        const buildID = notes.match(/Build ID: ([a-f0-9]+)/)?.[1];
        assert(buildID, 'Driver build ID unavailable');
        assert.deepEqual(await ownedIdentity(record.pid), identity);
        const evidence = { ...identity, environment, mappings, driver, hash, buildID,
          samplerBranchProof: 'unavailable-release-log',
          limitation: 'Process configuration and loaded library, not per-canvas sampler evidence' };
        await save(`${root}/process-evidence.json`, evidence);
        return evidence;
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await delay(100);
  }
  throw new Error('Owned renderer environment/driver evidence unavailable');
}
async function cleanupBrowser() {
  let identity;
  try {
    const { pid } = await json(`${on}/browser-process.json`);
    identity = await ownedIdentity(pid);
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  if (observedIdentity) assert.deepEqual(identity, observedIdentity);
  process.kill(-identity.pid, 'SIGTERM');
  await delay(2000);
  try {
    assert.deepEqual(await ownedIdentity(identity.pid), identity);
    process.kill(-identity.pid, 'SIGKILL');
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'ESRCH') throw error;
  }
}
async function image(path) {
  const size = (await command('identify', ['-format', '%w %h', path], null, 10000)).stdout;
  assert.equal(size, '1920 1080', 'Unexpected X framebuffer geometry');
  return (await command('convert', [path, '-depth', '8', 'RGBA:-'], null, 10000,
    { encoding: 'buffer' })).stdout;
}
async function compare(actual, reference, name) {
  let metric;
  await checkBus();
  try {
    metric = (await exec('compare', ['-metric', 'AE', actual, reference, 'null:'],
      { timeout: 10000 })).stderr;
  } catch (error) {
    if (error.code !== 1 || error.killed) throw error;
    metric = error.stderr;
  }
  await checkBus();
  assert(/^\d+$/.test(metric.trim()));
  const actualBytes = await image(actual);
  const referenceBytes = await image(reference);
  assert.equal(actualBytes.length, 1920 * 1080 * 4);
  assert.equal(referenceBytes.length, actualBytes.length);
  const changes = [];
  for (let offset = 0; offset < actualBytes.length; offset += 4) {
    const a = [...actualBytes.subarray(offset, offset + 4)];
    const b = [...referenceBytes.subarray(offset, offset + 4)];
    const delta = a.map((value, channel) => value - b[channel]);
    if (delta.some((value) => value !== 0)) {
      const pixel = offset / 4;
      changes.push({ x: pixel % 1920, y: Math.floor(pixel / 1920), actual: a, reference: b, delta });
    }
  }
  assert.equal(changes.length, Number(metric.trim()), 'Independent AE mismatch');
  await save(`${root}/${name}.json`, { actual, reference, AE: changes.length,
    verdict: changes.length ? 'FAIL' : 'DIAGNOSTIC_EQUAL', changes });
  return changes.length;
}
async function inspect(directory) {
  const markers = await json(`${directory}/markers.json`);
  const shaders = await json(`${directory}/shader-markers.json`);
  assert.equal(markers.markers.length, markers.totalCount);
  assert.equal(shaders.markers.length, shaders.totalCount);
  assert(shaders.markers.every((marker) => marker.name === 'WR RGB no-rect-AA' &&
    marker.label === 'composite:NO_RECT_AA,TEXTURE_2D'));
  const candidates = markers.markers.filter((marker) => marker.name === 'WR RGB promotion' &&
    marker.label.includes('preferred=true'));
  assert(candidates.length > 10);
  const snapshot = await json(`${directory}/snapshot.json`);
  const titles = snapshot.windows.flatMap((window) => window.tabs).map((tab) => tab.label);
  assert.deepEqual(titles, ['Opacity oracle ready 6e5e9bdd']);
  const graphics = await json(`${directory}/graphics.json`);
  assert.equal(graphics.features.compositor, 'webrender');
  assert.equal(graphics.features.gpuProcess.status, 'unused');
  assert(graphics.windows.some((window) => window.layerManagerType === 'WebRender' &&
    window.devicePixelRatio === 1));
  const bytes = await image(`${directory}/frame.png`);
  let minX = 1920;
  let minY = 1080;
  let maxX = -1;
  let maxY = -1;
  for (let offset = 0; offset < bytes.length; offset += 4) {
    if (bytes[offset] === 53 && bytes[offset + 1] === 113 &&
        bytes[offset + 2] === 141 && bytes[offset + 3] === 255) {
      const x = offset / 4 % 1920;
      const y = Math.floor(offset / 4 / 1920);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
  const backgroundBounds = { minX, minY, maxX, maxY };
  assert.deepEqual(backgroundBounds, { minX: 4, minY: 4, maxX: 1283, maxY: 975 },
    'Fixture background extent must match saved 1280x972 viewport');
  return { candidates: candidates.length,
    promoted: candidates.filter((marker) => marker.label.includes('result=Ok(Overlay)')).length,
    shaderSelections: shaders.markers.length, processID: snapshot.processID,
    markerPIDs: [...new Set(candidates.map((marker) => marker.pid))],
    hash: '6e5e9bdd', backgroundBounds, adapters: graphics.adapters };
}

const manifest = await readFile(`${stopped}/identities-after.txt`, 'utf8');
const identities = manifest.trim().split('\n').map((line) => line.slice(66));
identities.push('tools/umbrafox/tests/opacity/sampling/complete-float.mjs');
for (const file of ['identities-before.txt', 'identities-after.txt', 'diagnostic.json']) {
  identities.push(`${stopped}/${file}`);
}
for (const file of ['frame.png', 'repeat.png', 'markers.json', 'shader-markers.json',
  'snapshot.json', 'graphics.json', 'browser.log', 'dump.json']) identities.push(`${off}/${file}`);
await command('sha256sum', ['--check', `${stopped}/identities-after.txt`], `${root}/preflight.log`, 120000);
const before = (await command('sha256sum', identities, `${root}/identities-before.txt`, 120000)).stdout;
await save(`${root}/contract.json`, { mesaEnvironment, binary, stopped, normal,
  samplerBranchProof: 'unavailable-release-log',
  offLimitation: 'Stopped OFF has no live process-environment or loaded-driver capture' });
try {
  const reference = await inspect(off);
  assert.equal(reference.promoted, 0);
  assert.equal(reference.shaderSelections, 0);
  assert.equal(await compare(`${off}/repeat.png`, `${off}/frame.png`, 'off-repeat'), 0);
  console.log('START sole ON capture');
  const controller = new AbortController();
  const sidecar = observeParent().then((value) => ({ value }), (error) => {
    controller.abort();
    return { error };
  });
  try {
    await command('xvfb-run', ['-a', '-s', '-screen 0 1920x1080x24 -nocursor',
      process.execPath, 'tools/umbrafox/tests/opacity/sampling/capture.mjs', binary, on, 'on', 'even-odd'],
    `${root}/on-capture.log`, 150000,
    { env: { ...process.env, ...mesaEnvironment }, signal: controller.signal });
  } finally {
    captureFinished = true;
    await cleanupBrowser();
    const observation = await sidecar;
    if (observation.error) {
      await save(`${root}/sidecar-failure.json`, { message: observation.error.message });
    }
  }
  const observation = await sidecar;
  if (observation.error) throw observation.error;
  const dump = await json(`${on}/dump.json`);
  const session = 'opacity-mesa-float-on-completion';
  try {
    await command('profiler-cli', ['load', dump.path, '--session', session], `${on}/profiler-load.log`, 60000);
    for (const [search, file] of [['WR RGB promotion', 'markers.json'],
      ['WR RGB no-rect-AA', 'shader-markers.json']]) {
      await command('profiler-cli', ['profile', 'markers', '--session', session,
        '--search', search, '--limit', '10000', '--json'], `${on}/${file}`);
    }
  } finally {
    await exec('profiler-cli', ['stop', '--session', session], { timeout: 10000 });
  }
  const candidate = await inspect(on);
  assert.equal(candidate.processID, observation.value.pid);
  assert.deepEqual(candidate.markerPIDs, [String(observation.value.pid)]);
  assert.deepEqual(candidate.adapters, reference.adapters);
  assert.equal(candidate.promoted, candidate.candidates);
  assert(candidate.shaderSelections > 10);
  assert.equal(await compare(`${on}/repeat.png`, `${on}/frame.png`, 'on-repeat'), 0);
  const comparisons = {};
  comparisons.pair = await compare(`${on}/frame.png`, `${off}/frame.png`, 'float-pair');
  comparisons.onNormal = await compare(`${on}/frame.png`, `${normal}/even-odd-on/frame.png`, 'on-normal');
  comparisons.offNormal = await compare(`${off}/frame.png`, `${normal}/even-odd-off/frame.png`, 'off-normal');
  comparisons.normalPair = await compare(`${normal}/even-odd-on/frame.png`,
    `${normal}/even-odd-off/frame.png`, 'normal-pair');
  assert.equal(comparisons.offNormal, 71071);
  assert.equal(comparisons.normalPair, 20);
  const browserLog = await readFile(`${on}/browser.log`, 'utf8');
  const result = { comparisons, reference, candidate,
    pairVerdict: comparisons.pair ? 'FAIL' : 'DIAGNOSTIC_EQUAL', productionVerdict: 'FAIL',
    samplerBranchProof: 'unavailable-release-log',
    floatLogMessages: browserLog.split('\n').filter((line) =>
      line.includes('using floating point linear filtering for')).length };
  await save(`${root}/results.json`, result);
  console.log(JSON.stringify(result));
  if (Object.values(comparisons).some((AE) => AE !== 0)) process.exitCode = 1;
} catch (error) {
  await save(`${root}/failure.json`, { verdict: 'INCONCLUSIVE', message: error.message, stack: error.stack });
  throw error;
} finally {
  captureFinished = true;
  await cleanupBrowser();
  const after = await exec('sha256sum', identities, { timeout: 120000, maxBuffer: 1024 * 1024 });
  await writeFile(`${root}/identities-after.txt`, after.stdout);
  assert.equal(after.stdout, before, 'Binary, fixture or preserved evidence identity changed');
}
