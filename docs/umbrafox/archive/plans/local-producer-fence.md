# Local Producer Fence Retention

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Objective And Current Phase

Reduce proven internal rendering overhead without changing framebuffer results,
buffer ownership, waits, public APIs or defaults. The motivating evidence is
the sealed current-render-cost profile: 34 of 37 FenceWaitFd samples are below
fence creation, including 28 below tc_sync. These are not CPU milliseconds or
evidence that removing synchronization is safe.

P0 is source/lifetime and verification-design work only. No product patch,
browser, native build, install, remote process or new capture in P0. The prior
profile, evidence seals, dirty worktree and staged index are preserved.

## P0 Territory

Trace the measured CanvasRenderer path through WebGL CopyToSwapChain,
SharedSurface_DMABUF, RemoteTextureMap recycling, native descriptor publication,
all FenceSet/FenceWait/mSyncFd writers, and texture/context/display teardown.
Validate upstream discovery against the exact package base plus frozen patches
and supplements before making a deployed-source claim.

Use a new `artifacts/umbralink-control/local-producer-fence/` namespace. Record
source hashes, read-only source/API observations and unresolved edges. Existing
Searchfox queries identify entry points; their output is not proof that a dirty
local file is identical. Read primary Khronos fence contracts for FD ownership,
wait and destruction rules. Do not equate comments with consumer-release checks.

## Candidate Contract To Evaluate

Only a locally created, valid, same-generation producer fence can be eligible.
Keep exported FDs and consumer/recycle ownership unchanged. Do not reuse a fence
after replacement, failed export, surface reinitialization, display mismatch or
lost ownership. Preserve the fallback for imported descriptors, semaphores and
unrelated Wayland callers. No global CPU-to-server-wait replacement is included.

Before selecting storage, inspect existing EGL lifetime wrappers and shutdown
rules. Prefer existing types and a bounded one-fence-per-surface state. A handle
must be destroyed exactly once on consume, replacement or teardown, with no
expired display access or retention of unrelated contexts. Old and new dispatch
semantics must be characterized, not inferred from the proposed representation.

## Prospective Verification

First enumerate existing native tests and the supported isolated GL runner.
Before any product edit, write failing-first state/operation-ledger tests for
same-generation wait, export, replacement and teardown. Add malformed/failed
creation and FD export, unsupported extensions, invalid display/context, repeat
export, imported surfaces, loss/recovery and consumer-release cases. Fake calls
can prove order and counts, not real GPU completion or FD ownership.

Native gates must exercise real EGL export/import and local waits, buffer
recycling, pixel equality and failure/loss cleanup on the authorized laptop.
Use fresh owned roots and existing deadlines/caps; no owner-browser action.
Do not compile or launch merely because P0 finds a plausible implementation.

Performance acceptance remains a fixed unprofiled baseline/candidate sequence
with unchanged CPU, callback-gap, video-drop and pixel criteria. No startup
exclusion, threshold relaxation or favorable-result retries. The earlier rare
Renderer stall and failed frame-reuse checks remain separate unresolved work.

## P0 Completion

Produce a source-pinned ownership map, a concrete minimal design or explicit
rejection, and executable next-phase tests/commands with remaining obligations.
Review all producers/consumers and report uncertainty before a code change.
P0 completion is not implementation, performance acceptance or goal completion.

## P0 Decision

The [source audit](../reports/performance/2026-10-07-local-producer-fence.md)
admits one embedded, noncopyable producer-fence holder on each
`SharedSurface_DMABUF`. It rejects a generic cache on all DMABuf surfaces,
weak-display-only cleanup, per-frame heap allocation of the holder, FD-number
identity and a global server-wait conversion. This is the first concrete
implementation candidate, not native or performance acceptance.

Source proof: 67 package pins plus 21 base files, exact frozen patch and source
supplement exclusion, unchanged HEAD/index. Default invocation is read-only:

```sh
timeout 20 node artifacts/umbralink-control/local-producer-fence/source-proof.mjs
timeout 20 node --test --unhandled-rejections=strict artifacts/umbralink-control/local-producer-fence/test/source-proof-spec.mjs
```

Do not rerun `--write`: `source-proof.json` was created exclusively. It records
preimplementation bytes and must not be updated to admit a later patch. A
future implementation guard must separately enumerate its exact authorized
delta and retain all other 88 source hashes.

## P1 Internal Contract

Only four production files are expected to change: widget/gtk/DMABufSurface.h
and .cpp, gfx/gl/SharedSurfaceDMABUF.h and .cpp. All other source stays frozen.
No new public JavaScript interface, WebIDL, preference, diagnostic marker,
serialization field, shader or pixel/filter change. This is internal work
elimination, not an exception to mandatory Firefox parity.

Proposed signatures preserve all existing callers by default:

```cpp
void FenceSet(ProducerFence* aProducerFence = nullptr);
void FenceWait(mozilla::gl::GLContext* aGLContext = nullptr,
               ProducerFence* aProducerFence = nullptr);
```

`ProducerFence` is a nested internal RAII type with an empty constructor,
out-of-line destructor and deleted copy/move. Private state is a strong
`std::shared_ptr<gl::EglDisplay>`, one `EGLSyncKHR`, and a strong
`RefPtr<gfx::FileHandleWrapper>` token. No global cache, extra numeric generation
counter, retained raw GL pointer or per-frame holder allocation. Define its
methods in DMABufSurface.cpp; declare it after `mSurface` in the owning shared
surface so it is destroyed first. The owner is already noncopyable.

1. Reset a previous holder before acquiring `mSurfaceLock` on a new release.
   Empty/failed release must never leave an older holder eligible.
2. Preserve the original call order and fallback of `FenceSet`. Capture the
   existing `MakeCurrent` result without calling it twice. Retain only when
   current-context admission, extension checks, create and nonnegative export
   all succeed; keep the original wrapper publication and flush. All other
   callers still destroy the created sync at the old point.
3. In wait, obtain GL and move the current wrapper out under the existing lock.
   Never wait or destroy the holder under that lock. Match exact wrapper and
   creating display identity, reject lost/destroyed context for this shortcut,
   then wait on the original sync with unchanged flags/timeout.
4. On satisfaction, destroy/clear the holder once. A failed retained wait uses
   `FenceWaitFd` with the still-owned current wrapper, then clears the holder.
   Wrong generation/display and missing eligibility use the old path. Missing
   GL keeps the original FD publication behavior but invalidates the holder.
5. `ProducerReleaseImpl` and `WaitForBufferOwnership` alone pass their holder.
   Unchanged BeginRead/BeginWrite/EndWrite ordering, descriptor export,
   RemoteTextureMap release guards and recycle limits remain prerequisites.
6. Destruction does not wait or call MakeCurrent. Use the creating display to
   destroy once, then release the wrapper/display; this runs even after the
   owning destructor's early return. No hidden work is deferred to another
   thread or a global finalizer.

Any signature adjustment must retain these invariants and avoid a new generic
abstraction. The failure fallback does not prove that the old finite-poll path
is safe on every driver; preserve and report that separate limitation.

## Test Protocol

The hypothesis is fewer EGL reconstruction operations for the same completed
producer work, not less synchronization. Existing readback and frame-cache
tests do not directly prove this. P1 uses real source regions with fake native
primitives; P2 uses real EGL. Do not substitute one for the other.

Three primary given/when/then regressions:

1. Given a released producer with valid sync S and exported wrapper W, when
   its same surface is reacquired, wait on S once without cloning W or importing
   a second sync; FD publication and flush remain. Baseline must fail this
   operation-count assertion, not merely fail to compile a missing API.
2. Given retained W1 and a replacement W2, including the same numeric FD in the
   fake ledger, when waiting, never use S1 as W2's dependency. Destroy S1 once
   and import/wait W2 through the original route.
3. Given a retained sync and failed MakeCurrent during owner destruction, when
   the owner is released, destroy that sync once on its creating display before
   display teardown, without waiting or acquiring a context.

Additional ledger cases: empty/double wait, repeated release, absent GL, missing
extensions, create/export/clone/import failure, -1 FD, retained wait error,
wrong display, context loss/replacement, repeated descriptor serialization,
foreign/imported surface, Wayland null-holder control, HDR release-textures,
sync-FD semaphore control, cleanup after failed publish and surface destruction.
Compare whole ordered ledgers where behavior is unchanged; explicitly allow
only delayed original-sync destruction and removed reconstruction for the
eligible path. Include no-holder failure-path equivalence, not just success.

Follow existing `import-reuse-spec.mjs` extraction conventions, with exact
unique region anchors and actual header state/methods. The adapter may select
the old/new signature, but must not reimplement eligibility. New test files:
`tools/umbrafox/tests/readback/test/producer-fence-spec.mjs` and
`tools/umbrafox/tests/readback/test/producer-fence.cpp`.

Prospective P1 command, only after those tests exist:

```sh
timeout 45 node --test --unhandled-rejections=strict tools/umbrafox/tests/readback/test/producer-fence-spec.mjs
```

Use 20 s for the standalone C++ compilation and 10 s for its executable,
consistent with the existing adapter. Preserve behavioral RED, then GREEN.
This compilation is the next phase, not part of source-only P0. Use an owned
scratch directory and no browser/native runtime. Code review must check all
non-opt-in callers and avoid nested surface locking. Run adjacent readback
source tests and scoped native formatting/lint before P2.

P2 adds GTK-only `dom/canvas/gtest/TestDMABufProducerFence.cpp` plus its existing
moz.build registration. Prefer a fixture friend over production getters or
global EGL dispatch replacement. Real sync validity is queryable through
`fGetSyncAttrib`; test only currently valid handles. Exported duplicates must
remain valid independently after local-holder consumption/destruction. Verify
exact alternating colors through actual DMABuf export/import, repeated buffer
cycles, retained descriptor lifetime, resize/pool clearing, forced loss and
replacement. Add many-surface idle/release checks for the extra retained native
sync/FD, and require resource return after destroying the owned pool/context.
One sync per surface is not a global memory/FD bound. Unsupported
hardware/extension skips are nonacceptance on the
chosen laptop target. No claim of physical driver-reset coverage.

Reuse the isolated hardware fixture and owned runner documented in
`2026-10-06-frame-reuse-native.md`, not its frozen files in place. Create a new
add-only namespace, exact test inventory and package/hash manifest. Its normal
53-test historical inventory has since gained descriptor tests; enumerate the
current tests rather than hard-code 53. Keep 45 s total/30 s work, bounded log
output and SIGTERM cleanup. The test's temporary headless policy adjustment is
permitted only after actual supported hardware identity, and must restore in
TearDown. Do not change production fallback or hardware prefs.

After local build preflight and P1 review, the supported gtest build shape is:

```sh
timeout --signal=TERM 1800 env CARGO_BUILD_JOBS=2 ./mach build -j2 recurse_gtest --priority idle
```

Redirect complete output to the new namespace. Capture immutable source and
configuration inputs first; do not paste an old BuildID onto a new package.
Inspect generated artifacts, create the isolated gtest overlay and new runner
contract before authorizing any remote command. Native/build/package commands
are prospective and were not run in P0.

P3 first reuses fixed pixel/loss checks, then compares exact baseline/candidate
packages with GPU import held constant; a separate import-OFF/ON comparison
is not an attribution test for the fence. Specify old-vs-old noise and minimum
CPU improvement before launching. Preserve the 48 s, 1/4/4/1-copy workload,
no-profiler rule and existing gap/drop criteria. The historical import
acceptance remains failed; fence acceptance must not waive it. No default
promotion, daily install, site-specific behavior or owner-browser restart is
authorized by a favorable synthetic result alone.

## Progress And Review

- P0 source map and provenance complete; three provenance test groups pass.
- P1 tests/implementation, P2 native verification and P3 performance remain open.
- Adversarial review rejected weak-wrapper termination assumptions and generic
  ReleaseTextures cache cleanup; both would weaken the lifecycle argument.
- No direct hardware wait-duration or current FD-generation evidence exists in
  the saved profile. New tests must establish the operation, not infer it from
  sample counts. Performance can fail even after all correctness tests pass.
- Broad layout/CSS/JS investigations remain within the parent performance plan;
  this measured rendering-cost branch does not redefine the overall goal.
