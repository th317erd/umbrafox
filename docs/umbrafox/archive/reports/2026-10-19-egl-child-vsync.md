# EGL child-surface vsync candidate

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Status: source implemented; final ARM build, normal package and archive
verification passed. Hardware acceptance remains open.
This is the default-off candidate, not the separately measured l8ros prototype.
No desktop or Pi installation, browser restart, or hardware test was performed.

## Change

`NativeLayerRootWayland::PrepareForEGL` registers the successfully attached child
as the parent `WaylandSurface`'s external vsync source. Reusing that child keeps
its pending callback; rejection, failed preparation, clear/unmap and shutdown
retire the registration. Parent observer state is mirrored initially and on
transitions, without replacing the existing root callbacks or emulation policy.
Removing the parent consumer also retires the child source and blocks subsequent
registration while that consumer is absent.

The child callback rearms normally, then routes through the parent under its
existing mutex. Registration generations reject callbacks copied before source
replacement, including detach/re-attach of the same child. The existing window
vsync callback is copied under the mutex and invoked after unlock. Already
accepted notifications can finish after concurrent retirement; they hold their
consumer alive and do not access the native root after shutdown.

Review found two additional interleavings, corrected before compilation:

1. A child can rearm after EGL's protocol commit but before
   `NotifyEGLSwapLocked` clears the dirty flag. Forwarding now explicitly requests
   the synchronized parent commit after accepting the generation, before invoking
   downstream vsync/deduplication. It takes the same root mutex held through EGL
   prepare/swap, never commits through an in-progress transaction, and does not
   attach or replace the parent's EGL buffer.
2. An already-entered protocol listener can wait for the child lock while another
   thread replaces its callback. `WaylandSurface::VSyncCallbackHandler` now rejects
   obsolete non-null callback identities before clearing callbacks, updating
   visibility, or copying the replacement handler. The existing native route gets
   this stale-event rejection too; valid events are unchanged.

The upstream Wayland client dispatch implementation retains the callback proxy
through listener invocation, so its address is not recycled while that dispatch
is executing. See `increase_closure_args_refcount`, `dispatch_event` and
`destroy_queued_closure` in the [primary source mirror](https://raw.githubusercontent.com/wayland-mirror/wayland/main/src/wayland-client.c).
This source check is not an identity check of the installed Pi library.

There is no new IPC, synthetic refresh timer, forced-composition loop, per-frame
main-thread task, fence deletion, or promotion-policy change. EGL still owns its
parent buffer/swap; callback-only commits maintain synchronized-child pacing.

Final review also found a startup case: if the root is fully covered before its
first callback, successful EGL swaps had not updated `mBufferAttached`. The
existing emulation predicate could therefore keep rearming alongside real child
callbacks. `NotifyEGLSwapLocked` now records successful attachment, without
claiming visibility or changing timer policy. Failed swaps never call it, and
unmap/remap clears the flag. One already queued emulated callback may run but
does not rearm while mapped with a buffer. Independent source review confirmed
this path and the correction; no occurrence on hardware has been established.

## Verification

- Initial source-contract tests: five failures, one pass, before implementation.
- Review races and parent-consumer removal each had failing checks before their
  corrections. A startup-attachment check also failed before its correction.
  Final suite: 14 passes, including 11 in-memory guard-removal
  controls. These inspect source wiring, not executable native behavior.
- Python and changed C++ formatting/lint passed. Seven package-verifier tests
  passed with the new expected BuildID and rejection of the previous BuildID.
- Independent review identified the two races above. The final parent-consumer
  removal checks were reviewed by the implementing agent, not the sidecar.
- No reusable headless Wayland fixture was found in the inspected widget/gtest
  infrastructure. No compositor-backed lifecycle test or native gtest execution
  is claimed.
- First ARM configure passed in 27s; normal build/link passed in 231s; normal
  `mach package` passed in 66s. All commands exited zero with no remaining owned
  process group. BuildID `20261019183200` passed archive/source verification but
  is superseded by the startup correction. Its archive hash is
  `a98554ad8e902b421f704c76adc951d40eef9c3f10c0e26fe56684a590129a94`.
- Superseded source freeze 5 is
  `ac4a70cea2bbab0f6e5e4f616652cbb1407f0213db378d26f13ad82c38b618cd`.
  Freeze 4 was superseded before any compilation. The previous exported archive
  still matches `fac5017606879b8ed8b9dd4f7490df95a85a2bec8c3a1892cb283352e459a515`.
- Final candidate BuildID is `20261019185219`: configure 18s, build/link 180s,
  normal package 51s, all exit zero with no residual owned process groups.
  Source freeze 6:
  `c347f71a91b42ef11b94f529de2672be5700216a380b1946ea8535594727bda7`.
  Final verification passed: 25 owned source files and 485132 unchanged base
  files; matching generated/native/INI BuildIDs; 28 AArch64 ELF files and their
  packaged dependencies; staging/archive/extraction equality and both omnijar
  CRC inventories. No overlay was injected.

## Artifact

[ARM candidate archive](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/exports/umbrafox-hybrid-20261019185219/umbrafox-hybrid-20261019185219-linux-aarch64.tar.xz)
is 100334096 bytes, SHA256
`41159d834b9fbef045928159416c179a00c753164edfb6824ab2fa2885323ff9`.
[Machine-readable package receipt](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/exports/umbrafox-hybrid-20261019185219/package-input.json)
records the exact inputs and limitations. The export includes the source patch,
freeze, configuration, ELF identities and verification evidence. Source remains
an uncommitted owned patch against the pinned base; no signing or CI result is
claimed. Both earlier archives are retained unchanged.

Tests are in
[the hybrid test directory](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/tools/umbrafox/tests/hybrid).
Run with `python3 -m unittest discover -s tools/umbrafox/tests/hybrid -p 'test_egl_vsync_*.py' -v` from the repository.
The export's `evidence/source-contract` subtree also preserves the checks and
their exact source inputs; these are source-contract checks, not live native
tests.

## External Acceptance

The feature remains default-off under
`gfx.webrender.compositor.external-surfaces-in-draw`. The previous exact color
representation and modifier-advertisement gates remain in effect. Stock
Cage/wlroots 0.19 lacks the required representation protocol; this package must
not be described as an optimization on that unmodified stack.
This gate is startup-scoped: retain the working Draw configuration, enable only
the new pref in a disposable profile and restart for the candidate arm. Do not
force the Native/Layer compositor; the prototype's marker file does not enable
this implementation. Confirm actual admission, not just the pref value.

On a compatible compositor and disposable profile, validate video and page
cadence concurrently, not in separate arms: 1080p60 >=57fps/<5% drops and page
>=470/480 intervals <=18ms. Preserve decoded/presented/drop definitions and actual
elapsed windows. Record child and parent callbacks plus content-vsync boundaries
with bounded logs; `MOZ_LOG=WidgetVSync:5,timestamp` exposes the existing window
source's routed callback messages.

Required lifecycle cases: parent disabled before registration; enable/disable;
same-child repeated preparation; source replacement and same-pointer re-attach;
duplicate timestamp followed by a later timestamp; invalid admission, chroma
change and import failure; paused/ended video; promotion exit/re-entry; hidden
window, unmap/remap; consumer shutdown and renderer destruction. Verify no stale
surface, continued callback rearming, reference release and no idle busy-loop.
Exercise fallback capture/readback and mixed foreground content too.

This patch addresses source-proven missing routing and races. It does not prove
the cause or resolution of the field freeze, scanout, or performance. Hardware
acceptance, asynchronous import acknowledgment and release signing remain absent.
Default behavior retains Firefox interfaces and timing sources; opting into the
experimental backend is an explicit user configuration, not a new default.
