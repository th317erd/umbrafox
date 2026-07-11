# Recipe 11: Bot control channel

## Goal

Expose privileged bot-oriented command channels. The first committed channel was
a WebDriver BiDi prototype; the current direction adds a local Umbrafox control
service that does not start Firefox Remote Agent or Marionette.

## Files changed

- `remote/webdriver-bidi/modules/root/umbrafox.sys.mjs`
- `remote/webdriver-bidi/modules/ModuleRegistry.sys.mjs`
- `remote/webdriver-bidi/jar.mn`
- `remote/webdriver-bidi/test/xpcshell/test_UmbrafoxModule.js`
- `remote/webdriver-bidi/test/xpcshell/xpcshell.toml`
- `umbrafox-conversion-guide/plans/02-bot-control-channel.md`
- `toolkit/components/umbrafox/UmbrafoxControlService.sys.mjs`
- `toolkit/components/umbrafox/tests/browser/browser_control_service.js`
- `toolkit/components/umbrafox/tests/browser/browser.toml`
- `browser/components/BrowserGlue.sys.mjs`
- `browser/app/profile/firefox.js`
- `umbrafox-conversion-guide/plans/03-local-control-channel.md`

## Data flow

Remote Agent starts only when explicitly launched with
`--remote-debugging-port`. WebDriver BiDi commands are routed through
`WebDriverSession.execute(...)`, which resolves root modules through
`remote/webdriver-bidi/modules/ModuleRegistry.sys.mjs`.

Umbrafox registers a root module named `umbrafox`, packaged by
`remote/webdriver-bidi/jar.mn`. Its first commands are:

- `umbrafox.status`
- `umbrafox.listCapabilities`

Both commands call `assert.hasSystemAccess()`, so clients must start Remote
Agent with `--remote-allow-system-access` before Umbrafox-specific bot commands
can run.

## Rulebook notes

This channel is internal and privileged. It does not add web-visible globals,
DOM APIs, CSS behavior, headers, storage keys, WebIDL, feature-detection
results, or page-visible console output. It has no effect when Remote Agent is
not explicitly started.

Future bot commands must repeat the detectability review, especially commands
that affect network, DOM mutation, script source, workers, storage, or timing.

## Verification

```bash
./mach lint remote/webdriver-bidi/modules/root/umbrafox.sys.mjs remote/webdriver-bidi/modules/ModuleRegistry.sys.mjs remote/webdriver-bidi/jar.mn remote/webdriver-bidi/test/xpcshell/test_UmbrafoxModule.js remote/webdriver-bidi/test/xpcshell/xpcshell.toml umbrafox-conversion-guide/plans/02-bot-control-channel.md umbrafox-conversion-guide/recipes/11-bot-control-channel.md
./mach build faster
./mach xpcshell-test remote/webdriver-bidi/test/xpcshell/test_UmbrafoxModule.js
./mach xpcshell-test remote/webdriver-bidi/test/xpcshell
```

Manual launch shape:

```bash
./mach run --remote-debugging-port --remote-allow-system-access
```

Then connect a WebDriver BiDi client and call:

```json
{ "id": 1, "method": "umbrafox.status", "params": {} }
```

Without `--remote-allow-system-access`, `umbrafox.*` commands should return an
unsupported-operation error.

## Independent local control service

The WebDriver BiDi prototype is useful for development but is not suitable for
the non-fingerprinting control path, because running Firefox Remote Agent makes
`navigator.webdriver` true.

The independent local service lives in
`toolkit/components/umbrafox/UmbrafoxControlService.sys.mjs`. BrowserGlue calls
`maybeStart()` during `_beforeUIStartup`, but the service starts only when
`umbrafox.control.enabled` is true. It binds to `localhost`, chooses an
ephemeral port by default, generates a per-run token, and writes discovery data
to:

```text
<profile>/umbrafox/control.json
```

The first supported command is:

```json
{ "id": 1, "method": "umbrafox.status", "params": {} }
```

Native input commands are documented separately in
`recipes/12-local-control-input.md`.

This service must not import or start `nsIRemoteAgent`, Marionette, or
WebDriver BiDi. Its browser test runs under Marionette, so it verifies that the
service does not change the pre-existing `navigator.webdriver` value. Manual
non-Marionette checks should verify that content sees `navigator.webdriver ===
false` while only the Umbrafox control service is running.

## Rebase notes

Expected conflict hotspots:

- `remote/webdriver-bidi/modules/ModuleRegistry.sys.mjs`
- `remote/webdriver-bidi/jar.mn`
- `remote/webdriver-bidi/test/xpcshell/xpcshell.toml`

If `umbrafox.status` starts returning unknown-command errors, check module
registration and jar packaging first.
