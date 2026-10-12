# Scaled Readback Residual Pixel Falsifiers

The preceding real-video gate is progress but failed full acceptance. Linear
and nearest-setting outputs now match the full-size reference; odd-size, alpha,
readback and independent filter-repeat cases remain. This phase changes only
the existing TestDMABufReadback fixture initially, not production/default code.

## Territory And Test Contract

TexturePlaneSurface supplies real GL YUV planes to ReadIntoBuffer. The candidate
reads a destination-sized RGB surface, then draws it with normal alpha/operation
semantics. The reference reads full-size RGB and applies scaling and alpha in
the destination draw. Compare both using an accelerated DrawTargetWebgl and
a software SKIA target, clearing the destination and using OP_OVER as the page
does. Use deterministic nonconstant luma/chroma and exact byte equality.

Add eight cases: video-size ordinary/odd/half-alpha accelerated, video-size
ordinary/odd/half-alpha software, small half-alpha accelerated and small software.
Keep the preceding32 native tests unchanged; inventory becomes40, no skip may
count as acceptance. Record source/destination size, alpha, target and component
difference/magnitude. Plane/output allocations remain bounded to one1920x1080
source and at most321x181 destination per comparison, not an OOM workload.

The important falsifier is full-size draw versus sized readback followed by
the same draw. A native mismatch is useful even when the broader gate remains
red. Do not turn an observed failure into an expected-success exception. This
test does not cover decoder/EGL import, remote IPC, actual video planes,
context loss or the separate blur defect. A passing synthetic case does not
erase its failing real-video observation.

## Execution And Gates

Preserve current source/index/working state and prior seals under new
artifacts/umbralink-control/readback-residual/. Build only recurse_gtest through
mach with two jobs, idle priority and900s maximum; strip a separate library copy.
Refresh resource/compiler admission. Reuse the native runner with only explicit
namespace/manifest/phase/inventory changes, fresh private laptop cache roots,
30s work/45s total bounds, one-MiB logs/results and owned cleanup/postcheck.
No desktop browser/profile/install/launcher, Pi, commit, index or default edits.

Test inventory/parser/dependency rejection and exact runner equivalence before
native execution. Transfer only the pinned test library and manifest into the
verified known test-loader package; do not call it an integrated browser build.
Preserve any native failure and all exact process-absence/export hash receipts.
Bound offline tests30s and lint60s. Review each failure against its producer and
consumer before any further production change. Seal report/evidence and keep
the broad rendering/layout/CSS/JS performance goal active.
