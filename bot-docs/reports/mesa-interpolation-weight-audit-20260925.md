# Installed Mesa interpolation and sampling-weight audit

## Contract and verdict

Read-only checkpoint for `scaled-v2 / browser-review`, coordination event 212.
This report owns coordinate interpolation, sampling-weight conversion, and
selection predicates. The coordinator owns sampled-color/output quantization
and blending. No browser/driver source change, build, capture, installation,
Pi action, default enable, push, or oracle relaxation occurred in this audit.

**Verdict: candidate mechanism established, actual execution path and cause
not established.** Mesa has a concrete float-to-integer threshold in one
bilinear sampling implementation. Consistent offline triangle/interpolation
models can move that weight threshold on the failing row. None of the modeled
choices changes weights at all 20 differing pixels, and all predict some
weight differences on rows with identical captured pixels. Different weights
do not necessarily produce different output bytes. Therefore these results
neither reproduce the signed pixel failure nor rule out interpolation as a
contributor.

Another unresolved selector is significant: llvmpipe can recognize rectangles
and use its linear rasterizer rather than the general triangle path modeled
here. A general AOS-versus-SOA sampling model is not exhaustive until that
upstream selector is known. Do not infer either route from the environment
variable, the llvmpipe renderer string, or these numeric coincidences.

The normal comparison remains **FAIL: 20 pixels / 20 channels**, all on root
screenshot row 339. Existing larger failures and all prior controls remain
preserved. No repair is recommended from the current attribution evidence.

## Evidence and provenance

Evidence directory on wyatt-desktop:

```text
/home/wyatt/.cache/codex/l8ros/opacity-prototype-20260925/sampling-operands-validation/mesa-audit/
```

Artifacts:

- `model.mjs`: offline CPU-only coordinate and weight formulas.
- `model-results.json`: 12 conditional cases, every 643 by 367 position,
  per-row summaries, and individual values at 20 differing plus 78 equal
  comparison points. Equal points include nearby controls.
- `installed-packages.txt`: current installed Mesa package/source versions.
- `mesa.dsc`, original and Debian tarballs, and extracted source/patch lists.
- `audit-identities.sha256`: source archives, audited source files, analysis
  files/input, and current installed driver identity.
- `identities-after.log`: all 8,243 frozen continuation identities verified.

Installed amd64 `mesa-libgallium`, `libgl1-mesa-dri`, `libglx-mesa0`, and
`libegl-mesa0` report source/version `mesa 25.2.8-0ubuntu0.24.04.2`.
`dpkg --verify mesa-libgallium:amd64` returned success with no differences.
Current shared-object identity:

```text
/usr/lib/x86_64-linux-gnu/libgallium-25.2.8-0ubuntu0.24.04.2.so
SHA256 e37486422ecafdad74fb05bbcdcfc35300241a5f46e72b63ca442d4e0c0cca8b
ELF build ID 6ccf17f6a28dda1c4c6e147c8d7503b974a501ba
```

The saved captures report llvmpipe, LLVM 20.1.2, 256-bit vectors, Mesa
25.2.8.0. This agrees with the installed package version; it does not prove
the exact historical mapped DSO or a particular JIT path. Historical process
maps and generated sampler machine code were not captured.

Matching primary source came from the Ubuntu archive:

- [Source descriptor](https://security.ubuntu.com/ubuntu/pool/main/m/mesa/mesa_25.2.8-0ubuntu0.24.04.2.dsc)
- [Original source](https://security.ubuntu.com/ubuntu/pool/main/m/mesa/mesa_25.2.8.orig.tar.xz)
- [Debian changes](https://security.ubuntu.com/ubuntu/pool/main/m/mesa/mesa_25.2.8-0ubuntu0.24.04.2.debian.tar.xz)

The archive hashes match the descriptor:

```text
orig   097842f3e49d996868b38688db87b006f7d4541e93ce86d2f341d8b3e7be7c93
debian 0a9571bb53628d9fb934e8f02bbbe7e7fb411fece5f46f3cc50a7aa7f2615e5b
```

The descriptor signature was not independently verified. The seven listed
distro patches affect util tests/meson, GLX, PPC assembly configuration,
Intel Vulkan, SPIR-V, and NIR. They do not patch the inspected Gallivm and
llvmpipe interpolation/sampling functions. This is not a claim that the
installed compiler is unpatched. Debian build configuration disables debug
assertions and selects LLVM 20; the earlier unavailable release debug output
is still not per-draw branch proof.

## Producer-to-consumer map

Names below refer to the verified downloaded Mesa tree, not a moving branch.

| Stage | Producer/consumer | Relevant operation |
| --- | --- | --- |
| Vertex viewport | `draw/draw_llvm.c`, `generate_viewport` | Reciprocal W, multiply, viewport `llvm.fmuladd` |
| Primitive selection | `llvmpipe/lp_setup_vbuf.c`, `rect` | Try rectangle setup; otherwise dispatch the two triangles |
| Triangle orientation | `llvmpipe/lp_setup_tri.c`, `triangle_both` | Fixed-point area sign; reorder original float vertices according to winding and provoking-vertex state |
| Coefficient generation | `llvmpipe/lp_state_setup.c`, `init_args`, `calc_coef4` | Float32 area reciprocal, derivatives and extrapolated attribute origin |
| Fragment interpolation | `llvmpipe/lp_bld_interp.c`, `interp_attrib_linear` | `fmuladd(dadx, x, a0)`, then `fmuladd(dady, y, a)` |
| General sampler selection | `gallivm/lp_bld_sample_soa.c`, `lp_build_sample_soa` | AOS eligibility and vector-width decision, otherwise general sampler |
| AOS linear coordinates | `gallivm/lp_bld_sample_aos.c`, `lp_build_sample_image_linear` | Float multiply, integer rounding, half-texel subtraction, integer base/weight extraction |
| SOA linear coordinates | `gallivm/lp_bld_sample_soa.c`, `lp_build_sample_wrap_linear` | Float unnormalize, half-texel subtraction, floor and float fractional weight |
| Architecture rounding | `gallivm/lp_bld_arit.c`, `lp_build_iround` | SSE2/AVX conversion versus other architecture fallbacks |

The Firefox inputs are the immutable ordered operand records from the
`off-on` and `on-on` controls and the preceding `coordinate-audit/results.json`.
The source atlas is 2048 by 2048 with UV endpoints `[0,16,320,196]`, sampled
over 643 by 367 pixels. The reference first pass is framebuffer-local;
the promoted pass uses final framebuffer coordinates and reversed Y.

The prior audit established exact UV vertex endpoints after the captured
pattern-transform arithmetic. This audit begins there; it does not replace
those operands with ideal source-size ratios. Pattern transform, atlas offset,
half-texel clamp, target geometry, and Y reversal are retained.

## Conditional interpolation and conversion

For the general triangle path, let `a` be one normalized UV component.
Mesa emits ordinary float operations for coefficient generation:

```text
dx01 = x0 - x1; dy01 = y0 - y1
dx20 = x2 - x0; dy20 = y2 - y0
ooa = 1 / (dx01*dy20 - dy01*dx20)
da01 = a0 - a1; da20 = a2 - a0
dadx = da01*(dy20*ooa) - da20*(dy01*ooa)
dady = da20*(dx01*ooa) - da01*(dx20*ooa)
origin = a0 - (dadx*(x0 - 0.5) + dady*(y0 - 0.5))
a = fmuladd(dady, integerPixelY,
            fmuladd(dadx, integerPixelX, origin))
```

The `0.5` convention is conditional on the non-multisampled half-pixel-center
state. It is incorporated into the origin, not added again to fragment pixel
indices. SIMD block origins and lane offsets produce the same integer pixel
indices for this size. W is modeled as one. The two quad triangles use
indices `[0,1,2]` and `[2,1,3]`. Triangle coverage uses the ideal rectangle
diagonal as an explicitly unmeasured assumption; actual raster coverage uses
8-bit fixed subpixel positions while setup still consumes float vertices.

Coefficient operations are rounded to float32 in source order. Both fused
and separate fragment multiply-add models are applied consistently to OFF
and ON, not selected per path to fit the image. `llvm.fmuladd` permits
contraction but is not evidence that the historical generated instruction
was fused. The JavaScript fused model uses a binary64 multiply/add followed
by `Math.fround`; it is a conditional arithmetic model, not a disassembly or
an exhaustive IEEE FMA equivalence proof. Shader/viewport projection models
likewise apply consistent contraction choices rather than arbitrary offsets.

For normalized AOS linear sampling, given atlas dimension `N`:

```text
fixed = round_to_nearest_even(float32(uv * float32(N << 8))) - 128
base = fixed >> 8
weight = fixed & 255
```

The even-tie rule assumes SSE/AVX conversion with normal nearest MXCSR.
The renderer worker's actual MXCSR was not sampled. The model tests positive
and negative exact ties separately. Mesa subtracts 128 after rounding: using
`floor(uv*N - 0.5)` followed by a independently rounded weight is not
automatically equivalent. The 2048 atlas scale and its shifted form are
exactly representable; interpolation can still place the coordinate on
different sides of a tie.

For the modeled SOA clamp-to-edge path, Mesa instead unnormalizes in float,
subtracts `0.5`, computes the integer floor and float fraction. No 8-bit
weight quantization occurs at this stage. Its subsequent color arithmetic
is outside this audit's ownership.

### General sampler predicates

`use_aos` requires a format satisfying `util_format_fits_8unorm`, a texture
sampling operation, no comparison, anisotropy zero, supported simple wrap
on each relevant axis, suitable LOD/vector grouping or equal min/mag filters,
and `!static_texture_state->tiled`. Here `tiled` is set from the sparse-resource
flag; it is not evidence about general GPU memory tiling. Seamless linear
cube sampling has an additional exclusion. Simple wrap is repeat or
clamp-to-edge. `GALLIVM_PERF_NO_AOS_SAMPLING` disables eligibility.

The saved environment can establish absence of the three recorded overrides
`GALLIVM_PERF`, `GALLIVM_DEBUG`, and `MESA_SHADER_CACHE_DISABLE`, not all
predicates. Historical `LP_PERF` and `LP_DEBUG` were neither scrubbed nor
recorded; their absence is unknown. WebRender's CPU texture format/filter
metadata is not a dump of the Gallium sampler view, normalized-coordinate flag, min/mag/LOD
state, shader operation, sparse flag, or generated JIT variant. General
sampling can also split vector groups; matching renderer vector width is
not enough to select a generated sampler branch.

### Earlier rectangle/linear selector

`lp_state_derived.c::check_linear_rasterizer` permits the route for one valid
single-sample 2D color attachment of supported UNORM8 format, no depth/stencil
attachment, and one viewport. `lp_setup_set_linear_mode` additionally requires
compiled/runtime SSE2 support. `lp_setup_vbuf.c::rect` tries rectangle setup
before triangle fallback.

`lp_state_fs.c` separately determines shader/pipeline candidacy: no stencil,
depth, discard, or logic operation, plus supported color format. Fast paths
or eligible shader kinds can populate the linear function. `lp_linear.c`
adds input/constant, interpolation, sampler, and generated-function checks.
`lp_rast.c::rasterize_bin` also distinguishes debug, blit, permitted rectangle
linear, and triangle execution. Merely satisfying one of these predicates
does not prove the whole route was taken. Actual rectangle recognition,
bin classification, shader kind and final function choice were not recorded.

`LP_PERF=no_rast_linear` only blocks the linear branch in `rasterize_bin`.
It does not clear `permit_linear_rasterizer` or stop `lp_setup_vbuf` rectangle
recognition. It therefore cannot prove pure triangle setup or the triangle
coefficient values modeled above. The flag parser is a release function;
that fact is separate from unavailable compiled-out debug printing.

## All-row negative controls

All 235,981 canvas positions were evaluated for each of 12 cases: exact
geometry reference, separately projected geometry, and fused projected
geometry, crossed with both provoking-vertex choices and both fragment
multiply-add choices. All 367 rows are retained in `model-results.json`.
The summary below uses exact geometry; projected separate gives the same
AOS counts. Projected fused changes horizontal sensitivity but not the
listed vertical counts or changed-pixel intersections.

| Provoking first | Fragment fused | Weight differences at the 20 changed pixels | Equal comparison points with different weights (of 78) | Row 83 vertical | Row 338 vertical | Row 339 vertical | Row 340 vertical |
| --- | --- | --- | --- | --- | --- | --- | --- |
| No | No | 3 | 5 | 546 | 0 | 97 | 0 |
| No | Yes | 17 | 33 | 546 | 0 | 546 | 0 |
| Yes | No | 3 | 5 | 546 | 0 | 97 | 0 |
| Yes | Yes | 0 | 0 | 546 | 0 | 0 | 0 |

Separate-fragment models also change vertical weights at 157 positions on
each of rows 117 and 305. Some models change horizontal weights at one or
two positions on every row. Exact-geometry total AOS-differing positions
are respectively 1322, 1822, 1322, and 546. SOA coordinate/fraction
differences are much more widespread; this audit does not convert them
into pixel predictions.

At row 339 in the exact/fused/non-first model, most differing pixels have:

```text
OFF scaled coordinate 43207.49609375 -> vertical AOS weight 71
ON  scaled coordinate 43207.5        -> vertical AOS weight 72
```

But changed X positions 59, 62 and 64 have weight 71 in both paths in that
same model. The separate-fragment model changes weights at those three
and not the other 17. Combining these alternatives by pixel or by path
would be an unsupported fit. Row 83 is an essential counterexample to
claiming that tie sensitivity alone explains the observed locality.

`allRowNegativeControl` in the analysis JSON is a strict locality flag:
it asks whether any AOS weight difference occurs outside row 339. It is
false in every case. It is **not a pixel-oracle result**. Color plateaus,
quantization and later blending can hide weight differences. Conversely,
equal first-sample weights do not exclude differences in the removed
intermediate stages. Missing weight differences at actual failures only
defeats a candidate as a sole first-weight explanation under otherwise
identical downstream behavior, not as part of a combined driver explanation.
Root must retain those distinctions when combining
its independent output model with these conditional inputs.

## Missing evidence and bounded next proposal

Saved records cannot determine actual post-viewport vertices, rectangle versus
triangle setup, coefficient values, provoking-vertex/center/multisample state,
JIT contraction, worker rounding mode, sampler predicate values or actual
sampler implementation. The release float-filter log is not per-canvas
branch proof. Pi driver behavior cannot be inferred from this x86 llvmpipe
model.

Following coordinator reviews 217 and 218, the smallest useful runtime
proposal is a process-local dispatch-sensitivity comparison on the existing
binaries. This is a proposal only, not a new runtime authorization:

1. Fresh OFF/ON feature pair with `LP_PERF`, `LP_DEBUG`, `GALLIVM_PERF`,
   `GALLIVM_DEBUG`, and `MESA_SHADER_CACHE_DISABLE` explicitly unset. Require
   stable within-process repeats, existing source/readback/viewport identities,
   expected feature marker counts, and reproduction of the preserved normal
   20-pixel signed difference signature. Stop on any mismatch rather than
   substitute a new baseline silently.
2. Only after that gate, a fresh matched OFF/ON pair with exactly
   `LP_PERF=no_rast_linear` and the other four keys explicitly unset. Keep
   every other test operand, binary, fixture, profile template and viewport
   unchanged. Record the exact five-key allowlist in each process sidecar,
   with absence represented explicitly. Do not collect unrelated environment
   values or infer historical absence.
3. Compare feature OFF/ON within each environment and each feature mode
   across environments, including all unchanged rows and repeats. Retain the
   exact-zero oracle: a change in counts or signed residuals is diagnostic
   sensitivity, not an accepted repair. Existing failures remain preserved.

This is two feature pairs/four fresh processes, with no change to source,
driver, package, Pi, or defaults. A diagnostic script/environment-sidecar
change would need to be included explicitly in the next approved contract.
If the flag changes pixels, it establishes sensitivity to disabling linear
bin dispatch under the fresh controlled environment, not a per-draw AOS/SOA
choice or pure triangle setup. If pixels do not change, it does not establish
that linear dispatch was originally unused: the routes may agree for these
inputs. Neither result alone establishes the float/int threshold as the cause.

Root can independently join the existing weight cases to its color/quantization
model; that join must predict signed channel differences and all unchanged
rows, not merely overlap some failed pixels. Neither lane should add an
epsilon or switch lowering assumptions to fit.

If the bounded comparison remains ambiguous, a subsequent new measurement
would need a draw-correlated record of primitive/linear-function
selection and sampler predicate values first. Only for confirmed general
triangle draws would post-viewport vertices/coefficient values and final
sample coordinates discriminate these 12 models. A fresh runtime or driver
instrumentation task needs a separately reviewed contract; none is started
or implicitly authorized by this proposal.

## Verification and preserved boundary

- Offline model exited successfully; exact-tie self-checks passed.
- Structural checks passed: 12 cases, 367 rows each, 20 observed differences,
  98 recorded comparison points per case, and complete changed/equal counts.
- Reviewed formulas against `calc_coef4`, `interp_attrib_linear`, orientation
  handling, and both general sampler coordinate paths in matching source.
- Full frozen continuation manifest verification succeeded: 8,243 entries.
  Original STOP and sentinel-specific continuation evidence were not changed.
- No successful pixel repair is claimed. The exact-zero oracle remains in force.
- Only scratch analysis/provenance artifacts and this report were written.
  Existing dirty source, package exports, the live browser and the Pi were
  left alone. No runtime sessions were started for this audit.
