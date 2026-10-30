# Pi WR render attribution: P2 proposal

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Status: P2 schema/source frozen; optimized ARM diagnostic build/package and
artifact verification passed. Handoff report:2026-10-16-wr-render-p2-diagnostic.md.
Coordinator runtime controls and optimization selection remain. No Pi/runtime authority.
Coordinator: l8ros; browser source/artifact owner: umbra.

## Runtime Acceptance Failed: October 16, 18:45 UTC

Coordinator's matched A/B receipt supersedes the provisional P2 result below.
Same Pi, 60fps 1080p video `LXb3EKWsInQ`, 1344x756 viewport, fresh sessions,
no ffplay and profiler OFF in both arms:

- Release R: 32.4/36.9/31.1fps present; 49.6/45.0/52.8% dropped.
- P2 BuildID20261016175431: 0.1/0.1/0.2fps present; 99.8% dropped.

Treat P2 as a failed runtime diagnostic, not an accepted observer. The package
comparison does not yet isolate a particular probe, backend or configuration
mechanism. Diagnose and reproduce that mechanism before claiming a corrected
build. Preserve the sealed failing package and original evidence. Effective
graphics/backend, renderer errors/liveness and binary-state receipts have been
requested from l8ros. The separate clean release 1080p30 result remains healthy
for its tested case; clean release 60fps performance is still the eventual
optimization target. No optimization belongs in this probe correction.

## Runtime Correction: October 16, 18:39 UTC

The coordinator reports that an orphan `ffplay` consuming 98.6% CPU polluted
earlier low-fps observations. After removing it, release R fullscreen 1080p30
presented 30.0fps with 0-1.6% drops. The reported 60fps-content result remains
approximately 30-43fps present with drops. The clean 60fps case is now the
optimization target; the tested 30fps case is not evidence of a general 30fps
failure. These are coordinator-reported observations, not local measurements.

Earlier low-fps figures below are retained as historical evidence, not a clean
baseline. The coordinator has not yet mapped the orphan's lifetime to exact P1
capture IDs/timestamps. Do not silently invalidate every capture or reuse its
timings as uncontaminated evidence. Low Renderer CPU does not establish a GPU
bottleneck when competing work or scheduling remains a possible confound.

Separate open gate: subsequent in-progress coordinator pane output reports
about 0.2-0.3fps for clean P2 runtime-OFF, with a tighter R/P2 comparison underway.
This is provisional and not yet a completed matched comparison. The initial
ffplay explanation does not clear P2-OFF. Require exact running binary and
profiler-state receipts, matched content/viewport/backend and clean-process
controls before attributing a diagnostic regression or selecting a rendering
fix. Do not treat runtime-ON measurements as representative until this gate is
understood. Source/build/export remain sealed; l8ros owns runtime verification.

## Frozen Implementation

Fixed BuildID20261016175431. Schema SHA256
`f016802c5c29de569f59223c97f196f258817a71200f45e831eed7fca1bf6b75`.
Separate29-file P2 probe patch SHA256
`6b970fcdfb8c322e4b2a733688c4b597935f64baf009c1841b6877153e46d383`.
Combined47-file base-to-P1/P2 patch SHA256
`d94c2027cedbe5776e2206d22089208c69f6d63e93b83a7ac091f6e8db7d29c3`.
Replay receipts, file identities and prebuild evidence:
`/home/public/wyatt-desktop/.cache/codex/umbrafox-wr-render-fix-20261016/`.
No optimization or GPU queries are included. Historical proposals below are
superseded by the frozen schema where they differ. C++8/Cargo2/nice0 with guarded
memory fallback; coordinator owns deployment and diagnostic runtime-OFF/ON arms.

## October 16 evidence corrections

This addendum supersedes the earlier request to search D1 for draw/tile/reason
markers below. l8ros checked the same capture: those names occur in markerSchema,
but no corresponding records were emitted. P2 needs explicit bounded counters.
The earlier renderer-frame admission gap is not a presentation rate; the inferred
21 fps claim is withdrawn. Coordinator-supplied `mozPresentedFrames` observations
are 32-51 fps at 1080p, with approximately 48% of decoded frames dropped.

With source/codec/player held fixed by the coordinator, the 720p-output capture
has d3 median17420us versus24056us at1080p: a27.6% reduction for a2.25x nominal
output-area ratio. Two points are consistent with, but do not establish, mixed
fixed and per-pixel costs. The misconfigured overclock arm is excluded. Thread
CPU26% and a different player's poor upload performance do not uniquely prove
GPU causality or that WR uploads these native video planes.

The source audit confirms that native per-plane `TextureHandle(Texture2D)`
resources bypass `upload_to_texture_cache`, which rejects NativeTexture input.
The observed native DMA-BUF lock does not reveal whether final video rendering
uses promoted external-YUV composition or a nonpromoted YUV quad through an
offscreen/picture target. That distinction is a required P2 observation.

## Decision and evidence

Deprioritize generation-safe V4L2 import reuse for this measured workload.
It cannot plausibly remove the reported dominant WR-render time. Retain it as
a separate candidate only if another workload measures substantial import cost.

l8ros reports D1 Wayland: 2357 P1 records, 160 renderer frames, d3 median
24.1 ms, 77.9% of the renderer stage-sum, frame-gap median 46.8 ms. Plane import,
external-image acquisition, present and measured compositor work are small.
These figures are coordinator-supplied, not independently decoded in this audit.
The percentage is not an independently proven fraction of the presentation
critical path. Nested import and lock durations must not be added together.
Zero DecoderPool records do not prove zero decoder work or zero copies.

Read capture receipt:
`exports/umbrafox-wr-video-p1/captures/D1-wayland/RECEIPT.txt`.
Raw dump: 415063421 bytes, SHA256
`b734fffd163d4f986c55ab3aaac2ce00ab12cc49eaac06c9865133e688d4a5ec`.
The raw profile was not loaded, parsed or uploaded during this source audit.

Deployed source authority:

- Base `c0e7f8a2be0460695c1f65ae8796b09c1082480c`.
- P1 patch `731d9ec249e4de7d7f1aa58179504cbb9ae5f12f2cfe1b2cadbb616a3228874e`.
- Diagnostic BuildID `20261016031646`, archive SHA256
  `70d5a7470fed931cfaa5ec261cc66c231204443066756626a00db0fdc3370f16`.
- Frozen P1 schema remains unchanged, SHA256
  `a06997869ed4ee62a2acd2dedf669085e33752c354fcdb8dc4065e9ca1d8470d`.

## What d3 actually measures

`RendererOGL::UpdateAndRender` measures the C ABI `wr_renderer_render` call.
`gfx/webrender_bindings/src/bindings.rs` calls Rust `Renderer::render`, which
selects a prepared document, calls `render_impl`, and completes notifications
and error handling. The binding also copies result statistics and dirty rects.
This is CPU wall time, not GPU execution time.

`gfx/wr/webrender/src/renderer/mod.rs::render_impl` includes:

1. Frame/pool setup and `update_gpu_profile` result collection.
2. Device begin-frame, texture-cache updates and native-surface updates.
3. External-image deferred resolves and UV-copy application.
4. `draw_frame`: GPU-buffer updates, bind-frame-data, dirty-rect calculation,
   offscreen/picture-cache rendering, final composition and buffer eviction.
5. External-image unlock, end-frame and profiling/debug/resource-management tail.

Display-list processing is elsewhere: `SceneBuilderThread::process_transaction`
calls `SceneBuilder::build`; `render_backend.rs::Document::build_frame` calls
`FrameBuilder::build`. Visibility, preparation and batching occur there.
`FrameBuilder::build` calls `CompositeState::end_frame`, including tile z-sort,
before the prepared frame reaches the renderer. These are not d3 substages.
They can affect frame arrival or scheduling and need separate thread evidence.
Inside d3, `composite_simple` still builds composition layers/occlusion lists;
do not label all CPU composition preparation as display-list construction.

## Existing evidence before another build

Ask the coordinator's existing decoder/exporter for these existing Gecko markers
from the same D1 file: `NumDrawCalls`, `NumPictureCacheInvalidated`, and
`Render reason ...`. Join only uniquely contained, same-thread markers to a
complete frame envelope with a checked clock. Keep unmatched/ambiguous counts.
Reused render documents and `Renderer::update` rendering can create observations
outside the d3 call; nearest-time matching is not acceptable.

Inspect Renderer CPU samples/thread CPU deltas if the capture actually contains
them. Record missing stacks or native symbols as missing evidence. Rust Tracy
scopes and GL debug groups are not automatically Gecko profiler intervals.
Neither starting Gecko profiling nor seeing P1 markers proves GPU timers enabled.

The coordinator subsequently checked actual `gfx.webrender.debug.gpu-time-queries`
and `gfx.webrender.debug.gpu-sample-queries`: both false for D1. This excludes
query-result blocking for this capture; do not pursue it as the current cause.
The separate `gfx.webrender.enable-gpu-markers` debug-label setting is not the
timer-query switch. The producer of the query flags is
`gfxPlatform.cpp::WebRenderDebugPrefChangeCallback`; the consumer is
`Renderer::set_debug_flags` enabling `GpuProfiler` query sets.

Important conditional confound: `update_gpu_profile` calls
`GpuProfiler::build_samples`. Its four-frame ring retrieves old query results
through `device/gl.rs::GlQueries::query_result`, which calls
`get_query_object_ui64v(..., GL_QUERY_RESULT)` without an availability check.
That can block if queries were enabled and their results are not ready. Empty
query sets do not establish such a stall. Do not turn those prefs on as an
assumed passive/nonblocking observation, and do not diagnose this as the cause
without flag/readback-time evidence. That evidence now excludes this branch for
D1, not every other profiling overhead or driver-internal wait.

## Smallest useful P2

First add only CPU-side partitioning and bounded scalar counts, if approved.
Preserve P1 as an unchanged outer envelope; freeze a distinct P2 schema and
patch before implementation/build. No optimization belongs in that patch.

| Partition | Exact source boundary | What it would distinguish |
| --- | --- | --- |
| Query collection | `render_impl` -> `update_gpu_profile` | Excluded for current D1 by disabled query flags; retain only a cheap validity/state guard for future captures |
| Resource preparation | Device begin, `update_texture_cache`, `update_native_surfaces`, deferred resolves | Allocations/uploads/imports versus draw submission |
| Draw preparation | GPU-buffer updates, `bind_frame_data`, dirty-rect calculation | Buffer/driver calls versus composition/list CPU work |
| Offscreen/picture work | Existing pass loops and `draw_picture_cache_target` / `draw_render_target` | Re-rasterizing cached scene content versus final composition |
| Composition preparation | `composite_simple` layer/occlusion construction, before `composite_pass` | CPU scene-sized bookkeeping versus issuing draws |
| Composition execution | `composite_pass` clear and `draw_tile_list` shader/batch flushes | YUV, RGB, opaque/alpha draw submissions and clear cost |
| Tail and residual | Unlock/end/profile/eviction and outer-minus-disjoint-inner | Cleanup, instrumentation and otherwise unclassified time |

Use disjoint aggregate durations for accounting; separately label nested totals.
Do not subtract per-stage medians to construct a fictitious median frame.
Keep any unmeasured work as residual, and retain invalid/incomplete intervals.

At existing loops/branches count actual draws and instances by YUV/RGB/other,
offscreen versus final destination, opaque/alpha, rendered picture targets,
render passes and existing upload bytes. Record actual Draw/Native/Layer route,
frame reuse, force-redraw, dirty/partial/full-present state and target dimensions.
Count already-computed dirty/valid/clip areas as geometric estimates, not shaded
fragment counts or a proof of overdraw. No extra traversal or GL query just to
collect metadata. Separate shader-bind/compile from instance-buffer upload and
draw-call CPU wall time if the composition partition dominates.

Both YUV routes matter: `BatchKind::Quad(PatternKind::Yuv...)` has a YUV batch
tag, while `renderer/composite.rs::draw_tile_list` can select
`CompositeSurfaceFormat::Yuv` directly for external surfaces. The latter falls
under the broad `GPU_TAG_COMPOSITE`; a missing YUV primitive tag does not prove
the final compositor avoided YUV sampling/conversion. `res/composite.glsl`
calls `sample_yuv` in its YUV fragment variant.

Two thread-CPU-clock samples around the outer d3, with supported/valid flags,
would distinguish on-CPU execution from elapsed time not charged to that thread.
Existing sampled stacks then separate Rust bookkeeping, Mesa CPU work and waits.
Low thread CPU does not prove GPU blocking: descheduling, locks and preemption
remain alternatives. High thread CPU can include driver spinning. No process
CPU percentage is a substitute for the exact Renderer thread and interval.

## GPU attribution is a separate conditional step

Pinned source says pixel sampling/conversion and raster work run on the GPU
for the confirmed hardware path. It does NOT predict whether d3 on this V3D
system is GPU-bound, CPU-bound, synchronization-bound or scheduling-bound.
GL calls can submit asynchronously or block inside the driver. Cheap SwapBuffers
and a no-op explicit WaitForGPU do not rule out those internal waits.

If CPU partitioning and stacks cannot resolve the bottleneck, propose sparse,
bounded asynchronous GPU queries as a separately reviewed P2 extension. Verify
the actual native context/driver capability and counter bits; poll availability
without waiting, retain originating frame identity across delayed completion,
bound pending objects and drop/report unavailable results instead of stalling.
Handle context loss, disjoint/reset results, exhaustion and unsupported devices.
No `glFinish`, synchronous result collection, per-draw query flood or runtime API.
Existing four-frame query reuse is not itself proof that collection is nonblocking.

Whole-composition timing alone cannot separate YUV draws from RGBA composition.
Query scopes must distinguish the actual route without illegal nesting; tiled
GPU query boundaries can perturb render passes, so validate overhead independently.
GPU durations are a separate timeline, not additive to CPU wall stages or a
per-decoded-frame identity claim. Khronos explicitly warns CPU clocks do not
measure completion and documents asynchronous queries and disjoint validity:
[EXT_disjoint_timer_query](https://registry.khronos.org/OpenGL/extensions/EXT/EXT_disjoint_timer_query.txt).

## Falsifiable next decisions

1. Keep source video resolution/codec/quality and player state fixed while
   changing drawn area. A cost reduction indicates pixel/area dependence, not
   specifically fill-rate: YUV shader work, bandwidth and overdraw also scale
   with pixels. A flat result does not prove YUV cost. Record DPR, display mode,
   player layout, actual drawn size and decoded dimensions; a changed YouTube
   layout or selected stream invalidates a one-variable conclusion.
2. If slow d3 coincides with repeated offscreen/picture invalidation, high
   rasterized area and relevant render reasons, trace invalidation/dependency
   generation. If tiles stay cached and final composition dominates, deprioritize
   scene rebuild and target the actual YUV/RGB composition path.
3. If query collection dominates with queries enabled, fix measurement first.
   If uploads/instance writes dominate, inspect buffer reuse and driver waits.
   If CPU composition bookkeeping dominates, investigate allocation/occlusion
   work. If valid GPU timings localize YUV or overdraw, then consider a
   rendering-equivalent shader/composition optimization with pixel tests.

None of these outcomes currently justifies force-enabling the blocklisted native
compositor, changing display defaults, reducing video quality, or changing
decoder lifetime/reuse. P2 selects a fix; it is not itself a performance fix.

## Verification and ownership gates

AGIS test protocol: the hypothesis is that d3 conceals separable CPU/driver/GPU
costs, not that one of them is already guilty. Existing P1 tests protect scope,
eligibility, byte/record limits and supplied-data identity/clock validation.
Before P2 implementation, add failing-first tests for:

- Skipped/reused/failed frames, nested nonadditive timing, residual accounting,
  multiple windows and exact P1/P2 frame/process joins; no invented endpoints.
- YUV primitive versus external-composite routes, RGB mixtures, dirty versus
  full rendering, shader failures, overflow and unknown metadata.
- Inactive/paused/filtered/expired/capped probes: no argument evaluation or
  diagnostic driver work; unchanged rendering statements after probe stripping.
- Optional GPU queries: not-ready, late, disjoint, unsupported, context loss and
  full pending pool; no blocking query or altered rendering on any failure.

Small pure tests: 10-second watchdog; larger native/sanitizer/build gates get
explicit bounds in the implementation contract. Require compile-out proof for
the new patch, native ARM compile/link, valid record decoding and observer-control
comparison. Synthetic source checks cannot establish driver behavior or overhead.
Use the same per-process bounded one-shot budget as P1, shared rather than
silently adding another allowance; freeze the exact cross-language admission
and frame-identity contract before coding. GPU objects need a separate hard cap.

Keep R, diagnostic-runtime-OFF and diagnostic-runtime-ON controls; historical R
does not prove new-patch compile-out. l8ros owns all Pi runtime, app state,
display changes, capture-memory/disk limits, retrieval and restoration. The
128-MiB observed profiler-ring floor remains independent of custom records.
No public JS, pixels, URLs, pointers, FDs, extra waits or filesystem hot-path
work in new probe payloads. No owner desktop browser actions.

Source-audit verification: 12 inspected unmodified files (binding, renderer,
composition, GL/query backend, frame/scene/backend builders, profiler, composite
shader and gfxPlatform) were byte-compared with `git show` of the exact base;
all matched. The P1-modified RendererOGL boundary was read from the isolated
frozen source. Searchfox was used for discovery, not as deployed provenance.
No source changes, tests, builds, profiles or device commands ran in this audit.
