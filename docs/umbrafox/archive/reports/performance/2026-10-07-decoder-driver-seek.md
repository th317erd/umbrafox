# Private Driver Seeking Comparison

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

The laptop's full-feature Intel driver path remained hardware accelerated at
the three sparse playback checkpoints and final after-playback checkpoint of
one completed forward-seek capture. Its RDD process accumulated 11.364 seconds
of CPU time over a 155.114-second snapshot bracket, compared with 119.034 CPU
seconds over 155.106 seconds in the earlier software-decoding capture. This is
90.45% less observed RDD CPU, not a randomized performance benchmark or a
whole-browser, GPU, energy or desktop-stutter improvement claim.

The backward run FAILED after 40.417 seconds: the unchanged safety sampler
reported `Lifecycle artifact scan remained unstable`. It completed the actual
backward seek and one following native checkpoint, but not the required
130-second recovery observation. No retry, relaxed cap, or successful backward
result is implied. Both browsers and all recorded processes were cleaned up.

The owner's progress-bar seeking, prolonged stutter, black flash and sudden
recovery remain unobserved in the completed forward run. The laptop is AV1;
the historical desktop observation was VP9. No desktop control, system driver
installation, product source/default change or public-interface change occurred.

## Matched Inputs And Limits

Browser Build20261006175655 and pinned private driver are documented in
[the preceding admission report](2026-10-07-decoder-driver-variant.md).
The same full-feature iHD library SHA256
`7e14725d1af6a016fda32492cd7daaa33f1e744a36c0b8907ef3bb3a98e6798c`
was copied exclusively into each fresh owned browser installation. Only the
child's `LIBVA_DRIVERS_PATH` selected it. No LD_LIBRARY_PATH, codec forcing,
sandbox weakening, profiler, decoder logging or new active-playback RPC.

The comparison uses signed-out `https://www.youtube.com/watch?v=aqz-KE-bpKQ`,
normal quality-menu 1080p selection and one actual progress-bar click after a
20-second baseline. Existing work, artifact, log, memory and cleanup caps remain
unchanged. There are 45 workload RPCs in each completed forward capture.

Saved executable, libxul and both INI hashes match between old and new runs;
all seven recorded fixture/helper hashes match. The seven loose userland-module
records are identically null, not proof of loaded-module equivalence. Runtime
closure and installation admission separately pin the executed package/tools.
Fresh profile/cache state, different run times, page scheduling and different
distro driver revisions remain confounders. No repeatability claim is made.

## Completed Forward Capture

Laptop root:
`/home/wyatt/.cache/codex/laptop-youtube-ui-forward-1080-20261007-JQbs6a`.
Capture 21:59:53.185 to 22:02:41.351 UTC, 168.166 seconds.

- Controller 2200747; browser 2200759; RDD 2200892; content 2200929.
- 156 one-second samples, zero missed intervals, 1920x1080 throughout.
- 151.683 seconds observed, including 130.007 seconds after session `seeked`.
- UI action approximately 21.238 to 45.301 seconds; target 45 seconds.
- Trusted collector `seeking` to `seeked`: 312 ms. Session listeners record
  313 ms because their end timestamp differs by 1 ms; these are not collapsed.
- 9078 additional page frames and 24 drops. All drops are in the interval
  ending at 6.018 seconds, before seeking; none added after seeking.
- No low-media-advance intervals or counter resets in the saved timeline;
  readyState 4 throughout, minimum observed buffered-ahead 13.55 seconds.
- Before receipt says decoder `shutdown`, one output, hardware=true. That is
  retained metadata, not active hardware decoding proof. The three playback
  checkpoints and final paused receipt say ffvpx RDD, AV1, hardware=true, with
  1533, 4126, 6826 and 9327 outputs respectively.
- Final maps receipt joins five mapped segments to the exact private library
  and its installation admission/postflight identity. Root/fork/RDD identities
  bracket the read. Mapping and sparse native observations are not continuous
  decoder-instance evidence and do not establish physical scanout quality.

Descriptive forward CPU comparison, from existing before/after performance
snapshots with stable sampled PID/window joins:

| Observation | Earlier software path | Private hardware path |
| --- | ---: | ---: |
| Bracket duration | 155106.129 ms | 155113.795 ms |
| RDD CPU delta | 119034 ms | 11364 ms |
| RDD single-core equivalent | 0.76744 | 0.07326 |
| Content CPU delta | 37304 ms | 33037 ms |
| Page drops | 26 / 9080 | 24 / 9078 |
| Trusted seek latency | 385 ms | 312 ms |

The process CPU reduction is a useful laptop-specific lead. The tiny frame-drop
and seek-latency differences are not established improvements from N=1. RDD CPU
includes all work in that process, not only decoder execution. No exact
per-frame decoder/copy attribution or whole-browser total is claimed.

`cpu-producer-proof.json` verifies `UmbrafoxControlDiagnostics.sys.mjs` against
the frozen source HEAD plus patch and current file, SHA256
`3aaa1ba04e2c4cf0e02e0e17dcabc4c23584cb099c7ca873feb8be870db667cf`.
Its process counter is rounded to milliseconds; all ten compared raw snapshots
agree with that conversion. The snapshot clock is read after requestProcInfo
returns, so the bracket is not a precisely simultaneous hardware measurement.

Safety: 36 saved resource samples passed caps, peak summed RSS 2599124992 bytes,
peak sampled run artifacts 156098856 bytes, 326 log bytes and zero dropped log
bytes. Summed RSS can count shared pages repeatedly. Owned SIGTERM cleanup was
clean; all 14 recorded PIDs absent at 22:03:03.701 UTC. Unobserved transient
helpers are outside that assertion. Installation postflight passed 48 files.

## Censored Backward Capture

Laptop root:
`/home/wyatt/.cache/codex/laptop-youtube-ui-backward-1080-20261007-HNGm4l`.
Capture 22:04:34.149 to 22:05:14.566 UTC, 40.417 seconds.

Controller 2203826, browser 2203838. UI action approximately 21.234 to 5.189
seconds, target 5. The before and sparse-0 receipts report hardware=true, with
the same before/shutdown caveat. The completed 20-second baseline contains 1200
additional frames and two page drops. No completed post-seek segment or final
maps receipt exists; libva's successful private-path log alone is not a mapping
receipt. No completed backward CPU comparison is computed.

All nine saved resource samples passed their caps before the failed scan. Peak
saved summed RSS 2612678656 bytes; peak saved artifacts 147745573 bytes. These
do not certify the unsaved failed sample. Log 327 bytes, zero drops. Native
roots and both collected document/tab checkpoints matched the owned run.

Frozen `artifactSize` retries an entry traversal only on ENOENT and fails after
three attempts. That source explains the reported error as repeated traversal
disappearance, not a proven byte-cap breach, decoder failure or stutter. The
terminal report retains the outer message but not the cause's path/code, so the
specific disappearing file/component cannot be identified retrospectively.
The resource monitor correctly aborted the capture instead of hiding the gap.

Owned SIGTERM cleanup was clean, root absence confirmed, all 14 recorded PIDs
absent at 22:08:22.283 UTC. Extended package postflight passed 48 files. The
source review and saved-data failure checks do not promote the run to success.

## Verification And Evidence

Local namespace: `artifacts/umbralink-control/decoder-driver-seek/`.
All commands and generated artifacts are recorded/sealed in `commands.json`
and `evidence.json`.

- 167 strict Node tests passed, zero failures/skips, 4.73 seconds: 142 existing
  seek/quality cases, 12 prior driver/mapping cases and 13 new adapter/review/CPU
  cases. Injected corruption includes changed process/time/counters, mappings,
  provenance, cleanup and missing native evidence. Hardware=false remains a
  reportable result rather than being filtered out. Failed backward cannot pass
  the completed-run reviewer.
- Initial adapter behavioral RED retained. CPU test RED was missing-module
  only, not a demonstrated prior arithmetic defect. Rehashed semantic failures
  and real-export regression cases pass. Seven manual scratch JS files format
  clean; generated runtime files remain untouched after launch.
- Original comparison command incorrectly compared installation paths across
  fresh roots and failed. Error retained in `comparison.stderr`; corrected
  command verifies each path against its own root and compares actual hashes.
- Forward raw export: 103 files, 607633 decoded bytes, SHA256
  `e68405ef073c1f6e63b9661c08d6d0c19caf3018040a64138b019ede433c8d7f`.
- Failed backward raw export: 56 files, 205854 decoded bytes, SHA256
  `623468c8f4f47a91df9d20fad70d9688941fafd037d081aac20dfc0471542fb1`.
- Old software forward export SHA256
  `d2a57882b2069a28e98659eeb49fd27197f296cf696a91ead3395f638ec67fb3`;
  old backward `778e3ed9e746ec979e93578725787e50d91d5a78817ea95e2cdda14066c6a3e8`.
  Both saved-data reviews rerun without changing the old namespace.
- Runtime closure: 39 files, 105 import edges, 35 syntax checks. Archive
  81786880 bytes, SHA256
  `840e309ad6c5f61a22e5b448fee06b102c86de4f5ad51a799f23fbc45b9358cf`;
  manifest `b5475c2ce08a7fb50c887fac9abac14b71ce63841fe4c46c275cd5bb2273bf42`.
  All remote inputs unchanged at 22:08:40.127 UTC; prior 51-file seal reverified.
- Remote harness `decoder-driver-seek-harness-20261007-E76WHj` in laptop Codex
  cache: device 64512, inode 37357497, uid 1000, mode 0700.
- System iHD hash remains `a7cecd28f70fb692a5d65c2de8c491d953bc834dc1c98c4bd93a929ffcc976ee`;
  full-feature package still not installed at 22:08:49.473 UTC.

## Next Gate

Preserve this wave; no automatic backward retry or relaxed scanner policy.
Review bounded error-cause evidence first so a future stopped scan retains its
specific operation without exporting private profile contents. Reproduce any
tooling defect with fake filesystem failures before modifying shared capture
code, then freeze a new closure. A new backward/repeat decision can follow that
review. The desktop symptom still needs its actual codec/session/recovery
boundary; no desktop restart or driver installation is authorized by this work.
