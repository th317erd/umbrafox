/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { getEventListeners } from "node:events";
import { test } from "node:test";
import vm from "node:vm";
import * as fixture from "../fixture.mjs";

function page() {
  const nodes = new Map();
  /** Minimal bridge DOM with inspectable listeners and attributes. */
  class BridgeNode extends EventTarget {
    constructor() {
      super();
      this.textContent = "";
      this.attributes = new Map();
    }
    getAttribute(key) {
      return this.attributes.get(key) ?? null;
    }
    setAttribute(key, value) {
      this.attributes.set(key, value);
    }
    click() {
      this.dispatchEvent(new Event("click"));
    }
  }
  for (const id of ["run", "result"]) {
    nodes.set(id, new BridgeNode());
  }
  const events = new EventTarget();
  const timers = new Map();
  let timerID = 0;
  const context = vm.createContext({
    document: { getElementById: id => nodes.get(id) },
    Event,
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    setTimeout: callback => {
      timers.set(++timerID, callback);
      return timerID;
    },
    clearTimeout: id => timers.delete(id),
  });
  vm.runInContext("globalThis.window = globalThis;", context);
  return {
    context,
    nodes,
    events,
    timers,
    install: (collector = "async function() { return { payload: 1 }; }") =>
      vm.runInContext(
        `(${fixture.installDOMWindow.toString()})(${collector});`,
        context,
        { timeout: 1000 }
      ),
    request: () =>
      vm.runInContext(`(${fixture.requestDOMWindow.toString()})()`, context, {
        timeout: 1000,
      }),
    unload: () => events.dispatchEvent(new Event("pagehide")),
  };
}

test("window fixture serves a CSP-owned script and explicit version", async () => {
  const controller = new AbortController();
  const server = await fixture.createDOMServer(controller.signal, "window");
  try {
    assert.equal(server.metadata.execution, "window");
    assert.equal(server.metadata.version, 2);
    const response = await fetch(server.url);
    assert.match(
      response.headers.get("content-security-policy"),
      /script-src 'self'/
    );
    assert.match(await response.text(), /src="\/workload.js"/);
    const script = await fetch(server.url + "workload.js");
    assert.equal(script.status, 200);
    assert.match(script.headers.get("content-type"), /javascript/);
    const source = await script.text();
    assert(source.includes(fixture.collectDOM.toString()));
    assert.equal(
      createHash("sha256").update(source).digest("hex"),
      server.metadata.scriptSHA256
    );
    assert.equal((await fetch(server.url + "workload.js?other")).status, 404);
    assert.equal(server.snapshot().failure, null);
    assert(server.snapshot().bytes <= server.metadata.responseByteCap);
  } finally {
    controller.abort();
    await server.close();
  }
  await assert.rejects(
    fixture.createDOMServer(new AbortController().signal, "unknown")
  );
});

test("page-owned collector and bounded bridge exchange a versioned realm receipt", async () => {
  const value = page();
  value.install();
  const result = JSON.parse(JSON.stringify(await value.request()));
  assert.deepEqual(result, {
    version: 2,
    realm: {
      globalIsWindow: true,
      objectPrototypeMatches: true,
      functionPrototypeMatches: true,
      collectorPrototypeMatches: true,
    },
    measurement: { payload: 1 },
  });
  assert.equal(
    value.nodes.get("result").getAttribute("data-state"),
    "complete"
  );
  assert.equal(value.timers.size, 0);
  assert.equal(
    getEventListeners(value.nodes.get("result"), "change").length,
    0
  );
  assert.equal(getEventListeners(value.events, "pagehide").length, 0);
  await assert.rejects(value.request(), /already|ready/);
});

test("window bootstrap rejects a foreign global or collector before invoking it", async () => {
  for (const kind of ["global", "collector"]) {
    const value = page();
    let called = false;
    if (kind === "global") {
      vm.runInContext(
        "window = { Object, Function, addEventListener, removeEventListener };",
        value.context
      );
      value.install();
    } else {
      value.context.foreign = async () => {
        called = true;
      };
      value.install("foreign");
    }
    await assert.rejects(value.request(), /realm/);
    assert.equal(called, false);
    assert.equal(value.timers.size, 0);
  }
});

test("collector failure, oversize output and duplicate start latch failure", async () => {
  for (const collector of [
    "async function() { throw new Error('collector failure'); }",
    "async function() { return 'x'.repeat(262145); }",
    "async function() { document.getElementById('run').click(); return { payload: 1 }; }",
  ]) {
    const value = page();
    value.install(collector);
    await assert.rejects(value.request(), /failure|large|Duplicate/);
    assert.equal(
      value.nodes.get("result").getAttribute("data-state"),
      "failed"
    );
    assert(value.nodes.get("result").textContent.length <= 8192);
    assert.equal(value.timers.size, 0);
  }
});

test("unloading or bridge timeout cleans listeners and rejects without a retry", async () => {
  for (const action of ["unload", "timeout"]) {
    const value = page();
    value.install("async function() { return new Promise(() => {}); }");
    const request = value.request();
    const rejected = assert.rejects(request, /unloaded|timed out/);
    if (action === "unload") {
      value.unload();
    } else {
      for (const callback of [...value.timers.values()]) {
        callback();
      }
    }
    await rejected;
    assert.equal(value.timers.size, 0);
    await assert.rejects(value.request(), /already|ready/);
  }
});

test("bridge rejects missing or malformed result DOM without leaving a timer", async () => {
  const missing = page();
  missing.nodes.delete("result");
  await assert.rejects(missing.request(), /missing/);
  assert.equal(missing.timers.size, 0);
  const value = page();
  value.nodes.get("result").setAttribute("data-state", "ready");
  value.nodes.get("run").addEventListener("click", () => {
    value.nodes.get("result").textContent = "not JSON";
    value.nodes.get("result").setAttribute("data-state", "complete");
    value.nodes.get("result").dispatchEvent(new Event("change"));
  });
  await assert.rejects(value.request());
  assert.equal(value.timers.size, 0);
});

test("late completion cannot replace an unload failure", async () => {
  const value = page();
  value.install(
    "async function() { return new Promise(resolve => { globalThis.finish = resolve; }); }"
  );
  const pending = value.request();
  const rejected = assert.rejects(pending, /unloaded/);
  value.unload();
  await rejected;
  const original = value.nodes.get("result").textContent;
  vm.runInContext("finish({ payload: 2 });", value.context);
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(value.nodes.get("result").textContent, original);
  assert.equal(value.nodes.get("result").getAttribute("data-state"), "failed");
  assert.equal(getEventListeners(value.events, "pagehide").length, 0);
});

test("bridge bounds received text, state transitions and synchronous click failure", async () => {
  for (const kind of ["oversize", "state", "click"]) {
    const value = page();
    const output = value.nodes.get("result");
    output.setAttribute("data-state", "ready");
    value.nodes.get("run").click = () => {
      if (kind === "click") {
        throw new Error("Click failed");
      }
      output.setAttribute(
        "data-state",
        kind === "state" ? "running" : "complete"
      );
      output.textContent = '"' + "x".repeat(262145) + '"';
      output.dispatchEvent(new Event("change"));
    };
    await assert.rejects(value.request(), /large|state|Click failed/);
    assert.equal(value.timers.size, 0);
    assert.equal(getEventListeners(output, "change").length, 0);
    assert.equal(getEventListeners(value.events, "pagehide").length, 0);
  }
});
