/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { request, Server } from "node:http";
import { setTimeout as delay } from "node:timers/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";
import * as lifecycle from "../lifecycle.mjs";

const { createLifecycleServer, validateLifecycleResult } = lifecycle;

const bounded = { timeout: 10000 };
const options = { "lifecycle-case": "none", profile: "off" };
const soakOptions = { ...options, "lifecycle-plan": "soak-30m" };
const pageSHA256 =
  "36685dc4a723f6fc680cba508615d3ca811cb50c7d7cc82649a50e4d3f4ee71a";

test(
  "close initiates both servers before a held callback and retains failures",
  bounded,
  async t => {
    const nativeClose = Server.prototype.close;
    const nativeCloseConnections = Server.prototype.closeAllConnections;
    for (const closeError of [
      null,
      new Error("Injected first close failure"),
    ]) {
      const server = await createLifecycleServer(
        options,
        new AbortController().signal
      );
      const closingServers = [];
      const disconnected = [];
      const firstClosed = Promise.withResolvers();
      let releaseFirst;
      t.mock.method(Server.prototype, "closeAllConnections", function () {
        disconnected.push(this);
        return nativeCloseConnections.call(this);
      });
      t.mock.method(Server.prototype, "close", function (callback) {
        closingServers.push(this);
        const first = closingServers.length === 1;
        return nativeClose.call(this, error => {
          if (first) {
            releaseFirst = () => callback(closeError ?? error);
            firstClosed.resolve();
          } else {
            callback(error);
          }
        });
      });
      const pending = server.close();
      pending.catch(() => {});
      const repeated = server.close();
      repeated.catch(() => {});
      try {
        await firstClosed.promise;
        assert.equal(
          closingServers.length,
          2,
          "second close must not wait for the first callback"
        );
        assert.deepEqual(disconnected, closingServers);
        assert.equal(
          closingServers.every(item => !item.listening),
          true
        );
      } finally {
        releaseFirst();
        if (closeError) {
          await assert.rejects(pending, error => error === closeError);
          await assert.rejects(repeated, error => error === closeError);
          await assert.rejects(server.close(), error => error === closeError);
        } else {
          await pending;
          await repeated;
          await server.close();
        }
        assert.equal(closingServers.length, 2);
      }
    }
  }
);

async function fixture(t, state = "none", plan = "smoke") {
  const controller = new AbortController();
  const server = await createLifecycleServer(
    { ...options, "lifecycle-case": state, "lifecycle-plan": plan },
    controller.signal
  );
  t.after(() => server.close());
  return { server, controller };
}

function loaded(server, id) {
  const active = server.snapshot().state === "matching-no-handler";
  return {
    kind: "loaded",
    id,
    readyState: "complete",
    webdriver: false,
    firstStartupCount: active ? 1 : null,
    startupCount: active ? 1 : null,
    firstSentinel: active ? server.metadata.sentinel : null,
    sentinel: active ? server.metadata.sentinel : null,
    domChecksum: 8128,
    byteChecksum: 2752512,
    nodesCreated: 128,
    nodesRemoved: 128,
    frames: 0,
  };
}

function post(server, value, init = {}) {
  return fetch(new URL("receipt", server.url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
    ...init,
  });
}

async function drive(server, advance, { assets = false, onCheckpoint } = {}) {
  const soak = server.metadata.plan === "soak-30m";
  const checkpointCount = soak ? 11 : 3;
  server.start();
  for (const step of server.metadata.steps) {
    if (step.kind === "document") {
      const response = await fetch(
        new URL(`document?id=${step.id}`, server.url)
      );
      assert.equal(response.status, 200);
      await response.text();
      if (assets) {
        const asset = await fetch(new URL("fixture.js", server.url));
        assert.equal(asset.status, 200);
        assert.equal(
          createHash("sha256")
            .update(await asset.text())
            .digest("hex"),
          pageSHA256
        );
      }
      continue;
    }
    let value = { ...step, frames: 0, frameLoads: 1 };
    if (step.kind === "loaded") {
      value = loaded(server, step.id);
    } else if (step.kind === "cycle") {
      value = {
        ...step,
        frames: 0,
        framesCreated: 2,
        framesLoaded: 2,
        framesRemoved: 2,
      };
    }
    const pending = post(server, value);
    pending.catch(() => {});
    const plannedDocument = server.metadata.documents[step.id];
    if (step.kind === "loaded" && plannedDocument.role === "settled") {
      const checkpoint = await server.nextCheckpoint();
      assert.equal(checkpoint.id, plannedDocument.checkpoint);
      const expectedQuiet = soak
        ? [60000, ...Array(9).fill(120000), 300000][checkpoint.id]
        : 10000;
      assert.equal(checkpoint.settleMs, expectedQuiet);
      assert.equal(
        checkpoint.completedCycles,
        soak ? 2 + 10 * checkpoint.id : [2, 7, 12][checkpoint.id]
      );
      assert.equal(
        checkpoint.documentsCompleted,
        soak ? 8 + 31 * checkpoint.id : [8, 24, 40][checkpoint.id]
      );
      if ((await onCheckpoint?.(checkpoint)) === false) {
        await pending.catch(() => {});
        return server.result;
      }
      assert.throws(
        () => server.releaseCheckpoint((checkpoint.id + 1) % checkpointCount),
        /checkpoint/i
      );
      assert.throws(() => server.releaseCheckpoint(checkpoint.id), /quiet/i);
      advance(expectedQuiet - 0.5);
      assert.throws(() => server.releaseCheckpoint(checkpoint.id), /quiet/i);
      advance(0.5);
      server.releaseCheckpoint(checkpoint.id);
      if (checkpoint.id === checkpointCount - 1) {
        assert.equal(
          await Promise.race([
            server.nextCheckpoint(),
            delay(100).then(() => "terminal checkpoint did not settle"),
          ]),
          null
        );
      }
    }
    assert.equal((await pending).status, 200);
    const completedFrames = server
      .snapshot()
      .receipts.filter(
        receipt =>
          receipt.kind === "loaded" &&
          server.metadata.documents[receipt.id].role === "frame"
      );
    assert.equal(server.snapshot().counts.framesLoaded, completedFrames.length);
  }
  return server.result;
}

test(
  "fixed smoke cells complete exact bounded document and frame schedule",
  bounded,
  async t => {
    let clock = 0;
    t.mock.method(performance, "now", () => clock);
    for (const state of ["none", "unrelated", "matching-no-handler"]) {
      const { server } = await fixture(t, state);
      assert.equal(server.metadata.documents.length, 40);
      const result = await drive(server, elapsed => {
        clock += elapsed;
      });
      assert.equal(
        validateLifecycleResult(result, { "lifecycle-case": state }),
        result
      );
      assert.deepEqual(result.counts, {
        documents: 40,
        cycles: 12,
        framesLoaded: 24,
        framesRemoved: 24,
        startupCompletions: state === "matching-no-handler" ? 40 : 0,
      });
      assert.equal(result.receipts.length, 76);
      assert.equal(result.dropped, 0);
      assert.equal(result.checkpoints.length, 3);
      assert.equal(server.snapshot().pendingRequests, 0);
      assert.equal(await server.nextCheckpoint(), null);
      assert.throws(() => server.releaseCheckpoint(2), /checkpoint/i);
      for (const mutate of [
        value => value.receipts.pop(),
        value => value.receipts.push(value.receipts[0]),
        value => {
          value.receipts[0].startupCount = 2;
        },
        value => {
          value.receipts[0].byteChecksum++;
        },
        value => {
          value.counts.framesRemoved--;
        },
        value => {
          value.checkpoints[0].quietMs = 1;
        },
        value => {
          value.checkpoints[0].documentsCompleted = 1;
        },
        value => {
          value.metadata.sourceSHA256 = "0".repeat(64);
        },
        value => {
          value.requests.find(entry => entry.route === "receipt").id = 39;
        },
        value => {
          const invalidOrigin = new URL(value.metadata.originB);
          invalidOrigin.hostname = "192.0.2.1";
          value.metadata.originB = invalidOrigin.origin;
        },
        value => {
          value.receipts[0].extra = "unexpected";
        },
        value => {
          value.dropped = 1;
        },
      ]) {
        const bad = structuredClone(result);
        mutate(bad);
        assert.throws(() =>
          validateLifecycleResult(bad, { "lifecycle-case": state })
        );
      }
    }
  }
);

test(
  "soak descriptor is canonical, immutable and independent of options",
  bounded,
  () => {
    const plan = lifecycle.getLifecyclePlan("soak-30m");
    assert.equal(lifecycle.getLifecyclePlan("soak-30m"), plan);
    assert.equal(
      lifecycle.getLifecyclePlan(),
      lifecycle.getLifecyclePlan("smoke")
    );
    assert.deepEqual(plan.cases, ["none"]);
    assert.deepEqual(plan.counts, {
      cycles: 102,
      documents: 318,
      frames: 204,
      receipts: 624,
      steps: 942,
    });
    assert.deepEqual(
      plan.checkpoints,
      Array.from({ length: 11 }, (_, id) => ({
        id,
        settleMs: [60000, ...Array(9).fill(120000), 300000][id],
        completedCycles: 2 + 10 * id,
        documentsCompleted: 8 + 31 * id,
      }))
    );
    assert.equal(plan.budget.totalMs, 1800000);
    assert.equal(plan.budget.finalizationMs, 150000);
    assert.equal(plan.limits.assets, 318);
    assert.equal(plan.evidence.fixtureBytes, 887347);
    assert.equal(plan.evidence.resourceRecords, 384);
    assert.equal(plan.evidence.historicalPIDs, 512);
    for (const value of [
      plan,
      plan.cases,
      plan.counts,
      plan.checkpoints,
      ...plan.checkpoints,
      plan.limits,
      plan.budget,
      plan.evidence,
    ]) {
      assert(Object.isFrozen(value));
    }
    assert.throws(() => {
      plan.checkpoints[0].settleMs = 1;
    }, TypeError);
    for (const planName of ["30m", "2h", "__proto__", null, {}]) {
      assert.throws(() => lifecycle.getLifecyclePlan(planName));
    }
  }
);

test(
  "soak completes all 102 cycles with unchanged page bytes and exact evidence",
  bounded,
  async t => {
    let clock = 0;
    t.mock.method(performance, "now", () => clock);
    const { server } = await fixture(t, "none", "soak-30m");
    assert.deepEqual(Object.keys(server), [
      "url",
      "metadata",
      "scriptStore",
      "result",
      "snapshot",
      "close",
      "start",
      "nextCheckpoint",
      "releaseCheckpoint",
    ]);
    assert.equal(server.nextCheckpoint.length, 0);
    assert.equal(server.releaseCheckpoint.length, 1);
    assert.equal(server.metadata.documents.length, 318);
    assert.equal(server.metadata.steps.length, 942);
    assert.equal(server.metadata.sourceSHA256, pageSHA256);
    const result = await drive(
      server,
      elapsed => {
        clock += elapsed;
      },
      { assets: true }
    );
    assert.equal(clock, 1440000);
    assert.equal(validateLifecycleResult(result, soakOptions), result);
    assert.equal(
      lifecycle.validateLifecycleMetadata(result.metadata, "soak-30m"),
      result.metadata
    );
    assert.deepEqual(result.counts, {
      documents: 318,
      cycles: 102,
      framesLoaded: 204,
      framesRemoved: 204,
      startupCompletions: 0,
    });
    assert.equal(result.receipts.length, 624);
    assert.equal(result.requests.length, 1260);
    assert.equal(result.checkpoints.length, 11);
    assert.equal(result.pendingRequests, 0);
    assert.equal(await server.nextCheckpoint(), null);
    const text = lifecycle.serializeLifecycleSnapshot(
      result,
      soakOptions,
      value => value
    );
    assert.deepEqual(JSON.parse(text), result);
    assert(text.endsWith("}\n"));
    assert(Buffer.byteLength(text) <= 887347);
    t.diagnostic(
      `Soak success projection: ${Buffer.byteLength(text)} UTF-8 bytes`
    );
    for (const mutate of [
      value => value.receipts.pop(),
      value => {
        value.receipts[0].firstStartupCount = 1;
      },
      value => {
        value.receipts[1].id = 317;
      },
      value => {
        value.receipts[0].sentinel = "unexpected";
      },
      value => {
        value.receipts[0].extra = null;
      },
      value => {
        value.metadata.plan = "smoke";
      },
      value => {
        value.metadata.documents[317].checkpoint = 0;
      },
      value => {
        value.metadata.steps[941].id = 0;
      },
      value => {
        value.metadata.checkpoints[10].settleMs = 1;
      },
      value => {
        value.checkpoints[10].quietMs = 299999.5;
      },
      value => {
        value.checkpoints[10].quietMs = Infinity;
      },
      value => {
        value.checkpoints[10].id = 11;
      },
      value => {
        value.requests.push({
          label: "B",
          method: "GET",
          route: "fixture.js",
          id: null,
          status: 200,
        });
      },
    ]) {
      const invalid = structuredClone(result);
      mutate(invalid);
      assert.throws(() => validateLifecycleResult(invalid, soakOptions));
    }
  }
);

test(
  "soak final held request aborts without shortening its five-minute hold",
  bounded,
  async t => {
    let clock = 0;
    t.mock.method(performance, "now", () => clock);
    const { server, controller } = await fixture(t, "none", "soak-30m");
    const completion = drive(
      server,
      elapsed => {
        clock += elapsed;
      },
      {
        async onCheckpoint(checkpoint) {
          if (checkpoint.id !== 10) {
            return true;
          }
          clock += 299999.5;
          assert.throws(() => server.releaseCheckpoint(10), /quiet/i);
          controller.abort(new Error("HALT final hold"));
          await server.close();
          return false;
        },
      }
    );
    await assert.rejects(completion, /HALT final hold/);
    await assert.rejects(server.nextCheckpoint(), /HALT/);
    assert.equal(server.snapshot().checkpoints.length, 10);
    assert.equal(server.snapshot().pendingRequests, 0);
    assert.equal(server.snapshot().status, "failed");
    assert(
      Buffer.byteLength(
        lifecycle.serializeLifecycleSnapshot(
          server.snapshot(),
          soakOptions,
          value => value
        )
      ) <= 887347
    );
  }
);

test(
  "soak asset and invalid route evidence stays bounded and explicit",
  bounded,
  async t => {
    const { server } = await fixture(t, "none", "soak-30m");
    for (let i = 0; i < 318; i++) {
      const response = await fetch(new URL("fixture.js", server.url));
      assert.equal(response.status, 200);
      await response.text();
    }
    assert.equal((await fetch(new URL("fixture.js", server.url))).status, 429);
    await assert.rejects(server.result, /asset.*cap/i);
    assert.equal(server.snapshot().requests.length, 319);
    for (const init of [{}, { method: "PATCH" }]) {
      const next = await fixture(t, "none", "soak-30m");
      await (
        await fetch(new URL("invalid-%22-%5C", next.server.url), init)
      ).text();
      await assert.rejects(next.server.result);
      const snapshot = next.server.snapshot();
      assert.equal(snapshot.requests[0].route, "invalid");
      assert.equal(
        snapshot.requests[0].method,
        init.method ? "invalid" : "GET"
      );
      assert.equal(snapshot.errorClipped, false);
      assert(
        Buffer.byteLength(
          lifecycle.serializeLifecycleSnapshot(
            snapshot,
            soakOptions,
            value => value
          )
        ) <= 887347
      );
    }
  }
);

test(
  "soak serialization proves retained UTF-8 bounds without dropping observations",
  bounded,
  async t => {
    const { server, controller } = await fixture(t, "none", "soak-30m");
    controller.abort(new Error('secret"\\\n\u6f22\u{1d11e}'.repeat(10000)));
    await server.close();
    const value = server.snapshot();
    assert.equal(value.errorClipped, true);
    assert(Buffer.byteLength(JSON.stringify(value.error)) <= 2048);
    value.started = true;
    value.pendingRequests = 1280;
    value.counts = {
      documents: 318,
      cycles: 102,
      framesLoaded: 204,
      framesRemoved: 204,
      startupCompletions: 0,
    };
    value.receipts = Array.from({ length: 640 }, (_, id) =>
      loaded(server, id % 318)
    );
    value.requests = Array.from({ length: 1280 }, () => ({
      label: "B",
      method: "invalid",
      route: "invalid",
      id: null,
      status: 503,
    }));
    value.checkpoints = lifecycle
      .getLifecyclePlan("soak-30m")
      .checkpoints.map(checkpoint => ({
        ...checkpoint,
        quietMs: 1799999.9999999998,
      }));
    let calls = 0;
    const text = lifecycle.serializeLifecycleSnapshot(
      value,
      soakOptions,
      raw => {
        calls++;
        return raw.replaceAll("secret", "redacted".repeat(100));
      }
    );
    assert.equal(calls, 1);
    const decoded = JSON.parse(text);
    assert.equal(decoded.receipts.length, 640);
    assert.equal(decoded.requests.length, 1280);
    assert.equal(decoded.errorClipped, true);
    assert(Buffer.byteLength(JSON.stringify(decoded.error)) <= 2048);
    assert(Buffer.byteLength(text) <= 887347);
    t.diagnostic(
      `Maximum-count failure projection: ${Buffer.byteLength(text)} UTF-8 bytes; bound 887347`
    );
    assert.equal(
      640 * 573 + 1280 * 285 + 11 * 285 + 318 * 165 + 942 * 89 + 16384,
      887347
    );
    for (const mutate of [
      item => {
        item.receipts.push(item.receipts[0]);
      },
      item => {
        item.requests.push(item.requests[0]);
      },
      item => {
        item.checkpoints.push(item.checkpoints[0]);
      },
      item => {
        item.receipts[0].byteChecksum = "wrong";
      },
      item => {
        item.requests[0].route = "unknown";
      },
      item => {
        item.requests[0].method = "PATCH";
      },
      item => {
        item.requests[0].id = Number.MAX_VALUE;
      },
      item => {
        item.requests[0].status = NaN;
      },
      item => {
        item.checkpoints[0].quietMs = Number.MAX_VALUE;
      },
      item => {
        item.metadata.steps[0].id = -1;
      },
      item => {
        item.metadata.documents[0].cycle = NaN;
      },
      item => {
        item.metadata.documents[0].checkpoint = Infinity;
      },
      item => {
        item.metadata.originA = Object(item.metadata.originA);
      },
      item => {
        item.metadata.sentinel = Object(item.metadata.sentinel);
      },
      item => {
        item.extra = "unexpected";
      },
    ]) {
      const invalid = structuredClone(value);
      mutate(invalid);
      assert.throws(() =>
        lifecycle.serializeLifecycleSnapshot(invalid, soakOptions, raw => raw)
      );
    }
    assert.throws(() =>
      lifecycle.serializeLifecycleSnapshot(value, soakOptions, () => "not JSON")
    );
    assert.throws(() =>
      lifecycle.serializeLifecycleSnapshot(value, options, raw => raw)
    );
  }
);

test(
  "soak request retention stops at 1280 entries with bounded failure evidence",
  bounded,
  async t => {
    const { server } = await fixture(t, "none", "soak-30m");
    for (let i = 0; i < 1280; i++) {
      const response = await fetch(new URL("unknown", server.url));
      assert.equal(response.status, i === 0 ? 404 : 409);
      await response.text();
    }
    const overflow = await fetch(new URL("unknown", server.url));
    assert.equal(overflow.status, 429);
    await overflow.text();
    await assert.rejects(server.result, /route/);
    await server.close();
    const snapshot = server.snapshot();
    assert.equal(snapshot.requests.length, 1280);
    assert.equal(snapshot.pendingRequests, 0);
    assert.equal(snapshot.dropped, 0);
    assert.equal(snapshot.status, "failed");
    assert(
      Buffer.byteLength(
        lifecycle.serializeLifecycleSnapshot(
          snapshot,
          soakOptions,
          value => value
        )
      ) <= 887347
    );
  }
);

test(
  "soak rejects non-NONE or arbitrary budgets while smoke page and shape remain unchanged",
  bounded,
  async t => {
    for (const bad of [
      { ...soakOptions, "lifecycle-case": "unrelated" },
      { ...soakOptions, "lifecycle-case": "matching-no-handler" },
      { ...soakOptions, profile: "on" },
      { ...soakOptions, "timeout-ms": 120000 },
      { ...soakOptions, "timeout-ms": 1800001 },
      { ...soakOptions, "lifecycle-observer": "checkpoints" },
    ]) {
      await assert.rejects(
        createLifecycleServer(bad, new AbortController().signal)
      );
    }
    const { server } = await fixture(t);
    assert.equal(server.metadata.sourceSHA256, pageSHA256);
    assert.equal(Object.hasOwn(server.metadata, "plan"), false);
    assert.equal(Object.hasOwn(server.metadata, "checkpoints"), false);
    assert.equal(Object.hasOwn(server.snapshot(), "errorClipped"), false);
    assert.equal(server.metadata.settleMs, 10000);
  }
);

test(
  "profile store is scoped and matching setup has exact async sentinel",
  bounded,
  async t => {
    for (const state of ["none", "unrelated", "matching-no-handler"]) {
      const { server } = await fixture(t, state);
      assert.equal(server.scriptStore.scripts.length, state === "none" ? 0 : 1);
      if (state === "none") {
        continue;
      }
      const script = server.scriptStore.scripts[0];
      assert.equal(
        script.scope.origin,
        state === "unrelated"
          ? server.metadata.originA
          : server.metadata.originB
      );
      assert.deepEqual(script.scope.targetKinds, ["document"]);
      assert.equal(script.enabled, true);
      assert.doesNotMatch(script.code, /userland\.(on|off|addEventListener)/);
      const attributes = new Map();
      const element = {
        getAttribute: key => attributes.get(key) ?? null,
        setAttribute: (key, value) => attributes.set(key, String(value)),
      };
      const execute = () =>
        runInNewContext(
          `(async () => { ${script.code} })()`,
          { window: { document: { documentElement: element } } },
          { timeout: 1000 }
        );
      const pending = execute();
      assert.equal(element.getAttribute("data-lifecycle-start"), "1");
      assert.equal(element.getAttribute("data-lifecycle-finish"), null);
      await pending;
      assert.equal(
        element.getAttribute("data-lifecycle-finish"),
        server.metadata.sentinel
      );
      await execute();
      assert.equal(element.getAttribute("data-lifecycle-start"), "2");
    }
  }
);

test(
  "invalid receipts and missing or stale document transitions fail closed",
  bounded,
  async t => {
    for (const mutation of [
      value => {
        value.id = 1;
      },
      value => {
        value.kind = "removed";
      },
      value => {
        value.readyState = "loading";
      },
      value => {
        value.webdriver = true;
      },
      value => {
        value.firstStartupCount = 1;
      },
      value => {
        value.domChecksum = 0;
      },
      value => {
        value.frames = 1;
      },
      value => {
        value.nodesRemoved = 0;
      },
      value => {
        value.extra = "unexpected";
      },
    ]) {
      const { server } = await fixture(t);
      await (await fetch(server.url)).text();
      const receipt = loaded(server, 0);
      mutation(receipt);
      assert.equal((await post(server, receipt)).status, 400);
      await assert.rejects(server.result);
      await assert.rejects(server.nextCheckpoint());
    }
    const { server } = await fixture(t);
    assert.equal((await post(server, loaded(server, 0))).status, 400);
    await assert.rejects(server.result);
  }
);

test(
  "abort and close settle all held HTTP and checkpoint promises",
  bounded,
  async t => {
    for (const abort of [true, false]) {
      const { server, controller } = await fixture(t);
      const checkpoint = server.nextCheckpoint();
      await assert.rejects(server.nextCheckpoint(), /outstanding/i);
      await (await fetch(server.url)).text();
      const pending = post(server, loaded(server, 0)).then(
        response => response.status,
        () => 503
      );
      for (let i = 0; i < 100 && server.snapshot().pendingRequests === 0; i++) {
        await delay(2);
      }
      assert.equal(server.snapshot().pendingRequests, 1);
      if (abort) {
        controller.abort(new Error("HALT"));
      } else {
        await server.close();
      }
      await assert.rejects(checkpoint, /HALT|closed/i);
      await assert.rejects(server.result, /HALT|closed/i);
      assert.equal(await pending, 503);
      await server.close();
      await server.close();
      assert.equal(server.snapshot().pendingRequests, 0);
    }
  }
);

test(
  "loopback routes, CSP, body caps, and duplicate document GETs are strict",
  bounded,
  async t => {
    const { server } = await fixture(t);
    const denied = await new Promise((resolve, reject) => {
      const req = request(
        server.url,
        { headers: { Host: "other.invalid" } },
        response => {
          response.resume();
          resolve(response.statusCode);
        }
      );
      req.on("error", reject);
      req.end();
    });
    assert.equal(denied, 403);
    const response = await fetch(server.url);
    assert.equal(response.status, 200);
    assert.match(
      response.headers.get("content-security-policy"),
      /frame-ancestors 'self'/
    );
    assert.match(
      response.headers.get("content-security-policy"),
      /img-src data:/
    );
    assert.equal(response.headers.get("cache-control"), "no-store");
    await response.text();
    assert.equal((await fetch(server.url)).status, 400);
    await assert.rejects(server.result);
    const other = await fixture(t);
    assert.equal(
      (await post(other.server, {}, { body: "x".repeat(16385) })).status,
      413
    );
    await assert.rejects(other.server.result);
  }
);

test(
  "options reject profiling and unsupported long or variable plans",
  bounded,
  async () => {
    for (const bad of [
      { "lifecycle-case": "visited" },
      { ...options, profile: "on" },
      { ...options, "lifecycle-plan": "30m" },
      { ...options, "timeout-ms": 120001 },
    ]) {
      await assert.rejects(
        createLifecycleServer(bad, new AbortController().signal)
      );
    }
  }
);

test(
  "generic trial defaults do not change lifecycle's fixed schedule",
  bounded,
  async t => {
    const server = await createLifecycleServer(
      { ...options, trials: 7, warmup: 2 },
      new AbortController().signal
    );
    t.after(() => server.close());
    assert.equal(server.metadata.documents.length, 40);
    assert.equal(
      server.metadata.documents.filter(item => item.role === "top").length,
      12
    );
  }
);

test(
  "duplicate receipts, malformed bodies and lifecycle misuse fail closed",
  bounded,
  async t => {
    for (const body of ["", "{", "null", "[]"]) {
      const { server } = await fixture(t);
      await (await fetch(server.url)).text();
      assert.equal((await post(server, {}, { body })).status, 400);
      await assert.rejects(server.result);
    }
    const invalidType = await fixture(t);
    assert.equal(
      (
        await post(
          invalidType.server,
          {},
          {
            headers: { "Content-Type": "text/plain" },
          }
        )
      ).status,
      415
    );
    await assert.rejects(invalidType.server.result);
    const { server } = await fixture(t);
    await (await fetch(server.url)).text();
    const first = post(server, loaded(server, 0));
    for (let i = 0; i < 100 && !server.snapshot().receipts.length; i++) {
      await delay(2);
    }
    assert.equal(server.snapshot().receipts.length, 1);
    assert.equal((await post(server, loaded(server, 0))).status, 400);
    assert.equal((await first).status, 503);
    await assert.rejects(server.result);
    assert.equal(server.snapshot().receipts.length, 1);
    assert.throws(() => server.start());
    const stopped = await fixture(t);
    await stopped.server.close();
    assert.throws(() => stopped.server.start());
    const aborted = new AbortController();
    aborted.abort(new Error("pre-aborted"));
    await assert.rejects(
      createLifecycleServer(options, aborted.signal),
      /pre-aborted/
    );
  }
);

test(
  "disconnected and aborted incomplete bodies leave no pending requests",
  bounded,
  async t => {
    for (const abort of [false, true]) {
      const { server, controller } = await fixture(t);
      const checkpoint = server.nextCheckpoint();
      const pending = request(new URL("receipt", server.url), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": "100",
        },
      });
      pending.on("error", () => {});
      pending.on("response", response => response.resume());
      pending.write("{");
      for (let i = 0; i < 100 && !server.snapshot().pendingRequests; i++) {
        await delay(2);
      }
      assert.equal(server.snapshot().pendingRequests, 1);
      if (abort) {
        controller.abort(new Error("HALT incomplete"));
      } else {
        pending.destroy();
      }
      await assert.rejects(server.result);
      await assert.rejects(checkpoint);
      await server.close();
      pending.destroy();
      assert.equal(server.snapshot().pendingRequests, 0);
      assert.equal(server.snapshot().receipts.length, 0);
    }
  }
);

test(
  "request count and route length caps bound partial evidence",
  bounded,
  async t => {
    const { server } = await fixture(t);
    for (let i = 0; i < 512; i++) {
      const response = await fetch(new URL("fixture.js", server.url));
      assert.equal(response.status, 200);
      await response.text();
    }
    assert.equal((await fetch(new URL("fixture.js", server.url))).status, 429);
    await assert.rejects(server.result, /cap/);
    assert.equal(server.snapshot().requests.length, 512);
    const oversized = await fixture(t);
    assert.equal(
      (await fetch(new URL("x".repeat(513), oversized.server.url))).status,
      429
    );
    await assert.rejects(oversized.server.result, /cap/);
    assert.equal(oversized.server.snapshot().requests.length, 0);
  }
);

test(
  "emitted page script captures first-script sentinel and removes temporary nodes",
  bounded,
  async t => {
    const { server } = await fixture(t, "matching-no-handler");
    const script = await (
      await fetch(new URL("fixture.js", server.url))
    ).text();
    const attributes = new Map([
      ["data-lifecycle-start", "1"],
      ["data-lifecycle-finish", server.metadata.sentinel],
    ]);
    const nodes = [];
    function element(tag) {
      const node = {
        tag,
        children: [],
        parentNode: null,
        get childElementCount() {
          return this.children.length;
        },
        append(child) {
          this.children.push(child);
          child.parentNode = this;
        },
        replaceChildren() {
          this.children = [];
        },
        remove() {
          this.parentNode.children = this.parentNode.children.filter(
            child => child !== this
          );
          this.parentNode = null;
        },
      };
      nodes.push(node);
      return node;
    }
    let onLoad;
    const posted = [];
    const messages = [];
    const pageDocument = {
      documentElement: {
        dataset: {
          fixtureConfig: JSON.stringify({
            id: 2,
            role: "frame",
            token: server.metadata.sentinel,
          }),
        },
        getAttribute: key => attributes.get(key) ?? null,
      },
      readyState: "loading",
      body: element("body"),
      createElement: element,
      querySelectorAll: () => [],
    };
    const execution = runInNewContext(
      script,
      {
        document: pageDocument,
        navigator: { webdriver: false },
        location: { origin: server.metadata.originB },
        parent: {
          postMessage: (value, targetOrigin) =>
            messages.push({ value, targetOrigin }),
        },
        addEventListener(type, handler, settings) {
          assert.equal(type, "load");
          assert.equal(settings.once, true);
          onLoad = handler;
        },
        fetch: async (url, init) => {
          assert.equal(url, "./receipt");
          assert.equal(init.method, "POST");
          posted.push(JSON.parse(init.body));
          return { ok: true, json: async () => ({}) };
        },
        console: { error: (...values) => assert.fail(values.join(" ")) },
      },
      { timeout: 1000 }
    );
    assert.equal(posted.length, 0);
    assert.equal(nodes.length, 1);
    attributes.set("data-lifecycle-start", "2");
    pageDocument.readyState = "complete";
    onLoad();
    await execution;
    assert.equal(posted.length, 1);
    assert.deepEqual(posted[0], { ...loaded(server, 2), startupCount: 2 });
    assert.equal(nodes.filter(node => node.tag === "span").length, 128);
    assert.equal(pageDocument.body.childElementCount, 0);
    assert.equal(messages.length, 1);
    assert.equal(messages[0].targetOrigin, server.metadata.originB);
    assert.equal(messages[0].value.receipt.firstStartupCount, 1);
  }
);

test(
  "concurrent incomplete bodies trip the active request cap and close cleanly",
  bounded,
  async t => {
    const { server } = await fixture(t);
    const sockets = [];
    for (let i = 0; i < 5; i++) {
      const pending = request(new URL("receipt", server.url), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": "100",
        },
      });
      pending.on("error", () => {});
      pending.on("response", response => response.resume());
      pending.write("{");
      sockets.push(pending);
    }
    t.after(() => sockets.forEach(socket => socket.destroy()));
    await assert.rejects(server.result, /cap/);
    await server.close();
    assert.equal(server.snapshot().pendingRequests, 0);
    assert.equal(server.snapshot().receipts.length, 0);
  }
);

test(
  "missing next transition times out and rejects a checkpoint waiter",
  bounded,
  async t => {
    const { server } = await fixture(t);
    const schedule = globalThis.setTimeout;
    let expire;
    t.mock.method(globalThis, "setTimeout", (callback, ms, ...args) => {
      if (ms === 10000) {
        expire = callback;
      }
      return schedule(callback, ms, ...args);
    });
    const checkpoint = server.nextCheckpoint();
    server.start();
    assert.throws(() => server.start(), /twice/);
    assert.equal(typeof expire, "function");
    expire();
    await assert.rejects(server.result, /timed out/);
    await assert.rejects(checkpoint, /timed out/);
    assert.equal(server.snapshot().status, "failed");
  }
);
