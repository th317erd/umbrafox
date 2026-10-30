# Moving Timing Clock Correction and Counterbalanced Pilot

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Authorized continuation of the rendering performance goal and disposable laptop
testing. Previous moving observation is sealed and remains baseline PASS,
candidate FAILED. No default, native code, build, installed browser or public
interface changes. Desktop daily profile remains protected.

Create prospective sibling moving-timing.mjs and laptop-moving-timing.mjs from
the frozen V2 protocol. Keep the exact serialized collector and8 serial RPCs,
all hashes, raw-before-validation evidence and post-playback diagnostics.
Frame mediaTime must be finite, >=0, <=duration, and strictly advance; it is not
bounded by paused currentTime. Retain paused currentTime's existing0..15s bound.
Report final frame mediaTime, frame-minus-playback milliseconds, and final
expectedDisplayTime-minus-callbackAt milliseconds separately. No tolerance-based
conversion, clock precision change or assertion that every image ID is known.

Tests first: replay the candidate future-frame case against the old constraint
(RED), then new ahead/equal/behind acceptance and negative/NaN/infinite/out-of-
duration/reordered metadata rejection. Preserve source collector SHA, lifecycle
failure tests, seeking rejection and immutable old verdicts. All existing V2
tests must remain green. Scoped format and58old tests plus new cases before run.

One prospective ABBA sequence: baseline, candidate, candidate, baseline. Each
fresh install/private app/local/temp/profile on wyatt-laptop DISPLAY=:0 uses
the original pinned pair, same1080p30 H264 asset and1/4/4/1 two-second phases.
No profiler; hashing/readback observer remains.120s total/105swork/15scleanup,
10squiet,64MiB pre-work headroom and256MiB sampled artifacts unchanged.
Single owned launch per run; controller timeout220s around210s remote driver.
Inspect each terminal result, exact process absence, context/backend and package
hashes before the next run. Stop sequence on failure; no retry/cap relaxation.

Compare per-run first-copy vs additional-copy distributions, not pooled draws
as independent experiments. First-copy phases are the no-reuse control. Report
all four populations, coarse zero durations, frame drops and pixel transitions.
ABBA only reduces simple order confounding; two runs per package, whole-package
differences and observer cost do not support a universal or cache-only speedup.
The useful next decision is whether repeated-copy benefit repeats and whether
first-copy work still dominates. Actual moving cache-hit/IPC counts remain
unmeasured. Preserve rejected runs and update goal continuity, never install
or claim broad completion from this pilot.
