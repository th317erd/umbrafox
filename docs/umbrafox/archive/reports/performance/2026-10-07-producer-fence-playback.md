# Producer Fence Matched Playback

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Decision

The local producer-fence candidate does not pass its prospective performance
gate. The fixed A1/B1/B2/A2 comparison passes all 29 existing regression criteria,
but both candidate runs fail the separately required CPU benefit. Elapsed-weighted
joined CPU is only 0.137% lower, below the 1.555% baseline-control spread. This is
not a demonstrated speedup, a stutter fix, or justification for daily promotion.

All seven captures pass their functional, identity, resource and cleanup checks:
one matched-baseline pixel capture, two baseline noise controls, and four timing
captures. No capture was repeated, excluded or replaced. No threshold was relaxed.
The GPU import default remains OFF; the owner desktop browser, installation,
profile, launcher and Pi were untouched. No product source or native build changed
in this phase. The broader rendering/layout/CSS/JavaScript objective remains open.

## Prospective Protocol

The [sealed plan](../../plans/producer-fence-playback.md) fixed the protocol before
any timing. This report supersedes its historical not-started runtime status,
without modifying that sealed plan or the [matched-pair evidence](2026-10-07-producer-fence-pair.md).

Both arms enable GPU import and disable profiling. Each fresh headed browser
plays the same owned 1920x1080 H.264 fixture for 48 seconds, drawing into a 320x180
default canvas. Four 12-second phases perform 1/4/4/1 copies per video callback.
No new per-frame instrumentation, readback or GPU wait was added. The page clock
has its ordinary resolution: a recorded zero is not a free GPU operation.

N1 and N2 use the same matched baseline in independent fresh processes. Their
CPU rates are 0.563657817 and 0.555029075 CPU seconds per elapsed second. The
maximum/minimum ratio minus one is 1.554647%, below the fixed 3% admission limit.
The minimum benefit was therefore fixed at 3.109294% before A1, as prescribed by
max(2%, twice the observed spread). Each B must beat the better A by that amount,
in addition to passing all 29 unchanged regression criteria. This is an
engineering screen, not a confidence interval or a population effect estimate.

## Measurements

| Measurement | A1 Baseline | B1 Fence | B2 Fence | A2 Baseline |
| --- | ---: | ---: | ---: | ---: |
| CPU window, seconds | 48.111 | 48.091 | 48.096 | 48.077 |
| Joined CPU, seconds | 27.290 | 27.597 | 26.486 | 26.868 |
| CPU seconds per elapsed second | 0.567231 | 0.573847 | 0.550683 | 0.558840 |
| Browser CPU, seconds | 19.551 | 19.910 | 18.647 | 19.065 |
| RDD CPU, seconds | 1.936 | 1.909 | 1.996 | 2.015 |
| Content CPU, seconds | 5.576 | 5.577 | 5.636 | 5.576 |
| Four-copy batch median, ms | 1 / 1 | 0 / 1 | 1 / 1 | 1 / 1 |
| Four-copy batch P95, ms | 2 / 2 | 2 / 2 | 2 / 2 | 2 / 2 |
| Gaps over 50 ms, phases 0-3 | 4 / 0 / 0 / 0 | 4 / 0 / 0 / 0 | 3 / 0 / 0 / 0 | 2 / 0 / 0 / 0 |
| Longest callback gap, ms | 54 | 52 | 65 | 53 |
| Video drops, every phase | 0 | 0 | 0 | 0 |

The elapsed-weighted baseline rate is 0.563037085; candidate rate is 0.562264536.
The allowed candidate maximum was 0.541464273, so neither B passes. Candidate
within-mode spread is 4.2065%, versus 1.5014% for the comparative baselines.
The favorable B2 alone cannot support acceptance, nor can the pooled 0.137%
difference be treated as an improvement above noise.

All six timing captures retain 295-298 callbacks per phase. Both canvas boundary
observations are accelerated in every run. After-playback decoder receipts report
hardware-accelerated ffmpeg/RDD and zero decoder, sink, compositor and container
drops. N1/N2 each have five phase-zero gaps over 50 ms and no video drops.
The existing numeric screen checks gap counts, not equality of maximum gap:
B2's 65 ms maximum remains visible despite the 29/29 result. This is not a
tail-latency or physical-presentation guarantee.

CPU sums include only the stable endpoint PID/childID/type population joined
to sampled start identities. Unsampled transient work and observer cost are not
excluded. There is no CPU-affinity, frequency or thermal control, and only two
comparative processes per arm. The old approximately 154 ms Renderer stall and
previous failed import/frame-reuse smoothness screens remain unresolved.

## Matched Inputs And Pixels

- A: native Build20261006175655, manifest
  09261b9b755eb2295aa92393ddaab215ab8936cb79ebd27699ab8695ca3d1eae.
- B: native Build20261007133500, manifest
  ff1060705138f6d519b4473b94410f69c4dad1d9682fef3c6596c8cc513b534b.
- Both normal packages contain 46 files, not the 48-file native-test overlay.
  A is 475108995 bytes and B is 475111027 bytes, excluding the empty runtime lock.
- Both have the identical attachment-metadata implementation. Original native
  libraries, launchers and corresponding native/INI/AppConstants identities are
  retained; the pair proof documents the remaining generated identity differences.
- New matched A passes all 48 ordered pixel hashes and four retained full RGBA
  comparisons against both its prior baseline and the saved B pixel capture.
  B's earlier packaged pixel/loss and 61 native tests remain separate prior
  correctness evidence, not rerun performance proof.
- Host receipts identify wyatt-laptop, Intel Iris Xe RPL-P, X11 and WebRender.
  The successful nonzero-seek and playback decoder receipts support hardware
  decoding. Endpoint acceleration does not prove every import or local-fence
  reuse operation executed; no hit-frequency counter exists in this wave.

## Execution And Cleanup

Each capture uses fresh private installation/profile/application/local/temp roots.
The 15-second settle and successful hash/resource/no-browser-or-build preflight
precede each launch. Limits remain 120 seconds per capture, including 15 seconds
for cleanup; driver and SSH limits are 220 and 240 seconds. Each completed prefix
was validated before launching its successor. No failed command was ignored.

| Capture | Root suffix | Browser / Controller PID | Start UTC | Finish UTC |
| --- | --- | --- | --- | --- |
| Matched A pixels | 1vM4Xe | 2024381 / 2024369 | 15:25:24.283 | 15:25:40.434 |
| N1 | qC7VFA | 2026798 / 2026786 | 15:27:34.018 | 15:28:33.908 |
| N2 | DrOElG | 2029272 / 2029260 | 15:29:59.584 | 15:30:59.350 |
| A1 | qzk13G | 2031755 / 2031743 | 15:32:37.934 | 15:33:37.858 |
| B1 | jPw5tF | 2034257 / 2034244 | 15:35:17.956 | 15:36:17.797 |
| B2 | qtU3fY | 2036850 / 2036818 | 15:38:31.596 | 15:39:31.385 |
| A2 | pa1ffz | 2039371 / 2039359 | 15:41:30.787 | 15:42:30.637 |

All timestamps are October 7, 2026. Exact roots are in summary.json. Seven owned
SIGTERM cleanups pass, with zero log drops. Public exports contain 302 files and
3438952 bytes; 90 resource samples satisfy the unchanged caps. Peak sampled run
artifact size is 146169740 bytes, below 256 MiB. No profile, discovery credential,
application-data contents or shared crash queue was exported.

Both package/harness postflights pass. All 84 distinct recorded PIDs were
independently absent at 15:44:31.461 and 15:44:32.713 UTC, in bounded batches.
No full descendant-history or OS/network sandbox claim follows. Logs preserve
the namespace EPERM warning and successful VA-API initialization messages.

## Verification And Evidence

The new runtime harness has 153 files: 146 unchanged shared inputs and seven
adapters. Its SHA256 is
41da7ff1b712650e0f578d516ff9f3332457ed363fb28ec957e5aabb56f01018.
Static relative-import closure, exact frozen-template transformations and all
94 source pins are checked. The collectors, budgets, cleanup and 29 regression
predicates are unchanged. The adapters add per-arm native IDs, matched manifests,
the two prospective controls and their fixed benefit calculation.

Focused tests cover malformed admission, wrong host/display/package, mixed
native IDs, stale/overlapping/incomplete receipts, numerical regressions, noisy
controls, altered thresholds and both candidate benefit requirements. Saved-data
tests reproduce all six prefixes and the final decision exactly, independently
sum raw endpoint CPU counters, recount callback gaps/drops, replay the pixel gate
and join final PID-absence receipts. No captured data is modified by the tests.

Initial development failures included a wrong test-relative path and a missing
new noise helper; these are harness construction failures, not product RED proof.
The old admission's rejection of the new package pair is intentional. Final
verification in final-tests.log passes all 23 focused groups without failures or
skips. Explicit formatting checks for the new saved-data spec and sealer pass;
the first formatter invocation used the repository ignore list and did not format
artifact files, so it was replaced by the exact-file explicit invocation.
No native build or broad browser
suite was rerun for these diagnostic adapters. The broad 461-test and 61-native
results belong to prior phases, not this runtime comparison. Registered report
lint is recorded separately; these agent reports are outside the Sphinx tree.

Evidence namespace: artifacts/umbralink-control/producer-fence-playback/.
Laptop harness root:
/home/wyatt/.cache/codex/producer-fence-playback-harness-20261007-t27Mxk.
The final seal is artifacts/umbralink-control/producer-fence-playback-final.sha256.
Once sealed, do not regenerate, unpack, overwrite logs or repeat write-once
analysis commands in that namespace. Read-only replay:

```sh
timeout 30 node --test --unhandled-rejections=strict artifacts/umbralink-control/producer-fence-playback/test/*-spec.mjs artifacts/umbralink-control/producer-fence-gpu/test/*-spec.mjs
timeout 30 node artifacts/umbralink-control/producer-fence-playback/prepare.mjs verify
timeout 30 node artifacts/umbralink-control/producer-fence-playback/seal.mjs
```

## Next Decision

Do not promote this fence change as a performance improvement or repeat this
identical wave to seek a favorable result. Fewer source-level operations and
passing native lifetime tests did not translate into the required playback gain.
This does not prove a zero effect on every workload or hardware configuration.

If revisiting this specific optimization, first establish actual retained-fence
hit frequency and whether saved reconstruction work is displaced elsewhere.
That would need a separately designed private diagnostic and observer control,
not a new public interface or a synchronization shortcut. Otherwise resume the
larger compositor/stutter investigation from the sealed current-package evidence;
account for its measured profiler overhead rather than assuming its sampled
fence stacks explain the rare stall. Default promotion and daily installation
remain separate gates. No staging, commit or push occurred.
