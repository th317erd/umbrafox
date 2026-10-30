# YUV Promotion Gates in the Release Draw Path

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Read-only response to l8ros's October 18, 20:16 request. Source baseline:
`c0e7f8a2be0460695c1f65ae8796b09c1082480c`, associated with
160.0a1 / 20261014135715. No source edits, build, package, browser invocation,
Pi access, or preference changes. The diagnostic artifact remains held.

## Direct Answers

1. **We do not yet know which condition fails, or even that promotion fails.**
   The exact decision tree is below. Native-compositor blocklisting is not one
   of its common eligibility tests.
2. **Direct final-Draw YUV sampling already works without the native compositor.**
   There is no general force-promotion preference in this path. External async
   images already request it; eligibility preserves rendering semantics.
3. **No justified performance patch can yet be selected.** A lost request flag,
   a scene/effect restriction, an upload/copy, and a driver wait require different
   changes. Forcing `Culled` would remove the tile draw without necessarily
   publishing a replacement and can make the video disappear.
4. **The CPU-raster explanation is not supported by this source.** In hardware
   WR, fallback YUV rendering is a GPU fragment shader. Source-resolution
   sensitivity does not distinguish CPU copies, uploads, GPU sampling,
   intermediate targets, or synchronization. The reciprocal submission rate is
   not a measured duration of a raster/convert function.

## Producer and Decision Tree

`AsyncImagePipelineManager::UpdateImageKeys` uses `AsWebRenderTextureHost()` to
choose external-image handling. `ApplyAsyncImageForPipeline` adds
`PREFER_COMPOSITOR_SURFACE` for that external image. This does not test native
compositor availability. `DMABUFTextureHostOGL::PushDisplayItems` forwards the
preference to NV12, planar and P010 YUV display items. Its separate
`supportsDirectComposition` capability is for native external-surface handling,
not a prerequisite for final Draw shader sampling.
[Producer](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/layers/wr/AsyncImagePipelineManager.cpp:489),
[DMA-BUF forwarding](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/layers/opengl/DMABUFTextureHostOGL.cpp:187).

For a YUV occurrence reaching `TileCacheInstance::update_prim_dependencies`:

| Stage | Exact condition/outcome |
| --- | --- |
| Request | Without `PREFER_COMPOSITOR_SURFACE`, retain default `Ok(Blit)`; no eligibility or setup call. This is not a reported rejection. |
| Stability | With the request, an enabled Color8 stability delay can reject as `YuvImageNotStable`. **The release binding enables it only for Windows (`cfg!(target_os = "windows")`), so it is false on this Linux build.** It is not a Pi preference to switch off. |
| Overlay attempt | Reject if on the last available subslice (`OverlaySurfaceLimit`), or a complex mask is needed (`OverlayNeedsMask`). The narrow rounded-clip exception applies to `Layer`, not `Draw`. |
| Common eligibility | Both kinds require the root tile cache (`NotRootTileCache`) and a 2D scale/translation (`ComplexTransform`). Overlay also rejects an atomic slice (`SliceAtomic`), except the explicit non-Color8 override. |
| Underlay attempt | Only attempted if Overlay did not succeed. For ordinary 8-bit masked content, require opaque backdrop coverage and no prior masked underlay conflict (`UnderlayAlphaBackdrop`, `UnderlaySurfaceLimit`). Reject overlay intersection (`UnderlayIntersectsOverlay`) and active low-quality pinch zoom (`UnderlayLowQualityZoom`). HDR has existing, specific exceptions; do not generalize them to SDR. |
| Setup | Only after accepted eligibility. A mapped surface dimension >=8192 rejects as `SizeTooLarge`. Unmapped, empty or offscreen cases return success without a descriptor; distinguish these from publication. |
| Publication | Setup explicitly supports `Draw` and `Layer` with no native surface allocation. It publishes an external descriptor into overlays/underlays. `Native` has the separate allocation/cache/attachment path. |
| Initial result | `Ok(Overlay)` returns `DrawState::Culled`, avoiding that content-tile draw. `Underlay` later prepares a cutout. An error becomes `Blit`. |
| Final underlay result | `post_update` cancels 8-bit YUV underlays intersecting deferred backdrop-filter or mix-blend work: changes the draw kind to `Blit`, invalidates tiles and removes descriptors. Initial acceptance alone is insufficient. |

Sources: [eligibility](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/tile_cache/mod.rs:1470),
[YUV decision](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/tile_cache/mod.rs:2435),
[Windows-only stability](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/webrender_bindings/src/bindings.rs:2271),
[setup](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/tile_cache/mod.rs:1753),
[descriptor publication](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/tile_cache/mod.rs:2005),
[cancellation](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/tile_cache/mod.rs:3030).

The subslice budget is derived from requested RGB/YUV surfaces, capped at four
plus the base slice. Increasing it is not a general fix: Overlay failure can
still become a successful Underlay, and the live budget is unknown. Cage protocol
versions, DRM plane count, H.264 codec identity, and DMA-BUF feedback are not
direct tests in this eligibility function. They can affect upstream backing or
native presentation; do not conflate those with Draw promotion.
[Budget](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/tile_cache/mod.rs:879).

## What the GPU Actually Draws

- Published Overlay/retained Underlay: `Renderer::draw_tile_list` selects
  `BatchTextures::composite_yuv` and `CompositeSurfaceFormat::Yuv`, sampling the
  YUV planes in final Draw composition. It still performs GPU work; promotion
  does not eliminate earlier uploads/imports or prove this work is cheap.
- Blit: `prepare.rs` constructs `YuvPattern` and calls `quad::prepare_quad`.
  `ps_quad_yuv.glsl::pattern_fragment` calls `sample_yuv`. That shader performs
  texture sampling and color conversion. CPU-side `YuvPattern::build` prepares
  constants, not a frame-sized pixel loop. Changed image generations invalidate
  dependent picture tiles; an intermediate GPU render plus RGB composite is
  possible, not a mandatory CPU conversion into one source-sized tile.
- These statements assume hardware WR. SWGL is a separate renderer selection;
  preserve the actual software/hardware state and GL renderer for each run.

[Final Draw YUV](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/renderer/composite.rs:330),
[fallback preparation](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/prepare.rs:641),
[GPU shader](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/res/ps_quad_yuv.glsl:93).

Separate source-sized CPU copies, raw-plane uploads, RGB fallback and DMA-BUF GL
copies are enumerated in the [preceding report](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/docs/umbrafox/archive/reports/2026-10-18-source-sized-video-cost.md).
None is selected merely because the native compositor is blocklisted.

## Cheaper Observation Before a Rendering Patch

The ledger's parent-only profiler result is not yet evidence that this build
cannot profile children. Check the existing collector before another capture:

1. `getProfileData()` calls local `profiler_get_profile()`. The synchronous
   `dumpProfileToFile()` explicitly omits currently live child profiles.
2. `getProfileDataAsync()` calls `StartGathering()`, which calls
   `ProfilerParent::GatherProfiles()`, sends `GatherProfile` to tracked children,
   and appends results to the JSON `processes` array. The file equivalent is
   `dumpProfileToFileAsync(outputPath)`.
3. Await `StartProfiler()` before the observation. Check supported features and
   the effective configuration, including native stacks and thread filters for
   content `GeckoMain`, parent Renderer/Compositor/WRRenderBackend and RDD media
   threads. Do not assume a preset or parent thread table proves coverage.
4. Gather asynchronously **before stopping**; await completion before the
   Marionette async callback returns. Then stop the profiler. Inspect nested
   process data and the gathering log, not only top-level `threads`.
5. If the collector already does this, inspect child gather timeouts/errors,
   filters and missing PIDs. Do not repeat an identical capture. Unsymbolicated
   data requires exact-build symbols/module offsets; it is not a missing-child
   explanation.

This is a concrete collector distinction, not a claim that the current
`prof.mjs` uses the wrong API: that Pi-local script has not been supplied here.
Use a short bounded observation separate from performance A/B, without readbacks
or screenshots. A named converter/copy/upload/wait stack is the next discriminator.

[API contract](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/tools/profiler/gecko/nsIProfiler.idl:74),
[sync versus async implementation](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/tools/profiler/gecko/nsProfiler.cpp:376),
[gathering](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/tools/profiler/gecko/nsProfiler.cpp:1174),
[child requests](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/tools/profiler/gecko/ProfilerParent.cpp:770).
Mozilla also documents the cross-process gathering protocol and child-response
timeouts in its [profiler code overview](https://firefox-source-docs.mozilla.org/tools/profiler/code-overview.html).

## Ranked Conditional Changes and Falsifiers

| Evidence first | Smallest plausible change | Risk / falsifier |
| --- | --- | --- |
| A known eligible external YUV loses `PREFER` upstream | Repair that specific forwarding path, not force all primitives | Medium lifetime/rendering integration risk. Falsified if request already present or restoring it does not change the finalized path. |
| Both attempts fail solely from an avoidable scene/effect wrapper or false mask/transform classification | Correct that wrapper/classification, preserving pixel equivalence | Medium to high. Need opacity, rounded masks, clipping, HDR, transforms, blend and cancellation tests. Blind `NotRootTileCache`/mask bypass is unsafe. |
| Proven Overlay budget pressure, no usable Underlay | Improve allocation/reservation for that case | Medium; extra surfaces raise memory and composite work. Falsified if no pressure or final path/cadence unchanged. |
| Positive hot CPU copy/RGB fallback or raw-plane upload | Fix/reuse the exact producer allocation or texture forwarding path | Medium to high synchronization/ownership risk. Promotion is not the fix if that work still precedes it. |
| Tested occurrence already has a published, finalized direct Draw path while slow | Do not patch promotion; investigate the measured renderer/driver/upload/wait | This directly falsifies failed-promotion as the necessary cause. Aggregate HUD counts cannot establish this per-video fact. |

If branch identity remains necessary after the collector check, the paused census
design is still appropriate, with real export and finalization/loss accounting.
WR-occurrence records alone do not identify the HTML video without producer
binding. An observed Blit identifies a candidate extra pass, not its timing or
causal contribution. A matched change must both remove the identified operation
and improve cadence while preserving pixels before being called a fix.

## Ledger Corrections Needed

- Keep the measured source-size contrast. Remove the assertion that it proves a
  CPU YUV tile converter or a measured 37-ms stage. Submission interval and
  process CPU quotients do not time a function.
- A 3840x2160 CSS box in a 1920x1080 viewport can be clipped to the same visible
  framebuffer area. F11 does not establish four times the fragment workload.
  Earlier physical-output sensitivity and CSS-size insensitivity can coexist.
- Hidden `mozPresentedFrames` does not prove unchanged uploads or real display
  presentation. It is rendering-pipeline accounting, not KMS scanout.
- 142% aggregate CPU below 400% capacity does not rule out a serial critical path,
  waits, or GPU work. Nor does content CPU identify WR raster work in the parent.
- No response to DMA-BUF force preferences does not prove the selected texture
  backing or eliminate all copies. Preserve effective route/backing evidence.
- Parent-only profile collection is an observed result, not yet a build limit.

## Verification and Delivery

Searchfox discovery followed by retained-release reads; 18 relevant source,
shader and profiler files byte-compared successfully against the stated Git
base. No runtime claim or root cause is certified. Searchfox CLI reports an
available update (installed 0.18.0, advertised 0.20.5); no tooling was upgraded.

Websocket ACK/checkpoint delivery failed because the supplied selector has no
loaded matching l8ros thread. This report is retained for direct handoff; no
alternate recipient was guessed and no Pi activity was performed.
