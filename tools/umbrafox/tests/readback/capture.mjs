/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import {
  applicationDataPaths,
  connectControl,
  createBoundedLogger,
  readIdentity,
  withTimeout,
} from "../../performance/helpers.mjs";
import {
  collectProvenance,
  createOutputRoot,
  finishLifecycle,
  profilePreferences,
  readDiscovery,
  verifyApplicationData,
} from "../../performance/run.mjs";
import {
  createLifecycleBudget,
  createLifecycleEvidence,
  lifecycleArtifactLimit,
  readLifecycleHost,
  startLifecycleMonitor,
} from "../../performance/lifecycle-capture.mjs";
import { mediaDebugRequest } from "../../performance/media-debug.mjs";
import {
  collectFrame,
  compareFrames,
  createReadbackServer,
  validateFrame,
} from "./fixture.mjs";

function validCaptureTimeout(value) {
  return Number.isInteger(value) && value >= 30000 && value <= 120000;
}

export function createLocalCaptureBudget(
  totalMs = 120000,
  now = () => performance.now()
) {
  assert(validCaptureTimeout(totalMs), "Invalid local capture budget");
  const budget = createLifecycleBudget(120000, now);
  const reduction = 120000 - totalMs;
  const shorten = remaining => {
    const value = remaining - reduction;
    if (value <= 0) {
      throw new Error("Local capture deadline exceeded");
    }
    return value;
  };
  return {
    remaining: cleanup => shorten(budget.remaining(cleanup)),
    remainingTerminal: () => shorten(budget.remainingTerminal()),
  };
}

export function createSeekCaptureBudget(now = () => performance.now()) {
  const start = now();
  assert(Number.isFinite(start) && start >= 0, "Invalid seek capture clock");
  let previous = start;
  const remaining = cutoff => {
    const current = now();
    assert(
      Number.isFinite(current) && current >= previous,
      "Invalid seek capture clock"
    );
    previous = current;
    const value = start + cutoff - current;
    assert(value > 0, "Seek capture deadline exceeded");
    return value;
  };
  return {
    remaining: cleanup => remaining(cleanup ? 238000 : 225000),
    remainingTerminal: () => remaining(240000),
  };
}

export function boundedOperation(
  budget,
  signal,
  operation,
  label,
  cap = 10000,
  cleanup = false
) {
  const milliseconds = Math.min(cap, budget.remaining(cleanup));
  signal?.throwIfAborted();
  return withTimeout(
    Promise.resolve().then(() => {
      budget.remaining(cleanup);
      signal?.throwIfAborted();
      return operation();
    }),
    milliseconds,
    label,
    signal
  );
}

export function launchRetained(binary, args, env, spawnProcess = spawn) {
  const child = spawnProcess(binary, args, {
    env,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const owned = { child, identity: null, outcome: null };
  owned.completion = new Promise(resolveCompletion => {
    child.once("error", error => {
      owned.outcome = { error: error.code };
      resolveCompletion(owned.outcome);
    });
    child.once("exit", (code, signal) => {
      owned.outcome = { code, signal };
      resolveCompletion(owned.outcome);
    });
  });
  owned.closed = new Promise(resolveClose => child.once("close", resolveClose));
  return owned;
}

export async function admitOwned(
  owned,
  bounded,
  identityReader = readIdentity
) {
  try {
    const identity = await bounded(
      () => identityReader(owned.child.pid),
      "Owned process identity",
      2000
    );
    assert.equal(identity.pid, owned.child.pid);
    assert.equal(identity.parent, process.pid);
    assert.equal(identity.group, identity.pid);
    assert.equal(identity.session, identity.pid);
    owned.identity = identity;
  } catch (error) {
    // Retain the child handle even when identity admission fails.
    if (!owned.outcome) {
      owned.child.kill("SIGTERM");
    }
    throw error;
  }
}

export async function readNativeDirectories(
  control,
  context,
  pid,
  applicationData,
  bounded,
  save
) {
  const paths = applicationDataPaths(applicationData?.root);
  for (const key of ["appData", "localAppData", "tempDir"]) {
    assert.equal(applicationData[key], paths[key]);
  }
  const native = await bounded(
    () =>
      control.request("umbrafox.script.execute", {
        context,
        realm: "browser",
        body: "return {pid: Services.appinfo.processID, buildID: Services.appinfo.appBuildID, appData: Services.dirsvc.get('UAppData', Components.interfaces.nsIFile).path, localAppData: Services.dirsvc.get('DefProfLRt', Components.interfaces.nsIFile).path, tempDir: PathUtils.tempDir, directoryTempDir: Services.dirsvc.get('TmpD', Components.interfaces.nsIFile).path};",
      }),
    "Native directory receipt"
  );
  await save("native-roots.json", native);
  const value = native.result.value;
  assert.equal(value.pid, pid);
  assert.equal(value.appData, paths.appData);
  assert.equal(value.localAppData, paths.localAppData);
  assert.equal(value.tempDir, paths.tempDir);
  assert.equal(value.directoryTempDir, paths.tempDir);
  return value;
}

async function waitForTab(control, owned, profile, url, bounded, signal, save) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const diagnostics = await bounded(
      () => control.request("umbrafox.diagnostics.snapshot"),
      "Fixture readiness"
    );
    await save(`setup-${attempt}.json`, diagnostics);
    assert.equal(diagnostics.processID, owned.child.pid);
    assert.equal(diagnostics.profileDir, profile);
    const tabs = diagnostics.windows.flatMap(item => item.tabs);
    assert(tabs.length <= 1, "Unexpected browser tab");
    if (tabs.length === 1) {
      assert([url, "about:blank"].includes(tabs[0].url), "Unexpected document");
      if (tabs[0].url === url) {
        assert.equal(tabs[0].selected, true);
        assert(Number.isSafeInteger(tabs[0].context) && tabs[0].context > 0);
        return tabs[0].context;
      }
    }
    await bounded(() => delay(100, undefined, { signal }), "Readiness wait");
  }
  throw new Error("Fixture readiness attempts exhausted");
}

async function captureFrames(control, context, save, bounded, report) {
  const identity = await bounded(
    () =>
      control.request("umbrafox.script.execute", {
        context,
        body: "return {webdriver: navigator.webdriver, state: document.readyState};",
      }),
    "Fixture identity"
  );
  await save("page-identity.json", identity);
  assert.equal(identity.result.value.webdriver, false);
  assert(Number.isSafeInteger(identity.document) && identity.document > 0);
  const documentID = identity.document;
  report.document = documentID;
  const capturedFrames = [];
  for (const [index, target] of [0.5, 2].entries()) {
    const reply = await bounded(
      () =>
        control.request("umbrafox.script.execute", {
          context,
          document: documentID,
          timeoutMs: 10000,
          body: `return await (${collectFrame.toString()})(...arguments);`,
          args: [target],
        }),
      "Frame pixels",
      12000
    );
    await save(`frame-${index}.json`, reply);
    assert.equal(reply.document, documentID);
    capturedFrames.push(validateFrame(reply.result.value, target));
    const decoder = await bounded(
      () =>
        control.request(
          "umbrafox.script.execute",
          mediaDebugRequest(context, documentID, `readback-${index}`)
        ),
      "Native decoder",
      7000
    );
    await save(`decoder-${index}.json`, decoder);
    report.decoders.push(decoder.result.value);
  }
  report.selfConsistency = compareFrames(capturedFrames, capturedFrames);
  return capturedFrames;
}

export function validateLocalWorkload(definition) {
  assert(
    definition &&
      typeof definition.mode === "string" &&
      /^[a-z0-9-]{1,64}$/.test(definition.mode) &&
      (definition.display === undefined ||
        ["headless", "headed"].includes(definition.display)) &&
      (definition.timeoutMs === undefined ||
        validCaptureTimeout(definition.timeoutMs)) &&
      (definition.capturePlan === undefined ||
        (definition.capturePlan === "seek-recovery" &&
          /^headed-seek-recovery-(control|forward|backward)$/.test(
            definition.mode
          ) &&
          definition.display === "headed" &&
          definition.timeoutMs === undefined &&
          [undefined, "standard"].includes(definition.artifactPolicy))) &&
      (definition.artifactPolicy === undefined ||
        definition.artifactPolicy === "standard" ||
        (definition.artifactPolicy === "profile" &&
          definition.mode === "headless-dom-profile-attribution" &&
          definition.display !== "headed")) &&
      Array.isArray(definition.limitations) &&
      definition.limitations.length <= 4 &&
      Array.from(definition.limitations).every(
        value => typeof value === "string" && value.length <= 300
      ) &&
      typeof definition.createServer === "function" &&
      typeof definition.capture === "function",
    "Invalid workload definition"
  );
  return definition;
}

export function localDisplayEnvironment(
  environment,
  display = "headless",
  input = process.env
) {
  assert(["headless", "headed"].includes(display), "Invalid display mode");
  const env = { ...environment };
  if (display === "headless") {
    return env;
  }
  assert(
    typeof input.DISPLAY === "string" && /^:\d+(?:\.\d+)?$/.test(input.DISPLAY),
    "Headed capture requires a local X11 display"
  );
  if (input.XAUTHORITY !== undefined) {
    assert(
      typeof input.XAUTHORITY === "string" &&
        isAbsolute(input.XAUTHORITY) &&
        !input.XAUTHORITY.includes("\0"),
      "Invalid X11 authority path"
    );
    env.XAUTHORITY = input.XAUTHORITY;
  }
  delete env.MOZ_HEADLESS;
  delete env.MOZ_HEADLESS_WIDTH;
  delete env.MOZ_HEADLESS_HEIGHT;
  env.DISPLAY = input.DISPLAY;
  return env;
}

export async function captureLocalWorkload(binary, outputPath, definition) {
  validateLocalWorkload(definition);
  assert(binary && outputPath, "Usage: capture.mjs ABS_BINARY NEW_ABS_OUTPUT");
  assert.equal(binary, resolve(binary));
  assert.equal(outputPath, resolve(outputPath));
  const displayInput = localDisplayEnvironment({}, definition.display);
  const artifactPolicy = definition.artifactPolicy ?? "standard";
  const seekRecovery = definition.capturePlan === "seek-recovery";
  const timeoutMs = seekRecovery ? 240000 : (definition.timeoutMs ?? 120000);
  const budget = seekRecovery
    ? createSeekCaptureBudget()
    : createLocalCaptureBudget(timeoutMs);
  const controller = new AbortController();
  const { signal } = controller;
  const abort = reason => {
    if (!signal.aborted) {
      controller.abort(new Error(reason));
    }
  };
  const timer = setTimeout(
    () => abort("Local fixture work deadline"),
    budget.remaining()
  );
  const interrupted = () => abort("Owner interrupted local capture");
  process.on("SIGINT", interrupted);
  process.on("SIGTERM", interrupted);
  const bounded = (operation, label, cap) =>
    boundedOperation(budget, signal, operation, label, cap);
  const secrets = [];
  const scrub = value => {
    let text = String(value).replace(/([?&]token=)[^\s"'<>]+/g, "$1[redacted]");
    for (const secret of secrets) {
      text = text.replaceAll(secret, "[redacted]");
    }
    return text;
  };
  const report = {
    version: 1,
    status: "running",
    startedAt: new Date().toISOString(),
    mode: definition.mode,
    decoders: [],
    limits: {
      totalMs: timeoutMs,
      workMs: timeoutMs - 15000,
      ...(seekRecovery ? { capturePlan: "seek-recovery" } : {}),
      artifactBytes: lifecycleArtifactLimit(artifactPolicy),
    },
    limitations: [
      ...definition.limitations,
      "Native directory receipt is post-startup, not a network sandbox or no-earlier-access proof.",
    ],
  };
  let output;
  let save;
  let server;
  let owned;
  let control;
  let monitor;
  let logger;
  let cleaningUp = false;
  let failure;
  const logController = new AbortController();
  try {
    output = await bounded(
      () => createOutputRoot(outputPath, signal),
      "Create output"
    );
    const { root } = output;
    const writeEvidence = createLifecycleEvidence({
      root,
      signal,
      budget,
      scrub,
    });
    save = (fileName, value) =>
      writeEvidence(fileName, value, cleaningUp ? "cleanup" : "work");
    await save("run.json", report);
    await save(
      "preflight.json",
      await bounded(() => readLifecycleHost(root), "Host preflight", 3000)
    );
    const provenance = await bounded(
      () =>
        collectProvenance(
          {
            binary,
            profile: "off",
            suite: "lifecycle",
            "lifecycle-plan": "smoke",
          },
          output,
          signal,
          save
        ),
      "Binary provenance",
      20000
    );
    const { environment, applicationData } = provenance;
    const launchEnvironment = localDisplayEnvironment(
      environment.env,
      definition.display,
      displayInput
    );
    if (definition.display === "headed") {
      const recorded = JSON.parse(
        await bounded(
          () =>
            readFile(join(root, "provenance.json"), {
              encoding: "utf8",
              signal,
            }),
          "Read launch provenance"
        )
      );
      await save("provenance.json", {
        ...recorded,
        environment: { ...environment, env: launchEnvironment },
        isolation:
          "New explicit profile and private application-data roots; headed local X11; no remote agent, Marionette, or WebDriver; ambient environment allowlisted.",
      });
    }
    const profile = join(root, "profile");
    await bounded(() => mkdir(profile, { mode: 0o700 }), "Create profile");
    const preferences = profilePreferences("lifecycle");
    await bounded(
      () =>
        writeFile(
          join(profile, "user.js"),
          Object.entries(preferences)
            .map(
              ([prefName, value]) =>
                `user_pref(${JSON.stringify(prefName)}, ${JSON.stringify(value)});`
            )
            .join("\n") + "\n",
          {
            mode: 0o600,
            signal,
          }
        ),
      "Profile preferences"
    );
    await save("preferences.json", preferences);
    server = await bounded(
      () => definition.createServer(signal, bounded),
      "Fixture server"
    );
    await save("fixture.json", server.metadata);
    await bounded(
      () =>
        writeFile(join(root, "browser.log"), "", {
          flag: "wx",
          mode: 0o600,
          signal,
        }),
      "Browser log"
    );
    logger = createBoundedLogger(
      text => {
        logController.signal.throwIfAborted();
        return boundedOperation(
          budget,
          logController.signal,
          () =>
            writeFile(join(root, "browser.log"), text, {
              flag: "a",
              signal: logController.signal,
            }),
          "Browser log append",
          1000,
          cleaningUp
        );
      },
      scrub,
      1024 ** 2,
      () => abort("Browser log cap")
    );
    await bounded(
      () => verifyApplicationData(applicationData, signal),
      "Private roots prelaunch"
    );
    budget.remaining();
    signal.throwIfAborted();
    owned = launchRetained(
      provenance.binary,
      ["-no-remote", "-profile", profile, server.url],
      launchEnvironment
    );
    report.pid = owned.child.pid;
    owned.child.stdout.on("data", chunk => logger.push("stdout", chunk));
    owned.child.stderr.on("data", chunk => logger.push("stderr", chunk));
    await admitOwned(owned, bounded);
    report.identity = owned.identity;
    monitor = await bounded(
      () =>
        startLifecycleMonitor({
          owned,
          root,
          signal,
          abort,
          save,
          artifactPolicy,
        }),
      "Resource monitor",
      4000
    );
    const discovery = await bounded(
      () =>
        readDiscovery(join(profile, "umbrafox/control.json"), signal, 20000),
      "UmbraLink discovery",
      21000
    );
    secrets.push(discovery.token);
    control = await bounded(
      () => connectControl(discovery, signal),
      "UmbraLink connection"
    );
    const context = await waitForTab(
      control,
      owned,
      profile,
      server.url,
      bounded,
      signal,
      save
    );
    report.context = context;
    const native = await readNativeDirectories(
      control,
      context,
      owned.child.pid,
      applicationData,
      bounded,
      save
    );
    report.buildID = native.buildID;
    for (const fileName of ["application.ini", "platform.ini"]) {
      const ini = await bounded(
        () => readFile(join(root, fileName), { encoding: "utf8", signal }),
        "Build metadata"
      );
      assert.equal(/^BuildID=(\d+)$/m.exec(ini)?.[1], report.buildID);
    }
    await save(
      "graphics.json",
      await bounded(() => control.request("umbrafox.gfx.snapshot"), "Graphics")
    );
    await save(
      "performance.json",
      await bounded(
        () =>
          control.request("umbrafox.performance.snapshot", {
            includeThreads: false,
            includeWindows: true,
          }),
        "Performance state"
      )
    );
    await bounded(
      () => delay(10000, undefined, { signal }),
      "Quiet startup",
      11000
    );
    await monitor.setBaseline();
    await definition.capture(
      control,
      context,
      save,
      bounded,
      report,
      signal,
      budget
    );
    await waitForTab(
      control,
      owned,
      profile,
      server.url,
      bounded,
      signal,
      (fileName, value) => save(`after-${fileName}`, value)
    );
    await monitor.sampleNow();
    assert.equal(server.snapshot().failure, null);
    report.status = "pass";
  } catch (error) {
    failure = error;
    report.status = "failed";
    report.error = scrub(error.message);
  } finally {
    cleaningUp = true;
    clearTimeout(timer);
    try {
      if (save) {
        failure = await finishLifecycle({
          owned,
          server,
          monitor,
          control,
          logger,
          report,
          save,
          scrub,
          failure,
          abort,
          budget,
          cancelLog: () => logController.abort(),
        });
        if (owned?.child.pid) {
          try {
            await boundedOperation(
              budget,
              undefined,
              async () => {
                await assert.rejects(readIdentity(owned.child.pid), {
                  code: "ENOENT",
                });
              },
              "Owned root absence",
              1000,
              true
            );
            report.rootAbsent = true;
          } catch (error) {
            failure ??= error;
            report.rootAbsent = false;
            report.status = "cleanup-failed";
          }
        }
        report.finishedAt = new Date().toISOString();
        try {
          await save("run.json", report);
        } catch (error) {
          failure ??= error instanceof Error ? error : new Error(String(error));
          if (report.status === "pass") {
            report.status = "failed";
          }
          report.terminalEvidenceError = scrub(String(error?.message ?? error));
        }
      }
    } finally {
      process.off("SIGINT", interrupted);
      process.off("SIGTERM", interrupted);
    }
  }
  if (failure) {
    throw failure;
  }
  return report;
}

export function main(binary, outputPath, display = "headless") {
  return captureLocalWorkload(binary, outputPath, {
    mode: `${display}-readback-pixel-smoke`,
    display,
    limitations: [
      display === "headed"
        ? "Default headed graphics; observed hardware compositor or decoder does not alone prove the GPU cache branch executed."
        : "Default headless graphics; not evidence of hardware compositor or GPU cache branch use.",
      "Correlated paused-frame draw timings exclude hashing but include canvas synchronization; not a YouTube performance claim.",
    ],
    async createServer(signal, bounded) {
      const media = await bounded(
        () =>
          readFile(
            new URL("../../../../dom/media/test/vp9.webm", import.meta.url),
            { signal }
          ),
        "Fixture media"
      );
      const server = await createReadbackServer(media, signal);
      server.metadata = {
        url: server.url,
        mediaSHA256: server.mediaSHA256,
        mediaBytes: media.length,
      };
      return server;
    },
    capture: captureFrames,
  });
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main(...process.argv.slice(2)).then(
    report =>
      console.log(
        JSON.stringify({
          status: report.status,
          buildID: report.buildID,
          rootAbsent: report.rootAbsent,
        })
      ),
    error => {
      console.error(error.message);
      process.exitCode = 1;
    }
  );
}
