/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import {
  createProfileCollectorSource,
  validateProfileWindowResult,
} from "../profile-workload.mjs";
import {
  DOM_CASES,
  expectedDOMSample,
  createDOMServer,
  collectDOM,
  validateDOMResult,
} from "../fixture.mjs";

function pageModel(
  failTextAt = Infinity,
  collector = collectDOM,
  performanceOverrides = {}
) {
  const counts = {
    text: 0,
    attributes: 0,
    appends: 0,
    removes: 0,
    widths: 0,
    records: 0,
    disconnects: 0,
  };
  let clock = 0;
  /** Minimal operation-counting DOM for the serialized collector. */
  class PageNode {
    constructor(tag, data = "") {
      this.tag = tag;
      this.value = data;
      this.childNodes = [];
    }
    appendChild(child) {
      if (child.tag === "span") {
        counts.appends++;
      }
      child.parent = this;
      this.childNodes.push(child);
      return child;
    }
    removeChild(child) {
      if (child.tag === "span") {
        counts.removes++;
      }
      this.childNodes.splice(this.childNodes.indexOf(child), 1);
      child.parent = null;
      return child;
    }
    remove() {
      this.parent?.removeChild(this);
    }
    replaceChildren() {
      for (const child of this.childNodes) {
        child.parent = null;
      }
      this.childNodes = [];
    }
    setAttribute(key, value) {
      assert.equal(key, "data-value");
      counts.attributes++;
      this.attribute = value;
    }
    getAttribute() {
      return this.attribute;
    }
    get data() {
      return this.value;
    }
    set data(value) {
      if (++counts.text === failTextAt) {
        throw new Error("Injected DOM failure");
      }
      this.value = value;
      if (this.observer) {
        this.observer.records.push({ type: "characterData", target: this });
        counts.records++;
      }
    }
    get offsetWidth() {
      counts.widths++;
      return this.className === "row wide" ? 96 : 64;
    }
  }
  const root = new PageNode("main");
  /** Models the collector's synchronous takeRecords path only. */
  class Observer {
    constructor() {
      this.records = [];
    }
    observe(node) {
      this.node = node;
      node.observer = this;
    }
    takeRecords() {
      const records = this.records;
      this.records = [];
      return records;
    }
    disconnect() {
      this.node.observer = null;
      counts.disconnects++;
    }
  }
  const context = vm.createContext({
    document: {
      readyState: "complete",
      visibilityState: "visible",
      getElementById: () => root,
      createElement: tag => new PageNode(tag),
      createTextNode: data => new PageNode("text", data),
    },
    navigator: { webdriver: false },
    performance: { now: () => ++clock, ...performanceOverrides },
    MutationObserver: Observer,
    setTimeout: resolve => resolve(),
  });
  return {
    counts,
    root,
    run: () =>
      vm.runInContext(`(${collector.toString()})()`, context, {
        timeout: 8000,
      }),
  };
}

test(
  "serialized page collector performs every counted operation and cleans up",
  { timeout: 10000 },
  async () => {
    const page = pageModel();
    const value = JSON.parse(JSON.stringify(await page.run()));
    validateDOMResult(value);
    assert.deepEqual(page.counts, {
      text: 5898240,
      attributes: 2621440,
      appends: 1310720,
      removes: 1310720,
      widths: 42240,
      records: 655360,
      disconnects: 10,
    });
    assert.equal(page.root.childNodes.length, 0);
  }
);

test("page failure removes attached nodes before propagating", async () => {
  const page = pageModel(262150);
  await assert.rejects(page.run(), /Injected DOM failure/);
  assert.equal(page.root.childNodes.length, 0);
});

test(
  "profile collector preserves all operations and emits exactly 81 marker triplets",
  { timeout: 10000 },
  async () => {
    const entries = [];
    const performanceOverrides = {
      timeOrigin: 100000,
      getEntriesByName: phaseName =>
        entries.filter(entry => entry.name === phaseName),
      mark(phaseName) {
        const entry = { name: phaseName, startTime: this.now() };
        entries.push(entry);
        return entry;
      },
      measure(phaseName, start, end) {
        entries.push({ name: phaseName, start, end });
      },
    };
    const page = pageModel(
      Infinity,
      { toString: createProfileCollectorSource },
      performanceOverrides
    );
    const measurement = JSON.parse(JSON.stringify(await page.run()));
    const value = {
      version: 2,
      realm: {
        globalIsWindow: true,
        objectPrototypeMatches: true,
        functionPrototypeMatches: true,
        collectorPrototypeMatches: true,
      },
      measurement,
    };
    validateProfileWindowResult(value);
    assert.equal(entries.length, 243);
    assert.equal(new Set(entries.map(entry => entry.name)).size, 243);
    for (const phase of [measurement.pass, ...measurement.phases]) {
      assert.equal(
        entries.find(entry => entry.name === phase.name + ":start").startTime,
        phase.start
      );
      assert.equal(
        entries.find(entry => entry.name === phase.name + ":end").startTime,
        phase.end
      );
      assert.deepEqual(
        entries.find(entry => entry.name === phase.name),
        {
          name: phase.name,
          start: phase.name + ":start",
          end: phase.name + ":end",
        }
      );
    }
    assert.deepEqual(page.counts, {
      text: 5898240,
      attributes: 2621440,
      appends: 1310720,
      removes: 1310720,
      widths: 42240,
      records: 655360,
      disconnects: 10,
    });
    assert.equal(page.root.childNodes.length, 0);
    const broken = pageModel(
      262150,
      { toString: createProfileCollectorSource },
      {
        ...performanceOverrides,
        getEntriesByName: () => [],
      }
    );
    await assert.rejects(broken.run(), /Injected DOM failure/);
    assert.equal(broken.root.childNodes.length, 0);
  }
);

function validResult() {
  const samples = [];
  for (const stage of ["warmup", "trial"]) {
    for (let index = 0; index < (stage === "warmup" ? 2 : 8); index++) {
      for (let position = 0; position < DOM_CASES.length; position++) {
        const caseName = DOM_CASES[(index + position) % DOM_CASES.length];
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
    version: 1,
    before: { visibility: "visible", webdriver: false, children: 0 },
    after: { visibility: "visible", webdriver: false, children: 0 },
    totalMs: 2500,
    samples,
  };
}

test("fixed DOM schedule preserves all 80 samples and operation oracles", () => {
  const value = validResult();
  assert.equal(validateDOMResult(value), value);
  assert.equal(value.samples.length, 80);
  assert.throws(() => expectedDOMSample("unknown"));
});

test("DOM validator rejects lost work, order, malformed times and observer drift", () => {
  const changes = [
    value => value.samples.pop(),
    value => value.samples.push(value.samples[0]),
    value => (value.samples[0].checksum = -1),
    value => (value.samples[0].iterations = 0),
    value => (value.samples[0].name = "attached-text"),
    value => (value.samples[0].position = 1),
    value => (value.samples[0].stage = "trial"),
    value => (value.samples[0].index = 1),
    value => (value.samples[0].durationMs = NaN),
    value => (value.samples[0].durationMs = Infinity),
    value => (value.samples[0].durationMs = -1),
    value => (value.samples[0].durationMs = "10"),
    value => (value.samples[0].durationMs = 3001),
    value => (value.samples[0].observerCallbacks = 1),
    value => (value.before.visibility = "hidden"),
    value => (value.after.children = 1),
    value => (value.after.webdriver = true),
    value => (value.totalMs = 799),
    value => (value.totalMs = 60001),
    value => (value.version = 2),
  ];
  for (const change of changes) {
    const value = validResult();
    change(value);
    assert.throws(() => validateDOMResult(value));
  }
});

test("DOM fixture serves only its bounded owned document and closes on abort", async () => {
  const controller = new AbortController();
  const server = await createDOMServer(controller.signal);
  try {
    const response = await fetch(server.url);
    assert.equal(response.status, 200);
    assert.match(
      response.headers.get("content-security-policy"),
      /default-src 'none'/
    );
    assert.match(await response.text(), /id="fixture"/);
    assert.equal((await fetch(server.url + "unexpected")).status, 404);
    assert.equal(
      (await fetch(server.url, { method: "POST", body: "ignored" })).status,
      405
    );
    assert.equal(server.metadata.collectorSHA256.length, 64);
    assert.equal(server.snapshot().failure, null);
    for (let index = 0; index < 13; index++) {
      assert.equal((await fetch(server.url)).status, 200);
    }
    assert.equal((await fetch(server.url)).status, 503);
    assert.equal(server.snapshot().requests.length, 16);
    assert.match(server.snapshot().failure, /cap/);
    controller.abort();
  } finally {
    await server.close();
    await server.close();
  }
  await assert.rejects(fetch(server.url));
  await assert.rejects(createDOMServer(controller.signal));
});
