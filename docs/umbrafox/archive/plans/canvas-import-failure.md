# Canvas Import Failure Propagation

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Goal And Authority

Follow the active performance campaign and the same-build 48-output pixel gate.
Make the GPU-import candidate recover through its existing readback fallback
when native upload cannot produce a valid surface. Keep the default preference
OFF and preserve ordinary WebGL, IPC, shader and page-visible API contracts.
No desktop browser, installation, profile, launcher, staged work or sealed
evidence changes. Diagnostic builds are not daily-installation candidates.

## Evidence And Territory

Current `SharedContextWebgl::ImportSurfaceDescriptor` tests context/allocation,
calls void `WebGLContext::TexImage`, then publishes a `SourceSurfaceWebgl`.
`WebGLTexture::TexImage` has failure returns which cannot reach that caller.
`TexUnpackSurface::BlitSd` can return false when fallback is permitted; otherwise
one failed blit clears an error color and returns true. The generic descriptor
upload currently uses the default false fallback argument.

`CanvasTranslator::LookupSourceSurfaceFromSurfaceDescriptor` only reaches its
existing DMABuf readback fallback when import returns null. The other importer
consumer is `ResolveExternalSnapshot`; retain its descriptor/data fallback,
shared-surface BeginRead/EndRead and recycling order. `HostWebGLContext::TexImage`
is the void IPC-facing wrapper; keep that signature and serialization unchanged.
Searchfox discovery plus current source excerpts are in
`artifacts/umbralink-control/import-safety/`.

The strict importer behavior must be explicit at the candidate DMABuf call site,
not a change to default external-canvas import behavior. Use an internal
default-false fallback argument and test both modes. The new recovery option
does not enter the IPC descriptor representation or the public WebGL API.

Native upload-init regressions already exist in
`dom/canvas/gtest/TestWebGLTextureUploadInit.cpp`. They cover failed source maps
and initialized-slice tracking using real WebGL contexts. Extend native coverage
rather than treating structural assertions or a copied state machine as proof.

## Verification And Phases

1. Preserve source/index baselines. Add native importer tests before production
   edits. An unusable descriptor must not publish a surface; oversized allocation
   must still reject. Retain repeated-failure behavior. A skipped GL context is
   an unavailable test, not a passing regression. Build with two jobs, idle,
   bounded resource preflight and `timeout 900s ./mach build -j2 recurse_gtest
   --priority idle`. Preserve all failures and compile diagnostics.
2. Choose the narrow internal result channel only after the regression runs.
   Propagate upload failure to the importer without changing ordinary WebGL
   error reporting, upload-init tracking, or wire representation. Any fallback
   switch must be internal-only/default-false, never a new page API. Guard
   pooled allocation initialization and context loss before publication.
3. Native success/failure coverage must include ordinary upload success and
   failed mapping, descriptor rejection, GPU-blit rejection, allocation failure,
   repeated use, context loss, fallback selection and no published invalid
   surface. Test actual GL paths where possible; label any uninjectable driver
   failure and do not count a mock as hardware recovery proof.
4. Compile the integrated engine, run affected native/upload regressions,
   exact-file lint/format and source-diff review. New packages need fresh fixed
   BuildIDs and complete source provenance for playback comparisons. Native
   gtest bundles may reuse the reference loader with an independently hashed
   test library, but are not playback packages. The object directory now contains
   the corrected current-tree V2 build, not the frozen full-size reference;
   explicitly account for that difference, never relabel either artifact.
5. Re-run same-build pixel checks and alternating sustained moving-video trials
   on the authorized laptop with fresh private roots. Pixel correctness alone
   establishes no speedup or YouTube-stutter fix. No default enable or desktop
   installation until the remaining correctness and performance gates pass.

## Review Questions

Check all return paths, not just GL error flags: a blob can fail without setting
an error, and clearing a diagnostic color is not successful import. Verify the
actual callers of any signature change, ordinary WebGL/serialization defaults,
texture pool initialization after failed allocation, context loss during upload,
and source lifetime through deferred readback. Do not add a hot-path synchronous
GPU wait or error query to obtain success information.

## Progress

- Native RED on the laptop: 13 tests executed, two importer regressions fail,
  11 pass, zero skipped. Repeated invalid descriptors publish invalid surfaces
  16 times. Root and controller exited; exact recorded PID absence verified.
- Initial headless desktop attempt skipped all 13 tests. Laptop loader failure
  was a missing generated dependent-library list; a subsequent permission
  admission failure occurred before spawn. All attempts retained separately.
- Production implementation: internal result propagation and candidate-only
  default-false fallback implemented. Only the DMABuf importer opts in; ordinary
  external-canvas consumers retain the prior behavior. No hot GPU wait added.
- Final engine build: PASS, 432 seconds, zero warnings. Native test-library
  rebuild: PASS, 17 seconds, zero warnings. Twelve-file lint and diff check pass.
- Native GREEN on a fresh laptop diagnostic bundle: 17 executed, all pass,
  zero skipped. Includes the failing importer regressions, default behavior,
  failure without a GL error, provided-surface fallback and existing upload-init
  tests. Six harness/source checks also pass. All three recorded PIDs absent.
- Driver failure/context-loss injection, valid DMABuf reuse after rejection,
  end-to-end CanvasTranslator fallback and new-package playback/pixels remain
  unverified. This is not a speedup, stutter fix or default-enable acceptance.
- Report: `docs/umbrafox/archive/reports/performance/2026-10-06-canvas-import-failure.md`.
