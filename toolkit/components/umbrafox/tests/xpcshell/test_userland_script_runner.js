/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

const {
  createUserlandScriptContext,
  createUserlandScriptWrapperSource,
  runUserlandScript,
  runUserlandScripts,
  USERLAND_SCRIPT_CONTEXT_DESTRUCTURING,
  USERLAND_SCRIPT_WRAPPER_SIGNATURE,
} = ChromeUtils.importESModule(
  "resource://gre/modules/UmbrafoxUserlandScriptRunner.sys.mjs"
);

add_task(async function test_wrapper_signature_and_context_object() {
  const source = createUserlandScriptWrapperSource(
    "return userland.info.name;"
  );

  Assert.stringContains(
    source,
    `(${USERLAND_SCRIPT_WRAPPER_SIGNATURE} {`,
    "The generated wrapper uses an async single-context signature"
  );
  Assert.stringContains(source, '"use strict";', "The wrapper is strict");
  Assert.stringContains(
    source,
    USERLAND_SCRIPT_CONTEXT_DESTRUCTURING,
    "The wrapper destructures the agreed userland variables from context"
  );

  const windowObject = Object.create(null);
  const context = createUserlandScriptContext({
    window: windowObject,
    globalThis: windowObject,
    script: {
      id: "script-id",
      name: "Example",
      scope: {
        origin: "https://example.com",
        targetKinds: ["document"],
        sourceUrlPattern: null,
      },
      world: "default",
    },
  });

  Assert.ok(Object.isFrozen(context), "The outer context object is frozen");
  Assert.equal(context.window, windowObject, "window is passed by reference");
  Assert.equal(
    context.userland.info.name,
    "Example",
    "The private userland info is provided through the lexical context"
  );
});

add_task(async function test_userland_is_lexical_not_global() {
  const windowObject = Object.create(null);
  const result = await runUserlandScript(
    {
      id: "secret-test",
      name: "Secret Test",
      enabled: true,
      code: `
        return {
          secret: userland.secret,
          globalUserland: typeof globalThis.userland,
          windowUserland: typeof window.userland,
        };
      `,
    },
    {
      window: windowObject,
      globalThis: windowObject,
      userland: {
        secret: 42,
      },
    }
  );

  Assert.deepEqual(
    result,
    {
      secret: 42,
      globalUserland: "undefined",
      windowUserland: "undefined",
    },
    "The secret userland object is lexical and is not installed on globals"
  );
});

add_task(async function test_userland_controller_api_is_per_script() {
  const seen = [];
  const controller = {
    createAPI(script) {
      return Object.freeze({
        info: Object.freeze({
          id: script.id,
          name: script.name,
        }),
        mark(value) {
          seen.push(`${script.id}:${value}`);
        },
      });
    },
  };

  const result = await runUserlandScript(
    {
      id: "api-script",
      name: "API Script",
      enabled: true,
      code: `
        userland.mark(userland.info.name);
        return userland.info.id;
      `,
    },
    {
      window: Object.create(null),
      userland: controller,
    }
  );

  Assert.equal(result, "api-script", "The controller API gets script metadata");
  Assert.deepEqual(
    seen,
    ["api-script:API Script"],
    "The controller-created API is exposed to the script"
  );
});

add_task(async function test_page_console_and_alert_are_lexical() {
  const windowObject = {
    messages: [],
    console: {
      log(message) {
        windowObject.messages.push(`console:${message}`);
      },
    },
    alert(message) {
      this.messages.push(`alert:${message}`);
    },
  };

  await runUserlandScript(
    {
      id: "page-globals",
      name: "Page Globals",
      enabled: true,
      code: `
        console.log("Hello console");
        alert("Hello alert");
      `,
    },
    {
      window: windowObject,
      globalThis: windowObject,
    }
  );

  Assert.deepEqual(
    windowObject.messages,
    ["console:Hello console", "alert:Hello alert"],
    "Userland scripts use page-like console and alert bindings"
  );
});

add_task(async function test_async_scripts_are_awaited_before_next_script() {
  const windowObject = {
    order: [],
  };
  let resolveGate;
  const gate = new Promise(resolve => {
    resolveGate = resolve;
  });

  const runPromise = runUserlandScripts(
    [
      {
        id: "first",
        name: "First",
        enabled: true,
        code: `
          window.order.push("first-start");
          await userland.gate;
          window.order.push("first-end");
          return "first-result";
        `,
      },
      {
        id: "second",
        name: "Second",
        enabled: true,
        code: `
          window.order.push("second");
          return "second-result";
        `,
      },
      {
        id: "disabled",
        name: "Disabled",
        enabled: false,
        code: `window.order.push("disabled");`,
      },
    ],
    {
      window: windowObject,
      globalThis: windowObject,
      userland: {
        gate,
      },
    }
  );

  await Promise.resolve();
  Assert.deepEqual(
    windowObject.order,
    ["first-start"],
    "The second script does not run before the first async wrapper resolves"
  );

  resolveGate();
  Assert.deepEqual(
    await runPromise,
    ["first-result", "second-result"],
    "The batch runner resolves with enabled script results"
  );
  Assert.deepEqual(
    windowObject.order,
    ["first-start", "first-end", "second"],
    "Enabled scripts run sequentially and disabled scripts are skipped"
  );
});
