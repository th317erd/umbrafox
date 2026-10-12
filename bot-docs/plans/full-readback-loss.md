# Full-Size Readback Channel Lifetime

## Scope And Entry

Previous goal turn is PROGRESS: the exact full-size cache passed all19 actual
Gecko native tests, five offline evidence gates and scoped lint. The sealed
full-readback-cache phase is retained unchanged. This phase addresses its
concrete missing mapping-lifetime proof, not the complete rendering objective.
No production code, default, public interface, desktop installation or Pi changes.

The producer/consumer chain is real IPDL Shmem transport -> wrapped DATA surface
with a retained Shmem descriptor -> GPUVideoReadbackCache -> normal/abnormal
channel teardown -> cached byte read -> deferred main-thread release. Existing
PTestShmem and IPDLUnitTest support cross-thread and cross-process execution.
OnChannelClose/Error disconnect actors and clear their shared-memory maps;
the Shmem descriptor independently retains its reference-counted mapping.

Keep the19 cache tests and original upstream IPC tests unchanged. Add a dedicated
gfx gtest source and one moz.build registration, using the existing protocol and
test-only actors. The test-owned cache must not be owned by the allocator actor:
surface user data retains that actor, so actor-owned caching would create a cycle.

## Verification Contract

1. Send16MiB of deterministic bytes through real Shmem transport, wrap the received
   mapping, cache it and release other local surface references. A deliberately
   flipped byte must fail the byte oracle before it is restored.
2. Close the channel normally or induce a connection error. Observe the expected
   ActorDestroy reason and defer the completion observation to after its callback,
   so OnChannelClose/Error has finished clearing its mapping table. Require
   CanSend false and every cached byte unchanged.
3. Destroy the cache on a worker thread. Until main-thread release drains, surface
   destruction count stays zero and a competing16MiB cache cannot publish. After
   draining, exactly one surface destructor and a successful competing cache
   admission prove release and budget recovery. No post-loss IPC deallocation.

Run normal and abnormal cases cross-thread and cross-process, plus all19 previous
cache tests. Record peer PIDs from the test's bound actor for explicit post-run
absence checks. Reuse the frozen owned native runner with the new exact23-case
inventory, private app/local/temp roots, no network,30s work/45s total deadline.
Bound compilation900s/two idle jobs, strip/copy120s, pure evidence30s and lint60s.
Keep failure logs; no automatic repetition after a native failure or timeout.

These are characterization tests against the already-green cache implementation,
not a new production fix with a missing RED. The byte-oracle corruption check,
strict inventory negatives and retained earlier RED prevent vacuous success.
Cross-thread tests prove channel teardown in one process; cross-process tests
exercise OS-backed transport but do not kill a real decoder or prove its restart.

## Limits And Next Gate

The test userdata mirrors the retained descriptor/allocator ownership but is not
RemoteMediaManagerChild, and the transport is not PRemoteMediaManager. Successful
mapping reads cannot prove every media/controller failure path, page error result
or decoder restart. Preserve those limits. Follow with an actual retained-frame
browser comparison across owned decoder loss, and exact full-size fallback/GPU
import integration with all existing native and real-video pixel gates.

Only the new test, gfx/tests/gtest/moz.build, this plan, phase evidence/report and
continuity initially change. The independent review then identified a potential
cross-translation-unit startup-order risk in the existing IPDL test registry.
Permit the small IPDLUnitTest.cpp correction to function-local first-use registry
construction, keeping all registration/lookup semantics. This is test-only;
the original initializer order was not executed or proved to fail. Preserve both
candidate manifests, the review and compile corrections; no fabricated RED.
Preserve the dirty worktree/index, HEAD, old seals and
production source fingerprints. No commit/stage/push or package installation.

## Outcome

The corrected native test library passed23/23 on one isolated laptop run,
0skips/errors; allfive recorded controller/native/helper/peer PIDs absent.
Seven offline contract/evidence checks and scoped native lint pass. Full result:
`bot-docs/reports/performance/2026-10-06-full-readback-loss.md`.
The independent consumer audit strengthens the remaining release gate: cache-hit
availability must preserve known manager-thread shutdown/failure behavior before
browser parity acceptance. Transport lifetime PASS does not satisfy that gate.
