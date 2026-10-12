# Compositor Attribution

## Objective And Prior Evidence

Continue the full rendering/layout/CSS/JS performance goal by locating remaining
video/canvas presentation stalls after the current candidate reduced CPU26-29%
and four-copy P95 to2ms, but failed2 of29 smoothness criteria. Preserve the sealed
descriptor-balanced report and all prior failures. The immediately preceding
status-only goal turn was no progress; the new source trace and tested analysis
contract are concrete preparation, not another performance fix.

Exact candidate is Build20261006175655; package manifest
a7d80698828618f3d0c3e9f760e6fe8b63a72f3f93ba8dabcb132581c8784e87.
Existing laptop package is under
/home/wyatt/.cache/codex/descriptor-availability-harness-20261006-h9KsaO/candidate/umbrafox.
Previous131 harness inputs remain frozen. New capture files need an add-only
overlay and a new manifest, not edits to the old workload or evidence.

No desktop daily-browser/profile/launcher/install operation, Pi, source build,
product default change, commit/stage/push or SIGKILL. Ordinary authorized isolated
laptop diagnostics may proceed after the implementation gates below. Do not
use unrelated desktop jobs as laptop-load evidence or touch their processes.

## Territory And Hypotheses

Source report: ../reports/performance/2026-10-06-compositor-source.md.
Source receipt: artifacts/umbralink-control/compositor-attribution/source-final.json.

Map: image delivery -> queue selection and skip counting -> asynchronous bridge
report -> container -> media frame statistics -> saved native receipt. In parallel,
refresh-driver callback eligibility -> page draw batches -> canvas replay ->
renderer and presentation. Existing marker identities/times only partly join
these paths. A GPU bottleneck or a specific driver's fault remains unproved.

Falsifiable alternatives:

- Renderer/backend pressure: busy-reason SkippedComposite events occur around
  the delayed intervals, with renderer work or waiting visible in the same capture.
- Content scheduling: callback gaps occur while content is occupied elsewhere,
  without corresponding busy-compositor evidence. A callback scope can include
  only an eligibility check, so count agreement alone does not prove execution.
- Image delivery/timestamp timing: queue-update/selection markers show starvation,
  timestamp changes or selection skips while render work remains short.
- Observer effect: profiled behavior differs materially from both unprofiled
  controls. Keep those timings separate and limit conclusions to that profile.

No event does not falsify these alternatives unless thread/marker/buffer coverage
is first established. Same-time events alone do not prove causality. Never infer
physical presentation from renderer completion or requestVideoFrameCallback.

## Diagnostic Contract

### Compressed Export Revision

The revised counter pilot completed playback and eight phase marks, then failed
the unchanged24MiB raw preservation cap. The owned raw file is69577342bytes.
Profiler stop, clean SIGTERM, all12 recorded PID absences and package/hash checks
passed. Preserve this failure; no raw profile content was read or exported.

Next revision: compositor-compressed, new laptop-composition-r3 output roots.
Reuse the frozen captureComposition implementation through an exact-method
adapter. Only its dump request changes to an existing browser-realm script that
calls Services.profiler.getProfileDataAsGzippedArrayBuffer(0). Native source
returns an object with profile:ArrayBuffer and additionalInformation; discard
the latter. No browser service/API/source/build/default changes. The previous
status-only turn was no progress; this revision addresses the observed blocker.

Write only ProfD/composition-profile.json.gz, exclusively, after exact parent PID
and ProfD checks. Check the parent monotonic deadline before gathering and after
every await, plus active profiler before writing. The deadline is the observed
after-playback performance snapshot nowMs+15000, not a new clock domain or a
deadline refreshed by late delivery. IOUtils writes cannot be canceled once
started; owned browser termination remains the outer bound. Keep the20s RPC and
all existing105/120s work/total limits. No further side effects after deadline.

Encoded dump and copy each remain capped24MiB; source and destination must be
owned regular canonical files. Copy exact opaque gzip bytes only, then hash and
record a receipt. No raw JSON parser/decompressor. This is a new encoded-export
contract, not retrospective acceptance of the failed raw export. Native gathering
still materializes raw JSON in memory; no hard native-memory bound is claimed.
The same256MiB artifact cap,128MiB profiler configuration and workload apply.

Tests precede implementation: late gather rejection/deadline, bad PID/profile,
wrong object/buffer/magic/size, exclusive write and chmod/read/copy/save failures,
receipt identity, all unchanged capture/finally-stop regressions. New driver and
export must be mechanically equivalent except namespace and gzip filename.
No controls launch until one fresh pilot and supported CLI retention checks pass.
All prior frozen manifests stay unchanged; new dependency closure is verified
before transfer and launch. Pure tests10s, combined30s, source40s, docs60s,
driver220s/SSH240s; no commit/stage/install. Scope remains the full performance
goal; this revision is diagnostic preparation, not a rendering fix.

### Buffer Counter Correction After Pilot

The first pilot is terminal and FAILED its old diagnostic assertion, not a
performance criterion. Its generation0->2 was incorrectly called buffer wrap.
Exact candidate source shows mRangeEnd advances in bytes, whereas mEntryCount
is capacity divided by8. GetBufferInfo divides the byte index by that entry
count to produce generation. The saved advance is33566276bytes, with a maximum
capacity of134217728bytes. Neither generation changes nor staying below that
maximum prove whether chunks were discarded. CLI conversion also omits native
contentEarliestTime metadata; do not substitute rootRange for retention.

The frozen first135 inputs and pilot remain unchanged. A separate
artifacts/umbralink-control/compositor-buffer-correction revision reconstructs
the byte index, rejects malformed/overflowing/regressing counters and records
retention as unproven. It does not increase buffer capacity, capture duration,
artifact limits, or change the browser workload. A successful collection is
explicitly pending offline retention checks, not automatic attribution acceptance.
Real early/late marker or sample evidence must bracket any analyzed interval
for the relevant process/thread. Retrospectively inserted phase marks alone
prove clock alignment, NOT retained history. Missing/ambiguous retention keeps
negative-event and full-interval conclusions inconclusive. No control sequence
starts merely because a collection finishes.

Assertion-first saved-pilot and one-byte-boundary tests failed the unchanged
validator11pass/2fail; the correction and selected old regressions pass91 tests.
Source-units.json verifies36 source files,60 build pins,135 frozen harness
inputs and unchanged HEAD/index/working/configuration. One fresh revision pilot
is allowed after exact manifest/source/host/test gates; it is integration only.
New output roots are laptop-composition-r2-ARM-20261006-SUFFIX. No original
capture is retried or rewritten. All original resource/cleanup gates still apply.

Reuse the48-second owned1080p H.264 fixture,320x180 default canvas,1/4/4/1 copies
and four12-second phases. Keep normal clocks, public surface checks, native
provider/decoder receipts and5-second passive monitoring. No extra timed-loop
RPC, readback, per-frame instrumentation or changed warmup.

First sequence is ON/unprofiled-before, ON/profiled, ON/unprofiled-after in fresh
processes using the same package. Add the same eight phase marks after playback
in all three. They use explicit saved phase.beginMs/endMs through standard
performance.mark, with unique owned-fixture names. Their insertion time is not
the event time. Validate the full collector result before emitting, emit each
once, preserve partial failures, and never expose this instrumentation to a real
site. Build the request adapter through the existing private route without
changing its context/document, listener, timeout or cleanup contracts.
The implemented adapter issues a separate exact-document page RPC only after
the unchanged playback reply and native boundary receipts. All eight collision
checks precede emission; returned names/timestamps must match exactly.

Before choosing the profile configuration, inspect the exact StartProfiler
producer/consumer and supported-feature receipts. The prior profile adapter is
artifacts/umbralink-control/profile-dom.mjs; do not import its headless-only
artifact exemption into a headed experiment. Target the smallest fixed filter
covering parent/content GeckoMain, Compositor, Renderer, CanvasRenderer,
media-state-machine and relevant decoder/IPC workers. Record actual thread names,
PIDs, buffer entries, generation, interval and features. Verify requested versus
actual configuration; do not assume entries were honored or silently relax them.
The source-reviewed fixed request is16777216 entries (the native128MiB minimum),
5ms interval, features js/stackwalk/processcpu/nomarkerstacks and filters
GeckoMain/Compositor/Renderer/Media/Video/IPC I/O. No duration or active-tab filter.
The source can clamp smaller requests to this minimum; request it explicitly.
Require exact returned configuration and active/unpaused state. The original
no-generation-change guard is superseded by the source-backed correction above;
counter consistency is not a parent/child retained-coverage proof.

Start only when inactive; retain ownership and stop in finally. No screenshots,
allocation tracing, MOZ_LOG, external symbols or new public browser API. Profile
dump/copy each has a24MiB acceptance limit; preflight reserves at least80MiB
additional headroom under the unchanged256MiB sampled artifact ceiling. Dump
growth is monitored, not a hard preallocation guarantee. Exceeding a cap stops
and preserves failure, without increasing limits or deleting evidence.

The existing120-second total/105-second work/15-second cleanup budget remains.
Playback RPC is bounded60s, dump20s, profile preservation5s per operation, all
inside remaining work budget. No second browser while an owned process remains.
If post-capture profiler stop fails, retain the first failure and perform owned
browser cleanup; do not report a successful stop without its receipt. Detached
OS I/O is not magically canceled by a promise timeout.

Driver220s/SSH240s, host admission45s and public export25s remain. Require fresh
private installation/profile/application/local/temp roots and native path/build/
PID joins. Apply the same source, hash, no-browser/compiler, memory/disk and
recorded-process-absence admission on wyatt-laptop as descriptor-balanced.
Only the explicitly owned profile may be exported, alongside approved public
evidence. Never export profile-directory contents or discovery credentials.

## Offline Analysis Contract

### Exact Stall Samples

Next offline namespace: artifacts/umbralink-control/compositor-gap/. The sealed
controls recording and report stay unchanged. One supported CLI load of the same
SHA-verified gzip compares five exact process/thread identities over the derived
render interval, callback gap, and 200ms flanks. Include idle samples; preserve
unfiltered contexts, call trees, markers and existing profiler/hang observations.
Raw recording origins are not added to normalized query bounds. Zero samples
mean no sampled stack evidence, not an idle thread or proof of a particular wait.

The exporter retains the reviewed call and finally-stop regions byte-for-byte:
180s internal budget, 15s cleanup reserve, 195s outer bound, explicit loopback
symbol server, owned PID/socket cleanup, exclusive outputs and existing byte
caps. Four command/identity/lifecycle tests pass under10s; initial missing-module
RED is infrastructure-only. There is no new browser, native build, product
change, default change or installation. Exact sample availability decides whether
to pursue existing native stacks or a source-backed minimal observation gap.

Exact queries now completed: one sample per inspected parent thread across the
153.752ms render, versus31 in fixture content. The124ms callback gap has0/0/1/1
on parent main/Renderer/canvas/compositor versus25 in content; each200ms flank
has40 on all five. This is sparse sampled evidence, not an idle/GPU-wait verdict.
The first export stopped on two overlapping Composites; retain it. The corrected
selector uniquely chooses the one active at gap start. Both daemons stopped.

One bounded follow-up uses existing cold-symbols owned Samply/CLI lifecycle to
resolve the single Renderer stack. Exact packaged libxul/executable/NSPR and gzip
hashes are checked, not the current objdir. Loopback-only configured endpoints,
empty DEBUGINFOD_URLS, fresh symbol cache, two Rayon workers,8GiB address-space/
256MiB file/core0 limits; no browser UI. Work150s, server watchdog180s, outer210s,
CLI stop15s and server/absence5s. Complete functions must reconcile self counts
and the same sample/clock/thread population. Missing symbols remain unknown;
no assembly or stage-duration claim follows from a lone sample.

### Fixed Observer Sequence Execution

Completed October6: all three arms and saved-export admission pass; see
../reports/performance/2026-10-06-compositor-controls.md. Profiled CPU is about27%
higher than either control, with one124ms callback gap and four compositor
drops only in that arm. Saved CLI-derived Composite spans153.752ms across the
gap; renderer_time reports152.294ms and the exact fixture document records
seven waiting-for-paint ticks. This narrows attribution, not runtime acceptance.

The original CLI failure assumed parent compositor document ID must equal the
fixture ID. Source tracing disproves that assumption. New parent-only analysis
retains the actual widget ID and labels fixture association unproven; content
clock/callback joins remain strict. Original failure and prior seals stay intact.
No browser rerun followed this analyzer correction. Both owned CLI sessions
are stopped with exact PID/socket absence. Next inspect exact-gap sample
availability and existing render-stage observations before any native change;
the observed sample-count difference may limit stack attribution. Full objective,
normal pixel/public-interface parity, default-OFF import and owner-browser hold
remain unchanged.

The compressed pilot and its offline coverage analysis are sealed. The next
namespace is artifacts/umbralink-control/compositor-controls/. It reuses all142
frozen runtime inputs without transfer or edits: control-before, profiled,
control-after, in that order, each once. All three keep GPU import ON and the
same48-second fixture. Failure stops the sequence; no result-based replacement.

The offline checker replays actual profiler state at admission/playback boundaries,
exact native/build/root/document joins, configuration/mark receipts, encoded
profile identity/deadline when present, no profile-only artifacts in controls,
resource baseline joins, installation and cleanup receipts, copied INI bytes,
and sampled process-start identities for CPU deltas. Serialized settled
preflights and unique roots/processes precede comparison. The existing142-input
remote guard and38-file source guard are repeated; only the source guard's output
namespace changes mechanically. Controls preserve ordinary background services.

Compare CPU per elapsed second and the four phase distributions/counts separately
for each arm. Report the profiled difference against BOTH controls and drift
between controls. This single fixed-order sequence is descriptive: no new
numeric rendering-acceptance threshold, causal profiler claim, pooling with
earlier sequences, or automatic repeat. Actual profile coverage and marker
attribution remain a separate supported-CLI follow-up. The first new RED is
missing-module only; a later behavioral receipt-corruption test exposes and
corrects missing offline dump-receipt validation. Tests run under30s; runtime,
export and cleanup bounds are unchanged from the diagnostic contract above.

Previous owner status response was no progress toward the implementation goal.
This phase executes the next already-authorized measurement rather than changing
the goal to a harness-only milestone. Desktop daily installation remains untouched.

### October 6 Integration Checkpoint

The compressed pilot succeeds and the saved CLI exports now show actual samples
before/after playback on all five key threads, plus all four phases. Report:
../reports/performance/2026-10-06-compositor-compressed.md. Two owned CLI sessions
are stopped with exact PID/socket absence receipts. No current runtime is active.
The prior status-only goal turn was no progress; this offline coverage and
classification follow-up changes the next decision, not the optimization goal.

The pilot has no reproduced 146ms stall, no reported native/page video drops,
and only idle-reason SkippedComposite markers. Background component/settings
downloads and first-half parent work are observed. Do not infer a clean idle
environment from a fresh profile, or turn absent overload events into a universal
negative claim. Existing 3-arm observer-control sequence remains prospective;
no thresholds, runtime inputs, workload or ordinary browser services changed.
Actual source/package/host admission must be repeated before its first launch.

Use installed profiler-cli0.10.0 only for loading profiles. Each load needs its
own session and explicit --symbol-server http://127.0.0.1:9, bounded commands and
finally stop of that session alone. Capture session PID/socket and verify owned
cleanup. No raw-profile parser, upload, implicit symbolication network or
stop-all. Recheck version and read full guide before use.

Run profile info/meta/thread inventory before interpreting observations. Record
profile SHA, loader receipt, process/thread IDs and document metadata. Pin every
export to that same load; matching rootRange alone is insufficient identity.

Export the phase marks and both instant families independently using:

```sh
profiler-cli profile markers --search composition-proof-NONCE --limit 50000 --session SESSION --json
profiler-cli profile markers --search 'Video frames dropped' --limit 50000 --session SESSION --json
profiler-cli profile markers --search SkippedComposite --limit 50000 --session SESSION --json
```

No zoom, thread/category/duration/stack filter. Keep the complete totalCount and
require the row array to match. The native drop marker lacks a document field;
keep its process/producer/frame IDs and document-unobserved classification, not
a fabricated document join. Skipped reasons remain distinct. Empty exports are
unknown coverage, not proof of a drop-free compositor. New markers.mjs validates
explicit phase clocks, all8 anchors, PID/document/thread identity, raw context
equality, normalized bounds and exact payload fields before summarization.

Additional source-guided exports: UpdateCompositedFrame, ImageComposite::SetImages,
Video frame offsets, VideoFrameTimeStampJitter, CompositeToTarget, Composite,
requestVideoFrame callbacks, CanvasTranslator, VideoSink::RenderVideoFrames,
VideoSinkDroppedFrame and PlayVideo. Preserve coverage and crossing records.
CLI-derived Composite durations do not prove split-pair completeness. Do not
compute a strict pre/inner/post partition without supported raw-pair provenance.
For samples, include idle and state the actual sample population; no CPU claim
from wall-time markers alone. Keep media microseconds, page clocks and normalized
profile times explicit. Do not apply raw rootRange.start a second time.

## Verification And Progress

Before implementation, the territory/test review established that the current
capture asserts profiler OFF, so it cannot simply be reused unchanged for ON
profiling. Reuse its ownership/cleanup envelope; make an explicit new diagnostic
capture adapter, preserving all frozen inputs. The adapter now exists, with
separate profiled/control paths and no shared-file changes. It reuses the bounded
profile-preservation helper and its dom-profile.json filename, without using the
older DOM workload or artifact exemption. Raw profile bytes are never parsed by
the exporter; only the supported profiler CLI may analyze them.

Existing coverage includes the prior92-test saved-evidence/callback suite and
native40/pixel48/loss8 correctness gates. The new preparation rerun passes70
tests:25 new and45 selected existing regressions. Missing-module and
incorrect-zero-limit REDs are retained. No native
rendering algorithm is changed in this phase, so tests target the diagnostic's
producer/consumer contract rather than pretend to prove a performance fix.

Next implementation gates:

1. Assertion-first tests for unchanged collector request, exact8 post-playback
   marks, no timed-loop additions, wrong context/document, duplicate/corrupt marks,
   script/abort failure and malformed native receipts.
2. Fake control tests for inactive/start/configuration/dump/stop ordering,
   primary-error preservation, late rejection, cap/write/timeout failures and
   profiler ownership. Test the normal and every cleanup failure path.
3. Pure/source guards plus exact new-file format/lint, then independently read
   the final delta for deadline and side-effect mistakes. New manifest includes
   the unchanged131 runtime inputs and exact new adapter dependency closure.
4. One bounded diagnostic pilot may validate the complete integration. Preserve
   a failed pilot separately; it cannot substitute for a successful control arm.
   Freeze the three-arm sequence before its first capture. No result-based retry.
5. Replay all saved receipts, resource/cleanup gates, complete marker coverage
   and exact CLI clock joins. Classify every hypothesis supported, contradicted
   or inconclusive; design a rendering change only from the resulting evidence.

Preparation gates1-3 now pass at the source/fake-data level. Source-final.json
pins33 inspected files (30 unchanged from recorded HEAD),60 build inputs and
131 unchanged prior harness inputs. The new135-file runtime manifest is
879b39ee881e539db114a98b2526cd91af2f0d3f36fc2cf3ba34f1cfc57daae3.
Only capture.mjs/driver.mjs/markers.mjs/export.mjs were added remotely; canonical
private root identities, predecessor hashes, absent destination and all135 final
hashes were verified. Remote admission found no browser/compiler and more than
12GB available memory. This permits one fresh integration pilot after another
settled preflight, not automatic completion of the three-arm experiment.

Pilot driver uses the existing220s Node/240s SSH limits with:
`node HARNESS/artifacts/umbralink-control/compositor-attribution/driver.mjs HARNESS/candidate pilot`.
Before launch,15s settle then the unchanged descriptor-balanced/preflight.mjs
checks the old131 inputs and complete candidate; the separate new-file guard
checks135 inputs. Export has20s Node/25s SSH limits,8MiB ordinary plus24MiB for
the exact owned profile copy. It checks recorded PID absence before reading that
profile. Failed/unreceipted copies remain remote rather than being exported as
accepted evidence. The desktop browser and all prior seals remain untouched.

Pure tests10s, combined regression30s, source guard40s, lint60s. These limits are
watchdogs, not performance acceptance criteria. No threshold or pixel tolerance
relaxation. Real browser integration, actual marker populations and observer
effect remain open. The complete broader optimization goal remains active.
