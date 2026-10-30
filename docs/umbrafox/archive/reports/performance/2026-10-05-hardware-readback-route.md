# Hardware Readback Request Reduction

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

The original readback-cache candidate removes repeated same-size readback
requests on the observed laptop hardware path. For 50 canvas copies, the
baseline issued 50 outgoing requests and the candidate issued 18. All 50 pixel
hashes match exactly between builds. This is a 64% reduction in request count
for this deliberately repeated-frame workload, NOT a 64% rendering speedup.

Each of two paused VP9 frames used this fixed sequence:

| Phase | Copies | Baseline requests | Candidate requests |
| --- | ---: | ---: | ---: |
| First 110x75 copy | 1 | 1 | 1 |
| Repeat 110x75 | 8 | 8 | 0 |
| Different 111x77 size | 8 | 8 | 8 |
| Return to 110x75 | 8 | 8 | 0 |

Both frames independently produce this pattern. The second frame has different
pixels and requires its own first readback. Different-size requests remain a
positive recording control; returning to the original size avoids requests.
The result agrees with the frozen `GPUVideoImage::GetAsSourceSurface(IntSize)`
implementation: retain only the first eligible small sized surface per immutable
image, and do not replace it when another size is requested.

This advances beyond mock-native tests and pixel-only browser comparisons.
It does not prove a benefit for one copy per new frame, sustained playback,
full-resolution media, all providers/platforms, physical presentation or the
reported YouTube stutter. Profiled phase durations are retained but not used as
performance scores. Whole packages differ; this is not a cache-only timing A/B.

## Measurement

One disposable headed baseline, then offline marker admission, then one
disposable headed candidate on `wyatt-laptop`. No retries. Same pinned package
manifest as the earlier hardware pixel comparison; no new build or installation.
Baseline Build20261001103920/libxul2a8eb56c...; original cache candidate
Build20261003071500/libxul82faf416..., not the later inline-DOM candidate.

Both report Intel Iris Xe RPL-P, Mesa/iris25.2.8, X11/KWin and WebRender. Both
native decoder receipts report hardware-accelerated ffvpx RDD VP9 at both seek
positions. Graphics context projections match exactly. Media remains the
97,465-byte 320x240 VP9 fixture, SHA25610f28950...7fb5440, at0.5s and2s.

The existing profiler records `nostacksampling`, `ipcmessages`, `flows` and
`nomarkerstacks`, with GeckoMain/RemVid filters. No new browser API, native marker,
preference default or web-visible diagnostic was added. UserTiming markers are
created only by the owned loopback fixture closure.

Counted markers are instantaneous `IPCFlowMarker` records whose payload name is
exactly `PRemoteMediaManager::Msg_Readback`, on the fixture process's RemVidChild
thread. Receiver/reply/derived IPC spans and StackMarker copies are not counted.
`MessageChannel::AddProfilerMarker` emits this flow marker on sending only;
the producer matches the frozen candidate base and is absent from its patch.
The existing profiler-lock exclusion still applies. Positive controls and the
complete expected baseline population support coverage for this probe, not a
universal lossless profiler guarantee.

All eight measures and16 endpoint marks join the captured inner-window ID.
The fixture content PID is independently joined to its exact URL in both
performance snapshots and the CLI thread inventory. Flow IDs are unique and
strictly inside one phase. Missing, truncated, mismatched-clock, duplicate,
ambiguous-boundary and wrong-document exports reject. UserTiming and IPC use
the SAME CLI-normalized clock; raw `rootRange.start` is not compared against
normalized marker timestamps. Both native buffer-generation observations are0.

## Runtime And Cleanup

| Field | Baseline | Candidate |
| --- | ---: | ---: |
| Controller PID | 1061195 | 1065628 |
| Browser PID | 1061213 | 1065640 |
| Fixture content PID | 1061377 | 1065810 |
| Total capture seconds | 12.016 | 11.947 |
| Peak sampled artifact bytes | 157367034 | 191470020 |
| Opaque preserved profile bytes | 1765583 | 1579425 |

Fresh installation/profile/app-data/local-app-data/temp roots and parent-native
directory receipts pass. Package verification passes after cleanup; the baseline
has only the previously allowed empty updater directories plus its lock.
Both profilers stop before clean owned SIGTERM. Zero dropped log bytes.
Both controllers and all22 sampled browser PIDs are absent. This is not a census
of transient helpers or proof of pre-startup/continuous isolation.

Unchanged120s total/105s work/15s cleanup,256MiB sampled artifact cap and24MiB
individual profile preservation cap. The dump and root copy both remain inside
the artifact tree but outside ordinary JSON-writer byte accounting. Namespace
EPERM and successful VA-API iHD initialization messages are retained.

Profiler-cli0.10.0 loaded only the two saved dumps, once each, in separate named
sessions with explicit `http://127.0.0.1:9` symbol server. Saved daemon logs
confirm that endpoint. Both sessions stopped in finally; captured daemon PIDs
525390 and528443, plus their exact sockets, were checked absent. No raw-profile
JSON parser or external symbol service used.

## Verification And Evidence

- 72 focused tests PASS, including exact saved-data replay; scoped Prettier PASS.
- Collector/state and paused-profiler admission failures preserved before fixes.
- Both38-file capture manifests verify locally, including opaque profile hashes.
- All29 transferred harness files verify unchanged before/after both runs.
- Staged patch remains231628bytes/SHA3b78253c...; no stage, commit or engine edit.
- Main evidence: `artifacts/umbralink-control/readback-route/`.
- Protocol: `docs/umbrafox/archive/plans/readback-route.md`.
- Harness SHA256: `8a4d34923652cc69c7d93304f815d7ff88a50d3dc2d11a8c8895ae838886f05c`.
- Laptop harness: `~/.cache/codex/readback-route-harness-20261005-MYqQs3`.
- Laptop runs: `~/.cache/codex/laptop-readback-route-baseline-20261005-kIjpCM`
  and `~/.cache/codex/laptop-readback-route-candidate-20261005-ussL3F`.

Next measure moving, larger video with an explicit one-copy-per-new-frame
control and repeated-frame workload, followed by unprofiled timing/playback
comparisons under prospective headroom checks. The candidate remains uninstalled;
the desktop daily browser/profile/launcher were not touched.
