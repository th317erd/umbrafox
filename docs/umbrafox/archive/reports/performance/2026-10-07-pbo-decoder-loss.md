# PBO Decoder-Loss Correctness

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

Both configured upload modes pass the existing retained decoder-loss comparison
on wyatt-laptop. All eight cases match exact pixels, frame timestamps, exception
names and exception messages across modes. The same eight cases also match the
earlier sealed same-package import-ON reference. The copied bitmap remains valid
and byte-identical after decoder shutdown; subsequent decoder-backed reads fail
with the original InvalidStateError behavior.

Together with the [video and composited pixel checks](2026-10-07-pbo-composited-correctness.md),
this completes the scoped P1 correctness gate of the
[upload comparison plan](../../plans/pbo-upload-control.md). It is not a speedup,
release acceptance, decoder restart/recovery test, renderer-internal upload-mode
acknowledgement or physical-display proof. No product default or daily installation
changed. The next gate is the fixed unprofiled A1/B1/B2/A2 timing comparison.

## Scope And Mechanism

The narrow adapter preserves the complete original captureLoss function apart
from an explicit typed upload argument, import-ON admission and two browser-state
receipts. A source-equivalence test removes only those additions and requires the
entire original function to match. The shutdown helper, process ownership checks,
terminal polling, frame preparation, cold-readback probe, pixel validators and
bitmap comparison are unchanged. Driver and exporter differ only in the capture
import and output namespace. Existing timeout, cleanup and evidence caps remain.

The PBO boolean is written before launching each fresh browser. Before and after
the loss test, actual/default/user/locked preference receipts must match the
requested boolean, default true, explicit user value and unlocked state. These
are configuration observations, not native device acknowledgement. GPU import is
ON and profiling OFF in both arms. No control call alters a work browser.

The existing native test service permanently shuts down only the decoder whose
parent/fork-server, process group, session and start-time identities were checked
against the owned browser. Both runs require two terminal observations and reach
the existing validated single-thread-zombie criterion. That proves termination,
not immediate reaping. The later browser cleanup and independent PID checks prove
the recorded processes are absent. Cold-readback failure is separately observed;
termination alone is not substituted for it.

## Execution

Same 46-file descriptor-borrow package in both arms, BuildID 20261006175655,
manifest SHA256
1de58db614be934fb7fe71fc46ea168ce9777a8b46e340d3f429090b4e3e6773.
Both use hardware WebRender, Intel Iris Xe, Mesa/iris 25.2.8.0 and hardware ffmpeg
decoding. The preceding exact package/source reconstruction remains unchanged.

| Arm | Browser / Controller PID | Start UTC | Finish UTC | Duration |
| --- | --- | --- | --- | ---: |
| A, PBO true | 1915554 / 1915522 | 08:29:01.811 | 08:29:14.602 | 12.791s |
| B, PBO false | 1917890 / 1917878 | 08:30:41.599 | 08:30:54.345 | 12.746s |

Both runs are October 7, 2026. Fresh owned roots are
/home/wyatt/.cache/codex/laptop-pbo-loss-a-20261007-uMzYZi and
/home/wyatt/.cache/codex/laptop-pbo-loss-b-20261007-YDCiGp.
Each arm had a 15-second quiet interval followed by package, harness, memory,
disk and no-browser/build admission. Internal bounds remain 120s total, 105s work
and 15s cleanup; outer driver/SSH bounds remain 220/240s. Neither arm was retried.

Each exports 50 public files and five resource samples. Decoded exports total
5,182,594 bytes. Peak sampled artifacts are 66,358,687 and 66,358,883 bytes, below
the unchanged 256MiB cap; absolute and baseline-relative resource checks pass.
No profile, token or application-data payload was exported.

Both owned SIGTERM cleanups are clean, with 346 log bytes and zero dropped bytes.
The logs preserve the sandbox EPERM warning, successful VA-API initialization
and VideoBridgeParent AbnormalShutdown message during this deliberate decoder
shutdown test. No warning-free, automatic-recovery or spontaneous-crash claim
is made. All 26 structured-evidence PIDs were absent at 08:31:51.846Z; two additional
sandbox-warning PIDs also pass a separate absence check. Final remote admission
finds no browser/build activity and unchanged 164 harness/46 package files.
These are sampled and point-in-time checks, not a whole-host/network sandbox.

## Verification

The prelaunch relevant tooling gate passed 422 tests. After adding actual saved
export replay, the final gate passes 423, zero failures/skips, in 11.30s under a
60-second bound. This includes owned Node child and loopback-server tests, not
only pure supplied-data checks. No native compiler ran in this phase.

New checks cover exact adapter transformations, source drift, required typed
mode, invalid preference/PID/active-hook/profiler receipts, RPC/write failures,
configuration changes, and rehashed pixel/exception/ownership/resource/cleanup
corruption. Existing loss tests cover late I/O, cancellation, partial terminal
evidence, PID reuse, fork-server admission and page-object lifecycle. Actual
saved exports reproduce the entire final mode comparison.

The first evidence-test invocation accidentally read the hash-only prior export
instead of its raw counterpart. Its two failures are preserved; the test input
was corrected and verified against the prior seal. This was a test-path mistake,
not a browser defect or reason to rerun either browser. The initial missing-module
boundary failure likewise records scaffolding, not a production bug.

Evidence namespace: artifacts/umbralink-control/pbo-loss/.
The 164-input runtime manifest is
41afa80d63749815b1025c5e06e93949d46788aaeb933b73b05ef7d4c0f14742,
with 29 reachable static imports and 67 unchanged milestone source pins.
Transferred archive SHA256 is
44af151acfd53c9f3d7117dd934ff2816791860fcca7f9958d7b1e8ddc8a360e.
Remote harness: /home/wyatt/.cache/codex/pbo-loss-harness-20261007-rB7QFt.
Exact commands and retained failures are in verification.txt; comparison.json
and a/b-audit.json retain the bounded verdicts. The seal is
artifacts/umbralink-control/pbo-loss-final.sha256.

The daily browser/profile/launcher/install, Pi, native source, preference defaults,
staged index and prior evidence are unchanged. The overall rendering, layout,
CSS and JavaScript objective remains active; intermittent stutter is not solved.
