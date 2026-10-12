import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const [binary, referenceBinary, output, bus] = process.argv.slice(2);
assert(binary && referenceBinary && output && bus);
const root = resolve(output);
await mkdir(root, { recursive: true });
const exec = promisify(execFile);
const cases = [
  ['inset', 'selected'], ['alpha-edges', 'selected'], ['odd', 'selected'],
  ['dpr', 'selected'], ['resize', 'selected'], ['fallback', 'fallback'],
  ['fractional', 'excluded'], ['rounded', 'excluded'], ['mixed', 'mixed'],
  ['nearest', 'selected'], ['opacity-half', 'selected'],
  ['opacity-three-quarters', 'selected'], ['filter', 'excluded'],
  ['blend', 'excluded'], ['multiple', 'excluded'], ['animated', 'excluded'],
  ['replace', 'selected'],
];
async function checkBus() {
  assert.equal((await readFile(bus, 'utf8')).trim(), 'OK', 'Coordinator halted the experiment');
}
async function command(program, args, log, timeout = 30000) {
  await checkBus();
  let result;
  try {
    result = await exec(program, args, { timeout, maxBuffer: 16 * 1024 * 1024 });
  } catch (error) {
    await writeFile(log, `${error.stdout ?? ''}${error.stderr ?? ''}\n${error.message}\n`);
    throw error;
  }
  await writeFile(log, result.stdout + result.stderr);
  await checkBus();
  return result.stdout;
}
for (const [scenario, expectation] of cases) {
  console.log(`START ${scenario}: ${expectation}`);
  for (const mode of ['off', 'on']) {
    const directory = `${root}/${scenario}-${mode}`;
    await command('xvfb-run', ['-a', '-s', '-screen 0 1920x1080x24 -nocursor',
      process.execPath, 'tools/umbrafox/tests/opacity/capture.mjs',
      mode === 'off' ? referenceBinary : binary, directory, mode, scenario],
    `${root}/${scenario}-${mode}-capture.log`, 150000);
    const session = `opacity-matrix-${scenario}-${mode}`;
    const dump = JSON.parse(await readFile(`${directory}/dump.json`, 'utf8'));
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
  }
  const verified = await command(process.execPath, ['tools/umbrafox/tests/opacity/verify-matrix.mjs',
    `${root}/${scenario}-on`, `${root}/${scenario}-off`, expectation], `${root}/${scenario}-verify.log`);
  console.log(`PASS ${scenario}: ${verified.trim()}`);
}
