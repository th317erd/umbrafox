# Single-image opacity prototype

2026-09-25. Experimental, default OFF. Original opt-in pixel gate FAILED.
The subsequently authorized rectangular-AA isolation passed the frozen fixture,
but FAILED the odd-dimension matrix case (AE 28). Production edits/builds,
packaging and deployment are paused again; no general parity claim is made.
Shared task `scaled-v2/browser-review`.
Coordinator contract: l8ros `bot-docs/plans/pi-single-image-opacity.md`.
Entry HEAD: `44f0ad5f3277a51138cba9dd11aeb3a61d5a31c9` with existing readback
and profiler work preserved. No push, Pi operation, or default enable authorized.

## Pre-edit dependency map

- `nsDisplayCanvas::CreateWebRenderCommands` embeds the async canvas pipeline.
  `AsyncImagePipelineManager::ApplyAsyncImageForPipeline` supplies a single image,
  scale-from transform, opacity-one wrapper and preferred-compositor flag.
  `SceneBuilder::push_iframe` adds rectangular clipping and spatial roots.
- `SceneBuilder::push_stacking_context` removes provably redundant wrappers;
  `pop_stacking_context` otherwise wraps the primitive list in the opacity
  picture. First prototype accepts only the already-flat single-image list:
  no recursive unwrapping of arbitrary pictures or removal of effect guards.
  Failure to recognize the actual async canvas is an explicit stop checkpoint.
- Scene builder owns input Image keys; the interner's local image data is unit.
  Preserve candidate input only while the experiment is enabled. Image keys
  store ColorU, so re-interning .25 would quantize it to 64/255. Instead carry
  private f32 opacity on the image instance; do not mutate shared ImageData.
- `PrimitiveList::add_prim` must perform normal direct-image slot accounting
  after replacing the eligible picture, using the original spatial node, rect,
  clip ancestry and flags. `can_promote_to_surface` remains unchanged.
- Image fallback in `prepare_image_quads` must multiply its local color alpha
  by the private opacity and update source opacity classification. Add the
  constant to existing opacity dependencies for ordinary tile invalidation.
- `setup_compositor_surfaces_rgb` -> ExternalSurfaceDependency::Rgb ->
  compute_external_surface_dependencies -> ResolvedExternalSurfaceColorData::Rgb
  -> both renderer/composite.rs RGB CompositeInstance::new_rgb consumers.
  Add explicit modulation only for specialized instances; ordinary default-off
  consumers retain WHITE. Modulation must affect alpha classification.
- CompositeSurfaceDescriptor equality controls skipped composites. Include
  modulation so an opacity-only change cannot leave an old composited image.
  Existing image-generation, texture lifetime and fences remain unchanged.
- PrimitiveKind/PrimitiveInstance are capture-serialized but not deserialized;
  replay rebuilds their scene. Image keys remain unchanged. New resolved
  RGB and CompositeSurfaceDescriptor fields need replay defaults of WHITE;
  new FrameBuilderConfig flag needs replay default false. Update all config and
  descriptor constructors, not just production initialization.
- Draw only: other compositor kinds and unprovable wrappers keep original paths.

## Planned source boundary

`modules/libpref/init/StaticPrefList.yaml`,
`gfx/webrender_bindings/src/bindings.rs`, and within `gfx/wr/webrender/src/`:
`renderer/init.rs`, `frame_builder.rs`, `scene.rs`, `shutdown_test.rs`,
`scene_building.rs`, `prim_store/mod.rs`, `prim_store/image.rs`, `prepare.rs`, `scene_debug.rs`,
`tile_cache/mod.rs`, `composite.rs`, `renderer/composite.rs`.

Planned pref: `gfx.webrender.single-image-opacity.enabled`, default false,
startup renderer configuration. No public settings or web-visible API.

Test boundary: `tools/umbrafox/tests/opacity/`, standalone Node/UmbraLink runner,
owned localhost Canvas2D fixture, Xvfb framebuffer capture via ImageMagick import,
profiler-cli path verification. Runtime evidence stays in the authorized cache.
No user profiles, production browser or remote Pi will be driven.

## Gates

1. Passed: unchanged-vs-unchanged framebuffer pixels have AE=0, including two
   separate profiles and repeated captures; canvas hash 6e5e9bdd. Existing-path
   test passes, promoted-path test fails 0/87 actual canvas candidates. Local
   Xvfb GL/llvmpipe viewport is 1280x972 (not Pi hardware/full-HD performance).
2. Failed: opt-in actual-path selection passes (88/88), but 661 framebuffer
   pixels change, with a maximum channel difference of 1/255. Repeated opt-in
   captures are identical. The unchanged oracle remains failing.
3. Native build, focused lint and default-off parity passed. Further matrix,
   serialization/negative-path checks and ARM64 packaging are not run because
   the first opt-in gate failed. Do not weaken tolerances or broaden scope.
4. Physical acceptance remains coordinator-owned; no success claim beforehand.

## Historical audit

`dce46c2af160` (bug 1646279) removed `optimize_picture_if_possible` and the
old primitive opacity-binding machinery because picture caching reduced its
benefit and removing it simplified scene construction and dependency tracking.
This prototype does not restore that general optimizer: eligibility is limited
to a preferred RGB image, constant opacity and the Draw compositor.

`16d014de25cd` (bug 1669840 part 3, the Git equivalent of the coordinator's
Mercurial reference) added image instance color alpha to the opaque-backdrop
test. The current tile-cache implementation retains it. The prototype multiplies
that alpha by private instance opacity and also prevents translucent instances
from being classified opaque in fallback quads and promoted surfaces. Both RGB
composite consumers receive premultiplied modulation. No GL calls, fences or
ownership changes are introduced.

Related upstream records: [bug 1646279](https://bugzilla.mozilla.org/show_bug.cgi?id=1646279),
[bug 1669840](https://bugzilla.mozilla.org/show_bug.cgi?id=1669840).
The local Git changes, not the historical feature's existence, establish these
specific implementation facts. Neither proves modern async-canvas eligibility
or pixel parity; those remain the first runtime gate.

## First runtime checkpoint

Evidence root on wyatt-desktop:
`/home/wyatt/.cache/codex/l8ros/opacity-prototype-20260925/`.
Each capture has `frame.png`, `repeat.png`, `snapshot.json`, `graphics.json`,
`markers.json` (profiler-cli output) and the raw profile named in `dump.json`.

| Run | Actual canvas candidates | Framebuffer vs baseline-a | Canvas readback hash |
| --- | --- | --- | --- |
| baseline-a vs baseline-b | 0/87 promoted | AE 0 | 6e5e9bdd |
| prototype-off | 0/87 promoted, original rejection path | AE 0 for both captures | 6e5e9bdd |
| prototype-on | 88/88 promoted | AE 661 for both captures | 6e5e9bdd |

The opt-in markers all have `root=true`, `color_alpha=0.25`,
`sub_slice=0/2`, `result=Ok(Overlay)` and the 1280x972 canvas coverage rect.
This proves the actual async-canvas path enters the specialization on the
local GL/llvmpipe setup, not that a native hardware overlay was allocated.

`compare -metric AE` gives 0 between the two opt-in captures and 661 between
each and baseline-a. `compare -metric PAE` gives `257 (0.00392157)` at
ImageMagick's Q16 scale, equivalent to a maximum 8-bit channel difference of 1.
This is a stable pixel regression in the captured state, not an accepted fuzzy
tolerance. The cause has not yet been traced to a particular arithmetic or
sampling step; removing an intermediate changes the resampling/quantization
path, but that is a hypothesis, not a completed diagnosis.

For corroboration only, trim 100 ms from each end of each run's actual canvas
candidate interval. Prototype-off has 297 `WR picture target` markers in
2071.413163..3345.458128 ms; prototype-on has zero in
1883.899253..3226.815555 ms. These are short marker windows with different
durations, not a timing benchmark or Pi frame-drop measurement. The off run's
targets cover the four 1024/256 by 512/460 rectangles of the local viewport.

## Verification and provenance

- Native build passed: `CARGO_BUILD_JOBS=2 ./mach build -j2`, bounded at
  7200 seconds, completed in 53m09s. Log:
  `artifacts/opacity-prototype-build-complete-config.log`. Six compiler warnings
  were reported in WebRTC components; no build errors remain.
- Initial build attempts caught the missing `rust: true` declaration and the
  shared render-backend placeholder config initializer. Both were corrected
  before this build. The binaries-only attempt also skipped preference generation.
- Focused license/whitespace checks passed; `./mach lint
  modules/libpref/init/StaticPrefList.yaml` passed. A direct `yamllint` selection
  was unavailable; it is not counted as a passing check. `git diff --check` passed.
- Runtime commands use `timeout 150s xvfb-run -a -s '-screen 0 1920x1080x24
  -nocursor' node tools/umbrafox/tests/opacity/capture.mjs BINARY OUTPUT off|on`.
  The browser runs in a fresh disposable profile, is stopped in `finally`, and
  the test uses the actual X framebuffer rather than `drawSnapshot`.
- `verify.mjs prototype-off baseline-a original` passed; `verify.mjs prototype-on
  baseline-a promoted` failed at the unchanged pixel comparison. Logs:
  `artifacts/opacity-prototype-{off,on}-verify.log`. Independent marker queries
  establish the successful 88/88 promotion despite that earlier assertion failure.
- Native libxul GNU build ID: `b18a7f6e89da0ff840cd479b8efe18a1`.
- `working-tree.patch` in the evidence root includes the preserved earlier work
  and this prototype. SHA256:
  `2473c43875ff85083eb587348045d429168fea439a016a4754ef7a84007be246`.
  `base-revision.txt` records HEAD. The baseline working-tree snapshot remains
  in `exports/wr-profiler-20260925/` unchanged. Test sources are retained in
  `tools/umbrafox/tests/opacity/`.

The failed checkpoint was sent through the shared DB and directly to the l8ros
tmux pane with a separate Enter. Owned test browsers and profiler-cli sessions
were stopped. No ARM build, package, desktop install, Pi operation, commit or push
was performed for this prototype. The current installed browser is unchanged.

## Experimental boundary

### Authorized rectangular-AA isolation

Shared DB event 123 authorizes one additional default-OFF experiment, not a
proven repair. Preserve UV/clamp/filter/modulation and omit only redundant
rectangular AA for experimental RGB draws with finite integral device geometry,
no compositor clip, Draw compositor and GL Texture2D. SWGL, other texture kinds,
fractional geometry and native updates retain existing paths. An explicit batch
feature selects a separate shader; a profiler marker proves actual selection.

Source boundary: `gfx/wr/webrender/src/composite.rs`,
`gfx/wr/webrender/src/renderer/{composite,shade}.rs`,
`gfx/wr/webrender_build/src/shader_features.rs`, and
`gfx/wr/webrender/res/composite.glsl`, plus owned tests/report.
First full-frame exact pixel gate remains mandatory, with no tolerance change.
Any residual difference stops further source edits/builds. No ARM/package/install,
Pi operation, push or default enable is authorized for this checkpoint.

The failed runtime is preserved at the evidence root in `failed-build/`.
Its `libxul.so` SHA256 matches the original:
`ce6bd96b826e30f3e7a99b911b4a67a444ac57343f09ee9436d8f87d88019e6b`.
The previous tracked diff snapshot remains unchanged before this experiment.

### AA-isolation checkpoint and matrix stop

Native build passed in 53m21s (`artifacts/opacity-aa-build.log`), GNU libxul
ID `caa3694256a911ddfbd7cdb95008f43e`, application BuildID `20260925142533`.
The five-file AA change preserves UV/clamp/filter/modulation. Its explicit
feature participates in `shader_params` batch equality. The native-update RGB
consumer does not set the new feature; Texture2D/Draw/integral geometry/no-clip
checks and the Software-renderer exclusion bound actual selection.

| Run | Promoted/candidates | New shader selections | Pixel comparison | Readback hash |
| --- | --- | --- | --- | --- |
| aa-off | 0/88 | 0 | Both captures AE 0 vs baseline-a | 6e5e9bdd |
| aa-on | 88/88 | 88 | Both captures AE 0 vs baseline-a | 6e5e9bdd |
| matrix inset-on | 87/87 | 87 | Both captures AE 0 vs inset-off | 6e5e9bdd |
| matrix alpha-edges-on | 87/87 | 87 | Both captures AE 0 vs alpha-edges-off | fbb75d65 |
| matrix odd-on | 87/87 | 87 | Both captures AE 28 vs odd-off | 56391226 |

All three matrix references have zero new-shader markers. The odd reference
has 0/87 promoted candidates. Each mode's repeated odd captures match exactly,
and both modes have the same readback hash. The coordinator's independent
Pillow review records 28 differing pixels, 29 RGB components, each candidate
component one lower. Interior pixels differ too, unlike the original 661-pixel
boundary-only failure. The matrix stopped immediately; remaining cases did not
run. Owned browser, Xvfb and profiler process searches were empty after cleanup.

Evidence: `aa-{off,on}/` and `aa-matrix/` under the evidence root;
`coordinator-odd-pixel-review.json` contains the independent pixel list.
The odd candidacy marker records bottom 390.99997 in the reference versus
391.0 in the promoted path. This is a geometry clue, not proof of the actual
shader inputs or the cause of the pixel difference.

Verifier bookkeeping was corrected after coordinator review: reference shader
markers must be zero, and shader-selection counts are no longer compared with
promotion counts to infer mixed draws. Those counts have different units.
Mixed-case per-draw branch proof is explicitly unverified. Exact mixed pixels
and independent fractional/rounded exclusions remain required but unrun.
Fallback still requires a specialized `root=true`, `color_alpha=0.25` candidate
rejected by `OverlaySurfaceLimit`, alongside actual selected promoted draws.
An excluded case requires zero experimental shader selections, not necessarily
zero promotions. No pixel tolerance changed.

Replayed verification passes inset and alpha-edges and still fails odd at AE 28.
Supplying the enabled inset capture as reference correctly fails the new
reference-marker assertion. Logs: `artifacts/opacity-aa-*-recheck.log` and
`artifacts/opacity-aa-reference-negative.log`. No new browser run or rebuild was
needed for these verifier checks.

### Tests-only dimension/filter isolation

Authorized by shared DB event 138, use the same preserved reference executable with
the preference OFF and the same current executable with it ON. Preserve the
frozen fixture, original matrix and all existing evidence. Add a separate
diagnostic fixture/runner, not a replacement oracle. Keep background, opacity,
pattern, position, DPR 1, 90-frame updates and repeated full-frame capture fixed.

1. Odd backing 321x181, destination 642x362, linear: isolates odd texture
   dimensions at an exact 2x ratio from the failing nonintegral scale.
2. Even backing 320x180, destination 643x367, linear: retains the failing
   destination dimensions but removes odd backing dimensions.
3. Odd backing 321x181, destination 643x367, nearest: retains failing dimensions
   and changes only the requested image filtering.

For each pair require reference shader markers 0, unchanged readback between
modes, stable repeated captures, and actual promoted/new-shader selection in
the candidate. If a path is not selected, report the diagnostic inconclusive,
not a parity pass. Record AE exactly, changed coordinates/channel deltas and
candidate rectangles. Any nonzero AE remains a failed acceptance gate. Proposed
authorization would allow collecting these three bounded diagnostic pairs even
when one fails pixels; it would not resume the remaining acceptance matrix.
Bound captures at 150s, profiler calls at 30/60s and comparisons at 10s; check
the coordination bus between commands and stop on infrastructure instability.
No production edits, instrumentation, rebuilds, ARM/package/install or Pi work.

Source arithmetic motivating the proposal:

- `composite.glsl` computes vertex fraction
  `(clipped_device_pos - device_rect.xy) / (device_rect.zw - device_rect.xy)`,
  then `mix(aUvRect0.xy, aUvRect0.zw, fraction)`. For unnormalized Texture2D UVs,
  it divides by texture size and clamps to sorted endpoints inset by half a
  texel. The fragment samples and multiplies premultiplied texel by modulation.
- `ps_quad_textured.glsl` derives its fraction in local pattern/segment space:
  `(info.local_pos - pattern_rect.p0) / rect_size(pattern_rect)`.
  `sample_color0.glsl` mixes UV endpoints, divides by texture size, and applies
  the same mathematical half-texel bounds before sampling. Its bounds varying
  is declared mediump, versus highp in composite; this declaration alone does
  not establish an effective precision difference on desktop GL.
- `ps_quad_blend.glsl` samples the intermediate using the local-space helper.
  `CalculateFilter` unpremultiplies nonzero-alpha input and the blend fragment
  premultiplies its output again. Which optimized shader operations and target
  formats execute in this fixture is not captured by the promotion markers.
  Thus intermediate quantization, coordinate rounding and arithmetic ordering
  remain hypotheses, not proven causes.

Under ideal full-image mapping at DPR 1, a destination pixel center maps to
source texel position `(i + 0.5) * sourceSize / destinationSize`, clamped to
`[0.5, sourceSize - 0.5]`. The failing ratios are 321/643 and 181/367; the first
diagnostic uses exactly 1/2 on both axes. This formula describes ideal mapping,
not measured runtime UVs, atlas offsets, padding or GPU interpolation precision.
Nearest filtering would reduce interpolation sensitivity but cannot by itself
prove the origin of an error or justify changing browser filtering.

### Three-pair results

Completed exactly the three authorized diagnostic pairs, using separate files
under `tools/umbrafox/tests/opacity/sampling/`. Original capture/oracle/matrix
files were not edited. The aggregate runner exited 1 because a pixel gate
failed, not because of an infrastructure error. No additional browser captures
or production changes followed.

| Diagnostic | Pixels changed | OFF promoted/candidates; shaders | ON promoted/candidates; shaders | Readback hash |
| --- | --- | --- | --- | --- |
| 321x181 -> 642x362, linear | 0 | 0/87; 0 | 88/88; 88 | 56391226 |
| 320x180 -> 643x367, linear | 20, FAIL | 0/88; 0 | 86/86; 86 | 6e5e9bdd |
| 321x181 -> 643x367, pixelated | 0 | 0/87; 0 | 87/87; 87 | 56391226 |

Each OFF/ON pair has equal readback, equal expected source-pattern hash and
stable repeated framebuffer captures (AE 0 within each mode). Every candidate
run actually promoted the canvas and selected the new shader; every reference
has zero new-shader selections. These are local Xvfb/GL llvmpipe results, not
Pi measurements. The pixelated reference differs from the original odd linear
reference at 182929 pixels, so the filter fixture is not inert. Existing markers
do not expose the underlying sampler state; the fixture requests pixelated
filtering rather than asserting a newly measured GL sampler parameter.

All 20 differences in the second pair occur at screenshot row 339, at x values
59 through 600 (not every pixel in that interval). Twenty RGB components differ:
12 are +1 and eight are -1; alpha is unchanged. These are interior differences.
All coordinates, original/candidate RGBA values and deltas are saved. Odd
backing dimensions alone cannot explain the failure; nonintegral linear scaling
is implicated by these controlled comparisons. Coordinate precision, bilinear
sampling and intermediate rounding remain competing explanations. Equal source
readback does not establish identical intermediate texture formats or samples.

Observed candidacy rectangles:

- Exact 2x: both modes `(16,24)..(658,386)`.
- Even backing, odd destination: OFF `(16,24)..(658.99994,390.99997)`,
  ON `(16,24)..(659,391)`.
- Odd pixelated: OFF `(16,24)..(659,390.99997)`, ON `(16,24)..(659,391)`.

The last pair passes despite the recorded rectangle difference. Therefore the
rectangle difference alone is not sufficient evidence for a geometry repair.

Evidence root: `sampling-isolation/` inside the existing evidence directory.
`results.json` summarizes all three cases; `*-pixels.json` includes every changed
pixel and `*-paths.json` retains candidate rectangles. Per-run directories hold
both PNGs, graphics/snapshot state, full marker queries and profile dumps.
Log: `artifacts/opacity-sampling-run.log`. Node syntax and focused whitespace/
trojan-source lint pass (`artifacts/opacity-sampling-lint.log`).

`identities-before.txt` and `identities-after.txt` match byte-for-byte, covering
both executables, libxul libraries, application/platform INIs and the original
and diagnostic fixture/runner/oracle files. Current libxul SHA256:
`a9bf59ec5763ea60ad4797795c2039e1358750152d00d21a0934e43302393461`.
Preserved reference libxul remains
`ce6bd96b826e30f3e7a99b911b4a67a444ac57343f09ee9436d8f87d88019e6b`.
The tracked production diff (excluding the bootstrap-only AGENTS.md correction)
still hashes to
`6535711553b3be8050a902856ae07dd3c38f38c0b67cac518e8154e587b85741`.
Owned browser/Xvfb/profiler process searches were empty after completion. No
ARM build, package, install, Pi action, default enable, commit or push occurred.

### Next bounded proposal, not authorized by these diagnostics

First perform a read-only producer audit of `prepare_image_quads`, the quad
pattern/segment UV and transform generation, `CompositeInstance::new_rgb`, and
the final `draw_tile_list` texture resolution. Trace where source dimensions,
device bounds, normalized UVs and image-rendering selection are rounded or
converted in each path. Include the intermediate opacity task's size, format
and sampling; do not reduce the investigation to the already-recorded candidate
rectangle alone. Return an explicit list of actual values still missing before
proposing an instrumentation patch.

If these cannot be established from existing capture facilities, propose a
separately approved, one-frame, profiler-only observation of corresponding quad
and composite inputs: texture dimensions/UV endpoints, normalization, filter,
pattern/segment rect, local-to-device transform, target dimensions/format and
modulation. No new GL queries, readbacks, resource changes or web APIs; no
permanent per-frame logging. Scope that patch and build independently before
implementation. Do not add epsilon offsets, change filters, compensate colors,
exclude odd dimensions to hide failures, or loosen the AE 0 oracle.

The owner clarification in shared DB event 114 permits the temporary default-OFF
debugging preference without adding a privacy-review phase before this checkpoint.
It does not approve an official toggle or default enable. The patch adds internal
renderer state and a privileged preference, not a content API, DOM/CSS attribute
or network protocol change. The measured readback hash is unchanged, but opt-in
framebuffer pixels are not, and intended performance changes may affect observable
frame timing. Hidden configuration and a single passing default-off fixture are
not proof of undetectability or comprehensive Firefox equivalence. No such claim
is made; broader semantics, platforms and timing remain unverified.

### Read-only sampling producer audit

The audit is recorded in shared coordination events 153-157. A correction to
the earlier hypotheses: pure CSS `Filter::Opacity` selects an `ImagePattern`
with opacity in its base color. It does not select `ps_quad_blend` or that
shader's unpremultiply/repremultiply operations. Premultiplied base color is
multiplied by the sampled texel in `ps_quad_textured`.

Normal image production runs through `prepare_image_quads`, the repeatable
quad preparation and `QuadPrimitive` GPU blocks. Scale/offset handling keeps
an unrounded pattern rectangle before rounding coverage edges, with an inverse
pattern transform. Render-task UVs are patched by `GpuBufferBuilder::finalize`;
external UVs are resolved by `update_deferred_resolves` and applied before
drawing. The textured quad computes fractions from local position and pattern
rectangle, maps those to UVs and applies texture-size and half-texel clamps.

Normal opacity introduces a color render target: `get_surface_rects` rounds
allocation bounds outward while `calculate_uv_rect_kind` preserves the mapped
image extent. The color pool allocates RGBA8, linearly filtered Texture2D
targets. Extra storage and sampling can introduce rounding, but neither that
nor the exact runtime intermediate allocation has been established as the
cause of the observed differences.

Promotion instead goes through RGB surface setup, resolved image textures and
`get_device_rect`, which rounds mapped destination bounds. `draw_tile_list`
passes those bounds and resolved UVs into `CompositeInstance::new_rgb`.
`composite.glsl` derives fractions from the device rectangle before UV mapping,
clamping and color multiplication. The experimental variant only omits
rectangular AA. External Auto/CrispEdges textures bind with linear filtering;
Pixelated binds nearest. These are source-established choices, not measured
sampler parameters for the failing draw.

The candidate marker rectangle is `pic_coverage_rect`, not these final shader
inputs. Missing runtime values include source allocation/format and resolved
UVs; pattern, segment, task and transform inputs; opacity target origin and
UV mapping; final composite rectangle, clip, modulation and sampler state.
The external CPU texture-size helper derives size from UV span and cannot
substitute for actual shader `TEX_SIZE` on normalized or padded textures.

Existing full WebRender capture is not a passive metadata probe. The privileged
capture selects scene/frame/tile/external-resource flags; frame capture rebuilds
and invalidates a frame, while renderer capture reads external and cached GPU
textures. Backend serialization also precedes final deferred UV patches.
Render-command logging lacks the required operand values. No capture was run
in the read-only audit.

Mesa 25.2.8 source provides a cheaper, process-local causal diagnostic:
`GALLIVM_PERF=no_aos_sampling`, `GALLIVM_DEBUG=perf` and
`MESA_SHADER_CACHE_DISABLE=true`. Coordination event 152 authorizes exactly one
even-odd OFF/ON pair with these settings, unchanged binaries and fixture, new
evidence and the existing strict gates. Compare within the pair and against
each saved normal-driver image; preserve the normal 20-pixel failure.
The floating-point-filter log is driver-wide, not per-canvas proof; its text
also does not itself prove linear min/mag selection. Even exact parity under
this changed driver mode is only diagnostic, never product acceptance or
permission to change production filtering. No production build or Pi work is
authorized by this step.

### Mesa diagnostic stopped at the evidence gate

The authorized diagnostic stopped after the OFF capture; ON was never launched.
The test runner supplied the three Mesa environment variables only to its child
process tree, using the unchanged sampling capture and fixture. The OFF run
passed its expected source readback (`6e5e9bdd`), zero promotion/new-shader and
stable repeated-image checks. However, `browser.log` contained no floating-point
filter branch messages. The runner exited 1 at the explicit missing-log check
before starting ON. This is an inconclusive diagnostic, not a pixel failure or
parity pass. Absence of logs does not establish whether the driver flag took
effect or whether the canvas used a particular sampler.

Evidence is in `mesa-float-sampling/` beneath the existing evidence root. The
runner log is `artifacts/opacity-mesa-float-run.log`; `diagnostic.json` records
the requested environment. Before/after identity manifests match, including
saved normal-driver images. No OFF/ON or normal-driver pixel comparisons were
reached after the early gate. No ON artifacts or aggregate result were produced.
The owned browser, Xvfb and profiler process search was empty after cleanup.
Syntax and focused whitespace/trojan-source lint passed before execution.
Shared DB event 160 and a direct coordinator notification record the stop.
Further runtime work requires review; no retry, browser source edit, rebuild,
package, install or Pi action occurred.

### Authorized one-run Mesa completion

Coordination events 161-162 identified an observability limitation:
Mesa 25.2.8 `u_debug.h` compiles the `debug_printf` body out when `MESA_DEBUG`
is false, independently of the registered `no_aos_sampling` option. Therefore
missing release-build messages cannot establish that the sampler flag was
ignored. Events 165-166 approved exactly one ON completion with a corrected
observability contract, not a relaxed pixel oracle or an OFF rerun.

The separate `sampling/complete-float.mjs` runner reused the immutable stopped
OFF capture and launched ON once. The fixture, capture script and binaries
were unchanged. A bounded sidecar validated the owned parent PID, start time
and profile, recorded only the three approved Mesa environment values and
graphics-driver mappings, and captured the loaded gallium library identity.
The graphics snapshot reported GPU process unused; promotion markers came from
the same parent PID. This establishes process configuration and loaded-driver
identity, not the exact sampler branch for the canvas. The saved OFF capture
has no retrospective equivalent of this live-process evidence.

| Comparison | Changed pixels | Result |
| --- | --- | --- |
| Mesa ON versus preserved Mesa OFF | 83087 | FAIL |
| Mesa ON versus normal-driver ON | 86915 | FAIL |
| Preserved Mesa OFF versus normal-driver OFF | 71071 | FAIL |
| Preserved normal-driver ON versus OFF | 20 | FAIL, unchanged |

ImageMagick AE and independent raw-RGBA counting agree. The Mesa pair changes
97866 RGB components, with maximum absolute delta 2 and no alpha changes.
All differences lie within x20..662, y28..394, the canvas rectangle in the
framebuffer. Both modes have readback hash `6e5e9bdd` and stable repeats (AE 0).
OFF has 0/87 promotions and zero new-shader selections; ON has 86/86 promotions
and 86 actual new-shader selections. DPR is 1, the X framebuffer is 1920x1080,
and the fixture background bounds remain x4..1283, y4..975, matching the saved
1280x972 content area.

The sidecar recorded parent PID 785217/start time 24386012 and the requested
`no_aos_sampling`, `perf` and cache-disable values. Loaded driver:
`/usr/lib/x86_64-linux-gnu/libgallium-25.2.8-0ubuntu0.24.04.2.so`, SHA256
`e37486422ecafdad74fb05bbcdcfc35300241a5f46e72b63ca442d4e0c0cca8b`,
build ID `6ccf17f6a28dda1c4c6e147c8d7503b974a501ba`. There were still zero
float-filter messages; results explicitly retain
`samplerBranchProof: unavailable-release-log`.

Evidence is in the fresh `mesa-float-on-completion/` sibling directory:
`results.json`, `process-evidence.json`, identity manifests and four comparison
JSON files containing every changed pixel. The original stopped directory was
not rewritten. Before/after manifests match, including preserved evidence;
owned browser/Xvfb/profiler process searches were empty after completion.
Runner exit 1 records the pixel failures, not an infrastructure failure.
Syntax, focused lint and diff checks passed. The run log is
`artifacts/opacity-mesa-completion-run.log`; DB event 169 and a direct coordinator
notification report the checkpoint.

This process-local driver configuration did not equalize the two rendering
paths. The broad changes show that the diagnostic is not interchangeable with
normal-driver acceptance, but do not identify the exact canvas sampler or prove
a root cause. No compensation, tolerance change, production source edit,
rebuild, package, install, Pi action, default enable or push followed. Further
work requires results review.

### Final sampling-operand diagnostic patch (review gate, no browser build)

DB179 authorized the six-file diagnostic implementation and focused tests.
This does not authorize another browser runtime, ARM build, package, install,
Pi action, default enable, or push. Prior fixtures, binaries and pixel failures
remain the acceptance baseline; the normal-driver cross-mode FAIL20 and Mesa
FAIL83087 have not been repaired or reclassified.

The implementation touches these existing files under `gfx/wr/webrender/src/`:

- `renderer/mod.rs`: gated selection, post-deferred-UV snapshots, actual quad
  emission hooks, CPU texture/task/target metadata and trace termination.
- `renderer/init.rs`: private one-shot trace state initialization only, in
  addition to the already present prototype edits.
- `renderer/composite.rs`: prepared-instance/actual-emission joins, final shader
  variant and texture-size uniform, composite target and clear metadata.
- `renderer/gpu_buffer.rs`: checked, copied float/integer block accessors.
- `gpu_types.rs`: copied primitive words and composite attribute bits.
- `transform.rs`: masked transform index and copied matrix bits.

The new `renderer/sampling.rs` helper owns bounds, joins, checked decoding and
bounded JSON formatting. It has no Gecko, GL, or external-crate dependencies.
There are no new shaders, preferences, public interfaces, GL calls, texture
allocations, fences, readbacks, filter changes or rounding changes in this
diagnostic increment. Earlier experimental opacity/AA changes remain separate.

`SURFACE_PROMOTION_LOGGING && thread_is_being_profiled()` gates diagnostic scans,
snapshots, allocations and formatting. A Renderer searches at most128 eligible
unrendered/present frames for a uniquely linked320x180 RGBA8/BGRA8 image. Absence
continues the search; ambiguity, limits or selection spend it permanently.
Flag cycling cannot rearm it. Selection inspects at most512 tasks,64 deferred
resolves and64 external surfaces. The trace permits128 quad inputs/emissions,
64 tasks/targets (including composition targets),64 composite inputs/emissions,
4096 referenced blocks,64 transform copies and256KiB marker text, with16KiB per
nonterminal record and reserved terminal space. Snapshot traversal itself is
additionally capped at128 visits and returns immediately after failure.

Snapshots occur after `update_deferred_resolves` and
`apply_deferred_uv_copies`, before upload. Actual alpha/opaque batch and direct
primitive draw hooks join words and texture bindings to those snapshots.
Destination tasks must match the actual target; source reachability propagates
through emitted quads and must reach an emitted composite. Composite joins
require identical attribute bits, binding and shader features, not merely a
candidate or batch counter. Each payload has schema1 and an opaque tuple of
document, Renderer frame and device CPU submission IDs. The submission ID is
explicitly not GPU completion. IDs from Debug output are treated only as opaque
identities; no Debug text is parsed into numeric operands.

Coordinator review corrections included:

- `clear_bits` is explicitly an integer array or JSON null. It never serializes
  Rust `Some(...)`/`None`, and absent clear is not a fabricated all-zero clear.
- Quad scissors use the final framebuffer rect from `build_scissor_rect` or
  `to_framebuffer_rect`. Producer render area, draw offset/dimensions, target
  clear rect and enabled draw scissor are separate fields.
- CPU allocation size/format/filter/kind and target format/filter/swizzle are
  required parser fields. Missing values are rejected, not accepted as unknown.
- CPU producer descriptors do not fill unknown external GL allocation or sampler
  fields. GPU `textureSize`, interpolated weights, sampled/intermediate texels,
  rounding and exact Mesa sampler branch remain unmeasured. Known CPU shader
  uniform bits are distinguished from GPU `textureSize`.

Conservative unsupported paths produce `incomplete`: native compositing,
untraced target blits/resolves, picture blits, precise per-rect clears, missing
inputs/targets, limits and unmatched or un-emitted draws. This may stop a future
capture rather than yield a usable trace; it must not be loosened to claim
completeness. Structural completeness cannot establish a root cause by itself.

Verification at this checkpoint:

- Standalone helper tests:14/14 pass with Rust2018 and a30-second run watchdog.
  Covers gating/no scan, bounded absence, ambiguity, no rearm, address/sentinel
  decoding, overflow, stop-after-failure, emission joins and task/target chains.
- Node JSON/parser tests:37/37 pass with a30-second watchdog. Includes actual
  Rust-produced array/null records, complete synthetic direct/quad paths,
  missing begin/end, mixed tuples, malformed JSON, output limits, missing draw
  links/CPU fields, wrong shader operands/variant and fabricated unknown values.
- Missing CPU metadata negatives first failed6/6 against the permissive parser;
  `artifacts/opacity-sampling-parser-required-red.log` preserves that result.
- Offline vendored `cargo check -p webrender --lib --locked -j 2` passes using
  the existing generated `BUILDCONFIG_RS`, with a120-second final watchdog.
  `artifacts/opacity-sampling-cargo-final.log` contains the result. This is a
  library type-check in a separate scratch target, not a native browser build.
  Existing SWGL C++ warnings remain. Initial checks exposed an uncached standalone
  workspace dependency, missing build configuration, Rust2018 trait import and
  non-Debug tile enum; those logs were retained and the latter two fixed within
  the approved files, without dependency changes.
- Focused ESLint, whitespace/trojan-source lint and `git diff --check` pass.
  The checkout has no standalone `prettier` mach linter; formatting used the
  existing local Prettier binary, followed by the supported ESLint runner.
- The native `dist/bin/libxul.so` SHA256 remains
  `a9bf59ec5763ea60ad4797795c2039e1358750152d00d21a0934e43302393461`.
  No runtime binary was rebuilt by these library checks.

Test entrypoints are `tools/umbrafox/tests/opacity/sampling-state.rs`,
`sampling-json.rs`, `sampling-json.test.mjs` and `parse-sampling.test.mjs`.
`parseSamplingRecords` in `parse-sampling.mjs` accepts the ordered text payloads
of one submission's `WR sampling operands` markers. Do not mix Renderer streams
or omit incomplete/truncated records to manufacture a successful parse.

The pre-approved next proposal remains four separately authorized native
captures: feature OFF/ON crossed with logging OFF/ON under normal Mesa. Each
must retain same-mode framebuffer AE0, source readback hash, repeats and geometry.
Logging OFF must emit no new sampling markers. Logging ON needs complete actual
CPU joins. Tests and compilation do not establish these runtime properties.
The temporary diagnostic adds no web-facing API or marker; enabled profiling
necessarily has performance/timing overhead. This checkpoint grants no
production-toggle or absolute timing-indistinguishability claim.

### Authorized native build and first control: STOP on manifest lifecycle

DB191 authorized one x86 native build followed by four ordered controls, each
gated before the next. The current AA runtime was preserved using dereferenced
copying at `sampling-operands-validation/aa-runtime/` under the existing durable
evidence root. It has no symlinks; every file matched the original relative SHA256
manifest before building and the preserved copy verified again after testing.
Tracked source diff and source/test hashes were saved alongside it.

`CARGO_BUILD_JOBS=2 timeout --signal=TERM --kill-after=30s 90m ./mach build -j 2`
passed in74 seconds. Log: `artifacts/opacity-sampling-native-build.log`.
New native libxul SHA256:
`1458e213e47e1afb2142117d2176e0aa7236410c31b5569fbcc3e92ed76c74a7`.
The preserved AA libxul remains
`a9bf59ec5763ea60ad4797795c2039e1358750152d00d21a0934e43302393461`.
No package or installation followed, as explicitly required by this gate.

The owned `sampling/capture.mjs` changed only to accept an optional logging flag
and select the existing preference. Its default remains ON. Fixture, readiness,
delays, screenshots and readback behavior were unchanged. `sampling/control.mjs`
runs one control with a180-second capture watchdog and records allowlisted
process environment, raw profile, unfiltered ordered operand markers, shader and
promotion sidecars, pixel comparisons and before/after identity checks. Syntax
and ESLint passed before execution. The control has no automatic retries.

Only featureOFF/loggingOFF ran. Evidence: `sampling-operands-validation/off-off/`.

| Gate | Result |
| --- | --- |
| Same-mode preserved framebuffer | AE0 |
| Repeated framebuffer | AE0 |
| Source readback | `6e5e9bdd` |
| Geometry |1280x972/DPR1, framebuffer1920x1080, expected background bounds |
| Actual experimental shader selections |0 |
| New operand markers with logging OFF |0 |
| Normal Mesa override environment | Three diagnostic override variables absent |
| Complete post-run identity manifest | **STOP**: `browser/.purgecaches` missing |

The manifest had8244 entries: all passed before capture,8243 passed afterward,
and the only failure was inability to open the now-absent build cache-invalidation
marker. Read-only source follow-up found Firefox's `XREMain::XRE_mainRun` startup
path constructs `FILE_INVALIDATE_CACHES` (`.purgecaches`) and removes `flagFile`
after checking startup compatibility. This explains an expected lifecycle that
the all-files manifest had not modeled; it is not permission to suppress the
failure retrospectively. The original manifest and STOP result are unchanged.

The browser PID893202/start time24786124 no longer exists. Owned capture/Xvfb
process searches and profiler session list are empty. Raw profile, frame/repeat,
marker sidecars, process evidence and full manifest output were retained.
Coordinator was notified directly and through the shared DB. No remaining three
controls, rerun, rebuild, manifest relaxation, source repair, ARM work, package,
installation, Pi action, default enable or push occurred.

Proposed review-only reconciliation: recognize exactly this consumed build marker
as mutable startup state while retaining its original hash and disappearance
evidence, and preserve strict identity checks for all executable/content/test
inputs. Resuming the remaining controls requires coordinator authorization;
no pixel, readback, geometry, marker or parser gate should change.

### Exact-sentinel continuation: remaining controls PASS

DB196 authorized only the reviewed startup-sentinel exception. The original
8244-entry manifest and OFF/OFF STOP result remain byte-identical. A separate
`sampling-operands-validation/continuation-identities.sha256` removes only the
exact newline-hash entry for `dist/bin/browser/.purgecaches`; its other8243 lines
are unchanged. `continuation-review.json` records both manifest hashes, the
original STOP hash and the expected present-to-absent transition. OFF/OFF was
reused, not rerun. The sentinel remained absent before and after each new control.

| Feature / logging | Same-mode AE / repeat AE | Shader selections | Operand records | Strict trace joins |
| --- | --- | --- | --- | --- |
| ON / OFF |0 /0 |87 |0 | Not required with logging OFF |
| OFF / ON |0 /0 |0 |59 |10 quads,10 draws,5 composites |
| ON / ON |0 /0 |87 |47 |8 quads,8 draws,5 composites |

All three fresh controls passed the unchanged runner gates and180-second capture
deadline. Each retained readback hash `6e5e9bdd`,1280x972/DPR1 viewport,
1920x1080 framebuffer and exact background bounds. All8243 identities passed
both before and after each control. The process sidecars verify the three Mesa
diagnostic overrides were absent. Logging ON recorded87 preferred candidates
in each run:0 promoted with the feature OFF,87 promoted with it ON. Ordered raw
records passed the strict parser without filtering, overflow suppression,
incomplete-record removal or bound changes.

Fresh evidence is under `sampling-operands-validation/{on-off,off-on,on-on}/`:
raw profiles, ordered operands, promotion/shader markers, frame/repeat images,
process sidecars, hash-check logs and result files. `continuation-results.json`
summarizes these gates and verifies preservation of the original STOP and both
manifests. Browser parent PIDs910386,912422 and914908 no longer exist; no owned
capture/Xvfb processes or profiler sessions remain. Coordinator received direct
tmux notifications (including Enter) and DB checkpoints.

This establishes diagnostic same-mode pixel preservation for these controls,
not correctness of the experimental optimization. The normal OFF/ON20-pixel
failure and prior Mesa83087-pixel failure remain unresolved. No renderer, runner,
fixture or oracle changes, additional build, package, installation, ARM/Pi work,
default enable or push occurred during this continuation. Final GPU sampling
weights/texels and driver sampler branches remain unknown; complete CPU joins
do not make those values observable.
