import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const [resultDirectory, referenceDirectory, expected] = process.argv.slice(2);
assert(resultDirectory && referenceDirectory &&
  ['original', 'promoted', 'promoted-no-rect-aa'].includes(expected));
const exec = promisify(execFile);
for (const file of ['frame.png', 'repeat.png']) {
  const comparison = await exec('compare', ['-metric', 'AE',
    `${resultDirectory}/${file}`, `${referenceDirectory}/frame.png`, 'null:'], { timeout: 10000 });
  assert.equal(comparison.stderr.trim(), '0', `${file} changed pixels`);
}
const readJSON = async (path) => JSON.parse(await readFile(path, 'utf8'));
const canvasHash = (snapshot) => snapshot.windows.flatMap((window) => window.tabs)
  .find((tab) => tab.label.startsWith('Opacity oracle ready '))?.label;
const actualHash = canvasHash(await readJSON(`${resultDirectory}/snapshot.json`));
assert(actualHash);
assert.equal(actualHash, canvasHash(await readJSON(`${referenceDirectory}/snapshot.json`)));
const query = await readJSON(`${resultDirectory}/markers.json`);
const candidates = query.markers.filter((marker) => marker.name === 'WR RGB promotion' &&
  marker.label.includes('preferred=true') && marker.label.includes('rect=Box2D((0.0, 0.0), (1280.0, 972.0))'));
assert(candidates.length > 10, 'Actual async Canvas2D markers are missing');
const promoted = candidates.filter((marker) => marker.label.includes('root=true') &&
  marker.label.includes('color_alpha=0.25') && marker.label.includes('result=Ok(Overlay)'));
if (expected !== 'original') {
  assert.equal(promoted.length, candidates.length,
    'Actual async Canvas2D opacity path did not promote with retained modulation');
} else {
  assert.equal(promoted.length, 0);
  assert(candidates.every((marker) => marker.label.includes('root=false') &&
    marker.label.includes('result=Err(OverlaySurfaceLimit)')));
}
if (expected === 'promoted-no-rect-aa') {
  const shaders = await readJSON(`${resultDirectory}/shader-markers.json`);
  assert(shaders.markers.filter((marker) => marker.name === 'WR RGB no-rect-AA').length > 10,
    'Experimental shader variant was not selected');
}
console.log(JSON.stringify({ expected, candidates: candidates.length, promoted: promoted.length,
  canvasHash: actualHash, pixelsChanged: 0 }));
