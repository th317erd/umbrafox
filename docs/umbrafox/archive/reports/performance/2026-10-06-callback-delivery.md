# Callback Delivery Timing Diagnostic

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

Two corrected isolated laptop captures pass functional, timing-schema, resource,
provenance and cleanup checks. They retain 2375 video callbacks and 2367
within-phase intervals. Their six callback gaps over 50 ms are all 51 ms, within
the first 1.350 seconds. Corresponding refresh-timestamp differences are
49.38-50.86 ms; callback-entry age is only 0.82-1.98 ms, and adjacent measured
draw batches take 0-1 ms.

Thus most of these particular gaps precede callback execution rather than being
spent delivering the callback after its recorded refresh timestamp or executing
the adjacent draw calls. This does not identify why those refresh intervals
occurred. It does not exclude earlier asynchronous GPU work, identify a driver
stall, prove the 40 ms invalidation path is the sole producer, or measure physical
scanout. The earlier 146 ms gap and four compositor-counted drops are unresolved.

These are a separate timing diagnostic, not a replacement or retry of either
failed performance comparison. Direct import's 27/29 and frame reuse's 28/29
screens remain failed. No acceptance threshold, callback scheduling, product
source, shader, public API or preference default changes. Import remains default
OFF and uninstalled in the owner's daily browser.

## Observations

Both packages use import ON and profiler OFF. The unchanged owned 1080p H.264
fixture draws to a 320x180 canvas for 48 seconds, in four 12-second phases with
1/4/4/1 copies per callback. There are no per-frame pixel reads or control RPCs.

| Observation | Immediate pre-cache | Frame reuse |
| --- | ---: | ---: |
| Callbacks | 1187 | 1188 |
| Within-phase intervals | 1183 | 1184 |
| Callback rate, range across phases | 24.698-24.799 Hz | 24.720-24.789 Hz |
| Gaps over 50 ms, phases 0-3 | 2 / 0 / 0 / 0 | 4 / 0 / 0 / 0 |
| Callback-age median, phase range | 0.36-0.44 ms | 0.36-0.46 ms |
| Callback-age P95, phase range | 1.14-1.16 ms | 1.06-1.22 ms |
| Largest callback age anywhere | 1.72 ms | 5.54 ms |
| Video-quality drops, every phase | 0 | 0 |
| Native final decoded/sink/compositor/container drops | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 |

Callback age is the collector's entry `performance.now()` minus the callback's
`now` argument. Negative values down to -0.70 ms are preserved, not clamped:
these clocks have different precision/rounding. They are not negative physical
latency. In all recorded rows, callback `now` equals metadata `presentationTime`,
as the pinned producer predicts. They are not two independent display clocks.

| Variant, startup offset | Callback gap | Refresh-timestamp gap | Callback age | Media-time gap |
| --- | ---: | ---: | ---: | ---: |
| Pre-cache, 165 ms | 51 ms | 49.86 ms | 0.92 ms | 66.667 ms |
| Pre-cache, 1350 ms | 51 ms | 50.58 ms | 1.72 ms | 33.334 ms |
| Reuse, 248 ms | 51 ms | 50.50 ms | 1.60 ms | 33.334 ms |
| Reuse, 331 ms | 51 ms | 49.38 ms | 1.98 ms | 66.667 ms |
| Reuse, 1014 ms | 51 ms | 50.86 ms | 0.82 ms | 33.333 ms |
| Reuse, 1298 ms | 51 ms | 50.54 ms | 1.46 ms | 66.666 ms |

For every interval, raw observations satisfy callback-gap = refresh-timestamp-gap
+ change in callback age. Media timestamp jumps and callback counts do not count
physically displayed or dropped frames. Optional `processingDuration` is absent
in all 2375 callbacks and remains null; this diagnostic supplies no per-frame
decoder-duration evidence.

One process per package, fixed order and additive observation do not support a
new speedup estimate. Saved CPU measurements are retained but not used to promote
the candidate. Do not pool these runs with the earlier comparison. No YouTube,
extension, full-session memory, automatic context recovery or cache-hit-frequency
conclusion follows.

## Transport Failure And Correction

The first attempt completed playback but failed result serialization. Its raw
parent reply retains a null page result and the exact bounded-JSON error. The
initial adapter then reported a secondary null-value validation error. Native
final decoder counters are zero, but without the page result this attempt is
not a timing or performance observation. No second package was launched in that
failed wave.

The identical serializer entry from each exact package matches current
`UmbrafoxControlScript.sys.mjs`. Its existing 10000-node ceiling rejects a
real-sized nine-column timing array while accepting the old five-column data.
The original collector tests covered result bytes, but did not exercise this
controller node ceiling. The new regression does both inner page serialization
and outer browser-reply serialization. An initial fake sandbox omitted
`TextEncoder`; that test setup failure is retained, separately from the admitted
serializer reproduction and missing-module REDs.

The correction is diagnostic-only. After the existing collector finishes and
cleans up, four per-phase row arrays become JSON strings with an explicit
`phase-rows-json-v1` encoding field. The packet is limited to 512 KiB, below the
existing one-MiB transport bounds; observed compact page packets are 67009 and
67096 bytes. The controller's node, byte, depth and timeout limits are unchanged.
The raw encoded reply is saved before decoding. Local decoding checks all nine
fields, row counts, identities, timing order and metadata; only then is an explicit
five-column copy supplied to the old summary validator. No rows are dropped,
truncated, averaged or silently defaulted. A page error is checked before access
to its possibly null result, preserving the original failure.

Both adapters retain the old browser capture byte for byte except its import.
The new request changes only the serialized collector body; parent targeting,
document identity, private provider boundaries, request sequence, cleanup and
deadline contract are unchanged. Packing adds work after the measured playback
but before the final CPU snapshot; metadata collection also adds observer work.
Neither is claimed free.

## Verification And Ownership

There are 21 passing offline groups in the final combined suite: the original
12 collector/audit groups, six transport/integration groups, and three full
saved-evidence groups. Coverage includes both deployed serializers, exact lossless
round-trip, malformed/oversized/unknown encodings, wrong rows and clocks, page
errors, every capture RPC/write failure, abort, raw-before-rejection preservation,
exact legacy summaries, all real interval identities and 14 admission corruptions.
Earlier 17-group adapter acceptance and the real failed attempt remain preserved;
they did not prove transport admission.

The corrected 158-file harness preserves every one of the preceding 150 files.
Static dependency closure and package inputs are checked before and after runs.
The normal packages are Build20261006175655, 46 files each, with manifests
4c8085f0f675c5b183976807df38bb99474bbd8be2e58651b52e4be9176eee8e and
9ec305adc36c8c1e362ed6e74925c8c473efd999212d354c6f11431ca17b8678.
Corrected harness SHA256 is
37ccb9d07d2dfe47280382c26de4e2a721a0219116ea05e2621238a08eb4c8d6.
The new harness uses a fresh root; the failed harness is not modified in place.

Host is wyatt-laptop, with the existing X11/Iris Xe/WebRender and hardware ffmpeg
RDD path. Each browser has fresh owned installation/profile/application/local/temp
directories and native-root receipts. Limits remain 120 seconds capture,
15 seconds cleanup, 220 seconds driver, 240 seconds SSH, and 256 MiB sampled
artifacts. Fifteen-second settling and no sampled browser/build activity precede
each capture. All 28 corrected resource samples pass; maximum sampled artifact
size is 144001685 bytes. The two public exports contain 88 files, 450249 bytes.
No profile, token or app-data payload was copied.

| Attempt | Browser / controller PID | Outcome |
| --- | --- | --- |
| Original transport | 1802731 / 1802699 | Serialization failure, clean SIGTERM |
| Corrected pre-cache | 1806957 / 1806945 | PASS, 59.798 s, clean SIGTERM |
| Corrected reuse | 1809850 / 1809838 | PASS, 59.950 s, clean SIGTERM |

All logs have 271 bytes and zero drops, retaining the existing sandbox/VA-API
messages. An independent final check at 2026-10-07T03:19:10.948Z confirms all 36
recorded PIDs absent, including the failed attempt. This is not continuous
whole-host, network or transient-helper isolation. All command handles are terminal.
The 66 product pins, HEAD, staged index and build configuration are unchanged.
No browser build, profiler daemon, package installation, desktop work-browser
action, launcher/profile change, Pi action, staging or commit occurred.

Evidence is under `artifacts/umbralink-control/callback-cadence-runtime/` and
`callback-cadence-runtime-v2/`, with sibling `cadence-import*` adapters.
The failed `a-1-failed/` namespace and both successful raw exports remain distinct.

## Next Step

Use these timestamps to distinguish refresh scheduling from callback delivery
in further source/private-span tracing. A causal join from playback-position
updates and video invalidation to the actual refresh callbacks is still missing;
the [source audit](2026-10-06-callback-cadence.md) is consistent evidence only.
Do not change Firefox callback cadence to improve the fixture, relax the old
smoothness gates, infer physical drops from callback spacing, or claim the rare
146 ms compositor event is resolved. Native translation-batch hit frequency and
automatic recovery remain separate open gates in the
[frame-reuse plan](../../plans/video-import-reuse.md). The full performance goal
remains active.
