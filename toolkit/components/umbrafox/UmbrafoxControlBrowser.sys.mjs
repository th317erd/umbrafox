/* This Source Code Form is subject to the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  controlError,
  controlTimeout,
  executeControlScript,
  validateScriptParameters,
  waitForControlOperation,
} from "resource://gre/modules/UmbrafoxControlScript.sys.mjs";

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  ProgressListener: "chrome://remote/content/shared/Navigate.sys.mjs",
});

const pending = new Set();

function getTarget(params, topOnly = true) {
  if (
    !params ||
    typeof params !== "object" ||
    Array.isArray(params) ||
    !Number.isSafeInteger(params.context) ||
    params.context < 1
  ) {
    throw controlError("invalid argument", "Expected a positive context ID");
  }
  const context = BrowsingContext.get(params.context);
  if (
    !context ||
    context.isDiscarded ||
    !context.isContent ||
    !context.currentWindowGlobal
  ) {
    throw controlError("no such frame", "Context has no active document");
  }
  const browser = context.top.embedderElement;
  const window = context.topChromeWindow;
  const tab = window?.gBrowser?.getTabForBrowser(browser);
  if (!tab || (topOnly && context.top !== context)) {
    throw controlError("invalid argument", "Expected a browser tab context");
  }
  return { context, browser, window, tab };
}

function receipt(context) {
  return {
    context: context.id,
    document: context.currentWindowGlobal?.innerWindowId ?? null,
    url: context.currentURI?.spec ?? null,
  };
}

function checkActive(signal) {
  if (signal?.aborted) {
    throw controlError("aborted", "Control connection closed");
  }
}

async function exclusive(context, signal, callback) {
  checkActive(signal);
  if (pending.has(context.id) || pending.size >= 16) {
    throw controlError(
      "busy",
      "A control operation is already pending or the operation limit was reached"
    );
  }
  pending.add(context.id);
  try {
    return await callback();
  } finally {
    pending.delete(context.id);
  }
}

export const UmbrafoxControlBrowser = {
  create(params, signal) {
    const { window } = getTarget(params);
    checkActive(signal);
    if (
      params.background !== undefined &&
      typeof params.background !== "boolean"
    ) {
      throw controlError("invalid argument", "background must be a boolean");
    }
    const tab = window.gBrowser.addTab("about:blank", {
      triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
      inBackground: params.background ?? true,
    });
    if (params.background === false) {
      window.gBrowser.selectedTab = tab;
    }
    return receipt(tab.linkedBrowser.browsingContext);
  },

  close(params, signal) {
    const { context, window, tab } = getTarget(params);
    checkActive(signal);
    if (pending.has(context.id)) {
      throw controlError(
        "busy",
        "A control operation is pending for this context"
      );
    }
    if (window.gBrowser.tabs.length === 1) {
      throw controlError(
        "invalid argument",
        "Refusing to close the last tab in a window"
      );
    }
    window.gBrowser.removeTab(tab, { animate: false });
    return { context: context.id, closed: !tab.isConnected };
  },

  async navigate(params, signal) {
    const { context, browser, tab } = getTarget(params);
    const timeoutMs = controlTimeout(params.timeoutMs);
    if (
      typeof params.url !== "string" ||
      params.url.length > 65536 ||
      !["none", "complete"].includes(params.wait ?? "complete")
    ) {
      throw controlError(
        "invalid argument",
        "Expected URL and wait none or complete"
      );
    }
    let uri;
    try {
      uri = Services.io.newURI(params.url);
    } catch {
      throw controlError("invalid argument", "Invalid absolute URL");
    }
    if (!["http", "https", "about", "file", "data"].includes(uri.scheme)) {
      throw controlError(
        "invalid argument",
        "Unsupported navigation scheme; use script execution for JavaScript"
      );
    }
    return exclusive(context, signal, async () => {
      const listener = new lazy.ProgressListener(browser.webProgress, {
        expectNavigation: true,
        waitForExplicitStart: true,
        targetURI: uri,
        resolveWhenStarted: params.wait === "none",
      });
      const closed = new AbortController();
      const onClose = () => closed.abort();
      tab.addEventListener("TabClose", onClose, { once: true });
      const combined = signal
        ? AbortSignal.any([signal, closed.signal])
        : closed.signal;
      let navigation;
      try {
        navigation = listener.start();
        navigation.catch(() => {});
        browser.loadURI(uri, {
          triggeringPrincipal:
            Services.scriptSecurityManager.getSystemPrincipal(),
        });
        await waitForControlOperation(navigation, timeoutMs, combined);
        return {
          ...receipt(browser.browsingContext),
          wait: params.wait ?? "complete",
        };
      } catch (error) {
        throw controlError(
          error.code ?? "navigation error",
          String(error.message).slice(0, 4096)
        );
      } finally {
        tab.removeEventListener("TabClose", onClose);
        if (listener.isStarted) {
          listener.stop();
        }
        listener.destroy();
      }
    });
  },

  async execute(params, signal) {
    const options = validateScriptParameters(params);
    const { context, window } = getTarget(options, options.realm === "browser");
    const global = context.currentWindowGlobal;
    if (
      options.document !== undefined &&
      options.document !== global.innerWindowId
    ) {
      throw controlError(
        "stale document",
        "Document no longer matches the requested identity"
      );
    }
    return exclusive(context, signal, async () => {
      let value;
      if (options.realm === "browser") {
        value = await executeControlScript(window, options, signal);
      } else {
        const actor = global.getActor("UmbrafoxControlExecution");
        const id = Services.uuid.generateUUID().toString();
        try {
          const reply = await waitForControlOperation(
            actor.sendQuery("Execute", {
              ...options,
              document: global.innerWindowId,
              id,
            }),
            options.timeoutMs,
            signal
          );
          if (reply.error) {
            throw controlError(reply.error.code, reply.error.message);
          }
          value = reply.result;
        } finally {
          try {
            actor.sendAsyncMessage("Cancel", { id });
          } catch {
            /* Actor may have been destroyed by navigation. */
          }
        }
      }
      if (context.isDiscarded || context.currentWindowGlobal !== global) {
        throw controlError(
          "stale document",
          "Document changed during execution"
        );
      }
      return { ...receipt(context), realm: options.realm, result: value };
    });
  },
};
