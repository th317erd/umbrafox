import assert from 'node:assert/strict';
import { spawn, execFile } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, open, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';

const [binary, output, mode, scenario] = process.argv.slice(2);
assert(binary && output && ['off', 'on'].includes(mode));
const scenarios = ['inset', 'alpha-edges', 'odd', 'dpr', 'resize', 'fractional',
  'rounded', 'fallback', 'mixed', 'nearest', 'opacity-half', 'opacity-three-quarters',
  'filter', 'blend', 'multiple', 'animated', 'replace'];
assert(!scenario || scenarios.includes(scenario));
assert(process.env.DISPLAY, 'Run inside a private Xvfb display');
const root = resolve(output);
await mkdir(root, { recursive: true });
const profile = `${root}/profile`;
await mkdir(profile);
const prefs = {
  'umbrafox.control.enabled': true,
  'umbrafox.control.port': 0,
  'gfx.webrender.single-image-opacity.enabled': mode === 'on',
  'gfx.webrender.debug.surface-promotion-logging': true,
  'gfx.webrender.all': true,
  'gfx.webrender.software': false,
  'gfx.webrender.reject-software-driver': false,
  'gfx.webrender.compositor': false,
  'layers.acceleration.force-enabled': true,
  'browser.shell.checkDefaultBrowser': false,
  'browser.startup.page': 0,
  'browser.startup.homepage_override.mstone': 'ignore',
  'datareporting.policy.dataSubmissionEnabled': false,
};
if (scenario === 'dpr') prefs['layout.css.devPixelsPerPx'] = '2.0';
await writeFile(`${profile}/user.js`, Object.entries(prefs).map(([name, value]) =>
  `user_pref(${JSON.stringify(name)}, ${JSON.stringify(value)});`).join('\n'));
const html = await readFile(new URL(scenario ? 'matrix.html' : 'canvas.html', import.meta.url));
const server = createServer((request, response) => {
  const found = new URL(request.url, 'http://127.0.0.1').pathname === '/';
  response.writeHead(found ? 200 : 404, { 'Content-Type': 'text/html' });
  response.end(found ? html : 'Not found');
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const url = `http://127.0.0.1:${server.address().port}/${scenario ? `?case=${scenario}` : ''}`;
const log = await open(`${root}/browser.log`, 'w');
const child = spawn(binary, ['-no-remote', '-profile', profile, '-kiosk', url], {
  detached: true,
  stdio: ['ignore', log.fd, log.fd],
  env: { ...process.env, MOZ_ENABLE_WAYLAND: '0', MOZ_WEBRENDER: '1',
    MOZ_PROFILER_STARTUP: '1', MOZ_PROFILER_STARTUP_FEATURES: 'nostacksampling',
    MOZ_PROFILER_STARTUP_FILTERS: 'Renderer,WRRenderBackend',
    MOZ_PROFILER_STARTUP_ENTRIES: '4194304' },
});
const exited = once(child, 'exit');
let socket;
try {
  let discovery;
  for (let attempt = 0; attempt < 100; attempt++) {
    assert(child.exitCode === null, 'Browser exited before discovery');
    try {
      discovery = JSON.parse(await readFile(`${profile}/umbrafox/control.json`, 'utf8'));
      break;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await delay(250);
    }
  }
  assert(discovery, 'Discovery timed out');
  socket = new WebSocket(discovery.websocketUrl);
  await Promise.race([once(socket, 'open'), delay(10000).then(() => { throw new Error('WebSocket timeout'); })]);
  let nextID = 0;
  async function request(method, params = {}) {
    const id = ++nextID;
    return new Promise((resolveRequest, reject) => {
      const timer = setTimeout(() => {
        socket.removeEventListener('message', listener);
        reject(new Error(`${method} timed out`));
      }, 15000);
      const listener = (event) => {
        const reply = JSON.parse(event.data);
        if (reply.id !== id) return;
        clearTimeout(timer);
        socket.removeEventListener('message', listener);
        if (reply.error) reject(new Error(JSON.stringify(reply.error)));
        else resolveRequest(reply.result);
      };
      socket.addEventListener('message', listener);
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  let snapshot;
  let ready = false;
  for (let attempt = 0; attempt < 90; attempt++) {
    snapshot = await request('umbrafox.diagnostics.snapshot');
    ready = snapshot.windows.some((window) => window.tabs.some((tab) =>
      tab.url === url && /^Opacity oracle ready [a-f0-9]+$/.test(tab.label)));
    if (ready) break;
    await delay(250);
  }
  assert(ready, 'Canvas never reached deterministic final state');
  await delay(1500);
  const graphics = await request('umbrafox.gfx.snapshot');
  await writeFile(`${root}/graphics.json`, JSON.stringify(graphics, null, 2));
  await writeFile(`${root}/snapshot.json`, JSON.stringify(snapshot, null, 2));
  assert(graphics.windows.some((window) => window.layerManagerType === 'WebRender'),
    'Test requires GL WebRender, not software/native fallback');
  await promisify(execFile)('import', ['-window', 'root', `${root}/frame.png`], { timeout: 10000 });
  await delay(500);
  await promisify(execFile)('import', ['-window', 'root', `${root}/repeat.png`], { timeout: 10000 });
  const dump = await request('umbrafox.performance.profile.dump', { filename: 'opacity.json' });
  await writeFile(`${root}/dump.json`, JSON.stringify(dump, null, 2));
  console.log(JSON.stringify({ root, mode, dump, ready }));
} finally {
  socket?.close();
  try { process.kill(-child.pid, 'SIGTERM'); } catch (error) {
    if (error.code !== 'ESRCH') throw error;
  }
  await Promise.race([exited, delay(5000)]);
  if (child.exitCode === null && child.signalCode === null) {
    process.kill(-child.pid, 'SIGKILL');
    await exited;
  }
  server.closeAllConnections();
  await new Promise((resolveClose) => server.close(resolveClose));
  await log.close();
}
