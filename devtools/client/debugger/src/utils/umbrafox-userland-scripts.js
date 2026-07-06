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

async function getStore() {
  if (!storePromise) {
    const store = new lazy.UmbrafoxUserlandScriptStore();
    storePromise = store.load().then(() => store);
  }
  return storePromise;
}

export async function createDisabledUserlandScriptForTreeItem(item, name) {
  const scope = getUserlandScriptScopeForTreeItem(item);
  if (!scope) {
    throw new Error(
      "Cannot create a userland script without an HTTP(S) origin"
    );
  }

  const store = await getStore();
  return store.createScript({
    name: name || getDefaultUserlandScriptName(item),
    enabled: false,
    scope,
  });
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
