/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(
  new URL(
    "../../../../toolkit/components/umbrafox/UmbrafoxUserlandEventController.sys.mjs",
    import.meta.url
  ),
  "utf8"
);
const types = ["navigation", "script", "request", "mutation"];

function fixture() {
  const references = [];
  const registries = [];
  const observers = new Map();
  /** Explicit collection avoids relying on nondeterministic GC scheduling. */
  class TestWeakRef {
    constructor(target) {
      this.target = target;
      references.push(this);
    }
    deref() {
      return this.target;
    }
  }
  /** Delays cleanup callbacks to exercise replacement races. */
  class TestFinalizationRegistry {
    constructor(callback) {
      this.callback = callback;
      this.registrations = new Map();
      this.pending = [];
      registries.push(this);
    }
    register(target, held, token) {
      assert.notEqual(target, held);
      assert.notEqual(target, token);
      this.registrations.set(token, { target, held });
    }
    unregister(token) {
      return this.registrations.delete(token);
    }
    flush() {
      while (this.pending.length) {
        this.callback(this.pending.shift());
      }
    }
  }
  const scope = vm.createContext({
    URL,
    WeakRef: TestWeakRef,
    FinalizationRegistry: TestFinalizationRegistry,
    Services: {
      appinfo: { processType: 0, PROCESS_TYPE_DEFAULT: 0 },
      obs: {
        addObserver(observer, topic) {
          assert(!observers.has(topic));
          observers.set(topic, observer);
        },
      },
    },
    Cu: {
      unwaiveXrays: value => value,
      exportFunction(callback, target, { defineAs }) {
        target[defineAs] = callback;
      },
    },
    Ci: { nsIWritablePropertyBag2: {} },
  });
  vm.runInContext(source.replace(/^export (?=function |class )/gm, ""), scope, {
    timeout: 1000,
  });
  const api = vm.runInContext(
    `({
      Controller: UmbrafoxUserlandEventController,
      request: dispatchUmbrafoxUserlandRequest,
      prepare: prepareUmbrafoxUserlandRequestCapability,
      maps: [nativeNavigationControllers, nativeScriptControllers,
             nativeRequestControllers, nativeMutationControllers]
    })`,
    scope,
    { timeout: 1000 }
  );
  return {
    ...api,
    registries,
    references,
    observers,
    controller(id = 1) {
      return new api.Controller(
        { location: new URL("https://fixture.invalid/"), open() {} },
        { browsingContextId: id }
      );
    },
    collect(controller) {
      for (const reference of references) {
        if (reference.target === controller) {
          reference.target = undefined;
        }
      }
      for (const registry of registries) {
        for (const [token, registration] of registry.registrations) {
          if (registration.target === controller) {
            registry.pending.push(registration.held);
            registry.registrations.delete(token);
          }
        }
      }
    },
    flush() {
      for (const registry of registries) {
        registry.flush();
      }
    },
  };
}

test("no hooks means no controller entries or finalizer allocation", () => {
  const f = fixture();
  f.controller();
  assert.deepEqual(
    Array.from(f.maps, map => map.size),
    [0, 0, 0, 0]
  );
  assert.equal(f.registries.length, 0);
  assert.equal(f.observers.size, 0);
});

test("a controller without a browsing context does not register native hooks", () => {
  const f = fixture();
  const controller = f.controller(0);
  for (const type of types) {
    controller.addEventListener(type, () => {});
  }
  assert.deepEqual(
    Array.from(f.maps, map => map.size),
    [0, 0, 0, 0]
  );
  assert.equal(f.registries.length, 0);
  assert.equal(f.observers.size, 0);
});

for (const [index, type] of types.entries()) {
  test(`${type}: finalization removes entries without another lookup`, () => {
    const f = fixture();
    const controller = f.controller();
    controller.addEventListener(type, () => {});
    assert.equal(f.maps[index].get(1).deref(), controller);
    f.collect(controller);
    f.flush();
    assert.equal(f.maps[index].size, 0);
    assert.equal(f.observers.size, 1);
  });

  test(`${type}: old cleanup cannot remove a replacement controller`, () => {
    const f = fixture();
    const old = f.controller();
    old.addEventListener(type, () => {});
    f.collect(old);
    const replacement = f.controller();
    replacement.addEventListener(type, () => {});
    f.flush();
    assert.equal(f.maps[index].get(1).deref(), replacement);
    f.collect(replacement);
    f.flush();
    assert.equal(f.maps[index].size, 0);
  });

  test(`${type}: replacement and repeated registration stay bounded`, () => {
    const f = fixture();
    const old = f.controller();
    old.addEventListener(type, () => {});
    const replacement = f.controller();
    for (let iteration = 0; iteration < 100; iteration++) {
      replacement.addEventListener(type, () => {});
    }
    assert.equal(f.registries.length, 1);
    assert.equal(f.registries[0].registrations.size, 1);
    assert.equal(f.references.length, 2);
    f.collect(old);
    f.flush();
    assert.equal(f.maps[index].get(1).deref(), replacement);
  });
}

test("one controller's cleanup covers all four maps without changing live ones", () => {
  const f = fixture();
  const retired = f.controller(1);
  const live = f.controller(2);
  for (const type of types) {
    retired.addEventListener(type, () => {});
    live.addEventListener(type, () => {});
  }
  f.collect(retired);
  f.flush();
  assert.deepEqual(
    Array.from(f.maps, map => map.size),
    [1, 1, 1, 1]
  );
  for (const map of f.maps) {
    assert.equal(map.get(2).deref(), live);
  }
  assert.equal(f.registries[0].registrations.size, 4);
});

test("lookup cleanup works before finalizers, which tolerate already removed keys", () => {
  const f = fixture();
  const controller = f.controller();
  controller.addEventListener("request", () => {});
  f.collect(controller);
  assert.equal(f.request(null, { browsingContextId: 1 }), null);
  assert.equal(f.maps[2].size, 0);
  f.flush();
  assert.equal(f.maps[2].size, 0);
});

test("live capabilities survive off/on and null decisions still run handlers", () => {
  const f = fixture();
  const controller = f.controller();
  const fields = { browsingContextId: 1 };
  let calls = 0;
  const handler = () => calls++;
  const unsubscribe = controller.addEventListener("request", handler);
  assert.equal(f.request(null, fields), null);
  assert.equal(calls, 1);
  unsubscribe();
  f.flush();
  assert.equal(f.request(null, fields), null);
  assert.equal(calls, 1);
  controller.addEventListener("request", handler);
  assert.equal(f.request(null, fields), null);
  assert.equal(calls, 2);
  assert.equal(f.maps[2].get(1).deref(), controller);
});

test("document-scoped request finalizers do not remove other documents or replacements", async () => {
  const f = fixture();
  const firstWindow = {
    browsingContext: { id: 1 },
    windowGlobalChild: { innerWindowId: 101 },
  };
  const secondWindow = {
    browsingContext: { id: 1 },
    windowGlobalChild: { innerWindowId: 102 },
  };
  for (const nativeWindow of [firstWindow, secondWindow]) {
    nativeWindow.windowGlobalChild.browsingContext = { id: 1 };
    nativeWindow.windowGlobalChild.getActor = () => ({
      sendQuery: async (messageName, data) => ({ ...data }),
    });
    await f.prepare(nativeWindow);
  }
  const first = new f.Controller(firstWindow);
  const second = new f.Controller(secondWindow);
  const replacement = new f.Controller(firstWindow);
  first.addEventListener("request", () => {});
  second.addEventListener("request", () => {});
  assert.equal(f.maps[2].size, 2);
  f.collect(first);
  replacement.addEventListener("request", () => {});
  f.flush();
  assert.equal(f.maps[2].get("1:101").deref(), replacement);
  assert.equal(f.maps[2].get("1:102").deref(), second);
  f.collect(replacement);
  f.flush();
  assert.equal(f.maps[2].size, 1);
  assert.equal(f.maps[2].get("1:102").deref(), second);
  f.collect(second);
  f.request(secondWindow, { browsingContextId: 1, innerWindowId: 102 });
  f.flush();
  assert.equal(f.maps[2].size, 0);
});
