# Allocation-Free Renderer Pass Labels

## Mechanism And Build

WebRender formatted a heap-allocated `pass N` label on every render-pass entry,
before asking whether the GPU backend supported markers. The candidate checks
support first and formats supported labels into a bounded stack buffer. Decimal
labels, push/pop order, nesting and backend lifetime are unchanged. Static
markers and timer/query paths are untouched. No PHC safety behavior is disabled.

The exact production call and actual query module reproduce12 allocator calls
over10indices in each supported/unsupported mode before the correction. Both
allocation assertions fail while behavior controls pass. Afterward, all9tests
pass and label allocations are zero. Five retained tests exercise exact labels
through2047 and usize extremes, unsupported mode, nesting, unwinding and backend
lifetime. A nonallocating backend isolates label work; driver allocations are
not counted. Frame/tag stand-ins mean this probe is not full WebRender execution.

The normal two-job idle browser build subsequently passed, compiling WebRender,
Gecko bindings and linking libxul in85seconds. Packaging passed in105seconds.
The46-file extracted candidate differs from the preceding descriptor-availability
package only in libxul.so. Both frontend archive payloads are unchanged. Archive,
source pins, staged/working patch, untracked source and configuration are retained.
No daily installation, launcher, profile, browser setting, public API, default,
shader or pixel arithmetic changed in this correction.

Candidate: exports/umbrafox-render-pass-marker-20261006/.
Archive SHA256 aca57ea31e4e23fdda8772d4f8c568cd8292eccdb2c4efe4e00ba5d79abcd810;
libxul SHA256371a173cf7995acf013553e576d801c5e732d9d280d17589ff63757cfc124330.
The reused BuildID20261006175655 does not distinguish the packages; their full
manifests do. Native compilation and packaging are not playback acceptance.

## Recorded Stall Evidence

The prior profiled capture contains a153.752ms Renderer Composite interval.
Supported CLI exports with idle samples included show only one Renderer sample
inside it, versus40samples in each200ms flank. Parent GeckoMain, CanvasRenderer
and Compositor likewise each have one sample inside; content GeckoMain has31.
Sparse parent samples do not prove idle time, lost samples, GPU waits or CPU cost.

Local symbols for the exact old libxul show this one stack:
render_impl -> format_inner -> PHC allocation -> MozStackWalk -> libgcc unwind.
The PHC stack walk precedes its mutex; this is not evidence that PHC held that
mutex for the stall. Nor does one stack attribute the whole interval to allocation.

Supported assembly annotations report zero per-instruction weights despite the
function's one sample, so weighted callsite attribution remains unavailable.
A separately tested inference combines the unresolved and symbolized single
stacks, two function ranges and ELF page alignment. Their unique consistent
relocation maps the caller return address to a call whose setup references the
encoded `pass ` literal in the hash-matched binary. This is explicitly a
relocation inference, not a native load-map receipt or measured duration.
Independently, exact production source proves the avoidable formatting operation.

The CLI used owned named sessions and explicit loopback symbol endpoints with
matching local binaries. All recorded daemons/servers stopped and their exact
PIDs/sockets were absent. Missing-symbol retry and ambiguous-interval failures
are retained. No raw profile parser or new browser recording was used for this
localization. The old sealed captures remain immutable.

## Verification Boundaries

Production delta: device/query.rs helper, one draw_frame call in renderer/mod.rs,
and tests/unit/gpu_marker.rs. Reverse-delta tests reproduce both original source
files exactly, preserving preceding dirty graphics work. Scoped source lint and
diff whitespace checks pass. The18 offline checks replay saved samples, symbols,
clock conversion, relocation constraints, source preservation and cleanup evidence.

Initial probe macro and source-selector failures were harness errors, not
behavioral RED. A later saved-data test used one excess parent directory in its
source URL; the original17pass/1pathfailure log is retained, followed by18pass.
No failed observation or earlier performance result was removed or relabeled.

Evidence: artifacts/umbralink-control/compositor-gap/ and render-pass-marker/.
The prospective matched playback protocol is in
bot-docs/plans/render-pass-markers.md; its new evidence uses render-pass-playback/.
The matched playback result follows. The broader rendering/layout/CSS/JavaScript
objective remains active.

## Matched Playback Result

All four fresh laptop captures passed functional, sampled-resource, native-root,
package and owned-cleanup checks. The fixed29criterion regression screen passes,
but **no speedup is established**. Both candidate CPU rates exceed both baseline
observations. Time-weighted joined CPU is6.05% higher for the candidate; with
two processes per build and substantial baseline variation, this is descriptive,
not proof of causality or a statistically established regression. Do not call
screening success performance acceptance or install the candidate on that basis.

| Arm | CPU seconds / elapsed second | Four-copy P95, ms | >50ms gaps by phase | Video drops |
| --- | ---: | --- | --- | ---: |
| Baseline A1 |0.56985|2 /2|1 /0 /0 /0|0|
| Candidate B1 |0.58364|2 /2|2 /0 /0 /0|0|
| Candidate B2 |0.58178|2 /2|2 /0 /0 /0|0|
| Baseline A2 |0.52910|2 /2|5 /0 /0 /0|0|

The screen prospectively allowed up to5% above the worse baseline CPU rate,
not the average: that explains its passing CPU result alongside the unfavorable
average. No threshold was changed afterward. Candidate four-copy medians are1ms;
baseline values are1/1ms and0/1ms. Zero means below recorded clock precision,
not zero work. Both builds retain accelerated start/end canvas observations.

All ten long callback gaps occur in phase0 within1.214seconds of its start,
with neighboring draw batches of0-1ms. Their51-68ms gaps do not place the delay
inside drawImage or identify a scheduler/decoder/GPU cause. The153ms recorded
stall was not reproduced in these four unprofiled captures, including baseline.
Absence from the candidate therefore does not prove the allocation fix removes it.
Normal page clocks, shared GPU state, frequency/scheduler changes and incomplete
transient-process CPU coverage remain limitations. No physical scanout claim.

Both variants use the same experimental importON setting in disposable profiles
and profilerOFF; product default staysOFF. Each plays the identical48s H.264
fixture with1/4/4/1copies in12s phases. Native after receipts identify hardware
ffmpeg decoding in RDD and zero decoded/sink/compositor drop counters. These are
owned-fixture results, not YouTube or extension attribution. The candidate's own
full pixel/default-OFF comparison remains a separate gate.

Four captures lasted59.757-59.839seconds with14resource samples each. Peak
sampled artifact use was145865551bytes, under the fixed256MiB cap. There are
176 exported public evidence files totaling1367943bytes. All48 recorded process
IDs were absent at export and independently checked again afterward. This is not
continuous resource/network isolation or exhaustive transient-child history.
Every log has271bytes and zero drops; sandbox and VA-API messages are retained.

Runtime harness146inputs remained unchanged. A first offline audit failed because
the adapter wrote the complete manifests map plus selected mode while the
analyzer expected a singular selected hash. The exact map/mode, matching
preflight and four captured native/INI hashes now join to the selected package;
copied INI bytes are also checked. Failure and corrected analysis are separate.
No capture was changed or repeated, no runtime adapter changed between arms and
no old performance observations were pooled. The entire saved four-arm result
and every admitted prefix are independently recomputed by the pure replay tests.

Next: isolate the stack-label helper's CPU cost and compiled render-loop impact
before treating allocation removal as a playback win. Preserve this unfavorable
CPU observation. Keep the candidate uninstalled and the broader compositor
investigation open; do not disable PHC, GPU markers or safety checks to improve
the measurement.

Final verification: all 33 selected strict replay tests pass, including the
complete four-arm result and unfavorable CPU summary. Documentation lint has
zero problems; source, staged-index and all 146 runtime-input guards pass.
All command sessions are terminal. Evidence is sealed separately as
artifacts/umbralink-control/render-pass-final.sha256; later investigation uses
a new namespace rather than rewriting these observations.
