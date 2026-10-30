# Scrollbar Profile Control

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

The fixed original-layout then hidden-overflow laptop pair completes its real
capture, resource and cleanup checks. Saved exports support a specific startup
scheduling difference: original layout records one scrollbar fade timer and two
groups of vsync-message native video-callback scopes; hidden overflow records
neither that timer nor those groups. Hidden startup scopes are all catch-up
dispatched. This strengthens the scrollbar/scheduling lead for the owned fixture,
not a general YouTube diagnosis or a production optimization.

The original strict analysis FAILED at299 native scopes versus298 page callbacks
in hidden phase0. That failure and analyzer remain unchanged. A separately tested
scope diagnostic preserves the count mismatch, one phase-boundary crossing and
unknown actual callback pairing. No browser rerun or threshold change was made
to obtain a passing result.

The prior unprofiled [overflow control](2026-10-06-scrollbar-control.md) still has
a63ms hidden-layout startup gap. It rules out the claim that removing scrollbar
activity removes every startup pause. Original27/29and28/29performance failures,
the146ms interval/four compositor drops and renderer-label cost remain open.

## Controlled Execution

The [prospective P2 contract](../../plans/scrollbar-video-control.md) fixed one
fresh process per arm, same normal46-file render-pass-marker package/import ON,
and profiler ON. Package manifest is
`4c8085f0f675c5b183976807df38bb99474bbd8be2e58651b52e4be9176eee8e`,
Build20261006175655. The private installed copy has47files including its lock.
Neither is a native-test overlay, and no browser package was rebuilt or installed
on the desktop in this phase.

Both use the same90s1080p H.264 clip,48s four12s phases with1/4/4/1copies into a
320x180 default canvas. B appends only `html{overflow:hidden}`. The common geometry
read occurs after canvas insertion and before playback. Both have viewport/root
client1280x955, root/body scroll extent1280x1140, canvas `(0,0,320,180)` and video
`(0,185,1280,955)`. Only computed overflow differs, visible versus hidden.

Profiler configuration is unchanged:16777216 entries,5ms sampling, existing
js/stackwalk/processcpu/nomarkerstacks features and thread filters. Eight ordinary
UserTiming phase marks are emitted after playback. There is no per-frame RPC,
native instrumentation change or new public interface. These profiled timings
must not be pooled with unprofiled P1 or used for release performance acceptance.

| Observation | A Original | B Hidden |
| --- | ---: | ---: |
| Page callbacks |1192|1192|
| Page gaps over50ms, phases0-3 |5/0/0/0|0/0/0/0|
| Page maximum startup gap, ms |56|43|
| Video drops, all phases |0|0|
| Native callback-attempt scopes |1192|1193|
| Native refresh ticks |1228|1196|
| Recorded wait-for-paint markers |0|0|
| Fade timer markers in full exported view |1|0|
| Startup Styles markers |4|0|

All final native decoder, sink, compositor and container drop counters are0.
Both identify hardware-accelerated ffmpeg/RDD H.264. Initial decoder labels are
`shutdown`, retained rather than represented as active decoder proof. Graphics
projections match: Intel Iris Xe RPL-P, Mesa/iris25.2.8, X11/KWin, remote WebRender
and available hardware compositing, with no graphics failure records.

## Scope Semantics And Failed Premise

Frozen `nsRefreshDriver::RunVideoFrameRequestCallbacks` places the
`requestVideoFrame callbacks` RAII marker around the document's video-element
loop, BEFORE `WillFireVideoFrameCallbacks`. That predicate can cause `continue`;
the nested callback loop also skips cancelled callbacks. Therefore a scope can
contain zero or several actual callback invocations. Marker count is not an
authoritative callback count even when totals happen to agree.

The archived build-HEAD source has SHA256
`acfe7e45c50b2ebecbd9f53035e2b9786dcf6f297938e5ff5427fe17b3e19a2f`,
is absent from the package source patch and matches its prior sealed source
proof. The equivalent upstream placement is visible in this
[Searchfox permalink](https://searchfox.org/firefox-main/rev/4b5e436b8bc908fe7feb7341209140771397dda1/layout/base/nsRefreshDriver.cpp#2107).
The frozen artifact, not upstream revision equivalence, binds this build.

B phase0 has299 wholly contained scopes and298 page records. Its shortest scope,
`m-33`, lasts0.001845ms at CLI time916.438722ms. It is consistent with an attempt
that did not execute a page callback; duration alone does not prove that.
B phase2 has297 contained scopes plus one crossing its start, versus298 page
records. Scope `m-1815` begins24910.401673ms and lasts0.867832ms; the phase starts
24910.631187ms. No timestamps are rounded, clamped or reassigned to repair this.
Rounded page-clock boundaries are a possible explanation, not a proven join.

The new `scope-analysis.mjs` calls the existing strict scheduling/startup
validators but reports native scopes separately from page callbacks. It verifies
the full fade query against the startup export, including explicit query filters,
counts, view bounds and identities. `scope-results.json` retains
`originalStrictPairPassed:false`, `actualCallbackPairingProved:false` and
`performanceAccepted:false`. All scopes, crossings and gaps remain available.
CLI-derived intervals still lack raw phase/pair completeness proof.

## Startup Observation

Offsets below are native scope starts relative to the explicitly joined phase0
start, not hardware-vsync or physical presentation timestamps:

| Arm | Dispatch | Scope Count | First-Last Offset, ms |
| --- | --- | ---: | --- |
| A | Vsync message |11|47.790-448.205|
| A | Catch-up |13|476.307-958.652|
| A | Vsync message |12|1014.801-1447.997|
| A | Catch-up |13|1482.724-1965.971|
| B | Catch-up |50|29.884-1962.614|

A's fade timer occurs999.063ms after phase start and lasts0.083360ms. It contains
two fixture-document style invalidations; the next Styles interval lasts0.619079ms.
Those durations do not explain a50ms CPU stall. They support a scheduling-state
change rather than a large synchronous style calculation. Every observed scope
in the startup window has unique refresh/dispatcher containment; actual page
callback assignment is still unknown. Seven A GC slices peak at2.527ms and four
B slices at4.578ms; no long GC slice is demonstrated by this window.

Six A native scope-start gaps exceed50ms, versus five page-clock gaps; those are
different observations and are not silently merged. B has zero such native gaps.
The single profiled A/B sequence is not a replicated causal or performance result.
No matching fade marker in B means none in this queried view, not proof that no
scrollbar object, animation, unrecorded event or earlier work ever existed.

## Provenance, Verification And Cleanup

The new173-file harness retains all167previous inputs unchanged, has40static
imports and manifest
`5242ceb673234b9e6fef41f1bbb63a988adfdaa889bc1a4661bf5245c016714c`.
Private laptop harness is `scrollbar-profile-harness-20261006-XcQKFb`, admitted
with dev64512/ino37124875/uid1000/mode0700. A source-generation typo failed before
runtime and is preserved separately; the corrected generation verified existing
outputs instead of overwriting them.

| Arm | Browser / Controller | Capture UTC | Gzip Bytes |
| --- | --- | --- | ---: |
| A |1835058/1835045|04:28:49.049-04:29:51.459|11321365|
| B |1838043/1838031|04:30:18.526-04:31:20.607|11268099|

UTC date is October7; local Phoenix date is October6. Each capture replays all17
saved stages exactly, including profiler stop and terminal report. Each has15
resource samples; peak sampled artifacts152003593/151919158bytes remain below
256MiB. Existing80MiB pre-profile headroom and24MiB gzip limits remain. Native
profile-gathering memory is not hard-bounded by the resulting gzip size.

Both owned cleanups use SIGTERM, with271-byte logs and0drops; warnings are retained.
All24recorded browser/controller/child PIDs were independently absent at
04:48:05.813UTC. Five-second sampling does not establish complete process history.
Private profile, token and app-data contents were not exported. Only the explicitly
receipted opaque compressed profile accompanies the bounded public evidence.

Offline profiler-cli0.10.0 loaded each dump once into its own session, explicitly
using symbol server `http://127.0.0.1:9`. No raw-profile parser or external-symbol
fallback was used. All13commands per session succeeded. Daemons3132415/3132822
and their exact named sockets were absent after stop and again in final verification.
All8marks per run join content PID1835228/1838208 respectively, fixture document
10737418242 and one page-to-CLI offset. Raw root starts11560.076882/11357.985316ms
are retained; CLI-normalized times are not compared directly with raw clocks.

Final focused suite:41test groups pass, including inherited capture/gzip/export
failure paths, both real saved captures, malformed identity/clock/query/coverage
cases, original strict failure retention, command receipts and graphics rejection.
The new scope adapter has a retained3-failure RED followed by GREEN. The ordinary
profile analyzer's real mismatch remains a separate failed gate, not a passing test
claim. Native source66, staged index, mozconfig and all173harness inputs still match.

## Next Work

Do not disable browser scrollbar animations, alter refresh cadence, remove startup
from acceptance or present hidden-overflow test CSS as a product fix. The controlled
fixture explains a specific confound worth separating from GPU copy cost.

Continue with the independent compositor/backpressure event and actual reuse-path
frequency/recovery gates, keeping the original failed screens. A future scheduling
optimization needs causal native observations plus matching-Firefox semantics,
not this scope count alone. No product source/defaults, build, daily installation,
desktop browser/profile/launcher, Pi, agent, commit or staging changed here.
The full rendering/layout/CSS/JS/hardware objective remains active.

Evidence namespace: `artifacts/umbralink-control/scrollbar-profile/`. Generated
runtime and executed CLI exporter bytes are retained as run. The report, namespace
and sealer are included in `scrollbar-profile-final.sha256`; earlier seals and
failed evidence are unchanged. Do not rerun exclusive-output entrypoints into it.
