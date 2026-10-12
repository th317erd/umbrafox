/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { parse } from "acorn";

const base = new URL("../../../../", import.meta.url);
const files = {
  controller:
    "toolkit/components/umbrafox/UmbrafoxUserlandEventController.sys.mjs",
  runtime: "toolkit/components/umbrafox/UmbrafoxUserlandScriptRuntime.sys.mjs",
  parent: "toolkit/actors/UmbrafoxUserlandParent.sys.mjs",
  registry:
    "toolkit/components/umbrafox/UmbrafoxUserlandScriptRegistry.sys.mjs",
};
const sources = {};
for (const [moduleName, file] of Object.entries(files)) {
  sources[moduleName] = await readFile(new URL(file, base), "utf8");
}

function load(moduleName, globals, exports) {
  let source = sources[moduleName];
  const ast = parse(source, { ecmaVersion: "latest", sourceType: "module" });
  for (const node of ast.body.toReversed()) {
    if (node.type === "ImportDeclaration") {
      source = source.slice(0, node.start) + source.slice(node.end);
    } else if (node.type === "ExportNamedDeclaration") {
      source =
        source.slice(0, node.start) + source.slice(node.declaration.start);
    }
  }
  const scope = vm.createContext({ URL, ...globals });
  vm.runInContext(source, scope, { timeout: 1000 });
  return vm.runInContext(`({${exports}})`, scope, { timeout: 1000 });
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

const receipt = { browsingContextId: 7, innerWindowId: 101 };
const plain = value => JSON.parse(JSON.stringify(value));

function nativeWindow(sendQuery = async () => ({ ...receipt })) {
  const calls = [];
  const global = {
    innerWindowId: 101,
    browsingContext: { id: 7 },
    getActor(actorName) {
      assert.equal(actorName, "UmbrafoxUserland");
      return {
        sendQuery(message, data) {
          calls.push({ message, data: plain(data) });
          return sendQuery(message, data);
        },
      };
    },
  };
  return {
    window: { browsingContext: { id: 7 }, windowGlobalChild: global },
    global,
    calls,
  };
}

function controller(unwrap = value => value) {
  return load(
    "controller",
    {
      Cu: { unwaiveXrays: unwrap },
      Services: {
        appinfo: { processType: 1, PROCESS_TYPE_DEFAULT: 0 },
      },
    },
    `Controller: UmbrafoxUserlandEventController,
     prepare: typeof prepareUmbrafoxUserlandRequestCapability === "function"
       ? prepareUmbrafoxUserlandRequestCapability : undefined`
  );
}

function parentFixture(presence = () => null) {
  let scripts = [];
  let ensured = 0;
  const { Parent } = load(
    "parent",
    {
      JSWindowActorParent: class {},
      UMBRAFOX_USERLAND_SCRIPT_SHARED_DATA_KEY: "scripts",
      hasPublishedDocumentUserlandScripts: presence,
      Services: { ppmm: { sharedData: { get: () => scripts } } },
      ensureUmbrafoxUserlandRequestObserver() {
        ensured++;
      },
    },
    "Parent: UmbrafoxUserlandParent"
  );
  const actor = new Parent();
  actor.manager = {
    innerWindowId: 101,
    isCurrentGlobal: true,
    documentURI: { spec: "https://fixture.invalid/" },
  };
  actor.browsingContext = { id: 7 };
  return {
    actor,
    setScripts(value) {
      scripts = value;
    },
    get ensured() {
      return ensured;
    },
  };
}

test("native construction requires parent acknowledgement, not just an ID", () => {
  const api = controller();
  const { window: browserWindow } = nativeWindow();
  assert.throws(() => new api.Controller(browserWindow), /capability/i);
});

test("implicit context comes from the admitted native global even when the window is waived", async () => {
  const f = nativeWindow();
  const waived = {};
  const api = controller(value => (value === waived ? f.window : value));
  const requestCapability = await api.prepare(waived);
  const instance = new api.Controller(waived, { requestCapability });
  assert.equal(instance.browsingContextId, receipt.browsingContextId);
  assert.equal(instance.innerWindowId, receipt.innerWindowId);
  assert.throws(
    () =>
      new api.Controller(waived, {
        requestCapability,
        browsingContextId: 8,
      }),
    /identity/i
  );
});

test("request observer registration retries after failure and stays idempotent after success", () => {
  let calls = 0;
  const failure = new Error("registration unavailable");
  const api = load(
    "controller",
    {
      Services: {
        appinfo: { processType: 0, PROCESS_TYPE_DEFAULT: 0 },
        obs: {
          addObserver() {
            if (++calls === 1) {
              throw failure;
            }
          },
        },
      },
    },
    "ensure: ensureUmbrafoxUserlandRequestObserver"
  );
  assert.throws(
    () => api.ensure(),
    error => error === failure
  );
  api.ensure();
  assert.equal(calls, 2);
  api.ensure();
  assert.equal(calls, 2);
});

test("parent grants only its own exact document and never revokes a grant", () => {
  const f = parentFixture();
  assert.equal(f.actor.hasRequestCapability, false);
  const granted = f.actor.receiveMessage({
    name: "GrantUserlandRequestCapability",
    data: receipt,
  });
  assert.deepEqual(plain(granted), receipt);
  assert.equal(f.actor.hasRequestCapability, true);
  assert.equal(f.ensured, 1);
  assert.deepEqual(
    plain(
      f.actor.receiveMessage({
        name: "GetDocumentUserlandScripts",
        data: { href: "https://fixture.invalid/" },
      })
    ),
    []
  );
  assert.equal(f.actor.hasRequestCapability, true);
  f.actor.receiveMessage({
    name: "GrantUserlandRequestCapability",
    data: receipt,
  });
  assert.equal(f.actor.hasRequestCapability, true);
});

test("parent script publication grants capability before returning code", () => {
  const f = parentFixture();
  const script = {
    enabled: true,
    scope: { origin: "https://fixture.invalid", targetKinds: ["document"] },
    code: "userland.on('request', () => {});",
  };
  f.setScripts([script]);
  assert.deepEqual(
    plain(
      f.actor.receiveMessage({
        name: "GetDocumentUserlandScripts",
        data: { href: "https://fixture.invalid/" },
      })
    ),
    [script]
  );
  assert.equal(f.actor.hasRequestCapability, true);
  f.setScripts([]);
  f.actor.receiveMessage({
    name: "GetDocumentUserlandScripts",
    data: { href: "https://fixture.invalid/" },
  });
  assert.equal(f.actor.hasRequestCapability, true);
});

test("wrong or malformed grant identities cannot mark a parent actor", () => {
  for (const data of [
    null,
    {},
    { ...receipt, innerWindowId: 102 },
    { ...receipt, browsingContextId: 8 },
    { ...receipt, innerWindowId: "101" },
    { ...receipt, innerWindowId: 0 },
    { ...receipt, innerWindowId: NaN },
  ]) {
    const f = parentFixture();
    assert.throws(
      () =>
        f.actor.receiveMessage({
          name: "GrantUserlandRequestCapability",
          data,
        }),
      /identity/i
    );
    assert.equal(f.actor.hasRequestCapability, false);
    assert.equal(f.ensured, 0);
  }
});

test("pending preparation is shared and cannot expose a native controller", async () => {
  const api = controller();
  const hold = deferred();
  const f = nativeWindow(() => hold.promise);
  const first = api.prepare(f.window);
  assert.equal(api.prepare(f.window), first);
  assert.throws(() => new api.Controller(f.window), /capability/i);
  await Promise.resolve();
  assert.deepEqual(f.calls, [
    { message: "GrantUserlandRequestCapability", data: receipt },
  ]);
  hold.resolve(receipt);
  const granted = await first;
  assert.equal(Object.isFrozen(granted), true);
  assert.deepEqual(plain(granted), receipt);
  const ready = new api.Controller(f.window);
  assert.equal(ready.innerWindowId, 101);
  assert.equal(ready.browsingContextId, 7);
  assert.equal(api.prepare(f.window), first);
  assert.equal(f.calls.length, 1);
  assert.throws(
    () => new api.Controller(f.window, { browsingContextId: 8 }),
    /identity/i
  );
  assert.throws(
    () =>
      new api.Controller(f.window, {
        requestCapability: { ...receipt, innerWindowId: 102 },
      }),
    /identity/i
  );
});

test("bad acknowledgements, actor loss and synchronous failure admit no controller", async () => {
  for (const reply of [
    null,
    {},
    { ...receipt, innerWindowId: 102 },
    { ...receipt, browsingContextId: 8 },
    { ...receipt, innerWindowId: "101" },
  ]) {
    const api = controller();
    const f = nativeWindow(async () => reply);
    await assert.rejects(api.prepare(f.window), /identity/i);
    assert.throws(() => new api.Controller(f.window), /capability/i);
  }
  for (const synchronous of [false, true]) {
    const api = controller();
    const failure = new Error("actor destroyed");
    let fail = true;
    const f = nativeWindow(() => {
      if (fail) {
        if (synchronous) {
          throw failure;
        }
        return Promise.reject(failure);
      }
      return Promise.resolve(receipt);
    });
    await assert.rejects(api.prepare(f.window), error => error === failure);
    assert.throws(() => new api.Controller(f.window), /capability/i);
    fail = false;
    await api.prepare(f.window);
    assert.equal(new api.Controller(f.window).innerWindowId, 101);
    assert.equal(f.calls.length, 2);
  }
});

test("a late grant for a navigated window does not admit its new document", async () => {
  const api = controller();
  const hold = deferred();
  const f = nativeWindow(() => hold.promise);
  const prepared = api.prepare(f.window);
  await Promise.resolve();
  const next = nativeWindow();
  next.global.innerWindowId = 102;
  f.window.windowGlobalChild = next.global;
  hold.resolve(receipt);
  await prepared;
  assert.throws(() => new api.Controller(f.window), /capability/i);
  assert.equal(
    new api.Controller({ ...f.window, windowGlobalChild: f.global })
      .innerWindowId,
    101
  );
});

test("old runtime preparation cannot execute in a newer already-admitted document", async () => {
  const api = controller();
  const hold = deferred();
  const f = nativeWindow(() => hold.promise);
  f.window.addEventListener = () => {};
  f.window.document = { readyState: "loading", blockParsing() {} };
  let ran = 0;
  const runtime = load(
    "runtime",
    {
      prepareUmbrafoxUserlandRequestCapability: api.prepare,
      UmbrafoxUserlandEventController: api.Controller,
      runUserlandScripts() {
        ran++;
        return Promise.resolve([]);
      },
    },
    "runProvidedDocumentStartUserlandScripts"
  );
  const result = runtime.runProvidedDocumentStartUserlandScripts(f.window, [
    { code: "old" },
  ]);
  await Promise.resolve();
  const next = nativeWindow(async () => ({ ...receipt, innerWindowId: 102 }));
  next.global.innerWindowId = 102;
  f.window.windowGlobalChild = next.global;
  await api.prepare(f.window);
  hold.resolve(receipt);
  await assert.rejects(result, /identity/i);
  assert.equal(ran, 0);
});

const runtimeEntries = [
  "runProvidedDocumentStartUserlandScripts",
  "runPromisedDocumentStartUserlandScripts",
  "runDocumentStartUserlandScripts",
];

function runtimeFixture({
  prepare = () => null,
  empty = false,
  complete = false,
  events = true,
} = {}) {
  const scripts = empty
    ? []
    : [
        {
          enabled: true,
          scope: {
            origin: "https://fixture.invalid",
            targetKinds: ["document"],
          },
        },
      ];
  const state = {
    prepared: 0,
    constructed: 0,
    ran: 0,
    blocked: null,
    errors: [],
  };
  const browserWindow = {
    location: { href: "https://fixture.invalid/" },
    ...(events ? { addEventListener() {} } : {}),
    console: { error: error => state.errors.push(error) },
    document: {
      readyState: complete ? "complete" : "loading",
      blockParsing(value) {
        state.blocked = value;
      },
    },
  };
  const runtime = load(
    "runtime",
    {
      Services: {
        appinfo: { processType: 0, PROCESS_TYPE_CONTENT: 1 },
        ppmm: { sharedData: { get: () => scripts } },
      },
      UMBRAFOX_USERLAND_SCRIPT_SHARED_DATA_KEY: "scripts",
      prepareUmbrafoxUserlandRequestCapability(value) {
        assert.equal(value, browserWindow);
        state.prepared++;
        return prepare();
      },
      UmbrafoxUserlandEventController: class {
        constructor(value) {
          assert.equal(value, browserWindow);
          state.constructed++;
        }
      },
      runUserlandScripts() {
        state.ran++;
        return Promise.resolve(["ran"]);
      },
    },
    runtimeEntries.join(",")
  );
  return {
    state,
    run(entry) {
      return runtime[entry](
        browserWindow,
        entry.includes("Promised") ? Promise.resolve(scripts) : scripts
      );
    },
  };
}

for (const entry of runtimeEntries) {
  for (const success of [true, false]) {
    test(
      `${entry} awaits grant ${success ? "success" : "failure"}`,
      { timeout: 1000 },
      async () => {
        const hold = deferred();
        const entered = deferred();
        const f = runtimeFixture({
          prepare() {
            entered.resolve();
            return hold.promise;
          },
        });
        const result = f.run(entry);
        assert.equal(result, f.state.blocked);
        await entered.promise;
        assert.equal(f.state.prepared, 1);
        assert.equal(f.state.constructed, 0);
        assert.equal(f.state.ran, 0);
        if (success) {
          hold.resolve(receipt);
          assert.deepEqual(await result, ["ran"]);
          assert.equal(f.state.constructed, 1);
          assert.equal(f.state.ran, 1);
        } else {
          const failure = new Error("actor lost");
          hold.reject(failure);
          await assert.rejects(result, error => error === failure);
          assert.equal(f.state.constructed, 0);
          assert.equal(f.state.ran, 0);
          assert.deepEqual(f.state.errors, [failure]);
        }
      }
    );
  }
  test(`${entry} empty execution requires no grant or controller`, async () => {
    const f = runtimeFixture({ empty: true });
    assert.deepEqual(plain(await f.run(entry)), []);
    assert.equal(f.state.prepared, 0);
    assert.equal(f.state.constructed, 0);
    assert.equal(f.state.ran, 0);
  });
  test(`${entry} explicit complete document still runs without parser blocking`, async () => {
    const f = runtimeFixture({
      complete: true,
      prepare: () => Promise.resolve(),
    });
    assert.deepEqual(await f.run(entry), ["ran"]);
    assert.equal(f.state.prepared, 1);
    assert.equal(f.state.blocked, null);
    assert.equal(f.state.ran, 1);
  });
}

test("non-native explicit runtime preserves immediate execution and parser promise", async () => {
  for (const entry of runtimeEntries.filter(
    value => !value.includes("Promised")
  )) {
    for (const events of [true, false]) {
      const f = runtimeFixture({ events });
      const result = f.run(entry);
      assert.equal(f.state.ran, 1);
      assert.equal(f.state.constructed, Number(events));
      assert.equal(f.state.blocked, result);
      await result;
    }
  }
});

test("missing native identity never sends a grant; non-native preparation is a no-op", async () => {
  const api = controller();
  assert.equal(api.prepare(null), null);
  assert.equal(api.prepare({}), null);
  for (const invalid of [0, -1, NaN, Infinity, "101", null, undefined]) {
    const f = nativeWindow();
    f.global.innerWindowId = invalid;
    await assert.rejects(api.prepare(f.window), /identity/i);
    assert.throws(() => new api.Controller(f.window), /capability/i);
    assert.equal(f.calls.length, 0);
  }
});

test("nonmatching, malformed and unknown parent messages do not grant capability", () => {
  for (const data of [
    null,
    {},
    { href: "not a URL" },
    { href: "about:blank" },
    { href: "https://other.invalid/" },
  ]) {
    const f = parentFixture();
    f.setScripts([
      {
        enabled: true,
        scope: { origin: "https://fixture.invalid", targetKinds: ["document"] },
      },
    ]);
    assert.deepEqual(
      plain(
        f.actor.receiveMessage({ name: "GetDocumentUserlandScripts", data })
      ),
      []
    );
    assert.equal(f.actor.hasRequestCapability, false);
    assert.equal(f.ensured, 0);
    assert.deepEqual(plain(f.actor.receiveMessage({ name: "unknown" })), []);
    assert.equal(f.actor.hasRequestCapability, false);
  }
});

test("destroyed or malformed parent manager cannot admit a grant", () => {
  for (const manager of [
    null,
    {},
    { innerWindowId: 0 },
    { innerWindowId: "101" },
  ]) {
    const f = parentFixture();
    f.actor.manager = manager;
    assert.throws(
      () =>
        f.actor.receiveMessage({
          name: "GrantUserlandRequestCapability",
          data: receipt,
        }),
      /identity/i
    );
    assert.equal(f.actor.hasRequestCapability, false);
  }
});

function registryFixture() {
  let hook = () => {};
  const data = new Map();
  const api = load(
    "registry",
    {
      structuredClone,
      ChromeUtils: { defineESModuleGetters() {} },
      Services: {
        prefs: {
          setBoolPref() {
            hook("pref");
          },
        },
        ppmm: {
          initialProcessData: {},
          sharedData: {
            set(key, value) {
              hook("set");
              data.set(key, value);
            },
            flush() {
              hook("flush");
            },
          },
        },
      },
    },
    `publish: publishUserlandScripts,
      presence: typeof hasPublishedDocumentUserlandScripts === "function"
        ? hasPublishedDocumentUserlandScripts : undefined`
  );
  return {
    ...api,
    data,
    setHook(value) {
      hook = value;
    },
  };
}

const documentScript = (documentOrigin = "https://fixture.invalid") => ({
  enabled: true,
  scope: { origin: documentOrigin, targetKinds: ["document"] },
});

test("registry presence is unknown until publication succeeds, then follows every publication", () => {
  const f = registryFixture();
  assert.equal(f.presence("https://fixture.invalid"), null);
  const script = documentScript();
  f.publish([script]);
  assert.equal(f.presence("https://fixture.invalid"), true);
  assert.equal(f.presence("https://other.invalid"), false);
  script.scope.origin = "https://changed.invalid";
  assert.equal(
    f.presence("https://fixture.invalid"),
    true,
    "Published snapshot is not caller-owned"
  );
  f.publish([
    { ...documentScript(), enabled: false },
    {
      ...documentScript(),
      scope: {
        origin: "https://fixture.invalid",
        targetKinds: ["dedicated_worker"],
      },
    },
  ]);
  assert.equal(f.presence("https://fixture.invalid"), false);
  f.publish([]);
  assert.equal(f.presence("https://other.invalid"), false);
});

test("failed publication invalidates negatives at clone, pref, set and flush boundaries", () => {
  for (const phase of ["clone", "pref", "set", "flush"]) {
    const f = registryFixture();
    f.publish([]);
    const failure = new Error(phase);
    f.setHook(at => {
      if (at === phase) {
        throw failure;
      }
    });
    assert.throws(() =>
      f.publish(phase === "clone" ? [() => {}] : [documentScript()])
    );
    assert.equal(f.presence("https://fixture.invalid"), null, phase);
    f.setHook(() => {});
    f.publish([]);
    assert.equal(f.presence("https://fixture.invalid"), false);
  }
});

test("nested publication cannot expose an intermediate negative", () => {
  const f = registryFixture();
  let nested = false;
  const during = [];
  f.setHook(phase => {
    during.push(f.presence("https://fixture.invalid"));
    if (phase === "pref" && !nested) {
      nested = true;
      f.publish([]);
      during.push(f.presence("https://fixture.invalid"));
    }
  });
  f.publish([documentScript()]);
  assert.ok(during.length >= 7);
  assert.ok(during.every(value => value === null));
  assert.equal(f.presence("https://fixture.invalid"), null);
});

test("nested publication cannot certify a different shared-data snapshot", () => {
  for (const phase of ["flush", "pref", "set"]) {
    for (const outerThrows of [false, true]) {
      const f = registryFixture();
      let nested = false;
      f.setHook(at => {
        if (at === phase && !nested) {
          nested = true;
          f.publish([documentScript()]);
          if (outerThrows) {
            throw new Error("outer publication failed");
          }
        }
      });
      if (outerThrows) {
        assert.throws(() => f.publish([]), /outer publication failed/);
      } else {
        f.publish([]);
      }
      if (phase === "flush") {
        assert.equal(
          [...f.data.values()][0][0].scope.origin,
          "https://fixture.invalid"
        );
      }
      assert.equal(f.presence("https://fixture.invalid"), null, phase);
      f.setHook(() => {});
      f.publish([]);
      assert.equal(f.presence("https://fixture.invalid"), false);
    }
  }
});

test("unindexable enabled document records retain unknown instead of a false negative", () => {
  const f = registryFixture();
  for (const scope of [
    { origin: ["https://fixture.invalid"], targetKinds: ["document"] },
    { origin: "https://fixture.invalid", targetKinds: "document" },
    { origin: null, targetKinds: ["document"] },
  ]) {
    f.publish([{ enabled: true, scope }]);
    assert.equal(f.presence("https://fixture.invalid"), null);
  }
});

test("a recreated parent actor retains the native document grant", () => {
  const f = parentFixture();
  f.actor.receiveMessage({
    name: "GrantUserlandRequestCapability",
    data: receipt,
  });
  const recreated = new f.actor.constructor();
  recreated.manager = f.actor.manager;
  recreated.browsingContext = f.actor.browsingContext;
  assert.equal(recreated.hasRequestCapability, true);
  const other = new f.actor.constructor();
  other.manager = { ...f.actor.manager, innerWindowId: 102 };
  other.browsingContext = f.actor.browsingContext;
  assert.equal(other.hasRequestCapability, false);
});

test("only a current exact document with published nonmatching scope may skip", () => {
  const registry = registryFixture();
  const f = parentFixture(documentOrigin => registry.presence(documentOrigin));
  assert.equal(f.actor.canSkipRequest(7, 101), false);
  registry.publish([]);
  assert.equal(f.actor.canSkipRequest(7, 101), true);
  for (const pair of [
    [7, 0],
    [0, 101],
    [7, 102],
    [8, 101],
    [7, "101"],
    [7, NaN],
  ]) {
    assert.equal(f.actor.canSkipRequest(...pair), false);
  }
  for (const state of [false, null, undefined, "true", 1]) {
    f.actor.manager.isCurrentGlobal = state;
    assert.equal(f.actor.canSkipRequest(7, 101), false);
  }
  f.actor.manager.isCurrentGlobal = true;
  registry.publish([documentScript()]);
  assert.equal(f.actor.canSkipRequest(7, 101), false);
  registry.publish([documentScript("https://other.invalid")]);
  assert.equal(f.actor.canSkipRequest(7, 101), true);
  f.actor.receiveMessage({
    name: "GrantUserlandRequestCapability",
    data: receipt,
  });
  registry.publish([]);
  assert.equal(f.actor.canSkipRequest(7, 101), false);
});

test("scope follows native document origin, including credentials and URI changes", () => {
  let queried = [];
  const f = parentFixture(documentOrigin => {
    queried.push(documentOrigin);
    return documentOrigin === "https://fixture.invalid";
  });
  f.actor.manager.documentURI.spec = "https://user:pass@fixture.invalid/path";
  assert.equal(f.actor.canSkipRequest(7, 101), false);
  assert.deepEqual(queried, ["https://fixture.invalid"]);
  f.actor.manager.documentURI.spec = "https://other.invalid/path";
  assert.equal(f.actor.canSkipRequest(7, 101), true);
  queried = [];
  for (const spec of [
    "about:blank",
    "file:///tmp/local",
    "data:text/html,",
    "bad URL",
  ]) {
    f.actor.manager.documentURI.spec = spec;
    assert.equal(f.actor.canSkipRequest(7, 101), false);
  }
  assert.deepEqual(queried, []);
});
