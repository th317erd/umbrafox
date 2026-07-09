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
