# Passive Startup Thread Sampling

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

Tooling and the fixed four-run laptop experiment passed. **No rendering fix,
stall localization, or causal observer benefit was established.** Drops were
24, 0, 0, and 0 in control / sampled / sampled / control order, each over 1200
frames in a 20-second playback interval. The sampled captures therefore provide
smooth-playback thread data, not thread data from the rough control interval.

The owner's distinct prolonged stutter after seeking, followed by a black flash
and recovery, remains unreproduced. This experiment performed no seek. It follows
the sealed startup variability and preparation-only studies; it does not replace
their evidence or prove the owner symptom has the same cause.

## Scope And Provenance

Only isolated `wyatt-laptop` browser runs were used. The owner's desktop browser
and Pi were untouched. Fresh private installation, profile, application-data,
local-data and temp roots were retained. No product/default/native/API change,
system driver installation, kernel setting, extension disabling, codec forcing,
profiler activation, raw-profile parsing, delegation or index writes occurred.

Build20261006175655, base892431809a4caadb5c73b2c03ad9bdb124c3e21e,
export `exports/umbrafox-descriptor-borrow-20261006/`, source patch SHA256
`d1bf3bdfe9f7d36c82181db0b4487592d5b8857b070e43c1b2ee6aaea9cd1677`.
The dirty checkout is not deployed-source authority. All four exported binary,
libxul, application/platform INI and seven fixture hashes match. Seven loose
userland module paths are null in this package, not loaded-module attestations.

The existing child-only private iHD is SHA256
`7e14725d1af6a016fda32492cd7daaa33f1e744a36c0b8907ef3bb3a98e6798c`.
System free iHD remains SHA256
`a7cecd28f70fb692a5d65c2de8c491d953bc834dc1c98c4bd93a929ffcc976ee`;
nonfree remains not installed. Private and system packages have different version
strings, so neither these captures nor earlier comparisons isolate package
edition alone. No `LD_LIBRARY_PATH`, logging, profiler-startup or sandbox change.

The runtime root is
`/home/wyatt/.cache/codex/startup-thread-sampling-harness-20261007-WMprMv`.
It has53verified files,49syntax checks and167import edges. Manifest SHA256:
`f5a0ab5aae00ed3f13561d7aeef3146e655d2a0dea3d743d51804121a93a7b83`.
Generated adapters have exact inverse proofs against sealed source. Before,
between and after checks preserve root dev/inode/owner/mode, file hashes and a
scoped browser/build-process quiet check. Quietness is point-in-time only.

## Runtime Observations

Root prefixes are `/home/wyatt/.cache/codex/laptop-startup-thread-sampling-`.
Times below are UTC on October8.

| Run | Root suffix | Interval | Browser/content PID | Drops |
| --- | --- | --- | --- | --- |
| A1 | control-20261007-GV0yFB | 01:04:52..01:05:25 | 2268710/2268876 | 24 |
| B1 | sampled-20261007-S3OFOv | 01:07:08..01:07:41 | 2271891/2272056 | 0 |
| B2 | sampled-20261007-uYfR9P | 01:14:38..01:15:11 | 2275155/2275323 | 0 |
| A2 | control-20261007-HNqQm0 | 01:15:53..01:16:26 | 2277660/2277826 | 0 |

Each run passed21media samples, zero missed media intervals/events, nine resource
samples, zero log drops, clean SIGTERM cleanup, private-install verification and
absence of all14recorded controller/browser/resource PIDs. Maximum sampled RSS
was2,478,878,720bytes and artifacts95,097,522bytes. All logs were334bytes.
Five-second resource checks do not exclude transient helpers or prove no network
traffic. Parent and selected-content profiler inactive at boundaries; other
child profiler state and continuous inactivity are not independently measured.

A1 native totals attribute all24drops to the compositor category, not decoder
or sink. The page counter increased by23between samples5003/6002ms and by1between
16013/17001ms. Asynchronous counter updates do not identify actual drop times.
All84sampled media states had readyState4/networkState2; minimum buffered ahead
was8.917/15.023/15.027/15.009seconds. No simple starvation evidence at those
samples, but no network trace or continuous buffer proof.

Graphics features/adapters/info projections match across all four. Settings
viewport1280x955 throughout; settings-button rectangle736,515,48,40 in A1/B1/B2
and768,533,48,40 in A2. Settings-to-playback967/955/950/914ms; page age at playback
11436/11540/11533/11477ms. No full-layout equivalence or matched-delay assumption.
The long B1-to-B2 gap includes the owner's memory dump and context recovery;
order was preserved but host/site warm state was not reset or equalized.

## Thread And Clock Evidence

The sampler reads only owned parent-main, Renderer, Compositor and selected
content-main task counters. CPU comes from task stat, not aggregate process stat.
PID parent/group/session/start stamps are checked around each batch; each task's
TID/start/name is fixed. Main TID equals PID. No stacks, command lines, addresses,
scheduler-wait attribution, per-sample RPC or per-sample disk writes.

Fixed200ms/single-flight,160sample/32second cap,16KiB/read,512discovery entries,
1MiBseries cap. Read timeout poisons further starts and late publication; pending
OS I/O is separately reported rather than assumed cancelled. B1/B2 each saved
102samples, zero missed slots and no underlying read pending at stop. Maximum
batch wall time14.223/22.881ms is observer read duration, not browser blocking.

Laptops reported Nodev24.18.0, CLK_TCK100, sched_schedstats0. Wait statistics are
null, not zero. `clock-source.json` records pinned deployed Gecko source and
official Node/libuv tag excerpts establishing precise CLOCK_MONOTONIC rates with
different process origins. Node version-linked source is not binary attestation.
The existing playback RPC brackets a clock offset interval; it does not establish
an exact point mapping. B1 uncertainty23.704ms, B2 18.540ms; controls22.375/22.451ms.

Analysis admits only adjacent task intervals certainly inside the native playback
phase for every permitted offset. Each sampled thread retains99intervals, about
19.8seconds, and excludes two boundary intervals. No tight join to individual
one-second page-counter observations is attempted.

| Thread | B1 CPU ms | B2 CPU ms | Largest retained interval CPU ms B1/B2 |
| --- | --- | --- | --- |
| Parent main | 1100 | 1060 | 120/120 |
| Renderer | 1400 | 1560 | 30/30 |
| Compositor | 680 | 720 | 20/20 |
| Content main | 1430 | 1610 | 90/110 |

CPU counters have10ms ticks. These totals are neither exact full-playback CPU nor
blocked time. In particular, low Renderer CPU does not rule out driver, lock,
queue or compositor waiting. No rough interval was sampled to compare against.
Whole-parent endpoint CPU8695/8625/8712/8365ms includes other threads; do not
mislabel it main-thread execution or subtract it from these different windows.

## Verification And Reproduction

Namespace `artifacts/umbralink-control/startup-thread-sampling/` contains exact
commands, generated inverse receipts, runtime inputs, failed and successful
exports, independent reviews, comparison, logs and final verification/seal.
`comparison.json` is exactly reproducible by:

```sh
timeout 10 node artifacts/umbralink-control/startup-thread-sampling/recompute.mjs --check
```

Final combined53tests PASS, zero failures,0.635seconds;13manual JS files pass
Prettier. Existing preparation/variability tests are included. New analysis tests
cover uncertain boundaries, clock-origin translation, malformed clocks,
counter/identity/order violations, missing interior coverage and all saved runs.
Sampler tests cover actual owned Node procfs, late I/O/abort, caps, concurrency,
and full10RPC/12write failure points for both arms. These are not product tests.

All96priorsealed files and53currentruntime inputs verified unchanged. Final
remote input/quiet check01:17:51.247UTC; system-driver metadata01:18:09.142UTC.
All executable sessions are terminal. No performance optimization was deployed.

Preserved tooling issues: first A1 export lacked the argv placeholder and failed
before reads; corrected `control-1-export-v2.json` is the accepted export, with
no browser rerun. A one-off inspection incorrectly expected playback.samples;
actual schema is observation.samplesJSON. No evidence was modified by it.
New analysis RED is missing-module scaffolding, not a reproduced browser bug.
Initial38test and intermediate41test receipts remain as historical evidence.

## Next Decision

Do not repeat this sequence merely to hunt for a rough sampled capture. The last
untreated control again disproves that the added observation is necessary for
smoothness; these few ordered trials cannot estimate its causal effect.
Use the existing drop-producer source map and saved startup evidence to formulate
a different falsifier for scheduling/queue transitions versus CPU execution.
The actual affected owner stream and single jump versus repeated scrubbing remain
important for a later post-seek reproduction contract. No driver/wait/network
cause, public behavior change, memory leak or physical scanout claim follows.
