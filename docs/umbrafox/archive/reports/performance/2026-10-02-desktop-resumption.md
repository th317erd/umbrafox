# Desktop performance resumption

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Wyatt authorized desktop performance work, including YouTube testing, toward
the continuing rendering/layout/CSS/JavaScript optimization goal. Existing work
browser tabs, extensions and preferences are preserved. No browser restart,
installation, profiler session, or Pi execution occurred here. The initial
read-only investigation had no native build; the October 3 continuation below
adds native tests and a provisional cache patch.

## Fresh observations

- UmbraLink reports BuildID `20261001103920`, parent PID 3290300.
- At initial inspection, both existing YouTube contexts (23 and 24) were paused
  and hidden. These are observations for this capture, not permanent tab IDs.
- Parent read-only script reports userland active false, single-image opacity
  optimization false, and profiler inactive. Do not attribute the owner's
  improvement to the optional opacity path without evidence that it was active.
- Gfx diagnostics report NVIDIA RTX 2060, driver 580.159.3.0, X11, and WebRender
  for both browser windows. Hardware compositing is available; partial present
  is blocklisted for the NVIDIA binary driver. No blocklist was overridden.
- Codec capability output reports VP9/H.264 software and hardware support, but
  AV1 software only. The paused context 23 player's current format and matching
  adaptive-format metadata identify VP9, 1920x1080, 60 fps (itag 303). Capability
  is not proof of the active decoder. AV1 is not implicated in that stream.
- Three process snapshots over 10.085 seconds showed parent average CPU about
  9.18 percent of one core and the busiest observed content process about 6.52
  percent. Owner activity was uncontrolled; no active playback occurred at the
  initial observation. This is not a stutter attribution or performance score.

Initial private evidence:
`/home/wyatt/.cache/codex/umbrafox-live-baseline-20261002-RdiewH/baseline.json`.

## Bounded playback sampler

Added `tools/umbrafox/performance/capture-playback.mjs` with focused
`test/playback-spec.mjs` coverage. It reuses authenticated UmbraLink transport,
does not launch/control playback, and samples an explicit context. Reads include
video counters, buffered headroom, readiness, visibility and process/thread CPU.
No bounding-box/style reads, page listeners, profiler activation, new browser API,
or renderer changes. Source identity is hashed before persistence; page URLs,
titles and discovery credentials are excluded from the saved projection.

Samples and summary retain separate media/process host midpoint timestamps and
RPC durations. CPU is derived from nanoseconds over the process sampling interval.
Frame analysis rejects paused/hidden/seeking, changed-document/source/resolution/
rate, ambiguous video selection, malformed state and reset counters. Zero frame
advance is not called smooth. Endpoint sampling cannot exclude intervening
events, identify same-source element replacement, certify physical scanout, or
establish causal CPU attribution. Observer cost remains a measurement caveat.

Tests: initial missing-module RED, then 17 passing cases; later malformed-state
behavioral RED (20 pass, 1 fail), then 21 passing cases. Scoped lint results and
full test logs are under `artifacts/umbralink-control/playback-*`.

Actual prototype integration: two three-sample captures against the paused tab
finished without browser changes. Both summaries excluded both intervals as
inactive. Final capture (before a lint-only local variable rename):
`/home/wyatt/.cache/codex/umbrafox-playback-20261002-paused-2/`.
The earlier capture without the added environment receipt remains `paused-1`.
These validate read-only transport/projection and paused exclusion, not active
playback, stutter detection, CPU causality or an engine improvement.

## Next work

Capture visible playback spanning smooth and stuttering periods, then compare
interval frame deltas, buffer headroom and CPU/thread work. Confirm actual
decoder rather than assuming hardware use from capability. If buffer remains
adequate during drops, narrow compositor/render/content work with an explicitly
bounded attribution capture and observer control. Do not use a forced-codec or
acceleration-blocklist workaround as a default optimization.

The broader goal remains active: release probe overhead, live video copy stages,
opacity exact-pixel correctness, userland cache/request authority, layout/style
and JS costs, and lifecycle behavior remain in the existing catalog. This turn
adds measurement coverage and current-host evidence, not a completed engine fix.

## Native decoder follow-up

On October 2 local time (October 3 UTC), a one-shot read through existing
privileged Firefox `mozRequestDebugInfo()` returned:

- Same document 34359738369, paused at 18.530916 seconds, VP9 1920x1080.
- Decoder name `shutdown`, retained hardware-accelerated flag true.
- 1224 output samples, zero skipped samples, zero decoded-frame drops,
  zero sink-frame drops, 30 compositor drops. Video-container compositor count
  was also 30; these are not two independent populations to add together.
- Page global-name list unchanged; the privileged method remained `undefined`
  in page JavaScript before and after. Playback position and paused state matched.

Evidence: `/home/wyatt/.cache/codex/umbrafox-decoder-final-20261002-SgmcKl/decoder.json`.
BuildID was `20261001103920`. Earlier successful read:
`/home/wyatt/.cache/codex/umbrafox-decoder-20261002-ptK8dU/decoder.json`.
No active playback interval or current decoder execution was observed. Source
`MediaFormatReader::VideoIsHardwareAccelerated` returns the retained
`mVideo.mIsHardwareAccelerated` field, not a fresh hardware query. The result
narrows the historical drop category; it does not time those drops or establish
a current GPU bottleneck. There may be overlapping accounting between the
reader and video container.

Added `media-debug.mjs` and nine focused supplied-data/VM tests. The first live
attempt exposed a lazy sibling tab with null browsingContext; preserved
behavioral RED was 7 pass/1 fail, then corrected explicit-context lookup. A source
review also found that `loadFrameScript(..., false, false)` retains anonymous
scopes. The final helper uses an IIFE with `runInGlobalScope=true`, adding no
frame-global bindings, and a data URL (not cached by the frame-script loader).
The earlier successful read used one retained anonymous scope; no owner tab was
closed to clear it. The final implementation was then tested on the real browser.

Timeouts bound waiting, not native execution or synchronous JS. The helper
registers only a parent reply listener and removes it in finally; no child/page
listener is installed. Child timeout observes late native rejection. Required
document identity is checked before and after the native read and in the parent.
42 combined decoder/playback/control tests passed, scoped four-linter check
reported zero errors/warnings, and both new files passed Prettier check. Logs:
`artifacts/umbralink-control/media-debug-*`. This is tooling, not a rendering fix.

## Repeated frame-copy screening

A single bounded script created two detached 110x75 canvases. It copied the
existing paused video into one, then performed eight alternating video-source
and already-copied canvas-source draws into the other. Neither canvas was
appended to the page; no existing canvas context, playback, preference, network
setting or tab selection was changed. The loop had a 250ms between-operation
guard and the command a 3-second wait bound, neither a synchronous CPU watchdog.

Observed seed draw: 101ms. Subsequent video draws: 3,4,3,3,3,4,3,4ms. Canvas-source
draws: all 0ms at the observed 1ms timer granularity, not literally zero cost.
The video remained paused at the same time and total-frame count (1115).
Evidence: `/home/wyatt/.cache/codex/umbrafox-copy-screen-20261002-SlHQgM/sample.json`.
This unprofiled screen has uncontrolled host load, fixed ordering, no GPU
completion timing, one source frame, and no active presentation. It is not a
YouTube performance score, a provider identity proof or a stutter reproduction.

The already-modified V2 `GPUVideoImage::GetAsSourceSurface(IntSize)` still issues
a manager readback for every request. A candidate is one small sized surface per
immutable image, using the existing `CachedSurface` synchronization/release
pattern, with exact size matching and an explicit byte limit. Full-size reads,
failures, different sizes and large surfaces must retain existing behavior.
At this screening checkpoint no native patch had been made. Gate it on failing-first read-count,
different-frame/size, failure/retry, concurrency, lifetime and memory-bound tests,
then real exact-pixel and live performance checks. Do not hold the cache mutex
across synchronous IPC. Do not claim benefit for a single copy per new frame:
the prior Pi rVFC fixture did exactly that, and two YouTube canvas elements alone
do not establish repeated same-frame draws. Alternative readback/allocation
optimizations need their own measurements.

## October 3 native cache checkpoint

Added nine `GPUVideoReadback` native tests covering same-image/same-size reuse,
distinct images and sizes, failed and wrong-size reads, unchanged full/empty-size
behavior, actual stride-based memory bounds, reentrant reads, concurrent reads
and lifetime release. `TestRemoteImageHolder`'s existing fake manager also needed
the V2 sized `Readback` override, which its first gtest compile exposed.

The tests compiled in the actual Gecko gtest library. Before the cache change,
the isolated headless native run produced seven expected failures and two passes.
The repeated-frame test performed nine manager readbacks instead of one; the
concurrent test performed all eighty reads instead of converging on a cache.
The unchanged full-size and empty-size tests passed. Evidence is retained at
`/home/wyatt/.cache/codex/readback-gtest-red-20261003-XA6xRT/gtest.log`.
Fresh private application-data, local-application-data and profile directories
were used; the owner's browser was not involved.

The provisional production patch uses existing `CachedSurface` synchronization
and main-thread release. It retains only the first eligible size for an immutable
`GPUVideoImage`, with at most 1 MiB of positive stride times height. Only an
already-CPU `DATA` surface of the exact requested size is eligible; no conversion,
shader change or extra copy is introduced. Other sizes bypass rather than evict;
concurrent misses may duplicate work, but the first stored surface wins. No cache
lock is held during the synchronous manager readback.

Source lifetime review found the readback surface's user data retains its manager
and descriptor; the descriptor's shmem retains its segment. The cache does not
remove those references or change descriptor deallocation. These source and fake
pixel checks are not proof of actual GPU pixel parity or shutdown behavior.

The first two-job production dependency rebuild reached its 1800-second bound
while compiling the final DOM batch, with no compiler error in the saved log.
Its process group exited. A separate full incremental build resumed with the
same two-job limit and `MOZ_BUILD_DATE=20261003071500`, including ordinary build
metadata generation. This completed successfully in 5m53s, followed by a
successful 78-second gtest rebuild. Both INIs and the generated build-ID header
agree. The gtest rebuild retained seven warnings in the existing filesystem
test child module, outside the changed files.

The actual native test run passed all 18 tests: the nine new cache tests plus
nine adjacent `TestRemoteImageHolder` tests. Evidence:
`/home/wyatt/.cache/codex/readback-gtest-green-20261003-E8yjCc/`.
A second isolated run shuffled the nine cache tests for 100 iterations. All
900 test executions passed, including 100 concurrency and 100 reentrancy cases.
Evidence: `/home/wyatt/.cache/codex/readback-gtest-stress-20261003-qQDov7/`.
An initial post-run assertion incorrectly expected standard gtest text output;
Gecko emits JSON events. The original incorrect summary is retained and
`verified-summary.json` checks group pairing, exact per-test counts and PASS
states from the same saved log. No native rerun was needed. Test root PIDs exited;
the stress root and its observed sandbox-probe PID were confirmed absent.

The scoped native clang-format/license/whitespace/trojan-source check passed,
as did the final diff check and four-file source hash guard. Comparing tracked
native patch sections with the sealed October 1 prototype found 34 unchanged
sections; only `GPUVideoImage.h` and the test mock differ. This comparison does
not cover untracked source, compiler/generated inputs, or loaded-runtime parity.
The saved comparison is `readback-native-comparison.json` alongside the logs in
`artifacts/umbralink-control/`.

Packaging passed in 93 seconds through `./mach build -j 2 package` with
`XZ_OPT=-T2` (the same package target with explicit job control). The sealed
candidate and clean extraction are in
`exports/umbrafox-readback-candidate-20261003/`. The 107773084-byte archive has
SHA256 `826d7d880c19e94c37b760fd1937b32bfa16ce90e4fd960cabd3807c1caa12ab`.
All eight artifact checksums passed, the extracted tree contains no symlinks,
and both INIs match the pinned build ID. An isolated `--version` invocation
returned `Umbrafox 158.0a1` and exited. Its sandbox user-namespace EPERM warning
is preserved in `readback-package-version.json`; it is not a GPU runtime test.
No test/build/package session remains running.

Actual GPU pixel/performance validation remains pending. The fake manager
tests prove native cache behavior, not actual
decoder/provider routing, GPU output, playback improvement or zero overhead.
No installation, owner-browser restart, or YouTube stutter fix is claimed.

Next: use owned isolated browser instances and a fixed local video fixture to
compare first versus repeated reads, then distinct frames, sizes, crop/filter/
transform exclusions and resource release. Retain exact pixel hashes separately
from timing and establish the actual provider path. Keep the existing prototype
as a baseline, subject to its recorded source/build differences; do not change
the owner's active tabs or install the candidate before those gates pass.

The [October 3 headless follow-up](2026-10-03-headless-readback.md) now verifies
18 exact-pixel frame/drawing cases against the pre-cache package, with clean
owned cleanup and 304 passing combined tooling tests. Both runtimes reported
software decoding and software WebRender. This closes a bounded fallback pixel
check, not actual GPU routing, cache-hit observation or performance acceptance.
The candidate remains uninstalled; permission for a temporary desktop test
window is pending.
