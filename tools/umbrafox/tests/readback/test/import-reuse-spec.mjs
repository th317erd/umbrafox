/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = new URL("../../../../../", import.meta.url);
const source = path => readFile(new URL(path, root), "utf8");

function region(text, start, end) {
  const from = text.indexOf(start);
  const to = text.indexOf(end, from + start.length);
  assert(from >= 0 && to > from, start);
  return text.slice(from, to);
}

test("actual import and translation regions preserve frame authority and lifetime", async t => {
  const webgl = await source("dom/canvas/DrawTargetWebgl.cpp");
  const header = await source("dom/canvas/DrawTargetWebgl.h");
  const canvas = await source("gfx/layers/ipc/CanvasTranslator.cpp");
  const reuse = webgl.includes(
    "SharedContextWebgl::ImportVideoSurfaceDescriptor("
  );
  await mkdir("/tmp/codex/import-reuse", { recursive: true });
  const scratch = await mkdtemp("/tmp/codex/import-reuse/native-");
  t.after(() => rm(scratch, { recursive: true, force: true }));
  const methods = reuse
    ? region(
        webgl,
        "void SharedContextWebgl::ClearVideoSurfaceCache()",
        "already_AddRefed<SourceSurface> SharedContextWebgl::ImportSurfaceDescriptor("
      )
    : "void SharedContextWebgl::ClearVideoSurfaceCache() {}\n";
  const fields = reuse
    ? header.match(
        / {2}RefPtr<layers::TextureHost> mVideoSurfaceHost;\n[\s\S]*? {2}WeakPtr<TextureHandle> mVideoSurfaceHandle;/
      )?.[0]
    : "";
  assert.equal(typeof fields, "string");
  await writeFile(join(scratch, "reuse-fields.inc"), fields);
  await writeFile(join(scratch, "reuse-methods.inc"), methods);
  await writeFile(
    join(scratch, "ensure.inc"),
    region(
      canvas,
      "bool CanvasTranslator::EnsureSharedContextWebgl()",
      "\nvoid CanvasTranslator::Shutdown()"
    )
  );
  for (const [guardName, start, end] of [
    ["target", "bool SharedContextWebgl::SetTarget(", "  if (!mWebgl"],
    [
      "upload",
      "void SharedContextWebgl::UploadSurfaceToHandle(",
      "  BackingTexture* backing",
    ],
    [
      "scratch",
      "void SharedContextWebgl::BindScratchFramebuffer(",
      "  BackingTexture* backing",
    ],
  ]) {
    const prefix = region(webgl, start, end);
    await writeFile(
      join(scratch, guardName + "-guard.inc"),
      prefix.slice(prefix.indexOf("{") + 1)
    );
  }
  await writeFile(
    join(scratch, "import.inc"),
    region(
      canvas,
      "already_AddRefed<gfx::SourceSurface>\nCanvasTranslator::GetZeroCopySurfaceFromDMABuf(",
      "\n#endif"
    )
  );
  await writeFile(
    join(scratch, "translate.inc"),
    region(
      canvas,
      "bool CanvasTranslator::TranslateRecording()",
      "\nbool CanvasTranslator::UsePendingCanvasTranslatorEvents()"
    )
  );
  const binary = join(scratch, "import-reuse");
  execFileSync(
    process.env.CXX_TEST || "c++",
    [
      "-std=c++20",
      "-Wall",
      "-Wextra",
      "-Werror",
      "-I" + scratch,
      ...(reuse ? ["-DHAS_REUSE"] : []),
      fileURLToPath(new URL("./import-reuse.cpp", import.meta.url)),
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
  assert.match(result.toString(), /failures=0/);
  t.diagnostic(result.toString());
});

test("reuse keeps eviction, writer invalidation and translator boundaries", async () => {
  const webgl = await source("dom/canvas/DrawTargetWebgl.cpp");
  const canvas = await source("gfx/layers/ipc/CanvasTranslator.cpp");
  for (const [start, end] of [
    [
      "bool SharedContextWebgl::SetTarget(",
      "void SharedContextWebgl::SetClipRect(",
    ],
    [
      "void SharedContextWebgl::UploadSurfaceToHandle(",
      "void SharedContextWebgl::BindAndInitRenderTex(",
    ],
    [
      "void SharedContextWebgl::BindScratchFramebuffer(",
      "already_AddRefed<TextureHandle> SharedContextWebgl::AllocateTextureHandle(",
    ],
  ]) {
    assert.match(
      region(webgl, start, end),
      /mVideoSurfaceHandle[\s\S]*ClearVideoSurfaceCache\(\)/
    );
  }
  for (const [start, end] of [
    [
      "bool CanvasTranslator::EnsureSharedContextWebgl()",
      "void CanvasTranslator::Shutdown()",
    ],
    [
      "void CanvasTranslator::Shutdown()",
      "mozilla::ipc::IPCResult CanvasTranslator::RecvInitTranslator(",
    ],
    [
      "void CanvasTranslator::EndTransaction()",
      "void CanvasTranslator::DeviceResetAcknowledged()",
    ],
    [
      "void CanvasTranslator::ClearCachedResources()",
      "ipc::IPCResult CanvasTranslator::RecvClearCachedResources()",
    ],
    [
      "void CanvasTranslator::ClearTextureInfo()",
      "already_AddRefed<gfx::SourceSurface> CanvasTranslator::LookupExternalSurface(",
    ],
  ]) {
    assert.match(region(canvas, start, end), /ClearVideoSurfaceCache\(\)/);
  }
  const lookup = region(
    canvas,
    "CanvasTranslator::LookupSourceSurfaceFromSurfaceDescriptor(",
    "\n}  // namespace layers"
  );
  assert(
    lookup.indexOf("LookupTexture(mContentId, sdrd.handle())") <
      lookup.indexOf("GetZeroCopySurfaceFromDMABuf(aDT, texture, sdrd.id())")
  );
  assert.match(lookup, /MakeScopeExit[\s\S]*ClearVideoSurfaceCache\(\)/);
  const prune = region(
    webgl,
    "void SharedContextWebgl::PruneTextureHandle(",
    "bool SharedContextWebgl::PruneTextureMemory("
  );
  assert(
    prune.indexOf("Invalidate()") < prune.indexOf("UnlinkSurfaceTexture(")
  );
});
