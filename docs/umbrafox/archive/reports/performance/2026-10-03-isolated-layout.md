# Isolated Layout Follow-Up

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Predeclared Question

The two window-realm mixed-workload batches show slower batched-layout process
medians, but their later trial halves are nearly equal. This experiment asks
whether the signal persists when that exact layout loop runs alone with fixed
warmup. It does not change the browser or claim to identify a mechanism.

The fixed plan is 12 warmups followed by 16 trials, all retained, with a 20-ms
wait before each sample. Each sample creates the same 32 rows outside timing,
performs 64 alternating class rounds and reads every row width after each
round. The 2048 reads must sum to 163840; initial and final widths must be 64.
Setup and removal stay outside the measured operation. No adaptive stopping,
precision changes, profiler, network workload or discarded slow trials.

The new fixture version is 3, workload `layout-batched`, with the existing
version-2 window realm envelope. The mixed collector, plan, metadata and
validation remain unchanged. Legacy results cannot pass the new validator.
Shared native-root admission, fresh profile/application-data directories,
105/120-second work/total limits, 256-MiB artifact cap and owned cleanup remain.

After failing-first tests and one semantic run, the first comparison is eight
fresh processes in A B B A A B B A order on wyatt-laptop. A and B are the same
sealed baseline/mutation-mirror packages used in the window-realm comparison.
Use process medians, not trials as independent replicates. Any failing run
stops the batch; no automatic retry, cap increase or partial aggregate.
Compiler admission remains required before each launch. Host activity and
CPU frequency are not controlled, so direction alone does not prove causality.

## Verification And First Runtime Failure

Failing-first checks rejected the old fixture version and validator, plus the
new layout capture. Two initial failures were missing collector exports, not
behavioral evidence. Initial combined tooling passed 370 tests and exact
five-file lint reported zero problems. An AST check verifies source-identical
timed layout functions. Existing sandbox and mixed-window metadata, assets and
collector hashes remain identical apart from ephemeral origins.

The first semantic browser run failed before any measured samples at
16:34:49.152 UTC, 2026-10-03. Its adapter forwarded the shared runner's sixth
argument, an AbortSignal, into the new workload selector. Direct capture tests
had not exercised the main adapter. A new main-definition test reproduced that
exact argument-contract failure for both mixed and layout modes. The correction
passes only the five required capture arguments followed by the trusted fixed
workload selector; the enclosing bounded operations still own cancellation.

The failed run and original harness are preserved at
`/home/wyatt/.cache/codex/layout-isolated-semantic-20261003-1` and
`/home/wyatt/.cache/codex/layout-isolated-harness-20261003-WCS7Hf` on the laptop.
Browser PID296003 and controller PID295991 were checked absent there. Cleanup
was clean owned SIGTERM; the 182-byte browser log had zero drops. No sample
file exists, and this is not a browser performance result.

## Corrected Semantic Gate

The corrected implementation passes 371 combined tooling tests and scoped
five-file lint with zero problems. The new test reproduces the shared runner's
complete argument list rather than testing only `captureDOM` directly.
Four invalid batch-driver arguments reject before output creation, and the
new analyzer rejects an old mixed-workload batch without changing its output.

The second semantic run completed 16:38:34.511-16:38:46.883 UTC. Its 28 samples
passed exact schedule, geometry and realm validation; workload time was 1024 ms.
Control transport still reports `globalThis !== window`, while all four actual
collector realm checks are true. Context 10/document 10737418242 matches the
measurement identity. Native roots and the sealed candidate libxul hash match.
Userland-active and profiler boundaries are false. Exactly two GETs returned
the 372-byte HTML and 4383-byte script. Five resource samples pass their caps.
Browser PID301645/controller PID301633 were independently checked absent on the
laptop; clean SIGTERM, 182 log bytes and zero drops. This semantic run is not
part of the timing batch.

Replacement source lives in the separately sealed remote harness
`/home/wyatt/.cache/codex/layout-isolated-harness-20261003-imj4Qa`; the run is
`/home/wyatt/.cache/codex/layout-isolated-semantic-20261003-2`. The first snapshot
and failed run remain unchanged. No private profile/application-data contents
are inspected for this acceptance.

## Timing Gate

The first complete batch ran 16:40:15.092-16:41:54.694 UTC, with 224 valid samples
across eight independent processes, 40 resource observations within caps and
clean owned cleanup. All eight browser roots and the controller were checked
absent on the laptop. The 230 whitelisted direct evidence files were copied and
SHA-256 verified locally. Maximum sampled artifact size was 188037717 bytes,
not a peak or final-size measurement.

Baseline process medians are 15.5, 15, 16 and 14 ms; candidate medians are
16, 15.5, 15 and 16.5 ms. Their respective medians are 15.25 and 15.75 ms,
a 3.3% higher candidate value with overlapping process ranges. This is a
descriptive result, not significance, equivalence or proof that the mixed
workload signal is harmless. The longer warmup, removed competing cases and
different caller specialization are simultaneous experimental changes, so this
does not isolate which one matters.

The separately fixed reverse batch B A A B B A A B also completed and passed,
16:43:56.430-16:45:36.180 UTC. Only its sequence and self-provenance filename
differ; an exact reverse-delta check and remote hash verification pass. Its
224 samples, 40 resource observations, native receipts and cleanup pass the
same saved-data audit. Another 228 direct evidence files were copied and
SHA-256 verified. Maximum sampled artifact size was 187950146 bytes.

| Batch | Baseline process medians (ms) | Candidate process medians (ms) | Median A | Median B | Candidate change |
| --- | --- | --- | ---: | ---: | ---: |
| A B B A A B B A | 15.5, 15, 16, 14 | 16, 15.5, 15, 16.5 | 15.25 | 15.75 | +3.3% |
| B A A B B A A B | 15.5, 16, 16.5, 13 | 15.5, 16, 15.5, 16 | 15.75 | 15.75 | 0.0% |

Splitting each process's trials into eight early/eight late readings gives
median process-half times A 15.50/15.00 versus B 16.00/15.25 ms in the first
batch, and A 16.00/15.50 versus B 15.75/15.75 ms in the reverse. All warmup and
trial rows are retained in `layout-isolated-final-check.json`; no subset replaces
the predeclared process-median result. Its 14 current source hashes match each
batch's captured hashes. Geometry/oracle checks cover all 448 samples across
the two batches, including 192 warmups; trials within a process are correlated.

The previous 10-18% mixed-workload penalty does not reproduce at that magnitude
here. This weakens a uniform per-layout penalty hypothesis, but does not clear
the original signal or prove performance equivalence. Normal clock precision,
small process counts, host activity and simultaneous workload/warmup changes
limit interpretation. No causal GC, JIT, scheduler, style or GPU claim follows.

All 16 comparison browser roots and both batch controllers were independently
checked absent on the laptop. Both semantic roots/controllers, including the
original failed run, are also absent. No capture, profiler, server, test or
transfer from this follow-up remains running. No source changed during timing;
the A/B packages, installed browser and prior capture evidence are untouched.
No install, native rebuild, public API or headed-window change occurred.

## Next Attribution Gate

Profile the actual page-owned mixed workload, with strict same-document phase
joins and matched native symbols, to distinguish layout/style work from
GC/JIT/scheduling interactions. Use a separately versioned adapter, retain
profiler overhead controls and existing resource/cleanup bounds, and do not
substitute profiled times for these unprofiled comparisons. The legacy
`profile-dom.mjs` still uses the sandbox and is not suitable unchanged.
The native candidate remains uninstalled; the independent headed hardware
readback baseline also still needs separate window consent.

## Evidence

- First remote batch: `/home/wyatt/.cache/codex/layout-isolated-comparison-20261003-CQOCDO`.
- First local export: `/home/wyatt/.cache/codex/laptop-layout-isolated-evidence-20261003-CQOCDO`.
- Reverse remote batch: `/home/wyatt/.cache/codex/layout-isolated-comparison-20261003-bUDs0U`.
- Reverse local export: `/home/wyatt/.cache/codex/laptop-layout-isolated-evidence-20261003-bUDs0U`.
- Semantic exports: `/home/wyatt/.cache/codex/laptop-layout-isolated-semantic-evidence-20261003-1`
  (21 files, failed) and suffix `-2` (27 files, passed), all hashes verified.
- Source/test/runtime and failure logs: `artifacts/umbralink-control/layout-isolated-*`.
- Separate drivers: `compare-layout-isolated.mjs` and `compare-layout-isolated-reverse.mjs`
  in the same artifact directory, with their analyzer and laptop saved-data audit.
- Final source/test/report/log and exported evidence-manifest seal:
  `artifacts/umbralink-control/layout-isolated-final.sha256`.
