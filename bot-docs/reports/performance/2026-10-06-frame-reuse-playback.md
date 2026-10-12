# Frame Reuse Playback Comparison

## Result

The fixed A1/B1/B2/A2 laptop comparison completes all four captures and passes
functional, identity, resource and cleanup checks. The candidate uses 3.496%
less elapsed-normalized joined-process CPU across the two runs, but FAILS the
unchanged regression screen: 28 of 29 criteria pass. B2 has seven callback gaps
over 50 ms in phase zero, above the larger baseline count of four. No run was
repeated, excluded or replaced; no threshold changed.

All sixteen phases report zero dropped video frames. All native after receipts
report zero decoder, sink, compositor and container drops. That does not negate
the long-callback-gap finding; these are distinct observations, not a physical
scanout measurement. Direct GPU import remains default OFF and uninstalled in
the owner's daily browser. This is not a YouTube-stutter fix or release acceptance.

## Measurements

Both variants use import ON and profiler OFF, the same 48-second owned 1080p H.264
fixture and 320x180 default canvas. Four 12-second phases draw 1/4/4/1 copies per
video callback without per-frame readback or new native instrumentation. The
unchanged collector uses ordinary page clocks. Zero-duration draws are below
recorded clock resolution, not free GPU operations.

| Measurement | A1 Baseline | B1 Reuse | B2 Reuse | A2 Baseline |
| --- | ---: | ---: | ---: | ---: |
| CPU window, seconds | 48.070 | 48.094 | 48.096 | 48.098 |
| Joined CPU, seconds | 27.754 | 26.574 | 26.853 | 27.596 |
| CPU seconds per elapsed second | 0.57737 | 0.55255 | 0.55832 | 0.57375 |
| Browser CPU, seconds | 20.185 | 18.627 | 18.906 | 19.803 |
| Content CPU, seconds | 5.427 | 5.695 | 5.670 | 5.600 |
| RDD CPU, seconds | 1.941 | 2.040 | 2.065 | 1.991 |
| Four-copy batch median, ms | 1 / 1 | 1 / 1 | 1 / 1 | 1 / 1 |
| Four-copy batch P95, ms | 2 / 2 | 2 / 2 | 2 / 2 | 2 / 2 |
| Gaps over 50 ms, phases 0-3 | 3 / 0 / 0 / 0 | 4 / 0 / 0 / 0 | 7 / 0 / 0 / 0 | 4 / 0 / 0 / 0 |
| Video drops, every phase | 0 | 0 | 0 | 0 |

The elapsed-weighted baseline CPU rate is 0.575559; candidate rate is 0.555435.
Within-variant maximum/minimum spread is 0.63% baseline and 1.05% candidate.
Two processes per variant, a fixed sequence, and no affinity/frequency/thermal
controls do not establish a statistical effect size. Joined CPU excludes
transient processes outside the stable process-identity intersection. Browser
CPU decreases while content and decoder CPU increase slightly; do not describe
this as uniform improvement across processes.

All 18 recorded long gaps are 51-55 ms, within the first 1.431 seconds of phase
zero. Adjacent measured draw batches take 0-2 ms. This does not place the whole
gap inside synchronous copying, but it also does not identify what ran or waited
between callbacks. Startup scheduling/presentation is a supported investigation
lead, not a demonstrated cache regression, GPU wait, driver fault or compositor
cause. Expected-display timestamps, callback delivery and physical display remain
different observations. No phase or startup interval is dropped from acceptance.

## Exact Comparison

A is the immediate pre-cache `umbrafox-render-pass-marker-20261006` package:
manifest 4c8085f0f675c5b183976807df38bb99474bbd8be2e58651b52e4be9176eee8e.
B is `umbrafox-import-frame-reuse-20261006`:
manifest 9ec305adc36c8c1e362ed6e74925c8c473efd999212d354c6f11431ca17b8678.
Both are normal 46-file Build20261006175655 packages; only libxul differs.
Neither is the native-test overlay. The earlier direct-import 26-29% CPU result
and renderer-label +6.05% concern use different comparisons and are not pooled
or declared resolved by this experiment.

The new 150-file harness, SHA256
b423aba4b44f0fa473c55e2efd3a0458746af58f2f3be3b21911ee445cf66853,
retains all 146 preceding runtime inputs. Four new adapters select the package
pair and artifact namespace. The collector, safety envelope, cleanup, public-only
export and 29 numeric criteria are unchanged. Tests prove exact driver/export/
evaluator equivalence and reject wrong manifests, hosts, displays and receipts.
Current 66 source pins, HEAD, staged patch and configuration remain unchanged.

The preceding native checkpoint has nine real hardware-GL cache tests and 44
adjacent regressions passing. The exact browser pixel/error matrices also passed
before this comparison. Those results do not prove cache hit frequency in this
playback or automatic translator recovery. This measurement adds complete-package
evidence, not either missing mechanism observation.

## Execution And Verification

Host: wyatt-laptop, Intel Iris Xe, Mesa 25.2.8, X11, WebRender. All eight canvas
boundary observations are accelerated; all four native decoder receipts identify
hardware-accelerated ffmpeg/RDD H.264. GPU-process status is unused, not a separate
GPU process that can be restarted to test this canvas context.

| Arm | Browser / Controller PID | Capture Milliseconds | Public Files |
| --- | --- | ---: | ---: |
| A1 | 1785648 / 1785615 | 60427 | 45 |
| B1 | 1788099 / 1788087 | 59795 | 44 |
| B2 | 1790615 / 1790583 | 59874 | 44 |
| A2 | 1793050 / 1793038 | 59876 | 44 |

Every arm uses fresh owned installation/profile/application/local/temp roots,
15-second settling and complete package/harness/resource preflight. The unchanged
limits remain 120-second capture, 15-second cleanup reserve, 220-second driver,
240-second SSH and 256 MiB sampled artifact cap. Fifty-six resource samples pass;
maximum sampled artifacts are 146019845 bytes. Public exports total 177 files,
1370232 bytes. No private profile, control token or app-data payload was exported.
These checks are not a whole-host or network sandbox claim.

All four cleanups use owned SIGTERM with zero log drops; logs are 271 bytes each
and preserve the sandbox EPERM warning plus VA-API initialization. All 49 recorded
PIDs are absent in the final independent receipt at 2026-10-07T02:30:16.176Z.
The first final-absence command omitted Node's stdin dash and failed before
executing the verifier. That failure is preserved; the corrected invocation
passed. It was not a browser retry or a missing-process result.

Thirteen offline test groups pass, including complete saved-result replay, all
exported hashes, exact CPU weighting and gap sets, prefix admission, corrupt
receipts and unchanged numeric rejection cases. The missing-module RED is
scaffolding, not a production defect. Final local source/harness and remote
package/harness checks pass. No product source, build, daily installation,
desktop browser, launcher, profile, Pi, staged index or prior evidence changed.

Evidence: `artifacts/umbralink-control/import-reuse-playback/`. The canonical
comparison keeps `regressionScreenPassed:false` and
`generalPerformanceAccepted:false`; the summary retains explicit unknown cache
frequency and automatic recovery fields.

## Next Action

Do not repeat this comparison merely to obtain a pass. Keep the failed startup
gap criterion. Measure actual recording/translation-batch reuse with a separate,
bounded private diagnostic, and localize the startup gaps before changing cache
lifetime or introducing synchronization. No new web-visible API, timer change,
default enablement or promotion follows from this result. The broad rendering,
layout, CSS and JavaScript performance goal remains active.
