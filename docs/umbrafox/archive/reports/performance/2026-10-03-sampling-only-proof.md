# Sampling Without Mutation Preference Markers

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

The supported `samplingallthreads` route works on both existing laptop packages:
useful fixture-content samples are retained without the baseline's per-mutation
preference markers. This closes the method feasibility question from
[marker calibration](2026-10-03-mutation-marker-calibration.md), not the broader
performance investigation or the unresolved mixed-layout signal.

| Observed quantity | Baseline A | Candidate B |
| --- | ---: | ---: |
| Completed workload cases | 80 | 80 |
| Active content samples in outer bracket | 2289 | 2017 |
| Samples including idle | 3070 | 2795 |
| Samples containing fixture `collectDOM` | 2251 | 1977 |
| DOM category samples | 1579 | 1382 |
| Layout category samples | 421 | 346 |
| JavaScript category samples | 255 | 254 |
| GC / CC category samples | 25 | 25 |
| Exported content `Preference Read` markers | 0 | 0 |
| Exported workload UserTiming markers | 0 | 0 |
| Copied raw profile bytes | 18246241 | 17031630 |

These are two method-validation captures, not a counterbalanced performance
comparison. Public workload receipts report 6126 ms and 5577 ms respectively;
do not turn those values or sample-count differences into a speedup claim.
Sampling all registered threads still incurs observer cost. There is no causal
YouTube, physical presentation, per-case layout or universal retention claim.

## Implementation And Contract

Only `tools/umbrafox/tests/mutations/profile-capture.mjs` and its specification
changed. The new explicit profiling selector is `samples-only`; `on` and `off`
retain their meanings and defaults. Requested capacity remains 1048576 entries,
interval 2 ms, and one mixed page-owned pass. Features add `samplingallthreads`
to `stackwalk`, `js`, `processcpu`, `nomarkerstacks`. The one fixed explicit
thread filter is `UmbraOwnedSamplesOnlyNoThreadSelection`.

An empty filter would select all threads, so it is not used. Source inspection
of `ActivePS::ThreadSelected` and `ProfilingFeaturesForThread` established the
selection contract before editing. Neither package's frozen patch changes the
profiler implementation. The saved CLI inventories contain 292 and 294 threads;
none matches the fixed filter. Configuration is checked before and after work.
No `markersallthreads` or tracing feature is enabled. Content marker exports can
still contain CLI Jank entries; this is not a claim that every marker-like item
disappears globally.

The adapter records existing performance-snapshot `profiler.elapsedTimeMs`
values as a strict finite, increasing `sampleWindow`. No extra browser RPC was
added. That is an outer bracket including transport/snapshot/reporting overhead.
It is not a replacement for individual-case UserTiming boundaries.

All source changes are internal test tooling. No browser source, public API,
preference/default, package, build, install, personal profile or daily browser
was changed. The unchanged fixture still performs actual Window work, not work
inside the UmbraLink transport sandbox.

## Clock And Identity Evidence

`nsProfiler::GetElapsedTime` uses `profiler_time()`, relative to the process
start/epoch. Both prior calibration captures' nine precise markers lie inside
their saved native before/after brackets after adding the CLI raw root start.
This is a saved-data falsifier of the proposed mapping, not a zero-overhead clock.

CLI zoom takes seconds relative to root start, but returned `currentViewRange`
and status ranges are raw root-clock milliseconds. The validator subtracts the
root start for the zoom command and requires returned raw bounds to equal the
native snapshot bounds exactly. It rejects clipped, mixed, non-finite, reversed,
duplicate, filtered or mismatched views.

- A native bracket: [11835.386546, 17974.006837] ms; CLI normalized bracket:
  [830.2524369999992, 6968.872728] ms.
- B native bracket: [11910.925823, 17503.833727] ms; CLI normalized bracket:
  [890.0851279999988, 6482.993032] ms.
- A content PID385056, GeckoMain t-264; B PID389131, GeckoMain t-234.
- Each separate run's document receipt is 10737418242. The native before/after
  fixture URL/window inventories retain the same process identity. Those PIDs
  join uniquely to the CLI thread inventory. Exact fixture-origin `collectDOM`
  frames provide positive stack evidence; they are not per-sample document IDs.

Only profiler-cli parsed the raw captures. All custom analysis consumes the
saved small CLI/native exports. Native symbols were not newly resolved here;
address-only frames remain, so no new native function cost attribution is made.

## Runtime, Bounds And Cleanup

The existing fresh headless profile and child-only private application-data
roots were used on wyatt-laptop. Same sealed BuildID20261003071500 packages:
A libxul SHA `82faf41661bd92231acfaff88da1598f403f63c0a399f9dbd008cb724524b61b`;
B `d00138528b1410b81405fc9533b8771a8284ec98e6968a2bce313bc2177c4231`.

- A: 18:48:43.043-18:49:02.053 UTC; controller384889, browser384903.
- B: 18:53:26.456-18:53:44.978 UTC; controller388951, browser388965.
- Both pass 80 cases, profiler stop and clean owned SIGTERM; 182 log bytes,
  zero drops, six resource samples. Four exact controller/browser PIDs were
  independently absent after completion. No owner browser was touched.
- Maximum sampled artifact bytes: A189979629, B222120994, within the unchanged
  512-MiB ON cap. These are not continuous peaks or final sizes.
- The 105/120-second work/total and 24-MiB profile-copy bounds remain unchanged.
- A raw SHA `23f1029209cbc9aa48171d5faa786979e0c763ea2ab5ce396552b071c60ce904`;
  B `21c1730cfc949cc8f21b1cb0bebcc15c3d235b0e49f3d4f2b85ea381e4d59ca2`.
- All CLI loads explicitly used `http://127.0.0.1:9` as symbol server. Daemons
  1647508, 1648417 and 1653083 stopped with status0 and exact PID/socket absence.

## Verification And Preserved Failures

Assertion-first focused tests: 5 PASS / 5 FAIL before implementation, then all
10 PASS. Final combined tooling suite: 390 PASS. Exact two-file registered lint:
zero errors/warnings. Tests cover configuration, invalid/missing/ordered clocks,
every RPC/save failure, first-error preservation, startup support/barrier failure,
owned shutdown and binary-copy limits. An AST-based comparison against the before
archive confirms old profile options and all old emitted control bodies remain
exactly equal. Workload sources were not edited.

Five saved-data analysis test groups pass, covering wrong count fields, empty
samples, category reconciliation, identity substitution, thread inventory,
offset invariance, clipped/mixed windows and sticky filters. Twenty harness
hashes match locally and remotely before/after. Each run's 35 direct evidence
files were copied and hash-verified. Driver receipts and the remote auditor also
match their local copies. No personal application-data/profile traversal.

The first A exporter incorrectly asserted `filteredCount` instead of the actual
`filteredMarkerCount`. It stopped after the preference export and cleaned up its
own daemon. That script, failed log and export directory remain unchanged. A
schema regression was added; the corrected exporter loaded the same saved A
capture under a new session/directory. No browser retry. Initial three test-only
curly-brace lint errors were corrected before either browser launch.

## Evidence And Next Work

- Harness: `~/.cache/codex/samples-only-harness-20261003-r1cK8x` on laptop.
- Runtime roots: `~/.cache/codex/samples-only-20261003-{A,B}-1` on laptop.
- Direct local exports: `~/.cache/codex/laptop-samples-only-evidence-20261003-{A,B}-1`.
- Accepted CLI exports/audits: `~/.cache/codex/samples-only-analysis-20261003-{A,B}-2`.
- Earlier failed A export: same prefix with `A-1`.
- Scripts, tests, logs, manifests: `artifacts/umbralink-control/` prefixes
  `sampling-only`, `sampling-proof`, `samples-only`, `capture-samples-only`,
  `audit-samples-only`, `export-samples-only`, `analyze-samples-only`.
- Final evidence seal: `artifacts/umbralink-control/sampling-only-final.sha256`.

Next use this verified mode for an explicitly counterbalanced profile/OFF
comparison and exact-package local symbolication. Aggregate samples cannot settle
the earlier individual batched-layout slowdown; use a separately bounded dedicated
workload or validated per-case attribution rather than inventing missing markers.
Headed GPU/video validation still has its separate owner-window consent gate.
All launched commands are terminal; the broad optimization goal remains active.
