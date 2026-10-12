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
const REQUEST_EVENT_URL =
  `${TEST_ORIGIN}/browser/toolkit/components/umbrafox/tests/browser/` +
  "file_userland_request_event.html";

registerCleanupFunction(() => {
  publishUserlandScripts([]);
});

add_task(async function test_request_controllers_follow_document_identity() {
  publishUserlandScripts([]);
  await BrowserTestUtils.withNewTab(ORDER_URL, async browser => {
    const result = await SpecialPowers.spawn(
      browser,
      [ORDER_URL],
      async url => {
        const {
          UmbrafoxUserlandEventController,
          dispatchUmbrafoxUserlandRequest,
          prepareUmbrafoxUserlandRequestCapability,
        } = ChromeUtils.importESModule(
          "resource://gre/modules/UmbrafoxUserlandEventController.sys.mjs"
        );
        const frame = content.document.createElement("iframe");
        const loaded = () =>
          new Promise(resolve =>
            frame.addEventListener("load", resolve, { once: true })
          );
        try {
          const firstLoad = loaded();
          frame.src = `${url}?request-document=first`;
          content.document.body.appendChild(frame);
          await firstLoad;
          const browsingContextId =
            frame.contentWindow.windowGlobalChild.browsingContext.id;
          const firstCapability =
            await prepareUmbrafoxUserlandRequestCapability(frame.contentWindow);
          const first = new UmbrafoxUserlandEventController(
            Cu.waiveXrays(frame.contentWindow),
            { browsingContextId }
          );
          const firstID = first.innerWindowId;
          let firstCalls = 0;
          first.addEventListener("request", () => firstCalls++);
          dispatchUmbrafoxUserlandRequest(frame.contentWindow, {
            browsingContextId,
            innerWindowId: firstID,
          });
          const secondLoad = loaded();
          frame.src = `${url}?request-document=second`;
          await secondLoad;
          const current = frame.contentWindow;
          const secondID = current.windowGlobalChild.innerWindowId;
          dispatchUmbrafoxUserlandRequest(current, {
            browsingContextId,
            innerWindowId: secondID,
          });
          const firstCallsAfterNavigation = firstCalls;
          await prepareUmbrafoxUserlandRequestCapability(current);
          let oldCapabilityRejected = false;
          try {
            new UmbrafoxUserlandEventController(Cu.waiveXrays(current), {
              browsingContextId,
              requestCapability: firstCapability,
            });
          } catch {
            oldCapabilityRejected = true;
          }
          const second = new UmbrafoxUserlandEventController(
            Cu.waiveXrays(current),
            { browsingContextId }
          );
          let secondCalls = 0;
          second.addEventListener("request", () => secondCalls++);
          const oldHandler = () => firstCalls++;
          const removeOldHandler = first.addEventListener(
            "request",
            oldHandler
          );
          dispatchUmbrafoxUserlandRequest(current, {
            browsingContextId,
            innerWindowId: firstID,
          });
          dispatchUmbrafoxUserlandRequest(current, {
            browsingContextId,
            innerWindowId: secondID,
          });
          removeOldHandler();
          return {
            firstID,
            secondID,
            sameContext: second.browsingContextId === browsingContextId,
            capturedID: first.innerWindowId,
            firstCallsAfterNavigation,
            firstCalls,
            secondCalls,
            oldCapabilityRejected,
          };
        } finally {
          frame.remove();
        }
      }
    );
    Assert.ok(Number.isSafeInteger(result.firstID) && result.firstID > 0);
    Assert.ok(Number.isSafeInteger(result.secondID) && result.secondID > 0);
    Assert.notEqual(
      result.firstID,
      result.secondID,
      "Navigation creates a new document"
    );
    Assert.ok(result.sameContext, "The browsing context survives navigation");
    Assert.ok(
      result.oldCapabilityRejected,
      "An old grant cannot authorize the new document run"
    );
    Assert.equal(
      result.capturedID,
      result.firstID,
      "Old capability retains its document"
    );
    Assert.equal(
      result.firstCallsAfterNavigation,
      1,
      "New document skips the old handler"
    );
    Assert.equal(
      result.firstCalls,
      1,
      "Late old registration cannot steal new requests"
    );
    Assert.equal(
      result.secondCalls,
      1,
      "Only the current-document request is dispatched"
    );
  });
});

add_task(async function test_request_capability_is_acknowledged_by_parent() {
  publishUserlandScripts([]);
  await BrowserTestUtils.withNewTab(ORDER_URL, async browser => {
    const actor = Cu.waiveXrays(
      browser.browsingContext.currentWindowGlobal.getActor("UmbrafoxUserland")
    );
    Assert.equal(
      actor.hasRequestCapability,
      false,
      "A fresh document has no grant"
    );
    const identity = await SpecialPowers.spawn(browser, [], async () => {
      const {
        prepareUmbrafoxUserlandRequestCapability,
        UmbrafoxUserlandEventController,
      } = ChromeUtils.importESModule(
        "resource://gre/modules/UmbrafoxUserlandEventController.sys.mjs"
      );
      const window = Cu.waiveXrays(content);
      const browsingContextId = content.windowGlobalChild.browsingContext.id;
      let rejected = false;
      try {
        new UmbrafoxUserlandEventController(window, { browsingContextId });
      } catch {
        rejected = true;
      }
      await prepareUmbrafoxUserlandRequestCapability(window);
      const controller = new UmbrafoxUserlandEventController(window, {
        browsingContextId,
      });
      return {
        rejected,
        innerWindowId: controller.innerWindowId,
        browsingContextId,
      };
    });
    Assert.ok(
      identity.rejected,
      "Unprepared native controller construction rejects"
    );
    Assert.equal(identity.innerWindowId, actor.manager.innerWindowId);
    Assert.equal(identity.browsingContextId, browser.browsingContext.id);
    Assert.equal(
      actor.hasRequestCapability,
      true,
      "Parent grant precedes usable controller"
    );
    publishUserlandScripts([]);
    Assert.equal(
      actor.hasRequestCapability,
      true,
      "Registry removal does not revoke the grant"
    );
  });
});

add_task(async function test_request_fast_path_and_retained_late_handlers() {
  const { ensureUmbrafoxUserlandRequestObserver } = ChromeUtils.importESModule(
    "resource://gre/modules/UmbrafoxUserlandEventController.sys.mjs"
  );
  publishUserlandScripts([]);
  ensureUmbrafoxUserlandRequestObserver();
  await BrowserTestUtils.withNewTab(ORDER_URL, async browser => {
    const global = browser.browsingContext.currentWindowGlobal;
    const actor = Cu.waiveXrays(global.getActor("UmbrafoxUserland"));
    const original = actor.sendQuery;
    const descriptor = Object.getOwnPropertyDescriptor(actor, "sendQuery");
    const queries = [];
    actor.sendQuery = function (message, data) {
      if (
        message === "DispatchUserlandRequest" &&
        data.url.includes("request-fastpath=")
      ) {
        Assert.less(
          queries.length,
          32,
          "The bounded probe cannot accumulate unbounded queries"
        );
        queries.push({
          innerWindowId: data.innerWindowId,
          browsingContextId: data.browsingContextId,
        });
      }
      return original.call(this, message, data);
    };
    let reference;
    const fetchProbe = async (
      phase,
      expectedQueries,
      expectedCalls,
      action = null
    ) => {
      const result = await SpecialPowers.spawn(
        browser,
        [`${ORDER_URL}?request-fastpath=${phase}`, action],
        async (url, eventType) => {
          if (eventType) {
            content.dispatchEvent(new content.Event(eventType));
          }
          const response = await content.fetch(url, { cache: "no-store" });
          return {
            status: response.status,
            body: await response.text(),
            calls: Number(
              content.document.documentElement.getAttribute(
                "data-request-fast-count"
              ) || 0
            ),
          };
        }
      );
      Assert.equal(result.status, 200, phase);
      reference ??= result.body;
      Assert.equal(result.body, reference, `${phase} preserves the response`);
      Assert.ok(
        result.body.includes("data-userland-order"),
        "The expected fixture body was fetched"
      );
      Assert.equal(
        queries.length,
        expectedQueries,
        `${phase} actor query count`
      );
      Assert.equal(
        result.calls,
        expectedCalls,
        `${phase} retained handler count`
      );
    };
    try {
      Assert.ok(
        actor.canSkipRequest(browser.browsingContext.id, global.innerWindowId)
      );
      await fetchProbe("empty", 0, 0);
      publishUserlandScripts([
        {
          enabled: true,
          scope: { origin: "https://other.example", targetKinds: ["document"] },
        },
      ]);
      await fetchProbe("unrelated", 0, 0);
      publishUserlandScripts([
        {
          enabled: true,
          scope: { origin: TEST_ORIGIN, targetKinds: ["document"] },
        },
      ]);
      await fetchProbe("matching-pending", 1, 0);
      publishUserlandScripts([]);
      await SpecialPowers.spawn(browser, [], async () => {
        const {
          prepareUmbrafoxUserlandRequestCapability,
          UmbrafoxUserlandEventController,
        } = ChromeUtils.importESModule(
          "resource://gre/modules/UmbrafoxUserlandEventController.sys.mjs"
        );
        const requestCapability =
          await prepareUmbrafoxUserlandRequestCapability(content);
        const controller = new UmbrafoxUserlandEventController(
          Cu.waiveXrays(content),
          {
            browsingContextId: content.windowGlobalChild.browsingContext.id,
            requestCapability,
          }
        );
        let calls = 0;
        let remove;
        const handler = () =>
          content.document.documentElement.setAttribute(
            "data-request-fast-count",
            String(++calls)
          );
        content.addEventListener("test-request-on", () => {
          remove = controller.addEventListener("request", handler);
        });
        content.addEventListener("test-request-off", () => {
          remove?.();
        });
      });
      Assert.ok(actor.hasRequestCapability);
      Assert.ok(
        !actor.canSkipRequest(browser.browsingContext.id, global.innerWindowId)
      );
      await fetchProbe("capability-no-handler", 2, 0);
      await fetchProbe("late-on", 3, 1, "test-request-on");
      await fetchProbe("off", 4, 1, "test-request-off");
      await fetchProbe("on-again", 5, 2, "test-request-on");
      for (const query of queries) {
        Assert.equal(query.innerWindowId, global.innerWindowId);
        Assert.equal(query.browsingContextId, browser.browsingContext.id);
      }
    } finally {
      if (descriptor) {
        Object.defineProperty(actor, "sendQuery", descriptor);
      } else {
        delete actor.sendQuery;
      }
      publishUserlandScripts([]);
    }
    Assert.equal(
      Object.hasOwn(actor, "sendQuery"),
      !!descriptor,
      "Actor wrapper is restored"
    );
  });
});

async function retainRequestController(target) {
  return SpecialPowers.spawn(target, [], async () => {
    const {
      prepareUmbrafoxUserlandRequestCapability,
      UmbrafoxUserlandEventController,
    } = ChromeUtils.importESModule(
      "resource://gre/modules/UmbrafoxUserlandEventController.sys.mjs"
    );
    const requestCapability =
      await prepareUmbrafoxUserlandRequestCapability(content);
    const controller = new UmbrafoxUserlandEventController(
      Cu.waiveXrays(content),
      { requestCapability }
    );
    let calls = 0;
    content.addEventListener(
      "test-request-lifetime-enable",
      () => {
        controller.addEventListener("request", event => {
          if (event.url.includes("request-lifetime=")) {
            content.document.documentElement.setAttribute(
              "data-request-lifetime-count",
              String(++calls)
            );
          }
        });
      },
      { once: true }
    );
    content.addEventListener("pageshow", event => {
      content.document.documentElement.setAttribute(
        "data-request-lifetime-persisted",
        String(event.persisted)
      );
    });
    return requestCapability;
  });
}

async function checkLifetimeRequest(
  target,
  expectedQueries,
  expectedCalls,
  enable = false
) {
  const context = target.browsingContext ?? target;
  const global = context.currentWindowGlobal;
  const actor = Cu.waiveXrays(global.getActor("UmbrafoxUserland"));
  const descriptor = Object.getOwnPropertyDescriptor(actor, "sendQuery");
  const original = actor.sendQuery;
  const skipDescriptor = Object.getOwnPropertyDescriptor(
    actor,
    "canSkipRequest"
  );
  const originalSkip = actor.canSkipRequest;
  let classified = false;
  actor.canSkipRequest = function (contextId, innerWindowId) {
    const skip = originalSkip.call(this, contextId, innerWindowId);
    if (contextId === context.id && innerWindowId === global.innerWindowId) {
      classified ||= skip === (expectedQueries === 0);
    }
    return skip;
  };
  let queries = 0;
  actor.sendQuery = function (name, data) {
    if (
      name === "DispatchUserlandRequest" &&
      data.url.includes("request-lifetime=")
    ) {
      Assert.equal(data.innerWindowId, global.innerWindowId);
      Assert.equal(data.browsingContextId, context.id);
      queries++;
    }
    return original.call(this, name, data);
  };
  try {
    const result = await SpecialPowers.spawn(
      target,
      [enable],
      async enabled => {
        if (enabled) {
          content.dispatchEvent(
            new content.Event("test-request-lifetime-enable")
          );
        }
        const url = new content.URL(content.location.href);
        url.search = "?request-lifetime=probe";
        const response = await content.fetch(url, { cache: "no-store" });
        return {
          status: response.status,
          body: await response.text(),
          calls: Number(
            content.document.documentElement.getAttribute(
              "data-request-lifetime-count"
            ) || 0
          ),
        };
      }
    );
    Assert.equal(result.status, 200);
    Assert.ok(result.body.includes("data-userland-order"));
    Assert.ok(
      classified,
      "The native observer used the exact-document classifier"
    );
    Assert.equal(queries, expectedQueries, "Exact document actor query count");
    Assert.equal(
      result.calls,
      expectedCalls,
      "Retained handler dispatch count"
    );
  } finally {
    if (descriptor) {
      Object.defineProperty(actor, "sendQuery", descriptor);
    } else {
      delete actor.sendQuery;
    }
    if (skipDescriptor) {
      Object.defineProperty(actor, "canSkipRequest", skipDescriptor);
    } else {
      delete actor.canSkipRequest;
    }
  }
}

add_task(
  async function test_request_capability_survives_native_actor_recreation() {
    publishUserlandScripts([]);
    const actorOptions = {
      parent: {
        esModuleURI: "moz-src:///toolkit/actors/UmbrafoxUserlandParent.sys.mjs",
      },
      child: {
        esModuleURI: "moz-src:///toolkit/actors/UmbrafoxUserlandChild.sys.mjs",
        events: { DOMDocElementInserted: { capture: true } },
      },
      messageManagerGroups: ["browsers"],
      allFrames: true,
      safeForUntrustedWebProcess: true,
    };
    await BrowserTestUtils.withNewTab(ORDER_URL, async browser => {
      const global = browser.browsingContext.currentWindowGlobal;
      const actor = Cu.waiveXrays(global.getActor("UmbrafoxUserland"));
      await retainRequestController(browser);
      Assert.ok(actor.hasRequestCapability);
      ChromeUtils.unregisterWindowActor("UmbrafoxUserland");
      try {
        ChromeUtils.registerWindowActor("UmbrafoxUserland", actorOptions);
      } catch (error) {
        ChromeUtils.registerWindowActor("UmbrafoxUserland", actorOptions);
        throw error;
      }
      const replacement = Cu.waiveXrays(global.getActor("UmbrafoxUserland"));
      Assert.notEqual(
        replacement,
        actor,
        "The native actor was actually replaced"
      );
      Assert.equal(browser.browsingContext.currentWindowGlobal, global);
      Assert.ok(
        replacement.hasRequestCapability,
        "Grant belongs to native document, not actor instance"
      );
      Assert.ok(
        !replacement.canSkipRequest(
          browser.browsingContext.id,
          global.innerWindowId
        )
      );
      await checkLifetimeRequest(browser, 1, 1, true);
    });
  }
);

add_task(
  async function test_request_capability_survives_native_bfcache_restore() {
    publishUserlandScripts([]);
    await BrowserTestUtils.withNewTab(ORDER_URL, async browser => {
      const global = browser.browsingContext.currentWindowGlobal;
      const context = browser.browsingContext;
      const actor = Cu.waiveXrays(global.getActor("UmbrafoxUserland"));
      const receipt = await retainRequestController(browser);
      const nextURL = ORDER_URL.replace("example.com", "example.org");
      const loaded = BrowserTestUtils.browserLoaded(browser, false, nextURL);
      BrowserTestUtils.startLoadingURIString(browser, nextURL);
      await loaded;
      Assert.ok(global.isInBFCache, "The original document is actually cached");
      Assert.ok(!global.isCurrentGlobal);
      Assert.ok(!actor.canSkipRequest(context.id, global.innerWindowId));
      await checkLifetimeRequest(browser, 0, 0);
      const shown = BrowserTestUtils.waitForContentEvent(
        browser,
        "pageshow",
        true
      );
      browser.goBack();
      await shown;
      Assert.equal(
        browser.browsingContext.currentWindowGlobal,
        global,
        "Restores the same native WindowGlobal"
      );
      Assert.equal(global.innerWindowId, receipt.innerWindowId);
      Assert.equal(browser.browsingContext.id, receipt.browsingContextId);
      const persisted = await SpecialPowers.spawn(browser, [], () =>
        content.document.documentElement.getAttribute(
          "data-request-lifetime-persisted"
        )
      );
      Assert.equal(
        persisted,
        "true",
        "The pageshow event independently confirms restoration"
      );
      Assert.ok(actor.hasRequestCapability);
      await checkLifetimeRequest(browser, 1, 1, true);
    });
  }
);

add_task(
  async function test_request_capability_isolated_across_frames_and_origin_attributes() {
    publishUserlandScripts([]);
    await BrowserTestUtils.withNewTab(ORDER_URL, async browser => {
      await SpecialPowers.spawn(
        browser,
        [ORDER_URL.replace("example.com", "example.org")],
        async url => {
          const frame = content.document.createElement("iframe");
          const loaded = new Promise(resolve =>
            frame.addEventListener("load", resolve, { once: true })
          );
          frame.src = url;
          content.document.body.appendChild(frame);
          await loaded;
        }
      );
      const frame = browser.browsingContext.children[0];
      Assert.ok(frame && frame.currentWindowGlobal);
      await checkLifetimeRequest(frame, 0, 0);
      await retainRequestController(frame);
      await checkLifetimeRequest(frame, 1, 1, true);
      await checkLifetimeRequest(browser, 0, 0);
      const container = BrowserTestUtils.addTab(gBrowser, ORDER_URL, {
        userContextId: 1,
      });
      try {
        await BrowserTestUtils.browserLoaded(container.linkedBrowser);
        const attributes =
          container.linkedBrowser.contentPrincipal.originAttributes;
        Assert.equal(attributes.userContextId, 1);
        await checkLifetimeRequest(container.linkedBrowser, 0, 0);
        await retainRequestController(container.linkedBrowser);
        await checkLifetimeRequest(container.linkedBrowser, 1, 1, true);
        await checkLifetimeRequest(browser, 0, 0);
        const privateWindow = await BrowserTestUtils.openNewBrowserWindow({
          private: true,
        });
        try {
          await BrowserTestUtils.withNewTab(
            { gBrowser: privateWindow.gBrowser, url: ORDER_URL },
            async privateBrowser => {
              Assert.equal(
                privateBrowser.contentPrincipal.originAttributes
                  .privateBrowsingId,
                1
              );
              await checkLifetimeRequest(privateBrowser, 0, 0);
              await retainRequestController(privateBrowser);
              await checkLifetimeRequest(privateBrowser, 1, 1, true);
              await checkLifetimeRequest(browser, 0, 0);
            }
          );
        } finally {
          await BrowserTestUtils.closeWindow(privateWindow);
        }
      } finally {
        BrowserTestUtils.removeTab(container);
      }
    });
  }
);

add_task(async function test_native_navigation_inert_after_userland_disabled() {
  publishUserlandScripts([
    {
      id: "userland-disabled-navigation",
      name: "Disabled navigation probe",
      enabled: true,
      scope: {
        origin: TEST_ORIGIN,
        targetKinds: ["document"],
        sourceUrlPattern: null,
      },
      world: "default",
      code: `
        userland.on("navigation", event => {
          localStorage.setItem(
            "umbrafox-disabled-navigation-event",
            event.href
          );
        });
      `,
      createdAt: 0,
      updatedAt: 0,
    },
  ]);

  await BrowserTestUtils.withNewTab(ORDER_URL, async browser => {
    await SpecialPowers.spawn(browser, [], () => {
      content.localStorage.removeItem("umbrafox-disabled-navigation-event");
    });

    publishUserlandScripts([]);

    const loaded = BrowserTestUtils.browserLoaded(
      browser,
      false,
      SCRIPT_EVENT_URL
    );
    BrowserTestUtils.startLoadingURIString(browser, SCRIPT_EVENT_URL);
    await loaded;

    const disabledEventHref = await SpecialPowers.spawn(browser, [], () =>
      content.localStorage.getItem("umbrafox-disabled-navigation-event")
    );
    Assert.equal(
      disabledEventHref,
      null,
      "Native navigation events are not dispatched after userland scripts are disabled"
    );
  });
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

add_task(async function test_request_event_mutates_and_replaces_requests() {
  publishUserlandScripts([
    {
      id: "userland-request-event",
      name: "Userland request event",
      enabled: true,
      scope: {
        origin: TEST_ORIGIN,
        targetKinds: ["document"],
        sourceUrlPattern: null,
      },
      world: "default",
      code: `
        window.requestEvents = [];
        userland.on("request", event => {
          if (!event.url.includes("file_userland_request_")) {
            return;
          }

          const observed = {
            url: event.url,
            method: event.method,
            accept: event.headers.get("Accept"),
            originalAccept: Object.entries(event.originalHeaders).find(
              ([name]) => name.toLowerCase() == "accept"
            )?.[1] ?? null,
            originalHeadersFrozen: Object.isFrozen(event.originalHeaders),
            contentPolicyType: event.contentPolicyType,
          };
          window.requestEvents.push(observed);

          if (event.url.endsWith("file_userland_request_original.txt")) {
            event.headers.set("X-Umbrafox-Userland-Test", "rewritten");
            observed.originalUnchanged = !Object.keys(event.originalHeaders).some(
              name => name.toLowerCase() == "x-umbrafox-userland-test"
            );
            event.url = event.url.replace(
              "file_userland_request_original.txt",
              "file_userland_request_replacement.txt"
            );
            return;
          }

          if (event.url.endsWith("file_userland_request_blocked.txt")) {
            event.block();
            return;
          }

          if (event.url.endsWith("file_userland_request_synthetic.txt")) {
            event.respondWith({
              contentType: "application/json",
              body: '{"source":"synthetic"}',
            });
          }
        });
      `,
      createdAt: 0,
      updatedAt: 0,
    },
  ]);

  await BrowserTestUtils.withNewTab(REQUEST_EVENT_URL, async browser => {
    const result = await SpecialPowers.spawn(browser, [], async () => {
      const window = content.wrappedJSObject;
      const results = await window.requestEventResultsPromise;
      return {
        results: { ...results },
        events: window.requestEvents.map(event => ({ ...event })),
      };
    });

    Assert.equal(
      result.results.rewrittenText.trim(),
      "replacement request body",
      "The request event rewrites the request URL before send"
    );
    Assert.equal(
      result.results.blocked,
      true,
      "The request event can hard-cancel a request"
    );
    Assert.equal(
      result.results.syntheticText,
      '{"source":"synthetic"}',
      "The request event can provide a synthetic successful response"
    );
    Assert.equal(
      result.results.syntheticType,
      "application/json",
      "The synthetic response uses the requested content type"
    );
    Assert.deepEqual(
      result.events.map(event => event.method),
      ["GET", "GET", "GET", "GET"],
      "Request events expose the HTTP method"
    );
    Assert.ok(
      result.events.every(event => event.originalHeadersFrozen),
      "Every request event exposes a frozen original header snapshot"
    );
    Assert.deepEqual(
      result.events.map(event => event.originalAccept),
      result.events.map(event => event.accept),
      "Original Accept headers match mutable headers before userland changes"
    );
    Assert.ok(
      result.events.every(
        event =>
          typeof event.originalAccept == "string" && event.originalAccept.length
      ),
      "The header comparison includes actual nonempty request headers"
    );
    Assert.equal(
      result.events[0].originalUnchanged,
      true,
      "Mutating request headers leaves the original snapshot unchanged"
    );
    Assert.deepEqual(
      result.events.map(event =>
        event.url.substring(event.url.lastIndexOf("/") + 1)
      ),
      [
        "file_userland_request_original.txt",
        "file_userland_request_replacement.txt",
        "file_userland_request_blocked.txt",
        "file_userland_request_synthetic.txt",
      ],
      "Request events expose each original request URL"
    );
  });
});

add_task(async function test_mutation_event_controls_dom_mutations() {
  publishUserlandScripts([
    {
      id: "userland-mutation-event",
      name: "Userland mutation event",
      enabled: true,
      scope: {
        origin: TEST_ORIGIN,
        targetKinds: ["document"],
        sourceUrlPattern: null,
      },
      world: "default",
      code: `
        window.mutationEvents = [];
        userland.on("mutation", event => {
          window.mutationEvents.push({
            kind: event.kind,
            operation: event.operation ?? null,
            attributeName: event.attributeName ?? null,
            addedIds: (event.addedNodes ?? []).map(node => node.id ?? ""),
            removedIds: (event.removedNodes ?? []).map(node => node.id ?? ""),
            oldValue: event.oldValue ?? null,
            newValue: event.newValue ?? null,
            oldData: event.oldData ?? null,
            newData: event.newData ?? null,
          });

          if (event.kind == "childList") {
            if (event.addedNodes.some(node => node.id == "blocked-child")) {
              event.preventDefault();
            }
            for (const node of event.addedNodes) {
              if (node.id == "hidden-child") {
                node.style.display = "none";
              }
            }
            if (event.removedNodes.some(node => node.id == "kept-child")) {
              event.preventDefault();
            }
            if (
              event.addedNodes.some(
                node => node.id == "move-blocked" && node.parentNode
              )
            ) {
              event.preventDefault();
            }
          }

          if (event.kind == "attribute") {
            if (event.attributeName == "data-rewrite") {
              event.newValue = "rewritten";
            }
            if (event.attributeName == "data-block") {
              event.preventDefault();
            }
            if (
              event.attributeName == "data-remove-block" &&
              event.newValue === null
            ) {
              event.preventDefault();
            }
          }

          if (event.kind == "characterData") {
            event.newData = event.newData.replace("mutated", "rewritten");
          }
        });
      `,
      createdAt: 0,
      updatedAt: 0,
    },
  ]);

  await BrowserTestUtils.withNewTab(ORDER_URL, async browser => {
    const result = await SpecialPowers.spawn(browser, [], async () => {
      const window = content.wrappedJSObject;
      const parent = content.document.createElement("div");
      const moveSource = content.document.createElement("div");
      content.document.body.append(parent, moveSource);

      const mutationRecords = [];
      const observer = new content.MutationObserver(records => {
        for (const record of records) {
          mutationRecords.push({
            type: record.type,
            targetId: record.target.id,
            attributeName: record.attributeName,
            addedIds: Array.from(record.addedNodes, node => node.id ?? ""),
            removedIds: Array.from(record.removedNodes, node => node.id ?? ""),
          });
        }
      });
      observer.observe(parent, {
        attributes: true,
        characterData: true,
        childList: true,
        subtree: true,
      });

      const blocked = content.document.createElement("span");
      blocked.id = "blocked-child";
      const blockedReturn = parent.appendChild(blocked);

      const hidden = content.document.createElement("span");
      hidden.id = "hidden-child";
      parent.appendChild(hidden);

      const attr = content.document.createElement("span");
      parent.appendChild(attr);
      attr.setAttribute("data-rewrite", "original");
      attr.setAttribute("data-block", "blocked");
      attr.setAttribute("data-remove-block", "original");
      attr.removeAttribute("data-remove-block");

      const text = content.document.createTextNode("initial");
      parent.appendChild(text);
      text.data = "mutated";

      const kept = content.document.createElement("span");
      kept.id = "kept-child";
      parent.appendChild(kept);
      const removeReturn = parent.removeChild(kept);

      const moveBlocked = content.document.createElement("span");
      moveBlocked.id = "move-blocked";
      moveSource.appendChild(moveBlocked);
      parent.appendChild(moveBlocked);

      await Promise.resolve();
      observer.disconnect();

      return {
        blockedReturnIsNode: blockedReturn == blocked,
        blockedParent: blocked.parentNode?.id ?? null,
        blockedInserted: parent.contains(blocked),
        hiddenDisplay: hidden.style.display,
        rewriteAttr: attr.getAttribute("data-rewrite"),
        blockAttr: attr.getAttribute("data-block"),
        removeBlockAttr: attr.getAttribute("data-remove-block"),
        textData: text.data,
        removeReturnIsNode: removeReturn == kept,
        keptParentIsParent: kept.parentNode == parent,
        moveBlockedParentIsSource: moveBlocked.parentNode == moveSource,
        userlandEvents: window.mutationEvents.map(event => ({ ...event })),
        mutationRecords,
      };
    });

    Assert.deepEqual(
      {
        blockedReturnIsNode: result.blockedReturnIsNode,
        blockedParent: result.blockedParent,
        blockedInserted: result.blockedInserted,
        hiddenDisplay: result.hiddenDisplay,
        rewriteAttr: result.rewriteAttr,
        blockAttr: result.blockAttr,
        removeBlockAttr: result.removeBlockAttr,
        textData: result.textData,
        removeReturnIsNode: result.removeReturnIsNode,
        keptParentIsParent: result.keptParentIsParent,
        moveBlockedParentIsSource: result.moveBlockedParentIsSource,
      },
      {
        blockedReturnIsNode: true,
        blockedParent: null,
        blockedInserted: false,
        hiddenDisplay: "none",
        rewriteAttr: "rewritten",
        blockAttr: null,
        removeBlockAttr: "original",
        textData: "rewritten",
        removeReturnIsNode: true,
        keptParentIsParent: true,
        moveBlockedParentIsSource: true,
      },
      "Mutation handlers veto and rewrite DOM mutations while preserving return shapes"
    );

    Assert.ok(
      result.userlandEvents.some(
        event =>
          event.kind == "childList" && event.addedIds.includes("blocked-child")
      ),
      "Userland sees blocked child-list insertions"
    );
    Assert.ok(
      result.userlandEvents.some(
        event =>
          event.kind == "attribute" &&
          event.attributeName == "data-rewrite" &&
          event.newValue == "original"
      ),
      "Userland sees original attribute mutation values before rewrite"
    );
    Assert.ok(
      result.userlandEvents.some(
        event => event.kind == "characterData" && event.newData == "mutated"
      ),
      "Userland sees original character data before rewrite"
    );
    Assert.ok(
      !result.mutationRecords.some(record =>
        record.addedIds.includes("blocked-child")
      ),
      "Page MutationObserver does not receive records for vetoed insertions"
    );
    Assert.ok(
      !result.mutationRecords.some(record =>
        record.removedIds.includes("kept-child")
      ),
      "Page MutationObserver does not receive records for vetoed removals"
    );
  });
});
