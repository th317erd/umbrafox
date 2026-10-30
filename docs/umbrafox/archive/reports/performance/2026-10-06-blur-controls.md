# Blur Source Controls

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

Two fresh isolated laptop captures completed the OFF-only diagnostic matrix.
All 24 output hashes, twelve repeat-difference summaries and both immutable
source hashes repeat exactly across runs. This is diagnostic completion, not
pixel-equivalence acceptance or a performance improvement.

| Input | Default-context changed pixels | Explicit-readback changed pixels |
| --- | ---: | ---: |
| Unfiltered video | 0 | 0 |
| Blurred video | 11 | 0 |
| Blurred frozen VideoFrame | 15 | 0 |
| Blurred shared raster copy | 0 | 0 |
| Blurred shared synthetic RGBA | 0 | 0 |
| Blurred video, later in the matrix | 11 | 0 |

Every changed pixel differs by one in one component; no alpha differences.
Default target observations report acceleration for both draws of every pair.
Explicit-readback observations report no acceleration. Target size is 320x180;
source size is 1920x1080, paused at 0.5 seconds. The video blur hashes match the
original failed pixel experiment. Both copied sources retain identical hashes
before and after the matrix.

The repeated late-video result argues against a simple first-draw-only effect.
The frozen VideoFrame result makes advancing HTMLVideoElement time alone an
insufficient explanation. Neither observation identifies a native cause.
Shared source lifetime, upload caching, filter intermediates and texture
allocation remain confounded. A useful next falsifier is fresh-but-identical
raster sources versus a reused raster source, with source hashes and provider
observations retained. Do not change filtering defaults or force software.

## Source Boundary

The candidate's thirteen recorded native source hashes still match the build
manifest. In that `CanvasRenderingContext2D::DrawImage`, both VideoFrame remote
descriptor admission and deferred remote-video readback have filter/shadow
exclusions. These are source predicates, not measured branch-execution counts.
The new import flag remained OFF in both parent and content receipts.

Upstream `FilterNodeGaussianBlurWebgl::Draw` attempts `BlurSurface` and falls
back to the software-filter route on failure. `BlurSurface` and
`SharedContextWebgl::BlurRectAccel` can use separable GPU blur passes, while
`BlurRectPass` obtains texture bounds/backing sizes and uses normalized texture
coordinates. Provider acceleration therefore cannot prove a particular blur
shader ran, or establish a precision/allocation cause.

Searchfox discovery was checked through `--get-file --force-refetch` after one
cached definition response pointed at stale line positions. The installed
CLI reports version 0.18.0 with 0.20.4 available; no tool update occurred.
The discovered upstream file is
[FilterNodeWebgl.cpp](https://searchfox.org/firefox-main/rev/00a4d527cdb9807ecb561c9fcf7d211e7e568ddf/dom/canvas/FilterNodeWebgl.cpp).
Upstream discovery and the candidate source boundary are distinct evidence.

## Implementation And Verification

Plan: `docs/umbrafox/archive/plans/blur-controls.md`. New artifact siblings under
`artifacts/umbralink-control/` implement the collector, capture and laptop
driver. Existing transport, observer, private-root and installation helpers
are reused; prior source files and failed captures are untouched.

The collector keeps one VideoFrame and fixed raster/synthetic inputs across
their default/readback pairs. It removes target canvases, closes the frame,
and removes source canvases on success or failure. Native observations precede
pixel reads. Only the first video-blur pair carries full raw buffers; other
pairs carry hashes and bounded difference summaries. Two raw buffers are
independently hash-joined and their reported difference recomputed on the host.

The combined suite passes 57 checks, including prior pixel/readback cases.
New tests cover difference arithmetic, exact emitted child configuration,
native-before-read order, source mutation, malformed results, seek/media/draw/
read failures, frame lifetime, stale document, OFF-pref admission, profiler
rejection, RPC/save failures and abort. A malformed maximum-difference summary
first passed incorrectly; a behavioral failing test now guards its rejection.
Initial test-file syntax failures are retained but are not browser bug evidence.

Primary logs: `blur-controls-final-tests.log`, `blur-controls-bounds-red.log`
and `blur-controls-format.log` in the artifact parent. Saved-data recomputation
is `blur-controls/recomputed.json`; it exactly reproduces both saved summaries.

## Runtime And Cleanup

Pinned candidate BuildID: `20261006023500`. Harness:
`~/.cache/codex/blur-controls-harness-20261006-q9Wrzp` on `wyatt-laptop`.
All 49 harness files and 46 package files passed hash admission; repeat preflight
rechecked the harness and available resources. The existing driver verified
each fresh installation before launch and after cleanup.

- Run `AgcWrp`: controller 1248719, browser 1248773; 14.519 seconds;
  35 exported files, 758408 bytes; five resource samples,
  peak sampled artifact size 64461242 bytes.
- Run `rwYDkj`: controller 1251743, browser 1251756; 14.459 seconds;
  35 exported files, 758425 bytes; five resource samples,
  peak sampled artifact size 64460736 bytes.

Both roots use the prefix `~/.cache/codex/laptop-blur-controls-20261006-`.
Both controllers exited 0; cleanup reports clean SIGTERM and owned-root
absence. All 24 recorded controller/browser/child PIDs were independently
absent during the two bounded evidence exports. Logs are 271 bytes each with
zero drops. This is sampled ownership evidence, not a proof excluding every
transient helper or all network activity. Profiles and tokens were not exported.

No browser, controller, profiler or compiler remains active from this work.
No desktop browser interaction, source-engine edit, install, default change,
staging or commit occurred. Staged diff SHA256 remains
`3b78253cf775a4a1e8c69a4b82cc3958b366056129a391f4ae362bdfe8e4e0c4`.

The original strict pixel gate remains unresolved. No ON run, new frame-2
acceptance, stock Firefox parity proof, import-failure injection, context-loss
proof, moving performance result or YouTube stutter attribution is claimed.

Evidence, fixture sources, tests, plan and this report are sealed by
`artifacts/umbralink-control/blur-controls-final.sha256`. Exact verification
commands and source/index guards are in `blur-controls/verification.json`.
Subsequent experiments must preserve this matrix and use separately identified
source/evidence revisions.
