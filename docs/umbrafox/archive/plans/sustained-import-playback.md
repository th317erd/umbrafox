# Sustained GPU Import Playback

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Continue the authorized performance campaign after corrected-package pixel
acceptance. Use the same R2 package and laptop authority as
`import-recovery-pixels.md`; do not change production code, defaults, daily
installation or public/control interfaces. Earlier sealed evidence stays fixed.

## Measurement Contract

Create a local owned 320x180 default canvas, attached visibly to the existing
1080p30 H.264 fixture. Run four fixed 12-second phases with 1/4/4/1 drawImage
calls per requestVideoFrameCallback. No per-frame reads, hashes, filters, shadows
or clearRect; the full opaque source overwrites the canvas. Keep a single canvas
and uninterrupted video throughout all phases. A setup draw initializes the
provider before measurements and is excluded from measured draw counts.

Retain at most 1536 callback tuples total: callback time, presented frame count,
expected display time, first-draw duration and whole-batch duration. Validate
media metadata during collection and retain phase first/last media time. The
fixed record cap keeps JSON below the existing 10000-node/one-MiB script limits.
No truncation; overflow fails. Use monotonic deadlines and retry early timer
wakes without shortening phases. Preserve whole-phase frame/drop counters.
No-frame phases remain observable rather than silently omitted.

Private frame-script observers sample existing canvas debug state before and
after the measured loop, tied to exact document, canvas, nonce and preference.
They add no webpage API. Prefer original wrappers; any copied private parent
bridge must have an AST proof for its bounded timeout-only change. Page watchdog
54 seconds, parent bridge57 seconds, script timeout59 seconds, request bound60
seconds. The existing capture105s work/120s total/15s cleanup remains unchanged.

Prelaunch integration inspection found a fixed15s timeout in the existing
Node diagnostic client. Add an explicit third request argument for1..60000ms;
the default remains15s, only this workload opts into60s. This is a Node harness
contract, not a browser/control protocol change. Cover delayed success, default
and explicit expiration, invalid bounds, abort, connection failure and late
replies with fake timers before launch. Preserve prior helper bytes and prove
the exact small reverse delta; the old74-file manifest must change only for
that declared helper before adding new runtime files.

First real OFF capture completed48s but failed the final getDebugInfo(false):
normal canvas transactions return mTarget, so an idle boundary may have a
provider without a borrowed target. Preserve that failed run, do not pool it.
Use existing getDebugInfo(true) only at the post-phase checkpoint, recording
ensureTarget explicitly; initial setup-draw checkpoint remainsfalse. This can
borrow/recreate a target and is not continuous acceleration proof. It adds no
draws or reads to timed phases; boundary process CPU includes its work equally
by contract in both arms. A new tested frozen bundle starts a fresh sequence.

The corrected OFF run again failed the acceleration gate: initial provider
accelerated, final ensured provider software/shared. Preserve failure and stop
the planned balanced speed comparison. Source review finds an existing refresh
path from accelerated usage profiling and other fallback causes; their actual
trigger/time remains unknown. One separately classified same-bundle ON run is
the next diagnostic falsifier for acceleration retention. Keep all validators,
caps and fresh-root checks unchanged. This is not a retry of failed OFF or a
complete/balanced performance result, and does not authorize enabling defaults.

Save raw replies before validation. Surround the measured request with equal
process snapshots and paused decoder/browser checks; reject foreign documents,
changed identities, active profiler/userland or provider evidence gaps. CPU
differences cover the request and boundary observer work, not pure draw cost or
GPU time. Do not add synchronizing GPU waits for cleaner-looking timings.

## Verification

Write source/VM/validator tests before implementation. Cover setup/play/draw/
metadata failures, early/multiple timer wakes, absent callbacks, callback caps,
state changes, result-node/byte caps and cleanup after primary/cleanup errors.
Test observer stale/duplicate/foreign/missing events, preference drift and thrown
debug calls; test parent timeout/load/error/target changes. Inject RPC, abort and
save failures into the capture and verify no later work. Validate all ordinal,
finite-value, count, duration and native-receipt boundaries with corruption tests.
Use 10-second pure-test watchdogs, 30 seconds for the combined focused suite.

After source tests pass and frozen package/harness/native/index guards pass,
run isolated laptop OFF/ON/ON/OFF with fresh installations and data roots, and
the established no-browser/build/resource admission before each. First run is
a functional smoke; any failed admission/runtime stops the sequence without
blind retry. Keep controller220s/SSH240s and existing evidence/resource caps.
Require terminal receipts, package postchecks, all recorded PIDs absent and
bounded credential-free exports before the next capture.

Analyze both repetitions without pooling unlike phases: frame drops, callback
gaps/lateness, first/batch draw timings and joined process CPU. Timer resolution,
observer cost, asynchronous rendering and driver scheduling limit attribution.
Real runtime is necessary; mocks alone cannot accept the measurement. No claim
of physical scanout, YouTube improvement, zero-copy per draw, full Firefox parity
or universal performance from this local fixture.

## Current Outcome

The initial observation failed because presentation had returned the borrowed
canvas target. The revised OFF capture completed the workload but failed actual
acceleration retention (accelerated before, software/shared after). The one
diagnostic ON capture retained acceleration at both boundaries but encountered
an incorrect frame-PTS-versus-currentTime validator. That assertion is corrected
from upstream semantics; saved ON passes replay, original reports stay FAILED.

The balanced performance gate is NOT complete. Descriptive saved-data results
and operational verification are recorded in
`../reports/performance/2026-10-06-sustained-import.md`. Next use a separate
prospective fallback-classification/observation contract; do not weaken this
failed strict gate or silently replace the preserved runtime source bundle.
