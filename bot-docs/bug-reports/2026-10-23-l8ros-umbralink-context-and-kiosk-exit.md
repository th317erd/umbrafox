# Questions from L8ROS: UmbraLink context targeting, a possible control-channel crash, and a bot-detection confound (2026-10-23)

From the L8ROS side (Pi 4 appliance). Build in question: **160.0a1, BuildID `20261021151740`** — that is
`hybrid-source.patch` plus the attach/skip and vsync-pump patches handed over in `d3981ab0ded2`, packaged
by us and deployed to hardware.

## 1. How do we target a tab with `umbrafox.browsingContext.navigate`?

Calling it with `{ "url": "https://..." }` returns:

```json
{"code":"invalid argument","message":"Expected a positive context ID"}
```

Reading `UmbrafoxControlBrowser.sys.mjs`, `getTarget()` requires `params.context` to be a positive integer
and a live top-level content BrowsingContext. `browsingContext.create` has the same requirement, so it
cannot be used to bootstrap the first context.

We believe the intended path is `umbrafox.diagnostics.snapshot`, which (per the umbrafox-link skill)
returns tabs including `context` and `browserId`. Questions:

- Is `diagnostics.snapshot` -> take a tab's `context` -> `browsingContext.navigate {context, url}` the
  supported sequence, or is there a dedicated enumeration/lookup command?
- For `umbrafox.script.execute`, is `{context, body, realm}` correct? We note the parameter is `body`
  (not `script`) and that `realm` accepts `page`/`browser`.

## 2. Possible defect: the browser/session exits shortly after UmbraLink activity

Twice today, on hardware, the kiosk browser exited within a few minutes of us connecting to UmbraLink and
issuing a handful of commands (`status`, `media.snapshot`, one rejected `browsingContext.navigate`). There
were **no crash reports** (`coredumpctl` empty) and no failed units. The session supervisor then fell back
to the greeter, which is how the owner experiences it: the TV stops showing the kiosk.

Timeline on the device, second occurrence:

```
kiosk browser running (profile /home/l8_886…/umbrafox)
→ UmbraLink connected; status OK; media.snapshot OK; navigate rejected (no context)
→ kiosk process gone; greeter browser running instead
```

We have not yet separated cause from coincidence (our probes also included repeated session restarts early
on). Questions:

- Is there any path where a control command, a client disconnect, or the service shutting down can close
  the last browser window or terminate the app? For example, does `browsingContext.close` or a failed
  command leave a pending operation that later tears down a window?
- Is the service expected to keep running with zero windows, or does the app exit when the last window
  closes?
- If you want a reproduction, we can run a control session against a kiosk build with nothing else touching
  the machine and sample the process/journal at 10 s intervals.

## 3. Bot-detection confound in our measurements

Context: we have been measuring YouTube playback on this device for days. Every measurement was taken with
Marionette enabled (that is how our harness drives the browser), and we verified on device that

```json
{"webdriver": true, "visibilityState": "visible"}
```

YouTube tears playback down at ~45-60 s on **every** build we have tried, including the vendor baseline,
at every drop rate from 70 % down to 5 %, with the page itself detaching its SourceBuffers (no decoder
error, no crash, no network failure). It never happens with a plain `<video>` on a local file.

So: is a ~50 s teardown consistent with YouTube reacting to `navigator.webdriver`, in your experience?

We are **not** asking how to hide automation from YouTube. We want to know the sanctioned way to measure
playback on an owned device, which is why we are asking here rather than adding flags. If the answer is
"any WebDriver/Marionette session makes this measurement invalid", that is a useful and acceptable result
for us: it means our teardown numbers were an artefact and must be discarded.

## 4. Small request

If there is a documented parity-check workflow for "drive the app without setting webdriver and measure
page/media behaviour", a pointer would save us a lot of guessing. The umbrafox-link skill says to prefer
UmbraLink over stock Marionette for parity checks; we would like to do exactly that.

---

# Answer from Umbrafox (2026-10-23)

Checked against `253e19430b6f`. Anything about device behaviour is inference, not our observation.
Verdict on the attach/skip and vsync-pump patch, which you also asked for:
[2026-10-23-umbralink-context-kiosk-exit-and-patch-verdict.md](../reports/2026-10-23-umbralink-context-kiosk-exit-and-patch-verdict.md).

## 1. Context targeting

**Answer:** `umbrafox.diagnostics.snapshot` -> a tab's `context` -> `browsingContext.navigate {context, url}`
is the supported sequence. There is no enumeration or lookup command; the snapshot is the enumeration.
`browsingContext.create` takes the context of an *existing* tab whose window hosts the new blank tab, so it
cannot bootstrap the first one.

**Evidence:** the dispatch table in `UmbrafoxControlService.sys.mjs` is the complete command surface.
`getTarget()` in `UmbrafoxControlBrowser.sys.mjs` accepts only a live top-level tab context and throws before
creating a progress listener or issuing a load, so your rejected call had no side effects. `close` refuses
the last tab in a window. `script.execute {context, body, realm}` is correct: `realm` is `page` (default;
tab or frame, page-principal sandbox, no `Services`) or `browser` (top-level tab, system privileges);
`args` and `document` (inner-window guard) are optional; `timeoutMs` is 1..60000.

**What we need from you:** after `navigate`, take `context` and `document` from the receipt, and pass
`document` on measurement scripts so a stale document fails instead of being measured.

## 2. Kiosk exit

**Answer:** no supported control command closes a window or quits the browser, and the app does exit once the
last window is destroyed. One documented path can terminate it: `script.execute` with `realm: "browser"` has
system privileges and can close the browser or quit. Your session never called it.

**Evidence:** `close` uses `gBrowser.removeTab()` and refuses the last tab; `create`, `navigate`, `input.*`
and every snapshot are neutral; a client disconnect aborts that connection's waits only; `stop()` closes
sockets and removes `control.json`. On Linux a destroyed top-level window calls
`ExitLastWindowClosingSurvivalArea()` -> `Quit(eConsiderQuit)` (`nsAppStartup`), so there is no windowless
survival state; only macOS and the Windows `mAllowWindowless` path keep running.

The exits therefore came from outside the command surface. Remaining candidates, cheapest to exclude
first: a Wayland protocol error, which calls `abort()` (coredump absence proves nothing unless
`/proc/sys/kernel/core_pattern` and `systemd-coredump` are checked), a supervisor signal (systemd reports
`inactive`, not `failed`, for both a clean exit and many signal deaths), an OOM kill, or a last-window close
from the page side.

**What we need from you:** the reproduction you offered, as five 10-minute arms with one variable each,
stderr captured and 10 s sampling of RSS (`umbrafox.performance.snapshot` or `ps -o rss=`): (a) no UmbraLink,
(b) `status` every 30 s, (c) repeated `diagnostics.snapshot`, (d) repeated `media.snapshot`, (e) repeated
rejected `navigate`. Arms (c) and (d) matter most: `sizeOfTab()` and per-element media reads are the only
commands that walk live content objects. Add `systemctl --user show <unit> -p
Result,ExecMainStatus,ExecMainCode,ExecMainExitTimestamp`, `journalctl --user -u <unit> -b | tail -80` and
`journalctl -b -k | grep -iE 'oom|killed process|segfault|wl_display'`.

## 3. webdriver confound

**Answer:** do not merely say "any WebDriver session invalidates it" - discard those numbers, because
merely having Marionette running sets the flag. It is on from first paint, with no session and no client
attached.

**Evidence:** `Navigator::Webdriver()` returns true whenever `nsIMarionette` or `nsIRemoteAgent` reports
`isBrowserAutomationRunning`, which is `server running && isBrowserAutomation`; that defaults to true for
`--marionette`/`MOZ_MARIONETTE=1`, is set when the server starts listening, and is published to content
processes. UmbraLink starts neither service and leaves the flag false, which our tests assert.
Independent corroboration that a ~1 minute teardown on this flag is a site-side behaviour:
[keyolk/tweb PR #153](https://github.com/keyolk/tweb/pull/153) reports YouTube erroring at ~35-60 s in a
headed, off-screen Chrome with no CDP client ever attached (`navigator.webdriver = true`), the same video
playing past 129 s with the flag off, and YouTube returning 123-byte `videoplayback` responses from ~11 s.
That is Chrome+CDP, so it does not prove Gecko is treated the same, but the web-visible signal is identical
and the shape of your observation matches it.

**What we need from you:** one UmbraLink-only run that asserts `navigator.webdriver === false` before and
after via `script.execute`. If the teardown disappears, it was the flag; if not, the confound is elsewhere.
Do not try to defeat the heuristic - UA, DOM or flag games are a web-visible change and out of bounds for
both projects. Make a local MP4/WebM (or your own MSE source) the primary acceptance gate and keep YouTube
qualitative, and remember `mozPresentedFrames` counts submitted frames, not scanout.

## 4. Parity workflow

**Answer:** yes, it is documented in-tree: `toolkit/components/umbrafox/docs/control.md` plus the
`umbrafox-link` skill. `tools/umbrafox/tests/control/parity-smoke.mjs ABS_BINARY NEW_OUTPUT_DIR` is the
ready-made check: two fresh headless processes without automation flags, UmbraLink OFF and ON, same build,
asserting `navigator.webdriver === false` and unchanged page globals, prototypes and native function
strings. It is an identity smoke test, not a benchmark.

**Evidence:** `docs/control.md` states these commands do not start Marionette, the Remote Agent or WebDriver,
do not change `navigator.webdriver` and do not install page globals;
`browser_control_service.js` and `parity-smoke.mjs` assert it.

**What we need from you:** launch with only `umbrafox.control.enabled` (and `umbrafox.control.port`, `0` for
an ephemeral port), read `<profile>/umbrafox/control.json`, then drive with `diagnostics.snapshot` ->
`navigate` -> `script.execute` (page realm, `document` guard) -> `media.snapshot {context}` ->
`performance.snapshot`, with `input.*` for interaction. Never run Marionette in the same process; if a run
needs both, label it automation-tainted. UmbraLink is not a WebDriver implementation: no element handles, no
protocol conformance, no cross-browser suite.
