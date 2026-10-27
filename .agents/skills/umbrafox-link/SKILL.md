---
name: umbrafox-link
description: Use when working with UmbraLink, Umbrafox's owner-local loopback control service, `umbrafox-control` WebSocket protocol, live diagnostics, browser-driving commands, or freeze investigations. Do not use for generic WebDriver/BiDi work or requests to evade bot detection.
---

# UmbraLink

Use this skill for UmbraLink, Umbrafox's built-in owner-local loopback control service in `toolkit/components/umbrafox/`. UmbraLink is a privileged automation and diagnostics channel for an Umbrafox process the owner controls.

## Boundaries

- Treat UmbraLink as an owner-local diagnostic and automation channel, not a website-facing feature.
- Use the custom `umbrafox-control` discovery file and WebSocket protocol for Umbrafox diagnostics/control. Do not launch or attach through Firefox's stock Marionette, WebDriver BiDi, or Remote Agent paths for normal Umbrafox parity checks; flags such as `--marionette`, `--remote-debugging-port`, and `--remote-allow-system-access` can expose automation state independently of UmbraLink.
- Preserve the mandatory Umbrafox rulebook: do not change user agent strings, web-exposed APIs, DOM/CSS/JS surfaces, network semantics, or timing surfaces in a way that lets sites distinguish Umbrafox from the corresponding Firefox build by default.
- Do not use or extend this service to bypass bot detection, defeat anti-abuse systems, or hide automation from a third party. For legitimate QA/security research, keep work scoped to owned systems and document the assumptions.
- Keep the service bound to loopback with per-run token authentication. Do not expose it on public interfaces or write reusable secrets to world-readable locations.
- Before editing Umbrafox source code, read `umbrafox-conversion-guide/02-mandatory-modification-rules.md`.

## Source Map

Key files:

- `toolkit/components/umbrafox/UmbrafoxControlService.sys.mjs`: service startup, discovery file, WebSocket auth, command dispatch, diagnostics.
- `toolkit/components/umbrafox/UmbrafoxControlInput.sys.mjs`: privileged input command implementation.
- `toolkit/components/umbrafox/tests/browser/browser_control_service.js`: browser test coverage for service discovery and command behavior.
- `tools/umbrafox/diagnose-live.sh`: process, memory, journal, and crash-artifact sampler for live freeze investigations.

When changing front-end JS in these files, also use the `firefox-desktop-frontend` skill.

## Discovery

UmbraLink starts only when `umbrafox.control.enabled` is true. The port pref is `umbrafox.control.port`; `0` means choose an ephemeral port.

UmbraLink does not require `--marionette`, `--remote-debugging-port`, WebDriver BiDi, or DevTools remote debugging to be enabled. If those flags are present in a live process, investigate the launcher/tool that added them before drawing conclusions from website-facing browser state.

When running, the service writes:

```text
<profile>/umbrafox/control.json
```

The discovery file has mode `0600` and contains:

```json
{
  "host": "localhost",
  "port": 12345,
  "path": "/umbrafox-control",
  "token": "...",
  "websocketUrl": "ws://localhost:12345/umbrafox-control?token=..."
}
```

The active profile is usually under `~/.config/umbrafox/umbrafox/`, but prefer reading `control.json` from the real profile rather than guessing.

## Protocol

Connect to `websocketUrl`. Messages are JSON command objects:

```json
{
  "id": 1,
  "method": "umbrafox.status",
  "params": {}
}
```

Responses preserve `id` and return either:

```json
{ "id": 1, "result": {} }
```

or:

```json
{
  "id": 1,
  "error": {
    "code": "invalid argument",
    "message": "Expected context to be set"
  }
}
```

Known error codes include `invalid argument`, `no such frame`, `unknown command`, and lower-level exceptions surfaced by Gecko.

## Commands

`umbrafox.status` returns service metadata:

- `channel`: always `umbrafox-control`
- `protocol`: `umbrafox-json`
- `running`, `host`, `port`, `path`
- app name/version/platform/build IDs

`umbrafox.diagnostics.snapshot` returns status plus:

- `processID`
- `profileDir`
- distinguished memory reporter values
- open browser windows and tabs, including `context`, `browserId`, `label`, `url`, selection/pin state, and best-effort tab memory

`umbrafox.diagnostics.dumpMemoryReport` writes a gzipped about:memory report under:

```text
<profile>/umbrafox/diagnostics/
```

Parameters:

```json
{
  "filename": "optional-name.json.gz",
  "anonymize": true,
  "minimizeMemoryUsage": false
}
```

Filenames may contain only letters, numbers, dot, underscore, and dash. Path-like names must be rejected.

`umbrafox.gfx.snapshot` returns read-only graphics/compositor state:

- desktop environment and active chrome window layer-manager details
- `nsIGfxInfo` adapter fields, feature decisions, failures, crash guards, and target frame rate where available
- codec support summary when `nsIGfxInfo` has populated it

`umbrafox.media.snapshot` returns read-only media diagnostics:

- audio backend, preferred sample rate, max channels, and audio devices from chrome window utils
- codec support summary
- decoder-adjacent process summaries for RDD, GPU, and utility decoder actors
- open tabs and frame media elements, including existing `audio`/`video` element state, source URLs, ready/network state, time ranges, dimensions, Firefox frame counters such as `mozDecodedFrames` when present, and `getVideoPlaybackQuality()` totals/dropped frames

Parameters:

```json
{
  "context": 42,
  "includeEmptyFrames": false
}
```

Omit `context` to inspect all open browser tabs. `context` is a browsing context ID from a diagnostics snapshot.

`umbrafox.performance.snapshot` returns read-only process/performance state:

- parent and child process memory/CPU totals from `ChromeUtils.requestProcInfo()`
- process tree, child types, utility actors, and window URI/title metadata
- profiler active/paused status, supported features, active configuration, elapsed time, and buffer state

Parameters:

```json
{
  "includeThreads": false,
  "includeWindows": true
}
```

`umbrafox.performance.profile.dump` writes the current profiler capture under:

```text
<profile>/umbrafox/diagnostics/profiles/
```

Parameters:

```json
{
  "filename": "optional-name.json",
  "sinceTime": 0
}
```

The profiler must already be active. Filenames follow the same no-path rule as memory reports.

### Browser and page commands

These commands are implemented in `UmbrafoxControlBrowser.sys.mjs` and are the
supported way to drive or instrument a page. They are not listed in the older
spike notes.

- `umbrafox.browsingContext.create`
  - `context`: a live parent tab context from a diagnostics snapshot.
  - `background`: boolean, default `true`. `false` selects the new tab; `true`
    avoids focus theft. A selected/visible tab is required for meaningful
    `requestAnimationFrame`, typing, and paint profiling.
  - Returns `{ context, document, url }` for the new `about:blank` tab.
- `umbrafox.browsingContext.close`
  - `context`: tab context. Refuses to close the last tab.
- `umbrafox.browsingContext.navigate`
  - `context`, `url`, optional `wait` (`none` or `complete`, default
    `complete`) and `timeoutMs`.
  - Allowed schemes: `http`, `https`, `about`, `file`, `data`. JavaScript URLs
    are deliberately rejected; use `umbrafox.script.execute` instead.
- `umbrafox.script.execute`
  - `context`: a top-level tab context.
  - `body`: JavaScript source for an **async function body** (<= 65,536
    characters). The body must `return` the value you want; a trailing
    expression is not returned.
  - `realm`: `page` (default) or `browser`. `browser` runs with the system
    principal and exposes `Services`.
  - `args`: bounded JSON array cloned into the sandbox.
  - `document`: optional inner-window id from a diagnostics snapshot; omit for
    the current document.
  - `timeoutMs`: integer 1-60,000, default 10,000.
  - Returns `{ context, document, url, realm, result }` where `result` is
    `{ type: "json", value }` or `{ type: "undefined" }`. Results are bounded
    JSON: 10,000 nodes, depth 32, 1 MiB total; cycles, accessors and class
    instances are rejected.

### Durable page instrumentation (critical)

`umbrafox.script.execute` runs in a **sandbox that dies when the command
returns**. Never store sandbox-created functions or objects on page objects and
never wrap page methods with a sandbox function:

```js
// WRONG: the wrapper and observer callback die with the sandbox, shadow the
// page method, and later throw "can't access dead object".
app._render = (...args) => originalRender(...args);
window.__profile = { observer: new MutationObserver(callback) };
```

This is not theoretical. It has already shadowed Kikx's `_render` in a live tab.
Use a page-realm inline module for anything that must outlive the command:

```js
const code = `
  const app = document.querySelector('kikx-app');
  const observer = new MutationObserver((records) => { /* page realm */ });
  observer.observe(document.documentElement, { subtree: true, childList: true });
  window.__profile = { observer, snapshot() { /* ... */ } };
`;
const script = document.createElement('script');
script.type = 'module';
script.textContent = code;
document.documentElement.appendChild(script);
script.remove();
```

Even for one-shot evaluation, prefer a page-realm module when the code attaches
listeners, observers, timers, animation-frame loops, or methods. To repair a
method shadowed by a dead sandbox wrapper, delete the own property (for example
`delete app._render`) and rebind instance callbacks by importing the real module
inside an inline page-realm module. Re-import with a cache-busting query.

A hidden tab does **not** fire `requestAnimationFrame` normally (roughly one tick
every 45 seconds in observed builds). For typing, paint, animation, or
frame-budget profiling, use a selected/visible tab. `background:true` is still
the right choice for read-only snapshots that must not disturb the owner.

Read `windows[].tabs[].selected` from the diagnostics snapshot; do not assume the
first Kikx tab is the visible one. Context IDs are per document and change after
reload/navigation. If you create a tab with `background:false`, close it or
restore the owner's tab when the profile is done.

Input commands target a top-level browsing context from a diagnostics snapshot:

- `umbrafox.input.click`
- `umbrafox.input.pointerMove`
- `umbrafox.input.pointerDown`
- `umbrafox.input.pointerUp`
- `umbrafox.input.wheel`
- `umbrafox.input.keyDown`
- `umbrafox.input.keyUp`
- `umbrafox.input.type`

Common parameters:

- `context`: required browsing context ID
- pointer coordinates: content-viewport `x` and `y`; optional `fromX` and `fromY` for `pointerMove`
- mouse button: `button` 0 to 4
- modifiers: `altKey`, `ctrlKey`, `metaKey`, `shiftKey`

`pointerMove` also accepts `steps`, `durationMs`, `profile` (`linear`, `easeInOut`, `bezier`), and `seed`. Respect the built-in bounds instead of increasing them casually.

Keyboard commands:

```json
{ "context": 42, "key": "Escape", "ctrlKey": false }
```

Typing:

```json
{ "context": 42, "text": "hello" }
```

Wheel:

```json
{ "context": 42, "x": 100, "y": 100, "deltaY": 120, "deltaMode": 0 }
```

## Live Freeze Triage

Prefer non-invasive evidence first:

1. Check whether `tools/umbrafox/diagnose-live.sh` is already running and where it logs.
2. If needed, start it in the background with a durable artifact path:

   ```sh
   mkdir -p artifacts
   setsid tools/umbrafox/diagnose-live.sh 30 0 artifacts/umbrafox-live-$(date +%Y%m%d-%H%M%S).log >/tmp/umbrafox-diagnose.out 2>&1 &
   ```

3. Read the active `control.json` and request `umbrafox.diagnostics.snapshot`.
4. If memory is high or rising, request `umbrafox.diagnostics.dumpMemoryReport` with a timestamped filename.
5. Preserve crash dumps, `.extra` files, sampler logs, memory reports, and journal snippets under `artifacts/`.

Do not kill or restart the browser during a live freeze investigation unless the owner asks or preserving evidence is complete and the process is unusable.

## Verification

For control-service changes, run focused checks before broader build work:

```sh
./mach format toolkit/components/umbrafox tools/umbrafox
./mach lint toolkit/components/umbrafox
./mach test --headless toolkit/components/umbrafox/tests/browser/browser_control_service.js
```

If runtime behavior changed, build/package/install according to the Umbrafox project rules and verify `~/Programs/umbrafox --version`.
