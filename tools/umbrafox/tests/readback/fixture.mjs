/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { createServer } from "node:http";

// Serialized into the owned fixture document, with no persistent page binding.
export async function collectFrame(target) {
  const videos = document.querySelectorAll("video");
  if (videos.length !== 1 || ![0.5, 2].includes(target)) {
    throw new Error("Invalid frame target");
  }
  const video = videos[0];
  const waitFor = (event, operation) =>
    new Promise((resolve, reject) => {
      const finish = error => {
        clearTimeout(timer);
        video.removeEventListener(event, complete);
        video.removeEventListener("error", failed);
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      };
      const complete = () => finish();
      const failed = () => finish(new Error("Video load failed"));
      const timer = setTimeout(
        () => finish(new Error(`Video ${event} timeout`)),
        3000
      );
      video.addEventListener(event, complete, { once: true });
      video.addEventListener("error", failed, { once: true });
      try {
        operation?.();
      } catch (error) {
        finish(error);
      }
    });
  if (!video.paused || video.error) {
    throw new Error("Video must be paused and healthy");
  }
  if (video.readyState < 2) {
    await waitFor("loadeddata");
  }
  if (!video.videoWidth || !video.videoHeight || !(video.duration > target)) {
    throw new Error("Video dimensions or duration unavailable");
  }
  await waitFor("seeked", () => {
    video.currentTime = target;
  });
  const state = () => ({
    paused: video.paused,
    time: video.currentTime,
    seeking: video.seeking,
    width: video.videoWidth,
    height: video.videoHeight,
  });
  const before = state();
  const definitions = [
    ["cpu-linear", 110, 75],
    ["cpu-odd", 111, 77],
    ["cpu-full", video.videoWidth, video.videoHeight],
    ["crop", 110, 75],
    ["fractional", 110, 75],
    ["nearest", 110, 75],
    ["transform", 110, 75],
    ["alpha", 110, 75],
    ["default", 110, 75],
  ];
  const cases = [];
  for (const [caseName, width, height] of definitions) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", {
      willReadFrequently: caseName !== "default",
    });
    if (!context) {
      throw new Error("No canvas context");
    }
    if (caseName === "nearest") {
      context.imageSmoothingEnabled = false;
    }
    if (caseName === "alpha") {
      context.globalAlpha = 0.5;
    }
    if (caseName === "transform") {
      context.translate(8, 4);
      context.rotate(0.1);
    }
    const args =
      caseName === "crop"
        ? [
            video,
            10,
            10,
            video.videoWidth - 20,
            video.videoHeight - 20,
            0,
            0,
            width,
            height,
          ]
        : [
            video,
            0,
            0,
            caseName === "fractional" ? width - 0.5 : width,
            height,
          ];
    const durations = [];
    const hashes = [];
    for (let repeat = 0; repeat < 12; repeat++) {
      context.clearRect(-100, -100, width + 200, height + 200);
      const start = performance.now();
      context.drawImage(...args);
      durations.push(performance.now() - start);
      const bytes = context.getImageData(0, 0, width, height).data;
      const digest = new Uint8Array(
        await crypto.subtle.digest("SHA-256", bytes)
      );
      hashes.push(
        Array.from(digest, byte => byte.toString(16).padStart(2, "0")).join("")
      );
    }
    cases.push({ name: caseName, width, height, durations, hashes });
  }
  return { ...before, target, cases, after: state() };
}

export function validateFrame(value, target) {
  assert([0.5, 2].includes(target), "Invalid frame target");
  assert.equal(value?.target, target);
  assert.equal(value.paused, true);
  assert.equal(value.seeking, false);
  assert.equal(value.time, target);
  assert.equal(value.width, 320);
  assert.equal(value.height, 240);
  assert.deepEqual(value.after, {
    paused: true,
    time: target,
    seeking: false,
    width: 320,
    height: 240,
  });
  const names = [
    "cpu-linear",
    "cpu-odd",
    "cpu-full",
    "crop",
    "fractional",
    "nearest",
    "transform",
    "alpha",
    "default",
  ];
  assert.equal(value.cases?.length, names.length);
  for (const [index, caseName] of names.entries()) {
    const item = value.cases[index];
    assert.equal(item.name, caseName);
    const [width, height] = { "cpu-full": [320, 240], "cpu-odd": [111, 77] }[
      caseName
    ] ?? [110, 75];
    assert.equal(item.width, width);
    assert.equal(item.height, height);
    assert.equal(item.durations?.length, 12);
    assert.equal(item.hashes?.length, 12);
    for (let sample = 0; sample < 12; sample++) {
      assert(
        Number.isFinite(item.durations[sample]) && item.durations[sample] >= 0,
        "Invalid draw duration"
      );
      assert.match(item.hashes[sample], /^[a-f0-9]{64}$/);
      assert.equal(
        item.hashes[sample],
        item.hashes[0],
        "Held-frame pixel change"
      );
    }
  }
  return value;
}

export function compareFrames(before, after) {
  for (const capturedFrames of [before, after]) {
    assert.equal(capturedFrames.length, 2);
    validateFrame(capturedFrames[0], 0.5);
    validateFrame(capturedFrames[1], 2);
    assert.notEqual(
      capturedFrames[0].cases[0].hashes[0],
      capturedFrames[1].cases[0].hashes[0],
      "Frames must be distinct"
    );
  }
  for (let frame = 0; frame < 2; frame++) {
    for (let index = 0; index < 9; index++) {
      assert.equal(
        after[frame].cases[index].hashes[0],
        before[frame].cases[index].hashes[0],
        "Pixel parity failure"
      );
    }
  }
  return { frames: 2, cases: 18, pixels: "exact-sha256" };
}

function mediaRange(header, size) {
  if (header === undefined) {
    return [0, size - 1, 200];
  }
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) {
    return null;
  }
  const start = match[1]
    ? Number(match[1])
    : Math.max(0, size - Number(match[2]));
  const end =
    match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  return Number.isSafeInteger(start) &&
    Number.isSafeInteger(end) &&
    start <= end &&
    start < size
    ? [start, end, 206]
    : null;
}

export async function createReadbackServer(media, signal) {
  signal.throwIfAborted();
  assert(
    Buffer.isBuffer(media) && media.length && media.length <= 1024 ** 2,
    "Invalid media bytes"
  );
  const requests = [];
  let bytes = 0;
  let failure = null;
  let closing;
  const page = Buffer.from(
    '<!doctype html><html lang="en"><meta charset="utf-8"><title>Owned readback fixture</title><link rel="icon" href="data:,"><video muted preload="auto" src="/video.webm"></video></html>'
  );
  const server = createServer((request, response) => {
    response.on("error", () => {});
    request.on("error", () => {});
    const route = ["/", "/video.webm"].includes(request.url)
      ? request.url
      : "other";
    if (requests.length >= 64 || signal.aborted) {
      failure ??= "Fixture request cap or abort";
      response.writeHead(503).end();
      return;
    }
    const record = {
      route,
      method: request.method === "GET" ? "GET" : "other",
      status: null,
      bytes: 0,
    };
    requests.push(record);
    response.setHeader("Cache-Control", "no-store");
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; media-src 'self'; img-src data:"
    );
    let body = Buffer.alloc(0);
    let statusCode = 200;
    if (request.method !== "GET") {
      statusCode = 405;
      request.resume();
    } else if (route === "/") {
      body = page;
      response.setHeader("Content-Type", "text/html; charset=utf-8");
    } else if (route === "/video.webm") {
      response.setHeader("Content-Type", "video/webm");
      response.setHeader("Accept-Ranges", "bytes");
      const range = mediaRange(request.headers.range, media.length);
      if (range) {
        const [start, end] = range;
        statusCode = range[2];
        body = media.subarray(start, end + 1);
        if (statusCode === 206) {
          response.setHeader(
            "Content-Range",
            `bytes ${start}-${end}/${media.length}`
          );
        }
      } else {
        statusCode = 416;
        response.setHeader("Content-Range", `bytes */${media.length}`);
      }
    } else {
      statusCode = 404;
    }
    if (bytes + body.length > 5 * 1024 ** 2) {
      failure = "Fixture byte cap";
      statusCode = 503;
      body = Buffer.alloc(0);
    }
    bytes += body.length;
    record.status = statusCode;
    record.bytes = body.length;
    response.setHeader("Content-Length", body.length);
    response.writeHead(statusCode).end(body);
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
  return {
    url: `http://127.0.0.1:${server.address().port}/`,
    mediaSHA256: createHash("sha256").update(media).digest("hex"),
    snapshot: () => ({
      requests: requests.map(item => ({ ...item })),
      bytes,
      failure,
    }),
    close: closeFixture,
  };
}
