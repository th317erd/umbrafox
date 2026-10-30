# Moving Video Copy Baseline

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

The first short 1080p moving-video baseline failed its prospective same-pixels
per-callback gate. The candidate was not run. This is an invalid workload
assumption to investigate, not an observed candidate regression or a playback
speedup result. The earlier paused-frame request reduction and exact-pixel
comparison remain separate accepted evidence.

## Observations

One fresh headed laptop browser used the frozen October 1 baseline package,
Build20261001103920. The local asset was 90s1080p30 H.264, SHA256
`aac5b2c571eff675332728d94291137bf184c41644d7beb6f8467fee05907d27`.
The collector completed four roughly two-second phases and paused the video.
Raw results were saved before the original validator rejected them.

| Phase | Copies per callback | Callbacks | Elapsed ms | Batches with differing pixels |
| --- | ---: | ---: | ---: | ---: |
| 0 | 1 | 49 | 2012 | 0 |
| 1 | 4 | 50 | 2019 | 8 |
| 2 | 4 | 50 | 2001 | 7 |
| 3 | 1 | 49 | 2003 | 0 |

There were 198 callbacks and 498 copies. Of 100 four-copy batches, 85 had equal
hashes and 15 did not. Final media time was7.966666s; the final quality counter
reported240 total frames and0 drops. These counters do not prove physical
scanout, uninterrupted playback, or coverage of every rendered frame. Reported
draw-call medians were2ms in each phase, with coarse page-clock resolution;
this is not a performance comparison. Pixel readback and hashing also impose
observer cost, despite the native profiler being off.

The paused pre-playback native receipt reported `hardwareAccelerated: true`,
codec `video/avc`, but decoder name `shutdown`. It therefore does not establish
the active decoder during the workload. Post-workload decoder/performance
requests were not issued because strict result validation failed first.

## Why The Equality Gate Is Unsafe

The frozen baseline source is base
`892431809a4caadb5c73b2c03ad9bdb124c3e21e` plus the exported tracked patch,
SHA256`a90f99694eb125830d490aba3d0558ed08e4372800fd47617a41834de0fc8588`.
The base alone is not the deployed source. The patch preserves the relevant
selection chain:

1. `CanvasRenderingContext2D::DrawImage` resolves the video surface separately
   for each invocation through `nsLayoutUtils::SurfaceFromElement`.
2. The video overload calls `HTMLMediaElement::GetCurrentImage`.
3. That method selects through `AutoLockImage::GetImage(TimeStamp::Now())`.
4. `GetOwningImage` advances to the queued image whose timestamp is appropriate
   for that particular time.

Thus an image can change across repeated draws within one callback; callback
metadata does not identify and retain the image used by every later draw. The
observed hash changes are consistent with this selection path, but exact image
serials were not captured, so no per-draw image attribution is claimed.
Frozen source excerpts and patch membership are saved in
`moving-copy/frozen-source-proof.json` and `frozen-image-selection.txt`.
The corresponding upstream [video image selection](https://searchfox.org/firefox-main/rev/00a4d527cdb9807ecb561c9fcf7d211e7e568ddf/dom/media/mediaelement/HTMLMediaElement.cpp#2533-2545)
and [timestamp selection](https://searchfox.org/firefox-main/rev/00a4d527cdb9807ecb561c9fcf7d211e7e568ddf/gfx/layers/ImageContainer.h#773-788)
were used for discovery, then checked against frozen source.

The callback proposal describes best-effort synchronization and permits missed
callbacks under main-thread load. It is not proof that a callback retains one
immutable image for all drawing operations. [Video frame callback proposal](https://wicg.github.io/video-rvfc/#introduction)

Do not change Firefox image-selection behavior to make this benchmark pass.
The readback cache is per immutable image, not per JavaScript callback.

## Safety And Evidence

-49 focused tests pass, including saved-failure replay and existing cleanup/
  installation regressions. Scoped formatting passes. These tests do not turn
  the failed native capture into an accepted moving-video benchmark.
- Capture19.760s, within120s total/105s work/15s cleanup.
- Before-work sampled artifact bytes153846272; headroom114589184, exceeding64MiB.
- Peak of five resource samples153866877B, below unchanged256MiB cap.
- Clean owned SIGTERM;271 log bytes,0 dropped bytes. EPERM namespace and
  successful VA-API initialization messages retained, not hidden.
- Browser1076771, controller1076753 and all11 sampled browser PIDs absent.
- Native parent private app/local/temp receipts and46-file installation
  postcheck pass. Only previously permitted empty updater directories appeared.
-34-file transferred harness unchanged, manifestSHA
  `2791f69a6bcbb05814944d37bc6210fe3cbaeb4ef6549dede28b8e1f0d7cd569`.
-29 exported files205939B individually verified; no profile/token/shared data
  exported. Original failed reports and hashes are unchanged.
- Remote run: `/home/wyatt/.cache/codex/laptop-moving-copy-baseline-20261005-0oFMak`.
- Remote harness: `/home/wyatt/.cache/codex/moving-copy-harness-20261005-kX1eL0`.
- Local evidence: `artifacts/umbralink-control/moving-copy/`.

## Next Measurement

Keep this run failed under its original contract; do not rerun it unchanged or
retroactively relax its validator. Define a new prospective observation contract
that keeps every copy/hash and reports within-callback transitions separately
from immutable-frame pixel parity. Collect post-workload diagnostic replies
before final result classification, while retaining identity/deadline guards.
Use the existing paused-frame gate for exact same-image correctness. A future
moving pilot may compare total work and video counters descriptively, but must
not infer actual cache hits or exact image reuse from callback counts/hashes.

The next baseline and candidate require this corrected, tested contract first.
No further runtime, engine build, installation or desktop browser action occurred.
