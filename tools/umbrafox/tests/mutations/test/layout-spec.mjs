/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import { parse } from "acorn";
import * as fixture from "../fixture.mjs";

function pageModel(options = {}) {
  const counts = { assignments: 0, widths: 0, waits: 0, removals: 0 };
  const operations = [];
  let clock = 0;
  /** Counts the isolated collector's DOM operations without a browser. */
  class PageNode {
    constructor() {
      this.childNodes = [];
    }
    appendChild(child) {
      child.parent = this;
      this.childNodes.push(child);
    }
    remove() {
      if (this.parent) {
        counts.removals++;
        this.parent.childNodes.splice(this.parent.childNodes.indexOf(this), 1);
      }
    }
    set className(value) {
      if (operations.length < 128) {
        operations.push("set");
      }
      if (++counts.assignments === options.failAssignment) {
        throw new Error("Injected assignment failure");
      }
      this.value = value;
    }
    get offsetWidth() {
      if (operations.length < 128) {
        operations.push("get");
      }
      counts.widths++;
      if (counts.widths === options.badWidth) {
        return 65;
      }
      return this.value === "row wide" ? 96 : 64;
    }
  }
  const root = new PageNode();
  const context = vm.createContext({
    document: {
      readyState: options.readyState ?? "complete",
      visibilityState: options.visibility ?? "visible",
      getElementById: () => (options.missing ? null : root),
      createElement: () => new PageNode(),
    },
    navigator: { webdriver: options.webdriver ?? false },
    performance: { now: () => (clock += options.clockStep ?? 1) },
    setTimeout: (resolve, milliseconds) => {
      assert.equal(milliseconds, 20);
      counts.waits++;
      resolve();
    },
  });
  return {
    root,
    counts,
    operations,
    run: (interleaved = false) =>
      vm.runInContext(
        `(${fixture.collectLayout.toString()})(${JSON.stringify(interleaved)})`,
        context,
        {
          timeout: 1000,
        }
      ),
  };
}

test("isolated timed loop remains source-identical to the mixed layout loop", () => {
  const loop = collector => {
    const source = collector.toString();
    const tree = parse(source, { ecmaVersion: "latest" });
    const declaration = tree.body[0].body.body.find(
      node =>
        node.type === "VariableDeclaration" &&
        node.declarations[0].id.name === "layout"
    ).declarations[0].init;
    return source.slice(declaration.start, declaration.end);
  };
  assert.equal(loop(fixture.collectLayout), loop(fixture.collectDOM));
});

test("interleaved mode alternates writes and reads without changing loop or schedule", async () => {
  const page = pageModel();
  const result = validResult();
  result.measurement = JSON.parse(JSON.stringify(await page.run(true)));
  assert.equal(result.measurement.workload, "layout-interleaved");
  assert.equal(
    fixture.validateDOMWindowResult(result, "layout-interleaved"),
    result.measurement
  );
  assert.deepEqual(page.operations.slice(64, 70), [
    "set",
    "get",
    "set",
    "get",
    "set",
    "get",
  ]);
  assert.deepEqual(page.counts, {
    assignments: 58240,
    widths: 59136,
    waits: 28,
    removals: 28,
  });
  assert.equal(page.root.childNodes.length, 0);
  assert.throws(() => fixture.validateDOMWindowResult(result, "layout"));
  for (const options of [
    { badWidth: 1 },
    { badWidth: 2081 },
    { failAssignment: 100 },
    { clockStep: 60000 },
  ]) {
    const broken = pageModel(options);
    await assert.rejects(broken.run(true));
    assert.equal(broken.root.childNodes.length, 0);
  }
  for (const value of ["true", 1, null]) {
    await assert.rejects(pageModel().run(value));
  }
});

test("interleaved fixture identifies the distinct mode and self-contained collector", async () => {
  const controller = new AbortController();
  const server = await fixture.createDOMServer(
    controller.signal,
    "window",
    "layout-interleaved"
  );
  try {
    assert.equal(server.metadata.version, 6);
    assert.equal(server.metadata.workload, "layout-interleaved");
    assert.deepEqual(server.metadata.cases, ["layout-interleaved"]);
    assert.equal(server.metadata.warmups, 12);
    assert.equal(server.metadata.trials, 16);
    const source = await (await fetch(server.url + "workload.js")).text();
    assert(source.includes(fixture.collectLayout.toString()));
    assert(source.includes(")(true)"));
    assert(!source.includes(fixture.collectDOM.toString()));
  } finally {
    controller.abort();
    await server.close();
  }
  await assert.rejects(
    fixture.createDOMServer(
      new AbortController().signal,
      "sandbox",
      "layout-interleaved"
    )
  );
  const result = validResult();
  result.measurement.workload = "layout-interleaved";
  for (const sample of result.measurement.samples) {
    sample.name = "layout-interleaved";
  }
  fixture.validateDOMWindowResult(result, "layout-interleaved");
  for (const mutate of [
    value => value.measurement.samples.pop(),
    value => value.measurement.samples[12].index++,
    value => (value.measurement.samples[12].durationMs = NaN),
    value => value.measurement.samples[12].checksum++,
    value => (value.realm.globalIsWindow = false),
    value => value.measurement.after.children++,
    value => (value.measurement.samples[0].name = "layout-batched"),
  ]) {
    const broken = structuredClone(result);
    mutate(broken);
    assert.throws(() =>
      fixture.validateDOMWindowResult(broken, "layout-interleaved")
    );
  }
});

function validResult() {
  return {
    version: 2,
    realm: {
      globalIsWindow: true,
      objectPrototypeMatches: true,
      functionPrototypeMatches: true,
      collectorPrototypeMatches: true,
    },
    measurement: {
      version: 1,
      workload: "layout-batched",
      before: { visibility: "visible", webdriver: false, children: 0 },
      after: { visibility: "visible", webdriver: false, children: 0 },
      totalMs: 1000,
      samples: ["warmup", "trial"].flatMap(stage =>
        Array.from({ length: stage === "warmup" ? 12 : 16 }, (_, index) => ({
          stage,
          index,
          position: 0,
          name: "layout-batched",
          durationMs: 10,
          iterations: 2048,
          checksum: 163840,
          observerCallbacks: 0,
        }))
      ),
    },
  };
}

test("layout fixture has a distinct fixed plan and preserves mixed defaults", async () => {
  const controller = new AbortController();
  const server = await fixture.createDOMServer(
    controller.signal,
    "window",
    "layout"
  );
  try {
    assert.equal(server.metadata.version, 3);
    assert.equal(server.metadata.workload, "layout-batched");
    assert.deepEqual(server.metadata.cases, ["layout-batched"]);
    assert.equal(server.metadata.warmups, 12);
    assert.equal(server.metadata.trials, 16);
    const source = await (await fetch(server.url + "workload.js")).text();
    assert(source.includes(fixture.collectLayout.toString()));
    assert(!source.includes(fixture.collectDOM.toString()));
  } finally {
    controller.abort();
    await server.close();
  }
  for (const [execution, workload] of [
    ["window", "unknown"],
    ["sandbox", "layout"],
  ]) {
    await assert.rejects(
      fixture.createDOMServer(new AbortController().signal, execution, workload)
    );
  }
});

test("isolated layout executes exact operations and all fixed warmup/trial receipts", async () => {
  const page = pageModel();
  const result = validResult();
  result.measurement = JSON.parse(JSON.stringify(await page.run()));
  assert.equal(
    fixture.validateDOMWindowResult(result, "layout"),
    result.measurement
  );
  assert.deepEqual(page.counts, {
    assignments: 58240,
    widths: 59136,
    waits: 28,
    removals: 28,
  });
  assert.equal(page.root.childNodes.length, 0);
  assert.throws(() => fixture.validateDOMWindowResult(result));
});

test("layout rejects bad geometry, operation failures and deadlines with cleanup", async () => {
  for (const options of [
    { failAssignment: 100 },
    { badWidth: 1 },
    { badWidth: 2081 },
    { clockStep: 60000 },
    { missing: true },
    { readyState: "loading" },
    { visibility: "hidden" },
    { webdriver: true },
  ]) {
    const page = pageModel(options);
    await assert.rejects(page.run());
    assert.equal(page.root.childNodes.length, 0);
  }
});

test("layout validator rejects schedule, geometry, state, time and realm corruption", () => {
  assert.equal(
    fixture.validateDOMWindowResult(validResult(), "layout").samples.length,
    28
  );
  const changes = [
    value => (value.version = 3),
    value => (value.realm.globalIsWindow = false),
    value => (value.measurement.workload = "mixed"),
    value => (value.measurement.version = 2),
    value => (value.measurement.extra = true),
    value => value.measurement.samples.pop(),
    value => value.measurement.samples.push(value.measurement.samples[0]),
    value => (value.measurement.samples[0].stage = "trial"),
    value => (value.measurement.samples[12].index = 1),
    value => (value.measurement.samples[0].position = 1),
    value => (value.measurement.samples[0].name = "layout-interleaved"),
    value => (value.measurement.samples[0].iterations = 2047),
    value => (value.measurement.samples[0].checksum = 0),
    value => (value.measurement.samples[0].observerCallbacks = 1),
    value => (value.measurement.samples[0].durationMs = NaN),
    value => (value.measurement.samples[0].durationMs = Infinity),
    value => (value.measurement.samples[0].durationMs = -1),
    value => (value.measurement.samples[0].durationMs = "10"),
    value => (value.measurement.samples[0].durationMs = 3001),
    value => (value.measurement.totalMs = 279),
    value => (value.measurement.totalMs = 60001),
    value => (value.measurement.totalMs = NaN),
    value => (value.measurement.after.children = 1),
    value => (value.measurement.before.webdriver = true),
  ];
  for (const change of changes) {
    const result = validResult();
    change(result);
    assert.throws(() => fixture.validateDOMWindowResult(result, "layout"));
  }
  assert.throws(() =>
    fixture.validateDOMWindowResult(validResult(), "unknown")
  );
});
