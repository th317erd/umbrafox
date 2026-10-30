# Startup Profiler Activation Audit

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Finding

The previous turn was progress: a fresh unprofiled control reproduced 24 reported
compositor-category drops, while the no-stack recording reported zero. This
offline follow-up changes the next experiment; it does not establish a browser
optimization or the cause of the owner's prolonged post-seek symptom.

`nostacksampling` is not a switch for all periodic sampling. In the exact pinned
source, `SamplerThread::Run` still samples per-thread CPU utilization, writes
running-time rows, collects counters and wakes at the configured interval. The
latest recording requested no `processcpu` feature, but that does not turn off
per-thread CPU measurement. Both saved before/after receipts explicitly report
`samplingPaused: false`.

`PauseSampling()` is a separate operation. It suppresses the periodic sampling
body while retaining marker collection, but the sampler still wakes, takes its
lock, handles pending work and sleeps again. It must not be described as a
zero-overhead or zero-wakeup recording mode.

## Source Contract

Thirteen inspected source/test files exactly match package base
`892431809a4caadb5c73b2c03ad9bdb124c3e21e`; none is changed by the frozen package
patch. Source-patch SHA256 is
`d1bf3bdfe9f7d36c82181db0b4487592d5b8857b070e43c1b2ee6aaea9cd1677`,
and final-source receipt SHA256 is
`a9befff9082463b5c643889c0e755e5f88a09d674d6aff00b3ad05d89cf1935c`.
`source-proof.json` records complete hashes and bounded excerpts. This is pinned
source review, not runtime branch execution or a new build attestation.

- `nsProfiler::StartProfiler` forwards to `profiler_start`, which initializes
  state, registers selected threads, starts sampling machinery and broadcasts
  startup. Its explicit JS-sampling activation is conditional on the JS feature,
  absent from the latest no-stack request. Do not reuse the earlier JS/JIT
  invalidation explanation without proving another applicable path.
- `SamplerThread::Run` explicitly retains
  [per-thread CPU collection](https://searchfox.org/firefox-main/rev/cfd140a311d8523d3d35e00ee1a9f2403c033dfd/tools/profiler/core/platform.cpp#4978)
  when stack sampling is disabled. The outer scheduling loop remains outside
  the sampling-pause guard.
- `profiler_pause_sampling` sets a separate sampling-pause flag and broadcasts
  `PauseSampling`. `RacyFeatures::IsCollectingMarkers` tests the general paused
  flag, not the sampling-pause flag. The existing `test_pause.js` exercises the
  distinction; it was source-reviewed, not run in a browser this turn.
- The [parent acknowledgement collector](https://searchfox.org/firefox-main/rev/cfd140a311d8523d3d35e00ee1a9f2403c033dfd/tools/profiler/gecko/ProfilerParent.cpp#912)
  settles after either resolution or rejection of each child request. A resolved
  parent promise alone does not prove every child applied the operation.
- [New-child initialization](https://searchfox.org/firefox-main/rev/cfd140a311d8523d3d35e00ee1a9f2403c033dfd/tools/profiler/gecko/ProfilerParent.cpp#752)
  sends `EnsureStarted` with capacity/features/filters, without replaying the
  sampling-pause state in the inspected path. A future sampling-paused trial
  needs a child-lifecycle/coverage guard; parent state alone is insufficient.
  This is a source-supported gap, not a reproduced runtime bug or an implemented
  repair.
- `SandboxProfiler::Create` can add emitter threads, but `Active()` requires the
  `sandbox` feature. That feature was absent in these recordings. This inspected
  route does not justify attributing the difference to sandbox emitter threads.
- `ImageComposite::UpdateBias`, `SetImages`, `UpdateCompositedFrame` and
  `DetectTimeStampJitter` add marker formatting/recording in their profiler
  branches. The actual
  [drop-counter increment](https://searchfox.org/firefox-main/rev/cfd140a311d8523d3d35e00ee1a9f2403c033dfd/gfx/layers/composite/ImageComposite.cpp#253)
  is outside the marker guard. The inspected frame-selection branches do not
  directly disable dropping under profiling. Timing perturbation remains
  possible; no whole-engine absence claim follows from these functions.

Searchfox 0.18.0 advertises 0.20.5; no tool update was performed. Two bounded
large-file fetches timed out, a requested line range exceeded the file length,
and the initial IDL path returned 404. Discovery was completed through identifiers
and the corrected path; the exact local package-base files were then compared.
No missing search result is used to prove absence of a behavior.

## Saved Timing Check

Both earlier pairs were independently revalidated through their existing
reviewers, including explicit partial-only classification for failed profile
copies. All 104 files from their two seals still match.

| Pair | Profiled minus control page age at playback | Profiled minus control content-process age |
| --- | --- | --- |
| Stack-sampled pair | +948 ms | +942.071275 ms |
| No-stack pair | -127 ms | -143.394046 ms |

These are ages within separate documents/processes, not an absolute cross-run
clock or a controlled delay estimate. Per-RPC durations were not saved. The
values contradict a claim that recorded playback always started at an older
page age, but do not eliminate setup, site, cache, geometry or ordering effects.
Both pairs still have 24 control drops versus zero recorded drops. They are not
pooled into a causal effect or statistical result.

## Next Experiment

First separate profiler preparation from ongoing recording: a fixed isolated
laptop A/B/B/A sequence, with A performing an inactive-state sham and B starting
and then stopping the existing profiler before playback. Both must play with
the parent and selected content profiler observed inactive; there is no profile
dump or copy. Record preparation duration and identities without public marks.
The [preconditioning plan](../../plans/startup-precondition.md) specifies the
tests and acceptance boundaries. Implementation and execution are still pending.

If preconditioned-off playback retains the control burst, ongoing recording
remains a candidate. If it loses the burst, that observation would not require
ongoing recording, but would not isolate preparation from extra setup time or
ordinary run-to-run variation. Neither result alone
explains the owner's post-seek recovery. A later sampling-paused recording must
retain the child-acknowledgement/new-child limitations above and demonstrate
actual marker retention. No repeated capture loop or performance-default change.

Artifacts: `artifacts/umbralink-control/startup-activation-audit/`. This turn made
no browser/SSH/profiler-daemon launch, profile parse, product source/default change,
driver installation, personal-data access, staging or commit.
