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

          window.requestEvents.push({
            url: event.url,
            method: event.method,
            accept: event.headers.get("Accept"),
            contentPolicyType: event.contentPolicyType,
          });

          if (event.url.endsWith("file_userland_request_original.txt")) {
            event.headers.set("X-Umbrafox-Userland-Test", "rewritten");
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
