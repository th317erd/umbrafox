/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { analyzeMarkers } from "../analyze-markers.mjs";

const bounded = { timeout: 5000 };
const options = { expectedTrials: 1, expectedWarmup: 0 };
const workloads = ["js", "dom-batched", "dom-interleaved", "canvas"];

function fixture() {
  const context = {
    selectedThreadHandle: "t-103",
    selectedThreads: [{ threadIndex: 103, name: "GeckoMain" }],
    resultThreadHandle: null,
    resultThreads: [],
    currentViewRange: null,
    rootRange: { start: 0, end: 100 },
  };
  const markers = workloads.flatMap((workload, index) => {
    const label = `local-perf:trial:0:${workload}`;
    return ["start", "measure", "end"].map((kind, offset) => ({
      handle: `m-${index * 3 + offset}`,
      name: "UserTiming",
      label: kind === "measure" ? label : `${label}:${kind}`,
      start: 10 + index * 20 + (kind === "end" ? 10 : 0),
      ...(kind === "measure" ? { duration: 10 } : {}),
      threadHandle: "t-103",
      data: {
        innerWindowID: 123,
        name: kind === "measure" ? label : `${label}:${kind}`,
        entryType: kind === "measure" ? "measure" : "mark",
      },
    }));
  });
  return {
    phases: {
      type: "profile-markers",
      markers,
      totalCount: markers.length,
      matchingThreadCount: 1,
      byThread: [{ threadHandle: "t-103", count: markers.length }],
      context: structuredClone(context),
    },
    content: {
      type: "thread-markers",
      threadHandle: "t-103",
      totalMarkerCount: markers.length,
      filteredMarkerCount: markers.length,
      flatMarkers: structuredClone(markers),
      byType: [{ markerName: "UserTiming", count: markers.length }],
      context: structuredClone(context),
    },
  };
}

function setMarkers(content, markers) {
  const timingMarkers = content.flatMarkers.filter(
    marker => marker.name === "UserTiming"
  );
  content.flatMarkers = timingMarkers.concat(
    markers.map((marker, index) => ({
      handle: `m-${100 + index}`,
      data: { innerWindowID: 123 },
      ...marker,
    }))
  );
  content.totalMarkerCount = content.filteredMarkerCount =
    content.flatMarkers.length;
  const counts = new Map();
  for (const marker of content.flatMarkers) {
    counts.set(marker.name, (counts.get(marker.name) ?? 0) + 1);
  }
  content.byType = [...counts].map(([markerName, count]) => ({
    markerName,
    count,
  }));
}

test(
  "half-open windows clip intervals without adding different families",
  bounded,
  () => {
    const { phases, content } = fixture();
    setMarkers(content, [
      { name: "Styles", start: 9, duration: 3 },
      { name: "Styles", start: 11, duration: 4 },
      { name: "Styles", start: 10, duration: 0 },
      { name: "Styles", start: 20, duration: 0 },
      { name: "Styles", start: 8, duration: 2 },
      { name: "Styles", start: 20, duration: 1 },
      { name: "Reflow (sync)", start: 10, duration: 5 },
      { name: "GCMinor", start: 11, duration: 1, data: {} },
    ]);
    const report = analyzeMarkers(phases, content, options);
    const first = report.phases[0];
    assert.equal(first.markers.Styles.count, 3);
    assert.equal(first.markers.Styles.clippedDurationMs, 6);
    assert.equal(first.markers.Styles.unionDurationMs, 5);
    assert.equal(first.markers.Styles.boundaryCount, 1);
    assert.equal(first.markers["Reflow (sync)"].count, 1);
    assert.equal(first.markers.GCMinor.scope, "thread-only");
    assert.equal(first.markers.GCSlice.count, null);
    assert.equal(report.coverage.captureCompleteness, "unknown");
    assert.equal(report.expected.measureCount, 4);
    assert.equal("totalCostMs" in first, false);
  }
);

test(
  "default run requires all 36 measures, not an inferred partial run",
  bounded,
  () => {
    const { phases, content } = fixture();
    assert.throws(() => analyzeMarkers(phases, content), /phase coverage/);
  }
);

for (const [caseName, change] of [
  ["incomplete phase", ({ phases }) => phases.markers.pop()],
  [
    "duplicate phase",
    ({ phases }) => {
      phases.markers[4] = { ...phases.markers[1], handle: "m-duplicate" };
    },
  ],
  [
    "thread mismatch",
    ({ content }) => {
      content.threadHandle = "t-104";
    },
  ],
  [
    "context mismatch",
    ({ content }) => {
      content.context.selectedThreads[0].threadIndex = 104;
    },
  ],
  [
    "window mismatch",
    ({ phases }) => {
      phases.markers[4].data.innerWindowID = 456;
    },
  ],
  [
    "missing window",
    ({ phases }) => {
      delete phases.markers[1].data.innerWindowID;
    },
  ],
  [
    "truncated markers",
    ({ content }) => {
      content.filteredMarkerCount = 1;
    },
  ],
  [
    "filtered markers",
    ({ content }) => {
      content.totalMarkerCount = 1;
    },
  ],
  [
    "view range",
    ({ content }) => {
      content.context.currentViewRange = { start: 10, end: 20 };
    },
  ],
  [
    "negative duration",
    ({ phases }) => {
      phases.markers[1].duration = -1;
    },
  ],
  [
    "nonfinite start",
    ({ phases }) => {
      phases.markers[1].start = Infinity;
    },
  ],
  [
    "NaN duration",
    ({ phases }) => {
      phases.markers[1].duration = NaN;
    },
  ],
  [
    "negative start",
    ({ phases }) => {
      phases.markers[1].start = -1;
    },
  ],
  [
    "malformed export",
    ({ phases }) => {
      phases.type = "raw-profile";
    },
  ],
  [
    "malformed marker",
    ({ phases }) => {
      phases.markers[1] = null;
    },
  ],
  [
    "bad companion",
    ({ phases }) => {
      phases.markers[2].start++;
    },
  ],
]) {
  test(`rejects ${caseName}`, bounded, () => {
    const input = fixture();
    change(input);
    assert.throws(() => analyzeMarkers(input.phases, input.content, options));
  });
}

test("zero phases and zero marker durations remain finite", bounded, () => {
  const { phases, content } = fixture();
  phases.markers[1].duration = 0;
  phases.markers[2].start = phases.markers[0].start;
  content.flatMarkers = structuredClone(phases.markers);
  setMarkers(content, [{ name: "Styles", start: 10, duration: 0 }]);
  const report = analyzeMarkers(phases, content, options);
  assert.equal(report.phases[0].durationMs, 0);
  assert.equal(report.phases[0].markers.Styles.count, 0);
});

test(
  "document markers exclude other windows and reject unknown attribution",
  bounded,
  () => {
    const { phases, content } = fixture();
    setMarkers(content, [
      { name: "Styles", start: 11, duration: 2, data: { innerWindowID: 456 } },
    ]);
    assert.equal(
      analyzeMarkers(phases, content, options).phases[0].markers.Styles
        .otherWindowCount,
      1
    );
    content.flatMarkers.find(marker => marker.name === "Styles").data = {};
    assert.throws(() => analyzeMarkers(phases, content, options), /window/);
  }
);

test("rejects malformed target intervals and count metadata", bounded, () => {
  for (const duration of [-1, Infinity, NaN, undefined, "1"]) {
    const { phases, content } = fixture();
    setMarkers(content, [{ name: "Styles", start: 11, duration }]);
    assert.throws(() => analyzeMarkers(phases, content, options));
  }
  const { phases, content } = fixture();
  setMarkers(content, [{ name: "Styles", start: 11, duration: 1 }]);
  content.byType[0].count++;
  assert.throws(() => analyzeMarkers(phases, content, options));
});

for (const [caseName, mutate] of [
  [
    "phase handle",
    marker => {
      marker.handle = "m-swapped";
    },
  ],
  [
    "phase label",
    marker => {
      marker.label = "different";
    },
  ],
  [
    "phase entry type",
    marker => {
      marker.data.entryType = "mark";
    },
  ],
  [
    "same-duration different interval",
    marker => {
      marker.start += 0.5;
    },
  ],
  [
    "phase duration",
    marker => {
      marker.duration += 0.5;
    },
  ],
  [
    "phase window",
    marker => {
      marker.data.innerWindowID++;
    },
  ],
]) {
  test(`rejects thread-export ${caseName} mismatch`, bounded, () => {
    const { phases, content } = fixture();
    mutate(content.flatMarkers[1]);
    assert.throws(
      () => analyzeMarkers(phases, content, options),
      /phase.*match/i
    );
  });
}

test("companions must be instantaneous in both exports", bounded, () => {
  for (const duration of [1, -1, NaN, Infinity]) {
    const { phases, content } = fixture();
    phases.markers[0].duration = duration;
    content.flatMarkers[0].duration = duration;
    assert.throws(() => analyzeMarkers(phases, content, options));
  }
  const { phases, content } = fixture();
  phases.markers[0].duration = 0;
  content.flatMarkers[0].duration = 0;
  assert.equal(analyzeMarkers(phases, content, options).phases.length, 4);
});

test("report does not copy labels, URLs, or arbitrary fields", bounded, () => {
  const { phases, content } = fixture();
  content.friendlyThreadName = "https://private.invalid/secret";
  setMarkers(content, [
    {
      name: "Styles",
      start: 11,
      duration: 1,
      label: "secret",
      fields: [{ value: "secret" }],
    },
  ]);
  assert.doesNotMatch(
    JSON.stringify(analyzeMarkers(phases, content, options)),
    /secret|private/
  );
});

test(
  "CLI writes only a new absolute output and fails incomplete inputs",
  bounded,
  async () => {
    const directory = await mkdtemp(join(tmpdir(), "marker-analysis-"));
    try {
      const { phases, content } = fixture();
      const phasePath = join(directory, "phases.json");
      const markerPath = join(directory, "markers.json");
      const outputPath = join(directory, "output.json");
      await writeFile(phasePath, JSON.stringify(phases));
      await writeFile(markerPath, JSON.stringify(content));
      const script = fileURLToPath(
        new URL("../analyze-markers.mjs", import.meta.url)
      );
      const args = [
        script,
        "--phases",
        phasePath,
        "--markers",
        markerPath,
        "--output",
        outputPath,
        "--expected-trials",
        "1",
        "--expected-warmup",
        "0",
      ];
      const run = values =>
        spawnSync(process.execPath, values, {
          encoding: "utf8",
          timeout: 2000,
        });
      assert.equal(run(args).status, 0);
      const original = await readFile(outputPath, "utf8");
      assert.equal(run(args).status, 1);
      assert.equal(await readFile(outputPath, "utf8"), original);
      assert.equal(
        run([...args.slice(0, 6), "relative.json", ...args.slice(7)]).status,
        1
      );
      await writeFile(phasePath, "{bad-json");
      assert.equal(run(args).status, 1);
      assert.equal(run([script]).status, 1);
    } finally {
      await rm(directory, { recursive: true });
    }
  }
);
