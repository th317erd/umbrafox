/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { readFile, writeFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const WORKLOADS = ["js", "dom-batched", "dom-interleaved", "canvas"];
const FAMILIES = [
  "Styles",
  "Reflow (sync)",
  "DoFlushPendingNotifications",
  "GCMinor",
  "GCSlice",
];

function requireValid(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function nonnegative(value) {
  return Number.isFinite(value) && value >= 0;
}

function count(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

function windowID(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function interval(marker) {
  requireValid(
    marker &&
      nonnegative(marker.start) &&
      nonnegative(marker.duration) &&
      Number.isFinite(marker.start + marker.duration),
    "Invalid marker interval"
  );
  return { start: marker.start, end: marker.start + marker.duration };
}

function validateContext(context, threadHandle) {
  requireValid(
    context &&
      context.selectedThreadHandle === threadHandle &&
      context.selectedThreads?.length === 1 &&
      `t-${context.selectedThreads[0].threadIndex}` === threadHandle &&
      context.selectedThreads[0].name === "GeckoMain" &&
      context.currentViewRange === null &&
      (context.resultThreadHandle === null ||
        context.resultThreadHandle === threadHandle) &&
      nonnegative(context.rootRange?.start) &&
      Number.isFinite(context.rootRange?.end) &&
      context.rootRange.end >= context.rootRange.start,
    "Invalid or filtered thread context"
  );
}

function validateHandles(markers) {
  const handles = new Set();
  for (const marker of markers) {
    requireValid(
      marker &&
        typeof marker.handle === "string" &&
        !handles.has(marker.handle),
      "Malformed or duplicate marker handle"
    );
    handles.add(marker.handle);
  }
}

function summarize(markers, phase, innerWindowID, threadOnly) {
  const result = {
    status: markers.length ? "observed-in-export" : "not-observed-in-export",
    scope: threadOnly ? "thread-only" : "same-inner-window",
    count: markers.length ? 0 : null,
    clippedDurationMs: markers.length ? 0 : null,
    unionDurationMs: markers.length ? 0 : null,
    boundaryCount: 0,
    otherWindowCount: 0,
  };
  const intervals = [];
  for (const marker of markers) {
    const end = marker.start + marker.duration;
    const overlaps =
      phase.end > phase.start &&
      (marker.duration === 0
        ? marker.start >= phase.start && marker.start < phase.end
        : marker.start < phase.end && end > phase.start);
    if (!overlaps) {
      continue;
    }
    if (!threadOnly && marker.data.innerWindowID !== innerWindowID) {
      result.otherWindowCount++;
      continue;
    }
    result.count++;
    const start = Math.max(marker.start, phase.start);
    const clippedEnd = Math.min(end, phase.end);
    result.clippedDurationMs += clippedEnd - start;
    result.boundaryCount += Number(
      marker.start < phase.start || end > phase.end
    );
    intervals.push({ start, end: clippedEnd });
  }
  intervals.sort((left, right) => left.start - right.start);
  let previousEnd = phase.start;
  for (const range of intervals) {
    result.unionDurationMs += Math.max(
      0,
      range.end - Math.max(previousEnd, range.start)
    );
    previousEnd = Math.max(previousEnd, range.end);
  }
  return result;
}

function validateExports(phaseExport, markerExport, expectedCount) {
  requireValid(
    phaseExport?.type === "profile-markers" &&
      Array.isArray(phaseExport.markers) &&
      markerExport?.type === "thread-markers" &&
      Array.isArray(markerExport.flatMarkers),
    "Expected profiler-cli profile-markers and thread-markers exports"
  );
  requireValid(
    count(phaseExport.totalCount) &&
      phaseExport.totalCount === phaseExport.markers.length &&
      phaseExport.totalCount === expectedCount * 3,
    "Incomplete phase coverage or truncated phase export"
  );
  requireValid(
    count(markerExport.totalMarkerCount) &&
      markerExport.totalMarkerCount === markerExport.filteredMarkerCount &&
      markerExport.filteredMarkerCount === markerExport.flatMarkers.length,
    "Filtered or truncated marker export"
  );
  const threadHandle = markerExport.threadHandle;
  requireValid(
    typeof threadHandle === "string" && /^t-\d+$/.test(threadHandle),
    "Invalid thread handle"
  );
  validateContext(phaseExport.context, threadHandle);
  validateContext(markerExport.context, threadHandle);
  const range = markerExport.context.rootRange;
  requireValid(
    phaseExport.context.rootRange.start === range.start &&
      phaseExport.context.rootRange.end === range.end,
    "Export time ranges do not match"
  );
  requireValid(
    phaseExport.matchingThreadCount === 1 &&
      phaseExport.byThread?.length === 1 &&
      phaseExport.byThread[0].threadHandle === threadHandle &&
      phaseExport.byThread[0].count === phaseExport.totalCount,
    "Phase thread metadata mismatch"
  );
  validateHandles(phaseExport.markers);
  validateHandles(markerExport.flatMarkers);
  const threadMarkers = new Map(
    markerExport.flatMarkers.map(marker => [marker.handle, marker])
  );
  for (const phaseMarker of phaseExport.markers) {
    const threadMarker = threadMarkers.get(phaseMarker.handle);
    requireValid(
      threadMarker &&
        threadMarker.name === phaseMarker.name &&
        threadMarker.label === phaseMarker.label &&
        threadMarker.start === phaseMarker.start &&
        threadMarker.duration === phaseMarker.duration &&
        threadMarker.data?.name === phaseMarker.data?.name &&
        threadMarker.data?.entryType === phaseMarker.data?.entryType &&
        threadMarker.data?.innerWindowID === phaseMarker.data?.innerWindowID,
      "Phase marker does not match thread export"
    );
  }
  return { threadHandle, range };
}

function collectPhases(
  phaseExport,
  threadHandle,
  range,
  expectedTrials,
  expectedWarmup
) {
  const phasesByLabel = new Map();
  let innerWindowID;
  for (const marker of phaseExport.markers) {
    requireValid(
      marker.name === "UserTiming" &&
        marker.threadHandle === threadHandle &&
        typeof marker.label === "string" &&
        marker.data?.name === marker.label &&
        !phasesByLabel.has(marker.label),
      "Malformed, duplicate, or wrong-thread phase"
    );
    requireValid(
      windowID(marker.data.innerWindowID),
      "Missing phase inner window ID"
    );
    innerWindowID ??= marker.data.innerWindowID;
    requireValid(
      innerWindowID === marker.data.innerWindowID,
      "Phase inner window mismatch"
    );
    phasesByLabel.set(marker.label, marker);
  }
  const phases = [];
  for (const stage of ["warmup", "trial"]) {
    const iterations = stage === "warmup" ? expectedWarmup : expectedTrials;
    for (let index = 0; index < iterations; index++) {
      for (const workload of WORKLOADS) {
        const label = `local-perf:${stage}:${index}:${workload}`;
        const measure = phasesByLabel.get(label);
        const start = phasesByLabel.get(`${label}:start`);
        const end = phasesByLabel.get(`${label}:end`);
        requireValid(measure && start && end, "Incomplete phase coverage");
        const phaseRange = interval(measure);
        requireValid(
          measure.data.entryType === "measure" &&
            start.data.entryType === "mark" &&
            end.data.entryType === "mark" &&
            (start.duration === undefined || start.duration === 0) &&
            (end.duration === undefined || end.duration === 0) &&
            nonnegative(start.start) &&
            nonnegative(end.start) &&
            Math.abs(start.start - phaseRange.start) < 0.000001 &&
            Math.abs(end.start - phaseRange.end) < 0.000001 &&
            phaseRange.start >= range.start &&
            phaseRange.end <= range.end,
          "Phase companion or capture range mismatch"
        );
        phases.push({
          stage,
          index,
          workload,
          ...phaseRange,
          durationMs: measure.duration,
        });
      }
    }
  }
  phases.sort((left, right) => left.start - right.start);
  for (let index = 1; index < phases.length; index++) {
    requireValid(
      phases[index].start >= phases[index - 1].end,
      "Overlapping fixture phases"
    );
  }
  return { phases, innerWindowID };
}

function collectFamilies(markerExport, threadHandle) {
  const families = new Map(FAMILIES.map(family => [family, []]));
  const typeCounts = new Map();
  for (const marker of markerExport.flatMarkers) {
    requireValid(typeof marker.name === "string", "Malformed marker name");
    requireValid(
      marker.threadHandle === undefined || marker.threadHandle === threadHandle,
      "Marker thread mismatch"
    );
    typeCounts.set(marker.name, (typeCounts.get(marker.name) ?? 0) + 1);
    if (families.has(marker.name)) {
      interval(marker);
      if (!marker.name.startsWith("GC")) {
        requireValid(
          windowID(marker.data?.innerWindowID),
          "Missing document marker inner window ID"
        );
      }
      families.get(marker.name).push(marker);
    }
  }
  requireValid(
    Array.isArray(markerExport.byType),
    "Missing marker count metadata"
  );
  const seenTypes = new Set();
  for (const type of markerExport.byType) {
    requireValid(
      type &&
        typeof type.markerName === "string" &&
        !seenTypes.has(type.markerName) &&
        count(type.count) &&
        type.count === typeCounts.get(type.markerName),
      "Marker count metadata mismatch"
    );
    seenTypes.add(type.markerName);
  }
  requireValid(
    seenTypes.size === typeCounts.size,
    "Missing marker count metadata"
  );
  return families;
}

export function analyzeMarkers(phaseExport, markerExport, options = {}) {
  const { expectedTrials = 7, expectedWarmup = 2 } = options;
  requireValid(
    count(expectedTrials) &&
      expectedTrials > 0 &&
      expectedTrials <= 10000 &&
      count(expectedWarmup) &&
      expectedWarmup <= 10000,
    "Invalid expected run counts"
  );
  const expectedCount = (expectedTrials + expectedWarmup) * WORKLOADS.length;
  const { threadHandle, range } = validateExports(
    phaseExport,
    markerExport,
    expectedCount
  );
  const { phases, innerWindowID } = collectPhases(
    phaseExport,
    threadHandle,
    range,
    expectedTrials,
    expectedWarmup
  );
  const families = collectFamilies(markerExport, threadHandle);
  return {
    schemaVersion: 1,
    units: "milliseconds",
    threadHandle,
    innerWindowID,
    expected: {
      trials: expectedTrials,
      warmup: expectedWarmup,
      measureCount: expectedCount,
      source: "configured-not-inferred",
    },
    coverage: {
      exportEnumeration: "complete",
      captureCompleteness: "unknown",
      phaseMeasureCount: phases.length,
      phaseMarkerCount: phaseExport.markers.length,
      phaseHandlesCrosschecked: phaseExport.markers.length,
      threadMarkerCount: markerExport.flatMarkers.length,
      bufferLossChecked: false,
    },
    interpretation: {
      windows: "half-open; boundary intervals clipped",
      durations:
        "per-family only; overlapping families must not be added as serial cost",
      missingFamilies:
        "null counts mean not observed, not known disabled or zero cost",
      gcAttribution: "thread-only; no document causality inferred",
      profileIdentity:
        "phase handles, labels, intervals, windows and thread checked; export session identity unavailable",
    },
    phases: phases.map(phase => ({
      stage: phase.stage,
      index: phase.index,
      workload: phase.workload,
      startMs: phase.start,
      endMs: phase.end,
      durationMs: phase.durationMs,
      markers: Object.fromEntries(
        [...families].map(([family, markers]) => [
          family,
          summarize(markers, phase, innerWindowID, family.startsWith("GC")),
        ])
      ),
    })),
  };
}

async function main(args) {
  const values = new Map();
  const allowed = new Set([
    "--phases",
    "--markers",
    "--output",
    "--expected-trials",
    "--expected-warmup",
  ]);
  for (let index = 0; index < args.length; index += 2) {
    requireValid(
      allowed.has(args[index]) &&
        !values.has(args[index]) &&
        args[index + 1] !== undefined,
      "Invalid CLI arguments"
    );
    values.set(args[index], args[index + 1]);
  }
  for (const flag of ["--phases", "--markers", "--output"]) {
    requireValid(
      values.has(flag) && isAbsolute(values.get(flag)),
      "Input and output paths must be absolute"
    );
  }
  const options = {};
  for (const [flag, key] of [
    ["--expected-trials", "expectedTrials"],
    ["--expected-warmup", "expectedWarmup"],
  ]) {
    if (values.has(flag)) {
      requireValid(
        /^\d+$/.test(values.get(flag)),
        "Expected counts must be integers"
      );
      options[key] = Number(values.get(flag));
    }
  }
  const phases = JSON.parse(await readFile(values.get("--phases"), "utf8"));
  const markers = JSON.parse(await readFile(values.get("--markers"), "utf8"));
  const report = analyzeMarkers(phases, markers, options);
  await writeFile(
    values.get("--output"),
    `${JSON.stringify(report, null, 2)}\n`,
    { flag: "wx", mode: 0o600 }
  );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main(process.argv.slice(2)).catch(() => {
    process.stderr.write(
      "Marker analysis failed: invalid/incomplete exports, arguments, or unavailable new output.\n"
    );
    process.exitCode = 1;
  });
}
