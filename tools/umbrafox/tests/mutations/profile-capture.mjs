/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstat, realpath, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { captureLocalWorkload } from "../readback/capture.mjs";
import {
  createDOMServer,
  requestDOMWindow,
  validateDOMWindowResult,
} from "./fixture.mjs";
import { validateProfileWindowResult } from "./profile-workload.mjs";
import { validateMarkerWindowResult } from "./marker-workload.mjs";

export const PROFILE_OPTIONS = Object.freeze({
  entries: 1048576,
  intervalMs: 2,
  passes: 1,
  features: Object.freeze(["stackwalk", "js", "processcpu", "nomarkerstacks"]),
  threads: Object.freeze([
    "GeckoMain",
    "JS Helper",
    "StyleThread",
    "Compositor",
    "Renderer",
  ]),
});
export const SAMPLE_ONLY_OPTIONS = Object.freeze({
  ...PROFILE_OPTIONS,
  features: Object.freeze([...PROFILE_OPTIONS.features, "samplingallthreads"]),
  threads: Object.freeze(["UmbraOwnedSamplesOnlyNoThreadSelection"]),
});
const state =
  "return {pid: Services.appinfo.processID, active: Services.prefs.getBoolPref('umbrafox.userlandScripts.active', false), profiler: Services.profiler.IsActive()};";
function profileBodies(options) {
  return Object.freeze({
    state,
    identity:
      "return {webdriver: navigator.webdriver, state: document.readyState, transportGlobalIsWindow: globalThis === window};",
    start: `if (Services.profiler.IsActive()) throw new Error('Profiler already active');
    const features = ${JSON.stringify(options.features)};
    if (!features.every(item => Services.profiler.GetFeatures().includes(item))) throw new Error('Missing profiler feature');
    await Services.profiler.StartProfiler(${options.entries}, ${options.intervalMs}, features, ${JSON.stringify(options.threads)});
    await Services.profiler.waitOnePeriodicSampling();
    ${state}`,
    stop: `await Services.profiler.StopProfiler(); ${state}`,
  });
}
export const PROFILE_BODIES = profileBodies(PROFILE_OPTIONS);
export const SAMPLE_ONLY_BODIES = profileBodies(SAMPLE_ONLY_OPTIONS);

export async function preserveDOMProfile(
  root,
  receipt,
  save,
  bounded,
  signal,
  ops = { lstat, realpath, readFile, writeFile }
) {
  const path = join(
    root,
    "profile/umbrafox/diagnostics/profiles/dom-profile.json"
  );
  assert.equal(receipt.path, path);
  const stat = await bounded(() => ops.lstat(path), "Profile metadata", 3000);
  assert(stat.isFile() && !stat.isSymbolicLink());
  assert.equal(stat.uid, process.getuid());
  assert(
    Number.isSafeInteger(stat.size) &&
      stat.size > 0 &&
      stat.size <= 24 * 1024 ** 2,
    "Profile preservation cap"
  );
  assert.equal(
    await bounded(() => ops.realpath(path), "Canonical profile", 3000),
    path
  );
  const bytes = await bounded(
    () => ops.readFile(path, { signal }),
    "Profile preservation read",
    5000
  );
  assert.equal(bytes.length, stat.size, "Profile changed while reading");
  await bounded(
    () =>
      ops.writeFile(join(root, "profile.json"), bytes, {
        mode: 0o600,
        flag: "wx",
        signal,
      }),
    "Profile preservation write",
    5000
  );
  await save("profile-copy.json", {
    path: "profile.json",
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    limit:
      "Bounded binary copy outside JSON quota, inside sampled artifact cap; not raw profile parsing.",
  });
}

export async function captureDOMProfile({
  control,
  context,
  save,
  bounded,
  report,
  preserve,
  profiling = "on",
  workload = "mixed-profile",
}) {
  assert(
    ["on", "off", "samples-only"].includes(profiling),
    "Invalid profiling mode"
  );
  assert(
    ["mixed-profile", "marker-calibration", "layout-interleaved"].includes(
      workload
    ),
    "Invalid profile workload"
  );
  assert(
    workload !== "layout-interleaved" || profiling !== "on",
    "Isolated layout requires sampling-only or OFF"
  );
  const enabled = profiling !== "off";
  const sampleOnly = profiling === "samples-only";
  const options = sampleOnly ? SAMPLE_ONLY_OPTIONS : PROFILE_OPTIONS;
  const bodies = sampleOnly ? SAMPLE_ONLY_BODIES : PROFILE_BODIES;
  const request = async (fileName, method, params, cap = 10000) => {
    const reply = await bounded(
      () => control.request(method, params),
      fileName,
      cap
    );
    await save(fileName, reply);
    return reply;
  };
  const browser = (fileName, body) =>
    request(fileName, "umbrafox.script.execute", {
      context,
      realm: "browser",
      body,
    });
  const checkState = (reply, profiler) => {
    assert.equal(reply.context, context);
    assert.deepEqual(reply.result.value, {
      pid: report.pid,
      active: false,
      profiler,
    });
  };
  const performanceState = async phase => {
    const reply = await request(
      `profile-performance-${phase}.json`,
      "umbrafox.performance.snapshot",
      { includeThreads: false, includeWindows: true }
    );
    assert.equal(reply.processID, report.pid);
    assert.equal(reply.profiler?.active, enabled);
    assert.equal(reply.profiler.paused, false);
    assert.equal(reply.profiler.samplingPaused, false);
    if (enabled) {
      const config = reply.profiler.activeConfiguration;
      assert.equal(config.interval, options.intervalMs);
      assert.equal(config.capacity, options.entries);
      assert.equal(config.activeTabID, 0);
      assert.deepEqual(
        [...config.features].sort(),
        [...options.features].sort()
      );
      assert.deepEqual(config.threads, options.threads);
    }
    if (sampleOnly) {
      assert(
        Number.isFinite(reply.profiler.elapsedTimeMs) &&
          reply.profiler.elapsedTimeMs >= 0,
        "Invalid profiler clock"
      );
    }
    return reply.profiler.elapsedTimeMs;
  };
  checkState(await browser("profile-before.json", PROFILE_BODIES.state), false);
  const identity = await request(
    "page-identity.json",
    "umbrafox.script.execute",
    { context, body: PROFILE_BODIES.identity }
  );
  assert.equal(identity.context, context);
  assert(Number.isSafeInteger(identity.document) && identity.document > 0);
  assert.deepEqual(identity.result.value, {
    webdriver: false,
    state: "complete",
    transportGlobalIsWindow: false,
  });
  report.document = identity.document;
  report.profiling = profiling;
  report.profileRequested = enabled ? options : null;
  let failed = false;
  let failure;
  try {
    if (enabled) {
      checkState(await browser("profile-start.json", bodies.start), true);
    }
    const start = await performanceState("before");
    const reply = await request(
      "dom-profile-samples.json",
      "umbrafox.script.execute",
      {
        context,
        document: identity.document,
        timeoutMs: 60000,
        body: `return await (${requestDOMWindow.toString()})();`,
      },
      62000
    );
    assert.equal(reply.context, context);
    assert.equal(reply.document, identity.document);
    const validate =
      workload === "marker-calibration"
        ? validateMarkerWindowResult
        : validateProfileWindowResult;
    const isolated = workload === "layout-interleaved";
    const value = isolated
      ? validateDOMWindowResult(reply.result.value, workload)
      : validate(reply.result.value);
    const measurement = isolated ? value : value.result;
    report.sampleCount = measurement.samples.length;
    report.workloadMs = measurement.totalMs;
    report.execution = "window";
    report.fixtureVersion = isolated ? 6 : value.version;
    report.workload = workload;
    const end = await performanceState("after");
    if (sampleOnly) {
      assert(end > start, "Invalid profiler clock order");
      report.sampleWindow = {
        start,
        end,
        clock: "profiler-process-relative-ms",
        scope:
          "Outer workload bracket includes control and snapshot overhead; not per-case attribution.",
      };
    }
    if (enabled) {
      const receipt = await request(
        "profile-dump.json",
        "umbrafox.performance.profile.dump",
        { filename: "dom-profile.json", sinceTime: 0 },
        20000
      );
      await preserve(receipt);
    } else {
      checkState(
        await browser("profile-after.json", PROFILE_BODIES.state),
        false
      );
    }
  } catch (error) {
    failed = true;
    failure = error;
  }
  if (enabled) {
    try {
      checkState(
        await browser("profile-stop.json", PROFILE_BODIES.stop),
        false
      );
      report.profileStopped = true;
    } catch (error) {
      report.profileStopError = String(error?.message ?? error);
      if (!failed) {
        failed = true;
        failure = error;
      }
    }
  }
  if (failed) {
    throw failure;
  }
}

export function main(
  binary,
  output,
  profiling = "on",
  workload = "mixed-profile"
) {
  assert(
    ["on", "off", "samples-only"].includes(profiling),
    "Invalid profiling mode"
  );
  assert(
    ["mixed-profile", "marker-calibration", "layout-interleaved"].includes(
      workload
    ),
    "Invalid profile workload"
  );
  assert(
    workload !== "layout-interleaved" || profiling !== "on",
    "Isolated layout requires sampling-only or OFF"
  );
  return captureLocalWorkload(binary, output, {
    mode:
      profiling !== "off"
        ? "headless-dom-profile-attribution"
        : "headless-dom-window-marker-control",
    artifactPolicy: profiling !== "off" ? "profile" : "standard",
    limitations: [
      {
        "marker-calibration":
          "One page-owned three-case marker calibration; loop-only spans, 1000 iterations per case, not a throughput measurement.",
        "mixed-profile":
          "One page-owned mixed pass with complete-case UserTiming spans; these include setup/cleanup, unlike inner operation times.",
        "layout-interleaved":
          "Isolated interleaved layout with unchanged page source; whole-pass sampling includes warmup, setup, waits and cleanup.",
      }[workload],
      "Instrumented profile/control times are separate from uninstrumented comparisons; profiler and marker overhead remain.",
      "Headless synthetic CPU attribution only; no owner-browser, YouTube or physical GPU-presentation claim.",
      ...(profiling === "samples-only"
        ? [
            "Unselected registered-thread sampling; marker absence and useful samples require export verification. Native outer bracket is not per-case attribution.",
          ]
        : []),
    ],
    createServer: signal => createDOMServer(signal, "window", workload),
    capture: (control, context, save, bounded, report, signal) =>
      captureDOMProfile({
        control,
        context,
        save,
        bounded,
        report,
        profiling,
        workload,
        preserve: receipt =>
          preserveDOMProfile(output, receipt, save, bounded, signal),
      }),
  });
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  assert([4, 5, 6].includes(process.argv.length));
  main(...process.argv.slice(2)).then(
    report =>
      console.log(
        JSON.stringify({
          status: report.status,
          pid: report.pid,
          rootAbsent: report.rootAbsent,
          profileStopped: report.profileStopped,
          samples: report.sampleCount,
        })
      ),
    error => {
      console.error(error.message);
      process.exitCode = 1;
    }
  );
}
