/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Buffer } from "node:buffer";
import { readFile, writeFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { validateUserlandCacheResult } from "./userland-cache.mjs";

const logEnvironment = "timestamp,sync,ScriptLoader:4";
const outcomePattern =
  /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{6} UTC) - \[Child ([1-9]\d*): Main Thread\]: D\/ScriptLoader ScriptLoader \(((?:0x)?[\da-fA-F]+)\): (Created|Found in-memory cache) LoadedScript \(((?:0x)?[\da-fA-F]+)\) for ScriptLoadRequest\(((?:0x)?[\da-fA-F]+)\) (.*)$/;
const reasons = new Map([
  ["because cache is not found ", "cold"],
  ["because Umbrafox userland scripts are active ", "activeBypass"],
]);

function requireValid(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateInput({ run, samples, provenance, browserLog }) {
  requireValid(
    run?.version === 1 &&
      run.status === "passed" &&
      run.mode === "diagnostic-only" &&
      run.cleanup?.status === "clean" &&
      run.config?.suite === "userland-cache" &&
      run.config.profile === "off" &&
      run.config.trials === 7 &&
      run.config.warmup === 2,
    "Expected a passed diagnostic-only userland-cache run: clean cleanup, profiler off, seven trials and two warmups"
  );
  requireValid(
    typeof browserLog === "string" &&
      run.log?.droppedBytes === 0 &&
      Number.isSafeInteger(run.log.writtenBytes) &&
      run.log.writtenBytes >= 0 &&
      run.log.writtenBytes <= 8 * 1024 * 1024 &&
      Buffer.byteLength(browserLog) === run.log.writtenBytes,
    "Missing, truncated, oversized, or inconsistent browser log"
  );
  const env = provenance?.environment?.env;
  requireValid(
    env?.MOZ_LOG === logEnvironment &&
      !Object.keys(env).some(
        key =>
          key.startsWith("MOZ_PROFILER_") ||
          (key.startsWith("MOZ_LOG") && key !== "MOZ_LOG") ||
          key.startsWith("NSPR_LOG")
      ),
    "Expected exact ScriptLoader log environment without profiler or log redirection"
  );
  requireValid(
    typeof run.startedAt === "string" &&
      typeof run.finishedAt === "string" &&
      Number.isFinite(Date.parse(run.startedAt)) &&
      Number.isFinite(Date.parse(run.finishedAt)) &&
      Date.parse(run.startedAt) <= Date.parse(run.finishedAt),
    "Invalid run time interval"
  );
  validateUserlandCacheResult(samples, run.config);
  const { metadata } = samples;
  for (const field of ["originA", "originB"]) {
    const fixtureOrigin = new URL(metadata[field]);
    requireValid(
      fixtureOrigin.origin === metadata[field] && fixtureOrigin.port !== "",
      "Expected canonical loopback fixture origins with explicit ports"
    );
  }
  const target = new URL(metadata.targetURL);
  requireValid(
    metadata.targetURL === `${metadata.originB}${target.pathname}` &&
      /^\/[a-f0-9]{36}\/target\.js$/.test(target.pathname),
    "Expected exact stable fixture target URL"
  );
}

function parseOutcomes(browserLog, targetURL) {
  const outcomes = [];
  let malformedTargetLines = 0;
  const lines = browserLog.split("\n");
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (
      !line.includes("LoadedScript") ||
      !line
        .split(/\s+/)
        .some(token => token === targetURL || token === `${targetURL}.`)
    ) {
      continue;
    }
    const match = outcomePattern.exec(line);
    if (!match) {
      malformedTargetLines++;
      continue;
    }
    const [
      ,
      timestampUTC,
      processID,
      loaderID,
      action,
      loadedScriptID,
      requestID,
      tail,
    ] = match;
    let kind;
    if (action === "Found in-memory cache" && tail === `${targetURL}.`) {
      kind = "memoryHit";
    } else if (action === "Created") {
      for (const [prefix, outcome] of reasons) {
        if (tail === `${prefix}${targetURL}.`) {
          kind = outcome;
        }
      }
    }
    const pointers = [loaderID, loadedScriptID, requestID].map(pointer =>
      pointer.toLowerCase().replace(/^0x/, "").replace(/^0+/, "")
    );
    if (
      !kind ||
      !Number.isSafeInteger(Number(processID)) ||
      pointers.some(pointer => !/^[\da-f]{1,16}$/.test(pointer))
    ) {
      malformedTargetLines++;
      continue;
    }
    outcomes.push({
      sequence: outcomes.length,
      line: index + 1,
      timestampUTC,
      processID: Number(processID),
      thread: "Main Thread",
      loaderID: pointers[0],
      loadedScriptID: pointers[1],
      requestID: pointers[2],
      kind,
    });
  }
  return { outcomes, malformedTargetLines };
}

function timestampMicroseconds(timestamp) {
  const seconds = `${timestamp.slice(0, 19).replace(" ", "T")}.000Z`;
  const milliseconds = Date.parse(seconds);
  if (
    !Number.isFinite(milliseconds) ||
    new Date(milliseconds).toISOString() !== seconds
  ) {
    return NaN;
  }
  const value = milliseconds * 1000 + Number(timestamp.slice(20, 26));
  return Number.isSafeInteger(value) ? value : NaN;
}

function inspectIdentities(outcomes, run, issues) {
  const identities = new Set();
  const requests = new Set();
  let requestPointerReuseCount = 0;
  let ambiguousIdentityCount = 0;
  let previousTime = -Infinity;
  for (const outcome of outcomes) {
    const request = `${outcome.processID}:${outcome.requestID}`;
    const identity = `${request}:${outcome.loaderID}`;
    if (requests.has(request)) {
      requestPointerReuseCount++;
    }
    if (identities.has(identity)) {
      ambiguousIdentityCount++;
    }
    requests.add(request);
    identities.add(identity);
    const time = timestampMicroseconds(outcome.timestampUTC);
    if (
      !Number.isFinite(time) ||
      time < Date.parse(run.startedAt) * 1000 ||
      time > Date.parse(run.finishedAt) * 1000
    ) {
      issues.add("invalid-or-out-of-run-timestamp");
    }
    if (time < previousTime) {
      issues.add("nonmonotonic-outcome-timestamps");
    }
    previousTime = time;
  }
  if (ambiguousIdentityCount) {
    issues.add("duplicate-or-reused-compound-identity");
  }
  return { requestPointerReuseCount, ambiguousIdentityCount };
}

export function analyzeUserlandCache(input) {
  validateInput(input);
  const { run, samples, browserLog } = input;
  const { outcomes, malformedTargetLines } = parseOutcomes(
    browserLog,
    samples.metadata.targetURL
  );
  const expectedOutcomes = run.config.trials + run.config.warmup;
  const active = ["unrelated", "visited"].includes(samples.state);
  const expected = Array.from({ length: expectedOutcomes }, (_, index) => {
    if (active) {
      return "activeBypass";
    }
    return index === 0 ? "cold" : "memoryHit";
  });
  const observed = { cold: 0, memoryHit: 0, activeBypass: 0 };
  for (const outcome of outcomes) {
    observed[outcome.kind]++;
  }
  const processIDs = [...new Set(outcomes.map(outcome => outcome.processID))];
  const issues = new Set();
  if (outcomes.length !== expectedOutcomes) {
    issues.add("outcome-count-mismatch");
  }
  if (outcomes.some((outcome, index) => outcome.kind !== expected[index])) {
    issues.add("unexpected-control-sequence");
  }
  if (malformedTargetLines) {
    issues.add("malformed-or-unsupported-target-outcome");
  }
  if (processIDs.length !== 1) {
    issues.add("single-source-process-unproven");
  }
  if (!browserLog.endsWith("\n")) {
    issues.add("incomplete-final-log-line");
  }
  const identities = inspectIdentities(outcomes, run, issues);
  return {
    schemaVersion: 1,
    mode: "diagnostic-only",
    state: samples.state,
    source: {
      sha256: samples.metadata.sourceSHA256,
      bytes: samples.metadata.sourceBytes,
    },
    coverage: {
      expectedOutcomes,
      observedOutcomes: outcomes.length,
      malformedTargetLines,
      writtenLogBytes: run.log.writtenBytes,
      droppedLogBytes: 0,
      captureCompleteness:
        "run-byte-count-crosschecked-not-independently-proven",
    },
    attribution: {
      processIDs,
      singleProcess: processIDs.length === 1 ? "observed" : "unproven",
      documentJoin: "conditional-sequential-fixture",
      ...identities,
    },
    controlGate: {
      status: issues.size ? "inconclusive" : "pass",
      expectedSequence: expected,
      reasons: [...issues],
    },
    observed,
    outcomes,
    httpTargetRequests: samples.requests.filter(
      entry =>
        entry.label === "B" &&
        entry.path === "target.js" &&
        entry.method === "GET"
    ).length,
    limitations: [
      "Outcome order is associated with documents only under the validated controlled sequential fixture; no authoritative document or innerWindowID join exists.",
      "PID and pointer values are log-local; pointers can be reused and are not durable request or document identities.",
      "Cold means no reusable memory-cache entry at lookup, not proof of compilation, disk-cache status, or network transfer.",
      "HTTP request counts and Resource Timing are not compile-cache outcomes. No bytecode lines are counted.",
      "Active bypass proves consumption at those lookups only, not earlier startup publication, handler state, or observer installation.",
      "No IPC duration, performance win, or release timing comparison is derived from diagnostic logging.",
    ],
  };
}

async function main(args) {
  const values = new Map();
  for (let index = 0; index < args.length; index += 2) {
    requireValid(
      ["--input", "--output"].includes(args[index]) &&
        !values.has(args[index]) &&
        typeof args[index + 1] === "string" &&
        isAbsolute(args[index + 1]),
      "Expected --input ABS_RUN_DIRECTORY --output NEW_ABS_FILE"
    );
    values.set(args[index], args[index + 1]);
  }
  requireValid(values.size === 2, "Missing input or output argument");
  const directory = values.get("--input");
  const input = {};
  for (const field of ["run", "samples", "provenance"]) {
    input[field] = JSON.parse(
      await readFile(join(directory, `${field}.json`), "utf8")
    );
  }
  input.browserLog = await readFile(join(directory, "browser.log"), "utf8");
  const report = analyzeUserlandCache(input);
  await writeFile(
    values.get("--output"),
    `${JSON.stringify(report, null, 2)}\n`,
    {
      flag: "wx",
      mode: 0o600,
    }
  );
  if (report.controlGate.status === "inconclusive") {
    process.exitCode = 2;
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main(process.argv.slice(2)).catch(() => {
    process.stderr.write(
      "Userland cache analysis failed: invalid evidence, arguments, or unavailable new output.\n"
    );
    process.exitCode = 1;
  });
}
