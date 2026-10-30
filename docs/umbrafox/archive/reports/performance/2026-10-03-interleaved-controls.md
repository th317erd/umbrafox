# Interleaved Layout: Identical-Build Controls

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result And Decision

The fixed profiler-OFF batch demonstrates material run-to-run variability even
with identical native bytes. It does not establish that the inline candidate's
small slowdown is a real regression, nor clear that regression risk. Keep the
candidate uninstalled; do not modify synchronous layout semantics based on this
benchmark and do not repeat until a desired sign appears.

Four A/A controls range from -9.09% to +10.98% in median trial time. Four A/B
comparisons range from -3.33% to +4.88%: two slower, one tie and one faster.
Whole-content-process CPU differences overlap as well. Only four pairs of each
kind were measured; overlap is not statistical equivalence or proof of no effect.
The earlier mixed/isolated experiments remain separate, not pooled or erased.

The next rendering branch is a matched-backend, headed GPU/video comparison on
the laptop, subject to owner permission for the temporary window. The owner was
asked; no headed launch follows automatically. Normal browser/profile/extension
state and installation remain protected. The broad performance goal is active.

## Fixed Protocol

This follows [sampling attribution](2026-10-03-interleaved-profile.md), where
profiling reversed the apparent timing direction. This batch uses the same
sealed 46-file native pair, unchanged version-6 `layout-interleaved` Window
fixture and existing capture adapter, with profiling OFF throughout.

The eight adjacent pairs were fixed before execution:
`AA, AB, AA, BA, AA, BA, AA, AB`. A/A means two fresh processes using the exact
same A package. A/B orders are balanced. All 16 runs are retained; none was
selected or retried based on timing. Each process has 12 warmups and 16 trials;
each sample has 2048 class-change/width-read checks and checksum 163840.

Only new scratch driver/audit/tests, this report and continuity changed. No
product source, native build, fixture code, preferences, clocks, owner browser,
installed build or launcher changed. All 30 bundled source/assets retain their
pre-run hashes locally and on the laptop. Pair proof SHA256 remains
`92cc0076f575b28b93c87c1135df544e2630e25c57d2bb40d2d31cfd280e2d86`.
Both packages report BuildID `20261003071500` but differ in libxul:

- A: `d00138528b1410b81405fc9533b8771a8284ec98e6968a2bce313bc2177c4231`.
- B: `1e2e164e54d826958361ccff1e4a75bb1c92814f9b87877ab340c3bc56f7f2fb`.

Native trees are verified before and after every process. All fixture scripts
retain SHA256 `9f4b94551b761261c756d4684c62cf36cb0b8dfcedfbea85561f6ac4c17c246d`.

## Observations

Positive differences mean the second A is slower in A/A, or B is slower in A/B,
independent of launch order. CPU is a separate whole-process measurement.

| Pair | Order | Median ms, in launch order | Time difference | CPU difference |
| ---: | --- | --- | ---: | ---: |
| 0 | AA | 42, 46 | +9.52% | +0.71% |
| 1 | AB | 42, 44 | +4.76% | +2.84% |
| 2 | AA | 44, 40 | -9.09% | -10.03% |
| 3 | BA | 41, 41 | 0.00% | +1.30% |
| 4 | AA | 41, 45.5 | +10.98% | +5.03% |
| 5 | BA | 43, 41 | +4.88% | +4.34% |
| 6 | AA | 41, 41 | 0.00% | -2.85% |
| 7 | AB | 45, 43.5 | -3.33% | -0.87% |

CPU deltas use nondecreasing integer nanosecond counters for exactly one
fixture-URL content process, with unchanged PID and complete window list across
before/after snapshots. Those snapshots have profiling OFF and the expected
parent PID; context/document receipts also agree. CPU covers all content-process
threads, warmup, setup and control work, not just the timed loop. It is not
frequency-normalized. The saved analysis retains every counter and all trial
values. No scheduler, frequency, thermal, JIT or GC cause is inferred.

Normal page-clock precision remains. Sixteen trials inside a process are not
sixteen independent browser replicates. Compiler admission is a bounded check
before each process, not continuous host exclusivity. The controls demonstrate
variability in this protocol; they do not calibrate every other workload.

## Verification And Cleanup

The batch ran October 4 UTC, 00:56:30.134 to 01:00:11.707, which is October 3
in Phoenix. All 448 sample oracles pass: 192 warmups and 256 trials. Native
private application-data paths, BuildID, document identity, page Window realm,
webdriver false, inactive userland flag and profiler OFF receipts pass.

All 80 resource observations pass absolute and post-baseline caps. Maximum
sampled artifact size is 188104420 bytes, not a continuous or final peak.
Existing 105/120-second work/total limits and 256-MiB per-run artifact cap are
unchanged. Batch admission reserves 135 seconds before a new capture and has
a 600-second outer watchdog; there were no retries or deadline failures.

All 16 runs have clean owned SIGTERM cleanup and zero dropped log bytes. Each
182-byte browser log has the same three lines after PID normalization: EPERM
user-namespace warning, headless notice and SWGL framebuffer mapping warning.
This is not hardware-acceleration or physical-presentation acceptance.

The laptop audit independently found all 17 recorded controller/browser roots
absent at 01:00:22.700 UTC. A later exact-root absence receipt is preserved too.
This does not prove exhaustive descendant cleanup or network isolation. No
profiler, symbol server or native compiler was launched by this batch.

Before launch, 71 combined mutation/readback/driver tests passed in 14.135s.
Afterward, seven focused/replay groups passed in 1.068s, including independent
reproduction of all 16 saved runs and 80 actual-evidence corruption cases.
The seven include earlier driver tests; counts must not be added as disjoint
coverage. The initial missing-module RED is a new-contract setup failure, not a
claimed reproduced production bug. Source whitespace/trojan lint is clean.
Staged index bytes remain unchanged, and the preceding 304-file seal passes.

## Evidence

- Local export: `~/.cache/codex/interleaved-control-evidence-20261003-HYqo3u`:
  485 whitelisted files totaling 1429054 bytes, plus `evidence.sha256`.
- Laptop captures: `~/.cache/codex/interleaved-control-20261003-HYqo3u`.
- Laptop harness: `~/.cache/codex/interleaved-control-harness-20261003-50NKKF`.
- Reused laptop pair: `~/.cache/codex/mutation-inline-harness-20261003-F4qaX4`.
- Audits, full CPU/trial records, source bundle, tests, logs and final absence:
  `artifacts/umbralink-control/*interleaved-control*` and matching test files.
- Final evidence seal: `artifacts/umbralink-control/interleaved-control-final.sha256`.

Only whitelisted evidence was exported, excluding private profile trees,
control tokens and application-data contents. Runtime authentication used each
owned test process's discovery file, not the owner's browser profile.
