# Hybrid admission and verifier audit

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Scope: response to l8ros's 2026-10-20 report for BuildID `20261019185219`.
Read-only browser/artifact audit; no source change, rebuild, deployment, or Pi
access. The reported hardware result does not meet video acceptance.

## Identity and verification

Export:
`/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/exports/umbrafox-hybrid-20261019185219`

- Archive SHA256 rechecked:
  `41159d834b9fbef045928159416c179a00c753164edfb6824ab2fa2885323ff9`.
- Source patch SHA256 rechecked:
  `52adb07b853f09b0bd217bae3345472e61987d18f73cf6b3c93b2633161df335`.
- Source freeze SHA256 rechecked:
  `c347f71a91b42ef11b94f529de2672be5700216a380b1946ea8535594727bda7`.
- All 31 evidence files match the pinned evidence manifest; all 25 owned source
  files in the current checkout match the freeze.
- Exported source-contract suite rerun: **14 PASS**, 0.038 s.
- Exported verifier unit suite rerun: **7 PASS**, 0.040 s.

The exact reported text, `Ran 14 tests ... FAILED (failures=1)`, exists in
`evidence/attachment-red.log`. It is the retained pre-fix failure of
`test_successful_egl_swap_records_attachment_without_visibility`.
The subsequent `attachment-green.log` and `exported-source-checks.log` both
pass all 14. The missing `mBufferAttached = true` assignment is present in the
hash-verified final source.

This identifies a matching historical failure log, not the exact file l8ros
read. A different failing file or new invocation still needs its full path and
output. The package verifier suite has seven tests, not fourteen.

These checks do not execute Wayland behavior or prove hardware acceptance.
The full package verification was performed during export; this audit checks
its retained evidence and archive identity, not a new full build/extraction
verification. The frozen export and its historical RED logs remain untouched.

## Attachment and draw omission already exist

The implementation deliberately does not use the prototype's Native compositor
create/attach command queue. It uses a separate optional Draw backend:

1. `RenderCompositorEGL::SupportsDrawExternalSurface` exposes the startup pref.
   `WebRenderAPI` passes that capability to `wr_window_new`; the Draw branch
   installs `WrDrawExternalCompositor`.
2. `CompositeState::draw_external_surface` selects a resolved external image.
   `prepare_draw_external_surface` calls `DrawExternalCompositor::prepare`.
3. `WrDrawExternalCompositor::prepare` calls
   `wr_compositor_prepare_draw_external_surface`, which dispatches to
   `RenderCompositorEGL::PrepareDrawExternalSurface`.
4. EGL looks up the `RenderTextureHost` using `external_image_id`, then calls
   `NativeLayerRootWayland::PrepareForEGL`.
5. After admission, `NativeLayerWaylandExternal::PrepareForEGL` maps the child,
   creates/reuses its `WaylandBuffer`, waits the retained fence, and actually
   calls `mSurface->AttachLocked(lock, mFrontBuffer)`. Only success returns true.
6. `Renderer::composite_simple` returns before the normal final tile draws
   when preparation succeeds. This omits the final composite because the
   admitted frontmost opaque fullscreen surface covers all lower tiles.
   This is not a claim that all earlier rendering work is skipped.

Source references, each verified against the frozen export:

- [Selector and acceptance contract](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/gfx/wr/webrender/src/composite/draw_external.rs)
- [Draw bridge](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/gfx/webrender_bindings/src/bindings.rs)
- [EGL host lookup and preparation](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/gfx/webrender_bindings/RenderCompositorEGL.cpp)
- [Native root admission and child attachment](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/gfx/layers/NativeLayerWayland.cpp)
- [Final composite omission](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/gfx/wr/webrender/src/renderer/composite.rs)

Thus no additional attach/skip merge is justified by the proposed diagnosis.
The prototype's 60 fps result remains useful hardware evidence, but does not
show which admission condition this different candidate satisfies.

## What can reject the candidate

The pref is startup-only and is not an active-route indicator. After restarting
with it enabled, all these conditions still apply:

- WR's first/frontmost tile must be an opaque, unclipped external YUV surface,
  exactly covering the framebuffer with identity transforms and valid bounds.
  An overlaid foreground tile, scaling, crop, or non-fullscreen video rejects.
- WR requires an external image ID, 8-bit NV12/planar YUV, Rec709 limited range,
  and no native update parameters. Debug overlays/flags and incompatible
  framebuffer targets reject; capture paths deliberately fall back to Draw.
- EGL requires a mapped visible scale-1 parent, an actual DMABuf YUV texture
  host, and matching source/output dimensions.
- Native admission additionally requires 8-bit BT709 transfer, BT709 matrix,
  limited range, non-HDR, exact NV12/I420 wire format/plane count, and identical
  explicit modifiers advertised by the compositor. INVALID/unknown modifiers
  and absent feedback reject.
- `GetColorRepresentationManager()` must be non-null and
  `GetColorRange(surface->GetWLColorCoeficients(), false)` must succeed.
  Without the manager or advertised BT709-limited support, rejection is
  unconditional, irrespective of FPS or the pref value.

The relevant global is `wp_color_representation_manager_v1`, not merely
`wp_color_manager_v1`. The protocol makes representation implementation-defined
when it is not used, so removing this check does not establish equivalent YUV
reconstruction. See the [primary protocol definition](https://raw.githubusercontent.com/wayland-mirror/wayland-protocols/main/staging/color-representation/color-representation-v1.xml).
Upstream [Cage v0.2.1 initialization](https://raw.githubusercontent.com/cage-kiosk/cage/v0.2.1/cage.c)
does not create this manager. The current custom Pi compositor and its actual
registry were not inspected here.

First no-build check for l8ros: collect `wayland-info` on the **browser's actual
Wayland socket**, with its effective runtime directory and user, not just the
outer DRM compositor's socket. Confirm the exact global and advertised
BT709/limited coefficient-range pair. If absent, this candidate cannot attach
through this path; more FPS runs cannot change that result. If present, check
actual buffer format/modifiers/color metadata and WR geometry next.

Supporting the missing protocol (including its rendering/scanout semantics),
or establishing a separately reviewed exact compositor-specific color contract,
is a real compatibility change. Merely removing the guard or advertising an
unimplemented protocol is not that change.

## Vsync and next decision

This export also already contains a child-to-parent vsync path:
`SetEGLVSyncSourceLocked` registers the successfully prepared child;
`EGLVSyncCallbackHandler` validates generation/lifecycle, publishes the rearmed
synchronized callback, and calls the existing parent consumer outside the lock.
Rejection/clear/unmap retires it. `NotifyEGLSwapLocked` records successful parent
attachment to stop continued startup emulation.

If admission fails, that child route is not exercised. The reported 25 rAF
intervals/s therefore neither validates it nor establishes the earlier
470/480-under-18-ms page acceptance target. Concurrent child admission, child
callbacks, content cadence, and video counters need correlation before adding
a forced-composition loop or suppressing `UnobserveVsync`.

Decision: preserve the default-off candidate and its guards. Do not merge a
second attach path or global keepalive on this evidence. First establish the
specific admission failure on the installed stack; then choose the smallest
compatibility or lifecycle correction at that boundary. No hardware success,
color parity, server import acknowledgment, or production readiness is claimed.

Communication: the websocket ACK failed because no loaded l8ros thread matched
the supplied selector. No teamwork database was assigned.
