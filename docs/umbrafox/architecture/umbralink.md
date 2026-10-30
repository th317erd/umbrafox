---
title: UmbraLink architecture
status: current
doc_type: architecture
audience: [developers, operators, security-reviewers, bots]
last_verified: 2026-10-27
canonical: true
---

# UmbraLink architecture

> **Current documentation.** Verified against the complete UmbraLink skill and current control-service, browser, script, input, diagnostics, actor, and browser-test sources on 2026-10-27.

UmbraLink is Umbrafox's privileged owner-local automation and diagnostics
channel. It is deliberately separate from Firefox's Marionette, WebDriver BiDi,
Remote Agent, and DevTools remote-debugging services.

```text
browser startup / app-menu pref
  → UmbrafoxControlService
  → localhost HTTP upgrade at /umbrafox-control
  → per-run token authentication
  → JSON command dispatcher
       ├─ browser/page control
       ├─ synthesized input through JSWindowActors
       ├─ diagnostics/media/gfx/performance snapshots
       └─ bounded file exports under the active profile
```

## Lifecycle and security

The default `umbrafox.control.enabled` value is false. When enabled,
`BrowserGlue` starts the service; the app-menu toggle changes that preference.
The service binds to `localhost`, uses an ephemeral port by default, generates a
per-run token, and writes `<profile>/umbrafox/control.json` with mode `0600` in
a mode-`0700` directory. The token appears in the discovery file and WebSocket
URL and is required during the HTTP upgrade.

Stopping the service closes connections, removes the discovery file, clears
the token, and resets the bound port. Closing a WebSocket aborts its pending
operations. Browser commands allow at most one pending operation per context
and 16 total.

## Execution boundaries

- Page realm execution uses a short-lived sandbox tied to the current document.
- Browser realm execution uses the system principal and exposes `Services`.
- Script bodies, timeouts, arguments, result depth/node count, and encoded size are bounded.
- A navigation or disconnect invalidates/cancels the operation.
- Browsing-context IDs change with documents and must be reacquired from snapshots.
- Closing the final tab is refused; no command quits the application or closes a window.

Short-lived sandboxes are unsafe for durable listeners, observers, timers, or
method wrappers. Durable instrumentation must create objects inside the page
realm, normally through an injected inline module. Hidden or occluded tabs do
not provide meaningful `requestAnimationFrame` timing.

## Parity boundary

UmbraLink is internal and default-off. It does not add page globals, request
headers, or a WebDriver marker. Normal parity checks must use UmbraLink without
Firefox automation flags; a run containing those flags is automation-tainted
for website-visible comparisons.

See the [protocol reference](../reference/umbralink-protocol.md) and
[operator runbook](../operations/umbralink.md).
