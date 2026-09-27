/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { spawnSync } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { analyzeUserlandCache } from "../analyze-userland-cache.mjs";

const bounded = { timeout: 5000 };
const targetURL = `http://127.0.0.1:8002/${"a".repeat(36)}/target.js`;

function line(round, kind = round ? "memoryHit" : "cold", url = targetURL) {
  const action = kind === "memoryHit" ? "Found in-memory cache" : "Created";
  const reason = {
    cold: "because cache is not found ",
    activeBypass: "because Umbrafox userland scripts are active ",
    memoryHit: "",
  }[kind];
  return (
    `2026-09-27 03:48:09.${String(round).padStart(6, "0")} UTC - ` +
    `[Child 123: Main Thread]: D/ScriptLoader ScriptLoader (${100 + round}): ` +
    `${action} LoadedScript (abc) for ScriptLoadRequest(${200 + round}) ${reason}${url}.\n`
  );
}

function setLog(input, log) {
  input.browserLog = log;
  input.run.log.writtenBytes = Buffer.byteLength(log);
}

function fixture(state = "none") {
  const request = (label, path, method = "GET", round = null) => ({
    label,
    path,
    method,
    round,
  });
  const requests =
    state === "visited"
      ? [
          request("A", ""),
          request("A", "script-ready", "POST"),
          request("A", "gate"),
        ]
      : [];
  requests.push(request("B", ""), request("B", "gate"));
  const samples = Array.from({ length: 9 }, (_, round) => {
    requests.push(request("B", "document", "GET", String(round)));
    if (!round) {
      requests.push(request("B", "target.js"));
    }
    requests.push(request("B", "sample", "POST"));
    return {
      round,
      checksum: 8386560,
      webdriver: false,
      readyState: "complete",
      documentDurationMs: 1,
      resource: {
        name: targetURL,
        duration: 0,
        transferSize: 0,
        encodedBodySize: 344921,
        decodedBodySize: 344921,
      },
    };
  });
  const input = {
    run: {
      version: 1,
      status: "passed",
      mode: "diagnostic-only",
      startedAt: "2026-09-27T03:48:00.000Z",
      finishedAt: "2026-09-27T03:48:10.000Z",
      config: {
        suite: "userland-cache",
        profile: "off",
        trials: 7,
        warmup: 2,
        "userland-case": state,
      },
      cleanup: { status: "clean" },
      log: { droppedBytes: 0 },
    },
    samples: {
      version: 1,
      state,
      scriptReady: state === "visited",
      metadata: {
        originA: "http://127.0.0.1:8001",
        originB: "http://127.0.0.1:8002",
        targetURL,
        sourceSHA256:
          "fc56ccf872b875831be81ec910030d0943af6fce62be8639c1f3f390cc6faf29",
        sourceBytes: 344921,
      },
      samples,
      requests,
    },
    provenance: {
      environment: { env: { MOZ_LOG: "timestamp,sync,ScriptLoader:4" } },
    },
  };
  setLog(
    input,
    samples
      .map((_, round) =>
        line(
          round,
          ["unrelated", "visited"].includes(state) ? "activeBypass" : undefined
        )
      )
      .join("")
  );
  return input;
}

for (const state of ["none", "disabled", "unrelated", "visited"]) {
  test(`observes ${state} without mutating input`, bounded, () => {
    const input = fixture(state);
    const original = structuredClone(input);
    const report = analyzeUserlandCache(input);
    assert.equal(report.controlGate.status, "pass");
    assert.equal(report.coverage.expectedOutcomes, 9);
    assert.equal(report.coverage.observedOutcomes, 9);
    assert.deepEqual(report.attribution.processIDs, [123]);
    assert.equal(report.attribution.singleProcess, "observed");
    assert.equal(
      report.attribution.documentJoin,
      "conditional-sequential-fixture"
    );
    assert.deepEqual(report.observed, {
      cold: state === "none" || state === "disabled" ? 1 : 0,
      memoryHit: state === "none" || state === "disabled" ? 8 : 0,
      activeBypass: state === "unrelated" || state === "visited" ? 9 : 0,
    });
    assert.equal(report.httpTargetRequests, 1);
    assert.equal(report.outcomes[0].loaderID, "100");
    assert.equal(report.outcomes[0].requestID, "200");
    assert.equal(report.outcomes[0].loadedScriptID, "abc");
    assert.equal(
      report.outcomes[0].timestampUTC,
      "2026-09-27 03:48:09.000000 UTC"
    );
    assert.equal(report.outcomes[8].sequence, 8);
    assert.deepEqual(input, original);
    assert.doesNotMatch(
      JSON.stringify(report),
      /127\.0\.0\.1|documentDurationMs|transferSize/
    );
  });
}

for (const [caseName, change] of [
  [
    "failed run",
    input => {
      input.run.status = "failed";
    },
  ],
  [
    "unclean cleanup",
    input => {
      input.run.cleanup.status = "failed";
    },
  ],
  [
    "drops",
    input => {
      input.run.log.droppedBytes = 1;
    },
  ],
  [
    "missing drops",
    input => {
      delete input.run.log.droppedBytes;
    },
  ],
  [
    "wrong suite",
    input => {
      input.run.config.suite = "local";
    },
  ],
  [
    "profile on",
    input => {
      input.run.config.profile = "on";
    },
  ],
  [
    "wrong mode",
    input => {
      input.run.mode = "benchmark";
    },
  ],
  [
    "missing log",
    input => {
      delete input.browserLog;
    },
  ],
  [
    "byte truncation",
    input => {
      input.browserLog = input.browserLog.slice(0, -30);
    },
  ],
  [
    "wrong environment",
    input => {
      input.provenance.environment.env.MOZ_LOG = "ScriptLoader:4";
    },
  ],
  [
    "profiler environment",
    input => {
      input.provenance.environment.env.MOZ_PROFILER_STARTUP = "1";
    },
  ],
  [
    "alternate log file",
    input => {
      input.provenance.environment.env.MOZ_LOG_FILE = "/elsewhere";
    },
  ],
  [
    "incomplete samples",
    input => {
      input.samples.samples.pop();
    },
  ],
  [
    "wrong source",
    input => {
      input.samples.metadata.sourceSHA256 = "0".repeat(64);
    },
  ],
  [
    "wrong source length",
    input => {
      input.samples.metadata.sourceBytes++;
    },
  ],
  [
    "wrong origin",
    input => {
      input.samples.metadata.originA = input.samples.metadata.originB;
    },
  ],
  [
    "origin credentials",
    input => {
      const fixtureOrigin = new URL(input.samples.metadata.originA);
      fixtureOrigin.username = "owner";
      input.samples.metadata.originA = fixtureOrigin.href;
    },
  ],
  [
    "origin path",
    input => {
      input.samples.metadata.originA += "/extra";
    },
  ],
  [
    "target query",
    input => {
      input.samples.metadata.targetURL += "?extra";
      input.samples.samples.forEach(sample => {
        sample.resource.name += "?extra";
      });
    },
  ],
  [
    "bad execution oracle",
    input => {
      input.samples.samples[0].checksum = 0;
    },
  ],
  [
    "nonfinite sample",
    input => {
      input.samples.samples[0].documentDurationMs = Infinity;
    },
  ],
  [
    "sample history reordered",
    input => {
      input.samples.requests.reverse();
    },
  ],
  [
    "wrong state",
    input => {
      input.samples.state = "unrelated";
    },
  ],
  [
    "bad run date",
    input => {
      input.run.startedAt = "invalid";
    },
  ],
  [
    "missing provenance",
    input => {
      delete input.provenance;
    },
  ],
  [
    "negative log bytes",
    input => {
      input.run.log.writtenBytes = -1;
    },
  ],
  [
    "noninteger trials",
    input => {
      input.run.config.trials = 6.5;
    },
  ],
  [
    "missing sample readiness",
    input => {
      delete input.samples.samples[0].readyState;
    },
  ],
  [
    "reversed run dates",
    input => {
      input.run.startedAt = "2026-09-27T04:00:00.000Z";
    },
  ],
]) {
  test(`rejects ${caseName}`, bounded, () => {
    const input = fixture();
    change(input);
    assert.throws(() => analyzeUserlandCache(input));
  });
}

for (const [caseName, change] of [
  ["missing", log => log.split("\n").slice(1).join("\n")],
  ["extra", log => log + line(9, "memoryHit")],
  ["duplicate", log => log.replace(line(8), line(7))],
  ["malformed pointer", log => log.replace("(100)", "(not-hex)")],
  [
    "missing timestamp",
    log => log.replace("2026-09-27 03:48:09.000000 UTC - ", ""),
  ],
  ["bad timestamp", log => log.replace("03:48:09.000000", "99:48:09.000000")],
  ["invalid calendar", log => log.replace("2026-09-27", "2026-02-30")],
  ["outside run", log => log.replace("03:48:09.000000", "03:47:09.000000")],
  ["wrong thread", log => log.replace("Main Thread", "Worker")],
  ["missing PID", log => log.replace("Child 123", "Child")],
  ["parent process", log => log.replace("Child 123", "Parent 123")],
  ["multiple processes", log => log.replace("Child 123", "Child 124")],
  [
    "unsupported reason",
    log => log.replace("cache is not found", "of dirty flag"),
  ],
  ["missing final newline", log => log.slice(0, -1)],
  [
    "out of order",
    log => line(1) + line(0) + log.split("\n").slice(2).join("\n"),
  ],
  ["active transition", log => log.replace(line(4), line(4, "activeBypass"))],
  [
    "all active in baseline",
    () => Array.from({ length: 9 }, (_, i) => line(i, "activeBypass")).join(""),
  ],
  ["no outcome", () => "unrelated diagnostic\n"],
  [
    "reused compound identity",
    log => log.replace("(101)", "(100)").replace("(201)", "(200)"),
  ],
  ["zero pointer", log => log.replace("(100)", "(0)")],
  ["unsafe PID", log => log.replace("Child 123", "Child 9007199254740993")],
  [
    "missing punctuation extra",
    log => log + line(9).replace("target.js.\n", "target.js\n"),
  ],
  ["malformed extra target", log => log + line(9).replace("(109)", "(broken)")],
  [
    "hit timestamp reversal",
    log => log.replace("03:48:09.000008", "03:48:09.000006"),
  ],
]) {
  test(`keeps ${caseName} evidence inconclusive`, bounded, () => {
    const input = fixture();
    setLog(input, change(input.browserLog));
    const report = analyzeUserlandCache(input);
    assert.equal(report.controlGate.status, "inconclusive");
    assert.ok(report.controlGate.reasons.length);
  });
}

test(
  "exact URL only; HTTP and bytecode lines are not cache outcomes",
  bounded,
  () => {
    const input = fixture();
    setLog(
      input,
      input.browserLog +
        line(9, "activeBypass", `${targetURL}?other`) +
        line(10, "cold", targetURL.replace("8002", "8001")) +
        `Bytecode-cache: Skip all: Umbrafox userland scripts are active ${targetURL}\n` +
        `GET ${targetURL}\n`
    );
    input.samples.requests.splice(5, 0, {
      label: "B",
      path: "target.js",
      method: "GET",
      round: null,
    });
    const report = analyzeUserlandCache(input);
    assert.equal(report.controlGate.status, "pass");
    assert.equal(report.observed.activeBypass, 0);
    assert.equal(report.httpTargetRequests, 2);
  }
);

test(
  "active cell with late activation preserves observed transition",
  bounded,
  () => {
    const input = fixture("unrelated");
    setLog(
      input,
      input.browserLog.replace(line(0, "activeBypass"), line(0, "cold"))
    );
    const report = analyzeUserlandCache(input);
    assert.equal(report.controlGate.status, "inconclusive");
    assert.equal(report.observed.cold, 1);
    assert.equal(report.observed.activeBypass, 8);
    assert.equal(report.outcomes[0].kind, "cold");
  }
);

test(
  "request pointer reuse across loaders is disclosed, not a global ID join",
  bounded,
  () => {
    const input = fixture();
    setLog(input, input.browserLog.replace("(201)", "(200)"));
    const report = analyzeUserlandCache(input);
    assert.equal(report.controlGate.status, "pass");
    assert.equal(report.attribution.requestPointerReuseCount, 1);
    assert.match(report.limitations.join(" "), /pointer.*reus/i);
  }
);

test(
  "process scope is unproven for absent or multiple source PIDs",
  bounded,
  () => {
    for (const log of [
      "",
      fixture().browserLog.replace("Child 123", "Child 124"),
    ]) {
      const input = fixture();
      setLog(input, log);
      const report = analyzeUserlandCache(input);
      assert.equal(report.controlGate.status, "inconclusive");
      assert.equal(report.attribution.singleProcess, "unproven");
    }
  }
);

test(
  "requires the known seven-trial two-warmup control configuration",
  bounded,
  () => {
    const input = fixture();
    input.run.config.trials = 6;
    input.samples.samples.pop();
    input.samples.requests.splice(-2);
    setLog(input, input.browserLog.replace(line(8), ""));
    assert.throws(() => analyzeUserlandCache(input));
  }
);

test(
  "CLI preserves inputs and refuses overwrite, malformed inputs and relative paths",
  { timeout: 10000 },
  async () => {
    const scratch = join(tmpdir(), "codex");
    await mkdir(scratch, { recursive: true });
    const directory = await mkdtemp(join(scratch, "userland-cache-analysis-"));
    try {
      const input = fixture();
      const originals = {};
      for (const [field, value] of Object.entries(input)) {
        const filename =
          field === "browserLog" ? "browser.log" : `${field}.json`;
        const contents = field === "browserLog" ? value : JSON.stringify(value);
        originals[filename] = contents;
        await writeFile(join(directory, filename), contents);
      }
      const script = fileURLToPath(
        new URL("../analyze-userland-cache.mjs", import.meta.url)
      );
      const output = join(directory, "analysis.json");
      const args = [script, "--input", directory, "--output", output];
      const run = values =>
        spawnSync(process.execPath, values, {
          encoding: "utf8",
          timeout: 2000,
        });
      assert.equal(run(args).status, 0);
      const original = await readFile(output, "utf8");
      assert.equal(JSON.parse(original).controlGate.status, "pass");
      assert.equal(run(args).status, 1);
      assert.equal(await readFile(output, "utf8"), original);
      for (const [filename, contents] of Object.entries(originals)) {
        assert.equal(
          await readFile(join(directory, filename), "utf8"),
          contents
        );
      }
      assert.equal(run([script, "--input", ".", "--output", output]).status, 1);
      assert.equal(
        run([script, "--input", directory, "--output", "relative.json"]).status,
        1
      );
      assert.equal(run([...args, "--input", directory]).status, 1);
      assert.equal(run([script]).status, 1);
      assert.equal(
        run([...args.slice(0, -1), join(directory, "missing", "output.json")])
          .status,
        1
      );
      const alias = join(directory, "alias.json");
      await symlink(join(directory, "samples.json"), alias);
      assert.equal(run([...args.slice(0, -1), alias]).status, 1);
      assert.equal(
        await readFile(join(directory, "samples.json"), "utf8"),
        originals["samples.json"]
      );
      setLog(input, line(0));
      await writeFile(join(directory, "browser.log"), input.browserLog);
      await writeFile(join(directory, "run.json"), JSON.stringify(input.run));
      const inconclusive = join(directory, "inconclusive.json");
      assert.equal(run([...args.slice(0, -1), inconclusive]).status, 2);
      assert.equal(
        JSON.parse(await readFile(inconclusive, "utf8")).controlGate.status,
        "inconclusive"
      );
      await writeFile(join(directory, "run.json"), "{bad-json");
      assert.equal(
        run([...args.slice(0, -1), join(directory, "invalid.json")]).status,
        1
      );
    } finally {
      await rm(directory, { recursive: true });
    }
  }
);
