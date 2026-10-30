# Readback Cache Availability

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Entry And Scope

The preceding goal turn completed the70-file IPC lifetime evidence seal. The
23-case native gate proves shared-memory lifetime, not decoder availability.
Consumer review identified that both full and sized cached surfaces bypass the
manager path that returns null after its thread or channel is lost.

Preserve Firefox error/pixel behavior before enabling the performance candidate.
Keep direct GPU import default off; no desktop browser/profile/installation,
Pi, staging, commit or push. Preserve all existing staged and dirty changes.
This authorized continuation changes only the private manager/cache contract
and its tests, not WebIDL, JS, protocol messages, pixels or default preferences.

## Territory And Contract

GPUVideoImage owns independent full and sized caches. Its strong manager remains
the original instance across remote process recreation. IGPUVideoSurfaceManager
has two production implementations and two test implementations: child, parent,
TestRemoteImageHolder's manager and TestGPUVideoImage's manager.

RemoteMediaManagerChild::GetManagerThread reads a protected thread reference.
Shutdown removes that reference before closing managers. Endpoint recreation
creates new actors rather than rebinding old images. IProtocol::CanSend reads a
non-atomic actor field and must remain on the manager thread. Existing Readback
uses SyncRunnable, which executes directly on its target thread or synchronously
dispatches without spinning the caller event loop; dispatch failure is returned.

Propose a private virtual CanReadback() availability check, implemented by the
child using that same thread, actor and channel state, with false for missing thread or
failed dispatch. The parent cannot perform readback and returns false. Cache
misses keep their original Readback call; hits return null when unavailable.
Do not hold cache locks during validation, add mirrored state, use the current
singleton in place of the retained manager or clear caller-owned snapshots.

This check covers known local teardown only. A remote process can fail before
local notification; no new universal failure-equivalence claim follows. Before
release, compare actual retained VideoFrame draw exceptions and raw pixels with
an uncached reference after positively observed old-channel loss. A retained
ImageBitmap is a separate control. Restart requires a distinct abnormal-loss
test, not nsIRddProcessTest.stopProcess's permanent normal shutdown.

## Falsification And Execution

Keep all19 earlier GPUVideoReadback tests and four real IPC lifetime tests.
Before production edits, add actual native tests that warm each cache, disable
the fake manager thread or channel, require a cold read to fail, and require
the warm read to fail too. Retain the previously returned bytes as a control.
Also test concurrent disconnected hits, new-manager versus old-image isolation,
and reentrant validation without cache lock deadlock. Mock availability does
not prove actual manager-thread execution or browser behavior.

Run the exact new inventory against the old production implementation on the
isolated laptop and preserve expected behavioral failures. Then implement the
private contract and all overrides; repeat the identical native gate. Preserve
source/package pins and unchanged original test bodies. Use the existing native
controller's30s work/45s total bound, private data roots,1MiB logs, exact owned
PID/peer cleanup, frozen package dependencies and positive preflight.

Compilation uses two idle jobs: test-only initial build900s; header-dependent
implementation build2400s based on the previous1291s rebuild. No overlapping
native run and compilation. Strip/copy120s, pure checks30s, scoped lint60s.
Preserve failures, phase-specific manifests and logs; no unexamined repetition.
Diagnostic gtest overlays keep their loader/native BuildIDs explicitly separate
and are never installed as a production package.

## Following Gates

Measure the added local dispatch cost and perform real decoder-loss parity.
Integrate exact full-size fallback with direct GPU import, retain all seven
prescale failures until the production route passes, rerun real-video/filter
pixel gates and paired performance versus daily V2. The previous35% controlled
CPU result is not a promise for the integrated candidate or general YouTube.

## Progress

- Source authority and consumers inspected; five behavioral failures reproduced
  against the old production implementation in the native RED run.
- Private availability correction implemented and independently source-reviewed.
  Native GREEN passed all 38 cases; actual browser parity remains pending.

### Native RED And Review

One old-production laptop run:28 tests,23 previous cases PASS and all five new
availability cases FAIL as intended; no skips/errors. All five recorded native,
controller/helper/IPC-peer PIDs absent, package and exported evidence hashes match.
No production edit preceded this run. The source review requires checking both
actor CanSend and monitor-protected MessageChannel::CanSend: the latter can
already be false before actor teardown is delivered. Use both on the manager
thread, not merely a mirrored actor flag.

The review's proposed fake PRemoteMediaManagerParent subclass is not viable in
this build: generated dispatch/ActorAlloc statically cast to the real concrete
parent. The real parent also requires RDD/GPU/utility process services. Do not
execute that recipe. Instead add a real child/manager-thread characterization
with an owned, unbound peer endpoint: validate dispatch/inline checks, induce
channel failure while actor CanSend is still true, verify rejection after actor
teardown and after manager shutdown. This proves local authority, not a remote
readback server, decoded media, pixels or process recovery. Preserve this boundary.

The implementation review identified a test-only startup wakeup/exceptional
capture-lifetime risk before execution. Replace the atomic-only poll with owned
completion state published by a main-thread event. Assert actor disconnection
after queued error delivery. The ongoing rebuild has not reached gfx tests;
run a final incremental build against the corrected frozen sources before
packaging, irrespective of whether this build compiled the correction.
The GREEN inventory includes the additional real-manager case plus all nine
existing TestRemoteImageHolder regressions because that fake manager also gains
the new private override:38 tests total. RED remains its original28-case run;
its frozen controller and inventory are retained separately.

The first implementation build failed after 22m16.8s with two incomplete-type
errors in the new endpoint test and 12 compiler warnings. Preserve that log.
The test now explicitly includes mozilla/ipc/Endpoint.h; the 58-file guard
confirms no other source change. The corrected incremental build reached its
900-second deadline while recompiling remaining dependencies, exit 124, with no
new compiler error in its saved log. Mach, make and compiler processes were
confirmed absent before one 900-second continuation from completed objects.
Do not describe these failed invocations as a clean one-shot build.

The continuation succeeded in 175.76s with zero reported compiler warnings.
One fresh isolated laptop GREEN run passed38/38, no skips/errors, native exit0.
All five recorded PIDs were independently absent;48 package files and four
exported evidence files passed postchecks. Eight offline tests pass, including
source/index preservation and explicit controller transformations. A one-byte
terminal-newline mismatch in the initial offline comparison was preserved and
corrected in its expectation only; no native rerun or executed-file edit.
See the phase report for exact manifests, build failures and remaining limits.

### Browser Gate Boundary

Source follow-up confirms VideoFrame(HTMLVideoElement) obtains GetCurrentImage
and InitializeFrameFromOtherFrame retains that image; it does not flatten it
at construction. Conversely the current optional direct-import canvas route
obtains GetDesc and queues CanvasTranslator work through VideoBridgeParent.
It bypasses GetAsSourceSurface, so this cache availability correction does not
certify the accelerated descriptor route's loss behavior. The later browser
matrix must cover reference, cached CPU fallback and direct-import modes rather
than extrapolating an OFF-only fault result to ON. No direct-import fault defect
was executed or proved here; keep the preference off until that gate passes.
