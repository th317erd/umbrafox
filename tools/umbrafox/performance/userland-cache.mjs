/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Buffer } from "node:buffer";
import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";

const cases = new Set(["none", "disabled", "unrelated", "visited"]);
const expectedChecksum = 8386560;
const targetSource =
  Array.from(
    { length: 4096 },
    (_, index) => `function fixtureFunction${index}() { return ${index}; }`
  ).join("\n") +
  "\nlet fixtureSum = 0;\n" +
  Array.from(
    { length: 4096 },
    (_, index) => `fixtureSum += fixtureFunction${index}();`
  ).join("\n") +
  "\ndocument.documentElement.dataset.fixtureChecksum = String(fixtureSum);\n";
const sourceSHA256 = createHash("sha256").update(targetSource).digest("hex");
const sourceBytes = Buffer.byteLength(targetSource);

const startSource = `fetch("./gate").then(response => {
  if (!response.ok) { throw new Error("Fixture gate failed"); }
  return response.json();
}).then(value => location.replace(value.next));\n`;

function matchingStartSource(prefix) {
  return `(async () => {
  if (document.documentElement.getAttribute("data-cache-control") !== ${JSON.stringify(prefix)}) {
    throw new Error("Fixture userland completion sentinel missing");
  }
  const ready = await fetch("./script-ready", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ready: true })
  });
  if (!ready.ok) { throw new Error("Fixture readiness rejected"); }
  return ${startSource}
})();\n`;
}

const completeSource = `addEventListener("load", async () => {
  const resource = performance.getEntriesByName(new URL("target.js", location.href).href)[0];
  const sample = {
    round: Number(new URL(location.href).searchParams.get("round")),
    checksum: Number(document.documentElement.dataset.fixtureChecksum),
    webdriver: navigator.webdriver,
    readyState: document.readyState,
    documentDurationMs: performance.now(),
    resource: resource ? {
      name: resource.name, duration: resource.duration,
      transferSize: resource.transferSize, encodedBodySize: resource.encodedBodySize,
      decodedBodySize: resource.decodedBodySize
    } : null
  };
  const response = await fetch("./sample", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sample)
  });
  if (!response.ok) { throw new Error("Fixture sample rejected"); }
  const value = await response.json();
  if (value.next) { location.replace(value.next); }
}, { once: true });\n`;

function validateConfig(options) {
  if (
    !cases.has(options["userland-case"]) ||
    !Number.isInteger(options.trials) ||
    options.trials < 1 ||
    options.trials > 30 ||
    !Number.isInteger(options.warmup) ||
    options.warmup < 0 ||
    options.warmup > 10
  ) {
    throw new Error("Invalid userland-cache configuration");
  }
}

function validateSample(value, round, metadata) {
  if (
    !value ||
    value.round !== round ||
    value.checksum !== expectedChecksum ||
    value.webdriver !== false ||
    value.readyState !== "complete" ||
    !Number.isFinite(value.documentDurationMs) ||
    value.documentDurationMs < 0 ||
    value.documentDurationMs > 180000 ||
    !value.resource ||
    value.resource.name !== metadata.targetURL
  ) {
    throw new Error("Invalid userland-cache sample or execution oracle");
  }
  for (const field of [
    "duration",
    "transferSize",
    "encodedBodySize",
    "decodedBodySize",
  ]) {
    if (!Number.isFinite(value.resource[field]) || value.resource[field] < 0) {
      throw new Error("Invalid resource timing value");
    }
  }
}

function validateHistory(value) {
  const documents = value.requests.filter(
    entry =>
      entry.label === "B" && entry.path === "document" && entry.method === "GET"
  );
  const scriptRequests = value.requests.filter(
    entry =>
      entry.label === "B" &&
      entry.path === "target.js" &&
      entry.method === "GET"
  );
  const posts = value.requests.filter(
    entry =>
      entry.label === "B" && entry.path === "sample" && entry.method === "POST"
  );
  const visits = value.requests.filter(entry => entry.label === "A");
  if (
    documents.length !== value.samples.length ||
    scriptRequests.length < 1 ||
    posts.length !== value.samples.length ||
    documents.some((entry, index) => entry.round !== String(index))
  ) {
    throw new Error("Missing or inconsistent document request history");
  }
  if (value.state === "visited") {
    if (
      !visits.some(entry => entry.path === "" && entry.method === "GET") ||
      visits.filter(
        entry => entry.path === "script-ready" && entry.method === "POST"
      ).length !== 1
    ) {
      throw new Error("Missing matching-origin execution history");
    }
  } else if (visits.length) {
    throw new Error("Unexpected matching-origin visit");
  }
  const milestones = value.requests
    .filter(
      entry =>
        (entry.method === "GET" &&
          ["", "gate", "document"].includes(entry.path)) ||
        (entry.method === "POST" &&
          ["script-ready", "sample"].includes(entry.path))
    )
    .map(entry => `${entry.label}:${entry.path}:${entry.method}`);
  const expected =
    value.state === "visited"
      ? ["A::GET", "A:script-ready:POST", "A:gate:GET", "B::GET", "B:gate:GET"]
      : ["B::GET", "B:gate:GET"];
  for (let round = 0; round < value.samples.length; round++) {
    expected.push("B:document:GET", "B:sample:POST");
  }
  if (
    milestones.length !== expected.length ||
    milestones.some((entry, index) => entry !== expected[index])
  ) {
    throw new Error("Document readiness and sample history are out of order");
  }
}

export function validateUserlandCacheResult(value, options) {
  validateConfig(options);
  if (
    value?.version !== 1 ||
    value.state !== options["userland-case"] ||
    !Array.isArray(value.samples) ||
    value.samples.length !== options.trials + options.warmup ||
    value.scriptReady !== (value.state === "visited") ||
    value.metadata?.sourceSHA256 !== sourceSHA256 ||
    value.metadata.sourceBytes !== sourceBytes ||
    !Array.isArray(value.requests) ||
    value.requests.length > 256
  ) {
    throw new Error("Incomplete or inconsistent userland-cache result");
  }
  const originA = new URL(value.metadata.originA);
  const originB = new URL(value.metadata.originB);
  if (
    originA.origin === originB.origin ||
    [originA, originB].some(
      url => url.protocol !== "http:" || url.hostname !== "127.0.0.1"
    ) ||
    new URL(value.metadata.targetURL).origin !== originB.origin
  ) {
    throw new Error("Invalid fixture origin identity");
  }
  value.samples.forEach((sample, round) =>
    validateSample(sample, round, value.metadata)
  );
  validateHistory(value);
}

function html(scripts) {
  return (
    '<!doctype html><html lang="en"><meta charset="utf-8"><title>Local cache fixture</title>' +
    scripts.map(path => `<script src="${path}"></script>`).join("") +
    "<body><p>Local cache fixture</p></body></html>"
  );
}

function end(response, code, body, type = "text/plain", cacheable = false) {
  response.writeHead(code, {
    "Content-Type": type,
    "Cache-Control": cacheable ? "public, max-age=3600" : "no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'self'; frame-ancestors 'none'",
  });
  response.end(body);
}

async function readBody(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 16384) {
      return { code: 413 };
    }
    chunks.push(chunk);
  }
  try {
    return { value: JSON.parse(Buffer.concat(chunks).toString("utf8")) };
  } catch {
    return { code: 400 };
  }
}

function scriptStore(state, originA, prefix) {
  const code = `await Promise.resolve();
window.document.documentElement.setAttribute("data-cache-control", ${JSON.stringify(prefix)});`;
  return {
    version: 1,
    scripts:
      state === "none"
        ? []
        : [
            {
              id: "local-cache-control",
              name: "Owned cache control",
              enabled: state !== "disabled",
              scope: {
                origin: originA,
                targetKinds: ["document"],
                sourceUrlPattern: null,
              },
              world: "default",
              code,
              createdAt: 1,
              updatedAt: 1,
            },
          ],
  };
}

export async function createUserlandCacheServer(options, signal) {
  validateConfig(options);
  signal.throwIfAborted();
  const state = options["userland-case"];
  const prefix = `/${randomBytes(18).toString("hex")}/`;
  const servers = [];
  const samples = [];
  const requests = [];
  const gates = new Set();
  const origins = {};
  let metadata;
  let started = false;
  let scriptReady = false;
  let settled = false;
  let closing;
  const {
    promise: result,
    resolve: resolveResult,
    reject: rejectResult,
  } = Promise.withResolvers();
  result.catch(() => {});
  const fail = error => {
    if (!settled) {
      settled = true;
      rejectResult(error);
    }
  };
  const abort = () => fail(signal.reason ?? new Error("Fixture aborted"));
  signal.addEventListener("abort", abort, { once: true });

  async function closeFixture() {
    if (!closing) {
      closing = (async () => {
        signal.removeEventListener("abort", abort);
        fail(new Error("Fixture closed before completion"));
        for (const gate of gates) {
          end(gate.response, 503, "Fixture closed");
        }
        gates.clear();
        for (const server of servers) {
          server.closeAllConnections();
          if (server.listening) {
            await new Promise((resolve, reject) =>
              server.close(error => (error ? reject(error) : resolve()))
            );
          }
        }
      })();
    }
    return closing;
  }

  function releaseGate(label, response) {
    if (label === "A" && !scriptReady) {
      end(response, 409, "Matching userland script did not complete");
      return;
    }
    const next = origins.B + prefix + (label === "A" ? "" : "document?round=0");
    end(response, 200, JSON.stringify({ next }), "application/json");
  }

  async function handlePost(label, path, request, response) {
    if (request.headers["content-type"] !== "application/json") {
      end(response, 415, "Expected JSON");
      return;
    }
    const body = await readBody(request);
    if (body.code) {
      end(response, body.code, "Invalid body");
      return;
    }
    if (path === "script-ready") {
      if (
        label !== "A" ||
        state !== "visited" ||
        scriptReady ||
        body.value?.ready !== true
      ) {
        end(response, 409, "Unexpected script readiness");
        return;
      }
      scriptReady = true;
      end(response, 200, "Ready");
      return;
    }
    if (
      label !== "B" ||
      !started ||
      settled ||
      body.value?.round !== samples.length
    ) {
      end(response, 409, "Unexpected sample order");
      return;
    }
    try {
      validateSample(body.value, samples.length, metadata);
    } catch (error) {
      end(response, 400, "Sample oracle failed");
      fail(error);
      return;
    }
    samples.push(body.value);
    const done = samples.length === options.warmup + options.trials;
    const next = done
      ? null
      : `${origins.B}${prefix}document?round=${samples.length}`;
    end(response, 200, JSON.stringify({ next }), "application/json");
    if (done) {
      settled = true;
      resolveResult(
        structuredClone({
          version: 1,
          state,
          metadata,
          scriptReady,
          samples,
          requests,
        })
      );
    }
  }

  async function handle(label, request, response) {
    const serverOrigin = origins[label];
    const url = new URL(request.url, serverOrigin);
    if (!url.pathname.startsWith(prefix)) {
      end(response, 404, "Not found");
      return;
    }
    if (requests.length >= 256) {
      end(response, 429, "Fixture request cap");
      fail(new Error("Fixture request cap exceeded"));
      return;
    }
    const path = url.pathname.slice(prefix.length);
    let originKind = "absent";
    if (request.headers.origin) {
      originKind = request.headers.origin === serverOrigin ? "same" : "other";
      if (request.headers.origin === "null") {
        originKind = "opaque";
      }
    }
    const entry = {
      label,
      path,
      method: request.method,
      round: url.searchParams.get("round"),
      hostMatches: request.headers.host === new URL(serverOrigin).host,
      originKind,
      jsonContentType: request.headers["content-type"] === "application/json",
      status: null,
    };
    requests.push(entry);
    response.once("finish", () => {
      entry.status = response.statusCode;
    });
    if (
      !entry.hostMatches ||
      !["same", "absent"].includes(originKind) ||
      url.origin !== serverOrigin
    ) {
      end(response, 403, "Forbidden");
      return;
    }
    if (
      request.method === "POST" &&
      ["sample", "script-ready"].includes(path)
    ) {
      await handlePost(label, path, request, response);
      return;
    }
    if (request.method !== "GET") {
      end(response, 404, "Not found");
      return;
    }
    if (path === "gate") {
      if (started) {
        releaseGate(label, response);
      } else {
        const gate = { label, response };
        gates.add(gate);
        response.once("close", () => gates.delete(gate));
      }
      return;
    }
    if (path === "") {
      end(response, 200, html(["start.js"]), "text/html");
    } else if (path === "document" && label === "B" && started) {
      end(response, 200, html(["target.js", "complete.js"]), "text/html");
    } else if (path === "start.js") {
      end(
        response,
        200,
        label === "A" ? matchingStartSource(prefix) : startSource,
        "text/javascript"
      );
    } else if (path === "complete.js" && label === "B") {
      end(response, 200, completeSource, "text/javascript");
    } else if (path === "target.js" && label === "B") {
      end(response, 200, targetSource, "text/javascript", true);
    } else {
      end(response, 404, "Not found");
    }
  }

  try {
    for (const label of ["A", "B"]) {
      const server = createServer((request, response) => {
        handle(label, request, response).catch(error => {
          fail(error);
          if (!response.headersSent) {
            end(response, 500, "Fixture failed");
          } else {
            response.destroy();
          }
        });
      });
      servers.push(server);
      server.requestTimeout = 5000;
      server.headersTimeout = 5000;
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
      });
      server.on("error", fail);
      signal.throwIfAborted();
      origins[label] = `http://127.0.0.1:${server.address().port}`;
    }
    metadata = {
      originA: origins.A,
      originB: origins.B,
      sourceSHA256,
      sourceBytes,
      targetURL: origins.B + prefix + "target.js",
    };
    return {
      url: origins[state === "visited" ? "A" : "B"] + prefix,
      metadata,
      scriptStore: scriptStore(state, origins.A, prefix),
      result,
      snapshot() {
        return structuredClone({
          version: 1,
          state,
          metadata,
          started,
          settled,
          scriptReady,
          samples,
          requests,
          pendingGates: gates.size,
        });
      },
      start() {
        if (started || settled) {
          throw new Error("Fixture cannot start twice or after termination");
        }
        started = true;
        for (const gate of gates) {
          releaseGate(gate.label, gate.response);
        }
        gates.clear();
      },
      close: closeFixture,
    };
  } catch (error) {
    await closeFixture();
    throw error;
  }
}
