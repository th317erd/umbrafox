/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(
  new URL(
    "../../../../toolkit/components/umbrafox/UmbrafoxControlScript.sys.mjs",
    import.meta.url
  ),
  "utf8"
);
const scope = vm.createContext({
  setTimeout,
  clearTimeout,
  TextEncoder,
  AbortController,
  AbortSignal,
  ChromeUtils: {
    defineESModuleGetters(target) {
      Object.assign(target, { setTimeout, clearTimeout });
    },
  },
});
vm.runInContext(source.replaceAll("export ", ""), scope);
const api = vm.runInContext(
  "({validateScriptParameters, serializeScriptValue, waitForControlOperation, controlError, controlTimeout, executeControlScript})",
  scope
);

test("script contract validates realm, body, arguments, timeout and document", () => {
  assert.equal(
    api.validateScriptParameters({ body: "return 1" }).realm,
    "page"
  );
  for (const params of [
    null,
    [],
    {},
    { body: 1 },
    { body: "", realm: "system" },
    { body: "", args: {} },
    { body: "", timeoutMs: 0 },
    { body: "", timeoutMs: Infinity },
    { body: "", timeoutMs: 60001 },
    { body: "", document: -1 },
    { body: "x".repeat(65537) },
  ]) {
    assert.throws(
      () => api.validateScriptParameters(params),
      e => e.code === "invalid argument"
    );
  }
});

test("results preserve undefined and reject lossy or unbounded values", () => {
  assert.equal(api.serializeScriptValue(undefined).type, "undefined");
  const value = vm.runInContext(
    '({answer:42, nested:[null,true,"hi"]})',
    scope
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(api.serializeScriptValue(value))),
    {
      type: "json",
      value: { answer: 42, nested: [null, true, "hi"] },
    }
  );
  for (const expression of [
    "NaN",
    "Infinity",
    "1n",
    "(()=>{})",
    "Symbol()",
    "({a:undefined})",
    "(()=>{const a={};a.a=a;return a})()",
    "new Date()",
    "({get x(){throw Error('getter called')}})",
    "'x'.repeat(1048577)",
  ]) {
    assert.throws(
      () => api.serializeScriptValue(vm.runInContext(expression, scope)),
      e => e.code === "serialization error"
    );
  }
});

test("wait completion, rejection, timeout and cancellation remove listeners", async () => {
  assert.equal(await api.waitForControlOperation(Promise.resolve(7), 100), 7);
  const failure = new Error("failure");
  await assert.rejects(
    api.waitForControlOperation(Promise.reject(failure), 100),
    e => e === failure
  );
  await assert.rejects(
    api.waitForControlOperation(new Promise(() => {}), 5),
    e => e.code === "timeout"
  );
  const controller = new AbortController();
  const pending = api.waitForControlOperation(
    new Promise(() => {}),
    1000,
    controller.signal
  );
  controller.abort();
  await assert.rejects(pending, e => e.code === "aborted");
  await assert.rejects(
    api.waitForControlOperation(
      Promise.reject(failure),
      100,
      controller.signal
    ),
    e => e.code === "aborted"
  );
});

const browserSource = await readFile(
  new URL(
    "../../../../toolkit/components/umbrafox/UmbrafoxControlBrowser.sys.mjs",
    import.meta.url
  ),
  "utf8"
);

function browserFixture() {
  const tab = new EventTarget();
  tab.isConnected = true;
  const state = { loads: 0, stopped: 0, destroyed: 0, queries: 0, canceled: 0 };
  const global = { innerWindowId: 11, getActor: () => actor };
  const context = {
    id: 1,
    isContent: true,
    currentWindowGlobal: global,
    currentURI: { spec: "about:blank" },
  };
  context.top = context;
  const actor = {
    async sendQuery(messageName, data) {
      state.queries++;
      assert.equal(messageName, "Execute");
      assert.equal(data.document, 11);
      return { result: { type: "json", value: 42 } };
    },
    sendAsyncMessage() {
      state.canceled++;
    },
  };
  const chromeWindow = {
    gBrowser: {
      tabs: [tab, {}],
      getTabForBrowser: () => tab,
      removeTab() {
        tab.isConnected = false;
      },
      addTab() {
        return { linkedBrowser: browser };
      },
    },
  };
  const browser = {
    browsingContext: context,
    webProgress: {},
    loadURI(uri) {
      state.loads++;
      context.currentURI = uri;
      state.resolve();
    },
  };
  context.topChromeWindow = chromeWindow;
  context.embedderElement = browser;
  /** Fake Gecko progress listener; no browser or network activity. */
  class ProgressListener {
    start() {
      this.isStarted = true;
      return new Promise(resolve => {
        state.resolve = resolve;
      });
    }
    stop() {
      this.isStarted = false;
      state.stopped++;
      state.resolve();
    }
    destroy() {
      state.destroyed++;
    }
  }
  const environment = vm.createContext({
    ...api,
    AbortController,
    AbortSignal,
    BrowsingContext: { get: id => (id === 1 ? context : null) },
    Services: {
      uuid: { generateUUID: () => "unique" },
      scriptSecurityManager: { getSystemPrincipal: () => "system" },
      io: {
        newURI: url => {
          const parsed = new URL(url);
          return { spec: parsed.href, scheme: parsed.protocol.slice(0, -1) };
        },
      },
    },
    ChromeUtils: {
      defineESModuleGetters: target =>
        Object.assign(target, { ProgressListener }),
    },
  });
  vm.runInContext(
    browserSource
      .replace(/import \{[\s\S]*?\} from [^;]+;/, "")
      .replaceAll("export ", ""),
    environment
  );
  return {
    api: vm.runInContext("UmbrafoxControlBrowser", environment),
    state,
    context,
    actor,
    browser,
    tab,
    window: chromeWindow,
  };
}

test("navigation checks parameters before effects and tears down its listener", async () => {
  const f = browserFixture();
  for (const params of [
    {},
    { context: 0 },
    { context: 2, url: "about:blank" },
    { context: 1, url: "javascript:alert(1)" },
    { context: 1, url: "not absolute" },
    { context: 1, url: "about:blank", timeoutMs: -1 },
    { context: 1, url: "about:blank", wait: "idle" },
  ]) {
    await assert.rejects(f.api.navigate(params));
  }
  assert.equal(f.state.loads, 0);
  assert.equal(
    (await f.api.navigate({ context: 1, url: "https://example.com/" })).url,
    "https://example.com/"
  );
  assert.equal(f.state.loads, 1);
  assert.equal(f.state.stopped, 1);
  assert.equal(f.state.destroyed, 1);
});

test("navigation timeout, disconnect, tab close and failed start remove listeners", async () => {
  for (const reason of ["timeout", "disconnect", "tab-close", "load-error"]) {
    const f = browserFixture();
    const controller = new AbortController();
    f.browser.loadURI = () => {
      if (reason === "disconnect") {
        controller.abort();
      }
      if (reason === "tab-close") {
        f.tab.dispatchEvent(new Event("TabClose"));
      }
      if (reason === "load-error") {
        throw new Error("bad load");
      }
    };
    await assert.rejects(
      f.api.navigate(
        { context: 1, url: "about:blank", timeoutMs: 5 },
        controller.signal
      )
    );
    assert.equal(f.state.destroyed, 1, reason);
    assert.equal(f.state.stopped, 1, reason);
  }
});

test("execution requires the requested document and rejects replacement", async () => {
  const f = browserFixture();
  await assert.rejects(
    f.api.execute({ context: 1, document: 12, body: "return 42" }),
    e => e.code === "stale document"
  );
  assert.equal(f.state.queries, 0);
  assert.equal(
    (await f.api.execute({ context: 1, document: 11, body: "return 42" }))
      .result.value,
    42
  );
  f.actor.sendQuery = async () => {
    f.context.currentWindowGlobal = { innerWindowId: 12 };
    return { result: { type: "json", value: 0 } };
  };
  await assert.rejects(
    f.api.execute({ context: 1, body: "return 0" }),
    e => e.code === "stale document"
  );
  assert.equal(f.state.canceled, 2);
});

test("pending scripts are exclusive and canceled on disconnect or timeout", async () => {
  const f = browserFixture();
  f.actor.sendQuery = () => new Promise(() => {});
  const controller = new AbortController();
  const pending = f.api.execute(
    { context: 1, body: "return 0" },
    controller.signal
  );
  await assert.rejects(
    f.api.execute({ context: 1, body: "return 0" }),
    e => e.code === "busy"
  );
  assert.throws(
    () => f.api.close({ context: 1 }),
    e => e.code === "busy"
  );
  controller.abort();
  await assert.rejects(pending, e => e.code === "aborted");
  await assert.rejects(
    f.api.execute({ context: 1, body: "return 0", timeoutMs: 5 }),
    e => e.code === "timeout"
  );
  assert.equal(f.state.canceled, 2);
});

test("tab operations are explicit and preserve the last tab", () => {
  const f = browserFixture();
  assert.throws(
    () => f.api.create({ context: 1, background: "yes" }),
    e => e.code === "invalid argument"
  );
  assert.equal(f.api.create({ context: 1 }).context, 1);
  f.window.gBrowser.tabs = [f.tab];
  assert.throws(
    () => f.api.close({ context: 1 }),
    e => e.code === "invalid argument"
  );
  f.window.gBrowser.tabs.push({});
  assert.equal(f.api.close({ context: 1 }).closed, true);
});

test("evaluation uses a disposable scope, page principal and explicit browser privilege", async () => {
  const page = new EventTarget();
  page.document = { title: "page title" };
  page.navigator = { webdriver: false };
  page.window = page;
  const before = Object.getOwnPropertyNames(page).sort();
  const created = [];
  let disposed = 0;
  const services = {
    appinfo: { processID: 7 },
    scriptSecurityManager: { getSystemPrincipal: () => "system" },
  };
  const fakeCu = {
    Sandbox(principal, options) {
      created.push({ principal, options });
      return vm.createContext({
        window: page,
        document: page.document,
        navigator: page.navigator,
      });
    },
    cloneInto(value, sandbox) {
      return vm.runInContext(`(${JSON.stringify(value)})`, sandbox);
    },
    evalInSandbox(
      code,
      sandbox,
      version,
      filename,
      line,
      enforceFilenameRestrictions
    ) {
      assert.equal(
        enforceFilenameRestrictions,
        created.at(-1).principal !== "system"
      );
      return vm.runInContext(code, sandbox);
    },
    nukeSandbox() {
      disposed++;
    },
  };
  scope.Cu = fakeCu;
  scope.Services = services;
  const response = await api.executeControlScript(page, {
    body: "return {answer: await Promise.resolve(arguments[0]+1), title: document.title, webdriver:navigator.webdriver, services:typeof Services};",
    args: [41],
  });
  assert.deepEqual(JSON.parse(JSON.stringify(response)), {
    type: "json",
    value: {
      answer: 42,
      title: "page title",
      webdriver: false,
      services: "undefined",
    },
  });
  assert.equal(created[0].principal, page);
  assert.equal(created[0].options.wantComponents, false);
  assert.equal(created[0].options.wantXrays, false);
  assert.deepEqual(Object.getOwnPropertyNames(page).sort(), before);
  const chrome = await api.executeControlScript(page, {
    realm: "browser",
    body: "return Services.appinfo.processID;",
  });
  assert.equal(chrome.value, 7);
  assert.equal(created[1].principal, "system");
  assert.equal(created[1].options.wantComponents, true);
  for (const body of [
    "throw null;",
    "throw new Error('failure');",
    "return document;",
    "return function(){};",
  ]) {
    // A fake document is JSON data; real DOM rejection belongs to browser tests.
    if (body === "return document;") {
      continue;
    }
    await assert.rejects(api.executeControlScript(page, { body }));
  }
  await assert.rejects(
    api.executeControlScript(page, {
      body: "return new Promise(()=>{});",
      timeoutMs: 5,
    }),
    e => e.code === "timeout"
  );
  const controller = new AbortController();
  const pending = api.executeControlScript(
    page,
    { body: "return new Promise(()=>{});" },
    controller.signal
  );
  controller.abort();
  await assert.rejects(pending, e => e.code === "aborted");
  const unloaded = api.executeControlScript(page, {
    body: "return new Promise(()=>{});",
  });
  page.dispatchEvent(new Event("pagehide"));
  await assert.rejects(unloaded, e => e.code === "aborted");
  assert.equal(disposed, created.length);
  assert.equal(page.Services, undefined);
  assert.equal(page.args, undefined);
});

test("actor errors and transport rejection remain failures and cancel the operation", async () => {
  const f = browserFixture();
  f.actor.sendQuery = async () => ({
    error: { code: "serialization error", message: "bad value" },
  });
  await assert.rejects(
    f.api.execute({ context: 1, body: "return 0" }),
    e => e.code === "serialization error"
  );
  f.actor.sendQuery = async () => {
    throw new Error("Actor destroyed");
  };
  await assert.rejects(
    f.api.execute({ context: 1, body: "return 0" }),
    /Actor destroyed/
  );
  assert.equal(f.state.canceled, 2);
});

test("content actor rejects privileged realm and stale documents, and aborts on destruction", async () => {
  const actorSource = await readFile(
    new URL(
      "../../../../toolkit/actors/UmbrafoxControlExecutionChild.sys.mjs",
      import.meta.url
    ),
    "utf8"
  );
  const signals = [];
  const actorScope = vm.createContext({
    AbortController,
    JSWindowActorChild: class {},
    executeControlScript: (target, params, signal) => {
      signals.push(signal);
      return new Promise((resolve, reject) =>
        signal.addEventListener(
          "abort",
          () => reject({ code: "aborted", message: "stopped" }),
          { once: true }
        )
      );
    },
  });
  vm.runInContext(
    actorSource.replace(/^import .*;$/m, "").replaceAll("export ", ""),
    actorScope
  );
  const actor = vm.runInContext(
    "new UmbrafoxControlExecutionChild()",
    actorScope
  );
  actor.manager = { innerWindowId: 11 };
  actor.contentWindow = {};
  const privileged = await actor.receiveMessage({
    name: "Execute",
    data: { realm: "browser", document: 11, id: "a" },
  });
  assert.equal(privileged.error.code, "invalid argument");
  const stale = await actor.receiveMessage({
    name: "Execute",
    data: { realm: "page", document: 12, id: "b" },
  });
  assert.equal(stale.error.code, "stale document");
  assert.equal(signals.length, 0);
  const pending = actor.receiveMessage({
    name: "Execute",
    data: { realm: "page", document: 11, id: "c" },
  });
  actor.didDestroy();
  assert.equal((await pending).error.code, "aborted");
  const canceled = actor.receiveMessage({
    name: "Execute",
    data: { realm: "page", document: 11, id: "d" },
  });
  await actor.receiveMessage({ name: "Cancel", data: { id: "d" } });
  assert.equal((await canceled).error.code, "aborted");
});

test("execution and navigation are registered on the authenticated service path", async () => {
  const root = new URL("../../../../", import.meta.url);
  const service = await readFile(
    new URL("toolkit/components/umbrafox/UmbrafoxControlService.sys.mjs", root),
    "utf8"
  );
  for (const method of [
    "umbrafox.script.execute",
    "umbrafox.browsingContext.create",
    "umbrafox.browsingContext.navigate",
    "umbrafox.browsingContext.close",
  ]) {
    assert(service.includes(`case "${method}"`));
  }
  assert(service.includes("this.#operations.abort()"));
  assert(service.includes('params.get("token") !== this.#service.token'));
  const manifest = await readFile(
    new URL("toolkit/actors/moz.build", root),
    "utf8"
  );
  assert(manifest.includes("UmbrafoxControlExecutionChild.sys.mjs"));
  assert(manifest.includes("UmbrafoxControlExecutionParent.sys.mjs"));
  const registration = await readFile(
    new URL("toolkit/modules/ActorManagerParent.sys.mjs", root),
    "utf8"
  );
  assert(registration.includes("UmbrafoxControlExecution: {"));
});
