# Umbrafox performance program

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Status: active; P0 foundation verified, P1 cache controls reproduced, P2 probe
exclusion passes real WebRender/bindings OFF checks; ON and package gates remain.
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
sampling diagnostics in the dirty prototype now have an opt-in build-gate patch
under verification; a false runtime preference is not proof of compile-out.

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

Bounded verification adjustment: root Cargo excludes the WR and bindings crates
from workspace feature selection. Their OFF checks pass. The actual smallest
member enabling this feature is `gkrust-shared`; its selected graph resolves
the intended bindings/WR feature edge, but brings a broad Rust dependency
closure. Permit one parent-owned offline/locked `cargo check` of that member,
two jobs and 300 seconds, with existing generated inputs and a scratch target.
Stop at a missing generated input, compile error or deadline; preserve the log.
No export/bootstrap, dependency/lock changes, full browser build, package or
installation follows automatically. Do not run browser measurements concurrently.

The first shared ON check stopped in `nss_sys` before WR/bindings compilation.
Independent producer/consumer review found the direct invocation omitted the
normal `rust.mk` export `MOZ_TOPOBJDIR`; its presence selects existing Gecko NSS
link metadata rather than standalone `NSS_DIR`. Permit one continuation with
only that process-local variable set to the existing x86 object directory,
the same target and 300-second/two-job/offline/locked limits, and a new log.
Preserve the first STOP. Require fresh NSS script output and actual target cfg
evidence; stop at the next failure without installing or regenerating inputs.

That continuation passed the NSS selector and stopped at the style generator's
missing `toml` import. Metadata review identified the existing configured build
venv as normal `PYTHON3`; a bounded parent import check resolves toml, Mako and
MarkupSafe to this checkout's vendored modules. Permit one further parent check
with that exact `PYTHON3`, also setting `PYTHONDONTWRITEBYTECODE=1` to avoid source
bytecode-cache writes. Preserve both STOPs, same target/limits and new log; no
module installation, source repair or further retry follows from a failure.

That check stopped at the normal restricted bootstrap prerequisite. The
subsequent whole-environment audit found additional native-tool/flag differences;
do not continue by setting one more guessed variable. Further checks are held
until a bounded normal-environment manifest is reviewed. This does not block
existing-binary fixture work or source-only investigations.

### P4: Regression and long-lived operation

#### Initial lifecycle smoke gate

Implement only the reviewed short portion of the `night-lifecycle-design`
proposal using the existing local runner. Three independent fresh-profile
cells are `none`, `unrelated`, and `matching-no-handler`. Each performs two
warmup cycles and two batches of five cycles, with two sequential same-origin
iframes per top document. Three inert settled checkpoints each wait ten seconds
before serialized private diagnostics. Include initial and settled documents
in exact activation accounting. The unrelated cell is only
`configured-unrelated`: its disk store is not proof of consumed active state.

Keep the existing ownership, private-profile, log, bus, deadline and cleanup
machinery. Add one suite adapter, not another launcher. Smoke has a maximum
120-second aggregate budget with cleanup reserve; longer plans remain rejected
until this gate is reviewed. No profiler, forced GC, memory minimization, cache
overrides, public browser APIs or personal-profile access. Page-owned test
sentinels are explicit userland fixture customization, never browser defaults.

Before runtime, require failing-first protocol/order/checksum/activation tests,
checkpoint serialization and abort tests, owned-process resource-cap tests and
cleanup-failure tests. Revalidate process identities around resource reads;
never infer ownership from executable names or treat unknown memory as zero.
Keep Linux ProcInfo memory estimates, parent-local reporters and summed RSS
safety accounting separate. Refuse low host memory/disk headroom; cap owned
RSS, processes, FDs, threads and evidence. Controller overhead remains separate.

Run the none smoke first after independent review, then the other cells only
after clean cleanup and usable evidence. Preserve failures without retries
until diagnosed. No slope, native-map ownership or long-session-fix claim comes
from these smoke runs. Any 30-minute or two-hour extension needs another
bounded contract and reviewed smoke evidence. Rendering builds and timed
browser work must not overlap.

The corrected short matrix passes its functional oracles, but observed startup
Privacy Notice tabs invalidate isolated memory comparison. Before extending
duration, apply only lifecycle test-profile welcome-page settings from the
existing Firefox performance profile and verify actual before/checkpoint/after
tabs and document windows using available snapshots. Reject foreign, unexpected
or missing document coverage; do not infer isolation from preferences. Preserve
the prior captures and keep basic/cache suite configuration unchanged.

The welcome settings alone were insufficient: preserve the new startup STOP.
The separate reporting-policy producer is guarded by
`datareporting.policy.dataSubmissionEnabled=false`, now set only in disposable
lifecycle profiles. It also denies policy upload eligibility; do not use a
notification/consent bypass or claim that it blocks all network/TOU behavior.
Three fresh corrected captures pass functional and sampled admission checks.
Require independent saved-data review before extending duration; selection at
smoke checkpoint 1 and after remains explicitly unobserved.

#### Bounded NONE soak extension

Start gate: accept the independent saved-data review of
`lifecycle-isolated-none-2`, `lifecycle-isolated-unrelated-1`, and
`lifecycle-isolated-matching-1`. Preserve the earlier timer/admission failures
and contaminated functional captures. This extension is test tooling only,
not a browser repair, product preference change or native build authorization.
Implementation and its first real execution are separate parent decisions.

Add only enumerated `soak-30m`, restricted to `none` and profiler OFF in the
existing launcher. No duration/trial/warmup overrides, observer selector, 2h
mode, second framework or second browser. Smoke/basic/cache contracts remain
unchanged. Reuse positive startup admission and its existing 30-second shared
deadline, 100-ms polling and 300-attempt cap; no second readiness loop.

One immutable, trusted plan descriptor must drive CLI validation, fixture
generation/result validation, URL admission, checkpoint capture and evidence
limits. Payload metadata must match it, not supply new authority. The schedule
is two warmup cycles then ten batches of ten, with two sequential frames per
cycle: 102 cycles, 318 documents, 204 frame loads/removals, 624 receipts, 942
ordered steps and eleven checkpoints. Checkpoint `i` has `2 + 10*i` completed
cycles and `8 + 31*i` documents. Minimum holds are 60 seconds at checkpoint 0,
120 seconds at 1 through 9, and 300 seconds at 10. Keep the existing page source,
checksums, frame-removal, startup-null and exact completion oracles.

The aggregate deadline is exactly 1800000 ms, including the existing 15-second
cleanup reserve and final two-second report reserve. The 1440000 ms of mandatory
quiet time cannot be shortened. At each phase admission require enough remaining
work time for all owed holds plus 150000 ms of finalization work. Keep narrower
per-operation limits, abort propagation and internally bounded owned SIGTERM;
never race a detached signal-producing cleanup task or use SIGKILL.

At all eleven held checkpoints collect one serialized performance/diagnostics
pair; add after diagnostics for this plan only. The minimum snapshot sequence has
28 RPCs including one accepted setup diagnostics call. Actual snapshots total
`27 + setup attempts`, equivalently `28 + additionalSetupRPCs`; do not count
the accepted setup reply twice. Discovery/connection work is separate. No active-
burst or quiet-period browser RPC. Save raw replies before validation. Require
exactly one current HTTP document and the same selected tab/context at every
soak boundary; retain existing explicit internal-background classifications.
No retired/completed-document allowance is approved. Unknown, foreign, duplicate
or missing coverage fails; never close a contaminating tab and resume.

Keep five-second passive OS safety sampling single-flight. Skip and count missed
slots rather than replaying bursts. For this plan cap resource records at 384
and historical PID identities at 512; stop rather than evict identity evidence.
Keep existing RSS/process/FD/thread, host-memory/disk, 8192-entry traversal and
256 MiB total artifact/profile caps. The corrected NONE smoke's sampled maximum
is 205942562 bytes; its margin is not a guarantee against ordinary cache growth.
No cache clearing, forced GC, cache preference changes or cap increases.

Bound retained fixture state at 318 documents, 942 steps, 640 receipts, 1280
request entries and eleven released checkpoints, while passing totals remain
exactly 624 receipts. Admit at most 318 asset requests. Preserve 16 KiB request
bodies, four active requests, eight connections, loopback/Origin/Host checks,
idempotent simultaneous server shutdown and held-request cancellation.

Keep 54 MiB ordinary evidence, 8 MiB logs and independent 2 MiB terminal space.
Prove post-scrub UTF-8 pretty JSON bounds for success and failure, including
escaping, numeric width and multibyte errors. The constrained fixture projection
must fit 887347 bytes: per nested receipt/request/checkpoint/document/step caps
573/285/285/165/89 bytes at the retained counts, plus a 16384-byte envelope.
Bound error text at 2 KiB with an explicit clipping flag; required observations
must not be truncated to pass. The terminal fixture limit stays 1.5 MiB.
Enforce ordinary categories: 384 resource files at 64 KiB, eleven checkpoint
bundles at 1 MiB, eleven attribution files at 64 KiB, one baseline at 64 KiB,
and all other ordinary files together at 12 MiB. Total maximum 47.75 MiB stays
below the ordinary reserve. On overflow, preserve bounded terminal failure.

Ownership: `js` owns `lifecycle.mjs` and its existing spec, including the trusted
descriptor; `local-harness` owns `helpers.mjs`, `run.mjs`,
`lifecycle-capture.mjs` and their existing specs. Parent owns documentation and
runtime. Reconcile descriptor/API shapes before edits; no cross-owner formatting.
Require failing-first fixed-schedule and byte-bound tests, all eleven synthetic
handshakes, malformed/stale/duplicate transitions, early-wake and final-hold
abort tests, budget/history/category limits, startup contamination, exact RPC
order and cleanup failures. Preserve every smoke/basic/cache regression. Unit
tests use fake clocks, not real minute-long waits; commands remain bounded.
Freeze hashes, run the full Node tooling suite and exact-file registered lint,
then independent review before parent integration acceptance.

Only after those gates, authorize one fresh NONE capture with the existing
binary, private output and no overlapping build/browser/profiler workload:
`--suite lifecycle --lifecycle-case none --lifecycle-plan soak-30m --profile off`
plus normal absolute binary/output/bus arguments, with no timeout override.
Review cleanup, coverage, source/binary/pref provenance and censored observations
before separately authorizing an identical A/A repetition. Any STOP is retained
and diagnosed. Repeated-read observer controls and userland soak cells remain
deferred; do not expose an unimplemented selector. A/A alone cannot establish
zero observer overhead, heap ownership, a memory leak or a long-session fix.

Depends on P0; expands concurrently as each fix lands. Add each incident to a
permanent fixture family. Run inexpensive checks per patch, broader native
desktop runs per rendering/DOM/JS milestone, physical Pi checks for ARM/GPU/media
changes, and scheduled 12-24 hour isolated soak for the reported degradation.
Do not run heavy benchmarks alongside builds or other profiling lanes.

On upstream sync: re-map changed marker producers, units, cache gates, helper
threads and backend behavior; rerun the smallest incident suite plus the changed
subsystem's parity/performance matrix before claiming preservation.

## Completion criteria and reporting

### Harness application-data containment correction

The first fixed NONE soak passes its functional and sampled safety gates, but
its log reveals crash-reporter Glean upload attempts. Source review maps startup
maintenance to `UAppData/Crash Reports`, independently of the explicit profile.
Previously queued data is possible; no shared queue or payload was inspected.
All further browser execution is stopped pending this correction and its gates.
Do not bypass TLS, change consent in a shared store, inspect personal queues,
or treat failed sends as proof no other transmission occurred.

For every local harness suite, force child-only `MOZ_APP_DATA` and
`MOZ_LOCAL_APP_DATA` to separate fresh private directories under the canonical
owned output root. These existing Gecko overrides precede legacy/XDG lookup.
Leave HOME, product defaults and browser interfaces unchanged; do not copy or
read existing application data. Reject missing/relative/aliased or preexisting
roots and invalid ownership/type/permissions before spawn. Record exact intended
roots and their creation evidence with the effective child environment. Include
the new directories in the existing artifact accounting, without cap increases.

`local-harness` owns only `helpers.mjs`, `run.mjs` and `test/harness-spec.mjs`
for this correction; all other source stays frozen. Require failing-first tests
for every suite and profiler mode, inherited override replacement, missing/invalid
paths, existing files/directories/symlinks, partial creation/write failures and
abort before launch. Preserve cleanup authority and the established fixture,
clock, observer and result contracts. A creation or provenance failure must not
fall back to ambient application data. Unit tests may use owned temporary files
and harmless mocks, not a browser or shared application directories.

Freeze and review the exact diff, rerun combined tooling tests and exact-file
lint. Separately establish a supported runtime observation of the native data
root before resuming browser captures; environment strings alone are not that
proof. Keep any diagnostic execution bounded and within fresh owned roots.
The correction prevents the named shared-queue path when verified; it is not a
general network sandbox or proof every library uses only those directories.
No new preference, crash-handler disable, native patch, public API or automatic
longer rerun is authorized by this correction.

The overall program is ongoing, not a single "all performance fixed" task.
Close individual catalog items only with baseline, patch identity, strict
correctness result, repeated improvement evidence, overhead review, physical
coverage where relevant and conversion recipe. Every checkpoint records:
completed work, failing gates, not-run tests, current device ownership, artifacts,
next bounded experiment and resource cleanup. Never silently relax an oracle.
