# Retained Frame Decoder Loss

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Scope And Authority

Continue the authorized performance campaign on wyatt-laptop only. This phase
adds test tooling, not browser production code. Keep experimental GPU import
default OFF, desktop browser/profile/install untouched, and old evidence sealed.
No build, Pi, commit, stage, push, public API or browser preference default change.

Previous turn was a status-only no-progress turn. Next actionable gate is real
post-decoder-loss semantics for the exact full-size cache and direct import.
This does not replace sustained performance, restart recovery or YouTube gates.

## Territory And Evidence

Reuse tools/umbrafox/tests/readback/capture.mjs for native root identity, new
profile/application/local/temp directories, logging, resource monitor, controlled
loopback fixture, authenticated UmbraLink and owned cleanup. Existing wrappers
provide exact package admission, private installation copying and postchecks.

Searchfox discovery and frozen source inspection identify the existing test-only
parent nsIRddProcessTest.stopProcess path: RDDProcessShutdown sets a permanent
session shutdown flag then DestroyProcess shuts down its process. This is normal
decoder loss, NOT abnormal crash/restart recovery. Do not call telemetry probes.
Actor destruction delivery is asynchronous; process termination alone is not
evidence that every retained content-side actor has observed the loss.

Reference: exports/umbrafox-import-recovery-20261006-r2, Build20261006070020.
Its frozen source.patch adds only the sized cache to GPUVideoImage; full-size
GetAsSourceSurface still calls mManager->Readback directly. Candidate:
exports/umbrafox-exact-fallback-20261006, Build20261006153147. Frozen HEAD alone
does not identify either build; use their package/source receipts.

## Contract

One fresh browser per arm: uncached reference OFF, cached candidate OFF, candidate
ON. Same local H.264 fixture, graphics/decoder conditions and diagnostic sequence.
Stop subsequent arms if input, identity, loss or cleanup admission fails.

1. Check exact native build/root/PID, selected fixture document, profiler OFF,
   userland inactive, controlled preference, visible paused hardware video.
2. Retain a VideoFrame at 0.5s. Draw through software and default canvas; retain
   an ImageData-derived copied ImageBitmap as an independently owned control. Save raw RGBA/hash,
   DOM exception, sentinel pixels, frame metadata and canvas attributes.
3. Seek to 2s and retain another VideoFrame without drawing it. Different frame
   timestamps plus completed seek and new requestVideoFrameCallback presentation
   are required; these observations still do not expose private backing identity.
4. Identify exactly one RDD from native snapshot and join /proc identity to the
   owned browser before invoking the parent-only stop hook exactly once.
5. Bound waiting for that exact PID's absence or independently observed terminal
   execution. The latter requires State Z, exact original identity before/after,
   status Pid=Tgid=owned PID, exact PPid/UID, Threads=1 and task entries exactly
   [PID]. A zombie leader alone, unavailable task directory, contradictory or
   malformed fields, read errors or identity drift never pass. Save raw evidence
   before validation; preserve absent=false/reaped=false for this branch. This
   explicitly supersedes the pre-probe absence-only contract, not final cleanup.
   Keep20 polls/50ms waits and the existing1s observation operation bound.
   Probe only the cold frame through
   software readback until InvalidStateError, at most10 attempts with100ms waits.
   If unavailable/error semantics are not observed, STOP as inconclusive; do not
   infer actor loss merely from elapsed time or label any success a restart.
   Successful probes may warm that frame; only the first probe is initially
   untouched. Subsequent probes and default draw are not claimed uncached.
6. Record warm software and default-canvas draws, cold default draw and retained
   bitmap draws. Retained-copy pixels must remain byte-identical. Preserve every
   exception and sentinel result before comparison; no tolerance or blank filter.
7. Close retained frames/bitmap explicitly and require normal harness cleanup.

Compare original errors and exact resulting RGBA against reference. Preferences
and provider observations alone do not prove individual DMABuf import execution.
Post-loss async GPU behavior can differ; record it, do not presuppose throw/no-op.

## Tests And Bounds

Before driver implementation, add pure supplied-data tests for stale frame IDs,
bad raw pixels/hash, changed error, unexpected success, changed bitmap, missing
loss receipt, unrelated/PID-reused decoder, duplicate stop, abort before stop,
RPC failure and late completion. Use VM tests for the emitted page script and
fake control operations to verify order/cancellation and saved raw failures.
Missing-module RED is scaffolding, not a demonstrated behavior defect.

Real execution uses the existing120s capture/15s cleanup,220s driver and240s SSH
bounds, isolated private installation, native root receipts and resource caps.
Per-RPC/page operation deadlines remain bounded; no SIGKILL or compilation
overlap. Limit each evidence file to1MiB and exported public evidence to8MiB;
never export profiles, tokens or crash payloads. Retain terminal evidence and
exact recorded PID absence, package/harness hashes and clean owned shutdown.

## Terminal Contract Correction

Reference-3 preserves20 exact-identity leader-Z observations over1.002s and no
post-stop task count; it remains inconclusive. Linux documentation distinguishes
terminated/unreaped state from waiting, and warns that leader termination alone
does not certify other threads. Primary sources:
[proc](https://www.kernel.org/doc/html/latest/filesystems/proc.html),
[tasks](https://man7.org/linux/man-pages/man5/proc_pid_task.5.html),
[wait](https://man7.org/linux/man-pages/man2/waitpid.2.html).
Independent terminal-review.md conditionally accepts the strict single-task
observation above. New v2 loss-terminal.json receipts carry their raw basis;
comparisons join original ownership, stop, poll and task receipts. Final export
still requires every recorded PID absent. This proves neither all external GPU
resources released nor delivery of all actor teardown messages.

Unit tests<=30s; source discovery<=30s; prepare/transfer<=120s. Preserve failures
and no automatic blind repeats. Independent source review before native execution.
No green test suite alone constitutes real decoder-loss or performance proof.

## Latest Outcome

Superseding the older progress checkpoints below: reference-4 completed under
the reviewed terminal gate, with all saved evidence and cleanup checks passing.
Candidate OFF then matched all8 comparisons. Candidate ON completed collection
but failed2 of8 comparisons: warm/cold default-canvas post-loss draws do not
throw the reference InvalidStateError, leaving exact unchanged sentinel pixels.
The other6 checks match. GPU import remains default OFF; no production fix or
daily installation is claimed. All three roots cleaned up,13 recorded IDs per
arm absent,0 dropped log bytes. Earlier failed references remain failed.

Report: docs/umbrafox/archive/reports/performance/2026-10-06-retained-frame-loss.md.
Latest actual harness-v7 has87 files; final42 focused tests pass. Exported144
files were rehashed; final source/index/configuration guards pass. No active
browser/test/SSH session remains. Next step is a narrow frozen-source trace and
failing-first regression for the ON exception mismatch, not performance or
deployment acceptance. Preserve this namespace for evidence.

## Progress

- Implemented owner-page retained state, copied ImageData bitmap control,
  seek/presentation admission, exact native identities and saved raw draw errors.
  Source and driver reviews are retained in the evidence namespace; review
  findings were corrected before native use.
- First reference run refused the direct-child assumption: the owned RDD is a
  child of the owned fork server. Revised admission permits exactly that native
  snapshot type and joins original browser, fork-server and RDD start identities.
  No stop hook was invoked in the first run. All12 recorded PIDs were absent
  after clean cleanup; preserve reference/ and its export.
- Second reference run accepted the permanent parent stop hook, but exact RDD
  absence was not observed during20 polls with19 waits of50ms. It stopped before
  cold or post-loss draws. Preserve reference-2/: browser1583877, RDD1584009,
  2026-10-06T16:52:19.083Z through16:52:32.218Z. Clean SIGTERM,346 log bytes,
  zero dropped bytes, all12 recorded PIDs absent after cleanup, package intact.
  VideoBridge AbnormalShutdown followed the intentional stop; not crash proof.
- Source distinguishes SIGTERM from reaping: the inspected POSIX KillProcess
  sends SIGTERM; CloseProcessHandle is a no-op. SetAlreadyDead clears the handle;
  the inspected host destructor's termination path requires a nonzero handle.
  This supports checking live versus unreaped state, NOT a diagnosis of the
  second run. That run did not save per-poll states; do not backfill them.
- Added loss-poll-0..19.json to preserve each successful identity/absence read
  and monotonic elapsed time before validation. Zombie state is NOT accepted as
  absence. Same20 polls,50ms waits, identity and capture deadlines; no gate relaxed.
  Read errors preserve prior polls and fail closed; they do not create an
  absence observation. Write/abort failures stop before post-loss draws.
- Behavioral RED11PASS4FAIL, GREEN25PASS, expanded final28PASS in2.15s under
  timeout30 and strict unhandled rejection mode. Exact three-file formatting
  passed. Logs poll-evidence-{red,green,final-tests,format}.log are retained.
  The new polling change is local only; laptop still has frozen harness-v4.
- Next: review and package this diagnostic delta as a new pinned harness version,
  then one reference-only run with state evidence. Do not run candidate OFF/ON
  until the reference gate passes or a separately reviewed contract correction
  is justified by actual evidence. No candidate loss/performance result yet.
