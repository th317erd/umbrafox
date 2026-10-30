# Moving Video Observation and Timestamp Boundary

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Outcome

One fresh headed laptop baseline passed. One fresh original readback-cache
candidate completed the workload and post-workload diagnostics but failed the
prospective validator. No retries. The candidate remains FAILED, and this pair
is not an accepted performance result. Neither package was installed for daily
use; the desktop browser, profile and launcher were untouched.

The failure isolates an invalid measurement assumption: the final callback's
frame media time must not exceed the later paused playback time. The candidate's
last frame has mediaTime7.966666s, while paused currentTime is7.959293s, a7.373ms
lead. Its expectedDisplayTime is16.68ms after callbackAt. Only that final frame
violates the bound. A saved-data counterfactual changing only the copied terminal
time makes every other validator assertion pass; the original remains unchanged
and fails. This is not permission to rewrite its measured time or status.

Firefox's `HTMLVideoElement::WillFireVideoFrameCallbacks` can select a queued
image due by the next refresh tick, then populate mediaTime from that image's
timestamp. It uses CurrentTime only as fallback for absent frame metadata. A
universal mediaTime<=currentTime ordering is therefore not supported by this
producer. The observation is consistent with prospective frame selection, not
proof of the exact internal scheduling of this callback. See the
[pinned callback producer](https://searchfox.org/firefox-main/rev/00a4d527cdb9807ecb561c9fcf7d211e7e568ddf/dom/media/mediaelement/HTMLVideoElement.cpp#812-885).

Source admission used frozen base892431809a4caadb5c73b2c03ad9bdb124c3e21e plus
the candidate export's tracked patch46f9b2e4b34fcd3118cb01ec093a20c812311905cf3c8bd771f361b488fec316.
The patch's76 tracked paths exclude HTMLVideoElement.cpp; the frozen base
contains the same relevant producer. This is not a dirty-checkout attribution.
Searchfox CLI0.18.0 announces0.20.4; no tool update was installed.

## Preserved Observations

Same90s1080p30 H.264 asset and exact prior serialized collector. Four2s phases
request1/4/4/1 copies per video callback into a110x75 CPU canvas. All copies and
pixel transitions are retained. No profiler, but pixel reads and hashing impose
observer cost. Draw timings exclude that read/hash work and use the coarse page
clock. The fixed-order whole-package pair is not a cache-only experiment.

The following are descriptive raw observations, including the FAILED candidate:

| Field | Baseline | Candidate |
| --- | ---: | ---: |
| Callbacks per phase | 49/50/50/50 | 49/50/49/50 |
| Total canvas copies | 499 | 495 |
| Differing four-copy batches | 14/100 | 11/99 |
| First single-copy phase median/P95 ms | 2/3 | 2/4 |
| Final single-copy phase median/P95 ms | 2/3 | 2/4 |
| First repeat phase additional-copy median/P95 ms | 1/2 | 0/1 |
| Second repeat phase additional-copy median/P95 ms | 1/2 | 0/1 |
| Reported video drops across phases | 0 | 0 |

Zero milliseconds is unresolved by the page clock, not zero work. Unequal
callback populations, one pair, observer cost and the failed contract prevent
a reliable speedup claim. Video counters are not physical scanout evidence.
This is an encouraging repeated-copy lead, not proof that YouTube stutter is
fixed. Actual image IDs and moving-workload cache hits were not recorded.

Both after-decoder receipts identify hardware-accelerated ffmpeg RDD H.264.
Both before-decoder receipts say shutdown despite hardwareAccelerated=true;
continuous active decoder/backend coverage is not proved. Intel Iris Xe RPL-P,
Mesa/iris25.2.8, X11/KWin, graphics features and display information match.
Both before/after process snapshots retain the sole expected fixture document,
same content PID, inactive userland and inactive profiler.

## Runtime and Evidence

| Field | Baseline | Candidate |
| --- | ---: | ---: |
| BuildID | 20261001103920 | 20261003071500 |
| Controller PID | 1088435 | 1090449 |
| Browser PID | 1088468 | 1090501 |
| Content PID | 1088627 | 1090676 |
| Capture seconds | 19.959 | 20.041 |
| Peak sampled artifact bytes | 188307823 | 188323037 |
| Pre-workload headroom bytes | 80277288 | 80133015 |
| Resource samples | 6 | 5 |

Both clean owned SIGTERM,271log bytes,0dropped log bytes, and browser-root absence.
All24 recorded browser/controller PIDs were independently absent at export.
Both package checks pass:47 regular files including the admitted lock, and only
previously allowed empty updater directories. All36 transferred harness files
match before/after. Private native app/local/temp receipts pass. These are
point-in-time/sampled checks, not a transient-process census or network sandbox.

Unchanged120s total/105s work/15s cleanup/final2s,10s quiet,256MiB sampled artifact
cap and64MiB prospective headroom. No personal profile/control token exported.
The namespace EPERM and successful VA-API iHD initialization logs are retained.

Evidence: `artifacts/umbralink-control/moving-observation/`. Baseline36-file
export227882bytes; candidate33-file export216599bytes, both locally verified.
`pair-observations.json` explicitly labels the failed-pair descriptive status.
`candidate-replay.txt` retains the rejection stack and boundary records.
The preceding V1 failure and79-file seal remain unchanged.

Harness: `~/.cache/codex/moving-observation-harness-20261005-6Fbogb`,36files,
23277351bytes, manifestdd03ccdb1e142614ced0bc4e011b29758333f1699112a2b341bb11b917eb3e56.
Laptop runs: `~/.cache/codex/laptop-moving-observation-baseline-20261005-IXlrES`
and `~/.cache/codex/laptop-moving-observation-candidate-20261005-G8Gws6`.

58 focused tests PASS, including3 saved-data replay/identity/failure tests;
exact5file formatting PASS. Staged diff remains231628bytes/SHA3b78253c... .
No engine changes, build, installation, commit or staging in this step.

## Next Measurement

Before any further runtime, prospectively replace the unsupported cross-clock
ordering with separate finite, in-duration media timestamps and monotonic
callback/frame identities. Preserve and report frame-versus-playback lead rather
than choosing an arbitrary tolerance to make this sample pass. Include ahead,
behind, invalid, reordered, seek and boundary tests. Do not change Firefox's
frame selection or timing semantics to satisfy a benchmark.

First establish that contract against existing saved data without relabeling
old results. Then decide whether a counterbalanced repeated pair or a direct
moving readback-request count is the smallest useful next runtime. Earlier
paused-frame50-to18 request reduction and50 matching pixel hashes remain
independent accepted evidence; broad playback speedup remains unproved.
