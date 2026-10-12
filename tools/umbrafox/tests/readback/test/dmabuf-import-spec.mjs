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

test("actual descriptor admission preserves platform, union and pref boundaries", async t => {
  const canvas = await source("dom/canvas/CanvasRenderingContext2D.cpp");
  const start = canvas.indexOf("bool ValidSurfaceDescriptorForRemoteCanvas2d(");
  const end = canvas.indexOf("\n// drawImage(in HTMLImageElement", start);
  assert(start > 0 && end > start);
  await mkdir("/tmp/codex/dmabuf-import", { recursive: true });
  const scratch = await mkdtemp("/tmp/codex/dmabuf-import/admission-");
  t.after(() => rm(scratch, { recursive: true, force: true }));
  await writeFile(
    join(scratch, "admission-region.h"),
    canvas.slice(start, end)
  );
  const image = await source("gfx/layers/GPUVideoImage.h");
  const availabilityStart = image.indexOf("  bool CanReadback() {");
  const availabilityEnd = image.indexOf(
    "\n  already_AddRefed<gfx::SourceSurface> GetAsSourceSurface()",
    availabilityStart
  );
  assert(availabilityStart > 0 && availabilityEnd > availabilityStart);
  await writeFile(
    join(scratch, "availability-region.h"),
    image.slice(availabilityStart, availabilityEnd)
  );
  for (const platform of ["MOZ_WIDGET_GTK", "XP_WIN", "XP_MACOSX", "OTHER"]) {
    await t.test(platform, () => {
      const binary = join(scratch, platform);
      execFileSync(
        process.env.CXX_TEST || "c++",
        [
          "-std=c++17",
          "-Wall",
          "-Wextra",
          "-Werror",
          "-D" + platform,
          "-I" + scratch,
          fileURLToPath(new URL("./dmabuf-admission.cpp", import.meta.url)),
          "-o",
          binary,
        ],
        { timeout: 20000, maxBuffer: 1024 ** 2 }
      );
      execFileSync(binary, [], { timeout: 3000, maxBuffer: 1024 ** 2 });
    });
  }
});

test("DMABuf import stays default OFF and preserves native readback arguments", async () => {
  const prefs = await source("modules/libpref/init/StaticPrefList.yaml");
  assert.match(
    prefs,
    /name: gfx\.canvas\.remote\.use-draw-image-fast-path-dmabuf\s+type: RelaxedAtomicBool\s+value: false\s+mirror: always/
  );
  const header = await source("gfx/gl/GLBlitHelper.h");
  assert.match(
    header,
    /bool aScaleSourceToDest = false,\s+gfx::SurfaceFormat aDestFormat = gfx::SurfaceFormat::UNKNOWN/
  );
  const blit = await source("gfx/gl/GLBlitHelper.cpp");
  assert.match(
    blit,
    /return Blit\(surface, destRect, destOrigin, fbSize, convertAlpha,\s+false,\s+aDestFormat\)/
  );
  assert.match(blit, /if \(!aScaleSourceToDest\)\s*\{\s*baseArgs\.texSize/);
});

test("canvas fallback preserves full source pixels and early failure ordering", async () => {
  const canvas = await source("dom/canvas/CanvasRenderingContext2D.cpp");
  const start = canvas.indexOf("void CanvasRenderingContext2D::DrawImage(");
  const sourceStart = canvas.indexOf("  DirectDrawInfo drawInfo;", start);
  const sourceEnd = canvas.indexOf("  double clipOriginX,", sourceStart);
  const drawStart = canvas.indexOf(
    "  if (srcSurf || surfaceDescriptor.isSome())",
    sourceEnd
  );
  const rectStart = canvas.indexOf(
    "    gfx::Rect sourceRect(aSx, aSy, aSw, aSh);",
    drawStart
  );
  const directStart = canvas.indexOf(
    "    DrawDirectlyToCanvas(drawInfo,",
    rectStart
  );
  assert(start > 0 && sourceStart > start && sourceEnd > sourceStart);
  assert(
    drawStart > sourceEnd && rectStart > drawStart && directStart > rectStart
  );
  assert.doesNotMatch(
    canvas,
    /MaybeGetScaledSourceSurfaceForRemoteVideo|GetDMABufGPUVideoImage|deferRemoteVideoReadback/
  );
  const acquisition = canvas.slice(sourceStart, sourceEnd);
  assert.match(
    acquisition,
    /video && mBufferProvider->IsAccelerated\(\) &&\s*mTarget->IsRecording\(\) &&\s*!\(NeedToApplyFilter\(\) \|\| NeedToDrawShadow\(\)\)/
  );
  assert.match(
    acquisition,
    /if \(surfaceDescriptor\.isNothing\(\) && res\.mLayersImage\)\s*\{\s*if \(\(res\.mSourceSurface =\s*res\.mLayersImage->GetAsSourceSurface\(\)\)\)/
  );
  assert.match(
    acquisition,
    /#ifdef MOZ_WIDGET_GTK[\s\S]*SurfaceFromVideoFrame\([\s\S]*Some\(layers::RemoteDecoderVideoType::DMABuf\)[\s\S]*#endif/
  );
  const fullSource = acquisition.indexOf("srcSurf = res.GetSourceSurface();");
  const unusable = acquisition.indexOf(
    "if (!srcSurf && surfaceDescriptor.isNothing()"
  );
  const security = acquisition.indexOf("DoSecurityCheck(");
  assert(fullSource > 0 && unusable > fullSource && security > unusable);
  assert.match(acquisition, /Passed-in video frame is \\\"broken\\\"/);
  assert.doesNotMatch(
    canvas.slice(rectStart, directStart),
    /sourceRect\s*=|GetAsSourceSurface|readbackSize/
  );
  assert.match(
    canvas.slice(rectStart, directStart),
    /ExtractSubrect\(srcSurf, &sourceRect, mTarget\)/
  );
  assert.match(
    canvas.slice(directStart),
    /DrawDirectlyToCanvas\(drawInfo, &bounds, gfx::Rect\(aDx, aDy, aDw, aDh\),\s*gfx::Rect\(aSx, aSy, aSw, aSh\), imgSize\)/
  );
});
