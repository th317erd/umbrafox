/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Buffer } from "node:buffer";
import process from "node:process";
import { constants, createReadStream } from "node:fs";
import {
  access,
  chmod,
  copyFile,
  lstat,
  mkdir,
  open as openFile,
  readdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import { arch, cpus, platform, release } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import {
  applicationDataPaths,
  browserEnvironment,
  connectControl,
  createBoundedLogger,
  createFixtureServer,
  parseArgs,
  spawnOwned,
  stopOwned,
  summarize,
  validateDiscovery,
  validateLogEvidence,
  validateResult,
  withTimeout,
} from "./helpers.mjs";
import {
  captureLifecycle,
  createLifecycleBudget,
  createLifecycleEvidence,
  readLifecycleHost,
  startLifecycleMonitor,
  validateLifecycleTab,
  validateLifecycleWindows,
  waitForLifecycleReady,
} from "./lifecycle-capture.mjs";
import { getLifecyclePlan, serializeLifecycleSnapshot } from "./lifecycle.mjs";

export function profilePreferences(suite) {
  const prefs = {
    "umbrafox.control.enabled": true,
    "umbrafox.control.port": 0,
  };
  if (suite === "lifecycle") {
    prefs["startup.homepage_welcome_url"] = "";
    prefs["startup.homepage_welcome_url.additional"] = "";
    prefs["datareporting.policy.dataSubmissionEnabled"] = false;
  }
  return prefs;
}

async function saveLifecycleBoundary(
  save,
  phase,
  snapshot,
  graphics,
  admission,
  diagnostics = null
) {
  if (
    snapshot.processID !== admission.diagnostics.processID ||
    snapshot.profiler?.active !== false
  ) {
    throw new Error("Lifecycle boundary identity/profiler mismatch");
  }
  if (
    !Array.isArray(graphics.windows) ||
    graphics.windows.filter(item => item?.type === "navigator:browser")
      .length !== 1 ||
    graphics.windows.some(
      item => !item || !["navigator:browser", null].includes(item.type)
    )
  ) {
    throw new Error("Lifecycle graphics browser-window coverage invalid");
  }
  const expectedURL =
    phase === "before" ? admission.urls[0] : admission.urls.at(-1);
  if (
    diagnostics &&
    (diagnostics.processID !== admission.diagnostics.processID ||
      diagnostics.profileDir !== admission.diagnostics.profileDir ||
      diagnostics.channel !== "umbrafox-control")
  ) {
    throw new Error("Lifecycle after diagnostics identity mismatch");
  }
  let tabContext = phase === "before" ? admission.context : null;
  if (diagnostics) {
    tabContext = validateLifecycleTab(
      diagnostics,
      expectedURL,
      admission.context
    );
  }
  await save(`lifecycle-isolation-${phase}.json`, {
    expectedURL,
    ...validateLifecycleWindows(snapshot, expectedURL),
    tabContext,
    selectionContextObserved: phase === "before" || diagnostics !== null,
    setupRPCs: admission.attempts,
    additionalSetupRPCs: admission.attempts - 1,
    nonBrowserGraphicsWindows: graphics.windows.filter(
      item => item.type !== "navigator:browser"
    ),
    limitation:
      "Observed windows only; background/hidden windows are separate. No continuous tab, outbound-network or whole-memory isolation claim.",
  });
}

async function hashFile(path, signal) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path, { signal })) {
    hash.update(chunk);
  }
  return hash.digest("hex");
}

export async function checkBus(path) {
  const text = (await readFile(path, "utf8")).trim();
  if (text !== "OK") {
    throw new Error(
      text.startsWith("HALT") ? "HALT requested" : "Bus must contain OK"
    );
  }
}

async function readProvenanceINI(path, signal) {
  const handle = await openFile(path, "r");
  try {
    signal.throwIfAborted();
    const metadata = await handle.stat();
    if (
      !metadata.isFile() ||
      !Number.isSafeInteger(metadata.size) ||
      metadata.size > 65536
    ) {
      throw new Error("Lifecycle INI input cap/type invalid");
    }
    const buffer = Buffer.alloc(65537);
    let offset = 0;
    while (offset < buffer.length) {
      signal.throwIfAborted();
      const { bytesRead } = await handle.read(
        buffer,
        offset,
        buffer.length - offset,
        offset
      );
      if (!bytesRead) {
        break;
      }
      offset += bytesRead;
    }
    signal.throwIfAborted();
    if (offset > 65536 || offset !== metadata.size) {
      throw new Error("Lifecycle INI input cap/size changed");
    }
    return buffer.subarray(0, offset);
  } finally {
    await handle.close();
  }
}

async function readApplicationDirectory(path, empty, signal, io) {
  signal.throwIfAborted();
  const metadata = await io.lstat(path);
  signal.throwIfAborted();
  if (
    !metadata.isDirectory() ||
    metadata.uid !== process.getuid() ||
    (metadata.mode & 0o7777) !== 0o700
  ) {
    throw new Error("Application-data directory must be owner-private (0700)");
  }
  const canonical = await io.realpath(path);
  signal.throwIfAborted();
  if (canonical !== path) {
    throw new Error("Application-data directory must not be aliased");
  }
  if (empty) {
    const entries = await io.readdir(path);
    signal.throwIfAborted();
    if (entries.length) {
      throw new Error("Application-data directory must be empty before launch");
    }
  }
  return Object.freeze({
    dev: metadata.dev,
    ino: metadata.ino,
    uid: metadata.uid,
    mode: metadata.mode & 0o7777,
  });
}

export async function createOutputRoot(root, signal, operations = {}) {
  signal.throwIfAborted();
  applicationDataPaths(root);
  const io = { mkdir, lstat, realpath, ...operations };
  const parentDirectory = dirname(root);
  const canonicalParent = await io.realpath(parentDirectory);
  signal.throwIfAborted();
  if (canonicalParent !== parentDirectory) {
    throw new Error(
      "Application-data output parent must be canonical, not aliased"
    );
  }
  await io.mkdir(root, { mode: 0o700 });
  const identity = await readApplicationDirectory(root, false, signal, io);
  return Object.freeze({ root, identity });
}

function compareApplicationIdentity(identity, expected) {
  if (
    !expected ||
    ["dev", "ino", "uid", "mode"].some(
      field => identity[field] !== expected[field]
    )
  ) {
    throw new Error(
      "Application-data directory identity missing or changed before launch"
    );
  }
}

export async function createApplicationData(output, signal, operations = {}) {
  signal.throwIfAborted();
  const paths = applicationDataPaths(output?.root);
  const io = { mkdir, lstat, realpath, readdir, ...operations };
  compareApplicationIdentity(
    await readApplicationDirectory(paths.root, false, signal, io),
    output.identity
  );
  const creation = { root: output.identity };
  const identities = new Set([`${creation.root.dev}:${creation.root.ino}`]);
  for (const key of ["appData", "localAppData", "tempDir"]) {
    signal.throwIfAborted();
    await io.mkdir(paths[key], { mode: 0o700 });
    signal.throwIfAborted();
    creation[key] = await readApplicationDirectory(
      paths[key],
      true,
      signal,
      io
    );
    const identity = `${creation[key].dev}:${creation[key].ino}`;
    if (identities.has(identity)) {
      throw new Error(
        "Application-data directories must have distinct identities"
      );
    }
    identities.add(identity);
  }
  return Object.freeze({ ...paths, creation: Object.freeze(creation) });
}

export async function verifyApplicationData(evidence, signal, operations = {}) {
  signal.throwIfAborted();
  const paths = applicationDataPaths(evidence?.root);
  const io = { lstat, realpath, readdir, ...operations };
  for (const key of ["root", "appData", "localAppData", "tempDir"]) {
    if (evidence[key] !== paths[key] || !evidence.creation?.[key]) {
      throw new Error(
        "Application-data creation evidence is missing or inconsistent"
      );
    }
    const identity = await readApplicationDirectory(
      paths[key],
      key !== "root",
      signal,
      io
    );
    compareApplicationIdentity(identity, evidence.creation[key]);
  }
}

export async function collectProvenance(options, output, signal, save) {
  signal.throwIfAborted();
  const { root } = output;
  const binary = await realpath(options.binary);
  await access(binary, constants.X_OK);
  const handle = await openFile(binary, "r");
  try {
    const header = Buffer.alloc(20);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    if (
      bytesRead !== header.length ||
      header.subarray(0, 4).toString("hex") !== "7f454c46" ||
      header[5] !== 1 ||
      ![3, 62].includes(header.readUInt16LE(18))
    ) {
      throw new Error(
        "Binary must be an existing x86 ELF executable, not a launcher script"
      );
    }
  } finally {
    await handle.close();
  }
  const applicationData = await createApplicationData(output, signal);
  const environment = browserEnvironment(
    process.env,
    options.profile,
    options.suite,
    applicationData
  );
  const files = {};
  for (const fileName of [
    basename(binary),
    "libxul.so",
    "application.ini",
    "platform.ini",
  ]) {
    const path = join(dirname(binary), fileName);
    let preservingINI = false;
    try {
      if (
        options.suite === "lifecycle" &&
        options["lifecycle-plan"] === "soak-30m" &&
        ["application.ini", "platform.ini"].includes(fileName)
      ) {
        const resolved = await realpath(path);
        const bytes = await readProvenanceINI(resolved, signal);
        files[fileName] = {
          path: resolved,
          sha256: createHash("sha256").update(bytes).digest("hex"),
        };
        preservingINI = true;
        await save(fileName, bytes);
        continue;
      }
      files[fileName] = {
        path: await realpath(path),
        sha256: await hashFile(path, signal),
      };
      if (fileName.endsWith(".ini")) {
        await copyFile(path, join(root, fileName), constants.COPYFILE_EXCL);
      }
    } catch (error) {
      if (
        preservingINI ||
        fileName !== "platform.ini" ||
        error.code !== "ENOENT"
      ) {
        throw error;
      }
      files[fileName] = null;
    }
  }
  const fixtureHashes = {};
  for (const fileName of [
    "fixture/index.html",
    "fixture/fixture.css",
    "fixture/fixture.mjs",
    "helpers.mjs",
    "run.mjs",
    ...(options.suite === "userland-cache" ? ["userland-cache.mjs"] : []),
    ...(options.suite === "lifecycle"
      ? ["lifecycle.mjs", "lifecycle-capture.mjs"]
      : []),
  ]) {
    fixtureHashes[fileName] = await hashFile(
      fileURLToPath(new URL(fileName, import.meta.url)),
      signal
    );
  }
  const userlandModules = ["userland-cache", "lifecycle"].includes(
    options.suite
  )
    ? {}
    : undefined;
  if (userlandModules) {
    for (const moduleName of [
      "modules/UmbrafoxUserlandScriptRegistry.sys.mjs",
      "modules/UmbrafoxUserlandScriptStore.sys.mjs",
      "modules/UmbrafoxUserlandScriptRuntime.sys.mjs",
      "modules/UmbrafoxUserlandEventController.sys.mjs",
      "moz-src/toolkit/actors/UmbrafoxUserlandParent.sys.mjs",
      "moz-src/toolkit/actors/UmbrafoxUserlandChild.sys.mjs",
      "modules/ActorManagerParent.sys.mjs",
    ]) {
      try {
        const path = await realpath(join(dirname(binary), moduleName));
        userlandModules[moduleName] = {
          path,
          sha256: await hashFile(path, signal),
        };
      } catch (error) {
        if (error.code !== "ENOENT") {
          throw error;
        }
        userlandModules[moduleName] = null;
      }
    }
  }
  signal.throwIfAborted();
  await save("provenance.json", {
    files,
    fixtureHashes,
    ...(userlandModules ? { userlandModules } : {}),
    environment,
    applicationData,
    host: {
      platform: platform(),
      release: release(),
      arch: arch(),
      logicalCPUs: cpus().length,
      cpuModel: cpus()[0]?.model,
      node: process.version,
    },
    isolation:
      "New explicit profile; headless; no remote agent, Marionette, or WebDriver; ambient environment allowlisted.",
  });
  signal.throwIfAborted();
  return { binary, environment, applicationData };
}

export async function captureWorkloads({
  control,
  owned,
  profile,
  options,
  environment,
  root,
  mode,
  save,
  milestone,
  bounded,
  scrub,
  signal,
  server,
  validateUserlandCacheResult,
  validateLifecycleResult,
  lifecycleCapture = captureLifecycle,
  monitor,
  budget,
}) {
  const plan =
    options.suite === "lifecycle"
      ? getLifecyclePlan(options["lifecycle-plan"])
      : null;
  const soak = plan?.name === "soak-30m";
  if (soak) {
    budget.admit(0);
  }
  const admission =
    options.suite === "lifecycle"
      ? await waitForLifecycleReady({
          control,
          server,
          owned,
          profile,
          bounded,
          signal,
          save,
          plan,
        })
      : null;
  const diagnostics =
    admission?.diagnostics ??
    (await control.request("umbrafox.diagnostics.snapshot"));
  if (
    diagnostics.processID !== owned.child.pid ||
    diagnostics.profileDir !== profile ||
    diagnostics.channel !== "umbrafox-control"
  ) {
    throw new Error("UmbraLink does not match the owned browser/profile");
  }
  await save("diagnostics-before.json", diagnostics);
  const graphicsBefore = await control.request("umbrafox.gfx.snapshot");
  await save("graphics-before.json", graphicsBefore);
  const before = await control.request("umbrafox.performance.snapshot", {
    includeThreads: options.suite !== "lifecycle",
    includeWindows: options.suite === "lifecycle",
  });
  await save("performance-before.json", before);
  if (before.profiler?.active !== (options.profile === "on")) {
    throw new Error("Observed profiler mode does not match requested mode");
  }
  if (admission) {
    await saveLifecycleBoundary(
      save,
      "before",
      before,
      graphicsBefore,
      admission
    );
  }
  if (options.profile === "on") {
    for (const feature of environment.env.MOZ_PROFILER_STARTUP_FEATURES.split(
      ","
    )) {
      if (!before.profiler.supportedFeatures?.includes(feature)) {
        throw new Error(`Requested profiler feature unsupported: ${feature}`);
      }
    }
  }
  if (soak) {
    budget.admit(0);
  }
  milestone("workloadReleased");
  server.start();
  if (options.suite === "lifecycle") {
    await lifecycleCapture({
      control,
      owned,
      profile,
      server,
      save,
      bounded,
      signal,
      monitor,
      admission,
      plan,
      budget,
    });
  }
  if (soak) {
    budget.admit(plan.checkpoints.length);
  }
  const result = await bounded(
    server.result,
    "Fixture completion",
    ...(soak ? [120000] : [])
  );
  milestone("workloadCompleted");
  await save("samples.json", result);
  if (options.suite === "userland-cache") {
    await validateUserlandCacheResult(result, options);
    await save("statistics.json", {
      mode: "diagnostic-only",
      workloads: null,
      explanation:
        "Diagnostic cache-path evidence only; logging is enabled and no release timing score is computed.",
    });
  } else if (options.suite === "lifecycle") {
    await validateLifecycleResult(result, options);
    await save("statistics.json", {
      mode: soak ? "lifecycle-soak-observation-only" : "lifecycle-smoke-only",
      workloads: null,
      explanation: soak
        ? "Bounded NONE lifecycle observations only; no causal leak, whole-memory isolation, or release timing score."
        : "Bounded lifecycle correctness and resource smoke only; no leak slope, controller ownership, active-state certification for unrelated, or release timing score.",
    });
  } else {
    validateResult(result, options);
    const statistics = {};
    for (const workload of ["js", "dom-batched", "dom-interleaved", "canvas"]) {
      statistics[workload] = summarize(
        result.samples
          .filter(
            sample => sample.stage === "trial" && sample.workload === workload
          )
          .map(sample => sample.durationMs)
      );
    }
    await save("statistics.json", {
      mode,
      unit: "ms",
      withinProcessOnly: true,
      workloads: statistics,
    });
  }
  const graphicsAfter = await control.request("umbrafox.gfx.snapshot");
  await save("graphics-after.json", graphicsAfter);
  const after = await control.request("umbrafox.performance.snapshot", {
    includeThreads: options.suite !== "lifecycle",
    includeWindows: options.suite === "lifecycle",
  });
  await save("performance-after.json", after);
  let diagnosticsAfter = null;
  if (soak) {
    budget.admit(plan.checkpoints.length);
    diagnosticsAfter = await control.request("umbrafox.diagnostics.snapshot");
    await save("diagnostics-after.json", diagnosticsAfter);
    if (!diagnosticsAfter) {
      throw new Error("Lifecycle after diagnostics missing");
    }
  }
  if (admission) {
    await saveLifecycleBoundary(
      save,
      "after",
      after,
      graphicsAfter,
      admission,
      diagnosticsAfter
    );
  }
  if (options.profile === "on") {
    const profileDump = await control.request(
      "umbrafox.performance.profile.dump",
      { filename: "local-performance.json", sinceTime: 0 }
    );
    const expected = join(
      profile,
      "umbrafox",
      "diagnostics",
      "profiles",
      "local-performance.json"
    );
    if (
      profileDump.path !== expected ||
      (await realpath(profileDump.path)) !== expected
    ) {
      throw new Error("Unexpected profiler output path");
    }
    if ((await lstat(profileDump.path)).size > 512 * 1024 * 1024) {
      throw new Error("Profiler capture exceeds 512 MiB preservation limit");
    }
    await writeFile(
      join(root, "profile.json"),
      scrub(await readFile(profileDump.path, "utf8")),
      { flag: "wx", mode: 0o600 }
    );
    await chmod(join(root, "profile.json"), 0o600);
    await save("profile-dump.json", {
      path: "profile.json",
      sha256: await hashFile(join(root, "profile.json"), signal),
    });
  }
}

export async function readDiscovery(discoveryPath, signal, timeoutMs = 30000) {
  const discoverySignal = AbortSignal.any([
    signal,
    AbortSignal.timeout(timeoutMs),
  ]);
  try {
    while (true) {
      discoverySignal.throwIfAborted();
      let handle;
      try {
        const metadata = await lstat(discoveryPath);
        if (!metadata.isFile() || metadata.uid !== process.getuid()) {
          throw new Error("Discovery must be an owner-private regular file");
        }
        if ((metadata.mode & 0o077) !== 0) {
          await delay(50, undefined, { signal: discoverySignal });
          continue;
        }
        handle = await openFile(
          discoveryPath,
          constants.O_RDONLY | constants.O_NOFOLLOW
        );
        const opened = await handle.stat();
        if (
          !opened.isFile() ||
          opened.uid !== process.getuid() ||
          (opened.mode & 0o077) !== 0 ||
          opened.dev !== metadata.dev ||
          opened.ino !== metadata.ino
        ) {
          throw new Error(
            "Discovery changed during owner-private file verification"
          );
        }
        discoverySignal.throwIfAborted();
        const contents = await handle.readFile({
          encoding: "utf8",
          signal: discoverySignal,
        });
        let discovery;
        try {
          discovery = JSON.parse(contents);
        } catch {
          throw new Error("Malformed discovery JSON");
        }
        validateDiscovery(discovery);
        return discovery;
      } catch (error) {
        if (error.code === "ELOOP") {
          throw new Error("Discovery must be an owner-private regular file");
        }
        if (error.code !== "ENOENT") {
          throw error;
        }
      } finally {
        await handle?.close();
      }
      await delay(50, undefined, { signal: discoverySignal });
    }
  } catch (error) {
    signal.throwIfAborted();
    if (discoverySignal.aborted) {
      throw new Error("Discovery readiness timed out");
    }
    throw error;
  }
}

export async function prepareFixtureEvidence(
  suite,
  profile,
  server,
  save,
  secrets
) {
  if (suite === "basic") {
    secrets.push(new URL(server.url).pathname);
  }
  if (["userland-cache", "lifecycle"].includes(suite)) {
    await mkdir(join(profile, "umbrafox"), { mode: 0o700 });
    await writeFile(
      join(profile, "umbrafox", "userland-scripts.json"),
      JSON.stringify(server.scriptStore, null, 2) + "\n",
      { flag: "wx", mode: 0o600 }
    );
    await save("userland-script-store.json", server.scriptStore);
    await save(`${suite}-metadata.json`, server.metadata);
  }
}

export async function preserveFixtureState({
  server,
  save,
  report,
  scrub,
  failure,
  timeoutMs = 5000,
}) {
  try {
    if (typeof server?.snapshot !== "function") {
      return failure;
    }
    const snapshot = server.snapshot();
    if (snapshot && typeof snapshot.then === "function") {
      Promise.resolve(snapshot).catch(() => {});
      throw new Error("Fixture snapshot must return a synchronous object");
    }
    if (!snapshot || typeof snapshot !== "object") {
      throw new Error("Fixture snapshot must return a synchronous object");
    }
    await withTimeout(
      save("fixture-state.json", snapshot),
      timeoutMs,
      "Fixture state preservation"
    );
  } catch (error) {
    const snapshotError =
      error instanceof Error
        ? error
        : new Error(`Fixture state preservation failed: ${String(error)}`);
    report.status = "failed";
    report.fixtureStateError = scrub(snapshotError.message);
    return failure ?? snapshotError;
  }
  return failure;
}

export async function finishLifecycle({
  owned,
  server,
  monitor,
  control,
  logger,
  log,
  report,
  save,
  scrub,
  failure,
  abort,
  cancelLog,
  budget,
  operationTimeoutMs = 1000,
}) {
  let firstFailure = failure;
  const failed = (error, label) => {
    firstFailure ??= error;
    report.status = "cleanup-failed";
    report.cleanupErrors ??= [];
    report.cleanupErrors.push({
      operation: label,
      error: scrub(error.message),
    });
  };
  const attempt = async (label, operation, cap = operationTimeoutMs) => {
    let settled = false;
    let started = false;
    try {
      const milliseconds = Math.min(cap, budget.remaining(true));
      const operationSignal = AbortSignal.timeout(
        Math.max(1, Math.floor(milliseconds))
      );
      started = true;
      const pending = Promise.resolve().then(() => operation(operationSignal));
      pending.then(
        () => {
          settled = true;
        },
        () => {
          settled = true;
        }
      );
      return await withTimeout(pending, milliseconds, label);
    } catch (error) {
      failed(error, label);
      if (started && !settled) {
        report.unsettledCleanup ??= [];
        report.unsettledCleanup.push(label);
      }
      return undefined;
    }
  };
  try {
    firstFailure = await preserveFixtureState({
      server,
      save,
      report,
      scrub,
      failure: firstFailure,
      timeoutMs: Math.min(2000, budget.remaining(true)),
    });
  } catch (error) {
    failed(error, "fixture state");
  }
  abort("Run finished; cancel outstanding work");
  await attempt("Lifecycle monitor stop", () => monitor?.stop());
  await attempt("Lifecycle control close", () => control?.close());
  if (owned) {
    try {
      const milliseconds = Math.min(5000, budget.remaining(true));
      report.cleanup = await stopOwned(
        owned,
        milliseconds,
        AbortSignal.timeout(Math.max(1, Math.floor(milliseconds)))
      );
    } catch (error) {
      report.cleanup = {
        status: "cleanup-failed",
        reason: scrub(error.message),
      };
    }
    if (report.cleanup.status !== "clean") {
      failed(
        new Error("Owned browser cleanup failed; no SIGKILL escalation"),
        "owned process group"
      );
      owned.child.unref();
      owned.child.stdout?.destroy();
      owned.child.stderr?.destroy();
    }
  }
  await attempt("Lifecycle fixture close", () => server?.close());
  if (owned && report.cleanup?.status === "clean") {
    await attempt("Lifecycle browser output drain", () => owned.closed);
  }
  report.log = await attempt("Lifecycle log finish", () => logger?.finish());
  cancelLog();
  await attempt("Lifecycle log close", () => log?.close());
  try {
    if (logger || owned) {
      validateLogEvidence(report.log, "lifecycle");
    }
  } catch (error) {
    failed(error, "log completeness");
  }
  return firstFailure;
}

export async function finishStandard({
  owned,
  server,
  logger,
  log,
  report,
  scrub,
  failure,
  suite,
}) {
  let firstFailure = failure;
  if (owned) {
    try {
      report.cleanup = await stopOwned(owned);
    } catch (error) {
      report.cleanup = {
        status: "cleanup-failed",
        reason: scrub(error.message),
      };
    }
    if (report.cleanup.status !== "clean") {
      report.status = "cleanup-failed";
      firstFailure ??= new Error(
        "Browser cleanup failed; inspect run.json and process.json"
      );
      owned.child.unref();
      owned.child.stdout?.destroy();
      owned.child.stderr?.destroy();
    }
  }
  try {
    await server?.close();
  } catch (error) {
    firstFailure ??= error;
    report.status = "cleanup-failed";
  }
  try {
    if (owned && report.cleanup?.status === "clean") {
      await withTimeout(owned.closed, 1000, "Browser output drain");
    }
    report.log = await logger?.finish();
  } catch (error) {
    firstFailure ??= error;
    report.status = "cleanup-failed";
  }
  try {
    await log?.close();
  } catch (error) {
    firstFailure ??= error;
    report.status = "cleanup-failed";
  }
  try {
    validateLogEvidence(report.log, suite);
  } catch (error) {
    firstFailure ??= error;
    if (report.status === "passed") {
      report.status = "failed";
    }
  }
  return firstFailure;
}

export async function main(args) {
  const options = parseArgs(args);
  const lifecyclePlan =
    options.suite === "lifecycle"
      ? getLifecyclePlan(options["lifecycle-plan"])
      : null;
  const lifecycleBudget =
    options.suite === "lifecycle"
      ? createLifecycleBudget(options["timeout-ms"], undefined, lifecyclePlan)
      : null;
  if (platform() !== "linux" || !["x64", "ia32"].includes(arch())) {
    throw new Error("This local harness requires Linux x86 and /proc");
  }
  await checkBus(options.bus);
  const controller = new AbortController();
  const { signal } = controller;
  const output = await createOutputRoot(options.output, signal);
  const { root } = output;
  const profile = join(root, "profile");
  const abort = reason => {
    if (!signal.aborted) {
      controller.abort(new Error(reason));
    }
  };
  const interrupt = () => abort("Interrupted by owner");
  process.on("SIGINT", interrupt);
  process.on("SIGTERM", interrupt);
  const timeout = setTimeout(
    () => abort("Run deadline exceeded"),
    lifecycleBudget ? lifecycleBudget.remaining() : options["timeout-ms"]
  );
  let busChecking = false;
  const busTimer = setInterval(async () => {
    if (busChecking) {
      return;
    }
    busChecking = true;
    try {
      await checkBus(options.bus);
    } catch (error) {
      abort(error.message);
    } finally {
      busChecking = false;
    }
  }, 200);
  const secrets = [];
  const scrub = value => {
    let text = String(value).replace(/([?&]token=)[^\s"'<>]+/g, "$1[redacted]");
    for (const secret of secrets) {
      text = text.replaceAll(secret, "[redacted]");
    }
    return text;
  };
  let cleaningUp = false;
  const logController = new AbortController();
  const lifecycleSave = lifecycleBudget
    ? createLifecycleEvidence({
        root,
        scrub,
        budget: lifecycleBudget,
        signal,
        plan: lifecyclePlan,
        serializeFixture:
          lifecyclePlan.name === "soak-30m"
            ? (value, scrubText) =>
                serializeLifecycleSnapshot(value, options, scrubText)
            : undefined,
      })
    : null;
  const save = (fileName, value, phase = "work") => {
    if (lifecycleSave) {
      return lifecycleSave(fileName, value, cleaningUp ? "cleanup" : phase);
    }
    return writeFile(
      join(root, fileName),
      scrub(JSON.stringify(value, null, 2)) + "\n",
      { mode: 0o600 }
    );
  };
  const report = {
    version: 1,
    status: "running",
    startedAt: new Date().toISOString(),
    mode: {
      basic: options.profile === "on" ? "attribution-only" : "local-timing",
      "userland-cache": "diagnostic-only",
      lifecycle:
        lifecyclePlan?.name === "soak-30m"
          ? "lifecycle-soak-observation-only"
          : "lifecycle-smoke-only",
    }[options.suite],
    limitations: [
      "Local smoke/survey only, not a cold/warm benchmark. Trials are correlated within one process run.",
      "Headless CPU/canvas copy-readback fixture is not a hardware graphics or interactive browsing oracle.",
      "Profiler-on durations are attribution evidence only and must not be compared as regression timings.",
    ],
    config: options,
    milestones: {},
  };
  let owned;
  let server;
  let validateUserlandCacheResult;
  let validateLifecycleResult;
  let monitor;
  let startupTimeout;
  let control;
  let log;
  let logger;
  let failure;
  let shuttingDown = false;
  const launchTime = performance.now();
  const milestone = milestoneName => {
    report.milestones[milestoneName] = performance.now() - launchTime;
    if (milestoneName === "workloadReleased") {
      clearTimeout(startupTimeout);
    }
  };
  const bounded = (promise, label, milliseconds = options["timeout-ms"]) => {
    try {
      return withTimeout(
        promise,
        lifecycleBudget
          ? Math.min(milliseconds, lifecycleBudget.remaining())
          : milliseconds,
        label,
        signal
      );
    } catch (error) {
      promise.catch(() => {});
      return Promise.reject(error);
    }
  };
  try {
    await save("run.json", report);
    if (lifecycleBudget) {
      lifecycleBudget.admit(0);
      await save("lifecycle-preflight.json", {
        controllerPID: process.pid,
        controllerTimeOriginMs: performance.timeOrigin,
        host: await bounded(
          readLifecycleHost(root),
          "Lifecycle host preflight",
          3000
        ),
        caps: {
          totalMs: options["timeout-ms"],
          cleanupReserveMs: 15000,
          terminalReportReserveMs: 2000,
          startupMs: 30000,
          resourceIntervalMs: 5000,
          evidenceBytes: 64 * 1024 ** 2,
          ordinaryEvidenceBytes: 54 * 1024 ** 2,
          terminalEvidenceBytes: 2 * 1024 ** 2,
          artifactBytes: 256 * 1024 ** 2,
          ownedRSSBytes: "min(4 GiB, 25% MemTotal, post-warmup+1 GiB)",
          ownedProcesses: "min(32, baseline+8)",
          ownedFDs: "min(2048, baseline+256)",
          ownedThreads: "min(512, baseline+128)",
        },
        ...(lifecyclePlan.name === "soak-30m"
          ? {
              plan: lifecyclePlan,
              minimumSnapshotRPCs: 28,
              snapshotRPCFormula:
                "27 + setup attempts = 28 + additionalSetupRPCs; minimum includes one accepted setup diagnostics call.",
              setupRPCs:
                "Variable positive-readiness diagnostics; attempts/additionalSetupRPCs recorded separately. Discovery/WebSocket setup is not an extra status RPC; no status RPC is issued.",
            }
          : {}),
      });
    }
    const { binary, environment, applicationData } = await collectProvenance(
      options,
      output,
      signal,
      save
    );
    await mkdir(profile, { mode: 0o700 });
    const prefs = profilePreferences(options.suite);
    await writeFile(
      join(profile, "user.js"),
      Object.entries(prefs)
        .map(
          ([prefName, value]) =>
            `user_pref(${JSON.stringify(prefName)}, ${JSON.stringify(value)});`
        )
        .join("\n") + "\n",
      { mode: 0o600 }
    );
    await save("preferences.json", prefs);
    if (options.suite === "userland-cache") {
      const userlandModule = await import("./userland-cache.mjs");
      server = await userlandModule.createUserlandCacheServer(options, signal);
      validateUserlandCacheResult = userlandModule.validateUserlandCacheResult;
    } else if (options.suite === "lifecycle") {
      const lifecycleModule = await import("./lifecycle.mjs");
      server = await lifecycleModule.createLifecycleServer(options, signal);
      validateLifecycleResult = lifecycleModule.validateLifecycleResult;
    } else {
      server = await createFixtureServer({
        trials: options.trials,
        warmup: options.warmup,
      });
    }
    await prepareFixtureEvidence(options.suite, profile, server, save, secrets);
    log = await openFile(join(root, "browser.log"), "wx", 0o600);
    logger = createBoundedLogger(
      text => {
        if (!lifecycleBudget) {
          return log.write(text);
        }
        logController.signal.throwIfAborted();
        const milliseconds = Math.min(
          1000,
          lifecycleBudget.remaining(cleaningUp)
        );
        return writeFile(join(root, "browser.log"), text, {
          flag: "a",
          signal: AbortSignal.any([
            logController.signal,
            AbortSignal.timeout(Math.max(1, Math.floor(milliseconds))),
          ]),
        });
      },
      scrub,
      8 * 1024 * 1024,
      lifecycleBudget
        ? () => abort("Lifecycle browser log cap exceeded")
        : undefined
    );
    await checkBus(options.bus);
    await verifyApplicationData(applicationData, signal);
    signal.throwIfAborted();
    milestone("beforeSpawn");
    if (lifecycleBudget) {
      lifecycleBudget.admit(0);
      startupTimeout = setTimeout(
        () => abort("Lifecycle startup exceeded 30 seconds"),
        30000
      );
    }
    owned = await spawnOwned(
      binary,
      [
        "-no-remote",
        "-new-instance",
        "-headless",
        "-profile",
        profile,
        server.url,
      ],
      { env: environment.env, stdio: ["ignore", "pipe", "pipe"] }
    );
    for (const stream of [owned.child.stdout, owned.child.stderr].filter(
      Boolean
    )) {
      stream.setEncoding("utf8");
      stream.on("data", chunk => logger.push(stream, chunk));
      stream.on("error", () => abort("Browser log stream failed"));
    }
    owned.completion.then(() => {
      if (!shuttingDown) {
        abort("Browser exited before run completion");
      }
    });
    await save("process.json", {
      identity: owned.identity,
      identityError: owned.identityError,
      profile,
    });
    if (owned.identityError || !owned.identity) {
      throw new Error("Could not prove detached browser ownership");
    }
    if (lifecycleBudget) {
      monitor = await startLifecycleMonitor({
        owned,
        root,
        signal,
        abort,
        save,
        plan: lifecyclePlan,
      });
    }
    const discoveryPath = join(profile, "umbrafox", "control.json");
    const discovery = await readDiscovery(discoveryPath, signal);
    secrets.push(discovery.token, encodeURIComponent(discovery.token));
    control = await connectControl(discovery, signal);
    milestone("controlConnected");
    await captureWorkloads({
      control,
      owned,
      profile,
      options,
      environment,
      root,
      mode: report.mode,
      save,
      milestone,
      bounded,
      scrub,
      signal,
      server,
      validateUserlandCacheResult,
      validateLifecycleResult,
      monitor,
      budget: lifecycleBudget,
    });
    await checkBus(options.bus);
    signal.throwIfAborted();
    report.status = "passed";
  } catch (error) {
    failure = error;
    report.status = "failed";
    report.error = scrub(error.message);
    if (error.partialEvidenceError) {
      report.partialEvidenceError = scrub(error.partialEvidenceError);
    }
  } finally {
    shuttingDown = true;
    cleaningUp = true;
    clearTimeout(startupTimeout);
    if (lifecycleBudget) {
      failure = await finishLifecycle({
        owned,
        server,
        monitor,
        control,
        logger,
        log,
        report,
        save,
        scrub,
        failure,
        abort,
        cancelLog: () => logController.abort(),
        budget: lifecycleBudget,
      });
      if (lifecyclePlan.name === "soak-30m") {
        report.resourceMonitor = monitor?.summary() ?? null;
      }
      clearTimeout(timeout);
      clearInterval(busTimer);
    } else {
      failure = await preserveFixtureState({
        server,
        save,
        report,
        scrub,
        failure,
      });
      abort("Run finished; cancel outstanding work");
      clearTimeout(timeout);
      clearInterval(busTimer);
      control?.close();
      failure = await finishStandard({
        owned,
        server,
        logger,
        log,
        report,
        scrub,
        failure,
        suite: options.suite,
      });
    }
    process.removeListener("SIGINT", interrupt);
    process.removeListener("SIGTERM", interrupt);
    report.finishedAt = new Date().toISOString();
    if (failure) {
      report.error ??= scrub(failure.message);
    }
    await save("run.json", report);
  }
  if (failure) {
    throw new Error(`${scrub(failure.message)}; evidence retained in ${root}`);
  }
  return { output: root, status: report.status, mode: report.mode };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main(process.argv.slice(2))
    .then(result => process.stdout.write(JSON.stringify(result) + "\n"))
    .catch(error => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
