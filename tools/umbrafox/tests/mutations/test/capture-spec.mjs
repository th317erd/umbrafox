/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import { captureDOM, main } from "../capture.mjs";
import { DOM_CASES, expectedDOMSample } from "../fixture.mjs";

test("main adapter does not forward the shared runner signal into the workload selector", () => {
  const definition = vm.runInNewContext(`(${main.toString()})`, {
    assert,
    captureLocalWorkload: (_binary, _root, value) => value,
    createDOMServer: () => {},
    captureDOM: (...args) => args,
  });
  for (const workload of ["mixed", "layout", "layout-interleaved"]) {
    const value = definition("/binary", "/output", workload);
    const args = [{}, 7, () => {}, () => {}, {}];
    assert.deepEqual(value.capture(...args, new AbortController().signal), [
      ...args,
      workload,
    ]);
  }
});

function fixture(workload = "mixed") {
  const samples = [];
  for (const stage of ["warmup", "trial"]) {
    for (let index = 0; index < (stage === "warmup" ? 2 : 8); index++) {
      for (let position = 0; position < 8; position++) {
        const caseName = DOM_CASES[(index + position) % 8];
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
  const native = { result: { value: { active: false, profiler: false } } };
  const identity = {
    context: 7,
    document: 11,
    result: {
      value: {
        webdriver: false,
        state: "complete",
        transportGlobalIsWindow: false,
      },
    },
  };
  const measurement = {
    context: 7,
    document: 11,
    result: {
      value: {
        version: 1,
        before: { visibility: "visible", webdriver: false, children: 0 },
        after: { visibility: "visible", webdriver: false, children: 0 },
        totalMs: 2500,
        samples,
      },
    },
  };
  measurement.result.value = {
    version: 2,
    realm: {
      globalIsWindow: true,
      objectPrototypeMatches: true,
      functionPrototypeMatches: true,
      collectorPrototypeMatches: true,
    },
    measurement: measurement.result.value,
  };
  if (workload === "layout" || workload === "layout-interleaved") {
    const caseName = workload === "layout" ? "layout-batched" : workload;
    measurement.result.value.measurement = {
      ...measurement.result.value.measurement,
      workload: caseName,
      samples: ["warmup", "trial"].flatMap(stage =>
        Array.from({ length: stage === "warmup" ? 12 : 16 }, (_, index) => ({
          stage,
          index,
          position: 0,
          name: caseName,
          durationMs: 10,
          ...expectedDOMSample(caseName),
        }))
      ),
    };
  }
  const replies = [
    structuredClone(native),
    identity,
    measurement,
    structuredClone(native),
  ];
  const calls = [];
  const saved = new Map();
  const report = {};
  return {
    replies,
    calls,
    saved,
    report,
    run: () =>
      captureDOM(
        {
          request: async (method, params) => {
            calls.push({ method, params });
            const reply = replies[calls.length - 1];
            if (reply instanceof Error) {
              throw reply;
            }
            return reply;
          },
        },
        7,
        async (fileName, value) => saved.set(fileName, value),
        operation => operation(),
        report,
        workload
      ),
  };
}

test("DOM capture uses one timed page call, fixed document and native boundaries", async () => {
  const value = fixture();
  await value.run();
  assert.equal(value.calls.length, 4);
  assert.equal(value.calls[2].params.document, 11);
  assert.equal(value.calls[2].params.timeoutMs, 60000);
  assert(!value.calls[2].params.body.includes("index < 262144"));
  assert(value.calls[2].params.body.includes('getElementById("run")'));
  assert.equal(value.report.sampleCount, 80);
  assert.equal(value.report.document, 11);
  assert.equal(value.saved.size, 4);
});

test("interleaved capture preserves native/document gates and uses its own validator", async () => {
  const value = fixture("layout-interleaved");
  await value.run();
  assert.equal(value.calls.length, 4);
  assert.equal(value.report.fixtureVersion, 6);
  assert.equal(value.report.sampleCount, 28);
  assert.equal(value.report.workload, "layout-interleaved");
  const broken = fixture("layout-interleaved");
  broken.replies[2].result.value.measurement.workload = "layout-batched";
  await assert.rejects(broken.run());
  assert(broken.saved.has("dom-samples.json"));
  assert.equal(broken.calls.length, 3);
});

test("layout capture explicitly selects its separate validator and metadata", async () => {
  const value = fixture("layout");
  await value.run();
  assert.equal(value.report.sampleCount, 28);
  assert.equal(value.report.fixtureVersion, 3);
  assert.equal(value.report.workload, "layout-batched");
  assert.equal(value.calls.length, 4);
  assert(!value.calls[2].params.body.includes("offsetWidth"));
  const invalid = fixture("unknown");
  await assert.rejects(invalid.run());
  assert.equal(invalid.calls.length, 0);
  for (const change of [
    replies => (replies[2].result.value.measurement.workload = "mixed"),
    replies => (replies[2].result.value.measurement.samples[0].checksum = 0),
    replies => (replies[2].result.value.realm.globalIsWindow = false),
    replies => (replies[2].document = 12),
  ]) {
    const broken = fixture("layout");
    change(broken.replies);
    await assert.rejects(broken.run());
    assert.equal(broken.saved.size, 3);
    assert.equal(broken.calls.length, 3);
  }
});

test("DOM capture preserves bad raw results before rejecting identity, state or checksum", async () => {
  const changes = [
    replies => (replies[0].result.value.active = true),
    replies => (replies[0].result.value.profiler = true),
    replies => (replies[1].result.value.webdriver = true),
    replies => (replies[1].result.value.transportGlobalIsWindow = true),
    replies => (replies[1].document = 0),
    replies => (replies[1].context = 8),
    replies => (replies[2].document = 12),
    replies => (replies[2].context = 8),
    replies => (replies[2].result.value.measurement.samples[0].checksum = 0),
    replies => (replies[2].result.value.realm.globalIsWindow = false),
    replies => (replies[2].result.value.realm.objectPrototypeMatches = false),
    replies => (replies[2].result.value.realm.functionPrototypeMatches = false),
    replies =>
      (replies[2].result.value.realm.collectorPrototypeMatches = false),
    replies => (replies[2].result.value.version = 1),
    replies => (replies[2].result.value = replies[2].result.value.measurement),
    replies => (replies[2].result.value.extra = true),
    replies => (replies[3].result.value.active = true),
    replies => (replies[3].result.value.profiler = true),
  ];
  for (const change of changes) {
    const value = fixture();
    change(value.replies);
    await assert.rejects(value.run());
    assert.equal(value.saved.size, value.calls.length);
  }
});

test("DOM RPC failure stops subsequent work and preserves completed replies", async () => {
  for (let index = 0; index < 4; index++) {
    const value = fixture();
    const failure = new Error("RPC disconnected");
    value.replies[index] = failure;
    await assert.rejects(value.run(), error => error === failure);
    assert.equal(value.calls.length, index + 1);
    assert.equal(value.saved.size, index);
  }
});
