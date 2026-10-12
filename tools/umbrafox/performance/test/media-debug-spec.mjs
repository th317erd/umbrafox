/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import test from "node:test";
import { setImmediate } from "node:timers";
import vm from "node:vm";
import { collectMediaDebug, mediaDebugRequest } from "../media-debug.mjs";

function fixture() {
  const video = {
    paused: true,
    currentTime: 5,
    mozRequestDebugInfo: async () => ({
      compositorDroppedFrames: 3,
      EMEInfo: { sessionsInfo: "private" },
      decoder: {
        hasVideo: true,
        instance: "private-address",
        reader: {
          videoDecoderName: "fixture decoder",
          videoType: "video/vp9",
          videoWidth: 1920,
          videoHeight: 1080,
          videoHardwareAccelerated: false,
          videoNumSamplesOutputTotal: 100,
          videoNumSamplesSkippedTotal: 2,
          frameStats: {
            droppedDecodedFrames: 1,
            droppedSinkFrames: 2,
            droppedCompositorFrames: 3,
          },
        },
      },
    }),
  };
  const target = {
    windowGlobalChild: { innerWindowId: 10 },
    document: { querySelectorAll: () => [video] },
  };
  return { video, target };
}

test("native debug projection distinguishes actual hardware state and strips private data", async () => {
  const { target } = fixture();
  const result = await collectMediaDebug(target, 10);
  assert.equal(result.document, 10);
  assert.equal(result.hardwareAccelerated, false);
  assert.equal(result.decoder, "fixture decoder");
  assert.equal(result.droppedDecodedFrames, 1);
  assert.equal(result.droppedSinkFrames, 2);
  assert.equal(result.droppedCompositorFrames, 3);
  assert(!JSON.stringify(result).includes("private"));
});

test("unknown hardware state is not reported as software decoding", async () => {
  const { video, target } = fixture();
  video.mozRequestDebugInfo = async () => ({});
  const result = await collectMediaDebug(target, 10);
  assert.equal(result.hardwareAccelerated, null);
  assert.equal(result.decoder, null);
});

test("no query on stale documents or ambiguous elements", async () => {
  const { video, target } = fixture();
  video.mozRequestDebugInfo = () => assert.fail("unexpected native call");
  await assert.rejects(collectMediaDebug(target, 11), /document/);
  target.document.querySelectorAll = () => [];
  await assert.rejects(collectMediaDebug(target, 10), /one video/);
  target.document.querySelectorAll = () => [video, video];
  await assert.rejects(collectMediaDebug(target, 10), /one video/);
});

test("rejects replacement during query, missing API, oversized data and query failure", async () => {
  for (const mode of ["document", "element", "missing", "oversized", "error"]) {
    const { video, target } = fixture();
    const read = video.mozRequestDebugInfo;
    video.mozRequestDebugInfo = async () => {
      if (mode === "document") {
        target.windowGlobalChild.innerWindowId++;
      }
      if (mode === "element") {
        target.document.querySelectorAll = () => [{}];
      }
      if (mode === "error") {
        throw new Error("native failure");
      }
      const data = await read();
      if (mode === "oversized") {
        data.decoder.reader.videoDecoderName = "x".repeat(513);
      }
      return data;
    };
    if (mode === "missing") {
      delete video.mozRequestDebugInfo;
    }
    await assert.rejects(collectMediaDebug(target, 10));
  }
});

function parentFixture(mode = "success") {
  const timers = new Map();
  const childTimers = new Map();
  const listeners = new Map();
  let timerID = 0;
  let loads = 0;
  let childTask;
  let resolveNative;
  let rejectNative;
  let messages = 0;
  const { target: content } = fixture();
  if (mode === "held-native") {
    content.document.querySelectorAll()[0].mozRequestDebugInfo = () =>
      new Promise((resolve, reject) => {
        resolveNative = resolve;
        rejectNative = reject;
      });
  }
  const browser = {
    browsingContext: { id: 23, currentWindowGlobal: { innerWindowId: 10 } },
    messageManager: {
      addMessageListener: (messageName, fn) => listeners.set(messageName, fn),
      removeMessageListener: (messageName, fn) => {
        assert.equal(listeners.get(messageName), fn);
        listeners.delete(messageName);
      },
      loadFrameScript(url, delayed, global) {
        loads++;
        assert.equal(delayed, false);
        assert.equal(global, true);
        if (mode === "load-failure") {
          throw new Error("load failure");
        }
        if (mode === "timeout") {
          return;
        }
        childTask = vm.runInNewContext(decodeURIComponent(url.split(",")[1]), {
          content,
          sendAsyncMessage(messageName, data) {
            messages++;
            if (mode === "parent-replaced") {
              browser.browsingContext.currentWindowGlobal.innerWindowId++;
            }
            listeners.get(messageName)?.({ target: browser, data });
          },
          ChromeUtils: {
            importESModule: () => ({
              setTimeout: (fn, ms) => {
                childTimers.set(++timerID, { fn, ms });
                return timerID;
              },
              clearTimeout: id => childTimers.delete(id),
            }),
          },
        });
      },
    },
  };
  const sandbox = {
    window: { gBrowser: { browsers: [browser] } },
    setTimeout: (fn, ms) => {
      timers.set(++timerID, { fn, ms });
      return timerID;
    },
    clearTimeout: id => timers.delete(id),
  };
  const params = mediaDebugRequest(23, 10, "fixture-123");
  const run = () =>
    vm.runInNewContext(
      `(async function(){${params.body}})`,
      sandbox
    )(...params.args);
  return {
    run,
    timers,
    childTimers,
    listeners,
    browser,
    browsers: sandbox.window.gBrowser.browsers,
    content,
    loads: () => loads,
    messages: () => messages,
    resolveNative: value => resolveNative(value),
    rejectNative: error => rejectNative(error),
    childTask: () => childTask,
  };
}

test("exact emitted parent and child scripts run once and clean their listener/timer", async () => {
  const fake = parentFixture();
  const result = await fake.run();
  await fake.childTask();
  assert.equal(result.decoder, "fixture decoder");
  assert.equal(fake.loads(), 1);
  assert.equal(fake.listeners.size, 0);
  assert.equal(fake.timers.size, 0);
  assert.equal(fake.childTimers.size, 0);
});

test("transport load failure, native rejection, stale return and timeout clean up", async () => {
  for (const mode of [
    "load-failure",
    "parent-replaced",
    "timeout",
    "native-failure",
  ]) {
    const fake = parentFixture(mode);
    if (mode === "native-failure") {
      fake.content.document.querySelectorAll = () => [];
    }
    const promise = fake.run();
    const rejected = assert.rejects(promise);
    if (mode === "timeout") {
      assert.equal([...fake.timers.values()][0].ms, 4000);
      [...fake.timers.values()][0].fn();
    }
    await rejected;
    await fake.childTask();
    assert.equal(fake.listeners.size, 0);
    assert.equal(fake.timers.size, 0);
  }
});

test("invalid identifiers fail before frame-script load", async () => {
  for (const args of [
    [0, 10, "valid"],
    [23, NaN, "valid"],
    [23, 10, 'bad"name'],
  ]) {
    assert.throws(() => mediaDebugRequest(...args));
  }
  const fake = parentFixture();
  fake.browser.browsingContext.currentWindowGlobal.innerWindowId++;
  await assert.rejects(fake.run(), /document/);
  assert.equal(fake.loads(), 0);
  assert.equal(fake.listeners.size, 0);
});

test("unloaded sibling tabs do not prevent querying the explicit live context", async () => {
  const fake = parentFixture();
  fake.browsers.unshift({ browsingContext: null });
  assert.equal((await fake.run()).decoder, "fixture decoder");
  assert.equal(fake.listeners.size, 0);
});

test("child timeout sends once, clears timers, and observes late native rejection", async () => {
  for (const rejectLate of [true, false]) {
    const fake = parentFixture("held-native");
    const rejected = assert.rejects(fake.run(), /query failed/);
    const timer = [...fake.childTimers.values()][0];
    assert.equal(timer.ms, 3000);
    timer.fn();
    await rejected;
    await fake.childTask();
    if (rejectLate) {
      fake.rejectNative(new Error("late native failure"));
    } else {
      fake.resolveNative({});
    }
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(fake.listeners.size, 0);
    assert.equal(fake.timers.size, 0);
    assert.equal(fake.childTimers.size, 0);
    assert.equal(fake.messages(), 1);
  }
});
