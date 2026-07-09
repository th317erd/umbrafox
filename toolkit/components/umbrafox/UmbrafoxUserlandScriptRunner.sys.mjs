/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export const USERLAND_SCRIPT_WRAPPER_SIGNATURE = `async function (context)`;

export const USERLAND_SCRIPT_CONTEXT_DESTRUCTURING = `const {
  window,
  document,
  globalThis,
  location,
  navigator,
  console,
  alert,
  userland,
} = context;`;

function getScriptCode(script) {
  if (typeof script == "string") {
    return script;
  }
  if (!script || typeof script.code != "string") {
    throw new TypeError("Userland script code must be a string");
  }
  return script.code;
}

function getScriptLabel(script) {
  if (script && typeof script == "object") {
    return script.id || script.name || "anonymous";
  }
  return "anonymous";
}

function getScriptFilename(script, filename) {
  if (filename) {
    return filename;
  }
  const label = String(getScriptLabel(script)).replace(/[\r\n]/g, "");
  return `umbrafox-userland:${encodeURIComponent(label)}.mjs`;
}

function getBoundWindowFunction(windowObject, name) {
  const fn = windowObject?.[name];
  return typeof fn == "function" ? fn.bind(windowObject) : undefined;
}

function makeUserlandSandbox({ sandboxName, sandboxPrototype = null } = {}) {
  const options = {
    sandboxName,
    wantXrays: false,
  };
  if (sandboxPrototype) {
    options.sandboxPrototype = sandboxPrototype;
    options.sameZoneAs = sandboxPrototype;
  }

  return Cu.Sandbox(
    Services.scriptSecurityManager.getSystemPrincipal(),
    options
  );
}

export function createUserlandScriptWrapperSource(code) {
  if (typeof code != "string") {
    throw new TypeError("Userland script code must be a string");
  }

  return `(${USERLAND_SCRIPT_WRAPPER_SIGNATURE} {
  "use strict";
  ${USERLAND_SCRIPT_CONTEXT_DESTRUCTURING}

${code}
})`;
}

export function createSecretUserlandContext({
  script = null,
  userland = null,
} = {}) {
  if (userland?.createAPI) {
    return userland.createAPI(script);
  }
  if (userland) {
    return userland;
  }

  const info = Object.freeze({
    id: script?.id ?? null,
    name: script?.name ?? null,
    scope: script?.scope ? structuredClone(script.scope) : null,
    world: script?.world ?? "default",
  });
  const context = Object.create(null);
  context.info = info;
  return Object.freeze(context);
}

export function createUserlandScriptContext({
  window: windowObject = null,
  document: documentObject = undefined,
  globalThis: globalObject = undefined,
  location: locationObject = undefined,
  navigator: navigatorObject = undefined,
  console: consoleObject = undefined,
  userland = undefined,
  script = null,
} = {}) {
  const resolvedGlobal = globalObject ?? windowObject ?? globalThis;
  const resolvedWindow = windowObject ?? resolvedGlobal;
  const context = Object.create(null);

  context.window = resolvedWindow;
  context.document = documentObject ?? resolvedWindow?.document ?? null;
  context.globalThis = resolvedGlobal;
  context.location = locationObject ?? resolvedWindow?.location ?? null;
  context.navigator = navigatorObject ?? resolvedWindow?.navigator ?? null;
  context.console = consoleObject ?? resolvedWindow?.console ?? console;
  context.alert = getBoundWindowFunction(resolvedWindow, "alert");
  context.userland = createSecretUserlandContext({ script, userland });

  return Object.freeze(context);
}

export function compileUserlandScriptWrapper(
  script,
  {
    sandbox = null,
    sandboxName = null,
    sandboxPrototype = null,
    filename = null,
    lineNumber = 1,
  } = {}
) {
  const source = createUserlandScriptWrapperSource(getScriptCode(script));
  const resolvedFilename = getScriptFilename(script, filename);
  const resolvedSandbox =
    sandbox ??
    makeUserlandSandbox({
      sandboxName: sandboxName ?? resolvedFilename,
      sandboxPrototype,
    });

  return Cu.evalInSandbox(
    source,
    resolvedSandbox,
    "latest",
    resolvedFilename,
    lineNumber
  );
}

export async function runUserlandScript(
  script,
  contextOptions = {},
  options = {}
) {
  const context = createUserlandScriptContext({
    ...contextOptions,
    script,
  });
  const wrapper = compileUserlandScriptWrapper(script, options);
  return wrapper.call(options.thisValue ?? context.globalThis, context);
}

export async function runUserlandScripts(
  scripts,
  contextOptions = {},
  { enabledOnly = true, ...options } = {}
) {
  if (!Array.isArray(scripts)) {
    throw new TypeError("Userland scripts must be an array");
  }

  const results = [];
  for (const script of scripts) {
    if (enabledOnly && !script?.enabled) {
      continue;
    }
    results.push(await runUserlandScript(script, contextOptions, options));
  }
  return results;
}
