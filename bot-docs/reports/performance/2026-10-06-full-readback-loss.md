# Full-Size Readback Channel Lifetime

## Result

PROGRESS, not release acceptance. One isolated laptop native run passed23 tests:
the19 previous cache regressions plus normal and abnormal channel shutdown in
both cross-thread and cross-process modes. Zero failures, errors, disabled or
skipped tests. The four new cases validate retained16MiB byte-exact mappings and
deferred release/budget recovery through real IPDL Shmem transport.

This verifies the transport lifetime mechanism, not real RDD crash/recovery,
page-visible loss behavior, a memory-leak absence claim or a performance benefit.
Production source and preferences were unchanged in this phase. The broader
performance objective and the separate seven native prescale failures remain open.

## Code And Review

New `gfx/tests/gtest/TestGPUVideoReadbackIPC.cpp` reuses PTestShmem and the existing
IPDLUnitTest harness. It is registered in gfx/tests/gtest/moz.build. The parent
wraps the received Shmem and retains its descriptor and allocator in surface user
data, with a test-owned GPUVideoReadbackCache to avoid an allocator/cache cycle.
A deliberately corrupted byte fails the oracle and is restored before caching.

Completion is observed after ActorDestroy returns, allowing OnChannelClose/Error
to clear the protocol's own mapping references. All retained bytes must match.
Worker-thread cache destruction must leave the16MiB reservation charged until
main-thread release; a competing cache fails before that drain and succeeds
after exactly one surface destructor, without post-loss deallocation IPC.

A separate source review found no concrete test lifetime/order/ownership defect.
It flagged potential cross-translation-unit initialization order in the existing
IPDL test registry. IPDLUnitTest.cpp now constructs that registry on first use;
registration and lookup semantics are unchanged. The original binary's initializer
order was not inspected or executed, so this is not a reproduced startup crash.
The review was requested for four minutes and explicitly halted; no claim of
completed broader infrastructure review follows. Both agents were closed.

The first test compile failed on the peer PID accessor and two direct boolean
uses of already_AddRefed. Those test-only errors were corrected. The subsequent
build passed in15.66s; the final registry-corrected build passed in14.04s, each
reporting zero compiler warnings. The unlaunched first candidate is retained.
No failing production behavior was repaired by this test-only phase.

## Execution Evidence

Evidence: `artifacts/umbralink-control/full-readback-loss/`.
Final test library358489592 bytes, SHA256
`d6dd84ce417ee0a50179915a98c9a7303f352284e2ae0aa37c45fb339a96d249`.
Manifest SHA256
`515edb6bd096e3c000d428bbf01f176cd41b3fc4209d973294b0e9fcfe06f0c1`.
Native BuildID20261006111504 versus loader20261006052600 is explicitly a
diagnostic overlay, not an integrated product build. The other47 files remain
identical to the previous diagnostic package. All57 source pins match; all54
prior production/test source inputs are unchanged. HEAD/index and unrelated
tracked diffs are unchanged.

Fresh harness: `full-readback-loss-gtest-harness-20261006-Ie0zrE` under laptop
`/home/wyatt/.cache/codex/`. Native root:
`full-readback-loss-ipc-registry-964784c6-6ff9-4571-a510-bf1cb8c54ac0`.
One run, exit0,0.327s test-suite time, clean owned cleanup. Controller1524624,
native1524636, sandbox helper1524638 and both explicitly recorded IPC peers
1524675/1524682 were independently absent afterward. Cross-thread peers correctly
report the native PID. All four evidence exports match independent remote hashes;
the48-file installation postcheck covers833609480 bytes.

The5170-byte log retains headless mode and the user-namespace EPERM warning.
No accelerated presentation or real browser media workload ran. Seven offline
checks pass, including corrupted/missing/duplicate inventory negatives, strict
source/package joins, recorded PID checks and unchanged launcher lifecycle logic.
The first offline comparison found exactly one removed trailing newline in the
copied launcher; that explicit non-functional transformation is now checked,
with the failed output preserved and no native repeat. Final native lint passes.

## Remaining Correctness Gate

Independent consumer audit finds a conditional observable risk: full-cache hits
bypass the manager's Readback/CanSend path after loss. The original manager
returns null when its thread is absent or the manager-thread channel check fails.
Canvas DrawImage can then no-op for a video element or throw InvalidStateError
for a VideoFrame; cached success can instead draw. WebGL's CPU fallback and
ImageBitmap creation also have distinct null-source branches. This is a
source-established conditional difference, not an executed page regression.

Retained ImageBitmap surfaces already bypass future manager checks, and no
cross-frame staleness defect is established. Those facts do not waive this new
cache's failure semantics. PTestShmem transport is not PRemoteMediaManager, and
the test userdata mirrors ownership rather than invoking the real media allocator.

NEXT: preserve authoritative manager-thread availability on cache hits, with
failing-first tests for both no-thread and disconnected states. Do not read
non-atomic CanSend from another thread or assume a mirrored flag covers ordering.
Measure any validation overhead. Then compare retained VideoFrame drawing and
an existing ImageBitmap control against an uncached reference across actual owned
RDD loss, checking exceptions and raw destination bytes. The existing normal
RDD test shutdown permanently disables restart, so abnormal recovery/frameB needs
a separate test. Continue exact full-size fallback/direct-GPU integration and
all retained native/real-video/filter parity and paired performance gates.

Desktop browser/profile/launcher/install, Pi, defaults and existing evidence are
untouched. No stage, commit or push. This phase does not authorize deployment.
