# Scaled Readback State And Failure Gates

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Scope

Continue the authorized rendering performance campaign from the sealed native
readback-order milestone. Change only the existing GTK native test initially;
production changes require a demonstrated failure and separate narrow review.
Keep all public surfaces, preferences, desktop browser/installation, Pi, Git
index and prior evidence seals unchanged. No deployment is part of this phase.

## Contract And Tests

`DMABufSurface::ReadIntoBuffer` scopes its temporary texture and framebuffer
bindings. The YUV blit and RGB resample delegate drawing state to
`DrawBlitProg::Draw`; pixel reads use `ScopedPackState`. Extend the existing
real-GL fixture, not another browser harness. Test:

- Scaled and full-size reads preserve nondefault caller GL state and pixels.
- Oversized source intermediate and oversized destination allocation each
  return failure, leave output untouched, restore caller state, and permit a
  successful subsequent read after clearing the expected GL error.
- Missing plane and empty reported source reject and recover without a GL error.
- BT601 and BT2020 linear scaling match full-size RGB conversion then canvas
  resizing, alongside the seven existing readback tests and 17 import tests.

Use `MAX_TEXTURE_SIZE + 1` with bounded small CPU output, not real GPU OOM.
Snapshot active texture and four bindings, read/draw FBO, viewport, scissor,
color mask, program, VAO, array buffer, drawing enables and pack/unpack values.
Do not claim context loss, allocation leak or external EGL/decoder/IPC coverage.
The existing synthetic reference is not a stock Firefox parity oracle.

## Execution

1. Save source/index/working baselines in new
   `artifacts/umbralink-control/readback-state/`; verify the prior seal.
2. Add tests, compile only the gtest library with two jobs and a 900-second
   bound, and strip a separate test-library copy. No production behavior change
   is planned; a newly exposed failure remains a failed gate until understood.
3. Reuse the reviewed laptop native runner mechanically: only new package,
   phase, paths and exact inventory. Preserve 30-second work/45-second total
   bounds, one-MiB output caps, fresh private application-data directories,
   no-report/nonlocal guards and exact owned PID cleanup checks.
4. Require all 32 native tests completed with zero failures/skips, exact package
   before/after hashes, and source/index guards. Retain all failures. Bound
   offline tests to 30 seconds and lint to 60 seconds.
5. Review and record result and remaining gaps. A passing gate permits the next
   fresh integrated diagnostic build/package and strict real-video pixel gate,
   not deployment, performance acceptance or goal completion.

## Test Rationale

The important falsifier is caller-state contamination after the new second
pass, including early returns. Success pixels alone cannot detect that defect.
Invalid-dimension rejection exercises actual GL allocation/FBO handling without
exhausting resources; it does not model every driver failure. Native integration
is necessary here; mocks, source inspection and manual video inspection are
insufficient. Full playback and performance remain subsequent gates.

## Outcome

All 32 tests passed in an initial run and again after strengthening failed-read
output to a nonzero sentinel and recording GL backend identity. The final run
reports Intel / Mesa Intel Iris Xe Graphics (RPL-P), zero skips and eight exact
pixel comparisons. The production implementation is unchanged in this phase.
Both owned runs exited cleanly; all six recorded process IDs are absent.
Report: `docs/umbrafox/archive/reports/performance/2026-10-06-scaled-readback-state.md`.
Proceed to a new integrated diagnostic build and existing strict video gate;
the separate blur discrepancy and performance cost remain open.
