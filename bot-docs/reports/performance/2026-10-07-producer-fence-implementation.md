# Local Producer Fence Implementation

## Result

P1 of the [producer-fence plan](../../plans/local-producer-fence.md) now has a
four-file source candidate and failing-first actual-source operation tests.
The baseline compiled and failed ten assertions across four of twenty cases.
The first candidate passed all twenty; the expanded final harness passes
45 cases. The full tooling suite passes 461 tests, with no failures or skips.

This is not a Gecko build, real EGL/FD lifetime test, pixel result or measured
speedup. No browser, profiler, remote host, installed package, owner profile,
launcher, Pi, native Gecko build, staged index or commit was changed. The
standalone C++ compiler executes extracted methods against fake operations.
The rare renderer stall and earlier failed smoothness comparisons remain open.

## Production Contract

Only widget/gtk/DMABufSurface.h and .cpp and gfx/gl/SharedSurfaceDMABUF.h and
.cpp change relative to the frozen P0 source. Existing unrelated changes in
the worktree are preserved.

`DMABufSurface::ProducerFence` is an embedded, noncopyable and nonmovable
holder on `SharedSurface_DMABUF`, declared after its surface reference. It
holds a strong creating `EglDisplay`, the original sync and the exact exported
`FileHandleWrapper` generation token. Construction and destruction are
out-of-line, including for the forward-declared wrapper type. No per-frame
holder allocation, global cache or raw retained context pointer is introduced.

Only `ProducerReleaseImpl` and `WaitForBufferOwnership` pass that holder.
Existing callers retain default-null behavior. Release resets an old holder
before taking the surface mutex, performs the original single MakeCurrent,
creates and exports the fence, publishes the same FD wrapper and flushes.
Retention requires successful MakeCurrent, a usable context, both extensions,
successful creation and a nonnegative exported FD. Other cases retain the
original destruction/fallback sequence.

Wait moves the published wrapper under the original mutex and waits outside
it. Eligible exact-wrapper/display reuse waits on the original sync with
flags zero and the unchanged infinite timeout, then destroys it once. Failed
retained waits use the old FD route before holder cleanup. Wrong generation,
display mismatch and context loss use that route too. Empty waits clear stale
holders; missing GL preserves the pending published FD while clearing the
holder. Scope-exit cleanup runs after the lock is released on every return.

The owning destructor is unchanged. Member destruction releases the sync
even when MakeCurrent fails and the destructor returns early. Its strong
display outlives sync destruction. Retaining a sync can retain an additional
internal native FD until reuse or teardown: one per producer surface is not a
process-wide resource bound. Real resource measurements remain required.

## Test Evidence

Permanent tests are tools/umbrafox/tests/readback/test/producer-fence-spec.mjs
and producer-fence.cpp. The adapter extracts actual declarations, fence and
semaphore methods, and the actual shared-surface destructor/release/wait
bodies. Fake EGL, reference-counting, FDs and mutexes expose ordered operation
records. Compilation has a 20-second bound and the executable a 10-second bound.

Coverage includes local reuse, unchanged complete default success/error
sequences, exact wrapper identity versus aliased numeric FDs, repeated release,
missing GL, explicit fallback context, missing extensions independently,
failed create/export/clone/import, retained wait failure, display mismatch,
lost/destroyed contexts, invalidation followed by recovery, repeated published
references, empty/double waits, and owner destruction with failed MakeCurrent.
Sixty-four idle owners exercise replacement and full release. Tests detect
double destruction, wrong creating display, live syncs at display destruction,
waits under the surface mutex and retained-sync destruction under that mutex.

Actual semaphore source covers sync-FD success/import failure/missing extension
and opaque GL semaphore success/import failure/wait failure. The latter retains
the existing failure behavior, not an assertion that every old path is ideal.
Default invalid-FD import and finite 100 ms poll behavior are likewise preserved,
not newly endorsed as universally safe.

The same-integer/different-wrapper case deliberately models corrupted ownership;
it is not valid simultaneous real OS FD ownership. Repeated published references
exercise reference lifetime, not actual IPC descriptor serialization. The source
guard separately proves serialization unchanged; real export/import belongs to P2.
The fake type traits and destructor ordering do not replace a Gecko compilation.

Evidence directory: artifacts/umbralink-control/producer-fence-implementation/.

| Evidence                | Result                                                       |
| ----------------------- | ------------------------------------------------------------ |
| ledger-red-1.log        | Actual baseline compiles, 20 cases, 10 intended failures     |
| ledger-green-1.log      | First candidate, 20 cases pass                               |
| ledger-expanded.log     | 37 cases pass                                                |
| ledger-semaphore.log    | 43 cases pass                                                |
| readback-tests.log      | 34 adjacent Node tests pass before final two extension cases |
| full-tooling.log        | Final 461 tests pass, zero skips, 41.600 seconds             |
| lint-1.log              | Two test-harness lint errors, retained                       |
| lint-final.log          | Exact six files, zero errors/warnings/fixes                  |
| source-guard-final.json | Four authorized deltas, other 84 audited sources unchanged   |

The final suite includes all 45 C++ cases as one Node test and adjacent source
compilations, plus existing supplied-data, loopback-server and Node-child tests.
It does not launch Gecko. Commands used:

```sh
timeout 45 node --test --unhandled-rejections=strict tools/umbrafox/tests/readback/test/producer-fence-spec.mjs
timeout 90 node --test --test-concurrency=1 --unhandled-rejections=strict tools/umbrafox/performance/test/*-spec.mjs tools/umbrafox/tests/mutations/test/*-spec.mjs tools/umbrafox/tests/readback/test/*-spec.mjs tools/umbrafox/tests/userland/*-spec.mjs tools/umbrafox/tests/control/*-spec.mjs
timeout 20 node artifacts/umbralink-control/producer-fence-implementation/verify-source.mjs
```

Complete test output was redirected to the corresponding logs before inspection.
Registered ESLint/license/whitespace/trojan-source checks pass on the six files.
Prettier passes on the adapter; clang-format passes on the new C++ test and
the touched native ranges, not on all preexisting unrelated formatting. The
native tracked diff passes whitespace checking.

## Review And Provenance

The independent P0 evidence seal still verifies. Four saved before-files match
the original P0 hashes; the new verifier checks all other 84 source hashes,
HEAD 892431809a4caadb5c73b2c03ad9bdb124c3e21e and unchanged staged patch
SHA256 3b78253cf775a4a1e8c69a4b82cc3958b366056129a391f4ae362bdfe8e4e0c4.
It also compares bytes outside the permitted method/header regions. Thus
generic FenceWaitFd, semaphore, HDR, import, descriptor serialization, texture
release and shared-owner construction/destruction remain unchanged. The old
P0 source verifier should now reject the intentional four-file delta; do not
rewrite its historical receipt. Use the new verifier for implementation scope.

Current implementation hashes are recorded in source-guard-final.json. Review
checked all returns, ref-release order, no wait/holder reset inside the mutex,
display lifetime, absence of a holder/surface reference cycle and isolation
from generic callers. This was a local review, not another agent's verdict.

No public API, preference, shader, pixel conversion, timing interface or request
behavior is changed. The implementation removes internal reconstruction, not
synchronization. Native parity is still unproved, so this is not release-ready
under the mandatory modification rules.

## Next Gates

P2 needs real GTK/EGL tests for sync validity, independent exported duplicate
lifetime, alternating pixels, buffer cycles, resize/pool destruction, context
loss/replacement and many-surface FD/resource return. Enumerate the current
native test inventory, preserve all earlier readback/cache cases, and conduct
the existing bounded build/resource preflight before compilation or remote work.
Do not substitute the standalone test's simulated resource counts for those
results. No native build or runtime automatically follows this report.

P3 then compares exact baseline/candidate packages with GPU import held constant,
using the fixed unprofiled CPU, callback-gap, drop and pixel criteria. No threshold
relaxation, default promotion, favorable-result retries or daily install is
justified by P1. The full rendering/layout/CSS/JavaScript goal remains active.
