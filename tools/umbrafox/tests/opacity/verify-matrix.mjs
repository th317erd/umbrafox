import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const [actual, reference, expectation] = process.argv.slice(2);
assert(['selected', 'excluded', 'fallback', 'mixed'].includes(expectation));
const exec = promisify(execFile);
const json = async (directory, file) => JSON.parse(await readFile(`${directory}/${file}`, 'utf8'));
const referenceShaders = (await json(reference, 'shader-markers.json')).markers;
assert.equal(referenceShaders.length, 0, 'Reference used the experimental shader');
for (const directory of [reference, actual]) {
  for (const file of ['frame.png', 'repeat.png']) {
    const result = await exec('compare', ['-metric', 'AE', `${directory}/${file}`,
      `${reference}/frame.png`, 'null:'], { timeout: 10000 });
    assert.equal(result.stderr.trim(), '0');
  }
}
const hash = (snapshot) => snapshot.windows.flatMap((window) => window.tabs)
  .find((tab) => tab.label.startsWith('Opacity oracle ready '))?.label;
const actualHash = hash(await json(actual, 'snapshot.json'));
assert(actualHash);
assert.equal(actualHash, hash(await json(reference, 'snapshot.json')));
const candidates = (await json(actual, 'markers.json')).markers.filter((marker) =>
  marker.name === 'WR RGB promotion' && marker.label.includes('preferred=true'));
assert(candidates.length > 10, 'Actual canvas candidacy missing');
const shaders = (await json(actual, 'shader-markers.json')).markers;
const promoted = candidates.filter((marker) => marker.label.includes('result=Ok(Overlay)'));
if (expectation === 'excluded') {
  assert.equal(shaders.length, 0, 'Excluded case used the experimental shader');
} else {
  assert(shaders.length > 10, 'Experimental shader was not selected');
  assert(promoted.length > 10, 'Actual canvas promotion missing');
}
if (expectation === 'fallback') {
  assert(candidates.some((marker) => marker.label.includes('root=true') &&
    marker.label.includes('color_alpha=0.25') && marker.label.includes('result=Err(OverlaySurfaceLimit)')),
  'Specialized image fallback was not exercised');
}
console.log(JSON.stringify({ expectation, candidates: candidates.length, promoted: promoted.length,
  shaders: shaders.length, referenceShaders: referenceShaders.length,
  mixedDrawBranchProof: expectation === 'mixed' ? 'unverified' : 'not-applicable',
  actualHash, pixelsChanged: 0 }));
