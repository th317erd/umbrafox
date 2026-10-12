/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  copyFile,
  mkdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";
import { parseSamplingRecords } from "../parse-sampling.mjs";

const [binary, output, normal, feature, logging, bus, manifest] =
  process.argv.slice(2);
assert(binary && output && normal && bus && manifest);
assert(["off", "on"].includes(feature) && ["off", "on"].includes(logging));
const root = resolve(output);
const capture = `${root}/capture`;
const exec = promisify(execFile);
const json = async path => JSON.parse(await readFile(path, "utf8"));
const save = (path, data) => writeFile(path, JSON.stringify(data, null, 2));
const mesaKeys = ["GALLIVM_PERF", "GALLIVM_DEBUG", "MESA_SHADER_CACHE_DISABLE"];
const env = { ...process.env };
for (const key of mesaKeys) {
  delete env[key];
}
await mkdir(root);
async function checkBus() {
  assert.equal(
    (await readFile(bus, "utf8")).trim(),
    "OK",
    "Coordinator halted work"
  );
}
async function command(program, args, file, timeout = 30000, options = {}) {
  await checkBus();
  try {
    const result = await exec(program, args, {
      timeout,
      maxBuffer: 64 * 1024 * 1024,
      ...options,
    });
    if (file) {
      await writeFile(file, result.stdout + result.stderr);
    }
    await checkBus();
    return result;
  } catch (error) {
    if (file) {
      await writeFile(
        file,
        `${error.stdout ?? ""}${error.stderr ?? ""}\n${error.message}\n`
      );
    }
    throw error;
  }
}
async function ownedIdentity(pid) {
  const args = (await readFile(`/proc/${pid}/cmdline`, "utf8")).split("\0");
  assert(
    args.includes(`${capture}/profile`),
    "Not the owned disposable profile"
  );
  const stat = await readFile(`/proc/${pid}/stat`, "utf8");
  const fields = stat
    .slice(stat.lastIndexOf(")") + 2)
    .trim()
    .split(/\s+/);
  assert.equal(await realpath(`/proc/${pid}/exe`), await realpath(binary));
  return { pid, startTime: fields[19], profile: `${capture}/profile` };
}
let captureFinished = false;
let identity;
async function observe() {
  while (!captureFinished) {
    await checkBus();
    try {
      const record = await json(`${capture}/browser-process.json`);
      const current = await ownedIdentity(record.pid);
      if (identity) {
        assert.deepEqual(current, identity);
      }
      identity = current;
      const entries = (
        await readFile(`/proc/${record.pid}/environ`, "utf8")
      ).split("\0");
      const environment = {};
      for (const key of mesaKeys) {
        const matches = entries.filter(entry => entry.startsWith(`${key}=`));
        assert.equal(matches.length, 0, `Unexpected driver override ${key}`);
        environment[key] = null;
      }
      await save(`${root}/process-sidecar.json`, { ...identity, environment });
      return identity;
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
    await delay(100);
  }
  throw new Error("No owned browser process evidence");
}
async function cleanup() {
  if (!identity) {
    return;
  }
  try {
    assert.deepEqual(await ownedIdentity(identity.pid), identity);
    process.kill(-identity.pid, "SIGTERM");
    await delay(2000);
    assert.deepEqual(await ownedIdentity(identity.pid), identity);
    process.kill(-identity.pid, "SIGKILL");
  } catch (error) {
    if (error.code !== "ENOENT" && error.code !== "ESRCH") {
      throw error;
    }
  }
}
async function image(path) {
  assert.equal(
    (await command("identify", ["-format", "%w %h", path], null)).stdout,
    "1920 1080"
  );
  return (
    await command("convert", [path, "-depth", "8", "RGBA:-"], null, 10000, {
      encoding: "buffer",
    })
  ).stdout;
}
async function equalImages(actual, reference, filename) {
  await checkBus();
  let metric;
  try {
    metric = (
      await exec("compare", ["-metric", "AE", actual, reference, "null:"], {
        timeout: 10000,
      })
    ).stderr;
  } catch (error) {
    if (error.code !== 1 || error.killed) {
      throw error;
    }
    metric = error.stderr;
  }
  assert(/^\d+$/.test(metric.trim()));
  const a = await image(actual);
  const b = await image(reference);
  assert.equal(a.length, 1920 * 1080 * 4);
  assert.equal(b.length, a.length);
  let changed = 0;
  for (let offset = 0; offset < a.length; offset += 4) {
    if (
      !a.subarray(offset, offset + 4).equals(b.subarray(offset, offset + 4))
    ) {
      changed++;
    }
  }
  assert.equal(changed, Number(metric.trim()), "Independent AE mismatch");
  await save(`${root}/${filename}.json`, { actual, reference, AE: changed });
  assert.equal(changed, 0, `Pixel gate failed: ${filename}`);
  return changed;
}

const result = { feature, logging, verdict: "IN_PROGRESS" };
try {
  await command(
    "sha256sum",
    ["--check", manifest],
    `${root}/identities-before.log`,
    120000
  );
  const controller = new AbortController();
  const sidecar = observe().then(
    value => ({ value }),
    error => {
      controller.abort();
      return { error };
    }
  );
  let observation;
  try {
    await command(
      "timeout",
      [
        "--signal=TERM",
        "--kill-after=10s",
        "180s",
        "xvfb-run",
        "-a",
        "-s",
        "-screen 0 1920x1080x24 -nocursor",
        process.execPath,
        "tools/umbrafox/tests/opacity/sampling/capture.mjs",
        binary,
        capture,
        feature,
        "even-odd",
        logging,
      ],
      `${root}/capture.log`,
      195000,
      { env, signal: controller.signal }
    );
  } finally {
    captureFinished = true;
    observation = await sidecar;
    await cleanup();
    if (observation.error) {
      await save(`${root}/sidecar-failure.json`, {
        message: observation.error.message,
      });
    }
  }
  if (observation.error) {
    throw observation.error;
  }
  const profileDump = await json(`${capture}/dump.json`);
  await copyFile(profileDump.path, `${root}/raw-profile.json`);
  const session = `sampling-${feature}-${logging}-${process.pid}`;
  try {
    await command(
      "profiler-cli",
      ["load", `${root}/raw-profile.json`, "--session", session],
      `${root}/profiler-load.log`,
      60000
    );
    for (const [search, filename] of [
      ["WR sampling operands", "operands"],
      ["WR RGB promotion", "promotion"],
      ["WR RGB no-rect-AA", "shader"],
    ]) {
      await command(
        "profiler-cli",
        [
          "profile",
          "markers",
          "--session",
          session,
          "--search",
          search,
          "--limit",
          "100000",
          "--json",
        ],
        `${root}/${filename}-markers.json`
      );
    }
  } finally {
    await exec("profiler-cli", ["stop", "--session", session], {
      timeout: 10000,
    });
  }
  const operands = await json(`${root}/operands-markers.json`);
  const promotion = await json(`${root}/promotion-markers.json`);
  const shader = await json(`${root}/shader-markers.json`);
  for (const list of [operands, promotion, shader]) {
    assert.equal(
      list.markers.length,
      list.totalCount,
      "Truncated marker extraction"
    );
  }
  await save(`${root}/ordered-operands.json`, operands.markers);
  const snapshot = await json(`${capture}/snapshot.json`);
  const graphics = await json(`${capture}/graphics.json`);
  assert.equal(snapshot.processID, identity.pid);
  assert.deepEqual(
    snapshot.windows
      .flatMap(browserWindow => browserWindow.tabs)
      .map(tab => tab.label),
    ["Opacity oracle ready 6e5e9bdd"]
  );
  assert.equal(graphics.features.compositor, "webrender");
  assert.equal(graphics.features.gpuProcess.status, "unused");
  assert(
    graphics.windows.some(
      browserWindow =>
        browserWindow.layerManagerType === "WebRender" &&
        browserWindow.devicePixelRatio === 1
    )
  );
  const reference = `${normal}/even-odd-${feature}`;
  assert.deepEqual(
    graphics.adapters,
    (await json(`${reference}/graphics.json`)).adapters
  );
  result.sameModeAE = await equalImages(
    `${capture}/frame.png`,
    `${reference}/frame.png`,
    "same-mode"
  );
  result.repeatAE = await equalImages(
    `${capture}/repeat.png`,
    `${capture}/frame.png`,
    "repeat"
  );
  const bytes = await image(`${capture}/frame.png`);
  const bounds = { minX: 1920, minY: 1080, maxX: -1, maxY: -1 };
  for (let offset = 0; offset < bytes.length; offset += 4) {
    if (
      bytes[offset] === 53 &&
      bytes[offset + 1] === 113 &&
      bytes[offset + 2] === 141 &&
      bytes[offset + 3] === 255
    ) {
      const x = (offset / 4) % 1920;
      const y = Math.floor(offset / 4 / 1920);
      bounds.minX = Math.min(bounds.minX, x);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxY = Math.max(bounds.maxY, y);
    }
  }
  assert.deepEqual(bounds, { minX: 4, minY: 4, maxX: 1283, maxY: 975 });
  result.geometry = {
    bounds,
    DPR: 1,
    viewport: [1280, 972],
    framebuffer: [1920, 1080],
    readbackHash: "6e5e9bdd",
  };
  assert(
    shader.markers.every(
      marker =>
        marker.name === "WR RGB no-rect-AA" &&
        marker.label === "composite:NO_RECT_AA,TEXTURE_2D" &&
        marker.pid === String(identity.pid)
    )
  );
  result.shaderSelections = shader.totalCount;
  assert(
    feature === "on" ? shader.totalCount > 10 : shader.totalCount === 0,
    "Wrong actual shader path"
  );
  result.operandRecords = operands.totalCount;
  if (logging === "off") {
    assert.equal(
      operands.totalCount,
      0,
      "Operand trace leaked with logging off"
    );
  } else {
    const candidates = promotion.markers.filter(
      marker =>
        marker.name === "WR RGB promotion" &&
        marker.label.includes("preferred=true")
    );
    assert(candidates.length > 10);
    const promoted = candidates.filter(marker =>
      marker.label.includes("result=Ok(Overlay)")
    ).length;
    assert.equal(promoted, feature === "on" ? candidates.length : 0);
    result.promotion = { candidates: candidates.length, promoted };
    assert(operands.totalCount > 0, "Missing operands");
    let lastStart = -Infinity;
    for (const marker of operands.markers) {
      assert.equal(marker.name, "WR sampling operands");
      assert.equal(marker.pid, String(identity.pid));
      assert.equal(marker.threadName, "Renderer");
      assert(marker.start >= lastStart, "Unordered markers");
      lastStart = marker.start;
      assert.equal(marker.data.name, marker.label);
    }
    assert.equal(
      new Set(operands.markers.map(marker => marker.threadHandle)).size,
      1
    );
    result.trace = parseSamplingRecords(
      operands.markers.map(marker => marker.label)
    );
  }
  result.verdict = "PASS";
} catch (error) {
  result.verdict = "STOP";
  result.error = { message: error.message, stack: error.stack };
  process.exitCode = 1;
} finally {
  captureFinished = true;
  await cleanup();
  try {
    await command(
      "sha256sum",
      ["--check", manifest],
      `${root}/identities-after.log`,
      120000
    );
  } catch (error) {
    result.verdict = "STOP";
    result.identityError = error.message;
    process.exitCode = 1;
  }
  await save(`${root}/result.json`, result);
  console.log(JSON.stringify(result));
}
