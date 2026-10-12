# Local Producer Fence Ownership Audit

## Decision

Source/lifetime audit supports a narrowly scoped implementation experiment:
retain the original producer fence on `SharedSurface_DMABUF`, not on every
`DMABufSurface`. Consume it only for its exact exported FD-wrapper generation
and creating EGL display. Keep descriptor publication, consumer ownership,
buffer recycling, producer flush and the existing imported-FD fallback.

No product patch, compiler, native test, browser, profiler load, remote process,
installation or owner-profile action occurred in this phase. The candidate is
not implemented or performance-accepted. The full rendering/layout/CSS/JS goal
and the rare approximately 154 ms Renderer stall remain open.

The motivating [saved-profile result](2026-10-07-current-render-cost.md) has
34 of 37 `FenceWaitFd` samples in fence creation, including 28 in driver batch
execution below `tc_sync`. Those are samples, not milliseconds or proof that
retention will improve playback. No old timing output was modified or pooled.

## Package Authority

The new read-only source verifier checks all 67 package source pins and 21
additional base files. Each additional file equals Git base
`892431809a4caadb5c73b2c03ad9bdb124c3e21e`, and is absent from both the frozen
patch inventory and supplemental-source inventory. Current index SHA remains
`3b78253cf775a4a1e8c69a4b82cc3958b366056129a391f4ae362bdfe8e4e0c4`.

Authority is the descriptor-borrow export, BuildID 20261006175655, not merely
today's dirty checkout or Searchfox tip. The source manifest SHA is
`a9befff9082463b5c643889c0e755e5f88a09d674d6aff00b3ad05d89cf1935c`;
frozen patch SHA is
`d1bf3bdfe9f7d36c82181db0b4487592d5b8857b070e43c1b2ee6aaea9cd1677`.
This phase does not re-prove binary execution or rehash the whole package.

The first verifier attempt used nonexistent `GLContextEGL.cpp` and stopped
before writing its receipt. Searchfox identifies the implementation as
`GLContextProviderEGL.cpp`; the corrected verifier passes. The original failed
log remains. This was an audit-path error, not a product regression.

## Ownership Map

| Stage | Inspected authority | Required invariant |
| --- | --- | --- |
| Produce | `DrawTargetWebgl::CopyToSwapChain`, `WebGLContext::CopyToSwapChain` | Existing drawing and asynchronous owner IDs unchanged |
| Acquire | `SwapChain::Acquire`, `SwapChainPresenter::SwapBackBuffer` | Existing size/color/validity checks; wait before producer acquisition |
| Release | `SharedSurface::EndWrite`, `SharedSurface_DMABUF::ProducerReleaseImpl` | Unlock, release, commit ordering unchanged |
| Fence | `DMABufSurface::FenceSet` | Same export and flush; original sync may be retained locally |
| Publish | `ToSurfaceDescriptor`, `WebGLContext::PushRemoteTexture` | DMABuf keeps original shared surface alive; exported wrapper unchanged |
| Consume | `RemoteTextureOwnerClient::PushTexture`, `DMABUFTextureHostOGL`, `RenderDMABUFTextureHost::Lock` | Existing host reuse, texture import and semaphore handling unchanged |
| Recycle | `RemoteTextureMap::RecycleTexture`, `GetRecycledSharedSurface` | Return same producer object only through existing release checks |
| Reacquire | `StoreRecycledSurface`, `BeginWrite` | Same GL-context restriction; wait on admitted generation before writing |
| Destroy | Shared-surface, DMABuf and EGL destructors | Destroy retained sync exactly once using its creating display |

`GetRecycledSharedSurface` returns `wrapper->mSharedSurface`, not a new
DMABuf imported from an equivalent descriptor. `StoreRecycledSurface` rejects
another GL context; `Acquire` retains its existing descriptor and validity
checks. This supplies an object-local location for one retained sync.

All four `RecycleTexture` call paths were inspected: push/releasing queues,
removal of never-wrapped waiting textures, obsolete textures during update,
and owner-unregister cleanup. Active compositable references prevent normal
recycling; unregister can instead preserve data/wrapper in a destruction
callback dispatched to the creating event target. Existing 7/21 recycle-bin
limits and recycling-disabled behavior must not change. These CPU ownership
checks are not independent proof of physical GPU completion.

The cached texture-host path returns its prior host without rebuilding it
from each descriptor. RenderDMABuf locking creates/binds textures and invokes
`MaybeSemaphoreWait`, not the producer's `FenceWait`. The candidate must not
treat its retained producer fence as a new consumer-release protocol or add
fences to that cached host. Explicit and implicit consumer synchronization
remain as before; their complete driver behavior is not newly established.

## Generation And Display Constraints

Current `mSyncFd` writers are `FenceSet`, RGBA/YUV descriptor import and the
move-out in `FenceWait`. Serialization retains the wrapper, and its underlying
handle is const. Keeping a strong reference to that exact wrapper provides a
generation token; raw descriptor numbers and surface UID/PID are insufficient.
Holding the wrapper prevents pointer recycling while the token is live.

The normal valid-FD import refers to the same native fence; importing -1
instead creates a new producer fence. Therefore retention is eligible only
after successful sync creation and a nonnegative exported FD. FD ownership
and exported duplicate lifetime must remain intact. These constraints follow
the [ANDROID native-fence contract](https://registry.khronos.org/EGL/extensions/ANDROID/EGL_ANDROID_native_fence_sync.txt).

The wait still uses the creating display, flags zero and the existing infinite
timeout. The producer flush is mandatory; otherwise an unsubmitted fence can
wait indefinitely. Destroying the EGL handle invalidates that handle, so no
second consume or later status query may use it. See the
[KHR fence contract](https://registry.khronos.org/EGL/extensions/KHR/EGL_KHR_fence_sync.txt).

`EglDisplay` uses `std::shared_ptr`, not Mozilla `RefPtr`. Its destructor may
skip native termination if another wrapper for the same native display is
already live. Thus an expired weak wrapper does not prove the native fence
was destroyed. The proposed holder retains the creating display strongly;
the owning shared surface already retains its GL context and display. Release
the holder before the surface/base context reference is destroyed. No context
must be made current just to destroy the sync. The indexed `Shutdown`
declaration is not an additional implementation/caller of termination; the
inspected `fTerminate` call is the display destructor.

`SharedSurface_DMABUF` destruction can return early when `MakeCurrent` fails.
Holder destruction must still run. Generic DMABuf `ReleaseTextures` is called
both under and outside its surface mutex, so adding cache locking there would
risk deadlock and enlarge the lifetime change. It is excluded from this design.

Retention also keeps the sync's internal native FD alive alongside the exported
duplicate until reuse or destruction. It is at most one sync per participating
surface, not a process-wide bound. Existing pool limits do not bound the number
of canvases/owners. Many-surface idle/destruction resource checks are therefore
required; lower reconstruction cost cannot excuse unbounded growth or a
shutdown regression.

## Known Failure Boundaries

Current `FenceSet` ignores `MakeCurrent`'s result and can wrap an invalid
exported FD. Current fallback cloning/import can fail, and its 100 ms poll
failure is logged rather than propagated. These are source observations, not
observed failures in the recorded playback. They prevent claiming universal
synchronization safety from the healthy path alone.

Do not certify retention after failed current-context admission, creation or
export. Do not silently repair generic failure behavior as part of the speedup.
If the retained wait does not report satisfaction, use the existing FD path
before consuming the holder; test that extra failure fallback explicitly.
No client-wait to server-wait conversion, shortened wait, skipped flush or
default feature/pref change is included.

Wayland's two `FenceWait` callers, its `FenceSet`, local HDR conversion's
`FenceSet`, imported RGBA/YUV descriptors and semaphore import remain outside
the opt-in holder path. Searchfox currently shows additional `FenceSet` calls
in creation/update paths that are absent from this exact package source;
the local pinned inventory, not the newer index, governs implementation.

## Verification Design And Result

The existing actual-source C++ test pattern in
`tools/umbrafox/tests/readback/test/import-reuse-spec.mjs` extracts native
methods and compiles them with fake GL/IPC primitives. Use that pattern for
failing-first fence operation ledgers, not a separate JavaScript model of the
optimization. No process-global EGL dispatch interposition is needed.

Real-EGL follow-up can use the existing `EglDisplay::fGetSyncAttrib` and native
test fixture pattern. Test the original handle while valid, exact pixels,
independent exported FD validity, replacement and context-loss cleanup.
Do not call an invalid old handle merely to infer deletion. Ledger counters
prove exactly-once calls; native tests supply separate lifetime/pixel evidence.
Neither source tests nor synthetic pixels establish playback performance.

The [implementation plan](../../plans/local-producer-fence.md) gives the API,
failure matrix, scoped files and prospective commands. The next action is its
P1 failing-first source-method tests, followed by a narrow implementation and
native correctness gates. No new owner decision is needed for ordinary source
work within the authorized performance goal; browser/build execution requires
the phase's explicit preflight and retained ownership controls.

P0's three Node test groups pass: patch-inventory malformed input rejection,
base/overlay/byte mismatch rejection, and replay of the exact 88-file receipt.
These are provenance tests, not fence tests. New evidence is under
`artifacts/umbralink-control/local-producer-fence/`; prior namespaces are sealed
and unchanged. No new performance percentage or stutter-fix claim is made.
