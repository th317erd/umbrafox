# Frame Reuse GPU Correctness

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

The packaged frame-conversion reuse candidate passes the existing laptop GPU
pixel and retained-decoder-loss gates. All 48 import-OFF pixel hashes match the
preserved full-size reference; all 48 import-ON hashes match OFF. Four retained
RGBA buffers in each comparison are byte-identical. Repeats are stable in both
captures, including filtering cases. Both decoder-loss modes match all eight
reference comparisons, including exact pixels and exception names.

This advances P2 of the [reuse plan](../../plans/video-import-reuse.md), but does
not complete it. The measurements do not establish runtime cache-hit frequency,
graphics-context recovery, playback performance or a YouTube stutter fix. No
production source, preference default, shader, tolerance or collector changed.
Direct GPU import remains default OFF and the daily browser is unchanged.

## Package And Execution

The normal 46-file candidate is
exports/umbrafox-import-frame-reuse-20261006/. Package manifest SHA256:
9ec305adc36c8c1e362ed6e74925c8c473efd999212d354c6f11431ca17b8678.
BuildID 20261006175655 matches native receipts and adjacent metadata. The
same-BuildID baseline is distinguished by full package hashes, not the ID alone.
The earlier package and 40 native regressions remain separately sealed in the
[mechanism report](2026-10-06-import-frame-reuse.md).

The new laptop harness has 152 files, retaining all 146 existing inputs unchanged.
Its SHA256 is
3fbdccfffd09f07b274b54c86f4fbc971269c92a845e1e480c1e44ec7a3ffe1c.
Nine wrappers retain the previous driver/export/admission behavior; only artifact
namespace, exact candidate identity and complete harness count change. Static
imports cover 32 modules. The normal package excludes the separately built gtest
overlay. No test-library overlay is used for these browser captures.

Each arm passed exact package/harness, available-memory/disk and no-browser/build
preflight. Fresh private installation, profile, application-data, local-data and
temporary roots remain inside the owned output. Bounds remain 120 seconds total,
105 seconds work, 15 seconds cleanup, 220 seconds driver and 240 seconds SSH.
Runs were serialized, with completed export/validation before the next launch.

| Arm | Root Suffix | Controller / Browser PID | Duration, ms | Public Files | Export Bytes |
| --- | --- | --- | ---: | ---: | ---: |
| Pixels OFF | MXd8mv | 1743786 / 1743798 | 16049 | 38 | 1387067 |
| Pixels ON | TZBUL4 | 1746774 / 1746786 | 16103 | 38 | 1387042 |
| Loss OFF | BcrVHl | 1749072 / 1749084 | 12883 | 49 | 2591876 |
| Loss ON | vRGAhU | 1751334 / 1751348 | 12797 | 48 | 2590444 |

The runs occurred October 7 UTC, October 6 local time. All use wyatt-laptop,
Intel Iris Xe RPL-P, Mesa/iris 25.2.8.0, X11/WebRender, and hardware H.264 decoding
through ffmpeg in RDD at the measured nonzero video times. The initial paused
decoder status is not used as active-decoder proof. Primary canvas observations
are accelerated; the explicitly frequent-readback control remains software.
Those observations do not prove each draw's import or reuse path.

## Loss And Cleanup

The existing owned-decoder test permanently shuts down RDD; it does not simulate
crash/restart recovery. Both captures establish the exact decoder's single-thread
zombie state on the second poll. At that point it is terminated, not yet absent
or reaped. A cold-frame probe confirms readback unavailability before post-loss
comparisons. Retained warm/cold video draws raise the reference InvalidStateError,
while the already-copied bitmap still draws with unchanged pixels.

All four browser roots end through clean owned SIGTERM cleanup with zero dropped
log bytes. Public exports total 173 files and 7956429 bytes. All exported bytes
are rehashed locally; no profile, token or application-data payload is exported.
There are 22 resource samples, with peak artifact size 66350461 bytes below the
unchanged 256 MiB limit. Resource and post-baseline checks replay successfully.
All 46 immutable package files match after each run.

Exporters check recorded process absence, and a separate final laptop check at
2026-10-07T01:12:32.313Z confirms all 50 distinct recorded PIDs absent, including
both decoders. This does not enumerate every transient process or prove continuous
network/filesystem isolation. Native root receipts are post-startup evidence.

Logs preserve the existing sandbox EPERM warning, VA-API initialization, and the
expected abnormal VideoBridge close during intentional decoder shutdown. The
initial final-absence command failed shell quoting before executing its check;
the preserved second command passes using stdin. No browser was rerun for it.

## Verification And Limits

Eighteen focused preparation and saved-data tests pass. They verify namespace-only
driver equivalence, wrong-package rejection, all exported hashes, document/context
joins, raw-buffer identity, exact pixel comparisons, cold failure and decoder
termination evidence, resource caps, native roots, chronology and cleanup.
Corruptions include stable-but-wrong repeated pixels, wrong mode/document/context,
missing frames and changed post-loss error expectations. The final summary is
replayed against original captures rather than treated as independent proof.

Initial missing-module tests are scaffolding, not production REDs. The offline
reader initially rejected the valid reference label; its failing test is retained.
One replay assertion incorrectly expected the pixel collector's top-level mode
field in the loss collector. Source inspection confirmed the loss producer's
observation/summary fields; only the test was corrected. Original captures remain
unchanged and no acceptance predicate was relaxed.

Explicit formatting checks cover six newly authored offline files and the seal
writer. The first formatter invocation ignored the artifacts directory; the
final invocation explicitly overrides that ignore path and lists all seven files.
The 18-test suite passes again after formatting. Scoped documentation lint has
zero errors or warnings. Generated
runtime adapters retain their exact source bytes for equivalence and provenance.
Final source checks retain 65 product/test pins, 146 prior harness inputs, HEAD,
index and configuration. No native build, install, staging, commit, profiler,
desktop browser action or Pi operation occurred in this phase.

Evidence is artifacts/umbralink-control/import-frame-reuse-gpu/. The independent
phase inventory is import-frame-reuse-gpu-final.sha256 in its parent directory.
Previous mechanism, pixel-reference and descriptor-correctness seals are
independently rechecked and unchanged.

The pixel collector reads pixels after individual draws, which can invalidate
reuse state. It therefore cannot prove effective same-batch reuse. Remaining P2
work is a repeated/alternating-frame, multiple-canvas and context eviction/recovery
matrix with suitable execution evidence. Then P3 compares the immediate pre-cache
package against this candidate in the fixed A1/B1/B2/A2 playback sequence. The
earlier smoothness failures and renderer-label CPU increase remain unresolved.
