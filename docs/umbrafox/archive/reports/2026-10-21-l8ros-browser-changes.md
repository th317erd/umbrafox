# L8ROS browser changes, handed back to Umbrafox (2026-10-21)

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Until now these changes lived only in an L8ROS build tree and an opaque tarball - they were never in this
repository, so Umbrafox could not track them. This is the hand-over. Everything here applies **on top of**
`exports/umbrafox-hybrid-20261019185219/hybrid-source.patch`; nothing here touches your EGL external-root
work.

Patch: `docs/umbrafox/archive/patches/2026-10-21-l8ros-attach-skip-and-vsync-pump.patch` (80 lines, 3 files).

## 1. Attach an external surface from the Draw compositor path
`gfx/wr/webrender/src/tile_cache/mod.rs`, `gfx/wr/webrender/src/renderer/composite.rs`

Upstream WebRender has no "draw compositor + external surface" mode: the `CompositorKind::Draw` arm returns
`(None, None)`. With your patch applied, video is only promoted when the compositor kind allows it, and on
the L8ROS device (no GPU process, Draw kind) it never is. These hunks create and attach a compositor
external surface for the video's `external_image_id`, and skip drawing it (the compositor scans it out).
Gated on `/etc/l8ros-session/video-subsurface`.

## 2. Keep content's vsync tick alive (the "frame pump")
`widget/gtk/nsWindowWayland.cpp`

`nsWindowWayland` creates `mWaylandVsyncDispatcher` on the root surface's frame callback, and that
dispatcher is what the content process follows (`BrowserParent::UpdateVsyncParentVsyncDispatcher` ->
`VsyncParent`). When the hybrid stops compositing, content stops being ticked. Measured on hardware:
**~6 ticks/s instead of 60**, which produces bursty rAF, stutter, and YouTube tearing down playback.

The hunk swaps that dispatcher onto a `SoftwareVsyncSource` at 1000/60.2 ms. Wayland frame callbacks still
pace the compositor's own swaps; only content's tick source changes. Gated on
`/etc/l8ros-session/vsync-pump`.

## Measured effect (local 1080p60 H.264, single tab, presented = (decoded - dropped) / currentTime)

| hybrid (1) | pump (2) | presented fps | dropped |
| --- | --- | --- | --- |
| off | off | 12.5 | 79.1 % |
| off | on | 31.8 | 47.1 % |
| on | off | 13.4 | 77.9 % |
| on | on | **56.9** | **5.1 %** |

Neither half is useful alone - with the hybrid and no pump, playback is *worse* than baseline because the
compositor stops drawing and starves content. Together they remove the video blit and keep content ticking.

## What we are asking Umbrafox for

1. Take ownership of these hunks (or implement the same idea in your EGL external-root path, whichever you
   consider the better long-term home - the pump exists precisely because content needs a tick source
   independent of whether a frame was composited).
2. Do not gate on L8ROS marker files if you can avoid it: the two markers are deployment switches so the
   appliance can A/B them without a rebuild. A pref would be cleaner.
3. Keep the software-vsync swap cheap to enter/leave - the dispatcher is per-widget and lives as long as
   the window, so it currently never switches back.

Separately and still outstanding: the V4L2 M2M hardware H.264 decode work
(`plans/2026-10-21-hardware-video-decode-pi4.md`), which removes decode CPU and is likely the last big win.
