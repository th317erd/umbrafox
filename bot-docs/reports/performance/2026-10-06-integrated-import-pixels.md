# Integrated V2 Pixel Gate Rejected

## Result

One fresh OFF capture of BuildID20261006095500 completed, but the integrated
pixel acceptance gate FAILED. Repeated `blur(1px)` draws of each paused video
frame produced different hashes. The ON browser was not launched. No balanced
performance comparison, default enablement or daily installation follows from
this phase. The original transport/capture `pass` status is preserved: it means
the bounded capture completed, not that pixel equivalence was accepted.

Every one of the48 outputs matches the older V2 OFF capture byte-for-byte at
the saved case-record level, including retained linear buffers and filter
hashes. This reproduces the prior V2 matrix pattern, rather than demonstrating
a new output regression from the native import-failure correction. It does not
identify the native cause or establish universal parity.

Compared with the full-size R2 OFF reference,22 of48 hashes differ: linear,
odd-size, smoothing-disabled, alpha and explicit-readback repeats, plus the
second filter draw at each time. The retained linear buffer differences are:

| Paused time | Changed pixels | Changed components | Max channel delta | Absolute error sum |
| --- | ---: | ---: | ---: | ---: |
| 0.5s | 3575 | 7860 | 94 | 45640 |
| 2s | 3157 | 7201 | 100 | 66314 |

Both linear repeats within this new run are identical. Raw filter buffers were
not retained by the existing collector, so the magnitude of those new filter
differences cannot be recomputed from this capture. The0.5s filter pair's hashes
match the earlier source-lifetime investigation exactly; its previous eleven
one-level component differences remain evidence from that earlier experiment,
not a new raw-buffer measurement here.

## Identity And Safety

Package: `exports/umbrafox-integrated-import-20261006/`, manifest SHA256
`e770fd478f4a2e469184b22d340bbe53387cd8f5190f44a5c45a67a3124b2dfb`.

- Host: wyatt-laptop, DISPLAY :0; no detected browser/build activity at admission.
- Harness: `~/.cache/codex/integrated-import-pixels-harness-20261006-bFq8s9`.
- Run: `~/.cache/codex/laptop-integrated-import-pixels-off-20261006-emWb7G`.
- Controller1409006, browser1409018, document10737418242.
- Capture10:16:06.201 through10:16:22.701 UTC,16.5 seconds.
- Export38 files,1387078 bytes; every exported size/hash verified.
- All12 recorded controller/browser/child PIDs absent at export.
- Clean owned SIGTERM; package postcheck passed;271 log bytes,0 dropped bytes.

The private package, profile, application-data, local-data and temporary roots
were unchanged from the reviewed harness contract. Native receipts join the
owned PID, build and data roots. These are post-startup observations, not proof
of no earlier access, zero networking or complete transient-process coverage.
No personal profile/token export, desktop browser, Pi action or profiler.
The ON preflight completed while the OFF offline gate was being inspected;
it did not launch a browser and was not followed by a capture.

## Harness And Verification

Four new siblings change only package identity and output namespace. The pixel
collector, native observations, fixture and cleanup are unchanged. Failing-first
admission tests retained two expected old-package rejections; AST checks then
proved the enumerated driver/support substitutions. The archive extractor is
also checked against its predecessor with only hashes, names and counts changed.

Initial preparation rejected one stale inherited helper before bundle creation.
Its existing request-timeout extension retains the15-second default used here.
The exact newer hash matches the already sealed callback/balanced runtime; the
other73 inherited files matched their old hashes. Four timeout regressions
passed before launch. The78-input harness bundle has SHA256
`4934e25271e50c6ed79cccdd38af6d7f516eb3bf5375cde9cb0e263552bac431`.
Remote extraction checked all archive hashes and exact entry counts; preflight
checked all78 inputs and46 package files. All deadlines/caps were unchanged.

Final focused verification:29 tests passed,0 skipped. Coverage includes strict
package/host/mode admission, unchanged runtime AST, pixel/observer/capture failure
handling, timeout bounds and replay of all38 saved exports. Replay verifies the
two failed repeat gates and22 reference differences; corrupted retained pixels
reject. These passing regression tests preserve a FAILED acceptance result.

The original strict `unpack.mjs` rejection remains in `off-1-unpack.log`. A
separate bounded, hash-verified evidence extraction retained the failure without
editing its inputs or relaxing that assertion. `failure-analysis.json` records
the phase failure separately from the original capture status. No retry or ON
comparison was used to replace the failed evidence.

## Source Boundary And Next Work

`CanvasRenderingContext2D::DrawImage` excludes filters and shadows from
`canUseRemoteVideoReadback`; those draws use the ordinary source route. The V2
helper therefore cannot directly explain the blur branch. Surrounding source
lifetime, cached surfaces, intermediate allocations or rounding may matter;
the earlier shared/fresh raw-VideoFrame experiment is relevant evidence, not
proof of a particular cause. The current GPUVideoImage caches one sized CPU
readback; whether that changes downstream allocation/cache behavior is unproved.

The next engineering work is to reconcile scaled readback with the historical
full-size output, and localize the filter repeat dependence, before another
performance comparison. Trace conversion/scaling order and source-surface cache
consumers; add a native or tightly isolated reproducer before changing them.
Do not silently remove correctness gates, enable the GPU path to hide an OFF
failure, or declare all fallback scaled. Native valid-reuse/context-loss/driver
failure and end-to-end translator recovery tests remain open independently.

No production source, public interface, default, staged index, commit, push or
daily installation changed. Evidence is under
`artifacts/umbralink-control/integrated-import-pixels/`. The performance goal
remains active; this is a reproducible correctness gate failure, not an external
blocker or a claim that the owner's intermittent video stutter is explained.
