/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { setImmediate } from "node:timers/promises";
import vm from "node:vm";

const source = await readFile(
  new URL(
    "../../../../browser/components/customkeys/CustomKeys.sys.mjs",
    import.meta.url
  ),
  "utf8"
);
const defaults = {
  key_openDownloads: { key: "Y", modifiers: "accel,shift" },
  key_search2: { key: "J", modifiers: "accel" },
  key_privatebrowsing: { key: "P", modifiers: "accel,shift", reserved: "true" },
  key_undoCloseWindow: { key: "N", modifiers: "accel,shift" },
  key_selectLastTab: { key: "9", modifiers: "alt" },
  key_gotoHistory: { key: "H", modifiers: "accel" },
};
for (let i = 1; i <= 8; i++) {
  defaults[`key_selectTab${i}`] = { key: String(i), modifiers: "alt" };
}
const plain = value => JSON.parse(JSON.stringify(value));

async function fixture({ platform = "linux", saved = {}, loadError } = {}) {
  const store = { data: plain(saved), saves: 0 };
  const scope = vm.createContext({
    AppConstants: { platform },
    PathUtils: { profileDir: "/test", join: (...parts) => parts.join("/") },
    JSONFile: class {
      constructor() {
        return Object.assign(store, {
          async load() {
            if (loadError) {
              throw loadError;
            }
          },
          saveSoon() {
            this.saves++;
          },
        });
      }
    },
  });
  vm.runInContext(
    source
      .replace(/^import .*;\n/gm, "")
      .replace("export const CustomKeys", "const CustomKeys"),
    scope,
    { timeout: 1000 }
  );
  const api = vm.runInContext("CustomKeys", scope);
  function newWindow() {
    const keys = new Map();
    const keyset = { parentElement: { append() {} }, remove() {} };
    for (const [id, data] of Object.entries(defaults)) {
      const attrs = { "data-l10n-id": `test-${id}`, command: id, ...data };
      keys.set(id, {
        id,
        tagName: "key",
        parentElement: keyset,
        getAttribute: attr => attrs[attr] ?? "",
        hasAttribute: attr => Object.hasOwn(attrs, attr),
        setAttribute: (attr, value) => (attrs[attr] = value),
        removeAttribute: attr => delete attrs[attr],
      });
    }
    const browserWindow = {
      document: {
        body: {},
        getElementById: id => keys.get(id),
        querySelectorAll: () => keys.values(),
      },
      MutationObserver: class {
        observe() {}
        disconnect() {}
      },
    };
    return { window: browserWindow, keys };
  }
  const current = newWindow();
  if (!loadError) {
    api.initWindow(current.window);
    await setImmediate();
  }
  return { api, store, ...current, newWindow };
}

test("default initialization leaves Firefox bindings and reservations unchanged", async () => {
  const f = await fixture();
  assert.deepEqual(f.store.data, {});
  assert.equal(f.store.saves, 0);
  for (const [id, data] of Object.entries(defaults)) {
    for (const [attr, value] of Object.entries(data)) {
      assert.equal(f.keys.get(id).getAttribute(attr), value);
    }
  }
});

test("Linux preset is a single persistent batch with exact collision-free mappings", async () => {
  const f = await fixture();
  assert.deepEqual(plain(await f.api.applyChromePreset(f.window)), {
    applied: true,
  });
  assert.equal(f.store.saves, 1);
  assert.equal(Object.keys(f.store.data).length, 13);
  assert.deepEqual(plain(f.store.data.key_openDownloads), {
    key: "J",
    modifiers: "accel",
  });
  assert.deepEqual(plain(f.store.data.key_search2), {
    key: "E",
    modifiers: "accel",
  });
  assert.deepEqual(plain(f.store.data.key_privatebrowsing), {
    key: "N",
    modifiers: "accel,shift",
  });
  assert.deepEqual(plain(f.store.data.key_undoCloseWindow), {});
  assert.equal(
    f.keys.get("key_privatebrowsing").getAttribute("reserved"),
    "true"
  );
  const chords = new Set();
  for (const data of Object.values(f.store.data)) {
    if (data.key) {
      const chord = `${data.modifiers}:${data.key}`;
      assert(!chords.has(chord));
      chords.add(chord);
    }
  }
  for (let i = 1; i <= 9; i++) {
    const id = i == 9 ? "key_selectLastTab" : `key_selectTab${i}`;
    assert.deepEqual(plain(f.store.data[id]), {
      key: String(i),
      modifiers: "accel",
    });
  }
});

test("reapplication, new windows, reloaded configuration and reset", async () => {
  const f = await fixture();
  await f.api.applyChromePreset(f.window);
  const first = plain(f.store.data);
  await f.api.applyChromePreset(f.window);
  assert.deepEqual(plain(f.store.data), first);
  const other = f.newWindow();
  f.api.initWindow(other.window);
  await setImmediate();
  assert.equal(other.keys.get("key_openDownloads").getAttribute("key"), "J");
  const reloaded = await fixture({ saved: first });
  assert.equal(reloaded.keys.get("key_search2").getAttribute("key"), "E");
  f.api.resetAll();
  for (const target of [f, other]) {
    for (const [id, data] of Object.entries(defaults)) {
      for (const [attr, value] of Object.entries(data)) {
        assert.equal(target.keys.get(id).getAttribute(attr), value);
      }
    }
  }
  assert.deepEqual(plain(f.store.data), {});
});

test("unrelated customizations survive, targeted customizations are replaced", async () => {
  const f = await fixture({
    saved: {
      key_gotoHistory: { key: "H", modifiers: "accel,shift" },
      key_openDownloads: { key: "D", modifiers: "accel,shift" },
    },
  });
  await f.api.applyChromePreset(f.window);
  assert.deepEqual(plain(f.store.data.key_gotoHistory), {
    key: "H",
    modifiers: "accel,shift",
  });
  f.api.resetKey("key_openDownloads");
  assert.equal(f.keys.get("key_openDownloads").getAttribute("key"), "Y");
});

for (const binding of [
  { key: "J", modifiers: "accel" },
  { key: "n", modifiers: "shift control" },
  { keycode: "VK_1", modifiers: "control" },
  { key: "E", modifiers: "any" },
]) {
  test(`unrelated collision rejects entire batch: ${JSON.stringify(binding)}`, async () => {
    const f = await fixture({ saved: { key_gotoHistory: binding } });
    const before = plain(f.store.data);
    const result = await f.api.applyChromePreset(f.window);
    assert.equal(result.applied, false);
    assert.equal(result.reason, "conflict");
    assert.equal(result.keyID, "key_gotoHistory");
    assert.deepEqual(plain(f.store.data), before);
    assert.equal(f.store.saves, 0);
    assert.equal(f.keys.get("key_openDownloads").getAttribute("key"), "Y");
  });
}

test("dormant saved binding conflicts are not silently ignored", async () => {
  const f = await fixture({
    saved: { lateKey: { key: "J", modifiers: "accel" } },
  });
  assert.equal((await f.api.applyChromePreset(f.window)).keyID, "lateKey");
  assert.equal(f.store.saves, 0);
});

for (const platform of ["win", "macosx"]) {
  test(`${platform} rejects Linux preset without mutations`, async () => {
    const f = await fixture({ platform });
    assert.deepEqual(plain(await f.api.applyChromePreset(f.window)), {
      applied: false,
      reason: "unsupported",
    });
    assert.equal(f.store.saves, 0);
    assert.deepEqual(f.store.data, {});
  });
}

test("missing or protected target rejects without partial assignment", async () => {
  for (const protect of [false, true]) {
    const f = await fixture();
    if (protect) {
      f.keys.get("key_selectTab8").setAttribute("internal", "true");
    } else {
      f.keys.delete("key_selectTab8");
    }
    assert.equal((await f.api.applyChromePreset(f.window)).applied, false);
    assert.equal(f.store.saves, 0);
    assert.deepEqual(f.store.data, {});
  }
});

test("configuration read failure propagates without writes", async () => {
  const error = new Error("load failed");
  const f = await fixture({ loadError: error });
  await assert.rejects(f.api.applyChromePreset(f.window), error);
  assert.equal(f.store.saves, 0);
});
