# Recipe 11: Bot control channel

## Goal

Expose a privileged, bot-oriented command channel through Firefox Remote Agent
and WebDriver BiDi. The initial slice proves the channel with safe status and
capability-discovery commands.

## Files changed

- `remote/webdriver-bidi/modules/root/umbrafox.sys.mjs`
- `remote/webdriver-bidi/modules/ModuleRegistry.sys.mjs`
- `remote/webdriver-bidi/jar.mn`
- `remote/webdriver-bidi/test/xpcshell/test_UmbrafoxModule.js`
- `remote/webdriver-bidi/test/xpcshell/xpcshell.toml`
- `umbrafox-conversion-guide/plans/02-bot-control-channel.md`

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

## Rebase notes

Expected conflict hotspots:

- `remote/webdriver-bidi/modules/ModuleRegistry.sys.mjs`
- `remote/webdriver-bidi/jar.mn`
- `remote/webdriver-bidi/test/xpcshell/xpcshell.toml`

If `umbrafox.status` starts returning unknown-command errors, check module
registration and jar packaging first.
