# Exact Full-Size Readback Cache

## Scope

This is a prerequisite within the active performance program, not completion of
the rendering goal. The operation-order experiment establishes that size-only
RGB8 prescaling cannot replace final-backend sampling/composition generally.
Direct GPU import remains the primary performance route. This phase eliminates
redundant full-size DMABuf readback for repeated draws of an immutable image.
It does not yet switch the canvas fallback, enable the import preference, install
a build, touch the daily desktop browser, or reinterpret the seven pixel failures.

## Territory And Contract

`GPUVideoImage::GetAsSourceSurface()` calls the manager for every full-size read.
The sized overload already owns a separate one-MiB `CachedSurface`. Preserve it
and its nine regression tests. `Image` requires immutability after publication.
`RemoteMediaManagerChild::Readback` creates a shmem-backed DataSourceSurface whose
user data retains the manager; putting a strong surface cache on the manager
would create a cycle. Keep ownership on each image instead.

Add one private full-size cache per image, admitted only for DMABuf video and a
DATA surface with the exact image size, positive stride and a positive byte size.
Account actual stride times height using a wide integer. A process-wide atomic
16 MiB budget bounds newly retained full-size surfaces, independent of image
count. This permits two tightly packed 1920x1080 BGRA images; larger requests or
an exhausted budget retain the original uncached return path. This is a cache
retention bound, not a bound on caller-owned surfaces or concurrent readback
allocations. The existing sized-cache budget is separate and unchanged.

Cache misses perform IPC outside all cache locks. Concurrent misses may duplicate
the original work; only the first valid surface publishes. Reentrant reads must
not deadlock. No failure or wrong-size surface poisons later attempts. Budget is
reserved only for the published entry and released after its cache-owned surface
reference is released on the main thread, including delayed destruction from
other threads. No global cache stores images/managers, no pixel mutation, no new
public API, no diagnostic property, no expiry timer or background worker.

## Verification Reasoning

What changes: repeated full-size reads can return the same immutable surface.
Producer/consumer trace: full and sized manager overloads, surface user-data
destruction, image/texture descriptor destruction, canvas consumers and native
cache tests were inspected. Other remote decoder types retain existing behavior.
No serialized IPC field, storage record or web signature changes.

Existing tests: nine GPUVideoReadback tests cover sized reuse, bounds, failure,
different images/sizes, reentry, races and destruction. Preserve those, including
the full-versus-sized isolation test whose deliberately wrong-size full read
continues to be uncached.

Hypothesis: repeat full-size reads of one immutable frame require one manager
read while returning byte-exact original data. Three primary falsifiers:

1. Same valid 1080p image read repeatedly must return the first exact bytes with
   one full read; different images, including a repeated descriptor handle, must
   never share entries.
2. Failure, wrong size, non-DMABuf type or insufficient budget must not substitute
   stale data or prevent a later successful uncached/cached read.
3. Concurrent/reentrant callers and image destruction must neither leak budget
   nor hold locks during IPC; delayed main-thread release must stay charged.

Native gtests are the most direct mechanism test. Add assertions first and retain
an actual failing native run. Preserve success and fault cases through the fix.
Use the existing isolated laptop native runner with 30-second work/45-second
total limits and fresh owned roots. Two-job idle native gtest build timeout900s;
copy/strip timeout120s; pure evidence tests30s; scoped lint60s. Native gtests use a
fake manager and do not prove IPC cost, real-video parity, or a performance win.
Real integrated package/pixel and paired performance gates remain prerequisites
before release or changing the production canvas route.

Unit tests provide exact bytes/counts and resource lifecycle checks. Integration
in this phase means compiling the actual header and running the real Gecko test
library, with frozen package identity and owned cleanup. Property-style tests
exercise threshold sizes/strides and competing images. Manual inspection checks
the immutable ownership and reference-cycle boundary. Browser end-to-end and
performance comparisons follow after integration; no claim substitutes for them.
Deadlock is falsified by the native watchdog and explicit reentry/concurrency.

## Execution And Completion Boundary

Use `artifacts/umbralink-control/full-readback-cache/` for source snapshots,
manifests, red/green native evidence and commands. Change only GPUVideoImage.h and
TestGPUVideoImage.cpp plus this phase's evidence/report and continuity. Preserve
all dirty/staged work, defaults, prior seals and source-only counterfactual tests.
No stage/commit/push. Run all nine old cache cases and new cases, review actual
diff, verify budget recovery and exact recorded process absence, then document
native scope honestly. A passing cache phase is not overall pixel acceptance.

Next dependency: integrate exact full-size fallback with direct GPU import and
run all retained parity cases, including filters, before performance comparison
against the actual daily V2 baseline. The wider layout/CSS/JS program stays active.

## Progress

The failing-first native run completed19 tests: all nine original tests and the
non-DMABuf control pass; nine new cache behaviors fail. Cleanup and the48-file
package postcheck pass, and all three recorded process IDs are independently
absent. The production correction is implemented and scoped native lint passes.
The same-image concurrency case additionally tests eight different images
competing for a four-entry,4 MiB-per-entry budget. Old nine test bodies are
byte-for-byte unchanged.

The header change triggers broad dependency recompilation, unlike earlier
test-only15-25s builds. At12min it is still compiling dom/media with two jobs
and no compiler errors. Retain the initial900s bound. If it actually expires,
first confirm the original command and its compiler descendants are terminal;
then permit one incremental continuation with2400s bound, same two-job idle
settings and unchanged production input. Do not treat a polling timeout as
termination, restart a live build, or launch a partial test library. Record
warnings and any timeout rather than reporting a clean one-shot build.

Completed: the initial build actually expired and its process group was absent
before continuation. The continuation finished in1290.88s with zero warnings
reported for that invocation. One fresh isolated GREEN run passed all19 native
tests,0skips/errors, clean exit0; controller/native/log-helper PIDs independently
absent. Five offline evidence checks and scoped native lint pass. The other47
package files and prior sealed evidence are unchanged. Details and hashes are
in `bot-docs/reports/performance/2026-10-06-full-readback-cache.md`.

The independent review found no concrete cache correctness defect, but cache
hits after IPC loss bypass the manager's live-channel check. Shmem source
ownership supports retained mapping lifetime; actual channel teardown and
downstream browser parity remain unproved. Complete that loss-state gate before
release; do not substitute fake-manager failures or native cache reuse for it.
