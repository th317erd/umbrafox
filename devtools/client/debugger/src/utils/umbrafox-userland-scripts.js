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
const selectedScriptListeners = new Set();
let selectedUserlandScript = null;

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

function notifySelectedScriptListeners() {
  for (const listener of selectedScriptListeners) {
    listener(selectedUserlandScript);
  }
}

export function addUserlandScriptStoreListener(listener) {
  storeListeners.add(listener);
  return () => storeListeners.delete(listener);
}

export function addSelectedUserlandScriptListener(listener) {
  selectedScriptListeners.add(listener);
  return () => selectedScriptListeners.delete(listener);
}

export async function listUserlandScripts() {
  const store = await getStore();
  return store.listScripts();
}

export function getSelectedUserlandScript() {
  return selectedUserlandScript;
}

export function selectUserlandScript(script) {
  selectedUserlandScript = script;
  notifySelectedScriptListeners();
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
  if (selectedUserlandScript?.id == script.id) {
    selectUserlandScript(script);
  }
  return script;
}

export async function updateUserlandScriptCode(id, code) {
  const store = await getStore();
  const script = store.updateScript(id, { code });
  notifyStoreListeners(script);
  if (selectedUserlandScript?.id == script.id) {
    selectedUserlandScript = script;
  }
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
