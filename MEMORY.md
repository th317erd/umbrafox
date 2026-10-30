# Umbrafox Full Bot Handoff

Updated October 23, 2026 at 22:53Z, at Wyatt's explicit request for a FULL memory dump.
This top section is the authoritative current handoff. Everything from the previous memory
file (the October 20 dump and the historical archive it carried) is preserved verbatim below
under **Preserved Memory File**. Its old "active", "running", "next" and authorization
statements are historical, not instructions to resume those jobs.

## 1. Immediate Resume Point

The latest engineering exchange was an answer to **l8ros**, who asked four questions about
UmbraLink context targeting, a suspected control-channel exit on the Pi kiosk, a
`navigator.webdriver` confound in their measurements, and a sanctioned parity workflow, and
also asked for our verdict on their attach/skip and vsync-pump patch. That answer is written,
committed and pushed. Nothing is running.

What happened, in order:

1. l8ros filed [the bug report](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/docs/umbrafox/archive/bug-reports/2026-10-23-l8ros-umbralink-context-and-kiosk-exit.md)
   (commit `253e19430b6f`).
2. We verified every claim against source and wrote the answers, appended them to that bug
   report as an `# Answer from Umbrafox (2026-10-23)` section (commit `37684bc7f64e`), and
   recorded the long form plus the patch verdict in
   [the verdict report](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/docs/umbrafox/archive/reports/2026-10-23-umbralink-context-kiosk-exit-and-patch-verdict.md)
   (commit `b3ca97a4a136`).
3. Owner relayed l8ros's reply: they are checking `dmesg` for OOM, because they read our
   finding "nothing drains `pending_native_surface_updates` in Draw mode" as a plausible OOM
   source. We disagreed on magnitude and on correlation, in chat only; the argument is
   recorded in section 8 and is worth repeating if they come back with an OOM report.

Current conclusions that other sessions must not quietly reverse:

1. **The leak is real but tiny.** `NativeSurfaceOperation` is 24 bytes; the patch queues two
   per promoted video surface per composed frame, about 2.9 KB/s or 10 MB/hour, ~0.8 MB over
   five minutes. It is unacceptable but it is not a plausible cause of a browser dying minutes
   into a run, and it grows during playback, not while a control client is connected.
2. **No UmbraLink command can close a window or quit.** `close` refuses the last tab in a
   window; only `script.execute` with `realm: "browser"` can terminate the app, by design, and
   l8ros never called it. On Linux the app does exit when the last top-level window is
   destroyed, so there is no windowless survival mode to rely on.
3. **Merely running Marionette sets `navigator.webdriver`**, from first paint, with no session
   and no attached client. Every l8ros measurement so far is therefore automation-tainted and
   must not be used for acceptance. UmbraLink leaves the flag false and is the sanctioned
   measurement path.
4. **The attach/skip hunk is not acceptable as-is** even though the problem it names (content
   starved of ticks when WebRender stops compositing) is real. Skip without an attach result,
   no queue consumer, cache bypass, per-frame `exists()` syscalls, and a permanent
   process-global software-vsync override.
5. **Their 56.9 fps / 5.1 % row cannot yet be interpreted.** Depending on whether our hybrid
   admitted their frames, it is either "our EGL external root works and the pump fixed content
   ticks" or "no video pixels reached the screen"; presented-frame counters cannot distinguish
   those. A bounded admission counter is the missing instrument.
6. Our own official hybrid candidate is unchanged and still unaccepted on hardware:
   BuildID `20261019185219`, default-off pref, ARM build/package/evidence verified, hardware
   performance, lifecycle and visual acceptance never established.

There is no active tool goal. There is no owned build, package, browser, test or command
session to resume. Do not create a goal unless explicitly requested. No current teamwork DB
was assigned; the historical DBs belong to completed waves.

Next useful work, none of it started:

1. Wait for the OOM answer. If `dmesg` shows a kill, attribute it before theorising: per-process
   memory from `performance.snapshot` or `smaps_rollup`, parent versus content/RDD. The likely
   candidate is decoder/V4L2 buffer pressure plus DMABUF imports that are locked every frame
   but never displayed when the draw is skipped, not the 24-byte queue.
2. Implement the content-tick fix correctly on our side, in the existing external-root
   design: per-widget fallback source, real rate, engage only while the Wayland callback is
   stalled, full lifecycle. Never a process-global static.
3. Add the bounded admission counter (already proposed on October 20) so that admission,
   attachment, child callbacks, WR final draws and EndFrame/swap can be attributed per run.
4. The V4L2 M2M hardware H.264 decode task is assigned to Umbrafox and not started
   (`docs/umbrafox/archive/plans/2026-10-21-hardware-video-decode-pi4.md`).
5. Keep the shipped hybrid pref off for any acceptance run until the above is measured.

## 2. Owner Intent, Authority and Boundaries

Wyatt wants a fast, reliable power-user Firefox fork. Browser defaults must stay
Firefox-equivalent to websites and servers. Read the mandatory rulebook before any source work:
[rulebook](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/docs/umbrafox/conversion-guide/02-mandatory-modification-rules.md).
No new detectable default JS, DOM, WebIDL, network, media, storage, timing or fingerprinting
surfaces. No silent rule exception.

Standing owner instructions relevant here:

- Browser source, review, isolated build, package and artifact integrity are ours. Pi
  deployment, compositor/session changes, hardware measurement and restoration are l8ros's.
- Wyatt's daily desktop browser is not a disposable test process. Do not close, restart,
  attach, navigate or modify its profile without explicit authorization for that action. At the
  time of this dump it is PID 1460580, up 4 days 6 hours, running the dated
  `20261001103920` (158.0a1) build under the `umbrafox-debug.py` logging wrapper, and was not
  touched.
- Preserve artifacts, rejected attempts and diagnostic evidence. Never overwrite a verified
  export, fabricate a receipt, or turn a partial observation into a conclusion.
- Never SIGKILL without explicit direction. Cleanup is identity-bound and bounded.
- Default significant Cargo and make work to two jobs. The old eight-job override belonged to
  the October 16 diagnostic build.
- Reports under `docs/umbrafox/archive/reports/`, plans under `docs/umbrafox/archive/plans/`, bug-report answers inside
  the bug report itself, durable bot documentation under `docs/umbrafox/archive/`.
- Commit messages in this fork's doc commits are terse and single-line (`bug report from
  l8ros: ...`, `plan: ...`, `answers for l8ros: ...`), unlike the `No bug - ... r?#group`
  form used for source commits.

## 3. Bootstrap and Tooling

After session start or compaction read, in order:
[startup](/home/public/wyatt-desktop/.bot-common/startup.md),
[global quirks](/home/public/wyatt-desktop/.bot-common/quirks.md),
[global rules](/home/public/wyatt-desktop/.bot-common/rules.md), then
[AGIS runtime](/home/public/wyatt-desktop/Projects/agis/docs/runtime.md).
Finish bootstrap with `Fired up!` and continue the active task.

Project root:
`/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox`, whose local alias is the
usual desktop home checkout. Owner-facing paths must use the share root, never `~`.

Project context directories: `.codex/` is the live one on this host and holds the 9,049-line
[DETAILS.md](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/.codex/DETAILS.md)
ledger. `.pi/` does not exist here; Pi instructions say it should be the project-context
directory for this harness, so creating a small `.pi/DETAILS.md` pointer remains an open,
offered-but-unapproved idea. `.codex/quirks.md` and `.codex/rules.md` do not exist.

Skills that matter for this lane: `umbrafox-link` (UmbraLink work), `share-path` (every path
handed over), `firefox-desktop-frontend` (JS/HTML/CSS), `mozlint`, `documentation`,
`profiler-analysis`, `firefox-commits`, `find-reviewer`, `diagnose-crash`.
`searchfox-cli` is installed (0.18.0, 0.20.5 advertised; no upgrade performed) and is the right
tool for upstream discovery; local searches stay narrow and scoped.

## 4. Checkout and Worktree State

```text
HEAD        b3ca97a4a136b06de7c41e6169d076d0dedab436
subject     review: UmbraLink answers and verdict on the l8ros attach/skip and vsync-pump patch
main        == origin/main == b3ca97a4a136 (pushed to github.com:th317erd/umbrafox.git)
```

Worktree after this dump's commits: 24 modified tracked files plus one untracked new file in the
owned hybrid surface, which is the only source deliberately left uncommitted, and 785 untracked
entries that are pre-existing upstream remnants (543 under `testing/web-platform`, then
`mobile/android`, `browser/extensions`, `js/src`, `third_party`). Every `bot-docs` plan, report and
bug report, and the metadata/evidence of the three hybrid exports, are committed; the packaged
tarballs and extracted trees under `exports/` stay git-ignored.

All **25 owned source files still match the October 19 source freeze**
([source-freeze.json](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/exports/umbrafox-hybrid-20261019185219/source-freeze.json)),
rehashed during this dump: 0 mismatches. They remain deliberately uncommitted:

- `gfx/layers/NativeLayerWayland.cpp`, `.h`
- `gfx/webrender_bindings/RenderCompositor.cpp`, `.h`, `RenderCompositorEGL.cpp`, `.h`,
  `RendererOGL.cpp`, `WebRenderAPI.cpp`, `src/bindings.rs`
- `gfx/wr/webrender/src/composite.rs`, `composite/draw_external.rs` (untracked new file),
  `lib.rs`, `renderer/composite.rs`
- `modules/libpref/init/StaticPrefList.yaml`
- `widget/gtk/DMABufFormats.cpp`, `.h`, `DMABufSurface.cpp`, `.h`, `GtkCompositorWidget.cpp`,
  `.h`, `WaylandSurface.cpp`, `.h`, `nsWindow.cpp`, `.h`
- `widget/tests/gtest/TestDMABufSurface.cpp` (native DMABuf fixture; compiled, never executed
  on ARM)

`gfx/wr/webrender/src/composite/draw_external.rs` is the 25th file and is untracked, not
modified; `source-freeze.json` is the authority for this list.

Never clean, reset or revert the worktree. Never archive the whole dirty tree as build input.
Builds use an exact `git archive` plus a frozen owned patch and new-file manifest.

## 5. Commits Since the October 20 Dump

| Commit | Content |
| --- | --- |
| `253e19430b6f` | l8ros bug report: UmbraLink context targeting, possible kiosk exit, webdriver confound (77 lines) |
| `d3981ab0ded2` | l8ros handover of the attach/skip and vsync-pump patch plus its report: `docs/umbrafox/archive/patches/2026-10-21-l8ros-attach-skip-and-vsync-pump.patch`, `docs/umbrafox/archive/reports/2026-10-21-l8ros-browser-changes.md` (134 lines) |
| `eab631adf751` | plan: hardware H.264 decode via V4L2 M2M on Pi 4 (75 lines) |
| `9cb566b33a1d` | plan: assign that task to Umbrafox with a task list and acceptance (14 lines) |
| `37684bc7f64e` | answers to the four l8ros questions appended to the bug report (93 lines) |
| `b3ca97a4a136` | long-form answers plus the attach/skip and vsync-pump verdict report (268 lines) |
| `668d5cec5d9d` | this memory dump and the October 23 `.codex/DETAILS.md` entry |
| `dac44f76bd57` | the 23 previously untracked October 15-20 plans and reports (4,449 lines) |
| `0bac4b7e4ed0` | metadata, evidence and source patch of the three hybrid exports (52 files) |

The preceding source commits are unchanged: `9a9057291b5b` (clipboard prototype preserved
inactive), `47e6fdeb78fe` (per-site clipboard cancellation overrides), `25de5d0b584d`
(Chrome-style Linux shortcut preset), `ed5c2e1dea6e`, `c0e7f8a2be04`, `f977a5f9e337`,
`d74c12c71fdf`.

## 6. UmbraLink: Facts Established This Session

Sources: `toolkit/components/umbrafox/*.sys.mjs`, `toolkit/components/umbrafox/docs/control.md`,
`tools/umbrafox/tests/control/*.mjs`, `browser/components/BrowserGlue.sys.mjs`,
`toolkit/components/startup/nsAppStartup.cpp`.

Discovery and lifecycle:

- Starts only when `umbrafox.control.enabled` is true, from `BrowserGlue._beforeUIStartup`, and
  stops in `BrowserGlue._dispose`. A start failure only logs; it never quits the app.
- `umbrafox.control.port` `0` allocates an ephemeral port. Discovery file is
  `<profile>/umbrafox/control.json`, mode 0600, containing `host`, `port`, `path`, `token`,
  `websocketUrl`. Treat the token as a credential.
- UmbraLink starts neither Marionette nor the Remote Agent, changes no pref that is
  web-visible, and installs no page globals.

Command surface (complete; there is no enumeration or lookup command):

`status`, `diagnostics.snapshot`, `diagnostics.dumpMemoryReport`, `gfx.snapshot`,
`media.snapshot`, `performance.snapshot`, `performance.profile.dump`,
`browsingContext.create`, `browsingContext.close`, `browsingContext.navigate`,
`script.execute`, and `input.click|pointerMove|pointerDown|pointerUp|wheel|keyDown|keyUp|type`.

Targeting:

- `diagnostics.snapshot` returns `processID`, `profileDir`, distinguished memory, and
  `windows[] -> tabs[]` each with `context`, `browserId`, `label`, `url`, `selected`, `pinned`,
  `process`, `memory`. Its `context` is the value to pass to every other command.
- `getTarget()` in `UmbrafoxControlBrowser.sys.mjs` requires `params.context` to be a safe
  integer >= 1 that resolves to a live top-level content context with a `currentWindowGlobal`
  and a `gBrowser` tab; otherwise it throws `invalid argument` / `no such frame` **before** any
  listener or load exists. A rejected `navigate` is therefore inert.
- `create` takes the context of an *existing* tab whose window hosts the new tab, so it cannot
  bootstrap the first context. `close` refuses the last tab in a window.
- `navigate` accepts `http`, `https`, `about`, `file`, `data`, `wait` of `complete` (default) or
  `none`, and `timeoutMs`. Completion is a load boundary, not network idle or HTTP success.
  Re-read `context`/`document` from the receipt afterwards.
- `script.execute` takes `context`, `body` (async function body, <= 65536 UTF-16 units),
  `realm` `page` (default; tab or frame, page-principal sandbox, no `Services`) or `browser`
  (top-level tab only, system privileges, can close the browser), plus optional `args`,
  `document` (inner-window identity guard) and `timeoutMs` (1..60000, default 10000). One
  operation per context, 16 overall; conflicts return `busy`.
- Input commands synthesize real pointer/wheel events on the chrome window at content
  coordinates, and key/type events through a content actor.

Exit semantics, which is what l8ros needed:

- No command closes a window or quits. A client disconnect aborts only that connection's waits;
  `stop()` closes sockets and removes `control.json`.
- `script.execute` with `realm: "browser"` is the one documented way control can terminate the
  app, because it runs with system privileges.
- On Linux a destroyed top-level window calls `ExitLastWindowClosingSurvivalArea()` ->
  `Quit(eConsiderQuit)` in `nsAppStartup`, so the app exits with zero windows. Only macOS and
  the Windows `mAllowWindowless` path survive windowless.
- Diagnostics are read-only, but `diagnostics.snapshot` (`sizeOfTab`) and `media.snapshot`
  (per-element media reads) are the only commands that walk live content objects, which makes
  them the interesting suspects in any parent-side fault.

Sanctioned parity and measurement path:

- `docs/control.md` is the protocol contract and explicitly records that these commands do not
  start Marionette/Remote Agent/WebDriver, do not change `navigator.webdriver`, and do not
  install page globals.
- `tools/umbrafox/tests/control/parity-smoke.mjs ABS_BINARY NEW_OUTPUT_DIR` launches two fresh
  headless processes without automation flags, UmbraLink OFF and ON, and asserts
  `navigator.webdriver === false` plus unchanged page globals, prototypes and native function
  strings. It is an identity smoke test, not a benchmark, and the output parent must exist.
- Browser integration tests: `./mach test --headless
  toolkit/components/umbrafox/tests/browser/browser_control_service.js`, `..._browser.js`,
  `..._input.js`. Pure tests: `node --unhandled-rejections=strict --test
  tools/umbrafox/tests/control/control-spec.mjs`.

## 7. `navigator.webdriver` and Marionette

Source facts (`dom/base/Navigator.cpp`, `remote/components/Marionette.sys.mjs`,
`remote/components/RemoteAgent.sys.mjs`):

- `Navigator::Webdriver()` returns true when `nsIMarionette` or `nsIRemoteAgent` reports
  `isBrowserAutomationRunning`, which is `server running && isBrowserAutomation`.
- `#isBrowserAutomation` defaults to **true** and is set when the server starts listening,
  before any session or command, and is published to content processes through shared data.
  A browser launched with `--marionette` or `MOZ_MARIONETTE=1` therefore reports
  `navigator.webdriver === true` in every tab from first paint, with or without a client.
- `startAtRuntime({isBrowserAutomation: false})` (pref `remote.experimental.dynamicstart.enabled`)
  leaves the flag false. It is stock Gecko tooling behaviour, not a fork change, and is not a
  measurement recommendation: it is still an automation server, and using it to dodge site
  heuristics is out of bounds.
- UmbraLink touches none of this.

External corroboration that a ~1 minute YouTube teardown on this flag is a site-side behaviour:
[keyolk/tweb PR #153](https://github.com/keyolk/tweb/pull/153) — YouTube erroring at ~35-60 s in a
headed, off-screen Chrome with no CDP client ever attached (`navigator.webdriver = true`), the same
video playing past 129 s with the flag off, and YouTube returning 123-byte `videoplayback`
responses from ~11 s. Chrome+CDP, so it does not prove Gecko is treated the same, but the
web-visible signal is identical and the shape matches l8ros's observation.

Consequences: l8ros's numbers are automation-tainted and cannot be an acceptance gate; the
teardown truncates the measurement window and changes page state. The falsifying experiment is
one UmbraLink-only run asserting `navigator.webdriver === false` before and after. Never propose
UA/DOM/flag hiding to defeat the heuristic.

## 8. l8ros Attach/Skip and Vsync-Pump Patch: Verdict

Input:
[patch](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/docs/umbrafox/archive/patches/2026-10-21-l8ros-attach-skip-and-vsync-pump.patch),
SHA256 `c133e8a83ac81ef930b2b72d2c57efc713f575f0590a2b4c297e12615a51ec95`, 3 files, applies on
top of `hybrid-source.patch`. Reviewed against `b3ca97a4a136`. **Not merged, not accepted as-is.**

The problem it names is real: with the hybrid active, content must not depend on a WebRender
composite for its tick source, and ~6 ticks/s instead of 60 is exactly a starved widget vsync
callback. Keep that as a design input.

Defects, verified in source:

1. **Skip without admission.** `renderer/composite.rs` skips drawing any `ExternalSurface` with
   `external_image_id.is_some() && update_params.is_none()`. No pref check, no attach result, no
   opacity or exact-coverage check, no readback/capture exclusion. If attachment failed, the
   ordinary Draw path was displaying the video and this deletes it.
2. **No consumer for the queues it fills.** The `tile_cache/mod.rs` hunk calls
   `create_compositor_external_surface()` and `attach_compositor_external_image()`, which only
   push into `ResourceCache::pending_native_surface_updates`. In `CompositorConfig::Draw` the
   only drain site, `Renderer::update_native_surfaces`, does nothing but
   `debug_assert!(...is_empty())`; optimized builds compile that out (unbounded Vec growth, no
   crash), debug builds abort the parent at the first assert (looks like a silent kill).
3. **Cache bypass.** It creates a fresh `NativeSurfaceId` per call instead of using
   `external_native_surface_cache`, so nothing is ever reused or destroyed.
4. **Syscall in the hot path.** `Path::new("/etc/l8ros-session/video-subsurface").exists()` runs
   per external surface per frame in the draw loop and per tile-cache surface.
5. **It duplicates instead of using the existing seam.** Our hybrid early-returns only when
   `CompositeState::prepare_draw_external_surface(...)` returns `Some(_)`, i.e. the backend
   accepted and attached that exact external image this frame; otherwise it falls through to
   normal Draw. Attach and skip must be one admission-gated decision.
6. **The pump is a permanent process-global override.** `static RefPtr<SoftwareVsyncSource>`
   shared by all widgets, enabled once, hardcoded `1000/60.2`, never disabled or released,
   replacing the Wayland source rather than covering a stalled one, ticking after the window is
   gone. `SetVsyncRate`, `DisableVsync`, `Shutdown` and `gfxPlatform::GetSoftwareVsyncRate()`
   already exist.
7. **The numbers do not support either half.** Reported baseline with the pump off is 12.5 fps /
   79.1 % dropped, far below the earlier ~26-29 fps for the same device, and the pump alone
   (hybrid off) supposedly triples throughput, which contradicts the stated causal chain.

Leak magnitude, computed and already relayed to the owner: `NativeSurfaceOperation` wraps only
the enum, and the two variants here are `{NativeSurfaceId(u64), bool}` and
`{NativeSurfaceId(u64), ExternalImageId(u64)}`, so 24 bytes each. `setup_compositor_surfaces_impl`
is reached from `post_update` once per promoted external surface per frame: two pushes per
frame per video surface, 120/s at 60 fps, ~2.9 KB/s, ~10 MB/hour, ~0.8 MB in five minutes, Vec
doubling included. That is not a plausible OOM cause, and it grows during playback rather than
while a control client is connected, so it does not explain two exits tied to control activity.
If their `dmesg` does show an OOM kill, the likely consumer is decoder/V4L2 buffer pressure plus
DMABUF imports that are locked every frame but never displayed when the draw is skipped.

What we would accept: pref-gated and default-off with no marker files and no per-frame
filesystem access; skip conditioned on an attach result token for that exact external image,
fallback intact, never for capture/readback/partial-present; no `pending_native_surface_updates`
traffic in Draw or Layer without a drainer, with a source-contract test; a per-widget vsync
fallback that owns its source, takes its rate from the widget or `gfxPlatform`, engages only
while the real callback is stalled, and tears down on unmap/hide/pause/destroy; and per-run
evidence of admission result, child callbacks, content tick cadence, WR final draws and
EndFrame/swap, plus a real capture of the TV.

## 9. Our Implemented Hybrid, Unchanged

Startup-scoped pref, default false: `gfx.webrender.compositor.external-surfaces-in-draw`.
The WR compositor stays Draw; the ordinary Native/Layer queues and promotion eligibility are
untouched; an optional `DrawExternalCompositor` interface is installed through the Gecko/Rust
bridge when supported.

Call chain:

```text
Renderer::composite_simple
  -> CompositeState::prepare_draw_external_surface
  -> WrDrawExternalCompositor::prepare
  -> wr_compositor_prepare_draw_external_surface
  -> RenderCompositorEGL::PrepareDrawExternalSurface
  -> NativeLayerRootWayland::PrepareForEGL
  -> NativeLayerWaylandExternal::PrepareForEGL
  -> WaylandSurface::AttachLocked
```

Selection in `gfx/wr/webrender/src/composite/draw_external.rs` requires a resolved external YUV
image in the frontmost opaque fullscreen tile: identity geometry, exact coverage, no crop,
unsupported clip, foreground content or scaling, eight-bit NV12 or planar YCbCr with
Rec709Narrow, using resolved image identity rather than an index into a descriptor vector.

On successful admission/attachment `composite_simple` returns before the ordinary final tile
draw, because the accepted opaque fullscreen child covers the lower tiles. Failure retains
normal Draw. That does not imply earlier WR work, texture resolution, synchronization or the
EGL swap disappear.

The C++ backend resolves the actual `RenderDMABUFTextureHost` and YUV surface, requires a visible
mapped EGL parent, scale one and exact dimensions, uses a dedicated external-only child
lifecycle, holds the root lock proof through preparation and swap, preserves fences and buffer
ownership, hides/clears on rejection, failure, cancellation, unmap or pause, retires a child
whose failed mapping left partial parent state, and disables partial present while the optional
interface is active. `RenderCompositorEGL::EndFrame` still calls `SwapBuffers` on a completed
visible frame even when the final tile draw was skipped — a candidate cost to measure, not a
proven bottleneck and not permission for an unconditional swap removal.

Admission gates that decide real-world success: actual NV12 or YUV420, 8-bit, BT709
transfer/matrix, limited range, non-HDR; exact wire FOURCC mapping with every plane modifier
explicit, equal, and present in the copied advertised-format snapshot; `INVALID` rejected,
`LINEAR` only if listed; `wp_color_representation_manager_v1` plus a supported BT709
limited-range pair. The fallback table injects `INVALID`, so it cannot prove advertisement.
Upstream Cage 0.2.1 with wlroots 0.19 lacks the mandatory color-representation manager;
wlroots 0.20 added the protocol but the compositor must create and advertise it. The actual
browser socket registry on the Pi is still unknown to our lane.

Child-vsync repair already in our tree: parent `WaylandSurface` owns a child source and
generation, registers it after successful external preparation, retires it on rejection,
clear, unmap and consumer removal, propagates observer-enabled state, preserves the parent
`WaylandVsyncSource` callback, rearms outside the child lock, validates generation under the
parent lock, publishes pending state, rejects an already-entered stale callback, and on a
successful EGL swap sets `mBufferAttached = true` and clears pending commit bookkeeping.

`RequestForceCommit` calling `wl_surface_commit` publishes Wayland state; it does not schedule a
WR render, GL draw or EGL swap. Content already has an independent observer path through
`VsyncParent`/`VsyncMainChild`. Do not remove it on the belief that it forces a full redraw.

## 10. Pi Measurements Supplied by l8ros and Their Limits

**These are l8ros-reported observations, not repeated by us, and not necessarily from identical
sources or configurations.**

| Arm / report | Supplied result |
| --- | --- |
| Earlier release baseline, 1080p60 | about 26 fps, 55-57 % dropped |
| Prototype external layer, October 19 | 59.29 fps / 1.2 % dropped |
| Prototype 720p60 | 59.08 fps / 1.9 % dropped |
| Official 06:30 export, pref off/on | 25.42 / 29.11 fps |
| Official 18:52 export | 28.83 fps / 51.7 % dropped; page+video 25 rAF/s |
| Combined prototype build | 40.58 fps / 32.3 % dropped; page+video 37 rAF/s |
| Attach/skip + pump table, 1080p60 H.264 | hybrid off/pump off 12.5 fps / 79.1 %; off/on 31.8 / 47.1 %; on/off 13.4 / 77.9 %; on/on 56.9 / 5.1 % |
| Attach/skip + pump, page cadence | ~6 ticks/s without the pump when the hybrid is active |

Do not transfer the prototype's acceptance to the official guarded implementation. Acceptance
still owed: 1080p60 >= 57 fps and < 5 % drops, page cadence >= 470 of 480 intervals <= 18 ms,
1080p30/720p60 non-regression, concurrent mixed content, actual visual output, seek, fullscreen
and navigation, hide/remap/teardown and resource retirement. Counter improvements alone can miss
blank or stale content.

## 11. Owed to l8ros

1. The five 10-minute kiosk-exit arms with one variable each, stderr captured, 10 s RSS
   sampling: no UmbraLink, `status` every 30 s, repeated `diagnostics.snapshot`, repeated
   `media.snapshot`, repeated rejected `navigate`; plus `systemctl --user show <unit> -p
   Result,ExecMainStatus,ExecMainCode,ExecMainExitTimestamp`, the unit journal and
   `journalctl -b -k` for OOM/Wayland lines. Their side to run, our design.
2. One UmbraLink-only run that asserts `navigator.webdriver === false` before and after.
3. Owed by us: a correct content-tick fallback, a bounded admission counter, and a source or
   artifact only after the above produce attributable data.
4. V4L2 M2M hardware H.264 decode, assigned and not started.

## 12. V4L2 M2M Hardware H.264 Decode (Assigned, Not Started)

Plan:
[2026-10-21-hardware-video-decode-pi4.md](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/docs/umbrafox/archive/plans/2026-10-21-hardware-video-decode-pi4.md).
Owner assigned it to Umbrafox end to end, with l8ros flashing and running acceptance.

- No Raspberry Pi has a hardware VP9 or AV1 decoder. BCM2711 decodes H.264, MPEG-2, MPEG-4 and
  HEVC. On the device: `video10` bcm2835-codec-decode (H.264, V4L2 M2M), `video11` encode,
  `video12` isp, `video19` rpi-hevc-dec.
- Firefox's V4L2 plumbing is compiled in for aarch64+GTK; the codec library is not. The work is
  to vendor `libavcodec/v4l2_m2m.c`, `v4l2_m2m_dec.c`, `v4l2_context.c`, `v4l2_fmt.c` and their
  headers into `media/ffvpx/libavcodec/`, wire `moz.build` (needs libdrm), flip
  `CONFIG_V4L2_M2M` and `CONFIG_LIBDRM` for aarch64 in `media/ffvpx/config_unix_aarch64.h`,
  reuse the VA-API `MOZ_DRM_CFLAGS`, confirm `h264_v4l2m2m` is exported and selected by
  `FindVideoHardwareAVCodec()`, keep software H.264 as fallback when `/dev/video10` is missing
  or busy, then package.
- l8ros already disables VP9/AV1 in MSE (`media.mediasource.webm.enabled=false`,
  `media.av1.enabled=false`, `media.webm.enabled=false`), which steers YouTube onto H.264 and
  reportedly cut drops from ~70 % to ~33 % on the same clip.
- The deliverable is a packaged aarch64 tarball; no source handover without a build.

## 13. Other Lanes, Condensed

Desktop silent exit: cause still unestablished. A logging wrapper is installed at
[launcher](/home/public/wyatt-desktop/Programs/umbrafox) with
[helper](/home/public/wyatt-desktop/Programs/umbrafox-debug.py), writing to
`~/.local/state/umbrafox/launcher-debug/`; `UMBRAFOX_DEBUG=0` disables capture for one launch.
It preserves the existing build/profile/argv choice and does not fix anything. A remote process
exiting 0 is not monitoring of a running browser.

Clipboard protection: prototype implemented, verified and installed **inactive**, with a
separate profile-mapping and activation hold. Do not switch the daily launcher or profile
silently. Chrome hotkey preset is explicit opt-in, not unconditional web-visible change.

ARM artifacts, verified during this dump:

| Item | Value |
| --- | --- |
| BuildID | `20261019185219` |
| Archive | 100,334,096 bytes, SHA256 `41159d834b9fbef045928159416c179a00c753164edfb6824ab2fa2885323ff9` |
| Source freeze | SHA256 `c347f71a91b42ef11b94f529de2672be5700216a380b1946ea8535594727bda7` |
| Source patch | SHA256 `52adb07b853f09b0bd217bae3345472e61987d18f73cf6b3c93b2633161df335` |
| Package receipt | SHA256 `8b6f9078c640116441ec6f6d42d0a135aa4c7525b87629a5a9d1c59766113b58` |
| Evidence manifest | SHA256 `911a15ebfbdbf54f0c225cad2fdcff4aafc2bd30fc794497246cfe9d008ff904` |

Predecessors preserved: `20261019063025` (archive `fac5017606…`, 100,325,400 B) and
`20261019183200` (`a98554ad8e…`, 100,333,104 B). Nothing was installed on the desktop by this
lane. Build root (isolated, ARM):
`/home/public/wyatt-desktop/.cache/codex/umbrafox-hybrid-arm-20261019-candidate1`.

## 14. Stopped Diagnostic and Census Lanes

Do not confuse these with the current non-probe hybrid.

- P1/P2 WebRender diagnostic artifacts and the stopped build2 layout under
  `~/.cache/codex/umbrafox-wr-render-p2-layout-20261016` remain uncertified and closed; matching
  Record layouts were verified only for `RenderDMABUFTextureHost.o` and
  `Unified_cpp_webrender_bindings0.o`, `completeStableClosure=false`. Closure hashes:
  `700c2c03a4f5b918443fc35f2a3bf04090c3695a8e5752884f1fcceeaeae5ccc` and
  `837b78e5029a03708bd35ff444837ed79d9bf93ea7aa754f48c90e3af824188d`.
- The WR promotion census proposal stayed design-only, with the requirements recorded (first WR
  occurrence only, ordered eligibility rows, separate setup and finalization results, versioned
  join, finite fractional geometry, dedicated default-off flag, size caps, no guessed profiler
  counters). Its last reported revision hash is
  `e1f532ac8754c7f4d8be72a23ab966f0c952cfeed2798d886c152ee91db8b43f`.
- Existing WR overlay/blit/underlay counters are HUD/source-backed aggregates, not exported per
  element and not a per-video success count.

## 15. Coordination

WebSocket helper: `/home/public/wyatt-desktop/Programs/codex-ws-message.mjs` at
`ws://127.0.0.1:14522`, sender `umbra`. The last ACK and completion sends to l8ros failed with
"No loaded Codex thread matched the supplied selector"; the list showed only `umbra` and idle
sidecars. **Do not claim delivery.** Retry only after checking loaded recipients.

Sidecars (all finished/idle): Arendt `01a14287-1e0b-7a92-9fc2-0b807bba0778` (build environment and
interop), Hilbert `01a145c6-b3c3-7bb0-b785-60c60a7acc22` (NativeLayer lifecycle and protocol),
Gibbs `01a1556a-b095-7263-b946-4a7f85c2ba2b` (child-vsync races and combined-patch review).
New authorized multi-step worker work needs a unique control file with OK/HALT semantics and a
read after each command. The October 14-17 teamwork SQLite belongs to that finished wave.

Since the l8ros bug report arrived, coordination has been through files in the repository
(`docs/umbrafox/archive/bug-reports/`, `docs/umbrafox/archive/reports/`) and chat, not through the websocket.

## 16. Handoff Verification

Verified while writing this dump, not recalled: HEAD and `origin/main` both
`b3ca97a4a136b06de7c41e6169d076d0dedab436` after the push; `git log 9a9057291b5b..HEAD` contains
exactly the six commits listed above; all 25 owned source files still hash-match the October 19
source freeze (0 mismatches); the four artifact identities above re-hashed and matching; no
umbrafox build, cargo, browser or test process owned by this lane is running (an unrelated
`aeordb` cargo build from another workspace was visible and untouched); the owner's daily browser
PID 1460580 is still running the dated October 1 build and was not touched.

The previous memory file had SHA256
`3299037a850cca035566e9481717c0fe7d396aca2cfe684d77426ae57d084cb2` (1,905 lines) before this
rewrite and is preserved verbatim below. `.codex/DETAILS.md` gains a short October 23 entry and
is committed together with this file; its pre-existing 1,419-line uncommitted continuity
additions are part of the same commit.

---

# Preserved Memory File (October 20, 2026 dump and its historical archive)

Everything below is the previous `MEMORY.md` content, byte for byte, including the October 20
handoff and the older `# Historical Memory Archive` it carried. Statements there were true,
provisional or pending at their recorded checkpoints. Where it contradicts this top section, this
top section wins; where it names a file, hash or receipt, prefer the receipt on disk.

# Umbrafox Full Bot Handoff

Updated October 20, 2026 UTC, at Wyatt's explicit request for a FULL memory dump.
This top section is the authoritative current handoff. The previous 1,103-line
memory file is preserved verbatim under **Historical Memory Archive** below.
Its old "active", "running", "next" and authorization statements are historical,
not instructions to resume those jobs.

## 1. Immediate Resume Point

The latest engineering exchange was a **read-only** answer to l8ros about
Wayland child vsync, full page recomposition, and its combined hybrid patch.
That answer is complete and recorded; no new source patch or build was started.
The newest owner request is this memory dump, not a new deployment request.

Important current conclusions:

1. Content can receive vsync without a WebRender composite. It already has an
   independent observer path through `VsyncParent` and `VsyncMainChild`.
2. `EGLVSyncCallbackHandler` calling `RequestForceCommit` publishes Wayland state.
   It does **not** request WR rendering, GL drawing or EGL swap. Do not remove it
   as though it were a forced full-page redraw.
3. Our official candidate already contains real external attachment and
   conditional final-draw omission, using a separate `DrawExternalCompositor`
   interface. Missing prototype API names do not mean missing functionality.
4. The official candidate has strict admission gates. A true pref is not proof
   of successful admission, attachment, displayed video or direct scanout.
5. `RenderCompositorEGL::EndFrame` still calls `SwapBuffers` on a completed visible
   frame even if the final tile drawing was skipped. This is a distinct
   **candidate cost to measure**, not a proven bottleneck or an approved
   unconditional swap-removal fix.
6. l8ros's supplied combined patch remains **unaccepted as-is**: it can skip the
   fallback without a successfully attached replacement, produces native queue
   operations with no Draw consumer, has a process-global stale keepalive, and
   is an incomplete clean-base source handoff.
7. Official ARM build/package verification passed. Hardware performance,
   lifecycle and visual acceptance of the official candidate have **not** passed.

Current report:
[combined intake and callback-cost follow-up](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/docs/umbrafox/archive/reports/2026-10-20-combined-hybrid-intake.md),
SHA256 `00a0f213639c6963e1b7ed2ac79e491856566bffb726c26414b8cc4e331dc7d2`.
Current plan:
[EGL external video integration](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/docs/umbrafox/archive/plans/egl-external-video.md).

There is no active tool goal (`get_goal` returned null during this handoff).
There is no owned build, package, browser, test or command session to resume.
Do not create a goal unless explicitly requested. No current teamwork DB was
assigned. Historical DBs belong to their completed waves.

## 2. Owner Intent, Authority and Boundaries

Wyatt wants a fast, reliable power-user Firefox fork. Browser defaults must remain
Firefox-equivalent to websites and servers. Read the mandatory modification
rulebook before source work:
[rulebook](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/docs/umbrafox/conversion-guide/02-mandatory-modification-rules.md).
No new detectable default JS, DOM, WebIDL, network, media, storage, timing or
fingerprinting surfaces. No silent rule exception.

Wyatt authorized hybrid implementation with "Please continue, fixing these
issues as you go", and subsequently the child-vsync repair with "Let's go for it".
Those authorizations produced the candidate described here. They do not certify
the hardware, authorize applying an unsafe later patch without review, or
reopen the stopped P2 diagnostic artifact lane.

Ownership:

- **umbra** owns browser source, review, isolated build, package and artifact
  integrity.
- **l8ros** owns Pi deployment, compositor/session changes, hardware measurement,
  restoration and current Pi state. No Pi actions were performed in the latest
  source-analysis or handoff turns.
- Wyatt's daily desktop browser is not a disposable test process. Do not close,
  restart, attach a debugger, navigate or modify its profile without the
  applicable explicit authorization. A prior launcher-logging change is not
  blanket runtime control permission.
- Default-off hybrid stays default-off. No marker-file gate, arbitrary guard
  bypass, fence deletion, global scheduler override or new custom IPC was
  admitted to our source.
- Preserve all existing artifacts, rejected attempts and diagnostic evidence.
  Do not overwrite a verified export or fabricate a passing receipt.
- Never SIGKILL without explicit direction. Terminate only exact owned
  processes/groups, bound cleanup, and join sessions.
- Default significant Cargo and make work to two jobs. An old eight-job
  override belonged to the October 16 diagnostic build, not new work.

## 3. Bootstrap and Tooling

After session start or compaction first read:
[startup](/home/public/wyatt-desktop/.bot-common/startup.md),
[global quirks](/home/public/wyatt-desktop/.bot-common/quirks.md),
[global rules](/home/public/wyatt-desktop/.bot-common/rules.md),
and [AGIS runtime](/home/public/wyatt-desktop/Projects/agis/docs/runtime.md).
Apply their producer/consumer, testing and review discipline genuinely.
Finish bootstrap with `Fired up!` and continue the active task.

Project root:
`/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox`.
Its local execution alias is the usual desktop home checkout. Owner-facing
paths must use the absolute share root, not tilde or a bare home alias.

[DETAILS.md](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/.codex/DETAILS.md)
is the large continuity ledger, about 9,000 lines. Read its newest top sections
first; do not blindly ingest the whole file. Project `.codex` quirks/rules files
were absent at handoff. `AGENTS.md` includes the bootstrap and rulebook rules.

Use the appropriate skills:

- `share-path` whenever handing over paths.
- `diagnose-crash` for actual crash/core triage.
- `umbrafox-link` for UmbraLink and owner-local control service work.
- `firefox-desktop-frontend` for JS/HTML/CSS frontend changes.
- `mozlint` before lint infrastructure or linter work.
- `documentation` for documentation work.
- `planning-cap` / `implement` for an authorized substantial design/execution.
- `profiler-analysis` for Firefox profiles; do not parse raw profiles ad hoc.
- `firefox-commits` and `find-reviewer` before committing.

Use `searchfox-cli` for upstream Firefox discovery, narrow local reads/searches
for known fork changes. Installed CLI reports version 0.18.0 with 0.20.5
available; no upgrade was performed. Searchfox definitions were reconciled
against local source for the latest vsync answer.

Read directory `AGENTS.md` before work under `gfx/wr`, `layout`, `js`, etc.
The requested Read tool was unavailable and deferred tool search returned
"unsupported call", so the WR instructions were read via shell as a disclosed
fallback. Use a real Read tool if it is available in the next session.

Manual edits use `apply_patch`. Bound slow commands and preserve full output in
logs rather than filtering build/test streams. Use structured JSON/INI parsers.
Do not run broad repository searches, broad process kills or blanket formatting.
Use independent test/runtime evidence rather than source-contract checks alone.

## 4. Checkout and Worktree State

Verified during this handoff:

```text
HEAD 9a9057291b5b5dd1c1362a2cc58551990532a6f6
main, origin/main, origin/HEAD point to that locally recorded revision
subject: No bug - Preserve verified clipboard prototype and inactive installation evidence r?#firefox-desktop-core-reviewers
```

This was a local ref inspection, not a fresh remote fetch. The hybrid source
and its reports are uncommitted. An earlier Bugzilla-versus-No-bug label question
was unanswered; no reviewer approval or source commit has been invented.

All **25 owned source files** currently match the latest exported source freeze.
They were rehashed successfully during this memory handoff. The canonical path
list and hashes are in:
[source-freeze.json](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/exports/umbrafox-hybrid-20261019185219/source-freeze.json).

The owned surface comprises:

- NativeLayerWayland implementation/header.
- RenderCompositor base and EGL implementation/headers, RendererOGL,
  WebRenderAPI, Rust bindings.
- WR composite types, new `composite/draw_external.rs`, lib module wiring,
  final renderer composite path.
- StaticPrefList.
- GTK DMABufFormats/DMABufSurface implementations/headers.
- GtkCompositorWidget, WaylandSurface, nsWindow implementations/headers.
- DMABufSurface native gtest fixture.

There are many unrelated untracked upstream files and existing context edits.
Never clean/reset/revert them. Do not archive the whole dirty worktree as build
input. The build used an exact Git archive plus a frozen owned patch and new-file
manifest. An untracked local example-compositor constructor was separately fixed
to initialize the new optional field to None; that compatibility change is not
part of the browser artifact and must not be silently included in a rebuild.

This memory file had preexisting changes. Its original full contents are preserved
below, not replaced. Current edits for this request are confined to this file.

## 5. Latest Official ARM Artifact

Export directory:
[umbrafox-hybrid-20261019185219](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/exports/umbrafox-hybrid-20261019185219).

| Item | Identity |
| --- | --- |
| BuildID | `20261019185219` |
| Archive size | `100334096` bytes |
| Archive SHA256 | `41159d834b9fbef045928159416c179a00c753164edfb6824ab2fa2885323ff9` |
| Source freeze SHA256 | `c347f71a91b42ef11b94f529de2672be5700216a380b1946ea8535594727bda7` |
| Source patch SHA256 | `52adb07b853f09b0bd217bae3345472e61987d18f73cf6b3c93b2633161df335` |
| Package receipt SHA256 | `8b6f9078c640116441ec6f6d42d0a135aa4c7525b87629a5a9d1c59766113b58` |
| Evidence manifest SHA256 | `911a15ebfbdbf54f0c225cad2fdcff4aafc2bd30fc794497246cfe9d008ff904` |

These five SHA256 values were freshly checked during this handoff.
The prior full verification covers 28 AArch64 ELF files, generated/native/INI
BuildID agreement, dependencies, staging/archive/extraction correspondence,
frontend inventory/CRC, 25 owned source files and 485,132 unchanged base files.
The evidence manifest covers 31 retained evidence files. The full 485,132-file
inventory and all package checks were not rerun merely to write this handoff.

Archive:
[ARM tar.xz](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/exports/umbrafox-hybrid-20261019185219/umbrafox-hybrid-20261019185219-linux-aarch64.tar.xz).
Other authority:
[package-input.json](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/exports/umbrafox-hybrid-20261019185219/package-input.json),
[source patch](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/exports/umbrafox-hybrid-20261019185219/hybrid-source.patch),
[evidence](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/exports/umbrafox-hybrid-20261019185219/evidence).

Preserved predecessors:

- BuildID `20261019063025`, archive SHA256
  `fac5017606879b8ed8b9dd4f7490df95a85a2bec8c3a1892cb283352e459a515`,
  100,325,400 bytes. Initial hybrid, subsequently superseded.
- BuildID `20261019183200`, archive SHA256
  `a98554ad8e902b421f704c76adc951d40eef9c3f10c0e26fe56684a590129a94`,
  100,333,104 bytes. Child-vsync candidate superseded by successful-EGL-swap
  attachment bookkeeping.

No export was installed on the desktop by this lane. Pi tests are supplied by
l8ros and are not a transferable acceptance certificate for another source or
artifact.

## 6. Build Environment and Verification

Fresh isolated build root:
`/home/public/wyatt-desktop/.cache/codex/umbrafox-hybrid-arm-20261019-candidate1`.
Its `source`, `obj`, mozconfig and evidence belong to this hybrid, not the
older retained diagnostic or release source directories.

Toolchain retained at implementation: bootstrap Clang 22.1.8, Rust/Cargo 1.94.0,
existing AArch64 sysroot. Optimized GTK/Wayland/V4L2 build, no DEBUG,
`umbra-perf-probes` off, no ccache, no-update bootstrap. Main checkout mozconfig
is host x86; do not accidentally use it for ARM. No-update bootstrap can still
install missing tools, so it is not a promise of no network/install side effects.

Make and Cargo both explicitly limited to two jobs. Cargo environment alone
does not override a larger inherited make jobserver. The initial clean build
took roughly 147 minutes; later affected-source rebuilds were shorter.
The original build runner used nice 10, a 10,800-second cap, 8 GiB available
memory and 32 GiB free-space floors, TERM with bounded grace and no KILL.
Read the exact retained runner before any future use rather than reconstructing
its guarantees from this paragraph.

Final freeze6 run: configure PASS about 18 seconds, build PASS about 180 seconds,
normal `mach package` PASS about 51 seconds, package verifier terminal exit 0.
All required sessions joined; no residual owned process groups were retained.
One fixed `MOZ_BUILD_DATE` was used across configure/build/package.

Tests and their actual scope:

- 176 host WR library tests passed, including 11 new selector/config tests.
  Initial two behavioral RED failures were retained.
- 16 SWGL compositor-surface reftests passed.
- SWGL invalidation suite passed 11 comparisons.
- AArch64 DMABuf native fixtures compiled; they were **not executed** on ARM.
- 14 child-vsync source-contract tests passed, including 11 in-memory mutation
  controls within a test. These are not native Wayland behavioral tests.
- Seven package-verifier unit tests passed.
- Source formatting/lint checks passed within the documented scope; one existing
  DMABufSurface header namespace warning matched HEAD and was not a new defect.
- No live hardware fault/lifecycle/capture acceptance was established here.

The reported "FAILED, failures=1 of 14" corresponds to retained
`attachment-red.log`, an intentional pre-fix failure for the missing
`mBufferAttached` update. Final `attachment-green.log` and
`exported-source-checks.log` pass. Preserve both RED and GREEN. Ask for an exact
different filename/output if a new failure is reported.

Self-contained source tests and verifier code are retained in the export
evidence, including `source-contract`, `build_step6.py`, `verify_package6.py`,
`test_verify_package6.py` and logs. Do not run the full verifier against the
existing export as a casual read-only check: it can write output.

For future source changes: create a new frozen candidate/revision and BuildID,
rebuild affected units, run normal packaging and final artifact checks. Do not
reuse predecessor freeze5 or silently patch freeze6/exported files.

## 7. Implemented Hybrid Design

Startup-scoped pref, default false:

```text
gfx.webrender.compositor.external-surfaces-in-draw
```

The WR compositor remains Draw. The ordinary Native/Layer queues and promotion
eligibility are unchanged. An optional `DrawExternalCompositor` interface is
installed through the Gecko/Rust bridge when supported.

Selection in
[draw_external.rs](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/gfx/wr/webrender/src/composite/draw_external.rs)
requires a resolved external YUV image in the frontmost opaque fullscreen tile:
identity geometry, exact coverage, no crop, unsupported clip, foreground content
or scaling, eight-bit NV12 or planar YCbCr with Rec709Narrow. It uses resolved
image identity, not an index into an unrelated descriptor vector.

Call chain:

```text
Renderer::composite_simple
  -> CompositeState::prepare_draw_external_surface
  -> WrDrawExternalCompositor::prepare
  -> wr_compositor_prepare_draw_external_surface
  -> RenderCompositorEGL::PrepareDrawExternalSurface
  -> NativeLayerRootWayland::PrepareForEGL
  -> NativeLayerWaylandExternal::PrepareForEGL
  -> WaylandSurface::AttachLocked
```

On successful admission/attachment, `composite_simple` returns before ordinary
final tile drawing because the accepted opaque fullscreen child covers the
lower tiles. Failure retains normal Draw. That does **not** imply all earlier
WR work, texture resolution, synchronization or EGL swap disappears.

The C++ backend:

- Resolves the actual `RenderDMABUFTextureHost` and YUV surface.
- Requires visible mapped EGL parent, scale one, exact source/output dimensions.
- Uses a dedicated external-only child lifecycle and holds the existing root
  lock proof through preparation and EGL swap.
- Preserves fences and buffer ownership. Every accepted frame, including the
  same host pointer, still waits/attaches as required by the retained contract.
- Hides/clears on rejection, failed begin/prepare, cancellation, unmap or pause.
- Retires a child whose failed mapping left partial parent state before retry.
- Does not use ordinary full-native root initialization/shutdown, per-frame
  main-thread `SetLayers` tasks or unbounded native-ID accumulation.
- Uses Draw fallback for captures/readbacks. Partial present is disabled while
  the optional interface is active; this is separate from callback-only commits.

## 8. Admission and Import Limitations

`NativeLayerRootWayland::PrepareForEGL` additionally requires:

- Actual NV12 or YUV420, ColorDepth 8, BT709 transfer/matrix, limited range,
  non-HDR. `IsHDRSurface` alone checks PQ/HLG and is not eight-bit proof.
- Exact wire FOURCC mapping; I420 maps to DRM YUV420.
- NV12 two-plane or YUV420 three-plane shape.
- Every plane modifier explicit, equal, and present in the copied advertised
  format snapshot. INVALID is rejected; LINEAR is accepted only if listed.
- `wp_color_representation_manager_v1` and supported BT709 limited-range pair.

The format feedback snapshot is copied under `mFeedbackMutex`. Publication and
basic-format injection share the mutex; callback runs after unlock. This does
not make the legacy raw feedback getters generally thread-safe.
The fallback table injects formats with INVALID, so it cannot prove compositor
advertisement. A first matching tranche can conservatively false-reject later
support; this is not permission to union guessed capabilities.

The YUV params-object leak was fixed by destroying params after `create_immed`,
matching the RGBA path. The request is not itself a destructor.
However, advertised support and `AttachLocked` true prove only local admission
and submission. `create_immed` can still fail asynchronously and fatally.
A nonfatal server-acknowledged import needs `create` plus `created`/`failed`
handling and is not implemented.

Upstream Cage 0.2.1 with wlroots 0.19 lacks the mandatory color-representation
manager; wlroots 0.20 added protocol support, but the compositor must create and
advertise it. The installed/custom Pi browser-socket registry is still unknown
to this lane. Inspect the browser's actual user/runtime/socket, not merely the
outer DRM compositor's socket.

Without metadata, YUV reconstruction is compositor-defined; NV12, SDR and
fullscreen size do not prove BT709 parity. Do not remove the color gate merely
to reproduce prototype FPS. This is a leading admission question, not a
confirmed reason for a particular measured run.

## 9. Child Vsync Repair and Latest Source Trace

The original prototype's `SetLayers`/commit calls under the EGL root lock could
reenter the same nonrecursive Wayland mutex. Two waiting thread stacks alone
do not prove a two-thread cycle; direct recursive acquisition is the concrete
source defect. Our external-only lifecycle avoids that path.

The implemented child-vsync repair:

- Parent `WaylandSurface` owns a child source and generation.
- Registers the source after successful external preparation; retires it on
  rejection, clear, unmap and consumer removal.
- Propagates observer-enabled state.
- Preserves the parent `WaylandVsyncSource` callback.
- Rearms the child callback, releases child lock, validates generation under
  parent lock, publishes pending state, then notifies the saved consumer
  outside all surface locks.
- Rejects an already-entered stale callback if its protocol callback identity
  no longer matches the currently registered callback.
- On successful EGL swap sets `mBufferAttached=true` and clears pending commit
  bookkeeping. This prevents perpetual startup emulation when the covered
  parent receives no own callback. One already-queued emulated callback may
  still run; it does not keep rearming while mapped/attached.

Important functions:
[WaylandSurface.cpp](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/widget/gtk/WaylandSurface.cpp),
[WaylandSurfaceLock.cpp](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/widget/gtk/WaylandSurfaceLock.cpp),
[WaylandVsyncSource.cpp](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/widget/gtk/WaylandVsyncSource.cpp).

Latest question: "Can the callback deliver ticks without full page composite,
and can RequestForceCommit be removed when only video changes?"

Answer: ticks already can be independent; do not conflate three operations:

1. Callback publication: `RequestForceCommit` -> lock destructor ->
   `WaylandSurface::Commit` -> `wl_surface_commit`. No WR scheduling, GL draw,
   new damage or EGL swap is called by this chain.
2. Observer delivery: `WaylandVsyncSource::VisibleWindowCallback` ->
   `VsyncSource::NotifyVsync` -> `VsyncDispatcher`. `VsyncParent` independently
   observes and sends `PVsync::Notify`; `VsyncMainChild` calls refresh observers.
3. Rendering: `CompositorVsyncScheduler::Composite` calls `CompositeToTarget`
   only with a request or ASAP mode. Idle unobserve removes its compositor
   observer, not the content observer.

Wayland frame callbacks are one-shot and committed state. A synchronized child
requires parent publication. Removing the parent commit while no other commit
is guaranteed can stall the rearmed callback. Coalescing requires a real
publication guarantee, not "page is idle." A commit may still have a server-side
cost; no claim of zero Cage cost was made.

The separate swap candidate is in
[RenderCompositorEGL::EndFrame](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/gfx/webrender_bindings/RenderCompositorEGL.cpp).
An external-only presentation optimization must preserve child publication,
buffer/fence lifetime, WR frame accounting, capture fallback and full-damage
restoration. Do not implement `if (external) return` or drop swap blindly.

## 10. Supplied Pi Results and Their Limits

These are **l8ros-reported observations**, not independently repeated here and
not necessarily from mutually identical sources/configurations.

| Arm / report | Supplied result |
| --- | --- |
| Earlier release baseline, 1080p60 | about 26 fps, 55-57% dropped |
| Prototype external layer, October 19 | 59.29 fps / 1.2% dropped |
| Prototype 720p60 | 59.08 fps / 1.9% dropped |
| Initially reported prototype page-only cadence | 480/481 intervals <=18 ms |
| Later prototype with promoted video | page/content starvation reported |
| Official 06:30 export, pref off/on | 25.42 / 29.11 fps |
| Official 18:52 export | 28.83 fps / 51.7% dropped; page+video 25 rAF/s |
| Claimed combined build | 40.58 fps / 32.3% dropped; page+video 37 rAF/s |

Do not transfer the prototype's acceptance to the official guarded implementation.
The initial page-only result did not establish simultaneous page+video behavior.
"471 intervals/s at 60 Hz" and "179 baseline" need their actual interval
denominators; the formal gate is >=470 qualifying intervals out of 480.

Acceptance still owed: 1080p60 >=57fps and <5% drops, page cadence >=470/480
intervals <=18ms, 1080p30/720p60 regression, concurrent mixed content, actual
visual output, seek/fullscreen/navigation, hide/remap/teardown and resource
retirement. Counter improvements alone can miss blank or stale content.
Default screenshots may re-render DOM rather than capture composited output;
even readback can force our fallback and perturb the case being tested.

Latest supplied Pi state: safe beta `fc3ba2d3`, hybrid off, Marionette working,
zero failed units. This was not checked live by us and must be reconfirmed by
l8ros before device operations. Earlier power-off/card-swap notes are obsolete.

## 11. Combined Patch: Do Not Apply As-Is

Input:
[combined patch](/home/public/wyatt-desktop/Projects/l8ros-workspace/l8ros/docs/umbrafox/archive/patches/2026-10-20-combined-umbrafox-eglroot-plus-attach-skip.patch).
SHA256 `86aaca7d483b5c7118b30a6d91b9dc5948648565a7dff6d9f4030a6004bde81f`,
54,372 bytes, 1,443 lines, 28 files. It is a full tracked-file diff against
`c0e7f8a2be04`, not an incremental diff against the 18:52 export.

Concrete findings from parent and independent Gibbs source review:

1. A marker-file branch in `Renderer::draw_tile_list` skips external tiles with
   external image ID and no update parameters. It does not require the pref,
   successful preparation, color/modifier/geometry admission or attached child.
   Rejected admission and readback can therefore lose the ordinary fallback.
2. The Draw/Layer branch queues native create/attach operations, while unchanged
   `Renderer::update_native_surfaces` drains only Native. Draw/Layer asserts empty
   in debug; optimized builds do not drain the queue. Draw compositor lookup is
   None and EGL native methods remain inherited no-ops. This patch lacks the
   claimed queue consumer/backend implementation.
3. `gL8ROSHybridActive` is process-global, set before BeginFrame success from a
   cached marker and pref. It is not live admitted-surface state and has no
   rejection/cancel/pause/destruction retirement. Different windows interfere.
   C++ caches marker state while Rust polls it, so gate state diverges.
4. Temporary-index application against c0 passes, but the patch omits the new
   `composite/draw_external.rs` file required by its imports. Applying atop the
   official export fails because it repeats additions. A reproducible source
   handoff must include new files and identify one precise base.

No build was attempted merely to rediscover these source defects. No parts of
the patch were silently merged. FPS observations do not prove this exact patch
produced the measured binary or that a decoder buffer reached scanout.

Original October 18 prototype patch:
[prototype](/home/public/wyatt-desktop/Projects/l8ros-workspace/l8ros/docs/umbrafox/archive/patches/2026-10-18-hybrid-compositor-egl-external-layers.patch),
last reviewed SHA256
`d8afa0403f1bc5a916966eeddc253f2ca3c9d719e203fde9cf827701609f37aa`.
Earlier intake also found descriptor/resolved-index confusion, fresh-ID lifetime
growth, missing destruction, no Draw AddSurface caller and unsafe root lifecycle.
It is reference evidence, not an approved patch to replay.

## 12. Marionette, UmbraLink and Package Identity

Marionette and UmbraLink are different services. Do not diagnose one by the
other's pref or port.

Latest l8ros report says its own builds lost measurement access because deployment
left the installation owned by `l8ros:l8ros-profiles`; `device-ca.py` rejected it
and the session fell back to the greeter. Correcting root:root ownership reportedly
restored Marionette. This is supplied runtime diagnosis, not our independent Pi
inspection. Do not change desktop ownership or infer all service issues solved.

Our local package comparison established:

- Both inspected configs have `ENABLE_WEBDRIVER=1`, `MOZ_GECKODRIVER=1`.
- All 161 remote/Marionette omni.ja entries are byte-identical.
- `Marionette.sys.mjs` SHA256:
  `01935a3eef58cf85d6fa586c2577a2e9d9bf1ceb62ec3b377f2ae29bbd0cd7ab`.
- Both manifests/native component contract are present. No missing
  `--enable-marionette` option explains the difference.
- Start Marionette with CLI `--marionette` or prelaunch `MOZ_MARIONETTE=1`;
  runtime `marionette.enabled=true` alone is not the activation path.
- `remote.policy.disabled` gates it. `remote.log.level="Trace"` is the relevant
  shared logger pref. Successful startup writes `MarionetteActivePort` in the
  actual profile. `MOZ_REMOTE_ALLOW_SYSTEM_ACCESS=1` grants privileged protocol
  access; it does not start the listener.

Separate proven package defect in the inspected local l8ros archive:

```text
archive SHA256 124650afba03c13c787e7efdb8a5395ceb8f68f7e3ee7f4558775c2982370e64
size 99253496 bytes
libxul native toolkit BuildID 20261019225619
application.ini / platform.ini / current buildid.h 20261019225648
```

Archive members matched local staging hashes. The identity verifier rejects this
real mismatch. It was never established as the Marionette failure cause and
remains separate from the ownership report. Pin one fresh `MOZ_BUILD_DATE` through
configure/build/package; do not edit INIs or forge native notes to pass checks.

UmbraLink context: owner-local loopback control service, discovery in the actual
profile's `umbrafox/control.json`; `umbrafox.control.enabled` and port pref,
normally port 0 for an allocated port. Read the dedicated skill/source before
offering a startup recipe or changing security/ownership checks. Earlier harness
failures included a root-owned home, missing media library path and a backgrounded
video tab. They did not establish a generic fresh-profile UmbraLink defect.
Some appliance startup/autoconfig questions remained unverified in this lane.

## 13. Desktop Silent Exit Logging

Separate owner request: Umbrafox instantly disappears to the desktop, with no
crash dialog or system report. Cause is **not established**.

October 17 work installed a debug logging wrapper at:
[launcher](/home/public/wyatt-desktop/Programs/umbrafox),
with [helper](/home/public/wyatt-desktop/Programs/umbrafox-debug.py).
It preserves the existing build/profile/argv choice and logs the next ordinary
launch; it is not a debug browser build and does not itself fix a crash.

Logs:
`/home/public/wyatt-desktop/.local/state/umbrafox/launcher-debug/`,
with `latest` symlink, per-run `run.json`, four 4-MiB rotating output segments
and first 64 KiB startup capture. No cross-run deletion. It captures stdout/
stderr and parent exit/signal, uses timestamp/sync Widget, WidgetWayland and
WidgetCompositor logging plus Rust backtraces. `UMBRAFOX_DEBUG=0` disables capture
for one invocation.

Sixteen dummy-child/unit checks and shell syntax passed. No real browser was
launched/restarted/attached/uploaded in that change; actual crash capture remains
unverified here. A remote handoff process exiting 0 does not monitor an already
running browser; an unfinished run receipt alone is inconclusive.

Rollback, original launcher, tests and limitations:
[debug launcher README](/home/public/wyatt-desktop/.cache/codex/umbrafox-debug-launcher-20261017/README.md).

Last inspected launcher selected dated 158.0a1 BuildID `20261001103920`, ahead of
the installed nightly160. Earlier nightly/profile switch was not applied; do not
silently switch builds or profiles during crash triage. No recent matching
core/OOM/segfault was found at that inspection; October 5's old shutdown-timeout
dump was not evidence for the new incidents. Fresh inspection is needed before
claiming current process/build/log status.

## 14. Prior Video Investigation: Avoid Repeating Rejected Inferences

The Pi investigation has generated many plausible but subsequently revised
claims. Keep observed counters separate from mechanism and causal attribution.

- VP9/H264 ABBA results were similar at roughly 31-32 submitted fps. That ruled
  out that particular codec policy win, not every decoder issue.
- Smaller output area improved throughput in one experiment; later source-size
  tests showed strong source-size dependence with destination CSS size changes
  ineffective. These do not by themselves prove one specific CPU/GPU pass.
- Single versus nested Cage changed roughly 31 to 33.5 fps in a supplied run.
  Two compositor processes do not prove two full GPU renders each frame.
- Active primary plus idle overlay planes does not prove GPU composition:
  primary can itself scan out directly. A nonzero overlay needs binding to the
  actual video buffer, not simply plane-count evidence.
- `mozPresentedFrames` measures submitted frames, not physical display or GPU
  time. Its reciprocal is a submission interval, not measured render duration.
  Hidden-video counters do not prove uploads or scanout occurred.
- DMA-BUF FDs changed from reported absent to present as process/output checks
  improved; no parent-FD inference should be reused as settled evidence.
- Forced hardware decode reportedly reduced CPU without fixing cadence. That
  appliance pref change belongs to l8ros, not a verified change in this source.
- The V3D tiled-shadow candidate had a playback-confirmed negative log observation,
  but this was a bounded supplied run, not universal driver proof.
- Dmabuf logging exists; empty logs do not automatically establish no copy.
- Media visibility can suspend decoding. A backgrounded video tab explained
  earlier zero-frame harness runs. Read actual visibility/suspend prefs and do
  not treat rVFC or logging as neutral instrumentation.

Critical source corrections:

1. Draw supports YUV external texture sampling without the native compositor.
   Failed promotion does not imply a CPU YUV-to-RGB conversion; the ordinary
   hardware YUV quad can rasterize through GPU paths.
2. `RenderTaskLocation::CacheRequest` is not proof of a texture-cache copy.
   External TextureHandle requests bypass cache allocation, resolve to external
   textures and become Static/ReadOnly tasks. DMABUF hosts already provide
   TextureHandle(Texture2D). Dependency tasks cannot be removed based on their
   provisional location name.
3. Forcing `TextureExternal` would violate an actual Texture2D target. Reusing a
   same-size/same-key texture without updating changed frame pixels can display
   stale video. Both proposed shortcuts were rejected.
4. Pool copy, EGL binding fallback, raw-buffer uploads, earlier picture passes,
   driver synchronization and swap costs are distinct mechanisms.
5. `media.ffmpeg.vaapi.force-surface-zero-copy` also reaches the V4L2 pool in the
   retained source (startup uint 0 disable / 1 force / 2 auto). Read effective
   feature state before proposing it; pool pressure and GL fallback are separate.

Reports:
[source-sized cost](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/docs/umbrafox/archive/reports/2026-10-18-source-sized-video-cost.md),
[promotion gates](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/docs/umbrafox/archive/reports/2026-10-18-yuv-promotion-gates.md),
[V4L2/Draw](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/docs/umbrafox/archive/reports/2026-10-18-v4l2-dmabuf-draw.md),
[CacheRequest trace](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/docs/umbrafox/archive/reports/2026-10-18-cache-request-is-not-a-copy.md).

## 15. Stopped Diagnostic and Census Work

Do not confuse the current non-probe hybrid artifact with the October 16-17 P1/P2
diagnostic work.

Diagnostic layout root:
`/home/public/wyatt-desktop/.cache/codex/umbrafox-wr-render-p2-layout-20261016`.
The corrected build2 diagnostic artifact path was stopped and documented.
It is uncertified and not deployable through the established authorized paths,
not proved intrinsically impossible to package.

Honest scope: matching Record layouts verified for the critical pair
`RenderDMABUFTextureHost.o` and `Unified_cpp_webrender_bindings0.o`.
`gl.o` and `wrappers.o` have no retained explicit probe/Core/Record reference.
This is **not** all-TU, selected-linked-body or whole-link clearance.
Historical native argv and include closure remain unproven;
`completeStableClosure=false`. Optimized/inlined hidden use remains conditional,
unquantified risk.

P0 tooling was frozen: runner, comparator and snapshot prototype. Parent 90 tests
and seven scoped Ruff checks passed at that checkpoint. Comparator is exact-index
only, unsupported reindexing fails, ordinary debug payloads exact, all ordered
RELA rows retained, groups/addrsig checked. It uses bounded whole-file buffers,
not streaming. Production SnapshotGate always rejects: synthetic namespace tests
did not establish the full production content/namespace/alias closure.
No preprocessing or reproduction compile was authorized by the P0 freeze.

Provisional packaging was also stopped:
normal `mach package` requires writes beyond the sole output mount and its
`MACH=1` path bypasses the cited backend-staleness check. Manual dist/bin copy
plus libxul-only strip is not normal-equivalent because of manifest/resource/
omnijar/minification/precomplete/removed-files and selected executable transforms.
Provisional guards remain closed; mock/synthetic tooling is not package clearance.

Closure:
`build2-diagnostic-closure.md` SHA256
`700c2c03a4f5b918443fc35f2a3bf04090c3695a8e5752884f1fcceeaeae5ccc`;
61-file artifact-path closure freeze SHA256
`837b78e5029a03708bd35ff444837ed79d9bf93ea7aa754f48c90e3af824188d`.
Read the exact root's reports/receipts if reopening is explicitly authorized.
Never fabricate a postlink pass or introduce the rejected no-CU adapter.

Later census proposal, design only:
[WR promotion census proposal](/home/public/wyatt-desktop/Projects/l8ros-workspace/l8ros/docs/umbrafox/archive/plans/wr-promotion-census-seam-proposal.md).
Last coordinator-reported revision SHA256
`e1f532ac8754c7f4d8be72a23ab966f0c952cfeed2798d886c152ee91db8b43f`;
not freshly rehashed for this memory dump.

The requirements were incorporated, not implementation/build-authorized:

- First scope WR occurrence only, not HTML video identity. Interned prim_uid
  is not a unique draw occurrence. Separate process/renderer/document/tile-cache/
  update/draw occurrence and plane-key/generation identity are needed.
- Producer-to-element binding remains unproven; element_ref null. Rect equality
  is not a binding. YUV-only coverage excludes RGB and earlier culls explicitly.
- Record actual ordered eligibility calls only; no fabricated attempts for
  no-request or stability-blocked paths. Preserve ignored guards and overrides.
- Separate setup result from post_update cancellation/final result. Setup can
  skip unmapped/empty/offscreen without descriptor publication. Native ID nullable.
- Versioned linked decision/finalization rows, unique join, missing/orphan/
  conflicting finalization rejected. Silence never means retained or zero.
- Finite fractional f32 geometry, no integer rounding; u64 decimal strings.
- Dedicated default-off feature/flag/current-thread marker readiness and a real
  Gecko-visible exporter. Do not assume old umbra-perf-probes plumbing exists.
- Proposed independent caps: 2 KiB/row, 16 KiB/tile-cache update, 4096 rows AND
  8 MiB/session, 30 seconds, pending 256 AND 512 KiB. Reserve final/summary space.
  These required owner ratification; caps and lifecycle/schema were not frozen
  implementation authority.

Existing WR overlay/blit/underlay counters are HUD/source-backed, not exported
through Services.profiler. They are aggregate rounded avg/max values with MAX
merge semantics, not per-video success counts. Underlay includes an unpreferred
YUV Ok(Blit) accounting case. No guessed profiler "counters" token. HUD observation
is not clean performance A/B or per-element attribution.

## 16. Earlier Shipped Work and Independent Open Issues

The historical archive below retains detailed audio, profile, clipboard and
shortcut evidence. Key current context:

- Audio seek reuse bug was reproduced and corrected: a stopped stream could
  lose carried clock mapping when reused. Fix admits reuse only for the proper
  keep-running/backend-started/logical state; otherwise recreate. Native 38 tests
  and bounded laptop candidate/control evidence passed for that reproduced case,
  not every YouTube or video performance issue.
- Normal ARM release source was clean `c0e7f8a2be0460695c1f65ae8796b09c1082480c`,
  BuildID `20261014135715`. Normal archive SHA256
  `ebc8f575843aac6e9e19d2e45f488422250892858f7c291516a01fbbdf70c059`;
  beta archive SHA256
  `fc3ba2d3139fc1021fb2c1d20db2b041b9a34759270300f8e8984a992fec1436`.
  Beta adds the exact two-pref overlay whose shorthand hash is `4278e82f`.
- Clipboard prototype was installed inactive, with separate profile-mapping/
  activation hold. Do not silently switch the daily launcher/profile.
- Chrome hotkey preset was explicit opt-in, not unconditional web-visible
  behavioral changes. Existing per-user mappings must be preserved.
- Desktop random-exit investigation remains open; logging was installed, not a
  confirmed crash fix.

## 17. Coordination and Workers

Websocket helper:
`/home/public/wyatt-desktop/Programs/codex-ws-message.mjs`,
endpoint `ws://127.0.0.1:14522`, sender name `umbra`.

The latest ACK and completion sends to l8ros failed:
"No loaded Codex thread matched the supplied selector."
The last list showed only umbra and idle sidecars. **Do not claim delivery.**
Retry only after checking loaded recipients; do not invent a recipient, reuse
obsolete tmux fallbacks without applicable authorization, or send to a wrong bot.

Known sidecars, all finished/idle at the last check:

| ID | Name / role |
| --- | --- |
| `01a14287-1e0b-7a92-9fc2-0b807bba0778` | Arendt, build environment and interop review |
| `01a145c6-b3c3-7bb0-b785-60c60a7acc22` | Hilbert, NativeLayer lifecycle and protocol review |
| `01a1556a-b095-7263-b946-4a7f85c2ba2b` | Gibbs, child-vsync races and combined-patch review |

No outstanding worker implementation or test needs polling. New authorized
multi-step worker work needs a unique control file with OK/HALT semantics and
reads after each command. Old control files are historical, not fresh authority.
No current DB; the October 14-17 teamwork SQLite belongs to the prior diagnostic
wave. Do not write old status rows merely because the path is known.

Deferred tool discovery was unavailable in recent turns. Agent tools can
sometimes be accessed through `functions.exec` metadata/ALL_TOOLS:
`multi_agent_v1__send_input` takes `target` and `message`, not `id`;
`wait_agent` takes `targets` and `timeout_ms`. Discover the actual schema before
use rather than relying on stale assumptions.

## 18. Next Useful Work, Not Yet Executed

1. Reconfirm the newest owner/coordinator request before changing anything.
   This memory handoff does not authorize a new runtime or patch.
2. Get the actual browser-socket registry/capabilities and effective frame
   admission result for the **official** candidate. Color-representation,
   exact modifiers, transfer/range, geometry and capture gates can all reject.
   Identify the specific rejection before widening scope.
3. Obtain a complete, reproducible source-to-binary handoff for any allegedly
   combined build. Correct all missing-draw/queue/lifecycle defects; do not infer
   implementation correctness from submitted-frame counters.
4. If a bounded observation is authorized, correlate the same window/time:
   attachment/admission success, child callbacks, content notifications,
   requested WR renders/final tile draws, EndFrame/swap counts and durations.
   Distinguish a no-mutation rAF counter from a page that animates/invalidates.
5. If accepted external frames omit final draws but swap dominates, design an
   external-only presentation transaction with lifecycle/accounting tests. Do not
   remove callback publication or synchronization on speculation.
6. If a new official build is justified, freeze new source and BuildID, use the
   isolated ARM configuration, normal package and exact identity verification.
   Then l8ros validates simultaneous video/page behavior and actual display.
7. For desktop crashes, inspect a newly captured owned launcher run after the
   owner reports another incident. Do not reuse an old core as the explanation
   or claim a fixed root cause from missing logs.

## 19. Handoff Verification

This handoff freshly verified the local HEAD, the five latest artifact metadata/
archive hashes, and all 25 owned source hashes against freeze6. No source,
artifact, installed browser, profile, Pi or system configuration was changed.
No native tests/builds were run just to produce memory.

The preceding analysis checked the current report's ten local file links and
whitespace. Current report, source and protocol findings remain distinct from
unobserved runtime behavior. The original memory content's pre-edit SHA256 is
`f54be5b629214d1996e7c0c24310a7f6ef7f0a62be1eced0f512d6db43edbaef`;
the historical suffix is retained verbatim.

---

# Historical Memory Archive

Everything below is preserved from the earlier memory file. Its statements were
true, provisional or pending at their recorded historical checkpoints. Use the
current handoff above and exact retained receipts to resolve contradictions.
In particular, do not resume old tool sessions, build PIDs, profile switches,
runtime waves or old authorization assumptions from this archive.

# Umbrafox Working Memory and Resume Instructions

## October 16 P1 Artifact Ready

ARM build/package/export verification PASS. Diagnostic archive under
exports/umbrafox-wr-video-p1/diagnostic,110608216B,SHA70d5a747...,
BuildID20261016031646 native/object/bothINIs; betaoverlay4278e82f unchanged.
Full README +package-input +evidence are authority; patch731d9ec2 verified.
All native build groups absent; no needed build/test sessions remain active.
No Pi or desktop installation/runtime. l8ros receives artifact for R/D0/D1/R;
this is instrumentation, not a performance fix or runtime/release-OFF proof.
Owner authorized make8/nice0 for resume; Cargoenv2; same base/config/date.
Source isolated cIrmxHaw, main untouched except docs/context. No source commit.

## October 16 Owner Speed Override, Build2 Active

Wyatt authorized nice0/-j8. Build1 stopped via exact owned wrapper, original
exit-15/4450s preserved; group1287237 fully absent before same-obj build2.
Build2 exec7439,PGID1457543,start04:33:00Z; fixed BuildID20261016031646,
patch731d9ec2/config unchanged. Make8/Cargo env2; exact group reniced0 after
mach automatic idle lowering, sampled8 compilers nice0. Future controller uses
--priority normal; nine fake casesPASS. No Pi or desktop browser touched.

## October 16 ARM Build Running

Configure PASS29s, owned group1283042 absent; configure-admission.json saved.
Build1 started03:18:33Z with fixed20261016031646, PGID1287237, exec81471.
run_phase.py guards10s, two C++/Cargo jobs nice10. Do not duplicate or end while
needed build is active. Cache cIrmxHaw receipts/logs are authority; both buses OK.
No source changes after patchfreeze731d9ec2. l8ros notified by tmux+DB.

## October 16 P1 Configure Active

Exact22-file P1 patch731d9ec2... replayed and handed to l8ros before configure.
Fixed new BuildID20261016031646; cache root cIrmxHaw, run_phase.py configure
exec11631. Read actual configure/build receipts before resuming; do not duplicate.
Source freeze immutable in cache/freeze. Final source tests/lint pass; no Pi or
desktop operations authorized. Packaging worker finishing scratch-only lint.

## October 16 P1 Prebuild Verification

Helper21 tests +ASan/UBSan21 PASS; route13/renderer14 source contracts PASS;
independent helper review clear, native JSON writer387B, host adapter compiles.
No ARM configure/build yet. Frozen schema unchanged; no rendering edits.
Final supplied-data validator and scratch package verifier workers active.
Parent freeze.mjs/run_phase.py in isolated cache root prepare exact patch replay
and owned build controls (HEAD/pathset/hash/size/mode, TERM-only, make2/Cargo2).
Read newest DETAILS and DB before any build. P1-only freeze/hash must be delivered
to l8ros first; Pi/desktop ownership boundaries unchanged.

## October 16 P1 Source Implementation

ONE diagnostic ARM build authorized after P1 patch/test/freeze handoff. Work is
in ~/.cache/codex/umbrafox-wr-video-p1-cIrmxHaw/source at exact c0e7f8a2be04.
Parent helper/core, routes+renderer workers active; IDs/ownership in DETAILS.
Monitor exec83376; both buses must be checked after commands. No ARM build yet,
no optimization/desktop browser/Pi action. Frozen schema remains a06997869e...
API shared in /tmp/codex/track-wr-video-p1-20261016/helper-api.md.
R existing release, D0/D1 new diagnostic, all device work owned by l8ros.

## October 15 WR Schema Contract Ready

Newest docs-only chunk records l8ros corrected baseline: Wayland26.5fps/67.8%
dropped versus XWayland20.2fps/73.3%, compositorOFF verified inside each arm by
coordinator. No independent rerun or causal refresh claim. Schema-v1 plan frozen
SHAa06997869ed4ee62a2acd2dedf669085e33752c354fcdb8dc4065e9ca1d8470d;
32uint32 payload,8 kinds,387B compact max,16k/8MiB/20s per-process bounds.
Schema/nativehelper is NOT implemented. Native/capture/binary tests remain owed.
Latest received message still no builds/Pi; queued coordinator build approval was
visible but has not replaced this turn's instruction. Read latest actual message
and DB before further work. Existing dump has no byte-limit parameter; full
profile ring/peak-memory/disk/export bounds remain separate l8ros runtime gate.

## October 15 WR P1 Approval Conditions

P1 scope conditionally approved; source base c0e7f8a2be04 fixed. Exact schema
freeze is now recorded above; source implementation remains pending. Requested build is
one new diagnostic ARM beta (probesON) plus existing release beta control, not
two new ARM builds. Build authorization still pending; C++/Cargo2,nice10.
Plan contains exact paths/control/export contract. R=existing release/profilerOFF,
D0=diagnostic/profilerOFF, D1=diagnostic active. l8ros clean runtime baseline first,
then only l8ros handles device captures/restoration.8MiB limit is per-process
custom payload, not full profile or Pi128MiB profiler ring. Need post-settle
activation; UmbraLink profile.dump exports but cannot start/stop. New patch's
release compile-out still needs a patch-applied OFF build verification later.

## October 15 Pi Video Attribution Plan

Latest bounded task is l8ros track-wr-video, source audit/plan first; no native
probe implemented or Pi/browser/build run. Exact confirmed deployed source
c0e7f8a2be04, beta20261014135715. Read new plan
docs/umbrafox/archive/plans/2026-10-15-pi-webrender-video-probes.md and newest DETAILS.
DMA-BUF can still have pool GPUcopy or EGL-bind copy fallback; V4L2 disables
import recycling. Import reuse is a conditional candidate, not established fix.
Separate Compositor-thread transactions, WR rendering, surface lock and swap;
EGL WaitForGPU no-op. Paused saved X11 snapshot is backend identity only.
Coordinate via ARM DB/task and tmux l8ros:1.1, never obsolete websocket; no Pi
authority delegated. Clipboard installed inactive; owner activation still held.
Late coordinator correction: persisted native-compositor force pref contaminated
some alleged OFF runs. Clean runtime-verified Wayland/XWayland baseline is owed;
old FPS comparison is not accepted causal/performance evidence.

## October 15 Clipboard Prototype: Installed Inactive

Implementation commit47e6fdeb78fee3bde3447b348f49244025b0b738; release receipt
and continuity publication follows as a separate milestone.

Native and integration gates PASS; report2026-10-15-clipboard-protection.md and
conversion recipe19 now record actual implementation/reapply rules. Browser808,
snapshot668,permissions148,UI/actor51; packaging/install12;launcher/beta16.
Installed complete package ~/Programs/umbrafox-nightly, BuildID20261015235226,
archiveb4db996e...119460288B, rollback sibling.before-clipboard-20261015.
Version exit0 Umbrafox160.0a1, ownedPID absent; .purgecaches verified. No daily
browser restart/clipboard/profile/launcher change. ACTIVATION STILL HELD:
nightly/default installation mapping points to a different profile from owner
dated build. Ask owner to close/approve mapping before switching tested launcher;
never copy profiles or promise current launcher selects new package. All lanes
closed, monitor stopped; recorded owned test/helper PIDs absent. Preserve all
failed runtime/build/test logs in export evidence, not just final green results.
Read newest DETAILS/export README for commit/push state and exact provenance.

## October 15 Clipboard Runtime Checkpoint

Read newest DETAILS first. Build7 passed; build8 compiles readonly freshness fix
under same20261015235226 pin. Integrated1 actual419PASS/12FAIL/2TODO: native
Yes/Always/revoke for both operations and default pointerlock/focus traces pass.
Failure logs preserved; obsolete ownerGlobal fixture cleanup now documentGlobal.
Two substantive failures: beforeinput readonly must reject retry success (parent
fix compiling), persisted cross-origin frame grant icon hidden after reload (UI
agent resumed). Parent47pure tests pass, no package/install yet. Same DB/bus.
Fresh isolated headless app-data/clipboard only; daily browser untouched. New
launcher/profile activation is HELD because nightly maps to a different profile;
owner informed closing consent needed. Inactive verified package install remains
authorized. Do not claim restart will select new package while launcher held.

## October 15 Clipboard Continuation: Not Yet Ready To Install

Latest native build6 full mach build -j2 (not binaries: IDL/IPDL changed),
log /tmp/codex/clipboard-20261015/native-build-6.log. Pin20261015235226.
Read newest DETAILS and teamwork DB for subsequent status. Private noscript
generation-check helper appended after4 existing snapshot methods; no stale
paste fallback. Build corrections preserved in logs, native/runtime pending.
UI review disproved automatic popup default parity (Escape/pointer lock).
Quiet dismissed permission indicator selected, explicit click opens choices;
user informed, UI worker implementing without global popup behavior changes.
Additional real native safety tests being authored by bridge worker; parent
alone runs isolated headless tests. Do not install incomplete build or touch
active daily browser/profile/clipboard. No implementation completion claim yet.

## October 15: Clipboard Implementation Authorized And Active

Owner requested three sub-agents and prototype installation after verification.
See newest .codex/DETAILS.md and /tmp/codex/clipboard-20261015/{teamwork.sqlite,
control.txt,*-contract.md,review.md}. Do not restart/close daily browser.
Native draft and UI/actors exist but are NOT integrated/verified/installed yet.
Only original clipboard default semantics until explicit No/Yes/Always response;
CE exemption, script execCommand exclusion and private observer transport.
Native baseline canceled-copy notice RED0vs1; unknown token failclosed PASS.
Isolated native build2 running, logs native-build-2.log, pin20261015235226,
C++/Rust2jobs. Main native corrections must resync after this first compile.
UI16/bridge21 pure tests pass; runtime/compiled safety and package remain gates.

## October 15: Shortcut Push Complete; Clipboard Policy Clarified

Published Chrome preset 25de5d0b584d; remote main exact SHA independently verified.
Canonical conversion guide recipe18 now preserves that implementation's commit,
files and verification; recipe19 registers the clipboard design as PLANNED ONLY.
Guide README/current-state/inventory updated; add native/UI paths and commits to
recipe19 when implemented, never reapply the withdrawn default-on proposal.
No install or daily-browser activation. Owner WITHDREW default-on copy/paste
protection: now discussing Firefox defaults plus browser-owned per-site
No/Yes/Always override notice after a user operation is canceled. Contenteditable
exception remains. No parity exception authorized; no clipboard source/pref/runtime
changes yet. Cancellation can mean successful custom copy/paste, not blockage.
Owner explicitly accepts that ambiguity: outside contenteditable, content-canceled
genuine user copy/paste should prompt regardless of intent/replacement content.
No success heuristic; propagation stop alone is not a trigger; no automatic retry.
Non-focus-stealing UI, no suspended DOM dispatch, bounded safe retry, scoped grants
and no background clipboard permission expansion are proposed design constraints.
Source investigation and verification gates: docs/umbrafox/archive/plans/clipboard-protection.md.
Protect ordinary inputs/textareas and page selection, preserve rich-editor handling
in contenteditable; do not promise protection against arbitrary subsequent DOM
mutation or relax clipboard permissions. Daily browser/clipboard remain untouched.

## October 15: Chrome Preset First Pass Verified

Owner accepts partial/non-one-to-one parity and approved implementation. Explicit
Linux preset added to about:keyboard: CtrlJ, CtrlE, CtrlShiftN, Ctrl1-9; conflicting
undo-window shortcut cleared, command retained. Earlier unconditional two-file
edit superseded; Firefox defaults restored in source. CustomKeys store/reset used,
unrelated customizations retained and conflicts rejected before changes.
Pure13PASS; full isolated browser350PASS/0FAIL/1expected; lint0. Report:
docs/umbrafox/archive/reports/2026-10-15-chrome-shortcut-preset.md. Logs
/tmp/codex/chrome-hotkeys-20261015. No owner browser/profile/install/launcher or Pi
changes. Owner subsequently authorized commit/push; not packaged or activated
in daily profile. Other
platforms, DevTools and destination/focus differences explicitly deferred.

## October 15: Full Chrome Shortcut Research

Owner wants FULL hotkey parity, not just two edits. Research/draft only:
docs/umbrafox/archive/plans/chrome-hotkey-parity.md. Official browser/DevTools documentation and
source audit found command/context/platform gaps. Pure repository preprocessing
and Fluent parsing confirmed duplicate Ctrl+J (search2 vs Downloads) in the pending
patch. Two production files remain untouched by this audit. Reuse CustomKeys where
possible, but it cannot itself change command destinations or toolbox semantics.
Reserved-key remapping can change page-event visibility; recommend explicit user
opt-in, preserving Firefox defaults. Owner ruling and implementation authorization
remain pending; no browser/profile/launcher modifications or new runtime tests.

## October 15: Recovery And Hotkey Handoff

HEAD ed5c2e1dea6e. Two uncommitted tracked edits match the owner-supplied report
docs/umbrafox/archive/bug-reports/2026-10-15-chrome-parity-hotkeys.md: Downloads Ctrl+J and
New Private Window Ctrl+Shift+N, with conflicting Undo Close Window shortcut
removed. Preserve, do not reapply; unbuilt/uninstalled/runtime-unverified. Report
requires owner request before committing/pushing this separate patch.

Read-only recheck still finds PID3651740 (Oct14 15:05:30 start) executing dated
Oct1 build, not installed fixed nightly. No browser/profile/launcher changes.
Owner clarified abrupt exits while submitting chat/changing tabs, no reporter;
cause and exact incident times remain unresolved. Logging wrapper is proposed,
not installed. No restart/termination/debugger without consent.

ARM build is COMPLETE, not ongoing. Coordinator DB event46 reports Pi beta
20261014135715 deployed; events48-49 report HDMI audio fix/owner-confirmed tone.
Pi runtime belongs to l8ros; these are attributed reports, not our fresh checks.

## October 14: Read-Only Random Exit Triage

Owner reports latestnightly randomcrashes. Actual active3651740 exe+libxul dated
Oct1, INIs20261001103920, NOT installedfixed20261014043800. Launcher stillprefers
dateddirs; no switch performed. stdout/stderr /dev/null. Two scopes ended14:32:27
and15:05:18Arizona, no signal/status; no recentcore/OOM/segfault/minidump found.
Currentprofile crashstore8records newestOct5. ThatOct5report isServiceWorker
shutdowntimeout, notproof fortoday. Causeunresolved; askedincidenttimes/CrashReporter.
Report docs/umbrafox/archive/reports/2026-10-14-desktop-crash-triage.md. Browser/profile/launcher
untouched; anydebugger/restart/logginglaunch requiresseparateconsent. ARMcontinues.

## October 14: ARM Packages Complete

Final build48247/package24582/normalverify51226/betaverify89017 all exited0.
Exports exports/umbrafox-arm-20261014/: bothBuild20261014135715 native+INI+header
matching; normal99237048B SHAebc8f575843aac6e9e19d2e45f488422250892858f7c291516a01fbbdf70c059;
beta110565684B SHAfc3ba2d3139fc1021fb2c1d20db2b041b9a34759270300f8e8984a992fec1436.
28ARM64ELFs/46normalfiles; beta47only adds348B two-pref overlay4278e82f... .
9validator+5archive+2pref testsPASS. Sourceclean c0e7f8a2be04/probesOFF/empty patch.
No active buildneeded; l8ros owns deployment+Pi runtime. No desktop install.

Owner now requests commit/push all work, then ARM build; l8ros coordinates.
CORRECTION: coordinator is Pi agent tmux l8ros:1.1, NOT Codex thread01a0cb3e.
Use authorized tmux injection after checking pane input, plus teamwork_events.
DB /tmp/codex/teamwork/20261014T2105Z-l8ros-arm.sqlite, session same basename,
task track-arm; bus /tmp/codex/l8ros-arm-bus.txt read after each command.
ACK sent. Own isolated build/package/provenance only; NO Pi or desktop changes.
Published clean pin c0e7f8a2be0460695c1f65ae8796b09c1082480c includes prior fixes.
Build scratch ~/.cache/codex/umbrafox-arm-20261014-gZmxuBOR. Original session10437
ended143 by approved own-group TERM; group absence proved. Session10757 resumed
C++6 but later host geckodriver inherited6make tokens despite CARGO_BUILD_JOBS2.
After libxul link50:54, stopped own group3551980/exit143, absence proved. Final
session48247 SAME obj make2/Cargo2/nice10/3600s, build-final-j2.log. Both earlier
logs/stop/exit receipts retained. No source/config change.
MOZ_BUILD_DATE retains20261014135715; config/header hashes unchanged. Memory
guard: below8GiB reduce4/below5GiB reduce2. Full build and packaging now PASS.
Normal mach package + exact two-pref beta overlay explicitly requested, probes
OFF for both. Handoff archive/size/SHA/BuildIDs/overlay/source-patch/layout/export.
No ARM native execution authorized; coordinator owns it. Preserve unrelated
untracked upstream remnants and never stage generated binary archives.

## October 14: Daily Nightly Switch Prepared

Newest request: select fixed nightly for daily use and check Pi access. Pi SSH
works (l8ros@192.168.1.138, Pi4, 15days uptime); no Pi changes. Desktop browser
PID2370894 still runs dated20261001 with cjmrhtcu.default-default-2. Nightly key
301410E7660F9C94 maps to older kvm20oct in both INIs; must remap to current cj
before changing launcher, otherwise owner gets an old profile again. No data copy.
Asked permission to close/reopen, awaiting reply; live browser/settings untouched.
Prepared tested6/6 nightly-only launcher and backups in
~/.cache/codex/nightly-switch-20261014-8LupEmR5/. Installed47files hash/mode/size
verified Build20261014043800; desktop/HTTP/HTTPS associations correct. See newest
.codex/DETAILS.md section for exact paths and next steps. Do not claim switched.

## October 14: Paused Audio Stream Reuse Bug Fixed And Verified

Fix/report committed as d74c12c71fdf. Package provenance remains the recorded
d43214 base plus frozen source.patch, not a claim it was built from that commit.

Active request: continue until the post-seek stutter is found and fixed. Desktop
daily browser remains untouched; isolated laptop runtime is authorized. Plan
docs/umbrafox/archive/plans/seek-audio-reuse.md. New main changes are limited to AudioStream.h,
AudioSink.h, AudioSinkWrapper.cpp, its gtest and two adjacent docs.

Logged laptop XkWE68 (seek-audio-log namespace) caught actual stream stop/start,
then rebase with play1163952/write1171312/carry0:7360frames=153.333ms at48kHz
lost from mapping. Pulse stop corks without flushing. Wrapper incorrectly reused
an already-stopped stream. Fix admits reuse only for keep-running+backend-started
+logical STOPPED; otherwise existing asynchronous recreation. Native38tests:
RED35pass3expectedfail -> GREEN38pass0skip/cleanownedexit. Continuous reuse passes.
No public interface/default change. Raw-position-query failure fallback remains
a separate unobserved edge, not this receipt's cause.

Durable build/tests: ~/.cache/codex/seek-audio-fix-20261014-5oJiex. Reuses isolated
~/.cache/codex/umbrafox-beta-20261012-nYSBPOWS/source+obj; preserve existing3
build repairs. Native diagnostic packages never installed. Normal candidate
BuildID20261014043800: initial binaries-only retained oldBuildID and package
validator rejected it, preserved package-rejected-stale-buildid. Full incremental
build and native regeneration corrected it. Normal self-contained47file package
now verified, manifest e097f7f7c0d8ff39146f173475731282c1e4574f1e3835e66e19861042d47d05.
Archive398f90ee...b8d in exports/umbrafox-seek-audio-20261014. Same-build UmbraLink
OFF/ON parity+native-root/build/pref receipts PASS, clean owned exits.
Installed ~/Programs/umbrafox-nightly, exact47files+.purgecaches, versionexit0,
PID2606827absent. Backupumbrafox-nightly.before-seek-audio-20261014-043800.
Installer4testsPASS; active target refused. Launcher36b8df60... unchanged and
stillprefers dated installs; ordinary restart does NOT select this beta.
Do not change daily selection without verified existing profile mapping.

Verified package exports/umbrafox-seek-audio-20261014, pinned beta12 baseline
then candidate/loggingON then candidate/loggingOFF, same laptop130sUIseek workload
(sequence now complete, no retries).
New89file harness on laptop ~/.cache/codex/seek-audio-candidate-harness-Rnu5Rx,
manifest54718252...b13f1, package pairseek-audio-package-pair-20261014-PlXFgB.
BaselineHzI4G9 completed:27/1201 before,402/2674,583/2699,427/2502 recovery;
actual stop/restart/rebase repeated cursor mismatch. Candidate-logfSoCso passed
10/2677,9/2700,5/2499; logged stoppedstream destroyed/recreated, noRebaseLive.
Candidate-offXHPfNx passed8/2677,5/2700,5/2498. Sixrecoverywindows below1% gatePASS.
Each37samples/14recordedPIDsabsent/cleanSIGTERM/0logdrops.05:10:36UTC89inputs
unchanged/no matching browser/compiler; allcommands terminal. Keep
all prior failed/successful captures. Docs rendered but scoped Sphinx fails82
global missing-toctree warnings; no AudioStream/AudioSinkWrapper page warning.
Report docs/umbrafox/archive/reports/performance/2026-10-14-seek-audio-reuse.md; fixed reproduced
case, not allYouTube/network/graphics issues. Main test differs compiledGREEN
only comment/formatting, exactreconciliation recorded; productionhashesmatch.
Candidateevidence59files2950599bytes sealed/verified; SHA256SUMS
f00401af476262f1eeadd8ef9da4e86155d3684c3948949da23ea6da36a9fcb5.

Prior ABBA A/B/C completed (recreate consistently low drops), fourth A stopped
on unstable artifact scan, not performance evidence. Narrow logging reuse run
then reproduced6.43/5.19/5.24% drops with the cursor mismatch above. No profiler.

## October 13: Short Capture Retains Seek And Clock Plateaus

Latest report docs/umbrafox/archive/reports/performance/2026-10-13-seek-transition.md;
plan docs/umbrafox/archive/plans/seek-transition.md complete. Evidence namespace
artifacts/umbralink-control/seek-transition/ sealed via SHA256SUMS/seal.json.
Seal113files11861284B manifest8796fb596237895bb86ececd4d1c0a480ff9dd76522a3ea21a4809437de55fc7.
No engine fix/build/default change or desktop/Pi/personalprofile action.

One quiet-laptop OFF+ON using old Build20261006175655 (notbeta). All4 private
anchors survive; origin36513.455811ms, parent3476678/content3476840,context11,
doc10737418243. Firstsecondafterprivateafter-seek:61/103clockintervalsflat,
11advances42.666-42.667ms. Jitter absmedian8.57/P9533.90ms;24drop events31frames
allqueuedbeforepreviouscomposition,23priorunchanged. Renderer derivedmedian0.894ms,
P951.473/max2.206. Later clockplateaus5/406 then0/381. No source/backend/query
latency proof;42.667ms consistentwith2048frames@48kHz is notbackendidentification.
Wholecapture36drop events46frames;35strictjoins(34queued,1notqueued),1unknown
2frameeventdueIDgap3. Do notgeneralize priorallqueuedresult. Preseekbaseline6ms.

OFF postseekdrops8.97/6.37/7.56%;ON24.51/32.27/28.06%, laterprofilerinactive.
Observer/export effects andvariabilityunresolved. No claimedfixorcausalpenalty.
ONuntimestampedVideoBridgeParentAbnormalShutdownwarningpreserved/unattributed.
Both cleanSIGTERM14recordedPIDsabsent,37resources,0logdrops.74runtimeinputshashes
unchanged21:42:35UTC/no matchingbrowser/compiler. No active tool sessions.
130strict testsPASS;14manualfilelintPASS;savedreviews+analysisexactreplayPASS.
CLIload/stoptextprefixfailurepreserved;secondofflineexport/cleanupsuccess,
PID1813271+1813282/socketabsent. Rawgzip5927039B SHA
cb66d81a1895c8f68aac7e699b75eef530d8fdc5a31b51a82ed08862b6d3bce1.

Next: separately scoped native internal observation of existing selectedclock
branch/pairedsystemtime/querybeginend/seekhold+callbackstate, withstableidentity
andnoextraGetPositioncalls. No repeatofsamecapture, publicsurfacechange, guessed
clockbias or synchronization removal. Priorsealedseek-markers evidenceunchanged.

## October 13: Seek Drops Localized To Frame Timing/Selection

Completed bounded laptop OFF/marker-ON wave with one deliberate ON recovery for
our gzip-envelope adapter bug; old failure preserved. No Gecko fix/build/default
change, desktop/Pi action or personal profile access. Build20261006175655, NOTbeta.
OFF recovery drops1.53/.33/1.88%; correctedON5.30/9.86/7.89%. Profiler cost and
run variability unresolved. Profile retained onlylate83-86s, notseektransition.

448 explicit dropped frames were queued before the preceding composition under
count/contiguous-ID validation;439 previous compositions repeatedoldframe.
6091 same-frame timestamp revisions absP9511.42ms/max18.2ms. Renderer CLI-derived
Composite median1.110ms/P991.907ms/max2.670ms. Strong clock-mapping/selection lead,
NOT causal audio-backend/GPU proof. Native VideoSink recomputes targettimestamp
from paired system/media clocks; AudioSinkWrapper can use audio/system/seekhold.
Package-source hashes verified, runtime branch/querylatency still unobserved.

Report docs/umbrafox/archive/reports/performance/2026-10-13-seek-marker-localization.md;
plan docs/umbrafox/archive/plans/seek-marker-localization.md. New ignored evidence
artifacts/umbralink-control/seek-markers/ sealed134files121149058B; manifest
aada49b5de31f470006fd44f404c00cb243bdca5b7239a56698e5574e307ffe8.
ProfileSHA3ad5cb83c6ec8e530e415a6b8e2c3890b12545a84c3519b017b9d67d9eadf6fc.
109strict tests PASS/scopedlintPASS. Three runs cleanSIGTERM/14PIDsabsent each;
two CLI+samply pairs stopped/absent. Final laptop18:34:34UTC postflight all71
files/harness unchanged and no matchingbrowser/compiler. No active tool sessions.

Next: short bounded transition capture resolving clocksource/pairedsystemtime/
querylatency/frameidentity; existing observations first, private marker only if
needed. Retain OFFcontrol, no bias/fence/threading workaround without causality.
Full details/failures/commands/coverage limitations in report. Prior evidence intact.

## October 12: Audio-on Seek Reproduces Sustained Drops

Completed authorized quiet-laptop comparison, desktop untouched. New namespace
artifacts/umbralink-control/audio-on-seek/; report
docs/umbrafox/archive/reports/performance/2026-10-12-audio-on-seek.md and completed plan
docs/umbrafox/archive/plans/audio-on-seek.md. NO native/product/default change or new fix.

Existing laptop Build20261006175655 (NOT October12 beta), AV1 1080p60 public
aqz-KE-bpKQ, normal menu/private iHD, X11 Intel. Four native audio endpoint reads
only, no native audio/decoder read during timed interval. Advancing audio sink,
volume0.05/unmuted; original state restored. Actual UI seek22.77s->45s and
130007ms after seeked. Control48/9000 totaldrops; seek791/9078. Recovery windows
control0.22/0.26/0.38%, seek10.42/10.49/9.04%. Final native drops control48
compositor/0decoded/0sink; seek845compositor/0decoded/1sink. Different observation
boundaries explain845vs791. One pair is not causal/repeatability proof; no visual
black flash or complete recovery established. ffvpx label is not software proof;
hardware flag cached. Frame-choice/timestamp/delivery versus render waits remains
the next distinction. Source proof pins7 files to package base8924318+patchd1bf3bdf.

First control dGBpso stopped before playback at artifact-scan ENOENT after3tries;
evidence retained, clean2recordedPIDsabsent. Exactly one startup replacement
ExSqOr completed; seekzWKDpm completed. Successful runs37samples/14recordedPIDs
absent each, cleanSIGTERM0logdrops, 240/225/15s+256MiB limits unchanged.
Remote harness /home/wyatt/.cache/codex/audio-seek-harness-PbcPcg; postflight
2026-10-13T05:42:00UTC all67runtimeinputs unchanged/no matching browser/compiler.
201 strict tests PASS; authored helpers/offline/tests lintPASS. All sessions ended.
No profiler/build/Pi/desktop disruption/staging/commit; old evidence untouched.

Next wave needs an explicit bounded observer-sensitivity/localization contract;
existing source markers cover ImageComposite timestamp jitter/frame selection.
Do not automatically repeat until rough playback appears, change clock bias, or
infer costlyGPU work from the compositor counter. Owner's exact audio/stream/seek
pattern still unanswered. Beta installation/launcher caveats below still apply.

## October 12: Opt-in Performance Beta Built And Installed Separately

Build20261012202039 /160.0a1 prepared from d43214d67041 plus direct Services.h
include and test ContentParentId compatibility fixes. Self-contained experimental
archive exports/umbrafox-beta-20261012/umbrafox-beta-20261012202039-linux-x86_64.tar.xz,
SHA75d03f82d3282c64eafbe3312087bbf2284613ef0aad3608892774ff82081e92.
Exact two-pref overlay enables DMABuf drawImage + single-image opacity; normal
defaults remain false. Optimized native build, probes compiled out, profiler off.
Installed ~/Programs/umbrafox-nightly, .purgecaches and all47payload files verified;
version command PASS. Prior nightly retained as nightly.before-beta-20261012-202039.
Usual launcher still prioritizes active dated October1 install. NO owner-browser
restart/profile/default-mapping/taskbar/launcher change. Do not suggest a normal
restart selects beta; switching needs current-profile mapping verification.

Tooling467PASS on Node24; archive5PASS; installer4PASS; isolated UmbraLink OFF/ON
parity/startup/preferences/native roots and clean owned cleanup PASS. Native GPU
86cases:79PASS/7FAIL/0skip. All63non-prescale regressions pass on NVIDIA RTX2060;
7 known prescale characterization failures remain retained, no tolerance changes.
Current canvas fallback no longer uses that sized CPU helper. Cache fixture
separately repaired explicit small target Init and actual RGBA/BGRA input format;
12cache cases PASS, exactpixels/loss/ownership assertions unchanged in intent.
New test-only delta is not silently folded into sealed normal-package patch.
Prior smoothness failures persist; no new YouTube/performance/universal parity claim.
Report docs/umbrafox/archive/reports/performance/2026-10-12-opt-in-beta.md; build/evidence root
/home/wyatt/.cache/codex/umbrafox-beta-20261012-nYSBPOWS/. Commands terminal.
Unrelated old untracked upstream files remain untouched. Supersedes the historical
in-progress note below; see git log for final own-file publication.

## October 12: Historical Beta Build Checkpoint (Superseded)

Wyatt explicitly requested enabling the experimental GPU video-to-canvas path
and preparing a beta with our optimizations enabled. Package-only overlay in
tools/umbrafox/beta/ enables DMABuf drawImage and single-image opacity; normal
source defaults remain false. Two focused tests pass; scoped ESLint/Prettier pass.
No profiling/logging, sandbox, user-agent, hardware-force or update-channel
override is part of this opt-in. Prior smoothness failures remain unresolved.

Build started in isolated detached worktree at d43214d67041:
/home/wyatt/.cache/codex/umbrafox-beta-20261012-nYSBPOWS/source/.
Object directory is its sibling obj; source/mozconfig uses sccache and explicitly
disables umbra-perf-probes. Command: CARGO_BUILD_JOBS=2 nice -n10 timeout7200s
./mach build -j2, with output in sibling build.log. First build hit its 7200s
bound (exit124), with no compiler error; exact workspace compiler scan empty.
Incremental continuation is active with the same command under timeout3600s,
log build-continued.log, tool session79355. Optimized Rust compiled successfully;
native C++/link work remains. Config is Firefox UA/160.0a1/optimized/probes off.
No completed beta package/install/runtime result yet. Scratch package_beta.py
and package_spec.py have5 passing archive-validation tests; native-contract
checks3 PASS. run-native.mjs and beta-parity.mjs are prepared, NOT executed.
Main checkout has older untracked files; leave them untouched. Build isolation
avoids consuming them. Current desktop browser/profile/launcher stay untouched.
Asked whether the usual launcher should select the beta or it should stay
separate; response pending. Verify profile mapping before any launcher switch.
Finish native build, package, overlay/hash, isolated tests and safe installation;
do not describe this in-progress note as completion or stop at a running build.

## October 12: Upstream Source Integration

Owner requested commit/push of existing work, then upstream merge before any
more optimization. Original work is committed and pushed as f16351a82412;
local recovery branch sync-before-upstream-20261012 retains that revision.
Integrated upstream/main 1a097ed8d31f6b307a5d0ebc34a82ceaf7f3727b, 4,399 incoming
commits. Resolved 21 conflicts, including the tab.js -> tab.mjs move, canvas
draw-target/content ownership, DMABuf BufferSurface changes, and both the fork
opacity setting and upstream YUV overlay setting. Experimental defaults stay OFF.

Final combined-tree tooling suite: 465 PASS. Additional probe-contract 14 PASS,
sampling-parser 36 PASS, isolated Rust probe OFF 3 / ON 22 PASS. The import-cache
fixture now covers 48 cases, including cross-content and null-target admission.
Scoped ESLint: zero errors; firefox.js is intentionally ignored by its config.
Mach's new lint-environment setup timed out, so installed ESLint was used.
No complete Gecko/native build, real-GPU tests, or runtime parity run performed.
This is source integration, not a newly built or installed prototype.

Report: docs/umbrafox/archive/reports/2026-10-12-upstream-sync.md. Evidence/backups:
/home/wyatt/.cache/codex/umbrafox-upstream-sync-20261012-ssNJPxDz/.
Generated browser packages/extractions remain on disk but are excluded from Git;
source snapshots, manifests and reports are preserved. Check git log/status for
the merge commit and origin publication. No installed browser/profile changed.
Next optimization contract remains docs/umbrafox/archive/plans/audio-on-seek.md; do not mistake
this merge or old muted tests for reproduction of the audio-on seek symptom.

## October 12: Default Profile Migration

Owner closed browser and requested normal default selection plus profile copy.
Completed: ~/Programs/umbrafox no longer injects -profile; existing .desktop
already had none. HTTP/HTTPS/HTML/XHTML and KDE default now use umbrafox.desktop.
Copied kvm20oct.default-default-1 to current install default
cjmrhtcu.default-default-2 using rsync -aHAX via staging, excluding stale locks.
Full checksum/metadata verification and seven critical SHA checks pass. Original
profile preserved; previous destination/config backups and migration receipt:
/home/wyatt/.cache/codex/umbrafox-default-profile-20261012-a8aqZ5ON/.
profiles.ini/installs.ini unchanged. Launcher mock tests, syntax, desktop entry,
and OS default queries pass. Browser stayed closed; reopening/link routing not
yet runtime-tested. Later installs need their per-install default mapping checked.
Performance work below unchanged; no new performance run/build performed.

Snapshot: October 7, 2026 Phoenix / October 8, 2026 UTC. Written immediately at
Wyatt's request, after a context reload. This is a factual handoff, not a claim
that the investigation or active performance goal is complete.

## Latest: Audio-on Path Admitted

Updated2026-10-08T04:10UTC. Phase2 private bridge/capture integration and ONE
phase3 isolated laptop run completed; all earlier phase1 and muted evidence
unchanged. Report docs/umbrafox/archive/reports/performance/2026-10-07-audio-clock-admission.md;
next contract docs/umbrafox/archive/plans/audio-on-seek.md. That next long-seek adapter is NOT
implemented yet; do not rerun the short admission or repeat old muted ABBA.

Actual run04:05:10..04:05:25UTC, root
/home/wyatt/.cache/codex/laptop-audio-admission-audio-20261007-AMoTqL.
Fresh owned profile/app-data/local-data/temp/private installation. Same fixed
public video,1080p, no seek, profiler OFF. Same element/document10737418243,
browser2303940/content2304110. Low volume0.05/unmuted; native sink48000Hz,
written45056->92160, lastGoodPosition757083->1770916us. Query durations
1.686926/1.238523ms, gap1008.973105ms. Paused/unmuted/volume1 restored.
Only progressing observed sink: clock enum/audible output remain unobserved.
GetClock query can affect handoff; no zero-overhead, reproduction or fix claim.

Decoder ffvpx name is compile-time family, NOT a software-only label. Frozen
six-file source trace explains compatible reported hardware=true: remote init
cache then MediaFormatReader output cache. Initial shutdown label can coexist
with last cached flag. Private iHD mapping verified, not continuous/per-frame
backend proof. New decoder-source-proof.json; no product/native change.

44 prelaunch tests, plus2 saved-data review tests/20 corrupt cases;46PASS.
Actual RED for secondary write masking resource abort fixed; first scaffold
had a test syntax error, explicitly not behavioral evidence. Exact eight-RPC
capture ledger, serialized private child, timeout/late-reject/restoration tests.
Runtime uses existing120/105/15s envelope,256MiB cap; no build after cleanup.
5resources+baseline capsPASS; peakRSS2428342272B/artifacts80546623B sampled.
CleanSIGTERM,14recordedPIDs absent,324Blog/0drops. No browser/test/SSH remains.

New laptop harness /home/wyatt/.cache/codex/audio-clock-harness-5CWvps;
59inputs55syntax185edges,51200B delta, manifest
7f63945415ad75949f3e2ec1d577b834b371673c72b829828e3c60dc7715fd17.
Raw46file/160341B export SHA
b1edd01a7866489cdb2652201e7c0c292b5ba905a0944a4a6fa02a3b9ccca9eb.
Named docslint0errors/0warnings using prebuilt mozcheck. Lint recreated only a
32KiB obj/.mozbuild/logs tree; finalabsence gate caught it, log preserved under
new namespace/lint-profile.json, exactfile/emptyparents removed. No nativebuild.
04:10postflight59filesunchanged/no namedbrowser-buildprocess; systemiHDhash
a7cecd28...unchanged/nonfree notinstalled. Desktop/Pi/defaults/index untouched.
Phase1 plan/report remain frozen historical status; this section supersedes.
Finalseal04:16:23UTC covers99files, evidence.json SHA
35ae0c796b1fd7dc8ba6c995dfc702916d66ecadad450462a1dc5f77b3adb5e5.
22phase1/102oldsealed/59runtimefiles verified; staged and tracked unstaged
diffs match cleanup snapshot. Do not edit this completed namespace/report.

## Build Cleanup: October 7 Phoenix / October 8 UTC

Wyatt requested a make-clean equivalent to reclaim disk space. Removed only
the generated obj-x86_64-pc-linux-gnu and obj-aarch64-linux-gnu directories.
Both were real object directories, contained no Git-tracked files and had no
observed active process cwd/executable or relevant browser mappings using them.
Direct removal was used to avoid mach --full also clearing its shared function
cache. No browser was closed, restarted, controlled or signaled.

Measured project usage:82,482,798,592 ->33,357,254,656 bytes
(76.8 ->31.1GiB), reclaiming49,125,543,936 bytes (45.8GiB).
Artifacts11,768,995,840 bytes, exports9,741,484,032 bytes and Git6,404,370,432
bytes were retained unchanged in size. Git status and both staged/unstaged
diffs compared byte-identical before/after removal, before this handoff note.
Cleanup logs/checks: /tmp/codex/umbrafox-clean-v246rfFG (temporary).

IMPORTANT: old references to obj-*/dist/bin, buildconfig.rs, config.status and
other generated native-build inputs are now historical, not usable files.
Next native build needs a full regeneration/build. Source mozconfig files,
installed/exported prototypes, source changes, saved evidence and profiles
were not removed. No investigation runtime was launched during cleanup.
The audio-path investigation below remains the latest engineering state.

## Earlier Engineering State: Audio Path Coverage Gap

Updated2026-10-08T01:38UTC. The source-only follow-up found a useful missing
test dimension: inspected startup and seek harnesses explicitly set
`video.muted = true`. The frozen deployed source can shut down AudioSink when
effective volume is zero and use system-clock playback. Audible playback has
additional audio-stream startup/handoff/seek-resume paths. This is a coverage
gap, NOT a cause or fix; old captures did not observe actual native clock source
or continuous mute. Owner was asked whether affected playback had sound on;
answer is pending at this snapshot. Do not repeat the prior muted ABBA.

New plan `docs/umbrafox/archive/plans/audio-clock-admission.md` and report
`docs/umbrafox/archive/reports/performance/2026-10-07-audio-clock-coverage.md`.
Namespace `artifacts/umbralink-control/audio-clock-admission/` is NOT runtime-ready.
Phase1 complete: audio.mjs allowlisted projection/paired admission/bounded
collector; test/audio-spec.mjs18PASS under strict unhandled handling;3JSformat
PASS. Source-proof.mjs/json pins12 files to base8924318 plus unchanged frozen
package patch d1bf3bdf, source manifest a9befff9;5 mute-setting fixtures hashed.
Source proof replay identical. Prior102 sealed files and53 runtime inputs
verified unchanged. Initial missing-module RED is scaffold-only;4 behavioral
deadline/admission REDs retained and fixed (last one is independent saved-pair
query-span validation). Final18PASS76ms, named docs lint0errors/0warnings.
Nothing launched on any browser.
Phase1 checkpoint: audio-clock-admission/phase1-checkpoint.json, SHA256
6523b66c7494c78090b1b45d3f20708fe1357ac1d9f4243fef414a71db638454.
It is a tooling snapshot, not runtime acceptance; preserve it when extending
phase2. Final docs recheck also passed with zero errors/warnings.

Important exact meanings: existing mozRequestDebugInfo guard is
HasDebuggerOrTabsPrivilege, not literally ChromeOnly. AudioSink's isStarted
dictionary field is unpopulated and must NOT be used as a positive requirement.
Default zero/false sink fields do not prove absence. Positive rate/written plus
advancing lastGoodPosition supports an observed progressing sink, NOT audible
output or continuous clock selection. ClockSource enum is unexported and stays
"unobserved". GetDebugInfo invokes GetClock and can itself affect handoff/queue
state; do not claim a passive/zero-overhead probe. Native queries may still run
after timeout; late rejections are observed, not native cancellation.

NEXT phase2: compose private frame bridge and existing owned capture runtime,
with exact process/context/document and persistent element identity across the
pair, deadlines/evidence/cleanup failure tests, source/import closure pins.
Then one prospective low nonzero element-volume laptop path-admission run,
not an effect comparison. No host audio settings or backend changes. No driver
exists yet; do not launch the collector as though it were a complete harness.
Later matched seek/control design depends on that admission. Owner desktop,
Pi, native/product/public surfaces, system driver and Git index remain untouched.
All source/test commands completed; no process/session needs polling.

## Previous State: Fixed Sequence Completed

Updated after the immediate dump: all four prescribed laptop runs completed,
were exported, independently reviewed, and their exact recorded PIDs were absent.
No browser, SSH, profiler, or test command remains running from this wave.
**Do not repeat this ABBA sequence just to obtain a rough sampled run.**

Final observations, all 1200 frames over 20 seconds:

| Run | Dropped | Thread samples | Runtime root suffix |
| --- | --- | --- | --- |
| control-1 | 24 | None | control-20261007-GV0yFB |
| sampled-1 | 0 | 102, no missed slots | sampled-20261007-S3OFOv |
| sampled-2 | 0 | 102, no missed slots | sampled-20261007-uYfR9P |
| control-2 | 0 | None | control-20261007-HNqQm0 |

The suffixes extend `/home/wyatt/.cache/codex/laptop-startup-thread-sampling-`.
All four had nine resource samples, zero log drops, clean SIGTERM cleanup,
14 recorded PIDs absent, hardware AV1 receipts, and matching binary/INI/fixture
hashes. No system driver change; nonfree remains not installed system-wide.
Final 53-input/quiet postflight `2026-10-08T01:17:51.247Z`; system metadata
`01:18:09.142Z`. Both sampled captures had no pending sampler read at stop.

The first control's 24 drops are native compositor-category drops: 23 were
observed between the 5003/6002 ms counter samples, one between 16013/17001 ms.
These are counter-observation brackets, not actual drop-time measurements.
Both sampled runs and final control were smooth by these counters. No causal
observer benefit and no stall location established. Owner's prolonged seeking
stutter/black flash remains unreproduced.

In the two smooth sampled runs, 99 certainly interior intervals per thread
cover about 19.8 seconds, excluding two boundary intervals. CPU milliseconds:
parent main 1100/1060; Renderer 1400/1560; Compositor 680/720; selected content
main 1430/1610. Clock uncertainty 23.704/18.540 ms. These are quantized CPU
measurements, not waits, per-frame attribution, or the cost of a rough period.

New offline `analysis.mjs`, `recompute.mjs`, and `test/analysis-spec.mjs` preserve
strict clock boundary exclusion, identity/counter validation, and replay.
`comparison.json` is authoritative; `comparison-replay.log` confirms deep
equality. `commands.json.runs` now contains all four roots and file names.
Final combined gate **53 PASS**, 0 fail, 0.635 s; 13 manual JS files pass
Prettier. `completed-input-verification.json` verifies all 96 prior sealed
files and all 53 current runtime inputs unchanged. The earlier 38/41-test
receipts are preserved history, not the final count.

Report: `docs/umbrafox/archive/reports/performance/2026-10-07-startup-thread-sampling.md`.
The plan and DETAILS top have been reconciled to this completed state.
Named documentation lint passed with zero errors/warnings; scoped diff check
passed. All validation commands finished. The final metadata seal is
`artifacts/umbralink-control/startup-thread-sampling/evidence.json`.
Sealed at `2026-10-08T01:22:58Z`: 102 files, manifest SHA256
`777f02e7339996368dba5af419285a9b2076b3cccabd6117d5d49d06062b6b6b`.
Do not edit that namespace, report, or plan after this seal. MEMORY and DETAILS
are mutable continuity documents and deliberately excluded from the seal.
Final seal/verification records in the namespace govern completion evidence.
No product optimization or deployment was made by this wave.

Next useful work: use the source-backed drop-producer map and saved startup
evidence to distinguish compositor scheduling/queue transitions from CPU
execution. Do not infer a GPU wait or network stall from these results. A new
runtime experiment needs a changed, falsifiable contract, not another identical
capture. Matching the owner's affected stream and single-seek versus repeated
scrub behavior remains an independent missing workload detail.

The broad owner objective remains unfinished. On this resume `get_goal` returned
null; the objective is conversation context, not a currently active tool goal.
Do not create a replacement tool goal unless explicitly requested.

## Earlier Resume Point (Superseded)

The current experiment is a fixed laptop control / sampled / sampled / control
sequence. The first two browser runs have exited successfully. Only the first
has been independently exported and reviewed. **Do not relaunch either run.**

1. Export and review the completed sampled-1 run identified below.
2. If its actual evidence passes, verify uploaded inputs and laptop quietness,
   then run sampled-2, export, and review it.
3. If that passes, verify inputs/quietness again, then run control-2, export,
   and review it.
4. Verify postflight input hashes, exact owned-process cleanup, and unchanged
   system driver. Analyze saved evidence with clock uncertainty respected.
5. Update the plan, report, this file, and `.codex/DETAILS.md`; seal evidence
   only after verification. Keep failures and limitations.

Stop the prospective sequence on the first actual runtime/review failure.
Do not make outcome-driven replacement captures. A preserved metadata-export
argument correction is not a browser rerun.

This snapshot supersedes the stale top section of `.codex/DETAILS.md` and the
progress section of `docs/umbrafox/archive/plans/startup-thread-sampling.md`: those still say
38 tests, no runtime driver, and no browser launch. Drivers now exist, 41 tests
passed, and two runs have completed. Reconcile those documents later.

## Owner Intent and Safety Boundaries

- Active broad goal: "squeeze every last ounce of perdormance out of the
  rendering engine, the layout engine, css, javascript. Get creative. Lean
  more on hardware accelleration when possible." Do not silently narrow it or
  mark it complete because this experiment ends.
- Wyatt's latest symptom: after **seeking with the video progress bar**
  (rewind/fast-forward, not searching YouTube), playback sometimes stutters
  for a minute or two, briefly flashes black, then becomes smooth. That exact
  sequence has NOT been reproduced. Short startup drops are a separate clue.
- `wyatt-laptop` is authorized for isolated tests and is mainly a bot machine.
- `wyatt-desktop` is Wyatt's actively used daily browser. No closing,
  restarting, navigating, changing settings, or otherwise disrupting it
  without heads-up and consent for the action. This wave does not use it.
- No Pi work this wave. Another owner controls physical Pi lifecycle.
- No system driver installation without fresh explicit consent. The existing
  private child-only iHD copy is allowed; it is not a system installation.
- No agents, staging, commits, reset, revert, product/native/default changes,
  or public browser API changes in the current wave. Preserve the large dirty
  and staged tree. Dirty current source is NOT deployed-source authority.
- Never SIGKILL. Keep owned-process cleanup identity-bound and bounded.
- No personal profiles, shared crash queues, or unrelated private data.
- No profiler daemon or raw-profile parsing this wave.
- Standing mandatory rule: Umbrafox must look like the corresponding Firefox
  to websites and servers. No detectable default JS/DOM/WebIDL/network/media/
  storage/timing surfaces. Private owner-local diagnostics are not permission
  to alter public interfaces. Read the modification rulebook before changes.

## Bootstrap and Local Workflow

Repository: `/home/wyatt/Projects/umbrafox-workspace/umbrafox`.
Read `~/.bot-common/startup.md` first after every context reset, then its required
quirks/rules and AGIS runtime. Project `.codex/quirks.md` and `.codex/rules.md`
were absent. `AGENTS.md` contains the mandatory bootstrap rule. Finish bootstrap
with `Fired up!` and continue, not stop.

Important instructions: `docs/umbrafox/conversion-guide/02-mandatory-modification-rules.md`.
Skills used: umbrafox-link, firefox-desktop-frontend, documentation, mozlint,
planning-cap. Read relevant skills again when needed. Use Searchfox for upstream
discovery; local searches must be narrowly scoped to known local changes.
Installed searchfox-cli 0.18 advertised 0.20.5; no update was installed.

Use `apply_patch` for manual edits, bounded commands, structured JSON parsers,
and unfiltered log files for slow commands. Do not overwrite sealed evidence.
Reports belong under `docs/umbrafox/archive/reports/`, plans under `docs/umbrafox/archive/plans/`, current
tooling evidence under repository `artifacts/`, large owned runs under home cache.
Do not expose control credentials in reports. No active executable tool session
was known at this snapshot; sampled-1's session 83214 returned terminal exit 0.

## Current Experiment and Files

Unsealed namespace: `artifacts/umbralink-control/startup-thread-sampling/`.
Plan: `docs/umbrafox/archive/plans/startup-thread-sampling.md`.

Manual modules:

- `sampling.mjs`: parsing, identity admission, deltas, clock bounds, scheduler.
- `proc.mjs`: bounded Linux process/task reads.
- `capture.mjs`: adapter around the frozen prepared/startup capture.
- `review.mjs`: independent saved-data validation.
- `generate.mjs`: narrowly generates runtime adapters.
- Mirrored tests: `test/sampling-spec.mjs`, `proc-spec.mjs`, `capture-spec.mjs`,
  `integration-spec.mjs`, `review-spec.mjs`.

Generated files: `runtime.generated.mjs`, `driver.generated.mjs`,
`review-base.generated.mjs`, and `generation.json`. Exact inverse/source-region
proofs tie these to sealed precondition code. Do not casually format/edit them.

Other important files: `commands.json`, `runtime-inputs.json`, `bundle.json`,
`runtime.tar`, `host-metadata.json`, `clock-source.json`, `preflight.json`,
`between-1.json`, test/format/RED logs, and per-run stdout/export/review files.
`verification.json` is the previous 38-test preparation receipt, not a final
receipt for the current 41-test/runtime state.

`commands.json` stores the fixed schedule, exact launch commands, upload,
source-proof, export, between-run checks, and limits. Its `runs` array was still
empty on disk at interruption; persist observed A1/B1 state using structured
JSON. Do not depend on ephemeral tool-memory stores.

### Frozen Deployed Inputs

Laptops use baseline:
`/home/wyatt/.cache/codex/producer-fence-playback-harness-20261007-t27Mxk/baseline`.
Build **20261006175655**, export `exports/umbrafox-descriptor-borrow-20261006/`.
Base revision `892431809a4caadb5c73b2c03ad9bdb124c3e21e`.
Source patch SHA256:
`d1bf3bdfe9f7d36c82181db0b4487592d5b8857b070e43c1b2ee6aaea9cd1677`.
Source-final receipt SHA256:
`a9befff9082463b5c643889c0e755e5f88a09d674d6aff00b3ad05d89cf1935c`.

Private iHD: 36,102,104 bytes, mode 0600,
SHA `7e14725d1af6a016fda32492cd7daaa33f1e744a36c0b8907ef3bb3a98e6798c`,
Ubuntu `24.1.0+ds1-1` nonfree. Child-only `LIBVA_DRIVERS_PATH`.
System free iHD remains `24.1.0+dfsg1-1ubuntu0.2`, 13,589,472 bytes,
SHA `a7cecd28f70fb692a5d65c2de8c491d953bc834dc1c98c4bd93a929ffcc976ee`.
Different package versions confound direct driver claims. Intel RPL-P 0xa7a0.
No LD, MOZ_LOG, sandbox, codec-forcing, or product-pref changes this wave.

### Uploaded Runtime

Laptop root:
`/home/wyatt/.cache/codex/startup-thread-sampling-harness-20261007-WMprMv`.
Identity: dev 64512, inode 37370534, uid 1000, mode 0700.
53 files, 49 syntax checks, 167 import edges, archive 81,879,040 bytes.
Archive SHA:
`1b860e9d96c441e39685bbc69d80ad2942506cfcdd1ba65d4372b0100553f732`.
Manifest SHA:
`f5a0ab5aae00ed3f13561d7aeef3146e655d2a0dea3d743d51804121a93a7b83`.
Exact members and every extracted file's hash/size/canonical regular-file status
were checked. Uploaded inputs are frozen for this wave.

Preflight at `2026-10-08T01:03:10.256Z`: MemAvailable 12,797,673,472 bytes,
disk 27,692,724,224 bytes, scoped browser/build busy list empty.
Between-1 at `01:06:31.788Z`: all 53 hashes and quiet check passed.
These are point-in-time observations, not continuous whole-host isolation.

### Fixed Launch Sequence

| Run | Mode | Nonce | State at snapshot |
| --- | --- | --- | --- |
| control-1 | control | oct7-thread-A1 | Runtime/export/review PASS |
| sampled-1 | sampled | oct7-thread-B1 | Runtime exit 0; export/review pending |
| sampled-2 | sampled | oct7-thread-B2 | Not launched |
| control-2 | control | oct7-thread-A2 | Not launched |

Exact launches are in `commands.json`. They use `ssh wyatt-laptop`, BatchMode,
ConnectTimeout 5, outer timeout 240, remote TERM timeout 210, the frozen harness
cwd, DISPLAY=:0, XDG_RUNTIME_DIR=/run/user/1000, generated driver, baseline,
mode, and nonce. Internally 120-second total / 105-second work / 15-second cleanup
budget; fresh private profile/app-data/local-app-data/temp/install; 256 MiB
sampled artifact cap. Same fixed 20-second 1080p public YouTube workload:
`https://www.youtube.com/watch?v=aqz-KE-bpKQ`.

### Control-1 Completed

Root: `/home/wyatt/.cache/codex/laptop-startup-thread-sampling-control-20261007-GV0yFB`.
UTC `01:04:52.563` through `01:05:25.522`.
Browser 2268710, content 2268876, RDD 2268839, controller 2268697.
Document 10737418243, scoped to content PID (not globally unique).
1200 total frames, 24 dropped; 21 samples, zero missed slots/media events.
9 resource samples, peak RSS 2,420,776,960 bytes, sampled artifacts 92,874,730
bytes. 334-byte log, zero log drops, clean SIGTERM/root absence/private install
checks, all 14 recorded PIDs absent. No thread series in control mode.
Host-minus-native clock offset interval:
`[2689.240835999999, 2711.6155229999968]` ms, width 22.374687 ms.
Native playback span 20,002.106087 ms.

`control-1-export.json` is empty and `control-1-export.stderr` preserves a
metadata export failure: root was passed in argv[1] but the program expects
argv[2]. Assertion failed before any read. Corrected invocation includes
`-- export ROOT`; no browser rerun occurred.
`control-1-export-v2.json` is the successful 53-file export, SHA
`31e62aff1d1f43a2ceb50df6af1177240d38cd0b7a32d47179c715ecaa4f95dd`.
`control-1-review.json` passed; review stderr empty.

### Sampled-1 Completed, Unreviewed

Root: `/home/wyatt/.cache/codex/laptop-startup-thread-sampling-sampled-20261007-S3OFOv`.
`sampled-1.stdout` reports this root and status `pass`.
`sampled-1.stderr` is empty; executable session 83214 exited 0.
No export/review existed at this snapshot. Do not invent counts, clock bounds,
or PIDs. Cleanup is runtime-reported until exact absence/export checks pass.

### Export and Review Procedure

Use `commands.json`'s exporter program, not a new broad filesystem scan:
remote `timeout 15 node --input-type=module -e PROGRAM -- export ROOT`.
Outer SSH timeout 25 seconds. The literal `export` occupies argv[1].
Allowed evidence is exact-root JSON/INI/browser.log, max 2 MiB/file and 16 MiB
total, including thread-sampling.json. It excludes profiles/raw profiles,
hashes each file, and checks recorded controller/browser/resource PIDs absent.

Review with a 10-second timeout:
`node artifacts/umbralink-control/startup-thread-sampling/review.mjs EXPORT.json`.
Save stdout/stderr. Before B2/A2 and after A2, use the stored between program:
20-second SSH wrapper / 12-second remote command, fixed uploaded root identity,
53 hashes, and the existing scoped quiet check. Do not broaden host inspection.

## What the Sampler Can Establish

Targets are parent main TID=PID, unique OS-name Renderer, unique Compositor,
and selected content main TID=PID. PID identity includes parent/group/session/
start stamp; TID start/name fixed. Process stamps verified before/after each
eight-file batch. CPU is from `/proc/PID/task/TID/stat`, not aggregate PID stat.
No stacks, addresses, wchan, command lines, or unrelated process payloads.

Fixed 200 ms cadence; single flight; at most 160 samples/32 seconds; 512 task
discovery entries; 16 KiB/read; 1 MiB series; 1000 ms read timeout. First failure
poisons sampler and aborts adapter: no restart or late publication. Already
started OS reads may remain pending; preserve `underlyingReadPending` rather
than claiming OS cancellation. Stop bounded to one second; partial samples
survive a stop failure. No per-sample RPCs, disk writes, public marks or globals.

Both arms use the unchanged capturePrepared/captureStartup composition with
preconditioned=false. Parent/selected-content profiler inactivity is checked
at boundaries only; other children are unknown. Fake real-composition ledger
is 10 RPCs/12 writes per arm. Sampling adds discovery/setup delay as well as
CPU reads; there is no matched-delay control, so isolate neither by assertion.

The existing playback RPC is bracketed by host performance.now. Native start/
end are from its exact content reply. Offset interval is
`[hostSent-nativeStart, hostReceived-nativeEnd]`; reject negative intervals or
width above 100 ms. No midpoint-as-exact-clock inference. Page counters update
asynchronously. CPU ticks quantify execution, not waits, GPU work, or scanout.

Host metadata: Node v24.18.0, kernel 7.0.0-38-generic, CLK_TCK=100,
sched_schedstats=0 at `00:38:25.156Z`. Nonzero schedstat text is not enabled
scheduler-statistics proof; wait statistics remain null. Driver checks exact
Node version and getconf before starting a browser.

`clock-source.json` pins native ChromeUtils::Now to TimeStamp::Now minus process
creation, Linux precise TimeStamp to CLOCK_MONOTONIC, and official Node v24.18.0
performance.now to uv_hrtime/process start with libuv precise CLOCK_MONOTONIC.
Native files match deployed base and are untouched by its patch. Official
Node/libuv URLs, hashes, and excerpts are retained. This is version-linked
source proof, not independent Node-binary attestation.

### Verification So Far

`runtime-tests.log`: **41 PASS**, zero failures, approximately 0.320 seconds,
strict unhandled rejection mode. Earlier `final-tests.log`: 38 PASS.
Coverage includes identities/PID reuse, ordering, counters, clocks, quotas,
abort, late I/O, all 10 RPC/12 write failure points in both arms, and actual
owned Node `/proc` task ticks. Tests are tooling proof, not runtime causality.
Three review tests were added after the 38-test receipt.

Preserved RED evidence includes late reply mutation after abort and sample loss
when stop threw; both corrected. Initial missing-module failures are scaffold
failures only. One cancellation test initially selected the wrong race winner,
and one timeout expectation had a wording mismatch; those are not product bugs.
Generated inverse proofs passed. Prior sealed 96 files and 48 earlier runtime
inputs were unchanged at preparation gate.

Still needed: final checks across all 10 manually authored JS files (exclude
generated inverse adapters), final documentation checks, all runtime reviews,
new analysis tests, replay, and final evidence seal. Use bounded named-file
Prettier and named docs lint, not broad autoformat of the dirty repository.

## Prior Evidence to Preserve

### Startup Variability Audit

Namespace `artifacts/umbralink-control/startup-variability/`.
Report `docs/umbrafox/archive/reports/performance/2026-10-07-startup-variability.md`.
Sealed `2026-10-08T00:34:08.370Z`, 18 files, evidence SHA
`0ea5e19a8be41687fe79f65a2c4d10ada4a2831311526fc4b6bdb1e034877481`.
8 focused / 22 combined tests passed.

Four previous graphics projections identical; settings geometry identical in
first three despite 25/2/0 drops. All 84 sampled media states readyState=4,
networkState=2, buffered ahead about 12 seconds or more, no media events.
No simple starvation evidence at observed points; not a network trace.
One run at 5 seconds: decoded305/presented300/painted285/drop0; at 6 seconds:
365/335/335/drop25. Differences are asynchronously updated counts, NOT physical
queue lengths, event time, or display delay.
Parent CPU 8723/8836/8596/8376 ms per 20 seconds includes renderer/compositor,
NOT parent-main-only CPU. No clock bridge existed to align old resource reads
with playback; that gap motivated the current sampler.

### Preparation-Only ABBA

Namespace `artifacts/umbralink-control/startup-precondition/` (frozen generated
sources may use the related startup-precondition paths; consult actual files).
Report and plan `2026-10-07-startup-precondition.md` / `startup-precondition.md`.
Sealed `00:19:09.657Z`, 78 files, SHA
`545505044431c0d3cb2f5cfc3d1853a0df03b777a970a5054f488dd7dc30c25d`.
116 combined tests passed. All four runtimes and exact cleanup checks passed.
A1 control 25 compositor drops; B1 inactive Start/Stop preparation 2; B2
preparation 0; A2 untouched control 1 sink drop, zero compositor drops.
Therefore profiler activation is NOT necessary for smoothness. No causal
preparation optimization, and no profiler initialization workaround justified.
Fresh processes do not reset host/site/warm state. No unchanged repeat loop.

### Seeking and Driver Tests

Reports: `2026-10-07-seek-recovery.md`, `2026-10-07-decoder-driver-seek.md`,
`2026-10-07-decoder-driver-backward.md` under performance reports.
Real progress-bar single forward/backward clicks, 1080p, at least 130 seconds
after seek. Software forward: 25 pre-seek drops plus 1 late; backward: 3 isolated.
Private hardware forward: 24 pre-seek; backward: 23 pre-seek plus 1 late.
No prolonged post-seek stutter/black-flash recovery reproduced.
Hardware RDD CPU was about 90.45/91.33 percent lower than old software N1,
but this is NOT a smoothness win, and driver versions differ. No system driver
install consent. Exact affected owner video/codec and single jump versus
repeated scrubbing remain useful missing workload details; prior ask unanswered.

### Profiler Observer Effect and Older History

Old unprofiled startup runs had 23..25 drops near 6 seconds. Two profiler-active
runs had zero drops but profile-copy cap failure, with cleanup pass: not full
performance passes. Later smooth untreated control weakens any causal claim
about profiler activation. Do not parse raw profiles ad hoc.
If future profile work is authorized, read profiler-analysis skill, use unique
owned CLI session with explicit `--symbol-server http://127.0.0.1:9`, preserve
PID/socket identity and stop in finally. No stop-all. CLI marker timestamps
are normalized while context.rootRange is raw; never mix these clocks.

Older September work is in `.codex/DETAILS.md` and
`~/.cache/codex/umbra-perf-20260927/`. It includes lifecycle tooling, isolated
app-data containment, marker clock fixes, private native directory proof, Pi
source/profiling studies, and request-fastpath design. Do not equate those old
reports or old source patches with today's deployed package.
Fresh profile alone previously failed to isolate shared crash-report queues;
all current launches force fresh private application-data and local-data roots.
An upload-disabled pref alone is not a no-network/deletion-ping guarantee.

The owner requested full UmbraLink remote control, parity tests, prototype
packaging/launcher integration, shutdown-crash investigation, correct taskbar
pin/profile selection, and broad performance work earlier. Many intervening
results are recorded locally rather than visible in the abbreviated chat.
Do not invent their completion status: consult DETAILS, exact reports, package
receipts and source/test evidence before describing fixes or deployment.

## Reporting Discipline and Next Useful Decision

Distinguish tooling tests, runtime acceptance, sample-level observations,
causal localization, actual optimization, and deployment. Do not call the
startup burst the owner's prolonged post-seek failure. No current rendering
fix has been established by this sampler work. The immediate deliverable is
a verified bounded comparison and thread/clock evidence, followed by the
smallest falsifiable next step. Broad optimization work remains active.
# Active October 14: Seek Audio Reuse

Latest owner requests continuing until seek stutter found/fixed. No native fix
yet. Daily desktop browser untouched. Isolated laptop four-cell ABBA attempt:
reuseA yrNkEJ pass (postseek20/2677,27/2700,6/2500); recreateB l8uMlS pass
(5/2674,5/2700,5/2503); recreateC d7XiOr pass (8/2675,7/2700,8/2501).
reuseD BPy8H5 failed artifact scan at40s, cleanSIGTERM14PIDsabsent; not a
performance result. Failed initial receipt-order setup UXlvI6 also preserved.
Artifacts umbralink-control/seek-reuse;136strict testsPASS. Runtime79files
Hb2Quz postflight04:19UTC unchanged/no browser/compiler. Plan
docs/umbrafox/archive/plans/seek-audio-reuse.md. No source/default changes.

ONE narrow follow-up now running: existing native AudioStream:4,timestamp log,
profilerOFF, same240s/256MiB/capture/cleanup boundaries. Remote83file harness
~/.cache/codex/seek-audio-log-harness-ya9LXY, manifest
bde7494cdfc53dae54edd30bae881f59b3249fb0828c6e20c6f68022038a94b4.
Run laptop-seek-audio-log-reuse-20261014-XkWE68, exec31707; initiated04:20UTC.
After TERMINAL export via new seek-audio-log/export.mjs then review-driver.mjs.
Do not launch another cell automatically.137strict tests/scopedlintPASS.
Goal: actual RebaseLive P/W/carry values, existing logs no extra raw query.

Observed earlier rough audio endpoints: writtenFrames/rate-lastGoodPosition
near0us vs smooth recreation143-180ms. Derived media gap, NOT rawcubeb proof.
Definite source concern: RebaseLive sets raw=0 on queryfailure and keeps stream;
docs incorrectly assume failedquery means dead. Official Pulse v17 stream.c
pa_stream_get_time has READY but NODATA paths. Runtime branch unproven.
Other leads: backend/history cursor mismatch, syncaudioIPC querylatency.
Avoid speculative clock smoothing or calling the issue fixed.

Reusable desktop build root ~/.cache/codex/umbrafox-beta-20261012-nYSBPOWS,
source worktree carries3 existing changes (UserlandMutation,2canvasgtests),
preserve them. Native test/package harness there available but graphics-only
validator/filter must be adapted before audio tests. No native edits this wave.
