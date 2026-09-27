# Current Pi live-copy source liaison

2026-09-26. Read-only source/evidence investigation for task `l8ros-support`.
No browser source, defaults, frozen evidence, Pi state, builds or installations
changed. Only this scratch report and progress DB were written. l8ros owns all
physical runtime decisions, including its independent Wyatt authorization.

## Answer

V2 reduces the readback dimensions; it does not make video-to-canvas zero-copy or
asynchronous. Eligible `drawImage(video, 0, 0, 320, 180)` calls still perform a
synchronous remote round trip, GPU conversion/scaling, CPU-visible pixel readback
and a subsequent canvas draw. Accelerated and demoted canvas providers have
different downstream upload paths. V2 deliberately keeps sized readback available
after provider demotion. Do not attribute the residual 8.562% drops to one stage
from these source facts alone.

Owner-selected prototype ON / logging OFF on Pi BuildID `20260926103749` is not
the official browser default. The planning assignment did not countermand that
state or l8ros's independently authorized runtime work; clarification was sent
to pane %31 with a separate Enter and verified consumed.

## Per-copy path

1. `CanvasRenderingContext2D::DrawImage` in
   `dom/canvas/CanvasRenderingContext2D.cpp` tries the remote-canvas descriptor
   path first. `ValidSurfaceDescriptorForRemoteCanvas2d` does not accept DMABuf.
   For remote DMABuf video without canvas filter/shadow, V2 defers readback until
   rectangles are known. `MaybeGetScaledSourceSurfaceForRemoteVideo` additionally
   requires full source, identity target transform, linear sampling, no rotation
   and positive integer downscale dimensions. The fixture's CSS opacity/size is
   downstream of the canvas operation, not a canvas-context filter/transform.
2. `GPUVideoImage::GetAsSourceSurface(IntSize)` in
   `gfx/layers/GPUVideoImage.h` directly invokes its manager for every call.
   There is no per-image sized-surface cache here. The normal canvas image cache
   requires `nsIImageLoadingContent`; it is not a video-frame readback cache.
3. `RemoteMediaManagerChild::Readback` in `dom/media/ipc` dispatches a
   `SyncRunnable` to its manager thread and waits without spinning the JS event
   loop. That runnable issues the **sync** `PRemoteMediaManager.Readback` message.
   Thus content can wait for dispatch scheduling, remote work and the response.
4. `RemoteMediaManagerParent::RecvReadback` looks up the retained image and
   allocates shmem via `Image::AllocateSurfaceDescriptorBufferRgb` through
   `DMABUFSurfaceImage::BuildSurfaceDescriptorBufferForSize` and
   `DMABufSurfaceYUV::BuildSurfaceDescriptorBufferForSize`. BGRA output is
   230,400 payload bytes at 320x180 versus 8,294,400 at 1920x1080, before allocation
   overhead. Failed/unsupported sized readback returns null and the canvas caller
   can make one additional full-size fallback request; this is not the success path.
5. `widget/gtk/DMABufSurface.cpp` reuses `mGL` when available. Otherwise it locks
   `sSnapshotContextMutex`, claims the process-global headless snapshot context,
   makes it current, and later releases imported textures and returns the context.
   The snapshot context is cached, not newly created for every readback. In that
   snapshot branch, imports can be recreated because textures are released.
6. `DMABufSurface::ReadIntoBuffer` creates missing per-plane textures/imports,
   allocates a temporary destination RGB texture with `TexImage2D(nullptr)`, and
   creates its framebuffer. `GLBlitHelper::Blit` performs YUV/RGB conversion and
   scaling, with V2 retaining visible-region crop matrices but skipping the old
   source-size clipping transform. `ReadPixelsIntoBuffer` then calls `fReadPixels`
   into CPU-addressable memory. Format/alignment fallback can add a temporary
   surface and `SwizzleData`; it is conditional, not established for this Pi.
   DMABuf import itself also has format-dependent CPU-copy fallbacks. No evidence
   in this lane identifies which import/fallback branch the current runtime takes.
7. The child wraps returned shmem with `Factory::CreateWrappingDataSourceSurface`
   and attaches destruction ownership. This wrapping does not itself memcpy the
   pixels. `DrawImage` optimizes/draws the source and invalidates its destination.
8. **Accelerated recording provider:** `DrawTargetRecording::OptimizeSourceSurface`
   stores the new source. `CanvasDrawEventRecorder::StoreSourceSurfaceRecording`
   can share DATA_SHARED surfaces, but the readback wrapper is SourceSurfaceRawData,
   so its fallback records source pixel bytes via `RecordedSourceSurfaceCreation`.
   On CanvasRenderer, `SharedContextWebgl::DrawRect` obtains a texture handle and
   `UploadSurfaceToHandle` uploads a fresh data surface when no cached handle exists.
   `UploadSurface` uses a PBO staging upload where eligible, otherwise CPU input.
   This is an upload after the remote readback, not direct DMABuf video import.
9. **Demoted provider:** the canvas can use a shared/basic software target and
   CPU raster draw instead; it does not pay that CanvasRenderer WebGL source upload.
   A displayed shared canvas still reaches the compositor as image updates.
   `BufferTextureHost::PushResourceUpdates` selects a buffer/native-texture path
   according to policy; `RenderBufferTextureHost::Lock` exposes CPU buffer data.
   Do not count both accelerated and demoted paths as unconditional costs, or
   equate a buffer lock with completion of the downstream GPU upload/presentation.

## Demotion is a separate state transition

`SharedContextWebgl::UploadSurfaceToHandle` calls `mProfile.OnCacheMiss()`.
`DrawTargetWebgl::UsageProfile::EndFrame` fails a profile frame for a software
fallback or when misses + readbacks + layers exceed the configured ratio of all
counted operations. Local defaults are `profile-cache-miss-ratio=0.66`,
`profile-frames=10`, `profile-fallback-ratio=0.3` in `StaticPrefList.yaml`.
`RequiresRefresh` needs at least 10 frames and a failure fraction greater than
0.3; it does not guarantee demotion on precisely the tenth callback.

`CanvasTranslator::UnlockTexture` -> `NotifyRequiresRefresh` ->
`CanvasChild::RecvNotifyRequiresRefresh` -> recorded texture/provider
`RequiresRefresh` -> `CanvasRenderingContext2D::BorrowTarget` rejection ->
`TryAcceleratedTarget` sets `mAllowAcceleration=false` -> shared/basic target.
The V2 sized-readback selection is outside the accelerated-provider predicate.
The legacy public `Demote()` method is empty and is not this heuristic.

## Existing diagnostics and their limits

| Existing signal | What it can establish | What it cannot establish |
| --- | --- | --- |
| Profiler Runnable spans, including remote `Readback` dispatch | Coarse runnable execution/wait occupancy; prior V2 report identified RDD Readback spans | Separate shmem allocation, import, blit, GPU wait and readback latencies |
| `IPC` markers with `ipcmessages`; optional `IPC`/`IPCDispatch` flows | PRemoteMediaManager request/reply boundaries; NotifyRequiresRefresh message when emitted; correlate by process and sequence/flow | All content dispatch delay, per-GL-operation cost, or hardware completion |
| `CanvasTranslator` text markers: BeginTransaction and PresentTexture | Recording canvas transaction boundary and PresentTexture CPU span | A timer for source upload or RDD readback; not guaranteed after demotion |
| Privileged `CanvasRenderingContext2D.getDebugInfo()` | isAccelerated, isShared, backendType, drawTargetType | Cause/timing history of demotion or pixel/readback size |
| Native samples in RDD/content/CanvasRenderer/Renderer | Positive stacks at ReadPixelsIntoBuffer, upload, Skia draw, waits | Exact per-copy timings; absence in a short sample is not proof of no work |
| Existing DMABUF logs | Sized versus legacy branch and UID/import details | Unperturbed timing or profiler stage spans |

`getDebugInfo` is gated to system principal/about:fingerprintingprotection, not
ordinary website JS. `false` can throw when no target is borrowed; `true` can
ensure/refresh a target. Use any such state check outside the timed window,
recording that it is a diagnostic, and do not use the colored debug overlay.
No dedicated allocation/blit/readback/upload stage markers were found in the
actual functions above. IPC and PresentTexture markers are coarse boundaries.

## Single cheapest next hypothesis and measurement

**Hypothesis:** with prototype ON, some residual live-copy loss survives without
visible canvas presentation because the synchronous sized-readback/canvas-draw
path still stalls. This is testable without a rebuild, fixture edit, new probe,
pref override or Mesa/GL observer.

For l8ros to schedule under its own authority after its current experiment:
reuse the unchanged local fixture, same binary/prototype setting, original
governor and verified/restored renderer selection. Run existing modes
**1 / 8 / 3 / 8 / 1**, with the existing settling and bounded approximately
30-second measured windows; profiling/logging/screenshots/overlay remain off.
Mode8 is hidden-small-copy; mode3 is fullscreen visible-copy. Both copy the live
video at 320x180 using `requestVideoFrameCallback`. No duplicate-rAF-copy theory
is justified. Callback count falls with delivered frames, so record existing
copy counts outside the windows and do not assume fixed 30 copies/sec.

Confirm provider state after warm-up in separate non-timed checks. If mode8
remains accelerated while mode3 demotes, report that confound instead of treating
the pair as isolating only presentation. Do not force a heuristic pref merely
to manufacture matching states. Normalized drops plus copy cadence and provider
state are sufficient for this first discriminator.

- Hidden mode materially above adjacent plain, with matched provider/cadence:
  supports upstream live-copy cost as a target, but does not distinguish remote
  GPU wait from CPU copy/raster by itself.
- Hidden near plain while visible remains worse: deprioritize allocation-only
  repairs and investigate visibility-dependent upload/presentation or GPU
  contention affecting the readback. It does not prove readback is cost-free.
- Different provider or unstable controls: inconclusive; do not claim a fix.

No source change is proposed before that discriminator. In particular, disabling
demotion does not remove the sync round trip, and reusing an RGB texture would
remove allocations but not the completion dependency in `ReadPixels`.

## Evidence and verification

- Current local modified V2 producers/consumers were read directly; unchanged
  upstream support paths were located with Searchfox and the demotion definition
  was also checked locally. Searchfox advertises an update; nothing was installed.
- l8ros supplied the current fixture at `pi-effects-current.html` in this scratch
  directory. SHA256 `24db9d58f17c2ddea4c9fb62fb485b7c178877e213b91af0a9a2e9ddec8d013b`
  matches the previously documented served fixture. Its mode8, mode3, copy counter,
  rVFC cadence and mode11 putImageData path were inspected, not inferred.
- The laptop `pi-opacity-benefit-2026-09-26.md` reports current prototype-trial
  cached 2.522/3.516/2.536% and visible-copy 8.562%. The latter is not a repeated
  matched source-only isolation of readback cost; cached and live backing can differ.
- Historical `umbrafox-scaled-readback-v2-2026-09-25.md` reports hidden 2.41%,
  visible 50.82%, sustained sized readbacks and software-provider evidence.
  Its profiled mean RDD Readback span 23.04ms and Renderer waits are **old V2**,
  not measured again with the opacity prototype ON. They motivate the discriminator,
  not attribution of the current 8.562% result. Real 720p60 provider playback is
  separately harder and is not matched to this local 1080p30 fixture.
- No tests, profile capture, Pi command, build or source edit were run by this lane.
  Runtime validation remains l8ros's work; exact parity is not established here.

Selected upstream permalinks (local V2 additions are not indexed):

- [UsageProfile::EndFrame](https://searchfox.org/firefox-main/rev/9c0ad0c9084ef0e36d29aae83892ea4edf3c9085/dom/canvas/DrawTargetWebgl.cpp#6575-6592)
- [UsageProfile::RequiresRefresh](https://searchfox.org/firefox-main/rev/9c0ad0c9084ef0e36d29aae83892ea4edf3c9085/dom/canvas/DrawTargetWebgl.cpp#6594-6605)
- [SharedContextWebgl::UploadSurface](https://searchfox.org/firefox-main/rev/9c0ad0c9084ef0e36d29aae83892ea4edf3c9085/dom/canvas/DrawTargetWebgl.cpp#2615-2763)
- [ReadPixelsIntoBuffer](https://searchfox.org/firefox-main/rev/9c0ad0c9084ef0e36d29aae83892ea4edf3c9085/gfx/gl/GLReadTexImageHelper.cpp#222)
