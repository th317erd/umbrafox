/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { parse } from "acorn";
import { collectDOM, validateDOMWindowResult } from "./fixture.mjs";

export async function profileDOM(collectorFactory) {
  const phases = [];
  const interval = async (phaseName, operation) => {
    for (const key of [phaseName, `${phaseName}:start`, `${phaseName}:end`]) {
      if (performance.getEntriesByName(key).length) {
        throw new Error("Duplicate profile phase");
      }
    }
    const start = performance.mark(`${phaseName}:start`).startTime;
    const result = await operation();
    const end = performance.mark(`${phaseName}:end`).startTime;
    performance.measure(phaseName, `${phaseName}:start`, `${phaseName}:end`);
    return { result, phase: { name: phaseName, start, end } };
  };
  const recordProfileCase = async (run, caseName, stage, index, position) => {
    const captured = await interval(
      `dom-window-case-${stage}-${index}-${position}-${caseName}`,
      () => run(caseName)
    );
    phases.push(captured.phase);
    return captured.result;
  };
  const captured = await interval(
    "dom-window-pass",
    collectorFactory(recordProfileCase)
  );
  return {
    version: 4,
    workload: "mixed-profile",
    timeOrigin: performance.timeOrigin,
    pass: captured.phase,
    phases,
    result: captured.result,
  };
}

export function createProfileCollectorSource(source = collectDOM.toString()) {
  assert.equal(
    createHash("sha256").update(source).digest("hex"),
    "ff39082ff809099170529acafe3e9f71ff554265405d95dd71121894df45da65",
    "Mixed collector changed; review profile instrumentation"
  );
  const tree = parse(source, { ecmaVersion: "latest" });
  const calls = [];
  const visit = node => {
    if (!node || typeof node !== "object") {
      return;
    }
    if (
      node.type === "AwaitExpression" &&
      node.argument.type === "CallExpression" &&
      node.argument.callee.name === "run"
    ) {
      calls.push(node.argument);
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        value.forEach(visit);
      } else if (value && typeof value === "object") {
        visit(value);
      }
    }
  };
  visit(tree);
  assert.equal(calls.length, 1);
  const call = calls[0];
  assert.equal(source.slice(call.start, call.end), "run(caseName)");
  const instrumented =
    source.slice(0, call.start) +
    "recordProfileCase(run, caseName, stage, index, position)" +
    source.slice(call.end);
  return `async function collectProfiledDOM() { return await (${profileDOM.toString()})(recordProfileCase => (${instrumented})); }`;
}

export function validateProfileWindowResult(value) {
  const profile = value?.measurement;
  assert(profile && typeof profile === "object");
  assert.deepEqual(Object.keys(profile).sort(), [
    "pass",
    "phases",
    "result",
    "timeOrigin",
    "version",
    "workload",
  ]);
  assert.equal(profile.version, 4);
  assert.equal(profile.workload, "mixed-profile");
  const result = validateDOMWindowResult({
    ...value,
    measurement: profile.result,
  });
  assert(Number.isFinite(profile.timeOrigin) && profile.timeOrigin > 0);
  const checkPhase = (phase, phaseName, minimumStart) => {
    assert.deepEqual(Object.keys(phase).sort(), ["end", "name", "start"]);
    assert.equal(phase.name, phaseName);
    assert(Number.isFinite(phase.start) && phase.start >= minimumStart);
    assert(Number.isFinite(phase.end) && phase.end >= phase.start);
    assert(phase.end <= profile.pass.end);
  };
  checkPhase(profile.pass, "dom-window-pass", 0);
  assert(profile.pass.end - profile.pass.start >= result.totalMs);
  assert(profile.pass.end - profile.pass.start <= 60000);
  assert(Array.isArray(profile.phases) && profile.phases.length === 80);
  let previous = profile.pass.start;
  for (const [index, sample] of result.samples.entries()) {
    const phase = profile.phases[index];
    checkPhase(
      phase,
      `dom-window-case-${sample.stage}-${sample.index}-${sample.position}-${sample.name}`,
      previous
    );
    assert(phase.end - phase.start >= sample.durationMs);
    previous = phase.end;
  }
  return profile;
}
