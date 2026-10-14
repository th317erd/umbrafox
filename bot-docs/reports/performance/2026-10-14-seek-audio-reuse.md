# Seek Audio Reuse Correction

Status: reproduced paused-stream seek regression fixed; native and packaged
playback gates passed. Corrected beta installed separately, daily browser and
launcher untouched. This is not a claim that every YouTube stutter is fixed.

## Observed Defect

The isolated laptop's logged reuse run XkWE68 reproduced sustained post-seek
drops:172/2675,140/2700,131/2501 frames in the three recovery windows, after a
3/1200 baseline. Profiler was off. Logging was limited to the existing internal
AudioStream module;2056 bytes, zero dropped log bytes. Cleanup was clean and all
14 recorded browser/controller PIDs were absent afterward.

At04:20:47.345447UTC the stream stopped; at04:20:47.703071 it restarted. Its
subsequent RebaseLive selected no carry with raw play cursor1163952 and write
cursor1171312. The difference is7360frames,153.333ms at48kHz. This was a valid
nonzero position query, not evidence for the separately suspected query-error
fallback.

AudioSinkWrapper allowed a healthy but physically stopped sink to be stashed for
seek reuse. Resume restarted it; RebaseLive then assumed the queued audio would
not play. That assumption is not a backend contract. In the pinned cubeb Pulse
implementation, stopping corks the stream without flushing its queue. Removing
the outstanding play/write offset breaks the frame-history mapping, which can
then saturate at the serviced total and advance in callback-sized steps.

The earlier profile's42.667ms clock steps are consistent with this mechanism,
not a separate proof of it. This run did not retain a fresh backend-name receipt;
do not turn the Pulse source trace into an observed backend-selection claim.

## Correction

An internal AudioStream query requires keep-running mode, a physically started
backend, and logical STOPPED state. AudioSink forwards it; AudioSinkWrapper::Stop
requires it before stashing. Already-stopped streams use the existing asynchronous
recreation path, including the seek-target clock hold. Continuously running seek
reuse remains enabled and tested.

No new public interface, preference, probe, clock bias, queue flush, or default
change. The fix restores the established fresh-stream path when the reuse
optimization's precondition is absent. User-facing media APIs and request shape
are unchanged. This is not universal Firefox-equivalence proof.

## Verification

- Native failing-first:38 tests,35 pass and exactly3 expected recreation failures.
- Native corrected:38 pass,0 fail,0 skipped; clean owned process exit and package
  postcheck. Includes clock latency alignment, continuous reuse, stale samples,
  repeated seek, muted resume, dead stashed stream, async initialization and video
  frame selection. MockCubeb is not a real PulseAudio queue test.
- Three new/updated tests cover pause-before-seek recreation, audible clock
  alignment after that recreation, and ordinary pause followed directly by
  Stop(Seeking). Final source differs from the compiled GREEN test only by
  comment wrapping and clang-format whitespace; separate exact reconciliation
  checks are retained. Production source hashes match the package inputs.
- Native and documentation scoped lint passes; diff whitespace check passes.
- Scoped Sphinx renders the two pages but fails on82 unrelated global missing
  toctree references, with8 known failures. No AudioStream/AudioSinkWrapper page
  warnings appeared. No warning suppression or unrelated documentation repair.
- New capture adapter's failing-first logging-control test rejects unconditional
  logging; corrected fake capture/adjacent tests pass96 cases. Additional
  candidate admission test pins both package manifests and rejects other cells.
- Same-build UmbraLink OFF/ON ordinary public-surface smoke passes, including
  globals, Navigator/Document/Element shapes and webdriver=false. Private-root,
  native BuildID and beta-pref receipts pass, both owned runs cleanly stopped.
  This is a bounded same-build test, not universal Firefox/network parity proof.

## Packaged Candidate

Export: `exports/umbrafox-seek-audio-20261014/`, Build20261014043800.
Archive119446160bytes,47regular files, no symlinks:
`umbrafox-seek-audio-20261014043800-linux-x86_64.tar.xz`, SHA256
`398f90eebc88dbc9fc92161ded4abb05c7e2c8e03f8b7c29cd75747e2b874b8d`.
Package manifestSHA256
`e097f7f7c0d8ff39146f173475731282c1e4574f1e3835e66e19861042d47d05`.
Native base `d43214d6704182dabefff44b772764db04e386f1` plus frozen source.patch
`25dc610fb3dea94837a236d26bc89e72d9bef5ccdbccd441aa037a982c1f5c65`.
Beta overlay remains `4278e82f4538bf4058aefd3b488e77069be9c7edd1e36791456c194e79967eb2`.

Both native ELF and INI BuildIDs are checked. The only changed omni.ja member
against the beta baseline is AppConstants.sys.mjs; configuration and overlay
match. Native binaries/build metadata differ as expected, so this is not a
whole-payload identity claim. Native builds used2jobs/nice10; mach package used
its16job make invocation without compiler activity and XZ compression2threads.

## Runtime Contract

Use sealed beta Build20261012202039 as baseline and candidate20261014043800.
Same d43214 native base, build configuration, private iHD decoder library and
explicit beta graphics overlay. Existing beta source repairs are checked
unchanged; additional canvas test-only repair is not normal runtime code.

Fixed laptop sequence: baseline with AudioStream logging, candidate with the same
logging, then candidate logging OFF. All use the same signed-out1080p60 AV1 video,
normal progress-bar seek45s forward, audio at0.05, and130s recovery. Profiler OFF.
Preserve240s total/225s work/15s cleanup and256MiB artifact caps. Verify terminal
evidence and exact recorded-process absence between runs. Acceptance requires
each recovery window below1% drops in both candidate runs, not an average selected
after looking at the data. Counter evidence is not physical scanout proof.

No owner desktop browser restart, profile modification, or Pi work. Package
installation must retain the launcher and refuse an active destination.

## Playback Results

One fixed sequence, no retries or selection of favorable candidate runs:

| Cell | Before seek | Recovery 1 | Recovery 2 | Recovery 3 |
|---|---:|---:|---:|---:|
| Baseline, logging on | 27/1201 (2.25%) | 402/2674 (15.03%) | 583/2699 (21.60%) | 427/2502 (17.07%) |
| Fixed, logging on | 7/1201 (0.58%) | 10/2677 (0.37%) | 9/2700 (0.33%) | 5/2499 (0.20%) |
| Fixed, logging off | 4/1201 (0.33%) | 8/2677 (0.30%) | 5/2700 (0.19%) | 5/2498 (0.20%) |

All six candidate recovery windows passed the predeclared below1% criterion.
These are reported dropped/total video frame counters, not physical scanout.
Each run used the same public signed-out1080p60 AV1 workload, audio and UI seek.
The live site and host still introduce run variability; this is one bounded
sequence with native regression and branch evidence, not a population estimate.

The packaged baseline repeated the defect: same stream stopped/restarted, then
play1163541/write1171312/carry0 (7771frames,161.896ms at48kHz). The candidate log
instead shows the stopped stream shut down/deleted, followed by a new stream
initialized on BackgroundThreadPool. No RebaseLive occurred. The logging-off
candidate retains configuration/binary proof but has no native branch log.

Laptops roots under `/home/wyatt/.cache/codex/`:

- `laptop-seek-audio-candidate-baseline-log-20261014-HzI4G9`
- `laptop-seek-audio-candidate-candidate-log-20261014-fSoCso`
- `laptop-seek-audio-candidate-candidate-off-20261014-XHPfNx`

Each completed in about171seconds,37resource samples, clean owned SIGTERM,
14recorded browser/controller PIDs absent and0dropped log bytes. Log sizes
2069/2372/337bytes. Peak sampled artifact bytes181670030/154369543/180421254,
below unchanged256MiB caps. Five-second sampling is not proof about every
transient process. Final05:10:36UTC preflight found no matching browser/compiler
and all89 harness input hashes unchanged. All owned commands are terminal.

## Installation

Installed Build20261014043800 to `/home/wyatt/Programs/umbrafox-nightly/`,
47exact package files plus `.purgecaches` (0600). Target inactivity, original
directory identity, complete archive/tree hashes and unchanged launcher checked.
Previous package retained at
`/home/wyatt/Programs/umbrafox-nightly.before-seek-audio-20261014-043800/`.
Installed binary `--version` returned `Umbrafox 160.0a1`, exit0, owned PID2606827
absent afterward. No personal profile was opened for this check.

The unchanged launcher still prioritizes dated installations over nightly.
A normal restart therefore does not automatically select this fixed beta.
Do not change that silently or launch it against a guessed personal profile:
per-installation profile mapping needs verification before a later daily switch.

## Evidence And Limits

Native build/tests and package scripts:
`/home/wyatt/.cache/codex/seek-audio-fix-20261014-5oJiex/`.
Isolated build source/object tree:
`/home/wyatt/.cache/codex/umbrafox-beta-20261012-nYSBPOWS/`.
Capture namespaces: `artifacts/umbralink-control/seek-reuse/`, `seek-audio-log/`,
and new `seek-audio-candidate/`.

The candidate evidence seal contains59files/2950599bytes; SHA256SUMS hash
`f00401af476262f1eeadd8ef9da4e86155d3684c3948949da23ea6da36a9fcb5`.
All59entries independently verified after sealing. `acceptance.json` records
the exact fixed-sequence gate; its script replays each export, compares the
saved review, validates per-cell package/log mode and checks every window.
No personal profile, crash queue, control token or raw profiler dump is exported.
Final installed tree/source hash check at05:13:56UTC passes; launcher syntax
check passes. Final9native-inventory/candidate/beta contract tests pass.

Prior A/B/C reuse/recreate cells passed; fourth reuse stopped on an unstable
artifact scan, so the ABBA sequence is incomplete. No fourth performance result
is invented. The subsequent logged reuse reproduction is separate evidence.

The first candidate packaging attempt caught stale BuildID metadata. Normal
build generation and native library regeneration corrected it; the ELF note is
checked, not just INIs. A later serial compression attempt timed out and its
partial archive was preserved and rejected. Faster repacking changes only the
archive compression level, not payloads.

Raw-position-query failure can still produce an invalid zero-anchor rebase in a
live stream with temporarily unavailable timing information. That separate edge
is now documented honestly; it was not observed in this failing run and is not
fixed by the stopped-stream guard.

Archive validation5tests and installation safety4tests pass. Scoped code lint,
test formatting, saved capture replay, package hashes, installation and source
hash guards pass. The six38-test native families ran optimized with MockCubeb;
this does not claim debug-only assertions ran or all Gecko tests passed. The
earlier seven prescale pixel-test failures and experimental graphics smoothness
limitations are not fixed or reclassified by this audio change.

Review: owner-thread eligibility reads existing state; atomic stream state and
existing error/drain gates remain. Native tests retain continuous reuse, repeated
seek, muted startup, async initialization, dead stashed stream and latency
alignment. No added content-visible property, network rewrite or pref/default.
Private diagnostic roots/exports exclude personal profile/control-token data.
Same-build surface smoke is bounded; native playback semantics and owner daily
confirmation remain more relevant than an unsupported universal parity claim.

Native review group from authoritative Herald output is
`#media-playback-reviewers` (blocking). No human review or CI submission is claimed.
