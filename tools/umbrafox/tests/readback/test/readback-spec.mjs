/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { webcrypto } from "node:crypto";
import { createContext, runInContext } from "node:vm";
import { test } from "node:test";
import {
  collectFrame,
  createReadbackServer,
  validateFrame,
  compareFrames,
} from "../fixture.mjs";

function fakePage({ stale = false, corrupt = false, neverSeek = false } = {}) {
  const video = new EventTarget();
  let time = 0;
  Object.assign(video, {
    paused: true,
    readyState: 4,
    videoWidth: 320,
    videoHeight: 240,
    duration: 4,
    seeking: false,
    error: null,
  });
  Object.defineProperty(video, "currentTime", {
    get: () => time,
    set: value => {
      time = value;
      if (!neverSeek) {
        queueMicrotask(() => video.dispatchEvent(new Event("seeked")));
      }
    },
  });
  const draws = [];
  const fakeDocument = {
    querySelectorAll: () => [video],
    createElement: () => {
      let drawCount = 0;
      const context = {
        clearRect() {},
        rotate() {},
        translate() {},
        drawImage(...args) {
          draws.push(args);
          drawCount++;
        },
        getImageData: () => ({
          data: new Uint8ClampedArray([
            stale ? 1 : Math.round(time * 10),
            corrupt ? drawCount : 0,
            45,
            255,
          ]),
        }),
      };
      return { getContext: () => context };
    },
  };
  const sandbox = createContext({
    document: fakeDocument,
    crypto: webcrypto,
    performance,
    setTimeout: callback => setTimeout(callback, 20),
    clearTimeout,
  });
  return {
    draws,
    video,
    collect: async target =>
      JSON.parse(
        JSON.stringify(
          await runInContext(`(${collectFrame.toString()})(${target})`, sandbox)
        )
      ),
  };
}

test(
  "page probe draws first target directly, hashes repeats, and distinguishes frames",
  { timeout: 3000 },
  async () => {
    const page = fakePage();
    const first = await page.collect(0.5);
    const second = await page.collect(2);
    validateFrame(first, 0.5);
    validateFrame(second, 2);
    assert.equal(page.draws[0][0], page.video);
    assert.deepEqual(page.draws[0].slice(1), [0, 0, 110, 75]);
    assert.equal(first.cases[0].hashes.length, 12);
    assert.notEqual(first.cases[0].hashes[0], second.cases[0].hashes[0]);
    assert.deepEqual(compareFrames([first, second], [first, second]), {
      frames: 2,
      cases: 18,
      pixels: "exact-sha256",
    });
  }
);

test("validator rejects changed pixels within a held frame", async () => {
  const value = await fakePage({ corrupt: true }).collect(0.5);
  assert.throws(() => validateFrame(value, 0.5), /pixel/);
});

test("comparison rejects stale new frames and changed candidate pixels", async () => {
  const page = fakePage();
  const values = [await page.collect(0.5), await page.collect(2)];
  const stale = fakePage({ stale: true });
  const staleValues = [await stale.collect(0.5), await stale.collect(2)];
  assert.throws(() => compareFrames(staleValues, staleValues), /distinct/);
  const changed = structuredClone(values);
  changed[1].cases[0].hashes.fill("a".repeat(64));
  assert.throws(() => compareFrames(values, changed), /parity/);
});

test("invalid result fields and missing cases cannot pass", async () => {
  const value = await fakePage().collect(0.5);
  for (const mutate of [
    item => (item.time = 0.7),
    item => (item.paused = false),
    item => (item.width = 0),
    item => item.cases.pop(),
    item => (item.cases[0].name = "unknown"),
    item => (item.cases[0].durations[0] = NaN),
    item => (item.cases[0].durations[0] = -1),
    item => item.cases[0].hashes.pop(),
    item => (item.cases[0].hashes[0] = "bad"),
    item => (item.after.time = 0.6),
  ]) {
    const invalid = structuredClone(value);
    mutate(invalid);
    assert.throws(() => validateFrame(invalid, 0.5));
  }
});

test("probe rejects playing, missing, or unavailable video", async () => {
  for (const field of ["paused", "videoWidth", "error"]) {
    const page = fakePage();
    page.video[field] = field === "error" ? {} : false;
    await assert.rejects(page.collect(0.5));
  }
  await assert.rejects(fakePage().collect(-1));
});

test(
  "loopback fixture serves bounded media and single byte ranges",
  { timeout: 3000 },
  async t => {
    const controller = new AbortController();
    const server = await createReadbackServer(
      Buffer.from("0123456789"),
      controller.signal
    );
    t.after(() => server.close());
    assert.equal(new URL(server.url).hostname, "127.0.0.1");
    const page = await fetch(server.url);
    assert.equal(page.status, 200);
    assert.match(
      page.headers.get("content-security-policy"),
      /default-src 'none'/
    );
    assert.match(await page.text(), /<video/);
    for (const [range, statusCode, body] of [
      [null, 200, "0123456789"],
      ["bytes=2-4", 206, "234"],
      ["bytes=7-", 206, "789"],
      ["bytes=-2", 206, "89"],
      ["bytes=8-99", 206, "89"],
      ["bytes=99-", 416, ""],
      ["bytes=5-2", 416, ""],
      ["bytes=0-1,3-4", 416, ""],
      ["nonsense", 416, ""],
    ]) {
      const response = await fetch(new URL("/video.webm", server.url), {
        headers: range ? { Range: range } : {},
      });
      assert.equal(response.status, statusCode);
      assert.equal(await response.text(), body);
    }
    assert.equal((await fetch(new URL("/other", server.url))).status, 404);
    assert.equal((await fetch(server.url, { method: "POST" })).status, 405);
    assert.equal(server.snapshot().requests.length, 12);
    controller.abort();
    await server.close();
    await server.close();
    await assert.rejects(fetch(server.url));
  }
);

test("fixture rejects pre-abort and oversized media without opening a listener", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    createReadbackServer(Buffer.from("x"), controller.signal)
  );
  await assert.rejects(
    createReadbackServer(
      Buffer.alloc(1024 ** 2 + 1),
      new AbortController().signal
    )
  );
});

test(
  "seek timeout and media errors settle without drawing",
  { timeout: 1000 },
  async () => {
    const page = fakePage({ neverSeek: true });
    await assert.rejects(page.collect(0.5), /seeked timeout/);
    assert.equal(page.draws.length, 0);
    const loading = fakePage();
    loading.video.readyState = 0;
    const pending = loading.collect(0.5);
    loading.video.dispatchEvent(new Event("error"));
    await assert.rejects(pending, /Video load failed/);
    assert.equal(loading.draws.length, 0);
  }
);

test(
  "fixture request and byte caps retain bounded failure evidence",
  { timeout: 5000 },
  async t => {
    const controller = new AbortController();
    const server = await createReadbackServer(
      Buffer.from("x"),
      controller.signal
    );
    const large = await createReadbackServer(
      Buffer.alloc(1024 ** 2),
      controller.signal
    );
    t.after(async () => {
      controller.abort();
      await server.close();
      await large.close();
    });
    for (let index = 0; index < 65; index++) {
      const reply = await fetch(new URL("/video.webm", server.url));
      await reply.arrayBuffer();
      assert.equal(reply.status, index === 64 ? 503 : 200);
    }
    assert.equal(server.snapshot().requests.length, 64);
    assert.match(server.snapshot().failure, /cap/);
    for (let index = 0; index < 6; index++) {
      const reply = await fetch(new URL("/video.webm", large.url));
      await reply.arrayBuffer();
      assert.equal(reply.status, index === 5 ? 503 : 200);
    }
    assert.equal(large.snapshot().bytes, 5 * 1024 ** 2);
    assert.match(large.snapshot().failure, /byte cap/);
  }
);
