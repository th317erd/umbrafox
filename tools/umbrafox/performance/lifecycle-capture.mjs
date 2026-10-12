/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Buffer } from "node:buffer";
import { readFile, readdir, lstat, statfs, writeFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { readIdentity, withTimeout } from "./helpers.mjs";
import { getLifecyclePlan, validateLifecycleMetadata } from "./lifecycle.mjs";

const GiB = 1024 ** 3;
const systemIO = { readFile, readdir, lstat, statfs, readIdentity };
const live = identity => !["Z", "X"].includes(identity.state);

export function lifecycleArtifactLimit(policy = "standard") {
  if (!["standard", "profile"].includes(policy)) {
    throw new Error("Invalid lifecycle artifact policy");
  }
  return (policy === "profile" ? 512 : 256) * 1024 ** 2;
}

function trustedPlan(plan) {
  if (plan !== getLifecyclePlan(plan?.name)) {
    throw new Error("Untrusted lifecycle plan");
  }
  return plan;
}

export function createLifecycleBudget(
  totalMs,
  now = () => performance.now(),
  plan = getLifecyclePlan()
) {
  trustedPlan(plan);
  if (
    !Number.isInteger(totalMs) ||
    totalMs < plan.budget.minMs ||
    totalMs > plan.budget.maxMs
  ) {
    throw new Error("Invalid lifecycle plan budget");
  }
  const start = now();
  const remaining = reserve => {
    const milliseconds = start + totalMs - reserve - now();
    if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
      throw new Error("Lifecycle deadline exceeded");
    }
    return milliseconds;
  };
  return {
    remaining(cleanup = false) {
      return remaining(
        cleanup ? plan.budget.terminalMs : plan.budget.cleanupMs
      );
    },
    remainingTerminal: () => remaining(0),
    admit(nextCheckpoint) {
      if (
        !Number.isInteger(nextCheckpoint) ||
        nextCheckpoint < 0 ||
        nextCheckpoint > plan.checkpoints.length
      ) {
        throw new Error("Invalid lifecycle phase admission");
      }
      if (plan.name === "soak-30m") {
        const owed = plan.checkpoints
          .slice(nextCheckpoint)
          .reduce((sum, item) => sum + item.settleMs, 0);
        if (
          remaining(plan.budget.cleanupMs) <
          owed + plan.budget.finalizationMs
        ) {
          throw new Error(
            "Lifecycle future holds/finalization reserve exhausted"
          );
        }
      }
    },
  };
}

function evidenceCategory(fileName, evidence, checkpoints) {
  if (/^lifecycle-resources-\d+\.json$/.test(fileName)) {
    return ["resource", evidence.resourceFileBytes, evidence.resourceRecords];
  }
  if (/^lifecycle-checkpoint-\d+\.json$/.test(fileName)) {
    return ["checkpoint", evidence.checkpointFileBytes, checkpoints];
  }
  if (/^lifecycle-attribution-\d+\.json$/.test(fileName)) {
    return ["attribution", evidence.attributionFileBytes, checkpoints];
  }
  if (fileName === "lifecycle-baseline.json") {
    return ["baseline", evidence.baselineFileBytes, 1];
  }
  return ["other", evidence.otherBytes, Infinity];
}

function encodeLifecycleEvidence(
  fileName,
  value,
  scrub,
  serializeFixture,
  soak
) {
  if (soak && ["application.ini", "platform.ini"].includes(fileName)) {
    if (!Buffer.isBuffer(value) || value.length > 65536) {
      throw new Error("Lifecycle INI byte cap/type invalid");
    }
    return value;
  }
  if (
    soak &&
    serializeFixture &&
    ["samples.json", "fixture-state.json"].includes(fileName)
  ) {
    return serializeFixture(value, scrub);
  }
  return scrub(JSON.stringify(value, null, 2)) + "\n";
}

export function createLifecycleEvidence({
  root,
  scrub,
  budget,
  signal,
  write = writeFile,
  plan = getLifecyclePlan(),
  serializeFixture,
}) {
  trustedPlan(plan);
  const soak = plan.name === "soak-30m";
  let ordinaryBytes = 0;
  let otherBytes = 0;
  const categories = new Map();
  let stopped = false;
  const terminal = new Map([
    ["fixture-state.json", plan.evidence.terminalFixtureBytes],
    ["run.json", plan.evidence.terminalRunBytes],
  ]);
  return async (fileName, value, phase = "work") => {
    if (!["work", "cleanup", "checkpoint-failure"].includes(phase)) {
      throw new Error("Unknown lifecycle evidence phase");
    }
    const partial = phase === "checkpoint-failure";
    if (
      partial &&
      (!soak ||
        !/^lifecycle-checkpoint-(?:[0-9]|10)\.json$/.test(fileName) ||
        typeof value?.captureError?.message !== "string" ||
        !value.captureError.message)
    ) {
      throw new Error("Invalid lifecycle partial checkpoint evidence");
    }
    const cleanup = phase === "cleanup" || partial;
    if (!cleanup) {
      signal.throwIfAborted();
    }
    const timeLeft = () =>
      cleanup && fileName === "run.json"
        ? budget.remainingTerminal()
        : budget.remaining(cleanup);
    timeLeft();
    const text = encodeLifecycleEvidence(
      fileName,
      value,
      scrub,
      serializeFixture,
      soak
    );
    const bytes = Buffer.byteLength(text);
    if (cleanup && terminal.has(fileName)) {
      if (bytes > terminal.get(fileName)) {
        throw new Error("Lifecycle terminal evidence cap exceeded");
      }
      terminal.set(fileName, 0);
    } else {
      if (soak) {
        const [category, fileCap, countCap] = evidenceCategory(
          fileName,
          plan.evidence,
          plan.checkpoints.length
        );
        const count = categories.get(category) ?? 0;
        if (
          bytes > fileCap ||
          count >= countCap ||
          (category === "other" &&
            otherBytes + bytes > plan.evidence.otherBytes)
        ) {
          stopped = true;
        }
        if (!stopped) {
          categories.set(category, count + 1);
          if (category === "other") {
            otherBytes += bytes;
          }
        }
      }
      if (stopped || ordinaryBytes + bytes > plan.evidence.ordinaryBytes) {
        stopped = true;
        throw new Error(
          "Lifecycle ordinary evidence cap exceeded; terminal reserve preserved"
        );
      }
      ordinaryBytes += bytes;
    }
    let writeSignal = AbortSignal.timeout(
      Math.max(1, Math.floor(Math.min(1000, timeLeft())))
    );
    if (!cleanup) {
      writeSignal = AbortSignal.any([signal, writeSignal]);
    }
    writeSignal.throwIfAborted();
    await write(join(root, fileName), text, {
      mode: 0o600,
      signal: writeSignal,
    });
  };
}

export function lifecycleURLs(server, plan = getLifecyclePlan()) {
  trustedPlan(plan);
  if (plan.name === "soak-30m") {
    validateLifecycleMetadata(server.metadata, plan.name);
    const { originB, sentinel } = server.metadata;
    if (server.url !== `${originB}${sentinel}document?id=0`) {
      throw new Error("Invalid lifecycle fixture URL/metadata");
    }
    return [
      server.url,
      ...plan.checkpoints.map(
        item =>
          `${originB}${sentinel}document?id=${item.documentsCompleted - 1}`
      ),
    ];
  }
  const { originB, sentinel, documents } = server.metadata ?? {};
  const initial = new URL(server.url);
  if (
    initial.protocol !== "http:" ||
    initial.hostname !== "127.0.0.1" ||
    !initial.port ||
    initial.origin !== originB ||
    !/^\/[a-f0-9]{36}\/$/.test(sentinel) ||
    server.url !== `${originB}${sentinel}document?id=0` ||
    !Array.isArray(documents) ||
    documents.length > 40 ||
    documents.filter(item => item?.role === "initial" && item.id === 0)
      .length !== 1
  ) {
    throw new Error("Invalid lifecycle fixture URL/metadata");
  }
  const urls = [server.url];
  for (let checkpoint = 0; checkpoint < 3; checkpoint++) {
    const matches = documents.filter(
      item => item?.role === "settled" && item.checkpoint === checkpoint
    );
    if (
      matches.length !== 1 ||
      !Number.isSafeInteger(matches[0].id) ||
      matches[0].id < 1 ||
      matches[0].id > 39
    ) {
      throw new Error("Invalid lifecycle settled document metadata");
    }
    urls.push(`${originB}${sentinel}document?id=${matches[0].id}`);
  }
  if (new Set(urls).size !== 4) {
    throw new Error("Duplicate lifecycle fixture document URL");
  }
  return urls;
}

export function validateLifecycleTab(
  diagnostics,
  expectedURL,
  context = null,
  allowPending = false
) {
  const windows = diagnostics?.windows;
  if (!Array.isArray(windows) || windows.length > 1) {
    throw new Error("Lifecycle browser windows missing or unexpected");
  }
  if (!windows.length && allowPending) {
    return null;
  }
  const browserWindow = windows[0];
  if (
    browserWindow?.index !== 0 ||
    !Array.isArray(browserWindow.tabs) ||
    browserWindow.tabs.length > 1
  ) {
    throw new Error("Lifecycle browser tab schema/count invalid");
  }
  if (
    !browserWindow.tabs.length &&
    browserWindow.selectedTabIndex === -1 &&
    allowPending
  ) {
    return null;
  }
  const tab = browserWindow.tabs[0];
  if (
    browserWindow.selectedTabIndex !== 0 ||
    tab?.selected !== true ||
    !Number.isSafeInteger(tab.context) ||
    tab.context <= 0 ||
    !Number.isSafeInteger(tab.browserId) ||
    tab.browserId <= 0
  ) {
    throw new Error("Lifecycle selected fixture context missing or invalid");
  }
  if (allowPending && tab.url === "about:blank") {
    return null;
  }
  if (tab.url !== expectedURL) {
    throw new Error("Lifecycle tab is not the exact owned fixture URL");
  }
  if (
    context &&
    (tab.context !== context.context || tab.browserId !== context.browserId)
  ) {
    throw new Error("Lifecycle fixture context/browserId changed");
  }
  return { context: tab.context, browserId: tab.browserId };
}

function classifyLifecycleWindow(item, processInfo, expectedURL) {
  if (
    !Number.isSafeInteger(item?.outerWindowId) ||
    item.outerWindowId <= 0 ||
    typeof item.documentURI !== "string" ||
    typeof item.isProcessRoot !== "boolean" ||
    typeof item.isInProcess !== "boolean"
  ) {
    throw new Error("Lifecycle process-window schema invalid");
  }
  const url = new URL(item.documentURI);
  if (["http:", "https:"].includes(url.protocol)) {
    if (item.documentURI !== expectedURL || !item.isProcessRoot) {
      throw new Error("Lifecycle unexpected HTTP window");
    }
    return "httpWindows";
  }
  if (
    processInfo.type === "privilegedabout" &&
    item.documentURI === "about:newtab"
  ) {
    return "backgroundWindows";
  }
  if (
    processInfo.type === "extension" &&
    /^moz-extension:\/\/[a-f0-9-]{36}\/_generated_background_page\.html$/.test(
      item.documentURI
    )
  ) {
    return "backgroundWindows";
  }
  throw new Error("Lifecycle unknown internal process window");
}

export function validateLifecycleWindows(snapshot, expectedURL) {
  const result = { httpWindows: [], backgroundWindows: [] };
  const pending = [snapshot?.process];
  const seen = new Set();
  let windowCount = 0;
  while (pending.length) {
    const processInfo = pending.pop();
    if (
      !Number.isSafeInteger(processInfo?.pid) ||
      processInfo.pid <= 0 ||
      seen.has(processInfo.pid) ||
      seen.size >= 32 ||
      typeof processInfo.type !== "string" ||
      !Array.isArray(processInfo.windows)
    ) {
      throw new Error("Lifecycle process/window coverage invalid");
    }
    seen.add(processInfo.pid);
    for (const item of processInfo.windows) {
      if (++windowCount > 128) {
        throw new Error("Lifecycle process-window admission cap exceeded");
      }
      const category = classifyLifecycleWindow(item, processInfo, expectedURL);
      result[category].push({
        pid: processInfo.pid,
        type: processInfo.type,
        ...item,
      });
    }
    if (processInfo.children !== undefined) {
      if (
        !Array.isArray(processInfo.children) ||
        processInfo.children.length > 32
      ) {
        throw new Error("Lifecycle child process coverage invalid");
      }
      for (const child of processInfo.children) {
        pending.push(child);
      }
    }
  }
  if (result.httpWindows.length !== 1) {
    throw new Error("Lifecycle fixture HTTP window missing or duplicated");
  }
  return result;
}

function initialReceiptReady(fixture) {
  if (
    fixture?.started !== false ||
    fixture.status !== "pending" ||
    fixture.error !== null ||
    !Array.isArray(fixture.receipts) ||
    fixture.receipts.length > 1 ||
    fixture.dropped !== 0 ||
    !Number.isSafeInteger(fixture.pendingRequests) ||
    fixture.pendingRequests < 0 ||
    fixture.counts?.documents !== fixture.receipts.length
  ) {
    throw new Error("Lifecycle initial fixture state invalid");
  }
  if (!fixture.receipts.length) {
    return false;
  }
  if (
    fixture.receipts[0].kind !== "loaded" ||
    fixture.receipts[0].id !== 0 ||
    fixture.pendingRequests < 1
  ) {
    throw new Error("Lifecycle initial loaded receipt missing");
  }
  return true;
}

export async function waitForLifecycleReady({
  control,
  server,
  owned,
  profile,
  bounded,
  signal,
  save,
  plan = getLifecyclePlan(),
  now = () => performance.now(),
  wait = (ms, activeSignal) => delay(ms, undefined, { signal: activeSignal }),
}) {
  const urls = lifecycleURLs(server, plan);
  const startedAt = now();
  for (let attempts = 1; attempts <= 300; attempts++) {
    signal.throwIfAborted();
    const fixture = server.snapshot();
    const diagnostics = await bounded(
      control.request("umbrafox.diagnostics.snapshot"),
      "Lifecycle setup diagnostics",
      15000
    );
    await save(`lifecycle-setup-${attempts}.json`, {
      attempts,
      additionalSetupRPCs: attempts - 1,
      elapsedMs: now() - startedAt,
      fixture,
      diagnostics,
    });
    signal.throwIfAborted();
    if (
      diagnostics.processID !== owned.child.pid ||
      diagnostics.profileDir !== profile ||
      diagnostics.channel !== "umbrafox-control"
    ) {
      throw new Error("Lifecycle setup diagnostics identity mismatch");
    }
    const loaded = initialReceiptReady(fixture);
    const context = validateLifecycleTab(diagnostics, urls[0], null, !loaded);
    if (context && loaded) {
      return { urls, context, diagnostics, attempts };
    }
    if (attempts < 300) {
      await wait(100, signal);
    }
  }
  throw new Error("Lifecycle setup observation cap exceeded");
}

function finite(value, resourceName, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new Error(`Unknown or invalid lifecycle resource: ${resourceName}`);
  }
  return value;
}

function fieldKB(text, field) {
  const match = new RegExp(`^${field}:\\s+(\\d+) kB$`, "m").exec(text);
  return finite(match ? Number(match[1]) * 1024 : NaN, field);
}

export async function readLifecycleHost(root, io = systemIO, preflight = true) {
  const memory = await io.readFile("/proc/meminfo", "utf8");
  const disk = await io.statfs(root);
  const host = {
    totalBytes: fieldKB(memory, "MemTotal"),
    availableBytes: fieldKB(memory, "MemAvailable"),
    diskAvailableBytes: finite(disk.bavail * disk.bsize, "artifact storage"),
  };
  if (host.totalBytes <= 0 || host.availableBytes > host.totalBytes) {
    throw new Error("Unknown host memory capacity");
  }
  if (
    (preflight && host.availableBytes < 4 * GiB) ||
    host.diskAvailableBytes < GiB
  ) {
    throw new Error("Lifecycle host preflight/headroom cap failed");
  }
  return host;
}

function sameIdentity(left, right) {
  return ["pid", "start", "parent", "group", "session"].every(
    key => left?.[key] === right?.[key]
  );
}

function validIdentity(identity) {
  for (const key of ["pid", "parent", "group", "session"]) {
    finite(identity?.[key], `identity ${key}`, key === "parent" ? 0 : 1);
  }
  if (!/^\d+$/.test(identity.start) || typeof identity.state !== "string") {
    throw new Error("Unknown process identity");
  }
}

async function processResources(identity, io, signal) {
  signal?.throwIfAborted();
  const before = await io.readIdentity(identity.pid);
  validIdentity(before);
  if (!sameIdentity(before, identity) || !live(before)) {
    throw new Error("Process identity changed before resource read");
  }
  const directory = `/proc/${identity.pid}`;
  const statusText = await io.readFile(`${directory}/status`, "utf8");
  const uid = /^Uid:\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)$/m.exec(statusText);
  if (!uid || uid.slice(1).some(value => Number(value) !== process.getuid())) {
    throw new Error("Process resource owner is unknown or changed");
  }
  const fds = (await io.readdir(`${directory}/fd`)).length;
  const threads = (await io.readdir(`${directory}/task`)).length;
  signal?.throwIfAborted();
  const after = await io.readIdentity(identity.pid);
  if (!sameIdentity(before, after) || !live(after)) {
    throw new Error("Process identity changed during resource read");
  }
  return {
    identity,
    rssBytes: fieldKB(statusText, "VmRSS"),
    fds: finite(fds, "FD count"),
    threads: finite(threads, "thread count", 1),
  };
}

async function scanArtifactEntries(
  root,
  rootEntries,
  io,
  signal,
  traversal,
  artifactLimit
) {
  const pending = [{ directory: root, entries: rootEntries }];
  let bytes = 0;
  while (pending.length) {
    signal?.throwIfAborted();
    const { directory, entries } = pending.pop();
    for (const entryName of entries) {
      signal?.throwIfAborted();
      if (++traversal.entries > 8192) {
        throw new Error("Lifecycle artifact entry cap exceeded");
      }
      const path = join(directory, entryName);
      const metadata = await io.lstat(path);
      signal?.throwIfAborted();
      bytes += finite(metadata.size, "artifact size");
      if (bytes > artifactLimit) {
        throw new Error(
          `Lifecycle artifact byte cap exceeded: ${bytes} > ${artifactLimit}`
        );
      }
      if (metadata.isDirectory()) {
        const children = await io.readdir(path);
        signal?.throwIfAborted();
        pending.push({ directory: path, entries: children });
      }
    }
  }
  return bytes;
}

async function artifactSize(root, io, signal, artifactLimit) {
  const traversal = { entries: 0 };
  for (let attempts = 1; ; attempts++) {
    signal?.throwIfAborted();
    const rootEntries = await io.readdir(root);
    signal?.throwIfAborted();
    try {
      const bytes = await scanArtifactEntries(
        root,
        rootEntries,
        io,
        signal,
        traversal,
        artifactLimit
      );
      signal?.throwIfAborted();
      return { bytes, attempts, entries: traversal.entries };
    } catch (error) {
      signal?.throwIfAborted();
      if (error?.code !== "ENOENT") {
        throw error;
      }
      if (attempts >= 3) {
        throw new Error("Lifecycle artifact scan remained unstable", {
          cause: error,
        });
      }
    }
  }
}

async function ownedIdentities(owned, previous, io, signal) {
  const root = owned.identity;
  validIdentity(root);
  if (
    owned.identityError ||
    root.pid !== owned.child.pid ||
    root.parent !== process.pid ||
    root.group !== root.pid ||
    root.session !== root.pid
  ) {
    throw new Error("Unproven detached process identity");
  }
  const currentRoot = await io.readIdentity(root.pid);
  if (!sameIdentity(currentRoot, root) || !live(currentRoot)) {
    throw new Error("Owned root identity changed or exited");
  }
  const identities = [];
  const observed = new Map();
  for (const entryName of await io.readdir("/proc")) {
    signal?.throwIfAborted();
    if (!/^\d+$/.test(entryName)) {
      continue;
    }
    let identity;
    try {
      identity = await io.readIdentity(Number(entryName));
    } catch (error) {
      if (["ENOENT", "ESRCH"].includes(error.code)) {
        continue;
      }
      throw error;
    }
    observed.set(identity.pid, identity);
    const prior = previous.get(identity.pid);
    if (prior && prior.start !== identity.start) {
      throw new Error("Owned PID reuse detected");
    }
    if (identity.group !== root.group || identity.session !== root.session) {
      if (prior && live(identity)) {
        throw new Error("Owned process left its verified group/session");
      }
      continue;
    }
    validIdentity(identity);
    if (BigInt(identity.start) < BigInt(root.start)) {
      throw new Error("Process predates the owned session");
    }
    if (live(identity)) {
      identities.push(identity);
    }
    if (identities.length > 32) {
      throw new Error("Lifecycle process cap exceeded");
    }
  }
  if (!identities.some(identity => sameIdentity(identity, root))) {
    throw new Error("Owned root absent from resource enumeration");
  }
  verifyDescendantGroups(root, observed);
  await verifyMissingIdentities(previous, identities, io, signal);
  return identities;
}

function verifyDescendantGroups(root, observed) {
  for (const identity of observed.values()) {
    let ancestor = observed.get(identity.parent);
    const seen = new Set([identity.pid]);
    while (ancestor && ancestor.pid !== root.pid && !seen.has(ancestor.pid)) {
      if (seen.size >= 64) {
        throw new Error("Process ancestry depth is unknown");
      }
      seen.add(ancestor.pid);
      ancestor = observed.get(ancestor.parent);
    }
    if (
      ancestor?.pid === root.pid &&
      live(identity) &&
      (identity.group !== root.group || identity.session !== root.session)
    ) {
      throw new Error("Owned descendant escaped its group/session");
    }
  }
}

async function verifyMissingIdentities(previous, identities, io, signal) {
  const current = new Set(identities.map(identity => identity.pid));
  for (const prior of previous.values()) {
    signal?.throwIfAborted();
    if (current.has(prior.pid)) {
      continue;
    }
    try {
      const identity = await io.readIdentity(prior.pid);
      if (!sameIdentity(prior, identity) || live(identity)) {
        throw new Error(
          "Missing owned identity without proven exit, or PID reuse"
        );
      }
    } catch (error) {
      if (!["ENOENT", "ESRCH"].includes(error.code)) {
        throw error;
      }
    }
  }
}

export async function readLifecycleResources(
  owned,
  root,
  previous = new Map(),
  io = systemIO,
  signal,
  artifactPolicy = "standard"
) {
  const artifactLimit = lifecycleArtifactLimit(artifactPolicy);
  const identities = await ownedIdentities(owned, previous, io, signal);
  const processes = [];
  const exited = [];
  for (const identity of identities) {
    try {
      processes.push(await processResources(identity, io, signal));
    } catch (error) {
      if (
        !["ENOENT", "ESRCH"].includes(error.code) ||
        identity.pid === owned.child.pid
      ) {
        throw error;
      }
      try {
        const current = await io.readIdentity(identity.pid);
        if (!sameIdentity(current, identity) || live(current)) {
          throw new Error("Resource read failed without proven process exit");
        }
      } catch (exitError) {
        if (!["ENOENT", "ESRCH"].includes(exitError.code)) {
          throw exitError;
        }
      }
      exited.push(identity);
    }
  }
  if (!sameIdentity(await io.readIdentity(owned.child.pid), owned.identity)) {
    throw new Error("Owned root identity changed during sampling");
  }
  const controller = await processResources(
    await io.readIdentity(process.pid),
    io,
    signal
  );
  const totals = {
    rssBytes: 0,
    processes: processes.length,
    fds: 0,
    threads: 0,
  };
  for (const item of processes) {
    for (const key of ["rssBytes", "fds", "threads"]) {
      totals[key] = finite(totals[key] + item[key], key);
    }
  }
  const sample = {
    host: await readLifecycleHost(root, io, false),
    controller,
    processes,
    totals,
    exitedDuringRead: exited,
    rssMeaning:
      "Summed owned VmRSS; shared pages may be counted more than once. Safety only, not ProcInfo memory or heap ownership.",
  };
  const { bytes, attempts, entries } = await artifactSize(
    root,
    io,
    signal,
    artifactLimit
  );
  sample.artifactBytes = bytes;
  sample.artifactScan = { attempts, entries };
  if (artifactPolicy === "profile") {
    sample.artifactLimitBytes = artifactLimit;
  }
  signal?.throwIfAborted();
  return sample;
}

export function checkLifecycleCaps(
  sample,
  baseline,
  artifactPolicy = "standard"
) {
  const artifactLimit = lifecycleArtifactLimit(artifactPolicy);
  const { host, totals } = sample;
  for (const key of ["totalBytes", "availableBytes", "diskAvailableBytes"]) {
    finite(host[key], key, key === "totalBytes" ? 1 : 0);
  }
  if (baseline) {
    for (const key of ["rssBytes", "processes", "fds", "threads"]) {
      finite(baseline[key], `baseline ${key}`);
    }
  }
  const limits = {
    rssBytes: Math.min(
      4 * GiB,
      host.totalBytes / 4,
      baseline ? baseline.rssBytes + GiB : Infinity
    ),
    processes: Math.min(32, baseline ? baseline.processes + 8 : Infinity),
    fds: Math.min(2048, baseline ? baseline.fds + 256 : Infinity),
    threads: Math.min(512, baseline ? baseline.threads + 128 : Infinity),
  };
  for (const [key, limit] of Object.entries(limits)) {
    if (finite(totals[key], key) > limit) {
      throw new Error(`Lifecycle resource cap exceeded: ${key}`);
    }
  }
  if (
    host.availableBytes < Math.max(GiB, host.totalBytes / 10) ||
    host.diskAvailableBytes < GiB ||
    finite(sample.artifactBytes, "artifact bytes") > artifactLimit
  ) {
    throw new Error("Lifecycle host/artifact cap exceeded");
  }
}

export async function startLifecycleMonitor({
  owned,
  root,
  signal,
  abort,
  save,
  plan = getLifecyclePlan(),
  artifactPolicy = "standard",
  now = () => performance.now(),
  sample = readLifecycleResources,
  wait = (ms, activeSignal) => delay(ms, undefined, { signal: activeSignal }),
}) {
  trustedPlan(plan);
  const soak = plan.name === "soak-30m";
  lifecycleArtifactLimit(artifactPolicy);
  if (soak && artifactPolicy !== "standard") {
    throw new Error("Invalid soak artifact policy");
  }
  const controller = new AbortController();
  const monitorSignal = AbortSignal.any([signal, controller.signal]);
  const identities = new Map();
  let baseline;
  let sequence = 0;
  let pending;
  let previous = new Set();
  let missedSlots = 0;
  let failure;
  let stopping = false;
  let underlyingReadPending = false;
  const poison = error => {
    if (failure) {
      return failure;
    }
    const reason = error instanceof Error ? error : new Error(String(error));
    if (stopping || signal.aborted) {
      return reason;
    }
    failure = reason;
    controller.abort(reason);
    abort(reason.message);
    return failure;
  };
  const sampleNow = () => {
    if (failure) {
      return Promise.reject(failure);
    }
    pending ??= (async () => {
      monitorSignal.throwIfAborted();
      if (soak && sequence >= plan.evidence.resourceRecords) {
        throw new Error("Lifecycle resource record cap exceeded");
      }
      const began = now();
      const read = Promise.resolve(
        sample(owned, root, identities, systemIO, monitorSignal, artifactPolicy)
      );
      underlyingReadPending = true;
      const readFinished = () => {
        underlyingReadPending = false;
      };
      read.then(readFinished, readFinished);
      const value = await withTimeout(
        read,
        3000,
        "Lifecycle resource read",
        monitorSignal
      );
      monitorSignal.throwIfAborted();
      const current = new Set(value.processes.map(item => item.identity.pid));
      value.births = value.processes
        .filter(item => !identities.has(item.identity.pid))
        .map(item => item.identity);
      value.exits = [...previous]
        .filter(pid => !current.has(pid))
        .map(pid => identities.get(pid));
      if (
        soak &&
        identities.size + value.births.length > plan.evidence.historicalPIDs
      ) {
        throw new Error("Lifecycle historical PID cap exceeded");
      }
      for (const item of value.processes) {
        identities.set(item.identity.pid, item.identity);
      }
      previous = current;
      await save(
        `lifecycle-resources-${String(sequence++).padStart(3, "0")}.json`,
        {
          beganMs: began,
          finishedMs: now(),
          ...(soak ? { missedSlots } : {}),
          ...value,
        }
      );
      checkLifecycleCaps(value, baseline, artifactPolicy);
      return value;
    })()
      .catch(error => {
        throw poison(error);
      })
      .finally(() => {
        pending = undefined;
      });
    return pending;
  };
  await sampleNow();
  const completion = (async () => {
    let next = now() + 5000;
    while (!monitorSignal.aborted) {
      await wait(Math.max(0, next - now()), monitorSignal);
      next += 5000;
      await sampleNow();
      if (soak && next <= now()) {
        const skipped = Math.floor((now() - next) / 5000) + 1;
        missedSlots += skipped;
        next += skipped * 5000;
      }
    }
  })().catch(error => {
    poison(error);
  });
  return {
    sampleNow,
    ...(soak
      ? {
          summary: () => ({
            records: sequence,
            historicalPIDs: identities.size,
            missedSlots,
            underlyingReadPending,
          }),
        }
      : {}),
    async setBaseline() {
      try {
        const value = await sampleNow();
        if (
          value.totals.rssBytes >=
          0.75 * Math.min(4 * GiB, value.host.totalBytes / 4)
        ) {
          throw new Error("Lifecycle post-warmup baseline exceeds 75% RSS cap");
        }
        baseline = { ...value.totals };
        await save("lifecycle-baseline.json", value);
        return value;
      } catch (error) {
        throw poison(error);
      }
    },
    async stop() {
      stopping = true;
      controller.abort(new Error("Lifecycle monitor stopped"));
      await completion;
      await pending?.catch(() => {});
    },
  };
}

async function captureSoakCheckpoint({
  checkpoint,
  heldAt,
  observations,
  request,
  monitor,
  save,
  now,
}) {
  const bundle = {
    checkpoint,
    heldAtMs: heldAt,
    observedAtMs: null,
    observations,
    snapshot: null,
    diagnostics: null,
    resources: null,
    captureError: null,
  };
  let failure;
  let phase = "baseline";
  try {
    if (checkpoint.id === 0) {
      await monitor.setBaseline();
    }
    phase = "performance";
    bundle.snapshot = await request("umbrafox.performance.snapshot", {
      includeThreads: false,
      includeWindows: true,
    });
    phase = "diagnostics";
    bundle.diagnostics = await request("umbrafox.diagnostics.snapshot");
    phase = "resources";
    bundle.resources = await monitor.sampleNow();
  } catch (error) {
    failure = error instanceof Error ? error : new Error(String(error));
    const message =
      failure.message || failure.name || "Unknown capture failure";
    bundle.captureError = {
      phase,
      message: message.slice(0, 512),
      errorClipped: message.length > 512,
    };
  }
  bundle.observedAtMs = now();
  try {
    await save(
      `lifecycle-checkpoint-${checkpoint.id}.json`,
      bundle,
      failure ? "checkpoint-failure" : "work"
    );
  } catch (error) {
    if (!failure) {
      throw error;
    }
    failure.partialEvidenceError = (
      error instanceof Error ? error.message : String(error)
    ).slice(0, 512);
  }
  if (failure) {
    throw failure;
  }
  return bundle;
}

function validateSnapshot(snapshot, resources, owned) {
  if (
    snapshot.processID !== owned.child.pid ||
    snapshot.profiler?.active !== false
  ) {
    throw new Error("Lifecycle snapshot identity/profiler mismatch");
  }
  const identities = new Map(
    resources.processes.map(item => [item.identity.pid, item.identity])
  );
  const joins = [];
  const pending = [snapshot.process];
  const seen = new Set();
  while (pending.length) {
    const item = pending.pop();
    if (
      !item ||
      !identities.has(item.pid) ||
      seen.has(item.pid) ||
      seen.size >= 32
    ) {
      throw new Error(
        "Lifecycle ProcInfo process identity unknown or duplicate"
      );
    }
    seen.add(item.pid);
    finite(item.memory, "ProcInfo memory estimate");
    finite(item.cpuTime, "ProcInfo cumulative CPU");
    joins.push({
      identity: identities.get(item.pid),
      type: item.type ?? null,
      procInfoMemoryEstimateBytes: item.memory,
    });
    if (item.children) {
      if (!Array.isArray(item.children) || item.children.length > 32) {
        throw new Error("Lifecycle ProcInfo child count invalid");
      }
      for (const child of item.children) {
        pending.push(child);
      }
    }
  }
  return {
    processes: joins,
    omittedOwnedPIDs: [...identities.keys()].filter(pid => !seen.has(pid)),
    memoryMeaning:
      "Linux ProcInfo resident-minus-shared estimate, not RSS/PSS or JS heap; zero may be unavailable. Parent reporters are parent-local and null remains unknown.",
  };
}

export async function captureLifecycle({
  control,
  server,
  save,
  signal,
  bounded,
  monitor,
  owned,
  profile,
  admission,
  plan = getLifecyclePlan(),
  budget,
  now = () => performance.now(),
  wait = (ms, activeSignal) => delay(ms, undefined, { signal: activeSignal }),
}) {
  trustedPlan(plan);
  const soak = plan.name === "soak-30m";
  for (const expected of plan.checkpoints) {
    const { id } = expected;
    signal.throwIfAborted();
    if (soak) {
      budget.admit(id);
    }
    const checkpoint = await bounded(
      server.nextCheckpoint(),
      "Lifecycle checkpoint readiness",
      ...(soak ? [120000] : [])
    );
    if (
      checkpoint?.id !== id ||
      checkpoint.settleMs !== expected.settleMs ||
      checkpoint.completedCycles !== expected.completedCycles ||
      (soak && checkpoint.documentsCompleted !== expected.documentsCompleted)
    ) {
      throw new Error("Lifecycle checkpoint order/configuration mismatch");
    }
    if (soak) {
      budget.admit(id);
    }
    const heldAt = now();
    const quietDeadline = heldAt + checkpoint.settleMs;
    let remaining = checkpoint.settleMs;
    while (remaining > 0) {
      signal.throwIfAborted();
      await wait(Math.max(1, Math.ceil(remaining)), signal);
      remaining = quietDeadline - now();
    }
    signal.throwIfAborted();
    if (soak) {
      budget.admit(id + 1);
    }
    const observations = [];
    const request = async (method, params) => {
      signal.throwIfAborted();
      const sentMs = now();
      const result = await bounded(
        control.request(method, params),
        method,
        15000
      );
      observations.push({
        method,
        sentMs,
        receivedMs: now(),
        bytes: Buffer.byteLength(JSON.stringify(result)),
        ...(soak
          ? {
              requestPayloadBytes: Buffer.byteLength(
                JSON.stringify({ method, params: params ?? {} })
              ),
              byteMeaning:
                "UTF-8 JSON method/params and result payloads; excludes protocol envelope and transport framing.",
            }
          : {}),
      });
      return result;
    };
    let snapshot;
    let diagnostics;
    let resources;
    if (soak) {
      ({ snapshot, diagnostics, resources } = await captureSoakCheckpoint({
        checkpoint,
        heldAt,
        observations,
        request,
        monitor,
        save,
        now,
      }));
    } else {
      if (id === 0) {
        await monitor.setBaseline();
      }
      snapshot = await request("umbrafox.performance.snapshot", {
        includeThreads: false,
        includeWindows: true,
      });
      diagnostics =
        id === 1 ? null : await request("umbrafox.diagnostics.snapshot");
      resources = await monitor.sampleNow();
      await save(`lifecycle-checkpoint-${id}.json`, {
        checkpoint,
        heldAtMs: heldAt,
        observedAtMs: now(),
        observations,
        snapshot,
        diagnostics,
        resources,
      });
    }
    if (soak && !diagnostics) {
      throw new Error("Lifecycle checkpoint diagnostics missing");
    }
    const attribution = validateSnapshot(snapshot, resources, owned);
    if (
      diagnostics &&
      (diagnostics.processID !== owned.child.pid ||
        diagnostics.profileDir !== profile ||
        diagnostics.channel !== "umbrafox-control")
    ) {
      throw new Error("Lifecycle diagnostics identity mismatch");
    }
    const expectedURL = admission.urls[id + 1];
    const isolation = validateLifecycleWindows(snapshot, expectedURL);
    const tabContext = diagnostics
      ? validateLifecycleTab(diagnostics, expectedURL, admission.context)
      : null;
    await save(`lifecycle-attribution-${id}.json`, attribution);
    await save(`lifecycle-isolation-${id}.json`, {
      expectedURL,
      ...isolation,
      tabContext,
      selectionContextObserved: diagnostics !== null,
      limitation:
        "Observed windows only; background process windows are separate. No continuous tab, outbound-network or whole-memory isolation claim.",
    });
    signal.throwIfAborted();
    if (soak) {
      budget.admit(id + 1);
    }
    await server.releaseCheckpoint(id);
  }
  if (
    soak &&
    (await bounded(
      server.nextCheckpoint(),
      "Lifecycle terminal checkpoint",
      15000
    )) !== null
  ) {
    throw new Error("Unexpected lifecycle terminal checkpoint");
  }
}
