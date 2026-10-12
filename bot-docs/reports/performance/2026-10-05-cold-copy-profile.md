# Cold Video Copy: Remote-Readback Envelope, Missing Worker Coverage

## Verdict

One fresh headed laptop baseline passed. One candidate completed its collector
and profiler dump, then failed the new page-timestamp validator. No retry followed.
The candidate remains FAILED; this is not evidence of a rendering regression.

The preserved profiler exports independently support a narrower conclusion:
the first draw's remote-readback request/reply envelope occupies about 98-99%
of its UserTiming interval in both runs. The receiver's actual worker was not
sampled. Neither a slow driver, graphics initialization, conversion, queueing,
nor GPU waiting has been established as the cause. No new engine optimization,
installation, or desktop-browser change was made.

The earlier unprofiled counterbalanced repeated-copy result remains separate:
[moving timing](2026-10-05-moving-timing.md). Do not compare its durations with
these profiler-on measurements or claim a YouTube/scanout improvement.

## Capture and Provenance

Evidence root: `artifacts/umbralink-control/cold-profile/`.
Plan: `bot-docs/plans/cold-copy-profile.md`.
New runtime siblings: `cold-copy.mjs`, `cold-profile.mjs`, and
`laptop-cold-profile.mjs` under `artifacts/umbralink-control/`.

Same owned H264 asset, 1920x1080, 90 seconds, 30 fps, no audio. Asset SHA256:
`aac5b2c571eff675332728d94291137bf184c41644d7beb6f8467fee05907d27`.
Same 110x75 CPU canvas and four two-second phases, with 1/4/4/1 copies per
callback, pixel reads/hashing, and bounded cleanup. Only the first six draws
gain owned-document UserTiming marks/measures. No browser globals/prototypes
or Firefox public behavior changed.

Packages use base `892431809a4caadb5c73b2c03ad9bdb124c3e21e`, plus their frozen
export patches, not the present dirty checkout:

| Item | Baseline | Candidate |
| --- | --- | --- |
| BuildID | 20261001103920 | 20261003071500 |
| Export | `umbrafox-prototype-20261001` | `umbrafox-readback-candidate-20261003` |
| Tracked patch SHA256 | `a90f99694eb125830d490aba3d0558ed08e4372800fd47617a41834de0fc8588` | `46f9b2e4b34fcd3118cb01ec093a20c812311905cf3c8bd771f361b488fec316` |
| libxul SHA256 | `2a8eb56ca3d71650124a76112154c6517056207292cceecf6a7fd551c5c8e8fc` | `82faf41661bd92231acfaff88da1598f403f63c0a399f9dbd008cb724524b61b` |
| Terminal status | PASS | FAILED timestamp validator |
| Elapsed browser harness | 20.982 s | 20.985 s |
| Native profile bytes | 16,331,537 | 15,958,340 |
| Resource samples | 7 | 6 |
| Sampled artifact peak | 223,473,721 B | 188,228,700 B |

The candidate is the original readback candidate, not the later inline-DOM
candidate carrying the same BuildID. Its full source also includes the frozen
new-source supplement already pinned by the package manifest. The packages differ
in more than one change: this pair cannot isolate a causal speedup.

Both after receipts report hardware-accelerated ffmpeg RDD H264 decoding.
Before receipts are paused/time-zero and show decoder shutdown; this does not
prove continuous hardware decode throughout every frame. Both retain the same
owned document, content PID, source, dimensions, native roots, and capture limits.

Requested profiler configuration: 1 ms, 1,048,576 entries, `stackwalk`, `js`,
`processcpu`, `ipcmessages`, `flows`, `nomarkerstacks`; filters `GeckoMain`,
`RemVid`. Active configuration checked. The actual ring reports 16,777,216
entries, generation zero, sampling not paused; the existing minimum clamp remains.
Dump and retained binary copy each remain under 24 MiB. No raw profile JSON
parser was used; only profiler-cli loaded the raw profiles.

## Same-Clock Localization

`analyze.mjs` and `recompute.mjs` consume saved CLI exports and harness receipts.
They validate complete unzoomed exports, identical finite raw contexts, six exact
UserTiming start/measure/end triples with content PID/document/thread identity,
and unique child/parent request/reply endpoint joins by peer PIDs, sequence and
direction. Missing, reused, ambiguous or crossing endpoints reject. The scoped
duration calculation does not rely on flat StackMarker pairing completeness.

CLI marker starts are normalized by subtracting the raw root start. The raw
starts are 11340.721205 ms and 11373.565558 ms, respectively. IPC payload raw
times are checked against that normalization. Floating-point comparison uses
machine-epsilon-scaled arithmetic tolerance, not a page-clock timing allowance.
Do not mix page callbacks, page Performance entries and native profiler clocks.

| First-copy scope, ms | Baseline | Candidate |
| --- | ---: | ---: |
| UserTiming measure | 29.329551 | 24.991172 |
| Readback request-start to reply-end | 28.961523 | 24.648503 |
| Request endpoint transfer span | 0.060688 | 0.148808 |
| Between endpoint transfer spans | 28.811136 | 24.354482 |
| Reply endpoint transfer span | 0.089699 | 0.145213 |

These are wall-time spans, not CPU or GPU time. The gap between endpoint
transfer spans is not a precise `RecvReadback` execution measurement. Both first
joins use sequence -34 in their own independent process pairs. Full subsequent
five scopes and endpoint handles are in `results.json`.

The candidate's second scope is 0.041310 ms and has no joined readback request;
this is consistent with reuse, not an authoritative cache-hit receipt. Existing
paused-frame request-count/pixel verification is stronger evidence of the narrow
cache behavior. No first-copy regression or speedup follows from one run/build.

## Coverage Gap and Frozen Source

The IPC payloads retain receiver `threadId` 1120211 (baseline) and 1123093
(candidate), neither present in the sampled thread inventory. The exports' derived
receive-thread labels point at RDD main instead; they must not be treated as
proof that the work ran on RDD main.

Frozen `RemoteMediaManagerParent::StartupThreads` creates the `RemVidParent`
task queue over `GetMediaThreadPool(MediaThreadType::SUPERVISOR)`. Frozen
`dom/media/VideoUtils.cpp` maps that pool to `SharedThreadPool::Get("MediaSupervisor", 4)`.
`RemVid` was therefore not a sufficient physical-thread filter. Task-queue names
and physical worker names are different. RDD-main samples in `PollWrapper`
cannot establish that the decoder process was idle.

Frozen readback chain, including the exported candidate patch:

1. `RemoteMediaManagerChild::Readback` synchronously dispatches onto its manager
   thread, then performs `SendReadback`; the candidate passes optional size.
2. `RemoteMediaManagerParent::RecvReadback` finds the image and uses its buffer
   descriptor path, including `BuildSurfaceDescriptorBufferForSize` when sized.
3. `DMABufSurfaceYUV` sized readback allocates destination BGRA. Depending on
   existing context state it uses `mGL` or takes the snapshot-context mutex and
   claims a shared snapshot GL context. That context may be created lazily.
4. `ReadIntoBuffer` can create/import textures and destination texture/FBO,
   perform the scaled blit, and read pixels into the destination buffer.

This establishes candidate stages, not which branch or stage consumed this run's
time. Existing sampled caller stacks include `CanvasRenderingContext2D.drawImage`
and unresolved libc/library addresses. Offline symbol lookup did not resolve
enough to name a wait primitive or driver operation. No speculative warmup,
prefetch, cache expansion, or shader change is justified by this capture alone.

## Failed Validator: Different Precision Domains

Candidate phase-zero frame one records callback timestamp `11473.14`, followed
by page Performance mark start `11473` and zero coarse duration. The diagnostic
incorrectly requires `trace.startTime >= frame.callbackAt`. All unchanged V3
moving-data validation passes; the new trace validator rejects. The full result,
profile and original FAILED terminal report are preserved without editing.

Frozen sources independently explain why that comparison is not guaranteed:

- `nsRefreshDriver::RunVideoFrameRequestCallbacks` supplies the callback timestamp
  through `Performance::TimeStampToDOMHighResForRendering`.
- That method uses `ReduceTimePrecisionAsMSecsRFPOnly` with zero mixin.
- `PerformanceMark::Constructor` calls `Performance::Now` for the page-visible
  start and separately `NowUnclamped` for private profiler timing.
- `Performance::Now` uses full seeded `ReduceTimePrecisionAsMSecs` for content.

These files are not modified by either frozen tracked patch. The source and
observed fractional/integer values refute the ordering assumption; no arbitrary
epsilon, disabling timer protection, or changing Firefox clocks is appropriate.
The next diagnostic must use a prospective contract that does not order these
different exposed precision domains. Equal adjacent coarse timestamps also need
explicit handling. Preserve this failure as a regression case.

## Verification and Cleanup

42 focused tests PASS: collector/controller, route, existing V3 timing and saved
V3 evidence, plus new saved-export analysis cases. New analyzer RED: 2 pass,
3 fail, followed by 5 pass; includes 17 malformed/identity/clock/ambiguity cases,
missing/crossing/orphan endpoints, nonzero-origin invariance and the real failed
page-clock receipt. Exact eight-file Prettier check PASS. No full-engine build or
lint claim. `results-recheck.json` is byte-identical to `results.json`.

Both native profilers stopped. Both browsers exited by owned SIGTERM with clean
cleanup, 271 log bytes each, zero dropped bytes. Package postchecks pass all 47
regular files; only the separately admitted empty update directories are allowed.
All 24 recorded browser/controller PIDs were checked absent again after analysis.
The 39 transferred runtime inputs still match their hashes (23,298,598 bytes).

Remote harness:
`/home/wyatt/.cache/codex/cold-profile-harness-20261006-qzu48K`.
Remote run roots:
`/home/wyatt/.cache/codex/laptop-cold-profile-baseline-20261006-WSAJxW` and
`/home/wyatt/.cache/codex/laptop-cold-profile-candidate-20261006-MypdhC`.
Initial verification mistakenly looked for the manifest at the harness root;
the actual archive member is `artifacts/umbralink-control/cold-profile/harness.json`.
The corrected read-only check passed; no remote input was changed.

Offline CLI sessions explicitly used `http://127.0.0.1:9`. Owned daemon PIDs
744195 and 745130 and their named sockets were verified absent after finally-stop.
No blanket network isolation claim: these are saved command/configuration and
cleanup facts. No personal browser/profile or shared crash queue was accessed.

The 120 s total, 105 s work, 15 s cleanup and final 2 s reserves stayed unchanged;
10 s quiet and at least 64 MiB prospective artifact headroom were enforced.
The 256 MiB artifact cap is sampled, not a proof of every instantaneous size.
The candidate's samples end before the final profile copy; do not read its lower
sampled peak as lower final disk use or memory consumption.

Previous V3 seal verifies unchanged. Staged diff SHA256 remains
`3b78253cf775a4a1e8c69a4b82cc3958b366056129a391f4ae362bdfe8e4e0c4`.
No commit/stage/reset, installation or native-source change in this step.

## Next Step

Use a new prospective diagnostic sibling, preserving this code/evidence/verdict.
First test the real clock counterexample and same-domain sequence invariants;
then include `MediaSupervisor` in a bounded capture and require positive actual
receiver-thread coverage from the IPC/thread inventory. Retain the same asset,
workload, package provenance, privacy roots, cleanup and resource limits.
Review profile-size headroom before any run; do not silently raise the cap.
Only then decide whether a narrow private internal stage observation is needed.
The broad performance goal remains active; no deployment or general playback
acceptance is implied.
