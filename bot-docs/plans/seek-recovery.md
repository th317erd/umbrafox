# Seek-recovery investigation

## Current progress

Latest: V20 long1080p forward/backward progress-bar captures both pass,
including>=130seconds after seeked. Both retain1920x1080 throughout. Forward
has26drops(25beforeseek); backward has3isolated drops, no prolonged stutter.
SoftwareAV1 remains different from ownerhistoricalVP9. Clean owned SIGTERM,
all14recordedPIDs absent perrun, package postflight PASS,171tests PASS.
No native/product fix or causalGPU claim; see report for evidence and limits.

NEXT: match affected stream/codec/interaction rather than repeat unchanged
single-click AV1. OwnerURL/positions already requested, unanswered. Preserve
Auto and failed evidence. No forced codec/GPU preference, installation or
daily-desktop operation follows from these diagnostic results.

Long-quality contract: fixed `ui-forward-1080` and `ui-backward-1080` modes,
normal menu preparation and media-readiness wait before the existing baseline.
Initial page, native decoder metadata and first baseline sample must be
1920x1080; later format changes must remain in raw observations rather than be
discarded or silently relabelled. Preparation uses the same counted 64-RPC
envelope; no budget increase. Require the unchanged 185-second remaining work
reserve before starting the long sequence. Keep the 240-second total and
>=130-second post-seek window. UI result schema stays version2 and input stays
progress-bar; driver/streaming labels and explicit quality preparation distinguish
these from Auto. Offline review must verify all three quality clicks separately
from the single progress-bar click. First run forward; inspect before backward.

Completed V20: forward and backward actual progress-bar captures each retained
1920x1080 for156samples and>=130seconds after seeked;26/3drops respectively.
Forward25drops precede the seek; backward has no baseline drops. Neither
reproduces the prolonged owner symptom. Same build/harness, separate fresh
profiles; no statistical directional inference. Both cleanly stopped with all
recordedPIDs absent. Next match the affected stream/codec/interaction pattern;
the already-requested ownerURL/positions remain unanswered. No unbounded
unchanged-repeat loop, product fix, codec forcing or daily-desktop operation.

Completed admission contract: a separate `quality-1080` mode, not another
unchanged 480p recovery run. Select the fixed public video's ordinary visible
Settings -> Quality -> 1080p menu with existing native input commands. Save
bounded raw menu geometry/labels and click receipts before validation. Stop on
missing/ambiguous/hidden/occluded targets, advertisements or document changes;
no alternative selectors, hidden player API, codec/GPU preference changes,
extension changes, login or ad skipping. This is an explicit test-page setting,
not a browser default or an operation on the daily desktop.

Reuse the 120-second admission envelope and existing 20-second observation,
native decoder checks, owned application-data and cleanup machinery. Require
1920x1080 throughout the final ten seconds plus the after/native receipts before
calling the higher-resolution path admitted. Retain format transitions and all
failed attempts. It does not reproduce the owner's exact video/codec/60fps path
and contains no seek. Only after this admission should a separately labelled
high-resolution seek capture use the same preparation. Existing Auto/direct/UI
contracts and historical results must remain unchanged.

Preserved quality-admission attempts: V17 saw the 1080p60 submenu transitioning
with a visible but not yet hit-testable target and stopped without selecting it.
V18 selected 1080p60 but immediately observed readyState0, null duration and
zero dimensions; it stopped before playback. Both cleaned up and all 14 recorded
PIDs were absent. Neither is a playback result. V18's hit-test wait and V19's
post-selection metadata wait retain the admission guards rather than clicking
obscured items or playing unknown media. Menu readiness has ten 100-ms reads per
stage, at most three clicks; media readiness has twenty 250-ms reads and no
click/play/seek side effects. All requests remain inside the original capture
deadline. Raw failed observations exercise regression tests. Same-document
identity is carried into the otherwise unchanged 20-second admission.

Full actual progress-bar forward/backward captures now pass on the isolated
laptop: 151.556/151.499 seconds total, including 130.007/130.009 seconds after
observed seeked. Both have 4543 frames, zero drops, no sampled low-advance
interval, 156 samples/zero missed intervals, before/after native receipts and
clean owned cleanup. All 14 recorded PIDs absent per run. Profiler OFF, no daily
desktop/native/default/quality changes. Results remain software AV1/854x480;
they do not reproduce the owner's prolonged stutter, prove physical smoothness,
or match historical VP9/1080p60. Functional captures use V15 forward/V16 backward,
not a same-version performance A/B. Report has exact roots, hashes and failures.

NEXT: match the affected video/stream and seek pattern, rather than repeat this
unchanged low-resolution capture. Owner URL/positions were already requested;
no response yet. No speculative native fix, quality/GPU preference override,
personal profile operation or daily-browser restart follows automatically.

Earlier short-probe stage:

The actual YouTube progress-bar short probe now passes on the isolated laptop
(V13, run `laptop-youtube-ui-probe-20261007-wVxCG7`). One existing native-input
click moved playback from 2.988 to 45.261 seconds, with trusted seeking/seeked
113 ms apart. Before/after native directories, selected tab, profiler OFF,
five resource samples, package postflight and clean SIGTERM passed; all 14
recorded PIDs were absent afterward. This is a short interaction/cleanup proof,
not a prolonged-recovery test. AV1/854x480/software ffvpx remains different from
the historical owner VP9/1080p60 workload. Daily desktop untouched.

Three failed attempts remain: V10 unnecessary reveal move followed by hidden
bar; V11 rejecting metadata-only readiness during a real seek; V12 incorrectly
equating the last sample timestamp with the last event timestamp. Each was
preserved and corrected with regression tests before another browser launch.
The third attempt's raw completed seek is independently revalidated without
changing its failed run status. No performance timing was retried for a better
number. V13 is the first end-to-end success, including the after receipts.

That stage's next step, now implemented: a full actual-UI capture with >=130 seconds after
the observed UI action. Do not reuse a control-labelled result with hidden UI
seeks: `validateSeekResult(control)` intentionally forbids seek events. Preserve
explicit UI-action identity/timestamps, the same document/video, partial data,
bounded cancellation and raw event/sample clocks. The existing shared default
20/45/45/40 direct-element contracts must remain unchanged. Better stream and
owner-video matching remains a separate owed step; no speculative native fix.

Earlier continuous direct-element wave:

The long external-page adapter and short real start/query/cancel probe pass.
The fixed YouTube control/forward/backward wave is complete: each observed
150 seconds, including over 130 seconds after the action. Forward/backward
seeking-to-seeked latency was 66/40 ms, with zero reported drops in both cases.
Control reported 10 drops in the first six seconds and none afterward. The
owner's prolonged stutter/recovery was not reproduced by these observations.
All three remained AV1/854x480/software ffvpx, unlike the historical owner
VP9/1080p60 workload. This sequence sets `currentTime`; it does not exercise
YouTube's progress-bar UI. No physical black-frame or scanout claim.

Each case has 154 samples, five native/process/tab checkpoints, 24 workload
RPCs and 36 resource samples. Before/after native directories, exact joins,
profiler OFF, safety caps, package postflight and clean SIGTERM pass. All 14
recorded PIDs per case were independently absent. No browser remains owned by
this wave. Next: actual progress-bar interaction and better workload matching,
not another identical direct-element seek or speculative decoder/GPU changes.

New scratch
`youtube-session.mjs` and `youtube-recovery.mjs` reuse the existing sequencer,
capture budget and native diagnostics. 129 focused/integration tests pass,
including generated frame-script execution, cancellation with a retained
partial observation, all RPC/write failures and exact document ownership.
V9 contains 30 files, 68 parsed module edges and 27 syntax-checked JS modules.
No browser source/defaults or daily desktop state changed.

The first short probe correctly retained an aborted first segment, which the
host incorrectly expected to be absent. Failure and clean process receipts
are preserved; the expectation was corrected failing-first without discarding
partial data. The second probe passed, including before/after native roots,
acknowledged cancellation, package verification and all 14 recorded PIDs absent.
The later full wave used the same V9 source without a favorable-run retry.

Earlier: the isolated 20-second YouTube admission passes on the same pinned
laptop baseline. It selected AV1/854x480, with an immediate post-pause ffvpx
software-decoder receipt; 600 reported frames, zero drops, 21 visible samples.
This is not the owner's historical VP9/1080p60 path and contains no seek.
The first attempt exposed the adapter's default 15-second transport timeout;
its failure/cleanup evidence is preserved. A failing-first regression and
107-test integration subset pass after explicit native/client/host limits of
27/28/29 seconds. Existing global defaults and safety caps remain unchanged.
Both owned browsers exited cleanly; all 14 recorded PIDs per attempt were
independently absent. No daily desktop browser was accessed.

Earlier next step, now implemented: the external-page long observation contract, then the fixed
control/seek cases. Reuse shared ownership/budget/resource machinery, but do
not pretend the local fixture's 1920x1080 readiness test or in-page HTTP
progress protocol already applies to YouTube. Preserve actual format changes,
document/video continuity, raw partial results, >=130 seconds after seeking,
and private decoder/process receipts. Each control request is limited to
60 seconds; a single unbounded 150-second injection is not the solution.
Keep profiler OFF and quality/extension/GPU settings unchanged initially.
The affected video URL/seek positions were requested from the owner; that
information improves workload matching but is not a runtime-permission gate
for the already authorized isolated laptop tests.

Runtime update: phases 1-5 and the first phase-6 analysis are complete for the
isolated direct-AVC wave. Version 3 contains 27 verified files; smoke and the
fixed control/forward/backward cases pass. All three observed about 150 seconds,
including over 130 seconds after the action, with zero reported dropped frames.
Forward/backward seeking-to-seeked latency was 80/73 ms. Prolonged recovery was
not reproduced; physical scanout, black frames, audio, and long YouTube seeking
remain untested. Full verification is 411 PASS. Two failed smoke attempts remain in
evidence (missing provenance assets; absent optional corruption counter).
Report: `bot-docs/reports/performance/2026-10-07-seek-recovery.md`.

Next is the owned laptop YouTube streaming path, not another identical local
fixture or a speculative product patch. Keep the daily desktop untouched
without the promised heads-up. Earlier implementation-stage progress follows.

Phases 1 and 2 are implemented in the unsealed scratch namespace
`artifacts/umbralink-control/seek-recovery/`: collector, sequencer, loopback
server, owned-page bootstrap, and strict result validator. Sixty tests pass,
including actual collector/sequence fake-clock integration, real loopback HTTP,
and actual bootstrap source executed in a VM with a synthetic sequencer.
These tests do not prove real Firefox playback or recovery.

The media portion of phase 4 is verified: `video-180.mp4` has 5,400 frames,
180 seconds, and two exact stream-copied halves of the existing 90-second clip.
Packet continuity and all decoded frames were checked. The asset is silent;
its repeated-content boundary at media time 90 seconds is a known confound.

Phase 3 is now implemented at the supplied-data level. The shared local
capture harness accepts an explicit `seek-recovery` plan only for the three
headed cases, with fixed 240-second total and unchanged legacy short limits.
The scratch capture/driver includes a separate 60-second smoke entrypoint,
progress/result joins, native observations, and a pinned baseline package.
The final combined suite passes 408 tests; no browser has run this experiment.

Phase 4 has a verified local runtime archive: 24 files, 48 import edges,
45,527,040 archive bytes. It includes literal dynamic imports and the served
page-module/media dependencies. Every archived member matches its source hash.
Remote transfer, actual package admission, and phases 5-6 remain pending.
Use a 360-second driver process watchdog and 400-second SSH envelope at launch;
these are recorded requirements, not timers created by importing the driver.
Do not use the old 120/220/240-second capture/driver/SSH envelopes.

## Target and authority

### Long progress-bar capture decision

Add fixed `ui-forward` and `ui-backward` scratch-driver modes, using the same
240-second capture budget, 210-second private-session watchdog and unchanged
20/45/45/40 observer schedule. Do not modify browser/native code or user defaults.
Use the existing sequencer with an optional private action callback. With no
callback, existing direct/fixture contracts remain exactly version 1. With
the callback, emit version 2 plus `input: "progress-bar"`; control cannot use
this callback. Dedicated UI validation rejects version-1/control substitution.
The shared capture's `headed-seek-recovery-forward/backward` mode remains the
existing budget category only; scratch driver/streaming modes retain `ui-`
prefixes and the sequence carries its distinct version/input. No shared budget
parser or product API change is needed.

At the second segment the private callback arms trusted seeking/seeked listeners
without assigning currentTime. Expose a private `actionPending` snapshot field
only for the UI route. A finite eight-second listener deadline and the existing
sequence abort/close remove owned listeners; no delayed callback may seek or
resume playback. Record both the sequence request/arming time and the observed
seeking/seeked times. Extend only the last segment, within its existing 50-second
maximum, to guarantee >=130 seconds after `seeked`, not after planned dispatch.

The host checks a running/actionPending session after 21 seconds, then performs
one geometry-validated progress-bar click to 45 or 5 seconds. The short probe
keeps its existing <10-second start restriction; long clicks require playback
within 10-35 seconds and correct direction. Same bounded readiness/post-click
reads and no repeated click. Save raw UI receipts before validation. Join the
unique trusted pair from segment 1 to the UI before/after page-clock bracket;
retain both independently timestamped listener observations rather than assuming
their callbacks read identical times. There are still four bounded segments and
at most 32 session requests. Sparse host checks do not prove continuous process
identity, network timing or physical scanout.

Fail-first gates: callback absent/invalid, no input causing no seek, event trust,
order/duplicates/target mismatch, changed media/document, hidden/paused/error,
abort and late callbacks, failed listener installation/removal, timeout, real
generated frame-script integration, final-window extension and partial evidence.
Host integration must verify actual UI input before accepting version 2 and
retain every RPC/write failure. Preserve all prior 142 tests and saved analyses.
Only after these gates and a fresh archive/source/host admission, run one fixed
forward case and inspect its full post-seek result before a backward case.
Profiler remains OFF; no quality/codec/extension tuning in this first long UI wave.

V14 first long forward attempt failed before any click: after 21 seconds the
bar was hidden, and one center-point mouse move plus ten reads did not reveal
it. Same document/video, raw receipts and acknowledged cancellation retained;
clean owned SIGTERM, all 14 recorded PIDs absent, package postflight passed.
Do not call this a seek or performance failure. V15 will test one two-point,
100 ms movement wholly inside the player for hidden long-route controls only.
The short probe and already-visible path remain unchanged; visible admission
and one-click bounds are not relaxed. This tests a reveal hypothesis, not a
confirmed cause or product fix.

V15 forward completed the full UI window. Its first backward capture clicked
successfully but the private observer aborted during the trusted seeking event;
the exact live flag was not recorded. Source shows queued media-event delivery
and independently changing decoder seeking state, so requiring a still-true
flag in that event callback is invalid. V16 retains a typed boolean, trusted
ordered event pair, same video/document and settled target checks, but allows
the live flag to have become false before callback delivery. A failing-first
queued-event test and actual serialized sequence regression cover this change.
The failure-close receipt also now reads media state after pause/cleanup, not
only before it. Original failed captures remain failures. No browser/default
change and no causal attribution of the owner's stutter follows.

### Progress-bar probe decision

The direct-element wave is negative reproduction evidence only. Before adding
a full UI-driven sequence, run one short `ui-probe` on the same isolated laptop
baseline. Reuse the established continuous private collector and normal probe
cancellation. No new browser API, native source, quality/codec selection or
daily-browser action. The control source routes pointer motion/click through
`UmbrafoxControlInput` and existing synthesized native input, not DOM `.click()`.

After three seconds of confirmed playback, inspect only bounded player/video
and progress-bar geometry/state. Use an already visible bar directly; only
when it is hidden, reveal controls using one pointer move within the verified
visible player. This follows preserved V10 evidence: the initial bar was
visible/hit-testable, but became hidden after an unnecessary pointer move.
V10 stopped without clicking and cleaned all 14 recorded processes. The exact
cause of the visibility transition is not established. Require a unique slider, normal left-to-right
horizontal geometry, positive viewport containment, visible ancestors and a
positive hit-test on the intended bar point. The proposed selector is an
unverified runtime candidate until this probe accepts the actual DOM.

Click once at the geometry-derived 45-second position. No ad skipping,
alternative-selector guessing or repeated clicks. Save raw inspections/input
replies before validation. Use the existing short RPC bounds, at most ten
100-ms readiness observations per phase, and the original 120-second total.
Require same document/video/content, advancing playback, exact selected tab,
bounded target-position error and trusted seeking/seeked events in the retained
partial collector. Cancel before the sequencer's normal 20-second action.
The preserved V11 click reached 45.220 seconds with trusted seeking/waiting,
but the host wrongly rejected metadata-only readiness during the seek.
Post-click `seeking=true, readyState=1` is now pending within the same ten-read
bound, never success; readyState>=2 and seeking=false still gate completion.
A paused close receipt may have readyState=1 and still acknowledge listener
cleanup. This does not turn an incomplete seek into a performance pass.
Read native directories/build afterward and prove owned cleanup as usual.
Input uses an existing context-targeted command; discrete document checks are
not an atomic document pin on native input. Owned, otherwise unused tab only.

Fail-first tests: hidden/occluded/multiple/foreign sliders and malformed numeric
geometry cannot dispatch a click; failures at every read/input/write preserve
raw evidence and never retry the click; actual serialized inspector executes
against supplied DOM fakes; missing/misordered/untrusted seek events or a wrong
post-click position cannot pass. Existing 129 tests and direct-wave contracts
must remain green. Unit commands <=30 seconds, real driver/SSH 360/400 seconds.
Only after this actual probe passes should a full progress-bar recovery capture
be integrated. It must retain >=130 seconds after the real UI seek, not merely
after the planned action timestamp.

### External-page integration decision

The October 7 source check confirms `executeControlScript` nukes its sandbox
in `finally`, with a maximum 60-second operation timeout. Do not leave a page
callback in that sandbox or increase browser limits. Reuse the existing
privileged browser/frame-message route used by `mediaDebugRequest`, with a
private, per-run random message name and exact document/browser checks.

The temporary frame-script closure will retain the actual document and video
references throughout the existing 20/45/45/40-second sequence. Short controller
queries retrieve bounded partial receipts; no globals, attributes, events, or
new interfaces are added to the web page. An explicit close, document unload,
or a fixed 210-second local watchdog aborts observation and removes owned
listeners/timers. Existing process deadlines/owned-browser cleanup remain the
outer authority; a page/process timer is not an OS execution bound.

Reuse `runSeekSequence` and its result validator. Add one optional local
format-admission callback so the direct fixture retains its strict 1920x1080
default, while YouTube requires the exact content/player and records adaptive
dimensions rather than forcing them. No arbitrary schedules or timeout CLI.
The session admits at most 32 ordered requests, four progress receipts, and
one bounded result. Final snapshots must not duplicate the entire progress
array beside the same result. Save raw replies before validation; fail closed
on stale identities, missing replies, byte caps, cancellation or cleanup errors.

Implementation gates: failing-first default-format regression and explicit
adaptive-format checks; fake message-bus tests for exact identity/order,
duplicate/overflow commands, partial receipt retention, abort/close/watchdog,
late completion/rejection and listener/timer cleanup; execute the generated
source in a VM. Then run a short isolated real start/query/cancel probe before
any 150-second capture. The host adapter must use the existing named recovery
budget and sparse decoder/process observations, with native roots before and
after. No long runtime is claimed from these unit or short-probe gates.

Investigate the October 7 owner report: moving the video's progress bar causes
stutter, followed about one or two minutes later by a brief black flash and
immediately smooth playback. "Searching" meant seeking, not a search query.
Recovery, decoder reset, and GPU reset are not interchangeable diagnoses.

The first streaming sequence changes the video element's `currentTime`, not
YouTube's progress-bar UI. It establishes a media-seek comparison, not equality
with every player-specific scrub/preview/seek action. If this does not reproduce
the symptom, the next comparison should exercise the actual progress bar on
the affected video, rather than repeating this direct-element workload and
claiming the owner's interaction was covered.

Existing authorization permits bounded isolated tests on wyatt-laptop. Do not
attach to, navigate, restart, or change the daily desktop browser without the
owner's required heads-up/consent. This plan changes diagnostic fixtures only;
no browser API/default, extension configuration, shader, decoder policy,
installation, or public identity changes. Full performance goal stays active.

## Inspected boundaries

- The new scratch `collectSeekRecovery` is an explicit-signal, <=50-second
  passive observer. Its 18 tests do not prove real browser integration.
- `executeControlScript` cancels/nukes its sandbox, but does not expose its
  internal signal to the executed body. Do not leave injected listeners running
  after their controller is canceled.
- The existing owned readback harness has a 120-second total deadline with
  15 seconds reserved for cleanup. A longer experiment needs an explicit named
  contract and tests, not an increased default or a timeout override.
- Existing source-pinned `sustained-video.mp4` is 90 seconds, insufficient for
  uninterrupted 130-second observation after the seek. The local server already
  has a tested single-range parser; reuse that parser, not a new HTTP parser.
- The existing lifecycle monitor checks owned identities, resources, and
  artifacts and permanently stops new sampling after read failures/timeouts.
  Preserve it and the existing private installation/profile/app-data/temp roots.
- `mediaDebugRequest` gives document-bound decoder/counter receipts through
  existing privileged control, without a new public interface. Native process
  snapshots provide separate identity evidence; page counters are not that proof.

## Fixed experiment

Use an owned direct-video page, not the canvas-copy workload and not a hidden
YouTube automation script. Ordinary fixture code owns its AbortController and
listeners. Its module scope never becomes a new browser/platform interface.

Three fresh isolated captures of the same admitted package, fixed order:

| Case | Baseline | One action | Observation after action |
| --- | --- | --- | --- |
| control | 20 seconds at normal rate | No seek | 130 seconds |
| forward | 20 seconds at normal rate | Set currentTime to 45 seconds | 130 seconds |
| backward | 20 seconds at normal rate | Set currentTime to 5 seconds | 130 seconds |

Playback remains in the same browser/document/element across each entire
nominal 150-second sequence. No relaunch or artificial recovery mid-sequence.
Use nominal 20/45/45/40-second observer segments. The final segment extends
only as needed to cover 130 seconds after the actual action timestamp, up to
the unchanged 50-second helper limit; otherwise fail as incomplete. This
avoids a fractional observer-installation delay shortening the recovery window.
Start the first post-baseline observer before the seek so seeking events
are retained. Preserve each segment's raw clock origin, inter-segment gaps,
local element IDs, missing samples, and event trust. Segment IDs do not by
themselves establish cross-segment object identity; the owned sequencer must
check its actual video reference at boundaries.

Use the verified 45,212,087-byte `video-180.mp4`, SHA256
`585de5a1064ad6dfd7f365346a3c3b11b68ebcf1e94c9b9ba4da7040ee190e97`.
It is H.264, 1920x1080, 30 fps, with no audio. At normal progress, the repeated
content boundary occurs approximately 90/65/105 seconds after playback starts
in control/forward/backward respectively. Preserve actual media timestamps;
do not mistake this content change for recovery or a decoder reset. Never
silently enable loop or change rate.

Start profiler OFF. Do not force hardware preferences or promote the failed
fence candidate. Select and revalidate the package before runtime; report any
difference from the owner's installed build. Keep the page visible and selected.

## Lifetime and evidence contract

Implemented fixed named recovery capture: 240 seconds total, work cutoff at 225,
ordinary cleanup cutoff at 238, final report cutoff at 240. Other workloads
remain <=120 seconds. Setup must leave >=165 seconds of work before starting
the fixture. Driver/SSH watchdogs must exceed capture plus bounded preparation
and cleanup, and retain ownership on timeout; they are not performance gates.

Retain the 256 MiB sampled artifact cap, existing RSS/FD/thread/process caps,
and existing bounded log/evidence writers. Explicit finite limits for this
fixture: four observer segments, <=52 samples/256 events per segment, one
observed video, one action receipt, and <=1 MiB aggregate JSON result. Preserve
partial evidence before validation fails. No cap escalation to obtain a pass.

Each completed segment has one bounded progress POST before validation; the
terminal POST contains the full result. Server readiness/progress/result are
transport receipts, not success verdicts. The driver must save raw evidence,
join the four progress receipts to the terminal result, then call the strict
validator. Record publication gaps and observer cost. Verify terminal-writer
failure behavior with maximum/malformed fixture snapshots before runtime;
normal fake receipts fitting the writer is not a universal size proof.

Server must bind loopback only, use a per-run unpredictable fixture path,
bounded routes/methods/ranges/body/requests/connections, a one-shot start barrier,
and one terminal receipt. Abort/close must settle pending readiness/start/result
waiters and initiate all owned shutdown effects before awaiting them. No
personal profile/token/app-data contents are exported.

Before/after native directory, build, document, selected-tab, profiler state,
decoder and process receipts are required. Sparse observation bundles are fixed
at 21, 65 and 110 seconds relative to host start, in every case. They include
page-clock/document identity, decoder, process and selected-tab reads, with
host RPC intervals retained. These are not exact action-relative samples;
join to the page's actual action clock afterward without mixing clock origins.
More than five seconds late is an incomplete scheduled slot, not a catch-up
burst. Do not treat observer cost as zero. Final admission also requires
same document, exact action, successful cleanup, and independently absent owned
PIDs. Report sampling gaps and any transient-process coverage limits.

The driver accepts only the pinned baseline manifest
`09261b9b755eb2295aa92393ddaab215ab8936cb79ebd27699ab8695ca3d1eae`,
BuildID `20261006175655`, on wyatt-laptop display :0. It creates a private
installation and reuses existing before/after installation validation. This
diagnostic baseline is not asserted equal to the owner's current daily build;
no failed fence candidate or GPU-import preference is promoted. The initial
smoke exercises media readiness, one-second playback and the actual observer;
it does not pretend to execute the entire 150-second bootstrap sequence.

## Implementation and verification order

1. Implement and test the owned-page sequencer. Failing-first cases must prove
   all three schedules, observation installed before seek, exact single action,
   normal rate/no loop, element/document change rejection, abort, play failure,
   ended/hidden/error states, and preservation of incomplete segments.
2. Implement the bounded server and real loopback HTTP tests. Prove start
   single-use, correct Range responses, receipt/body caps, malformed/duplicate
   receipt rejection, disconnect, abort, listener shutdown, and caller-owned
   result rejections. Preserve raw result before typed validation.
3. Add the explicit long-budget adapter with fake-clock cutoff/reserve tests
   and legacy short-budget regression checks. Add integration tests that fail
   every RPC/write/startup/cleanup boundary and preserve first failure.
4. Generate/verify the media and pin the full static dependency/package closure.
   Do not reuse a sealed artifact namespace for new output.
5. On the quiet laptop, run an isolated short integration gate before the three
   fixed long captures. Preserve failures; do not retry for favorable timing.
   Recheck host readiness and owned absence between captures.
6. Analyze action-to-recovery data without smoothing away the choppy interval.
   A negative synthetic result means not reproduced, not that YouTube is fixed.
   A positive result must guide a smaller causal test before a product patch.

Small pure tests use a 10-second external watchdog. Loopback integration tests
use 30 seconds plus per-case timeouts and explicit server teardown. Full runtime
requires separately recorded fixed bounds above and active progress updates.

## Review questions and falsifiers

The crucial test is continuity across the action: callbacks must already be
observing before currentTime changes, and cancellation must not leave a second
observer/seek running. Fake clocks can test this ordering, but real Firefox
must still prove autoplay/decoding/DOM behavior and transport admission.

Malformed or incomplete observations must never become zero dropped frames or
successful recovery. Hidden video, end-of-stream, media errors, read failures,
event overflow, element replacement, and owner cancellation are incomplete
captures, retained with reasons. If normal completion follows cleanup failure,
it is not a successful capture.

Compare decoded and presented progress, dropped-frame increments, readiness,
buffered coverage and observed decoder/element/process changes. None alone
proves GPU wait, physical scanout, or a reset. Correlate the black flash only
with an actual visual observation; the passive collector reads no pixels.

If synthetic direct playback does not reproduce, investigate the owner's
specific streaming path next with a bounded passive desktop attachment after
heads-up, or an explicitly scoped laptop YouTube run. Do not substitute more
canvas-copy optimization for the missing seek/recovery evidence.
