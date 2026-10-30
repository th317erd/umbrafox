# V4L2 DMA-BUF Import Does Not Require Native Composition

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Read-only response to l8ros's October 18, 20:25 update. Retained release base
`c0e7f8a2be0460695c1f65ae8796b09c1082480c`, 160.0a1 / 20261014135715.
Ten source/configuration files matched the base byte-for-byte. No Pi access,
source edits, preference changes, build, package, or browser execution.

## Answer

**Yes: the existing hardware WebRender Draw path imports DMA-BUF video as
external GL textures. It does not always copy, and it does not require native
compositor enablement or a Wayland video subsurface.** Import and WR promotion
are independent decisions: even tile fallback can sample an imported texture.

The pinned chain is:

1. `ChooseV4L2PixelFormat` accepts `AV_PIX_FMT_DRM_PRIME`.
2. `CreateImageV4L2` consumes `AVDRMFrameDescriptor` from `AVFrame::data[0]`,
   obtains a `VideoFrameSurface`, and calls `VideoData::CreateFromImage`.
3. `VideoFrameSurface::GetAsImage` returns `DMABUFSurfaceImage`, whose
   `GetTextureClient` wraps the surface in `DMABUFTextureData`.
4. `DMABUFTextureHostOGL` receives `SurfaceDescriptorDMABuf`, creates a
   `RenderDMABUFTextureHost`, and registers the planes as WR
   `TextureHandle(Texture2D)` external images, not CPU `RawData`.
5. `RenderDMABUFTextureHost::Lock` calls `CreateTextures` only when missing,
   waits for the relevant semaphore, and returns a native GL texture handle.
6. `DMABufSurfaceYUV::CreateTexture` uses `eglCreateImage` with
   `EGL_LINUX_DMA_BUF_EXT`, then `glEGLImageTargetTexture2DOES`.

[V4L2 format](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/dom/media/platforms/ffmpeg/FFmpegVideoDecoder.cpp:235),
[V4L2 output](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/dom/media/platforms/ffmpeg/FFmpegVideoDecoder.cpp:2477),
[image producer](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/dom/media/platforms/ffmpeg/FFmpegVideoFramePool.cpp:39),
[texture client](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/layers/DMABUFSurfaceImage.cpp:74),
[WR registration](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/layers/opengl/DMABUFTextureHostOGL.cpp:86),
[texture lock](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/webrender_bindings/RenderDMABUFTextureHost.cpp:23),
[EGL import](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/widget/gtk/DMABufSurface.cpp:2232).

## Requirements and Separate Copies

The hardware decoder must remain active and deliver a supported DRM descriptor,
with valid FD ownership, plane offsets/strides, dimensions, format and modifiers.
Renderer-side `UseDmaBufGL` requires hardware GL, `OES_EGL_image` and
`EXT_image_dma_buf_import`. Each plane's layout must actually import and bind;
an extension string alone is insufficient. Modifier support and compatible
plane formats matter, including NV12 chroma RG/GR handling. Native Wayland
scanout capability and Cage accepting a video subsurface are not required for
browser-side EGL sampling.
[GL requirements](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/widget/gtk/DMABufSurface.cpp:264).

Two independent copy decisions exist:

- **Decoder pool:** `ShouldCopySurfaceLocked` copies when
  `HwDecodedVideoZeroCopy` is false, or fewer than one quarter of the estimated
  decoder buffers are free. V4L2 estimates a pool of 20. The descriptor overload
  can request a GL texture copy, falling back to no-copy if copying fails. It
  returns a DMA-BUF image in either case; pool copying is not evidence of a CPU
  YUV conversion.
- **Renderer binding:** after successful EGLImage creation, direct Texture2D
  binding may fail. For linear NV12/P010/P016, the local implementation can use
  an external-texture source plus `CopyImageSubData` into a Texture2D. This is
  separate from decoder-pool copying and WR promotion.

[Pool decision](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/dom/media/platforms/ffmpeg/FFmpegVideoFramePool.cpp:262),
[V4L2 pool consumer](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/dom/media/platforms/ffmpeg/FFmpegVideoFramePool.cpp:630),
[GL pool copy](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/widget/gtk/DMABufSurface.cpp:1928),
[binding/copy branch](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/widget/gtk/DMABufSurface.cpp:2341).

## First Checks on the Pi

1. **Read the actual pool feature and preference before changing anything.**
   `media.ffmpeg.vaapi.force-surface-zero-copy` also controls the V4L2 pool:
   integer `0` disables, `1` force-enables, `2` is automatic/default. It is
   startup-only. The GTK initializer sets `HW_DECODED_VIDEO_ZERO_COPY` and
   `gfxVars::HwDecodedVideoZeroCopy`; its source allowlist broadly permits Linux,
   with a specific old-AMD/Mesa exception. Do not presume V3D is disabled. If
   already enabled, forcing `1` adds no new intervention. If disabled, a
   disposable-profile restarted `0` versus `1` comparison can test policy-driven
   pool copying, but `1` still permits pool-pressure copies and does not fix EGL
   binding fallback. Do not ship it as a proven performance fix.
2. **Prove continuing decoder output and the next boundary.** A bounded,
   observation-only run can use browser-launch environment
   `MOZ_LOG=FFmpegVideo:5,Dmabuf:5,timestamp,sync`, captured from startup in all
   relevant processes. Require repeated `V4L2 Got one frame output`, not only
   `V4L2 FFmpeg init successful` or `/dev/video10` open. This source returns a
   decode error on failed V4L2 output and permits restart without hardware.
3. **Follow the surface UID and process.** Look for
   `DMABufSurfaceYUV::UpdateYUVData() ... copy 0/1`, renderer-side
   `DMABufSurfaceYUV::ImportSurfaceDescriptor()`, plane attributes, and
   `zero-copy EGLImageTargetTexture2D succeeded` versus
   `successfully created texture via copy` or explicit import/binding errors.
   Producer-side verification can create textures too, so an RDD success alone
   does not prove the parent/renderer binding succeeded. Do not interpret empty
   logs as absence; if this repeats the earlier empty result, retain ambiguity
   and inspect capture/actual output rather than running identical retries.
4. **Separate observation from timing.** Compare settled, visible, matched
   sessions with logs off for performance. A pool-policy toggle tests only that
   decision; no FPS change does not disprove every possible copy. A positive
   renderer import does not prove the driver performed no internal work.

[Preference declaration](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/modules/libpref/init/StaticPrefList.yaml:13021),
[feature initialization](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/thebes/gfxPlatformGtk.cpp:232),
[allowlist](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/widget/gtk/GfxInfo.cpp:1321),
[output failure handling](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/dom/media/platforms/ffmpeg/FFmpegVideoDecoder.cpp:1740),
[FFmpeg log module](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/dom/media/platforms/ffmpeg/FFmpegLog.h:11).

## FD Evidence and Interpretation

No `/dev/dma_heap` open is not a blocker: this path imports decoder-exported
DMA-BUF FDs; it need not allocate through the DMA-heap character device.
In general, EGL retains a buffer reference independently of the caller's FD.
[EGL ownership specification](https://registry.khronos.org/EGL/extensions/EXT/EGL_EXT_image_dma_buf_import.txt).

However, do not use that generic lifetime rule to dismiss the concrete result:
this pinned `DMABUFTextureHostOGL`/`DMABufSurfaceYUV` path retains descriptor FD
wrappers and does not routinely close all of them immediately after binding.
Repeated, permission-complete zero-FD observations in the actual renderer during
active V4L2 output would be an important discrepancy. Check process identity,
FD inspection method, active output/fallback and IPC representation before
concluding that all Draw frames must be copied. No such complete trace is
available here yet.
[retained FD wrappers](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/widget/gtk/DMABufSurface.cpp:2154).

The source-size contrast remains useful but does not establish a 22-ms function
or exclude all GPU work. A CSS box larger than the viewport need not increase
visible fragments; hardware-decode improvement in CPU with unchanged submission
rate isolates that intervention, not the downstream bottleneck by itself.

## Change Recommendation

Do not bypass WR or add a Wayland subsurface merely to obtain DMA-BUF sampling;
the required import route already exists. Locate a broken descriptor handoff,
forced pool copy, or failed plane binding first. Fixing that specific boundary
is narrower than a new presentation path, though lifetime/fence/format/color
correctness still requires tests. A subsurface route additionally needs working
native-layer synchronization, clipping/stacking and compositor policy, and is
not guaranteed DRM overlay scanout. No source modification is proposed as a
confirmed fix yet.

The supplied websocket selector again had no loaded matching l8ros thread;
handoff is retained here for direct delivery. No alternate recipient guessed.
