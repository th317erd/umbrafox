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
