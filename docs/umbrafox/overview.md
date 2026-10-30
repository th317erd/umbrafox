---
title: Umbrafox overview
status: current
doc_type: overview
audience: [users, developers, maintainers]
last_verified: 2026-10-27
canonical: true
---

# Umbrafox overview

> **Current documentation.** Verified against the fork commit history, conversion guide, Umbrafox-owned modules, preferences, manifests, and tests on 2026-10-27.

Umbrafox is Firefox reshaped for a technically sophisticated owner. It retains
Gecko, Firefox chrome, Mozilla's build system, and nearly all upstream behavior,
then layers a bounded set of intentional exceptions on top.

## Product principles

- Default web identity remains equivalent to the matching Firefox build.
- Internal branding, installers, browser chrome, and privileged pages may say Umbrafox.
- Dangerous interception and automation capabilities are explicit owner controls.
- Quiet, power-user defaults replace sponsored, experimental, or nagging surfaces.
- Interception prefers compatible substitution over remotely observable failure.
- Changes remain rebaseable and carry parity-focused regression evidence.

## Implemented capability map

| Area | Status | Summary |
| --- | --- | --- |
| Branding and executable identity | Implemented | Umbrafox chrome, assets, vendor and executable; Firefox application ID retained. |
| Website identity parity | Implemented, recurring gate | `MOZ_APP_UA_NAME` remains Firefox; parity still requires live verification after rebases. |
| Quiet defaults | Implemented | Session restore, simplified new tab, reduced sponsored/remote surfaces, DuckDuckGo-first search policy. |
| Userland scripts | Partial | Profile-local document scripts, dialog/navigation/script/request/mutation events, DevTools editing; important worker/network/isolation gaps remain. |
| UmbraLink | Implemented, default off | Token-authenticated loopback control, input, browsing, script execution, diagnostics and profiling. |
| Browser-chrome controls | Implemented | UmbraLink menu toggle, panel Escape-on-keyup behavior, no inline tab mute target. |
| Chrome-style Linux shortcuts | Implemented, opt-in | Explicit preset through CustomKeys; Firefox defaults remain until selected. |
| Site clipboard override | Linux prototype | Explicit No/Yes/Always flow with native and permission integration; not a cross-platform release claim. |
| DMABUF canvas/video work | Experimental/implemented slices | Linux readback/import paths, tests, diagnostics and retained performance work. |
| Hybrid Wayland external video | Experimental, default inert | Committed source and instrumentation; hardware/release acceptance remains bounded by archived evidence. |
| V4L2 M2M H.264 | Vendored, runtime proof incomplete | Fail-open Linux GTK path intended for Pi-class devices; current status page records the unclosed build/device gates. |

## What Umbrafox is not

Umbrafox is not a distinct web platform, an anti-detection browser, a public
remote-control daemon, or a promise that every historical prototype is shipped.
It does not authorize use of UmbraLink against third-party systems or hiding
Firefox automation flags from websites.

See the [exception ledger](reference/firefox-exceptions.md) for the complete
fork-specific behavior map and [current status](maintainers/current-status.md)
for the evidence boundary.
