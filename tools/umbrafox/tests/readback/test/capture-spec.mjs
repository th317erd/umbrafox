/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { EventEmitter } from "node:events";
import process from "node:process";
import { runInNewContext } from "node:vm";
import { setTimeout as delay } from "node:timers/promises";
import { test } from "node:test";
import * as captureModule from "../capture.mjs";
import {
  admitOwned,
  boundedOperation,
  validateLocalWorkload,
  launchRetained,
} from "../capture.mjs";

function fakeLaunch() {
  const child = new EventEmitter();
  child.pid = 98765;
  child.signals = [];
  child.kill = signal => child.signals.push(signal);
  const owned = launchRetained("test", [], {}, () => child);
  return owned;
}

test("native directory receipt requires both temporary directory producers before measurement", async () => {
  const paths = {
    root: "/owned",
    appData: "/owned/app-data",
    localAppData: "/owned/local-app-data",
    tempDir: "/owned/temp",
  };
  const bounded = operation => operation();
  const calls = [];
  const saved = [];
  const control = {
    async request(method, params) {
      calls.push({ method, params });
      assert.equal(method, "umbrafox.script.execute");
      assert.equal(params.context, 42);
      assert.equal(params.realm, "browser");
      const directories = {
        UAppData: paths.appData,
        DefProfLRt: paths.localAppData,
        TmpD: paths.tempDir,
      };
      const value = runInNewContext(`(function() { ${params.body} })()`, {
        Services: {
          appinfo: { processID: 123, appBuildID: "20261003071500" },
          dirsvc: {
            get(key) {
              assert(Object.hasOwn(directories, key));
              return { path: directories[key] };
            },
          },
        },
        Components: { interfaces: { nsIFile: {} } },
        PathUtils: { tempDir: paths.tempDir },
      });
      return { result: { value } };
    },
  };
  const value = await captureModule.readNativeDirectories(
    control,
    42,
    123,
    paths,
    bounded,
    async (fileName, result) => saved.push({ fileName, result })
  );
  assert.equal(calls.length, 1);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].fileName, "native-roots.json");
  assert.equal(value.tempDir, paths.tempDir);
  assert.equal(value.directoryTempDir, paths.tempDir);
  assert.equal(value.buildID, "20261003071500");

  for (const invalid of [
    undefined,
    {},
    { ...paths, tempDir: undefined },
    { ...paths, tempDir: "/outside" },
  ]) {
    let requests = 0;
    await assert.rejects(
      captureModule.readNativeDirectories(
        {
          request: async () => {
            requests++;
            return saved[0].result;
          },
        },
        42,
        123,
        invalid,
        bounded,
        async () => {}
      )
    );
    assert.equal(requests, 0);
  }

  for (const reply of [
    null,
    {},
    { result: null },
    { result: {} },
    { result: { value: null } },
  ]) {
    let preserved;
    await assert.rejects(
      captureModule.readNativeDirectories(
        { request: async () => reply },
        42,
        123,
        paths,
        bounded,
        async (fileName, result) => {
          assert.equal(fileName, "native-roots.json");
          preserved = result;
        }
      )
    );
    assert.equal(preserved, reply);
  }

  for (const field of [
    "pid",
    "appData",
    "localAppData",
    "tempDir",
    "directoryTempDir",
  ]) {
    for (const invalid of [
      undefined,
      null,
      "",
      0,
      "/outside",
      "/owned/./temp",
    ]) {
      const reply = { result: { value: { ...value, [field]: invalid } } };
      let preserved;
      await assert.rejects(
        captureModule.readNativeDirectories(
          { request: async () => reply },
          42,
          123,
          paths,
          bounded,
          async (fileName, result) => {
            assert.equal(fileName, "native-roots.json");
            preserved = result;
          }
        )
      );
      assert.equal(preserved, reply);
    }
  }

  for (const stage of ["budget", "rpc", "write"]) {
    const failure = new Error(stage);
    let requests = 0;
    let writes = 0;
    await assert.rejects(
      captureModule.readNativeDirectories(
        {
          request: async () => {
            requests++;
            if (stage === "rpc") {
              throw failure;
            }
            return saved[0].result;
          },
        },
        42,
        123,
        paths,
        operation => {
          if (stage === "budget") {
            throw failure;
          }
          return operation();
        },
        async () => {
          writes++;
          throw failure;
        }
      ),
      error => error === failure
    );
    assert.equal(requests, stage === "budget" ? 0 : 1);
    assert.equal(writes, stage === "write" ? 1 : 0);
  }
});

test("local workload rejects malformed definitions without starting operations", () => {
  const valid = {
    mode: "valid",
    limitations: [],
    createServer() {
      throw new Error("Must not execute");
    },
    capture() {
      throw new Error("Must not execute");
    },
  };
  assert.equal(validateLocalWorkload(valid), valid);
  for (const display of ["headless", "headed"]) {
    const definition = { ...valid, display };
    assert.equal(validateLocalWorkload(definition), definition);
  }
  for (const definition of [
    null,
    {},
    { mode: "bad name" },
    { mode: "valid", limitations: [], createServer() {} },
    ...[undefined, true, null, 42, "", "X", "x".repeat(65)].map(mode => ({
      ...valid,
      mode,
    })),
    ...[Array(1), [null], ["x".repeat(301)], Array(5).fill("x")].map(
      limitations => ({ ...valid, limitations })
    ),
    ...[null, false, 1, "", "desktop", {}, ["headed"]].map(display => ({
      ...valid,
      display,
    })),
  ]) {
    assert.throws(() => validateLocalWorkload(definition), /Invalid workload/);
  }
});

test("local capture timeout can only shorten the existing envelope", () => {
  const definition = {
    mode: "native-directory-proof",
    limitations: [],
    createServer() {
      assert.fail("No server during validation");
    },
    capture() {
      assert.fail("No capture during validation");
    },
  };
  for (const timeoutMs of [30000, 45000, 60000, 120000]) {
    const value = { ...definition, timeoutMs };
    assert.equal(validateLocalWorkload(value), value);
  }
  for (const timeoutMs of [
    null,
    false,
    "30000",
    29999,
    120001,
    30000.5,
    NaN,
    Infinity,
    {},
  ]) {
    assert.throws(
      () => validateLocalWorkload({ ...definition, timeoutMs }),
      /Invalid workload/
    );
  }
});

test("seek recovery is an explicit fixed headed plan, not a timeout override", () => {
  const definition = {
    mode: "headed-seek-recovery-control",
    display: "headed",
    capturePlan: "seek-recovery",
    limitations: [],
    createServer() {},
    capture() {},
  };
  for (const mode of ["control", "forward", "backward"]) {
    const value = { ...definition, mode: `headed-seek-recovery-${mode}` };
    assert.equal(validateLocalWorkload(value), value);
  }
  for (const invalid of [
    ...[undefined, "headless"].map(display => ({ ...definition, display })),
    ...["other", "headed-seek-recovery-other"].map(mode => ({
      ...definition,
      mode,
    })),
    ...[120000, 240000, null].map(timeoutMs => ({ ...definition, timeoutMs })),
    ...[null, "", false, "unlimited", {}].map(capturePlan => ({
      ...definition,
      capturePlan,
    })),
    { ...definition, artifactPolicy: "profile" },
  ]) {
    assert.throws(() => validateLocalWorkload(invalid), /Invalid workload/);
  }
});

test("seek budget has fixed 225/238/240 second cutoffs with strict clock checks", () => {
  let elapsed = 0;
  const budget = captureModule.createSeekCaptureBudget(() => 1234 + elapsed);
  assert.equal(budget.remaining(), 225000);
  assert.equal(budget.remaining(true), 238000);
  assert.equal(budget.remainingTerminal(), 240000);
  elapsed = 224999.5;
  assert.equal(budget.remaining(), 0.5);
  elapsed = 225000;
  assert.throws(() => budget.remaining(), /deadline/);
  assert.equal(budget.remaining(true), 13000);
  assert.equal(budget.remainingTerminal(), 15000);
  elapsed = 238000;
  assert.throws(() => budget.remaining(true), /deadline/);
  assert.equal(budget.remainingTerminal(), 2000);
  elapsed = 240000;
  assert.throws(() => budget.remainingTerminal(), /deadline/);
  for (const invalid of [NaN, Infinity, -1]) {
    assert.throws(
      () => captureModule.createSeekCaptureBudget(() => invalid),
      /clock/
    );
  }
  let time = 10;
  const backwards = captureModule.createSeekCaptureBudget(() => time);
  time = 9;
  assert.throws(() => backwards.remaining(), /clock/);
  assert.throws(() => captureModule.createLocalCaptureBudget(240000), /budget/);
});

test("seek cleanup and terminal evidence remain available after work expiry or oversized fixture", async () => {
  const { createLifecycleEvidence } =
    await import("../../../performance/lifecycle-capture.mjs");
  const { finishLifecycle } = await import("../../../performance/run.mjs");
  for (const oversized of [false, true]) {
    let elapsed = 0;
    const budget = captureModule.createSeekCaptureBudget(() => elapsed);
    const controller = new AbortController();
    const writes = [];
    const saveEvidence = createLifecycleEvidence({
      root: "/owned",
      signal: controller.signal,
      budget,
      scrub: value => value,
      write: async (path, text, options) => {
        assert.equal(options.mode, 0o600);
        options.signal.throwIfAborted();
        writes.push({ path, bytes: Buffer.byteLength(text) });
      },
    });
    elapsed = 225000;
    const primary = new Error("Work deadline");
    const report = { status: "failed" };
    let closes = 0;
    const failure = await finishLifecycle({
      report,
      budget,
      failure: primary,
      scrub: value => value,
      abort: () => controller.abort(),
      cancelLog() {},
      save: (fileName, value) => saveEvidence(fileName, value, "cleanup"),
      server: {
        snapshot: () => ({ raw: "x".repeat(oversized ? 1600000 : 1200000) }),
        close: async () => {
          closes++;
        },
      },
    });
    assert.equal(failure, primary);
    assert.equal(closes, 1);
    assert.equal(writes.length, oversized ? 0 : 1);
    if (oversized) {
      assert(report.fixtureStateError.includes("cap"));
    }
    elapsed = 238000;
    assert.throws(() => budget.remaining(true), /deadline/);
    await saveEvidence("run.json", report, "cleanup");
    assert.equal(writes.at(-1).path, "/owned/run.json");
    assert.equal(budget.remainingTerminal(), 2000);
    elapsed = 240000;
    await assert.rejects(saveEvidence("late.json", {}, "cleanup"), /deadline/);
  }
});

test("terminal write failure preserves primary error and removes capture signal handlers", async () => {
  const { finishLifecycle } = await import("../../../performance/run.mjs");
  const host = new EventEmitter();
  const timers = new Set();
  const primary = new Error("Preflight failed");
  let writes = 0;
  const run = runInNewContext(
    `(${captureModule.captureLocalWorkload.toString()})`,
    {
      assert,
      validateLocalWorkload,
      resolve: value => value,
      localDisplayEnvironment: () => ({}),
      lifecycleArtifactLimit: () => 256 * 1024 ** 2,
      createLocalCaptureBudget: captureModule.createLocalCaptureBudget,
      createSeekCaptureBudget: captureModule.createSeekCaptureBudget,
      AbortController,
      process: host,
      boundedOperation,
      setTimeout(callback) {
        timers.add(callback);
        return callback;
      },
      clearTimeout(callback) {
        timers.delete(callback);
      },
      createOutputRoot: async () => ({ root: "/owned" }),
      createLifecycleEvidence: () => async () => {
        if (++writes > 1) {
          throw new Error("Terminal write failed");
        }
      },
      readLifecycleHost: async () => {
        throw primary;
      },
      finishLifecycle,
    }
  );
  await assert.rejects(
    run("/binary", "/owned", {
      mode: "headed-seek-recovery-control",
      display: "headed",
      capturePlan: "seek-recovery",
      limitations: [],
      createServer() {},
      capture() {},
    }),
    error => error === primary
  );
  assert.equal(writes, 2);
  assert.equal(host.listenerCount("SIGINT"), 0);
  assert.equal(host.listenerCount("SIGTERM"), 0);
  assert.equal(timers.size, 0);
});

test("short capture budgets retain work cleanup and terminal boundaries", () => {
  for (const totalMs of [undefined, 30000, 45000, 120000]) {
    let elapsed = 0;
    const total = totalMs ?? 120000;
    const budget = captureModule.createLocalCaptureBudget(
      totalMs,
      () => 4321 + elapsed
    );
    assert.equal(budget.remaining(), total - 15000);
    assert.equal(budget.remaining(true), total - 2000);
    assert.equal(budget.remainingTerminal(), total);
    elapsed = total - 15000 - 0.5;
    assert.equal(budget.remaining(), 0.5);
    elapsed += 0.5;
    assert.throws(() => budget.remaining(), /deadline/);
    assert.equal(budget.remaining(true), 13000);
    assert.equal(budget.remainingTerminal(), 15000);
    elapsed = total - 2000;
    assert.throws(() => budget.remaining(true), /deadline/);
    assert.equal(budget.remainingTerminal(), 2000);
    elapsed = total;
    assert.throws(() => budget.remainingTerminal(), /deadline/);
    elapsed = NaN;
    assert.throws(() => budget.remainingTerminal(), /deadline/);
  }
  for (const total of [
    null,
    false,
    "30000",
    0,
    29999,
    120001,
    30000.5,
    NaN,
    Infinity,
  ]) {
    assert.throws(
      () => captureModule.createLocalCaptureBudget(total),
      /budget/
    );
  }
});

test("short capture deadline rejects work without spending cleanup time", async () => {
  let elapsed = 0;
  const now = () => elapsed;
  const budget = captureModule.createLocalCaptureBudget(30000, now);
  elapsed = 14999;
  let calls = 0;
  const task = boundedOperation(
    budget,
    undefined,
    () => {
      calls++;
    },
    "dispatch"
  );
  elapsed = 15000;
  await assert.rejects(task, /deadline/);
  assert.equal(calls, 0);
  assert.equal(budget.remaining(true), 13000);
  await boundedOperation(
    budget,
    undefined,
    () => {
      calls++;
    },
    "cleanup",
    1000,
    true
  );
  assert.equal(calls, 1);
  elapsed = 28000;
  assert.throws(
    () =>
      boundedOperation(
        budget,
        undefined,
        () => {
          calls++;
        },
        "cleanup",
        1000,
        true
      ),
    /deadline/
  );
  assert.equal(calls, 1);
  assert.equal(budget.remainingTerminal(), 2000);
});

test("short budget integrates with cleanup without consuming the terminal reserve", async () => {
  const { finishLifecycle } = await import("../../../performance/run.mjs");
  for (const exhausted of [false, true]) {
    let elapsed = 0;
    const budget = captureModule.createLocalCaptureBudget(30000, () => elapsed);
    elapsed = 15000;
    const primary = new Error("Work deadline");
    const events = [];
    const step = event => {
      events.push(event);
      elapsed += 100;
    };
    const report = { status: "failed" };
    const failure = await finishLifecycle({
      report,
      budget,
      failure: primary,
      scrub: value => value,
      abort: () => events.push("abort"),
      cancelLog: () => events.push("cancelLog"),
      server: {
        snapshot: () => ({}),
        close: () => step("server"),
      },
      save: async fileName => {
        assert.equal(fileName, "fixture-state.json");
        assert(budget.remaining(true) > 0);
        step("save");
        if (exhausted) {
          elapsed = 28000;
        }
      },
      monitor: { stop: () => step("monitor") },
      control: { close: () => step("control") },
      logger: {
        finish: () => {
          step("logger");
          return { droppedBytes: 0, writtenBytes: 0 };
        },
      },
    });
    assert.equal(failure, primary);
    if (exhausted) {
      assert.deepEqual(events, ["save", "abort", "cancelLog"]);
      assert.equal(report.status, "cleanup-failed");
      assert.equal(budget.remainingTerminal(), 2000);
    } else {
      assert.deepEqual(events, [
        "save",
        "abort",
        "monitor",
        "control",
        "server",
        "logger",
        "cancelLog",
      ]);
      assert.equal(report.cleanupErrors, undefined);
      assert.equal(budget.remainingTerminal(), 14500);
    }
  }
});

test("headless remains the default despite ambient desktop and GPU overrides", () => {
  const environment = Object.freeze({
    MOZ_HEADLESS: "1",
    MOZ_HEADLESS_WIDTH: "1024",
    MOZ_HEADLESS_HEIGHT: "768",
    MOZ_APP_DATA: "/owned/app-data",
    MOZ_LOCAL_APP_DATA: "/owned/local-app-data",
    HOME: "/home/test",
  });
  const input = Object.freeze({
    DISPLAY: ":0",
    XAUTHORITY: "/owned/xauthority",
    MOZ_APP_DATA: "/unowned",
    MOZ_PROFILER_STARTUP: "1",
    LIBGL_ALWAYS_SOFTWARE: "1",
    WAYLAND_DISPLAY: "wayland-0",
  });
  for (const display of [undefined, "headless"]) {
    assert.deepEqual(
      captureModule.localDisplayEnvironment(environment, display, input),
      environment
    );
  }
  const headed = captureModule.localDisplayEnvironment(
    environment,
    "headed",
    input
  );
  assert.deepEqual(headed, {
    MOZ_APP_DATA: "/owned/app-data",
    MOZ_LOCAL_APP_DATA: "/owned/local-app-data",
    HOME: "/home/test",
    DISPLAY: ":0",
    XAUTHORITY: "/owned/xauthority",
  });
  assert.equal(environment.MOZ_HEADLESS, "1");
  assert.equal(input.MOZ_APP_DATA, "/unowned");
});

test("larger artifact allowance is exclusive to explicit headless profiling", () => {
  const definition = {
    mode: "headless-dom-profile-attribution",
    limitations: [],
    createServer() {},
    capture() {},
    artifactPolicy: "profile",
  };
  assert.equal(validateLocalWorkload(definition), definition);
  for (const invalid of [
    { ...definition, mode: "readback" },
    { ...definition, display: "headed" },
    ...[null, false, 0, "", "unlimited", 512, {}].map(artifactPolicy => ({
      ...definition,
      artifactPolicy,
    })),
  ]) {
    assert.throws(() => validateLocalWorkload(invalid), /Invalid workload/);
  }
});

test("headed mode rejects missing, remote or malformed displays and authority paths", () => {
  for (const DISPLAY of [
    undefined,
    null,
    0,
    "",
    "remote:0",
    "localhost:0",
    ":0\0",
    ":-1",
  ]) {
    assert.throws(() =>
      captureModule.localDisplayEnvironment({}, "headed", { DISPLAY })
    );
  }
  for (const XAUTHORITY of [null, 0, "", "relative", "/a\0b"]) {
    assert.throws(() =>
      captureModule.localDisplayEnvironment({}, "headed", {
        DISPLAY: ":0",
        XAUTHORITY,
      })
    );
  }
  assert.deepEqual(
    captureModule.localDisplayEnvironment({}, "headed", { DISPLAY: ":0.1" }),
    { DISPLAY: ":0.1" }
  );
  assert.throws(() =>
    captureModule.localDisplayEnvironment({}, "invalid", { DISPLAY: ":0" })
  );
});

test("expired or aborted budget never starts supplied operation", () => {
  let calls = 0;
  const operation = () => {
    calls++;
    throw new Error("Unexpected operation");
  };
  assert.throws(
    () =>
      boundedOperation(
        {
          remaining() {
            throw new Error("expired");
          },
        },
        undefined,
        operation,
        "test"
      ),
    /expired/
  );
  const controller = new AbortController();
  controller.abort(new Error("aborted"));
  assert.throws(
    () =>
      boundedOperation(
        { remaining: () => 100 },
        controller.signal,
        operation,
        "test"
      ),
    /aborted/
  );
  assert.equal(calls, 0);
});

test(
  "timeout observes late rejection, and successful bounded values pass through",
  { timeout: 1000 },
  async () => {
    let reject;
    const pending = new Promise((resolve, rejectLater) => {
      reject = rejectLater;
    });
    await assert.rejects(
      boundedOperation(
        { remaining: () => 5 },
        undefined,
        () => pending,
        "held"
      ),
      /timed out/
    );
    reject(new Error("Late IO rejection"));
    await delay(10);
    assert.equal(
      await boundedOperation(
        { remaining: () => 100 },
        undefined,
        () => 42,
        "ok"
      ),
      42
    );
  }
);

test("synchronous launch handle is retained through identity success and child exit", async () => {
  const owned = fakeLaunch();
  assert(owned.child);
  const identity = {
    pid: owned.child.pid,
    parent: process.pid,
    group: owned.child.pid,
    session: owned.child.pid,
    start: 123,
  };
  await admitOwned(
    owned,
    operation => operation(),
    async () => identity
  );
  assert.equal(owned.identity, identity);
  owned.child.emit("exit", 0, null);
  owned.child.emit("close");
  assert.deepEqual(await owned.completion, { code: 0, signal: null });
  await owned.closed;
  assert.deepEqual(owned.child.signals, []);
});

test(
  "failed or late admission stops only retained child and cannot mutate identity later",
  { timeout: 1000 },
  async () => {
    for (const mode of ["reject", "late", "mismatch"]) {
      const owned = fakeLaunch();
      let resolve;
      const read =
        mode === "late"
          ? new Promise(resolveLater => {
              resolve = resolveLater;
            })
          : Promise.resolve({ pid: 1 });
      const reader = () =>
        mode === "reject" ? Promise.reject(new Error("read failed")) : read;
      const bounded = operation =>
        boundedOperation(
          { remaining: () => 5 },
          undefined,
          operation,
          "identity"
        );
      await assert.rejects(admitOwned(owned, bounded, reader));
      assert.equal(owned.identity, null);
      assert.deepEqual(owned.child.signals, ["SIGTERM"]);
      resolve?.({
        pid: owned.child.pid,
        parent: process.pid,
        group: owned.child.pid,
        session: owned.child.pid,
      });
      await delay(10);
      assert.equal(owned.identity, null);
      assert.deepEqual(owned.child.signals, ["SIGTERM"]);
    }
  }
);

test("spawn error is observed without killing an already completed child", async () => {
  const owned = fakeLaunch();
  owned.child.emit("error", { code: "ENOENT" });
  assert.deepEqual(await owned.completion, { error: "ENOENT" });
  await assert.rejects(
    admitOwned(owned, () => Promise.reject(new Error("no identity")))
  );
  assert.deepEqual(owned.child.signals, []);
});

test("abort or deadline between admission and dispatch starts no operation", async () => {
  for (const mode of ["abort", "deadline"]) {
    let calls = 0;
    let expired = false;
    const controller = new AbortController();
    const budget = {
      remaining() {
        if (expired) {
          throw new Error("expired");
        }
        return 100;
      },
    };
    const pending = boundedOperation(
      budget,
      controller.signal,
      () => {
        calls++;
      },
      "queued"
    );
    if (mode === "abort") {
      controller.abort(new Error("aborted"));
    } else {
      expired = true;
    }
    await assert.rejects(pending);
    assert.equal(calls, 0);
  }
});
