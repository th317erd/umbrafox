/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Buffer } from "node:buffer";
import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";

const cases = new Set(["none", "unrelated", "matching-no-handler"]);
const settleMs = 10000;
const source = String.raw`(async () => {
  const config = JSON.parse(document.documentElement.dataset.fixtureConfig);
  const count = () => {
    const value = document.documentElement.getAttribute("data-lifecycle-start");
    return value === null ? null : Number(value);
  };
  const sentinel = () => document.documentElement.getAttribute("data-lifecycle-finish");
  const firstStartupCount = count();
  const firstSentinel = sentinel();
  const post = async value => {
    const response = await fetch("./receipt", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value)
    });
    if (!response.ok) { throw new Error("Lifecycle receipt rejected"); }
    return response.json();
  };
  try {
    await new Promise(resolve => addEventListener("load", resolve, { once: true }));
    let bytes = new Uint8Array(65536).fill(42);
    const container = document.createElement("div");
    for (let i = 0; i < 128; i++) {
      const node = document.createElement("span");
      node.textContent = String(i);
      container.append(node);
    }
    document.body.append(container);
    const domChecksum = [...container.children].reduce((sum, node) => sum + Number(node.textContent), 0);
    const byteChecksum = bytes.reduce((sum, byte) => sum + byte, 0);
    bytes = null;
    const nodesCreated = container.childElementCount;
    container.replaceChildren();
    container.remove();
    const receipt = {
      kind: "loaded", id: config.id, readyState: document.readyState,
      webdriver: navigator.webdriver, firstStartupCount, startupCount: count(),
      firstSentinel, sentinel: sentinel(), domChecksum, byteChecksum,
      nodesCreated, nodesRemoved: nodesCreated - container.childElementCount,
      frames: document.querySelectorAll("iframe").length
    };
    let reply = await post(receipt);
    if (config.role === "frame") {
      parent.postMessage({ token: config.token, receipt }, location.origin);
      return;
    }
    if (config.role === "top") {
      for (const child of reply.children) {
        const frame = document.createElement("iframe");
        let timer;
        let handler;
        let onLoad;
        let onError;
        let frameLoads = 0;
        try {
          await new Promise((resolve, reject) => {
            let received = false;
            const complete = () => { if (received && frameLoads === 1) { resolve(); } };
            onLoad = () => {
              frameLoads++;
              if (frameLoads !== 1) { reject(new Error("Duplicate frame load")); }
              complete();
            };
            onError = () => reject(new Error("Frame failed"));
            handler = event => {
              if (event.source !== frame.contentWindow || event.origin !== location.origin ||
                  event.data?.token !== config.token || event.data?.receipt?.id !== child.id || received) {
                reject(new Error("Stale or unexpected frame completion")); return;
              }
              received = true;
              complete();
            };
            addEventListener("message", handler);
            frame.addEventListener("load", onLoad);
            frame.addEventListener("error", onError);
            timer = setTimeout(() => reject(new Error("Frame completion timed out")), 10000);
            frame.src = child.url;
            document.body.append(frame);
          });
        } finally {
          clearTimeout(timer);
          removeEventListener("message", handler);
          frame.removeEventListener("load", onLoad);
          frame.removeEventListener("error", onError);
          frame.remove();
        }
        await post({ kind: "removed", id: child.id, frameLoads,
          frames: document.querySelectorAll("iframe").length });
      }
      reply = await post({ kind: "cycle", id: config.id,
        framesCreated: 2, framesLoaded: 2, framesRemoved: 2,
        frames: document.querySelectorAll("iframe").length });
    }
    if (reply.next) { location.replace(reply.next); }
  } catch (error) {
    await post({ kind: "error", message: String(error.message).slice(0, 240) }).catch(() => {});
    console.error("Lifecycle fixture failed", error);
  }
})();`;

const sourceSHA256 = createHash("sha256").update(source).digest("hex");

function freezePlan(value) {
  for (const item of Object.values(value)) {
    if (item && typeof item === "object") {
      freezePlan(item);
    }
  }
  return Object.freeze(value);
}

function descriptor(planName) {
  const soak = planName === "soak-30m";
  return freezePlan({
    name: planName,
    cases: soak ? ["none"] : [...cases],
    counts: {
      cycles: soak ? 102 : 12,
      documents: soak ? 318 : 40,
      frames: soak ? 204 : 24,
      receipts: soak ? 624 : 76,
      steps: soak ? 942 : 116,
    },
    checkpoints: Array.from({ length: soak ? 11 : 3 }, (_, id) => ({
      id,
      settleMs: soak ? [60000, ...Array(9).fill(120000), 300000][id] : settleMs,
      completedCycles: soak ? 2 + 10 * id : [2, 7, 12][id],
      documentsCompleted: soak ? 8 + 31 * id : [8, 24, 40][id],
    })),
    limits: {
      receipts: soak ? 640 : 128,
      requests: soak ? 1280 : 512,
      assets: soak ? 318 : 512,
      bodyBytes: 16384,
      activeRequests: 4,
      connections: 8,
      maxQuietMs: soak ? 1800000 : 120000,
    },
    budget: {
      minMs: soak ? 1800000 : 45000,
      maxMs: soak ? 1800000 : 120000,
      totalMs: soak ? 1800000 : null,
      cleanupMs: 15000,
      terminalMs: 2000,
      finalizationMs: soak ? 150000 : 0,
    },
    evidence: {
      fixtureBytes: soak ? 887347 : 1.5 * 1024 ** 2,
      envelopeBytes: 16384,
      errorBytes: 2048,
      resourceRecords: soak ? 384 : null,
      historicalPIDs: soak ? 512 : null,
      resourceFileBytes: 64 * 1024,
      checkpointFileBytes: 1024 ** 2,
      attributionFileBytes: 64 * 1024,
      baselineFileBytes: 64 * 1024,
      otherBytes: 12 * 1024 ** 2,
      ordinaryBytes: 54 * 1024 ** 2,
      logBytes: 8 * 1024 ** 2,
      terminalFixtureBytes: 1.5 * 1024 ** 2,
      terminalRunBytes: 0.5 * 1024 ** 2,
    },
  });
}

const smokePlan = descriptor("smoke");
const soakPlan = descriptor("soak-30m");

export function getLifecyclePlan(planName = "smoke") {
  if (planName === "smoke") {
    return smokePlan;
  }
  if (planName === "soak-30m") {
    return soakPlan;
  }
  throw new Error("Unknown lifecycle plan");
}

function makePlan(trustedPlan) {
  const documents = [];
  const steps = [];
  function addDocument(role, cycle = null, checkpoint = null) {
    const item = { id: documents.length, role, cycle, checkpoint };
    documents.push(item);
    steps.push(
      { kind: "document", id: item.id },
      { kind: "loaded", id: item.id }
    );
    return item;
  }
  addDocument("initial");
  for (let cycle = 0; cycle < trustedPlan.counts.cycles; cycle++) {
    const topDocument = addDocument("top", cycle);
    for (let frame = 0; frame < 2; frame++) {
      const child = addDocument("frame", cycle);
      steps.push({ kind: "removed", id: child.id });
    }
    steps.push({ kind: "cycle", id: topDocument.id });
    const checkpoint = trustedPlan.checkpoints.find(
      item => item.completedCycles === cycle + 1
    );
    if (checkpoint) {
      addDocument("settled", null, checkpoint.id);
    }
  }
  return { documents, steps };
}

function validateOptions(options) {
  const trustedPlan = getLifecyclePlan(options?.["lifecycle-plan"]);
  const soak = trustedPlan === soakPlan;
  if (
    !trustedPlan.cases.includes(options?.["lifecycle-case"]) ||
    (options.profile !== undefined && options.profile !== "off") ||
    (options.suite !== undefined && options.suite !== "lifecycle") ||
    Object.hasOwn(options, "lifecycle-observer") ||
    (options["timeout-ms"] !== undefined &&
      (!Number.isInteger(options["timeout-ms"]) ||
        options["timeout-ms"] < (soak ? trustedPlan.budget.totalMs : 1000) ||
        options["timeout-ms"] > trustedPlan.budget.maxMs))
  ) {
    throw new Error("Invalid lifecycle configuration");
  }
  return trustedPlan;
}

function exactFields(value, fields) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length === fields.length &&
    fields.every(field => Object.hasOwn(value, field))
  );
}

export function validateLifecycleMetadata(metadata, planName = "smoke") {
  const trustedPlan = getLifecyclePlan(planName);
  const plan = makePlan(trustedPlan);
  const soak = trustedPlan === soakPlan;
  if (soak) {
    for (const [actual, expected] of [
      [metadata?.documents, plan.documents],
      [metadata?.steps, plan.steps],
      [metadata?.checkpoints, trustedPlan.checkpoints],
    ]) {
      if (
        !Array.isArray(actual) ||
        actual.length !== expected.length ||
        actual.some(
          (item, id) =>
            !exactFields(item, Object.keys(expected[id])) ||
            Object.keys(expected[id]).some(
              key => item[key] !== expected[id][key]
            )
        )
      ) {
        throw new Error("Invalid lifecycle metadata record");
      }
    }
  }
  if (
    JSON.stringify(metadata?.documents) !== JSON.stringify(plan.documents) ||
    JSON.stringify(metadata?.steps) !== JSON.stringify(plan.steps) ||
    typeof metadata?.sentinel !== "string" ||
    !/^\/[a-f0-9]{36}\/$/.test(metadata.sentinel) ||
    metadata?.sourceSHA256 !== sourceSHA256 ||
    metadata?.settleMs !== (soak ? null : settleMs) ||
    (soak &&
      (!exactFields(metadata, [
        "documents",
        "steps",
        "originA",
        "originB",
        "sentinel",
        "sourceSHA256",
        "settleMs",
        "plan",
        "checkpoints",
      ]) ||
        metadata.plan !== trustedPlan.name ||
        JSON.stringify(metadata.checkpoints) !==
          JSON.stringify(trustedPlan.checkpoints)))
  ) {
    throw new Error("Invalid lifecycle plan metadata");
  }
  const origins = [metadata.originA, metadata.originB];
  if (
    origins[0] === origins[1] ||
    origins.some(item => {
      const match =
        typeof item === "string" &&
        /^http:\/\/127\.0\.0\.1:(\d{1,5})$/.exec(item);
      return !match || Number(match[1]) < 1 || Number(match[1]) > 65535;
    })
  ) {
    throw new Error("Invalid lifecycle loopback origins");
  }
  return metadata;
}

function validateReceipt(value, step, state, metadata) {
  if (
    !value ||
    value.kind !== step?.kind ||
    value.id !== step.id ||
    value.frames !== 0
  ) {
    throw new Error("Unexpected lifecycle receipt sequence");
  }
  if (value.kind === "loaded") {
    if (Object.keys(value).length !== 13) {
      throw new Error("Unexpected load receipt fields");
    }
    const matching = state === "matching-no-handler";
    if (
      value.readyState !== "complete" ||
      value.webdriver !== false ||
      value.firstStartupCount !== (matching ? 1 : null) ||
      value.startupCount !== (matching ? 1 : null) ||
      value.firstSentinel !== (matching ? metadata.sentinel : null) ||
      value.sentinel !== (matching ? metadata.sentinel : null) ||
      value.domChecksum !== 8128 ||
      value.byteChecksum !== 2752512 ||
      value.nodesCreated !== 128 ||
      value.nodesRemoved !== 128
    ) {
      throw new Error("Lifecycle load, startup or checksum oracle failed");
    }
  } else if (value.kind === "removed") {
    if (Object.keys(value).length !== 4 || value.frameLoads !== 1) {
      throw new Error("Frame load count mismatch");
    }
  } else if (value.kind === "cycle") {
    if (
      Object.keys(value).length !== 6 ||
      value.framesCreated !== 2 ||
      value.framesLoaded !== 2 ||
      value.framesRemoved !== 2
    ) {
      throw new Error("Frame completion or removal count mismatch");
    }
  } else {
    throw new Error("Unknown lifecycle receipt");
  }
}

function countsFor(receipts, state, documents) {
  return {
    documents: receipts.filter(value => value.kind === "loaded").length,
    cycles: receipts.filter(value => value.kind === "cycle").length,
    framesLoaded: receipts.filter(
      value => value.kind === "loaded" && documents[value.id].role === "frame"
    ).length,
    framesRemoved: receipts.filter(value => value.kind === "removed").length,
    startupCompletions:
      state === "matching-no-handler"
        ? receipts.filter(value => value.kind === "loaded").length
        : 0,
  };
}

export function validateLifecycleResult(value, options) {
  const trustedPlan = validateOptions(options);
  const state = options["lifecycle-case"];
  const plan = makePlan(trustedPlan);
  validateLifecycleMetadata(value?.metadata, trustedPlan.name);
  const receiptSteps = plan.steps.filter(step => step.kind !== "document");
  if (
    value?.version !== 1 ||
    value.suite !== "lifecycle" ||
    value.state !== state ||
    value.classification !==
      (state === "unrelated" ? "configured-unrelated" : state) ||
    value.status !== "completed" ||
    value.dropped !== 0 ||
    !Array.isArray(value.receipts) ||
    value.receipts.length !== trustedPlan.counts.receipts ||
    !Array.isArray(value.checkpoints) ||
    value.checkpoints.length !== trustedPlan.checkpoints.length ||
    !Array.isArray(value.requests) ||
    value.requests.length > trustedPlan.limits.requests ||
    value.pendingRequests !== 0 ||
    !value.started ||
    value.error !== null ||
    (trustedPlan === soakPlan && value.errorClipped !== false)
  ) {
    throw new Error("Invalid lifecycle result shape or completeness");
  }
  value.receipts.forEach((receipt, index) =>
    validateReceipt(receipt, receiptSteps[index], state, value.metadata)
  );
  value.checkpoints.forEach((checkpoint, id) => {
    const expected = trustedPlan.checkpoints[id];
    if (
      checkpoint.id !== id ||
      checkpoint.completedCycles !== expected.completedCycles ||
      checkpoint.documentsCompleted !== expected.documentsCompleted ||
      checkpoint.settleMs !== expected.settleMs ||
      !Number.isFinite(checkpoint.quietMs) ||
      checkpoint.quietMs < expected.settleMs ||
      checkpoint.quietMs > trustedPlan.limits.maxQuietMs
    ) {
      throw new Error("Invalid lifecycle checkpoint evidence");
    }
  });
  if (
    value.requests.filter(entry => entry.route === "fixture.js").length >
      trustedPlan.limits.assets ||
    JSON.stringify(value.counts) !==
      JSON.stringify(countsFor(value.receipts, state, plan.documents)) ||
    value.requests.some(
      entry =>
        entry.label !== "B" ||
        entry.status !== 200 ||
        !["document", "receipt", "fixture.js"].includes(entry.route) ||
        entry.method !== (entry.route === "receipt" ? "POST" : "GET")
    ) ||
    JSON.stringify(
      value.requests
        .filter(entry => entry.route !== "fixture.js")
        .map(entry => ({ route: entry.route, id: entry.id }))
    ) !==
      JSON.stringify(
        plan.steps.map(step => ({
          route: step.kind === "document" ? "document" : "receipt",
          id: step.id,
        }))
      )
  ) {
    throw new Error("Lifecycle count or request evidence mismatch");
  }
  return value;
}

function clipErrorText(message, maximum) {
  const characters = [];
  let bytes = 2;
  for (const character of message) {
    bytes += Buffer.byteLength(JSON.stringify(character)) - 2;
    if (bytes > maximum) {
      return { message: characters.join(""), clipped: true };
    }
    characters.push(character);
  }
  return { message, clipped: false };
}

function validateSnapshotEnvelope(value, trustedPlan) {
  if (
    !exactFields(value, [
      "version",
      "suite",
      "state",
      "classification",
      "status",
      "started",
      "error",
      "errorClipped",
      "metadata",
      "receipts",
      "checkpoints",
      "requests",
      "counts",
      "pendingRequests",
      "dropped",
    ]) ||
    value.version !== 1 ||
    value.suite !== "lifecycle" ||
    value.state !== "none" ||
    value.classification !== "none" ||
    !["pending", "running", "failed", "completed"].includes(value.status) ||
    typeof value.started !== "boolean" ||
    typeof value.errorClipped !== "boolean" ||
    (value.status === "failed"
      ? typeof value.error !== "string"
      : value.error !== null || value.errorClipped) ||
    !Number.isSafeInteger(value.pendingRequests) ||
    value.pendingRequests < 0 ||
    value.pendingRequests > trustedPlan.limits.requests ||
    value.dropped !== 0
  ) {
    throw new Error("Invalid lifecycle snapshot envelope");
  }
}

function validateSnapshotShape(value, trustedPlan) {
  validateSnapshotEnvelope(value, trustedPlan);
  for (const [records, maximum] of [
    [value.receipts, trustedPlan.limits.receipts],
    [value.requests, trustedPlan.limits.requests],
    [value.checkpoints, trustedPlan.checkpoints.length],
  ]) {
    if (!Array.isArray(records) || records.length > maximum) {
      throw new Error("Lifecycle snapshot record count exceeded");
    }
  }
  validateLifecycleMetadata(value.metadata, trustedPlan.name);
  if (
    !exactFields(value.counts, [
      "documents",
      "cycles",
      "framesLoaded",
      "framesRemoved",
      "startupCompletions",
    ])
  ) {
    throw new Error("Invalid lifecycle snapshot counts");
  }
  for (const [key, maximum] of [
    ["documents", trustedPlan.counts.documents],
    ["cycles", trustedPlan.counts.cycles],
    ["framesLoaded", trustedPlan.counts.frames],
    ["framesRemoved", trustedPlan.counts.frames],
    ["startupCompletions", 0],
  ]) {
    if (
      !Number.isSafeInteger(value.counts[key]) ||
      value.counts[key] < 0 ||
      value.counts[key] > maximum
    ) {
      throw new Error("Invalid lifecycle snapshot count value");
    }
  }
  const validID = id =>
    Number.isSafeInteger(id) && id >= 0 && id < trustedPlan.counts.documents;
  for (const receipt of value.receipts) {
    if (!validID(receipt?.id)) {
      throw new Error("Invalid lifecycle snapshot receipt ID");
    }
    validateReceipt(
      receipt,
      { kind: receipt.kind, id: receipt.id },
      "none",
      value.metadata
    );
  }
  for (const entry of value.requests) {
    if (
      !exactFields(entry, ["label", "method", "route", "id", "status"]) ||
      !["A", "B"].includes(entry.label) ||
      !["GET", "POST", "invalid"].includes(entry.method) ||
      !["document", "receipt", "fixture.js", "invalid"].includes(entry.route) ||
      ((entry.method === "invalid" || entry.route === "invalid") &&
        value.status !== "failed") ||
      (entry.id !== null && !validID(entry.id)) ||
      (entry.status !== null &&
        (!Number.isInteger(entry.status) ||
          entry.status < 100 ||
          entry.status > 599))
    ) {
      throw new Error("Invalid lifecycle snapshot request record");
    }
  }
  for (const [id, checkpoint] of value.checkpoints.entries()) {
    const expected = trustedPlan.checkpoints[id];
    if (
      !exactFields(checkpoint, [
        "id",
        "settleMs",
        "completedCycles",
        "documentsCompleted",
        "quietMs",
      ]) ||
      Object.keys(expected).some(key => checkpoint[key] !== expected[key]) ||
      !Number.isFinite(checkpoint.quietMs) ||
      checkpoint.quietMs < expected.settleMs ||
      checkpoint.quietMs > trustedPlan.limits.maxQuietMs
    ) {
      throw new Error("Invalid lifecycle snapshot checkpoint record");
    }
  }
  if (value.status === "completed") {
    validateLifecycleResult(value, {
      "lifecycle-case": "none",
      "lifecycle-plan": trustedPlan.name,
    });
  }
}

export function serializeLifecycleSnapshot(
  value,
  options,
  scrub = text => text
) {
  const trustedPlan = validateOptions(options);
  if (trustedPlan !== soakPlan || typeof scrub !== "function") {
    throw new Error("Lifecycle bounded serialization requires soak-30m");
  }
  validateSnapshotShape(value, trustedPlan);
  const boundedError = item => {
    if (item.error === null) {
      return item;
    }
    const clipped = clipErrorText(item.error, trustedPlan.evidence.errorBytes);
    return {
      ...item,
      error: clipped.message,
      errorClipped: item.errorClipped || clipped.clipped,
    };
  };
  const scrubbed = scrub(JSON.stringify(boundedError(value), null, 2));
  if (typeof scrubbed !== "string") {
    throw new Error("Lifecycle scrub must return JSON text");
  }
  const parsed = JSON.parse(scrubbed);
  validateSnapshotShape(parsed, trustedPlan);
  const projected = boundedError(parsed);
  let recordBytes = 0;
  for (const [records, maximum, indent] of [
    [projected.receipts, 573, 4],
    [projected.requests, 285, 4],
    [projected.checkpoints, 285, 4],
    [projected.metadata.documents, 165, 6],
    [projected.metadata.steps, 89, 6],
  ]) {
    for (const record of records) {
      const text = JSON.stringify(record, null, 2);
      const bytes =
        Buffer.byteLength(text) + indent * text.split("\n").length + 1;
      if (bytes > maximum) {
        throw new Error("Lifecycle snapshot record byte cap exceeded");
      }
      recordBytes += bytes;
    }
  }
  const text = JSON.stringify(projected, null, 2) + "\n";
  const bytes = Buffer.byteLength(text);
  // Array separators/newlines and every non-record field stay in the envelope.
  if (
    bytes - recordBytes > trustedPlan.evidence.envelopeBytes ||
    bytes > trustedPlan.evidence.fixtureBytes
  ) {
    throw new Error("Lifecycle snapshot envelope or total byte cap exceeded");
  }
  return text;
}

export async function createLifecycleServer(options, signal) {
  const trustedPlan = validateOptions(options);
  const soak = trustedPlan === soakPlan;
  signal.throwIfAborted();
  const state = options["lifecycle-case"];
  const prefix = `/${randomBytes(18).toString("hex")}/`;
  const plan = makePlan(trustedPlan);
  const receipts = [];
  const checkpoints = [];
  const requests = [];
  const active = new Set();
  const servers = [];
  const result = Promise.withResolvers();
  result.promise.catch(() => {});
  let waiter;
  let held;
  let index = 0;
  let started = false;
  let fixtureStatus = "pending";
  let failure;
  let errorClipped = false;
  let assetRequests = 0;
  let closing;
  let timer;
  let metadata;

  function end(response, code, body, type = "application/json") {
    if (response.destroyed || response.writableEnded) {
      return;
    }
    response.writeHead(code, {
      "Content-Type": type,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy":
        "default-src 'self'; img-src data:; frame-ancestors 'self'",
    });
    response.end(typeof body === "string" ? body : JSON.stringify(body));
  }

  function fail(error) {
    if (fixtureStatus === "failed" || fixtureStatus === "completed") {
      return;
    }
    failure = error instanceof Error ? error : new Error(String(error));
    if (soak) {
      const clipped = clipErrorText(
        failure.message,
        trustedPlan.evidence.errorBytes
      );
      errorClipped = clipped.clipped;
      failure = new Error(clipped.message);
    }
    fixtureStatus = "failed";
    clearTimeout(timer);
    result.reject(failure);
    waiter?.reject(failure);
    waiter = null;
    held = null;
    for (const response of active) {
      end(response, 503, { error: "Fixture stopped" });
    }
  }

  function arm() {
    clearTimeout(timer);
    if (started && !held && fixtureStatus === "running") {
      timer = setTimeout(
        () => fail(new Error("Lifecycle transition timed out")),
        10000
      );
    }
  }

  const nextURL = () => {
    const step = plan.steps[index];
    return step ? `${metadata.originB}${prefix}document?id=${step.id}` : null;
  };

  function snapshot() {
    return structuredClone({
      version: 1,
      suite: "lifecycle",
      state,
      classification: state === "unrelated" ? "configured-unrelated" : state,
      status: fixtureStatus,
      started,
      error: failure?.message ?? null,
      ...(soak ? { errorClipped } : {}),
      metadata,
      receipts,
      checkpoints,
      requests,
      counts: countsFor(receipts, state, plan.documents),
      pendingRequests: active.size,
      dropped: 0,
    });
  }

  function publishCheckpoint() {
    if (waiter && held?.checkpoint && !held.delivered) {
      held.delivered = true;
      waiter.resolve(structuredClone(held.checkpoint));
      waiter = null;
    }
  }

  function releaseInitial() {
    if (started && held?.initial) {
      const response = held.response;
      held = null;
      end(response, 200, { next: nextURL() });
      arm();
    }
  }

  async function readReceipt(request, response) {
    if (request.headers["content-type"] !== "application/json") {
      end(response, 415, { error: "Expected JSON" });
      fail(new Error("Invalid lifecycle content type"));
      return undefined;
    }
    let size = 0;
    const chunks = [];
    for await (const chunk of request) {
      size += chunk.length;
      if (size > trustedPlan.limits.bodyBytes) {
        end(response, 413, { error: "Receipt too large" });
        fail(new Error("Lifecycle receipt cap exceeded"));
        return undefined;
      }
      chunks.push(chunk);
    }
    if (failure || closing || response.destroyed) {
      return undefined;
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  }

  function requestEntry(label, method, route) {
    return {
      label,
      method: soak && !["GET", "POST"].includes(method) ? "invalid" : method,
      route:
        soak && !["document", "receipt", "fixture.js"].includes(route)
          ? "invalid"
          : route,
      id: null,
      status: null,
    };
  }

  async function handle(label, request, response) {
    active.add(response);
    response.once("close", () => {
      active.delete(response);
      if (!response.writableEnded) {
        fail(new Error("Fixture response disconnected"));
      }
    });
    response.once("finish", () => active.delete(response));
    request.once("error", fail);
    response.once("error", fail);
    if (
      active.size > trustedPlan.limits.activeRequests ||
      requests.length >= trustedPlan.limits.requests ||
      request.url.length > 512
    ) {
      end(response, 429, { error: "Fixture cap" });
      fail(new Error("Lifecycle request cap exceeded"));
      return;
    }
    const requestOrigin = label === "A" ? metadata.originA : metadata.originB;
    const url = new URL(request.url, requestOrigin);
    const route = url.pathname.slice(prefix.length);
    const entry = requestEntry(label, request.method, route);
    requests.push(entry);
    response.once("finish", () => {
      entry.status = response.statusCode;
    });
    if (
      request.headers.host !== new URL(requestOrigin).host ||
      url.origin !== requestOrigin ||
      (request.headers.origin && request.headers.origin !== requestOrigin)
    ) {
      end(response, 403, { error: "Forbidden" });
      if (soak) {
        fail(new Error("Invalid lifecycle request origin"));
      }
      return;
    }
    if (!url.pathname.startsWith(prefix)) {
      end(response, 404, { error: "Not found" });
      if (soak) {
        fail(new Error("Invalid lifecycle request prefix"));
      }
      return;
    }
    if (
      fixtureStatus === "failed" ||
      fixtureStatus === "completed" ||
      label !== "B"
    ) {
      end(response, 409, { error: "Fixture not accepting work" });
      if (soak && label !== "B") {
        fail(new Error("Unexpected lifecycle origin A request"));
      }
      return;
    }
    if (request.method === "GET" && route === "fixture.js" && !url.search) {
      if (soak && assetRequests >= trustedPlan.limits.assets) {
        end(response, 429, { error: "Fixture asset cap" });
        fail(new Error("Lifecycle asset request cap exceeded"));
        return;
      }
      assetRequests++;
      end(response, 200, source, "text/javascript");
      return;
    }
    if (request.method === "GET" && route === "document") {
      const id = Number(url.searchParams.get("id"));
      const step = plan.steps[index];
      if (
        url.search !== `?id=${id}` ||
        step?.kind !== "document" ||
        step.id !== id ||
        held
      ) {
        end(response, 400, { error: "Document order mismatch" });
        fail(new Error("Unexpected lifecycle document sequence"));
        return;
      }
      entry.id = id;
      index++;
      const config = JSON.stringify({ ...plan.documents[id], token: prefix });
      end(
        response,
        200,
        `<!doctype html><html lang="en" data-fixture-config='${config}'><head><meta charset="utf-8"><title>Lifecycle fixture</title><link rel="icon" href="data:,"><script src="./fixture.js"></script></head><body></body></html>`,
        "text/html"
      );
      arm();
      return;
    }
    if (request.method !== "POST" || route !== "receipt" || url.search) {
      end(response, 404, { error: "Not found" });
      if (soak) {
        fail(new Error("Invalid lifecycle request route or method"));
      }
      return;
    }
    const value = await readReceipt(request, response);
    if (value === undefined) {
      return;
    }
    acceptReceipt(value, entry, response);
  }

  function acceptReceipt(value, entry, response) {
    if (failure || closing || response.destroyed) {
      return;
    }
    if (held || receipts.length >= trustedPlan.limits.receipts) {
      throw new Error("Lifecycle receipt while gate held");
    }
    validateReceipt(value, plan.steps[index], state, metadata);
    receipts.push(value);
    entry.id = value.id;
    index++;
    const plannedDocument = plan.documents[value.id];
    if (value.kind === "loaded" && plannedDocument.role === "initial") {
      held = { response, initial: true };
      clearTimeout(timer);
      releaseInitial();
    } else if (value.kind === "loaded" && plannedDocument.role === "settled") {
      held = {
        response,
        at: performance.now(),
        delivered: false,
        checkpoint: {
          ...trustedPlan.checkpoints[plannedDocument.checkpoint],
          documentsCompleted: countsFor(receipts, state, plan.documents)
            .documents,
        },
      };
      clearTimeout(timer);
      publishCheckpoint();
    } else {
      const children =
        plannedDocument.role === "top" && value.kind === "loaded"
          ? plan.documents
              .filter(
                item =>
                  item.role === "frame" && item.cycle === plannedDocument.cycle
              )
              .map(item => ({
                id: item.id,
                url: `${metadata.originB}${prefix}document?id=${item.id}`,
              }))
          : [];
      end(response, 200, {
        children,
        next: value.kind === "cycle" ? nextURL() : null,
      });
      arm();
    }
  }

  async function closeFixture() {
    if (!closing) {
      closing = (async () => {
        signal.removeEventListener("abort", abort);
        fail(new Error("Lifecycle fixture closed"));
        clearTimeout(timer);
        const shutdowns = servers.map(
          server =>
            new Promise((resolve, reject) => {
              server.closeAllConnections();
              if (server.listening) {
                server.close(error => (error ? reject(error) : resolve()));
              } else {
                resolve();
              }
            })
        );
        const outcomes = await Promise.allSettled(shutdowns);
        const rejected = outcomes.find(
          outcome => outcome.status === "rejected"
        );
        if (rejected) {
          throw rejected.reason;
        }
      })();
    }
    return closing;
  }
  const abort = () => {
    fail(signal.reason ?? new Error("Lifecycle aborted"));
    closeFixture().catch(fail);
  };
  try {
    const origins = {};
    for (const label of ["A", "B"]) {
      const server = createServer((request, response) => {
        handle(label, request, response).catch(error => {
          end(response, 400, { error: "Invalid lifecycle request" });
          fail(error);
        });
      });
      servers.push(server);
      server.on("error", fail);
      server.requestTimeout = 5000;
      server.headersTimeout = 5000;
      server.maxConnections = trustedPlan.limits.connections;
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
      });
      origins[label] = `http://127.0.0.1:${server.address().port}`;
    }
    metadata = {
      ...plan,
      originA: origins.A,
      originB: origins.B,
      sentinel: prefix,
      sourceSHA256,
      settleMs: soak ? null : settleMs,
      ...(soak
        ? { plan: trustedPlan.name, checkpoints: trustedPlan.checkpoints }
        : {}),
    };
    signal.addEventListener("abort", abort, { once: true });
    signal.throwIfAborted();
    const code = `const element = window.document.documentElement;
element.setAttribute("data-lifecycle-start", String(Number(element.getAttribute("data-lifecycle-start") ?? 0) + 1));
await Promise.resolve();
element.setAttribute("data-lifecycle-finish", ${JSON.stringify(prefix)});`;
    return {
      url: `${origins.B}${prefix}document?id=0`,
      metadata: structuredClone(metadata),
      scriptStore: {
        version: 1,
        scripts:
          state === "none"
            ? []
            : [
                {
                  id: "lifecycle-no-handler",
                  name: "Owned lifecycle control",
                  enabled: true,
                  scope: {
                    origin: state === "unrelated" ? origins.A : origins.B,
                    targetKinds: ["document"],
                    sourceUrlPattern: null,
                  },
                  world: "default",
                  code,
                  createdAt: 1,
                  updatedAt: 1,
                },
              ],
      },
      result: result.promise,
      snapshot,
      close: closeFixture,
      start() {
        if (started || failure || closing) {
          throw new Error("Lifecycle cannot start twice or after close");
        }
        started = true;
        fixtureStatus = "running";
        releaseInitial();
        arm();
      },
      nextCheckpoint() {
        if (failure) {
          return Promise.reject(failure);
        }
        if (fixtureStatus === "completed") {
          return Promise.resolve(null);
        }
        if (waiter || held?.delivered) {
          return Promise.reject(new Error("Checkpoint already outstanding"));
        }
        waiter = Promise.withResolvers();
        const promise = waiter.promise;
        promise.catch(() => {});
        publishCheckpoint();
        return promise;
      },
      releaseCheckpoint(id) {
        if (
          failure ||
          !held?.checkpoint ||
          !held.delivered ||
          held.checkpoint.id !== id
        ) {
          throw new Error("Unexpected checkpoint release");
        }
        const quietMs = performance.now() - held.at;
        if (quietMs < held.checkpoint.settleMs) {
          throw new Error("Checkpoint quiet interval incomplete");
        }
        if (
          soak &&
          (!Number.isFinite(quietMs) || quietMs > trustedPlan.limits.maxQuietMs)
        ) {
          throw new Error("Invalid checkpoint quiet interval");
        }
        checkpoints.push({ ...held.checkpoint, quietMs });
        const response = held.response;
        held = null;
        if (index === plan.steps.length) {
          response.once("finish", () => {
            if (failure) {
              return;
            }
            fixtureStatus = "completed";
            clearTimeout(timer);
            waiter?.resolve(null);
            waiter = null;
            result.resolve(snapshot());
          });
        }
        end(response, 200, { next: nextURL() });
        arm();
      },
    };
  } catch (error) {
    fail(error);
    await closeFixture();
    throw error;
  }
}
