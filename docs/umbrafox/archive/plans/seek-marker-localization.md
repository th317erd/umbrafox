# Seek Marker Localization

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Contract

Authorized October13 by Wyatt's "Please proceed" after the bounded UmbraLink
profiling proposal. No engine/default/public-interface change, rebuild, personal
profile access, desktop browser action, or Pi action. Existing laptop package
Build20261006175655 remains the authority, not the October12 beta.

Reuse the sealed audio-on-seek workload and its resource/identity/cleanup code.
New isolated adapter under artifacts/umbralink-control/seek-markers. Do not edit
sealed inputs. Exact source-region generation must check hashes and unique edit
sites; import closure must be transferred and verified before execution.

Two fixed cells, sequential with terminal-evidence/cleanup review between them:
one forward progress-bar seek with profiler OFF, then the same seek with a
marker-only profiler ON. Both retain ordinary1080p selection, volume0.05 audio,
one video/document, four native audio endpoint reads, and >=130s after seeked.
No outcome-driven retries. A startup failure stops the wave for review.
Earlier no-seek comparison is context, not a concurrent control in this wave.

Retain240s total/225s work/15s cleanup and256MiB sampled artifact cap. Admission
requires195s before audio preparation and180s before the timed interval, reserving
time for export without shortening observation. Keep host/process caps unchanged.
No compiler or other browser run on the laptop concurrently.

## Profiling

Start only after quality/audio setup through existing UmbraLink browser-realm
script execution. Same boundary RPCs in OFF and ON; no new product API. Request
1Mi entries,5ms interval, features nostacksampling and nomarkerstacks, filters
GeckoMain,Compositor,Renderer,MediaDecoderStateMachine,MediaPDecoder,Audio,IPC.
Validate actual configuration/support and report any entry-count clamp. No native
stacks, screenshots, allocations, network logging, or raw profile parsing.

Emit private parent-process instant markers at begin, before-seek, after-seek,
and end, each with exact parent PID/document and bounded profiler-epoch receipt.
These bracket the action, not exact child event timestamps. No page UserTiming or
public globals. Correlate only through verified CLI clock conversion and retained
process/document metadata. Missing frame IDs, queue information, or split-marker
provenance are gaps, not permission to infer per-frame causality.

After playback closes/restores, pause the owned profiler, get compressed native
profile bytes, reject >32MiB before writing to the owned diagnostics directory,
then stop in finally. Failure/abort can leave no profile; owned-browser cleanup
remains authoritative. Do not schedule export after cancellation. Service-side
in-flight native collection/IO is not claimed synchronously cancelable.

## Verification And Analysis

Before launch: fake profiler/control tests for inactive/active modes, identity,
unsupported features, configuration mismatch, duplicate/out-of-order transitions,
RPC/write/export failure, abort, late work, byte cap, and stop failure. Verify old
workload source hashes, generated syntax and relevant existing regression tests.

Per cell: export only allowlisted diagnostic evidence, never discovery tokens or
profile contents other than the named profiler file. Verify saved hashes, native
root receipts, caps, restoration, zero dropped logs and recorded PID absence.
No second launch without clean first-cell cleanup and unchanged runtime inputs.

Analyze through profiler-cli0.11.0 named owned session with existing local samply;
no remote symbol server or upload. Read supported CLI exports only. Own daemon
must stop in finally; preserve output/cleanup identity. Bound each command and
analysis exports. Reject mixed normalized/root clocks and mismatched PIDs/documents.

Compare OFF/ON frame-drop windows before drawing observer-sensitivity conclusions.
One pair is not a causal effect size. Marker-only data cannot establish CPU stacks,
physical scanout, backend provenance, or exact GPU waits. Prefer existing frame
jitter/offset/set-images/composition markers; report concrete missing coverage.
Record outcome and next falsifier before considering a performance patch.

## Progress

- Source/API review and adapter implementation complete. A native configuration
  mismatch (`capacity`, not `entries`) was caught before launch and covered by a
  failing-first regression. Focused/integration/adjacent tests:98PASS; scoped
  six-file ESLint:0errors. Prior sealed workload remains unchanged.
- Laptop transfer verified71 runtime files, no browser/compiler contention,
  12.13GB available memory and22.50GB available disk. Harness:
  `/home/wyatt/.cache/codex/seek-marker-harness-9Xjh9O`.
- OFF control completed with clean shutdown and14 recorded PIDs absent. Post-seek
  drops1.53%,0.33%,1.88%; the earlier severe stutter was not reproduced here.
- Initial ON playback completed but compressed export failed. Its adapter assumed
  a bare ArrayBuffer; pinned native producer and browser tests return an object
  containing `profile`. Generic client error handling discarded the native error,
  so the original error text is unavailable. No profile file exists. Playback
  drops8.29%,10.78%,13.34%; clean shutdown and14 recorded PIDs absent. This remains
  a failed capture, not localization evidence.
- Original adapter/manifest archived in `v1-adapter.tar`, remote harness unchanged.
  Export-envelope repair retained failing-first tests;104 tests now pass. Private
  script failures return bounded diagnostic text for saving before rejection.
  One corrected ON recovery capture is admitted after transfer/lint review, with
  identical settings/workload/caps, no outcome-driven tuning or automatic retries.
  No runtime product source or public interface changed. Offline analysis pending.

## Completed Wave

Corrected ON capture passed and yielded19651450B gzip, SHA3ad5cb83c6ec8e530e415a6b8e2c3890b12545a84c3519b017b9d67d9eadf6fc.
Post-seek drops5.30/9.86/7.89%; observer effect versus run variability unresolved.
Only late83-86s retained; begin/seek anchors lost. End anchor/PID/document/root
clock conversion verified. No seek-onset localization claim.

All448 explicit drops had the skipped frame queued before the preceding
composition under the contiguous-ID check;439 previous compositions repeated.
Same-frame timestamp changes absP9511.42ms/max18.2ms; Renderer Composite derived
median1.110ms/P991.907ms. Audio-to-video clock mapping/selection is the next lead,
not a proven cause or fixed engine issue. Source route verified to deployed base.
No raw split-marker pairing, GPU timing, continuous audio source or scanout claim.

109 tests PASS; ten authored/manual files scoped ESLintPASS. Failed first ON and
all original inputs retained. Three owned browsers cleaned;14PIDs absent/run;
both CLI daemon+samply pairs absent. Postflight18:34:34UTC all71 files/harness
unchanged and no matching browser/compiler. Evidence sealed134files121149058B.
Report: docs/umbrafox/archive/reports/performance/2026-10-13-seek-marker-localization.md.
Next diagnostic contract must retain the transition and resolve source/paired
clock/query latency before any timing patch; no further run scheduled this wave.
