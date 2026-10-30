# Sampling-Only Counterbalanced Comparison

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

All ten fixed laptop runs passed: two calibration controls and eight comparison
runs. All 800 case observations passed the version-4 page-owned workload
validator. Ten native-root checks, 60 resource samples, zero log drops, clean
owned shutdown, and independent absence of all ten browser and ten controller
PIDs passed. No engine change, build, installation, owner-browser operation,
or public-interface change occurred in this step.

Sampling-only profiling remains materially intrusive. In this batch the
whole-workload medians were 15.0% higher for A and 10.0% higher for B with
sampling enabled. These are observed differences, not calibrated universal
overhead constants: there are only two processes per build/mode, unequal gaps,
and no continuous frequency or host-load control.

Matching native symbols confirm the intended mutation-check improvement in
the sampled synthetic workload. `UmbrafoxUserlandMutation::ShouldDispatchMutation`
has 273 inclusive samples out of 2296 active samples in A, versus 4 of 2044
in B. Its self counts are only 13 and 4. The preference hash lookup has
139 self / 198 inclusive samples in A and no matching function row in B's
complete exported function list. Absence of a sampled row does not prove zero
executions. Nested inclusive counts cannot be summed into an avoidable fraction.

This is not a YouTube result, a general browser speedup, or hardware-rendering
acceptance. Layout remains unresolved rather than cleared by this experiment.

## Packages And Protocol

A is the sealed readback candidate; B is the sealed mutation-mirror candidate.
Both have application BuildID `20261003071500`, so BuildID alone is insufficient.

| Identity | A | B |
| --- | --- | --- |
| `libxul.so` SHA-256 | `82faf41661bd92231acfaff88da1598f403f63c0a399f9dbd008cb724524b61b` | `d00138528b1410b81405fc9533b8771a8284ec98e6968a2bce313bc2177c4231` |
| GNU build ID | `f2c96c91073e8ba2cd754e10735f6b75` | `9be8527d27b64ed4999b502e44c55a2b` |

The sealed B `tracked-source.patch` replaces the existing generic
`Preferences::GetBool` read in `UmbrafoxUserlandScriptsActive` with
`StaticPrefs::umbrafox_userlandScripts_active`. The A patch does not contain
that replacement. Existing package/test provenance remains in the
[mutation-gate report](2026-10-03-mutation-gate.md).

Fixed sequence, declared before the comparison:

```text
AA-1 AA-2
A-off-1 B-samples-1 A-samples-1 B-off-1
B-off-2 A-samples-2 B-samples-2 A-off-2
```

The final four cells reverse the first four. AA calibration is excluded from
comparison aggregates. The predeclared admission screen allows at most 15%
whole-workload difference relative to the smaller AA value. AA totals were
5177 and 5430 ms, 4.89% apart. This coarse screen is not a per-case noise bound.

The new remote harness is
`~/.cache/codex/sampling-balance-harness-20261003-atN5P0`, with 21 source hashes
verified before and after runs. No previous harness or candidate was modified.
Each run used fresh owned profile/application-data/local-application-data roots,
existing 120-second runtime and 24-MiB profile-copy limits, and the existing
256-MiB OFF / 512-MiB profiled sampled artifact policies. No cap was raised.
Compiler admission was empty on the recorded checks, not continuously sampled.

## Unprofiled And Profiled Measurements

Each case value is the median of two process medians. Each process median uses
eight trials, excluding two warmups. Whole-workload time includes warmups,
setup, asynchronous wrappers and fixed waits, so it is not pure active CPU time.

| Measurement, ms | A OFF | B OFF | A samples-only | B samples-only |
| --- | ---: | ---: | ---: | ---: |
| Whole workload | 5309.5 | 5223.5 | 6104.5 | 5747 |
| Detached text | 28.5 | 24.5 | 33 | 28 |
| Attached text | 30.75 | 29.25 | 41 | 34.75 |
| Attributes | 113.5 | 108 | 133.5 | 123.5 |
| Child list | 56.5 | 54.75 | 71 | 59.75 |
| Observer text | 38.5 | 40.75 | 46.5 | 45.5 |
| Batched layout | 14 | 14.25 | 19 | 18.5 |
| Interleaved layout | 50 | 49.5 | 62 | 63.75 |
| JavaScript control | 25.75 | 27.5 | 29 | 28.75 |

With profiling OFF, B's aggregate is 1.62% lower, detached text 14.0% lower,
attached text 4.88% lower, attributes 4.85% lower and child list 3.10% lower.
Observer text is 5.84% higher, batched layout 1.79% higher, and the JS control
6.80% higher. These small populations do not establish significance,
equivalence or a causal regression. For example A's two batched-layout medians
are 17 and 11 ms, and its detached-text medians are 31 and 26 ms.

With profiling enabled B's whole-workload median is 5.86% lower, which would
overstate the observed unprofiled difference if treated as a speed benchmark.
Do not pool these runs with older sandbox, marker-enabled, isolated-layout,
sampling-pilot, or earlier unprofiled batches. The roughly 172-second gap from
the first A OFF finish to the first B sampling start is retained, not concealed.

All individual trial durations, process medians, timestamps and comparisons are
in `artifacts/umbralink-control/sampling-balance-results.json`.

## Native Attribution

The first A/B samples-only captures were chosen for symbolication, without
choosing based on their elapsed-time rank. Raw profiles are parsed only by
`profiler-cli` 0.10.0. Samply 0.13.1 supplies local symbols from the matching
sealed package, not the dirty current object tree. Local library hashes and GNU
IDs were verified; server logs show matching build-ID lookup and the correct
package `libxul.so`. Full DWARF availability is not claimed. Some system-library
lookups fail, and about 4.5% of active self samples remain address-only.

| Export | A | B |
| --- | ---: | ---: |
| Fixture content PID | 407203 | 406171 |
| CLI thread | `t-263` | `t-232` |
| Active samples | 2296 | 2044 |
| Including idle | 3072 | 2823 |
| DOM | 1623 | 1370 |
| Layout | 409 | 393 |
| JavaScript | 226 | 244 |
| GC / CC | 26 | 30 |
| Address-only self samples | 103 | 92 |
| Full function rows | 1145 | 1052 |
| Preference Read markers | 0 | 0 |
| Workload UserTiming markers | 0 | 0 |

Each capture joins its own native URL/PID/window snapshots and document receipt;
the same numeric document ID in distinct runs is not a cross-profile identity.
The native before/after bracket uses profiler-process-relative milliseconds.
CLI relative zoom input subtracts the raw `context.rootRange.start`; returned
status ranges must equal the original native bounds. All samples are from the
whole workload bracket, including control overhead, not individual case spans.

Complete exported function self counts reconcile exactly to active samples.
Candidate B's remaining functions include normal character-data changes,
attribute processing, mutation observers, strings, layout/style work and
profiler label maintenance. Mutex names alone do not establish contention;
the GC counts do not establish a GC cause for the earlier layout variability.
No new engine patch is justified solely by those names.

## Preservation And Cleanup

Remote run roots are `~/.cache/codex/sampling-balance-20261003-<cell>`.
Local roots are `~/.cache/codex/laptop-sampling-balance-evidence-20261003-<cell>`.
333 whitelisted evidence files plus ten driver receipts were copied with
independent remote/local SHA checks. No private profile directory, discovery
token, application-data contents, or shared crash queue was exported. Four
bounded raw profiles were copied/hashed, not parsed by custom code.

Maximum sampled artifact size was 221926415 bytes. Each run supplied six
resource samples. Sampled caps and root absence are not continuous process,
memory, network, or all-descendant coverage. Original failures from older
experiments remain intact.

Native-analysis roots are
`~/.cache/codex/sampling-balance-symbols-20261003-{A,B}-1`.
Only explicit loopback symbol endpoints were passed to the CLI. Samply used
`--no-open`, matching `--symbol-dir`, a fresh child cache, an otherwise empty
environment with unchanged HOME, two worker threads, 8-GiB address-space and
256-MiB file limits, zero core limit, and a 180-second SIGINT watchdog. This is
configuration evidence, not a network-sandbox/no-packet proof.

Samply PIDs 1688494 and 1690394 were identity-checked, stopped with SIGINT, and
their sessions exited zero. Profiler daemons 1688689 and 1691808 stopped zero
in `finally`; exact PID and named socket absence was verified. Both loopback
ports 37521/37522 were absent at final check. No capture, transfer, profiler or
symbol service remains active.

## Verification And Next Work

Thirteen focused driver, comparison, native-summary and existing sampling-proof
tests pass. They exercise fixed order, predecessor identity/cleanup, calibration
boundary, invalid arguments, missing/duplicate/reordered observations, checksum
and NaN rejection, warmup separation, process-median ratios, zero denominators,
clock/thread mismatches, truncated native exports, duplicate functions and
weight reconciliation. The new analysis-test RED logs are missing-module
failures, not reproduced production defects; the earlier calibration-threshold
RED is a behavioral failure. Syntax checks and all 21 frozen source hashes pass.
No engine code changed, so the prior 390-test adapter gate is historical evidence,
not a newly rerun broad suite. New sources are scratch analysis only.

The optimization is supported as a reduced mutation-check hotspot, not accepted
as a universal performance improvement. Next priorities are:

1. Preserve this sampling route for attribution, but use profiling-OFF timing
   for performance decisions; do not subtract a fixed overhead percentage.
2. Resolve the layout/order variability with a separately predeclared experiment
   if it remains a release gate. Avoid a speculative layout/GC/JIT patch.
3. Obtain consent for one temporary headed test window on the quiet laptop and
   verify actual hardware decode/composition/readback, pixel and resource gates.
   Headless correctness does not prove the pending GPU path.
4. Keep candidates uninstalled and preserve the owner's running browser/profile
   until installation/restart is explicitly authorized.

Final evidence manifest: `artifacts/umbralink-control/sampling-balance-final.sha256`.
