/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import process from "node:process";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve, join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import {
  browserEnvironment,
  connectControl,
  readIdentity,
  stopOwned,
  withTimeout,
} from "/home/wyatt/Projects/umbrafox-workspace/umbrafox/tools/umbrafox/performance/helpers.mjs";
import {
  createApplicationData,
  createOutputRoot,
  readDiscovery,
  verifyApplicationData,
} from "/home/wyatt/Projects/umbrafox-workspace/umbrafox/tools/umbrafox/performance/run.mjs";

const [binaryArg, outputArg] = process.argv.slice(2);
assert(
  binaryArg && outputArg,
  "Usage: parity-smoke.mjs ABS_BINARY NEW_ABS_OUTPUT"
);
const binary = resolve(binaryArg);
const output = resolve(outputArg);
const controller = new AbortController();
const timer = setTimeout(
  () => controller.abort(new Error("Parity deadline")),
  90000
);
const signal = controller.signal;
const bounded = promise =>
  withTimeout(promise, 10000, "Parity operation", signal);
const snapshots = new Map();
const gates = new Set();
const receipts = [];
let activeRun;
let handlerError;
let server;

// This script runs as ordinary page code, not in a privileged test wrapper.
const page = `<!doctype html><meta charset="utf-8"><title>Local parity fixture</title>
<script>
(async () => {
  if (document.readyState !== 'complete') {
    await new Promise(resolve => window.addEventListener('load', resolve, {once: true}));
  }
  const shape = object => Object.getOwnPropertyNames(object).sort().map(name => {
    const descriptor = Object.getOwnPropertyDescriptor(object, name);
    return [name, descriptor.enumerable, descriptor.configurable,
      descriptor.writable ?? null, typeof descriptor.value,
      descriptor.get ? Function.prototype.toString.call(descriptor.get) : null,
      descriptor.set ? Function.prototype.toString.call(descriptor.set) : null];
  });
  const snapshot = () => ({
    webdriver: navigator.webdriver,
    userAgent: navigator.userAgent,
    names: Object.getOwnPropertyNames(window).sort(),
    navigator: shape(Navigator.prototype),
    document: shape(Document.prototype),
    element: shape(Element.prototype),
    fetch: Function.prototype.toString.call(fetch),
    createElement: Function.prototype.toString.call(Document.prototype.createElement),
    services: 'Services' in window,
    control: 'UmbrafoxControlExecution' in window,
    html: document.documentElement.outerHTML
  });
  const send = (phase, value) => fetch('/snapshot/' + phase, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(value)
  }).then(response => { if (!response.ok) throw new Error('Receipt rejected'); });
  await send('before', snapshot());
  await fetch('/gate');
  await send('after', snapshot());
})().catch(error => fetch('/failure', {method: 'POST', body: String(error)}));
</script>`;

async function handle(request, response) {
  const runName = activeRun;
  response.setHeader("Cache-Control", "no-store");
  if (request.url === "/" && request.method === "GET") {
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.end(page);
  } else if (request.url === "/navigation" && request.method === "GET") {
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.end("<!doctype html><title>Navigation fixture</title>");
  } else if (request.url === "/gate" && request.method === "GET") {
    gates.add(response);
    response.once("close", () => gates.delete(response));
  } else if (
    request.url?.startsWith("/snapshot/") &&
    request.method === "POST"
  ) {
    let body = "";
    for await (const chunk of request) {
      body += chunk;
      assert(Buffer.byteLength(body) <= 262144, "Fixture receipt exceeds cap");
    }
    const phase = request.url.slice("/snapshot/".length);
    assert(["before", "after"].includes(phase));
    const key = `${runName}-${phase}`;
    assert(!snapshots.has(key), "Duplicate receipt");
    snapshots.set(key, JSON.parse(body));
    response.end("ok");
  } else {
    if (request.url === "/failure") {
      throw new Error("Page probe failed");
    }
    response.writeHead(404).end();
  }
}

async function waitFor(predicate) {
  while (!predicate()) {
    if (handlerError) {
      throw handlerError;
    }
    await delay(25, undefined, { signal });
  }
}

async function run(enabled, url) {
  activeRun = enabled ? "on" : "off";
  const root = await createOutputRoot(join(output, activeRun), signal);
  const applicationData = await createApplicationData(root, signal);
  const profile = join(root.root, "profile");
  await bounded(mkdir(profile, { mode: 0o700 }));
  const prefs = {
    "umbrafox.control.enabled": enabled,
    "umbrafox.control.port": 0,
    "startup.homepage_welcome_url": "",
    "startup.homepage_welcome_url.additional": "",
    "datareporting.policy.dataSubmissionEnabled": false,
  };
  await bounded(
    writeFile(
      join(profile, "user.js"),
      Object.entries(prefs)
        .map(
          ([key, value]) =>
            `user_pref(${JSON.stringify(key)}, ${JSON.stringify(value)});`
        )
        .join("\n"),
      { mode: 0o600 }
    )
  );
  const { env } = browserEnvironment(
    process.env,
    "off",
    "basic",
    applicationData
  );
  await verifyApplicationData(applicationData, signal);
  signal.throwIfAborted();
  const child = spawn(binary, ["-no-remote", "-profile", profile, url], {
    env,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const owned = { child, identity: null, identityError: null, outcome: null };
  owned.completion = new Promise(resolveCompletion => {
    child.once("error", error => {
      owned.outcome = { error: error.code };
      resolveCompletion(owned.outcome);
    });
    child.once("exit", (code, exitSignal) => {
      owned.outcome = { code, signal: exitSignal };
      resolveCompletion(owned.outcome);
    });
  });
  const record = {
    enabled,
    pid: child.pid,
    applicationData,
    status: "running",
  };
  receipts.push(record);
  let log = "";
  const append = chunk => {
    if (Buffer.byteLength(log) + chunk.length > 1048576) {
      controller.abort(new Error("Browser log cap"));
      return;
    }
    log += chunk;
  };
  child.stdout.on("data", append);
  child.stderr.on("data", append);
  let control;
  try {
    owned.identity = await bounded(readIdentity(child.pid));
    assert.equal(owned.identity.parent, process.pid);
    assert.equal(owned.identity.group, child.pid);
    assert.equal(owned.identity.session, child.pid);
    record.identity = owned.identity;
    await waitFor(
      () => snapshots.has(`${activeRun}-before`) && gates.size === 1
    );
    if (enabled) {
      const discovery = await readDiscovery(
        join(profile, "umbrafox/control.json"),
        signal,
        10000
      );
      function observedSocket(socketURL) {
        const socket = new WebSocket(socketURL);
        socket.addEventListener("message", event => {
          const reply = JSON.parse(event.data);
          if (reply.error) {
            record.protocolErrors ??= [];
            record.protocolErrors.push(reply.error);
          }
        });
        return socket;
      }
      control = await connectControl(discovery, signal, observedSocket);
      const diagnostics = await control.request(
        "umbrafox.diagnostics.snapshot"
      );
      assert.equal(diagnostics.processID, child.pid);
      const tabs = diagnostics.windows.flatMap(
        chromeWindow => chromeWindow.tabs
      );
      assert.equal(tabs.length, 1, "Exactly one owned test tab");
      assert.equal(tabs[0].url, url);
      const context = tabs[0].context;
      for (const body of [
        "return {webdriver: navigator.webdriver, services: typeof Services};",
        "return await Promise.resolve(42);",
      ]) {
        const result = await control.request("umbrafox.script.execute", {
          context,
          body,
        });
        record.executions ??= [];
        record.executions.push(result);
      }
      assert.equal(record.executions[0].result.value.webdriver, false);
      assert.equal(record.executions[0].result.value.services, "undefined");
      assert.equal(record.executions[1].result.value, 42);
      const privileged = await control.request("umbrafox.script.execute", {
        context,
        realm: "browser",
        body: "return {pid: Services.appinfo.processID, buildID: Services.appinfo.appBuildID, appData: Services.dirsvc.get('UAppData', Components.interfaces.nsIFile).path, localAppData: Services.dirsvc.get('DefProfLRt', Components.interfaces.nsIFile).path, gpuImport: Services.prefs.getBoolPref('gfx.canvas.remote.use-draw-image-fast-path-dmabuf'), opacity: Services.prefs.getBoolPref('gfx.webrender.single-image-opacity.enabled')};",
      });
      record.nativeRoots = privileged.result.value;
      assert.equal(record.nativeRoots.pid, child.pid);
      assert.equal(record.nativeRoots.gpuImport, true);
      assert.equal(record.nativeRoots.opacity, true);
      const performanceSnapshot = await control.request(
        "umbrafox.performance.snapshot",
        { includeThreads: false, includeWindows: false }
      );
      assert.equal(performanceSnapshot.profiler.active, false);
      record.profiler = performanceSnapshot.profiler;
      const applicationINI = await bounded(
        readFile(join(dirname(binary), "application.ini"), "utf8")
      );
      assert.equal(
        record.nativeRoots.buildID,
        /^BuildID=(\d+)$/m.exec(applicationINI)?.[1]
      );
      assert.equal(record.nativeRoots.appData, applicationData.appData);
      assert.equal(
        record.nativeRoots.localAppData,
        applicationData.localAppData
      );
    }
    for (const response of gates) {
      response.end("continue");
    }
    await waitFor(() => snapshots.has(`${activeRun}-after`));
    assert.equal(snapshots.get(`${activeRun}-before`).webdriver, false);
    assert.equal(snapshots.get(`${activeRun}-before`).services, false);
    assert.equal(snapshots.get(`${activeRun}-before`).control, false);
    assert.deepEqual(
      snapshots.get(`${activeRun}-after`),
      snapshots.get(`${activeRun}-before`)
    );
    if (enabled) {
      const created = await control.request("umbrafox.browsingContext.create", {
        context: record.executions[0].context,
      });
      const navigationURL = new URL("/navigation", url).href;
      const navigated = await control.request(
        "umbrafox.browsingContext.navigate",
        {
          context: created.context,
          url: navigationURL,
        }
      );
      assert.equal(navigated.url, navigationURL);
      const title = await control.request("umbrafox.script.execute", {
        context: navigated.context,
        document: navigated.document,
        body: "return document.title;",
      });
      assert.equal(title.result.value, "Navigation fixture");
      const closeResult = await control.request(
        "umbrafox.browsingContext.close",
        {
          context: navigated.context,
        }
      );
      assert.equal(closeResult.closed, true);
      record.tabLifecycle = { created, navigated, title, closed: closeResult };
    }
    record.status = "pass";
  } catch (error) {
    record.status = "failed";
    record.error = String(error);
    throw error;
  } finally {
    control?.close();
    const cleanupSignal = AbortSignal.timeout(10000);
    record.cleanup = await stopOwned(owned, 5000, cleanupSignal);
    await withTimeout(
      writeFile(join(root.root, "browser.log"), log, { mode: 0o600 }),
      3000,
      "Log write"
    );
    assert.equal(record.cleanup.status, "clean", "Owned browser cleanup");
    await assert.rejects(readFile(`/proc/${child.pid}/stat`), {
      code: "ENOENT",
    });
  }
}

let failure;
try {
  await createOutputRoot(output, signal);
  server = createServer((request, response) => {
    handle(request, response).catch(error => {
      handlerError = error;
      response.destroy();
    });
  });
  server.maxConnections = 8;
  server.requestTimeout = 5000;
  await bounded(
    new Promise(resolveListen => server.listen(0, "127.0.0.1", resolveListen))
  );
  const url = `http://127.0.0.1:${server.address().port}/`;
  await run(false, url);
  await run(true, url);
  assert.deepEqual(snapshots.get("off-before"), snapshots.get("on-before"));
  assert.deepEqual(snapshots.get("off-after"), snapshots.get("on-after"));
} catch (error) {
  failure = String(error);
  process.exitCode = 1;
} finally {
  clearTimeout(timer);
  if (server) {
    server.closeAllConnections();
    await withTimeout(
      new Promise(resolveClose => server.close(resolveClose)),
      3000,
      "Fixture close"
    );
  }
  await withTimeout(
    writeFile(
      join(output, "result.json"),
      JSON.stringify(
        {
          status: failure ? "failed" : "pass",
          failure,
          binary,
          receipts,
          snapshots: Object.fromEntries(snapshots),
          scope:
            "Same-build control OFF/ON public-surface regression, not universal Firefox equivalence or network isolation",
        },
        null,
        2
      ),
      { mode: 0o600 }
    ),
    3000,
    "Result write"
  );
  console.log(
    failure ?? "PASS: non-automation OFF/ON parity and owned cleanup"
  );
}
