# Complete Compositor Cost Partition

## Result

The complete saved call trees account for every non-idle sample on Renderer,
CanvasRenderer and Compositor. The largest newly resolved rendering substage is
upload-buffer fence creation, but most samples under it execute queued CPU-side
draw, clear and framebuffer-state commands. It is not evidence of a GPU fence
wait, and it does not justify deleting synchronization.

This is an offline diagnosis of an existing profiled laptop run, not a new
speedup or a fix for the intermittent video stutter. The recording predates the
later GPU frame-reuse and descriptor-borrow changes. It cannot quantify those
changes' current hit rates or costs. The separate profiler observer-cost concern
remains; use unprofiled comparisons for any performance decision.

No product source, native build, browser, remote runtime, preference default,
daily installation, personal profile, Git index or Pi changed during this phase.

## Complete Populations

Each thread has 9700 total samples over the same normalized full capture.
The following regions are disjoint assignments of leaf self samples to their
outermost matching stage. Nested inclusive counts must not be added to them.

| Thread | Non-idle Samples | Disjoint Regions |
| --- | ---: | --- |
| Renderer | 559 | render 344; swap 109; other 106 |
| CanvasRenderer | 328 | replay 184; presentation 95; other 49 |
| Compositor | 275 | destruction 60; composition 44; notification 22; creation 5; other 144 |

Render and swap account for 61.5% and 19.5% of Renderer non-idle samples. These
are sampled stack populations, not measured CPU milliseconds, GPU utilization,
per-frame latency or a causal join to the previously observed long callback gap.
The texture-operations stage has no self samples assigned in this recording;
that does not establish zero executions or zero cost.

The first complete export has 1118/873/736 tree nodes. The separately symbolized
Mesa export has 1131/926/736. Both produce exactly the same stage totals and
sample category populations. Additional symbols change function identities and
tree structure, so the analysis does not assume stable function handles between
the two exports. Unresolved self samples fall from 227 to 12 on Renderer and
102 to 5 on CanvasRenderer; Compositor remains at 14.

## Actionable Paths

Inside render's 344 samples, `UploadBufferPool::end_frame` has 95 inclusive
samples. Its descendant `tc_batch_execute` has 90, including disjoint child
branches for draw commands (43), framebuffer state (17) and clears (17).
This localizes driver command processing to a synchronization entry point.
It does not establish why that branch was selected, how much wall time it took,
whether the GPU was idle, or whether moving the work would make a frame faster.

Other immediate render children include simple composition (43), external
image locking (42), texture-uploader flush (32), and alpha batching (20).
The swap region separately contains Mesa DRI3 swap and flush/submission work.
Canvas replay and presentation remain important independent costs. Presentation's
fence setup/reuse paths also contain command processing; naming a function
`FenceWait` is insufficient to attribute all of it to waiting on hardware.

The recorded Gecko sources already create upload-pool fences only when recyclable
buffers have been returned. Beginning a frame polls those fences with timeout
zero, and buffers are reused only after signaling. Removing that protection would
risk reusing upload memory while the GPU still owns it.

The official Mesa 25.2.8 `mesa_fence_sync` source selects deferred flushing based
on the shared-context reference count. `tc_flush` has asynchronous/deferred and
synchronous command-processing paths. The observed stack supports investigation
of that choice, not a claim that the actual reference count or branch condition
has been measured. The official tag source is not independent proof of every
Ubuntu downstream source patch.

## Existing Diagnostic Control

The build already implements `gfx.webrender.pbo-uploads`, default true. The source
chain is: preference callback, `gfxVars::WebRenderBoolParameters`, root bridge
`UpdateBoolParameters`, `WebRenderAPI::SetBool`, Rust parameter message through
scene building and the backend, renderer receipt, then `GlDevice::set_parameter`.
It selects `PixelBuffer` versus `Immediate` uploads for hardware WebRender.
It does not turn off WebRender or hardware acceleration. Software WebRender is
explicitly excluded from that parameter change.

Both ordinary and batched upload paths have explicit immediate-data alternatives.
This is different from disabling `gfx.webrender.batched-texture-uploads` and does
not require changing either setting globally. The next test can use the existing
control in fresh disposable profiles. Requested preference state is not a direct
runtime receipt of the renderer's internal upload method; preserve that limit.

The useful falsifier is a fixed, unprofiled PBO-on/off comparison with identical
package, hardware, canvas import mode and workload. The proposed protocol is in
[PBO Upload Control](../../plans/pbo-upload-control.md). A speedup is not assumed:
immediate uploads may move the same work, add copies, or regress other scenes.

## Provenance

Profile SHA256: `8eda357095b8945e7e132418ddc3024d16039416d470520800973e3dd464f18c`.
Runtime BuildID: `20261006175655`. Raw capture bounds:
`11327.148373` to `60409.671211` ms. All attribution uses the CLI's normalized
range, zero to their difference, and full-range sample counts agree with the
previous range audit. Parent PID 1688238 owns all three selected native threads.

The normal recorded package is `exports/umbrafox-descriptor-availability-20261006`.
Its source HEAD is `892431809a4caadb5c73b2c03ad9bdb124c3e21e`, plus frozen patch
`82f87fa6047c6b19608ad920995050accbacd3e655c3000c38faaa37b2929f32`.
Twelve relevant files were reconstructed with Git's patch parser in an isolated
non-worktree artifact directory; one additional unchanged upload file was joined
to the same source HEAD. Every reconstructed byte stream is hashed. The current
renderer file differs from the recording, so it is not substituted for that
build's source. The worktree and index were not modified by reconstruction.

Mesa symbols are the already authenticated local Ubuntu package symbols, matched
to Breakpad ID `D40187191DB6AFC1D1949464114E27C10`. The symbol file SHA256 is
`a9d10145543cfd2851f2204f510ea2b305aae49d96c9088c31b5804a13637e71`.
No new symbol package was downloaded. Renderer and CanvasRenderer library
receipts match; Compositor has no Gallium frames. The first unexecuted exporter
draft incorrectly demanded such frames on all threads; it is preserved, and
only the corrected `export-mesa-r1.mjs` was run.

Upstream discovery used Searchfox CLI 0.18.0, which advertises 0.20.4; no update
was installed. Useful independent source references are the
[root bridge parameter consumer](https://searchfox.org/firefox-main/rev/4b5e436b8bc908fe7feb7341209140771397dda1/gfx/layers/wr/WebRenderBridgeParent.cpp#1979),
[Mesa fence producer](https://gitlab.freedesktop.org/mesa/mesa/-/blob/mesa-25.2.8/src/mesa/main/syncobj.c),
and [Mesa threaded context](https://gitlab.freedesktop.org/mesa/mesa/-/blob/mesa-25.2.8/src/gallium/auxiliary/util/u_threaded_context.c).
The exact local source reconstruction, not upstream tip, anchors the Gecko claims.

## Verification And Cleanup

Sixteen focused test groups pass. Tests replay both entire saved results,
verify input hashes and all 46 command exit receipts, and reject 36 mutations
of the six real trees. Earlier synthetic coverage rejects truncated trees,
invalid counts, duplicate identities, missing inventory, mixed clocks and filters.
The previous truncated 501-node trees cannot be accepted as complete.
Source checks cover the preference message chain and the existing fence guards.
They are not substitutes for runtime parameter or GPU-presentation evidence.

The earlier missing-module RED and malformed-clock behavioral RED are retained.
An added source assertion initially used the wrong Rust fence-field spelling;
14 tests passed and that assertion failed. It was corrected against the recorded
source, not by changing product code. Generated exporters and saved replies
retain their exact as-run bytes.

Two offline CLI sessions used existing profile bytes and loopback-only symbol
servers, with unchanged memory/output/deadline limits and owned cleanup:

| Export | Symbol Server PID | CLI Daemon PID | Elapsed ms | Cleanup UTC |
| --- | ---: | ---: | ---: | --- |
| Complete | 3308270 | 3308316 | 7513.944 | 06:46:29.723 |
| Mesa | 3320075 | 3320115 | 8379.174 | 06:52:50.906 |

Both exact PID pairs and their named sockets were independently absent afterward.
No browser capture or raw-profile JSON parser was used. All 67 current product
source pins, HEAD, index and configuration still match the latest native milestone.
The prior profile-range, driver-symbol and descriptor-playback seals verify.

Evidence is `artifacts/umbralink-control/compositor-cost-partition/`.
The overall performance goal remains active; no failed smoothness test is erased
and no optimization is accepted for daily installation by this diagnosis.
