# Bot control channel plan

Status: WebDriver BiDi prototype implemented; non-fingerprinting control moved
to `plans/03-local-control-channel.md`.

## Goal

Add a privileged automation channel for full-control bots. The channel should
let trusted local tooling inspect and drive Umbrafox, then grow into APIs for
userland scripts, network interception, DOM mutation control, browser settings,
resource substitution, and other power-user workflows.

## Foundation

The first prototype built on Firefox Remote Agent and WebDriver BiDi instead of
Chrome DevTools Protocol. Current Firefox exposes Remote Agent through
`--remote-debugging-port`, supports WebDriver BiDi and Marionette, and no longer
ships CDP support in this tree.

Remote Agent is useful for development, but it is not suitable for the
non-fingerprinting automation path because it participates in Firefox's
WebDriver exposure state. Use `plans/03-local-control-channel.md` for the
independent local channel.

The first Umbrafox API surface should be a vendor-style WebDriver BiDi root
module:

```text
umbrafox.status
umbrafox.listCapabilities
```

Future commands can grow under the same module or split into focused modules
such as `umbrafox.userland`, `umbrafox.network`, and `umbrafox.dom`.

## Rulebook constraints

- No web-visible changes. Websites must not learn that the Remote Agent exposes
  Umbrafox commands.
- No page globals, DOM APIs, headers, CSS, WebIDL, storage keys, timing changes,
  or console messages visible to page scripts.
- The channel must be explicit. It should exist only through Remote Agent and
  should require the same privileged system-access gate for Umbrafox-specific
  commands.
- Dangerous capabilities are intentional, but they must be attributable to an
  explicit bot/client connection and never silently enabled by default.
- Remote exposure beyond loopback needs authentication or a trusted tunnel.
  Firefox Remote Agent does not provide encryption or authentication by itself.

## Initial slice

Implement a root BiDi module at:

- `remote/webdriver-bidi/modules/root/umbrafox.sys.mjs`

Register it in:

- `remote/webdriver-bidi/modules/ModuleRegistry.sys.mjs`
- `remote/webdriver-bidi/jar.mn`

Commands:

- `umbrafox.status`: returns channel metadata and confirms whether privileged
  access is available.
- `umbrafox.listCapabilities`: returns a conservative list of planned
  capability buckets and whether each bucket is implemented yet.

Both commands must call `assert.hasSystemAccess()`. This makes the first slice
usable only when Remote Agent is started with `--remote-allow-system-access`.

## Future capability buckets

- Browser/session inventory: windows, tabs, browsing contexts, profiles,
  storage partitions, containers.
- Userland script management: list, create, update, enable, disable, delete,
  reorder, import, export.
- Userland runtime inspection: per-context active scripts, last run status,
  errors, pending awaits, event handler inventory.
- Network control: request/response observation, rewrite, substitution,
  synthetic responses, body and stream replacement.
- DOM control: mutation event policies, rejected/substituted mutations, node
  snapshots, invisible userland-owned metadata.
- Browser chrome control: settings, permissions, downloads, prompts, UI state.
- DevTools/debugging: script source events, breakpoints, execution contexts,
  console streams, worker and process inventory.
- Audit and safety: capability discovery, client identity, explicit opt-ins,
  local-only defaults, future authentication.

## Detectability review

The first slice is internal to Remote Agent. It does not affect HTTP requests,
page script globals, DOM, CSS, storage, media, timing, workers, service workers,
or feature detection. No behavior changes when Remote Agent is not explicitly
started. No page-visible Umbrafox markers are added.

Future slices must repeat this review, especially network and DOM controls.

## Verification

Use targeted checks:

```bash
./mach lint remote/webdriver-bidi/modules/root/umbrafox.sys.mjs remote/webdriver-bidi/modules/ModuleRegistry.sys.mjs remote/webdriver-bidi/jar.mn remote/webdriver-bidi/test/browser/browser_UmbrafoxControl.js
./mach build faster
./mach test --headless remote/webdriver-bidi/test/browser/browser_UmbrafoxControl.js
```

Manual command shape:

```json
{ "id": 1, "method": "umbrafox.status", "params": {} }
```

The command should fail without system access and succeed when Remote Agent was
started with `--remote-allow-system-access`.

## Rebase notes

Expected conflict hotspots:

- `remote/webdriver-bidi/modules/ModuleRegistry.sys.mjs` if upstream changes
  module registration.
- `remote/webdriver-bidi/jar.mn` if upstream reorganizes packaged BiDi modules.
- WebDriver BiDi tests if upstream changes the Remote Agent test harness.
