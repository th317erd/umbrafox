# Counterbalanced Moving Video Copy Timings

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result and Decision

Four fresh headed laptop runs completed in baseline-candidate-candidate-baseline
order. All four passed the prospective V3 observation contract and clean owned
shutdown. The repeated-copy timing benefit repeats; first-copy and broad CPU
benefits are not established. Keep the candidate uninstalled. Next investigate
cold first-copy latency rather than expanding the repeat cache speculatively.

For approximately300 additional copies in the two repeat phases per run, the
baseline recorded300-302ms total draw time and the candidate14-18ms. This is the
sum of coarse page-clock observations, not a precise per-copy submillisecond
measurement or a whole-browser speedup. All samples, including pixel-transition
batches, are retained. Earlier paused-frame50-to18 outgoing readback requests
with50 identical pixel hashes remain separate supporting evidence.

| Observation | Baseline A1 | Candidate B1 | Candidate B2 | Baseline A2 |
| --- | ---: | ---: | ---: | ---: |
| Additional-copy samples | 300 | 297 | 300 | 300 |
| Additional-copy total ms | 302 | 14 | 18 | 300 |
| Additional-copy median/P95 ms | 1/2 | 0/0 | 0/1 | 1/2 |
| Single-copy samples | 99 | 100 | 98 | 99 |
| Single-copy total ms | 156 | 184 | 210 | 202 |
| Single-copy median/P95 ms | 1/2 | 1/3 | 2/3 | 2/3 |
| Very first draw ms | 19 | 34 | 41 | 27 |
| Total canvas copies | 499 | 496 | 498 | 499 |
| Video callbacks | 199 | 199 | 198 | 199 |
| Differing repeat batches | 12 | 4 | 5 | 15 |

First-copy controls overlap and do not show a consistent benefit. Both candidate
first draws are longer than both baseline first draws in this small sample.
That deserves targeted inspection but is not yet a demonstrated cache-caused
regression: whole packages differ, startup is cold, and only two runs per package
were observed. The candidate does not make the first readback disappear.

All phases report zero dropped-video-frame deltas. That does not establish
physical scanout quality, sustained performance, YouTube behavior or success
under competing browser workloads. Actual image IDs and moving cache-hit/request
counts were not recorded. More stable candidate batches are an observation,
not an independent cache-hit oracle.

## CPU Cross Check

The existing process snapshots bracket approximately8.1s of the instrumented
workload. Reported CPU-time deltas in milliseconds are:

| Process population | A1 | B1 | B2 | A2 |
| --- | ---: | ---: | ---: | ---: |
| RDD | 596 | 438 | 560 | 660 |
| Fixture content | 820 | 737 | 949 | 905 |
| Browser parent | 789 | 723 | 949 | 815 |
| All11 joined processes | 2242 | 1939 | 2484 | 2397 |

The RDD observations are lower in both candidates, but total CPU is mixed; B2
is highest overall. Do not claim an overall CPU reduction. The interval includes
pixel reads/hashing, control calls and background work, not just drawImage.
These are CPU counters, not GPU duration or time waiting for presentation.

Both exact package copies of UmbrafoxControlDiagnostics.sys.mjs are identical.
They normalize requestProcInfo.cpuTime to rounded cpuTimeMs. Saved analysis uses
the difference of those reported values. All11 before/after PIDs, process types
and child IDs match; resource samples retain stable start identities for them.
Short-lived unobserved processes and within-interval CPU attribution remain gaps.

## Prospective Contract Correction

V3 uses the exact unchanged serialized collector, the same90s1080p30 H.264 asset,
110x75 CPU canvas and1/4/4/1 two-second phases. Eight serial RPCs remain unchanged,
including raw after-diagnostics before classification. No profiler; the pixel
read/hash observer still has cost. No engine code, build or public-interface
change was made.

Frame mediaTime and paused playback currentTime are separate observations on
the media timeline, not values with a universal ordering. V3 requires finite
in-duration, strictly advancing frame times and IDs, retaining the existing
paused0..15s work bound. It reports their difference rather than substituting
or tolerating a guessed maximum lead. Callback expected display time is reported
separately on its own clock. All four new final frame leads happen to be negative.

The prior candidate's7.373ms positive lead first failed against the cloned old
guard, then passed the prospective validator. Ahead/equal/behind, malformed,
out-of-duration and reordered cases pass their positive/negative assertions.
The old candidate remains FAILED, byte-identical; the old validator still rejects
it. The source-backed rationale and frozen producer are in the preceding
moving-observation report. Do not reclassify old captures.

## Runtime and Verification

Same original packages: baseline Build20261001103920/libxul2a8eb56c... and original
readback candidate Build20261003071500/libxul82faf416..., not the later inline-DOM
candidate. Intel Iris Xe RPL-P, Mesa/iris25.2.8, X11/KWin, graphics features and
display data match. All after-receipts report hardware-accelerated ffmpeg RDD
H.264; all initial paused receipts say shutdown. Continuous decoder activity is
not proved. Userland and profiler inactive at both boundaries.

| Runtime field | A1 | B1 | B2 | A2 |
| --- | ---: | ---: | ---: | ---: |
| Controller PID | 1104950 | 1106918 | 1108910 | 1110846 |
| Browser PID | 1104962 | 1106967 | 1109052 | 1110870 |
| Capture seconds | 20.248 | 20.355 | 19.922 | 20.211 |
| Peak sampled artifact bytes | 153953675 | 188726198 | 188373029 | 154178573 |
| Pre-work headroom bytes | 114631607 | 79858762 | 80211872 | 114406683 |

All48 recorded browser/controller PIDs absent at export. Each run has six resource
samples, clean owned SIGTERM,271log bytes and0drops. Fresh native app/local/temp
receipts and package postchecks pass:47 regular files including the admitted lock,
plus only the previously allowed empty updater directories. These are sampled/
point-in-time checks, not a network sandbox or transient-process census.

Candidate artifact usage is already higher BEFORE the active workload; these
disk totals cannot be attributed to retained video surfaces or used as a memory
comparison. Host preflight had10.41GB available memory and165.48GB available disk;
load averages2.39/2.61/1.79. Other activity was not disabled or fully inventoried.

Unchanged120s total/105s work/15s cleanup/final2s,10s quiet,64MiB pre-work headroom,
256MiB sampled artifacts. No retries, cap relaxation, install or desktop action.
No profile/control token export. No source/index staging or commits.

70 focused tests PASS, including all prior58 and12new/reused V3 and saved-data
tests. Exact5file formatting PASS. Old V2 seal still verifies. Staged diff SHA
3b78253cf775a4a1e8c69a4b82cc3958b366056129a391f4ae362bdfe8e4e0c4 unchanged.

## Evidence and Next Work

Evidence: `artifacts/umbralink-control/moving-timing/`.143 capture files,
911144bytes, locally hash-verified. `results.json` contains full per-run timing
populations; `process-cpu-observations.jsonl` retains every joined process.
Plan: `docs/umbrafox/archive/plans/moving-timing.md`.

Laptop harness `~/.cache/codex/moving-timing-harness-20261005-xn06kq`,36files,
23277573bytes. Manifestb86b1f65bfbffcd18eab0640394465f9dcfac63c919b298a308685cd79824dea,
verified before/after. Run roots under `~/.cache/codex/`:
`laptop-moving-timing-baseline-20261005-gKk8O1`,
`laptop-moving-timing-candidate-20261005-vEbIqW`,
`laptop-moving-timing-candidate-20261005-sezeBW`,
`laptop-moving-timing-baseline-20261005-isUS3H`.
UTC starts23:58:51 on October5 and00:00:01/00:01:03/00:02:01 on October6;
all are October5 local Phoenix time.

Next useful rendering investigation: localize the first-copy synchronous work,
especially the cold first-draw outlier, through the frozen DrawImage/readback
producer and existing private profiler spans. Separate send/queue/receiver/
conversion/wait evidence before choosing an optimization. Do not add prefetch,
larger caches, GPU-forcing defaults or public instrumentation without evidence.
The broader layout/CSS/JS and real playback work remains active.
