# Historical Pi renderer spans

Status: clock-corrected CLI-derived intervals verified; raw pairing unknown.
Catalog: PERF-003, PERF-011. No Pi runtime or browser source change.

The installed CLI source audit found that marker exports subtract
`context.rootRange.start`, while that context field and the sidecar elapsed times
remain raw-profile-relative. All saved exports here have a 71.135646 ms offset.
The initial analysis below applied raw sidecar bounds directly to zero-based
exports. The initial summaries below are superseded by the explicit correction
at the end of this report. Equal counts were insufficient to catch this error.
Strict Composite partitioning remains withheld for missing marker-pair provenance.

## Initial analysis, superseded

The OS coordinator supplied 59 files matching its sealed original manifest.
Build `20260926103749` had the opacity prototype and promotion logging ON.
The retained modes are plain, static overlay and cached canvas, not live copy.
These diagnostic captures are distinct from the later logging-OFF soak.

`profiler-cli` loaded the cumulative cached dump into a private named session.
Its export retains the earlier plain interval. A separate plain load was
rejected because the session already existed; that error is preserved. There
was no raw-profile parser fallback. The owned session was stopped afterwards.
Cleanup completed 122.5 seconds after ACK; final report writing exceeded the
five-minute task bound by about 23 seconds. Saved daemon logs announce the
default Mozilla symbolication endpoint, without request-level evidence. An
unconditional no-network/no-upload claim is therefore unsupported. Future local
loads must explicitly select the documented loopback-only symbol-server override.

Use the matching root-relative sidecar interiors, with one second trimmed at
each end: plain 23745.532657-36846.132431 ms, cached
63179.753920-76315.366532 ms. Both analyzed threads are in the parent process;
no subprocess clock offset applies. The following empirical nearest-rank
statistics use only fully contained intervals.

| Renderer span | Mode | Count | Median ms | P95 ms | P99 ms |
| --- | --- | ---: | ---: | ---: | ---: |
| `RenderThread::HandleWrNotifierEvents` Runnable | plain | 388 | 9.003 | 22.783 | 29.911 |
| Same | cached | 394 | 18.634 | 34.163 | 43.318 |

All Renderer Runnable counts are 1164/1438, matching the handoff. One cached
notifier interval crosses the upper boundary and is excluded, not shortened
into this distribution. The heavier cached tail is an observed coarse-span
lead, not CPU-exclusive cost, a driver wait, GPU completion or scanout latency.
Do not sum overlapping marker families or substitute these counts for copies.

The initial CLI-derived `PresentTexture` count was 290, versus the handoff's
raw-complete-phase count of 289. The wrong clock comparison prevented a matched
boundary conclusion. The correction below resolves this numerical discrepancy,
but not equivalence of CLI-derived intervals and raw-complete records.

`nostacksampling` and limited thread filters omit native stack attribution,
GeckoMain/TaskController, Compositor, media and IPC-message coverage. Only end
media totals were saved, so achieved interior frame/copy deltas are missing.
The first late stage cannot be established from this capture alone. Next inspect
the notifier's source boundaries and existing inner markers, then obtain a
separately owned matched capture only if those observations cannot falsify a
specific stage hypothesis. No new public API is needed or authorized here.

Source review narrows the next boundary: notifier handling includes external
events and texture operations before `UpdateAndRender`. Its existing
`Composite #WindowId` scope includes update/render, metadata exchange and the
EGL surface lock/swap path, plus a post-notification tail. EGL inherits the
base no-op `WaitForGPU`; the generic `wr.gpu_wait_time` value therefore cannot
establish an EGL fence bottleneck. CPU composition setup is not scanout.

A second, separately bounded CLI load explicitly used the loopback symbol
server `http://127.0.0.1:9`. It exported Runnable and Composite markers together,
reproducing 388/394 contained intervals in both families and one crossing cached
interval in each. Flat and detail exports omit raw marker phases, paired raw
indices and incomplete-edge flags. Equal counts do not certify unique complete
pairs: the strict pre/inner/post partition was not computed. The next tooling
check is the producer-to-export provenance path, not a new browser capture.
The recorded owned daemon PID and socket are absent after successful stop.

## Clock-corrected interval evidence

Reanalysis adds `context.rootRange.start = 71.135646` ms to each exported start;
duration is unchanged. Equivalently, the plain CLI window is
23674.397011-36774.996785 ms and the cached CLI window is
63108.618274-76244.230886 ms. Fully contained intervals contribute to the table;
positive-overlap crossing intervals are excluded, not clipped.

| CLI-derived group | Mode | Contained | Crossing | Median ms | P95 ms | P99 ms |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Renderer notifier Runnable | plain | 388 | 0 | 9.003080 | 22.783353 | 29.911059 |
| Renderer notifier Runnable | cached | 394 | 1 | 18.633853 | 34.162742 | 43.318246 |
| Canvas `PresentTexture` | cached | 289 | 1 | 2.734470 | 20.067031 | 40.289874 |

Notifier counts and these quantiles are numerically unchanged, but both mode
membership sets change. All Renderer Runnable medians change to 0.357216 ms
plain and 0.203904 ms cached. The newly crossing Canvas interval spans raw-root
63166.530726-63185.001044 ms and is excluded. Agreement with the handoff's 289
count does not establish identical raw pairs, completed copies or frame identity.

Six failing-first regression tests pass after the offset correction. There are
14770 real-interval checks of add-offset versus subtract-bounds equivalence, and
the Renderer signatures agree across the two saved CLI sessions. The parent
independently refiltered all twelve old/corrected group summaries, reproducing
their counts, quantiles and crossing handles without rewriting the evidence.
Source export hashes match. No new profiler load or raw-profile parser was used.

The installed CLI derives split markers and may synthesize incomplete edges,
but its supported exports omit the raw-pair mapping and incomplete flag. Sorted
export indices cannot substitute for those identities. These are therefore
CLI-derived interval distributions, not certified complete spans or an exclusive
CPU/render/swap partition. The historical logging, missing live-copy/media/stack
coverage and cleanup/network caveats remain unchanged.

Private evidence root: `~/.cache/codex/umbra-perf-20260927/`:
`pi-existing-profile-review-20260927/` holds the source handoff;
`pi-renderer-profile-exports/` holds CLI exports, interval analysis and stop log;
`pi-renderer-profile-review.md` records all counts, identities and limitations.
`notifier-source-map.md` maps source boundaries, and `composite-partition/`
preserves the second export, missing-provenance result and exact cleanup proof.
`profiler-pairing-contract.md` records the source clock and pairing contract;
`clock-correction-review.md` and `clock-correction/` retain the corrected result,
changed handles, regression tests and hashes. Corrected `results.json` SHA256:
`ff265c10791698dfc525f43af0e0fa1499ad6593d1fe31d0683c19ebaa907fee`.
