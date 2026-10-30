# Seek Transition: Media Clock Plateaus

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

The short laptop capture retained all four private seek boundary markers. It
strengthens the clock/timestamp-selection lead from the previous investigation,
but does not establish an audio-backend defect or deliver an engine fix.

In the first second after the private `after-seek` anchor:

- 61 of 103 wholly contained adjacent media-clock observations had no clock
  advance. Eleven advances were 42.666-42.667ms. No backward steps occurred.
- Absolute same-frame timestamp revision was median8.57ms, P95 33.90ms,
  maximum34.22ms. These are existing native jitter markers, not GPU durations.
- 24 explicit compositor drop events counted31 frames. All24 passed the strict
  contiguous-ID queue check; the skipped frames were already queued before the
  preceding composition. In23 cases that composition repeated its old frame.
- The44 contained Renderer Composite intervals had median0.894ms, P95 1.473ms,
  maximum2.206ms. They are CLI-derived wall intervals, not certified raw pairs.

The plateaus largely disappear in the next four seconds:5 of406 clock intervals
are flat, with no42.666-42.667ms steps. In the final approximately five seconds,
0 of381 are flat. This is a time-localized observation within one profiled run,
not proof that unprofiled playback follows the same distribution.

At the observed48kHz endpoint rate,42.667ms is consistent with2048 audio frames.
That arithmetic does not identify a backend buffer, clock source or cause.
The native clock source, paired system timestamp, query latency and callback
readiness remain unobserved during the transition. Do not change frame-selection
bias or remove synchronization on this evidence alone.

## Scope And Workload

Wyatt authorized quiet-laptop UmbraLink work. The daily desktop browser, personal
profiles, Pi, product defaults and native source were untouched. No build or
installation occurred. The laptop still uses Build20261006175655, not the
October12 opt-in beta. Package source remains base
`892431809a4caadb5c73b2c03ad9bdb124c3e21e` plus patch
`d1bf3bdfe9f7d36c82181db0b4487592d5b8857b070e43c1b2ee6aaea9cd1677`;
source manifest
`a9befff9082463b5c643889c0e755e5f88a09d674d6aff00b3ad05d89cf1935c`.

Same signed-out public YouTube `aqz-KE-bpKQ`, ordinary1080p60 AV1 selection,
volume0.05/unmuted,20s initial playback, actual progress-bar seek to45s, at least
130s after `seeked`, original state restored. The existing240s total/225s work/
15s cleanup and sampled256MiB artifact limits were not relaxed. Four native
audio endpoint reads remain outside the timed workload.

Only the profiler schedule changes. Start immediately before the UI seek; retain
begin/before-seek/after-seek/end private parent RPCs in both modes. After sparse-0,
wait at least10s using an abortable monotonic deadline, then collect and stop.
Reject a capture slot more than5s late. Later sparse checkpoints and the remainder
of playback run with profiler inactive. This avoids assuming that Pause alone
preserves the desired window indefinitely.

ON requests1Mi entries/5ms, `nostacksampling` and `nomarkerstacks`, with unchanged
thread filters. No new browser API, web global, page marker or MOZ_LOG. Export
remains capped32MiB compressed and native-identity/path validated. Collection
occurs during playback after the interval of interest; it can perturb subsequent
playback. Matching OFF RPC cadence cannot reproduce ON serialization cost.

## Runtime Results

One OFF and one ON cell ran, without a browser retry.

| Mode | Initial20s | Recovery1 | Recovery2 | Recovery3 |
| --- | --- | --- | --- | --- |
| OFF | 28/1201 | 240/2677 (8.97%) | 172/2699 (6.37%) | 189/2499 (7.56%) |
| ON | 4/1200 | 656/2676 (24.51%) | 871/2699 (32.27%) | 703/2505 (28.06%) |

Cells are dropped/total frames. Recovery segments are approximately45s/45s/41.7s,
not the shorter profile interval. OFF also reproduces sustained stutter. ON is
substantially worse, including windows after profiling stopped. These two runs
cannot separate observer effects, export effects, run variability or lasting
playback state; the difference is not a measured causal profiler penalty.

Remote roots under `/home/wyatt/.cache/codex/`:

- `laptop-seek-transition-off-20261013-Ls7jm5`,21:35:06-21:37:57UTC.
- `laptop-seek-transition-markers-20261013-JxHH95`,21:39:00-21:41:52UTC.

Both passed workload/admission/resource/restore checks and clean owned SIGTERM
cleanup. All14 recorded PIDs per cell were absent at export. Each has37 resource
records. Peak sampled RSS:2591940608/2681270272B; artifacts:168967943/181565206B.
Log bytes322/401, drops0. The usual sandbox EPERM and VA-API messages remain.
ON additionally logs `VideoBridgeParent receives IPC close with reason=AbnormalShutdown`.
It has no timestamp; no seek/crash/shutdown-stage attribution is established.
Five-second sampling does not rule out every transient helper or resource peak.

## Clock And Coverage

Gzip5927039B, SHA256
`cb66d81a1895c8f68aac7e699b75eef530d8fdc5a31b51a82ed08862b6d3bce1`.
Remote/local bytes and hash agree. Analysis used supported profiler-cli0.11.0
exports only, never a custom raw-profile parser.

Raw root range: `[36513.455811,47403.544830]`ms. CLI timestamps are normalized;
the analysis adds36513.455811ms before checking native receipt brackets.

| Private marker | Raw time ms |
| --- | ---: |
| begin | 36521.542564 |
| before-seek | 36527.532432 |
| after-seek | 37331.107741 |
| end | 47386.832407 |

All four join parentPID3476678/context11/document10737418243 exactly. Media
thread PID3476840 matches the saved content/audio receipt. Chrome innerWindowID2
is not treated as the video document ID. The private brackets cover an803.575ms
UI operation and10055.725ms after it; they are not exact child `seeking`/`seeked`
event timestamps. Only5.990ms precedes the before-seek anchor, so there is no
meaningful profiled smooth-playback baseline in this capture.

All43 threads are listed without limit omission; every exported marker count
equals its returned array length. Coverage includes615 Renderer Composites,
652 composition updates,929 queue submissions,926 timestamp-jitter observations
and928 media-render clock observations. The relevant streams begin before the
seek and continue near the end anchor. Native buffer generation changed0->1;
configuration capacity1048576, buffer entries16777216 and CLI capacity8388608B
are retained as distinct fields. Surviving anchors are not a universal no-loss
proof for every marker population.

## Localized Observations

| Window after after-seek anchor | Clock intervals/flat | Absolute jitter median/P95 ms | Explicit drop events/frames | Renderer median/P95/max ms |
| --- | --- | --- | --- | --- |
| 0-1s | 103/61 | 8.57/33.90 | 24/31 | 0.894/1.473/2.206 |
| 1-5s | 406/5 | 0.22/1.23 | 7/8 | 0.813/1.797/20.761 |
| 5s-end | 381/0 | 0.13/0.48 | 5/7 | 0.942/1.576/3.129 |

Four adjacent-clock intervals cross a phase boundary and are excluded from the
contained statistics. The normal seek itself advances media clock21173.899ms
across384.013ms of marker time; this expected discontinuity is retained in the
seek bracket, not called an audio-clock fault. Quantiles use nearest-rank P95/P99
and averaged central values for the median.

Across36 explicit drop events/46 frames,35 events/44 frames admit strict joins.
Of these,34 were already queued,1 was not;30 preceding compositions repeated.
One2-frame event stays UNKNOWN because IDs1782->1786 leave a3-ID gap. The prior
all-queued result is not generalized to this capture. Queue ranges are usable
only with same-producer and count==last-first+1 evidence. Queued is not equivalent
to texture-ready or physically presented. Individual joins and the unknown row
are retained, with no invented missing-frame mapping.

One Renderer interval reaches20.761ms in1-5s. The report does not exclude rendering
outliers or GPU waits. It establishes that the severe first-second disturbance
coincides with clock plateaus/timestamp revisions despite short observed
Composite intervals. No exact jitter-to-frame-to-clock causal join exists yet.

## Source And Next Falsifier

The previous sealed `source-proof.json` pins AudioSinkWrapper, AudioSink,
AudioStream, VideoSink and ImageComposite to this package, not the current dirty
checkout. VideoSink remaps submitted frame times from paired media/system clocks;
ImageComposite detects timestamp changes for the same frame and chooses frames
using those timestamps. AudioSinkWrapper selects audio/system/paused/seek-hold
paths and captures its system timestamp before querying position. Linux
AudioStream takes its monitor and queries cubeb. Existing seek-reuse/unmute
handoff logic is already present, not a new change in this wave.

The existing AudioStream TRACE statements use the separate real-time tracer,
not the captured profiler channel. No such logger was enabled. Existing endpoint
diagnostics cannot determine the transition's continuously selected source.

The smallest useful next native observation should record, in a short owner-only
profiler interval, the already-selected clock branch and existing media/system
clock pair, begin/end of the existing audio-position query, callback-started and
seek-hold/handoff state. It must not call GetPosition a second time, change the
chosen timestamp, smooth/bias the clock, add public JS fields, allocate per call
while disabled, or enable general logging. Establish an existing stable stream/
generation identity before joining it to producer/frame submission; do not use
raw pointers or guess a document relationship. Include disabled-path checks,
seek/reuse/mute/device/error transitions, bounded records and observer controls.
This is a follow-up design target, not an implemented or runtime-approved patch.

## Verification And Evidence

130 focused/integration/adjacent strict-unhandled Node tests pass. Schedule tests
failed behaviorally against the old start-at-playback schedule (4PASS/2FAIL).
Additional offline modules first failed as missing scaffolds; do not present
those as behavioral REDs. They now cover normalized origins, crossing intervals,
malformed clocks, noncontiguous-ID unknowns and strict identity/order failures.
Both saved runtime reviews and final analysis reproduce exactly. Fourteen manual
files pass scoped installed ESLint; generated legacy code is not newly certified.
No native test suite/build or Sphinx build was run for this private-tooling report.

The first offline load succeeded but the wrapper tried to parse `load --json`'s
text preamble as JSON. Its finally stopped the owned session successfully; the
stop text caused another parser error. Both failures remain. Socket absence and
no exact matching daemon/samply command were checked; historic PIDs were not
retained, so this attempt has weaker cleanup provenance. Corrected handling keeps
load/stop stdout opaque and still requires JSON for queries. No browser retry.

Second offline session exported all requested rows and stopped in finally.
Daemon1813271/samply1813282 and its named socket were confirmed absent. Local
samply served the named file, symbolication was disabled, no upload was requested.
The two session directories are `/tmp/codex/seektransition-L4X4kx` and
`/tmp/codex/seektransition-zfnqgg`. Executed wrapper versions and all failures
are preserved separately from the final style-clean wrapper.

Remote harness `seek-transition-harness-IQYZwm` has74 verified inputs; manifest
`2490e695b5801c733061df574878f31a8f6ee2dd8c2ad2758f83afd983e1d8f5`.
Final laptop postflight21:42:35UTC found all hashes unchanged and no matching
browser/compiler processes. Prior seek-markers seal independently still passes.
All required runtime/tool commands have exited.

Local evidence: `artifacts/umbralink-control/seek-transition/`, including both
exports/reviews, gzip, `cli-2/`, `analysis-results.json`, `drop-joins.json`,
`clock-steps.json`, generation/transfer receipts and test/lint/failure logs.
The namespace is owner-private; raw profiles/exports are not Git publications.
`SHA256SUMS` and `seal.json` record the final inventory separately from this report.
The verified seal contains113 files/11861284B; manifest SHA256
`8796fb596237895bb86ececd4d1c0a480ff9dd76522a3ea21a4809437de55fc7`.

Reproduce from a copy of the sealed namespace with Node24:

```sh
timeout 30 node --test --unhandled-rejections=strict artifacts/umbralink-control/seek-transition/test/*-spec.mjs artifacts/umbralink-control/seek-markers/test/*-spec.mjs artifacts/umbralink-control/audio-on-seek/test/*-spec.mjs artifacts/umbralink-control/audio-clock-admission/test/*-spec.mjs
timeout 10 node artifacts/umbralink-control/seek-transition/recompute.mjs
```

Recompute writes derived files; never run it in the sealed original. Do not
relaunch either browser driver or CLI loader merely to reproduce saved analysis.
