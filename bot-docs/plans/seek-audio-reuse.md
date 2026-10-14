# Seek Audio Stream Reuse Investigation

## Authority And Question

Wyatt: "Please continue investigating until you have found and fixed this issue."
Continue on the authorized quiet laptop; do not touch the daily desktop browser.
Preserve the sealed October13 transition evidence. Its clock plateaus are an
observation, not a demonstrated cubeb defect. Current AudioStream implementation
is unchanged from package base8924318; AudioSinkWrapper constructor relocation
does not change its cached reuse preference. VideoSink has unrelated upstream
pause/blank-image changes; do not call the packages fully equivalent.

Before adding native probes, falsify the narrower hypothesis that keeping the
audio stream running across a seek causes the sustained video drops. Existing
media.audio.reuse-stream-on-seek selects both keep-running and stashed-sink reuse.
Its false branch recreates asynchronously, retaining the seek clock hold. Thus
this intervention does not isolate all seek-related changes.

## Experiment

One fixed four-cell sequence: reuse, recreate, recreate, reuse. Same old admitted
Build20261006175655/private iHD library, signed-out public video, normal1080p60
selection, volume0.05/unmuted, actual45s progress-bar seek and130s recovery.
Profiler OFF throughout. Retain the prior short-transition OFF RPC schedule,
plus one parent preference receipt before observation. Seed the exact boolean
in the fresh private profile before launch; verify it before timed playback.
No change to any installed/default/personal preference or public interface.

Each cell retains240/225/15s deadlines,256MiB artifacts, native roots, PID/start
ownership, resource checks and explicit cleanup. Verify terminal evidence before
each subsequent cell. Stop sequence on any failure; no unattended retry loop.
Existing inputs remain immutable; new namespace seek-reuse contains checked
mechanical derivations, tests, manifests, receipts and preserved failures.

## Territory And Tests

Input mode -> driver -> definition -> fresh profile preferences -> wrapper
constructor -> keep-running SetPlaying/Stop -> Start reuse versus recreation.
Parent preference receipt is configuration proof, not a per-seek branch trace.
Frame counters, audio endpoints and unchanged recovery validator are consumers.

Fail first against unmodified profile builder. Cover both booleans, invalid
mode, missing/malformed/wrong identity/wrong preference response, RPC/write
failure, abort, and unchanged base prefs. Retain previous full fake capture
failure matrix, strict unhandled rejection tests (30s), scoped lint, and saved
evidence replay. Independently verify runtime-input hashes and exact output/PID
absence. No profile parser or new profiler process needed.

## Decision Gate

Compare each run's baseline and three recovery windows, retain codec/admission
and observer limitations, do not pool unlike workloads. Repeated disappearance
only in recreate motivates source-level reuse regression and a narrow fix;
continued stutter falsifies sufficiency of disabling reuse and leads to internal
clock-source/query-latency observation. No speculative clock smoothing, bias
constants or discarded audio. Native fix requires failing-first tests, build,
isolated package runtime and Firefox-parity review before acceptance.

This is an investigation step, not completion of the owner's requested fix.

## Progress October 14 UTC

Initial preference seeding regression:1pass/1fail, then fixed. A first real
setup UXlvI6 stopped before observation because the new receipt preceded
document identification. Preserved failure, successful owned cleanup and export;
no playback result counted. Added integration ordering regression (old adapter
fails), moved receipt after document admission and before observation.136strict
tests pass. New immutable79-file harness Hb2Quz replaces r94y3B for the complete
four-cell sequence; no automatic retry. Daily browser untouched.

A/B/C passed: recovery drops20/2677,27/2700,6/2500 (reuse), then
5/2674,5/2700,5/2503 and8/2675,7/2700,8/2501 (recreate). D stopped40s into
capture on unstable artifact scan; cleanSIGTERM/root absence and14 sampled
PIDs absent verified. No complete fourth result and no automatic retry.

Next narrower observation: ONE fresh reuse cell with existing native
MOZ_LOG=timestamp,AudioStream:4, profiler off, same schedule and all unchanged
caps. Only the child environment changes; stderr remains the bounded logger,
no MOZ_LOG_FILE or global setting. Exact RebaseLive/Rebase log producers are
present in the deployed source; no per-position log loop exists. Correlate
process/object lifecycle and carried cursor values, not pointers across lives.
Logging cost remains a limitation. If this finds invalid mapping, first reproduce
that exact case in the native tests before a fix. If not, do not infer a branch.

Tests: existing136 strict capture tests plus failing-first generated environment
test (exact module only, ambient logger path not admitted, unrelated environment
unchanged). Import closure/hashes and parent receipts remain strict. Stop on
failure, no wider logger, no cap relaxation. This is private diagnostics, not
web API/default behavior modification.

## Native Correction

Logged reuse XkWE68 completed cleanly,37resource samples14PIDs absent,
2056logbytes/0drops. Baseline3/1200; recovery172/2675,140/2700,131/2501.
Same content PID3660518/stream0x7e030f727550 stopped then started. At
04:20:47.703325UTC RebaseLive read1163952 and chose carry=false; its AudioClock
reported write1171312, carry0. Missing7360frames=153.333ms at48kHz. Native
source pulse_stream_stop only corks; it does not flush. A generic pause before
a seek therefore cannot be assumed to empty the backend's queue. This is not
the failed-position-query hypothesis (this receipt has a valid nonzero cursor).

Correction: limit stashing/reuse to a live stream kept physically running
through a seek pause. Expose only an internal AudioStream eligibility query,
forward through AudioSink, consume in AudioSinkWrapper::Stop. A normally paused
stream follows existing Shutdown + asynchronous seek recreation, preserving
the seek-target clock hold and post-seek samples. Healthy continuous reuse,
dead/drained handling, ordinary pause, mute/device changes unchanged. No new
pref, public field, backend-specific guess, clock bias or stream flush.

Territory searched: SetPlaying reason -> AudioSink::SetPlaying -> Pause and
mKeepRunning/mCubebStarted/mState; Stop stashing -> Start health gate -> Resume
and RebaseLive; VideoSink consumes wrapper clock. No other production rebase
caller. Existing paused-seek tests incorrectly assert immediate callback-sized
advancement and reuse after real stop. Replace those assertions, retain normal
reuse regressions. Add exact normal-pause/seek-stop sequence from logged case.

Native red gate: changed wrapper tests against unchanged production; failures
must be the three recreate expectations, not build/runtime setup. Then add
eligibility guard, run full AudioClock/AudioStream/AudioSinkWrapper/VideoSink
families with no skipped tests, plus clang-format and exact-file lint. Existing
cached desktop build is used to avoid a full rebuild, preserving its3 prior
source changes and sealed packages. Tests run in newly owned private roots,
120s total105work15cleanup,1MiB log, strict executable/PID/installation checks.
Build two jobs/nice10/timebound; logs in new durable scratch. Gtest-only builds
are diagnostic, not installation candidates. Normal correction subsequently
requires mach package, unique provenance, candidate parity and repeated isolated
laptop seek acceptance before installing. Daily browser must remain untouched.

Success: native red->green, continuously-running reuse still reused and accurate,
paused seek recreates and does not lead audio, real seek post-recovery drops
consistently below1% across fixed windows on at least two candidate runs. Retain
old-versus-old noise and logging limitation. Failure opens investigation, not
automatic reruns/cap relaxation. Raw-query-error fallback is a separate known
edge to address after this observed path, not the attribution for this receipt.

### Candidate Runtime Gate

Use the sealed October12 beta as the closest baseline: same d43214 native base,
configuration and opt-in beta overlay. Package the correction from that isolated
source, retaining its existing unrelated build repairs, with a new unique
BuildID. Test-only fixture differences cannot affect the normal runtime package;
retain both complete source deltas rather than assert whole-tree identity.

Fixed sequence on laptop: baseline with narrow AudioStream logging, candidate
with identical logging, then candidate with logging OFF. Same private iHD driver,
1080p60 AV1 public video, audio, 45s UI seek, 130s observation and unchanged caps.
Pin both package manifests and verify each terminal/cleanup before next cell.
No repeated search for favorable runs: failure requires evidence review. Native
and public-surface gates run before installation; no daily-browser restart.

Native RED produced exactly the three expected recreation failures (35/38 pass).
Three internal state checks plus wrapper forwarding/admission are implemented;
normal binaries and gtest build succeeded. Native GREEN is38/38 with0skips.
Real acceptance subsequently passed. Scratch
/home/wyatt/.cache/codex/seek-audio-fix-20261014-5oJiex retains
native contract, source inventory, RED/GREEN packages, logs and owned receipts.

Candidate20261014043800 is packaged and pinned (47 regular files, no symlinks).
Native ELF BuildID agrees with both INIs. Same-build UmbraLink OFF/ON public
surface smoke and private-root receipts pass. BaselineHzI4G9 completed cleanly:
27/1201 baseline, recovery402/2674,583/2699,427/2502; actual stop/restart followed
by play1163541/write1171312/carry0 repeated the faulty mapping. Candidate logging
runfSoCso completed10/2677,9/2700,5/2499 recovery drops, with actual stream
shutdown/deletion/new initialization and no RebaseLive. Candidate loggingOFF
XHPfNx completed8/2677,5/2700,5/2498. Every candidate recovery window below1%:
acceptance passed. Each run cleanSIGTERM/14recordedPIDsabsent/37samples/0logdrops.
Final05:10:36UTC89input hashes unchanged/no matching browser or compiler.

Installed verified package separately into ~/Programs/umbrafox-nightly with
previous package retained, exact47files+.purgecaches, versionexit0/rootabsent.
Launcher and personal profiles unchanged: dated installs still outrank nightly,
so ordinary restart does not silently opt into this beta. No owner restart.
Complete scoped result in bot-docs/reports/performance/2026-10-14-seek-audio-reuse.md.
This planned correction is complete; separate query-error edge and general
YouTube/daily-hardware confirmation are not declared solved.
