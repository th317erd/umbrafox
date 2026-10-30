# Recipe 16: Linux DMABUF video-to-canvas readback

> **Current conversion guidance.** Verify this operational guidance against source and the canonical Umbrafox documentation before applying it to a new Firefox base.

## Goal

Reduce the Raspberry Pi Wayland workload where `drawImage(video, ...)` copies a
hardware-decoded Linux DMABUF video frame into a much smaller Canvas2D target.

The failure mode this recipe preserves is that a small visible or hidden canvas
copy could force a native-size RGB readback from the decoded DMABUF frame. On a
1080p source copied into a 320x180 canvas, this created repeated 1920x1080 RGB
readbacks and extreme dropped-frame rates.

## Files changed

- `dom/canvas/CanvasRenderingContext2D.cpp`
- `dom/media/ipc/PRemoteMediaManager.ipdl`
- `dom/media/ipc/RemoteMediaManagerChild.cpp`
- `dom/media/ipc/RemoteMediaManagerChild.h`
- `dom/media/ipc/RemoteMediaManagerParent.cpp`
- `dom/media/ipc/RemoteMediaManagerParent.h`
- `gfx/gl/GLBlitHelper.cpp`
- `gfx/gl/GLBlitHelper.h`
- `gfx/layers/DMABUFSurfaceImage.cpp`
- `gfx/layers/DMABUFSurfaceImage.h`
- `gfx/layers/GPUVideoImage.h`
- `gfx/layers/ImageContainer.cpp`
- `gfx/layers/ImageContainer.h`
- `widget/gtk/DMABufSurface.cpp`
- `widget/gtk/DMABufSurface.h`

## Data flow

`CanvasRenderingContext2D::DrawImage` still prefers the existing remote-canvas
surface-descriptor path when Gecko supports that descriptor type. Linux DMABUF
remote decoder frames are not accepted by that path because
`CanvasTranslator` does not yet import DMABUF descriptors as drawable
`SourceSurface` objects.

For Linux DMABUF remote video frames only, the canvas code now defers the
legacy `GetAsSourceSurface()` fallback until after source and destination
rectangles are known. It then tries a constrained sized readback when all of
these are true:

- The frame is a remote decoder `DMABuf` GPU video image.
- The draw is a full visible-source copy.
- The destination is smaller than the video frame.
- The destination size is integer-valued.
- The target transform is identity.
- The sampling filter is linear.
- The video has no rotation.
- No filter or shadow is being applied.

The remote-canvas surface-descriptor fast path remains gated on an accelerated
recording target. The sized DMABUF readback path does not depend on that gate,
because `DrawTargetWebgl::UsageProfile` can demote the canvas provider after
warm-up. Tying sized readback to `PersistentBufferProviderAccelerated` made the
optimization disappear after the first profiling window.

`GPUVideoImage` forwards the requested readback size to
`RemoteMediaManagerChild`. The `PRemoteMediaManager.Readback` IPC message now
accepts an optional `IntSize`. `RemoteMediaManagerParent` asks the stored
`Image` to build a `SurfaceDescriptorBuffer` at that size. If sized readback is
unsupported or fails, the parent returns `null_t`; the canvas caller then uses
the old full-frame fallback exactly once.

`DMABUFSurfaceImage` forwards sized readback to `DMABufSurface`. The YUV
implementation allocates a smaller RGB descriptor buffer and reuses the
existing GL DMABUF blit path to scale the decoded frame into that buffer before
readback.

`GLBlitHelper::Blit(DMABufSurface*)` keeps its default clipping behavior for
existing callers. Sized readback passes `aScaleSourceToDest=true`, which keeps
the visible-region crop matrices for macroblock-aligned textures but skips the
`texSize` clipping transform that otherwise samples only the top-left portion of
the source when destination size is smaller than video size.

## Rulebook notes

This is an internal performance change. It does not add or remove web-exposed
JavaScript, CSS, DOM, WebIDL, network, storage, media API, or user-agent
surface. Canvas output must remain Firefox-equivalent.

The optimized branch is deliberately narrow to avoid changing observable canvas
pixels for cropped, transformed, rotated, shadowed, filtered, fractional-size,
non-DMABUF, or non-downscale draws. Unsupported cases keep using Firefox's
existing path.

Do not "fix" this by disabling website visual effects, spoofing capabilities,
lowering provider quality, changing frame rate, forcing the native WebRender
compositor, or exposing an Umbrafox-specific feature flag to page scripts.

## Verification

Minimum local verification:

```bash
./mach format dom/canvas/CanvasRenderingContext2D.cpp dom/media/ipc/PRemoteMediaManager.ipdl dom/media/ipc/RemoteMediaManagerChild.cpp dom/media/ipc/RemoteMediaManagerChild.h dom/media/ipc/RemoteMediaManagerParent.cpp dom/media/ipc/RemoteMediaManagerParent.h gfx/layers/DMABUFSurfaceImage.cpp gfx/layers/DMABUFSurfaceImage.h gfx/layers/GPUVideoImage.h gfx/layers/ImageContainer.cpp gfx/layers/ImageContainer.h widget/gtk/DMABufSurface.cpp widget/gtk/DMABufSurface.h
./mach build
./mach package
```

Pi validation must use the owned media-effects fixture from the L8ROS handoff:

- Run the plain video baseline.
- Run the 320x180 Canvas2D video-copy mode.
- Return to plain video.
- Confirm dropped-frame rates improve for the canvas-copy interval without
  regressing the before/after plain-video baseline.
- Validate pixels, including coded-size padding, crop behavior, color range,
  scaling, and hidden/visible transitions.
- Confirm repeated copies beyond `gfx.canvas.accelerated.profile-frames`
  continue to use the sized readback path and do not fall back to native-size
  legacy readbacks after warm-up.

This repair targets the canvas-copy workload. Direct CSS video blur was
identified as an independent problem and must be investigated separately.

## Rebase notes

Expected conflict hotspots:

- `dom/media/ipc/PRemoteMediaManager.ipdl` if upstream changes remote media
  readback messages.
- `gfx/layers/GPUVideoImage.h` if upstream changes `IGPUVideoSurfaceManager`.
- `dom/canvas/CanvasRenderingContext2D.cpp` around `DrawImage` remote-canvas
  and `GetAsSourceSurface()` fallback logic.
- `gfx/gl/GLBlitHelper.cpp` around `Blit(DMABufSurface*)` visible-region crop
  and `texSize` handling.
- `widget/gtk/DMABufSurface.cpp` around `DMABufSurface::ReadIntoBuffer` and
  `DMABufSurfaceYUV::BuildSurfaceDescriptorBuffer`.

If upstream adds a true accelerated DMABUF import for remote canvas playback,
prefer that architecture after confirming it preserves texture ownership,
fences, color conversion, crop handling, context/process loss behavior, and
Firefox canvas output parity.
