# Small Moving Canvas Backend

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

Two fresh baseline laptop runs passed. Both the default canvas and explicit
willReadFrequently canvas used a nonaccelerated shared Skia provider at the
first and last timed draws. This is positive native backend evidence, not an
inference from missing profiler markers. Hardware video decoding and WebRender
were available, but that does not imply this individual canvas was accelerated.

| Same baseline package | Default context | Explicit readback context |
| --- | ---: | ---: |
| Timed draws / callbacks | 120 | 120 |
| Total draw wall time, ms | 330 | 326 |
| Median / P95, ms | 3 / 4 | 3 / 4 |
| First draw, ms | 21 | 24 |
| Active collector interval, ms | 4846 | 4896 |
| Video frame / dropped-frame delta | 144 / 0 | 145 / 0 |
| Native backend snapshots | false / false | false / false |

The page's native coarse clock remains unchanged. These are two fixed-order,
short, same-package observations, not a statistically established equivalence,
whole-browser speedup, physical presentation result or YouTube diagnosis. No
candidate browser was needed after this route finding. The readback candidate
remains uninstalled; no engine, launcher, daily-browser or preference changes.

## Source Explanation And Next Gate

The110x75 canvas has8250pixels. Frozen base
892431809a4caadb5c73b2c03ad9bdb124c3e21e defines the default
gfx.canvas.accelerated.min-size as128, giving a16384pixel area cutoff.
DrawTargetWebgl::CanCreate rejects smaller areas; on Linux,
PersistentBufferProviderAccelerated::Create returns null on that rejection.
The provider/CanCreate/WebIDL/enum files are unchanged in both frozen package
patches. Their StaticPrefList changes only add the unrelated OFF opacity gate.
Exact patch hashes and source-file hashes are in size-source.json.

Discovery permalinks: [CanCreate](https://searchfox.org/firefox-main/rev/00a4d527cdb9807ecb561c9fcf7d211e7e568ddf/dom/canvas/DrawTargetWebgl.cpp#1028-1059),
[provider factory](https://searchfox.org/firefox-main/rev/00a4d527cdb9807ecb561c9fcf7d211e7e568ddf/gfx/layers/PersistentBufferProvider.cpp#119),
[default preference](https://searchfox.org/firefox-main/rev/00a4d527cdb9807ecb561c9fcf7d211e7e568ddf/modules/libpref/init/StaticPrefList.yaml#7399).
The frozen base plus patches, not moving upstream or the current object directory,
is authoritative for the tested package.

The runtime preference value was not queried. The source cutoff is a concrete,
consistent admission explanation, not complete runtime failure attribution.
Saved graphics diagnostics report ACCELERATED_CANVAS2D available, with no listed
canvas feature failure. Do not lower the cutoff, force GPU defaults, assume
all normal canvases are software, or alter page willReadFrequently semantics.

Next use a prospective320x180 fixture above the unchanged cutoff, record the
actual min/max preferences through the already-existing browser-realm request,
and retain native provider snapshots. Compare default and explicit-readback
paths before another native optimization. Preserve these completed small-canvas
captures and harness unchanged; use new siblings. The earlier exact paused-pixel
comparisons and cache repeat-copy improvement remain separate evidence.

## Observation Design

The new artifact-only collector has one drawImage per callback, an eight-second
watchdog and a fixed120callback cap. It attaches its own small canvas in the
owned local video document. Unlike the earlier stress fixture, it never calls
getImageData or hashes pixels during playback. After the timed interval it
pauses the video and reads33000bytes once, confirming nonblank output. The
32-bit checksum is a bounded sanity receipt, not an exact cross-run image oracle.

Two owned-fixture events immediately after timed first/last draws let a temporary
privileged frame-script listener call existing getDebugInfo(false). False is
important: true could create a target and perturb the state. Canvas target
release at stable state makes an ordinary later RPC insufficient. The listener
checks document/element identity, caps events and removes itself in finally;
missing targets are explicitly unknown, never forced or guessed.

The child invokes the existing executeControlScript helper with realm:page,
preserving its normal page-principal sandbox for workload code. Both packages'
actual packaged helper hashes match current inspected source:
7f6c3b468f688f84c940d8921ceec31daecc4062763f134a49a5344b704d1289.
Native getDebugInfo is system-principal/about-fingerprinting gated, not merely
ChromeOnly. Both real page receipts confirm the method is absent from ordinary
page context. No browser API/global/prototype was added or patched. This is
owned-fixture instrumentation, not universal public-interface parity proof.

Eight serialized control requests retain existing before/after decoder,
process-window and profiler/userland guards. Raw replies are saved before
validation. Backend fields are isAccelerated:false,isShared:true,backendType:2
(Skia),drawTargetType:0 in all four native observations. Provider state is not a
per-draw GPU/CPU transfer trace; no profiler was started.

## Runtime And Verification

Baseline Build20261001103920, same sealed October1 package, two fresh copied
installations. Intel Iris Xe RPL-P/Mesa25.2.8, X11/KWin,2560x1600@60,DPR1,
WebRender. After-receipts report hardware-accelerated ffmpeg RDD H.264; initial
paused decoder receipts say shutdown. No continuous decoder/scanout proof.

| Capture | Default | Readback |
| --- | ---: | ---: |
| Controller PID | 1199171 | 1201484 |
| Browser PID | 1199666 | 1201957 |
| Capture seconds | 16.610 | 16.859 |
| Resource samples including baseline | 7 | 7 |
| Peak sampled artifact bytes | 153760234 | 187271759 |
| Pre-work headroom bytes | 114741304 | 81229827 |

All24 recorded browser/controller PIDs absent again after both runs. Clean owned
SIGTERM,271log bytes and0drops per run;47regular-file package postchecks pass.
Fresh native app-data/local-app-data/temp receipts match each owned run. Limits
remain120s total/105s work/15s cleanup/final2s,10s quiet,256MiB artifacts,
64MiB pre-work headroom. No cap relaxation, automatic retry or unrelated process
action. Private directories were not exported; no network-sandbox claim.

Tests: initial new-module missing-import RED is harness readiness only. A later
behavioral RED caught a callback-cancellation exception bypassing pause/cleanup;
cleanup now attempts every step and retains the primary failure. A fake snapshot
schema error was corrected in tests, without loosening the production validator.
Final29 focused tests pass, including collector ordering, timeouts, native event
identity, exact emitted parent/child scripts, import failure, missing/duplicate
replies and raw evidence before rejection. Six-file format check passes. Saved
recompute validates both complete receipts, native roots, resource caps and
artifact hashes, and reproduces the saved summaries. No new native build or
whole-repository test was run.

## Evidence

Local: artifacts/umbralink-control/canvas-route/;71 exported capture files,
293455bytes, plus harness/tests/source evidence. Remote harness
/home/wyatt/.cache/codex/canvas-route-harness-20261006-CZzUl2:
39files/23302666bytes verified before and after. Captures:

- /home/wyatt/.cache/codex/laptop-canvas-route-baseline-default-20261006-roWTRL
- /home/wyatt/.cache/codex/laptop-canvas-route-baseline-readback-20261006-uGsEK2

UTC starts01:55:11 and01:56:36 on October6, still October5 in Phoenix.
No active browser/controller/profiler/test session remains. Staged source is
unchanged. The broad rendering/layout/CSS/JavaScript performance goal remains
active; this finding changes the next experiment, not product release status.
