# Current-Package Compositor Baseline

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

A fresh unprofiled/profiled/unprofiled laptop sequence and supported offline CLI
analysis completed on the current descriptor-borrow package. All twelve phases
reported zero video drops; final native decoder, sink, compositor and container
drop counters were also zero. The earlier 146 ms callback gap and 154 ms Renderer
span did not recur. Their absence in this sequence is not a stutter fix or proof
that label-allocation, frame-reuse or descriptor changes caused an improvement.

Seven callback gaps over 50 ms remain across the three runs, all in phase zero.
The maxima are 51, 53 and 52 ms. There are no gaps over 100 ms. In the profiled
run, recorded Composite and video-callback scopes remain below 2.43 ms. Parent
GeckoMain has substantially more non-idle samples in the first two phases than
the last two. Native symbols are unresolved in this offline export, so this is
a localization lead, not an identified producer or a cause of callback gaps.

No product code, build, public interface, preference default, installation,
launcher, daily desktop browser, personal profile or Pi state changed. The GPU
import experiment remains default OFF outside the disposable test configuration.
The broad rendering/layout/CSS/JavaScript objective remains active.

## Controlled Sequence

All arms use the same normal 46-file package, BuildID 20261006175655, manifest
`1de58db614be934fb7fe71fc46ea168ce9777a8b46e340d3f429090b4e3e6773`.
It includes the renderer-label, frame-reuse and descriptor-borrow changes that
the previous detailed profile predates. Import is ON in all arms. There is no
PBO override and no claim of observed internal renderer upload mode.

The owned 1920x1080 H.264 clip draws to a 320x180 default canvas for 48 seconds,
in four 12-second phases with 1/4/4/1 copies per callback. The original workload,
ordinary page clocks, eight retrospective phase marks and observer boundaries
are unchanged. This is neither YouTube nor a physical presentation test.

| Measurement | Control Before | Profiled | Control After |
| --- | ---: | ---: | ---: |
| CPU seconds / elapsed second | 0.570471 | 0.725618 | 0.572467 |
| Browser CPU, ms | 19473.390 | 21295.750 | 19742.509 |
| RDD CPU, ms | 2031.008 | 2961.418 | 2021.481 |
| Content CPU, ms | 5732.893 | 7510.305 | 5537.671 |
| Callback gaps over 50 ms, phases 0-3 | 2 / 0 / 0 / 0 | 4 / 0 / 0 / 0 | 1 / 0 / 0 / 0 |
| Largest callback gap, ms | 51 | 53 | 52 |
| Video drops, all phases | 0 | 0 | 0 |
| Four-copy batch median, ms | 1 / 1 | 0 / 1 | 1 / 1 |
| Four-copy batch P95, ms | 2 / 2 | 1 / 1 | 2 / 2 |

Profiled CPU rate is 27.196% above the first control and 26.753% above the second;
the controls differ by 0.350%. One fixed-order sequence does not isolate profiler
causality or supply a statistical effect estimate. Native process CPU joins only
stable endpoint/sample identities, excluding unobserved transient processes.
Page draw durations are synchronous wall times, not GPU completion times.

The profiler uses the existing 16M-entry, 5 ms configuration with JS stacks,
stack walking, process CPU and no marker stacks. No new per-frame instrumentation
was added. The gzip is 11290955 bytes, SHA256
`335206038875249534a47c0e344665291dc5949c45d6847d76390c7169debbbe`.
Its bytes are opaque to the harness and are parsed only by profiler-cli.

## Offline Admission And Observations

Installed profiler-cli 0.10.0 loaded this file once in the owned session
`current-composition-20261007`, with explicit symbol endpoint
`http://127.0.0.1:9`. The exporter retains commands, status, output, raw profile
hash and exact daemon/socket identity. No external symbol endpoint is used.

The profile contains 36 threads across 10 processes. Eight UserTiming boundaries
join the saved fixture PID 1950828 and document 10737418242. Raw root range is
11310.979029-60452.423589 ms; CLI marker times are normalized by its start.
The analyzer checks both coordinate systems rather than comparing them directly.
Parent GeckoMain, Renderer, CanvasRenderer, Compositor and content GeckoMain each
have samples before, within every phase and after playback. These brackets do
not certify complete marker recording, native split-marker pairing or CPU time.

| CLI-derived scope | Contained count | Phase median range, ms | Largest contained span, ms |
| --- | ---: | ---: | ---: |
| Renderer Composite | 2094 | 1.153-1.235 | 2.327 |
| Renderer notifier Runnable | 2094 | 1.198-1.288 | 2.433 |
| Content video-callback scope | 1192 | 0.606-0.980 | 2.426 |
| CanvasTranslator Runnable | 1193 | 0.999-1.253 | 4.610 |
| Content RefreshDriverTick | 1225 | 0.768-1.206 | 2.637 |

Outside and crossing markers are accounted separately: Composite and notifier
each have two outside; CanvasTranslator has one outside and one crossing;
RefreshDriverTick has two outside and one crossing. The Composite selector is
confirmed against the actual `Composite #1` export, not assumed from old data.
The callback scope count happens to equal page callbacks here; it is not a
general one-to-one semantic guarantee. No inferred nested partition is used.

The compositor export contains 786 in-phase skips labeled `No reason to generate
frame`, and two outside-phase skips. There are no in-phase `Too many pending
frames` entries. The video-drop marker search has no matches; absence of markers
alone is not proof of no drops. Separate native and page drop counters are zero.
Parent compositor markers do not provide a causal fixture-document join.

Parent GeckoMain non-idle sample counts are 339/282/16/18, out of roughly 2400
samples per phase. Renderer counts are 134/135/134/131. The parent-main early
activity includes DOM, JS, network and GC categories. The export does not
identify the native functions or establish that any of those samples delayed
the fixture. Do not equate this distribution with per-process CPU percentages.

## Failure Preserved

The first namespace, `artifacts/umbralink-control/current-compositor/`, launched
one control but failed before playback/profiler start. Its reused gzip helper
still required the old `laptop-composition-r3` directory pattern. The original
run remains FAILED, with clean owned SIGTERM, 22 exported files, a 271-byte log,
zero dropped log bytes and all twelve recorded PIDs absent. It supplies no
playback measurement and is not excluded based on its performance sign.

A new prospective r2 namespace adapts both controller and evaluated-native root
checks, preserving their strict ownership/path/deadline validation. Full-chain
fake tests reproduce three failures before correction, then pass success,
unprofiled and failure cleanup paths. Prior as-run inputs are not rewritten.
The offline exporter equivalence test later caught an extra trailing blank line
in two new files. Removing those lines restored exact intended transformation;
no analysis or runtime logic changed. Original failing logs remain retained.

## Ownership And Verification

The successful captures span 09:29:07.239-09:34:07.610 UTC on October 7. Laptop
roots use `laptop-current-composition-r2-ARM-20261007-SUFFIX`:

| Arm | Suffix | Browser / controller PID | Capture duration, ms |
| --- | --- | --- | ---: |
| Control before | bAuLxM | 1948224 / 1948212 | 59778 |
| Profiled | yreT02 | 1950654 / 1950621 | 62092 |
| Control after | 4iBr62 | 1953099 / 1953087 | 59884 |

Fresh private installation/profile/application/local/temp roots, native parent
receipts, hardware WebRender/Iris Xe and ffmpeg/RDD state pass. These post-startup
and sampled observations are not a general filesystem/network sandbox. Bounds
remain 120 s capture, 105 s work, 15 s cleanup, 220/240 s driver/SSH, 24 MiB gzip
and 256 MiB sampled artifacts. Each arm follows 15 s settling and admission.

All 43 resource samples pass; maximum sampled artifact size is 152073752 bytes.
The three public exports contain 144 files, 12354450 bytes including the profile.
Each browser log is 271 bytes with zero drops and retains the EPERM namespace
warning and successful VA-API initialization. All three cleanups use owned
SIGTERM. A final targeted check verifies 52 recorded laptop PIDs absent, including
the failed setup attempt and four separate sandbox-warning PIDs.

The owned offline daemon PID 3528773 stopped successfully at 09:40:58.939 UTC;
its exact PID and socket were absent immediately afterward. PID absence was
rechecked independently. No browser, profiler, compiler or test handle remains
active at this checkpoint.

Final tests: 18 focused groups and 420 combined tests PASS, zero failures/skips.
The broad suite includes Node children and loopback HTTP fixtures, not new browser
runs. New checks replay the entire admitted CLI result, reconcile populations,
and reject truncated/duplicate/foreign/nonfinite markers, mixed clocks, wrong
thread/filter state and sample-count corruption. Missing sample brackets remain
inconclusive. The exporter/analyzer bodies equal their frozen predecessors except
declared profile/session/path substitutions. Their existing limits remain.

The 174-file harness, 35 static imports, 67 source pins, HEAD, staged patch and
configuration match the recorded preparation. Remote final preflight reports
no browser/build activity and matches all 174 harness and 46 package files.
Evidence is under `artifacts/umbralink-control/current-compositor-r2/`, including
`admitted-control-after.json`, `profile-analysis.json`, commands and failure logs.
The final seal also retains the failed namespace and all harness inputs.

## Next Action

Use this same saved profile for bounded offline local symbolization and targeted
startup analysis. Compare parent-main work and refresh scheduling with the four
short startup gaps, keeping raw/normalized clock checks and sample limitations.
Do not attribute old stalls to the label fix merely because they did not recur.
Do not repeat PBO trials, alter callback cadence or enable GPU import by default.
Real-site, broader layout/CSS/JS, rare-stall and cross-backend acceptance remain
open; this baseline does not complete those requirements.
