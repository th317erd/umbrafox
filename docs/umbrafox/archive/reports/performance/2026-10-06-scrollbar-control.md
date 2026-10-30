# Scrollbar Overflow Video Control

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

The fixed A1/B1/B2/A2 laptop experiment completed without browser, capture,
resource or cleanup failure. Hiding root overflow does not eliminate every
startup callback gap. The two original-layout processes report1 and2 gaps above
50ms; the hidden-overflow processes report0 and1. The latter includes a63ms gap
111ms after playback begins. All16 phases have zero dropped video frames.

This is a useful controlled diagnostic, not a performance fix, statistical effect
estimate, YouTube diagnosis or release acceptance. Geometry confirms the intended
CSS intervention and no measured layout change besides computed overflow, but
cannot prove absence of native scrollbar animations. The previous27/29and28/29
performance screens remain failed. Neither their startup records nor their
independent146ms/compositor-drop event is replaced by this experiment.

## Prospective Contract

The [plan](../../plans/scrollbar-video-control.md) fixed the package, CSS delta,
geometry observation, order and bounds before execution. Both arms use the SAME
normal46-file render-pass-marker package, Build20261006175655, manifest
`4c8085f0f675c5b183976807df38bb99474bbd8be2e58651b52e4be9176eee8e`.
Direct import is explicitly ON in each disposable profile; profiler is OFF.
No native/module bytes differ between arms. Browser defaults and the owner's
desktop browser/profile/launcher/install remain untouched.

Arm A retains the exact original HTML and CSS. Arm B appends only
`html{overflow:hidden}`. Both play the same owned90s1920x1080 H.264 clip for48s
and draw into a320x180 default canvas in four12s phases with1/4/4/1copies.
There is no per-frame pixel read, extra timer, RPC or new public browser API.

Both take one identical geometry snapshot after inserting the canvas and before
initial drawing/playback. This forces layout and is a common observer change;
older captures without it are not pooled. Nine callback fields retain the prior
lossless per-phase JSON-string packing and512KiB transport ceiling. Actual
packaged serializer tests pass without raising its node or byte limits.

## Observations

| Measurement | A1 original | B1 hidden | B2 hidden | A2 original |
| --- | ---: | ---: | ---: | ---: |
| Joined CPU, seconds |27.404|27.553|27.226|27.864|
| CPU observation, seconds |48.114|48.114|48.116|48.098|
| Startup gaps over50ms |1|0|1|2|
| Other gaps over50ms |0|0|0|0|
| Video drops, all phases |0|0|0|0|
| Four-copy batch P95, ms |2/2|2/2|2/2|2/2|
| Callback count |1188|1188|1188|1188|

Elapsed-weighted CPU rates are0.574434 original and0.569253 hidden, a descriptive
0.902% reduction. With two processes per arm and variation of comparable size,
this is not convincing CPU-speedup evidence. Stable endpoint/sample joins omit
transient processes. Draw-call wall time does not measure GPU completion.

All measured geometry is identical except computed root overflow:

- Viewport/root client size1280x955; root and body scroll extent1280x1140.
- Canvas rectangle `(0,0,320,180)`.
- Video rectangle `(0,185,1280,955)`.
- Both axes compute to `visible` for A and `hidden` for B.

Hidden overflow does not remove the185px content overflow; it suppresses its
scrolling presentation. These records establish layout and style, not which
native scrollbar objects or transitions ran.

The four long gaps are:

| Run | Phase0 offset, ms | Callback gap, ms | Tick gap, ms | Callback age, ms | Adjacent batches, ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| A1 |1381|51|49.96|1.32|1/0|
| B2 |111|63|63.66|-0.46|0/0|
| A2 |1012|53|52.72|0.46|0/0|
| A2 |1213|51|50.30|1.16|2/0|

Negative callback age is preserved as recorded precision behavior, not clamped.
The larger portion of these intervals precedes callback execution; this does not
identify its scheduling cause or physical display timing. The remaining B2 gap
rules out the simple claim that hiding overflow removes all startup delays.

All graphics projections match: Intel Iris Xe RPL-P, Mesa/iris25.2.8.0,
X11/KWin, remote WebRender and available hardware compositing. Native final
receipts report ffmpeg/RDD H.264 hardware acceleration and zero decoder, sink,
compositor and container drops. Initial receipts retain the `shutdown` decoder
label; they are not asserted to show an already-running decoder. Provider
boundaries remain accelerated; they do not prove every individual import route.

## Verification And Cleanup

The new167-file harness preserves all158 prior inputs and checks its complete
33-module static-import closure. Harness SHA256:
`da60465191abdc16c4ebf25470eb53c823421982ecf02abe13bdfc853b2a4009`.
The previous source/index/config and66 product-file guards remain unchanged.
Only a new diagnostic namespace, this report, the plan and continuity are edited.

Source assertions first reproduced missing CSS and missing geometry:2 expected
failures, no harness errors. The first implementation pass exposed an ambiguous
replacement anchor and a cross-VM prototype comparison; both were corrected
without changing the experiment. A later analysis check confused the canvas
profile-preference object with profiler state. Its two failures are retained;
profiler state is instead validated from the actual saved performance/browser
receipts through the original capture logic.

The final23 test groups pass, including complete fake-clock equivalence,
malformed geometry, extraction exceptions and cleanup, all RPC/write/abort paths,
actual package serialization, exact CSS, generated-source equality, package and
deadline negatives, complete saved replay and ten actual-receipt corruptions.
The five HTTP range/cap/abort groups additionally pass in hidden mode. The saved
replay invokes the capture validators against all four actual response sequences
and reproduces every saved summary. Graphics projections match across all four.

The processes ran sequentially from04:06:36 through04:12:08UTC on October7,
still October6 in America/Phoenix. Each preflight found no recognized browser/
compiler activity and sufficient RAM/disk, followed by15s idle. Original120s
capture/15s cleanup bounds remained. No retries, profiler, build or Pi action.

| Run | Browser PID | Controller PID | Private run suffix |
| --- | ---: | ---: | --- |
| A1 |1820218|1820186|gcXIUz|
| B1 |1823086|1823074|7KaBrg|
| B2 |1825987|1825975|wlJCWm|
| A2 |1828896|1828884|ARfZsE|

All four cleaned up with owned SIGTERM and absent browser roots. Each log has
271bytes and zero drops; known EPERM and successful VA-API initialization lines
remain. All56 resource samples satisfy the unchanged caps; maximum sampled
artifact size146716276bytes. All48 recorded process IDs were independently absent
at04:12:26.297UTC. This is sampled process safety, not complete descendant history
or a network/OS sandbox claim.176 public evidence files total908605bytes; no
profile, discovery token or app-data subtree was exported.

Evidence: `artifacts/umbralink-control/scrollbar-control/`. The raw replies,
generated code, transform provenance, tests, failed logs, diagnostic/comparison
JSON, source guards and final-absence receipt are retained. The remote harness
is `/home/wyatt/.cache/codex/scrollbar-control-harness-20261006-YlfZas`;
individual captures use `laptop-scrollbar-control-{a,b}-20261006-` plus the table
suffix. All runtime/controller/transfer commands have terminated.

## Next Gate

Proceed to the plan's separate profiled pair using these same two geometry-aware
fixtures and the same package. Check whether actual fade timers, style invalidation
and vsync-message/catch-up populations differ, using exact document and clock
joins. Profile overhead remains separate from these unprofiled measurements.
If the native groups persist, reject that mechanism rather than adjusting the
test to obtain a desired result. A CSS control is not permission to disable
animations or change callback cadence in the browser.

The independent compositor stall, renderer-label overhead, real native cache-hit
frequency, automatic recovery and broader rendering/layout/CSS/JS performance
work remain open. The GPU candidate is still default OFF and uninstalled.
