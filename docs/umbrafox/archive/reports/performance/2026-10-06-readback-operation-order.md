# Readback Operation-Order Isolation

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

The extra 8-bit intermediate reproduces the two accelerated half-alpha failures
exactly in this native workload. Rendering the full-size reference opaquely,
then applying alpha in a second identity-sized draw, produces the same bytes as
the candidate. Both differ from the original one-stage reference in28851 channel
components for the video-sized case and2 for the small case, maximum delta1.
This establishes the operation-order mechanism for those two cases. It is not
a claim about every alpha, blend mode, backend, driver or real-video frame.

The other failures have not been explained by that mechanism. The native suite
still has33passes/7failures/0skips across40 tests, with every original result and
all recorded original mismatch counts unchanged. No production correction,
threshold adjustment or expected-pass exemption was made.

| Case | Staged reference vs original | Candidate vs staged reference | Raw sized readback vs source-operation reference |
| --- | ---: | ---: | ---: |
| Accelerated ordinary | 0/0 | 0/0 | 0/0 |
| Accelerated odd | 0/0 | 1685/1 | 1858/1 |
| Accelerated half alpha | 28851/1 | 0/0 | 0/0 |
| Software ordinary | 0/0 | 22710/1 | 35782/1 |
| Software odd | 0/0 | 159300/27 | 21605/1 |
| Software half alpha | 0/0 | 11598/1 | 35782/1 |
| Small accelerated half alpha | 2/1 | 0/0 | 0/0 |
| Small software | 0/0 | 4/1 | 1/1 |

Values are differing channel components/maximum channel delta, not pixel counts.
Video source is1920x1080; ordinary destination320x180, odd321x181, small8x4->4x2.
The source-operation control always uses alpha1 and compares raw opaque input;
it is not another equivalent implementation of the original half-alpha draw.

## Source And Interpretation

The current `DMABufSurface::ReadIntoBuffer` scaled route converts full-size YUV
to RGB8, linearly blits it into a smaller RGB8 texture, reads CPU bytes, and the
canvas consumer draws those bytes again. `MaybeGetScaledSourceSurfaceForRemoteVideo`
passes only destination size, not final alpha, composition operation or backend.
`CanvasRenderingContext2D::DrawImage` subsequently applies those draw options.
The full-size reference leaves sampling and composition to the final backend.

`SharedContextWebgl::DrawRectAccel` supplies premultiplied draw alpha to the
image fragment shader; the shader multiplies sampled colour before writing the
target. It also uses a different texture-coordinate transform and rectangle
shader from `GLBlitHelper`. The source operation disables image-shader AA,
but the odd-size mismatch persists in that control: AA removal alone does not
establish a correction. Changing the operation also changes blending, so this
control does not isolate a single shader instruction.

The upstream definitions corroborate the inspected local source:
[draw alpha](https://searchfox.org/firefox-main/rev/9de2c06fb839d60a8af0319f63c46e34a28e1fc9/dom/canvas/DrawTargetWebgl.cpp#3415),
[source-operation AA](https://searchfox.org/firefox-main/rev/9de2c06fb839d60a8af0319f63c46e34a28e1fc9/dom/canvas/DrawTargetWebgl.cpp#3395).
[DrawTargetSkia::DrawSurface](https://searchfox.org/firefox-main/rev/9de2c06fb839d60a8af0319f63c46e34a28e1fc9/gfx/2d/DrawTargetSkia.cpp#760-791)
passes the draw options through AutoPaintSetup and uses Skia linear sampling
with a strict source rectangle. No exact Skia internal kernel or SIMD branch
was established in this phase. The source-operation software control changes
the measured errors substantially, so a generic one-level rounding adjustment
would not be a supported fix.

The next production design must preserve final-backend sampling and composition.
The existing direct-GPU import path is the promising route for avoiding the CPU
round-trip while leaving those operations downstream. Where it is unavailable,
the ordinary full-size source fallback preserves the reference operation order;
an early size-only RGB8 substitution is not generally equivalent. Before any
change, trace all sized-readback/cache callers and retain the existing import
failure recovery. Do not turn this into a blanket default enablement, remove
failing cases from the integrated matrix, or substitute a correctness fallback
for the full performance goal. Compare an eventual integrated candidate against
the daily V2 baseline as well as the full-size reference. The separate filter
repeat problem remains open.

## Execution And Verification

Only `dom/canvas/gtest/TestDMABufReadback.cpp` changed: optional draw operation
for the helper and three additional comparisons in the existing eight cases.
Original equality checks run before the new observations. Test inventory stays40.
The two-job idle native test build completed in15.64s with zero warnings.
The separately stripped library is358415552bytes, SHA256
`400c90668e5b7612b28495775c9d4e8857a0159fb078f17ef75c690a05cbb647`.
Its native BuildID20261006111504 is explicitly separate from the older pinned
test-loader BuildID20261006052600; this is not an integrated browser package.
Manifest SHA256:
`b214c789a37460de30eb1cc55073d7195b4973228932e88d095a3260d5d1879a`.

One fresh laptop run used the same30swork/45stotal runner limits. All47 other
package files and70 inherited harness files were hash-verified before launch;
runner identity-only equivalence and unchanged result-contract checks passed.
Native tests reported1.102s. Exit1 represents seven pixel failures, not a crash
or harness error. All readback tests recorded Intel/Mesa Iris Xe(RPL-P).
This headless native GL test does not establish visible playback or scanout.

Root: `~/.cache/codex/readback-order-isolation-isolation-6b0b00ce-c2d6-46d0-ae84-875c39c3ce6a`.
Controller1483603/native1483615/log-observed helper1483617 were independently
absent afterward. Cleanup was clean,48-file package postcheck passed, and the
13117-byte log and three JSON exports matched independently recorded hashes.
Seven offline checks pass, including exact counterfactual metrics, preservation
of previous results, corruption/inventory checks, runner provenance and cleanup.
These green evidence checks do not change the native suite's failing status.

Production, default preferences, desktop browser/profile/launcher/install, Pi
and Git index remain unchanged. No repeat was run. All owned commands are
terminal. Evidence: `artifacts/umbralink-control/readback-order-isolation/`.
Final native and documentation lint report zero problems, and diff-check passes.
The54-input source guard identifies only the intended test change; all pinned
production sources, HEAD, tracked working/index patches and configuration match.
The previous61-file residual evidence seal verifies unchanged. Preserve the new
phase seal `artifacts/umbralink-control/readback-order-isolation-final.sha256`
and use a new namespace for the next correction.
