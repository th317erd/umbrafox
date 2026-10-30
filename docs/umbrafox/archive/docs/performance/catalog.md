# Performance issue catalog

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Updated 2026-09-27. This is an executable investigation backlog, not a list of
proven defects or permission to bypass correctness. Evidence provenance and
initial checks: [audit](../../reports/performance/2026-09-26-audit.md).

Priority orders investigation, not automatic implementation. **P0** protects
evidence/correctness; **P1** addresses measured pain or a strong custom-code lead;
**P2** expands attribution/coverage; **P3** is a later system survey.

| ID | Priority | Area | Current status | Next owner |
| --- | --- | --- | --- | --- |
| PERF-001 | P0 | Diagnostic overhead and release exclusion | Compile-gate patch under verification | Umbrafox graphics/tooling |
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

Installed WR detailed sampling module/state/hooks are runtime gated, not excluded
by a dedicated release build gate. The 2026-09-27 source patch adds opt-in
configure/Cargo gates and whole-expression exclusion; package, ABI and paired
runtime checks remain pending. Some existing Servo/RDL counters also run
outside marker collection; they must not be blindly removed. No material cost
has been measured. Sources: renderer `sampling.rs`, `mod.rs`, `shade.rs`,
`init.rs`, profiler/style/RDL producers in the initial audit.

The [native verification checkpoint](../../reports/performance/2026-09-27-probe-exclusion.md)
passes real WebRender and Gecko bindings checks with probes OFF, including fresh
profiler bindings generation. The selected-member ON check first stopped in NSS;
reviewed normal-environment corrections passed NSS and the style Python import,
then stopped at `mozglue-static`'s unstable allocator-hook feature on the stable
compiler, before reaching WR/bindings. Review identified the normal restricted
bootstrap allowlist but also native compiler/flags and target differences.
Further ad hoc retries are held pending a complete bounded environment contract;
pure ON tests and resolved metadata do not replace that gate.

Next: use existing markers for attribution now; verify both real-crate feature
modes and the generated/exported boundary. Compare stripped baseline,
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

The later OS-owned eighteen-minute mixed-workload soak reports 0.497% plain,
3.746% cached and 8.394% live-copy drops, with optimization ON. This confirms a
remaining workload symptom over that interval, not the duration of a readback
stage or a matched optimization gain. Its observer and restoration limits are
recorded in the [presentation follow-up](../../reports/performance/2026-09-27-presentation-boundary.md).

The [retained-profile review](../../reports/performance/2026-09-27-pi-renderer-spans.md)
now includes an independently verified 71.135646 ms CLI clock-offset correction.
Historical logging-ON notifier medians remain 9.003 ms plain and 18.634 ms cached,
but boundary membership changes. Canvas has 289 contained intervals plus one
crossing interval; count agreement is not raw-pair proof. The capture lacks
live-copy mode, stack/IPC/media coverage and initial media counters. Missing
incomplete-edge and Composite pair provenance prevent strict stage partitioning.
These CLI-derived distributions cannot identify the first late stage or the
cost of the later logging-OFF soak.

Next: liaison traces exact provider and per-copy stages for l8ros, followed by
one bounded existing-marker/profile comparison at actual achieved cadence.
Measure fallback/backing and dimensions, not preferences alone. Only if a stage
cannot be separated add a minimal bounded probe. Pool/reuse buffers only after
allocation cost and fence/lifetime ownership justify it; do not drop fences.
Acceptance: improve the attributed stage while preserving crop, color, alpha,
orientation, odd sizes, filters, failure fallback and resource reclamation.

October 3 desktop follow-up: a provisional per-image, first-size CPU readback
cache (at most 1 MiB actual stride times height) now passes native reuse,
size/frame separation, failure, concurrency and lifetime tests. The uncached
implementation first failed seven of nine new tests. The corrected native run
passes all 18 cache/adjacent tests and 100 shuffled cache-suite repetitions.
Actual GPU pixel parity and performance remain unverified; no deployment or
YouTube stutter fix is claimed. This targets repeated copies of the same image,
not the Pi fixture's single copy per new frame. Evidence and limits are in the
[desktop follow-up](../../reports/performance/2026-10-02-desktop-resumption.md).
The subsequent [headless pixel check](../../reports/performance/2026-10-03-headless-readback.md)
matches the pre-cache build in 18 frame/drawing cases. Both use software decoding
and software WebRender; this is not GPU routing or performance acceptance.
The same report now records the decoder/image/texture ownership review: source
supports per-image lifetime, including the strong-reference recycling barrier
and separately owned readback shared memory. The retained payload cap is per
live image, not global; first-copy-per-new-frame workloads avoid no readback.
Actual GPU branch, changing-frame parity and resource behavior remain gates.
One subsequently authorized headed desktop run completed in 14.96 seconds with
NVIDIA WebRender and a true native decoder hardware flag. Repeated pixels are
self-consistent, but all 18 cases differ from the headless baseline. Backend
differences prevent attributing this to the cache. Same-headed-baseline parity
and cache-path evidence remain required; the one-window consent is consumed.

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

The [authority audit](../../reports/performance/2026-09-27-request-authority.md)
finds no authoritative pre-IPC absence predicate. A null decision can follow
real handler side effects; live capabilities survive registry disable, and the
weak controller lookup is context-bound rather than document-bound. Do not
optimize by caching null or checking the active pref. Measure split dispositions
and exact document identity before proposing a narrow fast path.

Next: serial and parallel local resource loads before activation, after one
matching no-op script, on unrelated documents, after removing handlers, and after
closing the activating page. Distinguish fresh-none from previously-activated-
then-disabled: publishing an empty registry does not unregister this observer.
Capture send/resume counts and latency, including
actor destruction, redirect and cancellation. Acceptance: a proven no-handler
fast path with unchanged ordering and request semantics; no synthetic network
"improvement" by dropping requests. Runtime magnitude remains unknown.

October 3 independent reduction: the parent no longer constructs and sends a
duplicate `originalHeaders` object that the child always replaces. The ordered
entries and final frozen userland snapshot are unchanged. One object-building
and freeze call are removed per intercepted request; there is no handler-skip,
latency or video-improvement claim. Nine request tests, 353 combined Node tests
and 63 actual Gecko assertions pass. The uninstalled
[header-copy change](../../reports/performance/2026-10-03-request-header-copy.md)
preserves the existing controller-finalizer patch and all larger authority gates.

## PERF-006: Long-session freezes and retained state

The owner's 2026-09-22 crash followed about 41,912 seconds uptime and reported JS
OOM, critical module-load failure and prior graphics resets. That combination
does not identify a leak or prove graphics caused the terminal module failure.
Custom controller maps contain WeakRef values but numeric context keys; cleanup
is lookup-driven. Diagnostic arrays are bounded, but unique-key maps and enabled
history need separate accounting. These are inspection leads, not proven causes.

The [October 3 controller cleanup](../../reports/performance/2026-10-03-controller-retention.md)
reproduces 16384 dead weak-reference entries after their 4096 controllers are
collected in a Node source fixture. An uninstalled finalization-based correction
clears those entries without a new context lookup and preserves live replacement
identity. Seventeen focused tests, 330 combined tooling tests and 59 existing
Gecko assertions pass. Real-document map/heap accounting, retained-byte benefit
and any relationship to video stutter remain unproved; no periodic GC added.

The [isolated lifecycle checkpoint](../../reports/performance/2026-09-27-lifecycle.md)
adds exact document/frame/startup oracles and bounded resource/cleanup controls.
Its first real smoke stops on a harness quiet-timer gate with clean cleanup.
The corrected three-cell matrix passes exact document/frame/startup accounting,
but snapshots expose an external first-run Privacy Notice tab. Thus functional
smoke success is not isolated memory evidence. Test-profile startup controls and
observed document admission are the next gate, before any longer run.
The new admission guard rejects a fresh run before workload release: its two
welcome settings do not suppress the second startup tab in this artifact.
That failure remains preserved. Source review identifies the separate reporting
policy notice; one lifecycle-only internal reporting preference disables that
route without a consent bypass. Fresh none/unrelated/matching captures now pass
strict sampled admission and cleanup, with the same 40-document oracles and
known internal background windows reported separately. Independent saved-data
review accepts the short gates before a bounded longer plan. No memory slope or
whole-network isolation is established, and no product default changes.

The first bounded NONE extension completes 102 cycles and 318 documents in
1451.616 seconds, with eleven quiet checkpoints and 302 passing resource samples.
Independent review accepts only those functional, discrete-admission and sampled
safety results. Background crash-ping upload attempts expose a separate shared
application-data risk; all browser execution is held for owned-root containment
and native path verification. No A/A repeat or leak conclusion is accepted.
See the lifecycle report's application-data containment section for the observed
log, source-supported queue path and uncertainty about payload origin/delivery.

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

October 3 inactive-hook follow-up: the native mutation gate now uses an
always-updated mirror of the existing userland-active preference. In the bounded
native survey, explicit-false gate cost fell from 36.65 to 1.71 ns and minimal
text update cost from 78.80 to 44.94 ns. Three native processes, 59 adjacent
browser assertions and extracted-package activation checks pass. The candidate
is uninstalled; the native survey alone establishes no page or video gain. See the
[mutation-gate report](../../reports/performance/2026-10-03-mutation-gate.md)
for default-entry effects, measurement limits and source/evidence provenance.

The [page DOM follow-up](../../reports/performance/2026-10-03-page-dom-workload.md)
adds eight fixed page-principal sandbox workloads and passes 560 actual browser samples plus
the shared readback regression. The combined tooling suite is 313/313. Balanced
timing remained incomplete because unrelated host compilation repeatedly
blocked admission; no page speedup or layout/JS benefit is accepted. Preserve
the partial batches and collect a new fixed sequence during a quiet host window.

Two further batches remain incomplete: `ERFBeO` passed four processes before a
temporary-profile directory disappeared during artifact enumeration; `wwqtOi`
passed three after the [bounded rescan fix](../../reports/performance/2026-10-03-artifact-rescan.md)
but hit renewed compilation admission. The correction passes 342 tooling tests,
including real directory-rename recovery, without changing browser binaries or
caps. The additional 560 valid samples are not pooled into a speedup claim.

Owner-authorized wyatt-laptop comparison now completes A B B A A B B A with
640 valid samples, four fresh processes per build. Median process medians are
lower for detached/attached text (14.3%/15.4%), attributes (5.5%) and child lists
(10.9%). The JS control median is 10.1% slower; its process ranges overlap.
Layout/observer differences are not accepted as gains. All 48 resource samples
pass caps, native roots join and eight owned roots are absent on the laptop.
The [page report](../../reports/performance/2026-10-03-page-dom-workload.md)
retains all results, provenance and 237 hash-verified evidence exports. This is
a bounded synthetic DOM finding, not significance, general browser speedup,
YouTube attribution or permission to install either package.

Reversed-order laptop replication also completes: another640samples/8processes,
with text16.3%/18.1%, attributes7.7% and childlists11.8% lower. For each targeted
DOM case every candidate process median is below every baseline process median
across both batches. The JS control changes direction to8.9% faster, weakening
the earlier regression inference without establishing a JIT gain. Both batches
remain separately reported; no layout/video claim. All16owned browser roots and
both controllers are absent;96resource samples pass caps. Work browser unchanged.

Later source/symbol review corrects the execution-realm description: these
collectors run in UmbraLink's sandbox, not the Window realm. The observed A/B
differences remain harness-specific. The separate
[window-realm correction](../../reports/performance/2026-10-03-window-dom-workload.md)
now passes 364 tooling tests and one real semantic gate, followed by two balanced
unprofiled laptop batches (1280 samples, 16 fresh processes). Detached text is
21.5%/27.6% lower, attached text 16.4%/16.9%, attributes 6.0%/6.3% and child lists
7.9%/17.0%. Batched layout is 17.9%/9.8% higher, an unresolved regression signal;
JavaScript and observer controls change direction. No pooling with the sandbox
fixture or general layout/video gain. The next gate investigates that layout
signal; candidates remain uninstalled and the work browser untouched.

The [isolated-layout follow-up](../../reports/performance/2026-10-03-isolated-layout.md)
uses 12 fixed warmups and 16 trials of the unchanged layout loop alone. Two
balanced laptop batches pass 448 samples and sampled-safety/cleanup checks;
candidate process medians are 3.3% higher and equal, respectively. The larger
mixed-workload penalty does not reproduce in this experiment, but cause and
equivalence are unproved. One adapter-signature failure was preserved and fixed
with a failing regression; final tooling371PASS/lint0. Next is attribution in
the actual page-owned mixed workload, not the legacy sandbox profile.

## PERF-008: Profiler/JIT observer effects

The [October 3 profile follow-up](../../reports/performance/2026-10-03-dom-profile.md)
adds a fixed 512-MiB allowance only for explicit headless attribution, leaving
ordinary/soak caps at 256 MiB. Tooling360PASS/lint0. Second runtime completed
5passes/400checks and native stop but failed its separate24MiB export-copy cap.
One existing119MB owned dump was preserved offline; the run remains failed.
Four complete same-document phases validate; pass0 lacks its start marker.
Unresolved addresses account for90.8-92.3% of self samples, so native attribution
is held for local matching symbols. No profiled/unprofiled pooling or video claim.
The one offline CLI session stopped, exact PID/socket absent. This supersedes
the no-policy-change state of the first attempt below, not its saved result.

Subsequent local matching-symbol lookup reduced unresolved self samples to
4.4-4.9%, preserving all four interval/sample/category joins. Wrapper caller
paths plus the exact packaged sandbox source motivate the execution-realm
correction above. The two new offline CLI sessions and symbol server are stopped;
exact PIDs/sockets are absent. No new browser run, upload claim or engine change.

The separate October 3 candidate-only laptop profiling attempt stopped at the
unchanged 256-MiB artifact limit after one valid 80-sample pass. No raw profile
was dumped, so no stack attribution follows. Owned browser/controller absence
and clean SIGTERM are verified; explicit profiler-stop success is not. The
[saved failure](../../reports/performance/2026-10-03-page-dom-workload.md#separate-profiling-attempt)
retains 28 hash-verified evidence files and the later owned-directory size
inventory. Profiled timings are excluded from the unprofiled DOM comparisons.
No cap increase, background-service suppression or automatic retry followed.

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
remain unresolved; no scheduling fix is established. The OS owner's subsequent
official Mesa 26.0.8 source audit found no refresh-value scheduling consumer in
its ordinary DRI2 Wayland EGL caller/helper path. Installed binary equivalence
and other platforms remain unproved; frame/sync callback waits still matter.

## PERF-012: Parse, JIT, GC and CC decomposition

The October3 candidate-only DOM profile has four validated phase intervals.
GC/CC categories represent2.2-2.7% of active samples in this synthetic workload;
this is not a general GC-cost or tail-latency result. Local symbolication now
resolves most native samples; allocation data is absent and helper coverage is incomplete.
See the [profile report](../../reports/performance/2026-10-03-dom-profile.md).

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
