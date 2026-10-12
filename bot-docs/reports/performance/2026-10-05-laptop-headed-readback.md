# Laptop Hardware-Backend Pixel Comparison

## Result

The original readback-cache candidate passes the existing exact-pixel comparator
against the pre-cache prototype on the same observed laptop graphics backend.
All 18 cases match: two distinct paused video frames, nine draw configurations
per frame, and 12 identical repeat hashes per case in each browser.

This advances beyond the previous software-only comparison and the incompatible
headed/software pair. It does not prove a cache hit, a specific image provider,
a speedup, sustained playback, or the cause of YouTube stuttering.

Both builds reported:

- Intel Iris Xe Graphics (RPL-P), vendor 0x8086, device 0xa7a0.
- Mesa/iris 25.2.8.0, X11/KWin, 2560x1600@60Hz, device-pixel ratio 1.
- WebRender compositor with hardware compositing available.
- Native `ffvpx video decoder (RDD remote)`, VP9, hardware-accelerated=true at
  both seek positions. Logs show successful VA-API iHD driver initialization.

These are observed diagnostics, not physical presentation or cache-route proof.
No acceleration override, profiler, automation flag, pixel tolerance adjustment,
new browser API or userland rule was used.

## Inputs And Runtime

Wyatt's standing authorization permits disposable laptop tests as needed.
The desktop work browser and all personal profiles/installations were untouched.
The fixed protocol was recorded before launch in
`bot-docs/plans/laptop-headed-readback.md`. The sequence was baseline, then
candidate, exactly once each. Each run had a fresh installation and private
profile, app-data, local-app-data and temporary roots.

| Field | Baseline | Candidate |
| --- | --- | --- |
| Package | October 1 prototype | October 3 original readback candidate |
| BuildID | 20261001103920 | 20261003071500 |
| libxul SHA256 prefix | 2a8eb56ca3d71650 | 82faf41661bd9223 |
| Browser PID | 1049978 | 1052235 |
| Controller PID | 1049966 | 1052223 |
| Capture duration | 12.348s | 12.145s |
| Peak sampled artifact bytes | 188249817 | 153877027 |
| Sampled headroom below 256 MiB | 80185639 | 114558429 |

The candidate is not the later inline-DOM candidate sharing its build ID.
Whole-package differences prohibit attributing timing differences to the cache.
All 46 regular files of each copied installation were verified before/after
execution. Both original archives matched their earlier export seals. The
package postchecks passed without updater-directory additions.

The media remains the existing 97,465-byte VP9 fixture, 320x240, SHA256
`10f28950d0eb80065e7547a8635c16bca7a11ecad207086fa58d6176d7fb5440`.
Positions 0.5s and 2s exercise different pixels. Cases include small linear CPU
copy, odd size, full size, crop, fractional destination, nearest, rotation,
alpha and default canvas. This is not the larger-media or repeated decoder
reuse stress gate. Coarse draw durations are retained, not promoted to timings.

## Safety And Verification

Both captures passed selected fixture/document joins, parent-native app-data,
local-app-data, `PathUtils.tempDir` and `TmpD` receipts, native/INI build joins,
profiler-off and page `webdriver === false` checks. Child temporary environment
values matched the harness-created private directory. Receipts remain
post-startup observations, not pre-consumer or all-process isolation proof.

Both ended with clean owned SIGTERM and zero dropped log bytes. Independent
checks found both controllers and all 22 sampled browser process identities
absent. This is not a census of transient helpers. Resource limits were unchanged:
105s work, 120s total, 15s cleanup, 256 MiB sampled run-artifact limit. Namespace
EPERM warnings remain in the logs; they were not suppressed. No installation,
native build, package mutation, source patch, staging or commit occurred.

The new scratch driver only composes existing capture and installation helpers.
Initial RED was a missing-module scaffold failure, not a browser defect.
The final focused selection passed 106 tests, including fixture, failed context,
late rejection, owned cleanup and installation-check failure paths. Prettier
and scoped whitespace checks pass. Shared source files were unchanged.

All 20 transferred harness files matched before and after execution. All 61
exported files were rehashed locally. Offline replay exactly reproduces the
saved strict context/pixel comparison; a changed compositor is rejected.
Profile, discovery-token and application-data contents were not exported.

## Evidence

- Local: `artifacts/umbralink-control/laptop-headed-readback/`.
- Package manifest SHA256:
  `cfaa37e8e4e71f9f562d049b766415ef40b9b09bc3b3edd56b8a0a349f554098`.
- Harness manifest SHA256:
  `bef3b98ce0ac31c3dfdd1d09e46937b81b9fb21752cf0cdafa01adf3d9957e63`.
- Export manifest SHA256:
  `8a9daed79228bcd03b626f734504b51bb6613dde98c751335698eeb72c9d2823`.
- Laptop inputs: `~/.cache/codex/laptop-headed-input-20261005-agyCHg`.
- Baseline root: `~/.cache/codex/laptop-headed-readback-baseline-20261005-omEESn`.
- Candidate root: `~/.cache/codex/laptop-headed-readback-candidate-20261005-pjUWdi`.

No test, capture or transfer handle remains active. The candidate is still
uninstalled. Next verify larger media, actual cache/readback routing and
same-frame versus per-new-frame work before making a performance claim. Longer
playback also needs a prospective headroom check: the earlier 60s headless run
left only 2.60 MiB beneath the cap. Do not discard that warning or relax the cap.
