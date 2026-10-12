# Descriptor Borrow Playback Comparison

## Decision

The candidate passes all 29 unchanged regression-screen criteria, but this
experiment does not demonstrate a performance improvement. Elapsed-normalized
joined-process CPU is 0.334% higher for the candidate; four-copy draw medians
and P95 are unchanged. That small difference is not a demonstrated regression
either: there are only two processes per variant, and candidate CPU-rate spread
is 0.839%. Do not promote fewer descriptor copies into a playback-speed claim.

All sixteen phases report zero dropped video frames. All final native decoder,
sink, compositor and container drop counters are zero. Startup callback pauses
remain in both variants. Neither this passing screen nor the zero-drop counts
erase earlier failed comparisons or prove rare-stall elimination. GPU import
remains default OFF and the candidate remains uninstalled in the daily browser.

## Measurements

Fixed order A1/B1/B2/A2, import ON in both variants and profiler OFF. The unchanged
owned 1920x1080 H.264 fixture runs for 48 seconds, drawing to a 320x180 default
canvas with 1/4/4/1 copies per callback across four 12-second phases. No per-frame
readback, new marker, GPU wait or added observer. Normal page clocks retain their
precision limits; draw-call wall time is not GPU-completion time.

| Measurement | A1 Baseline | B1 Borrow | B2 Borrow | A2 Baseline |
| --- | ---: | ---: | ---: | ---: |
| CPU window, seconds | 48.126 | 48.092 | 48.092 | 48.100 |
| Joined CPU, seconds | 27.024 | 26.964 | 27.190 | 26.974 |
| CPU seconds / elapsed second | 0.561526 | 0.560677 | 0.565383 | 0.560782 |
| Browser CPU, seconds | 19.228 | 19.117 | 19.299 | 19.168 |
| RDD CPU, seconds | 1.992 | 2.031 | 2.036 | 2.003 |
| Content CPU, seconds | 5.584 | 5.601 | 5.629 | 5.595 |
| Four-copy medians, ms | 1 / 1 | 1 / 1 | 1 / 1 | 1 / 1 |
| Four-copy P95, ms | 2 / 2 | 2 / 2 | 2 / 2 | 2 / 2 |
| Callback gaps over 50 ms, phases 0-3 | 4 / 0 / 0 / 0 | 3 / 0 / 0 / 0 | 4 / 0 / 0 / 0 | 3 / 0 / 0 / 0 |
| Reported video drops, all phases | 0 | 0 | 0 | 0 |

Elapsed-weighted CPU rates are 0.561154 baseline and 0.563030 candidate. The
baseline maximum/minimum spread is 0.133%. There is no affinity, frequency or
thermal-control claim, confidence interval or extrapolation to other workloads.
CPU totals exclude transient processes outside the stable identity intersection.

All fourteen recorded long gaps occur in phase zero, within the first 1.485
seconds. They are 51-68 ms; preceding/current draw batches are 0-1 ms. This does
not place the entire delay inside synchronous canvas copying. It also does not
identify what ran or waited between callbacks. Existing scrollbar/catch-up and
compositor findings remain separate leads, not a demonstrated cause here.

## Identity And Execution

A is the immediate frame-reuse package:
exports/umbrafox-import-frame-reuse-20261006, manifest
9ec305adc36c8c1e362ed6e74925c8c473efd999212d354c6f11431ca17b8678.
B is exports/umbrafox-descriptor-borrow-20261006, manifest
1de58db614be934fb7fe71fc46ea168ce9777a8b46e340d3f429090b4e3e6773.
Both are normal 46-file Build20261006175655 packages; only libxul differs.
The native-test overlay is not used. The package pair's native/pixel/decoder-loss
gates passed before this measurement; see
[correctness evidence](2026-10-06-descriptor-borrow-gpu.md).

The 150-file harness preserves all 146 prior runtime inputs. Four adapters change
only namespace and package selection. Harness SHA256:
956aaf3488a37ad603ff8228265177858970bf220bd85caa0dabb15a392fc003.
Tests prove exact driver, exporter, evaluator and summarizer equivalence. All
29 numerical criteria are unchanged. The protocol was added to the active
descriptor-borrow plan before A1. No run was repeated, excluded, pooled with
older data or replaced to improve the result.

Host is wyatt-laptop, Intel Iris Xe RPL-P, Mesa/iris 25.2.8, X11 and WebRender.
All canvas boundary observations are accelerated; all final native decoder
receipts identify hardware-accelerated ffmpeg/RDD H.264. Boundaries do not identify
each draw's path or cache hit. The absence of a separate GPU process does not
prove graphics-context recovery.

| Arm | Browser / Controller PID | Capture ms | Public Files |
| --- | --- | ---: | ---: |
| A1 | 1875430 / 1875417 | 59911 | 44 |
| B1 | 1879071 / 1879059 | 59835 | 44 |
| B2 | 1882161 / 1882149 | 59880 | 44 |
| A2 | 1885182 / 1885170 | 59897 | 44 |

Each run uses fresh private installation/profile/application/local/temp roots,
15-second settling and per-arm idle/resource/package/harness admission. Existing
120-second capture, 105-second work, 15-second cleanup and 220/240-second
driver/SSH bounds remain. Each saved prefix passed admission before the next run.
The work browser, daily installation, personal profiles and Pi were untouched.

## Verification And Limits

All 176 public export files, totaling 1,369,014 bytes, are independently rehashed.
Fifty-six resource samples satisfy original absolute and baseline-relative caps;
peak sampled artifacts are 145,339,235 bytes. All four cleanups use owned SIGTERM,
with zero dropped log bytes. Each 271-byte browser log retains the sandbox EPERM
warning and successful VA-API initialization. All 49 recorded PIDs are absent
in the independent receipt at 2026-10-07T06:24:37.673Z. These are sampled-process
and post-startup-root observations, not continuous host or network isolation.
No profile, control token or application-data payload was exported.

Ten focused test groups pass: actual full/prefix replay, exact CPU weighting and
gap sets, graphics/decoder joins, package/host/display rejection, malformed and
foreign receipt rejection, cleanup and unchanged numeric failure predicates.
Initial missing-module failures are scaffolding, not a reproduced product bug.
Generated/executed wrappers retain their exact bytes. There were no product
source, build, default, index, commit or install changes during this comparison.
The 67 source pins and previous sealed evidence remain unchanged.

Evidence is artifacts/umbralink-control/descriptor-borrow-playback/. The result
keeps regressionScreenPassed=true and generalPerformanceAccepted=false. Actual
playback borrow/cache-hit frequency and automatic recovery are still unproved.

## Next Action

Do not repeat this benchmark merely to obtain a favorable CPU result. The small
descriptor change has passed bounded correctness/regression checks, not a benefit
gate. Keep its eight-byte descriptor-storage tradeoff and lack of measured gain
visible. Prioritize the remaining callback/compositor scheduling work and actual
hot-path frequency before adding more descriptor/cache complexity. The original
rendering/layout/CSS/JavaScript performance objective remains active.
