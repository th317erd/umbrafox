# Performance issue catalog

Updated 2026-09-27. This is an executable investigation backlog, not a list of
proven defects or permission to bypass correctness. Evidence provenance and
initial checks: [audit](../../reports/performance/2026-09-26-audit.md).

Priority orders investigation, not automatic implementation. **P0** protects
evidence/correctness; **P1** addresses measured pain or a strong custom-code lead;
**P2** expands attribution/coverage; **P3** is a later system survey.

| ID | Priority | Area | Current status | Next owner |
| --- | --- | --- | --- | --- |
| PERF-001 | P0 | Diagnostic overhead and release exclusion | Coverage gap, source confirmed | Umbrafox graphics/tooling |
| PERF-002 | P1 | Dynamic translucent canvas intermediates | Measured benefit, exact pixels FAIL | Umbrafox graphics + l8ros |
| PERF-003 | P1 | Remaining live video copy stalls | Measured symptom, stage attribution missing | Browser liaison + l8ros |
| PERF-004 | P1 | Global userland script-cache bypass | Local reuse loss observed, cost unmeasured | Umbrafox hooks/JS |
| PERF-005 | P1 | No-handler request round trips | Source-confirmed mechanism, magnitude unmeasured | Umbrafox hooks/network |
| PERF-006 | P1 | Long-session freezes and retained state | Historical incident; current cause unknown | Memory/hooks |
| PERF-007 | P1 | Forced layout and mutation batching | Local control attributed; engine defect unproven | DOM/layout |
| PERF-008 | P1 | Profiler/JIT observer effects | Source-confirmed measurement hazard | JS/tooling |
| PERF-009 | P2 | Invalidation and retained display lists | Unmeasured hypothesis | DOM/painting |
| PERF-010 | P2 | Upload/backing transitions | Partial historical evidence | Graphics/canvas |
| PERF-011 | P1 | Driver, swap and physical presentation | Browser boundary mapped; cross-stack join missing | Graphics + l8ros |
| PERF-012 | P2 | Parse/JIT/GC cost decomposition | Unmeasured workload coverage | JS |
| PERF-013 | P2 | Input/OOP-frame scheduling | Join/coverage gap | DOM/IPC |
| PERF-014 | P2 | CPU policy and frame deadlines | Confounded Pi benefit lead | l8ros |
| PERF-015 | P3 | SWIOTLB/import warnings | Caller and impact unknown | l8ros/platform |
| PERF-016 | P3 | Full-system coverage | Not yet surveyed by workload | Coordinator |

## PERF-001: Diagnostic overhead and release exclusion

Current WR detailed sampling module/state/hooks are runtime gated, not excluded
by a dedicated release build gate. Some existing Servo/RDL counters also run
outside marker collection; they must not be blindly removed. No material cost
has been measured. Sources: renderer `sampling.rs`, `mod.rs`, `shade.rs`,
`init.rs`, profiler/style/RDL producers in the initial audit.

Next: use existing markers for attribution now; separately specify the smallest
compile-time exclusion for detailed new diagnostics. Compare stripped baseline,
compiled-but-OFF and ON with fixed rendering behavior. Acceptance: verified
binary/state exclusion, unchanged correctness, bounded records and paired cost
evidence. Do not require a new instrumentation framework before every experiment.

## PERF-002: Dynamic translucent canvas intermediates

Pi cached drops OFF/ON/OFF: 49.286/2.522/48.794%; ON repeats 3.516/2.536%.
All ON cached runs missed their original adjacent-plain timing gate. Four
physical pixel cases fail with 81,305-758,464 changed pixels, maximum channel
delta 2/255. Source readback and repeated/reversal captures are exact. The
prototype is not a deployable parity fix despite its large benefit.

Next: retain the same frozen fixture family and actual promotion/shader/target
markers; keep source default OFF. Investigate only a specific causal repair with
an exact oracle. Acceptance: exact full-frame/readback parity, exclusions and
fallbacks, all original timing gates, both architectures and measured backend.
Owner-selected live opt-in does not change this acceptance criterion.

## PERF-003: Remaining live video copy stalls

ON live-copy drops 8.562%, cached 2.522% in the same original trial; different
backings/workloads mean their difference is not a measured readback duration.
The current sized remote path still includes a thread handoff, synchronous media
IPC, shmem allocation, GL conversion/readback, return and canvas use/upload.

Next: liaison traces exact provider and per-copy stages for l8ros, followed by
one bounded existing-marker/profile comparison at actual achieved cadence.
Measure fallback/backing and dimensions, not preferences alone. Only if a stage
cannot be separated add a minimal bounded probe. Pool/reuse buffers only after
allocation cost and fence/lifetime ownership justify it; do not drop fences.
Acceptance: improve the attributed stage while preserving crop, color, alpha,
orientation, odd sizes, filters, failure fallback and resource reclamation.

## PERF-004: Global userland script-cache bypass

`publishUserlandScripts` sets `umbrafox.userlandScripts.active` for any enabled
script. `ScriptLoader::StartLoadInternal`, `TryUseCache` and `CalculateCacheFlag`
use that global flag to fetch source and bypass document ScriptLoader stencil/
bytecode caching without consulting per-origin userland matching. This is a
verified mechanism, not a measured slowdown.
Source mutation legitimately requires correct cache invalidation; removing the
guard outright would be unsafe.

The [local diagnostic control](../../reports/performance/2026-09-27-userland-cache.md)
observed one cold lookup/eight memory hits with no records or a disabled record,
versus nine active bypasses with an enabled script on an unvisited origin. All
three fetched the target once and produced exact execution checksums. Timing
magnitude remains unmeasured. A repaired fixture-only completion sentinel also
passes the visited-origin control with nine bypasses; repeated current-fixture
controls agree. Earlier setup failures remain preserved, and their privileged
request-options boundary is not claimed repaired in browser code.

Do not describe this as bypassing the HTTP cache or all JIT/module caches. The
globally active document-start actor also queries the parent and blocks parsing
before learning whether an origin matches; measure that confounder separately.

Next: identical warm script loads with no scripts, disabled script, enabled script
on another origin, matching script without a source handler, and active source
handler. Record parse/compile/cache outcomes and request equality. Falsifier:
no excess parse/compile or end-to-end cost in unrelated-origin controls.
Acceptance for a repair: recover unaffected cache behavior without stale source,
skipped handlers, cache poisoning, SRI/CSP changes or startup-order regression.

## PERF-005: No-handler request round trips

`UmbrafoxUserlandParent` installs the parent HTTP observer after finding matching
document scripts. The process-global observer remains registered and dispatches
eligible channels via `dispatchParentRequestEvent`: suspend, serialize request
fields, actor query, decision and resume. The child later checks for a controller
and request handlers. Global activation therefore needs a no-handler cost study.

Next: serial and parallel local resource loads before activation, after one
matching no-op script, on unrelated documents, after removing handlers, and after
closing the activating page. Distinguish fresh-none from previously-activated-
then-disabled: publishing an empty registry does not unregister this observer.
Capture send/resume counts and latency, including
actor destruction, redirect and cancellation. Acceptance: a proven no-handler
fast path with unchanged ordering and request semantics; no synthetic network
"improvement" by dropping requests. Runtime magnitude remains unknown.

## PERF-006: Long-session freezes and retained state

The owner's 2026-09-22 crash followed about 41,912 seconds uptime and reported JS
OOM, critical module-load failure and prior graphics resets. That combination
does not identify a leak or prove graphics caused the terminal module failure.
Custom controller maps contain WeakRef values but numeric context keys; cleanup
is lookup-driven. Diagnostic arrays are bounded, but unique-key maps and enabled
history need separate accounting. These are inspection leads, not proven causes.

Next: isolated document/iframe open-close and handler registration churn; compare
no-userland, matching and unrelated-origin cases. Measure repeated settled live
object/map/key counts and memory slope, then a 12-24 hour soak. Collect low-rate
process/GC/CC/pressure data and short triggered profiles. Include intentional
retention/BFCache controls. Acceptance: reproduce and eliminate the causal growth
or stall with lifecycle tests, not merely restart the browser or force GC often.

## PERF-007: Forced layout and mutation batching

Source maps mutation notifications -> dirty style -> refresh/flush -> reflow ->
display list. The local fixture compares batched and interleaved geometry reads;
that demonstrates a workload contrast, not an engine defect.

The first verified local survey has equal final geometry, OFF medians 4/4 ms
batched versus 36/39 ms interleaved. Separate profile-ON evidence shows 4 versus
640 synchronous reflows in each of seven trials, with the same Styles/flush
counts. This validates the instrumented control; it does not justify changing
synchronous layout semantics or establish a production optimization.

Next: verify equal final geometry and observer order, then use `Styles`,
`Reflow (sync)`, flush and task markers to count actual work. Add detached,
read-only, fragment and observer-induced mutation controls. Acceptance: identify
unnecessary work inside the browser before changing scheduling; retain flush
semantics and mutation/resize callback order. A website anti-pattern is not a
license to violate its synchronous API contract.

## PERF-008: Profiler/JIT observer effects

Profiler start/stop can release JIT code. `IONPERF` can change interpreter
trampolines and IC frame pointers. Off-thread compilation spans include enqueue
and main-thread completion, not solely helper CPU. Default browser external
helper tasks use TaskController; a missing `JS Helper` thread alone proves nothing.

Next: establish separate unprofiled timing and stable profiled attribution runs,
record effective features/environment/threads and warm each state independently.
Acceptance: no mixed profiled/unprofiled score claims, no cold-JIT effect labeled
steady-state cost, and explicit helper coverage. Strict shell benchmark mode is
not a substitute for recording environment-derived instrumentation.

## PERF-009: Invalidation and retained display lists

Hypothesis: a small edit causes broad traversal, retained-DL fallback or excess
picture damage. Existing Styles counts, RDL reasons/counts and WR targets should
be used first. Compare paint-only changes, geometry changes, ancestry/selectors,
stacking, clipping, scrolling and no-change controls with fixed inputs.

Next: attribute actual fallback and area to time; reject the hypothesis if work
is instead downstream GPU/presentation. Acceptance: exact reftests and geometry,
no lost invalidation, and smaller measured work on representative inputs.

## PERF-010: Upload/backing transitions

Historical CanvasRenderer work can exist without WR texture-cache upload markers.
Provider demotion, CPU raster, shared buffers, imports and uploads need distinct
accounting. Upload counters labeled GPU copy may measure CPU submission only.

Current UmbraLink has no provider accessor or privileged evaluation tunnel.
`getContext` is not a read-only workaround: it can mutate/create the context.
The [provider-gap proposal](../../reports/performance/2026-09-26-provider-gap.md)
requires a private native existing-context bridge; it is not implemented.
Even `GetDebugInfo(false)` may report unknown when no target is borrowed.
Hidden/visible comparisons without backing evidence cannot isolate presentation.
Any temporary public debugging exception must be recorded in the
[exposure register](instrumentation.md#debugging-only-exposure-register), commented
at its source site and absent from product builds; none is added here.

Next: record actual backing changes and calls/bytes per producer over warmup and
steady state, with copy/import paths and context-loss recovery. Acceptance:
complete enough accounting to falsify upload domination; only then optimize a
measured stage. Preserve context-loss, resource reuse and image generation rules.

## PERF-011: Driver, swap and physical presentation

Historical kernel traces implicate Renderer backlog, but are not per-pass proof.
`RenderCompositorEGL` inherits a no-op `WaitForGPU`; generic `wr.gpu_wait_time`
does not cover all Pi waits. CPU target submission is not GPU completion; media
frame counters are not physical scanout timing.

Next: join existing task/pipeline/submit identities to OS-owned fence and Wayland
presentation evidence with clock uncertainty and incomplete records retained.
Add only missing lock/swap boundaries if needed. Acceptance: a demonstrated
critical path, no overlapping-engine double count, no added waits for profiling.

Owner-shared [frame-pacing lead](../../reports/performance/2026-09-26-frame-pacing-lead.md)
raises the existing-feedback source audit alongside PERF-003: map browser ->
nested Cage -> outer Cage/wlroots -> DRM, distinguishing frame callbacks and
predictions, buffer readiness/commit, and realized presentation. Verify installed
versions, feedback propagation, clock conversions and join identities first.
Separate fractional-rate/cadence effects from late frames and actual media drops.
This is a hypothesis, not a Cage defect or authority to change scheduling,
compositors, buffering or browser APIs. No fixed-step video workaround.

The [browser source audit](../../reports/performance/2026-09-27-presentation-boundary.md)
separates callback-derived predictions, CPU image-composite feedback and physical
presentation. No direct presentation-refresh consumer was found in Gecko's
callback clock fallback. Actual Mesa/GDK negotiation and cross-stack identities
remain unresolved; no scheduling fix is established.

## PERF-012: Parse, JIT, GC and CC decomposition

Unmeasured candidates: cold parsing/stencil cache, tier warmup and invalidation,
polymorphism/deoptimization, off-thread queue latency, allocation/nursery pressure,
major GC/CC tails. Preserve JIT counters that feed optimization itself.

Next: controlled checksummed JS cases plus Speedometer browser integration;
reproduce short allocation/lifetime stress and then long-lived cycles. Separate
JS shell from DOM/browser findings. Acceptance: correct outputs and existing
jit-test/jsreftest/GC correctness coverage, independent helper/GC attribution,
repeated unprofiled gains and AArch64 validation for code-generation changes.

## PERF-013: Input and out-of-process frame scheduling

`DOMEvent` latency measures dispatch delay, not presentation. Task IDs, inner
window IDs, WR epochs/transactions and vsync IDs are different namespaces. Existing
LongTask WPT failures do not justify exposing a new web API for instrumentation.

Next: local same/cross-origin frame controls, actual process IDs, task/microtask
stress, trusted test input through UmbraLink and an observable paint. Preserve
missing/no-paint endpoints and teardown races. Acceptance: separate queue,
handler, layout, submit and present latency without invented joins.

## PERF-014: Pi CPU policy and deadlines

l8ros observed sequential live 720p60 drops 20.45/14.37/22.52% for ondemand /
performance / ondemand at approximately 54 C. Original governor restored. Video
content differed between windows; this is not a fixed-content causal proof.

Next: l8ros-owned fixed local 60 fps paired/reversal test with frequency residency,
queue latency, clocks and power/thermal controls. Acceptance: repeatable benefit
with adequate thermal/power margin and no hidden backend/content change. Browser
source must not silently change host policy. Keep separate from 1080p30 results.

Later l8ros reversal reported cached 2.205% under the restored original policy,
versus performance 4.505% and schedutil 3.080%; it does not support a persistent
tuning win. The same coordinator's standard/minimal sampler control found no
consistent penalty. Keep the raw trial provenance separate and investigate
copy/synchronization deadlines before tuning policy again.

## PERF-015: Import/SWIOTLB warnings

Warnings occurred before installation and in both experimental states. Their
rate is not a frame or byte count and does not identify the 230,400-byte readback
as the caller of a 2 MiB mapping failure.

Next: exact importer/exporter, size, failed path and fallback timing correlation
only if existing evidence makes it relevant. Acceptance: demonstrate an impact
before pooling, kernel tuning or driver changes. No unrelated platform sweep.

## PERF-016: Remaining coverage roadmap

These lanes are **not yet measured**, not presumed clean. Reuse existing harnesses
and avoid introducing a second test framework per subsystem.

| Area | First controlled workload | Existing observation family | Correctness guard |
| --- | --- | --- | --- |
| Network/DNS/TLS/cache | Local cold/warm resource waterfall, redirects, streaming, stalls | Necko, socket/process profiles, HTTP timing | Methods, headers, CORS, cache and service-worker order |
| Storage | IndexedDB/Cache API transaction and quota lifecycle | Storage/IO markers, filesystem and memory snapshots | Durability, cancellation, origin/private isolation |
| Startup/restore | Fixed tabs/extensions, cold/warm starts and resume | Startup markers, task/IO profiles | Restored state, startup actions, no skipped work |
| IPC/task scheduling | Small messages, contention, actor destruction | Flows/Runnable/IPC markers | Ordering, cancellation, bounds and teardown |
| Extensions/chrome | Navigation listeners and repeated toolbar/popup usage | Existing navigation diagnostics, parent profile | Extension behavior, popup keyboard regression |
| Audio/media | Fixed codec/resolution/fps and audio continuity | Decoder, media queues and underrun evidence | Synchronization, sample/pixel parity and no lost frames |
| Fonts/accessibility | Text/layout and accessible-tree churn | Layout/font/platform samples | Shaping, geometry, accessibility semantics |
| Workers/worklets | Message/compile/task and shutdown churn | Worker/helper profiles and IPC flows | Scheduling, API equivalence, termination |
| Memory/energy | Settled repeat cycles, idle, background and wake | AWSY, memory reporters, CPU/PSI/power | Lifecycle, throttling, functional state |

## Item closing checklist

For each repair record: baseline identities and failure, exact hypothesis and
falsifier, code/test paths, raw results, correctness and performance gates,
instrumentation overhead, local/Pi coverage, failure/cleanup results, reviewer,
conversion recipe and remaining limitations. A catalog row changes to **fixed**
only after those gates, not after implementing a plausible patch.
