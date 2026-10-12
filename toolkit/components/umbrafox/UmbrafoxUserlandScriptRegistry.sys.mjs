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

let documentScriptOrigins = null;
let publicationDepth = 0;
let currentPublication = null;

function cloneScripts(scripts) {
  if (!Array.isArray(scripts)) {
    return [];
  }
  return structuredClone(scripts);
}

function indexDocumentScripts(scripts) {
  const origins = new Set();
  for (const script of scripts) {
    if (!script?.enabled || script.scope?.targetKinds == null) {
      continue;
    }
    if (!Array.isArray(script.scope.targetKinds)) {
      return null;
    }
    if (!script.scope.targetKinds.includes("document")) {
      continue;
    }
    if (typeof script.scope.origin != "string") {
      return null;
    }
    origins.add(script.scope.origin);
  }
  return origins;
}

export function hasPublishedDocumentUserlandScripts(origin) {
  // Null is unknown, including an incomplete or unindexable publication.
  return publicationDepth ? null : (documentScriptOrigins?.has(origin) ?? null);
}

export function publishUserlandScripts(scripts) {
  const publication = {};
  currentPublication = publication;
  publicationDepth++;
  documentScriptOrigins = null;
  try {
    const clonedScripts = cloneScripts(scripts);
    const origins = indexDocumentScripts(clonedScripts);
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
    documentScriptOrigins = currentPublication === publication ? origins : null;
  } catch (error) {
    documentScriptOrigins = null;
    throw error;
  } finally {
    publicationDepth--;
  }
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
