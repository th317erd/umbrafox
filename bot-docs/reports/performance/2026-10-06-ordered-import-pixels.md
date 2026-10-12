# Ordered GPU Import Pixel Comparison

## Result

Two isolated laptop OFF captures match all 48 ordered pixel hashes exactly.
One subsequent ON capture differs at 18 of 48 positions against either OFF
capture. The relative pixel gate FAILS. The candidate remains default OFF and
uninstalled; no timing or speedup acceptance follows from these captures.

The original within-run repeat-stability failure is preserved. This new gate
compares complete ordered sequences across runs, without tolerance, masking,
omitted cases or repeated attempts to obtain a passing ON result. It does not
replace the original gate or establish stock Firefox equivalence.

| Case | Differing repeats at 0.5 seconds | Differing repeats at 2 seconds |
| --- | --- | --- |
| Linear | 0 and 1 | 0 and 1 |
| Odd dimensions | 0 and 1 | 0 and 1 |
| Smoothing disabled, named nearest | 0 and 1 | 0 and 1 |
| Alpha | 0 and 1 | 0 and 1 |
| Filter | 1 | 1 |

The remaining 30 positions match exactly. Crop, fractional dimensions,
transform, shadow, VideoFrame, raw-RGBA VideoFrame and explicit-readback cases
are unchanged across arms. Both video timestamps are distinct and validated.

Raw destination buffers are retained only for the filter case. Independent
byte comparison gives 11 changed pixels/components at 0.5 seconds, distributed
R4/G4/B3/A0, and three at 2 seconds, R1/G2/B0/A0. Each changed component differs
by one level. Filter repeat 0 matches at both timestamps. No magnitude or
visual-quality claim is justified for the other mismatching cases: only their
hashes were retained.

All ON pairs repeat identically within that run, including filter. OFF filter
pairs do not. Thus ON is not being rejected for unstable repetition or a crash;
it is rejected for differing from the controlled OFF output sequence.

## Source Lead And Limits

At both timestamps, ON linear output equals OFF shadow and OFF VideoFrame
output. OFF linear instead equals OFF explicit readback and OFF nearest output.
These are exact hash relationships, recorded in `runtime-summary.json`.

The pinned local `CanvasRenderingContext2D::DrawImage` implementation retains
the V2 `MaybeGetScaledSourceSurfaceForRemoteVideo` path. Eligible DMABuf video,
zero rotation, identity transform, LINEAR sampling, a full source rectangle
and an integer downscaled destination can request a destination-sized source
surface. The caller then rewrites the source rectangle to that returned size.
The new descriptor-import route and this older path need not perform color
conversion, rounding and resizing in the same order.

The observed relationships are consistent with destination-sized conversion
versus full-size conversion followed by scaling. They do not prove which native
branch executed, establish an import count, identify a shader or connect the
differences to the owner's intermittent YouTube stutter. Shared GPU state and
the fixed draw order remain confounders, including for the filtered case that
source admission excludes from direct import.

The case named nearest sets `imageSmoothingEnabled=false`; it does not prove
POINT sampling. The pinned `DrawImage` selects LINEAR when both dimensions
downscale even with smoothing disabled. These cases meet that condition.
Do not infer a nearest-filter defect from the case label.

No native code changed in this experiment. All 13 native inputs are checked
against `dmabuf-import/source-before-build.json`. Actual import execution,
failure propagation, context loss, corresponding Firefox parity and moving
performance remain open requirements. A potential GPU solution must preserve
the intended scaling/conversion output and failure behavior, not waive the
pixel test or merely enable a preference.

## Fixture And Verification

Plan: `bot-docs/plans/ordered-import-pixels.md`. New artifact siblings:
`ordered-pixels.mjs`, `ordered-pixels-capture.mjs`,
`laptop-ordered-pixels.mjs`, and `test/ordered-pixels-spec.mjs`.
The original twelve-case collector, native observer, raw filter buffers,
paused targets, transport, capture envelope and cleanup are reused unchanged.
The new validator reports repeat changes instead of asserting stability; all
media, identity, provider, preference, schema, byte and hash checks remain.
It additionally validates expected arguments and recomputes distinct-value
counts for retained raw buffers.

Behavioral RED tests caught missing expected-argument admission and inconsistent
raw distinct-value counts before capture. The final focused suite has 69 passing
tests in 7.24 seconds, including replay of the real saved OFF/OFF and OFF/ON
results, exact 18-mismatch counts, existing page/transport/fault cases and native
source-admission contracts. Passing harness tests do not turn the failed browser
pixel comparison into acceptance.

Evidence root: `artifacts/umbralink-control/ordered-pixels/`.
`baseline-comparison.json`, `on-comparison.json`, `runtime-summary.json`, the
three exported runs and their original export envelopes preserve the results.
`verification.json` records source/index guards and commands. The final seal is
`artifacts/umbralink-control/ordered-pixels-final.sha256`.

### Formatting Evidence Correction

Earlier artifact-only Prettier invocations without `--ignore-path /dev/null`
could exit successfully while skipping files ignored by the repository. Those
earlier formatting PASS labels are not proof that the files were checked.
Old sealed sources and reports are preserved, not silently rewritten.

This experiment's four new fixture/test files were actually formatted with the
ignore override. The two support scripts, `preflight.mjs` and
`export-evidence.mjs`, were formatted after capture; their exact executed
versions remain in `*-captured.mjs` and the harness archive. Final guards compare
55 current harness inputs directly and those two captured versions against the
57-file manifest. Parsed AST equivalence checks separately verify that the two
current support files differ only in representation. Their current byte hashes
must not be reported as the hashes executed during capture.

## Runtime And Cleanup

Pinned candidate BuildID `20261006023500`, on `wyatt-laptop` only. Harness:
`~/.cache/codex/ordered-pixels-harness-20261006-Mx5MAO`.
All 57 harness and 46 package files passed admission before each run;
46-file installation checks also passed afterward. Each run has a fresh private
installation/profile/app-data/local-app-data/temp allocation.

| Arm | Root suffix | Controller / browser PID | Elapsed ms | Export files / bytes | Peak sampled artifact bytes |
| --- | --- | --- | ---: | --- | ---: |
| OFF 1 | EQW1gZ | 1272775 / 1272787 | 16561 | 38 / 1386783 | 65151035 |
| OFF 2 | w1YWYR | 1275059 / 1275071 | 16586 | 38 / 1386843 | 65093233 |
| ON 1 | qdbJEM | 1277352 / 1277364 | 16454 | 39 / 1388433 | 65119338 |

All root paths start with `~/.cache/codex/laptop-ordered-pixels-`, followed by
the arm and `20261006-` suffix. Each run has six resource samples, a 271-byte
browser log and zero log drops. Controllers and exports exited 0; all captures
report clean SIGTERM and root absence. Export-time checks found all 36 recorded
controller/browser/child PIDs absent. Native receipts validate owned paths and
PID/build/document joins, but are post-startup observations, not proof of no
earlier access, no external networking or every transient process.

The 120-second capture, 15-second cleanup, 220-second controller, 240-second SSH
and 256 MiB artifact limits remain unchanged. Export validation checks bounded
file sizes, aggregate size, exact hashes and bytes; profiles and tokens are
excluded. No profiler, desktop browser interaction, installation, staging or
commit occurred. A driver status of pass means diagnostic capture completed,
not that pixel equivalence passed.

## Next Gate

Retain the OFF/ON failure and default OFF. Localize the linear-case difference
with bounded raw pixels and the pinned conversion/scaling source path before
designing a pixel-preserving GPU implementation. Broaden format/size/failure
coverage only for a justified correction. No further ON or timing run is
authorized by this completed experiment itself; subsequent work must retain
the existing owner permissions and explicit test plan.
