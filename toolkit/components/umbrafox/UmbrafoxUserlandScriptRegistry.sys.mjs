/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const lazy = {};

ChromeUtils.defineESModuleGetters(lazy, {
  UmbrafoxUserlandScriptStore:
    "resource://gre/modules/UmbrafoxUserlandScriptStore.sys.mjs",
});

export const UMBRAFOX_USERLAND_SCRIPT_SHARED_DATA_KEY =
  "umbrafox/userland-scripts";
export const UMBRAFOX_USERLAND_SCRIPTS_ACTIVE_PREF =
  "umbrafox.userlandScripts.active";

function cloneScripts(scripts) {
  if (!Array.isArray(scripts)) {
    return [];
  }
  return structuredClone(scripts);
}

export function publishUserlandScripts(scripts) {
  const clonedScripts = cloneScripts(scripts);
  const hasEnabledScripts = clonedScripts.some(script => script?.enabled);
  Services.prefs.setBoolPref(
    UMBRAFOX_USERLAND_SCRIPTS_ACTIVE_PREF,
    hasEnabledScripts
  );
  Services.ppmm.initialProcessData.umbrafoxUserlandScriptsActive =
    hasEnabledScripts;
  Services.ppmm.sharedData.set(
    UMBRAFOX_USERLAND_SCRIPT_SHARED_DATA_KEY,
    clonedScripts
  );
  Services.ppmm.sharedData.flush();
}

export async function loadAndPublishUserlandScripts() {
  const store = new lazy.UmbrafoxUserlandScriptStore();
  await store.load();
  publishUserlandScripts(store.listScripts());
}

export const UmbrafoxUserlandScriptRegistry = {
  loadAndPublishUserlandScripts,
  publishUserlandScripts,
};
