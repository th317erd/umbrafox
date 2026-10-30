# WR Render P2 Diagnostic Handoff

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

The authorized source/build/artifact phase passed. Runtime attribution and any
optimization remain pending coordinator l8ros tests. No Pi or owner-browser
actions were performed; no new optimization was included.

## Runtime Acceptance Failed

Coordinator's October 16, 18:45 UTC matched receipt supersedes the provisional
P2 result below: same Pi, 60fps 1080p video, 1344x756 viewport, fresh sessions,
no ffplay and profiler OFF. Release R presented32.4/36.9/31.1fps versus
P2 BuildID20261016175431 at0.1/0.1/0.2fps; P2 dropped99.8% of decoded frames.
P2 is NOT runtime-validated. Probe-regression diagnosis is active; no root cause
or corrected artifact is established. The original sealed export is preserved.

## Runtime Status Correction

At 18:39 UTC on October 16, l8ros reported an orphan `ffplay` at 98.6% CPU had
contaminated earlier low-fps observations. After removal, release R fullscreen
1080p30 reached 30.0fps present / 0-1.6% drops; 60fps content remained 30-43fps with
drops. These coordinator-reported results retarget optimization to the clean
60fps case, not a presumed general 30fps failure. Exact historical-capture
contamination mapping remains outstanding.

Subsequent in-progress coordinator pane output still shows about 0.2-0.3fps for
clean P2 runtime-OFF and an R/P2 comparison underway. This is not a completed
matched comparison, but means the diagnostic cannot be presumed cleared by
the ffplay correction. Runtime-OFF parity remains unresolved, separately from
60fps attribution. Await binary/profiler-state and matched workload receipts.
The sealed export, build receipts and source hashes below remain unchanged;
successful compilation and packaging do not establish runtime equivalence.

## Artifact Receipts

Handoff and full receipts:
[/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/exports/umbrafox-wr-render-p2/diagnostic/README.md](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/exports/umbrafox-wr-render-p2/diagnostic/README.md).

Archive110621964B, SHA256
`94b4516b31dad3c8fa5b5c95dc22ba9304e1d944d878f19e624fc16d8b9d23de`.
BuildID20261016175431 verified in object header/native libxul/both INIs.
Overlay4278e82f remains byte-identical and user-overridable;28 ELF payloads are
AArch64, frontend/dependency/archive/extraction checks pass, layout umbrafox/.

Separate P2 patch6b970fcdfb8c322e4b2a733688c4b597935f64baf009c1841b6877153e46d383;
combinedd94c2027cedbe5776e2206d22089208c69f6d63e93b83a7ac091f6e8db7d29c3;
schemaf016802c5c29de569f59223c97f196f258817a71200f45e831eed7fca1bf6b75.
Basec0e7f8 plus sealed P1731d9ec2 unchanged. Exact replay and original-index
preservation passed. Build891.77s with C++8/Cargo2/nice0, no fallback/retry.

Core/bridge/source/validator/controller/package tests, sanitizer variants,
mixed-language single-owner/OFF linkage, native writer and lint passed. Full
ARM linkage contains eight private bridge functions and one shared Gecko owner.
Compile-OFF evidence is scoped to tested native/source exclusion paths, not a
new release ARM artifact or runtime parity claim. Independent reviews found
no blocker; unknown route populations and profiler overhead remain explicit.

The first temporary-index comparison exceeded30s; its log is preserved. The
unchanged-source retry with120s Git bound passed. No native build failure occurred.
All owned configure/build/package process groups were absent after completion.

Next:l8ros runs diagnostic runtime-OFF/ON controls with separate ring/export
guardrails, retrieves private captures and returns joined evidence. Only then
select a falsifiable optimization within the WR-render cost. Import reuse stays
deprioritized for the existing measured workload. No GPU-bound/fps/fix claim.
