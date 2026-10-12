/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import vm from "node:vm";
import { createDOMServer } from "../fixture.mjs";

test("marker calibration is a separate fixed page-owned fixture", async () => {
  const controller = new AbortController();
  const server = await createDOMServer(
    controller.signal,
    "window",
    "marker-calibration"
  );
  try {
    assert.equal(server.metadata.version, 5);
    assert.equal(server.metadata.workload, "marker-calibration");
    assert.equal(server.metadata.warmups, 0);
    assert.equal(server.metadata.trials, 1);
    assert.deepEqual(server.metadata.cases, [
      "control",
      "detached-text",
      "attached-text",
    ]);
    const response = await fetch(server.url + "workload.js");
    const source = await response.text();
    assert.match(source, /dom-pref-calibration-/);
    assert.match(source, /index < 1000/);
    assert.equal(
      createHash("sha256").update(source).digest("hex"),
      server.metadata.scriptSHA256
    );
  } finally {
    controller.abort();
    await server.close();
  }
  await assert.rejects(
    createDOMServer(
      new AbortController().signal,
      "sandbox",
      "marker-calibration"
    )
  );
});

async function execute(mode = "success") {
  const { collectMarkerCalibration } = await import("../marker-workload.mjs");
  const entries = [];
  const mutations = [];
  const root = {
    childNodes: [],
    appendChild(node) {
      this.childNodes.push(node);
    },
  };
  const context = vm.createContext({
    document: {
      readyState: mode === "loading" ? "loading" : "complete",
      visibilityState: mode === "hidden" ? "hidden" : "visible",
      getElementById: () => (mode === "missing" ? null : root),
      createTextNode: initial => {
        let data = initial;
        return {
          get data() {
            return data;
          },
          set data(value) {
            if (mode === "mutation-error") {
              throw new Error("Mutation failed");
            }
            mutations.push({ value, attached: root.childNodes.includes(this) });
            data = value;
          },
          remove() {
            root.childNodes = root.childNodes.filter(node => node !== this);
          },
        };
      },
    },
    navigator: { webdriver: mode === "webdriver" },
    setTimeout: callback => callback(),
    performance: {
      timeOrigin: 100000,
      now: () => entries.length,
      getEntriesByName: entryName =>
        mode === "duplicate"
          ? [{}]
          : entries.filter(item => item.name === entryName),
      mark: entryName => {
        if (mode === "mark-error") {
          throw new Error("Marker failed");
        }
        const value = { name: entryName, startTime: entries.length };
        entries.push(value);
        return value;
      },
      measure: entryName => entries.push({ name: entryName }),
    },
  });
  const pending = vm.runInContext(
    `(${collectMarkerCalibration.toString()})()`,
    context,
    { timeout: 1000 }
  );
  return { pending, entries, mutations, root };
}

function envelope(measurement) {
  return {
    version: 2,
    realm: {
      globalIsWindow: true,
      objectPrototypeMatches: true,
      functionPrototypeMatches: true,
      collectorPrototypeMatches: true,
    },
    measurement,
  };
}

test("calibration brackets only loops, completes exact mutations and restores DOM", async () => {
  const { validateMarkerWindowResult } = await import("../marker-workload.mjs");
  const { pending, entries, mutations, root } = await execute();
  const measurement = JSON.parse(JSON.stringify(await pending));
  const result = validateMarkerWindowResult(envelope(measurement));
  assert.equal(result.result.samples.length, 3);
  assert.equal(entries.length, 9);
  assert.equal(mutations.length, 2000);
  assert.equal(mutations.filter(item => item.attached).length, 1000);
  assert.equal(root.childNodes.length, 0);
  assert.deepEqual(
    result.result.samples.map(item => item.checksum),
    [499500, 98, 98]
  );
});

test("calibration rejects bad state and duplicates; failed work cannot publish completion", async () => {
  for (const mode of [
    "loading",
    "hidden",
    "missing",
    "webdriver",
    "duplicate",
    "mark-error",
    "mutation-error",
  ]) {
    const value = await execute(mode);
    await assert.rejects(value.pending);
    assert.equal(value.root.childNodes.length, 0);
    if (mode === "mutation-error") {
      assert.equal(value.entries.length, 4);
    }
  }
});

test("calibration receipt requires exact schema, ordered finite spans and checksums", async () => {
  const { validateMarkerWindowResult } = await import("../marker-workload.mjs");
  const value = envelope(
    JSON.parse(JSON.stringify(await (await execute()).pending))
  );
  for (const mutate of [
    v => (v.version = 3),
    v => (v.extra = true),
    v => (v.realm.globalIsWindow = false),
    v => (v.measurement.version = 4),
    v => (v.measurement.workload = "mixed-profile"),
    v => (v.measurement.extra = true),
    v => (v.measurement.timeOrigin = NaN),
    v => (v.measurement.timeOrigin = 0),
    v => v.measurement.phases.pop(),
    v => (v.measurement.phases[0].name = "foreign"),
    v => (v.measurement.phases[0].start = -1),
    v => (v.measurement.phases[0].end = Infinity),
    v => (v.measurement.phases[1].start = 0),
    v => (v.measurement.phases[0].extra = true),
    v => (v.measurement.result.samples[0].iterations = 1001),
    v => (v.measurement.result.samples[0].checksum = 0),
    v => (v.measurement.result.samples[1].name = "control"),
    v => (v.measurement.result.samples[0].durationMs = 3),
    v => (v.measurement.result.after.children = 1),
    v => (v.measurement.result.totalMs = -1),
  ]) {
    const bad = structuredClone(value);
    mutate(bad);
    assert.throws(() => validateMarkerWindowResult(bad));
  }
});
