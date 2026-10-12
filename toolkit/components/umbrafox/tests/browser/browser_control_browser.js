/* This Source Code Form is subject to the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { UmbrafoxControlService } = ChromeUtils.importESModule(
  "resource://gre/modules/UmbrafoxControlService.sys.mjs"
);

async function connectCommands() {
  await UmbrafoxControlService.start();
  const discovery = await IOUtils.readJSON(
    UmbrafoxControlService.getStatusFilePath()
  );
  const socket = new WebSocket(discovery.websocketUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = () => reject(new Error("Control connection failed"));
  });
  let id = 0;
  const pending = new Map();
  socket.onmessage = event => {
    const reply = JSON.parse(event.data);
    pending.get(reply.id)?.(reply);
  };
  registerCleanupFunction(() => socket.close());
  return async (method, params) => {
    const commandID = ++id;
    let timer;
    try {
      return await new Promise((resolve, reject) => {
        pending.set(commandID, resolve);
        // eslint-disable-next-line mozilla/no-arbitrary-setTimeout -- Failure watchdog, not a synchronization delay.
        timer = setTimeout(
          () => reject(new Error("Test command deadline")),
          15000
        );
        socket.send(JSON.stringify({ id: commandID, method, params }));
      });
    } finally {
      clearTimeout(timer);
      pending.delete(commandID);
    }
  };
}

async function publicSurface(browser) {
  return SpecialPowers.spawn(browser, [], () => {
    return JSON.parse(
      content.wrappedJSObject.eval(`JSON.stringify({
      webdriver: navigator.webdriver,
      userAgent: navigator.userAgent,
      names: Object.getOwnPropertyNames(window).sort(),
      navigatorNames: Object.getOwnPropertyNames(Navigator.prototype).sort(),
      documentNames: Object.getOwnPropertyNames(Document.prototype).sort(),
      elementNames: Object.getOwnPropertyNames(Element.prototype).sort(),
      fetchSource: Function.prototype.toString.call(fetch),
      createElementSource: Function.prototype.toString.call(Document.prototype.createElement),
      hasServices: 'Services' in window,
      hasControl: 'UmbrafoxControlExecution' in window
    })`)
    );
  });
}

add_setup(async function () {
  await UmbrafoxControlService.resetForTests();
  registerCleanupFunction(() => UmbrafoxControlService.resetForTests());
});

add_task(async function test_authenticated_navigation_and_execution() {
  const tab = await BrowserTestUtils.openNewForegroundTab(
    gBrowser,
    "https://example.com/"
  );
  registerCleanupFunction(() => {
    if (tab.isConnected) {
      BrowserTestUtils.removeTab(tab);
    }
  });
  const command = await connectCommands();
  const context = tab.linkedBrowser.browsingContext.id;
  const before = await publicSurface(tab.linkedBrowser);
  const execute = params =>
    command("umbrafox.script.execute", { context, ...params });
  const read = await execute({
    body: "return {url: location.href, webdriver: navigator.webdriver, value: arguments[0] + 1};",
    args: [41],
  });
  is(
    read.result?.result.value.value,
    42,
    "Page execution receives cloned arguments"
  );
  is(
    read.result?.result.value.webdriver,
    before.webdriver,
    "Page execution preserves webdriver"
  );
  const after = await publicSurface(tab.linkedBrowser);
  Assert.strictEqual(
    JSON.stringify(after),
    JSON.stringify(before),
    "Execution does not install public globals or change webdriver"
  );
  const asynchronous = await execute({
    body: "return await Promise.resolve(17);",
  });
  is(asynchronous.result?.result.value, 17, "Promises are awaited");
  const undef = await execute({ body: "return undefined;" });
  is(
    undef.result?.result.type,
    "undefined",
    "Undefined is not converted to null"
  );
  const noPrivilege = await execute({ body: "return typeof Services;" });
  is(
    noPrivilege.result?.result.value,
    "undefined",
    "Page execution does not receive Services"
  );
  let chrome;
  await SpecialPowers.pushPrefEnv({
    set: [["security.allow_parent_unrestricted_js_loads", false]],
  });
  try {
    chrome = await execute({
      realm: "browser",
      body: "return {pid: Services.appinfo.processID, chrome: window.document.documentElement.getAttribute('windowtype')};",
    });
  } finally {
    await SpecialPowers.popPrefEnv();
  }
  is(
    chrome.result?.result.value.pid,
    Services.appinfo.processID,
    "Explicit browser realm runs in the parent"
  );
  is(
    chrome.result?.result.value.chrome,
    "navigator:browser",
    "Browser realm targets the containing chrome window"
  );
  const thrown = await execute({
    body: "throw new Error('expected failure');",
  });
  is(
    thrown.error?.code,
    "javascript error",
    "Script exception is a protocol error"
  );
  const invalid = await execute({ body: "return document;" });
  is(
    invalid.error?.code,
    "serialization error",
    "DOM objects do not become opaque empty JSON"
  );
  const timeout = await execute({
    body: "return new Promise(() => {});",
    timeoutMs: 50,
  });
  is(timeout.error?.code, "timeout", "Unsettled promise has a deadline");
  Assert.strictEqual(
    JSON.stringify(await publicSurface(tab.linkedBrowser)),
    JSON.stringify(before),
    "Success, exceptions and timeout preserve the actual page surface"
  );
  const oldDocument = read.result.document;
  const navigation = await command("umbrafox.browsingContext.navigate", {
    context,
    url: "https://example.org/",
    wait: "complete",
  });
  ok(
    navigation.result?.document,
    "Cross-origin navigation returns a document identity"
  );
  const newContext = navigation.result.context;
  const stale = await command("umbrafox.script.execute", {
    context: newContext,
    document: oldDocument,
    body: "return 1;",
  });
  is(stale.error?.code, "stale document", "Old-document execution is rejected");
  const fragment = await command("umbrafox.browsingContext.navigate", {
    context: newContext,
    url: "https://example.org/#fragment",
  });
  is(
    fragment.result?.url,
    "https://example.org/#fragment",
    "Same-document navigation completes"
  );
  const created = await command("umbrafox.browsingContext.create", {
    context: newContext,
  });
  ok(created.result?.context, "An explicit create command opens a blank tab");
  const createdContext = created.result.context;
  registerCleanupFunction(() => {
    const browser = BrowsingContext.get(createdContext)?.embedderElement;
    const createdTab = browser && gBrowser.getTabForBrowser(browser);
    if (createdTab) {
      BrowserTestUtils.removeTab(createdTab);
    }
  });
  const closed = await command("umbrafox.browsingContext.close", {
    context: createdContext,
  });
  ok(closed.result?.closed, "Only the explicitly targeted tab is closed");
});

add_task(async function test_private_and_container_execution() {
  const command = await connectCommands();
  const privateWindow = await BrowserTestUtils.openNewBrowserWindow({
    private: true,
  });
  try {
    for (const [window, userContextId] of [
      [privateWindow, 0],
      [globalThis.window, 1],
    ]) {
      const tab = BrowserTestUtils.addTab(
        window.gBrowser,
        "https://example.com/",
        { userContextId }
      );
      try {
        await BrowserTestUtils.browserLoaded(tab.linkedBrowser);
        const context = tab.linkedBrowser.browsingContext.id;
        const before = await publicSurface(tab.linkedBrowser);
        const reply = await command("umbrafox.script.execute", {
          context,
          body: "return location.hostname;",
        });
        is(
          reply.result?.result.value,
          "example.com",
          "Execution targets the requested isolated tab"
        );
        Assert.strictEqual(
          JSON.stringify(await publicSurface(tab.linkedBrowser)),
          JSON.stringify(before),
          "Isolated tab public surface is unchanged"
        );
        is(
          tab.linkedBrowser.contentPrincipal.originAttributes.userContextId,
          userContextId,
          "Container identity is unchanged"
        );
      } finally {
        BrowserTestUtils.removeTab(tab);
      }
    }
  } finally {
    await BrowserTestUtils.closeWindow(privateWindow);
  }
});
