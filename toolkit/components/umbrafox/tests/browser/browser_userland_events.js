"use strict";

const { publishUserlandScripts } = ChromeUtils.importESModule(
  "resource://gre/modules/UmbrafoxUserlandScriptRegistry.sys.mjs"
);

const TEST_ORIGIN = "https://example.com";
const TEST_URL =
  `${TEST_ORIGIN}/browser/toolkit/components/umbrafox/tests/browser/` +
  "file_userland_events.html";
const ORDER_URL =
  `${TEST_ORIGIN}/browser/toolkit/components/umbrafox/tests/browser/` +
  "file_userland_order.html";
const META_REFRESH_URL =
  `${TEST_ORIGIN}/browser/toolkit/components/umbrafox/tests/browser/` +
  "file_userland_meta_refresh.html";
const SCRIPT_EVENT_URL =
  `${TEST_ORIGIN}/browser/toolkit/components/umbrafox/tests/browser/` +
  "file_userland_script_event.html";
const SCRIPT_EVENT_EXTERNAL_URL =
  `${TEST_ORIGIN}/browser/toolkit/components/umbrafox/tests/browser/` +
  "file_userland_script_event.js";
const RUNTIME_SCRIPT_EVENT_URL =
  `${TEST_ORIGIN}/browser/toolkit/components/umbrafox/tests/browser/` +
  "file_userland_runtime_script_event.html";

registerCleanupFunction(() => {
  publishUserlandScripts([]);
});

add_task(async function test_dialog_and_navigation_userland_events() {
  publishUserlandScripts([
    {
      id: "userland-events",
      name: "Userland events",
      enabled: true,
      scope: {
        origin: TEST_ORIGIN,
        targetKinds: ["document"],
        sourceUrlPattern: null,
      },
      world: "default",
      code: `
        const seen = [];
        const record = value => {
          seen.push(value);
          document.documentElement.setAttribute(
            "data-navigation-events",
            seen.join("|")
          );
        };

        userland.on("alert", event => {
          record("alert:" + event.message);
          document.documentElement.setAttribute(
            "data-alert-event-message",
            event.message
          );
          event.preventDefault();
        });

        userland.on("prompt", event => {
          record("prompt:" + event.message + ":" + event.defaultValue);
          event.respondWith("prompt handled");
        });

        userland.on("confirm", event => {
          record("confirm:" + event.message);
          event.respondWith(false);
        });

        userland.on("navigation", event => {
          record(
            "navigation:" + event.source + ":" + event.external + ":" +
              event.href
          );
          if (event.href.startsWith("zoom://")) {
            document.documentElement.setAttribute(
              "data-external-navigation-canceled",
              event.href
            );
            event.preventDefault();
            return;
          }
          if (event.href.endsWith("#assign")) {
            event.href = location.href.replace(/#.*/, "") +
              "#assign-rewritten";
            return;
          }
          if (event.href.endsWith("#href")) {
            document.documentElement.setAttribute(
              "data-location-href-canceled",
              event.href
            );
            event.preventDefault();
            return;
          }
          if (event.source == "anchor-click") {
            event.href = location.href.replace(
              "file_userland_events.html",
              "file_userland_events.html#rewritten"
            );
          }
        });
      `,
      createdAt: 0,
      updatedAt: 0,
    },
  ]);

  await BrowserTestUtils.withNewTab(TEST_URL, async browser => {
    await TestUtils.waitForCondition(
      () => browser.currentURI.ref == "rewritten",
      "The anchor navigation is rewritten to the userland-provided hash"
    );

    await SpecialPowers.spawn(browser, [], () => {
      content.wrappedJSObject.runLocationAssignProbe();
    });
    await TestUtils.waitForCondition(
      () => browser.currentURI.ref == "assign-rewritten",
      "location.assign navigation is rewritten by the native hook"
    );

    await SpecialPowers.spawn(browser, [], () => {
      content.wrappedJSObject.runLocationHrefProbe();
    });
    await TestUtils.waitForCondition(
      async () =>
        SpecialPowers.spawn(browser, [], () =>
          content.document.documentElement.hasAttribute(
            "data-location-href-canceled"
          )
        ),
      "location.href navigation is cancelled by the native hook"
    );

    await SpecialPowers.spawn(browser, [], () => {
      content.wrappedJSObject.runLocationExternalProbe();
    });
    await TestUtils.waitForCondition(
      async () =>
        SpecialPowers.spawn(
          browser,
          [],
          () =>
            content.document.documentElement.getAttribute(
              "data-external-navigation-canceled"
            ) == "zoom://location/456"
        ),
      "external location.href navigation is cancelled by the native hook"
    );

    const result = await SpecialPowers.spawn(browser, [], () => ({
      alertMessage: content.document.documentElement.getAttribute(
        "data-alert-event-message"
      ),
      promptResult:
        content.document.documentElement.getAttribute("data-prompt-result"),
      confirmResult: content.document.documentElement.getAttribute(
        "data-confirm-result"
      ),
      windowOpenResult: content.document.documentElement.getAttribute(
        "data-window-open-result"
      ),
      hrefCanceled: content.document.documentElement.getAttribute(
        "data-location-href-canceled"
      ),
      externalCanceled: content.document.documentElement.getAttribute(
        "data-external-navigation-canceled"
      ),
      navigationEvents: content.document.documentElement.getAttribute(
        "data-navigation-events"
      ),
      hash: content.location.hash,
    }));

    Assert.deepEqual(
      result,
      {
        alertMessage: "alert message",
        promptResult: "prompt handled",
        confirmResult: "false",
        windowOpenResult: "null",
        hrefCanceled: `${TEST_URL}#href`,
        externalCanceled: "zoom://location/456",
        navigationEvents:
          "alert:alert message|" +
          "prompt:prompt message:prompt default|" +
          "confirm:confirm message|" +
          "navigation:window.open:true:zoom://meeting/123|" +
          `navigation:anchor-click:false:${ORDER_URL}|` +
          `navigation:docshell:false:${TEST_URL}#assign|` +
          `navigation:docshell:false:${TEST_URL}#href|` +
          "navigation:docshell:true:zoom://location/456",
        hash: "#assign-rewritten",
      },
      "Userland handlers cancel dialogs, cancel external navigation, and rewrite document navigation"
    );
  });
});

add_task(async function test_native_meta_refresh_navigation_event() {
  publishUserlandScripts([
    {
      id: "userland-meta-refresh",
      name: "Userland meta refresh",
      enabled: true,
      scope: {
        origin: TEST_ORIGIN,
        targetKinds: ["document"],
        sourceUrlPattern: null,
      },
      world: "default",
      code: `
        userland.on("navigation", event => {
          if (!event.metaRefresh) {
            return;
          }
          document.documentElement.setAttribute(
            "data-meta-refresh-canceled",
            event.href
          );
          event.preventDefault();
        });
      `,
      createdAt: 0,
      updatedAt: 0,
    },
  ]);

  await BrowserTestUtils.withNewTab(META_REFRESH_URL, async browser => {
    await TestUtils.waitForCondition(
      async () =>
        SpecialPowers.spawn(browser, [], () =>
          content.document.documentElement.hasAttribute(
            "data-meta-refresh-canceled"
          )
        ),
      "meta refresh navigation is cancelled by the native hook"
    );

    Assert.equal(
      browser.currentURI.spec,
      META_REFRESH_URL,
      "The cancelled meta refresh leaves the original document loaded"
    );
  });
});

add_task(async function test_script_source_event_mutates_dom_script_source() {
  publishUserlandScripts([
    {
      id: "userland-script-source-event",
      name: "Userland script source event",
      enabled: true,
      scope: {
        origin: TEST_ORIGIN,
        targetKinds: ["document"],
        sourceUrlPattern: null,
      },
      world: "default",
      code: `
        window.scriptSourceEvents = [];
        userland.on("script", event => {
          window.scriptSourceEvents.push({
            uri: event.uri,
            kind: event.kind,
            inline: event.inline,
            external: event.external,
            module: event.module,
            parserInserted: event.parserInserted,
            sourceLength: event.sourceLength,
            receivedLength: event.receivedLength,
            size: event.size,
          });
          event.source = event.source
            .replace("original-inline", "mutated-inline")
            .replace("original-external", "mutated-external");
        });
      `,
      createdAt: 0,
      updatedAt: 0,
    },
  ]);

  await BrowserTestUtils.withNewTab(SCRIPT_EVENT_URL, async browser => {
    const result = await SpecialPowers.spawn(browser, [], () => {
      const window = content.wrappedJSObject;
      return {
        inlineValue: window.inlineScriptValue,
        externalValue: window.externalScriptValue,
        events: window.scriptSourceEvents.map(event => ({ ...event })),
      };
    });

    Assert.equal(
      result.inlineValue,
      "mutated-inline",
      "The script event mutates inline script source before it runs"
    );
    Assert.equal(
      result.externalValue,
      "mutated-external",
      "The script event mutates external script source before it runs"
    );
    Assert.equal(
      result.events.length,
      2,
      "A script event is dispatched for each DOM script source"
    );
    Assert.deepEqual(
      result.events.map(event => ({
        kind: event.kind,
        inline: event.inline,
        external: event.external,
        module: event.module,
        parserInserted: event.parserInserted,
      })),
      [
        {
          kind: "classic",
          inline: true,
          external: false,
          module: false,
          parserInserted: true,
        },
        {
          kind: "classic",
          inline: false,
          external: true,
          module: false,
          parserInserted: true,
        },
      ],
      "Script event metadata identifies inline and external classic scripts"
    );
    Assert.equal(
      result.events[0].uri,
      SCRIPT_EVENT_URL,
      "The inline script reports the document URI"
    );
    Assert.equal(
      result.events[1].uri,
      SCRIPT_EVENT_EXTERNAL_URL,
      "The external script reports the external source URI"
    );
    Assert.greater(
      result.events[0].sourceLength,
      0,
      "The inline event exposes the original source length"
    );
    Assert.equal(
      result.events[0].size,
      result.events[0].sourceLength,
      "The size alias matches the source length"
    );
    Assert.greater(
      result.events[1].receivedLength,
      0,
      "The external event exposes a received source length"
    );
  });
});

add_task(
  async function test_script_source_event_mutates_runtime_script_source() {
    publishUserlandScripts([
      {
        id: "userland-runtime-script-source-event",
        name: "Userland runtime script source event",
        enabled: true,
        scope: {
          origin: TEST_ORIGIN,
          targetKinds: ["document"],
          sourceUrlPattern: null,
        },
        world: "default",
        code: `
        const runtimeKinds = new Set([
          "direct-eval",
          "indirect-eval",
          "function",
        ]);
        window.runtimeScriptSourceEvents = [];
        userland.on("script", event => {
          if (!runtimeKinds.has(event.kind)) {
            return;
          }
          window.runtimeScriptSourceEvents.push({
            uri: event.uri,
            kind: event.kind,
            inline: event.inline,
            external: event.external,
            module: event.module,
            parserInserted: event.parserInserted,
            sourceLength: event.sourceLength,
            size: event.size,
          });
          event.source = event.source
            .replace("original-direct-eval", "mutated-direct-eval")
            .replace("original-indirect-eval", "mutated-indirect-eval")
            .replace("original-function-body", "mutated-function-body");
        });
      `,
        createdAt: 0,
        updatedAt: 0,
      },
    ]);

    await BrowserTestUtils.withNewTab(
      RUNTIME_SCRIPT_EVENT_URL,
      async browser => {
        const result = await SpecialPowers.spawn(browser, [], () => {
          const window = content.wrappedJSObject;
          return {
            directEvalValue: window.directEvalScriptValue,
            indirectEvalValue: window.indirectEvalScriptValue,
            functionValue: window.functionScriptValue,
            events: window.runtimeScriptSourceEvents.map(event => ({
              ...event,
            })),
          };
        });

        Assert.equal(
          result.directEvalValue,
          "mutated-direct-eval",
          "The script event mutates direct eval source before it compiles"
        );
        Assert.equal(
          result.indirectEvalValue,
          "mutated-indirect-eval",
          "The script event mutates indirect eval source before it compiles"
        );
        Assert.equal(
          result.functionValue,
          "mutated-function-body",
          "The script event mutates Function constructor body source before it compiles"
        );
        Assert.deepEqual(
          result.events.map(event => event.kind),
          ["direct-eval", "indirect-eval", "function"],
          "Runtime script event metadata identifies each runtime source kind"
        );
        for (const event of result.events) {
          Assert.equal(
            event.uri,
            RUNTIME_SCRIPT_EVENT_URL,
            "Runtime script events report the caller URI"
          );
          Assert.equal(
            event.inline,
            false,
            "Runtime script events are not inline"
          );
          Assert.equal(
            event.external,
            false,
            "Runtime script events are not external loads"
          );
          Assert.equal(
            event.module,
            false,
            "Runtime script events are not modules"
          );
          Assert.equal(
            event.parserInserted,
            false,
            "Runtime script events are not parser-inserted"
          );
          Assert.greater(
            event.sourceLength,
            0,
            "Runtime script events expose the original source length"
          );
          Assert.equal(
            event.size,
            event.sourceLength,
            "The size alias matches the runtime source length"
          );
        }
      }
    );
  }
);
