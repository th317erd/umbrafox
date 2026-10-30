# Combined hybrid patch intake

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Status: **not admitted for a browser build as supplied**. Browser source and
previous exports remain unchanged. No Pi access or installation.

Reviewed input:
[combined patch](/home/public/wyatt-desktop/Projects/l8ros-workspace/l8ros/docs/umbrafox/archive/patches/2026-10-20-combined-umbrafox-eglroot-plus-attach-skip.patch),
SHA256 `86aaca7d483b5c7118b30a6d91b9dc5948648565a7dff6d9f4030a6004bde81f`.
The supplied measurements are retained as observations, not proof that this
patch reproduces the measured executable or that scanout occurred.

## Blocking findings

### P1: skipping the fallback does not require attachment

The added `Renderer::draw_tile_list` marker branch executes `continue` for
an external image with no update parameters. It does not require the feature
pref, successful `PrepareForEGL`, accepted color/modifier/geometry, or an
attached child. It also applies beyond the narrow YUV-only candidate.

Consequently, marker present plus pref disabled, rejected admission, or a
readback request can suppress the ordinary GL fallback despite no accepted
external replacement. This is a source-level missing-draw path, not proof of
what was displayed during the reported run. Improved submitted-frame counters
cannot distinguish correct presentation from omitted rendering.

Keep draw omission tied to the successful preparation result for the exact
selected surface. Do not replace that handshake with marker existence.

### P1: create/attach operations have no Draw-mode consumer

The added `TileCacheInstance::setup_compositor_surfaces_impl` Draw/Layer branch
queues `create_compositor_external_surface` and
`attach_compositor_external_image`. In the unchanged
`Renderer::update_native_surfaces`, only `CompositorConfig::Native` drains this
queue. Draw/Layer asserts that the queue is empty; optimized builds do not drain
it. Repeated operations therefore accumulate rather than reaching a backend.

The supplied patch has no renderer/mod.rs dispatch change.
`CompositorConfig::compositor()` still returns None for Draw/Layer, and
`RenderCompositorEGL` still inherits the base no-op native create/attach
methods. The new IDs also lack the Native branch's cache-managed reuse.

This is not connected to our optional `DrawExternalCompositor`: that separate
interface calls `PrepareDrawExternalSurface` directly and already performs
real child attachment and conditional final-composite omission.
See the [export audit](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/docs/umbrafox/archive/reports/2026-10-20-hybrid-admission-audit.md).

### P2: the keepalive is process-global capability state, not live state

`gL8ROSHybridActive` is assigned in `RenderCompositorEGL::BeginFrame` from
marker existence and the startup pref, before frame-start success. No
successful promotion is required. Rejection, cancellation, pause and destruction
do not clear it. One renderer can therefore leave unrelated schedulers in the
same process observing indefinitely; another renderer can overwrite the global
state. Atomic storage does not fix this ownership problem.

C++ caches marker existence once, while the Rust paths recheck the file.
Removing the marker can stop the Rust behavior without retiring the keepalive.
No marker or process-global scheduler override belongs in the admitted contract.

### P1 intake: the patch is not a complete, directly applicable source handoff

`git apply --cached --check` against a temporary index of `c0e7f8a2be04`
passes. However, the patch adds `mod draw_external` and imports its types while
omitting the new module file. That file does not exist in clean c0e7.

Applying the supplied patch atop our exact 18:52 source fails because it repeats
the original additions. It is a combined tracked-file diff, not an incremental
patch against our export. Manual extraction of the novel hunks would not repair
the renderer/backend or missing-draw defects.

A reproducible handoff needs either a complete patch including new files against
one exact clean base, or an incremental diff against the pinned 18:52 source.
The measured binary must be bound to that source. A clean build was not attempted
to rediscover the missing module through the compiler.

## Marionette comparison

Compared the current local l8ros package/stage with the exported 18:52 package,
not an unobserved Pi installation:

- Both configured builds have `ENABLE_WEBDRIVER=1`, `MOZ_GECKODRIVER=1`,
  `MOZ_WIDGET_TOOLKIT=gtk`, and `MOZ_BUILD_APP=browser`.
- All **161 remote/Marionette entries in omni.ja are byte-identical**.
- `Marionette.sys.mjs` SHA256 in both:
  `01935a3eef58cf85d6fa586c2577a2e9d9bf1ceb62ec3b377f2ae29bbd0cd7ab`.
- Both chrome manifests register `content remote remote/content/`.
  Both native libraries contain the Marionette component contract.
- The c0e7-to-9a905 revision range has no remote component, toolkit build-list,
  or browser package-manifest change.

The actual build gate is `ENABLE_WEBDRIVER`, controlled by
`--disable-webdriver` in `toolkit/moz.configure`; there is no missing
`--enable-marionette` option to add to these configurations.
Our mozconfig uses explicit optimization/no-debug, no ccache, and bootstrap
no-update. The inspected l8ros mozconfig uses sccache and ordinary bootstrap.
Neither has a Marionette-specific enable option.

### Concrete package identity defect

Local l8ros archive:
`/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/obj/dist/umbrafox-160.0a1.en-US.linux-aarch64.tar.xz`

SHA256: `124650afba03c13c787e7efdb8a5395ceb8f68f7e3ee7f4558775c2982370e64`.
Archive members libxul.so, omni.ja, application.ini and platform.ini were
stream-hashed and match the inspected staging files.

| Identity source | Value |
| --- | --- |
| libxul.so `.note.moz.toolkit-build-id` | `20261019225619` |
| application.ini | `20261019225648` |
| platform.ini | `20261019225648` |
| current obj/buildid.h | `20261019225648` |

The existing `package_buildid.py` verifier rejects this exact native/INI mismatch.
The same check passes for our `20261019185219` export. This is a real packaging
integrity defect, **not an established cause of the Marionette listener failure**.

Our runner pins one `MOZ_BUILD_DATE` across configure, build and package and
checks generated/native/INI identities before export. Use a fresh fixed BuildID
for the next coherent source build and retain it through packaging; do not edit
INI files or forge the native note to make an inconsistent build pass.

## Minimal next steps

1. Do not deploy or export this combined patch as-is. Correct the source handoff
   and preserve the admission-to-attachment-to-omission contract. First establish
   the browser socket's color-representation capability as requested in the
   export audit. Missing capability is not fixed by a second attach queue.
2. Rebuild/package a coherent approved source snapshot with one pinned BuildID.
   The package above has a known integrity failure and should not be used to
   infer a configure difference.
3. If Marionette still fails, capture bounded **browser stdout/stderr from
   launch**, using a disposable profile with `remote.log.level="Trace"` and
   `marionette.port=2828`. Enable the service with `--marionette` or
   `MOZ_MARIONETTE=1` before startup. Setting `marionette.enabled` alone is not
   the activation path in this source.
4. Check effective `remote.policy.disabled`, actual profile, command line,
   process environment and startup exceptions. `MOZ_REMOTE_ALLOW_SYSTEM_ACCESS=1`
   grants privileged protocol access; it is not the listener enable switch.
   No need to expose the loopback service to the network. Keep trace logging out
   of timed performance arms and avoid unrelated browsing during capture.

`MarionetteParentProcess` registers from `profile-after-change`, handles
`command-line-startup`, then initializes at `final-ui-startup`. Successful
startup writes `MarionetteActivePort` in the actual profile. Bind/start errors
are logged and request exit code 69. These are testable boundaries; missing
startup output alone does not identify which one failed.

The submitted "471 intervals/s at 60 Hz" needs its denominator clarified.
The existing target is a count of qualifying intervals out of 480, not 471
callbacks per second. The 37 rAF/s result has not met that acceptance gate.

## Verification bounds and limits

Read-only source review, temporary-index patch checks, bounded archive/ZIP
comparison and native-note reads only. No browser execution, compile or runtime
test. Independent reviewer confirmed the three rendering/lifecycle findings.
Initial INI inspection needed `ConfigParser(interpolation=None)` for literal
percent tokens; the corrected parser completed.

The local scratch control file remains OK; the reviewer is finished with no
further actions.
Websocket ACK could not be delivered: no loaded l8ros thread matched.
No teamwork database was assigned.

## Follow-up: callback commits are not WebRender redraws

The 08:49 handoff asks whether content can receive vsync without a full page
composite. **Yes: the existing observer path already permits that. Removing
`RequestForceCommit` is not the mechanism to achieve it.**

In [WaylandSurface.cpp](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/widget/gtk/WaylandSurface.cpp),
the child `VSyncCallbackHandler` rearms its one-shot callback and commits its
synchronized pending state before invoking `EGLVSyncCallbackHandler`. The latter
acquires the parent lock, validates the generation, requests a parent commit,
then calls the saved vsync consumer after unlocking.
[WaylandSurfaceLock.cpp](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/widget/gtk/WaylandSurfaceLock.cpp)
passes the force bit to `WaylandSurface::Commit`, which issues `wl_surface_commit`.
It does not call `ScheduleComposition`, request a WR frame, add framebuffer
damage, draw GL primitives, or call `SwapBuffers`.

The [Wayland protocol](https://raw.githubusercontent.com/wayland-mirror/wayland/main/protocol/wayland.xml)
makes frame requests effective on commit and synchronized child updates depend
on parent publication. No new parent buffer is required for a callback-only
commit. Omitting the parent commit when no other parent commit is guaranteed can
leave the rearmed child callback unapplied and stall the next tick. Coalescing
would require an explicit publication guarantee, not a "page idle" test.
This does not assert that a commit has zero cost in Cage.

The content path is independent of compositor rendering:

1. [WaylandVsyncSource::Init/VisibleWindowCallback](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/widget/gtk/WaylandVsyncSource.cpp)
   receives the callback and calls `VsyncSource::NotifyVsync`.
2. [VsyncDispatcher::NotifyVsync/UpdateVsyncStatus](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/widget/VsyncDispatcher.cpp)
   fans out to observers and retains the source while any observer needs it.
3. `BrowserParent::UpdateVsyncParentVsyncDispatcher` selects the widget dispatcher
   (or the global fallback). [VsyncParent](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/dom/ipc/VsyncParent.cpp)
   independently observes it and sends `PVsync::Notify`.
   [VsyncMainChild::RecvNotify](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/dom/ipc/VsyncMainChild.cpp)
   notifies the child refresh-timer observers.
4. Separately, [CompositorVsyncScheduler::Composite](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/gfx/layers/ipc/CompositorVsyncScheduler.cpp)
   calls `CompositeToTarget` only when `mCompositeRequestedAt` is set or ASAP mode
   applies. Its idle `UnobserveVsync` removes the compositor observer, not the
   independent content observer.

The alleged missing attachment is still contradicted by the inspected export:
`PrepareDrawExternalSurface` reaches `NativeLayerWaylandExternal::PrepareForEGL`
and its real `AttachLocked`; successful fullscreen admission makes
`Renderer::composite_simple` return before the ordinary final tile draws. The
prototype's native-queue API names are not required by this separate interface.
Pref enabled does not prove that admission succeeded on the Pi.

There is a distinct candidate cost: [RenderCompositorEGL::EndFrame](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/gfx/webrender_bindings/RenderCompositorEGL.cpp)
still calls `SwapBuffers` for a completed visible frame, including when the final
tile draw was omitted. Earlier WR passes and synchronization can also remain.
The supplied 40.6 fps observation does not identify which of these costs dominates,
prove a full page redraw, or prove scanout.

The next bounded observation should correlate, for the same window and interval:
actual admission/attachment success, child callback and content notification
counts, requested WR renders and final tile draws, and `EndFrame`/`SwapBuffers`
counts and duration. Separate a no-mutation rAF counter from an animating page.
If accepted external frames omit final tile draws but spend the budget in swap,
investigate an external-only present transaction there. Such a transaction must
preserve child publication, buffer/fence lifetime, frame completion accounting,
capture fallback and full-damage restoration; merely skipping swap is not a fix.
If admission is zero, resolve the specific failed guard first.

l8ros now reports its Marionette failure was deployment ownership: `device-ca.py`
rejected the installation and the session fell back to the greeter. That is a
reported runtime diagnosis, not independently verified here, and is separate
from the native/INI BuildID mismatch established above.

This follow-up is source/protocol analysis only. No source changes, build,
browser execution or Pi measurements were performed. The combined patch remains
unaccepted; its earlier missing-draw and dispatch defects are not resolved by
the new performance interpretation.
