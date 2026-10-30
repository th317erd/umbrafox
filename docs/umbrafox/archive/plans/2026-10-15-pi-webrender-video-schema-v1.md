# Pi WebRender P1 schema v1

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Freeze and scope

This is the pre-implementation wire/semantic contract for the
[P1 attribution plan](2026-10-15-pi-webrender-video-probes.md), not implemented
code or permission to build/run. Exact base:
`c0e7f8a2be0460695c1f65ae8796b09c1082480c`. A probe-only source patch and this
document's SHA256 must accompany the diagnostic artifact. Schema changes require
a separately recorded version/freeze before implementation; never silently
reinterpret a saved v1 record. No optimization, rendering-order change, new
website interface, custom IPC, pixel access or diagnostic driver query belongs
in P1. Release excludes all new state, helpers, calls and argument evaluation.

Catalog scope is PERF-001/010/011. P1 classifies source routes and CPU wall time;
it does not measure GPU execution, physical presentation, all page assets as
video, or exact decoded-frame identity across processes.

## Envelope and encoding

Marker name is the fixed literal `Umbra WR video P1`, type `UmbraWRVideoP1`.
The custom JSON payload is exactly `{ "type": "UmbraWRVideoP1", "words": [...] }`
with32 unsigned32-bit integer words, always present. No optional keys, strings,
nulls, floating-point values or variable-length arrays. JSON whitespace shown
here is illustrative; the byte proof uses compact serialization. Native storage
is128 bytes plus fixed scope/bookkeeping fields, never a heap history of records.
All IDs/times larger than32 bits use explicit low/high halves, not lossy doubles.

The compact worst case, with every word4294967295, is387 bytes including the type
and words keys. Reserve512 payload bytes per admitted record, including the one
terminal record. Verify the actual native writer against that ceiling before
build acceptance. Upstream marker headers, names/string tables, schemas, samples,
stacks and JSON formatting are separate profiler overhead, not part of the
custom-payload ceiling. Do not describe8MiB as physical profile-file size.

The upstream process/thread identity and native marker timing accompany every
record. Never attach a stack or page/inner-window metadata just for this probe.
Only the numeric rendering window/pipeline/resource IDs specified below are
allowed. No URL, text, file descriptor, pointer, pixel, shader source, allocation
address or arbitrary error string may enter the new payload.

Reproduce the conservative encoding bound without a browser or compiler:

```sh
timeout 10s node -e 'const s = JSON.stringify({type:"UmbraWRVideoP1",words:Array(32).fill(4294967295)}); if (Buffer.byteLength(s) !== 387 || 16384 * 512 !== 8388608) process.exit(1);'
```

| Word | Meaning |
| --- | --- |
| 0 | Schema version, exactly1 |
| 1 | Kind1-8 from the table below |
| 2 | Process-local admission sequence1-16383;16384 reserved for terminal |
| 3 | Immediate enclosing admitted probe sequence, or0 if absent |
| 4 | Operation within kind;0 except where enumerated |
| 5 | Outcome enum |
| 6 | Common validity flags |
| 7 | Actual backend:0 unknown,1 EGL,2 OGL,3 SWGL,4 other explicitly observed |
| 8,9 | Start/end microseconds relative to this process's one-shot admission origin |
| 10,11 | Subject ID low/high words |
| 12,13 | Related ID low/high words |
| 14 | Validity mask for16 data words: bitN validates dataN; upper16 bits zero |
| 15 | Reserved, always0 |
| 16-31 | Kind-specific data0-15 below |

Outcome:0 unknown,1 success,2 failure,3 early return,4 unsupported route,
5 observed eligibility loss,6 time limit,7 record budget,8 invalid observation.
Unknown is not success. An unavailable return value stays unknown rather than
adding a new query to discover it. Common flag bits:0 start valid,1 end valid,
2 subject valid,3 related valid,4 enclosing scope was not admitted. Other bits
must be zero. Invalid fields are zero-filled and their validity bit is clear;
a valid zero duration/count is different from missing information.

Both halves of an ID/modifier/byte-count must have consistent validity. Reject
wrong-length arrays, nonintegers, out-of-range words, extra payload keys,
nonzero reserved slots and undefined enum/flag bits; do not coerce malformed data.

### Kind-specific data

All slots not named below are zero and invalid. Each count/dimension/duration is
checked before conversion. Invalid/oversized observations are rejected and
counted, never wrapped, truncated into a plausible value or passed to rendering.
Surface IDs are the existing UID, not buffer FD identity. Epoch is related-low
with related-high zero. Pipeline ID uses handle in subject-low and namespace in
subject-high. Every identifier must be verified as a logical ID, not an address
reinterpreted as an integer; otherwise leave it unknown.

| Kind | Subject; related | Data slots and operations |
| --- | --- | --- |
| 1 Renderer frame | Rendering window ID; unknown | d0 PreRender us; d1 BeginFrame us; d2 WR update us; d3 WR render us; d4 FlushPipelineInfo us; d5 readback us; d6 EndFrame us; d7 PostRender us; d8 screenshot-tail us; d9 NotifyDidRender dispatch us; d10 WaitForGPU call us; d11 pipeline-release tail us; d12 flags below; d13/d14 existing renderer frame ID low/high if actually available |
| 2 Decoder pool | Surface UID if produced; unknown | d0 copy-reason bits(policy1,pressure2); d1 copy requested bool; d2 copy result(0 unknown,1 not attempted,2 success,3 failure); d3 resulting route(0 unknown,1 move/import,2 GPU pool copy,3 software staging,4 failure); d4 width; d5 height; d6 existing DRM FourCC; d7 plane count; d8 move us; d9 copy-total us; d10 nested blit us; d11 nested CPU-staging us; d12 retained-surface count; d13 pool capacity |
| 3 Plane import | Surface UID; unknown | d0 route(0 unknown,1 cached,2 direct2D bind,3 NV12 copy fallback,4 P010/P016 copy fallback,5 failure,6 unsupported); d1 plane index; d2 width; d3 height; d4 DRM FourCC; d5/d6 modifier low/high; d7 capability-query us; d8 EGL import us; d9 direct-bind us; d10 copy-fallback us; d11 existing error domain(0 unknown,1 EGL,2 GL); d12 existing error code; d13 plane count |
| 4 External-image lock | External-image ID; surface UID when available | operation1 DMA-BUF,2 RawData buffer,3 other known host; d0 channel; d1 returned route(0 unknown,1 native DMA-BUF texture,2 RawData,3 SWGL,4 native Wayland composition,5 failure); d2 nested import-total us; d3 semaphore-call us; d4 width; d5 height; d6 plane count; d7 semaphore disposition(0 unknown,1 no semaphore,2 wait path entered) |
| 5 Compositor work | Pipeline ID; epoch when available | operation1 image selection/apply,2 resource-key update,3 pipeline release; d0 image-operation count; d1 resource-operation count; d2 release-operation count |
| 6 Present | Rendering window ID if known; unknown | operation1 EGL EndFrame,2 OGL EndFrame; d0 damage-setup us; d1 Wayland lock-acquisition us; d2 swap-call us; d3 Wayland lock-held us; d4 flags(swap entered1,Wayland surface present2,frame skipped4) |
| 7 Auxiliary transfer | Existing surface UID if known; unknown | operation1 CPU plane staging,2 GPU plane blit,3 CPU readback; d0 width; d1 height; d2 existing format enum/FourCC; d3 plane count; d4/d5 explicit byte count low/high if already known |
| 8 Terminal | Unknown; unknown | operation1 time,2 record budget,3 observed eligibility loss,4 invalid clock/schema; d0 admitted ordinary records; d1 completed records; d2 rejected admissions; d3 outstanding scopes; d4 invalid observations; d5 counter-saturation bool; d6 quiescent snapshot bool |

Renderer-frame d12 flags: render invoked1,EndFrame invoked2,WaitForGPU invoked4,
backend WaitForGPU known no-op8,readback invoked16. These are observed calls, not
GPU-completion/presentation successes. The actual EGL implementation inherits a
no-op WaitForGPU in the pinned source. Backend unknown stays unknown; do not
deduce EGL/OGL from X11/Wayland or a preference.

The renderer frame is one completion receipt with stage durations, not a record
for every stage. Plane import is likewise one receipt with its subdurations.
Kind1 uses the existing `Composite #WindowId` RAII boundary, not an enlarged
whole-function envelope; work before that boundary must remain separate.
This reduces event pressure without sampling away rejected/failed routes.
Still,16383 ordinary records may be consumed before20s; never promise20s of
complete observations. No per-plane/per-frame downsampling or silent cap reset.

## Timing, ownership and correlation

Use native monotonic `TimeStamp` intervals, not Date.now, IPC arrival time, GPU
timestamp queries or page clocks. Convert bounded relative elapsed time to
integer microseconds by flooring; retain existing native marker timing for
timeline placement. Start/end are valid only in0..20000000us and end>=start.
Never substitute a clipped deadline for an actual operation endpoint.

Ordinary complete operations use one Gecko interval marker with both endpoints.
If an operation ends after the limit or eligibility is lost, it is incomplete,
not a successful interval. Do not delay rendering or emit an invented endpoint.
Already-admitted completion may report an incomplete record only while the sink
is eligible and the20s window has not elapsed; otherwise its slot remains
missing. After expiry only the reserved terminal summary may be emitted, not an
ordinary completion payload. Terminal reporting is best-effort on an eligible
path when closure is first observed. This bounds measured intervals and checked
admissions, not real-time scheduling latency between a check and a profiler
buffer write. No timer thread or background task exists just to emit a terminal.

Relative payload clocks are process-local. Correlate ordinary payload durations
with that record's native interval, allowing microsecond rounding. Raw Gecko
profile timing and a CLI's zero-based timing must be normalized using checked
export metadata; do not add a guessed process/root offset. Process identity is
the capture manifest plus the profile's process metadata and coordinator's
owned-process incarnation receipt. PID alone is not a cross-run identity. Do not
combine records when that incarnation or clock join cannot be established.

Parent sequences join only synchronous nesting on the same process/thread.
Construction/destruction nesting needs bounded per-thread scope storage, depth32
maximum; exceeding it skips the diagnostic admission, not rendering. No cross-
thread scope transfer, wait for another emitter, retained surface/FFmpeg/GL
reference or resource-lifetime extension. Thread exit with pending records is
incomplete. A missing parent cannot be replaced by nearest-in-time matching.

External-image/channel can correlate local lock/import work only where the
producer actually carries it. Surface UID can be reused; descriptor PID0 in
the V4L2 route is not producer identity. No exact decoded-frame/decoder-generation
join is promised by v1. Seek/restart/format change may invalidate a capture's
workload comparability; retain separate before/after media identities.

All durations are CPU wall time, including blocking/scheduling. Nested blit,
import, semaphore, EndFrame, lock-held and swap durations overlap their enclosing
totals. Do not add nested durations as independent costs. A RawData lock is not
the later texture-cache upload duration; a YUV shader is not CPU conversion.

## Eligibility and resource state machine

Compile all new code/data out unless `MOZ_UMBRA_PERF_PROBES` is defined. Source
macros must suppress side-effecting argument evaluation in OFF builds. The
runtime check precedes record construction, IDs, counters and clock reads.
Use Gecko-specific current-thread marker eligibility, equivalent to pinned
`profiler_thread_is_being_profiled(ThreadProfilingFeatures::Markers)`, requiring
active/unpaused profiling and an included thread. The broader
`profiler_thread_is_being_profiled_for_markers()` also accepts ETW/Perfetto and
is not the admission contract. No external trace session is enabled by P1;
review configured sinks before accepting a private capture.

Per-process states: UNARMED -> ACTIVE -> CLOSED, never backwards. First eligible
admission atomically establishes the origin and20s deadline. Initial publication
must be bounded/nonblocking; contenders may skip with a reported diagnostic gap,
never spin until an initializer or consumer completes. Inactive/paused/filtered
calls before the first admission do not arm or mutate diagnostic state. After
arming, observed profiler inactive/paused state closes the one-shot; a filtered
thread by itself must not close other included threads' capture. A scope that
loses its own eligibility is incomplete. No claim about an unobserved profiler
stop/restart between calls. No restart/rearm command exists in v1.

Reserve one complete512-byte slot and a unique sequence before each operation;
reservations are never recycled. Maximum16383 ordinary reservations plus one
terminal reservation is16384*512=8388608 bytes. All kinds share one process
budget; there is no independent per-thread or per-marker allowance. Compound
admission is atomic and bounded. Counters saturate with a visible flag, not wrap.
Keep fixed scalar state and bounded nesting only; no large custom ring alongside
the existing profiler ring. No lock shared with a reader, extra synchronous IPC,
hot-path filesystem write or wait for export/analysis.

On count/time/invalid-clock closure stop new admissions, preserve actual rendering
and at most one terminal. In-flight scopes may drain their pre-reserved slots
under the timing/eligibility rules. Terminal may precede another thread's final
completion in buffer order; it is not a global memory barrier. Counter snapshots
are diagnostic summaries, not proof of atomic whole-process quiescence. Mark
quiescent only when the implementation proves it. Unknown/missing terminal,
outstanding scopes, saturated counters, overflow or lost records forbid a claim
of a complete population. A capped partial population remains usable only when
explicitly labeled with its observed coverage, exclusions and selection bias.

## Capture and control contract

Use the existing artifact and private dump paths from the P1 plan. R is the
existing compiled-out beta with profilerOFF; D0 is diagnostic/profilerOFF; D1 is
diagnostic/profile-active, after settling. l8ros owns all process lifecycle,
post-settle activation, capture, SSH retrieval, cleanup and restoration.
No new browser API or profile-start command is implied by the dump route.

Run D1 at most20s of intended measurement. Different processes can arm at
different moments; the controller bounds the whole capture and records partial
process windows rather than summing them into a longer run. Startup activation
before settling is inadmissible unless l8ros explicitly redesigns the workload
and records that difference. Include every required emitting thread; unprofiled
thread classes are unknown, not zero-cost paths. Preserve before/after unprofiled
R controls, actual backend/quality/visibility and requested/observed profiler
configuration. Existing release cannot certify new-patch compile-out.

The observed Pi16M-entry/128MiB ring floor is independent of this payload budget.
Do not assume that is the full browser's ring allocation, resident size or export
peak. Profile JSON, child-process buffers and serialization can add more. The
existing dump method has no byte-limit argument: post-write stat/hash checks do
not enforce a hard cap during writing. Before device execution l8ros must record
numeric device-memory headroom, disk/free-space or quota bounds, export deadline,
oversize/timeout disposition and exact-owned cleanup. Those device limits are
not chosen or authorized by this schema. Their absence blocks runtime, not
schema/source review. No unbounded repeated dump or retry is allowed.

The dump receipt must match the same process's profileDir and unique basename.
Keep raw profile and receipts private/local; existing profiler metadata may
contain URLs even though these custom records cannot. Do not preserve discovery
tokens in reports, upload profiles or invoke remote symbolication implicitly.

## Verification before acceptance

Falsifiers to implement before call sites; small pure cases use a10s watchdog:

1. Exact32-word encoding, all-uint32 maximum size, forbidden fields, unknown
   kinds/enums/flag bits, reserved slots, malformed validity and64-bit round-trip.
2. OFF side effects: argument factories/clocks/IDs remain untouched. ON but
   inactive/paused/filtered or non-Gecko-only tracing cannot admit a record.
3. Exact16383+terminal budget; concurrent emitters cannot duplicate IDs or exceed
   record/byte cap. One terminal only; reserved slots cannot be reused after error.
4. Admission origin0, exact20s boundary, late completion, negative/nonfinite clock,
   no rearm, observed stop and unobserved stop/restart limitation.
5. Nested/overlapping scopes, depth32/33, early return, failures, shutdown, missing
   parent/record, terminal before draining child scopes, nonquiescent counters.
6. Each classified pool/direct/fallback/software route and error, missing plane,
   reused UID and mixed process/capture identity. No extra resource/query calls.
7. Native serializer and real dump/schema round-trip, rejected unsupported fields,
   actual buffer retention, raw/normalized clock tests and full export bounds.
8. Real diagnostic build, actual effective gate and source/overlay identities;
   later patch-applied OFF object/package exclusion verification. Pure/source
   checks alone do not establish either native result.
9. l8ros R/D0/D1/R comparisons after clean baselines, preserving observer effects,
   mixed-workload/partial-capture failures and all unknown counts. No performance
   optimization claim follows from a successful schema or attribution build.

The native helper, sink serialization, registration, static-size assertion and
concurrency tests remain unimplemented. This freeze constrains them; it does not
certify that they work or relax a failed test to fit an implementation.
