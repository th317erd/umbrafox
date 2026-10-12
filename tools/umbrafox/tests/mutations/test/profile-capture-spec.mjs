/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import process from "node:process";
import { test } from "node:test";
import vm from "node:vm";
import * as profileModule from "../profile-capture.mjs";
import { DOM_CASES, expectedDOMSample } from "../fixture.mjs";
import {
  captureDOMProfile,
  main,
  preserveDOMProfile,
  PROFILE_BODIES,
  PROFILE_OPTIONS,
} from "../profile-capture.mjs";

function sampleResult() {
  const samples = [];
  const phases = [];
  for (const stage of ["warmup", "trial"]) {
    for (let index = 0; index < (stage === "warmup" ? 2 : 8); index++) {
      for (let position = 0; position < 8; position++) {
        const caseName = DOM_CASES[(index + position) % 8];
        phases.push({
          name: `dom-window-case-${stage}-${index}-${position}-${caseName}`,
          start: samples.length * 30 + 1,
          end: samples.length * 30 + 21,
        });
        samples.push({
          stage,
          index,
          position,
          name: caseName,
          durationMs: 10,
          ...expectedDOMSample(caseName),
        });
      }
    }
  }
  return {
    version: 2,
    realm: {
      globalIsWindow: true,
      objectPrototypeMatches: true,
      functionPrototypeMatches: true,
      collectorPrototypeMatches: true,
    },
    measurement: {
      version: 4,
      workload: "mixed-profile",
      timeOrigin: 100000,
      pass: { name: "dom-window-pass", start: 0, end: 2500 },
      phases,
      result: {
        version: 1,
        samples,
        totalMs: 2500,
        before: { visibility: "visible", webdriver: false, children: 0 },
        after: { visibility: "visible", webdriver: false, children: 0 },
      },
    },
  };
}

function fake({
  profiling = "on",
  workload = "mixed-profile",
  failureAt,
  saveFailure,
  mutate,
  preserveFailure,
  stopFailure,
} = {}) {
  const sampleOnly = profiling === "samples-only";
  const options = sampleOnly
    ? (profileModule.SAMPLE_ONLY_OPTIONS ?? PROFILE_OPTIONS)
    : PROFILE_OPTIONS;
  const bodies = sampleOnly
    ? (profileModule.SAMPLE_ONLY_BODIES ?? PROFILE_BODIES)
    : PROFILE_BODIES;
  const calls = [];
  const saved = [];
  const report = { pid: 9 };
  const failure = new Error("injected");
  let preserved = 0;
  const control = {
    request: async (method, params) => {
      calls.push({ method, params });
      if (calls.length === failureAt) {
        throw failure;
      }
      if (params.body === PROFILE_BODIES.stop && stopFailure) {
        throw stopFailure;
      }
      let reply;
      if (method === "umbrafox.performance.snapshot") {
        reply = {
          processID: 9,
          profiler: {
            active: profiling !== "off",
            elapsedTimeMs: calls.length === 4 ? 1000 : 3600,
            paused: false,
            samplingPaused: false,
            activeConfiguration: {
              features: [...options.features],
              threads: [...options.threads],
              interval: 2,
              capacity: 1048576,
              activeTabID: 0,
            },
          },
        };
      } else if (method === "umbrafox.performance.profile.dump") {
        reply = {
          path: "/owned/profile/umbrafox/diagnostics/profiles/dom-profile.json",
        };
      } else {
        let value;
        if (
          params.body === PROFILE_BODIES.state ||
          params.body === PROFILE_BODIES.stop
        ) {
          value = { pid: 9, active: false, profiler: false };
        } else if (params.body === bodies.start) {
          value = { pid: 9, active: false, profiler: true };
        } else if (params.body === PROFILE_BODIES.identity) {
          value = {
            webdriver: false,
            state: "complete",
            transportGlobalIsWindow: false,
          };
        } else {
          value = sampleResult();
          if (workload === "layout-interleaved") {
            value.measurement = {
              ...value.measurement.result,
              workload,
              samples: ["warmup", "trial"].flatMap(stage =>
                Array.from(
                  { length: stage === "warmup" ? 12 : 16 },
                  (_, index) => ({
                    stage,
                    index,
                    position: 0,
                    name: workload,
                    durationMs: 40,
                    ...expectedDOMSample(workload),
                  })
                )
              ),
            };
          }
          if (workload === "marker-calibration") {
            value.measurement = {
              version: 5,
              workload,
              timeOrigin: 100000,
              phases: ["control", "detached-text", "attached-text"].map(
                (caseName, index) => ({
                  name: `dom-pref-calibration-${caseName}`,
                  start: index * 30,
                  end: index * 30 + 1,
                })
              ),
              result: {
                before: value.measurement.result.before,
                after: value.measurement.result.after,
                totalMs: 90,
                samples: ["control", "detached-text", "attached-text"].map(
                  (caseName, index) => ({
                    name: caseName,
                    iterations: 1000,
                    checksum: index ? 98 : 499500,
                    durationMs: 1,
                  })
                ),
              },
            };
          }
        }
        reply = { context: 7, document: 11, result: { type: "json", value } };
      }
      mutate?.(reply, calls.length);
      return reply;
    },
  };
  return {
    calls,
    saved,
    report,
    failure,
    preserved: () => preserved,
    run: () =>
      captureDOMProfile({
        control,
        context: 7,
        report,
        profiling,
        workload,
        bounded: operation => operation(),
        save: async (fileName, value) => {
          saved.push({ name: fileName, value });
          if (fileName === saveFailure) {
            throw failure;
          }
        },
        preserve: async () => {
          preserved++;
          if (preserveFailure) {
            throw failure;
          }
        },
      }),
  };
}

test("window profile adapter keeps one fixed document, one pass and owned profiler shutdown", async () => {
  const value = fake();
  await value.run();
  assert.equal(value.calls.length, 8);
  assert.equal(value.saved.length, 8);
  assert.equal(value.preserved(), 1);
  assert.equal(value.report.profileStopped, true);
  assert.equal(value.report.sampleCount, 80);
  assert.equal(value.report.fixtureVersion, 4);
  assert.equal(value.report.execution, "window");
  assert.equal(value.report.profileRequested, PROFILE_OPTIONS);
  assert.equal(value.report.sampleWindow, undefined);
  assert.equal(value.calls[4].params.document, 11);
  assert.match(value.calls[4].params.body, /getElementById\("run"\)/);
  assert(!value.calls[4].params.body.includes("index < 262144"));
  assert.equal(value.calls.at(-1).params.body, PROFILE_BODIES.stop);
  const off = fake({ profiling: "off" });
  await off.run();
  assert.equal(off.calls.length, 6);
  assert.equal(off.preserved(), 0);
  assert.equal(off.report.profiling, "off");
  assert(
    off.calls.every(
      call =>
        ![PROFILE_BODIES.start, PROFILE_BODIES.stop].includes(call.params.body)
    )
  );
  const bad = fake({ profiling: "unknown" });
  await assert.rejects(bad.run());
  assert.equal(bad.calls.length, 0);
});

test("calibration uses the same capture and failure lifecycle with its own strict receipt", async () => {
  for (const profiling of ["on", "off"]) {
    const options = { workload: "marker-calibration", profiling };
    const success = fake(options);
    await success.run();
    assert.equal(success.report.fixtureVersion, 5);
    assert.equal(success.report.workload, "marker-calibration");
    assert.equal(success.report.sampleCount, 3);
    assert.equal(success.preserved(), profiling === "on" ? 1 : 0);
    for (let failureAt = 1; failureAt <= success.calls.length; failureAt++) {
      const failed = fake({ ...options, failureAt });
      await assert.rejects(failed.run(), error => error === failed.failure);
      if (profiling === "on" && failureAt >= 3) {
        assert.equal(failed.calls.at(-1).params.body, PROFILE_BODIES.stop);
      }
    }
    for (const { name: saveFailure } of success.saved) {
      const failed = fake({ ...options, saveFailure });
      await assert.rejects(failed.run(), error => error === failed.failure);
    }
    const index = profiling === "on" ? 5 : 4;
    for (const mutate of [
      r => r.document++,
      r => (r.result.value.measurement.version = 4),
      r => (r.result.value.measurement.result.samples[0].checksum = 1),
      r => (r.result.value.realm.globalIsWindow = false),
    ]) {
      const failed = fake({
        ...options,
        mutate: (reply, call) => {
          if (call === index) {
            mutate(reply);
          }
        },
      });
      await assert.rejects(failed.run());
      assert.equal(failed.saved.length, failed.calls.length);
    }
  }
  const invalid = fake({ workload: "invalid" });
  await assert.rejects(invalid.run());
  assert.equal(invalid.calls.length, 0);
  const failed = fake({
    workload: "marker-calibration",
    preserveFailure: true,
    stopFailure: new Error("stop"),
  });
  await assert.rejects(failed.run(), error => error === failed.failure);
});

test("every RPC/save failure preserves first error and attempts stop only after owned start", async () => {
  const success = fake();
  await success.run();
  for (let index = 1; index <= 8; index++) {
    const value = fake({ failureAt: index });
    await assert.rejects(value.run(), error => error === value.failure);
    if (index >= 3) {
      assert.equal(value.calls.at(-1).params.body, PROFILE_BODIES.stop);
    } else {
      assert.equal(value.calls.length, index);
    }
  }
  for (const { name: fileName } of success.saved) {
    const value = fake({ saveFailure: fileName });
    await assert.rejects(value.run(), error => error === value.failure);
    if (!["profile-before.json", "page-identity.json"].includes(fileName)) {
      assert.equal(value.calls.at(-1).params.body, PROFILE_BODIES.stop);
    }
  }
  for (const options of [
    { preserveFailure: true },
    { failureAt: 5, stopFailure: new Error("stop failed") },
  ]) {
    const value = fake(options);
    await assert.rejects(value.run(), error => error === value.failure);
    assert.equal(value.calls.at(-1).params.body, PROFILE_BODIES.stop);
  }
});

test("sampling-only records a strict native outer bracket without selecting marker threads", async () => {
  const value = fake({ profiling: "samples-only" });
  await value.run();
  const options = profileModule.SAMPLE_ONLY_OPTIONS;
  assert.equal(value.calls.length, 8);
  assert.equal(value.preserved(), 1);
  assert.equal(value.report.profiling, "samples-only");
  assert.equal(value.report.profileRequested, options);
  assert.equal(value.report.profileStopped, true);
  assert.equal(value.report.sampleCount, 80);
  assert.deepEqual(options.features, [
    ...PROFILE_OPTIONS.features,
    "samplingallthreads",
  ]);
  assert.deepEqual(options.threads, ["UmbraOwnedSamplesOnlyNoThreadSelection"]);
  assert(
    Object.isFrozen(options) &&
      Object.isFrozen(options.features) &&
      Object.isFrozen(options.threads)
  );
  assert.equal(options.entries, PROFILE_OPTIONS.entries);
  assert.equal(options.intervalMs, PROFILE_OPTIONS.intervalMs);
  assert.deepEqual(value.report.sampleWindow, {
    start: 1000,
    end: 3600,
    clock: "profiler-process-relative-ms",
    scope:
      "Outer workload bracket includes control and snapshot overhead; not per-case attribution.",
  });
});

test("isolated layout sampling keeps the original fixture and all failure lifecycle gates", async () => {
  for (const profiling of ["off", "samples-only"]) {
    const options = { profiling, workload: "layout-interleaved" };
    const success = fake(options);
    await success.run();
    assert.equal(success.report.sampleCount, 28);
    assert.equal(success.report.fixtureVersion, 6);
    assert.equal(success.report.workload, options.workload);
    assert.equal(success.report.workloadMs, 2500);
    assert.equal(success.preserved(), profiling === "off" ? 0 : 1);
    if (profiling === "samples-only") {
      assert.equal(success.report.sampleWindow.start, 1000);
      assert.equal(success.report.sampleWindow.end, 3600);
    }
    for (let failureAt = 1; failureAt <= success.calls.length; failureAt++) {
      const failed = fake({ ...options, failureAt });
      await assert.rejects(failed.run(), error => error === failed.failure);
      if (profiling === "samples-only" && failureAt >= 3) {
        assert.equal(failed.calls.at(-1).params.body, PROFILE_BODIES.stop);
      }
    }
    for (const { name: saveFailure } of success.saved) {
      const failed = fake({ ...options, saveFailure });
      await assert.rejects(failed.run(), error => error === failed.failure);
    }
    for (const change of [
      r => (r.document = 12),
      r => (r.result.value.realm.globalIsWindow = false),
      r => (r.result.value.measurement.workload = "layout-batched"),
      r => r.result.value.measurement.samples.pop(),
      r => r.result.value.measurement.samples[0].checksum++,
      r => (r.result.value.measurement.samples[0].durationMs = NaN),
    ]) {
      const failed = fake({
        ...options,
        mutate: (reply, index) => {
          if (index === (profiling === "off" ? 4 : 5)) {
            change(reply);
          }
        },
      });
      await assert.rejects(failed.run());
      assert(
        failed.saved.some(item => item.name === "dom-profile-samples.json")
      );
    }
  }
  const invalid = fake({ profiling: "on", workload: "layout-interleaved" });
  await assert.rejects(invalid.run());
  assert.equal(invalid.calls.length, 0);
  const failed = fake({
    profiling: "samples-only",
    workload: "layout-interleaved",
    preserveFailure: true,
    stopFailure: new Error("stop"),
  });
  await assert.rejects(failed.run(), error => error === failed.failure);
});

test("sampling-only rejects malformed brackets and marker-enabling configuration after preserving replies", async () => {
  for (const [at, mutate] of [
    [4, r => delete r.profiler.elapsedTimeMs],
    [4, r => (r.profiler.elapsedTimeMs = null)],
    [4, r => (r.profiler.elapsedTimeMs = NaN)],
    [4, r => (r.profiler.elapsedTimeMs = -1)],
    [6, r => (r.profiler.elapsedTimeMs = Infinity)],
    [6, r => (r.profiler.elapsedTimeMs = "3600")],
    [6, r => (r.profiler.elapsedTimeMs = 1000)],
    [6, r => (r.profiler.elapsedTimeMs = 999)],
    [4, r => (r.profiler.activeConfiguration.threads = [])],
    [4, r => (r.profiler.activeConfiguration.threads = ["GeckoMain"])],
    [6, r => r.profiler.activeConfiguration.features.push("markersallthreads")],
    [6, r => r.profiler.activeConfiguration.features.push("tracing")],
  ]) {
    const value = fake({
      profiling: "samples-only",
      mutate: (reply, index) => {
        if (index === at) {
          mutate(reply);
        }
      },
    });
    await assert.rejects(value.run());
    assert.equal(value.saved.length, at + 1);
    assert.equal(value.calls.at(-1).params.body, PROFILE_BODIES.stop);
    assert.equal(value.preserved(), 0);
    assert.equal(value.report.sampleWindow, undefined);
  }
});

test("sampling-only keeps first failure, bounded operations and owned shutdown for every stage", async () => {
  const success = fake({ profiling: "samples-only" });
  await success.run();
  for (let failureAt = 1; failureAt <= 8; failureAt++) {
    const value = fake({ profiling: "samples-only", failureAt });
    await assert.rejects(value.run(), error => error === value.failure);
    if (failureAt >= 3) {
      assert.equal(value.calls.at(-1).params.body, PROFILE_BODIES.stop);
    } else {
      assert.equal(value.calls.length, failureAt);
    }
  }
  for (const { name: saveFailure } of success.saved) {
    const value = fake({ profiling: "samples-only", saveFailure });
    await assert.rejects(value.run(), error => error === value.failure);
  }
  const value = fake({
    profiling: "samples-only",
    preserveFailure: true,
    stopFailure: new Error("stop"),
  });
  await assert.rejects(value.run(), error => error === value.failure);
  assert.equal(value.report.profileStopError, "stop");
});

test("raw receipts survive bad state, document, realm, configuration and workload rejection", async () => {
  for (const [at, change] of [
    [1, r => (r.result.value.profiler = true)],
    [1, r => (r.result.value.pid = 99)],
    [2, r => (r.result.value.webdriver = true)],
    [2, r => (r.document = 0)],
    [2, r => (r.context = 8)],
    [2, r => (r.result.value.transportGlobalIsWindow = true)],
    [3, r => (r.result.value.active = true)],
    [3, r => (r.result.value.profiler = false)],
    [4, r => (r.profiler.paused = true)],
    [4, r => (r.profiler.samplingPaused = true)],
    [4, r => (r.profiler.activeConfiguration.interval = 1)],
    [4, r => r.profiler.activeConfiguration.threads.pop()],
    [4, r => (r.processID = 10)],
    [4, r => r.profiler.activeConfiguration.features.push("screenshots")],
    [5, r => (r.document = 12)],
    [5, r => (r.context = 8)],
    [5, r => (r.result.value.measurement.result.samples[0].checksum = 0)],
    [5, r => r.result.value.measurement.phases.pop()],
    [5, r => (r.result.value.realm.globalIsWindow = false)],
    [6, r => (r.profiler.active = false)],
    [8, r => (r.result.value.profiler = true)],
  ]) {
    const value = fake({
      mutate: (reply, index) => {
        if (index === at) {
          change(reply);
        }
      },
    });
    await assert.rejects(value.run());
    assert.equal(value.saved.length, value.calls.length);
  }
  const off = fake({
    profiling: "off",
    mutate: (reply, index) => {
      if (index === 3) {
        reply.profiler.active = true;
      }
    },
  });
  await assert.rejects(off.run());
  assert.equal(off.calls.length, 3);
});

test("main wires the sixth signal to binary preservation, not the profiling selector", async () => {
  const calls = [];
  const definition = vm.runInNewContext(`(${main.toString()})`, {
    assert,
    captureLocalWorkload: (_binary, _root, value) => value,
    createDOMServer: (...args) => calls.push(args),
    captureDOMProfile: value => value,
    preserveDOMProfile: (...args) => calls.push(args),
  });
  const signal = new AbortController().signal;
  for (const profiling of ["on", "off", "samples-only"]) {
    const value = definition("/binary", "/owned", profiling);
    assert.equal(
      value.artifactPolicy,
      profiling === "off" ? "standard" : "profile"
    );
    await value.createServer(signal);
    const args = [{}, 7, () => {}, () => {}, {}];
    const captured = value.capture(...args, signal);
    assert.equal(captured.profiling, profiling);
    const receipt = {};
    await captured.preserve(receipt);
    assert.deepEqual(calls.at(-1), [
      "/owned",
      receipt,
      args[2],
      args[3],
      signal,
    ]);
    assert.deepEqual(calls.at(-2), [signal, "window", "mixed-profile"]);
  }
  assert.throws(() => definition("/binary", "/owned", "invalid"));
  const calibration = definition(
    "/binary",
    "/owned",
    "on",
    "marker-calibration"
  );
  await calibration.createServer(signal);
  assert.deepEqual(calls.at(-1), [signal, "window", "marker-calibration"]);
  assert.equal(
    calibration.capture(
      {},
      7,
      () => {},
      () => {},
      {},
      signal
    ).workload,
    "marker-calibration"
  );
  assert.throws(() => definition("/binary", "/owned", "on", "invalid"));
  for (const profiling of ["off", "samples-only"]) {
    const layout = definition(
      "/binary",
      "/owned",
      profiling,
      "layout-interleaved"
    );
    await layout.createServer(signal);
    assert.deepEqual(calls.at(-1), [signal, "window", "layout-interleaved"]);
    assert.equal(
      layout.capture(
        {},
        7,
        () => {},
        () => {},
        {},
        signal
      ).workload,
      "layout-interleaved"
    );
  }
  assert.throws(() =>
    definition("/binary", "/owned", "on", "layout-interleaved")
  );
});

test("profile preservation enforces owned path, private regular file, 24MiB and exclusive write", async () => {
  const root = "/owned";
  const path = root + "/profile/umbrafox/diagnostics/profiles/dom-profile.json";
  const writes = [];
  const saves = [];
  const signal = new AbortController().signal;
  const stat = {
    isFile: () => true,
    isSymbolicLink: () => false,
    uid: process.getuid(),
    size: 2,
  };
  const ops = {
    lstat: async () => stat,
    realpath: async file => file,
    readFile: async () => Buffer.from("{}"),
    writeFile: async (...args) => writes.push(args),
  };
  const run = (changes = {}, receipt = { path }) =>
    preserveDOMProfile(
      root,
      receipt,
      async (...args) => saves.push(args),
      operation => operation(),
      signal,
      { ...ops, ...changes }
    );
  await run();
  assert.equal(writes[0][0], root + "/profile.json");
  assert.deepEqual(writes[0][2], { mode: 0o600, flag: "wx", signal });
  assert.equal(saves[0][1].bytes, 2);
  await assert.rejects(run({}, { path: "/foreign" }));
  for (const change of [
    { lstat: async () => ({ ...stat, isFile: () => false }) },
    { lstat: async () => ({ ...stat, isSymbolicLink: () => true }) },
    { lstat: async () => ({ ...stat, uid: -1 }) },
    { lstat: async () => ({ ...stat, size: 25 * 1024 ** 2 }) },
    { lstat: async () => ({ ...stat, size: 0 }) },
    { realpath: async () => "/foreign" },
    { readFile: async () => Buffer.from("changed") },
    {
      readFile: async () => {
        throw new Error("read failed");
      },
    },
    {
      writeFile: async () => {
        throw new Error("write failed");
      },
    },
  ]) {
    await assert.rejects(run(change));
  }
});

test("profiler startup waits on the existing sampling barrier and fails closed", async () => {
  for (const [options, bodies] of [
    [PROFILE_OPTIONS, PROFILE_BODIES],
    [profileModule.SAMPLE_ONLY_OPTIONS, profileModule.SAMPLE_ONLY_BODIES],
  ]) {
    assert(options && bodies);
    for (const mode of [
      "success",
      "already",
      "unsupported",
      "start",
      "sampling",
    ]) {
      const calls = [];
      let active = mode === "already";
      const fakeServices = {
        appinfo: { processID: 9 },
        prefs: { getBoolPref: () => false },
        profiler: {
          IsActive: () => active,
          GetFeatures: () =>
            mode === "unsupported" ? [] : [...options.features],
          StartProfiler: async (...args) => {
            calls.push({ action: "start", args });
            if (mode === "start") {
              throw new Error("start failed");
            }
            active = true;
          },
          waitOnePeriodicSampling: async () => {
            calls.push({ action: "sampling" });
            if (mode === "sampling") {
              throw new Error("sampling failed");
            }
          },
        },
      };
      const pending = vm.runInNewContext(
        `(async () => { ${bodies.start} })()`,
        { Services: fakeServices },
        { timeout: 1000 }
      );
      if (mode === "success") {
        assert.deepEqual(JSON.parse(JSON.stringify(await pending)), {
          pid: 9,
          active: false,
          profiler: true,
        });
        assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
          {
            action: "start",
            args: [1048576, 2, [...options.features], [...options.threads]],
          },
          { action: "sampling" },
        ]);
      } else {
        await assert.rejects(pending);
      }
      if (["already", "unsupported"].includes(mode)) {
        assert.equal(calls.length, 0);
      }
      if (mode === "start") {
        assert.equal(calls.length, 1);
      }
      if (mode === "sampling") {
        assert.equal(calls.length, 2);
      }
    }
  }
});
