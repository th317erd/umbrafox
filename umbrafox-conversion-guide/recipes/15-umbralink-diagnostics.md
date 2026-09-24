# Recipe 15: UmbraLink diagnostics

## Goal

Expose read-only rendering, media, and process metrics through UmbraLink so
owner-local tools can debug freezes, dropped frames, decoder/process behavior,
and compositor state without enabling Firefox Remote Agent, Marionette, or any
website-visible JavaScript interface.

## Files changed

- `toolkit/components/umbrafox/UmbrafoxControlDiagnostics.sys.mjs`
- `toolkit/components/umbrafox/UmbrafoxControlService.sys.mjs`
- `toolkit/components/umbrafox/moz.build`
- `toolkit/actors/UmbrafoxControlDiagnosticsChild.sys.mjs`
- `toolkit/actors/UmbrafoxControlDiagnosticsParent.sys.mjs`
- `toolkit/actors/moz.build`
- `toolkit/modules/ActorManagerParent.sys.mjs`
- `toolkit/components/umbrafox/tests/browser/browser_control_service.js`
- `.agents/skills/umbrafox-link/SKILL.md`

## Commands

`umbrafox.gfx.snapshot` returns internal graphics state from `nsIGfxInfo`,
including adapters, feature decisions, failures, crash guards, window protocol,
desktop environment, target frame rate, and chrome window layer-manager state.

`umbrafox.media.snapshot` returns media diagnostics for open tabs. It includes
audio backend/device state, codec support info, decoder-adjacent process
summaries for RDD/GPU/utility decoder actors, and per-frame `audio`/`video`
element state. Video entries include existing Gecko/page metrics such as
`getVideoPlaybackQuality()` totals and dropped-frame counts, plus Firefox media
frame counters like `mozDecodedFrames` when present.

`umbrafox.performance.snapshot` returns process performance data from
`ChromeUtils.requestProcInfo()`, profiler status, profiler buffer state, process
memory/CPU totals, and optional thread/window details.

`umbrafox.performance.profile.dump` writes an already-active profiler capture
under `<profile>/umbrafox/diagnostics/profiles/`. It does not start profiling;
callers must enable the profiler through existing privileged tooling first.

## Data flow

`UmbrafoxControlService.execute(...)` routes the new commands to
`UmbrafoxControlDiagnostics.sys.mjs`.

Parent-process diagnostics read existing privileged services directly:

- `nsIGfxInfo` for graphics and codec-support data.
- `ChromeUtils.requestProcInfo()` for process memory, CPU, process type, utility
  actor, and window metadata.
- `Services.profiler` for profiler state and profile dumps.
- chrome window `windowUtils` for audio backend and device information.

Content media element data is collected by the dedicated
`UmbrafoxControlDiagnostics` JSWindowActor. The parent module walks browser
`BrowsingContext` trees and sends a one-shot query to each frame actor. The
child actor only reads existing `audio` and `video` element properties and
returns serialized data; it does not mutate DOM, install listeners, add globals,
or evaluate page-authored code.

## Rulebook notes

This feature is internal and token-gated through loopback UmbraLink. It must
not add WebIDL, web globals, CSS, DOM markers, request headers, storage keys,
console output, or any page-visible Umbrafox string.

The media actor runs with chrome privileges but performs read-only inspection.
It reads existing page-visible media metrics, so the data shape can differ from
site to site, but no new metric is exposed to page scripts. If future work needs
deeper decoder details that Gecko does not already expose to privileged JS, add
a privileged-only C++/WebIDL or XPCOM path and repeat the detectability review
before landing it.

## Verification

```bash
./mach format toolkit/components/umbrafox toolkit/actors/UmbrafoxControlDiagnosticsChild.sys.mjs toolkit/actors/UmbrafoxControlDiagnosticsParent.sys.mjs toolkit/modules/ActorManagerParent.sys.mjs
./mach lint toolkit/components/umbrafox toolkit/actors/UmbrafoxControlDiagnosticsChild.sys.mjs toolkit/actors/UmbrafoxControlDiagnosticsParent.sys.mjs toolkit/modules/ActorManagerParent.sys.mjs
./mach test --headless toolkit/components/umbrafox/tests/browser/browser_control_service.js
```

The browser test starts UmbraLink, connects through the real WebSocket
discovery URL, exercises the new snapshot commands, verifies media element
visibility from a normal content tab, and confirms the diagnostics actor is not
visible as a content global.

## Rebase notes

Expected conflict hotspots:

- `toolkit/modules/ActorManagerParent.sys.mjs` when upstream adds actors near
  the Umbrafox registrations.
- `toolkit/actors/moz.build` when upstream actor packaging changes.
- `toolkit/components/umbrafox/UmbrafoxControlService.sys.mjs` when adding new
  command routing.

After upstream actor-registration changes, verify the packaged browser can
instantiate `UmbrafoxControlDiagnostics`; a build can succeed while runtime
startup fails if the actor URI scheme or packaging list is wrong.
