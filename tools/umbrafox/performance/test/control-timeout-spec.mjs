/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import test from "node:test";
import { setImmediate } from "node:timers";
import { connectControl } from "../helpers.mjs";

const discovery = {
  host: "localhost",
  port: 1234,
  path: "/umbrafox-control",
  token: "a".repeat(64),
  websocketUrl: `ws://localhost:1234/umbrafox-control?token=${"a".repeat(64)}`,
};

async function connect(t) {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const controller = new AbortController();
  let socket;
  /** Socket replies remain pending until the test supplies them. */
  class FakeSocket extends EventTarget {
    readyState = 1;
    sent = [];
    constructor() {
      super();
      socket = this;
      queueMicrotask(() => this.dispatchEvent(new Event("open")));
    }
    send(text) {
      this.sent.push(JSON.parse(text));
    }
    close() {
      this.readyState = 3;
      this.dispatchEvent(new Event("close"));
    }
    reply(id, result) {
      this.dispatchEvent(
        new MessageEvent("message", { data: JSON.stringify({ id, result }) })
      );
    }
  }
  const control = await connectControl(
    discovery,
    controller.signal,
    FakeSocket
  );
  t.after(() => {
    control.close();
    t.mock.timers.reset();
  });
  return { control, socket, controller };
}

test("explicit long reply budget survives the default cutoff and resolves at 48 seconds", async t => {
  const { control, socket } = await connect(t);
  let failure;
  const pending = control.request(
    "umbrafox.script.execute",
    { timeoutMs: 59000 },
    60000
  );
  pending.catch(error => {
    failure = error;
  });
  t.mock.timers.tick(15000);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(failure, undefined);
  t.mock.timers.tick(33000);
  socket.reply(1, { ok: true });
  assert.deepEqual(await pending, { ok: true });
});

test("default and explicit client deadlines reject independently and late replies cannot replace results", async t => {
  const { control, socket } = await connect(t);
  const ordinary = assert.rejects(
    control.request("umbrafox.status"),
    /timed out/
  );
  const long = control.request("umbrafox.script.execute", {}, 60000);
  const longRejected = assert.rejects(long, /timed out/);
  t.mock.timers.tick(15000);
  await ordinary;
  socket.reply(1, { late: true });
  t.mock.timers.tick(45000);
  await longRejected;
  socket.reply(2, { late: true });
  const next = control.request("umbrafox.status");
  socket.reply(3, { current: true });
  assert.deepEqual(await next, { current: true });
});

test("invalid reply budgets reject before sending or allocating pending requests", async t => {
  const { control, socket } = await connect(t);
  for (const timeout of [null, 0, -1, 60001, Infinity, NaN, 1.5, "60000", {}]) {
    const rejected = assert.rejects(
      control.request("umbrafox.status", {}, timeout),
      /timeout/
    );
    t.mock.timers.tick(60000);
    await rejected;
  }
  assert.equal(socket.sent.length, 0);
  for (const timeout of [1, 60000]) {
    const promise = control.request("umbrafox.status", {}, timeout);
    socket.reply(socket.sent.at(-1).id, { timeout });
    assert.deepEqual(await promise, { timeout });
  }
});

test("abort and socket failure retain authority over extended waits", async t => {
  const { control, socket, controller } = await connect(t);
  const first = assert.rejects(
    control.request("umbrafox.script.execute", {}, 60000)
  );
  controller.abort(new Error("owner stop"));
  await first;
  await assert.rejects(control.request("umbrafox.status", {}, 60000));
  socket.close();
  await assert.rejects(
    control.request("umbrafox.status", {}, 60000),
    /connection failed/
  );
});
