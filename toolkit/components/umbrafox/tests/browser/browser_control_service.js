"use strict";

const { UmbrafoxControlService } = ChromeUtils.importESModule(
  "resource://gre/modules/UmbrafoxControlService.sys.mjs"
);

add_setup(async function () {
  await UmbrafoxControlService.resetForTests();
  registerCleanupFunction(async () => {
    await UmbrafoxControlService.resetForTests();
  });
});

function sendWebSocketCommand(url, command) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    socket.onerror = () => reject(new Error("WebSocket connection failed"));
    socket.onopen = () => socket.send(JSON.stringify(command));
    socket.onmessage = event => {
      socket.close();
      resolve(JSON.parse(event.data));
    };
  });
}

function findSnapshotTab(snapshot, browser) {
  const browsingContextId = browser.browsingContext.id;
  for (const win of snapshot.windows) {
    for (const tab of win.tabs) {
      if (tab.context === browsingContextId) {
        return tab;
      }
    }
  }
  return null;
}

add_task(async function test_control_service_status_and_webdriver_state() {
  const tab = await BrowserTestUtils.openNewForegroundTab(
    gBrowser,
    "data:text/html;charset=utf-8,webdriver"
  );
  const webdriverBefore = await SpecialPowers.spawn(
    tab.linkedBrowser,
    [],
    () => {
      return content.navigator.webdriver;
    }
  );

  const status = await UmbrafoxControlService.start();
  ok(status.running, "Umbrafox control service is running");
  is(status.channel, "umbrafox-control", "Reports the expected channel");

  const statusFile = UmbrafoxControlService.getStatusFilePath();
  ok(await IOUtils.exists(statusFile), "Status file was written");

  const discovery = JSON.parse(await IOUtils.readUTF8(statusFile));
  ok(discovery.websocketUrl, "Discovery file includes a WebSocket URL");
  ok(discovery.token, "Discovery file includes an access token");

  const rejectedUrl = new URL(discovery.websocketUrl);
  rejectedUrl.protocol = "http:";
  rejectedUrl.searchParams.set("token", "wrong-token");
  const rejectedResponse = await fetch(rejectedUrl);
  is(rejectedResponse.status, 403, "Wrong token is rejected before upgrade");

  const response = await sendWebSocketCommand(discovery.websocketUrl, {
    id: 1,
    method: "umbrafox.status",
    params: {},
  });
  is(response.id, 1, "Response preserves the command id");
  is(response.result.channel, "umbrafox-control", "Status command succeeded");

  const snapshotResponse = await sendWebSocketCommand(discovery.websocketUrl, {
    id: 2,
    method: "umbrafox.diagnostics.snapshot",
    params: {},
  });
  is(snapshotResponse.id, 2, "Diagnostics snapshot preserves the command id");
  is(
    snapshotResponse.result.channel,
    "umbrafox-control",
    "Diagnostics snapshot includes service status"
  );
  is(
    typeof snapshotResponse.result.processID,
    "number",
    "Diagnostics snapshot includes the process ID"
  );
  is(
    typeof snapshotResponse.result.profileDir,
    "string",
    "Diagnostics snapshot includes the profile directory"
  );
  ok(snapshotResponse.result.memory, "Diagnostics snapshot includes memory");
  ok(
    snapshotResponse.result.umbrafoxDiagnostics,
    "Diagnostics snapshot includes Umbrafox diagnostics"
  );
  ok(
    Array.isArray(snapshotResponse.result.windows),
    "Diagnostics snapshot includes browser windows"
  );
  const snapshotTab = findSnapshotTab(
    snapshotResponse.result,
    tab.linkedBrowser
  );
  ok(snapshotTab, "Diagnostics snapshot includes the test tab");
  is(
    snapshotTab.url,
    tab.linkedBrowser.currentURI.spec,
    "Diagnostics snapshot reports the test tab URL"
  );
  ok(snapshotTab.process, "Diagnostics snapshot reports process metadata");
  is(
    typeof snapshotTab.process.isRemoteBrowser,
    "boolean",
    "Process metadata reports remote browser state"
  );
  ok(
    Array.isArray(snapshotTab.process.pids),
    "Process metadata reports process IDs"
  );

  const rejectedDumpResponse = await sendWebSocketCommand(
    discovery.websocketUrl,
    {
      id: 3,
      method: "umbrafox.diagnostics.dumpMemoryReport",
      params: {
        filename: "../bad",
      },
    }
  );
  is(
    rejectedDumpResponse.error?.code,
    "invalid argument",
    "Memory report dump rejects path-like filenames"
  );

  const webdriverAfter = await SpecialPowers.spawn(
    tab.linkedBrowser,
    [],
    () => {
      return content.navigator.webdriver;
    }
  );
  is(
    webdriverAfter,
    webdriverBefore,
    "Umbrafox control service does not change WebDriver exposure"
  );
  BrowserTestUtils.removeTab(tab);
});
