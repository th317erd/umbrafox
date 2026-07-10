/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const DIALOG_EVENT_TYPES = new Set(["alert", "prompt", "confirm"]);
const NAVIGATION_EVENT_TYPE = "navigation";
const SCRIPT_EVENT_TYPE = "script";
const REQUEST_EVENT_TYPE = "request";
const MUTATION_EVENT_TYPE = "mutation";
const NATIVE_NAVIGATION_TOPIC = "umbrafox-userland-navigation-attempt";
const NATIVE_SCRIPT_TOPIC = "umbrafox-userland-script-source";
const NATIVE_MUTATION_TOPIC = "umbrafox-userland-mutation-attempt";
const HTTP_ON_MODIFY_REQUEST_TOPIC = "http-on-modify-request";
const SUPPORTED_EVENT_TYPES = new Set([
  ...DIALOG_EVENT_TYPES,
  NAVIGATION_EVENT_TYPE,
  SCRIPT_EVENT_TYPE,
  REQUEST_EVENT_TYPE,
  MUTATION_EVENT_TYPE,
]);

const nativeNavigationControllers = new Map();
const nativeScriptControllers = new Map();
const nativeRequestControllers = new Map();
const nativeMutationControllers = new Map();
let nativeNavigationObserverRegistered = false;
let nativeScriptObserverRegistered = false;
let nativeRequestObserverRegistered = false;
let nativeMutationObserverRegistered = false;

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

const nativeScriptObserver = {
  observe(subject, topic) {
    if (topic != NATIVE_SCRIPT_TOPIC) {
      return;
    }

    const bag = subject.QueryInterface(Ci.nsIWritablePropertyBag2);
    const browsingContextId = bag.getPropertyAsUint64("browsingContextId");
    const controller =
      nativeScriptControllers.get(browsingContextId)?.deref() ?? null;
    if (!controller) {
      nativeScriptControllers.delete(browsingContextId);
      return;
    }
    if (!controller?.hasHandlers(SCRIPT_EVENT_TYPE)) {
      return;
    }

    const event = controller.dispatchScript({
      source: bag.getPropertyAsAString("source"),
      uri: bag.getPropertyAsAUTF8String("uri"),
      kind: bag.getPropertyAsAUTF8String("kind"),
      sourceLength: bag.getPropertyAsUint64("sourceLength"),
      receivedLength: bag.getPropertyAsUint64("receivedLength"),
      lineNumber: bag.getPropertyAsUint32("lineNumber"),
      columnNumber: bag.getPropertyAsUint32("columnNumber"),
      inline: bag.getPropertyAsBool("inline"),
      external: bag.getPropertyAsBool("external"),
      module: bag.getPropertyAsBool("module"),
      parserInserted: bag.getPropertyAsBool("parserInserted"),
      preload: bag.getPropertyAsBool("preload"),
      native: true,
    });

    if (event.responded) {
      event.source = getString(event.returnValue);
    } else if (event.defaultPrevented && event.source == event.originalSource) {
      event.source = "";
    }

    if (event.source != event.originalSource) {
      bag.setPropertyAsAString("source", getString(event.source));
    }
  },
};

const nativeMutationObserver = {
  observe(subject, topic) {
    try {
      if (topic != NATIVE_MUTATION_TOPIC) {
        return;
      }

      const bag = subject.QueryInterface(Ci.nsIWritablePropertyBag2);
      const browsingContextId = bag.getPropertyAsUint64("browsingContextId");
      const controller =
        nativeMutationControllers.get(browsingContextId)?.deref() ?? null;
      if (!controller) {
        nativeMutationControllers.delete(browsingContextId);
        return;
      }
      if (!controller?.hasHandlers(MUTATION_EVENT_TYPE)) {
        return;
      }

      const event = controller.dispatchMutation(readNativeMutationFields(bag));
      if (event.defaultPrevented) {
        bag.setPropertyAsBool("cancelled", true);
        return;
      }

      if (event.kind == "attribute") {
        if (event.newValue === null || event.newValue === undefined) {
          bag.setPropertyAsBool("hasNewValue", false);
        } else {
          bag.setPropertyAsBool("hasNewValue", true);
          bag.setPropertyAsAString("newValue", String(event.newValue));
        }
      } else if (event.kind == "characterData") {
        bag.setPropertyAsAString("newData", getString(event.newData));
      } else if (event.kind == "childList" && event.replacementNode) {
        bag.setPropertyAsInterface("replacementNode", event.replacementNode);
        bag.setPropertyAsBool("hasReplacementNode", true);
      }
    } catch (error) {
      console.error(error);
    }
  },
};

const nativeRequestObserver = {
  observe(subject, topic) {
    if (topic != HTTP_ON_MODIFY_REQUEST_TOPIC) {
      return;
    }

    const channel = subject.QueryInterface(Ci.nsIHttpChannel);
    const browsingContextId = getChannelBrowsingContextId(channel);
    if (!browsingContextId) {
      return;
    }

    const actor = getRequestActor(browsingContextId);
    if (!actor) {
      return;
    }

    dispatchParentRequestEvent(channel, actor, browsingContextId);
  },
};

function ensureNativeNavigationObserver() {
  if (nativeNavigationObserverRegistered) {
    return;
  }
  nativeNavigationObserverRegistered = true;
  Services.obs.addObserver(nativeNavigationObserver, NATIVE_NAVIGATION_TOPIC);
}

function ensureNativeScriptObserver() {
  if (nativeScriptObserverRegistered) {
    return;
  }
  nativeScriptObserverRegistered = true;
  Services.obs.addObserver(nativeScriptObserver, NATIVE_SCRIPT_TOPIC);
}

function ensureNativeRequestObserver() {
  if (nativeRequestObserverRegistered) {
    return;
  }
  if (Services.appinfo.processType != Services.appinfo.PROCESS_TYPE_DEFAULT) {
    return;
  }
  nativeRequestObserverRegistered = true;
  Services.obs.addObserver(nativeRequestObserver, HTTP_ON_MODIFY_REQUEST_TOPIC);
}

function ensureNativeMutationObserver() {
  if (nativeMutationObserverRegistered) {
    return;
  }
  nativeMutationObserverRegistered = true;
  Services.obs.addObserver(nativeMutationObserver, NATIVE_MUTATION_TOPIC);
}

export function ensureUmbrafoxUserlandRequestObserver() {
  ensureNativeRequestObserver();
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

function getBagBool(bag, name, fallback = false) {
  try {
    return bag.getPropertyAsBool(name);
  } catch {
    return fallback;
  }
}

function getBagNode(bag, name, hasName) {
  if (hasName && !getBagBool(bag, hasName)) {
    return null;
  }
  try {
    return Cu.waiveXrays(bag.getPropertyAsInterface(name, Ci.nsISupports));
  } catch {
    return null;
  }
}

function readNativeMutationFields(bag) {
  const kind = bag.getPropertyAsAUTF8String("kind");
  const target = getBagNode(bag, "target");
  const fields = {
    kind,
    target,
    native: true,
  };

  if (kind == "childList") {
    const addedNode = getBagNode(bag, "addedNode", "hasAddedNode");
    const removedNode = getBagNode(bag, "removedNode", "hasRemovedNode");
    return {
      ...fields,
      operation: bag.getPropertyAsAUTF8String("operation"),
      addedNodes: addedNode ? [addedNode] : [],
      removedNodes: removedNode ? [removedNode] : [],
      previousSibling: getBagNode(bag, "previousSibling", "hasPreviousSibling"),
      nextSibling: getBagNode(bag, "nextSibling", "hasNextSibling"),
    };
  }

  if (kind == "attribute") {
    const hasOldValue = getBagBool(bag, "hasOldValue");
    const hasNewValue = getBagBool(bag, "hasNewValue");
    return {
      ...fields,
      attributeName: bag.getPropertyAsAString("attributeName"),
      attributeNamespace: bag.getPropertyAsAString("attributeNamespace"),
      oldValue: hasOldValue ? bag.getPropertyAsAString("oldValue") : null,
      newValue: hasNewValue ? bag.getPropertyAsAString("newValue") : null,
    };
  }

  if (kind == "characterData") {
    return {
      ...fields,
      oldData: bag.getPropertyAsAString("oldData"),
      newData: bag.getPropertyAsAString("newData"),
    };
  }

  return fields;
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

function getChannelBrowsingContextId(channel) {
  const loadInfo = channel.loadInfo;
  return (
    loadInfo?.browsingContextID ||
    loadInfo?.targetBrowsingContextID ||
    loadInfo?.frameBrowsingContextID ||
    loadInfo?.associatedBrowsingContextID ||
    0
  );
}

function getRequestActor(browsingContextId) {
  const browsingContext = BrowsingContext.get(browsingContextId);
  return browsingContext?.currentWindowGlobal?.getActor("UmbrafoxUserland");
}

function readRequestHeaders(channel) {
  const headers = [];
  channel.visitRequestHeaders({
    QueryInterface: ChromeUtils.generateQI(["nsIHttpHeaderVisitor"]),
    visitHeader(name, value) {
      headers.push([name, value]);
    },
  });
  return headers;
}

function getRequestEventFields(channel, browsingContextId) {
  const loadInfo = channel.loadInfo;
  const url = channel.URI.spec;
  const method = channel.requestMethod;
  const headers = readRequestHeaders(channel);

  return {
    url,
    uri: url,
    originalUrl: url,
    originalUri: url,
    method,
    originalMethod: method,
    headers,
    originalHeaders: Object.freeze(Object.fromEntries(headers)),
    browsingContextId,
    targetBrowsingContextId: loadInfo?.targetBrowsingContextID ?? 0,
    frameBrowsingContextId: loadInfo?.frameBrowsingContextID ?? 0,
    associatedBrowsingContextId: loadInfo?.associatedBrowsingContextID ?? 0,
    innerWindowId: loadInfo?.innerWindowID ?? 0,
    contentPolicyType: loadInfo?.externalContentPolicyType ?? 0,
    privateBrowsing: (loadInfo?.originAttributes?.privateBrowsingId ?? 0) > 0,
    native: true,
  };
}

async function dispatchParentRequestEvent(channel, actor, browsingContextId) {
  let shouldResume = true;
  try {
    channel.suspend();
  } catch (error) {
    console.error(error);
    return;
  }

  try {
    const decision = await actor.sendQuery(
      "DispatchUserlandRequest",
      getRequestEventFields(channel, browsingContextId)
    );
    shouldResume = applyRequestDecision(channel, decision);
  } catch (error) {
    console.error(error);
  }

  if (shouldResume) {
    channel.resume();
  }
}

function getSyntheticResponseBody(response) {
  if (response === undefined || response === null) {
    return "";
  }
  if (typeof response == "string") {
    return response;
  }
  if (typeof response == "object") {
    if ("body" in response) {
      return getString(response.body);
    }
    if ("text" in response) {
      return getString(response.text);
    }
  }
  return String(response);
}

function getHeaderValue(headers, name) {
  if (!headers) {
    return null;
  }
  if (headers instanceof UserlandHeaders) {
    return headers.get(name);
  }
  const lowerName = name.toLowerCase();
  if (headers instanceof Map) {
    for (const [headerName, value] of headers) {
      if (String(headerName).toLowerCase() == lowerName) {
        return value;
      }
    }
    return null;
  }
  if (typeof headers == "object") {
    for (const headerName of Object.keys(headers)) {
      if (headerName.toLowerCase() == lowerName) {
        return headers[headerName];
      }
    }
  }
  return null;
}

function getSyntheticResponseContentType(response) {
  if (response && typeof response == "object") {
    const headerContentType = getHeaderValue(response.headers, "content-type");
    return getString(
      response.contentType ?? response.type ?? headerContentType,
      "text/plain;charset=utf-8"
    );
  }
  return "text/plain;charset=utf-8";
}

function makeSyntheticResponseURI(response) {
  const contentType = getSyntheticResponseContentType(response)
    .replace(/[\r\n,]/g, "")
    .trim();
  const body = encodeURIComponent(getSyntheticResponseBody(response));
  return Services.io.newURI(`data:${contentType || "text/plain"},${body}`);
}

function allowRedirectToDataURI(channel) {
  try {
    channel.loadInfo.allowInsecureRedirectToDataURI = true;
  } catch (error) {
    console.error(error);
  }
}

function applySyntheticCORSResponseHeaders(channel) {
  let origin = "";
  try {
    origin = channel.getRequestHeader("Origin");
  } catch {
    return;
  }
  if (!origin) {
    return;
  }

  try {
    channel.setResponseHeader("Access-Control-Allow-Origin", origin, false);
    channel.setResponseHeader(
      "Access-Control-Allow-Credentials",
      "true",
      false
    );
    channel.setResponseHeader(
      "Access-Control-Allow-Methods",
      channel.requestMethod,
      false
    );
    channel.setResponseHeader(
      "Access-Control-Allow-Headers",
      readRequestHeaders(channel)
        .map(([name]) => name)
        .join(","),
      false
    );
  } catch (error) {
    console.error(error);
  }
}

function serializeSyntheticResponse(response) {
  return {
    body: getSyntheticResponseBody(response),
    contentType: getSyntheticResponseContentType(response),
  };
}

function applyRequestDecision(channel, decision) {
  if (!decision) {
    return true;
  }

  if (decision.syntheticResponse) {
    channel.resume();
    try {
      channel.redirectTo(makeSyntheticResponseURI(decision.syntheticResponse));
      allowRedirectToDataURI(channel);
      applySyntheticCORSResponseHeaders(channel);
    } catch (error) {
      console.error(error);
    }
    return false;
  }

  if (decision.cancel) {
    channel.resume();
    try {
      channel.cancel(Cr.NS_ERROR_ABORT);
    } catch (error) {
      console.error(error);
    }
    return false;
  }

  if (decision.method) {
    channel.requestMethod = decision.method;
  }

  applyRequestHeaderChanges(channel, decision.headers);

  if (decision.url) {
    channel.redirectTo(Services.io.newURI(decision.url));
  }

  return true;
}

function applyRequestHeaderChanges(channel, changes = []) {
  for (const change of changes) {
    try {
      if (change.deleted) {
        channel.setRequestHeader(change.name, "", false);
      } else if (change.value === "") {
        channel.setEmptyRequestHeader(change.name);
      } else {
        channel.setRequestHeader(change.name, change.value, false);
      }
    } catch (error) {
      console.error(error);
    }
  }
}

function serializeRequestDecision(event) {
  if (event.responded) {
    return {
      syntheticResponse: serializeSyntheticResponse(event.returnValue),
    };
  }

  if (event.defaultPrevented) {
    return { cancel: true };
  }

  const url = getString(event.url ?? event.uri, event.originalUrl);
  const method = getString(event.method, event.originalMethod).toUpperCase();

  const decision = {};
  if (url && url != event.originalUrl) {
    decision.url = url;
  }
  if (method && method != event.originalMethod) {
    decision.method = method;
  }

  const headers = event.headers?.changesArray?.() ?? [];
  if (headers.length) {
    decision.headers = headers;
  }

  return Object.keys(decision).length ? decision : null;
}

export function dispatchUmbrafoxUserlandRequest(window, fields = {}) {
  const browsingContextId =
    fields.browsingContextId || getBrowsingContextId(window);
  const controller =
    nativeRequestControllers.get(browsingContextId)?.deref() ?? null;
  if (!controller) {
    nativeRequestControllers.delete(browsingContextId);
    return null;
  }
  if (!controller.hasHandlers(REQUEST_EVENT_TYPE)) {
    return null;
  }
  return controller.dispatchRequest(fields);
}

/**
 * Mutable request header collection exposed to userland request handlers.
 */
class UserlandHeaders {
  #headers = new Map();

  constructor(entries = []) {
    for (const [name, value] of entries) {
      this.#headers.set(String(name).toLowerCase(), {
        name: String(name),
        value: String(value),
        modified: false,
        deleted: false,
      });
    }
  }

  get(name) {
    const header = this.#headers.get(String(name).toLowerCase());
    return !header || header.deleted ? null : header.value;
  }

  has(name) {
    return this.get(name) !== null;
  }

  set(name, value) {
    const headerName = String(name);
    this.#headers.set(headerName.toLowerCase(), {
      name: headerName,
      value: String(value),
      modified: true,
      deleted: false,
    });
    return this;
  }

  delete(name) {
    const lowerName = String(name).toLowerCase();
    const header = this.#headers.get(lowerName);
    if (header) {
      header.modified = true;
      header.deleted = true;
      return true;
    }
    this.#headers.set(lowerName, {
      name: String(name),
      value: "",
      modified: true,
      deleted: true,
    });
    return false;
  }

  entries() {
    const entries = [];
    for (const header of this.#headers.values()) {
      if (!header.deleted) {
        entries.push([header.name, header.value]);
      }
    }
    return entries[Symbol.iterator]();
  }

  keys() {
    return this.entriesArray()
      .map(([name]) => name)
      [Symbol.iterator]();
  }

  values() {
    return this.entriesArray()
      .map(([, value]) => value)
      [Symbol.iterator]();
  }

  forEach(callback, thisArg = undefined) {
    for (const [name, value] of this.entries()) {
      callback.call(thisArg, value, name, this);
    }
  }

  toJSON() {
    return Object.fromEntries(this.entries());
  }

  [Symbol.iterator]() {
    return this.entries();
  }

  entriesArray() {
    return Array.from(this.entries());
  }

  changesArray() {
    const changes = [];
    for (const header of this.#headers.values()) {
      if (!header.modified) {
        continue;
      }
      changes.push({
        name: header.name,
        value: header.value,
        deleted: header.deleted,
      });
    }
    return changes;
  }
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

  block() {
    this.preventDefault();
  }

  respondWith(value) {
    this.returnValue = value;
    this._responded = true;
    this.preventDefault();
  }

  get responded() {
    return this._responded;
  }
}
/**
 * Cancellable event object passed to userland mutation handlers.
 */
class UserlandMutationEvent extends UserlandCancellableEvent {
  constructor(fields = {}) {
    super(MUTATION_EVENT_TYPE, fields);
    this.addedNodes = Object.freeze([...(fields.addedNodes ?? [])]);
    this.removedNodes = Object.freeze([...(fields.removedNodes ?? [])]);
    this.originalNewValue = fields.newValue;
    this.originalNewData = fields.newData;
    this.replacementNode = null;
  }

  replaceAddedNodes(...nodes) {
    if (this.kind != "childList") {
      return;
    }
    if (!nodes.length) {
      this.preventDefault();
      return;
    }

    this.replacementNode =
      nodes.length == 1 ? this.#coerceNode(nodes[0]) : this.#fragment(nodes);
  }

  replaceWith(...nodes) {
    this.replaceAddedNodes(...nodes);
  }

  #coerceNode(node) {
    if (node?.nodeType) {
      return node;
    }

    const document =
      this.target?.nodeType == this.target?.DOCUMENT_NODE
        ? this.target
        : this.target?.ownerDocument;
    return document?.createTextNode(String(node)) ?? null;
  }

  #fragment(nodes) {
    const document =
      this.target?.nodeType == this.target?.DOCUMENT_NODE
        ? this.target
        : this.target?.ownerDocument;
    const fragment = document?.createDocumentFragment();
    if (!fragment) {
      return null;
    }

    for (const node of nodes) {
      const coerced = this.#coerceNode(node);
      if (coerced) {
        fragment.append(coerced);
      }
    }
    return fragment;
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
    const event =
      type == MUTATION_EVENT_TYPE
        ? new UserlandMutationEvent(fields)
        : new UserlandCancellableEvent(type, fields);
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
      return;
    }
    if (type == SCRIPT_EVENT_TYPE) {
      this.installScriptHook();
      return;
    }
    if (type == REQUEST_EVENT_TYPE) {
      this.installRequestHook();
      return;
    }
    if (type == MUTATION_EVENT_TYPE) {
      this.installMutationHook();
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

  installScriptHook() {
    const browsingContextId = this.browsingContextId;
    if (!browsingContextId) {
      return;
    }

    ensureNativeScriptObserver();
    nativeScriptControllers.set(browsingContextId, new WeakRef(this));
  }

  dispatchScript(fields) {
    const source = getString(fields.source);
    return this.dispatch(SCRIPT_EVENT_TYPE, {
      ...fields,
      source,
      originalSource: source,
      url: fields.uri,
      size: fields.sourceLength,
    });
  }

  installRequestHook() {
    const browsingContextId = this.browsingContextId;
    if (!browsingContextId) {
      return;
    }

    ensureNativeRequestObserver();
    nativeRequestControllers.set(browsingContextId, new WeakRef(this));
  }

  dispatchRequest(fields) {
    const headers = Array.isArray(fields.headers) ? fields.headers : [];
    const event = this.dispatch(REQUEST_EVENT_TYPE, {
      ...fields,
      headers: new UserlandHeaders(headers),
      originalHeaders: Object.freeze(Object.fromEntries(headers)),
    });
    return serializeRequestDecision(event);
  }

  installMutationHook() {
    const browsingContextId = this.browsingContextId;
    if (!browsingContextId) {
      return;
    }

    ensureNativeMutationObserver();
    nativeMutationControllers.set(browsingContextId, new WeakRef(this));
  }

  dispatchMutation(fields) {
    return this.dispatch(MUTATION_EVENT_TYPE, fields);
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
