/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

const { publishUserlandScripts } = ChromeUtils.importESModule(
  "resource://gre/modules/UmbrafoxUserlandScriptRegistry.sys.mjs"
);
const { getMatchingDocumentUserlandScripts, runDocumentStartUserlandScripts } =
  ChromeUtils.importESModule(
    "resource://gre/modules/UmbrafoxUserlandScriptRuntime.sys.mjs"
  );

function makeScript({
  id,
  origin = "https://example.com",
  enabled = true,
  code = "",
  targetKinds = ["document"],
}) {
  return {
    id,
    name: id,
    enabled,
    scope: {
      origin,
      targetKinds,
      sourceUrlPattern: null,
    },
    world: "default",
    code,
    createdAt: 0,
    updatedAt: 0,
  };
}

function makeWindow(href = "https://example.com/") {
  let blockedPromise = null;
  const window = {
    __order: [],
    location: new URL(href),
    navigator: {},
    document: {
      readyState: "loading",
      blockParsing(promise) {
        blockedPromise = promise;
      },
    },
  };

  return {
    window,
    get blockedPromise() {
      return blockedPromise;
    },
  };
}

registerCleanupFunction(() => {
  publishUserlandScripts([]);
});

add_task(async function test_document_runtime_filters_shared_scripts() {
  const matching = makeScript({ id: "matching" });
  publishUserlandScripts([
    matching,
    makeScript({ id: "disabled", enabled: false }),
    makeScript({ id: "other-origin", origin: "https://other.example" }),
    makeScript({ id: "worker", targetKinds: ["dedicated_worker"] }),
  ]);

  const { window } = makeWindow();
  Assert.deepEqual(
    getMatchingDocumentUserlandScripts(window),
    [matching],
    "Only enabled document scripts for the current origin match"
  );
});

add_task(
  async function test_document_runtime_blocks_parser_until_userland_awaits() {
    publishUserlandScripts([
      makeScript({
        id: "async-userland",
        code: `
        window.__order.push("userland-start");
        await Promise.resolve();
        window.__order.push("userland-end");
      `,
      }),
    ]);

    const state = makeWindow();
    const runPromise = runDocumentStartUserlandScripts(state.window);

    Assert.equal(
      state.blockedPromise,
      runPromise,
      "The parser is blocked on the exact userland execution promise"
    );
    Assert.deepEqual(
      state.window.__order,
      ["userland-start"],
      "The userland script starts before the simulated page script can run"
    );

    await state.blockedPromise;
    state.window.__order.push("page-script");

    Assert.deepEqual(
      state.window.__order,
      ["userland-start", "userland-end", "page-script"],
      "Page script execution waits until async userland work resolves"
    );
  }
);

add_task(async function test_document_runtime_skips_complete_documents() {
  publishUserlandScripts([
    makeScript({
      id: "complete-document",
      code: `window.__order.push("ran");`,
    }),
  ]);

  const state = makeWindow();
  state.window.document.readyState = "complete";

  await runDocumentStartUserlandScripts(state.window);

  Assert.equal(
    state.blockedPromise,
    null,
    "Complete documents are not parser-blocked"
  );
  Assert.deepEqual(
    state.window.__order,
    ["ran"],
    "Matching complete documents still run the explicit userland script"
  );
});
