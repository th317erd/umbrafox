# Video Plane Feasibility and Ranked Plan

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

2026-10-17, `wr-render-fix`. Analysis only; no source edits, builds or runtime
actions. l8ros owns the Pi and execution. This supplements the
[composite decomposition](./2026-10-17-release-composite-decomposition.md).

## Boundary Ruling

**A compositor-side gap is established for the reported upstream versions;
the browser-side handoff is still unproven. They are not exclusive alternatives.**

- Cage `f9626f7` / 0.2.1 calls `wlr_scene_output_commit` from
  `handle_output_frame`. wlroots **0.19.0** scene code attempts single-buffer
  direct scanout using `wlr_output_state_set_buffer`, but does not submit
  `wlr_output_state_set_layers`. It does not automatically assign separate
  video subsurfaces to DRM Overlay planes.
  [Cage source](https://github.com/cage-kiosk/cage/blob/f9626f7/output.c),
  [wlroots 0.19 scene](https://gitlab.freedesktop.org/wlroots/wlroots/-/blob/0.19.0/types/scene/wlr_scene.c).
- A browser holding `/dmabuf` FDs does **not** establish that they contain decoded
  video or were attached to Wayland. They can be rendering, upload or canvas
  buffers. Neither absence of a LayerNative override in one overlay file nor
  the decoder library name establishes the effective compositor/buffer route.
- The first runtime failure therefore cannot yet be located between browser
  export, subsurface eligibility and compositor assignment. The version string
  is not proof that installed binaries lack downstream changes; actual build
  options/source delta and wlroots 0.19 patch version remain unverified here.

## What the Raw DRM Evidence Establishes

Independently read both supplied files in
[overlay-evidence](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/exports/umbrafox-wr-render-p2/diagnostic-layout/overlay-evidence).

| Observation | Exact interpretation |
| --- | --- |
| Active CRTC object 115, index 4 | 1920x1080, 60.00 Hz in this capture. |
| Primary plane object 104, FB 724 | XRGB8888, LINEAR, 1920x1080, pitch 7680. |
| Cursor plane object 700, FB 725 | The only other active plane. |
| 60 planes total | 48 Overlay, 6 Primary, 6 Cursor; all Overlay FB IDs zero. |
| 16 Overlay masks include CRTC index 4 | Candidate routing, not guaranteed simultaneous capacity. |
| Example candidate plane 128 | YU12 LINEAR; NV12 LINEAR and SAND modifiers advertised. |

This rules out active YUV plane scanout in that snapshot. It does not identify
who produced FB 724, whether Cage directly scanned out an already-rendered
browser RGB buffer, or where/how much GPU time was spent. Formats are necessary,
not sufficient: allocation layout, import, scaling, color and shared resources
still need a successful atomic test. Do not hard-code the example plane IDs.
[KMS atomic validation](https://docs.kernel.org/gpu/drm-kms.html).

## Browser Handoff Already Exists

Pinned browser source `c0e7f8a2be0460695c1f65ae8796b09c1082480c` contains this
standard-protocol path:

1. `RenderCompositor::Create` selects GTK `RenderCompositorLayerNativeOGL` or
   `RenderCompositorNativeOGL` when native-compositor and window eligibility
   pass. GTK compositor/layer-compositor defaults are true, but feature
   blocklists and effective preferences still apply. Wayland, DMA-BUF and
   `wp_viewporter` are required by `gfxPlatformGtk::InitWebRenderConfig`.
   [Selection](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/webrender_bindings/RenderCompositor.cpp:243),
   [GTK gates](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/thebes/gfxPlatformGtk.cpp:290).
2. `can_promote_to_surface` rejects unsupported effects, transforms, clipping
   and surface-order cases. `setup_compositor_surfaces_impl` requires an
   external image ID, `SUPPORTS_EXTERNAL_COMPOSITOR_SURFACE` and
   `ImageRendering::Auto` for direct attachment. The DMA-BUF host's format must
   pass `GlobalDMABufFormats::SupportsDirectComposition`.
   [Promotion](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/tile_cache/mod.rs:1470),
   [Direct eligibility](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/wr/webrender/src/tile_cache/mod.rs:1823),
   [Format gate](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/widget/gtk/DMABufFormats.cpp:525).
3. `CreateExternalSurface` / `AttachExternalImage` hand the image to
   `NativeLayerWaylandExternal`; the OGL wrapper locks a DMA-BUF without a GL
   context. `DMABufSurfaceYUV::CreateWlBuffer` sends plane metadata through
   linux-dmabuf. `WaylandSurface` creates a `wl_subsurface`, attaches the buffer
   and commits it. No custom IPC or site JS is required.
   [External surface](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/webrender_bindings/RenderCompositorLayerNative.cpp:290),
   [Native attachment](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/gfx/layers/NativeLayerWayland.cpp:1521),
   [YUV wl_buffer](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/widget/gtk/DMABufSurface.cpp:2571),
   [Subsurface creation](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/widget/gtk/WaylandSurface.cpp:449).

Native attachment can still upload SHM or convert unsupported HLG; those paths
are explicit in `NativeLayerWaylandExternal::AttachExternalImage`. Thus even a
native layer is not proof of unchanged decoded-buffer zero-copy. Source contains
the route, not evidence that this playback used it.

## What Cage/wlroots Must Do

**Single-buffer route:** 0.19's `scene_entry_try_direct_scanout` can submit the
remaining scene buffer as the primary output buffer. Eligibility includes one
remaining render-list entry, matching transform, no required scene color
transform/debug rendering, no render lock/software cursor, and successful
output-state testing. Source/destination boxes are passed to the backend; do
not substitute an invented rule requiring an xdg-fullscreen flag or no scaling.
If that one buffer is the decoded video, this is a legitimate bypass **on
Primary**, with no Overlay FB needed. If it is browser-composited RGB, it only
avoids Cage's composition.
[Scene code](https://gitlab.freedesktop.org/wlroots/wlroots/-/blob/0.19.0/types/scene/wlr_scene.c),
[Output restrictions](https://gitlab.freedesktop.org/wlroots/wlroots/-/blob/0.19.0/types/output/output.c).

**Multi-plane route:** application-level scene integration must create output
layers, submit each buffer/geometry, test acceptance, render rejected content
and atomically commit. Retain all layer states and disable abandoned layers.
The 0.19 backend requires compiled libliftoff support and selection of its
interface through `WLR_DRM_FORCE_LIBLIFTOFF`; setting that variable alone adds
no scene-layer submission. `drm_connector_set_pending_layer_fbs` imports the
buffers; libliftoff assigns planes and reports layer acceptance.
[0.19 output-layer contract](https://gitlab.freedesktop.org/wlroots/wlroots/-/blob/0.19.0/include/wlr/types/wlr_output_layer.h),
[DRM backend](https://gitlab.freedesktop.org/wlroots/wlroots/-/blob/0.19.0/backend/drm/drm.c),
[libliftoff backend](https://gitlab.freedesktop.org/wlroots/wlroots/-/blob/0.19.0/backend/drm/libliftoff.c).

Two correctness blockers prevent calling this a trivial policy toggle:

- Output layers are above Primary. Video there must not cover controls,
  captions, menus or a watermark rendered into Primary. A minimal implementation
  accepts only proven unobscured opaque video and falls back when foreground
  UI appears. General UI-over-video needs correct multi-layer ordering; never
  hide UI to obtain a benchmark win.
- 0.19 `wlr_output_layer_state` and `set_layer_props` do not propagate YUV
  `COLOR_ENCODING` / `COLOR_RANGE`. Plane 128 happens to report BT.709 limited
  in this capture; that is not a general color contract. Bind actual video
  metadata to supported plane settings, or reject promotion. Also preserve
  crop/chroma siting, synchronization, lifetime and capture behavior.

## Ranked Implementation Decision

| Evidence at the next boundary | Smallest justified action |
| --- | --- |
| Only a flattened browser RGB surface reaches Cage | Establish native external-video handoff first. Reuse existing browser support; fix its specific eligibility/export failure if necessary. A Cage plane patch cannot recover video from RGB pixels. |
| Decoded YUV subsurface is the sole visible scene entry | Diagnose the existing Primary direct-scanout rejection first. No general overlay implementation may be necessary. |
| Decoded YUV subsurface plus other required scene entries | A narrow Cage/wlroots scene-to-output-layer integration is the known missing component. Browser changes are unnecessary only if its handoff is already correct. |
| No separate video handoff and multi-surface output needed | Both changes, staged and measured separately; no evidence supports choosing this branch yet. |

**Next evidence is small, not a new build campaign:** retain the effective
browser compositor/promotion result and one bounded scene-buffer inventory:
client/surface/parent IDs, buffer origin, FOURCC/modifier/planes, source and
destination boxes, opacity, visible overlap and scanout rejection reason. Join
decoded image identity through `wl_buffer`/`wlr_buffer` to imported DRM FB ID.
FD numbers and process-local GEM handles alone are not cross-process identity.
Use internal logs/standard protocol evidence, not website-visible hooks.

## Falsifiable A/B and Safety Gates

Before implementation, turn unsupported format/modifier, occluding UI, wrong
color, lost buffers, failed atomic test/commit and capture activation into
negative controls: normal composition must remain correct, with no stale plane
or early buffer release. Test transitions, not merely a successful first frame.
Confirm installed source/options before selecting the appropriate API patch.

For the performance experiment, hold coded 1080p60 stream, codec, actual output
1920x1080@60, scale, Ambient state and browser build fixed unless the browser
change is the independent variable. Use settled 120-second ABBA windows with
the same measurement method; retain thermal/clock/network rejection conditions.
Keep diagnostic logging bounded and outside scored windows where possible.

Separate the outcomes:

1. **Mechanism:** repeated KMS samples show the actual video buffer assigned to
   an eligible Overlay, with matching crop/color and no redundant GPU video draw.
   A random nonzero Overlay FB does not pass. For a proven video-on-Primary
   implementation, accept that explicitly different mechanism rather than force
   an unnecessary Overlay. One static DRM snapshot is insufficient.
2. **Performance:** predeclare the target; suggested full success is at least
   95% of source cadence submitted and at most 5% drops in each valid B window,
   with A restoring the baseline. A smaller reproducible gain is partial, not
   60-fps success. `presentSub` remains submission, not physical scanout;
   retain compositor/KMS presentation evidence for the display claim.
3. **Falsifiers:** correct video-plane use without a gain rejects the claim that
   removing this composition cost is sufficient. A gain without video-plane
   use does not validate the proposed mechanism. Color/UI/fence regressions
   reject the patch regardless of throughput.

All proposed routes use standard Wayland/Linux DRM or compositor-internal APIs.
No custom browser IPC, site JS, media feature removal or website-specific
behavior is required. Pixel, color and API parity remain mandatory.

## Evidence Pins and Remaining Limits

- `drm-info.txt`: `05286e902664e0f970a9939493f47282a7d719c4443a09033e47742911a7cbb3`.
- `modetest-planes.txt`: `85206c7550ad8a598ae894d6cccd6275938c34435c7ca933da4c6a8a8cc6a037`.
- Cage f9626f7 `output.c`: `3680f5930c1cd06a299bf1abf5ab2e97f21004ce89a781648b2a2f94a1786907`.
- wlroots 0.19.0 `types/scene/wlr_scene.c`: `600d1a996acd6d463254f0f3dd371e14e74399361a0749e9ef647efff73565d5`.
- wlroots 0.19.0 `backend/drm/drm.c`: `75ee19bcfa2a85a85f02d979dec30b6a4b19af596dbcca4dcbe3d70ec63a1d60`.
- wlroots 0.19.0 `backend/drm/libliftoff.c`: `e0c73889a8ba87cd0c85919330cc7731813021997bf63009f142496df886fe2f`.

The supplied captures establish the current plane state, not a complete
browser-to-KMS buffer history. No runtime was performed here; actual decoder
buffer identity, browser surface tree, installed downstream patches and
libliftoff build/selection remain open. No first-broken-boundary claim is made
beyond the stock scene integration limitation above.
