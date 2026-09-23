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
