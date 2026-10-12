/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import vm from "node:vm";
import { parse } from "acorn";
import {
  collectDOM,
  createDOMServer,
  DOM_CASES,
  expectedDOMSample,
  validateDOMWindowResult,
} from "../fixture.mjs";
import {
  createProfileCollectorSource,
  profileDOM,
  validateProfileWindowResult,
} from "../profile-workload.mjs";

test("profile fixture is separately versioned and remains page-owned", async () => {
  const controller = new AbortController();
  const server = await createDOMServer(
    controller.signal,
    "window",
    "mixed-profile"
  );
  try {
    assert.equal(server.metadata.version, 4);
    assert.equal(server.metadata.workload, "mixed-profile");
    assert.equal(server.metadata.execution, "window");
    assert.equal(server.metadata.warmups, 2);
    assert.equal(server.metadata.trials, 8);
    assert.equal(
      server.metadata.baseCollectorSHA256,
      createHash("sha256").update(collectDOM.toString()).digest("hex")
    );
    const source = await (await fetch(server.url + "workload.js")).text();
    assert.match(source, /dom-window-pass/);
    assert.match(source, /recordProfileCase/);
    assert.equal(
      createHash("sha256").update(source).digest("hex"),
      server.metadata.scriptSHA256
    );
  } finally {
    controller.abort();
    await server.close();
  }
  await assert.rejects(
    createDOMServer(new AbortController().signal, "sandbox", "mixed-profile")
  );
});

test("profile source replaces only one outer invocation, preserving every hot loop", () => {
  const source = createProfileCollectorSource();
  const tree = parse(source, { ecmaVersion: "latest" });
  let original;
  const visit = node => {
    if (!node || typeof node !== "object") {
      return;
    }
    if (node.type === "FunctionExpression" && node.id?.name === "collectDOM") {
      original = source.slice(node.start, node.end);
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
  assert.equal(
    original.replace(
      "recordProfileCase(run, caseName, stage, index, position)",
      "run(caseName)"
    ),
    collectDOM.toString()
  );
  for (const bad of [
    "",
    "async function collectDOM() {}",
    collectDOM.toString() + "\n",
  ]) {
    assert.throws(() => createProfileCollectorSource(bad), /collector changed/);
  }
});

function validProfile() {
  const phases = [];
  const samples = [];
  for (const stage of ["warmup", "trial"]) {
    for (let index = 0; index < (stage === "warmup" ? 2 : 8); index++) {
      for (let position = 0; position < 8; position++) {
        const caseName = DOM_CASES[(index + position) % 8];
        phases.push({
          name: `dom-window-case-${stage}-${index}-${position}-${caseName}`,
          start: 10 + samples.length * 30,
          end: 30 + samples.length * 30,
        });
        samples.push({
          stage,
          index,
          position,
          name: caseName,
          durationMs: 10,
          ...expectedDOMSample(caseName),
        });
      }
    }
  }
  return {
    version: 2,
    realm: {
      globalIsWindow: true,
      objectPrototypeMatches: true,
      functionPrototypeMatches: true,
      collectorPrototypeMatches: true,
    },
    measurement: {
      version: 4,
      workload: "mixed-profile",
      timeOrigin: 100000,
      pass: { name: "dom-window-pass", start: 1, end: 2501 },
      phases,
      result: {
        version: 1,
        totalMs: 2500,
        samples,
        before: { visibility: "visible", webdriver: false, children: 0 },
        after: { visibility: "visible", webdriver: false, children: 0 },
      },
    },
  };
}

test("profile validation separates timing receipts from unprofiled results and rejects corruption", () => {
  assert.equal(validateProfileWindowResult(validProfile()).phases.length, 80);
  assert.throws(() => validateDOMWindowResult(validProfile()));
  for (const change of [
    v => (v.extra = true),
    v => (v.realm.globalIsWindow = false),
    v => (v.measurement.extra = true),
    v => (v.measurement.version = 2),
    v => (v.measurement.timeOrigin = NaN),
    v => (v.measurement.timeOrigin = 0),
    v => (v.measurement.workload = "mixed"),
    v => v.measurement.phases.pop(),
    v => v.measurement.phases.push(v.measurement.phases[0]),
    v => (v.measurement.phases[0].name = "wrong"),
    v => (v.measurement.phases[0].start = -1),
    v => (v.measurement.phases[0].end = Infinity),
    v => (v.measurement.phases[0].end = 11),
    v => (v.measurement.phases[1].start = 15),
    v => (v.measurement.phases[0].extra = true),
    v => (v.measurement.pass.start = NaN),
    v => (v.measurement.pass.end = 70000),
    v => (v.measurement.pass.end = 2499),
    v => (v.measurement.result.samples[0].checksum = 0),
  ]) {
    const value = validProfile();
    change(value);
    assert.throws(() => validateProfileWindowResult(value));
  }
});

test("phase recording rejects duplicates and leaves failed work incomplete", async () => {
  for (const mode of [
    "pass-duplicate",
    "case-duplicate",
    "run-failure",
    "mark-failure",
    "measure-failure",
  ]) {
    const entries = [];
    let calls = 0;
    const context = vm.createContext({
      performance: {
        timeOrigin: 100,
        getEntriesByName: phaseName =>
          mode === "pass-duplicate" ||
          (mode === "case-duplicate" && phaseName.includes("case"))
            ? [{}]
            : [],
        mark: phaseName => {
          if (mode === "mark-failure") {
            throw new Error("mark failed");
          }
          entries.push(phaseName);
          return { startTime: entries.length };
        },
        measure: phaseName => {
          if (mode === "measure-failure") {
            throw new Error("measure failed");
          }
          entries.push(phaseName);
        },
      },
      operation: async () => {
        calls++;
        if (mode === "run-failure") {
          throw new Error("run failed");
        }
        return {};
      },
    });
    await assert.rejects(
      vm.runInContext(
        `(${profileDOM.toString()})(record => async () => record(operation, 'js', 'trial', 0, 0))`,
        context,
        { timeout: 1000 }
      )
    );
    assert(!entries.includes("dom-window-pass:end"));
    assert.equal(
      calls,
      ["run-failure", "measure-failure"].includes(mode) ? 1 : 0
    );
  }
});
