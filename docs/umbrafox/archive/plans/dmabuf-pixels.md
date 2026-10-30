# DMABuf Pixel Gate

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Continue the authorized laptop performance work after the sealed default-OFF
build in `dmabuf-import.md`. The prior turn made progress: native build, package,
source guards and isolated version check passed. The whole performance goal
remains open.

## Contract

Use the same candidate `20261006023500` for OFF/OFF/ON, each with fresh private
installation, profile, app-data, local-app-data and temporary roots. Preserve
the desktop browser and all old experiments. Existing `captureLocalWorkload`
owns the 120-second envelope, 15-second cleanup reserve, resource caps, native
directory receipt, localhost fixture, log bounds and owned process cleanup.
No engine changes, new API, profiler, default enablement or installation.

Reuse the 90-second 1920x1080 H264 fixture with its pinned SHA256. Seek while
paused to 0.5 and 2 seconds. At each position draw twice onto separate fresh
canvases for each case: linear, odd size, crop, fractional size, nearest,
transform, alpha, filter, shadow, VideoFrame, synthetic RGBA VideoFrame and
explicit readback. All destinations exceed the observed 128-squared minimum.
Verify closed VideoFrame rejection separately.

Immediately after draw, dispatch an owned fixture event. An existing privileged
frame-script route reads `getDebugInfo(false)` synchronously before pixel reads.
Only then getImageData and SHA256 run; these are correctness observations, not
timing benchmarks. Record public debug API absence, current document, exact
element, dimensions and case/repeat order. Remove canvases and close frames.

Before setting the experimental pref, require its real default branch to be
boolean false, unlocked and without a user value. Both arms set an explicit
boolean on the owned browser only. Parent and content receipts must agree before
and after probes; no guessed propagation delay or unknown-pref creation.

## Gates

1. New sibling collector/validator/request/capture/driver and focused tests.
   Preserve failures; existing frozen source and manifests remain unchanged.
2. Fake page/native tests: exact ordering and bytes, two fresh draws, errors,
   timeout, stale document/element, missing/duplicate observations, closed-frame
   errors, malformed preferences/receipts and listener cleanup. Scope Node tests
   to <=30 seconds and format checks to <=60 seconds.
3. Verify package/harness hashes and quiet laptop resources before launch. Copy
   packages, not source trees. Existing installed browsers are not stopped.
4. OFF/OFF pixel hashes must agree before ON. Default linear canvases must have
   observed acceleration, readback controls must not. Preserve raw failed replies.
5. Compare ON exactly against OFF, retain all logs, verify roots/PIDs/installation
   afterward. Any mismatch or unknown route blocks acceptance. No claim that
   provider acceleration proves this particular import branch executed.

Context loss and low-level import-failure propagation remain separate owed
gates; this fixture cannot safely inject those faults. Exact format coverage is
bounded by the H264 decoder receipt and synthetic RGBA control, not all formats.
Only after correctness should unprofiled sustained timing comparisons proceed.
