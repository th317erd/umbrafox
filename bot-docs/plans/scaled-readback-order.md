# Scaled Readback Conversion Order

## Scope

Continue the performance campaign after the integrated V2 pixel gate failed.
Keep the desktop installation, public interfaces, preferences, index and sealed
evidence unchanged. The GPU-import preference remains off. Native tests run
only in an owned laptop diagnostic installation with fresh application-data
roots and bounded cleanup. No deployment or performance acceptance follows.

## Territory And Hypothesis

The eligible Canvas2D path calls GPUVideoImage's sized readback, synchronous
RemoteMediaManager readback, DMABufSurfaceYUV's sized descriptor builder and
DMABufSurface::ReadIntoBuffer. GLBlitHelper::Blit samples YUV planes at the
destination size and then converts them to RGB. The historical full-size path
first materializes an 8-bit RGB surface, then Canvas2D scales that surface.
Clamping, quantization and chroma interpolation need not commute with resizing.

The existing GPUVideoReadback tests cover cache ownership and dimensions, not
pixel equivalence. The native WebGL upload tests establish a usable real-GL
test pattern. Add GTK-only tests to the same gtest library, using in-memory
GL plane textures and the actual DMABuf ReadIntoBuffer implementation. This
does not test EGL import, VA-API, modifiers, fences or remote IPC.

The independent reference is full-size ReadIntoBuffer followed by accelerated
DrawTargetWebgl::DrawSurface with linear sampling. Include a constant-color
control, same-size control, saturated alternating luma and varying chroma.
Verify setup and reject skipped GL tests as proof. Preserve failures before
considering a production change. Filtered Canvas2D draws bypass this sized
helper; the separate blur/source-identity discrepancy is not explained here.

## Execution

1. Capture source/index baselines; add tests and GTK-only registration.
2. Check resource/compiler preflight, then build the test library with
   `timeout 900s ./mach build -j2 recurse_gtest --priority idle`, saving output.
3. Use a fresh copy of the existing diagnostic gtest loader with an independently
   hashed new test library. Retain its private directories, no-report/nonlocal
   guards, 30-second work and 45-second total bounds, output cap and PID absence
   checks. Validate exact tests, completed status and expected failures.
4. If the mismatch is reproduced, evaluate GPU RGB staging before scaling.
   Do not introduce a speculative production change before the native RED.
   Subsequent gates must cover allocation/FBO/import failures, GL state,
   full-size behavior, alternate sizes/color spaces and real video pixel parity.
   An extra GPU pass requires a new performance comparison; no speedup assumed.

## Limits And Completion

This phase succeeds by producing a native falsifier or rejecting the hypothesis
with a usable result. Neither outcome completes the broader performance goal.
Do not relabel the historical full-size reference as stock Firefox, relax
zero-difference gates, or conflate this synthetic texture test with the decoder
path. Save evidence under `artifacts/umbralink-control/readback-order/` and
record the exact next implementation gate.

## Native Evidence And Correction

The first native execution reached all 21 tests, but the four new tests failed
at tiny DrawTargetWebgl factory admission; that is a test setup failure, not a
pixel RED. Direct Init bypasses only the size/admission heuristic. The corrected
run completed all 21 tests with one behavioral failure: saturated alternating
luma differs in 24 components, maximum 110. The other three pixel cases and
17 prior native regressions passed, with no skipped tests.

The producer `GLContext::TexParams_SetClampNoMips` sets both filters to NEAREST.
The V2 DMABuf blit therefore resizes nearest-filtered YUV. Do not simply switch
YUV planes to LINEAR: conversion/clamping order would still differ. Test a
full-size GPU RGB intermediate followed by explicit LINEAR sampling before
destination-sized readback, scoped to the existing scaled path only. Preserve
full-size/crop behavior, RAII state restoration and FBO-failure returns. Add
neutral luma, odd-size and empty-size/recovery tests. Real video, driver failure,
memory and performance acceptance remain separate gates.

Native candidate verification: all 24 tests passed without skips after the
scoped widget compilation and gtest relink, both with zero compiler warnings.
The original saturated-luma difference is now zero; added neutral/odd-size
comparisons and empty-size recovery pass. Report:
`bot-docs/reports/performance/2026-10-06-scaled-readback-order.md`.
The ordinary runtime library and existing integrated export remain unchanged;
do not treat the new test library as a playback build. Real-video pixel parity,
driver fault/GL-state coverage and new performance measurements remain open.
