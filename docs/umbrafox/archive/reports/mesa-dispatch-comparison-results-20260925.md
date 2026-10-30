# Frozen Mesa dispatch comparison results

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Scope: coordination event 233, exactly one execution of the reviewed v2
helper, four disposable browser processes. No edits or retries occurred.

## Result

All four captures completed and passed their required infrastructure,
identity, geometry, readback, path, parser and repeatability gates.
Fresh baseline images matched their historical references exactly and
reproduced the exact signed 20-pixel feature OFF/ON difference.

Setting `LP_PERF=no_rast_linear` changed neither mode's pixels in this
fixture. The diagnostic OFF/ON difference is exactly the same 20 pixels
and signed channel differences as the baseline.

**The experiment is complete; optimization pixel parity still FAILS.**
There is no successful repair here and no reason to relax the zero-error
oracle, enable the experimental preference by default or package it.

| Comparison | Full-image changed pixels | Changed channels |
| --- | --- | --- |
| Fresh OFF against saved OFF | 0 | 0 |
| Fresh ON against saved ON | 0 | 0 |
| Fresh baseline OFF to ON | 20 | 20 |
| Diagnostic OFF against fresh OFF | 0 | 0 |
| Diagnostic ON against fresh ON | 0 | 0 |
| Diagnostic OFF to ON | 20 | 20 |
| Same-process repeats, all four runs | 0 each | 0 each |

All nonzero residuals are on root screenshot row 339. Signed ON-minus-OFF
changes are twelve green +1, seven green -1 and one red -1; blue and alpha
are unchanged. The X positions are:

```text
59 62 64 239 330 405 526 539 542 545
549 551 557 575 580 585 590 593 597 600
```

Every other position in the full 1920 by 1080 image, including row 83 and
the adjacent rows 338 and 340, is equal. The entire signed residual files,
including input/output RGBA values, compare byte-for-byte equal across the
baseline and diagnostic pair, not merely by mismatch count.

## Recorded paths and controls

| Capture | Browser PID | NO_RECT_AA selections | Preferred / promoted | Operand records | Quads / draws / composites |
| --- | --- | --- | --- | --- | --- |
| baseline-off | 1036484 | 0 | 87 / 0 | 59 | 10 / 10 / 5 |
| baseline-on | 1037771 | 88 | 88 / 88 | 47 | 8 / 8 / 5 |
| diagnostic-off | 1039156 | 0 | 88 / 0 | 59 | 10 / 10 / 5 |
| diagnostic-on | 1040870 | 87 | 87 / 87 | 47 | 8 / 8 / 5 |

These are separate shader-selection, candidate/promotion and complete
operand-trace measurements. Their counts are not interchangeable.

Each run retained GL WebRender, GPU-process-unused, DPR 1, viewport 1280 by
972, X framebuffer 1920 by 1080 and background bounds `(4,4)-(1283,975)`.
Canvas readback was `6e5e9bdd`. The complete ordered traces passed the
unchanged strict parser; no truncated or suppressed trace was accepted.

Each owned parent PID/starttime/executable/disposable profile was checked.
The sidecar found Renderer-named threads and actual mapped libgallium
segments, checked their inode against the file, and required:

```text
libgallium-25.2.8-0ubuntu0.24.04.2.so
SHA256 e37486422ecafdad74fb05bbcdcfc35300241a5f46e72b63ca442d4e0c0cca8b
Build ID 6ccf17f6a28dda1c4c6e147c8d7503b974a501ba
```

Only the five approved environment keys were retained. All five were absent
in both fresh baselines. Both diagnostic processes had exactly
`LP_PERF=no_rast_linear`; `LP_DEBUG`, `GALLIVM_PERF`, `GALLIVM_DEBUG` and
`MESA_SHADER_CACHE_DISABLE` were absent. Historical LP_PERF/LP_DEBUG remain
unknown; these fresh records do not retrospectively prove their absence.

## Evidence

Evidence directory on wyatt-desktop:

```text
/home/wyatt/.cache/codex/l8ros/opacity-prototype-20260925/sampling-operands-validation/dispatch-lifecycle-v2/
```

`result.json` records the sequence and comparisons. Each of the four named
subdirectories retains raw profile, complete extracted markers, ordered
operands, process/driver/environment sidecar, graphics/snapshot data, original
and repeated screenshots, launcher outcome, cleanup record and before/after
identity logs. `baseline-pair`, `diagnostic-pair`, `across-off`, `across-on`,
and each run's `same-mode`/`repeat` files contain full-image AE, signed row
summaries and complete changed-pixel NDJSON. ImageMagick AE was independently
checked against decoded RGBA pixel counts.

Both signed pair files have SHA256:

```text
05a97e19faf2d88f580bb7ba008bfeccec06faa63fc6f21fda9f759b95eb1e3a
```

`capture-identities.sha256` freezes the helper/module/test, result/comparison
files, all four raw profiles, sidecars, ordered traces and screenshots.
Manifest SHA256:

```text
65747873b9bf31d7ad6cd4e55cec4827596ecd87028efafa24a7151820a23ad2
```

The reviewed helper remained at SHA256
`029fdf355bfbc0188ea73240f05d6d6b29f1791c41895adda8043dbf3e3f09f7`.
All 8,243 original identities and 16 additional inputs passed before and
after each capture. Original STOP evidence and original manifests remain
unchanged. The startup sentinel remained absent as required.

The helper stopped each owned profiler session. Independent post-capture
inspection found zero live members in the eight browser/utility groups;
`post-capture-cleanup.json` records those checks. Profiler CLI reported zero
running sessions. No extra browser, Xvfb or profiler run was started.

## Causal limits

This establishes no observed pixel sensitivity to the controlled flag change
for these exact saved binaries, source image, dimensions, display environment
and fixture. It does not prove that linear dispatch was previously unused:
different executed routes can produce identical pixels for these inputs.
There is no per-draw Mesa dispatch or sampler-branch observation in this test.

`no_rast_linear` affects linear bin dispatch, not earlier rectangle recognition
or coefficient setup. The result cannot establish pure triangle setup,
actual FMA contraction, interpolation coefficients, AOS/SOA selection or the
cause of the remaining one-channel differences. No Pi behavior or performance
conclusion follows from this x86 pixel experiment.

No additional measurement or browser repair is started by this checkpoint.
Further work requires another scoped review. No source/driver edit, build,
ARM/package/install, Pi action, default enable or push occurred.
