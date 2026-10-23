# Source-Sized Video Cost: Draw Is Not CPU Rasterization

Read-only answer to l8ros, October 18, 2026. Source baseline
`c0e7f8a2be0460695c1f65ae8796b09c1082480c`, associated with release
160.0a1 / 20261014135715. No Pi access, browser invocation, compiler, package,
pref change, diagnostic reopening, or source modification.

## Conclusions

1. **A failed YUV promotion does not select a CPU YUV converter.** In hardware
   WebRender it selects a GPU YUV quad in the picture/content target. Animated
   image generations invalidate dependent tiles, which can add an intermediate
   GPU render and subsequent RGB composite. This is not CPU pixel rasterization.
2. **Direct YUV-plane sampling in the final Draw composite already exists.** It
   does not require `FEATURE_WEBRENDER_COMPOSITOR`, GTK native layers, DRM planes,
   or force-enabling the blocklisted native compositor. Eligibility and actual
   publication/finalization of the specific occurrence still have to be established.
3. **No necessary CPU pass has been identified for an already-importable DMA-BUF
   YUV image.** Separate CPU copy/upload/readback paths exist. The smallest safe
   change depends on which one is actually hot; do not rewrite promotion guards
   to fix an unlocated CPU cost.

## Exact Draw Paths

`AsyncImagePipelineManager::UpdateImageKeys` tests whether the texture has a
`WebRenderTextureHost`, not whether the native compositor is enabled.
`ApplyAsyncImageForPipeline` adds `PREFER_COMPOSITOR_SURFACE` for that external
image. `DMABUFTextureHostOGL::PushDisplayItems` emits NV12/planar/P010 YUV items;
the separate `supportsDirectComposition` flag is not the preference flag.
[External-image selection](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/layers/wr/AsyncImagePipelineManager.cpp:249),
[preference producer](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/layers/wr/AsyncImagePipelineManager.cpp:489),
[DMA-BUF display items](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/layers/opengl/DMABUFTextureHostOGL.cpp:187).

- **Promoted overlay:** the YUV decision builds an external descriptor and returns
  `DrawState::Culled` from content-tile construction. That does not discard the
  video: `Renderer::draw_tile_list` binds its YUV planes and selects the YUV
  composite shader. `setup_compositor_surfaces_impl` explicitly accepts
  `CompositorKind::Draw`, with no native surface allocation.
- **Retained underlay:** content preparation uses `Cutout`; the external surface
  carries the video. `post_update` can cancel an 8-bit underlay for intersecting
  backdrop-filter/mix-blend work and change it back to `Blit`.
- **Fallback/no request:** `prepare.rs` builds `YuvPattern` and calls
  `quad::prepare_quad`. `ps_quad_yuv.glsl::pattern_fragment` calls `sample_yuv`,
  whose texture fetches and color-matrix multiply execute in the fragment shader.
  `YuvPattern::build` computes matrix constants on the CPU, not a frame-sized
  conversion loop. Per-image dependencies cause invalidation on changed frames;
  this does not mean every source pixel is processed by the CPU every refresh.

Sources: [YUV decision](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/tile_cache/mod.rs:2435),
[Draw accepted explicitly](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/tile_cache/mod.rs:1914),
[underlay cancellation](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/tile_cache/mod.rs:3049),
[fallback preparation](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/prepare.rs:641),
[CPU constant setup](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/pattern/yuv.rs:154),
[quad fragment shader](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/res/ps_quad_yuv.glsl:93),
[YUV sample/conversion](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/res/yuv.glsl:187),
[final Draw YUV binding](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/renderer/composite.rs:330).

These shader statements assume hardware WebRender. `UseSoftwareWebRender()` is a
separate early compositor-selection branch; a native-compositor blocklist alone
does not establish hardware rendering. Preserve the effective software/hardware
state and GL renderer from the actual measured run.
[Compositor selection](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/webrender_bindings/RenderCompositor.cpp:199).

## Where Source-Sized Work Actually Exists

| Branch | Actual operation and frequency | Discriminator |
| --- | --- | --- |
| Already-backed DMA-BUF image | `DMABUFSurfaceImage::GetTextureClient` wraps its surface; `RenderDMABUFTextureHost::Lock` creates missing GL textures, waits on a semaphore and returns texture handles. No unconditional CPU RGB conversion. Imports are conditional on absent handles, not mandatory each composite. | Host/image type and positive stacks at import/wait. |
| Plain planar image without an existing texture client | `ImageClient::CreateTextureClientForImage` calls `UpdateYCbCrTextureClient`; `MappedYCbCrChannelData::CopyInto` performs whole-plane, row, or sample copies. Existing image serials/texture clients are reused. | `ImageClientSingle::UpdateImage` slow path plus copy callers. |
| External CPU buffer rather than native texture | `RenderBufferTextureHost::Lock` exposes raw Y/U/V data. `upload_to_texture_cache` locks `ExternalImageSource::RawData` and uploads the changed plane regions. Promotion can still occur afterward; promotion does not eliminate this producer upload. | Renderer upload/staging/driver stacks and actual buffer-vs-native backing. |
| Non-external async texture fallback | `UpdateWithoutExternalImage` calls `GetAsSurface`, then copies RGB bytes into WR. It is selected by missing WR texture wrapper, not native-compositor blocklisting. | Positive `UpdateWithoutExternalImage` caller stack. |
| Explicit RGB-only surface request/readback | `PlanarYCbCrImage::BuildSurfaceDescriptorBuffer` can call `ConvertYCbCrToRGB` under `BuildSdbFlags::RgbOnly`. DMA-BUF/canvas readback has a different GPU/readback chain. | Converter/readback caller, especially canvas, screenshots, or remote readback. |
| Software decode uploaded into DMA-BUF | `FFmpegVideoDecoder::CreateImage` may call the video-frame pool, then `DMABufSurfaceYUV::UpdateYUVData(PlanarYCbCrData)` copies planes into SHM and uploads/blits. The enabling gate requires compositor type `WAYLAND`, not merely `windowProtocol=wayland`; do not assume it runs in Draw. | `UploadSWDecodeToDMABuf` effective result and decoder-side stacks. |
| DMA-BUF pool/binding fallback | `CopyYUVDataImpl` uses GL texture blits; `CreateTextureViaCopyYUV/P010` uses `CopyImageSubData` after failed direct binding. These are GL copy commands, not source-proven CPU YUV conversion loops. Driver CPU work/waits still require measurement. | Positive copy/import stacks or correctly functioning path-specific logs. |

References: [DMA-BUF client](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/layers/DMABUFSurfaceImage.cpp:74),
[DMA-BUF lock](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/webrender_bindings/RenderDMABUFTextureHost.cpp:23),
[image slow path](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/layers/client/ImageClient.cpp:198),
[plane copies](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/layers/client/TextureClient.cpp:1923),
[raw plane lock](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/webrender_bindings/RenderBufferTextureHost.cpp:80),
[WR upload](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/renderer/upload.rs:95),
[RGB async fallback](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/layers/wr/AsyncImagePipelineManager.cpp:330),
[RGB-only conversion](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/layers/ImageContainer.cpp:820),
[software-upload gate](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/dom/media/platforms/ffmpeg/FFmpegVideoDecoder.cpp:952),
[decoder image creation](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/dom/media/platforms/ffmpeg/FFmpegVideoDecoder.cpp:2048),
[software plane staging](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/widget/gtk/DMABufSurface.cpp:2057),
[pool GL copy](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/widget/gtk/DMABufSurface.cpp:1928),
[binding GL copy](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/widget/gtk/DMABufSurface.cpp:2341).

## Interpret the New Measurements Narrowly

The reported source-area contrast supports source-size-dependent work and weakens
a destination-area-only fragment-cost explanation, assuming codec/pixel format,
actual backing, visibility, refresh, and measurement procedure are matched.
It does not uniquely prove CPU conversion, nor rule out uploads, driver work,
memory traffic, synchronization or source-sized intermediate targets. The
hardware-decoding-off result does not itself identify the resulting image backing.

61.2% of one core is 612 CPU-ms/s: 10.2 ms per decoded frame at 60 fps, or
22.1 ms per submitted frame at 27.7 fps. At 720p, 28% is 4.67 ms per decoded
frame, or about 4.75 ms per submitted frame. Neither normalization assigns time
to a function. Calling the 22.1 ms quotient a measured per-source-frame pass
mixes denominators and includes unrelated work in that content process.

`mozPresentedFrames` is not hardware presentation. `FrameStatistics` defines it
as frames sent to the rendering pipeline. `VideoSink::UpdateRenderedVideoFrames`
derives increments from sent frames minus reported drops. Hidden-video success
therefore does not prove the same texture requests/uploads happened, or prove
that those uploads are cheap: visibility can remove downstream demand.
[Counter definition](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/dom/media/FrameStatistics.h:104),
[accounting producer](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/dom/media/mediasink/VideoSink.cpp:543).

## Cheapest Next Observation

Before building a census, l8ros can collect **one short native-stack profile per
source size**, after settling, with the same visible selected local-video page.
Suggested observation budget: 10-15 seconds each, 5-ms sampling, fixed bounded
buffer, no screenshots, allocation tracing, HUD, verbose logs, frame callbacks,
canvas copies, or periodic pixel readback. Keep these observation runs separate
from clean performance A/B windows. Inspect the harness for screenshot/readback
or per-frame JS work before measuring.

Use the release profiler's supported native-stack/CPU-sampling options, checking
`GetFeatures()` and `activeConfiguration`, and verify collected threads cover
the hot content PID plus parent Renderer/Compositor, RDD decoder and any active
GPU process. An existing Firefox Platform preset is a starting point, not proof
of thread coverage. No guessed `counters` feature or WR-HUD export is required.
Symbolicate against the exact build; if stacks remain unresolved, retain module
and offset evidence instead of assigning function names.
[Gecko native-stack profiling](https://firefox-source-docs.mozilla.org/tools/profiler/index.html).

Inspect inclusive stacks, not only `memcpy` leaves:

- `ConvertYCbCrToRGB`, libyuv, `CopyYCbCrPlane`, `MappedYCbCrChannelData::CopyInto`:
  locate the CPU converter/copy and its actual caller.
- `UpdateWithoutExternalImage`, `GetAsSourceSurface`, remote Readback or canvas:
  identify an unexpected RGB/readback route or measurement-induced work.
- `upload_to_texture_cache`, texture uploader and Mesa upload/staging:
  investigate changed-buffer traffic, not promotion eligibility alone.
- Import/semaphore/driver waits versus on-CPU samples: distinguish blocking from
  a CPU conversion. Parent Renderer work must not be charged to content by guess.
- Layout/JS/style work in the hot content PID: investigate that caller instead
  of assuming it is WebRender pixel processing.

An appreciable, source-size-scaling stack at a named copy is positive evidence.
A short capture with no such sample is not proof of absence. If only opaque
driver stacks remain, a separately authorized targeted observation is next;
the promotion census is useful only for its separate branch/occurrence question.

## Conditional Smallest Changes

1. **Unexpected RGB fallback on a known DMA-BUF:** preserve/fix the existing
   descriptor/texture-client forwarding path. Medium integration risk: ownership,
   IPC lifetime, fences, format/modifier handling, crop and color parity. Falsifier:
   fallback absent or its removal leaves CPU/cadence unchanged.
2. **Repeated planar copy or staging allocation:** optimize the proven hot copy,
   reuse an eligible retained buffer, or decode into the already-supported shared
   allocation path. Do not remove synchronization or lifetime ownership. A copy
   with no samples/meaningful cost is not a reason to patch it.
3. **Proven extra WR tile pass:** address the particular rejected eligibility or
   scene/effect shape while preserving masks, blend, opacity, HDR and final
   underlay cancellation. This saves a possible GPU pass, not a demonstrated CPU
   pass. Existing direct Draw composition is the baseline; native force-enable
   and blanket guard bypass are not proposed.

For an already-backed, directly importable DMA-BUF reaching hardware WR, there
is no source-proven full-frame CPU conversion to remove. No performance patch or
universal pref change is justified by these measurements alone.

## Verification

Searchfox discovery followed by direct retained-release reads. All 21 source and
shader files used above were byte-compared successfully against the named Git
base, not assumed equal to the current working checkout. No runtime tests were
run, and no measured branch, performance win or root cause is claimed.
Searchfox CLI reports an available update (0.18.0 installed, 0.20.5 advertised);
tool installation was outside this read-only task.

The websocket ACK could not be delivered: the supplied destination had no loaded
matching thread; the endpoint's thread list confirmed no l8ros thread. Findings
are retained here and returned directly, rather than sent to a guessed recipient.
