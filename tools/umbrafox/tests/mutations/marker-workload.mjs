/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";

export const MARKER_CASES = Object.freeze([
  "control",
  "detached-text",
  "attached-text",
]);

export async function collectMarkerCalibration() {
  const root = document.getElementById("fixture");
  if (!root || document.readyState !== "complete") {
    throw new Error("Fixture not ready");
  }
  const state = () => ({
    visibility: document.visibilityState,
    webdriver: navigator.webdriver,
    children: root.childNodes.length,
  });
  const before = state();
  if (before.visibility !== "visible" || before.webdriver || before.children) {
    throw new Error("Fixture not isolated or visible");
  }
  const phases = [];
  const samples = [];
  const started = performance.now();
  for (const caseName of ["control", "detached-text", "attached-text"]) {
    await new Promise(resolve => setTimeout(resolve, 20));
    if (performance.now() - started > 5000) {
      throw new Error("Calibration deadline");
    }
    const phaseName = `dom-pref-calibration-${caseName}`;
    for (const key of [phaseName, `${phaseName}:start`, `${phaseName}:end`]) {
      if (performance.getEntriesByName(key).length) {
        throw new Error("Duplicate calibration phase");
      }
    }
    const text = document.createTextNode("x");
    try {
      if (caseName === "attached-text") {
        root.appendChild(text);
      }
      let checksum = 0;
      const start = performance.mark(`${phaseName}:start`).startTime;
      if (caseName === "control") {
        for (let index = 0; index < 1000; index++) {
          checksum += index;
        }
      } else {
        for (let index = 0; index < 1000; index++) {
          text.data = index & 1 ? "b" : "a";
        }
      }
      const end = performance.mark(`${phaseName}:end`).startTime;
      performance.measure(phaseName, `${phaseName}:start`, `${phaseName}:end`);
      if (caseName !== "control") {
        checksum = text.data.charCodeAt(0);
      }
      phases.push({ name: phaseName, start, end });
      samples.push({
        name: caseName,
        iterations: 1000,
        checksum,
        durationMs: end - start,
      });
    } finally {
      text.remove();
    }
  }
  return {
    version: 5,
    workload: "marker-calibration",
    timeOrigin: performance.timeOrigin,
    phases,
    result: {
      before,
      after: state(),
      samples,
      totalMs: performance.now() - started,
    },
  };
}

export function validateMarkerWindowResult(value) {
  assert.equal(value?.version, 2);
  assert.deepEqual(Object.keys(value).sort(), [
    "measurement",
    "realm",
    "version",
  ]);
  assert.deepEqual(value.realm, {
    globalIsWindow: true,
    objectPrototypeMatches: true,
    functionPrototypeMatches: true,
    collectorPrototypeMatches: true,
  });
  const profile = value.measurement;
  assert.equal(profile?.version, 5);
  assert.equal(profile.workload, "marker-calibration");
  assert.deepEqual(Object.keys(profile).sort(), [
    "phases",
    "result",
    "timeOrigin",
    "version",
    "workload",
  ]);
  assert(Number.isFinite(profile.timeOrigin) && profile.timeOrigin > 0);
  const { result, phases } = profile;
  assert.deepEqual(Object.keys(result).sort(), [
    "after",
    "before",
    "samples",
    "totalMs",
  ]);
  for (const state of [result.before, result.after]) {
    assert.deepEqual(state, {
      visibility: "visible",
      webdriver: false,
      children: 0,
    });
  }
  assert(Array.isArray(phases) && phases.length === 3);
  assert(Array.isArray(result.samples) && result.samples.length === 3);
  let previous = 0;
  let total = 0;
  for (const [index, caseName] of MARKER_CASES.entries()) {
    const phase = phases[index];
    const { durationMs, ...sample } = result.samples[index];
    assert.deepEqual(sample, {
      name: caseName,
      iterations: 1000,
      checksum: index ? 98 : 499500,
    });
    assert.deepEqual(Object.keys(phase).sort(), ["end", "name", "start"]);
    assert.equal(phase.name, `dom-pref-calibration-${caseName}`);
    assert(Number.isFinite(phase.start) && phase.start >= previous);
    assert(Number.isFinite(phase.end) && phase.end >= phase.start);
    assert.equal(durationMs, phase.end - phase.start);
    assert(durationMs <= 3000);
    previous = phase.end;
    total += durationMs;
  }
  assert(
    Number.isFinite(result.totalMs) &&
      result.totalMs >= total &&
      result.totalMs <= 6000
  );
  assert(result.totalMs >= phases.at(-1).end - phases[0].start);
  return profile;
}
