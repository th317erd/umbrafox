# Compositor Drop Attribution: Source Checkpoint

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

The failed descriptor-balanced comparison is preserved. Source inspection now
identifies existing markers that can distinguish renderer back-pressure,
video-image selection losses, and content callback delays without adding native
instrumentation. No browser, profiler daemon, native build or remote process was
started in this checkpoint. No new runtime cause or performance win is claimed.

The source audit joins BuildID20261006175655 to its recorded HEAD, identical
staged/working/combined patches, configuration, all60 explicit source pins and
all131 frozen harness inputs. Of28 additional inspected files,25 match the
recorded HEAD; ImageContainer.cpp/h and CanvasTranslator.cpp match their explicit
build pins. Searchfox supplied discovery and permalinks, not deployed provenance.
The installed CLI is0.10.0; Searchfox0.18.0 advertises0.20.4, not installed here.

## Counter Meaning

The actual source chain is:

1. WebRenderBridgeParent::MaybeGenerateFrame supplies composition time and
   opportunity ID to AsyncImagePipelineManager.
2. WebRenderImageHost::GetAsTextureHostForComposite calls ChooseImageIndex,
   selecting the newest valid image whose biased timestamp is due.
3. ImageComposite::CountSkippedFrames counts known intermediate images only
   when producer IDs agree and their estimated duration is at least the target
   refresh duration, compared after flooring milliseconds. Missing next-frame
   timestamps, unknown target rate, producer changes and faster-than-target
   video do not all become counted drops.
4. UpdateCompositedFrame ignores skips when the video was absent at the previous
   composition opportunity. Otherwise it increments mDroppedFrames and emits
   the instant Text marker `Video frames dropped`, including count, previous
   frame ID, selected frame ID and producer ID.
5. A later ImageBridgeParent::RecvUpdate reads and resets that count, then sends
   ReportFramesDropped. ImageBridgeChild forwards it through the container
   listener to ImageContainer::NotifyDropped.
6. VideoSink::UpdateRenderedVideoFrames later reads the container delta and
   accumulates the compositor part of FrameStatistics. HTMLMediaElement's
   debug receipt reads the container count before asynchronously requesting
   decoder/reader statistics. Those two fields are not an atomic same-time pair.

The [selection/drop producer](https://searchfox.org/firefox-main/rev/4b5e436b8bc908fe7feb7341209140771397dda1/gfx/layers/composite/ImageComposite.cpp#197)
counts a pipeline selection loss, not a physical scanout observation. Its marker
timestamp is the counting operation, not necessarily the skipped frame's due
time. This explains why aggregate before/after counters cannot identify the
precise146ms callback gap in the previous capture.

`presentedFrames` from requestVideoFrameCallback is also not a hardware receipt.
HTMLVideoElement::WillFireVideoFrameCallbacks makes a best-effort selection from
the current image list. The refresh driver supplies estimated presentation and
next-tick times and may skip calling JavaScript when there is no new eligible
image. `requestVideoFrame callbacks` spans the document's processing, including
the eligibility check; one such span is not necessarily one executed callback.

## Existing Observations

| Marker | Useful evidence | Limitation |
| --- | --- | --- |
| Video frames dropped | Exact source counter increment; producer and frame IDs | No document ID or actual display timestamp |
| UpdateCompositedFrame | Producer/frame/opportunity IDs, timestamp offset, bias and remaining images | Selection, not successful presentation |
| ImageComposite::SetImages | New queue range and producer/frame IDs | Text reports endpoints, not the entire queue |
| Video frame offsets / VideoFrameTimeStampJitter | Due-time relationship and changes to known image timestamps | Emission is conditional; missing rows do not prove zero jitter |
| SkippedComposite | Named reason and, for busy/paused paths, inner-window ID | Reasons must remain separate |
| CompositeToTarget | Compositor-side scope with document identity | Broader than image selection |
| Composite #window | Renderer update/render, swap and post-render tail | CLI-derived interval lacks raw split-pair completeness proof |
| requestVideoFrame callbacks | Content refresh-driver callback processing with document ID | Includes eligibility checks and potentially several callbacks |
| VideoSink::RenderVideoFrames / PlayVideo / VideoSinkDroppedFrame | Media clock, queued delivery and sink drop observations | Media microseconds are not profiler milliseconds |
| CanvasTranslator / PresentTexture | Canvas presentation/copy-to-swap-chain scope | Not all replayed draw events and not a physical present |

`SkippedComposite` has materially different reasons. "Too many pending frames"
is emitted when RenderThread::TooManyPendingFrames sees more than one pending
frame or an outstanding backend frame build. That branch does not advance the
composition opportunity ID. "No reason to generate frame" is an idle decision,
not renderer overload. "CompositorBridgeParent is paused" is separate again.
The [native branches](https://searchfox.org/firefox-main/rev/4b5e436b8bc908fe7feb7341209140771397dda1/gfx/layers/wr/WebRenderBridgeParent.cpp#2671)
must not be combined into a single stutter counter.

On this GTK code path, both RenderCompositorEGL and RenderCompositorOGL inherit
the base WaitForGPU implementation returning true. Their EndFrame calls
SwapBuffers earlier. The broader Composite marker cannot separate render,
upload, driver swap and tail costs. X11/WebRender alone does not identify which
concrete compositor was selected. Do not transfer a Pi Wayland-lock diagnosis
or infer a GPU fence wait from the generic method/metric name.

## Diagnostic Preparation

New private module: artifacts/umbralink-control/compositor-attribution/markers.mjs.
It builds eight retrospective phase marks from the unchanged collector's saved
normal-precision page times, joins those explicit timestamps to CLI-normalized
UserTiming instants, and classifies the two instant event families separately.
It does not parse raw profiles, reconstruct split intervals, or claim frame-ID
equivalence with requestVideoFrameCallback counters.

PerformanceMark::Constructor uses the explicit startTime as its unclamped value;
Performance::Mark adds it to the document creation timestamp. This supports
post-playback marks without timed-loop instrumentation. Real-browser validation
of that proposed adapter is still owed. The parser checks all eight anchors,
one document/process/thread, common offset within0.001ms numerical conversion
tolerance, equal raw profile contexts, complete row counts and finite normalized
bounds. This does not improve page-clock precision or independently establish
that two exports came from the same profile; load/file identity remains external.

A source check caught a command-contract mismatch before any capture:
profile-markers in CLI0.10.0 computes slice(0, min(limit, maximum)). Thus
`profile markers --limit 0` returns zero rows, unlike commands where zero means
unlimited. The new contract uses50000 and requires markers.length==totalCount.
The exact installed bundle hash and exporter snippet are recorded in
source-final.json. A truncated or filtered export is an error, not zero drops.

Seven pure test groups pass, including positive clock translation and separate
busy/idle/paused cases, corruption of identities/fields/clocks, duplicates,
unknown reasons, truncation, half-open phase edges and empty coverage. Initial
missing-module RED is infrastructure evidence only. The incorrect zero-limit
assumption has a separate3-pass/4-failure RED followed by7-pass GREEN.
Fixtures are synthetic and based on inspected producer/export schemas, not a new
recording. Real export acceptance remains a required diagnostic gate.

## Next Step

Follow ../../plans/compositor-attribution.md. Implement the small diagnostic
adapter with failing tests, exact package/harness admission and unchanged capture
resource/cleanup limits. Use profiled playback between matching unprofiled
controls. Treat profiler-induced drops as a possible observer effect. Do not
change back-pressure limits, queue sizes, timestamp bias, defaults, public APIs
or pixel tolerances based on this source trace. The full rendering/layout/CSS/JS
performance objective remains active.
