/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import process from "node:process";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { createServer, request } from "node:http";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";
import {
  browserEnvironment,
  connectControl,
  createBoundedLogger,
  createFixtureServer,
  expectedChecksums,
  parseArgs,
  readIdentity,
  spawnOwned,
  stopOwned,
  summarize,
  validateDiscovery,
  validateResult,
  withTimeout,
} from "../helpers.mjs";
import { captureWorkloads, checkBus, main, readDiscovery } from "../run.mjs";
import {
  arithmeticWorkload,
  fillPixels,
  pixelHash,
} from "../fixture/fixture.mjs";

const bounded = { timeout: 10000 };

test(
  "fixture snapshots preserve success and failure state before cleanup",
  bounded,
  async () => {
    const { preserveFixtureState } = await import("../run.mjs");
    assert.equal(typeof preserveFixtureState, "function");
    for (const initialStatus of ["passed", "failed"]) {
      const events = [];
      const report = { status: initialStatus };
      const previousFailure =
        initialStatus === "failed" ? new Error("Fixture timed out") : undefined;
      const state = {
        started: true,
        settled: false,
        scriptReady: false,
        samples: [],
        requests: [{ path: "root" }],
        pendingGates: 1,
      };
      const server = {
        snapshot() {
          events.push("snapshot");
          return state;
        },
        close() {
          events.push("close");
        },
      };
      const failure = await preserveFixtureState({
        server,
        report,
        failure: previousFailure,
        scrub: value => value,
        async save(fileName, value) {
          events.push("save");
          assert.equal(fileName, "fixture-state.json");
          assert.equal(value, state);
        },
      });
      events.push("abort");
      server.close();
      assert.deepEqual(events, ["snapshot", "save", "abort", "close"]);
      assert.equal(failure, previousFailure);
      assert.equal(report.status, initialStatus);
    }
    const report = { status: "passed" };
    assert.equal(
      await preserveFixtureState({
        server: {},
        report,
        save() {
          assert.fail("Basic has no snapshot");
        },
        scrub: value => value,
      }),
      undefined
    );
    assert.deepEqual(report, { status: "passed" });
  }
);

test(
  "fixture snapshot errors and bounded write timeout never bypass owned-child cleanup",
  bounded,
  async t => {
    const { preserveFixtureState } = await import("../run.mjs");
    assert.equal(typeof preserveFixtureState, "function");
    for (const scenario of ["snapshot", "write", "timeout", "async"]) {
      const owned = await spawnOwned(process.execPath, [
        "-e",
        "setTimeout(() => {}, 1500)",
      ]);
      t.after(() => stopOwned(owned, 1500));
      const report = { status: "passed" };
      const events = [];
      const failure = await preserveFixtureState({
        server: {
          snapshot() {
            events.push("snapshot");
            if (scenario === "snapshot") {
              throw new Error("Synthetic sensitive snapshot failure");
            }
            if (scenario === "async") {
              return Promise.reject(
                new Error("Async snapshot is not supported")
              );
            }
            return { requests: [], pendingGates: 1 };
          },
        },
        report,
        scrub: value => value.replace("sensitive", "[redacted]"),
        timeoutMs: 20,
        async save() {
          events.push("save");
          if (scenario === "write") {
            throw new Error("Evidence disk full");
          }
          return new Promise(() => {});
        },
      });
      events.push("abort");
      const cleanup = await stopOwned(owned, 1500);
      events.push("close");
      assert.equal(cleanup.status, "clean");
      assert.equal(report.status, "failed");
      assert(failure instanceof Error);
      assert(!report.fixtureStateError.includes("sensitive"));
      assert.equal(events.at(-2), "abort");
      assert.equal(events.at(-1), "close");
      if (scenario === "timeout") {
        assert.match(report.fixtureStateError, /timed out/);
      }
      if (scenario === "async") {
        assert.match(report.fixtureStateError, /synchronous object/);
      }
    }
    const report = { status: "failed" };
    const original = new Error("Original timeout");
    const retained = await preserveFixtureState({
      server: {
        snapshot() {
          throw new Error("Snapshot failed");
        },
      },
      report,
      failure: original,
      scrub: value => value,
      save() {
        assert.fail("No write after snapshot failure");
      },
    });
    assert.equal(retained, original);
    assert.equal(report.fixtureStateError, "Snapshot failed");
    const invalidFailure = null;
    const nonErrorReport = { status: "passed" };
    const normalized = await preserveFixtureState({
      server: {
        snapshot() {
          throw invalidFailure;
        },
      },
      report: nonErrorReport,
      scrub: value => value,
      save() {
        assert.fail("No write after invalid snapshot failure");
      },
    });
    assert(normalized instanceof Error);
    assert.equal(nonErrorReport.status, "failed");
  }
);

test(
  "userland provenance follows adjacent module symlinks and records packaged absence without fallback",
  bounded,
  async () => {
    const { collectProvenance } = await import("../run.mjs");
    assert.equal(typeof collectProvenance, "function");
    for (const layout of ["loose", "packaged", "invalid"]) {
      const directory = await mkdtemp("/tmp/codex/perf-provenance-");
      const binary = join(directory, "fixture-binary");
      const output = join(directory, "output");
      await mkdir(output, { mode: 0o700 });
      const header = Buffer.alloc(20);
      header.set([0x7f, 0x45, 0x4c, 0x46, 2, 1]);
      header.writeUInt16LE(62, 18);
      await writeFile(binary, header, { mode: 0o700 });
      await writeFile(join(directory, "libxul.so"), "synthetic identity only");
      await writeFile(
        join(directory, "application.ini"),
        "[App]\nBuildID=synthetic\n"
      );
      const moduleName = "modules/UmbrafoxUserlandScriptRegistry.sys.mjs";
      const sourcePath = join(directory, "synthetic-source.mjs");
      const source = "export const syntheticIdentity = 1;\n";
      if (layout !== "packaged") {
        await mkdir(join(directory, "modules"));
        if (layout === "loose") {
          await writeFile(sourcePath, source);
          await symlink(sourcePath, join(directory, moduleName));
        } else {
          await mkdir(join(directory, moduleName));
        }
      }
      const records = new Map();
      const operation = collectProvenance(
        { binary, suite: "userland-cache", profile: "off" },
        output,
        new AbortController().signal,
        async (fileName, value) => records.set(fileName, value)
      );
      if (layout === "invalid") {
        await assert.rejects(operation, { code: "EISDIR" });
        continue;
      }
      await operation;
      const provenance = records.get("provenance.json");
      assert.equal(Object.keys(provenance.userlandModules).length, 6);
      assert.equal(
        provenance.userlandModules["actors/UmbrafoxUserlandChild.sys.mjs"],
        null
      );
      assert.match(
        provenance.fixtureHashes["userland-cache.mjs"],
        /^[a-f0-9]{64}$/
      );
      if (layout === "loose") {
        assert.deepEqual(provenance.userlandModules[moduleName], {
          path: sourcePath,
          sha256: createHash("sha256").update(source).digest("hex"),
        });
      } else {
        assert(
          Object.values(provenance.userlandModules).every(
            value => value === null
          )
        );
      }
    }
  }
);

test(
  "suite evidence preparation writes private stores and preserves synthetic userland URLs",
  bounded,
  async () => {
    const { prepareFixtureEvidence } = await import("../run.mjs");
    assert.equal(typeof prepareFixtureEvidence, "function");
    const directory = await mkdtemp("/tmp/codex/perf-userland-store-");
    const profile = join(directory, "profile");
    await mkdir(profile, { mode: 0o700 });
    const server = {
      url: "http://127.0.0.1:1234/synthetic-nonce/",
      scriptStore: {
        version: 1,
        scripts: [
          {
            code: "synthetic-script",
            scope: { origin: "http://127.0.0.1:1234" },
          },
        ],
      },
      metadata: {
        targetURL: "http://127.0.0.1:1235/synthetic-nonce/target.js",
      },
    };
    const secrets = [];
    const writes = new Map();
    await prepareFixtureEvidence(
      "userland-cache",
      profile,
      server,
      async (fileName, value) => writes.set(fileName, value),
      secrets
    );
    assert.deepEqual(secrets, []);
    assert.deepEqual(
      JSON.parse(
        await readFile(
          join(profile, "umbrafox", "userland-scripts.json"),
          "utf8"
        )
      ),
      server.scriptStore
    );
    assert.equal((await stat(join(profile, "umbrafox"))).mode & 0o777, 0o700);
    assert.equal(
      (await stat(join(profile, "umbrafox", "userland-scripts.json"))).mode &
        0o777,
      0o600
    );
    assert.equal(
      writes.get("userland-cache-metadata.json").targetURL,
      server.metadata.targetURL
    );
    assert.deepEqual(
      writes.get("userland-script-store.json"),
      server.scriptStore
    );
    await prepareFixtureEvidence(
      "basic",
      "/unused",
      server,
      async () => assert.fail("Basic must not write userland evidence"),
      secrets
    );
    assert.deepEqual(secrets, ["/synthetic-nonce/"]);
    const failedProfile = join(directory, "failed-profile");
    await mkdir(failedProfile, { mode: 0o700 });
    await assert.rejects(
      prepareFixtureEvidence(
        "userland-cache",
        failedProfile,
        server,
        async () => {
          throw new Error("Evidence write failed");
        },
        []
      ),
      /Evidence write failed/
    );
    assert.deepEqual(
      JSON.parse(
        await readFile(
          join(failedProfile, "umbrafox", "userland-scripts.json"),
          "utf8"
        )
      ),
      server.scriptStore
    );
  }
);

test(
  "suite CLI preserves basic defaults and constrains userland cache diagnostics",
  bounded,
  () => {
    const args = [
      "--binary",
      "/binary",
      "--output",
      "/new-output",
      "--bus",
      "/bus",
      "--profile",
      "off",
    ];
    assert.equal(parseArgs(args).suite, "basic");
    for (const userlandCase of ["none", "disabled", "unrelated", "visited"]) {
      const parsed = parseArgs([
        ...args,
        "--suite",
        "userland-cache",
        "--userland-case",
        userlandCase,
        "--timeout-ms",
        "180000",
      ]);
      assert.equal(parsed["userland-case"], userlandCase);
      assert.equal(parsed["timeout-ms"], 180000);
    }
    assert.throws(() => parseArgs([...args, "--suite", "invalid"]), /suite/);
    assert.throws(
      () => parseArgs([...args, "--suite", "userland-cache"]),
      /userland-case/
    );
    assert.throws(
      () => parseArgs([...args, "--userland-case", "none"]),
      /userland-case/
    );
    assert.throws(
      () => parseArgs([...args, "--suite", "basic", "--userland-case", "none"]),
      /userland-case/
    );
    assert.throws(
      () =>
        parseArgs([
          ...args,
          "--suite",
          "userland-cache",
          "--userland-case",
          "invalid",
        ]),
      /userland-case/
    );
    assert.throws(
      () =>
        parseArgs([
          ...args.slice(0, -1),
          "on",
          "--suite",
          "userland-cache",
          "--userland-case",
          "none",
        ]),
      /profile.*off/
    );
  }
);

test(
  "userland diagnostics force only the declared ScriptLoader logging",
  bounded,
  () => {
    const input = { MOZ_LOG: "unrelated:5", MOZ_PROFILER_STARTUP: "1" };
    const diagnostic = browserEnvironment(input, "off", "userland-cache");
    assert.equal(diagnostic.env.MOZ_LOG, "timestamp,sync,ScriptLoader:4");
    assert.equal(diagnostic.env.MOZ_PROFILER_STARTUP, undefined);
    assert.equal(
      browserEnvironment(input, "off", "basic").env.MOZ_LOG,
      undefined
    );
    assert.throws(
      () => browserEnvironment(input, "on", "userland-cache"),
      /profile.*off/
    );
  }
);

test(
  "userland capture preserves gates, raw evidence, validator rejection and diagnostic-only output",
  bounded,
  async () => {
    for (const scenario of [
      "valid",
      "invalid",
      "identity",
      "profiler",
      "write",
    ]) {
      const writes = [];
      const requests = [];
      let started = false;
      let validated = false;
      const result = { suite: "userland-cache", syntheticResult: true };
      const options = {
        suite: "userland-cache",
        "userland-case": "none",
        profile: "off",
      };
      const args = {
        control: {
          async request(method) {
            requests.push(method);
            if (method === "umbrafox.diagnostics.snapshot") {
              return {
                processID: scenario === "identity" ? 9 : 1234,
                profileDir: "/profile",
                channel: "umbrafox-control",
              };
            }
            return { profiler: { active: scenario === "profiler" } };
          },
        },
        owned: { child: { pid: 1234 } },
        profile: "/profile",
        options,
        environment: { env: {} },
        root: "/unused",
        mode: "diagnostic-only",
        async save(fileName, value) {
          writes.push({ fileName, value });
          if (scenario === "write" && fileName === "samples.json") {
            throw new Error("Diagnostic evidence write failed");
          }
        },
        milestone() {},
        bounded: promise => promise,
        scrub: value => value,
        signal: new AbortController().signal,
        server: {
          start() {
            started = true;
          },
          result: Promise.resolve(result),
        },
        validateUserlandCacheResult(value, receivedOptions) {
          validated = true;
          assert.equal(writes.at(-1).fileName, "samples.json");
          assert.equal(value, result);
          assert.equal(receivedOptions, options);
          if (scenario === "invalid") {
            throw new Error("Invalid userland checksum");
          }
        },
      };
      if (scenario === "valid") {
        await captureWorkloads(args);
        const statistics = writes.find(
          item => item.fileName === "statistics.json"
        ).value;
        assert.equal(statistics.mode, "diagnostic-only");
        assert.equal(statistics.workloads, null);
        assert.match(statistics.explanation, /diagnostic/i);
        assert.equal(requests.at(-1), "umbrafox.performance.snapshot");
      } else {
        const expected = {
          invalid: /Invalid userland checksum/,
          identity: /owned browser/,
          profiler: /profiler mode/,
          write: /evidence write failed/,
        };
        await assert.rejects(captureWorkloads(args), expected[scenario]);
        assert(!writes.some(item => item.fileName === "statistics.json"));
      }
      assert.equal(started, !["identity", "profiler"].includes(scenario));
      assert.equal(validated, ["valid", "invalid"].includes(scenario));
    }
  }
);

test(
  "basic capture retains its four timing summaries without the userland validator",
  bounded,
  async () => {
    const samples = [];
    for (const stage of ["warmup", "trial"]) {
      for (let index = 0; index < (stage === "warmup" ? 1 : 3); index++) {
        for (const [workload, checksum] of Object.entries(expectedChecksums)) {
          samples.push({
            stage,
            index,
            workload,
            checksum,
            durationMs: index + 1,
          });
        }
      }
    }
    const writes = new Map();
    await captureWorkloads({
      control: {
        async request(method) {
          return method === "umbrafox.diagnostics.snapshot"
            ? {
                processID: 1234,
                profileDir: "/profile",
                channel: "umbrafox-control",
              }
            : { profiler: { active: false } };
        },
      },
      owned: { child: { pid: 1234 } },
      profile: "/profile",
      options: { suite: "basic", profile: "off", trials: 3, warmup: 1 },
      environment: { env: {} },
      root: "/unused",
      mode: "local-timing",
      save: async (fileName, value) => writes.set(fileName, value),
      milestone() {},
      bounded: promise => promise,
      scrub: value => value,
      signal: new AbortController().signal,
      server: { start() {}, result: Promise.resolve({ version: 1, samples }) },
      validateUserlandCacheResult() {
        assert.fail("Basic must not invoke userland validator");
      },
    });
    assert.equal(writes.get("statistics.json").mode, "local-timing");
    assert.deepEqual(
      Object.keys(writes.get("statistics.json").workloads),
      Object.keys(expectedChecksums)
    );
    assert.equal(writes.get("statistics.json").workloads.js.median, 2);
  }
);

test(
  "diagnostic evidence rejects dropped logs while retaining bounded logger counters",
  bounded,
  async () => {
    const { validateLogEvidence } = await import("../helpers.mjs");
    assert.equal(typeof validateLogEvidence, "function");
    const logger = createBoundedLogger(
      async () => {},
      value => value,
      4
    );
    logger.push("stdout", "12345\n");
    const evidence = await logger.finish();
    assert.equal(evidence.droppedBytes, 6);
    assert.throws(
      () => validateLogEvidence(evidence, "userland-cache"),
      /diagnostic.*log/i
    );
    assert.doesNotThrow(() => validateLogEvidence(evidence, "basic"));
    assert.doesNotThrow(() =>
      validateLogEvidence(
        { writtenBytes: 4, droppedBytes: 0 },
        "userland-cache"
      )
    );
    assert.throws(
      () => validateLogEvidence(undefined, "userland-cache"),
      /diagnostic.*log/i
    );
  }
);

test(
  "discovery waits for delayed private publication without reading incomplete contents",
  bounded,
  async () => {
    const directory = await mkdtemp("/tmp/codex/perf-discovery-");
    const path = join(directory, "control.json");
    await writeFile(path, "incomplete publication", { mode: 0o644 });
    await chmod(path, 0o644);
    const publication = delay(80).then(async () => {
      await writeFile(
        path,
        JSON.stringify({
          host: "localhost",
          port: 1234,
          path: "/umbrafox-control",
          token: "synthetic",
          websocketUrl: "ws://localhost:1234/umbrafox-control?token=synthetic",
        })
      );
      await chmod(path, 0o600);
    });
    try {
      const discovery = await readDiscovery(
        path,
        new AbortController().signal,
        1000
      );
      assert.equal(discovery.port, 1234);
    } finally {
      await publication;
    }
  }
);

test(
  "discovery fails closed on persistent public mode, missing publication and HALT",
  bounded,
  async () => {
    const directory = await mkdtemp("/tmp/codex/perf-discovery-");
    const path = join(directory, "control.json");
    await writeFile(path, "must not parse this non-private payload", {
      mode: 0o644,
    });
    await chmod(path, 0o644);
    await assert.rejects(
      readDiscovery(path, new AbortController().signal, 70),
      /timed out/
    );
    await assert.rejects(
      readDiscovery(
        join(directory, "missing.json"),
        new AbortController().signal,
        70
      ),
      /timed out/
    );
    const controller = new AbortController();
    const pending = assert.rejects(
      readDiscovery(path, controller.signal, 1000),
      /HALT/
    );
    controller.abort(new Error("HALT requested"));
    await pending;
  }
);

test(
  "discovery rejects non-regular files and hides malformed private payloads",
  bounded,
  async () => {
    const directory = await mkdtemp("/tmp/codex/perf-discovery-");
    const path = join(directory, "control.json");
    const invalid = "synthetic-private-payload-must-not-appear";
    await writeFile(path, invalid, { mode: 0o600 });
    const linked = join(directory, "linked.json");
    await symlink(path, linked);
    const signal = new AbortController().signal;
    await assert.rejects(
      readDiscovery(linked, signal, 1000),
      /owner-private regular file/
    );
    await assert.rejects(
      readDiscovery(directory, signal, 1000),
      /owner-private regular file/
    );
    await assert.rejects(readDiscovery(path, signal, 1000), error => {
      assert.equal(error.message, "Malformed discovery JSON");
      assert(!error.message.includes(invalid));
      return true;
    });
  }
);

test(
  "capture extraction preserves write failures, ordering and raw invalid evidence",
  bounded,
  async () => {
    for (const failWrite of [true, false]) {
      const writes = [];
      const requests = [];
      let started = false;
      const profile = "/isolated-test-profile";
      const args = {
        control: {
          async request(method) {
            requests.push(method);
            if (method === "umbrafox.diagnostics.snapshot") {
              return {
                processID: 1234,
                profileDir: profile,
                channel: "umbrafox-control",
              };
            }
            return { profiler: { active: false } };
          },
        },
        owned: { child: { pid: 1234 } },
        profile,
        options: { profile: "off", trials: 3, warmup: 1 },
        environment: { env: {} },
        root: "/unused-test-output",
        mode: "local-timing",
        async save(fileName, value) {
          writes.push({ fileName, value });
          if (failWrite && fileName === "graphics-before.json") {
            throw new Error("Evidence disk full");
          }
        },
        milestone() {},
        bounded: promise => promise,
        scrub: value => value,
        signal: new AbortController().signal,
        server: {
          start() {
            started = true;
          },
          result: Promise.resolve({ version: 1, samples: [] }),
        },
      };
      await assert.rejects(
        captureWorkloads(args),
        failWrite ? /Evidence disk full/ : /sample count/
      );
      assert.equal(started, !failWrite);
      assert.deepEqual(
        requests,
        failWrite
          ? ["umbrafox.diagnostics.snapshot", "umbrafox.gfx.snapshot"]
          : [
              "umbrafox.diagnostics.snapshot",
              "umbrafox.gfx.snapshot",
              "umbrafox.performance.snapshot",
            ]
      );
      if (!failWrite) {
        assert.deepEqual(writes.at(-1), {
          fileName: "samples.json",
          value: { version: 1, samples: [] },
        });
      }
    }
  }
);

test(
  "CLI requires explicit absolute paths and rejects ambiguous values",
  bounded,
  () => {
    const args = [
      "--binary",
      "/bin/browser",
      "--output",
      "/tmp/new",
      "--profile",
      "off",
      "--bus",
      "/tmp/bus",
    ];
    assert.equal(parseArgs(args).trials, 7);
    assert.throws(() => parseArgs([...args, "--profile", "on"]), /duplicate/i);
    assert.throws(() => parseArgs([...args, "--trials", "NaN"]), /trials/i);
    assert.throws(() => parseArgs([...args, "--trials", "2"]), /trials/i);
    assert.throws(() => parseArgs([...args, "--unknown", "x"]), /unknown/i);
    assert.throws(
      () =>
        parseArgs(args.map(value => (value === "/tmp/new" ? "./new" : value))),
      /absolute/i
    );
    assert.throws(() => parseArgs(args.slice(0, -1)), /value/i);
  }
);

test(
  "statistics retain raw samples, use sample deviation, reject nonfinite data",
  bounded,
  () => {
    const result = summarize([1, 2, 3, 4, 5]);
    assert.deepEqual(result.samples, [1, 2, 3, 4, 5]);
    assert.equal(result.median, 3);
    assert.equal(result.mean, 3);
    assert.equal(result.standardDeviation, Math.sqrt(2.5));
    assert.equal(result.p95, 5);
    assert.equal(result.minimum, 1);
    assert.equal(result.maximum, 5);
    for (const samples of [
      [],
      [1],
      [1, NaN],
      [1, Infinity],
      [1, -1],
      [1, "2"],
      [1e308, 1e308],
    ]) {
      assert.throws(() => summarize(samples));
    }
  }
);

test(
  "environment uses an allowlist and scrubs diagnostic/driver overrides",
  bounded,
  () => {
    const input = {
      PATH: "/bin",
      HOME: "/home/test",
      LANG: "C.UTF-8",
      SECRET: "do-not-record",
      MESA_LOADER_DRIVER_OVERRIDE: "zink",
      MOZ_PROFILER_STARTUP: "1",
      LD_PRELOAD: "/bad.so",
    };
    const off = browserEnvironment(input, "off");
    assert.equal(off.env.SECRET, undefined);
    assert.equal(off.env.LD_PRELOAD, undefined);
    assert.equal(off.env.MESA_LOADER_DRIVER_OVERRIDE, undefined);
    assert.equal(off.env.MOZ_PROFILER_STARTUP, undefined);
    assert(off.scrubbed.includes("MESA_LOADER_DRIVER_OVERRIDE"));
    assert(!JSON.stringify(off).includes("do-not-record"));
    assert.equal(off.overridePresence.LP_PERF, null);
    assert.equal(
      browserEnvironment({ LP_DEBUG: "never-record" }, "off").overridePresence
        .LP_DEBUG,
      "present-scrubbed"
    );
    assert.equal(browserEnvironment(input, "on").env.MOZ_PROFILER_STARTUP, "1");
  }
);

test(
  "discovery accepts only consistent owner-local authenticated endpoints",
  bounded,
  () => {
    const valid = {
      host: "localhost",
      port: 1234,
      path: "/umbrafox-control",
      token: "private-token",
      websocketUrl: "ws://localhost:1234/umbrafox-control?token=private-token",
    };
    assert.equal(validateDiscovery(valid), valid.websocketUrl);
    for (const replacement of [
      { host: "example.com" },
      { port: 0 },
      { token: "" },
      {
        websocketUrl:
          "ws://example.com:1234/umbrafox-control?token=private-token",
      },
      { websocketUrl: "ws://localhost:1234/umbrafox-control?token=other" },
    ]) {
      assert.throws(
        () => validateDiscovery({ ...valid, ...replacement }),
        /discovery/i
      );
    }
  }
);

test(
  "result validation rejects missing, duplicate, malformed and incorrect trials",
  bounded,
  () => {
    const config = { trials: 3, warmup: 1 };
    const rows = [];
    for (const stage of ["warmup", "trial"]) {
      for (let index = 0; index < (stage === "warmup" ? 1 : 3); index++) {
        for (const [workload, checksum] of Object.entries({
          js: 4290276580,
          "dom-batched": 25600,
          "dom-interleaved": 25600,
          canvas: 2296114373,
        })) {
          rows.push({ stage, index, workload, durationMs: 1, checksum });
        }
      }
    }
    const result = { version: 1, samples: rows };
    assert.doesNotThrow(() => validateResult(result, config));
    assert.throws(() =>
      validateResult({ ...result, samples: rows.slice(1) }, config)
    );
    assert.throws(() =>
      validateResult(
        { ...result, samples: [...rows.slice(1), rows[1]] },
        config
      )
    );
    for (const values of [
      { durationMs: null },
      { durationMs: Infinity },
      { durationMs: 300001 },
      { checksum: 0 },
      { index: -1 },
      { workload: "other" },
    ]) {
      assert.throws(() =>
        validateResult(
          { ...result, samples: [{ ...rows[0], ...values }, ...rows.slice(1)] },
          config
        )
      );
    }
  }
);

test(
  "fixture server rejects foreign origin, incorrect host, body overflow and duplicates",
  bounded,
  async t => {
    const server = await createFixtureServer({ trials: 3, warmup: 1 });
    t.after(() => server.close());
    assert.equal((await fetch(`${server.url}fixture.mjs`)).status, 200);
    assert.equal((await fetch(`${server.url}../helpers.mjs`)).status, 404);
    assert.equal(
      (
        await fetch(`${server.url}result`, {
          method: "POST",
          headers: { Origin: "https://example.com" },
          body: "{}",
        })
      ).status,
      403
    );
    const foreignHost = await new Promise((resolve, reject) => {
      const outgoing = request(
        server.url,
        { headers: { Host: "example.com" } },
        response => {
          response.resume();
          resolve(response.statusCode);
        }
      );
      outgoing.on("error", reject);
      outgoing.end();
    });
    assert.equal(foreignHost, 403);
    const gate = fetch(`${server.url}start`).then(response => response.json());
    server.start();
    assert.deepEqual(await gate, { trials: 3, warmup: 1 });
    assert.equal(
      (
        await fetch(`${server.url}result`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{",
        })
      ).status,
      400
    );
    assert.equal(
      (
        await fetch(`${server.url}result`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "x".repeat(70000),
        })
      ).status,
      413
    );
    assert.equal(
      (
        await fetch(`${server.url}result`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: '{"version":1}',
        })
      ).status,
      200
    );
    assert.deepEqual(await server.result, { version: 1 });
    assert.equal(
      (
        await fetch(`${server.url}result`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        })
      ).status,
      409
    );
  }
);

test(
  "real detached child identity and SIGTERM cleanup are proven",
  bounded,
  async t => {
    const owned = await spawnOwned(process.execPath, [
      "-e",
      "setInterval(() => {}, 1000)",
    ]);
    t.after(() => stopOwned(owned, 1500));
    const identity = await readIdentity(owned.child.pid);
    assert.equal(identity.parent, process.pid);
    assert.equal(identity.group, owned.child.pid);
    assert.equal(identity.session, owned.child.pid);
    assert.equal(identity.start, owned.identity.start);
    const cleanup = await stopOwned(owned, 1500);
    assert.equal(cleanup.status, "clean");
    assert.equal((await owned.completion).signal, "SIGTERM");
    assert.equal((await stopOwned(owned, 1500)).status, "clean");
  }
);

test(
  "spawn failure and early exit are handled without unhandled rejection",
  bounded,
  async () => {
    const missing = await spawnOwned("/definitely-not-a-program", []);
    assert.equal((await missing.completion).error.code, "ENOENT");
    assert.equal((await stopOwned(missing, 500)).status, "clean");
    const early = await spawnOwned(process.execPath, ["-e", "process.exit(7)"]);
    assert.equal((await early.completion).code, 7);
    assert.equal((await stopOwned(early, 500)).status, "clean");
  }
);

test(
  "identity mismatch refuses signaling; stubborn child reports failure without KILL",
  bounded,
  async () => {
    const directory = await mkdtemp(join(tmpdir(), "perf-child-"));
    const ready = join(directory, "ready");
    const script = `require('fs').writeFileSync(${JSON.stringify(ready)}, 'ready'); process.on('SIGTERM', () => {}); setTimeout(() => process.exit(0), 900);`;
    const owned = await spawnOwned(process.execPath, ["-e", script]);
    for (let attempt = 0; attempt < 50; attempt++) {
      try {
        await readFile(ready);
        break;
      } catch (error) {
        if (error.code !== "ENOENT") {
          throw error;
        }
        await delay(10);
      }
    }
    const identity = owned.identity;
    owned.identity = { ...identity, start: `${identity.start}0` };
    assert.equal((await stopOwned(owned, 50)).status, "cleanup-failed");
    owned.identity = { ...identity, group: process.pid };
    const actualKill = process.kill;
    const signals = [];
    process.kill = (...args) => signals.push(args);
    try {
      assert.equal((await stopOwned(owned, 50)).status, "cleanup-failed");
    } finally {
      process.kill = actualKill;
    }
    assert.deepEqual(signals, []);
    owned.identity = identity;
    assert.equal((await stopOwned(owned, 50)).status, "cleanup-failed");
    await delay(1000);
    assert.equal((await owned.completion).code, 0);
    assert.equal((await stopOwned(owned, 500)).status, "clean");
    await writeFile(join(directory, "evidence.json"), JSON.stringify(identity));
  }
);

test(
  "fixed fixture oracles agree with independently calculated scalar data",
  bounded,
  () => {
    let expected = 0;
    for (let block = 0; block < 64; block++) {
      for (let index = 0; index < 8192; index++) {
        const value = ((index + block) * 1664525 + 1013904223) % 4294967296;
        expected =
          (expected + ((value ^ Math.floor(value / 8192)) >>> 0)) % 4294967296;
      }
    }
    assert.equal(expected, 4290276580);
    assert.equal(arithmeticWorkload(), expected);
    const data = new Uint8ClampedArray(128 * 128 * 4);
    fillPixels(data);
    let hash = 2166136261n;
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        const pixel = y * 128 + x;
        for (const channel of [pixel % 256, y, (pixel * 7) % 256, 255]) {
          hash = ((hash ^ BigInt(channel)) * 16777619n) & 0xffffffffn;
        }
      }
    }
    assert.equal(Number(hash), 2296114373);
    assert.equal(pixelHash(data), Number(hash));
  }
);

test(
  "bus HALT and invalid content fail closed; preflight retains failure artifacts and refuses reuse",
  bounded,
  async () => {
    const directory = await mkdtemp(join(tmpdir(), "perf-preflight-"));
    const bus = join(directory, "bus");
    await writeFile(bus, "HALT\n");
    await assert.rejects(checkBus(bus), /HALT/);
    await writeFile(bus, "unrecognized");
    await assert.rejects(checkBus(bus), /OK/);
    await writeFile(bus, "OK\n");
    const output = join(directory, "output");
    const args = [
      "--binary",
      "/definitely-missing-browser",
      "--output",
      output,
      "--profile",
      "off",
      "--bus",
      bus,
    ];
    await assert.rejects(main(args), /evidence retained/);
    const report = JSON.parse(await readFile(join(output, "run.json"), "utf8"));
    assert.equal(report.status, "failed");
    const initial = await readFile(join(output, "run.json"), "utf8");
    await assert.rejects(main(args), /EEXIST/);
    assert.equal(await readFile(join(output, "run.json"), "utf8"), initial);
    await writeFile(bus, "HALT\n");
    await assert.rejects(main(args), /HALT/);
  }
);

test(
  "deadline and abort failures are immediate and handled",
  bounded,
  async () => {
    await assert.rejects(
      withTimeout(new Promise(() => {}), 10, "operation"),
      /timed out/
    );
    const controller = new AbortController();
    controller.abort(new Error("HALT requested"));
    await assert.rejects(
      withTimeout(
        Promise.resolve("late"),
        1000,
        "operation",
        controller.signal
      ),
      /HALT/
    );
  }
);

test(
  "RPC resolves reordered replies and rejects errors, malformed data, close and timeout",
  bounded,
  async () => {
    const discovery = {
      host: "localhost",
      port: 1234,
      path: "/umbrafox-control",
      token: "never-log-this",
      websocketUrl: "ws://localhost:1234/umbrafox-control?token=never-log-this",
    };
    let current;
    /** Controllable transport for protocol ordering and failure tests. */
    class FakeSocket extends EventTarget {
      readyState = 1;
      sent = [];
      constructor() {
        super();
        current = this;
        queueMicrotask(() => this.dispatchEvent(new Event("open")));
      }
      send(value) {
        this.sent.push(JSON.parse(value));
      }
      close() {
        this.readyState = 3;
        this.dispatchEvent(new Event("close"));
      }
      reply(value) {
        this.dispatchEvent(new MessageEvent("message", { data: value }));
      }
    }
    const controller = new AbortController();
    const control = await connectControl(
      discovery,
      controller.signal,
      FakeSocket
    );
    const first = control.request("first");
    const second = control.request("second");
    current.reply(JSON.stringify({ id: current.sent[1].id, result: 2 }));
    current.reply(JSON.stringify({ id: current.sent[0].id, result: 1 }));
    assert.equal(await second, 2);
    assert.equal(await first, 1);
    const errorReply = assert.rejects(
      control.request("error"),
      /command failed/
    );
    current.reply(
      JSON.stringify({
        id: current.sent.at(-1).id,
        error: { message: discovery.token },
      })
    );
    await errorReply;
    const malformed = assert.rejects(
      control.request("malformed"),
      /connection failed/
    );
    current.reply("{");
    await malformed;
    await assert.rejects(
      control.request("after-malformed"),
      /connection failed/
    );
    control.close();
    const next = await connectControl(discovery, controller.signal, FakeSocket);
    const disconnected = assert.rejects(
      next.request("closed"),
      /connection failed/
    );
    current.close();
    await disconnected;
    await assert.rejects(next.request("after-close"), /connection failed/);
    const aborted = await connectControl(
      discovery,
      controller.signal,
      FakeSocket
    );
    const pending = assert.rejects(aborted.request("aborted"), /HALT/);
    controller.abort(new Error("HALT"));
    await pending;
    aborted.close();
    /** Transport that fails immediately after opening. */
    class ErrorSocket extends FakeSocket {
      constructor() {
        super();
        queueMicrotask(() => this.dispatchEvent(new Event("error")));
      }
    }
    const connection = await connectControl(discovery, undefined, ErrorSocket);
    await assert.rejects(connection.request("failed"), /connection failed/);
    connection.close();
  }
);

test(
  "browser log drains serialized writes, scrubs split tokens and caps terminal fragments",
  bounded,
  async () => {
    const chunks = [];
    const logger = createBoundedLogger(
      async text => {
        await delay(1);
        chunks.push(text);
      },
      text => text.replaceAll("secret", "[redacted]"),
      30
    );
    logger.push("stdout", "sec");
    logger.push("stdout", "ret\n");
    logger.push("stderr", "terminal");
    logger.push("extra", "x".repeat(40));
    const result = await logger.finish();
    assert.equal(chunks.join(""), "[redacted]\nterminal");
    assert.equal(result.writtenBytes, 19);
    assert.equal(result.droppedBytes, 40);
    const failed = createBoundedLogger(
      async () => {
        throw new Error("disk full");
      },
      text => text
    );
    failed.push("stdout", "one\n");
    await assert.rejects(failed.finish(), /disk full/);
  }
);

test(
  "real WebSocket authentication failure rejects without exposing token",
  bounded,
  async t => {
    const server = createServer((incoming, outgoing) => {
      outgoing.writeHead(403);
      outgoing.end();
    });
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    t.after(
      () =>
        new Promise(resolve => {
          server.closeAllConnections();
          server.close(resolve);
        })
    );
    const port = server.address().port;
    const discovery = {
      host: "127.0.0.1",
      port,
      path: "/umbrafox-control",
      token: "do-not-expose-token",
      websocketUrl: `ws://127.0.0.1:${port}/umbrafox-control?token=do-not-expose-token`,
    };
    await assert.rejects(connectControl(discovery), error => {
      assert(!error.message.includes(discovery.token));
      assert.match(error.message, /UmbraLink/);
      return true;
    });
  }
);

test(
  "SIGTERM reaches an owned descendant, while exited leader with live descendant is reported",
  bounded,
  async t => {
    const directory = await mkdtemp(join(tmpdir(), "perf-descendants-"));
    for (const leaveDescendant of [false, true]) {
      const marker = join(directory, `${leaveDescendant}.json`);
      const childScript = "setTimeout(() => {}, 1200)";
      const script = `const child=require('child_process').spawn(process.execPath,['-e',${JSON.stringify(childScript)}],{stdio:'ignore'}); require('fs').writeFileSync(${JSON.stringify(marker)},JSON.stringify({pid:child.pid})); ${leaveDescendant ? "child.unref(); setTimeout(() => process.exit(0),100);" : "setTimeout(() => {}, 1200);"}`;
      const owned = await spawnOwned(process.execPath, ["-e", script]);
      t.after(() => stopOwned(owned, 1500));
      let descendant;
      for (let attempt = 0; attempt < 50; attempt++) {
        try {
          descendant = JSON.parse(await readFile(marker, "utf8"));
          break;
        } catch (error) {
          if (error.code !== "ENOENT") {
            throw error;
          }
          await delay(10);
        }
      }
      assert(descendant?.pid);
      assert.equal((await readIdentity(descendant.pid)).group, owned.child.pid);
      if (leaveDescendant) {
        await owned.completion;
        const cleanup = await stopOwned(owned, 50);
        assert.equal(cleanup.status, "cleanup-failed");
        assert(cleanup.members.some(item => item.pid === descendant.pid));
        await delay(1300);
        assert.equal((await stopOwned(owned, 1000)).status, "clean");
      } else {
        assert.equal((await stopOwned(owned, 1500)).status, "clean");
        try {
          assert.equal((await readIdentity(descendant.pid)).state, "Z");
        } catch (error) {
          if (error.code !== "ENOENT") {
            throw error;
          }
        }
      }
    }
  }
);
