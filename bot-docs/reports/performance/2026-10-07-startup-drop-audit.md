# Startup Drop Counter Audit

## Scope

Read-only analysis of four completed laptop seek captures. New analysis and
tests are under `artifacts/umbralink-control/startup-drop-audit/`. No browser,
profiler daemon, SSH session, build, system-driver installation, product change
or desktop interaction was started. The owner's report concerns **seeking with
the progress bar**, not entering a search query. The long stutter followed by a
black flash and recovery remains unreproduced.

## Results

`results.json` verifies the pinned raw export hashes and all 404 embedded files.
The first 20-second segment precedes the actual seek at approximately 21.35s.

| Capture | Drops in first 20s | Counter increase observed between sequence times |
| --- | ---: | --- |
| Software forward | 25 | 5016-6017ms |
| Software backward | 0 | None |
| Private hardware forward | 24 | 5016-6018ms |
| Private hardware backward | 23 | 5016-6015ms |

All first segments retain 1920x1080 samples, readyState 4, at least 15.00s
buffered ahead, zero missed sampling slots, and no recorded media events.
Each interval with a counter increase also has 60 additional decoded frames
and approximately 0.98-1.02s of media-time advancement. These samples do not
show buffering starvation or a sampled resolution change. They do not exclude
a sub-second interruption or explain why composition fell behind.

The native media snapshot at the first sparse checkpoint, after the seek,
reports compositor-drop totals 25/0/24/23 respectively and zero decoder/sink
drops. Those totals match each first segment's cumulative drop increase.
They are cumulative observations, not timestamped joins to individual frames.
The paused pre-play decoder string is `shutdown` with one output sample, and
must not be used as proof of the decoder executing throughout playback.

The burst exists in a software run too, and is absent in another software run.
It is not established as hardware-specific or universal. The earlier 90-91%
reduction in RDD process CPU remains a separate descriptive result, not proof
of smoother playback or the cause of the desktop owner's problem.

## Counter Publication

`source-proof.json` checks 13 relevant source files against the packaged recipe:
base `892431809a4caadb5c73b2c03ad9bdb124c3e21e`, frozen patch
`d1bf3bdfe9f7d36c82181db0b4487592d5b8857b070e43c1b2ee6aaea9cd1677`, and
source-final manifest
`a9befff9082463b5c643889c0e755e5f88a09d674d6aff00b3ad05d89cf1935c`.
Twelve files are untouched by that patch. Its sole ImageContainer.cpp hunk
adds `BuildSurfaceDescriptorBufferForSize`, not the drop-reporting code.
This is source-recipe evidence, not fresh loaded-code proof.

The relevant chain is:

1. `ImageComposite::UpdateCompositedFrame` counts skipped frames, with a
   previous-composition visibility condition, and accumulates drops. It already
   emits the **Video frames dropped** text marker with frame and producer IDs
   when its thread is being profiled for markers.
2. `WebRenderImageHost::GetDroppedFrames` reads and resets that pending count.
   `ImageBridgeParent::RecvUpdate` sends it through `ReportFramesDropped`.
3. `ImageBridgeChild::RecvReportFramesDropped` calls the container listener;
   `ImageContainer::NotifyDropped` adds it to the cumulative container count.
4. `VideoSink::UpdateRenderedVideoFrames` consumes the container delta and
   updates `FrameStatistics`, when it has removed frames from its queue.
5. `HTMLVideoElement::GetVideoPlaybackQuality` reads those cumulative statistics
   in the normal non-RFP path. The separate decoded/presented/painted/quality
   property reads are not an atomic cross-thread snapshot.

Upstream discovery references: [drop marker producer](https://searchfox.org/firefox-main/rev/cfd140a311d8523d3d35e00ee1a9f2403c033dfd/gfx/layers/composite/ImageComposite.cpp#253),
[asynchronous report](https://searchfox.org/firefox-main/rev/cfd140a311d8523d3d35e00ee1a9f2403c033dfd/gfx/layers/ipc/ImageBridgeParent.cpp#219),
[sink consumer](https://searchfox.org/firefox-main/rev/cfd140a311d8523d3d35e00ee1a9f2403c033dfd/dom/media/mediasink/VideoSink.cpp#571),
[frame-statistics totals](https://searchfox.org/firefox-main/rev/cfd140a311d8523d3d35e00ee1a9f2403c033dfd/dom/media/FrameStatistics.h#130).
The pinned local recipe, not current Searchfox tip, governs deployed attribution.

Consequently, the interval in the table bounds **observation of a counter
increase**, not the time at which all corresponding frames were dropped.
Analysis must retain a broad pre-increase interval instead of zooming only
at 6.0s. `actualDropTimeMs` is explicitly null in the new output. No host,
page, process, or profiler clock equivalence is invented.

## Existing Profiling Route

Installed profiler-cli is 0.10.0. Its full guide was saved and read, and load
help confirms explicit `--symbol-server` and named-session support. No daemon
was loaded. Any later load must use a unique owned session and explicit
`http://127.0.0.1:9`, with owned-session shutdown and PID/socket evidence.
Raw profile parsing is not an alternative to the CLI.

Existing private UmbraLink browser-realm execution can call
`Services.profiler.StartProfiler`, `Pause`, and `StopProfiler`; the existing
`umbrafox.performance.profile.dump` can write the capture. These are source-
supported routes, not newly verified live calls in this wave. The start/stop
promises acknowledge subprocess handling. Dumping can block the parent while
collecting its own data, so dumping must follow the playback window.

`ChromeUtils.addProfilerMarker` in the existing privileged frame script can
record collector boundaries and `innerWindowId` without putting marks, globals,
or properties on the page. Its explicit `startTime` uses `ChromeUtils.now()`;
page `performance.now()` must not be passed as that timestamp. Use one complete
interval marker and bounded text receipts to avoid relying on split-pair
reconstruction. Existing native compositor markers supply the actual drop
reporting point, subject to captured thread and producer identity.

Source references: [privileged marker options](https://searchfox.org/firefox-main/rev/cfd140a311d8523d3d35e00ee1a9f2403c033dfd/dom/chrome-webidl/ChromeUtils.webidl#350),
[native marker conversion](https://searchfox.org/firefox-main/rev/cfd140a311d8523d3d35e00ee1a9f2403c033dfd/dom/base/ChromeUtils.cpp#308).
The prior profiler-cli clock finding still applies: exported marker positions
subtract rootRange.start while context.rootRange remains raw. Prefer relative
differences between markers in the same CLI export; verify any absolute join.

## Next Bounded Capture

Use the same frozen laptop package and private driver, fresh owned roots,
ordinary 1080p quality selection, and unchanged resource/cleanup limits.
First establish a fresh 20s unprofiled observer control. Then take one matched
20s capture with a narrow, explicitly verified profiler configuration. Start
profiling only after quality readiness and before playback. No active-playback
diagnostic RPCs or profile dumps. Mark collector boundaries privately, pause
after playback, dump through UmbraLink, stop, verify inactive, and clean only
owned processes. Compare against the control before interpreting timings.

Before launch, implement and test the narrow scratch adapter, actual supported
feature/entry/filter admission, bounded dump/export path, marker/sidecar identity
and clock checks, and cleanup after failure. Do not change the shared capture
harness, its 256MiB artifact cap, browser defaults, or public interfaces merely
to make this measurement fit. Preserve timeout, overflow, missing threads or
markers as censored evidence, not successful captures.

The first question is whether the native drop marker co-occurs with parent or
content main-thread work, delayed image transactions, or slow composition.
Collect GeckoMain, Compositor, Renderer and ImageBridge coverage, plus verified
media task-thread names. Do not infer GPU execution time from Composite wall
time or require remote symbol uploads. Unsupported or ambiguous source/frame
joins stay unknown. This capture localizes the startup symptom; it does not
replace the separate post-seek recovery investigation.

## Verification

Six focused pure tests cover observation intervals, nonzero initial counters,
missing/reset counters, sparse or reversed clocks, identity/state changes,
incomplete input, buffer-range corruption, and retained format/buffer/event
changes. Initial red is an expected missing-module contract failure, not a
reproduced browser bug. Real-data recomputation verifies all four pinned
exports without modifying them. All six tests pass, and the existing full seek
validator passes separately for each of the four captures. Exact-file scratch
formatting and the report's codespell/whitespace/trojan-source checks pass.
These gates validate the offline interpretation, not a new browser fix.
