# Umbrafox Working Memory and Resume Instructions

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
