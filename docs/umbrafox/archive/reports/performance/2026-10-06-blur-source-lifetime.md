# Blur Source Lifetime

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

Two isolated laptop captures completed the OFF-only source-lifetime matrix.
All sixteen output hashes, eight difference summaries and input hashes repeat
exactly between captures. This is diagnostic completion, not pixel-equivalence
acceptance or a performance result.

| Source | Default-context changed pixels | Explicit-readback changed pixels |
| --- | ---: | ---: |
| Shared canvas raster | 0 | 0 |
| Fresh canvas raster | 0 | 0 |
| Shared raw-RGBA VideoFrame | 0 | 0 |
| Fresh raw-RGBA VideoFrame | 11 | 0 |

The differing pair changes eleven components by one level: four red, four
green, three blue and no alpha. Its two output hashes are exactly the same as
the original video-blur pair, `6f8c8904...` and `122ac539...`. Full hashes are
in `artifacts/umbralink-control/blur-source/recomputed.json`.

Default targets report acceleration at both draw observations. Explicit
readback targets report no acceleration. These observations do not identify
the shader, texture allocation or native branch that executed.

## Controlled Inputs

One paused 1920x1080 video frame at 0.5 seconds is copied to an explicit-readback
canvas. Its 8294400 RGBA bytes are opaque and hash to
`3a9b9a5b84880ff8f78ee78b888f26e709ff1cbc1d6afe3883d0788255735c82`,
matching the prior raster control. New raster sources use `putImageData`;
raw VideoFrames use the RGBA buffer constructor, not the video constructor.
Raster reads and VideoFrame RGBA `copyTo` output are hash-checked before and
after every destination draw. Frame format, dimensions, allocation size,
offset and stride are checked explicitly.

Each pair uses two fresh 320x180 destinations with `blur(1px)`. A native
observation occurs after drawing and before reading destination pixels.
The source-identity schedule, five canvas sources, five VideoFrames, five
explicit frame closes and sixteen destinations are validated. Cleanup closes
frames and removes canvases; it does not prove immediate native destruction
or garbage collection. No full source or destination buffers are exported in
this experiment. Difference arithmetic and hashes are validated, but the
host does not independently recompute differences from raw pixel buffers.

The result falsifies a necessary dependence on advancing video playback or
video-decoder output differences for this particular pixel pattern. Identical
raw RGBA frame inputs can reproduce it. Source identity, backing allocation,
cache state, upload/filter intermediates and fixed case order remain possible
influences. It does not establish which is causal, nor connect these tiny
differences to the owner's intermittent stutter. A reordered shared/fresh
frame comparison or a narrow native observation is needed to distinguish them.

## Implementation And Tests

Plan: `docs/umbrafox/archive/plans/blur-source-lifetime.md`. New artifact siblings are
`blur-source.mjs`, `canvas-matrix.mjs`, `laptop-blur-source.mjs` and
`test/blur-source-spec.mjs`. The matrix helper uses trusted probe functions
with the existing transport, capture envelope, package admission, private-root
receipts, resource limits and cleanup. Previous sealed fixtures are unchanged.

Combined focused tests: 63 passed in 7.25 seconds. New coverage includes
source hashes and object lifetimes, emitted child execution, observation
order, seek/media/draw/read/copy failures, stale identity, invalid request
target/realm/timeout, malformed probe configuration, asynchronous validation
and validation rejection, raw preservation, abort, RPC and write failures.
Behavioral RED logs preserve two harness defects caught before runtime:
missing pre-dispatch target validation and saving an unawaited validator result.
Both now have passing regressions. No browser bug is inferred from those tests.

Only test/diagnostic code changed in this step. No native source, public API,
default preference, installed browser, desktop profile, Git index or committed
source changed. The GPU-import candidate remains OFF and uninstalled.

## Runtime And Cleanup

Candidate BuildID: `20261006023500`. Harness:
`~/.cache/codex/blur-source-harness-20261006-rLffAK` on `wyatt-laptop`.
Before each capture, 52 harness files and 46 package files passed hash checks;
resource and quiet-host preflight passed. Each fresh installation passed the
existing package checks again after browser cleanup.

- `ndbjOQ`: controller 1264550, browser 1264562; 14.163 seconds;
  35 exported files, 134054 bytes; five resource samples;
  peak sampled artifact size 63838359 bytes.
- `HheCeS`: controller 1266836, browser 1266848; 14.002 seconds;
  35 exported files, 134069 bytes; five resource samples;
  peak sampled artifact size 63838717 bytes.

Both roots use `~/.cache/codex/laptop-blur-source-20261006-`. Controllers exited
0. Both captures report clean SIGTERM, root absence, 271-byte logs and zero
drops. The exporters verified all 24 recorded controller/browser/child PIDs
absent. Native directory receipts join the owned app-data/local-app-data/temp
paths to the browser PID/build/document. These are post-startup observations,
not proof of no earlier access, zero networking or every transient helper.
Profiles and authentication tokens were not exported.

The 120-second capture, 15-second cleanup, 220-second controller and 240-second
SSH limits were unchanged. No active owned browser/controller/profiler/compiler
remains from this work. Original pixel failure, frame-2/ON comparisons,
import-failure/context-loss tests and moving performance acceptance remain
open. Evidence and source guards are recorded in `blur-source/verification.json`
and sealed by `artifacts/umbralink-control/blur-source-final.sha256`.
