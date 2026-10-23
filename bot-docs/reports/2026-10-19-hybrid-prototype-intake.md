# EGL/external-layer prototype intake

## Disposition

Browser-side integration ownership accepted. The latest request explicitly asks
for an official artifact and a default-on gate. The saved prototype is a useful
experiment, **not ready to land or package as an official release**. The reported
performance pass does not resolve the concrete rendering/lifetime defects below.
No browser source was changed, no build or package was started, and no Pi
operation was performed for this review.

Proposed production gate: `gfx.webrender.compositor.external-surfaces-in-draw`,
boolean, default false, startup/restart scoped, declared with the compositor
preferences in `StaticPrefList.yaml`. Enable only for a supported Wayland/EGL
backend after capability initialization. Convey that same capability to WR;
do not poll a marker file from Rust or use a separate C++ cached file check.
Keep the WR interface platform-neutral and suitable for upstream review. That
and an experimental default-off pref are complementary, not alternatives.
Default behavior must remain Firefox-equivalent; no website-visible API,
custom IPC, site-specific behavior, or global native-compositor force-enable.
No fence removal is included in this intake.

## Evidence

- Saved [seven-file, 250-line patch](/home/public/wyatt-desktop/Projects/l8ros-workspace/l8ros/bot-docs/patches/2026-10-18-hybrid-compositor-egl-external-layers.patch):
  SHA256 `d8afa0403f1bc5a916966eeddc253f2ca3c9d719e203fde9cf827701609f37aa`.
  Supersedes the initial 247-line revision
  `060ba9007ba308657732309c1f4d3b8345e57c0b01b400c249b3dc085f707870`.
- Updated [producer notes](/home/public/wyatt-desktop/Projects/l8ros-workspace/l8ros/bot-docs/plans/hybrid-compositor-implementation.md):
  SHA256 `21a4d0f667199bf3b8da7d11162008579e22372ca5cfd3695a6a621db6e8efaa`.
- Review checkout: `9a9057291b5b5dd1c1362a2cc58551990532a6f6`.
  All seven patch input blob hashes match this checkout, and their bytes also
  match release source `c0e7f8a2be0460695c1f65ae8796b09c1082480c`.
  `git apply --check` passes; the patch was NOT applied. This establishes input
  compatibility, not which complete source tree produced the tested binary.
- Latest l8ros results: 1080p60 at 59.29 fps/1.2% dropped versus 26.1/56% baseline;
  720p60 at 59.08/1.9%; hybrid page cadence 480/481 intervals <=18ms, second run
  476/479; zero failed units. These are supplied measurements, not independently
  rerun. They supersede the earlier zero-rAF observation as the reported steady
  result. The message attributes the earlier zero to task starvation; updated
  notes instead call it a same-tab harness artifact resolved by restart. Neither
  causal explanation was independently established here.
- Full tested-tree revision, package hash, raw measurement files and actual
  output/buffer attribution remain required. Neither frame counters nor a DOM
  screenshot establish correct live subsurfaces or a DRM hardware-plane assignment.

## Findings In The Exact Diff

1. **P1: wrong index domain in the draw-skip predicate.** The added
   `draw_tile_list` predicate indexes `descriptor.surfaces` with
   `external_surface_index`. However,
   [compute_external_surface_dependencies](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/gfx/wr/webrender/src/composite.rs:1232)
   derives that index from `external_surfaces.len()`.
   [push_surface](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/gfx/wr/webrender/src/composite.rs:1096)
   also inserts ordinary content descriptors into `descriptor.surfaces`.
   These arrays are not interchangeable. Mixed content can skip the wrong tile
   or draw a handed-off surface twice. Carry the association explicitly; an
   allocated ID also must not be treated as successful handoff.

2. **P1: surfaces accumulate and remain eligible for display after use.** Each
   successful patched Draw/Layer setup creates a fresh ID without putting it in
   `external_native_surface_cache`. Existing
   [post_update retirement](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/gfx/wr/webrender/src/tile_cache/mod.rs:3014)
   and `TileCacheInstance::destroy` therefore do not own those IDs.
   C++ only appends to `mExternalLayers`; it implements no `DestroySurface`
   override, so the inherited method is a
   [no-op](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/gfx/webrender_bindings/RenderCompositor.h:162).
   EndFrame submits all accumulated layers, not just this frame's visible
   layers, and never submits an empty set. The revised `mLayersPosted` flag
   resets on each CreateExternalSurface. Because successful WR setup still
   allocates a new ID, the flag does not solve this ownership problem or compare
   the current ordered visible set. This risks retained buffers, stale video
   over later content, and growing work per frame.

3. **P1: no Draw-side placement submission, and incomplete root commit ownership.**
   The patch defines C++ `AddSurface` but introduces no Draw caller. Existing
   [native visual-tree submission](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/gfx/wr/webrender/src/renderer/mod.rs:4611)
   remains Native-only; the other renderer submission is Layer-only. Thus the
   new transform/clip method is not wired by this diff. Separately,
   [SetLayers](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/gfx/layers/NativeLayerWayland.cpp:424)
   sets `mRootAllLayersRendered=false` and disables root commits when the list
   changes. The normal
   [CommitToScreenLocked](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/gfx/layers/NativeLayerWayland.cpp:606)
   renders child layers and restores commit readiness; the added task calls
   only `SetLayers`, after SwapBuffers. `WaylandSurface::Commit` respects that
   disabled state. This is a concrete lifecycle gap and a candidate for the
   earlier zero-rAF symptom, not proof of its cause: EGL's own protocol commits
   are a separate path and the producer now reports that probe as a harness
   artifact. Do not blindly add the existing native root commit, which
   also owns root-buffer/stacking behavior. Define shared-root ownership first.

4. **P1: failed or unavailable handoff can suppress drawing.** Create/attach
   return silently on missing root, layer or texture; the Rust ID still exists
   and can trigger the skip. Rust checks the file each setup; C++ caches its
   result once. Removing/recreating the file can disagree across the two.
   Every Draw backend is given a general `WrCompositor` handle, and the new
   Draw/Layer queue drain silently discards unhandled operations or all operations
   if no compositor exists. A shared initialized capability, explicit failure
   policy and a usable draw fallback are needed before skipping pixels.

5. **P1: scene order, clipping and asynchronous lifetime are not preserved.**
   The submitted layer array is allocation order, not current WR z-order.
   Underlays and content/video/content interleavings cannot simply become layers
   above one opaque EGL buffer. The new AddSurface also ignores rounded-clip
   arguments. Posted tasks retain root/layer references, which avoids a raw
   `this` capture, but they have no frame generation, bounded admission,
   shutdown invalidation or dispatch-error handling. A retained reference alone
   does not make an old frame valid after navigation/window teardown.

The supplied two blocked-thread stacks do not identify the mutex owner or prove
a complete deadlock cycle. Main-thread dispatch is a reported successful
experiment, not a general proof that WaylandSurface cannot be locked from the
render thread. Preserve its complete stack evidence when diagnosing ownership.

## Integration And Verification Gates

First define the frame transaction: selected external occurrences, exact
descriptor associations, current ordered layer set, attach readiness, buffer
release ownership, root/child commit ordering and cancellation on teardown.
Reusing the existing surface cache is preferable to creating a second lifetime
model. Gate the initialized backend, not just the existence of a generic
compositor pointer. Unsupported scene ordering, clipping, color handling,
screenshots/readback or failed imports must keep the existing rendering route;
do not bypass promotion guards. An initial opaque-overlay-only restriction is
acceptable only with a proved eligibility predicate and explicit fallback.

Failing-first tests before integration:

- Interleave ordinary descriptors with two external images: association and
  draw omission must match the exact selected occurrence, not vector position.
- Repeated frame updates reuse live surfaces; seek, tab hide, navigation,
  fullscreen exit and final removal retire them and publish the empty set.
- Reject unavailable capability/root/import, missing texture, unsupported queue
  operation and failed dispatch without silently losing pixels.
- Reorder two videos, put UI above video, exercise masks/rounded clips,
  underlay cancellation and readback. Unsupported cases must render correctly
  through fallback. Extend the existing compositor-surface reftests.
- Stop between attach/publication, delay a main-thread task, destroy/recreate
  the widget and resume: no stale publication, unbounded queue or held buffer.
- Record root/child commit and frame-callback order. A GTK/Wayland integration
  run is required; mocks cannot establish lock or presentation correctness.

Small contract tests should use a 10s watchdog; integration/reftest bounds need
to be set for the chosen runner before launch. No tests were run in this intake.
After a verified build/package, l8ros owns deployment and matched baseline/ON/OFF
measurements: 1080p60 >=57 fps/<5% dropped AND page cadence >=470/480 intervals
under18ms, plus 1080p30/720p60, mixed UI/video, actual visual correctness and
resource-retirement checks. These are proposed acceptance gates, not achieved
results. Preserve synchronization unless a separate proof justifies changing it.

The reviewed patch remains unapplied. The immediate missing evidence is the
tested artifact identity and complete tested-tree diff, including whether earlier
NativeLayerWayland/WaylandSurface experiments were retained. The immediate
engineering work is correcting the source contracts above, not enabling the
prototype globally. A global default-on change is not accepted: known visual
correctness gaps fail the mandatory Firefox-parity review. Start with the
default-off pref and explicit platform capability after those gaps are fixed.
Websocket ACK/update delivery failed for both supplied l8ros selectors because
neither matched a loaded thread; no delivery is claimed.
