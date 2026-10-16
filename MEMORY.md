# Umbrafox Working Memory and Resume Instructions

## October 15 Clipboard Prototype: Installed Inactive

Implementation commit47e6fdeb78fee3bde3447b348f49244025b0b738; release receipt
and continuity publication follows as a separate milestone.

Native and integration gates PASS; report2026-10-15-clipboard-protection.md and
conversion recipe19 now record actual implementation/reapply rules. Browser808,
snapshot668,permissions148,UI/actor51; packaging/install12;launcher/beta16.
Installed complete package ~/Programs/umbrafox-nightly, BuildID20261015235226,
archiveb4db996e...119460288B, rollback sibling.before-clipboard-20261015.
Version exit0 Umbrafox160.0a1, ownedPID absent; .purgecaches verified. No daily
browser restart/clipboard/profile/launcher change. ACTIVATION STILL HELD:
nightly/default installation mapping points to a different profile from owner
dated build. Ask owner to close/approve mapping before switching tested launcher;
never copy profiles or promise current launcher selects new package. All lanes
closed, monitor stopped; recorded owned test/helper PIDs absent. Preserve all
failed runtime/build/test logs in export evidence, not just final green results.
Read newest DETAILS/export README for commit/push state and exact provenance.

## October 15 Clipboard Runtime Checkpoint

Read newest DETAILS first. Build7 passed; build8 compiles readonly freshness fix
under same20261015235226 pin. Integrated1 actual419PASS/12FAIL/2TODO: native
Yes/Always/revoke for both operations and default pointerlock/focus traces pass.
Failure logs preserved; obsolete ownerGlobal fixture cleanup now documentGlobal.
Two substantive failures: beforeinput readonly must reject retry success (parent
fix compiling), persisted cross-origin frame grant icon hidden after reload (UI
agent resumed). Parent47pure tests pass, no package/install yet. Same DB/bus.
Fresh isolated headless app-data/clipboard only; daily browser untouched. New
launcher/profile activation is HELD because nightly maps to a different profile;
owner informed closing consent needed. Inactive verified package install remains
authorized. Do not claim restart will select new package while launcher held.

## October 15 Clipboard Continuation: Not Yet Ready To Install

Latest native build6 full mach build -j2 (not binaries: IDL/IPDL changed),
log /tmp/codex/clipboard-20261015/native-build-6.log. Pin20261015235226.
Read newest DETAILS and teamwork DB for subsequent status. Private noscript
generation-check helper appended after4 existing snapshot methods; no stale
paste fallback. Build corrections preserved in logs, native/runtime pending.
UI review disproved automatic popup default parity (Escape/pointer lock).
Quiet dismissed permission indicator selected, explicit click opens choices;
user informed, UI worker implementing without global popup behavior changes.
Additional real native safety tests being authored by bridge worker; parent
alone runs isolated headless tests. Do not install incomplete build or touch
active daily browser/profile/clipboard. No implementation completion claim yet.

## October 15: Clipboard Implementation Authorized And Active

Owner requested three sub-agents and prototype installation after verification.
See newest .codex/DETAILS.md and /tmp/codex/clipboard-20261015/{teamwork.sqlite,
control.txt,*-contract.md,review.md}. Do not restart/close daily browser.
Native draft and UI/actors exist but are NOT integrated/verified/installed yet.
Only original clipboard default semantics until explicit No/Yes/Always response;
CE exemption, script execCommand exclusion and private observer transport.
Native baseline canceled-copy notice RED0vs1; unknown token failclosed PASS.
Isolated native build2 running, logs native-build-2.log, pin20261015235226,
C++/Rust2jobs. Main native corrections must resync after this first compile.
UI16/bridge21 pure tests pass; runtime/compiled safety and package remain gates.

## October 15: Shortcut Push Complete; Clipboard Policy Clarified

Published Chrome preset 25de5d0b584d; remote main exact SHA independently verified.
Canonical conversion guide recipe18 now preserves that implementation's commit,
files and verification; recipe19 registers the clipboard design as PLANNED ONLY.
Guide README/current-state/inventory updated; add native/UI paths and commits to
recipe19 when implemented, never reapply the withdrawn default-on proposal.
No install or daily-browser activation. Owner WITHDREW default-on copy/paste
protection: now discussing Firefox defaults plus browser-owned per-site
No/Yes/Always override notice after a user operation is canceled. Contenteditable
exception remains. No parity exception authorized; no clipboard source/pref/runtime
changes yet. Cancellation can mean successful custom copy/paste, not blockage.
Owner explicitly accepts that ambiguity: outside contenteditable, content-canceled
genuine user copy/paste should prompt regardless of intent/replacement content.
No success heuristic; propagation stop alone is not a trigger; no automatic retry.
Non-focus-stealing UI, no suspended DOM dispatch, bounded safe retry, scoped grants
and no background clipboard permission expansion are proposed design constraints.
Source investigation and verification gates: bot-docs/plans/clipboard-protection.md.
Protect ordinary inputs/textareas and page selection, preserve rich-editor handling
in contenteditable; do not promise protection against arbitrary subsequent DOM
mutation or relax clipboard permissions. Daily browser/clipboard remain untouched.

## October 15: Chrome Preset First Pass Verified

Owner accepts partial/non-one-to-one parity and approved implementation. Explicit
Linux preset added to about:keyboard: CtrlJ, CtrlE, CtrlShiftN, Ctrl1-9; conflicting
undo-window shortcut cleared, command retained. Earlier unconditional two-file
edit superseded; Firefox defaults restored in source. CustomKeys store/reset used,
unrelated customizations retained and conflicts rejected before changes.
Pure13PASS; full isolated browser350PASS/0FAIL/1expected; lint0. Report:
bot-docs/reports/2026-10-15-chrome-shortcut-preset.md. Logs
/tmp/codex/chrome-hotkeys-20261015. No owner browser/profile/install/launcher or Pi
changes. Owner subsequently authorized commit/push; not packaged or activated
in daily profile. Other
platforms, DevTools and destination/focus differences explicitly deferred.

## October 15: Full Chrome Shortcut Research

Owner wants FULL hotkey parity, not just two edits. Research/draft only:
bot-docs/plans/chrome-hotkey-parity.md. Official browser/DevTools documentation and
source audit found command/context/platform gaps. Pure repository preprocessing
and Fluent parsing confirmed duplicate Ctrl+J (search2 vs Downloads) in the pending
patch. Two production files remain untouched by this audit. Reuse CustomKeys where
possible, but it cannot itself change command destinations or toolbox semantics.
Reserved-key remapping can change page-event visibility; recommend explicit user
opt-in, preserving Firefox defaults. Owner ruling and implementation authorization
remain pending; no browser/profile/launcher modifications or new runtime tests.

## October 15: Recovery And Hotkey Handoff

HEAD ed5c2e1dea6e. Two uncommitted tracked edits match the owner-supplied report
bot-docs/bug-reports/2026-10-15-chrome-parity-hotkeys.md: Downloads Ctrl+J and
New Private Window Ctrl+Shift+N, with conflicting Undo Close Window shortcut
removed. Preserve, do not reapply; unbuilt/uninstalled/runtime-unverified. Report
requires owner request before committing/pushing this separate patch.

Read-only recheck still finds PID3651740 (Oct14 15:05:30 start) executing dated
Oct1 build, not installed fixed nightly. No browser/profile/launcher changes.
Owner clarified abrupt exits while submitting chat/changing tabs, no reporter;
cause and exact incident times remain unresolved. Logging wrapper is proposed,
not installed. No restart/termination/debugger without consent.

ARM build is COMPLETE, not ongoing. Coordinator DB event46 reports Pi beta
20261014135715 deployed; events48-49 report HDMI audio fix/owner-confirmed tone.
Pi runtime belongs to l8ros; these are attributed reports, not our fresh checks.

## October 14: Read-Only Random Exit Triage

Owner reports latestnightly randomcrashes. Actual active3651740 exe+libxul dated
Oct1, INIs20261001103920, NOT installedfixed20261014043800. Launcher stillprefers
dateddirs; no switch performed. stdout/stderr /dev/null. Two scopes ended14:32:27
and15:05:18Arizona, no signal/status; no recentcore/OOM/segfault/minidump found.
Currentprofile crashstore8records newestOct5. ThatOct5report isServiceWorker
shutdowntimeout, notproof fortoday. Causeunresolved; askedincidenttimes/CrashReporter.
Report bot-docs/reports/2026-10-14-desktop-crash-triage.md. Browser/profile/launcher
untouched; anydebugger/restart/logginglaunch requiresseparateconsent. ARMcontinues.

## October 14: ARM Packages Complete

Final build48247/package24582/normalverify51226/betaverify89017 all exited0.
Exports exports/umbrafox-arm-20261014/: bothBuild20261014135715 native+INI+header
matching; normal99237048B SHAebc8f575843aac6e9e19d2e45f488422250892858f7c291516a01fbbdf70c059;
beta110565684B SHAfc3ba2d3139fc1021fb2c1d20db2b041b9a34759270300f8e8984a992fec1436.
28ARM64ELFs/46normalfiles; beta47only adds348B two-pref overlay4278e82f... .
9validator+5archive+2pref testsPASS. Sourceclean c0e7f8a2be04/probesOFF/empty patch.
No active buildneeded; l8ros owns deployment+Pi runtime. No desktop install.

Owner now requests commit/push all work, then ARM build; l8ros coordinates.
CORRECTION: coordinator is Pi agent tmux l8ros:1.1, NOT Codex thread01a0cb3e.
Use authorized tmux injection after checking pane input, plus teamwork_events.
DB /tmp/codex/teamwork/20261014T2105Z-l8ros-arm.sqlite, session same basename,
task track-arm; bus /tmp/codex/l8ros-arm-bus.txt read after each command.
ACK sent. Own isolated build/package/provenance only; NO Pi or desktop changes.
Published clean pin c0e7f8a2be0460695c1f65ae8796b09c1082480c includes prior fixes.
Build scratch ~/.cache/codex/umbrafox-arm-20261014-gZmxuBOR. Original session10437
ended143 by approved own-group TERM; group absence proved. Session10757 resumed
C++6 but later host geckodriver inherited6make tokens despite CARGO_BUILD_JOBS2.
After libxul link50:54, stopped own group3551980/exit143, absence proved. Final
session48247 SAME obj make2/Cargo2/nice10/3600s, build-final-j2.log. Both earlier
logs/stop/exit receipts retained. No source/config change.
MOZ_BUILD_DATE retains20261014135715; config/header hashes unchanged. Memory
guard: below8GiB reduce4/below5GiB reduce2. Full build and packaging now PASS.
Normal mach package + exact two-pref beta overlay explicitly requested, probes
OFF for both. Handoff archive/size/SHA/BuildIDs/overlay/source-patch/layout/export.
No ARM native execution authorized; coordinator owns it. Preserve unrelated
untracked upstream remnants and never stage generated binary archives.

## October 14: Daily Nightly Switch Prepared

Newest request: select fixed nightly for daily use and check Pi access. Pi SSH
works (l8ros@192.168.1.138, Pi4, 15days uptime); no Pi changes. Desktop browser
PID2370894 still runs dated20261001 with cjmrhtcu.default-default-2. Nightly key
301410E7660F9C94 maps to older kvm20oct in both INIs; must remap to current cj
before changing launcher, otherwise owner gets an old profile again. No data copy.
Asked permission to close/reopen, awaiting reply; live browser/settings untouched.
Prepared tested6/6 nightly-only launcher and backups in
~/.cache/codex/nightly-switch-20261014-8LupEmR5/. Installed47files hash/mode/size
verified Build20261014043800; desktop/HTTP/HTTPS associations correct. See newest
.codex/DETAILS.md section for exact paths and next steps. Do not claim switched.

## October 14: Paused Audio Stream Reuse Bug Fixed And Verified

Fix/report committed as d74c12c71fdf. Package provenance remains the recorded
d43214 base plus frozen source.patch, not a claim it was built from that commit.

Active request: continue until the post-seek stutter is found and fixed. Desktop
daily browser remains untouched; isolated laptop runtime is authorized. Plan
bot-docs/plans/seek-audio-reuse.md. New main changes are limited to AudioStream.h,
AudioSink.h, AudioSinkWrapper.cpp, its gtest and two adjacent docs.

Logged laptop XkWE68 (seek-audio-log namespace) caught actual stream stop/start,
then rebase with play1163952/write1171312/carry0:7360frames=153.333ms at48kHz
lost from mapping. Pulse stop corks without flushing. Wrapper incorrectly reused
an already-stopped stream. Fix admits reuse only for keep-running+backend-started
+logical STOPPED; otherwise existing asynchronous recreation. Native38tests:
RED35pass3expectedfail -> GREEN38pass0skip/cleanownedexit. Continuous reuse passes.
No public interface/default change. Raw-position-query failure fallback remains
a separate unobserved edge, not this receipt's cause.

Durable build/tests: ~/.cache/codex/seek-audio-fix-20261014-5oJiex. Reuses isolated
~/.cache/codex/umbrafox-beta-20261012-nYSBPOWS/source+obj; preserve existing3
build repairs. Native diagnostic packages never installed. Normal candidate
BuildID20261014043800: initial binaries-only retained oldBuildID and package
validator rejected it, preserved package-rejected-stale-buildid. Full incremental
build and native regeneration corrected it. Normal self-contained47file package
now verified, manifest e097f7f7c0d8ff39146f173475731282c1e4574f1e3835e66e19861042d47d05.
Archive398f90ee...b8d in exports/umbrafox-seek-audio-20261014. Same-build UmbraLink
OFF/ON parity+native-root/build/pref receipts PASS, clean owned exits.
Installed ~/Programs/umbrafox-nightly, exact47files+.purgecaches, versionexit0,
PID2606827absent. Backupumbrafox-nightly.before-seek-audio-20261014-043800.
Installer4testsPASS; active target refused. Launcher36b8df60... unchanged and
stillprefers dated installs; ordinary restart does NOT select this beta.
Do not change daily selection without verified existing profile mapping.

Verified package exports/umbrafox-seek-audio-20261014, pinned beta12 baseline
then candidate/loggingON then candidate/loggingOFF, same laptop130sUIseek workload
(sequence now complete, no retries).
New89file harness on laptop ~/.cache/codex/seek-audio-candidate-harness-Rnu5Rx,
manifest54718252...b13f1, package pairseek-audio-package-pair-20261014-PlXFgB.
BaselineHzI4G9 completed:27/1201 before,402/2674,583/2699,427/2502 recovery;
actual stop/restart/rebase repeated cursor mismatch. Candidate-logfSoCso passed
10/2677,9/2700,5/2499; logged stoppedstream destroyed/recreated, noRebaseLive.
Candidate-offXHPfNx passed8/2677,5/2700,5/2498. Sixrecoverywindows below1% gatePASS.
Each37samples/14recordedPIDsabsent/cleanSIGTERM/0logdrops.05:10:36UTC89inputs
unchanged/no matching browser/compiler; allcommands terminal. Keep
all prior failed/successful captures. Docs rendered but scoped Sphinx fails82
global missing-toctree warnings; no AudioStream/AudioSinkWrapper page warning.
Report bot-docs/reports/performance/2026-10-14-seek-audio-reuse.md; fixed reproduced
case, not allYouTube/network/graphics issues. Main test differs compiledGREEN
only comment/formatting, exactreconciliation recorded; productionhashesmatch.
Candidateevidence59files2950599bytes sealed/verified; SHA256SUMS
f00401af476262f1eeadd8ef9da4e86155d3684c3948949da23ea6da36a9fcb5.

Prior ABBA A/B/C completed (recreate consistently low drops), fourth A stopped
on unstable artifact scan, not performance evidence. Narrow logging reuse run
then reproduced6.43/5.19/5.24% drops with the cursor mismatch above. No profiler.

## October 13: Short Capture Retains Seek And Clock Plateaus

Latest report bot-docs/reports/performance/2026-10-13-seek-transition.md;
plan bot-docs/plans/seek-transition.md complete. Evidence namespace
artifacts/umbralink-control/seek-transition/ sealed via SHA256SUMS/seal.json.
Seal113files11861284B manifest8796fb596237895bb86ececd4d1c0a480ff9dd76522a3ea21a4809437de55fc7.
No engine fix/build/default change or desktop/Pi/personalprofile action.

One quiet-laptop OFF+ON using old Build20261006175655 (notbeta). All4 private
anchors survive; origin36513.455811ms, parent3476678/content3476840,context11,
doc10737418243. Firstsecondafterprivateafter-seek:61/103clockintervalsflat,
11advances42.666-42.667ms. Jitter absmedian8.57/P9533.90ms;24drop events31frames
allqueuedbeforepreviouscomposition,23priorunchanged. Renderer derivedmedian0.894ms,
P951.473/max2.206. Later clockplateaus5/406 then0/381. No source/backend/query
latency proof;42.667ms consistentwith2048frames@48kHz is notbackendidentification.
Wholecapture36drop events46frames;35strictjoins(34queued,1notqueued),1unknown
2frameeventdueIDgap3. Do notgeneralize priorallqueuedresult. Preseekbaseline6ms.

OFF postseekdrops8.97/6.37/7.56%;ON24.51/32.27/28.06%, laterprofilerinactive.
Observer/export effects andvariabilityunresolved. No claimedfixorcausalpenalty.
ONuntimestampedVideoBridgeParentAbnormalShutdownwarningpreserved/unattributed.
Both cleanSIGTERM14recordedPIDsabsent,37resources,0logdrops.74runtimeinputshashes
unchanged21:42:35UTC/no matchingbrowser/compiler. No active tool sessions.
130strict testsPASS;14manualfilelintPASS;savedreviews+analysisexactreplayPASS.
CLIload/stoptextprefixfailurepreserved;secondofflineexport/cleanupsuccess,
PID1813271+1813282/socketabsent. Rawgzip5927039B SHA
cb66d81a1895c8f68aac7e699b75eef530d8fdc5a31b51a82ed08862b6d3bce1.

Next: separately scoped native internal observation of existing selectedclock
branch/pairedsystemtime/querybeginend/seekhold+callbackstate, withstableidentity
andnoextraGetPositioncalls. No repeatofsamecapture, publicsurfacechange, guessed
clockbias or synchronization removal. Priorsealedseek-markers evidenceunchanged.

## October 13: Seek Drops Localized To Frame Timing/Selection

Completed bounded laptop OFF/marker-ON wave with one deliberate ON recovery for
our gzip-envelope adapter bug; old failure preserved. No Gecko fix/build/default
change, desktop/Pi action or personal profile access. Build20261006175655, NOTbeta.
OFF recovery drops1.53/.33/1.88%; correctedON5.30/9.86/7.89%. Profiler cost and
run variability unresolved. Profile retained onlylate83-86s, notseektransition.

448 explicit dropped frames were queued before the preceding composition under
count/contiguous-ID validation;439 previous compositions repeatedoldframe.
6091 same-frame timestamp revisions absP9511.42ms/max18.2ms. Renderer CLI-derived
Composite median1.110ms/P991.907ms/max2.670ms. Strong clock-mapping/selection lead,
NOT causal audio-backend/GPU proof. Native VideoSink recomputes targettimestamp
from paired system/media clocks; AudioSinkWrapper can use audio/system/seekhold.
Package-source hashes verified, runtime branch/querylatency still unobserved.

Report bot-docs/reports/performance/2026-10-13-seek-marker-localization.md;
plan bot-docs/plans/seek-marker-localization.md. New ignored evidence
artifacts/umbralink-control/seek-markers/ sealed134files121149058B; manifest
aada49b5de31f470006fd44f404c00cb243bdca5b7239a56698e5574e307ffe8.
ProfileSHA3ad5cb83c6ec8e530e415a6b8e2c3890b12545a84c3519b017b9d67d9eadf6fc.
109strict tests PASS/scopedlintPASS. Three runs cleanSIGTERM/14PIDsabsent each;
two CLI+samply pairs stopped/absent. Final laptop18:34:34UTC postflight all71
files/harness unchanged and no matchingbrowser/compiler. No active tool sessions.

Next: short bounded transition capture resolving clocksource/pairedsystemtime/
querylatency/frameidentity; existing observations first, private marker only if
needed. Retain OFFcontrol, no bias/fence/threading workaround without causality.
Full details/failures/commands/coverage limitations in report. Prior evidence intact.

## October 12: Audio-on Seek Reproduces Sustained Drops

Completed authorized quiet-laptop comparison, desktop untouched. New namespace
artifacts/umbralink-control/audio-on-seek/; report
bot-docs/reports/performance/2026-10-12-audio-on-seek.md and completed plan
bot-docs/plans/audio-on-seek.md. NO native/product/default change or new fix.

Existing laptop Build20261006175655 (NOT October12 beta), AV1 1080p60 public
aqz-KE-bpKQ, normal menu/private iHD, X11 Intel. Four native audio endpoint reads
only, no native audio/decoder read during timed interval. Advancing audio sink,
volume0.05/unmuted; original state restored. Actual UI seek22.77s->45s and
130007ms after seeked. Control48/9000 totaldrops; seek791/9078. Recovery windows
control0.22/0.26/0.38%, seek10.42/10.49/9.04%. Final native drops control48
compositor/0decoded/0sink; seek845compositor/0decoded/1sink. Different observation
boundaries explain845vs791. One pair is not causal/repeatability proof; no visual
black flash or complete recovery established. ffvpx label is not software proof;
hardware flag cached. Frame-choice/timestamp/delivery versus render waits remains
the next distinction. Source proof pins7 files to package base8924318+patchd1bf3bdf.

First control dGBpso stopped before playback at artifact-scan ENOENT after3tries;
evidence retained, clean2recordedPIDsabsent. Exactly one startup replacement
ExSqOr completed; seekzWKDpm completed. Successful runs37samples/14recordedPIDs
absent each, cleanSIGTERM0logdrops, 240/225/15s+256MiB limits unchanged.
Remote harness /home/wyatt/.cache/codex/audio-seek-harness-PbcPcg; postflight
2026-10-13T05:42:00UTC all67runtimeinputs unchanged/no matching browser/compiler.
201 strict tests PASS; authored helpers/offline/tests lintPASS. All sessions ended.
No profiler/build/Pi/desktop disruption/staging/commit; old evidence untouched.

Next wave needs an explicit bounded observer-sensitivity/localization contract;
existing source markers cover ImageComposite timestamp jitter/frame selection.
Do not automatically repeat until rough playback appears, change clock bias, or
infer costlyGPU work from the compositor counter. Owner's exact audio/stream/seek
pattern still unanswered. Beta installation/launcher caveats below still apply.

## October 12: Opt-in Performance Beta Built And Installed Separately

Build20261012202039 /160.0a1 prepared from d43214d67041 plus direct Services.h
include and test ContentParentId compatibility fixes. Self-contained experimental
archive exports/umbrafox-beta-20261012/umbrafox-beta-20261012202039-linux-x86_64.tar.xz,
SHA75d03f82d3282c64eafbe3312087bbf2284613ef0aad3608892774ff82081e92.
Exact two-pref overlay enables DMABuf drawImage + single-image opacity; normal
defaults remain false. Optimized native build, probes compiled out, profiler off.
Installed ~/Programs/umbrafox-nightly, .purgecaches and all47payload files verified;
version command PASS. Prior nightly retained as nightly.before-beta-20261012-202039.
Usual launcher still prioritizes active dated October1 install. NO owner-browser
restart/profile/default-mapping/taskbar/launcher change. Do not suggest a normal
restart selects beta; switching needs current-profile mapping verification.

Tooling467PASS on Node24; archive5PASS; installer4PASS; isolated UmbraLink OFF/ON
parity/startup/preferences/native roots and clean owned cleanup PASS. Native GPU
86cases:79PASS/7FAIL/0skip. All63non-prescale regressions pass on NVIDIA RTX2060;
7 known prescale characterization failures remain retained, no tolerance changes.
Current canvas fallback no longer uses that sized CPU helper. Cache fixture
separately repaired explicit small target Init and actual RGBA/BGRA input format;
12cache cases PASS, exactpixels/loss/ownership assertions unchanged in intent.
New test-only delta is not silently folded into sealed normal-package patch.
Prior smoothness failures persist; no new YouTube/performance/universal parity claim.
Report bot-docs/reports/performance/2026-10-12-opt-in-beta.md; build/evidence root
/home/wyatt/.cache/codex/umbrafox-beta-20261012-nYSBPOWS/. Commands terminal.
Unrelated old untracked upstream files remain untouched. Supersedes the historical
in-progress note below; see git log for final own-file publication.

## October 12: Historical Beta Build Checkpoint (Superseded)

Wyatt explicitly requested enabling the experimental GPU video-to-canvas path
and preparing a beta with our optimizations enabled. Package-only overlay in
tools/umbrafox/beta/ enables DMABuf drawImage and single-image opacity; normal
source defaults remain false. Two focused tests pass; scoped ESLint/Prettier pass.
No profiling/logging, sandbox, user-agent, hardware-force or update-channel
override is part of this opt-in. Prior smoothness failures remain unresolved.

Build started in isolated detached worktree at d43214d67041:
/home/wyatt/.cache/codex/umbrafox-beta-20261012-nYSBPOWS/source/.
Object directory is its sibling obj; source/mozconfig uses sccache and explicitly
disables umbra-perf-probes. Command: CARGO_BUILD_JOBS=2 nice -n10 timeout7200s
./mach build -j2, with output in sibling build.log. First build hit its 7200s
bound (exit124), with no compiler error; exact workspace compiler scan empty.
Incremental continuation is active with the same command under timeout3600s,
log build-continued.log, tool session79355. Optimized Rust compiled successfully;
native C++/link work remains. Config is Firefox UA/160.0a1/optimized/probes off.
No completed beta package/install/runtime result yet. Scratch package_beta.py
and package_spec.py have5 passing archive-validation tests; native-contract
checks3 PASS. run-native.mjs and beta-parity.mjs are prepared, NOT executed.
Main checkout has older untracked files; leave them untouched. Build isolation
avoids consuming them. Current desktop browser/profile/launcher stay untouched.
Asked whether the usual launcher should select the beta or it should stay
separate; response pending. Verify profile mapping before any launcher switch.
Finish native build, package, overlay/hash, isolated tests and safe installation;
do not describe this in-progress note as completion or stop at a running build.

## October 12: Upstream Source Integration

Owner requested commit/push of existing work, then upstream merge before any
more optimization. Original work is committed and pushed as f16351a82412;
local recovery branch sync-before-upstream-20261012 retains that revision.
Integrated upstream/main 1a097ed8d31f6b307a5d0ebc34a82ceaf7f3727b, 4,399 incoming
commits. Resolved 21 conflicts, including the tab.js -> tab.mjs move, canvas
draw-target/content ownership, DMABuf BufferSurface changes, and both the fork
opacity setting and upstream YUV overlay setting. Experimental defaults stay OFF.

Final combined-tree tooling suite: 465 PASS. Additional probe-contract 14 PASS,
sampling-parser 36 PASS, isolated Rust probe OFF 3 / ON 22 PASS. The import-cache
fixture now covers 48 cases, including cross-content and null-target admission.
Scoped ESLint: zero errors; firefox.js is intentionally ignored by its config.
Mach's new lint-environment setup timed out, so installed ESLint was used.
No complete Gecko/native build, real-GPU tests, or runtime parity run performed.
This is source integration, not a newly built or installed prototype.

Report: bot-docs/reports/2026-10-12-upstream-sync.md. Evidence/backups:
/home/wyatt/.cache/codex/umbrafox-upstream-sync-20261012-ssNJPxDz/.
Generated browser packages/extractions remain on disk but are excluded from Git;
source snapshots, manifests and reports are preserved. Check git log/status for
the merge commit and origin publication. No installed browser/profile changed.
Next optimization contract remains bot-docs/plans/audio-on-seek.md; do not mistake
this merge or old muted tests for reproduction of the audio-on seek symptom.

## October 12: Default Profile Migration

Owner closed browser and requested normal default selection plus profile copy.
Completed: ~/Programs/umbrafox no longer injects -profile; existing .desktop
already had none. HTTP/HTTPS/HTML/XHTML and KDE default now use umbrafox.desktop.
Copied kvm20oct.default-default-1 to current install default
cjmrhtcu.default-default-2 using rsync -aHAX via staging, excluding stale locks.
Full checksum/metadata verification and seven critical SHA checks pass. Original
profile preserved; previous destination/config backups and migration receipt:
/home/wyatt/.cache/codex/umbrafox-default-profile-20261012-a8aqZ5ON/.
profiles.ini/installs.ini unchanged. Launcher mock tests, syntax, desktop entry,
and OS default queries pass. Browser stayed closed; reopening/link routing not
yet runtime-tested. Later installs need their per-install default mapping checked.
Performance work below unchanged; no new performance run/build performed.

Snapshot: October 7, 2026 Phoenix / October 8, 2026 UTC. Written immediately at
Wyatt's request, after a context reload. This is a factual handoff, not a claim
that the investigation or active performance goal is complete.

## Latest: Audio-on Path Admitted

Updated2026-10-08T04:10UTC. Phase2 private bridge/capture integration and ONE
phase3 isolated laptop run completed; all earlier phase1 and muted evidence
unchanged. Report bot-docs/reports/performance/2026-10-07-audio-clock-admission.md;
next contract bot-docs/plans/audio-on-seek.md. That next long-seek adapter is NOT
implemented yet; do not rerun the short admission or repeat old muted ABBA.

Actual run04:05:10..04:05:25UTC, root
/home/wyatt/.cache/codex/laptop-audio-admission-audio-20261007-AMoTqL.
Fresh owned profile/app-data/local-data/temp/private installation. Same fixed
public video,1080p, no seek, profiler OFF. Same element/document10737418243,
browser2303940/content2304110. Low volume0.05/unmuted; native sink48000Hz,
written45056->92160, lastGoodPosition757083->1770916us. Query durations
1.686926/1.238523ms, gap1008.973105ms. Paused/unmuted/volume1 restored.
Only progressing observed sink: clock enum/audible output remain unobserved.
GetClock query can affect handoff; no zero-overhead, reproduction or fix claim.

Decoder ffvpx name is compile-time family, NOT a software-only label. Frozen
six-file source trace explains compatible reported hardware=true: remote init
cache then MediaFormatReader output cache. Initial shutdown label can coexist
with last cached flag. Private iHD mapping verified, not continuous/per-frame
backend proof. New decoder-source-proof.json; no product/native change.

44 prelaunch tests, plus2 saved-data review tests/20 corrupt cases;46PASS.
Actual RED for secondary write masking resource abort fixed; first scaffold
had a test syntax error, explicitly not behavioral evidence. Exact eight-RPC
capture ledger, serialized private child, timeout/late-reject/restoration tests.
Runtime uses existing120/105/15s envelope,256MiB cap; no build after cleanup.
5resources+baseline capsPASS; peakRSS2428342272B/artifacts80546623B sampled.
CleanSIGTERM,14recordedPIDs absent,324Blog/0drops. No browser/test/SSH remains.

New laptop harness /home/wyatt/.cache/codex/audio-clock-harness-5CWvps;
59inputs55syntax185edges,51200B delta, manifest
7f63945415ad75949f3e2ec1d577b834b371673c72b829828e3c60dc7715fd17.
Raw46file/160341B export SHA
b1edd01a7866489cdb2652201e7c0c292b5ba905a0944a4a6fa02a3b9ccca9eb.
Named docslint0errors/0warnings using prebuilt mozcheck. Lint recreated only a
32KiB obj/.mozbuild/logs tree; finalabsence gate caught it, log preserved under
new namespace/lint-profile.json, exactfile/emptyparents removed. No nativebuild.
04:10postflight59filesunchanged/no namedbrowser-buildprocess; systemiHDhash
a7cecd28...unchanged/nonfree notinstalled. Desktop/Pi/defaults/index untouched.
Phase1 plan/report remain frozen historical status; this section supersedes.
Finalseal04:16:23UTC covers99files, evidence.json SHA
35ae0c796b1fd7dc8ba6c995dfc702916d66ecadad450462a1dc5f77b3adb5e5.
22phase1/102oldsealed/59runtimefiles verified; staged and tracked unstaged
diffs match cleanup snapshot. Do not edit this completed namespace/report.

## Build Cleanup: October 7 Phoenix / October 8 UTC

Wyatt requested a make-clean equivalent to reclaim disk space. Removed only
the generated obj-x86_64-pc-linux-gnu and obj-aarch64-linux-gnu directories.
Both were real object directories, contained no Git-tracked files and had no
observed active process cwd/executable or relevant browser mappings using them.
Direct removal was used to avoid mach --full also clearing its shared function
cache. No browser was closed, restarted, controlled or signaled.

Measured project usage:82,482,798,592 ->33,357,254,656 bytes
(76.8 ->31.1GiB), reclaiming49,125,543,936 bytes (45.8GiB).
Artifacts11,768,995,840 bytes, exports9,741,484,032 bytes and Git6,404,370,432
bytes were retained unchanged in size. Git status and both staged/unstaged
diffs compared byte-identical before/after removal, before this handoff note.
Cleanup logs/checks: /tmp/codex/umbrafox-clean-v246rfFG (temporary).

IMPORTANT: old references to obj-*/dist/bin, buildconfig.rs, config.status and
other generated native-build inputs are now historical, not usable files.
Next native build needs a full regeneration/build. Source mozconfig files,
installed/exported prototypes, source changes, saved evidence and profiles
were not removed. No investigation runtime was launched during cleanup.
The audio-path investigation below remains the latest engineering state.

## Earlier Engineering State: Audio Path Coverage Gap

Updated2026-10-08T01:38UTC. The source-only follow-up found a useful missing
test dimension: inspected startup and seek harnesses explicitly set
`video.muted = true`. The frozen deployed source can shut down AudioSink when
effective volume is zero and use system-clock playback. Audible playback has
additional audio-stream startup/handoff/seek-resume paths. This is a coverage
gap, NOT a cause or fix; old captures did not observe actual native clock source
or continuous mute. Owner was asked whether affected playback had sound on;
answer is pending at this snapshot. Do not repeat the prior muted ABBA.

New plan `bot-docs/plans/audio-clock-admission.md` and report
`bot-docs/reports/performance/2026-10-07-audio-clock-coverage.md`.
Namespace `artifacts/umbralink-control/audio-clock-admission/` is NOT runtime-ready.
Phase1 complete: audio.mjs allowlisted projection/paired admission/bounded
collector; test/audio-spec.mjs18PASS under strict unhandled handling;3JSformat
PASS. Source-proof.mjs/json pins12 files to base8924318 plus unchanged frozen
package patch d1bf3bdf, source manifest a9befff9;5 mute-setting fixtures hashed.
Source proof replay identical. Prior102 sealed files and53 runtime inputs
verified unchanged. Initial missing-module RED is scaffold-only;4 behavioral
deadline/admission REDs retained and fixed (last one is independent saved-pair
query-span validation). Final18PASS76ms, named docs lint0errors/0warnings.
Nothing launched on any browser.
Phase1 checkpoint: audio-clock-admission/phase1-checkpoint.json, SHA256
6523b66c7494c78090b1b45d3f20708fe1357ac1d9f4243fef414a71db638454.
It is a tooling snapshot, not runtime acceptance; preserve it when extending
phase2. Final docs recheck also passed with zero errors/warnings.

Important exact meanings: existing mozRequestDebugInfo guard is
HasDebuggerOrTabsPrivilege, not literally ChromeOnly. AudioSink's isStarted
dictionary field is unpopulated and must NOT be used as a positive requirement.
Default zero/false sink fields do not prove absence. Positive rate/written plus
advancing lastGoodPosition supports an observed progressing sink, NOT audible
output or continuous clock selection. ClockSource enum is unexported and stays
"unobserved". GetDebugInfo invokes GetClock and can itself affect handoff/queue
state; do not claim a passive/zero-overhead probe. Native queries may still run
after timeout; late rejections are observed, not native cancellation.

NEXT phase2: compose private frame bridge and existing owned capture runtime,
with exact process/context/document and persistent element identity across the
pair, deadlines/evidence/cleanup failure tests, source/import closure pins.
Then one prospective low nonzero element-volume laptop path-admission run,
not an effect comparison. No host audio settings or backend changes. No driver
exists yet; do not launch the collector as though it were a complete harness.
Later matched seek/control design depends on that admission. Owner desktop,
Pi, native/product/public surfaces, system driver and Git index remain untouched.
All source/test commands completed; no process/session needs polling.

## Previous State: Fixed Sequence Completed

Updated after the immediate dump: all four prescribed laptop runs completed,
were exported, independently reviewed, and their exact recorded PIDs were absent.
No browser, SSH, profiler, or test command remains running from this wave.
**Do not repeat this ABBA sequence just to obtain a rough sampled run.**

Final observations, all 1200 frames over 20 seconds:

| Run | Dropped | Thread samples | Runtime root suffix |
| --- | --- | --- | --- |
| control-1 | 24 | None | control-20261007-GV0yFB |
| sampled-1 | 0 | 102, no missed slots | sampled-20261007-S3OFOv |
| sampled-2 | 0 | 102, no missed slots | sampled-20261007-uYfR9P |
| control-2 | 0 | None | control-20261007-HNqQm0 |

The suffixes extend `/home/wyatt/.cache/codex/laptop-startup-thread-sampling-`.
All four had nine resource samples, zero log drops, clean SIGTERM cleanup,
14 recorded PIDs absent, hardware AV1 receipts, and matching binary/INI/fixture
hashes. No system driver change; nonfree remains not installed system-wide.
Final 53-input/quiet postflight `2026-10-08T01:17:51.247Z`; system metadata
`01:18:09.142Z`. Both sampled captures had no pending sampler read at stop.

The first control's 24 drops are native compositor-category drops: 23 were
observed between the 5003/6002 ms counter samples, one between 16013/17001 ms.
These are counter-observation brackets, not actual drop-time measurements.
Both sampled runs and final control were smooth by these counters. No causal
observer benefit and no stall location established. Owner's prolonged seeking
stutter/black flash remains unreproduced.

In the two smooth sampled runs, 99 certainly interior intervals per thread
cover about 19.8 seconds, excluding two boundary intervals. CPU milliseconds:
parent main 1100/1060; Renderer 1400/1560; Compositor 680/720; selected content
main 1430/1610. Clock uncertainty 23.704/18.540 ms. These are quantized CPU
measurements, not waits, per-frame attribution, or the cost of a rough period.

New offline `analysis.mjs`, `recompute.mjs`, and `test/analysis-spec.mjs` preserve
strict clock boundary exclusion, identity/counter validation, and replay.
`comparison.json` is authoritative; `comparison-replay.log` confirms deep
equality. `commands.json.runs` now contains all four roots and file names.
Final combined gate **53 PASS**, 0 fail, 0.635 s; 13 manual JS files pass
Prettier. `completed-input-verification.json` verifies all 96 prior sealed
files and all 53 current runtime inputs unchanged. The earlier 38/41-test
receipts are preserved history, not the final count.

Report: `bot-docs/reports/performance/2026-10-07-startup-thread-sampling.md`.
The plan and DETAILS top have been reconciled to this completed state.
Named documentation lint passed with zero errors/warnings; scoped diff check
passed. All validation commands finished. The final metadata seal is
`artifacts/umbralink-control/startup-thread-sampling/evidence.json`.
Sealed at `2026-10-08T01:22:58Z`: 102 files, manifest SHA256
`777f02e7339996368dba5af419285a9b2076b3cccabd6117d5d49d06062b6b6b`.
Do not edit that namespace, report, or plan after this seal. MEMORY and DETAILS
are mutable continuity documents and deliberately excluded from the seal.
Final seal/verification records in the namespace govern completion evidence.
No product optimization or deployment was made by this wave.

Next useful work: use the source-backed drop-producer map and saved startup
evidence to distinguish compositor scheduling/queue transitions from CPU
execution. Do not infer a GPU wait or network stall from these results. A new
runtime experiment needs a changed, falsifiable contract, not another identical
capture. Matching the owner's affected stream and single-seek versus repeated
scrub behavior remains an independent missing workload detail.

The broad owner objective remains unfinished. On this resume `get_goal` returned
null; the objective is conversation context, not a currently active tool goal.
Do not create a replacement tool goal unless explicitly requested.

## Earlier Resume Point (Superseded)

The current experiment is a fixed laptop control / sampled / sampled / control
sequence. The first two browser runs have exited successfully. Only the first
has been independently exported and reviewed. **Do not relaunch either run.**

1. Export and review the completed sampled-1 run identified below.
2. If its actual evidence passes, verify uploaded inputs and laptop quietness,
   then run sampled-2, export, and review it.
3. If that passes, verify inputs/quietness again, then run control-2, export,
   and review it.
4. Verify postflight input hashes, exact owned-process cleanup, and unchanged
   system driver. Analyze saved evidence with clock uncertainty respected.
5. Update the plan, report, this file, and `.codex/DETAILS.md`; seal evidence
   only after verification. Keep failures and limitations.

Stop the prospective sequence on the first actual runtime/review failure.
Do not make outcome-driven replacement captures. A preserved metadata-export
argument correction is not a browser rerun.

This snapshot supersedes the stale top section of `.codex/DETAILS.md` and the
progress section of `bot-docs/plans/startup-thread-sampling.md`: those still say
38 tests, no runtime driver, and no browser launch. Drivers now exist, 41 tests
passed, and two runs have completed. Reconcile those documents later.

## Owner Intent and Safety Boundaries

- Active broad goal: "squeeze every last ounce of perdormance out of the
  rendering engine, the layout engine, css, javascript. Get creative. Lean
  more on hardware accelleration when possible." Do not silently narrow it or
  mark it complete because this experiment ends.
- Wyatt's latest symptom: after **seeking with the video progress bar**
  (rewind/fast-forward, not searching YouTube), playback sometimes stutters
  for a minute or two, briefly flashes black, then becomes smooth. That exact
  sequence has NOT been reproduced. Short startup drops are a separate clue.
- `wyatt-laptop` is authorized for isolated tests and is mainly a bot machine.
- `wyatt-desktop` is Wyatt's actively used daily browser. No closing,
  restarting, navigating, changing settings, or otherwise disrupting it
  without heads-up and consent for the action. This wave does not use it.
- No Pi work this wave. Another owner controls physical Pi lifecycle.
- No system driver installation without fresh explicit consent. The existing
  private child-only iHD copy is allowed; it is not a system installation.
- No agents, staging, commits, reset, revert, product/native/default changes,
  or public browser API changes in the current wave. Preserve the large dirty
  and staged tree. Dirty current source is NOT deployed-source authority.
- Never SIGKILL. Keep owned-process cleanup identity-bound and bounded.
- No personal profiles, shared crash queues, or unrelated private data.
- No profiler daemon or raw-profile parsing this wave.
- Standing mandatory rule: Umbrafox must look like the corresponding Firefox
  to websites and servers. No detectable default JS/DOM/WebIDL/network/media/
  storage/timing surfaces. Private owner-local diagnostics are not permission
  to alter public interfaces. Read the modification rulebook before changes.

## Bootstrap and Local Workflow

Repository: `/home/wyatt/Projects/umbrafox-workspace/umbrafox`.
Read `~/.bot-common/startup.md` first after every context reset, then its required
quirks/rules and AGIS runtime. Project `.codex/quirks.md` and `.codex/rules.md`
were absent. `AGENTS.md` contains the mandatory bootstrap rule. Finish bootstrap
with `Fired up!` and continue, not stop.

Important instructions: `umbrafox-conversion-guide/02-mandatory-modification-rules.md`.
Skills used: umbrafox-link, firefox-desktop-frontend, documentation, mozlint,
planning-cap. Read relevant skills again when needed. Use Searchfox for upstream
discovery; local searches must be narrowly scoped to known local changes.
Installed searchfox-cli 0.18 advertised 0.20.5; no update was installed.

Use `apply_patch` for manual edits, bounded commands, structured JSON parsers,
and unfiltered log files for slow commands. Do not overwrite sealed evidence.
Reports belong under `bot-docs/reports/`, plans under `bot-docs/plans/`, current
tooling evidence under repository `artifacts/`, large owned runs under home cache.
Do not expose control credentials in reports. No active executable tool session
was known at this snapshot; sampled-1's session 83214 returned terminal exit 0.

## Current Experiment and Files

Unsealed namespace: `artifacts/umbralink-control/startup-thread-sampling/`.
Plan: `bot-docs/plans/startup-thread-sampling.md`.

Manual modules:

- `sampling.mjs`: parsing, identity admission, deltas, clock bounds, scheduler.
- `proc.mjs`: bounded Linux process/task reads.
- `capture.mjs`: adapter around the frozen prepared/startup capture.
- `review.mjs`: independent saved-data validation.
- `generate.mjs`: narrowly generates runtime adapters.
- Mirrored tests: `test/sampling-spec.mjs`, `proc-spec.mjs`, `capture-spec.mjs`,
  `integration-spec.mjs`, `review-spec.mjs`.

Generated files: `runtime.generated.mjs`, `driver.generated.mjs`,
`review-base.generated.mjs`, and `generation.json`. Exact inverse/source-region
proofs tie these to sealed precondition code. Do not casually format/edit them.

Other important files: `commands.json`, `runtime-inputs.json`, `bundle.json`,
`runtime.tar`, `host-metadata.json`, `clock-source.json`, `preflight.json`,
`between-1.json`, test/format/RED logs, and per-run stdout/export/review files.
`verification.json` is the previous 38-test preparation receipt, not a final
receipt for the current 41-test/runtime state.

`commands.json` stores the fixed schedule, exact launch commands, upload,
source-proof, export, between-run checks, and limits. Its `runs` array was still
empty on disk at interruption; persist observed A1/B1 state using structured
JSON. Do not depend on ephemeral tool-memory stores.

### Frozen Deployed Inputs

Laptops use baseline:
`/home/wyatt/.cache/codex/producer-fence-playback-harness-20261007-t27Mxk/baseline`.
Build **20261006175655**, export `exports/umbrafox-descriptor-borrow-20261006/`.
Base revision `892431809a4caadb5c73b2c03ad9bdb124c3e21e`.
Source patch SHA256:
`d1bf3bdfe9f7d36c82181db0b4487592d5b8857b070e43c1b2ee6aaea9cd1677`.
Source-final receipt SHA256:
`a9befff9082463b5c643889c0e755e5f88a09d674d6aff00b3ad05d89cf1935c`.

Private iHD: 36,102,104 bytes, mode 0600,
SHA `7e14725d1af6a016fda32492cd7daaa33f1e744a36c0b8907ef3bb3a98e6798c`,
Ubuntu `24.1.0+ds1-1` nonfree. Child-only `LIBVA_DRIVERS_PATH`.
System free iHD remains `24.1.0+dfsg1-1ubuntu0.2`, 13,589,472 bytes,
SHA `a7cecd28f70fb692a5d65c2de8c491d953bc834dc1c98c4bd93a929ffcc976ee`.
Different package versions confound direct driver claims. Intel RPL-P 0xa7a0.
No LD, MOZ_LOG, sandbox, codec-forcing, or product-pref changes this wave.

### Uploaded Runtime

Laptop root:
`/home/wyatt/.cache/codex/startup-thread-sampling-harness-20261007-WMprMv`.
Identity: dev 64512, inode 37370534, uid 1000, mode 0700.
53 files, 49 syntax checks, 167 import edges, archive 81,879,040 bytes.
Archive SHA:
`1b860e9d96c441e39685bbc69d80ad2942506cfcdd1ba65d4372b0100553f732`.
Manifest SHA:
`f5a0ab5aae00ed3f13561d7aeef3146e655d2a0dea3d743d51804121a93a7b83`.
Exact members and every extracted file's hash/size/canonical regular-file status
were checked. Uploaded inputs are frozen for this wave.

Preflight at `2026-10-08T01:03:10.256Z`: MemAvailable 12,797,673,472 bytes,
disk 27,692,724,224 bytes, scoped browser/build busy list empty.
Between-1 at `01:06:31.788Z`: all 53 hashes and quiet check passed.
These are point-in-time observations, not continuous whole-host isolation.

### Fixed Launch Sequence

| Run | Mode | Nonce | State at snapshot |
| --- | --- | --- | --- |
| control-1 | control | oct7-thread-A1 | Runtime/export/review PASS |
| sampled-1 | sampled | oct7-thread-B1 | Runtime exit 0; export/review pending |
| sampled-2 | sampled | oct7-thread-B2 | Not launched |
| control-2 | control | oct7-thread-A2 | Not launched |

Exact launches are in `commands.json`. They use `ssh wyatt-laptop`, BatchMode,
ConnectTimeout 5, outer timeout 240, remote TERM timeout 210, the frozen harness
cwd, DISPLAY=:0, XDG_RUNTIME_DIR=/run/user/1000, generated driver, baseline,
mode, and nonce. Internally 120-second total / 105-second work / 15-second cleanup
budget; fresh private profile/app-data/local-app-data/temp/install; 256 MiB
sampled artifact cap. Same fixed 20-second 1080p public YouTube workload:
`https://www.youtube.com/watch?v=aqz-KE-bpKQ`.

### Control-1 Completed

Root: `/home/wyatt/.cache/codex/laptop-startup-thread-sampling-control-20261007-GV0yFB`.
UTC `01:04:52.563` through `01:05:25.522`.
Browser 2268710, content 2268876, RDD 2268839, controller 2268697.
Document 10737418243, scoped to content PID (not globally unique).
1200 total frames, 24 dropped; 21 samples, zero missed slots/media events.
9 resource samples, peak RSS 2,420,776,960 bytes, sampled artifacts 92,874,730
bytes. 334-byte log, zero log drops, clean SIGTERM/root absence/private install
checks, all 14 recorded PIDs absent. No thread series in control mode.
Host-minus-native clock offset interval:
`[2689.240835999999, 2711.6155229999968]` ms, width 22.374687 ms.
Native playback span 20,002.106087 ms.

`control-1-export.json` is empty and `control-1-export.stderr` preserves a
metadata export failure: root was passed in argv[1] but the program expects
argv[2]. Assertion failed before any read. Corrected invocation includes
`-- export ROOT`; no browser rerun occurred.
`control-1-export-v2.json` is the successful 53-file export, SHA
`31e62aff1d1f43a2ceb50df6af1177240d38cd0b7a32d47179c715ecaa4f95dd`.
`control-1-review.json` passed; review stderr empty.

### Sampled-1 Completed, Unreviewed

Root: `/home/wyatt/.cache/codex/laptop-startup-thread-sampling-sampled-20261007-S3OFOv`.
`sampled-1.stdout` reports this root and status `pass`.
`sampled-1.stderr` is empty; executable session 83214 exited 0.
No export/review existed at this snapshot. Do not invent counts, clock bounds,
or PIDs. Cleanup is runtime-reported until exact absence/export checks pass.

### Export and Review Procedure

Use `commands.json`'s exporter program, not a new broad filesystem scan:
remote `timeout 15 node --input-type=module -e PROGRAM -- export ROOT`.
Outer SSH timeout 25 seconds. The literal `export` occupies argv[1].
Allowed evidence is exact-root JSON/INI/browser.log, max 2 MiB/file and 16 MiB
total, including thread-sampling.json. It excludes profiles/raw profiles,
hashes each file, and checks recorded controller/browser/resource PIDs absent.

Review with a 10-second timeout:
`node artifacts/umbralink-control/startup-thread-sampling/review.mjs EXPORT.json`.
Save stdout/stderr. Before B2/A2 and after A2, use the stored between program:
20-second SSH wrapper / 12-second remote command, fixed uploaded root identity,
53 hashes, and the existing scoped quiet check. Do not broaden host inspection.

## What the Sampler Can Establish

Targets are parent main TID=PID, unique OS-name Renderer, unique Compositor,
and selected content main TID=PID. PID identity includes parent/group/session/
start stamp; TID start/name fixed. Process stamps verified before/after each
eight-file batch. CPU is from `/proc/PID/task/TID/stat`, not aggregate PID stat.
No stacks, addresses, wchan, command lines, or unrelated process payloads.

Fixed 200 ms cadence; single flight; at most 160 samples/32 seconds; 512 task
discovery entries; 16 KiB/read; 1 MiB series; 1000 ms read timeout. First failure
poisons sampler and aborts adapter: no restart or late publication. Already
started OS reads may remain pending; preserve `underlyingReadPending` rather
than claiming OS cancellation. Stop bounded to one second; partial samples
survive a stop failure. No per-sample RPCs, disk writes, public marks or globals.

Both arms use the unchanged capturePrepared/captureStartup composition with
preconditioned=false. Parent/selected-content profiler inactivity is checked
at boundaries only; other children are unknown. Fake real-composition ledger
is 10 RPCs/12 writes per arm. Sampling adds discovery/setup delay as well as
CPU reads; there is no matched-delay control, so isolate neither by assertion.

The existing playback RPC is bracketed by host performance.now. Native start/
end are from its exact content reply. Offset interval is
`[hostSent-nativeStart, hostReceived-nativeEnd]`; reject negative intervals or
width above 100 ms. No midpoint-as-exact-clock inference. Page counters update
asynchronously. CPU ticks quantify execution, not waits, GPU work, or scanout.

Host metadata: Node v24.18.0, kernel 7.0.0-38-generic, CLK_TCK=100,
sched_schedstats=0 at `00:38:25.156Z`. Nonzero schedstat text is not enabled
scheduler-statistics proof; wait statistics remain null. Driver checks exact
Node version and getconf before starting a browser.

`clock-source.json` pins native ChromeUtils::Now to TimeStamp::Now minus process
creation, Linux precise TimeStamp to CLOCK_MONOTONIC, and official Node v24.18.0
performance.now to uv_hrtime/process start with libuv precise CLOCK_MONOTONIC.
Native files match deployed base and are untouched by its patch. Official
Node/libuv URLs, hashes, and excerpts are retained. This is version-linked
source proof, not independent Node-binary attestation.

### Verification So Far

`runtime-tests.log`: **41 PASS**, zero failures, approximately 0.320 seconds,
strict unhandled rejection mode. Earlier `final-tests.log`: 38 PASS.
Coverage includes identities/PID reuse, ordering, counters, clocks, quotas,
abort, late I/O, all 10 RPC/12 write failure points in both arms, and actual
owned Node `/proc` task ticks. Tests are tooling proof, not runtime causality.
Three review tests were added after the 38-test receipt.

Preserved RED evidence includes late reply mutation after abort and sample loss
when stop threw; both corrected. Initial missing-module failures are scaffold
failures only. One cancellation test initially selected the wrong race winner,
and one timeout expectation had a wording mismatch; those are not product bugs.
Generated inverse proofs passed. Prior sealed 96 files and 48 earlier runtime
inputs were unchanged at preparation gate.

Still needed: final checks across all 10 manually authored JS files (exclude
generated inverse adapters), final documentation checks, all runtime reviews,
new analysis tests, replay, and final evidence seal. Use bounded named-file
Prettier and named docs lint, not broad autoformat of the dirty repository.

## Prior Evidence to Preserve

### Startup Variability Audit

Namespace `artifacts/umbralink-control/startup-variability/`.
Report `bot-docs/reports/performance/2026-10-07-startup-variability.md`.
Sealed `2026-10-08T00:34:08.370Z`, 18 files, evidence SHA
`0ea5e19a8be41687fe79f65a2c4d10ada4a2831311526fc4b6bdb1e034877481`.
8 focused / 22 combined tests passed.

Four previous graphics projections identical; settings geometry identical in
first three despite 25/2/0 drops. All 84 sampled media states readyState=4,
networkState=2, buffered ahead about 12 seconds or more, no media events.
No simple starvation evidence at observed points; not a network trace.
One run at 5 seconds: decoded305/presented300/painted285/drop0; at 6 seconds:
365/335/335/drop25. Differences are asynchronously updated counts, NOT physical
queue lengths, event time, or display delay.
Parent CPU 8723/8836/8596/8376 ms per 20 seconds includes renderer/compositor,
NOT parent-main-only CPU. No clock bridge existed to align old resource reads
with playback; that gap motivated the current sampler.

### Preparation-Only ABBA

Namespace `artifacts/umbralink-control/startup-precondition/` (frozen generated
sources may use the related startup-precondition paths; consult actual files).
Report and plan `2026-10-07-startup-precondition.md` / `startup-precondition.md`.
Sealed `00:19:09.657Z`, 78 files, SHA
`545505044431c0d3cb2f5cfc3d1853a0df03b777a970a5054f488dd7dc30c25d`.
116 combined tests passed. All four runtimes and exact cleanup checks passed.
A1 control 25 compositor drops; B1 inactive Start/Stop preparation 2; B2
preparation 0; A2 untouched control 1 sink drop, zero compositor drops.
Therefore profiler activation is NOT necessary for smoothness. No causal
preparation optimization, and no profiler initialization workaround justified.
Fresh processes do not reset host/site/warm state. No unchanged repeat loop.

### Seeking and Driver Tests

Reports: `2026-10-07-seek-recovery.md`, `2026-10-07-decoder-driver-seek.md`,
`2026-10-07-decoder-driver-backward.md` under performance reports.
Real progress-bar single forward/backward clicks, 1080p, at least 130 seconds
after seek. Software forward: 25 pre-seek drops plus 1 late; backward: 3 isolated.
Private hardware forward: 24 pre-seek; backward: 23 pre-seek plus 1 late.
No prolonged post-seek stutter/black-flash recovery reproduced.
Hardware RDD CPU was about 90.45/91.33 percent lower than old software N1,
but this is NOT a smoothness win, and driver versions differ. No system driver
install consent. Exact affected owner video/codec and single jump versus
repeated scrubbing remain useful missing workload details; prior ask unanswered.

### Profiler Observer Effect and Older History

Old unprofiled startup runs had 23..25 drops near 6 seconds. Two profiler-active
runs had zero drops but profile-copy cap failure, with cleanup pass: not full
performance passes. Later smooth untreated control weakens any causal claim
about profiler activation. Do not parse raw profiles ad hoc.
If future profile work is authorized, read profiler-analysis skill, use unique
owned CLI session with explicit `--symbol-server http://127.0.0.1:9`, preserve
PID/socket identity and stop in finally. No stop-all. CLI marker timestamps
are normalized while context.rootRange is raw; never mix these clocks.

Older September work is in `.codex/DETAILS.md` and
`~/.cache/codex/umbra-perf-20260927/`. It includes lifecycle tooling, isolated
app-data containment, marker clock fixes, private native directory proof, Pi
source/profiling studies, and request-fastpath design. Do not equate those old
reports or old source patches with today's deployed package.
Fresh profile alone previously failed to isolate shared crash-report queues;
all current launches force fresh private application-data and local-data roots.
An upload-disabled pref alone is not a no-network/deletion-ping guarantee.

The owner requested full UmbraLink remote control, parity tests, prototype
packaging/launcher integration, shutdown-crash investigation, correct taskbar
pin/profile selection, and broad performance work earlier. Many intervening
results are recorded locally rather than visible in the abbreviated chat.
Do not invent their completion status: consult DETAILS, exact reports, package
receipts and source/test evidence before describing fixes or deployment.

## Reporting Discipline and Next Useful Decision

Distinguish tooling tests, runtime acceptance, sample-level observations,
causal localization, actual optimization, and deployment. Do not call the
startup burst the owner's prolonged post-seek failure. No current rendering
fix has been established by this sampler work. The immediate deliverable is
a verified bounded comparison and thread/clock evidence, followed by the
smallest falsifiable next step. Broad optimization work remains active.
# Active October 14: Seek Audio Reuse

Latest owner requests continuing until seek stutter found/fixed. No native fix
yet. Daily desktop browser untouched. Isolated laptop four-cell ABBA attempt:
reuseA yrNkEJ pass (postseek20/2677,27/2700,6/2500); recreateB l8uMlS pass
(5/2674,5/2700,5/2503); recreateC d7XiOr pass (8/2675,7/2700,8/2501).
reuseD BPy8H5 failed artifact scan at40s, cleanSIGTERM14PIDsabsent; not a
performance result. Failed initial receipt-order setup UXlvI6 also preserved.
Artifacts umbralink-control/seek-reuse;136strict testsPASS. Runtime79files
Hb2Quz postflight04:19UTC unchanged/no browser/compiler. Plan
bot-docs/plans/seek-audio-reuse.md. No source/default changes.

ONE narrow follow-up now running: existing native AudioStream:4,timestamp log,
profilerOFF, same240s/256MiB/capture/cleanup boundaries. Remote83file harness
~/.cache/codex/seek-audio-log-harness-ya9LXY, manifest
bde7494cdfc53dae54edd30bae881f59b3249fb0828c6e20c6f68022038a94b4.
Run laptop-seek-audio-log-reuse-20261014-XkWE68, exec31707; initiated04:20UTC.
After TERMINAL export via new seek-audio-log/export.mjs then review-driver.mjs.
Do not launch another cell automatically.137strict tests/scopedlintPASS.
Goal: actual RebaseLive P/W/carry values, existing logs no extra raw query.

Observed earlier rough audio endpoints: writtenFrames/rate-lastGoodPosition
near0us vs smooth recreation143-180ms. Derived media gap, NOT rawcubeb proof.
Definite source concern: RebaseLive sets raw=0 on queryfailure and keeps stream;
docs incorrectly assume failedquery means dead. Official Pulse v17 stream.c
pa_stream_get_time has READY but NODATA paths. Runtime branch unproven.
Other leads: backend/history cursor mismatch, syncaudioIPC querylatency.
Avoid speculative clock smoothing or calling the issue fixed.

Reusable desktop build root ~/.cache/codex/umbrafox-beta-20261012-nYSBPOWS,
source worktree carries3 existing changes (UserlandMutation,2canvasgtests),
preserve them. Native test/package harness there available but graphics-only
validator/filter must be adapted before audio tests. No native edits this wave.
