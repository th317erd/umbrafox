# Persistent instrumentation contract

## Design

Retain reusable profiling code and tests in the source tree. Prefer upstream
Profiler sampling, counters, flow IDs and existing UmbraLink diagnostics before
adding a mechanism. Do not add web-visible globals, WebIDL, DOM/CSS flags,
headers or page diagnostic events. Internal markers are not web APIs, but their
cost and captured data still require review.

### Debugging-only exposure register

Owner clarification, 2026-09-26: custom, detectable public JavaScript interfaces
are forbidden in the product. A temporary debugging-only surface may be used
only within an explicitly documented diagnostic scope. Prefer private native
and authenticated UmbraLink paths; a hidden preference or a chrome-only label
does not prove that content cannot observe an interface.

Before adding any temporary public surface, register its exact global/property,
prototype, event or binding, catalog ID, purpose, affected realms, build and
runtime guards, cleanup owner and removal/review gate here. Add a concise
`DEBUGGING ONLY` comment at the exposure site pointing to that entry. Test both
that the intended diagnostic build can use it and that ordinary product builds
cannot observe it, including disabled mode and relevant frames/workers. Keep
timing/observer effects separate from interface-exposure tests. Such an exception
is not permission to ship the surface or weaken unrelated correctness gates.

| Entry | State | Exposure / follow-up |
| --- | --- | --- |
| Performance foundation, 2026-09-26 | No public browser interface added | Fixture-authored standard User Timing marks only; existing private UmbraLink transport |
| PERF-010 canvas-provider proposal | Unimplemented, no exposure authorized | Requires a private native existing-context bridge and content-exposure tests; never use `getContext` as discovery |

No temporary public debugging interfaces were added by this program wave.

Use three explicitly tested levels:

| Level | Content | Cost and release contract |
| --- | --- | --- |
| Existing coarse profiling | Sampling, established Gecko markers, on-demand UmbraLink snapshots | Reuse existing build gates; measure inactive/active overhead instead of assuming zero |
| Bounded diagnostic markers | Missing stage durations, dimensions, counts, opaque run-local joins | Early enable check, fixed caps and reported truncation; all costly new probes require release compile-time exclusion even when bounded |
| Detailed experiment traces | Sampling operands, per-resource history, expensive stacks/pixel/driver data | Release compile-time exclusion required before accepting new probes; verify absence of state/hooks/payload construction, not just a false pref |

This is a contract and migration target, not a claim the current detailed WR
prototype has already been compiled out. Its sampling module, hooks and state
currently remain in the build. Do not remove upstream counters used by actual
engine decisions merely because they also feed diagnostics.

P2 must first name one opt-in configure switch and trace its C++ define/Cargo
feature propagation through Gecko and Wrench, including feature unification.
Optimized diagnostic builds must be possible independently of DEBUG. Enumerate
imports, fields, initialization, helper definitions, call-site argument evaluation
and dependencies under the gate; do not gate actual rendering behavior with it.
The packaged browser's effective feature graph and code, not just a standalone
feature-OFF unit test, establish release exclusion.

## Required probe specification

Before implementing a new probe, record its catalog ID, precise producer and
consumer, clock/units, emitting process/thread, begin/end/error/cancel paths,
ownership and lifetime, correlation key, payload schema/version, maximum events
and bytes, truncation/missing semantics, and known observer effect. Include
disabled, empty, malformed, reentrant, overflow and shutdown tests. New diagnostic
controls are internal and default OFF. Explicitly test inactive, paused, filtered
threads, start/stop during a span and side-effecting argument factories, so a
disabled marker cannot hide expensive argument evaluation. No resource handle
may outlive its owner merely to keep diagnostic history.

Join semantics must distinguish candidate selection, batch creation, submitted
draw, driver completion and actual presentation. A source-sized texture match is
only a candidate, not a proven canvas-to-display join. Batch counts are not frame
counts. Copying final scissor/viewport state requires the state actually emitted
to GL, not an earlier task rectangle.

Never block a hot path waiting for a diagnostic reader; no extra GL queries,
fence waits or synchronous IPC solely to make a marker complete. Report missing
data honestly. Keep ring buffers bounded and prefer summary counters over
per-node/string snapshots. Process-local identifiers must not become web-visible.

## Current first-line surfaces

- `umbrafox.gfx.snapshot`: adapters, feature log, failures, target frame rate and
  window layer manager. These are not per-canvas backing proof.
- `umbrafox.media.snapshot`: media counters, decoder-related diagnostics and
  process summaries. Take matching beginning/end identities and intervals.
- `umbrafox.performance.snapshot`: process CPU/memory and profiler state.
  Sample on demand or at low rate; absent fields are not zero work.
- `umbrafox.performance.profile.dump`: dump an already active profiler. It does
  not start/stop profiling; isolated runs can use startup profiler settings.
- `UmbrafoxDiagnostics`: bounded navigation recent/slow event lists, but listener
  counts are gated by `umbrafox.control.enabled`. Enabling mid-session is not a
  reconstruction of earlier listener state, and unique-key maps need lifetime
  review independent of the bounded arrays.
- Existing Gecko task, style, reflow, display-list, WR transaction, GC/CC and JIT
  marker families. Inspect exact producer semantics before interpreting names.

Detailed inventories and limitations are maintained in the audit reports and
catalog. Probe names must not be used as substitutes for checked source paths.

## Current WR experimental marker meanings

- `WR RGB promotion`: candidate/rejection records; requires profiling and
  `gfx.webrender.debug.surface-promotion-logging`, capped candidates per update.
- `WR RGB no-rect-AA`: actual experimental shader batch selection while
  profiling; independent of promotion logging. Neither a candidate count nor a
  hardware-completion timestamp.
- `WR picture target` / `WR promotion counters`: CPU target spans/geometry and
  per-rendered-frame promotion/tile aggregates with logging/profiling, bounded
  per frame. Candidate update IDs and Renderer frames are different units.
- `WR sampling operands`: bounded one-shot detailed trace with explicit missing
  values and supported-path limits. Current source is experimental, not a general
  all-resource sampler or exact physical Pi operand observation.

The opacity enable preference and logging preference both default false in
source. Before use, verify effective prefs, actual markers and backend; do not
infer selection from the pref alone.

## Release and privacy verification

1. Build matched release-stripped and diagnostic artifacts when a new compile
   gate is implemented; inspect symbol/string/disassembly and object dependencies
   for all new state and hooks, plus link-time behavior.
2. Compare the stripped artifact to its equivalent baseline, then diagnostic
   compiled-but-off, then active. Correctness identical; costs reported separately.
3. Enforce bounded allocation/event volume and make drops/truncation visible.
4. Cover private browsing, workers, containers, extensions and absent control
   service where touched. Do not upload traces by default.
5. Keep commands, fixtures and parsers in-tree so instrumentation is reusable
   after upstream merges. Re-run the units/meaning audit on producer changes.
