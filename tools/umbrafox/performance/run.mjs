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

export async function collectProvenance(options, root, signal, save) {
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
  const environment = browserEnvironment(
    process.env,
    options.profile,
    options.suite
  );
  const files = {};
  for (const fileName of [
    basename(binary),
    "libxul.so",
    "application.ini",
    "platform.ini",
  ]) {
    const path = join(dirname(binary), fileName);
    try {
      files[fileName] = {
        path: await realpath(path),
        sha256: await hashFile(path, signal),
      };
      if (fileName.endsWith(".ini")) {
        await copyFile(path, join(root, fileName), constants.COPYFILE_EXCL);
      }
    } catch (error) {
      if (fileName !== "platform.ini" || error.code !== "ENOENT") {
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
  ]) {
    fixtureHashes[fileName] = await hashFile(
      fileURLToPath(new URL(fileName, import.meta.url)),
      signal
    );
  }
  const userlandModules = options.suite === "userland-cache" ? {} : undefined;
  if (userlandModules) {
    for (const moduleName of [
      "modules/UmbrafoxUserlandScriptRegistry.sys.mjs",
      "modules/UmbrafoxUserlandScriptStore.sys.mjs",
      "modules/UmbrafoxUserlandScriptRuntime.sys.mjs",
      "modules/UmbrafoxUserlandEventController.sys.mjs",
      "actors/UmbrafoxUserlandParent.sys.mjs",
      "actors/UmbrafoxUserlandChild.sys.mjs",
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
  await save("provenance.json", {
    files,
    fixtureHashes,
    ...(userlandModules ? { userlandModules } : {}),
    environment,
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
  return { binary, environment };
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
}) {
  const diagnostics = await control.request("umbrafox.diagnostics.snapshot");
  if (
    diagnostics.processID !== owned.child.pid ||
    diagnostics.profileDir !== profile ||
    diagnostics.channel !== "umbrafox-control"
  ) {
    throw new Error("UmbraLink does not match the owned browser/profile");
  }
  await save("diagnostics-before.json", diagnostics);
  await save(
    "graphics-before.json",
    await control.request("umbrafox.gfx.snapshot")
  );
  const before = await control.request("umbrafox.performance.snapshot", {
    includeThreads: true,
    includeWindows: false,
  });
  await save("performance-before.json", before);
  if (before.profiler?.active !== (options.profile === "on")) {
    throw new Error("Observed profiler mode does not match requested mode");
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
  milestone("workloadReleased");
  server.start();
  const result = await bounded(server.result, "Fixture completion");
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
  await save(
    "graphics-after.json",
    await control.request("umbrafox.gfx.snapshot")
  );
  await save(
    "performance-after.json",
    await control.request("umbrafox.performance.snapshot", {
      includeThreads: true,
      includeWindows: false,
    })
  );
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
  if (suite === "userland-cache") {
    await mkdir(join(profile, "umbrafox"), { mode: 0o700 });
    await writeFile(
      join(profile, "umbrafox", "userland-scripts.json"),
      JSON.stringify(server.scriptStore, null, 2) + "\n",
      { flag: "wx", mode: 0o600 }
    );
    await save("userland-script-store.json", server.scriptStore);
    await save("userland-cache-metadata.json", server.metadata);
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

export async function main(args) {
  const options = parseArgs(args);
  if (platform() !== "linux" || !["x64", "ia32"].includes(arch())) {
    throw new Error("This local harness requires Linux x86 and /proc");
  }
  await checkBus(options.bus);
  await mkdir(options.output, { mode: 0o700 });
  const root = await realpath(options.output);
  const profile = join(root, "profile");
  const controller = new AbortController();
  const { signal } = controller;
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
    options["timeout-ms"]
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
  const save = (fileName, value) =>
    writeFile(
      join(root, fileName),
      scrub(JSON.stringify(value, null, 2)) + "\n",
      { mode: 0o600 }
    );
  const report = {
    version: 1,
    status: "running",
    startedAt: new Date().toISOString(),
    mode: {
      basic: options.profile === "on" ? "attribution-only" : "local-timing",
      "userland-cache": "diagnostic-only",
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
  let control;
  let log;
  let logger;
  let failure;
  let shuttingDown = false;
  const launchTime = performance.now();
  const milestone = milestoneName => {
    report.milestones[milestoneName] = performance.now() - launchTime;
  };
  const bounded = (promise, label, milliseconds = options["timeout-ms"]) =>
    withTimeout(promise, milliseconds, label, signal);
  try {
    await save("run.json", report);
    const { binary, environment } = await collectProvenance(
      options,
      root,
      signal,
      save
    );
    await mkdir(profile, { mode: 0o700 });
    const prefs = {
      "umbrafox.control.enabled": true,
      "umbrafox.control.port": 0,
    };
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
    } else {
      server = await createFixtureServer({
        trials: options.trials,
        warmup: options.warmup,
      });
    }
    await prepareFixtureEvidence(options.suite, profile, server, save, secrets);
    log = await openFile(join(root, "browser.log"), "wx", 0o600);
    logger = createBoundedLogger(text => log.write(text), scrub);
    await checkBus(options.bus);
    signal.throwIfAborted();
    milestone("beforeSpawn");
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
    });
    await checkBus(options.bus);
    signal.throwIfAborted();
    report.status = "passed";
  } catch (error) {
    failure = error;
    report.status = "failed";
    report.error = scrub(error.message);
  } finally {
    shuttingDown = true;
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
        failure ??= new Error(
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
      failure ??= error;
      report.status = "cleanup-failed";
    }
    try {
      if (owned && report.cleanup?.status === "clean") {
        await withTimeout(owned.closed, 1000, "Browser output drain");
      }
      report.log = await logger?.finish();
    } catch (error) {
      failure ??= error;
      report.status = "cleanup-failed";
    }
    try {
      await log?.close();
    } catch (error) {
      failure ??= error;
      report.status = "cleanup-failed";
    }
    try {
      validateLogEvidence(report.log, options.suite);
    } catch (error) {
      failure ??= error;
      if (report.status === "passed") {
        report.status = "failed";
      }
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
