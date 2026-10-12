/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import test from "node:test";
import {
  capturePlayback,
  summarizePlaybackInterval,
} from "../capture-playback.mjs";

function sample(time = 0) {
  return {
    document: 10,
    mediaAtMs: time,
    processAtMs: time + 10,
    media: {
      visibility: "visible",
      videoCount: 1,
      sourceHash: "a".repeat(64),
      paused: false,
      ended: false,
      seeking: false,
      rate: 1,
      time: time / 1000,
      width: 1920,
      height: 1080,
      readyState: 4,
      bufferAhead: 20,
      total: time * 0.06,
      dropped: time * 0.001,
    },
    processes: [
      { pid: 1, childID: 0, type: "browser", cpuTime: time * 500000 },
    ],
  };
}

test("frame deltas and nanosecond CPU use their separate sampled clocks", () => {
  const result = summarizePlaybackInterval(sample(), sample(2000));
  assert.equal(result.state, "observed-playback");
  assert.equal(result.frames, 120);
  assert.equal(result.dropped, 2);
  assert.equal(result.dropPercent, (100 * 2) / 120);
  assert.equal(result.cpu[0].percentOfOneCore, 50);
  assert.equal(result.minimumEndpointBufferSeconds, 20);
});

test("missing or malformed identities never produce accepted playback", () => {
  for (const value of [undefined, null, 0, -1, "10", NaN]) {
    const start = sample();
    const end = sample(2000);
    start.document = end.document = value;
    assert.equal(summarizePlaybackInterval(start, end).state, "excluded");
  }
  for (const value of [undefined, null, "", "fixture", "g".repeat(64)]) {
    const start = sample();
    const end = sample(2000);
    start.media.sourceHash = end.media.sourceHash = value;
    assert.equal(summarizePlaybackInterval(start, end).state, "excluded");
  }
  const start = sample();
  start.mediaAtMs = -1;
  assert.equal(
    summarizePlaybackInterval(start, sample(2000)).state,
    "excluded"
  );
});

test("CPU joins do not coerce invalid counters or accept ambiguous identities", () => {
  for (const value of [undefined, null, "0", NaN, Infinity, -1, 0.5, 2 ** 53]) {
    for (const endpoint of ["start", "end"]) {
      const pair = { start: sample(), end: sample(2000) };
      pair[endpoint].processes[0].cpuTime = value;
      assert.equal(
        summarizePlaybackInterval(pair.start, pair.end).cpu[0].percentOfOneCore,
        null
      );
    }
  }
  for (const mutate of [
    pair => pair.start.processes.push({ ...pair.start.processes[0] }),
    pair => pair.end.processes.push({ ...pair.end.processes[0] }),
    pair => (pair.end.processes[0].type = "web"),
    pair => (pair.end.processes[0].childID = null),
    pair => (pair.start.processes[0].pid = pair.end.processes[0].pid = null),
    pair =>
      (pair.start.processes[0].childID = pair.end.processes[0].childID =
        undefined),
    pair => (pair.start.processAtMs = -1),
    pair => (pair.end.processAtMs = Infinity),
  ]) {
    const pair = { start: sample(), end: sample(2000) };
    mutate(pair);
    const result = summarizePlaybackInterval(pair.start, pair.end);
    assert.equal(result.state, "observed-playback");
    assert(result.cpu.every(row => row.percentOfOneCore === null));
  }
});

test("zero CPU and multicore CPU remain valid with explicit nullable child IDs", () => {
  for (const [cpuTime, expected] of [
    [0, 0],
    [4000000000, 200],
  ]) {
    const start = sample();
    const end = sample(2000);
    start.processes[0].childID = end.processes[0].childID = null;
    end.processes[0].cpuTime = cpuTime;
    assert.equal(
      summarizePlaybackInterval(start, end).cpu[0].percentOfOneCore,
      expected
    );
  }
});

for (const [property, value, reason] of [
  ["paused", true, "inactive"],
  ["ended", true, "inactive"],
  ["seeking", true, "inactive"],
  ["visibility", "hidden", "inactive"],
  ["videoCount", 2, "ambiguous-video"],
  ["sourceHash", "another", "media-change"],
  ["width", 1280, "media-change"],
  ["rate", 2, "media-change"],
  ["total", -1, "invalid-counter"],
  ["dropped", NaN, "invalid-counter"],
  ["dropped", 121, "invalid-counter"],
  ["time", -1, "time-discontinuity"],
]) {
  test(`excludes ${property}=${value}`, () => {
    const end = sample(2000);
    end.media[property] = value;
    assert.equal(summarizePlaybackInterval(sample(), end).reason, reason);
  });
}

test("rejects reset counters, stale documents, backwards clocks and seeks", () => {
  const start = sample(2000);
  for (const mutate of [
    end => (end.document = 11),
    end => (end.media.total = 100),
    end => (end.media.dropped = 1),
    end => (end.mediaAtMs = 0),
    end => (end.media.time = 100),
  ]) {
    const end = sample(4000);
    mutate(end);
    assert.equal(summarizePlaybackInterval(start, end).state, "excluded");
  }
});

test("zero frame advance is not called smooth, and CPU resets stay unknown", () => {
  const end = sample(2000);
  end.media.total = end.media.dropped = 0;
  end.processes[0].cpuTime = -1;
  const result = summarizePlaybackInterval(sample(), end);
  assert.equal(result.state, "no-frame-advance");
  assert.equal(result.dropPercent, null);
  assert.equal(result.cpu[0].percentOfOneCore, null);
});

test("capture is read-only, bounded, sequential and strips URLs", async () => {
  const calls = [];
  const saved = [];
  let now = 0;
  let tick = 0;
  const request = async (method, params) => {
    calls.push([method, params]);
    now += 2;
    if (method === "umbrafox.script.execute") {
      const media = sample(tick++ * 2000).media;
      delete media.sourceHash;
      return {
        document: 10,
        url: "https://private.invalid/never-save",
        result: { type: "json", value: { ...media, source: "blob:private" } },
      };
    }
    return {
      processID: 1,
      process: {
        ...sample(now).processes[0],
        origin: "never-save",
        threads: [],
      },
    };
  };
  const result = await capturePlayback({
    request,
    context: 23,
    count: 3,
    now: () => now,
    wait: async ms => (now += ms),
    save: async record => saved.push(record),
  });
  assert.equal(saved.length, 3);
  assert.equal(result.intervals.length, 2);
  assert.equal(calls.length, 6);
  assert.equal(calls[2][1].document, 10);
  assert.equal(calls[1][1].includeWindows, false);
  assert(!JSON.stringify(saved).includes("private"));
  assert(!JSON.stringify(saved).includes("never-save"));
  assert.equal(saved[0].media.sourceHash.length, 64);
});

test("invalid count, aborted input and failures never start another sample", async () => {
  for (const count of [0, 32, 1.5]) {
    await assert.rejects(capturePlayback({ count, context: 23 }), /count/);
  }
  let calls = 0;
  await assert.rejects(
    capturePlayback({
      context: 23,
      count: 2,
      signal: AbortSignal.abort(),
      request: async () => calls++,
    })
  );
  assert.equal(calls, 0);
  await assert.rejects(
    capturePlayback({
      context: 23,
      count: 2,
      request: async () => {
        calls++;
        throw new Error("transport failure");
      },
    }),
    /transport failure/
  );
  assert.equal(calls, 1);
});

test("malformed media does not become a playback interval", () => {
  for (const [key, value] of [
    ["width", 0],
    ["height", null],
    ["bufferAhead", -1],
  ]) {
    const start = sample();
    const end = sample(2000);
    start.media[key] = end.media[key] = value;
    assert.equal(summarizePlaybackInterval(start, end).state, "excluded");
  }
});

test("a failed save cannot advance to the next sample", async () => {
  let calls = 0;
  let waits = 0;
  await assert.rejects(
    capturePlayback({
      context: 23,
      count: 2,
      request: async method => {
        calls++;
        return method === "umbrafox.script.execute"
          ? { document: 10, result: { type: "json", value: { videoCount: 0 } } }
          : { process: sample().processes[0] };
      },
      save: async () => {
        throw new Error("Disk failure");
      },
      wait: async () => waits++,
    }),
    /Disk failure/
  );
  assert.equal(calls, 2);
  assert.equal(waits, 0);
});

test("oversized process trees fail rather than silently truncating", async () => {
  await assert.rejects(
    capturePlayback({
      context: 23,
      count: 2,
      request: async method =>
        method === "umbrafox.script.execute"
          ? { document: 10, result: { type: "json", value: { videoCount: 0 } } }
          : {
              process: {
                ...sample().processes[0],
                children: Array(513).fill(sample().processes[0]),
              },
            },
    }),
    /oversized/
  );
});

test("abort after media stops process query; malformed envelopes fail", async () => {
  const controller = new AbortController();
  let calls = 0;
  await assert.rejects(
    capturePlayback({
      context: 23,
      count: 2,
      signal: controller.signal,
      request: async () => {
        calls++;
        controller.abort();
        return {
          document: 10,
          result: { type: "json", value: { videoCount: 0 } },
        };
      },
    })
  );
  assert.equal(calls, 1);
  for (const reply of [
    null,
    {},
    { document: 0, result: { type: "json", value: { videoCount: 0 } } },
  ]) {
    await assert.rejects(
      capturePlayback({ context: 23, count: 2, request: async () => reply })
    );
  }
});
