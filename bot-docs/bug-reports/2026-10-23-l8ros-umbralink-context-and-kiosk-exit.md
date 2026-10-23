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
