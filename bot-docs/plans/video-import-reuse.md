# Reuse Immutable Video Conversions

## Scope And Status

This extends the authorized rendering-performance campaign. P0 source and
identity characterization is complete; P1 implementation and compiled mechanism
checks pass. P2 packaging, 40 native regressions, the 48-case pixel matrix and
eight retained-decoder-loss comparisons pass. Expanded same/alternating-frame,
multiple-canvas and resize pixel checks also pass against the immediate baseline.
Native GL cache hits and forced WebGL loss followed by explicit context replacement
now pass in nine actual DMABuf tests, alongside 44 adjacent regressions. This uses
a scoped test-only compositor policy adjustment because gtests force headless;
it does not establish ordinary browser admission or automatic translator recovery.
The fixed P3 comparison now completes: measured joined CPU is 3.496% lower, but
the candidate fails one startup callback-gap criterion (28/29 pass). No repeats
or threshold changes. Playback reuse-frequency, automatic context-recovery and
performance acceptance remain open. The target
is repeated DMABuf video-to-canvas conversion, not a general GPU resource cache.
No installation, owner-browser restart, Pi action, public API, new preference,
default enablement, shader/filter change or weakened correctness gate is included.
The experimental direct-import path remains default OFF.

The subsequent [callback-cadence audit](../reports/performance/2026-10-06-callback-cadence.md)
replays both failed comparisons without changing them. Roughly 24.7 Hz callbacks
match a source-supported 40 ms playback-position/invalidation path, but no
per-event causal join is proved. Expected-display metadata is a current/next-tick
estimate, not an independent scanout clock. A tested diagnostic collector now
retains callback/presentation/media timestamps. The subsequent
[delivery diagnostic](../reports/performance/2026-10-06-callback-delivery.md)
now passes two isolated package captures after a preserved bounded-JSON transport
failure and diagnostic-only packing correction. All six 51 ms startup gaps have
49.38-50.86 ms refresh-timestamp spacing, 0.82-1.98 ms callback age, and 0-1 ms
adjacent draws. This localizes those intervals before callback execution, not
their scheduling cause or physical scanout; the earlier 146 ms event stays open.
No performance acceptance follows. Do not retry P3 until green, relax
its criteria, alter callback scheduling, or infer cache hit frequency from this.

The subsequent [refresh audit](../reports/performance/2026-10-06-refresh-catchup.md)
reproduces the existing profiled capture and identifies1166/1189 callback spans
inside catch-up tasks. All22 non-catch-up callbacks in the first two seconds run
inside PVsync messages. A named scrollbar fade timer at1001ms contains two fixture
style invalidations; frozen GTK source has1000ms delay/400ms opacity fade. This
is a source-supported diagnostic lead, not causal proof. Next test original versus
overflow-suppressed owned fixture, preserving all original acceptance failures,
native defaults and callback cadence. No product change is justified by this
single profiled association; actual overflow and runtime transition state are open.

Motivation: the corrected full-range export has 146 inclusive CanvasRenderer
samples in ImportSurfaceDescriptor and 184 in RecordedDrawSurfaceDescriptor.
These nested sample counts are not CPU percentages. The fixed workload draws the
same video frame four times per callback in its middle phases. Each current
lookup calls ImportSurfaceDescriptor again. Runtime hit frequency and benefit
remain to be measured, not inferred from those counts.

Baseline HEAD is 892431809a4caadb5c73b2c03ad9bdb124c3e21e plus the preserved dirty
patch and source manifests. The current packaged baseline for a future cache
comparison is exports/umbrafox-render-pass-marker-20261006: libxul SHA256
371a173cf7995acf013553e576d801c5e732d9d280d17589ff63757cfc124330.
Its separate CPU concern remains open; do not mix the preceding descriptor-only
package into the same comparison. The current tree's 63 product pins and 146
harness pins were reverified before this plan. No concurrent editor is assigned.

## P0 Evidence

Twenty source files are archived and matched to the recorded descriptor build,
either through explicit source pins or unchanged build-HEAD bytes with no entry
in the recorded patch. Four exact source regions are compiled in a small C++20
test: descriptor-ID type/counter, TextureClient descriptor production and
GPUVideoImage::GetDesc. Generated IPC classes and texture data are stand-ins.
This is not a linked Gecko, actual decoder, or GPU test.

Five native identity cases pass: invalid zero ID, distinct IDs for the same
texture handle, stable copied image descriptors, separate clients reusing a
handle, and 1024 distinct IDs from four concurrent threads. Sixty-four copies
retain the image ID even when returned copies are changed. Three Node source
checks cover archived hashes, full descriptor recording/image retention, and
texture invalidation before unlink/cleanup. The initial missing-snapshot RED is
scaffolding, not a production failure. No implementation speedup is claimed.

Evidence: artifacts/umbralink-control/import-frame-authority/. Corrected profile
analysis is sealed separately as profile-range-audit-final.sha256.

## Territory And Authority

| Producer or consumer                             | Verified responsibility                                                    |
| ------------------------------------------------ | -------------------------------------------------------------------------- |
| TextureClient::GetSurfaceDescriptorRemoteDecoder | Texture serial plus fresh process-local descriptor ID                      |
| RemoteVideoDecoderParent::ProcessDecodedData     | Produces descriptor for decoded output and retains image/texture           |
| RemoteMediaManagerChild::TransferToImage         | Copies descriptor, supplies bridge source, constructs GPUVideoImage        |
| GPUVideoImage::GetDesc                           | Returns the same stored descriptor by value                                |
| DrawTargetRecording::DrawSurfaceDescriptor       | Retains image and records descriptor                                       |
| RecordedDrawSurfaceDescriptor serialization      | Serializes validated complete descriptor, not just handle                  |
| CanvasDrawEventRecorder                          | Holds source image until recorded work is processed                        |
| VideoBridgeParent::LookupTexture                 | Resolves exact content ownership and live native TextureHost               |
| CanvasTranslator DMABuf lookup                   | Validates host descriptor/size/format/context, then imports                |
| SharedContextWebgl::ImportSurfaceDescriptor      | Allocates handle, converts/uploads, returns SourceSurfaceWebgl             |
| SourceSurfaceWebgl                               | Holds handle; destruction clears weak owner; eviction can trigger readback |
| SharedContextWebgl::PruneTextureHandle           | Invalidates handle before unlinking and freeing storage                    |

Do not key by file descriptor, buffer address or texture serial alone. Descriptor
IDs are process-local, so ID alone does not cover decoder process replacement.
Keep the normal content/bridge lookup on every call. A proposed key combines the
freshly resolved native TextureHost object with the valid descriptor ID, within
one SharedContextWebgl. A short-lived strong host reference prevents pointer
reuse while that entry exists. Size and destination format must also match.
No new access to asynchronously populated external-image IDs is required.

## Proposed Storage Contract

Use one optional entry per shared context, containing the exact native host,
descriptor ID and a WeakPtr to the already tracked TextureHandle. Do not retain
a SourceSurfaceWebgl, decoded image, surface descriptor with duplicated file
descriptors, or extra backing texture merely for the cache. The existing texture
memory/item accounting and invalidation remain authoritative. Expired or invalid
weak handles are misses, not errors and not revived textures.

A hit may reuse the live SourceSurfaceWebgl already linked to that handle. If
no source owner remains, create a new wrapper over the valid unchanged handle.
Never install a second owner while a first wrapper still references that handle:
the first wrapper's destructor clears the handle's owner link. Reject unexpected
owner types or mismatched size/format/sampling offset. Keep normal draw-target/
texture binding and MRU behavior. The inspected DrawRect path uses the imported
surface through GetCompatibleSnapshot; it does not necessarily refresh MRU in
that branch. Explicitly refresh a valid reused handle through the existing list
operations. Do not infer immutability from IsValid alone: review forced updates,
sampling-offset changes, subrectangle extraction and handle ownership before P1.

Restrict reuse to a translation batch. Clear on entering/leaving the batch,
transaction end, memory-pressure cache clearing, context replacement/loss,
translator shutdown, and failed/unsupported admission. Scope exits must cover
pause, malformed-stream, checkpoint and duration returns. Handle reentry without
restoring an invalid outer entry. Old context entries must clear before context
replacement, not only through the new context at final scope exit.

The strong host key is transient, not an idle decoder-buffer cache. Generic
imports with no admitted video key retain their existing behavior. A miss must
execute the existing conversion/fallback exactly once; failure must not install
an entry. Cached conversion never bypasses the existing original-manager
availability check, bridge ownership lookup or content security checks.

This proposal must not force readbacks on cache eviction. A strong source-surface
cache is rejected because SourceSurfaceWebgl::OnUnlinkTexture can read pixels
back to preserve such a retained snapshot. Weak-handle reuse must preserve normal
eviction instead. Source review supports this distinction; native lifetime and
GPU execution tests remain mandatory.

## Implementation And Tests

P1 owns only dom/canvas/DrawTargetWebgl.{h,cpp},
gfx/layers/ipc/CanvasTranslator.{h,cpp}, and focused tests. Preserve all existing
dirty changes and comments. Add a private typed key/entry only as needed; no new
web interface, generic cache framework, global resource pool or policy switch.
Record exact before sources and the implementation-only delta before building.

Write failing-first actual-source tests before implementation. Required cases:

- Four draws of one admitted frame perform one conversion; bytes/format/size match.
- Same native host with a new frame ID converts again; invalid zero ID never hits.
- A different host with the same serial/ID cannot hit the old entry.
- Expired/invalid/pruned texture handles miss; shared texture storage cannot revive one.
- A live wrapper is reused without replacing its owner; a dead wrapper may be recreated.
- Cache bookkeeping adds no strong source/handle retention and no readback on eviction.
- Context loss/replacement, generic imports, dimensions/format changes and every failure clear or miss.
- Batch/transaction exit, pause, malformed event, shutdown and reentry release the host key.
- No entry publishes on failed upload/allocation or unsupported descriptor; fallback ordering is unchanged.
- Content/bridge identity and original-manager availability checks still run before reuse.

Small supplied-data/native-region tests use 10-second execution limits and
20-second compilation limits; distinguish stand-ins from actual Gecko coverage.
Run focused in-tree native tests for resource ownership/invalidation if the
existing environment can exercise them without introducing a new product API.
Do not count source-pattern assertions alone as behavioral cache verification.

P2 requires exact scoped formatting/lint, normal two-job idle native build and
packaging with source/config/package manifests. A build timeout is not permission
to overlap a second build. Preserve failures and poll the original handle.
Run the existing 40 native readback/descriptor checks, 48-case exact pixel matrix
and eight retained-decoder-loss comparisons against the new package. Add repeated
same-frame and alternating-frame/canvas coverage plus context eviction/recovery.
No tolerance relaxation, dropped failure or public diagnostic is permitted.

P3 uses fresh isolated laptop roots, no daily profile, profiler OFF, unchanged
146-input safety envelope and 48-second 1/4/4/1-copy fixture. Compare the immediate
pre-cache package with the cache candidate in a fixed A1/B1/B2/A2 sequence, using
the existing 29 numeric gates without relaxation. Include exact pixel/error
admission first; check all process/resource/package/cleanup receipts after each
run. Bound capture/driver/SSH to existing 120/220/240-second limits. Export only
public evidence, not profile/control credentials or application-data payloads.
Passing functionality alone or lower CPU with worse smoothness is not acceptance.
Keep the earlier four-frame drop and label-candidate CPU increase unresolved
unless a controlled result actually addresses them.

## Completion And Rollback

P0 and the P1 mechanism implementation are complete; P2 and P3 acceptance remain
open despite completed P3 measurement. P1 has
28 compiled source-region cases with GPU/IPC stand-ins, 460 tooling tests and
zero scoped lint problems. The final native build succeeds with zero compiler
warnings. P2 now has a verified 46-file package and all 40 native readback/IPC
regressions passing on the laptop. The new candidate also passes the existing
48-case GPU pixel matrix against the full-size reference and both eight-case
retained-decoder-loss comparisons. The new same/alternating-frame, multiple-canvas
and context recovery gates were separate from that first matrix. The expanded
batched test now has 40 complete-canvas and 160 tile comparisons matching the
immediate pre-cache package in real laptop GPU runs, including alternating frames,
interleaved canvases, generic frames and resize. Nine actual hardware-GL tests
now prove native reuse and forced loss followed by explicit context replacement.
Automatic translator recovery and runtime hit frequency remain open; page batching
alone does not prove native translation batching or effective cache hits. P3 may
measure the complete package without claiming hit frequency or causal attribution;
its result does not waive those open P2 limits. See
[the failed playback screen](../reports/performance/2026-10-06-frame-reuse-playback.md),
[the native checkpoint](../reports/performance/2026-10-06-frame-reuse-native.md),
[the batch checkpoint](../reports/performance/2026-10-06-frame-reuse-batches.md),
[the GPU checkpoint](../reports/performance/2026-10-06-frame-reuse-gpu.md) and
[the implementation report](../reports/performance/2026-10-06-import-frame-reuse.md).

After integration, rerun the full relevant
tooling suites and all parity/lifetime/performance gates against the final exact
package. Record implementation-only source delta and immutable evidence; no
staging, commit, push or daily installation is part of this phase. A revert is
only that phase delta, never the owner's preexisting work. Report ambiguous
performance honestly and leave the full rendering/layout/CSS/JS goal active.
