/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { request } from "node:http";
import { runInNewContext } from "node:vm";
import test from "node:test";
import {
  createUserlandCacheServer,
  validateUserlandCacheResult,
} from "../userland-cache.mjs";

const config = { trials: 2, warmup: 1, "userland-case": "unrelated" };

async function fixture(t, options = config) {
  const controller = new AbortController();
  const server = await createUserlandCacheServer(options, controller.signal);
  t.after(() => server.close());
  return { server, controller };
}

function sample(server, round) {
  return {
    round,
    checksum: 8386560,
    webdriver: false,
    readyState: "complete",
    documentDurationMs: 2,
    resource: {
      name: server.metadata.targetURL,
      duration: 1,
      transferSize: 0,
      encodedBodySize: server.metadata.sourceBytes,
      decodedBodySize: server.metadata.sourceBytes,
    },
  };
}

function post(server, path, value) {
  return fetch(new URL(path, server.url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
}

test("stable cacheable classic source has independent exact oracle", async t => {
  const { server } = await fixture(t);
  const response = await fetch(server.metadata.targetURL);
  const source = await response.text();
  assert.match(response.headers.get("cache-control"), /max-age=3600/);
  assert.equal(
    createHash("sha256").update(source).digest("hex"),
    server.metadata.sourceSHA256
  );
  assert.ok(server.metadata.sourceBytes > 100000);
  const fixtureDocument = { documentElement: { dataset: {} } };
  runInNewContext(source, { document: fixtureDocument }, { timeout: 1000 });
  assert.equal(
    fixtureDocument.documentElement.dataset.fixtureChecksum,
    "8386560"
  );
  assert.equal(await (await fetch(server.metadata.targetURL)).text(), source);
});

test("records differ only by requested activation history", async t => {
  for (const state of ["none", "disabled", "unrelated", "visited"]) {
    const { server } = await fixture(t, { ...config, "userland-case": state });
    assert.equal(server.scriptStore.version, 1);
    assert.equal(server.scriptStore.scripts.length, state === "none" ? 0 : 1);
    if (state !== "none") {
      const record = server.scriptStore.scripts[0];
      assert.equal(record.scope.origin, server.metadata.originA);
      assert.deepEqual(record.scope.targetKinds, ["document"]);
      assert.equal(record.enabled, state !== "disabled");
    }
    assert.equal(
      new URL(server.url).origin,
      state === "visited" ? server.metadata.originA : server.metadata.originB
    );
  }
});

test("visited sentinel is awaited before page-realm readiness and navigation", async t => {
  const { server } = await fixture(t, {
    ...config,
    "userland-case": "visited",
  });
  const source = await (await fetch(new URL("start.js", server.url))).text();
  const attributes = new Map();
  const element = {
    getAttribute: key => attributes.get(key) ?? null,
    setAttribute: (key, value) => attributes.set(key, value),
  };
  const calls = [];
  const context = {
    document: { documentElement: element },
    fetch: async (url, init) => {
      calls.push({ url, init });
      return { ok: true, json: async () => ({ next: "next-owned-page" }) };
    },
    location: { replace: next => calls.push({ next }) },
  };
  await assert.rejects(
    runInNewContext(source, context, { timeout: 1000 }),
    /sentinel/i
  );
  assert.equal(calls.length, 0);
  const pending = runInNewContext(
    `(async () => { ${server.scriptStore.scripts[0].code} })()`,
    { window: { document: context.document } },
    { timeout: 1000 }
  );
  assert.equal(attributes.size, 0);
  await pending;
  assert.equal(attributes.size, 1);
  await runInNewContext(source, context, { timeout: 1000 });
  assert.equal(calls.length, 3);
  assert.equal(calls[0].url, "./script-ready");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].init.body), { ready: true });
  assert.equal(calls[1].url, "./gate");
  assert.equal(calls[2].next, "next-owned-page");
  for (const rejects of [false, true]) {
    calls.length = 0;
    await assert.rejects(
      runInNewContext(
        source,
        {
          ...context,
          fetch: async url => {
            calls.push({ url });
            if (rejects) {
              throw new Error("Fixture connection failed");
            }
            return { ok: false };
          },
        },
        { timeout: 1000 }
      ),
      /connection failed|readiness rejected/
    );
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "./script-ready");
  }
  calls.length = 0;
  for (const key of attributes.keys()) {
    attributes.set(key, "another-run");
  }
  await assert.rejects(
    runInNewContext(source, context, { timeout: 1000 }),
    /sentinel/i
  );
  assert.equal(calls.length, 0);
});

test("gate and ordered samples retain raw request evidence", async t => {
  const { server } = await fixture(t);
  await fetch(server.url);
  const pending = fetch(new URL("gate", server.url));
  server.start();
  assert.equal((await pending).status, 200);
  for (let round = 0; round < 3; round++) {
    await fetch(new URL(`document?round=${round}`, server.url));
    if (round === 0) {
      await fetch(server.metadata.targetURL);
    }
    assert.equal(
      (await post(server, "sample", sample(server, round))).status,
      200
    );
  }
  const result = await server.result;
  validateUserlandCacheResult(result, config);
  assert.equal(result.samples.length, 3);
  assert.equal(result.scriptReady, false);
  assert.ok(result.requests.length >= 4);
  assert.equal((await post(server, "sample", sample(server, 2))).status, 409);
  for (const change of [
    value => {
      value.samples[1].round = 0;
    },
    value => {
      value.samples[0].checksum++;
    },
    value => {
      value.samples[0].webdriver = true;
    },
    value => {
      value.samples[0].resource = null;
    },
    value => {
      value.samples[0].resource.duration = -1;
    },
    value => {
      value.samples[0].resource.name += "?different";
    },
    value => {
      value.samples.pop();
    },
    value => {
      value.scriptReady = true;
    },
    value => {
      value.metadata.sourceSHA256 = "invalid";
    },
    value => {
      value.requests = [];
    },
    value => {
      value.requests.push({ label: "A", path: "", method: "GET", round: null });
    },
  ]) {
    const changed = structuredClone(result);
    change(changed);
    assert.throws(() => validateUserlandCacheResult(changed, config));
  }
});

test("wrong host, origin, route, method and body fail closed", async t => {
  const { server } = await fixture(t);
  const forgedHost = await new Promise((resolve, reject) => {
    const req = request(
      server.url,
      { headers: { Host: "unrelated.invalid" } },
      res => {
        res.resume();
        resolve(res.statusCode);
      }
    );
    req.on("error", reject);
    req.end();
  });
  assert.equal(forgedHost, 403);
  assert.equal(
    (
      await fetch(server.url, {
        headers: { Origin: "https://unrelated.invalid" },
      })
    ).status,
    403
  );
  assert.equal((await fetch(new URL("/missing", server.url))).status, 404);
  assert.equal((await post(server, "sample", sample(server, 0))).status, 409);
  server.start();
  assert.equal((await fetch(new URL("sample", server.url))).status, 404);
  assert.equal(
    (await fetch(new URL("sample", server.url), { method: "POST", body: "no" }))
      .status,
    415
  );
  assert.equal(
    (
      await fetch(new URL("sample", server.url), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      })
    ).status,
    400
  );
  assert.equal(
    (await post(server, "sample", { pad: "x".repeat(17000) })).status,
    413
  );
  assert.equal((await post(server, "sample", sample(server, 1))).status, 409);
});

test("visited history requires exactly one matching script readiness", async t => {
  const { server } = await fixture(t, {
    ...config,
    "userland-case": "visited",
  });
  server.start();
  assert.equal((await fetch(new URL("gate", server.url))).status, 409);
  assert.equal(
    (await post(server, "script-ready", { ready: true })).status,
    200
  );
  assert.equal(
    (await post(server, "script-ready", { ready: true })).status,
    409
  );
  assert.equal((await fetch(new URL("gate", server.url))).status, 200);
});

test("visited result requires script completion before B and sequential documents", async t => {
  const options = { ...config, "userland-case": "visited" };
  const { server } = await fixture(t, options);
  const onB = {
    ...server,
    url: server.metadata.originB + new URL(server.url).pathname,
  };
  await fetch(server.url);
  server.start();
  await post(server, "script-ready", { ready: true });
  await fetch(new URL("gate", server.url));
  await fetch(onB.url);
  await fetch(new URL("gate", onB.url));
  for (let round = 0; round < 3; round++) {
    await fetch(new URL(`document?round=${round}`, onB.url));
    if (round === 0) {
      await fetch(server.metadata.targetURL);
    }
    await post(onB, "sample", sample(server, round));
  }
  const result = await server.result;
  validateUserlandCacheResult(result, options);
  for (const change of [
    value => {
      value.requests = value.requests.filter(
        entry => !(entry.label === "A" && entry.path === "gate")
      );
    },
    value => {
      const readyIndex = value.requests.findIndex(
        entry => entry.path === "script-ready"
      );
      value.requests.push(value.requests.splice(readyIndex, 1)[0]);
    },
    value => {
      const sampleIndex = value.requests.findIndex(
        entry => entry.path === "sample"
      );
      const docIndex = value.requests.findIndex(
        entry => entry.path === "document"
      );
      [value.requests[sampleIndex], value.requests[docIndex]] = [
        value.requests[docIndex],
        value.requests[sampleIndex],
      ];
    },
  ]) {
    const changed = structuredClone(result);
    change(changed);
    assert.throws(() => validateUserlandCacheResult(changed, options));
  }
});

test("abort cancels pending gate/result and close is repeatable", async t => {
  const { server, controller } = await fixture(t);
  const result = assert.rejects(server.result, /aborted|stop/i);
  controller.abort(new Error("stop"));
  await result;
  await server.close();
  await server.close();
});

test("bad configuration rejected before listening", async () => {
  for (const options of [
    { ...config, trials: 0 },
    { ...config, warmup: -1 },
    { ...config, trials: 10000 },
    { ...config, "userland-case": "unknown" },
  ]) {
    await assert.rejects(
      createUserlandCacheServer(options, new AbortController().signal)
    );
  }
});

test("failure snapshot retains bounded rejected request metadata without body", async t => {
  const { server } = await fixture(t);
  const response = await fetch(new URL("script-ready", server.url), {
    method: "OPTIONS",
    headers: { Origin: "null", "Access-Control-Request-Method": "POST" },
  });
  assert.equal(response.status, 403);
  const state = server.snapshot();
  assert.equal(state.started, false);
  assert.equal(state.scriptReady, false);
  assert.equal(state.requests.length, 1);
  assert.deepEqual(state.requests[0], {
    label: "B",
    path: "script-ready",
    method: "OPTIONS",
    round: null,
    hostMatches: true,
    originKind: "opaque",
    jsonContentType: false,
    status: 403,
  });
  state.requests.length = 0;
  assert.equal(server.snapshot().requests.length, 1);
});
