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

add_task(async function test_pointer_buttons_wheel_and_keyboard() {
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
        input { margin: 100px 0 0 8px; }
      </style>
      <input id="text">
      <script>
        window.umbrafoxTestEvents = [];
        for (const type of ["mousedown", "mouseup", "click", "wheel", "keydown", "keyup", "input"]) {
          document.addEventListener(type, event => {
            window.umbrafoxTestEvents.push({
              type,
              x: event.clientX,
              y: event.clientY,
              button: event.button,
              deltaY: event.deltaY,
              key: event.key,
              trusted: event.isTrusted,
              value: document.getElementById("text").value,
            });
          }, true);
        }
      </script>
    `)}`
  );
  const context = tab.linkedBrowser.browsingContext.id;

  try {
    const pointerDown = await sendWebSocketCommand(discovery.websocketUrl, {
      id: 3,
      method: "umbrafox.input.pointerDown",
      params: { context, x: 20, y: 30, button: 0 },
    });
    ok(!pointerDown.error, "pointerDown succeeded");

    const pointerUp = await sendWebSocketCommand(discovery.websocketUrl, {
      id: 4,
      method: "umbrafox.input.pointerUp",
      params: { context, button: 0 },
    });
    ok(!pointerUp.error, "pointerUp succeeded");

    const click = await sendWebSocketCommand(discovery.websocketUrl, {
      id: 5,
      method: "umbrafox.input.click",
      params: { context, x: 40, y: 50 },
    });
    ok(!click.error, "click succeeded");

    const wheel = await sendWebSocketCommand(discovery.websocketUrl, {
      id: 6,
      method: "umbrafox.input.wheel",
      params: { context, x: 60, y: 70, deltaY: 25 },
    });
    ok(!wheel.error, "wheel succeeded");

    await SpecialPowers.spawn(tab.linkedBrowser, [], () => {
      content.document.getElementById("text").focus();
    });

    const typed = await sendWebSocketCommand(discovery.websocketUrl, {
      id: 7,
      method: "umbrafox.input.type",
      params: { context, text: "abc" },
    });
    ok(!typed.error, "type succeeded");

    const keyDown = await sendWebSocketCommand(discovery.websocketUrl, {
      id: 8,
      method: "umbrafox.input.keyDown",
      params: { context, key: "\uE006" },
    });
    ok(!keyDown.error, "keyDown succeeded");

    const keyUp = await sendWebSocketCommand(discovery.websocketUrl, {
      id: 9,
      method: "umbrafox.input.keyUp",
      params: { context, key: "\uE006" },
    });
    ok(!keyUp.error, "keyUp succeeded");

    const events = await SpecialPowers.spawn(tab.linkedBrowser, [], () => {
      return content.wrappedJSObject.umbrafoxTestEvents;
    });
    ok(
      events.every(event => event.trusted),
      "All delivered input events are trusted"
    );

    const mouseDown = events.find(event => event.type === "mousedown");
    Assert.deepEqual(
      {
        type: mouseDown.type,
        x: mouseDown.x,
        y: mouseDown.y,
        button: mouseDown.button,
      },
      { type: "mousedown", x: 20, y: 30, button: 0 },
      "pointerDown delivered a primary-button mousedown"
    );

    const mouseUp = events.find(event => event.type === "mouseup");
    is(mouseUp.type, "mouseup", "pointerUp delivered a mouseup");
    is(mouseUp.x, 20, "pointerUp reused the last pointer x coordinate");
    is(mouseUp.y, 30, "pointerUp reused the last pointer y coordinate");

    const clickEvent = events.findLast(event => event.type === "click");
    is(clickEvent.x, 40, "click used the requested x coordinate");
    is(clickEvent.y, 50, "click used the requested y coordinate");

    const wheelEvent = events.find(event => event.type === "wheel");
    is(wheelEvent.x, 60, "wheel used the requested x coordinate");
    is(wheelEvent.y, 70, "wheel used the requested y coordinate");
    is(wheelEvent.deltaY, 25, "wheel used the requested delta");

    const inputEvent = events.findLast(event => event.type === "input");
    is(inputEvent.value, "abc", "type inserted text into the focused input");

    const keyDownEvent = events.find(
      event => event.type === "keydown" && event.key === "Enter"
    );
    ok(keyDownEvent, "keyDown delivered Enter");

    const keyUpEvent = events.find(
      event => event.type === "keyup" && event.key === "Enter"
    );
    ok(keyUpEvent, "keyUp delivered Enter");
  } finally {
    BrowserTestUtils.removeTab(tab);
  }
});
