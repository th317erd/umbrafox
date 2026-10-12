# Scaled Readback Filtering And Conversion Order

## Result

The scaled DMABuf readback path inherited nearest-neighbor sampling from
`GLContext::TexParams_SetClampNoMips`. The same setting is suitable for the
historical full-size conversion but does not reproduce subsequent linear RGB
resizing. This is a concrete source finding, consistent with the owner's
filtering observation; it does not prove that every visible artifact or stutter
had this cause.

A new real-GL native regression reproduces a mismatch before production edits:
an 8x4 YUV input with alternating saturated luma, resized to 4x2, differs from
full-size readback followed by accelerated canvas resizing in 24 components,
maximum 110 levels. Constant color, same-size and chroma-edge controls pass.
All 17 existing import/upload regressions pass. No test is skipped.

The candidate correction performs full-resolution YUV-to-RGB conversion into
an 8-bit GPU texture, then explicitly linearly samples that RGB texture into
the destination-sized framebuffer before readback. It preserves conversion,
clamping and quantization order instead of merely enabling linear YUV sampling.
The latter alternative was not independently run or measured in this phase.

The corrected test library passes all 24 native tests. The original regression
and all six pixel comparisons have zero differing components; the seventh new
test checks empty-destination rejection followed by successful readback. This
is native synthetic-input acceptance, not real-video, full Firefox parity,
performance, GPU-driver robustness or deployment acceptance.

## Implementation And Boundaries

Production change: `DMABufSurface::ReadIntoBuffer` in
`widget/gtk/DMABufSurface.cpp`, 35 additions and four removals against the saved
pre-change working source. Only existing scaled requests with different source
and destination sizes use the extra pass. Full-size and unscaled crop behavior
retain their prior draw route. Scoped GL objects retain the temporary textures
and framebuffers; allocation/framebuffer failures return failure to the existing
readback fallback. No explicit GPU wait, hot error query, CPU full-frame copy,
public API, new preference or serialization change was added.

New GTK-only native test: `dom/canvas/gtest/TestDMABufReadback.cpp`, registered
in the existing gtest library. It supplies real GL plane textures to the actual
DMABuf readback implementation. Its separate reference uses full-size readback
and `DrawTargetWebgl::DrawSurface` with linear sampling. It checks a WebGL
snapshot, repeated scaled output, GL errors and actual pixel bytes. It bypasses
only the production minimum-size factory heuristic via direct `Init`.

The tests do not allocate a decoder DMABuf or exercise EGL import, VA-API,
modifiers, fences, remote IPC, driver OOM or context loss. The GL vendor/renderer
was not exported, so these results do not establish a specific hardware driver.
The reference is this build's historical full-size route, not stock Firefox.

The separate blur-repeat discrepancy is unchanged. Filtered Canvas2D draws
bypass the sized helper; this correction is not a demonstrated blur fix.
The new full-size intermediate has memory and GPU cost that must be measured.
Destination-sized readback is retained, but no speedup is claimed here.

## Native Runs

| Run | Result | Controller / native PID | Absent recorded PIDs |
| --- | --- | --- | --- |
| Initial test setup | 17 pass, four setup failures | 1419401 / 1419413 | 3 |
| Corrected native RED | 20 pass, one pixel failure | 1427225 / 1427237 | 3 |
| RGB candidate | 24 pass, zero failures/skips | 1435011 / 1435023 | 3 |

All three completed with clean owned shutdown and unchanged 48-file diagnostic
installations. Four evidence files per run were copied and checked against
remote size/SHA256 receipts. The recorded PID absence checks cover the
controller, native test root and log-identified child, not every transient
helper. Each runner keeps the existing 30-second work, 45-second total,
one-MiB log/result caps, fresh private application-data roots and no-report /
nonlocal-connection guards. No personal profile or data payload was exported.

Fresh laptop harness roots have suffixes XpUin0, AbpPw1 and WJKuep under
`~/.cache/codex/readback-order-gtest-harness-20261006-`.
Final native run root is
`~/.cache/codex/readback-order-rgb-427f5e1e-f9fc-4844-895e-96e705683698`.
The final runner uses manifest SHA256
`3cd7015be34f4af2efbca22637a0cafbee67adf3c5e5b982d5fbd1f4f536a4cc`;
test-library SHA256 is
`8230d5b3e2972813db3f4a85ddd32603cd1caa826ce3782de4476ee545716050`.
The loader is the earlier admitted diagnostic package with a separately
hashed current test library, not an integrated playback package.

## Verification And Preserved Failures

Scoped widget compilation and subsequent gtest linking passed with zero
warnings. Final native clang-format, whitespace, license and source checks
passed. Source/index guards preserve unrelated changes. The legacy
`mach clang-format` command was rejected; the registered lint route was used.
An initial subdirectory build returned zero while explicitly ignoring the
target; it is not compilation evidence. The subsequent command used
`--allow-subdirectory-build` and compiled the widget directory before relinking.

The first library-transfer admission rejected mode 0775 instead of 0755 before
launch. Its failure is retained. A separate first native execution failed at
the tiny-surface factory, before pixels were compared; it is not the behavioral
RED. After direct initialization, the failing pixel test was observed before
the production correction. All earlier evidence is unchanged.

Evidence and exact commands are in
`artifacts/umbralink-control/readback-order/`; `comparison.json` distinguishes
test setup, behavioral RED and candidate GREEN. Runner equivalence tests retain
the earlier ownership/timeout envelope and permit only explicit identity,
manifest, inventory and output-name substitutions.

Final offline verification passes all nine evidence/inventory/runner contracts
with no skipped tests. The three spec files pass formatting, and scoped report
and plan lint reports zero problems. Current tracked changes outside the
readback implementation match the saved baseline exactly; the staged patch is
unchanged. Four saved source copies match current bytes, and `git diff --check`
passes. The final evidence manifest is
`artifacts/umbralink-control/readback-order-final.sha256`; it covers this report,
the plan and the evidence namespace, not mutable continuity notes or the live
working source files. Saved source copies preserve this milestone independently
of subsequent work.

## Next Gates

Preserve these native regressions. Extend failure and GL-state coverage, then
build a fresh integrated diagnostic package with complete source provenance.
The ordinary object-directory libxul and previous integrated export have NOT
been rebuilt with this correction and must not be installed as current source.
Run the existing strict real-video pixel matrix without modifying its thresholds
or pooling old results. Any residual mismatch must remain a failed gate.
Only after correctness acceptance measure performance against the corrected
daily baseline. Keep the GPU-import preference off and desktop installation,
browser, launcher, profile, Git index and Pi untouched.
