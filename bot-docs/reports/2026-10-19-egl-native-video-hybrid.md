# EGL Content and Native Video: Feasibility Review

Read-only response to l8ros's October 19 hybrid request. No browser source,
compiler, package, deployment or Pi actions. Twenty-two inspected source files
byte-match release base `c0e7f8a2be0460695c1f65ae8796b09c1082480c`.
The reported hardware measurements are supplied evidence, not independently rerun.

Inputs: [ledger sections 28-36](/home/public/wyatt-desktop/Projects/l8ros-workspace/l8ros/bot-docs/reports/pi-video-investigation-ledger.md:934)
SHA256 `a578829d5f937a54fcd4653958527aac12151ea51da4a5f74f90872ba336b4db`;
[direct-scanout plan](/home/public/wyatt-desktop/Projects/l8ros-workspace/l8ros/bot-docs/plans/video-direct-scanout-plan.md)
SHA256 `4d385feda4b21ec799640c1fcc693204f12886f1e12489cab4a05ed09102f66a`.
The experimental EGL override diff was not supplied or reviewed.

## Answers

1. **No existing Draw-plus-native-sidecar configuration or pref is present in
   this source.** But WR already has a mixed *layer interface*: `LayerCompositor`
   distinguishes content swapchains from externally attached images. Its current
   Wayland backend renders content through `NativeLayerWaylandRender`, explaining
   why using it reaches the regular-layer path in the measurement.
2. **No promotion-guard change is needed to reach an appropriate new Layer
   backend.** Reuse the existing `CompositorConfig::Layer` / `WrLayerCompositor`
   path and implement EGL-backed content presentation alongside native external
   layers. That is a backend/lifecycle change, not an existing operational mode.
   Making Draw emit native create operations alone is incorrect.
3. **Risk: material, cross-language compositor work, not a one-method fix.**
   Layer ordering, content swapchains, callbacks, synchronization, damage,
   snapshots and failure recovery must remain coherent. Whether EGL-backed
   content preserves the measured page cadence is an untested hypothesis.

## Why the EGL Override Had No Calls

- `WebRenderAPI` passes `ShouldUseNativeCompositor()` and
  `ShouldUseLayerCompositor()` to `wr_window_new`. The latter constructs exactly
  one of Draw, Layer or Native. The C++ `CompositorType()` enum alone is not this
  Rust-mode selector.
  [API producer](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/webrender_bindings/WebRenderAPI.cpp:295),
  [mode selection](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/webrender_bindings/src/bindings.rs:2218).
- Tile-cache setup assigns no native surface ID for Draw **or Layer**. Only
  Native queues `create_compositor_external_surface`. Renderer native-update
  processing drains that queue only in Native; Draw/Layer assert it is empty.
  Bypassing just the producer gate would violate the consumer contract.
  [setup](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/tile_cache/mod.rs:1914),
  [queue consumer](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/renderer/mod.rs:3959).
- The separate Layer path classifies an eligible external tile as
  `CompositorSurfaceUsage::External`. Draw classifies it as Content even if
  promotion succeeded. Thus zero native-create calls does not mean failed YUV
  promotion. Layer's `WrLayerCompositor::begin_frame` creates external surfaces
  directly through FFI; content gets `create_swapchain_surface`. On tree reuse it
  still attaches the new external image.
  [classification](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/renderer/composite.rs:783),
  [Layer adapter](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/webrender_bindings/src/bindings.rs:1768).
- `SupportsExternalBufferTextures` specifically describes external images mapped
  to `RenderBufferTextureHost`; it is not a native-composition enable switch.
  The DMA-BUF display-item producer obtains its direct-composition support from
  the advertised format, separately.
  [capability definition](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/webrender_bindings/RenderCompositor.h:106),
  [DMA-BUF producer](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/layers/opengl/DMABUFTextureHostOGL.cpp:189).

## Smallest Credible Integration Direction

Keep WR's existing eligibility, post-update cancellation, external-ID, clipping
and screenshot rules. Use the Layer interface as the decomposition boundary:

1. Introduce an explicitly selected experimental backend with the complete Layer
   contract: create/resize/bind/present content swapchains; create/attach/destroy
   external surfaces; ordered AddSurface; begin/end and teardown. A bare
   `ShouldUseLayerCompositor=true` leaves essential methods unimplemented.
2. Prototype an **EGL-backed content surface** instead of the current
   `NativeLayerWaylandRender` framebuffer pool. Retain native external-image
   attachment. This aims to avoid that pool's synchronous commit fence path,
   not GPU rendering itself. Preserve GL target orientation, alpha, damage,
   buffer-age semantics and swap interval. This is not achieved by calling
   eglSwapBuffers on the current native-layer FBO.
3. Give EGL and the native tree one coherent surface/commit owner. Either use
   separately owned EGL content subsurfaces in the ordered tree, or design an
   explicit EGL-parent coexistence contract. Do not simply initialize the
   existing native root beside the existing EGL owner and assume compatibility.
4. Preserve all content/external interleavings. WR can request
   Content / External / Content. One base EGL framebuffer cannot occupy both
   sides of a video in stacking order. A restricted first prototype must prove
   its supported layer shape and fall back *before* omitting unsupported content;
   fullscreen alone does not prove the shape. Supporting general pages needs
   multiple ordered content surfaces or equivalent correct composition.
5. Retain fallback and screenshot behavior. `begin_frame` returning false means
   no forced full redraw, **not** rejection of the frame. A restricted backend
   needs an explicit preflight/fallback contract, not reinterpretation of that
   boolean or silent no-op virtual methods.

The existing native backend's
[CreateSwapChainSurface](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/webrender_bindings/RenderCompositorLayerNative.cpp:304),
[Bind/PresentSwapChain](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/webrender_bindings/RenderCompositorLayerNative.cpp:524),
and [CompositorEndFrame](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/webrender_bindings/RenderCompositorLayerNative.cpp:256)
are the concrete replacement/extension boundaries. WR already skips drawing
external layers, draws content through bind/present, then submits their order.
[WR consumer](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/renderer/composite.rs:1330).

If retaining literal `CompositorConfig::Draw` is mandatory, that is a larger WR
change: add an external-output contract, split GPU Content from external layers,
preserve order and fallback, provide lifecycle/attachment/commit calls, and fix
damage when surfaces are promoted/demoted or moved. It is not a predicate edit in
`can_promote_to_surface` or a new native ID alone. Prefer reusing Layer first.

## Concrete Hazards

`GtkCompositorWidget::GetNativeLayerRoot()` lazily creates **and initializes** the
root. Init installs scaling, map/unmap, GDK-commit and frame-callback behavior;
SetLayers controls root commit readiness. CommitToScreen can attach a temporary
root buffer, and shutdown removes the attached root buffer. This is ownership,
not merely obtaining a child-layer factory. EGL also uses the widget's Wayland
surface through its `wl_egl_window`.
[widget accessor](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/widget/gtk/GtkCompositorWidget.cpp:146),
[root initialization](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/layers/NativeLayerWayland.cpp:181),
[root commit](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/layers/NativeLayerWayland.cpp:587),
[EGL window](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/widget/gtk/WaylandSurface.cpp:1192).

Subsurfaces are not automatically clipped to the parent's area. Their initial
synchronization and parent-applied position/stacking changes also mean independent
video updates and atomic geometry changes need an explicit policy. Standard
Wayland is sufficient; neither custom IPC nor website-visible JS is required.
[Wayland protocol](https://wayland.freedesktop.org/docs/html/apa.html#protocol-spec-wl_subsurface).

Do not remove `FenceWait` as a shortcut. Regular-layer NotifySurfaceReady sets a
producer fence, then CommitFrontBuffer waits before attach; `FenceWaitFd` uses a
client wait. The reported 19 ms locates a synchronization wait, not a fixed
intrinsic cost of every rendered buffer or proof of Cage doing another render.
The reported smooth production UI itself prevents generalizing that rule.
An asynchronous replacement needs actual producer/consumer synchronization and
buffer-release proof, not just faster counters.
[fence producer/consumer](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/layers/NativeLayerWayland.cpp:1416),
[wait implementation](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/widget/gtk/DMABufSurface.cpp:577).

## Verification Before Shipping

- Failing-first operation-order tests: unchanged tree with a new video buffer
  still attaches it; content/external/content preserves order; unsupported shape
  falls back without a missing layer; attach failure never publishes a hole.
- Lifecycle tests: resize, fractional scale, fullscreen transitions, pause/seek,
  hide/unmap, context loss, surface destruction, decoder buffer reuse and release.
  No early release, double swap, stale frame, background video leak or dropped
  producer fence. Bound small tests at 10 seconds and hardware windows separately.
- Keep compositor-surface reftests for underlay masks/z-order, backdrop-filter and
  mix-blend cancellation, rejected promotion, and transformed/rounded YUV. These
  existing tests do not alone exercise a new Wayland/EGL backend.
  [retained tests](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/wrench/reftests/compositor-surface/reftest.list).
- Hardware: the requested >=57 fps / <5% drops and >=470/480 page intervals below
  18 ms are necessary, not sufficient. Test video plus animated UI/controls
  together, as well as separately. Include 720p60 (the ledger reports 39.9 fps in
  native Layer), 1080p30, two videos, unsupported effects and fallback.
- Verify actual moving output and color/geometry outside timing windows. A PNG
  size is not a nonblank/moving-output proof. Default DOM screenshots can bypass
  the compositor, and Layer's screenshot request deliberately disables external
  composition. Do not use that capture to prove the external route remained on.
  [snapshot gate](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/renderer/composite.rs:752),
  [native snapshot handling](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/webrender_bindings/RenderCompositorLayerNative.cpp:116).
- External attachment is not a DRM-plane assignment proof. The Wayland protocol
  enables compositor offload and possible hardware overlays, not guaranteed
  scanout. Keep that claim separate from the measured browser throughput win.
  [protocol purpose](https://wayland.freedesktop.org/docs/html/apa.html#protocol-spec-wl_subcompositor).

This is a source-backed integration direction, not an implementation freeze or
performance guarantee. Defaults and web-visible rendering semantics must remain
Firefox-equivalent; experiment selection must be explicit and reversible.
No tests or actual hybrid run were performed. Supplied websocket selector has no
loaded l8ros thread, so the ACK could not be delivered; report retained here.
