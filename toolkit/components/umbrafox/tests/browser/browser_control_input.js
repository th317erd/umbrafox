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

add_task(async function test_pointer_move_dispatches_trusted_mouse_events() {
  await UmbrafoxControlService.start();
  const discovery = JSON.parse(
    await IOUtils.readUTF8(UmbrafoxControlService.getStatusFilePath())
  );

  const tab = await BrowserTestUtils.openNewForegroundTab(
    gBrowser,
    `data:text/html;charset=utf-8,${encodeURIComponent(`
      <!doctype html>
      <style>
        html, body { margin: 0; width: 100%; height: 100%; }
      </style>
      <script>
        window.umbrafoxTestMoves = [];
        document.addEventListener("mousemove", event => {
          window.umbrafoxTestMoves.push({
            x: event.clientX,
            y: event.clientY,
            trusted: event.isTrusted,
          });
        });
      </script>
    `)}`
  );

  const response = await sendWebSocketCommand(discovery.websocketUrl, {
    id: 2,
    method: "umbrafox.input.pointerMove",
    params: {
      context: tab.linkedBrowser.browsingContext.id,
      fromX: 5,
      fromY: 5,
      x: 85,
      y: 45,
      durationMs: 0,
      steps: 4,
      profile: "linear",
      seed: 7,
    },
  });

  is(response.id, 2, "Response preserves the command id");
  ok(!response.error, "Pointer command did not return an error");
  is(response.result.path.length, 4, "Pointer command reports every step");
  Assert.deepEqual(
    response.result.path.at(-1),
    { x: 85, y: 45 },
    "Pointer path ends at the requested point"
  );

  const moves = await SpecialPowers.spawn(tab.linkedBrowser, [], () => {
    return content.wrappedJSObject.umbrafoxTestMoves;
  });
  is(moves.length, 4, "Page received one mousemove per pointer step");
  ok(
    moves.every(move => move.trusted),
    "Every mousemove is trusted"
  );
  Assert.deepEqual(
    moves.at(-1),
    { x: 85, y: 45, trusted: true },
    "Last mousemove lands at the requested point"
  );

  BrowserTestUtils.removeTab(tab);
});
