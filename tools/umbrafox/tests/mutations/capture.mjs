/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { captureLocalWorkload } from "../readback/capture.mjs";
import {
  requestDOMWindow,
  createDOMServer,
  validateDOMWindowResult,
} from "./fixture.mjs";

export async function captureDOM(
  control,
  context,
  save,
  bounded,
  report,
  workload = "mixed"
) {
  assert(
    ["mixed", "layout", "layout-interleaved"].includes(workload),
    "Invalid workload"
  );
  const nativeState = async phase => {
    const reply = await bounded(
      () =>
        control.request("umbrafox.script.execute", {
          context,
          realm: "browser",
          body: "return {active: Services.prefs.getBoolPref('umbrafox.userlandScripts.active', false), profiler: Services.profiler.IsActive()};",
        }),
      "DOM native state"
    );
    await save(`dom-native-${phase}.json`, reply);
    assert.deepEqual(reply.result.value, { active: false, profiler: false });
  };
  await nativeState("before");
  const identity = await bounded(
    () =>
      control.request("umbrafox.script.execute", {
        context,
        body: "return {webdriver: navigator.webdriver, state: document.readyState, transportGlobalIsWindow: globalThis === window};",
      }),
    "DOM page identity"
  );
  await save("page-identity.json", identity);
  assert.deepEqual(identity.result.value, {
    webdriver: false,
    state: "complete",
    transportGlobalIsWindow: false,
  });
  assert.equal(identity.context, context);
  assert(Number.isSafeInteger(identity.document) && identity.document > 0);
  report.document = identity.document;
  const reply = await bounded(
    () =>
      control.request("umbrafox.script.execute", {
        context,
        document: identity.document,
        timeoutMs: 60000,
        body: `return await (${requestDOMWindow.toString()})();`,
      }),
    "DOM workload",
    62000
  );
  await save("dom-samples.json", reply);
  assert.equal(reply.context, context);
  assert.equal(reply.document, identity.document);
  const result = validateDOMWindowResult(reply.result.value, workload);
  await nativeState("after");
  report.sampleCount = result.samples.length;
  report.workloadMs = result.totalMs;
  report.execution = "window";
  report.fixtureVersion = { mixed: 2, layout: 3, "layout-interleaved": 6 }[
    workload
  ];
  if (workload !== "mixed") {
    report.workload = result.workload;
  }
}

export function main(binary, outputPath, workload = "mixed") {
  assert(
    ["mixed", "layout", "layout-interleaved"].includes(workload),
    "Invalid workload"
  );
  return captureLocalWorkload(binary, outputPath, {
    mode:
      workload !== "mixed"
        ? "headless-dom-window-layout-workload"
        : "headless-dom-window-workload",
    limitations: [
      "Fixed synthetic page workloads; not YouTube, physical rendering or GPU performance evidence.",
      "Normal page clock precision is retained. Trial samples share one process and are not independent replicates.",
      "No profiler during workload; startup, GC, JIT and owner host activity may still affect wall time.",
    ],
    createServer: signal => createDOMServer(signal, "window", workload),
    capture: (control, context, save, bounded, report) =>
      captureDOM(control, context, save, bounded, report, workload),
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
          samples: report.sampleCount,
          rootAbsent: report.rootAbsent,
        })
      ),
    error => {
      console.error(error.message);
      process.exitCode = 1;
    }
  );
}
