# PBO Upload Control

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Objective And Authority

Test whether WebRender's existing staged upload mode contributes avoidable CPU
work or frame gaps on the quiet laptop. This follows the
[complete compositor attribution](../reports/performance/2026-10-07-compositor-cost-partition.md).
It is part of the owner's authorized performance campaign, including disposable
headed laptop browsers. Daily desktop browser, personal profiles, installation,
launcher, Pi, source defaults, index, commits and new agents remain excluded.

This is a private diagnostic comparison, not a proposal to disable acceleration
or ship a preference change. No page API, request identity or browser automation
flag is added. Keep the full rendering/layout/CSS/JavaScript objective active.

## Established Basis

The existing `gfx.webrender.pbo-uploads` boolean chooses pixel-buffer versus
immediate texture uploads. The source chain has been reconstructed from the
recorded build. Pixel buffers require fence-governed recycling; those fences
cannot simply be removed. Recorded CPU command execution beneath fence creation
is an opportunity to test, not proof of avoidable work or of a GPU stall.

Both variants must remain hardware WebRender on the same Intel/Mesa/X11 host.
Use the same current normal descriptor-borrow package, manifest
`1de58db614be934fb7fe71fc46ea168ce9777a8b46e340d3f429090b4e3e6773`,
BuildID `20261006175655`. Import stays ON and profiler OFF in both arms.
Do not compare the old profiled package directly to this newer package.

## P0: Harness And Source Admission

Status: private capture/pixel adapters and source admission are implemented and
verified. Fourteen focused groups and the 361-test relevant tooling gate pass.
At that checkpoint no browser had launched. The subsequent correctness adapter,
remote preflight/export and 158-file manifest have now run successfully in two
fresh laptop browsers; see P1. Retained-loss and final timing admission subsequently
passed. Timing uses the separate 167-file manifest recorded in P2. The initial
152-file manifest is historical, not permission to run timing.
See [PBO admission evidence](../reports/performance/2026-10-07-pbo-admission.md).

Use a new `artifacts/umbralink-control/pbo-upload/` namespace. Reuse the sealed
descriptor-borrow-playback driver, exporter, evaluator, resource monitor and
ownership envelope. Leave sealed files unchanged. Generate narrowly reviewed
adapters, not a second capture framework. Keep exact transformation tests.

The current shared `tools/umbrafox/tests/readback/capture.mjs` writes fixed
profile preferences and has no arbitrary-pref option. A private generated copy
may add only the enumerated boolean PBO setting before process launch. Reject
missing/nonboolean values; do not expose a general preference/configuration API.
Preserve all imports, failure handling, deadlines, resource and cleanup behavior.
Never set the preference on an existing work browser or mutate the test setting
after playback begins.

In existing before/after browser-state receipts, record the requested value,
actual preference value and user/default-branch state, plus the unchanged import,
provider, profiler and identity fields. Preferences and source propagation prove
configured mode, not an acknowledged renderer-internal method. Label that limit;
do not fabricate a gfxVars or device-state receipt from the preference value.
Join package and source hashes before reusing the recorded source argument.

Required fail-first cases: absent/wrong preference, ambient value mismatch,
wrong package, source drift, changed capture envelope, changed workload, unknown
mode, failed/late setup, malformed receipt, altered context/document, and raw
reply preservation. Preserve existing timeout/abort/write/resource/cleanup tests.
Run focused pure Node checks under 30 seconds; full relevant tooling under a
separately bounded 60-second command. No browser until these checks pass.

## P1: Correctness Before Timing

Status: video pixels and actual composited readback PASS in both upload modes.
All 48 comparisons, four raw video buffers, same-state repeat controls and the
deliberate visual change pass with exact pixels. Final tooling371PASS and both
owned cleanups verified. [Evidence](../reports/performance/2026-10-07-pbo-composited-correctness.md).
Retained decoder loss now also passes in both settings: all eight exact pixel,
timestamp and exception comparisons match each other and the preceding same-package
reference. Final423 tests pass; both owned cleanups and recorded PID absence are
verified. [Loss evidence](../reports/performance/2026-10-07-pbo-decoder-loss.md).
The scoped P1 gate is complete. P2 subsequently completed without a measured gain.
The immutable loss adapter/evidence namespace is pbo-loss; use a fresh namespace
for timing orchestration rather than changing either as-run correctness harness.

Run separate fresh profiles with PBO true and false, on the same normal package.
Keep the existing 48-case exact canvas pixel and retained-loss comparisons;
require no tolerance change. These alone do not test WebRender presentation.

Also establish a bounded composited-frame correctness control. Ordinary
`drawSnapshot` screenshots re-render in software and cannot certify hardware
WebRender. Existing `remote/shared/Capture.sys.mjs` exposes `capture.canvas`
with explicit `{ readback: true }`, using `DRAWWINDOW_USE_WIDGET_LAYERS` in the
parent. Trace and hash the packaged implementation before use. A private
UmbraLink browser-realm call may target only the owned, selected fixture and
its measured content rectangle; no Remote Agent or Marionette launch is needed.
Readback forces rendering and therefore stays outside performance captures.

The correctness fixture must contain known nonblank pixel regions and uploaded
image/canvas content. Bound viewport dimensions and encoded output before capture.
Require repeated same-state A/A captures to agree before comparing A/B; include
an intentional visual change that must change the captured region. If this is
not deterministic, retain the failure and investigate it, rather than relaxing
pixels or silently substituting a software snapshot. Do not inspect unrelated
desktop areas or personal windows. Document that forced readback does not prove
partial-present, rare-artifact or physical-scanout correctness.

## P2: Fixed Unprofiled Comparison

Status: complete. All four arms pass functional, identity, resource and cleanup
checks; all 29 unchanged regression criteria pass. Immediate uploads use 0.031%
less normalized CPU, far below 1.203%/1.525% within-mode spreads. Draw median/P95
are unchanged and startup gaps remain. This is no demonstrated benefit.
[Timing evidence](../reports/performance/2026-10-07-pbo-playback.md).
The final 167-file harness SHA is
`4d1477a7613707e9b5d0d0a7c9eb7d0cbea65e72da43912a5e01ccf814dbd8e7`.

Only after P1, execute A1/B1/B2/A2 once:
A = PBO true, B = PBO false. Same normal package and all other settings in both.
Use the existing 48-second 1080p H.264, 320x180 canvas, 1/4/4/1 copies per callback
fixture without new per-frame markers, readbacks, waits or controller requests.
Preserve the existing 29 numerical regression criteria verbatim. Startup phases
and all gaps count. Failed arms are not rerun to improve a result.

Before every arm: 15-second quiet interval, exact package/harness source admission,
host/display/graphics identity, no conflicting browser/build, owned fresh private
profile/application/local/temp roots and existing disk/memory headroom. Existing
limits remain 120-second capture, 105-second work, 15-second cleanup, 220-second
driver and 240-second SSH. Export only allowed evidence; never profile/token or
application-data contents. Stop on failed admission or unsafe state; preserve
failed captures and clean only exact owned processes, with no SIGKILL.

Compare process-level CPU normalized by elapsed time, repeats within each mode,
four-copy median/P95, callback gaps, video-quality drops and native drop counters.
Report individual processes and both within-mode spreads, not pooled frame
counts as independent runs. A passing regression screen is not proof of speedup.
A smaller fence subtree alone is not a win if work moves to another stage.

## P3: Decision And Remaining Scope

Status: this control's decision is complete: keep the existing default and do not
run the conditional profiling pair merely to search for a favorable result.
There is no demonstrated performance advantage in P2. Broader performance and
cross-workload acceptance remain open; no default/release promotion follows.

If B has no meaningful benefit or fails the fixed screen, retain the result and
leave defaults unchanged. If promising, plan a separate minimal profiled pair
to verify the predicted path change, with unprofiled controls and profiler cost
explicit. An actual native-device receipt or changed path population is required
before claiming the configured mode eliminated the fence mechanism.

No release/default decision follows from one Intel laptop fixture. Browser-wide
image/text/scrolling correctness, varied upload workloads, other backends and
real-page video remain acceptance work. New product code needs its own reviewed
contract, failing test, native verification and Firefox-parity checks.

## Evidence Checklist

- P0: immutable adapter deltas, pinned current package/source, pure failure tests.
- P1: exact canvas/error comparisons and positively validated composited readback.
- P2: all four raw terminal captures, unchanged criteria and public evidence hashes.
- P3: explicit performance verdict, limits and next action; exact owned PID absence.

The cheapest current falsifiers are malformed preference admission and a visually
wrong or noncomposited screenshot. These precede any timing run. A supported
pref is not proof of a performance opportunity; only the controlled comparison
can establish whether this direction advances the overall goal.
