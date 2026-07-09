/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { UMBRAFOX_USERLAND_SCRIPT_SHARED_DATA_KEY } from "resource://gre/modules/UmbrafoxUserlandScriptRegistry.sys.mjs";

function getOrigin(href) {
  try {
    const url = new URL(href);
    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

export class UmbrafoxUserlandParent extends JSWindowActorParent {
  receiveMessage(message) {
    if (message.name != "GetDocumentUserlandScripts") {
      return [];
    }

    const origin = getOrigin(message.data?.href);
    if (!origin) {
      return [];
    }

    const scripts =
      Services.ppmm.sharedData.get(UMBRAFOX_USERLAND_SCRIPT_SHARED_DATA_KEY) ??
      [];
    return scripts.filter(script => {
      return (
        script?.enabled &&
        script.scope?.origin == origin &&
        script.scope?.targetKinds?.includes("document")
      );
    });
  }
}
