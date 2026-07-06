/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import {
  getDefaultUserlandScriptName,
  getUserlandScriptScopeForTreeItem,
} from "resource://gre/modules/UmbrafoxUserlandScriptScope.sys.mjs";

export { getDefaultUserlandScriptName, getUserlandScriptScopeForTreeItem };

const lazy = {};

ChromeUtils.defineESModuleGetters(lazy, {
  UmbrafoxUserlandScriptStore:
    "resource://gre/modules/UmbrafoxUserlandScriptStore.sys.mjs",
});

let storePromise;
const storeListeners = new Set();

async function getStore() {
  if (!storePromise) {
    const store = new lazy.UmbrafoxUserlandScriptStore();
    storePromise = store.load().then(() => store);
  }
  return storePromise;
}

function notifyStoreListeners(script) {
  for (const listener of storeListeners) {
    listener(script);
  }
}

export function addUserlandScriptStoreListener(listener) {
  storeListeners.add(listener);
  return () => storeListeners.delete(listener);
}

export async function listUserlandScripts() {
  const store = await getStore();
  return store.listScripts();
}

export async function createDisabledUserlandScriptForTreeItem(item, name) {
  const scope = getUserlandScriptScopeForTreeItem(item);
  if (!scope) {
    throw new Error(
      "Cannot create a userland script without an HTTP(S) origin"
    );
  }

  const store = await getStore();
  const script = store.createScript({
    name: name || getDefaultUserlandScriptName(item),
    enabled: false,
    scope,
  });
  notifyStoreListeners(script);
  return script;
}

export async function setUserlandScriptEnabled(id, enabled) {
  const store = await getStore();
  const script = store.setScriptEnabled(id, enabled);
  notifyStoreListeners(script);
  return script;
}

export async function promptAndCreateUserlandScriptForTreeItem(item) {
  const input = {
    value: getDefaultUserlandScriptName(item),
  };
  const accepted = Services.prompt.prompt(
    window,
    L10N.getStr("userlandScripts.newScriptDialog.title"),
    L10N.getStr("userlandScripts.newScriptDialog.message"),
    input,
    null,
    {}
  );
  if (!accepted) {
    return null;
  }

  return createDisabledUserlandScriptForTreeItem(item, input.value.trim());
}
