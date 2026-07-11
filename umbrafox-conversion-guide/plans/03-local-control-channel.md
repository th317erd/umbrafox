# Local control channel plan

Status: first independent transport and pointer input slices implemented.

## Goal

Create a privileged local automation channel for Umbrafox that does not depend
on Firefox Remote Agent or Marionette, because those services intentionally make
automation visible through WebDriver state such as `navigator.webdriver`.

The first slice only proves the transport:

- off by default;
- loopback only;
- token gated;
- profile-local discovery file;
- one safe `umbrafox.status` command;
- one deterministic native pointer movement command;
- test coverage that web content sees no change to existing WebDriver exposure.

Native input, screenshots, DevTools, userland management, and network controls
must be layered on top only after this non-WebDriver foundation exists.

## Critical review

### WebDriver leakage

Do not start `nsIRemoteAgent` or Marionette for the Umbrafox control channel.
Firefox's `Navigator::Webdriver()` checks whether those services are running.
Using them for the stealth/default path would create a page-visible automation
marker.

The local control service may reuse low-level socket helpers, but must not call
Remote Agent startup methods, set Remote Agent shared-data flags, or apply
WebDriver recommended preferences.

### Local web page access

Arbitrary web pages can attempt localhost connections. Loopback binding is not
enough. The channel needs an unguessable per-run token and should reject
connections before WebSocket upgrade if the token is missing or wrong.

The token is written only to a profile-local file. A process that can read the
profile can already control or inspect much of the browser.

### User control

The channel must be off by default. Enabling it is an explicit local user or
tooling action. Future dangerous commands must remain inspectable and
attributable to this channel.

### Headless parity

Headless operation has independent fingerprinting risks. This plan does not
claim headless Firefox is indistinguishable from headed Firefox. Any headless
hardening must be reviewed separately against the mandatory rulebook.

### Human mimicry

Pointer path planning can be useful for correct hover, drag, and visual
observability. Do not tune automation behavior for bypassing site-side anti-abuse
systems. Keep the channel focused on browser-native control and Firefox parity.

## Protocol shape

Use a small JSON command envelope:

```json
{ "id": 1, "method": "umbrafox.status", "params": {} }
```

Responses:

```json
{ "id": 1, "result": { "channel": "umbrafox-control" } }
```

Errors:

```json
{ "id": 1, "error": { "code": "unknown command", "message": "Unknown method" } }
```

## Discovery file

When enabled, write:

```text
<profile>/umbrafox/control.json
```

The file contains:

- `host`
- `port`
- `path`
- `token`
- `websocketUrl`

The file is removed when the service stops.

## Initial files

- `toolkit/components/umbrafox/UmbrafoxControlService.sys.mjs`
- `toolkit/components/umbrafox/moz.build`
- `toolkit/components/umbrafox/tests/browser/browser_control_service.js`
- `toolkit/components/umbrafox/tests/browser/browser.toml`
- `browser/components/BrowserGlue.sys.mjs`
- `browser/app/profile/firefox.js`

## Detectability review

The first slice does not add page globals, DOM APIs, WebIDL, CSS behavior,
headers, storage keys, feature-detection results, or page-visible console
output. It does not start Remote Agent or Marionette. Browser-chrome tests run
under Marionette, so automated coverage should verify that the control service
does not change the pre-existing `navigator.webdriver` value. Manual
non-Marionette verification should confirm that normal content still sees
`navigator.webdriver === false` while only the Umbrafox control service is
running.

## Future slices

- Additional native trusted input commands through widget/event synthesis,
  including click, drag, wheel, and keyboard.
- Screenshot and screencast commands independent of Remote Agent.
- Browser chrome and DevTools inspection commands.
- Capability negotiation and audit logging.
- Optional command-line startup flag if profile prefs are not sufficient for
  automation launch workflows.
