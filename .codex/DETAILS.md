# Umbrafox Codex Details

## October 12 Upstream Integration

Owner authorized committing/pushing all work, then merging upstream before
returning to optimization. Existing work pushed to origin/main as f16351a82412;
recovery ref sync-before-upstream-20261012 points there. Upstream target is
1a097ed8d31f6b307a5d0ebc34a82ceaf7f3727b (4,399 incoming commits). All 21 merge
conflicts resolved; combined-tree suite 465 PASS. Source-region probe checks:
14 contract, 36 parser, Rust OFF 3 / ON 22 PASS. Native extracted import-cache
fixture 48 cases PASS, including new content-owner isolation and invalid targets.
Seven resolved/test JS files pass direct installed ESLint; firefox.js is ignored
by repository configuration. Registered mach lint timed out preparing its updated
lint environment, not while reporting source errors. All 36 prepared resolution
hashes stayed stable through tests. Scoped diff whitespace clean; 133 paths warned
by full merge whitespace check are exact upstream blobs, left untouched.

Integration adapts tab customization to upstream tab.mjs, DrawTargetWebgl content
ownership and BufferSurface APIs; retains upstream YUV overlay setting alongside
fork opacity control. Video-surface cache now requires matching content owner;
null targets never publish entries. Updated native GL tests are NOT compiled/run.
Experimental defaults remain OFF. No full Gecko build/runtime parity/install,
browser control/restart, or profile changes. October 7 object cleanup still means
the next native build must regenerate its inputs; do not silently treat old obj
paths as usable. Generated export browser packages stay untracked/on disk.

Report: bot-docs/reports/2026-10-12-upstream-sync.md. Durable scratch/backups/logs:
/home/wyatt/.cache/codex/umbrafox-upstream-sync-20261012-ssNJPxDz/.
Git partial-clone blobs were hydrated in bounded batches before the actual merge.
Timed-out pre-merge attempts were restored only at verified affected paths before
retry; final merge and tests used the actual combined worktree. No force-push or
upstream push. Inspect git log/status for final merge/publication receipt.
Next performance work remains the separate audio-on-seek plan, not yet executed.

## October 12 Default Profile Migration Completed

Owner closed the browser and authorized removing forced profile selection and
rsyncing the working profile into the installation default. Zero installed
Umbrafox processes verified before/during/after migration; no browser launched.
Confirmed exact legacy CityHash installation mapping: dated 20261001 install
197AAA31A9321E77 -> cjmrhtcu.default-default-2; nightly 301410E7660F9C94 ->
kvm20oct.default-default-1. System Abseil CityHash differs and was NOT used as
authority; the source-matching older algorithm matched both existing INI keys.
Source kvm20oct.default-default-1 preserved. rsync -aHAX copied it through a
fresh sibling staging directory into cjmrhtcu.default-default-2, excluding only
top-level lock/.parentlock/parent.lock. POSIX locks held on existing lock files;
browser-absence and directory identity checked around promotion. Checksum and
metadata dry-runs before/after promotion empty. Seven critical files additionally
SHA256-matched, including places/cookies/key4/logins/prefs/sessionstore.
Old destination and config/launcher backups plus scripts/receipt are in
/home/wyatt/.cache/codex/umbrafox-default-profile-20261012-a8aqZ5ON/.
Old destination is default-profile-before; original source remains in place.
~/Programs/umbrafox now execs selected binary with caller arguments only, no
-profile or profile existence guard. Existing umbrafox.desktop already had no
profile argument and was preserved. Fake-executable tests fail before and pass
after; no-argument/URL/space-containing URL forwarding and latest install tested.
bash -n and desktop-file-validate passed. xdg-settings and xdg-mime now select
umbrafox.desktop for KDE default, HTTP/HTTPS, HTML/XHTML and HTML extension MIME
types. GIO HTTPS agrees. profiles.ini and installs.ini byte-identical to backup.
No end-to-end browser launch performed; owner should reopen and test external
link. New installation directories still have distinct Firefox profile mapping;
future deployments must explicitly verify default selection before dogfooding.
This supersedes the earlier permission-pending and pinned-profile notes below.

## October 12 External-Link Profile Mismatch

Owner reports external links open an empty Umbrafox session. Read-only inspection
on wyatt-desktop confirms HTTP/HTTPS defaults (xdg-mime and HTTPS gio) resolve to
userapp-Umbrafox-X43KW3.desktop in ~/.local/share/applications/. Its Exec launches
/home/wyatt/Programs/umbrafox-20261001-103920-158.0a1/umbrafox %u directly, without
the explicit profile selection in ~/Programs/umbrafox. Taskbar still correctly
uses applications:umbrafox.desktop, whose Exec invokes that wrapper. Wrapper
still passes ~/.config/umbrafox/umbrafox/kvm20oct.default-default-1 and refuses
missing profile/places.sqlite. Live PID18301 uses this exact explicit profile;
open database FD targets corroborate it (no database content read).
profiles.ini/installs.ini retain distinct installation defaults including the
previous fresh cjmrhtcu.default-default-2 profile. No direct-link launch or fresh
session was reproduced in this inspection; bypass is established, exact fresh
session identity not newly observed. KDE kdeglobals BrowserApplication and
xdg-settings default-web-browser separately still report brave-browser.desktop.
No launcher, desktop association, profile, browser, or system setting changed.
Proposed correction: route browser HTTP/HTTPS/HTML associations and KDE default
through existing umbrafox.desktop; owner approval pending for settings changes.
No need to restart/close existing browser to change those associations. Preserve
profiles and dated install; do not modify/delete fresh profile or personal data.

## October 7 Audio Path Admission Complete

Phase2+ONEphase3laptoprun complete2026-10-08T04:10UTC. New report
bot-docs/reports/performance/2026-10-07-audio-clock-admission.md; next contract
bot-docs/plans/audio-on-seek.md (no long audio-on driver implemented yet).
MEMORY updated. Existing phase1plan/report/checkpoint,102oldsealedfiles and
53oldruntimeinputs unchanged. No product/native/default/index/Desktop/Pi work.

Runroot /home/wyatt/.cache/codex/laptop-audio-admission-audio-20261007-AMoTqL,
04:05:10..04:05:25UTC. Browser2303940/content2304110/document10737418243.
Pair sameelement48kHz, volume0.05/unmuted, written45056->92160,
lastGoodPosition757083->1770916us. Nativequery1.686926/1.238523ms,
gap1008.973105ms. Originalpaused/unmuted/volume1 restored. Clocksource/audible
outputunobserved; nativequeriescanalterhandoff, no stuttercause/fixclaim.
ffvpx labelisgenericfamily notsoftwareproof; flagcachedinit/output, sixfrozen
producerfilesverified decoder-source-proof.json. Initialshutdown+truecompatible.

44prelaunchtests +2savedreviewtests/20corruptcases =46PASS. Resourceabort/write
firstfailureREDfixed. Firstsession-scaffoldsyntaxerrorretained, notbehaviorRED.
Runtimecapsunchanged120/105/15s,256MiB.5samples+baseline,peakRSS2428342272B,
artifact80546623B sampled; cleanSIGTERM/14recordedPIDsabsent/324Blog0drops.
No activecommands/sessions. New harness /home/wyatt/.cache/codex/
audio-clock-harness-5CWvps;59inputs/55syntax/185edges/51200Bdelta,manifest
7f63945415ad75949f3e2ec1d577b834b371673c72b829828e3c60dc7715fd17.
46fileexport160341B SHA b1edd01a7866489cdb2652201e7c0c292b5ba905a0944a4a6fa02a3b9ccca9eb.
Nameddocslint0errors/warnings via prebuiltmozcheck; no nativebuild. Lintcreated
32KiB obj/.mozbuild/logs only, finalabsencegate caught; copiedlint-profile.json
andremovedexactlog/emptyparents. Bothobjdirsabsent again, no otherremoval.
04:10postflightinputsunchanged/busy[]/systemiHDa7cecd28...same/nonfreenotinstalled.
NEXT new audio-on longUIseek/control endpoint-only nativequery contract;
no unchanged admissionrerun, no mutatedoldresults. Original symptomunreproduced.
Finalseal04:16:23UTC99files evidenceSHA
35ae0c796b1fd7dc8ba6c995dfc702916d66ecadad450462a1dc5f77b3adb5e5.
22phase1/102oldsealed/59runtimefilesunchanged;staged/trackedunstageddiffs match
cleanupsnapshot. Completed namespace/report frozen; MEMORY/DETAILS mutable.

## October 7 Requested Build Cleanup

Owner requested make-clean equivalent. Removed only generated
obj-x86_64-pc-linux-gnu and obj-aarch64-linux-gnu; no tracked files or observed
active users of these directories. Direct removal avoids mach --full shared
function-cache deletion. No browser control/restart/signals or profile deletion.
Usage82,482,798,592 ->33,357,254,656 bytes;45.7517GiB reclaimed,31.0664GiB left.
Artifacts/exports/.git retained; Git status/staged/unstaged diffs byte-identical
before/after removal. Logs /tmp/codex/umbrafox-clean-v246rfFG, temporary.
Source mozconfigs and installed/exported builds remain. OLD objdir/native-input
paths below are now historical: full native regeneration/build required before
using generated buildconfig.rs/config.status/dist/bin again. MEMORY updated.
No performance experiment run; audio-path phase2 below remains pending.

## October 7 Audio Path Coverage Gap

Phase1 COMPLETE2026-10-08T01:38UTC, no browser/SSH/profiler/native runtime.
New namespace artifacts/umbralink-control/audio-clock-admission, plan
bot-docs/plans/audio-clock-admission.md, report
bot-docs/reports/performance/2026-10-07-audio-clock-coverage.md. MEMORY updated.

Inspected startup/seek fixtures force video.muted=true. Frozen deployed base
8924318 plus untouched-file patch d1bf3bdf proves zero effective volume can
shutdown AudioSink and use systemclock; audible seek/startup paths were not
established by prior captures. NOT cause/fix or continuous nativeclock proof.
Owner asked soundon/muted; pending. Do not repeat muted ABBA for a rough sample.
12native/IDL/guardfiles pinned,5fixture hashes; source-proof replay identical.
Actual mediaelement path dom/media/mediaelement/HTMLMediaElement.cpp.

New audio.mjs projectAudioClock/admitAudioPair/readAudioClock and mirrored tests:
18PASS strictunhandled76ms,3JSformatPASS,named docslint0. Initial missingmoduleRED
scaffoldonly;4real assertionREDs for timeradmission/late-success/unavailable-clock
and saved-pairqueryspan thenfixed.
Old102sealedfiles+53runtimeinputs unchanged. Scratch namespace notruntime-ready.

mozRequestDebugInfo guard HasDebuggerOrTabsPrivilege, NOT literalChromeOnly.
Sink.isStarted is unpopulated; defaultzeros do not proveabsence. Positive
rate/written+advancinglastGoodPosition admits progressing observed sink only;
actualclocksource andaudibility remainunobserved. GetDebugInfo callsGetClock,
potentialhandoff/queueeffects, notpassive. Querytimeout can'tcancelnativework.

NEXTphase2 privatebridge/captureintegration: retain sameelementacrosspair plus
ownedPID/context/document joins; fulldeadline/cleanup/evidence/importproof.
No drivercreated yet, noautomaticlaunch. Thenoneboundedlowvolumelaptopadmission,
notmutedcomparison. Hostaudio/backend/Desktop/Pi/product/default/indexuntouched.
All commands terminal. Broader goal staysunfinished, no toolgoal assumed.
Phase1checkpoint SHA6523b66c7494c78090b1b45d3f20708fe1357ac1d9f4243fef414a71db638454;
snapshot only, notruntimeacceptance. Preserve whenextendingphase2.

## October 7 Passive Thread Sampling Completed

SEALED2026-10-08T01:22:58Z,102files, evidenceSHA256
777f02e7339996368dba5af419285a9b2076b3cccabd6117d5d49d06062b6b6b.
Do not edit sealed namespace/plan/report. MEMORY/DETAILS remain mutable.

Owner requested immediate memory dump; root MEMORY.md now contains full handoff,
safety limits and current result. Earlier preparation section below is HISTORY,
superseded here. Broad performance objective unfinished; get_goal returned null
on this resume, so no active tool goal was assumed or created.

Fixed laptop control/sampled/sampled/control COMPLETE, all runtime/export/review
and exact14PIDabsence checks PASS. Frames1200each, drops24/0/0/0. A1 all24native
compositor drops:23observed5003..6002ms,1observed16013..17001ms; not actual event
timestamps. B1/B2 smooth with102thread samples,0missedslots/no pendingread atstop.
No sampled rough interval, stall localization, causal observer benefit or fix.
Owner means SEEKING; prolonged postseek stutter/blackflash still unreproduced.

Roots under /home/wyatt/.cache/codex/laptop-startup-thread-sampling-:
A1control-20261007-GV0yFB, B1sampled-20261007-S3OFOv,
B2sampled-20261007-uYfR9P, A2control-20261007-HNqQm0.
Browser/contentPIDs2268710/2268876,2271891/2272056,2275155/2275323,
2277660/2277826. Runtime01:04:52..01:16:26UTC Oct8; B1/B2 gap includes
memorydump/contextrecovery, no equalized warmstate/delay claim.
All9resources/cell,0logdrops,cleanSIGTERM,privateinstall; same binary/INI/fixture
hashes; maxsampleRSS2478878720B/artifacts95097522B. All sampled media ready4/
network2, minimum buffer8.917/15.023/15.027/15.009s. No networktrace proof.

53frozenruntime inputs at startup-thread-sampling-harness-20261007-WMprMv;
manifestf5a0ab5aae00ed3f13561d7aeef3146e655d2a0dea3d743d51804121a93a7b83.
Input/quietpostflight01:17:51.247UTC; systemfreeiHDa7cecd28... unchanged and
nonfree notinstalled01:18:09.142. Desktop/Pi/product/default/kernel/index untouched.
All browser/SSH/test commands terminal, no profiler daemon/rawparse/delegation.

Clocksource.json pins deployedGecko + officialNode24.18/libuvMONOTONIC; not Node
binaryattestation. B1/B2 offsetuncertainty23.704/18.540ms, maxread14.223/22.881ms.
99strictlyinterior intervals~19.8s/role,2boundaryintervalsexcluded. CPUmsB1/B2:
parentmain1100/1060,Renderer1400/1560,Compositor680/720,contentmain1430/1610.
10msquantization; waitunknown; no per-counter-row alignment/physicalscanout claim.

Report bot-docs/reports/performance/2026-10-07-startup-thread-sampling.md;
plan bot-docs/plans/startup-thread-sampling.md. Namespace artifacts/umbralink-control/
startup-thread-sampling contains comparison.json/replay,commands all4roots and
finalverification/evidence seal. Final53testsPASS0fail0.635s;13manualJSformatPASS;
96priorsealedfiles+53currentinputs verifiedunchanged. InitialA1export argv error
before reads preserved; accepted control-1-export-v2, no browser rerun. Analysis
RED missingmodule scaffoldonly; initialinspection samples-vs-observation.samplesJSON
schema mistake had no effects. Old38/41receipts preserved.

NEXT no identical ABBA recapture. Review source-backed drop notification/queue
transitions and existing saved evidence for a new falsifier. Need owner workload
matching independently (actualstream/codec,singlejump vs repeatedscrub). Do not
install systemdriver or modify active desktop without explicit permission.

## October 7 Passive Thread Sampler Preparation

IN PROGRESS, namespace artifacts/umbralink-control/startup-thread-sampling,
plan bot-docs/plans/startup-thread-sampling.md. Not sealed, NOT browser-ready.
Goal ACTIVE; this turn PROGRESS. Owner means SEEKING, not YouTube search.
Desktop/Pi protected; no browser/driver/kernel/product/index changes this turn.
No agent, profiler daemon or raw-profile parse. All commands terminal.

New sampling.mjs, proc.mjs, capture.mjs plus4mirrored test files. Fixed200ms,
160samples/32s,512task discovery,16KiB/stat,1MiBseries,1000msread timeout.
Only parent-main/Renderer/Compositor/selected-content-main; PID+TID stamps,
before/after process checks; main CPU uses task/PID/stat (not aggregate PID stat).
Poison after failure, no late samples/restart; underlying OS IO may remain
pending and is explicitly reported. Own stop failure retains prior samples.
Sampler failures promptly abort capture adapter; private reply arriving after
abort cannot mutate saved clock metadata. Primary/secondary failures retained.

One metadata-only SSH command exited0: laptop kernel7.0.0-38-generic,
Node24.18.0,CLK_TCK100,sched_schedstats0 at00:38:25.156UTC. ownSchedstat text
nonzero is NOT enabled-stats proof. Wait statistics null; no setting changed.
Local owned Node test exercises actual /proc self/task,positive ticks in180ms,
unchanged identity; no browser/unrelated process reads. Test process exited0.

Local final gate38PASS (24new+14oldprecondition)0fail0.30s, strictunhandled.
Real capturePrepared/captureStartup composition fake ledger botharms10RPCs;
all10RPC/12writefailurepoints exercised eacharm. Clock offset range uses existing
playbackRPC sent/received and nativeStart/nativeEnd, rejects uncertainty>100ms.
Same inactive preparation, no per-sample RPC, no publicmark/newpage surface.
Tests only establish tooling, not runtime clocks/overhead or stutter cause.
Logs: final-tests.log; late-reply-red/green; stop-evidence-red; initialscaffold
and cancellation-race test errors retained. Initial cancellation race aborted
before error won; corrected injected bound test is the meaningful coverage.

NEXT phase3 remaining: pin native/Node clock sources (Searchfoxdiscovered
dom/base/ChromeUtils.cpp::Now, mozglue/misc/TimeStamp_posix.cpp CLOCK_MONOTONIC;
xpcom/ds queries had0hits, not absenceproof), create narrowruntime driver/import
closure, saved-data reviewer for identity/clock/coverage, source/package/caps
and cleanup verification. NO DRIVER CREATED YET. Then oneprospective fixed
laptop A/B/B/A only, not outcome-driven retries. No deployment/fix claim.
Previous sealed startup-precondition and startup-variability artifacts untouched.

## October 7 Offline Startup Variability Audit

SEALED2026-10-08T00:34:08.370Z:18files evidenceSHA
0ea5e19a8be41687fe79f65a2c4d10ada4a2831311526fc4b6bdb1e034877481.
Namespace artifacts/umbralink-control/startup-variability. Report
bot-docs/reports/performance/2026-10-07-startup-variability.md. Do not edit
sealed namespace/report. All commands terminal, no daemon/browser/SSH launched.
Goal ACTIVE; this turn PROGRESS, not an optimization, causal localization or
owner post-seek reproduction. Desktop/Pi/product/defaults/drivers/index untouched.

New pure analysis.mjs + recompute.mjs + mirrored test analyze all4 sealed
preparation ABBA exports. Original78sealed files +48runtime inputs verified;
four saved reviews reproduce exactly;4producer files match frozen base and are
untouched by package patch. Sources: HTMLVideoElement.cpp (mediaelement path),
FrameStatistics.h, ChromeUtils.webidl, UmbrafoxControlDiagnostics.sys.mjs.
8focused tests PASS;22combined with unchanged precondition suites PASS0fail in
0.50s.3JSformatPASS, named report lint0, diffcheck0. Missingmodule RED is
scaffold-only. Recompute initial parenthesis SyntaxError retained; final import
tested and results exact replay. No rawprofile parsing or native/runtime edits.

All4 initial graphics feature/adapter/info projections identical. Settings
viewport1280x955 all4; button rect736,515,48,40 for A1/B1/B2 despite drops25/2/0;
A2 rect768,533,48,40 (1sinkdrop). Not full player/layout/canvas proof.
Settings-to-playback1216/965/981/917ms; page ages11810/11542/11562/11440.
All84 samples readyState4/networkState2; minimum sampled buffered-ahead
12.466666/13.233333/11.933333/14.9996s. No recorded mediaevents. Not networktrace.
A1 at5002ms decoded305/presented300/painted285/dropped0, buffer22.428512s;
at6003ms decoded365/presented335/painted335/dropped25, buffer21.449697s.
Sequential/asynchronously updated counters:15countdifference is NOT physical
delay or queue length. Actual event-time remains unknown; no simple download
starvation evidence at these samples. Existing async drop-producer map retained.

CPU uses exact PID/type/origin population and rawns before subtraction (rounded
ms crosschecked). Brackets20041.881/20039.767/20032.822/20047.254ms.
Browser CPUms8722.989/8836.168/8595.814/8376.438; content4717.747/4696.362/
4483.389/4291.200; RDD1540.588/1400.693/1357.257/1355.205. Wholeparent includes
Renderer/Compositor; NOT mainthread%, burst CPU, GPU or wait attribution.
Each13process population stable at endpoints;9resource samples show no births
after second sample or exits. Readspans31..120ms not browserblocking duration.
NO controllerperformance.now -> pageclock bridge exists; don't align resource
samples/dropcounter by subtracting clocks. Sparse snapshots miss transients.

NEXT: source/contract review for a bounded low-overhead event-local thread/clock
observation with observer control, not another unchanged profiler/repeat loop.
No new runtime contract prepared here. CPU-only negative remains inconclusive
for waits/driver. Actual owner seeking symptom still needs workload matching
(affected stream/codec, single jump vs repeated scrubbing). Prior actual UI
long forward/backward tests did not reproduce it. No implicit desktop control,
system driver install, codec forcing or extension-disable authorization.

## October 7 Preparation-Only ABBA

SEALED2026-10-08T00:19:09.657Z:78files, evidenceSHA
545505044431c0d3cb2f5cfc3d1853a0df03b777a970a5054f488dd7dc30c25d.
Namespace artifacts/umbralink-control/startup-precondition. Report
bot-docs/reports/performance/2026-10-07-startup-precondition.md and plan
bot-docs/plans/startup-precondition.md now BOTH sealed. Do not edit sealed files.
All browser/SSH/test/analysis commands terminal. No profiler daemon/raw parse.

Goal ACTIVE, this turn PROGRESS: new tested preparation adapter plus complete
fixed laptop A/B/B/A. NOT an optimization or causal benefit. Owner means SEEKING;
prolonged post-seek stutter/black-flash recovery still NOT reproduced. Desktop/Pi,
personal profiles, product/default source, system driver and index untouched.
No staging/commit/agent delegation. No automatic driver-install permission.

New preparation.mjs browser script performs inactive sham(A) or exact no-stack
Start/Stop(B), bounded2s each and stop in finally after attempted start. Primary
and secondary failures retained. Before/after selected-content service reads
use existing private frame bridge, native WindowGlobal.osPid join, exact document
and contentPID. Cc nsIProfiler local service availability now verified in these
runs. No page globals/public marks/API additions. Parent+selected-content
inactive at boundaries only; all other child profiler state remains unknown.
Same immutable playback collector and cleanup imported, no dump/copy. Direct
capture wrapper always forces profiled=false. New reviewer preserves original
safety/native/cleanup checks plus preparation/content/time joins.

Tests116PASS/0fail1.492s combined;7manualJSformatPASS,44runtimeJSsyntaxPASS,
docs0,diffcheck0. RED missing module acknowledged as harness failure; nativePID
gate and savedmode guard behavioral RED retained. Generated driver/review-base/
fixture have exact inverse/source-region proofs. Final129priorsealedfiles and
48runtimeinputs unchanged. Native source proof4base-identical files, plus
FrameStatistics.h source sum verified againstbase+patch.

Harness /home/wyatt/.cache/codex/startup-precondition-harness-20261007-MbAdh5
dev64512ino37367219/uid1000/0700.48files149edges44syntax81858560B bundle
SHA1f5345c8839d95a2ce6e72f4079bd42f3520043c23a07de9b10a26e390b6f8f7;
manifest13c2bdd6fc564b2d9b31421c6a56fc4b6433e349afeed81e8f108e8e09a93215.
Preflight00:06:47UTC MemAvailable12.85GB/disk30.28GB/busy[]; files checked
before/between/after, final00:12:00.529UTC. Systemfree iHD unchangeda7cecd28...
and nonfree not installed00:12:45.267UTC. Same Build20261006175655/privateiHD.

All4PASS/cleanSIGTERM/all14recordedPIDsabsent/installationPASS,21samples20s,
0missedslots/0mediaevents/9resource samples/0logdrops. Sequence:
A1 root laptop-startup-precondition-control-20261007-ZX7ReM,
00:07:29.083..00:08:02.465UTC; browser2248966/content2249132/RDD2249096.
1200frames25drops allcompositor, observed5002..6003ms, prep0.074274ms.
Export54filesSHA71301e9a7f052bf5e390f13c6f63f27d73c819e28fa60825eae80778e5670bf8.
B1 root laptop-startup-precondition-preconditioned-20261007-l1QJUt,
00:08:48.281..00:09:21.353UTC; browser2251522/content2251683/RDD2251648.
1200frames2compositordrops, observed11..12s and16..17s, prep9.287772ms.
Export53filesSHAde96cc4d738ad911dd58afb3b9541f1e0761a8e73a451d91d6f0e8d40583d07e.
B2 root laptop-startup-precondition-preconditioned-20261007-eYmSxn,
00:10:07.130..00:10:40.245UTC; browser2254015/content2254182/RDD2254147.
1200frames0drops, prep9.297063ms. Export53filesSHA
6cc733ab071c2fe03e9fe5aadc0b0078e18971df931711cb270bab5fdadde8ee.
A2 root laptop-startup-precondition-control-20261007-VFZkvC,
00:11:04.200..00:11:37.201UTC; browser2256480/content2256646/RDD2256611.
1201frames1SINKdrop observed1..1001ms, compositor0, prep0.082451ms.
Export52filesSHA963cf816960d0216a4c8d7711aa8b8c6cef8c3500924f2c96d3de69420bc865d.

All documentIDs10737418243 scoped to distinctPIDs. Initialquality totals and all
native dropcategories0. Before native decoder shutdown/1output/HWtrueAV1/1080;
after ffvpxRDD HWtrue, outputs1205/1206/1205/1206; sum decoded+sink+compositor
equals finalquality. PeakRSS2463105024B, sampledartifact94574927B; logs331/338/
338/331B retain EPERM and private VA init success.4binaryINI+7fixturehashes
identical;7loosemodulesnull. Pageages11810/11542/11562/11440ms; menu point760,535
first3 vs792,553 A2. No geometry forcing/elapsed-delay matching. No no-upload,
continuous wholebrowserprofileroff/scanout/GPU cause or performance-win claim.

comparison.json +comparison-final.log authoritative. Initial comparison.log
wrongly asserted every sinkcount0; first attempted string fix missed that
assertion (comparison-v2.log); both FAIL preserved. Correct sum producer read
viaSearchfox+exactpinnedFrameStatistics, finalPASS. Captures remainedPASS.

NEXT investigate ordinary startup variability in saved player/layout/process
evidence and actual post-seek transition, without assuming profileractivation
causal. Final untreated control1drop is concrete counterexample to necessity.
No more profiler-start workaround or repeatcapture loop. Hostwarmstate, setup,
site/layout variation remain unisolated; freshprocesses do not reset these.
Form a falsifiable next control only after source/saved-data review. Broader
optimization goal and system-driver deployment decision remain open.

## October 7 Startup Activation Audit

SEALED23:53:46.615UTC:25files, evidenceSHA
76737a777888a4f4268ca70240a3bb6d80d83823cc7f1377989dbc2363be2a11.
Namespace artifacts/umbralink-control/startup-activation-audit; report
bot-docs/reports/performance/2026-10-07-startup-activation-audit.md SHA
6b3a3e87982013ea8f60ddb750cbf294c635e3717ebc90980ba0e0021e52e670.
No further edits to sealed namespace/report. Working next plan
bot-docs/plans/startup-precondition.md intentionally NOT sealed; historical
snapshots in commands.json/verification.json. Current plan SHA
acec3e6aa9c753aca4a2561da5de2c496181423e3ba1ba9e25309433aada85c2.

Goal ACTIVE; source/saved-data PROGRESS, no optimization or owner symptom
reproduction. Owner means SEEKING with progress bar. All commands terminal;
no browser/SSH/profiler daemon/raw-profile parse, product source/default edit,
system install, staging, commit or agent delegation. Desktop/Pi protected.

Thirteen profiler/sandbox/ImageComposite/VideoSink source+test files match
package base892431809a4caadb5c73b2c03ad9bdb124c3e21e exactly and are untouched by
frozen source.patch d1bf3bdf...; final source receipt a9befff9... verified.
source-proof.json contains full hashes/excerpts. Both stored audit scripts
rerun with output writes replaced by timestamp-excluding deep equality: PASS;
13source/104previoussealedfiles/4runs verified, docs0,diffcheck0. No native tests.
Searchfox0.18 advertises0.20.5, no update. Two15slargefiletimeouts124 and corrected
range/IDL-path failures retained as limitations, never absence proof.

Key finding: nostacksampling STILL gathers per-thread CPU/running-time rows,
counters and wakes at5ms. No processcpu feature does not disable thread CPU.
Both saved marker-run receipts samplingPaused=false. PauseSampling separately
skips sampling body while retaining markers, but outer wake/lock loop remains.
Parent SendAndConvertPromise resolves on child rejection too; acknowledgement
is not every-child success proof. ProfilerParent::Init EnsureStarted does NOT
replay sampling-pause in inspected path: future children may sample. Source gap
only, not runtime reproduction/fix. JS activation requires absent js feature;
sandbox emitter path requires absent sandbox feature. Inspected ImageComposite
profiler branches emit diagnostics; actual drop increment outside guard.
No whole-engine absence or causal scheduling claim.

clock-comparison.json: profiled-minus-control page age +948ms stack pair and
-127ms no-stack pair; content ages +942.071275/-143.394046ms. Separate process/
document clocks, not cross-run absolute clock. Individual RPC duration unknown.
24control/0profile twice remains confounded; no pooling or causal proof.

NEXT implement UNIMPLEMENTED precondition plan: fixed laptop A/B/B/A fresh
processes, same frozen package/private driver and20s1080p collector; A inactive
sham, B start+stop existing no-stack profiler before playback. Same extra RPC
shape; record actual duration, no invented delay; no dump/copy/raw parser.
Parent+selected content observed inactive before/after. First trace private
content service availability from existing producer; do not assume globals or
all-child acknowledgement. Reuse sealed cleanup with exact generated deltas,
new scratch namespace; fake emitted privileged-script failure gates first.
120scapture/15scleanup/256MiB caps unchanged; stop sequence on failed admission/
cleanup. Two per arm cannot isolate initialization from setup duration/site
variation. Neither result explains prolonged post-seek black-flash recovery.
No automatic system-driver install or desktop control.

## October 7 Marker-Only Startup Pair

SEALED23:36:34.767UTC:49files, evidenceSHA
b64218582e22861f29b4c71378bca6275e008c05af3161f919ecd6a24e02abba.
No further edits to namespace/report/plan. Allcommands terminal.

Goal ACTIVE; PROGRESS only, not an optimization. Owner means SEEKING with the
progress bar. Current wave finished one isolated laptop control and one
marker-only capture. Daily desktop/Pi untouched. No new product/default edits,
build, system-driver install, staging, commits or profiler daemon. All browser,
SSH and test commands are terminal. No retry after the failed profile-copy gate.

Namespace artifacts/umbralink-control/startup-markers; report
bot-docs/reports/performance/2026-10-07-startup-markers.md and plan
bot-docs/plans/startup-markers.md. Sealed sources from startup-profile remain
unchanged. New generated capture AST delta only features -> nostacksampling,
nomarkerstacks plus import relocation; driver/review/tests imports rewired.
Four inverse/source hash proofs. 14focused/102combined strict testsPASS,
2manualJSformatPASS,docs0,diffcheck0. Final verification rechecked all55 prior
capture +219 prior analysis files and45runtimeinputs, unchanged.

Harness /home/wyatt/.cache/codex/startup-markers-harness-20261007-v2Caxw
dev64512ino37366250/0700. Bundle45files135edges41syntax81838080B
SHA0bf235b3e8b54a40fb641bce64ae1f34db70e8ca78f1611e8d34918ab55f66fe;
manifest3f73bbc6542eb6eb7cd11cbe8f4a5c1a6124a4d2fad8e8f0bd0e0c3622f68835.
All45 matched before/between/after, last23:33:31UTC. Same frozen descriptor-borrow
Build20261006175655 and verified privateiHD; systemfree iHD unchanged a7cecd28...
and nonfree package not installed at23:33:32.983. No system change authorized.

Control root laptop-startup-control-20261007-wM2yqD PASS
23:30:50.057..23:31:23.157UTC. Browser2236743/content2236923/RDD2236888,
document10737418243.21samples1198frames24drops/no missedslots or mediaevents.
Drop observation5003..6002ms, not actualdrop instant. Native afterHWtrueAV1
1920x1080/ffvpxRDD1207outputs/compositor24/decoder0/sink0. Before labelshutdown
with1output.9resources peakRSS2491826176B/artifacts95252993B.318Blog0drops.
CleanSIGTERM/14recordedPIDsabsent/installationpostflightPASS.50fileexportSHA
59bf74c2921d931e851ee838b9b96c192e5f4d787c12a63410f8d2b4080ed923.

Profile root laptop-startup-profiled-20261007-kCNFsh FAIL copycap ONLY
23:31:57.367..23:32:30.693UTC. Browser2239251/content2239416/RDD2239381,
document10737418243.21samples1200frames0drops/no misses/events. Native
afterHWtrueAV1/1080p1206outputs/all3dropcategories0. Exact activefeatures
nomarkerstacks,nostacksampling;16Mentries5ms existingfilters, buffer generation0
pos9531125. Pause/dump/stop/inactive receiptsPASS, cleanSIGTERM/14recordedPIDs
absent/installPASS.8resources peakRSS2357424128/artifacts80331519 BEFOREdump.
319Blog0drops.52fileexportSHA
ab299c40c3c7a3d6437a7634db400157249c4f1209392edd4e26ba17e4571d4a.
Complete reviewer rejects; explicit partial reviewer passes observation/cleanup.

Original dump retained on laptop:
/home/wyatt/.cache/codex/laptop-startup-profiled-20261007-kCNFsh/run/profile/umbrafox/diagnostics/profiles/dom-profile.json
Metadata only48114086B/dev64512/ino37367947/uid1000/0600/
mtime1791415950488.5896. No rawcontentSHA, parsing, copy or CLIload thiswave.
24MiBcopycap unchanged; no rootprofile.json. Postcleanup metadata149683636B,
748entries below256MiB. Dump itself not hardbytebounded. All14absentPIDs:
2239239,2239251,2239343,2239346,2239373,2239381,2239416,2239478,2239486,
2239523,2239530,2239537,2239655,2239691.

Same4binaryINI+7fixture hashes,7loosemodulesnull. Settingsgeometry differs
control714,496.9 vsprofile760,535. No forcedCSS/resize/fullscreen. Pattern repeats
prior pair24control/0profile, but N1/order/startup/pagevariation confounded;
not causalobservereffect, GPUcause or prolongedseek/blackflashreproduction.
Source proof nostacksampling disables capturedstacks, CPU samplerows mayremain;
actual retention/stackabsence innewdumpUNVERIFIED. Searchfox0.18 advertises0.20.5,
no update. NEXT offline savedreceipt/sourcecomparison of profileractivation and
setup timing before anotherbrowsertrial; deliberate matchedsetupcontrol only
after concrete contract. Separate boundedopaque export can recoverexistingdump
using tested prior exporter withoutrelabelingFAIL. Do not repeatprofiler trials
hoping tocatchburst. No agentdelegation thiswave.

## October 7 Existing Startup Profile Analysis

SEALED23:21:17.803UTC:219files;55oldfiles reverified. EvidenceSHA
f57533604a52249c2ca980a7721b55b85403c691feea58d08343da98f239cd50.
No edits to new namespace/report/plan after seal. Tests32PASS/0fail0.416s,
5manualJSformatPASS,docs0problems,diffcheck0. All tool/SSH/test sessions terminal.

Goal ACTIVE; offline PROGRESS only. No browser launch/control, product/default,
system-driver or index changes. Current namespace startup-profile-analysis;
report bot-docs/reports/performance/2026-10-07-startup-profile-analysis.md and
plan bot-docs/plans/startup-profile-analysis.md. Original startup-profile capture
stays FAIL at24MiB cap, all old evidence preserved. Owner means SEEKING.

Opaque source52,241,866B SHA414c126d2d9438373bd4aa152cc1a1990dc3a36a7ba768ed843df56c5f548eb3
compressed8,298,417B SHAeafa42c6eeaf5c4f18813a81bb6ebae56403d144a13427ba14682667414d66a7.
Original metadata unchanged;14recordedPIDsabsent. Remote output
/home/wyatt/.cache/codex/startup-profile-export-20261007-k4uk5g/;
local gzip/receipt /home/wyatt/.cache/codex/startup-profile-analysis-20261007-bdY4jy/.
64MiBinput/24MiBoutput/exclusive/O_NOFOLLOW/30s export, streamroundtrip twicePASS,
no rawJSON parser. 32focusedtestsPASS (14export+18analysis), initialREDmissingmodule.

One CLI0.10.0 own load explicit loopback symbol-server; daemon471264. Actual
57threads12processes/Build20261006175655/5ms128MiB. Unique complete private marker
matches PID2222564/document10737418243/nonce/native+pageclocks. CLI interval
1056.4778811875..21061.6310281875; rawrootstart12434.459188;
native-to-root offset499.7294921875; marker tail3.029113ms excluded.
21complete thread exports; t49info10s timeout caused STOP, no retry.
Initial selector MISSED actual ImageBridgeChld/IPC I/O Parent+Child spellings
and CanvasRenderer, inventory only for these; future select from actual names.
Stop0at23:14:51.636, exactPID/socket/JSONabsent23:14:51.996. No active daemon.

Smooth reference ONLY:1200frames0drops vs separateN1control24. DerivedComposite
1201 median1.089696/P951.626098/max5.924033ms; notifier1201median1.134005.
Composite payloadinnerWindowID2 NOT contentID; no pervideo/pairedraw/scanoutclaim.
Compositor1205UpdateCompositedFrame/0Video frames dropped; MDSM1201VideoSinkinstants.
Idleclasses content91.02%/parent91.7/Renderer92.6/Compositor96.5; 5ms sampling
doesn't exclude short deadline misses. Native addresses unresolved despite
symbolicated=true; no function/GPUcause. 95CLIcommands includes1timeout+cleanstop.
Next lower-overhead marker-focused trial with fresh control, actualdropburst
required, fixed geometry; no automatic systemdriver install/desktopcontrol.

## October 7 Startup Profile Pair

Sealed23:04:29.192UTC:55files,83priorsealedfiles+43runtimeinputs reverified;
evidenceSHA149575011ea27a1b7399cd4553619857cb071fbea7520bfd2a2258065584d2b5.
Do not edit this namespace or report again. All exec/SSH/test sessions terminal.

Goal ACTIVE; this turn PROGRESS, not an optimization. New namespace
artifacts/umbralink-control/startup-profile/ and report
bot-docs/reports/performance/2026-10-07-startup-profile.md. Plan
bot-docs/plans/startup-profile.md. All browser/SSH/test processes terminal at
handoff; no profiler daemon loaded. Desktop/Pi/product/default/system-driver/
index untouched. Do not retry the browser or relax capture caps automatically.
Final192testsPASS/0fail4.561s;5manualJSformatPASS;docslint0problems. Runtime
source closure unchanged after both runs. Generatedpreserve function exactsource
hash testPASS; no raw-profile parser or profiler daemon invoked.

Control B61eKy PASS22:56:03.664..22:56:36.738UTC. Browser2219799/content2219963/
RDD2219930,document10737418243. 20s/21samples/1200frames24drops observed between
5001..6002ms, zero missed slots/events. Native compositor24, decoder/sink0,
hardwaretrue both boundaries (before shutdown1output, afterffvpx1205outputs).
9resource samples, peakRSS2410725376B/artifacts86987315B,318B log0drops, clean
SIGTERM, all14recordedPIDsabsent;48fileinstallationpostflightPASS. Export49files
SHAe00de3242e40aa421d2258bae5bab7424af2fa7a728303bcca250743f3e00c55.

Profiled odI1jl FAIL22:57:53.763..22:58:28.196UTC: Profile preservation cap.
Playback completed20s/21samples/1200frames0drops/no misses/events. Browser2222397/
content2222564/RDD2222530,doc10737418243. Exact effective16Mentries/5ms/features
js,stackwalk,processcpu,nomarkerstacks/filtersGeckoMain,Compositor,Renderer,
ImageBridge,Media,Video,IPC I/O admitted. Private complete ChromeUtils native
marker and clock brackets returned; no public UserTiming/page globals. No CLI
retention/thread proof yet. Profiler paused/dumped/stopped/inactive receiptPASS,
cleanSIGTERM/all14PIDsabsent/48filepackagePASS. Native afterHWtrue1206outputs0
compositor/decoder/sinkdrops. 8resources peakRSS2686341120/artifact80204611B
BEFOREdump;319B log0drops. Export52files
SHAff7baa45d4bcd84142b41ab621fdc5dd91136866cd51b37896fb82cda7129a84.

Original dump still on wyatt-laptop at
/home/wyatt/.cache/codex/laptop-startup-profiled-20261007-odI1jl/run/profile/umbrafox/diagnostics/profiles/dom-profile.json
Metadata-only:52241866B/dev64512/ino37366171/uid1000/0600/mtime1791413908022.1409.
24MiB existing opaque-copy helper correctly refused before read/copy. No rawJSON
parse/transfer/load; original contentSHA unknown. postcleanup metadata walk
169821743B/1360entries under run, below256MiB. Full review rejects failed run;
explicit profile-copy-failure review verifies partial observation+cleanup only.

Both cases same binary/INIs4 hashes+7fixtures;7loosemodulesnull. comparison-v2
is authoritative; initial comparison used wrong provenance keys (undefined
equalsundefined), retained as superseded. Geometry different settingspoint
760,535 vs702,502.6; N1 freshcache/sitevariability/profile-start confounds.
Zero drops under profiler NOT causal proof/fix/desktopseek reproduction.
SystemfreeiHDunchangeda7cecd28... nonfreeNOTinstalled at23:02:28UTC.

Adapter reuses frozen backward capture+failure wrapper and driver variant,
opaque preservation function AST-extracted unchanged to avoid obsolete unused
DOM parser dependency. 43file121edge39syntax runtime bundle
SHAe96b23767e71f278a47af0d1f679a638b7bba1e8ac6f5a4d186e9b70ac173a2b;
manifest53ad6f6872565bfb1e617a808ddcd315c057ef0e9e6234b29b7621013998783d.
Laptop harnessstartup-profile-harness-20261007-4myC1m dev64512ino37360332/0700;
all43inputs unchanged22:59:53.631UTC. No active sessions. Commands stored
startupProfile*.

NEXT: bounded opaque stream compression/export of EXISTING52MiBprofile before
any newbrowser. Test sourceidentity/O_NOFOLLOW/inputcap/output24MiB/hash/decompress
and cleanup; preserve original captureFAIL/caps. No raw parsing. Load admitted
gzip via profiler-cli0.10.0 uniqueownsession explicit --symbol-server
http://127.0.0.1:9 only, prove PID/socket cleanup. This smooth-reference capture
may establish coverage but cannot prove cause of absentdropburst. Later less
intrusive marker-only trial separately reviewed. Owner seeking clarification
and desktopprotection remain. No agents thiswave.

## October 7 Startup Drop Audit

Sealed22:43:48.501UTC:25files,138priorsealedfiles reverified; evidenceSHA
608ef16da714bd9b0641467084b443f1d05652f254a7fc78b736982e1b559460.
No more edits to this namespace/report. All commands terminal.

Goal ACTIVE; turn PROGRESS, source/offline only. No browser/SSH/profiler daemon,
build, product/default/system-driver/index changes or live handles. New namespace
artifacts/umbralink-control/startup-drop-audit/; report
bot-docs/reports/performance/2026-10-07-startup-drop-audit.md. Owner's "searching"
means video progress-bar seeking, NOT YouTube search. Desktop protected.

Four pinned completed exports/all404 embedded files reverified; first20s drops
softwareforward25/softwarebackward0/hardwareforward24/hardwarebackward23.
Changes observed in page-sequence buckets5016..6017/6018/6015ms respectively.
All sampled1080p/ready4/minbuffer>=15s/no events/no missing slots. Interval
decodedDelta60 each; media advances0.98..1.02s. Nextnativecheckpoint compositor
drops25/0/24/23, decoder/sink0. NOT hardware-specific/universal/desktop recovery
reproduction. Individual property reads not atomic, no per-frame causal join.

13-file sourceproof pinned HEAD8924318+frozen descriptor-borrow patchd1bf3bd...
and sourceFinala9befff...;12filesunchanged, ImageContainer only unrelated extra
descriptor method. Drop path: ImageComposite::UpdateCompositedFrame counts and
emits existing 'Video frames dropped' marker; WRImageHost gets/resets; ImageBridge
RecvUpdate sends async ReportFramesDropped; child/container accumulate; VideoSink
later consumes on queue removal; public quality reads FrameStatistics. Therefore
6s is COUNTER OBSERVATION time, not exact physical drop moment. New analysis.mjs
keeps actualDropTimeMs:null, no host/native clock equivalence. Six pure testsPASS,
four existing full seek validatorsPASS, scratchformat/docs0. Red missing-module
only, not runtime reproduced bug. Prior sealed captures unchanged.

Profiler tool0.10.0 present; FULL guide saved/read, loadhelp explicit offline
symbol-server supported. No daemon loaded. Existing private UmbraLink browser
realm can call StartProfiler/Pause/StopProfiler; dump command existing. Source
supports privileged frame ChromeUtils.addProfilerMarker complete interval with
explicit innerWindowId; timestamp is ChromeUtils.now NOT page performance.now.
No public UserTiming marks/globals needed. CLI rootRange subtract caveat persists;
use same-export relative markers, check document/process IDs, no raw profileparse.
GetFeatures saved receipt supports js/stackwalk/processcpu/ipcmessages/nomarkerstacks
(NOT guessed 'cpu'). Actual buffer/filter config must be admitted live.

NEXT implement narrow scratch20s quality-ready unprofiled/profile observer pair
on same laptop private driver. Use prior backward capture failure wrapper unchanged;
no diagnostic RPC during playback, private marker boundaries, pause then dump/stop.
Verify inactive/startup ownership, entries/thread coverage, bounded profile file,
PID/socket cleanup. Preserve current256MiB artifact cap/no bypass. Existing native
drop marker + ImageBridgeTransaction + Composite/GeckoMain spans first attribution;
cover broad0..8s not point6s. Dump can blockparent so strictly afterplayback. Frozen
profile and unprofiled measurements must remain separate. No system driver install
or desktop restart/control without consent. No agent assignments thiswave.

## October 7 Hardware Backward Capture PASS

Goal ACTIVE; current turn PROGRESS. Single newly instrumented backward run
Q72ohH completed22:21:43.895..22:24:31.853UTC,167.958s. PriorfailedHNGm4l sealed,
notreclassified. No desktop/Pi/product/native/default/system-install/index edits.
Newnamespace artifacts/umbralink-control/decoder-driver-backward/;
report bot-docs/reports/performance/2026-10-07-decoder-driver-backward.md;
plan bot-docs/plans/decoder-driver-backward.md. No more runtime thiswave.

Controller2210645/browser2210657/fork2210756/RDD2210790/content2210824.156samples,
151393msobs/130008postseek,9078frames24drops:23at6.015s BEFOREseek,1at45.021s.
UI21.254->4.771 target5/33mstrustedseek. No lowadvance/reset/missedintervals,
ready4/minbuffer15.005s. All5nativehardwaretrue (before shutdown1outputmetadata
ONLY); later4ffvpxRDD AV1/1080outputs1334/3949/6648/9132. Final5mappedsegments
exactprivateiHD7e14725d... dev64512/ino37360268 with root/fork/RDD bracket checks.

Matching oldsoftware backward CPU124844ms/155112.356871wall ->10820ms/
155089.62243wall,91.33%lowerRDDprocessCPU. Content36357->30750.42RPCeach, same
binary/libxul/INIs+fixturehashes; looseuserlandmodulehashesallnull. Childenvsame
afterexplicitownedrootjoin exceptLIBVA_DRIVERS_PATH. N=1descriptiveNOTwholeapp/
GPU/energy/scanout/desktopcause; playergeometry880x495->822.4x462.6atviewport1280x955.
Important: oldsoftwarebackward3drops vsnew24; NOTsmoothnessimprovementclaim.
Twohardwaredirectionsstillshowstartupdropburstaround6swhileRDDCPUdown90-91%.

Failureevidencerepair onlyscratchwrapper aroundexistingresource sample seam:
originalmonitor abort(reason.message) dropscause; behavioralREDretained. Wrapper
records boundedcode/syscall/ownedcategory/relativepathSHA only BEFOREabort,
rethrowsSAMEexception, lateabortdoesnotmutatereport. Sharedsampler/monitor/caps/
browserRPCunchanged. Newrunall36scans1attempt/noresourceFailure, notracefixedproof.
178strictNodePASS(167prior+11new),no failures/skips. Final6manualfileformat/docs.

36resourcecapsPASS/peakRSS2558865408B/artifact154974087B/log327B0drops. Clean
SIGTERM/rootabsent; all14recordedPIDsabsent22:24:43.407UTC;48filepostflightPASS.
40runtimefiles/107edges/36syntax unchanged22:24:54.183. Archive81786880B
SHAd9a4d576... manifest5bb666de...; laptopcache root
decoder-driver-backward-harness-20261007-loESuK dev64512/ino37359242/uid1000/0700.
SystemfreeiHDunchangeda7cecd28.../24.1.0+dfsg1-1ubuntu0.2; nonfree NOTinstalled.
Rawexport100files603815B SHA954119a63aff483af8560775951ad92125057dceb280fcba4691e4b1e472b4ce.
Stored driverBackward* commands. All exec/SSH/browser sessions terminal.
NEXT: source-map+narrowlyprofile observed startup6sdropburst with observercontrol
onprivatehardwarepath; don't inferdesktopblackflashcause. OwnerURL/seekpositions
alreadyasked/unanswered. Desktopprotected; systeminstallneedsnewconsent.
Wave sealed22:30:20.033UTC:58files,80priorfiles+40runtimeinputs reverified;
evidenceSHAf070111c66ce27f098efd5cbfb9cc583bf41aaf2ba6608cc4742aa6389cf3624.
Final6fileformatPASS/docs0problems/diffcheck0. Do not overwrite this namespace.

## October 7 Private Driver Seeking: Forward PASS, Backward Censored

Goal ACTIVE. New wave namespace artifacts/umbralink-control/decoder-driver-seek/.
Two intended runs terminal; no desktop/product/native/default/system-install/
index changes. No agents/compiler/profiler. Report
bot-docs/reports/performance/2026-10-07-decoder-driver-seek.md;
plan bot-docs/plans/decoder-driver-seek.md. Do not retry backward automatically.

Forward JQbs6a PASS21:59:53.185..22:02:41.351UTC. Controller2200747/browser2200759/
RDD2200892/content2200929.156samples,151683msobs/130007postseek,9078frames24drops
ALLbeforeseek6.018s,0misses/lowadvance/counterreset. UI21.238->45.301 target45;
trustedcollectorlatency312ms,sessionlisteners313ms(1msdifferencepreserved).
All5nativehardwaretrue; before shutdown1output is metadata only, later4
ffvpxRDD AV1/1080outputs1533/4126/6826/9327. Final5segmentmaps receipt joins exact
private driver SHA7e14725d...; no continuous/decoderinstance/scanout proof.
36capsPASS/peakRSS2599124992B/artifacts156098856B/log326B0drops. CleanSIGTERM,
all14recordedPIDsabsent22:03:03.701UTC;48filepackagepostflightPASS.

Saved comparison.json: same executable/libxul/INIhashes, fixturehashes and45RPCs
as priorsoftwareforward. All7looseuserlandmodule recordsnull, notloadedproof.
RDDCPUdelta119034ms/155106.12904wall ->11364ms/155113.795018wall =90.45%lower;
content37304->33037ms. N=1noncontemporaneous/descriptive, freshcache+distrodriver
revisionconfound; NOTwholebrowser/GPU/energy/perframe/desktopfix. Formerdrop26/9080
vs24/9078 too weak for smoothnesswin. Ownerblackflash/prolongedstutterunreproduced.

Backward HNGm4l FAIL22:04:34.149..22:05:14.566UTC,40.417s: Lifecycle artifact scan
remained unstable. Controller2203826/browser2203838. UI21.234->5.189,target5;
onlybefore+sparse0 nativehardwaretrue, no130spostseek/finalmaps/close receipt.
Frozen artifactSize retriesENOENT traversal3x thenSTOP; terminal causepath/code
notretained, specificfile/componentunknown. NinepriorcapsPASS/peakRSS2612678656B/
artifacts147745573B/log327B0drops; no acceptanceofunsavedfailedsample. CleanSIGTERM,
all14recordedPIDsabsent22:08:22.283UTC;48filepackagepostflightPASS. Do NOT count
as completedbackward or repeatwithoutreview; failedexport retained623468c8... .

167strictNodePASS(142oldseek+12mapping+13new),7manualJSformatPASS. Sourceinverse
deltas/runtimehashes preserved. Only scratchadapter adds childLIBVA_DRIVERS_PATH,
mappingreadafterexistingfinalperformanceRPC; noMOZ_LOG/LD/sandbox/pref change.
Frozen39file/105edge/35syntax closure archive81786880B SHA840e309a... manifest
b5475c2c...; laptoproot decoder-driver-seek-harness-20261007-E76WHj dev64512/
ino37357497/uid1000/0700. All39remoteinputsunchanged22:08:40.127. SystemiHDstill
a7cecd28.../24.1.0+dfsg1-1ubuntu0.2; nonfree NOTinstalled. Previous51filesealverified.
Initialcomparison failedbecausefreshinstallationpaths differed; savederror then
correctedexplicitperrootpath+hashjoin, noinputchanges. reviewtestkeepshardwarefalse
reportable/rejectsfailedbackward; CPUtestsrejectcounterreset/time/PID/modechanges.

NEXT: bounded error-cause preservation design/tests for unstable artifact scans,
not safety-cap bypass; new closure before next backward/repeat decision. No
pending browser/SSH/test session. All commands retained in stored driverSeek*
and commands.json; evidence.json seals this wave. Desktopprotected; systeminstall
needs explicit consent. ExactownerURL/seekpositionsalreadyasked/unanswered.
Sealed22:15:39.442UTC:80files,51priorfiles+39runtimeinputs reverified; evidenceSHA
326e2ed7cd9de499e7b0ef5cb4cd69fa96eb6d1c7a67bd5b7780959b22850664.
FrozenCPUproducer verifiedHEAD+patch/currentSHA3aaa1ba0...;10rawsnapshots agree
millisecond conversion, clockaftersnapshotreturn. Docsfinal0problems/formatPASS.
No overwrite/regeneration in this sealed namespace. This goal turn PROGRESS.

## October 7 Private Full-Feature Driver Comparison

Goal ACTIVE. One fresh isolated laptop diagnostic PASS; no desktop/product/
native/default/system-install/index changes. All sessions terminal. Full-feature
iHD24.1.0+ds1-1 copied ONLY into fresh private browser installation, child-only
LIBVA_DRIVERS_PATH set to that directory. No LD_LIBRARY_PATH/sandbox changes.
Actual RDD maps receipt joins five segments to dev64512/ino37357475, pinned
36102104-byte library SHA7e14725d1af6a016fda32492cd7daaa33f1e744a36c0b8907ef3bb3a98e6798c.
Browser2194073->fork2194168->RDD2194210 identities bracket read, controller2194061.
After playback native document10737418243/context11 AV1/1080/hardware=true/
1206outputs vs prior softwarefalse. Zero RDD FFmpegLib errors, three utility
warnings retained. Supports driver-variant cause of LAPTOP AV1fallback, NOT
ownerdesktop VP9/seek/blackflash or continuous/exactdecoderinstance proof.
Page1201frames25drops vs prior1199/24: NO measured performance win.

Run laptopcache/laptop-youtube-quality-1080-20261007-qXM2xi;
21:48:00.312..21:48:33.269UTC,32.957sec,20s actualobservation. 770logB0drops,
9capsPASS, cleanSIGTERM/rootAbsent,14recordedPIDs absent21:49:03.826UTC.
39runtimeinputs unchanged; extendedpackagepostflight48files511211099B includes
newdriver+emptyparentlock. SystemiHD unchanged a7cecd28.../24.1.0+dfsg1-1ubuntu0.2;
nonfree package still NOTinstalled. Candidate shares upstream24.1.0 but DIFFERENT
distro revision: no exactsamebuild/one-source-change A/B claim.

Report bot-docs/reports/performance/2026-10-07-decoder-driver-variant.md;
plan bot-docs/plans/decoder-driver-variant.md. Evidence namespace
artifacts/umbralink-control/decoder-driver-variant/; export.json47files171445B
SHAdc6a925ba5fce1f3f3f863d2677b88734b357fb465ad81d0917a4c97060ac396;
analysis d5bd62bd4a608b34a5d23201eabee06e029d9e82b03b4d21f29b07d9194bb092.
Runtimeharness laptopcache/decoder-driver-variant-harness-20261007-hxxB8x,
dev64512/ino37356642/uid1000/0700.39files97edges35syntax;81776640Barchive
SHA9edea29071d57677e52e7c013412c11729cbf8e9157b76d376956b8d561c1a87;
manifest056c3240712422e2ed474bf6eeb45437172cddc9c28f70c4e6465add922a1450.
154strictNodePASS,6manualfileformatPASS.12newtests+142existing; firstRED1real
environmentfailure+5missingmodule, auditREDmissingmodule only, do not inflate.
Scratchvariant.mjs uses original prepareInstallation + exact extendedadmission;
maps operation uses existing performance-after, no extraRPC, handlesforkserver.
FrozenSandboxBrokerPolicyFactory.cpp SHA2985097f... provenHEAD8924318+patch
d1bf3b unchanged; NS_GRE_DIR existingRDDreadtree. Originalrenderer/public untouched.
NEXT: bounded seeking/recovery on verified privatefullfeature route, assesshealthy
hardware path rather than repeatknownSWfallback; preservefixedcaps/cleanup and
sameuidpointintime caveat. Systeminstallation requires newconsent; desktop remains
protected. OwnerURL/seekpositions alreadyasked/unanswered; don't repeatunnecessarily.
Stored driverVariant* commands; commands.json and evidence.json retain/seal.
Sealed21:54:05.444UTC:51newfiles,51priorfiles reverified,39runtimeinputs reverified;
evidence.json SHA8010d5b87b9054bcdc0ba35b0ae8de01db57e817d2eca8a382a33f2e5c0d5aae.
Do not overwrite/regenerate in this sealed namespace. Docs lint0/diffcheck0.
No exec sessions or owned runtime remain; current turn is PROGRESS, not goalcomplete.

## October 7 Narrow Library Error Follow-Up

Goal ACTIVE. One fresh isolated laptop FFmpegLib:2-only diagnostic PASS,
20s ordinary1080 admission, no seek. No desktop/product/native/default/driver/
install/index changes. All sessions terminal; all14recordedPIDs absent21:25:46.179.
1284logbytes/0drops;9resourcecapsPASS;37runtimeinputs unchanged;47packagepostflight
PASS. Run21:24:37.940..21:25:10.736UTC,32.796s. Nativeafter document10737418243/
context11 AV1/1080/ffvpxRDD/hardware=false/1225outputs, pausedafter20s. Page1199
frames/24drops all5-6sec; notcausalerrorjoin/performancecomparison/ownerrepro.

Concrete new boundary: vaEndPicture returns23 internaldecodingerror at
21:24:40.818021 RDD2183122 thread#2 ptr0x7db54eb21400, and21:24:50.336509 thread#4
ptr0x7db54eb14000. Eachfollowed HWaccelendframefail. PinnedFFmpegsource maps this
toEIO; samecurrent12+4ffvpxfiles verifiedfrozenHEAD8924318/patchd1bf3b unchanged.
Process/contextpointerchronology only, notexactdecoderinstance/documentjoin.

Strongdriverlead: savedGPU IntelRPL-P0xa7a0; actualiHDpath ownedby installed
intel-media-va-driver:amd64 24.1.0+dfsg1-1ubuntu0.2; non-free NOTinstalled.
libva2 2.20.0-2ubuntu0.2. iHD13589472B SHAa7cecd28f70fb692a5d65c2de8c491d953bc834dc1c98c4bd93a929ffcc976ee.
Postrunmetadata, notRDDmappedhash. Intelissue1852 sameerror; docPR1853 corrects
AV1free-kernelsupport(filmgrainkernelneeded);capabilityPR1862 laterremovesfalse
advertisementonTGLx/DG2. README24.1 groupsRPLinTGLx; oldAV1tablewaswrong.
Likelylaptopfallbackcause, NOTprovenownerdesktopVP9/seek/blackflashcause.
NEXT: assess SAMEVERSION fullfeaturedriver isolatedowned-process comparison,
firstverifypackageprovenance/dependencies/loader/sandbox; NOsysteminstallwithout
ownerconsent, noforceprefs/sandboxweakening. Do not re-run unchangedAV1 traces.

Newplan bot-docs/plans/decoder-library-errors.md; report
bot-docs/reports/performance/2026-10-07-decoder-library-errors.md.
Evidence artifacts/umbralink-control/decoder-selection-errors/. export.json EMPTY
firstexportcommandargfailure preserved; ACTUAL export-retry.json SHA
d62b1b3ea966da7d6fd4df2786bd8bdbbbe25a0fa98c86b5319542acef353a60,
46files166606B. LogSHA450d766971b8a6ec0483640695343296c3bbb133ad7de95a975240de74966b75.
Harness laptopcache/decoder-library-errors-harness-20261007-nmE2rs dev64512/
ino37355867/uid1000/0700. Run laptop-youtube-quality-1080-20261007-wcXSB8;
controller2182964/browser2182989. Baseline20261006175655 unchanged.
Newscratchadapter reusesoldpinnedprepare/importrelocation, onlyMOZ_LOG+labeldelta.
Olddecoder-selection44fileseal fullyverifiedunchanged. NewanalysisCLIwriteonce,
don'toverwriteexistingartifacts. Stored decoderErrors* functions retaincommands.
Final150testsPASS/0skip/0fail, exact5fileformatPASS/docs0problems. New evidence.json
seals51files and rechecks37runtimeinputs/16sourcefiles; SHA256
d99a41e1b55160035369d1919a08fa5b9aad8039a99e5bc9fe9fe62a24cdbcce.
Sealed21:33:20.109UTC; do not rerunwriteoncegeneration/audit/seal inthisnamespace.
commands.json recordsactualscripts. No commands/processes remain active.

## October 7 AV1 Decoder Selection

Goal ACTIVE. New scratch decoder-selection trace on isolated laptop ONLY,
no desktop/native/product/default/build/install/index changes. One owned
20s quality admission attempt stopped at unchanged1MiB log cap. DO NOT label
PASS: driver failed, run cleanup-failed solely log completeness; owned process
SIGTERM cleanup clean, all14recordedPIDs absent21:11:43.297UTC. No live handles.
No automatic retry/cap increase. Current scope complete; next new decision below.

Concrete retained evidence: RDD2177327 AV1 VAAPI initialized hardware=true,
avcodec_send_packet EIO(-5) at21:11:07.333783 thread#1 and21:11:16.745965 thread#5,
then shutdown and hardware=false/libdav1d initialization. Raw log lines585/1283.
Process/thread chronology, NOT exact decoder-instance/document causal join;
startup capability probes may coexist. Underlying driver/libavcodec error unknown.
Pinned MediaFormatReader Linux fallback matches possible path, not itselflogged.
IMPORTANT repeated Failed-to-copy-image-data warnings are unconditional
MediaResult::Logged wording even on NS_OK; not evidence actual copy failures.

NEXT review narrower FFmpegLib error/warning +MediaFormatReader fallback logging
before one fresh bounded diagnostic. FFmpegLibWrapper forwards libavcodec's
callback via SEPARATE FFmpegLib module, absent in firsttrace. Avoid noisy
FFmpegVideo/PDM perframe debug again, keep1MiBcap/owned120s/15scleanup/profileOFF,
no codec/sandbox/GPU pref forcing, no speculative nativefix. Ownerseek blackflash
stillunreproduced; historicalVP9unmatched. URL/positions alreadyasked, don'trepeat.

Plan bot-docs/plans/decoder-selection.md; report
bot-docs/reports/performance/2026-10-07-decoder-selection.md. Namespace
artifacts/umbralink-control/decoder-selection/: export.json rawSHA
5e233fea887a977ddff0a76f904433c4ec19b13576ac5f4166b26ff30de782ed;
browserlogSHAea2b9a32f175cb37604e409e4fc53d37ebb6a5b8e21574bb58c7615818840ebb.
1048499retainedbytes/818dropped.40exportfiles1180131B. Run21:11:04.338..31.912,
27.574s.7resourcescapsPASS/RSS2431307776(sharedcounts); packagepostflightPASS.
Onlynativebefore paused/shutdown/AV1/1080, no completedpageobservation/after.
Original source/exports/failed statuses immutable; audit.mjs CLI write-once.

Laptopharness /home/wyatt/.cache/codex/decoder-selection-harness-20261007-A45d28,
dev64512/ino37355734/uid1000/0700;37files93edges34syntax. Archive45660160B
SHA82e2fa89dbfba09f0a634f1fed160a6f156a864c7c1d110df82426ecaa36e00b;
manifest7e755608bfb8533c3f04a94b06cbf5be723673c485a122c0f6d1231473b45800.
Preflightbusy[]/headroomPASS;37postflightunchanged. Run root laptopcache/
laptop-youtube-quality-1080-20261007-1LCb31;controller2177185/browser2177197.
Samebaseline Build20261006175655 in producer-fence-playback t27Mxk/baseline.
Scratch generated3modules retain pinned capture/youtube/quality code and
ASTrelocatedimports; onlychildMOZ_LOG timestamp,FFmpegVideo:4,PlatformDecoderModule:4
+reportdiagnostic insertion. Defaults/profileprefs identicalpriorcapture.
12sourcefilesverifiedexportHEAD8924318+patch d1bf3b...; no currenttip assumption.
Final152testsPASS incl10new, exactformat/doclint0. Storeddecoder* functions
retain bundle/preflight/launch/export/source/safety/postflight commands.
Final evidence.json verifies44files plus37unchangedruntimeinputs; SHA256
ebca6fb1bfdf82c43eefc7f9f8cef6b148e380b46cb798ab1b747e6878798fcc.
commands.json preserves replay provenance; do not rerun any write-once capture,
generation, audit or seal command in this sealed namespace. All sessions terminal.

## October 7 Long 1080p UI Wave

Latest goal ACTIVE. Completed V20 ui-forward-1080 and ui-backward-1080 on
isolated laptop. All sessions terminal, all14 recordedPIDs absent perrun.
No daily-desktop/native/product/default/build/install/index changes or agents.
Owner "searching" means progress-bar seeking. Neither newcapture reproduces
the prolonged stutter/blackflash. NEXT match owner stream/codec/seekpattern,
not unchanged single-click AV1 repeats or speculative native fix. URL/positions
already requested asynchronously, unanswered: do not repeat or mark whole goal
blocked. Daily browser requires agreed heads-up/consent before interference.

Newscratch modes reuse select1080Quality+waitForQualityPlayer beforebaseline.
Same64RPC/240total/225work/238cleanup/240final and185s presequence reserve;
>=130s after observedseeked. Initial page/native +firstsample1920x1080,
laterformats preserved. getStreamingMode normalizedenum reusedhost/reviewer/
timeline; reviewQualityPreparation reusedrawqualityproof. OldAuto/direct/probe
outputs exactunchanged.3qualityclicks separatelychecked from1progressclick.
No hiddenAPI/pref/codec/GPU/extension/login/adskipchanges, profilerOFF.

V20root laptopcache/youtube-recovery-v20-harness-20261007-2AGoJA:
dev64512/ino37259284/uid1000/mode0700.33files75edges30syntax;
archive1a4e8ca773ae1858911cc8a0cfd00a3457774b64d3e68d8f3ceb577b50a6f528,
manifest9951ca2118fe6a245ffe17eaaa56e283a3aa0982d02084ee6b4c125abde686ad.
Same baseline producer-fence-playback-harness-20261007-t27Mxk/baseline,
Build20261006175655. Failedproducerfencecandidate NOTpromoted.

Forwardroot laptop-youtube-ui-forward-1080-20261007-fsvdVZ,
20:47:41.529..20:50:29.421UTC;absence20:50:36.849.151778ms/130008post,
156samples0missed/all1080;9080frames26drops.25dropincreaseat6017ms BEFORE
seek21384ms;1at45022ms.385msseek21.254->45.220s. No laterdrops,lowadvance,
counterresets;minbuffer15.010s/ready4.45RPCs/36resources;RSS2710454272B,
artifact158855408B.102exportfiles SHA
d2a57882b2069a28e98659eeb49fd27197f296cf696a91ead3395f638ec67fb3.

Backwardroot laptop-youtube-ui-backward-1080-20261007-WhgI8i,
20:51:40.991..20:54:28.972UTC;absence20:54:36.327.151472ms/130008post,
156samples0missed/all1080;9079frames3drops at45019/55018/72024ms, nonebefore
seek.81msseek21.261->5.189s. No lowadvance/counterreset,minbuffer15.010s.
42RPCs/36resources;RSS2713964544B/artifact174171518B.99exportfiles SHA
778e3ed9e746ec979e93578725787e50d91d5a78817ea95e2cdda14066c6a3e8.

Both nativebefore decoder shutdown/retainedAV1metadata;later4snapshots ffvpx
softwareAV1/RDD. Decoder/sinkdrops0;compositor/container26/3, NOTcausalGPU
attribution.5stableparent/content/RDD snapshots notcontinuousresetproof.
CleanSIGTERM271B0logdrops,47filepackagepostflightPASS/nativebeforeafterPASS.
Exports under artifacts/umbralink-control/seek-recovery/ named
laptop-youtube-ui-{forward,backward}-1080-export.json;derived
youtube-ui-{forward,backward}-1080-{analysis,timeline,process-joins}.json.
Sameharness N1/direction, notstatisticalA/B. OwnerhistoricalVP9 notmatched.

Storedfunctions youtubeBundleV20/youtubeV20Preflight/youtubeV20Reuse/
youtubeV20Root/youtubeQualityLongLaunchV20/youtubeQualityLongBackwardV20/
youtubeQualityLongExport. Final171PASS/0FAIL(4.463s), exact8fileformatPASS,
docs0problems. Testsreplaybothnewactualanalyses/timelines/joins +oldoutputs.
Finalseal quality-long-final-evidence.json; same plan/report paths. Earlier
quality-long-evidence.json preserved pre-handoff-header correction snapshot.
Finalinventory106files SHA
d331d76ca54dddf7366c15bbf52038a15a8a11cf7eb345b0827603322661ff2c;
reread/allhashes +33currentruntime inputs matchV20. Allcommand sessions terminal.

## October 7 YouTube 1080p Admission

Latest goal ACTIVE. V19 quality-1080 admission PASS; no native/product/default/
build/install/index or daily-desktop changes. All capture/export sessions terminal,
all14 recordedPIDs absent perattempt. NEXT explicitly labelled long1080p UIseek
with existing130s postseek window; current20s admission is NOT a seek/recovery test.
OwnerURL/positions requested earlier unanswered; do not repeat question.

Scratch seek-recovery/youtube-quality.mjs uses ordinary visible Settings/Quality/
1080p60 nativeclicks, bounded10reads/stage,3clicks,20x250msmediareadiness.
No hiddenplayerAPI, codec/GPU/browserpref or extension changes. youtube.mjs new
quality-1080 CLI and optional expectedDocumentID for captureAdmission. OldAuto/
UI/direct contracts unchanged. Same120s envelope; immutable freshowneddirs.
qualityPoint/waitForQualityPlayer/select1080Quality exported for next integration.
No nativeafterroots in this short adapter; beforeonly. Longcaptureretainsitsown.

Failures preserved: V17 y0akXd movingmenu hitfalse, noresolutionclick/play;
V18 C9rlyX clicked1080p60 thenready0/nullmetadata, noplay. EachcleanSIGTERM271B
0logdrops/packagepostflightPASS/all14PIDsabsent. Rawexports filenames
laptop-youtube-quality-1080[-2]-export.json. Regressioncorrectedpendinghitwait
andboundedmediawait; no native/mediafixclaimed. All3originalstatusesretained.

V19PASS root laptop-youtube-quality-1080-20261007-jyO18k underlaptopcache.
20:30:35.178..20:31:08.099UTC;absence20:31:24.223. Samebaseline
producer-fence-playback-harness-20261007-t27Mxk/baseline Build20261006175655.
1920x1080 all21samples,20.001s,1199additionalframes25drops,0missed. All25drop
increasewithin5.001..6.002s sampleinterval,noneafter. AfterpauseAV1/ffvpxsoftware,
decoder/sinkdrops0,compositor/container25. NotGPUcausation orphysicalflashproof.
17workRPC,6setup,9resources,peakRSS2600779776(sharedcounts)/artifact91905784B.
3clicks,menu1/2/4reads,media2reads. CleanSIGTERM271B0drops,packagePASS.
Export47files SHA841a967d61a64dcd28111eb6d74c462f32fa21acf6c82f3a5d6807615c46d6e2.
review-quality.mjs exportsreviewQuality; outputyoutube-quality-1080-analysis.json.
169PASS quality-ui-wave-tests.log includesactualexports+corruptionnegatives.

V19harness youtube-recovery-v19-harness-20261007-uwqgPj underlaptopcache:
33files74edges30syntax/archive45608960B,
archive5ec24104b4df99d1e47be50781ec72cc78d9c3987c928916d97f76ab5596e114,
manifestc1b7318ce26f52462cfecb808ad30f630b70970c72dad058c6d2965a73f8525c.
Storedfunctions youtubeBundleV19/youtubeV19Preflight/youtubeV19Root/
youtubeQualityLaunchV19/youtubeQualityExport retain scripts. Priorarchives
remain immutable. Qualityflagsubsetonly, profilerOFF. ActualownerVP9notmatched.
Plan/report same seek-recovery paths; quality-ui-evidence.json finalinventory.
Finalseal112files SHA7606c6a2ae20e284c57ef49949e55bf3a63f4d2acb7cbec65d0308deac1eb390;
all33runtimeinputs matchV19, inventory reread/hashPASS. ScopedformatPASS/doclint0.
All command sessions terminal. Next longqualitycapture not yet implemented/run.

## October 7 Full Actual Progress-Bar Wave

Latest: isolated laptop actual UI forward/backward captures complete. Goal
ACTIVE. All commands terminal; all14 recordedPIDs absent perattempt. No daily
desktop action, native/product/default/build/install/index changes or agents.
Owner clarified progress-bar seeking, not search-box input. NEXT match affected
video/stream/seek pattern; historical owner VP9/1080p60 is still not matched.
URL/positions already requested, no answer. Do not repeat unchanged480p captures
or invent a native fix. Keep owner browser protected; no restart/tab/extension
changes without agreed heads-up/consent. Current tests are clicks, not dragging.

Scratch artifacts/umbralink-control/seek-recovery/ adds ui-action.mjs and tests;
sequence optional7th callback, version2/inputprogress-bar, seekingAt/seekedAt,
130s anchored to observedseeked. Defaultversion1/direct unchanged. Private
session exposes actionPending onlyUI. Host/CLI ui-forward/ui-backward use same
240total/225work/238cleanup/240final,210sessionwatchdog,32session/64workRPC caps.
Existing shared directional capture mode is budgetlabel only; driver/streaming
retainui-prefix. Observer never assigns currentTime. Hiddenlong controls use
one2point100msmove; visiblepath/shortprobe unchanged. Exact samevideo/document,
trustedorderedpair, geometricallyvalidatedoneclick, no fallback/retryclick.
Analyzer/timeline accept distinctUI; old5analyses and3timelines unchanged.
157testsPASS ui-wave-final-tests.log; scopedformatPASS. Fullreal/syntheticUI,
failure-at-every-RPC/write, timeouts/abort/late-rejection tests covered.
Final ui-long-evidence.json seals146files; all32current runtime inputs matchV16.
SHA597e486f0ed2d1a03f6939dce104958e72921f288ee4997d0bad39b7ceccdbb9.
Inventory reread/hash verification PASS; doclint0; no capture/lint session active.

Preserved failures: V14 forwardE4NgGr hiddenbar aftersinglemove, no click;
V15 backwardJoQL2F clicked4.821 thenobserveraborted duringseeking, genericoperation.
Exactfailedliveflag unrecorded. Source SeekStarted queues event; decoder can
clear flag before delivery. Failing-first queued-seeking and generatedframe
tests now allow typedfalse atseeking, retain trustedpair/settledtarget. Also
fixed staleclose readingstate beforepause whensequencealreadysettled. Neither
is native/mediafix. Bothfailedexports havecleanSIGTERM271B0drops,postflightPASS,
all14PIDsabsent; originalfailedstatus and failedcloseack preserved.

PASS forwardV15 root laptop-youtube-ui-forward-20261007-haBFOB:
19:59:47.685..20:02:34.705UTC,absence20:02:45.858.151556ms/130007postseeked,
21.376->45.220s,71ms eventpair,4543frames0drops,156samples0missed.
PASS backwardV16 root laptop-youtube-ui-backward-20261007-dhXbHU:
20:08:36.160..20:11:23.215UTC,absence20:11:39.290.151499ms/130009postseeked,
21.340->5.234s,3mscollector/4mslistener pair,4543frames0drops,156samples0missed.
Bothsamebaseline Build20261006175655 input producer-fence-playback-harness-
20261007-t27Mxk/baseline; AV1/854x480/software atall5decoderCP. Five native/
process/tabchecks,31workRPC,36resource samples,peakartifacts165276323/161674377B.
No samplednonseeklowadvance/counterreset; stablecontent/RDD at5CP only.
CleanSIGTERM271B0drops,packagepostflight/nativebef-aft/all14PIDabsencePASS.
Notphysicalblackframe/scanout/audio/network/GPUproof orsame-harnesscostA/B.

Exports laptop-youtube-ui-{forward,backward}-2-export.json,88allowlistedfiles
each; SHA forward0926c3f3ce7b820f3e5fc9ea7e0a34709f1257e79c361ec66bbbaec9e78380d9,
backward54b1f06b9e38904176ef128a3eca22986c6cc4f72f8469c21cc98b70ae389902.
Failedexports samenamewithout-2. Derivedyoutube-ui-{forward,backward}-
{analysis,timeline,process-joins}.json. ExistingV13short/oldwave preserved.
V16harness /home/wyatt/.cache/codex/youtube-recovery-v16-harness-20261007-4Yjtal;
32files71parsededges29syntax,archive433a9bca91dee760b5c6fc7b23b90d63097dc0f17a578f0be9a0119cac272f12,
manifest6c98b144f9a61c04b14b1af86927596489b3a870aad497f97618c89d05ad3d26.
V15forwardharness CjWtD9; V14failed gamuMw, priorarchives preserved. functions
store youtubeBundleV16/youtubeV16Preflight/youtubeV16Root/youtubeRecoveryExportV14
retain scripts; exportallowlist includesUI longmodes, omitsprofile/token/appdata.
Plan/report bot-docs/{plans/seek-recovery.md,reports/performance/2026-10-07-seek-recovery.md}.

## October 7 Actual YouTube UI Probe

Latest: actual progress-bar short probe PASS on isolated laptop, goal ACTIVE.
All commands terminal; all14 recordedPIDs absent perattempt. No daily desktop,
native/product source/build/default/quality/extension changes or gitindex work.
Owner means progress-bar seeking; full actualUI >=130s recovery still NEXT.
Do not relabel control results: validateSeekResult(control) forbids seek events.
Preserve explicit actualUI action clock/identity in future long contract.

Scratch seek-recovery/: new youtube-ui.mjs +test/youtube-ui-spec.mjs; modified
youtube.mjs parser ui-probe, youtube-session.mjs identity/close guards,
youtube-recovery.mjs shortintegration/event-aware validateProbePartial export.
Default direct modes unchanged. Existing native input.click, exact visible
slider/hittest/geometry,45s target,once only; initiallyvisible bypasses move.
Hidden bar gets one move/max10readiness reads. Max10postreads100ms; pending
seeking+readyState1 allowed but not success; pausedclose may have metadataonly.
No newpageglobals or product APIs. 140source/hosttestsPASS then2analysischecks;
final combined142PASS log youtube-ui-final-tests-2.log;10fileformatPASS/doclint0.
Analysis now supportsui-probe,
reproduces5savedresults,7corruptionnegatives+3originalfails reject.

Runroots prefix /home/wyatt/.cache/codex/laptop-youtube-ui-probe-20261007-:
V10 JhVHQ2 failedhiddenafterunnecessarymove(no click); V11 b0sPly reached45.220
thenfailedpremature readiness check; V12 KxcBu9 completed113msseek thenfailed
sample3008!=event3189 assertion. Allfailedartifacts untouched, eachchanged
assertion regression-tested. V12 actualrawdata revalidates, not retroactivePASS.
V13 wVxCG7 fullPASS19:32:55.310..19:33:10.676UTC;14PIDsabsence19:33:20.025.
Oneclick(88.700,504),2.988->45.261s,seeking/seeked113ms,3geometryreads,
16workloadRPC/2native-process-tabCP/5resources,profilerOFF,cleanSIGTERM271B0drops,
46packagefiles unchanged. Peakartifact80777842B/RSS2462744576(sharedpagesdoublecount).
StillAV1/854x480/softwareffvpx; shortUIproofNOTstutter/blackframe/GPU/networkproof.

V13 harness /home/wyatt/.cache/codex/youtube-recovery-v13-harness-20261007-r21g8Y,
31files70parsededges28syntaxchecks45588480B; archiveSHA329d6e930f3fd6cf9eafe419b2ef4b86a35ef6a9e706e83ddd2a13de0b9e564e,
manifestde490ca98e8d908001751b2a522c6a5cd0a429836a5885c534303d3815486e01.
Sameinput producer-fence-playback-harness-20261007-t27Mxk/baseline Build20261006175655.
Export laptop-youtube-ui-probe-4-export.json43files143898B SHAb9a82324ea6acb8bb54fc1c3babcc230327ea790c7717a3c121ce88af8fe0d02.
Derivedyoutube-ui-probe-4-analysis.json. V10validexport is
laptop-youtube-ui-probe-export-2.json (firstCLIargfailure preserved); V11/12
laptop-youtube-ui-probe-{2,3}-export.json. All embeddedhashes/PIDs checked.
Report/plan updated; oldwave evidence inventory is historical, not rewritten.
Store youtubeBundleV13/youtubeV13Preflight/youtubeV13Root/youtubeRecoveryExportV10
contains generation/preflight/export scripts. Remoteexports omit profiles,tokens,
appdata,tempdirs. Do not repeat shortprobe unchanged for a favorable number.

## October 7 Continuous YouTube Session

Current work: private long-sequence integration implemented; short cancel probe
and all3 fullcontrol/forward/backward PASS. All command sessions terminal;
all14recordedPIDsabsent perrun. Goal ACTIVE. No product/native source/build/install/desktop/index
change. Existing isolated laptop authorization; daily desktop untouched.

Scratch seek-recovery/ youtube-session.mjs +youtube-recovery.mjs and theirspecs;
sequence.mjs optional explicit adaptive guard (direct1080p default unchanged);
youtube.mjs fixed admission/probe/control/forward/backward modes. Shared harness
unchanged.129focused/integrationPASS youtube-probe-partial-green.log;8file
PrettierPASS youtube-v9-format-check.log. Private frame-script keeps real
doc/video references,210s watchdog,2s close bound,32orderedrequests,4partials,
512KiB replies; short6/7/8s native/client/host RPCs. Actual generated source
all3fullschedule+cancel fakeclock PASS. No new public/page APIs. BindingRED and
partial-abortRED retained; no Firefox binding bug or product fix claim.

V9 root /home/wyatt/.cache/codex/youtube-recovery-v9-harness-20261007-rQFUGK,
archive7f96aa2ca276da50c41bac58077dd7faa0b1b97a54f60dbc8b5ee281f4f79bb8,
manifestc2be728cb1eabd53951993282576d40462b3fae415e5b6ba485e16b419e5dc3c.
30files/68parsededges/27syntaxchecks; all archive/local/remote hashes match.
Same pinned packageinput producer-fence-playback-harness-20261007-t27Mxk/baseline.
V8 failedprobe sJYqNr: incorrect host emptysegments assertion, actualclose clean,
all14PIDsabsent; preserved export/logs. V9 correctedprobe5ULKog PASS,2.9516s
advance,1partial,12RPC,2checkpoints,before/after nativeroot/build receipts,5resource
checks,cleanSIGTERM/271Blog/0drops/packagePASS/all14PIDsabsent18:56:03.200Z.
PostpauseAV1/854x480/softwareffvpx,1compositordrop NOTperf verdict.38fileexport
cdee61ccb4e1a17f763343d762f05f5a7103e44385ebbfc04518e35a262bab43.

Completed wave roots laptop-youtube-{mode}-20261007-: control6Hcx6R,
forwardQWQqyG,backwardaqhVxk. Each150s/130.019safteraction/154samples/0missed,
5native-process-tab checkpoints/24workloadRPC/36resources. Frames4500/4498/4499,
drops10/0/0; control10drops by6.019s thennone. Seekeventlatency66/40ms. AllAV1
854x480softwareffvpx,allready4; no >=0.5snonseekinterval advanced<halfwalltime.
4-7mssegmentboundarygaps retained/notstalls. No prolongedrecovery reproduced.
Samecontent/RDD PID across5CP percase; not continuousresetexclusion.
Before/after native roots/build/profilerOFF, caps, cleanSIGTERM/271Blog/0drops,
packagepostflight PASS; all14PIDsabsence19:00:19.514/19:03:36.153/19:06:58.968Z.
Each81allowlistedfiles,allhasheschecked; exports controlSHA dc8335bf40b49db7,
forward700b91ee248fd575,backward7e90f5b31ec9ec3e (fullinreport/analysis).
Derived laptop-youtube-*-analysis.json, youtube-*-timeline-reviewed.json and
youtube-*-process-joins.json. Peakartifact163498950/163784458/149583165B.

NEXT actualYouTube progressbar interaction and better streammatching. Firstwave
sets currentTime directly, NOTUIclick/drag; lowressoftwareAV1 notownerhistorical
VP9/1080p60 or samebuild/extensions. Ownerasked forURL/seekpositions, noansweryet.
Do not claim fixed, GPUreset, blackframe/scanout/audio/network proof. No identical
favorable retry/profiler/speculativeprefs. Fullseek240s capture/225work/238cleanup/240final;360driver400SSH.
functions store youtubeV9ReuseGate/youtubeRecoveryExport/youtubeSavedReview holds
verified script strings; re-read if lost. Old reports/archives unchanged. Current
report/plan includes fullwave. Original failed shortadmission and cancelprobe
preserved. No runtime remainsactive. Saved review-youtube.mjs/timeline-youtube.mjs/
process-joins-youtube.mjs reproduce10derivedoutputs exactly and reject7corrupt
copies, log youtube-wave-review-checks.log. Final evidence inventory is
youtube-wave-evidence.json; docs lint youtube-wave-final-doc-lint.log.
No whole-goal completion; next actualUI and streammatching as above.

## October 7 YouTube Short Admission

Latest continuation completed short owned laptop YouTube admission, not a
product fix or seek-recovery reproduction. Goal ACTIVE; all command sessions
terminal, no owned browser remains. Daily desktop untouched. No profiler,
native browser build, daily installation, index/stage/commit or new agents.
Owner clarified progress-bar seeking. Asked asynchronously for affected video
URL/seek positions; continue authorized isolated laptop work meanwhile.

UNSEALED artifacts/umbralink-control/seek-recovery/youtube.mjs +
test/youtube-spec.mjs. Same pinned baseline Build20261006175655 and manifest
09261b9b..., remoteinput producer-fence-playback-harness-20261007-t27Mxk/baseline.
Fixedpublictarget https://www.youtube.com/watch?v=aqz-KE-bpKQ . Fresh owned
installation/profile/appdata/localdata/temp, no login/adskip/quality/extension/
GPU tweaks. Headed20s muted playback NOSEEK; existing120s total/105swork/15scleanup
and256MiB artifactcap; driver360s/SSH400s external watchdogs. Five workload RPCs
plus setup/shared receipts. Native directory receipt BEFORE ONLY, after startup;
not native before/after, no-earlier-access, network or transient-helper proof.

Firstrealrun7G7m9G failed because client control.request default15000ms wrapped
20scollector despite native27000. Preserved laptop-youtube-admission-export.json
and stdout/stderr. Clean SIGTERM/packagepostflight/all14recordedPIDsabsent.
Not browserfreeze proof. youtube-timeout-red.log5PASS1FAIL, green107PASS.
Scratchwrapper explicitly sends native27000/client28000/host29000 forcollector;
no shareddefaultchange. Six focused tests actualpagebody+collectorVM, success/
playreject/hungplay4s/replacement, allRPC/writefailures, malformed/ad/foreign/
document/profiler negatives. Prior replacementRED retained. Both newfiles
explicitPrettierPASS; source unchanged after archive/runtime.

V5archive45547520B SHA6d8b6580c1f4f1df590089c9b2b296f653677110564cea6ad0634d3d2337e732;
manifest4b2dc84e33635fdcaa919604402cf4bc488dcb9de3e6e4ca1b57ffd6302ec39d.
All28source/archive/remote files match;24mjs syntaxPASS. Old48edge list inherited
fromV3 is NOT fullV5 edgecount; addedmodule imports checked separately.
Remote /home/wyatt/.cache/codex/youtube-admission-v5-harness-20261007-cFcuDh,
uid1000/mode0700/dev64512/ino37237898. Preflight12.8GBavailable/50.3GBdisk,
nobrowser/buildbusy. youtube-v5-remote-preflight.json retained.

Correctedrun /home/wyatt/.cache/codex/laptop-youtube-admission-20261007-E0nVro:
PASS18:19:59.278..18:20:31.302UTC.20.003s/21visible/0missed/600frames0drops;
all854x480/rate1/ready4/noobservedevents. PostpauseffvpxRDD/video-av1/
hardwarefalse/612output/0nativedrops, NOTintervalwidedecodertrace. Pausedbefore
shutdown isnotresetproof. HistoricalownerVP9/1080p60 NOTmatched. No physical
pixel/audio/networktiming orcontinuousad-statecapture/zeroobservercostclaim.
9resourcechecksPASS peakRSS2368172032B/artifact154523621B. CleanSIGTERM/271Blog/
0drops;46originalpackagefiles postflightPASS(47includingallowedlock). All14
recordedPIDsabsent18:20:38.720UTC, including controller2087758/browser2087770.
Context11/doc10737418243. Export34files133545B, no profile/token/appdata/temp.
laptop-youtube-admission-2-export.json SHA711a0fa34f2083fbfd183cbd01fa35b5ddc4eb91f78cdaf17e0f53a111bf0ef2;
all embedded hashes checked. youtube-admission-analysis.json/review.log derived.

NEXT: external-page longseekintegration still UNIMPLEMENTED. Reuse ownership,
fixed named240s budget, >=130safterseek/partialevidence/nativejoins; do not
reuse directfixture fixed1080p or loopbackPOST assumptions onYouTube. Shared
request max60s, so single150sinjectedbody invalid. Need testedsegmentation or
existing privileged bounded ownership route for continuity; no newpublicAPI.
Keep profilerOFF/no speculativeprefs, captureactualformat/buffer/decoderchanges.
Plan/report updated. Prior AVCwave3x150s0drops and sealedfencebenefitFAIL unchanged.

## October 7 Seek-Recovery Laptop Runtime

Latest continuation completed actual isolated laptop smoke + fixed control,
forward, backward wave. Goal ACTIVE; no product fix or daily desktop action.
All commands/process sessions terminal; owned browsers clean SIGTERM, zero
log drops, package postflight PASS and all12 sampled/controller PIDs absent
per passing run. No profiler, native browser build, install-to-daily, index,
stage or commit operation. Laptop runtime authorization remains in force;
desktop requires heads-up/consent and is untouched.

Artifacts under unsealed artifacts/umbralink-control/seek-recovery/. First
smoke MEAur8 failed BEFORE launch: provenance runtime reads omitted3fixture
files. V2 includes index.html/fixture.css/fixture.mjs,27files. Second smoke
v9LZwR failed actual collector read: corruptedVideoFrames unsupported. Source
Searchfox VideoPlaybackQuality.webidl has total/dropped only; narrow scratch
collector+validator now nullable corruption counter, strict required counts.
Two behavioral REDs retained quality-red.log,72focusedPASS; full final411PASS
runtime-final-tests.log,explicit4filePrettierPASS. Source changes only2scratch
runtimefiles+2specs this turn. Browser interface/defaults unchanged.

Smoke3 Yi6Xb9 PASS proves actual null counter/advancingvideo/hardwareAVC and
cleanup. V3 archive SHA e2147203c703f50b6cf1f09fcff6ce3e119079d46693acd34c075c43f245a9e5;
manifest e416051ec36730bdb07b465f8e553b48a9224b9a66b80bec6c99144366ef9f84.
All27local/archive/remotehashes verified,23JSsyntaxPASS. Remote harness
/home/wyatt/.cache/codex/seek-recovery-harness-v3-20261007-xUGaVf
uid1000/mode0700/dev64512/ino37235707. Input unchanged old remote baseline
/home/wyatt/.cache/codex/producer-fence-playback-harness-20261007-t27Mxk/baseline
Build20261006175655/manifest09261b9b...,46files. No fencecandidatepromotion.

Runs roots /home/wyatt/.cache/codex/laptop-seek-recovery-{mode}-20261007-:
controlYtJzYu,forwardl9SaW5,backward8MduJO. Explicit driver360s/SSH400s watchdogs.
Eachfreshinstallation/browser; NOrestartwithinseek/recovery. Local allowlisted
exports laptop-{mode}-export.json hashchecked, no personal/profile/token/temp/
appdata contents exported. Derived laptop-{mode}-analysis.json and independently
revalidated wave-summary.json/wave-review.log.24RPC/5checkpoints/154samples/
35resources each. LateCPstarts<=2.3ms;zero missedintervals;allprofilerOFF.

Control150.076s/4501frames0drops;forward150.056s/4497frames0drops,80msseek;
backward150.108s/4498frames0drops,73msseek. Afteraction130.062/130.042/130.079s.
No prolongedstutter reproduced. Rewind produces one expected negative-time
lowadvance flag, preserved not counted asstutter. Same content/RDD PID per
case across5snapshots. ActiveFFmpegRDD/hardwareAVC1920x1080,zero native drops.
Pausedbefore says decoder shutdown: not a runtime reset inference. Peakowned
summedRSS~1.82GB/sharedpagesdoublecount;artifacts~145.9MB safetyonly.

NEXT: actual owned laptop YouTube streaming workload; identify codec/resolution/
buffer/decoder transitions aroundseek first, profilerOFF, no speculativepref/
extension toggles. Match owner's affectedvideo ifavailable. Silent directAVC
baseline not asserted same asdailybrowser or YouTube; no physicalscanout,
blackpixel, audio, reset, or no-observer-overhead claim. No desktopattachbehind
owner'sback. Detailedreport and plan updated. PriorsealedfencebenefitFAIL unchanged.

## October 7 Seek-Recovery Host Integration

Latest continuation is PROGRESS: named host budget/capture/driver and verified
local runtime archive, not a browser performance fix. Goal remains ACTIVE.
No browser/SSH/profiler/deployment/daily-profile/index/staging operation. All
test/lint sessions terminal; no handles left. Earlier broad403-test command
also compiled/executed existing standalone C++ DMABuf/import/fence test harnesses,
not a native browser build. Final narrower408PASS excludes those native specs.

Shared edits ONLY tools/umbrafox/tests/readback/capture.mjs + its capture spec:
createSeekCaptureBudget225/238/240s, explicit capturePlan seek-recovery only
headed-seek-recovery-{control,forward,backward}, no timeout override/profile
artifact allowance. Old30..120s semantics untouched. Budget now passed as7th
capture callback argument, ignored by existing callers. Terminal write error
RED fixed: preserves first error and removes SIGINT/SIGTERM handlers in finally.
No product/public API/default changes.

New scratch seek-recovery/capture.mjs +driver.mjs and their specs. Full capture
requires>=165s work before start, saves raw then validates four progress/terminal
joins. Five bundles: before, host-start+21/65/110s, after; page clock/document,
native decoder, process+profiler, selected tab, with host RPC intervals. Native
directory/build receipts before/after. Slot>5s late fails; early result/abort/
RPC/write fail closed. Do not treat host offset as exact action time or mix
page/performance clocks. Decoder hardware/name changes not automatically fail.
Smoke separate60s mode: readiness +1s playback/actual collector, no complete
bootstrap sequence claim. Unchanged caps/private roots/owned cleanup reused.

Driver only wyatt-laptop DISPLAY=:0, pinned baseline Build20261006175655,
manifest09261b9b755eb2295aa92393ddaab215ab8936cb79ebd27699ab8695ca3d1eae.
No GPU import override/failed fence promotion; not asserted equal to owner's
daily installed build. Uses prepareInstallation/runStartupPilot and existing
postflight. Explicit EXTERNAL driver360s/SSH400s required at launch; limits
object alone is not a watchdog. Existing220/240s wrappers invalid forlongcase.

Tests host-final-tests.log408PASS/0skip (~11.8s), registered exact2file lint0,
explicit PrettierPASS. Includes fake RPC/every-write failures, legacy budgets,
oversized1.6MB fixture ->finalrun stillwritable in2s reserve, lateclock/abort/
identity/crossjoin negatives; real loopback/tempFS/harmlessNodechildren too.
Not Firefox evidence. REDs host-budget-red (one behavior+missing helper),
capture-red/driver-red (missing scaffolding), terminal-cleanup-red realbug.

UNSEALED namespace artifacts/umbralink-control/seek-recovery/ remains active.
Local host-runtime-inputs.json24files48edges45505188B includes static+literal
dynamic imports and actual served modules/media.23modules node--checkPASS.
host-runtime.tar45527040B SHA
a3c39d88e739abc7704c0b31e0eab08c0b658a38930f742ed4bb99ce1128bfd4;
manifest SHA d1a38bc95228d637ee6494ab116059b5bfff0d899d64977b833ffdd27f5cf134.
Source+archive independent byte hashes PASS host-archive-verify.json.
Two initial scanner errors retained (one syntax, one literal-import gate);
both fixed before manifest emitted. Archive not deployed or transferred.

NEXT: reverify archive/source hashes, locate pinned baseline from sealed prior
pair/remote receipts (do not edit sealed namespaces), preflight laptop/owned
identity, transfer new private harness and verify24files. Run ONLYsmoke first
under correct watchdog, inspect failure/success/native/cleanup and installation
postflight plus explicit recorded PID absence. Then fixed control/fwd/backward
long wave with no restart midsequence/no profiler/no favorable retry. Record
current host state, artifacts, partial errors. Actual stutter stillunreproduced,
blackflashnotresetproof, ownerdaily protected. Plan/report updated; prior
producer-fence benefitFAIL remains unchanged. Static archive would become
stale after any runtime source edit: regenerate/reverify before launch.

## October 7 Seek-Recovery Fixture And Media

Latest goal continuation made engineering progress, not a browser fix. Goal
ACTIVE; owner clarified progress-bar seeking, not YouTube search. No browser,
SSH, profiler, native build, deployment, personal-profile, index/stage/commit
operation in this phase. No live tool/server handles remain. Daily desktop is
protected; isolated laptop runtime remains authorized after the gates below.

UNSEALED scratch: artifacts/umbralink-control/seek-recovery/. Added server.mjs,
bootstrap.mjs, validation.mjs, media-proof.mjs and mirrored test files. Updated
sequence.mjs/spec for partial publication and exact post-action duration.
Collector source unchanged. Plan/report:
bot-docs/plans/seek-recovery.md and
bot-docs/reports/performance/2026-10-07-seek-recovery.md.

60 strict Node tests PASS:18 collector/19 sequence/13 HTTP server/4 bootstrap/
4 validator/2 media-proof. Logs fixture-final-verification.log,
fixture-final-format-check.log, fixture-syntax.log. All13mjs syntax/explicit
Prettier PASS. VM bootstrap uses actual source+real HTTP+fake sequencer;
separate actual collector/sequence integration uses fake video/clocks.
Neither proves Firefox media/DOM/GPU behavior. RED preserved for fractional
setup shortening130s after actual seek, and close during partial result body.
Final segment now40..50s, ceil residual to action+130000; first3 remain20/45/45.
Hung/failed publication stops before another action; late rejection handled.

Loopback127.0.0.1/random32hex path/exactHost/CSP, one start/result, four progress
receipts published BEFORE sample validation. Limits128requests/8connections/
4bodies,4KiBready/64KiBprogress/1MiBresult; media<=64MiB, scheduled responses
<=min(256MiB,4*media+64KiB). Not measured wire bytes. Snapshot retains parsed
raw failures; result promise is transport only, NOT scientific PASS.
validateSeekResult strictly checks schema/types/clocks/action/seek events/
observed130s/cleanup, but host must join progress and native identities.
Bootstrap owns page AbortController/210s timer; page timers not OS watchdog.

Verified video-180.mp4:45212087bytes SHA256
585de5a1064ad6dfd7f365346a3c3b11b68ebcf1e94c9b9ba4da7040ee190e97.
H264High/yuv420p/1920x1080/30fps/180s/5400frames/noaudio. Existing ffmpeg
stream-copy repeated original90s clip, no reencode. Source SHA
aac5b2c571eff675332728d94291137bf184c41644d7beb6f8467fee05907d27.
Exact compressed packet halves, DTS/PTS continuity and all5400 decoded frame
hashes checked; media-proof-final.json. Decode exit0/empty stderr. This is
ffmpeg proof, not Firefox/RDD. Content repeat at media90s (roughly wall90/65/105
control/fwd/back), potential visual confound, NOT recovery/reset evidence.

NEXT phase3: implement/test named240s capture/driver:225work/238cleanup/240final,
>=165s work left before fixture start; retain existing short<=120s defaults,
256MiB artifact/resources/private roots/owned cleanup. Old driver220/SSH240s
cannot run this sequence. Join four progress receipts to terminal result;
save raw before strict validation; failure-test maximum/malformed snapshot
writes within1.5MiB terminal fixture allowance, no silent cap raise. Need same
selected doc+native decoder/process/directory/build receipts, identical sparse
sampling cadence/control, post-cleanup PID absence. Phase4 static dependency/
package admission still open (asset done); then short real integration and
fixed control/forward/backward wave, profilerOFF, no favorable retries. No
causal diagnosis or performance claim. Prior sealed producer-fence evidence
unchanged; its benefit FAIL and GPU import defaultOFF remain.

## October 7 Seek-Recovery Owned Sequencer

Previous goal turn made progress: scratch passive observer +18tests. This
continuation adds scratch sequence.mjs/test/sequence-spec.mjs in the same
UNSEALED artifacts/umbralink-control/seek-recovery/ namespace. Plan:
bot-docs/plans/seek-recovery.md; existing seek-recovery report extended.
Goal stays ACTIVE. No product/sharedharness/native/build/browser/profiler/SSH/
installation/profile/index/staging changes, no live handles.

getSeekPlan(control|forward|backward): immutable20/45/45/40s segments,
>=180s1920x1080 muted directvideo, normalrate/noLoop. Baseline20s thennone,
seek45s, orseek5s, and130safter. runSeekSequence deliberately owns play/seek/
finalpause on OWNED fixture, unlike passivecollector. Observer startsbefore
seek; stableactualdocument/video refs verifiedatboundaries;localIDsnotglobal.
Preservesrawsegmentclock/gaps/partialrecords. Own AbortController; play5s and
segmentduration+2s watchdogs; abort/pagehide cleanup; latepromise resultscannot
append/actionafterreturn. Page timers stillnotOSwatchdog.

33combinedtestsPASS afterformat:18collector+15sequencer. Actualcollector+sequence
runall3schedulesunderfakeclock:21/46/46/41samples, seekeventsseeking/seekedat
action, zeroleftovertimers/listeners. NotrealFirefoxplayback. REDthenfixed
boundary-onlyadmission thatmissed hidden/ended/replaced/paused/error samples
betweenboundaries. Second RED inthatlog wasfakefixturemissingnetworkState/
multiplelistener support, notbrowserbug. MissingmoduleinitialREDscaffoldingonly.
Logs sequence-{red,first,intermediate-red,green,combined,format,final-tests}.log.

NEXT ordered phases2-6: boundedloopback ownedmodule server/start/result protocol
andstrictuntrustedHTTPvalidator; >=180sverifiedasset; explicit240s capture with
225swork/238scleanup/240sterminalcutoffs whileolddefaults<=120s; staticclosure/
packageadmission; shortrealintegration thenfixedcontrol/forward/backward wave.
No longbudget/server/driver/asset createdyet. Do notrunlongtestonold120/220/240
capture/driver/SSH envelopes. Reuse existingownership/caps/native-root receipts.
Native decoder/process snapshots needed, blackflashnotresetproof. Desktopheld
untilexplicitheads-up; laptopisolatedruntimealreadyauthorizedafterthese gates.

## October 7 Seek-Recovery Observation And Scratch Collector

Owner clarified "searching" means SEEKING with the video progress bar, not
YouTube search. Reported sequence: seek -> choppy for roughly1-2min -> brief
black flash -> immediately smooth. No captured reproduction; audio continuity
and quality/resolution change unknown. No GPU/decoder-reset conclusion.
New report bot-docs/reports/performance/2026-10-07-seek-recovery.md.

This phase added artifacts/umbralink-control/seek-recovery/collector.mjs and
test/collector-spec.mjs, scratch only. Namespace NOT sealed. Self-contained
collectSeekRecovery(target,durationMs=45000,signal), mandatory abort signal,
1..50s segment,1Hz passive media reads/events, weak element identity persegment,
4concurrent/8lifetime videos,52samples/256events/16ranges. No playback writes,
URLs/titles/error messages/pixels/layout/rVFC/public globals. Unknown counters
null; capacity/read/abort/pagehide/cleanup failures explicit. Lastobserved time
is not finish/cleanup time. JSON-string arrays fit existing serializer limits.

18focused supplied-data tests PASS after formatting, zero skip/cancel; actual
serializer twice and serialized VM function tested. Both node syntax checks
and explicit scratch Prettier checks PASS. Evidence logs initial-tests,
cleanup-{red,bounded-red,green},extended-tests,final-tests,final-format retained.
Initialmissingmodule is scaffoldRED, not productbug. CleanupRED exposed helper
unresolvedpromise on removalerror, startup abortlistener leak, abortreentry;
corrected with retained regressions. No claim of production stutter fix.

NO browser/SSH/profiler/native/build/install/profile/index/stage/commit actions
thisphase. Daily desktop untouched; laptop preferred for authorized isolated
tests. New helper NOT connected to controller: actual executeControlScript
signal is internal, not provided to body. Need explicit cancellation ownership
and native/host receipts before runtime. Existing120s capture budget cannot
cover baseline+seek+120srecovery; do not silently relax it. Segment identities
do not span invocations;1Hz misses short transitions/blackframes; observation
overhead/realXray/Firefoxcleanup unverified. Future same-browser protocol must
preserve continuity and bound cleanup independently of pageeventloop.

Recent48ssteadyplayback/forcedRDDloss do not reproduce thissequence. Producer
fence benefitFAILED result/seal remains unchanged. Script-cache audit paused
for this owner-specific clue, no sourcechange selected. Goal stays ACTIVE.
Next: separately scoped long same-browser control/forward/backseek, profilerOFF
initially, stable document+element+decoder/process identity and bounded media
state; no default/quality/extension/UA/API changes, no casual browserrestart.

## October 7 Producer Fence Playback Result

Previous turn was owner status only/no engineering progress. This continuation
completed the predeclared matched pixel/noise/A1B1B2A2 laptop wave. Broad goal
stays ACTIVE. No product/native/build/daily browser/install/profile/launcher/Pi/
index/stage/commit/push change. Report:
bot-docs/reports/performance/2026-10-07-producer-fence-playback.md.
Namespace artifacts/umbralink-control/producer-fence-playback/ is SEALED.
Do not overwrite WX outputs or write further logs into that namespace.
Seal artifacts/umbralink-control/producer-fence-playback-final.sha256,
SHA b94ce8553ecbbeca4d3702f7237b9a977a76fa1b497e153aa97ec5aa0e322785,
430files8539851B at15:53:59.969UTC. Independent sha256sum andreadonlysealerPASS.

RESULT: 29/29 original regression criteria PASS, but both minimum-CPU-benefit
criteria FAIL. Not a fence speedup or daily-promotion result. Noise controls
N1/N2 rates0.563657817/0.555029075, spread1.554647%<=3%; fixed benefit3.109294%
BEFORE A1. A1/B1/B2/A2 rates0.567230933/0.573847496/0.550682777/0.558840258.
Required B<=0.541464273. WeightedA0.563037085/B0.562264536, only0.137211%lower.
Candidate withinmode4.2065% spread, baseline1.5014%. All24 timingphases0drops;
startup gaps>50ms N1/N2/A1/B1/B2/A2=5/5/4/4/3/2, laterphases0. Max comparative
gaps54/52/65/53ms. Screen tests counts, NOTequalmax; no tailguarantee. No favorable
retry, excluded startup, tolerance/defaultchange or causal YouTube claim.

New matched A importON pixelgate48hashes+4rawRGBA exact against priorA andsavedB.
Prior candidateP3 pixel/loss +61native are separate previous evidence. A/B pair
unchanged (Build20261006175655/20261007133500, manifest09261b9b/ff106070).
Both have identical Attachments. All94sourcepins+HEAD/index/configunchanged.
Harness153files146unchanged+7adapters,32relativeimports,
SHA41da7ff1b712650e0f578d516ff9f3332457ed363fb28ec957e5aabb56f01018.
Remote /home/wyatt/.cache/codex/producer-fence-playback-harness-20261007-t27Mxk
original rootuid1000/dev64512/ino37231902/0700 retained, bothpostflightsPASS.

Seven roots under laptop ~/.cache/codex/ (exactnames in summary.json):
 pixels-on suffix1vM4Xe browser2024381/controller2024369
 A-noise1 qC7VFA 2026798/2026786; A-noise2 DrOElG 2029272/2029260
 A1 qzk13G 2031755/2031743; B1 jPw5tF 2034257/2034244
 B2 qtU3fY 2036850/2036818; A2 pa1ffz 2039371/2039359.
15:25:24..15:42:30UTC,16.151spixels/~59.8stimingcapture;48.07..48.11sCPUwindows.
Fresh private installation/profile/app/local/temp roots, profilerOFF,importON,
original120/220/240slimits and15ssettles/preflight-exit0 beforeeverylaunch.
Seven cleanSIGTERM,0logdrops;84distinctrecordedPIDs independentabsence
15:44:31.461/15:44:32.713UTC.302publicfiles3438952B;90resourcespeak146169740B.
No profile/token/appdatacontents exported; sampled/poststartup notOSsandbox.
Logs retainEPERM+VA-APIinit. IntelIrisXeRPL-P/X11/WebRender/hardwareffmpegRDD.

Final focused23PASS0skip includes allsavedprefixes/fullfaileddecision replay,
independent rawCPU sums andframegap/drop recount, noise/threshold negatives,
wrongnativeID/mode/cleanup/chronology rejects, pixels andfinalPIDjoins.
No newbroadtooling/nativebuild. Newtest/sealer explicitPrettierPASS, scoped
report/DETAILSlint0, diffcheckPASS. Priorpair126 andGPU256 sealsunchanged. Early
missingnoisehelper/wrongtestpath are harnessfailures, notproductionRED.
No runtime/toolhandles remain active. Sourceguard andpriorpairseal verified.

NEXT: do not promote or rerun identical wave seeking favorable data. Fence
execution/hitfrequency remains unmeasured; if revisited, require separately
designed private observation+observercontrol. Otherwise resume broader current
compositor/stutter attribution; earlier154msstall and27/29,28/29 failures remain
open. Existingcurrentprofile has~27%observerCPUoverhead. GPUdefaultOFF remains.
Newsealer readonly: node artifacts/umbralink-control/producer-fence-playback/seal.mjs.

## October 7 Producer Fence Matched Pair

Previous turn was owner status only/no engineering progress. This continuation
constructs/verifies the real matched package pair needed for P3 fence timing.
Broad rendering/layout/CSS/JS goal stays ACTIVE; no speedup/stutter/default claim.
No product/native/build/browser/profiler/remote/owner-profile/install/index change.
Report bot-docs/reports/performance/2026-10-07-producer-fence-pair.md; prospective
plan bot-docs/plans/producer-fence-playback.md. Both now sealed with new namespace
artifacts/umbralink-control/producer-fence-pair/. Do not edit sealed files.

Pair /home/wyatt/.cache/codex/producer-fence-pair-20261007-zqivims1:
  a/umbrafox Build20261006175655,46files475108995B
  b/umbrafox Build20261007133500,46files475111027B
Each has sibling package-input.json, no originalarchive field for derived package.
A manifest09261b9b755eb2295aa92393ddaab215ab8936cb79ebd27699ab8695ca3d1eae
B manifestff1060705138f6d519b4473b94410f69c4dad1d9682fef3c6596c8cc513b534b
pair.json SHA cb41c937e411ac310df857a224db8e90238fffdf2e6d0a3431c83a57c4f3fd0f.
BothrootJARs rewritten by same existingmozpackhelper. B is byteidentical original
candidate; Aonlychanges Attachments to ef945324...a4fa2. All2676rootpayloads match
except generatedAppConstantsBuildID; all5368browserpayloads unchanged. RootJAR
sizesboth51197639B; A25916660...e2bd5, B88ec5827...e96af. Correctnative/INI IDs
retained separately, no oldlib/newmetadata splice. Launcherswholefileequal after
GNU16Bbuilddigest+twoembeddedidentityfields(app+crashURL) normalization. No native
codebytechange in launcher; libxul provenance source-pinned, not reproduciblebuild.
Frozenpatches112/114members differ8(native4,registration,Attachments/test,doc),
old20supplementinputsunchanged+3fencetests. Current94pins+HEAD/index/configsame.

12newPythonconstruct/verifiergroups+9unchangedarchivegroupsPASS; Ruff4filescheck/
formatPASS, Node sealerPrettierPASS, scopedplan/reportlint0. Stdlibzipfile independent
readback/filehashesPASS, separate readonlypair.py verifyPASS. REDactualunmatched
Attachments retained. Two realaudit failures(INI thenlauncher secondBuildID) fixed
afterexactmetadatareads; testfixtureexpanded, launcherREDretained. INItestinitial
missinghelpererror notbehavioralRED. PriorP2native173/P3GPU256sealsreverifyPASS.
No native/broadtooling/browser suites rerun for scratch-only pair construction.
Alltoolhandles terminal:47986build,10910verify,76644doclint; no runtimecreated.

Seal artifacts/umbralink-control/producer-fence-pair-final.sha256,
SHA f57588e6f2b465cba13342edb2c870f9aa1bb2427e9793a75819a704b0b7c98c,
126files952138688B including bothactualpackagecopies+plan/report.15:06:08.871UTC
created; independent sha256sum+readonlysealerPASS15:06:19.093UTC. Only generated
__pycache__ excluded. Do NOT write morelogs into sealednamespace or modify pair.
Readonly: timeout30 node artifacts/umbralink-control/producer-fence-pair/seal.mjs;
timeout180 buildvenvPython pair.py verify ABSOLUTEPAIRROOT; Python test/pair-spec.py.

NEXT: runtimeadapters in NEW producer-fence-playback namespace, not created yet.
Existing descriptor-borrow-playback templates assume singleoldBuildID andold
manifests/bytes. Adapt explicitly to twoIDs/newmanifests/bytes; preserveall29
criteria/collector semantics. CandidatebytesalreadyP3pixeltested; newmatchedA
needs importONpixelgate. Then2freshbaselineN1/N2controls:spreadmax/min-1<=3%,else
inconclusive without retry. FixminCPUbenefit=max(2%,2*noise), thenA1B1B2A2eachB
beatsbetterAbythatamount AND all29criteria. Same48s1/4/4/1importONprofilerOFF,
120/220/240s limits, private roots/caps/cleanup, no defaults/dailyinstall.
Protocol prospectivelyrecorded before any timing; notconfidenceinterval.

## October 7 Producer Fence Packaged Correctness

Previous goal turn was status-only/no progress. This continuation completed
the first P3 gate: four new normal-package headed laptop pixel/loss captures.
Report bot-docs/reports/performance/2026-10-07-producer-fence-gpu.md.
New namespace artifacts/umbralink-control/producer-fence-gpu/ is now SEALED.
No product/native/build/daily install/desktop browser/profile/launcher/Pi/index
changes. Full broad goal remains ACTIVE; no speedup/default-promotion claim.

Normal46file Build20261007133500 manifest03dc06365cd39d215a69c25b32b7c06bd19f39073ce5fe0702170f33048f4463,
NOT native gtest overlay. All48 ordered pixelcomparisons+4fullRGBA buffers exact
for newOFFvsfull-size saved reference, newONvsnewOFF, and bothmodesvsimmediate
descriptor-borrow counterparts. Bothlossmodes8/8 exacterror/pixel comparisons;
retainedbitmap survives; coldreadback unavailable. ExactownedRDD singlethread
zombie before reaping, not automatic decoderrestart/physicalreset proof.
Graphics IntelIrisXeRPL-P/Mesa25.2.8/X11/WebRender; hardwareffmpegRDD at nonzero
seeks. No new per-import/fence-use frequency instrumentation or timing score.

Runtime harness preserves146oldfiles+6newadapters=152;32staticimports pinned,
SHA cfd104a8733bac36075d0e5e1ee7e2e79897d00b59da0d2b56b7e09caf8f234a.
Thirteen wrappers/replay files have only namespace/date/BuildID/manifestdelta;
reverse-delta testsPASS. All94sourcepins+HEAD89243180/index3b78253c unchanged.
Old admission RED rejected newmanifest as expected (harness evolution, not bug).
113prelaunch focusedPASS; final121PASS0fail/skip3.485s includes10newreplaygroups.
ManualscratchPrettierPASS; report scopedlint0; priorP2seal independentlyPASS.
Native61/fulltooling461 are priorP2evidence, not rerun this no-product-change phase.

Laptop harness /home/wyatt/.cache/codex/producer-fence-gpu-harness-20261007-TkTv3E.
Runroots under /home/wyatt/.cache/codex/:
  laptop-producer-fence-gpu-pixels-off-20261007-P6DSwe browser2002639/controller2002627
  laptop-producer-fence-gpu-pixels-on-20261007-7HUg4t browser2005161/controller2005149
  laptop-producer-fence-gpu-loss-off-20261007-gqcVJ0 browser2007562/controller2007550
  laptop-producer-fence-gpu-loss-on-20261007-BtaAyV browser2009894/controller2009882
14:18:58..14:25:04UTC,16.015/16.074/12.842/12.752s. Eachinspectedpreflightexit0
beforelaunch; no ignoredexit1 or retries.120total105work15cleanup,driver220SSH240.
All4ownedcleanSIGTERM/0drops.171publicfiles7953031B,22resourcespeak66392821B.
49distinctrecordedPIDs independentabsence14:30:07.573Z; no further runtime active.
Postflight14:26:58 verifies152harness+46packagefiles/no namedbrowsercompiler.
Logs retain EPERM,VA-API initialization and intentionalVideoBridgeAbnormalShutdown.
No profile/token/appdatapayload exported; sampled/poststartup not isolationproof.

Seal artifacts/umbralink-control/producer-fence-gpu-final.sha256:
SHA a868160652a172c214cd34a2ddbff6398ebbabe84b367506a731aa236102fab3,
256files18809520B,14:32:05.693UTC. Independent sha256sum+readonlysealerPASS.
Namespace/report immutable; new evidence elsewhere. All transfer/test/SSH/lint
handles terminal. Readonly replay: node --test newnamespace/test/*-spec.mjs;
prepare.mjs verify; seal.mjs. Do NOT regenerate/unpack/postcheck over WX outputs.

NEXT: P3 matched fence performance package pair/prospective protocol. Newnormal
package includes Attachments ef945324; olddescriptor doesnot. Cannotclaim fence
effect from directold/newtiming. Need source/package-pinned samefrontend pair,
correct native/INI identities and recorded generatedBuildID differences. Possible
baseline-only exactAttachments overlay onto intactoldpackage needs explicit
source/archive proof/testing first; not built/selected yet. Do NOT splice old
libxul under newIDs. KeepimportONboth,48s1/4/4/1 workload,profilerOFF,old/oldnoise,
predeclaredminCPUgain and unchangedgap/drop/pixelcriteria. Rare154msstall and
prior27/29,28/29failures remainopen. Do not replace global goal with this subgate.

## October 7 Producer Fence P2 Native Gate

Latest status-only turn was no progress; continuation completed native P2.
Report bot-docs/reports/performance/2026-10-07-producer-fence-native.md.
Evidence artifacts/umbralink-control/producer-fence-native/. Broad goal ACTIVE.
No daily install/profile/launcher/desktop browser/Pi/stage/commit action.

New GTK TestDMABufProducerFence.cpp seven actual hardware cases +54 existing
regressions =61PASS0skip0fail on wyatt-laptop Intel Iris Xe RPL-P, 0.831s
reported native duration NOTbenchmark. Valid retained sync, independent export
FD+descriptor survival, exact red/green pixels, actual SwapChain same-object
recycle/resize/clear, expired actual GL weakrefs, WebGL loss/replacement, idle
32surfaces sync_fileFD0->64->0. No physical reset/new crossprocess-fence proof,
global FD bound/longrun leak claim; WebGL loss and context release distinguished.
P2 source only fixture+GTK registration/includes/flags, friends in two headers,
fake ledger forward declaration. P1 method bodies unchanged. Full461PASS0skip
41.343s; new private11groups+Python3groupsPASS; fixture clangformat/5filelint0.

Normal package exports/umbrafox-producer-fence-20261007, Build20261007133500,
46files manifest03dc06365cd39d215a69c25b32b7c06bd19f39073ce5fe0702170f33048f4463;
archive03c4de79c731fefa1b26a6c3f034b5db7996cbe78cde0e50feda60bfb77ba18f.
Native48filemanifest0ab5de57a0c048f344bb2a05e6d4fdbbf3dbf5c7bb4941d21ed15296e1c048a5;
gtestSHA8f89587860a0e878bbc3a552a9ea6e8e1f3c0d26f37b49800310798ab1f0dc12.
Both INIs+native notes agree. Target-only initially staleID20261006175655;
normalexport then configured gmake -W absolute gen_buildid.py buildid.cpp,
mach-j2 binaries/recurse_gtest relink fixed via official generator, no manual
stamp edits. machpackage PASS default16makejobs/XZ2, nativecompilesj2 only.

P2package adds alreadytested Attachments ef945324 relative old descriptor
package plus generated AppConstants BuildID. Exact2frontendpayload changes;
browserarchive5368entriesunchanged. Source94pins92native+Attachments/test;
23untrackedsource archive and fulltrackedpatch retained. P0/P1sealsstillPASS.
HEAD89243180/index3b78253c unchanged; sourceguardpostnative92PASS.

Runner mechanically adapted:154harnessfiles14staticimports, SHA
b0988b64bd897427a5fe5e0683339da029980a488b7cbbb730f9b58b2788ddff.
Laptop install ~/.cache/codex/producer-fence-native-gtest-harness-20261007-zblp6M/umbrafox.
Run ~/.cache/codex/producer-fence-native-green-b5b82912-ed5e-44ad-b57b-c60b6facc765.
30swork45stotal, privateapp/local/temp, 15298Blog, naturalexit0/clean,
all48posthashesmatch. Independent13:51:11UTC recordedPIDs1993310/1993342/
1993344/1993378/1993390absent. Fourpublicfilesonlyexported+hashverified,
no private profile/token/appdata. audit.json validates94source/154harness/48files.

Incident: preflight-gtest-macro rejected otherCargo/rustc, but parent wrongly
calledbuild despite returnedexit1. Buildfinishedbefore exactPGID3812853TERM
attempt(ESRCH); exactgroupempty. build-admission.md retainsfacts. Future
preflightlaunchMUST separatecalls orcheckexit_code; nonzero tool DOESNOTthrow.
Later rejectedpreflightsdidnotlaunch. Earlyinclude/type/macrocompilefailures,
archivewrongfilenameandrsyncbraceerror retained. One nativeattemptonly.

P2 SEALED14:04:56UTC:173files943567893B including report/newnamespace/export,
manifest artifacts/umbralink-control/producer-fence-native-p2.sha256 SHA
c99ea99795f3da55bdc8802e83864474af390f5f4c7d87178e0cfec5b11bd9ec.
Independent sha256sumPASS and readonlysealerPASS. Excludes only __pycache__.
All build/strip/lint/tests/transfer/SSH handles terminal. Namespace/export/report
immutable; new evidence elsewhere. No runtime/performance promotion.

NEXT P3: normalpackagepixel/loss controls then fixedsameimportA/B; MUST match
Attachments metadata in botharms, not directlyold descriptorbaseline versus
newcandidate. Predeclareold/oldnoise,minCPUbenefit,gap/drop/pixelgates. No
performanceacceptanceyet, no dailyinstall. Rare154msstall and priorfailed
27/29,28/29smoothness remainopen. Keep oldsealedplan/historyunchanged.

## October 7 Producer Fence P1 Candidate

Previous goal turn was status-only/no progress. P1 now implements the exact
four-file local producer-fence candidate. Report:
bot-docs/reports/performance/2026-10-07-producer-fence-implementation.md.
Namespace artifacts/umbralink-control/producer-fence-implementation/ is separate
from sealed P0. P0 report/plan/receipt/seal remain unchanged. Broad goal ACTIVE.
No Gecko build/browser/profiler/remote/Pi/install/owner-profile/index/commit work.

DMABufSurface::ProducerFence is embedded after SharedSurface_DMABUF::mSurface;
noncopy/move, out-of-line ctor/dtor, strong stdshared EglDisplay+sync+exact wrapper.
Only two SharedSurface methods opt in. Release resets outside mutex, captures
existing MakeCurrent result, requires live context/extensions/valid export,
retains sync but preserves wrapper publication+flush. Wait matches exact token
and display outside mutex, flags0/FOREVER unchanged. Success destroys once;
failed retained wait uses old FD fallback before reset. ScopeExit invalidates
holder on all returns, including missing FD/GL, after unlocking. Missing GL
still retains original mSyncFd. Existing owner destructor body unchanged;
member destruction handles MakeCurrent failure. Generic FenceWaitFd, semaphores,
serialization/import, HDR and texture release bodies unchanged.

Permanent producer-fence-spec.mjs/.cpp extracts actual declarations/methods and
owner destructor, using fake EGL/FD/refcount/lock primitives. Baseline compiled:
20cases/10 intended assertion failures (four cases), old controls green.
Firstcandidate20PASS, expanded37PASS, semaphore43PASS; final45 cases PASS.
Includes independent missing extensions, invalid replacement/recovery, exact
wrapper versus corrupt same numeric FD, context loss/display mismatch, retained
wait errors+old finite poll, all default error ledgers, published refs, 64 idle
owners and no wait/retained destruction under mutex. Fake type/FD/resource
evidence is NOT Gecko/real-driver/pixel proof. Old invalid-FD/finitepoll/error
semantics deliberately retained, not newly endorsed as safe on every driver.

Full strict Node tooling461PASS0skip41.600s with --test-concurrency=1/90s bound;
includes loopback HTTP and harmless Node children, no Gecko. Adjacent34PASS
preceded final extension cases. Exact6file registered lint0; first lint2errors
retained/corrected. Prettier adapterPASS; clang-format newtest+modified native
rangesPASS (not all unrelated historical formatting), diffcheckPASS.
All test/lint command sessions terminal. Logs in new namespace.

verify-source.mjs validates before4 against P0, all other84 source hashes,
exact unchanged method/header remainders, HEAD89243180/index3b78253c. Final
source-guard-final.json pins cpp58e4f3a7/h6e8e8c85/sharedcppa15cd8f6/
sharedhd3c61713. Tests4b1d4d25/f68a69f0. Original P0 source-proof.mjs is expected
to reject this intentional delta; do not overwrite historical source-proof.json.
P0 seal stillPASS. No performance/pixel/smoothness/default-promotion claim.

NEXT P2: write actual GTK/EGL gtests under prospective plan, real valid sync
query/export duplicate lifetime/pixels/recycle/loss/many-owner FD return.
Enumerate current native inventory (not historical53), preflight before native
build and owned laptop execution. Candidate adds one retained sync per surface,
NOT processwide bound. P3 fixed same-import old/new package comparison remains
required; 154ms stall and previous27/29,28/29 smoothness failures remain open.
No automatic daily install, threshold relaxation or owner-browser action.
P1 evidence SEALED:25 files; artifacts/umbralink-control/
producer-fence-implementation-p1.sha256 SHA256
d84a5ac80c3865d0bd0a32e98dcb258b74bf10fc9f545956ff59f646b2caee14.
Independent sha256sum checkPASS. Namespace/report/after snapshots immutable;
new P2 evidence elsewhere. Final report lint0/explicitformatPASS; all handles
terminal. Current six files equal sealed after snapshots at final admission.

## October 7 Local Producer Fence P0

Previous turn was status-only/no progress. Source/lifetime P0 now supports a
concrete candidate, NOT a product patch/native test/performance acceptance.
Report bot-docs/reports/performance/2026-10-07-local-producer-fence.md; expanded
plan bot-docs/plans/local-producer-fence.md. Broad performance goal stays ACTIVE.
No browser/native/compiler/profiler/remote/install/profile/index actions in P0.

Evidence artifacts/umbralink-control/local-producer-fence/: source-proof.json
checks all67packagepins+21newbasefiles=88 against exact89243180 base+patch and
supplement exclusions. Sameindex3b78253c. Three Node provenance groupsPASS,
including malformed patch inventory/changed overlay/byte mismatch and fullsaved
replay. These are NOTfence tests. Initial source-proof.log preserves wrong
GLContextEGL.cpp filename; corrected GLContextProviderEGL.cpp guardPASS.
source-proof.mjs defaultsreadonly; --writeisWX and mustnotrerun. Priorcurrent
rendercostseal independentlyPASS and unchanged.

Candidate: embedded noncopyable DMABufSurface::ProducerFence on
SharedSurface_DMABUF, strongstdsharedEglDisplay+sync+exactFDwrapper token;
optional pointer params on FenceSet/FenceWait, defaultnullptr. Optinonlytwo
SharedSurface methods. No perframeholderallocation/genericDMABufcache/serverwait.
Exactwrapper+display/current-context admission, preserveexport/flush/waits,
failedretainedwaitfallsbackthrougholdFDroute, clearoutside surfacelock.
DestructorRAIIrunsdespiteMakeCurrentfailure, beforemSurface/baseGLrelease.
Weakdisplayexpired doesNOTprovenativeterminated: newerwrappercanpreventterminate.
Extra retainednativeFD onepersurface isNOTprocesswidebound; testmanysurfaces.

RemoteTextureMapreturnssameproducerobject; fourrecyclecallpaths inspected, preserve
allrefs/hostreuse/7or21poollimits. ConsumerRenderDMABufLock usessemaphore, not
producerFenceWait. NogeneralGPUcompletion/implicit-syncproof. LocalFenceSet
callersdifferfromnewerSearchfox; usepackagepins. ExistinginvalidexportFD and
finitepollfailure paths areknownsourcecaveats, notobservedruntimebugs/newfixes.

NEXT P1: tools/umbrafox/tests/readback/test/producer-fence-spec.mjs +.cpp using
existingimport-reuse actualC++regioncompilerpattern. BehavioralRED mustshow
reimportinstead oforiginalwait, NOTmissingAPIfailure. Thenfoursourcefilepatch
DMABufSurfaceh/cpp+SharedSurfaceDMABUFh/cpp only; planhasallfailurecases.
P2realEGLgtest usesexistingfGetSyncAttrib/ownedhardwarerunner; donotpatchglobal
EGLdispatch. Preserveoldnative/pixel/losscontrols, enumeratecurrentinventorynot53.
P3prospectivefixedpackageA/B withimportheldconstant, CPU/gap/drop/pixelacceptance.
Allruntimephasesrequiretheirpreflights; noautomaticdailyinstall. Old154msstall
andfailed27/29,28/29smoothnessgatesremainunresolved.
P0SEALED: artifacts/umbralink-control/local-producer-fence-p0.sha256,
18files, SHAffbae3259284e35f8c60be5a1b4d7b767becb4d2d2da7d6f9e35fa1d8ec5168c.
Independentsha256sumPASS; final3NodegroupsPASS0skip401ms, explicitformatPASS,
docs4filelint0/diffcheck0. Alltool/lint/testhandles terminal. Namespace/report/
planimmutable; P1canextendplanonlyafterpreservingsealedP0copy/newnamespace.

## October 7 Current Rendering Cost And Fence Reconstruction

Previous owner progress report was status-only/no progress. Continuation
finished saved current-package graphics partition and new driver fence detail.
Report bot-docs/reports/performance/2026-10-07-current-render-cost.md;
plan bot-docs/plans/current-render-cost.md; evidence current-render-cost/ under
artifacts/umbralink-control. No product source/default/build/install/browser,
remote/Pi/owner-profile/launcher/index edits. Broad goal remains ACTIVE.

Same profile33520603/package1de58db6/Build20261006175655; no154msstall in this
capture and ~27%profilerCPUcost, no before/after performance acceptance.
Current roles t2Renderer/t3CanvasRenderer/t4Compositor, reverse oldt3/t4 roles.
Role regression2PASS2FAIL -> fixed adapter verifies identity/context without
mutating old sealed classifier. Each9740samples; active535/260/285 conserved.
Renderer render321/swap111/other103; Canvas replay117/present114/other29;
Compositor composition55/destroy20/notify19/create16/other175.

NEW exact fence decomposition: FenceWaitFd37 = create34+finish1+other2;
create34 = tc_sync28+iris_fence_create_fd6. FenceSet52 = create42+export4+other6.
Nested inline export counted once; counts are NOT GPU-wait or CPU milliseconds.
Creation's tc_sync contains tc_batch_execute28 and batch_execute27, not just
final client wait. Source path releases to native EGL fence -> exported FD ->
destroy, then local buffer reuse imports FD into a new fence before waiting.
Candidate to investigate: retain same-generation local original fence while
preserving exported FD/consumer ownership. Full lifecycle audit still needed;
do NOT globally switch FenceWaitFd or omit waits. Wayland/semaphore callers and
context/loss/teardown matter. Android is precedent only, different merge protocol.

One prior offlineCLIload finished11:24:48.093UTC9.203s; symbolserver3660541 and
daemon3660583 exactroots+socketgone/rechecked11:41. Sourceproof72files includes
67packagepins+5basefiles, HEAD/index unchanged; newerAttachments is NOT in pins.
Fifteen final pureNodegroupsPASS0skip0.988s; saved main+driver results exact replay.
Known harness-errors/obsoletepath retained, not productREDs. NO raw-profile parser,
newcapture/reload or retry. Source-proof/prepare/export/write-mode replay are WX;
do not rerun writing modes. Old seals immutable.
SEALED11:56:35.328UTC:164files23544516B14staticmodules72sourcesverified;
manifest artifacts/umbralink-control/current-render-cost-final.sha256 SHA256
8ed838ed4e291587a44c6b1c87e3804114da1bdac930ebf7d565c669f1a70a00.
Sealerverifiedtwice+independent sha256sumPASS; sourcepatch/manifest/supplement
and original index guardPASS; exactownedroot/socketabsence rechecked. Report,
plan and entire namespace now immutable; new work/logs elsewhere. Finaldocs
lint0/formatPASS/diffcheck0; all exec/lint/check handles terminal. FD values and
generationIDs unobserved, so reconstruction success/failure percall UNKNOWN.
Next genuine action: audit same-generation local fence retention with full
consumer/recycle/contextloss/teardown ownership before any native patch.

## October 7 Attachment Metadata Source Candidate

Previous owner progress-report turn was status-only/no progress. Continuation
finished native evidence admission, actual-source/replay tests and the narrow
metadata optimization report. Broad performance goal remains ACTIVE; no stutter
fix, live-startup claim, new package/install or owner-browser action.

Report bot-docs/reports/performance/2026-10-07-attachment-metadata.md;
plan bot-docs/plans/attachment-metadata-cost.md; evidence namespace
artifacts/umbralink-control/attachment-metadata-cost/. Only product delta against
saved prior module is metadata Blob/text -> normal main-thread task yield then
JSON.parse(original byte string). Prior archive cleanup remains exact. Module
dbb94573... -> ef9453242ede618f224cb5c28495223f88a5b92efbc48b28108b917b63ea4fa2.
Permanent test_cacheAll_avoids_metadata_blob is sole new native-test task.
No public API/pref/encoding/request/security-import/batch-size changes.

Native 277 byte/JSON cases including38errors; original/yielding queued-task
fairness PASS, direct-only negative fails fairness.24fixed microcells show
60.56%/67.91% lower conversion walltime. Actual512record ZIP+IndexedDB ABBA:
observerloaded smallcase2.55%SLOWER/large7.75%faster; quiet6.15%/3.06%faster.
Two cells/variant/size/process, correlated/nohostcontrol/nobrowserCPU claim.
Loaded observer60864-77194tasks is artificial; worstcandidate gap4.834ms vs
baseline3.583ms, no tail-safety proof. No result-based reruns or pooled sequences.

Native downloader behavioralRED137pass1fail -> GREEN166assertions; conversion
1728assertions, bundles63/53. Actualsource RED38pass6fail ->44pass; final54Node
groupsPASS0skip172ms including savedcells/source-delta replay. Productlint0,
docs3filelint0, scratchformatPASS/diffcheck0. All8attempts24recordedPIDs absent
in11:08:58UTC audit. Native tools terminal; no browser/profiler/build sessions.
Preserved failures: Cu.now obsolete, file-scheme module reject, unsyncedDB delete,
audit unusedHTTP3 notice/quoted-log mismatch, Node invocation missing VM flag.
Do not call missing-module or harness errors product REDs.

audit.mjs wrote analysis.json exclusively; DO NOT rerun writing audit or native
benchmarks just to reproduce a favorable result. Replay tests use
--experimental-vm-modules --test --unhandled-rejections=strict with10sbound.
Native tests reused existing xpcshell972c9a8... and libxul2e068675... with fresh
private roots/120sSIGTERM; no compiler/package. TestAppInfo build20160315 is
mocked, notnativeidentity. Root absence is not universal sandbox/network proof.
11:12:09 sourceguard67pins+HEAD/index/mozconfig unchanged. IMPORTANT these67pins
do NOT include Attachments; oldpackage equivalence is not proof for this change.
Keep prior seals immutable; next integrated package requires new source manifest.
Next distinct runtime problem remains compositor/presentation scheduling; later
securitywork is not causal proof for earlycallbackgaps. No weakened pixel/cadence
gates or defaultGPU import change. Ownerdailybrowser/profile/launcher protected.
SEALED11:17:49.289UTC:90curatedfiles7206842B; manifest
artifacts/umbralink-control/attachment-metadata-final.sha256 SHA256
350d509ed89a146e73ac91e3db16ae4454f6fd5fa48b0fc112b0799c3f0ce26e.
Sealerverifiedtwice+independent sha256sumPASS. Namespace/report/plan are now
immutable; sealer/audit write-once, do not rerun. Profile/app-data/temp trees
excluded; candidate source/test copied exactly for future comparisons.
Finaldocs lint0/diffcheck0; all exec/test/lint/audit handles terminal.

## October 7 Startup Attribution And Image Progress

Previous owner progress-report turn was status-only/no progress. Continuation
completed new saved-data compositor selection audit; no browser/remote/build.
Report bot-docs/reports/performance/2026-10-07-current-startup.md, namespace
artifacts/umbralink-control/current-startup/. Full goal ACTIVE, not stutterfixed.
Current profile33520603... same package1de58db6...Build20261006175655.
One preceding bounded offline local-symbol load completed21.842s10:02:00.125UTC;
samply3556897/CLI3556958 exactroots+socketabsent, rechecked by both audits.
17complete active trees validated; parent phase nonidle339/282/16/18, disjoint
settings/security group140/104/0/0. First2s parent399/400idle; fourgap mainthread
samples10each,0/1/0/0nonidle perthread. No 51msparentwork or profilerlockclaim.
Three51ms callbackgaps contain regular animationrefresh ticks; fourth53msgap
has40.319mscatchup spacing with2.139mstick. Callback/native clock validated.

NEW all2884compositorselection+1444queueexports parsed. Producer1 has2882
selections1441changes/consecutiveframes, maxselection25.856551ms,
maxchange42.988729ms, nochangeinterval>50ms. Eachcallbackgap includes3/3/4/3
selections,2/2/2/1changes,2/2/2/1queueupdates. Selectedframeshave2laterimages.
These Textmarkers lackdocument/layer/nativeinstance identity; NO samevideo/
physicalscanout/completeprofiler proof. Do notinferno visible stutter fromthis.
5frozennative files equalbase+absentexactpackagepatch/supplement; callbacks
separatelyinvalidated/admitted, existing40mspositionpath unchanged. Earlier
146ms/4drops/~154msRendererstall remainunresolved;27/29and28/29stayFAILED.
48combinedofflinegroupsPASS0skip, including14currentstartup; actual REDlibrary
corruption caught/fixed. FailedobsoleteHTMLpathaudit+partials retained; final
mediaelementpath audit uses distinct checked-source snapshots. Do notrerun WX
replay/audit/prepare/export. As-run inputs/existing sealednamespaces immutable.
Next isolateactual frame/presentation stall with authoritativeidentity or
privateinvalidations/callbackadmission join; doNOTalterFirefoxcadence/security
updates, retry untilPASS, or treatcallbackspacingasphysicalvideoframedrops.
Product/default/install/desktopbrowser/profile/launcher/Pi/index untouched.
SEALED10:29:51.759UTC:468files32992573B/16staticmoduledependencies, manifest
artifacts/umbralink-control/current-startup-final.sha256 SHA256
cc734f113750338ed7419b1703bf583584cf0d029f33233c3d1604ecedd621e3.
Sealerverifiedtwice+independent sha256sumPASS; reportlint0/diffcheck0, authored
analysisformatPASS. 10:28:24.968sourceguard174harness/35imports/67pinsPASS;
priorsealunchanged. Final48PASS0skip1.078s; all tool/CLI/test/lint sessions terminal.
Entire namespace and report now immutable; new work/logs elsewhere. No rerunning
WX audit/replay/export/sealer and no original-output rewrites.

## October 7 Current-Package Profile Admitted

Status-only previous goal turn was no progress; continuation completed offline
admission of fresh laptop control/profile/control captured before that status.
Report bot-docs/reports/performance/2026-10-07-current-compositor.md.
All12phases/native drop counters0; startup gaps2/4/1 (max51/53/52ms), no>100ms.
Controls CPUrates0.570470636/0.572466971 differ0.350%; profiled0.725617935,
+27.196%/+26.753%. Single sequence, no optimization or stutter-fix acceptance.
Current package1de58db6..., Build20261006175655, importONall, noPBOoverride.

Evidence current-compositor-r2/:174runtimefiles35imports67pins;
harnessc6401f704aea423d997a40049473858c333b65df3b9b1ac218702470fa9e4133.
Remote current-compositor-r2-harness-20261007-Xiq2db; exact package input remains
descriptor-borrow-gpu-harness-20261006-twjWbp/candidate. Runtime inputs AS-RUN;
do not regenerate/edit. Three roots laptop-current-composition-r2-ARM-20261007-:
control-before bAuLxM browser1948224/controller1948212;
profiled yreT02 browser1950654/controller1950621;
control-after4iBr62 browser1953099/controller1953087.
09:29:07.239-09:34:07.610UTC;144publicfiles12354450B;43resources peak152073752B.
All clean ownedSIGTERM271Blog0drops. Final52exactPIDs absent includes failedsetup.
Final remote09:34:29.417 no browser/build;174harness/46package unchanged.

Profile11290955B SHA335206038875249534a47c0e344665291dc5949c45d6847d76390c7169debbbe.
Supported CLI0.10.0 only; one owned current-composition-20261007 session with
127.0.0.1:9; daemon3528773 stopped09:40:58.939, exactPID/socketgone/rechecked.
36threads10processes; eightphasejoinscontentPID1950828/document10737418242.
Rawroot11310.979029-60452.423589ms; normalizedclockexplicit. Five keythreads
before/allphases/after samplebrackets PASS, not complete marker/splitpair proof.
ContainedComposite2094 max2.326967ms; callback1192 max2.426255ms; Canvas1193
max4.609785ms. Old154msrenderer stall NOT reproduced, not provenfixed.
Parentmain nonidle339/282/16/18 ~2400samples/phase, native symbols unresolved.
Next SAME savedprofile offline local symbolization + startup scheduling analysis;
no newcapture/PBOretry needed. No scoped producer/cause yet for parentearlywork.

Failed original current-compositor/ namespace preserved: root3YHqvU
browser1943167/controller1943154 failed oldgzip rootguard BEFOREplayback;
22publicfiles cleanSIGTERM no timings. r2 fixes both rootguards, retained3RED.
OfflineCLI extra terminalnewline equivalence RED corrected before CLIload.
18focused/420combinedPASS0skip11.289s; broadtests includeNodechildren/HTTP.
Final sourceverify09:44:07.048 preservesHEAD/index/config67pins. No productcode,
build/default/install/desktopbrowser/profile/launcher/Pi/agent/commit changes.
Goal remainsACTIVE. SEALED09:49:18.014UTC:828files129939885B, manifest
artifacts/umbralink-control/current-compositor-final.sha256 SHA256
7c29ffc1e306cc24a1df8d8d5a8235afe77849f63d082eb3625afc811c79d462.
Sealer verifies twice and independent sha256sum checkPASS; exact2doc lint0.
Both current-compositor/ and current-compositor-r2/ plus report/harness inputs
are immutable now. New analysis or logs must use a new namespace; do not rerun
WX CLI exporter or writing analyzer. All tool/SSH/CLI/test/lint handles terminal.

## October 7 PBO Timing Complete; No Demonstrated Benefit

Previous turn was status-only. This continuation completed the fixed actual
unprofiled A1/B1/B2/A2 on disposable wyatt-laptop; no retry or threshold change.
Report bot-docs/reports/performance/2026-10-07-pbo-playback.md; P2/P3 decision in
bot-docs/plans/pbo-upload-control.md complete. Full goal remains ACTIVE, not done.
All29 criteria PASS but immediate-upload CPU only0.030740% lower vs staged;
within-mode spreads1.203%/1.525%, four-copy median1ms/P952ms unchanged.
Eight51-60ms startup gaps within1.382s remain, adjacentdraw0-1ms. All16phases
and final native drop counters0. No PBO default change or new profiling pair.
Configured mode is NOT native-device/path acknowledgement; no stutter fix.

Namespace artifacts/umbralink-control/pbo-playback/ now contains as-run evidence;
do not edit runtime files or rerun WX outputs. Harness167files29staticimports67pins,
SHA4d1477a7613707e9b5d0d0a7c9eb7d0cbea65e72da43912a5e01ccf814dbd8e7.
SEALED09:06:53.500UTC:434files50497578B, pbo-playback-final.sha256 SHA256
4d54180201691c2de354728871d847449ff97802b8d306f544c87d5beb446214.
Sealer verified twice, separate sha256sum checkPASS. Entire namespace/report and
runtime inputs immutable; new logs outside. Final exact2doc lint0; prior P1
pixel/loss seals verified unchanged. No browser/test/SSH/compiler/profiler handle
remains active. Future diagnostics use a new namespace and prospective contract.
Remote /home/wyatt/.cache/codex/pbo-playback-harness-20261007-CuWTnA;
archive769f3cf23359c55d0afb671e61c3846bf2e38aec93173b4eaf2202e3afa0b03c.
Same descriptor-borrow normal package1de58db6...Build20261006175655 botharms;
importON/profilerOFF/hardwareWR IntelIrisXe Mesa25.2.8 X11. PBOtrue/false prelaunch.
Roots /home/wyatt/.cache/codex/laptop-pbo-playback-MODE-20261007-SUFFIX:
A1 a/FdaVGr browser1926690/controller1926678; B1 b/HBuzzG1929144/1929112;
B2 b/EUcNo61931577/1931565; A2 a/AOcCCZ1934030/1934018.
Captures08:51:05.665-08:58:40.486UTC, each~59.9s, ownedSIGTERMclean271Blog0drops.
177publicfiles1371185B,56resource samples,maxartifact145514251B.
48structuredPIDs+4separate sandboxwarningPIDs absent09:00:43.915UTC;
finalremote09:01:47.982 no browser/build, all167harness/46package hashes match.
Final local source/HEAD/index/mozconfig guardsPASS; no toolsession remains active.
Final381testsPASS0fail0skip11.077s,10focused groups include savedhash/replay,
CPUweighting/gaps/modes/hardware/PID proof. BroadsuiteincludesNodechildren/HTTP.
Old off/on repeatSpread names map to A/staged B/immediate, importONinboth.
Latest offline wrapper hashes frozen-wrappers.json; older wrappers.json historical.

No source build/default/dailybrowser/install/profile/launcher/Pi/index/commit/agent
changes. Next return to unresolved refresh/compositor scheduling and workload
attribution, not repeated PBO tuning. Existing callback-delivery/refresh-catchup/
scrollbar controls and old146ms gap/4compositor drops remain separate evidence.

## October 7 PBO Decoder Loss PASS; Timing Next

Latest status-only goal turn was no progress; continuation completed two actual
retained-loss laptop runs. Report bot-docs/reports/performance/2026-10-07-pbo-decoder-loss.md;
plan bot-docs/plans/pbo-upload-control.md. P1 scoped correctness now complete;
P2 fixed unprofiled A1/B1/B2/A2 NOT started. Full performance goal remains active.
No new speedup/stutter-fix or native-device-mode acknowledgement.

Namespace artifacts/umbralink-control/pbo-loss/ is as-run evidence; do not edit
runtime adapters or rerun WX generators. 164inputs29staticimports67sourcepins;
harness SHA41afa80d63749815b1025c5e06e93949d46788aaeb933b73b05ef7d4c0f14742.
Sealed08:36:34.302UTC,222files53980693B; pbo-loss-final.sha256 SHA256
0156648beedad996418cfd1f67c31812075eae19b5bedfad138dc6b0a1f8786a.
All hashes verify; final scoped2doc lint0. Further logs outside sealednamespace.
Remote /home/wyatt/.cache/codex/pbo-loss-harness-20261007-rB7QFt;
same existing package input /home/wyatt/.cache/codex/descriptor-borrow-gpu-harness-20261006-twjWbp/candidate,
manifest1de58db6..., Build20261006175655. ImportON/profilerOFF, PBO true/false
set before launch. Native/preference/hardware receipts match. No default changes.

A root /home/wyatt/.cache/codex/laptop-pbo-loss-a-20261007-uMzYZi,
browser1915554/controller1915522,08:29:01.811-08:29:14.602UTC12.791s;
B root /home/wyatt/.cache/codex/laptop-pbo-loss-b-20261007-YDCiGp,
browser1917890/controller1917878,08:30:41.599-08:30:54.345UTC12.746s.
All8 exact draw/error/timestamp cases match acrossmodes and old same-packageON;
bitmap preserved, cold failures separately observed. Decoder stop is permanent,
not restart. Both2poll single-thread-zombie receipts, then postcleanupPIDabsence.
50publicfiles/5resource samples each;5182594B total; peak66358883B sampled.
CleanSIGTERM346B logs0drops, EPERM/VAAPI/expected-in-test VideoBridge abnormal
closure retained. All26structuredPIDs absent08:31:51.846Z;2logwarningPIDs alsoabsent.
Final remote package/harness/no-busy preflightPASS08:31:53.574Z.
422prelaunch/423final testsPASS, no skips; includes Nodechildren/HTTPfixtures.
Initial raw-vs-hash-only export testpath error preserved, corrected no runtime retry.
No browser/compiler/profiler tool handle remains active. Dailybrowser/profile/
install/launcher/Pi/index/commits and source defaults untouched.

Next use fresh pbo-playback namespace, reuse sealed pbo-upload/playback.mjs and
driver plus original29criteria, current samepackage botharms. Preflight15s quiet
eacharm,120/105/15 capture bounds,220driver/240SSH, all gates unchanged. Do not
weaken startup-gap/drop criteria or rerun failures. Report actual normalizedCPU
and both withinmode spreads; configuredPBO is not renderer-path proof. More
layout/CSS/JS/real-site and cross-backend acceptance still pending.

## October 7 PBO Composited Pixels PASS; Loss Gate Next

Goal continuation after progress-report-only turn made real runtime progress.
Report bot-docs/reports/performance/2026-10-07-pbo-composited-correctness.md;
active plan bot-docs/plans/pbo-upload-control.md. Goal remains active.
Current artifacts/umbralink-control/pbo-upload/ runtime inputs are now as-run
evidence: do not edit or rerun WX generators. Use a new pbo-loss namespace for
the next adapter; preserve original manifests and prior failed logs.

Two fresh disposable headed laptop browsers on same descriptor-borrow package:
A PBOtrue root /home/wyatt/.cache/codex/laptop-pbo-correctness-a-20261007-seYu2V
browser1904207/controller1904175,08:00:49.611-08:01:05.893UTC;
B PBOfalse root /home/wyatt/.cache/codex/laptop-pbo-correctness-b-20261007-5TyjAa
browser1906892/controller1906880,08:05:14.821-08:05:31.128UTC.
Both PASS;48 exact video cases+4raw buffers match; two uploaded canvas/image
scenes read back from actual parent widget-layer branch, every RGBAchannel exact,
same-state repeats and deliberate change pass. Both realDPR1; DPR2 onlysynthetic.
HardwareWebRender/IntelIrisXe/Mesa25.2.8+hardwareffmpeg verified. ImportON/profilerOFF.
Pref receipts actual/default/user/locked pass, NOT renderer internal modeack.
No physical scanout/partial-present/rare-artifact or performance claim.

Remote harness /home/wyatt/.cache/codex/pbo-correctness-harness-20261007-LQhhXI,
158files/28staticimports SHA3b63f2011142afaf17c91f20315180d53f6492ec0bda3e7dc74c5472ddfeae82.
Existing package input root /home/wyatt/.cache/codex/descriptor-borrow-gpu-harness-20261006-twjWbp/candidate;
package SHA1de58db6..., Build20261006175655,46files. All67sourcepins/HEAD/index
unchanged. a/b-export.json are bounded public-only rawexports45files each;
correctness-comparison.json + audit-correctness.mjs replay pixels/caps/identities.
Baseline producer adds beganMs/finishedMs only to saved samples; initial whole
object match failed, corrected projection requires exact deep match once and
separate monotonic envelope validation. Failed audit retained, no browser retry.
Final371testsPASS/0skip11.03s; existing Node child/HTTP tests included.
All24 exact PIDs absent in composited-final-absence.json; final remote preflight
no browser/build and158harness+46package match. All tool/SSH handles terminal.
Checkpoint sealed08:12:46.156UTC:258files54199177B, manifest
artifacts/umbralink-control/pbo-composited-correctness-final.sha256 SHA256
825ea4754a0e7de40f7add51e8fe2906a69887784c4ece5558fdae6b6d45ac13.
sha256sum verificationPASS. Report+entirecurrentnamespace+158inputs immutable;
plans/context excluded. Final exact2doc registered lint0. Future verification
logs outside sealed namespace; runtime adapter changes belong in pbo-loss.

NEXT: verified narrow retained-loss adapter for both PBOmodes; original permanent
ownedRDD shutdown logic unchanged, maintain native/private roots and all exception
and bitmap/pixel oracles. Then unchanged unprofiled A1/B1/B2/A2 and29criteria.
No timings yet. Dailybrowser/profile/install/launcher/Pi/productdefaults/index
remain excluded; no newagents/commits/staging. Do not call fullP1 or goalcomplete.

## October 7 PBO Capture Admission Verified; Pixel Runtime Next

Latest goal continuation made concrete progress after the status-only turn:
new artifacts/umbralink-control/pbo-upload/ private capture/pixel adapters plus
package/source verification. No browser, remote operation, profiler or native
compiler launched; daily browser/profile/install/launcher, Pi and index untouched.
Goal remains active. Current phase plan bot-docs/plans/pbo-upload-control.md;
report bot-docs/reports/performance/2026-10-07-pbo-admission.md.

P0 capture path implemented, but full runtime orchestration remains pending.
generate.mjs creates five write-once adapters (envelope/playback/pixels and two
drivers); contract.mjs admits only modes a/b, one same package, import ON, and
explicit prelaunch PBO boolean. Only two existing browser-state receipts expand;
nine playback RPCs, workload/summary/envelope/deadlines/cleanup remain unchanged.
Actual/default/user/locked pref fields checked before/after; device mode unknown.
Initial p0-harness.json152files/29staticimports SHA256
0e6df780f139020d1c2a5b55fdf47acdc5c833ba6ae1b49d05041df037630400.
This is NOT final P1/P2 runtime manifest. Preserve generated bytes/WX outputs;
new additions need a new manifest. Do not blindly rerun generators.

Fifteen exact package source files reconstructed via Git's parser outside any
worktree, all match current milestone, all46 expected package files verified.
Source-final a9befff9; exported patch d1bf3bdfe9f7d36c82181db0b4487592d5b8857b070e43c1b2ee6aaea9cd1677.
Only renderer differs among prior13 chain files; full device+profiler parameter
handler is identical. Exact packaged Capture.sys.mjs SHA256
c64da2a7059c2ce8aed16e962d5fe17d9811ed778cc2bc79d401b326732f4e7c matches reconstructed
source. Extracted-function fake check takes widget-layer drawWindow branch with
readback:true and rejects software fallback/oversize/error; NOT native proof.
Packaged greprefs AST confirms PBOtrue, batchedfalse, draw-copyfalse; runtime
unobserved. Pref parser HandlePref passes fromInit:true, retaining explicit
startup user values even equal to default. Both configured mode receipts require
userSet:true/defaultValue:true/unlocked. No setting change in existing browsers.

Current14 focused groups pass; relevant combined361PASS/0skip in full-tests.log
(10.66s). Source-pref assertions were subsequently extended; final rerun recorded
separately in final-tests.log. Old failed scaffolding/unique-anchor/test-expectation
logs retained, not claimed as production bugs. Shared tests include Node children
and loopback servers, not browsers. Docs lint0; no product lint/native claim.

NEXT: implement bounded actual composited fixture/receipt and decoder-loss wrapper,
final preflight/export/source guards and exact adapter tests. Then P1 true/false
fresh disposable laptop profiles, known nonblank readback A/A and deliberate
visual change, exact canvas48/loss comparisons; no timings before P1 passes.
No PBO comparison launched or measured. Keep hardware WebRender ON and original29
timing criteria. Current test/source commands must be terminal before runtime.

## October 7 Compositor Attribution Complete

Goal remains active. Latest owner asks for a progress report; distinguish verified
mechanisms, measured fixture gains and failed smoothness gates. Daily desktop
browser/profile/launcher/install, Pi, new agents, staging and commits remain
excluded. Disposable laptop testing is authorized. No current owned tool session
remains active; old A2 tool23876 is terminal, not pending.

Descriptor-borrow native build/package and correctness completed: 54 native tests,
48 exact pixel cases and retained decoder-loss comparisons pass. Normal package
exports/umbrafox-descriptor-borrow-20261006/ has 46 files, manifest
1de58db614be934fb7fe71fc46ea168ce9777a8b46e340d3f429090b4e3e6773,
Build20261006175655. Only libxul differs from preceding frame-reuse package.
GPU correctness seal a014d16739e468be96f3d649b6dddead1d0e0f1c08d3632da5ae3e0db5d2c7f6.

Descriptor playback A1/B1/B2/A2 completed: 29/29 regression criteria PASS, but
no demonstrated speed gain (candidate normalized CPU +0.334%, within its 0.839%
spread; draw medians/P95 unchanged). All16 phases report zero drops;14 startup
callback gaps remain,51-68ms within first1.485s with adjacent draws0-1ms. Exact49
recorded PIDs absent06:24:37.673Z. Report
bot-docs/reports/performance/2026-10-06-descriptor-borrow-playback.md.
Playback seal f59f0aa88323481fd9a97264d3dffd9125a69a05751e9e73a8b575ee09e4a025.
Keep eight-byte descriptor-storage tradeoff and unknown real hit frequency visible.

New offline compositor-cost-partition phase is complete and SEALED. Report:
bot-docs/reports/performance/2026-10-07-compositor-cost-partition.md. Both full
saved CLI exports account for all Renderer559/CanvasRenderer328/Compositor275
non-idle samples. Mesa symbols resolve90 of95 samples under upload-pool fence
creation to queued CPU command execution (draw/clear/framebuffer state), NOT
95ms GPU wait or a proven cause of callback stalls. Recording predates frame
reuse/borrow. Sixteen focused groups PASS, exact source reconstruction13 files,
46 command receipts checked,36 real-tree corruptions rejected. No new browser,
remote runtime, native build or product edits during that phase.

Seal completed07:18:04.782Z:219files15777580B, manifest
artifacts/umbralink-control/compositor-cost-partition-final.sha256 SHA256
fb77a1404dbf0308a17a44dd5cb88617285203aa62e222fa1702ae37a8b2180d.
Namespace, completed report/plan/sealer are immutable; new recheck logs outside.
Exact offline daemon/server PIDs3308270/3308316/3320075/3320115 and two sockets
absent07:16:46.849Z. Prior profile-range/driver-symbol/descriptor-playback seals
verify. All67 source pins/HEAD/index/mozconfig unchanged at final source guard.

Next: bot-docs/plans/pbo-upload-control.md, P0 NOT implemented or launched.
Use new private pbo-upload namespace and same current package for both arms.
Existing gfx.webrender.pbo-uploads selects staged/immediate texture uploads,
keeping hardware WebRender ON; source message chain verified against recorded
build, but join to current package before runtime. No global default change.
Plan requires enumerated private pref adapter, failing-first bounds/receipt
tests, exact pixels plus actual composited-readback control before fixed
unprofiled A1/B1/B2/A2. Ordinary drawSnapshot is software, not hardware proof;
trace packaged Capture.sys.mjs explicit readback:true and owned content rectangle.
Readbacks stay out of timing. Preserve all29 numeric gates and failed runs.

Status anchors: request-latency-measurement records busy installed-observer
request starts101-102ms to2-3ms and fetch22-24ms shorter, not YouTube causality.
descriptor-balanced records26.43-28.88% CPU reduction but27/29 FAIL; frame-reuse
records3.496% lower CPU but28/29 FAIL. GPU import stays default OFF/uninstalled.
Header-copy removal and controller dead-entry cleanup are verified mechanisms,
not quantified page speedups. Do not claim broad CSS/JS or rare-stall fixes.

## October 6 Descriptor Borrowing In Progress

Owner requested performance progress; latest response separates implemented
mechanisms from native/performance acceptance and daily installation. Goal active.
New plan bot-docs/plans/video-descriptor-borrow.md; evidence under
artifacts/umbralink-control/descriptor-borrow/. All prior sealed namespaces remain
immutable; no desktop browser/profile/launcher/install, Pi, agent or index changes.

Six scoped source/test files now remove the outer owning SurfaceDescriptor copy
from eligible DMABuf imports. TextureHost offers optional BorrowSurfaceDescriptor
(default null); DMABUFTextureHostOGL stores its immutable payload in the union and
returns its address. Translator's existing strong host reference spans synchronous
use. Unsupported hosts retain owning fallback; upload still makes its necessary
owned copy. All admission/cache/fallback checks unchanged. Do not call this
repeated serialization or claim all plane FDs duplicated: only populated
ipc::FileDescriptor refCount entries duplicate OS handles on owning copy. Actual
playback populations, speed benefit and member-size tradeoff remain unmeasured.
Experimental GPU path stays default OFF/uninstalled; no public API/pref changes.

Behavioral RED42cases/9expected failures -> GREEN42 compiled-region cases with
GL/IPC stand-ins. Full strict tooling460PASS; six-file registered lint0 after
retained formatting warnings; six source/native-runner contract groups PASS.
Actual new native test BorrowedDescriptorKeepsIndependentOwningCopies uses real
DMABuf/eventfd plus pixels; total expected54 native tests, NOT run yet. Existing
53-test baseline native/pixel/loss proof does not prove this new candidate.

before.json retains initial seven files and complete working/index patches.
source-final.json pins67 files, exact six changes; implementation-final.patch is
phase delta. HEAD892431809a4caadb5c73b2c03ad9bdb124c3e21e, index SHA3b78253c...,
mozconfig9e4d8c5c... unchanged. Generated preparation/package/native helpers retain
as-run bytes; wx outputs must not be rerun. New intended export
exports/umbrafox-descriptor-borrow-20261006/ does not exist at this checkpoint.
Native runner adds only new namespace and one mandatory test; harness150 inputs.

Build session95606 began2026-10-07T05:12:10UTC and is now TERMINAL exit124:
env CARGO_BUILD_JOBS=2 MOZ_BUILD_DATE=20261006175655 timeout --signal=TERM 1200
./mach build -j2 binaries --priority idle, redirected to descriptor-borrow/build.log.
Watchdog expired at20minutes after widget/gtk19m40.59; no compiler error recorded.
Exact session3179773 process census is empty after exit. Do not poll/restart old
tool handle. Native build INCOMPLETE, no package/native/browser run attempted.
Before a separately bounded incremental continuation, revalidate pins and resource
preflight; account for broad header rebuild instead of assuming a tiny relink.
Preflight initially blocked unrelated AeorDB
job; it later exited without intervention. Final preflight45077909504B available
memory/77546369024B disk/no active compiler. Package required after successful
build, but installation expressly excluded. Native gtest build/remote execution,
pixel comparison and performance acceptance remain pending. No new remote or
browser/profiler session launched in this phase so far.

Owner status response: request admission101-102ms->2-3ms and fetch22-24ms shorter
in controlled installed-observer/busy-page cases, not YouTube causality; controller
6152 dead entries->0 only forced-GC fixture; readback50->18 with50 exact pixels;
GPU CPU26-29% lower but smoothness FAIL/defaultOFF/uninstalled. Inactive DOM gate
microbench wins do not clear later inline interleaved-layout1-2% slowdown. Header
copy and QuickSuggest regional controls implemented. Current460 toolingPASS and
six status-contract groupsPASS (status-contracts.log); diffcheck0. No remaining
tool sessions from this turn. Broader goal active, not complete or blocked.

## October 6 Scrollbar Profile Diagnostic Completed

Latest owner status turn was no progress; continuation completed the pending P2
saved-profile/source diagnosis. Report bot-docs/reports/performance/2026-10-06-scrollbar-profile.md;
plan scrollbar-video-control.md P2 captures+diagnostic complete, original strict
native/page-count analysis FAILED and preserved. Full performance goal active.
No new product/native/default/install/desktop/Pi/agent/index actions this phase.

P2 fixed a/b profiled pair same normal render-pass-marker package4c8085f0...,
Build20261006175655/importON. Existing48s1/4/4/1 collector/geometry/ninefields;
onlyCSSdifference html overflow hidden. Both1192pagecallbacks/0drops; pagegaps
phase0 A5/B0, allotherphases0. Nativefinaldecoder/sink/compositor/container0.
Samegeometry1280x955/rootextent1280x1140; nativegraphicsbothmatchIntelIrisXeRPL-P,
Mesa25.2.8/X11/KWin/remoteWR. Profileoverhead limits remain, no timingacceptance.

Important fixed-premise failure: profile-analysis.mjs wrongly equates document
callback-attempt scopes withpagecallbacks. Bphase0 native299/page298; Bphase2
297contained+1crossing/page298. Frozen nsRefreshDriver.cpp SHAacfe7e45... proves
marker precedes WillFire eligibility and wraps nested callbacks, canzero/multiple.
New separate scope-analysis/evidence retainoriginalfailure/counts/crossings,
actualCallbackPairingProved=false/performanceAccepted=false. TinyBscope1.845us
consistentemptyattempt NOTproof. Bphase2scope starts24910.401673ms vs boundary
24910.631187ms; roundinginferenceonly, no clockadjustment/thresholdrelaxation.

Astartup scopes: vsync11@47.790-448.205ms, catchup13@476.307-958.652,
vsync12@1014.801-1447.997, catchup13@1482.724-1965.971. Afadetimer999.063ms/
0.083360ms with2fixturestyleinvalidations; nextStyles0.619079ms. B all50startup
scopes catchup29.884-1962.614, nofaderecord/noStyles inexport. A49vsB50scopes
notactualcallbackcounts. SixnativeA>50gaps vs fivepageprecisiongaps keptseparate.
Strengthensfixture-scrollbar scheduling lead; doesNOTerase P1hidden63msgap,
146ms/fourcompositordrop event, original27/29or28/29FAIL orlabelCPU+6.05%concern.
No global scrollbar/cadence change justified. Nextindependentcompositor/reuse
frequency/recoverywork remains, notanotherretry ofthispair.

New173inputharness5242ceb673234b9e6fef41f1bbb63a988adfdaa889bc1a4661bf5245c016714c,
40staticimports/old167unchanged/source66/index/configverified. Remoteowned
/home/wyatt/.cache/codex/scrollbar-profile-harness-20261006-XcQKFb
dev64512ino37124875uid1000mode0700. Runtimea rootrzOpTy browser1835058/
controller1835045, content1835228; b5gqgWe1838043/1838031,content1838208.
Capture04:28:49-04:29:51Z and04:30:18-04:31:20Z October7UTC/October6Phoenix.
All17capturestagesreplayboth;30resourcespeak152003593B,271Blog/0drops/cleanTERM.
All24recordedPIDsabsent04:48:05.813Z. Gzip11,321,365/11,268,099bytes opaqueonly.
No privateprofile/token/appdataexport. NamedCLI0.10.0 singleloadeach loopback9,
13commandseachpassed; daemon3132415/3132822 sockets/PIDsabsentafterstopandfinal.
No rawparser/newprofiler/browser started duringlatestofflinecontinuation.

41strictNodegroupsPASS3.23s; new3behavioralREDretainedthenGREEN. Scope/export
18negativecases,command/session17,graphics6; fullsavedreplayandfrozenproducerproof.
Doc/reviewlint0,5newauthoredformatPASS,diffcheck0,prior3sealsPASS. CurrentP2SEALED:
282files64318285B, artifacts/umbralink-control/scrollbar-profile-final.sha256
SHAab7a38b53f91aa8415b53b0c94d54d71289a49baacc08e34c83e14490efa2377.
Namespace/report/sealerimmutable; doNOTrerun wxoutputs. scope-evidence import
replayScopes isreadonly, directCLIwritesexclusive; originalprofileanalysisstill
failsbydesign. Generated/executedruntimeandCLIexportersretainas-runbytes.
Alltoolhandlesterminal:47853,58290,33864,71297,18843,29188,69558exit0.
No liveownedbrowser/compiler/CLI/SSHsession remains. Nextworknewnamespace.

## October 6 Scrollbar Control Completed

Latest owner progress-report turn was status-only/no progress. Continuation
implemented and ran fixed isolated laptop A1/B1/B2/A2 overflow control. Report
bot-docs/reports/performance/2026-10-06-scrollbar-control.md; plan
bot-docs/plans/scrollbar-video-control.md P0/P1 complete, P2 NOT started.
New namespace artifacts/umbralink-control/scrollbar-control/ only; no product
source/build/default/install/desktop/Pi/agent/index actions. Full goal active.

Same normal render-pass-marker46-file package4c8085f0... botharms,
Build20261006175655/importON/profilerOFF. A exactoldCSS; B appends only
html{overflow:hidden}. Both onegeometryread aftercanvasprepend/beforeplay;
forcedlayout commonobserverchange, no poolingolderdata. Original48s1/4/4/1,
9timingfields/packed512KiB/nodecaps/120s15scleanup unchanged. Geometryallfour:
viewport/rootclient1280x955,root/bodyextent1280x1140,canvas0,0,320,180,
video0,185,1280,955; onlyoverflowvisible/hidden differs. Positive185pxoverflow.

4752callbacks/4736intervals; phase0gaps>50 A1=1/B1=0/B2=1/A2=2, allother0.
A1offset1381 gap51/tick49.96/age1.32ms; B2offset111 gap63/tick63.66/age-0.46;
A2offset1012gap53/tick52.72 and1213gap51/tick50.30. Rawnegativeage retained.
Adjacentbatches0-2ms. All16phases0drops; allfinalnative decoder/sink/compositor/
container0. FourcopyP952ms all. CPUelapsedweighted -0.902%, notconvincinggain.
Hidingoverflow DOESNOT eliminateallstartuppause; nativefadeabsence unknown.
NextP2 separateprofiledpair: actualfade/style/dispatchgroups plusclock/docjoin,
notanotherunprofiledretry. Original27/29and28/29FAIL/146msgap+4drops untouched.

New167fileharness da60465191abdc16c4ebf25470eb53c823421982ecf02abe13bdfc853b2a4009
retains158oldinputs;33staticimports/source66/index/configguardsPASS.
Remote /home/wyatt/.cache/codex/scrollbar-control-harness-20261006-YlfZas
identitydev64512ino37122644uid1000mode0700. Capturebrowser/controller pairs
A1 1820218/1820186 suffixgcXIUz; B1 1823086/1823074 suffix7KaBrg;
B2 1825987/1825975 suffixwlJCWm; A2 1828896/1828884 suffixARfZsE.
AllcleanSIGTERM;48recordedPIDs absent04:12:26.297UTC;56resourcescaps,
peak146716276B,176publicfiles908605B. No privateprofile/token/appdataexport.
Nativegraphicsallmatch IntelIrisXeRPL-P/Mesa25.2.8/X11/KWin/WebRender;
ffmpegRDDH264hardware=true final, initialdecoderlabelshutdown retained.

23strictNodegroupsPASS plus5hiddenservergroups; behavioralRED2expectedfail
retained. Initialimplementation uniqueanchor/crossVM failures corrected.
Comparisoninitialwrong profile.profiler assertion removed: thatobject iscanvas
profileprefs; actual savedperformance/browserprofilerfalse validatedbycapture
replay. FullreplayexactincludingallnineRPCs/fourruns/graphics/hash/caps/CPU.
Currentnamespacewriters createwithwx. prepare.mjs generate/extend/bundle write
and MUSTNOT rerun; verify readonly. analyze.mjs directCLI writesadmitted/diagnostic;
verify.mjs directCLI writescomparison/finalabsence; importsreplay/verifyreadonly.
Runtimepipeline57675, transfer39296, lint60871, verify52112 allterminal0.
No liveownedbrowser/profiler/compiler/SSHhandle. P1 SEALED290files9671319B at
artifacts/umbralink-control/scrollbar-control-final.sha256,
SHA91675eb6d60d9b28b8a4d5daa30ae904431db4c7dd25bae63b73cdb798ebae66;
double-read+independentcheckPASS. Namespace/report/sealer immutable; neverrerun
wxwriters. Final23groupsPASS0.48s;10authoredformatPASS/docs+reviewlint0/diffcheck0;
prior3sealsPASS. Finallint88257/reviewlint65189 terminal0. NextP2needsnewnamespace
andboundedprofiledadapters; no profiler or new runtime active. Keepfullgoalactive.

## October 6 Refresh Catch-Up And Scrollbar Lead

Previous owner-status turn was no progress. Continuation completed saved-profile
analysis with new pure analyzers and frozen-source trace. Report:
bot-docs/reports/performance/2026-10-06-refresh-catchup.md; evidence
artifacts/umbralink-control/refresh-catchup-audit/. No browser/native build/remote
runtime/product/source/index/install/Pi action. Original27/29and28/29FAIL remain.

Existing compositor-controls gzip8eda3570... revalidated, old complete analysis
deep-equal; two new full scheduling exports agree by name/time/duration/payload
(not session-local marker handles).1189callbacks,1225ticks,1169catchuprunnables,
1166callbacks insidecatchup,8waitingpaint. No rawpair/hardware-vsync proof.
First2s all49callbacks classify: PVsync11@47.761-448.719ms, catchup13@483.045-
966.457, PVsync11@1015.409-1415.391, catchup14@1449.509-1980.049.
Five nativeclock startup gaps>50ms allPVsync; pageclock3 preserved, notnewgate.
124.088ms profiledbackpressuregap remains distinct from unprofiled146ms/4drops.

Concrete newproducer: ScrollbarActivity::FadeBeginTimerFired at1001.093ms,
duration0.127ms contains2 exactfixture styleinvalidations. NextStyles1.072ms;
thensecondPVsyncgroup. FrozenGTKdefault1000msdelay/400msfade matchesgroupwindows;
BeginFade->removeactive->UAopacitytransition, source-backed HYPOTHESIS notcause.
Ownedcollector prepends320x180canvas beforefullheightvideo, maycreateoverflow.
Actualgeometry/scrollbar/transition/LnFvalues notcollected; noAnimation/Transition
marker, query1222matchesonlyrefreshreasonstrings. NOTPiPproof or50msGCpause.
Eight exactbuildHEADfiles archived, absentfrompackagepatch/currentbytesmatch.
StartTimer can useTimeStamp::Now; callbacknow notautomaticallyphysicalvsync.

Next separate fixed balanced original/overflow-suppressed ownedfixture diagnostic,
samepackage/import/video/copies/caps. Geometryafterprepend; no productpref/API/
cadencechange. Profileconfirmation must testfadeabsence vsdispatchregime; separate
unprofiledcontrols measuregaps. DoNOT replaceoriginalfailedscreen orretryuntilgreen.
Actualcachefrequency/automaticrecovery/labelCPU+6.05% stillopen. GPUOFF/uninstalled.

13offlinegroupsPASS inclsavedreplay/source/typednegative/containment/exporterproofs,
docs lint0/diffcheck0; source66/harness150/index/config guardPASS. Firstexport
37543 terminal0; second41625 handlemissing, savedcleanup confirmscomplete;
no restart. PIDs3052999/3053043 and3058107/3058135 plusnamed sockets independently
absent in final-absence.json. Onlyoffline CLI0.10.0/samply usedoldgzip/localpackage
symbols, noexternalfallback/rawparser. Lint18326 terminal0. No livehandles.
Generated/executed exporters retainas-runbytes. PhaseSEALED133files9912094B:
artifacts/umbralink-control/refresh-catchup-final.sha256,
SHA6964014389ccc58daaed1c2cc23d366743a2d56b9d3503a34d9e94fd5a662f37.
Double-read+independentsha256checkPASS; prior3sealsPASS,10authoredformatcheckPASS.
Namespace/report/sealer immutable. Never rerun wx-writingCLIs intoexistingoutputs.
Source-proof.mjs archivesonly
Gitbuildsource anddoesnotlaunchbrowsers. Finalgoalactive, no completionclaim.

## October 6 Callback Delivery Runtime

Status-only prior turn was no progress. Continuation integrated the new timing
collector and ran three isolated laptop attempts: first transport failure, then
corrected pre-cache/reuse diagnostic pair PASS. Report:
bot-docs/reports/performance/2026-10-06-callback-delivery.md. Evidence separate
callback-cadence-runtime/ and callback-cadence-runtime-v2/ under artifacts/umbralink-control.
First nine-field array exceeded existing UmbraLink10000-node cap; page null and
boundedJSON error saved, secondary nullvalue error retained. Both exact package
serializer entries match source; original five-field succeeds, nine-field fails.
No cap raised. New diagnostic packs4phase row arrays as explicit JSONstrings
after collector cleanup, <=512KiB; raw saved before strict decode and oldsummary
projection. No observations dropped, public API/native/source changes or perframeRPC.

Corrected2runs2375callbacks2367intervals,6startup51msgaps: tick49.38-50.86ms,
callbackage0.82-1.98ms, adjacentdraw0-1ms, allwithin1350ms. Mostgap beforecallback,
NOT schedulingcause/GPU proof. Phase callbackageP951.06-1.22ms; maxany5.54ms,
negativeprecisionvaluespreserved. DecoderprocessingDuration absentall. Zero
quality/native drops both. Old27/29and28/29 FAIL unchanged,146msgap/4dropsunresolved.
No newCPUacceptance, actualcachefrequency/automaticrecovery stillopen. GPUOFF
default/uninstalled; dailybrowser untouched. Next source/private-span causaljoin
from position/invalidation to actualrefresh, no cadence or threshold changes.

Corrected158fileharness37ccb9d07d2dfe47280382c26de4e2a721a0219116ea05e2621238a08eb4c8d6
retainsold150; remote callback-cadence-runtime-v2-harness-20261006-cSA68z.
Normalpackages4c8085f0/9ec305ad unchanged. Browser/controller pairsfailed1802731/
1802699,A1806957/1806945,B1809850/1809838; all36recordedPIDs absent03:19:10.948Z.
AllcleanSIGTERM271Blog0drops; corrected28resources/88files450249B,peak144001685B.
21combinedofflinegroupsPASS. Runtimepipeline54077 and transfers2322/31191,
failedcapture18479/export98136 terminal. No livebrowser/profiler/build/SSH handle.
Source66/index/config unchanged; no staging/commit/install/Pi. Phase SEALED:
237files3801076B, artifacts/umbralink-control/callback-delivery-final.sha256,
SHA7f93e6f39698762e79d2d390c1a8da5cd90085888b0ccdeb95dcedb642b77e84.
Double-read+independentcheckPASS. Final21testgroupsPASS0.8s,10authoredfileformat
PASS,docs lint0/diffcheck0; executedhelpers retainas-runbytes. Bothnamespaces,
fourcadence-importadapters,sealerscript andreportimmutable. No furtherwritesor
rerunningwritingCLIs there. Anynewinvestigation requiresnewnamespace. Lint18186
terminal; finalsource/harness andprior3sealsPASS. AllnewtimingprocessingDuration
null; no perdurationdecodeclaim. Finalruntime a5HyYcg/bW3kG5P sourceprofiles
untouched, no privateexports. Goalremainsactive, nextcausaljoin/frequencygate.

## October 6 Callback Cadence Audit

Status-only previous turn was no progress. Continuation completed offline source
and saved-data audit, not a browser run. New evidence callback-cadence/ under
artifacts/umbralink-control; report2026-10-06-callback-cadence.md. Both prior
comparisons still FAIL unchanged.9478withinphase intervals rechecked from8exports;
reuse4738intervals18gaps,24.724-24.811Hz all16phases; descriptor4740intervals13gaps,
24.641-24.835Hz. ExpectedDisplayTime current/nexttick estimate is not independent
presentation; 51mscallbackgaps can have34or67msexpected gaps. Earlier146msgap+
4compositordrops remains unresolved. Ownedclip startup ffprobePTS evenly30fps.

11sourcefiles from frozen892431809a4c, bothpackagepatchesexclude them, current
matches. Chain MDSM40mspositionwatch->MediaDecoderInvalidate->HTMLVideoInvalidate
->DocumentSchedule->refreshcallback. Source supports cadencelead, NOT causal
per-event proof or universal25Hzlimit. Existingcallback discards now/ptime/framePTS.
New diagnostic generator adds4rowfields(now,presentationTime,mediaTime,nullable
processingDuration), schema2, no newtimers/RPC/draws.12strictNodegroupsPASS incl
fullfakeclock equivalence, oldfailurecleanup,8savedruns and malformed/cap/clock
cases. No production source/build/runtime/remote/daemon/profiler/install/Pi action.
Original index/config unchanged. All commands terminal, no runninghandle.

Next integrate additive diagnostic driver with raw9fieldsave then explicit5field
projection, same48s1/4/4/1 and120s/15s envelope. Separate original/candidate timing
diagnostics NOT P3retry/acceptance. Signed at-now separates deliveryage; olddata
cannotrecoverit. Actualcachehitfrequency/automaticrecovery remainopen. Candidate
GPUdefaultOFF/uninstalled, dailybrowser untouched. Newphase SEALED53files7175422B
at artifacts/umbralink-control/callback-cadence-final.sha256,
SHA8ef604f1fb2cfda67f23e5a360e807fe27f49f2fa94e22200caa301354b827a5.
Double-read+independentcheckPASS; final12testgroupsPASS0.76s,5authoredformatPASS,
doclint0/diffcheck0; source66/harness150 unchanged. Previous274fileplayback and
descriptorbalanced sealsPASS. All lint/testexec terminal (75236,16774 included).
Phase namespace/report immutable; newruntimeintegration must use newnamespace.

## October 6 Frame Reuse Playback Result

Actual fixed A1/B1/B2/A2 completed on quiet laptop, normal46file packages:
A immediate pre-cache4c8085f0, B9ec305ad, both importON/profilerOFF. JoinedCPU
elapsed-weighted -3.496465%, but FAILED screen28/29: B2phase0 has7gaps>50ms
vsbaseline maximum4 (A1=3,A2=4,B1=4). All16phases0drops, native decoder/sink/
compositor/container0. All18gaps51-55ms occur withinfirst1.431s; adjacentdraw0-2ms.
FourcopyP95 remains2ms allarms. Notstatisticalspeedup, actualhitfrequency,
automaticrecovery orYouTubefix. No runretry/exclusion/thresholdchange.

Evidence artifacts/umbralink-control/import-reuse-playback/;
report bot-docs/reports/performance/2026-10-06-frame-reuse-playback.md.
Remote input /home/wyatt/.cache/codex/import-reuse-playback-harness-20261006-UDHMVg,
root64512/37118840/uid1000/mode0700. 150harnessb423aba4b44f0fa473c55e2efd3a0458746af58f2f3be3b21911ee445cf66853
retains146oldinputs. Source66/index/config/HEAD unchanged. No productedit/build.
Runs laptop-import-reuse-playback-{a|b}-20261006- suffixesSlYEWx/kcSie3/BmfYCH/t2mZYz;
browser1785648/1788099/1790615/1793050, controller1785615/1788087/1790583/1793038.
All4cleanSIGTERM,271Blog0drops;177publicfiles1370232B,56samples max146019845B.
49recordedPIDs independently absent02:30:16.176UTC Oct7; finalremote fullchecksPASS.
First finalabsence commandmissingstdin dash failed beforeverifier; corrected
final-absence-verified.json passed, failure retained, no browserrerun.
13offlinegroupsPASS inclfull replay, numeric negatives, exactgap/CPU summary,
all4graphics and finalabsence receipts. Scoped doclint0.
All runtime/export/preflight sessions terminal. No owned browser/build live.
Native previous103file seal13dfe039... remains immutable. Playback phase SEALED
274files3553392B at artifacts/umbralink-control/import-reuse-playback-final.sha256,
SHA4d0d5172041e9bdc8e17b588152da2fb91cd0a33df98e519329968e00d496fbe.
Double-read and independent sha256sum checksPASS; 10authoredfileformatPASS,
finaldocs lint0/diffcheck0. Phase namespace and report immutable, allwriters
terminal. No live session to poll. Dailybrowser/profile/launcher/install/Pi untouched.

Next measureactual nativebatch reuse separately and localize startupgaps. DoNOT
rerun samecomparisonuntilgreen or claim lowerCPUprovescachehits. P3executed but
acceptancefailed; automaticrecovery/P2frequency stillopen. Earlier27/29smoothness
and labelCPU+6.05% independent/unresolved. Fullgoalactive, no deployment.

## October 6 Native Reuse And Next Playback Comparison

The latest owner-status turn was no progress; automatic continuation resumes
the existing video-import-reuse plan. Actual native hardware tests completed:
53 PASS, zero skips/errors, including nine new real DMABuf/Intel Iris Xe tests.
Initial run44PASS/9setupfail preserved: gtests force headless and software
compositor policy blocks DMABuf setup. Test-only policy override after hardware
context admission is restored in all nine receipts; production guard unchanged.
Forced WebGL loss rejects old imports; explicit new context recovers exact pixels.
Not automatic translator recovery, YUV coverage or normal playback hit-frequency.
Report bot-docs/reports/performance/2026-10-06-frame-reuse-native.md;
evidence artifacts/umbralink-control/import-reuse-native-context/.
Final native manifest98f882428d201bb45a0711b64ae22c50bc5f7de19f789b6e80668b88869acaae,
150harness1cb4ac4773e2dfaee3e09ffb1bcf6dcc805eba266b1fae9221f5edbd37c56751.
Native/controller1779422/1779410 plus3helpers absent02:09:13.685UTC Oct7;
initial failed run's5PIDs also absent. All commands terminal; old22395 handle
missing and mechanism-regression.log proves28source-region casesPASS.
Source66guard preserves index/config/HEAD, only test file+friend/build registration.
Normal package remains9ec305ad; no normalbuild/install. Summary-final.json corrects
ambiguous derived hardware field; raw evidence untouched. Native phase SEALED
103files718166877B, manifest13dfe03912464bdd9d9a648127afd863c2fa25b877721fff497b65e42a1793b0
at artifacts/umbralink-control/import-reuse-native-context-final.sha256.
Double-read and independent sha256sum checksPASS; final5offlinegroupsPASS,
docs lint0. Namespace/report now immutable; source unchanged.

Next fixedP3A1/B1/B2/A2: immediate pre-cache4c8085f0 versus9ec305ad,
both importON/profilerOFF, existing48s1/4/4/1collector/29gates. New namespace
required; no instrumentation or API. This can measure package effect without
claiming actual cache-hit frequency or waiving automatic-recovery gap. Old27/29
screenFAIL and labelCPU+6.05% remain. Daily browser/profile/launcher/Pi untouched.


## October 6 Batched Frame Reuse GPU Gate

Previous turn was status-only/no progress. This continuation implements a new
owned batched pixel collector and completes two actual laptop captures against
the immediate pre-cache baseline, importON in both. All40 fullcanvas/160tile
comparisons match exactly; both acquisition orders/repeats, simultaneous retained
frames, interleaved2canvases, genericRGBAinterleave and resize pass. No product
edits/build/install. Report2026-10-06-frame-reuse-batches.md; evidence namespace
artifacts/umbralink-control/import-frame-reuse-stress/. Baseline4c8085f0 and
candidate9ec305ad are normal46file packages, Build20261006175655.

Fresh remote harness import-frame-reuse-stress-harness-20261006-Fdwxbi under
/home/wyatt/.cache/codex;152inputs e4d162bcbf261e6bb60c073a8561af9aafcc7881c0aac92d08fd5a32e6c44e3d
retain146oldinputs unchanged. Remote captures laptop-import-frame-reuse-stress-
pixels-reference-20261006-eTYhna (controller1760367/browser1760386) and
pixels-on-20261006-MH97tx (1762691/1762723); durations26733/26507ms.
Both cleanSIGTERM/0drops,80publicfiles759108B,16samples max147751474B;
24recordedPIDs independently absent01:40:25.503UTC Oct7. HardwareIrisXe/Mesa25.2.8,
H264hardware; all sampled canvas providers accelerated, NOT individualcachehits.
Sampled beforetrees contain no separateGPUprocess. No private payload exports.

37focused+adjacent strictNodegroupsPASS10.7s. Raw/scaffoldsyntax and missingmodule
failures, wrapperassumptionfailure retained; no browserretry. Serial parentroute
and sharedcapturebudget/cleanup preserved. Product65/index/config and146prior
pinsPASS; prior267GPU/190mechanism sealsPASS. Browser85644/92007, exporters74475/
92682, layout9621, preflights65987/51423/final43962 allterminal; no browserlive.
Tests29395, old13603/12535/42785, lint37769/82894/85984 terminal. Finaldocs lint0,
explicit10fileformatPASS,diffcheck0, exactsavedsummary+24PID replayPASS.
SEALED157files2111548B at artifacts/umbralink-control/import-frame-reuse-stress-final.sha256,
SHA9b170a10b0a1e2edcebab054955f558b655c786fc21bdd2ba351e70ec6f2087b.
Double-readsealer and independentsha256sumcheckPASS. Newnamespace and itsreport
nowimmutable; activeplan/DETAILS remainoutside seal. No live session to poll.

P2contextloss/recovery and actualnativebatchhitfrequency STILL OPEN. Pagebatch
noawait/readback doesnotprove nativeTranslateRecording batching. Widthreset is
notGLcontextloss; compositorreset/GPUrestart mustnotbe mislabeled. Next source/
native proof, then fixedA1/B1/B2/A2 playback against4c8085f0, not olderbaseline.
Prior27/29smoothnessFAIL and labelCPU+6.05% unresolved; fullgoalactive.
Dailybrowser/profile/launcher/Pi untouched; GPUimportdefaultOFF/uninstalled.

## October 6 Frame Reuse GPU Correctness

Prior status turn confirmed pending pixelOFF had terminated. This continuation completed four
actual laptop runs using normal candidate9ec305ad and new152harness3fbdccff.
ImportOFF48hashes match fullsize reference21178496; ON48matchOFF; four RGBA
buffers each exact/repeatsstable. Both permanent decoder-loss modes match all8
reference outcomes incl InvalidStateError/bitmap. No product edits/build/install.
Eighteen offline/preparation checksPASS, source65/oldharness146guardPASS,
explicitformat6offlinefiles+sealerPASS. Initialdefaultformatterignoredartifacts;
explicit /dev/null ignorepath executedformat and18testrecheckPASS. Runtime adapters byte-equivalent namespace/identity only.

Evidence artifacts/umbralink-control/import-frame-reuse-gpu/;
report bot-docs/reports/performance/2026-10-06-frame-reuse-gpu.md.
Input laptop root /home/wyatt/.cache/codex/import-frame-reuse-gpu-harness-20261006-3WtpOM.
Output suffixes pixelsOFF-MXd8mv/PID1743798, pixelsON-TZBUL4/PID1746786,
lossOFF-BcrVHl/PID1749084, lossON-vRGAhU/PID1751348, each begins
laptop-import-frame-reuse-gpu-{pixels|loss}-{off|on}-20261006-.
173publicfiles7956429B exported/rehashed,22samples max66350461B, cleanSIGTERM0drops.
Export12/12/13/13recordedPIDs absent; independent all50absence at01:12:32UTC.
RDDterminal was single-thread zombie at poll2, then finalabsent; not restartproof.
All exec/SSH/capture/export sessions terminal; no browser/runtime remains live.
Initial finalabsence shellquote failure retained; stdinsecondcheckpassed.
Replay first16pass1fail was wrong test field (loss has observation.enabled),
corrected from actual producer, no browser rerun or evidence modification.

P2expanded same/alternatingframe+multiplecanvas/contextrecovery STILL OPEN.
Existing pixel collector readbacks can invalidate reuse, so no hitfrequency
proof. P3fixedA1/B1/B2/A2 against immediate render-pass baseline remainspending;
27/29prior screenFAIL and labelCPU+6.05% unresolved. Fullgoalactive.
Dailybrowser/profile/launcher/install/Pi untouched; GPUimportdefaultOFF.
Previous190filemechanism/pixelreference/descriptorseals rechecked unchanged.
Newphase SEALED267files18779423B manifest2a07d9e24daea618cd04f08793dd65bcf3c18fc2b6c3ed6fc956a536b980b956
at artifacts/umbralink-control/import-frame-reuse-gpu-final.sha256.
Double-readsealer and independent sha256sumcheckPASS; finaldocs lint0,
diffcheck0, source65/146 finalguardPASS. GPU namespace and its report nowimmutable;
expanded P2 MUST use new namespace. Mutableplan/DETAILS outside seal.

## October 6 Frame Reuse Package And Native Gate

Previous status turn was no progress; this continuation packages/tests actual
candidate. Final source guard65product/146harness PASS after build/package.
machpackage99205 exit0/185.35s; structured export50468 exit0. Fresh46files,
onlylibxul changed vs render-pass baseline; both JARpayloads identical;
toolkit+INIs Build20261006175655. Export exports/umbrafox-import-frame-reuse-20261006,
manifest9ec305adc36c8c1e362ed6e74925c8c473efd999212d354c6f11431ca17b8678,
archive0904beeebecf4aa7da5ebada1e9d83e977bd03ed09f5f928c061d97fb95b4ebb,
libxulf5591cd1cbd1ec27f12f1489723fa4df878a50cbaf6f7769fbf75f3e5b9862a5.
Independent package verificationPASS. No install.

recurse_gtest66256 exit0/29.44s, twojobs; SWGL optionwarning retained despite
summary0compilerwarnings. Stripcopy58463 exit0, original3.37GB library untouched.
48file native manifest23be5361e22a96b76431f5b61a7ebf5ccb61af3345f2ff39f85bd200e6cecf72,
testlib8b42f71f153ea7280ea10761b29e0c012e6152cf5571b0d26459716466e3fa97.
New namespace artifacts/umbralink-control/import-frame-reuse-native/.
Driver namespace-only equivalence, original40inventory/cleanup/budget unchanged.
150harnessmanifest766a9d85a8bb82d06ac686585df3b3f6018e6930b3f27c2726fb4f74619cde29,
146oldinputs unchanged. Remote preflight48+150PASS,busy[],12GBavailable/96GBdisk.

Actual laptop40PASS0fail/skip/error, SSH45146 exit0. Native process1736842,
controller1736830,helper1736844,IPCpeers1736878/1736889 absent by independent
remotecheck00:51:35UTC. Packagepostcheck48PASS,8446Blog. Four publicfiles exported
to namespace/native; no profile/token/appdata export. Sourcecodefake-cache28cases
remains separate, this40suite doesnot execute newGPUcache on realdriver.
Remote freshharness /home/wyatt/.cache/codex/import-frame-reuse-native-gtest-harness-20261006-IKNoHC;
output /home/wyatt/.cache/codex/import-frame-reuse-native-green-5bc5ec8a-343c-40a2-8d4a-a12199af8548.
All build/export/transfer/runtime handles terminal; no own browser/build running.
Initial SSHpreparationquotedliteral producedempty receipt; preserved, explicit
remote-prepare.mjs succeeded. Earlier Cargo admission refusal also preserved.

Plan video-import-reuse.md P2 stillopen: next48pixel matrix,8retainedloss,new
same/alternatingframe+contextrecovery checks, then fixedA1/B1/B2/A2 performance.
Use freshnamespace wrappers and candidate above, preserve all oldevidence. No
default/API/shader/tolerance change; GPUimportOFF/uninstalled, dailybrowser/Pi
protected. Report2026-10-06-import-frame-reuse.md updated. Final4replaytestsPASS,
docs lint0 and diffcheck0. All writers terminal before seal. Seal
artifacts/umbralink-control/import-frame-reuse-mechanism-final.sha256 covers
190files944920369B; SHAe51df14be904c1c73faa8202d46d7a91ff1f7aefc65f22d95832f452891d3456.
Double-read sealer23241 exit0, independent sha256sumquietcheck exit0. These3
namespaces/export/report are now immutable; mutable plan/context excluded.
Next browser gates must use46file normal candidate, not48filegtestoverlay, fresh
output/harness namespace and unchanged146input containment. No active owned
browser/build/transfer/lint/server remains. Full performance goal remainsactive.

## October 6 Frame Reuse P1 Implemented

Supersedes P1 NOTSTARTED below. Four native files DrawTargetWebgl.{h,cpp} and
CanvasTranslator.{h,cpp} plus import-reuse-spec.mjs/import-reuse.cpp implement
batch-scoped exact TextureHost/frameID reuse via weak existing TextureHandle.
Normal bridge/content/descriptor admission remains per call; no extra strong
surface/texture cache. Actual-source compiled stand-ins:28 casesPASS, four-copy
conversions4->1. Full tooling460PASS15.05s; six-file lint0. Original RED3fail and
new lost-global-context RED1fail retained. Final correction clears old global
context before replacement even for a new translator with no local context.

Final build handle85368 no longer exists; build.log authoritatively ends success
48.32s/0warnings. Initial build56286 success109.66s predates final3line correction.
No own build is active. verify.mjs rerunPASS:65source/146harness pins, unchanged
generic conversion/CPUreuse/bridge bodies and HEAD/index/config. Sources and
candidate archives in artifacts/umbralink-control/import-frame-reuse-final/;
original before and REDs in import-frame-reuse/. Neither namespace sealed yet.
Final implementation delta SHA45999cf62be52b7dadecb539766739e215c7af71a8ad2a8f590031ff94823ae4.

P2 package NOTYET run: preflight-package.json refused unrelated cargo2817717
at2026-10-07T00:39:59.172Z,45GBavailable/68GBdisk. No external process touched.
Recheck authoritative process then new named preflight, never overwrite failure.
Final package-export.py is prepared for exports/umbrafox-import-frame-reuse-20261006,
baseline render-pass-marker; preserves existing structured archive/nativeID/JAR
verification. Needs configured mach Python for mozpack imports. Existing65pins
and146harness frozen; current fullsource package/buildID20261006175655.

Active plan bot-docs/plans/video-import-reuse.md; report
bot-docs/reports/performance/2026-10-06-import-frame-reuse.md. P1 mechanism/build
only, realGPU/40native/48pixels/8retainedloss plus newreuse/context tests and fixed
A1/B1/B2/A2 laptop performance still required. Existing descriptor-availability
wrappers provide bounded package/pixel/loss/native envelopes; use new namespace,
preserve all old evidence. Daily browser/profile/launcher/install/Pi protected,
GPUimport defaultOFF, no staging/commit/agent. No new speedup/stutterfix claim.

## October 6 Completed Range Audit And Frame Reuse P0

Previous owner-status goal turn was no progress. This continuation completed
new verification and a source-supported next optimization gate, no product edit.

profile-range-audit now SEALED:166files9608821B, final manifest SHA
a2366cff17257a08f5ac2ab873c839f30a418aeb37357453739257829dd3c367.
Seven testsPASS, fullsavedresult replay, formatting/doclint0,63product/146harness/
9native-source and patch/config guardPASS. Report2026-10-06-profile-range-and-import.md.
Source and actual CLI reproduce stale preview after pop/clear; explicit full
range restores9700 vs2398. All legacy captured evidence remains immutable.

New import-frame-authority P0 SEALED:44files868301B, final manifest SHA
37b264e15db0445a67c8b8b57aa5bbc4807bf90eb7570f33baadd9a614e71b2d.
Twenty files matched recorded-build pins or unchanged HEAD/no-patch. Four exact
native identity regions compiled: LayersTypes ID/counter, TextureClient producer,
GPUVideoImage GetDesc. Five native casesPASS incl64 stablecopies/1024 concurrent
unique IDs; generatedIPC classes/texturedata/Imagebase are stand-ins, NOTGecko
decoder/GPU execution. Three Node source/recording/hash groupsPASS; doclint0,
formatPASS, final63/146sourceguardPASS. Missing-source scaffoldRED preserved.
Compiler2107 terminal0; native3s/test10s gates terminal0. Lastlint82449 terminal0.
No browser/server/daemon/compiler/test remains running. No install, stage orcommit.

Report2026-10-06-import-frame-authority.md; active implementation plan
bot-docs/plans/video-import-reuse.md. Frozen P0 copy in evidence/plan-p0.md;
active plan may advance, but never edit sealed evidence/report. P1 NOTSTARTED.
Scope next: assertion-first short-lived shared-context GPU conversion reuse,
only DrawTargetWebgl.{h,cpp}/CanvasTranslator.{h,cpp} plusfocusedtests. Broadowner
performance authorization remains; no new daily-browser/install/Pi authority.

Authority: descriptor has fresh process-local SurfaceDescriptorRemoteDecoderId,
GPUVideoImage preserves it, recording serializes whole descriptor+holdsImage.
Nativehost lookup remains percall for content/bridge identity. Proposed cachekey
is strong exact TextureHost + valid frameID within SharedContext; per-process ID
or recyclable serial alone insufficient. Scope stronghost to translation batch,
clear all exit/transaction/loss/memorypressure/shutdown paths inclreentry.

Important design correction: DO NOT retain SourceSurfaceWebgl merely for reuse.
OnUnlinkTexture may forcePBO/CPUreadback for retainedsurface. Prefer weak existing
TextureHandle, respecting normal eviction and memoryaccounting. GetSurface
livewrapper mustbe reused; replacingowner whileoldwrapperalive risks olddtor
ClearSurface clearingnewowner. Expired/invalid handle=miss. Size/format/sampling
offset+context mustmatch. DrawRect/GetCompatibleSnapshot branch doesnotalways
refresh MRU, so explicitly preservelist behavior. Forcedupdates/subrect writers
stillneed P1 audit beforecode; IsValid alone is not contentimmutability proof.
No speedup/cacheimplementation claimed yet. Exactnative/pixel/error/playback
gates inplan; current experimentalGPUimport OFF/uninstalled; prior27/29screenFAIL
and renderer-label candidateCPU+6.05% retained. Fullgoalactive, no newblocker.

## October 6 Profile Range Result And Owner Status

Latest owner request is a progress report distinguishing implemented fixes from
experimental candidates and installed state. No new browser or product change
is required for that answer. Daily installation remains untouched this wave.

Supersedes the proposed/pending range experiment below: export session98189
finished exit0. Same saved capture reproduces profiler-cli0.10.0 stale preview:
fresh full9700 samples, phase3 2398, pop2398, clear2398 despite null committed
view range; explicit full-range selection restores9700. Entire non-context
payload fresh==explicit and phase==pop==clear. This is a tool range-state bug,
not browser sample loss. No installed CLI change; explicit range is the analysis
workaround. Prior CPU counters and accepted explicit-phase/gap results unaffected.

Owned daemon2739512/server2739484 stopped in finally, exact PID/socket absence
in profile-range-audit/cli/cleanup.json at2026-10-06T23:46:15.563Z and independently
rechecked. No live command/server/browser needs polling. Analysis4groupsPASS,
prepare2PASS; replay exit0. Correct explicit-full counts: t0/t2/t4/t3=9700 each,
t26=9644. Nonidle713/559/328/275/385, unresolved self19/227/102/14/31. All five
top-down exports truncate at501nodes; no complete branch-cost attribution.

Corrected exports support import/presentation as leads: CanvasRenderer import
146 inclusive samples, CopyToSwapChain95; Renderer SwapBuffers109, DMABuf texture
creation38. These nested populations are not additive or CPU-time percentages.
Exact pinned source shows repeated descriptor import/conversion, but reuse needs
immutable frame+context authority, not handle/FD identity. No new cache proposed
as safe without that proof. Driver symbols and profiler observer cost limit cause.

Namespace artifacts/umbralink-control/profile-range-audit remains UNSEALED.
Results/source-proof and native source snapshots exist; final report, log review,
format/lint/source guard and immutable seal remain the next documentation gate.
Previously sealed render-loop-audit and all older evidence remain immutable.
Do not repeat profile export or any browser run merely to finish that gate.

## October 6 Render Loop Audit And Profile Range Follow-up

Previous status turn was no progress. Finished actual packaged-code/source audit:
render-loop-audit-final.sha256 seals65files3725030B, SHA
95db5db20013c595bab0bec9b7cd89858b4082fa854ad7d13e492ab43453d3ab;
independent checkPASS. Report2026-10-06-render-loop-audit.md. SevenNode groupsPASS,
formatcheck/docs lint0,63product/146harness/9native-source/patch/config guardsPASS.
Renderer entryreservation1992B unchanged; actualhelper outofline317B/136Bstack.
Complete selected packaged/unstripped bytesmatch. CPUincrease also content+6.63%,
RDD+4.53%,parent+6.06%; no causeproved/noinstallation. Per-round profiler overhead
recordingANDstreaming requires MOZ_PROFILER_RECORD_OVERHEADS, absent from exact
savedlaunch env. Sampler seriallytimestamps/suspends threads; no independentstall
or PHCmutexattribution. No supportedoverheadexportroute established; no newbrowser.

New offline follow-up namespace profile-range-audit. SavedCLI full exports for
t2/t3/t4/t26 equal phase3 in ALL noncontextfields, despite currentViewRange:null.
InstalledCLI source FT pop leaves priorcommittedrange as preview; clearwithempty
stack returnswithoutclearing it. Need actualsamecapture verification beforeusing
fullprofile denominators. Generated export.mjs fromexact prior symbols-v2.mjs,
samecleanup/timebounds/ownership, newport37543 anduniquenamedCLI. prepare2PASS
(REDmissinggeneratedfile only). One proposedexistingprofile/local-symbol session:
freshfull->phase3->pop->clear->explicitfull, thenfivefullthreadcostqueries; no raw
profileparser, browser, networksymbols, sourcechange or Pi. Launchhandle will be
inconversation; pollit, neverduplicate. Previousrender-loop audit nowimmutable.

## October 6 Renderer Label Cost

Previous status-only goal turn was no progress. New actual-source Rust CPU probe
completed on desktop+laptop, same binary SHA f26ca493d482be897bf3f23a63700d1b88fc2b92aac1476257515496c8c3503b.
Namespace artifacts/umbralink-control/marker-cost, plan render-pass-label-cost.md,
report 2026-10-06-render-label-cost.md. No production edits or browser launches.
9Rust tests PASS, allocation12->0; exact labels/boundaries/live support changes.
128samples/host, fourABBA/BAAB blocks per8configurations; all raw data retained.
Laptop supported-small original34.26/36.20ns current29.75/29.74ns (inline/separate
wrapper); unsupported33.39/34.73->2.33/2.38ns. Desktop same lower median direction.
Ordinary helper CPU increase NOT reproduced. System allocator/fake backend means
NO PHC/driver/whole-renderer causal claim; earlier playbackCPU+6.05% unchanged.
Do not optimizeformatter again just to explain it. Next actual render-loop codegen
and source PHC/profiler coordination, no browser repeat solely from this result.
Laptop nativePID1719132 absent, remote root render-label-cost-20261006-nTxfZT;
SSH58214 terminal0, transfer12236 terminal0, compiler67102 terminal0,
desktop56974 terminal0(PID2690870). No browser/daemon session. Pure replay/receipt
negatives8groupsPASS;9RusttestsPASS;docs lint0/diffcheck0. Source still matches
prior63pins/146harness +HEAD/index/working/config. DesktopPID independently absent.
All sessions terminal; final phase seal marker-cost-final.sha256 verified after
all writers finished:46files10615374B, SHA
0b7728c63c2bf13275eb2a6014795ea4800abac4ee03b2952ebd409e2e0dd267.
Final documentation lint0 andformatcheckPASS. No compiler/tool/browser needs polling.
Prior render-pass-final.sha256 SEALED1005files631530571B, hash
b4e6a807f1791fc49fffc38be321e274ef8df1f4f8f87e59648ba4228b2ac6ab, checkPASS.
All previous native/defaultOFF/install/Pi/staged restrictions unchanged.

## October 6 Render-Pass Playback Comparison

Supersedes ACTIVE build below: native build20808 exit0 in85s; package96183
exit0 in105s; export terminalPASS,46files/nativeBuildID20261006175655. Candidate
exports/umbrafox-render-pass-marker-20261006 has manifest4c8085f0...eee8e,
archiveaca57ea3...cd810,libxul371a173c...24330. Only libxul differs from exact
descriptor-availability baseline; all other45files/frontendpayloads identical.
No install. Offline saved source test path corrected;18PASS, oldfailure retained.
Report2026-10-06-render-pass-markers.md, fuller source/symbol proof in compositor-gap.

COMPLETE A1/B1/B2/A2 laptop comparison, private render-pass-playback namespace.
All four functional/resource/cleanup gates and fixed29regression checksPASS,
but NOspeedup. CPUratesA1 .56985/B1 .58364/B2 .58178/A2 .52910; candidate
weightedCPU+6.05% vscombinedbaseline. Screen permits5% overWORSEbaseline,
so passing it is NOT overallperformanceacceptance. FourcopyP95 all2ms,zero
drops; longgaps1/2/2/5 allphase0 first1.214s. Baseline also lacks153msstall.
No rare-stall fixproof/noinstall. Same48s importON/profilerOFF bothpackages;
GPUdefaultOFF unchanged. Next isolatehelperCPU/codegen cost beforepromotion.
146inputmanifest aad722e3c9fe695726f61708f407ff43a9767de511acb6f595993bcb195de7bd;
142oldinputs preserved. Remoteexistingroot descriptor-availability-harness-
20261006-h9KsaO adds only artifacts/umbralink-control/render-pass-playback and
render-pass-candidate. Candidate transfer/identity/fullpreflightPASS. Allfour
drivers/exports terminal;48recordedPIDs independentlyabsent final-absence.json.
FirstA1 audit schemafail retained: driverrecordsmap+mode,analyzerexpectedscalar.
Correctedofflinejoin checks exactmap/mode/preflight+4native/INIhashes; no runtime
inputchange, backfill, rerun or thresholdrelaxation. comparison/summary.json
and fullpure replay authoritative. Source/report/finaltests sealing underway;
remote-final verification90775 terminal0,146inputs match. Final33replaytestsPASS,
docs lint0; no browserrunning. Next isolated actual-source label CPU experiment
uses new artifacts/umbralink-control/marker-cost, no product edit/browser.
Runtime120s/105swork/15scleanup,220sdriver240sSSH,15ssettle then preflight each.
Source/previous captures/index/desktopdaily/Pi untouched. No other new session.

## October 6 Render-Pass Label Candidate

ACTIVE: normal two-job idle build launched after22:37UTC preflight (busy[],
47.8GBavailable/69.3GBdisk), MOZ_BUILD_DATE20261006175655/CARGO_BUILD_JOBS2,
900s outer, log artifacts/umbralink-control/render-pass-marker/build.log.
Exact exec handle is in conversation; poll it, never duplicate. No browser or
installation authority expanded. Source manifest in that namespace pins63files,
17untracked, staged/unrelated patches unchanged. Only newdelta: device/query.rs
start_pass_marker stack label/unsupported early return; renderer/mod.rs onecall;
tests/unit/gpu_marker.rs. Existing dirty graphics edits preserved.

Standalone full query.rs plus exact extracted production call: originalRED
2pass/2behaviorfail,12allocations per10indices for both marker modes. NewGREEN
9pass including5 retained in-tree tests, zero label allocations. Stub frame/tag
types mean this is not full WebRender/driver validation. FirstRED compilemacro
error and firstGREEN selector-error preserved separately. Native build/package
and playback/performance gates still pending; do not claim stutter fixed.

Offline exact-gap exports in compositor-gap (UNSEALED): parent4threads each1
sample in153.752ms render vs40 each in200ms flanks; content31inrender. Native
symbols show one stack render_impl->format_inner->PHC->MozStackWalk->libgcc
Unwind_Find_FDE. Single sample not whole-stall/CPU attribution. Assembly export
has zero per-instruction weights despite functiontotal1; coverage gap retained.
Unresolved/symbolized single stacks + ELF alignment constrain one relocation;
candidate call neighborhood points to encoded `pass ` literal, inference needs
saved validation/report, not rawprofile parsing. Normal source also independently
proves unconditional heapformat before marker-support check. PHCwalk happens
BEFORE PHCmutex; do not claim that mutex held or disable safety checks.

All owned offline sessions stopped. Latest assembly daemon2604837/server2604811
and socket absent22:29:56UTC,8.14s. Older symbolsv2 daemon2599128/server2599098,
failedsymbol daemon2597357/server2597293, exactCLI2592396/failed2591097 all have
terminal cleanup receipts. No browser launched thiswave. Preserve original
controls-final-v2 seal and all failed attempts; next write onlynewnamespaces.
Plan bot-docs/plans/render-pass-markers.md. Goalactive; prior owner-status turn
was no progress, this turn implements/testscandidate afterexactsource trace.

## October 6 Recorded Renderer Stall Localized

VALIDFINAL: compositor-controls-final-v2.sha256 quietcheckPASS,863files87378773B,
SHAf882df5ca98c7247ef77dc0a8e864f90e1c2cf4f97e8c879ed263c34825e570e.
All writers terminal (lastlint50117exit0); firstinvalidseal retained. Namespace/
report/142runtimeinputs nowimmutable. Next analysis MUST use a new namespace,
reuse samegzip8eda3570...f18c and supportedownedofflineCLI. No live sessions.

Seal correction: first compositor-controls-final.sha256 was computed before
final lint handle68080 completed; independentcheck caught ONLY its changedlog.
Keep that failed attempt, neveruseit asvalidseal. Lintterminal0/zeroissues;
new reportfooter records incident and uses compositor-controls-final-v2.sha256.
No capture/code drift. Replacement must beverified afterallwritersstop.

SUPERSEDES older ACTIVE/STOP entries below: offline CLI v2 exec87702 terminal0;
153commands,36threads,eightmarks. Own daemon2568608 stop0 at21:59:13.760UTC,
exactPID/socketabsence21:59:13.762UTC,PIDrecheckedabsent. No browser/daemon/test/
lint/transfer/sourceaudit remains live. Remote verify91511 terminal0 at22:04UTC,
142frozenfilesmatch. Failed sourceproof62698/40448 bothterminal124 (wrongHEAD-only
comparison of patchedRust buffers); corrected proofterminal0 uses exactbuild
HEAD+same trackedpatch and explicitfilehashes. No missingnativeproof hidden.

Report bot-docs/reports/performance/2026-10-06-compositor-controls.md and
artifact compositor-controls/profile-analysis.json now authoritative. All3arms
unchangedfunctionalPASS; profileCPU+27.54/+27.06% vscontrols, controls+0.38%.
Normalized gap20119.699323..20243.699323ms=124ms. Parent RendererComposite
20088.980878..20242.732501=153.752ms; notifier153.802ms. wr.renderer_time
152.294ms emitted20241.463012, inside render_impl before later EndFrame/swap.
Seven exactfixture-document waiting-for-paint markers and fivebusyparent skips
insidegap; fourframedrop marker20257.975127 aftergap,producer1/577->582,nodocID.
Parent ID2 iswidgetIDscope, notfixture10737418242. Associationunproven retained.
Awake159.617ms has CPU-timepayload7.592ms; not159msCPUclaim. Parent195samples vs
content225 in1124msgapwindow; actualbefore/after coverage isNOTlosslesssampleproof.
Nativeframes largelyunsymbolized; strictCLI split-pair provenance unavailable.
No GPU/fence/swapcause/noYouTubestutterfix claim. ImportstaysdefaultOFF.

Final selected55testsPASS (~0.65s) including fullsavedanalysis deep-equality;
explicit5scratchfilePrettierPASS,report+planlint0,diffcheck0; previous704fileseal
reverified. Runtimeunchanged, desktopdaily/Pi/install/indexuntouched. Newnamespace
ready toseal (do notwriteafterseal). Next exact-gap supportedCLI sampleavailability
and existinginternalstage/sourceobservations beforeprivateinstrumentation;
no more browserlaunches thiswave. Fullobjectiveactive, no block/complete update.

## October 6 Parent Marker Scope Correction

Next single offline CLI export uses compositor-controls/cli-export-v2.mjs and
new cli-v2 directory/session composition-controls-v2. Original cli failure stays
immutable. Parent busy SkippedComposite innerWindowID comes from top-level widget
document via CompositorBridgeParent construction, not required to equal fixture
content ID. Six constructor inputs verified unchanged from recorded build HEAD;
38/60/135 existing source/harness guard passes. Parent-only classifier preserves
actual IDs (six ID2,775 absent) with fixtureAssociation unproven; content phase
and callback joins remain strict. Seven focused tests pass, including exact
exporter transformation/call+finally preservation. First transformation wrongly
renamed profiler-cli executable; static test caught it before execution, fixed.
No browser launch or runtime input change; previous daemon2560657 absent again.
CLI v2 external195s/internal180s with15s reserve, offline symbolserver127.0.0.1:9.
Poll same exec handle after launch, never duplicate. Goal remains active.

## October 6 Observer Controls Preparation

STOPPED21:51:18UTC CLI6427exit1: summarizeInstantExport rejectedSkipsdocument2
vsfixture10737418242. Rawskips.stdout retained; dropsnotqueried. OwnPID2560657
and socketabsent,stop0 confirmedcli/cleanup.json. No daemon/browserrunning.
Do not rerun sameexclusiveexporter. Need source/documentauthority audit before
newrevision; parentrootchromeidpossible butUNPROVEN. Runtime3armresults unaffected.

SUPERSEDING21:51UTC: all3 browser drivers/exports/replays terminalPASS. Final
comparison admitted-control-after.json: CPUrates0.57579/0.73434/0.57796,
profiled+27.54/+27.06%,controls+0.375%;onlyprofiledhas124msgap+4compositordrops.
All36recordedPIDsabsent. No more browser launches planned thiswave.
ACTIVE CLI exec6427,195souter/180swith15sreserve, ownsessioncomposition-controls,
new /tmp/codex/composition-controls-SUFFIX. Exactsessionpath in newcompositor-controls/
cli/session-root.json. FinallystopsownPID/socket;poll6427,neverduplicate/stopall.
Profile8eda3570...f18c11300168B. New84selectedtestsPASS beforeCLI; call/finally
source regions exactsame as priorreviewed exporter. No rawparser/networksymbols.

ACTIVE21:47UTC: final control-after driver24523,log control-after-driver.log.
Preflight38672terminal0 21:47:21.377Z busy[]12.37GBavailable101.22GBdisk.
Both earlierarms/replays terminalPASS. No CLI daemon; version0.10.0/guide
read for upcoming savedprofile analysis onlyafter finalbrowsercleanup.

SUPERSEDING21:47UTC: profiled26805/export1058terminal0; replayPASS rootmaRPEZ,
12recordedPIDsabsent. CPUrate0.73434,gaps>50ms3/1/0/0,phase1videodrops4.
Gzip11300168B saved in compositor-controls/profiled/run/profile.json.gz; no
CLI load yet. This capture includes drops; cannot attribute them toprofiler
without finalcontrol/analysis. Nextcontrol-after settledpreflight, thenonce.

ACTIVE21:45UTC: profiled driver exec26805, profileddriver log in newcompositor-controls.
Preflight61991terminal0 at21:45:13.316Z busy[]12.10GBavailable101.85GBdisk.
Control-before replay alreadyPASS. Poll26805; no new browser until it terminates
and existing exporter confirms recordedPIDsabsent. Controlsafter stillnotstarted.

SUPERSEDING21:45UTC: control-before60673 and export46578 terminal0. ReplayPASS,
rootYzDhvR;12recordedPIDsabsent,cleanSIGTERM0drops,14samplescapsPASS.
CPUrate0.57579; gaps>50ms3/0/0/0;videodropsall0. No profiler artifacts.
admitted-control-before.json authoritative. Nextfreshpreflight thenprofiled.

ACTIVE21:43UTC: first control-before driver exec60673 (240sSSH/220sdriver),
log compositor-controls/control-before-driver.log. Poll SAME handle; do not
duplicate launch. Settled preflight21:43:16.809Z busy[]12.06GBavailable102.46GBdisk.
No other live command. 81tests/format/planlintPASS; source+remote guardsPASS.

New UNSEALED namespace artifacts/umbralink-control/compositor-controls/.
Prior compressed namespace/seal stays immutable. New offline analysis.mjs,
analyze.mjs and test/analysis-spec.mjs prepared;81 selected strict testsPASS.
source-initial verifies38inspected/60buildpins/135oldharness and unchanged
HEAD/index/working/configuration. source-audit clone differs only outputroot.
Remote142guard completedPASS in remote-initial.log. No runtime launched yet.
Next fixedsequence control-before/profiled/control-after, reuse existing
compositor-compressed driver/export on h9KsaO. Fresh15ssettled preflight perarm,
same220sdriver/240sSSH and120scapture;no retries/no default/product edits.
analyze.mjs NAME unpack verifies prefix+unpacks only newarm exclusively, writes
admitted-NAME.json; pure compare is descriptive, notperformanceacceptance.
Do not rerun into existing artifacts. None of the old ACTIVE handles below lives.

## October 6 Compressed Profile Analysis Complete

SEALED: artifacts/umbralink-control/compositor-compressed-final.sha256 covers704
files82071073B, SHA cda870a0c1a295f820b000aafd985f699e5e62630fe7862f6a9f224e916fd3e8.
Quietsha256checkPASS. Do noteditsealednamespace/report/142runtimeinputs; next
capture/observerwave getsnewnamespace and reusesfrozenruntimeonly.

SUPERSEDES all ACTIVE handles below. Pilot49262/export61260/CLI15391 terminal0.
Second saved-profile CLI export57941 terminal0; own daemon2530184/socket absent,
stop21:23:33.278UTC. Earlier daemon2524148/socket absent,stop21:16:56.210UTC.
No browser/CLI/test/lint/transfer remains alive. Remote final guard97533 terminal0
verified142 frozen hashes at21:28:07.371UTC; private directory identity unchanged.

New report bot-docs/reports/performance/2026-10-06-compositor-compressed.md.
Authoritative analysis artifacts/umbralink-control/compositor-compressed/
profile-analysis.json pins both CLI export sets and original gzip20fc631f...9826.
Second exports in cli-coverage/,same37threads/eightclockanchors. No rawparser.
Actual sample brackets pass5threads:parent126before/17after,content40/17;
all20phasepopulations2398-2401samples. Coverage observedhistory,NOTlosslessmarkers.
Callback1192=298perphase;max2.235ms;Composite2094,max4.354ms;canvasrunnable
1195,max8.781ms. All791SkippedComposite idle-reason(788inphases/3outside),
0dropmarkers/nativeafterdrops/pagevideodrops; no146msstallreproduced.
Strict nestedpairing remains unavailable. Parent nonidle samples296/358/17/13,
ordinary remote-settings/security/codec/component network activity observed.
Network export clocks NOTjoined; noquiet-profile/noYouTubecause claim.

119strictselectedtestsPASS afterfinalformat(0.721s); source-final38inspected/60buildpins/
135oldharness+HEAD/index/patches/configPASS. Newpureanalysisvalidatesrawzoomplus
normalizedclock,counts,identity,unfilteredidleincludedcategories,crossingintervals.
Runtime142manifest unchanged; onlyofflinefiles/report/plan/context touched.
Eightnew/offlinefilesexplicitPrettierPASS;report/planlint0;gitdiffcheck0.
ExactcloneCLI/driver/exportfiles retainmechanicalformat,notblanketlintclaims.
Next: bounded unchanged unprofiled-before/profiled/unprofiled-after3arm sequence
afterfreshsource/package/hostadmission. Read plan before launch; noautomaticretry.
No product/default/install/Pi/desktopdaily changes ornewperformancewin.
Keep goalACTIVE. First andsecondfailedpilots/countercorrection preserved.

## October 6 Compressed Profile Preparation

SUPERSEDING21:16UTC:pilot49262terminal0, export61260terminal0. RootH5vjfG,
browser1678449/controller1678437/content1678616; all12recordedPIDsabsent.
Nativegzip11278862B SHA20fc631f94e8a4a99934470b9955232920bbac8f0f9bd44d25d59c27a1fd9826;
52files11637471B independentlyrehash/unpackedatcompositor-compressed/pilot.
replay-final joins exactbaseline sample3,15resourcescapsPASS (peak151454498B),
nativepaths/build,workload,marks,stop,cleanSIGTERM0dropsPASS. Earlierreplay used
nonexistentatMs; relativecapsrecomputed correctly andtestrejectsgrowthbelow
absolutecap. Rawexport/runtimeuntouched. No newperformanceacceptance.
ACTIVEcli-export exec15391 (195souter,180stotalwith15sreserve):sessioncomposition-r3
in fresh /tmp/codex/composition-r3-SUFFIX; exactpath in compositor-compressed/cli/
session-root.json. Offline127.0.0.1:9; scriptfinally stopsownsession andchecksPID/
socketabsence. Poll exacthandle; neverreload/stopall. No browseralive.

ACTIVE21:12UTC: ONE compressedpilot exec49262 (240sSSH/220sdriver/120scapture),
log compositor-compressed/pilot-driver.log. Poll exacthandle, noduplicatelaunch.
Preflight21:11:49UTC busy[]12.38GBavailable103.09GBdisk;142remotehashesverified.

PREPARED21:11UTC:109selected strict Node testsPASS, explicitnewfileformatPASS,
planlint0; source-initial38files(35unchangedHEAD)+60pins/135oldharnessPASS.
New frozen142-input manifeste3f3b6e68b320ec099c20e6d21dd9185e202d7d74030b5d645e18fbc13a3a5d4.
Runtime4files capture/gzip/driver/export transferredadd-only toexistingh9KsaO
laptopharness; remoteverifyPASS. No package/source/index/default changes.
Pilot freshpreflight pending exec22563 (15ssettle thenhostcheck), notlaunchedyet.
New testRED missingmodule andsyntax/extractionsetupfailures are harness errors,
notproductionbehavioralRED. Prioractualrawcapfailure is motivatingincident.

Supersedes ACTIVE62986 below: revised pilot terminalexit1,48splayback+8marks
completed,then Profile preservation cap. Raw owned dump69577342bytes; contents
notread/exported. profileStoppedtrue,cleanSIGTERM,0drops,all12recordedPIDsabsent.
pilot2-replay.json anddump-size.json retain exactreceipts. remote-postverify
138hashesPASS/source-final36source/60pins/135oldharnessPASS. No live owned runtime.
Current diagnostic revision compositor-compressed will reuse frozen
captureComposition with exactdump-method adapter andnativegzip,24MiBencodedcap.
See compositor-attribution plan compressed addendum. No browser product edits,
build/install/default changes. Native gzip object has profile:ArrayBuffer; bound
deadline from parent aftersnapshot ChromeUtils.now, no rawprofileparser.
Latest owner progress report delivered; no newinstalledfixclaimed. Goalactive.

## October 6 Buffer Interpretation Correction

ACTIVE20:56:42UTC: ONE revised integration pilot exec62986, same bounded
240sSSH/220sdriver/120s capture. Poll exact handle, never duplicate launch.
Log artifacts/umbralink-control/compositor-buffer-correction/pilot-driver.log.
New frozen138-file manifest0b02f737b00a6c4667266defc6e4b9bb70c7c9bc97982c9a39320faf4df6a6d1,
three add-only runtime files capture/driver/export on existingh9KsaO laptop
harness. New root namespace laptop-composition-r2-pilot-20261006-SUFFIX.
Old135 frozen files unchanged; source36/60pins/135harness/patches/configPASS.
93 selected strict testsPASS, explicit scratchformatPASS, planlint0. Fresh
settled laptop preflight20:56:31.640Z busy[],12.14GBavailable/103.76GBdisk;
all138remote hashes verified20:56:13.994Z. No other owned live commands/agents.

Important correction: original pilot FAILED diagnostic validator, but generation
0->2 is NOT proof buffer data was overwritten. Exact source ProfileBuffer.cpp
divides BufferLength BY8 for mEntryCount; ProfileChunkedBuffer increments
mRangeEnd IN BYTES; nsProfiler::GetBufferInfo divides that byte position by
entry count. Old guard had units mismatch; native byte-position advance was
33566276 against134217728 maximum capacity. Neither counter can prove actual
retention or per-process chunk eviction. Original state/error/evidence preserved.
New classifier checks unsigned/schema/safe integer/monotonic byte position,
records retention unproven. Successful capture explicitly pending-cli-retention-
check. No buffer, feature, interval, workload, cap or budget increase. One-byte
boundary and savedpilot RED11pass2fail; correctedregressions93PASS. ASTproof
all other capture behavior unchanged; driver/export differ only outputnamespace.
Do not treat pending coverage as acceptance or auto-start three-arm sequence.

Full profiler-cli guide0.10.0, schemas and resource-usage case study reread.
CLI conversion drops native contentEarliestTime; rootRange and retrospective
phase marks are NOT retained-history proof. Next after terminalcleanup/export:
supported CLI only, ownedoffline session+finallystop, inspect actualthreads/
sample or non-retrospective marker brackets. No rawprofileparser or fabricated
negative-event conclusion. No profiler daemon/load started yet. All desktopdaily/
Pi/default/build/index/oldseals untouched. New namespace unsealed; report pending.

## October 6 Compositor Pilot Checkpoint

Latest owner request: progress report distinguishing implemented fixes, measured
benefits and remaining stutter. Daily desktop installation/browser untouched.
Goal remains active; do not mark complete or blocked. All commands from this
phase are terminal, including pilot exec2208 exit1 and export31829 exit0.

New UNSEALED namespace artifacts/umbralink-control/compositor-attribution/;
plan bot-docs/plans/compositor-attribution.md. The source report
2026-10-06-compositor-source.md is an earlier source-only checkpoint, not the
current runtime result. New preparation has70 selected strict Node tests PASS
(25 new plus45 prior), explicit scratch Prettier PASS, docs lint0. This is not
the full prior92-test gate or a Gecko rebuild. Source-final.json verifies33
inspected files (30 unchanged plus3 explicitly pinned modified sources),60
build-source pins,131 prior harness inputs and unchanged git/config state.

Four new runtime files capture.mjs/driver.mjs/markers.mjs/export.mjs are frozen
in harness.json:135 inputs, SHA256
879b39ee881e539db114a98b2526cd91af2f0d3f36fc2cf3ba34f1cfc57daae3.
They were transferred add-only to the existing laptop harness
/home/wyatt/.cache/codex/descriptor-availability-harness-20261006-h9KsaO.
Remote135-file verification and settled host preflight passed. Do not rerun
exclusive prepare.mjs or remote-admission admit; do not silently edit frozen
runtime inputs. No profiler-cli daemon/load was started; last version/guide
read output was truncated by context and must be reacquired before analysis.

ONE integration pilot ran on Build20261006175655, GPU import explicitly ON,
unchanged48s1/4/4/1 video-to-canvas workload. Root:
/home/wyatt/.cache/codex/laptop-composition-pilot-20261006-KuRmno.
It FAILED after playback: Parent profiler buffer wrapped, generation0->2 at
unchanged16777216-entry capacity/5ms interval. Start configuration requested
js,stackwalk,processcpu,nomarkerstacks; GeckoMain/Compositor/Renderer/Media/Video/
IPC I/O threads. No marks or profile dump followed the rejection. This is a
diagnostic coverage failure, not accepted performance or causal evidence.
Preserve it; no result-based retry or relaxed coverage criterion.

Saved run starts20:43:30.359Z and finishes20:44:31.028Z; driver finishes
20:44:31.402Z. Profile-stop receipt active=false, run.profileStopped=true,
clean owned SIGTERM,271 log bytes/0dropped, rootAbsent=true. Package postcheck
passes46 immutable files plus empty lock. Read-only export verified12 recorded
controller/browser/helper PIDs absent. pilot-export.json retains43 public files,
339426 decoded bytes, all base64 lengths/SHA256 independently recomputed locally.
No profile exists or was exported. No personal profile/app-data/token exported.
PID roots1665812(controller)/1665825(browser). No owned runtime remains.

Next: source-guided review of coverage/configuration and saved buffer receipts,
then a separately frozen bounded diagnostic revision if justified. The planned
control-before/profiled/control-after sequence has NOT started; integration
pilot and actual thread/clock/coverage admission must pass first. No raw profile
parser, no default change, no new build, no desktop or Pi action. Previous
descriptor availability/balanced seals are immutable and remain separate.

## October 6 Descriptor Balanced Preparation

SEALED20:05UTC: artifacts/umbralink-control/descriptor-balanced-final.sha256
covers390files27506909bytes; SHA256
0bb31ede682b31382c8d4ef59248382e42ce249eabcb67b3d801d5291602b949.
Quiet sha256checkPASS, finaldocs0problems, explicitnewtests/helperformatPASS.
Do not modify this namespace/report or131frozenruntimeinputs; new work needs a
new namespace. No active owned sessions/agents/runtime. Phase made concrete
progress: currentbuildCPU26-29%lower but mixedsmoothness27pass/2fail, compositor
drop evidence localized below. BroadgoalACTIVE, NOT complete/blocked. Next
source-only producer/consumer trace of compositor counters and marker coverage,
then separately reviewed bounded diagnostic; no currentruntimepending.

SUPERSEDING20:03UTC: ALL FOUR CAPTURES AND EXPORTS TERMINAL/PASS; no live owned
runtime/exec. OFF2 exec69416 and export1777 both0, as are earlier handles.
Canonical comparison.json FAILS:27pass/2fail criteria; ON1phase0 gaps4>maxOFF3;
ON2phase1 videoDrops4>maxOFF0. CPU rates ON26.43/28.88% lower thanbetterOFF;
four-copy P95ON2ms/OFF27-30ms. Do NOT promote default or claim stutterfixed.
92final testsPASS, all176publicfiles1372267B rehashed,56resourcescapsPASS,
12PIDsabsent/arm, cleanSIGTERM271Blog0drops, 60source/131harness+git/configguard
PASS; priorcorrectnesssealunchanged. Roots OFF3i4iUk/ON A1QJQu/ON DcEqXF/OFFa0yptM.
NativeafterON2 has compositor4/container4, decoder0/sink0; otherarmsall0.
146ms ON2phase1 gap at7442ms with preceding/currentdraw1/2ms, notcausalproof.
Report bot-docs/reports/performance/2026-10-06-descriptor-balanced.md. summary.json
contains exactCPU/callbackrecords. Next source-guided compositor-drop producer
and marker trace then separate controlled diagnostic, no blindretry/warmup/gate
relaxation. Latestcandidate is packaged only; desktopdaily/Pi untouched.
Finaldoc/format checks and evidence seal are now complete, as recorded above.

SUPERSEDING19:54UTC: OFF1 exec93003 and ON1 exec69208 TERMINAL0, both exports,
unpack and complete-prefix admission PASS. OFF1 root3i4iUk44files344099B,
ON1A1QJQu44files341815B,14resources each, cleanSIGTERM0drops and12PIDsabsent
each. OFF ends software; ON bothboundaries accelerated. First-phase callback
gaps OFF3/ON4, preserve possible jitter regression; all videodrops0.
ON2 fresh settle/preflight is now pending; no second ON browser yet.
Comparison remains explicitly incomplete; onlyfinalfour mayevaluate29criteria.
Replay test was run early and correctly failed missing comparison.json; this
is incomplete-input evidence, not product RED. No predicates changed.

SUPERSEDING19:50UTC: preparation/transfer complete. Correctness seal rechecked,
60 source pins and HEAD/index/working/config unchanged. New131-input manifest
54e4780218bb39663fe4a64b607670be758c54bc625166b62b6398d6890f9c6c;
add-only30-file overlay d5e9bab25941c42f8e0a9e7ddbbfa37e29b64e50366fb3f05b31df476c674158,
215040bytes/31entries. Remote old101 unchanged, root identity/mode verified.
Final preparation88PASS, docs lint0. OFF1 preflight19:49:34UTC passed with no
browser/build activity and12.27GBavailable/106.79GBdisk. FIRST CAPTURE ACTIVE
exec93003 (240sSSH/220sdriver), log descriptor-balanced/driver-off-1.log.
Poll that exact handle; do not repeat launch. All earlier preparation sessions
terminal. No other browser/agent/build initiated. Capture still needs terminal
cleanup/export/prefix validation before ON1. Latest details supersede below.

Active plan: bot-docs/plans/descriptor-balanced-performance.md. New unsealed
namespace: artifacts/umbralink-control/descriptor-balanced/. No captures,
transfers, browser launches or remote changes in this phase yet. Latest owner
asks for progress and the performance issues found/fixed; report candidate
versus installed state and keep the YouTube cause unproven.

Eight identity/namespace-only wrappers are prepared against Build20261006175655
and package manifest a7d80698828618f3d0c3e9f760e6fe8b63a72f3f93ba8dabcb132581c8784e87.
Static relative-import audit found sustained-import-analysis.mjs missing from
the merged old95/current101 runtime manifests. Include it with21 old callback
files and8 new wrappers: expected final131 inputs, not130. Updated preflight,
confirmation and equivalence test expectations; inventory-red.log preserves
the intermediate expected failures. The new manifest/archive are NOT generated.

Identity, receipt-corruption, numeric and unchanged callback/balanced/sustained
regressions now88PASS, preparation-tests.log (0.405s). Numeric comparison uses
identity-adapted HISTORICAL supplied data only; no current performance claim.
Three local tests: test/identity-spec.mjs, confirmation-spec.mjs, numeric-spec.mjs.
Mechanical wrapper equivalence remains exact. Next: source/seal guards, freeze
the131-input manifest plus add-only overlay, then host-local laptop preflight
and prospective OFF1/ON1/ON2/OFF2, validating each complete prefix. Previous
correctness seal must remain untouched. All commands terminal; no owned runtime.

## October 6 Descriptor Availability Correction

SUPERSEDING19:30UTC: browser loss OFF/ON and pixels OFF/ON ALL PASS, owned execs
terminal and recorded PIDs absent. OFF/on loss each8/8match preservedreference4;
two oldON InvalidStateError mismatches nowmatch. PixelOFF48/48match fullsize
reference import-recovery-pixels/off-1; ON48/48matchOFF,4rawRGBAeach exact,
repeatsstable. Final combined replay/regressions74PASS after test formatting;
final-browser-tests-formatted.log3.33s, final-doc-lint0problems, explicit3testfile
PrettiercheckPASS. Finalsourceguard60source/101harness+HEAD/index/working/config
unchanged. Allowned commands terminal. Finalcorrectnessseal path:
artifacts/umbralink-control/descriptor-availability-final.sha256.
Seal420files987127202bytes; manifestSHA
4dfab7e81233938670202b164a6078f6b629772294536fe1c31c4a34b549d431.
Use NEW namespace for nextperformance work; mutable plan/DETAILS excluded.
Report bot-docs/reports/performance/2026-10-06-descriptor-availability.md.

Evidence namespace unchanged. Loss roots suffixoMNNgl(off1630275/1630307) and
1LKKfp(on1634004/1634036);48/47files2590566/2588874B,13/12PIDsabsent.
PixelrootsuHEAvj(off1636900/1636912),sRSa8w(on1639216/1639228);38fileseach,
1387116/1387087B,12PIDsabsent each. Native/oldreference/newbrowser files rehashed.
Loss means permanent RDD shutdown, NOT crash/restart. GPUdefaultOFF unchanged.
New97file loss overlaymanifest36f33da23b9538879cab269eb07880fa518c075435cba195d732bbc6912c04d2;
new101file pixelmanifest a17c986ee08735154f0b1085eac909bee78ec20f8b33ce7f284b4601460cd3a8.
Both applied add-only and verified at existingh9KsaO root; prior91filesunchanged.
Runtime admission clarified HOST-LOCAL inplan: unrelated desktopCargo test is
not laptopworkload; strict laptopbrowser/build/resources stillpassed perarm.
Desktopbuildpreflight refusals retained, unrelatedjobsuntouched.

NEXT: fresh prospective balanced-performance sequence on Build20261006175655,
new namespace and exact newpackagepins. Reuse existing callback-import collector
and balanced-import-analysis evaluator, not oldR2 results. Prior driver is
artifacts/umbralink-control/laptop-callback-import.mjs; fixed95input harness and
verification commands described in balanced-import-r2/verification.md. Its
oldinput/admission/analyzer pins must be adapted/tested, not bypassed. The current
fullsizecache changes OFFbaseline too. No latestperformance orYouTubeclaim yet.
No active browser/build/SSH/test needed for these completed captures; noagents.

LATEST VERIFIED CHECKPOINT: the build, package, native test build, laptop run
and evidence transfers are ALL TERMINAL. This supersedes all active-session
notes below. BuildID20261006175655 is packaged, not installed as the daily browser.
Native40/40 PASS, zero failures/errors/disabled/skips: downloaded launch.json,
receipt.json, results.json and gtest.log hashes independently match
native-remote-verification.json. summarizeResults verifies exact test inventory;
receipt/package manifest/build IDs/clean exit and cleanup agree. Five recorded
controller/browser/helper/IPC PIDs were absent in the saved remote verification.
Log retains Sandbox unshare(CLONE_NEWPID) EPERM; not a warning-free runtime claim.

Native package manifest53fd20a8aefd2c5d08adfed332a33a3fc368e77b1130698d717d817eb6436df6
pins48files, including stripped gtest libxul358540368bytes SHA
0af5f78e8901f22397bfc0cc118d886786c94a37ff5f96d554d0892cc3cf78ae.
Original object library untouched. Initial packaging refusal of a generated
dependency-list symlink is preserved; corrected packager verifies its exact
regular-file target and ships regular files only, with12pure checks passing.
Native run root on laptop:
/home/wyatt/.cache/codex/descriptor-availability-green-4a156307-ad87-45bb-8774-2aca292144a5
Native installation:
/home/wyatt/.cache/codex/descriptor-availability-gtest-harness-20261006-DFLHYc/umbrafox
Ordinary new candidate already verified46files at:
/home/wyatt/.cache/codex/descriptor-availability-harness-20261006-h9KsaO/candidate/umbrafox
Local native evidence: artifacts/umbralink-control/descriptor-availability/native/.
First brace-expression SCP failure preserved; explicit four-path retry succeeded.
No SCP process remains. Next: new candidate retained-loss OFF/ON comparison,
48-case pixel parity, then fresh performance measurements. Old wrappers pin
the previous candidate: adapt and verify identities before any new browser run.
GPU default remains OFF; desktop daily browser/profile/launcher untouched.

Supersedes the retained-loss checkpoint below. Plan:
bot-docs/plans/descriptor-availability.md. New evidence namespace:
artifacts/umbralink-control/descriptor-availability/. Native correction consults
the retained GPUVideoImage's original manager before experimental GTK DMABuf
descriptor admission. Unavailable images use the existing full-source fallback
and early InvalidStateError path. Generic GetDesc, other platforms/types, drawing
and security ordering, public interfaces and default-OFF preference unchanged.
The local synchronous manager dispatch has unmeasured cost and no timeout; this
does not prove future resource/replay success or all recovery/error parity.

Behavioral RED reproduced dead-manager admission, focused actual-source-region
tests now31PASS across4platforms. Two native gtests added but NOT yet executed.
Independent source review closed without a blocker; final include-sort-only
delta has exact reverse-equivalence proof. Exact5file lint0errors0warnings,
phase/package harness tests8PASS. Sixty source inputs pinned in source.json,
BuildID20261006175655; preparation is exclusive and must not be rerun. Native
inputs, HEAD, staged patch and unrelated tracked changes are guarded.

LATEST18:29UTC: full build session67324 is TERMINAL exit124 (1800s watchdog),
not a demonstrated compiler failure. Preserved build.log advances to29:03 widget;
six warning summaries lack full text. Do not claim a successful native build.
The two-job idle build began about17:59UTC. Resume preflight18:29:21 verified
all60 source pins and sufficient resources but refused cargo2350423. Narrow
inspection found its cwd /home/wyatt/Projects/aeordb-workspace/aeordb, parent2350422,
elapsed82s, distinct unrelated build. Do NOT signal it. Its presence at the final
preflight does not explain the entire Umbrafox build duration. Preserve
preflight-build-resume.json/log; use NEW filenames for next preflight and build
continuation. No current exec/test/browser/SSH session owned by this phase;
all review agents closed. Goal remains active, waiting for no-compiler admission.

SUPERSEDING18:48UTC: exact unrelated cargo2350423/test2350478 both absent.
Fresh preflight-build-resume-3.json PASS, busy[], available44.53GB/disk69.16GB,
all60sourcepins unchanged. Incremental build NOW ACTIVE exec77037, same
MOZ_BUILD_DATE20261006175655/jobs2/idle, new timeout600 and build-resume.log.
No clean/reconfigure/input change. Poll77037 before further native work; first
67324 is terminal124 and must not be polled/restarted. All other execs terminal.

SUPERSEDING18:57UTC: resume77037 TERMINAL exit0, build-resume.log says successful
in478s/7:58.72, zero warnings in this resumed invocation. First attempt's warning
summaries/watchdog remain preserved. Fresh preflight-package.json PASS/busy[],
all60pins unchanged. PACKAGE NOW ACTIVE exec62760: same BuildID/jobs2/idle,
XZ_OPT=-T2, timeout600, ./mach build -j2 package. Log package.log. Do not start
gtest/native/browser execution until62760 terminal and package/export accepted.
Standalone preflight-gtest.mjs prepared (not in91file bundle, not transferred),
strict green-only/newBuildID48files/91harness checks; mechanical resource-guard
equivalence added. Final native-preparation-tests.log11PASS, pure only.

SUPERSEDING19:01UTC: package62760 TERMINAL0 in106s, export76819 TERMINAL0.
New export exports/umbrafox-descriptor-availability-20261006/ accepted46files,
57entries475127101uncompressedbytes. Archive107771688bytes SHA
50c50495738d183ab0fe449b665a17ad530fea855a7baa51f4399de4108f9a39;
manifesta7d80698828618f3d0c3e9f760e6fe8b63a72f3f93ba8dabcb132581c8784e87.
Native ELF and both INIs20261006175655; frontend inventories2676/5368 unchanged,
only AppConstants BuildID differs from prior package. No daily installation.
Fresh preflight-gtest-build.json PASS/busy[]/all60pins. NATIVE GTEST BUILD NOW
ACTIVE exec92899, same BuildID/jobs2/idle, timeout1800, ./mach build -j2
recurse_gtest, log gtest-build.log. Poll92899 before any native/browser runtime.
Normal build77037/package62760/export76819 all terminal, no other active exec.
Next strip a COPY/output of the newly built dist/bin/gtest/libxul.so, never the
object library; package_buildid.py already has CLI accepting PATH EXPECTED_ID.
Then package-gtest.mjs requires gtest-buildid.log plus libxul-gtest.so and writes
new48filemanifest. Native40case run still pending, no runtime parity/perf claim.

Continuation18:44UTC: second fresh preflight also refused2350423. Targeted
process inspection corrects its classification: cargo test, child2350478
aeordb-159fada1, original parent timeout2350422 with1800s duration. At18:44:48
both remain live, approximately1000s elapsed; do NOT infer completion from that
timeout configuration or signal these unrelated processes. No Umbrafox rebuild
has been started. No-overlap gate remains unchanged.

Useful offline work completed while waiting: prepare-harness.mjs mechanically
reuses prior source/Git/archive guards, retains87 unchanged shared files and
adds4 native-test scripts. It deliberately includes NO browser package and
claims no package/native acceptance. New transformation/static-relative-import
checks plus prior phase/parser tests10PASS, prepared-harness-tests.log. Actual
bundle91files92entries23644160bytes, SHA8b0be02549113339bb414e956aa66a008a9e87fc0a8d42b8eb81de0311675ec9;
manifestSHAe02ad5d1037ea87d3ee943ca342d70f853ac2d09aba20de0ff0f017133c25fc7.
Local hashes/Git/source guards and archive inventory passed. Transfer/extraction
to wyatt-laptop private descriptor-availability-harness-20261006-h9KsaO passed
all91file hashes; rootuid1000/dev64512/ino37101013/mode0700 preserved. Current
remote root contains harness files/archive ONLY, no candidate/reference package.
remote-harness-{root,receipt,extraction}.json preserve successive evidence.
All transfer/SSH execs terminal; no remote browser/native process launched.

Package/export and native-test scripts prepared but NOT executed. Intended
export exports/umbrafox-descriptor-availability-20261006/. Native test remote
preparer now requires pinned harness AND candidate manifest hashes; all8 pure
phase/package tests pass again in package-tests-resume.log. These are NOT actual
native gtests. Continue incremental build with same BuildID/source pins once
preflight passes, two idle jobs and a fresh bounded log; no clean/reconfigure.
After build: fresh preflight, package/export exact BuildID, real native40-case
gate, then new retained-loss OFF/ON and48pixel comparisons, then performance.
Do not reuse sealed evidence or install this diagnostic build as daily browser.
Desktop profile/browser/launcher untouched; isolated laptop tests authorized.

## October 6 Retained Frame Loss Gate

LATEST17:49UTC: reference4/OFF/ON all collection+cleanup complete, NO live exec
sessions or workers. Reference4 rootGBD5Zf browser1598715/RDD1598847; OFF1rLfnZ
browser1601405/RDD1601539; ONu9ZGKy browser1603669/RDD1603802. Each48files,
13recordedPIDsabsent,0drops,cleanSIGTERM. Strict single-thread-zombie gate passed
poll2 in55-57ms; absence/reaped explicitlyfalse at that observation. Firstcold
softwareprobeInvalidStateError in all3; copiedbitmap retained exactpixels.
OFFmatches8/8 reference4. ONFAILS2/8: warm-default-after+cold-default-after
return noexception while reference/off raiseInvalidStateError; allleave same
RGBA17/34/51/255sentinel. Rest6match. Collectionstatuspass is NOT paritypass.
ONlog VideoBridgeParentmissing+canvas replayevent23, sourcecauseUNPROVEN.
GPUdefault remainsOFF; no source/build/install/desktop/Pi edits thisphase.
Report bot-docs/reports/performance/2026-10-06-retained-frame-loss.md.
Evidence final-evidence-verification.json rehashes144files7771102B; sourceguard
59pins+87harnesspins+HEAD/index/trackeddiffs/config unchanged. v7 installed,
allreviewagentsclosed; old17:38activehandles below are superseded. Next narrow
source/failing-first fix for ON retainedVideoFrame exception semantics, NEW
namespace; preserve oldfailedreferences and this evidence. Latestcandidate
performance is stillUNMEASURED, older35.48percentgain not transferrable.

Active plan bot-docs/plans/retained-frame-loss.md, new unsealed evidence namespace
artifacts/umbralink-control/retained-frame-loss/. No production edits this phase.
Prior exact-fallback243file seal unchanged; desktop daily browser protected,
laptop isolated runtime authorized. No Pi/build/commit/stage/push/default changes.

Reference Build20261006070020 full-size readback uncached; candidate20261006153147
exact cache/import package unchanged. New harness keeps VideoFrames at0.5s/2s
across disposable UmbraLink sandboxes using page-realm window.Object, uses
completed seek+rVFC presentation and an ImageData-copied bitmap control. Exact
parent nsIRddProcessTest.stopProcess is permanent shutdown, NOT restart. Preserves
draw/readback failure distinctions and raw pixels before validation. Independent
source/driver/follow-up review agents are all closed; reports in namespace.

Active remote harness /home/wyatt/.cache/codex/retained-frame-loss-harness-20261006-aIMUBA
on wyatt-laptop. Latest installed harness-v4 SHA
b4a35caf867432814ab93f8f2d3d0cc0198dc15df04741825cc44e06988d455c,
85files86entries. Original v1 dZ3v2L never launched. Do not rerun exclusive
prepare/extract scripts; next version must use new names. Packages remain fixed.

First reference root laptop-retained-frame-loss-reference-20261006-n00xh1:
ownership gate refused actual RDD parent=forkServer before stop. Correction
validates native forkServer type, original root/fork/leaf PID+parent+group+session+
start, not arbitrary ancestry. Parent reviewed and21 tests passed before retry.
Second reference root laptop-retained-frame-loss-reference-20261006-GOYXpM:
controller1583863/browser1583877/fork1583970/RDD1584009. Stop receipt accepted
native root PID/type0/Build20261006070020, but no PID absence in20x50ms poll gate.
Failed16:52:19.083..16:52:32.218UTC before any post-loss draw. CleanSIGTERM,
346Blog0drops, all12 recorded PIDs absent post-cleanup; package postcheckPASS.
Saved reference/ and reference-2/ plus exports immutable. No poll states were
saved then; no live-versus-zombie inference. VideoBridge AbnormalShutdown follows
intentional hook and does not prove a spontaneous crash.

Current local diagnostic delta: loss.mjs saves loss-poll-N.json for each completed
read before identity validation; elapsed monotonic time+state+absence. Same strict
absence gate/20polls/50ms waits. Zombie!=absence. Failed reads retain prior polls
and abort; no synthesized absence. Source SIGTERM/CloseProcessHandle no-op plus
SetAlreadyDead/destructor suggests inspecting reaping, not established cause.
RED11PASS4FAIL -> GREEN25 -> final28PASS2.15s, strict timeout30; formattingPASS.
loss.mjs SHA9414b15dcd16fe80cf15150814980c103d75b966afdeadf97c64f278ef2d8980;
test/loss-spec4d33f9f46c840ec39313239356c422e77c4857b3203b45440a26ecabd53fe123;
test/page-spec7de55b849ed4cd345ff06ce00212a25a2f15854216f65aff07bbcd7450f997f1.
Logs poll-evidence-{red,green,final-tests,format}.log. New delta not transferred
or browser-tested; no candidate arms launched. Next review/pin v5 then reference
only to record state; do not extend timeout or count zombie as success silently.
All tests/native/SSH processes from this phase terminal at this checkpoint.

SUPERSEDING17:38UTC continuation: v5 diagnostic run reference-3 rootSmAF5t,
controller1589032/browser1589044/RDD1589176/fork1589138. Failed17:04:45.085..
17:04:58.247 on originalabsencegate; ALL20 polls exactidentityZ,0.383..1001.724ms.
No task data, so leaderZ alone is not whole-process death proof.53files1020661B,
12PIDsabsent,cleanSIGTERM346Blog0drops. reference-3/ and exports preserved.
Kernelproc/task/wait docs and independent terminal-review.md support explicit
terminal-vs-reaping correction: absence OR exact before/after leaderZ +status
Pid=Tgid=ownedPID/PPid/UID/Threads1 +taskentries exactly[PID]. KeepcoldCPUfailure,
exactpixels/errors andfinalALLPIDabsence. Originalfailedrunsremainfailed.

New scratch terminal.mjs/loss-terminal.json v2 carries explicitbasis/absentfalse/
reapedfalse+rawjoins. captureinjects terminalreader; no sharedidentity/nativecode
change. Initial35testsPASS. Exactcode reviewer found P1coldsummary-onlycomparator,
P1incompletefailurePIDunion, P2lostpartialtimeoutdata. terminal-code-review.md
retained. Corrected evidence.mjs now validates consecutive0..9 rawcoldprobes,
envelope/frame/hash/error; comparatoralsojoinsother7drawingenvelopes. Exporter
collectsownership/poll/task/nativeprocesstree/partialrunreport IDs, cap1024.
Replayed3oldexportscoverexpandedPIDunion, no historicalcleanupgapdemonstrated.
Observerpublishes boundedprefixes/clipflags; localabort/latch on1stimeout prevents
latereportmutation/newreads; report.decoderTerminalObservation survivesworkabort
viaexistingcleanupwriter. No hardOScancellationclaim. P1RED3FAIL thenPASS;
P2source-triggered regression coverage(no failing-firstRED claimed). Final42PASS
3.60s, terminal-corrected-final-tests.log. Formatter earlierignoredartifacts;
corrected --ignore-path /dev/null actual10filewrite/check logs nowverified.

v6 transferred+preflightreference4PASS but NEVERLAUNCHED afterreviewfindings.
v7 prepared87files88entries SHA9ea9cafaf23cb7117dbc8c02d05169acb3c76a1bded7b6def199199a8f3b2bad;
includesnewterminal/evidence modules. Source/package/HEAD/indexguardsPASS.
v7 transferdone; overlaySSH23329 was live at17:38checkpoint, pollhandlebefore
anynextcommand. Exactcorrection reviewer Averroes01a11249-6087-7f32-823c-e57228766147
active<=4min(about17:39deadline); owns terminal-fix-review.md only, control
terminal-fix-control.txt. EarlierHubble/Helmholtzagentsclosed. Waitreviewverdict,
closeagent, verifyoverlay, settle15s, freshpreflight-v7(reference-4-v7 outputnew),
thenparentreference4ONLY. No candidatearm yet; no default/install/Pi changes.

## October 6 Exact Canvas Fallback Source Gate

Active plan: bot-docs/plans/exact-canvas-fallback.md. Evidence namespace:
artifacts/umbralink-control/exact-canvas-fallback/. The preceding availability
phase remains sealed; broad performance goal active, no release claim.

Only new production delta is CanvasRenderingContext2D.cpp: removed the active
destination-sized HTML-video shortcut and deferred readback flag/helper, restored
full-source acquisition and early missing-image check before DoSecurityCheck,
and restored baseline rectangle/rotation/vector placement. Exact full-size cache
and direct descriptor import remain. GTK VideoFrame block and descriptor helper
are byte-unchanged from the phase baseline; drawing tail equals frozen HEAD
reference. Sized native helpers and seven failing prescale tests are untouched.
Default GPU import stays OFF. No public interface/default change.

Focused source RED6PASS1FAIL then GREEN7PASS; geometry RED6PASS1FAIL then
GREEN7PASS. Final readback tooling31PASS, exact test/native lint0. Independent
source reviewer closed, acquisition-review.md retains early security-order and
fallback-retry reasoning. New exporter/source-equivalence contracts4PASS;
initial2FAIL were absent helper files, not behavioral regressions. Reused
package_export and preflight helpers differ only in explicit package identities.

prepare.mjs finished successfully:59pins,15untracked inputs, only Canvas source
changed among previous58pins, HEAD/index/unrelated tracked diff preserved.
source.json/source.patch/untracked-source.json/new-source-files.tar.gz/config
are frozen build inputs. Intended BuildID20261006153147; intended export
exports/umbrafox-exact-fallback-20261006/. Prepare writes exclusive filenames;
do not rerun over them. Actual source test formatting completed, all execs
started for tests/lint/prepare terminal.

Build has NOT started. Preflight at2026-10-06T15:45:27.624Z rejected concurrent
cargo2110734/rustc2110763;45.36GB available/71.50GB disk. No interference with
those unrelated jobs. Retain preflight-build.json/log; use a fresh filename for
any later preflight. Next: no-compiler/resource/source admission, two-job idle
integrated build/package with verified ELF+both INIs, then strict OFF laptop
pixel matrix before any ON run. Existing filter-repeat failure may still block
overall parity; do not relax/drop it. Prior RGB report documents configured
toolkit/library .deps/buildid.cpp.stub --what-if generator if ID stays stale.
No desktop browser/profile/launcher/install, Pi, index, commit or push changes.

SUPERSEDING source-only checkpoint: three preflights refused compiler activity;
fourth passed. Build49497 succeeded66.85s/0warnings, native ELF ID correct without
generator workaround. Package71464 succeeded100.57s/0warnings. Export54813 PASS:
46files57entries475126813B; archive107782260B SHA147a2501536855dca2916893ec5ab36373b4f4a09bacd761b0bab8148521fc8b;
manifest908633c41ff3579585a08dbaf228c158735d7f61d77fb22cc0aeb822df880f87.
Native+INIs20261006153147, frontend onlyAppConstants BuildID. Libxul SHA
d7dab4fcc5eeecb5f9675e20c0455ccbc22468a0c7709ee478423abfb1919520.
All59sourcepins/index/fullpatches/config preserved after packaging.

Real-video phase artifacts/umbralink-control/exact-fallback-pixels/ uses78input
harness,74shared inputs byte-unchanged; only4 identity/namespace wrappers differ.
Bundle226abeea2f3af9623bf8f74587416248737f6e788aa8a447afb5be641f520fa1.
Laptopharness exact-fallback-pixels-harness-20261006-G1c6e5. OFFz1CuLU
controller1562045/browser1562076 at15:57:40.404..15:57:56.521UTC16117ms;
ONNx3kW4 controller1564536/browser1564548 at16:00:04.315..16:00:20.426UTC16111ms.
Both strictunpacksPASS,38files/12absentPIDs perarm; total76files2773799B,
cleanSIGTERM/271Blog/0drops,46fileinstallationpostcheckPASS,6resourcesamples
perarmpeak65082448/65057238B. NativePID/build/privateappdata/temp joinsPASS.
Reference/OFF/ON graphics+hardwaredecoder observationsmatch IrisXe25.2.8/X11.

IMPORTANT NEW RESULT: OFFall48hashes match frozen full-size reference, ONall48
matchOFF; fourrawlinearRGBA buffers exact percomparison. Allrepeatstable incl
filter; prior14mismatches and sevennativeprescale failures remainpreserved.
DoesNOT explain historicalblur instability or proveeveryimport/GPUcompletion.
comparison.json remains historical OFF-only; pair-comparison.json is later ON.
No performance measured fornewbuild. Prior35.48% result NOT transferable.
New savedtests reject stablewrongpixels/corruptbuffers/mode/staleframes. Final
combined62PASS,BuildID6PASS,archive9PASS; scope lint/source checks clean.
Mechanical extractor test initially22PASS1FAIL for2spaceindent drift; corrected
beforetransfer, final23PASS. Availability141fileseal verifiedunchanged.
Report bot-docs/reports/performance/2026-10-06-exact-canvas-fallback.md.
All build/test/copy/SSH/browser processes owned by this phase are terminal.
Next: actual decoder/import recovery and integratedcache/dispatchcost/performance
gates, thenbroaderplayback/YouTube; defaultOFF anddesktophold remain. Goalactive.
Final seal exact-canvas-fallback-final.sha256 verified243files616137386B,
SHA63f0cf43deabec89ab580b17c4f274074b1714fea738af35ca21407c838e685f.
Plan/report/evidence/export/newwrappers+tests are now frozen. Later work uses
new namespace. Final source guard59+78pins/HEAD/index/config PASS; final docs
lint0. No build/test/copy/SSH/native process remains owned by this phase.

## October 6 Readback Availability Native Gate

Native phase bot-docs/plans/readback-cache-availability.md; evidence
artifacts/umbralink-control/readback-availability/. Prior lifetime seal verified.
Actual RED28tests:23oldPASS+5newexpectedFAIL,0skip/errors; nativeexit1,
all5PIDs1535426/1535438/1535440/1535479/1535486 independentlyabsent.
Fourexporthashes+48filepostcheckPASS. Root readback-availability-red-
4f3770a9-94a9-49e5-9ef9-b6d2fd048761, harnesspNk5D5. Redmanifest
bb8f39d505bd7201fc125a8a149e41d27ae201b7b774b71491af4d46fca043a7;
lib358513608B SHA1717d17c...af0b8e09; native20261006111504/loader20261006052600.
REDtest-onlybuild28.87s0warnings. SCPbraceexpansionfailed; explicit4paths copied;
oneverificationstartedbeforecopyfinishedandfailedENOENT, afterterminalcopyPASS.

Private CanReadback virtual implemented in6existingfiles: GPUVideoImage full
and sizedhits validate outsidecachelocks; RemoteMediaManagerChild dispatches
SyncRunnable toexistingmanagerthread and checks BOTH actorCanSend+channelCanSend.
Missingthread/dispatchfailure=>false; parent/nulltestmanagerfalse; mocknormaltrue.
No new IPC, flag, default, pixel math or publicAPI. All19oldtestbodiesunchanged.
Conditionalremote-readbackfailure equivalence NOTclaimed, browserparity stillowed.

First implementation build20740 is terminal FAILED: green-build.log records
22m16.8s, two incomplete Endpoint type errors in the new test,12warnings.
Added only mozilla/ipc/Endpoint.h; header-source-guard.log proves all other
58 frozen inputs unchanged. Corrected build40184 reached900s and exited124
without a new compiler error; mach/make/compilers confirmed absent. One
continuation92208 completed successfully in175.76s,0reportedwarnings:
env MOZ_BUILD_DATE=20261006111504 CARGO_BUILD_JOBS=2 timeout900
./mach build -j2 recurse_gtest --priority idle >green-continuation-build.log.
Preserve green-final-build.log for the timeout; no unexamined restart.
All builds terminal. Two source-review agents completed and closed.
authority-review.md found actor-onlygap; implementation-review.md found test
barrier atomicdidnotwakemain and exceptionalstackcapture risk. Corrected by
RefPtr ownedReadbackManagerReady plus explicitmaincompletionevent; post-error
actorCanSendfalse assertion added. Corrected test compiled before packaging.
Final58sourcehashes build-inputs-header-correction.json equal all packagepins;
HEAD/index/unrelateddiffguardPASS. Exact6source+clangformat lint0.
No build/native/copy session remains live.

GREEN has38 tests: prior28 plus realchild-manager local authority test and all9
TestRemoteImageHolder regressions. Realmanager uses ownedUNBOUNDpeer endpoint,
realInitForGPUProcess/backgroundinit, caller/inlineCanReadback, immediatechannel
errorwhileactortrue, coldreadonlyaftererror, actorfalseafterdelivery, threadshutdown.
Review's fakeparentproposal REJECTED: generatedstaticcastsconcreteparent;
realparentrequiresRDD/GPU/utilityservices. No realremotereply/pixels/decoder inthis
test. Newgreenrun/controller+contract separatefromRED, preserving exactoldrunner.
Actual GREEN38/38PASS,0fail/skip/errors, nativeexit0, suite0.321s NOTperformance.
Fresh GREEN laptop harness: readback-availability-gtest-harness-
20261006-AIQX5F,70harness+47basefiles, two GREEN controller/contract filescopied.
Native root readback-availability-green-6b569758-2105-4b6e-a4c7-15975cd93045.
PIDs1550840/1550852/1550854/1550889/1550901 independentlyabsent;48filepostcheck
833653744B and4publicexporthashesPASS. Log8052B retains sandboxEPERM/headless.
Manifestac8187c7b158306ca6dc2eac72e98454b1c99f39335c4c610f5026d7ea88e64e;
lib358533856B SHA891df2f2c58eb45276887d35f47483428d0fc40dd17c4bf1acab49512f809b45.
Eight final offline checksPASS; initial7PASS1FAIL was exactcontroller comparison
for one omitted terminalnewline. Saved check establishes only thatbyte; expected
transform corrected, executedcontrollers/evidence unchanged, no native rerun.
Priorphase70filesealverifiedagain. All original19testbodiesbyteexact. Report
bot-docs/reports/performance/2026-10-06-readback-cache-availability.md.

NEXT: added local dispatch cost and actual retainedVideoFrame loss/pixel parity
remain unmeasured. Reference/cachedCPU/directGPU modes need separate faultgates;
directimport bypasses this cachecheck. Failed dispatch only source-reviewed.
No real decoder/reply/RDDrestart in authoritytest. Seven prescalepixel failures
and realvideo/filter failures stillopen. Preservehardoracles, exactfallback and
defaultOFF; integrated parity/performance versusdailyV2 stillrequired. No desktop/
Pi/install/default/stage/commit/push. Goalactive; no new performance claim.
Final seal readback-availability-final.sha256 verified141files720951810B,
SHA476ef0f2d8dd36931f8a261a8f56440f35a992eb6c960137ff57d05c7e4f74dd.
Evidence/plan/report now frozen; seal-check log and summary are sibling files.
No active exec/worker/native/browser/build/copy session remains from this phase.

## October 6 Readback IPC Lifetime Gate

Latest turn PROGRESS: new TestGPUVideoReadbackIPC.cpp + gfx/gtest registration
exercise real PTestShmem normal/abnormal channel close cross-thread/process.
One laptop native run23/23PASS (old19 unchanged+new4),0skip/errors,0.327s NOTperf.
Tests read all16MiB after ActorDestroy returns/maptable clear, corrupt-byte oracle
negative, delayed mainthread release keeps quota charged, exact1destructor and
competingcache admission afterdrain. No production edit in this phase.
IPDLUnitTest.cpp test registry now function-local firstuse following independent
initorder risk finding; originalbinaryfailure NOTreproduced. Testcompile3API
errors fixed; finalbuild14.04s/0warnings. Native/evidence checks and lint complete.

Plan full-readback-loss.md; report performance/2026-10-06-full-readback-loss.md;
evidence artifacts/umbralink-control/full-readback-loss/. Final manifest
515edb6bd096e3c000d428bbf01f176cd41b3fc4209d973294b0e9fcfe06f0c1,
library358489592B SHAd6dd84ce...339a96d249. NativeID20261006111504 vs loader
20261006052600 remains diagnostic-only;47basefiles unchanged. HarnessIe0zrE;
native full-readback-loss-ipc-registry-964784c6-6ff9-4571-a510-bf1cb8c54ac0.
PIDs1524624/1524636/1524638/1524675/1524682 independentlyabsent;48file833609480B
postcheckPASS;4evidenceexporthashesPASS. SevenofflinechecksPASS, source57pins,
all54priorinputs unchanged, index/HEAD/unrelateddiff preserved. Newtestsource
f8fcd8f3259635b36e1b1fcf5fb179f5d6f9863e4c69edb2de8ad4ec5230041d.
Both reviewagentsclosed; no live native/build/controller/copy session.
Finalseal full-readback-loss-final.sha256 verified70files717853668B,
SHA4a6fb4e69dfcaf0d579cf9541066f7d31a15a84c23ad2b391f617c941880fe00.
Evidence/plan/report frozen; seal-check log is outside sealed directory.

IMPORTANT NEXT: consumer audit establishes conditional postloss pixel/error risk,
not just mappinguncertainty. Warm fullcache bypasses Readback/CanSend; missing
thread or disconnected manager ordinarily yieldsnull, causing VideoFrame draw
InvalidStateError/video no-op/WebGL CPU failure branches. Actualpage regression
NOT run. Need authoritative manager-thread availability preservation on cachehit;
do not read non-atomic CanSend offthread or assume mirroredflag racecoverage.
Consider existing synchronous manager-thread validation beforehit, measurecost,
failing-first fake no-thread/disconnected and realbrowser faultparity. Existing
nsIRddProcessTest.stopProcess is normal/permanent RDD stop, NOT restarttest.
Retained ImageBitmap is usefulcontrol; retain VideoFrame/compare exceptions+raw
sentinelpixels afterverifiedoldchannelloss. Fullscope remains exactfallback/GPU
import/native+realvideo/filter/parity/performance vs dailyV2. No defaultenable,
desktopbrowser/profile/install/Pi/index/commit/push. Goal remains active.

## October 6 Exact Full-Size Cache Native Gate

Active goal turn is PROGRESS: production GPUVideoImage.h now caches exact full
DMABuf readbacks independently of the old sized cache. New helper owns one entry
per image with a shared atomic16MiB retained-byte budget (actual stride*height).
IPC is outside locks; release on main thread retains its budget reservation until
the cached reference is released. No manager-owned cache/cycle. Other decoder
types and the sized overload are unchanged. This does NOT yet remove the invalid
canvas prescale route, enable direct import or resolve the seven pixel failures.

Plan bot-docs/plans/full-readback-cache.md; evidence
artifacts/umbralink-control/full-readback-cache/. Only source changes this turn:
GPUVideoImage.h + gfx/tests/gtest/TestGPUVideoImage.cpp. Original nine native
test bodies byte-exact;10new tests include exact1080p bytes, image/handle/sized
isolation, fault/non-data recovery, shared quota/stride, reentry, same-image and
eight-image budget races, destruction and queued main-thread budget release.
First RED actual laptop native run19tests10PASS9expectedFAIL,0skip/errors,
cleanexit1. LibrarySHA160b29b5...f3c2e3c, manifestf9de591a...cea31b17. Original
source and test snapshots + both dirty/index patches retained. Red package
nativeID20261006111504/oldloader20261006052600 explicitly diagnostic-only.
Redroot full-readback-cache-red-8cb3717a-5544-4a33-9458-041b58b9f366,
controller1493562/native1493574/loghelper1493576 independently absent;48package
postcheckPASS, four public exports rehashed in red/remote-postcheck.json.

GREEN now19/19PASS,0skip/errors, actual laptop native exit0,0.089s suite time
(NOT a performance result). Library358460616B SHA2c0f59813ff36ddd...3fca837f17;
manifest1932fe6feb542bcf8079ad3c3c37177024a488927670959b5516078b33ac4788.
NativeID20261006111504 remains distinct from oldloader20261006052600; diagnostic
overlay only, not an integrated browser package. Fresh harness69IhP1, native root
full-readback-cache-green-a8cd6ea2-f8b8-4b3f-a617-801a1a01f180. Controller1509630/
native1509642/loghelper1509644 independently absent;48filepostcheck and4export
hashesPASS. Log4056B retains usernamespaceEPERM/headless announcement.

Initial two-jobidle900sbuild really timedout124; group1809445 verifiedabsent.
One2400scontinuation completed1290.88s, logreports0compilerwarnings/success.
Exec33789 expired from tool registry by resume; terminal log, absent compiler
processes, ELF BuildID and actual newlibrary native run support completion.
Keep firsttimeout/dependencywarnings; no one-shotclean claim. Eightimage race
included in finalgreen. Five offline evidence checksPASS; finalnative lint0;
54sourcepins match green; original9bodies exact; index/HEAD/mozconfig and all
unrelatedtrackedworkingdiff unchanged. Prior55fileoperationordersealPASS.
No active native/browser/copy/build/test session; no desktop/profile/launcher/
install/Pi/default/commit/push changes. Red and green artifacts retained.

Operational corrections retained: mach clang-format retired -> mach format;
one SSH inline JS quoting failure ran no verification (stdin helper fixed it);
runner equivalence first found only an added terminal newline, exact transform
now accounts for that newline. Do not overwrite failing evidence. Compiler
warnings from the first invocation retained; continuation-only0warnings.
Independent source review found no concrete cache defect, but populated hits
bypass managerCanSend afterIPC loss. Shmem descriptor reference-counted mapping
and userdata ownership support lifetime, not complete channel-loss/page parity.
NEXT: actual loss-state coverage then exactfullsize fallback/directGPU integration
and allnative/realvideo/filter/parity/performance gates against dailyV2. Do not
claim7prescale pixel failures fixed, remove tolerances or install this overlay.
Keep broad goalactive. Report2026-10-06-full-readback-cache.md contains detail.
Finalseal artifacts/umbralink-control/full-readback-cache-final.sha256 verified
86files717832112B, SHA6333497fdd458a5bec9707bde67d62edfb4f3fb19686a964cbd6e480cfffef95.
Plan/report/evidence nowfrozen. Finalguard original9tests/index/unrelateddiffPASS,
finaldoclint0, diffcheck0. No liveexec/worker remains from this phase.

## October 6 Readback Operation-Order Isolation

PROGRESS: new test-only counterfactuals establish extra8bit intermediate as the
mechanism for the two accelerated half-alpha cases. Native40 remains33PASS7FAIL,
0skip; all original results/counts unchanged. Staged full-size opaque reference
then halfalpha matches candidate byteexact; staged vs original28851components
video/2small, max1. Software staging leaves originalunchanged, candidate still
differs. OddGPU remains1685/1; source-operation control1858/1, so noAA alone
doesnotresolve. Softwareodd rawreadback vs sourceop21605/1 vs original159300/27;
not a generic roundingfix or provenSkia kernel. All failedcriteria retained.

Plan readback-operation-order.md; report performance/2026-10-06-readback-operation-order.md;
evidence artifacts/umbralink-control/readback-order-isolation/. Only changed
TestDMABufReadback.cpp (three observations/eight existingcases, optionalophelper).
Two-jobidle gtest15.64s/0warnings. Library358415552B SHA400c9066...05cbb647,
nativeID20261006111504 vs oldloader20261006052600, explicitlydiagnostic-only.
Manifestb214c789a37460de30eb1cc55073d7195b4973228932e88d095a3260d5d1879a.
Onefresh laptoproot readback-order-isolation-isolation-6b0b00ce-c2d6-46d0-ae84-875c39c3ce6a;
controller1483603/native1483615/helper1483617 allabsent, cleanexit1(testfailure),
48filepostcheck/13117Blog,7offlinechecksPASS. No default/production/desktop/Pi/
install/index changes. No repeat. Counterfactualtest doesnotprovevideo/stutter.

NEXT: trace all sized-readback/cache consumers before production correction.
Size-only RGB8 prescale cannot generally replace finalbackend scaling+composition;
existing directGPU import keeps these operations downstream and is the performance
lead. Unsupportedroutes need exactfullsize fallback or a demonstrated lossless
alternative, not tolerance/blanketGPUforcing. Keep importfailure recovery, filter
repeat failure and integrated parity/performance gates; do not claim the older
35% controlledCPUwin is a currentdaily/YouTube gain. Fullgoalactive.
Final7offlinechecksPASS, native/docslint0,diffcheck0; source54onlytestchange,
allproduction/HEAD/working/index/mozconfigguardPASS; prior61filesealPASS.
Newseal readback-order-isolation-final.sha256 coversplan/report/evidence;
no active native/browser/copy/build/test/lint sessions or worker remain.

## October 6 Residual Native Pixel Gate

Current phase PROGRESS, not parity completion. Plan scaled-readback-residual.md;
report bot-docs/reports/performance/2026-10-06-scaled-readback-residual.md;
evidence artifacts/umbralink-control/readback-residual/. Only native edit is
TestDMABufReadback.cpp: eight actual-ratio/alpha/SKIA tests. One laptop run:
40 total,33PASS,7FAIL,0skip, all prior32PASS. Ordinary accelerated opaque
1920x1080->320x180 exact. Residual differentComponents/max: oddGPU1685/1,
alphaGPU28851/1,software22710/1,oddSoftware159300/27,alphaSoftware11598/1,
smallAlpha2/1,smallSoftware4/1. These are channel counts, not pixels. Preserve
native failures; no thresholds/expected-pass exemptions or production fix yet.
Quantization/coordinates/backend differences remain separate hypotheses.
Filterrepeat not covered; old realvideo failed hashes remain authoritative.

Native root readback-residual-residual-c96229e1-ec03-4248-8ac9-34c154ee09e9;
controller1473627/native1473639/helper1473641 all independently absent. Exit1
from test failures, clean cleanup,48file postcheck,13117Blog. Native GL Intel
IrisXe(RPL-P); runner headless, not visible playback. Two-job idle gtest build
17.25s/0warnings. Stripped library358412760B SHA5e4f69ba...592e5bc9,
ID20261006111504; old pinned loader ID20261006052600 explicitly separate.
Manifest89e26fca308028edd8aeff4339137072e5b317817d1e5b5a1fa3e97b1858ab4f.
No desktop/Pi/install/default/index/commit changes. Next: retain failing tests,
trace precise scale/alpha/backend operation differences before correction,
then repeat strict native and realvideo gates, not performance first.
Final6 offline checksPASS, native/docs lint0, diffcheck0, source54 only intended
test change, trackedworking/index/HEAD/mozconfig unchanged; prior84filesealPASS.
All commands terminal. New phase seal readback-residual-final.sha256 covers
evidence/plan/report; subsequent fixes must preserve these failing artifacts.

## October 6 RGB Real-Video Gate

Previous turn built/sealed integrated RGB package; this turn made progress with
actual laptop playback evidence, NOT overall parity acceptance. New plan
bot-docs/plans/rgb-readback-pixels.md; report
bot-docs/reports/performance/2026-10-06-rgb-readback-pixels.md; evidence
artifacts/umbralink-control/rgb-readback-pixels/. New78-input/79-entry harness
SHA48e197e23d328b5b499838fadbe738faeaf630132dc5ec10a367228f6672d473;
74 inherited inputs unchanged,4 identity/path wrappers replaced. Fresh laptop
harness rgb-readback-pixels-harness-20261006-UWmY19. Package20261006111504,
manifesta5da86b6..., same54 source inputs. No native/default source edit.

ONE OFF capture XtyhI9 completed11:40:07.995..11:40:24.608UTC(16.613s),
controller1465484/browser1465497, all12recordedPIDs absent, cleanSIGTERM,
271Blog0drops, installationpostcheckPASS.38files1386984B verified. Native
appdata/PID/build joins pass. Same IntelIrisXe/Mesa25.2.8.0/X11/AVChardware
decoder/mediaSHA as fullsize reference. Strict unpack FAIL repeatStable false
for filter atbothframes. Separate forensic extractor preserves exactfailed
predicate, no gate relaxation. ON notlaunched; no performance continuation.

Important positive result: all4 retained linear buffers now byte-exact against
fullsizeR2. Old V2 linear3575/3157pixels max94/100 differences gone forthiscase.
Whole48case gate STILLFAIL:14hashes differfromfullsize (eachframe odd2+alpha2+
readback2+filterrepeat1). Othernonlinearrawbuffers notretained: magnitudesUNKNOWN.
Current20cases differfromoldV2; nearest-setting also matchesR2 (DrawImage forces
LINEAR while downscaling regardlessimagesmoothingfalse). FilterunchangedoldV2.
Final25offline testsPASS includesall38hashes/nativejoins, exactbytes, corrupt
buffer/target, retainedstrictfailure andwrapperbyteequivalence. Allcommands
terminal. Desktop/Pi/install/launcher/profile/index untouched.

Nextengineering: extend realnativeTestDMABufReadback with actual1920x1080->
321x181 ratio, postscaleglobalAlpha andsoftwaretarget reference. Existingtest
8x4,WebGLdefaultDrawOptions doesnotcoverthese. Localhelperdoesnotacceptalpha
orbackend; callerDrawSurface appliesglobalAlpha afterward, extraquantization
is a HYPOTHESIS, notcauseproof. Preserveblurrepeatseparate (filteredpath bypasses
sizedhelper; rawRGBA alreadyreproduceswithoutdecoder). No looseparity/noise
waiver or blindperf rerun. Keepbroaderperformancegoalactive.
Finalsource54/harness78/HEAD/index/working/config unchanged; docs lint0,
fourfilePrettierPASS,diffcheck0,prior123filepackagesealPASS. Newsealed84files
26926074B, artifacts/umbralink-control/rgb-readback-pixels-final.sha256 SHA
5e261ce6d474b0778f77e6978e0c30d07ce6ef858ac457b5b14d73515b301be9;
independentverificationPASS. Namespace/wrappers/tests/plan/report nowfrozen.
AllSSH/browser/test/lint sessions terminal; no activeworker. Nextnewnamespace
for native residualcases, preserving failedOFF and exactlinear evidence.

## October 6 Integrated RGB Candidate In Progress

Plan bot-docs/plans/integrated-rgb-readback-candidate.md; evidence
artifacts/umbralink-control/rgb-readback-candidate/; intended new export
exports/umbrafox-rgb-readback-20261006/; fixed BuildID20261006111504.
54 source pins,13 untracked inputs and full HEAD/index/working patches captured.
Only tracked source differences from prior integrated package are DMABufSurface
correction and GTK gtest registration; no production edits this phase.
Preparation/source contracts37PASS, exporter equivalence2PASS, ID reader6PASS,
archive9PASS (mach build venv required; original plain Python import failure
retained). Source/HEAD/index/config guards passed after generator/relink.

Full build32s/ordinary binaries9s retained old toolkitID20261006095500 despite
new application header. Generator stamp was newer than GTK objects; date env
is not a dependency. Mach MAKEFLAGS what-if attempt did nothing (GNU ignores
that option in MAKEFLAGS). Direct configured gmake toolkit/library target
.deps/buildid.cpp.stub with command-line --what-if=absolute gen_buildid.py
executed the existing recipe, no manual stamp/generated/source/binary editing.
Generator/backend/link-list hashes unchanged. Normal mach binaries then12s,
zero warnings; ELF-note reader confirms20261006111504. Failures preserved.
Two-job idle package completed99s/0warnings; execsession55376 terminal. Export
session33980 also terminalPASS. New export has46files475122949B/57entries,
archive107766516B SHA71f6addde29258baff9e0f8cad10a6ef2ae3dd64a0d220649c9f4bf49ea57587;
manifestSHAa5da86b656e6bd241e309329f0072367d2bfc891650c500abb47fe561b071a11.
Native+bothINIs20261006111504, frontendonlyAppConstantsID. Separate46file
installationadmission/postcheckPASS, no lock/browser. Final39contractsPASS,
all54source+13untracked+HEAD/index/working/config guardsPASS. Report
bot-docs/reports/performance/2026-10-06-rgb-readback-candidate.md. No runtime
or install yet. No desktop
browser/profile/launcher/Pi/default-pref/stage/commit/push changes. Keep import
OFF, preserve blur-repeat failure and all old seals. Next new strict
laptop real-video matrix; no speedup/parity acceptance from native tests alone.
Final scoped docs lint0/diffcheck0 and prior65-file native sealPASS. New seal
artifacts/umbralink-control/rgb-readback-candidate-final.sha256 independently
verifies123files585452881B, SHA
5c70b42d6b9f0688a0051e8f63c3ffc1acb7cf057ccb1343ac82d4b049e07f47.
All build/export/test/lint sessions terminal. Do not edit sealed evidence,
export, plan or report. Use a new namespace for laptop real-video tests.

## October 6 Scaled Readback State Gate

Active goal remains broad rendering/layout/CSS/JS performance; this turn made
PROGRESS by extending real native GL state/failure coverage. Plan
bot-docs/plans/scaled-readback-state.md; report
bot-docs/reports/performance/2026-10-06-scaled-readback-state.md; evidence
artifacts/umbralink-control/readback-state/. Only new native source edit is
existing TestDMABufReadback.cpp, SHA28f18634186bd0b48a6a2743d3ffb0b7da89ac8be58643545fa79d5b9aac63ed.
Production readback remains84a1855a...576d8b3; trackedworking/staged/HEAD guards
unchanged. Added8 tests: scaled/fullsize state, source/dest allocation failure,
missing plane, empty source, BT601/2020.32nativePASS0skip,8exactpixelcases.
Both allocations use MAX_TEXTURE_SIZE+1, NOT realOOM. Final nonzero0xA5 buffer
and subsequent recovery pass; finalGL reports Intel/Mesa Intel Iris Xe(RPL-P).
State snapshots cover36values; program/VAO/arraybuffer notnondefaultseeded;
helpers warmed; no contextloss/driverOOM/decoder/EGL/IPC/stockFirefox proof.

Initial32PASS run c363fd4d... PID1445847/controller1445835/logchild1445849;
finalstrengthened32PASS run62323ee6... PID1453919/controller1453887/child1453921;
all6exactPIDs independentlyabsent; all8exportedfiles size/SHAverified.
Final freshlaptop harness readback-state-gtest-harness-20261006-BtgK1E;
native root readback-state-state-62323ee6-9579-457e-88e7-3867c0922845.
48packagefiles833509376B postcheckPASS;9071Blog/cleanexit0. Finaltestlib
358389488B SHA596445a1be52a8e2447ce6c6401a55bc0eb3071bb92a8e71912915ee29d7fc54;
manifest767dd805d95d082f0223d2080399bae454d9ddebcd0cfd91081539ac174245fc.
Two15s scopedgtestbuilds0warnings; native/docs lint0;8offlinecontractsPASS.
Initial SSH quoting error inhashcheck ran no browser, correctedstdincheckPASS.
No owned session/browser remains. Nativeonly; normaldistlib STILL PRE-RGB-FIX.

Next: NEW full integrated diagnosticbuild/package then strictrealvideomatrix.
Do not relabel prior export/use oldlib. Of prior integratedsource.json35files,
onlymozbuild differs; DMABufSurface.cpp was NOT an individualpin there (tracked
patch provenance retained it). Add explicitreadbackimplementation/helper/test
pins innewmanifest; don't assume old35 covernewpath. Blur-repeat remainsopen;
strictwholematrix maystillfail andmustnotbeweakened. No desktopinstall/profile/
launcher/Pi/prefdefault/index/commit/push. KeepGPUimportOFF. Seal next action
readback-state-final.sha256 coversnewnamespace+report+plan, notmutableDETAILS.
Seal nowverified65files718047299B, manifestSHA
22a1ae816c3c6c61d0596b228ea1787eda6fede9b5cd934b96e32561c0dd3d96;
independent sha256sumPASS; prior79fileseal unchanged. Do noteditsealedpaths.
All commands terminal. Use newnamespace forintegratedRGBpackage work.

## October 6 Native Scaled Readback Correction

Plan bot-docs/plans/scaled-readback-order.md; report
bot-docs/reports/performance/2026-10-06-scaled-readback-order.md; evidence
artifacts/umbralink-control/readback-order/. Actual local GLContext helper
TexParams_SetClampNoMips sets NEAREST min/mag: sized V2 inherits nearest YUV
sampling, not the historical convert-full-size-then-LINEAR-RGB route.
New GTK gtest TestDMABufReadback uses real GL planes and actual ReadIntoBuffer,
independent reference full-size readback + DrawTargetWebgl linear DrawSurface.
Initial4 tests failed factory tiny-size admission (not pixelRED); direct Init
then produced21tests20PASS1behavioralFAIL, saturatedluma24components/max110.
Constant/same-size/chroma controls and all17 prior importer/upload testsPASS.
Native RED receipt root b0e0defb..., PID1427237/controller1427225/all3absent.

Production delta ONLY widget/gtk/DMABufSurface.cpp ReadIntoBuffer: existing
scaled/different-size path now converts full-size to GPU RGB8, then explicit
LINEAR intermediate sampling before small readback. No hotwait/errorquery or
CPUfull-frame copy; full-size/crop route retained.35add4remove againstbefore.
Source SHA84a1855a7ce04f774db2b90b2123397eb3311619429d21d7c36b9d62c576d8b3.
Native24PASS0skip incl6zero-difference matrices+emptydest recovery+old17.
New test b8e25fda092d92f488791c13f1f86767ea8d88324d96a0162819abeea25cd849;
GTK moz.build affd5e5c...033620. Index unchanged3b78253c...e4e0c4.
Scoped widget build needs --allow-subdirectory-build; first commandignored
targetdespiteexit0 preserved, NOT counted. Correctwidget18s/gtest15s0warnings;
3filelint0. No full engine/package/daily install inthisphase.
CRITICAL: normal dist/bin/libxul and sealed integratedexport still PRE-FIX;
only widget objects and gtestlib are new. Need fresh fullbuild/package before
realvideo. Preservepriorseals; don't rewrite prior package manifests/guards.

Final testlibrary358362240B SHA8230d5b3e2972813db3f4a85ddd32603cd1caa826ce3782de4476ee545716050;
manifest3cd7015be34f4af2efbca22637a0cafbee67adf3c5e5b982d5fbd1f4f536a4cc.
Fresh laptop harness readback-order-gtest-harness-20261006-WJKuep; run
readback-order-rgb-427f5e1e-f9fc-4844-895e-96e705683698, PID1435023/controller
1435011/logchild1435025 allabsent; 24PASS, cleanexit0,48filepostcheckPASS.
Initial permission rejection, test-setupfailure and nativeRED allretained;
12exportedfiles+remoteSHAreceipts verified across3runs. No active sessions.
Native GL vendor notexported; no EGL/decoder/IPC/driverOOM/contextlossproof.
Blurrepeat separate/unchanged. Need GLstate/fault tests, exactrealvideo48case
pixelgate, then performance/memory comparison; no speedup claim fromthisfix.
GPUimportprefOFF; desktopbrowser/profile/install/launcher/Pi untouched.
Final9offlinecontractsPASS; docs lint0; trackedotherdiff/staged/sourcecopies
exactguardPASS; diffcheck0. Evidence seal readback-order-final.sha256 covers
namespace+report+plan; excludes mutableDETAILS/currentworkingsource. Verify
completed79files1076686726B, manifestSHA
10712b201da66d70c7b405e5bae578b5f8bedcfddc8a248e58c78d72adc67046.
Independent sha256sumcheck79PASS; prior91fileseal unchanged. Namespace,
report and plan now frozen; subsequent tests/changes need new evidence paths.
All commands terminal. Next GLstate/fault extension, then NEW full integrated
build/package and strict realvideo matrix; never use old ordinarylib ascurrent.

## October 6 Integrated Pixel Gate FAILED

Plan bot-docs/plans/integrated-import-pixels.md; evidence newnamespace
artifacts/umbralink-control/integrated-import-pixels. Four identity-only sibling
scripts reuse existing linearcollector exactly; RED2 admission failures retained,
23focused+4timeout testsPASS. Initialprepare rejected oldhelpers beforewrite;
sole inherited difference is existing optionalRPCtimeout fix (15000default),
exactlatestSHA281a98c2...392a5c69 pinned. Other73oldharnessinputs unchanged.
35native/source/HEAD/index/patchguardsPASS. New78input/79entryharness bundle
SHA4934e25271e50c6ed79cccdd38af6d7f516eb3bf5375cde9cb0e263552bac431.
Remote fresh ~/.cache/codex/integrated-import-pixels-harness-20261006-bFq8s9;
transfer begun, extraction/preflight then15ssettled ONE OFF/ONE ON pending.
Exact integratedpackage20261006095500/e770fd47..., no dailyinstall/nativeedits.
Strict48hash/4bufferzerotolerance; anymismatch stopsperformancecontinuation.
Runtime/driver/SSH120/220/240sbounds, existingprivateappdata/temp+ownedcleanup.
Nativefault injection remainsopen, thisphase onlypixel/package/nativeIDreceipts.
OFFemWb7G terminalcapturePASS but acceptanceFAILED: repeatedfilterhashes differ
atboth0.5/2s, otherpairsstable. All48 caserecordsexactmatch priorV2linear-pixels/
off-1;22/48 differfromfullsizeR2. Linearrawdifferences3575/3157pixels,max94/100,
sums45640/66314, unchangedpriorpattern. NoONlaunch; ONpreflightonly completed.
Controller1409006/browser1409018,16.5s10:16:06.201..10:16:22.701UTC,38exports
1387078B/all12PIDsabsent/cleanSIGTERM271Blog0drops/packagepostcheckPASS.
StrictunpackFAILED preserved; separatefailure extraction retainsoriginalPASS
transportstatus, failure-analysis.json labelsphaseFAILED. Final29focusedtests
PASS incl38filehashreplay,oldV2exactjoin,reference22diffs,negativepixelcorruption.
Report bot-docs/reports/performance/2026-10-06-integrated-import-pixels.md.
Nextactualengineering: scaledreadback conversion/scaling order andfilterrepeat
source/cache/allocation isolation, not anotherblindmatrix orperformanceretry.
CurrentDrawImage excludesfilter/shadowfromV2helper, so directblurcausenotproved.
Originalnative/readback/performancegapsremain; noexternalblock/goalcomplete.
Finalsource35/runtime78/HEAD/index/workingguardsPASS; prior98fileseal unchanged.
Docs lint0/diffcheck0,9currentJSformatPASS. Formattingofextractor preserved
executedversion; strictbyte+ASTequivalence6replay/29fulltestsPASS afterformat.
New91fileseal26931639B verified:
artifacts/umbralink-control/integrated-import-pixels-final.sha256,
SHA06973c99dd7fdb428ff4ef78bf8cd8fe039978f88ca6a83121879597c8ccea6b.
Do noteditsealednamespace/scripts/tests/report/plan. Allcommands terminal.
Noownedbrowser/controllerremains. Currentsourcelead: MaybeGetScaled... calls
GPUVideoImage::GetAsSourceSurface(size), cachesonesizedCPUreadback<=1MiB;
DrawImage filtered/shadowbranch bypassesthis, so filterrepeatnotdirecthelper.
Read old fullsize-reference and blur-source-lifetime reports BEFORE designing
anotherexperiment: shared/freshrawRGBA alreadyfalsifiesdecoder-onlyblurcause.

## October 6 Integrated V2 Import Package Verified

Plan bot-docs/plans/integrated-import-candidate.md; report
bot-docs/reports/performance/2026-10-06-integrated-import-candidate.md.
Evidence artifacts/umbralink-control/integrated-import-candidate; export
exports/umbrafox-integrated-import-20261006. BuildID20261006095500 matches
bothINIs/nativeELF; archive107770016B SHA2700a1b01cb4cbd84e36e05a7f1e350fd342b1dfc717cdf409e9bd1862aacb68;
manifestSHAe770fd478f4a2e469184b22d340bbe53387cd8f5190f44a5c45a67a3124b2dfb.
46files475122469B/57entries, independent0700 installationadmissionPASS.
Only frontenddelta is exactBuildID inAppConstants, browseromniunchanged.
Currentobject NOW matches V2+nativeimportfailure working source; previousR2
fullsizeobject warning is historical, preserve distinct oldexport/report.
35pinnedsourcefiles/HEAD/index/working/fullpatch/config guards unchanged;
onlyCanvas2Ddiffers fromR2native24, exactrestoredV2SHA50bd5080...981a9.
No productionedits. Translator-side importfailure stillFULLSIZEfallback;
V2eligibleHTMLpath scaledfallback isnot allfallback. DefaultDMABufprefOFF.
OldnativeID RED retained, configuredbuild30s/package93s success0warnings,
j2/idle/1800s/600s/XZ2. Cargo contention rejectedpreflights retained, untouched.
Final39contracts+6reader+9archivePASS, directRuff/PrettierPASS.
No runtime/versionprobe/install/desktop/Pi/stage/commit/push inthisphase.
Bothbuildandexport execsessions terminal. Next exactpinnedpackage native/
pixeladmission thenprospectiveV2OFF/ONbalancedcomparison, not transfer35.5%
resultfromhistoricalfullsizeOFF. Namedfailure/paritygaps remaininreport.
Final scoped docs lint0/diffcheck0 and previous238-file sealPASS. Newseal
artifacts/umbralink-control/integrated-import-candidate-final.sha256 verified
98files584969105B, SHAd6b33b8e374a0d81254d30662219dcd601d2f4d64b81ced3baadcc71ccc0f08d.
Excludes generatedPython__pycache__ and mutableDETAILS only. Package/report/
plan/newtests frozen; do not editsealedfiles. Allsessions terminal. Native
libxulSHAf447535fd1f0de74b35033282db9b0c3b5b065a34540c4259c37c272c4e13081;
exeSHA39c819f7d5af57fd4d93f8aa304c4ee368f6a4290d38427bf3ff30622afcd515.

## October 6 Fresh Balanced Confirmation Passed

Plan bot-docs/plans/balanced-import-confirmation.md; new evidence namespace
artifacts/umbralink-control/balanced-import-r2, frozen callback95-file harness
xHixG8/same R2 package. No runtime/native/default changes. Old165-file seal
rechecked; native16/runtime95/HEAD/staged/unstaged guards pass. Offline
confirmation-input.mjs has retained2 behavioral RED then3 GREEN tests; joins
actual preflight/modes/chronology/root/PIDs/package/cleanup. The new unpack is
byte-identical to frozen callback unpack; analyzer reuses frozen CPU/evaluator.

OFF1 epvQHU and ON1 ianxMo both terminal PASS with44 hashverified exports,
native owned-root/PID/build joins, all recorded PIDs absent, clean shutdown,
zero dropped log bytes and package postcheck. OFF1 CPU42.209s/48.213s,
ON1 CPU27.064s/48.093s. OFFinitialaccelerated/finalsoftware; ONbothaccelerated.
Both0 reported drops. The final sequence adds allfour terminalPASS: ON2 rk233Z
controller1398425/browser1398437; OFF2 HvpLJH controller1400883/browser1400895.
New sequence completed, all29 frozen numericalcriteria PASS, fixturePerformanceAccepted
true/generalPerformanceAccepted false. Rates OFF0.87546749/0.89118063;
ON0.56274927/0.56485304 CPU-s/elapsed-s, worstON35.4798% belowbetterOFF.
Allfour44files/14samples/12PIDsabsent/271Blog0drops/cleanSIGTERM/packagepostcheck,
176files1371284B total. BothONacceleratedbounds, bothOFFfinalsoftware.
ONhighcopy medians0(timerlimited)/P951ms; OFFmedians33-36/P9546-49ms.
Oldmetadatafailure notreproduced/unexplained and originalfailure unchanged.
New66combinedtestsPASS incl176-file savedreplay andincomplete/regressedrejects.
Report bot-docs/reports/performance/2026-10-06-balanced-confirmation.md.
No session/browser remains. No desktop/Pi/install/default/native/sourcechanges.
Next gate: source/provenance integration review of import recovery +dailyV2
scaledfallback, then exactintegratednative/pixel/parity/realisticoperation gates.
Do not deploy currentdiagnosticobjectdir or treat fullsizeOFF asdailybaseline.
Final docs lint0/explicitPrettier/diffcheckPASS; native16/runtime95/HEAD/staged/
unstaged and prior165-file seal unchanged. New frozen manifest
artifacts/umbralink-control/balanced-import-r2-final.sha256 verifies238files,
3467902B, SHA68af11effad3054102717f0d6ebc60534455952011fc6d213b649c5f3a7b3533.
All exec sessions terminal. Do not edit sealed files; next phase new namespace.

## October 6 Balanced Attempt Stopped, Diagnostic Complete

ONE callback-evidence OFF diagnostic terminal PASS, did NOT reproduce metadata
failure. Root7EYxZF, controller1389817/browser1389829;44files344018B hashverified,
12PIDs absent, cleanSIGTERM271B0drops,14resources peak147104344B,60025ms duration.
48s fourphases297/298/297/297 callbacks,0videoDrops. Nativeinitialaccelerated/
finalsoftware, actualprofileunchanged. Original bVSxIz staysFAILED; no balanced
sequence complete, exactfailedpredicate stillUNKNOWN. Report
bot-docs/reports/performance/2026-10-06-callback-evidence.md. All sessions gone.
Future fourarm sequence must be NEW evidence, keep failure-onlycollector and
predeclaredcriteria, do notcount diagnostic/pool oldruns. Current workingruntime
95files/native16/old150fileseal/staged+unstaged guards PASS. Final62tests PASS,
scoped docslint0/diffcheck0. No install/default.
Both phase artifacts/reports/plan now frozen under
artifacts/umbralink-control/callback-import-final.sha256:165files48780170B,
SHA1c1cb6d0aea9734efbc4efb27625574dc6f83673d274c9279e0ab76fa3e353d5.
No session remains active. Next safe action is a NEW prospective ABBA sequence
using already frozen callback harness xHixG8,95inputs/sameR2/15ssettle+preflight,
new local evidence namespace, unchanged thresholds. Do notcount diagnostic as
OFF1, do not rewrite either original failure or sealed code/report. Any recurrence
stops and new RVFC vector must be explained before changing metadata validity.

Failure-evidence follow-up: new callback-import siblings +callback-collector
retain EVERY prior predicate/success instruction. Only metadata throw adds
RVFC JSON array [phase,completedCallbacks,now,width,height,mediaTime,
lastMediaTime,expectedDisplayTime,presentedFrames,lastPresented]. Nonfinite
numbers string-tagged, otherinvalidtypes named; worstnumericpayload<=256 proved
through observer clipping +actual serializer.61combinedtests PASS (8new), AST
solethrow/capture/driver equivalence PASS.95runtimefiles frozen bundle
b33948547ccdadc06a95f00f5df4ead57fc0731b06d4815fb6ea47fdd4836da2;
fresh laptop callback-import-harness-20261006-xHixG8, transfer thenextraction/
15ssettlepreflight next. ONE OFF diagnostic only, no remainingABBAarms or native
changes. All prior predicate failures remainfailures; exactcause stillUNKNOWN.

First OFF bVSxIz FAILED Invalid sustained callback metadata near playback35.938392;
controller1384726/browser1384739, all12 recordedPIDs absent, cleanSIGTERM271B0drops,
package47files475120013B postcheckPASS.39exports133092B hashverified. No ON/second
OFF launched; four-arm sequence STOPPED. Exact failing values absent, page=null,
onlyinitialaccelerated snapshot; causeUNKNOWN, not proofvideo/fastpathbug. Stored
balanced-import/off-1 +rawexport+manifest unchanged. Report
bot-docs/reports/performance/2026-10-06-balanced-import.md. Next approved-by-plan
failure-only collector diagnostics in separate callback-import namespace; keep
all predicates/successpath/limits, solethrowchange AST proof, thenONE freshOFF.
All tool/browser sessions terminal; no arbitrary retry or relaxed acceptance.

Plan bot-docs/plans/balanced-import-playback.md. New balanced-import siblings
reuse exact sealed sustained collector/validator/statistics, only before/after
native queries, actual profile prefs, natural final software classification.
No sample listener/event or per-frame nativequery. 53 focused/integration/AST/
analyzer/prior-sustained/timeout tests PASS; final formatting completed; plan
lint0. Producer/consumer/capture/driver integration and real serializer tested.
Native16/currenttracked/staged/old84runtime guards PASS; old150-file provider
seal unchanged. New89-file runtime bundle SHA
27519bbf585d9cfa3bedc52732a0a0b114bfac2013327d105dc778b0ee9e6d4d.
Fresh laptop harness root ~/.cache/codex/balanced-import-harness-20261006-mD8ryB
created; transfer/extraction next, no balanced browser yet. Fixed same R2
package, 15s settle then preflight per arm; OFF1/ON1/ON2/OFF2 planned. Keep strict
120/220/240s capture/driver/SSH bounds and cleanup checks between arms. Preserve
earlier failed evidence. No native/default/daily desktop/install/commit/stage.
Analyzer tests caught an invalid synthetic P95<median input; corrected test to
valid slow distribution, validation unchanged. Prep source review caught a
mechanical count replacement in a hash BEFORE execution; now imports canonical
manifestSHA256 from admission module. No runtime/preparation retry involved.

## October 6 Provider Localization Outcome

Both planned captures are terminal PASS; all recorded owned PIDs absent.
ON1 root laptop-provider-import-on-20261006-ZENnwX, controller1378096/browser1378108:
27/27 in-playback samples accelerated, both boundaries accelerated; same actual
profile prefs, no overrides/drift. 44 files/351890 bytes hash-verified, 12 PIDs
absent, clean SIGTERM/271-byte log/0 drops, package postcheck PASS. OFF1 samples
1..9 accelerated, sample10 onward software/shared; callback10 began475ms into
phase, not exact native transition time or cause. Early one-way fallback is NOT
reproduction of owner's later smooth/stutter cycling. No forced acceleration.

Report bot-docs/reports/performance/2026-10-06-provider-import.md; comparison.json
explicit performanceAccepted:false. Descriptive OFF/ON summed CPU42.034/27.255
CPU-seconds over48.239/48.105s; RDD20.662/2.084, browser14.008/19.541 (higherON).
Four-copy batch medians34/35ms versus0/0 (below timer resolution, not GPUtime).
One instrumented pair, not accepted speedup or YouTube proof. Full-size R2 OFF
is not daily V2 scaled-fallback baseline; deployment/parity/failure gates remain.
Final54 combined tests PASS, including26provider tests, saved-native replay and
corruption, prior sustained and timeout regressions. No runtime/session remains;
no desktop/native/default/install/stage/commit changes in this phase. Next
separate phase: balanced minimal-observer same-R2 OFF/ON/ON/OFF, preserve old
strict failures and all seals. Do not rerun exclusive prepare/unpack/analyze
outputs in place. Final docs lint0/diffcheck0; native16/runtime84/HEAD/staged and
unstaged guards PASS; old218-file sustained seal unchanged. New manifest
artifacts/umbralink-control/provider-import-final.sha256 verifies150 files,
25559971 bytes; SHA e7f78ae79f0aaa98cf3dbac589a1bad7af811ac904454da90fd32e0ca7225418.
Phase report/plan/evidence now frozen; use new sibling namespace for next work.

### Localization Execution History

Plan bot-docs/plans/provider-import-localization.md; new sibling provider-import
workload/capture/driver/preflight/export. No native/shared helper changes.
25focusedtests PASS: ASTcollector differs ONLY postdraw sampleevent, capture
onlyimport/mode/summaryfields, driver/preflight/export onlyowned namespace.
First24callbacks +firsteachphase <=27 samples; all getDebugInfo(false), after
existingdraw timing. Existing before/after false/true unchanged. Actual profile
prefs before/after stable; software is explicit newdiagnostic result, not error.
Original sustained phase seal unchanged. New84runtimebundle SHA715aafed396088b9c6daa67c24ace73ca5279b0a3d7d4a752f7151e1aa786d92;
remote ~/.cache/codex/provider-import-harness-20261006-6BXaXD withsameR2package.
Extraction first stopped preextract: allowlist omitted existing
dom/media/test/vp9.webm. Corrected exactpath, hashchecks repeated; no launch then.
Owned extractedinstallation chmod0700; remote-extraction-corrected.json retained.

OFF1 PASS root laptop-provider-import-off-20261006-1zwXbo, controller1375346/
browser1375358. 44files352961B hashverified and12PIDs absent, cleanSIGTERM0drops,
packagepostcheckPASS. Samples1..9 accelerated; callback10software/shared,
11..24 andlaterphasefirst samples software. Initialtrue/finalfalse.
Actual profileframes10/fallbackratio0.3000000119/cachemissratio0.6600000262,
alluserflagsfalse; queryelapsedall0 (belowtimerresolution, notfree). Nativeframe
counter !=callbackordinal, consistencyonlynotcause. Pref unchanged. Saved
provider-import/off-1 data; firstofflineunpack assertion erroneously expected
passed vsproducerpass; no fileswritten then, retainederrorlog and corrected
unpack.mjs. ONpreflight completednext; subsequent ON outcome is above. No repeat
balanced/observer-free performance acceptance, no desktop/install/defaultaction.

## October 6 Sustained Import Exploratory Outcome

All three captures terminal; no owned browser/controller remains. Revised OFF
DXt1ae (1363605/1363617) completed48s but final ensured provider software/shared;
initial accelerated. ON fttkzO (1366494/1366506), same frozen bundle/package,
accelerated at both boundaries; failed bad PTS<=pausedCurrentTime assertion
(48 vs47.99629). Upstream producer/spec establishes different clocks; current
validator removed that relation, retains finite/nonnegative/ordered/<90s bounds.
Saved ON replay passes, OFF still fails acceleration gate; ALL original reports
remain FAILED. No balanced speed acceptance. First OFF xgVrMh preserved separate.

Report bot-docs/reports/performance/2026-10-06-sustained-import.md; comparison
artifacts/umbralink-control/sustained-import-r2/comparison.json explicitly false.
Four-copy median OFF37/38ms vs ON0/0 (below timer resolution), P9550/55 vs1/1.
CPU48.137/48.126s windows: sum42.482/26.936 CPU-s; RDD21.101/2.029;
browser13.995/19.372 (higher ON), web7.187/5.294. Exploratory singlepair, no causal
GPU/per-copy/YouTube/scanout claim. Both0videoDrops, callbackcounts notframedrops.
Final-only getDebugInfo(true) can borrow/recreate target; no transitiontime proof.
Existing usage-profile refresh/demotion is one source-supported candidate among
allocation/context/other fallback routes, actualtrigger unknown. Do notforceGPU.

Both41-file exports hashverified (324687/325970B),12recordedPIDs absent/arm,
cleanSIGTERM271Blog0drops,13samples each, package46files+emptylock47count.
Nativeownedroots/buildID join; not earlier/no-network isolationproof.
Analysis-first.log preserved wrong nonexistent verifiedFiles46 assertion;
corrected to actual47incllock/status/bytes/emptylock verifier contract.
Saved CPU/replay3testsPASS inclcorruption. Final28focusedPASS, exacttooling/docs
lint0, formatting/diffcheckPASS. Native16/runtime78/head/staged+unstaged guards
PASS; previous112filepixelsealunchanged. New sustained-import-final.sha256
verified218files50293584B, SHA8b22eec382cb1c211fc174ba78b1f9b3ccd5b26a7064e3e61f482ea378aae381.
All tool/test/runtime sessions terminal; evidence/report now frozen. Nextphase
must use new sibling namespace and keep failed reports/this seal unchanged.

Revised runtime bundle79files remote
~/.cache/codex/sustained-import-harness-20261006-m9AkHg SHA68225132ffb17461bbbf013607c9f5029ec9f6f344e3da3e17cd5c08b8b969ff.
before-media-time.mjs is exact runtime source045b7254...; current local module
has later clock/negativePTS fix and requires new frozen bundle before runtime.
Production edit only Node helper explicitreplytimeout (default15s unchanged).
Native/index/desktop/defaults unchanged. Next separate provider-phase
classification observer then balancedrepeats; broader goal remains ACTIVE.

### Prior Work Log (Superseded By Outcome Above)

First laptop OFF xgVrMh completed48s but FAILED final debug target query.
Raw41files326653B preserved under sustained-import/off-1; controller1358933,
browser1358945 and all12recordedPIDs verifiedabsent, cleanSIGTERM271Blog0drops,
46filepostcheck. No target afterpresentation is source-supported normal
ReturnTarget(mTarget.forget) state, not proofcanvasfailure. New final-only
getDebugInfo(true) outside timedloop explicitlyreceipted ensureTarget; initial
remainsfalse. BehavioralRED then24focusedGREEN. New79filebundle r2 SHA
68225132ffb17461bbbf013607c9f5029ec9f6f344e3da3e17cd5c08b8b969ff,
remote fresh ...sustained-import-harness-20261006-m9AkHg transfer inprogress.
Original ...rXaBbF bundle retained. No ON or correctedOFF yet.
Also fixed Node helper transport15s deadline via explicit1..60000thirdrequest
arg, default15s preserved. RED late48sreply/invalidbounds/capturedispatch;
301existingtooling PASS, exact2filelint0; originalhelper reverseSHA verified,
other73oldharness/native16/unstageddiffexcludinghelper/stageddiff unchanged.
Initial guard wrongly compared diffHEAD with unstagedbaseline, corrected to
same gitdiff--binary; no source drift. Newtest firstRED had missingfakeclock
advance and hit10swatchdog; correctedRED preserved separately, not producthang.

Plan bot-docs/plans/sustained-import-playback.md. New diagnostic-only
sustained-import.mjs/capture plus focused VM/bridge/capture tests; first combined
15 PASS in sustained-import-all-first.log. No new browser run yet. One320x180
default canvas, continuous48s1/4/4/1copies, bounded1536five-number tuples,
no per-frame readback/hash. Private existing provider snapshots before/after;
page54s/bridge57s/request59s/capture120s. Float early-wake defect reproduced and
fixed with elapsed comparison, not a tolerance. Adding real serializer max-cap
and driver AST tests before same corrected R2 OFF/ON/ON/OFF laptop captures.
Daily browser/native/defaults/index and old sealed evidence untouched.
Newest owner status request answered: pixel correctness passed, sustained
speedup not measured. Goal remains active. New driver/preflight/export reuse
previous fixed R2 admission; AST tests prove namespace/capture-only changes.
Driver RED3expected failures; final20 focused tests PASS after exact10-file
Prettier formatting. Actual local control serializer accepts maximum1536tuple
bundle, rejects overflow; missing-frame/quantile semantics also tested.
Logs sustained-import-{driver-red,green,format,final-tests}.log. No test session
remains running. Next: guard previous74 harness/native16/fulltracked/staged
hashes, freeze new runtime bundle, transfer to a new private laptop root,
preflight then firstOFF functional capture. None performed yet; no speed claim.

## October 6 Corrected Import Pixel Gate Complete

New corrected R2 same-build OFF/ON48orderedhashes exact, all4retainedRGBA
buffers byteexact, repeatsstable. comparison.json plus report
bot-docs/reports/performance/2026-10-06-import-recovery-pixels.md.
OFF root laptop-import-recovery-pixels-off-20261006-DMuUya, controller1347221/
browser1347233,16.787s; ON ...on-20261006-jQlAEz controller1350117/browser1350129,
16.352s. Both PASS,6resource samples,peak65.1MB,cleanSIGTERM/271Blog/0drops,
46fileinstallationpostcheck. 12recordedPIDs/arm explicitlyabsent. 38exports/arm
1386918/1386890B hashverified, no privateprofile/token/appdatacontents exported.
Native receipts confirm actual070020 BuildID/PID/private roots, poststartup only.
26focusedtests PASS incladmission,ASTequivalence,validation,negative savedreplay.
No compile/profiler/default/native/install/desktop actions. Old70runtimeinputs
unchanged;16native/fulltracked/staged guards retained; new74fileharness.
All runtime/copy/test sessions terminal0. Final6fileformat/docs lint0,
16native/fulltracked/staged/74harness guards PASS; priorpackage sealunchanged.
New import-recovery-pixels-final.sha256 verified112files29408718B, SHA
b06a64b633a42d75571ca9caabd3dbc37521725b535c93c6cbdfa076fb4dd1e2.
Phase evidence/report/plan now frozen; next work uses new siblings.
Next prioritize sustained alternating OFF/ON SAME R2 package (not old V2/source).
Existing moving-copy workload is110x75/willReadFrequently+perdrawread/hash:
do not call it representative accelerated drawImage. New owned local workload
should use ordinary320x180canvas, no perframepixelread, bounded rVFC measurement
and equal observer cost. Existing ControlScript timeout1..60000ms, capturework
105s/total120s; serializeScriptValue caps10000nodes/1MiB, so naive1440frames
x8fields exceeds nodecap. Fit within bounds, no controlAPI edits. Existing
canvas-large/linear-pixels private event observer samples backendType/
drawTargetType/isAccelerated without publicAPI. Hardware flags/prefs
alone do not prove eachdraw fastpath. Native loss/modifier/OOM gaps remain.

### Capture History

Plan bot-docs/plans/import-recovery-pixels.md. New4 runtime siblings plus spec;
old70 harness inputs byteunchanged, new74file bundle. RED3expectedfail, GREEN25
focused tests, exact5file Prettier PASS. Native16/alltracked/staged unchanged.
Corrected R2 package seal rechecked. Package/harness copied+hashverified to
wyatt-laptop:~/.cache/codex/import-recovery-pixels-harness-20261006-ZzDIUx.
Package root0700; extraction and remote preflight29181 passed.
Exactly oneOFF+oneON performed, existing linear pixel
collector unchanged, capture120s/controller220/SSH240s, no profiler/dailyinstall.
Local cargo scan caught AeorDB test1458338 on desktop, not Umbrafox compiler;
left untouched, recorded local-compiler-inspection.json. Laptop alone is runtime
target and requires no detected browser/build activity. Do not stop other work.
Evidence artifacts/umbralink-control/import-recovery-pixels/. NewpackageID
20261006070020, manifest21178496..., bothmodesonly admitted. Old frozen reports
and package gates unchanged. Need collect actual terminal/PID/native receipts,
export bounded diagnostics only, compare48hashes+4lineararrays then sustained.

## October 6 Import Playback Candidate Build Complete

R2 package PASS, source RESTORED, no runtime/install. Export
exports/umbrafox-import-recovery-20261006-r2/; archive107785736B SHA
7f6c660bace67c486c4817f87811ee7cadef95f2fbce1bb472b573e7334f0dd3;
manifest21178496e1612b579e18b6234bff4a052bbe229cb7c861872c713e11cb89c99f.
46files475120013B,57tarentries; both INIs and embedded ELF toolkit ID070020
agree. Actual installation admission PASS46/private0700. R2 only libxul differs
from rejected first export; librarySHA d66f112c398106f1fd0248b6c6dea0f3daff7c7844b585859c0ed8b98a5b7d28.
Package62927 terminal successful97s/0warnings; export71246 terminal0. Previous
PTY handle expired at resume, authoritative completed log checked, not rerun.
Restoration-r2.json proves16source/alltracked/staged byteexact to before;
objectdir STILL corrected full-size diagnostic, working source again V2.
6BuildIDtests,9archivehelpers,10sourcecontracts PASS; exactPython direct Ruff
and formatting checks follow mach lint (ignored artifact paths checked directly).
Report bot-docs/reports/performance/2026-10-06-import-playback-candidate.md.
Final seal import-playback-candidate-final.sha256 verified174files1168853079B,
SHA b48ceb0f6655edf570a26ec983db4aeacfee82f231faa115e9d1a05241d3ffe9.
Direct4fileRuff+format PASS, docs lint0, diffcheck0; final6BuildIDtests PASS
and actual R2 nativeID accepted after formatting. All command sessions terminal.
First rejected export and new accepted R2 are both sealed, evidence immutable;
follow-up uses new siblings. No browser/SSH/profiler/native runtime this phase.
Next new pinned laptop OFF/ON pixel gate then sustained alternating playback.
Do not reuse older pixel verdict or broaden desktop install/browser authority.

### Preserved Build History

Active goal continuation. Plan bot-docs/plans/import-playback-candidate.md.
Evidence artifacts/umbralink-control/import-playback-candidate/. Exact temporary
Canvas2D full-size delta was APPLIED (SHA3f2a75fa...), original V2 source
before.cpp/before.json preserved (SHA50bd5080...). Other24source hashes and
12untracked inputs preserved; staged patch unchanged. Existing live-reference
test RED1PASS3FAIL -> source/native-contract GREEN10PASS. Build98443 PASS57s,
package89324 PASS97s, both0warnings. First export archive/INI checks passed BUT
native ELF toolkit note old20261006052600 vs INIs20261006070020: HOLD.md added,
no launch. Source first restoration proved exact then same temporary delta
REAPPLIED for repair. Ordinary binaries pass55563 PASS12s refreshed normal
generator (no stamp removal/buildsystem edit). Native gate now rejects old
export and accepts actualnewlibxul;4initialparser testsPASS. R2 packaging62927
used date20261006070020, CARGO2/XZ2, timeout600 ./mach build -j2 package --priority idle.
Preflight48.2GBavailable/79.3GBdisk/no compiler. No runtime/install/desktop work.
R2 package finished; package-export-r2.py ran via machpython build virtualenv.
New self-contained export is exports/umbrafox-import-recovery-20261006-r2,
with embeddednative-ID check added, oldfailed export immutable. No pyelftools
installed (unavailable); verified GNU readelf note strings parser used.
Guarded exactreference bytes and reversed ONLY temporaryCanvas2D delta with
apply_patch. Compared complete tracked/staged patch to before snapshots. Other
native import-failure changes MUST remain. Objectdir will remain diagnostic
full-size source despite restored V2 working source; do not install/repackage
as ordinary candidate. Context-loss/native validDMAbuf reuse remain gaps; new
package is defaultOFF isolated diagnostic for prospective pixels/playback.

## October 6 Native Import Failure Gate

Plan: `bot-docs/plans/canvas-import-failure.md`; evidence under
`artifacts/umbralink-control/import-safety/`. Laptop native RED now reproduced:
13 executed, 2 importer failures/11 passes/0 skips. Unusable descriptors publish
surfaces; repeated test does so 16 times. Raw receipts/results/logs copied to
`laptop-red-3/`; controller1321836/browser1321848/probe1321850 absent. First local
run skipped all13. First laptop bundle lacked dependentlibs.list.gtest; next
admission caught copied mode0664 instead of0644 before launch. Loader list added,
48file diagnostic bundle verified. These are not performance results.

Final correction implemented in9productionfiles: bool native TexImage result,
default-false internal descriptor recovery; SharedContextWebgl optional bool
defaultsfalse and only DMABuf candidate passestrue. Ordinary external-canvas
behavior retained/tested, no new hot GPU waits. Host/IPDL byte-identical.
Final binaries build3958 PASS432s/0warnings; gtest relink84376 PASS17s/0warnings.
Current objectdir IS corrected V2 working source, NOT frozen full-size reference.
Intermediate broader draft compiled but never executed/installed.

Native GREEN86744 exit0:17PASS0skip (4importer+13uploadinit), actual failed-import
regressions now pass. Fresh harness canvas-import-gtest-harness-20261006-Rs7yRr;
run canvas-import-green-f0ecbab3-269f-4285-b66a-502dba06a0fd. Controller1335599,
native1335611, probe1335613 independently absent. 6235Blog, cleanexit0,
48file833449280B postcheck. Exports laptop-green-1 match remotehashes.
GTest still prints headless despiteDISPLAY:0; no hardware/decoder/playbackclaim.
Six source/harness testsPASS, exact12filelint0, stagedpatchbyteunchanged.
after.json16sourcehashes/actualcopies frozen. GREENtestlibSHA8a934a44...;
manifestSHA6ac3f4b1...; compatibilitydate20261006052600. Reference loader + new
testlib is diagnostic ONLY, not a new package or repeat pixel acceptance.

Report bot-docs/reports/performance/2026-10-06-canvas-import-failure.md.
Gaps: actualvalidDMABuf afterpooledfailure, contextloss injection, driverOOM/FBO/
modifierfailure, end-to-end translatorfallback, newcandidate pixel/playback.
No default/pref/installation/desktop/profile changes. OriginalREDbundle
canvas-import-gtest-harness-20261006-8e8JzG retained, oldfailures untouched.
Next: useful native failure/lifecycle gates then explicitly sourced freshpackage
and sustained alternating video. Avoid redundant paused-only matrices.
Final seal import-safety-final.sha256 verified:159files719433659B,
SHA3de895a46d0e926d43ecae42cc70f4ab9572c32376e5f180db23cdddbc727fb8.
Prior fullsize-import-parity seal rechecked unchanged. Docs lint0; all build,
copy, test and verification sessions terminal. Phase artifacts/report frozen;
new follow-up uses new evidence siblings. Broader performance goal ACTIVE.

## October 6 Same-Build Full-Size Import Parity

Latest owner status answered while active performance goal continues. Report
`bot-docs/reports/performance/2026-10-06-fullsize-import-parity.md`; plan
`bot-docs/plans/fullsize-import-parity.md`. Same reference package BuildID
20261006052600, OFF baseline plus new ON: all48 ordered hashes exact, all
repeats stable, four retained linearRGBA arrays byte-identical. No tolerance
or omitted cases. Resolves scoped pixel blocker after V2 sized-readback removal,
NOT whole Firefox equivalence, per-draw import proof or playback speedup.
Raw reports still pixelEquivalenceAccepted=false; do not rewrite them.

Only new ON admission/driver/support/test siblings, original collector unchanged.
BehavioralRED1PASS1FAIL; final68focusedtestsPASS2.96s including actual filesystem
admission regressions, AST permitted-delta checks and saved replay negatives.
Exact5fileformat and docs lint PASS. New preflight invokes real installation
admission to catch 0700/root-identity errors before runtime. Native13 and
70harness files unchanged. Staged patchSHA3b78253c... and full tracked
patchSHAbeb57268... match baseline. Initial resumed guard incorrectly compared
binary Git index against staged-diff hash; corrected byte comparison against
sealed before-index.patch passes. No staging/index/reset actions performed.

Remote harness fullsize-import-parity-harness-20261006-smhwQK; runroot
laptop-fullsize-import-parity-on-20261006-6UF2Wj, controller1304474/browser1304486.
16.278s,38exports1386847B,6resource samples,peak65069045B,cleanSIGTERM,
rootAbsenttrue,271Blog0drops,46packagepostcheckPASS. All12recordedPIDs absent;
poststartup native receipts only. No compiler/profiler/desktop interaction.
Capture38293/export71793/tests83513/doclint15380 allterminal0.

Final seal `artifacts/umbralink-control/fullsize-import-parity-final.sha256`:
63files26173241B, SHAd4e6d8464482ffc887fcfe450106dd05039dd035ef7e229f0d1bb3f7ce57f0fc.
Verified; previous fullsize-reference157file seal also rechecked. New siblings,
plan/report/tests/evidence frozen. No native/default/install changes; objdir
STILL reference binary despite restored V2 working source. Never install as a
normal working-tree package without rebuild.

Next: native import-failure/context-loss producer-to-consumer review then
sustained alternating playback. Do not accumulate redundant paused matrices.
`artifacts/umbralink-control/import-safety/upstream-import.log` is source search
only, not yet a validated finding. Inspect SharedContextWebgl::ImportSurfaceDescriptor,
TexUnpackSurface::BlitSd/TexOrSubImage and CanvasTranslator fallback before any
native change. No safety tests or new native changes yet. Goal ACTIVE.

## October 6 Full-Size Reference Capture

Active performance goal continues. New report:
`bot-docs/reports/performance/2026-10-06-fullsize-reference.md`; plan
`bot-docs/plans/fullsize-reference.md`. Temporary ONE-file canvas delta removed
V2 deferred/sized readback and restored pinned upstream HTML video branch,
retaining import/VideoFrame paths/default OFF and all other work. Source RED
2PASS/2FAIL, then exact-region proof; compiled admission 5PASS. Build66s and
package94s PASS0warnings, fixed Build20261006052600, max2jobs/idle. Native13,
untracked11, full tracked patch and staged index guarded.

Export `exports/umbrafox-fullsize-reference-20261006/` has archive107784404B
SHA327a2999eb6bd8d17b539ada9460e37a3e34f18bb1af5ffe23fc27781d3ada2e,
manifest350dd9dbacb579380ed57d84f9fb3d35e5b8b0514b07725baddc51d10bd22814,
46 verified regular files, both INIs/runtime BuildID match20261006052600.
Complete tracked delta + existing untracked source archive included.
Reference canvas SHA3f2a75fab4d78e0d1c406d999ae81beead9af67af09e2b9fc41a8323fc583a14.
Temporary source edit RESTORED via guarded apply_patch: original50bd5080...,
trackedpatchbeb57268... and index3b78253c... exact. IMPORTANT objdir still
contains REFERENCE binary, not restored working source; do NOT install/repackage
as normal candidate. Export is diagnostic only, no installation/default change.

New admission/driver plus preflight/export siblings reuse exact linear capture
and collector. Runtime harness66files. OFF-only admission, old seals untouched.
Final90focusedtestsPASS7.10s including saved replay, AST operation equivalence,
new package/host/display/mode rejection, original V2 regressions afterrestore.
Reference-source test defaults saved reference.cpp; FULLSIZE_REFERENCE_LIVE=1
was checked before restoration. Never claim current tree is reference source.

First driver aK8Dem failed PRELAUNCH because extracted package root0755, not
required0700; browserPIDnull, onlydriverfile, controller1294520absent. Preserved
failed-prelaunch-1.json/off-1.log. Only owned pristine package root chmod700;
real admitInstallation and full new preflight PASS before a fresh run.
Successful root laptop-fullsize-reference-off-20261006-oBCin4, harness
fullsize-reference-harness-20261006-AToRZs. Controller1298071/browser1298102,
16.872s;38exports1386840B,6resourcesamples,peak65093721B; cleanSIGTERM,
rootAbsenttrue,271Blog/0drops,46filepostcheck. All12recordedPIDs absent.
Post-startup owned-root receipts only, no no-earlier-access/network proof.
Runtime21665/export21081/build22096/package5743/tests87309 terminal0.

KEY RESULT: referenceOFF matches previous importON in44/48 hashes and exact
linearRGBA in all4 raw arrays. Remaining4 = explicit readback bothrepeats/both
times. Reference vs oldV2OFF differs22/48 (prior18 plus4readback); linear
3575/3157changedpixels max94/100 reproduced. Reference repeats allstable.
Supports V2 scaling as mismatch source, not direct-import being wrong. Filter
code unchanged but repeat instability absent; surrounding path/lifetime effects
not directly traced. Source-route reference, NOT whole stock Firefox parity or
YouTube/performance verdict. Current candidateON still usesV2 software readback.

Next useful gate: a NEW pinned ON-admission sibling for this same reference
package, same48matrix, no newnativebuild. Current OFF-only driver staysfrozen.
Then failure/context-loss and sustained alternating moving-video trials.
No ownedbrowser/profiler/compiler sessions remain from this phase; desktop
daily browser/profile/launcher untouched. Broad goal ACTIVE, not complete.
Final seal `artifacts/umbralink-control/fullsize-reference-final.sha256` verified:
157 files,611766728B, SHA70cb495d4d0d99bdd68b8f83e0590b9681271974dee51a20e156bcd4fc9612ff.
New reference artifacts/export/plan/report/tests now frozen; next ON uses new
siblings. Final docs/format clean; all sessions terminal. Package comparison:
40/46 files unchanged; changed INIs/executable pair/libxul/omni. All2676 omni
payloads checked: only AppConstants changed, exact single BuildID substitution.

## October 6 Linear Raw Pixels And Reference Correction

Active performance goal progressed through oneOFF+oneON fresh laptop run.
New report bot-docs/reports/performance/2026-10-06-linear-import-pixels.md;
plan bot-docs/plans/linear-import-pixels.md. New3 runtime siblings+spec; old
ordered/blur source/evidence untouched. Collector differs only rawretention
filter->linear, exactASTtest; capture/driver operationASTchecks too.
BehavioralRED captured missinglinearbytes; final81testsPASS6.89s including
savedrealreplay. Both0.5/2s matrices match prior48hashes each (OFF matchesboth).
Same18relative mismatches. Rawlinear3575pixels/7860components/max94/total45640
at0.5s,3157/7201/max100/total66314at2s;repeatsidentical,noalphadiff.
This is NOT mere1levelblurrounding. WholeRGBA/hash/length proof + independent
scalar counts/max/sum/bbox/histogram in linear-pixels/linear-differences.json.

CRITICAL referencecorrection: OFFcontainsV2 and isnotstockFirefoxoracle.
Do not forceGPUoutputtomatchV2 withoutproperreference. Historicalupstream
08a61e1a51dbb4dbff0bb8e9ef97ad19c3afb156(secondparentof2dea4d merge) has
DMABufrejection thenfullsize GetAsSourceSurface(), no destinationreadback.
ExactCanvas2D+nsLayoutUtils blobs saved/hashes upstream-reference.json.
Supports V2conversion/scalingorderlead; no nativebranch/correspondingbinary
pixelproof yet. ONlinear==OFFVideoFrame/shadow; OFFlinear==OFFreadback still.
Next: correspondingFirefox/source-equivalentfullsizereference, notmoreblur
controls orpixel-tolerancewaiver. Referencebuild needsboundedexplicitminimal
delta/provenance; nativefailure/contextloss+movingperfstillowed.

Harness linear-pixels-harness-20261006-vv0Egr,62harness/46packagepreflight
each,46installpostchecks. Runroots laptop-linear-pixels-off-20261006-eLkE9u
(ctrl1284000/browser1284015) andon-20261006-jlBUX8(ctrl1286283/browser1286315).
16.615/16.232s,6resourcesamples,peak65150845/65093115B;38exports each,
1386821/1386665B. Allcapture/exportexit0/cleanSIGTERM/rootAbsenttrue,
271Blog0drops,24recordedPIDsabsent. No ownedbrowser/profiler/compilerlive.
Sessions55839/49889 andexports51139/71156 terminal0; test17236exit0.
Native13/harness62/index3b78253c unchanged; no native/public-API/default/install/
desktop/staging/commit changes. Artifacts codeonlynewdiagnostic siblings.
One read-only inspection guessed resource0 filename andgotENOENT; real files
enumeratedfor6samples, no rerun/browserdefectinferred. Exactdoclint0 andformat
PASS; priorordered160file sealrecheckedPASS. New linear-pixels-final.sha256
verified116files30120525B SHA
077d4f038dde9908e3132c27f1d768de99f1283dad738460523317cc90598040.
Allnewruntimefixtures/test/report/plan/evidence frozen. Finalverification.json
hascommands/guards. No neededcommandstillrunning; doclint43130exit0.

## October 6 Ordered OFF/OFF/ON Pixel Diagnostic

Latest owner status answered; active performance goal continues, not completed.
Report bot-docs/reports/performance/2026-10-06-ordered-import-pixels.md;
plan bot-docs/plans/ordered-import-pixels.md. New ordered-pixels validator,
capture/driver/spec siblings preserve old seals and strict original pixel gate.
69 focused tests PASS, including saved-evidence replay; final-tests.log in
artifacts/umbralink-control/ordered-pixels/. Two actual behavioral REDs fixed.

OFF1/OFF2 all48 ordered hashes exact at0.5/2s; ON differs18/48 vs both.
Linear/odd/nearest/alpha bothrepeats andfilter repeat1 differ at bothtimes.
Remaining30 match. Filter rawdiff11components at0.5,R4G4B3A0;3at2,R1G2B0A0;
max1. Other mismatches hash-only, magnitude UNKNOWN. ON withinrun pairs stable;
OFF filter unstable. Relative parity FAIL, not crash/instability acceptance.
At bothtimes ONlinear==OFFshadow==OFFVideoFrame; OFFlinear==OFFreadback.
Consistent with V2 destination-sized conversion versus fullsize thenresize,
not nativeexecution proof or YouTube stutter cause. Nearest case sets smoothing
false but actual bothdimension downscale source selectsLINEAR, notPOINTproof.
Next bounded rawlinear/source-order localization; candidateOFF/uninstalled.
No desktop/browser/profile/install/index/native changes. No speedupclaim.

Remote harness ordered-pixels-harness-20261006-Mx5MAO,57harness/46package
prechecks each;46installpostchecks. Roots off-EQW1gZ/off-w1YWYR/on-qdbJEM,
controllers1272775/1275059/1277352,browsers1272787/1275071/1277364.
16.561/16.586/16.454s,6resourcesamples each,peakartifact~65MB.
Allcapture/exportexit0,cleanSIGTERM/rootAbsenttrue,271Blog0drops;
36recordedPIDsabsent. Freshprivate roots; poststartup native joins only.
No owned browser/profiler/compiler active from these captures.

IMPORTANT formatting correction: earlier artifact Prettier without
--ignore-path /dev/null skipped ignored files, so old formatPASS is not proof.
Oldseals retained; new4fixture/spec actuallyformatted. Two support scripts
formatted aftercaptures, exactoriginals preserved in *-captured.mjs/archive;
55current+2captured manifest guards, AST equivalence separately. Do not claim
57currentbytehashes identical. Finalverification PASS:13native,55current+
2capturedharness/AST,115exportfiles,69tests,exact6fileformat,docslint0,
index3b78253cf775a4a1e8c69a4b82cc3958b366056129a391f4ae362bdfe8e4e0c4.
Prior104fileblur-source seal recheckedPASS. New ordered-pixels-final.sha256
verified160files32704012B SHA
0780eb15f57342c6009beaa723565111c7f19672d67293638e6966ff17b9d413.
Allcurrentorderedfixture/test/plan/report/evidence nowfrozen; nextstep siblings
or explicitly preserved revisions. Testsummary69PASS/0fail/7.24s recovered;
docslint session82237 exited0. No needed command remains running.

## October 6 Blur Source Lifetime Diagnostic

Newest owner status request answered while continuing active performance goal.
New report bot-docs/reports/performance/2026-10-06-blur-source-lifetime.md;
plan bot-docs/plans/blur-source-lifetime.md. New artifact siblings
blur-source.mjs, canvas-matrix.mjs, laptop-blur-source.mjs and matching spec.
63 combined tests PASS; behavioral request-target and unawaited-validator REDs
preserved then corrected. Previous sealed fixtures untouched; native candidate
OFF/uninstalled, no desktop browser interaction, no staging/commit.

Two real OFF matrices: seed3a9b9a5b... identical before/after every source use.
Shared/fresh canvases and shared raw-RGBA VideoFrames repeat identically;
fresh raw-RGBA VideoFrames change11pixels/11components(R4G4B3A0),maxdelta1.
All4 explicit-readback pairs0diff. Fresh frame output hashes6f8c8904... and
122ac539... EXACTLY match prior video blur. All16hashes+8differences match
between runs. Default targets accelerated, readbacknot. Identical inputbytes
do not guarantee outputrepeat; excludes advancing playback as a necessary
condition for this pattern, not exact native cause/stutter attribution.
Raw target buffers not retained in this experiment; bounded page differences
validated but not independently recomputed from bytes. Lifetime/caching/order/
allocation confounds remain. Consider reordered frame matrix or narrow native
observation; original strictpixelgate/frame2/ON/failure/contextloss/timing owed.

Harness ~/.cache/codex/blur-source-harness-20261006-rLffAK on laptop;
52harness/46package files verified beforeeach, installations verified after.
Captures laptop-blur-source-20261006-ndbjOQ ctrl1264550/browser1264562 and
-HheCeS ctrl1266836/browser1266848.14.163/14.002s;35files134054/134069B;
5samples each, peakartifact63838359/63838717B. Bothexit0/cleanSIGTERM/
rootAbsenttrue/271Blog0drops; all24recordedPIDs absent in exports.
Native ownedroot receiptjoins verified. No owned runtime currentlyactive.
Sessions98480/15132 and exports35858 terminal. Test60035 exit0.
Artifacts blur-source/{off-1,off-2,recomputed.json,verification.json}; newseal
blur-source-final.sha256. Broad performance goal ACTIVE, not completed.
Final seal verified104files23584025B, SHA30579de1b7ce5a853308f9b368e03abe4320466d2e8cfc70058ac74f7dd6dbc8.
13native/52harness guards PASS; old99file seal PASS; docs lint0, finalformatPASS.
Index byte-identical to prior frozen patch using git diff --cached --binary;
initial --full-index false alarm only changed abbreviation formatting. Report,
plan, fixture and evidence now sealed; use new siblings for subsequent work.

## October 6 Blur Source Controls Complete As Diagnostics

Goal turn progressed through new bounded fixture +two real OFF captures.
Report bot-docs/reports/performance/2026-10-06-blur-controls.md; plan
bot-docs/plans/blur-controls.md. New artifact siblings blur-controls.mjs,
blur-controls-capture.mjs,laptop-blur-controls.mjs,test/blur-controls-spec.mjs.
Existing helpers/source and pixel failures unchanged; candidate OFF/uninstalled.
57focusedtestsPASS(~6.9s), behavioral malformed max-vs-total RED then corrected;
initial RED/first log were test syntax failure, not browser defect evidence.

Two12pair matrices at paused0.5s: default unfilteredvideo0diff,blurvideo11,
frozenVideoFrame15,sharedraster0,sharedsynthetic0,lateblurvideo11 changedpixels.
All changedcomponents maxdelta1, noalpha. All6 explicitreadback pairs0diff.
Default targets accelerated, readbacknot. All24 SHA +12 differences +2 fixed
sourcehashes exactlyrepeat across runs. Not pixel-equivalence/performance PASS.
Next falsifier: fresh identical raster inputs versus shared input, separating
source lifetime/cache/allocation from video format. Native exactcause unknown;
no blanket shader/warmup/rounding claim. Source filteredDrawImage excludes new
descriptor/deferred path; no measured native branch counters.13nativehashesPASS.

Remote harness blur-controls-harness-20261006-q9Wrzp,49files/46packagehashPASS;
captures laptop-blur-controls-20261006-AgcWrp ctrl1248719/browser1248773 and
-rwYDkj ctrl1251743/browser1251756. Both controllerexit0,cleanSIGTERM,
rootAbsenttrue/271Blog0drops; all24recordedPIDs absent in owned exports.
14.519/14.459s,5samples each,peakartifacts64461242/64460736B.
Local artifacts/umbralink-control/blur-controls/{off-1,off-2}/ plus exports and
recomputed.json; each35files758408/758425B transferred/hashverified.
Sessions17437/28574 and exports terminal. No current owned runtime; desktop
browser untouched; index3b78253c... unchanged. Broad performance goal ACTIVE.
Strict originalpixelgate/contextloss/importfailure/ON/timing still owed.
Seal blur-controls-final.sha256 verified99files26727573B, SHA
491db520d80b49fec24529b4b895778aa9b7612bcbe363ae73a573b6af7ab6cd.
Current fixture/report/plan/tests/evidence frozen; next controls use siblings
or explicitly preserved revisions. This diagnostic completion does not clear
the original pixel acceptance or general performance goal.

## October 6 DMABuf Pixel Gate: Baseline Variation

Latest status request answered after reacquiring OFF3 evidence; no new browser
launched after context recovery. Candidate20261006023500 remains default OFF,
uninstalled. Desktop browser untouched. New plan bot-docs/plans/dmabuf-pixels.md;
report bot-docs/reports/performance/2026-10-06-dmabuf-pixels.md. Artifact siblings
dmabuf-pixels.mjs, dmabuf-pixels-capture.mjs, laptop-dmabuf-pixels.mjs and
test/dmabuf-pixels-spec.mjs under artifacts/umbralink-control/. Final-v3 tests
50PASS include existing canvas-large/readback regressions. Not runtime PASS.

OFF1 failed a fixture expectation before drawing: explicit pref false equal to
default has userValue=false. Corrected expectation with behavioral RED/GREEN.
OFF2 and OFF3 both fail strict repeat-pixel gate at paused0.5s, before2s or ON.
All24 hashes agree across those runs, but filter repeat0/repeat1 differ within
each. Other11 case pairs match. Both filter native observations accelerated.
V3 retains two230400B filter RGBA buffers, canonical base64/hash checked.
OFF3 difference:11/57600 pixels,11 components (R4/G4/B3/A0),maxdelta1,
absoluteError11; bbox x204..251/y112..154. Hashes6f8c8904... and122ac539...
match OFF2. No shader/rounding/frame-cause or stock-Firefox equivalence proven.
No tolerance approval, ON run, speedup claim or stutter attribution.

Remote harness ~/.cache/codex/dmabuf-pixels-harness-20261006-DwL2cx;
initial harness.tar.gz plus harness-v2.json/v3.json preserve revision history.
OFF roots fd2gZ9(ctrl1228472/browser1228484), NSaw6B(1232695/1232708),
3BI6jM(1237832/1237844) under laptop-dmabuf-pixels-off-20261006-.
All clean SIGTERM/rootAbsenttrue/271Blog0drops; package postchecks retained.
OFF3 remote export verified all12 recorded PIDs absent,30 evidence files,
732073B. Local off-3-export.json +decoded off-3/ hashes verified. Last exec
89389 no longer available; terminal driver/run evidence and exact PID absence
establish completion, not a recovered process exit code. Export session79012
exited0. No known owned browser/controller/test remains active.

filter-difference.json is direct saved-data analysis with equal/known-delta/
invalid-size checks and independent scalar count/sum crosschecks. Original
dmabuf-import and canvas-large seals stay frozen. Current pixel artifacts are
not yet a final acceptance seal. Next isolate OFF filter variation before ON;
failure propagation/context loss and moving performance gates remain owed.

## October 5 DMABuf Import Backport In Progress

New upstream lead bug2070629, D327325, reland
a3c328e4aff34a383827dc4b23f96001a3975428 (Firefox159, defaultOFF).
13 native files patched;10 exact upstream deltas verified by reverse hash.
Manual Canvas2D/GLBlitHelper cpp+h merge preserves V2 helper byte-for-byte and
scaling boolean, appends destFormat. No default enable/public API/install.
Plan bot-docs/plans/dmabuf-import.md; report
bot-docs/reports/performance/2026-10-05-dmabuf-import.md.
Evidence artifacts/umbralink-control/dmabuf-import/ includes upstream.patch,
before.json/before.patch, implementation.diff, integrated.patch,13sourcehashes,
tracked-source.patch and11file source supplement. IndexSHA3b78253c unchanged.
Actual source admission RED (GTK decision+missingpref) then expanded GREEN;
30focusedreadback testsPASS; exactnative/JS lint0errors0warnings. Not GPU proof.
GNU patch pipe comparison failed (no source edited); regular temporary blob
comparison reconstructed all13 before hashes, rejected patch retained.

First build session86487 exited124 at2700s; no compilererror, endedtoolkit
windowwatcher, allclang/gmake/rustc absent. Sourceguards andresource recheckPASS.
Resume session79974 PASS exit0 at03:31UTC,715s: same MOZ_BUILD_DATE=20261006023500,
CARGO_BUILD_JOBS=2 timeout1800s ./mach build -j2, saved build-resume.log.
13native/11untracked/fulltracked/index guards PASS; buildheader+2INIs agree.
Resume zero warnings; first timed-out segment had7 suppressed WebRTC warnings,
no finalized warning database. Not a whole-build warning-free claim.
Package session46585 PASS exit0 in98s: same builddate/jobs +XZ_OPT=-T2,
timeout600s ./mach build -j2 package, saved package.log. NOinstall.
New exports/umbrafox-dmabuf-import-candidate-20261006/: archive107761956B,
SHAfc6e32d5e0ec57ad3c3b1af4a1e500f89f11e73f7f6cafedd87403654f02ebea;
46regular extracted files, no symlinks. libxulSHAdf66802b26aeddf5665cc14dcbff11f620f2914ff1dccdfd15580ffcd933df66,
ELF6f283bdcc8f7f35774dc2ac2dd6efb0c. BothINIs correct. Freshprivate
version-only PASS exit0, root1157484 absent; EPERM sandbox warning retained.
No browser measurement/GUI runtime, no live browser control or install.
Build/package/extract/version sessions all exited. Need laptop OFF/ON pixel/provider
gates then timing. Cause of observed accelerated->Skia transition still inferred,
NOT established by upstream report; no YouTube/stutter/speedup claim yet.
Final guards PASS after version:13native/11untracked/46packagefiles/index;
versionroot1157484 and observed sandboxprobe1157486 both absent.
Docsfinal lint0; package export seal55files SHA11006442f4322a0585645f67e9fba7e547c23867d47c76b974a1d57a6944842c.
Evidence57files sealed in artifacts/umbralink-control/dmabuf-import-final.sha256,
SHAcb8f52b9b0f8448b5efd5dabaa9531bb6bdab441b917b7c6e1e253f8d04a15f5.
Both sha256sum rechecksPASS. Report/plan/evidence now frozen; use sibling nextwork.
Do not end with build/test processes unresolved. Desktop daily browser protected.
Additional source risk found while compiling: SharedContext Import calls void
TexImage then returns a surface, no upload-result check. Direct BlitSd defaults
allowFallbackfalse; framebuffer failure can diagnosticcrash, blitfailure clears
diagnostic color/returnstrue. Outer null fallback is not generalGPUfailure proof.
Source-backed acceptance risk, not reproduceddriverbug. Report has pinned source;
require failurepropagation test before any defaultON/dogfood, no speculativefix
duringbuild. Canvas module compiled by8min, no compilererror then.
Nextpixelgate MUST NOTreuse tinyold default110x75 case asGPUproof: below128^2.
Use above-threshold freshcanvas/provider-before-readback andsamecandidateOFF/ON;
provideridentity alone isnot successfulimportcount. Existing18paused cases remain
valid for their oldCPU/cache purpose, not acceptance of newGPUimport.

## October 5 Above-Threshold Canvas Transition

Latest goal progress: new canvas-large artifact siblings, no engine/build/install.
Report bot-docs/reports/performance/2026-10-05-canvas-large.md; artifacts
artifacts/umbralink-control/canvas-large/. Two baseline320x180 runs PASS.
Actual min128/max8192,no user values,before/after stable. Default first draw
provider accelerated/recording then draw120 sharedSkia; readback control shared
Skia both. No timed getImageData/hash; one230400B nonblank read AFTER lastnative
snapshot and pause. No publicdebugAPI, no profiler. Default301ms/readback275ms
total120draws,median2/2,P954/3,first22/26;143videoFrames0drops each.
Short fixed-order pair, NOT YouTube/causal speedup/GPU execution proof.

Source refresh chain: DrawTargetWebgl usage counts -> CanvasTranslator unlock
notification -> CanvasChild/RecordedTextureData/provider -> TryAcceleratedTarget
mAllowAccelerationfalse. Source defaults10frames/.3failure/.66cache ratio NOT
queried live. Other allocation/context fallback sends same notification. Exact
transition frame/reason unknown; sticky path not proof of repeated same-canvas
GPU recovery. Frozenbase+packagepatches inspected, V2scaledDrawImage retained.
Next isolate refresh reason/transition without forcingGPU/default/pixel changes.

Remoteharness canvas-large-harness-20261006-KP8RZd42files23329249Bpre/postPASS.
Captureroots ~/.cache/codex/laptop-canvas-large-baseline-:
default-20261006-kCocmm ctrl1207720/browser1208218;
readback-20261006-vnP1m7 ctrl1209856/browser1210356.
All24PIDs absent postpair,cleanSIGTERM271B0drops,47pkgfiles verified;
16.846/16.883s,7samples each,peak188326046/188322628B,headroom80MB.
38focusedtestsPASS; sizebehaviorRED and recompute-schemaRED retained; original
small106file seal/index unchanged. Candidate UNINSTALLED; desktop protected.
No active controller/browser/profiler/test session; broad goal ACTIVE.
New canvas-large-final.sha256 independently verified:103files23672094B,
SHAdb5f103aee013e180488ad9236f0af0fa5000016867fcb5f119a8780ec080281.
Preserve this frozen experiment; subsequent transition observations use siblings.

## October 5 Small Canvas Native Route

Latest goal progress adds artifact-only canvas-route.mjs/canvas-route-capture.mjs/
laptop-canvas-route.mjs and test/canvas-route-spec.mjs; no engine/build/install.
Two baseline runs PASS with120 single draws and no perframe getImageData/hash.
Exactly one33000B nonblank check after pause. Two synchronous privileged
getDebugInfo(false) reads after timedfirst/last draws: both runs sharedSkia,
isAcceleratedfalse,backend2,type0. Page-principal executor is existing packaged
ControlScript helper; page getDebugInfo absent; no publicAPI/prototype change.
First runtime proves owned-event/frame-script diagnostic route works. Native
targets return at stable state, so later RPC or ensureTargettrue is unsuitable.

Default330ms vs explicitreadback326ms total120draws; median3/P954ms both,
first21/24ms. No candidate runtime/speedup/YouTube/physicalscanout claim.
Important sourcegate:110x75=8250pixels below default128^2=16384 in
DrawTargetWebgl::CanCreate. Frozenbase+bothpackagepatches leave gate/pref unchanged;
runtimepref NOTqueried. Canvasfeatureavailable, actualprovider stillsoftware.
Next sibling:320x180 above unchangedcutoff, actualmin/maxpref receipts via
existingbrowserrequest, nativebackend snapshot, same no-timed-readback protocol.
Do not lowercutoff/forceGPU or infer allcanvasesCPU. Currentcode/evidence frozen.

Report bot-docs/reports/performance/2026-10-05-canvas-route.md; plan
bot-docs/plans/canvas-route.md; artifacts/umbralink-control/canvas-route/.
Remoteharness canvas-route-harness-20261006-CZzUl2 (39files23302666B) pre/posthashPASS.
Remote ~/.cache/codex/laptop-canvas-route-baseline- roots:
default-20261006-roWTRL ctrl1199171/browser1199666,
readback-20261006-uGsEK2 ctrl1201484/browser1201957.
All24recordedPIDs absent;16.610/16.859s,7samples/run,peaks153760234/187271759B,
47pkgfilesverified,cleanSIGTERM/271B0drops/nativeprivatepaths match.
No desktopaction/profiler/activecontroller. Candidate remains UNINSTALLED.
29focusedtestsPASS incl behavioral cancel-errorRED beforefix, exactemittedchild;
savedrecomputePASS. Stageddiff3b78253c... unchanged. BroadgoalACTIVE.
Final canvas-route-final.sha256 independentlyverified:106files23662036B,
SHA1adb1ec9adbb7140c4c1600e4535f60bf24845cbcca5abb083d3ad5c54e6012c.
Originalcode/tests/harness/reports nowsealed; prospective size experiment uses
new siblings. No active browser/controller/test sessions remain.

## October 5 Later Copies: Separate Setup From Readback

New offline-only goal progress; no browser/native/build/install/index action.
Candidate UNINSTALLED. Report2026-10-05-later-copy-symbols.md under performance
reports; plan bot-docs/plans/later-copy-symbols.md; artifacts/umbralink-control/later-copy/.
Same two savedprofiles/exact Mesa symbols. First36/22samples reproduce; later
baseline samples4/1/4/2/2 and candidate noIPC/2/2/2/1. Nine later IPCwindows:
no observed compile_shader/create_builtins/schedule_compile frames, all self
symbols resolved. iris_bo_wait_syncobj counts1/1/1/0/0 vs N/A/1/1/1/1;
upstream25.2.8 maps bufferdeps to DRM_SYNCOBJ_WAIT (not compiler job fence).
Buffer IDs/GPU owners/timings unknown; no recurring YouTube or general speedup.

Collector explicitly willReadFrequently:true; perframegetImageData afterdraw.
Frozenbase+identicalCanvas2Dpackagepatch leaves UseSoftwareRendering and
TryAcceleratedTarget guard unchanged. This intentionally exercises software
destination; default-canvas prior paused pixel test is NOT moving-route proof.
Next meaningful gate: normal/default movingcanvas vs explicitreadback, separate
display-only timing from pixelvalidation, positive existingbackend/route receipts
or explicitunknown. Do not overridepublichint/graphicsdefaults or deletefences.

ContractRED3/2 ->5PASS. Firstbaseline offline failed because CLI samples OMIT
filters, newcheckexpectednull; actualexport regressionRED then fix permits
omitted/null only, functionsfilters={} mandatory. Failedsource/export retained;
correctedrootsbaseline-v2/candidate-v2. Final47focusedPASS,4fileformatPASS,
recomputeidentical. RawJSON onlysupportedtools; priorseal/index unchanged.
All6server/daemonPIDsabsent:954675/954739,956663/956688,957593/957618 andsockets.
Observed6.761/11.656/10.119s; noactivehandles. BroadgoalACTIVE.
New479file later-copy-final.sha256 verified,SHA43790c2377e4584c02c75f8486a08ce1e78ed28b574cb45f0bcc96eee5abbaee.
SeparatetestSHAf1c3b58a3f2738ab171df40f83edf1057eaf9ac3ab1d57d48177834f393efe5b.
Savedcode/evidence frozen; new experiments use siblings.

## October 5 Mesa Symbols: First-Use Shader Work Resolved

Status turn continued OFFLINE only; no browser/native/build/install/index change.
Candidate remains UNINSTALLED; desktop daily browser/profile protected.
Report bot-docs/reports/performance/2026-10-05-mesa-symbols.md; plan
bot-docs/plans/driver-symbols.md; artifacts/umbralink-control/driver-symbols/.
Alternate official ddebs package succeeded after old debuginfod failures.
HTTPS Ubuntu keyring SHA777b6a23 -> gpgv InRelease good F2ED...F622 -> index
SHA516b0227 -> package9619d1a2/65987654B -> debug a9d10145/69365760B.
GNU198701d4b61dc1afd1949464114e27c1e90498a2 matches exact laptop/profile.
No key/package install or personal cache inspection. Full hash chain in report.

Two saved-profile loads PASS, same36/22samples and worker/clock/scope joins.
Mesa inclusive counts baseline/candidate: compile_shader22/7,
ensure_builtin_types/create_builtins19/6, iris_schedule_compile/fence_wait6/9,
mesa_ReadPixels4/6. NONADDITIVE/wall samples, not exact CPU/GPU durations.
Upstream25.2.8 source maps iris wait to compiler job ready fence, not frame GPU
fence; runtime branch/Ubuntu patch equivalence/cache hits unknown.
Unresolved self19/8 ->6/1; complete lists174/156rows reconcile.
No causal A/B or recurring YouTube diagnosis. Prior repeated-copy benefit separate.

11preload and39focused final testsPASS,two-fileformatPASS,results/recheck identical.
Prior342file seal/indexSHA3b78253c unchanged. Own Samply/CLI PIDs
928106/928187 and934073/934163 + sockets absent,7.379/6.895s; no active sessions.
Next: later-copy windows in SAME profiles to distinguish first-use setup from
recurring work, before more browsers/native probes. Native probe gate OFF;
no configure/build started. Do not add duplicate helper/program caches or infer
warmup eliminates work. Broad goal remains ACTIVE.
New224file driver-symbols-final.sha256 verified; SHA316ac3a086812a46c836de2580285642a7007816d96ebcb981fd57f766a9d079.
Artifacts now frozen; later scopes use prospective siblings.

## October 5 Cold Worker Symbols: First-Use Setup Localized

Latest goal continuation made evidence progress using SAVED profiles only.
No browser/native/build/install/index change. Candidate still UNINSTALLED.
Report bot-docs/reports/performance/2026-10-05-cold-worker-symbols.md;
plan bot-docs/plans/cold-worker-symbols.md; artifacts/umbralink-control/cold-symbols/.
Local Samply0.13.1 + profiler-cli0.10.0, exact packaged libxul SHA/BreakpadIDs.
Both first-window worker identity/clock/count gates pass:36/22samples.
Native inclusive counts baseline/candidate: RecvReadback33/22, sizedDMABuf33/22,
ReadIntoBuffer32/22, GLBlitHelperconstructor21/7, CreateDrawBlitProg7/8,
ReadPixelsIntoBuffer4/6. Nested counts NOTadditive/exactCPU or causal speedup.
Native source frozenbase+patch: helper/program already cached perGLcontext.
Constructor doesbuffer/VAOsetup+vertexcompile; CreateDrawBlitProg fragmentcompile/
link/status/uniforms. Exact subcall cost unknown. Do not add duplicate cache or
assume eagerwarmup eliminates work. No recurringYouTube explanation yet.

Complete functions178/133 rows,selfcounts36/22; unresolvedself19/8.
Topdowntrees only101nodes includingroot,self8/7 despite requestedlimit200:
NOTexhaustive partition. Six supportedasm exports allinstructions0samples despite
nonzerofunction totals; reconciliation guard rejects. No callsite attribution.
Mesa laptop exactGNU198701d4b61dc1afd1949464114e27c1e90498a2,stripped,no matchingdebug.
Official Ubuntu debuginfod publicIDonly:HEAD400,GET200 expected69365760B butHTTP2
cancelled680149B;oneHTTP1 retrycut372233B. Failed files preserved/notparsed orused.
No install/profileupload/defaultsymbolendpoint or furtherretry; no universal
networkproof. Browserenv hasno explicitMESA_*/XDG_CACHE_HOME; actualdrivercache
location/hitstate remainsunknown, notassumedcold fromfreshprofile.

FourownedCLI+Samplypairs stopped;PIDs849819/849844,850521/850548,853639/853668,
854529/854554 absent; sockets/ports37531/37532 absent. Observed4.96/4.91/6.64/6.88s.
No activeanalysis/download/session now. NewcontractRED1/1,asmRED2/2 -> final58PASS;
fivefileformatPASS;results/recheckbyteidentical. Prior232fileseal/indexhashPASS.
NEXT smallestjustified nativeexperiment: privategated first-use timings for
buffer/vertexcompile/fragmentcompile/link/status/readpixels, not changingfences/
precision/filtering. MatchingMesasymbols couldavoidnewbrowser ifobtainable.
New cold-symbols-final.sha256 seals342files19876698B; independent sha256sum
checkPASS. SealSHA256 e6aa2cda1b4f464c79b7a3eba8aab66e32f3a8fcb8fbe9ba9fb54322c026f45b.
New code/evidence/plan/report frozen; future corrections use siblings. BroadgoalACTIVE.

## October 5 Cold Worker Profile: Coverage Gap Closed

Latest goal turn is progress: new prospective cold-worker.mjs validator callsV3,
orders same-clock Performance traces only, allows equalcoarse endpoints, removes
unsupported cross-clock ordering. Exact collectColdCopies importedunchanged.
New cold-worker-profile/laptop-cold-worker siblings add MediaSupervisor filter.
Old failedcapture/validator/seal unchanged. No native/build/install/desktopaction.

One fresh baseline+candidate bothPASS. ActualMediaSupervisor#2 first-window
coverage36/22samples; namedreadbackhandler33/22. Firstscope36.665978/21.674356ms,
IPCrequestreply34.594568/21.362254ms. No causalspeedup. Galliumstackframespresent
butnativeaddresses unresolved; context/compile/conversion/wait stillunknown.
ThreadIDsbaseline1139276/RDD1137068,candidate1143082/RDD1142788.
With worker sampled,parentpayload.threadId omitted; coverage.mjs projects exact
rosterTID only after endpointrecvTid/sendTid crosscheck.998/416parentrecords;
rawexportsunchanged. Sixscopes/marks/peers/seq/endpoints validated; no rawphaseproof.

Evidence artifacts/umbralink-control/cold-worker; report
bot-docs/reports/performance/2026-10-05-cold-worker-profile.md; plan
bot-docs/plans/cold-worker-profile.md. REDclock1/2 andfilter4/5; final54PASS,
11filePrettierPASS; results/recheck byteidentical. Same24MiBprofilecap,120stotal,
10squiet,64MiBheadroom,256MiBsampledcap. Profiles21124358/16641802B;7samples/cell,
peaks233845669/221799616B. AfterHWffmpegRDDH264; no continuousdecodeproof.

Remoteharness cold-worker-harness-20261006-4r6EiD,42files23311667B posthashPASS,
manifest31a2ad1ecfe9627236fdf87364bdb8975592a0fddf8fa40b088bc887fbaca063.
Baseline laptop-cold-worker-baseline-20261006-0tFCKa ctrl1136890/browser1136903;
candidate laptop-cold-worker-candidate-20261006-VjrtA2 ctrl1142627/browser1142659.
All24recordedPIDs absentagain;cleanSIGTERM/no drops/pkg47filesPASS;21.424/21.205s.
OfflineCLI ownsessions stopped,daemon812889/828933 PID+socketabsence rechecked.
RawJSON onlyprofiler-cli; endpoint127.0.0.1:9. No active runtime. No retries.
Priorcoldseal/stageddiff3b78253c... unchanged. New cold-worker-final.sha256
seals232files94537392B; independent full hash recheckPASS. SealSHA256
789bb6e90c5a79a2eef1b1cebdc8a74069c8dbe7cc236929db0e50c3ffa51c07.
Final test log confirms54PASS/0fail; packaged libxul section tables both contain
.symtab but no .debug_* sections. Symbol resolution remains pending, not proved.

NEXT resolve SAVED receiver stacks via matching local symbols before nativepatch
or morebrowserruns. Exported libxul binaries NOTstripped;GNU IDs baseline
101a3778f02e7e2c463829dc94b3ebc3,candidatef2c96c91073e8ba2cd754e10735f6b75.
Prior supported Samply0.13.1 boundedlocalworkflow in interleaved-profile report
and ~/.cache/codex/dom-symbols-20261003-4SQS4U. Need exactIDs/fromCLI libraryproof,
freshprivatecache/explicitloopback/noexternaldefaults/no-open/resourcebounds,
guaranteedownserver/daemoncleanup. No symbolserver launchedthisturn.
Avoidport0advertisement priorpitfall. Currentobjdir maydiffer; do NOTguesssymbols.
Candidate UNINSTALLED; desktop browserprotected; broadgoalremainsACTIVE.

## October 5 Cold-Copy Profile: Endpoint Localization, Coverage Gap

Latest progress/status turn: one fresh laptop baseline PASS and one candidate
FAILED new timestamp validator after complete collector+profile dump. No retries.
No desktop browser/source/build/install change; original candidate UNINSTALLED.
Report bot-docs/reports/performance/2026-10-05-cold-copy-profile.md; plan
bot-docs/plans/cold-copy-profile.md; evidence artifacts/umbralink-control/cold-profile/.

Six UserTiming scopes around first six copies, same V3 moving workload. First
native scopes29.329551/24.991172ms; unique same-clock IPC peer+sequence joins
request->reply28.961523/24.648503ms (~98-99%). NOT a causal speedup comparison.
Actual receiver threadIds1120211/1123093 absent sampled thread inventory.
Frozen parent uses RemVidParent TASK QUEUE on SUPERVISOR pool; VideoUtils maps
physical pool to MediaSupervisor. RemVid filter missed that worker. RDD main
idle samples do NOT prove RDD idle. Driver/context/conversion/wait unknown.

Candidate phase0frame1 callback11473.14 vs Performance mark11473 fails unsupported
trace.startTime>=callbackAt gate. Frozen source: rendering timestamps RFPOnly,
Performance.Now full seeded reduction, profiler marks separately unclamped.
All V3 value checks pass. Original FAILED and code remain preserved; no epsilon
or privacy-pref modification. Real receipt regression included in analysis tests.

New artifact-only analyze.mjs/recompute.mjs verify full CLI contexts,18 mark/
measure records,6scopes,unique4endpoint joins, reject missing/ambiguous/crossing,
do not rely on StackMarker raw pairing.5analysis tests incl17negative cases;
42focused final testsPASS,8filePrettierPASS; results/recheck byteidentical.
RawprofileJSON only loaded by profiler-cli, never customparsed; explicitoffline
symbolserver127.0.0.1:9, stopped daemon744195/745130 exactPID/socketabsence.

Remote harness cold-profile-harness-20261006-qzu48K,39files23298598B posthashPASS;
manifest8890cc86b34231727432455e4936f2cb1ce6241c6a726851c4176e2caf32c91f.
Remote baseline laptop-cold-profile-baseline-20261006-WSAJxW ctrl1119768/browser1119791;
candidate laptop-cold-profile-candidate-20261006-MypdhC ctrl1122644/browser1122656.
All24recordedPIDs absent again00:36UTC; cleanSIGTERM/271B0drops;47pkgfilesPASS.
20.982/20.985s;7/6resource samples;sampled artifactpeak223473721/188228700B,
candidate finalprofilecopy afterlastsample so notfinalsize comparison.
Nativeprofile16331537/15958340B,stoppedtrue;afterHWffmpegRDDH264. Noactive sessions.
Previous V3 seal+stageddiff3b78253c... unchanged. New cold-profile-final.sha256
seals208files87158781B; independent sha256sum checkPASS. SealSHA256
b038cb7713a621a5f4c6ca8cbf588ddc4c5a130f0d1cda44b9f1c5bed48dd89a. Code/evidence/report
now frozen; future correction uses new prospective siblings.

NEXT: prospective corrected timestamp-contract sibling + MediaSupervisor filter,
require actualreceiverthread coverage, then investigate lazycontext/conversion/
driverwait with existing stacks or narrowprivate observation. Samebounds and
ownedlaptop permission; no automaticcapincrease or speculativeenginepatch.
Do not rerun failedgate or claimYouTube/startupstutterfixed. Goal remainsACTIVE.

## October 5 Counterbalanced Moving Timing Repeats the Narrow Benefit

Previous goal turn was evidence progress; this turn corrects timestamp contract
in prospective V3 siblings, preserving old V2 code/captures/verdicts. New
moving-timing.mjs/laptop-moving-timing.mjs plus specs: mediaPTS finite0..duration,
strict progression; NOT<=pausedcurrentTime. Reports lead/lag, no guessedtolerance.
Exact serializedcollector unchanged,8RPCs and resource/cleanup gates unchanged.
RED7pass1fail thenGREEN;67prelaunch,70finalfocusedtestsPASS,5fileformatPASS.

ONE ABBA runsequence allPASS, no retries. Additional-copy totals302/14/18/300ms
over300/297/300/300copies; median1/0/0/1ms. Single-copy totals156/184/210/202ms
over99/100/98/99samples; no consistentfirstcopybenefit. Veryfirstdraw19/34/41/27ms
is nextusefulcoldlatencylead, NOT proven cache regression. Wholepackages differ,
coarseclock andpixel/hashobservercost remain. Zero!=zerowork. OverallreportedCPU
2242/1939/2484/2397ms mixed;RDD596/438/560/660ms. No generalCPU/playbackwin.
All endpoint11PID/type/childID joins plus sampledstartidentity pass.
Both exactomni ControlDiagnostics modules identical; cpuTimeMs producerchecked.

All48recordedbrowser/controllerPIDs absent, cleanSIGTERM/271logB/0drops,6samples
perrun.47regularfile packagechecksPASS incllock+allowedemptyupdatedirs. Native
roots/display/backendjoinsPASS; afterHWffmpegRDDH264, beforepausedshutdown.
No continuousdecode/scanout/networkproof.4rootswithin120s/256MiB/64MiBheadroom;
candidatepreworkdiskhigher already, cannotattributetocacheorRSS. No desktop/
install/build/engine/source-index change. StageddiffSHA3b78253c... unchanged.

Evidence artifacts/umbralink-control/moving-timing/;143exportfiles911144B hashed.
Report bot-docs/reports/performance/2026-10-05-moving-timing.md; plan
bot-docs/plans/moving-timing.md. Results.json fullcounts andCPUjsonl retained.
Harness moving-timing-harness-20261005-xn06kq,36files23277573B,
manifestb86b1f65bfbffcd18eab0640394465f9dcfac63c919b298a308685cd79824dea,
before/afterverified. Remote~/.cache/codex/laptop-moving-timing- roots:
A1 baseline-20261005-gKk8O1 ctrl1104950/browser1104962;
B1 candidate-20261005-vEbIqW ctrl1106918/browser1106967;
B2 candidate-20261005-sezeBW ctrl1108910/browser1109052;
A2 baseline-20261005-isUS3H ctrl1110846/browser1110870.
Elapsed20.248/20.355/19.922/20.211s,peak153953675/188726198/188373029/154178573B.
All activebrowser/controllerexecsessions ended. Candidate remains UNINSTALLED.
Finalseal moving-timing-final.sha256:190files25374630B, independentcheckPASS,
SHA5802718c810dd2ae38a85d35e86a6bf0a552fdc4cec3dbe3fdb386082b58e2c2.
V3 code/evidence/plan/report frozen; nextinvestigationusesnewartifacts.

NEXT: first-copy/cold-firstdraw localization, not more repeatedcopyconfirmation.
Read frozenDrawImage/remote-readback path and existingprivateprofilercoverage;
separatequeue/receiver/conversion/wait before nativechange. Only4firstdraws,
19/34/41/27ms; do NOT overclaim. Keepboundedownedlaptopruntime,
no desktoprestart/install. Broaderlayout/CSS/JS and realYouTubeworkstillactive.

## October 5 Moving Observation Pair and Second Clock Assumption

Latest owner asks status; active performance goal continues, not complete.
V2 artifact-only moving-observation.mjs/laptop-moving-observation.mjs reuse exact
V1 collector but retain within-callback differing pixels and save all after
diagnostics before final validation.55prelaunch testsPASS, then ONE fresh laptop
baseline PASS and ONE original cache candidate FAILED. No retries/newbuild/install.
Both complete4phases and cleanSIGTERM, all24recorded browser/controllerPIDs absent,
47regularfile packagepostchecksPASS incllock,0logdrops,36harnessfiles unchanged.

Candidate fails ONLY mediaTime<=pausedcurrentTime: finalphase3/frame49 is
7.966666s vs7.959293s (+7.373ms), expectedDisplayTime-callbackAt16.68ms.
Frozenbase892431809 +candidatepatch46f9b2e4... exclude HTMLVideoElement.cpp;
WillFireVideoFrameCallbacks selects next-tick image and emits its mediaPTS,
CurrentTime onlyfallback. Unsupported measurement ordering, not engine-regression
proof. Pure copied-time counterfactual passes remaining assertions; original
FAILED unchanged. Do NOT silently fix/relabel V2 or retry same gate.

Raw descriptive timing only: repeat additionalcopies median/P95 baseline1/2ms,
candidate0/1ms; singlecopy2/3vs2/4ms. Coarseclock0!=zeroCPU.499vs495copies,
199vs198callbacks,14/100vs11/99differing4copybatches. Wholepackagefixedorder,
failedcontract,observercost => no accepted speedup/YouTube verdict. Afterdecoder
bothhardwareffmpegRDDH264; beforebothshutdown,continuousbackendunproved.

Evidence artifacts/umbralink-control/moving-observation/; report
bot-docs/reports/performance/2026-10-05-moving-observation.md; plan
bot-docs/plans/moving-observation.md. Both exports69files444481B locallyverified.
Harness moving-observation-harness-20261005-6Fbogb,36files23277351B,
manifestdd03ccdb1e142614ced0bc4e011b29758333f1699112a2b341bb11b917eb3e56.
Laptopprefix ~/.cache/codex/laptop-moving-observation-:
baseline-20261005-IXlrES ctrl1088435/browser1088468/content1088627;
candidate-20261005-G8Gws6 ctrl1090449/browser1090501/content1090676.
19.959/20.041s,peak188307823/188323037B,initialheadroom80277288/80133015B.
No active sessions/browsers.58finaltestsPASS,exact5fileformatPASS,stageddiffSHA
3b78253c... unchanged. PriorV1 seal unchanged. Desktop browser protected.
Final moving-observation-final.sha256 seals107files24221910B; independent
sha256sum checkPASS. SealSHAc830c58e07b310faee297e598bf1713db08504d76f98cbdfc909688a9a6d16de.
V2 code/evidence/plan/report now frozen; use prospective siblings for changes.

NEXT source-supported prospective timestamp contract: separate framePTS and
pausedplaybackclock; no arbitrarytolerance/currentTimeupperbound, keep finite
in-duration times and orderedframe/callback IDs, record lead. Tests for ahead,
behind/reordered/seek/bounds BEFORE runtime; never reclassifyoldfailure.
Then deliberate movingrequestcounts or counterbalancedpair, notblindretry.
Earlier accepted hardware50->18requests/50pixelmatches unaffected. Goalactive.

## October 5 Moving Baseline Failed Its Pixel Assumption

Supersedes preparation-only section below. New moving-capture.mjs and
laptop-moving-copy.mjs compose existing strict capture/private-root/installation
helpers. Eight serial RPCs, no RPC during collector phases; raw save before
validation;64MiB prospective headroom,120s/256MiB unchanged. No engine changes.
Prelaunch46testsPASS after correcting fake-clock vs realWebCrypto scheduling
(production still realcrypto). Integration first45PASS1FAIL preserved; fakehash
now deterministic nodeSHA256 wrapped asPromise. Exact6fileformatPASS.

ONE real headed baseline ran. NO candidate and NO retry. StatusFAILED because
15/100 four-copy batches contain differing hashes. Collector completed all4
phases,198callbacks/498copies,paused at7.966666s.49/50/50/49callbacks;
phase2012/2019/2001/2003ms;qualitytotal240/drop0 is not scanout proof. Earlier
paused-frame50->18request result and pixelparity remain separate/unaffected.

Frozen baseline base892431809... +trackedpatcha90f9969... inspected, not dirty
checkout. DrawImage resolves video image eachcall -> SurfaceFromElement ->
HTMLMediaElement::GetCurrentImage -> GetImage(TimeStamp::Now) -> timestamp-based
GetOwningImage. Callback does not pin every subsequent draw. Hash differences
consistent with image advance, NOT exact per-draw identity proof. Do not modify
Firefox semantics to force benchmark equality. Before paused native receipt
hardwareAccelerated=true but decoder="shutdown"; active decoder during work
unproved. Afterdecoder/performance skipped when original validator rejected.

Remote harness ~/.cache/codex/moving-copy-harness-20261005-kX1eL0,34files23263247B,
manifest2791f69a6bcbb05814944d37bc6210fe3cbaeb4ef6549dede28b8e1f0d7cd569
verified before/after. ONE run laptop-moving-copy-baseline-20261005-0oFMak;
controller1076753/browser1076771/content1076938. CleanSIGTERM/271logB/0drops,
all11sampledbrowserPIDs+controller absent,46filepackagepostcheckPASS inclallowed
emptyupdatesdirs. Capture19.760s;5resourcesamples peak153866877B, initialheadroom
114589184B. Export29files205939B locallyhashverified, rawfailedreports preserved.
No profiler/newbuild/install/desktop/personalprofile changes. All runtime ended.

Evidence artifacts/umbralink-control/moving-copy/; report
bot-docs/reports/performance/2026-10-05-moving-copy-baseline.md. Source excerpts
frozen-source-proof.json/frozen-image-selection.txt. Saved replay3PASS preserves
failed classification and repeats exactpopulation/cleanup/pauseddecoder limits.
Final combined49testsPASS and exact8fileformatPASS; no native rerun.
Final moving-copy-final.sha256 seals79files23940111B, independentlyPASS;
sealSHA34b7ad45d9453c359833c660605c798cc1e39c299682aabebfc88410e2209227.
All V1 runtime scripts, tests, plan/report and evidence are now sealed; use new
prospective V2 artifacts rather than overwriting them. Stageddiff unchanged.

NEXT: prospective V2 moving OBSERVATION contract, retain every copy/hash and
classify differing batches instead of requiring callback=pinnedimage. Keep V1
validator/capture/evidence sealed and failed. Read-only afterdiagnostics must be
captured before finalclassification under same deadline/docidentity. Actual
imageIDs/cachehitcounts unknown; do not claim them from repeated callback draws.
No automatic runtime retry; design/test correctedcontract first, then ONE new
baseline on disposable laptop. Owner permission already covers that bounded
work; desktop daily browser protected. Goal active; failure yields useful
evidence but no moving playback improvement or candidate verdict yet.

## October 5 Moving-Copy Collector Preparation

Latest owner request is a progress report. Reported confirmed hardware readback
50->18 requests with50 exact pixel matches; explicitly not64%faster playback or
YouTube solved. Standing disposable-laptop authority remains; desktop protected.

Artifact-only moving-copy.mjs and test/moving-copy-spec.mjs now contain a
serialized1080p collector/validator and64MiB prospective artifact-headroom gate.
Four2s phases1/4/4/1 copies per video callback; no browser controller/driver yet.
Plan bot-docs/plans/moving-readback.md; existing90s1080p H264 asset unchanged.
Fake-page tests exercise normal callbacks and failures, NOT native media proof.

Retained failure-path RED5PASS4FAIL: quality-read exception left phase unsettled,
early timer accepted <2s, invalid metadata/state accepted, hash rejection after
sync state failure was unobserved. Corrected fixed monotonic deadline rewait,
terminal cleanup/rejection, typed metadata, immediately observed hash promises.
Additional validator RED11PASS1FAIL fixed negative initial media/frame identity
and unordered callback clocks. Final24PASS =12moving +7route +5fixture, strict
unhandled rejections; exact2-file Prettier with --ignore-path /dev/null PASS.
Initial Prettier invocation was skipped by ignores, not counted as verification.
Logs artifacts/umbralink-control/moving-copy/; no browser/remote/profiler/native
execution, no engine changes/build/install, no staged changes this follow-up.
SourceSHAbe803479951664d85c0428455d819174cce226fd68d246f91f1be4ae0289f93b;
specSHAa4bb8d174bef2dfdbf20b635135cb033ca3586001bfe08636636d01947714a92.
Staged diff SHA remains3b78253c... (saved moving-copy/staged.patch).

NEXT: compose new artifact-only capture+fresh-install driver using existing
captureLocalWorkload/createSustainedServer and sealed laptop admission helpers.
Test bounded RPC/raw-save/identity/decoder/headroom/failure integration before
ONE baseline runtime; inspect before ONE candidate. NativeH264 hardware receipts
before/after required, no retries/cap relaxation. Keep120s envelope,10squiet,
256MiB sampled artifact cap, private profile/app/local/temp, ownedSIGTERM cleanup.
No profiler during active4phases; pixel-read/hash observer still has cost, so
unprofiled does not mean uninstrumented. Draw timing excludes pixel-read/hash.

## October 5 Hardware Readback Route Verified

Supersedes preparation-only status below. Two fresh headed laptop runs PASS,
baseline then candidate, no retries. Existing send-only IPCFlow markers expose
exact PRemoteMediaManager::Msg_Readback, not the guessed Decoder protocol name.
Both frames: baseline1/8/8/8 vs candidate1/0/8/0 for first/repeat/different/return
size phases.50copies issue50vs18requests; all50pixelhashes equal. Hardwareffvpx
RDDVP9/WebRender/IntelIrisXe contexts match. This is actual route-work reduction,
NOT64%faster rendering or a YouTube/playback/new-frame-first-copy win. Whole
packages differ; no cache-only timing attribution. Cachedsurface byte cap and
long-session retention remain separate evidence from request counts.

Artifact-only driver+analyzer+tests added.72focusedPASS, formatPASS, exactsaved
replayPASS,76capturefiles verified,29remoteharnessfiles unchanged. One CLI load
perdump with explicitloopback symbolserver; nativeprofilers stopped, bothnamed
daemons stopped/finally, exactPID/socketabsence recorded. No rawprofileparser,
newenginecode/build/install or desktopbrowser/profile action. Stagedpatch still
231628B/SHA3b78253c... (this is gitdiffcached, NOT binary .git/index hash).

Evidence artifacts/umbralink-control/readback-route/; report
bot-docs/reports/performance/2026-10-05-hardware-readback-route.md.
Final142file5219869B seal readback-route-final.sha256 independently checksPASS;
sealSHA6bb7ed3ef7e8868b4465cc5bbf171b7cfb26162e1d563b23cccbd11102f0a930.
Harness readback-route-harness-20261005-MYqQs3, manifest8a4d3492... .
Remote baseline laptop-readback-route-baseline-20261005-kIjpCM;
candidate laptop-readback-route-candidate-20261005-ussL3F under ~/.cache/codex.
Browser1061213/1065640, controllers1061195/1065628 and all22sampledbrowserPIDs
absent; cleanSIGTERM/0drops.12.016/11.947s, peak157367034/191470020B under256MiB.
Profilebytes1765583/1579425. Baseline has permitted empty updaterdirs; unchanged
46filepackage hashes. Originalpair Build20261001103920/libxul2a8e... versus
Build20261003071500/libxul82fa..., not inline1e2e... .

Next relevant performance step is larger moving video: measure actual reuse
frequency with onecopy/newframe control and repeatedframe copies, then separate
unprofiled timing/playback. Keep laptopprivate-root/cleanup/cap gates; do not
repeat old60srun blindly (only2.60MiB headroom). Nativefirstsizereadback cache
helps repeatedsameframe only. Broad layout/CSS/JS/render goal stays active.

## October 5 Readback Route Diagnostic Preparation

Owner asked for status; reported headed exact-pixel PASS, explicitly not a
playback speedup or a solved YouTube stutter. New artifact-only diagnostic
artifacts/umbralink-control/readback-route.mjs uses existing IPC/flow profiler
features and UserTiming on the owned VP9 fixture. Protocol is
bot-docs/plans/readback-route.md. Two paused frames, per-frame first/repeat/
different-size/return phases with1/8/8/8 draws; compare against predicted
baseline1/8/8/8 vs candidate1/0/8/0 requests, not a required result.

Preparation only: NO new browser, profiler daemon, remote run, package, install
or product-source change in this follow-up. New diagnostic has NOT run in Gecko.
First tests exposed a fake RPC misclassification of mediaDebugRequest args;
corrected mock. Collector failure tests then exposed marks emitted before final
state validation; moved validation before completed measure and checked element
identity/error. Paused profiler admission also reproduced/fixed. Preserved REDs
and final logs under artifacts/umbralink-control/readback-route/.

Final67 focused tests PASS, exact2-file Prettier check PASS. Includes serialized
collector50draws/8measures, load/seek/error/hash/context failures and shared
capture/installation/profile-preservation regressions. SourceSHA1ddf386e...
speca78cd8f0...; no raw profile parsing or new public instrumentation.

Next compose a NEW fresh-install driver using existing sealed package manifest
and admission helpers, leaving old laptop-headed-readback.mjs immutable. One
baseline first; inspect profiler-cli exports using named session + explicit
loopback symbol server + finally cleanup. Only run candidate if request marker
identity and positive phase coverage are adequate. Same CLI-normalized clock
for UserTiming/IPC; prefer send-only instant IPCFlow over derived paired spans.
Preserve24MiB profile bound/256MiB artifact cap/120s capture, private roots and
exact owned cleanup. Existing standing disposable-laptop authority applies;
desktop daily browser/profile/install remain protected. No speedup claim yet.

## October 5 Laptop Hardware Pixel Comparison

Using the standing disposable-laptop authority, one headed baseline and one
headed original readback candidate ran sequentially on X11 :0. Both PASS:
12.348s/12.145s, Intel Iris Xe RPL-P, Mesa25.2.8, WebRender, native VP9 decoder
hardwareAccelerated=true. Existing strict context comparator admits both;
all18 paused-frame/draw cases have exact matching hashes and12 stable draws.
Two seek frames remain distinct. No pixel tolerance or product preference change.
This closes the small-clip same-backend pixel gate, NOT actual cache-hit/provider
proof, full-resolution parity, sustained playback, timing or YouTube causality.

Baseline is sealed Oct1 Build20261001103920, libxul2a8eb56c...; candidate is
original readback Build20261003071500, libxul82faf416... (NOT later inline1e2e...;
build ID alone is insufficient). Full46-file copies/postchecks PASS unchanged.
Both parent app/local/temp/TmpD receipts pass. Two controllers+22 sampled browser
PIDs absent; clean SIGTERM/0drops. Saved artifacts peak188249817/153877027B.
Logs retain EPERM and successful VA-API iHD initialization. No installation,
build, desktop browser, personal profile or native/source changes.

Remote inputs: ~/.cache/codex/laptop-headed-input-20261005-agyCHg.
Remote runs: ~/.cache/codex/laptop-headed-readback-{baseline-20261005-omEESn,
candidate-20261005-pjUWdi}. Local61-file evidence verified under
artifacts/umbralink-control/laptop-headed-readback/saved; manifest8a9daed7...,
20-file harnessbef3b98c... unchanged. Focused106tests PASS, exact replayPASS.
Report bot-docs/reports/performance/2026-10-05-laptop-headed-readback.md.
Next gates: larger media, hardware same-frame vs new-frame behavior, actual
readback/cache routing, and matched sustained-playback observers/resources.
Existing sustained90s1080p asset is pinned aac5b2c5...; prior60s headless pilot
left only2.60MiB headroom. Do not repeat long baseline blindly or raise caps.
Owner laptop testing permission is not still pending; desktop consent remains.

## October 4 Laptop Test Authorization

Wyatt approved the pending 30-second disposable headless native-temp check,
then clarified: "Whenever you need to. wyatt-laptop is mainly a bot machine."
Use the laptop for isolated test/profiling browsers as needed; this does not
authorize disturbing his desktop work browser, personal profiles, or installs.
Keep per-run limits, owned-root checks and cleanup. Native-temp check subsequently
PASSED: one headless laptop browser, 11.324s inside30s, exact parent app/local/temp
and TmpD paths, Build20261003071500, clean SIGTERM/0drops. Browser865122,
controller865110 and all10 sampled browser children absent. No desktop browser,
profile, install, build, preference-default or staged-index changes.
Report bot-docs/reports/performance/2026-10-04-browser-temp-native.md;
evidence artifacts/umbralink-control/browser-temp-native/.
Remote harness browser-temp-harness-20261004-YOFDRs; run
/home/wyatt/.cache/codex/browser-temp-native-20261004-ZRBCxx.
Pinned baseline package postcheck PASS, no updater additions. Five samples peak
187920913B under256MiB, headroom80514543B; not continuous/all-writes isolation.
Harness18file manifest dd217621...; export26file manifest9c60f258... verified.
92focused tests PASS; earlier447 full suite remains evidence for unchanged shared
harness. New diagnostic entrypoint only, no performance result. Native directory
gate is cleared for future bounded isolated laptop work; do not keep asking the
owner for each disposable laptop browser. Desktop work-browser consent remains.

## October 3 Short Capture Budget

Owner was asked for ONE disposable headless wyatt-laptop native-temp proof,
30s total, no workingbrowser/profile/install touch. NO reply yet. Do not launch
until approved; no headed permission implied. No remote/browser/native work
in this follow-up. Existingcapture had120s hardcoded, so added optional workload
timeoutMs integer30000..120000 shorteningonly; default120s unchanged.
createLocalCaptureBudget wraps same lifecycle deadlines with fixedreduction;
30s gives15work/13ordinarycleanup/2terminal, fromcaptureentry notspawn. Existing
lifecycle planlimits/caps/quiet/prefs unchanged. Only readbackcapture+spec edited.

RED11PASS3FAIL includes2missingexportscaffolds;14green,15cleanupintegration;
full447PASS15.6s, exact2lint0. Actual finishLifecycle +fakeops proves reserve and
firstfailure retention; no nativeprovider/guaranteedOSexit proof. Frozen earlier
capturecopies retainedin artifacts/umbralink-control/browser-temp-proof/.
Saved<=20s samples headroom baseline80503036B,candidate204784307B; oldexternaltemp
uncounted so NOT futureadmission/no-allocationclaim. No priorfailed evidence
discarded/capchange/securityoptout. Report
bot-docs/reports/performance/2026-10-03-short-capture-budget.md.
Final18file127267B browser-temp-proof-final.sha256 independentlyPASS, SHA
f94bdb2f07beedd9688490f8ae5f1875e39ef19208ad75b1a9a59617b820ecf0.
Capture now69189881/spec981f4d90; oldprivate-temp seal34 has32unchanged plus2
intentionalcurrentcapture changes with matchingbeforecopies. Indexunchanged.
Beforeanyrun needexactfreshpackage/driverprovenance, headroompreflight, receipt,
ownedcleanup/PIDabsence and non-claim of startup/video improvement fromproof.
After three consecutive goal turns with this same pending approval, broader
performance goal marked blocked, NOT complete. Last continuation only rechecked
the18file seal; no runtime/test job remains in progress. Resume after explicit
owner decision, revalidate current code/artifacts/host and preserve all holds
outside the authorized scope. Further engine edits need measurements, not guesses.

## October 3 Browser Temporary Directory Tooling

Shared launch helpers now create/retain/recheck third private child root/temp
with existing0700/owner/canonical/empty/distinctdevino/originalidentity checks.
Force child TMPDIR/TMP/TEMP for all suites/profilemodes; no parentenv/HOME change.
Provenance includes tempDir+creation stamp+effective env. Readback capture adds
native PathUtils.tempDir AND TmpD matching to existing private-roots RPC, before
workload, raw reply saved before rejection. Expected paths validated beforeRPC.
Generic runner/parity inherit env but NOT this extra native receipt gate.

Six tooling/testfiles only; no browser/native/build/install/remote/profiler run.
65baselinePASS; RED56PASS10FAIL includes missingexport scaffold; firstGREEN66;
newnegative67PASS1FAIL exposed preRPC validation gap; fixed131focusedPASS.
Final443PASS16.1s, exact6lint0/formatcheckPASS. Harmless Node child os.tmpdir
inherits ownedtemp; VM nativebody tests NOT realbrowser proof. New nestedtemp ZIP
and stagingfile test counts under unchanged256MiB cap, cap+1 rejects. Existing
explicitprofile allowance/cadence/deadlines unchanged. All sessions terminal.

Report bot-docs/reports/performance/2026-10-03-browser-temp-containment.md;
evidence artifacts/umbralink-control/browser-temp-containment/, before0..5
snapshots + exact implementation.diff + final verification. Native63/footprint64
oldseals stillPASS. Oldpair141 has only3intentional currentsource mismatches
helpers/run/readbackcapture; beforecopies matchhistorical hashes, other138pass.
No oldartifact/report/manifest edits; stagedindex3b78253c unchanged.
Final34file695355B seal browser-temp-containment-final.sha256 verified; SHA
f712eddd86b4d56b4dfbccc999f0ed05a6fcf8f0152bd750640709ac66dc71a1.

Browserruntime/headed holds remain. Native temp provider stillunverified; prior
xpcshell receipt is differentprovider. No race-free/all-I/O/no-network guarantee.
Next separatelyadmitted shortnative receipt plus headroom-safe fixedearlystartup
comparison; prior1.0035MiB sampledheadroom is NOT cleared by containment. Do not
raise caps/delete caches/disable securityupdates; attachmentcleanup andSuggest
changes need separate causal comparisons. No new playback/stutter gain claimed.

## October 3 Attachment Cleanup Native Verification

Supersedes the not-run native gate below, but NOT browser-runtime holds.
Direct existing xpcshell harness, scratch single-file manifest and private
profile/TMPDIR roots: first FAIL revealed test IOUtils hooks used wrong global;
Cu.getGlobalForObject(Downloader).IOUtils correction makes real native suite
PASS. Final verbose run156assertions/0fail, realZIP/IndexedDB/partial-write/
removal-failure paths. Module dbb94573 unchanged; test now50617a38. Prior test
c9bd26cc reconstructed/verified in new evidence; old seal remains historical.
Native receipt verifies PathUtils.profileDir/tempDir and TmpD exact owned
profile; sharedIOUtils=false, cleanupPresent=true. NOT browser provider proof.

Report bot-docs/reports/performance/2026-10-03-attachment-cleanup-native.md;
evidence artifacts/umbralink-control/attachment-cleanup-native/.
Run4R4nWR FAIL preserved; runjUJT8h firstPASS buffered (childPID not retained);
runhAgiWL finalverbosePASS controller2358965/xpcshell2358989 absent05:18UTC.
42actual-source regressionsPASS, scopedlint0, indexunchanged. Explicit env
nonlocalblock1/crashreporterempty/profiler0/FOGtestport-1;120sSIGTERM outerbound,
alltests<0.5s/no timeout/noSIGKILL. UnusedHTTP2/3 warnings retained.
No browser/build/package/install/personalprofile/launcher change. No measured
video/stutter benefit. Next browser private-temp containment/native receipt and
headroom-safe startup comparison, not unqualified performance repeat.

## October 3 Attachment Bundle Cleanup Source Candidate

Implemented only services/settings/Attachments.sys.mjs and existing
services/settings/test/unit/test_attachments_downloader.js. Both were clean;
originalmodule9fc987ba... equalssealedpackagedsource. readZipEntry attempts
both streamcloses retaining firstfailure including null/undefined. cacheAll
finally closesreader before bothZIP/.tmp removals, no removal beforewrite;
cleanupfailure visiblefalse/warn, not guaranteedOSsuccess. Entryclosefailure
now omits that record beforebatching (unhealthy-path partial-cache difference).
No prefs/security/network/native changes. Normaldata/50batch/resultshape preserved.

Actualfullsource VM/fakeIO tests RED8PASS28FAIL after preserved initial wrong
relativepath scaffoldingerror; final42PASS inclfailurematrix/concurrency/falsy
errors. Tests under artifacts/umbralink-control/attachment-cleanup/test/;
no realZIP/native/browser/server/filesystemfixture execution. Nativeexisting
tests enhanced5paths +2newpartialwrite/removalfailure; NOTRUN. Nativeacceptance
must use reviewed ownedroots/TMPDIR; currentbrowserruntimehold unchanged.
Sourcechecks confirm underlyingzipstreamClose idempotent; not runtimeproof.
Oldpackages/originalfootprintreproducer untouched (oldpackagerepro remainsRED).

Report bot-docs/reports/performance/2026-10-03-attachment-bundle-cleanup.md;
evidence artifacts/umbralink-control/attachment-cleanup/; finalseal
attachment-cleanup-final.sha256. Keep separatefromsealedSuggestA/B. No
build/package/install/staging/commit; ownerbrowser/profile stillprotected.
Next nativeunit isolation/admission, then realGecko suite; notyetrelease-ready,
not a measuredspeedup or claimedvideostutterfix.

## October 3 Startup Footprint and Attachment Cleanup Reproducer

Offline audit of the stopped nativeB matched startup pair. Report
bot-docs/reports/performance/2026-10-03-quicksuggest-footprint.md and evidence
artifacts/umbralink-control/quicksuggest-footprint/. No browser/profiler/native
build/install/source change or fresh remote process this turn. Existing runtime
HOLD and owner desktop/headed-window boundaries remain.

Post-exit metadata reconciles candidate125845143B vsbaseline249953213B, delta
124108070B. Suggest store+sidecars35651584B plusRustRS77863880B account113515464B;
both absentcandidate. Otherdelta10592606B, mostlycache. Both security_state
23854084B/66files; equalbytes NOT content equality/CPU attribution. Shared
22->27s logicalbytesjump75412953/79442002; transiententries4269/4564 around32s
fall409/704 around37s. Oldbaseline267383189B peak/1052267B headroomunchanged.
Later shrinkage does NOT clear long-repeat gate. Only savedmetadata read,
no profile bodies/systemtemp/sharedqueues inspected.

Ten exact modules extracted from both pinnedjars; fullarchive+entryhashes pass,
allten byteidentical. Security intermediate cacheAll/import/deleteAll and CRLite
source paths map plausible sharedwork, not measuredcausality. Newconcretebug:
Attachments.sys.mjs cacheAll writes PathUtils.tempDir ZIP but no explicitclose
orremove. WholepackagedmoduleVM/mockIO reproducer3controlsPASS4desiredcleanup
FAIL (success/open/read/cacheerror), retained intentionally RED. No realnative
handle/tempfile lifetime claim. SeparateLZ4startupbundle does finallyremove.

Saved childenvs omit TMPDIR/TMP/TEMP; upstreamUnixproducer fallsback/tmp; actual
native tempDir unqueried. Existing appdata containment/ownedtreecap therefore
NOT fulltemporary-write coverage. No globaltempinspection/deletion authorized.
Next: narrow deterministic attachmentcleanup sourcefix + error/lifecycle tests,
nativeisolated acceptance separately; do NOT altersealedpair. Futuremeasurement
needs ownedprivate tempdir+receipt and shorterpredeclared earlystartup capture,
not capincrease/securityoptout. Sixmetadata/timeline testsPASS; cleanupRED not
countedgreen. Newseal quicksuggest-footprint-final.sha256; priorpairseal retained.

## October 3 Matched Native Startup Pair

New scratch quicksuggest-updates-pilot.mjs + spec composes sealed original
prepare/capture/driver/cleanup with new installation-updates adapter. Saves
prelaunch original inventory+policy;45s composed copy/enrollment within60s prep;
same120s browser/15s cleanup/256MiBcap/32MiB startup reserve. Explicit new entry,
old driver unchanged. Local+remote75PASS, exact2filelint0; held-preparation RED
fixed with abort-aware wrapper. 6MB proof negative object-comparison probe timed
out10s; changed to raw pinned bytes as sole authority, positive+3negativePASS.

ACTUAL pair PASS (candidate then baseline), commonnativeB Build20261003071500,
both US/en-US initialized/no main/regional userprefs. Candidate main/effective/
backend/AMP false both boundaries; baseline alltrue both. Native functional
confirmation, NOT causal speedup/video/GPU/YouTube verdict. Headed consent still
pending and owner desktop/profile/install/launcher untouched; candidate uninstalled.

Remoteharness ~/.cache/codex/quicksuggest-updates-harness-20261003-d8YQlj/input
contains full pinnedpair.21harness hashes before/after;both46filepristine packages
verified. Actualroots ~/.cache/codex/quicksuggest-updates-startup-20261003-:
candidate NXA6xB browser670568/controller670095 04:18:18.137-04:18:59.477Z Oct4UTC;
baseline ov103a browser673933/controller673442 04:22:35.789-04:23:17.144Z.
Both cleanSIGTERM/log182B0drops;all11sampledbrowserPIDs+controller each absent
independently04:24:55Z. Postcheck exactemptyupdatestrio+emptylock passes; old
failedrun remainsFAILED and sealed. No retry or further runtime this milestone.

First snapshots at10.969/11.010s: candidate parentCPU3771ms vsbaseline6643ms.
Next30s adds7481/7474ms: substantial common backgroundCPU remains; no causal
attribution from one ordered pair. CPUproducer inspectedlocalsha3aaa1ba0...matches
pinnedpackagedmodule bothvariants. Artifactpeak139072872 vs267383189B; baseline
only1052267B(1.0035MiB)remaining undercap. RUNTIME HOLD on further repeat/extension
pending headroom review, no capincrease/cachedeletion.22global+16relative samples
independentlyPASS; RSS safety only, no heap claim, no finalsize/continuouscoverage.

70exportfiles254942B hashedlocalcopy ~/.cache/codex/quicksuggest-startup-pair-
evidence-20261003-WDFtT6/{candidate,baseline}; no profile/appdata/token contents
exported or opened by post-run audit; runningharness uses ownprivate discovery
and ownedrun metadata accounting as before.
Logs+summaries artifacts/umbralink-control/quicksuggest-updates-pilot/;
report bot-docs/reports/performance/2026-10-03-quicksuggest-matched-startup.md;
newseal quicksuggest-updates-pilot-final.sha256 (141files6661283B verified).
Reportlint0;all commands terminal. Original stagedbaseline unchanged.
Next offline artifact-trajectory review; then bounded counterbalanced startup
measurement. Do not pool with older nativeA video or claim playback fixed.

## October 3 Prospective Empty Updater Directory Adapter

New scratch installation-updates.mjs + test/installation-updates-spec.mjs are
implemented, not wired to browser-launch main. Old installation-state/pilot
helpers and failed actual candidate evidence remain unchanged. New enrollment
requires the original in-memory receipt still pristine, no preexisting lock or
updates path; no retrospective waiver. Exact optional full updates/{0,downloading}
tree only: captured 0755&~umask, owner/device, unique inodes, nlink4/2/2 and root
nlink+1. Original identities and hashes retained, optional old emptylock rules.
Shared20s/abort; completed latest observations retained; no repair/delete/writes.

27 new tests +20 installation +1 strict-tree +17 pilot =65PASS. Initial18PASS3FAIL
and later26PASS1FAIL retained; latter fixes stale failure observation after a
second-inventory race. Real tiny filesystem fixtures plus typed-data/fake-clock
checks, no browser/native/server/client/remote execution. Exact2file lint0 and
PrettierPASS. Six prior seals verify; stagedindex unchanged231628B SHA3b78253c...
Report bot-docs/reports/performance/2026-10-03-installation-update-policy.md;
logs artifacts/umbralink-control/installation-updates/ and new seal
installation-updates-final.sha256 (30 files,170574 bytes,verified). Reportlint0;
all commands terminal. Point-in-time only, no race-free or no-network claim.
Existing failure staysFAILED. Ownerdesktop protected; headedGPU pending.

Next: new bounded driver composes prepareInstallation->admitStartupUpdates and
finishInstallationCheck(...,{verify:verifyStartupUpdates}), within unchanged
preparation/runtime/cleanup/resource bounds, saves policy+failed observations.
Do not change sealed old main. Integration tests/review before browser retry;
runtime HOLD at this milestone. Matched region/locale baseline/candidate nativeB
comparison still needed; inactive baseline cannot prove activation cost.

## October 3 QuickSuggest Actual Candidate Pilot

One headless laptop candidate launched; capture PASS but OUTER DRIVER FAILED.
Do not retry/relabel. New empty installation updates/{0,downloading} directories
violate frozen installation policy (root nlink7->8). Optional lock0B0664uid1000
also present. Postexit all46 original bytes/modes/sizes match475119407B; no
original-inode postcheck acceptance claim and no writer/download attribution.
Source packagedUpdateService getUpdateDirCreate createsdirs underUpdRootD,
ready/downloadinghelpers match; asyncInit obtainsready before reading status.
Automation-only alternative path unsuitable; no prefs/engine/limits changed.

Actual browser647857/controller647843,03:29:21.315-03:30:02.699Z Oct4UTC
(Oct3Phoenix),41384ms. US/en-US bothnative receipts inittrue, regionflag/main/
effectiveMain/backend/AMPfalse and no main/regionaluserprefs.30.015892s span,
profilerOFF;11samples capsPASS,baseline63687133B,peak139194736B leaves129240720B.
No baseline/performance/video/GPU claim. CommonnativeB Build20261003071500;
older sustainednativeA differs.11sampledbrowserPIDs+controller independently
absent,cleanSIGTERM,182Blog0drops EPERM+headless+SWGL only.

Remoteharness ~/.cache/codex/quicksuggest-startup-harness-20261003-O21Ohh;
run ~/.cache/codex/quicksuggest-startup-20261003-ejIYH6;
localevidence ~/.cache/codex/quicksuggest-startup-evidence-20261003-NUsAON.
35exports114276B perfileSHA verified; no profile/appdata/credentials copied.
17harnesshashes pre/postPASS,38remoteNode tests beforelaunchPASS. Allcommands
terminal. Evidence artifacts/umbralink-control/quicksuggest-startup-runtime/;
report2026-10-03-quicksuggest-startup-pilot.md. Prior5seals unchanged.
New58-file quicksuggest-startup-pilot-final.sha256 verified; reportlint0,
index unchanged231628B SHA3b78253c... . UpdateService extractedfromactualjar
SHAfeb2bce2...matchespinnedpairentry. No tests/lint/transfer/browser remainactive.
RuntimeHOLD again: prospective narrow empty-update-directory policy+tests/review
needed; preserveoriginalfailure. No disabling updater/deletingcache/capbump.
HeadedGPU consent stillpending; ownerdesktop remainsuntouched.

## October 3 QuickSuggest Paired Startup Preparation

Prepared local diagnostic pair, NOT launched/transferred/installed:
~/.cache/codex/quicksuggest-pair-20261003-irw3ksmr/{pair,pair.json}.
Proof SHA ecbde46a0a2704883bd7cea626ba23d2cbf54a7013c809d5cf574ef17ee79aff.
Same native B/libxul1e2e164e... both sides; Build20261003071500. This differs
from earlier sustained nativeA; do not pool. Both omni archives repacked equally;
actual audit46files,2676+5368entries, exactly QuickSuggest/UrlbarPrefs/packagedpref
delta; all nonarchives identical. Both pristine trees admitted+postchecked,
no .parentlock. Baseline475118954B/candidate475119407B.

New scratch quicksuggest-artifact.py, quicksuggest-pair-audit.py,
quicksuggest-pilot.mjs +2specs. Pilot fresh-copy/strict in-memory admission,
60s prep/45s abort-composed copy, existing captureLocalWorkload120s browser bound,
32MiB startup sampled reserve inside unchanged256MiB run cap; no video/pref
overrides. Two Suggest+performance receipts over>=30s, strict parent/context,
region/locale/profiler checks. Final native cleanup+independent root absence
before package postcheck. Original errors survive terminal-write failures.
Source pair never executed; installer/driver outside monitored run subtree.
74NodePASS(17pilot+57regressions),4pair+9archivePASS, scopedlint/Ruff0.
BehavioralRED11pass3fail preserved; zero-test Python discovery retained then
explicit file runs pass. No browser/server/client/native execution; no owner
browser/profile/launcher changes. Report2026-10-03-quicksuggest-paired-startup.md,
evidence quicksuggest-pair/, verified45-file seal quicksuggest-pair-final.sha256.
Prior sustained/startup/region/installation seals still verify; stagedindex
unchanged SHA3b78253c... (231628B). All test/lint/audit sessions terminal.
Main/dependencies and runtime remain gates; no quiet-host evidence or transfer
yet. Runtime HOLD at this preparation checkpoint; headedGPU permissionpending.
Need separately admitted candidate startup then matched region/locale baseline;
inactive/unknown baseline cannot demonstrate activation cost. No speedup claim.

## October 3 Prospective Installation Write Policy

Scratch installation-state.mjs +test/installation-state-spec.mjs now implement
admitInstallation/verifyInstallation for future fresh private Linux packages.
In-memory immutable original identity/manifest; original strictverifyTree reused
unchanged; only optional NEW empty root/.parentlock, owneruid,nlink1,exact captured
0666&~umask mode accepted postrun. All code/hash/modes/inodes/dirs unchanged,
unlisted dirs and symlinks reject. Complete failed observations retained+cause.
20s bound/composedabort; streaming inventory; notracefreesandbox/no writerclaim.
21 filesystem Node testsPASS including originalhelperregression, scopedlint0.
NO runtime/remote/native/product/sharedharness change. Original runtimeFAIL,
26/152/region seals and stagedindex mustremainunchanged. New report
bot-docs/reports/performance/2026-10-03-installation-write-policy.md; scratch
installation-state/ logs and installation-state-final.sha256.
Not wired into driver yet. Next actualgate: freshexclusivepackage preparation,
frontendcandidate jar/provenance integration, savedfailure/cleanup handling and
boundedstartupheadroom without cap/cachepref changes. Runtimehold stillapplies;
headedGPU consentpending. No activeowned browser/test/lint processes at close.

## October 3 QuickSuggest Regional Control Candidate

Uninstalled frontend patch now exists in three product files: firefox.js adds
browser.urlbar.quicksuggest.regionDefaults.enabled=false, UrlbarPrefs registers
it, QuickSuggest returns original-default copy when false and reinitializes
defaults/features on changes. No early init return; user branches/migrations/
Nimbus logic retained. This is NOT an experiment lock or zero-startup-work claim.
Explicit main enable may still need category/gate opt-ins; new flagtrue restores
old regional behavior. Existing data stays untouched. No native/backend edits.

Test profiles unittest-features+xpcshell opt into old behavior; dedicated new
test_quicksuggest_regionDefaults.js manifest setsfalse. Talos/Raptor unchanged.
Separate source replay (region, not sealed startup replay) runs realQuickSuggest
init+actualAMP/RustJS with pref/Nimbus/native mocks and otherfeatures inert.
RED11pass10fail ->21pass; two added queue/idempotence tests +old13 =36PASS.
New native regression authored/linted NOT RUN; native/browser integration still
pending. ESLint0errors/1preexistingPreferenceswarning (baseline reproduced).
No browser/native/build/install/remotehost/profile access. Indexunchanged.
Report bot-docs/reports/performance/2026-10-03-quicksuggest-region-control.md;
evidence artifacts/umbralink-control/quicksuggest-region/ and region-final.sha256.
Prior26+152 seals unchanged. Runtime hold (.parentlock/headroom), pending headed
GPU consent and ownerbrowser protection remain. No speedup or stutter proof.

## October 3 QuickSuggest Startup Audit

Source-only follow-up to sustained footprint; no browser/native runs or product
edits. New report bot-docs/reports/performance/2026-10-03-quicksuggest-startup.md.
Disposable metadata walk sustained-footprint.json: postexit250921974B, remote-
settings77962256B, suggest.sqlite35618816B. Earlier live265713225B peak remains.
Do NOT equate timestamps/file sizes with CPU/network/stutter attribution.

IMPORTANT correction: false packaged Suggest defaults also exist upstream;
regional activation is deliberate, not proof user opt-out is ignored. Umbrafox
hides its Settings controls but keeps startup activation. Packaged manifest
browser-idle-startup registers QuickSuggest.init; BrowserGlue category dispatcher
calls it (old direct-call comment is imprecise). US/en-US or DE/de regional prefs
enable main+all+sponsored. Explicit main userfalse blocks store/ingest in replay;
category-only false stillopensstore. Constructor stillobtains shared RS service.

New pinned full-source Node replay quicksuggest-startup-{replay,audit}.mjs with
test/quicksuggest-startup-spec.mjs:13PASS,8savedcases. AST module-wrapper removal
only, real #initPrefs via_test_reset plus AMP/Rust featureupdates, noexperiment;
native/storage/timer/telemetry/otherproviders mocked/omitted. Not fullstartup,
nativeintegration, actual runtimeprefs, performance or stutter proof. Source/
prefhashes pinned; excerpts/results/logs quicksuggest-startup/. No sourcefixyet.
Potential correction: explicit control of regionalautoactivation preserving
userchoices/migrations/Nimbus; don'tearlyreturninit (pendingpromise/laterchanges),
don'tdisableglobalRS/security. Runtimehold forpackage.parentlock/headroom and
pendingheadedGPUpermission unchanged. Prior152seal and indexmuststayunchanged.
Final 26-file seal (464530 bytes) quicksuggest-startup-final.sha256 independently
verified; prior sustained152-file seal verified. Source/report scoped lint0,
diffcheck0 and original staged index unchanged. All commands terminal. The
failed named BrowserComponents extraction was empty and removed; accepted
packaged registry is components/components.manifest (merged during packaging).

## October 3 Sustained Playback Fixture And Held Capture

New scratch-only sustained-{fixture,capture,smoke,audit}.mjs +tests; existing
tool/product sources unchanged. Owned90s1080p30H264High/noaudio testsrc2 clip,
22606489B SHAaac5b2c571eff675332728d94291137bf184c41644d7beb6f8467fee05907d27.
Two-thread encode;2700frame probe/full decode PASS. New bounded server32MiBinput,
128requests/<=128MiBreservations, immutable clone, ranges+aborttested. Two capture
plans sampled31/endpoints2 over nominal60s; endpoints fake-tested only.
42focusedPASS, scopedwhitespace/trojan0; native sampled integration completed
BUT outer driverFAIL1 post-packagecheck. Do not call full run accepted.

Laptoproot sustained-smoke-20261003-ISg834, harness sustained-harness-20261003-kj061s;
localcache sustained-evidence-20261003-ISg834 (71files1254657B+manifest).
Runtime01:26:29.204-01:27:41.088UTC Oct4, browser621514/controller621500 absent
independentaudit01:31:33.749Z. 31samples/30intervals60444.241163ms/60.385107smedia,
1812frames0drops0noadvance; NOTGPU/scanout/YouTube/performancegain proof.
17resourcecapsPASS,maxartifact265713225B leaves2722231B=2.60MiB only.
CleanSIGTERM/0logdrops/182BknownEPERM+SWGL. SameBuild20261003071500/nativepairA.

IMPORTANT: existing shared disposable nativepair
~/.cache/codex/mutation-inline-harness-20261003-F4qaX4/A now has extra .parentlock
(0B0664uid1000,birth01:26:59.774Z). Original46file hashes/modes/sizes stillmatch;
separate exact47entry audit includesextra. Original strictverifyTree rightlyFAILS.
No deletion/manifest relaxation/retry. Upstream UpdateMutexImpl locks UpdRootD,
LinuxnsXREDirProvider maps it to executableparent; plausible source route only,
notactualwriterstack or loaded-sourceproof. No new profile/update/networkclaim.
Before reuse: explicit bounded install-write policy/freshownedpackage and disk
headroom; no broadcacheprefs/capbump. Headedlaptop consent STILLpending. Owner
browser/profile/installprotected. Broadgoal ACTIVE, no new agents/build/commit.
Report bot-docs/reports/performance/2026-10-03-sustained-playback.md.
Finalseal artifacts/umbralink-control/sustained-final.sha256:152files70267058B,
independentlyverified; prior92seal/41local+remotehashes/71exportsPASS. Real-data
replay1PASS (30intervalexact+9badjoinstate+CPUunknown), report/auditlint0,
indexunchanged/diffcheckPASS. All encoder/probe/decode/test/lint/transfer/controller
commands terminal. Lock preserved; no runtime after initialpostcheckFAIL.

## October 3 Playback Admission Repair

Video preparation found genuine diagnostic guards missing in capture-playback:
undefined document/source identity admitted; null/string CPU coerced; duplicate
PID joined first row. Only that tool+spec changed. Now strict doc/hash/clocks and
safe CPU counters, unique PID/stable childID+type; invalid CPU staysnull while
valid playback survives. ExplicitnullchildID/zeroCPU/>100% remainvalid. Browser
read body/RPC cadence/valid output unchanged; no product/native/public change.
RED22pass2fail ->24focusedPASS; final306combinedPASS9.222s/exact2lint0. Source
beforearchive/diff retained. Existing stagedindex preserved.

One isolatedheadless laptopsmokePASS: unchanged4s320x240VP9 asset;2015.422057ms
interval/1.983548sadvance/60frames/0drop. NotGPU/sustained/YouTube/speedup proof.
Real11processCPU rows valid; savedsummary exactly reproduced AND equals original
purefunctions from beforearchive.5resourcecapsPASS/maxartifact153598347B;
cleanSIGTERM/0drops/182B EPERM+SWGL knownlogs. Browser613901/controller613887
independentlyabsent01:12:13.237ZOct4; notexhaustivecleanup/no-network proof.
Localcache playback-admission-evidence-20261003-3JypVi (30files136021B+manifest);
remote capture omit evidence-; harness playback-admission-harness-20261003-TzaHwE.
34bundledhashes pre/postPASS. All tests/runtime/transfer/lint terminal.
Report bot-docs/reports/performance/2026-10-03-playback-admission.md; seal
artifacts/umbralink-control/playback-admission-final.sha256. Sustainedfixture NOT
finished: longer pinnedmedia stillneeded; headedGPU windowconsent pending, normal
browser/profile/install protected. Inlinecandidateheld; broadgoal ACTIVE.
Final92-file seal1316244B independentlyverified; preceding544-file seal retained
and verified. Indexunchanged/diffcheckPASS. Finalreportlint0 and no matching lint
process remains. Seal generation initially rejected exported run/ directory;
corrected to exact30-file manifest enumeration before any seal write. No new
runtime. Owner asks nextstep: sustained quiet-laptop GPU/video comparison;
headed-window consent remains pending, not implied by headless authorization.

## October 3 Identical-Build Layout Controls

Completed fixed16 fresh headless laptop processes, eight adjacent pairs
AA/AB/AA/BA/AA/BA/AA/AB, profilerOFF, unchanged nativepair+version6fixture.
AA median-time differences+9.52/-9.09/+10.98/0%; B/A+4.76/0/+4.88/-3.33%.
WholecontentCPU AA+0.71/-10.03/+5.03/-2.85%, B/A+2.84/+1.30/+4.34/-0.87%.
Control variation is material; fourpairs each does NOTprove statisticalequivalence
or clear smallregression. Candidate staysUNINSTALLED; do not repeat until a
desired sign appears or modify layoutsemantics on this evidence. Older batches
remain separate. Next headed matchedbackend GPU/video pending explicit window
consent, asked again this turn; no ownerbrowser/extension/profile/install changes.

448sampleoracles/80sampledcapsPASS,maxartifact188104420B. AllcleanSIGTERM/0drops,
182B knownEPERM/headless/SWGLlogs. Native roots/build/doc/inactive userland+profiler
OFF receipts pass. All17exactroots absent remoteaudit01:00:22.700ZOct4, later
independentabsence also saved. Notexhaustivecleanup/no-network/hardwareproof.
Localcache interleaved-control-evidence-20261003-HYqo3u (485files1429054B+manifest),
remote captures omit evidence-; harness interleaved-control-harness-20261003-50NKKF.
30bundledhashes pass before/after. New scratchonly, no production/toolsourceedits.
71combinedNodePASS14.135s beforelaunch; final7focused/replayPASS1.068s including
80realcapturecorruptioncases, not disjointcounts. Scopedwhitespace/trojanlint0.
Report bot-docs/reports/performance/2026-10-03-interleaved-controls.md; seal
artifacts/umbralink-control/interleaved-control-final.sha256. Goal ACTIVE.
Final544-file seal2547174B and prior304seal independentlyverified; doc/source
scopedlint0/diffcheck0/indexunchanged. Final17rootabsence01:02:01.500ZOct4.
No owned browser/controller/test/lint/transfer remains active at checkpoint.

## October 3 Interleaved Sampling Attribution

Four fresh headless laptop cells A-OFF/B-sampled/A-sampled/B-OFF pass; same sealed
46-file native pair and unchanged version6 fixture as below. Trial medians
41/47.5/55.5/45.5ms. Sampling reverses A/B direction; singlecell/order-confounded,
not regression clearance or calibrated overhead. Candidate remains UNINSTALLED.
Matched native symbols show Layout740/802active(A),623/685(B), chiefly reflow and
style. No sampled gate row is not zero overhead proof. No speculative layout
change or YouTube/GPU claim. NEXT fixed profiler-OFF same-build controls plus A/B
and content CPU deltas to measure drift. HeadedGPU consent remains separate.

112sample oracles/20sampledcapsPASS,maxartifact202936207B;4cleanSIGTERM/0drops.
131exportedfiles14482928B at cache/interleaved-profile-evidence-20261003-7N7bTZ;
remote captures omit evidence-, harness interleaved-profile-harness-20261003-rnuMdO.
Actual profiler-cli0.10.0 +Samply0.13.1 matchingGNU-ID symbols via explicit owned
loopback endpoints; no manual raw JSON parsing. Exports cache/interleaved-profile-
symbols-20261003-{A-5rnSbp,B-WbM0UG}; ~4.6% address-only self remains. Native
brackets converted only for CLI input; exact returned raw ranges asserted.
Before/after same contentPID/windows CPU deltas saved, not mainthread/case-only.
Recorded5laptop roots independentlyabsent00:46:12.289Z Oct4;4analysisroots/sockets/
ports37523/37524absent00:46:12.520Z. No exhaustive cleanup/network-sandbox claim.

Only profile-capture.mjs+spec testtool adapters changed; original fixture untouched.
Final70NodePASS13.639s/scoped2lint0; sourcearchive+reviewdiff retained. All27bundle
hashes/previous599sealPASS,indexunchanged. Report
bot-docs/reports/performance/2026-10-03-interleaved-profile.md; newseal
artifacts/umbralink-control/interleaved-profile-final.sha256. Owner browser,
profiles/extensions/install/launcher untouched. No owned runtime remains active.
Final304-file seal21517508B independentlyverified; prior599seal reverified.
Report codespell/whitespace/trojan lint0; diffcheck0. Mutable continuity and
large symbol caches excluded from seal. Do not change sealed evidence in place.

## October 3 Isolated Interleaved Follow-Up

18 new headless laptop processes passed the fixed isolated layout fixture:
2 semantic, 8 ABBAABBA, 8 BAABBAAB. Same native pair as below, no engine edits.
Process-median A/B: 43.25/43.75ms and 40/42ms (candidate 1.16%/5% slower).
Five adjacent pairs slower, two faster, one tie. No significance or causal claim;
candidate remains UNINSTALLED. Next sampling-only CPU attribution on this exact
fixture, then headed GPU only with consent. Owner browser remains protected.

504 sample oracles / 90 sampled resource caps pass, max artifact188072524B;
all clean SIGTERM, zero log drops. Native private roots, documents, runtime hashes
pass. EPERM/SWGL warnings retained. All21 exact browser/controller roots absent
at00:33:18.642Z Oct4; no exhaustive descendants/no-network claim.
Local536 evidence files1424631B plus3 manifests: cache/interleaved-inline-evidence-
20261003-{kd6shu,ErHMnO,CtqqOe}; corresponding remote roots omit evidence-.
Remote harness interleaved-inline-harness-20261003-RDIktu; reused pair F4qaX4.
Five test-tool files only; mixed collector and timed loop source unchanged.
Final50 test groups PASS13.655s; scoped lint0; retained before-source tar+diff.
All24 bundled hashes pass; staged index unchanged. Report
bot-docs/reports/performance/2026-10-03-interleaved-inline.md; seal
artifacts/umbralink-control/interleaved-inline-final.sha256. No owned run active.

## October 3 Inline Mutation Page Comparison

Latest verified step:18 fresh headless laptop processes PASS (2semantic,8forward
ABBAABBA,8reverseBAABBAAB). Identical46-filepair exceptlibxul: A d0013852 mirror,
B1e2e164e inline; allJS/resourcesNEWcommon,Build20261003071500. Pair proof
92cc0076f575b28b93c87c1135df544e2630e25c57d2bb40d2d31cfd280e2d86.
PageWindowcollectorff39082... unchanged,80samples/process/normalclocks/profilerOFF.
Forward/reverse detachedtext processmedians19.5->18ms/20.75->18.75ms (7.69/9.64%).
BUT interleavedlayout45.5->46/45.75->46.5ms (-1.10/-1.64%); slower7/8pairs.
Attachedtext/observer signsflip,attributes/childrennearflat,JScontrolalso~2%faster.
Descriptiveonly; NO broad page/video win or regression clearance. Candidate stays
UNINSTALLED. NEXT isolate interleavedlayout before promotion, then headedGPU only
with ownerconsentstillpending. FullperformancegoalACTIVE.

18functional/nativeidentitychecks,108sampledcapsPASS,maxartifact188085525B;
0drops/cleanSIGTERM; all21exactbrowser/controllerroots absent final00:02:36ZOct4.
EPERM/SWGLheadlesswarnings retained,nohardware/no-network/fulltreecleanupclaim.
Local551exportedfiles1749075B at cache/mutation-inline-page-evidence-20261003-
{4UONIe,bN7ekD,OOB145}; correspondingremote captures mutation-inline-page-20261003-.
Remoteharness+pair mutation-inline-harness-20261003-F4qaX4; localpair
mutation-inline-native-pair-20261003. Originalpackagesuntouched/fullhashgatespass.
14focusedgroupsPASS includingall18savedreplay+24corruptions; INIbyteauditREDfixed
offlineonly, no capturechanges. Exactwhitespace/trojanlint0/syntax/diffpass.
FirstquotedshellPIDcheckinvalid/empty; acceptedfinal-absence-2.json fromstdin script.
Report bot-docs/reports/performance/2026-10-03-mutation-inline-page.md; scratch
artifacts/umbralink-control/*mutation-inline-page* pluspairhelper/spec.
Existingstagedindexunchanged; prior139nativesealPASS. No activeownedruntime/build/
test/transfer, ownerbrowser/install/launcher/sourceproductionchanges thiswave.
Final611-file seal independentlyverified: mutation-inline-page-final.sha256.
Do not edit sealed measurement scripts/logs/report; use a new follow-up namespace.

## October 3 Inline Inactive Mutation Gate

New UNINSTALLED native candidate: header inline reads live StaticPrefs mirror,
private cpp ShouldDispatchActiveMutation retains exact remaining checks/bodies.
Only2productionfiles + native null/detached activation-test additions. No DOM
algorithm/caller edits. Compiler probe RED->GREEN; actual SetTextInternal disasm
also branches over gate when inactive, stack552->520B. Source-equivalence audit
and complete disabled benchmark body equality pass. No new web APIs/defaults.

Fresh native3before/3after survey: explicitfalse medians gate1.769->0.323ns,
native text45.928->37.045ns; no-user gate1.674->0.326,text45.354->37.470.
Fixedorder/uncontrolledhost/3processes, not page/video gain; enabledcostunmeasured.
Baselinecache suffix98uLWO,candidateIGjoGK; sixrecordedPID rootsabsent.
Native2jobbuild78s/gtestPASS; adjacent218browserPASS8.393s (5s5rm1), extracted
package218PASS7.933s(vV73R9); allrecordedcontrollers/browser/serverrootsabsent.
Exact3filelint0/diffcheck0; original stagedindexunchanged; oldrequest356sealPASS.

machpackagePASS176s, but default16jobs despiteMOZ_MAKE_FLAGS=-j2; don'tcallpackage
twojob. Export46regularfilesequalstaging+versionPASS. Newexports/
umbrafox-mutation-inline-candidate-20261003 (includespreexistingcandidates);
Build20261003071500,libxul1e2e164e54d826958361ccff1e4a75bb1c92814f9b87877ab340c3bc56f7f2fb,
archiveaf78b8fb92da25089b7c243a7dfcbf37b37fc5045b7fd392b180210150ab70e4.
No install/launcher/ownerbrowser/visiblewindow/profile changes. Failedfirst gtest
hashpath corrected before build; disasm demangle/comma warnings retained, use
accepted *-raw.txt only. Report2026-10-03-mutation-inline.md, evidence
artifacts/umbralink-control/mutation-inline-* and check/analyze/export scripts.
Final139-file seal and52-file exportseal verified;46packagefiles unchanged after
tests;18exact owned PIDs (inclversion helper) absent at final independentcheck.
Next matched page-level DOM gate with controlledsameJS packages, separate headed
GPU/video permission still pending. Fullgoalactive. No activeownedtests/builds.

## October 3 Offline Video Comparison Admission

No new runtime while headed laptop consent pending. Read actual retained Pi
fixture: whole MP4 fetch+append+updateend precedes playback, so not recurring
streaming evidence. Scoped transferred Pi tree contains no MP4/WebM; its README
pins old120s1080p30 H264/AAC asset, not newly verified bytes. Small in-tree VP9
readback fixture remains paused pixel test, not playback speed.

New scratch readback-context.mjs + test/readback-context-spec.mjs admits observed
mode/compositor/adapter/driver/scale/display/color/decoder/media/document fields
before existing compareFrames. Six supplied-data groupsPASS incl32general+4headed
negatives; actual softwarepair18exactpixels, actual mixedheaded/softwareREJECT.
Identical-pixel/different-context falsifier also rejects. Synthetic copiedheaded
positive is not independent runtime. timingAccepted:false always; no cache-hit,
physicalcadence/geometry/continuousbackend/clean-source-delta or performanceproof.
Loader9namedJSON/run,1MiBcap,canonicalroots/nosymlinks; no profile/discoveryread.
No browser/SSH/profiler/build/install/native/production edits, staging or commit.
Report bot-docs/reports/performance/2026-10-03-video-comparison-admission.md;
artifacts/umbralink-control/readback-context-{green.log,software.json,final.sha256}.
Next explicitheadedconsent then matchedbackend/pixels, controlledlongerplayback;
streaming request and rendering comparisons kept separate. GoalstillACTIVE.

## October 3 Controlled Response-Latency Measurement

Supersedes the next-work note below, not its historical results. Same uninstalled
46-file pair, same page/collector/actor, new loopback fixture with fixed minimum
20ms server hold. Ten sequential fresh headless laptop runs all PASS22:44..22:51Z:
traced baseline0/6queries,candidate0/0; eight unwrapped ABBA/BAAB countsunknown.
All24 pre-observer busy requests pass strict response-progress control. After
observer: baseline12/12waituntilbusyend, candidate12/12responsestartsduringbusy.
Per-process baseline request-start101-102ms vs candidate2-3ms; response122-123ms
vs23-24ms; fetch124-125ms vs100-102ms. Four paired after-fetch gains24/24/24/22ms,
not100msend-to-end. All130serverholds20.225-21.030ms. No server/pageclockjoin,
fulltransfer/YouTube/GPU/ownerfresh-emptybrowser-cause claim. Cachedorigin only.

New remote cache/request-paired-20261003-afDgd2; oldM8BkdH pair reused unchanged.
Local cache/request-latency-evidence-20261003:282files949134B, hashespass.
50resourcecapspass,maxsampledartifact188119929B;10cleanSIGTERM,0drops,20exact
browser/controllerPIDs independentlyabsent. NativeBuild20261003071500/private
roots/webdriverfalse checked.27harnesshashespre/post; ninephase2sourcefiles and
old345seal unchanged. Final29strictNodePASS1.25s includes saved-wave equality,
corruption and delayedHTTP failure/cap/abort tests. Wrongcwd post-hash attempt
failed, corrected27pass; bothlogsretained, no browserretry. No activebrowser/test/
SSH/profiler/agent aftercheckpoint. No build/install/stage/commit/ownerbrowseraction.

Report bot-docs/reports/performance/2026-10-03-request-latency-measurement.md;
newplan bot-docs/plans/request-latency-measurement.md; artifacts/umbralink-control/
request-latency-analysis.json, final-tests.log, final.sha256 and scratchmodules/specs.
Old plans/DoDreports sealed unchanged; use this addendum for current status.
NEXT controlled page/video transfer onquietlaptop; headedGPU ownerdecision remains
separate, no automatic dailybrowserreplace/restart. Broad performancegoal ACTIVE.

## October 3 Paired Request Measurement

Supersedes phase2 next-artifact note below. UNINSTALLED baselinephase1/candidate
phase2 diagnostic copies built from sealed native package with MozillaJarWriter;
46files/nativebytesidentical exceptrootomni, exactly3payloadsdiffer(controller,
registry,parent), runtimeidentical. Localcache/request-fastpath-pair-20261003-dub_txpr
pair.jsonSHA60972c8cf99b6a19e7ccbe80bc6a5232a669a52e26222a9d89dbf2a46a5f1498.
Originalpackage10658410fda... untouched.9artifacttestsPASS; firstgenericZIPreader
failure and30s shortmalformedmozjarinputtimeoutretained; finalminsize+CRCguards.
Packagedcandidate218GeckoPASS atcache/mutation-mirror-browser-final-20261003-yBOjAU
7904ms; controller1865763/browser1865914/helpers1865860-62 absent, fullpairhashes
unchangedaftertest. No nativebuild/install/productsourceedit.

Actualquietlaptop10runs22:12:28..22:21:18UTC:2traced routingcontrols then8unwrapped
ABBA/BAAB. Before/after explicitobserver, initializedemptyregistry/activefalse/
profileroff. Tracedbaseline0/6nullqueries,candidate0/0; unwrappedcountsNULLunknown.
Eachphase6fetches alternatingidle/100msbusy,fixed155Bbody,13GETs/browser,exactSHA.
Busyrequest-startprocessmedians baseline101/102/101/101ms,candidate2/1/2/1ms;
before1-2msboth. Busyfetchmedians100-103ms,NOT100msend-to-endgain. ALLstrict
response-progresscontrolsINCONCLUSIVE: some responseStart==requestStart. Do not
waiveorclaimfulltransfer.4pairedrequestgapdifferences99/102/98/101msdescriptive.
Candidateoriginexplicitlywarmedatboundary; cachedsteady-state,notfirstusecost.

Remote cache/request-paired-20261003-M8BkdH; local270directfiles895672B at
cache/request-paired-evidence-20261003. No profile/token/appdata export/inspection.
All50resourcecapspass,maxsampledartifact188131418B;10cleanSIGTERM,0drops,all20
browser/controllerroots independentlyabsent. KnownEPERM/SWGLheadlesswarnings.
NativeBuild20261003071500/privaterootreceipts,28harnesshashespre/postverified.
FirstremotecloneFAILbeforelaunch(extra.parentlockinoldpackage),preserved;
freshSHAverifiedarchiveextractionthenexactpairpassed. No relaxedintegritygate.
20focused/savedNodegroupsPASSincl25corruptionchecks; savedbaselineauditREDfixed:
exactresourcejoin+subsequentrelativecaps. New scratchsyntax/diffclean.
9phase2source/testhashesunchanged. No activeCLI/test/browser/SSH/profiler/agent.

Report bot-docs/reports/performance/2026-10-03-request-paired-measurement.md;
plan+DoDupdated. artifacts/umbralink-control/request-paired-{analysis.json,
final-tests-3.log,final.sha256}, newadapter/capture/fileverify/export/auditmodules
andmirroredscratchtests. Oldsealsunchanged. Next sharedboundedserverdelayfixture
toresolveprecision/responseprogress withoutweakenedcontrol; newbalancedreplication,
notpooledwiththiswave. Thenrealpage/video/layout/hardwarebranches. This explicitly
installedobservercase does NOTproveowneremptyfreshbrowserintercepts orYouTubecause.
Ownerdailybrowserprotected; noinstall/restart/stage/commit; fullgoalACTIVE.

## October 3 Synchronous Request Fast Path

Supersedes phase1 next-gate notes below. Phase2 implemented, UNINSTALLED: registry
builds origin Set at publication; parent caches native document origin and returns
true only for exact positive request/WGP/context IDs, current HTTP(S) native global,
no prior capability and known nonmatching published scope. Capability WeakSet now
keys native WindowGlobal, not actor. Unknowns retain legacy dispatch; no last-null
or registry-only bypass. No new global/referrer policy or web-visible API.

Review reproduced nested flush publication false negative: shared matching script
but outer empty index. RED31PASS2FAIL; unique publication token now invalidates
after reentry until clean publish. Native lifetime tests first failed137/3 because
waived-window implicit context was hidden; pure RED retained and constructor now
defaults to admitted native WGP context (explicit mismatch still rejects).
All68focused/432combined strict Node tests PASS15.99s; exact6lint0. Final native
218assertions PASS at cache/mutation-mirror-browser-final-20261003-fHglsO (8426ms).
Native actor recreation, actual same-WGP BFCache +persisted pageshow, cross-origin
frame, container/private, exact classifier invocation and retained late handler
HTTP all pass. Existing startup/header/redirect/cancel/synthetic tests pass.

Controller1855606/browser1855773/helpers1855718-20 absent; earlier XfxJJA132PASS,
bXlREF137/3FAIL, G4D7vc206PASS retained and recorded roots absent too. No active
test/browser/lint sessions. Source-region proof leaves serialization/dispatch/
decision/actor lookup functions unchanged from archived phase1; Runtime and
controller-spec unchanged. Production: EventController+Registry+Parent; tests:
browser events+capability/request specs. No native build/package/install/stage/
commit/agents/profiler/ownerbrowser action. Existing staged/dirty work preserved.

Report bot-docs/reports/performance/2026-10-03-request-fast-path.md; plan+DoD updated.
artifacts/umbralink-control/request-fastpath-source.tar.gz seals9 request source/
test files; final.sha256 seals source/log/report/receipts. Old seals stay historical.
NEXT phase3 requires exact new test-artifact provenance: sealed laptop A/B packages
still contain OLD modules. Do not mutate old packages or claim latency improvement
from functional proof. Quiet laptop balanced busy-thread measurement/observer
controls, matching-no-handler work, YouTube/layout and headed GPU/pixel gates remain.
Owner daily browser protected; broad goal ACTIVE, not complete or blocked.

## October 3 Request Capability Handoff

Uninstalled phase1 of bot-docs/plans/request-fast-path.md implemented. Native
controller construction now requires prepareUmbrafoxUserlandRequestCapability
acknowledgement for its exact WindowGlobal. Parent validates native BC/inner IDs,
marks actor-private monotonic capability before reply/matching scripts. All3
runtime routes await readiness before controller/API/script execution; empty and
non-native supplied contexts unchanged. Weak-keyed preparation deduplicates and
retries failures. Public on/off unchanged; no per-request bypass yet.

New race RED: old preparation could execute in a new already-prepared document.
Frozen receipt now flows into constructor and must match current IDs; pure and
native iframe falsifiers pass. Observer registration retry RED also fixed by
setting request registered flag only after addObserver succeeds. Other observer
flags inspected, not changed. Original10RED includes3missing-helper failures;
firstGREEN9/1 was cross-realm microtask assumption, fixed with explicit entry signal.
New25capability groups; combined421PASS17.46s; exact7lint0. Three real Gecko suites
final78assertionsPASS atcache/mutation-mirror-browser-final-20261003-v0m6Fm,
9037ms; controller1827021/browser1827378/helpers1827322-24 absent. Earlier runs
QoooFS,KbqPfs,rpylYJ retained/clean. No active test/lint/browser sessions.

Productiondelta Parent+EventController+Runtime; browser events test +3Node specs.
No child actor changes, native build/package/install/stage/commit/profiler/agent
or ownerbrowser action. Existing source seals intentionally describe older code;
new artifacts/umbralink-control/request-capability-final.sha256 +failure/finallogs.
Exact7file source archive request-capability-source.tar.gz independently matches
current files; use it to recover this checkpoint after later source changes.
Report performance/2026-10-03-request-capability.md, plan and dod-evidence ledger.

IMPORTANT next gate: parent flag is actor-scoped, not yet a negative certificate.
Verify actor recreation/BFCache/native-document lifetime before enabling bypass;
move authority to document lifetime or use unknown fallback where needed. Add
initialized publication-time registry membership and exactloadInfo/nativeIDchecks;
never cache null/registryempty/off as standalone proof. Phase1 adds1ack per native
document withscripts, unmeasured cost; possible startup-reply reuse later. No
speedup/YouTube/GPU claim. Phase2+controlled laptop A/B still owed, goalactive.

## October 3 Request Document Identity

Uninstalled prerequisite now keys request controllers by context+native inner
window ID, captured at construction. Explicit mismatched request IDs skip current
handlers; zero/absent request IDs and no-native-ID fallback retained, neither is
fast-path authority. Other three maps remain numeric; shared finalizer key field
generalized without changing replacement semantics. No parent bypass implemented.

Four behavioral RED failures reproduced stale/overwritten controller dispatch.
Initial real Gecko run MiK1cA failed60PASS/10FAIL because waived windows hid the
chrome-only ID: registration numeric vs dispatch composite. Failure preserved;
Cu.unwaiveXrays plus explicit runtime-style BC in browser test corrected it;
waived-window RED retained. Final396strict Node tests/lint0, three real headless
Gecko suites71assertionsPASS atcache/mutation-mirror-browser-final-20261003-nPW9cx.
Controller1807081/browser1807266/helpers1807211-13 allabsent,6661ms. Native iframe
navigation+retained late registration tested, not actual BFCache/process-swap.
Owner browser untouched; no build/package/install/stage/commit/profiler/agents.

Owned delta: EventController.sys.mjs, browser_userland_events.js and two userland
Node specs. Existing finalizer/header-copy edits preserved. Report performance/
2026-10-03-request-document-identity.md; evidence request-document-* under
artifacts/umbralink-control. Older seals/packages intentionally remain unchanged
and describe older source. No active test/browser/lint sessions. Next parent-side
exact-document capability authority must cover all runtime entry points before
safe bypass; unknowns retain dispatch, never cache null/empty-registry as proof.
Then new controlled laptop measurement; no speedup/YouTube attribution yet.

## October 3 Busy-Thread Request Pilot

LAPTOP actual single headless pilot observed lost network/JS overlap. Fixed6
sequential fetches idle/100msbusy alternating before/after explicit observer
installation, registry0/activefalse/profilerfalse. Baseline busyrequeststarts
2/2/1ms,responsestarts3/3/2ms; observer busyrequeststarts102/101/100ms,
responsestarts102/101/101ms. Parentquerypopulation0.618/99.318/0.465/98.428/
0.305/98.801ms; sixnull,identitytrue,peak1,restored/0pending/0drops. Baseline0queries.
No parent/pageclocksubtraction or perrequestparentpair. All12bodySHA155B,13GETs.
RTresponseEnd==responseStart, fallbacknotexcluded: responseprogress claim only.
Totalbusyfetchcompletion100-101baseline/102-103after: NOT100ms end-to-end penalty.
Onefixedorder/instrumentedpilot, notYouTubecause/speeddistribution/GPUproof.

Remote cache/request-busy-20261003-2 20:36:40.654-20:36:52.854UTC12.2s.
Browser473108/controller473090 exactrootsabsent20:38:24.081; cleanSIGTERM182B
0drops,5resourcecapPASS,maxartifact153503307B. Same sealedB Build20261003071500,
nativeprivateroots/INIs/context10/doc10737418242 joins.6packagedmodulehashes
matchprevious; originald7controller notcurrentcandidate.21harnesshashes verified
before/after in request-busy-harness-20261003-AkOr49. Local27directfiles at
cache/laptop-request-busy-evidence-20261003-2 SHAverified, noprof/token/appdata.

Firstattempt suffix1 FAILED beforebrowser: staticimportbundle missed fixture
assets hashedbycollectProvenance.4directfiles preserved locally+remote, old
harnessEaa7mp retained. Newbundleadds3reviewed assets; full no-browser provenance
preflightPASS atcache/request-busy-preflight-20261003-2 before singlepilot.
11focusedgroups+1saved-dataaudit15corruptionsPASS. No broad/lint/native/build/
install/source/index/ownerbrowser action. Scratchonlycode/test/report updates.
Report performance/2026-10-03-request-busy-pilot.md; scratchrequest-busy-*+finalseal.
No activesessions. Next exactdocumentcapability authority/late-registration
falsifiers; reversed/uninstrumentedoverlapcontrol stillneeded. Do NOTcachelastnull
or registry-onlyskip. HeadedGPUpermissionpending; fullgoalactive.

## October 3 Empty-Registry Request Path

New actual headless path observation on sealedB, no product source changes:
cache/request-path-20261003-1 at20:08:55.695-20:09:07.933UTC. Fresh initialized
empty registry/activefalse/profilerfalse,6fetches(3serial+3parallel) =>0 actual
userland actorqueries. Explicit ensure observer in disposablebrowser, same
registry,6fetches =>6nullqueries; observercounts1->2->2(idempotentcall),peak2.
All12bodySHA/155B pass,13serverGETs incldocument; no query/trace drops/errors;
exactactorownmethod wrapper restored both phases. Context10/doc10737418242
payload equalitychecks pass; no perrequestIDpairing. No header/private data.

Six wrappedparentquerydurations0.193719..0.504069ms,median0.274780 onlydescriptive.
Excludes prior suspend/headerconstruction and subsequent decision/resume; adds
wrapper promisehop. Fixedorder6samples, no noise/control/performance/YouTube
claim. Parent and contentclocks NOTsubtracted. Zeroqueriesfresh != observer
installedtypicalnone behavior. Null/emptyregistry stillnotauthoritativefastpath.

NativeBuild20261003071500freshappdata receipts; controller1748669/browser1748688
absent,cleanSIGTERM183B0drops,5resourcecapPASS,max170913142B. Packaged controller
omni.ja SHA d7e4056f(original,NOTcurrent5f/header/finalizer);5othermodulebytes
matchcurrentsource,6hashesrecorded.6focusedgroupsPASS,initialREDmissingmodule
only; no broad/lint rerun.27directevidence files sealed; scripts/tests/audit and
request-path-final.sha256 in artifacts/umbralink-control. Report performance/
2026-10-03-request-path-observation.md. No activebrowser/CLI/test sessions.
Next falsifier contentbusy vs networkprogress must prove baselinewireprogress
first; uniqueID/nativeclock/observercontrol needed. HeadedGPUconsentpending.
Ownerbrowser/packages/source/index unchanged; broadgoalactive.

## October 3 Gecko Controller Collector Check

Actual Gecko forced-GC/private-source check now PASS, not real-document/BFCache
or memory-byte/performance proof. New report performance/2026-10-03-controller-
gecko-gc.md. Same actual controller source, fake services/windows, private system
sandbox, no production edits/import/install. Current source5f0f1036... includes
existing header-copy change, not old finalizer-only97ec22ce. Originald7e4056f.
Three512-controller batches plus2held/replacement/off-on controls: original maps
514/1026/1538 then1538 each, candidate2/2/2 then0; direct map WeakRefs live2 then0.
6152dead entries remain only original. No observer lookup/deletion or real hooks.

Desktop headless sealedB Build20261003071500, libxuld0013852 unchanged. Cache
controller-gecko-20261003-1 failed chromeCSP Function before population; retained.
Private sandbox correction(noCSPprefchange) run2PASS; run3finalPASS adds direct
map-live counts to avoid cross-compartment witness ambiguity. Durations12.039/
12.540/12.829s,cleanSIGTERM183B0drops;6roots1717494/1717506/1720113/1720125/
1721874/1721886 independentlyabsent.14resourcesabsolute capsPASS,max170137396B.
Nativefreshappdata roots/PID/build/context/doc receipts join. Profiler/userland
active false throughout observed boundaries. No ownerbrowser/agents/build/install.

5focused groupsPASS,24malformed results; actualV8sameprobe too. CompilerRED4/1
retained; initialmissing-moduleREDnotbehavioral. node --test worker lackedgc;
direct node --expose-gc spec works, earlierfailurepreserved. No broad/lint rerun
for scratch-only work. artifacts/umbralink-control/controller-gecko-* scripts,
logs,auditJSON,80fileevidence manifest and finalseal. No activeownedprocesses.
Actualdoc/BFCache memorygate stillopen; headedGPU permissionstillpending. Broad
goalactive. Do not installcleanup or inferYouTubebenefitfromthischeck.

## October 3 Sampling Comparison And Native Attribution

Fixed10cell laptop comparison COMPLETE:AA1,AA2,Aoff1,Bsamples1,Asamples1,Boff1,
Boff2,Asamples2,Bsamples2,Aoff2. All800casesPASS,60resources,cleanSIGTERM/0drops,
20exactcontroller/browserrootsabsent. AA5177/5430ms passespredeclared15%screen,
notcase-noiseproof. Remoteharness sampling-balance-harness-20261003-atN5P0 and
21sourcehashesunchanged; noengine/build/install/ownerbrowseraction. Local333
directevidencefiles+10driverreceipts SHAverified at cache/laptop-sampling-balance-
evidence-20261003-<cell>,remote sampling-balance-20261003-<cell>. Maxsampledartifact
221926415B,profilecap24MiBunchanged. Earliercaptures/failuresnotpooled.

OFF wholemedian A5309.5/B5223.5ms(-1.62%);sampling A6104.5/B5747ms, observed
15.0%/10.0%higherthanOFF. Notfixedoverheadconstants/significance. OFF Btext14.0%
detached/4.88%attachedlower,attrs4.85%lower,children3.10%lower;observer5.84%,
batchedlayout1.79%,JScontrol6.80%higher. Aoffbatched17/11mswide;layoutunresolved.
Gapsnotuniform (firstAoff->Bsamples172s), nofrequency/continuousloadcontrol.

Matchingpackage localSamply/CLI-only native exports on FIRST Asamples/Bsamples:
cache/sampling-balance-symbols-20261003-{A,B}-1. content407203/t263,406171/t232.
Active2296/2044,DOM1623/1370,layout409/393,JS226/244,GC26/30. GateShouldDispatch
inclusive273/4,self13/4;prefhash139self198inclusiveA,noBrow. Full1145/1052function
rows sumself exactlyactive;103/92addressselfremain. Prefmarkers0/workload0,
strictwholebracket nativeclockjoin, noper-caseattribution. Notavoidablepercent
orYouTubecause. ExactsealedlibxulSHA/GNUIDs+serverlocalpathsverified,notDWARFproof.

Samply1688494/1690394 stoppedownedSIGINT exit0;CLI1688689/1691808 stop0finally.
Exact4PID/namedUnixsockets and TCP37521/37522 absent. Noactivehandles. NoUIopen,
explicitloopback only; no network-sandboxclaim. 13focusedanalysis/prooftestsPASS;
newsummaryREDsmissingmoduleonly, originalcalibrationbehavioralREDpreserved.
Report bot-docs/reports/performance/2026-10-03-sampling-balanced-comparison.md;
finalseal artifacts/umbralink-control/sampling-balance-final.sha256. Broadgoal
active. NEXT actualheadedGPUconsentstillpending, layoutuncertaintyretained;
cancontinueoffline/nativefalsifiersbutnotguessoptimizationfromsymbolnames.

## October 3 Sampling-Only Route Verified

Supersedes pending sampling proposal below. Optional `samples-only` selector in
mutations/profile-capture.mjs adds samplingallthreads + fixed NONMATCHING filter
UmbraOwnedSamplesOnlyNoThreadSelection. Old on/off/default emitted control bodies
and options exactly equal before archive by AST check. Only adapter+spec changed;
no fixture/native/build/install/public-surface changes. Strict finite increasing
sampleWindow from existing native elapsedTimeMs snapshots, no extra RPC. Outer
bracket includes control overhead, NOT per-case attribution. 390 full testsPASS,
exact2filelint0; five saved-export testgroupsPASS. FocusedRED5PASS5FAIL preserved.

LAPTOP same sealed packages A/B both80casesPASS, cleanSIGTERM182B0drops,6resource
samples. A controller384889/browser384903 at18:48:43-18:49:02UTC; B388951/388965
at18:53:26-18:53:44UTC. Four exact roots independently absent. New20hash harness
cache/samples-only-harness-20261003-r1cK8x verified before/after; original harnesses
untouched. Runs cache/samples-only-20261003-{A,B}-1. Local35directfiles/run SHA
verified at cache/laptop-samples-only-evidence-20261003-{A,B}-1. A raw18246241B
SHA23f10292...e904; B17031630B SHA21c1730c...9ca2. No raw custom parser.

CLI accepted cache/samples-only-analysis-20261003-{A,B}-2, explicit loopback:9.
A content385056/t264, B389131/t234; before/after same fixture URL/PID/window joins,
document10737418242 separate runs. Both PreferenceRead0, workloadUserTiming0;
all292/294 exported thread names miss filter. Active samples2289/2017; DOM1579/
1382,layout421/346,JS255/254,GC25/25. Exactfixture collectDOM inclusive2251/1977.
Native outer bracket converted to CLI relative input then exact raw status bounds
verified. Daemons1647508/1648417/1653083 stop0/PIDsocketabsent. FirstA exporter
wrong filteredCount field -> failure/cleanup, preserved; corrected to actual
filteredMarkerCount with regression, reload SAVED profile only, no browser retry.
Old exporter/root untouched. Workload6126/5577ms not controlled speed comparison.

Report bot-docs/reports/performance/2026-10-03-sampling-only-proof.md; finalseal
artifacts/umbralink-control/sampling-only-final.sha256. No live handles. NEXT
counterbalanced OFF/samples-only comparison and matching local symbols, retain
per-case layout attribution gap; no benefit/YouTube claim from these pilots.
HeadedGPU consent stillseparate, ownerbrowser/packages unchanged, broadgoalactive.

## October 3 Mutation Marker Calibration Confirmed

Version-5 marker-calibration added to internal fixture/profile adapter; new
marker-workload.mjs and two specs. Five tooling files only, no native/browser,
build/install or owner-browser changes. Three page-owned 1000-iteration cases:
arithmetic, detached text, attached text. Nine exact UserTiming entries, loop-only
spans; original mixed/layout workloads unchanged. Full388PASS/exact5lint0;
two saved-data analysis groups PASS (15 corruptions plus boundary ambiguity).

LAPTOP A/B both pass with same sealed packages and existing120s/24MiB bounds.
Remote harness marker-calibration-harness-20261003-eBoebP,21hashes verified.
Runs marker-calibration-20261003-{A,B}-1 at18:29:45/18:30:23UTC. Controllers
369203/370277 and browsers369237/370347 independently absent, cleanSIGTERM182B
zero drops,5resource samples each. Local34files/run SHAverified under cache/
laptop-marker-calibration-evidence-20261003-{A,B}-1. Raw A1144798B SHA2d07334b...d708;
B812848B SHAb29da5d4...ef22. No raw custom parser; CLI-only with loopback :9.

Analysis cache/marker-calibration-analysis-20261003-{A,B}-1: contentPIDs369393/
370961, threads t-41/t-11, document10737418242 each distinctrun. A target prefs
2008 total:0 control/1000 detached/1000 attached,8 outside,0 exact boundaries.
B zero total/in each loop. Strict same-thread temporal joins, not per-pref
document metadata. CLI normalized clocks matched; reduced public receipt times
NOT interval edges. Daemons1616260/1616645 stop0/PID+socket absent. No speedup or
YouTube cause claim; confirms differential profiler work, old210MB dump unparsed.

Retained failures: offline audit wrongly expected old plan.profiling; corrected
literal on, reran audits only. Initial archive attempts failed without filelists;
replacement *-evidence-2.tar.gz used. Initial remote hash cwd corrected; no capture
reruns. Driver/auditor local hashes match remote. Report:
bot-docs/reports/performance/2026-10-03-mutation-marker-calibration.md.
Finalseal artifacts/umbralink-control/marker-calibration-final.sha256.

NEXT source-supported alternative to denied external perf: supported feature
samplingallthreads grants Sampling without Markers to UNSELECTED registered
threads in ActivePS::ProfilingFeaturesForThread. Packaged base same logic;
sealed patches/archive do not change profiler. Explicit selection grants Any,
so do NOT include content GeckoMain or assume empty filter selects none. Need
small native proof of useful samples+no target markers, and a separate validated
clock/window contract because UserTiming content markers also disappear. Not yet
implemented/run. No system permission change needed for this candidate route.
Broad goal active, headedGPU permission gate unchanged, no active handles.

## October 3 Baseline Profiling Censored

Supersedes next-comparison plan below. Fixed A-off,B-on,A-on,B-off onlaptop:
A-off PASS80/4821ms; B-on PASS80/4735ms; A-on80functional receipts/7650ms but
FAIL24MiBprofilecopycap: raw210314088B staysownedremoteinplace/uncopied/unparsed.
B-off commandprerequisite refusedbeforelaunch/outputcreation. No capraise/retry,
no acceptedA/Bresult orpooledmissingcell. Threebrowsers346314/347469/349067 and
controllers346300/347377/349051 independentlyabsent; cleanSIGTERM182B0drops,
6resources/run; A-onprofilerstopped. Parentbuffergeneration0 notchildretention.
Remote window-profile-ab-20261003-{A-off,B-on,A-on}-1; local31/35/32files at
cache/laptop-window-profile-ab-evidence-20261003-{A-off,B-on,A-on}-1 SHAverified.
Same18harnesshashes+newdriver e5d7b721...b63f3; originalharness unchanged.

Sourceobservertrap: base Preferences.cpp blob454f796d6492b9ec2859dc3a4cb5cd2e3f76193c matchesbothseals;
GetPrefValue onfoundpref emitsPreferenceRead wheneverthreadprofiledformarkers.
Ahotmutationgate genericGetBool takesit, BfrozenStaticPrefs atomicmirror bypasses.
nomarkerstacks doesnotdisablebranch. Explains differentialprofilingworkinsource,
NOTactualfailedprofilemarkercount/bytescausalproof. No nativechange thisturn.
Externalperf own-true preflight DENIEDbothhosts paranoia4; no sudo/securitychange.
Baselinepackagehas.symtab nativeIDf2c96c91073e8ba2cd754e10735f6b75, fullDWARFnotfound.

B-onraw16,125,890B SHA2e898a662d98396479b2ebcc509751ef0ca3e7c632d7eea1681be4f321fa834b.
CLIoffline127.0.0.1:9-only export cache/window-profile-ab-analysis-20261003-B-on-1:
243entries/81triplets doc10737418242/PID348064/t41; exact30entries/8filters,
1585active (DOM1096/layout264/JS182/GC23). Batched55(44layout/11DOM), noexportedGC
overlapagain. No native-symbolcomparison. CLI1592269 stop0/PID+socketabsent;
noSamply/noactivehandles. Driver2tests/audit2tests+6corruptionsPASS. Report
bot-docs/reports/performance/2026-10-03-profile-observer-effect.md; finalseal
window-profile-ab-final.sha256. NEXT small page-owned A/B marker-production
calibration withinexistingcaps (notimplemented), notmorelargebaselineprofiles.
Externalperf requiresownerpermission/securityreview; no consentrequestedyet.
PriorOFFcomparisonsretainvalidlimitedscope. Ownerbrowserunchanged, goalactive.
Final audit note: A-on audit has stale generic copied/hashed prose, contradicted
by explicit copied=false/parsed=false metadata and executed lstat-only raw path.
Report corrects this; original evidence/script unchanged. Final4testsPASS/lint0;
three copied driver receipt hashes match remote log. Seal finalized separately.

## October 3 Actual-Page Profile Completed

The next attribution gate is complete, without native/build/install/owner-browser
changes. New mutations/profile-workload.mjs+profile-capture.mjs, fixture integration
and3specfiles:386combined testsPASS/exact6lint0. Source-derived instrumented copy
of collectDOM retains loops/checksums; ASTreverse proof, legacy hashes unchanged.
Version4 mixed-profile/window envelope2,80cases+pass=243UserTiming entries.
Complete-case spans include setup/cleanup/async wrappers, not just inner durations.
Actual requested profiler1Mentries2ms, native buffer totalSize16M/generation0.
One-periodic-sample barrier is not universal child-success proof.

LAPTOP fresh OFFcontrol window-profile-20261003-control-1 and ONcapture suffix
capture-1 PASS80 each,17:21/17:24UTC. Controllers328483/332019 and browsers
328497/332033 independentlyabsent,6resources/runwithinbounds, cleanSIGTERM182B
0drops. ONuses existing512MiBprofilepolicy/OFF256MiB, no capincrease. ONrawcopy
16315487B SHAc97fa33719ab96563cc2b05edbad60c223268cfd26260bafe8e30655585136f1.
CandidateB libxuld001...4231 Build20261003071500 unchanged/uninstalled. Harness
window-profile-harness-20261003-GC8CEH18hashes. Localdirectexports31/35files at
cache/laptop-window-profile-{control,capture}-evidence-20261003-1 hashverified.

Offline scratch cache/window-profile-analysis-20261003-R0oL5o. Acceptedexports-3
symbols matchB GNU buildID9be8527d27b64ed4999b502e44c55a2b. CLIrawparseronly;
analyze-window-profile.mjs onlyreads savedexports. Strict243/81triplets doc
10737418242/PID332190/t41; native URL/PID/window20 joins (native projection lacks
innerdocument field). NormalizedCLIclock vsrawroot10994.656358 distinguished.
Pass4897.216277ms,1664active samples:DOM1112/Layout296/JS213/GC26. Mutationgate
5self7inclusive; exactoldwrapsymbolabsent, notproofnowrapping/avoidablecost.
80address-onlyselfsamples4.8%. Layoutbatched66samples,53layout; no exportedGC/CC
interval overlaps those10cases. DoesNOTclear earlierA/Bsignal orproveGCnotcause
elsewhere. SingleOFF4604/ON4897ms confounded, notcalibratedoverhead.

RetainedCLI failures: loadprose despiteJSON; fullLayout export32MiBoverflow
(exports-2/pass-layout.json INVALID unused); barejs filter matched script.js/JIT
markers. Correctedfilter-check-2 uses-js,exact30entries,131JSsamplesunchanged.
Other7filters exact30each. Four saveddataauditgroupsPASS incl16corruptions.
AllownCLIstop0. Daemons1547974/1549122/1556582/1557549 PID/socketabsent. First
load numericPIDunavailable, socketabsentonly. Samply1545113 exited124via300s
SIGINTdeadline; latermanualattempt ENOENT/no signal. PID/port37520 absent.
No active capture/export/test/server/transfer. Originalfailures/seals retained.
Report bot-docs/reports/performance/2026-10-03-window-dom-profile.md; finalseal
artifacts/umbralink-control/window-profile-final.sha256. Next: matched baselineA
profile+candidate repetition/controls, baseline-symbol preflight first; no guessed
mutex/GC/JIT patch. HeadedGPU baseline stillawaits windowconsent. Broadgoalactive.

## October 3 Isolated Layout Results

Next experiment separates layout-batched from mixed workload: new
tools/umbrafox/tests/mutations/layout-workload.mjs,12warmups16trials, same timed
loop32rows64rounds/2048reads checksum163840,20mswaits. Fixtureversion3, explicit
workloadselector, windowenvelope2; previousmixed/sandbox metadata+hashes unchanged.
Only fixture/capture and tests changed, no native/build/install. Initial370PASS
lint0 missed mainadapter signature. Semanticrun1 failed Invalidworkload before
samples: shared runner sixthAbortSignal was forwarded into selector. New failing
mainadapter test catches both modes; exactfiveargument wrapper now corrected.
Final371PASS/exact5lint0. Replacementsemantic2 PASS28samples16:38UTC, native roots
and windowrealm verified,5resources cleanSIGTERM182B0drops. Browser301645 and
controller301633 absent. Replacementharness suffiximj4Qa, all16hashes verified.
Runfailure preserved cache/layout-isolated-semantic-20261003-1 onlaptop;
browser296003/controller295991 absent, cleanSIGTERM182B0drops. Old harness
cache/layout-isolated-harness-20261003-WCS7Hf preserved. ABBAABBA completed
cache/layout-isolated-comparison-20261003-CQOCDO:224samples40resourcesPASS,
8browserroots+controllerabsent,230directevidencefiles localSHAverified at
cache/laptop-layout-isolated-evidence-20261003-CQOCDO. A15.25/B15.75ms medians,
3.3%candidatehigher/rangesoverlap, notregressioncleared/equivalence. Separate
BAABBAAB alsoPASS cache/layout-isolated-comparison-20261003-bUDs0U,224samples
40resources; A15.75/B15.75ms medians. Reverse228directfiles locallyhashverified
cache/laptop-layout-isolated-evidence-20261003-bUDs0U. All16roots+2controllers
absent; bothsemanticroots/controllers absent. Semanticexports21failed/27pass
files in cache/laptop-layout-isolated-semantic-evidence-20261003-{1,2} verified.
No active SSH/runtime/tests/transfers. Maxsampledartifacts188037717/187950146B.
All14current sourcehashes match each timedbatch. Early/late processhalfmedians
first A15.5/15 B16/15.25, reverse A16/15.5 B15.75/15.75. Allsamples retained.
Large mixedpenalty not reproduced here, noequivalence/causalclearance. Next:
actualpage-owned mixedprofile with exactsame-doc joins/symbols/observercontrols;
oldprofile-dom.mjs remains sandbox and MUSTbeadapted beforeuse. No naivewrapper
or JIToptimization based on oldprofile. Candidateuninstalled; GPUheadedconsent
stillpending; broadgoalactive. Seal layout-isolated-final.sha256 inartifacts.
Report bot-docs/reports/performance/2026-10-03-isolated-layout.md; logs
artifacts/umbralink-control/layout-isolated-*. Ownerworkbrowser untouched.

## October 3 Window-Realm Comparison

Supersedes the pending collector correction below. Only mutation fixture/capture
and their tests changed; collectDOM body unchanged SHAff39082f...5da65 and legacy
fixture metadata/hashes unchanged except ephemeral URL. Default fixture remains
sandbox for old profile adapter; new main uses external page-owned script,
lexical collector, exact four-field realm receipt/version2, bounded DOM bridge.
Captured transport globalIsWindow=false and collector realm checks alltrue.
No production browser/native/public-interface changes or build/install/stage.
16 focused/364 combined tests PASS, exact4file lint0; REDs/failures retained.

LAPTOP semantic gate dom-window-semantic-20261003-1 PASS80samples, browser270063
and controller270051 absent. Two separate unprofiled batches finished:
dom-window-comparison-20261003-c9ZMDL ABBAABBA and suffixGhWGHd BAABBAAB.
Each8processes640samples48resourcesPASS; all16roots+controllersabsent onlaptop.
Fresh profile/appdata,256MiBcap unchanged; max sampled188016234/188136151B.
First235/reverse243 direct-evidence files exported/hashverified. Local roots
~/.cache/codex/laptop-window-dom-evidence-20261003-{c9ZMDL,GhWGHd}; semantic
~/.cache/codex/laptop-window-dom-semantic-evidence-20261003-1. No nested personal,
profile/appdata/discovery exports. Remote harness dom-window-harness-20261003-yFN1pq.

Median-of-process-medians reductions first/reverse: detached21.5/27.6%,
attached16.4/16.9%, attrs6.0/6.3%, children7.9/17.0%. Batchedlayout SLOWER17.9/9.8%
with overlapping ranges; retain unresolved regression signal, not noise/causalproof.
JS+observer controls reverse direction. No frequency/continuoushost control,
significance/video/layout gain, poolingwithsandbox or runtimegeneralization.
Report bot-docs/reports/performance/2026-10-03-window-dom-workload.md.
Savedtrial/order followup: candidate slower3/4adjacentpairs ineachbatch, but
first4/last4 processhalfmedians first A13/14.5 B17/14.25ms, reverse A12.5/16.75
B15/16.75ms. Index andpositionconfounded; NOTuniformpenalty, causeunknown.
Next: separatelyversioned layout-only/warmup experiment, then page-owned
attribution ifneeded. Old profile-dom.mjs is STILLsandbox; do notreuse
as ordinarypage proof. Same sealedA/B packages unchanged/uninstalled. HeadedGPU
baseline consent stillpending; workbrowser untouched. Broadgoalactive.
All17ownedbrowsers+controllers/SSH/transfers stopped, evidencecopy hashesverified.
Newseal artifacts/umbralink-control/dom-window-final.sha256, oldsealsretained.

## October 3 Local Symbols And Benchmark Realm Correction

Offline follow-up supersedes pending symbolication below. Samply0.13.1 local
debug-dir lookup matched exact GNU/Breakpad libxul IDs; no rebuild/install/browser.
Scratch ~/.cache/codex/dom-symbols-20261003-4SQS4U contains saved CLI exports,
audit.json, logs/source excerpts/identities/cleanup. Fresh private cache, empty
child env plus required local values, loopback/no-open/explicit symbol-dir,
8GiB VA/256MiB file/core0/240s INT bounds; NOT a network sandbox proof.
First CLI load used Samply's bad port0 advertisement, retained/stopped; same
owned server PID/socket identified actual37519, second load resolved symbols.
No raw parser: profiler-cli only. Server1383180 stopped SIGINT/sessionexit0;
both daemons1383903/1386242 and wrapper1383179 absent, both named sockets and
TCPinode34394920 absent15:37:21UTC. No active profiler/server/controller remains.

Four strict same-doc phases+12 corruptionsPASS; old audit output byteidentical
using default prefix, new optional absolute prefix points to scratch directory.
All prior counts/categories/workload shares identical. Unresolved self now
254/258/223/262 (4.4-4.9%). wrap f1740 inclusive647/609/671/654 (11.5-13.3%),
self66/42/48/64 only; nested wrap rows cannot be summed, ambiguous symbols and
truncated trees remain. Mutation gateinclusive10/20/8/10. No avoidable fraction,
mutex contention, GC/JIT bug or YouTube cause proved.

IMPORTANT: mutations/capture.mjs and scratch profile-dom.mjs serialize collector
into ControlScript's Cu.Sandbox, NOT actual Window realm. Exact packaged omni.ja
ControlScript equals current SHA7f6c3b468f688f84c940d8921ceec31daecc4062763f134a49a5344b704d1289.
sameZoneAs creates new compartment per inspected Searchfox Sandbox.cpp; wrapping
paths under attributes motivate harness correction, not security-boundary edits.
Docs corrected ordinary-page wording; old balanced batches remain valid only
for this sandbox harness. Preserve all old captures/seals. Next: same-origin
external page-owned collector with realm guard, same checksums/schedule/caps,
failure/abort/duplicate-start tests, real headless semantic gate, then fresh
predeclared laptop comparison. No pooling versions. Not implemented yet.
Report bot-docs/reports/performance/2026-10-03-dom-profile.md expanded.
No engine/tooling production edits this step; scratch audit prefix and docs only.
Headed baseline consent pending; work browser untouched; broad goal remains active.

## October 3 Profile Policy And Offline Attribution

Supersedes first-attempt no-cap-change state below. Fixed artifactPolicy profile
allows512MiB ONLY explicit headless-dom-profile-attribution; default/soak256MiB
unchanged, soak expansion rejects. Four toolingfiles+scratchadapter changed;
beforecopies/profile-budget-before.sha256 retained. BehavioralRED3, focused76,
combined360PASS/exact4lint0. No native edits/build/install/stage/commit/owner actions.

Second laptop capture cache/dom-profile-mirror-20261003-2 ran15:00:37-15:01:24UTC:
5passes400samples/nativeStopPASS, but statusFAILED Profile preservation cap24MiB.
No limit rewrite/rerun. Existing raw118995551B copied separately under128MiB
offline ceiling to cache/dom-profile-mirror-evidence-20261003-2/dom-profile.json.
41files matchremotehashes; noothernestedprofile/appdata/token copied.
Browser250758/controller250746 absent onlaptop, cleanSIGTERM182B0drops.
11resource samples max271611691B under512MiB, notfinalsize/peak/memoryslope.
Harnesscache/profile-budget-harness-20261003-x1V8hy; sealedB d0013852libxul unchanged.

One CLI0.10.0 session umbra-laptop-dom-20261003-offline-2, explicitloopback
symbolserver127.0.0.1:9. Stopped~15:14UTC; exactPID1363906/socketabsent.
CLIonlyrawparse; savedexports audit4positivepasses/12corruptionrejects.
Pass0missingstart(excluded, causeunknown); passes1-4 join t41/PID250909/doc
10737418242. Offset10999.255357999999ms checked, notmixedraw/normalized clocks.
Active samples5477/5280/5044/5393; attributes29.7-31.0%, childlist16.2-17.2%,
text16.2-16.9% inclusive fixture scopes; unresolvedleaf90.8-92.3%, no nativecause.
GC/CC2.2-2.7% categories only; noallocationdata/noJIThelpercoverageproof.
Profilemeta symbolicatedtrue isNOT complete resolution; capacity8MiBrequested
separatefromGetBufferInfo16Mentries/source128MiBminimumlimit. NoRSSinference.

Debug obj-x86_64-pc-linux-gnu/dist/bin/libxul.so GNU ID9be8527d27b64ed4999b502e44c55a2b
matchessealedB andcapturedBreakpad7D52E89BB627D44E999B502E44C55A2B0.
Next local symbolicationpreflight; samply onPATHabsent butexisting
~/.mozbuild/samply/samply supports--no-open/--symbol-dir. No server/load started;
mustreviewremote-lookupdefaults/local-onlyrouting/ownedcleanup beforeusing.
Report bot-docs/reports/performance/2026-10-03-dom-profile.md; logs/exports/audit
artifacts/umbralink-control/profile-{budget,offline}-* and
audit-dom-profile-exports.mjs; finalprofile-followup.sha256 seal.
AllCLI/SSH/test sessions terminal. Headedbaselinewindow consentstillpending,
noautomaticbrowserretry, owner3290300notchanged. Goalactive, notcomplete.

## October 3 Request Header Copy

Goal continuation while headed consent pending removed only parent payload
originalHeaders from getRequestEventFields in EventController. Child always
rebuilds that frozen object from ordered headers before handlers. Exact one-line
delta against saved pre-edit source proved; finalizer work preserved. No null
cache/active-pref skip; retained handler authority constraints still apply.
New tools/umbrafox/tests/userland/request-spec.mjs: RED8pass1expectedfail,
GREEN9; combined Node353PASS (final command includes nested readback/test and
mutations/test; earlier327run omitted those). Exact3filelint0/diffcheck0.
Gecko3suites63assertionsPASS in fresh headless root cache/mutation-mirror-browser-
final-20261003-CZjFjn; controller1330674/browser1330910/helpers1330837-39 absent.
Earlier62assertions suffix0QvHWb retained. Owner3290300 October1 binary unchanged.
ModuleSHA5f0f10369bd55a1f4a90a8508670153c8d5c27606d62846070f923954fe84125;
manifest/logs/beforecopy artifacts/umbralink-control/request-headers-*.
Instrumented source removes1fromEntries+1freeze; JSONsize proxy32syntheticheaders
5730->3096B is NOT actual IPCbytes/latency. No personalheaders/timings collected.
Report bot-docs/reports/performance/2026-10-03-request-header-copy.md.
No build/package/install/stage/commit; neither sealedcandidate includes change.
No running test/browser/lint sessions; GPUwindow still needs explicit consent.

## October 3 Profile Attempt Stopped By Artifact Limit

After the two completed laptop comparisons, a separate candidate-only profiling
attempt failed at14:25:39.960UTC (started14:25:14.502), not a timing regression.
Remote owned root ~/.cache/codex/dom-profile-mirror-20261003-1; desktop evidence
copy ~/.cache/codex/dom-profile-mirror-evidence-20261003-1. All28 direct
JSON/log/INI files SHA-verified; no nested profile/appdata/discovery copied.
One80sample pass valid, no raw profile dump/copy, no stack attribution.
Error Lifecycle artifact byte cap exceeded; cap remains268435456bytes.
Explicit StopProfiler RPC also hit aborted signal; only enclosing browser
SIGTERM cleanup proved,182logbytes/0drops. Browser236816/controller236804
checked absent onlaptop; transfer terminal, no retry/browser/profilerdaemon.
Last successful resource snapshot187927683bytes; post-cleanup owned-only du
268364436bytes is not failingpeak (different time/traversal accounting).
Largest profile directories remote-settings/storage/cache2/security_state/
startupCache, metadata only; no contents/personal/shared queues read, no
YouTube-causality claim. Requested profilecapacity1048576 vs observed
buffer.totalSize16777216 retained separately. No policy suppression/cap increase.

Scratch adapter artifacts/umbralink-control/profile-dom.mjs+test/profile-dom-
spec.mjs:4mocktestsPASS, initial RED missingmodule only. Unchanged capture driver
and collector, planned5passes400samples; profiled timings NEVER pool with prior
unprofiled batches. Source/seal/logs/audit dom-profile-*; details in
bot-docs/reports/performance/2026-10-03-page-dom-workload.md#separate-profiling-attempt.
No native/source/build/install/ownerbrowser changes. GPU matching headedbaseline
still needs explicit windowconsent; goal active, no automatic profile retry.

## October 3 Quiet Laptop And Headed Result

This supersedes the older headed-consent/quiet-host waiting states below.
Wyatt authorized one isolated headed desktop window <=2min and identified
wyatt-laptop as the closest/quietest CPU target; wyatt-mac is also available but
Darwin arm64 cannot use the Linux x86_64 candidate packages. No agent delegation.

The authorized headed run completed in14.96s: cache/readback-candidate-headed-
20261003-1, PID1259488/controller1259474 absent, ownerPID3290300 left alive.
NVIDIA RTX2060/X11 WebRender, native decoder HWflagtrue/ffvpx VP9.18cases stable
across12draws/two distinct frames, but0/18match earlier HEADLESS baseline.
Do not call this parity or cache proof; same-headed baseline needs separate
consent. Capture/spec tooling now support explicit headed mode, defaultheadless
unchanged;344tests/lint0. No native changes/build/install. Full report:
bot-docs/reports/performance/2026-10-03-headless-readback.md.

Laptop fixedABBAABBA completed13:39:23-13:41:46UTC:8processes/640samples;
4processes per build,8trials per case. A=sealedreadback82faf416libxul;
B=sealedmirror d0013852libxul; bothBuild20261003071500. Median process medians
text42->36ms and47->39.75ms, attributes145.5->137.5ms, childlist89.25->79.5ms.
JScontrol22.25->24.5ms (rangesoverlap), so no generalJS/layout/YouTubeclaim.
No pre-run compiler waits; no continuous-host-exclusivity proof. All48resources
passcaps; native roots/fixture/cleanup/hashchecksPASS.8browserroots and batch
controller212281 absent onlaptop; no runtime/SSH/testsession remains.

Remote inputbundle /home/wyatt/.cache/codex/umbrafox-laptop-perf-20261003-j0Q98b;
remote batch /home/wyatt/.cache/codex/dom-workload-comparison-20261003-RvMB1h.
Desktop evidence-onlycopy /home/wyatt/.cache/codex/laptop-dom-evidence-20261003-
RvMB1h;237whitelistedfiles hashverified. No profile/appdata/discovery exported.
Analysis/audit/evidence.sha256 retained; logs+auditcode artifacts/umbralink-control/
laptop-dom-* and audit-laptop-dom.mjs. Earlierdesktopfailedbatches kept separate.
Report: bot-docs/reports/performance/2026-10-03-page-dom-workload.md.
Packages extracted only into private laptopcache, not installed; no ownerbrowser,
profile,tabs,extensions,launcher,otherprojectprocesses changed. Goal remainsopen.

Automatic goal continuation completed one reversed BAABBAAB laptop replication
14:09:38-14:12:01UTC, remote cache/dom-workload-comparison-20261003-GPneTB;
desktop copy cache/laptop-dom-evidence-20261003-GPneTB.8new browsers/640samples,
48resource snapshots,236hashed copied files PASS; maxsample artifact188050216B.
All8roots and controller227054 absent onlaptop, SSH terminal. Unchanged9harness
hashes/fixture/sealedbinaries. Scratch driver/analyzer/audit now accept fixed
reverseorder (driver --reverse, audit ABSbatch);2AST fake-op protocoltestsPASS
after retained2FAIL RED. Originalscript hashes laptop-replication-scripts-before.
sha256, finalscripts laptop-replication-scripts.sha256 underartifacts.
Replication reductions: detached16.28%,attached18.13%,attrs7.65%,childlist11.78%.
All8Bmedians belowall8Amedians acrossbothbatches for eachofthese4cases. JScontrol
now8.91%faster (previous10.11%slower); no stableJSregression or JIT/layoutgain.
Results remainseparate, notsignificance/YouTubecause. Reports page-dom-workload
and mutation-gate/catalog updated. All16roots/2controllers absent acrossboth.
Read-only ownercheck14:11:35UTC: context23/doc34359738369 stillhidden/paused,
time18.530916,total1115/drop30; cache/youtube-state-20261003-ctGY6D/state.json.
No page changes. Furtherheadedwindow stillawaitsconsent; no implicitpermission
from goalcontinuation. No install/build/newnativepatch/agents. Goalactive.

## October 2 active performance goal

- Wyatt authorized desktop/YouTube performance work toward rendering, layout,
  CSS and JS optimization. Active work browser must still not be restarted or
  existing tabs/extension settings changed without consent. No new agent wave.
- Fresh evidence and next steps:
  bot-docs/reports/performance/2026-10-02-desktop-resumption.md.
  Current runtime Build20261001103920/PID3290300; userland active false,
  opacity optimization false, profiler inactive. WebRender NVIDIA RTX2060/X11.
  Paused YouTube context23 reports VP9 1080p60, not AV1. Hardware decode
  capability does not establish actual decoder use. Both YT tabs initially
  hidden/paused; waiting for visible playback is only the live-measurement gap,
  not a blocker to the entire engineering program.
- New read-only capture-playback.mjs and playback-spec.mjs (21 focused tests)
  sample explicit context with no browser launch, navigation, settings or page
  mutation. Actual paused-tab transport/negative classification verified.
  No stutter attribution or engine improvement claimed. Source work remains
  unstaged alongside all earlier unrelated dirty/staged work.
- One-shot native decoder read added in media-debug.mjs (9 tests; combined with
  playback/control:42 PASS). Final real read preserved page globals/paused state.
  Context23 retained VP9 HW flag true but decoder name shutdown; lifetime drops
  decoded0/sink0/compositor30, not an active-interval attribution. Final evidence
  ~/.cache/codex/umbrafox-decoder-final-20261002-SgmcKl/decoder.json.
  Detached-canvas screening of the same paused frame:8 video draws3-4ms each,
  cached-canvas draws below1ms; seed101ms. Candidate small per-image sized cache
  NOT IMPLEMENTED, no proof YouTube repeats same-frame copies. Read the report
  for limitations and source/proof gates before native work. No browser restart,
  preference change, build, install or native source edit in this follow-up.
- October 3 continuation supersedes the unimplemented-cache status: nine actual
  GPUVideoReadback C++ gtests were added in gfx/tests/gtest/TestGPUVideoImage.cpp.
  The uncached native run produced seven expected failures and two passes in
  ~/.cache/codex/readback-gtest-red-20261003-XA6xRT/gtest.log. A pre-existing
  TestRemoteImageHolder mock needed the V2 sized Readback override to compile.
  GPUVideoImage.h now provisionally retains one first-size DATA surface up to
  1MiB actual stride*height using CachedSurface; no shader/pixel/public API change.
  Green compilation/native tests passed; actual GPU pixel/performance checks
  remain pending. The candidate is not installed or accepted as a YouTube fix.
  Initial two-job binaries build reached its 1800s bound during final DOM
  compilation, no compiler error shown; original process group869265 is absent.
  Full incremental build passed (5m53s) with MOZ_BUILD_DATE=20261003071500;
  both INIs and buildid.h agree. Gtest rebuild passed (78s). Native run18/18
  PASS at ~/.cache/codex/readback-gtest-green-20261003-E8yjCc; shuffled stress
  nine tests*100 iterations PASS at readback-gtest-stress-20261003-qQDov7.
  Original stress summary assumed text output and failed; verified-summary.json
  correctly validates all900 structured Gecko events, with original log retained.
  Owned test roots exited; observed test/sandbox-probe PIDs absent. No owner
  browser change. Source hashes remain readback-native-source.sha256; scoped
  lint passed. Packaging passed in93s via mach build -j2 package. Candidate is
  exports/umbrafox-readback-candidate-20261003/, clean extraction and8checksums
  verified, no symlinks; isolated --version passed. ArchiveSHA826d7d880c19e94c...
  No test/build/package session remains running. No installation: actual GPU
  pixel parity and same-frame/per-new-frame performance remain required next.
  Existing staged/dirty native work untouched. Tracked-native comparison with
  sealed October1 source:34patch sections identical; only cacheheader+testmock
  differ. This does not certify untracked/compiler/generated/runtime equality.
- October 3 real-browser follow-up: new tools/umbrafox/tests/readback fixture,
  capture driver and tests. Sealed candidate and October1 baseline match exact
  RGBA SHA256 in 18 cases (two frames, nine draw variants,12repeats/case). Both
  report remote software ffvpx VP9 + software WebRender; no actual GPU path,
  cache-hit or performance benefit proved. Saved runs under ~/.cache/codex/
  readback-{candidate,baseline}-headless-20261003-{1,2}; baseline only has run1.
  All3 PASS/clean SIGTERM/0logdrops/rootabsence. RootPIDs951687/952584/956120.
  Finalcandidate2 uses final driver dispatch cancellation guard; failing-first
  race regression preserved. Combined tooling304PASS, exact4file lint0.
  Report: bot-docs/reports/performance/2026-10-03-headless-readback.md.
  No engine changes/build/install/owner-browser action in this follow-up.
  Candidate archive seal unchanged. Asked owner for one temporary headed test
  window <=2min, without touching existing tabs, for hardware-path checks;
  consent pending. Do not silently open a focus-stealing window. No running
  test/browser/controller sessions remain from this follow-up.

## October 3 Readback Lifetime Review

Latest follow-up admission watch: artifacts/umbralink-control/
dom-quiet-admission-7.log has10 samples over27.5s, all showing Cargo1125631;
a separate exact-parent process check found AeorDB test child1126296. The watch
exited2 as expected for busy admission; no benchmark/browser launched and no
owned session remains. Further measured comparison needs a quiet host; headed
hardware-window consent remains unanswered. Do not automatically retry or change
another project's work. Source-only review below is not performance acceptance.

October 3 source-only readback lifetime follow-up: no new blocker found in the
decoder/holder/new GPUVideoImage chain, parent strong Image+TextureClient maps,
refcount-one recycle callback, descriptor release and separately owned readback
Shmem. Serial is texture identity, not a per-frame token; retained references
are the recycling barrier. Cache payload cap is per live image, not total RSS;
concurrent misses can duplicate readbacks and first-copy-per-new-frame saves no
IPC. Source audit and hardware falsifiers added to
bot-docs/reports/performance/2026-10-03-headless-readback.md. Source manifest:
artifacts/umbralink-control/readback-lifetime-source.sha256. No engine edits,
runtime/build/install/owner-browser actions during audit. Pending headed consent
and GPU/pixel/resource gates unchanged; do not treat source audit as runtime proof.

## October 3 Mutation Mirror Candidate

The October 3 continuation also added an uninstalled native mutation-gate
candidate: dom/base/UmbrafoxUserlandMutation.cpp reads an always-mirrored
RelaxedAtomicBool for the existing userlandScripts.active key. The new static
pref group is registered in modules/libpref/moz.build; prior opacity-pref edits
are preserved. Native callback/toggle tests pass, and five live same-document
off/on transitions pass on both pre-mirror and candidate packages. Adjacent
userland browser suites:59 assertions/0fail; new clean package:5/0. Explicitfalse
native gate median36.65->1.71ns; minimal unattached text update78.80->44.94ns.
These are synthetic parent-process results, not a YouTube or page-speed claim.
Report: bot-docs/reports/performance/2026-10-03-mutation-gate.md. New package:
exports/umbrafox-mutation-mirror-candidate-20261003/; SHA10658410fda22d8a...
Same pinned BuildID20261003071500 as the earlier readback candidate, different
libxul/archive; do not use BuildID alone as provenance. Full build/gtest/package
passed, no installation/staging/commit or owner browser change. Candidate
already includes earlier readback changes and unrelated dirty source. Invalid
initial benchmark control and compilation-admission refusals retained. Corrected
baseline scratch suffixo6QeBZ; mirror suffixDBE4Xd under mutation-gate-survey-
corrected-20261003-. GPU/headed consent still pending; paused live tabs were not
made to play. Owner PID3290300 still resolves to October1 install at final check.

## October 3 Page DOM Follow-Up

New tools/umbrafox/tests/mutations fixture/capture/tests cover eight fixed DOM,
layout and JS cases, 2warmup+8trial rounds (80samples). Existing readback driver
now exports captureLocalWorkload; original main CLI preserved. Only tooling and
docs changed in this follow-up, no native rebuild/package/install. Final313PASS,
exact6filelint0. Seven actual DOM processes/560samples pass, plus actual shared
readback regression with18cases exact prior pixel hashes. All8owned roots absent,
cleanSIGTERM/0logdrops. Evidence report:
bot-docs/reports/performance/2026-10-03-page-dom-workload.md.
Comparison is INCONCLUSIVE: jx40nS refused before launch; 7sqVXQ and ZV2yDI each
ran only A B B before unrelated AeorDB cargo/rustc work blocked next admission.
Lastattempt45s wait exhausted. Do not pool incomplete batches or claim a page
speedup. New fresh quiet-host sequence is needed; do not change other project
processes. No automatic retry loop is running. Scratch roots start
~/.cache/codex/dom-workload-comparison-20261003-. Final manifest/logs under
artifacts/umbralink-control/dom-workload-*. Read-only livecheck09:40:21UTC still
found ownerPID3290300/context23/document34359738369 hidden/paused at18.530916,
1920x1080,total1115/dropped30. No valid active interval, no tab/settings changes.
Receipt ~/.cache/codex/youtube-state-20261003-e5dOsE/state.json. Headed GPU consent
remains pending. No test/controller/browser session remains running.

## October 3 Controller Cleanup

Further runtime follow-up: ERFBeO comparison passed4(A B B A), then fifth failed
on ENOENT for owned profile/safebrowsing-updating. Clean SIGTERM, root absent.
Bounded artifact rescan implemented only in lifecycle-capture.mjs+spec: descendant
ENOENT restarts entire scan <=3 attempts, shared8192entry budget, unchanged256MiB
and monitor deadlines; output-root errors remain fatal. Samples add artifactScan
attempts/entries. RED50PASS7FAIL; final342PASS/exact2filelint0, real rename test.
Reverse-delta hash proves all other prior source unchanged. Module81925468...,
spec253e3ae3...; report2026-10-03-artifact-rescan.md. Fresh wwqtOi passes3(A B B),
then renewed compilation exceeds45s; no aggregate accepted or auto retry running.
Audit additional7DOMruns/560samples+1failedbrowser:8roots absent,0drops/clean.
All21 new resource samples have attempts1 (no real-browser retry event observed).
Evidence artifacts/umbralink-control/artifact-rescan-*, comparisons5/6. Old seals
and candidate packages unchanged. No owner-browser actions/build/install/agents.

October 3 continuation: another DOM comparison (8p0KzD) refused before any
browser launch after 45s compilation admission. No new page-speed conclusion.
Independent source work found and corrected stale numeric keys in the four
native userland controller maps. New lazy finalization registry removes only
the still-current weak-reference entry; replacement/duplicate/live off-on
semantics retained. Source-only candidate, NOT in either sealed package or
installed browser. Report: bot-docs/reports/performance/2026-10-03-controller-retention.md.
Behavioral RED3pass/13fail; final17 focused and330 combined Node tests PASS,
two-filelint0. Actual V8 GC3rounds clears16384 entries/round versus original
16384 dead entries retained; not Gecko heap-byte or stutter evidence. Existing
Gecko3suites59assertions PASS, final isolated root mutation-mirror-browser-final-
20261003-Juve6w under cache; browser1083921/harness1083736/helpers absent. No
build/package/install/owner-browser changes. Module97ec22ce..., test7f729256...;
seal artifacts/umbralink-control/controller-finalizer.sha256. No active sessions.
Headed GPU consent and visible-playing YouTube sample still pending.

## October 1 profile recovery and launcher

- Taskbar pin was a direct file URL to the old nightly executable. With Wyatt's
  approval it now uses applications:umbrafox.desktop via Plasma live config;
  the desktop entry invokes ~/Programs/umbrafox. Other pins preserved.
- Dated prototype installation selected a fresh per-install profile
  cjmrhtcu.default-default-2. Original kvm20oct.default-default-1 was intact:
  read-only database counts were 353 bookmarks and 7670 history visits.
- Wyatt authorized closing the fresh browser and reopening his original profile.
  Closed normally via Ctrl+Q; no termination signal. Launcher now explicitly
  passes -profile "$HOME/.config/umbrafox/umbrafox/kvm20oct.default-default-1"
  and refuses a missing directory/places.sqlite. Latest-build selection remains.
  Backup of original launcher, profiles/installs.ini, places.sqlite and session
  files: /home/wyatt/.cache/codex/umbrafox-profile-recovery-20261001-Mkqpq0/.
  Database/session backup byte equality verified before reopening.
- Native executable and UmbraLink verified reopened PID3290300, BuildID
  20261001103920, original profile path, one window with 33 tabs. Fresh profile
  retained, no profile deletion or INI reassignment. Future controls tests must
  preserve owner's existing tabs and require consent for browser shutdown.

## October 1 UmbraLink control implementation

- Wyatt authorized adding tab navigation/create/close and arbitrary page/browser
  JavaScript execution before a new prototype. Public JavaScript parity remains
  mandatory: no new page globals or automation flags. Explicit owner script
  effects are distinct from control plumbing. Never restart, close or alter his
  active work browser without prior consent; uBlock settings remain untouched.
- Source implementation is unstaged in ControlBrowser/ControlScript modules,
  ControlExecution actors, existing authenticated service dispatch and packaging.
  Protocol and limitations: toolkit/components/umbrafox/docs/control.md.
  Commands are umbrafox.browsingContext.{create,close,navigate} and
  umbrafox.script.execute with page/browser realm selection.
- Twelve strict-unhandled Node mock tests pass in
  tools/umbrafox/tests/control/control-spec.mjs. Actual browser integration tests
  were added in browser_control_browser.js but NOT RUN. Mock checks do not prove
  Gecko sandbox behavior, navigation integration or public-interface parity.
  No browser/build/package/install was performed for this implementation.
  Logs: artifacts/umbralink-control/. Release/dogfood acceptance still requires
  isolated Gecko integration and adjacent service/input tests. Preserve all
  unrelated staged and unstaged performance/native work.
- Script timeouts bound asynchronous waiting, not synchronous infinite loops;
  cancellation cannot roll back explicit script effects. Browser realm grants
  full owner privilege behind the existing per-run authenticated loopback token.
- Superseding the pending integration/build gate above: Wyatt authorized parity
  tests and a new prototype. Real tests caught and fixed topChromeWindow target
  lookup and system-principal filename validation (per-evaluation opt-out only
  for browser realm). Full build and package passed, with MOZ_BUILD_DATE pinned
  to 20261001103920 after a preserved runtime/INI mismatch. Browser tests:84 pass,
  0 fail,1 harness TODO. Standalone actual-page OFF/ON tests pass without
  automation flags, webdriver false, including a clean extracted package and
  native app-data/buildID/cleanup receipts. Tests compare selected same-build
  public surfaces, not universal stock-Firefox parity or performance.
  Package/report: exports/umbrafox-prototype-20261001/README.md. Installed browser
  and launcher remain untouched; wait for Wyatt to close his work browser before
  installing. Existing unrelated dirty native work is in this prototype; optional
  probes and experimental single-image opacity remain OFF. No Pi work authorized.
- Wyatt subsequently authorized installation while leaving his active browser
  running. Installed the sealed package side-by-side at
  /home/wyatt/Programs/umbrafox-20261001-103920-158.0a1, verified full tree equality
  before adding .purgecaches, then atomically renamed the hidden staging folder.
  Existing installs and ~/Programs/umbrafox were not modified. The launcher
  selects dated directories lexicographically, ahead of nightly directories;
  bash -x launcher --version confirmed this exact new path and version158.0a1.
  Executable/libxul hashes match the sealed package and both INIs have BuildID
  20261001103920. Wyatt must fully quit and reopen via the launcher; in-browser
  restart may execute the old binary directly. No browser shutdown was performed.
  Receipt: exports/umbrafox-prototype-20261001/INSTALL.md; launcher verification
  log: artifacts/umbralink-control/install-launcher-verification.log.

## September 30 handoff

- Read `bot-docs/reports/2026-09-30-bot-handoff.md` for the full continuation
  guide requested by Wyatt while pausing Codex for token availability.
- On September 30 the historical `/tmp/codex/teamwork/umbra-perf-20260926/progress.sqlite`
  and entire `/tmp/codex/teamwork/umbra-perf-20260927/` were confirmed absent.
  Do not rely on their old bus/logs/manifests or recreate fake historical state.
  Durable campaign evidence under `~/.cache/codex/umbra-perf-20260927/` remains.
  The three reviewed app-data harness hashes and scratch native driver still
  match. No runtime/build/agent wave was started for the handoff.

## Cross-project coordination

- The owner has authorized direct coordination with the `l8ros` bot on `wyatt-laptop` for Umbrafox/L8ROS integration work. It is acceptable to attach to the `l8ros` tmux terminal and inject prompts directly when working through shared browser, Pi, Wayland, ARM64, media, or renderer issues.
- The `l8ros` bot has also been told it may contact this Umbrafox agent directly.
- Before injecting a tmux message, capture the pane and verify the input is empty,
  not merely that the working directory matches. If an owner draft is present,
  leave it untouched and use the coordination DB or a verified websocket target.
  On 2026-09-26 a handoff was appended to an existing draft; its correction is
  retained in the performance coordination DB. Sending Enter can submit that
  draft, so it is not a safe fallback without this check.

## Overnight performance campaign, 2026-09-27

- Canonical scope and gates: `bot-docs/plans/performance-program.md`. The owner
  requested continued overnight work; physical Pi work remains owned by `l8ros`.
- Teamwork SQLite: `/tmp/codex/teamwork/umbra-perf-20260926/progress.sqlite`,
  session `perf-night-20260927`. Control bus:
  `/tmp/codex/teamwork/umbra-perf-20260927/bus.txt`; read after every command.
  Evidence is under `/home/wyatt/.cache/codex/umbra-perf-20260927/`.
- The staged tooling/docs milestone is separate from workers' unstaged soak
  extension and the dirty native probe gate. Never stage or reset whole-tree
  changes. Native ON compilation is on HOLD pending a reviewed normal build
  environment; OFF checks and pure source tests do not establish release or
  packaged exclusion. No new source copies, package/install or Pi work follows
  from the local harness scope.
- Profiler CLI 0.10.0 marker starts subtract `context.rootRange.start` while
  exported context retains the raw range. Retain the explicit clock conversion;
  raw-pair/incomplete-edge provenance is absent from supported exports. Details:
  `bot-docs/reports/performance/2026-09-27-pi-renderer-spans.md`.
- Any future local profiler load must explicitly use symbol server
  `http://127.0.0.1:9`; an earlier daemon advertised the default external server,
  so an unconditional no-network claim for that historical load is unsupported.
- Three corrected lifecycle smokes passed bounded functional/discrete-admission
  review; they do not establish a leak or memory slope. Longer NONE execution
  requires the separate canonical soak implementation/review/runtime gates.
- First fixed NONE soak `lifecycle-soak-none-1` passed its functional/sampled
  gates in 1451.616 seconds, with clean owned cleanup. Its log revealed
  crash-reporter Glean upload attempts. **All further browser runs are stopped**
  pending application-data containment: CrashManager cleanup uses shared
  `UAppData/Crash Reports`, not just the new profile. Do not read shared crash
  queues, payloads or personal profiles. Failed TLS attempts do not prove no
  other upload succeeded, and the log does not prove a browser crash.
- Source-supported containment candidate: child-only `MOZ_APP_DATA` and
  `MOZ_LOCAL_APP_DATA` point to fresh private directories inside the owned run.
  `nsXREDirProvider::GetUserDataDirectory` reads these before legacy/XDG paths;
  current libxul contains both names. This is not yet runtime verification.
  `MOZ_CRASHREPORTER_NO_REPORT` does not guard JS cleanup. Health-report opt-out
  alone may still process deletion pings in a shared Glean store. No TLS bypass,
  shared-queue mutation or automatic repetition is authorized.
- Native root-proof audit rejects adjacent xpcshell: it uses a different
  directory provider. Existing Marionette chrome-context execution can query
  the browser parent's `UAppData` and Linux `DefProfLRt`, but requires explicit
  broad `-remote-allow-system-access`, is automation-marked, and runs after
  normal startup. It is not pre-consumer or no-earlier-access proof. At about
  08:24 UTC the parent asked the owner for one separate bounded diagnostic after
  containment review; that permission is pending. Do not launch automatically.
  Source reports: campaign scratch `appdata-proof-design.md` and
  `appdata-parent-route.md`. Code/review work may continue while browsers stop.
- Application-data harness code gate passed at about 08:35 UTC: exact three-file
  freeze manifest `/tmp/codex/teamwork/umbra-perf-20260927/appdata-freeze.sha256`,
  worker and parent 247-test passes, clean scoped lint, independent 36-case
  fake-operation review (`appdata-review.md`). The original output creation
  identity is retained through provenance and final pre-spawn checks. No browser
  has run with the correction; do not equate code acceptance with runtime
  admission. Marionette's loopback listener has no token authentication; its
  proposed system-access diagnostic remains an explicit pending owner decision.
- At this waiting-owner checkpoint all four workers completed. The coordination
  monitor was stopped with verified owned SIGTERM; PIDs 2433538, 2433555 and
  2433556 are absent. No parent test/lint session remains running. Restart one
  new monitor only when another authorized worker wave starts; do not assume
  the old watcher still exists. DB session is `waiting_owner`, not complete.
- Superseding the pending diagnostic permission above: Wyatt's later "Please
  continue" authorized one explicitly announced bounded Marionette parent-root
  diagnostic. It passed at 21:26 UTC in 4.466 seconds; no repeat followed.
  Receipt PID 3421295/type0/runtime BuildID20260925185028 returned exact fresh
  owned UAppData, DefProfLRt and ProfD paths. Original directory stamps matched.
  Client PID3421387 and browser root are absent; owned listener127.0.0.1:41211
  inode25362183 is absent. Browser stopped by owned SIGTERM, zero log drops.
  Evidence/result: campaign scratch `appdata-native-proof/RESULT.md` and
  `appdata-native-proof/run-1/`. Independent source review plus 28 Node and four
  fake-client tests preceded launch; existing harness freeze remains unchanged.
  This is post-startup native root proof, NOT no-earlier-access/no-upload or
  performance evidence. Further browser/performance runs remain held for a
  separate decision; no personal/shared queue inspection or automatic retry.
  The temporary coordination monitor session80843 has exited; no diagnostic
  controller/client/browser session remains running.
