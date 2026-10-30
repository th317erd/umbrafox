# Inline Mutation Gate: Page-Level Comparison

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Decision

Functional and sampled-safety gates pass. The candidate remains **uninstalled**.
Detached-text work has a favorable descriptive signal, but interleaved layout is
slower in both batches and in seven of eight adjacent process pairs. Do not
promote the native microbenchmark improvement to a broad page or video claim.
Next: isolate interleaved layout before accepting the candidate for installation.

No production code, owner browser, launcher, extension, personal profile or
display settings changed in this measurement. Headed laptop/GPU testing still
requires the owner's separate consent. The broad performance goal remains open.

## Comparison Contract

- Host: `wyatt-laptop`, isolated headless processes, profiler OFF.
- A is the existing static-pref-mirror native library; B adds the inline inactive
  gate. This is not the older named-preference-lookup comparison.
- Two 46-file copies have identical executable, JavaScript, resources, INIs and
  other files; only `libxul.so` differs. Both use the newer package resources.
- A library SHA256: `d00138528b1410b81405fc9533b8771a8284ec98e6968a2bce313bc2177c4231`.
- B library SHA256: `1e2e164e54d826958361ccff1e4a75bb1c92814f9b87877ab340c3bc56f7f2fb`.
- Shared BuildID: `20261003071500`; it does not distinguish the libraries.
- Pair proof SHA256: `92cc0076f575b28b93c87c1135df544e2630e25c57d2bb40d2d31cfd280e2d86`.
- Harness manifest SHA256: `51ed7b36a6e28f54afba0f4bee46031aa84690aa0e4f426ba237c2b84323115a`.
- The existing page-owned Window collector is unchanged, SHA256
  `ff39082ff809099170529acafe3e9f71ff554265405d95dd71121894df45da65`.
- Eight cases, two warmups and eight measured trials per case/process; 80 samples
  per process. Normal page clocks; ten-second startup quiet; no precision changes.
- Separate A/B semantic checks, then fixed ABBAABBA and BAABBAAB batches. The
  semantic samples are not pooled with measurements, nor are the two batches.
- Compiler admission before every process found no listed compiler processes;
  no waits occurred. This does not establish continuous host exclusivity.
- Existing 105-second work/120-second total/256 MiB sampled-artifact limits
  remain unchanged. Each batch has a 360-second outer watchdog, SSH 400 seconds.
- Full package and harness hashes are checked around captures. Fresh private
  profile/application-data roots receive parent-native directory receipts.

## Results

Values are medians of four process medians, milliseconds. Each process median
uses eight trials. Positive reduction means faster; negative means slower.

| Case | Forward A | Forward B | Reduction | Reverse A | Reverse B | Reduction |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Detached text | 19.50 | 18.00 | 7.69% | 20.75 | 18.75 | 9.64% |
| Attached text | 24.25 | 24.00 | 1.03% | 24.00 | 24.25 | -1.04% |
| Attributes | 94.75 | 94.50 | 0.26% | 97.00 | 94.75 | 2.32% |
| Child list | 42.50 | 42.50 | 0.00% | 44.00 | 43.75 | 0.57% |
| Observer text | 31.00 | 31.25 | -0.81% | 32.50 | 32.00 | 1.54% |
| Batched layout | 10.00 | 9.75 | 2.50% | 11.00 | 10.50 | 4.55% |
| Interleaved layout | 45.50 | 46.00 | -1.10% | 45.75 | 46.50 | -1.64% |
| JavaScript control | 22.75 | 22.25 | 2.20% | 24.50 | 24.00 | 2.04% |

Detached text is faster in seven of eight adjacent pairs; interleaved layout is
slower in seven of eight. Keep both findings. The reverse batch contains broader
variation, including the JavaScript control. No significance, cause, universal
regression clearance or overall browsing-speed percentage is established.
The native inactive-gate microbenchmark remains separate evidence. Enabled
userland-gate cost, real video cadence, GPU behavior and YouTube are not measured.

## Verification And Safety

All 18 processes passed workload ordering, checksums, dimensions, observer
records, page-realm/document identity and disabled-userland/profiler boundaries.
That is 1,440 retained samples, including 288 warmups. All 108 resource samples
passed absolute limits and post-baseline relative limits. Maximum sampled
artifact size was 188,085,525 bytes, not a final-size or continuous cap proof.

All captures ended with clean owned SIGTERM cleanup and zero log drops. All 18
browser roots and three batch-controller roots were independently absent on the
laptop, last checked `2026-10-04T00:02:36.297Z`. This is not exhaustive descendant
or network-isolation proof. Logs retain the known user-namespace EPERM and
headless SWGL framebuffer warnings; this is not hardware-rendering evidence.

Only whitelisted direct JSON, INI and browser-log files were exported. No private
profile, discovery/token, app-data or local-app-data contents were traversed for
export. Local evidence: 551 hashed files, 1,749,075 bytes, plus their manifests.

Fourteen focused test groups pass, including full saved-data replay and 24
in-memory corruption cases. Other tests cover fixed sequences, cross-realm
adapter arguments, failure ordering, manifest/path/symlink/hash/mode checks and
20 audit corruptions. The original 12-group preflight and remote adapter tests
passed before launches. Syntax checks, scoped whitespace/trojan-source lint and
diff checks passed; this is not a new full Gecko suite run.

An offline audit gap was reproduced: copied INI non-BuildID bytes were not
compared to package hashes. The local replay now checks those exact bytes and
browser-log byte accounting. Both RED and GREEN are retained; captured evidence
and timings were not changed. A separate shell-quoted final PID check produced
no usable receipt; it was replaced by a fixed script over stdin. The accepted
receipt is `mutation-inline-page-final-absence-2.json`, not the empty first file.

## Artifacts And Reproduction

All scripts/logs below are under `artifacts/umbralink-control/`:

- `mutation-inline-pair.mjs`: exact native-only pair preparation and validation.
- `capture-mutation-inline-page.mjs`, `compare-mutation-inline-page.mjs`:
  unchanged collector/shared safety driver with fixed comparison orders.
- `mutation-inline-page.mjs`: validated per-process statistics.
- `audit-mutation-inline-page.mjs`: on-host audit and bounded whitelist export.
- `replay-mutation-inline-page.mjs`: independent local hash verification/replay.
- `mutation-inline-page-{semantic,forward,reverse}.log` and corresponding
  `*-audit.json`, `*-replay.json`: exact processes, results and provenance.
- `mutation-inline-page-final-tests-2.log`: final 14 PASS.
- `mutation-inline-page-harness.sha256`: frozen capture dependency closure.
- `mutation-inline-page-final.sha256`: final report/evidence/tooling seal.

Local pair: `~/.cache/codex/mutation-inline-native-pair-20261003`.
Remote harness/pair: `~/.cache/codex/mutation-inline-harness-20261003-F4qaX4`.
Remote captures: `~/.cache/codex/mutation-inline-page-20261003-` with suffixes
`4UONIe` (semantic), `bN7ekD` (forward), `OOB145` (reverse).
Local exports use `~/.cache/codex/mutation-inline-page-evidence-20261003-` and the
same suffixes. Archives are retained separately. Do not rerun exclusive exporters
into these completed directories or mix these results with old native pairs.

The driver invocation is `node compare-mutation-inline-page.mjs PAIR_ROOT
PROOF_SHA MODE` from the frozen harness root, with the full relative script path
`artifacts/umbralink-control/compare-mutation-inline-page.mjs`; mode is exactly
`semantic`, `forward` or `reverse`. Replaying evidence does not require a browser.

No browser process, profiler, test or transfer remains running from this wave.
Existing staged work is unchanged. The preceding native candidate's 139-file
seal remains intact. No install, restart, staging or commit was performed.
