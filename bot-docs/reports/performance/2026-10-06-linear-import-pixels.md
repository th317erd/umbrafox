# Linear Import Pixel Localization

## Result

The raw-byte diagnostic reproduces all 48 ordered hashes of each corresponding
old arm. Its OFF run also matches the second old OFF run. The OFF/ON comparison
still differs at 18 positions; changing retained raw buffers did not change the
observed output sequence. Both fresh captures completed and cleaned up.

The unfiltered linear difference is substantially larger than the previously
measured one-level blur difference:

| Paused time | Changed pixels / 57600 | Changed components | R / G / B / A | Maximum absolute channel delta | Total absolute error |
| --- | ---: | ---: | --- | ---: | ---: |
| 0.5 seconds | 3575 | 7860 | 1987 / 3473 / 2400 / 0 | 94 | 45640 |
| 2 seconds | 3157 | 7201 | 1882 / 3096 / 2223 / 0 | 100 | 66314 |

Both repeats give exactly these results. Changed pixels are 6.21% and 5.48%
of their respective 320x180 canvases. These are decoded RGBA byte differences,
not estimates from screenshots. Neither arm is yet established as the correct
Firefox output. No perceptual-quality or playback-stutter attribution follows.
Odd-size, smoothing-disabled and alpha cases remain hash-only measurements.

The retained arrays are canonical base64, exactly 230400 bytes each, joined to
their SHA-256 and distinct-value count. Host analysis recomputes differences
with the existing tested `pixelDifference` and independently cross-checks
component counts, distinct changed-pixel indices, maximum and total error.
Per-component delta histograms and coordinate bounds are preserved in
`linear-pixels/linear-differences.json`.

## Correct Reference Required

The ordered OFF/ON gate is a relative regression test, not a Firefox oracle.
OFF contains our earlier V2 scaled-readback work. Requiring every future GPU
path to reproduce OFF without verifying OFF could preserve an existing
web-visible difference, contrary to the mandatory rulebook.

The local upstream merge `2dea4d2a794bc018b6b72eb605389c3c1c32d45b` identifies
`08a61e1a51dbb4dbff0bb8e9ef97ad19c3afb156` as its upstream parent. Exact
historical `CanvasRenderingContext2D.cpp` and `nsLayoutUtils.cpp` blobs are
retained under `linear-pixels/upstream-reference/`, with hashes and provenance
in `upstream-reference.json`. This is source evidence, not a tested reference
binary or a complete deployed-source equivalence claim.

In that historical `ValidSurfaceDescriptorForRemoteCanvas2d`, DMABuf is not an
admitted remote type. The accelerated HTML video path in `DrawImage` therefore
falls back through `mLayersImage->GetAsSourceSurface()` and surface optimization.
The historical `SurfaceFromVideoFrame` also reads that source surface when a
draw target is supplied. Neither route requests a destination-sized readback.

In our pinned candidate, `MaybeGetScaledSourceSurfaceForRemoteVideo` instead
permits destination-sized readback for the eligible HTML video downscale. The
new import route uses `SharedContextWebgl::ImportSurfaceDescriptor`, whose
texture allocation and `structuredSrcSize` are based on the supplied source
size, then draws that imported surface. `GLBlitHelper::Blit` handles YUV/RGB
conversion and the V2 scaling parameter separately. Thus conversion and
downscaling order is a concrete source distinction worth testing.

The unchanged OFF VideoFrame and shadow hashes match ON linear at both times;
OFF linear matches the explicit-readback control. That supports the source
lead, but does not certify which branch ran or prove the old Firefox output.
Do not describe ON as definitively wrong, OFF as correct, or a V2 parity bug as
runtime-proven. Also do not dismiss maximum deltas of 94 and 100 as rounding
noise merely because the earlier filter deltas were one level.

Searchfox was used for current upstream discovery; the historical Git blobs,
not today's indexed source, are authoritative for the old source comparison.
The CLI reports 0.20.4 available versus installed 0.18.0; no upgrade was made.

## Test Change And Verification

Plan: `bot-docs/plans/linear-import-pixels.md`. New diagnostic siblings are
`linear-pixels.mjs`, `linear-pixels-capture.mjs`, `laptop-linear-pixels.mjs`
and `test/linear-pixels-spec.mjs` in `artifacts/umbralink-control/`.
All twelve cases, two repeats, paused targets, draws, observation order,
attributes, media checks, transport and private native receipts remain.
Only linear rather than filter retains raw pixels, preserving payload caps.
The original modules and sealed failures are not changed or weakened.

The behavioral RED test failed because the original collector did not retain
linear bytes. Final verification passes 81 focused tests in 6.89 seconds.
Coverage includes an AST proof of the collector's single retention-literal
change, capture/driver operation equivalence, exact emitted child execution,
seek/media/draw/read failures, malformed base64/hash/counts, stale identities,
preference mismatch, request scope, timeout/listener cleanup, failed writes,
raw-before-validation persistence and real saved-evidence replay. Exact-file
formatting uses `--ignore-path /dev/null`, avoiding the earlier ignored-file
verification problem. Native source and staged-index guards remain unchanged.

## Runtime And Cleanup

Host: `wyatt-laptop`; candidate BuildID `20261006023500`; isolated harness
`~/.cache/codex/linear-pixels-harness-20261006-vv0Egr`.
Both preflights verify 62 harness and 46 pinned package files, at least 4 GiB
available memory and disk, and no detected browser/build activity. Fresh
private installation/profile/app-data/local-app-data/temp roots are used.

| Arm | Root suffix | Controller / browser PID | Duration ms | Export files / bytes | Peak sampled artifact bytes |
| --- | --- | --- | ---: | --- | ---: |
| OFF | eLkE9u | 1284000 / 1284015 | 16615 | 38 / 1386821 | 65150845 |
| ON | jlBUX8 | 1286283 / 1286315 | 16232 | 38 / 1386665 | 65093115 |

Roots start with `~/.cache/codex/laptop-linear-pixels-`, then arm and date.
Each run has six resource samples, clean SIGTERM, positive root absence,
271-byte logs with zero drops and a passing 46-file installation postcheck.
Both controllers and exporters exited 0; all 24 recorded owned PIDs were
absent at export. Profiles, tokens and other private directories were excluded.
The owned-path native receipts are post-startup evidence only, not proof of
no earlier access, no external network activity or all transient helpers.

Existing capture 120s, cleanup 15s, controller 220s, SSH 240s and artifact
256 MiB limits are unchanged. No profiler, desktop interaction, native edits,
default change, install, staging or commit occurred. No owned runtime remains
from these captures. The prior ordered-pixels seal remains intact.

## Next Gate

Establish the corresponding-Firefox/full-size reference before changing the
GPU output to match V2. A source-equivalent isolated reference build must have
an explicit minimal delta and provenance; a same-binary control alone is only
supporting evidence. Do not expand blur diagnostics or add tolerance to make
the present comparison pass. Once reference parity is established, address
import failure/context loss and measure alternating sustained moving-video
trials. No current evidence proves a speedup or fixes the owner's stutter.

Evidence root: `artifacts/umbralink-control/linear-pixels/`; final seal:
`artifacts/umbralink-control/linear-pixels-final.sha256`.
