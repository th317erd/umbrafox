# Release Composite: Decomposition and Bypass Feasibility

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

2026-10-17. Read-only analysis for `wr-render-fix`; runtime remains with l8ros.
Release base: `c0e7f8a2be0460695c1f65ae8796b09c1082480c`, BuildID
`20261014135715`. Linked local source files below are in the retained release
checkout, not the later diagnostic checkout. Overlay `4278e82f` is unchanged.

## Bottom Line

The source does **not** identify the four RGB draws, require a double draw of
the promoted video, or establish that one YUV quad costs 31 ms of GPU time.
There is a supported standard-Wayland route that can bypass WebRender's video
sampling. Whether Cage then uses a hardware plane is a separate question.

The supplied release ABBA establishes no practical codec-policy win in those
windows. It does not establish GPU saturation: the old diagnostic's 32.648 ms
composite measurement was inclusive wall time, with GPU queries disabled and
uncertified P1/P2 joins. Driver waiting, scheduling, pacing and instrumentation
remain alternatives. Treat the composite-cap explanation as a working
hypothesis, not an established GPU measurement.

## 1. What Is Drawn?

The Draw route is `Renderer::composite_simple` -> `composite_pass` ->
`draw_tile_list` -> `draw_instanced_batch`. The surface match distinguishes:

| Input | Final composite operation |
| --- | --- |
| `CompositeTileSurface::Color` | Dummy texture plus color modulation through RGBA shader. |
| `TextureCache` | Sample an already-rendered picture-cache tile. |
| External RGB | Sample an external RGB texture, optionally modulated/clipped. |
| External YUV | Bind the planes and convert YUV directly into the final target. |

See [Renderer::draw_tile_list](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/renderer/composite.rs:256).
Thus "4 RGB" does not mean four video copies, four fullscreen rectangles, four
DOM elements, or four UI layers. Texture/tile identity, source image, rectangle,
clip, opacity and z-order are missing. **UI chrome, an ambient canvas, cached
page content and solid colors are possibilities, not identified observations.**

Successful YUV overlay promotion returns `DrawState::Culled` from content-tile
construction; an underlay prepares a `Cutout`, not another YUV shade. Failed
promotion uses the ordinary YUV quad path. There is no mandatory
YUV-to-RGB-cache-to-RGB-output double pass for the promoted instance. A separate
canvas/effect consuming the same video is not excluded.
[YUV promotion](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/tile_cache/mod.rs:2532),
[prepare YuvImage](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/prepare.rs:641).

Final composition already performs front-to-back rectangular occlusion,
intersects valid/clip/dirty regions, and can split background rectangles around
opaque foregrounds. Alpha items are subsequently drawn back-to-front. Counts
alone cannot establish overdraw, nor prove that all four RGB instances are one
split tile. A 1920x1080 framebuffer is not proof of five fullscreen draws.
[composite_simple](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/renderer/composite.rs:598),
[FrontToBackBuilder::add and apply_occluder](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/rectangle_occlusion.rs:91).

## 2. Actual Shader and State Costs

| Cost | Pinned source behavior; reducibility |
| --- | --- |
| Plane sampling | Planar Y/U/V uses **three**, not two, texture-sample instructions; biplanar NV12/P010/NV16/P210 uses two; packed interleaved uses one. Each sampled coordinate is bounded. Texture instructions are not a count of memory transactions. |
| Color conversion | Bias subtraction and high-precision 3x3 matrix multiplication per fragment. Matrix/range setup is in the vertex shader. Removing conversion or reducing precision is not automatically pixel-equivalent. |
| Filtering | DMA-BUF GL texture setup uses linear min/mag filtering. Even 1:1 luma can require chroma reconstruction. Nearest filtering is not a safe blanket optimization. |
| Clip/mask | `NO_CLIP_MASK` selects `yuv_fast` with `FAST_PATH`: no rounded-box distance/derivative AA. The non-fast variant computes analytic clip coverage, not an extra clip-mask texture sample here. There is nothing to remove if the actual instance already uses the fast shader. |
| Blend/depth | Opaque list: blending off. Alpha list: premultiplied blending. Depth test/write off. Old one-opaque/four-alpha and one-YUV/four-RGB totals do not join material to blend state. |
| Output | No explicit shader dithering in this composite/YUV path; fixed-function dithering state is unverified. Partial present loads preserved color; full repaint clears; the pass stores output. Actual EGL format/modifier, MSAA and driver tile traffic remain unobserved. |

Sources: [sample_yuv](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/res/yuv.glsl:187),
[composite shader](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/res/composite.glsl:196),
[CompositorShaders::get_handle](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/renderer/shade.rs:1333),
[ActivateBindAndTexParameteri](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/webrender_bindings/RenderTextureHost.cpp:17),
[composite_pass](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/renderer/composite.rs:497).

The release base already contains the narrow `EXPERIMENTAL_NO_RECT_AA` external
RGB specialization. Re-proposing it as absent would be wrong. Also,
[RenderDMABUFTextureHost::Lock](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/webrender_bindings/RenderDMABUFTextureHost.cpp:23)
can import textures and wait on a semaphore. Neither those operations nor the
shader arithmetic identify the measured stall's location or duration. Eliminating
an unnecessary pass or transferring video to a display plane is potentially
larger leverage than shaving a few matrix operations; neither is demonstrated
necessary by the counters.

## 3. Native Surfaces Are Not Automatically DRM Planes

The standard path exists without custom IPC or website-visible JS:

1. A real decoded DMA-BUF image reaches `DMABUFTextureHostOGL::PushDisplayItems`.
   `SupportsDirectComposition` checks supported formats. The decoder library
   name alone does not establish that this buffer path is active.
   [Format eligibility](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/widget/gtk/DMABufFormats.cpp:525).
2. Feature/blocklist, Wayland, DMA-BUF, `wp_viewporter`, per-window eligibility
   and primitive-promotion checks must pass. Geometry, effects, clips and
   `ImageRendering::Auto` matter. Both compositor prefs default true on GTK in
   this base; effective configuration is not proven by defaults.
   [GTK gates](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/thebes/gfxPlatformGtk.cpp:290),
   [can_promote_to_surface](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/tile_cache/mod.rs:1470).
3. `RenderCompositor::Create` selects `RenderCompositorLayerNativeOGL` or
   `RenderCompositorNativeOGL`. GTK LayerNative is Rust **Layer**, not Draw and
   not Rust Native; it is not Windows-only. Both can attach external DMA-BUF
   video via `NativeLayerWaylandExternal`, bypassing WR's GL sampling.
   [Selection](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/webrender_bindings/RenderCompositor.cpp:243).
4. `DMABufSurfaceYUV::CreateWlBuffer` supplies plane FDs, strides, offsets,
   modifiers and FOURCC through linux-dmabuf; a standard Wayland subsurface is
   attached/committed. Color-protocol compatibility and synchronization still
   matter; universal zero-copy/color-correctness is not established.
   [External attachment](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/layers/NativeLayerWayland.cpp:1521),
   [CreateWlBuffer](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/widget/gtk/DMABufSurface.cpp:2571).

Current upstream Cage's `handle_output_frame` delegates to
`wlr_scene_output_commit`. The inspected upstream wlroots scene route attempts
single-buffer direct scanout with one remaining render-list entry, compatible
transform/color and successful output testing; otherwise it renders. Separate
wlroots DRM output-layer machinery is not proof that Cage assigns video to a
second plane. Installed versions/backend and actual plane assignments are
unknown. [Cage source](https://raw.githubusercontent.com/cage-kiosk/cage/master/output.c),
[wlroots scene source](https://gitlab.freedesktop.org/wlroots/wlroots/-/blob/master/types/scene/wlr_scene.c).

DRM must accept format/modifier, geometry, color and resource constraints.
Native video attachment may merely move YUV composition to Cage's GPU. Direct
scanout of an already-composited browser RGB buffer saves desktop composition,
**not** WR's video conversion. Only actual video-plane assignment demonstrates
the full bypass. [KMS validation](https://docs.kernel.org/gpu/drm-kms.html).

## 4. Ranked Hypotheses and Falsifiers

1. **First test: unnecessary site-effect work.** Confirm YouTube Ambient mode's
   state; if enabled, use the site's own ON/OFF/OFF/ON setting with gfx fixed.
   A Raspberry Pi 5 report describes excess fullscreen GPU load disappearing
   when Ambient mode is disabled. That is a useful lead, not our diagnosis or
   an identified RGB draw. [Bug 2023250 comment 13](https://bugzilla.mozilla.org/show_bug.cgi?id=2023250#c13).
   Same coded stream, output geometry, steady-state windows and no controls
   overlay; reject adaptive-quality/route changes. Verified OFF already, or no
   repeatable effect, weakens this lead. A win motivates tracing hidden
   canvas/effect work, not deleting four RGB draws or disabling site features.
2. **Highest potential bypass: native DMA-BUF video.** First establish the
   existing release's effective compositor, buffer type and failed eligibility
   gate. If already eligible, activation may require no new implementation;
   otherwise fix the specific gate only with pixel/color/sync parity. Draw or
   failed DMA-BUF promotion falsifies current reachability. Native attachment
   with unchanged performance weakens WR-video-sampling as the bottleneck;
   a claimed hardware-plane win additionally requires actual KMS assignment.
3. **Last: shader/state specialization.** Only after identifying a large,
   expensive non-fast draw. Preserve clipping, alpha, fractional geometry,
   chroma filtering and color precision. Confirmed fast YUV/opaque state
   falsifies the proposed mask/blend saving. Existing RGB no-rect-AA means
   another generic AA-removal patch has no demonstrated target.

If Ambient mode is already OFF, the cheapest localization test remains fixed
1080p60 coded input with large/small/small/large physical rendering area in the
same windowed mode, refresh and scale. A reversible gain supports an
area-dependent downstream cost, not uniquely WebRender; a null weakens that
hypothesis, not fixed synchronization costs. No gfx-pref change is required.

## Verification and Limits

Final link check verified all 17 local references and compared their 14 distinct
source files byte-for-byte against the pinned Git base; the native-route sidecar
checked matching release source separately.
Source and shader call sites were inspected, not executed. Upstream Cage and
wlroots are feasibility references, not installed-stack evidence. Searchfox
was used for discovery, with pinned local blobs controlling conclusions.
No source, overlay, compiler, package, runtime or frozen diagnostic changes;
no performance improvement or hardware scanout is claimed.
