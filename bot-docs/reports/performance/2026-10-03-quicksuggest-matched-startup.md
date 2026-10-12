# QuickSuggest Matched Startup Pilot

## Outcome

One fresh candidate and one fresh baseline ran sequentially on `wyatt-laptop`,
candidate first. Both passed the complete driver, including capture, owned
cleanup and the prospective installation postcheck. Both used the same native
build and US/en-US settings with no explicit main or regional Suggest user pref.
The baseline activated main Suggest, its effective setting, Rust backend and
AMP feature. The candidate kept all four off. Both observations in each run
agreed, with completed initialization.

This is native functional confirmation of the regional-control candidate, not
just the earlier source replay. It is also an initial startup CPU/footprint
signal, not a proven performance improvement, causal cost attribution or video
stutter fix. No desktop installation, launcher, personal profile, extension,
headed window, native build or profiler was changed or started.

The [earlier failed pilot](2026-10-03-quicksuggest-startup-pilot.md) remains failed.
Its package and evidence were not changed or reused as fresh state.

## Driver Integration

New scratch entry point:
`artifacts/umbralink-control/quicksuggest-updates-pilot.mjs`.
The sealed original driver and all shared capture helpers are unchanged.
The entry point reuses `prepareInstallation`, `captureStartup`, `runPilot` and
`finishInstallationCheck`, composing them with the separately verified
`admitStartupUpdates` and `verifyStartupUpdates` adapter.

The driver saves the policy name and original installation inventory before
capture, checks cancellation immediately before launch, and retains earlier
capture failures even if installation verification succeeds. Failed package
observations remain in terminal evidence. Independent browser-root absence and
clean capture cleanup are required before the package check.

The 60-second preparation envelope, 45-second copy/enrollment signal, original
120-second browser envelope, 15-second cleanup reserve, 32 MiB sampled startup
headroom requirement, 256 MiB run-artifact cap and other resource caps remain.
No updater, cache, region or Suggest preference override was introduced by this
driver. The existing isolated profile/application-data harness is retained.

The exact same package proof is pinned by SHA256:
`ecbde46a0a2704883bd7cea626ba23d2cbf54a7013c809d5cf574ef17ee79aff`.
Its raw bytes are authoritative. An initial negative probe comparing a
deliberately inconsistent parsed copy of the 6 MB proof hit its 10-second bound.
That incomplete probe is retained, not counted as passing. The redundant
whole-object comparison was removed; the entry point hashes and parses the
raw bytes directly. The real proof and three corruption/type negatives then
passed the bounded check.

Local and remote tests each passed **75 tests**: 10 new composed-driver cases
plus 65 installation, verifier and original-pilot regressions. The meaningful
integration RED was 2 passes and 4 expected failures after correcting the stub
to forward fake absence checks. The earlier incomplete-stub RED is retained.
A further held-preparation regression failed before adding the abort-aware
wrapper; a late preparation result cannot cause launch. No actual browser is
started by these unit/filesystem tests.

Exact new-source/spec lint passed with zero errors or warnings. No source was
staged or committed. Existing seals and the staged baseline remained unchanged.

## Inputs And Execution

Private remote harness:
`/home/wyatt/.cache/codex/quicksuggest-updates-harness-20261003-d8YQlj/`.
Its 21 code, fixture and test files matched before and after runtime. Both
pristine package variants passed full admission and verification before launch,
with 46 files each and no lock. Captures used separate exclusive copies, not
those pristine source directories.

Both use BuildID `20261003071500`, with common native B libxul SHA256
`1e2e164e54d826958361ccff1e4a75bb1c92814f9b87877ab340c3bc56f7f2fb`.
This is not native A from the older sustained playback capture. Do not pool
these measurements with that capture.

Preflight at `2026-10-04T04:14:21.899Z` found no browser roots or recognized
compiler processes, load averages 0.23/0.82/0.67, 11686592512 available memory
bytes and 175221682176 available disk bytes. This is a point-in-time check, not
continuous host exclusivity. The date was still October 3 in America/Phoenix.

| Observation | Candidate | Baseline |
| --- | --- | --- |
| Remote run suffix | `NXA6xB` | `ov103a` |
| Controller PID | 670095 | 673442 |
| Browser PID | 670568 | 673933 |
| Capture start UTC | 04:18:18.137 | 04:22:35.789 |
| Capture finish UTC | 04:18:59.477 | 04:23:17.144 |
| Capture duration ms | 41340 | 41355 |
| Region / locale | US / en-US | US / en-US |
| Regional-control pref | false | absent |
| Main / effective / backend / AMP | all false | all true |
| Profiler | off | off |
| Resource samples | 11 | 11 |

Full run paths have prefix:
`/home/wyatt/.cache/codex/quicksuggest-updates-startup-20261003-`.
Neither run applied an explicit main or regional user preference. The browser
realm receipts name the expected parent PID and same fixture context/document
at both boundaries within each run. Snapshot intervals were 30015.674916 ms and
30016.332034 ms, respectively.

## Measured Signal

| Saved measurement | Candidate | Baseline |
| --- | --- | --- |
| First snapshot browser uptime ms | 10968.540 | 11009.528 |
| Parent cumulative CPU at first snapshot ms | 3771 | 6643 |
| Parent cumulative CPU at final snapshot ms | 11252 | 14117 |
| Parent CPU added during the next 30 seconds ms | 7481 | 7474 |
| Artifact bytes at startup baseline | 63634842 | 187916110 |
| Maximum sampled run-artifact bytes | 139072872 | 267383189 |
| Remaining bytes under artifact cap | 129362584 | 1052267 |
| Maximum sampled summed VmRSS bytes | 1560969216 | 1569206272 |

The baseline had 2872 ms more cumulative parent CPU at the approximately
11-second observation. The subsequent interval added essentially the same
parent CPU in both runs. Thus the observed difference is concentrated before
the first snapshot; this does not isolate which operations caused it.
Fixed observation delays dominate capture duration, so the duration row is not
a startup-latency benchmark.

The CPU producer is `UmbrafoxControlDiagnostics.sys.mjs::readProcessSnapshot`:
`cpuTimeSinceProcessStartMs` reads `ChromeUtils.cpuTimeSinceProcessStart`;
the separate ProcInfo conversion rounds nanoseconds to milliseconds.
The inspected module hash
`3aaa1ba04e2c4cf0e02e0e17dcabc4c23584cb099c7ca873feb8be870db667cf`
matches the pinned entry in both packaged variants. This is packaged-source
correspondence, not an independent loaded-module receipt. Reported memory and
CPU fields are not frame-time, GPU-wait or media-decoder attribution.

Artifact totals include the entire owned run tree, not just Suggest files.
No file-content attribution was performed. Summed VmRSS may count shared pages
more than once and is a safety measure, not private heap ownership. The pair
is ordered, unrepeated, and subject to startup/network/cache/scheduling
variation. No causal percentage improvement is established.

The baseline peak leaves only **1.0035 MiB** under the unchanged cap. Both runs
passed the sampled caps, but this is not continuous size coverage, final disk
size, or sufficient assurance for a longer run. Further repetitions/extensions
are held pending review of that headroom; do not increase the cap or delete
cache state to make a comparison pass.

## Cleanup And Evidence

Both captures report clean SIGTERM cleanup, root absence and zero dropped log
bytes. Each 182-byte log retains the known namespace EPERM, headless and SWGL
warnings. This is not a no-network/no-upload claim.

Independent checks after exit found both controllers and all 11 sampled browser
PIDs per run absent. The final check at `04:24:55.074Z` also reverified all 21
harness file hashes. It does not exclude unsampled transient helpers.

Both installation postchecks passed with all original files/identities intact,
the exact empty updater-directory trio and one empty permitted lock. The file
count becomes 47 because it includes that lock; original package byte totals
remain 475119407 and 475118954. No original failure was relabeled.

Only 70 whitelisted top-level exports, 254942 bytes, were copied and checked
against remote per-file hashes. No profile/application-data contents, discovery
credentials or crash queues were exported or opened by the post-run audit.
The running harness still uses its own private discovery credentials and walks
owned run-tree metadata for resource accounting. Local evidence:

`/home/wyatt/.cache/codex/quicksuggest-startup-pair-evidence-20261003-WDFtT6/`

The `candidate` and `baseline` subdirectories retain each run separately.
Driver logs, hashes, source correspondence, cap checks and arithmetic summaries
are in `artifacts/umbralink-control/quicksuggest-updates-pilot/`.
Independent saved-data checks validate all 22 resource samples globally and all
16 applicable baseline-relative samples, using the exact saved baseline match.
The milestone seal is `quicksuggest-updates-pilot-final.sha256` in the parent
artifact directory. All runtime, transfer, test and audit commands have exited.

## Next Work

1. Review the baseline artifact trajectory before another repeat. Preserve the
   low-headroom result rather than treating it as spare long-run capacity.
2. Use the matched native activation result to guide a bounded, counterbalanced
   startup-cost experiment. Source replay and this pair do not cover every
   migration, user-setting or Nimbus configuration; native regression coverage
   and release/package acceptance remain separate.
3. Trace the substantial shared background CPU separately. Suggest suppression
   did not remove the roughly 7.5 seconds of parent CPU in the later interval.
4. Resume headed rendering/video comparisons only with the pending window
   permission. No claim about hardware acceleration, YouTube, frame pacing or
   the owner's reported stutter follows from these headless startup captures.

The candidate is still uninstalled. The owner's daily desktop browser remains
untouched.
