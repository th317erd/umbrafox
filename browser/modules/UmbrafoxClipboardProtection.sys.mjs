/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  SitePermissions: "resource:///modules/SitePermissions.sys.mjs",
});
ChromeUtils.defineLazyGetter(
  lazy,
  "l10n",
  () => new Localization(["browser/sitePermissions.ftl"], true)
);

const REQUEST_LIFETIME_MS = 30000;
const pendingRequests = new WeakMap();
const browserGrants = new WeakMap();
const failureHints = new WeakMap();
const permissionPrefix = "umbrafox-clipboard-";

function supportedPrincipal(principal) {
  return (
    principal instanceof Ci.nsIPrincipal &&
    principal.isContentPrincipal &&
    ["http", "https"].includes(principal.scheme)
  );
}

function showRetryFailure(browser, tab, operation, isCurrent) {
  const window = browser.documentGlobal;
  if (
    !isCurrent() ||
    !window.ConfirmationHint ||
    window.fullScreen ||
    window.document.fullscreenElement ||
    window.isInFullScreenTransition ||
    window.PointerLock?.isActive ||
    !tab?.checkVisibility({ visibilityProperty: true })
  ) {
    return;
  }
  let panel = window.document.getElementById("confirmation-hint");
  if (panel && panel.state !== "closed") {
    return;
  }
  failureHints.get(window)?.();
  const messageID = `confirmation-hint-umbrafox-${operation}-not-retried`;
  let timer;
  let observing = false;
  const progress = {
    QueryInterface: ChromeUtils.generateQI([
      "nsIWebProgressListener",
      "nsISupportsWeakReference",
    ]),
    onLocationChange(webProgress) {
      if (webProgress.isTopLevel) {
        cleanup();
      }
    },
  };
  const cleanup = () => {
    if (failureHints.get(window) !== cleanup) {
      return;
    }
    failureHints.delete(window);
    window.clearTimeout(timer);
    window.gBrowser.tabContainer.removeEventListener("TabSelect", cleanup);
    window.removeEventListener("deactivate", cleanup);
    window.removeEventListener("unload", cleanup);
    tab.removeEventListener("TabClose", cleanup);
    panel?.removeEventListener("popuphidden", cleanup);
    try {
      if (observing) {
        browser.removeProgressListener(progress);
      }
    } finally {
      if (panel?.getAttribute("data-message-id") === messageID) {
        panel.hidePopup(true);
      }
    }
  };
  failureHints.set(window, cleanup);
  try {
    browser.addProgressListener(progress, Ci.nsIWebProgress.NOTIFY_LOCATION);
    observing = true;
    window.gBrowser.tabContainer.addEventListener("TabSelect", cleanup);
    window.addEventListener("deactivate", cleanup);
    window.addEventListener("unload", cleanup);
    tab.addEventListener("TabClose", cleanup);
    window.ConfirmationHint.show(tab, messageID, { hideCheckmark: true });
    panel = window.document.getElementById("confirmation-hint");
    panel.addEventListener("popuphidden", cleanup);
    timer = window.setTimeout(cleanup, 3000);
    if (!isCurrent()) {
      cleanup();
    }
  } catch (error) {
    cleanup();
    console.error(error);
  }
}

export const UmbrafoxClipboardProtection = {
  getPermissionID(principal, operation) {
    if (
      !supportedPrincipal(principal) ||
      !["copy", "paste"].includes(operation)
    ) {
      return null;
    }
    // PermissionManager can strip origin attributes; keep them in the key too.
    return `${permissionPrefix}${operation}^${encodeURIComponent(principal.origin)}`;
  },

  getGrantPrincipal(permissionID) {
    const [type, origin, extra] = permissionID.split("^");
    if (
      ![`${permissionPrefix}copy`, `${permissionPrefix}paste`].includes(type) ||
      !origin ||
      extra !== undefined
    ) {
      return null;
    }
    try {
      const principal =
        Services.scriptSecurityManager.createContentPrincipalFromOrigin(
          decodeURIComponent(origin)
        );
      return supportedPrincipal(principal) &&
        encodeURIComponent(principal.origin) === origin
        ? principal
        : null;
    } catch {
      return null;
    }
  },

  hasGrant(principal, operation, browser = null) {
    const permissionID = this.getPermissionID(principal, operation);
    const allowed =
      permissionID !== null &&
      Services.perms.testExactPermissionFromPrincipal(
        principal,
        permissionID
      ) === Services.perms.ALLOW_ACTION;
    if (allowed && browser) {
      this.noteGrant(browser, principal, permissionID);
    }
    return allowed;
  },

  noteGrant(browser, principal, permissionID) {
    const topWindow = browser.browsingContext?.currentWindowGlobal;
    let entry = browserGrants.get(browser);
    if (!entry || entry.topWindow !== topWindow) {
      entry = { topWindow, principals: new Map() };
      browserGrants.set(browser, entry);
    }
    entry.principals.set(permissionID, principal);
    browser.dispatchEvent(
      new browser.documentGlobal.CustomEvent("PermissionStateChange")
    );
  },

  getGrantsForBrowser(browser) {
    const entry = browserGrants.get(browser);
    const principals = new Map();
    if (entry?.topWindow !== browser.browsingContext?.currentWindowGlobal) {
      browserGrants.delete(browser);
    } else {
      for (const [id, principal] of entry?.principals ?? []) {
        principals.set(id, principal);
      }
    }
    const contexts =
      browser.browsingContext?.getAllBrowsingContextsInSubtree?.() ?? [];
    for (const context of contexts) {
      if (!context.ancestorsAreCurrent) {
        continue;
      }
      const principal = context.currentWindowGlobal?.documentPrincipal;
      for (const operation of ["copy", "paste"]) {
        const id = this.getPermissionID(principal, operation);
        if (id) {
          principals.set(id, principal);
        }
      }
    }
    const grants = [];
    for (const [id, principal] of principals) {
      const permission = lazy.SitePermissions.getForPrincipal(principal, id);
      if (permission.state === lazy.SitePermissions.ALLOW) {
        grants.push({ id, ...permission });
      }
    }
    return grants;
  },

  revoke(principal, operation) {
    const permissionID = this.getPermissionID(principal, operation);
    if (permissionID) {
      lazy.SitePermissions.removeFromPrincipal(principal, permissionID);
    }
  },

  /**
   * The actor owns provenance and native retry validation. These callbacks must
   * never carry clipboard data. onCancel only releases the pending native token.
   */
  request({
    browser,
    principal,
    operation,
    requestId,
    isValid,
    onAllow,
    onCancel,
  }) {
    if (
      typeof requestId !== "string" ||
      !requestId ||
      typeof isValid !== "function" ||
      typeof onAllow !== "function" ||
      typeof onCancel !== "function"
    ) {
      throw new TypeError("Invalid clipboard override request");
    }
    const window = browser?.documentGlobal;
    const popups = window?.PopupNotifications;
    const permissionID = this.getPermissionID(principal, operation);
    if (
      !permissionID ||
      !popups ||
      window.closed ||
      !browser.isConnected ||
      window.gBrowser.selectedBrowser !== browser ||
      Services.focus.activeWindow !== window ||
      (popups.panel.state && popups.panel.state !== "closed") ||
      pendingRequests.has(browser)
    ) {
      onCancel({ requestId });
      return () => {};
    }

    const expires = Date.now() + REQUEST_LIFETIME_MS;
    const tab = window.gBrowser.getTabForBrowser(browser);
    const topWindow = browser.browsingContext?.currentWindowGlobal;
    const topPrincipal = browser.contentPrincipal;
    let settled = false;
    let choosing = false;
    let notification = null;
    let timer = null;
    const finish = allow => {
      if (settled) {
        return;
      }
      settled = true;
      pendingRequests.delete(browser);
      window.clearTimeout(timer);
      window.removeEventListener("unload", cancel);
      tab?.removeEventListener("TabClose", cancel);
      if (notification) {
        popups.remove(notification);
        notification = null;
      }
      if (!allow) {
        onCancel({ requestId });
      }
    };
    const cancel = () => finish(false);
    const sameDocument = () =>
      browser.isConnected &&
      !window.closed &&
      window.gBrowser.selectedBrowser === browser &&
      Services.focus.activeWindow === window &&
      browser.contentPrincipal === topPrincipal &&
      browser.browsingContext?.currentWindowGlobal === topWindow;
    const current = () => !settled && Date.now() < expires && sameDocument();
    const allow = async remember => {
      if (settled || choosing) {
        return;
      }
      choosing = true;
      try {
        if (!current() || (await isValid()) !== true || !current()) {
          cancel();
          return;
        }
        const retried = await onAllow({ requestId, remember });
        if (!current()) {
          cancel();
          return;
        }
        if (retried !== true) {
          cancel();
          if (retried === false) {
            showRetryFailure(browser, tab, operation, sameDocument);
          }
          return;
        }
        if (remember) {
          lazy.SitePermissions.setForPrincipal(
            principal,
            permissionID,
            lazy.SitePermissions.ALLOW,
            principal.originAttributes.privateBrowsingId
              ? lazy.SitePermissions.SCOPE_SESSION
              : lazy.SitePermissions.SCOPE_PERSISTENT
          );
          this.noteGrant(browser, principal, permissionID);
        }
        finish(true);
      } catch (error) {
        cancel();
        console.error(error);
      }
    };

    pendingRequests.set(browser, cancel);
    timer = window.setTimeout(cancel, REQUEST_LIFETIME_MS);
    window.addEventListener("unload", cancel);
    tab?.addEventListener("TabClose", cancel);
    const show = async () => {
      if (!current() || (await isValid()) !== true || !current()) {
        cancel();
        return;
      }
      if (popups.panel.state && popups.panel.state !== "closed") {
        cancel();
        return;
      }
      const [message, no, yes, always] = lazy.l10n.formatMessagesSync([
        { id: `umbrafox-clipboard-${operation}-prompt` },
        { id: "umbrafox-clipboard-no" },
        { id: "umbrafox-clipboard-yes" },
        { id: "umbrafox-clipboard-always" },
      ]);
      const action = (localized, callback) => ({
        label: localized.attributes.find(attr => attr.name === "label").value,
        accessKey: localized.attributes.find(attr => attr.name === "accesskey")
          .value,
        callback,
      });
      notification = popups.show(
        browser,
        "umbrafox-clipboard-protection",
        message.value,
        "default-notification-icon",
        action(yes, () => allow(false)),
        [action(no, cancel), action(always, () => allow(true))],
        {
          autofocus: false,
          dismissed: true,
          removeOnDismissal: true,
          displayURI: principal.URI,
          eventCallback(topic, _reason, withoutUserResponse) {
            if (
              topic === "removed" &&
              choosing &&
              withoutUserResponse === false
            ) {
              notification = null;
              return false;
            }
            if (["dismissed", "removed", "swapping"].includes(topic)) {
              cancel();
            }
            if (topic === "showing" && !current()) {
              cancel();
              return true;
            }
            return false;
          },
        }
      );
      if (settled) {
        popups.remove(notification);
        notification = null;
      }
    };
    show().catch(error => {
      cancel();
      console.error(error);
    });
    return cancel;
  },
};

const grantedDocumentObserver = {
  observingWindows: false,

  updateRegistration() {
    const hasGrants = Services.perms
      .getAllWithTypePrefix(permissionPrefix)
      .some(
        permission =>
          permission.capability === Services.perms.ALLOW_ACTION &&
          UmbrafoxClipboardProtection.getGrantPrincipal(permission.type)
      );
    if (hasGrants === this.observingWindows) {
      return;
    }
    this.observingWindows = hasGrants;
    if (hasGrants) {
      Services.obs.addObserver(this, "window-global-created");
    } else {
      Services.obs.removeObserver(this, "window-global-created");
    }
  },

  observe(subject, topic, data) {
    if (topic === "perm-changed") {
      if (
        data === "cleared" ||
        subject
          ?.QueryInterface(Ci.nsIPermission)
          .type.startsWith(permissionPrefix)
      ) {
        this.updateRegistration();
      }
      return;
    }
    const context = subject.browsingContext;
    if (
      context?.currentWindowGlobal !== subject ||
      !context.ancestorsAreCurrent
    ) {
      return;
    }
    const browser = context.top.embedderElement;
    const window = browser?.documentGlobal;
    if (
      !browser?.isConnected ||
      !window ||
      window.closed ||
      window.gBrowser?.selectedBrowser !== browser
    ) {
      return;
    }
    const principal = subject.documentPrincipal;
    if (
      UmbrafoxClipboardProtection.hasGrant(principal, "copy") ||
      UmbrafoxClipboardProtection.hasGrant(principal, "paste")
    ) {
      browser.dispatchEvent(new window.CustomEvent("PermissionStateChange"));
    }
  },
};

Services.obs.addObserver(grantedDocumentObserver, "perm-changed");
grantedDocumentObserver.updateRegistration();

Services.obs.addObserver(
  {
    observe() {
      for (const permission of Services.perms.all) {
        const principal = UmbrafoxClipboardProtection.getGrantPrincipal(
          permission.type
        );
        if (principal?.originAttributes.privateBrowsingId) {
          Services.perms.removeFromPrincipal(principal, permission.type);
        }
      }
    },
  },
  "last-pb-context-exited"
);
