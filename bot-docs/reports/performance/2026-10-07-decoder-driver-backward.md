# Hardware Backward Seeking And Failure Evidence

## Result

One fresh private-driver laptop backward capture completed the full recovery
interval and all existing admission/safety/cleanup checks. RDD CPU accumulated
10.820 seconds over a 155.090-second bracket, versus 124.844 seconds over
155.112 seconds in the earlier software-path backward capture: 91.33% less
observed process CPU. Together with the preceding forward comparison, this is
consistent evidence for much lower laptop decoder-process cost on the private
hardware path. It is not a randomized benchmark, whole-browser speedup or
explanation of the owner's desktop seeking/black-flash recovery.

It is also NOT a demonstrated frame-drop improvement: this run had 24 drops
versus three in the earlier software backward run. Twenty-three occurred near
six seconds, before seeking; only one occurred later. The two completed hardware
runs share this short startup drop burst despite much lower RDD CPU. Its cause
remains unmeasured and is a better next profiling target than another blind
repeat of the unreproduced minutes-long desktop symptom.

The previous failed backward attempt HNGm4l remains sealed and excluded. No
system driver install, product source/default change, native build, desktop/Pi
control, profiler or agent work occurred in this wave.

## Narrow Tooling Correction

`startLifecycleMonitor` retains an original sampler exception internally but
forwards only its message to the capture abort callback. A pure failing-first
case confirmed that the resulting capture abort reason has no ENOENT cause.

The new scratch adapter uses the existing sampler injection seam to retain one
bounded structured diagnostic before this conversion. It records recognized
code/operation, owned-directory/storage category, relative-path depth and hash.
It does not retain messages, stacks, absolute paths, filenames, file contents or
outside-root path hashes. Own data descriptors prevent invoking getters; unknown
fields remain unknown. Late rejection after monitor abort cannot change the
report. Diagnostic assignment failure never replaces the primary exception.

The SAME original sampler exception is rethrown. Scan attempts, failure rules,
resource caps, deadlines, cleanup and browser RPCs are unchanged. This fixes
failure-evidence loss in the diagnostic adapter, not filesystem instability.
The new run did not hit that error: all 36 saved scans completed in one attempt,
and no `resourceFailure` field was produced. Its successful completion therefore
does not establish that the prior race is gone.

Only copied scratch capture code gains the wrapper; no shared monitor/product
source changed. Exact inverse-delta tests preserve the rest of the frozen
capture, YouTube and recovery adapters. The additional async wrapper per passive
sample has uncalibrated overhead; no zero-cost claim.

## Capture

Host `wyatt-laptop`, frozen browser Build20261006175655, fresh owned
installation/profile/app-data/local-data/temp. Same pinned full-feature iHD
library and child-only LIBVA_DRIVERS_PATH as
[the previous wave](2026-10-07-decoder-driver-seek.md). No LD_LIBRARY_PATH,
sandbox weakening, codec forcing or decoder logging.

Root `/home/wyatt/.cache/codex/laptop-youtube-ui-backward-1080-20261007-Q72ohH`.
22:21:43.895 to 22:24:31.853 UTC, 167.958 seconds. Controller 2210645, browser
2210657, fork server 2210756, RDD 2210790, content 2210824.

- Fixed signed-out YouTube video aqz-KE-bpKQ, normal 1080p menu, then one actual
  progress-bar click after a 20-second baseline. No login or ad skipping.
- UI approximately 21.254 to 4.771 seconds, target 5. Within the existing
  pixel-position tolerance. Trusted seeking-to-seeked duration 33 ms.
- 151.393 seconds observed, 130.008 seconds after session seeked; 156 samples,
  zero missed intervals, 1920x1080 throughout, 9078 additional frames.
- Drops: 23 in the interval ending at 6.015 seconds; one ending at 45.021.
  No low-media-advance intervals or counter resets; readyState 4 throughout,
  minimum sampled buffered-ahead 15.005 seconds. Not physical scanout proof.
- All five native hardware flags true. Before decoder=shutdown with one output
  is retained metadata, not active decode proof. Three playback checkpoints and
  final paused checkpoint report ffvpx RDD/AV1/1080 with 1334, 3949, 6648 and
  9132 outputs. No continuous or exact decoder-instance attribution.
- Final RDD maps receipt joins five segments to private iHD, dev 64512,
  inode 37360268, size 36102104, SHA256
  `7e14725d1af6a016fda32492cd7daaa33f1e744a36c0b8907ef3bb3a98e6798c`.
  Root/fork/RDD identity checks bracket the read; package and resource-history
  joins pass. This is point-in-time evidence.

## Comparison And Confounders

| Observation | Earlier software backward | New hardware backward |
| --- | ---: | ---: |
| Snapshot bracket | 155112.357 ms | 155089.622 ms |
| RDD CPU delta | 124844 ms | 10820 ms |
| RDD single-core equivalent | 0.80486 | 0.06977 |
| Content CPU delta | 36357 ms | 30750 ms |
| Page drops / frames | 3 / 9079 | 24 / 9078 |
| Trusted seek latency | 81 ms | 33 ms |
| Workload RPCs | 42 | 42 |

Both completed runs have matching executable/libxul/INI hashes and all seven
recorded fixture/helper hashes. Their loose userland-module records are equally
null, not loaded-module proof. After verifying paths against their own fresh
roots, the only recorded child environment difference is LIBVA_DRIVERS_PATH.
The source patch, private library provenance and CPU-unit proof are retained in
the preceding sealed reports. Ten raw backward performance snapshots agree with
the producer's nanosecond-to-rounded-millisecond conversion.

Process/window identities are stable at the five snapshots, not continuously
traced. CPU includes all RDD work, not solely decoding. The single pair differs
in run time, fresh profile/cache, distro driver revision and the small sampler
wrapper. The viewport stayed 1280x955, but page-selected player geometry changed
from 880x495 to approximately 822.4x462.6; actual progress-bar positions are
saved and validated, not assumed identical. No statistically established seek
latency, smoothness, GPU, energy, per-copy or overall application improvement.

## Cleanup And Evidence

All 36 saved resource samples passed caps. Peak summed RSS 2558865408 bytes
(shared pages can be counted repeatedly), sampled run artifacts 154974087 bytes,
327 log bytes, zero dropped log bytes. Owned SIGTERM cleanup and root-absence
checks passed; all 14 recorded PIDs absent at 22:24:43.407 UTC. This does not
exclude unobserved transient helpers. Postflight passed 48 installation files.

All 40 remote runtime files unchanged at 22:24:54.183 UTC. System driver hash
remains `a7cecd28f70fb692a5d65c2de8c491d953bc834dc1c98c4bd93a929ffcc976ee`;
full-feature package remains not installed at 22:25:38.535 UTC.

Local evidence: `artifacts/umbralink-control/decoder-driver-backward/`.
Export has 100 files, 603815 decoded bytes, SHA256
`954119a63aff483af8560775951ad92125057dceb280fcba4691e4b1e472b4ce`.
Original failed export and 80-file prior seal reverified without modification.
Exact commands, failure proof, generated sources, saved-data analyses and
comparison are retained in commands.json and sealed by evidence.json.

Runtime closure: 40 files, 107 edges, 36 syntax checks; archive 81786880 bytes,
SHA256 `d9a4d5764eb71d4fcd8b089b7c6b62dd552eea1f2594887872fdbc19484f4ad4`;
manifest `5bb666def497c971889c30d36ff3e5f84982c3b92012f35d2d158a57ed250ac2`.
Laptop harness root `decoder-driver-backward-harness-20261007-loESuK` in Codex
cache, dev 64512/ino 37359242/uid 1000/mode 0700. Host preflight saw no
browser/compiler work, 12840800256 available memory bytes and 33995476992 disk
bytes. Original 240-second capture/225-second work/15-second cleanup caps held.

178 strict Node tests passed, zero failures/skips, 4.55 seconds. Original
message-only loss has behavioral RED; missing-module RED is separately labeled.
Malformed/accessor/outside-root input, primary-error retention, first failure,
late abort, exact source generation, CLI bounds and both real-result classes
are covered. No native/browser unit rebuild was required for scratch adapters.

## Next

Use the private hardware path as a diagnostic baseline, not an installed owner
configuration. Source-map and narrowly profile the observed pre-seek startup
drop interval with an explicit observer control before changing rendering code.
Do not infer that it explains the desktop's delayed black-flash recovery.
System installation or daily desktop intervention still requires consent.
