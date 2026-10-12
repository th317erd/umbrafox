# Descriptor Import Balanced Performance

## Result

The latest candidate shows a repeatable CPU and draw-call improvement in the
fixed video-to-canvas fixture, but FAILS overall fixture-performance acceptance.
The prospective OFF1/ON1/ON2/OFF2 sequence passes27 of29 fixed numeric criteria.
Both experimental runs use26.43-28.88% less normalized joined-process CPU than
the better OFF baseline; four-copy draw-call P95 falls from27-30ms to2ms.

Two smoothness criteria fail:

- ON1 phase0 has4 callback gaps over50ms, above the larger OFF count of3.
- ON2 phase1 reports4 dropped video frames; both OFF values are0.

No capture was retried, excluded, pooled with older evidence, or replaced.
No acceptance threshold, pixel tolerance, source path or preference default
changed. All four captures pass functional, provenance, resource and cleanup
checks. The experimental GPU import remains default OFF and uninstalled in the
owner's daily browser. This is not a YouTube-stutter fix or release acceptance.

## Measurements

Each process plays the owned1920x1080 H.264 fixture for48 seconds and draws to a
320x180 default canvas. Four12-second phases perform1/4/4/1 copies per video
callback. There is no per-frame readback, new native marker, GPU wait or profiler.
The unchanged collector uses normal page clocks; zero means below their recorded
resolution, not zero execution cost. Draw-call wall time is not GPU completion.

| Measurement | OFF1 | ON1 | ON2 | OFF2 |
| --- | ---: | ---: | ---: | ---: |
| CPU window, seconds |48.186|48.124|48.130|48.183|
| Joined CPU, seconds |37.019|27.199|26.298|38.741|
| CPU seconds per elapsed second |0.76826|0.56520|0.54639|0.80404|
| Browser CPU, seconds |15.970|19.191|19.073|15.967|
| RDD CPU, seconds |13.711|2.060|1.846|14.809|
| Content CPU, seconds |7.153|5.722|5.168|7.754|
| Four-copy medians, ms |13 /14|1 /1|0 /1|15 /15|
| Four-copy P95, ms |27 /30|2 /2|2 /2|29 /29|
| Callback gaps over50ms, phases0-3 |3 /2 /0 /0|4 /0 /0 /0|1 /1 /0 /0|2 /0 /0 /0|
| Video drops, phases0-3 |0 /0 /0 /0|0 /0 /0 /0|0 /4 /0 /0|0 /0 /0 /0|
| Final canvas provider |software|accelerated|accelerated|software|

All phases retain296-298 callbacks, above the declared200 minimum. Both ON
boundaries are accelerated; both OFF captures start accelerated and end software.
Endpoint observations do not prove every intermediate draw's route. ON increases
browser-process CPU while reducing RDD and content CPU. This is redistribution,
not a uniform reduction across processes.

Within-mode CPU-rate maximum/minimum spread is4.66% OFF and3.44% ON. Two processes
per mode do not establish confidence intervals, thermal control, scheduler
equivalence or all-session behavior. Joined CPU excludes transient processes
not present in the stable endpoint/sample identity intersection.

The earlier35.48% result belongs to Build20261006070020 and is not an input.
This build's OFF path includes the exact full-size readback cache. The older
uncached baseline therefore cannot substitute for this comparison, and the
cross-build difference alone does not isolate the cache's effect.

## Remaining Delay

An offline analysis uses only the saved callback arrays. All four ON1 long gaps
occur within the first1.215 seconds of phase0, are51-65ms, and have preceding
draw batches of1-2ms. ON2's phase1 long gap is146ms at phase offset7442ms; its
preceding/current batches take1/2ms. These records do not place the entire gap
inside drawImage. They also do not reveal what ran or waited between callbacks.

The native after-playback receipt corroborates the ON2 drop count:
droppedDecodedFrames=0, droppedSinkFrames=0, droppedCompositorFrames=4 and
compositorDroppedFrames=4. The other three after receipts have all four counters0.
The private collector maps these directly from mozRequestDebugInfo reader frame
statistics and the container counter; it does not infer the stage from CPU.

These are aggregate counters, not a per-frame join between the146ms interval and
the four dropped frames. Callback counts, presented-frame deltas, decoder output
counts, video-quality drops and physical presentation are distinct observations.
The compositor accounting makes scheduling/presentation a supported next lead,
not proof of a GPU bottleneck, a driver bug, a particular wait, or import causality.
The OFF1 fixture also records a93ms draw batch followed by a93ms callback gap;
there is more than one possible delay pattern.

## Provenance And Safety

Exact candidate: BuildID20261006175655, browser package manifest
a7d80698828618f3d0c3e9f760e6fe8b63a72f3f93ba8dabcb132581c8784e87.
Its preceding40 native tests,48-case pixel matrix and8-case retained-loss
comparisons are separately sealed in the descriptor-availability report.
No native build or product source edit occurred in this performance phase.

The131-input harness manifest is
54e4780218bb39663fe4a64b607670be758c54bc625166b62b6398d6890f9c6c.
Thirty add-only files extend the existing101-file laptop harness. Static relative
imports, prior/shared hashes, root owner/mode/device/inode, exact archive entries
and absent destinations were verified. The original101 files remain unchanged.
Only package/harness identity, byte count, relative imports and output namespace
differ from the reviewed callback driver and numeric evaluator.

Each arm uses fresh installation/profile/application/local/temp roots. A15-second
settle precedes each laptop package/hash/resource/no-browser-or-build preflight.
Every completed prefix passed before the next capture. Bounds remain120s capture,
105s work,15s cleanup,220s driver and240s SSH. All recorded commands are terminal.

| Arm | Root suffix | Controller / browser PID | Start UTC | Finish UTC |
| --- | --- | --- | --- | --- |
| OFF1 |3i4iUk|1647532 /1647564|19:49:53.774|19:50:53.755|
| ON1 |A1QJQu|1650063 /1650095|19:52:13.602|19:53:13.396|
| ON2 |DcEqXF|1652685 /1652697|19:54:47.470|19:55:47.381|
| OFF2 |a0yptM|1655155 /1655167|19:57:02.813|19:58:02.686|

All runs are October6 UTC on wyatt-laptop. Each exports44 public evidence files,
has14 resource samples,12 recorded PIDs confirmed absent, clean owned SIGTERM
cleanup, and271 log bytes with zero drops. Combined exports are176 files and
1372267 bytes. Peak sampled artifact sizes are139982393-145565073 bytes, below
the unchanged256MiB cap. Absolute and post-baseline resource checks replay.
These observations are not continuous process, memory or network isolation.

All package postchecks retain46 immutable files plus the empty lock file,
475127101 bytes. Native receipts join actual browser PID/build to owned roots.
No private profile, control token or app-data payload was exported. Hardware
receipts agree: Intel Iris Xe RPL-P, Mesa/iris25.2.8.0, X11/WebRender, hardware
ffmpeg H.264 in RDD after playback. Initial decoder-shutdown text before play is
not used as the active decoder receipt. Logs retain Sandbox EPERM and successful
VA-API initialization; no warning-free or no-external-I/O claim is made.

## Verification And Next Step

Evidence: artifacts/umbralink-control/descriptor-balanced/.
comparison.json is the canonical unchanged29-criterion evaluation; summary.json
adds descriptive CPU tables and saved callback-gap records. verification.md
records exact invocation patterns and limits. The final92-test suite rehashes
all exports, reproduces CPU joins and workload summaries, checks native receipts
and resource caps, and explicitly preserves both failed performance criteria.
Preparation88 tests and later91 tests remain separately recorded.

Initial missing-module/incomplete-comparison failures are harness checks, not
production REDs. The added media replay initially used a numeric filename while
the producer names the receipt import-decoder-after.json; that failed test is
retained, and only its path was corrected. No runtime or evidence was rerun.

Final source guards verify60 pinned sources,131 harness inputs, HEAD, staged and
working patches, and configuration unchanged. The prior correctness seal passes
again. Desktop browser/profile/launcher/installation, Pi and product defaults are
untouched. This checkpoint does not complete the broader rendering/layout/CSS/JS
objective or authorize enabling the experimental path by default.

Next: trace the compositor-drop producer/consumer and existing rendering/media
markers against the exact candidate, then define a separate bounded diagnostic
with explicit observer controls. Investigate delays between callbacks and native
presentation work; do not weaken the gate, silently warm away startup gaps, or
rerun this sequence until it passes. Real-site YouTube and extension attribution
remain separate from this owned-fixture evidence.

Scoped documentation lint and explicit new-test/helper Prettier checks pass.
The eight identity-only wrappers retain their original formatting for literal
equivalence checks; ignored scratch files are not claimed covered by product
ESLint. Tracked diff whitespace checks pass. Final evidence seal:
artifacts/umbralink-control/descriptor-balanced-final.sha256. It covers this
report, the evidence namespace and131 runtime inputs; mutable plans/context and
the seal's own verification output are excluded. Further work uses a new namespace.
