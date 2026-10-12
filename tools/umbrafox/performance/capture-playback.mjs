/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { connectControl, withTimeout } from "./helpers.mjs";

const PAGE_READ = `
const videos = document.querySelectorAll('video');
const base = {visibility: document.visibilityState, videoCount: videos.length};
if (videos.length !== 1) return base;
const v = videos[0];
const q = v.getVideoPlaybackQuality();
let bufferAhead = 0;
for (let i = 0; i < v.buffered.length; i++) {
  if (v.buffered.start(i) <= v.currentTime && v.buffered.end(i) >= v.currentTime) {
    bufferAhead = v.buffered.end(i) - v.currentTime;
    break;
  }
}
return {...base, source: v.currentSrc, paused: v.paused, ended: v.ended,
  seeking: v.seeking, rate: v.playbackRate, time: v.currentTime,
  width: v.videoWidth, height: v.videoHeight, readyState: v.readyState,
  bufferAhead, total: q.totalVideoFrames, dropped: q.droppedVideoFrames};
`;

function indexProcesses(processes) {
  const result = new Map();
  for (const item of processes) {
    const pid = item?.pid;
    result.set(pid, result.has(pid) ? null : item);
  }
  return result;
}

function validCPUCounter(item) {
  return (
    Number.isSafeInteger(item?.pid) &&
    item.pid > 0 &&
    (item.childID === null ||
      (Number.isSafeInteger(item.childID) && item.childID >= 0)) &&
    typeof item.type === "string" &&
    !!item.type.length &&
    Number.isSafeInteger(item.cpuTime) &&
    item.cpuTime >= 0
  );
}

function cpuDeltas(start, end) {
  const span = end.processAtMs - start.processAtMs;
  const validClock = [start.processAtMs, end.processAtMs].every(
    value => Number.isFinite(value) && value >= 0
  );
  const initial = indexProcesses(start.processes);
  const final = indexProcesses(end.processes);
  return end.processes.map(item => {
    const previous = initial.get(item?.pid);
    const valid =
      validClock &&
      Number.isFinite(span) &&
      span > 0 &&
      final.get(item?.pid) === item &&
      validCPUCounter(previous) &&
      validCPUCounter(item) &&
      previous.childID === item.childID &&
      previous.type === item.type &&
      item.cpuTime >= previous.cpuTime;
    const percent = valid
      ? (100 * (item.cpuTime - previous.cpuTime)) / 1000000 / span
      : null;
    return {
      pid: item?.pid ?? null,
      type: item?.type ?? null,
      percentOfOneCore: Number.isFinite(percent) ? percent : null,
    };
  });
}

export function summarizePlaybackInterval(start, end) {
  const excluded = reason => ({ state: "excluded", reason });
  const span = end.mediaAtMs - start.mediaAtMs;
  const a = start.media;
  const b = end.media;
  if (
    ![start.mediaAtMs, end.mediaAtMs].every(
      value => Number.isFinite(value) && value >= 0
    ) ||
    !(Number.isFinite(span) && span > 0) ||
    !Number.isSafeInteger(start.document) ||
    start.document <= 0 ||
    start.document !== end.document
  ) {
    return excluded("document-or-clock-change");
  }
  if (a.videoCount !== 1 || b.videoCount !== 1) {
    return excluded("ambiguous-video");
  }
  if (
    [a, b].some(
      media =>
        media.visibility !== "visible" ||
        media.paused !== false ||
        media.ended !== false ||
        media.seeking !== false
    )
  ) {
    return excluded("inactive");
  }
  if (
    ["sourceHash", "width", "height", "rate"].some(key => a[key] !== b[key])
  ) {
    return excluded("media-change");
  }
  if (
    [a, b].some(
      media =>
        typeof media.sourceHash !== "string" ||
        !/^[a-f0-9]{64}$/.test(media.sourceHash) ||
        !Number.isSafeInteger(media.width) ||
        media.width <= 0 ||
        !Number.isSafeInteger(media.height) ||
        media.height <= 0 ||
        !Number.isFinite(media.bufferAhead) ||
        media.bufferAhead < 0 ||
        !Number.isInteger(media.readyState) ||
        media.readyState < 0 ||
        media.readyState > 4
    )
  ) {
    return excluded("invalid-media-state");
  }
  if (
    [a, b].some(
      media =>
        !Number.isSafeInteger(media.total) ||
        !Number.isSafeInteger(media.dropped) ||
        media.dropped < 0 ||
        media.total < media.dropped
    ) ||
    b.total < a.total ||
    b.dropped < a.dropped ||
    b.dropped - a.dropped > b.total - a.total
  ) {
    return excluded("invalid-counter");
  }
  const advance = b.time - a.time;
  if (
    !Number.isFinite(advance) ||
    !Number.isFinite(a.rate) ||
    a.rate <= 0 ||
    advance < 0 ||
    advance > (span / 1000) * a.rate + 1
  ) {
    return excluded("time-discontinuity");
  }
  const frameCount = b.total - a.total;
  const dropped = b.dropped - a.dropped;
  const buffers = [a.bufferAhead, b.bufferAhead];
  return {
    state: frameCount ? "observed-playback" : "no-frame-advance",
    spanMs: span,
    playbackAdvanceSeconds: advance,
    frames: frameCount,
    dropped,
    dropPercent: frameCount ? (100 * dropped) / frameCount : null,
    minimumEndpointBufferSeconds: buffers.every(Number.isFinite)
      ? Math.min(...buffers)
      : null,
    endpointReadyStates: [a.readyState, b.readyState],
    cpu: cpuDeltas(start, end),
  };
}

function projectMedia(input) {
  if (!input || !Number.isSafeInteger(input.videoCount)) {
    throw new Error("Invalid media reply");
  }
  const media = {};
  for (const key of [
    "visibility",
    "videoCount",
    "paused",
    "ended",
    "seeking",
    "rate",
    "time",
    "width",
    "height",
    "readyState",
    "bufferAhead",
    "total",
    "dropped",
  ]) {
    media[key] = input[key] ?? null;
  }
  if (input.videoCount === 1) {
    if (typeof input.source !== "string" || input.source.length > 16384) {
      throw new Error("Invalid media source identity");
    }
    media.sourceHash = createHash("sha256").update(input.source).digest("hex");
  }
  return media;
}

function projectProcesses(root) {
  const result = [];
  const pending = [root];
  while (pending.length) {
    const item = pending.pop();
    if (!item || result.length >= 512 || (item.threads?.length ?? 0) > 512) {
      throw new Error("Invalid or oversized process tree");
    }
    result.push({
      pid: item.pid,
      childID: item.childID ?? null,
      type: item.type,
      cpuTime: item.cpuTime,
      threads: (item.threads ?? []).map(thread => ({
        tid: thread.tid,
        name: thread.name,
        cpuTime: thread.cpuTime,
      })),
    });
    for (const child of item.children ?? []) {
      if (pending.length + result.length >= 512) {
        throw new Error("Invalid or oversized process tree");
      }
      pending.push(child);
    }
  }
  return result;
}

export async function capturePlayback({
  request,
  context,
  count = 31,
  signal,
  now = () => performance.now(),
  wait = ms => delay(ms, undefined, { signal }),
  save = async () => {},
}) {
  if (!Number.isInteger(count) || count < 2 || count > 31) {
    throw new Error("Invalid sample count (2..31)");
  }
  if (!Number.isSafeInteger(context) || context <= 0) {
    throw new Error("Invalid context");
  }
  const samples = [];
  let documentID;
  for (let index = 0; index < count; index++) {
    signal?.throwIfAborted();
    const start = now();
    const reply = await withTimeout(
      request("umbrafox.script.execute", {
        context,
        document: documentID,
        body: PAGE_READ,
        timeoutMs: 3000,
      }),
      4000,
      "Playback read",
      signal
    );
    const mediaEnd = now();
    if (
      !Number.isSafeInteger(reply?.document) ||
      reply.document <= 0 ||
      reply.result?.type !== "json"
    ) {
      throw new Error("Invalid playback envelope");
    }
    documentID ??= reply.document;
    if (documentID !== reply.document) {
      throw new Error("Playback document changed");
    }
    const media = projectMedia(reply.result.value);
    signal?.throwIfAborted();
    const processStart = now();
    const processes = await withTimeout(
      request("umbrafox.performance.snapshot", {
        includeThreads: true,
        includeWindows: false,
      }),
      4000,
      "Playback processes",
      signal
    );
    const processEnd = now();
    const record = {
      document: documentID,
      mediaAtMs: (start + mediaEnd) / 2,
      processAtMs: (processStart + processEnd) / 2,
      mediaRPCMs: mediaEnd - start,
      processRPCMs: processEnd - processStart,
      media,
      processes: projectProcesses(processes.process),
    };
    signal?.throwIfAborted();
    await withTimeout(save(record, index), 2000, "Playback save", signal);
    samples.push(record);
    if (index + 1 < count) {
      await wait(2000);
    }
  }
  return {
    version: 1,
    context,
    samples: samples.length,
    intervals: samples
      .slice(1)
      .map((sample, index) =>
        summarizePlaybackInterval(samples[index], sample)
      ),
    limitations: [
      "Discrete endpoints do not exclude between-sample stalls, seeks or replacement.",
      "Frame counters are not physical presentation or a causal attribution.",
      "CPU and media RPCs are sequential; their timestamps are host midpoints.",
      "PID/childID joins exclude missing or reset counters, not every PID reuse race.",
      "Observer overhead is measured by RPC duration, not eliminated.",
    ],
  };
}

async function main() {
  const [discoveryPath, contextArg, output, countArg = "31"] =
    process.argv.slice(2);
  if (
    !discoveryPath ||
    !output ||
    !isAbsolute(discoveryPath) ||
    !isAbsolute(output)
  ) {
    throw new Error(
      "Usage: capture-playback.mjs ABS_DISCOVERY CONTEXT NEW_ABS_OUTPUT [2..31]"
    );
  }
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new Error("Capture deadline")),
    75000
  );
  const bounded = promise =>
    withTimeout(promise, 3000, "Playback file operation", controller.signal);
  let control;
  try {
    await bounded(mkdir(output, { mode: 0o700 }));
    const discovery = JSON.parse(
      await bounded(
        readFile(discoveryPath, {
          encoding: "utf8",
          signal: controller.signal,
        })
      )
    );
    control = await connectControl(discovery, controller.signal);
    const browserStatus = await control.request("umbrafox.status");
    await bounded(
      writeFile(
        join(output, "environment.json"),
        JSON.stringify(
          {
            startedAt: new Date().toISOString(),
            buildID: browserStatus.appBuildID,
            version: browserStatus.appVersion,
            context: Number(contextArg),
            plannedSamples: Number(countArg),
            intervalWaitMs: 2000,
          },
          null,
          2
        ) + "\n",
        { mode: 0o600, flag: "wx", signal: controller.signal }
      )
    );
    const report = await capturePlayback({
      request: (...args) => control.request(...args),
      context: Number(contextArg),
      count: Number(countArg),
      signal: controller.signal,
      save: (record, index) => {
        const text = JSON.stringify(record, null, 2) + "\n";
        if (Buffer.byteLength(text) > 512 * 1024) {
          throw new Error("Sample byte cap");
        }
        return writeFile(join(output, `sample-${index}.json`), text, {
          mode: 0o600,
          flag: "wx",
          signal: controller.signal,
        });
      },
    });
    await bounded(
      writeFile(
        join(output, "summary.json"),
        JSON.stringify(report, null, 2) + "\n",
        {
          mode: 0o600,
          flag: "wx",
          signal: controller.signal,
        }
      )
    );
    process.stdout.write(
      JSON.stringify({
        output,
        intervals: report.intervals.map(({ cpu: _cpu, ...rest }) => rest),
      }) + "\n"
    );
  } finally {
    clearTimeout(timer);
    control?.close();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch(() => {
    console.error(
      "Playback capture failed; retained samples are partial, not a complete run."
    );
    process.exitCode = 1;
  });
}
