# Above-Threshold Canvas Backend Transition

## Result

Two fresh baseline-only laptop runs passed. The default320x180 canvas reported
an accelerated recording provider after its first draw and a nonaccelerated
shared Skia provider after draw120. The explicit willReadFrequently control
reported shared Skia at both checkpoints. This establishes a backend change
within the default run, not its exact frame, reason or per-draw GPU work.

| Same baseline package | Default | Explicit readback |
| --- | ---: | ---: |
| Draws / callbacks | 120 | 120 |
| Total draw wall time, ms | 301 | 275 |
| Median / P95, ms | 2 / 4 | 2 / 3 |
| First / maximum draw, ms | 22 / 22 | 26 / 26 |
| Collector interval, ms | 4836 | 4828 |
| Video frame / drop delta | 143 / 0 | 143 / 0 |
| First native provider accelerated | true | false |
| Last native provider accelerated | false | false |

These fixed-order, short observations do not establish a speedup, equivalence,
recurring stutter or physical presentation quality. Zero reported video drops
does not certify smooth canvas presentation. No candidate comparison, new
engine patch, build, installation or desktop-browser action occurred. The
existing readback-cache candidate remains uninstalled.

## Measurement Boundary

The prospective sibling preserves the previous small-canvas experiment and
changes size to320x180. Actual before/after browser receipts in both new runs
report min-size128 and max-size8192, both without user values. Thus the area
57600 exceeds128 squared and both dimensions fit the maximum. Preferences
were only read, not changed. This is actual admission-size evidence, unlike
the previous experiment's source-only preference explanation.

One drawImage runs per video callback; no getImageData or pixel hash occurs
during playback. Two existing privileged getDebugInfo(false) observations run
synchronously after timed draws0/119. Only after both observations and pause
does the page read230400bytes once for nonblank sanity. That final read cannot
explain the earlier last-draw software observation. It is not a cross-run
pixel-equivalence test. No profiler runs, and normal coarse clocks are retained.

The accelerated observation is isAccelerated:true,isShared:false,backendType:3
(recording),drawTargetType:0. Software observations are false,true,2(Skia),0.
Recording-provider admission is not proof every primitive ran on the GPU.
Page receipts still report no public getDebugInfo method; this is the existing
packaged privileged diagnostic, not a new web API or prototype modification.

## Source Leads, Not Causal Attribution

Frozen base892431809a4caadb5c73b2c03ad9bdb124c3e21e plus the two package patches
is authoritative. fallback-source.json saves source hashes, relevant excerpts
and patch sections. Both packages retain the same V2 scaled video-readback
changes in DrawImage; base-only DrawImage would be the wrong deployed map.
The provider refresh chain and DrawTargetWebgl usage rules are unchanged by
those patches; StaticPrefList changes only add the separate OFF opacity gate.

CanvasTranslator::UnlockTexture calls EndFrame, then may send
NotifyRequiresRefresh if DrawTargetWebgl::UsageProfile::RequiresRefresh passes.
Its source defaults evaluate at least10frames, failed-frame ratio0.3 and
cache-miss ratio0.66. These are source defaults, NOT measured runtime values
or counter receipts. EndFrame uses operation counts, not a stopwatch: software
fallbacks and the mix of cache misses/readbacks/layers can fail a profile frame.

The refresh notification travels through CanvasChild and RecordedTextureData
to PersistentBufferProviderAccelerated. CanvasRenderingContext2D's
TryAcceleratedTarget then sets mAllowAcceleration=false for that context.
That path is sticky; it does not by itself explain repeated switches back to
GPU on the same canvas. Resource/context/allocation fallback can also notify
refresh. The saved first/last snapshots cannot distinguish these producers.

Upstream discovery references:
[usage-profile decision](https://searchfox.org/firefox-main/rev/00a4d527cdb9807ecb561c9fcf7d211e7e568ddf/dom/canvas/DrawTargetWebgl.cpp#6594-6605),
[texture unlock](https://searchfox.org/firefox-main/rev/00a4d527cdb9807ecb561c9fcf7d211e7e568ddf/gfx/layers/ipc/CanvasTranslator.cpp#1372-1393).
Frozen local source and patches were independently inspected, not substituted
with current dirty checkout or upstream tip.

Next distinguish the actual refresh reason/transition from first-use shader
work and recurring copy cost, using a prospective bounded observation. Do not
disable the fallback heuristic, force GPU defaults, lower size cutoffs or
change pixel/filtering semantics from these results. An accelerated provider
can still perform costly fallback work; retaining it is not automatically faster.

## Safety And Verification

Baseline Build20261001103920, two fresh copied installations on wyatt-laptop.
Actual native app-data/local-app-data/temp receipts match owned paths. Existing
eight serialized control requests retain document, hardware-decoder, sole HTTP
window, userland-OFF and profiler-OFF checks. All raw replies are preserved.

| Capture | Default | Readback |
| --- | ---: | ---: |
| Controller PID | 1207720 | 1209856 |
| Browser PID | 1208218 | 1210356 |
| Full capture seconds | 16.846 | 16.883 |
| Resource samples including baseline | 7 | 7 |
| Peak sampled artifact bytes | 188326046 | 188322628 |
| Pre-work headroom bytes | 80175913 | 80179362 |

All24 recorded browser/controller PIDs absent again after both runs. Clean
owned SIGTERM,271log bytes and0drops each;47package-file postchecks pass.
Existing120s total/105s work/15s cleanup/final2s,10s quiet,256MiB artifact cap
and64MiB pre-work headroom remain unchanged. Private directories and control
credentials were not exported; no network-sandbox or continuous-isolation claim.

New size/byte/native-element tests failed first:3PASS/5FAIL, then passed. Final
38 focused tests include original cleanup, timeout, emitted child-script,
raw-rejection and media-debug regressions. Preference tests reject ineligible,
missing, malformed and changed receipts without requiring a particular default.
The adapted offline recompute first rejected the added preference field, then
validated it against both raw replies and reproduced saved summaries. Six-file
format check and old106-file seal pass. No native or whole-repository build/test.

## Evidence

artifacts/umbralink-control/canvas-large/:71exported capture files294051bytes,
raw export envelopes, results/recheck, source map, RED/GREEN and final logs.
Remote harness canvas-large-harness-20261006-KP8RZd:42files23329249bytes verified
before/after. Remote capture roots under /home/wyatt/.cache/codex/:

- laptop-canvas-large-baseline-default-20261006-kCocmm
- laptop-canvas-large-baseline-readback-20261006-vnP1m7

October6UTC is still October5Phoenix. No active capture/controller/profiler
remains. Staged diff unchanged; broader performance work remains active.
