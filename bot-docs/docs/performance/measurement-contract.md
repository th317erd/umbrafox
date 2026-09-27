# Measurement contract

## Identity and isolation

Every run records source HEAD and dirty/untracked provenance separately from
executable and libxul SHA256/ELF IDs, application BuildID, fixture hash, arguments,
effective preferences, OS/kernel, architecture, drivers, backend, window size,
DPR, display/refresh configuration and profiler settings. Unknown is `null` or
explicitly unavailable, never an inferred default. A preference is not proof of
the canvas backing, decoder, adapter, shader or physical presentation path.

Use a newly created private output/profile directory. Refuse to reuse it. Bind
fixtures and UmbraLink to loopback, avoid logging tokens, and scrub/record the
narrow environment relevant to the experiment. In particular record the presence
or absence of `LP_PERF`, `LP_DEBUG`, `GALLIVM_PERF`, `GALLIVM_DEBUG`, profiler and
shader-cache overrides; old captures lacking this record remain uncertain.

Use real child-process `spawn` with explicit process ownership, immediately
handled completion/error, deadlines and a cleanup proof. Never infer process
group ownership from `execFile` options or send a signal to an inherited utility
group. Do not kill unrelated browser, X server, profiler or Node processes.
Abort work on the wave's HALT bus and retain a STOP manifest/log. An absent result,
crash, timeout, malformed payload or cleanup failure cannot become a PASS.

## Separate three kinds of run

1. **Correctness:** deterministic pixels/readback, geometry, event order, API
   results, cache/network semantics and lifecycle. Compare against a known
   reference. Repeat the reference first. Default oracle is exact equality;
   tolerances require an explicit, justified, documented contract change.
2. **Timing:** profiling/logging/screenshots off, fixed warmup and steady-state
   intervals, controlled input, no concurrent build/other benchmark. Preserve
   raw samples, outliers and stopped runs. Capture matched A/A before A/B.
3. **Attribution:** profiler/markers enabled, bounded data volume and selected
   threads. Use these runs to locate work, not as unprofiled performance scores.
   The profiler itself can alter JIT compilation and allocation/timing.

Screen capture, `getImageData`, memory minimization, debug logging and GPU timer
queries can perturb work or force synchronization. Declare each intervention.
Capture correctness separately from sustained timing; do not assume a screenshot
is the same operation as physical compositor output.

Record the complete observer schedule, including control RPCs, process samplers,
bus polling, fixture marks and endpoint reads. "Profiler OFF" does not mean
uninstrumented. Compare standard versus minimal observation with matched paired
windows when instrumentation could change the result. Keep snapshots outside
timed work where possible and retain RPC durations; a midpoint process/media
query can interrupt the very thread being measured. Endpoint reads also have
cost and uncertainty. The initial local smoke runner polls its owner bus every
200 ms and emits standard fixture marks; its seven short trials are not a
zero-observer-overhead baseline.

## Quantities and equations

- Frame budget: `1000 / targetFPS` ms, for example 16.6667 at 60 Hz and 33.3333
  at 30 Hz. Refresh, source frame rate and callback cadence are distinct.
- Dropped fraction: `(droppedEnd - droppedStart) / (totalEnd - totalStart)`.
  Reject nonpositive denominators, resets, source changes and PID/element identity
  changes. Media drop counters do not by themselves measure HDMI presentation.
- CPU cores occupied: `deltaCpuNanoseconds / deltaWallNanoseconds`; percent is
  this value times 100. More than 100% is valid for multiple threads. Report
  per-process identities; child exit/replacement can invalidate aggregate deltas.
- Throughput: completed validated work divided by the matched measured interval.
- Retention: live bytes/objects/FDs after identical workload and quiescence,
  plus growth slope across cycles. RSS alone is not a leak proof.
- Latency: specify enqueue, start, end, submission, driver completion and actual
  presentation clocks. Report clock origin/uncertainty and queue versus execution
  duration. Never sum overlapping asynchronous spans as serial critical-path time.
- Distribution: retain all values, trial count, median and explicit quantile
  method. Seven trials cannot substantiate a robust p99 claim. For important
  decisions use independent process/session repetitions and confidence intervals
  with the run, not individual correlated frames, as the sampling unit.

Before a repair, predeclare workload-specific benefit and nonregression margins,
repetition count and stop conditions. Do not choose thresholds after seeing the
result. An interval overlapping the noise envelope is inconclusive. Benchmark
goals are zero correctness differences and minimizing deadline misses/energy;
neither "faster on average" nor a benchmark composite alone is sufficient.

## Falsification and controls

Prefer one variable per experiment, fresh A/A then interleaved or randomized
A/B pairs and an A restoration. Include negative controls (static/opaque/non-
eligible content), no-op instrumentation controls and cache/warmup distinctions.
Keep thermal state, CPU governor, clocking, resolution, display mode, compositor,
codec, content hashes and resource contention stable and recorded. Stop on device
reset, infrastructure drift, failed identity or mismatched fixture/path. Preserve
FAIL and STOP instead of repeatedly retrying until a preferred result appears.

For profiling, inspect actual recorded processes/threads and retained intervals;
ring-buffer wrap or truncation can lose startup or marker joins. Use
`profiler-cli` with a named owned session. Raw sample counts are not precise CPU
duration, active-only percentages are not wall-time fractions, and a wait symbol
is not proof of the party responsible for the wait. Unknown joins stay unknown.

## Local and Pi cadence

- Per harness change: pure validation, protocol and lifecycle negative tests,
  then an isolated real local browser smoke run.
- Per engine repair: relevant native tests plus local paired correctness/timing
  on the actual targeted backend. Headless is an additional control only.
- Per ARM/media/graphics milestone: l8ros-owned physical paired run and reversal,
  temperature/throttling/clock evidence, actual backing/driver markers, and
  restoration to the owner's selected configuration (not an assumed OFF state).
- Per retention/long-run repair: short churn reproducer plus 12-24 hour soak,
  bounded periodic snapshots and trigger-based profiles. Never poll expensively
  at frame cadence or log all network bodies/source strings.

Independent review recomputes metrics from saved raw data and checks artifact
identity. A product default change requires full release gates; a successful
owner-selected experimental configuration is not that approval.
