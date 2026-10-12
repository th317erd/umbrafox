# Current Rendering Cost And Fence Reconstruction

## Finding

The current-package saved profile has a concrete remaining synchronization-cost
lead: CanvasRenderer attempts to reconstruct an EGL fence from a file descriptor when
reusing a swap-chain buffer. Of 37 non-idle samples below `FenceWaitFd`, 34 are
inside `dri_create_fence_fd`, including 28 inside `tc_sync`. Only one is below
the symbol `iris_fence_finish`; two remain outside those named branches.

These are sampled stacks, not measured GPU-wait durations or CPU milliseconds.
The data does not support labeling all of `FenceWaitFd` as GPU blocking. It also
does not establish that retaining an original fence will improve playback.
Replacing the final client wait with a server wait would leave the preceding
fence reconstruction in place.

This phase changes only offline analysis, regression checks and documentation.
No browser, remote runtime, native build, installation, product source, default,
owner profile or launcher changed. The broad performance goal remains active.
The approximately 154 ms Renderer stall was not present in this capture and
remains unexplained. Earlier failed smoothness checks remain failed.

## Current Sample Partition

The input is the already admitted
[current-package capture](2026-10-07-current-compositor.md), not the older
pre-reuse profile. Each thread has 9,740 idle-inclusive samples. The following
partitions account for every non-idle leaf exactly once:

| Thread | Non-idle samples | Disjoint regions |
| --- | ---: | --- |
| Renderer | 535 | render 321; swap 111; other 103 |
| CanvasRenderer | 260 | recorded replay 117; present 114; other 29 |
| Compositor | 285 | composition 55; texture destruction 20; notification 19; texture creation 16; other 175 |

The complete trees have 1,143, 735 and 817 nodes respectively. The function
inventories contain 736, 523 and 411 entries, with 12, five and 20 unresolved
self samples. Unresolved frames are not silently assigned a native cause.

Current handles are Renderer `t-2`, CanvasRenderer `t-3`, Compositor `t-4`.
The two latter roles are reversed in the earlier profile. A failing-first check
caught use of those historical handles as current roles. The new adapter joins
name, parent PID, TID, index, selected-thread context and range before using the
sealed partitioner's historical classifier keys. It preserves actual identity
in the output and does not modify the original exports or old classifier.

Selected inclusive subtrees provide the next useful source boundaries:

- Renderer render 321 includes upload-buffer end-of-frame fence creation 83,
  `composite_simple` 49, external-image lock 40 and texture upload flush 24.
- Renderer swap 111 includes 82 self samples in `ioctl`; that name alone cannot
  distinguish GPU completion, submission, presentation or another driver wait.
- Canvas replay 117 includes surface-descriptor import 98, of which texture
  upload is 79 and texture-handle allocation is ten.
- Canvas present 114 includes swap-chain acquisition 42. Its ownership path
  includes `FenceWait` 41 and `FenceWaitFd` 37. Fence creation at release is a
  separate `FenceSet` branch with 52 samples.

These inclusive numbers are nested, not additive. They are not per-frame
operation counts, cache hit rates or percentages of measured process CPU.
This recording has approximately 27% more joined-process CPU than its controls;
there is no before/after optimization comparison in this phase.

## Fence Detail

`driver-stages-results.json` independently replays disjoint self-sample
partitions within the admitted CanvasRenderer tree:

| Scope | Samples | Disjoint descendants |
| --- | ---: | --- |
| `FenceWaitFd` | 37 | fence creation 34; fence finish 1; other 2 |
| Creation within that wait | 34 | `tc_sync` 28; `iris_fence_create_fd` 6; other 0 |
| `FenceSet` | 52 | fence creation 42; fence export 4; other 6 |

The `tc_sync` branch contains `tc_batch_execute`, with 27 samples below
`batch_execute` and one self sample. Its descendants include drawing and state
updates. This is an observed driver batch-execution stack, not evidence that
all 28 samples are GPU wait time. Unknown EGL frames remain in the stack.
The fence-export symbol appears at nested inline levels; the partition counts
its four samples once, not twice.
The export does not contain actual FD values or fence-generation IDs. It cannot
establish that every import succeeded or exclude a failed descriptor export.

## Recorded Source Route

The inspected producer and ownership path is:

`DrawTargetWebgl::CopyToSwapChain` -> WebGL swap-chain work ->
`SwapChain::Acquire` -> `SwapChainPresenter::SwapBackBuffer` ->
`SharedSurface::BeginWrite` -> `SharedSurface_DMABUF::WaitForBufferOwnership`
-> `DMABufSurface::FenceWait` -> `FenceWaitFd`.

`BeginWrite` waits before producer acquisition and locking. `EndWrite` unlocks,
releases and commits. The DMABUF release hook calls `FenceSet`, which creates a
native EGL fence, duplicates its descriptor, destroys the EGL fence and flushes.
`FenceWait` moves the descriptor out under the surface lock; `FenceWaitFd`
clones/imports it into a new EGL fence, waits and destroys that new fence. Its
existing import-failure path polls the descriptor with a bounded timeout.

The local producer's original EGL fence is therefore a candidate for reuse,
but no implementation is accepted yet. The next audit must establish exact
generation identity, export lifetime, context/display ownership, replacement,
texture release and destruction semantics. A retained producer fence must not
substitute for an unrelated consumer-release fence or let a surface recycle
before its consumer is finished.

This cannot be a blanket change to `FenceWaitFd`: other `FenceWait` callers
include native Wayland layers, and the helper also serves a semaphore path.
The Android shared-surface implementation retains a producer fence and uses
server waiting where supported, but its merged-fence ownership protocol differs.
That is API precedent, not proof that the same change is safe on Linux.

Source proof checks 67 package-pinned files and five additional files equal to
the package base and absent from its frozen patch. The additional files are
`SharedSurface.cpp`, `SharedSurface.h`, `SharedSurfaceDMABUF.cpp`,
`SharedSurfaceAndroidHardwareBuffer.cpp` and `GLScreenBuffer.cpp` under `gfx/gl`.
The supplement is checked separately at sealing. Relevant modified canvas,
GL-blit and DMABUF sources are included among the 67 pins. This does not claim
that every file in the dirty checkout belongs to the measured package; the
newer attachment metadata change specifically does not.

## Evidence And Verification

- Profile SHA256: `335206038875249534a47c0e344665291dc5949c45d6847d76390c7169debbbe`.
  Package manifest: `1de58db614be934fb7fe71fc46ea168ce9777a8b46e340d3f429090b4e3e6773`;
  native BuildID `20261006175655`, parent PID 1950654.
- Raw root range: 11310.979029 to 60452.423589 ms. Every query explicitly
  selects normalized 0 to 49141.44456 ms. Raw and normalized clocks are not mixed.
- One profiler-cli 0.10.0 load with a named owned session and loopback symbol
  server. Exact libxul and Mesa hashes plus Breakpad identities are admitted.
  Full functions, complete trees, idle-inclusive totals and minimum-1-ms markers
  are saved. This analysis does not newly certify marker split pairing.
- All 29 command receipts succeed. Runtime/export ownership and cleanup code
  match the prior exporter; nine enumerated substitutions change only namespace,
  range, port and native-identity checks. No raw-profile parsing fallback or reload.
- The symbol server PID 3660541 and daemon PID 3660583 exited cleanly; their
  exact roots and named socket were absent at cleanup and in the independent
  source audit. The owned load/export envelope lasted 9.203 seconds.
- Fifteen final pure Node test groups pass with zero skips in 0.988 seconds.
  They cover complete populations, role correction, clock/range validation,
  truncated trees, failed commands, mixed builds/sessions, incomplete inventories,
  missing/ambiguous fence roots, nonmutation and nested-sample conservation.
  Both saved result files recompute exactly after formatting.
- Registered codespell, whitespace and trojan-source checks on the report,
  plan and continuity file pass with zero problems. Authored analysis formatting,
  Git diff whitespace and the entire previous startup evidence seal also pass.
  These agent reports are outside the Sphinx documentation tree; no Sphinx,
  native build, full browser suite or hardware playback was run in this phase.
- The meaningful role-regression RED has two passes and two failures. Earlier
  test-fixture aliasing and a nonexistent assertion field are retained as harness
  errors, not product failures. The new driver test's missing-module RED is also
  only scaffolding evidence. An exploratory wrong `gfx/2d` source path failed;
  the actual package pin identifies `dom/canvas/DrawTargetWebgl.cpp`.

Evidence: `artifacts/umbralink-control/current-render-cost/`. The main results
are `results.json`, `driver-stages-results.json`, `source-proof.json`, the CLI
receipts and final test/replay logs. The seal is
`artifacts/umbralink-control/current-render-cost-final.sha256`. No write-once
exporter, generator or source-proof command should be rerun; read-only replays
do not launch a daemon.

## Next Acceptance Gate

Complete the local-fence lifetime audit before code changes. If equivalence is
established, a candidate must retain the same dependency and exported FD, scope
reuse to the proven local generation, and preserve imported/semaphore/Wayland
fallbacks. Tests must cover unsupported extensions, invalid/failed FD export,
creation and wait errors, replacement, loss/recovery, repeated export, recycling
and teardown, including real hardware pixel and failure checks.

A subsequent fixed unprofiled baseline/candidate sequence must measure both CPU
and the unchanged callback-gap/drop criteria. Do not remove startup intervals,
change thresholds, disable synchronization or infer a stutter fix from fewer
sampled fence calls. No new runtime, default change or daily deployment is
authorized by this report alone.
