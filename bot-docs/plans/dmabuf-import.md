# Upstream Linux Canvas Video Import

## Progress

- Gates 1-4 pass: source provenance, failing-first and expanded compiled checks,
  30 focused readback tests, exact-file lint, and isolated delta review.
- Gate 5 passes: configured two-job native build, separate package, clean
  extraction, source/index/build-ID guards and isolated version check. No install.
- Gates 6-7 remain pending on the packaged default-OFF candidate.

## Evidence And Scope

Continue the authorized performance program using upstream bug2070629,
reland a3c328e4aff34a383827dc4b23f96001a3975428 (D327325), not its backed-out
first landing. The tested October1/3 packages reject DMABuf descriptors for
remote Canvas2D. The above-threshold default fixture changes from accelerated
recording to shared Skia within120draws. The upstream report names recurring
CPU uploads as one demotion cause; that is not yet our runtime attribution.

Backport the13 upstream files with the default-OFF GTK preference unchanged.
No WebIDL, public diagnostics, automation flags, product enable, browser restart
or installation. No broad upstream merge in the dirty checkout. Preserve all
preexisting source/index changes and both sealed packages. This implementation
is a candidate, not permission to waive exact-pixel parity.

## Integration Contract

HTMLVideoElement/VideoFrame -> validated GPUVideo remote decoder handle ->
recorded canvas stream -> content-owned VideoBridge texture lookup -> DMABuf
descriptor -> SharedContextWebgl import -> existing TexUnpack/GLBlitHelper ->
BGRA-compatible GPU source. Failed import retains upstream CPU fallback.
No raw file descriptors are added to the recorded stream. Other decoder types,
software hints, filters/shadows, taint checks and non-GTK behavior stay intact.

Three conflicts require deliberate union, not wholesale replacement:

- CanvasRenderingContext2D keeps existing V2 scaled deferred readback for HTML
  video when the direct path is unavailable, including after provider demotion.
  VideoFrame receives upstream DMABuf-only direct admission and normal fallback.
- GLBlitHelper::Blit keeps bool aScaleSourceToDest=false and appends upstream
  destination format after it. BlitSdToFramebuffer forwards false for scaling
  plus the format. Existing V2 calls with a final bool retain their meaning.
- GLBlitHelper's aligned-size/texture-matrix behavior is unchanged; only the
  upstream destination-channel conversion is added for explicitly tagged imports.

The source default remains false. Before enabling even in isolated tests,
build, package, exact source identity, native roots and owned cleanup must pass.
No new pixel/filtering exception is inferred from performance authorization.

## Gates

1. Preserve13-file before hashes/diff, upstream patch/hash and exact conflict
   report. Verify the reland's GTK shader guard and current review history.
2. Failing-first compiled actual-source admission tests: wrong union types,
   output preservation on rejection, Buffer/DMABuf/D3D/mac/unknown kinds, pref
   OFF/ON, null output, GTK/Windows/mac/other compilation. These use type doubles,
   not Gecko ABI or GPU execution proof. Commands bounded90s overall/20s compile.
3. Source contracts: OFF preference, format forwarding/defaults, strict decoder
   admission and preserved V2 helper/scaling. Run existing readback Node tests.
4. Review the13-file delta separately from preexisting work; exact upstream
   equality for non-conflicting files, documented semantic union for conflicts.
5. Native configured build with resource checks and at most2 jobs; package as
   a new candidate. No installation. Compile/platform/pixel failures remain open.
6. Fresh owned laptop baseline/candidate OFF/ON: native roots, stable package
   identity, default/readback canvases, actual accelerated provider, decoder and
   private import/readback evidence. First correctness, then bounded alternating
   moving-video trials. Preserve failures, original heuristics and fixed caps.
7. Pixel oracles cover alpha/channel order/YUV conversion, crop/scale/rotation,
   filter/shadow, default/readback, stale/closed frames, import failure and context
   loss. Existing nine-variant/two-frame oracle is a starting point, not full
   platform coverage. ON pixel disagreement blocks default enable/dogfood.

The old default pixel case is only110x75, below the observed128^2 acceleration
threshold, and cannot admit this import path. Use fresh above-threshold canvases
and record the provider immediately after each draw, before pixel readback.
Keep a same-binary OFF/ON comparison distinct from comparisons against older
packages. Provider identity alone does not count successful GPU imports.

No benefit claim from upstream figures or source tests. Prefer this established
import mechanism over forcing acceleration or weakening synchronization. A
broader upstream refresh should be considered separately after dirty work is
checkpointed; the current baseline is from September26.
