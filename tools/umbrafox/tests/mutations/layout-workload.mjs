/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";

export const LAYOUT_PLAN = Object.freeze({
  name: "layout-batched",
  warmups: 12,
  trials: 16,
});

export const INTERLEAVED_LAYOUT_PLAN = Object.freeze({
  ...LAYOUT_PLAN,
  name: "layout-interleaved",
});

export async function collectLayout(interleavedMode = false) {
  if (typeof interleavedMode !== "boolean") {
    throw new Error("Invalid layout mode");
  }
  const workload = interleavedMode ? "layout-interleaved" : "layout-batched";
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
  const layout = (rows, interleaved) => {
    let checksum = 0;
    for (let round = 0; round < 64; round++) {
      const className = round & 1 ? "row" : "row wide";
      for (const row of rows) {
        row.className = className;
        if (interleaved) {
          checksum += row.offsetWidth;
        }
      }
      if (!interleaved) {
        for (const row of rows) {
          checksum += row.offsetWidth;
        }
      }
    }
    return checksum;
  };
  const samples = [];
  const start = performance.now();
  for (const stage of ["warmup", "trial"]) {
    for (let index = 0; index < (stage === "warmup" ? 12 : 16); index++) {
      if (performance.now() - start > 55000) {
        throw new Error("Layout workload deadline");
      }
      await new Promise(resolve => setTimeout(resolve, 20));
      const node = document.createElement("div");
      try {
        root.appendChild(node);
        const rows = Array.from({ length: 32 }, () => {
          const row = document.createElement("div");
          row.className = "row";
          node.appendChild(row);
          return row;
        });
        if (rows.some(row => row.offsetWidth !== 64)) {
          throw new Error("Invalid initial layout");
        }
        const sampleStart = performance.now();
        const checksum = layout(rows, interleavedMode);
        const durationMs = performance.now() - sampleStart;
        if (rows.some(row => row.offsetWidth !== 64)) {
          throw new Error("Invalid final layout");
        }
        samples.push({
          stage,
          index,
          position: 0,
          name: workload,
          durationMs,
          iterations: 2048,
          checksum,
          observerCallbacks: 0,
        });
      } finally {
        node.remove();
      }
    }
  }
  return {
    version: 1,
    workload,
    before,
    after: state(),
    totalMs: performance.now() - start,
    samples,
  };
}

export function validateLayoutResult(value, workloadName = LAYOUT_PLAN.name) {
  assert(
    [LAYOUT_PLAN.name, INTERLEAVED_LAYOUT_PLAN.name].includes(workloadName)
  );
  assert.equal(value?.version, 1);
  assert.equal(value.workload, workloadName);
  assert.deepEqual(Object.keys(value).sort(), [
    "after",
    "before",
    "samples",
    "totalMs",
    "version",
    "workload",
  ]);
  for (const state of [value.before, value.after]) {
    assert.deepEqual(state, {
      visibility: "visible",
      webdriver: false,
      children: 0,
    });
  }
  assert(Array.isArray(value.samples) && value.samples.length === 28);
  let sampleIndex = 0;
  let measuredMs = 0;
  for (const stage of ["warmup", "trial"]) {
    const count = stage === "warmup" ? LAYOUT_PLAN.warmups : LAYOUT_PLAN.trials;
    for (let index = 0; index < count; index++) {
      const { durationMs, ...details } = value.samples[sampleIndex++];
      assert.deepEqual(details, {
        stage,
        index,
        position: 0,
        name: workloadName,
        iterations: 2048,
        checksum: 163840,
        observerCallbacks: 0,
      });
      assert(
        Number.isFinite(durationMs) && durationMs >= 0 && durationMs <= 3000
      );
      measuredMs += durationMs;
    }
  }
  assert(
    Number.isFinite(value.totalMs) &&
      value.totalMs >= measuredMs &&
      value.totalMs <= 60000
  );
  return value;
}
