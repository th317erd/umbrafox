# Scaled Readback Residual Pixel Tests

## Result

One native laptop run completed all 40 tests: 33 passed, seven failed, none
skipped. All previous 32 tests still passed. Seven of the eight added composition
tests now reproduce exact-pixel mismatches without video decoding, remote IPC or
a page. This is a useful behavioral failing baseline, not acceptance of the
optimization or a demonstrated cause of YouTube stutter.

| New case | Differing channel components | Maximum channel delta |
| --- | ---: | ---: |
| 1080p to 320x180, accelerated, opaque | 0 | 0 |
| 1080p to 321x181, accelerated, opaque | 1685 | 1 |
| 1080p to 320x180, accelerated, half alpha | 28851 | 1 |
| 1080p to 320x180, software, opaque | 22710 | 1 |
| 1080p to 321x181, software, opaque | 159300 | 27 |
| 1080p to 320x180, software, half alpha | 11598 | 1 |
| 8x4 to 4x2, accelerated, half alpha | 2 | 1 |
| 8x4 to 4x2, software, opaque | 4 | 1 |

These are synthetic native-plane results, not measured magnitudes for the
previous real-video hash failures. No failure was converted to an expected-pass
exception and no pixel tolerance was introduced. The separate filter-repeat
failure remains open and is not covered by these native cases.

## Test And Execution

Only `dom/canvas/gtest/TestDMABufReadback.cpp` changed in native source. The
fixture creates deterministic nonconstant YUV planes. The reference reads RGB at
full source size, then scales and composites it into the destination. The
candidate reads destination-sized RGB, then composites it into an equal-size
destination. Both paths use the same explicit LINEAR filter, OP_OVER, alpha and
transparent clear. Accelerated snapshots assert WEBGL and no context loss;
software targets assert SKIA. Every read and output-size precondition passed.

The two-job idle `recurse_gtest` build completed in 17.25 seconds with zero
compiler warnings. The separate stripped test library is 358412760 bytes,
SHA256 `5e4f69baaf9aafa2f796e02dfb0bd72e3d00a8e482f9bfbc2c377ce5892e5bc9`.
Its native BuildID is 20261006111504. The older pinned test-loader package retains
BuildID 20261006052600; this combination is explicitly diagnostic-only, not a
new integrated browser package or an installation candidate.

Manifest SHA256:
`89e26fca308028edd8aeff4339137072e5b317817d1e5b5a1fa3e97b1858ab4f`.
All 47 other package files and 70 inherited harness files verified unchanged.
The runner differs only in namespace, phase, test inventory and manifest identity;
the existing 30-second work and 45-second total bounds remain intact.

Laptop root: `~/.cache/codex/readback-residual-residual-c96229e1-ec03-4248-8ac9-34c154ee09e9`.
Controller PID 1473627, native PID 1473639 and log-observed helper PID 1473641
were independently absent after completion. Exit 1 is the seven test failures,
not a crash or harness exception. Cleanup was clean; package postcheck verified
48 files. The 13117-byte log and three JSON files have independently verified
export hashes. Intel/Mesa Iris Xe (RPL-P) is recorded for every readback test.
The native runner reports headless mode despite the supplied X display; this is
real GL testing, not visible playback or physical scanout evidence.

Preparation errors are preserved: the initial strip used a logical build-log
path rather than the actual dist output; the first preflight looked for the
source harness manifest in the copied destination; an initial SFTP brace-list
copy was unsupported. The first final source check named `.mozconfig` instead of
the actual `mozconfig` file. Corrected bounded operations succeeded. No native
run was repeated and none of those errors changed test predicates.

Six offline checks pass, covering dependency/inventory rejection, exact exports
and cleanup, preservation of the seven failures, earlier regression results,
runner equivalence and source provenance. These passing evidence checks do not
convert the native suite into a pass. Native and documentation lint report zero
problems; diff-check is clean. The 54-input source guard finds only the intended
test change; production, HEAD, tracked working/index patches and configuration
match their saved inputs. The previous real-video evidence seal still verifies.

## Interpretation And Next Work

Ordinary accelerated scaling matches both the synthetic test and the preceding
real-video linear buffers. Exact equivalence fails with alpha, the odd video
ratio and software targets. Quantization order, coordinate precision and backend
resampling are leads, not yet separately established causes. In particular, the
27-level software odd-size delta rules out treating every mismatch as negligible
one-level noise. A correction must preserve the reference operation order or
retain its fallback for cases whose equivalence cannot be proved.

Keep these seven failing tests while tracing the narrow producer and consumer
differences before another production change. Then rerun native and integrated
real-video gates; speed measurements remain downstream of correctness. There is
no new CPU, frame-drop, YouTube, cross-driver or stock-Firefox parity claim.

No production readback code, defaults, desktop daily browser/profile/launcher,
installed package, Pi, Git index or commit changed. Evidence is under
`artifacts/umbralink-control/readback-residual/`. The broad performance goal stays
active; this phase establishes the residual failures rather than resolving them.
