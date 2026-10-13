# Seek Transition Capture

## Completed October 13

- Schedule assertions failed against the old start point, then passed.
- One OFF and one ON laptop cell completed with resource/cleanup admission.
- All four private seek anchors survived. First-second clock plateaus and
  timestamp revisions localize the lead; native clock-source/query-latency
  attribution remains unavailable.
- 130 strict tests, scoped manual-file lint and saved-data replay pass.
- Report: ../reports/performance/2026-10-13-seek-transition.md. No native fix,
  new build, default change or desktop browser action. New native observation
  needs its own implementation/verification contract; do not rerun this wave.

## Authority And Goal

Wyatt's October13 "Please continue!" authorizes continuing the quiet-laptop
UmbraLink investigation. Preserve the prior sealed seek-markers wave and its
unproven clock-mapping hypothesis. No desktop/Pi/personal profile action, engine
patch, build, default change, new web surface or bias/fence workaround.

Capture the actual seek transition with the existing verified laptop package.
Do not claim that existing markers expose the continuous clock source or exact
GetPosition latency. AudioStream TRACE uses the separate real-time tracer;
AudioSinkWrapper has no matching profiler markers. No enabling of that logger.

## Fixed Experiment

New private namespace artifacts/umbralink-control/seek-transition. Reuse the
sealed71-file harness/input closure and the corrected compressed export adapter.
Generate only checked, unique source replacements and record hashes/edits.

One OFF control, then one ON cell after full cleanup/evidence admission. Same
public signed-out1080p60 video, volume0.05, actual45s progress-bar seek, four
native audio endpoint reads, >=130s afterseeked, and original state restoration.
Keep240/225/15s deadlines and256MiB sampled artifacts, existing resource caps.
No automatic retries; any failure ends this wave for review.

Move profiler start from playback-begin to immediately before the UI seek.
Keep begin/before-seek/after-seek/end private boundary RPCs in both cells.
After the existing sparse-0 checkpoint, wait10s on the existing abortable
monotonic clock, then capture/stop the profiler. Retain the full playback sequence
and later sparse checkpoints with profiler inactive. No pause-and-late-export
assumption: profiler pause can still retain timeline markers.

Same1Mi-entry/5ms marker-only settings,32MiB compressed export cap, native
identity/configuration/path validation and owned cleanup. Record host transition
start, after-seek, capture deadline/begin/end; reject a capture slot >5s late.
Export occurs during playback after the interval of interest. Later playback
windows are affected by that collection and cannot isolate profiler cost.
OFF retains the same RPC cadence but cannot reproduce ON's serialization cost.

## Verification

Before implementation, fail the fake full-workload tests against the old schedule:
start must follow session begin and precede UI click; end after sparse-0+10s and
before sparse-1; profiler inactive at subsequent checkpoints. Preserve native
export-envelope/profile failure matrix and every RPC/write failure, stale
document, resource abort, deadline and cleanup regression. Add early-wake and
missed-capture-slot tests. Use30s bounded strict Node tests and exact-file lint.

Transfer verified import closure. Native roots, runtime bytes, host availability,
owned-process cleanup and log/cap admission must pass before a second launch.
Use no broad personal-profile discovery. Export only the established allowlist
and exact named gzip. Analyze via named private profiler-cli0.11.0 sessions,
local samply and disabled symbolication; stop owned daemons in finally.

Require all four profiler anchors, exact parent/context/document identities,
normalized-to-root clock conversion and complete returned counts. Split results
around the before/after-seek brackets, never infer the exact child event time.
Reuse source-backed frame/queue/drop joins, preserving boundary-unknown cases.
No fabricated raw split-marker pairs, GPU timing, audio backend or causal proof.

## Completion

Save both successes and failures, hash-seal new evidence, verify laptop and CLI
cleanup, and publish a report distinguishing coverage gained from remaining
instrumentation needs. If the exact source/timestamp/query-latency join remains
absent, design the smallest private observation before a future native change.
No broader runtime or optimization acceptance follows automatically.
