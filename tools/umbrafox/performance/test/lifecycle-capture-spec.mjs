/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import process from "node:process";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { join, relative } from "node:path";
import { spawnOwned, stopOwned, withTimeout } from "../helpers.mjs";
import test from "node:test";
import * as lifecycle from "../lifecycle-capture.mjs";
import * as fixture from "../lifecycle.mjs";
import {
  captureLifecycle,
  createLifecycleBudget,
  createLifecycleEvidence,
  checkLifecycleCaps,
  readLifecycleResources,
  readLifecycleHost,
  startLifecycleMonitor,
} from "../lifecycle-capture.mjs";

const bounded = { timeout: 5000 };

test(
  "shared smoke monitor latches read, cap and evidence failures before admitting another read",
  bounded,
  async () => {
    for (const scenario of [
      "read",
      "cap",
      "save",
      "baseline-cap",
      "baseline-save",
    ]) {
      const controller = new AbortController();
      const reasons = [];
      const original = new Error(`Failure ${scenario}`);
      let reads = 0;
      const monitor = await startLifecycleMonitor({
        owned: {},
        root: "/output",
        signal: controller.signal,
        abort: reason => reasons.push(reason),
        async sample() {
          const value = resources();
          if (++reads > 1) {
            if (scenario === "read") {
              throw original;
            }
            if (scenario === "cap") {
              value.totals.rssBytes = 5 * GiB;
            }
            if (scenario === "baseline-cap") {
              value.totals.rssBytes = 3 * GiB;
            }
          }
          return value;
        },
        async save(fileName) {
          if (
            (scenario === "save" && reads > 1) ||
            (scenario === "baseline-save" &&
              fileName === "lifecycle-baseline.json")
          ) {
            throw original;
          }
        },
        wait(ms, signal) {
          return new Promise((resolve, reject) =>
            signal.addEventListener("abort", () => reject(signal.reason), {
              once: true,
            })
          );
        },
      });
      try {
        const failed = (
          scenario.startsWith("baseline")
            ? monitor.setBaseline()
            : monitor.sampleNow()
        ).catch(error => error);
        const first = await failed;
        assert(first instanceof Error);
        assert.equal(reasons.length, 1);
        await assert.rejects(monitor.sampleNow(), error => error === first);
        controller.abort(new Error("Later owner abort"));
        await assert.rejects(monitor.sampleNow(), error => error === first);
        assert.equal(reads, 2);
      } finally {
        await monitor.stop();
      }
    }
  }
);

test(
  "successful soak capture write failure is attempted once without partial retry",
  bounded,
  async () => {
    const plan = fixture.getLifecyclePlan("soak-30m");
    const { input, events } = captureInput("valid", plan);
    input.budget = createLifecycleBudget(1800000, input.now, plan);
    let attempts = 0;
    const original = new Error("Success bundle write failed");
    input.save = async (fileName, value, phase) => {
      assert.equal(fileName, "lifecycle-checkpoint-0.json");
      assert.equal(phase, "work");
      assert.equal(value.captureError, null);
      attempts++;
      throw original;
    };
    await assert.rejects(captureLifecycle(input), error => error === original);
    assert.equal(attempts, 1);
    assert(!events.includes("release:0"));
  }
);

test(
  "soak partial checkpoints preserve earlier replies once even after resource abort",
  bounded,
  async () => {
    const plan = fixture.getLifecyclePlan("soak-30m");
    for (const phase of [
      "diagnostics",
      "resources",
      "aborted-resources",
      "baseline",
    ]) {
      for (const writeFails of [false, true, "null", "undefined"]) {
        const { input, controller, events } = captureInput("valid", plan);
        input.budget = createLifecycleBudget(1800000, input.now, plan);
        const original = new Error(`Original ${phase}`);
        const request = input.control.request;
        input.control.request = async (method, params) => {
          if (
            phase === "diagnostics" &&
            method === "umbrafox.diagnostics.snapshot"
          ) {
            throw original;
          }
          return request(method, params);
        };
        if (phase.includes("resources")) {
          input.monitor.sampleNow = async () => {
            if (phase === "aborted-resources") {
              controller.abort(original);
            }
            throw original;
          };
        }
        if (phase === "baseline") {
          input.monitor.setBaseline = async () => {
            throw original;
          };
        }
        const attempts = [];
        const writer = createLifecycleEvidence({
          root: "/output",
          plan,
          budget: input.budget,
          signal: input.signal,
          scrub: text => text,
          async write(path, text, options) {
            assert.equal(options.signal.aborted, false);
            attempts.push({ path, value: JSON.parse(text) });
            if (writeFails) {
              if (writeFails === "null" || writeFails === "undefined") {
                const failure = writeFails === "null" ? null : undefined;
                throw failure;
              }
              throw new Error("Partial save failed");
            }
          },
        });
        input.save = writer;
        await assert.rejects(
          captureLifecycle(input),
          error => error === original
        );
        assert.equal(attempts.length, 1);
        const bundle = attempts[0].value;
        assert.equal(bundle.snapshot === null, phase === "baseline");
        assert.equal(
          bundle.diagnostics === null,
          ["baseline", "diagnostics"].includes(phase)
        );
        assert.equal(bundle.resources, null);
        assert.equal(bundle.captureError.message, original.message);
        assert.equal(typeof bundle.captureError.phase, "string");
        assert.equal(bundle.captureError.errorClipped, false);
        assert.equal(
          original.partialEvidenceError,
          { true: "Partial save failed", null: "null", undefined: "undefined" }[
            writeFails
          ]
        );
        assert(!events.includes("release:0"));
      }
    }
  }
);

test(
  "partial checkpoint writes retain category and cleanup deadline without terminal allocation",
  bounded,
  async () => {
    const plan = fixture.getLifecyclePlan("soak-30m");
    let clock = 0;
    const controller = new AbortController();
    const budget = createLifecycleBudget(1800000, () => clock, plan);
    clock += 1785000;
    controller.abort(new Error("Resource cap"));
    const writes = [];
    const save = createLifecycleEvidence({
      root: "/output",
      plan,
      budget,
      signal: controller.signal,
      scrub: value => value,
      async write(path) {
        writes.push(path);
      },
    });
    const value = {
      captureError: { phase: "resources", message: "Resource cap" },
    };
    const smokeSave = createLifecycleEvidence({
      root: "/output",
      budget: createLifecycleBudget(120000),
      signal: controller.signal,
      scrub: text => text,
      async write() {
        assert.fail("No smoke partial writes");
      },
    });
    await assert.rejects(
      smokeSave("lifecycle-checkpoint-0.json", value, "checkpoint-failure"),
      /Invalid/
    );
    await save("lifecycle-checkpoint-0.json", value, "checkpoint-failure");
    for (const fileName of [
      "run.json",
      "fixture-state.json",
      "lifecycle-checkpoint-11.json",
      "lifecycle-checkpoint-00.json",
    ]) {
      await assert.rejects(save(fileName, value, "checkpoint-failure"));
    }
    await assert.rejects(
      save("lifecycle-checkpoint-1.json", {}, "checkpoint-failure")
    );
    await assert.rejects(
      save("lifecycle-checkpoint-1.json", value, "unknown-phase"),
      /phase/
    );
    await assert.rejects(
      save(
        "lifecycle-checkpoint-1.json",
        { ...value, huge: "x".repeat(1024 ** 2) },
        "checkpoint-failure"
      ),
      /cap/
    );
    await save("fixture-state.json", {}, "cleanup");
    clock += 13000;
    await assert.rejects(
      save("lifecycle-checkpoint-2.json", value, "checkpoint-failure"),
      /deadline/
    );
    await save("run.json", { status: "failed" }, "cleanup");
    assert.equal(writes.length, 3);
  }
);

for (const caller of ["direct", "cadence"]) {
  test(
    `resource timeout permanently poisons ${caller} sampling despite held underlying IO`,
    bounded,
    async t => {
      t.mock.timers.enable({ apis: ["setTimeout"] });
      const controller = new AbortController();
      let reads = 0;
      let releaseRead;
      let releaseWait;
      const reasons = [];
      const writes = [];
      const monitor = await startLifecycleMonitor({
        plan: fixture.getLifecyclePlan("soak-30m"),
        owned: {},
        root: "/output",
        signal: controller.signal,
        abort: reason => reasons.push(reason),
        sample() {
          if (++reads === 1) {
            return Promise.resolve(resources());
          }
          return new Promise(resolve => {
            releaseRead = () => resolve(resources());
          });
        },
        async save(fileName) {
          writes.push(fileName);
        },
        wait(ms, signal) {
          return new Promise((resolve, reject) => {
            signal.addEventListener("abort", () => reject(signal.reason), {
              once: true,
            });
            releaseWait = resolve;
          });
        },
      });
      try {
        let direct;
        if (caller === "direct") {
          direct = assert.rejects(monitor.sampleNow(), /timed out/);
        } else {
          releaseWait();
        }
        for (let index = 0; index < 20; index++) {
          await Promise.resolve();
        }
        t.mock.timers.tick(3001);
        await direct;
        for (let index = 0; index < 20; index++) {
          await Promise.resolve();
        }
        const repeated = monitor.sampleNow();
        repeated.catch(() => {});
        assert.equal(reads, 2);
        await assert.rejects(repeated, /timed out/);
        assert.equal(reasons.length, 1);
        assert.match(reasons[0], /timed out/);
        assert.equal(monitor.summary().underlyingReadPending, true);
        controller.abort(new Error("Later cleanup"));
        await assert.rejects(monitor.sampleNow(), /timed out/);
        await monitor.stop();
        releaseRead();
        for (let index = 0; index < 20; index++) {
          await Promise.resolve();
        }
        assert.equal(writes.length, 1);
        assert.equal(monitor.summary().underlyingReadPending, false);
      } finally {
        controller.abort(new Error("Test cleanup"));
        releaseRead?.();
        await monitor.stop();
      }
    }
  );
}

test(
  "soak requires checkpoint diagnostics even when the RPC returns null",
  bounded,
  async () => {
    const plan = fixture.getLifecyclePlan("soak-30m");
    const { input, events } = captureInput("valid", plan);
    input.budget = createLifecycleBudget(1800000, input.now, plan);
    const request = input.control.request;
    input.control.request = async (method, params) =>
      method === "umbrafox.diagnostics.snapshot"
        ? null
        : request(method, params);
    await assert.rejects(captureLifecycle(input), /diagnostics/);
    assert(events.includes("lifecycle-checkpoint-0.json"));
    assert(!events.includes("release:0"));
  }
);

test(
  "soak INI bytes share other-evidence accounting and failed writes retain reservations",
  bounded,
  async () => {
    const plan = fixture.getLifecyclePlan("soak-30m");
    const writes = [];
    const save = createLifecycleEvidence({
      root: "/output",
      plan,
      budget: createLifecycleBudget(1800000, () => 0, plan),
      signal: new AbortController().signal,
      scrub: () => assert.fail("INI bytes must not be encoded or scrubbed"),
      async write(path, bytes) {
        writes.push({ path, bytes });
      },
    });
    const buffer = Buffer.from([91, 65, 112, 112, 93, 13, 10, 255]);
    await save("application.ini", buffer);
    await save("platform.ini", buffer);
    assert.deepEqual(
      writes.map(item => item.bytes),
      [buffer, buffer]
    );
    await assert.rejects(
      save("application.ini", Buffer.alloc(65537)),
      /INI.*cap/
    );
    await assert.rejects(save("platform.ini", "not bytes"), /INI/);
    for (const fail of [false, true]) {
      let written = 0;
      const writer = createLifecycleEvidence({
        root: "/output",
        plan,
        budget: createLifecycleBudget(1800000, () => 0, plan),
        signal: new AbortController().signal,
        scrub: value => value,
        async write(path) {
          written++;
          if (fail && path.endsWith("application.ini")) {
            throw new Error("Disk failed");
          }
        },
      });
      await writer(
        "other.json",
        "x".repeat(plan.evidence.otherBytes - 65536 - 3)
      );
      const pending = writer("application.ini", Buffer.alloc(65536));
      if (fail) {
        await assert.rejects(pending, /Disk failed/);
      } else {
        await pending;
      }
      await assert.rejects(writer("platform.ini", Buffer.from("x")), /cap/);
      await writer("run.json", { status: "failed" }, "cleanup");
      assert.equal(written, 3);
    }
  }
);

test(
  "soak budget admits exact owed holds and finalization without extending cleanup",
  bounded,
  () => {
    const plan = fixture.getLifecyclePlan("soak-30m");
    let clock = 0;
    assert.throws(() => createLifecycleBudget(1800000));
    assert.throws(() =>
      createLifecycleBudget(1800000, () => clock, { ...plan })
    );
    const budget = createLifecycleBudget(1800000, () => clock, plan);
    assert.equal(budget.remaining(), 1785000);
    budget.admit(0);
    clock = 195000;
    budget.admit(0);
    clock += 0.5;
    assert.throws(() => budget.admit(0), /hold|reserve/);
    clock = 1335000;
    budget.admit(10);
    clock++;
    assert.throws(() => budget.admit(10), /hold|reserve/);
    clock = 1635000;
    budget.admit(11);
    clock++;
    assert.throws(() => budget.admit(11), /hold|reserve/);
    for (const id of [-1, 12, 0.5, NaN]) {
      assert.throws(() => budget.admit(id));
    }
    clock = 1785000;
    assert.throws(() => budget.remaining());
    assert.equal(budget.remaining(true), 13000);
    clock = 1798000;
    assert.throws(() => budget.remaining(true));
    assert.equal(budget.remainingTerminal(), 2000);
  }
);

test(
  "soak evidence categories preserve terminal reserve and trusted serialization",
  bounded,
  async () => {
    const plan = fixture.getLifecyclePlan("soak-30m");
    for (const [fileName, limit] of [
      ["lifecycle-resources-000.json", 64 * 1024],
      ["lifecycle-checkpoint-0.json", 1024 ** 2],
      ["lifecycle-attribution-0.json", 64 * 1024],
      ["lifecycle-baseline.json", 64 * 1024],
      ["other.json", 12 * 1024 ** 2],
    ]) {
      const writes = [];
      const encoded = [];
      const save = createLifecycleEvidence({
        root: "/output",
        plan,
        budget: createLifecycleBudget(1800000, () => 0, plan),
        signal: new AbortController().signal,
        scrub: text => text.replaceAll("secret", "redacted"),
        serializeFixture(value, scrub) {
          encoded.push(value);
          return scrub(JSON.stringify({ encoded: value }, null, 2)) + "\n";
        },
        async write(path, text) {
          writes.push({ path, text });
        },
      });
      await save("samples.json", { secret: true });
      assert.deepEqual(JSON.parse(writes[0].text), {
        encoded: { redacted: true },
      });
      await assert.rejects(save(fileName, "x".repeat(limit)), /cap/);
      await assert.rejects(save("late.json", {}), /cap/);
      await save("fixture-state.json", { status: "failed" }, "cleanup");
      await save("run.json", { status: "failed" }, "cleanup");
      assert.equal(encoded.length, 2);
      assert.equal(writes.length, 3);
      assert.deepEqual(JSON.parse(writes[2].text), { status: "failed" });
    }
  }
);

test(
  "soak evidence caps record counts and post-scrub bytes without truncation",
  bounded,
  async () => {
    const plan = fixture.getLifecyclePlan("soak-30m");
    for (const [prefix, count] of [
      ["lifecycle-resources-", 384],
      ["lifecycle-checkpoint-", 11],
      ["lifecycle-attribution-", 11],
      ["lifecycle-baseline", 1],
    ]) {
      let writes = 0;
      const save = createLifecycleEvidence({
        root: "/output",
        plan,
        budget: createLifecycleBudget(1800000, () => 0, plan),
        signal: new AbortController().signal,
        scrub: value => value,
        async write() {
          writes++;
        },
      });
      const filename = index =>
        prefix === "lifecycle-baseline"
          ? `${prefix}.json`
          : `${prefix}${index}.json`;
      for (let index = 0; index < count; index++) {
        await save(filename(index), {});
      }
      await assert.rejects(save(filename(count), {}), /cap/);
      assert.equal(writes, count);
    }
    let writes = 0;
    const save = createLifecycleEvidence({
      root: "/output",
      plan,
      budget: createLifecycleBudget(1800000, () => 0, plan),
      signal: new AbortController().signal,
      scrub: () => "x".repeat(65537),
      async write() {
        writes++;
      },
    });
    await assert.rejects(save("lifecycle-resources-000.json", {}), /cap/);
    assert.equal(writes, 0);
  }
);

test(
  "soak capture consumes eleven exact holds, handles early wakes and observes every context",
  bounded,
  async () => {
    const plan = fixture.getLifecyclePlan("soak-30m");
    const { input, events } = captureInput("valid", plan);
    input.budget = createLifecycleBudget(1800000, input.now, plan);
    const originalWait = input.wait;
    let early = true;
    const waits = [];
    input.wait = async (ms, signal) => {
      waits.push(ms);
      await originalWait(early ? ms - 0.5 : ms, signal);
      early = false;
    };
    await captureLifecycle(input);
    assert.deepEqual(waits, [60000, 1, ...Array(9).fill(120000), 300000]);
    assert.equal(
      events.filter(item => item === "umbrafox.performance.snapshot").length,
      11
    );
    assert.equal(
      events.filter(item => item === "umbrafox.diagnostics.snapshot").length,
      11
    );
    assert.equal(events.filter(item => item === "baseline").length, 1);
    assert.equal(events.filter(item => item.startsWith("release:")).length, 11);
  }
);

test(
  "soak monitor caps records and retained identities without evicting history",
  bounded,
  async () => {
    const plan = fixture.getLifecyclePlan("soak-30m");
    for (const scenario of ["records", "history"]) {
      const controller = new AbortController();
      let samples = 0;
      let writes = 0;
      const monitor = await startLifecycleMonitor({
        plan,
        owned: {},
        root: "/output",
        signal: controller.signal,
        abort: reason => controller.abort(new Error(reason)),
        async sample(owned, root, identities) {
          assert.equal(
            identities.size,
            scenario === "history"
              ? samples * 2 + (samples ? 1 : 0)
              : Math.min(samples, 1)
          );
          const value = resources();
          if (scenario === "history") {
            for (let index = 0; index < 2; index++) {
              value.processes.push({
                ...value.processes[0],
                identity: { ...rootIdentity, pid: 1000 + samples * 2 + index },
              });
            }
            value.totals.processes = 3;
          }
          samples++;
          return value;
        },
        async save() {
          writes++;
        },
        wait(ms, signal) {
          return new Promise((resolve, reject) =>
            signal.addEventListener("abort", () => reject(signal.reason), {
              once: true,
            })
          );
        },
      });
      try {
        const allowed = scenario === "records" ? 384 : 255;
        for (let index = 1; index < allowed; index++) {
          await monitor.sampleNow();
        }
        await assert.rejects(monitor.sampleNow(), /cap/);
        assert.equal(writes, allowed);
        assert.equal(samples, scenario === "records" ? 384 : 256);
      } finally {
        await monitor.stop();
      }
    }
  }
);

test(
  "soak monitor skips elapsed cadence slots and serializes concurrent requests",
  bounded,
  async () => {
    const controller = new AbortController();
    const gates = [];
    const writes = [];
    let clock = 0;
    let reads = 0;
    let active = 0;
    const monitor = await startLifecycleMonitor({
      plan: fixture.getLifecyclePlan("soak-30m"),
      owned: {},
      root: "/output",
      signal: controller.signal,
      now: () => clock,
      abort: reason => controller.abort(new Error(reason)),
      async sample() {
        assert.equal(active++, 0);
        if (reads++ > 0) {
          clock += 12000;
        }
        await Promise.resolve();
        active--;
        return resources();
      },
      async save(fileName, value) {
        writes.push(value);
      },
      wait(ms, signal) {
        return new Promise((resolve, reject) => {
          const abort = () => reject(signal.reason);
          signal.addEventListener("abort", abort, { once: true });
          gates.push({
            ms,
            release() {
              signal.removeEventListener("abort", abort);
              clock += ms;
              resolve();
            },
          });
        });
      },
    });
    try {
      assert.equal(gates[0].ms, 5000);
      gates.shift().release();
      for (let index = 0; index < 40; index++) {
        await Promise.resolve();
      }
      assert.equal(reads, 2);
      assert.equal(gates[0].ms, 3000);
      assert.deepEqual(monitor.summary(), {
        records: 2,
        historicalPIDs: 1,
        missedSlots: 2,
        underlyingReadPending: false,
      });
      const first = monitor.sampleNow();
      assert.equal(monitor.sampleNow(), first);
      await first;
      assert.equal(writes.at(-1).missedSlots, 2);
      assert.equal(reads, 3);
    } finally {
      await monitor.stop();
    }
  }
);

test(
  "soak final hold abort and exhausted future-hold reserve release no active work",
  bounded,
  async () => {
    const plan = fixture.getLifecyclePlan("soak-30m");
    for (const failure of ["abort", "reserve", "documents", "terminal"]) {
      const { input, events, controller, advance } = captureInput(
        "valid",
        plan
      );
      input.budget = createLifecycleBudget(1800000, input.now, plan);
      const wait = input.wait;
      input.wait = async (ms, signal) => {
        if (ms === 300000 && failure === "abort") {
          controller.abort(new Error("HALT final quiet"));
          signal.throwIfAborted();
        }
        await wait(ms, signal);
        if (failure === "reserve") {
          advance(195001);
        }
      };
      const next = input.server.nextCheckpoint;
      input.server.nextCheckpoint = async () => {
        const value = await next();
        if (failure === "documents" && value) {
          value.documentsCompleted++;
        }
        if (failure === "terminal" && value === null) {
          return { id: 11 };
        }
        return value;
      };
      await assert.rejects(captureLifecycle(input));
      const released = events.filter(item => item.startsWith("release:"));
      assert.equal(
        released.length,
        { abort: 10, reserve: 0, documents: 0, terminal: 11 }[failure]
      );
    }
  }
);

const fixtureOrigin = "http://127.0.0.1:32123";
const fixturePrefix = `/${"a".repeat(36)}/`;
const documentURL = id => `${fixtureOrigin}${fixturePrefix}document?id=${id}`;
const tabContext = { context: 10, browserId: 9 };

function fixtureServer() {
  return {
    url: documentURL(0),
    metadata: {
      originB: fixtureOrigin,
      sentinel: fixturePrefix,
      documents: [
        { id: 0, role: "initial" },
        ...[7, 23, 39].map((id, checkpoint) => ({
          id,
          role: "settled",
          checkpoint,
        })),
      ],
    },
  };
}

function diagnosticTabs(url = documentURL(0)) {
  return {
    processID: 101,
    profileDir: "/profile",
    channel: "umbrafox-control",
    windows: [
      {
        index: 0,
        selectedTabIndex: 0,
        tabs: [{ ...tabContext, url, selected: true }],
      },
    ],
  };
}

function processWindow(documentURI = documentURL(0), outerWindowId = 20) {
  return {
    outerWindowId,
    documentURI,
    isProcessRoot: true,
    isInProcess: false,
  };
}

function windowSnapshot() {
  return {
    process: {
      pid: 101,
      type: "browser",
      windows: [],
      children: [
        { pid: 102, type: "webIsolated", windows: [processWindow()] },
        {
          pid: 103,
          type: "privilegedabout",
          windows: [processWindow("about:newtab", 21)],
        },
        {
          pid: 104,
          type: "extension",
          windows: [
            processWindow(
              "moz-extension://12345678-abcd-1234-abcd-123456789abc/_generated_background_page.html",
              22
            ),
          ],
        },
      ],
    },
  };
}

test("lifecycle URL contract is canonical and metadata-bound", bounded, () => {
  assert.deepEqual(
    lifecycle.lifecycleURLs(fixtureServer()),
    [0, 7, 23, 39].map(documentURL)
  );
  for (const change of [
    server => {
      server.url += "#fragment";
    },
    server => {
      server.metadata.originB = "http://127.0.0.1:32124";
    },
    server => {
      server.metadata.sentinel = "/other/";
    },
    server => {
      server.metadata.documents[2].checkpoint = 0;
    },
    server => {
      server.metadata.documents[0].id = 1;
    },
  ]) {
    const server = fixtureServer();
    change(server);
    assert.throws(() => lifecycle.lifecycleURLs(server));
  }
});

test(
  "tab admission rejects missing, foreign, duplicate and changed contexts",
  bounded,
  () => {
    assert.deepEqual(
      lifecycle.validateLifecycleTab(diagnosticTabs(), documentURL(0)),
      tabContext
    );
    for (const change of [
      value => {
        delete value.windows;
      },
      value => {
        value.windows = [];
      },
      value => {
        value.windows.push(structuredClone(value.windows[0]));
      },
      value => {
        value.windows[0].tabs = [];
      },
      value => {
        value.windows[0].tabs.push({ ...value.windows[0].tabs[0] });
      },
      value => {
        value.windows[0].selectedTabIndex = -1;
      },
      value => {
        value.windows[0].tabs[0].selected = false;
      },
      value => {
        value.windows[0].tabs[0].context = null;
      },
      value => {
        value.windows[0].tabs[0].context++;
      },
      value => {
        value.windows[0].tabs[0].browserId++;
      },
      value => {
        value.windows[0].tabs[0].url = "not a URL";
      },
      value => {
        value.windows[0].tabs[0].url += "#fragment";
      },
      value => {
        value.windows[0].tabs[0].url = "https://example.test/";
      },
      value => {
        value.windows[0].tabs[0].url = `http://127.0.0.1:32124${fixturePrefix}document?id=0`;
      },
      value => {
        value.windows[0].tabs[0].url = documentURL(0).replace(
          "/document",
          "-other/document"
        );
      },
    ]) {
      const value = diagnosticTabs();
      change(value);
      assert.throws(() =>
        lifecycle.validateLifecycleTab(value, documentURL(0), tabContext)
      );
    }
  }
);

test(
  "HTTP-window admission separates precise background pages and fails closed",
  bounded,
  () => {
    const accepted = lifecycle.validateLifecycleWindows(
      windowSnapshot(),
      documentURL(0)
    );
    assert.equal(accepted.httpWindows.length, 1);
    assert.equal(accepted.backgroundWindows.length, 2);
    for (const change of [
      value => {
        delete value.process.windows;
      },
      value => {
        value.process.children[0].windows = [];
      },
      value => {
        value.process.children[0].windows.push(processWindow());
      },
      value => {
        value.process.children[0].windows[0].documentURI = null;
      },
      value => {
        value.process.children[0].windows[0].documentURI =
          "http://127.0.0.1:32123.evil.test/";
      },
      value => {
        value.process.children[0].windows[0].documentURI = `${documentURL(0)}&id=0`;
      },
      value => {
        value.process.children[0].windows[0].documentURI = documentURL(1);
      },
      value => {
        value.process.children[0].windows[0].documentURI = "about:newtab";
      },
      value => {
        value.process.children[1].windows[0].documentURI = "about:config";
      },
      value => {
        value.process.children[2].type = "webIsolated";
      },
      value => {
        value.process.children[2].windows[0].documentURI =
          "moz-extension://12345678-abcd-1234-abcd-123456789abc/other.html";
      },
      value => {
        value.process.children[2].windows[0].documentURI =
          "https://www.mozilla.org/en-US/privacy/firefox/";
      },
    ]) {
      const value = windowSnapshot();
      change(value);
      assert.throws(() =>
        lifecycle.validateLifecycleWindows(value, documentURL(0))
      );
    }
  }
);

function startupInput(scenario = "ready") {
  let requests = 0;
  let clock = 0;
  const writes = new Map();
  const controller = new AbortController();
  const server = fixtureServer();
  server.snapshot = () => {
    const ready =
      scenario === "ready" || (requests >= 2 && scenario === "pending");
    return {
      started: false,
      status: "pending",
      error: null,
      receipts: ready ? [{ kind: "loaded", id: 0 }] : [],
      pendingRequests: 1,
      counts: { documents: ready ? 1 : 0 },
      dropped: 0,
    };
  };
  const input = {
    server,
    owned: { child: { pid: 101 } },
    profile: "/profile",
    signal: controller.signal,
    bounded: promise => promise,
    now: () => clock,
    control: {
      async request(method) {
        assert.equal(method, "umbrafox.diagnostics.snapshot");
        requests++;
        if (scenario === "foreign") {
          return diagnosticTabs("https://example.test/");
        }
        if (scenario === "ready" || (requests >= 3 && scenario === "pending")) {
          return diagnosticTabs();
        }
        if (scenario === "pending" && requests === 2) {
          return diagnosticTabs("about:blank");
        }
        return {
          ...diagnosticTabs(),
          windows: [{ index: 0, tabs: [], selectedTabIndex: -1 }],
        };
      },
    },
    async save(fileName, value) {
      writes.set(fileName, value);
    },
    async wait(milliseconds, signal) {
      assert.equal(milliseconds, 100);
      assert.equal(signal, controller.signal);
      clock += milliseconds;
      if (scenario === "abort") {
        controller.abort(new Error("HALT"));
      }
    },
  };
  return { input, writes, controller, requests: () => requests };
}

test(
  "setup requires positive loaded fixture and records every setup RPC",
  bounded,
  async () => {
    for (const scenario of ["ready", "pending"]) {
      const { input, writes, requests } = startupInput(scenario);
      const result = await lifecycle.waitForLifecycleReady(input);
      assert.deepEqual(result.context, tabContext);
      assert.equal(result.attempts, scenario === "ready" ? 1 : 3);
      assert.equal(requests(), result.attempts);
      assert.equal(writes.size, result.attempts);
    }
  }
);

test(
  "setup rejects foreign tabs after preserving raw evidence",
  bounded,
  async () => {
    const { input, writes, requests } = startupInput("foreign");
    await assert.rejects(lifecycle.waitForLifecycleReady(input));
    assert.equal(requests(), 1);
    assert.equal(
      writes.get("lifecycle-setup-1.json").diagnostics.windows[0].tabs[0].url,
      "https://example.test/"
    );
  }
);

test(
  "empty setup caps at 300 and does not reset abort or startup budget",
  bounded,
  async () => {
    const empty = startupInput("empty");
    await assert.rejects(
      lifecycle.waitForLifecycleReady(empty.input),
      /setup.*cap/i
    );
    assert.equal(empty.requests(), 300);
    assert.equal(empty.input.now(), 29900);
    assert.equal(empty.writes.size, 300);
    const aborted = startupInput("abort");
    await assert.rejects(
      lifecycle.waitForLifecycleReady(aborted.input),
      /HALT/
    );
    assert.equal(aborted.requests(), 1);
    assert.equal(aborted.writes.size, 1);
  }
);

test(
  "setup malformed state and evidence-write failures never retry",
  bounded,
  async () => {
    for (const change of [
      input => {
        input.server.snapshot = () => ({ started: true });
      },
      input => {
        const snapshot = input.server.snapshot;
        input.server.snapshot = () => ({
          ...snapshot(),
          receipts: [{ kind: "loaded", id: 1 }],
        });
      },
      input => {
        const snapshot = input.server.snapshot;
        input.server.snapshot = () => ({ ...snapshot(), pendingRequests: 0 });
      },
      input => {
        input.control.request = async () => ({
          ...diagnosticTabs(),
          windows: null,
        });
      },
      input => {
        input.control.request = async () => ({
          ...diagnosticTabs(),
          processID: 999,
        });
      },
      input => {
        input.control.request = async () => diagnosticTabs("about:blank");
      },
      input => {
        input.save = async () => {
          throw new Error("Evidence write failed");
        };
      },
    ]) {
      const { input, writes } = startupInput();
      let waits = 0;
      input.wait = async () => {
        waits++;
      };
      change(input);
      await assert.rejects(lifecycle.waitForLifecycleReady(input));
      assert.equal(waits, 0);
      assert(writes.size <= 1);
    }
  }
);

test(
  "setup preserves remaining startup abort during RPC and before another observation",
  bounded,
  async () => {
    for (const phase of ["before", "rpc", "wait"]) {
      const { input, controller, requests } = startupInput("empty");
      input.bounded = (promise, label) =>
        withTimeout(promise, 100, label, input.signal);
      const abortStartup = () =>
        controller.abort(new Error("Lifecycle startup exceeded 30 seconds"));
      if (phase === "before") {
        abortStartup();
      } else if (phase === "rpc") {
        input.control.request = () => {
          abortStartup();
          return new Promise(() => {});
        };
      } else {
        input.wait = async () => {
          abortStartup();
        };
      }
      await assert.rejects(
        lifecycle.waitForLifecycleReady(input),
        /startup exceeded/
      );
      assert.equal(requests(), phase === "wait" ? 1 : 0);
    }
  }
);

test(
  "aborted workload cannot start evidence IO but terminal failure write remains permitted",
  bounded,
  async () => {
    const controller = new AbortController();
    controller.abort(new Error("HALT"));
    let writes = 0;
    const save = createLifecycleEvidence({
      root: "/output",
      budget: createLifecycleBudget(120000),
      signal: controller.signal,
      scrub: value => value,
      async write() {
        writes++;
      },
    });
    await assert.rejects(save("late-work.json", {}), /HALT/);
    assert.equal(writes, 0);
    await save("run.json", { status: "failed" }, "cleanup");
    assert.equal(writes, 1);
  }
);
const GiB = 1024 ** 3;
const rootIdentity = {
  pid: 101,
  parent: process.pid,
  group: 101,
  session: 101,
  start: "100",
  state: "S",
};

function resources() {
  return {
    host: {
      totalBytes: 16 * GiB,
      availableBytes: 8 * GiB,
      diskAvailableBytes: 2 * GiB,
    },
    totals: { rssBytes: GiB, processes: 5, fds: 100, threads: 80 },
    controller: { rssBytes: 50 * 1024 ** 2, fds: 20, threads: 4 },
    artifactBytes: 0,
    processes: [
      { identity: rootIdentity, rssBytes: GiB, fds: 100, threads: 80 },
    ],
  };
}

test(
  "smoke budget reserves cleanup and uses monotonic remaining time",
  bounded,
  () => {
    let clock = 100;
    const budget = createLifecycleBudget(120000, () => clock);
    assert.equal(budget.remaining(false), 105000);
    clock += 105000;
    assert.throws(() => budget.remaining(false), /deadline/);
    assert.equal(budget.remaining(true), 13000);
    assert.equal(budget.remainingTerminal(), 15000);
    clock += 13000;
    assert.throws(() => budget.remaining(true), /deadline/);
    assert.equal(budget.remainingTerminal(), 2000);
    clock += 2000;
    assert.throws(() => budget.remainingTerminal(), /deadline/);
  }
);

test(
  "ordinary evidence overflow cannot consume terminal failure-report reserves",
  bounded,
  async () => {
    let clock = 0;
    const budget = createLifecycleBudget(120000, () => clock);
    const writes = [];
    const save = createLifecycleEvidence({
      root: "/output",
      budget,
      signal: new AbortController().signal,
      scrub: value => value,
      async write(path, text) {
        writes.push({ path, value: JSON.parse(text) });
      },
    });
    await assert.rejects(
      save("oversized.json", "x".repeat(54 * 1024 ** 2)),
      /cap/
    );
    await save("fixture-state.json", { settled: false }, "cleanup");
    clock = 118001;
    await save(
      "run.json",
      { status: "failed", cleanup: { status: "clean" } },
      "cleanup"
    );
    assert.deepEqual(
      writes.map(item => item.path),
      ["/output/fixture-state.json", "/output/run.json"]
    );
    assert.equal(writes[1].value.status, "failed");
    assert.equal(writes[1].value.cleanup.status, "clean");
    clock = 120001;
    await assert.rejects(save("after-deadline.json", {}, "cleanup"));
    assert.equal(writes.length, 2);
  }
);

test(
  "host preflight rejects missing memory, low headroom and disk",
  bounded,
  async () => {
    const io = {
      async readFile() {
        return "MemTotal: 16777216 kB\nMemAvailable: 8388608 kB\n";
      },
      async statfs() {
        return { bsize: 4096, bavail: 524288 };
      },
    };
    assert.equal(
      (await readLifecycleHost("/output", io)).availableBytes,
      8 * GiB
    );
    await assert.rejects(
      readLifecycleHost("/output", {
        ...io,
        readFile: async () => "MemTotal: 100 kB\n",
      })
    );
    await assert.rejects(
      readLifecycleHost("/output", {
        ...io,
        statfs: async () => ({ bsize: 4096, bavail: 1 }),
      })
    );
  }
);

test(
  "every absolute and growth cap fails; unknown values never become zero",
  bounded,
  () => {
    checkLifecycleCaps(resources());
    checkLifecycleCaps(resources(), resources().totals);
    for (const [field, value] of [
      ["rssBytes", 4 * GiB + 1],
      ["processes", 33],
      ["fds", 2049],
      ["threads", 513],
      ["rssBytes", null],
      ["fds", NaN],
    ]) {
      const sample = resources();
      sample.totals[field] = value;
      assert.throws(() => checkLifecycleCaps(sample), /resource|cap|unknown/i);
    }
    for (const [field, value] of [
      ["rssBytes", 2 * GiB + 1],
      ["processes", 14],
      ["fds", 357],
      ["threads", 209],
    ]) {
      const sample = resources();
      sample.totals[field] = value;
      assert.throws(
        () => checkLifecycleCaps(sample, resources().totals),
        /cap/i
      );
    }
    const low = resources();
    low.host.availableBytes = GiB;
    assert.throws(() => checkLifecycleCaps(low), /cap/i);
    const big = resources();
    big.artifactBytes = 256 * 1024 ** 2 + 1;
    assert.throws(() => checkLifecycleCaps(big), /cap/i);
    const missing = resources();
    delete missing.host.availableBytes;
    assert.throws(() => checkLifecycleCaps(missing), /unknown/i);
    assert.throws(
      () =>
        checkLifecycleCaps(resources(), {
          ...resources().totals,
          rssBytes: NaN,
        }),
      /unknown/i
    );
  }
);

function procIO(change) {
  const reads = [];
  const identities = new Map([
    [101, rootIdentity],
    [102, { ...rootIdentity, pid: 102, parent: 101, start: "102" }],
    [999, { ...rootIdentity, pid: 999, parent: 1, group: 999, session: 999 }],
    [
      process.pid,
      {
        ...rootIdentity,
        pid: process.pid,
        parent: process.ppid,
        group: process.pid,
        session: process.pid,
      },
    ],
  ]);
  const counts = new Map();
  return {
    reads,
    async readIdentity(pid) {
      const count = (counts.get(pid) ?? 0) + 1;
      counts.set(pid, count);
      const identity = structuredClone(identities.get(pid));
      return change?.(identity, count) ?? identity;
    },
    async readFile(path) {
      reads.push(path);
      if (path === "/proc/meminfo") {
        return "MemTotal: 16777216 kB\nMemAvailable: 8388608 kB\n";
      }
      return `Uid:\t${process.getuid()}\t${process.getuid()}\t${process.getuid()}\t${process.getuid()}\nVmRSS:\t1024 kB\nThreads:\t2\n`;
    },
    async readdir(path) {
      if (path === "/proc") {
        return ["101", "102", "999"];
      }
      if (path === "/output") {
        return [];
      }
      reads.push(path);
      return ["1", "2"];
    },
    async statfs() {
      return { bsize: 4096, bavail: 524288 };
    },
  };
}

function artifactIO(directoryEntries, metadata) {
  const io = procIO();
  const procReaddir = io.readdir;
  io.readdir = path =>
    path.startsWith("/output") ? directoryEntries(path) : procReaddir(path);
  io.lstat = metadata;
  return io;
}

function artifactMetadata(size, directory = false) {
  return { size, isDirectory: () => directory };
}

function missingArtifact() {
  return Object.assign(new Error("Artifact disappeared"), { code: "ENOENT" });
}

function artifactResources(io, signal) {
  return readLifecycleResources(
    { child: { pid: 101 }, identity: rootIdentity },
    "/output",
    new Map(),
    io,
    signal
  );
}

test(
  "private temp files share the unchanged artifact cap",
  bounded,
  async () => {
    const maximum = 256 * 1024 ** 2;
    const directories = {
      "/output": ["profile", "temp"],
      "/output/profile": ["prefs.js"],
      "/output/temp": ["bundle.zip", "bundle.zip.tmp"],
    };
    for (const excess of [0, 1]) {
      const files = {
        "/output/profile/prefs.js": 100,
        "/output/temp/bundle.zip": 1000,
        "/output/temp/bundle.zip.tmp": maximum - 1180 + excess,
      };
      const observed = [];
      const io = artifactIO(
        async path => {
          assert(Object.hasOwn(directories, path));
          return directories[path];
        },
        async path => {
          observed.push(path);
          if (Object.hasOwn(directories, path)) {
            return artifactMetadata(40, true);
          }
          assert(Object.hasOwn(files, path));
          return artifactMetadata(files[path]);
        }
      );
      const sample = artifactResources(io);
      if (excess) {
        await assert.rejects(sample, /artifact byte cap/);
      } else {
        assert.equal((await sample).artifactBytes, maximum);
      }
      for (const path of Object.keys(files)) {
        assert(observed.includes(path));
      }
    }
  }
);

test(
  "artifact policies retain the default cap and bound explicit profiling",
  bounded,
  async () => {
    const MiB = 1024 ** 2;
    for (const [policy, maximum] of [
      [undefined, 256 * MiB],
      ["standard", 256 * MiB],
      ["profile", 512 * MiB],
    ]) {
      const value = resources();
      value.artifactBytes = maximum;
      checkLifecycleCaps(value, undefined, policy);
      value.artifactBytes++;
      assert.throws(() => checkLifecycleCaps(value, undefined, policy), /cap/i);
      for (const excess of [0, 1]) {
        const io = artifactIO(
          async () => ["owned-file"],
          async () => artifactMetadata(maximum + excess)
        );
        const sample = readLifecycleResources(
          { child: { pid: 101 }, identity: rootIdentity },
          "/output",
          new Map(),
          io,
          undefined,
          policy
        );
        if (excess) {
          await assert.rejects(sample, /artifact byte cap/);
        } else {
          assert.equal((await sample).artifactBytes, maximum);
        }
      }
    }
    for (const policy of [null, false, 0, "", "unlimited", 512, {}]) {
      assert.throws(
        () => checkLifecycleCaps(resources(), undefined, policy),
        /artifact policy/i
      );
      let reads = 0;
      await assert.rejects(
        readLifecycleResources(
          {},
          "/output",
          new Map(),
          {
            readIdentity() {
              reads++;
            },
          },
          undefined,
          policy
        ),
        /artifact policy/i
      );
      assert.equal(reads, 0);
    }
  }
);

test(
  "monitor forwards profiling policy, latches its cap and rejects soak expansion",
  bounded,
  async () => {
    const controller = new AbortController();
    const failures = [];
    let reads = 0;
    const monitor = await startLifecycleMonitor({
      owned: {},
      root: "/output",
      signal: controller.signal,
      artifactPolicy: "profile",
      abort: reason => failures.push(reason),
      async sample(owned, root, identities, io, signal, policy) {
        assert.equal(policy, "profile");
        signal.throwIfAborted();
        const value = resources();
        value.artifactBytes =
          ++reads < 3 ? 512 * 1024 ** 2 : 512 * 1024 ** 2 + 1;
        return value;
      },
      async save() {},
      wait(ms, signal) {
        return new Promise((resolve, reject) =>
          signal.addEventListener("abort", () => reject(signal.reason), {
            once: true,
          })
        );
      },
    });
    try {
      await monitor.sampleNow();
      await assert.rejects(monitor.sampleNow(), /cap/i);
      await assert.rejects(monitor.sampleNow(), /cap/i);
      assert.equal(reads, 3);
      assert.equal(failures.length, 1);
    } finally {
      await monitor.stop();
    }
    for (const artifactPolicy of ["profile", null, "invalid"]) {
      await assert.rejects(
        startLifecycleMonitor({
          plan: fixture.getLifecyclePlan("soak-30m"),
          artifactPolicy,
          signal: controller.signal,
          sample() {
            throw new Error("Must not sample");
          },
        }),
        /artifact policy/i
      );
    }
  }
);

test(
  "artifact directory rename restarts the full scan without double counting",
  bounded,
  async () => {
    let attempts = 0;
    const io = artifactIO(
      async path => {
        if (path === "/output") {
          attempts++;
          return ["retained", attempts === 1 ? "updating" : "renamed"];
        }
        if (path === "/output/updating") {
          throw missingArtifact();
        }
        assert.equal(path, "/output/renamed");
        return ["database"];
      },
      async path => {
        if (path.endsWith("/retained")) {
          return artifactMetadata(100);
        }
        if (path.endsWith("/database")) {
          return artifactMetadata(200);
        }
        return artifactMetadata(10, true);
      }
    );
    const value = await artifactResources(io);
    assert.equal(value.artifactBytes, 310);
    assert.deepEqual(value.artifactScan, { attempts: 2, entries: 5 });
    assert.equal(attempts, 2);
  }
);

test(
  "a file lost before lstat requires a complete new scan",
  bounded,
  async () => {
    let attempts = 0;
    const io = artifactIO(
      async () => [++attempts === 1 ? "lost" : "new"],
      async path => {
        if (path.endsWith("/lost")) {
          throw missingArtifact();
        }
        return artifactMetadata(42);
      }
    );
    const value = await artifactResources(io);
    assert.equal(value.artifactBytes, 42);
    assert.deepEqual(value.artifactScan, { attempts: 2, entries: 2 });
  }
);

test(
  "persistent artifact churn stops after three attempts",
  bounded,
  async () => {
    let attempts = 0;
    const io = artifactIO(
      async () => {
        attempts++;
        return ["lost"];
      },
      async () => {
        throw missingArtifact();
      }
    );
    await assert.rejects(artifactResources(io), /artifact.*unstable/i);
    assert.equal(attempts, 3);
  }
);

test(
  "missing output roots and non-ENOENT errors remain fatal without retries",
  bounded,
  async () => {
    for (const operation of ["root", "lstat", "directory"]) {
      for (const code of operation === "root"
        ? ["ENOENT", "EACCES"]
        : ["EACCES", "ENOTDIR", "EIO"]) {
        let attempts = 0;
        const failure = Object.assign(new Error("Filesystem failure"), {
          code,
        });
        const io = artifactIO(
          async path => {
            if (path === "/output") {
              attempts++;
              if (operation !== "root") {
                return ["child"];
              }
            }
            throw failure;
          },
          async () => {
            if (operation === "lstat") {
              throw failure;
            }
            return artifactMetadata(10, true);
          }
        );
        await assert.rejects(artifactResources(io), error => error === failure);
        assert.equal(attempts, 1);
      }
    }
  }
);

test(
  "root disappearance on a retry cannot become an empty artifact sample",
  bounded,
  async () => {
    let attempts = 0;
    const rootFailure = missingArtifact();
    const io = artifactIO(
      async () => {
        if (++attempts > 1) {
          throw rootFailure;
        }
        return ["lost"];
      },
      async () => {
        throw missingArtifact();
      }
    );
    await assert.rejects(artifactResources(io), error => error === rootFailure);
    assert.equal(attempts, 2);
  }
);

test(
  "artifact entry budget is shared across rescan attempts",
  bounded,
  async () => {
    let attempts = 0;
    let stats = 0;
    const names = Array.from({ length: 3000 }, (_, index) => String(index));
    const io = artifactIO(
      async () => {
        attempts++;
        return names;
      },
      async path => {
        stats++;
        if (path.endsWith("/2999")) {
          throw missingArtifact();
        }
        return artifactMetadata(1);
      }
    );
    await assert.rejects(artifactResources(io), /entry cap/);
    assert.equal(attempts, 3);
    assert.equal(stats, 8192);
  }
);

test(
  "artifact byte and malformed-size failures are not retried or hidden",
  bounded,
  async () => {
    for (const size of [256 * 1024 ** 2 + 1, NaN, -1]) {
      let attempts = 0;
      const io = artifactIO(
        async () => {
          attempts++;
          return ["large", "lost"];
        },
        async path => {
          if (path.endsWith("/lost")) {
            throw missingArtifact();
          }
          return artifactMetadata(size);
        }
      );
      await assert.rejects(artifactResources(io), /artifact.*(size|cap)/);
      assert.equal(attempts, 1);
    }
  }
);

test(
  "abort during artifact reads takes priority over rescan",
  bounded,
  async () => {
    for (const operation of ["root", "lstat", "directory"]) {
      const controller = new AbortController();
      const failure = new Error("Owner stopped scan");
      let attempts = 0;
      let stats = 0;
      const io = artifactIO(
        async path => {
          if (path === "/output") {
            attempts++;
            if (operation === "root") {
              controller.abort(failure);
            }
            return ["child"];
          }
          controller.abort(failure);
          throw missingArtifact();
        },
        async () => {
          stats++;
          if (operation === "lstat") {
            controller.abort(failure);
            throw missingArtifact();
          }
          return artifactMetadata(10, true);
        }
      );
      await assert.rejects(
        artifactResources(io, controller.signal),
        error => error === failure
      );
      assert.equal(attempts, 1);
      assert.equal(stats, operation === "root" ? 0 : 1);
    }
  }
);

test(
  "completed artifact scans count symlink metadata without descending",
  bounded,
  async () => {
    let reads = 0;
    const io = artifactIO(
      async path => {
        reads++;
        assert.equal(path, "/output");
        return ["link"];
      },
      async () => artifactMetadata(123)
    );
    const value = await artifactResources(io);
    assert.equal(value.artifactBytes, 123);
    assert.deepEqual(value.artifactScan, { attempts: 1, entries: 1 });
    assert.equal(reads, 1);
  }
);

test(
  "a renamed artifact that exceeds the cap still fails on the rescan",
  bounded,
  async () => {
    let attempts = 0;
    const io = artifactIO(
      async () => [++attempts === 1 ? "lost" : "large"],
      async path => {
        if (path.endsWith("/lost")) {
          throw missingArtifact();
        }
        return artifactMetadata(256 * 1024 ** 2 + 1);
      }
    );
    await assert.rejects(artifactResources(io), /byte cap/);
    assert.equal(attempts, 2);
  }
);

test(
  "late artifact IO completion after abort cannot start another scan",
  bounded,
  async () => {
    for (const reject of [false, true]) {
      const controller = new AbortController();
      const failure = new Error("Owner cancelled pending metadata");
      const started = Promise.withResolvers();
      const pending = Promise.withResolvers();
      let attempts = 0;
      const io = artifactIO(
        async () => {
          attempts++;
          return ["held"];
        },
        () => {
          started.resolve();
          return pending.promise;
        }
      );
      const sample = artifactResources(io, controller.signal);
      const rejected = assert.rejects(sample, error => error === failure);
      await started.promise;
      controller.abort(failure);
      if (reject) {
        pending.reject(missingArtifact());
      } else {
        pending.resolve(artifactMetadata(10, true));
      }
      await rejected;
      assert.equal(attempts, 1);
    }
  }
);

test(
  "real directory rename is recovered without changing its files",
  bounded,
  async t => {
    await mkdir("/tmp/codex", { recursive: true });
    const root = await mkdtemp("/tmp/codex/artifact-rescan-");
    t.after(() => rm(root, { recursive: true, force: true }));
    const oldPath = join(root, "updating");
    const newPath = join(root, "renamed");
    await mkdir(oldPath);
    await writeFile(join(oldPath, "payload"), "data");
    let attempts = 0;
    let moved = false;
    const realPath = path => join(root, relative("/output", path));
    const io = artifactIO(
      async path => {
        if (path === "/output") {
          attempts++;
        }
        if (path === "/output/updating" && !moved) {
          await rename(oldPath, newPath);
          moved = true;
        }
        return readdir(realPath(path));
      },
      path => lstat(realPath(path))
    );
    const value = await artifactResources(io);
    assert.equal(value.artifactBytes, (await lstat(newPath)).size + 4);
    assert.deepEqual(value.artifactScan, { attempts: 2, entries: 3 });
    assert.equal(attempts, 2);
    assert.equal(await readFile(join(newPath, "payload"), "utf8"), "data");
  }
);

test(
  "resources verify owned identities around reads and keep controller separate",
  bounded,
  async () => {
    const io = procIO();
    const sample = await readLifecycleResources(
      { child: { pid: 101 }, identity: rootIdentity },
      "/output",
      new Map(),
      io
    );
    assert.equal(sample.totals.rssBytes, 2 * 1024 ** 2);
    assert.equal(sample.totals.processes, 2);
    assert.equal(sample.controller.rssBytes, 1024 ** 2);
    assert(!io.reads.some(path => path.startsWith("/proc/999/")));
    const changed = procIO((identity, count) =>
      identity.pid === 102 && count >= 2
        ? { ...identity, start: "999" }
        : identity
    );
    await assert.rejects(
      readLifecycleResources(
        { child: { pid: 101 }, identity: rootIdentity },
        "/output",
        new Map(),
        changed
      ),
      /identity|reuse/i
    );
    const denied = procIO();
    denied.readFile = async () => {
      throw Object.assign(new Error("Denied"), { code: "EACCES" });
    };
    await assert.rejects(
      readLifecycleResources(
        { child: { pid: 101 }, identity: rootIdentity },
        "/output",
        new Map(),
        denied
      ),
      /Denied/
    );
  }
);

test(
  "resource uncertainty rejects escapes, missing RSS, wrong owners and reused historical PIDs",
  bounded,
  async () => {
    const owned = { child: { pid: 101 }, identity: rootIdentity };
    const escaped = procIO(identity =>
      identity.pid === 102
        ? { ...identity, group: 500, session: 500 }
        : identity
    );
    await assert.rejects(
      readLifecycleResources(owned, "/output", new Map(), escaped),
      /group|session|descendant/i
    );
    for (const statusText of [
      "Uid:\t0\t0\t0\t0\nVmRSS:\t1 kB\n",
      `Uid:\t${process.getuid()}\t${process.getuid()}\t${process.getuid()}\t${process.getuid()}\n`,
    ]) {
      const io = procIO();
      io.readFile = async () => statusText;
      await assert.rejects(
        readLifecycleResources(owned, "/output", new Map(), io)
      );
    }
    await assert.rejects(
      readLifecycleResources(
        owned,
        "/output",
        new Map([[102, { ...rootIdentity, pid: 102, start: "90" }]]),
        procIO()
      ),
      /reuse/i
    );
  }
);

test(
  "real harmless child resources use verified proc identity and clean exit",
  bounded,
  async t => {
    await mkdir("/tmp/codex", { recursive: true });
    const root = await mkdtemp("/tmp/codex/lifecycle-resources-");
    t.after(() => rm(root, { recursive: true, force: true }));
    const owned = await spawnOwned(process.execPath, [
      "-e",
      "setTimeout(() => {}, 2500)",
    ]);
    t.after(() => stopOwned(owned, 1500));
    const value = await readLifecycleResources(owned, root);
    assert(value.totals.rssBytes > 0);
    assert.equal(value.totals.processes, 1);
    assert.equal(value.controller.identity.pid, process.pid);
    assert.equal(value.processes[0].identity.start, owned.identity.start);
    assert.equal((await stopOwned(owned, 1500)).status, "clean");
  }
);

test(
  "only affirmatively exited children may disappear during resource reads",
  bounded,
  async () => {
    const owned = { child: { pid: 101 }, identity: rootIdentity };
    const absent = procIO((identity, count) => {
      if (identity.pid === 102 && count > 1) {
        throw Object.assign(new Error("Exited"), { code: "ENOENT" });
      }
      return identity;
    });
    const value = await readLifecycleResources(
      owned,
      "/output",
      new Map(),
      absent
    );
    assert.equal(value.totals.processes, 1);
    assert.equal(value.exitedDuringRead[0].pid, 102);
    const uncertain = procIO();
    const read = uncertain.readFile;
    uncertain.readFile = path => {
      if (path === "/proc/102/status") {
        throw Object.assign(new Error("Race"), { code: "ENOENT" });
      }
      return read(path);
    };
    await assert.rejects(
      readLifecycleResources(owned, "/output", new Map(), uncertain),
      /without proven process exit/
    );
  }
);

test(
  "post-warmup baseline cannot start at 75 percent of the RSS cap",
  bounded,
  async () => {
    const controller = new AbortController();
    const writes = [];
    const monitor = await startLifecycleMonitor({
      owned: {},
      root: "/output",
      signal: controller.signal,
      abort: reason => controller.abort(new Error(reason)),
      async sample() {
        const value = resources();
        value.totals.rssBytes = 3 * GiB;
        return value;
      },
      async save(fileName) {
        writes.push(fileName);
      },
      wait(ms, signal) {
        return new Promise((resolve, reject) =>
          signal.addEventListener("abort", () => reject(signal.reason), {
            once: true,
          })
        );
      },
    });
    try {
      await assert.rejects(monitor.setBaseline(), /75%/);
      assert(!writes.includes("lifecycle-baseline.json"));
    } finally {
      await monitor.stop();
    }
  }
);

function captureInput(scenario = "valid", plan = null) {
  const checkpoints =
    plan?.checkpoints ??
    [2, 7, 12].map((completedCycles, id) => ({
      id,
      settleMs: 10000,
      completedCycles,
      documentsCompleted: [8, 24, 40][id],
    }));
  const documentIDs = checkpoints.map(item => item.documentsCompleted - 1);
  let clock = 0;
  let nextID = 0;
  let held = false;
  let heldAt;
  let active = 0;
  const events = [];
  const controller = new AbortController();
  const input = {
    ...(plan ? { plan } : {}),
    signal: controller.signal,
    now: () => clock,
    async wait(milliseconds, signal) {
      assert(held);
      assert.equal(signal, controller.signal);
      signal.throwIfAborted();
      events.push("quiet");
      clock += milliseconds;
      if (scenario === "abort") {
        controller.abort(new Error("HALT"));
      }
    },
    bounded: promise => promise,
    owned: { child: { pid: 101 } },
    profile: "/profile",
    admission: {
      urls: [0, ...documentIDs].map(documentURL),
      context: tabContext,
    },
    server: {
      async nextCheckpoint() {
        assert(!held);
        if (nextID === checkpoints.length) {
          return null;
        }
        held = true;
        heldAt = clock;
        const id = nextID++;
        return {
          ...checkpoints[id],
          id: scenario === "order" ? 2 : id,
        };
      },
      releaseCheckpoint(id) {
        assert(held);
        assert(clock - heldAt >= 10000);
        events.push(`release:${id}`);
        held = false;
      },
    },
    monitor: {
      async sampleNow() {
        return resources();
      },
      async setBaseline() {
        assert(clock - heldAt >= 10000);
        events.push("baseline");
        return resources();
      },
    },
    control: {
      async request(method, params) {
        assert(held);
        assert(clock - heldAt >= 10000);
        assert.equal(active++, 0);
        if (method === "umbrafox.performance.snapshot") {
          assert.deepEqual(params, {
            includeThreads: false,
            includeWindows: true,
          });
        }
        events.push(method);
        await Promise.resolve();
        active--;
        if (scenario === "rpc") {
          throw new Error("RPC failed");
        }
        return method === "umbrafox.performance.snapshot"
          ? {
              processID: 101,
              profiler: { active: scenario === "profiler" },
              process: {
                pid: 101,
                type: "browser",
                memory: GiB,
                cpuTime: 1,
                children: [],
                windows: [
                  processWindow(
                    scenario === "foreign-window"
                      ? "https://example.test/"
                      : documentURL(documentIDs[nextID - 1])
                  ),
                ],
              },
            }
          : {
              processID: 101,
              profileDir: "/profile",
              channel: "umbrafox-control",
              memory: { resident: GiB, ghostWindows: null },
              windows: diagnosticTabs(
                scenario === "foreign-tab"
                  ? "https://example.test/"
                  : documentURL(documentIDs[nextID - 1])
              ).windows,
            };
      },
    },
    async save(fileName) {
      assert(held);
      events.push(fileName);
      if (scenario === "write") {
        throw new Error("Write failed");
      }
    },
  };
  return {
    input,
    events,
    controller,
    advance(milliseconds) {
      clock += milliseconds;
    },
  };
}

for (const wakeups of [[9999.5], [9999.5, 0, 0.125, 0.125]]) {
  test(
    `quiet deadline survives early wakes ${JSON.stringify(wakeups)}`,
    bounded,
    async () => {
      const { input, events } = captureInput();
      const wait = input.wait;
      const requests = [];
      input.wait = async (milliseconds, signal) => {
        requests.push(milliseconds);
        await wait(wakeups[requests.length - 1] ?? milliseconds, signal);
        if (input.now() < 10000) {
          assert(events.every(item => item === "quiet"));
        }
      };
      await captureLifecycle(input);
      assert.deepEqual(requests, [
        10000,
        ...Array(wakeups.length).fill(1),
        10000,
        10000,
      ]);
      assert.equal(events.at(-1), "release:2");
    }
  );
}

test(
  "quiet waits stop on abort before or during a repeat",
  bounded,
  async () => {
    for (const abortAt of [1, 2]) {
      for (const reason of ["HALT", "Lifecycle resource cap exceeded"]) {
        const { input, events, controller } = captureInput();
        const wait = input.wait;
        const requests = [];
        input.wait = async (milliseconds, signal) => {
          requests.push(milliseconds);
          if (requests.length === 1) {
            await wait(9999.5, signal);
          }
          if (requests.length === abortAt) {
            if (abortAt === 1) {
              controller.abort(new Error(reason));
              return;
            }
            await new Promise((resolve, reject) => {
              signal.addEventListener("abort", () => reject(signal.reason), {
                once: true,
              });
              controller.abort(new Error(reason));
            });
          }
        };
        await assert.rejects(captureLifecycle(input), { message: reason });
        assert.deepEqual(requests, abortAt === 1 ? [10000] : [10000, 1]);
        assert(events.every(item => item === "quiet"));
      }
    }
  }
);

test(
  "quiet retries cannot renew the remaining work budget",
  bounded,
  async () => {
    const { input, events, controller, advance } = captureInput();
    const budget = createLifecycleBudget(120000, input.now);
    advance(95000);
    const wait = input.wait;
    const requests = [];
    input.wait = async (milliseconds, signal) => {
      requests.push(milliseconds);
      if (requests.length === 1) {
        await wait(9999.5, signal);
        assert.equal(budget.remaining(), 0.5);
        return;
      }
      await wait(Math.min(milliseconds, budget.remaining()), signal);
      controller.abort(new Error("Run deadline exceeded"));
    };
    await assert.rejects(captureLifecycle(input), /Run deadline exceeded/);
    assert.deepEqual(requests, [10000, 1]);
    assert(events.every(item => item === "quiet"));
    assert.throws(() => budget.remaining(), /deadline/);
    assert.equal(budget.remaining(true), 13000);
    assert.equal(budget.remainingTerminal(), 15000);
  }
);

test(
  "exact quiet deadlines need only one wait per checkpoint",
  bounded,
  async () => {
    const { input } = captureInput();
    const wait = input.wait;
    const requests = [];
    input.wait = async (milliseconds, signal) => {
      requests.push(milliseconds);
      await wait(milliseconds, signal);
    };
    await captureLifecycle(input);
    assert.deepEqual(requests, [10000, 10000, 10000]);
    assert.equal(input.now(), 30000);
  }
);

test(
  "HALT cancels checkpoint and RPC waits without releasing work",
  bounded,
  async () => {
    for (const phase of ["checkpoint", "rpc"]) {
      const { input, events, controller } = captureInput();
      input.bounded = (promise, label) =>
        withTimeout(promise, 200, label, input.signal);
      const hanging = () => {
        controller.abort(new Error("HALT"));
        return new Promise(() => {});
      };
      if (phase === "checkpoint") {
        input.server.nextCheckpoint = hanging;
      } else {
        input.control.request = hanging;
      }
      await assert.rejects(captureLifecycle(input), /HALT/);
      assert(!events.some(item => item.startsWith("release:")));
    }
  }
);

test(
  "monitor serializes reads, preserves cap failure, and stops its fake clock loop",
  bounded,
  async () => {
    const controller = new AbortController();
    const gates = [];
    const writes = [];
    let reads = 0;
    let clock = 0;
    let aborted;
    const monitor = await startLifecycleMonitor({
      owned: {},
      root: "/output",
      signal: controller.signal,
      now: () => clock,
      abort(reason) {
        aborted = reason;
        controller.abort(new Error(reason));
      },
      async sample() {
        const value = resources();
        if (reads++ > 0) {
          value.totals.rssBytes = 5 * GiB;
        }
        return value;
      },
      async save(fileName, value) {
        writes.push({ name: fileName, value });
      },
      wait(ms, signal) {
        assert.equal(ms, 5000);
        return new Promise((resolve, reject) => {
          const abort = () => reject(signal.reason);
          signal.addEventListener("abort", abort, { once: true });
          gates.push(() => {
            signal.removeEventListener("abort", abort);
            clock += ms;
            resolve();
          });
        });
      },
    });
    assert.equal(reads, 1);
    gates.shift()();
    for (let index = 0; index < 40; index++) {
      await Promise.resolve();
    }
    assert.match(aborted, /cap/);
    assert.equal(writes.length, 2);
    assert.equal(writes[1].value.totals.rssBytes, 5 * GiB);
    await monitor.stop();
    assert.equal(gates.length, 0);
  }
);

test(
  "three held quiet checkpoints serialize snapshots before each exact release",
  bounded,
  async () => {
    const { input, events } = captureInput();
    await captureLifecycle(input);
    assert.equal(events.filter(item => item === "quiet").length, 3);
    assert.equal(
      events.filter(item => item === "umbrafox.performance.snapshot").length,
      3
    );
    assert.equal(
      events.filter(item => item === "umbrafox.diagnostics.snapshot").length,
      2
    );
    assert.deepEqual(
      events.filter(item => item.startsWith("release:")),
      ["release:0", "release:1", "release:2"]
    );
    assert.equal(events.at(-1), "release:2");
  }
);

for (const scenario of [
  "abort",
  "order",
  "rpc",
  "write",
  "profiler",
  "foreign-tab",
  "foreign-window",
]) {
  test(
    `checkpoint ${scenario} fails without releasing active work`,
    bounded,
    async () => {
      const { input, events } = captureInput(scenario);
      await assert.rejects(captureLifecycle(input));
      assert(!events.some(item => item.startsWith("release:")));
      if (scenario.startsWith("foreign-")) {
        assert(events.includes("lifecycle-checkpoint-0.json"));
      }
    }
  );
}
