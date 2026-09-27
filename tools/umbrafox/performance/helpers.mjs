/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Buffer } from "node:buffer";
import process from "node:process";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { createServer } from "node:http";
import { isAbsolute } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

export function parseArgs(args) {
  const options = {
    trials: 7,
    warmup: 2,
    "timeout-ms": 120000,
    suite: "basic",
  };
  const known = new Set([
    "binary",
    "output",
    "profile",
    "bus",
    "userland-case",
    ...Object.keys(options),
  ]);
  const seen = new Set();
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index].slice(2);
    if (!args[index].startsWith("--") || !known.has(key)) {
      throw new Error("Unknown option");
    }
    if (seen.has(key)) {
      throw new Error(`Duplicate option: ${key}`);
    }
    if (args[index + 1] === undefined || args[index + 1].startsWith("--")) {
      throw new Error(`Missing value: ${key}`);
    }
    seen.add(key);
    options[key] = args[index + 1];
  }
  for (const key of ["binary", "output", "bus"]) {
    if (typeof options[key] !== "string" || !isAbsolute(options[key])) {
      throw new Error(`${key} must be absolute`);
    }
  }
  if (!["on", "off"].includes(options.profile)) {
    throw new Error("--profile must be on or off");
  }
  if (!["basic", "userland-cache"].includes(options.suite)) {
    throw new Error("--suite must be basic or userland-cache");
  }
  if (options.suite === "userland-cache") {
    if (
      !["none", "disabled", "unrelated", "visited"].includes(
        options["userland-case"]
      )
    ) {
      throw new Error(
        "--userland-case must be none, disabled, unrelated or visited"
      );
    }
    if (options.profile !== "off") {
      throw new Error("userland-cache requires --profile off");
    }
  } else if (Object.hasOwn(options, "userland-case")) {
    throw new Error("--userland-case is forbidden for the basic suite");
  }
  for (const [key, minimum, maximum] of [
    ["trials", 3, 30],
    ["warmup", 1, 10],
    ["timeout-ms", 1000, 300000],
  ]) {
    const value = Number(options[key]);
    if (!Number.isInteger(value) || value < minimum || value > maximum) {
      throw new Error(`Invalid ${key}`);
    }
    options[key] = value;
  }
  return options;
}

export function summarize(samples) {
  if (
    !Array.isArray(samples) ||
    samples.length < 2 ||
    samples.some(
      value => typeof value !== "number" || !Number.isFinite(value) || value < 0
    )
  ) {
    throw new Error("Expected at least two finite nonnegative samples");
  }
  const sorted = [...samples].sort((left, right) => left - right);
  const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  const variance =
    samples.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (samples.length - 1);
  const middle = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
  const result = {
    samples: [...samples],
    count: samples.length,
    mean,
    median,
    standardDeviation: Math.sqrt(variance),
    minimum: sorted[0],
    maximum: sorted.at(-1),
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
  };
  if (
    Object.values(result).some(
      value => typeof value === "number" && !Number.isFinite(value)
    )
  ) {
    throw new Error("Nonfinite summary");
  }
  return result;
}

export const expectedChecksums = {
  js: 4290276580,
  "dom-batched": 25600,
  "dom-interleaved": 25600,
  canvas: 2296114373,
};

export function validateResult(result, config) {
  if (
    result?.version !== 1 ||
    !Array.isArray(result.samples) ||
    result.samples.length !== (config.trials + config.warmup) * 4
  ) {
    throw new Error("Invalid result shape or sample count");
  }
  const seen = new Set();
  for (const sample of result.samples) {
    if (!sample || !Object.hasOwn(expectedChecksums, sample.workload)) {
      throw new Error("Unknown workload");
    }
    if (!["warmup", "trial"].includes(sample.stage)) {
      throw new Error("Invalid stage");
    }
    const count = sample.stage === "warmup" ? config.warmup : config.trials;
    if (
      !Number.isInteger(sample.index) ||
      sample.index < 0 ||
      sample.index >= count
    ) {
      throw new Error("Invalid trial index");
    }
    if (
      typeof sample.durationMs !== "number" ||
      !Number.isFinite(sample.durationMs) ||
      sample.durationMs < 0 ||
      sample.durationMs > (config["timeout-ms"] ?? 300000)
    ) {
      throw new Error("Invalid duration");
    }
    if (sample.checksum !== expectedChecksums[sample.workload]) {
      throw new Error(`Incorrect ${sample.workload} checksum`);
    }
    const key = `${sample.stage}:${sample.index}:${sample.workload}`;
    if (seen.has(key)) {
      throw new Error("Duplicate sample");
    }
    seen.add(key);
  }
  return result;
}

export function browserEnvironment(input, profile, suite = "basic") {
  if (suite === "userland-cache" && profile !== "off") {
    throw new Error("userland-cache requires --profile off");
  }
  const env = {};
  for (const key of [
    "PATH",
    "HOME",
    "LANG",
    "LC_ALL",
    "LC_CTYPE",
    "TZ",
    "XDG_RUNTIME_DIR",
  ]) {
    if (input[key] !== undefined) {
      env[key] = input[key];
    }
  }
  const overrideNames = [
    "LP_PERF",
    "LP_DEBUG",
    "GALLIVM_PERF",
    "GALLIVM_DEBUG",
    "MESA_SHADER_CACHE_DISABLE",
    "IONPERF",
    "IONSPEW",
  ];
  const overridePresence = Object.fromEntries(
    overrideNames.map(key => [
      key,
      Object.hasOwn(input, key) ? "present-scrubbed" : null,
    ])
  );
  const scrubbed = Object.keys(input)
    .filter(key =>
      /^(MESA_|GALLIUM_|GALLIVM_|LP_|ION|LIBGL_|EGL_|DRI_|MOZ_|GDK_|GTK_|LD_|__GL_|VK_)/.test(
        key
      )
    )
    .sort();
  Object.assign(env, {
    MOZ_HEADLESS: "1",
    MOZ_HEADLESS_WIDTH: "1024",
    MOZ_HEADLESS_HEIGHT: "768",
  });
  if (profile === "on") {
    Object.assign(env, {
      MOZ_PROFILER_STARTUP: "1",
      MOZ_PROFILER_STARTUP_ENTRIES: "4194304",
      MOZ_PROFILER_STARTUP_INTERVAL: "1",
      MOZ_PROFILER_STARTUP_FILTERS:
        "GeckoMain,Compositor,Renderer,TaskController,StyleThread",
      MOZ_PROFILER_STARTUP_FEATURES: "stackwalk,js,processcpu,nomarkerstacks",
    });
  }
  if (suite === "userland-cache") {
    env.MOZ_LOG = "timestamp,sync,ScriptLoader:4";
  }
  return { env, scrubbed, overridePresence };
}

export function validateLogEvidence(log, suite) {
  if (suite === "userland-cache" && log?.droppedBytes !== 0) {
    throw new Error("Diagnostic browser log evidence is missing or truncated");
  }
}

export function withTimeout(promise, milliseconds, label, signal) {
  return new Promise((resolve, reject) => {
    const finish = (callback, value) => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      callback(value);
    };
    const abort = () => finish(reject, signal.reason ?? new Error("Aborted"));
    const timer = setTimeout(
      () => finish(reject, new Error(`${label} timed out`)),
      milliseconds
    );
    promise.then(
      value => finish(resolve, value),
      error => finish(reject, error)
    );
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) {
      abort();
    }
  });
}

export async function readIdentity(pid) {
  const text = await readFile(`/proc/${pid}/stat`, "utf8");
  const fields = text
    .slice(text.lastIndexOf(")") + 2)
    .trim()
    .split(/\s+/);
  return {
    pid: Number(text.slice(0, text.indexOf(" "))),
    state: fields[0],
    parent: Number(fields[1]),
    group: Number(fields[2]),
    session: Number(fields[3]),
    start: fields[19],
  };
}

export async function spawnOwned(binary, args, options = {}) {
  const child = spawn(binary, args, {
    ...options,
    detached: true,
    stdio: options.stdio ?? "ignore",
  });
  const owned = { child, identity: null, identityError: null, outcome: null };
  owned.completion = new Promise(resolve => {
    const finish = outcome => {
      owned.outcome ??= outcome;
      resolve(owned.outcome);
    };
    child.once("error", error =>
      finish({ error: { code: error.code ?? "SPAWN_ERROR" } })
    );
    child.once("exit", (code, signal) => finish({ code, signal }));
  });
  owned.closed = new Promise(resolve => child.once("close", resolve));
  await new Promise(resolve => {
    child.once("spawn", resolve);
    child.once("error", resolve);
  });
  if (child.pid) {
    try {
      owned.identity = await readIdentity(child.pid);
      const identity = owned.identity;
      if (
        identity.pid !== child.pid ||
        identity.parent !== process.pid ||
        identity.group !== child.pid ||
        identity.session !== child.pid
      ) {
        throw new Error("Detached child identity mismatch");
      }
    } catch (error) {
      owned.identityError = error.code ?? error.message;
    }
  }
  return owned;
}

async function groupMembers(identity) {
  const members = [];
  for (const entryName of await readdir("/proc")) {
    if (!/^\d+$/.test(entryName)) {
      continue;
    }
    try {
      const item = await readIdentity(Number(entryName));
      if (
        item.group === identity.group &&
        item.session === identity.session &&
        !["Z", "X"].includes(item.state)
      ) {
        members.push(item);
      }
    } catch (error) {
      if (!["ENOENT", "ESRCH"].includes(error.code)) {
        throw error;
      }
    }
  }
  return members;
}

export async function stopOwned(owned, timeoutMs = 5000) {
  const failed = (reason, members = []) => {
    owned.child.unref();
    owned.child.stdout?.destroy();
    owned.child.stderr?.destroy();
    return {
      status: "cleanup-failed",
      reason,
      members,
      outcome: owned.outcome,
    };
  };
  if (!owned.child.pid) {
    return { status: "clean", outcome: await owned.completion };
  }
  if (!owned.identity || owned.identityError) {
    return failed("Child identity was not proven");
  }
  const identity = owned.identity;
  if (
    identity.pid !== owned.child.pid ||
    identity.group !== identity.pid ||
    identity.session !== identity.pid ||
    identity.parent !== process.pid
  ) {
    return failed("Stored child identity mismatch; no signal sent");
  }
  let current;
  try {
    current = await readIdentity(identity.pid);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
  if (current) {
    if (
      current.pid !== owned.child.pid ||
      current.start !== identity.start ||
      current.group !== identity.pid ||
      current.session !== identity.pid ||
      current.parent !== process.pid
    ) {
      return failed("Child identity changed; no signal sent");
    }
    try {
      process.kill(-owned.child.pid, "SIGTERM");
    } catch (error) {
      if (error.code !== "ESRCH") {
        throw error;
      }
    }
  }
  const deadline = Date.now() + timeoutMs;
  let members;
  do {
    members = await groupMembers(identity);
    if (!members.length && owned.outcome) {
      return { status: "clean", outcome: owned.outcome };
    }
    await delay(25);
  } while (Date.now() < deadline);
  return failed(
    "Own process group did not exit; no SIGKILL escalation",
    members
  );
}

export function validateDiscovery(discovery) {
  try {
    const url = new URL(discovery.websocketUrl);
    if (
      !["localhost", "127.0.0.1"].includes(discovery.host) ||
      !Number.isInteger(discovery.port) ||
      discovery.port < 1 ||
      discovery.port > 65535 ||
      discovery.path !== "/umbrafox-control" ||
      typeof discovery.token !== "string" ||
      !discovery.token
    ) {
      throw new Error();
    }
    if (
      url.protocol !== "ws:" ||
      url.hostname !== discovery.host ||
      Number(url.port) !== discovery.port ||
      url.pathname !== discovery.path ||
      url.username ||
      url.password ||
      url.hash ||
      [...url.searchParams.keys()].length !== 1 ||
      url.searchParams.get("token") !== discovery.token
    ) {
      throw new Error();
    }
    return url.href;
  } catch {
    throw new Error("Invalid owner-local discovery");
  }
}

export async function connectControl(
  discovery,
  signal,
  WebSocketClass = WebSocket
) {
  const socket = new WebSocketClass(validateDiscovery(discovery));
  let nextID = 0;
  const pending = new Map();
  let failed = false;
  const fail = () => {
    failed = true;
    for (const { reject } of pending.values()) {
      reject(new Error("UmbraLink connection failed"));
    }
    pending.clear();
  };
  socket.addEventListener("error", fail);
  socket.addEventListener("close", fail);
  socket.addEventListener("message", event => {
    let reply;
    try {
      reply = JSON.parse(event.data);
    } catch {
      fail();
      return;
    }
    const item = pending.get(reply?.id);
    if (!item) {
      return;
    }
    if (reply.error || !Object.hasOwn(reply, "result")) {
      item.reject(new Error("UmbraLink command failed"));
    } else {
      item.resolve(reply.result);
    }
  });
  try {
    await withTimeout(
      new Promise((resolve, reject) => {
        socket.addEventListener("open", resolve, { once: true });
        socket.addEventListener(
          "error",
          () => reject(new Error("UmbraLink open failed")),
          { once: true }
        );
        socket.addEventListener(
          "close",
          () => reject(new Error("UmbraLink closed before opening")),
          { once: true }
        );
      }),
      5000,
      "UmbraLink connect",
      signal
    );
  } catch (error) {
    socket.close();
    throw error;
  }
  return {
    async request(method, params = {}) {
      if (failed || socket.readyState !== 1) {
        throw new Error("UmbraLink connection failed");
      }
      signal?.throwIfAborted();
      const id = ++nextID;
      try {
        return await withTimeout(
          new Promise((resolve, reject) => {
            pending.set(id, { resolve, reject });
            socket.send(JSON.stringify({ id, method, params }));
          }),
          15000,
          method,
          signal
        );
      } finally {
        pending.delete(id);
      }
    },
    close() {
      fail();
      socket.close();
    },
  };
}

export function createBoundedLogger(write, scrub, limit = 8 * 1024 * 1024) {
  let queue = Promise.resolve();
  let failure;
  let writtenBytes = 0;
  let droppedBytes = 0;
  const buffers = new Map();
  const append = value => {
    const text = scrub(value);
    const bytes = Buffer.byteLength(text);
    if (writtenBytes + bytes > limit) {
      droppedBytes += bytes;
      return;
    }
    writtenBytes += bytes;
    queue = queue
      .then(() => write(text))
      .catch(error => {
        failure ??= error;
      });
  };
  return {
    push(source, chunk) {
      const buffered = (buffers.get(source) ?? "") + chunk;
      const newline = buffered.lastIndexOf("\n");
      if (newline !== -1) {
        append(buffered.slice(0, newline + 1));
        buffers.set(source, buffered.slice(newline + 1));
      } else if (buffered.length > 65536) {
        droppedBytes += Buffer.byteLength(buffered);
        buffers.set(source, "");
      } else {
        buffers.set(source, buffered);
      }
    },
    async finish() {
      for (const text of buffers.values()) {
        append(text);
      }
      buffers.clear();
      await queue;
      if (failure) {
        throw failure;
      }
      return { writtenBytes, droppedBytes };
    },
  };
}

export async function createFixtureServer(config) {
  const assets = new Map();
  for (const [assetName, type] of [
    ["index.html", "text/html"],
    ["fixture.css", "text/css"],
    ["fixture.mjs", "text/javascript"],
  ]) {
    assets.set(assetName, {
      type,
      data: await readFile(new URL(`fixture/${assetName}`, import.meta.url)),
    });
  }
  const prefix = `/${randomBytes(18).toString("hex")}/`;
  let startResponse;
  let started = false;
  let received = false;
  let resolveResult;
  const result = new Promise(resolve => {
    resolveResult = resolve;
  });
  let serverOrigin;
  const server = createServer(async (request, response) => {
    const end = (code, data, type = "text/plain") => {
      response.writeHead(code, {
        "Content-Type": type,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'self'; frame-ancestors 'none'",
      });
      response.end(data);
    };
    if (
      request.headers.host !== new URL(serverOrigin).host ||
      (request.headers.origin && request.headers.origin !== serverOrigin)
    ) {
      end(403, "Forbidden");
      return;
    }
    if (!request.url.startsWith(prefix)) {
      end(404, "Not found");
      return;
    }
    const path = request.url.slice(prefix.length);
    if (request.method === "GET" && (path === "" || assets.has(path))) {
      const asset = assets.get(path || "index.html");
      end(200, asset.data, asset.type);
      return;
    }
    if (request.method === "GET" && path === "start") {
      if (startResponse) {
        end(409, "Already waiting");
        return;
      }
      if (started) {
        end(200, JSON.stringify(config), "application/json");
      } else {
        startResponse = () =>
          end(200, JSON.stringify(config), "application/json");
      }
      return;
    }
    if (request.method !== "POST" || path !== "result") {
      end(404, "Not found");
      return;
    }
    if (received || !started) {
      end(409, "Not accepting results");
      return;
    }
    if (request.headers["content-type"] !== "application/json") {
      end(415, "Expected JSON");
      return;
    }
    try {
      let size = 0;
      const chunks = [];
      for await (const chunk of request) {
        size += chunk.length;
        if (size > 65536) {
          end(413, "Result too large");
          return;
        }
        chunks.push(chunk);
      }
      const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (received) {
        end(409, "Already received");
        return;
      }
      received = true;
      end(200, "Received");
      resolveResult(value);
    } catch {
      if (!response.headersSent) {
        end(400, "Malformed result");
      }
    }
  });
  server.requestTimeout = 5000;
  server.headersTimeout = 5000;
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  serverOrigin = `http://127.0.0.1:${server.address().port}`;
  return {
    url: `${serverOrigin}${prefix}`,
    result,
    start() {
      started = true;
      startResponse?.();
    },
    async close() {
      server.closeAllConnections();
      await new Promise((resolve, reject) =>
        server.close(error => (error ? reject(error) : resolve()))
      );
    },
  };
}
