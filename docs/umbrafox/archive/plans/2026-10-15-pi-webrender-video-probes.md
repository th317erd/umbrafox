# Pi WebRender video path attribution

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Status and authority

Source audit and implementation proposal, not an implemented probe or a measured
fix. This extends PERF-001, PERF-010 and PERF-011 in the
[performance catalog](../docs/performance/catalog.md). Apply the existing
[instrumentation contract](../docs/performance/instrumentation.md).

Coordinator l8ros requested a bounded browser-side investigation: distinguish CPU
uploads, YUV conversion and DMA-BUF imports, then locate the dominant composite
stage and propose a fix. Release probes must remain OFF; no new website-visible
JavaScript. The initial accepted chunk is source audit/plan. l8ros retains all
Pi deployment, runtime, restoration and measurement authority. No Pi, desktop
browser, profile, build, rendering preference or production source was changed
by this audit.

Coordination: `/tmp/codex/teamwork/20261014T2105Z-l8ros-arm.sqlite`, session
`20261014T2105Z-l8ros-arm`, task `track-wr-video`; read
`/tmp/codex/l8ros-arm-bus.txt` after each command. HALT stops. Reach l8ros through
tmux `l8ros:1.1`, not the obsolete websocket thread. Inspect the input line before
pasting; never submit an owner draft. Record decisions and progress in the DB.

## P1 approval and artifact contract

Coordinator decision57 approves P1 scope conditionally. This does not authorize
an ARM build or any device operation. The audit reviewed at SHA256
`afc001adee01890b1d46c466de75cbf2ac17de3c621e1d659cf35418a19c4823`
precedes this clarification. Exact source base is frozen as
`c0e7f8a2be0460695c1f65ae8796b09c1082480c`, not current main. Before probe source
edits, freeze the separate [schema v1 contract](2026-10-15-pi-webrender-video-schema-v1.md)
with its SHA256. That document now fixes the field/enum, eligibility, budget,
emission and missing-data semantics; implementation/serializer/concurrency
verification is still owed. Preserve the probe-only patch separately from every
optimization.

**Requested ARM work: one new diagnostic build, plus reuse of the existing
release beta as the compiled-out runtime control.** Both artifacts are needed;
two new ARM builds are not requested for the initial attribution capture.

All paths below are on wyatt-desktop, relative to
`/home/wyatt/Projects/umbrafox-workspace/umbrafox/`:

| Role | Exact archive path | Status |
| --- | --- | --- |
| New P1 diagnostic, beta overlay | `exports/umbrafox-wr-video-p1/diagnostic/umbrafox-wr-video-p1-beta-c0e7f8a2be04-linux-aarch64.tar.xz` | Proposed output, does not exist yet; build requires separate authorization |
| Compiled-out release beta control | `exports/umbrafox-arm-20261014/beta/umbrafox-beta-20261014135715-linux-aarch64.tar.xz` | Existing110565684B, SHA256 `fc3ba2d3139fc1021fb2c1d20db2b041b9a34759270300f8e8984a992fec1436`, BuildID20261014135715 |

The diagnostic is optimized ARM64 with `--enable-umbra-perf-probes`, exact base
plus only the frozen P1 patch, and the same beta preference file as the control:
SHA256 `4278e82f4538bf4058aefd3b488e77069be9c7edd1e36791456c194e79967eb2`.
Both experimental settings remain user-overridable. l8ros chooses and verifies
the same effective settings in every comparison arm. Keep the native compositor
OFF; no rendering-default change is part of this patch. The ordinary
`mach package` output is an intermediate, not another requested runtime variant.
The diagnostic receives its own recorded BuildID; do not label it with the old
release BuildID merely to make identities match. Package layout stays one
`umbrafox/` directory. Handoff includes archive bytes/SHA, both INI and native
BuildIDs, exact config/toolchain, source patch SHA, schema SHA and overlay SHA.
Preserve first build failures and do not overwrite a published export.

If authorized, build only on wyatt-desktop at C++2/Cargo2 jobs and nice10, in an
isolated source/object tree. Do not modify the previous ARM build/control or
install this diagnostic over the desktop nightly. No build has started.

### Control definitions and sequencing

- `R`: existing release beta, custom probes compiled out, profiler inactive.
  This is gate5's **OFF control**, before and after the diagnostic arm.
- `D0`: the new diagnostic package with profiler inactive, hence new probe
  eligibility false. This is compiled-in/runtime-off, not equivalent to `R`.
- `D1`: the same diagnostic package with eligible profiling active and the
  one-shot custom-record window enabled. This measures the combined profiler
  and custom-probe observer cost; `D1-D0` does not isolate the custom probes alone.

l8ros first supplies clean Wayland and XWayland baseline arms with actual gfx
compositor/backend receipts inside each arm. Do not infer the backend from
preference files, reuse contaminated arms or pool the two window protocols.
After schema, tests, review, build authorization and artifact verification,
l8ros alone deploys/runs/restores `R -> D0 -> D1 -> R` with matched workload and
settings. Profiler activation must follow settling: startup activation can spend
the one-shot20s budget before the measurement begins. Starting/stopping profiling
uses an existing owner-controlled browser facility; the dump command below does
neither. Confirm that lifecycle with l8ros before a capture, without adding a
new public API or assuming an unsupported UmbraLink command.

Reusing `R` avoids a second multi-hour ARM build now, but **does not prove release
exclusion of the new patch**, because that artifact predates it. Retain gate4's
patch-applied, compile-disabled build/object/package inspection before release
acceptance. Its artifact/build authorization is separate from this initial
diagnostic request. Neither source `#ifdef` review nor the historical package
alone completes that gate. Old-release/new-diagnostic build differences also
remain an attribution limit, not a bit-for-bit matched-build claim.

### Private capture and retrieval

Pinned `UmbrafoxControlService` dispatches
`umbrafox.performance.profile.dump` to
`UmbrafoxControlDiagnostics.dumpProfile`. The consumer requires an already
active profiler, accepts only a basename, and returns `{path}` after writing
the JSON and setting its permissions to0600. Its profiles directory is created
with0700 requested permissions. This is a source-confirmed route, not a new Pi
runtime test or a claim about modes of preexisting directories.

Use unique per-arm filenames, for example:

```json
{"id":1,"method":"umbrafox.performance.profile.dump","params":{"filename":"wr-video-p1-wayland-01.json","sinceTime":0}}
```

For XWayland use `wr-video-p1-xwayland-01.json`. The device output is exactly
`<diagnostics.profileDir>/umbrafox/diagnostics/profiles/<filename>`; obtain the
actual profileDir from the same owned process and require the returned absolute
path to match it. Do not hard-code a previous session's dynamic profile name.
After the timed window, while the profiler can still dump, l8ros retrieves that
file over its existing SSH channel to desktop
`exports/umbrafox-wr-video-p1/captures/<arm-id>/`. Save the dump receipt, runtime
gfx/media/performance/configuration boundaries and transfer size/SHA checks
alongside it, never the discovery token. Dump/export work is outside the measured
interval. No browser/Pi access, transfer or profiler command is delegated here.

The custom payload budget is **per process**:16384 total records including the
reserved terminal record, at most512 encoded payload bytes per record and8MiB,
one-shot20s. It is not an aggregate browser or profile-file cap. The Pi's observed
4M-request/16M-actual entry clamp means a128MiB ring allocation floor; exported
JSON, child-process profiles and temporary serialization memory can exceed that
number. Record requested and actual capacity, reject missing/overwritten custom
records as incomplete, and agree separate total memory/disk/export limits before
runtime. Do not lower a request and claim the ring shrank. Existing profiler
metadata may contain URLs even though the new records do not: keep the entire
capture private and local, with no automatic upload or remote symbolication.

## Evidence and limits

**Corrected baseline, coordinator event59:** l8ros reports clean runtime-verified
arms, with `wrCompositor` blocklisted checked inside each arm: Wayland26.5fps
presented/67.8% dropped; X11(XWayland)20.2fps/73.3% dropped. This reverses the
earlier X11 advantage. These are coordinator-verified results, not independently
rerun here; source inspection does not establish their interval/counter validity.
The earlier0Hz/60Hz comparison is not evidence for switching to X11. The corrected
comparison weakens refresh-reporting as the proposed dominant explanation, but
does not experimentally isolate refresh reporting from other backend changes.
Do not infer that refresh/vsync has no possible contribution. No platform-default
change or rendering optimization is selected by this result.

**Earlier contamination history:** l8ros reports that
`gfx.webrender.compositor.force-enabled=true` persisted in profile `prefs.js`
despite removing defaults/user.js settings. Some earlier purported OFF arms
were contaminated. l8ros has since cleared the value and observed Wayland with
the compositor blocklisted, but the Wayland/XWayland comparison needs a clean
re-baseline, now reported complete above. The numerical results below are
preserved historical reports, not
accepted controlled OFF-versus-ON or Wayland-versus-XWayland evidence. Do not
choose an optimization or platform default from them. Source mapping remains
valid; the exact measured bottleneck is open.

- Coordinator DB event52 confirms deployed beta BuildID `20261014135715`, exact
  source `c0e7f8a2be0460695c1f65ae8796b09c1082480c`. Package provenance is in
  [the ARM export](../../../../exports/umbrafox-arm-20261014/README.md). Do not substitute
  current main or September's source patch for this pin.
- Reported visible, single-tab, hd1080, 45-second-settled Wayland measurements:
  11.5-17fps presented, 72-86% dropped; Renderer37%, Compositor26%. Forced native
  composition was worse and remains OFF. These are coordinator measurements,
  not independently rerun here. Presented counters are not physical scanout.
- Coordinator subsequently measured XWayland at17-27fps and56-72% dropped. The
  saved snapshot confirms `windowProtocol=xwayland`, V3D4.2.14.0, Mesa26.0.8.0,
  hardware WebRender, no GPU process and native compositor unavailable on X11.
  This individual X11 snapshot does not rescue the contaminated comparison.
- Snapshot: `~/.cache/codex/l8ros/x11-20261016/umbralink-snapshot.json`, also
  `/tmp/codex/l8ros-x11/umbralink-snapshot.json`; timestamp
  `2026-10-16T01:46:12.799Z`. Video is selected/visible,1920x1080, but **paused**.
  It proves this sampled identity/configuration, not an FPS interval or the
  absence of decoder stalls. H.264 hardware use through `/dev/video10` is
  separately coordinator-reported.
- Reported refresh0 versus60 is a lead, not a demonstrated pacing defect.
  `wl_output` mode refresh, presentation feedback refresh, browser vsync and
  swap throttle are different producers/consumers. X11 also changes more than
  the reported refresh value. Preserve that confound.
- Existing September callback/canvas evidence is not a direct measurement of
  this YouTube workload. Do not infer a canvas path or source-sized readback.

Source discovery used Searchfox, followed by `git show` against the deployed
pin. Searchfox tip is not deployed-source authority. The installed CLI reports
0.18.0 with0.20.5 available; it was not updated. A guessed old shader path was
absent; the actual pinned shaders are `ps_quad_yuv.glsl`, `composite.glsl` and
`yuv.glsl`.

## Verified source map

All symbols below refer to the pinned revision, not unqualified tip.

| Stage | Producer and consumer | What it establishes |
| --- | --- | --- |
| Decoder output | `FFmpegVideoDecoder::CreateImageV4L2` in `dom/media/platforms/ffmpeg/FFmpegVideoDecoder.cpp` | Takes `AVDRMFrameDescriptor` from the FFmpeg frame, uses `VideoFramePool`, then `VideoData::CreateFromImage`; this route does not unconditionally read pixels to CPU |
| Pool decision | `VideoFramePool::GetVideoFrameSurface(AVDRMFrameDescriptor...)` and `ShouldCopySurfaceLocked` in `FFmpegVideoFramePool.cpp` | Chooses import or GPU copy using effective zero-copy eligibility, pool pressure and copy success; copy failure retries the move path |
| Copy versus move | `DMABufSurfaceYUV::UpdateYUVData`, `MoveYUVDataImpl`, `CopyYUVDataImpl` in `widget/gtk/DMABufSurface.cpp` | Move duplicates descriptors; copy allocates planes and submits `BlitTextureToTexture`, not necessarily a CPU copy |
| Image transport | `DMABUFSurfaceImage::GetTextureClient`, `DMABUFTextureData::Serialize`, `DMABUFTextureHostOGL::CreateRenderTexture` | Carries the DMA-BUF descriptor to a `RenderDMABUFTextureHost` |
| Compositor-thread work | `WebRenderBridgeParent::CompositeToTarget`, `AsyncImagePipelineManager::ApplyAsyncImageForPipeline`, `UpdateImageKeys`, `ProcessPipelineUpdates` | Separate scheduling/backpressure, image-resource transactions and release work from the Renderer thread; existing `SkippedComposite` is an outcome, not a root cause |
| WR resource | `DMABUFTextureHostOGL::PushResourceUpdates` / `PushDisplayItems` | TextureHandle resource; NV12 and planar YUV remain plane textures and YUV display items |
| Renderer lock | `wr_renderer_lock_external_image` in `RendererOGL.cpp`, `RenderDMABUFTextureHost::Lock` | Has external-image/channel and actual GL/SWGL/native route; may create textures and invoke semaphore handling |
| Driver import | `DMABufSurfaceYUV::CreateTexture` | Distinguishes already-created texture, EGL-image import, direct2D bind, fallback copy and failure |
| Copy fallback | `CreateTextureViaCopyYUV` / `CreateTextureViaCopyP010` | After direct2D binding fails for supported linear formats, binds an external texture, allocates2D storage and submits `CopyImageSubData` |
| CPU upload alternative | `RenderBufferTextureHost::Lock` and WR `renderer/upload.rs::upload_to_texture_cache` | RawData uses texture-cache upload/staging; buffer lock duration alone is not upload time or video attribution |
| Shader conversion | `renderer/external_image.rs::update_deferred_resolves`, `ps_quad_yuv.glsl`, `composite.glsl`, `yuv.glsl::sample_yuv` | Native texture sampling and YUV-to-RGB matrix conversion are compatible with direct DMA-BUF import; conversion does not imply CPU work |
| Composite envelope | `RenderThread::UpdateAndRender` | Existing `Composite #WindowId` includes renderer work, post-render notification, backend wait and pipeline-release tail |
| Renderer phases | `RendererOGL::UpdateAndRender` | PreRender/BeginFrame, WR update, WR render, FlushPipelineInfo, optional readback/recording, EndFrame, PostRender, screenshot tail |
| Present boundary | `RenderCompositorEGL::EndFrame` | Damage setup, optional GTK surface lock, then SwapBuffers; separate lock acquisition from swap |

The import extension creates an EGL image from buffer descriptors; it does not
certify that later engine or driver operations make no copies. See the
[Khronos import specification](https://github.com/KhronosGroup/EGL-Registry/blob/main/extensions/EXT/EGL_EXT_image_dma_buf_import.txt).
Use **direct-import path**, not a universal end-to-end zero-copy claim.

### Important falsifiers

1. A DMA-BUF host can already contain a pool copy. A successful EGL import can
   then take another GPU-copy fallback. Record these as separate decisions.
2. V4L2 calls `DisableRecycle()` because it lacks a reliable FFmpeg surface ID.
   Repeated import/setup is a candidate; this source fact does not quantify its
   CPU cost. Do not simply remove that safety check or use numeric FDs as keys.
3. The V4L2 pool estimates20 capture buffers. `IsFFMPEGSurface()` tests a retained
   FFmpeg reference (`mLib`), not the valid surface-ID field; V4L2 pressure can
   participate even though its reusable FFmpeg ID is invalid.
4. EGL inherits `RenderCompositor::WaitForGPU()` returning true. It has no
   overriding GPU wait. A `wr.gpu_wait_time` sample is not proof of an EGL fence
   bottleneck. GTK first tries EGL, then OGL; record the actual backend on X11
   rather than deriving it from `windowProtocol` alone.
5. The surface UID is serialized, but the descriptor PID is set to0 when
   recycling is disabled. It is not then a trustworthy producer PID or a
   globally unique frame join. A surface can serve multiple frame uses.
6. Pool copies, buffer uploads and driver commands have CPU submission duration;
   that is not GPU completion duration. No extra fence or glFinish may be added
   just to make a timing convenient.

## Minimal implementation proposal

Implement in two independently reviewable steps, keeping rendering unchanged.

### P1: Native route and composite-stage markers

Use the existing opt-in `--enable-umbra-perf-probes` /
`MOZ_UMBRA_PERF_PROBES` gate and existing private Gecko Profiler transport.
There is no need for a new UmbraLink command, WebIDL, page event or global.
**Exclude** all new diagnostic declarations, storage, argument construction,
clocks and calls in release builds; do not
gate or remove any existing rendering work or upstream profiler behavior.

First-patch sites:

- `FFmpegVideoFramePool.cpp`: bounded outcome record for the DRM route, including
  copy requested, reason (policy/pressure), copy result, move fallback, dimensions
  and plane format; no pixel data, URLs, pointer values or file-descriptor dumps.
- `DMABufSurface.cpp`: one fixed-layout result per attempted plane import;
  already-cached/direct/fallback/failure, existing observed GL/EGL error values,
  CPU intervals for capability query/import/bind/copy. Do not issue extra driver
  queries or consume error state solely for instrumentation. Include pool blit
  and CPU readback/upload route counters separately where actually performed.
- `RendererOGL.cpp` / `RenderDMABUFTextureHost.cpp`: external-image/channel,
  surface correlation when available, actual backend and texture route; separate
  lock total from import and semaphore subscopes. No double-counted totals.
- `AsyncImagePipelineManager.cpp`: image selection/resource update versus
  pipeline-release spans with pipeline/epoch and operation counts. Reuse existing
  `CompositeToTarget` and `SkippedComposite` markers in `WebRenderBridgeParent`
  first; add only missing subscopes. Compositor-thread cost must not be attributed
  to Renderer spans just because both participate in one frame.
- `RenderThread.cpp` / `RendererOGL.cpp`: fixed composite-phase receipt with
  window, process incarnation, local submission ID, present/render flags,
  begin/update/render/flush/readback/end/post/tail intervals and success/error.
- `RenderCompositorEGL.cpp` and OGL fallback: separate damage, surface-lock
  acquisition and swap intervals. Keep lock lifetime and swap order unchanged.
- Tests/helper registration under existing graphics tests and
  `tools/umbrafox/tests/probe-gate/`; helper inclusion itself must be gated.

Proposed schema1 uses fixed enums, numeric dimensions/counts and monotonic native
timestamps. A span gets a local ID at admission and one completion record with
both endpoints/outcome; early return and abort are explicit. Per-process cap:
16,384 records,512 encoded payload bytes each, at most8MiB custom payload, with
one reserved terminal/incomplete record. This is not a total profiler-file cap;
existing profiler metadata/samples and export limits are separately enforced.
Recording lasts at most20 seconds from the first eligible record in a process
and never silently wraps/rearms. First version is one-shot per process; another
capture requires an owner-approved restart. Profiler inactive, paused or
thread-filtered means no payload construction or clock reads. A span crossing
eligibility loss is incomplete; no unobserved stop/restart lifecycle claim.

Implementation must validate these budgets and emission synchronization before
adding call sites. Reserve the complete record budget before work; overflow
stops new diagnostic records, not rendering. No locks shared with a reader, hot
path filesystem writes, retained texture refs, extra IPC, waits or GL queries.

The frozen schema consolidates renderer stages and plane-import subdurations into
single completion receipts; its explicit tables supersede the outline wording
where a field layout or incomplete-record behavior needs an exact definition.

P1 does not yet prove per-decoded-frame attribution across processes. Use
process-local joins and explicit unknowns. Any later cross-process mapping must
show a real producer-consumer identity bridge, including decoder restart/seek
generations; do not join merely by size, timing, descriptor PID0 or UID alone.

### P2: Only if P1 points inside WR render/upload

Use existing texture-cache upload counters first. If insufficient, extend the
existing Rust `umbra-perf-probes` feature to count classified external RawData
uploads versus native-texture resolves and time CPU upload submission, YUV draw
submission and other render passes. Join external image/channel through the
actual resolve/update path. Non-video page assets remain a separate population.
Do not turn on detailed sampling-operand traces as the default first probe.
GPU execution time requires a separately reviewed asynchronous-query strategy;
P1/P2 CPU wall time must never be relabeled GPU time.

## Concrete fix candidates and decision rule

The first candidate is **generation-safe V4L2 import reuse**: reuse EGLImage and
texture imports for the same still-owned underlying decoder buffer/layout,
instead of re-creating imports for every display use. This requires measured
dominant import/setup cost and a reliable buffer identity/lifetime design before
code. Retain FFmpeg buffer leases and existing global renderer references;
invalidate on seek/flush, decoder recreation, format/stride/modifier change and
GL context loss. Never key by FD integer or preserve an unbounded history.
Do not remove `DisableRecycle()` without that replacement contract. A driver
fallback that copies changing content must still execute per-frame copy work;
caching the fallback texture does not make its contents current.

A smaller conditional candidate is caching the immutable plane-format capability
query in `CreateTexture` per live EGL display/configuration, only if that query
is measurably material. Preserve error/fallback semantics and clear on display
recreation. This cannot be sold as a large win without measurement.

If pool copies dominate, inspect why policy/pressure requires them and retained
buffer release timing; do not force zero-copy or grow the pool blindly. If the
direct-bind fallback dominates, investigate the exact format/modifier and driver
support before proposing a different import target. If swap/surface-lock or
pipeline completion dominates, import caching is the wrong fix: hand the joined
boundary evidence to l8ros for pacing/compositor investigation. Native compositor
force-enable remains rejected, and no fence removal is proposed.

## Verification and landing gates

1. Before implementation, freeze the marker schema, one-shot eligibility/budget
   helper and exact source base. Compare the relevant main files to the deployed
   pin. Implement the probe-only patch separately from any optimization.
2. Failing-first focused tests (10-second small-unit watchdog): compiled-OFF
   side-effecting arguments not evaluated; compiled-ON inactive/paused/filtered
   state; nested spans and early return; observed stop during span; finite clock
   validation; exact byte/event/time boundary; overflow terminal reservation;
   concurrent emitters; shutdown without resource retention. Test outcomes for
   direct import, pool copy, bind fallback success/failure and software uploads.
3. Saved-record analyzer negatives: missing/duplicate IDs, mixed processes or
   generations, reordered/overlapping spans, truncated capture, negative duration,
   partial planes and reused UID. Known native process-clock origin must be
   normalized with the profiler export clock; no raw/normalized clock mixing.
   An ambiguous join is unknown, never silently omitted or called zero cost.
4. Build actual matched optimized diagnostic and stripped artifacts with the
   supported build environment. Default C++/Cargo2jobs,nice10 unless coordinator
   separately approves more. Inspect actual feature/config propagation, object
   references/state and packaged symbols/strings; synthetic gate tests alone are
   insufficient. Preserve build failures and full command logs.
5. l8ros has reported replacement of the contaminated baseline, checking actual
   runtime compositor/backend inside each arm, not just preference files. Retain
   those raw arms and verify the same conditions for every subsequent run. l8ros
   alone runs a bounded physical comparison: OFF control, probes compiled
   but inactive, active capture, OFF control again; same file/video segment,
   quality, viewport/scale, selected/visible state, backend and overlays. Keep
   unprofiled frame/thread measurements separate. Check actual profiler capacity
   rather than requested entries (prior Pi clamp exists). No live polling during
   timed windows. Do not combine Wayland and XWayland into one distribution.
6. Accept a path conclusion only with complete classified observations and
   explicit excluded/unknown counts. Rank stage medians/tails and total CPU wall
   shares without adding nested scopes. Retain uninstrumented controls so probe
   overhead is visible. No smoothness/performance claim from source inspection.
7. Any candidate optimization then needs its own failing-first lifetime/identity
   regression, exact pixel/crop/color-space checks, seek/restart/context-loss and
   fallback cases, and physical old/old then old/new comparisons. Cached frames
   must not freeze, corrupt or outlive decode resources. Preserve all prior
   graphics regression gates and Firefox-equivalent defaults.
8. Integrate, run relevant full gates on the combined revision, independent
   review, then publish the coherent probe-only milestone. ARM package/deployment
   is separately coordinated; no daily desktop installation or Pi operation is
   implied by this source plan.

## Audit completion

Source and saved-data inspection only. The report distinguishes concrete source
branches from unmeasured runtime selection. No new probe, compiler/test suite,
browser, profiler daemon or device command was run. Documentation/source-pin
checks accompany the handoff. `track-wr-video` remains at the plan-review gate;
the instrumentation and measured fix are not complete.

Verified locally: the20 inspected native/WR route files are unchanged between
the deployed source pin and main `9a9057291b5b5dd1c1362a2cc58551990532a6f6`
(`git diff --quiet`, exit0). Both saved snapshot copies have SHA256
`f7e16f49a551f6d44de213862b1b0cde52d0f09713fcd411d1161dbda1f9981d`.
A bounded direct Node saved-data check confirmed BuildID, XWayland, hardware WR,
one paused1920x1080 video, all3 local document links and whitespace. Git diff
whitespace checks passed. These checks validate the audit inputs/document, not
runtime import selection, native compilation or a performance improvement.

Resume checks before editing (read the bus after each command):

```sh
git status --short --untracked-files=no
sqlite3 -readonly /tmp/codex/teamwork/20261014T2105Z-l8ros-arm.sqlite \
  "SELECT id,author,kind,message FROM teamwork_events WHERE task_id='track-wr-video' ORDER BY id DESC LIMIT 8;"
git show c0e7f8a2be0460695c1f65ae8796b09c1082480c:dom/media/platforms/ffmpeg/FFmpegVideoFramePool.cpp
git diff c0e7f8a2be0460695c1f65ae8796b09c1082480c HEAD -- \
  dom/media/platforms/ffmpeg/FFmpegVideoFramePool.cpp \
  widget/gtk/DMABufSurface.cpp gfx/webrender_bindings gfx/layers/wr
```

Confirm current coordinator ownership and source base before applying a patch.
The installed clipboard prototype and its launcher/profile activation hold are
unrelated; this task must not change either.
