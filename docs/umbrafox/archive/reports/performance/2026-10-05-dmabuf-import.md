# Linux Canvas Video Import Candidate

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Status

The upstream import path has been backported behind its unchanged default-OFF
preference. Source-level gates, native compilation, packaging and an isolated
version check pass. There is no new installation, owner-browser restart, pixel
acceptance or measured speedup yet. The desktop daily browser remains protected.

## Why This Change

The preceding [large-canvas experiment](2026-10-05-canvas-large.md) observed an
accelerated recording provider after the first draw and shared Skia after the
120th draw. It did not identify the transition frame or reason. It was not a
YouTube reproduction and did not establish repeated recovery on one canvas.

Mozilla subsequently landed [bug 2070629](https://bugzilla.mozilla.org/show_bug.cgi?id=2070629)
for Firefox 159. Its direct GPU import removes the intermediate CPU download
for eligible Linux remote Canvas2D video sources. The author's earlier CPU
upload prototype exhibited cache-miss-driven acceleration demotion. That is a
source-supported hypothesis for our observation, not our runtime attribution.
None of Mozilla's reported benchmark numbers are Umbrafox measurements.

This backport uses the [reland](https://github.com/mozilla-firefox/firefox/commit/a3c328e4aff34a383827dc4b23f96001a3975428),
not the first landing that was backed out for non-GTK build failures.
The GTK guards around the new BGR conversion shader are retained.

## Integration

The 13-file change retains the upstream handle-based remote texture lookup,
GPU import, explicit destination format, channel conversion, and the outer CPU
fallback when the import helper returns null. It adds no WebIDL, page globals
or public diagnostic API.
The setting is `gfx.canvas.remote.use-draw-image-fast-path-dmabuf=false`.

Ten files contain exactly the upstream delta: reversing that delta reproduces
their preserved pre-change hashes. Three require integration with preexisting
Umbrafox changes:

- `CanvasRenderingContext2D.cpp` retains the destination-sized V2 readback
  helper byte-for-byte and its deferred HTML video fallback. Only the new
  VideoFrame branch uses the upstream DMABuf-only descriptor restriction.
- `GLBlitHelper.h` retains the existing scaling boolean and appends destination
  format after it. Existing callers keep their argument meaning.
- `GLBlitHelper.cpp` explicitly forwards `false` for scaling at the new import
  call. The V2 texture-size conditional remains intact. The channel-order
  predicate is equivalent to upstream's constant-false source-order predicate.

All 13 original source hashes were independently reconstructed from the base
commit and preserved pre-change patch. `implementation.diff` separates this
backport from the older dirty work; the staged index is unchanged.

## Verification So Far

- Failing-first actual-source admission test: GTK's enabled DMABuf case failed
  on the prior code; Windows, macOS and other configurations passed. The missing
  default-OFF preference contract also failed as expected.
- Expanded compiled tests exercise the actual admission and descriptor helper
  bodies with small C++ type doubles: platform/pref combinations, outer and
  inner union rejection, null image/descriptor/output, kind filtering, preserved
  output on rejection, and no descriptor lookup when the top-level gate is OFF.
- All 30 focused readback tests pass with strict unhandled rejection handling.
- Exact-file C++ and JS lint passes with zero errors and warnings; diff check
  passes. These checks are not Gecko ABI or GPU runtime proof.

The first provenance comparison attempted to pass a pipe as a regular input
file to GNU patch and was rejected. The corrected comparison used one generated
temporary blob at a time; all original hashes matched. No source was rewritten
by either comparison. The rejection artifact is preserved.

## Native Gate

Resource preflight recorded about 42 GiB available RAM and 76 GiB available disk
on the desktop. The existing configured object directory is reused, with two
jobs and no browser measurement running in this lane. Command:

```sh
env MOZ_BUILD_DATE=20261006023500 CARGO_BUILD_JOBS=2 \
  timeout 2700s ./mach build -j 2
```

The 13 source hashes were recorded before launch. The complete tracked patch
and 11 untracked component source files are also preserved, because a package
contains earlier changes as well as this backport.

The first command reached its 2700-second bound in toolkit compilation and
exited124, with no compiler error in its saved log. All observed compiler/make
processes were absent afterward. Source hashes, the full tracked patch and the
11 untracked component files still matched. A separately bounded 1800-second
incremental resume uses the identical environment and two-job limit, saved in
`build-resume.log`. The resume passed in 715 seconds, exit 0. All 13 native
source hashes, 11 untracked component hashes, the full tracked patch and staged
index still match their pre-build records. The generated build header and both
application/platform INIs agree on `20261006023500`.

The resume reports zero compiler warnings and its saved warning database is
empty. The first, timed-out build emitted seven warning notices around WebRTC
compilation, with details suppressed by the build frontend; it did not finalize
a warning database. Consequently this is not a warning-free whole-build claim.
Both logs are retained. Packaging uses the same metadata and two-job limit:

```sh
env MOZ_BUILD_DATE=20261006023500 CARGO_BUILD_JOBS=2 XZ_OPT=-T2 \
  timeout 600s ./mach build -j 2 package
```

Packaging passed in 98 seconds, exit 0. The clean extraction contains 46 regular
files and no symlinks. Both packaged INIs match the generated build ID. Archive:
`exports/umbrafox-dmabuf-import-candidate-20261006/umbrafox-dmabuf-import-20261006023500-linux-x86_64.tar.xz`.

- Archive: 107761956 bytes, SHA256
  `fc6e32d5e0ec57ad3c3b1af4a1e500f89f11e73f7f6cafedd87403654f02ebea`.
- Packaged libxul SHA256:
  `df66802b26aeddf5665cc14dcbff11f620f2914ff1dccdfd15580ffcd933df66`.
- libxul ELF build ID: `6f283bdcc8f7f35774dc2ac2dd6efb0c`.

The packaged executable's bounded `--version` invocation returned
`Umbrafox 158.0a1`, exit 0, using newly created private application-data,
local-application-data, temporary and profile directories. Its root PID was
absent afterward. The recorded `CanCreateUserNamespace` EPERM warning is not
suppressed. This is an executable/version check, not native directory-provider,
GPU, browser-rendering or pixel-parity proof. No installation or launcher was
changed. `package-verification.json` and `package-version.json` retain details.

## Remaining Gates

Keep the feature OFF by default. Use fresh owned laptop roots and identical
media for candidate OFF/ON correctness tests before performance comparisons.
Check provider identity, hardware decoder, actual preferences, source/package
identity, and cleanup. Separate timed playback from pixel reads.

Pixel coverage must address channel order, alpha, YUV conversion, crop, scale,
rotation, filter/shadow exclusions, explicit readback hints, closed/stale frames,
import failure and context loss. Existing nine-variant/two-frame comparisons
are a starting point, not full platform coverage. Any ON pixel discrepancy
blocks default enablement or dogfood acceptance; no new parity exception has
been granted. OFF behavior also needs comparison against the prior package.
In particular, the old default pixel case is110x75, below the observed128^2
acceleration threshold. The new oracle must use fresh above-threshold canvases
and native provider observations before readback. Use the same candidate binary
for OFF/ON; record import identity as unproven unless positively observed.

No GPU-forcing preference, heuristic bypass or fence removal is included.
An eventual broader upstream update needs its own protected-work integration,
not a pull or reset of this dirty checkout.

### Failure Propagation Risk

Source review found a narrower fallback guarantee than the upstream comment
suggests. `SharedContextWebgl::ImportSurfaceDescriptor` checks context loss and
allocation before calling the void `WebGLContext::TexImage`, then returns a
surface without checking the upload result. For direct descriptors,
`TexUnpackSurface::TexOrSubImage` calls `BlitSd` with its default
`allowFallback=false`. Some framebuffer failures diagnose a crash; a failed
blitter call clears the target to a diagnostic color and returns success.
The outer null-result fallback therefore does not cover every low-level failure.

This is an observed source contract, not a reproduced driver failure or a
demonstrated cause of our stutter. It blocks treating the new path as generally
failure-safe. Keep it default-OFF and require an actual failure-propagation test
before default enablement. Do not add a speculative error-draining workaround
while the current native build is running. Relevant pinned declarations:
[WebGLContext::TexImage](https://searchfox.org/firefox-main/rev/00a4d527cdb9807ecb561c9fcf7d211e7e568ddf/dom/canvas/WebGLContextTextures.cpp#173-196),
[BlitSd default](https://searchfox.org/firefox-main/rev/00a4d527cdb9807ecb561c9fcf7d211e7e568ddf/dom/canvas/TexUnpackBlob.h#133).
Local call sites and bodies were checked separately against this backport.

Evidence: `artifacts/umbralink-control/dmabuf-import/`.
Plan: `docs/umbrafox/archive/plans/dmabuf-import.md`.
