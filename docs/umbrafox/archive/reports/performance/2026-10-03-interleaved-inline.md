# Isolated Interleaved Layout: Inline Mutation Gate

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

The inline inactive-gate candidate is not cleared for promotion. Two isolated
headless laptop batches still have higher candidate process medians, by 1.16%
and 5.00%. Functional checks pass, but neither causality nor statistical
significance is established. The candidate remains uninstalled.

| Fixed order | Baseline process medians, ms | Candidate process medians, ms | Median A | Median B |
| --- | --- | --- | ---: | ---: |
| ABBAABBA | 41, 46, 45.5, 41 | 41, 43.5, 48.5, 44 | 43.25 | 43.75 |
| BAABBAAB | 40, 40, 45.5, 40 | 42, 43, 42, 41 | 40 | 42 |

Five of eight adjacent A/B pairs favor the baseline, two favor the candidate,
and one ties. Variation occurs within both variants. Trials in one process are
not independent replicates. Normal page-clock precision, host activity, JIT
warmup and frequency variation remain limitations; no causal explanation is
inferred from these timings. The separate semantic A/B runs measured 44 and
51.5 ms and are not included in the two comparison batches.

Do not pool this experiment with the preceding mixed-workload comparison.
Removing the other cases changes workload history and caller specialization,
even though the timed inner loop is source-identical.

## Controlled Inputs

The unchanged 46-file pair differs only in `libxul.so`. All JavaScript and
resources are common. Both builds report `20261003071500`, so their full hashes,
not the shared build ID alone, identify the variants:

- A, static-pref mirror: `d00138528b1410b81405fc9533b8771a8284ec98e6968a2bce313bc2177c4231`.
- B, inline inactive gate: `1e2e164e54d826958361ccff1e4a75bb1c92814f9b87877ab340c3bc56f7f2fb`.
- Pair proof: `92cc0076f575b28b93c87c1135df544e2630e25c57d2bb40d2d31cfd280e2d86`.

The fixture is version 6, `layout-interleaved`, with 12 warmups and 16 trials.
Each sample performs 64 rounds over 32 rows, alternating a class assignment
with an `offsetWidth` read: 2048 changes/reads and checksum 163840. Initial and
final widths must be 64. The 20-ms wait, setup and removal are outside the inner
timing. All observations are retained. Profiler is OFF; no clock preference,
native source, DOM algorithm, default, public interface or owner profile changed.

Only five mutation test-tool files changed. The original mixed collector hash
remains `ff39082ff809099170529acafe3e9f71ff554265405d95dd71121894df45da65`;
the exact shared timed-loop hash is
`a2a316eed504fa6e14a58708d6d38856717faa0d716c3db9c14bef80a0065845`.
The complete fixture script hash is
`9f4b94551b761261c756d4684c62cf36cb0b8dfcedfbea85561f6ac4c17c246d`.

## Execution And Verification

All 18 fresh processes passed, yielding 504 samples: 216 warmups and 288 trials.
The two timing batches ran October 4 UTC, 00:22:09-00:24:00 and
00:24:38-00:26:27 (October 3 Phoenix). Every compiler admission check was empty;
that is not continuous host exclusivity. The existing 105/120-second work/total
limits and 256-MiB sampled artifact cap remained unchanged.

Ninety resource observations pass absolute and post-baseline caps. Maximum
sampled artifact size is 188072524 bytes, not a final size or continuous peak.
All native roots, fixture document/Window realm, checksums and exact two-request
HTTP receipts pass. Every run has clean owned SIGTERM and zero dropped log bytes.
Logs retain the same EPERM user-namespace and headless SWGL warnings; this is
not hardware-acceleration acceptance or a no-network claim.

Remote audits and independent local replay both pass. There are 536 exported
evidence files totaling 1424631 bytes, plus three manifests. Only whitelisted
direct evidence was copied, not private profile/application-data contents.
All 21 recorded browser/controller roots were independently absent at
00:33:18.642 UTC. This is not exhaustive descendant coverage.

Behavioral RED: 9 pass / 4 expected failures. Final combined tooling: 50 groups
pass, zero failures, 13.655 seconds, including saved-data replay and corruption
tests. Exact five-file lint has zero problems. Both failed early lint attempts
and the replay test's initial path/stub failures remain preserved. The final
runtime bundle was produced after formatting, and all 24 bundled hashes still
match. The source delta is reviewed against the retained pre-edit archive;
these untracked files would be invisible to ordinary `git diff`. Staged index
bytes match the previous milestone. No install, restart, build or owner tab
operation was performed.

## Evidence And Next Step

- Local evidence: `~/.cache/codex/interleaved-inline-evidence-20261003-{kd6shu,ErHMnO,CtqqOe}`.
- Laptop captures: `~/.cache/codex/interleaved-inline-20261003-` with those same suffixes.
- Laptop harness: `~/.cache/codex/interleaved-inline-harness-20261003-RDIktu`.
- Reused laptop pair: `~/.cache/codex/mutation-inline-harness-20261003-F4qaX4`.
- Scripts, original source archive, source diff, tests, logs and replay outputs:
  `artifacts/umbralink-control/*interleaved-inline*`.
- Final seal: `artifacts/umbralink-control/interleaved-inline-final.sha256`.

Next, use the existing sampling-only profiler route with this unchanged fixture
to locate CPU work. Profiled observations remain attribution evidence, separate
from unprofiled performance decisions. No speculative layout change follows
from this small timing difference. Headed GPU/video testing remains separately
permission-gated; the broad performance goal remains active.
