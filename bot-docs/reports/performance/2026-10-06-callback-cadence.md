# Video Callback Cadence And Missing Timestamp

## Result

Offline replay of the two existing four-run comparisons identifies a shared
callback cadence and a missing observation. The latest reuse comparison delivers
24.724-24.811 callbacks per second across its sixteen phases; the earlier
descriptor comparison delivers 24.641-24.835. Both play the same 30 fps clip on
a reported 60 Hz display. These are callback rates, not physical presentation
rates or decoder throughput. Both original performance screens remain FAILED.

The pinned Firefox source contains a plausible common scheduling path:
playback-position updates use a 40000-microsecond period, update a watched
position, invalidate the video and schedule video callbacks for a refresh tick.
The roughly 25 Hz observations are consistent with that path. There is no
runtime event join proving this path caused every callback or startup gap.
No scheduling constant, callback semantics, public API or engine code changed.

The existing collector validates but discards the callback's `now` argument.
It also omits `presentationTime` and per-callback `mediaTime`. Its recorded
`expectedDisplayTime` cannot substitute for those fields. A tested diagnostic
collector now retains them, plus optional decoder `processingDuration`, without
adding a timer, callback registration, draw, pixel read or browser RPC. It has
not yet been integrated into the runtime driver or executed in a browser.

## What The Old Data Shows

All 9478 within-phase intervals were recomputed from eight hash-verified public
exports. The original callback arrays and acceptance results were not changed.
The reuse comparison's full existing admission/evaluation is replayed; the older
comparison's exports, document/context identity, bundle and complete per-run
summaries are independently checked without executing its writing CLI.

| Observation | Reuse comparison | Earlier descriptor comparison |
| --- | ---: | ---: |
| Within-phase callback intervals | 4738 | 4740 |
| Callback gaps over 50 ms | 18 | 13 |
| Of those, expected-display gap below 40 ms | 4 | 3 |
| Of those, expected-display gap above 60 ms | 9 | 9 |
| Latest long-gap offset within its phase, ms | 1431 | 7442 |

In the reuse comparison, expected-display lead spans approximately zero to
one refresh period, with small negative values from delivery/clock differences.
The exact identity is `expected gap = callback gap + change in expected lead`.
Thus a 51 ms callback gap may accompany either a 34 ms or a 67 ms expected gap.
Those are not two independent observations of presentation stalls.

Each reuse phase also advances 62-63 more frame IDs than its count of callback
intervals. The producer accumulates selected image-ID differences; these are
not independently observed dropped or physically displayed frames. All original
decoder/compositor drop receipts remain as recorded.

The older ON2 146 ms gap, adjacent 1/2 ms draw batches and four compositor-counted
drops remain unresolved. The new analysis does not explain away that event or
join its aggregate drop counter to individual frames. It also does not attribute
the 18 newer startup gaps to GPU work, import reuse, scheduler delay or a driver.

A synthetic periodic-update/refresh-grid case demonstrates that callback gaps
can cross 50 ms without expensive draws. This falsifies that inference alone;
it is not a fitted model or reproduction of these browser runs.

## Source And Asset Admission

Eleven relevant source files are archived from base
`892431809a4caadb5c73b2c03ad9bdb124c3e21e`. Both exact package source manifests and
tracked patches verify, and neither patch changes these files. Current bytes
also equal those archived base bytes. The compared manifests remain immediate
pre-cache `4c8085f0...` and reuse `9ec305ad...`, not an older baseline or a native
test overlay. Source inspection is not per-event runtime execution proof.

The inspected chain is:

1. `MediaDecoderStateMachine::DecodingState::Step` calls
   `UpdatePlaybackPositionPeriodically`, which updates `mCurrentPosition` and
   schedules the next state-machine run using `AUDIO_DURATION_USECS / playbackRate`.
   The constant is 40000 microseconds. The nearby upstream comment saying
   "40us" conflicts with that value and conversion; it is not the unit used here.
2. `MediaDecoder::ConnectMirrors` connects the canonical position; its watch
   calls `UpdateLogicalPosition`, then `UpdateLogicalPositionInternal` invalidates.
3. `VideoFrameContainer::Invalidate` reaches `HTMLVideoElement::Invalidate`,
   which schedules a document callback when requests and an image exist.
4. `Document::ScheduleVideoFrameCallbacks` coalesces video entries;
   `FrameRequestManager::Take` moves that pending collection out for dispatch.
5. `nsRefreshDriver::RunVideoFrameCallbacks` assigns the refresh timestamp to
   `presentationTime` and passes the same timestamp as callback `now`. Its
   expected-display value initially uses the next-tick hint.
6. `HTMLVideoElement::WillFireVideoFrameCallbacks` selects an image using the
   current/next tick. For an already-due image it changes expected display to
   presentation time. Frame IDs and media timestamps come from selected images,
   not a measurement of monitor scanout.

Other state-machine wakes and invalidations exist; this is not a proof that
40 ms is a universal maximum callback rate. Do not change Firefox's callback
cadence or fabricate timestamps to make the benchmark pass.

Searchfox supplied upstream discovery. Installed CLI 0.18.0 advertises 0.20.4;
no update was installed. Frozen branch source, not a current upstream line
number or the dirty canvas implementation, anchors the deployed-source claims.

A bounded ffprobe decode of the owned clip's first three seconds confirms
1920x1080 H.264, 30/1 rates, 90 seconds and evenly spaced decoded timestamps
within the probe's printed precision. This rules out an obvious source-PTS gap
in that sampled startup interval, not runtime decoding or GPU delay.

## Diagnostic Contract And Verification

New schema version 2 preserves each original five-field row and appends callback
`now`, `presentationTime`, `mediaTime` and nullable `processingDuration`. Typed
checks reject missing/nonfinite presentation data and invalid durations. The
validator preserves signed callback age rather than clipping it to zero. It
checks the source-backed equality of callback and presentation timestamps,
strictly increasing media/tick observations and unchanged phase endpoints.
An explicit five-field projection passes the entire original workload validator;
the nine-field raw receipt must remain the primary saved observation.

Twelve strict-unhandled Node test groups pass in 0.76 seconds. Tests cover
all saved populations, source/clip hashes, field/schema/order/cap corruption,
clock separation, source-to-generated AST equivalence, full fake-clock workload
equivalence and twelve original failure paths. Malformed timing metadata leaves
the video paused, canvas removed and no fake timers/callbacks pending. Optional
decoder duration remains null when absent. The simulated response is below the
existing 1 MiB limit; real control serialization and runtime admission remain
future gates. No fake test is described as actual browser cleanup.

Scoped documentation lint and diff whitespace checks pass. Authored diagnostic
scripts are explicitly formatted; generated/pinned source is not reformatted.
The existing 66 product-source pins, 150-file playback harness, staged index and
configuration still match. Both earlier comparison seals verify unchanged.

Preserved failures include initial missing-module scaffolding, a fake-clock
floating-point round trip, cross-VM object identity, an unavailable old analyzer
export and differing old acceptance-field names. Corrections are confined to
the new tooling. The old writing analyzer was never executed; old evidence was
not rewritten. No production regression is inferred from those setup failures.

Evidence: `artifacts/umbralink-control/callback-cadence/`. It includes archived
source, source/package admission, complete interval results, ffprobe output,
the generated collector, tests and failure logs. No browser, native build,
profiler, daemon, remote command, installation or owner-profile operation ran.

## Next Gate

Integrate the new collector into an additive isolated driver using the existing
ownership, resource, raw-before-validation and cleanup envelope. Preserve the
48-second workload, source clip, 1/4/4/1 copy phases, all original guards and
120-second capture/15-second cleanup limits. Raw timing version 2 must be saved
before validation; do not present its projected old-format summary as an old
uninstrumented capture.

Use separately identified pre-cache and reuse diagnostic runs to compare signed
callback age with tick and media-time gaps. This is mechanism observation, not
another attempt to rerun the performance comparison until it passes. Added
metadata collection has observer cost. Small callback age would shift attention
toward callback admission/tick scheduling; large age would justify existing
main-thread/refresh-driver profiling with correct clock and range handling.
Neither observation alone establishes GPU wait or physical presentation.

The original 27/29 and 28/29 failures, renderer-label CPU concern, actual native
cache-hit frequency and automatic context recovery remain open. GPU import stays
default OFF, and the daily desktop browser and Pi remain untouched.
