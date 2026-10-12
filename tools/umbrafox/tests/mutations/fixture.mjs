/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { collectMarkerCalibration, MARKER_CASES } from "./marker-workload.mjs";
import {
  collectLayout,
  LAYOUT_PLAN,
  INTERLEAVED_LAYOUT_PLAN,
  validateLayoutResult,
} from "./layout-workload.mjs";

export { collectLayout } from "./layout-workload.mjs";

export const DOM_CASES = Object.freeze([
  "detached-text",
  "attached-text",
  "attributes",
  "child-list",
  "observer-text",
  "layout-batched",
  "layout-interleaved",
  "js",
]);

export function expectedDOMSample(caseName) {
  assert(DOM_CASES.includes(caseName), "Unknown DOM case");
  const [iterations, checksum] = {
    "detached-text": [262144, 98],
    "attached-text": [262144, 98],
    attributes: [262144, 98],
    "child-list": [262144, 0],
    "observer-text": [65536, 65536],
    "layout-batched": [2048, 163840],
    "layout-interleaved": [2048, 163840],
    js: [4194304, 3007316010],
  }[caseName];
  return { iterations, checksum, observerCallbacks: 0 };
}

// Shared unchanged collector for the legacy sandbox and page-owned fixture.
export async function collectDOM() {
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
  const cases = [
    "detached-text",
    "attached-text",
    "attributes",
    "child-list",
    "observer-text",
    "layout-batched",
    "layout-interleaved",
    "js",
  ];
  const timed = operation => {
    const start = performance.now();
    const checksum = operation();
    return { durationMs: performance.now() - start, checksum };
  };
  const textWork = node => {
    for (let index = 0; index < 262144; index++) {
      node.data = index & 1 ? "b" : "a";
    }
    return node.data.charCodeAt(0);
  };
  const attributes = node => {
    for (let index = 0; index < 262144; index++) {
      node.setAttribute("data-value", index & 1 ? "b" : "a");
    }
    return node.getAttribute("data-value").charCodeAt(0);
  };
  const children = node => {
    const child = document.createElement("span");
    for (let index = 0; index < 131072; index++) {
      node.appendChild(child);
      node.removeChild(child);
    }
    return node.childNodes.length;
  };
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
  const javascript = () => {
    let value = 42;
    for (let index = 0; index < 4194304; index++) {
      value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    }
    return value;
  };
  const run = async caseName => {
    const node = document.createElement("div");
    const text = document.createTextNode("x");
    node.appendChild(text);
    let observer;
    let observerCallbacks = 0;
    let iterations = 262144;
    let measurement;
    try {
      if (caseName !== "detached-text" && caseName !== "js") {
        root.appendChild(node);
      }
      if (caseName === "detached-text" || caseName === "attached-text") {
        measurement = timed(() => textWork(text));
      } else if (caseName === "attributes") {
        measurement = timed(() => attributes(node));
      } else if (caseName === "child-list") {
        node.replaceChildren();
        measurement = timed(() => children(node));
      } else if (caseName === "observer-text") {
        iterations = 65536;
        observer = new MutationObserver(() => observerCallbacks++);
        observer.observe(text, { characterData: true });
        measurement = timed(() => {
          let count = 0;
          for (let index = 0; index < 65536; index++) {
            text.data = index & 1 ? "b" : "a";
            if ((index & 1023) === 1023) {
              const records = observer.takeRecords();
              for (const record of records) {
                if (record.type !== "characterData" || record.target !== text) {
                  throw new Error("Unexpected mutation record");
                }
              }
              count += records.length;
            }
          }
          return count;
        });
        await Promise.resolve();
      } else if (caseName.startsWith("layout-")) {
        iterations = 2048;
        node.replaceChildren();
        const rows = Array.from({ length: 32 }, () => {
          const row = document.createElement("div");
          row.className = "row";
          node.appendChild(row);
          return row;
        });
        if (rows.some(row => row.offsetWidth !== 64)) {
          throw new Error("Invalid initial layout");
        }
        measurement = timed(() =>
          layout(rows, caseName === "layout-interleaved")
        );
        if (rows.some(row => row.offsetWidth !== 64)) {
          throw new Error("Invalid final layout");
        }
      } else if (caseName === "js") {
        iterations = 4194304;
        measurement = timed(javascript);
      } else {
        throw new Error("Unknown case");
      }
      return { ...measurement, iterations, observerCallbacks };
    } finally {
      observer?.disconnect();
      node.remove();
    }
  };
  const samples = [];
  const start = performance.now();
  for (const stage of ["warmup", "trial"]) {
    for (let index = 0; index < (stage === "warmup" ? 2 : 8); index++) {
      for (let position = 0; position < cases.length; position++) {
        if (performance.now() - start > 55000) {
          throw new Error("DOM workload deadline");
        }
        await new Promise(resolve => setTimeout(resolve, 20));
        const caseName = cases[(index + position) % cases.length];
        samples.push({
          stage,
          index,
          position,
          name: caseName,
          ...(await run(caseName)),
        });
      }
    }
  }
  return {
    version: 1,
    before,
    after: state(),
    totalMs: performance.now() - start,
    samples,
  };
}

export function validateDOMResult(value) {
  assert.equal(value?.version, 1);
  for (const state of [value.before, value.after]) {
    assert.deepEqual(state, {
      visibility: "visible",
      webdriver: false,
      children: 0,
    });
  }
  assert(Array.isArray(value.samples) && value.samples.length === 80);
  let sampleIndex = 0;
  let measuredMs = 0;
  for (const stage of ["warmup", "trial"]) {
    for (let index = 0; index < (stage === "warmup" ? 2 : 8); index++) {
      for (let position = 0; position < DOM_CASES.length; position++) {
        const caseName = DOM_CASES[(index + position) % DOM_CASES.length];
        const sample = value.samples[sampleIndex++];
        const { durationMs, ...details } = sample;
        assert.deepEqual(details, {
          stage,
          index,
          position,
          name: caseName,
          ...expectedDOMSample(caseName),
        });
        assert(
          Number.isFinite(durationMs) && durationMs >= 0 && durationMs <= 3000,
          "Invalid case duration"
        );
        measuredMs += durationMs;
      }
    }
  }
  assert(
    Number.isFinite(value.totalMs) &&
      value.totalMs >= measuredMs &&
      value.totalMs <= 60000,
    "Invalid total duration"
  );
  return value;
}

export function installDOMWindow(collector) {
  const button = document.getElementById("run");
  const output = document.getElementById("result");
  let state = "ready";
  const publish = (next, value) => {
    output.textContent = JSON.stringify(value);
    output.setAttribute("data-state", next);
    state = next;
    output.dispatchEvent(new Event("change"));
  };
  const fail = error => {
    if (state === "failed" || state === "complete") {
      return;
    }
    publish("failed", {
      error: String(error?.message ?? error).slice(0, 4096),
    });
  };
  const unload = () => fail(new Error("Fixture unloaded"));
  window.addEventListener("pagehide", unload, { once: true });
  output.setAttribute("data-state", state);
  button.addEventListener("click", async () => {
    if (state !== "ready") {
      fail(new Error("Duplicate workload start"));
      return;
    }
    state = "running";
    output.setAttribute("data-state", state);
    try {
      const realm = {
        globalIsWindow: globalThis === window,
        objectPrototypeMatches:
          Object.getPrototypeOf({}) === window.Object.prototype,
        functionPrototypeMatches:
          Object.getPrototypeOf(function () {}) === window.Function.prototype,
        collectorPrototypeMatches:
          Object.getPrototypeOf(collector) ===
          Object.getPrototypeOf(async function () {}),
      };
      if (!Object.values(realm).every(value => value === true)) {
        throw new Error("Collector realm mismatch");
      }
      const measurement = await collector();
      if (state !== "running") {
        return;
      }
      const result = { version: 2, realm, measurement };
      if (JSON.stringify(result).length > 262144) {
        throw new Error("Fixture result too large");
      }
      publish("complete", result);
    } catch (error) {
      fail(error);
    } finally {
      window.removeEventListener("pagehide", unload);
    }
  });
}

export async function requestDOMWindow() {
  const button = document.getElementById("run");
  const output = document.getElementById("result");
  if (!button || !output) {
    throw new Error("Fixture bridge missing");
  }
  if (output.getAttribute("data-state") !== "ready") {
    throw new Error("Fixture already started or not ready");
  }
  let timer;
  let receive;
  let unload;
  try {
    return await new Promise((resolve, reject) => {
      receive = () => {
        try {
          const state = output.getAttribute("data-state");
          if (!["complete", "failed"].includes(state)) {
            throw new Error("Invalid fixture result state");
          }
          const text = output.textContent;
          if (text.length > 262144) {
            throw new Error("Fixture result too large");
          }
          const value = JSON.parse(text);
          if (state === "failed") {
            throw new Error(String(value.error).slice(0, 4096));
          }
          resolve(value);
        } catch (error) {
          reject(error);
        }
      };
      unload = () => reject(new Error("Fixture unloaded"));
      output.addEventListener("change", receive);
      window.addEventListener("pagehide", unload, { once: true });
      timer = setTimeout(() => reject(new Error("Fixture timed out")), 58000);
      button.click();
    });
  } finally {
    clearTimeout(timer);
    output.removeEventListener("change", receive);
    window.removeEventListener("pagehide", unload);
  }
}

export function validateDOMWindowResult(value, workload = "mixed") {
  assert(
    ["mixed", "layout", "layout-interleaved"].includes(workload),
    "Invalid workload"
  );
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
  if (workload === "mixed") {
    return validateDOMResult(value.measurement);
  }
  return validateLayoutResult(
    value.measurement,
    workload === "layout" ? LAYOUT_PLAN.name : INTERLEAVED_LAYOUT_PLAN.name
  );
}

export async function createDOMServer(
  signal,
  execution = "sandbox",
  workload = "mixed"
) {
  assert(["sandbox", "window"].includes(execution), "Invalid execution realm");
  assert(
    [
      "mixed",
      "layout",
      "layout-interleaved",
      "mixed-profile",
      "marker-calibration",
    ].includes(workload),
    "Invalid workload"
  );
  assert(
    workload === "mixed" || execution === "window",
    "Selected workload requires window realm"
  );
  signal.throwIfAborted();
  const collector = {
    layout: collectLayout,
    "layout-interleaved": collectLayout,
    mixed: collectDOM,
    "mixed-profile": collectDOM,
    "marker-calibration": collectMarkerCalibration,
  }[workload];
  let collectorSource = collector.toString();
  if (workload === "mixed-profile") {
    collectorSource = (
      await import("./profile-workload.mjs")
    ).createProfileCollectorSource();
  } else if (workload === "layout-interleaved") {
    collectorSource = `async function collectInterleavedLayout() { return (${collectorSource})(true); }`;
  }
  const layoutPlan = {
    layout: LAYOUT_PLAN,
    "layout-interleaved": INTERLEAVED_LAYOUT_PLAN,
  }[workload];
  signal.throwIfAborted();
  const script =
    execution === "window"
      ? Buffer.from(`(${installDOMWindow.toString()})(${collectorSource});\n`)
      : null;
  const bridge = script
    ? '<button id="run" type="button" hidden>Run</button><output id="result" hidden></output><script defer src="/workload.js"></script>'
    : "";
  const page = Buffer.from(
    `<!doctype html><html lang="en"><meta charset="utf-8"><title>Owned DOM fixture</title><link rel="icon" href="data:,"><style>.row { width: 64px; height: 2px; padding: 0; border: 0; } .wide { width: 96px; }</style><main id="fixture"></main>${bridge}</html>`
  );
  const requests = [];
  let failure = null;
  let bytes = 0;
  let closing;
  const server = createServer({ maxHeaderSize: 8192 }, (request, response) => {
    request.on("error", () => {});
    response.on("error", () => {});
    if (requests.length >= 16 || signal.aborted || failure) {
      failure ??= "Fixture request cap or abort";
      response.writeHead(503, { Connection: "close" }).end();
      return;
    }
    const route = ["/", ...(script ? ["/workload.js"] : [])].includes(
      request.url
    )
      ? request.url
      : "other";
    const method = request.method === "GET" ? "GET" : "other";
    const record = { route, method, status: 200, bytes: 0 };
    requests.push(record);
    if (method !== "GET") {
      record.status = 405;
    } else if (route === "other") {
      record.status = 404;
    }
    const asset = route === "/workload.js" ? script : page;
    const body = record.status === 200 ? asset : Buffer.alloc(0);
    record.bytes = body.length;
    bytes += body.length;
    response
      .writeHead(record.status, {
        "Content-Type":
          route === "/workload.js"
            ? "text/javascript; charset=utf-8"
            : "text/html; charset=utf-8",
        "Content-Length": body.length,
        "Cache-Control": "no-store",
        "Content-Security-Policy": `default-src 'none'; ${script ? "script-src 'self'; " : ""}style-src 'unsafe-inline'; img-src data:; frame-ancestors 'none'`,
        Connection: "close",
      })
      .end(body);
  });
  server.maxConnections = 8;
  server.requestTimeout = 3000;
  server.headersTimeout = 3000;
  server.setTimeout(3000, socket => socket.destroy());
  const closeFixture = () => {
    closing ??= new Promise((resolve, reject) => {
      server.closeAllConnections();
      server.close(error =>
        error && error.code !== "ERR_SERVER_NOT_RUNNING"
          ? reject(error)
          : resolve()
      );
    });
    closing.catch(() => {});
    return closing;
  };
  const onAbort = () => {
    closeFixture();
  };
  signal.addEventListener("abort", onAbort, { once: true });
  server.once("close", () => signal.removeEventListener("abort", onAbort));
  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen({ host: "127.0.0.1", port: 0, signal }, resolve);
    });
    signal.throwIfAborted();
  } catch (error) {
    await closeFixture();
    throw error;
  }
  const url = `http://127.0.0.1:${server.address().port}/`;
  return {
    url,
    metadata: {
      url,
      ...(script
        ? {
            version: {
              mixed: 2,
              layout: 3,
              "layout-interleaved": 6,
              "mixed-profile": 4,
              "marker-calibration": 5,
            }[workload],
            execution,
            scriptSHA256: createHash("sha256").update(script).digest("hex"),
          }
        : {}),
      pageSHA256: createHash("sha256").update(page).digest("hex"),
      collectorSHA256: createHash("sha256")
        .update(collectorSource)
        .digest("hex"),
      ...(workload === "mixed-profile"
        ? {
            workload,
            baseCollectorSHA256: createHash("sha256")
              .update(collectDOM.toString())
              .digest("hex"),
            phaseScope:
              "Complete case including setup and cleanup; not just the timed inner operation.",
          }
        : {}),
      ...(layoutPlan
        ? {
            workload: layoutPlan.name,
            cases: [layoutPlan.name],
            warmups: layoutPlan.warmups,
            trials: layoutPlan.trials,
          }
        : { cases: DOM_CASES, warmups: 2, trials: 8 }),
      ...(workload === "marker-calibration"
        ? {
            workload,
            cases: MARKER_CASES,
            warmups: 0,
            trials: 1,
            phaseScope:
              "Loop only; marker production calibration, not throughput.",
          }
        : {}),
      requestCap: 16,
      responseByteCap: 16 * Math.max(page.length, script?.length ?? 0),
    },
    snapshot: () => ({
      requests: requests.map(item => ({ ...item })),
      bytes,
      failure,
    }),
    close: closeFixture,
  };
}
