# EGL external video integration

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Wyatt authorized implementation after the prototype intake review. Parent owns
browser source/build/package; l8ros owns Pi deployment and acceptance. Start
revision: `9a9057291b5b5dd1c1362a2cc58551990532a6f6`. Existing unrelated context
changes stay untouched. The unsafe prototype is reference evidence, not a patch
to apply verbatim.

## Contract

- Default-off, startup-scoped pref
  `gfx.webrender.compositor.external-surfaces-in-draw`.
- Draw remains Draw. Leave promotion eligibility, native surface queues and
  existing Native/Layer backends unchanged.
- Select a resolved external image at final composition, not an index into the
  unrelated descriptor vector. Initial supported scope is the frontmost opaque
  fullscreen SDR YUV tile, identity transform, no rounded/masked clip or cropping.
  Foreground content, scaling, screenshots and unsupported imports keep drawing.
- A dedicated optional Draw-external interface prepares one current surface or
  clears it; only successful preparation permits omitting that exact tile.
  No per-frame native-ID allocation or permanent list of historical images.
- EGL owns its parent buffer and swap. Child handoff must preserve synchronization,
  release ownership, root callbacks and empty-frame/teardown behavior. No fence
  deletion, marker-file polling, global compositor override or website API.

## Phases

1. IMPLEMENTED: fail-first selector/identity/fallback tests and WR interface.
   Two initial behavioral failures reproduced; final 176 host WR library tests
   pass, including 11 selector/configuration tests (0.03s execution).
2. IMPLEMENTED, changed native units COMPILED in the final ARM pass: guarded
   Gecko bridge and external-only Wayland lifecycle; independent source review
   of parent/child commit ownership. Import corrections rebuilt successfully.
3. HOST CHECKS PASS: 176 WR library tests and 16 SWGL compositor-surface
   reftests and the SWGL invalidation suite; native admission/snapshot fixtures
   compiled for AArch64, not run.
   Real Wayland lifecycle, fault and capture execution remains external work.
4. BUILD/PACKAGE/VALIDATION PASS: isolated ARM build and normal self-contained
   package, exact source and artifact hashes. Frozen diagnostic source/obj
   evidence remains untouched. See the
   [artifact handoff](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/docs/umbrafox/archive/reports/2026-10-19-hybrid-artifact.md).
5. EXTERNAL VALIDATION: l8ros deploys candidate; 1080p60 >=57fps/<5% drops,
   page cadence >=470/480 intervals <=18ms, 1080p30/720p60, mixed content,
   seek/navigation/fullscreen transitions, actual visual output and resource
   retirement. No default-on or certified-hardware claim before this evidence.

## Compatibility Finding

The external-only backend requires `wp_color_representation_manager_v1` plus
advertised BT709 limited-range support. Source review of upstream Cage v0.2.1
and wlroots 0.19 finds no manager implementation/creation. wlroots 0.20 adds the
protocol, but a compositor must also advertise and implement it; a library
version alone is not admission. The installed custom l8ros registry is untested.
Without explicit representation metadata, Wayland leaves YUV reconstruction
implementation-defined, so NV12/I420 alone is not a BT709-parity guarantee.
Do not remove this guard merely to reproduce prototype frame rates. Existing
0.19 stacks fall back to Draw. The packaged candidate cannot be represented as
the measured prototype or a working optimization on that unmodified stack.

Source references: `NativeLayerRootWayland::PrepareForEGL`, upstream
[wlroots 0.20 release](https://gitlab.freedesktop.org/wlroots/wlroots/-/releases/0.20.0),
[color-representation protocol](https://gitlab.freedesktop.org/wayland/wayland-protocols/-/raw/main/staging/color-representation/color-representation-v1.xml),
[Cage v0.2.1](https://raw.githubusercontent.com/cage-kiosk/cage/v0.2.1/cage.c).
Worker source inspection is retained in the conversation; no Pi registry/runtime
check was performed by this lane.

## Import Review Correction

The new handoff must also check the exact wire FOURCC and every plane modifier
against a copied, locked snapshot of completed compositor feedback. Only
explicit, identical modifiers are admitted; `DRM_FORMAT_MOD_INVALID` is rejected
because the existing fallback table injects that value even for unadvertised
formats. NV12 requires two planes; I420 maps to DRM YUV420 and requires three.
The legacy raw format getters are not made generally thread-safe by this change.
The YUV import path also needs its temporary params object destroyed, matching
the RGBA path. Native regression fixtures cover those admission predicates and
snapshot lifetime; their execution remains outstanding.

This is advertisement preflight, NOT server import acknowledgment. The existing
`create_immed` request can still fail asynchronously, including a fatal protocol
error for platform import failure. Local `AttachLocked` success is submission,
not proof of display or scanout. A nonfatal acknowledged import path would need
asynchronous `create`/`created`/`failed` lifecycle handling and is not implemented.
See the [linux-dmabuf protocol](https://raw.githubusercontent.com/wayland-mirror/wayland-protocols/main/stable/linux-dmabuf/linux-dmabuf-v1.xml).
Keep the feature default-off and require disposable-profile hardware validation.
The initial source freeze/build receipts are retained; corrections get a new
source freeze and an affected-unit rebuild before packaging.

## Child Vsync Follow-up

Wyatt authorized the child-surface vsync repair with "Let's go for it".
Implement in this default-off candidate, not the separately tested l8ros
prototype. Keep compositor IPC and forced-composition scheduling unchanged.
Preserve the parent WaylandVsyncSource handler, EGL buffer/swap ownership and
parent-before-child lock order. Forward child callbacks only after releasing
surface locks; propagate observer state and rearm synchronized callbacks without
committing an in-progress EGL frame. Disable and retire callbacks on hide,
failed prepare, unmap and shutdown; remapping must register fresh callbacks.

- COMPLETE: producer/consumer and lifecycle trace, failing regression target.
- COMPLETE: implementation, 14 source-contract checks with 11 mutation controls,
  independent race/startup review and corrections. No behavioral runtime proof.
- COMPLETE: final native compilation and candidate/package verification,
  BuildID20261019185219/source-freeze6. ARM archive SHA256
  `41159d834b9fbef045928159416c179a00c753164edfb6824ab2fa2885323ff9`.
  BuildID20261019183200 passed, then was superseded by successful-EGL-attachment
  bookkeeping to stop startup emulation when the parent gets no own callback.
- EXTERNAL: Pi concurrent video/rAF, pause/end, hide/show, remap and teardown.

This does not establish that missing forwarding caused the prototype's stall.
Color/import admission and default-off gates remain unchanged. No desktop/Pi
installation is part of this follow-up. Control:
`/tmp/codex/umbra-egl-vsync-20261019/control`.

## Verification

October 20 combined-patch intake is blocked, not an implementation phase.
Supplied patch SHA `86aaca7d483b5c7118b30a6d91b9dc5948648565a7dff6d9f4030a6004bde81f`
skips fallback without successful attachment, queues native operations without
a Draw consumer, and adds a process-global marker-based keepalive without
retirement. It also omits the new Rust module in a clean-base handoff.
No source integration/build was performed. Local producer package identity
mismatch and the Marionette comparison are recorded in the
[intake review](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/docs/umbrafox/archive/reports/2026-10-20-combined-hybrid-intake.md).
These findings do not invalidate the supplied FPS observations, but they prevent
attributing them to correctly attached/scanned-out surfaces from this patch.

First failures: resolved-index/descriptor independence and exact image selection.
Then reject alpha, missing host, HDR, crops, nonfinite geometry, transforms,
foreground content and other compositor modes. Lifecycle checks must include
failed import/dispatch, empty frames, delayed tasks, restart and teardown.
Small tests use a 10s execution watchdog after compilation; integration/build
bounds are established from the retained build environment, independently of
the performance acceptance limits. Treat all producer performance results as
supplied evidence until the final packaged artifact is tested by l8ros.

Sidecars are read-only environment and Wayland-contract reviews. Control:
`/tmp/codex/umbra-hybrid-20261019/control`; HALT stops work. No old teamwork DB
has been assigned to this implementation.
