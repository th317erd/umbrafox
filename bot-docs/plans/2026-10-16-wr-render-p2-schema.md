# WR Render P2 Schema and ABI

Status: final contract; frozen only at the exact SHA recorded in the teamwork
DB after independent identity confirmation. No implementation may start before
that receipt. Task `wr-render-fix`, coordinator l8ros, source owner umbra.
Base `c0e7f8a2be0460695c1f65ae8796b09c1082480c` plus sealed P1 patch
`731d9ec249e4de7d7f1aa58179504cbb9ae5f12f2cfe1b2cadbb616a3228874e`.

## Scope and Compatibility

Only instrument the existing synchronous `wr_renderer_render` call inside an
admitted P1 RendererFrame. Other `render_impl` entrypoints are outside this
measurement, not zero-cost. Preserve engine statements, order, resource
lifetimes and return values. No optimization, GPU query, new driver query/wait,
custom IPC, public JS, pixel/URL/FD/pointer payload or source-data hashing.

Use the SAME `ProbeCore<GeckoEnvironment>` owner, origin, sequence allocator,
eligibility and one terminal as P1. Total per process remains 16383 ordinary
reservations plus one terminal, each charged512 custom bytes, and20s one-shot.
No second template Environment, counter allowance, timer, rearm or refund.
The profiler ring and profile-file memory/disk costs remain independent.

P1 kind1-8 words retain version1 and original meanings. P2 is marker name
`Umbra WR render P2`, type `UmbraWRRenderP2`, version2, kinds9-10 only. The
payload is exactly type plus32 uint32 words; common flags/outcomes/backend,
relative timestamps, data validity and reserved word15 follow P1. Reprove the
compact writer bound <=512 bytes. No strings beyond the fixed marker/type.

Mixed capture manifests declare both versions. Terminal v1 counts all P1/P2
reservations/completions/rejections in that process; it is not a P1-only count
and not quiescent. Cross-version ancestry resolves in the shared namespace.
Old P1-only captures and decoder behavior remain unchanged.

## Invocation and Five Roles

Use a barrier-aware current P1 anchor, not nearest-admitted fallback across an
unadmitted inner RendererFrame. Always establish a T0 invocation-header scope:
when the P1 anchor is unavailable it is a tracked disabled sentinel with no
clock/reservation, so inner Rust calls cannot fall back to an outer T0. The
existing inactive-eligibility path may skip tracking after marking enclosing
records lost. Attempt roleT0 first when the anchor is admitted; if admission fails,
attempt no other P2 role. Otherwise independently attempt T1,C0,C1,C2 in that
order before Rust work. Destroy in reverse order, including early/error returns.
No all-or-none claim, no slot recycling. Each role consumes one reservation.

| Role | Kind / operation | Meaning |
| --- | --- | --- |
| T0 | 9 / 1 | Renderer partition wall times and thread CPU |
| T1 | 9 / 2 | Inclusive nested detail wall times |
| C0 | 10 / 1 | Frame state, targets and selected route metadata |
| C1 | 10 / 2 | Actual submitted-work marginals |
| C2 | 10 / 3 | Transfer calls and explicitly defined bytes |

For every admitted role, subject words10/11 = P1 frame admission sequence/0,
related words12/13 = T0 admission sequence/0, both validity bits set. T0 relates
to itself. Word3 is genuine immediate scope ancestry, not semantic group ID.
Role=(kind,operation) is immutable for P2. Duplicate roles, missing/invalid root
or frame, missing roles, or incomplete coverage make a partial group. Never
fill from adjacent invocations, reused window IDs or nearest timestamps.

Constructor kind/operation must be stored separately from payload words, even
for tracked skipped records. Current P2 lookup finds nearest tracked T0 header,
including a header with sequence0, and never crosses it to an outer invocation.
Within that header's bounded scope suffix, find exact role; unadmitted siblings
are missing roles, not a different invocation. No read of uninitialized payload.
Existing P1 `Current` behavior stays unchanged. Eligibility loss marks enclosing
records lost; it cannot later resume or expose an older invocation.
Every P2 selector also rejects nonzero existing sOverflow: an untracked nested
header cannot expose an outer invocation. The disabled T0 constructor path
tracks immutable identity before skipping admission and never reads payload.

All fields are initialized only after admission, invalid until observed. Counts
accumulate privately with checked arithmetic but are published as valid only
when their coverage completes. Partial failures do not become valid zeros.
Observed positive values without complete population may be retained only under
an explicitly incomplete role outcome; the analyzer must not use them as totals.
Whole-call outcome does not imply every role/field was observed.

## Exact Data Slots

All unlisted/reserved slots are0 and invalid. Durations are checked cumulative
microseconds, <=20000000. Counts/byte sums are checked uint32, never clamped or
wrapped; overflow invalidates that field and records InvalidObservation.
Bytes are logical input/copied/requested bytes as named, never bus bandwidth.

### T0: Partition Times

| Slot | Meaning / attach point |
| --- | --- |
| 0 | `render_impl` setup through resource/native-surface preparation before deferred resolves |
| 1 | Deferred resolves plus apply_deferred_uv_copies |
| 2 | draw_frame F/I GPU-buffer updates |
| 3 | bind_frame_data |
| 4 | calculate_dirty_rects |
| 5 | draw_frame existing offscreen render-pass loop, including picture work |
| 6 | Entire composite_frame call, including composition preparation/execution |
| 7 | Nested composite_pass calls within slot6; NOT additive to it |
| 8 | render_impl tail after draw_frame returns through existing result |
| 9 | draw_frame post-composite cleanup before its return |
| 10 | Exact calling-thread CPU delta across wr_renderer_render, Linux CLOCK_THREAD_CPUTIME_ID only; unavailable/error/backward/overflow is invalid |
| 11 | Number of completed T0 wall-time spans, including nested slot7; bounds rounding loss |
| 12-15 | Reserved |

Add only completed, nonoverlapping slots0-6,8-9. Slot7 is a child of6.
Composite preparation residual=6-7 only with complete compatible coverage;
otherwise unknown. Outer residual=P1 d3 minus compatible partitions per group,
never subtract medians. Validate expected branch coverage and containment first.
No fabricated/clipped endpoints. Excluded gaps stay residual. Empty/skipped
branches may explicitly certify zero only at their known completion boundary.
Do not read a thread CPU clock in release or inactive/unadmitted paths.

### T1: Nested Times

| Slot | Meaning |
| --- | --- |
| 0 | Actual shader bind including any existing compile/link |
| 1 | Instance buffer_data/write_buffer |
| 2 | Repeated instance map/copy/unmap |
| 3 | Shared-instance push |
| 4 | Actual helper device draw dispatch |
| 5 | FBO blit |
| 6 | Actual GL clear call |
| 7 | F/I GPU-buffer texture update |
| 8 | Entire VertexDataTextures::update, all four child updates and final shared uploader flush |
| 9 | update_texture_cache |
| 10 | First full_render_occlusion preparation, including its allocation/add/segment work only |
| 11 | Texture binding |
| 12 | TexSubImage submission |
| 13 | PBO allocation/map |
| 14 | PBO readiness polling |
| 15 | Number of completed T1 spans |

T1 slots are inclusive and overlap one another/T0. No additive total or completed
GPU-duration interpretation. Slot10 must not include unrelated first-loop layer
construction; use separate sequential scopes at existing blocks. No extra
traversal to measure it. Repeated slot spans accumulate; overlapping same-slot
entry invalidates that slot rather than double-counting.

### C0: State and Route

| Slot | Meaning |
| --- | --- |
| 0 | Branch flags below |
| 1 | Actual compositor:1 Draw,2 Native,3 Layer; unknown stays invalid |
| 2,3 | Actual framebuffer width,height as a valid pair |
| 4 | active_doc.render_reasons before reset, allowed mask0x000fffff |
| 5 | Entered render passes |
| 6,7 | Picture target Draw,Blit entries |
| 8,9 | draw_render_target entries by color,alpha target kind, including texture-cache targets but excluding picture entries6/7 and final framebuffer |
| 10 | Actual composite_pass mode:1 full(None at that call),2 partial; no-present or unobserved composition invalid |
| 11 | Actual repaint-rectangle geometric area including buffer-history damage, not results.dirty_rects current-frame-only damage or shaded fragments |
| 12 | Observed YUV-format mask: bits0-5 NV12,P010,NV16,P210,PlanarYCbCr,InterleavedYCbCr |
| 13 | Observed sampler mask:bits0-3 Texture2D,Rect,External,ExternalBT709 |
| 14 | Observed depth mask:bits0-3 depth8,10,12,16 |
| 15 | Observed upload-mode bits:Immediate1,PBO2,persistent4,transient8,shared-instance16,noninstanced32 |

Branch flag bits:0 render_impl entered,1 frame present,2 reused at draw entry,
3 empty passes,4 force_redraw at draw entry,5 dirty rects valid,6 debug flags
nonempty,7 GPU timer queries enabled,8 GPU sample queries enabled,9 draw_frame
returned,10 wr_renderer_render returned,11 multiple render_impl entries in this
call. Other bits zero. If repeated observations disagree on a scalar, invalidate
that scalar rather than silently select the last; masks/flags OR observations.
Flags reflect observed facts, not complete route population.
Rust excludes C0 slot0 from its completion mask. After wr_renderer_render has
actually returned, C++ finalization ORs flag10 and closes slot0 using the same
checked/sticky rules; it cannot override a previously closed or invalid field.
Timing population closure remains Rust-only.

Pinned RenderReasons defines bits0-19 even though legacy NUM_BITS=17; copy the
actual bitfield, not that legacy loop. YUV metadata must be available at an
admitted render producer; upstream preparation cannot be joined by proximity.
Missing raster metadata stays invalid. Format/sampler mask0 is valid only for
complete coverage that encountered no YUV selection, not missing access.

### C1: Submitted Work

| Slot | Meaning |
| --- | --- |
| 0,1 | draw_instanced_batch actual dispatched chunks,logical instances |
| 2,3 | Offscreen,final dispatched chunks |
| 4,5,6 | YUV,RGB,other-known-material chunks |
| 7,8 | Opaque-pass,alpha-pass chunks; auxiliary draws may be neither |
| 9 | Clear-quad chunks, including the path hidden by saved/restored stats |
| 10,11 | Actual non-draw GL clear,FBO blit calls |
| 12,13,14 | Scaling,blur,SVG-filter chunks |
| 15 | Unknown-material chunks |

Use actual dispatch sites, not intended batches or profiler maxima. Classify
with existing typed producer data through private diagnostic-only state/args;
no inference from nominal YUV opacity. All classification state must be scoped
to the current invocation, restored on early return and absent in release.
Direct debug draws outside draw_instanced_batch are excluded from slots0-9,
12-15; debug flag exposure prevents silently treating totals as all GL draws.
Material bins4-6,15 are exclusive; target/pass/auxiliary bins are marginals.
The marginals cannot reconstruct raster/final x material x alpha cross-products
or per-cell instance counts. A later focused probe may be required.

### C2: Transfers

| Slots | Calls / bytes |
| --- | --- |
| 0,1 | Texture-cache TexSubImage submission calls / submitted rectangle texel bytes |
| 2,3 | F32 GPU texture TexSubImage submission calls / submitted rectangle texel bytes |
| 4,5 | I32 GPU texture TexSubImage submission calls / submitted rectangle texel bytes |
| 6,7 | Vertex-data texture TexSubImage submission calls / submitted rectangle texel bytes |
| 8,9 | Instance buffer_data writes / logical input bytes |
| 10,11 | Repeated-instance writes / actual repeated copied bytes |
| 12,13 | Shared-instance pushes / copied bytes |
| 14,15 | allocate_upload_buffer nonzero storage allocation calls / requested bytes, both BufferStorage and BufferData branches |

Count actual submission/allocation branches, not method entries that crop to
empty or fail staging. Texture bytes are checked width*height*bytesPerTexel for
the submitted GL rectangle, INCLUDING padded texels/holes in staged regions,
NOT original image payload, allocation capacity, row stride or measured bus
traffic. A batched512x512 submission is one submission of its full rectangle.
Different logical image updates need not correspond one-to-one to submissions.
Instance-copy bytes keep the separate logical/copied meanings above.
Classify only under an actual synchronous producer/flush context; unavailable
class/bytes remain unknown. Native external imports are not uploads. PBO
allocation excludes map-only reuse, zero-size orphaning, vertex/index buffers
and texture allocations. Allocation may overlap transfer and is not additional
traffic. C0 upload-mode bits record exercised branches, not preferences. No
payload comparison or diagnostic traversal is added.

Include both actual upload_chunk tex_sub_image_2d_pbo and the separate
upload_texture_immediate TexSubImage call. Use the effective format after
format_override for bytes. The cache class scope spans uploader construction
through flush; each F/I update scope includes its own flush; vertex class spans
the whole VertexDataTextures::update including its final shared flush. Classes
start unknown per Rust invocation and restore on scope exit. Pool storage reuse
does not retain queued chunks across flush, and no diagnostic class is retained
with a texture/PBO or inherited from an outer invocation.

## ABI and Lifetime

Diagnostic-only C symbols below use fixed widths and noexcept/non-unwinding
implementations. role is1=T0,2=T1,3=C0,4=C1,5=C2. No raw pointers cross this ABI.

```c
uint32_t umbra_wr_p2_recording(uint32_t role);
uint64_t umbra_wr_p2_begin(uint32_t role, uint32_t slot);
void umbra_wr_p2_end(uint64_t ticket);
void umbra_wr_p2_set(uint32_t role, uint32_t slot, uint64_t value);
void umbra_wr_p2_add(uint32_t role, uint32_t slot, uint64_t delta);
void umbra_wr_p2_or(uint32_t role, uint32_t slot, uint32_t bits);
void umbra_wr_p2_complete(uint32_t role, uint32_t mask);
void umbra_wr_p2_invalid(uint32_t role, uint32_t slot);
```

`recording` returns0/1 for exact current role eligibility; no clock reads.
Rust gates metadata preparation BEFORE expression evaluation with this check.
set/add/or check domain/overflow and update provisional fields; complete marks
only successfully closed populations valid. Matched end accumulates provisional
durations; it alone never certifies a repeated-slot population. Invalid field
state is sticky; later complete cannot revive it. No mutation resets accumulators.

The exact operation matrix is:

| Operation | Allowed role/slots |
| --- | --- |
| recording | Roles1-5 only |
| begin | T0 0-9; T1 0-14 |
| set | C0 1,2,3,10,11 only, checked scalar domain |
| add | C0 5-9; C1 0-15; C2 0-15 |
| or | C0 0,4,12,13,14,15 only |
| complete | T0 mask subset0x03ff; T1 subset0x7fff; C0/C1/C2 subset0xffff |
| invalid | T0 0-9; T1 0-14; C0/C1/C2 0-15 |

C0 scalar domains: compositor1-3, positive width/height, composite mode1-2,
area0..UINT32_MAX. Masks: flags0x0fff, reasons0x000fffff, formats0x3f,
samplers0x0f, depths0x0f, modes0x3f. All add operands/results fit uint32.
C0 dimensions are published only as an observed valid pair. complete cannot
invent an unobserved scalar, but may certify initialized zero additive/mask
fields only for a caller-proven closed population. T0 CPU10/span-count11 and
T1 span-count15 are C++ owner-only; reserved slots are never writable.

Unknown role, missing role or overflowed scope is a no-op without clocks or
fallback. For an admitted exact role, unsupported operation/slot, forbidden
mask bits, out-of-domain values or conflicting scalars mark that role
InvalidObservation and the targeted valid slot invalid; an invalid whole mask
has no partial effects. Never redirect to another role, panic or unwind over
FFI. A zero complete mask is an explicit no-op. Any attempted mutation or begin
after a slot's population closure invalidates that slot and the role.

Begin only allows T0 slots0-9 and T1 slots0-14. T0 CPU slot10 and span-count11,
T1 span-count15, and reserved slots cannot open a phase.
Ticket=(shared reservation seq<<32)|
nonzero monotonically increasing per-record generation, across all its slots.
No generation wrap/reset or timestamp identity. Record owns fixed16 start stamps
and tickets, initialized after admission. Checked generation/clock failure
rolls back any new active bookkeeping before returning0. Exclusive T0 slots
reject overlap, except slot7 nested inside6; T1 permits different-slot nesting.
Slot7 must begin/end while6 is active; ending6 while7 remains live invalidates
both slots and the role. Failed begin for an admitted present role invalidates
the requested timing slot and role, even if previous spans succeeded.

End resolves exact full ticket using bounded same-thread live scope lookup,
consumes it and clears bookkeeping BEFORE checking eligibility. Stale/zero/
wrong-thread/repeated tickets do no work, do not read clocks, and cannot mutate
another record. Generation exhaustion invalidates further issuance. No owner
wait or fabricated endpoint when a guard remains at destruction.
Any matched ticket that cannot finish a valid span invalidates its slot/role;
unmatched live tickets at context destruction do likewise. Stale, zero and
wrong-thread tickets cannot identify a current role and therefore remain no-op.

Rust Phase owns a nonzero u64 and PhantomData<*mut()>; no Send/Sync/Copy/Clone.
Explicit end consumes the ticket; Drop cannot double-end or panic. Context loss,
early Result returns and stopped/filtered profiler do not restore eligibility.
No C++ object constructed in a returning FFI function is retained by Rust.

C++ constructs the five-role context on its stable stack around the original
render call and publishes known completion/outcome afterward, using existing
return values. Scalar-only selection and final emission use the same C++ owner
as all P1 callsites. Test linkage must prove it, not assume template spelling.
Compile-out removes includes/state/calls/argument evaluation with
MOZ_UMBRA_PERF_PROBES and existing Rust umbra-perf-probes feature.

## Clock and Coverage

Use existing monotonic TimeStamp/origin. One-shot closure does not mean a timer
interrupts rendering: unknown expiry requires one clock read to discover it;
after latched hard closure only existing terminal timestamp exception remains.
Record-budget closure permits already-admitted drains under existing time rules.

Floor each completed phase to integer microseconds; sum checked values and
count completed spans. Cumulative undercount is less than span count us.
Consumers report that bound; they cannot recover submicrosecond durations.
Native enclosing endpoints and payload clocks retain P1 checked normalization.
Thread CPU uses a separate delta, never as the wall-time clock or added to it.
An ended phase proves that span only, not the complete repeated-slot population.
A later lost/invalid/missing required span invalidates that aggregate and makes
the role incomplete; it cannot retain a plausible complete partial sum. No
zero-length synthetic phase may certify an unobserved/absent stage.

Rust explicitly closes the invocation after its normal renderer return and all
diagnostic child guards/classes have ended. Only this boundary, with source
coverage tests for every declared hook and branch, calls complete with the
covered timing population masks. A never-entered stage may be certified zero
only because its entire declared invocation domain has now been traversed; an
unhooked/excluded entrypoint or error return is not such evidence. Early Rust
returns do not close populations. complete rejects active tickets or prior
invalid coverage; it is idempotent only for an already-closed unchanged slot.
The C++ render result alone never closes timing populations. T0 requires its
full0x03ff closure and T1 full0x7fff for complete timing-role Success.

Outcome precedence is InvalidObservation(8) for diagnostic failures/unclosed
successful-return timing populations, then known renderer early/error return
EarlyReturn(3), then Success(1) for a normally completed, closed, valid role.
Existing P1 eligibility-loss flags remain authoritative and prevent complete
inference. A later render success never overwrites invalid/early state. Missing
optional counter scalars remain invalid without fabricating failure. Partial
role observations may survive only under non-Success outcome. Consumers may
compute6-7 or the d3 residual only from a uniquely joined P1 frame and P2 roles
with Success, complete required validity/closure, no loss/invalid flags, checked
clock containment and the specified branch domains. Otherwise report unknown.

## Required Fail-First and Build Gates

1. P1 regressions unchanged; mixed P1/P2 sequences share one origin/budget/terminal
   under concurrency and boundary contention. Unknown fields never serialize valid0.
2. Mandatory P1/root admission, only1-4 remaining slots, failed optional roles,
   nested unadmitted invocation, sibling role gaps, two windows and role mismatch.
3. Same timestamp repeated slot, duplicate/stale/wrong-thread ticket, generation
   maximum, start-clock failure rollback, outstanding guard, exclusive overlap,
   pause/filter/expiry cleanup and final writer eligibility loss.
4. Checked counts/bytes/enums/reasons/dimensions, mixed scalar observations,
   failed coverage then complete, empty valid scope, early render error and
   skipped branches. Verify actual dispatch classification and clear-quad count.
5. Mixed-version supplied-data joins, missing/duplicate roles/parent, reordered
   completions, terminal nonquiescence, native/CLI clock offset, no fabricated FPS.
6. Both-language compiled-OFF symbol/state/argument factories absent; inactive
   factories/CPU clocks untouched. Guard stripping preserves engine statements.
7. Real mixed Rust/C++ fake-sink executable proves one production-style owner;
   native writer <=512bytes, compiled ARM link gate and private marker receipt.

Pure cases use10s watchdogs. Compiler/sanitizer/link commands receive explicit
larger bounds. No browser/driver runtime is authorized here. P2 adds observation
overhead; l8ros compares new runtime-OFF/ON and historical D with independent
profiler ring/disk/export bounds before accepting any performance inference.
