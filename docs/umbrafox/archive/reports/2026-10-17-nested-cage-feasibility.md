# Nested Cage: Purpose, Bypass, and Falsifier

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Read-only analysis for l8ros, 2026-10-17. No source/configuration changes,
compiler, compositor, browser, deployment, or Pi commands were run. The build2
diagnostic remains closed. Runtime and rollback belong to l8ros.

## Verdict

The inner Cage is intentional session isolation, not merely a fullscreen
workaround. Removing it is a worthwhile performance experiment, but **not a
safe one-line production launcher change**. Both compositors already receive
the initial-fullscreen fixes. The outer exposes no public Wayland listener and
admits one revocable client; the unchanged release browser uses additional
Wayland connections. A connected FD alone is not that multi-connection endpoint.

Two compositor processes do **not** establish two full-area GPU renders.
wlroots 0.19 can forward a client DMA-BUF through its Wayland output without
rendering it. Which stages currently render, forward, or wait is unmeasured.
The browser's Wayland proxy transfers protocol bytes/FDs; it is not another
pixel compositor.

## Why It Was Built This Way

The inspected local producers are l8ros `cbdc4d864f5a4817f2cce956ac0ce1a5eb813dce`
and l8ros-server `1eea48a11900ee289d7effb100331cdcc3701c88`; inspected files have
no local diff. Installed binary equivalence to these producers is not independently
proved by a version string. Coordinator supplied the live topology and ELF IDs.

- [launch::browser](/home/public/wyatt-desktop/Projects/l8ros-workspace/l8ros-server/src/session/launch.rs:95)
  launches `dbus-run-session -- cage-session -s -- umbrafox ...` for the
  persistent-display route. It passes the broker's connected FD through
  `WAYLAND_SOCKET`, selects `WLR_BACKENDS=wayland`, retains the real profile UID,
  profile path, API socket and supervised process group.
- [display::Lease::open](/home/public/wyatt-desktop/Projects/l8ros-workspace/l8ros-server/src/session/display.rs:111)
  creates a socketpair. Root passes one end to the outer compositor and delivers
  the other once to the registered launcher. This is not a socket name.
- [cage.patch](/home/public/wyatt-desktop/Projects/l8ros-workspace/l8ros/display/cage.patch:17)
  removes `wl_display_add_socket_auto` and outer `WAYLAND_DISPLAY` publication.
  [curtain.c](/home/public/wyatt-desktop/Projects/l8ros-workspace/l8ros/display/curtain.c:142)
  accepts exactly one client through root control. Revocation destroys that
  client, hides its contents, clears focus and waits for neutral-frame presentation.
  Broker EOF also revokes it. `/run/l8ros-display/control.sock` is the control
  protocol, **not a Wayland display socket**.
- The inner compositor provides a normal per-profile Wayland server to the
  browser and helpers. All its surfaces are represented under one outer client;
  revoking that client cuts off display authority even with retained descriptors.
  Outer globals exclude capture, virtual input and cross-profile clipboard.
  [Historical acceptance](/home/public/wyatt-desktop/Projects/l8ros-workspace/l8ros/docs/umbrafox/archive/reports/graphical-handoff-2026-09-23.md:81)
  was specifically persistent KMS ownership, real PAM/logind profiles, no console
  flashes, readiness-gated reveal, and revocation across logout/crash.
- [build-display.sh](/home/public/wyatt-desktop/Projects/l8ros-workspace/l8ros/scripts/build-display.sh:12)
  applies renderer recovery and `cage-native.patch` **before** copying the tree
  for `cage-session`. Therefore both variants contain the fullscreen lifecycle
  fixes. Inner [idle-policy.c](/home/public/wyatt-desktop/Projects/l8ros-workspace/l8ros/display/idle-policy.c:68)
  forwards playback inhibition to the outer; direct clients would instead need
  their own inhibition honored there. Pointer protocol differences also matter:
  outer relative-pointer transport was removed to prevent doubled nested motion.

The local image service still contains a VM pixman setting; it is not evidence
of the current Pi renderer. Use the coordinator's installed environment, not that
template, for any experiment.

## Why Deleting the Inner Command Is Insufficient

Release source `c0e7f8a2be0460695c1f65ae8796b09c1082480c`, with all four
following retained files independently verified byte-identical to the commit:

1. [WaylandProxy::SetupWaylandDisplays](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/third_party/wayland-proxy/wayland-proxy.cpp:822)
   requires `WAYLAND_DISPLAY_COMPOSITOR` or `WAYLAND_DISPLAY`, checks the pathname,
   and opens a new connection in `ProxiedConnection::ConnectToCompositor`.
   There is no `WAYLAND_SOCKET` handling in that proxy. Failure to create the proxy
   is not by itself fatal: GTK may still consume the supplied FD.
2. [nsAppRunner](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/toolkit/xre/nsAppRunner.cpp:5481)
   restores the real display pathname after the main GTK connection specifically
   for further connections, including graphics probes.
3. [GfxInfo::FireTestProcess](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/widget/gtk/GfxInfo.cpp:646)
   launches a separate `gfxtest`; its
   [wayland_egltest](/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/source/toolkit/xre/gfxtest/glxtest.cpp:1022)
   independently calls `wl_display_connect(NULL)`. Missing connection is recorded
   as a graphics-probe error, not a valid same-renderer comparison.

[libwayland's connection API](https://wayland.freedesktop.org/docs/html/apb.html#Client-classwl__display)
uses `WAYLAND_SOCKET` for an already-connected stream. Inspected
[1.23.1 implementation](https://gitlab.freedesktop.org/wayland/wayland/-/blob/1.23.1/src/wayland-client.c#L1321)
marks it close-on-exec and unsets the variable after consumption. Duplicating that
FD does not create a second independent Wayland connection/object namespace.
Disabling the browser proxy does not solve the later connection requirement.
Do not point the browser at the control socket, loosen runtime permissions, or
leave it accidentally reconnecting to the old inner socket.

## Does Nesting Add a Render?

[wlroots 0.19 scene](https://gitlab.freedesktop.org/wlroots/wlroots/-/blob/0.19.0/types/scene/wlr_scene.c#L1889)
can submit its single eligible buffer directly instead of drawing the scene.
The [Wayland output backend](https://gitlab.freedesktop.org/wlroots/wlroots/-/blob/0.19.0/backend/wayland/output.c#L192)
tests the parent's advertised format/modifier, imports the same DMA-BUF planes,
and attaches the resulting `wl_buffer` to its parent surface. The primary-buffer
test requires matching output dimensions and no crop. Multiple scene entries,
ineligible geometry/formats or other rejection can require rendering instead.
Even forwarding retains an extra scheduling/feedback boundary.

The Wayland backend also supports explicitly submitted output layers as
subsurfaces, but the stock 0.19 scene path does not assign those layers. Thus the
current stack does not automatically transport an arbitrary browser subsurface
tree to DRM planes. This is distinct from single-buffer forwarding.

No active Overlay is required for a successful single-compositor experiment:
Primary can scan out a forwarded buffer. Conversely, a new framebuffer ID alone
does not prove video identity or a removed GPU pass. For causal attribution,
retain each compositor's direct-scanout versus scene-render decision, buffer
identity/format/size and presentation feedback, if available without perturbing
the measurement. Do not interpret a DMA-BUF import log alone as forwarding:
newly rendered compositor output is also a DMA-BUF.

## Ranked Minimal Routes

1. **Cheapest experiment, no browser build:** separately authorize a disposable
   one-user harness using the existing patched `cage-session` as the sole DRM
   compositor. Establish its matched nested control using the same outer binary
   and renderer first. Schematic argv only, not executable until the coordinator
   supplies the retained environment, seat access, profile and rollback:

   ```text
   A: same DRM Cage -> Wayland Cage -> same browser wrapper/argv
   B: same DRM Cage ----------------> same browser wrapper/argv
   ```

   Both use normal private per-user display listeners and unchanged browser
   proxy/probe behavior. Keep the browser non-root. Do not run a second DRM owner
   concurrently or grant new broad device permissions. This temporarily replaces
   the product session/display lifecycle, so requires explicit maintenance-mode
   isolation, no profile switching, timed rollback and SSH recovery. It is **not**
   production acceptance. If harness A does not reproduce the production deficit,
   A/B cannot attribute the production problem to nesting. Merely comparing the
   current restricted outer against a different standalone Cage confounds policy
   and topology; characterize that separately.
2. **Smallest product-preserving design:** extend the existing OS display lease
   from one client to a bounded, active-session group, with a private reconnectable
   endpoint supporting GTK/proxy/gfxtest. Retain broker UID/session/scope authority;
   reject stale/foreign admissions; close the listener and every admitted client
   before the existing neutral-frame acknowledgement. Do not rely on pathname
   permissions or UID alone for same-UID stale-session revocation. Then
   `launch::browser` drops `cage-session -s --`, uses the admitted display pathname,
   clears stale `WAYLAND_SOCKET`/display overrides, and retains DBus, profile,
   native Wayland settings, API/bootstrap, process supervision and readiness.
   This changes outer/broker/launcher code, not browser code. It uses standard
   Wayland on the browser boundary and requires no website JS/custom browser IPC.
   Review browser-facing globals too: the outer's transport allowlist omits
   clipboard/data-device and relative-pointer protocols that the inner normally
   supplies. Do not silently remove browser functionality or expose cross-profile
   state. Any admitted clipboard/input state must be session-scoped and cleared
   on revocation. Endpoint admission, protocol parity and cleanup need a separate
   reviewed implementation plan.
3. **Retain topology, reduce its cost:** preserve existing lifecycle and diagnose
   failed single-buffer forwarding at inner/outer first. For multiple visible
   surfaces, explicit layer forwarding and DRM assignment is larger work, with
   UI ordering/color/synchronization constraints from the prior plane report.
   It can avoid a render while still having two compositors; it is not literally
   a single-compositor route.

## Falsifiable A/B and Safety Gates

Before a timed arm, verify native Wayland, successful graphics probe, same
hardware WebRender/decoder/renderer, the intended one/two-compositor process and
connection graph, no obsolete inner process/socket, correct input, video colors,
fullscreen enter/exit and playback inhibition. A software-renderer fallback is
an invalid arm, not a performance result. Product route additionally needs
broker loss, browser loss, revoked-FD/reconnect refusal and profile-switch tests
using the existing display-control/recovery fixtures, extended for all clients.

Use A-B-B-A, fresh equivalent sessions, fixed coded 1920x1080 60fps video/codec,
1920x1080 **actual 60Hz** output, scale, browser/package/profile prefs, Ambient
setting, UI visibility, cursor and audio. At least 60 seconds settle, then 120
seconds per arm, no profiler. Reject stalls, rendition/refresh/renderer changes
or throttling. Record raw start/end counters and elapsed time; retain the existing
present-submitted, decoded/total, dropped and presented-ratio definitions without
equating browser submissions to photons. Capture DRM plane/CRTC/FB state at
start/end and bounded interior samples; never require a nonzero Overlay for this
topology hypothesis.

Predeclare a material gain (suggest at least 10fps with both B arms outside the
A range); the near-60 objective is at least 95% of source cadence and at most 5%
drops. A repeatable B gain supports a topology/policy cost, **not automatically
two removed GPU passes**. Unchanged performance with verified same route rejects
nesting as the dominant cap for this workload. A small gain establishes only a
partial contributor. Improvement with zero Overlays is still useful and may be
Primary forwarding or reduced scheduling/rendering overhead.

Proposed bounds: 30 seconds for startup/readiness, 180 seconds maximum settling,
120 seconds capture, 30 seconds graceful cleanup per arm; 30-minute whole-trial
watchdog plus an independently armed restoration path. Timeout means invalid arm
and restore, not an invitation to force-kill unrelated sessions. l8ros must pin
the actual installed service/drop-ins, paths and restoration commands before use.
Preserve the existing known-good R package and session configuration.

## Verification Scope

Read local producers, session contracts and upstream version-specific code;
verified the four browser files against the release commit and inspected l8ros
file status. No runtime conclusion or safe-direct-launch claim was manufactured.
wlroots Wayland output source SHA256:
`773b677434550ef2caf9c4b55d90baba21fe1cca58fe54e0f9b85576c412f514`.
Key local SHA256 prefixes: launcher `9f0dcb98`, display lease `baad9cfa`,
curtain `0d1616b3`, Cage patch `a561a3d4`, native patch `fcf8b51c`,
build script `14c3912c`. Runtime binary/source correspondence and real path
acceptance remain coordinator-owned gates.
