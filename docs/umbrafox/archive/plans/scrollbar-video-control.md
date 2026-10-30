# Scrollbar And Video Callback Control

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Execution Status

P0 and P1 complete. Four fixed isolated runs and saved-data replay pass their
functional/safety gates; this is not performance acceptance. Original startup
gaps1/2 versus hidden0/1, with a remaining63ms hidden gap, no drops and only0.9%
descriptive CPU difference. Actual geometry is identical apart from overflow.
P2 captures and offline scope diagnostics are complete. Both real capture and
cleanup gates pass; the original one-native-marker-per-page-callback analysis
FAILS and stays failed. Frozen source proves that native scopes can contain
zero or multiple callbacks. A separate tested diagnostic retains that mismatch
and boundary crossing. Original layout has a fade timer and two startup
vsync-message groups; hidden overflow has neither in the collected exports.
This is not universal causality, removal of all pauses or performance acceptance.
See the [P1 report](../reports/performance/2026-10-06-scrollbar-control.md) and
[P2 report](../reports/performance/2026-10-06-scrollbar-profile.md).

### P2 Execution Contract

P2 uses a new `artifacts/umbralink-control/scrollbar-profile/` namespace.
Preserve every P1 file. Extend its167-file harness with six runtime adapters:
composition, compressed capture, gzip path admission, driver, preflight and
public exporter. The composition adapter reuses the sealed P1 fixture,
geometry collector, packed timing serializer and validator. All profiler
configuration, start/stop/error behavior,80MiB headroom,24MiB encoded profile
limit,120s capture and15s cleanup stay unchanged. Native gathering memory is
not hard-bounded by the gzip file limit.

Run exactly a then b, one fresh process each, after source/package/host
admission and15s idle. Both use the same normal package/import ON and profiler
ON; eight retrospective UserTiming marks are emitted only after playback.
Driver/SSH limits remain220/240s. Stop on capture, resource, cleanup, geometry,
identity or export failure; do not retry for a desirable result. Exports may
include only the specifically receipted compressed profile and existing public
evidence, never credentials or other profile contents.

Before launch, assert source-transform equivalence and reuse the full mocked
capture failure matrix with packed nine-field timings/geometry. Test geometry
rejection before later RPCs, same-signal abort, profiler cleanup, gzip bounds,
copy failure and exact namespace restrictions. Run strict Node tests<=30s.
Run supplied-data admission and original capture replay after each real run;
require matched native graphics, fixture geometry and package bytes.

Offline only, use one uniquely named profiler-cli session per saved dump,
explicit loopback-only symbol endpoint, command/time/output bounds and finally
stop with exact PID/socket absence checks. Query full phase marks before any
zoom; require all eight marks to join one fixture document/content process
and one common page-to-CLI offset. Export full content scheduling markers and
all content markers for the first two seconds. Reuse the existing strict
refresh/startup analyzers, comparing fade timer/style populations and
vsync-message/catch-up callback groups. Missing, truncated, mixed-document or
mixed-clock evidence is inconclusive, never a zero-count success. Derived
marker containment does not prove raw pairing completeness. Profiled callback
counts/durations are diagnostic only, not pooled into P1 timing acceptance.

Test protocol: an unchanged capture must fail new geometry admission; a valid
packed result must preserve all original capture/cleanup behavior; a malformed
result or failed write must preserve raw evidence and stop further workload.
Saved-data corruption tests cover identity, clocks, profiler state, geometry,
profile hash/size, resources and cleanup. Mocks prove guards, real runs prove
the adapter integration, and the paired profiles test the proposed mechanism.
No source optimization follows merely from temporal coincidence or no markers.

## Goal And Authority

Continue the authorized full performance campaign, using the owner's existing
permission for isolated tests on quiet wyatt-laptop. Test the concrete lead in
the refresh-catchup report without changing product behavior or the previous
performance gates. Daily desktop browser/profile/launcher/install and Pi remain
untouched. No source build, new browser API, preference/default changes, staging,
commit or agent delegation is needed.

The existing profiled fixture has a scrollbar fade timer at1001ms, style changes
and two roughly400ms groups of vsync-message callbacks. Frozen GTK source has
1000ms delay/400ms fade. The collector prepends a canvas above full-height video.
Actual scroll geometry and transition state are missing. This motivates a
controlled fixture change; it does not establish the cause of YouTube stuttering.

## Contract

Use the existing normal render-pass-marker package only, manifest
4c8085f0f675c5b183976807df38bb99474bbd8be2e58651b52e4be9176eee8e,
Build20261006175655, direct import ON explicitly in each private test profile.
Both arms use identical native/module bytes. The separate render-label CPU
concern remains; this comparison cannot resolve it.

- Arm a: byte-identical original HTML/CSS.
- Arm b: the same CSS with only `html{overflow:hidden}` appended. This is a
  diagnostic page customization, not a proposed browser-default optimization.
- Both retain the owned90s1080p H.264 clip,320x180 canvas,48s playback and four
  12s phases with1/4/4/1copies. No extra callback timer or per-frame RPC/readback.
- Both take one identical geometry/computed-overflow snapshot after canvas
  insertion, before initial draw/play. Record viewport, root/body scroll/client
  extents, canvas/video bounds, and root computed overflow. This forced layout
  read is an observer change common to both; do not pool older captures.
- Retain nine timing fields and the existing lossless per-phase string packing;
  do not enlarge UmbraLink's node/byte limits. Preserve raw before validation.
- Hidden overflow does not make scrollHeight equal clientHeight; require the
  computed mode and valid geometry, not a fabricated absence-of-overflow claim.
  Geometry alone cannot certify native scrollbar transition absence.

## Territory

Driver admission -> same46-file package copies -> existing captureLocalWorkload
ownership/resource envelope -> createSustainedServer -> fixture HTML/CSS/media ->
existing browser/content script route -> timed collector -> packed result -> old
timing/summary validators plus geometry admission -> public-file exporter ->
independent saved-data analysis. New files only under
artifacts/umbralink-control/scrollbar-control/ plus this plan/report/continuity.
Sealed source, harnesses, reports and failed comparisons remain immutable.

Generate narrowly substituted fixture/collector/capture/driver adapters from
frozen inputs, recording byte hashes and reverse-equivalence. Reuse tests for
server request/range/body caps, callback cleanup, serializer, RPC/write/abort
failure and owned process cleanup; add geometry and mode negatives. No generic
framework, alternate launcher or weaker monitor is introduced.

## Phases And Verification

P0: implement exact adapters and failing-first tests. Prove original fixture
bytes unchanged; hidden arm appends only the declared CSS. Validate geometry
types/finiteness/ranges, missing body/scrolling element and extraction failures.
Run both collector arms with the existing full fake-clock harness and assert
identical draw/callback/timer/cleanup counts outside the one geometry read.
Prove real-sized result round-trips through the actual packaged serializer.
Require strict Node gates<=30s, exact authored formatting and doc lint<=60s.

P1: fresh private laptop harness preserving all prior158inputs, new explicit
manifest and complete static-import closure. Recheck source/index/config pins,
remote root ownership and exact packages, no browser/build conflicts and resource
headroom. Fixed a1/b1/b2/a2 order,15s idle after each preflight. Four sequential
processes, profiler OFF,120s capture/15s cleanup,220s driver/240s SSH bounds.
No SIGKILL, threshold relaxation, result-based retries or old-result pooling.
Stop on identity/function/cleanup/cap failure and preserve all partial evidence.
Export only the existing bounded public evidence files, never profiles/tokens.

Analyze raw callbacks, timestamps, startup geometry, drops, native decoder counts,
CPU and all cleanup receipts. Treat lower startup gap counts as descriptive
evidence, not causal proof or release acceptance. Require original layout to
actually reproduce overflow and both arms to preserve video/canvas geometry
apart from the intended scrollbar effect; unexpected geometry is inconclusive.

P2, only after P1 evidence review: a separate paired profiled confirmation using
the existing bounded profiler capture, checking named fade/refresh populations
with exact document/clock joins. Specify those adapters before launch. Profile
cost remains separate from unprofiled timing. No profiler work overlaps playback.
If fade/dispatch groups persist, reject the hypothesis rather than widening it.

## Completion And Remaining Campaign

This diagnostic finishes with complete saved-data replay, exact resource/package/
root-absence verification, immutable evidence and a report stating what changed
and what remains unknown. Its result never replaces prior27/29or28/29failures.
The independent146ms/compositor-drop event, render-label cost, actual native
reuse frequency, automatic recovery and broader layout/CSS/JS goals remain open.
A positive scrollbar control cannot authorize globally disabling animation or
changing callback cadence; any production proposal requires its own parity and
real-workload evidence. One new artifact namespace is the recovery boundary;
never revert the owner's dirty source or staged index.
