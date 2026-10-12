# Startup Variability: Saved Evidence

## Result

The four completed preparation-only A/B/B/A captures do not isolate a cause of
the startup drop burst. This offline audit finds no simple separator in graphics
configuration, sampled buffer availability, menu geometry, whole-process CPU or
sampled process population. It does find a useful observation-order distinction:
the rough run's painted counter was already behind its presented counter before
the cumulative dropped counter increased. The counter-update interval is not the
actual drop interval.

No browser, profiler, remote host, package, driver, product source, preference,
public interface or staged file changed in this wave. No performance fix or
reproduction of the owner's prolonged post-seek stutter/black flash is claimed.
The owner means seeking with the video progress bar, not searching YouTube.

## Inputs And Method

Inputs are the four sealed exports in
`artifacts/umbralink-control/startup-precondition/`, described in
[the preparation report](2026-10-07-startup-precondition.md). All78 sealed files
and48 recorded runtime inputs are rehashed; all four original saved-data reviews
reproduce exactly. New analysis is in
`artifacts/umbralink-control/startup-variability/`; original evidence is unchanged.

The same private laptop hardware-AV1 path and Build20261006175655 were used in
the captures. Each observed20seconds of playback, without seeking. A is the
inactive-state control; B started and stopped the profiler before playback.
Both parent and selected-content profiler state were inactive at the observed
playback boundaries. Other child state and all between-observation state remain
unknown. Fixed order, ordinary host/site/cache variation and setup time are not
separated from the preparation effect.

The analyzer joins CPU by exact PID/type/origin populations rather than summing
unmatched process-type totals. It validates raw nanoseconds against the producer's
rounded-millisecond fields, then subtracts raw values. Resource history checks
retain each observed PID's start/parent/group/session identity. Sparse identity
observations are not continuous process-lifetime proof.

## Findings

| Run | Drops | Minimum sampled buffer ahead, s | Browser CPU, ms | Video-content CPU, ms | RDD CPU, ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| A1 | 25 | 12.467 | 8722.989 | 4717.747 | 1540.588 |
| B1 | 2 | 13.233 | 8836.168 | 4696.362 | 1400.693 |
| B2 | 0 | 11.933 | 8595.814 | 4483.389 | 1357.257 |
| A2 | 1 | 15.000 | 8376.438 | 4291.200 | 1355.205 |

CPU brackets are approximately20.033-20.047seconds, slightly wider than playback
because they include the surrounding RPC work. Browser CPU is0.418-0.441of one
core across the bracket, not a main-thread utilization figure. It includes
Renderer, Compositor and other parent-process threads. These totals do not
reveal short stalls, time spent waiting, GPU work or simultaneous contention.
The roughest run does not have the largest parent CPU total. The smaller RDD
total in later runs is descriptive, not an isolated driver-warmup result.

All84 video samples report readyState4 and networkState2, with buffer coverage
at their sampled currentTime. No media events were recorded in these intervals.
In A1, buffer ahead is22.429seconds at the5.002-second sample and21.450seconds
at6.003seconds. This weakens simple download starvation at those observations;
it does not prove uninterrupted network service, zero request delays or zero
decoder starvation between samples.

A1's counters around the burst:

| Observation, ms | Decoded | Presented | Painted | Dropped |
| --- | ---: | ---: | ---: | ---: |
| 5002 | 305 | 300 | 285 | 0 |
| 6003 | 365 | 335 | 335 | 25 |

These are sequential cumulative reads, not atomic frame records. The15-count
difference is not a measured queue length or15-frame scanout delay. The
[painted getter](https://searchfox.org/firefox-main/rev/cfd140a311d8523d3d35e00ee1a9f2403c033dfd/dom/media/mediaelement/HTMLVideoElement.cpp#395)
uses image-container paint counts on the ordinary path, while the presented
getter uses decoder frame statistics. The existing
[drop-producer audit](2026-10-07-startup-drop-audit.md) traces asynchronous
compositor-to-content reporting. This supports caution about timestamps, not
an assertion that the GPU caused the burst. Final native A1 drops are all
compositor-counted; A2's single drop is sink-counted and is not the same observed
category. B1 has two compositor-counted drops; B2 has none.

All graphics feature/adapter/info projections compare exactly, including
WebRender, Intel Iris Xe, one2560x1600@60Hz display and the same compositor
feature statuses. These are setup snapshots, not continuous backend tracking.
The before/after native receipts agree on AV1/1920x1080/hardware=true. The
before receipt says shutdown with retained metadata; it does not prove active
decoding before playback.

All four settings observations have viewport1280x955. A1/B1/B2 have the same
settings-button rectangle(left736,top515,width48,height40), despite drops25/2/0.
A2 has(left768,top533,width48,height40). This is not a full player/canvas/layout
inventory, and the equal rectangle does not prove equal paint cost. Time from
first settings observation to playback is1216/965/981/917ms. Page playback-start
ages are11810/11542/11562/11440ms, so the rough A1 is not simply the youngest
page. Neither setup duration nor layout is experimentally controlled here.

Each performance endpoint lists the same13process identities within its own
run. Resource samples after the second sample show no births or exits; this
does not exclude short-lived processes between samples. Nine passive resource
reads per run span approximately31-120ms. They use the controller's
`performance.now()`; browser snapshots use parent `ChromeUtils.now()` and
playback samples use the page clock. There is no saved controller-to-page clock
mapping. No sampler/drop overlap or sampler causation is inferred by subtracting
these incompatible values. A resource read span is not browser blocking time.

## Source And Verification

`recompute.mjs` verifies four relevant producer files against frozen base
892431809a4caadb5c73b2c03ad9bdb124c3e21e and checks they are untouched by the
deployed package patch(d1bf3bdfe9f7d36c82181db0b4487592d5b8857b070e43c1b2ee6aaea9cd1677):
HTMLVideoElement.cpp, FrameStatistics.h, ChromeUtils.webidl and
UmbrafoxControlDiagnostics.sys.mjs. File paths, hashes and byte counts are in
results.json. This is package-source correspondence, not new loaded-module
attestation. The current checkout alone is not deployed-code authority.

Searchfox discovered the native getters and CPU contract; its installed0.18.0
CLI advertises0.20.5. No update was installed. A first local proof command used
the obsolete dom/html path and failed; the corrected discovered path is
dom/media/mediaelement. No source-absence conclusion followed from that error.

Tests cover exact-unit subtraction, clock/identity/population corruption,
counter regression, invalid and disjoint buffer ranges, preservation of unknown
event time, validly rehashed export corruption and all four original exports.
The full recomputation verifies source/evidence seals and deep-equals its saved
output. Missing-module RED is scaffolding evidence, not a reproduced browser
bug. The first recompute command had a JavaScript parenthesis syntax error;
its failed log is retained and its import is covered by the final test suite.
Final focused gate:8tests PASS. Combined with the14 unchanged preparation and
capture tests:22PASS, no failures or skips, approximately0.50seconds. All three
new JavaScript files pass formatting; named report lint has zero problems.
No native/browser test was run because no runtime implementation changed.

## Next Decision

Do not ship profiler activation as a workaround or call this an interception,
network, decoder or GPU fix. Do not align the controller sampler with the
video using uncalibrated clocks. The smooth untreated final control remains a
counterexample to profiler preparation being necessary for smooth playback.

The next useful diagnostic needs event-local evidence without an active
profiler: an explicitly bounded clock bracket and selected-thread CPU/scheduling
observations could test whether a parent/content burst accompanies the early
paint-progress gap. Such an observer needs its own cost/control and identity
checks; its source/contract review precedes any new launch. CPU-only sampling
cannot distinguish driver waiting from other waiting, so a null result must
remain inconclusive, not trigger another unchanged capture loop.

For the owner's separate seek symptom, the already completed actual-UI forward
and backward tests remain unreproduced. Match the affected stream/codec and
single-jump versus repeated-scrubbing pattern before expanding that campaign.
Desktop interaction, system-driver installation, forced-codec preferences and
disabling extensions are not implicitly authorized by this offline result.
