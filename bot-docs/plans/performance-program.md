# Umbrafox performance program

Status: active; P0 foundation verified, P1 cache controls reproduced, P2 probe
exclusion in implementation (not yet compiled or package-verified).
Started 2026-09-26. Initial local smoke attribution is not a completed P1 matrix.

## Objective and authority

Build a reusable, evidence-driven process for finding and fixing browser costs,
starting with graphics, painting, DOM/layout, JavaScript, and Umbrafox hooks.
The owner explicitly requested extensive local tests, periodic physical Pi
validation, retained profiling code, and coordinated sub-agents. At most **two
source copies total** are permitted. Read-only lanes share the original checkout;
do not duplicate object directories merely to parallelize investigation.

"Mathematical perfection" means defined correctness oracles, explicit units,
error bounds, reproducible inputs, and falsifiable performance claims. It does
not mean claiming universal optimality or that a finite test proves absence of
all timing fingerprints. Performance is observable; preserving API shapes alone
does not prove parity. No blanket waiver of the mandatory modification rules is
inferred from permission to bend rules when necessary.

The existing opacity prototype remains source-default OFF. On 2026-09-26 l8ros
reported that Wyatt selected ON for the normal Pi browser, logging OFF, BuildID
`20260926103749`; this is not a fresh device check by this agent. That separately
authorized opt-in is a research configuration, not release acceptance. Retain
every recorded pixel failure and the distinction between benefit and correctness.

## Operating documents

- [Program index](../docs/performance/README.md)
- [Measurement contract](../docs/performance/measurement-contract.md)
- [Instrumentation contract](../docs/performance/instrumentation.md)
- [Issue catalog and ordered work](../docs/performance/catalog.md)
- [Initial audit](../reports/performance/2026-09-26-audit.md)
- Local tooling: `tools/umbrafox/performance/`

This program extends existing Firefox Profiler, UmbraLink, Raptor, Talos,
MozPerftest, AWSY, and Gecko tests. It is not a replacement profiler or a second
browser control protocol. Operational Markdown stays outside Sphinx, matching
the conversion guide. Large profiles, dumps and screenshots stay in owner-local
scratch; retain concise summaries, manifests and reproducible commands in Git.

## Territory and ownership

| Lane | Producer through consumer | First proof | Owner |
| --- | --- | --- | --- |
| Graphics/media | Decode -> image/DMABUF -> canvas provider -> WR task/tile -> GL submit -> driver wait -> compositor -> presentation | Paired actual pixels, readback, frame-counter deltas and per-stage timing | Graphics agent, reviewed by Umbrafox coordinator |
| DOM/painting | Task/event -> mutation -> style -> layout -> display list -> WR transaction | Deterministic DOM geometry plus joined marker intervals | DOM agent |
| JavaScript | Fetch/cache -> parse/stencil -> baseline/optimizing JIT -> GC/CC -> task scheduling | Correctness suites and separate unprofiled versus attribution runs | JS agent |
| Custom hooks | Registry -> actor -> native observer -> handler -> page resumption | No-script, unrelated-origin, matching/no-handler and active-handler controls | Umbrafox coordinator |
| Pi integration | Browser -> Wayland compositor -> DRM/KMS/display, decoder and CPU policy | Physical paired trials, owner-state restoration | l8ros coordinator only |
| Tooling/evidence | Owned fixture -> isolated browser -> private diagnostics -> immutable evidence -> catalog | Negative tests, real process lifecycle and local browser run | Harness agent, independent parent review |

Secondary territory is not omitted: network/DNS/TLS/cache, storage/IndexedDB,
startup/session restore, IPC/task queues, memory/retention, extensions/chrome,
audio, accessibility, fonts, workers/worklets and energy are inventoried and
scheduled in the catalog. No claim that an unprofiled subsystem is healthy.

## Stages and executable gates

### P0: Reproducible foundation

Dependencies: current dirty-work inventory, rules read, protected evidence and
separate ownership. Do not rebuild or merge upstream merely for a baseline.

1. Freeze identities for each run: binary, libxul, fixture, configuration and
   measured backend. A source HEAD alone is insufficient for this dirty tree.
2. Land the local harness, failure-path tests, contracts and first source audit.
3. Run independent unprofiled A/A smoke captures, then a separately labeled
   attribution capture on this host. Preserve raw values, correctness results,
   logs and cleanup status. Headless is not a Pi or desktop GPU performance gate.
4. Analyze the profile through `profiler-cli`, using a private named session.
5. Review catalog entries against actual producer and consumer code. Mark
   hypotheses and missing measurements; do not relabel them as fixes.

Gate: harness unit/lifecycle tests and real end-to-end capture pass; every raw
result has a named oracle and limits. Each negative infrastructure test must
fail visibly. Catalog links and conversion recipe survive independent review.
Revert unit: only the new harness/docs, not pre-existing renderer modifications.

### P1: Establish controlled baselines and attribution

Depends on P0. Prioritize PERF-001 through PERF-008 and the PERF-011 existing
presentation-feedback/clock audit alongside the Pi copy/synchronization lane.

1. Local desktop native backend: blank/static/dynamic canvas, video alone,
   cached canvas and repeated video copy, matched resolution and refresh rate.
2. DOM batch/read-interleave, retained versus full display lists, animation,
   iframe navigation/churn. Verify geometry and event ordering first.
3. JS parse/cache/JIT and GC stress with browser-thread coverage appropriate to
   actual helper-pool configuration; separate shell and browser results.
4. Userland control matrix and long-lived isolated soak, especially unrelated
   origins, observer lifetime, request suspension, and memory-growth slopes.
5. Ask l8ros to run a small matched physical matrix after local gates. Never
   assume its current process is disposable or overwrite its chosen state.

Gate: unprofiled repeated A/A noise measured, then either a bottleneck attributed
to a specific stage with an independent observation for P3, or an explicit bounded
measurement gap for P2. An unresolved gap is not a root-cause result. Write the
next falsification before a patch. Use retained fixtures/current artifacts and
existing markers for first attribution; do not wait for a new probe/build gate.
The initial short harness cannot establish tail-latency or long-run stability.

### P2: Add only missing probes, permanently and safely

Depends on a named P1 measurement gap, not on curiosity. Each probe gets an ID,
producer/consumer map, units, lifecycle, payload budget, cap/drop reporting,
compile-time/runtime gates, tests, and an owner. Reuse existing marker types
where they encode the required truth; do not put object addresses into web APIs.

Before a native probe patch, specify one opt-in configure switch, its C++ define
and Cargo propagation/owning files, production default, and effective packaged
feature graph (including feature unification). Gate all costly new probe state,
imports, call-site arguments and dependencies, not only marker writes. This
design is required for P2 implementation, not already implemented by this plan.

First candidates: per-copy media/readback stages, cross-process frame joins,
custom-hook no-handler overhead and bounded controller/observer counts. Detailed
sampling diagnostics currently in the dirty prototype need a release-build
exclusion design; a false runtime preference is not proof of compile-out.

Gate: instrumented-off versus stripped-release code inspection and paired cost
measurements; marker-on effects quantified; full payload absence in stripped
artifact verified. No claim of zero overhead from a simple `if` statement.
Revert unit: one independently useful probe family and its tests/docs.

### P3: Fix one measured cause at a time

Depends on P1 attribution and P2 only where the missing information is essential.

1. Write the failing test and expected performance effect, including an
   alternative explanation that would falsify the diagnosis.
2. Implement the narrowest change. Buffer reuse is a candidate only after
   allocation/lifetime evidence; no fence removal, cache semantics shortcut or
   unproven graphics rounding substitution.
3. Test functional and exact-pixel parity, adjacent negative paths and lifecycle.
4. Run unprofiled randomized/alternating pairs plus reversal, then a separate
   attribution capture. Test both x86_64 and physical ARM64 for relevant changes.
5. Test upstream Firefox equivalence for any web-visible effect. Document a
   specific requested exception before changing that acceptance contract.

Gate: correctness PASS, no unexplained adjacent regression, measured benefit
outside predeclared noise/effect thresholds, repeatability and cleanup PASS.
An improvement with pixel FAIL remains experimental, never "fixed".
Revert unit: one bottleneck repair. Commit coherent verified units; installation,
default enable and publication retain their separate authorization/gates.

### P1 overnight continuation: 2026-09-27

The owner requested continued overnight work. Use existing binaries, one source
checkout, fresh isolated profiles, bounded commands and the new
`perf-night-20260927` coordination wave. Do not attach to the personal browser or
run Pi work outside l8ros ownership. Source and release defaults remain unchanged.

First controlled userland experiment: repeated same-origin classic-script loads
under four fresh-process configurations: no records, disabled record for A,
enabled record for A while visiting only B, and enabled record after an observed
execution on A followed by B. A and B are owned loopback origins. Registry file
contents and control readiness are not publication acknowledgments. Use existing
ScriptLoader logs to verify the consumed active/cache path for actual fixture
requests. An unrelated-origin canary does not prove publication before startup.

This first run is diagnostic-only with identical logging configuration across
cells, not a performance score. Require exact execution checksums and ordered
load completion, stable target source/URL within each process, complete bounded
logs, owned cleanup, and positive baseline cache-hit evidence before claiming
cache suppression. Missing log coverage or baseline hits is an explicit gap.
The visited-A control demonstrates execution history, not per-channel observer
invocation counts; do not attribute its timing difference solely to HTTP IPC.
No forced cache preferences, native probes, public browser interfaces, or live
registry mutation are part of this experiment. Each capture has a 180-second
deadline and fresh evidence directory; infrastructure failures retain evidence.

In parallel, map browser presentation feedback and clocks read-only. A later
isolated lifecycle run requires its own resource and cleanup gates, initial
smoke verification and separated observer windows before a multi-hour run.

### P2 implementation contract: retained WR probe exclusion

The reviewed `night-probe-gate` design advances PERF-001 under the owner's
performance-program authorization. Add opt-in `--enable-umbra-perf-probes`,
`MOZ_UMBRA_PERF_PROBES` configure/define outputs, and explicit Cargo forwarding
through gkrust-shared, bindings, WebRender and Wrench. Default remains OFF.
Gate the seven custom WR marker families and their state, helpers, accessors,
imports and entire argument expressions. Retain the sampling implementation and
tests in source. A custom-only marker-eligibility predicate must avoid building
payloads when only samples are enabled, without changing upstream predicates.

The producer-to-consumer boundary is configure -> Cargo -> native probe sites ->
existing private profiler sink. No public API, GL call, synchronization, new
collector, rendering change or dependency is permitted. Opacity/modulation,
shader selection, defaults, upstream counters and existing pixel failures are
outside this change. Preserve a before-edit diff/hash manifest of dirty native
files; this migration must remain separable from the experimental renderer work.

First gate: failing-first source/feature contract and disabled-work tests,
focused parser/state regressions, independent diff review, then compile checks
of the real owning crates in both feature modes. Source checks alone do not
prove compilation or release stripping. Native browser builds, packaging,
installation, Pi work and default enable remain subsequent reviewed gates, not
automatic consequences of this patch. Final acceptance requires effective
Cargo/compiler feature evidence, generated ABI comparison, packaged code/state
exclusion and matched runtime correctness/observer-cost tests.

### P4: Regression and long-lived operation

Depends on P0; expands concurrently as each fix lands. Add each incident to a
permanent fixture family. Run inexpensive checks per patch, broader native
desktop runs per rendering/DOM/JS milestone, physical Pi checks for ARM/GPU/media
changes, and scheduled 12-24 hour isolated soak for the reported degradation.
Do not run heavy benchmarks alongside builds or other profiling lanes.

On upstream sync: re-map changed marker producers, units, cache gates, helper
threads and backend behavior; rerun the smallest incident suite plus the changed
subsystem's parity/performance matrix before claiming preservation.

## Completion criteria and reporting

The overall program is ongoing, not a single "all performance fixed" task.
Close individual catalog items only with baseline, patch identity, strict
correctness result, repeated improvement evidence, overhead review, physical
coverage where relevant and conversion recipe. Every checkpoint records:
completed work, failing gates, not-run tests, current device ownership, artifacts,
next bounded experiment and resource cleanup. Never silently relax an oracle.
