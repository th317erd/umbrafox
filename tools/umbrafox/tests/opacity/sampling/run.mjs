import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';

const [binary, referenceBinary, output, bus, diagnostic, normalOutput] = process.argv.slice(2);
assert(binary && referenceBinary && output && bus);
assert(diagnostic === undefined || diagnostic === 'mesa-float');
assert(!diagnostic || normalOutput);
const root = resolve(output);
await mkdir(root);
const exec = promisify(execFile);
const json = async (path) => JSON.parse(await readFile(path, 'utf8'));
const save = (path, value) => writeFile(path, JSON.stringify(value, null, 2));
const scenarios = diagnostic ? ['even-odd'] : ['odd-double', 'even-odd', 'odd-nearest'];
const mesaEnvironment = diagnostic ? {
  GALLIVM_PERF: 'no_aos_sampling',
  GALLIVM_DEBUG: 'perf',
  MESA_SHADER_CACHE_DISABLE: 'true',
} : {};
const identities = [binary, referenceBinary].flatMap((path) =>
  [path, `${dirname(path)}/libxul.so`, `${dirname(path)}/application.ini`,
    `${dirname(path)}/platform.ini`]);
for (const file of ['canvas.html', 'matrix.html', 'capture.mjs', 'verify.mjs',
  'verify-matrix.mjs', 'run-matrix.mjs', 'sampling/sampling.html', 'sampling/capture.mjs',
  'sampling/run.mjs']) identities.push(`tools/umbrafox/tests/opacity/${file}`);
if (diagnostic) {
  for (const mode of ['off', 'on']) {
    for (const file of ['frame.png', 'repeat.png', 'graphics.json']) {
      identities.push(`${normalOutput}/even-odd-${mode}/${file}`);
    }
  }
  await save(`${root}/diagnostic.json`, { diagnostic, normalOutput, mesaEnvironment,
    limitation: 'Driver-wide causal diagnostic, not product acceptance or per-canvas sampler proof' });
}

async function checkBus() {
  assert.equal((await readFile(bus, 'utf8')).trim(), 'OK', 'Coordinator halted diagnostics');
}
async function command(program, args, log, timeout = 30000, options = {}) {
  await checkBus();
  let result;
  try {
    result = await exec(program, args, { timeout, maxBuffer: 32 * 1024 * 1024, ...options });
  } catch (error) {
    if (log) await writeFile(log, `${error.stdout ?? ''}${error.stderr ?? ''}\n${error.message}\n`);
    throw error;
  }
  if (log) await writeFile(log, result.stdout + result.stderr);
  await checkBus();
  return result;
}
async function cleanupBrowser(directory) {
  let record;
  try {
    record = await json(`${directory}/browser-process.json`);
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  async function isOwned() {
    try {
      return (await readFile(`/proc/${record.pid}/cmdline`, 'utf8'))
        .split('\0').includes(`${directory}/profile`);
    } catch (error) {
      if (error.code === 'ENOENT') return false;
      throw error;
    }
  }
  if (!await isOwned()) return;
  process.kill(-record.pid, 'SIGTERM');
  await delay(2000);
  if (await isOwned()) process.kill(-record.pid, 'SIGKILL');
}
async function compare(actual, reference) {
  await checkBus();
  let stderr;
  try {
    ({ stderr } = await exec('compare', ['-metric', 'AE', actual, reference, 'null:'],
      { timeout: 10000 }));
  } catch (error) {
    if (error.code !== 1 || error.killed) throw error;
    stderr = error.stderr;
  }
  assert(/^\d+$/.test(stderr.trim()), `Unexpected comparison output: ${stderr}`);
  await checkBus();
  return Number(stderr.trim());
}
async function pixels(path) {
  const dimensions = (await command('identify', ['-format', '%w %h', path],
    `${path}.size.log`, 10000)).stdout.trim().split(' ').map(Number);
  assert(dimensions.every((dimension) => Number.isInteger(dimension) && dimension > 0));
  const { stdout } = await command('convert', [path, '-depth', '8', 'RGBA:-'],
    null, 10000, { encoding: 'buffer' });
  assert.equal(stdout.length, dimensions[0] * dimensions[1] * 4);
  return { dimensions, bytes: stdout };
}
async function inspect(directory) {
  const query = await json(`${directory}/markers.json`);
  assert.equal(query.markers.length, query.totalCount, 'Truncated promotion markers');
  const candidates = query.markers.filter((marker) =>
    marker.name === 'WR RGB promotion' && marker.label.includes('preferred=true'));
  assert(candidates.length > 10, 'Actual canvas candidates missing');
  const shaderQuery = await json(`${directory}/shader-markers.json`);
  assert.equal(shaderQuery.markers.length, shaderQuery.totalCount, 'Truncated shader markers');
  assert(shaderQuery.markers.every((marker) => marker.name === 'WR RGB no-rect-AA' &&
    marker.label === 'composite:NO_RECT_AA,TEXTURE_2D'), 'Unexpected shader variant');
  const snapshot = await json(`${directory}/snapshot.json`);
  const hashes = snapshot.windows.flatMap((window) => window.tabs)
    .map((tab) => tab.label).filter((label) => /^Opacity oracle ready [a-f0-9]+$/.test(label));
  assert.equal(hashes.length, 1, 'Expected exactly one ready canvas');
  const graphics = await json(`${directory}/graphics.json`);
  assert.equal(graphics.features.compositor, 'webrender', 'Unexpected renderer');
  assert(graphics.windows.some((window) => window.layerManagerType === 'WebRender' &&
    window.devicePixelRatio === 1), 'Unexpected compositor or DPR');
  return { candidates: candidates.length,
    promoted: candidates.filter((marker) => marker.label.includes('result=Ok(Overlay)')).length,
    shaderSelections: shaderQuery.markers.length, hash: hashes[0],
    rectangles: [...new Set(candidates.map((marker) => marker.label.match(/rect=(.*?) result=/)?.[1]))],
    firstCandidate: candidates[0].label };
}

const before = (await command('sha256sum', identities, `${root}/identities-before.txt`, 120000)).stdout;
const results = [];
try {
  for (const scenario of scenarios) {
    console.log(`START ${scenario}`);
    for (const mode of ['off', 'on']) {
      const directory = `${root}/${scenario}-${mode}`;
      try {
        await command('xvfb-run', ['-a', '-s', '-screen 0 1920x1080x24 -nocursor',
          process.execPath, 'tools/umbrafox/tests/opacity/sampling/capture.mjs',
          mode === 'off' ? referenceBinary : binary, directory, mode, scenario],
        `${root}/${scenario}-${mode}-capture.log`, 150000,
        { env: { ...process.env, ...mesaEnvironment } });
      } finally {
        await cleanupBrowser(directory);
      }
      const session = `opacity-sampling-${scenario}-${mode}`;
      const dump = await json(`${directory}/dump.json`);
      try {
        await command('profiler-cli', ['load', dump.path, '--session', session],
          `${directory}/profiler-load.log`, 60000);
        for (const [search, file] of [['WR RGB promotion', 'markers.json'],
          ['WR RGB no-rect-AA', 'shader-markers.json']]) {
          await command('profiler-cli', ['profile', 'markers', '--session', session,
            '--search', search, '--limit', '10000', '--json'], `${directory}/${file}`);
        }
      } finally {
        await exec('profiler-cli', ['stop', '--session', session], { timeout: 10000 });
      }
      if (diagnostic) {
        const state = await inspect(directory);
        assert.equal(state.hash, 'Opacity oracle ready 6e5e9bdd');
        assert.equal(state.promoted, mode === 'on' ? state.candidates : 0);
        assert(mode === 'on' ? state.shaderSelections > 10 : state.shaderSelections === 0);
        assert.equal(await compare(`${directory}/repeat.png`, `${directory}/frame.png`), 0,
          'Unstable diagnostic capture');
        const driverLog = await readFile(`${directory}/browser.log`, 'utf8');
        assert(driverLog.includes('using floating point linear filtering for'),
          'Missing float-filter logs; pause diagnostic');
      }
    }
    const offDirectory = `${root}/${scenario}-off`;
    const onDirectory = `${root}/${scenario}-on`;
    const off = await inspect(offDirectory);
    const on = await inspect(onDirectory);
    await save(`${root}/${scenario}-paths.json`, { off, on });
    assert.equal(off.shaderSelections, 0, 'Reference selected new shader');
    assert.equal(off.promoted, 0, 'Unexpected reference promotion');
    assert.equal(on.promoted, on.candidates, 'Unexpected candidate rejection');
    assert(on.shaderSelections > 10, 'Candidate did not select new shader');
    assert.equal(off.hash, on.hash, 'Readback differs');
    assert.equal(off.hash, `Opacity oracle ready ${scenario === 'even-odd' ? '6e5e9bdd' : '56391226'}`,
      'Fixture changed the preserved source pattern');
    for (const directory of [offDirectory, onDirectory]) {
      assert.equal(await compare(`${directory}/repeat.png`, `${directory}/frame.png`), 0,
        `Unstable repeated capture: ${directory}`);
    }
    const changedPixels = await compare(`${onDirectory}/frame.png`, `${offDirectory}/frame.png`);
    const offPixels = await pixels(`${offDirectory}/frame.png`);
    const onPixels = await pixels(`${onDirectory}/frame.png`);
    assert.deepEqual(offPixels.dimensions, onPixels.dimensions);
    const changes = [];
    for (let offset = 0; offset < offPixels.bytes.length; offset += 4) {
      const reference = [...offPixels.bytes.subarray(offset, offset + 4)];
      const actual = [...onPixels.bytes.subarray(offset, offset + 4)];
      const delta = actual.map((value, channel) => value - reference[channel]);
      if (delta.some((value) => value !== 0)) {
        const pixel = offset / 4;
        changes.push({ x: pixel % offPixels.dimensions[0],
          y: Math.floor(pixel / offPixels.dimensions[0]), reference, actual, delta });
      }
    }
    assert.equal(changes.length, changedPixels, 'Pixel count disagrees with ImageMagick AE');
    const result = { scenario, verdict: changedPixels === 0 ? 'PASS' : 'FAIL', changedPixels,
      repeatAE: 0, dimensions: offPixels.dimensions, off, on };
    if (diagnostic) {
      result.diagnosticOnly = true;
      result.normalComparisons = {};
      result.driverMessages = {};
      for (const mode of ['off', 'on']) {
        const directory = `${root}/${scenario}-${mode}`;
        const normalDirectory = `${normalOutput}/${scenario}-${mode}`;
        const graphics = await json(`${directory}/graphics.json`);
        const normalGraphics = await json(`${normalDirectory}/graphics.json`);
        assert.deepEqual(graphics.adapters, normalGraphics.adapters, 'Driver identity changed');
        result.normalComparisons[mode] = await compare(`${directory}/frame.png`,
          `${normalDirectory}/frame.png`);
        const lines = (await readFile(`${directory}/browser.log`, 'utf8')).split('\n');
        const messages = [];
        for (let index = 0; index < lines.length; index++) {
          if (lines[index].includes('using floating point linear filtering for')) {
            messages.push({ message: lines[index], parameters: lines[index + 1] });
          }
        }
        result.driverMessages[mode] = messages.length;
        await save(`${directory}/float-filter-messages.json`, messages);
      }
      result.normalPairAE = await compare(`${normalOutput}/${scenario}-on/frame.png`,
        `${normalOutput}/${scenario}-off/frame.png`);
      assert.equal(result.normalPairAE, 20, 'Preserved normal-driver failure changed');
    }
    await save(`${root}/${scenario}-pixels.json`, { ...result, changes });
    results.push(result);
    await save(`${root}/results.json`, results);
    console.log(JSON.stringify(result));
    if (diagnostic) {
      assert(result.driverMessages.off > 0 && result.driverMessages.on > 0,
        'No floating-point filter branch logs; diagnostic inconclusive');
    }
  }
} finally {
  const after = await exec('sha256sum', identities, { timeout: 120000, maxBuffer: 1024 * 1024 });
  await writeFile(`${root}/identities-after.txt`, after.stdout);
  assert.equal(after.stdout, before, 'Binary or oracle identity changed');
}
if (results.some((result) => result.verdict === 'FAIL')) process.exitCode = 1;
