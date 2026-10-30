# Batched Frame Reuse Correctness

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

The packaged frame-reuse candidate passes the expanded same/alternating-frame
and multiple-canvas pixel matrix against the immediate pre-cache package on
wyatt-laptop. All 40 complete-canvas comparisons and 160 individual-tile comparisons
match exactly. Both acquisition orders and both repetitions are stable. Resizing
the canvas after an earlier draw sequence also preserves the expected pixels.

This advances P2 of [the active plan](../../plans/video-import-reuse.md). It does
not prove runtime cache-hit frequency, graphics-context loss/recovery, a playback
speedup or a YouTube stutter fix. Direct GPU import remains default OFF and neither
package was installed as the daily browser. No production/native source, shader,
preference default, public API or pixel tolerance changed in this phase.

## Fixed Workload

The existing owned 1920x1080 H.264 fixture is paused. The page retains two
VideoFrames acquired at media positions 0.5 and 2 seconds. Both remain alive while
the page draws the following fixed cases twice in fresh canvases:

- AAAA and BBBB, each on one canvas.
- ABAB and BABA, each on one canvas.
- Two canvases with AAAA and BBBB, interleaved by tile.
- Two canvases with ABAB and BABA, interleaved by tile.
- A, generic RGBA frame, B, A on one canvas.
- Draw AAAA, reset the canvas width, then draw BABA.

Each 640x360 canvas has four disjoint 320x180 tiles. All draws in a case are
synchronous: no await, pixel readback, or diagnostic occurs between them. The
private provider observation and pixel read happen only afterward. A later draw
therefore cannot hide a stale earlier tile. This is a synchronous page batch;
the test does not prove the recorder emits all its events in one native
CanvasTranslator translation batch.

Separate one-draw canvases provide A, B and RGBA references within each run.
Their hashes must be distinct, every tile must match its own reference, and the
complete canvases/references must match across packages. The full schedule runs
in both acquisition orders, ending at the two existing native decoder receipt
positions. VideoFrame timestamps are recorded but not assumed to use the media
seek clock. Closing a VideoFrame still produces InvalidStateError when drawn.

## Packages And Runs

Both packages use direct import ON in their isolated profiles. Baseline is
exports/umbrafox-render-pass-marker-20261006; candidate is
exports/umbrafox-import-frame-reuse-20261006. Both contain 46 immutable files and
report BuildID 20261006175655. Their complete manifests, not BuildID alone,
distinguish them:

- Baseline: 4c8085f0f675c5b183976807df38bb99474bbd8be2e58651b52e4be9176eee8e.
- Candidate: 9ec305adc36c8c1e362ed6e74925c8c473efd999212d354c6f11431ca17b8678.

The new 152-file harness retains all 146 prior inputs byte-for-byte. Its manifest
SHA256 is e4d162bcbf261e6bb60c073a8561af9aafcc7881c0aac92d08fd5a32e6c44e3d.
The six added runtime files contain the collector/validator, capture adapter and
bounded driver/admission/export/preflight wrappers. Static imports cover 25 modules.
Wrapper generation verifies the previous immutable source hashes and checks exact
allowed substitutions. Capture ownership, resource caps, raw-before-validation,
120-second total / 105-second work / 15-second cleanup, and 220/240-second driver/SSH
bounds remain unchanged. Both runs passed host-idle/resource/package preflight.

| Arm      | Root Suffix | Controller / Browser PID | Duration, ms | Files |  Bytes |
| -------- | ----------- | ------------------------ | -----------: | ----: | -----: |
| Baseline | eTYhna      | 1760367 / 1760386        |        26733 |    40 | 379629 |
| Reuse    | MH97tx      | 1762691 / 1762723        |        26507 |    40 | 379479 |

Runs occurred October 7 UTC, October 6 local time. These durations are capture
envelopes with readbacks and private observations, not performance measurements.
Hardware receipts identify Intel Iris Xe RPL-P, Mesa/iris 25.2.8.0, X11/WebRender
and hardware H.264 decoding. All collected canvas provider observations are
accelerated. Neither fact identifies an individual cache hit. Sampled process
trees contain no separate GPU process; that is not proof of every transient
process or a graphics-context-loss mechanism.

Both runs end with clean owned SIGTERM, zero dropped log bytes and verified
installation contents. Sixteen resource samples pass original absolute and
post-baseline caps; the maximum artifact sample is 147751474 bytes under the
unchanged 256 MiB limit. All 80 exported public files, totaling 759108 bytes,
are independently rehashed. No profile, token or app-data payload is exported.
All 24 distinct recorded browser/controller/child PIDs are independently absent
at 2026-10-07T01:40:25.503Z. Post-run input verification matches all 152 inputs and
the candidate's 46 package files. This is sampled and post-startup evidence, not
continuous process/network/filesystem isolation.

Browser logs preserve the known Sandbox EPERM warning and successful VA-API
initialization. No warning-free claim is made. Neither browser run was retried.

## Verification

Thirty-seven focused and adjacent test groups pass under strict unhandled
rejection handling. The tests execute the serialized collector with fake canvas
operations, detect readbacks and microtask yields between draws, reject stale
frame reuse and missing tiles, and exercise partial frame/canvas construction,
seek/draw/readback failures, native observer rejection and listener cleanup.
Capture tests preserve raw malformed replies, reject document/decoder/window
changes, and check timeout/abort/write failures without later requests. Saved-data
tests rehash the actual exports, replay all comparisons and reject 14 corrupted
native/resource/provenance inputs. These fake tests are not native rendering
evidence; the two actual browser captures supply that separate evidence.

Initial scaffolding failures are retained: an invalid await in the new test,
then missing collector/audit modules. A wrapper-generation assertion caught an
incorrect assumption about the old unpacker's mode expression; generation stopped
before writing wrappers, and the exact source mapping was corrected. None is a
production regression reproduction or a browser retry. No acceptance predicate
was weakened. The source guard retains all 65 product/test pins, original 146
harness pins, HEAD, staged patch and build configuration. Prior GPU and native
mechanism seals remain unchanged.

Explicit formatting checks pass for the ten new authored collector/preparation/
analysis/test files; the generated runtime wrappers retain their exact pinned
bytes. Scoped report/plan lint reports zero errors or warnings, and tracked diff
whitespace checks pass. The saved summary replays exactly, including the final
independent 24-PID absence list. All capture, transfer, analysis, test and lint
commands are terminal before sealing. No owned browser is left running.

Evidence is artifacts/umbralink-control/import-frame-reuse-stress/. The contract,
prepared/verified manifests, raw exports, analysis, tests and failure logs are
preserved there. The separate phase seal is import-frame-reuse-stress-final.sha256
in its parent directory. The active plan and continuity file are not sealed.

## Remaining Gates

Resize success is not graphics-context recovery. The existing upstream accelerated
canvas-loss test uses a separate GPU-process restart and skips that route when
the process is absent; an in-process compositor reset is not enough to claim this
shared canvas GL context was lost. The next source/native gate must exercise or
positively observe the actual shared-context invalidation/recovery path without
changing the normal backend merely to make a test pass.

Actual batch reuse frequency is also unproven. After those gates, P3 remains the
fixed A1/B1/B2/A2 profiler-OFF playback comparison against this same immediate
baseline. Earlier smoothness failures and the renderer-label candidate's CPU
increase remain unresolved. No daily browser, profile, launcher, installation or
Pi was changed; the full rendering/layout/CSS/JavaScript objective stays active.
