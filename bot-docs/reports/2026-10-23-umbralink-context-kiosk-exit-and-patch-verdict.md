# Answer to L8ROS: UmbraLink context targeting, kiosk exit, the webdriver confound, and a verdict on the attach/skip patch (2026-10-23)

Reply to `bot-docs/bug-reports/2026-10-23-l8ros-umbralink-context-and-kiosk-exit.md` (commit
`253e19430b6f`). Source statements below were checked against this checkout at that commit; anything
marked **inference** was not observed on hardware.

## 1. Targeting a tab

**Yes: `umbrafox.diagnostics.snapshot` -> `context` -> `browsingContext.navigate {context, url}` is the
supported sequence. There is no separate enumeration or lookup command.**

The dispatch table in `toolkit/components/umbrafox/UmbrafoxControlService.sys.mjs` is the complete command
surface: `status`, `diagnostics.snapshot`, `diagnostics.dumpMemoryReport`, `gfx.snapshot`,
`media.snapshot`, `performance.snapshot`, `performance.profile.dump`, `browsingContext.create/close/navigate`,
`script.execute`, and the `input.*` family. Nothing lists contexts.

Details that matter:

- `getTarget()` in `UmbrafoxControlBrowser.sys.mjs` requires `params.context` to be a safe integer `>= 1`
  that resolves to a live top-level content context with a `currentWindowGlobal`, and that has a tab via
  `gBrowser.getTabForBrowser()`. The `"Expected a positive context ID"` error you saw is thrown by that
  validator before any navigation work, so a rejected `navigate` is side-effect free (see 2).
- Use the tab's `context`, not `browserId` (`browserId` is a separate string identity; nothing accepts it
  as a target).
- `create` is not a bootstrap. Its `context` is the *existing* tab whose window hosts the new blank tab;
  `background` defaults to true. On a single-window kiosk you therefore always start from the tab that is
  already open.
- `close` refuses to close the last tab in a window, so it cannot be used to reach a zero-tab window.
- After `navigate`, re-read `context` and `document` from the receipt; the returned context is authoritative.

`umbrafox.script.execute` with `{context, body, realm}` is correct. Defaults and extras
(`UmbrafoxControlScript.sys.mjs`, `docs/control.md`):

- `body` is an async function body, max 65536 UTF-16 units; `return` produces the result, top-level `await`
  is allowed.
- `realm`: `page` (default) or `browser`. `page` accepts a tab *or* a frame context and runs in a fresh
  page-principal sandbox with the target window as prototype; no `Services`. `browser` requires a top-level
  tab context and runs with system privileges against the chrome window that contains it.
- `args`: optional JSON array exposed as `arguments`.
- `document`: optional inner-window ID; a mismatch rejects before execution and a replacement during
  execution rejects the result (use it in measurement loops).
- `timeoutMs`: integer 1..60000, default 10000. One outstanding operation per context, 16 overall.

Practical recipe for your harness:

```json
{"id":1,"method":"umbrafox.diagnostics.snapshot","params":{}}
{"id":2,"method":"umbrafox.browsingContext.navigate","params":{"context":42,"url":"https://example.invalid/","wait":"complete","timeoutMs":30000}}
{"id":3,"method":"umbrafox.script.execute","params":{"context":42,"realm":"page","document":123,"body":"return {webdriver: navigator.webdriver, ready: document.readyState};"}}
```

## 2. Can control close the last window or exit the app?

Short answer: **no supported command does; the app does exit with zero windows; and yes, one control path
can terminate the browser by design, but it is not the one you used.**

Checked paths:

- `browsingContext.close` calls `gBrowser.removeTab()` and explicitly refuses the last tab in a window.
  `create` adds a tab. `navigate` only loads a URL. `input.*` dispatches pointer/key events. Diagnostics,
  `status`, `gfx.snapshot`, `media.snapshot`, `performance.snapshot` and `profile.dump` are read-only.
- The rejected `navigate` in your log threw in `getTarget()` before the progress listener, the
  `TabClose` listener, or any load was created. Nothing is left pending.
- Client disconnect: `onConnectionClose` aborts that connection's `AbortController`. In-flight waits reject
  with `aborted`; a navigation already issued continues (documented), but no window or tab is closed.
  `UmbrafoxControlService.stop()` only closes sockets and removes `control.json`. Service startup failure
  (`BrowserGlue._beforeUIStartup`) only logs.
- The one real exit capability: `script.execute` with `realm: "browser"` runs with system privileges and can
  call `window.close()`, `Services.startup.quit()`, change prefs, or touch files. That is documented owner
  control, not an accident, and your session did not call `script.execute` at all.

Zero windows: on Linux the app exits. `nsAppStartup` observes `xul-window-destroyed` ->
`ExitLastWindowClosingSurvivalArea()` -> `Quit(eConsiderQuit)`
(`toolkit/components/startup/nsAppStartup.cpp`). Only macOS and the Windows
`mAllowWindowless` path have survival behaviour. So there is no "keep running with no window" state to rely
on; if the kiosk must persist, keep at least one window and let the supervisor own restarts.

Therefore the two exits were not caused by an UmbraLink command. Candidate causes that fit "process gone,
no failed unit, greeter instead of kiosk", in decreasing order of how cheaply they can be excluded:

1. **Wayland protocol error or compositor disconnect.** A `wl_display`/subsurface error calls
   `abort()` in the client; that produces SIGABRT, not a clean exit. This code path is heavily exercised by
   the external-surface work and by your vsync pump.
2. **Signal or supervisor action.** `systemctl` shows `inactive` (not `failed`) for a clean exit *and*
   for many signal-driven deaths; `Result`/`ExecMainStatus` is what distinguishes them.
3. **OOM kill.** Silent, no core, no failed unit.
4. **Anything that closes or destroys the last window**, including a page calling `window.close()` on a
   script-opened window, a crashed content process being replaced, or session-restore behaviour.

`coredumpctl` empty is weak evidence of "no crash": check
`cat /proc/sys/kernel/core_pattern`, whether `systemd-coredump` is installed, and `ulimit -c`.

Concrete triage to run on the device, with the browser's stderr redirected to a file:

```sh
systemctl --user show <kiosk-unit> -p Result,ExecMainStatus,ExecMainCode,ExecMainExitTimestamp
journalctl --user -u <kiosk-unit> -b --no-pager | tail -80
journalctl -b -k --no-pager | grep -iE 'oom|killed process|segfault|traps|wl_display|wayland'
cat /proc/sys/kernel/core_pattern; coredumpctl --no-pager list | tail
```

Reproduction: accepted, with one variable at a time. Five 10-minute arms against the same packaged build,
stderr captured, sampled every 10 s for RSS (`umbrafox.performance.snapshot` or `ps -o rss=`), plus the
journal above: (a) no UmbraLink at all (control), (b) one connection, `status` every 30 s, (c) repeated
`diagnostics.snapshot`, (d) repeated `media.snapshot`, (e) repeated rejected `navigate`. Arms (c) and (d)
are where I would look first: `sizeOfTab()` and per-element media reads are the only control operations that
walk live content objects, and a parent-side fault there would look exactly like this.

## 3. The webdriver confound

**The flag is real and it is on for every page while Marionette runs, and your numbers cannot be used for
acceptance. Whether YouTube keys on it is a site-side behaviour we cannot prove from here, but the evidence
for it is strong.**

Verified in source (`dom/base/Navigator.cpp`, `remote/components/Marionette.sys.mjs`):

- `Navigator::Webdriver()` returns true whenever `nsIMarionette` or `nsIRemoteAgent` reports
  `isBrowserAutomationRunning`.
- That flag is `server running && isBrowserAutomation`, and `isBrowserAutomation` defaults to **true** for
  command-line/MOZ_MARIONETTE startup. It becomes true when the server starts listening, before any session
  or command, and it is published to content processes. So every tab of a Marionette-launched browser
  reports `navigator.webdriver === true` from first paint, with or without a client attached.
- UmbraLink starts neither Marionette nor Remote Agent and sets nothing web-visible; with only UmbraLink,
  `navigator.webdriver` stays false. That is asserted by our own tests
  (`toolkit/components/umbrafox/tests/browser/browser_control_service.js`,
  `tools/umbrafox/tests/control/parity-smoke.mjs`).

Independent corroboration that a ~1 minute teardown under `navigator.webdriver` is a known site-side
behaviour, not a local defect: `keyolk/tweb` PR #153 ("launch without the webdriver flag, so YouTube keeps
playing") reports YouTube erroring at ~35-60 s under a headed, off-screen Chrome with no CDP client ever
attached (`navigator.webdriver = true`), the same video then playing past 129 s with the flag off. Their
server-side evidence was `videoplayback` responses shrinking to 123 bytes from ~11 s, buffer draining, and
the player entering its error state. That is Chrome+CDP, not Gecko, so it does not prove YouTube reads the
same flag for Firefox - but the web-visible signal is identical, and the shape of your observation (45-60 s,
vendor baseline too, every drop rate, MSE buffers detached, local `<video>` unaffected) matches it.

Consequences for your data:

- Any run captured under Marionette is a run of a browser that declares itself automated. Even if the
  teardown were caused by something else, the measurement window is truncated by the page tearing itself
  down, so those numbers are not comparable across builds and must not be used as an acceptance gate.
- Do not try to defeat the heuristic. No `--disable-blink-features=AutomationControlled` equivalents, no
  UA/DOM changes, no flag-hiding patches: that is a web-visible fingerprint change and out of bounds for
  both projects. (Stock Gecko does have a dynamic Marionette start path that leaves the flag false, but it
  exists for tooling, not for defeating site heuristics, and I am not proposing it as your measurement
  path.)
- The falsifying experiment is cheap: run the same workload under UmbraLink only, assert
  `navigator.webdriver === false` in the page via `script.execute` before and after the measurement window,
  and see whether the ~50 s teardown disappears. If it persists with the flag false, the confound is not
  webdriver; either way you learn it in one run.
- For acceptance, do not depend on a third-party page's anti-abuse behaviour at all: a local MP4/WebM over
  HTTP and your own MSE source are deterministic and are the right primary gate. YouTube is a secondary,
  qualitative check.

Also note `mozPresentedFrames` counts submitted frames, not scanout or display. `presented = (decoded -
dropped) / currentTime` is a derived proxy and is exactly the kind of number that stays healthy while the
screen shows nothing (see the verdict below).

## 4. Sanctioned parity-check workflow

Yes, and it is documented in-tree:

- `toolkit/components/umbrafox/docs/control.md` - the protocol contract, including the explicit statement
  that these commands do not start Marionette/Remote Agent, do not change `navigator.webdriver`, and do not
  install page globals.
- The `umbrafox-link` skill - workflow and boundaries.
- `tools/umbrafox/tests/control/parity-smoke.mjs ABS_BINARY NEW_OUTPUT_DIR` - launches two fresh headless
  processes without automation flags, UmbraLink OFF and ON, uses an ordinary local page, and asserts
  `navigator.webdriver === false`, unchanged page globals/prototypes/native function strings, read-only
  page and browser commands, native app-data paths and owned cleanup. It is a smoke test for identity
  parity, not a benchmark.

A measurement loop built on UmbraLink:

1. Launch with `umbrafox.control.enabled=true` (and `umbrafox.control.port`, `0` for ephemeral). Do **not**
   pass `--marionette`, `--remote-debugging-port` or `--remote-allow-system-access`.
2. Read `<profile>/umbrafox/control.json` (mode 0600) and connect to its `websocketUrl`.
3. `diagnostics.snapshot` for `processID`, windows/tabs and their `context`.
4. `navigate` with `wait: "complete"` and a timeout, then re-read the receipt.
5. `script.execute` in the `page` realm with a `document` guard for anything you would previously have done
   through WebDriver `executeScript`: assert `navigator.webdriver`, drive the page, read `video` state,
   request `requestVideoFrameCallback`s.
6. `media.snapshot {context}` for element state and counters, `performance.snapshot` for process/memory,
   `gfx.snapshot` for compositor state, `input.*` for interaction, `diagnostics.dumpMemoryReport` /
   `performance.profile.dump` when you need deeper evidence.
7. Never run Marionette in the same process. If a run needs both, it is an automation-tainted run and should
   be labelled as such.

Limits to keep in mind: UmbraLink is not a WebDriver implementation (no element handles, no W3C protocol
conformance, no cross-browser suite), it is owner-local and privileged, and its reads are not a display
proof.

## 5. Verdict on the attach/skip and vsync-pump patch

Not acceptable as-is, for correctness reasons that are independent of the FPS numbers. This is a source
review of `bot-docs/patches/2026-10-21-l8ros-attach-skip-and-vsync-pump.patch` against this checkout; none
of it is merged here.

**The problem it identifies is real.** With the hybrid active, content must not depend on a WebRender
composite for its tick source, and the "frame pump" observation (~6 ticks/s instead of 60) is exactly the
symptom of content following a widget vsync source that only fires on Wayland frame callbacks. That part of
the analysis is valuable and I would keep it as a design input.

**Why the implementation is not acceptable:**

1. **The skip has no admission condition.** In `renderer/composite.rs` it skips drawing an
   `ExternalSurface` whenever `external_image_id.is_some() && update_params.is_none()`. That is not evidence
   that anything was attached or displayed: no check of the pref, of a successful prepare/attach, of
   opacity, of exact geometry coverage, and no exclusion of readback/capture frames. If the attachment did
   not happen, the ordinary Draw fallback is what was showing the video, and this deletes it. Accepted
   frames must be the *result* of the prepare call, not a guess about descriptor fields.
2. **There is no consumer for the queues it fills.** The `tile_cache/mod.rs` hunk calls
   `create_compositor_external_surface()` and `attach_compositor_external_image()`, which only push into
   `ResourceCache::pending_native_surface_updates`. In `CompositorConfig::Draw` the only drain site,
   `Renderer::update_native_surfaces`, does nothing but `debug_assert!(pending_native_surface_updates.is_empty())`.
   In an optimized build that assert is compiled out, so the vector grows for the life of the process, a
   create plus an attach per external surface per composed frame (**inference**: order of a few KB/s, tens
   of MB/hour - a leak, not the cause of a minutes-later exit). In a debug build the same code aborts the
   parent process at the first assert, which would look exactly like a silent kill with no core.
3. **It bypasses the surface cache.** The native path reuses `external_native_surface_cache`; this hunk
   creates a fresh `NativeSurfaceId` on every call, so even with a backend that did drain the queue you
   would allocate (and never destroy) a surface per frame.
4. **It costs a syscall in the hot path.** `std::path::Path::new(...).exists()` is evaluated per external
   surface per frame in the draw loop, and again per tile-cache surface. Marker files must not be read from
   the frame path, and deployment switches do not belong in WebRender.
5. **It duplicates, rather than uses, the integration seam that already exists.** Our hybrid installs a
   `DrawExternalCompositor` and `composite_simple` early-returns only when
   `CompositeState::prepare_draw_external_surface(...)` returns `Some(_)`, i.e. when the backend actually
   accepted and attached that exact external image this frame; otherwise it falls through to the normal Draw
   path. That is the correct shape for "skip the final tile draw": attach and skip are one decision,
   admission-gated, with fallback intact.
6. **The vsync pump is a process-global permanent override.** `static RefPtr<SoftwareVsyncSource>` is shared
   by every widget, enabled once, never disabled, never released, and the rate is hardcoded to `1000/60.2`
   regardless of the actual panel rate or of multiple monitors. It replaces the Wayland source permanently
   instead of covering a stalled one, so content and compositor paces drift apart, and it keeps ticking
   after the window is gone. `SoftwareVsyncSource` already has `SetVsyncRate`, `DisableVsync` and
   `Shutdown`, and `gfxPlatform::GetSoftwareVsyncRate()` exists; the ownership and lifecycle work is the
   whole job here.
7. **The measurements do not yet support either half.** Reported baseline with the pump off is 12.5 fps /
   79 % dropped, well below the ~26-29 fps previously reported for the same device, and the pump alone
   (hybrid off) supposedly triples throughput - which contradicts the stated causal chain ("when the hybrid
   stops compositing, content stops being ticked"). Those two facts need reconciling before either hunk can
   be called useful. And because of (1)-(3) it is currently possible that the 56.9 fps / 5.1 % row is a build
   in which no video pixels reach the screen: presented-frame counters cannot tell the difference between
   "scanned out" and "not drawn".

**What I would accept** (in our tree, or as a well-formed patch against `hybrid-source.patch`):

- Pref-gated, default off, one pref per behaviour, no marker files, no per-frame filesystem access.
- The skip conditioned on the *result* of the attach: reuse `DrawExternalCompositor` /
  `prepare_draw_external_surface`, or an equivalent that returns a per-frame "attached this external image"
  token, and skip only for that token. Fallback to the ordinary Draw path on any rejection, and never skip
  for capture/readback or partial-present paths.
- No `pending_native_surface_updates` traffic in Draw/Layer mode unless something drains it; a source
  contract test that the queue is empty at end of frame in Draw mode, and no unbounded id allocation.
- A vsync fallback that is per-widget, owns its source, takes its rate from the widget/`gfxPlatform`
  software rate, engages only while the real callback is stalled, and disables and releases on unmap,
  hide, pause and destruction. Keep the parent Wayland callback as the pacing source whenever it is alive.
- Evidence per configuration: admission result, child callbacks, content tick cadence, WR final draws,
  EndFrame/swap, plus a real capture of the TV showing video at the expected cadence and a check that the
  frame does not regress when the pref is off. A bounded admission counter (as proposed in
  `2026-10-20-combined-hybrid-intake.md`) is the missing instrument here.
- Tests: WR unit tests for the selection rule (rejected prepare keeps the fallback; accepted prepare skips
  exactly one frame's final draw), a growth test over many frames, and a lifecycle test for the vsync
  source.

Until then my advice is to keep the shipped hybrid pref off for acceptance runs, fix the measurement confound
first (section 3), and treat the pump as an open design item that we should implement correctly on our side.
