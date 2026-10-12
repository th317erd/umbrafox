/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = new URL("../../../../../", import.meta.url);
const source = path => readFile(new URL(path, root), "utf8");

function region(text, start, end) {
  const from = text.indexOf(start);
  assert(from >= 0 && !text.includes(start, from + start.length), start);
  const to = text.indexOf(end, from + start.length);
  assert(to > from, end);
  return text.slice(from, to);
}

test("actual producer fence methods preserve ownership and avoid reconstruction", async t => {
  const header = await source("widget/gtk/DMABufSurface.h");
  const implementation = await source("widget/gtk/DMABufSurface.cpp");
  const shared = await source("gfx/gl/SharedSurfaceDMABUF.cpp");
  const sharedHeader = await source("gfx/gl/SharedSurfaceDMABUF.h");
  const retained = header.includes("  class ProducerFence final {");
  await mkdir("/tmp/codex/producer-fence", { recursive: true });
  const scratch = await mkdtemp("/tmp/codex/producer-fence/native-");
  t.after(() => rm(scratch, { recursive: true, force: true }));

  const declarations = region(
    header,
    retained ? "  class ProducerFence final {" : "  void FenceSet(",
    "  // Creates a global reference counter objects attached to the surface."
  );
  const methods = region(
    implementation,
    retained
      ? "DMABufSurface::ProducerFence::ProducerFence()"
      : "void DMABufSurface::FenceSet(",
    "bool DMABufSurface::OpenFileDescriptors("
  );
  const calls = region(
    shared,
    "SharedSurface_DMABUF::~SharedSurface_DMABUF()",
    "Maybe<layers::SurfaceDescriptor> SharedSurface_DMABUF::ToSurfaceDescriptor()"
  );
  if (retained) {
    assert.match(sharedHeader, /DMABufSurface::ProducerFence mProducerFence;/);
    assert(
      sharedHeader.indexOf("mSurface;") <
        sharedHeader.indexOf("mProducerFence;")
    );
  }
  for (const [fileName, contents] of [
    ["declarations.inc", declarations],
    ["methods.inc", methods],
    ["shared.inc", calls],
  ]) {
    await writeFile(join(scratch, fileName), contents);
  }
  const binary = join(scratch, "producer-fence");
  execFileSync(
    process.env.CXX_TEST || "c++",
    [
      "-std=c++20",
      "-Wall",
      "-Wextra",
      "-Werror",
      "-I" + scratch,
      ...(retained ? ["-DHAS_RETAINED_FENCE"] : []),
      fileURLToPath(new URL("./producer-fence.cpp", import.meta.url)),
      "-o",
      binary,
    ],
    { timeout: 20000, maxBuffer: 1024 ** 2, encoding: "utf8" }
  );
  const result = execFileSync(binary, [], {
    timeout: 10000,
    maxBuffer: 1024 ** 2,
    encoding: "utf8",
  });
  assert.match(result, /failures=0/);
  t.diagnostic(result);
});
