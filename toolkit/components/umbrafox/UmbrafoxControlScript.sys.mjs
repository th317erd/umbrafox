/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  setTimeout: "resource://gre/modules/Timer.sys.mjs",
  clearTimeout: "resource://gre/modules/Timer.sys.mjs",
});

export function controlError(code, message) {
  return Object.assign(new Error(message), { code });
}

export function controlTimeout(value = 10000) {
  if (!Number.isInteger(value) || value < 1 || value > 60000) {
    throw controlError(
      "invalid argument",
      "timeoutMs must be an integer from 1 to 60000"
    );
  }
  return value;
}

export function serializeScriptValue(value) {
  if (value === undefined) {
    return { type: "undefined" };
  }
  let nodes = 0;
  let characters = 0;
  const ancestors = new Set();
  const fail = () => {
    throw controlError(
      "serialization error",
      "Expected bounded JSON data without cycles, accessors or unsupported values"
    );
  };
  const visit = (item, depth) => {
    if (++nodes > 10000 || depth > 32) {
      fail();
    }
    if (typeof item === "string") {
      characters += item.length;
      if (characters > 1048576) {
        fail();
      }
      return item;
    }
    if (
      item === null ||
      typeof item === "boolean" ||
      (typeof item === "number" && Number.isFinite(item))
    ) {
      return item;
    }
    if (typeof item !== "object" || ancestors.has(item)) {
      fail();
    }
    const array = Array.isArray(item);
    const prototype = Object.getPrototypeOf(item);
    if (
      !array &&
      prototype !== null &&
      Object.getPrototypeOf(prototype) !== null
    ) {
      fail();
    }
    const descriptors = Object.getOwnPropertyDescriptors(item);
    if (Reflect.ownKeys(descriptors).some(key => typeof key !== "string")) {
      fail();
    }
    ancestors.add(item);
    const output = array ? [] : Object.create(null);
    if (array && (!Number.isInteger(item.length) || item.length > 10000)) {
      fail();
    }
    for (const key of Object.keys(descriptors)) {
      if (array && key === "length") {
        continue;
      }
      const descriptor = descriptors[key];
      if (
        !Object.hasOwn(descriptor, "value") ||
        !descriptor.enumerable ||
        (array &&
          (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= item.length))
      ) {
        fail();
      }
      characters += key.length;
      if (characters > 1048576) {
        fail();
      }
      Object.defineProperty(output, key, {
        value: visit(descriptor.value, depth + 1),
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }
    if (array && Object.keys(output).length !== item.length) {
      fail();
    }
    ancestors.delete(item);
    return output;
  };
  try {
    const output = visit(value, 0);
    if (new TextEncoder().encode(JSON.stringify(output)).length > 1048576) {
      fail();
    }
    return { type: "json", value: output };
  } catch {
    return fail();
  }
}

export function validateScriptParameters(params) {
  if (
    !params ||
    typeof params !== "object" ||
    Array.isArray(params) ||
    typeof params.body !== "string" ||
    params.body.length > 65536 ||
    !["page", "browser"].includes(params.realm ?? "page") ||
    !Array.isArray(params.args ?? []) ||
    (params.document !== undefined &&
      (!Number.isSafeInteger(params.document) || params.document < 1))
  ) {
    throw controlError(
      "invalid argument",
      "Invalid script body, realm, args or document"
    );
  }
  let args;
  try {
    args = serializeScriptValue(params.args ?? []).value;
  } catch {
    throw controlError(
      "invalid argument",
      "Script args must be bounded JSON data"
    );
  }
  return {
    ...params,
    args,
    realm: params.realm ?? "page",
    timeoutMs: controlTimeout(params.timeoutMs),
  };
}

export async function waitForControlOperation(promise, timeoutMs, signal) {
  let timer;
  let abort;
  const interrupted = new Promise((resolve, reject) => {
    abort = () =>
      reject(controlError("aborted", "Control operation was canceled"));
    if (signal?.aborted) {
      abort();
      return;
    }
    signal?.addEventListener("abort", abort, { once: true });
    timer = lazy.setTimeout(
      () => reject(controlError("timeout", "Control operation timed out")),
      timeoutMs
    );
  });
  try {
    return await Promise.race([interrupted, promise]);
  } finally {
    lazy.clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

export async function executeControlScript(window, params, signal) {
  const options = validateScriptParameters(params);
  if (signal?.aborted) {
    throw controlError("aborted", "Control operation was canceled");
  }
  const privileged = options.realm === "browser";
  const sandbox = Cu.Sandbox(
    privileged ? Services.scriptSecurityManager.getSystemPrincipal() : window,
    {
      sandboxPrototype: window,
      sameZoneAs: window,
      wantXrays: privileged,
      wantComponents: privileged,
    }
  );
  const destroyed = new AbortController();
  const onHide = () => destroyed.abort();
  window.addEventListener("pagehide", onHide, true);
  const combined = signal
    ? AbortSignal.any([signal, destroyed.signal])
    : destroyed.signal;
  try {
    sandbox.args = Cu.cloneInto(options.args, sandbox);
    if (privileged) {
      sandbox.Services = Services;
    }
    let value;
    try {
      value = await waitForControlOperation(
        Cu.evalInSandbox(
          `(async function() {\n${options.body}\n}).apply(window, args)`,
          sandbox,
          "latest",
          "",
          1,
          !privileged
        ),
        options.timeoutMs,
        combined
      );
    } catch (error) {
      if (combined.aborted) {
        throw controlError(
          "aborted",
          "Document unloaded or operation canceled"
        );
      }
      if (error?.code === "timeout") {
        throw error;
      }
      throw controlError(
        "javascript error",
        String(error?.message ?? error).slice(0, 4096)
      );
    }
    return serializeScriptValue(value);
  } finally {
    window.removeEventListener("pagehide", onHide, true);
    Cu.nukeSandbox(sandbox);
  }
}
