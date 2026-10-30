# Audio-on Seek: Marker Localization

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

The retained late-playback profile points toward frame timestamp mapping and
selection, not simply expensive rendering. This is a localization result, not
an engine fix or a proven audio-backend defect.

- All 448 explicit compositor drop events skipped one frame that was already in
  the preceding composition's queue, subject to the contiguous-ID check below.
- In 439 of those cases, the preceding composition repeated its previous frame.
- The native same-frame timestamp-jitter marker recorded absolute changes up to
  18.20ms; P95 was 11.42ms. That is material beside a 16.67ms 60fps frame period.
- Renderer Composite intervals were comparatively short: median 1.110ms,
  P95 1.592ms, maximum 2.670ms. These are CLI-derived wall intervals, not GPU
  timings or certified raw split-marker pairs.
- The rolling profile lost the beginning and seek-transition markers. Findings
  apply to approximately the final 83-86 seconds, not the onset of the problem.

The quiet-laptop OFF control was smoother than the profiled run. A single pair
cannot separate profiler cost from ordinary run-to-run variability. Do not
claim that the measured drop rate is representative of unprofiled playback.
The previous unprofiled audio-on seek reproduction remains separate evidence.

## Scope And Inputs

Wyatt authorized proceeding on wyatt-laptop with UmbraLink. Desktop browser,
personal profiles, Pi, system drivers, product defaults and public interfaces
were untouched. No Gecko source change, build, installation or performance fix
was made in this wave. All additions are private diagnostic tooling and reports.

The laptop used verified Build20261006175655, not the October12 beta. Source
authority is base `892431809a4caadb5c73b2c03ad9bdb124c3e21e` plus package patch
`d1bf3bdfe9f7d36c82181db0b4487592d5b8857b070e43c1b2ee6aaea9cd1677`.
The package source manifest is
`a9befff9082463b5c643889c0e755e5f88a09d674d6aff00b3ad05d89cf1935c`.

The unchanged workload is signed-out YouTube `aqz-KE-bpKQ`, ordinary menu-selected
1080p60 AV1, audio unmuted at volume0.05, an actual progress-bar click to45s, and
at least130s observation after `seeked`. Original volume/pause state is restored.
Private app-data/local-app-data/temp/profile roots have native post-startup
receipts; these are not a general network sandbox or preconsumer-access proof.
The same240s total/225s work/15s cleanup and sampled256MiB artifact limit apply.

Both modes make four private browser-realm boundary RPCs: begin, before-seek,
after-seek and end. ON requests1Mi profiler entries at5ms with `nostacksampling`
and `nomarkerstacks`; filters cover GeckoMain, Compositor, Renderer, media, Audio
and IPC. No JS/public globals, page UserTiming, new browser API, MOZ_LOG or
stack-sampling feature is introduced. Existing four native audio endpoint reads
remain outside the timed playback interval.

## Runs

Each row is one fresh isolated installation/profile. There was no outcome-driven
retry. The third run was a deliberate recovery after diagnosing and testing a
capture-adapter export defect.

| Run | Initial20s drops/frames | Recovery1 | Recovery2 | Recovery3 | Outcome |
| --- | --- | --- | --- | --- | --- |
| OFF `eAfPT6` | 28/1200 | 41/2677 (1.53%) | 9/2700 (0.33%) | 47/2497 (1.88%) | Completed |
| ON v1 `lJaXtX` | 4/1201 | 222/2679 (8.29%) | 291/2700 (10.78%) | 333/2497 (13.34%) | Export failed |
| ON v2 `45ODrT` | 4/1200 | 142/2677 (5.30%) | 266/2699 (9.86%) | 197/2498 (7.89%) | Profile captured |

Recovery segments last about45s,45s and41.6s. Counters have their own segment
boundaries; do not equate their totals with the shorter retained profile.
OFF sought22.751458s->45s; ON v2 sought22.783437s->45s.

Remote roots, all under `/home/wyatt/.cache/codex/`:

- `laptop-seek-markers-off-20261013-eAfPT6`
- `laptop-seek-markers-markers-20261013-lJaXtX`
- `laptop-seek-markers-markers-20261013-45ODrT`

All three closed the playback session, restored state, stopped profiling and
terminated the owned browser cleanly with SIGTERM; all14 recorded browser/
controller/process PIDs per run were absent at export. Browser log drops were0.
Resource records:37/36/37. Peak sampled RSS:2621034496/2590920704/2681860096B.
Peak sampled artifacts:161174708/181047655/173672316B. Sampling does not exclude
every transient helper or establish final directory size.

The initial native gzip adapter expected an ArrayBuffer. The pinned producer
returns an object with `profile` and `additionalInformation`. Playback had
finished before this error; the named profile file was absent. The old generic
controller discarded the native error text, so the exact original exception is
unavailable. Source inspection and a failing native-envelope regression establish
the adapter mismatch, not a recovered original stack trace. The bounded private
adapter now extracts `.profile` and preserves bounded script-failure text.
Original code/manifest remain in `v1-adapter.tar`; the failed run was not rewritten.
`markerProfile.completed` after cleanup alone is not successful-export evidence.

## Profile And Clock Admission

The v2 gzip is19651450B, mode0600, SHA256
`3ad5cb83c6ec8e530e415a6b8e2c3890b12545a84c3519b017b9d67d9eadf6fc`.
It was copied once to the local evidence namespace and hash-verified. Analysis
uses supported profiler-cli0.11.0 exports, not a custom raw-profile parser.

Nominal raw root range is `[15569.433104,170664.562071]`ms. CLI marker starts are
normalized: add15569.433104ms before comparing with the raw profiler receipts.
The sole surviving `UmbraSeek:end` marker converts to170654.025256ms, inside its
native bracket `[170653.976004,170654.028467]`. PID3402846, context11 and document
10737418243 match the private payload and saved run. Content PID3403018 matches
the saved audio receipt and media thread. Chrome innerWindowID2 is not the video
document ID and is not used as that join.

Begin/before-seek/after-seek are absent from the retained marker export. Renderer
coverage begins69438.153015ms after profile origin; media-render coverage starts
72037.942079ms after origin. Nominal root bounds are not retention guarantees.
Native configuration reports requested capacity1048576; GetBufferInfo reports
entries16777216 and generation changes. CLI metadata reports8388608 capacity
bytes. Those different fields do not override the observed missing markers.

The CLI inventory exposes57 threads across12 processes with0 hidden by the list
limit. All marker exports have returned length equal to totalCount. Broad text
searches also match long frame-script data URLs; the `AudioClock` search returned
only80 callback rows, not actual audio-clock markers. Analysis selects exact
native marker names and validates process/thread identity, never substring hits.

## Retained Interval

| Observation | Count | Median ms | P95 ms | P99 ms | Maximum ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| Renderer `Composite #1`, CLI-derived | 4716 | 1.1101 | 1.5920 | 1.9072 | 2.6695 |
| `CompositeToTarget`, CLI-derived | 5192 | 0.08553 | 0.12858 | 0.17404 | 1.73622 |
| Frame-selection update spacing | 5191 | 17.04869 | 17.17722 | 17.25182 | 17.45120 |
| Absolute same-frame timestamp revision | 6091 | 0.06 | 11.42 | 13.96 | 18.20 |
| Absolute media-clock/marker-spacing residual | 5918 | 0.04685 | 11.49586 | 13.96780 | 15.75157 |

Quantiles use nearest-rank P95/P99 and the average of the two central values for
an even-sized median. The last row is delta(clockTimeUs)/1000 minus delta(marker
start), not direct audio-device timing or the native paired system timestamp.
There is no per-frame causal join between that residual and timestamp jitter.

All5192 frame-selection rows use producer7;503 say unchanged. For each of448 drop
events, analysis requires an immediately preceding UpdateCompositedFrame within1ms,
the exact same producer/current/previous frame IDs, increasing composition IDs,
and agreement between the frame-ID gap and reported drop count. It then inspects
the latest SetImages before the preceding composition. A queue range is used
only when count equals lastID-firstID+1; missing or noncontiguous evidence remains
unknown. All448 pass that check;439 preceding updates say unchanged. This is
queue-membership evidence under that range check, not texture-readiness or
physical-presentation proof. All individual joins are retained in `drop-joins.json`.

1883 jitter observations exceed1.5ms absolute. The jitter marker itself lacks
frame IDs, so no fabricated frame-by-frame jitter/drop join is reported. Existing
CLI exports omit raw split-pair/incomplete provenance; Composite durations do
not establish paired per-frame GPU cost, absence of GPU waits, or physical scanout.

## Source Interpretation

`source-proof.json` independently pins AudioSinkWrapper, AudioSink, AudioStream,
VideoSink and ImageComposite to the package base and confirms the package patch
does not modify them. This is package-source mapping, not an observation of
every runtime branch. Current dirty checkout code is not substituted as authority.

`VideoSink::RenderVideoFrames` maps a media-frame timestamp to a system timestamp
using `aClockTimeStamp + (frameTime-aClockTime)/playbackRate`, including resubmitted
frames. `ImageComposite::DetectTimeStampJitter` compares the old/new timestamp
of the same producer/frame. `ChooseImageIndex` selects according to these times
and the existing bias. `CountSkippedFrames` counts eligible queued frame choices,
not time spent rendering.

`AudioSinkWrapper::GetPosition` captures a system timestamp before choosing its
clock source. With an audio sink it calls PositionFromAudioSink; separate paths
handle paused/seek-init/system-clock operation. AudioSink adds its start time to
the last good AudioStream position. The Linux AudioStream path takes its monitor
and calls cubeb's position query. The already-deployed seek-hold and unmute
handoff logic is present; this report does not blame or certify it.

Unresolved alternatives include audio-position quantization, query latency and
timestamp pairing, source handoff/reanchoring, scheduler effects, and profiler
cost. Endpoints show an advancing sink but do not identify the continuous clock
source. No evidence justifies changing bias constants, removing synchronization,
rewriting renderer threading or blaming network interception yet.

## Verification And Cleanup

109 focused/integration/adjacent tests pass with strict unhandled rejections on
Node24.21.0. Retained failing-first coverage includes native `capacity` mapping,
compressed-profile envelope, and offline bounds/drop-count admission (3PASS/2FAIL
before the latter fix). Initial missing-module failures are scaffold evidence,
not behavioral regressions. Ten authored/manual files pass direct installed
ESLint with `--no-ignore`; generated legacy harness code is not represented as
newly style-clean. Registered Mach setup was not retried because it would
recreate cleaned build state. No Firefox native suite or new browser build ran.

Both successful saved reviews reproduce exactly; failure review independently
checks export hashes, playback/restore, caps and cleanup without changing failed
status. Final laptop postflight at18:34:34.939UTC verified all71 files in each
harness and found no matching browser/compiler processes. All required commands
and sessions are terminal.

CLI setup failures are preserved: incompatible load flags, then an overlong
Unix-socket path, both before a daemon was created. Successful private sessions
used the same gzip with local samply, `PROFILER_CLI_NO_SYMBOLICATE=1`, no remote
symbol server, and a short owner-private session directory. Sessionc1 daemon/
samply PIDs1616320/1616334 and sessiond1 PIDs1618167/1618179 were absent after
their stop commands; named sockets were absent. A rejected `--top-n0` summary
request was not retried and supports no CPU-summary claim.

Searchfox CLI0.18.0 advertised0.20.5; no tool update was needed or performed.
Local shell commands explicitly use Node24; inherited old shell PATH is not
evidence that the separately verified host defaults reverted.

## Evidence And Reproduction

Local namespace: `artifacts/umbralink-control/seek-markers/`.
Final seal:134 files,121149058 bytes; `SHA256SUMS` SHA256
`aada49b5de31f470006fd44f404c00cb243bdca5b7239a56698e5574e307ffe8`.
The manifest was independently checked with `sha256sum --check --quiet`.
`seal.json` and the manifest itself are excluded from their own inventory.
Raw profile/CLI exports are local diagnostic evidence, not Git publication.

Key artifacts: off/recovery-export.json, off/recovery-review.json,
markers-export.json, failed-capture-review.json, profile-file-check.json,
recovery-profile-check.json, v1-adapter.tar, cli-c/, cli-d/, analysis-results.json,
drop-joins.json, source-proof.json, postflight.json and completed-tests.log.

Both remote harnesses remain unchanged:
`seek-marker-harness-9Xjh9O` manifest55fb3f9118cad1486d0c8b020dd10c64801c6bc9b0ad0d82b2dbd9127b135147;
`seek-marker-harness-FKmMVN` manifest10d05f95cc717e518d0ec39fa5047d8c5de7858d7b789c4c586bbc6932eb2fd9.

Offline commands, from repository root with Node24:

```sh
timeout 30 node --test --unhandled-rejections=strict artifacts/umbralink-control/seek-markers/test/*-spec.mjs artifacts/umbralink-control/audio-on-seek/test/*-spec.mjs artifacts/umbralink-control/audio-clock-admission/test/*-spec.mjs
timeout 15 node artifacts/umbralink-control/seek-markers/recompute.mjs
timeout 10 node artifacts/umbralink-control/seek-markers/review-failure.mjs
```

Recompute writes derived JSON; use a copy after sealing. `review.mjs` is invoked
through its exported `review()` function, not its inherited obsolete CLI guard.

## Next Falsifier

The next bounded diagnostic should retain the actual seek transition and capture
the media-clock source plus paired system time, clock-query begin/end, and
producer/frame/target timestamp identity. First inventory existing internal
observations; only add a narrowly scoped private marker if the necessary join
is absent. A short transition capture avoids blindly increasing memory to retain
the entire130s interval. Keep an unprofiled control and measure observer cost.

Then distinguish a late/quantized audio position, blocking query, or clock
handoff from downstream selection behavior. Any candidate fix needs a focused
failing test, same-workload unprofiled validation and public-parity checks. Do
not change the daily installation or personal browser to test this hypothesis.
