/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const DIALOG_EVENT_TYPES = new Set(["alert", "prompt", "confirm"]);
const NAVIGATION_EVENT_TYPE = "navigation";
const NATIVE_NAVIGATION_TOPIC = "umbrafox-userland-navigation-attempt";
const SUPPORTED_EVENT_TYPES = new Set([
  ...DIALOG_EVENT_TYPES,
  NAVIGATION_EVENT_TYPE,
]);

const nativeNavigationControllers = new Map();
let nativeNavigationObserverRegistered = false;

const nativeNavigationObserver = {
  observe(subject, topic) {
    if (topic != NATIVE_NAVIGATION_TOPIC) {
      return;
    }

    const bag = subject.QueryInterface(Ci.nsIWritablePropertyBag2);
    const browsingContextId = bag.getPropertyAsUint64("browsingContextId");
    const controller =
      nativeNavigationControllers.get(browsingContextId)?.deref() ?? null;
    if (!controller) {
      nativeNavigationControllers.delete(browsingContextId);
      return;
    }
    if (!controller?.hasHandlers(NAVIGATION_EVENT_TYPE)) {
      return;
    }

    const event = controller.dispatchNavigation({
      href: bag.getPropertyAsAUTF8String("href"),
      source: bag.getPropertyAsAUTF8String("source"),
      target: bag.getPropertyAsAString("target"),
      external: bag.getPropertyAsBool("external"),
      formSubmission: bag.getPropertyAsBool("formSubmission"),
      metaRefresh: bag.getPropertyAsBool("metaRefresh"),
      redirect: bag.getPropertyAsBool("redirect"),
      loadType: bag.getPropertyAsUint32("loadType"),
      native: true,
    });

    if (event.defaultPrevented) {
      bag.setPropertyAsBool("cancelled", true);
      return;
    }

    if (event.href != event.originalHref) {
      bag.setPropertyAsAUTF8String("href", event.href);
    }
  },
};

function ensureNativeNavigationObserver() {
  if (nativeNavigationObserverRegistered) {
    return;
  }
  nativeNavigationObserverRegistered = true;
  Services.obs.addObserver(nativeNavigationObserver, NATIVE_NAVIGATION_TOPIC);
}

function makeInfo(script) {
  return Object.freeze({
    id: script?.id ?? null,
    name: script?.name ?? null,
    scope: script?.scope ? structuredClone(script.scope) : null,
    world: script?.world ?? "default",
  });
}

function getString(value, fallback = "") {
  if (value === undefined || value === null) {
    return fallback;
  }
  return String(value);
}

function resolveHref(window, href) {
  if (href === undefined || href === null || href === "") {
    return getString(href);
  }
  try {
    return new URL(String(href), window.location.href).href;
  } catch {
    return String(href);
  }
}

function getEventTargetLink(target) {
  if (!target?.closest) {
    return null;
  }
  return target.closest("a[href], area[href]");
}

function getEventTargetForm(target) {
  if (!target) {
    return null;
  }
  if (target.localName == "form") {
    return target;
  }
  return target.closest?.("form") ?? null;
}

function getBrowsingContextId(window) {
  return window?.docShell?.browsingContext?.id ?? window?.browsingContext?.id;
}

/**
 * Synchronous cancellable event object passed to userland handlers.
 */
class UserlandCancellableEvent {
  constructor(type, fields = {}) {
    this.type = type;
    this.cancelable = true;
    this.defaultPrevented = false;
    this._responded = false;
    Object.assign(this, fields);
  }

  preventDefault() {
    this.defaultPrevented = true;
  }

  cancel() {
    this.preventDefault();
  }

  respondWith(value) {
    this.returnValue = value;
    this._responded = true;
    this.preventDefault();
  }
}

/**
 * Per-document controller for userland dialog and navigation event hooks.
 */
export class UmbrafoxUserlandEventController {
  constructor(window, { browsingContextId = null } = {}) {
    this.window = window;
    this.browsingContextId = browsingContextId ?? getBrowsingContextId(window);
    this.handlers = new Map();
    this.installedHooks = new Set();
    this.originals = Object.create(null);
  }

  createAPI(script) {
    const api = Object.create(null);
    api.info = makeInfo(script);
    api.on = (type, handler) => this.addEventListener(type, handler);
    api.off = (type, handler) => this.removeEventListener(type, handler);
    api.addEventListener = api.on;
    api.removeEventListener = api.off;
    return Object.freeze(api);
  }

  addEventListener(type, handler) {
    if (!SUPPORTED_EVENT_TYPES.has(type)) {
      throw new TypeError(`Unsupported userland event type: ${type}`);
    }
    if (typeof handler != "function") {
      throw new TypeError("Userland event handler must be a function");
    }

    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type).add(handler);
    this.installHooksForType(type);

    return () => this.removeEventListener(type, handler);
  }

  removeEventListener(type, handler) {
    this.handlers.get(type)?.delete(handler);
  }

  hasHandlers(type) {
    return !!this.handlers.get(type)?.size;
  }

  dispatch(type, fields = {}) {
    const event = new UserlandCancellableEvent(type, fields);
    for (const handler of this.handlers.get(type) ?? []) {
      try {
        handler(event);
      } catch (error) {
        this.window.console?.error?.(error);
      }
    }
    return event;
  }

  installHooksForType(type) {
    if (DIALOG_EVENT_TYPES.has(type)) {
      this.installDialogHooks();
      return;
    }
    if (type == NAVIGATION_EVENT_TYPE) {
      this.installNavigationHooks();
    }
  }

  installDialogHooks() {
    if (this.installedHooks.has("dialogs")) {
      return;
    }
    this.installedHooks.add("dialogs");

    this.originals.alert = this.window.alert?.bind(this.window);
    this.originals.prompt = this.window.prompt?.bind(this.window);
    this.originals.confirm = this.window.confirm?.bind(this.window);

    Cu.exportFunction(message => this.handleAlert(message), this.window, {
      defineAs: "alert",
    });
    Cu.exportFunction(
      (message, defaultValue) => this.handlePrompt(message, defaultValue),
      this.window,
      { defineAs: "prompt" }
    );
    Cu.exportFunction(message => this.handleConfirm(message), this.window, {
      defineAs: "confirm",
    });
  }

  handleAlert(message) {
    const event = this.dispatch("alert", {
      message: getString(message),
    });
    if (event.defaultPrevented) {
      return undefined;
    }
    return this.originals.alert?.(event.message);
  }

  handlePrompt(message, defaultValue = "") {
    const event = this.dispatch("prompt", {
      message: getString(message),
      defaultValue: getString(defaultValue),
    });
    if (event.defaultPrevented) {
      if (!("returnValue" in event)) {
        return null;
      }
      return event.returnValue === null ? null : String(event.returnValue);
    }
    return this.originals.prompt?.(event.message, event.defaultValue);
  }

  handleConfirm(message) {
    const event = this.dispatch("confirm", {
      message: getString(message),
    });
    if (event.defaultPrevented) {
      return !!event.returnValue;
    }
    return this.originals.confirm?.(event.message);
  }

  installNavigationHooks() {
    if (this.installedHooks.has("navigation")) {
      return;
    }
    this.installedHooks.add("navigation");

    this.originals.open = this.window.open?.bind(this.window);

    Cu.exportFunction(
      (url, target, features) => this.handleWindowOpen(url, target, features),
      this.window,
      { defineAs: "open" }
    );

    this.installNativeNavigationHook();
  }

  installNativeNavigationHook() {
    const browsingContextId = this.browsingContextId;
    if (!browsingContextId) {
      return;
    }

    ensureNativeNavigationObserver();
    nativeNavigationControllers.set(browsingContextId, new WeakRef(this));
  }

  dispatchNavigation(fields) {
    const href = resolveHref(this.window, fields.href);
    return this.dispatch(NAVIGATION_EVENT_TYPE, {
      ...fields,
      href,
      originalHref: href,
    });
  }

  handleWindowOpen(url, target = "", features = "") {
    const event = this.dispatchNavigation({
      href: url,
      source: "window.open",
      target: getString(target),
      features: getString(features),
      external: !this.isInternalProtocol(url),
    });
    if (event.defaultPrevented) {
      return null;
    }
    return this.originals.open?.(event.href, target, features);
  }

  handleClickNavigation(domEvent) {
    if (domEvent.defaultPrevented || domEvent.button != 0) {
      return;
    }

    const link = getEventTargetLink(domEvent.target);
    if (!link?.href) {
      return;
    }

    const event = this.dispatchNavigation({
      href: link.href,
      source: "anchor-click",
      target: getString(link.target),
      external: !this.isInternalProtocol(link.href),
    });
    if (event.defaultPrevented) {
      domEvent.preventDefault();
      domEvent.stopImmediatePropagation();
      return;
    }
    if (event.href != event.originalHref) {
      domEvent.preventDefault();
      domEvent.stopImmediatePropagation();
      if (link.target) {
        this.originals.open?.(event.href, link.target);
      } else {
        this.originals.locationAssign?.(event.href);
      }
    }
  }

  handleSubmitNavigation(domEvent) {
    if (domEvent.defaultPrevented) {
      return;
    }

    const form = getEventTargetForm(domEvent.target);
    if (!form?.action) {
      return;
    }

    const event = this.dispatchNavigation({
      href: form.action,
      source: "form-submit",
      method: getString(form.method, "get").toLowerCase(),
      external: !this.isInternalProtocol(form.action),
    });
    if (event.defaultPrevented) {
      domEvent.preventDefault();
      domEvent.stopImmediatePropagation();
      return;
    }
    if (event.href != event.originalHref) {
      form.action = event.href;
    }
  }

  isInternalProtocol(href) {
    try {
      const protocol = new URL(String(href), this.window.location.href)
        .protocol;
      return ["http:", "https:", "about:", "blob:", "data:"].includes(protocol);
    } catch {
      return false;
    }
  }
}
