/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  UMBRAFOX_USERLAND_SCRIPT_SHARED_DATA_KEY,
  hasPublishedDocumentUserlandScripts,
} from "resource://gre/modules/UmbrafoxUserlandScriptRegistry.sys.mjs";
import { ensureUmbrafoxUserlandRequestObserver } from "resource://gre/modules/UmbrafoxUserlandEventController.sys.mjs";

const requestCapableGlobals = new WeakSet();

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
  #requestDocumentURI = null;
  #requestOrigin = null;

  get hasRequestCapability() {
    return requestCapableGlobals.has(this.manager);
  }

  #grantRequestCapability() {
    requestCapableGlobals.add(this.manager);
    ensureUmbrafoxUserlandRequestObserver();
  }

  canSkipRequest(browsingContextId, innerWindowId) {
    const global = this.manager;
    if (
      global?.isCurrentGlobal !== true ||
      !Number.isSafeInteger(browsingContextId) ||
      browsingContextId <= 0 ||
      !Number.isSafeInteger(innerWindowId) ||
      innerWindowId <= 0 ||
      browsingContextId !== this.browsingContext.id ||
      innerWindowId !== global.innerWindowId ||
      requestCapableGlobals.has(global)
    ) {
      return false;
    }
    const uri = global.documentURI?.spec;
    if (uri !== this.#requestDocumentURI) {
      this.#requestDocumentURI = uri;
      this.#requestOrigin = getOrigin(uri);
    }
    return (
      this.#requestOrigin !== null &&
      hasPublishedDocumentUserlandScripts(this.#requestOrigin) === false
    );
  }

  receiveMessage(message) {
    if (message.name == "GrantUserlandRequestCapability") {
      const identity = {
        browsingContextId: this.browsingContext?.id,
        innerWindowId: this.manager?.innerWindowId,
      };
      if (
        !Number.isSafeInteger(identity.browsingContextId) ||
        identity.browsingContextId <= 0 ||
        !Number.isSafeInteger(identity.innerWindowId) ||
        identity.innerWindowId <= 0 ||
        message.data?.browsingContextId !== identity.browsingContextId ||
        message.data?.innerWindowId !== identity.innerWindowId
      ) {
        throw new Error("Invalid userland request capability identity");
      }
      this.#grantRequestCapability();
      return identity;
    }
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
    const matchingScripts = scripts.filter(script => {
      return (
        script?.enabled &&
        script.scope?.origin == origin &&
        script.scope?.targetKinds?.includes("document")
      );
    });
    if (matchingScripts.length) {
      this.#grantRequestCapability();
    }
    return matchingScripts;
  }
}
