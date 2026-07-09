/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { UmbrafoxUserlandScriptRuntime } from "resource://gre/modules/UmbrafoxUserlandScriptRuntime.sys.mjs";
import {
  UMBRAFOX_USERLAND_SCRIPT_SHARED_DATA_KEY,
  UMBRAFOX_USERLAND_SCRIPTS_ACTIVE_PREF,
} from "resource://gre/modules/UmbrafoxUserlandScriptRegistry.sys.mjs";

function hasUserlandScriptsActive() {
  const scripts = Services.cpmm.sharedData.get(
    UMBRAFOX_USERLAND_SCRIPT_SHARED_DATA_KEY
  );
  if (Array.isArray(scripts) && scripts.some(script => script?.enabled)) {
    return true;
  }
  if (
    Services.prefs.getPrefType(UMBRAFOX_USERLAND_SCRIPTS_ACTIVE_PREF) ==
    Services.prefs.PREF_BOOL
  ) {
    return Services.prefs.getBoolPref(UMBRAFOX_USERLAND_SCRIPTS_ACTIVE_PREF);
  }
  return !!Services.cpmm.initialProcessData?.umbrafoxUserlandScriptsActive;
}

export class UmbrafoxUserlandChild extends JSWindowActorChild {
  handleEvent(event) {
    if (event.type != "DOMDocElementInserted") {
      return;
    }
    if (!hasUserlandScriptsActive()) {
      return;
    }

    const window = this.contentWindow;
    const scriptsPromise = this.sendQuery("GetDocumentUserlandScripts", {
      href: window.location.href,
    });
    UmbrafoxUserlandScriptRuntime.runPromisedDocumentStartUserlandScripts(
      window,
      scriptsPromise,
      {
        contextWindow: Cu.waiveXrays(window),
        sandboxPrototype: window,
      }
    ).catch(error => console.error(error));
  }
}
