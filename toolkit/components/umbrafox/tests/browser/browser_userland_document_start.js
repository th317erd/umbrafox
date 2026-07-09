"use strict";

const { publishUserlandScripts } = ChromeUtils.importESModule(
  "resource://gre/modules/UmbrafoxUserlandScriptRegistry.sys.mjs"
);

const TEST_ORIGIN = "https://example.com";
const TEST_URL =
  `${TEST_ORIGIN}/browser/toolkit/components/umbrafox/tests/browser/` +
  "file_userland_order.html";

registerCleanupFunction(() => {
  publishUserlandScripts([]);
});

add_task(async function test_userland_document_start_runs_before_page_script() {
  const alertPromise = BrowserTestUtils.promiseAlertDialogOpen("accept");

  publishUserlandScripts([
    {
      id: "document-start-order",
      name: "Document start order",
      enabled: true,
      scope: {
        origin: TEST_ORIGIN,
        targetKinds: ["document"],
        sourceUrlPattern: null,
      },
      world: "default",
      code: `
        document.documentElement.setAttribute(
          "data-userland-order",
          "userland-start"
        );
        document.documentElement.setAttribute(
          "data-userland-alert-type",
          typeof alert
        );
        alert("Hello from userland");
        await Promise.resolve();
        document.documentElement.setAttribute(
          "data-userland-order",
          document.documentElement.getAttribute("data-userland-order") +
            ",userland-end"
        );
      `,
      createdAt: 0,
      updatedAt: 0,
    },
  ]);

  await BrowserTestUtils.withNewTab(TEST_URL, async browser => {
    await alertPromise;

    const result = await SpecialPowers.spawn(browser, [], () => {
      const { getMatchingDocumentUserlandScripts } = ChromeUtils.importESModule(
        "resource://gre/modules/UmbrafoxUserlandScriptRuntime.sys.mjs"
      );
      return {
        matchingScriptIds: getMatchingDocumentUserlandScripts(content).map(
          script => script.id
        ),
        inlineScriptSaw: content.document.documentElement.getAttribute(
          "data-userland-order-at-inline-script"
        ),
        finalOrder: content.document.documentElement.getAttribute(
          "data-userland-order"
        ),
        bareAlertType: content.document.documentElement.getAttribute(
          "data-userland-alert-type"
        ),
      };
    });

    Assert.deepEqual(
      result.matchingScriptIds,
      ["document-start-order"],
      "The content process can see the published matching userland script"
    );
    Assert.deepEqual(
      result.inlineScriptSaw,
      "userland-start,userland-end",
      "The inline page script sees async userland work already completed"
    );
    Assert.deepEqual(
      result.finalOrder,
      "userland-start,userland-end,page-script",
      "The page script runs after the awaited userland script"
    );
    Assert.equal(
      result.bareAlertType,
      "function",
      "Userland scripts can resolve page globals such as bare alert"
    );
  });
});

add_task(
  async function test_enabled_script_runs_after_content_process_already_exists() {
    publishUserlandScripts([]);

    await BrowserTestUtils.withNewTab("https://example.com/", async browser => {
      publishUserlandScripts([
        {
          id: "late-enabled-script",
          name: "Late enabled script",
          enabled: true,
          scope: {
            origin: TEST_ORIGIN,
            targetKinds: ["document"],
            sourceUrlPattern: null,
          },
          world: "default",
          code: `
            document.documentElement.setAttribute(
              "data-userland-late-enabled",
              "ran"
            );
          `,
          createdAt: 0,
          updatedAt: 0,
        },
      ]);

      BrowserTestUtils.startLoadingURIString(browser, TEST_URL);
      await BrowserTestUtils.browserLoaded(browser, false, TEST_URL);

      const result = await SpecialPowers.spawn(browser, [], () =>
        content.document.documentElement.getAttribute(
          "data-userland-late-enabled"
        )
      );

      Assert.equal(
        result,
        "ran",
        "Scripts enabled after content process startup run on reload/navigation"
      );
    });
  }
);
