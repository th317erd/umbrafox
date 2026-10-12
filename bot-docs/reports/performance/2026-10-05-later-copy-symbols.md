# Later Video-Copy Costs

## Result

The two saved profiles distinguish first-use shader work from later pixel
readback. None of the nine later copies with readback IPC has an observed
mesa_compile_shader, create_builtins or iris_schedule_compile frame. Several
instead sample buffer synchronization beneath the pixel-readback path.

This changes the next action: do not treat first-use shader setup as the cause
of recurring playback stutter. The immediate opportunity to characterize is
when the existing accelerated canvas path avoids CPU readback, versus the
explicit software-canvas path used here. No engine fix is claimed this turn.

No browser, build, installation, owner profile, launcher or staged source changed.
The readback-cache candidate remains uninstalled. Earlier captures and failures
are preserved, including the two failed public-symbol downloads.

## Saved Windows

All scopes are individual drawImage calls in the first six video callbacks.
The previous exact document/PID/TID/UserTiming/four-IPC-endpoint joins reproduce.
The worker is independently selected for each request. Counts below are receiver
thread samples within the content-side scope, not exact execution time. Some
include worker activity after the handler has finished but before the page resumes.

| Build / copy index | Draw scope, ms | Receiver samples | Readback-handler samples | Mesa buffer-wait samples |
| --- | ---: | ---: | ---: | ---: |
| Baseline0 | 36.666 | 36 | 33 | 0 |
| Baseline1 | 5.422 | 4 | 2 | 1 |
| Baseline2 | 1.820 | 1 | 1 | 1 |
| Baseline3 | 5.239 | 4 | 1 | 1 |
| Baseline4 | 1.585 | 2 | 1 | 0 |
| Baseline5 | 2.100 | 2 | 1 | 0 |
| Candidate0 | 21.674 | 22 | 22 | 1 |
| Candidate1 | 0.071 | not assigned | not assigned | not assigned |
| Candidate2 | 2.531 | 2 | 2 | 1 |
| Candidate3 | 2.686 | 2 | 2 | 1 |
| Candidate4 | 2.248 | 2 | 2 | 1 |
| Candidate5 | 1.482 | 1 | 1 | 1 |

Candidate1 has no readback IPC in the complete joined export. No receiver was
assigned and no receiver sample query was made for it. This is not a direct
native cache-hit receipt. First-copy compiler/built-in counts reproduce the
[prior Mesa pass](2026-10-05-mesa-symbols.md) exactly. All later self samples
resolve to named functions; complete unfiltered function lists reconcile.

Zero observed compiler frames in these short sampled windows does not prove
that no compilation can ever recur. There are only13/7 later receiver samples,
over approximately0.2seconds of playback per recording. The two profiler-on,
whole-package captures are not a causal speedup comparison or a real YouTube
stutter diagnosis. The earlier repeat-copy ABBA result remains separate.

## Source Interpretation

Matched Mesa symbols include iris_bo_wait_rendering, iris_bo_wait_syncobj and
ioctl beneath readback. Upstream Mesa25.2.8
[buffer-manager source](https://gitlab.freedesktop.org/mesa/mesa/-/blob/mesa-25.2.8/src/gallium/drivers/iris/iris_bufmgr.c)
maps that route to buffer dependencies and DRM_SYNCOBJ_WAIT. This differs from
the first-use compiler-queue ready fence. Actual buffer IDs, dependency owners,
GPU timing and the exact Ubuntu source patch set were not established; do not
remove synchronization on this evidence.

The frozen collector explicitly asks for a110x75 canvas with
willReadFrequently:true and calls getImageData after each timed draw for hashes.
Packaged base892431809a4caadb5c73b2c03ad9bdb124c3e21e uses that attribute in
CanvasRenderingContext2D::UseSoftwareRendering; TryAcceleratedTarget rejects
that case. Both frozen package CanvasRenderingContext2D patch blocks are
identical and leave those methods unchanged. Package patch SHA256 values match
the prior provenance. Searchfox discovery is preserved, but the frozen base
plus patches is authoritative. No interpretation of a dirty current objdir.

This is intentional readback stress, not proof that normal canvases take the
same path. The earlier [headed pixel comparison](2026-10-05-laptop-headed-readback.md)
included a default-canvas case on two paused frames; that established pixels,
not sustained moving default-canvas routing or performance. Respect the
application's willReadFrequently choice; do not silently override it.

## Verification And Cleanup

Plan: bot-docs/plans/later-copy-symbols.md.
Evidence: artifacts/umbralink-control/later-copy/.
New contract tests initially3PASS/2FAIL against first-window-only behavior, then
5PASS. First offline load failed a new filters:null expectation: actual CLI
thread-samples omits that field. The failed export/cleanup and first-attempt
source are retained. A real-export regression failed before accepting only
omitted/null sample filters; function filters must still be exactly empty.
No clock/count/identity/bounds relaxation. Corrected loads use new -v2 roots.

Final47focused tests PASS, including wrong clocks/scopes/workers, zero-sample
schema, corrupt/missing/duplicate counts and all11 sampled saved windows.
Four-file format checks pass. Recompute re-establishes joins/counts, current
exact-PID/socket absence and repeats byte-for-byte. No raw-profile custom parser;
only supported profiler-cli/Samply with explicit local matched symbol dirs.
No new native or whole-repository tests were run.

The479-file seal artifacts/umbralink-control/later-copy-final.sha256 independently
verifies, SHA256 `43790c2377e4584c02c75f8486a08ce1e78ed28b574cb45f0bcc96eee5abbaee`.
Separate test source SHA256
`f1c3b58a3f2738ab171df40f83edf1057eaf9ac3ab1d57d48177834f393efe5b`.
Evidence is frozen; future changes use new siblings.

Three owned offline sessions ended cleanly: failedbaseline954675/954739,
baseline-v2 956663/956688, candidate-v2 957593/957618 (server/daemon).
Observed lifetimes6.761/11.656/10.119s. All exact PIDs and named sockets absent.
The prior150s work/180s server watchdog/210s outer bounds,8GiB/256MiB/two-worker
limits,private cache and loopback-only configured symbol endpoints remain.
No SIGKILL or unrelated-session operation. This is not a universal I/O/network
containment guarantee. Searchfox0.18.0 still advertises0.20.4; no update performed.

## Next Gate

Before another native patch, compare normal moving canvas drawing against the
software/readback case using the existing sealed builds and isolated laptop
harness. Separate display-only timing from pixel-readback validation, so
getImageData does not force the very transfer being investigated. Require
positive backend/route evidence where the existing diagnostics expose it;
otherwise label that boundary unknown, not accelerated by assumption.

Use ordinary defaults, not global graphics overrides, and keep Firefox-visible
semantics unchanged. Public video/frame timing cannot be relaxed to make a
candidate pass. No extra allocation, eager compilation or synchronization
change is justified merely by these short profiles.
