---
title: Intentional Firefox exception ledger
status: current
doc_type: reference
audience: [developers, maintainers, reviewers, bots]
last_verified: 2026-10-27
canonical: true
---

# Intentional Firefox exception ledger

> **Current documentation.** This is the canonical human-readable register of intentional fork behavior. The companion TSV mechanically records every source/test/tool path changed from the recorded upstream base.

The current inventory compares `HEAD` with upstream base
`1a097ed8d31f6b307a5d0ebc34a82ceaf7f3727b`. It contains 505 Firefox
source, test, build/docs configuration, and Umbrafox tool paths: 172 added and
333 modified. Project prose, exports, continuity notes, agent instructions, and
repository metadata are excluded from that number. The exact list is
[exception-paths.tsv](exception-paths.tsv).

## Product identity and branding

**Intent:** Umbrafox internally; Firefox-equivalent to the web.

- Umbrafox vendor, display name, basename, executable, remoting identity, icons,
  wordmarks, installer assets, desktop copy, and en-US product strings.
- Firefox application ID is retained for compatibility.
- `MOZ_APP_UA_NAME` is explicitly Firefox; HTTP and `navigator.userAgent` must
  not contain Umbrafox.
- The localization sweep is en-US-focused; other locales are not claimed complete.

Primary areas: `browser/moz.configure`, `browser/branding/`, browser/toolkit
locales, build configuration, app constants, installer/updater integration.

## Defaults, homepage, search, and remote features

**Intent:** quieter power-user defaults without deleting web-exposed Firefox APIs.

- Default-browser checking off; session restore on.
- Search-focused home/new-tab with customize, sponsored content, stories,
  recent activity, widgets, weather, top sites, and Discovery Stream defaults reduced/off.
- DuckDuckGo default; Google, Bing, Amazon, and eBay removed from packaged dumps
  and filtered from runtime Remote Settings selection.
- Search suggestions, recent/trending/online/sponsored QuickSuggest surfaces reduced/off.
- Data-collection settings UI removed; telemetry/usage, studies, rollouts,
  recommendations, and crash-prompt defaults reduced/off.

Primary areas: `browser/app/profile/firefox.js`, Activity Stream, preferences,
URL bar, search selector/dumps, Remote Settings attachment behavior, tests.

## Userland scripts and interception

**Intent:** explicit user-authored control above an inert Firefox-equivalent default.

- Profile-local script store, scope, registry, runtime, strict async wrapper,
  internal help page, and Debugger create/edit/enable workflow.
- Document-start execution with parser blocking and exact-origin selection.
- Dialog, navigation, script-source, request, and DOM mutation event families.
- Native bridges in docshell, DOM, script loading, SpiderMonkey, security manager,
  HTTP observers, process shared data, and JSWindowActors.
- Active-pref and observer gates prevent disabled handlers from changing later behavior.
- Incomplete worker, socket, response-stream, request-body, history, initial
  navigation, module-type, media-stream, and isolated-world coverage is explicit.

## UmbraLink and automation surfaces

**Intent:** authenticated owner-local control without enabling Firefox automation services.

- Default-off app-menu toggle and prefs.
- Token-authenticated localhost WebSocket discovery/control service.
- Browsing context, navigation, bounded page/browser script, pointer/keyboard,
  status, memory, graphics, media, performance, and profiler commands.
- JSWindowActors for input, execution, and diagnostics.
- A separate experimental WebDriver BiDi root module exists in the fork but is
  not the normal UmbraLink path and must not be confused with parity-safe operation.
- No command closes the final tab, closes a window, or quits the browser.

## Browser-chrome interaction exceptions

- Panels close from Escape keyup rather than ordinary keydown and tolerate GTK
  focus-out caused by non-Escape keyboard shortcuts.
- Inline tab mute controls are not created; tab audio state, context-menu mute,
  and keyboard paths remain.
- Linux `about:keyboard` offers an opt-in Chrome-style preset while keeping
  Firefox defaults until selection.

## Site clipboard override

**Status:** Linux prototype, explicit user control.

When a site cancels a genuine copy/paste attempt outside contenteditable,
Umbrafox can present No/Yes/Always through privileged UI. An initial indicator
is dismissed by default; `Always` persists only after a safe native success and
uses origin, operation, and origin attributes. Normal Firefox behavior remains
without an explicit override. Native clipboard, actors, permissions, editor,
popup UI, modules, and tests are part of the exception.

## Linux canvas, DMABUF, and readback

Canvas/WebGL, remote media IPC, image containers, GL blitting, texture hosts,
DMABUF formats/surfaces, GTK compositor integration, and producer-fence paths
carry readback/import/cache work. Exact pixels, modifier/format admission,
lifetime, synchronization, fallback, and inactive-path parity are mandatory.

## WebRender and Wayland external-video work

WebRender carries instrumentation, admission accounting, shader/renderer
changes, and an external-YUV path. EGL/NativeLayer/Wayland code carries
external surfaces and child-surface vsync lifecycle support. The path is
experimental/default-inert and must fall back when admission, attach, color,
modifier, or lifecycle proof fails.

## Media exceptions

- Recreate stopped audio streams during seek recovery.
- Vendor FFmpeg V4L2 M2M H.264 components and registration for Linux GTK,
  with fail-open decoder selection and VA-API ordered first.
- Carry media diagnostics and tests supporting seek, decoder, and graphics work.

## Tooling, tests, and opt-in performance configuration

Umbrafox adds control/parity, userland, mutation, opacity, readback, probe-gate,
keyboard, performance, beta-launcher, and live-diagnostics tools. These are
fork exceptions but do not imply that each historical candidate is shipped.

## Upstream exceptions that must deliberately remain

Some names and IDs containing `firefox` are compatibility identifiers and are
not branding mistakes. Asset filenames, Fluent IDs, support identifiers,
application ID, web UA identity, and many upstream module names remain Firefox
by design. Do not perform blind renames.

## Updating this ledger

For every new divergence: classify its user-visible goal and default behavior,
add source/tests to the exact inventory, document detectability and fallback,
update the relevant conversion recipe, and record new identity leaks. A changed
path with no ledger category is a documentation failure.
