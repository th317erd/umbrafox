/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { runUserlandScripts } from "resource://gre/modules/UmbrafoxUserlandScriptRunner.sys.mjs";
import { UMBRAFOX_USERLAND_SCRIPT_SHARED_DATA_KEY } from "resource://gre/modules/UmbrafoxUserlandScriptRegistry.sys.mjs";
import { UmbrafoxUserlandEventController } from "resource://gre/modules/UmbrafoxUserlandEventController.sys.mjs";

function getSharedData() {
  if (
    Services.appinfo.processType == Services.appinfo.PROCESS_TYPE_CONTENT &&
    Services.cpmm?.sharedData
  ) {
    return Services.cpmm.sharedData;
  }
  return Services.ppmm?.sharedData ?? Services.cpmm?.sharedData;
}

function getPublishedScripts() {
  return getSharedData()?.get(UMBRAFOX_USERLAND_SCRIPT_SHARED_DATA_KEY) ?? [];
}

function getWindowOrigin(window) {
  try {
    const href = window?.location?.href;
    if (!href) {
      return null;
    }

    const url = new URL(href);
    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function getBrowsingContextId(window) {
  return (
    window?.docShell?.browsingContext?.id ??
    window?.browsingContext?.id ??
    window?.windowGlobalChild?.browsingContext?.id ??
    null
  );
}

export function getMatchingDocumentUserlandScripts(window) {
  const origin = getWindowOrigin(window);
  if (!origin) {
    return [];
  }

  return getPublishedScripts().filter(script => {
    return (
      script?.enabled &&
      script.scope?.origin == origin &&
      script.scope?.targetKinds?.includes("document")
    );
  });
}

function runDocumentUserlandScripts(
  window,
  scripts,
  { contextWindow = window, sandboxPrototype = window } = {}
) {
  if (!scripts.length) {
    return Promise.resolve([]);
  }

  const document = contextWindow.document;
  const userland =
    typeof contextWindow.addEventListener == "function"
      ? new UmbrafoxUserlandEventController(contextWindow, {
          browsingContextId: getBrowsingContextId(window),
        })
      : undefined;
  return runUserlandScripts(
    scripts,
    {
      window: contextWindow,
      document,
      globalThis: contextWindow,
      location: contextWindow.location,
      navigator: contextWindow.navigator,
      console: contextWindow.console,
      ...(userland ? { userland } : {}),
    },
    { sandboxPrototype }
  );
}

function blockDocumentParser(window, promise) {
  const document = window.document;
  if (document?.readyState !== "complete") {
    document.blockParsing(
      Promise.resolve(promise).catch(error => {
        window.console?.error?.(error);
      }),
      { blockScriptCreated: false }
    );
  }
}

export function runProvidedDocumentStartUserlandScripts(
  window,
  scripts,
  options = {}
) {
  const promise = runDocumentUserlandScripts(window, scripts, options);
  blockDocumentParser(window, promise);
  return promise;
}

export function runPromisedDocumentStartUserlandScripts(
  window,
  scriptsPromise,
  options = {}
) {
  const promise = Promise.resolve(scriptsPromise).then(scripts =>
    runDocumentUserlandScripts(window, scripts, options)
  );
  blockDocumentParser(window, promise);
  return promise;
}

export function runDocumentStartUserlandScripts(window) {
  const scripts = getMatchingDocumentUserlandScripts(window);
  const promise = runDocumentUserlandScripts(window, scripts);
  blockDocumentParser(window, promise);

  return promise;
}

export const UmbrafoxUserlandScriptRuntime = {
  getMatchingDocumentUserlandScripts,
  runPromisedDocumentStartUserlandScripts,
  runProvidedDocumentStartUserlandScripts,
  runDocumentStartUserlandScripts,
};
