# WebRender Video: Phase A Handoff

Date: 2026-10-16. Task: `wr-render-fix`. Coordinator: l8ros. Browser source,
tests and artifact owner: umbra. This is source attribution and a diagnostic
proposal, not a demonstrated performance fix or build/runtime clearance.

## Decision

Deprioritize decoder import reuse for the measured workload. Instrument inside
the existing WR-render envelope before selecting an optimization. The strongest
remaining localization question is repeated raster/composition work versus
metadata upload/driver submission versus CPU composition preparation.

The first concrete, bounded code candidate is removal of unused full-scene
occlusion preparation on Draw. Its source justification is stronger than a
speculative shader change, but its performance leverage is unmeasured. Do not
call it the cause of the 24 ms interval. Keep the probe patch and any fix patch
separate.

## Authority

- Exact base: `c0e7f8a2be0460695c1f65ae8796b09c1082480c`.
- P1 patch: `731d9ec249e4de7d7f1aa58179504cbb9ae5f12f2cfe1b2cadbb616a3228874e`.
- Deployed diagnostic BuildID: `20261016031646`.
- New [isolated P2 source](/home/public/wyatt-desktop/.cache/codex/umbrafox-wr-render-fix-20261016/source)
  replays all 22 frozen P1 files with exact hash, size and mode matches. No P2
  implementation has been applied. Sealed P1 source/artifacts stay unchanged.
- [Rendering inventory](/home/public/wyatt-desktop/.cache/codex/umbrafox-wr-render-fix-20261016/render-inventory.md):
  21 pinned Rust/GLSL files byte-compared with the base, detailed branch/shader map.
- [Acquisition/transfer inventory](/home/public/wyatt-desktop/.cache/codex/umbrafox-wr-render-fix-20261016/routes-inventory.md):
  28 source files, 23 base matches plus five expected frozen-P1 differences.
- [Independent adapter review](/home/public/wyatt-desktop/.cache/codex/umbrafox-wr-render-fix-20261016/probe-contract-review.md):
  ownership, shared-budget, FFI, nested invocation, partial-group and ticket risks.

Reports are source evidence, not independent runtime analysis. The raw profiles
were not loaded or uploaded for this audit. No Pi or owner-browser action ran.

## Runtime Evidence and Corrections

Coordinator-supplied D1 Wayland d3 median is 24056 us; 720p-output median is
17420 us. Nominal output area changes 2.25x and median falls 27.6%. Two points
are compatible with mixed fixed and pixel-dependent costs, not a unique model.
The renderer-admission-gap FPS estimate is withdrawn. Actual coordinator
`mozPresentedFrames` observations are 32-51 fps, approximately 48% dropped.
The misconfigured overclock capture is excluded.

D1 reports 300 native DMA-BUF locks, 57 direct-2D plane imports and inexpensive
acquisition/present scopes. Zero DecoderPool records means missing coverage,
not no decoder work or pool copies. Draw/tile/reason marker names exist only in
the schema: zero emitted records cannot be interpreted as zero work.

The effective GPU time-query and sample-query flags were false. Existing
blocking query-result collection is therefore excluded for this D1. Other
implicit driver waits, scheduling and locks remain possible. Renderer CPU26%
and a separate player's poor upload result are supporting hypotheses, not
measurements of WR GPU execution or proof of CPU video-plane upload.

Capture identities, under the existing P1 export:

| Arm | Bytes | SHA256 |
| --- | ---: | --- |
| D1-wayland | 415063421 | `b734fffd163d4f986c55ab3aaac2ce00ab12cc49eaac06c9865133e688d4a5ec` |
| D1-wayland-720out | 146239216 | `03d677ac7427d21896cbe73eaa0afc2586916e5deeb186cba8a2458583201f6e` |

## Baseline Route: Known and Unknown

The observed native lock route is per-plane external `TextureHandle(Texture2D)`
through deferred resolves and `RenderDMABUFTextureHost::Lock`. Native resources
bypass WR's pixel texture cache: `uses_texture_cache` excludes TextureHandle,
and `upload_to_texture_cache` rejects NativeTexture. Resource-key updates and
UV-buffer updates are not uploads of decoded pixel planes.

Conditional on the reported V4L2 output, the producer chain is
`CreateImageV4L2` -> DRM `VideoFramePool::GetVideoFrameSurface` -> DMA-BUF image
and remote texture descriptor -> per-plane external WR resources. Pool-copy,
software-upload-to-DMA-BUF and import-copy fallbacks exist; native lock type
alone cannot certify end-to-end zero-copy or distinguish those producers.

With the native compositor genuinely disabled, WR uses Draw composition.
**The existing capture does not identify which of these final video paths ran:**

1. Promoted external YUV remains a Content surface on Draw. `draw_tile_list`
   selects `composite.glsl` YUV fast/clipped variants and GPU `sample_yuv`.
   Promotion is not an OS overlay in this mode.
2. Nonpromoted YUV uses `ps_quad_yuv.glsl`, including indirect primitive routes,
   while rasterizing a picture/offscreen target; final composition samples RGBA.
   This can incur conversion plus an additional target/composite pass.
3. A source already exposed as RGB follows RGB composition; its shader tag
   cannot recover the upstream conversion history.

P2 must observe these branches. Inferring a unique final route from DMA-BUF or
the broad Composite GPU tag would overstate the evidence.

## Per-Frame Cost Inventory

The detailed inventories enumerate the inspected Gecko branches. This is not
a claim to enumerate hidden Mesa, kernel, firmware or device-internal work.

| Cost family | Authoritative call sites / distinction |
| --- | --- |
| Decode/pool/transport | V4L2 pool ownership, descriptor adoption, conditional per-plane FBO/CopyTexSubImage copy; software staging/SHM upload/Y-UV packing/fence; descriptor IPC is not pixel transfer. Mostly outside renderer d3. |
| Native acquisition | `update_deferred_resolves`, native host Lock, EGL import/direct bind or CopyImageSubData fallback, optional semaphore. Existing P1 spans are nested, not extra additive costs. |
| Cache allocation/upload/copy | `update_texture_cache`, `upload_to_texture_cache`, TextureUploader and PBO pool: page/glyph/image bytes, allocation/reuse, staging, flush, TexSubImage, ps_copy/FBO copies. Not automatically video traffic. |
| Scene metadata | `update_gpu_buffer_texture` F/I buffers already skip equal small contents; `bind_frame_data` rotates three vertex-data texture sets and uploads nonempty headers/transforms/tasks. UV changes can invalidate otherwise reused data. |
| Instance data | `draw_instanced_batch`: shared-buffer append/map/unmap or BufferData/repeated writes, chunking, then actual draw. Shared-instance/PBO reuse already exists. |
| Offscreen/picture targets | `draw_render_target`, `draw_picture_cache_target`: allocation/bind, full/scissored/quad clear, clip masks, borders, blur/filter/scale passes, resolves/blits, alpha/opaque YUV or RGB rasterization, depth invalidation. Reused frame skips picture/texture-cache targets, not every alpha/color target. |
| Composition CPU preparation | `composite_simple`: layers, tile mappings, clipping/segmentation, full-scene and per-layer occlusion. FrameBuilder tile-z sorting is upstream, not d3. |
| Final GPU-affecting submission | `composite_pass`, `draw_tile_list`: dirty/full clear, YUV/RGB shader selection, shader compile/link/bind, texture/VAO/state changes, instance uploads, opaque and alpha draws. Blending/masks/filters can add overdraw. |
| Explicit copies/readback | FBO resolves/scales/backdrop readback, conditional cache-copy draws; remote media readback is a separate request route, not normal native Lock. Count actual calls, not texture sizes. |
| Tail/presentation | External unlock, profiler/bookkeeping, debug work, upload-pool fences/retirement and device end; P1 covers later swap/Wayland lock. A cheap swap/no-op explicit WaitForGPU does not exclude driver stalls earlier. |

YUV shaders perform sampling/conversion on the GPU, with format/depth/range,
clipping and sampler variants. Do not lower precision, change filtering, force
a compositor or reduce output quality based on this source map.

## Proposed P2 Observations

This is the attach-site contract for review. Exact word slots and ABI must be
frozen before implementation, not inferred from this table. Prefer at most five
aggregate detail receipts per admitted render call, not per-draw marker output.

| Group | Attach points and required observations |
| --- | --- |
| Disjoint CPU stages | `render_impl` resource setup/cache updates; deferred resolves/UV copies; `draw_frame` GPU-buffer and frame-data preparation; dirty calculation; offscreen/picture work; `composite_simple` CPU preparation; final composite execution; tail. Missing regions remain residual per complete invocation. |
| Nested CPU detail | Actual shader bind/compile, instance write/map, texture upload/flush, dispatched draw, FBO copy/clear, and first full-render occlusion construction. These overlap parent stages; do not add them to parent totals. |
| Frame/state/target counts | Copy active render-reason bits before reset; actual Draw/Native/Layer route, reuse/present/empty/force/debug state, dimensions and full/partial damage state. Count entered passes and rendered picture/alpha/color targets in existing loops. Picture target count is not invalidation cause/count. |
| Draw counts and route | Count actual dispatch chunks and logical instances, including clear-quads. Distinguish final YUV, raster YUV, final RGB, other/unknown and clear submissions; observe opaque/alpha marginals and actual YUV sampler/format/clip variant. Marginals do not reconstruct a full joint distribution. |
| Upload/copy counts | Separate cache-pixel uploads, F/I scene data, vertex metadata and instance writes; logical input bytes versus staged/allocated bytes, effective Immediate/PBO/shared mode, actual blit/GL-clear and allocation/reuse branches. Checked scalar values already available; no diagnostic payload hashing/traversal. |

`stats.total_draw_calls` deliberately hides picture-clear quads. Existing
profiler counter merge uses max, not sum; missing Event values are not zeros.
Use actual producer branches rather than repairing these statistics downstream.
Initialize counters only after admission; certify zero only after the relevant
coverage completes. Overflow, errors, missing parent/role, expired or filtered
records remain invalid/partial. Optional exact-thread CPU-clock pairs can show
uncharged elapsed time, but not uniquely GPU waiting. No GPU queries are added
in the first P2 patch; asynchronous query work needs separate review.

## Adapter and Verification Gates

P2 uses the same `ProbeCore<GeckoEnvironment>` instance, shared origin, 16383
ordinary reservations plus one terminal, 512-byte custom reservation and 20s
one-shot. No second Environment specialization or Rust allowance. New P2
marker/version; P1 meanings unchanged. Mixed terminal counts explicitly cover
both versions and parent joins use the shared sequence namespace.

C++ owns fixed stack records around the existing synchronous render call. Rust
owns only thread-affine numeric phase tickets. Each ticket uses unique record
sequence plus checked nonzero generation; no pointer, timestamp identity or
cross-language object layout. Matching end consumes bookkeeping even after
eligibility loss. Failed begin rolls back; stale/wrong-thread/repeated end cannot
mutate another frame. Exact invocation selection must distinguish unadmitted
nested invocations from missing same-group roles. This is a freeze prerequisite,
not resolved merely by nearest admitted `Current(kind)` lookup.

AGIS test protocol: current P1 fake-clock/budget/concurrency/writer and source
tests are the regression baseline. Add failing-first cases for mixed single
budget ownership, near-cap partial groups, nested failed admission, same-tick
token reuse, stale/double/wrong-thread tokens, pause/filter/expiry cleanup,
generation overflow, invalid scalar input and partial roles. Most important:
an unadmitted nested render must never write into an admitted outer frame.

Small pure tests get 10s watchdogs; native compile/link/sanitizers need separately
bounded commands. Compile-OFF tests must remove symbols, state, clocks and
side-effecting argument evaluation in both languages. Stripping probe blocks
must preserve engine statements. A mixed-language fake sink test must prove
the Rust and C++ callers reach one real owner. Synthetic passing tests are not
ARM runtime, rendering parity, profiler overhead or GPU attribution proof.

All diagnostics remain private, compile-gated and opt-in, with no public JS,
custom IPC, pixels, URLs, FD/pointer payloads, extra driver queries or waits.
The 8MiB custom budget is not the profiler ring/file/memory budget. l8ros owns
ring/disk/export guards, runtime identities, controls, capture retrieval and
restoration.

## Ranked Fix Hypotheses

Order reflects source-backed implementation readiness, not predicted speedup.
No high-leverage performance fix is selected yet.

1. **Remove unused Draw full-render occlusion preparation.** Source establishes
   the structure is allocated/populated but read only by Layer. Preserve all
   layer mappings and the second drawing-occlusion pass. Pursue only if the
   first-pass/composition CPU span is material. Falsifiers: small span, changed
   draw/clear/damage ledger, or no controlled improvement beyond noise.
2. **Avoid unnecessary picture/offscreen YUV work.** Highest possible pixel-work
   leverage if P2 shows repeated picture rasterization or late underlay
   cancellation. Trace the actual invalidation/promotion reason before a patch.
   Falsifier: cached picture targets remain untouched and final-only YUV dominates.
3. **Suppress unchanged vertex metadata on the selected ring slot.** Only if
   uploads/flushes are material and contents genuinely match that slot. Preserve
   context-loss/reallocation/UV/task updates. Falsifiers: changing data, tiny
   upload spans, comparison overhead or changed pixels/draw ledger.
4. **Final YUV/composite or driver optimization.** If final-only draws dominate
   with low exact-thread CPU, use stacks and, if still needed, separately approved
   sparse nonblocking GPU timings. No concrete shader rewrite is justified yet.

Any selected fix gets a separate patch, baseline/fix probe-identical comparison,
unprofiled controls and rendering/damage parity tests. No optimization claim
until the measured branch and outcome support it.

## One-Build Request

Request coordinator approval for one optimized ARM diagnostic package after
schema/API review, failing-first tests, native gates and separate P2 patch freeze:

`/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/exports/umbrafox-wr-render-p2/diagnostic/umbrafox-wr-render-p2-beta-c0e7f8a2be04-linux-aarch64.tar.xz`

Source is exact base + sealed P1 + new probe-only P2 patch. Assign a fresh fixed
BuildID at freeze; none is claimed yet. Keep beta overlay byte-identical at
SHA256 `4278e82f4538bf4058aefd3b488e77069be9c7edd1e36791456c194e79967eb2`.
Do not build another release ARM package. Proposed build resources are owner-
approved C++8/Cargo2/nice0 with 8GiB/5GiB memory fallback to C++4/2, subject to
coordinator confirmation for this iteration.

Historical P1 D is a reference, not proof of new-P2 compiled-out behavior.
Require new diagnostic runtime-OFF versus ON controls; new-patch release-OFF
proof remains a separate compile gate. l8ros alone deploys/runs/returns dumps.
This request does not authorize a launch or optimization build.
