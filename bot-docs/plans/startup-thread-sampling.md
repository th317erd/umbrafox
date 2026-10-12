# Passive Startup Thread Sampling

## Objective And Scope

Localize the short unprofiled startup paint-progress interruption without
assuming it is the owner's distinct prolonged post-seek problem. The sealed
startup-variability audit found similar graphics/whole-process CPU/buffer
state in rough and smooth captures and no controller-to-page clock mapping.
No product fix follows from those observations.

This authorized performance investigation uses only new scratch tooling under
artifacts/umbralink-control/startup-thread-sampling. All existing captures,
fixtures, package bytes and staged changes remain untouched. No desktop/Pi
browser action, system driver/kernel setting, native build, public API, default,
extension or codec change. Isolated laptop runtime remains gated on preparation
and exact source/contract tests; this plan alone does not certify readiness.

## Contract

1. Reuse the existing owned capture lifecycle,120s total/105s work/15s cleanup,
   private installation/profile/app-data/local-data/temp, existing hardware AV1
   path and256MiB sampled artifact cap. Preserve the existing20s playback,
   1080p menu preparation and all media/identity/resource/cleanup oracles.
2. Both arms retain profiler-inactive checks. Do not reuse Start/Stop as a
   proposed optimization. A observes no thread series; B adds only passive
   selected-thread counter reads. Any changed setup/RPC path must be common to
   both arms and recorded, not silently compared to historical runs.
3. Before implementation, read laptop CLK_TCK and scheduler-stat availability
   using a bounded metadata-only command. Do not enable scheduler statistics.
   Read-only task runtime/runnable-wait counters are optional: disabled or absent
   support cannot be interpreted as zero waiting. Prefer CPU ticks if the extra
   interface lacks an established reliable contract.
4. Target only the owned browser parent main thread, exactly one parent Renderer
   and Compositor thread, and the selected content main thread. Main TID equals
   PID; names alone are not identity. Discover the two named TIDs in the owned
   parent's task directory, with a finite task-count/read budget. Reject missing
   or duplicate matches. Do not walk other host processes or read task stacks,
   command lines, wchan symbols or private profile files.
5. Retain parent/content PID start/parent/group/session stamps and TID starttime.
   Revalidate process stamps around each read batch and each TID stamp on every
   observation. PID/TID reuse, disappearance or malformed data is failure,
   never a fallback to a replacement thread. Per-thread stat fields are parsed
   using the final comm delimiter, handling spaces/parentheses and rejecting
   malformed/unsafe integers. Read only utime/stime counters, state, identities
   and bounded names; omit unused addresses and pointer fields.
6. Fixed200ms cadence, single flight, at most160 samples/32s, at most512 task
   entries on initial discovery,16KiB per proc read and1MiB final series. No
   catch-up bursts. Record missed slots and read spans, use the capture signal,
   poison permanently on failure and stop in finally. A timeout must not start
   another sampler or publish late results. Already-started OS I/O may remain
   pending; report that boundary rather than claiming OS cancellation.
7. Store request send/receive controller-monotonic brackets for the existing
   playback RPC. Its private nativeStart/nativeEnd receipt supplies a bounded
   offset range, not an invented exact point or midpoint. Require ordered finite
   clocks, stable PID/document and a narrow admitted bracket before relating
   thread bins to playback. Page-counter event time is still unknown; no
   per-frame or physical-scanout claim. Review exact page/native clock precision
   before any tighter association with individual one-second counter samples.
8. No per-sample browser RPCs, profile dump, public marks, source injection into
   page globals, sampler disk writes or process signals. Save bounded final
   series and partial-failure evidence through the existing evidence writer.
   Primary capture failures survive secondary preservation errors.

## Verification And Runtime Gates

Phase1: pure parser, identity, monotonic counters, sampled CPU arithmetic,
clock-range and scheduler tests. Falsify malformed/truncated data, negative or
overflow values, reordered/duplicate/missing threads, reused TIDs/PIDs, changed
parent/group/session, stale clocks, slow reads, abort, timeout, late rejection,
overlapping calls, cap exhaustion and missed-slot handling. Smalltests10s.

Phase2: owned harmless Node test-process procfs exercise, not a browser. Validate
actual Linux parser/path behavior and bounded cleanup. Counter-change proof
requires actual work and stable identity; no claim that fake operations prove
Linux behavior. Do not inspect unrelated processes. Total exercise<=10s.

Phase3: integrate by composition with the sealed capture, not broad source
rewrites. Test the full control/sampled operation ledger, every RPC/save failure,
raw-before-validation preservation, sampler stop and late-I/O isolation. Reuse
existing saved-data review, adding narrow new schema/clock/thread checks. Verify
runtime import closure, source pins, forbidden flags and package provenance.
Combined strict Node gate<=30s. Preserve earlier failed tooling evidence.

Phase4, only after1-3 PASS: one prospective fixed laptop A/B/B/A sequence,
fresh owned run each. No outcome-driven retries, no active profiler, no repeated
sequence merely because the stall is absent. Verify resource/cleanup/package
postflight after each, then independently replay saved results. If observer cost,
clock uncertainty or a failure prevents attribution, record inconclusive rather
than weaken bounds. Exact root/session names and commands are fixed at launch.

CPU ticks quantify execution time, not blocked duration, call stacks, GPU work
or scheduling cause. State is sampled, not a transition trace. Quiet CPU cannot
rule out lock, driver or compositor waiting. The A/A controls and fixed order
are noise/observer checks, not statistical causality or deployment acceptance.

## Progress

Phase1 implemented and locally tested. New sampling.mjs/proc.mjs parse bounded
stat records, retain identities, sample single-flight and stop permanently after
failure. Task CPU comes from /proc/PID/task/TID/stat, not the aggregate PID stat.
Process stat is used only for identity. Timestamp ranges preserve read latency;
no midpoint, scheduler-wait value, utilization percentage or scanout claim.

Laptop metadata at2026-10-08T00:38:25.156Z: kernel7.0.0-38-generic,
Node24.18.0, CLK_TCK100, sched_schedstats0. No kernel setting changed.
The nonzero ownSchedstat text does not override the disabled-setting evidence.
Scheduler wait remains null. The counter interpretation follows the
[Linux stat manual](https://man7.org/linux/man-pages/man5/proc_pid_stat.5.html);
it divides utime/stime ticks by CLK_TCK, not CPU frequency.

Phase2 PASS on the local owned Node test process. Its main thread accumulated
positive CPU ticks during180ms of explicit work, with unchanged process stamp.
No unrelated processes or browser were sampled. The test command exited0.
This validates procfs parsing locally, not laptop/browser thread discovery.

Phase3 composition implemented and tested; runtime gates subsequently passed as
recorded in the completion section below.
New capture.mjs wraps the unchanged capturePrepared/captureStartup functions.
Both arms keep preparation inactive and share ten existing RPCs in the fake
integration ledger. Every one of ten RPC and twelve write failure points was
exercised for both arms. No per-sample RPC, public mark or browser source edit.
The existing playback request receives controller send/receive brackets. The
clock mapper rejects offsets wider than100ms, negative widths and invalid order.
That bound is an attribution gate, not an observed transport latency.

Initial local gate:38tests PASS (24new and14sealed preparation tests),0fail,
0.30s under strict unhandled rejection mode. Red/green logs retain the late-reply
mutation and partial-evidence-on-stop-failure regressions. Initial missing-module
failures were scaffolding only. The original cancellation-race test let abort
win before the read error; it was corrected to deliver the error first through
an injected timeout wrapper. Do not describe that original test as bug proof.

## Completion

Phase3 PASS before launch: pinned deployed-base ChromeUtils and Linux TimeStamp
sources plus official Node v24.18.0/libuv sources establish the clock-rate
contract, with separate process origins. Node source version is not an
independent binary attestation. The source proofs, exact generated adapter
inverses, 49 runtime syntax checks, 167 import edges and 53-file manifest are
retained. Review adds identity, clock, coverage, missed-slot and no-profile
guards. Driver verifies Node v24.18.0 and CLK_TCK=100 before browser creation.

Phase4 completed exactly once in the prospective A/B/B/A order on the laptop.
All runtime, export, review, process-cleanup and postflight gates passed. Drops
were 24/0/0/0 over 1200 frames each. Both sampled runs have 102 observations,
zero missed slots and no pending read at stop; clock uncertainty23.704/18.540ms.
No rough sampled interval was captured, so no stall localization or causal
sampler benefit follows. The final smooth untreated control also prevents a
necessity claim. No replacement capture or sequence is authorized by this plan.

Offline analysis excludes intervals that could straddle playback boundaries,
retains quantized CPU rather than waiting estimates, and exactly replays saved
results. Final combined gate53PASS/0fail includes sealed preparation/variability
regressions and four new analysis tests. Thirteen manual JS files pass format;
generated adapters remain byte-exact. All96priorsealed files and53currentruntime
inputs verify unchanged. Report:
`bot-docs/reports/performance/2026-10-07-startup-thread-sampling.md`.

Preserved limitations: one metadata export invocation initially omitted the
argv placeholder and failed before reading; corrected export only, no browser
rerun. New analysis RED was missing-module scaffolding, not a browser bug.
The initial prepared38test receipt is retained and superseded, not overwritten.

No desktop/Pi action, product/default/system-driver/kernel/index change, raw
profile parsing or delegation. The broad optimization objective remains
unfinished; the owner's seeking/black-flash recovery remains distinct and
unreproduced. Next work requires a new source/evidence-backed falsifier rather
than another identical observation loop.
