/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { setImmediate as nextTurn } from "node:timers/promises";
import vm from "node:vm";

const sourceURL = new URL(
  "../../UmbrafoxClipboardProtection.sys.mjs",
  import.meta.url
);

async function setup({
  realPermissions = false,
  feedback = false,
  initialPermissions = [],
} = {}) {
  const permissions = new Map();
  const observers = new Map();
  const timers = new Map();
  const notifications = [];
  const calls = [];
  const errors = [];
  const hints = [];
  const progressListeners = new Set();
  const permissionQueries = { prefix: 0, exact: 0 };
  let timerID = 0;
  let now = 1000;
  class Principal {
    constructor(principalOrigin, attrs = {}) {
      this.origin = principalOrigin;
      this.originNoSuffix = principalOrigin.split("^")[0];
      this.originAttributes = attrs;
      this.isContentPrincipal = true;
      this.scheme = new URL(this.originNoSuffix).protocol.slice(0, -1);
      this.URI = { spec: this.originNoSuffix };
    }
  }
  const principal = new Principal("https://example.com");
  const ownerWindow = new EventTarget();
  const browser = new EventTarget();
  const tab = new EventTarget();
  const hintPanel = new EventTarget();
  const hintAttributes = new Map();
  Object.assign(hintPanel, {
    state: "closed",
    getAttribute: attribute => hintAttributes.get(attribute) ?? "",
    setAttribute: (attribute, value) => hintAttributes.set(attribute, value),
    hidePopup() {
      hintPanel.state = "closed";
      hintPanel.dispatchEvent(new Event("popuphidden"));
    },
  });
  tab.checkVisibility = () => !tab.hidden;
  Object.assign(browser, {
    documentGlobal: ownerWindow,
    contentPrincipal: principal,
    isConnected: true,
    addProgressListener: listener => progressListeners.add(listener),
    removeProgressListener: listener => progressListeners.delete(listener),
  });
  Object.assign(ownerWindow, {
    closed: false,
    gBrowser: {
      selectedBrowser: browser,
      getTabForBrowser: () => tab,
      tabContainer: new EventTarget(),
    },
    setTimeout(callback, delay) {
      timers.set(++timerID, { callback, delay });
      return timerID;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    CustomEvent: class extends Event {},
    PopupNotifications: {
      panel: { state: "closed" },
      show(...args) {
        const notification = {
          args,
          options: args[6],
          remove() {
            notification.removed = true;
            notification.options.eventCallback("removed");
          },
        };
        notifications.push(notification);
        return notification;
      },
      remove(notification) {
        notification.remove();
      },
    },
  });
  if (feedback) {
    ownerWindow.document = {
      getElementById: id => (id === "confirmation-hint" ? hintPanel : null),
    };
    ownerWindow.ConfirmationHint = {
      show(anchor, id, options) {
        hints.push({ anchor, id, options });
        hintPanel.state = "open";
        hintPanel.setAttribute("data-message-id", id);
      },
    };
  }
  const services = {
    prefs: {
      getBoolPref: () => false,
      getBranch: () => ({ getIntPref: (_key, fallback) => fallback }),
    },
    strings: { createBundle: () => ({}) },
    scriptSecurityManager: {
      createContentPrincipalFromOrigin(principalOrigin) {
        const attrs = Object.fromEntries(
          new URLSearchParams(principalOrigin.split("^")[1])
        );
        return new Principal(principalOrigin, attrs);
      },
    },
    focus: { activeWindow: ownerWindow },
    obs: {
      addObserver(observer, topic) {
        observers.set(topic, observer);
      },
      removeObserver(observer, topic) {
        assert.equal(observers.get(topic), observer);
        observers.delete(topic);
      },
      notifyObservers(subject, topic, data) {
        observers.get(topic)?.observe(subject, topic, data);
      },
    },
    perms: {
      ALLOW_ACTION: 1,
      UNKNOWN_ACTION: 0,
      EXPIRE_NEVER: 0,
      EXPIRE_SESSION: 2,
      getAllForPrincipal(p) {
        return [...permissions.values()].filter(
          permission => permission.principal.originNoSuffix === p.originNoSuffix
        );
      },
      getPermissionObject(p, type) {
        return permissions.get(p.originNoSuffix + type) ?? null;
      },
      get all() {
        return [...permissions.values()];
      },
      getAllWithTypePrefix(prefix) {
        permissionQueries.prefix++;
        return [...permissions.values()].filter(permission =>
          permission.type.startsWith(prefix)
        );
      },
      testExactPermissionFromPrincipal(p, type) {
        permissionQueries.exact++;
        return permissions.get(p.originNoSuffix + type)?.capability ?? 0;
      },
      addFromPrincipal(p, type, capability, expireType) {
        const changed = permissions.has(p.originNoSuffix + type);
        const permission = {
          principal: p,
          type,
          capability,
          expireType,
          QueryInterface: () => permission,
        };
        permissions.set(p.originNoSuffix + type, permission);
        services.obs.notifyObservers(
          permission,
          "perm-changed",
          changed ? "changed" : "added"
        );
      },
      removeFromPrincipal(p, type) {
        const permission = permissions.get(p.originNoSuffix + type);
        if (permissions.delete(p.originNoSuffix + type)) {
          services.obs.notifyObservers(permission, "perm-changed", "deleted");
        }
      },
      removeAll() {
        permissions.clear();
        services.obs.notifyObservers(null, "perm-changed", "cleared");
      },
    },
  };
  for (const permission of initialPermissions) {
    services.perms.addFromPrincipal(
      services.scriptSecurityManager.createContentPrincipalFromOrigin(
        permission.origin
      ),
      permission.type,
      permission.capability,
      services.perms.EXPIRE_NEVER
    );
  }
  let SitePermissions = {
    ALLOW: 1,
    SCOPE_PERSISTENT: "persistent",
    SCOPE_SESSION: "session",
    setForPrincipal(p, type, capability, scope) {
      services.perms.addFromPrincipal(
        p,
        type,
        capability,
        scope === "session" ? 2 : 0
      );
    },
    removeFromPrincipal(p, type) {
      services.perms.removeFromPrincipal(p, type);
    },
  };
  let ui;
  const context = vm.createContext({
    Services: services,
    Ci: {
      nsIPrincipal: Principal,
      nsICookiePermission: { ACCESS_SESSION: 8 },
      nsIAutoplay: { BLOCKED_ALL: 5 },
      nsIWebProgress: { NOTIFY_LOCATION: 16 },
    },
    ChromeUtils: {
      generateQI: () =>
        function () {
          return this;
        },
      defineLazyGetter(object, property, getter) {
        Object.defineProperty(object, property, {
          get() {
            const value = getter();
            Object.defineProperty(object, property, { value });
            return value;
          },
          configurable: true,
        });
      },
      defineESModuleGetters(object, definitions) {
        for (const property of Object.keys(definitions)) {
          Object.defineProperty(object, property, {
            get: () => (property === "SitePermissions" ? SitePermissions : ui),
          });
        }
      },
    },
    Localization: class {
      formatValueSync(id, args) {
        return `${id}: ${args.origin}`;
      }
      formatMessagesSync(requests) {
        return requests.map(({ id }) => ({
          value: id,
          attributes: [
            { name: "label", value: id },
            { name: "accesskey", value: "X" },
          ],
        }));
      }
    },
    Date: class extends Date {
      static now() {
        return now;
      }
    },
    console: {
      error(error) {
        errors.push(error);
      },
    },
  });
  if (realPermissions) {
    const permissionsModule = new vm.SourceTextModule(
      await readFile(
        new URL("../../SitePermissions.sys.mjs", import.meta.url),
        "utf8"
      ),
      { context }
    );
    await permissionsModule.link(
      () =>
        new vm.SyntheticModule(
          ["XPCOMUtils"],
          function () {
            this.setExport("XPCOMUtils", {
              defineLazyPreferenceGetter(object, property, _key, fallback) {
                object[property] = fallback;
              },
            });
          },
          { context }
        )
    );
    await permissionsModule.evaluate();
    SitePermissions = permissionsModule.namespace.SitePermissions;
  }
  const module = new vm.SourceTextModule(await readFile(sourceURL, "utf8"), {
    context,
  });
  await module.link(() => {
    throw new Error("Unexpected static dependency");
  });
  await module.evaluate();
  ui = module.namespace.UmbrafoxClipboardProtection;
  async function request(options = {}) {
    const cancel = ui.request({
      browser,
      principal,
      operation: "copy",
      requestId: "request-1",
      isValid: () => true,
      onAllow: result => {
        calls.push(["allow", result.requestId, result.remember]);
        return true;
      },
      onCancel: result => calls.push(["cancel", result.requestId]),
      ...options,
    });
    await nextTurn();
    return cancel;
  }
  function choose(action, index = notifications.length - 1) {
    const notification = notifications[index];
    const buttons = [notification.args[4], ...notification.args[5]];
    return buttons
      .find(button => button.label.endsWith(`-${action}`))
      .callback();
  }
  return {
    ui,
    Principal,
    principal,
    window: ownerWindow,
    browser,
    tab,
    Services: services,
    SitePermissions,
    calls,
    notifications,
    permissions,
    observers,
    timers,
    request,
    choose,
    errors,
    hints,
    hintPanel,
    progressListeners,
    permissionQueries,
    advance(ms) {
      now += ms;
    },
  };
}

test("default, No and dismissal preserve permissions and never allow", async () => {
  for (const outcome of ["no", "dismissed", "removed", "cancel"]) {
    const f = await setup();
    assert.equal(f.ui.hasGrant(f.principal, "copy"), false);
    const cancel = await f.request();
    assert.equal(f.notifications[0].options.autofocus, false);
    assert.equal(f.notifications[0].options.dismissed, true);
    assert.equal(f.permissions.size, 0);
    if (outcome === "no") {
      await f.choose("no");
    } else if (outcome === "cancel") {
      cancel();
    } else {
      f.notifications[0].options.eventCallback(outcome);
    }
    cancel();
    assert.deepEqual(f.calls, [["cancel", "request-1"]]);
    assert.equal(f.permissions.size, 0);
    assert.equal(f.timers.size, 0);
  }
});

test("only explicit strict-false native retry shows an owned neutral failure hint", async () => {
  for (const operation of ["copy", "paste"]) {
    const f = await setup({ feedback: true });
    await f.request({ operation, onAllow: async () => false });
    assert.equal(f.hints.length, 0);
    await f.choose("always");
    assert.equal(f.hints.length, 1);
    assert.equal(
      f.hints[0].id,
      `confirmation-hint-umbrafox-${operation}-not-retried`
    );
    assert.equal(f.hints[0].options.hideCheckmark, true);
    assert.equal(f.permissions.size, 0);
    assert.equal(f.progressListeners.size, 1);
    assert.equal(f.timers.size, 1);
    const timer = [...f.timers.values()][0];
    assert.equal(timer.delay, 3000);
    timer.callback();
    assert.equal(f.hintPanel.state, "closed");
    assert.equal(f.timers.size, 0);
    assert.equal(f.progressListeners.size, 0);
  }
  for (const result of [true, null, undefined]) {
    const f = await setup({ feedback: true });
    await f.request({ onAllow: async () => result });
    await f.choose("yes");
    assert.equal(f.hints.length, 0);
  }
});

test("failure feedback suppresses unsafe state and never replaces another hint", async () => {
  for (const state of [
    "fullscreen",
    "transition",
    "locked",
    "hidden",
    "inactive",
    "navigated",
    "changed-window",
    "other-hint",
  ]) {
    const f = await setup({ feedback: true });
    await f.request({
      onAllow: async () => {
        if (state === "fullscreen") {
          f.window.fullScreen = true;
        }
        if (state === "transition") {
          f.window.isInFullScreenTransition = true;
        }
        if (state === "locked") {
          f.window.PointerLock = { isActive: true };
        }
        if (state === "hidden") {
          f.tab.hidden = true;
        }
        if (state === "inactive") {
          f.Services.focus.activeWindow = null;
        }
        if (state === "navigated") {
          f.browser.contentPrincipal = new f.Principal("https://other.example");
        }
        if (state === "changed-window") {
          f.browser.browsingContext = { currentWindowGlobal: {} };
        }
        if (state === "other-hint") {
          f.hintPanel.state = "open";
          f.hintPanel.setAttribute("data-message-id", "another-feature");
        }
        return false;
      },
    });
    await f.choose("always");
    assert.equal(f.hints.length, 0, state);
    assert.equal(f.permissions.size, 0, state);
    assert.equal(f.progressListeners.size, 0, state);
    assert.equal(f.timers.size, 0, state);
  }
});

test("failure hint navigation and tab cleanup only close the matching owned hint", async () => {
  for (const trigger of [
    "navigation",
    "tab",
    "tab-close",
    "unload",
    "popup-hidden",
    "deactivate",
    "replacement",
  ]) {
    const f = await setup({ feedback: true });
    await f.request({ onAllow: async () => false });
    await f.choose("yes");
    if (trigger === "navigation") {
      [...f.progressListeners][0].onLocationChange({ isTopLevel: true });
    } else if (trigger === "tab") {
      f.window.gBrowser.tabContainer.dispatchEvent(new Event("TabSelect"));
    } else if (trigger === "tab-close") {
      f.tab.dispatchEvent(new Event("TabClose"));
    } else if (trigger === "unload") {
      f.window.dispatchEvent(new Event("unload"));
    } else if (trigger === "popup-hidden") {
      f.hintPanel.hidePopup();
    } else {
      if (trigger === "replacement") {
        f.hintPanel.setAttribute("data-message-id", "another-feature");
      }
      f.window.dispatchEvent(new Event("deactivate"));
    }
    assert.equal(
      f.hintPanel.state,
      trigger === "replacement" ? "open" : "closed"
    );
    assert.equal(f.progressListeners.size, 0);
    assert.equal(f.timers.size, 0);
  }
});

test("an old failure hint timer cannot close a newer hint with the same message", async () => {
  const f = await setup({ feedback: true });
  await f.request({ onAllow: async () => false });
  await f.choose("yes");
  const staleTimer = [...f.timers.values()][0];
  [...f.progressListeners][0].onLocationChange({ isTopLevel: true });
  assert.equal(f.hintPanel.state, "closed");
  await f.request({ onAllow: async () => false });
  await f.choose("yes");
  assert.equal(f.hints.length, 2);
  staleTimer.callback();
  assert.equal(f.hintPanel.state, "open");
  assert.equal(f.timers.size, 1);
  assert.equal(f.progressListeners.size, 1);
  [...f.timers.values()][0].callback();
  assert.equal(f.hintPanel.state, "closed");
  assert.equal(f.timers.size, 0);
  assert.equal(f.progressListeners.size, 0);
});

test("Yes is consumed once and never remembered", async () => {
  const f = await setup();
  const cancel = await f.request();
  await f.choose("yes");
  await f.choose("yes");
  await f.choose("always");
  cancel();
  assert.deepEqual(f.calls, [["allow", "request-1", false]]);
  assert.equal(f.permissions.size, 0);
  assert.equal(f.timers.size, 0);
});

test("Always is exact-origin, operation and origin-attribute scoped, and revocable", async () => {
  const f = await setup();
  await f.request();
  await f.choose("always");
  assert.deepEqual(f.calls, [["allow", "request-1", true]]);
  assert.equal(f.ui.hasGrant(f.principal, "copy"), true);
  for (const principalOrigin of [
    "https://sub.example.com",
    // eslint-disable-next-line sdl/no-insecure-url -- Scheme isolation is under test.
    "http://example.com",
    "https://example.com:444",
    "https://other.example",
    "https://example.com^userContextId=1",
    "https://example.com^privateBrowsingId=1",
  ]) {
    assert.equal(
      f.ui.hasGrant(new f.Principal(principalOrigin), "copy"),
      false,
      principalOrigin
    );
  }
  assert.equal(f.ui.hasGrant(f.principal, "paste"), false);
  assert.equal(f.ui.hasGrant(f.principal, "cut"), false);
  f.ui.revoke(f.principal, "copy");
  assert.equal(f.ui.hasGrant(f.principal, "copy"), false);
});

test("private Always expires with the last private context, leaving normal grants", async () => {
  const f = await setup();
  await f.request();
  await f.choose("always");
  const principal = new f.Principal("https://example.com^privateBrowsingId=1", {
    privateBrowsingId: 1,
  });
  f.browser.contentPrincipal = principal;
  await f.request({ principal, operation: "paste" });
  await f.choose("always");
  assert.equal(
    [...f.permissions.values()].find(p => p.type.includes("paste")).expireType,
    2
  );
  f.observers
    .get("last-pb-context-exited")
    .observe(null, "last-pb-context-exited");
  assert.equal(f.ui.hasGrant(principal, "paste"), false);
  assert.equal(f.ui.hasGrant(f.principal, "copy"), true);
});

test("stale requests and TTL expire without an allow or grant", async () => {
  for (const outcome of [
    "stale",
    "timer",
    "late-action",
    "tab-close",
    "window-close",
    "swapping",
  ]) {
    const f = await setup();
    let valid = true;
    await f.request({ isValid: () => valid });
    if (outcome === "stale") {
      valid = false;
    }
    if (outcome === "timer") {
      [...f.timers.values()][0].callback();
    }
    if (outcome === "late-action") {
      f.advance(30001);
    }
    if (outcome === "tab-close") {
      f.tab.dispatchEvent(new Event("TabClose"));
    }
    if (outcome === "window-close") {
      f.window.dispatchEvent(new Event("unload"));
    }
    if (outcome === "swapping") {
      f.notifications[0].options.eventCallback("swapping");
    }
    await f.choose("always");
    assert.deepEqual(f.calls, [["cancel", "request-1"]], outcome);
    assert.equal(f.permissions.size, 0, outcome);
    assert.equal(f.timers.size, 0, outcome);
  }
});

test("concurrent requests coalesce without replacing the outstanding request", async () => {
  const f = await setup();
  await f.request();
  await f.request({ requestId: "request-2" });
  assert.equal(f.notifications.length, 1);
  await f.choose("yes");
  assert.deepEqual(f.calls, [
    ["cancel", "request-2"],
    ["allow", "request-1", false],
  ]);
});

test("ineligible principals, background requests and existing panels never show", async () => {
  for (const mode of [
    "unsupported",
    "null",
    "background-tab",
    "background-window",
    "open-panel",
    "invalid",
  ]) {
    const f = await setup();
    const options = {};
    if (mode === "unsupported") {
      options.principal = new f.Principal("file:///test");
    }
    if (mode === "null") {
      options.principal = null;
    }
    if (mode === "background-tab") {
      f.window.gBrowser.selectedBrowser = {};
    }
    if (mode === "background-window") {
      f.Services.focus.activeWindow = {};
    }
    if (mode === "open-panel") {
      f.window.PopupNotifications.panel.state = "open";
    }
    if (mode === "invalid") {
      options.isValid = () => false;
    }
    await f.request(options);
    assert.equal(f.notifications.length, 0, mode);
    assert.deepEqual(f.calls, [["cancel", "request-1"]], mode);
  }
});

test("popup failure and callback errors release pending ownership", async () => {
  const f = await setup();
  const show = f.window.PopupNotifications.show;
  f.window.PopupNotifications.show = () => {
    throw new Error("popup unavailable");
  };
  await f.request();
  assert.match(f.errors[0].message, /popup unavailable/);
  assert.deepEqual(f.calls, [["cancel", "request-1"]]);
  assert.equal(f.timers.size, 0);
  f.window.PopupNotifications.show = show;
  await f.request({
    onAllow() {
      throw new Error("actor gone");
    },
  });
  await f.choose("yes");
  assert.match(f.errors[1].message, /actor gone/);
  assert.equal(f.timers.size, 0);
  await f.request({ requestId: "request-3" });
  assert.equal(f.notifications.length, 2);
});

test("async validation is awaited and dismissal prevents later display", async () => {
  const f = await setup();
  let resolve;
  const validation = new Promise(r => {
    resolve = r;
  });
  const cancel = await f.request({ isValid: () => validation });
  assert.equal(f.notifications.length, 0);
  cancel();
  resolve(true);
  await nextTurn();
  assert.equal(f.notifications.length, 0);
  assert.deepEqual(f.calls, [["cancel", "request-1"]]);
});

test("rejected native retry never persists Always", async () => {
  for (const result of [false, undefined]) {
    const f = await setup();
    await f.request({ isValid: async () => true, onAllow: async () => result });
    assert.equal(f.notifications.length, 1);
    await f.choose("always");
    assert.equal(f.permissions.size, 0);
    assert.deepEqual(f.calls, [["cancel", "request-1"]]);
  }
});

test("duplicate choices during async validation or retry execute once", async () => {
  const f = await setup();
  let resolve;
  const retry = new Promise(r => {
    resolve = r;
  });
  let retries = 0;
  await f.request({
    onAllow: () => {
      retries++;
      return retry;
    },
  });
  const first = f.choose("always");
  await f.choose("always");
  await f.choose("yes");
  assert.equal(retries, 1);
  assert.equal(f.permissions.size, 0);
  resolve(true);
  await first;
  assert.equal(f.permissions.size, 1);
});

test("dismissal and expiry during retry prohibit persistence", async () => {
  for (const outcome of ["dismiss", "expire", "disconnect"]) {
    const f = await setup();
    let resolve;
    const retry = new Promise(r => {
      resolve = r;
    });
    const cancel = await f.request({ onAllow: () => retry });
    const choice = f.choose("always");
    await nextTurn();
    if (outcome === "dismiss") {
      cancel();
    }
    if (outcome === "expire") {
      f.advance(30001);
    }
    if (outcome === "disconnect") {
      f.browser.isConnected = false;
    }
    resolve(true);
    await choice;
    assert.equal(f.permissions.size, 0, outcome);
    assert.equal(f.timers.size, 0, outcome);
  }
});

test("PopupNotifications action removal does not cancel an owned async retry", async () => {
  const f = await setup();
  await f.request();
  const choice = f.choose("always");
  f.notifications[0].options.eventCallback("removed", 0, false);
  await choice;
  assert.deepEqual(f.calls, [["allow", "request-1", true]]);
  assert.equal(f.permissions.size, 1);
});

test("standard permission listing preserves container keys and revokes frame origins", async () => {
  const f = await setup({ realPermissions: true });
  f.browser.browsingContext = { currentWindowGlobal: {} };
  const principal = new f.Principal("https://frame.example^userContextId=1", {
    userContextId: 1,
  });
  await f.request({ principal });
  await f.choose("always");
  assert.equal(f.errors.length, 0);
  const id = f.ui.getPermissionID(principal, "copy");
  const details = f.SitePermissions.getAllPermissionDetailsForBrowser(
    f.browser
  );
  assert.equal(details.length, 1);
  assert.equal(details[0].id, id);
  assert.match(details[0].label, /https:\/\/frame.example/);
  const otherContainer = new f.Principal(
    "https://frame.example^userContextId=2",
    { userContextId: 2 }
  );
  assert.equal(f.SitePermissions.getAllByPrincipal(otherContainer).length, 0);
  assert.equal(f.SitePermissions.getForPrincipal(otherContainer, id).state, 0);
  f.SitePermissions.removeFromPrincipal(f.principal, id, f.browser);
  assert.equal(f.ui.hasGrant(principal, "copy"), false);
  assert.equal(f.SitePermissions.getAllForBrowser(f.browser).length, 0);
});

test("known frame grants do not carry over navigation; private types stay out of generic editor", async () => {
  const f = await setup({ realPermissions: true });
  f.browser.browsingContext = { currentWindowGlobal: {} };
  const principal = new f.Principal("https://frame.example");
  await f.request({ principal });
  await f.choose("always");
  assert.equal(f.SitePermissions.getAllForBrowser(f.browser).length, 1);
  f.browser.browsingContext.currentWindowGlobal = {};
  assert.equal(f.SitePermissions.getAllForBrowser(f.browser).length, 0);
  assert.equal(f.ui.hasGrant(principal, "copy", f.browser), true);
  assert.equal(f.SitePermissions.getAllForBrowser(f.browser).length, 1);
  assert.equal(
    f.SitePermissions.listPermissions().includes("umbrafox-clipboard-copy"),
    false
  );
  assert.equal(
    f.SitePermissions.listPermissions().includes("umbrafox-clipboard-paste"),
    false
  );
});

test("validation failure and malformed grant keys fail closed", async () => {
  const f = await setup({ realPermissions: true });
  await f.request({
    isValid: async () => {
      throw new Error("actor destroyed");
    },
  });
  assert.equal(f.notifications.length, 0);
  assert.equal(f.permissions.size, 0);
  assert.equal(f.timers.size, 0);
  assert.match(f.errors[0].message, /actor destroyed/);
  for (const key of [
    "umbrafox-clipboard-copy",
    "umbrafox-clipboard-copy^%broken",
    "umbrafox-clipboard-copy^https%3A%2F%2Fexample.com^extra",
    "umbrafox-clipboard-copy^file%3A%2F%2F%2Ftmp",
    "umbrafox-clipboard-cut^https%3A%2F%2Fexample.com",
  ]) {
    assert.equal(f.ui.getGrantPrincipal(key), null, key);
  }
});

test("current frame principals rediscover saved grants after reload without actor traffic", async () => {
  const f = await setup({ realPermissions: true });
  const frame = new f.Principal("https://frame.example^userContextId=1", {
    userContextId: 1,
  });
  const id = f.ui.getPermissionID(frame, "paste");
  f.SitePermissions.setForPrincipal(frame, id, f.SitePermissions.ALLOW);
  const currentFrame = {
    ancestorsAreCurrent: true,
    currentWindowGlobal: { documentPrincipal: frame },
  };
  f.browser.browsingContext = {
    currentWindowGlobal: {},
    getAllBrowsingContextsInSubtree: () => [currentFrame, currentFrame],
  };
  assert.equal(f.SitePermissions.getAllForBrowser(f.browser).length, 1);
  f.browser.browsingContext.currentWindowGlobal = {};
  assert.equal(f.SitePermissions.getAllForBrowser(f.browser)[0].id, id);
  currentFrame.ancestorsAreCurrent = false;
  assert.equal(f.SitePermissions.getAllForBrowser(f.browser).length, 0);
  currentFrame.ancestorsAreCurrent = true;
  currentFrame.currentWindowGlobal.documentPrincipal = new f.Principal(
    "https://frame.example^userContextId=2",
    { userContextId: 2 }
  );
  assert.equal(f.SitePermissions.getAllForBrowser(f.browser).length, 0);
  currentFrame.currentWindowGlobal.documentPrincipal = frame;
  f.SitePermissions.removeFromPrincipal(f.principal, id, f.browser);
  assert.equal(f.ui.hasGrant(frame, "paste"), false);
  assert.equal(f.SitePermissions.getAllForBrowser(f.browser).length, 0);
});

test("window lifecycle observation exists only while explicit clipboard grants exist", async () => {
  const f = await setup();
  const topic = "window-global-created";
  assert.equal(f.observers.has(topic), false);
  const scans = f.permissionQueries.prefix;
  assert.equal(scans, 1, "Saved grants are checked once at initialization");
  f.Services.perms.addFromPrincipal(f.principal, "camera", 1, 0);
  assert.equal(f.permissionQueries.prefix, scans);
  f.Services.perms.addFromPrincipal(
    f.principal,
    "umbrafox-clipboard-copy^%broken",
    1,
    0
  );
  assert.equal(f.observers.has(topic), false);
  const copyID = f.ui.getPermissionID(f.principal, "copy");
  const pasteID = f.ui.getPermissionID(f.principal, "paste");
  f.SitePermissions.setForPrincipal(f.principal, copyID, 1);
  const observer = f.observers.get(topic);
  assert.ok(observer, "Saving the first grant enables lifecycle observation");
  f.SitePermissions.setForPrincipal(f.principal, pasteID, 1);
  assert.equal(f.observers.get(topic), observer);
  f.ui.revoke(f.principal, "copy");
  assert.equal(f.observers.get(topic), observer);
  f.SitePermissions.setForPrincipal(f.principal, pasteID, 0);
  assert.equal(
    f.observers.has(topic),
    false,
    "Changing the last allow disables observation"
  );
  f.SitePermissions.setForPrincipal(f.principal, copyID, 1);
  assert.equal(f.observers.get(topic), observer);
  f.Services.perms.removeAll();
  assert.equal(
    f.observers.has(topic),
    false,
    "Clearing permissions disables observation"
  );
  f.SitePermissions.setForPrincipal(f.principal, pasteID, 1);
  f.ui.revoke(f.principal, "paste");
  assert.equal(
    f.observers.has(topic),
    false,
    "Revoking the last grant disables observation"
  );
  assert.equal(f.notifications.length, 0);
  assert.equal(f.calls.length, 0);
});

test("persisted grants enable lifecycle observation when the UI module loads", async () => {
  for (const capability of [0, 1, 2]) {
    const f = await setup({
      initialPermissions: [
        {
          origin: "https://frame.example^userContextId=1",
          type: `umbrafox-clipboard-paste^${encodeURIComponent("https://frame.example^userContextId=1")}`,
          capability,
        },
      ],
    });
    assert.equal(f.observers.has("window-global-created"), capability === 1);
  }
});

test("late current frame grants refresh chrome without retaining frame principals", async () => {
  const f = await setup({ realPermissions: true });
  const frame = new f.Principal("https://frame.example^userContextId=1", {
    userContextId: 1,
  });
  const id = f.ui.getPermissionID(frame, "paste");
  f.SitePermissions.setForPrincipal(frame, id, f.SitePermissions.ALLOW);
  const topContext = { currentWindowGlobal: {}, embedderElement: f.browser };
  f.browser.browsingContext = topContext;
  const context = { ancestorsAreCurrent: true, top: topContext };
  const global = { browsingContext: context, documentPrincipal: frame };
  context.currentWindowGlobal = global;
  topContext.getAllBrowsingContextsInSubtree = () => [context];
  const refreshed = [];
  f.browser.addEventListener("PermissionStateChange", () => {
    refreshed.push(
      f.SitePermissions.getAllForBrowser(f.browser).map(p => p.id)
    );
  });
  const initialGlobal = {
    browsingContext: context,
    documentPrincipal: f.principal,
  };
  context.currentWindowGlobal = initialGlobal;
  f.Services.obs.notifyObservers(initialGlobal, "window-global-created");
  assert.equal(
    refreshed.length,
    0,
    "The initial inherited principal has no grant"
  );
  context.currentWindowGlobal = global;
  f.Services.obs.notifyObservers(global, "window-global-created");
  assert.deepEqual(
    refreshed.map(ids => Array.from(ids)),
    [[id]]
  );
  context.ancestorsAreCurrent = false;
  assert.equal(
    f.SitePermissions.getAllForBrowser(f.browser).length,
    0,
    "The lifecycle refresh does not cache the departed frame grant"
  );
  assert.equal(f.notifications.length, 0);
  assert.equal(f.calls.length, 0);
});

test("window lifecycle refresh requires a current exact grant in the selected browser", async () => {
  for (const invalid of [
    "old-global",
    "old-ancestor",
    "other-origin",
    "other-container",
    "private",
    "background",
    "disconnected",
    "closed-window",
    "no-browser",
    "no-window",
    "no-tab-browser",
  ]) {
    const f = await setup();
    const frame = new f.Principal("https://frame.example^userContextId=1", {
      userContextId: 1,
    });
    f.SitePermissions.setForPrincipal(
      frame,
      f.ui.getPermissionID(frame, "copy"),
      1
    );
    const topContext = { embedderElement: f.browser };
    const context = { ancestorsAreCurrent: true, top: topContext };
    const global = { browsingContext: context, documentPrincipal: frame };
    context.currentWindowGlobal = global;
    switch (invalid) {
      case "old-global":
        context.currentWindowGlobal = {};
        break;
      case "old-ancestor":
        context.ancestorsAreCurrent = false;
        break;
      case "other-origin":
        global.documentPrincipal = new f.Principal("https://other.example");
        break;
      case "other-container":
        global.documentPrincipal = new f.Principal(
          "https://frame.example^userContextId=2",
          { userContextId: 2 }
        );
        break;
      case "private":
        global.documentPrincipal = new f.Principal(
          "https://frame.example^privateBrowsingId=1",
          { privateBrowsingId: 1 }
        );
        break;
      case "background":
        f.window.gBrowser.selectedBrowser = {};
        break;
      case "disconnected":
        f.browser.isConnected = false;
        break;
      case "closed-window":
        f.window.closed = true;
        break;
      case "no-browser":
        topContext.embedderElement = null;
        break;
      case "no-window":
        f.browser.documentGlobal = null;
        break;
      case "no-tab-browser":
        f.window.gBrowser = null;
        break;
    }
    let refreshes = 0;
    f.browser.addEventListener("PermissionStateChange", () => refreshes++);
    assert.ok(f.observers.has("window-global-created"));
    f.Services.obs.notifyObservers(global, "window-global-created");
    assert.equal(refreshes, 0, invalid);
  }
});
